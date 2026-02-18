import React, { useState, useRef, useEffect } from 'react';
import { useSearch } from '../../hooks/useSearch';
import { tokens } from '../../styles/tokens';

interface SearchableItem {
  id: string;
  name: string;
  type?: string;
  [key: string]: any;
}

interface SearchBarProps {
  items: SearchableItem[];
  onSelect: (item: SearchableItem) => void;
  placeholder?: string;
  searchKeys?: string[];
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  items, 
  onSelect, 
  placeholder = 'Search...', 
  searchKeys = ['name', 'id'] 
}) => {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  // Cast searchKeys as any because useSearch expects keyof T
  const results = useSearch(items, query, searchKeys as any);

  useEffect(() => {
    setActiveIndex(-1);
  }, [query, results]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setActive(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: SearchableItem) => {
    onSelect(item);
    setQuery('');
    setActive(false);
  };

  const showResults = active && query.length > 0 && results.length > 0;

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '300px', pointerEvents: 'auto' }}>
      <input
        type="text"
        role="combobox"
        aria-label="Search items"
        aria-expanded={active}
        aria-controls="search-results-list"
        aria-activedescendant={activeIndex >= 0 ? `result-${activeIndex}` : undefined}
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(true);
        }}
        onFocus={() => setActive(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setActive(false);
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive(true);
            setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            if (active && results[activeIndex]) {
              handleSelect(results[activeIndex]);
            }
          }
        }}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: tokens.layout.borderRadius,
          border: `1px solid ${tokens.colors.border}`,
          backgroundColor: tokens.colors.background,
          color: tokens.colors.text.primary,
          fontSize: '14px',
        }}
      />
      
      {showResults && (
        <ul
          id="search-results-list"
          role="listbox"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            margin: '4px 0 0',
            padding: '0',
            listStyle: 'none',
            backgroundColor: tokens.colors.background,
            border: `1px solid ${tokens.colors.border}`,
            borderRadius: tokens.layout.borderRadius,
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: tokens.colors.shadow.default
        }}>
          {results.map((item, index) => (
            <li
              key={item.id}
              id={`result-${index}`}
              role="option"
              onClick={() => handleSelect(item)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: `1px solid ${tokens.colors.borderSubtle}`,
                backgroundColor: index === activeIndex ? tokens.colors.borderSubtle : 'transparent',
                color: tokens.colors.text.secondary
              }}
              aria-selected={index === activeIndex}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <div style={{ fontWeight: 'bold' }}>{item.name}</div>
              {item.type && (
                <div style={{ fontSize: '10px', color: tokens.colors.text.muted, textTransform: 'uppercase' }}>
                  {item.type}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
