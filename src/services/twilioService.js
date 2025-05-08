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
    const conversation = await client.conversations.v1.conversations.create({
      friendlyName: friendlyName || "AI Assistant Conversation",
    });

    console.log(`Conversation created with SID: ${conversation.sid}`);
    return conversation;
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw new Error("Failed to create conversation");
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
    const participant = await client.conversations.v1
      .conversations(conversationSid)
      .participants.create({
        "messagingBinding.address": phoneNumber,
        "messagingBinding.proxyAddress": process.env.TWILIO_PHONE_NUMBER,
      });

    console.log(`Participant added with SID: ${participant.sid}`);
    return participant;
  } catch (error) {
    console.error("Error adding participant:", error);
    throw new Error("Failed to add participant");
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
        author: "AI Assistant",
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
        author: "AI Assistant",
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
};
