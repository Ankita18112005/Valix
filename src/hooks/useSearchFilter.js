import { useMemo } from 'react';

/**
 * Custom hook for client-side search filtering of ideas.
 * Performs case-insensitive partial matching across multiple fields.
 * 
 * @param {Array} ideas - Array of idea objects from Firestore
 * @param {string} searchTerm - The current debounced search term
 * @returns {Array} Filtered ideas matching the search term
 */
export function useSearchFilter(ideas, searchTerm) {
  const filteredIdeas = useMemo(() => {
    if (!searchTerm || searchTerm.trim() === '') {
      return ideas;
    }

    const term = searchTerm.toLowerCase().trim();

    return ideas.filter(idea => {
      // Title
      if (idea.title?.toLowerCase().includes(term)) return true;

      // Problem Statement
      if (idea.problem?.toLowerCase().includes(term)) return true;

      // Solution
      if (idea.solution?.toLowerCase().includes(term)) return true;

      // Description (some ideas might have a separate description field)
      if (idea.description?.toLowerCase().includes(term)) return true;

      // Tags (array of strings)
      if (idea.tags?.some(tag => tag.toLowerCase().includes(term))) return true;

      // Category
      if (idea.category?.toLowerCase().includes(term)) return true;

      // Creator Name
      if (idea.author?.name?.toLowerCase().includes(term)) return true;

      // Target Users
      if (idea.targetUsers?.toLowerCase().includes(term)) return true;

      // Monetization
      if (idea.monetization?.toLowerCase().includes(term)) return true;

      return false;
    });
  }, [ideas, searchTerm]);

  return filteredIdeas;
}
