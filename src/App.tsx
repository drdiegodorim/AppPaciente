import { useState, useEffect } from 'react';
import { Patient, TrackingEntry, UserSession, DiagnosticType, MedicationPrescription, MedicationConfirmation } from './types';
import LoginScreen from './components/LoginScreen';
import DoctorDashboard from './components/DoctorDashboard';
import PatientDashboard from './components/PatientDashboard';

// Pre-populated medical database
const DIRECTORY_MOCK_PATIENTS: Patient[] = [
  {
    id: 'p1',
    firstName: 'Ana',
    lastName: 'Silva',
    username: 'ana.silva',
    diagnostic: 'Enxaqueca',
    requiresPasswordChange: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString() // 10 days ago
  },
  {
    id: 'p2',
    firstName: 'Carlos',
    lastName: 'Oliveira',
    username: 'carlos.oliveira',
    diagnostic: 'Parkinson',
    requiresPasswordChange: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString() // 7 days ago
  },
  {
    id: 'p3',
    firstName: 'Beatriz',
    lastName: 'Costa',
    username: 'beatriz.costa',
    diagnostic: 'Demencia',
    requiresPasswordChange: true, // Needs default change abc123
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() // 2 days ago
  },
  {
    id: 'p4',
    firstName: 'João',
    lastName: 'Santos',
    username: 'joao.santos',
    diagnostic: 'Bruxismo',
    requiresPasswordChange: true, // Needs default change abc123
    createdAt: new Date().toISOString()
  }
];

const DIRECTORY_MOCK_LOGS: TrackingEntry[] = [
  {
    id: 'l1',
    patientId: 'p1',
    diagnostic: 'Enxaqueca',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    data: {
      painScale: 4,
      triggers: 'Excesso de telas',
      medicationUsed: true,
      medName: 'Dipirona 1g'
    },
    notes: 'Iniciei o repouso logo que a aura visual se apresentou e consegui conter a dor forte com a compressa fria no pescoço.'
  },
  {
    id: 'l2',
    patientId: 'p1',
    diagnostic: 'Enxaqueca',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    data: {
      painScale: 7,
      triggers: 'Falta de sono',
      medicationUsed: true,
      medName: 'Sumatriptano 50mg'
    },
    notes: 'Noite conturbada com barulho na rua. Acordei já com pontadas fortes nas têmporas.'
  },
  {
    id: 'l3',
    patientId: 'p1',
    diagnostic: 'Enxaqueca',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
    data: {
      painScale: 2,
      triggers: 'Nenhum',
      medicationUsed: false,
      medName: ''
    },
    notes: 'Excelente dia. Senti alívio completo fazendo o ritual de higiene do sono ontem.'
  },
  {
    id: 'l4',
    patientId: 'p2',
    diagnostic: 'Parkinson',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    data: {
      tremorLevel: 'Leve (intermitente, não bloqueia tarefas)',
      rigidity: 'Leve (membros flexíveis, pouca lentidão)',
      adherence: true,
      freezingIncidents: false
    },
    notes: 'Consegui fazer a caminhada de 20 minutos no parque em período ON.'
  },
  {
    id: 'l5',
    patientId: 'p2',
    diagnostic: 'Parkinson',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(), // 10 hours ago
    data: {
      tremorLevel: 'Moderado (sentido em repouso e ação)',
      rigidity: 'Moderada (alguma lentidão nas trocas de postura)',
      adherence: false, // Missed target hour
      freezingIncidents: true
    },
    notes: 'Atrasei o comprimido da manhã por 45 minutos e senti congelamento de marcha ao tentar levantar da mesa de café.'
  }
];

