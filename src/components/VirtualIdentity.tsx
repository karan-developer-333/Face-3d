import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Results } from '@mediapipe/holistic';
import { Text } from '@react-three/drei';

// Standard triangulation indices for MediaPipe FaceMesh (Partial set for performance and visual style)
const FACE_TRIANGULATION = [
  127, 34, 139, 11, 0, 37, 232, 231, 230, 229, 228, 31, 226, 113, 225, 224, 223, 222, 221, 189, 244, 233, 232, 227, 116, 117, 118, 119, 120, 121, 128, 245, 
  33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33, 130, 247, 30, 29, 28, 27, 26, 25, 24, 23, 22, 243, 190, 56, 28,
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
  54, 103, 67, 109, 10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93,
  10, 151, 9, 8, 168, 6, 197, 195, 5, 4, 1, 19, 94, 2, 164, 0, 11, 12, 13, 14, 15, 16, 17, 18, 200, 199, 174, 175, 196, 198, 201, 202,
  // Additional indices for better coverage
  234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323, 454, 356, 389, 251, 284, 332, 297, 338, 10, 109, 67, 103, 54, 21, 162, 127,
  // Mouth
  61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 185, 40, 39, 37, 0, 267, 269, 270, 409, 415, 310, 311, 312, 13, 82, 81, 80, 191, 78, 62, 76, 
  // Eyes
  33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7, 33,
  263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249, 263
];

// Hand connections (MediaPipe Hands)
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // index
  [5, 9], [9, 10], [10, 11], [11, 12], // middle
  [9, 13], [13, 14], [14, 15], [15, 16], // ring
  [13, 17], [17, 18], [18, 19], [19, 20], [0, 17] // pinky
];

interface VirtualIdentityProps {
  results: Results | null;
  smoothingFactor?: number;
}

