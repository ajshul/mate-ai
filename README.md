# Mate AI

A modern application that allows users to chat with OpenAI's Chat API via messaging services. Users sign up through a sleek React-based web interface by providing their phone number, and then they can chat with the AI through their messaging app. The app also supports voice calls using OpenAI's Realtime API.

## Features

- Modern React-based web signup interface with improved phone number input
- Automatic welcome message
- Integration with OpenAI's Chat API (including GPT-4 Vision)
- Image recognition and analysis exclusively through SMS/messaging
- Persistent conversation history
- Rich interactive messages using Twilio Conversations API
- Natural conversational responses without default legal messages (STOP/HELP suppression)
- SMS-only interface after signup (no need to use the web app)
- Voice call capabilities with OpenAI's Realtime API and Twilio Voice
- Tab-based interface for switching between text messaging and voice calls
- Customizable UI with theme variables for easy branding
- Automated webhook configuration for development environments

## Tech Stack

- Node.js & Express for the backend
- MongoDB for data storage
- React with styled-components for the frontend
- Twilio Conversations API for rich messaging integration
- Twilio Voice API for voice calls
- OpenAI API for AI chat, image recognition, and voice conversations
- Webpack for frontend bundling

## Prerequisites

- Node.js (v16+)
- MongoDB (v6.0+)
- Twilio account with Conversations API and Voice capabilities
- OpenAI API key with access to vision models and Realtime API
- ngrok for exposing your local server to the internet (for webhooks and voice calls)

### Setting Up MongoDB

1. **Install MongoDB Community Edition**:
   ```bash
   # For macOS with Homebrew:
   brew tap mongodb/brew
   brew install mongodb-community@6.0
   ```

2. **Start MongoDB**:
   ```bash
   # Run MongoDB as a service (starts automatically on login)
   brew services start mongodb-community@6.0
   
   # Or run it directly for this session only
   mongod --dbpath ~/data/db
   ```

3. **Verify MongoDB is running**:
   ```bash
   # Check if MongoDB service is running
   brew services list | grep mongo
   ```

   The output should show `mongodb-community` as `started`.

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/mate-ai.git
cd mate-ai
```

### 2. Install Dependencies

Run the unified setup command to install all dependencies:

```bash
npm run setup
```

This will:

- Install dependencies for the main application
- Install dependencies for the voice call server
- Run a setup check to verify your environment

### 3. Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Server Configuration
PORT=3000
MONGODB_URI=mongodb://localhost:27017/mate-ai

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here

# Twilio Conversations Configuration
TWILIO_WELCOME_TEMPLATE_SID=your_welcome_template_sid_here
TWILIO_CONVERSATION_SERVICE_SID=your_conversation_service_sid_here

# Voice Configuration
VOICE_ASSISTANT_NAME="Mate AI"
VOICE_MODEL="alloy"  # Options: alloy, echo, shimmer, etc.
VOICE_ASSISTANT_PROMPT="You are a helpful AI assistant from Mate AI. Be conversational and helpful."

# Voice Call Server Configuration
VOICE_CALL_PORT=8081

# URLs (updated when using ngrok)
BASE_URL=http://localhost:3000
WEBHOOK_URL=http://localhost:3000/api/messages/webhook
VOICE_CALL_PUBLIC_URL=http://localhost:8081
```

### 4. Configure ngrok (Required for Production/Testing)

1. Install ngrok: https://ngrok.com/download

2. Our automated setup will create an ngrok.yml file in the default location:

   - Mac/Linux: `~/Library/Application Support/ngrok/ngrok.yml`
   - Windows: `%APPDATA%\ngrok\ngrok.yml`

3. The configuration will include:

```yaml
version: "2"
tunnels:
  voice:
    proto: http
    addr: 8081
  text:
    proto: http
    addr: 3000
```

### 5. Running the Application

#### Development

For local development, you can use the following commands:

```bash
# Run all components (main server, client and voice server)
npm run dev:full

# Run all components + ngrok for webhooks and external access
npm run dev:full:ngrok

# Automated setup - sets up MongoDB, ngrok, and all components with guided prompts
npm run dev:full:auto
```

#### Automated Development Setup

The `dev:full:auto` command provides an interactive setup that will:

1. Check if MongoDB is running and prompt to start it if needed
2. Check if ngrok is already running and handle any conflicts
3. Start ngrok with proper tunnels for voice and text
4. Update all Twilio webhook URLs and environment variables
5. Start all application components (main server, client, and voice server)

This is the recommended way to start the application as it ensures all dependencies
are properly configured before starting the main application.

This script will:

- Start ngrok tunnels for both text and voice services
- Automatically update your `.env` file with the new URLs
- Configure all Twilio webhooks (Voice, SMS, and Conversations)

#### Development with ngrok (Recommended)

1. Start ngrok in a separate terminal window with our helper script:

```bash
npm run ngrok
```

This script will:

- Start ngrok tunnels for both text and voice services
- Automatically update your `.env` file with the new URLs
- Configure all Twilio webhooks (Voice, SMS, and Conversations)

2. Start all servers in another terminal:

```bash
npm run dev:full
```

