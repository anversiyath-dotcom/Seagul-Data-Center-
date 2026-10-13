import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ALL_NATIONALITIES,
  POPULAR_NATIONALITIES,
  getNationalityFlag,
  getNationalityCountry,
  searchNationalities,
  NationalityItem,
} from '../data/nationalities';
import { Globe, ChevronDown, Check, X, Search, Sparkles } from 'lucide-react';

interface NationalitySelectProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  showQuickPills?: boolean;
  showCustomToggle?: boolean;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const NationalitySelect: React.FC<NationalitySelectProps> = ({
  value,
  onChange,
  className = '',
  id,
  disabled = false,
  required = false,
  showQuickPills = false,
  placeholder = 'Type to search country or nationality (e.g. sri, ind)...',
  size = 'lg',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownSearchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const normalizedValue = (value || '').toUpperCase().trim();
  const currentFlag = getNationalityFlag(normalizedValue);
  const currentCountry = getNationalityCountry(normalizedValue);

  // Filtered results when user types (e.g. "sri" -> Sri Lanka ranks #1)
  const searchResults = useMemo<NationalityItem[]>(() => {
    if (!query.trim()) {
      return [];
    }
    return searchNationalities(query);
  }, [query]);

  // Active items currently displayed in dropdown:
  // If search query is present, show ranked matches.
  // Otherwise show full world directory of 195+ nationalities.
  const activeItems = useMemo<NationalityItem[]>(() => {
    if (query.trim()) {
      return searchResults;
    }
    return ALL_NATIONALITIES;
  }, [query, searchResults]);

  // Reset highlight index when query changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const highlightedEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedEl) {
        highlightedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (item: NationalityItem) => {
    onChange(item.nationality);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleCustomApply = () => {
    if (query.trim()) {
      onChange(query.trim().toUpperCase());
      setQuery('');
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < activeItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeItems.length > 0 && activeItems[highlightedIndex]) {
        handleSelect(activeItems[highlightedIndex]);
      } else if (query.trim()) {
        handleCustomApply();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setQuery('');
    }
  };

  const displayInputValue = isOpen
    ? query
    : normalizedValue
    ? `${normalizedValue}${currentCountry ? ` (${currentCountry})` : ''}`
    : '';

  // Top pills for quick instant selection
  const quickPillNationalities = [
    { label: 'Sri Lankan', value: 'SRI LANKAN', flag: '🇱🇰' },
    { label: 'Indian', value: 'INDIAN', flag: '🇮🇳' },
    { label: 'Pakistani', value: 'PAKISTANI', flag: '🇵🇰' },
    { label: 'Bangladeshi', value: 'BANGLADESHI', flag: '🇧🇩' },
    { label: 'Filipino', value: 'FILIPINO', flag: '🇵🇭' },
    { label: 'Nepalese', value: 'NEPALESE', flag: '🇳🇵' },
    { label: 'Emirati', value: 'EMIRATI', flag: '🇦🇪' },
    { label: 'Saudi', value: 'SAUDI', flag: '🇸🇦' },
  ];

  // Size configurations
  const isLg = size === 'lg';
  const isMd = size === 'md';

  const inputHeightPaddingClass = isLg
    ? 'py-3.5 pl-14 pr-16 text-base font-bold rounded-xl'
    : isMd
    ? 'py-2.5 pl-12 pr-14 text-sm font-bold rounded-lg'
    : 'py-2 pl-10 pr-12 text-xs font-bold rounded-md';

  const flagSizeClass = isLg ? 'text-3xl left-3.5' : isMd ? 'text-2xl left-3' : 'text-xl left-2.5';

  return (
    <div ref={containerRef} className="space-y-2 w-full relative">
      <div className="relative flex items-center">
        {/* Large Left flag badge */}
        <div className={`absolute flex items-center pointer-events-none select-none z-10 transition-transform ${flagSizeClass}`}>
          <span>{currentFlag}</span>
        </div>

        {/* Big Input box */}
        <input
          id={id}
          ref={inputRef}
          type="text"
          value={displayInputValue}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          onFocus={() => {
            setIsOpen(true);
            setQuery('');
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          className={`w-full bg-slate-50 border-2 border-slate-300 text-slate-900 shadow-xs focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:bg-white transition-all cursor-text placeholder:font-normal placeholder:text-slate-400 ${inputHeightPaddingClass} ${
            isOpen ? 'border-blue-500 ring-4 ring-blue-500/20 bg-white' : 'hover:border-slate-400'
          } ${className}`}
        />

        {/* Action icons right: Big Clear button & Chevron */}
        <div className="absolute right-2.5 flex items-center space-x-1.5 z-10">
          {(normalizedValue || query) && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                setQuery('');
                setIsOpen(true);
                inputRef.current?.focus();
              }}
              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer transition-colors"
              title="Clear selection"
            >
              <X className={isLg ? 'w-5 h-5' : 'w-4 h-4'} />
            </button>
          )}

          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (isOpen) {
                setIsOpen(false);
              } else {
                setIsOpen(true);
                inputRef.current?.focus();
              }
            }}
            className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
            title="Toggle world nationality directory"
          >
            <ChevronDown
              className={`transition-transform duration-200 ${isLg ? 'w-5 h-5' : 'w-4 h-4'} ${
                isOpen ? 'rotate-180 text-blue-600' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Big Autocomplete Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border-2 border-blue-400/80 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-100 ring-4 ring-blue-500/10 min-w-[320px]">
          {/* Header indicator with search counter */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-semibold select-none">
            <span className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-bold text-slate-800">
                {query.trim()
                  ? `Found ${searchResults.length} matches for "${query}"`
                  : '⭐ All 195+ World Nationalities (Type to filter)'}
              </span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              ↑↓ Navigate • Enter Select
            </span>
          </div>

          {/* List items - Generous, big touch targets */}
          <ul
            ref={listRef}
            className="overflow-y-auto max-h-80 sm:max-h-96 p-2 space-y-1 divide-y divide-slate-50 focus:outline-none"
            role="listbox"
          >
            {activeItems.length > 0 ? (
              activeItems.map((item, idx) => {
                const isSelected = normalizedValue === item.nationality;
                const isHighlighted = highlightedIndex === idx;

                return (
                  <li
                    key={`${item.code}-${item.nationality}-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-4 py-3 sm:py-3.5 rounded-xl cursor-pointer flex items-center justify-between transition-all select-none ${
                      isHighlighted
                        ? 'bg-blue-600 text-white shadow-md'
                        : isSelected
                        ? 'bg-blue-50 text-blue-900 border border-blue-200'
                        : 'hover:bg-slate-100 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5 truncate">
                      <span className="text-2xl sm:text-3xl shrink-0 drop-shadow-xs">{item.flag}</span>
                      <div className="truncate">
                        <div className="flex items-center space-x-2">
                          <span className={`font-black text-sm sm:text-base tracking-wide ${isHighlighted ? 'text-white' : 'text-slate-900'}`}>
                            {item.nationality}
                          </span>
                        </div>
                        <div
                          className={`text-xs sm:text-sm font-semibold truncate ${
                            isHighlighted ? 'text-blue-100' : 'text-slate-500'
                          }`}
                        >
                          {item.country}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2.5 shrink-0 ml-3">
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                          isHighlighted
                            ? 'bg-blue-700 text-blue-100'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {item.code}
                      </span>
                      {isSelected && (
                        <Check
                          className={`w-5 h-5 font-bold ${
                            isHighlighted ? 'text-white' : 'text-blue-600'
                          }`}
                        />
                      )}
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="px-4 py-6 text-center text-slate-600 space-y-3">
                <p className="text-sm">No standard country or nationality matched &ldquo;{query}&rdquo;</p>
                <button
                  type="button"
                  onClick={handleCustomApply}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold cursor-pointer transition-colors inline-flex items-center space-x-2 shadow-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Use custom value:</span>
                  <span className="font-mono uppercase font-black underline">&ldquo;{query.trim().toUpperCase()}&rdquo;</span>
                </button>
              </li>
            )}
          </ul>

          {/* Quick Custom Typing Footer when user is typing */}
          {query.trim() && activeItems.length > 0 && (
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Want custom text instead?</span>
              <button
                type="button"
                onClick={handleCustomApply}
                className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer flex items-center space-x-1"
              >
                <span>Apply &ldquo;{query.trim().toUpperCase()}&rdquo; as custom</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Large Quick Pills for instant 1-click popular selection */}
      {showQuickPills && (
        <div className="flex flex-wrap gap-2 items-center pt-1">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center space-x-1.5">
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>Popular:</span>
          </span>
          {quickPillNationalities.map((item) => {
            const isSelected = normalizedValue === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  onChange(item.value);
                  setQuery('');
                  setIsOpen(false);
                }}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-2xs border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-blue-50 hover:border-blue-400'
                } ${isLg ? 'text-xs sm:text-sm' : 'text-xs'}`}
              >
                <span className="text-base">{item.flag}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
