import { createClient } from '@supabase/supabase-js';
import { Patient, Doctor, TrackingEntry, MedicationConfirmation } from '../types';

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://consultorio-paciente.l1cok9.easypanel.host';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State to track if Supabase schema is missing or invalid
export interface SupabaseSchemaStatus {
  connected: boolean;
  tablesMissing: boolean;
  errors: string[];
  missingTreatmentPlanColumn?: boolean;
}

export async function checkSupabaseSchema(): Promise<SupabaseSchemaStatus> {
  const status: SupabaseSchemaStatus = {
    connected: false,
    tablesMissing: false,
    errors: []
  };

  try {
    const { error } = await supabase.from('doctors').select('count', { count: 'exact', head: true });
    status.connected = true;
    if (error) {
      if (error.code === '42P01') {
        status.tablesMissing = true;
        status.errors.push("A tabela 'doctors' não foi localizada.");
        return status;
      } else {
        status.errors.push(error.message);
      }
    }

    // Check if patients table exists and has the treatment_plan column
    const { error: patError } = await supabase.from('patients').select('treatment_plan').limit(1);
    if (patError) {
      if (patError.code === '42P01') {
        status.tablesMissing = true;
        status.errors.push("A tabela 'patients' não foi localizada.");
      } else if (patError.code === '42703') {
        status.missingTreatmentPlanColumn = true;
        status.errors.push("A coluna 'treatment_plan' está ausente na tabela 'patients'.");
      } else {
        status.errors.push(patError.message);
      }
    }
  } catch (err: any) {
    status.errors.push(err.message || String(err));
  }
  return status;
}

// ==========================================
// Map Helpers (Snake to Camel & Camel to Snake)
// ==========================================

function safeParseJSON(val: any, defaultVal: any = []): any {
  if (!val) return defaultVal;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return defaultVal;
    }
  }
  return val;
}

export function mapPatientFromDB(row: any): Patient {
  let medications = safeParseJSON(row.medications, []);
  let treatmentPlan = safeParseJSON(row.treatment_plan || row.treatmentPlan, {});

  // Extract from medication backup if it exists
  const backupIndex = medications.findIndex((m: any) => m.id === '__treatment_plan_backup__');
  if (backupIndex !== -1) {
    try {
      const backupPlan = JSON.parse(medications[backupIndex].dosage || '{}');
      if (backupPlan && Object.keys(backupPlan).length > 0) {
        // Use backup if native field is empty
        if (!treatmentPlan || Object.keys(treatmentPlan).length === 0) {
          treatmentPlan = backupPlan;
        }
      }
    } catch (e) {
      console.error("Error parsing treatment plan backup:", e);
    }
    // Filter out the backup item from client-facing medications list
    medications = medications.filter((m: any) => m.id !== '__treatment_plan_backup__');
  }

  return {
    id: row.id,
    firstName: row.first_name || row.firstName || '',
    lastName: row.last_name || row.lastName || '',
    username: row.username || '',
    diagnostic: row.diagnostic || 'Enxaqueca',
    requiresPasswordChange: row.requires_password_change !== undefined ? row.requires_password_change : (row.requiresPasswordChange || false),
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    medications: medications,
    treatmentPlan: treatmentPlan
  };
}

export function mapDoctorFromDB(row: any): Doctor {
  return {
    id: row.id,
    firstName: row.first_name || row.firstName || '',
    lastName: row.last_name || row.lastName || '',
    username: row.username || '',
    email: row.email || '',
    crm: row.crm || '',
    requiresPasswordChange: row.requires_password_change !== undefined ? row.requires_password_change : (row.requiresPasswordChange || false),
    createdAt: row.created_at || row.createdAt || new Date().toISOString()
  };
}

export function mapLogFromDB(row: any): TrackingEntry {
  return {
    id: row.id,
    patientId: row.patient_id || row.patientId || '',
    diagnostic: row.diagnostic || 'Enxaqueca',
    timestamp: row.timestamp || new Date().toISOString(),
    data: safeParseJSON(row.data),
    notes: row.notes || undefined
  };
}

export function mapConfirmationFromDB(row: any): MedicationConfirmation {
  return {
    id: row.id,
    patientId: row.patient_id || row.patientId || '',
    medicationId: row.medication_id || row.medicationId || '',
    medicationName: row.medication_name || row.medicationName || '',
    dosage: row.dosage || '',
    prescribedTime: row.prescribed_time || row.prescribedTime || '',
    confirmedAt: row.confirmed_at || row.confirmedAt || new Date().toISOString()
  };
}

// ==========================================
// SUPABASE CLIENT QUERIES
// ==========================================

