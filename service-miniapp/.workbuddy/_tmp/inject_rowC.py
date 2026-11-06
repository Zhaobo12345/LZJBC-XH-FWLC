# -*- coding: utf-8 -*-
import io, os, sys

BASE = os.path.dirname(os.path.abspath(__file__))
P = os.path.normpath(os.path.join(BASE, '..', '..', 'task-list.html'))

raw = open(P, 'rb').read()
has_bom = raw[:3] == b'\xef\xbb\xbf'
s = raw.decode('utf-8-sig')
assert s.count('\r\n') == 0, 'CRLF unexpected'

# ---------- 1. CSS 覆盖段：UI Polish C（追加在 UI Polish B END 之后、</style> 之前） ----------
CSS = '''        /* ===== UI Polish C：两行紧凑化（rail 更矮 + 更多项计数；Tab 改下划线，整段删除即可回退） ===== */
        /* C1 第一行：nav-card 定位 + rail 行紧凑 + 右侧「更多项」覆盖层与渐隐 */
        .nav-card { position: relative; }
        .nav-card .flow-rail { padding: 4px 0 6px; }
        .nav-card .flow-rail-item { min-height: 30px; padding: 0 11px; font-size: 12px; }
        .rail-fade {
            position: absolute; right: 0; top: 4px; height: 38px; width: 132px;
            display: flex; align-items: center; justify-content: flex-end; pointer-events: none;
        }
        .rail-fade::before {
            content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 86px;
            background: linear-gradient(90deg, rgba(255,255,255,0), var(--bg-primary) 72%);
        }
        .rail-more {
            pointer-events: auto; position: relative; z-index: 2;
            min-height: 28px; padding: 0 11px; border: 1px solid #D6DEE8; border-radius: 999px;
            background: var(--bg-primary); color: var(--primary-color); font-size: 12px; font-weight: 600;
            box-shadow: 0 1px 4px rgba(0,0,0,.06); cursor: pointer; white-space: nowrap;
        }
        #flowRail.rail-expanded { overflow: visible; flex-wrap: wrap; gap: 6px; }
        #flowRail.rail-expanded .flow-rail-item { flex: 0 0 auto; }
        .nav-card.rail-expanded .rail-fade { display: none; }

        /* C2 第二行：Tab 改下划线分段，去除块感（保留 id / 徽标 / active 切换逻辑） */
        .nav-card .task-tab-bar { gap: 0; margin-bottom: 6px; border-bottom: 1px solid #EDF1F5; }
        .nav-card .task-tab {
            min-height: 34px; flex: 1; background: none; border: none; border-radius: 0;
            color: var(--text-secondary); font-size: 13px; font-weight: 500;
            position: relative; padding: 0 6px; box-shadow: none !important;
        }
        .nav-card .task-tab:hover { background: none; }
        .nav-card .task-tab.active { background: none; border: none; color: var(--primary-color); font-weight: 600; }
        .nav-card .task-tab.active[data-tab="temp"] { color: #722ED1; }
        .nav-card .task-tab.active[data-tab="mytasks"] { color: #0F6E56; }
        .nav-card .task-tab::after {
            content: ''; position: absolute; left: 18%; right: 18%; bottom: 0; height: 2px;
            background: transparent; border-radius: 2px; transition: background .2s;
        }
        .nav-card .task-tab.active::after { background: var(--primary-color); }
        .nav-card .task-tab.active[data-tab="temp"]::after { background: #722ED1; }
        .nav-card .task-tab.active[data-tab="mytasks"]::after { background: #0F6E56; }
        .nav-card .task-tab-badge {
            min-width: 18px; padding: 0 5px; border-radius: 9px; font-size: 11px;
            background: rgba(0,0,0,.06); color: var(--text-secondary); font-weight: 500;
        }
        .nav-card .task-tab.active .task-tab-badge { background: var(--status-primary-bg); color: var(--primary-color); }
        .nav-card .task-tab.active[data-tab="temp"] .task-tab-badge { background: #F9F0FF; color: #722ED1; }
        .nav-card .task-tab.active[data-tab="mytasks"] .task-tab-badge { background: #E1F5EE; color: #0F6E56; }
        /* ===== UI Polish C END ===== */
'''

