import sys
sys.path.insert(0, '.')

from app.services.code_extractor import CodeExtractor

target_codes = ["0786", "3695", "0895", "6375", "7530", "4293", "2226", "0892", "4285"]

ocr_texts = [
    '优质服务', 'T-4359', '别/5元', '--492', 'dx', '别折/5元饺', 'PR335-24E', '4293', 
    '8-1-', '0895', '2#中号箱*260CM', '500S07F88', '7530', '环保健康·净享美味', 
    '8-1-', '3226', '25FBLLJ19', '9672', '【检验合格]', '8-1-', '6375', '7151', '9336'
]

out = open('../fuzzy_all_output.txt', 'w', encoding='utf-8')

out.write("Testing fuzzy match for all target codes:\n\n")

for code in target_codes:
    out.write(f"=== Target: '{code}' ===\n")
    
    for text in ocr_texts:
        if CodeExtractor._fuzzy_match(text, code):
            out.write(f"  MATCHED: '{text}'\n")
    
    out.write("\n")

out.close()
