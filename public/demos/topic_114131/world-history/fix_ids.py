import re

with open('src/data/historicalEvents.ts', 'r', encoding='utf-8') as f:
    content = f.read()

id_counts = {}
new_content = []
lines = content.split('\n')

for line in lines:
    match = re.match(r'\s*id:\s*["\']([^"\']+)["\']', line)
    if match:
        old_id = match.group(1)
        if old_id in id_counts:
            id_counts[old_id] += 1
            new_id = f"{old_id}-dup{id_counts[old_id]}"
            new_line = re.sub(r'id:\s*["\'][^"\']+["\']', f"id: '{new_id}'", line)
            new_content.append(new_line)
        else:
            id_counts[old_id] = 1
            new_content.append(line)
    else:
        new_content.append(line)

with open('src/data/historicalEvents.ts', 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_content))

print(f"Done! Processed {len(lines)} lines.")
print(f"Total unique IDs: {len(id_counts)}")
