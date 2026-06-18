import React, { useState, useEffect, FormEvent } from 'react';
import { Shield, User, Key, Check, Info, Mail, ArrowLeft, Smartphone, Download, Share2, PlusSquare, Database, Copy, RefreshCw } from 'lucide-react';
import { Patient, Doctor } from '../types';
import { SupabaseSchemaStatus } from '../lib/supabase';

interface LoginScreenProps {
  onLogin: (username: string, role?: 'doctor' | 'patient', customPassword?: string) => string | null;
  patients: Patient[];
  onRegisterDoctor: (firstName: string, lastName: string, email: string, crm: string) => Promise<Doctor>;
  supabaseStatus: SupabaseSchemaStatus;
  onSyncData?: () => Promise<void>;
}

export default function LoginScreen({ onLogin, patients, onRegisterDoctor, supabaseStatus, onSyncData }: LoginScreenProps) {
  const [role, setRole] = useState<'doctor' | 'patient'>('patient');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Doctor registration states
  const [isRegisteringDoctor, setIsRegisteringDoctor] = useState(false);
  const [isSyncingData, setIsSyncingData] = useState(false);
  const [docFirstName, setDocFirstName] = useState('');
  const [docLastName, setDocLastName] = useState('');
  const [docEmail, setDocEmail] = useState('');
  const [docCRM, setDocCRM] = useState('');
  const [docRegError, setDocRegError] = useState<string | null>(null);
  const [docRegSuccess, setDocRegSuccess] = useState<boolean>(false);
  const [registeredDocUsername, setRegisteredDocUsername] = useState('');
  const [isRegisteringLoading, setIsRegisteringLoading] = useState(false);

  const handleSyncClick = async () => {
    if (!onSyncData || isSyncingData) return;
    setIsSyncingData(true);
    try {
      await onSyncData();
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsSyncingData(false), 900);
    }
  };

  // PWA Install states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showHowToInstall, setShowHowToInstall] = useState(false);

  // Supabase connection assistance states
  const [showSqlSetup, setShowSqlSetup] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    // Check if app is already running as an installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      setShowHowToInstall(!showHowToInstall);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Por favor, informe seu nome de usuário.');
      return;
    }
    if (!password) {
      setError('Por favor, insira sua senha.');
      return;
    }

    // Try to login using unified lowercased username
    const targetUsername = username.trim().toLowerCase();
    const loginError = onLogin(targetUsername, undefined, password);
    if (loginError) {
      setError(loginError);
    }
  };

  const handleDoctorRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setDocRegError(null);

    if (!docFirstName.trim()) {
      setDocRegError('Por favor, digite o nome do médico.');
      return;
    }
    if (!docLastName.trim()) {
      setDocRegError('Por favor, digite o sobrenome do médico.');
      return;
    }
    if (!docEmail.trim()) {
      setDocRegError('Por favor, digite o e-mail corporativo ou pessoal.');
      return;
    }
    if (!docCRM.trim()) {
      setDocRegError('Por favor, preencha o CRM com o estado (ex: 123456-SP).');
      return;
    }

    setIsRegisteringLoading(true);
    try {
      const newDoc = await onRegisterDoctor(
        docFirstName,
        docLastName,
        docEmail,
        docCRM
      );
      setRegisteredDocUsername(newDoc.username);
      setDocRegSuccess(true);
      // reset form
      setDocFirstName('');
      setDocLastName('');
      setDocEmail('');
      setDocCRM('');
    } catch (err) {
      setDocRegError(err instanceof Error ? err.message : 'Falha ao registrar médico no banco.');
    } finally {
      setIsRegisteringLoading(false);
    }
  };

  const selectDoctorPreset = () => {
    setRole('doctor');
    setIsRegisteringDoctor(false);
    setUsername('diego.dorim');
    setPassword('#Ddrd0408!');
    setError(null);
  };

  const selectPatientPreset = (user: string, pass: string) => {
    setRole('patient');
    setIsRegisteringDoctor(false);
    setUsername(user);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl border border-slate-150 p-6 sm:p-8 space-y-6">
        <div>
          {/* Clinical Header Accent */}
          <div className="flex justify-center">
            <span className="inline-flex items-center justify-center rounded-2xl bg-teal-50 p-3 text-teal-600 ring-4 ring-teal-50/50">
              <Shield className="h-8 w-8" />
            </span>
          </div>
          <h2 className="mt-4 text-center text-2xl font-extrabold tracking-tight text-slate-800">
            Instituto Diego Dorim
          </h2>
          <p className="mt-1.5 text-center text-xs text-slate-500 max-w-xs mx-auto">
            Acompanhamento Clínico & Plano de Cuidado Individualizado
          </p>
        </div>

        {/* Form Container (Login or Register) */}
        {isRegisteringDoctor ? (
          <div className="space-y-6">
            {docRegSuccess ? (
              <div className="rounded-xl bg-emerald-50 p-5 border border-emerald-100 text-center space-y-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xl font-bold">
                  ✓
                </span>
                <div>
                  <h3 className="font-bold text-emerald-950 text-sm">Cadastro Médico Concluído!</h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Seu usuário de acesso é: <strong className="text-teal-700 font-mono text-sm">{registeredDocUsername}</strong>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    Efetue o login utilizando a senha padrão: <strong className="font-mono text-teal-700">abc123</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisteringDoctor(false);
                    setRole('doctor');
                    setUsername(registeredDocUsername);
                    setPassword('abc123');
                    setDocRegSuccess(false);
                  }}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-md shadow-teal-600/10"
                >
                  Auto-Preencher e Fazer Login
                </button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleDoctorRegisterSubmit}>
                <div className="flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-2">
                  <button
                    type="button"
                    onClick={() => { setIsRegisteringDoctor(false); setDocRegError(null); }}
                    className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <h3 className="font-bold text-sm text-slate-700">Cadastro de Novo Médico</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Nome
                    </label>
                    <input
                      type="text"
                      required
                      value={docFirstName}
                      onChange={(e) => setDocFirstName(e.target.value)}
                      placeholder="Ex: Diego"
                      className="mt-1 block w-full rounded-xl border border-slate-200 py-2.5 px-3 text-slate-800 placeholder-slate-400 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-xs cursor-text"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Sobrenome
                    </label>
                    <input
                      type="text"
                      required
                      value={docLastName}
                      onChange={(e) => setDocLastName(e.target.value)}
                      placeholder="Ex: Dorim"
                      className="mt-1 block w-full rounded-xl border border-slate-200 py-2.5 px-3 text-slate-800 placeholder-slate-400 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-xs cursor-text"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    E-mail Profissional
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={docEmail}
                      onChange={(e) => setDocEmail(e.target.value)}
                      placeholder="Ex: diego@consultorio.com"
                      className="block w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-slate-800 placeholder-slate-400 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-xs cursor-text"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    CRM com Estado
                  </label>
                  <input
                    type="text"
                    required
                    value={docCRM}
                    onChange={(e) => setDocCRM(e.target.value)}
                    placeholder="Ex: 123456-SP"
                    className="mt-1 block w-full rounded-xl border border-slate-200 py-2.5 px-3 text-slate-800 placeholder-slate-400 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-xs cursor-text"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Senha Inicial Provisória
                  </label>
                  <input
                    type="text"
                    disabled
                    value="abc123"
                    className="mt-1 block w-full rounded-xl border border-slate-200 py-2.5 px-3 bg-slate-50 text-slate-500 text-xs font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Usuário gerado automaticamente: <strong className="font-semibold text-teal-600">nome.sobrenome</strong>
                  </p>
                </div>

                {docRegError && (
                  <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-600 border border-rose-100 flex items-start gap-1.5 leading-relaxed">
                    <span>⚠️</span>
                    <p>{docRegError}</p>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isRegisteringLoading}
                    className="w-full flex justify-center items-center rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 py-3 text-xs font-bold text-white transition-colors cursor-pointer shadow-md shadow-teal-600/10"
                  >
                    {isRegisteringLoading ? 'Registrando no Banco...' : 'Cadastrar Médico'}
                  </button>
                </div>

                <div className="text-center pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsRegisteringDoctor(false)}
                    className="text-xs font-semibold text-teal-600 hover:text-teal-700 underline cursor-pointer"
                  >
                    Voltar para Tela de Login
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Nome de Usuário (médico ou paciente)
              </label>
              <div className="relative mt-2 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="username"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500 sm:text-xs cursor-text"
                  placeholder="Ex: diego.dorim ou ana.silva"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Senha de Segurança
                </label>
              </div>
              <div className="relative mt-2 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Key className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500 sm:text-xs cursor-text"
                  placeholder="Digite sua senha de acesso"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-600 border border-rose-100 flex items-start gap-2">
                <span className="inline-block mt-0.5 rounded-full bg-rose-200 p-0.5 text-rose-850">⚠️</span>
                <p className="leading-relaxed">{error}</p>
              </div>
            )}

            <div className="pt-1">
              <button
                type="submit"
                className="flex w-full justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 px-4 text-xs font-bold text-white transition-all shadow-md shadow-emerald-600/10 cursor-pointer active:scale-[0.99] hover:shadow-lg"
              >
                Entrar no Consultório
              </button>
            </div>

            {onSyncData && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Deseja atualizar dados de acesso?</span>
                <button
                  type="button"
                  onClick={handleSyncClick}
                  disabled={isSyncingData}
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold text-teal-600 hover:text-teal-700 disabled:opacity-55 cursor-pointer"
                >
                  <RefreshCw className={`h-3 w-3 ${isSyncingData ? "animate-spin" : ""}`} />
                  {isSyncingData ? "Atualizando..." : "Sincronizar Contas"}
                </button>
              </div>
            )}
          </form>
        )}

        {/* Unified Expandables Panel inside the single card to prevent splitting into multiple cards */}
        <div className="border-t border-slate-100 pt-4 space-y-3.5">
          {/* PWA Section */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Smartphone className="h-4 w-4 text-slate-400" />
              Aplicativo PWA:
            </span>
            {isInstalled ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                <Check className="h-3.5 w-3.5 stroke-[2.5]" /> Instalado
              </span>
            ) : deferredPrompt ? (
              <button
                type="button"
                onClick={handleInstallClick}
                className="text-teal-600 hover:text-teal-700 font-bold underline flex items-center gap-1 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" /> Instalar no Celular
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowHowToInstall(!showHowToInstall);
                  setShowSqlSetup(false);
                }}
                className="text-slate-500 hover:text-teal-600 font-bold transition flex items-center gap-0.5 cursor-pointer"
              >
                {showHowToInstall ? 'Ocultar Tutorial' : 'Como adicionar à tela inicial?'}
              </button>
            )}
          </div>

          {showHowToInstall && !isInstalled && (
            <div className="bg-slate-50 rounded-xl p-3 text-[11px] text-slate-600 leading-relaxed border border-slate-100 space-y-2.5 animate-fade-in">
              <div className="space-y-1">
                <p className="font-bold text-teal-800 flex items-center gap-1">
                  <span>📱</span> no iPhone (Navegador Safari):
                </p>
                <ol className="list-decimal pl-4.5 space-y-0.5 text-slate-500">
                  <li>Abra este site no <strong className="text-slate-705">Safari</strong>.</li>
                  <li>Toque no ícone de <strong className="text-teal-700">Compartilhar</strong> <Share2 className="inline h-3 w-3 text-teal-600" />.</li>
                  <li>Role e selecione <strong className="text-teal-700">"Adicionar à Tela de Início"</strong>.</li>
                </ol>
              </div>
              <div className="space-y-1 border-t border-dashed border-slate-200 pt-2">
                <p className="font-bold text-teal-800 flex items-center gap-1">
                  <span>🤖</span> no Android (Google Chrome):
                </p>
                <ol className="list-decimal pl-4.5 space-y-0.5 text-slate-500">
                  <li>Toque nos <strong className="text-slate-705">três pontinhos</strong> no canto superior.</li>
                  <li>Selecione <strong className="text-teal-700">"Instalar aplicativo"</strong> ou <strong className="text-teal-700">"Adicionar à tela inicial"</strong>.</li>
                </ol>
              </div>
            </div>
          )}

          {/* Supabase Status Section */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Database className="h-4 w-4 text-slate-400" />
              Banco de Dados:
            </span>
            {supabaseStatus.connected && !supabaseStatus.tablesMissing ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                Sincronizado 🟢
              </span>
            ) : supabaseStatus.tablesMissing ? (
              <button
                type="button"
                onClick={() => {
                  setShowSqlSetup(!showSqlSetup);
                  setShowHowToInstall(false);
                }}
                className="text-amber-600 hover:text-amber-700 font-bold flex items-center gap-0.5 cursor-pointer"
              >
                Tabelas Ausentes ⚠️ {showSqlSetup ? '(Ocultar)' : '(Configurar)'}
              </button>
            ) : (
              <span className="text-slate-400">Conectando... ⚙️</span>
            )}
          </div>

          {showSqlSetup && (!supabaseStatus.connected || supabaseStatus.tablesMissing) && (
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2 text-[11px] text-slate-600 animate-fade-in max-h-64 overflow-y-auto">
              <p className="font-semibold text-slate-700">Siga as instruções para configurar o Supabase:</p>
              <ol className="list-decimal pl-4 space-y-0.5 text-slate-500">
                <li>Vá em <strong className="text-teal-700">SQL Editor</strong> no Supabase.</li>
                <li>Abra uma nova consulta ("New Query").</li>
                <li>Cole o script abaixo e rode ("Run").</li>
              </ol>
              <div className="flex items-center justify-between border-t border-slate-150 pt-2 mt-1">
                <span className="font-mono text-[9px] text-slate-400">Query SQL</span>
                <button
                  type="button"
                  onClick={() => {
                    const sql = `CREATE TABLE IF NOT EXISTS credentials (
  username text PRIMARY KEY,
  password text NOT NULL
);

CREATE TABLE IF NOT EXISTS doctors (
  id text PRIMARY KEY,
  first_name text NOT NULL,
  last_name text NOT NULL,
  username text NOT NULL UNIQUE,
  email text NOT NULL,
  crm text NOT NULL,
  requires_password_change boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS patients (
  id text PRIMARY KEY,
  first_name text NOT NULL,
  last_name text NOT NULL,
  username text NOT NULL UNIQUE,
  diagnostic text NOT NULL,
  requires_password_change boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  medications jsonb DEFAULT '[]'::jsonb,
  treatment_plan jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS logs (
  id text PRIMARY KEY,
  patient_id text NOT NULL,
  diagnostic text NOT NULL,
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text
);

CREATE TABLE IF NOT EXISTS medication_confirmations (
  id text PRIMARY KEY,
  patient_id text NOT NULL,
  medication_id text NOT NULL,
  medication_name text NOT NULL,
  dosage text NOT NULL,
  prescribed_time text NOT NULL,
  confirmed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);`;
                    navigator.clipboard.writeText(sql);
                    setCopiedSql(true);
                    setTimeout(() => setCopiedSql(false), 2000);
                  }}
                  className="font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copiedSql ? 'Copiado! ✓' : 'Copiar Script SQL'}
                </button>
              </div>
              <pre className="p-2 bg-slate-900 text-slate-300 rounded font-mono text-[9px] overflow-x-auto max-h-36">
{`CREATE TABLE IF NOT EXISTS credentials (
  username text PRIMARY KEY,
  password text NOT NULL
);

CREATE TABLE IF NOT EXISTS doctors (
  id text PRIMARY KEY,
  first_name text NOT NULL,
  last_name text NOT NULL,
  username text NOT NULL UNIQUE,
  email text NOT NULL,
  crm text NOT NULL,
  requires_password_change boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS patients (
  id text PRIMARY KEY,
  first_name text NOT NULL,
  last_name text NOT NULL,
  username text NOT NULL UNIQUE,
  diagnostic text NOT NULL,
  requires_password_change boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  medications jsonb DEFAULT '[]'::jsonb,
  treatment_plan jsonb DEFAULT '{}'::jsonb
);`}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
