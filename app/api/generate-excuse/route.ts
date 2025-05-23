import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Get API key from environment variable
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured' },
        { status: 500 }
      );
    }

    // Get request parameters
    const { context } = await req.json();
    
    // Call Claude API using the latest API version
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: `Generate a deadpan, sarcastic, and hilarious excuse for ${context || 'why I am late'}. 

The excuse should be:
1. Dry, self-deprecating
2. Short, punchy (1 sentence maximum, no more than 20 words) and pithy
3. Tailored specifically to the context (reference the event details like duration and description when available)
4. Subtly clever - avoiding anything too obvious or cheesy

If the context mentions specifics about the event (like duration, description, or type), weave those details into your excuse to make it perfectly tailored to that exact situation.

Just provide the excuse directly without any introductory text or explanation..`
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Claude API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    // Extract the excuse from Claude's response
    // Claude's API returns response in a content array with text property
    return NextResponse.json({
      excuse: data.content[0].text
    });
  } catch (error) {
    console.error('Error generating excuse:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 