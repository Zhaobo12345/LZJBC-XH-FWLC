# -*- coding: utf-8 -*-
"""task-list.html 接入 ?scope=mytasks 专用视图（与项目主页共用 MyTasksStore）。
仅改本页：head 引用 / CSS / Tab bar / 第三个互斥面板 / JS 契约与渲染。
铁律：encoding='utf-8' + newline=''（保留 18 个 BOM 与纯 LF），禁用 utf-8-sig。"""
import io

P = "task-list.html"
src = io.open(P, "r", encoding="utf-8", newline="").read()
before_bom = src.count("\ufeff")


def rep(old, new, label, cnt=1):
    global src
    n = src.count(old)
    assert n == cnt, "%s: expect %d match, got %d" % (label, cnt, n)
    src = src.replace(old, new, cnt)
    print("OK   %-44s x%d" % (label, cnt))


# ---------- 1. head 引用共享清单 ----------
rep("    <script src=\"js/flow-config-store.js\"></script>\n</head>",
    "    <script src=\"js/flow-config-store.js\"></script>\n"
    "    <script src=\"js/my-tasks-store.js\"></script>\n</head>",
    "1 head 引入 my-tasks-store.js")

# ---------- 2. CSS ----------
rep("        .main-contract.collapsed > :not(.mc-header) { display: none !important; }\n",
    "        .main-contract.collapsed > :not(.mc-header) { display: none !important; }\n\n"
    "        /* ===== 我的任务专用视图（?scope=mytasks）===== */\n"
    "        .task-tab.active[data-tab=\"mytasks\"] { background: #0F6E56; border-color: #0F6E56; color: #fff; }\n"
    "        .mt-summary { background: #E1F5EE; border: 1px solid #9FE1CB; border-radius: 12px; padding: 12px 14px; margin-bottom: 12px; }\n"
    "        .mt-sum-title { font-size: 15px; font-weight: 600; color: #04342C; }\n"
    "        .mt-sum-stats { display: flex; gap: 14px; margin-top: 8px; font-size: 13px; color: #0F6E56; }\n"
    "        .mt-sum-hint { margin-top: 6px; font-size: 12px; color: #3B6D11; }\n"
    "        .mt-flow-group { background: var(--bg-primary); border: 1px solid var(--border-color); border-left: 4px solid #0F6E56; border-radius: 12px; margin-bottom: 12px; overflow: hidden; }\n"
    "        .mt-flow-head { display: flex; align-items: center; justify-content: space-between; min-height: 44px; padding: 10px 14px; background: var(--bg-secondary); border-bottom: 1px solid var(--border-color); font-size: 15px; font-weight: 600; color: var(--text-primary); }\n"
    "        .mt-flow-count { font-size: 12px; font-weight: 400; color: var(--text-tertiary); }\n"
    "        .mt-flow-tasks .task-item { border-left: 3px solid #0F6E56; }\n",
    "2 CSS 我的任务视图")

# ---------- 3. Tab bar + 第三面板 ----------
rep("""                <div class="task-tab-bar" id="taskTabBar">
                    <button type="button" class="task-tab active" data-tab="contract" onclick="switchTaskTab('contract')">合同内任务<span class="task-tab-badge" id="tabBadgeContract">26</span></button>
                    <button type="button" class="task-tab" data-tab="temp" onclick="switchTaskTab('temp')">临时任务<span class="task-tab-badge" id="tabBadgeTemp">15</span></button>
                </div>

                <div class="task-panel is-active" id="panelContract" data-tab-panel="contract"></div>
""",
    """                <div class="task-tab-bar" id="taskTabBar">
                    <button type="button" class="task-tab" data-tab="mytasks" id="tabMyTasks" style="display:none" onclick="switchTaskTab('mytasks')">我的任务<span class="task-tab-badge" id="tabBadgeMyTasks">10</span></button>
                    <button type="button" class="task-tab active" data-tab="contract" onclick="switchTaskTab('contract')">合同内任务<span class="task-tab-badge" id="tabBadgeContract">26</span></button>
                    <button type="button" class="task-tab" data-tab="temp" onclick="switchTaskTab('temp')">临时任务<span class="task-tab-badge" id="tabBadgeTemp">15</span></button>
                </div>

                <div class="task-panel" id="panelMyTasks" data-tab-panel="mytasks"></div>
                <div class="task-panel is-active" id="panelContract" data-tab-panel="contract"></div>
""",
    "3 Tab bar + 第三互斥面板")

# ---------- 4. 全局开关 ----------
rep("        var activeTab = 'contract';\n",
    "        var activeTab = 'contract';\n"
    "        var myTasksMode = false;       // 仅 ?scope=mytasks 时为 true\n"
    "        var myTasksRole = 'nonworker'; // worker | nonworker，来自跳转参数\n",
    "4 全局 myTasksMode / myTasksRole")

