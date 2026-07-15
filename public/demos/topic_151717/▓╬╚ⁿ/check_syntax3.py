import re

with open(r'c:\Users\Administrator\Desktop\参赛\trae_creativity_lightburn_plate_coach.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find script boundaries
in_script = False
script_start = 0
for i, line in enumerate(lines):
    if '<script>' in line:
        in_script = True
        script_start = i
        continue
    if '</script>' in line and in_script:
        break

# Track state across script lines
in_single = False
in_double = False
in_backtick = False
in_line_comment = False
in_block_comment = False
esc = False
brace_depth = 0
bracket_depth = 0
paren_depth = 0

for i, line in enumerate(lines):
    if i < script_start:
        continue
    if '</script>' in line:
        break
    
    j = 0
    while j < len(line):
        ch = line[j]
        
        if in_line_comment:
            break
        
        if in_block_comment:
            if j+1 < len(line) and line[j:j+2] == '*/':
                in_block_comment = False
                j += 2
                continue
            j += 1
            continue
        
        if esc:
            esc = False
            j += 1
            continue
        
        if not in_single and not in_double and not in_backtick:
            if j+1 < len(line) and line[j:j+2] == '//':
                in_line_comment = True
                break
            if j+1 < len(line) and line[j:j+2] == '/*':
                in_block_comment = True
                j += 2
                continue
        
        if ch == '\\' and (in_single or in_double or in_backtick):
            esc = True
            j += 1
            continue
        
        if not in_single and not in_double and not in_backtick:
            if ch == '"':
                in_double = True
            elif ch == "'":
                in_single = True
            elif ch == '`':
                in_backtick = True
            elif ch == '{':
                brace_depth += 1
                if brace_depth == 1:
                    # This is the problematic opening brace
                    pass
            elif ch == '}':
                brace_depth -= 1
            elif ch == '[':
                bracket_depth += 1
            elif ch == ']':
                bracket_depth -= 1
            elif ch == '(':
                paren_depth += 1
            elif ch == ')':
                paren_depth -= 1
        else:
            if in_double and ch == '"':
                in_double = False
            elif in_single and ch == "'":
                in_single = False
            elif in_backtick and ch == '`':
                in_backtick = False
        
        j += 1
    
    in_line_comment = False

# Second pass: find the position where braces go negative
in_single = False
in_double = False
in_backtick = False
in_line_comment = False
in_block_comment = False
esc = False
brace_depth = 0
bracket_depth = 0
paren_depth = 0

min_brace = 0
min_brace_line = 0
min_brace_col = 0

for i, line in enumerate(lines):
    if i < script_start:
        continue
    if '</script>' in line:
        break
    
    j = 0
    while j < len(line):
        ch = line[j]
        
        if in_line_comment:
            break
        
        if in_block_comment:
            if j+1 < len(line) and line[j:j+2] == '*/':
                in_block_comment = False
                j += 2
                continue
            j += 1
            continue
        
        if esc:
            esc = False
            j += 1
            continue
        
        if not in_single and not in_double and not in_backtick:
            if j+1 < len(line) and line[j:j+2] == '//':
                in_line_comment = True
                break
            if j+1 < len(line) and line[j:j+2] == '/*':
                in_block_comment = True
                j += 2
                continue
        
        if ch == '\\' and (in_single or in_double or in_backtick):
            esc = True
            j += 1
            continue
        
        if not in_single and not in_double and not in_backtick:
            if ch == '"':
                in_double = True
            elif ch == "'":
                in_single = True
            elif ch == '`':
                in_backtick = True
            elif ch == '{':
                brace_depth += 1
            elif ch == '}':
                brace_depth -= 1
                if brace_depth < min_brace:
                    min_brace = brace_depth
                    min_brace_line = i + 1
                    min_brace_col = j + 1
            elif ch == '[':
                bracket_depth += 1
            elif ch == ']':
                bracket_depth -= 1
            elif ch == '(':
                paren_depth += 1
            elif ch == ')':
                paren_depth -= 1
        else:
            if in_double and ch == '"':
                in_double = False
            elif in_single and ch == "'":
                in_single = False
            elif in_backtick and ch == '`':
                in_backtick = False
        
        j += 1
    
    in_line_comment = False

# If brace_depth is positive, find the last opening brace
if brace_depth > 0:
    print(f"brace_depth at end: {brace_depth}")
    # Find last opening brace
    in_single = False
    in_double = False
    in_backtick = False
    in_line_comment = False
    in_block_comment = False
    esc = False
    bd = 0
    last_open_line = 0
    last_open_col = 0
    
    for i, line in enumerate(lines):
        if i < script_start:
            continue
        if '</script>' in line:
            break
        
        j = 0
        while j < len(line):
            ch = line[j]
            
            if in_line_comment:
                break
            if in_block_comment:
                if j+1 < len(line) and line[j:j+2] == '*/':
                    in_block_comment = False
                    j += 2
                    continue
                j += 1
                continue
            if esc:
                esc = False
                j += 1
                continue
            
            if not in_single and not in_double and not in_backtick:
                if j+1 < len(line) and line[j:j+2] == '//':
                    in_line_comment = True
                    break
                if j+1 < len(line) and line[j:j+2] == '/*':
                    in_block_comment = True
                    j += 2
                    continue
            
            if ch == '\\' and (in_single or in_double or in_backtick):
                esc = True
                j += 1
                continue
            
            if not in_single and not in_double and not in_backtick:
                if ch == '"':
                    in_double = True
                elif ch == "'":
                    in_single = True
                elif ch == '`':
                    in_backtick = True
                elif ch == '{':
                    bd += 1
                    if bd == brace_depth:
                        last_open_line = i + 1
                        last_open_col = j + 1
                elif ch == '}':
                    bd -= 1
            else:
                if in_double and ch == '"':
                    in_double = False
                elif in_single and ch == "'":
                    in_single = False
                elif in_backtick and ch == '`':
                    in_backtick = False
            
            j += 1
        
        in_line_comment = False
    
    print(f"Last unmatched {{ at line {last_open_line}, col {last_open_col}")
    if last_open_line > 0:
        print(f"  Context: {lines[last_open_line-1].rstrip()[:120]}")