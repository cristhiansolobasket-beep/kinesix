import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, ShieldAlert, ArrowRight, Activity } from 'lucide-react';
import { ViabilityAnalysis } from '../types/training';

interface ViabilityWidgetProps {
  viability: ViabilityAnalysis;
  onApplyAdjustment?: (proposal: { recommendedTimeframeMonths: number; recommendedTargetDeltaKg: number }) => void;
  compact?: boolean;
}

export const ViabilityWidget: React.FC<ViabilityWidgetProps> = ({
  viability,
  onApplyAdjustment,
  compact = false,
}) => {
  const { status, ratePerWeekKg, ratePercentBodyWeightPerWeek, maxSafeWeeklyKg, explanation, recommendationProposal, hasMedicalRisk, medicalWarning } = viability;

  const getStatusBadge = () => {
    switch (status) {
      case 'viable':
        return (
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Objetivo Fisiológicamente Viable y Seguro</span>
          </div>
        );
      case 'borderline':
        return (
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Objetivo en el Límite Fisiológico Superior</span>
          </div>
        );
      case 'unviable':
        return (
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
            <AlertOctagon className="w-4 h-4 shrink-0 text-rose-400" />
            <span>Semáforo Rojo: Meta NO Viable de Forma Segura</span>
          </div>
        );
    }
  };

  const getBorderColor = () => {
    if (status === 'unviable') return 'border-rose-500/40 bg-rose-950/20';
    if (status === 'borderline') return 'border-amber-500/40 bg-amber-950/20';
    return 'border-emerald-500/40 bg-emerald-950/20';
  };

  return (
    <div className={`rounded-xl border p-4 sm:p-5 transition-all ${getBorderColor()}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>{getStatusBadge()}</div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>Tasa proyectada:</span>
          <span className="font-mono tabular-nums font-semibold text-slate-200">
            {ratePerWeekKg} kg/sem ({ratePercentBodyWeightPerWeek}%)
          </span>
          <span aria-hidden="true">·</span>
          <span>Máx. seguro:</span>
          <span className="font-mono tabular-nums text-slate-300">
            {maxSafeWeeklyKg} kg/sem (1.0%)
          </span>
        </div>
      </div>

      <div className="mt-3 text-sm text-slate-300 leading-relaxed">
        {explanation}
      </div>

      {/* Suggestion & Adjustment button if unviable */}
      {status === 'unviable' && recommendationProposal && (
        <div className="mt-4 p-3.5 bg-rose-950/40 border border-rose-500/30 rounded-lg">
          <div className="text-xs font-semibold text-rose-300 uppercase tracking-wider mb-1">
            Propuesta de Ajuste Profesional y Responsable
          </div>
          <p className="text-xs text-rose-200 leading-relaxed mb-3">
            {recommendationProposal.adjustedProposalText}
          </p>
          {onApplyAdjustment && (
            <button
              type="button"
              onClick={() => onApplyAdjustment(recommendationProposal)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-rose-300 hover:bg-rose-200 rounded-md transition-colors shadow-sm"
            >
              <span>Aplicar Ajuste Seguro Recomendado</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Medical Warning if injuries or pathology reported */}
      {hasMedicalRisk && medicalWarning && (
        <div className="mt-3 p-3 bg-amber-950/40 border border-amber-500/30 rounded-lg flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200 leading-relaxed">
            <span className="font-semibold text-amber-300">Aviso de Seguridad Biomecánica: </span>
            {medicalWarning}
          </div>
        </div>
      )}
    </div>
  );
};