export const VirtualIdentity: React.FC<VirtualIdentityProps> = ({ results, smoothingFactor = 0.2 }) => {
  const faceGroupRef = useRef<THREE.Group>(null);
  const leftHandGroupRef = useRef<THREE.Group>(null);
  const rightHandGroupRef = useRef<THREE.Group>(null);
  const debugCubeRef = useRef<THREE.Mesh>(null);

  const faceMeshGeometryRef = useRef<THREE.BufferGeometry>(null);
  const facePointsGeometryRef = useRef<THREE.BufferGeometry>(null);
  
  const leftHandPointsGeometryRef = useRef<THREE.BufferGeometry>(null);
  const leftHandLinesGeometryRef = useRef<THREE.BufferGeometry>(null);
  const rightHandPointsGeometryRef = useRef<THREE.BufferGeometry>(null);
  const rightHandLinesGeometryRef = useRef<THREE.BufferGeometry>(null);

  const facePositions = useMemo(() => new Float32Array(478 * 3), []);
  const faceSmoothedPositions = useRef<Float32Array>(new Float32Array(478 * 3));
  const faceIndices = useMemo(() => new Uint16Array(FACE_TRIANGULATION), []);

  const handPositions = useMemo(() => new Float32Array(21 * 3), []);
  const handLineIndices = useMemo(() => {
    const indices: number[] = [];
    HAND_CONNECTIONS.forEach(([a, b]) => {
      indices.push(a, b);
    });
    return new Uint16Array(indices);
  }, []);

  const leftHandSmoothedPositions = useRef<Float32Array>(new Float32Array(21 * 3));
  const rightHandSmoothedPositions = useRef<Float32Array>(new Float32Array(21 * 3));
  const trackingTextRef = useRef<any>(null);

  useFrame(({ clock }) => {
    const faceLandmarks = results?.faceLandmarks;
    const leftHandLandmarks = results?.leftHandLandmarks;
    const rightHandLandmarks = results?.rightHandLandmarks;

    const hasFace = !!(faceLandmarks && faceLandmarks.length > 0);
    const hasLeftHand = !!(leftHandLandmarks && leftHandLandmarks.length > 0);
    const hasRightHand = !!(rightHandLandmarks && rightHandLandmarks.length > 0);
    const hasAny = hasFace || hasLeftHand || hasRightHand;

    if (debugCubeRef.current) {
      debugCubeRef.current.visible = !hasAny;
      if (!hasAny) debugCubeRef.current.rotation.y += 0.01;
    }

    // Update Face
    if (faceGroupRef.current) faceGroupRef.current.visible = hasFace;
    if (hasFace && faceLandmarks) {
      // console.log("Updating 3D face mesh...");
      const landmarks = faceLandmarks;
      const meshPosAttr = faceMeshGeometryRef.current?.getAttribute('position') as THREE.BufferAttribute;
      const pointsPosAttr = facePointsGeometryRef.current?.getAttribute('position') as THREE.BufferAttribute;

      if (meshPosAttr && pointsPosAttr) {
        for (let i = 0; i < landmarks.length; i++) {
          const landmark = landmarks[i];
          const tx = (landmark.x - 0.5) * 10;
          const ty = -(landmark.y - 0.5) * 10;
          const tz = -landmark.z * 10;

          const cx = faceSmoothedPositions.current[i * 3];
          const cy = faceSmoothedPositions.current[i * 3 + 1];
          const cz = faceSmoothedPositions.current[i * 3 + 2];

          const isFirst = cx === 0 && cy === 0 && cz === 0;
          const nx = isFirst ? tx : cx + (tx - cx) * smoothingFactor;
          const ny = isFirst ? ty : cy + (ty - cy) * smoothingFactor;
          const nz = isFirst ? tz : cz + (tz - cz) * smoothingFactor;

          faceSmoothedPositions.current[i * 3] = nx;
          faceSmoothedPositions.current[i * 3 + 1] = ny;
          faceSmoothedPositions.current[i * 3 + 2] = nz;

          meshPosAttr.setXYZ(i, nx, ny, nz);
          pointsPosAttr.setXYZ(i, nx, ny, nz);
        }
        meshPosAttr.needsUpdate = true;
        pointsPosAttr.needsUpdate = true;
        faceMeshGeometryRef.current?.computeVertexNormals();
      }
    }

    // Update Hands
    const updateHand = (landmarks: any, groupRef: any, pointsGeomRef: any, linesGeomRef: any, smoothedRef: any) => {
      if (groupRef.current) groupRef.current.visible = !!landmarks;
      if (landmarks) {
        const pointsPosAttr = pointsGeomRef.current?.getAttribute('position') as THREE.BufferAttribute;
        const linesPosAttr = linesGeomRef.current?.getAttribute('position') as THREE.BufferAttribute;

        if (pointsPosAttr && linesPosAttr) {
          for (let i = 0; i < landmarks.length; i++) {
            const landmark = landmarks[i];
            const tx = (landmark.x - 0.5) * 10;
            const ty = -(landmark.y - 0.5) * 10;
            const tz = -landmark.z * 10;

            const cx = smoothedRef.current[i * 3];
            const cy = smoothedRef.current[i * 3 + 1];
            const cz = smoothedRef.current[i * 3 + 2];

            const isFirst = cx === 0 && cy === 0 && cz === 0;
            const nx = isFirst ? tx : cx + (tx - cx) * smoothingFactor;
            const ny = isFirst ? ty : cy + (ty - cy) * smoothingFactor;
            const nz = isFirst ? tz : cz + (tz - cz) * smoothingFactor;

            smoothedRef.current[i * 3] = nx;
            smoothedRef.current[i * 3 + 1] = ny;
            smoothedRef.current[i * 3 + 2] = nz;

            pointsPosAttr.setXYZ(i, nx, ny, nz);
            linesPosAttr.setXYZ(i, nx, ny, nz);
          }
          pointsPosAttr.needsUpdate = true;
          linesPosAttr.needsUpdate = true;
        }
      }
    };

    updateHand(results?.leftHandLandmarks, leftHandGroupRef, leftHandPointsGeometryRef, leftHandLinesGeometryRef, leftHandSmoothedPositions);
    updateHand(results?.rightHandLandmarks, rightHandGroupRef, rightHandPointsGeometryRef, rightHandLinesGeometryRef, rightHandSmoothedPositions);

    // Update tracking text
    if (trackingTextRef.current) {
      trackingTextRef.current.visible = hasAny;
      if (hasFace && faceLandmarks) {
        const nose = faceLandmarks[1];
        trackingTextRef.current.position.set((nose.x - 0.5) * 10, -(nose.y - 0.5) * 10 + 1.5, -nose.z * 10);
        trackingTextRef.current.text = `IDENTITY_LOCKED: ${results?.faceLandmarks?.length} NODES`;
      }
    }
  });

  return (
    <group>
      {/* Tracking Status Text */}
      <Text
        ref={trackingTextRef}
        fontSize={0.2}
        color="#ff4d00"
        font="https://fonts.gstatic.com/s/jetbrainsmono/v13/t63v_mS_vS0i_V-8e-G9vXvM.woff"
        anchorX="center"
        anchorY="middle"
      >
        IDENTITY_LOCKED
      </Text>

      {/* Debug Cube */}
      <mesh ref={debugCubeRef}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color="#ff4d00" wireframe />
      </mesh>

      {/* Face Group */}
      <group ref={faceGroupRef}>
        <pointLight position={[0, 0, 1]} intensity={2} color="#ff4d00" distance={5} />
        <mesh frustumCulled={false}>
          <bufferGeometry ref={faceMeshGeometryRef}>
            <bufferAttribute attach="attributes-position" count={facePositions.length / 3} array={facePositions} itemSize={3} />
            <bufferAttribute attach="index" count={faceIndices.length} array={faceIndices} itemSize={1} />
          </bufferGeometry>
          <meshStandardMaterial 
            color="#ff4d00" 
            transparent 
            opacity={0.4} 
            side={THREE.DoubleSide} 
            emissive="#ff4d00" 
            emissiveIntensity={0.5} 
            metalness={0.8} 
            roughness={0.2} 
            wireframe={true}
          />
        </mesh>
        <points frustumCulled={false}>
          <bufferGeometry ref={facePointsGeometryRef}>
            <bufferAttribute attach="attributes-position" count={facePositions.length / 3} array={facePositions} itemSize={3} />
          </bufferGeometry>
          <pointsMaterial size={0.04} color="#ffffff" transparent opacity={0.8} sizeAttenuation={true} />
        </points>
      </group>

      {/* Left Hand */}
      <group ref={leftHandGroupRef}>
        <points frustumCulled={false}>
          <bufferGeometry ref={leftHandPointsGeometryRef}>
            <bufferAttribute attach="attributes-position" count={handPositions.length / 3} array={handPositions} itemSize={3} />
          </bufferGeometry>
          <pointsMaterial size={0.08} color="#ffffff" transparent opacity={1} sizeAttenuation={true} />
        </points>
        <lineSegments frustumCulled={false}>
          <bufferGeometry ref={leftHandLinesGeometryRef}>
            <bufferAttribute attach="attributes-position" count={handPositions.length / 3} array={handPositions} itemSize={3} />
            <bufferAttribute attach="index" count={handLineIndices.length} array={handLineIndices} itemSize={1} />
          </bufferGeometry>
          <lineBasicMaterial color="#ff4d00" linewidth={2} transparent opacity={0.8} />
        </lineSegments>
      </group>

      {/* Right Hand */}
      <group ref={rightHandGroupRef}>
        <points frustumCulled={false}>
          <bufferGeometry ref={rightHandPointsGeometryRef}>
            <bufferAttribute attach="attributes-position" count={handPositions.length / 3} array={handPositions} itemSize={3} />
          </bufferGeometry>
          <pointsMaterial size={0.08} color="#ffffff" transparent opacity={1} sizeAttenuation={true} />
        </points>
        <lineSegments frustumCulled={false}>
          <bufferGeometry ref={rightHandLinesGeometryRef}>
            <bufferAttribute attach="attributes-position" count={handPositions.length / 3} array={handPositions} itemSize={3} />
            <bufferAttribute attach="index" count={handLineIndices.length} array={handLineIndices} itemSize={1} />
          </bufferGeometry>
          <lineBasicMaterial color="#ff4d00" linewidth={2} transparent opacity={0.8} />
        </lineSegments>
      </group>
    </group>
  );
};
