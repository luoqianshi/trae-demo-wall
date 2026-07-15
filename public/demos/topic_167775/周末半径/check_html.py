from html.parser import HTMLParser

class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.tabbar_parent = None
        self.screen_children = []
        self.in_screen = False
        
    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        class_name = attrs_dict.get('class', '')
        self.stack.append((tag, class_name))
        if 'screen' in class_name:
            self.in_screen = True
        if 'tabbar' in class_name:
            self.tabbar_parent = self.stack[-2] if len(self.stack) > 1 else None
            print(f'tabbar parent: {self.stack[-2]}')
            print(f'tabbar grandparent: {self.stack[-3] if len(self.stack) > 2 else None}')
        if self.in_screen:
            self.screen_children.append(('start', tag, class_name))
    
    def handle_endtag(self, tag):
        if self.stack:
            last = self.stack.pop()
            if last[0] == 'div' and 'screen' in last[1]:
                self.in_screen = False
            if self.in_screen:
                self.screen_children.append(('end', tag, ''))

with open(r'C:\Users\王鹏祯\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a57566bbc0ba1b365513c2f\index.html', 'r', encoding='utf-8') as f:
    content = f.read()

parser = Parser()
parser.feed(content)
print(f'\nScreen children count: {len([c for c in parser.screen_children if c[0] == "start"])}')
for c in parser.screen_children:
    if c[0] == 'start':
        print(f'  - {c[1]}.{c[2]}')
