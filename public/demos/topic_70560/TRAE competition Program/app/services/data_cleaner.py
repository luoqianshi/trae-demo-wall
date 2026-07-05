import os
from typing import List, Dict, Any, Optional
from app.utils.excel_parser import (
    read_excel_file, write_excel_file, detect_header_row, get_column_names,
    get_data_rows, normalize_row, remove_empty_columns, remove_empty_rows,
    is_empty_row, validate_score
)
from app.algorithms.field_matching import (
    match_all_fields, build_field_mapping, check_missing_fields,
    identify_score_fields, detect_subject_columns
)
from app.algorithms.fingerprint import generate_student_fingerprint
from app.utils.file_utils import generate_file_id, get_timestamp


class DataCleaner:
    def __init__(self, upload_dir: str, output_dir: str):
        self.upload_dir = upload_dir
        self.output_dir = output_dir
    
    def analyze(self, file_path: str) -> Dict:
        try:
            data = read_excel_file(file_path)
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to read file: {str(e)}"
            }
        
        if not data:
            return {
                "success": False,
                "error": "Empty file"
            }
        
        header_row = detect_header_row(data)
        headers = get_column_names(data, header_row)
        data_rows = get_data_rows(data, header_row)
        
        field_matches = match_all_fields(headers)
        field_mapping = build_field_mapping(field_matches)
        missing_fields = check_missing_fields(field_mapping)
        
        dimensions = {
            "total_rows": len(data),
            "header_row": header_row,
            "data_rows": len(data_rows),
            "columns": len(headers)
        }
        
        score_fields = identify_score_fields(field_matches)
        subject_cols = detect_subject_columns(headers)
        
        return {
            "success": True,
            "filename": os.path.basename(file_path),
            "dimensions": dimensions,
            "headers": headers,
            "field_matches": field_matches,
            "field_mapping": field_mapping,
            "missing_fields": missing_fields,
            "score_fields": score_fields,
            "subject_columns": subject_cols,
            "preview_data": self._generate_preview(data_rows, headers, 10)
        }
    
    def _generate_preview(self, data_rows: List[List[Any]], headers: List[str], 
                          max_rows: int = 10) -> List[Dict]:
        preview = []
        for idx, row in enumerate(data_rows[:max_rows]):
            row_dict = {"_row_index": idx}
            for col_idx, header in enumerate(headers):
                value = row[col_idx] if col_idx < len(row) else ""
                row_dict[header] = value
            preview.append(row_dict)
        return preview
    
    def clean(self, file_path: str, custom_mapping: Optional[Dict] = None) -> Dict:
        try:
            data = read_excel_file(file_path)
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to read file: {str(e)}"
            }
        
        header_row = detect_header_row(data)
        headers = get_column_names(data, header_row)
        data_rows = get_data_rows(data, header_row)
        
        field_matches = match_all_fields(headers)
        field_mapping = build_field_mapping(field_matches)
        
        if custom_mapping:
            field_mapping.update(custom_mapping)
        
        cleaned_data, removed_count, duplicate_count, duplicates = self._remove_dirty_data(data_rows, headers, field_mapping)
        normalized_data = [normalize_row(row) for row in cleaned_data]
        
        standardized_data, standardized_headers = self._standardize_format(
            normalized_data, headers, field_mapping
        )
        
        file_id = generate_file_id()
        timestamp = get_timestamp()
        output_filename = f"cleaned_{file_id}_{timestamp}.xlsx"
        output_path = os.path.join(self.output_dir, output_filename)
        
        write_excel_file(output_path, standardized_data, standardized_headers)
        
        duplicate_details = []
        for dup in duplicates[:20]:
            row_dict = {"row_index": dup["row_index"]}
            for col_idx, header in enumerate(headers):
                value = dup["row_data"][col_idx] if col_idx < len(dup["row_data"]) else ""
                row_dict[header] = value
            duplicate_details.append(row_dict)
        
        return {
            "success": True,
            "output_path": output_path,
            "output_filename": output_filename,
            "original_rows": len(data_rows),
            "cleaned_rows": len(standardized_data),
            "removed_rows": removed_count,
            "duplicate_count": duplicate_count,
            "duplicate_details": duplicate_details,
            "field_mapping": field_mapping,
            "standardized_headers": standardized_headers
        }
    
    def _remove_dirty_data(self, data_rows: List[List[Any]], headers: List[str], 
                           field_mapping: Dict) -> tuple:
        cleaned = []
        removed = 0
        duplicate_count = 0
        duplicates = []
        seen_rows = set()
        
        name_idx = field_mapping.get("name", -1)
        class_idx = field_mapping.get("class", -1)
        
        for row_idx, row in enumerate(data_rows):
            if is_empty_row(row):
                removed += 1
                continue
            
            has_name = name_idx >= 0 and name_idx < len(row) and str(row[name_idx]).strip() != ""
            has_class = class_idx >= 0 and class_idx < len(row) and str(row[class_idx]).strip() != ""
            
            if name_idx >= 0 and not has_name:
                removed += 1
                continue
            
            row_str = str(row)
            if row_str in seen_rows:
                duplicate_count += 1
                duplicates.append({
                    "row_index": row_idx,
                    "row_data": row
                })
                removed += 1
                continue
            
            seen_rows.add(row_str)
            cleaned.append(row)
        
        return cleaned, removed, duplicate_count, duplicates
    
    def _standardize_format(self, data_rows: List[List[Any]], headers: List[str], 
                            field_mapping: Dict) -> tuple:
        STANDARD_HEADERS = ["班级", "姓名", "学号", "性别", "语文", "数学", "英语", 
                           "物理", "化学", "生物", "历史", "地理", "政治", "总分", "排名"]
        
        score_field_map = {
            "chinese": "语文",
            "math": "数学",
            "english": "英语",
            "physics": "物理",
            "chemistry": "化学",
            "biology": "生物",
            "history": "历史",
            "geography": "地理",
            "politics": "政治",
            "total": "总分",
            "rank": "排名"
        }
        
        new_mapping = {}
        for field_name, col_idx in field_mapping.items():
            if field_name in score_field_map:
                new_mapping[score_field_map[field_name]] = col_idx
            elif field_name == "name":
                new_mapping["姓名"] = col_idx
            elif field_name == "student_id":
                new_mapping["学号"] = col_idx
            elif field_name == "class":
                new_mapping["班级"] = col_idx
            elif field_name == "gender":
                new_mapping["性别"] = col_idx
        
        standardized_data = []
        for row in data_rows:
            new_row = []
            for header in STANDARD_HEADERS:
                if header in new_mapping:
                    idx = new_mapping[header]
                    value = row[idx] if idx < len(row) else ""
                else:
                    value = ""
                
                if header in ["语文", "数学", "英语", "物理", "化学", "生物", 
                             "历史", "地理", "政治", "总分"]:
                    try:
                        value = float(value)
                        if value.is_integer():
                            value = int(value)
                    except (ValueError, TypeError):
                        value = ""
                
                new_row.append(value)
            standardized_data.append(new_row)
        
        return standardized_data, STANDARD_HEADERS
    
    def validate_scores(self, data_rows: List[List[Any]], headers: List[str]) -> List[Dict]:
        issues = []
        subject_cols = detect_subject_columns(headers)
        
        for row_idx, row in enumerate(data_rows):
            for col_idx in subject_cols:
                if col_idx >= len(row):
                    continue
                
                value = row[col_idx]
                if value is not None and str(value).strip() != "":
                    if not validate_score(value):
                        issues.append({
                            "row": row_idx,
                            "column": headers[col_idx],
                            "value": value,
                            "issue": "Invalid score value"
                        })
        
        return issues
    
    def batch_clean(self, file_paths: list) -> Dict:
        results = []
        
        for file_path in file_paths:
            if not os.path.exists(file_path):
                results.append({
                    "input": file_path,
                    "success": False,
                    "error": "File not found"
                })
                continue
            
            result = self.clean(file_path)
            results.append({
                "input": file_path,
                "success": result["success"],
                "output_path": result.get("output_path", ""),
                "error": result.get("error", "")
            })
        
        total = len(results)
        success_count = sum(1 for r in results if r["success"])
        
        return {
            "total": total,
            "success": success_count,
            "failed": total - success_count,
            "results": results
        }
    
    def clean_and_merge(self, file_paths: List[str]) -> Dict:
        if not file_paths:
            return {
                "success": False,
                "error": "No files provided"
            }
        
        all_students = []
        file_results = []
        total_original_rows = 0
        total_cleaned_rows = 0
        total_removed_rows = 0
        
        for file_path in file_paths:
            if not os.path.exists(file_path):
                file_results.append({
                    "filename": os.path.basename(file_path),
                    "success": False,
                    "error": "File not found"
                })
                continue
            
            try:
                data = read_excel_file(file_path)
            except Exception as e:
                file_results.append({
                    "filename": os.path.basename(file_path),
                    "success": False,
                    "error": f"Failed to read file: {str(e)}"
                })
                continue
            
            header_row = detect_header_row(data)
            headers = get_column_names(data, header_row)
            data_rows = get_data_rows(data, header_row)
            
            field_matches = match_all_fields(headers)
            field_mapping = build_field_mapping(field_matches)
            
            cleaned_data, removed_count, _, _ = self._remove_dirty_data(data_rows, headers, field_mapping)
            normalized_data = [normalize_row(row) for row in cleaned_data]
            
            name_idx = field_mapping.get("name", -1)
            class_idx = field_mapping.get("class", -1)
            id_idx = field_mapping.get("student_id", -1)
            
            for row_idx, row in enumerate(normalized_data):
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
                    "source": os.path.basename(file_path),
                    "raw_data": row,
                    "headers": headers
                }
                
                all_students.append(student)
            
            total_original_rows += len(data_rows)
            total_cleaned_rows += len(normalized_data)
            total_removed_rows += removed_count
            
            file_results.append({
                "filename": os.path.basename(file_path),
                "success": True,
                "original_rows": len(data_rows),
                "cleaned_rows": len(normalized_data),
                "removed_rows": removed_count
            })
        
        if not all_students:
            return {
                "success": False,
                "error": "No students found after cleaning"
            }
        
        merged_students, exact_duplicates = self._merge_students(all_students)
        
        output_data, output_headers = self._build_merged_output(merged_students)
        
        file_id = generate_file_id()
        timestamp = get_timestamp()
        output_filename = f"cleaned_merged_{file_id}_{timestamp}.xlsx"
        output_path = os.path.join(self.output_dir, output_filename)
        
        write_excel_file(output_path, output_data, output_headers)
        
        return {
            "success": True,
            "output_path": output_path,
            "output_filename": output_filename,
            "total_files": len(file_paths),
            "total_original_rows": total_original_rows,
            "total_cleaned_rows": total_cleaned_rows,
            "total_removed_rows": total_removed_rows,
            "total_source_students": len(all_students),
            "merged_students": len(merged_students),
            "removed_duplicates": len(exact_duplicates),
            "file_results": file_results,
            "output_headers": output_headers
        }
    
    def _merge_students(self, students: List[Dict]) -> tuple:
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
                        "source": student["source"]
                    },
                    "original": {
                        "name": existing["name"],
                        "class": existing["class"],
                        "student_id": existing["student_id"],
                        "source": existing["source"]
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
                    "all_classes": set()
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
    
    def _build_merged_output(self, merged_students: List[Dict]) -> tuple:
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