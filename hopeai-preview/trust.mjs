/**
 * Narrow, disclosed product-context answers. These are not generated text or
 * claims that the assistant has verified a person's identity.
 *
 * Source: information supplied in this SKYCOIN4444 project. Do not attach
 * inferred health, family, criminal, employment or location data to a person.
 */
const identity = /\bskyler\s+(?:blue\s+)?spillers?\b/i;
const biographicalRequest = /\b(?:who|what|tell\s+me|about|describe|know|background|biograph|founder|created|creator|is|are)\b/i;

export function groundedProjectAnswer(prompt) {
  if (typeof prompt !== "string") return null;
  if (prompt.length < 3 || prompt.length > 600) return null;
  if (identity.test(prompt) && biographicalRequest.test(prompt)) {
    return {
      kind:"project_note",
      label:"Project context · not AI-generated",
      answer:"According to information supplied for this SKYCOIN4444 project, Skyler Blue Spillers is the founder behind SKYCOIN4444 and HopeAI. I don't have an independently verified biography, and I shouldn't invent facts about his personal life, health, relationships, or experiences. If you share an official biography or a specific question, I can help work from that information."
    };
  }
  if (/^\s*(?:who\s+am\s+i|what\s+is\s+my\s+(?:name|identity))\??\s*$/i.test(prompt)) {
    return {
      kind:"identity_limit",
      label:"Privacy notice · not AI-generated",
      answer:"I can't know your identity from this local chat alone. You can choose what to tell me, and I won't guess details about your life."
    };
  }
  return null;
}

export function validateProjectNotes(value) {
  if (typeof value !== "string" || value.length > 600 ||
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)) {
    throw new RangeError("Project notes must be at most 600 printable characters.");
  }
  return value.trim();
}
