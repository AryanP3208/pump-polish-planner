export type PumpPartId =
  | "exterior"
  | "display"
  | "buttons"
  | "paymentTerminal"
  | "nozzle"
  | "hose"
  | "base";

export type SurroundingAreaId = "island" | "pavement";

export type CleaningAreaId = PumpPartId | SurroundingAreaId;

export type ApplyMode = "all-selected" | "individual";

export interface CleaningAreaMeta {
  id: CleaningAreaId;
  label: string;
  shortLabel: string;
  description: string;
  category: "pump" | "surrounding";
}

export const PUMP_PARTS: readonly CleaningAreaMeta[] = [
  {
    id: "exterior",
    label: "Pump exterior",
    shortLabel: "Exterior",
    description: "Upper canopy header, side columns, and lower cabinet panels",
    category: "pump",
  },
  {
    id: "display",
    label: "Display screen",
    shortLabel: "Display",
    description: "Price, gallon, and overhead media glass panels",
    category: "pump",
  },
  {
    id: "buttons",
    label: "Grade buttons",
    shortLabel: "Buttons",
    description: "Octane fuel selector buttons and touch bezel",
    category: "pump",
  },
  {
    id: "paymentTerminal",
    label: "Payment terminal",
    shortLabel: "Payment",
    description: "Card reader, PIN pad shield, tap zone, and receipt slot",
    category: "pump",
  },
  {
    id: "nozzle",
    label: "Nozzle & boot",
    shortLabel: "Nozzle",
    description: "Fuel nozzle handle, spout guard, and holster sleeve",
    category: "pump",
  },
  {
    id: "hose",
    label: "Fuel hose",
    shortLabel: "Hose",
    description: "Rubber delivery hose, breakaway coupling, and retractor",
    category: "pump",
  },
  {
    id: "base",
    label: "Pump base",
    shortLabel: "Base",
    description: "Stainless kickplate, riser skirt, and lower plinth",
    category: "pump",
  },
] as const;

export const SURROUNDING_AREAS: readonly CleaningAreaMeta[] = [
  {
    id: "island",
    label: "Pump island",
    shortLabel: "Island",
    description: "Raised concrete curb deck and bollard base around this pump",
    category: "surrounding",
  },
  {
    id: "pavement",
    label: "Nearby pavement",
    shortLabel: "Pavement",
    description: "Adjacent concrete fueling apron and drive-lane oil-stain pad",
    category: "surrounding",
  },
] as const;

export const ALL_PUMP_PART_IDS: readonly PumpPartId[] = PUMP_PARTS.map(
  (p) => p.id as PumpPartId,
);

export const ALL_SURROUNDING_IDS: readonly SurroundingAreaId[] = SURROUNDING_AREAS.map(
  (a) => a.id as SurroundingAreaId,
);

export const MIN_PUMPS = 1;
export const MAX_PUMPS = 24;
export const DEFAULT_PUMP_COUNT = 6;

export interface PumpCleaningConfig {
  parts: PumpPartId[];
  surrounding: SurroundingAreaId[];
}

export interface PumpPlacement {
  id: number; // 1-based pump number
  islandIndex: number;
  slotIndex: number;
  x: number;
  z: number;
  islandCenterX: number;
  islandCenterZ: number;
  islandLength: number;
  islandWidth: number;
  pavementWidth: number;
  pavementLength: number;
}

export interface IslandPlacement {
  index: number;
  x: number;
  z: number;
  length: number;
  width: number;
  pumpIds: number[];
  columnXs: number[];
}

export interface StationLayout {
  pumpCount: number;
  pumps: PumpPlacement[];
  islands: IslandPlacement[];
  canopy: {
    centerX: number;
    centerZ: number;
    width: number;
    depth: number;
    height: number;
    fasciaHeight: number;
  };
  store: {
    centerX: number;
    centerZ: number;
    width: number;
    depth: number;
    height: number;
  };
  lot: {
    width: number;
    depth: number;
  };
  overviewCamera: {
    position: [number, number, number];
    target: [number, number, number];
  };
}