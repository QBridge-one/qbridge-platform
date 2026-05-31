"use client";

// ============================================================
// components/ui/country-select.tsx
// Searchable country (ISO 3166-1) dropdown.
//
// Single-select. Value is the ISO code (e.g. "CA"); the button
// renders the country name. Keyboard: ↑/↓ navigate, Enter selects,
// Esc closes. Clicking outside closes too.
//
// No new dependencies — built on the existing Button + Input
// primitives. For very long lists (~250 countries) this is plenty
// fast; if it ever isn't, swap for cmdk + Popover.
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { COUNTRIES, countryByCode } from "@/lib/data/countries";

interface Props {
  /** ISO 3166-1 alpha-2 code, e.g. "CA". Empty string when unset. */
  value: string;
  onChange: (code: string) => void;
  id?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function CountrySelect({
  value,
  onChange,
  id,
  placeholder = "Select country…",
  required,
  disabled,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = countryByCode(value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [query]);

  // Reset highlight when filter changes; clamp into range.
  useEffect(() => {
    setHighlight((h) => Math.min(h, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // Scroll highlighted row into view.
  useEffect(() => {
    if (!open || !listRef.current) return;
    const row = listRef.current.children[highlight] as HTMLElement | undefined;
    row?.scrollIntoView({ block: "nearest" });
  }, [highlight, open]);

  const choose = useCallback(
    (code: string) => {
      onChange(code);
      setOpen(false);
      setQuery("");
    },
    [onChange],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => Math.min(h + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => Math.max(h - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const pick = filtered[highlight];
        if (pick) choose(pick.code);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    },
    [open, filtered, highlight, choose],
  );

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Hidden native input so HTML5 `required` participates in form
          validation when no country is selected. */}
      <input
        type="text"
        tabIndex={-1}
        aria-hidden="true"
        value={value}
        required={required}
        onChange={() => {
          /* controlled via onChange prop */
        }}
        className="pointer-events-none absolute h-0 w-0 opacity-0"
      />
      <Button
        id={id}
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="w-full justify-between font-normal"
      >
        <span
          className={cn(
            "truncate",
            !selected && "text-muted-foreground",
          )}
        >
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open ? (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
          <div className="relative border-b">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search country…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlight(0);
              }}
              onKeyDown={onKeyDown}
              className="h-10 rounded-none border-0 pl-9 focus-visible:ring-0"
            />
          </div>
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-72 overflow-y-auto py-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                No matches
              </li>
            ) : (
              filtered.map((c, i) => {
                const isSelected = c.code === value;
                const isHighlighted = i === highlight;
                return (
                  <li
                    key={c.code}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => choose(c.code)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm",
                      isHighlighted && "bg-accent text-accent-foreground",
                    )}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.code}</span>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
