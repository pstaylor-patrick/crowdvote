"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface RoastVoterProps {
  options: string[];
  onVote: (value: string) => void;
  disabled?: boolean;
}

export function RoastVoter({ options, onVote, disabled }: RoastVoterProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sorted = [...options].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );

  const filtered = sorted.filter((name) => name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex-1 flex flex-col gap-3 relative">
      <Input
        ref={inputRef}
        placeholder="Search names..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setSelected(null);
        }}
        className="sticky top-0 z-10"
      />

      <div className="flex-1 overflow-y-auto space-y-1">
        {filtered.map((name) => (
          <button
            key={name}
            type="button"
            className="w-full text-left px-4 py-3 min-h-[3rem] rounded-[var(--radius)] border border-border hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
            onClick={() => setSelected(name)}
            disabled={disabled}
          >
            {name}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-4">No matches found</p>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="sticky bottom-0 bg-background border-t border-border p-4 flex items-center gap-3"
          >
            <p className="flex-1 font-medium truncate">Vote for {selected}?</p>
            <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => onVote(selected)} disabled={disabled}>
              Confirm
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
