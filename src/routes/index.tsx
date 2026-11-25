import { createFileRoute } from "@tanstack/react-router";
import { Box, CheckSquare, Fuel, List, Minus, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { PumpInspectorPanel } from "@/components/PumpInspectorPanel";
import { PumpListView } from "@/components/PumpListView";
import { SelectionSummaryBar } from "@/components/SelectionSummaryBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StationCanvas } from "@/scene/StationCanvas";
import { useStationStore } from "@/station/store";
import { MAX_PUMPS, MIN_PUMPS } from "@/station/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "PumpShine — Interactive 3D Gas Station Cleaning Configurator" },
      {
        name: "description",
        content:
          "Set your station's pump count, explore the realistic 3D forecourt, and select exact fuel pump, island, and pavement cleaning areas.",
      },
      { property: "og:title", content: "PumpShine — Interactive 3D Gas Station Cleaning Configurator" },
      {
        property: "og:description",
        content:
          "Set your station's pump count, explore the realistic 3D forecourt, and select exact fuel pump, island, and pavement cleaning areas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StationBookingPage,
});

const QUICK_COUNTS = [2, 6, 10, 16];

function StationBookingPage() {
  const pumpCount = useStationStore((s) => s.pumpCount);
  const selectedPumpIds = useStationStore((s) => s.selectedPumpIds);
  const setPumpCount = useStationStore((s) => s.setPumpCount);
  const selectAllPumps = useStationStore((s) => s.selectAllPumps);
  const clearSelection = useStationStore((s) => s.clearSelection);

  const [panelTab, setPanelTab] = useState<"inspector" | "list">("inspector");
  const [countInput, setCountInput] = useState(String(pumpCount));
  const [countError, setCountError] = useState<string | null>(null);

  useEffect(() => {
    setCountInput(String(pumpCount));
  }, [pumpCount]);

  const handleCountInputChange = (raw: string) => {
    setCountInput(raw);
    const trimmed = raw.trim();
    if (trimmed === "") {
      setCountError(`Enter between ${MIN_PUMPS} and ${MAX_PUMPS} pumps`);
      return;
    }
    if (!/^\d+$/.test(trimmed)) {
      setCountError("Enter a whole number");
      return;
    }
    const parsed = Number(trimmed);
    if (parsed < MIN_PUMPS || parsed > MAX_PUMPS) {
      setCountError(`Choose between ${MIN_PUMPS} and ${MAX_PUMPS} pumps`);
      return;
    }
    setCountError(null);
    setPumpCount(parsed);
  };

  const allSelected = selectedPumpIds.length === pumpCount && pumpCount > 0;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground lg:h-screen lg:overflow-hidden">
      {/* Clean professional header bar */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Fuel className="h-4 w-4" />
          </div>
          <div>
            <h1 className="font-display text-base font-bold leading-none tracking-tight text-foreground">
              PumpShine
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              3D Station Cleaning Configurator
            </p>
          </div>
        </div>

        {/* Station pump count setup + Select all */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <label htmlFor="pump-count-input" className="text-xs font-medium text-muted-foreground">
              Pumps
            </label>
            <div className="flex items-center rounded-md border border-input bg-background">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-7 rounded-r-none"
                aria-label="Decrease pump count"
                disabled={pumpCount <= MIN_PUMPS}
                onClick={() => {
                  setCountError(null);
                  setPumpCount(pumpCount - 1);
                }}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <Input
                id="pump-count-input"
                inputMode="numeric"
                aria-label="Total number of pumps"
                value={countInput}
                onChange={(e) => handleCountInputChange(e.target.value)}
                onBlur={() => {
                  if (countError) {
                    setCountInput(String(pumpCount));
                    setCountError(null);
                  }
                }}
                className="h-8 w-12 border-0 bg-transparent px-1 text-center font-display text-sm font-semibold shadow-none focus-visible:ring-0"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-7 rounded-l-none"
                aria-label="Increase pump count"
                disabled={pumpCount >= MAX_PUMPS}
                onClick={() => {
                  setCountError(null);
                  setPumpCount(pumpCount + 1);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="hidden items-center gap-1 md:flex">
              {QUICK_COUNTS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setCountError(null);
                    setPumpCount(n);
                  }}
                  className={cn(
                    "rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                    pumpCount === n
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={allSelected ? "default" : "outline"}
              className="h-8 gap-1.5 text-xs"
              onClick={allSelected ? clearSelection : selectAllPumps}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              {allSelected ? "All selected" : "Select all"}
            </Button>
            {selectedPumpIds.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 gap-1 px-2 text-xs text-muted-foreground"
                onClick={clearSelection}
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </header>

      {countError && (
        <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-1.5 text-xs font-medium text-destructive">
          {countError}
        </div>
      )}

      {/* Main split workspace: 3D station viewport + synchronized inspector/list panel */}
      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section
          aria-label="Interactive 3D gas station"
          className="relative h-[52vh] min-h-[340px] w-full shrink-0 lg:h-full lg:flex-1"
        >
          <StationCanvas />
        </section>

        <aside className="flex w-full flex-col border-t border-border bg-card lg:h-full lg:w-[400px] lg:shrink-0 lg:border-l lg:border-t-0 xl:w-[430px]">
          {/* Mode tabs: 3D Inspector vs Matching List View */}
          <div className="grid shrink-0 grid-cols-2 border-b border-border bg-muted/40 p-1.5">
            <button
              type="button"
              onClick={() => setPanelTab("inspector")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-colors",
                panelTab === "inspector"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Box className="h-3.5 w-3.5" />
              Cleaning Areas
            </button>
            <button
              type="button"
              onClick={() => setPanelTab("list")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-colors",
                panelTab === "list"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <List className="h-3.5 w-3.5" />
              List View ({pumpCount})
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {panelTab === "inspector" ? (
              <PumpInspectorPanel />
            ) : (
              <PumpListView onInspectPump={() => setPanelTab("inspector")} />
            )}
          </div>

          <SelectionSummaryBar />
        </aside>
      </main>
    </div>
  );
}