export async function fetchDoctorsDB(): Promise<Doctor[]> {
  const { data, error } = await supabase.from('doctors').select('*');
  if (error) throw error;
  return (data || []).map(mapDoctorFromDB);
}

export async function fetchPatientsDB(): Promise<Patient[]> {
  const { data, error } = await supabase.from('patients').select('*');
  if (error) throw error;
  return (data || []).map(mapPatientFromDB);
}

export async function fetchLogsDB(): Promise<TrackingEntry[]> {
  const { data, error } = await supabase.from('logs').select('*');
  if (error) throw error;
  return (data || []).map(mapLogFromDB);
}

export async function fetchConfirmationsDB(): Promise<MedicationConfirmation[]> {
  const { data, error } = await supabase.from('medication_confirmations').select('*');
  if (error) throw error;
  return (data || []).map(mapConfirmationFromDB);
}

export async function fetchCredentialsDB(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from('credentials').select('*');
  if (error) throw error;
  const map: Record<string, string> = {};
  for (const row of data || []) {
    if (row.username) {
      map[row.username.toLowerCase().trim()] = row.password || '';
    }
  }
  return map;
}

// Upsert helpers
export async function saveDoctorDB(doc: Doctor): Promise<void> {
  const { error } = await supabase.from('doctors').upsert({
    id: doc.id,
    first_name: doc.firstName,
    last_name: doc.lastName,
    username: doc.username,
    email: doc.email,
    crm: doc.crm,
    requires_password_change: doc.requiresPasswordChange,
    created_at: doc.createdAt
  });
  if (error) throw error;
}

export async function savePatientDB(pat: Patient): Promise<void> {
  const payload: any = {
    id: pat.id,
    first_name: pat.firstName,
    last_name: pat.lastName,
    username: pat.username,
    diagnostic: pat.diagnostic,
    requires_password_change: pat.requiresPasswordChange,
    created_at: pat.createdAt,
    medications: pat.medications || [],
    treatment_plan: pat.treatmentPlan || null
  };

  // Embed treatment plan as a lightweight JSON string inside medications for robust fallback
  if (pat.treatmentPlan && Object.keys(pat.treatmentPlan).length > 0) {
    const backupItem = {
      id: '__treatment_plan_backup__',
      name: 'Plano de Acompanhamento (Backup)',
      dosage: JSON.stringify(pat.treatmentPlan),
      time: '00:00'
    };
    payload.medications = [...(pat.medications || []), backupItem];
  }

  // Try saving with the treatment_plan column
  const { error } = await supabase.from('patients').upsert(payload);
  
  if (error) {
    // If the error code is 42703 (undefined_column) because the column 'treatment_plan' does not exist,
    // retry saving by OMITTING the treatment_plan column from payload.
    // The scheduling of goals and attendance logs remains fully secured in the medications backup!
    if (error.code === '42703') {
      console.warn("Table patients has missing 'treatment_plan' column. Fallback to medications backup...");
      const fallbackPayload = { ...payload };
      delete fallbackPayload.treatment_plan;
      
      const { error: retryError } = await supabase.from('patients').upsert(fallbackPayload);
      if (retryError) throw retryError;
    } else {
      throw error;
    }
  }
}

export async function saveCredentialDB(username: string, pass: string): Promise<void> {
  const { error } = await supabase.from('credentials').upsert({
    username: username.toLowerCase().trim(),
    password: pass
  });
  if (error) throw error;
}

export async function saveLogDB(log: TrackingEntry): Promise<void> {
  const { error } = await supabase.from('logs').upsert({
    id: log.id,
    patient_id: log.patientId,
    diagnostic: log.diagnostic,
    timestamp: log.timestamp,
    data: log.data,
    notes: log.notes
  });
  if (error) throw error;
}

export async function saveConfirmationDB(conf: MedicationConfirmation): Promise<void> {
  const { error } = await supabase.from('medication_confirmations').upsert({
    id: conf.id,
    patient_id: conf.patientId,
    medication_id: conf.medicationId,
    medication_name: conf.medicationName,
    dosage: conf.dosage,
    prescribed_time: conf.prescribedTime,
    confirmed_at: conf.confirmedAt
  });
  if (error) throw error;
}

// Delete helpers
export async function deletePatientCascadingDB(patientId: string, username: string): Promise<void> {
  // Cascading deletes on Supabase
  await supabase.from('credentials').delete().eq('username', username.toLowerCase().trim());
  await supabase.from('patients').delete().eq('id', patientId);
  await supabase.from('logs').delete().eq('patient_id', patientId);
  await supabase.from('medication_confirmations').delete().eq('patient_id', patientId);
}
