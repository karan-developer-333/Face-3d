import React, { useState, useCallback } from 'react';
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
  const [faceResults, setFaceResults] = useState<Results | null>(null);
  const [activeTab, setActiveTab] = useState('identity');
  const [smoothing, setSmoothing] = useState(0.2);

  const isTracking = !!(faceResults && (faceResults.faceLandmarks || faceResults.leftHandLandmarks || faceResults.rightHandLandmarks));

  const handleFaceResults = useCallback((results: Results) => {
    // Force a new object reference and ensure landmarks are captured
    setFaceResults({
      faceLandmarks: results.faceLandmarks ? [...results.faceLandmarks] : undefined,
      leftHandLandmarks: results.leftHandLandmarks ? [...results.leftHandLandmarks] : undefined,
      rightHandLandmarks: results.rightHandLandmarks ? [...results.rightHandLandmarks] : undefined,
      poseLandmarks: results.poseLandmarks ? [...results.poseLandmarks] : undefined,
    } as Results);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#050505] overflow-hidden">
      {/* Full Screen 3D Viewport */}
      <div className="absolute inset-0 z-0">
        <Canvas className="w-full h-full" shadows>
          <color attach="background" args={['#050505']} />
          <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={50} />
          <OrbitControls enableZoom={true} enablePan={true} />
          
          <ambientLight intensity={1} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={1} color={ACCENT_COLOR} />
          
          <VirtualIdentity results={faceResults} smoothingFactor={smoothing} />

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

      {/* Top Right Camera Preview */}
      <div className="absolute top-6 right-6 z-20 w-64 group">
        <div className="p-3 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl shadow-2xl transition-all group-hover:border-orange-500/30">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Live Feed</span>
            <div className="flex gap-1">
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <div className="w-1 h-1 rounded-full bg-white/20" />
            </div>
          </div>
          <div className="aspect-video rounded-lg overflow-hidden bg-black border border-white/5">
            <HolisticTracker onResults={handleFaceResults} />
          </div>
          <div className="mt-3 space-y-2">
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
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-600 pointer-events-auto"
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
