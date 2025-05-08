# Mate AI

A modern application that allows users to chat with OpenAI's Chat API via messaging services. Users sign up through a sleek React-based web interface by providing their phone number, and then they can chat with the AI through their messaging app.

## Features

- Modern React-based web signup interface with improved phone number input
- Automatic welcome message
- Integration with OpenAI's Chat API (including GPT-4 Vision)
- Image recognition and analysis exclusively through SMS/messaging
- Persistent conversation history
- Rich interactive messages using Twilio Conversations API
- Natural conversational responses without default legal messages (STOP/HELP suppression)
- SMS-only interface after signup (no need to use the web app)
- New SVG favicon for a modern look

## Tech Stack

- Node.js & Express for the backend
- MongoDB for data storage
- React with styled-components for the frontend
- Twilio Conversations API for rich messaging integration
- OpenAI API for AI chat and image recognition capabilities
- Webpack for frontend bundling

## Prerequisites

- Node.js (v14+)
- MongoDB
- Twilio account with Conversations API enabled
- OpenAI API key with access to vision models

## Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/mate-ai.git
   cd mate-ai
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables (copy from env.sample):

   ```
   # Server Configuration
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/mate-ai

   # OpenAI API Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4-vision-preview

   # Twilio Configuration
   TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
   TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
   TWILIO_PHONE_NUMBER=your_twilio_phone_number_here

   # Twilio Conversations Configuration
   TWILIO_WELCOME_TEMPLATE_SID=your_welcome_template_sid_here

   # Base URL for images and webhooks (in production, set to your domain)
   BASE_URL=http://localhost:3000
   WEBHOOK_URL=https://your-domain.com/api/messages/webhook
   ```

4. Build the React frontend:

   ```
   npm run build
   ```

5. Start the server:

   ```
   npm start
   ```

6. For development (with auto-reload for both frontend and backend):
   ```
   npm run dev:full
   ```

## Setting Up Twilio Conversations API

To enable rich messaging with Twilio Conversations API:

1. Create a Twilio account if you don't already have one
2. Enable the Conversations API in your Twilio Console
3. Set up webhook endpoints for your Conversations API
4. Create content templates using the Content Template Builder

### Setting Up the Webhook

Set up a webhook in your Twilio Conversations Service that points to your server's `/api/messages/webhook` endpoint. You can use a service like ngrok during development to expose your local server to the internet.

The application automatically configures your Twilio Conversations Service to suppress the default legal messages about "STOP" and "HELP" commands.

### Creating Content Templates

Use the Content Template Builder to create interactive message templates:

1. Go to [Twilio Content API](https://content.twilio.com/v1/Content) or use the API
2. Create templates with various content types (text, quick-reply, list-picker, etc.)
3. Use these templates in your application by referencing their Content SIDs

## Image Support

The application supports receiving and analyzing images:

1. Users can send images through their messaging app
2. The AI analyzes the images using OpenAI's vision capabilities
3. The AI responds with a description or answer about the image content

Note: Image uploads are handled exclusively through messaging apps, not through the website.

## User Experience Flow

1. Users sign up with their phone number on the web interface
2. They immediately receive a welcome message on their phone
3. From that point, all interaction happens through their messaging app:
   - Send text messages to get AI responses
   - Send images to get visual analysis
   - No need to return to the website
   - Improved handling of 404 errors during signup

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
├── client/                # React frontend
│   ├── public/            # Public assets
│   │   └── index.html     # HTML template
│   └── src/               # React source code
│       ├── components/    # React components
│       ├── styles/        # Stylesheets
│       ├── App.js         # Main App component
│       └── index.js       # Entry point
├── src/                   # Backend files
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
├── uploads/               # Uploaded image files
├── public/                # Compiled frontend
│   └── dist/              # Webpack output
├── .env                   # Environment variables
├── env.sample             # Sample environment variables
├── webpack.config.js      # Webpack configuration
├── package.json
└── README.md
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
