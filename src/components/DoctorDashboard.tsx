import React, { useState, FormEvent, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Activity,
  Heart,
  Search,
  CheckCircle,
  Clock,
  ArrowLeft,
  Share2,
  Calendar,
  Layers,
  FileText,
  TrendingUp,
  AlertCircle,
  Trash2,
  Edit,
  RefreshCw,
  AlertTriangle,
  MessageSquare,
  Phone
} from 'lucide-react';
import { Patient, DiagnosticType, TrackingEntry, MedicationPrescription, MedicationConfirmation } from '../types';
import { CLINICAL_CARE_PLANS } from '../data/carePlans';

interface DoctorDashboardProps {
  patients: Patient[];
  logs: TrackingEntry[];
  medicationConfirmations: MedicationConfirmation[];
  onUpdatePatientMedications: (patientId: string, medications: MedicationPrescription[]) => Promise<void>;
  onAddPatient: (firstName: string, lastName: string, diagnostic: DiagnosticType) => Patient;
  onUpdatePatient: (patientId: string, firstName: string, lastName: string, diagnostic: DiagnosticType) => void;
  onDeletePatient: (id: string) => void;
  onLogout: () => void;
}

export default function DoctorDashboard({
  patients,
  logs,
  medicationConfirmations,
  onUpdatePatientMedications,
  onAddPatient,
  onUpdatePatient,
  onDeletePatient,
  onLogout
}: DoctorDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'register' | 'patients' | 'alerts'>('overview');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Phone numbers storage mapped by patientId (saved in localStorage on the doctor's browser)
  const [patientPhones, setPatientPhones] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('doctor_patient_phones');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [editingPhoneId, setEditingPhoneId] = useState<string | null>(null);
  const [tempPhone, setTempPhone] = useState<string>('');

  const savePatientPhone = (patientId: string, phone: string) => {
    const updated = { ...patientPhones, [patientId]: phone };
    setPatientPhones(updated);
    try {
      localStorage.setItem('doctor_patient_phones', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Edit Patient modal states
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editDiagnostic, setEditDiagnostic] = useState<DiagnosticType>('Enxaqueca');

  // Sync edit form fields when editing patient changes
  useEffect(() => {
    if (editingPatient) {
      setEditFirstName(editingPatient.firstName);
      setEditLastName(editingPatient.lastName);
      setEditDiagnostic(editingPatient.diagnostic);
    }
  }, [editingPatient]);

  const handleEditSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!editingPatient || !editFirstName.trim() || !editLastName.trim()) return;

    onUpdatePatient(editingPatient.id, editFirstName.trim(), editLastName.trim(), editDiagnostic);
    setEditingPatient(null);
  };

  // Doctor Patient Notification states
  const [sendingAlertPatientId, setSendingAlertPatientId] = useState<string | null>(null);
  const [alertSentStatus, setAlertSentStatus] = useState<string | null>(null);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [diagnostic, setDiagnostic] = useState<DiagnosticType>('Enxaqueca');
  const [successMessage, setSuccessMessage] = useState<{ username: string; pass: string } | null>(null);

  // Medication prescription states
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedTime, setNewMedTime] = useState('08:00');
  const [isSyncingMedication, setIsSyncingMedication] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);
  const [editingMedId, setEditingMedId] = useState<string | null>(null);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');

  // Reset editing medication state when selected patient changes
  useEffect(() => {
    setEditingMedId(null);
    setNewMedName('');
    setNewMedDosage('');
    setNewMedTime('08:00');
  }, [selectedPatientId]);

  // Alarms and alerts helper functions
  const parseTimeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.trim().split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const getMissedMedsToday = (patient: Patient) => {
    const todayStr = new Date().toLocaleDateString('pt-BR');
    const meds = patient.medications || [];
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return meds.filter((med) => {
      const medMin = parseTimeToMinutes(med.time);
      const hasTimePassed = currentMinutes >= medMin;
      if (!hasTimePassed) return false;

      // Check if there is any confirmation today
      const wasConfirmedToday = medicationConfirmations.some((c) => {
        return (
          c.patientId === patient.id &&
          c.medicationId === med.id &&
          new Date(c.confirmedAt).toLocaleDateString('pt-BR') === todayStr
        );
      });

      return !wasConfirmedToday;
    });
  };

  // List of patients currently showing missed doses alerts
  const alertingPatientsList = patients.filter((p) => {
    return getMissedMedsToday(p).length > 0;
  });

  const generateWhatsAppUrl = (patient: Patient, missedMeds: MedicationPrescription[], phone: string) => {
    const medsListStr = missedMeds.map((m) => `• *${m.name}* (${m.dosage} às ${m.time})`).join('\n');
    const greeting = `Olá, *${patient.firstName} ${patient.lastName}*!`;
    
    const message = `${greeting}

Aqui é da equipe do seu médico. Acompanhando o seu plano de cuidado para *${patient.diagnostic}*, notamos que ainda *não foi registrado o uso do(s) medicamento(s)* de hoje:

${medsListStr}

Gostaríamos de saber: *foi apenas um esquecimento de registrar no aplicativo, ou você esqueceu mesmo de tomar a medicação de hoje?*

Lembrando que o uso regular e nos horários exatos é muito importante para o sucesso do seu tratamento. Se precisar de alguma ajuda ou tiver qualquer dificuldade, estamos aqui para lhe dar suporte!

Ficamos no aguardo de sua confirmação. Abraços.`;

    const cleanPhone = phone.replace(/\D/g, ''); // keep numbers only
    const formattedPhone = cleanPhone.length === 11 || cleanPhone.length === 10 ? `55${cleanPhone}` : cleanPhone;
    
    return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
  };

  // Auto-generate username helper preview
  const generatePreviewUsername = (fName: string, lName: string) => {
    if (!fName && !lName) return 'usuario.sobrenome';
    const cleanFirst = fName
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
    const cleanLast = lName
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
    return `${cleanFirst || 'usuario'}.${cleanLast || 'sobrenome'}`;
  };

  const handleRegisterSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    const newPat = onAddPatient(firstName, lastName, diagnostic);
    setSuccessMessage({
      username: newPat.username,
      pass: 'abc123'
    });

    // Clear fields
    setFirstName('');
    setLastName('');
    setDiagnostic('Enxaqueca');
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !newMedName.trim() || !newMedDosage.trim() || isSyncingMedication) return;

    setIsSyncingMedication(true);
    setSyncStatusMessage(null);

    const currentMedications = selectedPatient?.medications || [];
    let updatedMeds: MedicationPrescription[];

    if (editingMedId) {
      updatedMeds = currentMedications.map((m) =>
        m.id === editingMedId
          ? {
              ...m,
              name: newMedName.trim(),
              dosage: newMedDosage.trim(),
              time: newMedTime,
            }
          : m
      );
    } else {
      const newMed: MedicationPrescription = {
        id: 'med_' + Date.now(),
        name: newMedName.trim(),
        dosage: newMedDosage.trim(),
        time: newMedTime,
      };
      updatedMeds = [...currentMedications, newMed];
    }

    try {
      await onUpdatePatientMedications(selectedPatientId, updatedMeds);
      setSyncStatusMessage(
        editingMedId
          ? 'Medicamento editado e alteração sincronizada!'
          : 'Medicamento cadastrado e sincronizado com o paciente!'
      );
      // Reset fields
      setNewMedName('');
      setNewMedDosage('');
      setNewMedTime('08:00');
      setEditingMedId(null);
    } catch (err: any) {
      console.error(err);
      setSyncStatusMessage('Erro ao sincronizar. Verifique a conexão.');
    } finally {
      setIsSyncingMedication(false);
      setTimeout(() => {
        setSyncStatusMessage(null);
      }, 4000);
    }
  };

  const handleRemoveMedication = async (medId: string) => {
    if (!selectedPatientId || isSyncingMedication) return;

    setIsSyncingMedication(true);
    setSyncStatusMessage(null);

    if (editingMedId === medId) {
      setEditingMedId(null);
      setNewMedName('');
      setNewMedDosage('');
      setNewMedTime('08:00');
    }

    const currentMedications = selectedPatient?.medications || [];
    const updatedMeds = currentMedications.filter((m) => m.id !== medId);
    try {
      await onUpdatePatientMedications(selectedPatientId, updatedMeds);
      setSyncStatusMessage('Medicamento removido e alteração sincronizada!');
    } catch (err: any) {
      console.error(err);
      setSyncStatusMessage('Erro ao sincronizar remoção.');
    } finally {
      setIsSyncingMedication(false);
      setTimeout(() => {
        setSyncStatusMessage(null);
      }, 4000);
    }
  };

  const handleSendDoctorNotification = async (patientId: string, patientName: string, customText?: string) => {
    setSendingAlertPatientId(patientId);
    setAlertSentStatus(null);
    try {
      const response = await fetch('/api/push/test-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          name: patientName,
          message: customText || `🩺 Alerta do seu médico: lembre-se de usar sua medicação prescrita no horário correto.`
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar.');
      }
      setAlertSentStatus(`Sucesso: Alerta recebido pelo celular (${data.message || 'ok'})`);
      setTimeout(() => setAlertSentStatus(null), 5500);
    } catch (err: any) {
      console.error(err);
      setAlertSentStatus(`Erro: ${err.message || 'Não foi possível enviar.'}`);
      setTimeout(() => setAlertSentStatus(null), 7000);
    } finally {
      setSendingAlertPatientId(null);
    }
  };

  const filteredPatients = patients.filter((pat) => {
    const fullName = `${pat.firstName} ${pat.lastName}`.toLowerCase();
    const cleanQuery = searchQuery.toLowerCase();
    return fullName.includes(cleanQuery) || pat.username.includes(cleanQuery) || pat.diagnostic.toLowerCase().includes(cleanQuery);
  });

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);
  const selectedPatientLogs = logs
    .filter((l) => l.patientId === selectedPatientId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Count active diagnostics
  const diagnosisCounts = patients.reduce((acc, current) => {
    acc[current.diagnostic] = (acc[current.diagnostic] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Clinic Header */}
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center rounded-lg bg-teal-600 p-2 text-white">
                <Heart className="h-5 w-5" />
              </span>
              <div>
                <span className="text-lg font-bold text-slate-800">Instituto Diego Dorim</span>
                <span className="ml-2 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-700 border border-teal-100">
                  CRM Profissional
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="hidden md:inline-block text-sm text-slate-600">
                Olá, <strong>Dr. Diego Dorim</strong>
              </span>
              <button
                onClick={onLogout}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Body */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {selectedPatientId && selectedPatient ? (
          /* PATIENT MONITORING SHEET VIEW */
          <div className="space-y-6">
            <button
              onClick={() => setSelectedPatientId(null)}
              className="flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-700 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Banco de Pacientes
            </button>

            {/* Profile Overview */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-bold text-slate-800">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </h2>
                    <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700 border border-teal-100">
                      {selectedPatient.diagnostic}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingPatient(selectedPatient)}
                      title="Editar Ficha"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer ml-1"
                    >
                      <Edit className="h-3.5 w-3.5 text-teal-600" />
                      Editar Ficha
                    </button>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    Nome de usuário: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-teal-700 text-xs">{selectedPatient.username}</code> • Cadastrado em: {new Date(selectedPatient.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 text-center">
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">Acessos</span>
                    <span className="text-sm font-bold text-slate-700">
                      {selectedPatient.requiresPasswordChange ? (
                        <span className="text-amber-600 font-medium">Aguardando 1º acesso</span>
                      ) : (
                        <span className="text-emerald-600 font-medium">Acesso Validado</span>
                      )}
                    </span>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 text-center">
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">Nº Registros</span>
                    <span className="text-slate-700 text-lg font-bold">{selectedPatientLogs.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PAINEL DE MONITORAMENTO ESTATÍSTICO DE ENXAGUECA (ICHD-3) */}
            {selectedPatient.diagnostic === 'Enxaqueca' && (() => {
              const now = new Date();
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(now.getDate() - 30);
              
              // Filtrar logs dos últimos 30 dias para enxaqueca
              const migraineLogs30Days = selectedPatientLogs.filter(log => {
                return new Date(log.timestamp) >= thirtyDaysAgo;
              });

              // Agrupar logs por data (string simplificada YYYY-MM-DD para evitar fuso horário de horas)
              const logsByDay: Record<string, typeof selectedPatientLogs> = {};
              migraineLogs30Days.forEach(log => {
                const dateObj = new Date(log.timestamp);
                const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
                if (!logsByDay[dateStr]) {
                  logsByDay[dateStr] = [];
                }
                logsByDay[dateStr].push(log);
              });

              const totalLoggedDays = Object.keys(logsByDay).length;
              let totalDaysWithPain = 0;
              let totalDaysWithAnalgesic = 0;
              let sumPainIntensity = 0;
              let countIntensityLogs = 0;
              let totalICHDHeadacheCrises = 0;

              // Detalhes das crises para mostrar de forma transparente para o médico
              const crisesDetail: Array<{ date: string; reason: string }> = [];

              Object.keys(logsByDay).forEach(dayStr => {
                const dayLogs = logsByDay[dayStr];
                
                // 1. Dor presente?
                const hasPain = dayLogs.some(log => {
                  const scale = Number(log.data.painScale) !== undefined ? Number(log.data.painScale) : 0;
                  const period = String(log.data.painPeriod || '');
                  return period !== 'Sem dor' && scale > 0;
                });
                if (hasPain) totalDaysWithPain++;

                // 2. Uso de analgésico de resgate?
                const usedAnalgesic = dayLogs.some(log => {
                  return log.data.medicationUsed === true || log.data.medicationUsed === 'true';
                });
                if (usedAnalgesic) totalDaysWithAnalgesic++;

                // 3. Intensidade média (Pegar a intensidade máxima reportada no dia e somar para fazer a média)
                const maxIntensityOnDay = dayLogs.reduce((max, log) => {
                  const s = Number(log.data.painScale) || 0;
                  return s > max ? s : max;
                }, 0);
                
                sumPainIntensity += maxIntensityOnDay;
                if (dayLogs.length > 0) countIntensityLogs++;

                // 4. Critérios ICHD-3 de Crise de Enxaqueca
                // Pelo menos 2 dos seguintes: unilateral, pulsatil, intensidade > 7, melhora com repouso
                const isUnilateral = dayLogs.some(log => {
                  const loc = log.data.painLocation;
                  if (Array.isArray(loc)) {
                    return loc.some(l => String(l).toLowerCase().includes('unilateral'));
                  }
                  return String(loc || '').toLowerCase().includes('unilateral');
                });

                const isPulsatile = dayLogs.some(log => {
                  const charac = log.data.painCharacteristics;
                  if (Array.isArray(charac)) {
                    return charac.some(c => String(c).toLowerCase().includes('pulsát') || String(c).toLowerCase().includes('pulsat') || String(c).toLowerCase().includes('latejan'));
                  }
                  return String(charac || '').toLowerCase().includes('pulsát') || String(charac || '').toLowerCase().includes('pulsat') || String(charac || '').toLowerCase().includes('latejan');
                });

                const painScaleValue = maxIntensityOnDay;
                const painGreaterThanSeven = painScaleValue > 7;

                const improvesWithRest = dayLogs.some(log => {
                  return log.data.painRelief === true || log.data.painRelief === 'true';
                });

                let criteriaCount = 0;
                const criteriaMetList: string[] = [];
                if (isUnilateral) { criteriaCount++; criteriaMetList.push('Unilateral'); }
                if (isPulsatile) { criteriaCount++; criteriaMetList.push('Pulsátil'); }
                if (painGreaterThanSeven) { criteriaCount++; criteriaMetList.push('Dor > 7'); }
                if (improvesWithRest) { criteriaCount++; criteriaMetList.push('Melhora com repouso'); }

                // Presença de náusea ou vomito
                const hasNauseaOrVomiting = dayLogs.some(log => {
                  const symptoms = log.data.associatedSymptoms;
                  if (Array.isArray(symptoms)) {
                    return symptoms.some(s => {
                      const low = String(s).toLowerCase();
                      return low.includes('nausea') || low.includes('náusea') || low.includes('vomit') || low.includes('vômit');
                    });
                  }
                  const low = String(symptoms || '').toLowerCase();
                  return low.includes('nausea') || low.includes('náusea') || low.includes('vomit') || low.includes('vômit');
                });

                // Presença de fonofobia, fotofobia ou osmofobia
                const hasSensesSensitivity = dayLogs.some(log => {
                  const symptoms = log.data.associatedSymptoms;
                  if (Array.isArray(symptoms)) {
                    return symptoms.some(s => {
                      const low = String(s).toLowerCase();
                      return low.includes('foto') || low.includes('luz') || low.includes('fono') || low.includes('barulho') || low.includes('osmo') || low.includes('cheiro');
                    });
                  }
                  const low = String(symptoms || '').toLowerCase();
                  return low.includes('foto') || low.includes('luz') || low.includes('fono') || low.includes('barulho') || low.includes('osmo') || low.includes('cheiro');
                });

                // Atende ao ICHD-3?
                const isCrisisICHD = criteriaCount >= 2 && hasNauseaOrVomiting && hasSensesSensitivity;
                if (isCrisisICHD) {
                  totalICHDHeadacheCrises++;
                  const [y, m, d] = dayStr.split('-');
                  crisesDetail.push({
                    date: `${d}/${m}/${y}`,
                    reason: `Características: [${criteriaMetList.join(', ')}] + Náusea ou Vômito + Foto/Fono/Osmofobia`
                  });
                }
              });

              const valAvgIntensity = countIntensityLogs > 0 ? (sumPainIntensity / countIntensityLogs).toFixed(1) : '0';

              return (
                <div className="rounded-2xl border border-teal-100 bg-teal-50/10 p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-teal-100/40 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <Activity className="h-4 w-4 text-teal-600" />
                        Acompanhamento Clínico de Enxaqueca (Últimos 30 dias - ICHD-3)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Relatório epidemiológico e de ocorrência de crises projetadas sobre as respostas diárias consolidadas.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full border border-teal-200">
                      Critérios ICHD-3
                    </span>
                  </div>

                  {migraineLogs30Days.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 bg-white border border-slate-200/60 rounded-xl">
                      <AlertCircle className="h-7 w-7 text-slate-300 mx-auto mb-1 animate-pulse" />
                      <p className="text-xs font-semibold">Nenhum registro de Enxaqueca nos últimos 30 dias</p>
                      <p className="text-[10px] text-slate-400 max-w-[340px] mx-auto mt-0.5">
                        Assim que o paciente registrar os sintomas diários no painel dele, as pontuações e médias ICHD do médico serão calculadas em tempo real.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Card 1: Dias de Dor */}
                        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Dias com Dor</span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-xl font-black text-rose-600">{totalDaysWithPain}</span>
                              <span className="text-xs font-semibold text-slate-400">/ 30 dias</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                            Média de dias de dor nos últimos 30 dias (Intensidade &gt; 0).
                          </p>
                        </div>

                        {/* Card 2: Uso de Analgésicos */}
                        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Uso de Analgésicos</span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-xl font-black text-amber-600">{totalDaysWithAnalgesic}</span>
                              <span className="text-xs font-semibold text-slate-400">/ 30 dias</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                            Módulo de recorrência média em dias do uso de analgésicos de resgate.
                          </p>
                        </div>

                        {/* Card 3: Intensidade Média */}
                        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Intensidade Média</span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-xl font-black text-teal-600">{valAvgIntensity}</span>
                              <span className="text-xs font-semibold text-slate-400">/ 10</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                            Nível de intensidade média da cefaleia em 30 dias.
                          </p>
                        </div>

                        {/* Card 4: Crises ICHD */}
                        <div className="bg-white border border-rose-100 bg-rose-50/5 rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
                          <div>
                            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block mb-1 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 text-rose-500 animate-pulse" />
                              Crises (ICHD-3)
                            </span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-xl font-black text-rose-700">{totalICHDHeadacheCrises}</span>
                              <span className="text-xs font-semibold text-rose-400">/ 30 dias</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                            Média de crises diagnosticáveis sob as regras rígidas do ICHD-3.
                          </p>
                        </div>
                      </div>

                      {/* Quadro Explicativo */}
                      <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Metodologia Clinicamente Aplicada (ICHD-3 Internacional):
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px] text-slate-600">
                          <div className="bg-slate-50/60 p-2 rounded-lg border border-slate-100">
                            <strong className="text-teal-700 font-bold block mb-0.5">A. Dor (Mínimo 2):</strong>
                            <p className="text-[10px] leading-relaxed text-slate-500">Unilateral, pulsátil/latejante, dor grave (&gt;7) ou alívio comprovado com repouso físico.</p>
                          </div>
                          <div className="bg-slate-50/60 p-2 rounded-lg border border-slate-100">
                            <strong className="text-teal-700 font-bold block mb-0.5">B. Somas Clínicas:</strong>
                            <p className="text-[10px] leading-relaxed text-slate-500">Presença explícita de náusea ou de vômito marcada pelo paciente durante o mesmo dia.</p>
                          </div>
                          <div className="bg-slate-50/60 p-2 rounded-lg border border-slate-100">
                            <strong className="text-teal-700 font-bold block mb-0.5">C. Hipersensibilidade:</strong>
                            <p className="text-[10px] leading-relaxed text-slate-500">Hipersensibilidade marcada como fotofobia (luz), fonofobia (ruído) ou osmofobia (cheiro).</p>
                          </div>
                        </div>

                        {crisesDetail.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            <span className="text-[10px] font-semibold text-rose-700 uppercase tracking-widest block mb-1">
                              Crises de Enxaqueca Históricas Validadas:
                            </span>
                            <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                              {crisesDetail.map((c, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[10px] bg-rose-50/20 border border-rose-100 px-2 py-1 rounded">
                                  <strong className="text-rose-800 font-mono">{c.date}</strong>
                                  <span className="text-slate-500 text-[9px] truncate max-w-xs sm:max-w-md" title={c.reason}>{c.reason}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Grid details and chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Care Guidelines Details */}
              <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FileText className="h-5 w-5 text-teal-600" />
                  Estratégia Diagnóstica
                </h3>
                <p className="text-xs text-slate-500">
                  {CLINICAL_CARE_PLANS[selectedPatient.diagnostic]?.description}
                </p>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Metas e Orientações Enviadas:</h4>
                  <ul className="text-xs text-slate-600 space-y-2">
                    {CLINICAL_CARE_PLANS[selectedPatient.diagnostic]?.guidelines.slice(0, 3).map((guide, idx) => (
                      <li key={idx} className="flex gap-2 items-start">
                        <span className="text-teal-600 font-bold">•</span>
                        <span>{guide}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Patient evolution charts */}
              <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 justify-between">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-teal-600" />
                    Curva Gráfica de Evolução dos Sintomas
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Histórico Recente</span>
                </h3>

                {selectedPatientLogs.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 p-6">
                    <Activity className="h-10 w-10 text-slate-300 animate-pulse mb-2" />
                    <p className="text-sm font-semibold text-slate-600">Sem diários registrados ainda</p>
                    <p className="text-xs text-slate-400 max-w-[280px] mt-1">O paciente aparecerá nessa curva à medida que fizer logs diários no aplicativo.</p>
                  </div>
                ) : (
                  <div>
                    {/* Render elegant SVG Chart based on selected condition variables */}
                    {/* For conditions like Migraine or Bruxismo or Cervical Dystonia we can chart the 1-10 pain/stiffness level scale */}
                    {(() => {
                      // Let's identify the metric to chart
                      const config = CLINICAL_CARE_PLANS[selectedPatient.diagnostic]?.trackerConfig;
                      const numericField = config?.fields.find(f => f.type === 'scale') || config?.fields.find(f => f.type === 'number');

                      if (numericField) {
                        const fieldId = numericField.id;
                        const dataPoints = [...selectedPatientLogs]
                          .reverse() // Chronological order
                          .map((log) => ({
                            date: new Date(log.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                            val: Number(log.data[fieldId]) || 0
                          }));

                        const maxScale = numericField.max || 10;
                        const svgWidth = 500;
                        const svgHeight = 160;
                        const padding = 30;

                        // Create points
                        const points = dataPoints.map((pt, index) => {
                          const x = padding + (index * (svgWidth - padding * 2)) / Math.max(1, dataPoints.length - 1);
                          const y = svgHeight - padding - (pt.val * (svgHeight - padding * 2)) / maxScale;
                          return { x, y, pt };
                        });

                        const pointsString = points.map(p => `${p.x},${p.y}`).join(' ');

                        return (
                          <div className="space-y-3">
                            <span className="inline-block text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                              Mapeando: {numericField.label}
                            </span>
                            <div className="relative w-full overflow-x-auto bg-slate-50 rounded-xl p-3 border border-slate-100">
                              <svg className="w-full min-w-[400px] h-44" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                                {/* Grid lines */}
                                {[0, 0.25, 0.5, 0.75, 1].map((pRatio, i) => {
                                  const y = padding + pRatio * (svgHeight - padding * 2);
                                  const valLabel = Math.round(maxScale - pRatio * maxScale);
                                  return (
                                    <g key={i} opacity="0.15">
                                      <line x1={padding} y1={y} x2={svgWidth - padding} y2={y} stroke="#047857" strokeWidth="1" strokeDasharray="3" />
                                      <text x={padding - 5} y={y + 4} textAnchor="end" fontSize="9" fill="#1e293b" className="font-mono">{valLabel}</text>
                                    </g>
                                  );
                                })}

                                {/* Line path */}
                                {points.length > 1 && (
                                  <polyline
                                    fill="none"
                                    stroke="#0d9488"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    points={pointsString}
                                    className="drop-shadow-sm"
                                  />
                                )}

                                {/* Under gradient */}
                                {points.length > 1 && (
                                  <polygon
                                    fill="rgba(13, 148, 136, 0.08)"
                                    points={`${points[0].x},${svgHeight - padding} ${pointsString} ${points[points.length - 1].x},${svgHeight - padding}`}
                                  />
                                )}

                                {/* Point circles & value badges */}
                                {points.map((p, i) => (
                                  <g key={i}>
                                    <circle cx={p.x} cy={p.y} r="4" fill="#0d9488" className="cursor-pointer" />
                                    <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="10" className="font-bold font-mono" fill="#0f172a">
                                      {p.pt.val}
                                    </text>
                                    <text x={p.x} y={svgHeight - 10} textAnchor="middle" fontSize="8" fill="#64748b" className="font-mono font-medium">
                                      {p.pt.date}
                                    </text>
                                  </g>
                                ))}
                              </svg>
                            </div>
                          </div>
                        );
                      }

                      // Fallback when there is no scale fields (e.g. epilepsy seizures counts or drooling list)
                      const seizureField = config?.fields.find(f => f.id === 'seizureCount' || f.id === 'seizures') || config?.fields[0];
                      if (seizureField) {
                        return (
                          <div className="space-y-2">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Monitoramento de Ocorrências Diárias</span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {selectedPatientLogs.slice(0, 8).map((log, idx) => {
                                const lVal = log.data[seizureField.id];
                                return (
                                  <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-between">
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {new Date(log.timestamp).toLocaleDateString()}
                                    </span>
                                    <span className="text-sm font-bold text-slate-700 mt-1 truncate">
                                      {typeof lVal === 'boolean' ? (lVal ? 'Sim' : 'Não') : String(lVal)}
                                    </span>
                                    <span className="text-[9px] text-teal-600 mt-1 uppercase font-semibold">
                                      {seizureField.label.split(' ')[0]}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Seção de Medicamentos e Aderência */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Coluna 1: Prescrever Medicamentos */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-teal-600" />
                    💊 Prescrição de Medicamentos
                  </h3>
                  
                  <div className="flex items-center gap-2">
                    {syncStatusMessage && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        syncStatusMessage.includes('Erro') 
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {syncStatusMessage}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={async () => {
                        if (isSyncingMedication || !selectedPatientId) return;
                        setIsSyncingMedication(true);
                        setSyncStatusMessage(null);
                        try {
                          await onUpdatePatientMedications(selectedPatientId, selectedPatient?.medications || []);
                          setSyncStatusMessage('Sincronizado com o paciente!');
                        } catch (err) {
                          setSyncStatusMessage('Erro ao sincronizar.');
                        } finally {
                          setIsSyncingMedication(false);
                          setTimeout(() => setSyncStatusMessage(null), 4000);
                        }
                      }}
                      disabled={isSyncingMedication}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 disabled:opacity-60 rounded-full border border-teal-200 transition cursor-pointer"
                      title="Sincronizar receita de medicamentos com o paciente"
                    >
                      <RefreshCw className={`h-3 w-3 ${isSyncingMedication ? "animate-spin" : ""}`} />
                      Sincronizar
                    </button>
                  </div>
                </div>
                
                {/* Lista de Medicamentos Prescritos Atualmente */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Medicamentos Ativos</h4>
                  {(!selectedPatient.medications || selectedPatient.medications.length === 0) ? (
                    <p className="text-xs text-slate-400 py-3 italic bg-slate-50 rounded-xl text-center border border-dashed border-slate-200">
                      Nenhum medicamento prescrito para este paciente ainda.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto pr-1">
                      {selectedPatient.medications.map((med) => (
                        <div key={med.id} className="flex justify-between items-center py-2.5">
                          <div className="flex gap-3 items-center">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700 font-bold text-xs ring-1 ring-teal-100">
                              {med.time}
                            </span>
                            <div>
                              <p className="text-xs font-bold text-slate-800">{med.name}</p>
                              <p className="text-[10px] text-slate-500">{med.dosage}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMedId(med.id);
                                setNewMedName(med.name);
                                setNewMedDosage(med.dosage);
                                setNewMedTime(med.time);
                              }}
                              className={`p-1.5 rounded transition ${
                                editingMedId === med.id
                                  ? 'text-teal-600 bg-teal-50'
                                  : 'text-slate-400 hover:text-teal-600 hover:bg-slate-55'
                              }`}
                              title="Editar posologia/horário"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleRemoveMedication(med.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 rounded hover:bg-slate-55 transition"
                              title="Remover medicamento"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form para prescrever novo medicamento */}
                <form onSubmit={handleAddMedication} className="border-t border-slate-100 pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    {editingMedId ? (
                      <>
                        <Edit className="h-4 w-4 text-teal-600" />
                        <span>Editar Medicamento Prescrito</span>
                      </>
                    ) : (
                      <>
                        <span>Prescrever Novo Medicamento</span>
                      </>
                    )}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-400 mb-1">Nome do Medicamento</label>
                      <input
                        type="text"
                        value={newMedName}
                        onChange={(e) => setNewMedName(e.target.value)}
                        placeholder="Ex: Levodopa"
                        required
                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-400 mb-1">Dosagem / Posologia</label>
                      <input
                        type="text"
                        value={newMedDosage}
                        onChange={(e) => setNewMedDosage(e.target.value)}
                        placeholder="Ex: 250mg ou 1 comp"
                        required
                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-[10px] font-medium text-slate-400 mb-1">Horário de Uso</label>
                      <input
                        type="time"
                        value={newMedTime}
                        onChange={(e) => setNewMedTime(e.target.value)}
                        required
                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      {editingMedId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMedId(null);
                            setNewMedName('');
                            setNewMedDosage('');
                            setNewMedTime('08:00');
                          }}
                          className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2 transition"
                        >
                          Cancelar
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={isSyncingMedication}
                        className="rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-4 py-2 transition shadow-sm hover:shadow flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isSyncingMedication ? (
                          <>
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            Sincronizando...
                          </>
                        ) : (
                          editingMedId ? "Salvar e Sincronizar" : "Cadastrar e Sincronizar"
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Coluna 2: Aderência e Ingestões */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  📈 Acompanhamento de Aderência
                </h3>
                
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-semibold">Histórico de Confirmações</h4>
                  {(() => {
                    const patientConfirmations = medicationConfirmations
                      .filter(c => c.patientId === selectedPatientId)
                      .sort((a, b) => new Date(b.confirmedAt).getTime() - new Date(a.confirmedAt).getTime());

                    if (patientConfirmations.length === 0) {
                      return (
                        <div className="flex h-36 flex-col items-center justify-center text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 p-4">
                          <Clock className="h-8 w-8 text-slate-300 mb-2" />
                          <p className="text-xs font-semibold text-slate-600">Nenhuma confirmação ainda</p>
                          <p className="text-[10px] text-slate-400 max-w-[240px] mt-0.5">Assim que o paciente registrar a ingestão do remédio em seu painel, o histórico aparecerá listado aqui em tempo real.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {patientConfirmations.map((confirm) => (
                          <div key={confirm.id} className="bg-emerald-50/40 border border-emerald-100/70 rounded-xl p-3 text-xs space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1.5">
                                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Confirmado ({confirm.prescribedTime})
                              </span>
                              <span className="text-[9px] font-mono text-slate-400">
                                {new Date(confirm.confirmedAt).toLocaleString('pt-BR')}
                              </span>
                            </div>
                            <div className="flex justify-between items-end bg-white/70 p-2 rounded border border-emerald-50/50">
                              <div>
                                <h5 className="text-xs font-bold text-slate-700">{confirm.medicationName}</h5>
                                <p className="text-[10px] text-slate-400">{confirm.dosage}</p>
                              </div>
                              <span className="text-[8px] bg-emerald-100 border border-emerald-250 text-emerald-700 font-bold px-1.5 py-0.5 rounded uppercase">
                                Ingerido
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* PAINEL DO MÉDICO PARA ENVIAR ALERTA CELULAR */}
                {selectedPatient && (
                  <div className="border-t border-slate-100/80 pt-4 mt-1 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      🔔 Ações e Alertas do Médico
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      Caso perceba atrasos na tomada de medicamentos ou queira alertar o paciente no dispositivo móvel dele imediatamente:
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSendDoctorNotification(selectedPatient.id, selectedPatient.firstName)}
                        disabled={sendingAlertPatientId === selectedPatient.id}
                        className="flex-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] py-2 px-3 transition shadow-sm cursor-pointer disabled:opacity-50 text-center"
                      >
                        {sendingAlertPatientId === selectedPatient.id ? 'Sincronizando...' : '⚡ Disparar Alerta de Horário'}
                      </button>
                    </div>

                    {alertSentStatus && (
                      <div className={`text-[10px] p-2 rounded font-medium leading-relaxed ${
                        alertSentStatus.startsWith('Erro:') 
                          ? 'bg-amber-50 text-amber-800 border border-amber-100/70' 
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-100/70'
                      }`}>
                        {alertSentStatus}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* List of full diagnostics log entries */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600" />
                Histórico de Diários e Respostas do Paciente
              </h3>

              {selectedPatientLogs.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">Nenhum diário enviado ainda</p>
              ) : (
                <div className="space-y-4">
                  {selectedPatientLogs.map((entry) => (
                    <div key={entry.id} className="border border-slate-150 rounded-xl p-4 hover:bg-slate-50/50 transition">
                      <div className="flex justify-between items-start gap-4">
                        <span className="text-xs font-mono font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                          {new Date(entry.timestamp).toLocaleString('pt-BR')}
                        </span>
                        {entry.notes && (
                          <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-medium font-sans">
                            Contém Notas Clínicas
                          </span>
                        )}
                      </div>

                      {/* Display key value metrics entered */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 my-3">
                        {Object.entries(entry.data).map(([fieldKey, val]) => {
                          // Find field configuration to show real human label
                          const label = CLINICAL_CARE_PLANS[entry.diagnostic]?.trackerConfig.fields.find(f => f.id === fieldKey)?.label || fieldKey;

                          let displayVal = '';
                          if (Array.isArray(val)) {
                            displayVal = val.length > 0 ? val.join(', ') : 'Nenhum';
                          } else if (typeof val === 'boolean') {
                            displayVal = val ? 'Sim' : 'Não';
                          } else {
                            displayVal = String(val !== undefined && val !== null ? val : 'Não registrado');
                          }

                          return (
                            <div key={fieldKey} className="text-xs bg-white rounded-lg border border-slate-100 p-2.5">
                              <span className="text-[10px] text-slate-400 block mb-0.5 font-medium leading-tight">
                                {label}
                              </span>
                              <strong className="text-slate-700">
                                {displayVal}
                              </strong>
                            </div>
                          );
                        })}
                      </div>

                      {entry.notes && (
                        <div className="mt-2 bg-slate-50 p-2.5 rounded-lg border-l-2 border-slate-300 text-xs text-slate-600 italic">
                          <strong>Observações do paciente:</strong> "{entry.notes}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* REGULAR DIRECTORY & OVERVIEW VIEWS */
          <div className="space-y-8">
            {/* Visual Quick Banner / Stats Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-teal-600 p-6 text-white shadow-sm flex items-center justify-between">
                <div>
                  <span className="block text-xs uppercase tracking-widest text-teal-100 font-semibold">Total de Pacientes</span>
                  <span className="text-3xl font-extrabold">{patients.length}</span>
                </div>
                <Users className="h-10 w-10 text-teal-400 opacity-60" />
              </div>

              <div className="rounded-2xl bg-white border border-slate-200 p-6 text-slate-800 shadow-sm flex items-center justify-between">
                <div>
                  <span className="block text-xs uppercase tracking-widest text-slate-400 font-semibold">Registros Clínicos Recentes</span>
                  <span className="text-3xl font-extrabold">{logs.length}</span>
                </div>
                <Activity className="h-10 w-10 text-teal-600 opacity-60" />
              </div>

              <div className="rounded-2xl bg-white border border-slate-200 p-6 text-slate-800 shadow-sm flex items-center justify-between">
                <div>
                  <span className="block text-xs uppercase tracking-widest text-slate-400 font-semibold">Condições Monitoradas</span>
                  <span className="text-3xl font-extrabold">{Object.keys(diagnosisCounts).length} de 10</span>
                </div>
                <Layers className="h-10 w-10 text-emerald-600 opacity-60" />
              </div>
            </div>

            {/* In-app Sub-Tabs Navigation */}
            <div className="flex border-b border-slate-200 gap-6">
              <button
                onClick={() => { setActiveTab('overview'); setSuccessMessage(null); }}
                className={`pb-3 text-sm font-semibold border-b-2 transition ${
                  activeTab === 'overview'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Painel Geral & Distribuição
              </button>
              <button
                onClick={() => { setActiveTab('patients'); setSuccessMessage(null); }}
                className={`pb-3 text-sm font-semibold border-b-2 transition ${
                  activeTab === 'patients'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Pesquisar & Prontuários ({filteredPatients.length})
              </button>
              <button
                onClick={() => { setActiveTab('register'); setSuccessMessage(null); }}
                className={`pb-3 text-sm font-semibold border-b-2 transition ${
                  activeTab === 'register'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Cadastrar Novo Paciente
              </button>
              <button
                onClick={() => { setActiveTab('alerts'); setSuccessMessage(null); }}
                className={`pb-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                  activeTab === 'alerts'
                    ? 'border-rose-600 text-rose-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Alertas
                {alertingPatientsList.length > 0 && (
                  <span className="bg-rose-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center justify-center animate-pulse shrink-0">
                    {alertingPatientsList.length}
                  </span>
                )}
              </button>
            </div>

            {/* TAB CONTENTS */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Condition lists distribution */}
                <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                    <Layers className="h-5 w-5 text-teal-600" />
                    Balanço por Diagnóstico (10)
                  </h3>

                  <div className="space-y-3">
                    {Object.keys(CLINICAL_CARE_PLANS).map((diagKey) => {
                      const count = diagnosisCounts[diagKey] || 0;
                      return (
                        <div key={diagKey} className="flex justify-between items-center text-xs">
                          <span className="text-slate-600 font-medium">{diagKey}</span>
                          <span className={`px-2 py-0.5 rounded-full font-bold ${
                            count > 0 ? 'bg-teal-50 text-teal-700 font-mono' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {count} {count === 1 ? 'paciente' : 'pacientes'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Latest updates and logs ticker */}
                <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-teal-600" />
                    Atividade Recente do Consultório
                  </h3>

                  {logs.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">Nenhuma atualização dos pacientes nas últimas horas.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 text-xs">
                      {logs.slice(0, 5).map((log) => {
                        const patient = patients.find(p => p.id === log.patientId);
                        return (
                          <div key={log.id} className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition">
                            <div className="space-y-1">
                              <p className="text-slate-800">
                                <strong>{patient?.firstName} {patient?.lastName}</strong> enviou diário para{' '}
                                <span className="text-teal-600 font-semibold">{log.diagnostic}</span>
                              </p>
                              <p className="text-slate-400 font-mono text-[9px]">
                                {new Date(log.timestamp).toLocaleString('pt-BR')}
                              </p>
                            </div>
                            <button
                              onClick={() => setSelectedPatientId(log.patientId)}
                              className="text-teal-600 font-bold hover:underline"
                            >
                              Ver Ficha
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'register' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form column */}
                <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-teal-600" />
                    Formulário de Entrada de Paciente
                  </h3>

                  <form onSubmit={handleRegisterSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                          Nome
                        </label>
                        <input
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Ex: Ana Maria"
                          className="w-full rounded-xl border border-slate-200 px-3 py-3 text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                          Sobrenome
                        </label>
                        <input
                          type="text"
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Ex: Silva Costa"
                          className="w-full rounded-xl border border-slate-200 px-3 py-3 text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        Vincular Plano de Cuidado (Diagnóstico)
                      </label>
                      <select
                        value={diagnostic}
                        onChange={(e) => setDiagnostic(e.target.value as DiagnosticType)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition text-sm"
                      >
                        {Object.keys(CLINICAL_CARE_PLANS).map((diag) => (
                          <option key={diag} value={diag}>
                            {diag} (Plano de Cuidado Integrado)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Live Credentials Preview - VERY COOL FOR FEEDBACK */}
                    <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 flex items-start gap-3">
                      <Clock className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-700">Identificação de Acesso Gerada Automaticamente:</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Usuário gerado: <strong className="font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded text-[11px]">{generatePreviewUsername(firstName, lastName)}</strong>
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Senha temporária de 1º acesso: <strong className="font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded text-[11px]">abc123</strong>
                        </p>
                        <p className="text-[10px] text-slate-400 mt-2">
                          *O paciente será solicitado a atualizar sua senha de segurança no primeiro login dele.
                        </p>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full flex justify-center items-center gap-2 rounded-xl bg-teal-600 py-3 px-4 text-sm font-semibold text-white hover:bg-teal-700 transition"
                    >
                      <UserPlus className="h-4 w-4" />
                      Cadastrar Paciente & Gerar Plano
                    </button>
                  </form>
                </div>

                {/* Status indicator column */}
                <div className="rounded-2xl border border-slate-200 bg-teal-50/50 p-6 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-teal-100 pb-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-teal-600" />
                    Procedimento de Cadastramento
                  </h3>

                  {successMessage ? (
                    <div className="rounded-xl bg-white border border-teal-200 p-4 space-y-3 shadow-sm animate-fade-in">
                      <div className="flex gap-2 text-xs text-emerald-800 font-bold items-center">
                        <span className="bg-emerald-100 text-emerald-800 p-1 rounded-full text-[10px]">✓</span>
                        Cadastrado com Sucesso!
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-600">
                        <p>Forneça as credenciais ao paciente:</p>
                        <p className="font-medium">
                          Usuário: <code className="font-mono bg-slate-100 px-1 py-0.5 text-slate-800 font-bold rounded">{successMessage.username}</code>
                        </p>
                        <p className="font-medium">
                          Senha Padrão: <code className="font-mono bg-slate-100 px-1 py-0.5 text-slate-800 font-bold rounded">{successMessage.pass}</code>
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        Copie ou encaminhe estes dados para que o paciente faça o seu primeiro login e altere sua senha de acesso.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3.5 text-xs text-slate-600">
                      <div className="flex gap-2 items-start">
                        <span className="font-bold text-teal-700">1.</span>
                        <p><strong>Insira o nome separado</strong>: Primeiro nome e sobrenome geram o nome de usuário completo.</p>
                      </div>
                      <div className="flex gap-2 items-start">
                        <span className="font-bold text-teal-700">2.</span>
                        <p><strong>Escolha a patologia</strong>: O sistema vinculará o questionário de autoavaliação e o canal de vídeos adequado.</p>
                      </div>
                      <div className="flex gap-2 items-start">
                        <span className="font-bold text-teal-700">3.</span>
                        <p><strong>Monitore o envio</strong>: Assim que o paciente entrar, você terá relatórios e gráficos de dor detalhados no Painel do Médico.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'patients' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                {/* Search Bar */}
                <div className="relative rounded-md shadow-sm max-w-md">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-slate-800 placeholder-slate-400 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-xs"
                    placeholder="Pesquise por nome, usuário ou plano de cuidado..."
                  />
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-150">
                  <table className="min-w-full divide-y divide-slate-100 text-left text-xs align-middle">
                    <thead className="bg-slate-50 font-bold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3">Paciente</th>
                        <th className="px-5 py-3">Usuário de Acesso</th>
                        <th className="px-5 py-3">Plano de Cuidado</th>
                        <th className="px-5 py-3">Status de Segurança</th>
                        <th className="px-5 py-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredPatients.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-6 text-slate-400">
                            Nenhum paciente localizado para a busca.
                          </td>
                        </tr>
                      ) : (
                        filteredPatients.map((pat) => {
                          const hasLogs = logs.some((l) => l.patientId === pat.id);
                          return (
                            <tr key={pat.id} className="hover:bg-slate-50/50 transition">
                              <td className="px-5 py-3">
                                <span className="font-extrabold text-slate-800 block">
                                  {pat.firstName} {pat.lastName}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Cadastrado em {new Date(pat.createdAt).toLocaleDateString()}
                                </span>
                              </td>
                              <td className="px-5 py-3">
                                <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-teal-700 text-[11px]">
                                  {pat.username}
                                </code>
                              </td>
                              <td className="px-5 py-3">
                                <span className="rounded bg-teal-50 text-[10px] font-bold text-teal-700 px-2 py-0.5 border border-teal-100">
                                  {pat.diagnostic}
                                </span>
                              </td>
                              <td className="px-5 py-3">
                                {pat.requiresPasswordChange ? (
                                  <span className="inline-flex items-center gap-1.5 text-amber-600 font-medium">
                                    <Clock className="w-3.5 h-3.5" />
                                    Mudar senha (abc123)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Senha personalizada
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => setSelectedPatientId(pat.id)}
                                    className="rounded-lg bg-teal-50 px-3 py-1.5 text-teal-700 hover:bg-teal-100 hover:text-teal-800 transition font-bold"
                                  >
                                    Ver Relatórios
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingPatient(pat)}
                                    title="Editar Cadastro"
                                    className="rounded-lg bg-slate-100 p-2 text-slate-700 hover:bg-slate-200 transition"
                                    id={`edit-patient-btn-${pat.id}`}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(pat.id)}
                                    title="Excluir Paciente"
                                    className="rounded-lg bg-red-50 p-2 text-red-650 hover:bg-red-100 transition"
                                    id={`delete-patient-btn-${pat.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-rose-100 bg-rose-50/30 p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-rose-600" />
                        Acompanhamento de Alertas de Atraso de Medicação
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Esta lista mostra pacientes com medicamentos prescritos cujo horário de hoje já passou, mas que não foram confirmados como tomados/registrados.
                      </p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 px-4 py-2 text-center shadow-xs">
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Total em Atraso</span>
                      <span className="text-xl font-black text-rose-600">{alertingPatientsList.length}</span>
                    </div>
                  </div>
                </div>

                {alertingPatientsList.length === 0 ? (
                  <div className="flex h-56 flex-col items-center justify-center text-center rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
                    <CheckCircle className="h-12 w-12 text-emerald-500 mb-3 animate-bounce" />
                    <h4 className="text-sm font-bold text-slate-800">Tudo em dia!</h4>
                    <p className="text-xs text-slate-500 max-w-sm mt-1">
                      Nenhum paciente possui dosagens pendentes para o momento atual de hoje. ADERÊNCIA PERFEITA!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {alertingPatientsList.map((patient) => {
                      const missedMeds = getMissedMedsToday(patient);
                      const phone = patientPhones[patient.id] || '';
                      const isEditingPhone = editingPhoneId === patient.id;

                      return (
                        <div key={patient.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h4 className="font-bold text-slate-800 text-sm">
                                  {patient.firstName} {patient.lastName}
                                </h4>
                                <span className="inline-block mt-1 text-[10px] bg-teal-50 border border-teal-100/50 text-teal-700 font-bold px-2 py-0.5 rounded-full">
                                  {patient.diagnostic}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">
                                @{patient.username}
                              </span>
                            </div>

                            {/* Missed Medication list */}
                            <div className="bg-rose-50/40 border border-rose-100 rounded-xl p-3 space-y-2">
                              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wide flex items-center gap-1.5">
                                <span className="inline-block h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                                {missedMeds.length} medicação(ões) pendente(s) hoje:
                              </span>
                              <div className="space-y-1.5">
                                {missedMeds.map((med) => (
                                  <div key={med.id} className="flex justify-between items-center text-xs bg-white border border-rose-50 p-2 rounded-md">
                                    <div className="font-medium text-slate-700">
                                      {med.name} <span className="text-[10px] text-slate-400">({med.dosage})</span>
                                    </div>
                                    <div className="font-mono text-xs font-bold text-rose-600 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {med.time}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Phone input & Whatsapp Option */}
                          <div className="border-t border-slate-100 pt-4 space-y-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                Telefone do Paciente (WhatsApp)
                              </label>
                              
                              {isEditingPhone ? (
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="Ex: 11999999999"
                                    value={tempPhone}
                                    onChange={(e) => setTempPhone(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-800 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      savePatientPhone(patient.id, tempPhone);
                                      setEditingPhoneId(null);
                                    }}
                                    className="px-3 py-1 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 transition"
                                  >
                                    Salvar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingPhoneId(null)}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              ) : (
                                <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs">
                                  <span className="text-slate-600 font-mono">
                                    {phone ? (
                                      phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
                                    ) : (
                                      <span className="text-slate-400 italic font-sans">Nenhum telefone cadastrado</span>
                                    )}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingPhoneId(patient.id);
                                      setTempPhone(phone);
                                    }}
                                    className="text-[10px] text-teal-600 hover:text-teal-700 font-bold"
                                  >
                                    {phone ? 'Alterar' : 'Cadastrar'}
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Enviar Whatsapp button */}
                            {phone ? (
                              <a
                                href={generateWhatsAppUrl(patient, missedMeds, phone)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 transition text-center shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <MessageSquare className="h-4 w-4" />
                                Enviar Mensagem via WhatsApp
                              </a>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPhoneId(patient.id);
                                  setTempPhone('');
                                }}
                                className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 font-semibold text-xs py-2.5 px-4 transition flex items-center justify-center gap-2 cursor-pointer border border-dashed border-slate-200"
                              >
                                <MessageSquare className="h-4 w-4" />
                                Cadastre Celular para Habilitar Envio
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-sm w-full mx-4 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-50 rounded-full">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Excluir Cadastro</h4>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Tem certeza que deseja remover o paciente <strong className="text-slate-700">{patients.find(p => p.id === deleteConfirmId)?.firstName} {patients.find(p => p.id === deleteConfirmId)?.lastName}</strong>?
              Esta ação é permanente e removerá todos os diários de acompanhamento (logs) associados a ele.
            </p>

            <div className="flex gap-3 justify-end text-xs">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 transition font-semibold"
                id="cancel-delete-btn"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeletePatient(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 rounded-xl text-white bg-red-600 hover:bg-red-700 transition font-semibold"
                id="confirm-delete-btn"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {editingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full mx-4 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-teal-650">
              <div className="p-2 bg-teal-50 rounded-full">
                <Edit className="h-6 w-6 text-teal-600" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Editar Cadastro do Paciente</h4>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Nome
                </label>
                <input
                  type="text"
                  required
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Sobrenome
                </label>
                <input
                  type="text"
                  required
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Plano de Cuidado (Diagnóstico)
                </label>
                <select
                  value={editDiagnostic}
                  onChange={(e) => setEditDiagnostic(e.target.value as DiagnosticType)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
                >
                  {Object.keys(CLINICAL_CARE_PLANS).map((diag) => (
                    <option key={diag} value={diag}>
                      {diag}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPatient(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 transition font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-white bg-teal-600 hover:bg-teal-700 transition font-semibold"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
