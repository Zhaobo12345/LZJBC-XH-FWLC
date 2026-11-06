# -*- coding: utf-8 -*-
"""校验方案 A：标签平衡 / CSS 配平 / 字节特征 / 不缺项 / 死函数清理 / 任务名守恒 / 内联 JS。"""
import os, re, sys
from collections import Counter
from html.parser import HTMLParser

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.abspath(os.path.join(HERE, '..', '..'))
CUR = os.path.join(BASE, 'task-list.html')
BAK = os.path.join(HERE, 'task-list.html.bak-20261105-layoutA')


class V(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack, self.bad, self.counts = [], [], {}
        self.ids = []
        self.sc = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
                   'link', 'meta', 'param', 'source', 'track', 'wbr'}

    def handle_starttag(self, t, a):
        d = dict(a)
        if d.get('id'):
            self.ids.append(d['id'])
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

bal = (v1.stack == v2.stack and v1.bad == v2.bad)
print('HTML 标签平衡（与备份一致）:', 'OK' if bal else 'FAIL',
      '| cur stack=%s bad=%s' % (v1.stack, v1.bad[:3]))
for t in ('div', 'span', 'button', 'script', 'style'):
    print('  %-7s cur=%d bak=%d delta=%+d' % (t, v1.counts.get(t, 0), v2.counts.get(t, 0),
                                              v1.counts.get(t, 0) - v2.counts.get(t, 0)))

dup = [k for k, n in Counter(v1.ids).items() if n > 1]
print('ID 唯一性:', 'OK' if not dup else 'FAIL %s' % dup)


def css(s):
    return [(m.group(1).count('{'), m.group(1).count('}'))
            for m in re.finditer(r'<style[^>]*>(.*?)</style>', s, re.S)]


c1, c2 = css(s_cur), css(s_bak)
print('CSS 大括号 cur=%s bak=%s | 每块配平=%s' %
      (c1, c2, all(a == b for a, b in c1)))
print('BYTES cur len=%d BOM=%s CRLF=%d LF=%d | bak len=%d BOM=%s CRLF=%d LF=%d' %
      (len(b_cur), b_cur[:3] == b'\xef\xbb\xbf', b_cur.count(b'\r\n'), b_cur.count(b'\n'),
       len(b_bak), b_bak[:3] == b'\xef\xbb\xbf', b_bak.count(b'\r\n'), b_bak.count(b'\n')))
print('script 标签 open=%d close=%d' %
      (len(re.findall(r'<script\b', s_cur)), s_cur.count('</script>')))

# ---- 不缺项：所有既有交互入口与新增容器 ----
NEED_IDS = ['searchInput', 'filterBtn', 'filterBtnBadge', 'toolChips', 'toolBar',
            'navCard', 'flowRail', 'taskTabBar', 'resultCount', 'taskContainer',
            'roleFilterBar', 'statusDropdownMenu', 'filterTags', 'filterSheet',
            'filterSheetMask', 'panelMyTasks', 'panelContract', 'panelTemp',
            'tabMyTasks', 'tabBadgeMyTasks', 'tabBadgeContract', 'tabBadgeTemp']
missing = [i for i in NEED_IDS if ('id="%s"' % i) not in s_cur]
print('不缺项 / 新容器 %d 项:' % len(NEED_IDS), 'OK' if not missing else 'FAIL %s' % missing)

# 逐项清点：4 胶囊 / 6 状态 / 3 Tab / rail 配置驱动 / 原有 onclick
cnt_pill = len(re.findall(r'class="quick-filter-btn[^"]*"[^>]*data-role=', s_cur))
cnt_status = len(re.findall(r'class="status-dropdown-item[^"]*"[^>]*data-status=', s_cur))
cnt_tab = len(re.findall(r'class="task-tab[^"]*"[^>]*data-tab=', s_cur))
print('筛选项清点: 4 角色胶囊=%d | 6 状态=%d | 3 Tab=%d' % (cnt_pill, cnt_status, cnt_tab))
keep_on = ['applyPill(', 'selectStatus(', 'removeFilter(', 'expandAllContracts()',
           'switchTaskTab(', 'selectFlow(', 'filterTasks()', 'toggleFilterSheet()',
           'closeFilterSheet()', 'resetAllFilters()']
lost = [k for k in keep_on if k not in s_cur]
print('既有 onclick / 新入口保留:', 'OK' if not lost else 'FAIL %s' % lost)

# ---- 死函数清理 ----
DEAD = ['function toggleFilterDropdown(', 'function closeFilterDropdown(',
        'function quickFilter(', 'function toggleMultiOption(',
        'function toggleStatusDropdown(', 'filterDropdown', 'statusSelectBtn',
        'toggleStatusDropdown(event)', 'position = \'fixed\'']
left = [d for d in DEAD if d in s_cur]
print('死函数 / 旧下拉残留:', 'OK' if not left else 'FAIL %s' % left)
print('document 点击监听残留:',
      'OK' if '!e.target.closest(\'.search-filter-bar\')' not in s_cur else 'FAIL')

# ---- 任务名守恒 ----
names_cur = re.findall(r'class="task-name">([^<]+)<', s_cur)
names_bak = re.findall(r'class="task-name">([^<]+)<', s_bak)
print('任务名守恒 cur=%d bak=%d' % (len(names_cur), len(names_bak)),
      'OK' if names_cur == names_bak else 'FAIL')

# ---- 关键逻辑零改动（文本片段仍在） ----
LOGIC = ['function taskPassesFilters(', 'function syncPills(', 'function applyPill(',
         'function selectStatus(', 'function updateFilterTags(', 'function switchTaskTab(',
         'function renderFlowRail(', 'function renderMyTasksPanel(', 'function deriveStats(',
         'function setAllExpanded(', 'function filterTasks(', 'scope=mytasks']
lost_logic = [k for k in LOGIC if k not in s_cur]
print('关键逻辑保留:', 'OK' if not lost_logic else 'FAIL %s' % lost_logic)

# ---- 内联 JS 输出供 node --check ----
blocks = re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', s_cur, re.S)
js = os.path.join(HERE, '_layoutA_inline.js')
open(js, 'w', encoding='utf-8', newline='\n').write('\n;\n'.join(blocks))
print('INLINE JS blocks=%d -> %s' % (len(blocks), js))

ok = (bal and not dup and all(a == b for a, b in c1)
      and b_cur[:3] == b_bak[:3] == b'\xef\xbb\xbf'
      and b_cur.count(b'\r\n') == b_bak.count(b'\r\n') == 0
      and len(re.findall(r'<script\b', s_cur)) == s_cur.count('</script>')
      and not missing and not lost and not left and not lost_logic
      and names_cur == names_bak
      and (cnt_pill, cnt_status, cnt_tab) == (4, 6, 3))
print('VERDICT:', 'PASS' if ok else 'FAIL')
sys.exit(0 if ok else 1)
