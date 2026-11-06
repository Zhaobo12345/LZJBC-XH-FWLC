# -*- coding: utf-8 -*-
"""Tab 文案「合同内任务」→「合同任务」：本页 6 处术语统一（含注释），保持 BOM / LF。"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
HTML = os.path.join(HERE, '..', '..', 'task-list.html')
TEST = os.path.join(HERE, 'test_tasktab.js')

p = HTML
b = open(p, 'rb').read()
s = b.decode('utf-8')
n = s.count('合同内任务')
if n != 6:
    raise SystemExit('ANCHOR FAIL [task-list.html] count=%d' % n)
for i, line in enumerate(s.split('\n'), 1):
    if '合同内任务' in line:
        print('  L%-5d %s' % (i, line.strip()[:100]))
s = s.replace('合同内任务', '合同任务')
open(p, 'wb').write(s.encode('utf-8'))
print('OK  task-list.html 6 处 → 合同任务')

t = open(TEST, 'rb').read().decode('utf-8')
old = "'默认合同内任务 Tab active'"
if t.count(old) != 1:
    raise SystemExit('ANCHOR FAIL [test_tasktab.js] count=%d' % t.count(old))
t = t.replace(old, "'默认合同任务 Tab active'", 1)
open(TEST, 'wb').write(t.encode('utf-8'))
print('OK  test_tasktab.js 描述同步')
print('DONE')
