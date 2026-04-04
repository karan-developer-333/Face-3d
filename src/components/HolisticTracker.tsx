import React, { useRef, useEffect, useState } from 'react';
import { Holistic, Results } from '@mediapipe/holistic';
import { Camera } from '@mediapipe/camera_utils';

interface HolisticTrackerProps {
  onResults: (results: Results) => void;
  onVideoReady?: (video: HTMLVideoElement) => void;
  onError?: (error: string) => void;
  onLoading?: (isLoading: boolean) => void;
  retryCount?: number;
}

export const HolisticTracker: React.FC<HolisticTrackerProps> = ({ 
  onResults, 
  onVideoReady,
  onError,
  onLoading,
  retryCount = 0
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let holistic: Holistic | null = null;
    let camera: Camera | null = null;

    const initializeHolistic = async () => {
      if (onLoading) onLoading(true);
      
      const timeoutId = setTimeout(() => {
        if (isMounted && !isLoaded) {
          if (onError) onError("Initialization timeout. Check camera permissions.");
        }
      }, 20000);

      try {
        const VERSION = '0.5.1675471629';
        holistic = new Holistic({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@${VERSION}/${file}`,
        });

        holistic.setOptions({
          modelComplexity: 0,
          smoothLandmarks: true,
          enableSegmentation: false,
          refineFaceLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        holistic.onResults((results) => {
          if (isMounted) {
            if (!isLoaded) {
              setIsLoaded(true);
              if (onLoading) onLoading(false);
              clearTimeout(timeoutId);
            }
            onResults(results);
          }
        });

        if (videoRef.current && isMounted) {
          camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && holistic && isMounted) {
                try {
                  await holistic.send({ image: videoRef.current });
                } catch (e) {}
              }
            },
            width: 640,
            height: 480,
          });
          
          try {
            await camera.start();
            if (onVideoReady && videoRef.current) {
              onVideoReady(videoRef.current);
            }
          } catch (camErr: any) {
            if (isMounted && onError) {
              onError(`Camera access failed: ${camErr.message}`);
              clearTimeout(timeoutId);
            }
          }
        }
      } catch (err: any) {
        if (isMounted && onError) {
          onError(`Initialization failed: ${err.message}`);
          clearTimeout(timeoutId);
        }
      }
    };

    initializeHolistic();

    return () => {
      isMounted = false;
      if (camera) camera.stop();
      if (holistic) holistic.close();
    };
  }, [onResults, retryCount]);

  return (
    <video
      ref={videoRef}
      className="absolute opacity-0 pointer-events-none"
      style={{ width: 1, height: 1 }}
      playsInline
      muted
    />
  );
}
