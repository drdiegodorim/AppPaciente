import { useState, useEffect } from 'react';
import { 
  Patient, 
  TrackingEntry, 
  UserSession, 
  DiagnosticType, 
  MedicationPrescription, 
  MedicationConfirmation,
  Doctor
} from './types';
import LoginScreen from './components/LoginScreen';
import DoctorDashboard from './components/DoctorDashboard';
import PatientDashboard from './components/PatientDashboard';
import {
  checkSupabaseSchema,
  SupabaseSchemaStatus,
  fetchDoctorsDB,
  fetchPatientsDB,
  fetchLogsDB,
  fetchConfirmationsDB,
  fetchCredentialsDB,
  saveDoctorDB,
  savePatientDB,
  saveCredentialDB,
  saveLogDB,
  saveConfirmationDB,
  deletePatientCascadingDB
} from './lib/supabase';

// Pre-populated medical database fallback seeding data
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
    diagnostic: 'Enxaqueca',
    requiresPasswordChange: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString() // 7 days ago
  },
  {
    id: 'p3',
    firstName: 'Beatriz',
    lastName: 'Costa',
    username: 'beatriz.costa',
    diagnostic: 'Enxaqueca',
    requiresPasswordChange: true, // Needs default change abc123
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() // 2 days ago
  },
  {
    id: 'p4',
    firstName: 'João',
    lastName: 'Santos',
    username: 'joao.santos',
    diagnostic: 'Enxaqueca',
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
    diagnostic: 'Enxaqueca',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    data: {
      painScale: 3,
      triggers: 'Estresse/Ansiedade',
      medicationUsed: true,
      medName: 'Dipirona 500mg'
    },
    notes: 'Senti dor leve ao fim do dia após reunião tensa, resolvida com medicação de resgate.'
  },
  {
    id: 'l5',
    patientId: 'p2',
    diagnostic: 'Enxaqueca',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(), // 10 hours ago
    data: {
      painScale: 5,
      triggers: 'Falta de sono',
      medicationUsed: true,
      medName: 'Triptano 80mg'
    },
    notes: 'Acordei com cefaleia unilateral moderada devido a sono interrompido.'
  }
];

