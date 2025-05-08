const express = require("express");
const router = express.Router();
const User = require("../models/User");
const twilioService = require("../services/twilioService");
const openaiService = require("../services/openaiService");
const Message = require("../models/Message");

/**
 * User registration/signup
 * POST /api/auth/signup
 */
router.post("/signup", async (req, res) => {
  try {
    const { phoneNumber, resetConversation } = req.body;

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

    // If user already exists
    if (user) {
      // If resetConversation flag is set, reset the conversation
      if (resetConversation) {
        try {
          console.log(`Resetting conversation for user: ${formattedNumber}`);

          // Reset the conversation
          const newConversationSid = await twilioService.resetConversation(
            user
          );

          // Delete old messages
          await Message.deleteMany({ user: user._id });

          // Update the user record with the new conversation SID
          user.conversationSid = newConversationSid;
          user.lastInteraction = new Date();
          await user.save();

          console.log(
            `Conversation reset successful. New SID: ${newConversationSid}`
          );

          return res.status(200).json({
            message: "Conversation reset successfully",
            isReset: true,
          });
        } catch (error) {
          console.error("Error resetting conversation:", error);
          return res
            .status(500)
            .json({ message: "Failed to reset conversation" });
        }
      }

      // Otherwise, inform the user they've already signed up
      return res.status(200).json({
        message:
          "You've already signed up. Would you like to reset your conversation?",
        userExists: true,
      });
    }

    // New user signup flow
    try {
      // Create a conversation for this user
      const conversation = await twilioService.createConversation(
        `Conversation for ${formattedNumber}`
      );

      // Create new user with conversation SID
      user = new User({
        phoneNumber: formattedNumber,
        conversationSid: conversation.sid,
        lastInteraction: new Date(),
      });

      await user.save();

      // Add user as a participant to the conversation
      await twilioService.addParticipant(conversation.sid, formattedNumber);

      // Send welcome message via Twilio Conversations
      const welcomeMessage =
        "Hi there! I'm your AI assistant, Mate! You can ask me anything. How can I help you today?";
      await twilioService.sendMessage(
        formattedNumber,
        welcomeMessage,
        conversation.sid
      );

      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      console.error("Error during new user signup:", error);
      res.status(500).json({ message: "Server error during signup" });
    }
  } catch (error) {
    console.error("General registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
