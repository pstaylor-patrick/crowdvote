"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { buildSessionPayload, type QuestionInput } from "@/lib/session-payload";
import { Trash, XCircle, Plus, PlusCircle, CheckCircle } from "@phosphor-icons/react";

export default function NewSessionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<QuestionInput[]>([{ prompt: "", options: [""] }]);
  const [submitting, setSubmitting] = useState(false);

  const addQuestion = () => {
    setQuestions([...questions, { prompt: "", options: [""] }]);
  };

  const updatePrompt = (idx: number, prompt: string) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx]!, prompt };
    setQuestions(updated);
  };

  const addOption = (qIdx: number) => {
    const updated = [...questions];
    updated[qIdx] = {
      ...updated[qIdx]!,
      options: [...updated[qIdx]!.options, ""],
    };
    setQuestions(updated);
  };

  const updateOption = (qIdx: number, oIdx: number, val: string) => {
    const updated = [...questions];
    const opts = [...updated[qIdx]!.options];
    opts[oIdx] = val;
    updated[qIdx] = { ...updated[qIdx]!, options: opts };
    setQuestions(updated);
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    const updated = [...questions];
    updated[qIdx] = {
      ...updated[qIdx]!,
      options: updated[qIdx]!.options.filter((_, i) => i !== oIdx),
    };
    setQuestions(updated);
  };

  const removeQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);

    const payload = buildSessionPayload(title, questions);

    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const session = await res.json();
      router.push(`/session/${session.id}`);
    } else {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">New Session</h1>

      <Card>
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="F3 Leadership Roast"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Questions</h2>
        <AnimatePresence initial={false}>
          {questions.map((q, qIdx) => (
            <motion.div
              key={qIdx}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {qIdx + 1}
                      </span>
                      <label className="text-sm font-medium">Question</label>
                    </div>
                    {questions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(qIdx)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash size={16} />
                      </Button>
                    )}
                  </div>
                  <Input
                    value={q.prompt}
                    onChange={(e) => updatePrompt(qIdx, e.target.value)}
                    placeholder="Most likely to fall asleep in a meeting"
                  />

                  <div className="space-y-2 pl-4">
                    <label className="text-xs text-muted-foreground">Options</label>
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex gap-2">
                        <Input
                          value={opt}
                          onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                          placeholder={`Option ${oIdx + 1}`}
                        />
                        {q.options.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(qIdx, oIdx)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <XCircle size={18} />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addOption(qIdx)}
                      className="gap-1"
                    >
                      <Plus size={14} weight="bold" />
                      Add Option
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        <Button variant="outline" onClick={addQuestion} className="gap-2">
          <PlusCircle size={18} />
          Add Question
        </Button>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={submitting} size="lg" className="gap-2">
          <CheckCircle size={20} weight="bold" />
          {submitting ? "Creating..." : "Create Session"}
        </Button>
        <Button variant="outline" size="lg" asChild>
          <a href="/dashboard">Cancel</a>
        </Button>
      </div>
    </div>
  );
}
