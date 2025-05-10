import { google, calendar_v3 } from 'googleapis';
import type { CalendarEvent } from '@/types/events';

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CALENDAR_CLIENT_ID,
  process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
  process.env.GOOGLE_CALENDAR_REDIRECT_URI
);

// Initialize Google Calendar API
const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

// Store events in memory
let eventDeck: CalendarEvent[] = [];
let currentEventIndex = 0;

// Use the Google Calendar API types
type GoogleCalendarEvent = calendar_v3.Schema$Event;

export function formatGoogleEvent(event: GoogleCalendarEvent): CalendarEvent {
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

export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  try {
    // Calculate date range (this week and next week)
    const now = new Date();
    const twoWeeksFromNow = new Date(now);
    twoWeeksFromNow.setDate(now.getDate() + 14);

    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: now.toISOString(),
      timeMax: twoWeeksFromNow.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    return events.map(formatGoogleEvent);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return [];
  }
}

export function updateEventDeck(events: CalendarEvent[]) {
  eventDeck = events;
  currentEventIndex = 0;
}

export function getCurrentEvent(): CalendarEvent | null {
  return eventDeck[currentEventIndex] || null;
}

export function getAllEvents(): CalendarEvent[] {
  return eventDeck;
}

export function moveToNextEvent() {
  if (currentEventIndex < eventDeck.length - 1) {
    currentEventIndex++;
  }
}

export function getAuthUrl(): string {
  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
}

export async function getTokens(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
}

export async function refreshAccessToken() {
  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);
    return credentials;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
} 