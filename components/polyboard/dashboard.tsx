"use client";

import { useEffect, useState, useTransition } from "react";
import { Inbox, Sparkles, Upload } from "lucide-react";
import { seededInbox } from "@/data/seeded-inbox";
import { sampleImports, type SampleImportKey } from "@/data/sample-imports";
import { parseImportedContent } from "@/lib/import-parsers";
import { filterInboxItems, getDigestCounts, sortInboxItems } from "@/lib/inbox";
import type { InboxItem, PriorityFilter } from "@/types/polyboard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DigestSummary } from "@/components/polyboard/digest-summary";
import { EmptyState } from "@/components/polyboard/empty-state";
import { ErrorState } from "@/components/polyboard/error-state";
import { FilterTabs } from "@/components/polyboard/filter-tabs";
import { InboxList } from "@/components/polyboard/inbox-list";
import { ImportPanel } from "@/components/polyboard/import-panel";
import { LoadingState } from "@/components/polyboard/loading-state";
import { MessageDrawer } from "@/components/polyboard/message-drawer";

export function Dashboard() {
  const [items, setItems] = useState<InboxItem[]>(() => sortInboxItems(seededInbox));
  const [filter, setFilter] = useState<PriorityFilter>("all");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [rawInput, setRawInput] = useState("");
  const [selectedSampleKey, setSelectedSampleKey] = useState<SampleImportKey>("whatsapp");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileContent, setUploadedFileContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const counts = getDigestCounts(items);
  const visibleItems = sortInboxItems(filterInboxItems(items, filter));
  const currentSample =
    sampleImports.find((sample) => sample.key === selectedSampleKey) ?? sampleImports[0];
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? null;
  const busy = isSubmitting || isPending;

  useEffect(() => {
    if (selectedItemId && !selectedItem) {
      setSelectedItemId(null);
    }
  }, [selectedItem, selectedItemId]);

  async function handleFilePick(file: File | null) {
    if (!file) {
      return;
    }

    try {
      const content = await file.text();
      setUploadedFileName(file.name);
      setUploadedFileContent(content);
      setError(null);
    } catch {
      setError("We could not read that file.");
    }
  }

  function handleLoadSample(sampleKey: SampleImportKey = selectedSampleKey) {
    const sample = sampleImports.find((entry) => entry.key === sampleKey) ?? sampleImports[0];
    if (!sample) {
      return;
    }

    setSelectedSampleKey(sample.key);
    setRawInput(sample.content);
    setUploadedFileName(null);
    setUploadedFileContent("");
    setError(null);
  }

  function handleClearImport() {
    setRawInput("");
    setUploadedFileName(null);
    setUploadedFileContent("");
    setError(null);
  }

  async function handleProcess() {
    const parsedDrafts = [
      ...parseImportedContent(rawInput),
      ...parseImportedContent(uploadedFileContent, uploadedFileName ?? undefined)
    ];

    if (parsedDrafts.length === 0) {
      setError("Paste text, upload a file, or load a sample before processing.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/triage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ items: parsedDrafts })
      });

      const payload = (await response.json()) as { items?: InboxItem[]; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "The triage service returned an error.");
      }

      if (!payload.items || payload.items.length === 0) {
        throw new Error("No inbox items were returned.");
      }

      const processedItems = payload.items;

      startTransition(() => {
        setItems((current) => sortInboxItems([...processedItems, ...current]));
        setSelectedItemId(processedItems[0]?.id ?? null);
        setFilter("all");
        handleClearImport();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while processing the import.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const emptyState =
    items.length === 0 ? (
      <EmptyState
        icon={<Inbox className="h-5 w-5" />}
        title="No items in the inbox yet"
        description="Paste messages, upload a sample file, or load one of the built-in platform examples to see Polyboard in action."
        primaryActionLabel="Load WhatsApp sample"
        onPrimaryAction={() => {
          handleLoadSample("whatsapp");
        }}
        secondaryActionLabel="Load Telegram sample"
        onSecondaryAction={() => {
          handleLoadSample("telegram");
        }}
      />
    ) : visibleItems.length === 0 ? (
      <EmptyState
        icon={<Sparkles className="h-5 w-5" />}
        title="No messages in this filter"
        description="Try another priority bucket, or import a fresh batch to surface more items."
        primaryActionLabel="Reset filters"
        onPrimaryAction={() => setFilter("all")}
        secondaryActionLabel="Load Discord sample"
        onSecondaryAction={() => {
          handleLoadSample("discord");
        }}
      />
    ) : null;

  const loadingState = busy ? (
    <LoadingState title="Triaging imported items" description="Polyboard is summarizing and classifying each message." />
  ) : null;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-0 top-0 h-80 w-80 rounded-full bg-slate-900/5 blur-3xl" />
        <div className="absolute right-0 top-24 h-96 w-96 rounded-full bg-emerald-600/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-slate-500" />
                Personal inbox triage for fragmented communication
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  Polyboard
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  Turn pasted threads, text files, and sample platform exports into one calm inbox with summaries and priority cues.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-slate-200 bg-white px-3 py-1 text-slate-700">Local-first</Badge>
              <Badge className="border-slate-200 bg-white px-3 py-1 text-slate-700">Next.js 15</Badge>
              <Badge className="border-slate-200 bg-white px-3 py-1 text-slate-700">Vercel AI SDK</Badge>
            </div>
          </div>

          <div className="sticky top-4 z-30">
            <Card className="border-white/80 bg-white/85 shadow-soft backdrop-blur-xl">
              <CardContent className="p-4 sm:p-5">
                <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                  <DigestSummary counts={counts} total={items.length} />
                  <FilterTabs
                    value={filter}
                    onChange={setFilter}
                    counts={counts}
                    total={items.length}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </header>

        <main className="mt-6 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <section className="space-y-6">
            <ImportPanel
              rawInput={rawInput}
              onRawInputChange={(value) => {
                setRawInput(value);
                setError(null);
              }}
              selectedSampleKey={selectedSampleKey}
              onSelectedSampleKeyChange={setSelectedSampleKey}
              onLoadSample={handleLoadSample}
              fileName={uploadedFileName}
              onFilePick={handleFilePick}
              onProcess={handleProcess}
              onClear={handleClearImport}
              isProcessing={busy}
              sampleCount={sampleImports.length}
              sampleDescription={currentSample.description}
            />

            <Card className="border-slate-200/80 bg-white/90">
              <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-slate-500" />
                  Supported input
                </CardTitle>
                <CardDescription>
                  Paste messages directly, upload .txt/.json/.csv files, or load the included samples to demo the full triage flow.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Pasted text</Badge>
                  <Badge variant="secondary">JSON</Badge>
                  <Badge variant="secondary">CSV</Badge>
                  <Badge variant="secondary">WhatsApp sample</Badge>
                  <Badge variant="secondary">Telegram sample</Badge>
                  <Badge variant="secondary">Discord sample</Badge>
                  <Badge variant="secondary">Email sample</Badge>
                </div>
                <p className="leading-6">
                  The MVP does not send replies, manage tasks, or connect real accounts. It is intentionally scoped to triage and clarity.
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            {error ? (
              <ErrorState
                title="We could not process that batch"
                description={error}
                onRetry={handleProcess}
              />
            ) : null}

            {loadingState}

            <Card className="border-slate-200/80 bg-white/90">
              <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="space-y-1">
                  <CardTitle>Unified inbox</CardTitle>
                  <CardDescription>
                    {visibleItems.length} of {items.length} items shown. Select any card to inspect the full thread or message.
                  </CardDescription>
                </div>
                <Badge className="border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
                  {filter === "all"
                    ? "All"
                    : filter === "act_now"
                      ? "Act now"
                      : filter === "review_soon"
                        ? "Review soon"
                        : "For later"}
                </Badge>
              </CardHeader>
              <CardContent className="p-4 sm:p-5">
                {emptyState ? (
                  emptyState
                ) : (
                  <InboxList
                    items={visibleItems}
                    selectedItemId={selectedItemId}
                    onSelect={setSelectedItemId}
                  />
                )}
              </CardContent>
            </Card>
          </section>
        </main>
      </div>

      <MessageDrawer item={selectedItem} onClose={() => setSelectedItemId(null)} />
    </div>
  );
}
