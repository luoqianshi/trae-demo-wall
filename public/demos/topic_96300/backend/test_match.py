import sys
sys.path.insert(0, '.')
from app.services.code_extractor import CodeExtractor

output = ""

def add(msg):
    global output
    output += msg + "\n"

add("Testing _fuzzy_match for 0786:")
test_cases = [
    '500S07FB8',
    '0895',
    '7530',
    '6375',
    '293',
    '3226',
    '9672',
    '7151',
    '9336',
]

for text in test_cases:
    result = CodeExtractor._fuzzy_match(text, '0786')
    add(f"  '{text}' -> {result}")

add("\nTesting Levenshtein with char similarity:")
tests = [
    ('07FB', '0786'),
    ('0786', '0786'),
    ('0895', '0786'),
]
for s1, s2 in tests:
    dist = CodeExtractor._levenshtein_distance(s1, s2)
    add(f"  '{s1}' vs '{s2}' = {dist}")

add("\nDone!")

with open("../match_output.txt", "w", encoding="utf-8") as f:
    f.write(output)
