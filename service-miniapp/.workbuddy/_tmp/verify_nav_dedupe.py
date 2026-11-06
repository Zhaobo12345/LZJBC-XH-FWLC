# -*- coding: utf-8 -*-
"""原型导航重复项去重：结构 / 字节 / 标签校验"""
import os, re, sys
from html.parser import HTMLParser

BASE = os.path.dirname(os.path.abspath(__file__))
P = os.path.normpath(os.path.join(BASE, '..', '..', 'task-list.html'))
BAK = os.path.join(BASE, 'task-list.html.bak-20261106-navdedupe')
LINE = ('        <a href="project-list.html" class="page-nav-item">项目主页（进行中）</a>\n').encode('utf-8')

b_bak = open(BAK, 'rb').read()
b_cur = open(P, 'rb').read()
s_bak, s_cur = b_bak.decode('utf-8'), b_cur.decode('utf-8')


class V(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack, self.bad = [], []
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
            self.bad.append(t)


def strip_code(s):
    """JS 模板字符串里的 <div> 不是真实 DOM，平衡校验前排除 script/style 内容"""
    s = re.sub(r'<script\b[^>]*>.*?</script>', '<script></script>', s, flags=re.S | re.I)
    s = re.sub(r'<style\b[^>]*>.*?</style>', '<style></style>', s, flags=re.S | re.I)
    return s


def state(s):
    v = V(); v.feed(strip_code(s))
    return (v.stack, v.bad)


def css(s):
    return [(m.group(1).count('{'), m.group(1).count('}'))
            for m in re.finditer(r'<style[^>]*>(.*?)</style>', s, re.S)]


def tags(s):
    return {t: (len(re.findall(r'<%s\b' % t, s)), s.count('</%s>' % t))
            for t in ('div', 'span', 'a', 'script', 'style', 'button')}


def feats(b):
    return (b[:3] == b'\xef\xbb\xbf', b.count(b'\r\n'), b.count(b'\n'))


inline = re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', s_cur, re.S)
open(os.path.join(BASE, '_navdedupe_inline.js'), 'w', encoding='utf-8').write('\n;\n'.join(inline))

tb, tc = tags(s_bak), tags(s_cur)
checks = [
    ('逐字节 = 备份删去 1 行', b_cur == b_bak.replace(LINE + LINE, LINE, 1)),
    ('仅减 1 行，BOM/LF 特征保持', feats(b_cur)[0] == feats(b_bak)[0]
     and feats(b_cur)[1] == feats(b_bak)[1]
     and feats(b_cur)[2] == feats(b_bak)[2] - 1),
    ('备份命中 2 处 / 当前 1 处', s_bak.count('项目主页（进行中）') == 2
     and s_cur.count('项目主页（进行中）') == 1),
    ('HTML 结构与备份一致', state(s_cur) == state(s_bak)),
    ('a 标签恰好 -1', tc['a'] == (tb['a'][0] - 1, tb['a'][1] - 1)),
    ('其余标签计数不变', all(tc[t] == tb[t] for t in tb if t != 'a')),
    ('CSS 两块括号一致且配平', css(s_cur) == css(s_bak)
     and all(x == y for x, y in css(s_cur))),
    ('内联 script 块存在', len(inline) >= 1),
]
for n, c in checks:
    print(('OK   ' if c else 'FAIL ') + n)
print('bytes %d -> %d | LF %d -> %d | CSS %s | tags cur=%s' %
      (len(b_bak), len(b_cur), b_bak.count(b'\n'), b_cur.count(b'\n'), css(s_cur), tc))
print('VERIFY', 'PASS' if all(c for _, c in checks) else 'FAIL')
sys.exit(0 if all(c for _, c in checks) else 1)
