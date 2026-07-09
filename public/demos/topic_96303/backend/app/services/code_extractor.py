import re
from typing import List, Tuple
from app.services.ocr_service import OCRResult


class CodeCandidate:
    def __init__(self, full_code: str, short_code: str):
        self.full_code = full_code
        self.short_code = short_code


class CodeExtractor:
    PATTERNS = [
        re.compile(r'取件码[：:]?\s*(\d{1,3})[-—–](\d{1,2})[-—–](\d{4})'),
        re.compile(r'(\d{1,3})[-—–](\d{1,2})[-—–](\d{4})\s*取件'),
        re.compile(r'(\d{1,3})[-—–](\d{1,2})[-—–](\d{4})'),
        re.compile(r'(\d{1,3})[—–](\d{1,2})[—–](\d{4})'),
        re.compile(r'(\d{4})'),
    ]

    @classmethod
    def extract_candidates(cls, ocr_results: List[OCRResult]) -> List[CodeCandidate]:
        candidates = []
        seen_codes = set()

        for result in ocr_results:
            text = result.text.strip()
            if not text:
                continue

            for pattern in cls.PATTERNS:
                matches = pattern.findall(text)
                for match in matches:
                    if len(match) == 3:
                        shelf, level, code = match
                        full_code = f"{shelf}-{level}-{code}"
                        short_code = code
                    elif len(match) == 1:
                        code = match[0]
                        if len(code) == 4 and code.isdigit():
                            full_code = code
                            short_code = code
                        else:
                            continue
                    else:
                        continue

                    if full_code not in seen_codes:
                        seen_codes.add(full_code)
                        candidates.append(CodeCandidate(full_code=full_code, short_code=short_code))

        return candidates

    @staticmethod
    def _char_similar(c1: str, c2: str) -> bool:
        similar_pairs = {
            ('0', 'O'), ('O', '0'),
            ('1', 'I'), ('I', '1'), ('1', 'l'), ('l', '1'),
            ('2', 'Z'), ('Z', '2'),
            ('5', 'S'), ('S', '5'),
            ('6', 'B'), ('B', '6'), ('6', 'G'), ('G', '6'),
            ('8', 'B'), ('B', '8'), ('8', 'S'), ('S', '8'), ('8', 'F'), ('F', '8'),
            ('9', '6'), ('6', '9'), ('9', 'G'), ('G', '9'),
            ('2', '3'), ('3', '2'),
            ('5', '8'), ('8', '5'),
            ('1', '7'), ('7', '1'),
        }
        return c1 == c2 or (c1, c2) in similar_pairs or (c2, c1) in similar_pairs

    @staticmethod
    def _levenshtein_distance(s1: str, s2: str) -> int:
        if len(s1) < len(s2):
            return CodeExtractor._levenshtein_distance(s2, s1)
        
        if len(s2) == 0:
            return len(s1)
        
        previous_row = range(len(s2) + 1)
        for i, c1 in enumerate(s1):
            current_row = [i + 1]
            for j, c2 in enumerate(s2):
                insertions = previous_row[j + 1] + 1
                deletions = current_row[j] + 1
                substitutions = previous_row[j] + (0 if CodeExtractor._char_similar(c1, c2) else 1)
                current_row.append(min(insertions, deletions, substitutions))
            previous_row = current_row
        
        return previous_row[-1]

    @staticmethod
    def _fuzzy_match(text: str, target: str) -> bool:
        if len(target) != 4:
            return False
        
        words = re.findall(r'[a-zA-Z0-9]+', text)
        
        for word in words:
            letter_count = sum(1 for c in word if c.isalpha())
            total_chars = len(word)
            
            if target.isdigit():
                if letter_count > 0:
                    continue
                
                if len(word) == 4:
                    similar_count = sum(1 for c1, c2 in zip(word, target) if c1 != c2 and CodeExtractor._char_similar(c1, c2))
                    diff_count = sum(1 for c1, c2 in zip(word, target) if c1 != c2)
                    
                    if diff_count == 1 and similar_count == 1:
                        return True
                    
                    if diff_count == 2 and similar_count >= 1:
                        return True
            else:
                letter_ratio = letter_count / total_chars if total_chars > 0 else 0
                
                if letter_ratio > 0.3:
                    continue
                
                if total_chars > 6 and letter_count > 0:
                    continue
                
                if len(word) >= 4:
                    for i in range(len(word) - 3):
                        substring = word[i:i+4]
                        if len(substring) == 4:
                            sub_letter_count = sum(1 for c in substring if c.isalpha())
                            if sub_letter_count > 2:
                                continue
                            
                            if not substring.isdigit():
                                letter_positions = [j for j, c in enumerate(substring) if c.isalpha()]
                                if letter_positions and max(letter_positions) < 3:
                                    continue
                            
                            distance = CodeExtractor._levenshtein_distance(substring, target)
                            similar_count = sum(1 for c1, c2 in zip(substring, target) if c1 != c2 and CodeExtractor._char_similar(c1, c2))
                            
                            if distance <= 2 and similar_count <= 2:
                                return True
        
        return False

    @classmethod
    def find_matching_result(cls, ocr_results: List[OCRResult], target_short_code: str) -> Tuple[List[OCRResult], bool]:
        exact_matches = []
        loose_matches = []
        fuzzy_matches = []
        
        exact_pattern = re.compile(r'(?<!\d)' + re.escape(target_short_code) + r'(?!\d)')
        
        for result in ocr_results:
            text = result.text.strip()
            if exact_pattern.search(text):
                exact_matches.append(result)
            elif cls._is_valid_loose_match(text, target_short_code):
                loose_matches.append(result)
            elif cls._fuzzy_match(text, target_short_code):
                fuzzy_matches.append(result)

        if len(exact_matches) > 0:
            if len(exact_matches) == 1:
                return exact_matches, True
            else:
                return exact_matches, False
        elif len(loose_matches) > 0:
            if len(loose_matches) == 1:
                return loose_matches, True
            else:
                return loose_matches, False
        elif len(fuzzy_matches) > 0:
            if len(fuzzy_matches) == 1:
                return fuzzy_matches, True
            else:
                return fuzzy_matches, False
        else:
            return [], False

    @staticmethod
    def _is_valid_loose_match(text: str, target: str) -> bool:
        if target in text:
            if text.isdigit() and len(text) == 4:
                return False
            
            if text.isdigit():
                digits_only = text
                if digits_only == target[:len(digits_only)] or digits_only == target[-len(digits_only):]:
                    return True
                return False
            
            return True
        return False