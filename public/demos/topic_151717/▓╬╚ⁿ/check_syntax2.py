import re

with open(r'c:\Users\Administrator\Desktop\参赛\trae_creativity_lightburn_plate_coach.html', 'r', encoding='utf-8') as f:
    content = f.read()

start = content.find('<script>')
end = content.find('</script>')
js = content[start+8:end]
lines = js.split('\n')

# Track state across lines
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
    j = 0
    while j < len(line):
        ch = line[j]
        
        # Handle line comments
        if in_line_comment:
            break  # rest of line is comment
        
        # Handle block comments
        if in_block_comment:
            if j+1 < len(line) and line[j:j+2] == '*/':
                in_block_comment = False
                j += 2
                continue
            j += 1
            continue
        
        # Handle escape
        if esc:
            esc = False
            j += 1
            continue
        
        # Check for comment start
        if not in_single and not in_double and not in_backtick:
            if j+1 < len(line) and line[j:j+2] == '//':
                in_line_comment = True
                break
            if j+1 < len(line) and line[j:j+2] == '/*':
                in_block_comment = True
                j += 2
                continue
        
        # Handle escape character
        if ch == '\\' and (in_single or in_double or in_backtick):
            esc = True
            j += 1
            continue
        
        # Handle string/template boundaries
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
    
    # Reset line comment at end of line
    in_line_comment = False

print(f"After processing all lines:")
print(f"  in_single: {in_single}")
print(f"  in_double: {in_double}")
print(f"  in_backtick: {in_backtick}")
print(f"  in_block_comment: {in_block_comment}")
print(f"  brace_depth: {brace_depth}")
print(f"  bracket_depth: {bracket_depth}")
print(f"  paren_depth: {paren_depth}")

if in_single:
    print("ERROR: Unclosed single quote!")
elif in_double:
    print("ERROR: Unclosed double quote!")
elif in_backtick:
    print("ERROR: Unclosed template literal!")
elif in_block_comment:
    print("ERROR: Unclosed block comment!")
elif brace_depth != 0 or bracket_depth != 0 or paren_depth != 0:
    print(f"ERROR: Unbalanced brackets! brace={brace_depth}, bracket={bracket_depth}, paren={paren_depth}")
else:
    print("OK - All balanced")