anchor_css = '        /* ===== UI Polish B END ===== */\n</style>'
assert s.count(anchor_css) == 1, 'css anchor count %d' % s.count(anchor_css)
s = s.replace(anchor_css, '        /* ===== UI Polish B END ===== */\n' + CSS + '</style>')

# ---------- 2. 静态 DOM：rail 右侧覆盖层（flowRail 之后插入，不影响 rail.innerHTML） ----------
anchor_dom = '                <div class="flow-rail" id="flowRail"></div>\n'
assert s.count(anchor_dom) == 1, 'dom anchor count %d' % s.count(anchor_dom)
s = s.replace(anchor_dom, anchor_dom +
              '                <div class="rail-fade" id="railFade"><button type="button" class="rail-more" id="railMore" onclick="toggleRailMore()">+N ›</button></div>\n')

# ---------- 3. JS：renderFlowRail 末尾调用 syncRailMore + 新增两个函数 ----------
anchor_fn = '            syncRailActive();\n        }\n\n        function applyFlowCfg(cfg) {'
assert s.count(anchor_fn) == 1, 'fn anchor count %d' % s.count(anchor_fn)
s = s.replace(anchor_fn, '''            syncRailActive();
            syncRailMore();
        }

        function syncRailMore() {
            var rail = document.getElementById('flowRail');
            var more = document.getElementById('railMore');
            var fade = document.getElementById('railFade');
            if (!rail || !more) return;
            var items = rail.querySelectorAll('.flow-rail-item');
            var total = items.length;
            var cw = rail.clientWidth || (rail.parentElement ? rail.parentElement.clientWidth : 0) || 0;
            var visible = 4, sum = 0;
            if (cw > 0) {
                visible = 0;
                for (var i = 0; i < items.length; i++) {
                    var w = items[i].getBoundingClientRect().width;
                    if (w <= 0) { visible = Math.min(4, total); break; }
                    sum += w + 8;
                    if (sum <= cw) visible++;
                    else { visible = Math.min(visible + 1, total); break; }
                }
                if (visible >= total) visible = total;
            } else {
                visible = Math.min(4, total);
            }
            var hidden = total - visible;
            if (hidden <= 0) {
                more.style.display = 'none';
                if (fade) fade.style.display = 'none';
            } else {
                more.textContent = '+' + hidden + ' ›';
                more.style.display = '';
                if (fade) fade.style.display = '';
            }
        }

        function toggleRailMore() {
            var rail = document.getElementById('flowRail');
            if (!rail) return;
            var on = rail.classList.toggle('rail-expanded');
            var nc = document.getElementById('navCard');
            if (nc) nc.classList.toggle('rail-expanded', on);
            if (!on) { try { syncRailMore(); } catch (e) {} }
        }

        function applyFlowCfg(cfg) {''')

# ---------- 4. JS：selectFlow 开头，若 rail 处于展开态则点选后收起 ----------
anchor_sel = "        function selectFlow(id, quiet) {\n            if (myTasksMode && activeTab === 'mytasks' && !quiet) {"
assert s.count(anchor_sel) == 1, 'select anchor count %d' % s.count(anchor_sel)
s = s.replace(anchor_sel, '''        function selectFlow(id, quiet) {
            var _r = document.getElementById('flowRail');
            if (_r && _r.classList.contains('rail-expanded')) {
                _r.classList.remove('rail-expanded');
                var _nc = document.getElementById('navCard'); if (_nc) _nc.classList.remove('rail-expanded');
            }
            if (myTasksMode && activeTab === 'mytasks' && !quiet) {''')

# ---------- 5. JS：DOMContentLoaded 内加 resize 重算 ----------
anchor_init = "        // 初始化：重算任务总数（含顶层临时任务区）\n        filterTasks();"
assert s.count(anchor_init) == 1, 'init anchor count %d' % s.count(anchor_init)
s = s.replace(anchor_init, "        // 窗口尺寸变化时重算「更多项」计数\n            window.addEventListener('resize', function () { try { syncRailMore(); } catch (e) {} });\n\n        // 初始化：重算任务总数（含顶层临时任务区）\n        filterTasks();")

if has_bom:
    open(P, 'wb').write(b'\xef\xbb\xbf' + s.encode('utf-8'))
else:
    open(P, 'w', encoding='utf-8', newline='').write(s)
print('DONE')
