"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface SearchSuggestionsProps {
  suggestions: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  id?: string;
  name?: string;
}

export function SearchSuggestions({
  suggestions,
  value,
  onChange,
  placeholder,
  error,
  id,
  name,
}: SearchSuggestionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sync external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Filter suggestions based on input with debounce
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  const filterSuggestions = useCallback(
    (query: string) => {
      if (!query || query.length < 1) {
        setFilteredSuggestions([]);
        return;
      }
      const lower = query.toLowerCase();
      const matches = suggestions
        .filter((s) => s.toLowerCase().includes(lower))
        .slice(0, 8);
      setFilteredSuggestions(matches);
    },
    [suggestions],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      onChange(newValue);
      setHighlightedIndex(-1);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        filterSuggestions(newValue);
        setIsOpen(newValue.length >= 1);
      }, 200);
    },
    [onChange, filterSuggestions],
  );

  const selectSuggestion = useCallback(
    (suggestion: string) => {
      setInputValue(suggestion);
      onChange(suggestion);
      setIsOpen(false);
      setHighlightedIndex(-1);
      setFilteredSuggestions([]);
      inputRef.current?.focus();
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || filteredSuggestions.length === 0) return;

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredSuggestions.length - 1 ? prev + 1 : 0,
          );
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredSuggestions.length - 1,
          );
          break;
        }
        case "Enter": {
          e.preventDefault();
          if (highlightedIndex >= 0) {
            selectSuggestion(filteredSuggestions[highlightedIndex]);
          }
          break;
        }
        case "Escape": {
          e.preventDefault();
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
        }
      }
    },
    [isOpen, filteredSuggestions, highlightedIndex, selectSuggestion],
  );

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const showDropdown = isOpen && filteredSuggestions.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (inputValue.length >= 1) {
            filterSuggestions(inputValue);
            setIsOpen(true);
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={id ? `${id}-listbox` : undefined}
        aria-activedescendant={
          highlightedIndex >= 0
            ? `suggestion-${highlightedIndex}`
            : undefined
        }
        aria-invalid={!!error}
        className={cn(
          "h-11 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground disabled:pointer-events-none disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          error &&
            "border-destructive ring-destructive/20 dark:ring-destructive/40",
        )}
      />
      {error && (
        <p className="mt-1.5 text-sm text-destructive">{error}</p>
      )}
      {showDropdown && (
        <ul
          ref={listRef}
          id={id ? `${id}-listbox` : undefined}
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <li
              key={suggestion}
              id={`suggestion-${index}`}
              role="option"
              aria-selected={highlightedIndex === index}
              onMouseDown={(e) => {
                e.preventDefault();
                selectSuggestion(suggestion);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={cn(
                "relative flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-none select-none",
                highlightedIndex === index &&
                  "bg-accent text-accent-foreground",
              )}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
