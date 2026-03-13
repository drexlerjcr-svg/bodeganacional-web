/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  Loader2, 
  MapPin, 
  X, 
  Copy, 
  CheckCheck, 
  Clock, 
  PlusCircle, 
  FileSignature, 
  Ban, 
  Search, 
  Handshake, 
  UserCheck, 
  XCircle, 
  ClipboardList, 
  Flag, 
  Archive, 
  UserPlus, 
  UserRound, 
  Landmark, 
  ShieldCheck, 
  ExternalLink,
  Percent
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Obfuscated Configuration
const _p = "MTIzNDU2"; // "123456"
const _u = "aHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20vc3ByZWFkc2hlZXRzL2QvMTlUaWFVTzk4TGNEYVZzaGkyVGJ5Q0pkcm12dDA4dzJuWEhyWWtySlZMa1EvZ3Zpei90cT90cXg9b3V0Ompzb24=";

interface DashboardData {
  [key: string]: any;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardData[]>([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogin = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (window.btoa(password) === _p) {
      setIsAuthenticated(true);
      fetchData();
    } else {
      setError('Contraseña incorrecta');
      setTimeout(() => setError(''), 3000);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(window.atob(_u));
      const text = await response.text();
      
      // Extract JSON from Google's response wrapper
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      const jsonStr = text.substring(jsonStart, jsonEnd + 1);
      const json = JSON.parse(jsonStr);
      
      const cols = json.table.cols.map((c: any) => c.label ? c.label.toUpperCase().trim() : "");
      
      const rows = json.table.rows.map((r: any) => {
        let obj: DashboardData = {};
        r.c.forEach((cell: any, i: number) => { 
          if(cols[i]) {
            obj[cols[i]] = cell ? (cell.f || cell.v) : 0;
          }
        });
        return obj;
      });

      setData(rows);
    } catch (err) {
      console.error("Error fetching data:", err);
      alert("Error al conectar con Google Sheets. Verifique que la hoja esté publicada o compartida correctamente.");
    } finally {
      setLoading(false);
    }
  };

  const states = useMemo(() => {
    const uniqueStates = [...new Set(data.map(d => d['ESTADO']))].filter(Boolean).sort() as string[];
    return uniqueStates;
  }, [data]);

  const filteredData = useMemo(() => {
    if (!selectedState) return data;
    return data.filter(d => d['ESTADO'] === selectedState);
  }, [data, selectedState]);

  const stats = useMemo(() => {
    const columns = [
      "REGISTROS RECIBIDOS", "ATENDIDAS", "POR ATENDER", "DENUNCIAS NO ADMITIDAS", "NUEVO", 
      "DENUNCIAS ADMITIDAS", "INSPECCIONADO", "PROCESO CONCILIATORIO", "CENTRALIZADA", 
      "POR APROBAR FISCALIZACIÓN", "DESESTIMADA", "POR FISCALIZAR", "PROCESO CULMINADO", 
      "ATENDIDA", "CERRADO", "POR ASIGNAR FISCAL", "DIRECTOR DE FISCALIZACIÓN", 
      "CON FISCAL ASIGNADO", "CON FISCAL NACIONAL", "OTRA DEPENDENCI"
    ];

    const s: { [key: string]: number } = {};
    columns.forEach(c => s[c] = 0);

    filteredData.forEach(d => {
      columns.forEach(c => {
        let val = d[c];
        if (typeof val === 'string') val = val.replace(/[^0-9.-]+/g, "");
        s[c] += parseFloat(val) || 0;
      });
    });

    return s;
  }, [filteredData]);

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-[#1e3a8a] flex items-center justify-center p-4 z-[5000]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center"
        >
          <div className="mb-6 flex justify-center">
            <ShieldAlert className="w-16 h-16 text-[#1e3a8a]" />
          </div>
          <h2 className="text-xl font-bold text-[#1e3a8a] mb-6 uppercase tracking-widest">Sala de Mando</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-center text-lg font-mono"
                autoFocus
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-[#3b82f6] hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 uppercase tracking-widest"
            >
              INGRESAR
            </button>
          </form>
          <AnimatePresence>
            {error && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-500 text-xs mt-4 font-bold uppercase tracking-tighter"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden font-sans text-[#1e293b]">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed md:relative z-50 w-64 h-full bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 font-extrabold text-[#1e3a8a] border-b border-gray-100 flex justify-between items-center">
          <span className="tracking-widest">UBICACIONES</span>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <button 
            onClick={() => { setSelectedState(null); setIsSidebarOpen(false); }}
            className={`w-[calc(100%-1.5rem)] mx-3 px-4 py-3 rounded-lg text-left text-xs font-bold transition-all mb-1 uppercase tracking-wider ${!selectedState ? 'bg-[#1e3a8a] text-white shadow-md' : 'text-[#64748b] hover:bg-gray-50'}`}
          >
            NACIONAL (TOTAL)
          </button>
          {states.map(state => (
            <button 
              key={state}
              onClick={() => { setSelectedState(state); setIsSidebarOpen(false); }}
              className={`w-[calc(100%-1.5rem)] mx-3 px-4 py-3 rounded-lg text-left text-xs font-bold transition-all mb-1 uppercase tracking-wider ${selectedState === state ? 'bg-[#1e3a8a] text-white shadow-md' : 'text-[#64748b] hover:bg-gray-50'}`}
            >
              {state}
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/90 z-30 flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-[#1e3a8a] animate-spin" />
          </div>
        )}

        <div className="bg-[#1e3a8a] text-white p-6 rounded-xl shadow-lg mb-8">
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-widest">{selectedState || 'VENEZUELA'}</h1>
          <p className="text-[0.7rem] opacity-80 mt-1 font-bold tracking-wider uppercase">Sala de Programación y Monitoreo</p>
        </div>

        <Section title="Indicadores Críticos" icon={<ShieldAlert className="w-4 h-4" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard label="Registros Recibidos" value={stats["REGISTROS RECIBIDOS"]} icon={<Copy />} color="#1e3a8a" />
            <StatCard label="Atendidas (Total)" value={stats["ATENDIDAS"]} icon={<CheckCheck />} color="#22c55e" />
            <StatCard label="Por Atender" value={stats["POR ATENDER"]} icon={<Clock />} color="#ef4444" />
          </div>
        </Section>

        <Section title="Estatus del Flujo de Denuncia" icon={<ClipboardList className="w-4 h-4" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <StatCard label="Nuevo" value={stats["NUEVO"]} icon={<PlusCircle />} color="#3b82f6" />
            <StatCard label="Admitidas" value={stats["DENUNCIAS ADMITIDAS"]} icon={<FileSignature />} color="#8b5cf6" />
            <StatCard label="No Admitidas" value={stats["DENUNCIAS NO ADMITIDAS"]} icon={<Ban />} color="#64748b" />
            <StatCard label="Inspeccionado" value={stats["INSPECCIONADO"]} icon={<Search />} color="#0ea5e9" />
            <StatCard label="Conciliatorio" value={stats["PROCESO CONCILIATORIO"]} icon={<Handshake />} color="#10b981" />
            <StatCard label="Por Aprobar" value={stats["POR APROBAR FISCALIZACIÓN"]} icon={<UserCheck />} color="#f59e0b" />
            <StatCard label="Desestimada" value={stats["DESESTIMADA"]} icon={<XCircle />} color="#f43f5e" />
            <StatCard label="Por Fiscalizar" value={stats["POR FISCALIZAR"]} icon={<ClipboardList />} color="#6366f1" />
            <StatCard label="Proceso Culminado" value={stats["PROCESO CULMINADO"]} icon={<Flag />} color="#22c55e" />
            <StatCard label="Cerrado" value={stats["CERRADO"]} icon={<Archive />} color="#1e293b" />
          </div>
        </Section>

        <Section title="Asignación y Dependencias" icon={<UserRound className="w-4 h-4" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <StatCard label="Por Asignar Fiscal" value={stats["POR ASIGNAR FISCAL"]} icon={<UserPlus />} color="#d97706" />
            <StatCard label="Con Fiscal Asignado" value={stats["CON FISCAL ASIGNADO"]} icon={<UserRound />} color="#059669" />
            <StatCard label="Con Fiscal Nacional" value={stats["CON FISCAL NACIONAL"]} icon={<Landmark />} color="#4338ca" />
            <StatCard label="Director Fiscalización" value={stats["DIRECTOR DE FISCALIZACIÓN"]} icon={<ShieldCheck />} color="#be185d" />
            <StatCard label="Otra Dependencia" value={stats["OTRA DEPENDENCI"]} icon={<ExternalLink />} color="#475569" />
          </div>
        </Section>

        <Section title="Rendimiento y Eficiencia" icon={<Percent className="w-4 h-4" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard 
              label="Atención %" 
              value={stats["REGISTROS RECIBIDOS"] > 0 ? (stats["ATENDIDAS"] / stats["REGISTROS RECIBIDOS"]) * 100 : 0} 
              icon={<Percent />} 
              color="#22c55e" 
              isPercent 
            />
            <StatCard 
              label="Por Atender %" 
              value={stats["REGISTROS RECIBIDOS"] > 0 ? (stats["POR ATENDER"] / stats["REGISTROS RECIBIDOS"]) * 100 : 0} 
              icon={<Percent />} 
              color="#ef4444" 
              isPercent 
            />
          </div>
        </Section>

        <div className="h-20" />
      </main>

      {/* Mobile Menu Button */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-[#1e3a8a] text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform"
      >
        <MapPin className="w-6 h-6" />
      </button>
    </div>
  );
}

function Section({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-4 bg-[#f59e0b] rounded-full" />
        <h2 className="text-[0.7rem] font-black text-[#1e3a8a] uppercase tracking-widest flex items-center gap-2">
          {icon}
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function StatCard({ label, value, icon, color, isPercent = false }: { label: string, value: number, icon: React.ReactNode, color: string, isPercent?: boolean }) {
  const displayValue = isPercent ? value.toFixed(1) + '%' : Math.floor(value).toLocaleString();
  const progressWidth = isPercent ? Math.min(100, value) : 100;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-2 group hover:shadow-md transition-all"
    >
      <div className="flex justify-between items-start">
        <span className="text-[0.6rem] font-extrabold text-[#64748b] uppercase tracking-widest">{label}</span>
        <div className="text-gray-400 group-hover:scale-110 transition-transform" style={{ color }}>
          {React.cloneElement(icon as React.ReactElement, { size: 16 })}
        </div>
      </div>
      <div className="text-2xl font-black tracking-tight" style={{ color }}>
        {displayValue}
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progressWidth}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </motion.div>
  );
}