This starts:

- Main Express server (port 3000)
- React frontend (port 8080)
- Voice call server (port 8081)

#### Production

1. Build the application:

```bash
npm run build:all
```

2. Start the application:

```bash
npm start
```

## Setting Up Twilio

### For Text Messaging

1. Set up a Twilio phone number with SMS capabilities
2. For development, the webhook is automatically configured when running `npm run ngrok`
3. For production, configure the webhook URL in your Twilio Console:
   - Go to Phone Numbers > Manage > Active Numbers
   - Select your phone number
   - Under "Messaging", set the webhook to: `https://your-domain.com/api/messages/webhook`

### For Voice Calls

1. Make sure your Twilio phone number has Voice capabilities
2. For development, the webhook is automatically configured when running `npm run ngrok`
3. For production, configure the voice webhook in your Twilio Console:
   - Go to Phone Numbers > Manage > Active Numbers
   - Select your phone number
   - Under "Voice & Fax" > "A CALL COMES IN", set to "Webhook"
   - Set the webhook URL to: `https://your-domain.com/twiml`

### For Twilio Conversations

1. Create a Conversations Service in your Twilio Console
2. Add your TWILIO_CONVERSATION_SERVICE_SID to your .env file
3. For development, the webhook is automatically configured when running `npm run ngrok`
4. For production, set the webhook in Conversations > Services > [Your Service] > Configuration

## Customizing the UI

The application uses CSS variables for easy theming. To update the color scheme:

1. Modify the variables in `client/src/styles/global.css`:

```css
:root {
  --primary: #8a70ff; /* Main brand color */
  --primary-light: #f0edff;
  --primary-dark: #7c5be6;
  --secondary: #3b82f6;
  --secondary-light: #dbeafe;
  --secondary-dark: #2563eb;
  --gradient-start: #9966ff; /* For gradients */
  --gradient-end: #3b82f6;
  /* ... other variables ... */
}
```

2. Update your logo and favicon by replacing:
   - `client/public/icon.png`

## Using the Application

1. Start the application and open it in your browser
2. Sign up with your phone number
3. You'll receive a welcome text message
4. Use the SMS interface to:
   - Send text messages to chat with the AI
   - Send images for analysis
5. To use voice calls:
   - Navigate to the "Voice Calls" tab in the web interface
   - Complete the setup if prompted
   - Call your Twilio phone number to talk with the AI

## Troubleshooting

### General Issues

- **Missing environment variables**: Check that all required variables are in your `.env` file
- **API key issues**: Verify your OpenAI and Twilio API keys are valid

### MongoDB Issues

- **MongoDB connection failures**: If you see errors like `MongooseServerSelectionError: connect ECONNREFUSED` or `MongooseError: Operation 'users.findOne()' buffering timed out`, check that MongoDB is running:
  ```bash
  # Check MongoDB service status
  brew services list | grep mongo
  
  # If not running, start it with:
  brew services start mongodb-community@6.0
  
  # Or run directly without service:
  mongod --dbpath ~/data/db
  ```

- **MongoDB version conflicts**: Ensure you're using MongoDB 6.0+

- **Database permissions**: If you see authentication errors, ensure your MongoDB instance doesn't require authentication or update your connection string in `.env` accordingly

### Voice Call Issues

- **WebSocket connection errors**: Check that your ngrok URLs are correct in `.env`
- **Twilio not forwarding calls**: Verify the voice webhook URL in your Twilio Console
- **ngrok session limit**: On the free plan, you can only run one agent at a time. Use `npm run ngrok` to properly start all required tunnels

### Webhook Issues

- **Webhooks not updating**: Make sure your TWILIO_CONVERSATION_SERVICE_SID is set in your .env file
- **Manual webhook updates**: If automatic configuration fails, set webhooks manually in the Twilio Console

## Project Structure

```
├── client/                # React frontend
│   ├── public/            # Public assets
│   │   └── index.html     # HTML template
│   └── src/               # React source code
│       ├── components/    # React components
│       │   └── voice-call/# Voice call components
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
│   │   ├── messages.js
│   │   └── voiceCall.js   # Voice call API routes
│   ├── services/          # Business logic
│   │   ├── twilioService.js
│   │   └── openaiService.js
│   └── voice-call-server/ # Voice call WebSocket server
│       └── src/           # Server source code
├── uploads/               # Uploaded image files
├── public/                # Compiled frontend
│   └── dist/              # Webpack output
├── scripts/               # Utility scripts
├── .env                   # Environment variables
├── package.json
└── README.md
```

## Recent Updates

- Added automated Twilio webhook configuration for all services (Voice, SMS, Conversations)
- Updated UI with customizable theme variables
- Improved frontend with responsive design and better user experience
- Added proper asset handling in webpack configuration
- Enhanced logo and favicon implementation

## License

MIT

## Acknowledgments

- [OpenAI Realtime API with Twilio Quickstart](https://github.com/openai/openai-realtime-twilio-demo) - This project's voice assistant functionality was inspired by and built with reference to OpenAI's official demo for combining OpenAI's Realtime API with Twilio's phone calling capability.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
