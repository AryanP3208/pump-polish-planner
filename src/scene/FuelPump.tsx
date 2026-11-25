import { Billboard } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useStationStore } from "@/station/store";
import type { PumpPartId, PumpPlacement } from "@/station/types";
import { createPumpNumberTexture, type StationTextureSet } from "./textures";

interface FuelPumpProps {
  pump: PumpPlacement;
  textures: StationTextureSet;
}

const CLEAN_COLOR = new THREE.Color("#06b6d4");
const HOVER_COLOR = new THREE.Color("#38bdf8");
const SELECTED_RING_COLOR = "#0ea5e9";
const FOCUSED_RING_COLOR = "#0284c7";

function partEmissive(isCleaned: boolean, isHovered: boolean) {
  if (isCleaned) {
    return {
      emissive: CLEAN_COLOR,
      emissiveIntensity: isHovered ? 0.62 : 0.44,
    };
  }
  if (isHovered) {
    return {
      emissive: HOVER_COLOR,
      emissiveIntensity: 0.32,
    };
  }
  return {
    emissive: new THREE.Color("#000000"),
    emissiveIntensity: 0,
  };
}

function useHoseGeometries() {
  return useMemo(() => {
    // Graceful realistic fuel hose hanging from overhead side swivel down to nozzle handle
    const makeHose = (side: 1 | -1) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.36 * side, 1.96, 0.24 * side),
        new THREE.Vector3(-0.48 * side, 1.56, 0.34 * side),
        new THREE.Vector3(-0.54 * side, 0.88, 0.33 * side),
        new THREE.Vector3(-0.46 * side, 0.56, 0.27 * side),
        new THREE.Vector3(-0.34 * side, 0.72, 0.27 * side),
        new THREE.Vector3(-0.29 * side, 1.03, 0.29 * side),
      ]);
      return new THREE.TubeGeometry(curve, 28, 0.023, 10, false);
    };
    const front = makeHose(1);
    const back = makeHose(-1);
    return { front, back };
  }, []);
}

