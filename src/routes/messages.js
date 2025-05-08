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
      console.log(`Received message with media:`, JSON.stringify(Media));

      // Parse the Media array if it's a string
      let parsedMedia;
      try {
        parsedMedia = typeof Media === "string" ? JSON.parse(Media) : Media;
      } catch (err) {
        console.error("Error parsing Media string:", err);
        parsedMedia = [];
      }

      if (parsedMedia.length > 0 && parsedMedia[0].Sid) {
        const mediaSid = parsedMedia[0].Sid;
        const contentType = parsedMedia[0].ContentType || "image/jpeg";
        const filename = parsedMedia[0].Filename || `image-${Date.now()}.jpg`;

        console.log(
          `Processing media with SID: ${mediaSid}, type: ${contentType}, filename: ${filename}`
        );

        try {
          // Get the media content using the Twilio service
          const mediaContent = await twilioService.getMediaContent(
            mediaSid,
            ConversationSid
          );

          // Create directory if it doesn't exist
          const uploadDir = path.join(__dirname, "../../uploads");
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }

          // Generate unique filename based on the original name
          const fileExt = filename.split(".").pop().toLowerCase() || "jpg";
          const uniqueSuffix =
            Date.now() + "-" + Math.round(Math.random() * 1e9);
          const newFilename = `${uniqueSuffix}.${fileExt}`;
          const filepath = path.join(uploadDir, newFilename);

          console.log(`Downloading media from URL: ${mediaContent.url}`);

          // Download the image with the auth details from getMediaContent
          const response = await axios({
            method: "get",
            url: mediaContent.url,
            responseType: "arraybuffer",
            auth: mediaContent.auth,
            validateStatus: function (status) {
              return status >= 200 && status < 300;
            },
          });

          // Verify we have image data
          if (!response.data || response.data.length === 0) {
            throw new Error("Received empty image data from Twilio");
          }

          // Check the response content type and log it
          console.log(
            `Received image with content type: ${
              response.headers["content-type"] || contentType
            }`
          );

          // Save the file
          fs.writeFileSync(filepath, Buffer.from(response.data));
          console.log(
            `Image saved to ${filepath} (${fs.statSync(filepath).size} bytes)`
          );

          // Verify saved file
          if (!fs.existsSync(filepath) || fs.statSync(filepath).size === 0) {
            throw new Error(
              `Failed to save image file or file is empty: ${filepath}`
            );
          }

          // Create public URL for stored image
          const baseUrl =
            process.env.BASE_URL ||
            `http://localhost:${process.env.PORT || 3000}`;
          imageUrl = `${baseUrl}/uploads/${newFilename}`;

          // Check the file to confirm it's a valid image
          try {
            // Read a small chunk to verify it's an image file
            const header = fs.readFileSync(filepath, { length: 12 });

            // Check for valid image signatures
            const isJPEG =
              header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
            const isPNG =
              header[0] === 0x89 &&
              header[1] === 0x50 &&
              header[2] === 0x4e &&
              header[3] === 0x47;
            const isGIF =
              header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46;

            if (!isJPEG && !isPNG && !isGIF) {
              console.warn(
                "The file doesn't have a standard image signature. Will attempt processing anyway."
              );
            } else {
              console.log(
                `Verified image format: ${
                  isJPEG ? "JPEG" : isPNG ? "PNG" : isGIF ? "GIF" : "Unknown"
                }`
              );
            }
          } catch (err) {
            console.warn("Error checking image signature:", err);
          }

          // Convert image to base64 for OpenAI API with correct MIME type
          const imageBuffer = fs.readFileSync(filepath);
          const base64Image = imageBuffer.toString("base64");

          // Make sure we're using the correct content type
          let finalContentType = contentType;
          if (!finalContentType.includes("/")) {
            // If content type doesn't have a slash, it's probably invalid
            // Determine content type from file extension
            if (fileExt === "jpg" || fileExt === "jpeg") {
              finalContentType = "image/jpeg";
            } else if (fileExt === "png") {
              finalContentType = "image/png";
            } else if (fileExt === "gif") {
              finalContentType = "image/gif";
            } else if (fileExt === "webp") {
              finalContentType = "image/webp";
            } else {
              // Default to JPEG
              finalContentType = "image/jpeg";
            }
          }

          const base64Url = `data:${finalContentType};base64,${base64Image}`;
          console.log(
            `Prepared base64 image with type ${finalContentType}, length: ${base64Image.length} chars`
          );

          // Save the incoming message with image
          const incomingMessage = new Message({
            user: user._id,
            content: Body || "Image message",
            imageUrl,
            isFromUser: true,
          });

          await incomingMessage.save();

          // Pass image to OpenAI using base64 encoding
          aiResponse = await openaiService.getCompletion(
            {
              text: Body || "What's in this image?",
              imageUrl: base64Url,
            },
            user._id
          );
        } catch (err) {
          console.error("Error processing image:", err);
          aiResponse =
            "I'm sorry, I couldn't process the image you sent. Could you try sending it again?";
        }
      } else {
        console.error(
          "Media object missing SID. Full Media object:",
          JSON.stringify(Media)
        );
        aiResponse =
          "I couldn't process the image. Please try sending it again.";
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

// Get all messages for the current user (for the frontend interface)
router.get("/", async (req, res) => {
  try {
    // In a real app, we'd get the user from the session or auth token
    // For this example, we'll get the most recent user
    const user = await User.findOne().sort({ lastInteraction: -1 });

    if (!user) {
      return res.status(404).json({ message: "No users found" });
    }

    // Get messages for this user
    let messages = [];

    // Find messages by user ID instead of conversationSid
    messages = await Message.find({ user: user._id })
      .sort({ timestamp: 1 })
      .limit(100);

    // Format messages for the frontend
    messages = messages.map((msg) => ({
      id: msg._id,
      content: msg.content,
      from: msg.isFromUser ? "user" : "assistant",
      timestamp: msg.timestamp,
    }));

    return res.json({
      messages,
      phoneNumber: user.phoneNumber,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
