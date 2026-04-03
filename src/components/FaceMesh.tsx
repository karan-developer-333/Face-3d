import React, { useRef, useEffect, useState } from 'react';
import { FaceMesh as MediaPipeFaceMesh, Results } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

interface FaceMeshProps {
  onResults: (results: Results) => void;
}

export const FaceMesh: React.FC<FaceMeshProps> = ({ onResults }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const faceMesh = new MediaPipeFaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults(onResults);

    if (videoRef.current) {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) {
            await faceMesh.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
      });
      camera.start().then(() => setIsLoaded(true));
    }

    return () => {
      faceMesh.close();
    };
  }, [onResults]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
        playsInline
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center text-white/50 font-mono text-sm">
          Initializing Camera...
        </div>
      )}
    </div>
  );
};
