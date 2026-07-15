from html.parser import HTMLParser

class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        
    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        class_name = attrs_dict.get('class', '')
        self.stack.append((tag, class_name))
        if 'tabbar' in class_name:
            parent = self.stack[-2] if len(self.stack) > 1 else None
            grandparent = self.stack[-3] if len(self.stack) > 2 else None
            print(f'tabbar parent: {parent}')
            print(f'tabbar grandparent: {grandparent}')
            print(f'stack around tabbar: {self.stack[-5:]}')
    
    def handle_endtag(self, tag):
        if self.stack:
            self.stack.pop()

with open(r'C:\Users\王鹏祯\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a57566bbc0ba1b365513c2f\index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 直接检查 tabbar 前面的文本
idx = content.find('<div class="tabbar">')
print(f'tabbar index: {idx}')
print(f'50 chars before tabbar: "{content[idx-50:idx]}"')
print(f'200 chars before tabbar: "{content[idx-200:idx]}"')

parser = Parser()
parser.feed(content)
