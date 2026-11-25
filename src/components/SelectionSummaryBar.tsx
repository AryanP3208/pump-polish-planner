import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildSelectionSummary, useStationStore } from "@/station/store";
import { PUMP_PARTS, SURROUNDING_AREAS } from "@/station/types";

const PART_LABEL = new Map(PUMP_PARTS.map((p) => [p.id, p.shortLabel]));
const SURR_LABEL = new Map(SURROUNDING_AREAS.map((s) => [s.id, s.label]));

function formatPumpList(ids: number[]): string {
  if (ids.length === 1) return `Pump #${ids[0]}`;
  return `Pumps #${ids.join(", #")}`;
}

export function SelectionSummaryBar() {
  const pumpCount = useStationStore((s) => s.pumpCount);
  const selectedPumpIds = useStationStore((s) => s.selectedPumpIds);
  const configs = useStationStore((s) => s.configs);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const summary = useMemo(
    () => buildSelectionSummary(selectedPumpIds, configs),
    [selectedPumpIds, configs],
  );

  const canContinue = summary.configuredCount > 0;

  return (
    <>
      <div className="border-t border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">
            Live summary · {summary.selectedCount} of {pumpCount} pumps
          </span>
          <span className="text-muted-foreground">
            {summary.totalPartSelections + summary.totalSurroundingSelections} areas selected
          </span>
        </div>

        {summary.groups.length > 0 && (
          <div className="mt-2 max-h-24 space-y-1 overflow-y-auto pr-1 text-xs">
            {summary.groups.map((group) => {
              const partText = group.isFullPump
                ? "Entire pump"
                : group.parts.length > 0
                  ? group.parts.map((p) => PART_LABEL.get(p) ?? p).join(", ")
                  : "No pump parts";
              const surrText =
                group.surrounding.length > 0
                  ? ` + ${group.surrounding.map((s) => SURR_LABEL.get(s) ?? s).join(" & ")}`
                  : "";
              return (
                <div key={group.key} className="flex items-start justify-between gap-2 text-muted-foreground">
                  <span className="shrink-0 font-medium text-foreground">
                    {formatPumpList(group.pumpIds)}:
                  </span>
                  <span className="truncate text-right">
                    {partText}
                    {surrText}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <Button
          type="button"
          className="mt-3 w-full gap-2"
          disabled={!canContinue}
          onClick={() => {
            setConfirmed(false);
            setReviewOpen(true);
          }}
        >
          <span>
            {canContinue ? "Continue with cleaning plan" : "Select pumps & cleaning areas"}
          </span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              {confirmed ? "PumpShine scope confirmed" : "Review your station cleaning plan"}
            </DialogTitle>
            <DialogDescription>
              {confirmed
                ? "Your selected pumps and cleaning areas are ready for scheduling."
                : `${pumpCount}-pump station · ${summary.configuredCount} pump${summary.configuredCount === 1 ? "" : "s"} configured for cleaning.`}
            </DialogDescription>
          </DialogHeader>

          {confirmed ? (
            <div className="flex items-start gap-3 rounded-lg border border-clean/40 bg-clean/10 p-4 text-sm text-foreground">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-clean" />
              <div>
                <div className="font-medium">Cleaning scope locked in</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {summary.selectedCount} selected pumps · {summary.totalPartSelections} pump zones ·{" "}
                  {summary.totalSurroundingSelections} surrounding island &amp; pavement zones.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-h-72 space-y-2.5 overflow-y-auto py-1">
              {summary.groups.map((group) => (
                <div key={group.key} className="rounded-lg border border-border bg-secondary/40 p-3">
                  <div className="font-display text-sm font-semibold text-foreground">
                    {formatPumpList(group.pumpIds)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Pump areas: </span>
                    {group.isFullPump
                      ? "Clean entire pump (all 7 areas)"
                      : group.parts.length > 0
                        ? group.parts.map((p) => PART_LABEL.get(p) ?? p).join(", ")
                        : "None"}
                  </div>
                  {group.surrounding.length > 0 && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Surrounding areas: </span>
                      {group.surrounding.map((s) => SURR_LABEL.get(s) ?? s).join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => setReviewOpen(false)}>
              {confirmed ? "Edit selections" : "Back to station"}
            </Button>
            {!confirmed && (
              <Button type="button" onClick={() => setConfirmed(true)}>
                Confirm cleaning scope
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}