import React, { useState, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { motion } from 'motion/react';
import { Results } from '@mediapipe/holistic';
import { 
  Shield, 
  Cpu, 
  Zap, 
  Lock, 
  Activity,
  User,
  Settings,
  LayoutDashboard,
  Wallet
} from 'lucide-react';
import { HolisticTracker } from './components/HolisticTracker';
import { VirtualIdentity } from './components/VirtualIdentity';

const ACCENT_COLOR = '#ff4d00';

export default function App() {
  const resultsRef = useRef<Results | null>(null);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [activeTab, setActiveTab] = useState('identity');
  const [smoothing, setSmoothing] = useState(0.1);

  const handleFaceResults = useCallback((results: Results) => {
    resultsRef.current = results;
    const tracking = !!(results.faceLandmarks || results.leftHandLandmarks || results.rightHandLandmarks);
    if (tracking !== isTracking) setIsTracking(tracking);
  }, [isTracking]);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    setRetryCount(prev => prev + 1);
  };

  return (
    <div className="fixed inset-0 bg-[#050505] overflow-hidden">
      {/* Full Screen 3D Viewport */}
      <div className="absolute inset-0 z-0 bg-[#050505]">
        <Canvas 
          className="w-full h-full" 
          shadows 
          gl={{ antialias: true, alpha: true }}
          style={{ pointerEvents: 'auto' }}
        >
          <color attach="background" args={['#050505']} />
          <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />
          <OrbitControls enableZoom={true} enablePan={true} makeDefault />
          
          <ambientLight intensity={1.5} />
          <pointLight position={[10, 10, 10]} intensity={2} />
          <pointLight position={[-10, -10, -10]} intensity={1} color={ACCENT_COLOR} />
          
          <VirtualIdentity 
            resultsRef={resultsRef} 
            smoothingFactor={smoothing} 
            videoElement={videoElement} 
          />

          {/* Test Mesh to confirm Canvas is working */}
          <mesh position={[0, -3, 0]} rotation={[0, Math.PI / 4, 0]}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color={ACCENT_COLOR} emissive={ACCENT_COLOR} emissiveIntensity={1} />
          </mesh>

          {/* Grid Background */}
          <gridHelper args={[100, 100, 0x444444, 0x222222]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -10]} />
          <gridHelper args={[100, 100, 0x444444, 0x222222]} rotation={[0, 0, 0]} position={[0, -5, 0]} />
        </Canvas>
      </div>

      {/* Overlay UI */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Vaulto<span className="text-orange-600">.</span>ID</h1>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`} />
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                {isTracking ? 'System Active' : 'Searching for Identity'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Tracker (Still processing) */}
      <div className="hidden">
        <HolisticTracker 
          onResults={handleFaceResults} 
          onVideoReady={setVideoElement}
          onLoading={setIsLoading}
          onError={setError}
          retryCount={retryCount}
        />
      </div>

      {/* Loading / Error Overlay */}
      {(isLoading || error) && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050505]/90 backdrop-blur-xl">
          {error ? (
            <div className="flex flex-col items-center max-w-md p-10 border border-orange-500/40 bg-black/80 rounded-[2rem] text-center shadow-2xl shadow-orange-600/10">
              <div className="w-20 h-20 bg-orange-600/20 rounded-full flex items-center justify-center mb-6 border border-orange-600/30">
                <Lock className="w-10 h-10 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3 uppercase tracking-tighter">Biometric Access Blocked</h2>
              
              <div className="bg-orange-600/10 border border-orange-600/20 rounded-xl p-5 mb-6 text-left">
                <p className="text-orange-500 text-[10px] font-mono font-bold uppercase mb-3 flex items-center gap-2">
                  <Activity className="w-3 h-3" />
                  System Log: CAMERA_PERMISSION_DENIED
                </p>
                <div className="space-y-3">
                  <p className="text-white/80 text-xs font-mono leading-relaxed">
                    Access to the biometric sensor (camera) was explicitly blocked. To continue with identity decryption:
                  </p>
                  <ol className="text-white/60 text-[10px] font-mono space-y-2 list-decimal list-inside">
                    <li>Look at your browser's address bar (top left/right).</li>
                    <li>Click the <span className="text-orange-500 font-bold underline">Camera/Lock icon</span>.</li>
                    <li>Change the setting to <span className="text-orange-500 font-bold">"Allow"</span>.</li>
                    <li>Click the <span className="text-white font-bold">"Retry Authorization"</span> button below.</li>
                  </ol>
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full">
                <button 
                  onClick={handleRetry}
                  className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg shadow-orange-600/20 active:scale-[0.98]"
                >
                  Retry Authorization
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/40 text-[10px] font-mono uppercase tracking-widest rounded-xl transition-all"
                >
                  Full System Reboot
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-6" />
              <div className="text-white font-mono text-xs uppercase tracking-[0.3em] animate-pulse">
                Decrypting Biometric Stream...
              </div>
              <button 
                onClick={() => setIsLoading(false)}
                className="mt-8 text-white/20 hover:text-white/40 text-[10px] font-mono uppercase tracking-widest transition-colors"
              >
                Bypass Calibration
              </button>
            </div>
          )}
        </div>
      )}

      {/* Top Right Controls (Camera Preview Removed) */}
      <div className="absolute top-6 right-6 z-20 w-64 group pointer-events-none">
        <div className="p-3 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl shadow-2xl transition-all group-hover:border-orange-500/30 pointer-events-auto">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">System Controls</span>
            <div className="flex gap-1">
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <div className="w-1 h-1 rounded-full bg-white/20" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-bold text-white/20 uppercase">Smoothing</span>
              <span className="text-[8px] font-mono text-orange-500">{(smoothing * 100).toFixed(0)}%</span>
            </div>
            <input 
              type="range" 
              min="0.01" 
              max="1" 
              step="0.01" 
              value={smoothing}
              onChange={(e) => setSmoothing(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-600"
            />
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="absolute bottom-6 left-6 right-6 z-10 flex items-end justify-between pointer-events-none">
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="px-4 py-2 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md">
              <div className="text-[8px] font-bold text-white/20 uppercase mb-1">Tracking Points</div>
              <div className="text-xs font-mono text-white">520 Active Nodes</div>
            </div>
            <div className="px-4 py-2 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md">
              <div className="text-[8px] font-bold text-white/20 uppercase mb-1">Latency</div>
              <div className="text-xs font-mono text-white">0.02ms</div>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[8px] font-mono text-white/20 uppercase tracking-[0.2em] mb-2">Secure Identity Protocol v4.2</div>
          <div className="flex gap-1 justify-end">
            {[...Array(12)].map((_, i) => (
              <div 
                key={i} 
                className={`w-1 h-3 rounded-full ${i < (isTracking ? 12 : 3) ? 'bg-orange-600' : 'bg-white/5'}`} 
                style={{ opacity: isTracking ? 1 : 0.3 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
