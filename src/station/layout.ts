import {
  MAX_PUMPS,
  MIN_PUMPS,
  type IslandPlacement,
  type PumpPlacement,
  type StationLayout,
} from "./types";

// Physical station dimensions in meters (1 unit = 1 meter)
const PUMP_SPACING_X = 5.4; // center-to-center distance along an island
const LANE_SPACING_Z = 7.4; // drive lane width between parallel islands
const ISLAND_WIDTH = 1.55;
const ISLAND_END_PAD = 2.0; // extra curb length past outermost pumps
const CANOPY_HEIGHT = 5.35;
const CANOPY_FASCIA_HEIGHT = 0.86;
const PAVEMENT_ZONE_LENGTH = 4.9;
const PAVEMENT_ZONE_WIDTH = 5.8;

export function clampPumpCount(raw: number): number {
  if (!Number.isFinite(raw)) return MIN_PUMPS;
  return Math.max(MIN_PUMPS, Math.min(MAX_PUMPS, Math.round(raw)));
}

/**
 * Chooses realistic parallel island rows for any pump count (1..24).
 * Examples:
 *  1-2 -> 1 island
 *  3-6 -> 2 islands
 *  7-12 -> 2 or 3 islands (max 4 per island)
 *  13-24 -> 3 to 4 islands (max 6 per island)
 */
export function computeIslandDistribution(pumpCount: number): number[] {
  const count = clampPumpCount(pumpCount);
  let rows = 1;
  if (count <= 2) rows = 1;
  else if (count <= 8) rows = 2;
  else if (count <= 15) rows = 3;
  else rows = 4;

  const base = Math.floor(count / rows);
  const remainder = count % rows;
  const distribution: number[] = [];
  for (let r = 0; r < rows; r++) {
    distribution.push(base + (r < remainder ? 1 : 0));
  }
  return distribution;
}

export function buildStationLayout(pumpCountInput: number): StationLayout {
  const pumpCount = clampPumpCount(pumpCountInput);
  const rowCounts = computeIslandDistribution(pumpCount);
  const numRows = rowCounts.length;
  const maxPerRow = Math.max(...rowCounts);

  const pumps: PumpPlacement[] = [];
  const islands: IslandPlacement[] = [];

  // Center the canopy rows around Z = 0, with the convenience store behind (-Z)
  const totalRowSpanZ = (numRows - 1) * LANE_SPACING_Z;
  let nextPumpId = 1;

  for (let rowIdx = 0; rowIdx < numRows; rowIdx++) {
    const pumpsInRow = rowCounts[rowIdx] ?? 1;
    const z = (rowIdx - (numRows - 1) / 2) * LANE_SPACING_Z;
    const rowSpanX = (pumpsInRow - 1) * PUMP_SPACING_X;
    const islandLength = Math.max(4.6, rowSpanX + ISLAND_END_PAD * 2);
    const islandPumpIds: number[] = [];

    for (let slot = 0; slot < pumpsInRow; slot++) {
      const x = (slot - (pumpsInRow - 1) / 2) * PUMP_SPACING_X;
      const id = nextPumpId++;
      islandPumpIds.push(id);
      pumps.push({
        id,
        islandIndex: rowIdx,
        slotIndex: slot,
        x,
        z,
        islandCenterX: 0,
        islandCenterZ: z,
        islandLength,
        islandWidth: ISLAND_WIDTH,
        pavementLength: Math.min(PAVEMENT_ZONE_LENGTH, PUMP_SPACING_X - 0.35),
        pavementWidth: PAVEMENT_ZONE_WIDTH,
      });
    }

    // Place canopy columns symmetrically along the island outside or between pumps
    const columnXs: number[] = [];
    if (pumpsInRow === 1) {
      columnXs.push(-1.65, 1.65);
    } else if (pumpsInRow === 2) {
      columnXs.push(0);
    } else if (pumpsInRow <= 4) {
      const offset = rowSpanX / 2 - PUMP_SPACING_X * 0.5;
      columnXs.push(-offset, offset);
    } else {
      const step = rowSpanX / 3;
      columnXs.push(-rowSpanX / 2 + step * 0.5, 0, rowSpanX / 2 - step * 0.5);
    }

    islands.push({
      index: rowIdx,
      x: 0,
      z,
      length: islandLength,
      width: ISLAND_WIDTH,
      pumpIds: islandPumpIds,
      columnXs,
    });
  }

  const canopyWidth = Math.max(11.5, (maxPerRow - 1) * PUMP_SPACING_X + 8.6);
  const canopyDepth = Math.max(8.8, totalRowSpanZ + 7.6);

  const storeWidth = Math.max(15.5, Math.min(26, canopyWidth + 2.5));
  const storeDepth = 7.4;
  const storeHeight = 4.35;
  const storeCenterZ = -(canopyDepth / 2 + 9.2);

  const lotWidth = Math.max(36, canopyWidth + 18);
  const lotDepth = Math.max(36, canopyDepth + 26);

  // Overview camera scales cleanly with the station footprint so every pump + store fits nicely
  const span = Math.max(canopyWidth, canopyDepth + 6);
  const camDist = Math.max(19.5, span * 1.04);
  // Keep the overview camera at an inviting 3/4 forecourt height looking beneath the canopy
  // so front & rear pumps, canopy lighting, and convenience store facade are all visible together
  const camHeight = Math.min(7.8, Math.max(5.4, span * 0.27));

  return {
    pumpCount,
    pumps,
    islands,
    canopy: {
      centerX: 0,
      centerZ: 0,
      width: canopyWidth,
      depth: canopyDepth,
      height: CANOPY_HEIGHT,
      fasciaHeight: CANOPY_FASCIA_HEIGHT,
    },
    store: {
      centerX: 0,
      centerZ: storeCenterZ,
      width: storeWidth,
      depth: storeDepth,
      height: storeHeight,
    },
    lot: {
      width: lotWidth,
      depth: lotDepth,
    },
    overviewCamera: {
      position: [camDist * 0.64, camHeight, camDist * 0.92],
      target: [0, 1.65, -2.2],
    },
  };
}

export function getPumpFocusCamera(pump: PumpPlacement): {
  position: [number, number, number];
  target: [number, number, number];
} {
  // Stand slightly angled in front of the pump face (+Z side) so display, buttons,
  // payment terminal, nozzle, hose, exterior, and base are all unobstructed and clickable
  return {
    position: [pump.x + 1.72, 1.85, pump.z + 3.15],
    target: [pump.x, 1.18, pump.z],
  };
}