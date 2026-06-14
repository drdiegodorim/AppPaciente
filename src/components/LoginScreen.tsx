import React, { useState, useEffect, FormEvent } from 'react';
import { Shield, User, Key, Check, Info, Mail, ArrowLeft, Smartphone, Download, Share2, PlusSquare } from 'lucide-react';
import { Patient, Doctor } from '../types';

interface LoginScreenProps {
  onLogin: (username: string, role: 'doctor' | 'patient', customPassword?: string) => string | null;
  patients: Patient[];
  onRegisterDoctor: (firstName: string, lastName: string, email: string, crm: string) => Promise<Doctor>;
}

export default function LoginScreen({ onLogin, patients, onRegisterDoctor }: LoginScreenProps) {
  const [role, setRole] = useState<'doctor' | 'patient'>('patient');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Doctor registration states
  const [isRegisteringDoctor, setIsRegisteringDoctor] = useState(false);
  const [docFirstName, setDocFirstName] = useState('');
  const [docLastName, setDocLastName] = useState('');
  const [docEmail, setDocEmail] = useState('');
  const [docCRM, setDocCRM] = useState('');
  const [docRegError, setDocRegError] = useState<string | null>(null);
  const [docRegSuccess, setDocRegSuccess] = useState<boolean>(false);
  const [registeredDocUsername, setRegisteredDocUsername] = useState('');
  const [isRegisteringLoading, setIsRegisteringLoading] = useState(false);

  // PWA Install states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showHowToInstall, setShowHowToInstall] = useState(false);

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

    // Try to login
    const targetUsername = role === 'doctor' ? username.trim() : username.trim().toLowerCase();
    const loginError = onLogin(targetUsername, role, password);
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
    setUsername('medico.care');
    setPassword('senha123');
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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-md space-y-8">
        <div>
          {/* Clinical Header Accent */}
          <div className="flex justify-center">
            <span className="inline-flex items-center justify-center rounded-xl bg-teal-50 p-3 text-teal-600 ring-4 ring-teal-50/50">
              <Shield className="h-8 w-8" />
            </span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-800">
            Instituto Diego Dorim
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">
            Acompanhamento Clínico & Plano de Cuidado Individualizado
          </p>
        </div>

        {/* Role Toggle Selector */}
        {!isRegisteringDoctor && (
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => { setRole('patient'); setError(null); }}
              className={`flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-all duration-200 ${
                role === 'patient'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <User className="h-4 w-4" />
              Acesso Paciente
            </button>
            <button
              type="button"
              onClick={() => { setRole('doctor'); setError(null); }}
              className={`flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-all duration-200 ${
                role === 'doctor'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Shield className="h-4 w-4" />
              Acesso Médico
            </button>
          </div>
        )}

        <div className="bg-white px-8 py-8 shadow-md rounded-2xl border border-slate-100">
          {/* 1. Doctor Registration Form */}
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
            /* 2. Login Form (Doctor & Patient) */
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="username" className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {role === 'doctor' ? 'Usuário Médico' : 'Nome de Usuário (nome.sobrenome)'}
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
                    className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500 sm:text-sm cursor-text"
                    placeholder={role === 'doctor' ? 'Ex: medico.care' : 'Ex: ana.silva'}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Senha
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
                    className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500 sm:text-sm cursor-text"
                    placeholder="Selecione ou digite sua senha"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-600 border border-rose-100 flex items-start gap-2">
                  <span className="inline-block mt-0.5 rounded-full bg-rose-200 p-0.5 text-rose-800">⚠️</span>
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-3 pt-1">
                <button
                  type="submit"
                  className="flex w-full justify-center rounded-xl bg-teal-600 py-3 px-4 text-sm font-semibold text-white hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-md shadow-teal-600/10 cursor-pointer"
                >
                  Entrar no Consultório
                </button>

                {role === 'doctor' && (
                  <div className="text-center pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => { setIsRegisteringDoctor(true); setDocRegError(null); }}
                      className="text-xs font-semibold text-teal-600 hover:text-teal-700 underline cursor-pointer"
                    >
                      Não tem cadastro médico? Registre-se aqui
                    </button>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        {/* PWA Installation Assistant Card */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-md p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-teal-50 p-2 text-teal-600 shrink-0">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-sm">Instalar Aplicativo de Saúde</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Adicione o Portal do Paciente à tela inicial do seu celular para receber lembretes imediatos e abrir sem usar o navegador.
              </p>
            </div>
          </div>

          {isInstalled ? (
            <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-100 text-center flex items-center justify-center gap-2 text-xs font-semibold text-emerald-800">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Você já está usando o aplicativo instalado (PWA) no celular!</span>
            </div>
          ) : (
            <>
              {deferredPrompt ? (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 py-3 text-xs font-bold text-white transition shadow-md shadow-teal-600/15 cursor-pointer animate-pulse"
                >
                  <Download className="h-4 w-4" />
                  Instalar Aplicativo (Adicionar à Tela Principal)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowHowToInstall(!showHowToInstall)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 py-2.5 text-xs font-semibold text-slate-700 transition cursor-pointer"
                >
                  <Smartphone className="h-4 w-4 text-slate-500" />
                  {showHowToInstall ? 'Ocultar caminho de instalação' : 'Como Adicionar na Tela Inicial do Celular?'}
                </button>
              )}

              {/* Guided Tutorial Instructions */}
              {showHowToInstall && (
                <div className="mt-2 border-t border-slate-100 pt-3 space-y-3.5 text-xs text-slate-600 leading-relaxed">
                  <div className="space-y-1.5">
                    <p className="font-bold text-teal-800 flex items-center gap-1.5">
                      <span className="text-base">📱</span> no iPhone (Navegador Safari):
                    </p>
                    <ol className="list-decimal pl-4.5 space-y-1 text-slate-500">
                      <li>Abra este site utilizando o navegador original <strong className="text-slate-700">Safari</strong>.</li>
                      <li>Toque no botão de <strong className="text-teal-700">Compartilhar</strong> <Share2 className="inline h-3.5 w-3.5 mx-0.5 text-teal-600 pointer-events-none" /> (retângulo com seta para cima no rodapé).</li>
                      <li>Role as opções para baixo e toque em <strong className="text-teal-700">"Adicionar à Tela de Início"</strong> <PlusSquare className="inline h-3.5 w-3.5 mx-0.5 text-teal-600 pointer-events-none" />.</li>
                      <li>Toque em <strong className="text-teal-700">"Adicionar"</strong> no canto superior direito. Pronto!</li>
                    </ol>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-dashed border-slate-100">
                    <p className="font-bold text-teal-800 flex items-center gap-1.5">
                      <span className="text-base">🤖</span> no Android (Navegador Google Chrome):
                    </p>
                    <ol className="list-decimal pl-4.5 space-y-1 text-slate-500">
                      <li>Abra este site no <strong className="text-slate-700">Google Chrome</strong>.</li>
                      <li>Toque nos <strong className="text-slate-700">três pontinhos</strong> no canto superior direito.</li>
                      <li>Selecione a opção <strong className="text-teal-700">"Instalar aplicativo"</strong> ou <strong className="text-teal-700">"Adicionar à tela inicial"</strong>.</li>
                      <li>Confirme a instalação e o app estará pronto no menu principal.</li>
                    </ol>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
