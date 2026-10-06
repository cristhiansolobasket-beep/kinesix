import { ClientProfile, ViabilityAnalysis } from '../types/training';

/**
 * Evaluates goal viability based on evidence-based sports science benchmarks:
 * - Healthy fat loss: 0.5% to 1.0% of total body weight per week.
 * - Natural muscle gain: 0.25kg to 0.5kg per month for intermediates (up to 0.8kg for beginners).
 */
export function calculateViability(profile: ClientProfile): ViabilityAnalysis {
  const { weightKg, targetWeightDeltaKg, timeframeMonths, primaryGoal, fitnessLevel, injuriesOrLimitations, contraindications } = profile;
  
  const safeTimeframe = Math.max(0.5, timeframeMonths || 1);
  const weeks = Math.max(1, safeTimeframe * 4.33);
  const absDelta = Math.abs(targetWeightDeltaKg || 0);
  const isLoss = targetWeightDeltaKg < 0 || primaryGoal === 'perdida_grasa';
  const isGain = targetWeightDeltaKg > 0 || primaryGoal === 'ganancia_muscular' || primaryGoal === 'hipertrofia';

  const weeklyDelta = absDelta / weeks;
  const monthlyDelta = absDelta / safeTimeframe;
  const currentWeight = Math.max(30, weightKg || 70);
  const weeklyPct = (weeklyDelta / currentWeight) * 100;

  const minSafeWeeklyKg = currentWeight * 0.005;
  const maxSafeWeeklyKg = currentWeight * 0.010;

  let maxSafeMonthlyGain = 0.50;
  if (fitnessLevel === 'principiante') maxSafeMonthlyGain = 0.80;
  if (fitnessLevel === 'avanzado') maxSafeMonthlyGain = 0.25;

  const hasMedical = Boolean(
    (injuriesOrLimitations && injuriesOrLimitations.trim().length > 3 && !injuriesOrLimitations.toLowerCase().includes('ningun')) ||
    (contraindications && contraindications.trim().length > 3 && !contraindications.toLowerCase().includes('ningun'))
  );

  const medicalWarning = hasMedical
    ? 'Advertencia médica: Este plan no reemplaza la valoración médica. Se recomienda autorización de su médico debido a las condiciones de salud reportadas.'
    : undefined;

  // Case 1: Fat Loss
  if (isLoss && absDelta > 0) {
    if (weeklyPct > 1.05) {
      const recommendedWeeks = Math.ceil(absDelta / maxSafeWeeklyKg);
      const recommendedMonths = Math.max(1, Math.round(recommendedWeeks / 4.33));
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
        explanation: `La meta solicitada de reducir ${absDelta}kg en ${safeTimeframe} meses representa una pérdida del ${weeklyPct.toFixed(2)}% del peso corporal por semana. Supera el rango fisiológico seguro (0.5% a 1.0% semanal, máximo ${maxSafeWeeklyKg.toFixed(2)}kg/semana para su peso).`,
        hasMedicalRisk: hasMedical,
        medicalWarning,
        recommendationProposal: {
          recommendedTimeframeMonths: recommendedMonths,
          recommendedTargetDeltaKg: -absDelta,
          adjustedProposalText: `La meta solicitada de bajar ${absDelta}kg en ${safeTimeframe} meses no es alcanzable de forma segura. Una meta realista y responsable sería extender a ${recommendedMonths} meses, o ajustar a una pérdida máxima de ${safeDeltaSameTime}kg en ${safeTimeframe} meses. ¿Deseas que ajuste el plan a estos parámetros seguros?`,
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
        explanation: `La tasa proyectada (${weeklyPct.toFixed(2)}% del peso/semana) se ubica en el límite superior seguro. Es alcanzable con estricto control de volumen y recuperación.`,
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
        explanation: `La meta de pérdida es 100% alcanzable y segura. La tasa proyectada de ${weeklyPct.toFixed(2)}% del peso corporal/semana (${weeklyDelta.toFixed(2)}kg/semana) respeta la preservación de masa muscular y balance neuroendocrino.`,
        hasMedicalRisk: hasMedical,
        medicalWarning,
      };
    }
  }

  // Case 2: Muscle Gain
  if (isGain && absDelta > 0) {
    if (monthlyDelta > (maxSafeMonthlyGain * 1.15)) {
      const recommendedMonths = Math.max(1, Math.ceil(absDelta / maxSafeMonthlyGain));
      const safeGainSameTime = Number((maxSafeMonthlyGain * safeTimeframe).toFixed(1));

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
        explanation: `La meta solicitada de ganar ${absDelta}kg de masa muscular en ${safeTimeframe} meses (${monthlyDelta.toFixed(2)}kg/mes) supera la tasa fisiológica hipertrófica natural (${maxSafeMonthlyGain}kg/mes para nivel ${fitnessLevel}).`,
        hasMedicalRisk: hasMedical,
        medicalWarning,
        recommendationProposal: {
          recommendedTimeframeMonths: recommendedMonths,
          recommendedTargetDeltaKg: absDelta,
          adjustedProposalText: `La meta solicitada de ganar ${absDelta}kg en ${safeTimeframe} meses no es alcanzable de forma magra y natural. Una meta realista y responsable sería programar ${recommendedMonths} meses, o buscar una ganancia de ${safeGainSameTime}kg en ${safeTimeframe} meses. ¿Deseas que ajuste el plan a esta progresión?`,
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

  // Case 3: Recomposición, salud o rendimiento
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
    explanation: `El objetivo de ${primaryGoal.replace('_', ' ')} en ${safeTimeframe} meses es completamente alcanzable y permite una progresión biomecánica segura sin sobreentrenamiento.`,
    hasMedicalRisk: hasMedical,
    medicalWarning,
  };
}

/**
 * 1RM Estimates based on Epley and Brzycki formulas
 */
export function estimate1RM(weightLiftedKg: number, reps: number): { epley: number; brzycki: number; average: number } {
  if (reps <= 1) {
    return { epley: weightLiftedKg, brzycki: weightLiftedKg, average: weightLiftedKg };
  }
  // Epley: weight * (1 + reps/30)
  const epley = weightLiftedKg * (1 + reps / 30);
  // Brzycki: weight * (36 / (37 - reps))
  const brzycki = weightLiftedKg * (36 / Math.max(1, 37 - reps));
  const avg = (epley + brzycki) / 2;
  return {
    epley: Math.round(epley * 10) / 10,
    brzycki: Math.round(brzycki * 10) / 10,
    average: Math.round(avg * 10) / 10,
  };
}

/**
 * Calculates training intensity percentage for a given target rep range and RIR
 */
export function getEstimatedIntensity(reps: number, rir: number): number {
  const effectiveReps = reps + rir;
  // Approximation based on standard powerlifting charts
  const percentage = Math.max(50, Math.min(100, Math.round(100 - (effectiveReps - 1) * 2.8)));
  return percentage;
}

/**
 * Formats seconds into MM:SS
 */
export function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}
