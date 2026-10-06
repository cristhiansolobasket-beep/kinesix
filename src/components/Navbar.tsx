import React from 'react';
import { Activity, PlusCircle, Printer, Calculator, BookOpen, Users } from 'lucide-react';

interface NavbarProps {
  currentView: 'dashboard' | 'form' | 'plan' | 'workout_mode';
  onNavigate: (view: 'dashboard' | 'form' | 'plan') => void;
  onOpenTools: () => void;
  onOpenMethodology: () => void;
  hasActivePlan: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenTools,
  onOpenMethodology,
  hasActivePlan,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Brand title, single element wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                KINESIX
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-slate-400 border-l border-slate-800 pl-2">
                Sistema Experto de Planificación Deportiva
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              currentView === 'dashboard'
                ? 'text-emerald-400 border-b-2 border-emerald-400 pb-0.5'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Atletas y Fichas</span>
          </button>

          <button
            onClick={() => onNavigate('form')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              currentView === 'form'
                ? 'text-emerald-400 border-b-2 border-emerald-400 pb-0.5'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nueva Evaluación</span>
          </button>

          {hasActivePlan && (
            <button
              onClick={() => onNavigate('plan')}
              className={`flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                currentView === 'plan' || currentView === 'workout_mode'
                  ? 'text-emerald-400 border-b-2 border-emerald-400 pb-0.5'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Plan de Entrenamiento</span>
            </button>
          )}

          <button
            onClick={onOpenTools}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors whitespace-nowrap"
          >
            <Calculator className="w-4 h-4" />
            <span>Calculadora 1RM / RIR</span>
          </button>

          <button
            onClick={onOpenMethodology}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors whitespace-nowrap"
          >
            <BookOpen className="w-4 h-4" />
            <span>Criterios Científicos</span>
          </button>
        </nav>

        {/* Zone 3: Primary action */}
        <div className="flex items-center gap-2.5">
          {currentView === 'plan' && (
            <button
              onClick={() => window.print()}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-700/80 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
              title="Imprimir o exportar reporte a PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('form')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-emerald-950"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Nuevo Plan</span>
          </button>
        </div>
      </div>
    </header>
  );
};
