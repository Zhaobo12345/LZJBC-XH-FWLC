# -*- coding: utf-8 -*-
"""方案 A：我的任务视图增加服务流程项作用域（仅 task-list.html，BOM/LF 原样保留）。"""
import sys, os

P = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'task-list.html'))
raw = open(P, 'rb').read()
s = raw.decode('utf-8')

def rep(old, new, tag):
    global s
    n = s.count(old)
    if n != 1:
        print('ABORT [%s] expect 1, got %d' % (tag, n))
        sys.exit(1)
    s = s.replace(old, new, 1)
    print('OK   [%s]' % tag)

# 1. CSS：空态返回按钮 + 「全部流程项」rail 项强调
rep(
"        .mt-sum-hint { margin-top: 6px; font-size: 12px; color: #3B6D11; }\n",
"""        .mt-sum-hint { margin-top: 6px; font-size: 12px; color: #3B6D11; }
        /* 流程项作用域：空态返回汇总 + rail「全部流程项」强调 */
        .mt-back { display: inline-block; margin-top: 12px; min-height: 40px; line-height: 40px; padding: 0 16px; border: 1px solid #0F6E56; border-radius: 10px; color: #0F6E56; font-size: 13px; cursor: pointer; }
        .flow-rail-item[data-flow-id="all"] { border-color: var(--primary-color); color: var(--primary-color); }
        .flow-rail-item[data-flow-id="all"].active { color: #fff; }
""", 'css')

# 2. 作用域状态变量
rep(
"""        var myTasksRole = 'nonworker'; // worker | nonworker，来自跳转参数
        var activeFlowId = 'sg';
""",
"""        var myTasksRole = 'nonworker'; // worker | nonworker，来自跳转参数
        var myTasksFlow = 'all';       // 我的任务作用域：'all' 全部流程项 | 配置流程项 id
        var activeFlowId = 'sg';
""", 'state')

# 3. rail：我的任务视图多出「全部流程项」，高亮统一由 syncRailActive 管理
rep(
"""        function renderFlowRail(cfg) {
            var rail = document.getElementById('flowRail');
            if (!rail) return;
            rail.innerHTML = cfg.map(function (c) {
                return '<button type="button" class="flow-rail-item' + (c.id === activeFlowId ? ' active' : '') +
                    '" data-flow-id="' + escTxt(c.id) + '" onclick="selectFlow(\\'' + escTxt(c.id) + '\\')">' + escTxt(c.name) + '</button>';
            }).join('');
        }
""",
"""        function railScopeActive() {
            return (myTasksMode && activeTab === 'mytasks') ? myTasksFlow : activeFlowId;
        }
        function syncRailActive() {
            var key = railScopeActive();
            document.querySelectorAll('#flowRail .flow-rail-item').forEach(function (b) {
                b.classList.toggle('active', b.getAttribute('data-flow-id') === key);
            });
        }
        function renderFlowRail(cfg) {
            var rail = document.getElementById('flowRail');
            if (!rail) return;
            var all = '';
            if (myTasksMode && activeTab === 'mytasks') {
                all = '<button type="button" class="flow-rail-item" data-flow-id="all" onclick="selectFlow(\\'all\\')">全部流程项</button>';
            }
            rail.innerHTML = all + cfg.map(function (c) {
                return '<button type="button" class="flow-rail-item" data-flow-id="' +
                    escTxt(c.id) + '" onclick="selectFlow(\\'' + escTxt(c.id) + '\\')">' + escTxt(c.name) + '</button>';
            }).join('');
            syncRailActive();
        }
""", 'rail')

# 4. 配置改名/删除后，URL 上失效的 flow 自动回退汇总
rep(
"""            if (!exists) activeFlowId = defaultFlowId(cfg);
            buildSnapshotGroups(cfg);
""",
"""            if (!exists) activeFlowId = defaultFlowId(cfg);
            if (myTasksFlow !== 'all') {
                var mfOk = false;
                for (var j = 0; j < cfg.length; j++) if (cfg[j].id === myTasksFlow) mfOk = true;
                if (!mfOk) myTasksFlow = 'all';
            }
            buildSnapshotGroups(cfg);
""", 'cfg-guard')

