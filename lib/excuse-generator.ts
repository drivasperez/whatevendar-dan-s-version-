// Excuse generator with Claude AI integration

const excuseStarters = [
  "Sorry, I can't make it because",
  "Unfortunately, I won't be able to attend as",
  "I regret to inform you that I can't come because",
  "You won't believe this, but",
  "This is totally legitimate and not made up, but",
  "I'd love to come, but sadly",
  "My sincerest apologies, but",
  "I was really looking forward to this, but",
  "I'm devastated to miss this, but",
  "This is embarrassing, but",
  "Well, darling, you see,",
  "I'd sashay right over, but tragically,",
  "Not to be dramatic or anything, but",
  "Hold onto your hat, because",
  "In a plot twist nobody saw coming,",
  "I tried SO hard to make it, but",
  "The universe is conspiring against me because",
  "I'm beyond fashionably late because",
  "Brace yourself for this excuse, but",
  "Let me paint you a picture of my current situation:",
]

const sillyExcuses = [
  "my pet goldfish is having an existential crisis",
  "I've scheduled a staring contest with my ceiling",
  "my collection of invisible hats needs reorganizing",
  "I'm teaching my plants to salsa dance",
  "I need to alphabetize my sock drawer",
  "I'm attending a seminar on how to make better excuses",
  "my imaginary friend is getting married",
  "I've been selected for a secret mission to Mars",
  "I'm participating in the world championship of thumb wrestling",
  "I need to count how many times I can blink in an hour",
  "my shadow and I are having relationship issues",
  "I'm busy trying to break the world record for longest time spent avoiding social events",
  "I've committed to a Netflix marathon that cannot be postponed",
  "I need to finish writing my autobiography titled 'Excuses: A Life Story'",
  "I'm practicing my telepathic communication with squirrels",
  "my horoscope specifically warned against attending this event",
  "I'm in the middle of an intense staring contest with my reflection",
  "I've been chosen to represent my apartment in the dust bunny Olympics",
  "I need to finish my research on how long I can pretend to be busy",
  "I'm scheduled for an emergency nap that cannot be rescheduled",
  "my emotional support cactus needs therapy after I forgot to water it",
  "Mercury is in retrograde and my aura simply can't handle any meetings today",
  "I've been cast as an extra in a documentary about people who avoid responsibilities",
  "my spirit animal (a sloth) advised against rushing into any commitments today",
  "I'm in a heated argument with my WiFi router about personal boundaries",
  "I've temporarily transcended the mortal plane and can't interact with human affairs",
  "I'm directing a one-person flash mob in my living room",
  "my dramatic interpretation of the morning's weather forecast has left me emotionally depleted",
  "I've been kidnapped by my own procrastination and the ransom is 'doing absolutely nothing today'",
  "I'm busy practicing my acceptance speech for when I eventually win the 'Most Creative Excuse' award",
]

// Generate a fallback excuse locally in case the API call fails
export function generateLocalExcuse(): string {
  const starter = excuseStarters[Math.floor(Math.random() * excuseStarters.length)]
  const excuse = sillyExcuses[Math.floor(Math.random() * sillyExcuses.length)]
  return `${starter} ${excuse}.`
}

// Generate an excuse using the Claude API
export async function generateAIExcuse(eventTitle: string, eventType: string): Promise<string> {
  try {
    const context = `missing "${eventTitle}" (a ${eventType} event)`
    
    const response = await fetch('/api/generate-excuse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate AI excuse');
    }

    const data = await response.json();
    return data.excuse;
  } catch (error) {
    console.error('Error generating AI excuse:', error);
    return generateLocalExcuse();
  }
}
