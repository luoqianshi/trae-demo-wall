import os
from typing import List, Dict, Any, Optional
from app.utils.excel_parser import read_excel_file, write_excel_file, detect_header_row, get_column_names, get_data_rows
from app.algorithms.fingerprint import generate_student_fingerprint
from app.algorithms.similarity import calculate_student_similarity, find_closest_match, find_duplicates, find_same_name_different_class
from app.algorithms.field_matching import match_all_fields, build_field_mapping
from app.utils.file_utils import generate_file_id, get_timestamp


class StudentMatcher:
    def __init__(self, upload_dir: str, output_dir: str):
        self.upload_dir = upload_dir
        self.output_dir = output_dir
    
    def _extract_students(self, file_path: str, source_name: str = "") -> List[Dict]:
        students = []
        
        try:
            data = read_excel_file(file_path)
        except Exception:
            return students
        
        header_row = detect_header_row(data)
        headers = get_column_names(data, header_row)
        data_rows = get_data_rows(data, header_row)
        
        field_matches = match_all_fields(headers)
        field_mapping = build_field_mapping(field_matches)
        
        name_idx = field_mapping.get("name", -1)
        class_idx = field_mapping.get("class", -1)
        id_idx = field_mapping.get("student_id", -1)
        
        for row_idx, row in enumerate(data_rows):
            if name_idx < 0 or name_idx >= len(row):
                continue
            
            name = str(row[name_idx]).strip()
            if not name:
                continue
            
            class_name = str(row[class_idx]).strip() if class_idx >= 0 and class_idx < len(row) else ""
            student_id = str(row[id_idx]).strip() if id_idx >= 0 and id_idx < len(row) else ""
            
            fingerprint = generate_student_fingerprint(class_name, name, student_id)
            
            student = {
                "name": name,
                "class": class_name,
                "student_id": student_id,
                "fingerprint": fingerprint,
                "source": source_name,
                "row_index": row_idx,
                "raw_data": row,
                "headers": headers
            }
            
            students.append(student)
        
        return students
    
    def find_duplicate_students(self, file_path: str) -> Dict:
        students = self._extract_students(file_path, os.path.basename(file_path))
        
        if not students:
            return {
                "success": False,
                "error": "No students found"
            }
        
        duplicates = find_duplicates(students)
        same_name_diff_class = find_same_name_different_class(students)
        
        return {
            "success": True,
            "total_students": len(students),
            "duplicate_pairs": len(duplicates),
            "same_name_different_class": len(same_name_diff_class),
            "duplicates": [
                {
                    "student1": {"name": d[0]["name"], "class": d[0]["class"], "student_id": d[0]["student_id"]},
                    "student2": {"name": d[1]["name"], "class": d[1]["class"], "student_id": d[1]["student_id"]},
                    "similarity": d[2]
                }
                for d in duplicates
            ],
            "same_name_groups": same_name_diff_class
        }
    
    def merge_records(self, file_paths: List[str], source_names: Optional[List[str]] = None) -> Dict:
        if not file_paths:
            return {
                "success": False,
                "error": "No files provided"
            }
        
        all_students = []
        
        for idx, file_path in enumerate(file_paths):
            if not os.path.exists(file_path):
                continue
            
            source_name = source_names[idx] if source_names else os.path.basename(file_path)
            students = self._extract_students(file_path, source_name)
            all_students.extend(students)
        
        if not all_students:
            return {
                "success": False,
                "error": "No students found in any file"
            }
        
        merged_students, exact_duplicates = self._merge_by_fingerprint(all_students)
        
        output_data, output_headers = self._build_output(merged_students)
        
        file_id = generate_file_id()
        timestamp = get_timestamp()
        output_filename = f"merged_students_{file_id}_{timestamp}.xlsx"
        output_path = os.path.join(self.output_dir, output_filename)
        
        write_excel_file(output_path, output_data, output_headers)
        
        duplicate_info = self._analyze_duplicates(merged_students)
        duplicate_info["exact_duplicates"] = len(exact_duplicates)
        duplicate_info["exact_duplicate_details"] = exact_duplicates
        
        return {
            "success": True,
            "output_path": output_path,
            "output_filename": output_filename,
            "total_source_students": len(all_students),
            "merged_students": len(merged_students),
            "duplicate_info": duplicate_info,
            "source_files": len(file_paths),
            "removed_duplicates": len(exact_duplicates)
        }
    
    def _merge_by_fingerprint(self, students: List[Dict]) -> tuple:
        fingerprint_map = {}
        exact_duplicates = []
        
        seen_signatures = set()
        signature_to_student = {}
        
        for student in students:
            fp = student["fingerprint"]
            
            raw_data_str = str(student["raw_data"])
            sig_key = f"{fp}|{raw_data_str}"
            
            if sig_key in seen_signatures:
                existing = signature_to_student[sig_key]
                exact_duplicates.append({
                    "duplicate": {
                        "name": student["name"],
                        "class": student["class"],
                        "student_id": student["student_id"],
                        "source": student["source"],
                        "row_index": student["row_index"]
                    },
                    "original": {
                        "name": existing["name"],
                        "class": existing["class"],
                        "student_id": existing["student_id"],
                        "source": existing["source"],
                        "row_index": existing["row_index"]
                    }
                })
                continue
            
            seen_signatures.add(sig_key)
            signature_to_student[sig_key] = student
            
            if fp not in fingerprint_map:
                fingerprint_map[fp] = {
                    "name": student["name"],
                    "class": student["class"],
                    "student_id": student["student_id"],
                    "fingerprint": fp,
                    "sources": [],
                    "records": [],
                    "all_student_ids": set(),
                    "all_classes": set(),
                    "all_headers": set()
                }
            
            fingerprint_map[fp]["sources"].append(student["source"])
            fingerprint_map[fp]["records"].append({
                "raw_data": student["raw_data"],
                "headers": student["headers"],
                "source": student["source"]
            })
            fingerprint_map[fp]["all_classes"].add(student["class"])
            
            if student["student_id"]:
                fingerprint_map[fp]["all_student_ids"].add(student["student_id"])
                if not fingerprint_map[fp]["student_id"]:
                    fingerprint_map[fp]["student_id"] = student["student_id"]
        
        for fp, data in fingerprint_map.items():
            if len(data["all_student_ids"]) > 1:
                data["student_id"] = "; ".join(sorted(data["all_student_ids"]))
            if len(data["all_classes"]) > 1:
                data["class"] = "; ".join(sorted(data["all_classes"]))
        
        return list(fingerprint_map.values()), exact_duplicates
    
    def _analyze_duplicates(self, merged_students: List[Dict]) -> Dict:
        same_name = []
        name_groups = {}
        
        for student in merged_students:
            name_key = student["name"].upper()
            if name_key not in name_groups:
                name_groups[name_key] = []
            name_groups[name_key].append(student)
        
        for name, group in name_groups.items():
            if len(group) >= 2:
                classes = set(s["class"] for s in group)
                if len(classes) >= 2:
                    same_name.append({
                        "name": name,
                        "count": len(group),
                        "classes": list(classes)
                    })
        
        return {
            "same_name_different_class": len(same_name),
            "groups": same_name
        }
    
    def _build_output(self, merged_students: List[Dict]) -> tuple:
        all_score_headers_set = set()
        all_sources = set()
        
        for student in merged_students:
            for record in student["records"]:
                all_sources.add(record["source"])
                if record.get("headers"):
                    for header in record["headers"]:
                        if any(keyword in header for keyword in ["语文", "数学", "英语", "物理", "化学", 
                                                                 "生物", "历史", "地理", "政治", "总分", "排名",
                                                                 "分数", "成绩", "分"]):
                            all_score_headers_set.add(header)
        
        sorted_sources = sorted(all_sources)
        
        subjects = ["语文", "数学", "英语", "物理", "化学", "生物", "历史", "地理", "政治", "总分", "排名"]
        
        all_fields_ordered = []
        for subject in subjects:
            for header in all_score_headers_set:
                if subject in header and header not in all_fields_ordered:
                    all_fields_ordered.append(header)
        
        for header in all_score_headers_set:
            if header not in all_fields_ordered:
                all_fields_ordered.append(header)
        
        output_headers = ["班级", "姓名", "学号", "数据来源"]
        for source in sorted_sources:
            for field in all_fields_ordered:
                output_headers.append(f"{source}_{field}")
        
        output_data = []
        
        for student in merged_students:
            row = [
                student["class"],
                student["name"],
                student["student_id"],
                "; ".join(set(student["sources"]))
            ]
            
            score_matrix = {}
            for source in sorted_sources:
                score_matrix[source] = {}
            
            for record in student["records"]:
                source = record["source"]
                if record.get("headers"):
                    for idx, header in enumerate(record["headers"]):
                        if header in all_score_headers_set and idx < len(record["raw_data"]):
                            val = str(record["raw_data"][idx]).strip()
                            if val and val != "None":
                                score_matrix[source][header] = val
            
            for source in sorted_sources:
                for field in all_fields_ordered:
                    row.append(score_matrix[source].get(field, ""))
            
            output_data.append(row)
        
        return output_data, output_headers
    
    def track_class_changes(self, file_paths: List[str], source_names: Optional[List[str]] = None) -> Dict:
        if len(file_paths) < 2:
            return {
                "success": False,
                "error": "Need at least 2 files to track class changes"
            }
        
        all_students = []
        
        for idx, file_path in enumerate(file_paths):
            if not os.path.exists(file_path):
                continue
            
            source_name = source_names[idx] if source_names else os.path.basename(file_path)
            students = self._extract_students(file_path, source_name)
            for s in students:
                s["source_index"] = idx
            all_students.extend(students)
        
        name_groups = {}
        for student in all_students:
            name_key = student["name"].upper()
            if name_key not in name_groups:
                name_groups[name_key] = []
            name_groups[name_key].append(student)
        
        class_changes = []
        for name, group in name_groups.items():
            if len(group) >= 2:
                sources = sorted(set(s["source"] for s in group))
                classes = []
                for s in group:
                    classes.append({"source": s["source"], "class": s["class"]})
                
                class_values = list(set(c["class"] for c in classes))
                if len(class_values) >= 2:
                    class_changes.append({
                        "name": name,
                        "sources": sources,
                        "class_history": classes,
                        "changed": True
                    })
        
        return {
            "success": True,
            "total_students": len(all_students),
            "students_with_changes": len(class_changes),
            "changes": class_changes
        }