# 5. selectFlow：我的任务视图只改作用域，URL 同步；普通视图行为不变
rep(
"""        function selectFlow(id, quiet) {
            activeFlowId = id;
            document.querySelectorAll('.task-panel').forEach(function (p) {
                p.querySelectorAll('.flow-group').forEach(function (g) {
                    g.classList.toggle('is-active', g.getAttribute('data-flow-id') === id);
                });
            });
            document.querySelectorAll('#flowRail .flow-rail-item').forEach(function (b) {
                b.classList.toggle('active', b.getAttribute('data-flow-id') === id);
            });
            if (!quiet) refresh();
        }
""",
"""        function syncMyTasksUrl() {
            if (!myTasksMode) return;
            try {
                var u = new URL(location.href);
                if (myTasksFlow === 'all') u.searchParams.delete('flow');
                else u.searchParams.set('flow', myTasksFlow);
                history.replaceState(null, '', u.pathname + u.search + u.hash);
            } catch (e) {}
        }

        function selectFlow(id, quiet) {
            if (myTasksMode && activeTab === 'mytasks' && !quiet) {
                // 我的任务视图：rail 只切作用域，不让 'all' 污染普通视图的 activeFlowId
                myTasksFlow = (id === 'all') ? 'all' : id;
                if (id !== 'all') {
                    activeFlowId = id;
                    document.querySelectorAll('.task-panel .flow-group').forEach(function (g) {
                        g.classList.toggle('is-active', g.getAttribute('data-flow-id') === id);
                    });
                }
                renderMyTasksPanel(cfgList());
                syncMyTasksUrl();
            } else {
                activeFlowId = id;
                document.querySelectorAll('.task-panel').forEach(function (p) {
                    p.querySelectorAll('.flow-group').forEach(function (g) {
                        g.classList.toggle('is-active', g.getAttribute('data-flow-id') === id);
                    });
                });
            }
            syncRailActive();
            if (!quiet) refresh();
        }
""", 'select-flow')

# 6. switchTaskTab：rail 常驻 + 按当前 Tab 重渲染（决定是否出现「全部流程项」）
rep(
"""            var rail = document.getElementById('flowRail');
            if (rail) rail.style.display = activeTab === 'mytasks' ? 'none' : '';
            var eab = document.querySelector('.expand-all-btn');
            if (eab) eab.style.display = activeTab === 'mytasks' ? 'none' : '';
""",
"""            var rail = document.getElementById('flowRail');
            if (rail) rail.style.display = '';
            var eab = document.querySelector('.expand-all-btn');
            if (eab) eab.style.display = activeTab === 'mytasks' ? 'none' : '';
            renderFlowRail(cfgList());
""", 'switch-tab')

# 7. Tab 徽标按当前作用域派生
rep(
"            if (bm && window.MyTasksStore) bm.textContent = MyTasksStore.summary(myTasksRole).total;\n",
"            if (bm && window.MyTasksStore) bm.textContent = myTasksScopeItems().length;\n", 'badge')

