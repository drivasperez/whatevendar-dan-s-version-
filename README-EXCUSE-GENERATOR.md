# Excuse Generator with Claude AI

This feature uses Next.js serverless functions to generate creative excuses using Claude AI.

## Setup Instructions

1. Create a `.env.local` file in the root directory of your project
2. Add your Anthropic API key to the file:
   ```
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```
3. To get an API key, visit the [Anthropic Console](https://console.anthropic.com/) and create an account if you don't have one already

## How It Works

- The application includes a serverless API endpoint at `/api/generate-excuse`
- This endpoint securely calls the Claude AI API to generate creative excuses
- A user-friendly interface is available at `/excuse-generator`

## Usage

1. Start the development server with `npm run dev`
2. Visit `http://localhost:3000/excuse-generator` in your browser
3. Enter what you need an excuse for (e.g., "being late to work")
4. Click "Generate Excuse" to get a creative, AI-generated excuse

## API Details

You can also call the API directly:

```javascript
const response = await fetch('/api/generate-excuse', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ 
    context: 'missing a deadline' 
  }),
});

const data = await response.json();
console.log(data.excuse); // The generated excuse
```

## Security Notes

- Your Anthropic API key is stored only in your `.env.local` file and is not exposed to the client
- The API endpoint includes proper error handling and input validation 