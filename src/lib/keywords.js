const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'if', 'in', 'into', 'is', 'it',
  'no', 'not', 'of', 'on', 'or', 'such', 'that', 'the', 'their', 'then', 'there', 'these',
  'they', 'this', 'to', 'was', 'will', 'with', 'we', 'you', 'your', 'i', 'my', 'me', 'our',
  'us', 'he', 'him', 'his', 'she', 'her', 'hers', 'it', 'its', 'from', 'about', 'how', 'what',
  'when', 'where', 'who', 'why', 'can', 'could', 'would', 'should', 'has', 'have', 'had',
  'do', 'does', 'did', 'very', 'really', 'just', 'so', 'too', 'also', 'only', 'more', 'most'
]);

export function generateKeywords(...texts) {
  const allText = texts
    .filter(Boolean)
    .map(t => Array.isArray(t) ? t.join(' ') : String(t))
    .join(' ')
    .toLowerCase();

  // Remove punctuation and special characters, leaving only words and spaces
  const cleanText = allText.replace(/[^\w\s]/g, '');

  const words = cleanText.split(/\s+/);
  const keywords = new Set();

  for (const word of words) {
    if (word.length > 1 && !STOP_WORDS.has(word)) {
      keywords.add(word);
    }
  }

  // To support substring matches within keywords array in Firestore,
  // we could optionally generate prefixes, but standard array-contains
  // only matches exact array elements. The prompt requests array-contains
  // which implies word-level matching, so we return the unique words.
  // We can also add some overlapping n-grams or sub-words if needed, 
  // but let's stick to full words as per instructions.
  
  return Array.from(keywords);
}
