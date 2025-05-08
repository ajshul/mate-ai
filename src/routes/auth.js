const express = require("express");
const router = express.Router();
const User = require("../models/User");
const twilioService = require("../services/twilioService");
const openaiService = require("../services/openaiService");

// Register a new user
router.post("/register", async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Format phone number (ensure it has +1 for US numbers)
    let formattedNumber = phoneNumber;
    if (!phoneNumber.startsWith("+")) {
      formattedNumber = "+1" + phoneNumber.replace(/\D/g, "");
    }

    // Check if user already exists
    let user = await User.findOne({ phoneNumber: formattedNumber });

    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create a conversation for this user
    const conversation = await twilioService.createConversation(
      `Conversation for ${formattedNumber}`
    );

    // Create new user with conversation SID
    user = new User({
      phoneNumber: formattedNumber,
      conversationSid: conversation.sid,
    });

    await user.save();

    // Add user as a participant to the conversation
    await twilioService.addParticipant(conversation.sid, formattedNumber);

    // Send welcome message via Twilio Conversations
    const welcomeMessage =
      "Hi there! I'm your AI assistant. You can ask me anything. How can I help you today?";
    await twilioService.sendMessage(
      formattedNumber,
      welcomeMessage,
      conversation.sid
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
