# -*- coding: utf-8 -*-
"""服务流程 -> 项目流程（project-list.html）结构/字节/术语校验"""
import os, re, sys
from html.parser import HTMLParser

BASE = os.path.dirname(os.path.abspath(__file__))
P = os.path.normpath(os.path.join(BASE, '..', '..', 'project-list.html'))
BAK = os.path.join(BASE, 'project-list.html.bak-20261105-flowrename')
OLD = '服务流程'.encode('utf-8')
NEW = '项目流程'.encode('utf-8')

b_bak = open(BAK, 'rb').read()
b_cur = open(P, 'rb').read()
s_bak = b_bak.decode('utf-8')
s_cur = b_cur.decode('utf-8')


class V(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.bad = []
        self.sc = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
                   'link', 'meta', 'param', 'source', 'track', 'wbr'}

    def handle_starttag(self, t, a):
        if t not in self.sc:
            self.stack.append(t)

    def handle_endtag(self, t):
        if t in self.sc:
            return
        if self.stack and self.stack[-1] == t:
            self.stack.pop()
        else:
            self.bad.append((self.stack[-1] if self.stack else None, t))


def balanced(s):
    v = V()
    v.feed(s)
    return (not v.stack and not v.bad), v


def css_blocks(s):
    return [(m.group(1).count('{'), m.group(1).count('}'))
            for m in re.finditer(r'<style[^>]*>(.*?)</style>', s, re.S)]


def tags(s):
    return {t: (len(re.findall(r'<%s\b' % t, s)), s.count('</%s>' % t))
            for t in ('div', 'span', 'script', 'style', 'button')}


def feats(b):
    return (len(b), b[:3] == b'\xef\xbb\xbf', b.count(b'\r\n'), b.count(b'\n'))


ok1, v1 = balanced(s_cur)
ok2, v2 = balanced(s_bak)
inline = re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', s_cur, re.S)
open(os.path.join(BASE, '_flowrename_inline.js'), 'w', encoding='utf-8').write('\n;\n'.join(inline))

checks = [
    ('逐字节仅替换术语', b_cur == b_bak.replace(OLD, NEW)),
    ('字节/行尾特征保持', feats(b_cur) == feats(b_bak)),
    ('替换数 25', b_bak.count(OLD) == 25 and b_cur.count(NEW) == 25),
    ('残留「服务流程」= 0', b_cur.count(OLD) == 0),
    ('HTML 平衡(cur)', ok1),
    ('HTML 平衡(bak)', ok2),
    ('标签计数一致', tags(s_cur) == tags(s_bak)),
    ('CSS 括号一致且配平', css_blocks(s_cur) == css_blocks(s_bak)
     and all(a == b for a, b in css_blocks(s_cur))),
    ('卡头「项目流程」', '<span class="fh-t">项目流程 ' in s_cur),
    ('浮窗触发条「项目流程」', '<span class="ft-text">项目流程</span>' in s_cur),
    ('浮窗标题「项目流程项」', '<span class="fd-title">项目流程项</span>' in s_cur),
    ('「服务合同」未误改', s_cur.count('服务合同') == s_bak.count('服务合同')),
    ('内联 script 块存在', len(inline) >= 1),
]
for name, c in checks:
    print(('OK   ' if c else 'FAIL ') + name)
print('bytes cur=%s bak=%s | CRLF=%d LF=%d | CSS=%s | tags=%s' %
      (len(b_cur), len(b_bak), b_cur.count(b'\r\n'), b_cur.count(b'\n'),
       css_blocks(s_cur), tags(s_cur)))
print('VERIFY', 'PASS' if all(c for _, c in checks) else 'FAIL')
sys.exit(0 if all(c for _, c in checks) else 1)
