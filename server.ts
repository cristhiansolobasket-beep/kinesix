import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize GoogleGenAI SDK server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface ClientProfile {
  name: string;
  age: number;
  gender: 'masculino' | 'femenino' | 'otro';
  weightKg: number;
  heightCm: number;
  bodyFatPct?: number;
  fitnessLevel: 'principiante' | 'intermedio' | 'avanzado';
  experienceYears: number;
  injuriesOrLimitations: string;
  contraindications: string;
  relevantMedication: string;
  primaryGoal: 'perdida_grasa' | 'ganancia_muscular' | 'hipertrofia' | 'recomposicion' | 'rendimiento' | 'salud';
  specificGoalDescription: string;
  targetWeightDeltaKg: number; // positive for gain, negative for loss, 0 for maintenance
  timeframeMonths: number;
  daysPerWeek: number;
  minutesPerSession: number;
  trainingLocation: 'gimnasio_completo' | 'casa' | 'parque';
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

export function evaluateViability(profile: ClientProfile): ViabilityAnalysis {
  const { weightKg, targetWeightDeltaKg, timeframeMonths, primaryGoal, fitnessLevel, injuriesOrLimitations, contraindications } = profile;
  const weeks = Math.max(1, timeframeMonths * 4.33);
  const absDelta = Math.abs(targetWeightDeltaKg);
  const isLoss = targetWeightDeltaKg < 0 || primaryGoal === 'perdida_grasa';
  const isGain = targetWeightDeltaKg > 0 || primaryGoal === 'ganancia_muscular' || primaryGoal === 'hipertrofia';

  const weeklyDelta = absDelta / weeks;
  const monthlyDelta = absDelta / Math.max(0.5, timeframeMonths);
  const weeklyPct = (weeklyDelta / Math.max(30, weightKg)) * 100;

  const minSafeWeeklyKg = (weightKg * 0.005);
  const maxSafeWeeklyKg = (weightKg * 0.010);

  // Muscle gain reference: 0.25kg to 0.5kg per month for intermediates. Up to 0.7-0.9kg for absolute beginners, 0.1-0.25kg for advanced.
  let maxSafeMonthlyGain = 0.50;
  if (fitnessLevel === 'principiante') maxSafeMonthlyGain = 0.80;
  if (fitnessLevel === 'avanzado') maxSafeMonthlyGain = 0.25;

  const hasMedical = Boolean(
    (injuriesOrLimitations && injuriesOrLimitations.trim().length > 3 && !injuriesOrLimitations.toLowerCase().includes('ningun')) ||
    (contraindications && contraindications.trim().length > 3 && !contraindications.toLowerCase().includes('ningun'))
  );

  const medicalWarning = hasMedical
    ? 'Advertencia médica: Este plan no reemplaza la valoración médica. Se recomienda autorización de su médico debido a las condiciones reportadas.'
    : undefined;

  if (isLoss) {
    if (weeklyPct > 1.05) {
      // Exceeds safe 1% limit
      const recommendedWeeks = Math.ceil(absDelta / maxSafeWeeklyKg);
      const recommendedMonths = Number((recommendedWeeks / 4.33).toFixed(1));
      const safeDeltaSameTime = Number((maxSafeWeeklyKg * weeks).toFixed(1));

      return {
        isViable: false,
        status: 'unviable',
        ratePerWeekKg: Number(weeklyDelta.toFixed(2)),
        ratePerMonthKg: Number(monthlyDelta.toFixed(2)),
        ratePercentBodyWeightPerWeek: Number(weeklyPct.toFixed(2)),
        minSafeWeeklyKg: Number(minSafeWeeklyKg.toFixed(2)),
        maxSafeWeeklyKg: Number(maxSafeWeeklyKg.toFixed(2)),
        minSafeMonthlyKg: Number((minSafeWeeklyKg * 4.33).toFixed(2)),
        maxSafeMonthlyKg: Number((maxSafeWeeklyKg * 4.33).toFixed(2)),
        explanation: `La meta solicitada de reducir ${absDelta}kg en ${timeframeMonths} meses (${weeklyPct.toFixed(2)}% del peso corporal/semana) supera el rango fisiológico seguro (0.5% - 1.0% semanal, máx. ${maxSafeWeeklyKg.toFixed(2)}kg/semana).`,
        hasMedicalRisk: hasMedical,
        medicalWarning,
        recommendationProposal: {
          recommendedTimeframeMonths: Math.max(1, Math.round(recommendedMonths)),
          recommendedTargetDeltaKg: -absDelta,
          adjustedProposalText: `Una meta realista y responsable sería extender el plazo a ${Math.max(1, Math.round(recommendedMonths))} meses para ${absDelta}kg, o reducir un máximo de ${safeDeltaSameTime}kg en los actuales ${timeframeMonths} meses.`,
        },
      };
    } else if (weeklyPct >= 0.95 && weeklyPct <= 1.05) {
      return {
        isViable: true,
        status: 'borderline',
        ratePerWeekKg: Number(weeklyDelta.toFixed(2)),
        ratePerMonthKg: Number(monthlyDelta.toFixed(2)),
        ratePercentBodyWeightPerWeek: Number(weeklyPct.toFixed(2)),
        minSafeWeeklyKg: Number(minSafeWeeklyKg.toFixed(2)),
        maxSafeWeeklyKg: Number(maxSafeWeeklyKg.toFixed(2)),
        minSafeMonthlyKg: Number((minSafeWeeklyKg * 4.33).toFixed(2)),
        maxSafeMonthlyKg: Number((maxSafeWeeklyKg * 4.33).toFixed(2)),
        explanation: `La tasa de pérdida (${weeklyPct.toFixed(2)}% del peso semanal) se encuentra en el límite superior seguro. Es viable con estricta gestión del volumen y descanso.`,
        hasMedicalRisk: hasMedical,
        medicalWarning,
      };
    } else {
      return {
        isViable: true,
        status: 'viable',
        ratePerWeekKg: Number(weeklyDelta.toFixed(2)),
        ratePerMonthKg: Number(monthlyDelta.toFixed(2)),
        ratePercentBodyWeightPerWeek: Number(weeklyPct.toFixed(2)),
        minSafeWeeklyKg: Number(minSafeWeeklyKg.toFixed(2)),
        maxSafeWeeklyKg: Number(maxSafeWeeklyKg.toFixed(2)),
        minSafeMonthlyKg: Number((minSafeWeeklyKg * 4.33).toFixed(2)),
        maxSafeMonthlyKg: Number((maxSafeWeeklyKg * 4.33).toFixed(2)),
        explanation: `La meta de pérdida es 100% alcanzable y segura. La tasa proyectada de ${weeklyPct.toFixed(2)}% del peso corporal/semana (${weeklyDelta.toFixed(2)}kg/sem) respeta la preservación de masa libre de grasa.`,
        hasMedicalRisk: hasMedical,
        medicalWarning,
      };
    }
  }

  if (isGain) {
    if (monthlyDelta > (maxSafeMonthlyGain * 1.15)) {
      const recommendedMonths = Math.ceil(absDelta / maxSafeMonthlyGain);
      const safeGainSameTime = Number((maxSafeMonthlyGain * timeframeMonths).toFixed(1));

      return {
        isViable: false,
        status: 'unviable',
        ratePerWeekKg: Number(weeklyDelta.toFixed(2)),
        ratePerMonthKg: Number(monthlyDelta.toFixed(2)),
        ratePercentBodyWeightPerWeek: Number(weeklyPct.toFixed(2)),
        minSafeWeeklyKg: Number((0.25 / 4.33).toFixed(2)),
        maxSafeWeeklyKg: Number((maxSafeMonthlyGain / 4.33).toFixed(2)),
        minSafeMonthlyKg: 0.25,
        maxSafeMonthlyKg: maxSafeMonthlyGain,
        explanation: `La meta solicitada de ganar ${absDelta}kg de masa muscular en ${timeframeMonths} meses (${monthlyDelta.toFixed(2)}kg/mes) supera la tasa fisiológica hipertrófica natural (${maxSafeMonthlyGain}kg/mes para nivel ${fitnessLevel}).`,
        hasMedicalRisk: hasMedical,
        medicalWarning,
        recommendationProposal: {
          recommendedTimeframeMonths: recommendedMonths,
          recommendedTargetDeltaKg: absDelta,
          adjustedProposalText: `Una meta realista y responsable para nivel ${fitnessLevel} sería ganar entre ${safeGainSameTime}kg en ${timeframeMonths} meses, o planificar ${recommendedMonths} meses para ${absDelta}kg de tejido muscular magro sin acumulación excesiva de grasa.`,
        },
      };
    } else {
      return {
        isViable: true,
        status: 'viable',
        ratePerWeekKg: Number(weeklyDelta.toFixed(2)),
        ratePerMonthKg: Number(monthlyDelta.toFixed(2)),
        ratePercentBodyWeightPerWeek: Number(weeklyPct.toFixed(2)),
        minSafeWeeklyKg: Number((0.25 / 4.33).toFixed(2)),
        maxSafeWeeklyKg: Number((maxSafeMonthlyGain / 4.33).toFixed(2)),
        minSafeMonthlyKg: 0.25,
        maxSafeMonthlyKg: maxSafeMonthlyGain,
        explanation: `La tasa proyectada de ganancia muscular (${monthlyDelta.toFixed(2)}kg/mes) se encuentra dentro de los estándares fisiológicos naturales para atletas de nivel ${fitnessLevel}.`,
        hasMedicalRisk: hasMedical,
        medicalWarning,
      };
    }
  }

  // Recomposición, salud o rendimiento
  return {
    isViable: true,
    status: 'viable',
    ratePerWeekKg: Number(weeklyDelta.toFixed(2)),
    ratePerMonthKg: Number(monthlyDelta.toFixed(2)),
    ratePercentBodyWeightPerWeek: Number(weeklyPct.toFixed(2)),
    minSafeWeeklyKg: 0,
    maxSafeWeeklyKg: Number(maxSafeWeeklyKg.toFixed(2)),
    minSafeMonthlyKg: 0,
    maxSafeMonthlyKg: maxSafeMonthlyGain,
    explanation: `El objetivo de ${primaryGoal} con duración de ${timeframeMonths} meses es fisiológicamente viable y permite una adaptación biomecánica óptima.`,
    hasMedicalRisk: hasMedical,
    medicalWarning,
  };
}

// API: Validate Viability
app.post('/api/plans/validate', (req: Request, res: Response) => {
  try {
    const profile = req.body as ClientProfile;
    if (!profile.name || !profile.weightKg || !profile.heightCm || !profile.timeframeMonths) {
      return res.status(400).json({ error: 'Faltan datos obligatorios para calcular la viabilidad.' });
    }
    const result = evaluateViability(profile);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Error en validación de viabilidad' });
  }
});

// Scientific Fallback Plan Generator
function generateScientificDeterministicPlan(profile: ClientProfile, viability: ViabilityAnalysis) {
  const { name, weightKg, heightCm, fitnessLevel, primaryGoal, daysPerWeek, minutesPerSession, trainingLocation, timeframeMonths, injuriesOrLimitations } = profile;

  // Split selection based on days
  let routineDays: any[] = [];
  const hasKneeInjury = injuriesOrLimitations?.toLowerCase().includes('rodilla');
  const hasBackInjury = injuriesOrLimitations?.toLowerCase().includes('lumbar') || injuriesOrLimitations?.toLowerCase().includes('espalda');
  const hasShoulderInjury = injuriesOrLimitations?.toLowerCase().includes('hombro');

  if (daysPerWeek === 3) {
    routineDays = [
      {
        dayNumber: 1,
        dayName: 'Día 1: Torso (Empujes y Tracciones)',
        muscleGroup: 'Pectoral, Espalda, Hombro anterior/lateral, Core',
        exercises: [
          {
            name: hasShoulderInjury ? 'Press banca con mancuernas agarre neutro' : 'Press banca plano con barra',
            setsReps: '4 x 6-8',
            rirRange: 'RIR 2',
            restSeconds: 150,
            technicalNote: 'Retracción escapular activa, pausa de 1 segundo en el punto de máxima contracción esternal.',
          },
          {
            name: 'Remo con barra apoyado en banco inclinado (Seal Row)',
            setsReps: '4 x 8-10',
            rirRange: 'RIR 2',
            restSeconds: 120,
            technicalNote: hasBackInjury ? 'Pecho firmemente apoyado para descargar tensión sobre la zona lumbar.' : 'Tronco neutro, codos a 45 grados del torso.',
          },
          {
            name: 'Press militar con mancuernas sentado',
            setsReps: '3 x 10-12',
            rirRange: 'RIR 1-2',
            restSeconds: 90,
            technicalNote: 'Respiración diafragmática, evitar hiperextensión del raquis lumbar.',
          },
          {
            name: 'Jalón al pecho agarre prono abierto',
            setsReps: '3 x 10-12',
            rirRange: 'RIR 1-2',
            restSeconds: 90,
            technicalNote: 'Depresión escapular previa a la flexión del codo. No balancear el tronco.',
          },
          {
            name: 'Elevaciones laterales en polea media',
            setsReps: '3 x 12-15',
            rirRange: 'RIR 1',
            restSeconds: 60,
            technicalNote: 'Plano escapular a 30 grados, trayectoria parabólica suave.',
          },
          {
            name: 'Pallof press en polea isométrica',
            setsReps: '3 x 30s por lado',
            rirRange: 'RIR 2',
            restSeconds: 60,
            technicalNote: 'Mantener pelvis y hombros alineados resistiendo el par de torsión.',
          },
        ],
      },
      {
        dayNumber: 2,
        dayName: 'Día 2: Pierna y Cadena Posterior',
        muscleGroup: 'Cuádriceps, Isquiosurales, Glúteo, Gemelo',
        exercises: [
          {
            name: hasKneeInjury ? 'Prensa de piernas 45° con rango controlado' : (hasBackInjury ? 'Sentadilla Goblet con talones elevados' : 'Sentadilla trasera con barra baja'),
            setsReps: '4 x 8-10',
            rirRange: 'RIR 2',
            restSeconds: 150,
            technicalNote: hasKneeInjury ? 'Pies en parte superior de plataforma para reclutar mayor cadena posterior y reducir cizallamiento rotuliano.' : 'Rodillas en línea con el segundo dedo del pie, profundidad a paralelo.',
          },
          {
            name: hasBackInjury ? 'Hip Thrust con barra y pad acolchado' : 'Peso muerto rumano con mancuernas',
            setsReps: '4 x 8-10',
            rirRange: 'RIR 2',
            restSeconds: 120,
            technicalNote: 'Bisagra de cadera pura. Espalda neutra, retracción escapular constante.',
          },
          {
            name: 'Curl femoral tumbado en máquina',
            setsReps: '3 x 10-12',
            rirRange: 'RIR 1-2',
            restSeconds: 90,
            technicalNote: 'Fase excéntrica controlada en 3 segundos. No elevar la pelvis de la almohadilla.',
          },
          {
            name: hasKneeInjury ? 'Extensiones de cuádriceps en máquina (ángulo 90°-45°)' : 'Zancadas estáticas caminando con mancuernas',
            setsReps: '3 x 12 por pierna',
            rirRange: 'RIR 2',
            restSeconds: 90,
            technicalNote: 'Torso ligeramente inclinado al frente para optimizar brazo de momento de glúteo.',
          },
          {
            name: 'Elevación de talones de pie en máquina Smith',
            setsReps: '4 x 12-15',
            rirRange: 'RIR 1',
            restSeconds: 60,
            technicalNote: 'Pausa de 2 segundos en máxima dorsiflexión para anular reflejo miotático.',
          },
        ],
      },
      {
        dayNumber: 3,
        dayName: 'Día 3: Full Body y Enfoque Postural',
        muscleGroup: 'Complejo articular general, Core, Brazos',
        exercises: [
          {
            name: 'Fondos en paralelas asistidos o máquina de fondos',
            setsReps: '3 x 8-10',
            rirRange: 'RIR 2',
            restSeconds: 90,
            technicalNote: 'Torso inclinado 20 grados, codos en ángulo de 90 grados al descender.',
          },
          {
            name: 'Remo unilateral con mancuerna en banco',
            setsReps: '3 x 10-12 por lado',
            rirRange: 'RIR 2',
            restSeconds: 75,
            technicalNote: 'Traccionar hacia la cresta ilíaca evitando rotación excesiva del tronco.',
          },
          {
            name: 'Prensa inclinada o sentadilla búlgara con mancuerna',
            setsReps: '3 x 10 por pierna',
            rirRange: 'RIR 2',
            restSeconds: 90,
            technicalNote: 'Descenso en 3 segundos manteniendo rodilla anterior estable.',
          },
          {
            name: 'Face pull en polea alta con cuerda doble',
            setsReps: '4 x 15',
            rirRange: 'RIR 1-2',
            restSeconds: 60,
            technicalNote: 'Rotación externa glenohumeral al final de la tracción hacia la frente.',
          },
          {
            name: 'Curl bíceps inclinado con mancuernas superserie Extensión tríceps cuerda',
            setsReps: '3 x 12 cada uno',
            rirRange: 'RIR 1',
            restSeconds: 60,
            technicalNote: 'Tensión mecánica continua en estiramiento del bíceps.',
          },
          {
            name: 'Dead bug con fitball / Plancha frontal isométrica',
            setsReps: '3 x 45 segundos',
            rirRange: 'RIR 2',
            restSeconds: 45,
            technicalNote: 'Presión constante del raquis lumbar contra el suelo sin perder tensión.',
          },
        ],
      },
    ];
  } else {
    // 4 Days: Upper / Lower / Upper / Lower
    routineDays = [
      {
        dayNumber: 1,
        dayName: 'Día 1: Torso Pesado (Fuerza Mecánica)',
        muscleGroup: 'Pectoral, Dorsal, Deltoides, Brazos',
        exercises: [
          {
            name: hasShoulderInjury ? 'Press con mancuernas en banco plano agarre semiprono' : 'Press banca plano con barra',
            setsReps: '4 x 6-8',
            rirRange: 'RIR 2',
            restSeconds: 150,
            technicalNote: 'Arco fisiológico seguro, retracción escapular fija y leg drive continuo.',
          },
          {
            name: hasBackInjury ? 'Remo en máquina con apoyo esternal' : 'Remo con barra Pendlay',
            setsReps: '4 x 6-8',
            rirRange: 'RIR 2',
            restSeconds: 120,
            technicalNote: 'Codos próximos a la caja torácica, pausa isométrica de 1s en contracción.',
          },
          {
            name: 'Press inclinado con mancuernas 30°',
            setsReps: '3 x 8-10',
            rirRange: 'RIR 2',
            restSeconds: 90,
            technicalNote: 'Evitar rebote en fase inferior, control excéntrico de 2 segundos.',
          },
          {
            name: 'Jalón en polea alta al esternón con agarre neutro',
            setsReps: '3 x 10-12',
            rirRange: 'RIR 1-2',
            restSeconds: 90,
            technicalNote: 'Tracción inicial por depresión de las escápulas.',
          },
          {
            name: 'Elevaciones laterales en polea baja',
            setsReps: '4 x 12-15',
            rirRange: 'RIR 1',
            restSeconds: 60,
            technicalNote: 'Codo ligeramente flexionado, plano escapular anterior.',
          },
        ],
      },
      {
        dayNumber: 2,
        dayName: 'Día 2: Pierna Cuádriceps y Cadena Posterior',
        muscleGroup: 'Cuádriceps, Glúteo, Isquiosurales, Pantorrilla',
        exercises: [
          {
            name: hasKneeInjury ? 'Prensa 45° pies medios' : 'Sentadilla trasera libre o sentadilla frontal',
            setsReps: '4 x 8-10',
            rirRange: 'RIR 2',
            restSeconds: 150,
            technicalNote: 'Presión uniforme en trípode plantar (talón, base primer y quinto metatarsiano).',
          },
          {
            name: hasBackInjury ? 'Hip Thrust en banco con barra acolchada' : 'Peso muerto rumano con mancuernas',
            setsReps: '4 x 8-10',
            rirRange: 'RIR 2',
            restSeconds: 120,
            technicalNote: 'Desplazamiento anteroposterior estricto de cadera sin flexión del raquis lumbar.',
          },
          {
            name: 'Prensa horizontal unilateral o zancadas estáticas',
            setsReps: '3 x 10 por pierna',
            rirRange: 'RIR 2',
            restSeconds: 90,
            technicalNote: 'Rango profundo sin retroversión pélvica.',
          },
          {
            name: 'Curl femoral sentado en máquina',
            setsReps: '4 x 10-12',
            rirRange: 'RIR 1-2',
            restSeconds: 75,
            technicalNote: 'Torso flexionado ligeramente hacia adelante para estirar el bíceps femoral.',
          },
          {
            name: 'Elevación de gemelos en máquina costurera',
            setsReps: '4 x 12-15',
            rirRange: 'RIR 1',
            restSeconds: 60,
            technicalNote: 'Énfasis en el sóleo con rodillas a 90°. Pausa abajo de 2 segundos.',
          },
        ],
      },
      {
        dayNumber: 3,
        dayName: 'Día 3: Torso Hipertrofia y Volumen Metabólico',
        muscleGroup: 'Dorsal ancho, Pectoral clavicular, Deltoides, Brazos',
        exercises: [
          {
            name: 'Press superior con mancuernas en banco inclinado 45°',
            setsReps: '4 x 8-10',
            rirRange: 'RIR 2',
            restSeconds: 120,
            technicalNote: 'Fase excéntrica en 3 segundos, apertura de codos a 60 grados.',
          },
          {
            name: 'Remo Gironda sentado en polea baja con agarre V',
            setsReps: '4 x 10-12',
            rirRange: 'RIR 2',
            restSeconds: 90,
            technicalNote: 'Mantener espalda erguida, sin hiperextensión lumbar al tirar.',
          },
          {
            name: 'Cruces en poleas a la altura del esternón',
            setsReps: '3 x 12-15',
            rirRange: 'RIR 1',
            restSeconds: 60,
            technicalNote: 'Mantener ángulo constante de flexión en el codo durante todo el recorrido.',
          },
          {
            name: 'Face Pull con cuerda en polea alta',
            setsReps: '4 x 15',
            rirRange: 'RIR 1-2',
            restSeconds: 60,
            technicalNote: 'Enfoque en deltoides posterior y rotadores externos.',
          },
          {
            name: 'Curl de bíceps con barra Z en banco Scott',
            setsReps: '3 x 10-12',
            rirRange: 'RIR 1',
            restSeconds: 60,
            technicalNote: 'Aislar por completo flexión del codo sin impulso del deltoides anterior.',
          },
          {
            name: 'Press francés con mancuernas en banco plano',
            setsReps: '3 x 10-12',
            rirRange: 'RIR 1',
            restSeconds: 60,
            technicalNote: 'Hombros fijados perpendicularmente, descenso hacia las sienes.',
          },
        ],
      },
      {
        dayNumber: 4,
        dayName: 'Día 4: Pierna Cadena Posterior y Estabilidad',
        muscleGroup: 'Glúteo, Isquios, Aductores, Abdomen',
        exercises: [
          {
            name: hasBackInjury ? 'Prensa 45° con pies altos y anchos' : 'Peso muerto rumano con barra',
            setsReps: '4 x 8-10',
            rirRange: 'RIR 2',
            restSeconds: 150,
            technicalNote: 'Barra pegada a las tibias. Detener cuando la cadera no se desplace más hacia atrás.',
          },
          {
            name: 'Sentadilla búlgara con mancuerna en mano contralateral',
            setsReps: '3 x 10 por pierna',
            rirRange: 'RIR 2',
            restSeconds: 90,
            technicalNote: 'Pie trasero solo de apoyo. Empujar verticalmente desde el mediopié delantero.',
          },
          {
            name: 'Extensiones de cuádriceps en máquina',
            setsReps: '3 x 12-15',
            rirRange: 'RIR 1-2',
            restSeconds: 75,
            technicalNote: 'Contracción isométrica de 1 segundo en bloqueo articular superior.',
          },
          {
            name: 'Curl femoral acostado con flexión dorsal del tobillo',
            setsReps: '3 x 10-12',
            rirRange: 'RIR 1',
            restSeconds: 60,
            technicalNote: 'Evitar compensar con inclinación del tronco.',
          },
          {
            name: 'Rueda abdominal (Ab Wheel) o Plancha en pelota suiza',
            setsReps: '4 x 10-12 controladas',
            rirRange: 'RIR 2',
            restSeconds: 60,
            technicalNote: 'Retroversion pélvica activa, no colapsar la curvatura lumbar en extensión.',
          },
        ],
      },
    ];
  }

  // Monthly phases planning
  const phases = [];
  const totalMonths = Math.max(1, timeframeMonths);
  if (totalMonths <= 2) {
    phases.push({
      phaseNumber: 1,
      name: 'Fase 1: Adaptación Anatómica y Eficiencia Mecánica',
      durationWeeks: 4,
      objective: 'Acondicionamiento del tejido conjuntivo, consolidación de patrones motores y fijación de RIR 2-3.',
      progressionNotes: 'Incremento semanal de carga no superior al 5-7%. Foco en calidad técnica y tempo excéntrico 3-0-1-0.',
    });
    phases.push({
      phaseNumber: 2,
      name: 'Fase 2: Intensificación Específica',
      durationWeeks: Math.max(2, (totalMonths * 4) - 4),
      objective: 'Incremento del estrés metabólico y tensión mecánica efectiva con reducción a RIR 1-2.',
      progressionNotes: 'Incluye semana de descarga en microciclo 4 (reducción de volumen en 40%, manteniendo intensidad).',
    });
  } else {
    phases.push({
      phaseNumber: 1,
      name: 'Mes 1: Adaptación Anatómica y Reclutamiento Neuromuscular',
      durationWeeks: 4,
      objective: 'Optimización de la estabilidad articular, tolerancia ligamentosa y técnica estricta con RIR 2-3.',
      progressionNotes: 'Base de volumen moderado (10-12 series semanales por grupo muscular).',
    });
    phases.push({
      phaseNumber: 2,
      name: `Meses 2-${Math.max(2, totalMonths - 1)}: Hipertrofia y Tensión Mecánica Progresiva`,
      durationWeeks: (totalMonths - 2) * 4,
      objective: 'Sobrecarga progresiva escalonada por microciclos. Semana de descarga programada cada 5 semanas.',
      progressionNotes: 'Aumento progresivo de carga del 2.5% al 5% por microciclo cuando RIR supere 3 en la última serie.',
    });
    phases.push({
      phaseNumber: 3,
      name: `Mes ${totalMonths}: Consolidación y Definición de Logro`,
      durationWeeks: 4,
      objective: 'Máxima densidad de entrenamiento, mantenimiento de masa magra y transferencia al objetivo principal.',
      progressionNotes: 'Ajuste de densidad con reducción progresiva de descansos entre series accesorias a 60 segundos.',
    });
  }

  return {
    clientName: name,
    analysisViability: viability.explanation,
    summary: {
      primaryGoal: primaryGoal,
      totalDurationMonths: timeframeMonths,
      weeklyFrequencyDays: daysPerWeek,
      sessionMinutes: minutesPerSession,
      location: trainingLocation,
      mainFocus: `Desarrollo de ${primaryGoal} mediante sobrecarga progresiva y control de fatiga por RIR para atleta de nivel ${fitnessLevel}.`,
    },
    medicalWarning: viability.medicalWarning,
    phases,
    weeklyRoutine: routineDays,
    keyPrinciples: [
      {
        title: 'Sobrecarga Progresiva Controlada',
        description: 'Nunca aumentes más del 10% de carga o volumen por semana. La progresión principal debe basarse en la calidad técnica y la cercanía al fallo técnico (RIR 1-3).',
      },
      {
        title: 'Técnica Estricta y Control Excéntrico',
        description: 'Mantener cadencia de ejecución controlada (2-3 segundos en la fase excéntrica y 1 segundo concéntrico explosivo pero controlado). Cada repetición debe verse idéntica a la primera.',
      },
      {
        title: 'Gestión de Fatiga y Descanso',
        description: 'Respetar los tiempos de descanso estipulados entre series para permitir la recuperación fosfágena. Incluir semana de descarga reduciendo el volumen 40% cada 4 a 6 microciclos.',
      },
    ],
    evaluationCriteria: {
      rirRule: 'Si el cliente completa todas las series de un ejercicio con RIR superior a 3 (más de 3 repeticiones en reserva), incrementar la carga en 2.5kg a 5kg en el siguiente microciclo.',
      deloadRule: 'Si durante 2 microciclos consecutivos el RIR cae a 0 antes de la última serie o reporta fatiga acumulada matutina, aplicar semana de descarga inmediata reduciendo series a la mitad.',
      volumeAdjustment: 'Monitorear la recuperación muscular: si no hay recuperación completa a las 48-72 horas, disminuir 2 series semanales del grupo muscular afectado.',
    },
    generalHabits: {
      proteinRecommendation: 'Ingesta proteica orientativa de 1.6 a 2.2 gramos por kilogramo de peso corporal distribuida en 3-5 tomas diarias, basada en alimentos enteros de alto valor biológico.',
      hydrationRecommendation: 'Consumo hídrico base de 35 a 45 ml por kilogramo de peso corporal al día, adicionando 500-800 ml durante la sesión de entrenamiento.',
      sleepRecommendation: 'Dormir entre 7 y 8 horas ininterrumpidas por noche en habitación oscura y fresca para favorecer el entorno hormonal de recuperación y síntesis proteica.',
      disclaimer: 'Este plan de entrenamiento deportivo no incluye ni autoriza prescripciones dietéticas cerradas, suplementos ni fármacos. Ante cualquier molestia, detener el ejercicio de inmediato y consultar a un profesional de la salud.',
    },
  };
}

// API: Generate Plan
app.post('/api/plans/generate', async (req: Request, res: Response) => {
  try {
    const profile = req.body as ClientProfile;

    // Strict validation of required fields
    const missingFields: string[] = [];
    if (!profile.name?.trim()) missingFields.push('Nombre del cliente');
    if (!profile.age) missingFields.push('Edad');
    if (!profile.weightKg) missingFields.push('Peso (kg)');
    if (!profile.heightCm) missingFields.push('Estatura (cm)');
    if (!profile.fitnessLevel) missingFields.push('Nivel físico actual');
    if (!profile.primaryGoal) missingFields.push('Objetivo principal');
    if (!profile.timeframeMonths) missingFields.push('Temporalidad (meses)');
    if (!profile.daysPerWeek) missingFields.push('Días por semana');
    if (!profile.minutesPerSession) missingFields.push('Minutos por sesión');
    if (!profile.trainingLocation) missingFields.push('Lugar de entrenamiento');

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Faltan datos obligatorios requeridos para generar el plan: ${missingFields.join(', ')}. Por favor completa la ficha física antes de continuar.`,
        missingFields,
      });
    }

    // Viability check
    const viability = evaluateViability(profile);

    // If API key is available, call Gemini 3.8 Flash with structured schema
    if (process.env.GEMINI_API_KEY) {
      try {
        const systemPrompt = `Eres un sistema experto en planificación de entrenamiento deportivo y preparador físico de alto rendimiento.
Tu única función es crear planes de entrenamiento personalizados, seguros, progresivos y 100% alcanzables bajo la supervisión de un usuario administrativo (entrenador).

REGLAS DE ORO:
1. Seguridad primero: Si el cliente reporta lesión, molestia, enfermedad cardiovascular, hipertensión, diabetes o limitación, incluye la advertencia obligatoria y adapta estrictamente la selección biomecánica de ejercicios. NUNCA prescribas suplementos, fármacos o dietas cerradas.
2. Progresión limpia: Sobrecarga progresiva. Nunca aumentes más de 10% de volumen o carga por semana. Incluye semanas de descarga cada 4-6 semanas si supera 2 meses.
3. RIR y Descanso: Cada ejercicio debe tener rango de repeticiones, RIR estricto (1-3), descanso en segundos y nota técnica biomecánica.
4. TONO: Profesional, limpio, directo, motivador pero sin exageraciones. SIN EMOJIS. Lenguaje de entrenador experimentado, no de influencer. Basado en ciencia del entrenamiento.
5. NO inventar datos. Seguir la ficha provista al detalle.`;

        const userPrompt = `Genera un plan de entrenamiento completo y detallado para este perfil de cliente evaluado por el entrenador:
${JSON.stringify({ profile, viability }, null, 2)}

Devuelve el JSON estructurado respetando exactamente las secciones:
A) Análisis de Viabilidad (2 líneas evaluando si es alcanzable y por qué).
B) Resumen del Plan (Objetivo, duración total, frecuencia semanal, enfoque principal).
C) Planificación por Meses (Fases progresivas con semanas de descarga).
D) Rutina Semanal Detallada (Tabla por cada día de entrenamiento con columnas: Ejercicio, Series x Reps, Rango RIR 1-3, Descanso en segundos, Nota técnica de ejecución).
E) Principios Clave (3 recomendaciones sobre progresión, técnica y descanso).
F) Criterios de Evaluación (cuándo y cómo el administrador debe ajustar la carga).
G) Hábitos Generales (pauta proteica orientativa g/kg sin calorías exactas, hidratación, 7-8h de sueño).
Advertencia médica destacada si hay dolor o lesión.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                clientName: { type: Type.STRING },
                analysisViability: { type: Type.STRING },
                summary: {
                  type: Type.OBJECT,
                  properties: {
                    primaryGoal: { type: Type.STRING },
                    totalDurationMonths: { type: Type.NUMBER },
                    weeklyFrequencyDays: { type: Type.NUMBER },
                    sessionMinutes: { type: Type.NUMBER },
                    location: { type: Type.STRING },
                    mainFocus: { type: Type.STRING },
                  },
                  required: ['primaryGoal', 'totalDurationMonths', 'weeklyFrequencyDays', 'sessionMinutes', 'location', 'mainFocus'],
                },
                medicalWarning: { type: Type.STRING },
                phases: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      phaseNumber: { type: Type.NUMBER },
                      name: { type: Type.STRING },
                      durationWeeks: { type: Type.NUMBER },
                      objective: { type: Type.STRING },
                      progressionNotes: { type: Type.STRING },
                    },
                    required: ['phaseNumber', 'name', 'durationWeeks', 'objective', 'progressionNotes'],
                  },
                },
                weeklyRoutine: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      dayNumber: { type: Type.NUMBER },
                      dayName: { type: Type.STRING },
                      muscleGroup: { type: Type.STRING },
                      exercises: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            setsReps: { type: Type.STRING },
                            rirRange: { type: Type.STRING },
                            restSeconds: { type: Type.NUMBER },
                            technicalNote: { type: Type.STRING },
                          },
                          required: ['name', 'setsReps', 'rirRange', 'restSeconds', 'technicalNote'],
                        },
                      },
                    },
                    required: ['dayNumber', 'dayName', 'muscleGroup', 'exercises'],
                  },
                },
                keyPrinciples: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                    },
                    required: ['title', 'description'],
                  },
                },
                evaluationCriteria: {
                  type: Type.OBJECT,
                  properties: {
                    rirRule: { type: Type.STRING },
                    deloadRule: { type: Type.STRING },
                    volumeAdjustment: { type: Type.STRING },
                  },
                  required: ['rirRule', 'deloadRule', 'volumeAdjustment'],
                },
                generalHabits: {
                  type: Type.OBJECT,
                  properties: {
                    proteinRecommendation: { type: Type.STRING },
                    hydrationRecommendation: { type: Type.STRING },
                    sleepRecommendation: { type: Type.STRING },
                    disclaimer: { type: Type.STRING },
                  },
                  required: ['proteinRecommendation', 'hydrationRecommendation', 'sleepRecommendation', 'disclaimer'],
                },
              },
              required: ['clientName', 'analysisViability', 'summary', 'phases', 'weeklyRoutine', 'keyPrinciples', 'evaluationCriteria', 'generalHabits'],
            },
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          return res.json({
            plan: parsed,
            viability,
            generatedBy: 'gemini-3.8-flash',
          });
        }
      } catch (geminiError: any) {
        console.warn('Gemini generation fallback to deterministic engine:', geminiError?.message);
      }
    }

    // Deterministic fallback with high physiological rigor
    const fallbackPlan = generateScientificDeterministicPlan(profile, viability);
    return res.json({
      plan: fallbackPlan,
      viability,
      generatedBy: 'scientific-rules-engine',
    });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Error al generar el plan de entrenamiento.' });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kinesix Expert Training System running on port ${PORT}`);
  });
}

startServer();
