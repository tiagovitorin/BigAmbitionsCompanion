export interface ActionSummary {
  headline: string;
  impact?: string;
  storeName?: string;
}

export interface UncleFredParsedResponse {
  cleanText: string;
  actionSummary?: ActionSummary;
  followUpPrompts: string[];
}

export function parseUncleFredOutput(raw: string): UncleFredParsedResponse {
  let cleanText = raw.trim();
  let actionSummary: ActionSummary | undefined;
  let followUpPrompts: string[] = [];

  // Strip surrounding quotes if the model wrapped its entire response in quotes
  cleanText = cleanText.replace(/^["'“”«»]+|["'“”«»]+$/g, '').trim();

  // Strip any accidental ACTION: or Recommended Move: lines if generated
  cleanText = cleanText.replace(/(?:Recommended Move|ACTION|Next Steps?):\s*/gi, '').trim();

  // 1. Check for explicit FOLLOW_UPS header (English or common multilingual equivalents)
  // Supports on its own line or inline after a sentence (e.g. "...right now! FOLLOW_UPS: - ...")
  const headerRegex = /(?:\n|^|\s+)(?:FOLLOW[-_ ]*UPS?|FOLLOW UP QUESTIONS?|SUGEST[OÕ]ES?|PERGUNTAS?(?:\s+DE\s+SEGUIMENTO)?|QUESTIONS?|SUGGESTIONS?):\s*([\s\S]*?)$/i;
  const followUpMatch = cleanText.match(headerRegex);

  if (followUpMatch && followUpMatch.index !== undefined) {
    const rawList = followUpMatch[1].trim().replace(/["'“”«»]+$/, '').trim();
    cleanText = cleanText.slice(0, followUpMatch.index).trim();
    cleanText = cleanText.replace(/["'“”«»]+$/, '').trim();

    const items = rawList
      .split(/\n|(?<=\?)\s*(?:[-*•]|\d+\.|\b)/)
      .map((line: string) => {
        let p = line.replace(/^[-*•\d.]+\s*/, '').trim();
        p = p.replace(/^(?:want me to|should i|shall i)\s+(?:check|look at|inspect)\s+/i, 'Can you check ');
        p = p.replace(/^(?:want me to|should i|shall i)\s+/i, 'Can you ');
        return p;
      })
      .filter((line: string) => line.length > 3 && line.length < 95);
    followUpPrompts = items.slice(0, 3);
  } else {
    // 2. Fallback heuristic: If the model omitted the FOLLOW_UPS header and appended 1-3 questions at the very end
    // E.g.: "..., Can you audit my struggling stores right now?, How much cash should I keep before expanding again?"
    // Or separated by newlines:
    // "- Can you audit...?"
    // "- How much cash...?"
    const trailingListMatch = cleanText.match(/(?:(?:\.|\!|\?)\s*,\s*|(?:\.|\!|\?)\s+|\n\s*)(?:[-*•]\s*)?([A-ZÀ-ÿ][^?]{5,90}\?\s*(?:(?:,|\n)\s*(?:[-*•]\s*)?[A-ZÀ-ÿ][^?]{5,90}\?\s*){0,2})$/);
    if (trailingListMatch && trailingListMatch.index !== undefined) {
      const matchedBlock = trailingListMatch[1];
      const splitQuestions = matchedBlock
        .split(/(?:,|\n)\s*(?:[-*•]\s*)?/)
        .map(q => q.trim().replace(/^[-*•\d.]+\s*/, ''))
        .filter(q => q.endsWith('?') && q.length > 5 && q.length < 95);

      if (splitQuestions.length >= 1) {
        cleanText = cleanText.slice(0, trailingListMatch.index + 1).trim();
        followUpPrompts = splitQuestions.slice(0, 3);
      }
    }
  }

  // Fallback cleanup: If trailing comma or dot was left when cutting, normalize punctuation
  cleanText = cleanText
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/([^\n])\s+-\s+/g, '$1, ')
    .replace(/,\s*$/, '.')
    .trim();

  return {
    cleanText,
    actionSummary,
    followUpPrompts
  };
}
