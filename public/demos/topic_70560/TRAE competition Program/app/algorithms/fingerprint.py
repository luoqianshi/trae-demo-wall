import hashlib
import re
from typing import Optional, Dict


def normalize_name(name: str) -> str:
    if name is None:
        return ""
    name_str = str(name).strip()
    name_str = re.sub(r'\s+', '', name_str)
    name_str = name_str.upper()
    return name_str


def normalize_class(class_name: str) -> str:
    if class_name is None:
        return ""
    class_str = str(class_name).strip()
    class_str = re.sub(r'\s+', '', class_str)
    class_str = class_str.upper()
    return class_str


def generate_student_fingerprint(class_name: str, student_name: str, 
                                 student_id: Optional[str] = None, 
                                 extra_features: Optional[Dict] = None) -> str:
    normalized_class = normalize_class(class_name)
    normalized_name = normalize_name(student_name)
    
    fingerprint_str = f"{normalized_class}|{normalized_name}"
    
    if extra_features:
        for key in sorted(extra_features.keys()):
            value = str(extra_features[key]).strip()
            fingerprint_str += f"|{key}={value}"
    
    hash_obj = hashlib.sha256(fingerprint_str.encode('utf-8'))
    return hash_obj.hexdigest()[:16]


def parse_fingerprint(fingerprint: str) -> Dict:
    return {
        "fingerprint": fingerprint,
        "is_valid": len(fingerprint) == 16 and all(c in "0123456789abcdef" for c in fingerprint.lower())
    }


def generate_class_fingerprint(class_name: str) -> str:
    normalized_class = normalize_class(class_name)
    hash_obj = hashlib.sha256(normalized_class.encode('utf-8'))
    return hash_obj.hexdigest()[:8]


def extract_fingerprint_components(fingerprint: str) -> Dict:
    return {
        "prefix": fingerprint[:8],
        "suffix": fingerprint[8:],
        "length": len(fingerprint)
    }


def is_same_student(fp1: str, fp2: str) -> bool:
    return fp1 == fp2


def is_same_class(fp1: str, fp2: str) -> bool:
    return fp1[:8] == fp2[:8]


def generate_batch_fingerprint(records: list) -> str:
    record_strings = []
    for record in records:
        class_name = record.get('class', '')
        student_name = record.get('name', '')
        student_id = record.get('student_id', '')
        fp = generate_student_fingerprint(class_name, student_name, student_id)
        record_strings.append(fp)
    
    record_strings.sort()
    combined = "|".join(record_strings)
    hash_obj = hashlib.sha256(combined.encode('utf-8'))
    return hash_obj.hexdigest()