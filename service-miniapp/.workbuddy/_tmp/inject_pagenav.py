#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os

BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

FILES = [
    "worker-contract-change.html",
    "create-contract.html",
    "project-files.html",
    "contract-preview.html",
    "activity-list-empty.html",
    "member-empty.html",
    "project-files-empty.html",
    "statement-list-empty.html",
    "todo-list-empty.html",
    "task-list-empty.html",
]

BLOCK_LINES = [
    '<!-- ===== 公共原型导航（右侧，可折叠，localStorage 记忆；样式沿用 common.css 的 .page-nav） ===== -->',
    '<div class="page-nav">',
    '  <div class="page-nav-title" title="收起 / 展开 原型导航">原型导航 <span class="toggle-btn" id="pageNavToggle">\u25bc</span></div>',
    '  <a href="home.html">\u9996\u9875</a>',
    '  <a href="project-list.html">\u9879\u76ee\u4e3b\u9875\uff08\u8fdb\u884c\u4e2d\uff09</a>',
    '  <a href="project-detail-initial-v2.html">\u9879\u76ee\u8be6\u60c5\uff08\u521d\u59cb-\u65b0\u7248\uff09</a>',
    '  <a href="project-detail-completed-v2.html">\u9879\u76ee\u8be6\u60c5\uff08\u5df2\u5b8c\u6210-\u65b0\u7248\uff09</a>',
    '  <a href="project-info.html">\u9879\u76ee\u4fe1\u606f</a>',
    '  <a href="create-project.html">\u521b\u5efa\u9879\u76ee</a>',
    '  <a href="task-list.html">\u4efb\u52a1\u5217\u8868</a>',
    '  <a href="contract-list.html">\u5408\u540c\u5217\u8868</a>',
    '  <a href="contract-detail.html">\u5408\u540c\u8be6\u60c5</a>',
    '</div>',
    '<script src="js/page-nav.js"></script>',
]

for fn in FILES:
    path = os.path.join(BASE, fn)
    with open(path, 'r', encoding='utf-8', newline='') as f:
        content = f.read()
    if 'class="page-nav"' in content:
        print('SKIP (already has page-nav):', fn)
        continue
    if '</body>' not in content:
        print('SKIP (no </body>):', fn)
        continue
    eol = '\r\n' if '\r\n' in content else '\n'
    block = eol.join(BLOCK_LINES) + eol
    new_content = content.replace('</body>', block + '</body>', 1)
    with open(path, 'w', encoding='utf-8', newline='') as f:
        f.write(new_content)
    print('INJECTED:', fn)