export default function App() {
  const [patients, setPatients] = useState<Patient[]>(() => {
    try {
      const saved = localStorage.getItem('clinical_patients');
      if (saved) return JSON.parse(saved);
      // Local fallback seeding
      localStorage.setItem('clinical_patients', JSON.stringify(DIRECTORY_MOCK_PATIENTS));
      return DIRECTORY_MOCK_PATIENTS;
    } catch {
      return DIRECTORY_MOCK_PATIENTS;
    }
  });
  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    try {
      const saved = localStorage.getItem('clinical_doctors');
      if (saved) return JSON.parse(saved);
      // Local fallback seeding
      const defaultDoc: Doctor = {
        id: 'doctor_admin',
        firstName: 'Diego',
        lastName: 'Dorim',
        username: 'medico.care',
        email: 'diego@dorim.com',
        crm: '123456-SP',
        requiresPasswordChange: false,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('clinical_doctors', JSON.stringify([defaultDoc]));
      return [defaultDoc];
    } catch {
      return [];
    }
  });
  const [logs, setLogs] = useState<TrackingEntry[]>(() => {
    try {
      const saved = localStorage.getItem('clinical_logs');
      if (saved) return JSON.parse(saved);
      // Local fallback seeding
      localStorage.setItem('clinical_logs', JSON.stringify(DIRECTORY_MOCK_LOGS));
      return DIRECTORY_MOCK_LOGS;
    } catch {
      return DIRECTORY_MOCK_LOGS;
    }
  });
  const [medicationConfirmations, setMedicationConfirmations] = useState<MedicationConfirmation[]>(() => {
    try {
      const saved = localStorage.getItem('clinical_confirmations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [credentials, setCredentials] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('clinical_credentials');
      if (saved) return JSON.parse(saved);
      // Local fallback seeding
      const initialPasswords: Record<string, string> = {
        'medico.care': 'abc123',
        'ana.silva': 'abc123',
        'carlos.oliveira': 'abc123',
        'beatriz.costa': 'abc123',
        'joao.santos': 'abc123'
      };
      localStorage.setItem('clinical_credentials', JSON.stringify(initialPasswords));
      return initialPasswords;
    } catch {
      return {};
    }
  });
  const [session, setSession] = useState<UserSession | null>(null);
  const [dbLoading, setDbLoading] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseSchemaStatus>({
    connected: false,
    tablesMissing: false,
    errors: []
  });

  // Fetch initial state from Supabase if connected & configured
  useEffect(() => {
    async function loadDataFromSupabase() {
      setDbLoading(true);
      try {
        const schema = await checkSupabaseSchema();
        setSupabaseStatus(schema);

        if (schema.connected && !schema.tablesMissing) {
          console.log("Supabase connected and tables found! Loading records...");
          const [dbDocs, dbPats, dbLogs, dbConfs, dbCreds] = await Promise.all([
            fetchDoctorsDB(),
            fetchPatientsDB(),
            fetchLogsDB(),
            fetchConfirmationsDB(),
            fetchCredentialsDB()
          ]);

          // Only override local states if we got populated sets or successfully matched
          // Let's seed default values if the database tables are empty
          if (dbPats.length > 0) {
            setPatients(dbPats);
            localStorage.setItem('clinical_patients', JSON.stringify(dbPats));
          } else {
            // Seed Supabase with local default mock data
            for (const p of DIRECTORY_MOCK_PATIENTS) {
              await savePatientDB(p);
            }
            const fetchedP = await fetchPatientsDB();
            setPatients(fetchedP);
            localStorage.setItem('clinical_patients', JSON.stringify(fetchedP));
          }

          if (dbDocs.length > 0) {
            setDoctors(dbDocs);
            localStorage.setItem('clinical_doctors', JSON.stringify(dbDocs));
          } else {
            const defaultDoc: Doctor = {
              id: 'doctor_admin',
              firstName: 'Diego',
              lastName: 'Dorim',
              username: 'medico.care',
              email: 'diego@dorim.com',
              crm: '123456-SP',
              requiresPasswordChange: false,
              createdAt: new Date().toISOString()
            };
            await saveDoctorDB(defaultDoc);
            const fetchedD = await fetchDoctorsDB();
            setDoctors(fetchedD);
            localStorage.setItem('clinical_doctors', JSON.stringify(fetchedD));
          }

          if (dbLogs.length > 0) {
            setLogs(dbLogs);
            localStorage.setItem('clinical_logs', JSON.stringify(dbLogs));
          } else {
            for (const l of DIRECTORY_MOCK_LOGS) {
              await saveLogDB(l);
            }
            const fetchedL = await fetchLogsDB();
            setLogs(fetchedL);
            localStorage.setItem('clinical_logs', JSON.stringify(fetchedL));
          }

          if (dbConfs.length > 0) {
            setMedicationConfirmations(dbConfs);
            localStorage.setItem('clinical_confirmations', JSON.stringify(dbConfs));
          }

          if (Object.keys(dbCreds).length > 0) {
            setCredentials(dbCreds);
            localStorage.setItem('clinical_credentials', JSON.stringify(dbCreds));
          } else {
            const initialPasswords: Record<string, string> = {
              'medico.care': 'abc123',
              'ana.silva': 'abc123',
              'carlos.oliveira': 'abc123',
              'beatriz.costa': 'abc123',
              'joao.santos': 'abc123'
            };
            for (const [u, p] of Object.entries(initialPasswords)) {
              await saveCredentialDB(u, p);
            }
            const fetchedC = await fetchCredentialsDB();
            setCredentials(fetchedC);
            localStorage.setItem('clinical_credentials', JSON.stringify(fetchedC));
          }
        } else {
          console.log("Supabase not fully functional or tables missing. Falling back to local offline storage.");
        }
      } catch (err: any) {
        console.warn("Connection or query failure to Supabase, fallback locally preservation handled:", err.message);
        setSupabaseStatus(prev => ({
          ...prev,
          errors: [...prev.errors, err.message || String(err)]
        }));
      } finally {
        setDbLoading(false);
      }
    }

    loadDataFromSupabase();
  }, []);

  // Register Service worker globally on mount to enable PWA support early
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('Global Service Worker registered on app boot!', reg.scope);
        })
        .catch((err) => {
          console.error('Global Service Worker registration skipped/failed:', err);
        });
    }
  }, []);

  const handleLogin = (username: string, role: 'doctor' | 'patient', customPassword?: string): string | null => {
    const targetUser = username.trim().toLowerCase();

    // 1. Doctor Login
    if (role === 'doctor') {
      const savedDocPass = credentials[targetUser] || (targetUser === 'medico.care' ? 'abc123' : null);
      if (!savedDocPass) {
        const targetDoctor = doctors.find((d) => d.username === targetUser);
        if (!targetDoctor) {
          return 'Nome de usuário médico não localizado no cadastro do consultório.';
        }
      }

      const targetDoctor = doctors.find((d) => d.username === targetUser) || (targetUser === 'medico.care' ? {
        id: 'doctor_admin',
        firstName: 'Diego',
        lastName: 'Dorim',
        username: 'medico.care',
        email: 'diego@dorim.com',
        crm: '123456-SP',
        requiresPasswordChange: false,
        createdAt: new Date().toISOString()
      } : null);

      if (!targetDoctor) {
        return 'Dados de acesso do médico não puderam ser localizados.';
      }

      const expectedPassword = credentials[targetUser] || 'abc123';
      if (customPassword === expectedPassword) {
        setSession({
          userId: targetDoctor.id,
          username: targetDoctor.username,
          role: 'doctor',
          doctorDetails: targetDoctor
        });
        return null;
      }
      return 'Senha incorreta para acesso médico.';
    }

    // 2. Patient Login
    const targetPatient = patients.find((p) => p.username === targetUser);
    if (!targetPatient) {
      return 'Nome de usuário não localizado no cadastro do consultório.';
    }

    const currentPass = credentials[targetUser] || 'abc123';
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

  const handleRegisterDoctor = async (
    firstName: string,
    lastName: string,
    email: string,
    crm: string
  ): Promise<Doctor> => {
    const cleanFirst = firstName
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

    const cleanLast = lastName
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

    const generatedUsername = `${cleanFirst}.${cleanLast}`;

    const newDoctor: Doctor = {
      id: 'doc_' + Date.now(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: generatedUsername,
      email: email.trim(),
      crm: crm.trim(),
      requiresPasswordChange: false,
      createdAt: new Date().toISOString()
    };

    // Synchronous LocalStorage & Optimistic React State update (guarantees persistence across logouts/reloads)
    const updatedDocs = [...doctors, newDoctor];
    setDoctors(updatedDocs);
    try {
      localStorage.setItem('clinical_doctors', JSON.stringify(updatedDocs));
    } catch (e) {
      console.error(e);
    }

    const updatedCreds = {
      ...credentials,
      [generatedUsername]: 'abc123'
    };
    setCredentials(updatedCreds);
    try {
      localStorage.setItem('clinical_credentials', JSON.stringify(updatedCreds));
    } catch (e) {
      console.error(e);
    }

    // Persist on Supabase in background
    saveDoctorDB(newDoctor)
      .then(() => saveCredentialDB(generatedUsername, 'abc123'))
      .catch((err) => console.warn("Could not save doctor and credentials on Supabase:", err));

    return newDoctor;
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
      requiresPasswordChange: false,
      createdAt: new Date().toISOString()
    };

    // Synchronous LocalStorage & Optimistic React State update (guarantees persistence across logouts/reloads)
    const updatedPats = [...patients, newPatient];
    setPatients(updatedPats);
    try {
      localStorage.setItem('clinical_patients', JSON.stringify(updatedPats));
    } catch (e) {
      console.error(e);
    }

    const updatedCreds = {
      ...credentials,
      [generatedUsername]: 'abc123'
    };
    setCredentials(updatedCreds);
    try {
      localStorage.setItem('clinical_credentials', JSON.stringify(updatedCreds));
    } catch (e) {
      console.error(e);
    }

    // Persist on Supabase in background
    savePatientDB(newPatient)
      .then(() => saveCredentialDB(generatedUsername, 'abc123'))
      .catch((err) => console.warn("Could not save patient and credentials on Supabase:", err));

    return newPatient;
  };

  const handleUpdatePatient = (patientId: string, firstName: string, lastName: string, diagnostic: DiagnosticType): Patient => {
    const currentPatient = patients.find(p => p.id === patientId);
    if (!currentPatient) {
      throw new Error("Patient not found");
    }

    const updatedPatient: Patient = {
      ...currentPatient,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      diagnostic
    };

    const updatedPats = patients.map((p) => p.id === patientId ? updatedPatient : p);
    setPatients(updatedPats);
    try {
      localStorage.setItem('clinical_patients', JSON.stringify(updatedPats));
    } catch (e) {
      console.error(e);
    }

    // Persist on Supabase in background
    savePatientDB(updatedPatient)
      .catch((err) => console.warn("Could not update patient on Supabase:", err));

    return updatedPatient;
  };

  const handleChangePassword = async (newPass: string) => {
    if (!session || session.role !== 'patient' || !session.patientDetails) return;

    const currentPat = session.patientDetails;
    const patUsername = currentPat.username;

    const updatedPatient = {
      ...currentPat,
      requiresPasswordChange: false
    };

    // Optimistic local state and local storage updates
    const updatedPats = patients.map((p) => p.id === currentPat.id ? updatedPatient : p);
    setPatients(updatedPats);
    try {
      localStorage.setItem('clinical_patients', JSON.stringify(updatedPats));
    } catch (e) {
      console.error(e);
    }

    const updatedCreds = {
      ...credentials,
      [patUsername]: newPass
    };
    setCredentials(updatedCreds);
    try {
      localStorage.setItem('clinical_credentials', JSON.stringify(updatedCreds));
    } catch (e) {
      console.error(e);
    }

    // Update active session too
    setSession({
      ...session,
      patientDetails: updatedPatient
    });

    // Update on Supabase in background
    savePatientDB(updatedPatient)
      .then(() => saveCredentialDB(patUsername, newPass))
      .catch((err) => console.warn("Could not sync changed patient password to Supabase:", err));
  };

  const handleDoctorChangePassword = async (newPass: string) => {
    if (!session || session.role !== 'doctor' || !session.doctorDetails) return;

    const currentDoc = session.doctorDetails;
    const docUsername = currentDoc.username;

    const updatedDoctor: Doctor = {
      ...currentDoc,
      requiresPasswordChange: false
    };

    // Optimistic local state and local storage updates
    const updatedDocs = doctors.map((d) => d.id === currentDoc.id ? updatedDoctor : d);
    setDoctors(updatedDocs);
    try {
      localStorage.setItem('clinical_doctors', JSON.stringify(updatedDocs));
    } catch (e) {
      console.error(e);
    }

    const updatedCreds = {
      ...credentials,
      [docUsername]: newPass
    };
    setCredentials(updatedCreds);
    try {
      localStorage.setItem('clinical_credentials', JSON.stringify(updatedCreds));
    } catch (e) {
      console.error(e);
    }

    // Update active session too
    setSession({
      ...session,
      doctorDetails: updatedDoctor
    });

    // Update on Supabase in background
    saveDoctorDB(updatedDoctor)
      .then(() => saveCredentialDB(docUsername, newPass))
      .catch((err) => console.warn("Could not sync changed doctor password to Supabase:", err));
  };

  const handleAddLog = async (data: Record<string, any>, notes: string) => {
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

    // Optimistic local storage update
    const updatedLogs = [newEntry, ...logs];
    setLogs(updatedLogs);
    try {
      localStorage.setItem('clinical_logs', JSON.stringify(updatedLogs));
    } catch (e) {
      console.error(e);
    }

    // Persist on Supabase in background
    saveLogDB(newEntry)
      .catch((err) => console.warn("Could not save tracking log to Supabase:", err));
  };

  const handleDeletePatient = async (id: string) => {
    const patientToDelete = patients.find((p) => p.id === id);
    
    // Optimistic local storage update
    const updatedPats = patients.filter((p) => p.id !== id);
    setPatients(updatedPats);
    try {
      localStorage.setItem('clinical_patients', JSON.stringify(updatedPats));
    } catch (e) {
      console.error(e);
    }

    const updatedLogs = logs.filter((l) => l.patientId !== id);
    setLogs(updatedLogs);
    try {
      localStorage.setItem('clinical_logs', JSON.stringify(updatedLogs));
    } catch (e) {
      console.error(e);
    }

    const updatedConfirms = medicationConfirmations.filter((mc) => mc.patientId !== id);
    setMedicationConfirmations(updatedConfirms);
    try {
      localStorage.setItem('clinical_confirmations', JSON.stringify(updatedConfirms));
    } catch (e) {
      console.error(e);
    }

    // Persist on Supabase in background
    if (patientToDelete) {
      deletePatientCascadingDB(id, patientToDelete.username)
        .catch((err) => console.warn("Could not delete patient cascadingly from Supabase:", err));
    }
  };

  const handleUpdatePatientMedications = async (patientId: string, medications: MedicationPrescription[]) => {
    const pToUpdate = patients.find((p) => p.id === patientId);
    if (!pToUpdate) return;

    const updatedPatient = {
      ...pToUpdate,
      medications
    };

    // Optimistic local storage write
    const updatedPats = patients.map((p) => p.id === patientId ? updatedPatient : p);
    setPatients(updatedPats);
    try {
      localStorage.setItem('clinical_patients', JSON.stringify(updatedPats));
    } catch (e) {
      console.error(e);
    }

    // Persist on Supabase in background
    savePatientDB(updatedPatient)
      .catch((err) => console.warn("Could not sync updated medications to Supabase:", err));
  };

  const handleConfirmMedication = async (confirmation: MedicationConfirmation) => {
    const updatedConfirmations = [confirmation, ...medicationConfirmations];
    setMedicationConfirmations(updatedConfirmations);
    try {
      localStorage.setItem('clinical_confirmations', JSON.stringify(updatedConfirmations));
    } catch (e) {
      console.error(e);
    }

    // Persist on Supabase in background
    saveConfirmationDB(confirmation)
      .catch((err) => console.warn("Could not sync medication confirmation to Supabase:", err));
  };

  if (dbLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 gap-4 font-sans">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-teal-600" />
        <p className="text-sm font-semibold text-slate-600 animate-pulse">Conectando ao Banco de Dados...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-teal-500 selection:text-white">
      {!session ? (
        <LoginScreen onLogin={handleLogin} patients={patients} onRegisterDoctor={handleRegisterDoctor} supabaseStatus={supabaseStatus} />
      ) : session.role === 'doctor' ? (
        <DoctorDashboard
          patients={patients}
          logs={logs}
          medicationConfirmations={medicationConfirmations}
          onUpdatePatientMedications={handleUpdatePatientMedications}
          onAddPatient={handleAddPatient}
          onUpdatePatient={handleUpdatePatient}
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
