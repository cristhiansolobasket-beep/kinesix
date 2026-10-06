import React, { useState, useEffect } from 'react';
import { User, Shield, Target, Calendar, Dumbbell, Sparkles, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { ClientProfile, Gender, FitnessLevel, PrimaryGoal, TrainingLocation } from '../types/training';
import { calculateViability } from '../utils/calculator';
import { ViabilityWidget } from './ViabilityWidget';
import { sampleClients } from '../data/sampleClients';

interface EvaluationFormProps {
  initialProfile?: ClientProfile;
  onSubmit: (profile: ClientProfile) => Promise<void>;
  isLoading: boolean;
}

const emptyProfile: ClientProfile = {
  name: '',
  age: 30,
  gender: 'masculino',
  weightKg: 75,
  heightCm: 175,
  bodyFatPct: undefined,
  fitnessLevel: 'intermedio',
  experienceYears: 2,
  injuriesOrLimitations: 'Ninguna',
  contraindications: 'Ninguna',
  relevantMedication: 'Ninguna',
  primaryGoal: 'perdida_grasa',
  specificGoalDescription: 'Bajar 4kg de grasa en 2 meses preservando masa muscular',
  targetWeightDeltaKg: -4,
  timeframeMonths: 2,
  daysPerWeek: 4,
  minutesPerSession: 60,
  trainingLocation: 'gimnasio_completo',
  availableEquipment: 'Barras, mancuernas, poleas y máquinas de gimnasio comercial',
  exercisePreferences: 'Sentadillas, jalones, press con mancuernas',
  dislikedExercises: 'Burpees, saltos de cajón',
};

export const EvaluationForm: React.FC<EvaluationFormProps> = ({
  initialProfile,
  onSubmit,
  isLoading,
}) => {
  const [profile, setProfile] = useState<ClientProfile>(initialProfile || emptyProfile);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Calculate viability reactively
  const viability = calculateViability(profile);

  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
    }
  }, [initialProfile]);

  const handleChange = (field: keyof ClientProfile, value: any) => {
    setProfile((prev) => {
      const updated = { ...prev, [field]: value };
      
      // Auto synchronize target delta sign with goal if needed
      if (field === 'primaryGoal') {
        if (value === 'perdida_grasa' && updated.targetWeightDeltaKg > 0) {
          updated.targetWeightDeltaKg = -Math.abs(updated.targetWeightDeltaKg);
        } else if ((value === 'ganancia_muscular' || value === 'hipertrofia') && updated.targetWeightDeltaKg < 0) {
          updated.targetWeightDeltaKg = Math.abs(updated.targetWeightDeltaKg);
        }
      }
      return updated;
    });
  };

  const handleApplyPreset = (presetIndex: number) => {
    const selected = sampleClients[presetIndex];
    if (selected) {
      setProfile({ ...selected.profile });
      setValidationErrors([]);
    }
  };

  const handleApplySafeAdjustment = (proposal: { recommendedTimeframeMonths: number; recommendedTargetDeltaKg: number }) => {
    setProfile((prev) => ({
      ...prev,
      timeframeMonths: proposal.recommendedTimeframeMonths,
      targetWeightDeltaKg: proposal.recommendedTargetDeltaKg,
      specificGoalDescription: prev.primaryGoal === 'perdida_grasa'
        ? `Bajar ${Math.abs(proposal.recommendedTargetDeltaKg)}kg en ${proposal.recommendedTimeframeMonths} meses con déficit controlado`
        : `Ganar ${Math.abs(proposal.recommendedTargetDeltaKg)}kg en ${proposal.recommendedTimeframeMonths} meses de forma magra`,
    }));
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    if (!profile.name.trim()) errors.push('Nombre del cliente es obligatorio');
    if (!profile.age || profile.age < 14 || profile.age > 90) errors.push('Edad debe estar entre 14 y 90 años');
    if (!profile.weightKg || profile.weightKg < 35 || profile.weightKg > 250) errors.push('Peso debe ser un valor válido en kg (35 - 250)');
    if (!profile.heightCm || profile.heightCm < 120 || profile.heightCm > 230) errors.push('Estatura debe ser un valor válido en cm (120 - 230)');
    if (!profile.timeframeMonths || profile.timeframeMonths <= 0) errors.push('Temporalidad en meses debe ser mayor a 0');
    if (!profile.daysPerWeek || profile.daysPerWeek < 2 || profile.daysPerWeek > 6) errors.push('Disponibilidad de días debe ser de 2 a 6 días/semana');
    if (!profile.minutesPerSession || profile.minutesPerSession < 30) errors.push('Duración de sesión debe ser de al menos 30 minutos');
    if (!profile.trainingLocation) errors.push('Lugar de entrenamiento es requerido');

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    onSubmit(profile);
  };

  const bmi = profile.weightKg && profile.heightCm
    ? (profile.weightKg / Math.pow(profile.heightCm / 100, 2)).toFixed(1)
    : '--';

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6">
      {/* Header and Presets */}
      <div className="mb-6 pb-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Ficha de Evaluación y Prescripción de Entrenamiento
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Diligencie la totalidad de los datos antropométricos y deportivos para ejecutar el análisis de viabilidad científica.
          </p>
        </div>

        {/* Rapid test presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Cargar Ejemplo:</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => handleApplyPreset(0)}
              className="px-2.5 py-1 text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-md transition-colors"
              title="Carlos (Hipertrofia - Viable)"
            >
              Caso Viable
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset(1)}
              className="px-2.5 py-1 text-xs bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 rounded-md transition-colors"
              title="Lucía (Meta extrema no viable)"
            >
              Semáforo Rojo
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset(2)}
              className="px-2.5 py-1 text-xs bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800/80 rounded-md transition-colors"
              title="Marcos (Caso con limitación y lesión)"
            >
              Caso Lesión
            </button>
          </div>
        </div>
      </div>

      {/* Validation alert banner */}
      {validationErrors.length > 0 && (
        <div className="mb-6 p-4 bg-rose-950/40 border border-rose-500/40 rounded-xl">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm mb-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Datos Incompletos: NO inventar datos. Complete todos los campos requeridos:</span>
          </div>
          <ul className="list-disc list-inside text-xs text-rose-300 space-y-1">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Live Viability Widget */}
      <div className="mb-8">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Validación Fisiológica en Tiempo Real
        </div>
        <ViabilityWidget
          viability={viability}
          onApplyAdjustment={handleApplySafeAdjustment}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Datos Antropométricos */}
        <section className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-white mb-4 pb-2 border-b border-slate-800">
            <User className="w-4 h-4 text-emerald-400" />
            <span>1. Datos del Cliente y Antropometría</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ej. Sofía Torres"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Edad (Años) *
              </label>
              <input
                type="number"
                value={profile.age || ''}
                onChange={(e) => handleChange('age', parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
                min="14"
                max="95"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Sexo Biológico *
              </label>
              <select
                value={profile.gender}
                onChange={(e) => handleChange('gender', e.target.value as Gender)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Peso Corporal (kg) *
              </label>
              <input
                type="number"
                step="0.5"
                value={profile.weightKg || ''}
                onChange={(e) => handleChange('weightKg', parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
                min="35"
                max="250"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Estatura (cm) *
              </label>
              <input
                type="number"
                value={profile.heightCm || ''}
                onChange={(e) => handleChange('heightCm', parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
                min="120"
                max="230"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">
                  % Grasa Estimado (Opcional)
                </label>
                <span className="text-xs font-mono text-slate-500">IMC: {bmi}</span>
              </div>
              <input
                type="number"
                step="0.5"
                value={profile.bodyFatPct || ''}
                onChange={(e) => handleChange('bodyFatPct', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Ej. 18.5"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
                min="3"
                max="60"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Estado Físico y Salud */}
        <section className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-white mb-4 pb-2 border-b border-slate-800">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>2. Estado Físico Actual y Seguridad Médica</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nivel de Entrenamiento Actual *
              </label>
              <select
                value={profile.fitnessLevel}
                onChange={(e) => handleChange('fitnessLevel', e.target.value as FitnessLevel)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="principiante">Principiante (0 - 1 año continuado)</option>
                <option value="intermedio">Intermedio (1 - 3 años continuados)</option>
                <option value="avanzado">Avanzado (&gt; 3 años con cargas reglamentadas)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Años de Experiencia en Fuerza *
              </label>
              <input
                type="number"
                step="0.5"
                value={profile.experienceYears || ''}
                onChange={(e) => handleChange('experienceYears', parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
                min="0"
                max="40"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Lesiones o Limitaciones Biomecánicas (Rodilla, hombro, lumbar, etc.) *
              </label>
              <input
                type="text"
                value={profile.injuriesOrLimitations}
                onChange={(e) => handleChange('injuriesOrLimitations', e.target.value)}
                placeholder="Ej. Condromalacia rotuliana o 'Ninguna'"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
              <span className="text-xs text-slate-500 mt-1 block">
                Si reporta lesión o dolor, el sistema adaptará los ejercicios y emitirá la advertencia médica obligatoria.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Contraindicaciones o Patologías (Cardiovascular, hipertensión, diabetes) *
              </label>
              <input
                type="text"
                value={profile.contraindications}
                onChange={(e) => handleChange('contraindications', e.target.value)}
                placeholder="Ej. Hipertensión controlada o 'Ninguna'"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Medicación Relevante *
              </label>
              <input
                type="text"
                value={profile.relevantMedication}
                onChange={(e) => handleChange('relevantMedication', e.target.value)}
                placeholder="Ej. Ninguna / Eutirox / Antihipertensivos"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>
        </section>

        {/* Section 3: Objetivo y Meta Temporal */}
        <section className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-white mb-4 pb-2 border-b border-slate-800">
            <Target className="w-4 h-4 text-emerald-400" />
            <span>3. Objetivo Principal y Temporalidad Fisiológica</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Objetivo Principal *
              </label>
              <select
                value={profile.primaryGoal}
                onChange={(e) => handleChange('primaryGoal', e.target.value as PrimaryGoal)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="perdida_grasa">Pérdida de grasa</option>
                <option value="hipertrofia">Hipertrofia / Ganancia muscular</option>
                <option value="recomposicion">Recomposición corporal</option>
                <option value="rendimiento">Rendimiento atlético</option>
                <option value="salud">Salud y acondicionamiento general</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Meta de Peso Proyectada (kg a perder o ganar) *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  value={profile.targetWeightDeltaKg}
                  onChange={(e) => handleChange('targetWeightDeltaKg', parseFloat(e.target.value))}
                  placeholder="Ej. -5 (bajar 5kg) o +2 (ganar 2kg)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
                  required
                />
                <span className="text-xs font-mono text-slate-400 shrink-0">
                  {profile.targetWeightDeltaKg < 0 ? 'Pérdida' : profile.targetWeightDeltaKg > 0 ? 'Ganancia' : 'Mantener'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Plazo Temporal Proyectado (Meses) *
              </label>
              <input
                type="number"
                step="0.25"
                value={profile.timeframeMonths || ''}
                onChange={(e) => handleChange('timeframeMonths', parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
                min="0.5"
                max="24"
                required
              />
              <span className="text-xs text-slate-500 mt-1 block">
                Equivale aprox. a {Math.round(profile.timeframeMonths * 4.33)} semanas de microciclos.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Descripción Específica de la Meta *
              </label>
              <input
                type="text"
                value={profile.specificGoalDescription}
                onChange={(e) => handleChange('specificGoalDescription', e.target.value)}
                placeholder="Ej. Bajar 6kg en 4 meses manteniendo fuerza"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>
        </section>

        {/* Section 4: Disponibilidad y Material */}
        <section className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-white mb-4 pb-2 border-b border-slate-800">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>4. Disponibilidad Horaria y Material de Entrenamiento</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Días de Entrenamiento por Semana *
              </label>
              <select
                value={profile.daysPerWeek}
                onChange={(e) => handleChange('daysPerWeek', parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
              >
                <option value="2">2 Días (Full Body)</option>
                <option value="3">3 Días (Full Body / Torso-Pierna)</option>
                <option value="4">4 Días (Torso / Pierna)</option>
                <option value="5">5 Días (Frecuencia Híbrida)</option>
                <option value="6">6 Días (Push / Pull / Legs x2)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Minutos por Sesión *
              </label>
              <select
                value={profile.minutesPerSession}
                onChange={(e) => handleChange('minutesPerSession', parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
              >
                <option value="45">45 Minutos</option>
                <option value="60">60 Minutos</option>
                <option value="75">75 Minutos</option>
                <option value="90">90 Minutos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Lugar de Entrenamiento *
              </label>
              <select
                value={profile.trainingLocation}
                onChange={(e) => handleChange('trainingLocation', e.target.value as TrainingLocation)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="gimnasio_completo">Gimnasio Comercial Completo</option>
                <option value="casa">Casa (Home Gym / Peso Corporal)</option>
                <option value="parque">Parque / Calistenia</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Material Disponible *
              </label>
              <input
                type="text"
                value={profile.availableEquipment}
                onChange={(e) => handleChange('availableEquipment', e.target.value)}
                placeholder="Ej. Barras, mancuernas, poleas, rack"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Ejercicios que le Gustan *
              </label>
              <input
                type="text"
                value={profile.exercisePreferences}
                onChange={(e) => handleChange('exercisePreferences', e.target.value)}
                placeholder="Ej. Press banca, hip thrust, jalones"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Ejercicios que NO Tolera o Descartados *
              </label>
              <input
                type="text"
                value={profile.dislikedExercises}
                onChange={(e) => handleChange('dislikedExercises', e.target.value)}
                placeholder="Ej. Saltos, peso muerto convencional"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>
        </section>

        {/* Action button */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            {viability.status === 'unviable' ? (
              <span className="text-rose-400 font-medium">
                Precaución: El semáforo indica que la meta no es segura. Se recomienda aplicar el ajuste antes de prescribir.
              </span>
            ) : (
              <span className="text-emerald-400 font-medium">
                Parámetros listos para prescripción según principios de ciencias del deporte.
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg shadow-sm transition-all ${
              isLoading
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                : viability.status === 'unviable'
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-emerald-950'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generando Plan Científico...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>{viability.status === 'unviable' ? 'Generar Plan (Con Advertencia de Meta)' : 'Generar Plan de Entrenamiento'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
