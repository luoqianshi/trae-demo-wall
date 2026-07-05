from typing import List, Dict, Tuple, Optional
from fuzzywuzzy import fuzz


COMMON_FIELDS = {
    "name": ["姓名", "名字", "学生姓名", "同学姓名", "name", "student_name"],
    "student_id": ["学号", "学生号", "编号", "id", "student_id", "number"],
    "class": ["班级", "班别", "年级", "class", "grade", "banji"],
    "gender": ["性别", "男/女", "sex", "gender"],
    "chinese": ["语文", "语文成绩", "chinese", "chinese_score"],
    "math": ["数学", "数学成绩", "math", "math_score"],
    "english": ["英语", "英语成绩", "english", "english_score"],
    "physics": ["物理", "物理成绩", "physics", "physics_score"],
    "chemistry": ["化学", "化学成绩", "chemistry", "chemistry_score"],
    "biology": ["生物", "生物成绩", "biology", "biology_score"],
    "history": ["历史", "历史成绩", "history", "history_score"],
    "geography": ["地理", "地理成绩", "geography", "geography_score"],
    "politics": ["政治", "政治成绩", "politics", "politics_score"],
    "total": ["总分", "合计", "总分成绩", "total", "sum", "total_score"],
    "rank": ["排名", "名次", "rank", "position"]
}


def match_field(header: str) -> Tuple[str, int]:
    max_score = 0
    best_match = "unknown"
    
    header_lower = str(header).strip().lower()
    
    for field_name, aliases in COMMON_FIELDS.items():
        for alias in aliases:
            score = fuzz.partial_ratio(header_lower, alias.lower())
            if score > max_score:
                max_score = score
                best_match = field_name
    
    if max_score >= 80:
        return best_match, max_score
    elif max_score >= 60:
        return best_match, max_score
    else:
        return "unknown", 0


def match_all_fields(headers: List[str]) -> List[Dict]:
    results = []
    matched_fields = set()
    
    for idx, header in enumerate(headers):
        field_name, score = match_field(header)
        
        if field_name != "unknown":
            if field_name not in matched_fields:
                matched_fields.add(field_name)
                is_primary = True
            else:
                is_primary = False
        else:
            is_primary = False
        
        results.append({
            "index": idx,
            "original_header": str(header).strip(),
            "matched_field": field_name,
            "confidence": score,
            "is_primary": is_primary
        })
    
    return results


def identify_score_fields(field_matches: List[Dict]) -> List[str]:
    score_field_names = [
        "chinese", "math", "english", "physics", "chemistry",
        "biology", "history", "geography", "politics", "total"
    ]
    
    return [fm["original_header"] for fm in field_matches 
            if fm["matched_field"] in score_field_names and fm["is_primary"]]


def build_field_mapping(field_matches: List[Dict]) -> Dict[str, int]:
    mapping = {}
    
    for fm in field_matches:
        if fm["is_primary"] and fm["matched_field"] != "unknown":
            mapping[fm["matched_field"]] = fm["index"]
    
    return mapping


def detect_subject_columns(headers: List[str]) -> List[int]:
    score_keywords = ["成绩", "分数", "分", "score", "point", "grade"]
    subject_keywords = ["语文", "数学", "英语", "物理", "化学", "生物", "历史", "地理", "政治"]
    
    subject_cols = []
    
    for idx, header in enumerate(headers):
        header_str = str(header).strip()
        header_lower = header_str.lower()
        
        has_score_keyword = any(kw in header_str for kw in score_keywords)
        has_subject_keyword = any(kw in header_str for kw in subject_keywords)
        
        if has_subject_keyword or (has_score_keyword and len(header_str) < 10):
            subject_cols.append(idx)
    
    return subject_cols


def classify_field(header: str) -> str:
    field_name, _ = match_field(header)
    
    if field_name in ["name"]:
        return "identity"
    elif field_name in ["student_id"]:
        return "identity"
    elif field_name in ["class", "grade"]:
        return "class"
    elif field_name in ["gender"]:
        return "attribute"
    elif field_name in ["chinese", "math", "english", "physics", "chemistry", 
                        "biology", "history", "geography", "politics", "total"]:
        return "score"
    elif field_name in ["rank"]:
        return "rank"
    else:
        return "unknown"


def get_required_fields() -> List[str]:
    return ["name", "class"]


def check_missing_fields(field_mapping: Dict[str, int]) -> List[str]:
    required = get_required_fields()
    return [field for field in required if field not in field_mapping]