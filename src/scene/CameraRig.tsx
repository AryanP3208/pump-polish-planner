import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { getPumpFocusCamera } from "@/station/layout";
import { useStationStore } from "@/station/store";
import type { StationLayout } from "@/station/types";

interface CameraRigProps {
  layout: StationLayout;
}

const CAM_DAMPING = 5.4;
const EPSILON = 0.03;

export function CameraRig({ layout }: CameraRigProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const { camera } = useThree();
  const cameraCommand = useStationStore((s) => s.cameraCommand);

  const animatingRef = useRef(false);
  const desiredPosRef = useRef(new THREE.Vector3(...layout.overviewCamera.position));
  const desiredTargetRef = useRef(new THREE.Vector3(...layout.overviewCamera.target));
  const hasInitializedRef = useRef(false);

  // Position camera cleanly on first mount
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    camera.position.set(...layout.overviewCamera.position);
    if (controlsRef.current) {
      controlsRef.current.target.set(...layout.overviewCamera.target);
      controlsRef.current.update();
    }
  }, [camera, layout.overviewCamera.position, layout.overviewCamera.target]);

  // Respond to explicit camera commands (overview, focus pump, zoom in/out)
  useEffect(() => {
    if (!cameraCommand) return;
    const controls = controlsRef.current;

    if (cameraCommand.type === "overview") {
      desiredPosRef.current.set(...layout.overviewCamera.position);
      desiredTargetRef.current.set(...layout.overviewCamera.target);
      animatingRef.current = true;
      return;
    }

    if (cameraCommand.type === "focus" && cameraCommand.pumpId !== undefined) {
      const pump = layout.pumps.find((p) => p.id === cameraCommand.pumpId);
      if (!pump) return;
      const focusCam = getPumpFocusCamera(pump);
      desiredPosRef.current.set(...focusCam.position);
      desiredTargetRef.current.set(...focusCam.target);
      animatingRef.current = true;
      return;
    }

    if ((cameraCommand.type === "zoom-in" || cameraCommand.type === "zoom-out") && controls) {
      const dir = new THREE.Vector3().subVectors(camera.position, controls.target);
      const currentDist = dir.length();
      const factor = cameraCommand.type === "zoom-in" ? 0.72 : 1.35;
      const nextDist = THREE.MathUtils.clamp(currentDist * factor, 2.2, 52);
      dir.normalize().multiplyScalar(nextDist);
      desiredPosRef.current.copy(controls.target).add(dir);
      desiredTargetRef.current.copy(controls.target);
      animatingRef.current = true;
    }
  }, [camera, cameraCommand, layout]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (animatingRef.current) {
      const dt = Math.min(delta, 0.05);
      const alpha = 1 - Math.exp(-CAM_DAMPING * dt);
      camera.position.lerp(desiredPosRef.current, alpha);
      controls.target.lerp(desiredTargetRef.current, alpha);

      if (
        camera.position.distanceTo(desiredPosRef.current) < EPSILON &&
        controls.target.distanceTo(desiredTargetRef.current) < EPSILON
      ) {
        camera.position.copy(desiredPosRef.current);
        controls.target.copy(desiredTargetRef.current);
        animatingRef.current = false;
      }
    }
    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={1.9}
      maxDistance={58}
      maxPolarAngle={Math.PI / 2 - 0.04}
      minPolarAngle={0.14}
      rotateSpeed={0.78}
      zoomSpeed={0.85}
      panSpeed={0.8}
      onStart={() => {
        // Yield immediately when the user orbits, pans, or pinch-zooms
        animatingRef.current = false;
      }}
    />
  );
}