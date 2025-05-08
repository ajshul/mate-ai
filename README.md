# Mate AI

A simple application that allows users to chat with OpenAI's Chat API via messaging services. Users sign up through a minimalist web interface by providing their phone number, and then they can chat with the AI through their messaging app.

## Features

- Simple web signup with just a phone number
- Automatic welcome message
- Integration with OpenAI's Chat API
- Persistent conversation history
- Rich interactive messages using Twilio Conversations API

## Tech Stack

- Node.js & Express for the backend
- MongoDB for data storage
- Twilio Conversations API for rich messaging integration
- OpenAI API for AI chat capabilities
- Vanilla JavaScript, HTML, and CSS for the frontend

## Prerequisites

- Node.js (v14+)
- MongoDB
- Twilio account with Conversations API enabled
- OpenAI API key

## Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/imessage-ai.git
   cd imessage-ai
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables (copy from env.sample):

   ```
   # Server Configuration
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/imessage-ai

   # OpenAI API Configuration
   OPENAI_API_KEY=your_openai_api_key_here

   # Twilio Configuration
   TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
   TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
   TWILIO_PHONE_NUMBER=your_twilio_phone_number_here

   # Twilio Conversations Configuration
   TWILIO_WELCOME_TEMPLATE_SID=your_welcome_template_sid_here
   ```

4. Start the server:

   ```
   npm start
   ```

5. For development (with auto-reload):
   ```
   npm run dev
   ```

## Setting Up Twilio Conversations API

To enable rich messaging with Twilio Conversations API:

1. Create a Twilio account if you don't already have one
2. Enable the Conversations API in your Twilio Console
3. Set up webhook endpoints for your Conversations API
4. Create content templates using the Content Template Builder

### Setting Up the Webhook

Set up a webhook in your Twilio Conversations Service that points to your server's `/api/messages/webhook` endpoint. You can use a service like ngrok during development to expose your local server to the internet.

### Creating Content Templates

Use the Content Template Builder to create interactive message templates:

1. Go to [Twilio Content API](https://content.twilio.com/v1/Content) or use the API
2. Create templates with various content types (text, quick-reply, list-picker, etc.)
3. Use these templates in your application by referencing their Content SIDs

## Testing Rich Messages

After setup, you can test sending rich messages using the `/api/messages/rich-message` endpoint:

```
POST /api/messages/rich-message
{
  "phoneNumber": "+1234567890",
  "contentSid": "HXXXXXXXXXXXXXXXXX",
  "variables": {
    "1": "John"
  }
}
```

## Project Structure

```
├── src/
│   ├── index.js           # Main server file
│   ├── models/            # Database models
│   │   ├── User.js
│   │   └── Message.js
│   ├── routes/            # API routes
│   │   ├── auth.js
│   │   └── messages.js
│   └── services/          # Business logic
│       ├── twilioService.js
│       └── openaiService.js
├── public/                # Frontend files
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── .env                   # Environment variables
├── env.sample             # Sample environment variables
├── package.json
└── README.md
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