export default function App() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [logs, setLogs] = useState<TrackingEntry[]>([]);
  const [medicationConfirmations, setMedicationConfirmations] = useState<MedicationConfirmation[]>([]);
  const [session, setSession] = useState<UserSession | null>(null);

  // Initialize from LocalStorage or Fallback Mock Data
  useEffect(() => {
    const savedPatients = localStorage.getItem('clinic_patients');
    const savedLogs = localStorage.getItem('clinic_logs');
    const savedConfirms = localStorage.getItem('clinic_medication_confirmations');

    if (savedPatients) {
      setPatients(JSON.parse(savedPatients));
    } else {
      setPatients(DIRECTORY_MOCK_PATIENTS);
      localStorage.setItem('clinic_patients', JSON.stringify(DIRECTORY_MOCK_PATIENTS));
    }

    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    } else {
      setLogs(DIRECTORY_MOCK_LOGS);
      localStorage.setItem('clinic_logs', JSON.stringify(DIRECTORY_MOCK_LOGS));
    }

    if (savedConfirms) {
      setMedicationConfirmations(JSON.parse(savedConfirms));
    }

    // Default passwords for testing map
    // Keep standard user credentials map in state or storage
    const savedPasswords = localStorage.getItem('clinic_passwords');
    if (!savedPasswords) {
      const initialPasswords: Record<string, string> = {
        'medico.care': 'senha123',
        'ana.silva': 'senha123',
        'carlos.oliveira': 'senha123',
        'beatriz.costa': 'abc123',
        'joao.santos': 'abc123'
      };
      localStorage.setItem('clinic_passwords', JSON.stringify(initialPasswords));
    }
  }, []);

  const handleLogin = (username: string, role: 'doctor' | 'patient', customPassword?: string): string | null => {
    const savedPasswords = JSON.parse(localStorage.getItem('clinic_passwords') || '{}');
    const targetUser = username.trim().toLowerCase();

    // 1. Doctor Login
    if (role === 'doctor') {
      if (targetUser === 'medico.care' && customPassword === savedPasswords['medico.care']) {
        setSession({
          userId: 'doctor_admin',
          username: 'medico.care',
          role: 'doctor'
        });
        return null;
      }
      return 'Dados de acesso médico incorretos.';
    }

    // 2. Patient Login
    const targetPatient = patients.find((p) => p.username === targetUser);
    if (!targetPatient) {
      return 'Nome de usuário não localizado no cadastro do consultório.';
    }

    const currentPass = savedPasswords[targetUser];
    if (customPassword === currentPass) {
      setSession({
        userId: targetPatient.id,
        username: targetPatient.username,
        role: 'patient',
        patientDetails: targetPatient
      });
      return null;
    }

    return 'Senha incorreta para este usuário.';
  };

  const handleLogout = () => {
    setSession(null);
  };

  const handleAddPatient = (firstName: string, lastName: string, diagnostic: DiagnosticType): Patient => {
    // Generate normalized formatted username
    const cleanFirst = firstName
      .trim()
      .toLowerCase()
      .normalize('NFD') // decomposes combined characters so accents can be stripped
      .replace(/[\u0300-\u036f]/g, '') // strip matching diacritics
      .replace(/[^a-z0-9]/g, ''); // alphanumeric only

    const cleanLast = lastName
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

    const generatedUsername = `${cleanFirst}.${cleanLast}`;

    const newPatient: Patient = {
      id: 'p_' + Date.now(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: generatedUsername,
      diagnostic,
      requiresPasswordChange: true, // MUST change on first login
      createdAt: new Date().toISOString()
    };

    const updatedPatients = [...patients, newPatient];
    setPatients(updatedPatients);
    localStorage.setItem('clinic_patients', JSON.stringify(updatedPatients));

    // Save their initial secret 'abc123'
    const savedPasswords = JSON.parse(localStorage.getItem('clinic_passwords') || '{}');
    savedPasswords[generatedUsername] = 'abc123';
    localStorage.setItem('clinic_passwords', JSON.stringify(savedPasswords));

    return newPatient;
  };

  const handleChangePassword = (newPass: string) => {
    if (!session || session.role !== 'patient' || !session.patientDetails) return;

    const currentPat = session.patientDetails;
    const patUsername = currentPat.username;

    // 1. Update password in credentials mapping
    const savedPasswords = JSON.parse(localStorage.getItem('clinic_passwords') || '{}');
    savedPasswords[patUsername] = newPass;
    localStorage.setItem('clinic_passwords', JSON.stringify(savedPasswords));

    // 2. Clear requiresPasswordChange in patient's profile
    const updatedPatients = patients.map((p) => {
      if (p.id === currentPat.id) {
        return {
          ...p,
          requiresPasswordChange: false
        };
      }
      return p;
    });

    setPatients(updatedPatients);
    localStorage.setItem('clinic_patients', JSON.stringify(updatedPatients));

    // 3. Update active session too
    setSession({
      ...session,
      patientDetails: {
        ...currentPat,
        requiresPasswordChange: false
      }
    });
  };

  const handleAddLog = (data: Record<string, any>, notes: string) => {
    if (!session || session.role !== 'patient' || !session.patientDetails) return;

    const currentPat = session.patientDetails;
    const newEntry: TrackingEntry = {
      id: 'l_' + Date.now(),
      patientId: currentPat.id,
      diagnostic: currentPat.diagnostic,
      timestamp: new Date().toISOString(),
      data,
      notes: notes.trim() || undefined
    };

    const updatedLogs = [newEntry, ...logs];
    setLogs(updatedLogs);
    localStorage.setItem('clinic_logs', JSON.stringify(updatedLogs));
  };

  const handleDeletePatient = (id: string) => {
    const patientToDelete = patients.find((p) => p.id === id);
    if (patientToDelete) {
      const savedPasswords = JSON.parse(localStorage.getItem('clinic_passwords') || '{}');
      delete savedPasswords[patientToDelete.username];
      localStorage.setItem('clinic_passwords', JSON.stringify(savedPasswords));
    }

    const updatedPatients = patients.filter((p) => p.id !== id);
    const updatedLogs = logs.filter((l) => l.patientId !== id);

    setPatients(updatedPatients);
    setLogs(updatedLogs);

    localStorage.setItem('clinic_patients', JSON.stringify(updatedPatients));
    localStorage.setItem('clinic_logs', JSON.stringify(updatedLogs));
  };

  const handleUpdatePatientMedications = (patientId: string, medications: MedicationPrescription[]) => {
    const updatedPatients = patients.map((p) => {
      if (p.id === patientId) {
        return { ...p, medications };
      }
      return p;
    });
    setPatients(updatedPatients);
    localStorage.setItem('clinic_patients', JSON.stringify(updatedPatients));
  };

  const handleConfirmMedication = (confirmation: MedicationConfirmation) => {
    const updatedConfirmations = [confirmation, ...medicationConfirmations];
    setMedicationConfirmations(updatedConfirmations);
    localStorage.setItem('clinic_medication_confirmations', JSON.stringify(updatedConfirmations));
  };

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-teal-500 selection:text-white">
      {!session ? (
        <LoginScreen onLogin={handleLogin} patients={patients} />
      ) : session.role === 'doctor' ? (
        <DoctorDashboard
          patients={patients}
          logs={logs}
          medicationConfirmations={medicationConfirmations}
          onUpdatePatientMedications={handleUpdatePatientMedications}
          onAddPatient={handleAddPatient}
          onDeletePatient={handleDeletePatient}
          onLogout={handleLogout}
        />
      ) : (
        session.patientDetails && (
          <PatientDashboard
            currentPatient={patients.find((p) => p.id === session.userId) || session.patientDetails}
            logs={logs}
            medicationConfirmations={medicationConfirmations}
            onConfirmMedication={handleConfirmMedication}
            onChangePassword={handleChangePassword}
            onAddLog={handleAddLog}
            onLogout={handleLogout}
          />
        )
      )}
    </div>
  );
}
