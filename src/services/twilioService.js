const twilio = require("twilio");

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Create a conversation
 * @returns {Promise} Conversation object
 */
async function createConversation(friendlyName) {
  try {
    // Skip configuring service for now as it doesn't work properly
    // await configureConversationService();

    const conversation = await client.conversations.v1.conversations.create({
      friendlyName: friendlyName || "Mate AI Conversation",
    });

    console.log(`Conversation created with SID: ${conversation.sid}`);
    return conversation;
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw new Error("Failed to create conversation");
  }
}

/**
 * Configure conversation service to disable default messages
 * Note: This is not working correctly with the API version and needs to be fixed
 */
async function configureConversationService() {
  try {
    // Get the default conversation service - skip for now
    // This functionality is not working properly with the current API version
    return null;
  } catch (error) {
    console.error("Error configuring conversation service:", error);
    return null;
  }
}

/**
 * Add a participant to a conversation
 * @param {string} conversationSid - The conversation SID
 * @param {string} phoneNumber - The phone number to add
 * @returns {Promise} Participant object
 */
async function addParticipant(conversationSid, phoneNumber) {
  try {
    // Add attributes to customize messaging behavior
    const attributes = JSON.stringify({
      custom_message_behavior: {
        suppress_stop_help_message: true, // Suppress STOP/HELP messages
      },
    });

    // Check if participant already exists by listing the participants
    const participants = await client.conversations.v1
      .conversations(conversationSid)
      .participants.list();

    const existingParticipant = participants.find(
      (p) => p.messagingBinding && p.messagingBinding.address === phoneNumber
    );

    if (existingParticipant) {
      console.log(
        `Participant already exists with SID: ${existingParticipant.sid}`
      );
      return existingParticipant;
    }

    const participant = await client.conversations.v1
      .conversations(conversationSid)
      .participants.create({
        "messagingBinding.address": phoneNumber,
        "messagingBinding.proxyAddress": process.env.TWILIO_PHONE_NUMBER,
        attributes: attributes,
      });

    console.log(`Participant added with SID: ${participant.sid}`);
    return participant;
  } catch (error) {
    console.error("Error adding participant:", error);
    // This is not a critical error, so we don't need to throw
    return null;
  }
}

/**
 * Reset a user's conversation by deleting the old one and creating a new one
 * @param {object} user - The user object with phoneNumber
 * @returns {Promise<string>} - The new conversation SID
 */
async function resetConversation(user) {
  try {
    // If there's an existing conversation, delete it
    if (user.conversationSid) {
      try {
        await client.conversations.v1
          .conversations(user.conversationSid)
          .remove();
        console.log(`Deleted old conversation: ${user.conversationSid}`);
      } catch (err) {
        console.error(`Could not delete conversation: ${err.message}`);
        // Continue anyway
      }
    }

    // Create a new conversation
    const conversation = await createConversation(
      `Conversation for ${user.phoneNumber}`
    );

    // Add the user as a participant
    await addParticipant(conversation.sid, user.phoneNumber);

    // Send welcome message
    const welcomeMessage =
      "Welcome back! Your conversation has been reset. How can I help you today?";
    await sendMessage(user.phoneNumber, welcomeMessage, conversation.sid);

    return conversation.sid;
  } catch (error) {
    console.error("Error resetting conversation:", error);
    throw new Error("Failed to reset conversation");
  }
}

/**
 * Send a rich message via Twilio Conversations API
 * @param {string} to - Recipient phone number
 * @param {string} body - Message content
 * @param {string} conversationSid - Optional conversation SID
 * @returns {Promise}
 */
async function sendMessage(to, body, conversationSid = null) {
  try {
    let convoSid = conversationSid;

    // If no conversation exists, create one and add the participant
    if (!convoSid) {
      const conversation = await createConversation(`Conversation with ${to}`);
      convoSid = conversation.sid;
      await addParticipant(convoSid, to);
    }

    // Send the message to the conversation
    const message = await client.conversations.v1
      .conversations(convoSid)
      .messages.create({
        body: body,
        author: "Mate AI",
      });

    console.log(`Message sent with SID: ${message.sid}`);
    return message;
  } catch (error) {
    console.error("Twilio error:", error);
    throw new Error("Failed to send message");
  }
}

/**
 * Send a rich content message via Twilio Conversations API
 * @param {string} to - Recipient phone number
 * @param {string} conversationSid - Conversation SID
 * @param {string} contentSid - Content template SID
 * @param {object} variables - Variables for the content template
 * @returns {Promise}
 */
async function sendRichMessage(
  to,
  conversationSid,
  contentSid,
  variables = {}
) {
  try {
    let convoSid = conversationSid;

    // If no conversation exists, create one and add the participant
    if (!convoSid) {
      const conversation = await createConversation(`Conversation with ${to}`);
      convoSid = conversation.sid;
      await addParticipant(convoSid, to);
    }

    // Send rich content message to the conversation
    const message = await client.conversations.v1
      .conversations(convoSid)
      .messages.create({
        contentSid: contentSid,
        contentVariables: JSON.stringify(variables),
        author: "Mate AI",
      });

    console.log(`Rich message sent with SID: ${message.sid}`);
    return message;
  } catch (error) {
    console.error("Twilio error:", error);
    throw new Error("Failed to send rich message");
  }
}

/**
 * Create a TwiML response
 * @param {string} message - Message to include in the response
 * @returns {Object} - TwiML response object
 */
function createTwimlResponse(message) {
  const MessagingResponse = twilio.twiml.MessagingResponse;
  const twiml = new MessagingResponse();
  twiml.message(message);
  return twiml;
}

module.exports = {
  sendMessage,
  sendRichMessage,
  createConversation,
  addParticipant,
  createTwimlResponse,
  configureConversationService,
  resetConversation,
};
