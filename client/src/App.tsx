import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, Layers, ShieldCheck, Server, Activity, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

export default function App() {
  const [serverStatus, setServerStatus] = useState<"checking" | "online" | "offline">("checking");
  const [serverInfo, setServerInfo] = useState<{ status?: string; timestamp?: string }>({});

  useEffect(() => {
    checkServerHealth();
  }, []);

  const checkServerHealth = async () => {
    setServerStatus("checking");
    try {
      const res = await axios.get("http://localhost:5001/api/health");
      if (res.data && res.data.status === "ok") {
        setServerStatus("online");
        setServerInfo(res.data);
        toast.success("Connected to Backend API Server!");
      } else {
        setServerStatus("offline");
      }
    } catch {
      setServerStatus("offline");
      toast.error("Could not connect to backend server. Make sure server is running on PORT 5001.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Subtle Gradient Spheres */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl w-full text-center z-10 space-y-8"
      >
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium">
          <Package className="w-4 h-4" />
          <span>Production Ready Scaffolding</span>
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            Inventory Management System
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Full-stack Node.js Express backend with Prisma ORM and React TypeScript SPA with Tailwind CSS.
          </p>
        </div>

        {/* Status Card */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="p-3 rounded-xl bg-slate-800 text-indigo-400">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">Backend API Status</h3>
              <p className="text-sm text-slate-400">
                {serverStatus === "checking" && "Checking connectivity to http://localhost:5001..."}
                {serverStatus === "online" && `Online • Last response: ${serverInfo.timestamp || "Just now"}`}
                {serverStatus === "offline" && "Offline or disconnected (Start backend on port 5001)"}
              </p>
            </div>
          </div>

          <button
            onClick={checkServerHealth}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shadow-lg shadow-indigo-600/20 cursor-pointer text-sm"
          >
            <Activity className="w-4 h-4" />
            <span>Ping Backend</span>
          </button>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-200">Express & Prisma</h3>
            <p className="text-sm text-slate-400">
              TypeScript API server powered by Express, Prisma ORM, JWT, Bcrypt, and Zod validation.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-200">Vite & Tailwind v4</h3>
            <p className="text-sm text-slate-400">
              Ultra-fast React SPA configured with `@tailwindcss/vite`, Framer Motion, and Sonner notifications.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-200">Production Ready</h3>
            <p className="text-sm text-slate-400">
              Structured monorepo layout with standard environment setup and cross-origin security.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 flex justify-center">
          <button
            onClick={() => toast.success("Setup complete! Ready to start developing your features.")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-slate-700 transition-all cursor-pointer"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
