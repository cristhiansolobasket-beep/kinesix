import React, { useState } from 'react';
import { Printer, Edit3, Check, Plus, Trash2, ShieldAlert, ArrowLeft, Play, Dumbbell, Calendar, Info, Clock, AlertTriangle } from 'lucide-react';
import { TrainingPlan, WorkoutDay, Exercise } from '../types/training';
import { formatSeconds } from '../utils/calculator';

interface PlanViewProps {
  plan: TrainingPlan;
  onUpdatePlan: (updated: TrainingPlan) => void;
  onStartWorkoutMode: (dayIndex: number) => void;
  onBackToDashboard: () => void;
}

export const PlanView: React.FC<PlanViewProps> = ({
  plan,
  onUpdatePlan,
  onStartWorkoutMode,
  onBackToDashboard,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState<TrainingPlan>(plan);
  const [selectedDayTab, setSelectedDayTab] = useState<number>(0);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  const handleSaveEdits = () => {
    onUpdatePlan(editedPlan);
    setIsEditing(false);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  const handleExerciseChange = (dayIndex: number, exIndex: number, field: keyof Exercise, value: any) => {
    setEditedPlan((prev) => {
      const copy = JSON.parse(JSON.stringify(prev)) as TrainingPlan;
      copy.weeklyRoutine[dayIndex].exercises[exIndex] = {
        ...copy.weeklyRoutine[dayIndex].exercises[exIndex],
        [field]: value,
      };
      return copy;
    });
  };

  const handleAddExercise = (dayIndex: number) => {
    setEditedPlan((prev) => {
      const copy = JSON.parse(JSON.stringify(prev)) as TrainingPlan;
      const newEx: Exercise = {
        name: 'Nuevo Ejercicio',
        setsReps: '3 x 10-12',
        rirRange: 'RIR 2',
        restSeconds: 90,
        technicalNote: 'Ejecución controlada con fase excéntrica de 2 segundos.',
      };
      copy.weeklyRoutine[dayIndex].exercises.push(newEx);
      return copy;
    });
  };

  const handleDeleteExercise = (dayIndex: number, exIndex: number) => {
    setEditedPlan((prev) => {
      const copy = JSON.parse(JSON.stringify(prev)) as TrainingPlan;
      copy.weeklyRoutine[dayIndex].exercises.splice(exIndex, 1);
      return copy;
    });
  };

  const currentPlan = isEditing ? editedPlan : plan;
  const currentDay = currentPlan.weeklyRoutine[selectedDayTab] || currentPlan.weeklyRoutine[0];

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 space-y-8">
      {/* Action Bar (No Print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Dashboard de Atletas</span>
        </button>

        <div className="flex items-center gap-2.5">
          {isSavedNotice && (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>Plan actualizado y aprobado</span>
            </span>
          )}

          {isEditing ? (
            <button
              onClick={handleSaveEdits}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-lg transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Guardar y Aprobar Cambios</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setEditedPlan(JSON.parse(JSON.stringify(plan)));
                setIsEditing(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Modificar Plan (Entrenador)</span>
            </button>
          )}

          <button
            onClick={() => onStartWorkoutMode(selectedDayTab)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg transition-colors"
            title="Abrir interfaz interactiva para el cliente con cronómetro de descansos"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Modo Sesión Activa</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Document Header */}
      <div className="print-card bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">
              Planificación Deportiva Personalizada
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">
              Atleta: {currentPlan.clientName}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <span>Supervisado por: Entrenador / Preparador Físico</span>
              <span aria-hidden="true">·</span>
              <span>Metodología Basada en Evidencia</span>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-400">
            <div>Duración: <span className="font-semibold text-slate-200 font-mono tabular-nums">{currentPlan.summary.totalDurationMonths} meses</span></div>
            <div>Frecuencia: <span className="font-semibold text-slate-200 font-mono tabular-nums">{currentPlan.summary.weeklyFrequencyDays} días/semana</span></div>
            <div>Sesión: <span className="font-semibold text-slate-200 font-mono tabular-nums">{currentPlan.summary.sessionMinutes} minutos</span></div>
          </div>
        </div>

        {/* Medical Warning if exists */}
        {currentPlan.medicalWarning && (
          <div className="mt-5 p-3.5 bg-amber-950/40 border border-amber-500/40 rounded-lg flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200 leading-relaxed">
              <span className="font-bold text-amber-300">ADVERTENCIA DE SEGURIDAD CLÍNICA: </span>
              {currentPlan.medicalWarning}
            </div>
          </div>
        )}

        {/* A) Análisis de Viabilidad */}
        <div className="mt-6 pt-5 border-t border-slate-800/60">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-emerald-400" />
            <span>A) Análisis de Viabilidad Fisiológica</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed font-sans">
            {currentPlan.analysisViability}
          </p>
        </div>

        {/* B) Resumen del Plan */}
        <div className="mt-6 pt-5 border-t border-slate-800/60">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
            <span>B) Resumen del Plan de Entrenamiento</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
              <div className="text-slate-400">Objetivo Central</div>
              <div className="font-semibold text-white capitalize mt-0.5">
                {currentPlan.summary.primaryGoal.replace('_', ' ')}
              </div>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
              <div className="text-slate-400">Duración y Frecuencia</div>
              <div className="font-semibold text-white font-mono tabular-nums mt-0.5">
                {currentPlan.summary.totalDurationMonths} meses · {currentPlan.summary.weeklyFrequencyDays} días/sem
              </div>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
              <div className="text-slate-400">Tiempo por Sesión</div>
              <div className="font-semibold text-white font-mono tabular-nums mt-0.5">
                {currentPlan.summary.sessionMinutes} min ({currentPlan.summary.location.replace('_', ' ')})
              </div>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
              <div className="text-slate-400">Enfoque Primario</div>
              <div className="font-semibold text-emerald-300 mt-0.5 truncate" title={currentPlan.summary.mainFocus}>
                Sobrecarga Progresiva RIR 1-3
              </div>
            </div>
          </div>
        </div>

        {/* C) Planificación por Meses (Fases Progresivas) */}
        <div className="mt-6 pt-5 border-t border-slate-800/60">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>C) Planificación por Meses (Periodización Progresiva)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {currentPlan.phases.map((phase, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-950/50 rounded-lg border border-slate-800/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-emerald-400">Fase {phase.phaseNumber}</span>
                    <span className="text-slate-400 font-mono tabular-nums">{phase.durationWeeks} semanas</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-2">{phase.name}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    <strong className="text-slate-400">Objetivo: </strong>
                    {phase.objective}
                  </p>
                </div>
                <div className="text-xs text-slate-400 pt-2 border-t border-slate-900">
                  <span className="font-medium text-slate-300">Progresión: </span>
                  {phase.progressionNotes}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* D) Rutina Semanal Detallada */}
      <div className="print-card bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
              <span>D) Rutina Semanal Detallada</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Columnas reglamentarias: Ejercicio | Series x Reps | Rango RIR (1-3) | Descanso | Nota técnica de ejecución.
            </p>
          </div>

          {/* Day selection tabs */}
          <div className="no-print flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {currentPlan.weeklyRoutine.map((day, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDayTab(idx)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  selectedDayTab === idx
                    ? 'bg-emerald-400 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Día {day.dayNumber}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Day View */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-950/80 rounded-lg border border-slate-800/80">
            <div>
              <h2 className="text-sm font-bold text-white">{currentDay.dayName}</h2>
              <span className="text-xs text-slate-400">Grupo Muscular: {currentDay.muscleGroup}</span>
            </div>
            <button
              onClick={() => onStartWorkoutMode(selectedDayTab)}
              className="no-print inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md transition-colors shrink-0"
            >
              <Play className="w-3 h-3" />
              <span>Iniciar Día con Cronómetro</span>
            </button>
          </div>

          {/* Exercise Table */}
          <div className="overflow-x-auto">
            <table className="print-table w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Ejercicio</th>
                  <th className="py-2.5 px-3 w-28">Series x Reps</th>
                  <th className="py-2.5 px-3 w-24">Rango RIR</th>
                  <th className="py-2.5 px-3 w-24">Descanso</th>
                  <th className="py-2.5 px-3">Nota Técnica de Ejecución</th>
                  {isEditing && <th className="py-2.5 px-3 w-16 no-print">Acción</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {currentDay.exercises.map((ex, exIdx) => (
                  <tr key={exIdx} className="hover:bg-slate-850/40 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-white">
                      {isEditing ? (
                        <input
                          type="text"
                          value={ex.name}
                          onChange={(e) => handleExerciseChange(selectedDayTab, exIdx, 'name', e.target.value)}
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-white"
                        />
                      ) : (
                        ex.name
                      )}
                    </td>

                    <td className="py-2.5 px-3 font-mono tabular-nums text-slate-200">
                      {isEditing ? (
                        <input
                          type="text"
                          value={ex.setsReps}
                          onChange={(e) => handleExerciseChange(selectedDayTab, exIdx, 'setsReps', e.target.value)}
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-white"
                        />
                      ) : (
                        ex.setsReps
                      )}
                    </td>

                    <td className="py-2.5 px-3 font-mono tabular-nums text-emerald-400 font-semibold">
                      {isEditing ? (
                        <input
                          type="text"
                          value={ex.rirRange}
                          onChange={(e) => handleExerciseChange(selectedDayTab, exIdx, 'rirRange', e.target.value)}
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-white"
                        />
                      ) : (
                        ex.rirRange
                      )}
                    </td>

                    <td className="py-2.5 px-3 font-mono tabular-nums text-slate-300">
                      {isEditing ? (
                        <input
                          type="number"
                          value={ex.restSeconds}
                          onChange={(e) => handleExerciseChange(selectedDayTab, exIdx, 'restSeconds', parseInt(e.target.value, 10))}
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-white"
                        />
                      ) : (
                        `${ex.restSeconds}s (${formatSeconds(ex.restSeconds)})`
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-slate-300 leading-snug">
                      {isEditing ? (
                        <textarea
                          rows={2}
                          value={ex.technicalNote}
                          onChange={(e) => handleExerciseChange(selectedDayTab, exIdx, 'technicalNote', e.target.value)}
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-white"
                        />
                      ) : (
                        ex.technicalNote
                      )}
                    </td>

                    {isEditing && (
                      <td className="py-2.5 px-3 no-print">
                        <button
                          type="button"
                          onClick={() => handleDeleteExercise(selectedDayTab, exIdx)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Eliminar ejercicio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isEditing && (
            <div className="no-print pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => handleAddExercise(selectedDayTab)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>+ Agregar Ejercicio a este Día</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* E) Principios Clave */}
      <div className="print-card bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 sm:p-7">
        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>E) Principios Clave de Ejecución y Adaptación</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {currentPlan.keyPrinciples.map((principle, idx) => (
            <div key={idx} className="p-4 bg-slate-950/50 rounded-lg border border-slate-800/80">
              <div className="text-xs font-semibold text-emerald-400 mb-1">
                {idx + 1}. {principle.title}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {principle.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* F) Criterios de Evaluación y Ajuste de Cargas */}
      <div className="print-card bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 sm:p-7">
        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>F) Criterios de Evaluación y Autorregulación para el Entrenador</span>
        </div>

        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
            <strong className="text-white block mb-0.5">Regla de Progresión RIR:</strong>
            {currentPlan.evaluationCriteria.rirRule}
          </div>
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
            <strong className="text-white block mb-0.5">Protocolo de Descarga (Deload):</strong>
            {currentPlan.evaluationCriteria.deloadRule}
          </div>
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
            <strong className="text-white block mb-0.5">Ajuste de Volumen por Fatiga:</strong>
            {currentPlan.evaluationCriteria.volumeAdjustment}
          </div>
        </div>
      </div>

      {/* Hábitos Generales & Responsabilidad */}
      <div className="print-card bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 sm:p-7">
        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-emerald-400" />
          <span>Hábitos Generales de Recuperación y Sueño</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-xs">
          <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/80">
            <span className="font-semibold text-slate-200 block mb-1">Pauta Proteica Orientativa</span>
            <p className="text-slate-400">{currentPlan.generalHabits.proteinRecommendation}</p>
          </div>
          <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/80">
            <span className="font-semibold text-slate-200 block mb-1">Hidratación</span>
            <p className="text-slate-400">{currentPlan.generalHabits.hydrationRecommendation}</p>
          </div>
          <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/80">
            <span className="font-semibold text-slate-200 block mb-1">Descanso Nocturno</span>
            <p className="text-slate-400">{currentPlan.generalHabits.sleepRecommendation}</p>
          </div>
        </div>

        <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
          <span className="font-semibold text-slate-300">Deslinde de Responsabilidad: </span>
          {currentPlan.generalHabits.disclaimer}
        </div>
      </div>
    </div>
  );
};
