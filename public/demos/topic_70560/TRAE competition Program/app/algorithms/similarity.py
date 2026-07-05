from typing import List, Dict, Tuple
from fuzzywuzzy import fuzz
from fuzzywuzzy import process


def calculate_name_similarity(name1: str, name2: str) -> int:
    name1_clean = str(name1).strip().upper()
    name2_clean = str(name2).strip().upper()
    
    if name1_clean == name2_clean:
        return 100
    
    return fuzz.ratio(name1_clean, name2_clean)


def calculate_class_similarity(class1: str, class2: str) -> int:
    class1_clean = str(class1).strip().upper()
    class2_clean = str(class2).strip().upper()
    
    if class1_clean == class2_clean:
        return 100
    
    return fuzz.ratio(class1_clean, class2_clean)


def calculate_student_similarity(student1: Dict, student2: Dict) -> int:
    name_sim = calculate_name_similarity(student1.get('name', ''), student2.get('name', ''))
    class_sim = calculate_class_similarity(student1.get('class', ''), student2.get('class', ''))
    
    if name_sim >= 90:
        if class_sim >= 80:
            return 95
        elif class_sim >= 50:
            return 75
        else:
            return 60
    elif name_sim >= 70:
        if class_sim >= 80:
            return 70
        else:
            return 40
    else:
        return min(name_sim, class_sim)


def find_closest_match(target: Dict, candidates: List[Dict], 
                       threshold: int = 70) -> Tuple[Dict, int]:
    best_match = None
    best_score = 0
    
    for candidate in candidates:
        score = calculate_student_similarity(target, candidate)
        if score > best_score:
            best_score = score
            best_match = candidate
    
    if best_score >= threshold and best_match:
        return best_match, best_score
    return None, 0


def find_duplicates(students: List[Dict], threshold: int = 90) -> List[Tuple[Dict, Dict, int]]:
    duplicates = []
    n = len(students)
    
    for i in range(n):
        for j in range(i + 1, n):
            score = calculate_student_similarity(students[i], students[j])
            if score >= threshold:
                duplicates.append((students[i], students[j], score))
    
    return sorted(duplicates, key=lambda x: x[2], reverse=True)


def group_by_name(students: List[Dict]) -> Dict[str, List[Dict]]:
    groups = {}
    
    for student in students:
        name_key = str(student.get('name', '')).strip().upper()
        if name_key not in groups:
            groups[name_key] = []
        groups[name_key].append(student)
    
    return groups


def find_same_name_different_class(students: List[Dict]) -> List[Dict]:
    name_groups = group_by_name(students)
    results = []
    
    for name, group in name_groups.items():
        if len(group) >= 2:
            classes = set()
            for student in group:
                class_name = str(student.get('class', '')).strip()
                classes.add(class_name)
            
            if len(classes) >= 2:
                results.extend(group)
    
    return results


def calculate_string_similarity(str1: str, str2: str) -> int:
    return fuzz.ratio(str1.strip(), str2.strip())


def select_best_match(query: str, choices: List[str], threshold: int = 60) -> Tuple[str, int]:
    matches = process.extractOne(query, choices)
    if matches:
        choice, score = matches
        if score >= threshold:
            return choice, score
    return None, 0


def calculate_overall_similarity(record1: Dict, record2: Dict, 
                                 weights: Dict = None) -> int:
    if weights is None:
        weights = {"name": 0.5, "class": 0.3, "student_id": 0.2}
    
    total_score = 0
    total_weight = 0
    
    if "name" in weights and weights["name"] > 0:
        name_score = calculate_name_similarity(record1.get('name', ''), record2.get('name', ''))
        total_score += name_score * weights["name"]
        total_weight += weights["name"]
    
    if "class" in weights and weights["class"] > 0:
        class_score = calculate_class_similarity(record1.get('class', ''), record2.get('class', ''))
        total_score += class_score * weights["class"]
        total_weight += weights["class"]
    
    if "student_id" in weights and weights["student_id"] > 0:
        id_score = 100 if str(record1.get('student_id', '')) == str(record2.get('student_id', '')) else 0
        total_score += id_score * weights["student_id"]
        total_weight += weights["student_id"]
    
    if total_weight > 0:
        return int(total_score / total_weight)
    return 0