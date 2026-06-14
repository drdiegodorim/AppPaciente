import React, { useState, FormEvent } from 'react';
import {
  Heart,
  Video,
  FileText,
  Clock,
  LogOut,
  Calendar,
  Lock,
  PlusCircle,
  Play,
  CheckCircle,
  BookOpen,
  Send,
  AlertTriangle,
  User,
  ExternalLink,
  Bell,
  Youtube
} from 'lucide-react';
import { Patient, TrackingEntry, DiagnosticType, MedicationPrescription, MedicationConfirmation } from '../types';
import { CLINICAL_CARE_PLANS } from '../data/carePlans';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface PatientDashboardProps {
  currentPatient: Patient;
  logs: TrackingEntry[];
  medicationConfirmations: MedicationConfirmation[];
  onConfirmMedication: (confirmation: MedicationConfirmation) => void;
  onChangePassword: (newPass: string) => void;
  onAddLog: (data: Record<string, any>, notes: string) => void;
  onLogout: () => void;
}

export default function PatientDashboard({
  currentPatient,
  logs,
  medicationConfirmations,
  onConfirmMedication,
  onChangePassword,
  onAddLog,
  onLogout
}: PatientDashboardProps) {
  // Password change states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Push Notifications States
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState<boolean | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);
  const [testNotificationLoading, setTestNotificationLoading] = useState(false);
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);

  // Auto-show push permission prompt popup if permission is default and not dismissed in session
  React.useEffect(() => {
    if (notificationPermission === 'default') {
      const dismissed = typeof window !== 'undefined' ? sessionStorage.getItem('dismissed_push_promo') : null;
      if (!dismissed) {
        const t = setTimeout(() => setShowPushModal(true), 1200);
        return () => clearTimeout(t);
      }
    }
  }, [notificationPermission]);

  // Keep track of current minutes in the day to trigger live alerts as time advances
  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  React.useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentMinutes(d.getHours() * 60 + d.getMinutes());
    }, 15000); // update every 15s for exact clock alignment
    return () => clearInterval(timer);
  }, []);

  // Sync medications and register Service Worker on mount
  React.useEffect(() => {
    // 1. Synchronize patient medications to Express backend so the hourly background check has them
    fetch('/api/patients/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: currentPatient.id,
        patientName: `${currentPatient.firstName} ${currentPatient.lastName}`,
        medications: currentPatient.medications || []
      })
    }).catch(err => console.error("Error syncing meds:", err));

    // 2. Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('Service Worker registered successfully!', reg);
        })
        .catch((err) => {
          console.error('Service Worker registration failed:', err);
        });
    }

    // 3. Listen for message from Service Worker for real-time notification intake
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'MEDICATION_CONFIRMED_VIA_NOTIFICATION') {
        const { medicationId, medicationName, dosage, time } = event.data;
        const confirmation: MedicationConfirmation = {
          id: 'confirm_' + Date.now(),
          patientId: currentPatient.id,
          medicationId: medicationId,
          medicationName: medicationName,
          dosage: dosage,
          prescribedTime: time,
          confirmedAt: new Date().toISOString()
        };
        onConfirmMedication(confirmation);
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleSWMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
    };
  }, [currentPatient, onConfirmMedication]);

  const handleSubscribePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushError('Seu dispositivo ou navegador não suporta notificações Push em background.');
      return;
    }

    setIsSubscribing(true);
    setPushError(null);

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission !== 'granted') {
        setPushError('Permissão para notificações foi negada.');
        setIsSubscribing(false);
        return;
      }

      // Fetch VAPID public key
      const response = await fetch('/api/push/vapid-public-key');
      const { publicKey } = await response.json();

      if (!publicKey) {
        throw new Error('Não foi possível obter a chave pública do servidor.');
      }

      const registration = await navigator.serviceWorker.ready;
      
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        });
      }

      // Save push subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: currentPatient.id,
          subscription: subscription
        })
      });

      setSubscriptionSuccess(true);
      setTimeout(() => {
        setSubscriptionSuccess(null);
        setShowPushModal(false); // Close modal on success
      }, 3500);
    } catch (err: any) {
      console.error('Push Subscription failed:', err);
      setPushError(err.message || 'Falha ao ativar alertas do celular.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleTestPushNotification = async (delaySeconds = 0) => {
    setTestNotificationLoading(true);
    setTestNotificationSent(false);

    try {
      const delayMs = delaySeconds * 1000;
      const res = await fetch('/api/push/test-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: currentPatient.id,
          name: currentPatient.firstName,
          delayMs,
          message: delaySeconds > 0 
            ? `⏱️ Alerta agendado de ${delaySeconds}s recebido! Seu celular está sincronizado e receberá alertas assim mesmo com a tela fechada.`
            : `🔔 Teste de Alerta Imediato para medicação recebido com sucesso!`
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Erro desconhecido');
      }

      setTestNotificationSent(true);
      setTimeout(() => setTestNotificationSent(false), 6000);
    } catch (err: any) {
      console.error('Error triggering test:', err);
      setPushError(err.message || 'Erro ao enviar aviso de teste. Ative as notificações primeiro.');
    } finally {
      setTestNotificationLoading(false);
    }
  };

  const parseTimeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const getConfirmationToday = (medId: string) => {
    const todayStr = new Date().toLocaleDateString('pt-BR');
    return medicationConfirmations.find((c) => {
      return c.patientId === currentPatient.id &&
             c.medicationId === medId &&
             new Date(c.confirmedAt).toLocaleDateString('pt-BR') === todayStr;
    });
  };

  const handleConfirmIntake = (med: MedicationPrescription) => {
    const confirmation: MedicationConfirmation = {
      id: 'confirm_' + Date.now(),
      patientId: currentPatient.id,
      medicationId: med.id,
      medicationName: med.name,
      dosage: med.dosage,
      prescribedTime: med.time,
      confirmedAt: new Date().toISOString()
    };
    onConfirmMedication(confirmation);
  };

  // Form states for tracking log
  const carePlan = CLINICAL_CARE_PLANS[currentPatient.diagnostic];
  const fields = carePlan?.trackerConfig.fields || [];

  const [formData, setFormData] = useState<Record<string, any>>(() => {
    // Initial fields preset values
    const initial: Record<string, any> = {};
    fields.forEach((f) => {
      if (f.type === 'scale') initial[f.id] = f.min !== undefined ? f.min : 5;
      else if (f.type === 'boolean') initial[f.id] = false;
      else if (f.type === 'select') initial[f.id] = f.options ? f.options[0] : '';
      else if (f.type === 'number') initial[f.id] = 0;
      else initial[f.id] = '';
    });
    return initial;
  });
  const [notes, setNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);



  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 4) {
      setPasswordError('A nova senha deve possuir pelo menos 4 caracteres.');
      return;
    }
    if (newPassword === 'abc123') {
      setPasswordError('Escolha uma senha diferente da senha padrão de fábrica (abc123).');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas digitadas não coincidem.');
      return;
    }

    onChangePassword(newPassword);
  };

  const handleLogSubmit = (e: FormEvent) => {
    e.preventDefault();
    onAddLog(formData, notes);
    setSuccessMsg(true);

    // Reset notes, keep some presets
    setNotes('');
    setTimeout(() => {
      setSuccessMsg(false);
    }, 4000);
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // Get historical logs for this patient only
  const patientLogs = logs
    .filter((l) => l.patientId === currentPatient.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // FORCE PASSWORD CHANGE ON FIRST ACCESS
  if (currentPatient.requiresPasswordChange) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 font-sans">
        <div className="w-full max-w-md space-y-8 bg-white p-8 shadow-md rounded-2xl border border-slate-200">
          <div className="text-center">
            <span className="inline-flex items-center justify-center rounded-xl bg-amber-50 p-3 text-amber-600 border border-amber-100">
              <Lock className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-2xl font-extrabold text-slate-800">
              Primeiro Acesso Clínico
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Olá, <strong>{currentPatient.firstName}</strong>. Por motivos de segurança, você precisa alterar sua senha inicial (abc123) agora.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handlePasswordSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Nova Senha
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Insira sua nova senha secreta"
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Confirme a Nova Senha
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha secreta"
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition text-sm"
              />
            </div>

            {passwordError && (
              <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-600 border border-rose-100 flex items-start gap-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <p>{passwordError}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex justify-center rounded-xl bg-teal-600 py-3 px-4 text-sm font-semibold text-white hover:bg-teal-700 transition shadow-md shadow-teal-600/10"
            >
              Definir Nova Senha & Começar
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-600 underline mt-2"
            >
              Voltar ao Login
            </button>
          </form>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Patient Navbar */}
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center rounded-lg bg-emerald-600 p-2 text-white">
                <Heart className="h-5 w-5" />
              </span>
              <div>
                <span className="text-base font-bold text-slate-800">Seu Canal de Cuidado</span>
                <span className="hidden sm:inline-block ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100 uppercase tracking-wide">
                  Paciente Ativo
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">
                Olá, <strong>{currentPatient.firstName} {currentPatient.lastName}</strong>
              </span>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Body */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Banner */}
        <div className="rounded-2xl bg-gradient-to-br from-teal-700 to-emerald-800 p-6 md:p-8 text-white shadow-md shadow-teal-900/10 mb-8 space-y-2">
          <span className="inline-block text-[10px] uppercase font-bold tracking-widest bg-white/20 px-2.5 py-1 rounded">
            Seu Tratamento Clínico Integral
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Plano de Cuidado: {currentPatient.diagnostic}
          </h2>
          <p className="text-sm text-teal-100 max-w-2xl font-light">
            {carePlan?.description}
          </p>
        </div>

        {/* ALERTA DE MEDICAÇÃO ATIVO - SE HOUVER ALGUM MEDICAMENTO EM ATRASO OU NA HORA */}
        {(() => {
          const dueMeds = (currentPatient.medications || []).filter((med) => {
            const confirmed = getConfirmationToday(med.id);
            const medMin = parseTimeToMinutes(med.time);
            return !confirmed && currentMinutes >= medMin;
          });

          if (dueMeds.length === 0) return null;

          return (
            <div className="mb-8 rounded-2xl bg-amber-50 border border-amber-200 p-5 shadow-sm animate-pulse space-y-3">
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-550 text-white bg-amber-500 shrink-0">
                  <AlertTriangle className="h-6 w-6" />
                </span>
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 text-sm">🚨 Alerta: Horário de Medicação Prescrita</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Você possui <strong>{dueMeds.length} medicamento(s)</strong> pendente(s) para o horário atual de hoje. Por favor, faça o uso conforme prescrito e confirme abaixo para notificar o médico:
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5 mt-1 sm:pl-14">
                {dueMeds.map((med) => (
                  <button
                    key={med.id}
                    onClick={() => handleConfirmIntake(med)}
                    className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-650 active:scale-95 text-white px-4 py-2.5 text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Confirmar {med.name} ({med.dosage}) das {med.time}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Cronograma de Medicamentos Geral */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-2">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
              <Clock className="h-4.5 w-4.5 text-teal-600" />
              💊 Cronograma de Medicamentos Diários
            </h3>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-150 px-2.5 py-0.5 rounded-full font-mono">
              Hora de Brasília: {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {(!currentPatient.medications || currentPatient.medications.length === 0) ? (
            <div className="text-center py-5 text-slate-400 space-y-0.5">
              <p className="text-xs italic">Nenhum plano de medicação prescrito ainda pelo médico assistente.</p>
              <p className="text-[10px]">As prescrições aparecerão automaticamente assim que adicionadas.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-150 rounded-xl bg-slate-50/40 overflow-hidden">
              {currentPatient.medications.map((med) => {
                const confirmed = getConfirmationToday(med.id);
                const medMin = parseTimeToMinutes(med.time);
                const isDue = !confirmed && currentMinutes >= medMin;

                return (
                  <div
                    key={med.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3 transition ${
                      confirmed
                        ? 'bg-emerald-50/10'
                        : isDue
                        ? 'bg-amber-50/35 ring-1 ring-inset ring-amber-200/50'
                        : 'hover:bg-white/40'
                    }`}
                  >
                    {/* Left/Main portion: Badge and details */}
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex shrink-0 font-mono text-xs font-bold px-2 py-0.5 rounded-md border ${
                        confirmed
                          ? 'bg-emerald-50 text-emerald-850 border-emerald-200'
                          : isDue
                          ? 'bg-amber-500 text-white border-amber-500 animate-pulse'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {med.time}
                      </span>
                      
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold text-slate-800">{med.name}</h4>
                          <span className="text-[10px] text-slate-500">({med.dosage})</span>
                        </div>
                        {confirmed ? (
                          <div className="text-[9px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                            <span className="inline-block h-1 w-1 rounded-full bg-emerald-500"></span>
                            ✓ Ingerido hoje às {' '}
                            <strong className="font-mono">
                              {new Date(confirmed.confirmedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </strong>
                          </div>
                        ) : isDue ? (
                          <div className="text-[9px] text-amber-600 font-bold flex items-center gap-1 mt-0.5 animate-pulse">
                            <span className="inline-block h-1 w-1 rounded-full bg-amber-500"></span>
                            Aguardando confirmação imediata
                          </div>
                        ) : (
                          <div className="text-[9px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                            <span className="inline-block h-1 w-1 rounded-full bg-slate-300"></span>
                            Agendado
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right portion: Quick Action Button */}
                    <div className="shrink-0 flex items-center">
                      {confirmed ? (
                        <div className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                          Confirmado
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConfirmIntake(med)}
                          className={`w-full sm:w-auto text-center font-bold text-[10px] py-1.5 px-3.5 rounded-lg flex items-center justify-center gap-1.5 transition active:scale-[0.98] cursor-pointer shadow-sm ${
                            isDue
                              ? 'bg-amber-500 hover:bg-amber-600 text-white font-extrabold'
                              : 'bg-teal-600 hover:bg-teal-700 text-white'
                          }`}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Confirmar Ingestão {isDue && 'Agora'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* PAINEL DE WEB PUSH E ALERTAS NO DISPOSITIVO MÓVEL (BACKGROUND) */}
          {notificationPermission !== 'granted' && (
            <div className="mt-6 border-t border-slate-100 pt-5 space-y-4">
              <div className="rounded-xl bg-teal-50/50 border border-teal-100/60 p-4 space-y-3">
                <div className="flex items-start gap-3 flex-wrap sm:flex-nowrap">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white shrink-0 shadow-sm shadow-teal-200">
                    <Bell className="h-4 w-4" />
                  </span>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      Notificações e Alertas em Background no Celular
                      <span className="text-[9px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full uppercase">
                        PWA Ativado
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed max-w-4xl">
                      Para nunca perder o horário de tomar o remédio: você receberá alertas em tempo real direto na sua tela de bloqueio e central de notificações, <strong>mesmo se o seu celular estiver guardado ou com a página fechada</strong>.
                    </p>
                  </div>
                </div>

                {pushError && (
                  <div className="rounded-lg bg-red-50 border border-red-150 p-3 text-red-700 text-xs font-medium">
                    ⚠️ {pushError}
                  </div>
                )}

                {subscriptionSuccess && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-150 p-3 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                    Dispositivo cadastrado com sucesso! As notificações em background já estão integradas ao seu prontuário.
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={handleSubscribePush}
                    disabled={isSubscribing}
                    className="rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 transition flex items-center gap-2 cursor-pointer shadow-sm hover:shadow"
                  >
                    <Bell className="h-3.5 w-3.5" />
                    {isSubscribing ? 'Ativando...' : 'Ativar Alertas no meu Celular'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dashboard Unified Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Column 1: Daily Evolution Form (lg:col-span-6) */}
          <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
              <PlusCircle className="h-5 w-5 text-teal-600" />
              Meu Diário de Evolução
            </h3>

            <form onSubmit={handleLogSubmit} className="space-y-6">
              {fields.map((f) => {
                return (
                  <div key={f.id} className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      {f.label}
                    </label>

                    {f.type === 'scale' && (
                      <div className="space-y-2">
                        <input
                          type="range"
                          min={f.min !== undefined ? f.min : 0}
                          max={f.max !== undefined ? f.max : 10}
                          value={formData[f.id]}
                          onChange={(e) => handleFieldChange(f.id, parseInt(e.target.value))}
                          className="w-full accent-teal-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-[11px] font-bold text-slate-600 px-1 font-mono">
                          <span>Mín ({f.min})</span>
                          <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded text-xs">
                            Sua resposta: {formData[f.id]}
                          </span>
                          <span>Máx ({f.max})</span>
                        </div>
                      </div>
                    )}

                    {f.type === 'boolean' && (
                      <div className="flex items-center gap-4 py-1">
                        <button
                          type="button"
                          onClick={() => handleFieldChange(f.id, true)}
                          className={`flex-1 flex justify-center py-2 rounded-lg border text-xs font-semibold transition ${
                            formData[f.id] === true
                              ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-500'
                          }`}
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFieldChange(f.id, false)}
                          className={`flex-1 flex justify-center py-2 rounded-lg border text-xs font-semibold transition ${
                            formData[f.id] === false
                              ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-500'
                          }`}
                        >
                          Não
                        </button>
                      </div>
                    )}

                    {f.type === 'select' && (
                      <select
                        value={formData[f.id]}
                        onChange={(e) => handleFieldChange(f.id, e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
                      >
                        {f.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}

                    {f.type === 'number' && (
                      <input
                        type="number"
                        value={formData[f.id]}
                        onChange={(e) => handleFieldChange(f.id, parseInt(e.target.value) || 0)}
                        placeholder={f.placeholder}
                        className="w-full rounded-xl border border-slate-200 px-3 py-3 text-xs text-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
                      />
                    )}

                    {f.type === 'text' && (
                      <input
                        type="text"
                        value={formData[f.id]}
                        onChange={(e) => handleFieldChange(f.id, e.target.value)}
                        placeholder={f.placeholder}
                        className="w-full rounded-xl border border-slate-200 px-3 py-3 text-xs text-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
                      />
                    )}
                  </div>
                );
              })}

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Notas ou Dúvidas Extras para seu Doutor (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Escreva algo relevante ou relate se notou algo fora do comum..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-xs text-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
                />
              </div>

              {successMsg && (
                <div className="rounded-xl bg-teal-50 p-4 border border-teal-100 flex items-start gap-2.5 animate-fade-in">
                  <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-teal-800">Diário Enviado com sucesso!</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      O Dr. Diego Dorim poderá avaliar este histórico na ficha do seu acompanhamento clínico.
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full flex justify-center items-center gap-2 rounded-xl bg-teal-600 py-3 px-4 text-xs font-semibold text-white hover:bg-teal-700 transition"
              >
                <Send className="h-4 w-4" />
                {carePlan?.trackerConfig.buttonLabel}
              </button>
            </form>
          </div>

          {/* Column 2: Study Material & Guidelines (lg:col-span-6) */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* YouTube Material */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2 text-sm">
                <Youtube className="h-4.5 w-4.5 text-rose-600" />
                🎥 Material de Estudo do Instituto
              </h3>

              <div className="rounded-xl border border-rose-100 bg-rose-50/15 p-4 text-center space-y-3.5 relative overflow-hidden group">
                {/* Subtle background glow */}
                <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 h-24 w-24 rounded-full bg-rose-200/25 blur-xl pointer-events-none" />
                
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-600 transition-transform duration-300 group-hover:scale-105">
                  <Youtube className="h-5.5 w-5.5 fill-rose-600 stroke-[1.5]" />
                </div>

                <div className="space-y-1.5 text-left">
                  <h4 className="text-xs font-extrabold text-slate-800 text-center">Nosso Canal de Vídeos e Exercícios</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed text-center">
                    Acesse o canal oficial do <strong>Instituto Diego Dorim</strong> no YouTube para assistir a vídeos de reabilitação física, exercícios terapêuticos e orientações complementares recomendados para elevar a eficácia de seu tratamento.
                  </p>
                </div>

                <a
                  href="https://www.youtube.com/@InstitutoDiegoDorim"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-[11px] font-bold py-2.5 px-4 transition-all duration-200 shadow-sm shadow-rose-100 cursor-pointer"
                >
                  <Play className="h-3 w-3 fill-white" />
                  Acessar Canal do YouTube
                </a>
              </div>
            </div>

            {/* Medical Guidelines Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2 text-sm">
                <FileText className="h-4.5 w-4.5 text-teal-600" />
                📋 Orientações Úteis do Médico
              </h3>

              <div className="space-y-3">
                {carePlan?.guidelines.map((guide, idx) => (
                  <div key={idx} className="flex gap-3 text-xs text-slate-600 items-start leading-relaxed">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <p>{guide}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-slate-50 p-3 border border-slate-150 text-[11px] text-slate-500 flex gap-2">
                <span className="text-teal-600 font-bold shrink-0">ℹ</span>
                <p>Estas orientações foram prescritas exclusivamente pelo nosso consultório para auxiliar na evolução do seu tratamento.</p>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* POP-UP OVERLAY DE ATIVAÇÃO DE ALERTAS NO CELULAR */}
      {showPushModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/65 backdrop-blur-md transition-opacity duration-350"
            onClick={() => {
              sessionStorage.setItem('dismissed_push_promo', 'true');
              setShowPushModal(false);
            }}
          />
          
          {/* Modal Container */}
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 flex flex-col items-center p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => {
                sessionStorage.setItem('dismissed_push_promo', 'true');
                setShowPushModal(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition cursor-pointer font-bold text-xs"
              title="Fechar"
            >
              ✕
            </button>

            {/* Icon Header */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 mb-5 relative shrink-0">
              <span className="absolute animate-ping inline-flex h-full w-full rounded-2xl bg-teal-400 opacity-20"></span>
              <Bell className="h-7 w-7 text-teal-600 relative z-10" />
            </div>

            {/* Content text */}
            <div className="text-center space-y-2 mb-6">
              <h3 className="text-base md:text-lg font-extrabold text-slate-800">
                Ativar Alertas no Celular?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Você receberá avisos em tempo real na sua tela de bloqueio e central de notificações na hora exata do remédio. <strong>Funciona mesmo se a tela estiver apagada ou o aplicativo fechado!</strong>
              </p>
            </div>

            {/* Inner Feedback or Alerts */}
            {pushError && (
              <div className="w-full rounded-xl bg-amber-55/10 border border-amber-200/50 p-2.5 text-amber-700 text-xs font-semibold mb-4 text-center">
                ⚠️ {pushError}
              </div>
            )}

            {subscriptionSuccess && (
              <div className="w-full rounded-xl bg-emerald-50 border border-emerald-150 p-2.5 text-emerald-800 text-xs font-bold mb-4 flex items-center justify-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                Alertas ativados com sucesso!
              </div>
            )}

            {/* CTAs */}
            <div className="w-full flex flex-col gap-2.5">
              <button
                onClick={handleSubscribePush}
                disabled={isSubscribing}
                className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 disabled:opacity-50 text-white text-xs font-bold py-3 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Bell className="h-3.5 w-3.5" />
                {isSubscribing ? 'Ativando lembrete...' : 'Sim, Ativar Alertas'}
              </button>

              <button
                onClick={() => {
                  sessionStorage.setItem('dismissed_push_promo', 'true');
                  setShowPushModal(false);
                }}
                className="w-full rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 text-xs font-bold py-2.5 transition text-center cursor-pointer border border-slate-100"
              >
                Agora não, obrigado
              </button>
            </div>

            {/* Footer warning */}
            <p className="text-[9px] text-slate-400 mt-4 text-center">
              Você também pode cadastrar seu aparelho a qualquer momento no rodapé da página.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
