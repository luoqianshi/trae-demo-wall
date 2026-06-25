import { useState, useCallback } from 'react';
import { doctorWorkstationService } from '@/lib/services';

export interface Warning {
  level: 'high' | 'medium' | 'low';
  type: 'allergy' | 'duplicate' | 'dosage' | 'interaction';
  drugName: string;
  message: string;
  suggestion: string;
}

export const usePrescriptionWarning = () => {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [checking, setChecking] = useState(false);

  const checkPrescription = useCallback(
    async (patientId: number, drugs: Array<{ drugId: number; num: number; days: number }>) => {
      if (!patientId || drugs.length === 0) {
        setWarnings([]);
        return { safe: true, warnings: [] };
      }

      setChecking(true);
      try {
        const result = await doctorWorkstationService.checkPrescription(patientId, drugs);
        setWarnings(result.warnings || []);
        return result;
      } catch (error) {
        console.error('检查处方失败:', error);
        return { safe: true, warnings: [] };
      } finally {
        setChecking(false);
      }
    },
    []
  );

  const clearWarnings = useCallback(() => {
    setWarnings([]);
  }, []);

  return {
    warnings,
    checking,
    checkPrescription,
    clearWarnings,
  };
};