# 8. 面板渲染：按 myTasksFlow 过滤分组、概览与三态按作用域、空态可返回汇总
rep(
"""        function renderMyTasksPanel(cfg) {
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
""",
"""        function myTasksScopeItems(cfg) {
            if (!window.MyTasksStore) return [];
            var groups = MyTasksStore.byFlow(myTasksRole, cfg || cfgList());
            if (myTasksFlow !== 'all') groups = groups.filter(function (g) { return g.id === myTasksFlow; });
            var out = [];
            groups.forEach(function (g) { out = out.concat(g.items); });
            return out;
        }
        function myTasksScopeName(cfg) {
            if (myTasksFlow === 'all') return '全部流程项';
            var c = (cfg || cfgList()).filter(function (x) { return x.id === myTasksFlow; })[0];
            return c ? c.name : myTasksFlow;
        }
        function renderMyTasksPanel(cfg) {
            var panel = document.getElementById('panelMyTasks');
            if (!panel || !window.MyTasksStore) return;
            var list = myTasksScopeItems(cfg);
            var s = { pending: 0, confirming: 0, completed: 0 };
            list.forEach(function (t) { if (s[t.status] !== undefined) s[t.status] += 1; });
            var groups = MyTasksStore.byFlow(myTasksRole, cfg || cfgList());
            if (myTasksFlow !== 'all') groups = groups.filter(function (g) { return g.id === myTasksFlow; });
            var h = '<div class="mt-summary"><div class="mt-sum-title">' +
                escTxt(myTasksScopeName(cfg)) + ' · 我的任务 ' + list.length + ' 条</div>' +
                '<div class="mt-sum-stats"><span>待处理 ' + s.pending + '</span><span>确认中 ' + s.confirming +
                '</span><span>已完成 ' + s.completed + '</span></div>' +
                '<div class="mt-sum-hint">' + (myTasksFlow === 'all'
                    ? '按服务流程项分组 · 名称与数量由配置驱动'
                    : '当前流程项口径 · 选「全部流程项」查看项目汇总') + '</div></div>';
            groups.forEach(function (g) {
                h += '<div class="mt-flow-group" data-flow-id="' + escTxt(g.id) + '">' +
                    '<div class="mt-flow-head"><span>' + escTxt(g.name) + '</span><span class="mt-flow-count">' +
                    g.items.length + ' 条</span></div><div class="mt-flow-tasks">' +
                    g.items.map(mtRow).join('') + '</div></div>';
            });
            if (!groups.length) {
                h += '<div class="block-empty">该服务流程项下暂无我的任务' +
                    '<br><span class="mt-back" onclick="selectFlow(\\'all\\')">查看全部流程项</span></div>';
            }
            panel.innerHTML = h;
            var badge = document.getElementById('tabBadgeMyTasks');
            if (badge) badge.textContent = list.length;
        }
""", 'panel')

# 9. 指定流程项本身无任务时，由面板内空态承担，避免全局空态重复
rep(
"            emptyState.style.display = totalVisible === 0 ? 'flex' : 'none';\n",
"""            var mtNoData = activeTab === 'mytasks' && myTasksFlow !== 'all' &&
                (!scope || !scope.querySelector('.task-item'));
            emptyState.style.display = (totalVisible === 0 && !mtNoData) ? 'flex' : 'none';
""", 'empty-state')

# 10. URL 解析 flow
rep(
"""                    myTasksRole = _usp.get('role') === 'worker' ? 'worker' : 'nonworker';
                    var _mtTab = document.getElementById('tabMyTasks');
""",
"""                    myTasksRole = _usp.get('role') === 'worker' ? 'worker' : 'nonworker';
                    myTasksFlow = _usp.get('flow') || 'all';
                    var _mtTab = document.getElementById('tabMyTasks');
""", 'url-parse')

# 11. 初始化末尾：我的任务视图作用域不能被默认流程项覆盖
rep(
"""            switchTaskTab(myTasksMode ? 'mytasks' : 'contract');
            selectFlow(defaultFlowId(_flowCfg));
""",
"""            switchTaskTab(myTasksMode ? 'mytasks' : 'contract');
            if (myTasksMode) syncRailActive();
            else selectFlow(defaultFlowId(_flowCfg));
""", 'init')

open(P, 'wb').write(s.encode('utf-8'))
b = open(P, 'rb').read()
print('DONE bytes %d -> %d, BOM=%s, CRLF=%d, LF=%d' % (
    len(raw), len(b), b[:3] == b'\xef\xbb\xbf', b.count(b'\r\n'), b.count(b'\n')))