# ---------- 5. 渲染函数（插在 refresh 之前） ----------
rep("        function refresh() {\n",
    """        // ===== 我的任务专用视图：与项目主页共用 MyTasksStore 清单 =====
        var MT_STATUS = {
            pending:    { dot: '○',  text: '待开始', cls: 'pending' },
            confirming: { dot: '⏳', text: '确认中', cls: 'confirming' },
            completed:  { dot: '✓',  text: '已完成', cls: 'completed' }
        };
        function mtRow(t) {
            var st = MT_STATUS[t.status] || MT_STATUS.pending;
            var meta = (t.type === 'temp' ? '临时任务' : '合同内任务') +
                (t.stage ? ' · ' + escTxt(t.stage) : '') +
                (t.contract ? ' · ' + escTxt(t.contract) : '');
            return '<div class="task-item" data-type="' + t.type + '" data-status="' + t.status +
                '" data-priority="normal" data-participant="true" data-flow-id="' + escTxt(t.flowId) +
                '" data-mt-id="' + escTxt(t.id) + '" onclick="goToTaskDetail(this)">' +
                '<div class="task-status ' + st.cls + '">' + st.dot + '</div>' +
                '<div class="task-info"><div class="task-name">' + escTxt(t.name) + '</div>' +
                '<div class="task-meta">' + meta + '</div></div>' +
                '<div class="task-status-text ' + st.cls + '"><span class="status-icon">' + st.dot + '</span>' + st.text + '</div></div>';
        }
        function renderMyTasksPanel(cfg) {
            var panel = document.getElementById('panelMyTasks');
            if (!panel || !window.MyTasksStore) return;
            var s = MyTasksStore.summary(myTasksRole);
            var groups = MyTasksStore.byFlow(myTasksRole, cfg || cfgList());
            var h = '<div class="mt-summary"><div class="mt-sum-title">我的任务 · 共 ' + s.total + ' 条</div>' +
                '<div class="mt-sum-stats"><span>待处理 ' + s.pending + '</span><span>确认中 ' + s.confirming +
                '</span><span>已完成 ' + s.completed + '</span></div>' +
                '<div class="mt-sum-hint">按服务流程项分组 · 名称与数量由配置驱动</div></div>';
            groups.forEach(function (g) {
                h += '<div class="mt-flow-group" data-flow-id="' + escTxt(g.id) + '">' +
                    '<div class="mt-flow-head"><span>' + escTxt(g.name) + '</span><span class="mt-flow-count">' +
                    g.items.length + ' 条</span></div><div class="mt-flow-tasks">' +
                    g.items.map(mtRow).join('') + '</div></div>';
            });
            if (!groups.length) h += '<div class="block-empty">该视角暂无我的任务</div>';
            panel.innerHTML = h;
            var badge = document.getElementById('tabBadgeMyTasks');
            if (badge) badge.textContent = s.total;
        }

        function refresh() {
""",
    "5 新增 mtRow / renderMyTasksPanel")

# ---------- 6. switchTaskTab 支持 mytasks ----------
rep("""        function switchTaskTab(tab) {
            activeTab = (tab === 'temp') ? 'temp' : 'contract';
            var pc = document.getElementById('panelContract');
            var pt = document.getElementById('panelTemp');
            if (pc) pc.classList.toggle('is-active', activeTab === 'contract');
            if (pt) pt.classList.toggle('is-active', activeTab === 'temp');
            document.querySelectorAll('#taskTabBar .task-tab').forEach(function (b) {
                b.classList.toggle('active', b.getAttribute('data-tab') === activeTab);
            });
            try {
                var content = document.querySelector('.page-content');
                var rail = document.getElementById('flowRail');
                if (content && rail && content.scrollTop !== undefined) content.scrollTop = Math.max(0, (rail.offsetTop || 0) - 8);
            } catch (e) {}
            refresh();
        }
""",
    """        function switchTaskTab(tab) {
            activeTab = (tab === 'temp') ? 'temp' : ((tab === 'mytasks' && myTasksMode) ? 'mytasks' : 'contract');
            var pc = document.getElementById('panelContract');
            var pt = document.getElementById('panelTemp');
            var pm = document.getElementById('panelMyTasks');
            if (pc) pc.classList.toggle('is-active', activeTab === 'contract');
            if (pt) pt.classList.toggle('is-active', activeTab === 'temp');
            if (pm) pm.classList.toggle('is-active', activeTab === 'mytasks');
            document.querySelectorAll('#taskTabBar .task-tab').forEach(function (b) {
                b.classList.toggle('active', b.getAttribute('data-tab') === activeTab);
            });
            var rail = document.getElementById('flowRail');
            if (rail) rail.style.display = activeTab === 'mytasks' ? 'none' : '';
            var eab = document.querySelector('.expand-all-btn');
            if (eab) eab.style.display = activeTab === 'mytasks' ? 'none' : '';
            try {
                var content = document.querySelector('.page-content');
                if (content && rail && content.scrollTop !== undefined) content.scrollTop = Math.max(0, (rail.offsetTop || 0) - 8);
            } catch (e) {}
            refresh();
        }
""",
    "6 switchTaskTab 支持 mytasks")

