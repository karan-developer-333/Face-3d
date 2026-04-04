import React, { useRef, useEffect, useState } from 'react';
import { Holistic, Results } from '@mediapipe/holistic';
import { Camera } from '@mediapipe/camera_utils';

interface HolisticTrackerProps {
  onResults: (results: Results) => void;
}

export const HolisticTracker: React.FC<HolisticTrackerProps> = ({ onResults }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let holistic: Holistic | null = null;
    let camera: Camera | null = null;

    const initializeHolistic = async () => {
      setError(null);
      setIsLoaded(false);
      
      const timeoutId = setTimeout(() => {
        if (isMounted && !isLoaded) {
          setError("Initialization is taking longer than expected. Please ensure your camera is not being used by another app and refresh. You can also try 'Force Start' if you see your camera feed.");
        }
      }, 20000);

      try {
        console.log("Initializing Holistic...");
        const VERSION = '0.5.1675471629';
        holistic = new Holistic({
          locateFile: (file) => {
            const url = `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@${VERSION}/${file}`;
            console.log("Loading MediaPipe file:", url);
            return url;
          },
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
              console.log("First results received!");
              setIsLoaded(true);
              clearTimeout(timeoutId);
            }
            
            if (canvasRef.current) {
              const canvasCtx = canvasRef.current.getContext('2d');
              if (canvasCtx) {
                canvasCtx.save();
                canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                
                if (results.faceLandmarks) {
                  canvasCtx.fillStyle = '#ff4d00';
                  for (const landmark of results.faceLandmarks) {
                    canvasCtx.beginPath();
                    canvasCtx.arc(landmark.x * canvasRef.current.width, landmark.y * canvasRef.current.height, 1, 0, 2 * Math.PI);
                    canvasCtx.fill();
                  }
                }
                
                const drawHand = (landmarks: any) => {
                  if (landmarks) {
                    canvasCtx.fillStyle = '#ffffff';
                    for (const landmark of landmarks) {
                      canvasCtx.beginPath();
                      canvasCtx.arc(landmark.x * canvasRef.current.width, landmark.y * canvasRef.current.height, 2, 0, 2 * Math.PI);
                      canvasCtx.fill();
                    }
                  }
                };
                drawHand(results.leftHandLandmarks);
                drawHand(results.rightHandLandmarks);
                canvasCtx.restore();
              }
            }
            onResults(results);
          }
        });

        if (videoRef.current && isMounted) {
          console.log("Starting Camera...");
          camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && holistic && isMounted) {
                try {
                  await holistic.send({ image: videoRef.current });
                } catch (e) {
                  // Ignore transient errors
                }
              }
            },
            width: 640,
            height: 480,
          });
          
          try {
            await camera.start();
            console.log("Camera started successfully");
          } catch (camErr: any) {
            console.error("Camera start failed:", camErr);
            if (isMounted) {
              setError(`Camera access failed: ${camErr.message || "Please check permissions"}`);
              clearTimeout(timeoutId);
            }
          }
        }
      } catch (err: any) {
        console.error("Holistic initialization failed:", err);
        if (isMounted) {
          setError(`Initialization failed: ${err.message || "Unknown error"}`);
          clearTimeout(timeoutId);
        }
      }
    };

    initializeHolistic();

    return () => {
      isMounted = false;
      if (camera) {
        camera.stop();
      }
      if (holistic) {
        holistic.close();
      }
    };
  }, [onResults, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm">
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isLoaded ? 'opacity-40 grayscale contrast-125' : 'opacity-0'}`}
        playsInline
        muted
      />
      
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        width={640}
        height={480}
      />
      
      {/* Scanline Effect */}
      {isLoaded && (
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-orange-500/5 to-transparent bg-[length:100%_4px] animate-scanline" />
      )}

      {!isLoaded && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
          <div className="text-white/50 font-mono text-[10px] uppercase tracking-widest animate-pulse">
            Initializing Identity Scan...
          </div>
          <button 
            onClick={() => setIsLoaded(true)}
            className="mt-4 px-3 py-1 bg-white/5 hover:bg-white/10 text-white/30 text-[8px] font-mono uppercase tracking-widest rounded transition-colors"
          >
            Force Bypass
          </button>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/80 backdrop-blur-md">
          <div className="w-12 h-12 rounded-full bg-orange-600/20 flex items-center justify-center mb-4 border border-orange-600/30">
            <div className="w-2 h-2 rounded-full bg-orange-600 animate-ping" />
          </div>
          <div className="text-orange-500 font-mono text-[10px] font-bold mb-2 tracking-tighter uppercase">Access Restricted</div>
          <div className="text-white/50 text-[10px] mb-6 max-w-[180px] leading-relaxed font-mono">{error}</div>
          <button 
            onClick={handleRetry}
            className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full transition-all shadow-lg shadow-orange-600/20 active:scale-95"
          >
            Retry Protocol
          </button>
        </div>
      )}

      {/* Identity Lock UI */}
      {isLoaded && (
        <div className="absolute inset-0 pointer-events-none border-2 border-orange-500/20 m-2 rounded-xl">
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-orange-500" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-orange-500" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-orange-500" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-orange-500" />
        </div>
      )}
    </div>
  );
}
