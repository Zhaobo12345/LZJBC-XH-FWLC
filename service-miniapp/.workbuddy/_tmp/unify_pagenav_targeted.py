import io, os, glob

LINKS = [
    ('home.html', '首页'),
    ('project-detail-initial-v2.html', '项目详情（初始-新版）'),
    ('project-list.html', '项目主页（进行中）'),
    ('project-detail-completed-v2.html', '项目详情（已完成-新版）'),
    ('project-info.html', '项目信息'),
    ('create-project.html', '创建项目'),
    ('task-list.html', '任务列表'),
    ('task-detail.html', '任务详情'),
    ('contract-list.html', '合同列表'),
    ('contract-detail.html', '合同详情'),
]

def build_block(active_file):
    lines = [
        '<!-- ===== 公共原型导航（右侧，可折叠，localStorage 记忆；样式沿用 common.css 的 .page-nav） ===== -->',
        '<div class="page-nav">',
        '  <div class="page-nav-title" title="收起 / 展开 原型导航">原型导航 <span class="toggle-btn" id="pageNavToggle">\u25bc</span></div>',
    ]
    for href, label in LINKS:
        cls = ' class="active"' if href == active_file else ''
        lines.append('  <a href="%s"%s>%s</a>' % (href, cls, label))
    lines.append('</div>')
    return '\n'.join(lines)

def replace_nav(s, fname):
    marker = '<div class="page-nav">'
    idx = s.find(marker)
    if idx == -1:
        return s, False
    depth = 0; i = idx; end = -1
    while i < len(s):
        if s.startswith('<div', i):
            depth += 1; i += 4
        elif s.startswith('</div>', i):
            depth -= 1; i += 6
            if depth == 0:
                end = i; break
        else:
            i += 1
    if end == -1:
        return s, False
    start = idx
    pre = s[:idx]; ci = pre.rfind('<!--')
    if ci != -1 and pre.rfind('-->') > ci and s[pre.rfind('-->')+3:idx].strip() == '':
        start = ci
    block = build_block(os.path.basename(fname))
    return s[:start] + block + s[end:], True

TARGETS = [
    'worker-contract-change.html', 'create-contract.html', 'project-files.html',
    'contract-preview.html', 'activity-list-empty.html', 'member-empty.html',
    'project-files-empty.html', 'statement-list-empty.html', 'todo-list-empty.html',
    'task-list-empty.html', 'wechat-service-notice.html',
]

for name in TARGETS:
    path = os.path.join('service-miniapp', name)
    with io.open(path, 'r', encoding='utf-8', newline='') as f:
        s = f.read()
    new_s, changed = replace_nav(s, name)
    if changed:
        with io.open(path, 'w', encoding='utf-8', newline='') as f:
            f.write(new_s)
        # 确保加载 page-nav.js
        if 'js/page-nav.js' not in new_s:
            new_s = new_s.replace('</body>', '    <script src="js/page-nav.js"></script>\n</body>')
            with io.open(path, 'w', encoding='utf-8', newline='') as f:
                f.write(new_s)
        print('updated', name)
    else:
        print('SKIP (no page-nav block)', name)
print('done')
