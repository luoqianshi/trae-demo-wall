import re

input_file = r'c:\Users\Administrator\Desktop\ai\huilv\src\data\historicalEvents.ts'
output_file = r'c:\Users\Administrator\Desktop\ai\huilv\src\data\historicalEvents_fixed.ts'

with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()

events_match = re.search(r'export const events: HistoricalEvent\[\] = \[([\s\S]*?)\];', content)
if events_match:
    events_content = events_match.group(1)
    
    def add_missing_fields(match):
        event_content = match.group(1)
        
        if 'significance:' in event_content:
            return match.group(0)
        
        id_match = re.search(r"id:\s*'([^']+)'", event_content)
        title_match = re.search(r"title:\s*'([^']+)'", event_content)
        impact_match = re.search(r"impact:\s*'([^']+)'", event_content)
        
        evt_id = id_match.group(1) if id_match else ''
        title = title_match.group(1) if title_match else ''
        impact = impact_match.group(1) if impact_match else ''
        
        background = f'{title}是历史上的重要事件，其发生有着深刻的历史背景。'
        cause = f'{title}的发生是多种因素共同作用的结果。'
        significance = f'{title}是历史上的重要事件，{impact}这一事件对当时和后世都产生了深远影响，是历史发展进程中的重要里程碑。'
        
        new_content = event_content.rstrip()
        if not new_content.endswith(','):
            new_content += ','
        
        new_content += f'''
    background: '{background}',
    cause: '{cause}',
    significance: '{significance}',
'''
        
        return '{' + new_content + '}'
    
    pattern = r'\{\s*([^}]+?)\s*\}'
    fixed_events_content = re.sub(pattern, add_missing_fields, events_content, flags=re.DOTALL)
    
    new_content = content[:events_match.start(1)] + fixed_events_content + content[events_match.end(1):]
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("Fix completed!")
else:
    print("Events array not found")