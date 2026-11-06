# -*- coding: utf-8 -*-
"""
B 档「皮肤级对齐」：把 3 个状态/演示页的视觉基准层对齐到 project-list.html（SSOT）。
仅做 CSS 属性级替换，不改 DOM、不改定位方式、不改 card margin / detail-scroll padding。
"""
import re, os, sys

FILES = [
    'project-detail-initial-v2.html',
    'project-detail-completed-v2.html',
    'project-list-empty-demo.html',
]
TMP = '.workbuddy/_tmp'
os.makedirs(TMP, exist_ok=True)


def rule_span(s, selector):
    pat = re.compile(r'(?m)^([ \t]*)' + re.escape(selector) + r'(\s*\{)(.*?)(\})', re.S)
    m = pat.search(s)
    if not m:
        raise AssertionError('selector not found: ' + selector)
    return m, pat


def patch(s, selector, pairs, log):
    """在指定 CSS 规则块内做精确子串替换；每条必须且只能命中一次。"""
    m, _ = rule_span(s, selector)
    block = m.group(3)
    for old, new in pairs:
        n = block.count(old)
        if n != 1:
            raise AssertionError('%s :: %r 命中 %d 次' % (selector, old[:60], n))
        block = block.replace(old, new, 1)
        log.append('  %-34s %s -> %s' % (selector, old.strip()[:44], new.strip()[:44]))
    return s[:m.start(3)] + block + s[m.end(3):]


def append_to_root(s, lines, eol, indent='            ', log=[]):
    m, _ = rule_span(s, ':root')
    block = m.group(3)
    add = ''.join(eol + indent + x for x in lines)
    log.append('  :root 追加 %d 个令牌: %s' % (len(lines), ', '.join(x.split(':')[0] for x in lines)))
    return s[:m.start(4)] + add + eol + s[m.start(4):]


def insert_after_rule(s, selector, text, eol, log):
    m, _ = rule_span(s, selector)
    pos = m.end(4)
    log.append('  在 %s 后新增规则: %s' % (selector, text.split('{')[0].strip()))
    return s[:pos] + eol + text + s[pos:]


# ---------- 替换清单（old -> new 均为 CSS 属性片段） ----------
ROOT_PAIRS = [
    ('--primary-bg: #e6f7ff;', '--primary-bg: #e8f1ff;'),
    ('--success: #52c41a;', '--success: #2f9e2f;'),
    ('--success-bg: #f6ffed;', '--success-bg: #eaf7e8;'),
    ('--danger: #ff4d4f;', '--danger: #f5544f;'),
    ('--text: #222;', '--text: #1f2a3d;'),
    ('--text-2: #555;', '--text-2: #5a6b85;'),
    ('--text-3: #999;', '--text-3: #93a1b5;'),
    ('--bg: #f2f3f5;', '--bg: #eef4ff;'),
    ('--border: #ececec;', '--border: #e2eaf8;'),
    ('--shadow: 0 1px 6px rgba(0,0,0,.05);', '--shadow: 0 2px 12px rgba(22,119,255,.07);'),
    ('--bg-secondary: #F5F5F5;', '--bg-secondary: #f3f7ff;'),
]
ROOT_NEW = [
    '--bg-grad: linear-gradient(180deg, #e8f1ff 0%, #f2f6ff 26%, #f7faff 100%);',
    '--shadow-2: 0 8px 24px rgba(22,119,255,.14);',
]

