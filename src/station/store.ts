import { create } from "zustand";
import { clampPumpCount } from "./layout";
import {
  ALL_PUMP_PART_IDS,
  DEFAULT_PUMP_COUNT,
  type ApplyMode,
  type CleaningAreaId,
  type PumpCleaningConfig,
  type PumpPartId,
  type SurroundingAreaId,
} from "./types";

export interface SummaryGroup {
  key: string;
  pumpIds: number[];
  parts: PumpPartId[];
  surrounding: SurroundingAreaId[];
  isFullPump: boolean;
}

export interface SelectionSummary {
  selectedCount: number;
  configuredCount: number;
  totalPartSelections: number;
  totalSurroundingSelections: number;
  groups: SummaryGroup[];
}

export interface HoveredTarget {
  pumpId: number;
  area: CleaningAreaId | "pump";
}

export interface CameraCommand {
  type: "overview" | "focus" | "zoom-in" | "zoom-out";
  pumpId?: number;
  nonce: number;
}

export interface StationState {
  pumpCount: number;
  selectedPumpIds: number[];
  focusedPumpId: number | null;
  applyMode: ApplyMode;
  configs: Record<number, PumpCleaningConfig>;
  hoveredTarget: HoveredTarget | null;
  cameraCommand: CameraCommand | null;

  setPumpCount: (count: number) => void;
  selectAndFocusPump: (pumpId: number) => void;
  focusPump: (pumpId: number | null) => void;
  togglePumpSelected: (pumpId: number) => void;
  selectAllPumps: () => void;
  clearSelection: () => void;
  setApplyMode: (mode: ApplyMode) => void;
  applyPumpConfigToAllSelected: (sourcePumpId: number) => void;
  togglePumpPart: (pumpId: number, part: PumpPartId) => void;
  toggleEntirePump: (pumpId: number) => void;
  toggleSurroundingArea: (pumpId: number, area: SurroundingAreaId) => void;
  setHoveredTarget: (target: HoveredTarget | null) => void;
  issueCameraCommand: (type: CameraCommand["type"], pumpId?: number) => void;
}

export function emptyPumpConfig(): PumpCleaningConfig {
  return { parts: [], surrounding: [] };
}

export function cloneConfig(cfg?: PumpCleaningConfig): PumpCleaningConfig {
  if (!cfg) return emptyPumpConfig();
  return { parts: [...cfg.parts], surrounding: [...cfg.surrounding] };
}

export function isEntirePumpSelected(cfg?: PumpCleaningConfig): boolean {
  if (!cfg) return false;
  return ALL_PUMP_PART_IDS.every((part) => cfg.parts.includes(part));
}

export function getTemplateConfig(
  selectedPumpIds: number[],
  focusedPumpId: number | null,
  configs: Record<number, PumpCleaningConfig>,
): PumpCleaningConfig {
  if (focusedPumpId !== null && configs[focusedPumpId]) {
    return cloneConfig(configs[focusedPumpId]);
  }
  for (const id of selectedPumpIds) {
    const cfg = configs[id];
    if (cfg && (cfg.parts.length > 0 || cfg.surrounding.length > 0)) {
      return cloneConfig(cfg);
    }
  }
  return emptyPumpConfig();
}

export function buildSelectionSummary(
  selectedPumpIds: number[],
  configs: Record<number, PumpCleaningConfig>,
): SelectionSummary {
  const sortedIds = [...selectedPumpIds].sort((a, b) => a - b);
  const groupMap = new Map<string, SummaryGroup>();
  let configuredCount = 0;
  let totalPartSelections = 0;
  let totalSurroundingSelections = 0;

  for (const id of sortedIds) {
    const cfg = configs[id] ?? emptyPumpConfig();
    const parts = ALL_PUMP_PART_IDS.filter((p) => cfg.parts.includes(p));
    const surrounding = (["island", "pavement"] as const).filter((s) =>
      cfg.surrounding.includes(s),
    );
    if (parts.length > 0 || surrounding.length > 0) {
      configuredCount++;
    }
    totalPartSelections += parts.length;
    totalSurroundingSelections += surrounding.length;

    const key = `${parts.join(",")}|${surrounding.join(",")}`;
    const existing = groupMap.get(key);
    if (existing) {
      existing.pumpIds.push(id);
    } else {
      groupMap.set(key, {
        key,
        pumpIds: [id],
        parts,
        surrounding,
        isFullPump: parts.length === ALL_PUMP_PART_IDS.length,
      });
    }
  }

  return {
    selectedCount: sortedIds.length,
    configuredCount,
    totalPartSelections,
    totalSurroundingSelections,
    groups: Array.from(groupMap.values()),
  };
}