export function FuelPump({ pump, textures }: FuelPumpProps) {
  const isSelected = useStationStore((s) => s.selectedPumpIds.includes(pump.id));
  const isFocused = useStationStore((s) => s.focusedPumpId === pump.id);
  const config = useStationStore((s) => s.configs[pump.id]);
  const hoveredTarget = useStationStore((s) => s.hoveredTarget);
  const selectAndFocusPump = useStationStore((s) => s.selectAndFocusPump);
  const togglePumpPart = useStationStore((s) => s.togglePumpPart);
  const setHoveredTarget = useStationStore((s) => s.setHoveredTarget);

  const cleanedParts = useMemo(() => new Set<PumpPartId>(config?.parts ?? []), [config]);
  const hoseGeos = useHoseGeometries();

  useEffect(() => {
    return () => {
      hoseGeos.front.dispose();
      hoseGeos.back.dispose();
    };
  }, [hoseGeos]);

  const badgeStatus = isFocused ? "focused" : isSelected ? "selected" : "idle";
  const badgeTexture = useMemo(
    () => createPumpNumberTexture(pump.id, badgeStatus),
    [pump.id, badgeStatus],
  );
  useEffect(() => () => badgeTexture.dispose(), [badgeTexture]);

  const isPartHovered = (part: PumpPartId) =>
    isFocused && hoveredTarget?.pumpId === pump.id && hoveredTarget.area === part;
  const isWholePumpHovered =
    !isFocused && hoveredTarget?.pumpId === pump.id && hoveredTarget.area === "pump";

  const handlePartClick = (part: PumpPartId) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!isFocused) {
      selectAndFocusPump(pump.id);
    } else {
      togglePumpPart(pump.id, part);
    }
  };

  const handlePartOver = (part: PumpPartId) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = "pointer";
    setHoveredTarget({ pumpId: pump.id, area: isFocused ? part : "pump" });
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = "auto";
    setHoveredTarget(null);
  };

  const baseGlow = partEmissive(cleanedParts.has("base"), isPartHovered("base") || isWholePumpHovered);
  const extGlow = partEmissive(
    cleanedParts.has("exterior"),
    isPartHovered("exterior") || isWholePumpHovered,
  );
  const dispGlow = partEmissive(
    cleanedParts.has("display"),
    isPartHovered("display") || isWholePumpHovered,
  );
  const btnGlow = partEmissive(
    cleanedParts.has("buttons"),
    isPartHovered("buttons") || isWholePumpHovered,
  );
  const payGlow = partEmissive(
    cleanedParts.has("paymentTerminal"),
    isPartHovered("paymentTerminal") || isWholePumpHovered,
  );
  const nozzleGlow = partEmissive(
    cleanedParts.has("nozzle"),
    isPartHovered("nozzle") || isWholePumpHovered,
  );
  const hoseGlow = partEmissive(
    cleanedParts.has("hose"),
    isPartHovered("hose") || isWholePumpHovered,
  );

  const renderFaceDetails = (side: 1 | -1) => {
    const zFace = 0.285 * side;
    const rotY = side === 1 ? 0 : Math.PI;

    return (
      <group key={side} rotation={[0, rotY, 0]}>
        {/* 3. DISPLAY SCREEN */}
        <group
          position={[0, 1.66, 0.285]}
          onClick={handlePartClick("display")}
          onPointerOver={handlePartOver("display")}
          onPointerOut={handlePointerOut}
        >
          <mesh castShadow>
            <boxGeometry args={[0.76, 0.44, 0.04]} />
            <meshStandardMaterial
              color={cleanedParts.has("display") ? "#38bdf8" : "#1c2430"}
              roughness={0.35}
              metalness={0.4}
              {...dispGlow}
            />
          </mesh>
          <mesh position={[0, 0, 0.022]}>
            <planeGeometry args={[0.7, 0.39]} />
            <meshStandardMaterial
              map={textures.displayScreen}
              roughness={0.14}
              metalness={0.1}
              emissive={cleanedParts.has("display") ? CLEAN_COLOR : new THREE.Color("#2b4257")}
              emissiveIntensity={cleanedParts.has("display") ? 0.55 : isPartHovered("display") ? 0.35 : 0.16}
            />
          </mesh>
        </group>

        {/* 4. OCTANE GRADE BUTTONS */}
        <group
          position={[0.04, 1.3, 0.295]}
          onClick={handlePartClick("buttons")}
          onPointerOver={handlePartOver("buttons")}
          onPointerOut={handlePointerOut}
        >
          <mesh castShadow>
            <boxGeometry args={[0.68, 0.22, 0.045]} />
            <meshStandardMaterial
              color={cleanedParts.has("buttons") ? "#22d3ee" : "#2d3748"}
              roughness={0.4}
              metalness={0.35}
              {...btnGlow}
            />
          </mesh>
          <mesh position={[0, 0, 0.025]}>
            <planeGeometry args={[0.64, 0.19]} />
            <meshStandardMaterial
              map={textures.octaneButtons}
              roughness={0.28}
              metalness={0.1}
              {...btnGlow}
            />
          </mesh>
          {/* Tactile 3D push-button bevels */}
          {[-0.24, -0.08, 0.08, 0.24].map((bx) => (
            <mesh key={bx} position={[bx, -0.02, 0.032]} castShadow>
              <boxGeometry args={[0.125, 0.12, 0.018]} />
              <meshStandardMaterial
                color={cleanedParts.has("buttons") ? "#a5f3fc" : "#e2e8f0"}
                transparent
                opacity={cleanedParts.has("buttons") ? 0.52 : 0.14}
                roughness={0.25}
                {...btnGlow}
              />
            </mesh>
          ))}
        </group>

        {/* 5. PAYMENT TERMINAL (Card reader, NFC, PIN shield, receipt slot) */}
        <group
          position={[0.17, 0.99, 0.305]}
          onClick={handlePartClick("paymentTerminal")}
          onPointerOver={handlePartOver("paymentTerminal")}
          onPointerOut={handlePointerOut}
        >
          <mesh castShadow>
            <boxGeometry args={[0.36, 0.3, 0.075]} />
            <meshStandardMaterial
              color={cleanedParts.has("paymentTerminal") ? "#0891b2" : "#242c38"}
              roughness={0.35}
              metalness={0.45}
              {...payGlow}
            />
          </mesh>
          <mesh position={[0, 0, 0.04]}>
            <planeGeometry args={[0.32, 0.26]} />
            <meshStandardMaterial
              map={textures.paymentFace}
              roughness={0.3}
              metalness={0.15}
              {...payGlow}
            />
          </mesh>
          {/* PIN pad privacy shield hood */}
          <mesh position={[-0.06, -0.05, 0.065]} castShadow>
            <boxGeometry args={[0.18, 0.13, 0.055]} />
            <meshStandardMaterial
              color={cleanedParts.has("paymentTerminal") ? "#22d3ee" : "#334155"}
              roughness={0.45}
              metalness={0.3}
              {...payGlow}
            />
          </mesh>
        </group>

        {/* 6. FUEL NOZZLE & HOLSTER BOOT */}
        <group
          position={[-0.27, 1.03, 0.285]}
          onClick={handlePartClick("nozzle")}
          onPointerOver={handlePartOver("nozzle")}
          onPointerOut={handlePointerOut}
        >
          {/* Recessed stainless holster pocket */}
          <mesh castShadow>
            <boxGeometry args={[0.19, 0.36, 0.07]} />
            <meshStandardMaterial
              color={cleanedParts.has("nozzle") ? "#38bdf8" : "#94a3b8"}
              roughness={0.28}
              metalness={0.78}
              {...nozzleGlow}
            />
          </mesh>
          {/* Nozzle ergonomic body sleeve */}
          <mesh position={[0, 0.02, 0.048]} rotation={[0.18, 0, 0]} castShadow>
            <boxGeometry args={[0.075, 0.21, 0.095]} />
            <meshStandardMaterial
              color={cleanedParts.has("nozzle") ? "#06b6d4" : "#15803d"}
              roughness={0.55}
              metalness={0.1}
              {...nozzleGlow}
            />
          </mesh>
          {/* Trigger guard & handle */}
          <mesh position={[0, -0.09, 0.065]} rotation={[0.28, 0, 0]} castShadow>
            <boxGeometry args={[0.052, 0.14, 0.085]} />
            <meshStandardMaterial
              color={cleanedParts.has("nozzle") ? "#67e8f9" : "#1e293b"}
              roughness={0.45}
              metalness={0.35}
              {...nozzleGlow}
            />
          </mesh>
          {/* Curved aluminum spout entering holster */}
          <mesh position={[0, 0.14, 0.028]} rotation={[-0.42, 0, 0]} castShadow>
            <cylinderGeometry args={[0.013, 0.016, 0.16, 12]} />
            <meshStandardMaterial
              color="#d1d5db"
              roughness={0.2}
              metalness={0.88}
              {...nozzleGlow}
            />
          </mesh>
        </group>

        {/* Decorative cabinet door seam & latch on lower exterior */}
        <mesh
          position={[0, 0.56, 0.285]}
          onClick={handlePartClick("exterior")}
          onPointerOver={handlePartOver("exterior")}
          onPointerOut={handlePointerOut}
        >
          <boxGeometry args={[0.78, 0.44, 0.016]} />
          <meshStandardMaterial
            color={cleanedParts.has("exterior") ? "#67e8f9" : "#dce3ea"}
            roughness={0.35}
            metalness={0.4}
            {...extGlow}
          />
        </mesh>
        <mesh position={[0, 0.72, 0.298]}>
          <cylinderGeometry args={[0.018, 0.018, 0.015, 12]} />
          <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.8} />
        </mesh>
        {/* Avoid unused warning on zFace */}
        <group position={[0, 0, zFace * 0]} />
      </group>
    );
  };

  return (
    <group position={[pump.x, 0.16, pump.z]}>
      {/* 1. PUMP BASE (plinth + stainless kickplate skirt) */}
      <group
        onClick={handlePartClick("base")}
        onPointerOver={handlePartOver("base")}
        onPointerOut={handlePointerOut}
      >
        <mesh position={[0, 0.09, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.08, 0.18, 0.64]} />
          <meshStandardMaterial
            color={cleanedParts.has("base") ? "#06b6d4" : "#4b5a6e"}
            roughness={0.44}
            metalness={0.48}
            {...baseGlow}
          />
        </mesh>
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.01, 0.15, 0.59]} />
          <meshStandardMaterial
            color={cleanedParts.has("base") ? "#67e8f9" : "#cbd5e1"}
            roughness={0.28}
            metalness={0.72}
            {...baseGlow}
          />
        </mesh>
      </group>

      {/* 2. PUMP EXTERIOR (lower cabinet, twin side columns, upper canopy header/valence) */}
      <group
        onClick={handlePartClick("exterior")}
        onPointerOver={handlePartOver("exterior")}
        onPointerOut={handlePointerOut}
      >
        {/* Core dispenser body */}
        <mesh position={[0, 1.13, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.92, 1.62, 0.56]} />
          <meshStandardMaterial
            color={cleanedParts.has("exterior") ? "#bae6fd" : "#eef2f6"}
            roughness={0.32}
            metalness={0.25}
            {...extGlow}
          />
        </mesh>
        {/* Side structural brushed-steel columns */}
        {[-0.47, 0.47].map((sx) => (
          <mesh key={sx} position={[sx, 1.15, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.13, 1.68, 0.59]} />
            <meshStandardMaterial
              color={cleanedParts.has("exterior") ? "#38bdf8" : "#2c4f78"}
              roughness={0.32}
              metalness={0.38}
              {...extGlow}
            />
          </mesh>
        ))}
        {/* Sculpted upper header / valence canopy */}
        <mesh position={[0, 2.09, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.14, 0.28, 0.66]} />
          <meshStandardMaterial
            color={cleanedParts.has("exterior") ? "#0ea5e9" : "#244366"}
            roughness={0.3}
            metalness={0.36}
            {...extGlow}
          />
        </mesh>
        {/* Brand stripe accent across upper valence */}
        <mesh position={[0, 2.02, 0]}>
          <boxGeometry args={[1.15, 0.055, 0.675]} />
          <meshStandardMaterial
            color={cleanedParts.has("exterior") ? "#67e8f9" : "#e05a2b"}
            roughness={0.35}
            metalness={0.2}
            {...extGlow}
          />
        </mesh>
      </group>

      {/* Dual-sided faces (+Z and -Z) */}
      {renderFaceDetails(1)}
      {renderFaceDetails(-1)}

      {/* 7. RUBBER FUEL HOSES (front & back) + breakaway swivels */}
      <group
        onClick={handlePartClick("hose")}
        onPointerOver={handlePartOver("hose")}
        onPointerOut={handlePointerOut}
      >
        <mesh geometry={hoseGeos.front} castShadow>
          <meshStandardMaterial
            color={cleanedParts.has("hose") ? "#06b6d4" : "#1a1f24"}
            roughness={0.78}
            metalness={0.08}
            {...hoseGlow}
          />
        </mesh>
        <mesh geometry={hoseGeos.back} castShadow>
          <meshStandardMaterial
            color={cleanedParts.has("hose") ? "#06b6d4" : "#1a1f24"}
            roughness={0.78}
            metalness={0.08}
            {...hoseGlow}
          />
        </mesh>
        {/* Overhead chrome hose swivel couplings */}
        {[1, -1].map((side) => (
          <mesh key={side} position={[-0.36 * side, 1.96, 0.24 * side]} castShadow>
            <cylinderGeometry args={[0.032, 0.032, 0.1, 12]} />
            <meshStandardMaterial
              color={cleanedParts.has("hose") ? "#67e8f9" : "#cbd5e1"}
              roughness={0.22}
              metalness={0.85}
              {...hoseGlow}
            />
          </mesh>
        ))}
      </group>

      {/* Selection highlight ring around pump base on the island */}
      {(isSelected || isWholePumpHovered) && (
        <group position={[0, 0.02, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.74, 0.86, 36]} />
            <meshBasicMaterial
              color={isFocused ? FOCUSED_RING_COLOR : SELECTED_RING_COLOR}
              transparent
              opacity={isFocused ? 0.95 : isSelected ? 0.8 : 0.48}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}

      {/* Always-readable camera-facing pump number badge */}
      <Billboard position={[0, 2.62, 0]} follow lockX={false} lockY={false} lockZ={false}>
        <mesh
          renderOrder={12}
          onClick={(e) => {
            e.stopPropagation();
            selectAndFocusPump(pump.id);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = "pointer";
            setHoveredTarget({ pumpId: pump.id, area: "pump" });
          }}
          onPointerOut={handlePointerOut}
        >
          <planeGeometry args={[1.04, 0.52]} />
          <meshBasicMaterial
            map={badgeTexture}
            transparent
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
      </Billboard>
    </group>
  );
}