/**
 * Calculates text similarity using Term Frequency (TF) and Cosine Similarity.
 * Returns a percentage score between 0 and 100.
 */
export function calculateSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;
  
  const tokenize = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 1); // Ignore single characters
  };

  const tokens1 = tokenize(text1);
  const tokens2 = tokenize(text2);

  if (tokens1.length === 0 || tokens2.length === 0) return 0;

  // Calculate term frequencies
  const tf1 = {};
  const tf2 = {};
  const uniqueTokens = new Set([...tokens1, ...tokens2]);

  tokens1.forEach(token => {
    tf1[token] = (tf1[token] || 0) + 1;
  });

  tokens2.forEach(token => {
    tf2[token] = (tf2[token] || 0) + 1;
  });

  // Calculate dot product and magnitudes
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  uniqueTokens.forEach(token => {
    const val1 = tf1[token] || 0;
    const val2 = tf2[token] || 0;
    
    dotProduct += val1 * val2;
    mag1 += val1 * val1;
    mag2 += val2 * val2;
  });

  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);

  if (mag1 === 0 || mag2 === 0) return 0;

  const cosineSimilarity = dotProduct / (mag1 * mag2);
  
  // Convert to percentage (0 to 100)
  return Math.round(cosineSimilarity * 100);
}