let commandNonce = 1;

export const useStationStore = create<StationState>((set) => ({
  pumpCount: DEFAULT_PUMP_COUNT,
  selectedPumpIds: [],
  focusedPumpId: null,
  applyMode: "all-selected",
  configs: {},
  hoveredTarget: null,
  cameraCommand: null,

  setPumpCount: (rawCount) =>
    set((state) => {
      const pumpCount = clampPumpCount(rawCount);
      const selectedPumpIds = state.selectedPumpIds.filter((id) => id <= pumpCount);
      const configs: Record<number, PumpCleaningConfig> = {};
      for (const [k, v] of Object.entries(state.configs)) {
        const id = Number(k);
        if (id <= pumpCount) configs[id] = v;
      }
      const focusedPumpId =
        state.focusedPumpId !== null && state.focusedPumpId <= pumpCount
          ? state.focusedPumpId
          : null;
      return {
        pumpCount,
        selectedPumpIds,
        configs,
        focusedPumpId,
        cameraCommand:
          focusedPumpId === null
            ? { type: "overview", nonce: ++commandNonce }
            : state.cameraCommand,
      };
    }),

  selectAndFocusPump: (pumpId) =>
    set((state) => {
      if (pumpId < 1 || pumpId > state.pumpCount) return state;
      const alreadySelected = state.selectedPumpIds.includes(pumpId);
      const nextSelected = alreadySelected
        ? state.selectedPumpIds
        : [...state.selectedPumpIds, pumpId].sort((a, b) => a - b);
      const nextConfigs = { ...state.configs };
      if (!alreadySelected) {
        nextConfigs[pumpId] =
          state.applyMode === "all-selected"
            ? getTemplateConfig(state.selectedPumpIds, state.focusedPumpId, state.configs)
            : emptyPumpConfig();
      }
      return {
        selectedPumpIds: nextSelected,
        focusedPumpId: pumpId,
        configs: nextConfigs,
        cameraCommand: { type: "focus", pumpId, nonce: ++commandNonce },
      };
    }),

  focusPump: (pumpId) =>
    set((state) => {
      if (pumpId === null) {
        return {
          focusedPumpId: null,
          cameraCommand: { type: "overview", nonce: ++commandNonce },
        };
      }
      if (pumpId < 1 || pumpId > state.pumpCount) return state;
      const alreadySelected = state.selectedPumpIds.includes(pumpId);
      const nextSelected = alreadySelected
        ? state.selectedPumpIds
        : [...state.selectedPumpIds, pumpId].sort((a, b) => a - b);
      const nextConfigs = { ...state.configs };
      if (!alreadySelected) {
        nextConfigs[pumpId] =
          state.applyMode === "all-selected"
            ? getTemplateConfig(state.selectedPumpIds, state.focusedPumpId, state.configs)
            : emptyPumpConfig();
      }
      return {
        selectedPumpIds: nextSelected,
        focusedPumpId: pumpId,
        configs: nextConfigs,
        cameraCommand: { type: "focus", pumpId, nonce: ++commandNonce },
      };
    }),

  togglePumpSelected: (pumpId) =>
    set((state) => {
      if (pumpId < 1 || pumpId > state.pumpCount) return state;
      const isSelected = state.selectedPumpIds.includes(pumpId);
      if (isSelected) {
        const nextSelected = state.selectedPumpIds.filter((id) => id !== pumpId);
        const nextConfigs = { ...state.configs };
        delete nextConfigs[pumpId];
        const nextFocus =
          state.focusedPumpId === pumpId ? (nextSelected[0] ?? null) : state.focusedPumpId;
        return {
          selectedPumpIds: nextSelected,
          configs: nextConfigs,
          focusedPumpId: nextFocus,
          cameraCommand:
            state.focusedPumpId === pumpId
              ? nextFocus !== null
                ? { type: "focus", pumpId: nextFocus, nonce: ++commandNonce }
                : { type: "overview", nonce: ++commandNonce }
              : state.cameraCommand,
        };
      }
      const nextSelected = [...state.selectedPumpIds, pumpId].sort((a, b) => a - b);
      const nextConfigs = {
        ...state.configs,
        [pumpId]:
          state.applyMode === "all-selected"
            ? getTemplateConfig(state.selectedPumpIds, state.focusedPumpId, state.configs)
            : emptyPumpConfig(),
      };
      return {
        selectedPumpIds: nextSelected,
        configs: nextConfigs,
      };
    }),

  selectAllPumps: () =>
    set((state) => {
      const allIds = Array.from({ length: state.pumpCount }, (_, i) => i + 1);
      const template =
        state.applyMode === "all-selected"
          ? getTemplateConfig(state.selectedPumpIds, state.focusedPumpId, state.configs)
          : emptyPumpConfig();
      const nextConfigs = { ...state.configs };
      for (const id of allIds) {
        if (!state.selectedPumpIds.includes(id)) {
          nextConfigs[id] = cloneConfig(template);
        }
      }
      return {
        selectedPumpIds: allIds,
        configs: nextConfigs,
      };
    }),

  clearSelection: () =>
    set(() => ({
      selectedPumpIds: [],
      focusedPumpId: null,
      configs: {},
      cameraCommand: { type: "overview", nonce: ++commandNonce },
    })),

  setApplyMode: (mode) => set(() => ({ applyMode: mode })),

  applyPumpConfigToAllSelected: (sourcePumpId) =>
    set((state) => {
      const source = cloneConfig(state.configs[sourcePumpId]);
      const nextConfigs = { ...state.configs };
      for (const id of state.selectedPumpIds) {
        nextConfigs[id] = cloneConfig(source);
      }
      return { configs: nextConfigs, applyMode: "all-selected" };
    }),

  togglePumpPart: (pumpId, part) =>
    set((state) => {
      const targets =
        state.applyMode === "all-selected" && state.selectedPumpIds.includes(pumpId)
          ? state.selectedPumpIds
          : [pumpId];
      const current = state.configs[pumpId] ?? emptyPumpConfig();
      const shouldAdd = !current.parts.includes(part);
      const nextSelected = state.selectedPumpIds.includes(pumpId)
        ? state.selectedPumpIds
        : [...state.selectedPumpIds, pumpId].sort((a, b) => a - b);
      const nextConfigs = { ...state.configs };
      for (const id of targets) {
        const cfg = cloneConfig(nextConfigs[id]);
        cfg.parts = shouldAdd
          ? Array.from(new Set([...cfg.parts, part]))
          : cfg.parts.filter((p) => p !== part);
        nextConfigs[id] = cfg;
      }
      return { selectedPumpIds: nextSelected, configs: nextConfigs };
    }),

  toggleEntirePump: (pumpId) =>
    set((state) => {
      const targets =
        state.applyMode === "all-selected" && state.selectedPumpIds.includes(pumpId)
          ? state.selectedPumpIds
          : [pumpId];
      const current = state.configs[pumpId] ?? emptyPumpConfig();
      const selectAllParts = !isEntirePumpSelected(current);
      const nextSelected = state.selectedPumpIds.includes(pumpId)
        ? state.selectedPumpIds
        : [...state.selectedPumpIds, pumpId].sort((a, b) => a - b);
      const nextConfigs = { ...state.configs };
      for (const id of targets) {
        const cfg = cloneConfig(nextConfigs[id]);
        cfg.parts = selectAllParts ? [...ALL_PUMP_PART_IDS] : [];
        nextConfigs[id] = cfg;
      }
      return { selectedPumpIds: nextSelected, configs: nextConfigs };
    }),

  toggleSurroundingArea: (pumpId, area) =>
    set((state) => {
      const targets =
        state.applyMode === "all-selected" && state.selectedPumpIds.includes(pumpId)
          ? state.selectedPumpIds
          : [pumpId];
      const current = state.configs[pumpId] ?? emptyPumpConfig();
      const shouldAdd = !current.surrounding.includes(area);
      const nextSelected = state.selectedPumpIds.includes(pumpId)
        ? state.selectedPumpIds
        : [...state.selectedPumpIds, pumpId].sort((a, b) => a - b);
      const nextConfigs = { ...state.configs };
      for (const id of targets) {
        const cfg = cloneConfig(nextConfigs[id]);
        cfg.surrounding = shouldAdd
          ? Array.from(new Set([...cfg.surrounding, area]))
          : cfg.surrounding.filter((s) => s !== area);
        nextConfigs[id] = cfg;
      }
      return { selectedPumpIds: nextSelected, configs: nextConfigs };
    }),

  setHoveredTarget: (hoveredTarget) => set(() => ({ hoveredTarget })),

  issueCameraCommand: (type, pumpId) =>
    set(() => ({
      cameraCommand:
        pumpId !== undefined
          ? { type, pumpId, nonce: ++commandNonce }
          : { type, nonce: ++commandNonce },
    })),
}));