import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const SearchContext = createContext();

const RECENT_SEARCHES_KEY = 'valix_recent_searches';
const DEFAULT_SUGGESTIONS = ['AI', 'Healthcare', 'Finance', 'Marketplace', 'EdTech'];
const MAX_RECENT = 5;

export function useSearch() {
  return useContext(SearchContext);
}

export function SearchProvider({ children }) {
  const [searchTermInput, setSearchTermInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Recent Searches (localStorage)
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_SUGGESTIONS;
    } catch {
      return DEFAULT_SUGGESTIONS;
    }
  });

  const addRecentSearch = useCallback((term) => {
    if (!term || term.trim().length < 2) return;
    const trimmed = term.trim();
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT);
      try { localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try { localStorage.removeItem(RECENT_SEARCHES_KEY); } catch {}
  }, []);

  // Debounced search setter
  const setSearch = useCallback((term) => {
    setSearchTermInput(term);
    setIsSearching(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setSearchTerm(term);
      setIsSearching(false);
      if (term.trim().length >= 2) {
        addRecentSearch(term);
      }
    }, 300);
  }, [addRecentSearch]);

  const clearSearch = useCallback(() => {
    setSearchTermInput('');
    setSearchTerm('');
    setIsSearching(false);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K or Meta+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Esc to clear and blur
      if (e.key === 'Escape') {
        clearSearch();
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [clearSearch]);

  const value = {
    searchTermInput,
    searchTerm,
    setSearchTerm: setSearch,
    clearSearch,
    isSearching,
    searchInputRef,
    recentSearches,
    addRecentSearch,
    clearRecentSearches
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}
