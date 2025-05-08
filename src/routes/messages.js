const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Message = require("../models/Message");
const twilioService = require("../services/twilioService");
const openaiService = require("../services/openaiService");
const path = require("path");
const fs = require("fs");
const axios = require("axios");

// Handle incoming messages from Twilio Conversations webhook
router.post("/webhook", async (req, res) => {
  try {
    // For Conversations API webhook, the payload structure is different
    const { Author, Body, ConversationSid, MessageSid, Media, Attributes } =
      req.body;

    if (!ConversationSid) {
      return res.status(400).json({ message: "Invalid request" });
    }

    // Parse attributes if present
    let messageAttributes = {};
    try {
      if (Attributes) {
        messageAttributes = JSON.parse(Attributes);
      }
    } catch (err) {
      console.error("Error parsing message attributes:", err);
    }

    // Skip messages authored by our system - multiple checks for robustness
    if (
      Author === "AI Assistant" ||
      Author === "Mate AI" ||
      Author === undefined ||
      (messageAttributes && messageAttributes.isSystemMessage === true)
    ) {
      return res.status(200).send("OK");
    }

    console.log(
      `Received message from conversation: ${ConversationSid}, Author: ${
        Author || "Unknown"
      }`
    );

    // Find user by conversation SID
    let user = await User.findOne({ conversationSid: ConversationSid });

    // If user not found by conversation SID, try to get the phone number from the webhook
    // and search for the user by phone number
    if (!user && Author) {
      const phoneNumber = Author;
      user = await User.findOne({ phoneNumber });

      // If we found the user by phone number, update their conversationSid
      if (user) {
        console.log(
          `Found user by phone number: ${phoneNumber}, updating conversation SID from ${user.conversationSid} to ${ConversationSid}`
        );
        user.conversationSid = ConversationSid;
        await user.save();
      }
    }

    // If still no user found, log and respond
    if (!user) {
      console.log(
        `Message received from unknown conversation: ${ConversationSid}`
      );
      return res.status(404).send("User not found");
    }

    // Update user's last interaction time
    user.lastInteraction = new Date();
    await user.save();

    let aiResponse;
    let imageUrl = null;

    // Check if message has media (image)
    if (Media && Media.length > 0) {
      // Get the media URL from Twilio
      const mediaUrl = Media[0].Url;

      // Create directory if it doesn't exist
      const uploadDir = path.join(__dirname, "../../uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      try {
        // Download the image
        const response = await axios({
          method: "get",
          url: mediaUrl,
          responseType: "stream",
          auth: {
            username: process.env.TWILIO_ACCOUNT_SID,
            password: process.env.TWILIO_AUTH_TOKEN,
          },
        });

        // Generate unique filename
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const filename = uniqueSuffix + ".jpg"; // Default to jpg
        const filepath = path.join(uploadDir, filename);

        // Save the file
        const writer = fs.createWriteStream(filepath);
        response.data.pipe(writer);

        // Wait for the file to be written
        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });

        // Create public URL for stored image
        const baseUrl =
          process.env.BASE_URL ||
          `http://localhost:${process.env.PORT || 3000}`;
        imageUrl = `${baseUrl}/uploads/${filename}`;

        // Save the incoming message with image
        const incomingMessage = new Message({
          user: user._id,
          content: Body || "Image message",
          imageUrl,
          isFromUser: true,
        });

        await incomingMessage.save();

        // Pass image to OpenAI
        aiResponse = await openaiService.getCompletion(
          {
            text: Body || "What's in this image?",
            imageUrl,
          },
          user._id
        );
      } catch (err) {
        console.error("Error processing image:", err);
        aiResponse =
          "I'm sorry, I couldn't process the image you sent. Could you try sending it again?";
      }
    } else if (Body) {
      // Regular text message
      const incomingMessage = new Message({
        user: user._id,
        content: Body,
        isFromUser: true,
      });

      await incomingMessage.save();

      // Get response from OpenAI for text
      aiResponse = await openaiService.getCompletion(Body, user._id);
    } else {
      return res.status(400).json({ message: "No content in message" });
    }

    // Save the AI response
    const responseMessage = new Message({
      user: user._id,
      content: aiResponse,
      isFromUser: false,
    });

    await responseMessage.save();

    // Send the response back via Twilio Conversations
    await twilioService.sendMessage(
      user.phoneNumber,
      aiResponse,
      ConversationSid
    );

    // Respond to the webhook
    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Send a rich content message (for testing)
router.post("/rich-message", async (req, res) => {
  try {
    const { phoneNumber, contentSid, variables } = req.body;

    if (!phoneNumber || !contentSid) {
      return res
        .status(400)
        .json({ message: "Phone number and content SID are required" });
    }

    // Find user by phone number
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Send rich content message
    await twilioService.sendRichMessage(
      phoneNumber,
      user.conversationSid,
      contentSid,
      variables || {}
    );

    res.status(200).json({ message: "Rich content message sent successfully" });
  } catch (error) {
    console.error("Error sending rich message:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
