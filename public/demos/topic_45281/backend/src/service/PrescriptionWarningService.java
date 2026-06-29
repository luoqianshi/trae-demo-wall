package service;

import bean.Drug;
import bean.Patient;
import bean.PrescriptionItem;
import java.util.*;

public class PrescriptionWarningService {
    private PatientService patientService = new PatientService();
    private DrugService drugService = new DrugService();
    
    public Map<String, Object> checkPrescription(int patientId, List<Map<String, Object>> drugs) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> warnings = new ArrayList<>();
        
        try {
            Patient patient = patientService.getPatientById(patientId);
            if (patient == null) {
                result.put("success", false);
                result.put("message", "患者不存在");
                return result;
            }
            
            List<Drug> drugList = new ArrayList<>();
            for (Map<String, Object> drug : drugs) {
                int drugId = (Integer) drug.get("drugId");
                Drug d = drugService.getDrugById(drugId);
                if (d != null) {
                    drugList.add(d);
                }
            }
            
            warnings.addAll(checkAllergy(patient, drugList));
            warnings.addAll(checkDuplicate(drugList));
            warnings.addAll(checkDosage(drugs, drugList));
            
            result.put("success", true);
            result.put("safe", warnings.isEmpty());
            result.put("warnings", warnings);
        } catch (Exception e) {
            e.printStackTrace();
            result.put("success", false);
            result.put("message", "检查失败: " + e.getMessage());
        }
        
        return result;
    }
    
    private List<Map<String, Object>> checkAllergy(Patient patient, List<Drug> drugs) {
        List<Map<String, Object>> warnings = new ArrayList<>();
        
        if (patient.getAllergyHistory() == null || patient.getAllergyHistory().isEmpty()) {
            return warnings;
        }
        
        String[] allergies = patient.getAllergyHistory().split("[,、，]");
        
        for (Drug drug : drugs) {
            String drugName = drug.getName().toLowerCase();
            for (String allergy : allergies) {
                String allergyTrimmed = allergy.trim().toLowerCase();
                if (!allergyTrimmed.isEmpty() && drugName.contains(allergyTrimmed)) {
                    Map<String, Object> warning = new HashMap<>();
                    warning.put("level", "high");
                    warning.put("type", "allergy");
                    warning.put("drugName", drug.getName());
                    warning.put("message", "患者对" + allergy.trim() + "过敏，该药物含有相关成分！");
                    warning.put("suggestion", "建议更换为替代药物");
                    warnings.add(warning);
                }
            }
        }
        
        return warnings;
    }
    
    private List<Map<String, Object>> checkDuplicate(List<Drug> drugs) {
        List<Map<String, Object>> warnings = new ArrayList<>();
        Map<String, List<Drug>> drugNameMap = new HashMap<>();
        
        for (Drug drug : drugs) {
            String baseName = drug.getName()
                .replaceAll("(胶囊|片|缓释|控释|颗粒|口服液|注射液|注射剂)", "")
                .trim();
            
            if (!drugNameMap.containsKey(baseName)) {
                drugNameMap.put(baseName, new ArrayList<>());
            }
            drugNameMap.get(baseName).add(drug);
        }
        
        for (Map.Entry<String, List<Drug>> entry : drugNameMap.entrySet()) {
            if (entry.getValue().size() > 1) {
                Map<String, Object> warning = new HashMap<>();
                warning.put("level", "medium");
                warning.put("type", "duplicate");
                
                StringBuilder drugNames = new StringBuilder();
                for (Drug drug : entry.getValue()) {
                    if (drugNames.length() > 0) {
                        drugNames.append(" + ");
                    }
                    drugNames.append(drug.getName());
                }
                
                warning.put("drugName", drugNames.toString());
                warning.put("message", "存在重复用药，可能增加副作用风险");
                warning.put("suggestion", "建议保留其中一种");
                warnings.add(warning);
            }
        }
        
        return warnings;
    }
    
    private List<Map<String, Object>> checkDosage(List<Map<String, Object>> prescriptionDrugs, List<Drug> drugs) {
        List<Map<String, Object>> warnings = new ArrayList<>();
        
        for (Map<String, Object> prescriptionDrug : prescriptionDrugs) {
            int drugId = (Integer) prescriptionDrug.get("drugId");
            int num = prescriptionDrug.containsKey("num") ? (Integer) prescriptionDrug.get("num") : 1;
            int days = prescriptionDrug.containsKey("days") ? (Integer) prescriptionDrug.get("days") : 1;
            
            for (Drug drug : drugs) {
                if (drug.getId() == drugId) {
                    int dailyDosage = num;
                    int maxDailyDosage = 10;
                    
                    if (dailyDosage > maxDailyDosage) {
                        Map<String, Object> warning = new HashMap<>();
                        warning.put("level", "high");
                        warning.put("type", "dosage");
                        warning.put("drugName", drug.getName());
                        warning.put("message", "单次剂量超标！当前: " + dailyDosage + "，最大建议: " + maxDailyDosage);
                        warning.put("suggestion", "请调整用药剂量");
                        warnings.add(warning);
                    }
                    break;
                }
            }
        }
        
        return warnings;
    }
}
