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
        className="sticky top-0 z-10 text-base"
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-background rounded-2xl p-8 mx-6 max-w-sm w-full shadow-2xl text-center space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm text-muted-foreground">Cast your vote for</p>
              <p className="text-3xl font-bold">{selected}</p>
              <div className="flex flex-col gap-3">
                <Button
                  size="lg"
                  className="w-full text-lg py-6"
                  onClick={() => onVote(selected)}
                  disabled={disabled}
                >
                  Confirm Vote
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
