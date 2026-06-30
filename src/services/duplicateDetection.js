import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import { calculateSimilarity } from "./similarity";

/**
 * Checks if a new idea is a duplicate of existing ideas.
 * @param {Object} newIdea - The new idea object (title, problem, solution, targetUsers, tags).
 * @returns {Promise<Object>} Result object with highest similarity score and idea details.
 */
export async function checkDuplicateIdea(newIdea) {
  try {
    // Combine fields into a single text for the new idea
    const newText = [
      newIdea.title,
      newIdea.problem,
      newIdea.solution,
      newIdea.targetUsers,
      ...(newIdea.tags || [])
    ].join(" ");

    // Fetch existing ideas (limit to 500 to prevent performance issues as it grows)
    const ideasRef = collection(db, "ideas");
    const q = query(ideasRef, orderBy("createdAt", "desc"), limit(500));
    const querySnapshot = await getDocs(q);

    let highestScore = 0;
    let mostSimilarIdea = null;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Combine fields for the existing idea
      const existingText = [
        data.title,
        data.problem,
        data.solution,
        data.targetUsers,
        ...(data.tags || [])
      ].join(" ");

      const score = calculateSimilarity(newText, existingText);

      if (score > highestScore) {
        highestScore = score;
        mostSimilarIdea = { id: doc.id, ...data };
      }
    });

    return {
      isDuplicate: highestScore > 80, // >80% is considered highly similar
      score: highestScore,
      similarIdea: mostSimilarIdea
    };
  } catch (error) {
    console.error("Error checking duplicate:", error);
    // If it fails, fail gracefully and don't block submission
    return { isDuplicate: false, score: 0, similarIdea: null };
  }
}
