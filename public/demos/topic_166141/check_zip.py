import zipfile
import sys

with zipfile.ZipFile('dist/我是皇帝_v1.1_20260707_1158.zip', 'r') as z:
    with z.open('assets/js/app.js') as f:
        content = f.read().decode('utf-8')
        idx = content.find('function bindSettings')
        idx2 = content.find('function bindGlobalEvents')
        idx3 = content.find("querySelectorAll('[data-route]")
        print('bindSettings at:', idx)
        print('bindGlobalEvents at:', idx2)
        print('querySelector route at:', idx3)
        print()
        print('Has DOMContentLoaded:', 'DOMContentLoaded' in content)
        print('Has init() call:', 'App.init' in content)
        has_hashchange = "addEventListener('hashchange'" in content
        print('Has hashchange:', has_hashchange)
        # Find the end of file
        last_200 = content[-300:]
        print('--- last 300 chars ---')
        print(last_200)
