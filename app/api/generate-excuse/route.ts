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
4. Contain tech-related references when appropriate
5. Subtly clever - avoiding anything too obvious or cheesy

If the context mentions specifics about the event (like duration, description, or type), weave those details into your excuse to make it perfectly tailored to that exact situation.

And here are some example excuses to give you a sense of the vibe:
- "My keyboard achieved sentience and decided to unionize right in the middle of our standups."
- "My flat's wifi is being throttled by the collective judgment of all my unfinished side projects."
- "I tried updating my calendar but accidentally deployed it to production and caused a minor incident."
- "I was busy explaining to my nan that no, turning the router off and on again won't fix her arthritis."

Just provide the excuse directly without any introductory text or explanation. Make it dry, witty, and very British.`
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