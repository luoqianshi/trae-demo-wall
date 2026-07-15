import sys

with open(r'c:\Users\Administrator\Desktop\参赛\trae_creativity_lightburn_plate_coach.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

in_script = False
for i, line in enumerate(lines, 1):
    if '<script>' in line:
        in_script = True
        continue
    if '</script>' in line:
        break
    if not in_script:
        continue

    bt = 0  # backtick count
    sq = 0  # single quote
    dq = 0  # double quote
    esc = False
    for j, ch in enumerate(line):
        if esc:
            esc = False
            continue
        if ch == '\\':
            esc = True
            continue
        if ch == '"' and not sq:
            dq = 1 - dq
        elif ch == "'" and not dq:
            sq = 1 - sq
        elif ch == '`' and not sq and not dq:
            bt = 1 - bt
    if bt:
        print(f"Line {i}: unclosed template literal")
        print(f"  {line.rstrip()[:100]}")
    if sq:
        print(f"Line {i}: unclosed single quote")
        print(f"  {line.rstrip()[:100]}")
    if dq:
        print(f"Line {i}: unclosed double quote")
        print(f"  {line.rstrip()[:100]}")

print("Check complete")