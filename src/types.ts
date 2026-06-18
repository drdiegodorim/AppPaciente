/**
 * Clinical Care Plan Types
 */

export type DiagnosticType =
  | 'Enxaqueca'
  | 'Parkinson'
  | 'Demencia'
  | 'Epilepsia'
  | 'Espasticidade'
  | 'Bruxismo'
  | 'Distonia cervical'
  | 'Distonia de face'
  | 'Distonia focal'
  | 'Sialorreia';

export interface CarePlanContent {
  id: DiagnosticType;
  title: string;
  subtitle: string;
  description: string;
  guidelines: string[];
  videos: YouTubeVideo[];
  trackerConfig: TrackerConfig;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  duration: string;
  thumbnailUrl: string;
  youtubeUrl: string;
  description: string;
  audience?: 'patient' | 'companion';
}

export interface TrackerField {
  id: string;
  label: string;
  type: 'scale' | 'select' | 'boolean' | 'number' | 'text' | 'multiselect';
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface TrackerConfig {
  fields: TrackerField[];
  buttonLabel: string;
}

export interface MedicationPrescription {
  id: string;
  name: string;
  dosage: string;
  time: string; // e.g. "08:00"
}

export interface MedicationConfirmation {
  id: string;
  patientId: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  prescribedTime: string;
  confirmedAt: string; // ISO string
}

export interface TreatmentAttendance {
  id: string;
  date: string;
  type: 'consulta' | 'botox';
  notes?: string;
}

export interface TreatmentPlan {
  goals?: {
    consultas?: number;
    botox?: number;
  };
  attendances?: TreatmentAttendance[];
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  username: string; // nome.sobrenome
  diagnostic: DiagnosticType;
  requiresPasswordChange: boolean;
  createdAt: string;
  medications?: MedicationPrescription[];
  treatmentPlan?: TreatmentPlan;
}

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  username: string; // nome.sobrenome
  email: string;
  crm: string; // CRM com estado
  requiresPasswordChange: boolean;
  createdAt: string;
}

export interface UserSession {
  userId: string;
  username: string;
  role: 'doctor' | 'patient';
  patientDetails?: Patient;
  doctorDetails?: Doctor;
}

export interface TrackingEntry {
  id: string;
  patientId: string;
  diagnostic: DiagnosticType;
  timestamp: string;
  data: Record<string, any>;
  notes?: string;
}
