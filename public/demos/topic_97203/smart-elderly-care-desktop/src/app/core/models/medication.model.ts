export interface Medication {
  id: number;
  elderId: number;
  name: string;
  dosage: string;
  frequency: string;
  timeOfDay: string[];
  totalDoses: number;
  takenDoses: number;
  adherenceRate: number;
  takenToday?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicationLog {
  id: number;
  medicationId: number;
  scheduledTime: string;
  taken: boolean;
  takenAt?: Date | null;
  date: string;
}
