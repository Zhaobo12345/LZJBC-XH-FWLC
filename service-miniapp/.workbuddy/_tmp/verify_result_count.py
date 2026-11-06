# -*- coding: utf-8 -*-
"""校验结果条口径改动：结构一致 / div 净增 / CSS 配平 / 字节特征 / 内联 JS。"""
import os, re, sys
from html.parser import HTMLParser

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.abspath(os.path.join(HERE, '..', '..'))
CUR = os.path.join(BASE, 'task-list.html')
BAK = os.path.join(HERE, 'task-list.html.bak-20261105-resultcount')


class V(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack, self.bad, self.counts = [], [], {}
        self.sc = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
                   'link', 'meta', 'param', 'source', 'track', 'wbr'}

    def handle_starttag(self, t, a):
        if t in self.sc:
            return
        self.counts[t] = self.counts.get(t, 0) + 1
        self.stack.append(t)

    def handle_endtag(self, t):
        if t in self.sc:
            return
        if self.stack and self.stack[-1] == t:
            self.stack.pop()
        else:
            self.bad.append((self.stack[-1] if self.stack else None, t))


b_cur, b_bak = open(CUR, 'rb').read(), open(BAK, 'rb').read()
s_cur, s_bak = b_cur.decode('utf-8'), b_bak.decode('utf-8')
v1, v2 = V(), V()
v1.feed(s_cur); v2.feed(s_bak)
print('HTML 结构与备份一致:', 'OK' if (v1.stack == v2.stack and v1.bad == v2.bad) else 'FAIL')
for t in ('div', 'span', 'script', 'style'):
    print('  %-7s cur=%d bak=%d delta=%+d' % (t, v1.counts.get(t, 0), v2.counts.get(t, 0),
                                              v1.counts.get(t, 0) - v2.counts.get(t, 0)))


def css(s):
    return [(m.group(1).count('{'), m.group(1).count('}'))
            for m in re.finditer(r'<style[^>]*>(.*?)</style>', s, re.S)]


print('CSS 大括号 cur:', css(s_cur), ' bak:', css(s_bak))
for n, b in (('cur', b_cur), ('bak', b_bak)):
    print('BYTES %s len=%d BOM=%s CRLF=%d LF=%d' %
          (n, len(b), b[:3] == b'\xef\xbb\xbf', b.count(b'\r\n'), b.count(b'\n')))
print('script 标签 cur open=%d close=%d' %
      (len(re.findall(r'<script\b', s_cur)), s_cur.count('</script>')))
print('残留「临时/流程任务」 cur=%d' % s_cur.count('临时/流程任务'))
print('「临时任务」Tab 文案 cur=%d' % s_cur.count('data-tab="temp" onclick="switchTaskTab(\'temp\')">临时任务<'))

blocks = re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', s_cur, re.S)
js = os.path.join(HERE, '_resultcount_inline.js')
open(js, 'w', encoding='utf-8', newline='\n').write('\n;\n'.join(blocks))
print('INLINE JS blocks=%d -> %s' % (len(blocks), js))

ok = (v1.stack == v2.stack and v1.bad == v2.bad
      and v1.counts.get('div', 0) == v2.counts.get('div', 0)
      and all(a == b for a, b in css(s_cur))
      and b_cur[:3] == b_bak[:3] and b_cur.count(b'\r\n') == b_bak.count(b'\r\n') == 0
      and len(re.findall(r'<script\b', s_cur)) == s_cur.count('</script>')
      and s_cur.count('临时/流程任务') == 0)
print('VERDICT:', 'PASS' if ok else 'FAIL')
sys.exit(0 if ok else 1)
