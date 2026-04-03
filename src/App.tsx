import React, { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Float } from '@react-three/drei';
import { motion } from 'motion/react';
import { Results } from '@mediapipe/face_mesh';
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
import { FaceMesh } from './components/FaceMesh';
import { VirtualFace } from './components/VirtualFace';

const ACCENT_COLOR = '#ff4d00';

export default function App() {
  const [faceResults, setFaceResults] = useState<Results | null>(null);
  const [activeTab, setActiveTab] = useState('identity');
  const [smoothing, setSmoothing] = useState(0.2);

  const handleFaceResults = useCallback((results: Results) => {
    setFaceResults(results);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-orange-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Vaulto<span className="text-orange-600">.</span></span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
          <a href="#" className="hover:text-white transition-colors">Company</a>
          <a href="#" className="hover:text-white transition-colors">Products</a>
          <a href="#" className="hover:text-white transition-colors">Industries</a>
          <a href="#" className="hover:text-white transition-colors">Pricing</a>
          <a href="#" className="hover:text-white transition-colors">FAQ</a>
        </div>

        <div className="flex items-center gap-4">
          <button className="text-sm font-medium hover:text-orange-500 transition-colors">Login</button>
          <button className="px-5 py-2 bg-white text-black text-sm font-bold rounded-full hover:bg-orange-600 hover:text-white transition-all duration-300">
            Get Started
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-32 pb-20 px-8 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/60 mb-6"
          >
            <Activity className="w-3 h-3 text-orange-500" />
            <span>4.8+ on App Store · 125K reviews</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]"
          >
            Every cash and crypto you own,<br />
            <span className="text-white/40">clearly in one place</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/40 max-w-2xl mx-auto mb-10"
          >
            No more switching between apps or losing track. Your money moves with you, always in one view.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-4"
          >
            <button className="px-8 py-4 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20">
              Open Account
            </button>
            <button className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all">
              Download App
            </button>
          </motion.div>
        </div>

        {/* Interactive Face Mesh Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-20">
          {/* Sidebar Controls */}
          <div className="lg:col-span-3 space-y-4">
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white/40 mb-6">Identity Hub</h3>
              <div className="space-y-2 mb-6">
                {[
                  { id: 'identity', icon: User, label: 'Virtual ID' },
                  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                  { id: 'wallet', icon: Wallet, label: 'Assets' },
                  { id: 'security', icon: Lock, label: 'Security' },
                  { id: 'settings', icon: Settings, label: 'Settings' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === item.id 
                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' 
                        : 'text-white/40 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="pt-6 border-t border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold text-white/40 uppercase">Smoothing</span>
                  <span className="text-[10px] font-mono text-orange-500">{(smoothing * 100).toFixed(0)}%</span>
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
                <div className="flex justify-between mt-2 text-[8px] font-mono text-white/20 uppercase">
                  <span>Fluid</span>
                  <span>Instant</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-white/40 uppercase">Camera Feed</span>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>
              <div className="aspect-video rounded-xl overflow-hidden bg-black">
                <FaceMesh onResults={handleFaceResults} />
              </div>
            </div>
          </div>

          {/* Main 3D Viewport */}
          <div className="lg:col-span-9 relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-[2.5rem]" />
            <div className="h-[600px] rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-sm overflow-hidden relative">
              {/* Dashboard Overlay UI */}
              <div className="absolute top-8 left-8 z-10">
                <div className="text-xs font-mono text-white/40 mb-1">TOTAL BALANCE</div>
                <div className="text-3xl font-bold">$12,420.22 <span className="text-xs text-green-500 font-medium">+12.5%</span></div>
              </div>

              <div className="absolute top-8 right-8 z-10 flex gap-2">
                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-white/60">
                  LATENCY: 12ms
                </div>
                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-white/60 uppercase">
                  Status: Active
                </div>
              </div>

              <Canvas className="w-full h-full" shadows>
                <color attach="background" args={['#050505']} />
                <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={50} />
                <OrbitControls enableZoom={false} enablePan={false} />
                
                <ambientLight intensity={1} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
                <pointLight position={[-10, -10, -10]} intensity={1} color={ACCENT_COLOR} />
                
                <VirtualFace results={faceResults} smoothingFactor={smoothing} />

                {/* Grid Background */}
                <gridHelper args={[40, 40, 0x222222, 0x111111]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -5]} />
                
                {/* Static Test Cube to verify Canvas is working */}
                <mesh position={[-4, 3, 0]}>
                  <boxGeometry args={[0.5, 0.5, 0.5]} />
                  <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
                </mesh>
              </Canvas>

              {/* Bottom Info Bar */}
              <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between">
                <div className="flex gap-8">
                  <div>
                    <div className="text-[10px] font-bold text-white/30 uppercase mb-1">Landmarks</div>
                    <div className="text-sm font-mono">478 Points</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-white/30 uppercase mb-1">Tracking</div>
                    <div className="text-sm font-mono">High Precision</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-orange-600"
                      animate={{ width: faceResults ? '100%' : '0%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: 'Advanced Security', desc: 'Military-grade encryption with multi-signature wallets and biometric authentication.' },
            { icon: Cpu, title: 'Unified Dashboard', desc: 'Connect all your accounts and wallets. View your total net worth in real-time.' },
            { icon: Zap, title: 'Instant Conversion', desc: 'Swap between any assets instantly with the lowest fees in the market.' },
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
            >
              <div className="w-12 h-12 bg-orange-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-white/40 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-orange-600" />
            <span className="text-xl font-bold tracking-tight">Vaulto.</span>
          </div>
          <div className="flex gap-8 text-sm text-white/40">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
          </div>
          <div className="text-sm text-white/20 font-mono">
            © 2026 VAULTO TECHNOLOGIES INC.
          </div>
        </div>
      </footer>
    </div>
  );
}
