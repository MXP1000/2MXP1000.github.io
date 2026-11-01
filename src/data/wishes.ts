export const TONES = ["Traditional", "Heartfelt", "Playful", "Poetic"] as const;
export type Tone = (typeof TONES)[number];

interface Template {
  emoji: string;
  openers: string[];
  bodies: string[];
  closers: string[];
}

const TEMPLATES: Record<Tone, Template> = {
  Traditional: {
    emoji: "🪔",
    openers: [
      "Shubh Deepavali, {name}!",
      "Wishing you and your family a blessed and joyous Diwali, {name}!",
      "Happy Diwali, dear {name}!",
    ],
    bodies: [
      "May Goddess Lakshmi and Lord Ganesha bless your home with wealth, wisdom and good health.",
      "May the diyas you light dispel all darkness and fill your life with divine light.",
      "May this festival bring prosperity to your family and success in every endeavour.",
    ],
    closers: ["Stay blessed and keep smiling 🪔", "Have a safe and sparkling Deepavali 🎇", "With warm wishes always 🙏"],
  },
  Heartfelt: {
    emoji: "💛",
    openers: [
      "Dear {name}, Happy Diwali from the bottom of my heart!",
      "{name}, you light up my world, and I hope this Diwali lights up yours.",
      "Sending you all my love this Diwali, {name} 💛",
    ],
    bodies: [
      "May every corner of your life be filled with warmth, laughter and people who love you.",
      "I'm so grateful to have you in my life. May this festival bring you peace and happiness.",
      "May your heart be as bright as a thousand lamps and all your dreams come true.",
    ],
    closers: ["Love you lots ❤️", "Here's to a bright new beginning 🌅", "Hugs and sparkles!"],
  },
  Playful: {
    emoji: "🎆",
    openers: [
      "Hey {name}! Diwali means sweets, fireworks and zero diet plans! 🍬",
      "{name}, let the crackers be loud and your phone bills be quiet! 🎆",
      "Oi {name}! Happy Diwali, you glorious firecracker! 🧨",
    ],
    bodies: [
      "May your laddoos be plenty and your luck even brighter than the sparklers.",
      "Wishing you more fun than a bucket of sparklers and more snacks than you can carry.",
      "May this Diwali be so awesome that even the diyas get jealous!",
    ],
    closers: ["Party responsibly 😜", "Don't burn the house down 🔥", "Eat the sweets, skip the diet! 🤭"],
  },
  Poetic: {
    emoji: "🌙",
    openers: [
      "{name}, like a single diya glowing in the night…",
      "Under a sky of gold and fire, {name},",
      "As the stars descend to meet the earth, {name},",
    ],
    bodies: [
      "may every flicker of light carry a wish, and every wish find its way home to you.",
      "may your path glow softly, the way the lanterns drift gently toward the moon.",
      "may the hush between the bursts of light be filled with a peace that stays.",
    ],
    closers: ["Happy Diwali ✨", "Shine on, always 🌙", "With light and love 🪔"],
  },
};

export interface Wish {
  id: number;
  name: string;
  tone: Tone;
  emoji: string;
  text: string;
}

let counter = 0;

export function makeWish(name: string, tone: Tone): Wish {
  const t = TEMPLATES[tone];
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  const opener = pick(t.openers).replace("{name}", name);
  const text = `${opener} ${pick(t.bodies)} ${pick(t.closers)}`;
  counter += 1;
  return { id: counter, name, tone, emoji: t.emoji, text };
}

export interface Preset {
  emoji: string;
  title: string;
  text: string;
  accent: string;
}

export const PRESETS: Preset[] = [
  {
    emoji: "🪔",
    title: "Light",
    text: "May the glow of a thousand diyas light up your path and banish every shadow.",
    accent: "#ffb347",
  },
  {
    emoji: "🎆",
    title: "Joy",
    text: "Wishing you fireworks of happiness that keep lighting up your days all year long.",
    accent: "#ff5c8a",
  },
  {
    emoji: "🌸",
    title: "Prosperity",
    text: "May Goddess Lakshmi bless your home with wealth, health and endless blessings.",
    accent: "#7ce0a3",
  },
  {
    emoji: "🍬",
    title: "Sweetness",
    text: "Sweets, laughter and warm hugs — may your Diwali be as sweet as your smile.",
    accent: "#ffd166",
  },
  {
    emoji: "✨",
    title: "Dreams",
    text: "As the lanterns rise into the night sky, may your biggest dreams rise with them.",
    accent: "#a78bfa",
  },
  {
    emoji: "🕊️",
    title: "Peace",
    text: "May your heart be calm, your home be bright, and your spirit shine with peace.",
    accent: "#5eead4",
  },
];
    
