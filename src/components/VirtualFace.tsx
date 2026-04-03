import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Results } from '@mediapipe/face_mesh';

// Standard triangulation indices for MediaPipe FaceMesh
const FACE_TRIANGULATION = [
  127, 34, 139, 11, 0, 37, 232, 231, 230, 229, 228, 31, 226, 113, 225, 224, 223, 222, 221, 189, 244, 233, 232, 227, 116, 117, 118, 119, 120, 121, 128, 245, 
  33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33, 130, 247, 30, 29, 28, 27, 26, 25, 24, 23, 22, 243, 190, 56, 28,
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
  54, 103, 67, 109, 10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93,
  // Adding more connections for a fuller look
  10, 151, 9, 8, 168, 6, 197, 195, 5, 4, 1, 19, 94, 2, 164, 0, 11, 12, 13, 14, 15, 16, 17, 18, 200, 199, 174, 175, 196, 198, 201, 202
];

interface VirtualFaceProps {
  results: Results | null;
  smoothingFactor?: number;
}

export const VirtualFace: React.FC<VirtualFaceProps> = ({ results, smoothingFactor = 0.2 }) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshGeometryRef = useRef<THREE.BufferGeometry>(null);
  const pointsGeometryRef = useRef<THREE.BufferGeometry>(null);
  const debugCubeRef = useRef<THREE.Mesh>(null);

  const positions = useMemo(() => new Float32Array(478 * 3), []);
  const smoothedPositions = useRef<Float32Array>(new Float32Array(478 * 3));
  const indices = useMemo(() => new Uint16Array(FACE_TRIANGULATION), []);

  useFrame(() => {
    const hasResults = !!(results && results.multiFaceLandmarks && results.multiFaceLandmarks[0]);
    
    if (debugCubeRef.current) {
      debugCubeRef.current.visible = !hasResults;
      if (!hasResults) {
        debugCubeRef.current.rotation.y += 0.01;
      }
    }

    if (groupRef.current) {
      groupRef.current.visible = hasResults;
    }

    if (hasResults) {
      const landmarks = results!.multiFaceLandmarks[0];
      const meshPosAttr = meshGeometryRef.current?.getAttribute('position') as THREE.BufferAttribute;
      const pointsPosAttr = pointsGeometryRef.current?.getAttribute('position') as THREE.BufferAttribute;

      if (meshPosAttr && pointsPosAttr) {
        for (let i = 0; i < landmarks.length; i++) {
          const landmark = landmarks[i];
          
          // Scale landmarks to be clearly visible
          const tx = (landmark.x - 0.5) * 10;
          const ty = -(landmark.y - 0.5) * 10;
          const tz = -landmark.z * 10;

          const currentX = smoothedPositions.current[i * 3];
          const currentY = smoothedPositions.current[i * 3 + 1];
          const currentZ = smoothedPositions.current[i * 3 + 2];

          const isFirstFrame = currentX === 0 && currentY === 0 && currentZ === 0;
          
          const nextX = isFirstFrame ? tx : currentX + (tx - currentX) * smoothingFactor;
          const nextY = isFirstFrame ? ty : currentY + (ty - currentY) * smoothingFactor;
          const nextZ = isFirstFrame ? tz : currentZ + (tz - currentZ) * smoothingFactor;

          smoothedPositions.current[i * 3] = nextX;
          smoothedPositions.current[i * 3 + 1] = nextY;
          smoothedPositions.current[i * 3 + 2] = nextZ;

          meshPosAttr.setXYZ(i, nextX, nextY, nextZ);
          pointsPosAttr.setXYZ(i, nextX, nextY, nextZ);
        }
        meshPosAttr.needsUpdate = true;
        pointsPosAttr.needsUpdate = true;
        meshGeometryRef.current?.computeVertexNormals();
      }
    }
  });

  return (
    <group>
      {/* Debug Cube */}
      <mesh ref={debugCubeRef}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color="#ff4d00" wireframe />
      </mesh>

      {/* Face Group */}
      <group ref={groupRef}>
        {/* Solid Mesh */}
        <mesh frustumCulled={false}>
          <bufferGeometry ref={meshGeometryRef}>
            <bufferAttribute
              attach="attributes-position"
              count={positions.length / 3}
              array={positions}
              itemSize={3}
            />
            <bufferAttribute
              attach="index"
              count={indices.length}
              array={indices}
              itemSize={1}
            />
          </bufferGeometry>
          <meshStandardMaterial
            color="#ff4d00"
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
            emissive="#ff4d00"
            emissiveIntensity={0.6}
            metalness={1}
            roughness={0}
          />
        </mesh>

        {/* Points Overlay */}
        <points frustumCulled={false}>
          <bufferGeometry ref={pointsGeometryRef}>
            <bufferAttribute
              attach="attributes-position"
              count={positions.length / 3}
              array={positions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.05}
            color="#ffffff"
            transparent
            opacity={1}
            sizeAttenuation={true}
          />
        </points>
      </group>
    </group>
  );
};
