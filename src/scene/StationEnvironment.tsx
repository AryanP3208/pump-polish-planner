import type { StationLayout } from "@/station/types";
import type { StationTextureSet } from "./textures";

interface StationEnvironmentProps {
  layout: StationLayout;
  textures: StationTextureSet;
}

export function StationEnvironment({ layout, textures }: StationEnvironmentProps) {
  const { canopy, islands, store, lot } = layout;
  const islandHeight = 0.16;

  // Parking stalls in front of the convenience store
  const parkingStallCount = Math.max(4, Math.floor((store.width - 2.4) / 2.75));
  const stallSpan = (parkingStallCount - 1) * 2.75;
  const parkingZ = store.centerZ + store.depth / 2 + 2.8;

  // Under-canopy LED downlight grid
  const lightRows = Math.max(2, islands.length);
  const lightCols = Math.max(3, Math.round(canopy.width / 4.2));

  return (
    <group>
      {/* Outer landscaped perimeter ground */}
      <mesh position={[0, -0.06, -2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[lot.width + 60, lot.depth + 60]} />
        <meshStandardMaterial color="#8fa37c" roughness={0.95} />
      </mesh>

      {/* Main asphalt forecourt lot */}
      <mesh position={[0, -0.01, -2.6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[lot.width, lot.depth]} />
        <meshStandardMaterial map={textures.asphalt} roughness={0.9} metalness={0.04} />
      </mesh>

      {/* Concrete fueling apron beneath the canopy */}
      <mesh
        position={[canopy.centerX, 0.004, canopy.centerZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[canopy.width + 2.2, canopy.depth + 2.4]} />
        <meshStandardMaterial map={textures.concrete} roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Concrete perimeter curb edging around forecourt */}
      {[
        { pos: [0, 0.06, lot.depth / 2 - 2.6] as [number, number, number], size: [lot.width, 0.14, 0.35] as [number, number, number] },
        { pos: [0, 0.06, -lot.depth / 2 - 2.6] as [number, number, number], size: [lot.width, 0.14, 0.35] as [number, number, number] },
        { pos: [-lot.width / 2, 0.06, -2.6] as [number, number, number], size: [0.35, 0.14, lot.depth] as [number, number, number] },
        { pos: [lot.width / 2, 0.06, -2.6] as [number, number, number], size: [0.35, 0.14, lot.depth] as [number, number, number] },
      ].map((curb, i) => (
        <mesh key={i} position={curb.pos} receiveShadow castShadow>
          <boxGeometry args={curb.size} />
          <meshStandardMaterial color="#cbd0d6" roughness={0.85} />
        </mesh>
      ))}

      {/* Drive-lane boundary stripes flanking the canopy */}
      {[-canopy.depth / 2 - 1.35, canopy.depth / 2 + 1.35].map((stripeZ, i) => (
        <mesh key={i} position={[0, 0.01, stripeZ]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[canopy.width + 1.6, 0.12]} />
          <meshBasicMaterial color="#f8fafc" transparent opacity={0.75} />
        </mesh>
      ))}

      {/* PUMP ISLANDS, BOLLARDS, CANOPY COLUMNS & VALETS */}
      {islands.map((island) => {
        const bodyLen = Math.max(1.2, island.length - island.width);
        const endCapOffset = bodyLen / 2;
        return (
          <group key={island.index} position={[island.x, 0, island.z]}>
            {/* Raised concrete island deck with rounded bullnose end-caps */}
            <mesh position={[0, islandHeight / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[bodyLen, islandHeight, island.width]} />
              <meshStandardMaterial map={textures.concrete} color="#d9dde2" roughness={0.82} />
            </mesh>
            {[-endCapOffset, endCapOffset].map((cx) => (
              <mesh key={cx} position={[cx, islandHeight / 2, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[island.width / 2, island.width / 2, islandHeight, 24]} />
                <meshStandardMaterial map={textures.concrete} color="#d9dde2" roughness={0.82} />
              </mesh>
            ))}

            {/* Painted safety curb trim along front & back edges */}
            {[-island.width / 2 - 0.005, island.width / 2 + 0.005].map((cz, i) => (
              <mesh key={i} position={[0, islandHeight / 2, cz]}>
                <boxGeometry args={[bodyLen, islandHeight * 0.72, 0.015]} />
                <meshStandardMaterial color="#e5a00d" roughness={0.65} />
              </mesh>
            ))}

            {/* Yellow steel safety bollards at both island ends */}
            {[-endCapOffset - 0.28, endCapOffset + 0.28].map((bx) => (
              <group key={bx} position={[bx, islandHeight, 0]}>
                <mesh position={[0, 0.48, 0]} castShadow>
                  <cylinderGeometry args={[0.085, 0.09, 0.96, 16]} />
                  <meshStandardMaterial color="#eab308" roughness={0.4} metalness={0.35} />
                </mesh>
                <mesh position={[0, 0.96, 0]}>
                  <sphereGeometry args={[0.085, 16, 10]} />
                  <meshStandardMaterial color="#eab308" roughness={0.35} metalness={0.35} />
                </mesh>
                <mesh position={[0, 0.72, 0]}>
                  <cylinderGeometry args={[0.089, 0.089, 0.1, 16]} />
                  <meshStandardMaterial color="#f8fafc" roughness={0.3} />
                </mesh>
              </group>
            ))}

            {/* Structural canopy support columns anchored on island */}
            {island.columnXs.map((colX, idx) => (
              <group key={idx} position={[colX, islandHeight, 0]}>
                {/* Steel safety bumper collar */}
                <mesh position={[0, 0.52, 0]} castShadow>
                  <boxGeometry args={[0.48, 1.04, 0.48]} />
                  <meshStandardMaterial color="#1e3a5f" roughness={0.45} metalness={0.4} />
                </mesh>
                {/* Main white architectural column */}
                <mesh position={[0, (canopy.height - islandHeight) / 2, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.42, canopy.height - islandHeight, 0.42]} />
                  <meshStandardMaterial color="#f1f5f9" roughness={0.4} metalness={0.2} />
                </mesh>
              </group>
            ))}
          </group>
        );
      })}

      {/* OVERHEAD FORECOURT CANOPY */}
      <group position={[canopy.centerX, canopy.height, canopy.centerZ]}>
        {/* Main canopy roof deck & recessed soffit */}
        <mesh position={[0, canopy.fasciaHeight / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[canopy.width, canopy.fasciaHeight, canopy.depth]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.42} metalness={0.18} />
        </mesh>
        {/* Architectural navy upper fascia band */}
        <mesh position={[0, canopy.fasciaHeight * 0.62, 0]} castShadow>
          <boxGeometry args={[canopy.width + 0.08, canopy.fasciaHeight * 0.56, canopy.depth + 0.08]} />
          <meshStandardMaterial color="#183049" roughness={0.35} metalness={0.35} />
        </mesh>
        {/* Terracotta-orange accent stripe */}
        <mesh position={[0, canopy.fasciaHeight * 0.24, 0]}>
          <boxGeometry args={[canopy.width + 0.12, 0.14, canopy.depth + 0.12]} />
          <meshStandardMaterial color="#e05a2b" roughness={0.35} metalness={0.2} />
        </mesh>
        {/* Recessed LED under-canopy downlights */}
        {Array.from({ length: lightRows }).map((_, r) =>
          Array.from({ length: lightCols }).map((__, c) => {
            const lx =
              lightCols === 1
                ? 0
                : ((c / (lightCols - 1)) - 0.5) * (canopy.width - 3.2);
            const lz =
              lightRows === 1
                ? 0
                : ((r / (lightRows - 1)) - 0.5) * (canopy.depth - 3.0);
            return (
              <mesh key={`${r}-${c}`} position={[lx, -0.015, lz]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.78, 0.78]} />
                <meshStandardMaterial
                  color="#ffffff"
                  emissive="#f0f9ff"
                  emissiveIntensity={0.85}
                  roughness={0.2}
                />
              </mesh>
            );
          }),
        )}
      </group>

      {/* CONVENIENCE-STORE EXTERIOR */}
      <group position={[store.centerX, 0, store.centerZ]}>
        {/* Storefront concrete sidewalk apron */}
        <mesh position={[0, 0.08, store.depth / 2 + 1.15]} receiveShadow castShadow>
          <boxGeometry args={[store.width + 2.4, 0.16, 2.3]} />
          <meshStandardMaterial map={textures.concrete} color="#d4d8dd" roughness={0.86} />
        </mesh>

        {/* Main brick building body */}
        <mesh position={[0, store.height / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[store.width, store.height, store.depth]} />
          <meshStandardMaterial map={textures.storeBrick} roughness={0.85} />
        </mesh>

        {/* Upper light stucco architectural parapet */}
        <mesh position={[0, store.height + 0.42, 0]} castShadow>
          <boxGeometry args={[store.width + 0.3, 0.88, store.depth + 0.3]} />
          <meshStandardMaterial color="#e8eaed" roughness={0.72} />
        </mesh>
        <mesh position={[0, store.height + 0.88, 0]}>
          <boxGeometry args={[store.width + 0.44, 0.12, store.depth + 0.44]} />
          <meshStandardMaterial color="#183049" roughness={0.45} metalness={0.3} />
        </mesh>

        {/* Storefront cantilevered entry awning */}
        <mesh position={[0, 3.35, store.depth / 2 + 0.72]} castShadow>
          <boxGeometry args={[store.width - 1.2, 0.24, 1.45]} />
          <meshStandardMaterial color="#183049" roughness={0.38} metalness={0.35} />
        </mesh>
        <mesh position={[0, 3.24, store.depth / 2 + 1.43]}>
          <boxGeometry args={[store.width - 1.18, 0.08, 0.05]} />
          <meshStandardMaterial color="#e05a2b" roughness={0.35} />
        </mesh>

        {/* Illuminated storefront fascia sign */}
        <mesh position={[0, store.height + 0.38, store.depth / 2 + 0.19]}>
          <boxGeometry args={[Math.min(store.width - 2.6, 11.4), 1.15, 0.14]} />
          <meshStandardMaterial map={textures.storeSign} roughness={0.3} />
        </mesh>

        {/* Wide storefront glass windows (left & right of center entrance) */}
        {[-store.width * 0.27, store.width * 0.27].map((wx, i) => (
          <group key={i} position={[wx, 1.65, store.depth / 2 + 0.03]}>
            {/* Aluminum window frame */}
            <mesh>
              <boxGeometry args={[store.width * 0.34, 2.35, 0.08]} />
              <meshStandardMaterial color="#334155" roughness={0.35} metalness={0.65} />
            </mesh>
            {/* Tinted reflective storefront glass */}
            <mesh position={[0, 0, 0.045]}>
              <planeGeometry args={[store.width * 0.32, 2.15]} />
              <meshStandardMaterial
                color="#3b5e78"
                roughness={0.12}
                metalness={0.6}
                emissive="#fef3c7"
                emissiveIntensity={0.14}
              />
            </mesh>
          </group>
        ))}

        {/* Double sliding glass entrance doors */}
        <group position={[0, 1.35, store.depth / 2 + 0.04]}>
          <mesh>
            <boxGeometry args={[2.5, 2.55, 0.1]} />
            <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.7} />
          </mesh>
          {[-0.58, 0.58].map((dx, i) => (
            <mesh key={i} position={[dx, 0, 0.055]}>
              <planeGeometry args={[1.05, 2.32]} />
              <meshStandardMaterial
                color="#4d738f"
                roughness={0.1}
                metalness={0.55}
                emissive="#fde68a"
                emissiveIntensity={0.22}
              />
            </mesh>
          ))}
        </group>

        {/* Exterior ice chest & propane cabinet props on sidewalk */}
        <mesh position={[-store.width / 2 + 1.4, 0.72, store.depth / 2 + 0.52]} castShadow>
          <boxGeometry args={[1.65, 1.15, 0.85]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.35} metalness={0.25} />
        </mesh>
        <mesh position={[store.width / 2 - 1.35, 0.88, store.depth / 2 + 0.52]} castShadow>
          <boxGeometry args={[1.3, 1.45, 0.82]} />
          <meshStandardMaterial color="#64748b" roughness={0.55} metalness={0.55} />
        </mesh>
      </group>

      {/* Parking stall striping & concrete wheel stops in front of C-store */}
      {Array.from({ length: parkingStallCount }).map((_, idx) => {
        const sx = -stallSpan / 2 + idx * 2.75;
        return (
          <group key={idx} position={[sx, 0, parkingZ]}>
            <mesh position={[0, 0.07, -1.05]} castShadow receiveShadow>
              <boxGeometry args={[1.65, 0.14, 0.22]} />
              <meshStandardMaterial color="#cbd5e1" roughness={0.85} />
            </mesh>
            {idx < parkingStallCount - 1 && (
              <mesh position={[1.375, 0.008, 0.45]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.1, 3.6]} />
                <meshBasicMaterial color="#f8fafc" transparent opacity={0.78} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}