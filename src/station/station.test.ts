import { beforeEach, describe, expect, it } from "vitest";
import { buildStationLayout, clampPumpCount, computeIslandDistribution } from "./layout";
import { buildSelectionSummary, isEntirePumpSelected, useStationStore } from "./store";
import { ALL_PUMP_PART_IDS, MAX_PUMPS, MIN_PUMPS } from "./types";

describe("station layout", () => {
  it("clamps invalid, negative, and out-of-range pump counts", () => {
    expect(clampPumpCount(0)).toBe(MIN_PUMPS);
    expect(clampPumpCount(-5)).toBe(MIN_PUMPS);
    expect(clampPumpCount(Number.NaN)).toBe(MIN_PUMPS);
    expect(clampPumpCount(100)).toBe(MAX_PUMPS);
    expect(clampPumpCount(10)).toBe(10);
  });

  it("builds clearly numbered pumps for 2, 10, and 16 pump stations", () => {
    const two = buildStationLayout(2);
    expect(two.pumps.map((p) => p.id)).toEqual([1, 2]);
    expect(two.islands).toHaveLength(1);

    const ten = buildStationLayout(10);
    expect(ten.pumps.map((p) => p.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(computeIslandDistribution(10)).toEqual([4, 3, 3]);
    expect(ten.canopy.width).toBeGreaterThan(two.canopy.width);

    const sixteen = buildStationLayout(16);
    expect(sixteen.pumps).toHaveLength(16);
    expect(sixteen.islands).toHaveLength(4);
  });
});

describe("station cleaning selection rules", () => {
  beforeEach(() => {
    useStationStore.setState({
      pumpCount: 6,
      selectedPumpIds: [],
      focusedPumpId: null,
      applyMode: "all-selected",
      configs: {},
      hoveredTarget: null,
      cameraCommand: null,
    });
  });

  it("applies cleaning choices to all selected pumps when in all-selected mode", () => {
    const store = useStationStore.getState();
    store.selectAndFocusPump(1);
    store.selectAndFocusPump(3);
    store.togglePumpPart(3, "display");
    store.togglePumpPart(3, "paymentTerminal");
    store.toggleSurroundingArea(3, "pavement");

    const next = useStationStore.getState();
    expect(next.selectedPumpIds).toEqual([1, 3]);
    expect(next.configs[1]?.parts).toEqual(["display", "paymentTerminal"]);
    expect(next.configs[3]?.parts).toEqual(["display", "paymentTerminal"]);
    expect(next.configs[1]?.surrounding).toEqual(["pavement"]);
    expect(next.configs[3]?.surrounding).toEqual(["pavement"]);
  });

  it("customizes each pump independently when in individual mode", () => {
    const store = useStationStore.getState();
    store.setApplyMode("individual");
    store.selectAndFocusPump(1);
    store.selectAndFocusPump(2);
    store.togglePumpPart(1, "nozzle");
    store.togglePumpPart(2, "hose");
    store.toggleSurroundingArea(2, "island");

    const next = useStationStore.getState();
    expect(next.configs[1]?.parts).toEqual(["nozzle"]);
    expect(next.configs[1]?.surrounding).toEqual([]);
    expect(next.configs[2]?.parts).toEqual(["hose"]);
    expect(next.configs[2]?.surrounding).toEqual(["island"]);

    const summary = buildSelectionSummary(next.selectedPumpIds, next.configs);
    expect(summary.selectedCount).toBe(2);
    expect(summary.groups).toHaveLength(2);
  });

  it("toggles clean entire pump and select all across the configured station", () => {
    const store = useStationStore.getState();
    store.setPumpCount(10);
    store.selectAllPumps();
    store.toggleEntirePump(1);

    const next = useStationStore.getState();
    expect(next.selectedPumpIds).toHaveLength(10);
    expect(isEntirePumpSelected(next.configs[1])).toBe(true);
    expect(next.configs[10]?.parts).toEqual([...ALL_PUMP_PART_IDS]);

    const summary = buildSelectionSummary(next.selectedPumpIds, next.configs);
    expect(summary.groups).toHaveLength(1);
    expect(summary.groups[0]?.isFullPump).toBe(true);
    expect(summary.totalPartSelections).toBe(10 * ALL_PUMP_PART_IDS.length);
  });

  it("trims selected pumps when the station pump count decreases", () => {
    const store = useStationStore.getState();
    store.setPumpCount(8);
    store.selectAllPumps();
    store.focusPump(8);
    store.setPumpCount(4);

    const next = useStationStore.getState();
    expect(next.selectedPumpIds).toEqual([1, 2, 3, 4]);
    expect(next.focusedPumpId).toBeNull();
  });
});