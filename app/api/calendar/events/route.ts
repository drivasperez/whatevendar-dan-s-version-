import { NextResponse } from 'next/server';
import { google, calendar_v3 } from 'googleapis';
import type { CalendarEvent } from '@/types/events';
import { cookies } from 'next/headers';

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CALENDAR_CLIENT_ID,
  process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
  process.env.GOOGLE_CALENDAR_REDIRECT_URI
);

// Store events in memory (server-side)
let eventDeck: CalendarEvent[] = [];
let currentEventIndex = 0;

function formatGoogleEvent(event: calendar_v3.Schema$Event): CalendarEvent {
  if (!event.id || !event.summary || !event.start?.dateTime || !event.end?.dateTime) {
    throw new Error('Invalid event data');
  }

  return {
    id: event.id,
    title: event.summary,
    description: event.description || '',
    startTime: new Date(event.start.dateTime).toISOString(),
    endTime: new Date(event.end.dateTime).toISOString(),
    location: event.location || '',
    type: event.eventType || 'Event',
  };
}

export async function GET() {
  try {
    // Get tokens from cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const refreshToken = cookieStore.get('refresh_token')?.value;

    if (!accessToken || !refreshToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Set credentials
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    // Set up token refresh handler
    oauth2Client.on('tokens', async (tokens) => {
      if (tokens.access_token) {
        // Update access token in cookie
        cookieStore.set('access_token', tokens.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 3600, // 1 hour
        });
      }
    });

    // Initialize Google Calendar API with the authenticated client
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Calculate date range (this week and next week)
    const now = new Date();
    const twoWeeksFromNow = new Date(now);
    twoWeeksFromNow.setDate(now.getDate() + 14);

    const response = await calendar.events.list({
      calendarId: 'primary', // Use primary calendar
      timeMin: now.toISOString(),
      timeMax: twoWeeksFromNow.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    eventDeck = events.map(formatGoogleEvent);
    currentEventIndex = 0;

    return NextResponse.json({ events: eventDeck });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { action } = await request.json();

    if (action === 'next') {
      if (currentEventIndex < eventDeck.length - 1) {
        currentEventIndex++;
      }
      return NextResponse.json({ currentEvent: eventDeck[currentEventIndex] });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error handling calendar action:', error);
    return NextResponse.json({ error: 'Failed to handle calendar action' }, { status: 500 });
  }
}