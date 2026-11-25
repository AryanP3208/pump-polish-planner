import { Check, Eye } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { buildStationLayout } from "@/station/layout";
import { isEntirePumpSelected, useStationStore } from "@/station/store";
import {
  PUMP_PARTS,
  SURROUNDING_AREAS,
  type PumpPartId,
  type SurroundingAreaId,
} from "@/station/types";
import { cn } from "@/lib/utils";

interface PumpListViewProps {
  onInspectPump?: (pumpId: number) => void;
}

export function PumpListView({ onInspectPump }: PumpListViewProps) {
  const pumpCount = useStationStore((s) => s.pumpCount);
  const selectedPumpIds = useStationStore((s) => s.selectedPumpIds);
  const focusedPumpId = useStationStore((s) => s.focusedPumpId);
  const configs = useStationStore((s) => s.configs);
  const togglePumpSelected = useStationStore((s) => s.togglePumpSelected);
  const focusPump = useStationStore((s) => s.focusPump);
  const toggleEntirePump = useStationStore((s) => s.toggleEntirePump);
  const togglePumpPart = useStationStore((s) => s.togglePumpPart);
  const toggleSurroundingArea = useStationStore((s) => s.toggleSurroundingArea);

  const layout = useMemo(() => buildStationLayout(pumpCount), [pumpCount]);

  return (
    <div className="flex flex-col gap-2.5 px-4 py-3.5">
      {layout.pumps.map((pump) => {
        const selected = selectedPumpIds.includes(pump.id);
        const focused = focusedPumpId === pump.id;
        const cfg = configs[pump.id];
        const entire = isEntirePumpSelected(cfg);

        return (
          <div
            key={pump.id}
            className={cn(
              "rounded-lg border p-3 transition-colors",
              focused
                ? "border-primary bg-primary/5"
                : selected
                  ? "border-clean/60 bg-card"
                  : "border-border bg-card",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => togglePumpSelected(pump.id)}
                className="flex items-center gap-2.5 text-left"
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-md border",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background",
                  )}
                >
                  {selected && <Check className="h-3.5 w-3.5" />}
                </span>
                <div>
                  <div className="font-display text-sm font-semibold text-foreground">
                    Pump #{pump.id}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Island {pump.islandIndex + 1}
                  </div>
                </div>
              </button>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant={entire ? "default" : "outline"}
                  className="h-7 px-2 text-xs"
                  onClick={() => toggleEntirePump(pump.id)}
                >
                  {entire ? "Full pump" : "Entire pump"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-7 gap-1 px-2 text-xs"
                  onClick={() => {
                    focusPump(pump.id);
                    onInspectPump?.(pump.id);
                  }}
                >
                  <Eye className="h-3.5 w-3.5" />
                  3D
                </Button>
              </div>
            </div>

            {/* Compact clickable cleaning area pills */}
            <div className="mt-2.5 flex flex-wrap gap-1">
              {PUMP_PARTS.map((part) => {
                const id = part.id as PumpPartId;
                const active = Boolean(cfg?.parts.includes(id));
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => togglePumpPart(pump.id, id)}
                    className={cn(
                      "rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors",
                      active
                        ? "border-clean bg-clean text-clean-foreground"
                        : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {part.shortLabel}
                  </button>
                );
              })}
              {SURROUNDING_AREAS.map((area) => {
                const id = area.id as SurroundingAreaId;
                const active = Boolean(cfg?.surrounding.includes(id));
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleSurroundingArea(pump.id, id)}
                    className={cn(
                      "rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors",
                      active
                        ? "border-selection bg-selection text-selection-foreground"
                        : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {area.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}