PATCHES = [
    ('body', [
        ('background: #e9ebee;', 'background: linear-gradient(160deg, #d7e1f2 0%, #e9eef8 100%); color: var(--text);'),
    ]),
    ('.phone-frame', [('background: var(--bg);', 'background: var(--bg-grad);')]),
    ('.status-bar', [
        ('background: #fff;', 'background: var(--grad-brand);'),
        ('color: #000;', 'color: #fff;'),
    ]),
    ('.nav-bar', [
        ('background: #fff;', 'background: var(--grad-brand);'),
        ('border-bottom: 1px solid var(--border);', 'box-shadow: 0 2px 10px rgba(11,87,208,.18);'),
    ]),
    ('.nav-bar .title', [('color: #1a1a1a;', 'color: #fff;')]),
    ('.nav-bar .native-capsule', [
        ('border: 1px solid rgba(0,0,0,.08);', 'border: 1px solid rgba(255,255,255,.5);'),
        ('background: rgba(255,255,255,.7);', 'background: rgba(255,255,255,.22);'),
        ('color: rgba(0,0,0,.6);', 'color: #fff;'),
    ]),
    ('.nav-bar .native-capsule .nc-divider', [
        ('background: rgba(0,0,0,.1);', 'background: rgba(255,255,255,.45);'),
    ]),
    ('.page-nav', [
        ('width: 200px;', 'width: 190px;'),
        ('background: var(--bg-primary);', 'background: #fff;'),
        ('border-radius: 8px;', 'border-radius: 10px;'),
        ('padding: 16px;', 'padding: 14px;'),
        ('box-shadow: 0 2px 10px var(--shadow-md);', 'box-shadow: 0 6px 20px rgba(0,0,0,.12);'),
        ('transition: all .3s;', 'transition: max-height .3s;'),
    ]),
    ('.page-nav-title', [
        ('font-size: 14px;', 'font-size: var(--fs-13);'),
        ('font-weight: 600;', 'font-weight: 500;'),
        ('color: var(--text-primary);', 'color: var(--text);'),
    ]),
    ('.page-nav a', [
        ('padding: 8px 12px;', 'padding: 8px 10px;'),
        ('border-radius: 4px;', 'border-radius: 6px;'),
        ('color: var(--text-secondary);', 'color: var(--text-2);'),
        ('font-size: 12px;', 'font-size: var(--fs-11);'),
    ]),
    ('.page-nav a:hover', [('background-color: var(--primary-color);', 'background: var(--primary);')]),
    ('.page-nav a.active', [('background-color: var(--primary-color);', 'background: var(--primary);')]),
    ('.page-nav.collapsed', [('max-height: 60px;', 'max-height: 52px;')]),
    ('.topbar', [('border-bottom: 1px solid var(--border);', 'border-bottom: 1px solid var(--line-light);')]),
    ('.tab-bar', [
        ('height: 50px;', 'height: 52px;'),
        ('background: var(--card);', 'background: #fff;'),
        ('border-top: 1px solid var(--border);', 'border-top: 1px solid var(--line-light);'),
    ]),
    ('.tab-item', [
        ('cursor: pointer;', 'cursor: pointer; gap: 1px; color: var(--text-3);'),
    ]),
    ('.card', [
        ('border-radius: 14px;', 'border: 1px solid var(--border); border-radius: var(--r-card);'),
    ]),
]

NEW_RULE = '.status-bar .icons { filter: grayscale(1) brightness(0) invert(1); opacity: .95; }'


def process(path):
    raw = open(path, 'rb').read()
    eol = '\r\n' if raw.count(b'\r\n') == raw.count(b'\n') else '\n'
    s = raw.decode('utf-8')
    before = {
        'div': len(re.findall(r'<div\b', s)),
        'scripts': s.count('<script'),
        'styles': s.count('<style'),
        'css_open': sum(b.count('{') for b in re.findall(r'<style[^>]*>(.*?)</style>', s, re.S)),
        'css_close': sum(b.count('}') for b in re.findall(r'<style[^>]*>(.*?)</style>', s, re.S)),
    }
    log = []
    # 备份
    bak = os.path.join(TMP, path + '.bak-20261104-skin')
    with open(bak, 'wb') as f:
        f.write(raw)

    s = patch(s, ':root', ROOT_PAIRS, log)
    s = append_to_root(s, ROOT_NEW, eol, log=log)
    for selector, pairs in PATCHES:
        s = patch(s, selector, pairs, log)
    s = insert_after_rule(s, '.status-bar', NEW_RULE, eol, log)

    # ---------- 自检 ----------
    styles = re.findall(r'<style[^>]*>(.*?)</style>', s, re.S)
    after = {
        'div': len(re.findall(r'<div\b', s)),
        'scripts': s.count('<script'),
        'styles': s.count('<style'),
        'css_open': sum(b.count('{') for b in styles),
        'css_close': sum(b.count('}') for b in styles),
    }
    assert after['div'] == before['div'], 'DOM div 数变化'
    assert after['scripts'] == before['scripts'] and after['styles'] == before['styles'], 'script/style 数变化'
    assert after['css_open'] == after['css_close'] == before['css_open'] + 1, 'CSS 花括号不配平'
    assert s.count('<script') == s.count('</script>'), 'script 标签不配对'
    data = s.encode('utf-8')
    assert (data.count(b'\r\n') == data.count(b'\n')) == (eol == '\r\n'), '行尾被破坏'

    with open(path, 'wb') as f:
        f.write(data)
    print('\n===== %s =====  EOL=%s  lines=%d  patches=%d' % (
        path, 'CRLF' if eol == '\r\n' else 'LF', s.count('\n') + 1, len(log)))
    print('\n'.join(log))
    print('  [自检] DOM/CSS/行尾 全部保持，备份 -> %s (%d bytes)' % (bak, len(raw)))


for p in FILES:
    process(p)
print('\nALL DONE')
