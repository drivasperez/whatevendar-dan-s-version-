import { NextResponse } from 'next/server';
import { getAuthUrl, getTokens, fetchCalendarEvents, updateEventDeck } from '@/lib/google-calendar';
import { google } from 'googleapis';

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CALENDAR_CLIENT_ID,
  process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
  process.env.GOOGLE_CALENDAR_REDIRECT_URI
);

export async function GET() {
  try {
    // Generate the authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.readonly'],
      prompt: 'consent', // Force to get refresh token
    });

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    // If no code is provided, return the auth URL
    const authUrl = getAuthUrl();
    return NextResponse.json({ authUrl });
  }

  try {
    // Exchange the code for tokens
    await getTokens(code);

    // Fetch calendar events
    const events = await fetchCalendarEvents();
    
    // Update the event deck
    updateEventDeck(events);

    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error('Error in calendar route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
} 