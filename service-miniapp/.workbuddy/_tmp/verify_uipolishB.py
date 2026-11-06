# -*- coding: utf-8 -*-
"""校验方案 B：标签平衡 / CSS 配平 / 字节特征 / 装饰节点 / 逻辑零改动 / 任务名守恒 / 内联 JS。"""
import os, re, sys
from collections import Counter
from html.parser import HTMLParser

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.abspath(os.path.join(HERE, '..', '..'))
CUR = os.path.join(BASE, 'task-list.html')
BAK = os.path.join(HERE, 'task-list.html.bak-20261106-uipolishB')


class V(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack, self.bad, self.counts, self.ids = [], [], {}, []
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
DELTA = {'div': 1, 'span': 1, 'b': 1}  # JS 模板内 3 个 span 位于 script CDATA，不计入静态标签
deltas = {}
for t in ('div', 'span', 'button', 'script', 'style', 'b', 'a'):
    d = v1.counts.get(t, 0) - v2.counts.get(t, 0)
    deltas[t] = d
    print('  %-7s cur=%d bak=%d delta=%+d' % (t, v1.counts.get(t, 0), v2.counts.get(t, 0), d))
delta_ok = all(deltas.get(k) == v for k, v in DELTA.items()) and all(
    deltas.get(k, 0) == 0 for k in ('button', 'script', 'style', 'a'))
print('标签增量受控（静态 div+1 span+1 b+1，其余 0）:', 'OK' if delta_ok else 'FAIL')

dup = [k for k, n in Counter(v1.ids).items() if n > 1]
print('ID 唯一性:', 'OK' if not dup else 'FAIL %s' % dup)


def css(s):
    return [(m.group(1).count('{'), m.group(1).count('}'))
            for m in re.finditer(r'<style[^>]*>(.*?)</style>', s, re.S)]


c1, c2 = css(s_cur), css(s_bak)
css_bal = all(a == b for a, b in c1)
css_ok = css_bal and len(c1) == len(c2) == 2 and c1[0] == c2[0] and c1[1][0] > c2[1][0]
print('CSS 大括号 cur=%s bak=%s | 每块配平=%s | 第一块零改动=%s' %
      (c1, c2, css_bal, c1[0] == c2[0]))

byte_ok = (b_cur[:3] == b_bak[:3] == b'\xef\xbb\xbf'
           and b_cur.count(b'\r\n') == b_bak.count(b'\r\n') == 0)
print('BYTES cur len=%d BOM=%s CRLF=%d LF=%d | bak len=%d BOM=%s CRLF=%d LF=%d | %s' %
      (len(b_cur), b_cur[:3] == b'\xef\xbb\xbf', b_cur.count(b'\r\n'), b_cur.count(b'\n'),
       len(b_bak), b_bak[:3] == b'\xef\xbb\xbf', b_bak.count(b'\r\n'), b_bak.count(b'\n'),
       'OK' if byte_ok else 'FAIL'))
print('script 标签 open=%d close=%d' %
      (len(re.findall(r'<script\b', s_cur)), s_cur.count('</script>')))

# ---- 装饰节点清点 ----
DECOR = {
    '结果条初始数字节点': '<span id="resultCount">共 <b class="rc-num">26</b> 个任务</span>',
    '结果条 JS 数字节点': "'我的任务 <b class=\"rc-num\">' + totalVisible",
    '结果条 JS 数字节点(普通)': "'共 <b class=\"rc-num\">' + resultTotal",
    '面板 drag handle': '<div class="fs-handle" aria-hidden="true"></div>',
    '全局空态图标': '<span class="be-icon" aria-hidden="true"></span>\n                <div class="icon">',
}
miss_decor = [k for k, v in DECOR.items() if v not in s_cur]
print('装饰节点 %d 项:' % len(DECOR), 'OK' if not miss_decor else 'FAIL %s' % miss_decor)
print('  be-icon 出现次数（静态 1 + JS 模板 3）= %d' % s_cur.count('class="be-icon"'))
be_ok = s_cur.count('class="be-icon"') == 4 and s_bak.count('class="be-icon"') == 0

# ---- 既有交互与逻辑零改动 ----
NEED_IDS = ['searchInput', 'filterBtn', 'filterBtnBadge', 'toolChips', 'toolBar',
            'navCard', 'flowRail', 'taskTabBar', 'resultCount', 'taskContainer',
            'roleFilterBar', 'statusDropdownMenu', 'filterTags', 'filterSheet',
            'filterSheetMask', 'panelMyTasks', 'panelContract', 'panelTemp',
            'tabMyTasks', 'tabBadgeMyTasks', 'tabBadgeContract', 'tabBadgeTemp']
missing = [i for i in NEED_IDS if ('id="%s"' % i) not in s_cur]
print('既有 ID 不缺项 %d 项:' % len(NEED_IDS), 'OK' if not missing else 'FAIL %s' % missing)
keep_on = ['applyPill(', 'selectStatus(', 'removeFilter(', 'expandAllContracts()',
           'switchTaskTab(', 'selectFlow(', 'filterTasks()', 'toggleFilterSheet()',
           'closeFilterSheet()', 'resetAllFilters()', 'toggleMainOwnStages(']
lost = [k for k in keep_on if k not in s_cur]
print('既有 onclick 保留:', 'OK' if not lost else 'FAIL %s' % lost)
LOGIC = ['function taskPassesFilters(', 'function syncPills(', 'function applyPill(',
         'function selectStatus(', 'function updateFilterTags(', 'function switchTaskTab(',
         'function renderFlowRail(', 'function renderMyTasksPanel(', 'function deriveStats(',
         'function setAllExpanded(', 'function filterTasks(', 'function toggleMainOwnStages(',
         'scope=mytasks', 'function taskRow(', 'function mtRow(', 'function snapshotHtml(']
lost_logic = [k for k in LOGIC if k not in s_cur]
print('关键逻辑保留:', 'OK' if not lost_logic else 'FAIL %s' % lost_logic)

cnt_pill = len(re.findall(r'class="quick-filter-btn[^"]*"[^>]*data-role=', s_cur))
cnt_status = len(re.findall(r'class="status-dropdown-item[^"]*"[^>]*data-status=', s_cur))
cnt_tab = len(re.findall(r'class="task-tab[^"]*"[^>]*data-tab=', s_cur))
print('筛选项清点: 4 胶囊=%d | 6 状态=%d | 3 Tab=%d' % (cnt_pill, cnt_status, cnt_tab))

# ---- 任务名逐字守恒 ----
names_cur = re.findall(r'class="task-name">([^<]+)<', s_cur)
names_bak = re.findall(r'class="task-name">([^<]+)<', s_bak)
print('任务名守恒 cur=%d bak=%d' % (len(names_cur), len(names_bak)),
      'OK' if names_cur == names_bak else 'FAIL')

# ---- 结果条文案不变（去掉标签后逐字一致） ----
print('结果条赋值改为 innerHTML:', 'OK' if "getElementById('resultCount').innerHTML" in s_cur else 'FAIL')

# ---- 内联 JS 输出供 node --check ----
blocks = re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', s_cur, re.S)
js = os.path.join(HERE, '_uipolishB_inline.js')
open(js, 'w', encoding='utf-8', newline='\n').write('\n;\n'.join(blocks))
print('INLINE JS blocks=%d -> %s' % (len(blocks), js))

ok = (bal and delta_ok and not dup and css_ok and byte_ok
      and len(re.findall(r'<script\b', s_cur)) == s_cur.count('</script>')
      and not miss_decor and be_ok and not missing and not lost and not lost_logic
      and (cnt_pill, cnt_status, cnt_tab) == (4, 6, 3)
      and names_cur == names_bak)
print('VERDICT:', 'PASS' if ok else 'FAIL')
sys.exit(0 if ok else 1)
