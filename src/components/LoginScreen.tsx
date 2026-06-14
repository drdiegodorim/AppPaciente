import React, { useState, FormEvent } from 'react';
import { Shield, User, Key, Check, Info } from 'lucide-react';
import { Patient } from '../types';

interface LoginScreenProps {
  onLogin: (username: string, role: 'doctor' | 'patient', customPassword?: string) => string | null;
  patients: Patient[];
}

export default function LoginScreen({ onLogin, patients }: LoginScreenProps) {
  const [role, setRole] = useState<'doctor' | 'patient'>('patient');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

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

  const selectDoctorPreset = () => {
    setRole('doctor');
    setUsername('medico.care');
    setPassword('senha123');
    setError(null);
  };

  const selectPatientPreset = (user: string, pass: string) => {
    setRole('patient');
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

        <div className="bg-white px-8 py-8 shadow-md rounded-2xl border border-slate-100">
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
                  className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500 sm:text-sm"
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
                  className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500 sm:text-sm"
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

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-xl bg-teal-600 py-3 px-4 text-sm font-semibold text-white hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-md shadow-teal-600/10"
              >
                Entrar no Consultório
              </button>
            </div>
          </form>
        </div>

        {/* Demo Fast Sandbox Accents - Helps evaluate different profiles very easily */}
        <div className="rounded-2xl border border-slate-200 bg-emerald-50/50 p-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
            <Info className="h-4 w-4 text-emerald-600" />
            <span>Sandbox de Teste Rápido (Login Direto)</span>
          </div>
          <p className="text-xs text-slate-500">
            Utilize os cartões abaixo para simular perfis cadastrados instantaneamente, sem precisar preencher dados:
          </p>

          <div className="space-y-3.5">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Perfil Profissional</p>
              <button
                type="button"
                onClick={selectDoctorPreset}
                className="w-full flex items-center justify-between text-left rounded-xl bg-white border border-slate-200 hover:border-teal-400 p-2.5 transition group"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-700">Dr. Diego Dorim (Médico)</h4>
                  <p className="text-[10px] text-slate-400">Poderá cadastrar novos pacientes e ver a evolução deles.</p>
                </div>
                <span className="text-[11px] font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded group-hover:bg-teal-100">
                  Acessar
                </span>
              </button>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Perfis de Pacientes Modelos</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {patients.map((pat) => (
                  <button
                    key={pat.id}
                    type="button"
                    onClick={() => selectPatientPreset(pat.username, pat.requiresPasswordChange ? 'abc123' : 'senha123')}
                    className="flex flex-col justify-between rounded-xl bg-white border border-slate-200 hover:border-teal-400 p-2 text-left transition group"
                  >
                    <div className="w-full">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-slate-700 truncate block max-w-[120px]">
                          {pat.firstName} {pat.lastName}
                        </span>
                        {pat.requiresPasswordChange ? (
                          <span className="text-[8px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 px-1 rounded">
                            Nova Senha IP
                          </span>
                        ) : (
                          <span className="text-[8px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 px-1 rounded">
                            Ativo
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Diag: <strong className="text-slate-600">{pat.diagnostic}</strong></p>
                      <p className="text-[9px] font-mono text-slate-400">user: {pat.username}</p>
                      <p className="text-[9px] font-mono text-slate-400">
                        pass: {pat.requiresPasswordChange ? 'abc123' : 'senha123'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
