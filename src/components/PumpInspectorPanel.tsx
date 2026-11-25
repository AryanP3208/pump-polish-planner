import { Check, CheckCheck, Copy, Layers, Sparkles, SquareDashedMousePointer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isEntirePumpSelected, useStationStore } from "@/station/store";
import { PUMP_PARTS, SURROUNDING_AREAS, type PumpPartId, type SurroundingAreaId } from "@/station/types";
import { cn } from "@/lib/utils";

export function PumpInspectorPanel() {
  const selectedPumpIds = useStationStore((s) => s.selectedPumpIds);
  const focusedPumpId = useStationStore((s) => s.focusedPumpId);
  const applyMode = useStationStore((s) => s.applyMode);
  const configs = useStationStore((s) => s.configs);
  const focusPump = useStationStore((s) => s.focusPump);
  const setApplyMode = useStationStore((s) => s.setApplyMode);
  const applyPumpConfigToAllSelected = useStationStore((s) => s.applyPumpConfigToAllSelected);
  const togglePumpPart = useStationStore((s) => s.togglePumpPart);
  const toggleEntirePump = useStationStore((s) => s.toggleEntirePump);
  const toggleSurroundingArea = useStationStore((s) => s.toggleSurroundingArea);
  const togglePumpSelected = useStationStore((s) => s.togglePumpSelected);

  const activePumpId = focusedPumpId ?? selectedPumpIds[0] ?? null;
  const activeConfig = activePumpId !== null ? configs[activePumpId] : undefined;
  const entirePump = isEntirePumpSelected(activeConfig);

  if (activePumpId === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">
          <SquareDashedMousePointer className="h-6 w-6" />
        </div>
        <h2 className="mt-4 font-display text-base font-semibold text-foreground">
          Select a fuel pump to begin
        </h2>
        <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
          Click any numbered pump in the 3D station to zoom in and pick cleaning areas, choose{" "}
          <span className="font-medium text-foreground">Select all</span> above, or use the List View.
        </p>
      </div>
    );
  }

  const selectedParts = new Set<PumpPartId>(activeConfig?.parts ?? []);
  const selectedSurrounding = new Set<SurroundingAreaId>(activeConfig?.surrounding ?? []);

  return (
    <div className="flex flex-col gap-4 px-4 py-3.5">
      {/* Selected pump switcher chips */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Selected pumps ({selectedPumpIds.length})
          </span>
          <button
            type="button"
            className="text-xs font-medium text-primary hover:underline"
            onClick={() => togglePumpSelected(activePumpId)}
          >
            Remove Pump #{activePumpId}
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedPumpIds.map((id) => {
            const isCurrent = id === activePumpId;
            const cfg = configs[id];
            const areaCount = (cfg?.parts.length ?? 0) + (cfg?.surrounding.length ?? 0);
            return (
              <button
                key={id}
                type="button"
                onClick={() => focusPump(id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                  isCurrent
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-border bg-card text-foreground hover:bg-secondary",
                )}
              >
                <span>#{id}</span>
                {areaCount > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.2 text-[10px] font-semibold",
                      isCurrent
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-accent text-accent-foreground",
                    )}
                  >
                    {areaCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Multi-pump apply mode control */}
      {selectedPumpIds.length > 1 && (
        <div className="rounded-lg border border-border bg-secondary/50 p-2.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span>Multi-pump choices</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setApplyMode("all-selected")}
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                applyMode === "all-selected"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-secondary",
              )}
            >
              Same for all ({selectedPumpIds.length})
            </button>
            <button
              type="button"
              onClick={() => setApplyMode("individual")}
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                applyMode === "individual"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-secondary",
              )}
            >
              Customize each
            </button>
          </div>
          {applyMode === "individual" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 h-7 w-full gap-1.5 text-xs"
              onClick={() => applyPumpConfigToAllSelected(activePumpId)}
            >
              <Copy className="h-3 w-3" />
              Apply Pump #{activePumpId}&apos;s areas to all selected
            </Button>
          )}
        </div>
      )}

      {/* Pump cleaning areas */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-sm font-semibold text-foreground">
            {applyMode === "all-selected" && selectedPumpIds.length > 1
              ? `Pump areas (all ${selectedPumpIds.length} selected)`
              : `Pump #${activePumpId} areas`}
          </h3>
          <Button
            type="button"
            size="sm"
            variant={entirePump ? "default" : "outline"}
            className="h-7 gap-1.5 text-xs"
            onClick={() => toggleEntirePump(activePumpId)}
          >
            {entirePump ? <CheckCheck className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
            Clean entire pump
          </Button>
        </div>

        <div className="mt-2.5 grid grid-cols-1 gap-1.5">
          {PUMP_PARTS.map((part) => {
            const id = part.id as PumpPartId;
            const active = selectedParts.has(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => togglePumpPart(activePumpId, id)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                  active
                    ? "border-clean bg-clean/10 text-foreground"
                    : "border-border bg-card text-foreground hover:bg-secondary/70",
                )}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium leading-tight">{part.label}</div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {part.description}
                  </div>
                </div>
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                    active
                      ? "border-clean bg-clean text-clean-foreground"
                      : "border-border bg-background",
                  )}
                >
                  {active && <Check className="h-3.5 w-3.5" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Surrounding areas with visible 3D boundary */}
      <div>
        <h3 className="font-display text-sm font-semibold text-foreground">Surrounding areas</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Highlights the exact cleaning boundary around the pump in 3D.
        </p>
        <div className="mt-2 grid grid-cols-1 gap-1.5">
          {SURROUNDING_AREAS.map((area) => {
            const id = area.id as SurroundingAreaId;
            const active = selectedSurrounding.has(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleSurroundingArea(activePumpId, id)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                  active
                    ? "border-selection bg-selection/10 text-foreground"
                    : "border-border bg-card text-foreground hover:bg-secondary/70",
                )}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium leading-tight">{area.label}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{area.description}</div>
                </div>
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                    active
                      ? "border-selection bg-selection text-selection-foreground"
                      : "border-border bg-background",
                  )}
                >
                  {active && <Check className="h-3.5 w-3.5" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}