import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { useStationStore } from "@/station/store";
import type { PumpPlacement, SurroundingAreaId } from "@/station/types";

interface SurroundingZonesProps {
  pump: PumpPlacement;
}

interface PerimeterFrameProps {
  width: number;
  depth: number;
  thickness: number;
  y: number;
  color: string;
  opacity: number;
}

/** Clean glowing 3D boundary perimeter rectangle showing exact cleaning footprint */
function PerimeterFrame({ width, depth, thickness, y, color, opacity }: PerimeterFrameProps) {
  const hw = width / 2;
  const hd = depth / 2;
  const cornerLen = Math.min(0.65, width * 0.22, depth * 0.22);

  return (
    <group position={[0, y, 0]}>
      {/* Four crisp perimeter rails */}
      <mesh position={[0, 0, hd]}>
        <boxGeometry args={[width, 0.022, thickness]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, 0, -hd]}>
        <boxGeometry args={[width, 0.022, thickness]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </mesh>
      <mesh position={[hw, 0, 0]}>
        <boxGeometry args={[thickness, 0.022, depth]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </mesh>
      <mesh position={[-hw, 0, 0]}>
        <boxGeometry args={[thickness, 0.022, depth]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </mesh>

      {/* Corner accent markers */}
      {[
        [-hw, -hd],
        [hw, -hd],
        [-hw, hd],
        [hw, hd],
      ].map(([cx, cz], i) => (
        <mesh key={i} position={[cx ?? 0, 0.012, cz ?? 0]}>
          <boxGeometry args={[cornerLen * 0.3, 0.026, cornerLen * 0.3]} />
          <meshBasicMaterial color={color} transparent opacity={Math.min(1, opacity + 0.15)} />
        </mesh>
      ))}
    </group>
  );
}

export function SurroundingZones({ pump }: SurroundingZonesProps) {
  const isFocused = useStationStore((s) => s.focusedPumpId === pump.id);
  const config = useStationStore((s) => s.configs[pump.id]);
  const hoveredTarget = useStationStore((s) => s.hoveredTarget);
  const toggleSurroundingArea = useStationStore((s) => s.toggleSurroundingArea);
  const setHoveredTarget = useStationStore((s) => s.setHoveredTarget);

  const islandSelected = Boolean(config?.surrounding.includes("island"));
  const pavementSelected = Boolean(config?.surrounding.includes("pavement"));
  const islandHovered =
    hoveredTarget?.pumpId === pump.id && hoveredTarget.area === "island";
  const pavementHovered =
    hoveredTarget?.pumpId === pump.id && hoveredTarget.area === "pavement";

  const handleClick = (area: SurroundingAreaId) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    toggleSurroundingArea(pump.id, area);
  };

  const handleOver = (area: SurroundingAreaId) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = "pointer";
    setHoveredTarget({ pumpId: pump.id, area });
  };

  const handleOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = "auto";
    setHoveredTarget(null);
  };

  const islandZoneLen = Math.min(pump.pavementLength - 0.15, 4.4);
  const islandZoneWid = pump.islandWidth + 0.12;
  const showIsland = islandSelected || isFocused || islandHovered;
  const showPavement = pavementSelected || isFocused || pavementHovered;

  return (
    <group position={[pump.x, 0, pump.z]}>
      {/* PUMP ISLAND CLEANING ZONE + VISIBLE BOUNDARY */}
      {showIsland && (
        <group
          onClick={handleClick("island")}
          onPointerOver={handleOver("island")}
          onPointerOut={handleOut}
        >
          <mesh position={[0, 0.172, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[islandZoneLen, islandZoneWid]} />
            <meshBasicMaterial
              color={islandSelected ? "#0d9488" : "#38bdf8"}
              transparent
              opacity={islandSelected ? 0.34 : islandHovered ? 0.22 : 0.08}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <PerimeterFrame
            width={islandZoneLen}
            depth={islandZoneWid}
            thickness={islandSelected ? 0.08 : 0.045}
            y={0.18}
            color={islandSelected ? "#14b8a6" : "#38bdf8"}
            opacity={islandSelected ? 0.96 : islandHovered ? 0.8 : 0.42}
          />
        </group>
      )}

      {/* NEARBY PAVEMENT CLEANING ZONE + VISIBLE BOUNDARY */}
      {showPavement && (
        <group
          onClick={handleClick("pavement")}
          onPointerOver={handleOver("pavement")}
          onPointerOut={handleOut}
        >
          {/* Two flanking fueling-apron lanes (front +Z and back -Z of the island) */}
          {[1, -1].map((side) => {
            const laneDepth = (pump.pavementWidth - pump.islandWidth) / 2;
            const laneCenterZ = side * (pump.islandWidth / 2 + laneDepth / 2 + 0.04);
            return (
              <mesh
                key={side}
                position={[0, 0.022, laneCenterZ]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <planeGeometry args={[pump.pavementLength, laneDepth]} />
                <meshBasicMaterial
                  color={pavementSelected ? "#0284c7" : "#60a5fa"}
                  transparent
                  opacity={pavementSelected ? 0.28 : pavementHovered ? 0.18 : 0.06}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                />
              </mesh>
            );
          })}
          <PerimeterFrame
            width={pump.pavementLength}
            depth={pump.pavementWidth}
            thickness={pavementSelected ? 0.11 : 0.06}
            y={0.03}
            color={pavementSelected ? "#0ea5e9" : "#60a5fa"}
            opacity={pavementSelected ? 0.96 : pavementHovered ? 0.78 : 0.38}
          />
        </group>
      )}
    </group>
  );
}