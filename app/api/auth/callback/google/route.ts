import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { cookies } from 'next/headers';

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CALENDAR_CLIENT_ID,
  process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
  process.env.GOOGLE_CALENDAR_REDIRECT_URI
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    console.error('No code provided in callback');
    return NextResponse.redirect(new URL('/?calendar=error', request.url));
  }

  try {
    // Exchange the code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      console.error('No tokens received from Google');
      return NextResponse.redirect(new URL('/?calendar=error', request.url));
    }

    // Store tokens in cookies
    const cookieStore = await cookies();
    cookieStore.set('access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
    });
    
    cookieStore.set('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 3600, // 30 days
    });

    // Redirect to home page with success state
    return NextResponse.redirect(new URL('/?calendar=connected', request.url));
  } catch (error) {
    console.error('Error in Google Calendar callback:', error);
    // Redirect to home page with error state
    return NextResponse.redirect(new URL('/?calendar=error', request.url));
  }
} 