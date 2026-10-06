import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2, ArrowLeft, Clock, Dumbbell, ShieldCheck, ChevronRight } from 'lucide-react';
import { TrainingPlan, WorkoutDay, Exercise } from '../types/training';
import { formatSeconds } from '../utils/calculator';

interface ClientWorkoutViewProps {
  plan: TrainingPlan;
  dayIndex: number;
  onExit: () => void;
}

export const ClientWorkoutView: React.FC<ClientWorkoutViewProps> = ({
  plan,
  dayIndex,
  onExit,
}) => {
  const workoutDay: WorkoutDay = plan.weeklyRoutine[dayIndex] || plan.weeklyRoutine[0];
  const [activeExIndex, setActiveExIndex] = useState<number>(0);
  const [completedSets, setCompletedSets] = useState<{ [exerciseId: string]: boolean[] }>({});
  
  // Timer state
  const currentExercise: Exercise = workoutDay.exercises[activeExIndex] || workoutDay.exercises[0];
  const [timerSeconds, setTimerSeconds] = useState<number>(currentExercise.restSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerTotal, setTimerTotal] = useState<number>(currentExercise.restSeconds);

  // Initialize completed sets map
  useEffect(() => {
    const initialMap: { [key: string]: boolean[] } = {};
    workoutDay.exercises.forEach((ex, idx) => {
      // parse sets count from "4 x 6-8" or "3 x 10"
      const match = ex.setsReps.match(/(\d+)\s*x/);
      const numSets = match ? parseInt(match[1], 10) : 3;
      initialMap[`ex-${idx}`] = new Array(numSets).fill(false);
    });
    setCompletedSets(initialMap);
  }, [workoutDay]);

  // Update timer whenever exercise changes
  useEffect(() => {
    if (currentExercise) {
      setTimerSeconds(currentExercise.restSeconds);
      setTimerTotal(currentExercise.restSeconds);
      setIsTimerRunning(false);
    }
  }, [activeExIndex, currentExercise]);

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      // Try to trigger subtle vibration if supported
      if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const toggleSetCompleted = (exIdx: number, setIdx: number) => {
    setCompletedSets((prev) => {
      const key = `ex-${exIdx}`;
      const sets = [...(prev[key] || [false, false, false])];
      sets[setIdx] = !sets[setIdx];

      // Auto start rest timer when set is completed
      if (sets[setIdx]) {
        setTimerSeconds(currentExercise.restSeconds);
        setTimerTotal(currentExercise.restSeconds);
        setIsTimerRunning(true);
      }

      return { ...prev, [key]: sets };
    });
  };

  const handleAdjustTimer = (delta: number) => {
    setTimerSeconds((prev) => Math.max(0, prev + delta));
  };

  const progressPct = timerTotal > 0 ? ((timerTotal - timerSeconds) / timerTotal) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <button
          onClick={onExit}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Finalizar Sesión / Volver al Plan</span>
        </button>

        <div className="text-right">
          <span className="text-xs text-slate-400">Atleta: </span>
          <span className="text-xs font-semibold text-slate-200">{plan.clientName}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Routine Exercise Navigation */}
        <div className="lg:col-span-1 space-y-3">
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
            <h1 className="text-sm font-bold text-white">{workoutDay.dayName}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{workoutDay.muscleGroup}</p>
          </div>

          <div className="space-y-1.5">
            {workoutDay.exercises.map((ex, idx) => {
              const sets = completedSets[`ex-${idx}`] || [];
              const allDone = sets.length > 0 && sets.every(Boolean);
              const isActive = activeExIndex === idx;

              return (
                <button
                  key={idx}
                  onClick={() => setActiveExIndex(idx)}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between ${
                    isActive
                      ? 'bg-slate-800/90 border-emerald-500/50 text-white'
                      : 'bg-slate-900/40 border-slate-850 hover:bg-slate-850 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="w-5 h-5 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center text-[10px] font-mono text-slate-300 shrink-0">
                      {idx + 1}
                    </span>
                    <span className="truncate font-medium">{ex.name}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[11px] text-slate-400">{ex.setsReps}</span>
                    {allDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Exercise Focus & Rest Timer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Exercise Card */}
          <div className="p-5 sm:p-6 bg-slate-900/80 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">
                Ejercicio {activeExIndex + 1} de {workoutDay.exercises.length}
              </span>
              <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                {currentExercise.rirRange}
              </span>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">{currentExercise.name}</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4 text-xs font-mono">
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Series x Reps</span>
                <span className="text-slate-200 font-semibold text-sm">{currentExercise.setsReps}</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Rango RIR</span>
                <span className="text-emerald-400 font-semibold text-sm">{currentExercise.rirRange}</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-slate-500 block text-[10px] uppercase">Descanso Prescrito</span>
                <span className="text-slate-200 font-semibold text-sm">{currentExercise.restSeconds}s</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 text-xs text-slate-300 leading-relaxed mb-5">
              <span className="font-semibold text-slate-200 block mb-0.5">Nota Técnica de Ejecución:</span>
              {currentExercise.technicalNote}
            </div>

            {/* Set tracker check buttons */}
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-2">
                Registro de Series Realizadas (clic al completar para iniciar descanso):
              </div>
              <div className="flex flex-wrap gap-2">
                {(completedSets[`ex-${activeExIndex}`] || [false, false, false]).map((isDone, sIdx) => (
                  <button
                    key={sIdx}
                    onClick={() => toggleSetCompleted(activeExIndex, sIdx)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-mono transition-all flex items-center gap-2 ${
                      isDone
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-950 border border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isDone ? 'text-slate-950' : 'text-slate-600'}`} />
                    <span>Serie {sIdx + 1}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Rest Stopwatch / Timer Card */}
          <div className="p-5 sm:p-6 bg-slate-900/90 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Cronómetro de Descanso Entre Series</span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Pausa fisiológica recomendada
              </span>
            </div>

            {/* Timer visual circle / display */}
            <div className="flex flex-col items-center justify-center py-4">
              <div className="text-5xl font-mono font-bold tabular-nums text-white tracking-wider mb-2">
                {formatSeconds(timerSeconds)}
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-xs bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 mb-5">
                <div
                  className="bg-emerald-400 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, 100 - progressPct))}%` }}
                />
              </div>

              {/* Timer Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleAdjustTimer(-15)}
                  className="px-2.5 py-1 text-xs font-mono text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-md transition-colors"
                >
                  -15s
                </button>

                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold shadow-sm transition-all ${
                    isTimerRunning
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
                  }`}
                >
                  {isTimerRunning ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>{timerSeconds === 0 ? 'Reiniciar' : 'Iniciar'} Descanso</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimerSeconds(currentExercise.restSeconds);
                  }}
                  className="p-2 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-md transition-colors"
                  title="Reiniciar a tiempo prescrito"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleAdjustTimer(30)}
                  className="px-2.5 py-1 text-xs font-mono text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-md transition-colors"
                >
                  +30s
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
