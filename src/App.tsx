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
  MedicationConfirmation,
  Doctor
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
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    try {
      const saved = localStorage.getItem('clinical_doctors');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [logs, setLogs] = useState<TrackingEntry[]>(() => {
    try {
      const saved = localStorage.getItem('clinical_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
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
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [session, setSession] = useState<UserSession | null>(null);
  const [dbLoading, setDbLoading] = useState(true);

  // Core seeding helper for newly initialized Firestore projects
  const seedDatabaseIfEmpty = async () => {
    try {
      console.log("Seeding clinical profiles on Firestore...");
      for (const p of DIRECTORY_MOCK_PATIENTS) {
        await setDoc(doc(db, 'patients', p.id), p);
      }
      try {
        localStorage.setItem('clinical_patients', JSON.stringify(DIRECTORY_MOCK_PATIENTS));
      } catch (e) {
        console.error(e);
      }

      for (const l of DIRECTORY_MOCK_LOGS) {
        await setDoc(doc(db, 'logs', l.id), l);
      }
      try {
        localStorage.setItem('clinical_logs', JSON.stringify(DIRECTORY_MOCK_LOGS));
      } catch (e) {
        console.error(e);
      }

      const initialPasswords: Record<string, string> = {
        'medico.care': 'abc123',
        'ana.silva': 'abc123',
        'carlos.oliveira': 'abc123',
        'beatriz.costa': 'abc123',
        'joao.santos': 'abc123'
      };
      for (const [uname, pwd] of Object.entries(initialPasswords)) {
        await setDoc(doc(db, 'credentials', uname), { username: uname, password: pwd });
      }
      try {
        localStorage.setItem('clinical_credentials', JSON.stringify(initialPasswords));
      } catch (e) {
        console.error(e);
      }

      console.log("Firestore seeding completed successfully!");
    } catch (err) {
      console.error("Clinical profile seeding failed", err);
    }
  };

  // Real-time Firestore synchronization
  useEffect(() => {
    let unsubPatients: (() => void) | undefined;
    let unsubDoctors: (() => void) | undefined;
    let unsubLogs: (() => void) | undefined;
    let unsubConfirms: (() => void) | undefined;
    let unsubCredentials: (() => void) | undefined;

    const initDb = async () => {
      try {
        try {
          await initFirebaseSession();
        } catch (e) {
          console.warn("initFirebaseSession handled offline:", e);
        }

        try {
          await testConnection();
        } catch (e) {
          console.warn("testConnection handled offline:", e);
        }

        const qPatients = collection(db, 'patients');
        const qDoctors = collection(db, 'doctors');
        const qLogs = collection(db, 'logs');
        const qConfirms = collection(db, 'medicationConfirmations');
        const qCredentials = collection(db, 'credentials');

        // Check and Seed Database if Empty in background
        try {
          const patientsSnap = await getDocs(qPatients);
          if (patientsSnap.empty) {
            await seedDatabaseIfEmpty();
          }
        } catch (seedErr) {
          console.warn("Seeding check skipped or handled offline", seedErr);
        }

        // 1. Live Patients Listener
        unsubPatients = onSnapshot(qPatients, (snapshot) => {
          const list: Patient[] = [];
          snapshot.forEach((doc) => {
            list.push(doc.data() as Patient);
          });
          setPatients(list);
          try {
            localStorage.setItem('clinical_patients', JSON.stringify(list));
          } catch (e) {
            console.error(e);
          }
        }, (error) => {
          console.warn("Firestore error reading patients:", error);
        });

        // 1.5 Live Doctors Listener
        unsubDoctors = onSnapshot(qDoctors, (snapshot) => {
          const list: Doctor[] = [];
          snapshot.forEach((doc) => {
            list.push(doc.data() as Doctor);
          });
          setDoctors(list);
          try {
            localStorage.setItem('clinical_doctors', JSON.stringify(list));
          } catch (e) {
            console.error(e);
          }
        }, (error) => {
          console.warn("Firestore error reading doctors:", error);
        });

        // 2. Live Logs Listener
        unsubLogs = onSnapshot(qLogs, (snapshot) => {
          const list: TrackingEntry[] = [];
          snapshot.forEach((doc) => {
            list.push(doc.data() as TrackingEntry);
          });
          list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setLogs(list);
          try {
            localStorage.setItem('clinical_logs', JSON.stringify(list));
          } catch (e) {
            console.error(e);
          }
        }, (error) => {
          console.warn("Firestore error reading logs:", error);
        });

        // 3. Live Medication Confirmations Listener
        unsubConfirms = onSnapshot(qConfirms, (snapshot) => {
          const list: MedicationConfirmation[] = [];
          snapshot.forEach((doc) => {
            list.push(doc.data() as MedicationConfirmation);
          });
          list.sort((a, b) => new Date(b.confirmedAt).getTime() - new Date(a.confirmedAt).getTime());
          setMedicationConfirmations(list);
          try {
            localStorage.setItem('clinical_confirmations', JSON.stringify(list));
          } catch (e) {
            console.error(e);
          }
        }, (error) => {
          console.warn("Firestore error reading medicationConfirmations:", error);
        });

        // 4. Live Credentials mapping listener
        unsubCredentials = onSnapshot(qCredentials, (snapshot) => {
          const credMap: Record<string, string> = {};
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.username && data.password) {
              credMap[data.username.trim().toLowerCase()] = data.password;
            }
          });
          setCredentials(credMap);
          try {
            localStorage.setItem('clinical_credentials', JSON.stringify(credMap));
          } catch (e) {
            console.error(e);
          }
        }, (error) => {
          console.warn("Firestore error reading credentials:", error);
        });

        setDbLoading(false);

      } catch (err) {
        console.error("Firestore DB Link failure", err);
        setDbLoading(false);
      }
    };

    initDb();

    return () => {
      if (unsubPatients) unsubPatients();
      if (unsubDoctors) unsubDoctors();
      if (unsubLogs) unsubLogs();
      if (unsubConfirms) unsubConfirms();
      if (unsubCredentials) unsubCredentials();
    };
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

    // Async write on Firestore
    try {
      await setDoc(doc(db, 'doctors', newDoctor.id), newDoctor);
      await setDoc(doc(db, 'credentials', generatedUsername), { 
        username: generatedUsername, 
        password: 'abc123' 
      });
    } catch (err) {
      console.warn("Firestore doctor registration save failed, offline fallback preserved it in localStorage", err);
    }

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

    // Write to firestore in background
    setDoc(doc(db, 'patients', newPatient.id), newPatient)
      .catch((err) => console.warn("Firestore patient write failed, offline fallback preserved it in localStorage", err));

    setDoc(doc(db, 'credentials', generatedUsername), { 
      username: generatedUsername, 
      password: 'abc123' 
    }).catch((err) => console.warn("Firestore credentials write failed, offline fallback preserved it in localStorage", err));

    return newPatient;
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

    try {
      // 1. Update password in credentials mapping
      await setDoc(doc(db, 'credentials', patUsername), {
        username: patUsername,
        password: newPass
      });

      // 2. Clear requiresPasswordChange in patient's profile
      await setDoc(doc(db, 'patients', currentPat.id), updatedPatient);
    } catch (error) {
      console.warn("Firestore password update failed, offline local storage fallback succeeded:", error);
    }
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

    try {
      // 1. Update password in credentials mapping
      await setDoc(doc(db, 'credentials', docUsername), {
        username: docUsername,
        password: newPass
      });

      // 2. Clear requiresPasswordChange in doctor's profile
      await setDoc(doc(db, 'doctors', currentDoc.id), updatedDoctor);
    } catch (error) {
      console.warn("Firestore doctor password change failed, offline local storage fallback succeeded:", error);
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

    // Optimistic local storage update
    const updatedLogs = [newEntry, ...logs];
    setLogs(updatedLogs);
    try {
      localStorage.setItem('clinical_logs', JSON.stringify(updatedLogs));
    } catch (e) {
      console.error(e);
    }

    try {
      await setDoc(doc(db, 'logs', newEntry.id), newEntry);
    } catch (error) {
      console.warn("Firestore log save failed, using Cached LocalStorage fallback:", error);
    }
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
      console.warn("Firestore patient delete error, using localStorage fallback:", error);
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

    try {
      await setDoc(doc(db, 'patients', patientId), updatedPatient);
    } catch (error) {
      console.warn("Firestore update medication failed, using localStorage fallback:", error);
    }
  };

  const handleConfirmMedication = async (confirmation: MedicationConfirmation) => {
    const updatedConfirmations = [confirmation, ...medicationConfirmations];
    setMedicationConfirmations(updatedConfirmations);
    try {
      localStorage.setItem('clinical_confirmations', JSON.stringify(updatedConfirmations));
    } catch (e) {
      console.error(e);
    }

    try {
      await setDoc(doc(db, 'medicationConfirmations', confirmation.id), confirmation);
    } catch (error) {
      console.warn("Firestore confirm medication failed, using localStorage fallback:", error);
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
        <LoginScreen onLogin={handleLogin} patients={patients} onRegisterDoctor={handleRegisterDoctor} />
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
