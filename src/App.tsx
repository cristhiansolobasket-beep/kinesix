import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ClientDashboard } from './components/ClientDashboard';
import { EvaluationForm } from './components/EvaluationForm';
import { PlanView } from './components/PlanView';
import { ClientWorkoutView } from './components/ClientWorkoutView';
import { ScientificToolsModal } from './components/ScientificToolsModal';
import { MethodologyModal } from './components/MethodologyModal';
import { ClientProfile, ClientRecord, TrainingPlan } from './types/training';
import { sampleClients } from './data/sampleClients';
import { calculateViability } from './utils/calculator';

const STORAGE_KEY = 'kinesix_clients_v1';

export default function App() {
  const [clients, setClients] = useState<ClientRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse clients from storage', e);
    }
    return sampleClients;
  });

  const [currentView, setCurrentView] = useState<'dashboard' | 'form' | 'plan' | 'workout_mode'>('dashboard');
  const [activeClient, setActiveClient] = useState<ClientRecord | null>(sampleClients[0]);
  const [selectedWorkoutDay, setSelectedWorkoutDay] = useState<number>(0);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
    } catch (e) {
      console.error('Failed to save clients to storage', e);
    }
  }, [clients]);

  const handleSelectClient = (client: ClientRecord) => {
    setActiveClient(client);
    if (client.plan) {
      setCurrentView('plan');
    } else {
      setCurrentView('form');
    }
  };

  const handleNewEvaluation = () => {
    setActiveClient(null);
    setCurrentView('form');
  };

  const handleFormSubmit = async (profile: ClientProfile) => {
    setIsGenerating(true);
    const viability = calculateViability(profile);

    try {
      // Call backend API
      const response = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar el plan');
      }

      const data = await response.json();
      const generatedPlan: TrainingPlan = data.plan;

      const newRecord: ClientRecord = {
        id: activeClient?.id || `cli-${Date.now()}`,
        createdAt: new Date().toISOString(),
        profile,
        viability,
        plan: generatedPlan,
        status: viability.status === 'unviable' ? 'meta_inviable' : 'plan_activo',
      };

      setClients((prev) => {
        const existingIdx = prev.findIndex((c) => c.id === newRecord.id);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = newRecord;
          return updated;
        }
        return [newRecord, ...prev];
      });

      setActiveClient(newRecord);
      setCurrentView('plan');
    } catch (err: any) {
      console.warn('API error, using local physiological science engine:', err?.message);

      // Local fallback plan construction
      const fallbackPlan: TrainingPlan = {
        id: `plan-${Date.now()}`,
        createdAt: new Date().toISOString(),
        clientName: profile.name,
        analysisViability: viability.explanation,
        summary: {
          primaryGoal: profile.primaryGoal,
          totalDurationMonths: profile.timeframeMonths,
          weeklyFrequencyDays: profile.daysPerWeek,
          sessionMinutes: profile.minutesPerSession,
          location: profile.trainingLocation,
          mainFocus: `Prescripción para ${profile.primaryGoal} con sobrecarga progresiva limpia y RIR 1-3.`,
        },
        medicalWarning: viability.medicalWarning,
        phases: [
          {
            phaseNumber: 1,
            name: 'Mes 1: Adaptación Anatómica y Reclutamiento',
            durationWeeks: 4,
            objective: 'Acondicionamiento ligamentoso y estabilización técnica con RIR 2-3.',
            progressionNotes: 'Volumen moderado, progresión técnica estricta.',
          },
          {
            phaseNumber: 2,
            name: `Meses 2-${Math.max(2, profile.timeframeMonths)}: Tensión Mecánica Progresiva`,
            durationWeeks: Math.max(4, (profile.timeframeMonths - 1) * 4),
            objective: 'Sobrecarga progresiva escalonada con RIR 1-2 y semana de descarga cada 5 microciclos.',
            progressionNotes: 'Aumentar 2.5kg cuando se completen todas las series con RIR >2.',
          },
        ],
        weeklyRoutine: [
          {
            dayNumber: 1,
            dayName: 'Día 1: Torso (Empujes y Tracciones)',
            muscleGroup: 'Pectoral, Espalda, Hombro',
            exercises: [
              {
                name: 'Press de banca plano con barra o mancuernas',
                setsReps: '4 x 6-8',
                rirRange: 'RIR 2',
                restSeconds: 150,
                technicalNote: 'Retracción escapular activa, pausa de 1s sobre esternón.',
              },
              {
                name: 'Remo apoyado en banco inclinado (Seal Row)',
                setsReps: '4 x 8-10',
                rirRange: 'RIR 2',
                restSeconds: 120,
                technicalNote: 'Columna neutra sin impulso de cadera.',
              },
              {
                name: 'Press militar sentado con mancuernas',
                setsReps: '3 x 10-12',
                rirRange: 'RIR 1-2',
                restSeconds: 90,
                technicalNote: 'Respiración diafragmática y control de la fase excéntrica.',
              },
              {
                name: 'Jalón al pecho agarre neutro',
                setsReps: '3 x 10-12',
                rirRange: 'RIR 1',
                restSeconds: 90,
                technicalNote: 'Depresión escapular inicial.',
              },
            ],
          },
          {
            dayNumber: 2,
            dayName: 'Día 2: Pierna y Cadena Posterior',
            muscleGroup: 'Cuádriceps, Isquiosurales, Glúteo',
            exercises: [
              {
                name: 'Sentadilla o Prensa 45° con rango controlado',
                setsReps: '4 x 8-10',
                rirRange: 'RIR 2',
                restSeconds: 150,
                technicalNote: 'Presión en trípode plantar uniforme, profundidad segura.',
              },
              {
                name: 'Peso muerto rumano o Hip Thrust con barra',
                setsReps: '4 x 8-10',
                rirRange: 'RIR 2',
                restSeconds: 120,
                technicalNote: 'Bisagra de cadera pura, columna lumbar neutra.',
              },
              {
                name: 'Curl femoral en máquina',
                setsReps: '3 x 10-12',
                rirRange: 'RIR 1',
                restSeconds: 75,
                technicalNote: 'Fase excéntrica en 3 segundos controlados.',
              },
              {
                name: 'Elevación de talones gemelos',
                setsReps: '4 x 12-15',
                rirRange: 'RIR 1',
                restSeconds: 60,
                technicalNote: 'Pausa de 2 segundos en máxima extensión.',
              },
            ],
          },
        ],
        keyPrinciples: [
          {
            title: 'Sobrecarga Progresiva Controlada',
            description: 'Nunca aumentar más del 10% de carga o volumen por semana.',
          },
          {
            title: 'Técnica Estricta y Control Excéntrico',
            description: 'Fase excéntrica controlada en 2-3 segundos en cada repetición.',
          },
          {
            title: 'Descarga Programada',
            description: 'Semana de descarga con -40% de volumen cada 4 a 6 microciclos.',
          },
        ],
        evaluationCriteria: {
          rirRule: 'Si completa todas las series con RIR >3, aumentar 2.5kg en el siguiente microciclo.',
          deloadRule: 'Si el RIR cae a 0 en dos microciclos seguidos, aplicar descarga inmediata.',
          volumeAdjustment: 'Si no hay recuperación a las 48-72h, reducir 2 series semanales.',
        },
        generalHabits: {
          proteinRecommendation: 'Ingesta proteica orientativa de 1.6 a 2.2 g/kg de peso al día en alimentos completos.',
          hydrationRecommendation: 'Consumo diario de 35 a 45 ml/kg de peso corporal.',
          sleepRecommendation: 'Dormir entre 7 y 8 horas ininterrumpidas por noche.',
          disclaimer: 'Este plan de entrenamiento deportivo no reemplaza la valoración médica ni incluye dietas ni suplementos.',
        },
      };

      const fallbackRecord: ClientRecord = {
        id: activeClient?.id || `cli-${Date.now()}`,
        createdAt: new Date().toISOString(),
        profile,
        viability,
        plan: fallbackPlan,
        status: viability.status === 'unviable' ? 'meta_inviable' : 'plan_activo',
      };

      setClients((prev) => {
        const existingIdx = prev.findIndex((c) => c.id === fallbackRecord.id);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = fallbackRecord;
          return updated;
        }
        return [fallbackRecord, ...prev];
      });

      setActiveClient(fallbackRecord);
      setCurrentView('plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdatePlan = (updatedPlan: TrainingPlan) => {
    if (!activeClient) return;
    const updatedClient: ClientRecord = {
      ...activeClient,
      plan: updatedPlan,
    };
    setActiveClient(updatedClient);
    setClients((prev) => prev.map((c) => (c.id === updatedClient.id ? updatedClient : c)));
  };

  const handleStartWorkoutMode = (dayIndex: number) => {
    setSelectedWorkoutDay(dayIndex);
    setCurrentView('workout_mode');
  };

  return (
    <div className="min-h-full flex flex-col bg-slate-950 text-slate-100">
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onOpenTools={() => setIsToolsOpen(true)}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        hasActivePlan={Boolean(activeClient?.plan)}
      />

      <main className="flex-1 pb-16">
        {currentView === 'dashboard' && (
          <ClientDashboard
            clients={clients}
            onSelectClient={handleSelectClient}
            onNewEvaluation={handleNewEvaluation}
          />
        )}

        {currentView === 'form' && (
          <EvaluationForm
            initialProfile={activeClient?.profile}
            onSubmit={handleFormSubmit}
            isLoading={isGenerating}
          />
        )}

        {currentView === 'plan' && activeClient?.plan && (
          <PlanView
            plan={activeClient.plan}
            onUpdatePlan={handleUpdatePlan}
            onStartWorkoutMode={handleStartWorkoutMode}
            onBackToDashboard={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'workout_mode' && activeClient?.plan && (
          <ClientWorkoutView
            plan={activeClient.plan}
            dayIndex={selectedWorkoutDay}
            onExit={() => setCurrentView('plan')}
          />
        )}
      </main>

      {/* Scientific Reference Modals */}
      <ScientificToolsModal
        isOpen={isToolsOpen}
        onClose={() => setIsToolsOpen(false)}
      />

      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />
    </div>
  );
}
