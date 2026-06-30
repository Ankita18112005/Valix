import { GoogleGenAI } from "@google/genai";

/**
 * Runs strict heuristic checks for spam, length, and low quality content.
 * Returns an array of rejection reasons. If empty, heuristics passed.
 */
function runHeuristics(idea) {
  const reasons = [];
  const fullText = `${idea.title} ${idea.problem} ${idea.solution} ${idea.targetUsers} ${idea.monetization}`;
  
  // 1. Check length
  if (idea.title.trim().length < 10) {
    reasons.push("Title is too short (minimum 10 characters required).");
  }
  if (fullText.trim().length < 100) {
    reasons.push("Description is too short (minimum 100 characters required).");
  }

  // 2. Check for repeated words
  const words = fullText.toLowerCase().split(/\s+/);
  const wordCounts = {};
  for (const word of words) {
    if (word.length > 2) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
      if (wordCounts[word] > Math.max(5, words.length * 0.3)) {
         reasons.push("Detected too many repeated words.");
         break;
      }
    }
  }

  // 3. Check for pure numbers, symbols, emoji, or URLs
  if (/^[\d\s]+$/.test(fullText)) reasons.push("Idea contains only numbers.");
  if (/^[^\w\s]+$/.test(fullText)) reasons.push("Idea contains only symbols/emojis.");
  
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = fullText.match(urlRegex) || [];
  const textWithoutUrls = fullText.replace(urlRegex, '').trim();
  if (urls.length > 0 && textWithoutUrls.length < 20) {
    reasons.push("Idea looks like URL spam.");
  }

  // 4. Keyboard smash check
  const smashRegex = /([a-zA-Z])\1{4,}/; // e.g. "aaaaa"
  if (smashRegex.test(fullText)) reasons.push("Detected keyboard mashing or spam.");

  // Check for common meaningless text patterns
  const meaninglessRegex = /^[a-zA-Z]{5,20}$/; // A single word of 5-20 chars for problem/solution
  if (meaninglessRegex.test(idea.problem.trim()) && meaninglessRegex.test(idea.solution.trim())) {
    reasons.push("Idea appears to be meaningless text or keyboard mashing.");
  }

  const lowQualityWords = ["test", "asdfgh", "hello", "startup"];
  if (lowQualityWords.includes(idea.title.toLowerCase().trim())) {
     reasons.push("Idea contains placeholder or meaningless text.");
  }

  return reasons;
}

/**
 * Runs strict AI validation using Gemini.
 */
export async function moderateIdea(idea) {
  // Step 1: Fast heuristic checks
  const heuristicReasons = runHeuristics(idea);
  
  if (heuristicReasons.length > 0) {
    return {
      passed: false,
      reasons: heuristicReasons,
      qualityScore: 0,
      qualityLevel: "Poor",
    };
  }

  // Step 2: AI validation
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn("VITE_GEMINI_API_KEY is missing. Bypassing AI strict validation.");
    return {
      passed: true,
      reasons: [],
      qualityScore: 60,
      qualityLevel: "Average",
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
    Evaluate the following startup idea submission.
    
    Title: ${idea.title}
    Problem: ${idea.problem}
    Solution: ${idea.solution}
    Target Users: ${idea.targetUsers}
    Monetization: ${idea.monetization}
    
    Your task is to strictly validate this idea.
    Check for the following critical failures:
    1. Is this meaningless text, random keyboard mashing (e.g. "gjhgiuBWBDW", "asdfgh"), or a test string?
    2. Does it contain toxic, abusive, or highly inappropriate language?
    3. Is this NOT a startup idea at all (e.g. a recipe, a poem, a random sentence)?
    
    If any critical failure is true, set "isRejected" to true and provide the exact "rejectionReason".
    
    Otherwise, rate the idea quality on a scale of 0 to 100.
    
    Provide a JSON response with the following schema:
    {
      "isRejected": boolean (true if meaningless, toxic, or not a startup idea),
      "rejectionReason": string (reason for rejection if isRejected is true, else ""),
      "qualityScore": number (0-100),
      "qualityLevel": string ("Excellent", "Good", "Average", "Poor")
    }
    
    Return ONLY valid JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const result = JSON.parse(response.text);

    if (result.isRejected) {
      return {
        passed: false,
        reasons: [result.rejectionReason || "Idea was rejected by AI validation."],
        qualityScore: result.qualityScore || 0,
        qualityLevel: "Poor",
      };
    }

    // Strict threshold: Must be at least 40/100 to pass
    if (result.qualityScore < 40) {
      return {
        passed: false,
        reasons: [`Idea quality score is too low (${result.qualityScore}/100). Please provide a more detailed and well-thought-out concept.`],
        qualityScore: result.qualityScore,
        qualityLevel: result.qualityLevel || "Poor",
      };
    }

    return {
      passed: true,
      reasons: [],
      qualityScore: result.qualityScore || 50,
      qualityLevel: result.qualityLevel || "Average",
    };

  } catch (error) {
    console.error("AI Moderation error:", error);
    // Fallback if API fails, allow submission
    return {
      passed: true,
      reasons: [],
      qualityScore: 70,
      qualityLevel: "Good",
    };
  }
}
