import { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  db, 
  initFirebaseSession, 
  testConnection, 
  handleFirestoreError, 
  OperationType 
} from './lib/firebase';
import { 
  Patient, 
  TrackingEntry, 
  UserSession, 
  DiagnosticType, 
  MedicationPrescription, 
  MedicationConfirmation 
} from './types';
import LoginScreen from './components/LoginScreen';
import DoctorDashboard from './components/DoctorDashboard';
import PatientDashboard from './components/PatientDashboard';

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
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [session, setSession] = useState<UserSession | null>(null);
  const [dbLoading, setDbLoading] = useState(true);

  // Core seeding helper for newly initialized Firestore projects
  const seedDatabaseIfEmpty = async () => {
    try {
      console.log("Seeding clinical profiles on Firestore...");
      for (const p of DIRECTORY_MOCK_PATIENTS) {
        await setDoc(doc(db, 'patients', p.id), p);
      }
      for (const l of DIRECTORY_MOCK_LOGS) {
        await setDoc(doc(db, 'logs', l.id), l);
      }
      const initialPasswords: Record<string, string> = {
        'medico.care': 'senha123',
        'ana.silva': 'senha123',
        'carlos.oliveira': 'senha123',
        'beatriz.costa': 'abc123',
        'joao.santos': 'abc123'
      };
      for (const [uname, pwd] of Object.entries(initialPasswords)) {
        await setDoc(doc(db, 'credentials', uname), { username: uname, password: pwd });
      }
      console.log("Firestore seeding completed successfully!");
    } catch (err) {
      console.error("Clinical profile seeding failed", err);
    }
  };

  // Real-time Firestore synchronization
  useEffect(() => {
    const initDb = async () => {
      try {
        await initFirebaseSession();
        await testConnection();

        const qPatients = collection(db, 'patients');
        const qLogs = collection(db, 'logs');
        const qConfirms = collection(db, 'medicationConfirmations');
        const qCredentials = collection(db, 'credentials');

        // Check and Seed Database if Empty
        const patientsSnap = await getDocs(qPatients);
        if (patientsSnap.empty) {
          await seedDatabaseIfEmpty();
        }

        // 1. Live Patients Listener
        const unsubPatients = onSnapshot(qPatients, (snapshot) => {
          const list: Patient[] = [];
          snapshot.forEach((doc) => {
            list.push(doc.data() as Patient);
          });
          setPatients(list);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'patients');
        });

        // 2. Live Logs Listener
        const unsubLogs = onSnapshot(qLogs, (snapshot) => {
          const list: TrackingEntry[] = [];
          snapshot.forEach((doc) => {
            list.push(doc.data() as TrackingEntry);
          });
          list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setLogs(list);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'logs');
        });

        // 3. Live Medication Confirmations Listener
        const unsubConfirms = onSnapshot(qConfirms, (snapshot) => {
          const list: MedicationConfirmation[] = [];
          snapshot.forEach((doc) => {
            list.push(doc.data() as MedicationConfirmation);
          });
          list.sort((a, b) => new Date(b.confirmedAt).getTime() - new Date(a.confirmedAt).getTime());
          setMedicationConfirmations(list);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'medicationConfirmations');
        });

        // 4. Live Credentials mapping listener
        const unsubCredentials = onSnapshot(qCredentials, (snapshot) => {
          const credMap: Record<string, string> = {};
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.username && data.password) {
              credMap[data.username.trim().toLowerCase()] = data.password;
            }
          });
          setCredentials(credMap);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'credentials');
        });

        setDbLoading(false);

        return () => {
          unsubPatients();
          unsubLogs();
          unsubConfirms();
          unsubCredentials();
        };

      } catch (err) {
        console.error("Firestore DB Link failure", err);
        setDbLoading(false);
      }
    };

    initDb();
  }, []);

  const handleLogin = (username: string, role: 'doctor' | 'patient', customPassword?: string): string | null => {
    const targetUser = username.trim().toLowerCase();

    // 1. Doctor Login
    if (role === 'doctor') {
      const savedDocPass = credentials['medico.care'] || 'senha123';
      if (targetUser === 'medico.care' && customPassword === savedDocPass) {
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

    const currentPass = credentials[targetUser] || (targetPatient.requiresPasswordChange ? 'abc123' : 'senha123');
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

    // Optimistically write to firestore
    setDoc(doc(db, 'patients', newPatient.id), newPatient)
      .catch((err) => handleFirestoreError(err, OperationType.WRITE, `patients/${newPatient.id}`));

    setDoc(doc(db, 'credentials', generatedUsername), { 
      username: generatedUsername, 
      password: 'abc123' 
    }).catch((err) => handleFirestoreError(err, OperationType.WRITE, `credentials/${generatedUsername}`));

    return newPatient;
  };

  const handleChangePassword = async (newPass: string) => {
    if (!session || session.role !== 'patient' || !session.patientDetails) return;

    const currentPat = session.patientDetails;
    const patUsername = currentPat.username;

    try {
      // 1. Update password in credentials mapping
      await setDoc(doc(db, 'credentials', patUsername), {
        username: patUsername,
        password: newPass
      });

      // 2. Clear requiresPasswordChange in patient's profile
      const updatedPatient = {
        ...currentPat,
        requiresPasswordChange: false
      };
      await setDoc(doc(db, 'patients', currentPat.id), updatedPatient);

      // 3. Update active session too
      setSession({
        ...session,
        patientDetails: updatedPatient
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `patients/${currentPat.id}`);
    }
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

    try {
      await setDoc(doc(db, 'logs', newEntry.id), newEntry);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `logs/${newEntry.id}`);
    }
  };

  const handleDeletePatient = async (id: string) => {
    const patientToDelete = patients.find((p) => p.id === id);
    
    try {
      if (patientToDelete) {
        await deleteDoc(doc(db, 'credentials', patientToDelete.username));
      }
      await deleteDoc(doc(db, 'patients', id));

      // Cascade delete logs
      const associatedLogs = logs.filter((l) => l.patientId === id);
      for (const logToDel of associatedLogs) {
        await deleteDoc(doc(db, 'logs', logToDel.id));
      }

      // Cascade delete confirmations
      const associatedConfirms = medicationConfirmations.filter((mc) => mc.patientId === id);
      for (const conf of associatedConfirms) {
        await deleteDoc(doc(db, 'medicationConfirmations', conf.id));
      }

    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `patients/${id}`);
    }
  };

  const handleUpdatePatientMedications = async (patientId: string, medications: MedicationPrescription[]) => {
    const pToUpdate = patients.find((p) => p.id === patientId);
    if (!pToUpdate) return;

    try {
      await setDoc(doc(db, 'patients', patientId), {
        ...pToUpdate,
        medications
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `patients/${patientId}`);
    }
  };

  const handleConfirmMedication = async (confirmation: MedicationConfirmation) => {
    try {
      await setDoc(doc(db, 'medicationConfirmations', confirmation.id), confirmation);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `medicationConfirmations/${confirmation.id}`);
    }
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
