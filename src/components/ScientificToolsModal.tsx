import React, { useState } from 'react';
import { X, Calculator, ShieldCheck, Scale, Award, Info } from 'lucide-react';
import { estimate1RM } from '../utils/calculator';

interface ScientificToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScientificToolsModal: React.FC<ScientificToolsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'1rm' | 'rir' | 'volume'>('1rm');

  // 1RM calculator state
  const [liftWeight, setLiftWeight] = useState<number>(100);
  const [repsDone, setRepsDone] = useState<number>(5);

  if (!isOpen) return null;

  const rmResults = estimate1RM(liftWeight, repsDone);

  const percentageTable = [
    { pct: 100, reps: '1 RM', load: Math.round(rmResults.average) },
    { pct: 95, reps: '2 reps (RIR 1)', load: Math.round(rmResults.average * 0.95) },
    { pct: 90, reps: '3-4 reps (RIR 1-2)', load: Math.round(rmResults.average * 0.90) },
    { pct: 85, reps: '5-6 reps (RIR 2)', load: Math.round(rmResults.average * 0.85) },
    { pct: 80, reps: '7-8 reps (RIR 2)', load: Math.round(rmResults.average * 0.80) },
    { pct: 75, reps: '9-10 reps (RIR 2)', load: Math.round(rmResults.average * 0.75) },
    { pct: 70, reps: '11-12 reps (RIR 2-3)', load: Math.round(rmResults.average * 0.70) },
    { pct: 65, reps: '15 reps (RIR 3)', load: Math.round(rmResults.average * 0.65) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm no-print">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">
              Herramientas de Ciencias del Deporte y Fisiología
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('1rm')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === '1rm'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Estimador de 1RM (Epley / Brzycki)
          </button>
          <button
            onClick={() => setActiveTab('rir')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'rir'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Matriz RIR vs RPE vs % 1RM
          </button>
          <button
            onClick={() => setActiveTab('volume')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'volume'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Pautas de Volumen Semanal (MEV / MAV / MRV)
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {activeTab === '1rm' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Carga Levantada (kg)
                  </label>
                  <input
                    type="number"
                    value={liftWeight}
                    onChange={(e) => setLiftWeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Repeticiones Completadas (1 a 12)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={repsDone}
                    onChange={(e) => setRepsDone(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono tabular-nums"
                  />
                </div>
              </div>

              {/* 1RM output boxes */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-center">
                <div>
                  <span className="text-[11px] text-slate-400 block">Epley</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-white">{rmResults.epley} kg</span>
                </div>
                <div className="border-x border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Brzycki</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-white">{rmResults.brzycki} kg</span>
                </div>
                <div>
                  <span className="text-[11px] text-emerald-400 font-semibold block">1RM Consolidado</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-emerald-300">{rmResults.average} kg</span>
                </div>
              </div>

              {/* Intensity Table */}
              <div>
                <div className="text-xs font-semibold text-slate-300 mb-2">
                  Tabla de Cargas Progresivas Estimadas por % de 1RM:
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400">
                      <tr>
                        <th className="py-2 px-3">% 1RM</th>
                        <th className="py-2 px-3">Reps Estimadas / RIR</th>
                        <th className="py-2 px-3">Carga Sugerida (kg)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono tabular-nums text-slate-300">
                      {percentageTable.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="py-2 px-3 text-emerald-400 font-semibold">{row.pct}%</td>
                          <td className="py-2 px-3 text-slate-300 font-sans">{row.reps}</td>
                          <td className="py-2 px-3 font-bold text-white">{row.load} kg</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rir' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <p>
                La escala <strong className="text-white">RIR (Reps In Reserve)</strong> es el método con mayor evidencia científica para autorregular el esfuerzo y prevenir el sobreentrenamiento en programas de sobrecarga progresiva.
              </p>

              <div className="space-y-2.5">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-start gap-3">
                  <span className="px-2 py-1 bg-rose-500/20 text-rose-300 font-mono font-bold rounded shrink-0">
                    RIR 0 · RPE 10
                  </span>
                  <div>
                    <strong className="text-white block">Fallo Concéntrico Técnico</strong>
                    No se podría completar ninguna repetición adicional con técnica correcta. Reservar exclusivamente para tests o última serie de ejercicios analíticos en fase de descarga final.
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-start gap-3">
                  <span className="px-2 py-1 bg-amber-500/20 text-amber-300 font-mono font-bold rounded shrink-0">
                    RIR 1 · RPE 9
                  </span>
                  <div>
                    <strong className="text-white block">1 Repetición en Reserva</strong>
                    Esfuerzo muy elevado. Se podría haber realizado exactamente una repetición más sin perder alineación articular. Óptimo para microciclos de intensificación (fase final de mesociclo).
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-start gap-3">
                  <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 font-mono font-bold rounded shrink-0">
                    RIR 2 · RPE 8
                  </span>
                  <div>
                    <strong className="text-white block">2 Repeticiones en Reserva (Padrón de Oro Hipertrofia)</strong>
                    Máximo estímulo hipertrófico con fatiga neuromuscular controlada. La barra desacelera involuntariamente pero la trayectoria es firme y reproducible.
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-start gap-3">
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-300 font-mono font-bold rounded shrink-0">
                    RIR 3 · RPE 7
                  </span>
                  <div>
                    <strong className="text-white block">3 Repeticiones en Reserva</strong>
                    Velocidad concéntrica sólida. Recomendado para semanas 1-2 de adaptación anatómica o ejercicios complejos multiarticulares donde la seguridad técnica es prioritaria.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'volume' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <p>
                Directrices científicas de volumen semanal por grupo muscular (Schoenfeld, Helms, Israetel) para atletas naturales:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans">
                <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 font-mono uppercase text-[10px] block">MEV</span>
                  <span className="text-sm font-bold text-white block mt-0.5">6 - 10 Series / Sem</span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Volumen Mínimo Efectivo. Mantiene masa muscular o genera adaptaciones iniciales en principiantes.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-lg border border-emerald-500/30 bg-emerald-950/20">
                  <span className="text-emerald-400 font-mono uppercase text-[10px] block">MAV</span>
                  <span className="text-sm font-bold text-emerald-300 block mt-0.5">12 - 18 Series / Sem</span>
                  <p className="text-[11px] text-emerald-200 mt-1">
                    Volumen Adaptativo Óptimo. Zona diana donde se producen las mayores tasas de síntesis proteica miofibrilar.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 font-mono uppercase text-[10px] block">MRV</span>
                  <span className="text-sm font-bold text-rose-300 block mt-0.5">20 - 22 Series / Sem</span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Volumen Máximo Recuperable. Superar este umbral conduce a sobreentrenamiento y degradación articular.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400">
                <strong className="text-slate-200">Regla del 10%: </strong>
                Nunca aumentar más de 1-2 series totales o 10% de carga entre microciclos consecutivos. Incluir semana de descarga (deload con reducción de volumen de 40%) cada 4 a 6 semanas.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors"
          >
            Entendido / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
