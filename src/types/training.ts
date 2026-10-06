export type Gender = 'masculino' | 'femenino' | 'otro';
export type FitnessLevel = 'principiante' | 'intermedio' | 'avanzado';
export type PrimaryGoal = 'perdida_grasa' | 'ganancia_muscular' | 'hipertrofia' | 'recomposicion' | 'rendimiento' | 'salud';
export type TrainingLocation = 'gimnasio_completo' | 'casa' | 'parque';

export interface ClientProfile {
  name: string;
  age: number;
  gender: Gender;
  weightKg: number;
  heightCm: number;
  bodyFatPct?: number;
  fitnessLevel: FitnessLevel;
  experienceYears: number;
  injuriesOrLimitations: string;
  contraindications: string;
  relevantMedication: string;
  primaryGoal: PrimaryGoal;
  specificGoalDescription: string;
  targetWeightDeltaKg: number; // e.g. -6 for losing 6kg, +3 for gaining 3kg, 0 for recomposition
  timeframeMonths: number;
  daysPerWeek: number;
  minutesPerSession: number;
  trainingLocation: TrainingLocation;
  availableEquipment: string;
  exercisePreferences: string;
  dislikedExercises: string;
}

export interface ViabilityAnalysis {
  isViable: boolean;
  status: 'viable' | 'borderline' | 'unviable';
  ratePerWeekKg: number;
  ratePerMonthKg: number;
  ratePercentBodyWeightPerWeek: number;
  minSafeWeeklyKg: number;
  maxSafeWeeklyKg: number;
  minSafeMonthlyKg: number;
  maxSafeMonthlyKg: number;
  explanation: string;
  hasMedicalRisk: boolean;
  medicalWarning?: string;
  recommendationProposal?: {
    recommendedTimeframeMonths: number;
    recommendedTargetDeltaKg: number;
    adjustedProposalText: string;
  };
}

export interface Exercise {
  id?: string;
  name: string;
  setsReps: string;
  rirRange: string;
  restSeconds: number;
  technicalNote: string;
}

export interface WorkoutDay {
  dayNumber: number;
  dayName: string;
  muscleGroup: string;
  exercises: Exercise[];
}

export interface TrainingPhase {
  phaseNumber: number;
  name: string;
  durationWeeks: number;
  objective: string;
  progressionNotes: string;
}

export interface KeyPrinciple {
  title: string;
  description: string;
}

export interface EvaluationCriteria {
  rirRule: string;
  deloadRule: string;
  volumeAdjustment: string;
}

export interface GeneralHabits {
  proteinRecommendation: string;
  hydrationRecommendation: string;
  sleepRecommendation: string;
  disclaimer: string;
}

export interface PlanSummary {
  primaryGoal: PrimaryGoal;
  totalDurationMonths: number;
  weeklyFrequencyDays: number;
  sessionMinutes: number;
  location: TrainingLocation;
  mainFocus: string;
}

export interface TrainingPlan {
  id?: string;
  createdAt?: string;
  clientName: string;
  analysisViability: string;
  summary: PlanSummary;
  medicalWarning?: string;
  phases: TrainingPhase[];
  weeklyRoutine: WorkoutDay[];
  keyPrinciples: KeyPrinciple[];
  evaluationCriteria: EvaluationCriteria;
  generalHabits: GeneralHabits;
}

export interface ClientRecord {
  id: string;
  createdAt: string;
  profile: ClientProfile;
  viability: ViabilityAnalysis;
  plan?: TrainingPlan;
  status: 'plan_activo' | 'revision_pendiente' | 'meta_inviable';
}
