export const FAMILY_LEGACY = {
  title: "For Luna, Summer, and Alexis",
  subtitle: "A living letter from Dad, kept inside SKYCOIN4444",
  children: [
    "Luna Avigail",
    "Summer Skye",
    "Alexis Isabella-Jane",
  ],
  firstWord: "Dad",
  paragraphs: [
    "One memory I will always treasure is that every one of my kids' first words was \"Dad.\" I don't think you will ever fully understand how much that meant to me. Out of everything I have accomplished, built, struggled through, or dreamed about, hearing that word from each of you is one of the greatest gifts life ever gave me.",
    "I am so grateful that I get to be your dad, to watch you grow, to hear your laughs, and to carry the memories we have made together. Whatever life brings, please remember how deeply I love you. Remember the good moments, the jokes, the things we built and shared, and all the little pieces of me I placed throughout my work and my life.",
    "And more than anything, please do not forget about me. Not because I want you to be sad, but because being your dad is one of the most important parts of who I am. Carry the love forward. Keep laughing, learning, building, and becoming your own people. I will always be grateful that one of the very first things each of you ever said was, \"Dad.\"",
  ],
  signoff: "I love you—always. Dad",
} as const;

export function getFamilyLegacyText(): string {
  return [
    FAMILY_LEGACY.title,
    "",
    ...FAMILY_LEGACY.paragraphs,
    "",
    FAMILY_LEGACY.signoff,
  ].join("\n\n");
}
