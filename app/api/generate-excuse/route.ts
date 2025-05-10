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
1. Sarcastic while maintaining a hint of plausibility
2. Short and punchy (1-3 sentences maximum)
3. Tailored specifically to the context (reference the event details like duration and description when available)
4. Unexpected and original - avoid clichés at all costs
5. Memorable enough to make people laugh out loud — a crowd of Brits to be specific, so the bar is high
6. Include a touch of drama or absurdity

If the context mentions specifics about the event (like duration, description, or type), weave those details into your excuse to make it perfectly tailored to that exact situation.

Here are some example excuse starters to inspire your tone:
- "Sorry, I can't make it because"
- "Unfortunately, I won't be able to attend as"
- "This is totally legitimate and not made up, but"
- "Hold onto your hat, because"
- "In a plot twist nobody saw coming,"
- "The universe is conspiring against me because"
- "Brace yourself for this excuse, but"
- "Let me paint you a picture of my current situation:"

And here are some example silly excuses to give you a sense of the vibe:
- "my pet goldfish is having an existential crisis"
- "Mercury is in retrograde and my aura simply can't handle any meetings today"
- "I've been cast as an extra in a documentary about people who avoid responsibilities"
- "I've temporarily transcended the mortal plane and can't interact with human affairs"
- "I've been kidnapped by my own procrastination and the ransom is 'doing absolutely nothing today'"

Just provide the excuse directly without any introductory text or explanation. Make it sarcastic and funny.`
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