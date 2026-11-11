import io, os, glob

# 服务端规范导航链接集（10 项；服务端无 project-detail-ongoing-v2，故用 project-list 占位「项目主页（进行中）」）
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

def replace_nav(s):
    marker = '<div class="page-nav">'
    idx = s.find(marker)
    if idx == -1:
        return s, False
    # 平衡匹配 page-nav 的结束 </div>
    depth = 0
    i = idx
    end = -1
    while i < len(s):
        if s.startswith('<div', i):
            depth += 1
            i += 4
        elif s.startswith('</div>', i):
            depth -= 1
            i += 6
            if depth == 0:
                end = i
                break
        else:
            i += 1
    if end == -1:
        return s, False
    # 尝试把紧邻的注释行也纳入替换范围
    start = idx
    # 向前找到上一个 '-->' 之后到 idx 的内容是否为注释
    pre = s[:idx]
    ci = pre.rfind('<!--')
    if ci != -1 and pre.rfind('-->') > ci:
        # 注释结束到 idx 之间只含空白
        between = s[pre.rfind('-->')+3:idx]
        if between.strip() == '':
            start = ci
    # 取当前文件名作为 active
    fname = os.path.basename(current_file)
    block = build_block(fname)
    s = s[:start] + block + s[end:]
    return s, True

current_file = None
for path in sorted(glob.glob('service-miniapp/*.html')):
    current_file = path
    with io.open(path, 'r', encoding='utf-8', newline='') as f:
        s = f.read()
    new_s, changed = replace_nav(s)
    if changed:
        with io.open(path, 'w', encoding='utf-8', newline='') as f:
            f.write(new_s)
        print('updated', path)
print('done')
