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
  Youtube,
  RefreshCw
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
  onChangePassword: (newPass: string) => Promise<void>;
  onAddLog: (data: Record<string, any>, notes: string) => void;
  onLogout: () => void;
  onSyncData?: () => Promise<void>;
}

export default function PatientDashboard({
  currentPatient,
  logs,
  medicationConfirmations,
  onConfirmMedication,
  onChangePassword,
  onAddLog,
  onLogout,
  onSyncData
}: PatientDashboardProps) {

  // Auto-sync from Database on mount & every 5 seconds in background
  React.useEffect(() => {
    if (onSyncData) {
      onSyncData().catch(err => console.warn("Initial sync failed", err));
      const interval = setInterval(() => {
        onSyncData().catch(err => console.warn("Background sync failed", err));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [onSyncData]);
  // Manual sync state
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    if (!onSyncData || isSyncing) return;
    setIsSyncing(true);
    try {
      await onSyncData();
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsSyncing(false), 900);
    }
  };

  // Password change states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  // Exam Upload States
  const [isDragActive, setIsDragActive] = useState(false);
  const [examSelected, setExamSelected] = useState<File | null>(null);
  const [examNotes, setExamNotes] = useState('');
  const [uploadingProgress, setUploadingProgress] = useState<number | null>(null);
  const [examSuccess, setExamSuccess] = useState(false);

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
    // Detect iOS and standalone status accurately
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isStandalone = (window.navigator as any).standalone === true || 
                         window.matchMedia('(display-mode: standalone)').matches;

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      if (isIOS && !isStandalone) {
        setPushError(
          '📱 No iPhone (iOS), é necessário instalar o portal na sua Tela de Início para liberar alertas de segundo plano: 1. Toque em Compartilhar (ícone com quadrado e seta) ➡️ 2. Selecione "Adicionar à Tela de Início" ➡️ 3. Abra o app por lá para ativar os alarmes.'
        );
      } else {
        // Fallback for standard inline/active browser notifications if PushManager is simply disabled or in preview environment
        if ('Notification' in window) {
          try {
            setIsSubscribing(true);
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
            if (permission === 'granted') {
              setSubscriptionSuccess(true);
              setPushError(null);
              setTimeout(() => {
                setSubscriptionSuccess(null);
                setShowPushModal(false);
              }, 3500);
              return;
            } else {
              setPushError('A permissão para alertas instantâneos foi recusada pelo navegador.');
            }
          } catch (e) {
            setPushError('Este navegador/dispositivo não oferece suporte para receber notificações em background.');
          } finally {
            setIsSubscribing(false);
          }
        } else {
          setPushError('Este dispositivo, navegador ou modo iFrame de teste não suporta notificações de bloqueio. Sugerimos usar o navegador Chrome ou Safari padrão do aparelho.');
        }
      }
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
  const isMigraine = currentPatient.diagnostic === 'Enxaqueca';

  const [formData, setFormData] = useState<Record<string, any>>(() => {
    // Initial fields preset values
    const initial: Record<string, any> = {};
    fields.forEach((f) => {
      if (f.type === 'scale') initial[f.id] = f.min !== undefined ? f.min : 5;
      else if (f.type === 'boolean') initial[f.id] = false;
      else if (f.type === 'select') initial[f.id] = f.options ? f.options[0] : '';
      else if (f.type === 'multiselect') initial[f.id] = [];
      else if (f.type === 'number') initial[f.id] = 0;
      else initial[f.id] = '';
    });
    return initial;
  });
  const [notes, setNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);



  const handlePasswordSubmit = async (e: FormEvent) => {
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

    setIsPasswordLoading(true);
    try {
      await onChangePassword(newPassword);
    } catch (err: any) {
      let friendlyError = 'Ocorreu um erro ao salvar sua nova senha no servidor.';
      if (err instanceof Error) {
        try {
          const detail = JSON.parse(err.message);
          if (detail.error) friendlyError = `Erro no banco: ${detail.error}`;
        } catch {
          friendlyError = err.message;
        }
      }
      setPasswordError(friendlyError);
    } finally {
      setIsPasswordLoading(false);
    }
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

  const handleExamSelected = (file: File) => {
    setExamSelected(file);
    setExamSuccess(false);
    setUploadingProgress(null);
    // Auto preset examNotes with name minus extension
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    setExamNotes(baseName);
  };

  const handleExamUpload = () => {
    if (!examSelected) return;
    
    setUploadingProgress(0);
    
    // Simulate upload progress
    let currentPrg = 0;
    const interval = setInterval(() => {
      currentPrg += Math.floor(Math.random() * 20) + 15;
      if (currentPrg >= 100) {
        currentPrg = 100;
        clearInterval(interval);
        
        // Log the exam upload into patient's logs so the doctor can view it!
        const logNotes = `📄 [EXAME ENVIADO] ${examSelected.name} (${(examSelected.size / 1024 / 1024).toFixed(2)} MB). Diagnóstico: ${currentPatient.diagnostic}. Obs: ${examNotes || 'Sem observações'}`;
        onAddLog({
          painScale: 0,
          triggers: 'Nenhum',
          medicationUsed: false,
          medName: ''
        }, logNotes);
        
        setExamSuccess(true);
        setExamSelected(null);
        setExamNotes('');
        setUploadingProgress(null);
      } else {
        setUploadingProgress(currentPrg);
      }
    }, 150);
  };

  // Get historical logs for this patient only
  const patientLogs = logs
    .filter((l) => l.patientId === currentPatient.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // FORCE PASSWORD CHANGE ON FIRST ACCESS
  if (false && currentPatient.requiresPasswordChange) {
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
              disabled={isPasswordLoading}
              className="w-full flex justify-center rounded-xl bg-teal-600 disabled:bg-slate-300 py-3 px-4 text-sm font-semibold text-white hover:bg-teal-700 transition shadow-md shadow-teal-600/10 cursor-pointer"
            >
              {isPasswordLoading ? 'Gravando Nova Senha...' : 'Definir Nova Senha & Começar'}
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
              {onSyncData && (
                <button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 text-xs font-semibold text-teal-700 transition disabled:opacity-60 cursor-pointer animate-pulse"
                  title="Atualizar dados da sessão do paciente em tempo real"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                  {isSyncing ? "Atualizando..." : "Atualizar Sessão"}
                </button>
              )}
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
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <Clock className="h-4.5 w-4.5 text-teal-600" />
                💊 Cronograma de Medicamentos Diários
              </h3>
            </div>
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
        <div className={isMigraine ? "grid grid-cols-1 lg:grid-cols-12 gap-8" : "max-w-3xl mx-auto"}>

          {/* Column 1: Daily Evolution Form (lg:col-span-6) */}
          {isMigraine && (
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

                    {f.type === 'multiselect' && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {f.options?.map((opt) => {
                          const currentVal = Array.isArray(formData[f.id]) ? formData[f.id] : [];
                          const isSelected = currentVal.includes(opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                const updatedList = isSelected
                                  ? currentVal.filter((item: string) => item !== opt)
                                  : [...currentVal, opt];
                                handleFieldChange(f.id, updatedList);
                              }}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition duration-150 ${
                                isSelected
                                  ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-sm'
                                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-350 hover:bg-slate-50'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
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
          )}

          {/* Column 2: Study Material & Guidelines (lg:col-span-6) */}
          <div className={`${isMigraine ? 'lg:col-span-6' : 'w-full'} space-y-6`}>

            {/* Atendimento & Envio de Exames */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
              <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2 text-sm">
                <Heart className="h-4.5 w-4.5 text-teal-600" />
                💬 Secretaria & Envio de Exames
              </h3>

              {/* Botão de WhatsApp */}
              <div className="space-y-2">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Precisa falar com nossa recepcionista ou reagendar sua consulta? Entre em contato diretamente pelo WhatsApp:
                </p>
                <a
                  href="https://wa.me/5511999999999?text=Olá,%20falo%20do%20Portal%20do%20Paciente%20do%20Instituto%20Diego%20Dorim."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold py-3 px-4 transition-all duration-200 shadow-md shadow-emerald-600/10 cursor-pointer"
                >
                  <svg className="h-4.5 w-4.5 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M12.004 0C5.372 0 0 5.373 0 12.011a11.91 11.91 0 0 0 1.621 5.952l-1.724 6.29 6.438-1.688a11.91 11.91 0 0 0 5.673 1.442h.005c6.627 0 12-5.377 12-12.015C24 5.373 18.628 0 12.004 0zm6.914 17.151c-.269.756-1.571 1.487-2.164 1.579-.593.093-1.187.143-3.411-.782-2.839-1.182-4.664-4.08-4.806-4.269-.142-.189-1.221-1.627-1.221-3.111 0-1.485.762-2.214 1.033-2.518.271-.303.593-.38.791-.38.198 0 .396.006.569.014.18.008.421-.069.658.504.240.58.818 1.996.889 2.14.072.143.12.311.025.503-.095.19-.142.304-.284.471-.142.168-.299.376-.427.505-.143.143-.293.299-.126.586.167.287.744 1.233 1.597 1.991.898.797 1.657 1.042 1.892 1.157.235.115.372.097.51-.06.136-.157.593-.69.751-.925.158-.235.316-.197.534-.117.218.081 1.385.655 1.623.774.238.118.396.177.456.28.06.103.06.593-.209 1.349z"/>
                  </svg>
                  Falar com o Consultório no WhatsApp
                </a>
              </div>

              <hr className="border-slate-100" />

              {/* Seção Interactiva de Envio de Exames */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-teal-50 text-teal-600 shrink-0">
                    <FileText className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Enviar Resultados de Exames</h4>
                    <p className="text-[10px] text-slate-400">Envie laudos de ressonância ou exames de laboratório</p>
                  </div>
                </div>

                {/* Drag and drop selection container */}
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
                  onDragLeave={() => setIsDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragActive(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleExamSelected(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
                    isDragActive 
                      ? 'border-teal-500 bg-teal-50/20' 
                      : examSelected 
                      ? 'border-emerald-300 bg-emerald-50/10'
                      : 'border-slate-200 hover:border-teal-400 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                  onClick={() => document.getElementById('exam-input')?.click()}
                >
                  <input 
                    type="file" 
                    id="exam-input" 
                    className="hidden" 
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleExamSelected(e.target.files[0]);
                      }
                    }}
                  />
                  {!examSelected ? (
                    <div className="space-y-1.5">
                      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-700">Arrastar exame aqui ou clique para selecionar</p>
                      <p className="text-[9px] text-slate-400">PDF, PNG ou JPG de até 15MB</p>
                    </div>
                  ) : (
                    <div className="space-y-2 text-left">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded bg-emerald-100 text-emerald-700 shrink-0">
                          <CheckCircle className="h-4.5 w-4.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 truncate">{examSelected.name}</p>
                          <p className="text-[9px] text-slate-400">{(examSelected.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); setExamSelected(null); }}
                          className="text-xs text-rose-500 hover:text-rose-700 font-bold px-1 cursor-pointer"
                        >
                          Remover
                        </button>
                      </div>

                      {/* Informative text field for exam observations */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Observações do Exame</label>
                        <input
                          type="text"
                          className="w-full text-xs rounded-lg border border-slate-200 px-2 py-1.5 bg-white text-slate-800 placeholder-slate-400 cursor-text"
                          onClick={(e) => e.stopPropagation()}
                          value={examNotes}
                          onChange={(e) => setExamNotes(e.target.value)}
                          placeholder="Ex: Laudo RM Crânio 12/2025"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload Status / Action Button */}
                {examSelected && (
                  <div className="space-y-2">
                    {uploadingProgress !== null ? (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 font-mono">
                          <span>{uploadingProgress < 100 ? 'Transmitindo exame...' : 'Segurança verificada!'}</span>
                          <span>{uploadingProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-teal-600 h-1.5 rounded-full transition-all duration-150"
                            style={{ width: `${uploadingProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleExamUpload}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold py-2.5 px-4 cursor-pointer"
                      >
                        Enviar Exame Selecionado
                      </button>
                    )}
                  </div>
                )}

                {examSuccess && (
                  <div className="rounded-xl bg-emerald-50 p-3.5 border border-emerald-100 flex items-start gap-2 animate-fade-in animate-duration-150">
                    <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-800">Uploader Seguro Integrado</h4>
                      <p className="text-[10px] text-slate-600 leading-relaxed mt-0.5">
                        Exame enviado e arquivado com sucesso no seu prontuário clínico. Dr. Diego Dorim foi notificado na sala interna.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* YouTube Material */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                  <Youtube className="h-4.5 w-4.5 text-rose-600" />
                  🎥 Material de Estudo do Instituto
                </h3>
                <a
                  href="https://www.youtube.com/@InstitutoDiegoDorim"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-rose-600 hover:text-rose-700 font-bold text-[11px] transition"
                >
                  Canal Oficial no YouTube <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              {/* Videos tabs state management */}
              {(() => {
                const [activeStudyTab, setActiveStudyTab] = useState<'patient' | 'companion'>('patient');
                const allVideos = carePlan?.videos || [];
                const patientVideos = allVideos.filter(v => v.audience === 'patient' || !v.audience);
                const companionVideos = allVideos.filter(v => v.audience === 'companion');

                return (
                  <div className="space-y-4">
                    {/* Tab Selectors */}
                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-1 border border-slate-150">
                      <button
                        type="button"
                        onClick={() => setActiveStudyTab('patient')}
                        className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all duration-200 cursor-pointer ${
                          activeStudyTab === 'patient'
                            ? 'bg-white text-teal-800 shadow-sm border border-slate-100'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <User className="h-4 w-4" />
                        Sessão do Paciente ({patientVideos.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveStudyTab('companion')}
                        className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all duration-200 cursor-pointer ${
                          activeStudyTab === 'companion'
                            ? 'bg-white text-teal-800 shadow-sm border border-slate-100'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Heart className="h-4 w-4" />
                        Sessão do Acompanhante ({companionVideos.length})
                      </button>
                    </div>

                    {/* Explanatory subtitle */}
                    <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      {activeStudyTab === 'patient' ? (
                        <p>
                          <strong>Vídeos Essenciais de Autocuidado:</strong> Exercícios, deparação técnica, explicações de sintomas e rotinas diárias guiadas para potencializar sua evolução individual.
                        </p>
                      ) : (
                        <p>
                          <strong>Educação para Familiares, Cuidadores e Parceiros:</strong> Guias de segurança, ergonomia de transferências em casa, primeiros socorros de crises e modulação comportamental segura.
                        </p>
                      )}
                    </div>

                    {/* Video list render */}
                    <div className="space-y-3">
                      {(activeStudyTab === 'patient' ? patientVideos : companionVideos).length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/30 p-6 text-center">
                          <Video className="h-8 w-8 text-slate-350 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-700">Canal Geral de Exercícios</p>
                          <p className="text-[11px] text-slate-400 mt-1 max-w-[280px] mx-auto">
                            Consulte nosso canal geral do YouTube para tutoriais e vídeos complementares adicionais.
                          </p>
                        </div>
                      ) : (
                        (activeStudyTab === 'patient' ? patientVideos : companionVideos).map((video) => (
                          <div
                            key={video.id}
                            className="group flex flex-col md:flex-row gap-4.5 rounded-xl border border-slate-150 bg-white p-3.5 hover:border-teal-200 hover:shadow-xs transition-all duration-200"
                          >
                            {/* Video Thumbnail */}
                            <div className="relative w-full md:w-36 h-24 rounded-lg overflow-hidden bg-slate-100 shrink-0 shadow-xs border border-slate-100">
                              <img
                                src={video.thumbnailUrl}
                                referrerPolicy="no-referrer"
                                alt={video.title}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/25 flex items-center justify-center transition-all">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-rose-600 shadow-md group-hover:scale-110 transition duration-200">
                                  <Play className="h-3 w-3 fill-rose-600 stroke-none ml-0.5" />
                                </div>
                              </div>
                              <span className="absolute bottom-1 right-1 bg-slate-900/80 px-1.5 py-0.5 rounded text-[8px] font-bold font-mono text-white">
                                {video.duration}
                              </span>
                            </div>

                            {/* Video details text */}
                            <div className="flex flex-col justify-between flex-1 min-w-0 space-y-1.5">
                              <div>
                                <h4 className="text-[12px] font-extrabold text-slate-800 leading-snug group-hover:text-teal-700 transition">
                                  {video.title}
                                </h4>
                                <p className="text-[11px] text-slate-500 leading-relaxed mt-1 line-clamp-2">
                                  {video.description}
                                </p>
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-sm">
                                  {activeStudyTab === 'patient' ? '👤 Paciente' : '👥 Acompanhante / Familiar'}
                                </span>
                                <a
                                  href={video.youtubeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-bold text-[10px] transition cursor-pointer"
                                >
                                  Assistir Vídeo <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })()}
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
