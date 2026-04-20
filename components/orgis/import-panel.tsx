import { FileText, Loader2, RotateCcw, Upload } from "lucide-react";
import { sampleImports } from "@/data/sample-imports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { SampleImportKey } from "@/data/sample-imports";

export function ImportPanel({
  rawInput,
  onRawInputChange,
  selectedSampleKey,
  onSelectedSampleKeyChange,
  onLoadSample,
  fileName,
  onFilePick,
  onProcess,
  onClear,
  isProcessing,
  sampleCount,
  sampleDescription
}: {
  rawInput: string;
  onRawInputChange: (value: string) => void;
  selectedSampleKey: SampleImportKey;
  onSelectedSampleKeyChange: (value: SampleImportKey) => void;
  onLoadSample: () => void;
  fileName: string | null;
  onFilePick: (file: File | null) => Promise<void> | void;
  onProcess: () => void;
  onClear: () => void;
  isProcessing: boolean;
  sampleCount: number;
  sampleDescription: string;
}) {
  const selectedSample =
    sampleImports.find((sample) => sample.key === selectedSampleKey) ?? sampleImports[0];

  return (
    <Card className="border-slate-200/80 bg-white/90">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-slate-500" />
          Bring in chat exports
        </CardTitle>
        <CardDescription>
          Paste copied threads, upload a raw export, or load a built-in sample to compile one
          shared queue.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-900">Sample source</span>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <select
                value={selectedSampleKey}
                onChange={(event) => onSelectedSampleKeyChange(event.target.value as SampleImportKey)}
                disabled={isProcessing}
                className={cn(
                  "h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                )}
              >
                {sampleImports.map((sample) => (
                  <option key={sample.key} value={sample.key}>
                    {sample.label}
                  </option>
                ))}
              </select>
              <Button type="button" variant="outline" onClick={onLoadSample} disabled={isProcessing}>
                Load sample
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{sampleDescription}</span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium uppercase tracking-[0.16em] text-slate-600">
                {selectedSample.format}
              </span>
            </div>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-900">Paste raw input</span>
            <Textarea
              value={rawInput}
              onChange={(event) => onRawInputChange(event.target.value)}
              disabled={isProcessing}
              placeholder={`Source: WhatsApp
Sender: Priya Nair
Chat: Client launch room
Timestamp: 2026-04-18 09:12 AM
Content:
The client moved the review earlier. Can you send the final deck before 11:30?

---

App: Slack
Sender: Ari Chen
Channel: #launch-ops
Timestamp: 2026-04-18 10:14 AM
Messages: 7
Content:
Legal approved the copy. Please pin the launch note and post it at 12:00.`}
              className="min-h-72"
            />
          </label>

          <div className="grid gap-3">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-900">Upload a file</span>
              <Input
                type="file"
                accept=".txt,.json,.csv,text/plain,application/json,text/csv"
                disabled={isProcessing}
                onChange={(event) => {
                  void onFilePick(event.target.files?.[0] ?? null);
                }}
              />
            </label>
            {fileName ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <span className="font-medium text-slate-900">Loaded file:</span> {fileName}
              </div>
            ) : null}
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <Button
              type="button"
              onClick={onProcess}
              disabled={isProcessing || (rawInput.trim().length === 0 && !fileName)}
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Compile queue
            </Button>
            <Button type="button" variant="outline" onClick={onClear} disabled={isProcessing}>
              <RotateCcw className="h-4 w-4" />
              Reset import
            </Button>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
              {sampleCount} built-in sample{sampleCount === 1 ? "" : "s"} ready to demo
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
