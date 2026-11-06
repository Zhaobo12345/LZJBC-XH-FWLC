# -*- coding: utf-8 -*-
"""校验 task-list.html 本轮改动：平衡 / CSS / div 净增 / 字节特征 / 抽出内联 JS。"""
import os, re, sys
from html.parser import HTMLParser

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CUR = os.path.join(BASE, 'task-list.html')
BAK = os.path.join(os.path.dirname(__file__), 'task-list.html.bak-20261105-ownband-collapse')

class V(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.bad = []
        self.counts = {}
        self.sc = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
    def handle_starttag(self, t, a):
        if t in self.sc: return
        self.counts[t] = self.counts.get(t, 0) + 1
        self.stack.append(t)
    def handle_endtag(self, t):
        if t in self.sc: return
        if self.stack and self.stack[-1] == t:
            self.stack.pop()
        else:
            self.bad.append((self.stack[-1] if self.stack else None, t))

b_cur = open(CUR, 'rb').read()
b_bak = open(BAK, 'rb').read()
s_cur = b_cur.decode('utf-8')
s_bak = b_bak.decode('utf-8')

v1, v2 = V(), V()
v1.feed(s_cur); v2.feed(s_bak)
print('HTML cur/bak 结构一致:', 'OK' if (v1.stack == v2.stack and v1.bad == v2.bad) else 'FAIL')
for t in ('div', 'span', 'script', 'style'):
    print('  %-7s cur=%d bak=%d delta=%+d' % (t, v1.counts.get(t,0), v2.counts.get(t,0), v1.counts.get(t,0)-v2.counts.get(t,0)))

# CSS 大括号按 style 块统计
def css_blocks(s):
    out = []
    for m in re.finditer(r'<style[^>]*>(.*?)</style>', s, re.S):
        body = m.group(1)
        out.append((body.count('{'), body.count('}')))
    return out
print('CSS blocks braces cur:', css_blocks(s_cur), ' bak:', css_blocks(s_bak))

# 字节特征
for name, b in (('cur', b_cur), ('bak', b_bak)):
    print('BYTES %s: len=%d BOM=%s CRLF=%d LF=%d' % (name, len(b), b[:3]==b'\xef\xbb\xbf', b.count(b'\r\n'), b.count(b'\n')))

# 抽出所有内联 <script> 供 node --check
blocks = re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', s_cur, re.S)
js_path = os.path.join(os.path.dirname(__file__), '_ownband_inline.js')
open(js_path, 'w', encoding='utf-8', newline='\n').write('\n;\n'.join(blocks))
print('INLINE JS blocks=%d -> %s' % (len(blocks), js_path))

ok = (v1.stack == v2.stack and v1.bad == v2.bad
      and v1.counts.get('div',0) == v2.counts.get('div',0)
      and all(a == b for a,b in css_blocks(s_cur))
      and b_cur[:3] == b_bak[:3] and b_cur.count(b'\r\n') == 0)
print('VERDICT:', 'PASS' if ok else 'FAIL')
sys.exit(0 if ok else 1)
