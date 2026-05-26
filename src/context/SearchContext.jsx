import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const SearchContext = createContext();

export function useSearch() {
  return useContext(SearchContext);
}

export function SearchProvider({ children }) {
  const [searchTermInput, setSearchTermInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimerRef = useRef(null);

  // Expose a method to set the input, which will then debounce and update the actual searchTerm
  const setSearch = (term) => {
    setSearchTermInput(term);
    setIsSearching(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setSearchTerm(term);
      setIsSearching(false);
    }, 300); // 300ms debounce
  };

  const value = {
    searchTermInput,
    searchTerm,
    setSearchTerm: setSearch,
    isSearching
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}
