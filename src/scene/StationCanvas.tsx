import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Compass, Minus, Plus, RotateCcw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { buildStationLayout } from "@/station/layout";
import { useStationStore } from "@/station/store";
import { PUMP_PARTS, SURROUNDING_AREAS } from "@/station/types";
import { CameraRig } from "./CameraRig";
import { FuelPump } from "./FuelPump";
import { StationEnvironment } from "./StationEnvironment";
import { SurroundingZones } from "./SurroundingZones";
import { createStationTextures } from "./textures";

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class CanvasErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false, message: "" };
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }
  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("3D scene error:", error, info);
  }
  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center bg-muted p-6 text-center">
          <p className="font-display text-base font-semibold text-foreground">
            Unable to load 3D station preview
          </p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {this.state.message || "Your browser could not initialize WebGL. You can still select pumps in the List View."}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

function FirstFrameSignal({ onReady }: { onReady: () => void }) {
  const fired = useRef(false);
  useFrame(() => {
    if (!fired.current) {
      fired.current = true;
      onReady();
    }
  });
  return null;
}

function StationWorld({ onReady }: { onReady: () => void }) {
  const pumpCount = useStationStore((s) => s.pumpCount);
  const layout = useMemo(() => buildStationLayout(pumpCount), [pumpCount]);
  const textures = useMemo(() => createStationTextures(), []);

  useEffect(() => () => textures.dispose(), [textures]);

  return (
    <>
      <color attach="background" args={["#d7e6f2"]} />
      <fog attach="fog" args={["#d7e6f2", 42, 108]} />

      {/* Natural daylight sky + directional sun shadows */}
      <hemisphereLight args={["#f3f8ff", "#a5b0a2", 1.12]} />
      <directionalLight
        position={[20, 28, 18]}
        intensity={1.75}
        color="#fff9ee"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-32}
        shadow-camera-right={32}
        shadow-camera-top={32}
        shadow-camera-bottom={-32}
        shadow-camera-near={2}
        shadow-camera-far={95}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-16, 12, 16]} intensity={0.62} color="#dceeff" />
      {/* Soft under-canopy bounce illumination so dispenser details read clearly */}
      <pointLight
        position={[0, layout.canopy.height - 0.55, 0]}
        intensity={16}
        distance={layout.canopy.width + 10}
        decay={1.6}
        color="#f8fcff"
      />

      {/* Local image-based lighting (no external HDR CDN fetches) */}
      <Environment resolution={128}>
        <Lightformer
          form="rect"
          intensity={2.1}
          color="#fffaf0"
          position={[0, 10, 4]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[24, 18, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.1}
          color="#bae0ff"
          position={[-14, 5, 0]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[22, 8, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.95}
          color="#e2e8f0"
          position={[14, 4, -4]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[22, 8, 1]}
        />
      </Environment>

      <StationEnvironment layout={layout} textures={textures} />

      {layout.pumps.map((pump) => (
        <group key={pump.id}>
          <FuelPump pump={pump} textures={textures} />
          <SurroundingZones pump={pump} />
        </group>
      ))}

      <CameraRig layout={layout} />
      <FirstFrameSignal onReady={onReady} />
    </>
  );
}

const AREA_LABEL_MAP = new Map(
  [...PUMP_PARTS, ...SURROUNDING_AREAS].map((item) => [item.id, item.label]),
);

export function StationCanvas() {
  const [ready, setReady] = useState(false);
  const focusedPumpId = useStationStore((s) => s.focusedPumpId);
  const hoveredTarget = useStationStore((s) => s.hoveredTarget);
  const focusPump = useStationStore((s) => s.focusPump);
  const issueCameraCommand = useStationStore((s) => s.issueCameraCommand);

  // Keyboard shortcut: Esc returns smoothly to full station overview
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && useStationStore.getState().focusedPumpId !== null) {
        focusPump(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [focusPump]);

  // Dev/verification hook on window.__station
  useEffect(() => {
    const api = {
      getState: () => useStationStore.getState(),
      setPumpCount: (n: number) => useStationStore.getState().setPumpCount(n),
      selectAndFocusPump: (id: number) => useStationStore.getState().selectAndFocusPump(id),
      focusPump: (id: number | null) => useStationStore.getState().focusPump(id),
      selectAllPumps: () => useStationStore.getState().selectAllPumps(),
      togglePumpPart: (id: number, part: Parameters<ReturnType<typeof useStationStore.getState>["togglePumpPart"]>[1]) =>
        useStationStore.getState().togglePumpPart(id, part),
      toggleSurroundingArea: (
        id: number,
        area: Parameters<ReturnType<typeof useStationStore.getState>["toggleSurroundingArea"]>[1],
      ) => useStationStore.getState().toggleSurroundingArea(id, area),
      toggleEntirePump: (id: number) => useStationStore.getState().toggleEntirePump(id),
    };
    (window as unknown as Record<string, unknown>)["__station"] = api;
    return () => {
      delete (window as unknown as Record<string, unknown>)["__station"];
    };
  }, []);

  const hoverLabel = hoveredTarget
    ? hoveredTarget.area === "pump"
      ? `Pump #${hoveredTarget.pumpId} — Click to inspect & select`
      : `Pump #${hoveredTarget.pumpId} · ${AREA_LABEL_MAP.get(hoveredTarget.area) ?? hoveredTarget.area} — Click to toggle`
    : null;

  return (
    <div
      className="relative h-full w-full touch-none select-none overflow-hidden bg-muted"
      data-scene-ready={ready ? "true" : undefined}
    >
      <CanvasErrorBoundary>
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ fov: 44, near: 0.2, far: 160 }}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.04,
          }}
          onPointerMissed={() => {
            useStationStore.getState().setHoveredTarget(null);
          }}
        >
          <StationWorld onReady={() => setReady(true)} />
        </Canvas>
      </CanvasErrorBoundary>

      {/* Top-left camera view indicator & back to overview control */}
      <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap items-center gap-2">
        <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-border/80 bg-card/92 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-md">
          <Compass className="h-3.5 w-3.5 text-primary" />
          <span>{focusedPumpId !== null ? `Inspecting Pump #${focusedPumpId}` : "Station overview"}</span>
        </div>
        {focusedPumpId !== null && (
          <Button
            size="sm"
            variant="secondary"
            className="pointer-events-auto h-8 gap-1.5 border border-border/80 bg-card/95 shadow-sm backdrop-blur-md"
            onClick={() => focusPump(null)}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Full station view
          </Button>
        )}
      </div>

      {/* Interactive hover callout */}
      {hoverLabel && (
        <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-primary/30 bg-card/95 px-3.5 py-1.5 text-xs font-medium text-foreground shadow-md backdrop-blur-md">
          {hoverLabel}
        </div>
      )}

      {/* Bottom-left navigation hint & bottom-right camera zoom controls */}
      <div className="pointer-events-none absolute bottom-3 left-3 hidden rounded-lg border border-border/70 bg-card/88 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur-md sm:block">
        {focusedPumpId !== null
          ? "Click pump parts, island, or pavement to toggle cleaning · Drag to orbit"
          : "Drag to rotate · Scroll or pinch to zoom · Click any pump to zoom in"}
      </div>

      <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg border border-border/80 bg-card/92 p-1 shadow-sm backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Zoom in"
          onClick={() => issueCameraCommand("zoom-in")}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Zoom out"
          onClick={() => issueCameraCommand("zoom-out")}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2.5 text-xs"
          onClick={() => focusPump(null)}
        >
          Overview
        </Button>
      </div>
    </div>
  );
}