// Silly excuse generator

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
]

export function generateExcuse(): string {
  const starter = excuseStarters[Math.floor(Math.random() * excuseStarters.length)]
  const excuse = sillyExcuses[Math.floor(Math.random() * sillyExcuses.length)]
  return `${starter} ${excuse}.`
}
