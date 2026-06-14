import React, { useState, FormEvent } from 'react';
import { Lock, ShieldAlert, Key, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Doctor } from '../types';

interface DoctorForcePasswordChangeProps {
  doctor: Doctor;
  onChangePassword: (newPass: string) => Promise<void>;
  onLogout: () => void;
}

export default function DoctorForcePasswordChange({
  doctor,
  onChangePassword,
  onLogout
}: DoctorForcePasswordChangeProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres por segurança clínica.');
      return;
    }

    if (newPassword === 'abc123') {
      setError('A nova senha não pode ser a senha padrão "abc123". Crie uma senha forte.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas digitadas não são idênticas.');
      return;
    }

    setIsLoading(true);
    try {
      await onChangePassword(newPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-md space-y-8 bg-white p-8 shadow-md rounded-2xl border border-slate-200">
        <div className="text-center">
          <span className="inline-flex items-center justify-center rounded-xl bg-teal-50 p-3 text-teal-600 ring-4 ring-teal-50/50">
            <Lock className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-2xl font-extrabold text-slate-800 tracking-tight">
            Primeiro Acesso Médico
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Olá, Dr(a). <strong className="text-teal-700">{doctor.firstName} {doctor.lastName}</strong>.
          </p>
          <div className="mt-2 text-xs rounded-lg bg-teal-50/50 text-teal-800 p-2 border border-teal-100 flex items-center gap-1.5 justify-center">
            <ShieldAlert className="h-3.5 w-3.5 text-teal-600 shrink-0" />
            <span>CRM: {doctor.crm} • Usuário: {doctor.username}</span>
          </div>
          <p className="mt-3 text-xs text-slate-500 leading-relaxed">
            Seu perfil de profissional foi registrado com a senha padrão. Por motivos de segurança e sigilo de dados dos pacientes, você deve redefinir sua senha de acesso agora.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Nova Senha de Acesso
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Key className="h-4.5 w-4.5 text-slate-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ex mínimo de 6 dígitos"
                className="w-full rounded-xl border border-slate-200 pl-9 pr-10 py-3 text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition text-sm cursor-text"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Confirme a Nova Senha
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Key className="h-4.5 w-4.5 text-slate-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua nova senha"
                className="w-full rounded-xl border border-slate-200 pl-9 pr-10 py-3 text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition text-sm cursor-text"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-600 border border-rose-100 flex items-start gap-1.5 leading-relaxed">
              <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 py-3 text-sm font-bold text-white transition-colors cursor-pointer"
            >
              {isLoading ? 'Redefinindo Senha...' : 'Confirmar Nova Senha e Entrar'}
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-700 py-2 cursor-pointer font-medium"
            >
              Voltar ao Login do Consultório
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
