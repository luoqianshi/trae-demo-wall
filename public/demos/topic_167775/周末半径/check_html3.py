from html.parser import HTMLParser

class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.events = []
        
    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        class_name = attrs_dict.get('class', '')
        self.stack.append((tag, class_name))
        self.events.append(('start', tag, class_name, list(self.stack)))
    
    def handle_endtag(self, tag):
        if self.stack:
            last = self.stack.pop()
            self.events.append(('end', tag, last, list(self.stack)))
        else:
            self.events.append(('end', tag, None, list(self.stack)))

with open(r'C:\Users\王鹏祯\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a57566bbc0ba1b365513c2f\index.html', 'r', encoding='utf-8') as f:
    content = f.read()

parser = Parser()
parser.feed(content)

# 找到 tabbar 附近的事件
for i, e in enumerate(parser.events):
    if e[0] == 'start' and e[2] and 'tabbar' in e[2]:
        print(f'tabbar event index: {i}')
        print('Events 10 before tabbar:')
        for j in range(max(0, i-10), i):
            print(f'  {j}: {parser.events[j]}')
        print('tabbar event:')
        print(f'  {i}: {e}')
        break

print(f'\nFinal stack size: {len(parser.stack)}')
print(f'Final stack: {parser.stack[-5:]}')
