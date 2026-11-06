# -*- coding: utf-8 -*-
import re, io
from html.parser import HTMLParser

P = 'task-list.html'
BAK = '.workbuddy/_tmp/task-list.html.bak-20261106-rowC'

def read(p):
    raw = open(p, 'rb').read()
    bom = raw[:3] == b'\xef\xbb\xbf'
    return raw, bom, raw.decode('utf-8-sig')

raw, bom, s = read(P)
raw2, _, s2 = read(BAK)

print('BOM cur=%s bak=%s' % (bom, open(BAK,'rb').read()[:3]==b'\xef\xbb\xbf'))
print('CRLF cur=%d bak=%d' % (s.count('\r\n'), s2.count('\r\n')))
print('LF   cur=%d bak=%d' % (s.count('\n'), s2.count('\n')))

# CSS 两块大括号配平
def css_braces(t):
    out = []
    for m in re.finditer(r'<style[^>]*>(.*?)</style>', t, re.S):
        b = m.group(1)
        out.append((b.count('{'), b.count('}')))
    return out
print('CSS blocks cur:', css_braces(s), 'bak:', css_braces(s2))

# HTML 标签平衡
class V(HTMLParser):
    VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
    def __init__(self):
        super().__init__(convert_charrefs=True); self.stack=[]; self.bad=[]
    def handle_starttag(self, t, a):
        if t not in self.VOID: self.stack.append(t)
    def handle_endtag(self, t):
        if t in self.VOID: return
        if self.stack and self.stack[-1] == t: self.stack.pop()
        else: self.bad.append((t, self.getpos()[0]))
def balanced(t):
    v = V(); v.feed(re.sub(r'<script\b.*?</script>', '', t, flags=re.S|re.I).replace('#', ''))
    return not v.stack and not v.bad
# script 内代码不参与 HTML 平衡，做近似：剥离 script/style 后解析
def strip_code(t):
    t = re.sub(r'<script\b[^>]*>.*?</script>', '<script></script>', t, flags=re.S|re.I)
    t = re.sub(r'<style\b[^>]*>.*?</style>', '<style></style>', t, flags=re.S|re.I)
    return t
v1 = V(); v1.feed(strip_code(s))
v2 = V(); v2.feed(strip_code(s2))
print('HTML 平衡(cur):', 'OK' if not v1.stack and not v1.bad else 'FAIL %s %s' % (v1.stack[-5:], v1.bad[:5]))
print('HTML 平衡(bak):', 'OK' if not v2.stack and not v2.bad else 'FAIL')

# 22 个 id 唯一性
ids = re.findall(r'\bid="([^"]+)"', s)
dup = set([x for x in ids if ids.count(x) > 1])
print('重复 id:', dup if dup else 'none')
for need in ['navCard','flowRail','taskTabBar','railFade','railMore','resultCount']:
    print('  id %-12s cur=%d bak=%d' % (need, s.count('id="%s"'%need), s2.count('id="%s"'%need)))

# 标签增量
def counts(t):
    c = {}
    for tag in ('div','span','button','script','style','a','b'):
        c[tag] = len(re.findall(r'<%s\b' % tag, t))
    return c
c1, c2 = counts(s), counts(s2)
print('标签计数增量:', {k: c1[k]-c2[k] for k in c1})

# 关键词守恒
for kw in ['toggleRailMore','syncRailMore','rail-expanded','UI Polish C','技术项','项目流程项']:
    print('  %-16s cur=%d bak=%d' % (kw, s.count(kw), s2.count(kw)))

# 任务名守恒：抽取 .task-item 标题（粗略：data-name 字段）
def task_names(t):
    return re.findall(r"name:\s*'([^']+)'", t)
print('任务名 cur=%d bak=%d' % (len(task_names(s)), len(task_names(s2))))

# 提取内联 JS 做 node --check
m = re.search(r'<script>(.*?)</script>', s, re.S)
open('.workbuddy/_tmp/_rowC_inline.js','w',encoding='utf-8').write(m.group(1))
print('inline js extracted bytes', len(m.group(1)))
