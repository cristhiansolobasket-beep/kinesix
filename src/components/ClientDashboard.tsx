import React, { useState } from 'react';
import { PlusCircle, User, ShieldAlert, CheckCircle2, AlertOctagon, ArrowRight, Eye, Dumbbell, Calendar, Search } from 'lucide-react';
import { ClientRecord } from '../types/training';

interface ClientDashboardProps {
  clients: ClientRecord[];
  onSelectClient: (client: ClientRecord) => void;
  onNewEvaluation: () => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  clients,
  onSelectClient,
  onNewEvaluation,
}) => {
  const [filter, setFilter] = useState<'all' | 'viable' | 'unviable' | 'medical'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClients = clients.filter((c) => {
    const matchesSearch = c.profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.profile.primaryGoal.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filter === 'viable') return c.viability.status === 'viable';
    if (filter === 'unviable') return c.viability.status === 'unviable';
    if (filter === 'medical') return c.viability.hasMedicalRisk;
    return true;
  });

  const viableCount = clients.filter((c) => c.viability.status === 'viable').length;
  const unviableCount = clients.filter((c) => c.viability.status === 'unviable').length;
  const medicalAlertsCount = clients.filter((c) => c.viability.hasMedicalRisk).length;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Overview Stat Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 font-medium">Total Atletas Evaluados</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
            {clients.length}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Supervisión administrativa activa</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Planes Viables y Seguros</span>
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-300 mt-1">
            {viableCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Dentro de umbrales fisiológicos</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <span className="text-xs text-rose-400 font-medium flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Metas Inviables Detectadas</span>
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-rose-400 mt-1">
            {unviableCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Requieren ajuste metodológico</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <span className="text-xs text-amber-400 font-medium flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Condiciones / Lesiones</span>
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-300 mt-1">
            {medicalAlertsCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Adaptación biomecánica activa</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por atleta u objetivo..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Interactive Segmented Controls for Filtering */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              filter === 'all'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({clients.length})
          </button>
          <button
            onClick={() => setFilter('viable')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              filter === 'viable'
                ? 'bg-emerald-950/80 text-emerald-300 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            Viables ({viableCount})
          </button>
          <button
            onClick={() => setFilter('unviable')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              filter === 'unviable'
                ? 'bg-rose-950/80 text-rose-300 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            Semáforo Rojo ({unviableCount})
          </button>
          <button
            onClick={() => setFilter('medical')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              filter === 'medical'
                ? 'bg-amber-950/80 text-amber-300 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            Con Alertas ({medicalAlertsCount})
          </button>
        </div>
      </div>

      {/* Athletes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClients.map((client) => {
          const { profile, viability, plan } = client;
          const isViable = viability.status === 'viable';
          const isUnviable = viability.status === 'unviable';

          return (
            <div
              key={client.id}
              className={`rounded-xl border p-5 bg-slate-900/50 hover:bg-slate-900/80 transition-all flex flex-col justify-between ${
                isUnviable
                  ? 'border-rose-500/30'
                  : viability.hasMedicalRisk
                  ? 'border-amber-500/30'
                  : 'border-slate-800'
              }`}
            >
              <div>
                {/* Header card with status tag */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight">
                      {profile.name}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>{profile.age} años</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{profile.weightKg} kg</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{profile.fitnessLevel}</span>
                    </div>
                  </div>

                  {/* Unboxed status indicator with clean text */}
                  <div>
                    {isViable && (
                      <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Viable</span>
                      </span>
                    )}
                    {isUnviable && (
                      <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1">
                        <AlertOctagon className="w-3.5 h-3.5" />
                        <span>Inviable</span>
                      </span>
                    )}
                    {viability.status === 'borderline' && (
                      <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                        <span>Límite</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Specific goal */}
                <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80 mb-3 text-xs">
                  <div className="text-slate-400 uppercase text-[10px] tracking-wider font-medium">
                    Objetivo: {profile.primaryGoal.replace('_', ' ')}
                  </div>
                  <div className="font-medium text-slate-200 mt-0.5 leading-snug">
                    {profile.specificGoalDescription}
                  </div>
                  <div className="text-slate-400 text-[11px] font-mono tabular-nums mt-1 flex items-center gap-2">
                    <span>Plazo: {profile.timeframeMonths} meses</span>
                    <span aria-hidden="true">·</span>
                    <span>{profile.daysPerWeek} días/sem ({profile.minutesPerSession} min)</span>
                  </div>
                </div>

                {/* Rate analysis */}
                <div className="text-xs text-slate-300 leading-snug mb-3">
                  <span className="text-slate-400">Tasa proyectada: </span>
                  <span className="font-mono tabular-nums font-semibold text-slate-200">
                    {viability.ratePerWeekKg} kg/sem ({viability.ratePercentBodyWeightPerWeek}%)
                  </span>
                  {isUnviable && (
                    <p className="text-rose-300 text-[11px] mt-1 leading-snug">
                      Supera el límite fisiológico seguro de {viability.maxSafeWeeklyKg} kg/semana.
                    </p>
                  )}
                </div>

                {/* Medical alert note if present */}
                {viability.hasMedicalRisk && (
                  <div className="p-2.5 bg-amber-950/30 border border-amber-500/20 rounded-md text-[11px] text-amber-300 flex items-start gap-1.5 mb-3">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span className="leading-tight">
                      Condición: {profile.injuriesOrLimitations}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions footer */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500">
                  {plan ? 'Plan formulado' : 'Pendiente de prescripción'}
                </span>

                <button
                  onClick={() => onSelectClient(client)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors"
                >
                  <span>{plan ? 'Ver / Editar Plan' : 'Evaluar y Crear Plan'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12 p-8 bg-slate-900/30 border border-slate-800 rounded-xl">
          <p className="text-sm text-slate-400 mb-4">No se encontraron atletas con los criterios seleccionados.</p>
          <button
            onClick={onNewEvaluation}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Crear Nueva Ficha de Atleta</span>
          </button>
        </div>
      )}
    </div>
  );
};
