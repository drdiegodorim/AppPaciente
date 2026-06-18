import React, { useState } from 'react';
import { 
  Calendar, 
  Search, 
  User, 
  CheckCircle2, 
  LogOut, 
  TrendingUp, 
  Clock, 
  ClipboardList, 
  Sparkles,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { Patient, TreatmentPlan } from '../types';

interface SecretaryDashboardProps {
  patients: Patient[];
  onLogout: () => void;
  onSyncData?: () => Promise<void>;
  supabaseStatus?: any;
}

export default function SecretaryDashboard({ 
  patients, 
  onLogout, 
  onSyncData, 
  supabaseStatus 
}: SecretaryDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    patients.length > 0 ? patients[0].id : null
  );
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncClick = async () => {
    if (!onSyncData || isSyncing) return;
    setIsSyncing(true);
    try {
      await onSyncData();
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  // Filter patients
  const filteredPatients = patients.filter((pat) => {
    const fullName = `${pat.firstName || ''} ${pat.lastName || ''}`.toLowerCase();
    const diag = (pat.diagnostic || '').toLowerCase();
    const user = (pat.username || '').toLowerCase();
    const search = searchTerm.toLowerCase();

    return fullName.includes(search) || diag.includes(search) || user.includes(search);
  });

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || (patients.length > 0 ? patients[0] : null);

  // Stats across all patients for secretary overview
  const totalPatients = patients.length;
  const totalConsultasRealized = patients.reduce((acc, p) => {
    const atts = p.treatmentPlan?.attendances || [];
    return acc + atts.filter(a => a.type === 'consulta').length;
  }, 0);
  const totalBotoxRealized = patients.reduce((acc, p) => {
    const atts = p.treatmentPlan?.attendances || [];
    return acc + atts.filter(a => a.type === 'botox').length;
  }, 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm leading-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center rounded-xl bg-teal-50 p-2.5 text-teal-600 ring-4 ring-teal-50/30">
              <ClipboardList className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-lg font-extrabold text-slate-800 tracking-tight">
                Painel da Secretaria
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-1">
                Acompanhamento e Cronogramas de Procedimentos • Instituto Diego Dorim
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {onSyncData && (
              <button
                type="button"
                onClick={handleSyncClick}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 disabled:opacity-50 rounded-xl transition cursor-pointer"
              >
                Sync {isSyncing && "..."}
              </button>
            )}
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 px-3.5 py-2 rounded-xl text-xs font-bold font-sans transition cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <User className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total de Pacientes</span>
            <h4 className="text-xl font-black text-slate-800 tracking-tight leading-normal">{totalPatients}</h4>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Consultas Efetuadas</span>
            <h4 className="text-xl font-black text-slate-800 tracking-tight leading-normal">{totalConsultasRealized}</h4>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Aplicações de Botox</span>
            <h4 className="text-xl font-black text-slate-800 tracking-tight leading-normal">{totalBotoxRealized}</h4>
          </div>
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Patient Selector List */}
        <div className="lg:col-span-5 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[400px] lg:h-[650px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              📂 Lista de Pacientes ({filteredPatients.length})
            </h3>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar paciente por nome ou diagnóstico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs py-2.5 pl-9 pr-4 rounded-xl border border-slate-200 outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 placeholder-slate-400 bg-white"
              />
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredPatients.length === 0 ? (
              <div className="p-8 text-center text-slate-400 italic text-xs leading-relaxed">
                Nenhum paciente localizado com o critério de busca.
              </div>
            ) : (
              filteredPatients.map((pat) => {
                const isSelected = selectedPatient?.id === pat.id;
                
                // Progress
                const hasBotox = (pat.diagnostic || '').toLowerCase().includes('espasticidade') ||
                                 (pat.diagnostic || '').toLowerCase().includes('distonia') ||
                                 (pat.diagnostic || '').toLowerCase().includes('enxaqueca') ||
                                 (pat.diagnostic || '').toLowerCase().includes('sialorreia');
                        
                const gConsultas = pat.treatmentPlan?.goals?.consultas ?? 5;
                const rConsultas = (pat.treatmentPlan?.attendances || []).filter(a => a.type === 'consulta').length;
                
                const gBotox = hasBotox ? (pat.treatmentPlan?.goals?.botox ?? 3) : 0;
                const rBotox = hasBotox ? (pat.treatmentPlan?.attendances || []).filter(a => a.type === 'botox').length : 0;

                return (
                  <button
                    key={pat.id}
                    onClick={() => setSelectedPatientId(pat.id)}
                    className={`w-full text-left p-4 transition-all flex items-start justify-between gap-3 cursor-pointer ${
                      isSelected 
                        ? 'bg-teal-50/70 hover:bg-teal-50 border-r-4 border-teal-600' 
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-slate-800">
                        {pat.firstName} {pat.lastName}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                        {pat.diagnostic}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1 font-semibold text-slate-605">
                          Consultas: <strong className="font-mono text-teal-700">{rConsultas}/{gConsultas}</strong>
                        </span>
                        {hasBotox && (
                          <span className="flex items-center gap-1 font-semibold text-slate-605">
                            Botox: <strong className="font-mono text-purple-700">{rBotox}/{gBotox}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className={`h-4 w-4 text-slate-400 mt-1 shrink-0 ${isSelected ? "text-teal-650" : ""}`} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Treatment Plan View (READ-ONLY) */}
        <div className="lg:col-span-7">
          {selectedPatient ? (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
              
              {/* Patient header */}
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <span className="text-[9px] uppercase font-extrabold tracking-widest bg-teal-50 text-teal-750 px-2.5 py-1 rounded-md">
                    Histórico de Presenças Coletadas
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-800 tracking-tight mt-1.5">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Diagnóstico Clínico: <strong className="text-slate-600 font-semibold">{selectedPatient.diagnostic}</strong>
                  </p>
                </div>
                
                <div className="shrink-0 bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Código do Paciente</span>
                  <strong className="text-xs font-mono text-slate-700 font-bold">{selectedPatient.username}</strong>
                </div>
              </div>

              {/* Treatment Plan Progress details */}
              {(() => {
                const diagLower = (selectedPatient.diagnostic || '').toLowerCase();
                const hasBotoxOption = 
                  diagLower.includes('espasticidade') ||
                  diagLower.includes('distonia') ||
                  diagLower.includes('enxaqueca') ||
                  diagLower.includes('sialorreia');

                const goals = selectedPatient.treatmentPlan?.goals;
                const attendances = selectedPatient.treatmentPlan?.attendances || [];

                const goalConsultas = goals?.consultas ?? 5;
                const goalBotox = hasBotoxOption ? (goals?.botox ?? 3) : 0;

                const realizedConsultas = attendances.filter(a => a.type === 'consulta').length;
                const realizedBotox = hasBotoxOption ? attendances.filter(a => a.type === 'botox').length : 0;

                const pctConsultas = goalConsultas > 0 ? Math.round((realizedConsultas / goalConsultas) * 100) : 0;
                const pctBotox = goalBotox > 0 ? Math.round((realizedBotox / goalBotox) * 100) : 0;

                return (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-bold text-slate-800 flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500 mb-4">
                        <TrendingUp className="h-4 w-4 text-teal-600" />
                        Acompanhamento Presencial Estimado
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Consultation card */}
                        <div className="rounded-xl border border-slate-150 p-4 bg-slate-50/50 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs text-slate-700">Consultas Clínicas / Retornos</span>
                            <span className="font-mono font-bold text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                              {realizedConsultas} de {goalConsultas} ({pctConsultas}%)
                            </span>
                          </div>
                          
                          <div className="w-full bg-slate-200/50 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className="bg-teal-600 h-2.5 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(pctConsultas, 100)}%` }}
                            />
                          </div>
                          
                          <p className="text-[10px] text-slate-400 leading-normal">
                            Consultas e triagens médicas efetuadas no consultório.
                          </p>
                        </div>

                        {/* Botox card if applicable */}
                        {hasBotoxOption ? (
                          <div className="rounded-xl border border-slate-150 p-4 bg-slate-50/50 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-xs text-slate-700">Aplicações de Botox</span>
                              <span className="font-mono font-bold text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                                {realizedBotox} de {goalBotox} ({pctBotox}%)
                              </span>
                            </div>
                            
                            <div className="w-full bg-slate-200/50 rounded-full h-2.5 overflow-hidden">
                              <div 
                                className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(pctBotox, 100)}%` }}
                              />
                            </div>
                            
                            <p className="text-[10px] text-slate-400 leading-normal">
                              Sessões terapêuticas de infiltração de toxina botulínica.
                            </p>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-200 p-4 flex flex-col justify-center items-center text-center text-slate-400 italic">
                            <span className="text-xl">ℹ️</span>
                            <span className="text-[10px] leading-relaxed mt-1">
                              O diagnóstico deste paciente não requer aplicação de Toxina Botulínica.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-slate-450" />
                        Histórico de Comparecimentos Coletados
                      </h4>

                      {attendances.length === 0 ? (
                        <div className="text-xs text-slate-450 py-8 text-center italic bg-slate-50 rounded-xl border border-slate-150">
                          Nenhum comparecimento presencial registrado ainda para este ciclo.
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                          {[...attendances].reverse().map((att) => (
                            <div 
                              key={att.id} 
                              className="flex items-start justify-between bg-white hover:bg-slate-50/50 p-3.5 rounded-xl border border-slate-150 transition-colors gap-4"
                            >
                              <div className="space-y-1">
                                <span className="text-[11px] font-mono text-slate-700 font-bold block">
                                  {new Date(att.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                  })}
                                </span>
                                {att.notes ? (
                                  <p className="text-xs text-slate-500 leading-normal bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1 max-w-lg">
                                    {att.notes}
                                  </p>
                                ) : (
                                  <p className="text-[10px] text-slate-400 italic">
                                    Nenhuma observação informada.
                                  </p>
                                )}
                              </div>

                              <div className="shrink-0">
                                {att.type === 'botox' ? (
                                  <span className="inline-flex items-center rounded-xl bg-purple-55 bg-opacity-10 text-[9px] font-bold text-purple-700 px-2.5 py-1 border border-purple-100 uppercase tracking-wider">
                                    Aplicação Botox
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-xl bg-teal-55 bg-opacity-10 text-[9px] font-bold text-teal-700 px-2.5 py-1 border border-teal-100 uppercase tracking-wider">
                                    Consulta
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

            </div>
          ) : (
            <div className="h-full min-h-[400px] border border-dashed border-slate-200 rounded-2xl flex flex-col justify-center items-center text-center p-8 text-slate-400 bg-white">
              <ClipboardList className="h-10 w-10 mb-2.5 text-slate-350" />
              <p className="text-xs italic leading-relaxed">
                Nenhum paciente selecionado no consultório.<br />
                Selecione um paciente na barra lateral para ver o cronograma de acompanhamento presencial.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