# ---------- 7. activeTaskScope ----------
rep("        function activeTaskScope() {\n            var panel = document.querySelector('.task-panel.is-active');",
    "        function activeTaskScope() {\n"
    "            if (activeTab === 'mytasks') return document.getElementById('panelMyTasks');\n"
    "            var panel = document.querySelector('.task-panel.is-active');",
    "7 activeTaskScope 指向我的任务面板")

# ---------- 8. applyFlowCfg 配置变更后重渲染 ----------
rep("            applyCfgNames(cfg);\n            renderFlowRail(cfg);",
    "            applyCfgNames(cfg);\n"
    "            if (myTasksMode) renderMyTasksPanel(cfg);\n"
    "            renderFlowRail(cfg);",
    "8 applyFlowCfg 重渲染我的任务")

# ---------- 9. deriveStats 徽标 ----------
rep("            if (bt) bt.textContent = count(pt, activeFlowId);\n",
    "            if (bt) bt.textContent = count(pt, activeFlowId);\n"
    "            var bm = document.getElementById('tabBadgeMyTasks');\n"
    "            if (bm && window.MyTasksStore) bm.textContent = MyTasksStore.summary(myTasksRole).total;\n",
    "9 deriveStats 我的任务徽标")

# ---------- 10. filterTasks 容器收敛 + 结果条文案 ----------
rep("""                scope.querySelectorAll('.temp-loose').forEach(function (lz) {
                    let n = 0;
                    lz.querySelectorAll('.task-item').forEach(function (t) { if (t.style.display !== 'none') n++; });
                    lz.style.display = n > 0 ? 'block' : 'none';
                });
            }

            document.getElementById('resultCount').textContent = '共 ' + totalVisible + ' 个任务';
""",
    """                scope.querySelectorAll('.temp-loose').forEach(function (lz) {
                    let n = 0;
                    lz.querySelectorAll('.task-item').forEach(function (t) { if (t.style.display !== 'none') n++; });
                    lz.style.display = n > 0 ? 'block' : 'none';
                });
                // 我的任务视图：按服务流程项收敛空分组并刷新组内计数
                scope.querySelectorAll('.mt-flow-group').forEach(function (g) {
                    let n = 0;
                    g.querySelectorAll('.task-item').forEach(function (t) { if (t.style.display !== 'none') n++; });
                    g.style.display = n > 0 ? 'block' : 'none';
                    let c = g.querySelector('.mt-flow-count');
                    if (c) c.textContent = n + ' 条';
                });
            }

            document.getElementById('resultCount').textContent = (activeTab === 'mytasks')
                ? '我的任务 ' + totalVisible + ' 条' : '共 ' + totalVisible + ' 个任务';
""",
    "10 收敛空分组 + 结果条文案")

# ---------- 11. DOMContentLoaded 解析契约 ----------
rep("""            // 新架构初始化：搬运旧区块 -> 配置驱动 -> 全部展开 -> 默认合同 Tab -> 默认「进行中」流程项
            migrateLegacyBlocks();
""",
    """            // 「我的任务」跳转契约：与项目主页共用 MyTasksStore 清单
            try {
                var _usp = new URLSearchParams(location.search);
                if (_usp.get('scope') === 'mytasks') {
                    myTasksMode = true;
                    myTasksRole = _usp.get('role') === 'worker' ? 'worker' : 'nonworker';
                    var _mtTab = document.getElementById('tabMyTasks');
                    if (_mtTab) _mtTab.style.display = '';
                    renderMyTasksPanel();
                }
            } catch (e) {}

            // 新架构初始化：搬运旧区块 -> 配置驱动 -> 全部展开 -> 默认我的任务/合同 Tab -> 默认「进行中」流程项
            migrateLegacyBlocks();
""",
    "11 DOMContentLoaded 解析 scope=mytasks")
rep("            switchTaskTab('contract');\n            selectFlow(defaultFlowId(_flowCfg));",
    "            switchTaskTab(myTasksMode ? 'mytasks' : 'contract');\n            selectFlow(defaultFlowId(_flowCfg));",
    "12 默认 Tab 按模式选择")

# ---------- 复验 ----------
assert src.count("\ufeff") == before_bom, "BOM count changed"
assert "\r\n" not in src, "line ending changed"
for k in ["id=\"panelMyTasks\"", "id=\"tabMyTasks\"", "function renderMyTasksPanel", "myTasksMode ? 'mytasks'"]:
    assert src.count(k) == 1, "missing/duplicate: " + k

io.open(P, "w", encoding="utf-8", newline="").write(src)
print("WROTE", P, "| chars:", len(src))
