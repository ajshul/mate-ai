const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Message = require("../models/Message");
const twilioService = require("../services/twilioService");
const openaiService = require("../services/openaiService");

// Handle incoming messages from Twilio Conversations webhook
router.post("/webhook", async (req, res) => {
  try {
    // For Conversations API webhook, the payload structure is different
    const { Author, Body, ConversationSid, MessageSid } = req.body;

    if (!ConversationSid || !Body) {
      return res.status(400).json({ message: "Invalid request" });
    }

    // Skip messages authored by our system
    if (Author === "AI Assistant") {
      return res.status(200).send("OK");
    }

    // Find user by conversation SID
    const user = await User.findOne({ conversationSid: ConversationSid });

    if (!user) {
      console.log(
        `Message received from unknown conversation: ${ConversationSid}`
      );
      return res.status(404).send("User not found");
    }

    // Save the incoming message
    const incomingMessage = new Message({
      user: user._id,
      content: Body,
      isFromUser: true,
    });

    await incomingMessage.save();

    // Update user's last interaction time
    user.lastInteraction = new Date();
    await user.save();

    // Get response from OpenAI
    const aiResponse = await openaiService.getCompletion(Body, user._id);

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
