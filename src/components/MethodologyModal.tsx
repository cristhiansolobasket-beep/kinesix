import React from 'react';
import { X, BookOpen, ShieldCheck, Activity, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm no-print">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">
              Criterios Científicos y Reglas Metodológicas del Sistema
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed font-sans">
          <div>
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>1. Principio Fundamental: Seguridad y Alcance Real</span>
            </h3>
            <p>
              El sistema opera bajo los estándares de la ciencia del entrenamiento deportivo (ISSN, NSCA, ACSM). Su propósito exclusivo es la prescripción de programas progresivos, 100% alcanzables y seguros bajo la supervisión directa del entrenador.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <div className="text-xs font-semibold text-white uppercase tracking-wider">
              Umbrales Fisiológicos Normativos de Viabilidad:
            </div>
            <ul className="space-y-2 list-disc list-inside text-slate-300">
              <li>
                <strong className="text-emerald-400">Pérdida de grasa saludable: </strong>
                Entre <span className="font-mono tabular-nums">0.5% y 1.0%</span> del peso corporal total por semana. Cualquier meta que exija una tasa superior a 1.0% semanal activa el <span className="text-rose-400 font-semibold">Semáforo Rojo</span> por riesgo de pérdida de masa magra, afectación tiroidea y sobreentrenamiento.
              </li>
              <li>
                <strong className="text-emerald-400">Ganancia muscular natural: </strong>
                Entre <span className="font-mono tabular-nums">0.25kg y 0.5kg</span> de tejido magro por mes en atletas intermedios (hasta 0.8kg/mes en novatos). Tasas superiores resultan invariablemente en acumulación adiposa o son fisiológicamente inalcanzables de forma natural.
              </li>
              <li>
                <strong className="text-emerald-400">Progresión por Sobrecarga Limpia: </strong>
                Incremento máximo semanal de volumen o carga absoluta del <span className="font-mono tabular-nums">10%</span>. Inclusión obligatoria de semanas de descarga (deload con -40% de volumen) cada 4 a 6 semanas si el plan supera 2 meses.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              <span>2. Restricciones y Prohibiciones Estrictas</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-lg">
                <strong className="text-rose-300 block mb-1">Sin Dietas Cerradas ni Suplementos</strong>
                Prohibido prescribir menús con calorías fijas, gramos milimétricos, quemadores de grasa o suplementación farmacológica. Solo recomendaciones orientativas de hábitos (proteína g/kg, agua y sueño).
              </div>
              <div className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-lg">
                <strong className="text-rose-300 block mb-1">Cero Promesas Garantizadas</strong>
                Prohibido usar frases de venta tipo "bajarás 10kg garantizados" o crear planes milagro. Todo análisis es biomecánico y fisiológico.
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>3. Estructura Obligatoria de los Planes (A a F)</span>
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
              <li><strong>A) Análisis de Viabilidad:</strong> Evaluación en 2 líneas indicando si la meta es alcanzable y la justificación fisiológica.</li>
              <li><strong>B) Resumen del Plan:</strong> Objetivo, duración total, frecuencia semanal y enfoque biomecánico principal.</li>
              <li><strong>C) Planificación por Meses:</strong> Fases progresivas (adaptación, hipertrofia/fuerza, descarga).</li>
              <li><strong>D) Rutina Semanal Detallada:</strong> Tablas día por día con Ejercicio, Series x Reps, Rango RIR (1-3), Descanso y Nota técnica.</li>
              <li><strong>E) Principios Clave:</strong> 3 recomendaciones estrictas de progresión, técnica y descanso.</li>
              <li><strong>F) Criterios de Evaluación:</strong> Regla de aumento de carga si RIR &gt; 3, protocolos de deload y ajuste de volumen.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors"
          >
            Aceptar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
