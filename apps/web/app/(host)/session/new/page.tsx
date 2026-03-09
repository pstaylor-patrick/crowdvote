"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface QuestionInput {
  prompt: string;
  options: string[];
}

export default function NewSessionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<QuestionInput[]>([
    { prompt: "", options: [""] },
  ]);
  const [submitting, setSubmitting] = useState(false);
  // Default shared options for roast mode (applied to all questions)
  const [sharedOptions, setSharedOptions] = useState<string[]>([""]);
  const [useSharedOptions, setUseSharedOptions] = useState(true);

  const addQuestion = () => {
    setQuestions([...questions, { prompt: "", options: [""] }]);
  };

  const updatePrompt = (idx: number, prompt: string) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], prompt };
    setQuestions(updated);
  };

  const addSharedOption = () => setSharedOptions([...sharedOptions, ""]);
  const updateSharedOption = (idx: number, val: string) => {
    const updated = [...sharedOptions];
    updated[idx] = val;
    setSharedOptions(updated);
  };
  const removeSharedOption = (idx: number) => {
    setSharedOptions(sharedOptions.filter((_, i) => i !== idx));
  };

  const addOption = (qIdx: number) => {
    const updated = [...questions];
    updated[qIdx] = {
      ...updated[qIdx],
      options: [...updated[qIdx].options, ""],
    };
    setQuestions(updated);
  };

  const updateOption = (qIdx: number, oIdx: number, val: string) => {
    const updated = [...questions];
    const opts = [...updated[qIdx].options];
    opts[oIdx] = val;
    updated[qIdx] = { ...updated[qIdx], options: opts };
    setQuestions(updated);
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    const updated = [...questions];
    updated[qIdx] = {
      ...updated[qIdx],
      options: updated[qIdx].options.filter((_, i) => i !== oIdx),
    };
    setQuestions(updated);
  };

  const removeQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);

    const filteredShared = sharedOptions.filter((o) => o.trim());
    const payload = {
      title: title.trim(),
      type: "roast",
      questions: questions
        .filter((q) => q.prompt.trim())
        .map((q) => ({
          prompt: q.prompt.trim(),
          options: useSharedOptions
            ? filteredShared
            : q.options.filter((o) => o.trim()),
        })),
    };

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
    <div className="max-w-2xl mx-auto p-6 space-y-6">
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

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="shared"
              checked={useSharedOptions}
              onChange={(e) => setUseSharedOptions(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="shared" className="text-sm">
              Use same options for all questions (roast mode)
            </label>
          </div>

          {useSharedOptions && (
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <label className="text-sm font-medium">
                People / Options (shared across all questions)
              </label>
              {sharedOptions.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => updateSharedOption(i, e.target.value)}
                    placeholder={`Person ${i + 1}`}
                  />
                  {sharedOptions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSharedOption(i)}
                    >
                      X
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addSharedOption}>
                + Add Person
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Questions</h2>
        {questions.map((q, qIdx) => (
          <Card key={qIdx}>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Question {qIdx + 1}
                </label>
                {questions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(qIdx)}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <Input
                value={q.prompt}
                onChange={(e) => updatePrompt(qIdx, e.target.value)}
                placeholder="Most likely to fall asleep in a meeting"
              />

              {!useSharedOptions && (
                <div className="space-y-2 pl-4">
                  <label className="text-xs text-muted-foreground">
                    Options
                  </label>
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex gap-2">
                      <Input
                        value={opt}
                        onChange={(e) =>
                          updateOption(qIdx, oIdx, e.target.value)
                        }
                        placeholder={`Option ${oIdx + 1}`}
                      />
                      {q.options.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(qIdx, oIdx)}
                        >
                          X
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addOption(qIdx)}
                  >
                    + Add Option
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        <Button variant="outline" onClick={addQuestion}>
          + Add Question
        </Button>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={submitting} size="lg">
          {submitting ? "Creating..." : "Create Session"}
        </Button>
        <Button variant="outline" size="lg" asChild>
          <a href="/dashboard">Cancel</a>
        </Button>
      </div>
    </div>
  );
}
