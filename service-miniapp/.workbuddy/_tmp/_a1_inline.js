
        // ================= 服务流程配置 + 双面板切换 Tab（本页新增） =================
        var DEFAULT_FLOW_LIST = [
            { id: 'lh', name: '量房', hasContract: false, status: '已完成' },
            { id: 'cs', name: '初步设计', hasContract: false, status: '已完成' },
            { id: 'ht', name: '设计服务', hasContract: true, status: '已完成' },
            { id: 'sg', name: '基础施工服务', hasContract: true, status: '进行中' },
            { id: 'cz', name: '主材安装', hasContract: true, status: '未开始' },
            { id: 'sh', name: '售后', hasContract: false, status: '未开始' }
        ];

        // 本页内嵌只读明细快照（取自 project-list.html baseItems()，不修改其它文件）
        var SNAPSHOT = {
            lh: { name: '量房', hasContract: false, stages: [], temp: [], tasks: [
                { n: '原始尺寸复测', s: 'completed', e: '张设计' },
                { n: '墙体结构勘测', s: 'completed', e: '李设计' },
                { n: '设备点位确认', s: 'completed', e: '王设计' }
            ] },
            cs: { name: '初步设计', hasContract: false, stages: [], temp: [], tasks: [
                { n: '方案文件·户型优化', s: 'completed', e: '张设计' },
                { n: '内部评审', s: 'completed', e: '李设计' },
                { n: '会审', s: 'completed', e: '王设计' },
                { n: '方案定稿', s: 'completed', e: '张设计' }
            ] },
            cz: { name: '主材安装', hasContract: true, noContractYet: true, temp: [], tasks: [], stages: [
                { n: '主材进场阶段', tasks: ['瓷砖/石材进场', '卫浴洁具进场', '橱柜进场'] },
                { n: '安装收尾阶段', tasks: ['灯具安装', '开关插座安装'] }
            ] },
            sh: { name: '售后', hasContract: false, stages: [], temp: [], tasks: [] }
        };

        var activeTab = 'contract';
        var myTasksMode = false;       // 仅 ?scope=mytasks 时为 true
        var myTasksRole = 'nonworker'; // worker | nonworker，来自跳转参数
        var myTasksFlow = 'all';       // 我的任务作用域：'all' 全部流程项 | 配置流程项 id
        var activeFlowId = 'sg';

        function escTxt(v) {
            return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }

        function cfgList() {
            var list = null;
            try {
                if (window.FlowCfgStore && typeof FlowCfgStore.get === 'function') list = FlowCfgStore.get();
            } catch (e) {}
            if (!list || !list.length) {
                list = DEFAULT_FLOW_LIST.map(function (x) {
                    return { id: x.id, name: x.name, hasContract: x.hasContract, status: x.status };
                });
            }
            return list.slice(0, 12);
        }

        function defaultFlowId(cfg) {
            for (var i = 0; i < cfg.length; i++) if (cfg[i].status === '进行中') return cfg[i].id;
            return (cfg[0] && cfg[0].id) || 'sg';
        }

        function cfgName(cfg, id) {
            for (var i = 0; i < cfg.length; i++) if (cfg[i].id === id) return cfg[i].name;
            return id;
        }

        function ensureFlowGroup(panel, fid) {
            var g = panel.querySelector('.flow-group[data-flow-id="' + fid + '"]');
            if (!g) {
                g = document.createElement('div');
                g.className = 'flow-group';
                g.setAttribute('data-flow-id', fid);
                g.innerHTML = '<div class="flow-body show"></div>';
                panel.appendChild(g);
            }
            return g;
        }

        function groupBody(g) { return g.querySelector('.flow-body'); }

        // 把旧的 2 张流程项卡内的 contract-block / temp-block 原节点搬进两个面板，再移除空壳
        function migrateLegacyBlocks() {
            var pc = document.getElementById('panelContract');
            var pt = document.getElementById('panelTemp');
            if (!pc || !pt) return;
            var cards = Array.prototype.slice.call(document.querySelectorAll('#taskContainer > .flow-item-card'));
            cards.forEach(function (card) {
                var fid = card.getAttribute('data-flow') || 'sg';
                var cb = card.querySelector('.contract-block');
                var tb = card.querySelector('.temp-block');
                var bc = groupBody(ensureFlowGroup(pc, fid));
                var bt = groupBody(ensureFlowGroup(pt, fid));
                if (cb && bc) bc.appendChild(cb);
                if (tb && bt) bt.appendChild(tb);
                card.parentNode.removeChild(card);
            });
            // 16 处中文归属统一改为配置 id
            document.querySelectorAll('#panelTemp .task-item[data-flowitem]').forEach(function (t) {
                t.setAttribute('data-flow-id', t.getAttribute('data-flowitem') === '设计服务' ? 'ht' : 'sg');
                t.removeAttribute('data-flowitem');
            });
        }

        var STATUS_MAP = {
            completed: { dot: '✓', text: '已完成', cls: 'completed' },
            confirming: { dot: '⏳', text: '确认中', cls: 'confirming' },
            executing: { dot: '▶', text: '执行中', cls: 'executing' },
            pending: { dot: '○', text: '待开始', cls: 'pending' },
            config: { dot: '○', text: '待配置', cls: 'config' }
        };

        function taskRow(t, fid, type) {
            var st = STATUS_MAP[t.s] || STATUS_MAP.pending;
            return '<div class="task-item" data-type="' + type + '" data-status="' + escTxt(t.s) + '" data-priority="normal" data-participant="false" data-flow-id="' + escTxt(fid) + '" onclick="goToTaskDetail(this)">' +
                '<div class="task-status ' + st.cls + '">' + st.dot + '</div>' +
                '<div class="task-info"><div class="task-name">' + escTxt(t.n) + '</div>' +
                '<div class="task-meta">执行人：' + escTxt(t.e || '待指派') + '</div></div>' +
                '<div class="task-status-text ' + st.cls + '"><span class="status-icon">' + st.dot + '</span>' + st.text + '</div></div>';
        }

        // A1：无合同 / 合同未创建的流程项，合同面板只给引导空态；原生任务统一归入非合同面板
        function snapshotStageCard(sg, fid, srcLabel) {
            return '<div class="temp-stage-card" data-src="flow" data-temp-stage="' + escTxt(sg.n) + '">' +
                '<div class="temp-stage-head" onclick="toggleTempStage(this)">' +
                '<span>' + escTxt(sg.n) + '<span class="src-tag">' + escTxt(srcLabel) + '</span></span>' +
                '<span class="temp-stage-right"><span class="badge-n">' + sg.tasks.length +
                '</span><span class="arrow expanded">▼</span></span></div>' +
                '<div class="temp-stage-tasks show">' +
                sg.tasks.map(function (n) { return taskRow({ n: n, s: 'pending', e: '待指派' }, fid, 'temp'); }).join('') +
                '</div></div>';
        }

        function snapshotLoose(tasks, fid, srcLabel) {
            return '<div class="temp-loose" data-temp-loose="1" data-src="' +
                (srcLabel === '流程任务' ? 'flow' : 'temp') + '">' +
                '<div class="temp-loose-band">无阶段单独任务 <span class="src-tag">' + escTxt(srcLabel) +
                '</span> <span class="badge-n">' + tasks.length + '</span></div>' +
                '<div class="temp-loose-list show">' +
                tasks.map(function (t) { return taskRow(t, fid, 'temp'); }).join('') + '</div></div>';
        }

        function snapshotHtml(sec, fid, isTemp) {
            var s = sec || { hasContract: false, stages: [], temp: [], tasks: [] };
            var stages = s.stages || [], tasks = s.tasks || [], temps = s.temp || [];
            if (!isTemp) {
                // 合同内任务：仅当该流程项已真实创建合同才可能出现（快照项目前均无合同实例）
                if (s.hasRealContract && (tasks.length || stages.length)) {
                    var ch = '<div class="flow-block contract-block">';
                    if (stages.length) {
                        ch += '<div class="contract-tree">';
                        stages.forEach(function (sg) {
                            ch += '<div class="stage-group show"><div class="stage-item">' +
                                '<div class="stage-header" onclick="toggleStage(this)"><div class="stage-dot pending"></div>' +
                                '<div class="stage-name">' + escTxt(sg.n) + '</div>' +
                                '<div class="stage-count">0/' + sg.tasks.length + ' 待开始</div><div class="arrow expanded">▼</div></div>' +
                                '<div class="task-list show">' +
                                sg.tasks.map(function (n) { return taskRow({ n: n, s: 'pending', e: '待指派' }, fid, 'contract'); }).join('') +
                                '</div></div></div>';
                        });
                        ch += '</div>';
                    } else {
                        ch += '<div class="task-list show">' +
                            tasks.map(function (t) { return taskRow(t, fid, 'contract'); }).join('') + '</div>';
                    }
                    return ch + '</div>';
                }
                var title = s.noContractYet ? '合同尚未创建' : '该流程项不含合同';
                var hint = s.noContractYet
                    ? '该项已开启合同，拟定合同后阶段任务才归入「合同内任务」'
                    : '该项为纯任务流程项，任务统一在「临时/流程任务」中查看';
                var cta = s.noContractYet
                    ? '<span class="snapshot-cta" onclick="showToast(\'请到项目主页服务流程浮窗内拟定合同\')">去拟定合同 ›</span>'
                    : '';
                return '<div class="flow-block contract-block"><div class="block-empty">' +
                    '<span class="snapshot-empty-title">' + title + '</span>' +
                    '<span class="snapshot-empty-hint">' + hint + '</span>' + cta + '</div></div>';
            }
            // 非合同面板：区分「流程任务」（流程项自带）与「临时任务」（临时新增）
            if (!tasks.length && !stages.length && !temps.length) {
                return '<div class="flow-block temp-block" data-temp-done="1"><div class="block-empty">' +
                    '该流程项暂无临时/流程任务</div></div>';
            }
            var b = '<div class="flow-block temp-block" data-temp-done="1">' +
                '<div class="temp-tasks-list show"><div class="temp-structured">';
            stages.forEach(function (sg) { b += snapshotStageCard(sg, fid, '流程任务'); });
            if (tasks.length) b += snapshotLoose(tasks, fid, '流程任务');
            if (temps.length) b += snapshotLoose(temps, fid, '临时任务');
            return b + '</div></div></div>';
        }

        function buildSnapshotGroups(cfg) {
            var pc = document.getElementById('panelContract');
            var pt = document.getElementById('panelTemp');
            if (!pc || !pt) return;
            cfg.forEach(function (c) {
                if (c.id === 'sg' || c.id === 'ht') return;
                var sec = SNAPSHOT[c.id] || { name: c.name, hasContract: c.hasContract, stages: [], temp: [], tasks: [] };
                var bc = groupBody(ensureFlowGroup(pc, c.id));
                var bt = groupBody(ensureFlowGroup(pt, c.id));
                if (bc && !bc.querySelector('.flow-block')) bc.innerHTML = snapshotHtml(sec, c.id, false);
                if (bt && !bt.querySelector('.flow-block')) bt.innerHTML = snapshotHtml(sec, c.id, true);
            });
        }

        function applyCfgNames(cfg) {
            document.querySelectorAll('.flow-group[data-flow-id]').forEach(function (g) {
                var el = g.querySelector('.flow-group-name');
                if (el) el.textContent = cfgName(cfg, g.getAttribute('data-flow-id'));
            });
        }

        function railScopeActive() {
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
                all = '<button type="button" class="flow-rail-item" data-flow-id="all" onclick="selectFlow(\'all\')">全部流程项</button>';
            }
            rail.innerHTML = all + cfg.map(function (c) {
                return '<button type="button" class="flow-rail-item" data-flow-id="' +
                    escTxt(c.id) + '" onclick="selectFlow(\'' + escTxt(c.id) + '\')">' + escTxt(c.name) + '</button>';
            }).join('');
            syncRailActive();
        }

        function applyFlowCfg(cfg) {
            var exists = false;
            for (var i = 0; i < cfg.length; i++) if (cfg[i].id === activeFlowId) exists = true;
            if (!exists) activeFlowId = defaultFlowId(cfg);
            if (myTasksFlow !== 'all') {
                var mfOk = false;
                for (var j = 0; j < cfg.length; j++) if (cfg[j].id === myTasksFlow) mfOk = true;
                if (!mfOk) myTasksFlow = 'all';
            }
            buildSnapshotGroups(cfg);
            // 配置增删后新生成的快照分组也要走同一套层级修正（幂等），避免 band 文案重复
            restructureTaskHierarchy();
            applyCfgNames(cfg);
            if (myTasksMode) renderMyTasksPanel(cfg);
            renderFlowRail(cfg);
            selectFlow(activeFlowId, true);
        }

        function activeTaskScope() {
            if (activeTab === 'mytasks') return document.getElementById('panelMyTasks');
            var panel = document.querySelector('.task-panel.is-active');
            if (!panel) return null;
            return panel.querySelector('.flow-group.is-active') || panel.querySelector('.flow-group');
        }

        function syncMyTasksUrl() {
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

        function switchTaskTab(tab) {
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
            if (rail) rail.style.display = '';
            var eab = document.querySelector('.expand-all-btn');
            if (eab) eab.style.display = activeTab === 'mytasks' ? 'none' : '';
            renderFlowRail(cfgList());
            try {
                var content = document.querySelector('.page-content');
                if (content && rail && content.scrollTop !== undefined) content.scrollTop = Math.max(0, (rail.offsetTop || 0) - 8);
            } catch (e) {}
            refresh();
        }

        function deriveStats() {
            var pc = document.getElementById('panelContract');
            var pt = document.getElementById('panelTemp');
            function count(panel, fid) {
                if (!panel) return 0;
                var g = panel.querySelector('.flow-group[data-flow-id="' + fid + '"]');
                return g ? g.querySelectorAll('.task-item').length : 0;
            }
            var bc = document.getElementById('tabBadgeContract');
            var bt = document.getElementById('tabBadgeTemp');
            if (bc) bc.textContent = count(pc, activeFlowId);
            if (bt) bt.textContent = count(pt, activeFlowId);
            var bm = document.getElementById('tabBadgeMyTasks');
            if (bm && window.MyTasksStore) bm.textContent = myTasksScopeItems().length;
            // 面板内分组统计行已移除，数量统一由 Tab 徽标与结果条呈现
            document.querySelectorAll('.stage-item').forEach(function (si) {
                var tasks = si.querySelectorAll('.task-item');
                var done = 0;
                tasks.forEach(function (t) { if (t.dataset.status === 'completed') done++; });
                var el = si.querySelector('.stage-count');
                if (el && tasks.length) el.textContent = done + '/' + tasks.length;
            });
            document.querySelectorAll('.main-contract').forEach(function (mc) {
                var el = mc.querySelector('.mc-count');
                if (el) el.textContent = mc.querySelectorAll('.task-item').length + ' 任务';
            });
            document.querySelectorAll('.contract-meta').forEach(function (el) {
                var cs = el.closest('.contract-section');
                if (!cs) return;
                var n = cs.querySelectorAll('.task-item').length;
                var sg = cs.querySelectorAll('.stage-item').length;
                var head = el.textContent.split('·')[0].trim();
                el.textContent = head + ' · ' + sg + '个阶段 · ' + n + '个任务';
            });
        }

        function initExpandAll() {
            document.querySelectorAll('.task-panel .flow-body, .task-panel .mc-children, .task-panel .stage-group, .task-panel .task-list, .task-panel .temp-tasks-list, .task-panel .temp-stage-tasks, .task-panel .temp-loose-list, .task-panel .mc-own-stages').forEach(function (el) {
                el.classList.add('show');
            });
            document.querySelectorAll('.task-panel .arrow').forEach(function (a) { a.classList.add('expanded'); });
            allExpanded = true;
            var btn = document.querySelector('.expand-all-btn');
            if (btn) btn.textContent = '收起全部';
            document.querySelectorAll('.task-panel .main-contract').forEach(function (mc) { mc.classList.remove('collapsed'); });
            syncOwnBandState();
            syncExpandSnapshot();
        }

        function tagTasks() {
            document.querySelectorAll('.task-panel .flow-group').forEach(function (g) {
                var fid = g.getAttribute('data-flow-id');
                g.querySelectorAll('.task-item').forEach(function (t) { t.setAttribute('data-flow-id', fid); });
            });
        }

        // ===== 我的任务专用视图：与项目主页共用 MyTasksStore 清单 =====
        // 「我」在本清单中的身份，与下方 CURRENT_USER 保持一致
        var MT_USER = '张三';
        var MT_STATUS = {
            pending:    { dot: '○',  text: '待开始', cls: 'pending' },
            confirming: { dot: '⏳', text: '确认中', cls: 'confirming' },
            completed:  { dot: '✓',  text: '已完成', cls: 'completed' }
        };
        function mtRow(t) {
            var st = MT_STATUS[t.status] || MT_STATUS.pending;
            var exec = t.exec || '';
            var confirms = t.confirms || [];
            // 归属全集 = 执行人是我 ∨ 确认人含我；不再硬编码「我参与」
            var isMine = exec === MT_USER || confirms.indexOf(MT_USER) !== -1;
            var meta = (t.type === 'temp' ? '临时/流程任务' : '合同内任务') +
                (t.stage ? ' · ' + escTxt(t.stage) : '') +
                (t.contract ? ' · ' + escTxt(t.contract) : '');
            return '<div class="task-item" data-type="' + t.type + '" data-status="' + t.status +
                '" data-priority="normal" data-participant="' + (isMine ? 'true' : 'false') +
                '" data-exec="' + escTxt(exec) + '" data-confirms="' + escTxt(confirms.join('、')) +
                '" data-flow-id="' + escTxt(t.flowId) +
                '" data-mt-id="' + escTxt(t.id) + '" onclick="goToTaskDetail(this)">' +
                '<div class="task-status ' + st.cls + '">' + st.dot + '</div>' +
                '<div class="task-info"><div class="task-name">' + escTxt(t.name) + '</div>' +
                '<div class="task-meta">' + meta + '</div></div>' +
                '<div class="task-status-text ' + st.cls + '"><span class="status-icon">' + st.dot + '</span>' + st.text + '</div></div>';
        }
        function myTasksScopeItems(cfg) {
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
                    '<br><span class="mt-back" onclick="selectFlow(\'all\')">查看全部流程项</span></div>';
            }
            panel.innerHTML = h;
            var badge = document.getElementById('tabBadgeMyTasks');
            if (badge) badge.textContent = list.length;
        }

        function refresh() {
            tagTasks();
            filterTasks();
            deriveStats();
            try { renderContractProgress(); } catch (e) {}
        }

        // ================= 层级修正：主合同自身阶段任务 / 临时任务阶段化 / 合同去重 =================
        // 主合同自身阶段任务（与 project-list.html baseItems() 服务流程阶段同源，本页内嵌只读）
        var MAIN_OWN_STAGES = {
            sg: [
                { n: '基础施工阶段', st: 'completed', tasks: [
                    ['现场放线与三方交底', 'completed'], ['墙体拆除与建筑垃圾清运', 'completed'],
                    ['新建砌墙与植筋加固', 'completed'], ['门窗洞口修整与过梁浇筑', 'completed'],
                    ['成品保护与文明施工验收', 'completed']
                ] },
                { n: '水电隐蔽工程', st: 'executing', tasks: [
                    ['强弱电开槽与弹线定位', 'completed'], ['冷热水管路铺设与打压测试', 'completed'],
                    ['卫生间沉箱防漏与二次排水', 'executing'], ['中央空调/新风主机吊装穿梁', 'executing'],
                    ['强弱电穿线与底盒安装', 'pending'], ['隐蔽工程节点联合三方验收', 'pending']
                ] },
                { n: '泥瓦铺贴与防水防渗', st: 'pending', tasks: [
                    ['卫生间及阳台高分子防水刷制', 'pending'], ['闭水试验48小时联合签字', 'pending'],
                    ['墙地砖铺贴与地面找平', 'pending'], ['窗台石与门槛石安装', 'pending'],
                    ['泥瓦工程完工验收', 'pending']
                ] },
                { n: '木工吊顶与柜体制作', st: 'pending', tasks: [
                    ['轻钢龙骨吊顶封板', 'pending'], ['背景墙基层与造型制作', 'pending'],
                    ['现场柜体下料与组装', 'pending'], ['木工工程完工验收', 'pending']
                ] },
                { n: '油漆涂饰与竣工收尾', st: 'pending', tasks: [
                    ['墙面挂网与腻子批刮三遍', 'pending'], ['顶面乳胶漆滚涂两遍', 'pending'],
                    ['木作油漆与收口补缝', 'pending'], ['开荒保洁与竣工初验', 'pending']
                ] }
            ]
        };
        // 临时任务：有阶段的归入阶段卡；其余（含 TEMP_LOOSE）作为「无阶段单独任务」直接平铺
        var TEMP_STAGE_MAP = {
            sg: [
                { n: '进场验收阶段', names: ['材料进场验收', '瓷砖/石材进场复验'] },
                { n: '施工过程巡检阶段', names: ['水电节点复检', '隐蔽工程旁站', '卫生间防水闭水旁站',
                    '瓷砖空鼓与平整度抽检', '吊顶龙骨间距抽检', '墙面腻子打磨验收',
                    '门套与柜体基层尺寸复核', '强弱电箱回路核对'] },
                { n: '竣工收尾阶段', names: ['收口验收', '竣工前全面巡检'] }
            ],
            ht: []
        };
        var TEMP_LOOSE = {
            sg: ['工地巡检', '成品保护巡查', '工地安全用电检查'],
            ht: ['设计交底']
        };

        function ownStageCardHtml(n, st, tasks, fid) {
            var stInfo = STATUS_MAP[st] || STATUS_MAP.pending;
            return '<div class="stage-group show"><div class="stage-item">' +
                '<div class="stage-header" onclick="toggleStage(this)">' +
                '<div class="stage-dot ' + stInfo.cls + '"></div>' +
                '<div class="stage-name">' + escTxt(n) + '</div>' +
                '<div class="stage-count">0/' + tasks.length + '</div>' +
                '<div class="arrow expanded">▼</div></div>' +
                '<div class="task-list show">' +
                tasks.map(function (t) { return taskRow(t, fid, 'contract'); }).join('') +
                '</div></div></div>';
        }

        // 主合同层补齐「自身阶段任务」；ht 把重复的子合同层上提后移除（去重），任务节点原样搬运
        function injectMainOwnStages() {
            document.querySelectorAll('.task-panel .main-contract').forEach(function (mc) {
                if (mc.getAttribute('data-own-done')) return;
                mc.setAttribute('data-own-done', '1');
                var g = mc.closest('.flow-group');
                var fid = g ? g.getAttribute('data-flow-id') : 'sg';
                var head = mc.querySelector('.mc-header');
                var children = mc.querySelector('.mc-children');
                var stages = document.createElement('div');
                stages.className = 'mc-own-stages show';

                if (fid === 'ht') {
                    // 同一份「设计服务合同」原先被表达成主合同 + 子合同两层 → 去重：
                    // 把子合同的阶段任务整块上提为主合同自身阶段任务，移除重复合同卡壳（任务节点不丢）
                    var dup = children && children.querySelector('.contract-section[data-contract="contract-design"]');
                    if (dup) {
                        Array.prototype.slice.call(dup.querySelectorAll('.stage-group')).forEach(function (sg) {
                            stages.appendChild(sg);
                        });
                        dup.parentNode.removeChild(dup);
                    }
                    if (children && children.parentNode === mc && !children.querySelector('.contract-section')) {
                        children.parentNode.removeChild(children);
                    }
                } else if (MAIN_OWN_STAGES[fid]) {
                    var html = '';
                    MAIN_OWN_STAGES[fid].forEach(function (s) {
                        var ts = s.tasks.map(function (t) { return { n: t[0], s: t[1], e: '陈庄' }; });
                        html += ownStageCardHtml(s.n, s.st, ts, fid);
                    });
                    stages.innerHTML = html;
                } else {
                    return;
                }

                var own = document.createElement('div');
                own.className = 'mc-own';
                var band = document.createElement('div');
                band.className = 'mc-own-band';
                band.setAttribute('onclick', 'toggleMainOwnStages(this)');
                band.innerHTML = '<span>主合同阶段任务</span><span class="mc-own-right">' +
                    '<span class="mc-own-count">' +
                    stages.querySelectorAll('.stage-item').length + ' 阶段 · ' +
                    stages.querySelectorAll('.task-item').length + ' 任务</span>' +
                    '<span class="mc-own-toggle"><span class="mc-own-toggle-text">收起</span>' +
                    '<span class="arrow expanded">▼</span></span></span>';
                own.appendChild(band);
                own.appendChild(stages);
                if (head && head.parentNode === mc) mc.insertBefore(own, head.nextSibling);
                else mc.insertBefore(own, mc.firstChild);

                if (children && children.parentNode === mc) {
                    var sub = document.createElement('div');
                    sub.className = 'mc-sub-band';
                    sub.innerHTML = '<span>子合同任务</span><span class="mc-own-count">' +
                        children.querySelectorAll('.contract-section').length + ' 份子合同</span>';
                    mc.insertBefore(sub, children);
                }
            });
        }

        // 临时任务：按阶段分组 + 无阶段单独任务（原任务节点 appendChild 搬运，data-*/onclick 不变）
        function restructureTempBlocks() {
            document.querySelectorAll('.task-panel .temp-block').forEach(function (block) {
                if (block.getAttribute('data-temp-done')) return;
                block.setAttribute('data-temp-done', '1');
                var list = block.querySelector('.temp-tasks-list');
                if (!list) return;
                var g = block.closest('.flow-group');
                var fid = g ? g.getAttribute('data-flow-id') : 'sg';
                var groups = TEMP_STAGE_MAP[fid] || [];
                var buckets = groups.map(function () { return []; });
                var loose = [];
                Array.prototype.slice.call(list.querySelectorAll('.task-item')).forEach(function (t) {
                    var el = t.querySelector('.task-name');
                    var nm = el ? el.textContent.trim() : '';
                    var idx = -1;
                    for (var i = 0; i < groups.length; i++) {
                        if (groups[i].names.indexOf(nm) >= 0) { idx = i; break; }
                    }
                    if (idx >= 0) buckets[idx].push(t); else loose.push(t);
                });
                var wrap = document.createElement('div');
                wrap.className = 'temp-structured';
                groups.forEach(function (grp, i) {
                    if (!buckets[i].length) return;
                    var card = document.createElement('div');
                    card.className = 'temp-stage-card';
                    card.setAttribute('data-temp-stage', grp.n);
                    card.innerHTML = '<div class="temp-stage-head" onclick="toggleTempStage(this)">' +
                        '<span>' + escTxt(grp.n) + '<span class="src-tag">临时任务</span></span>' +
                        '<span class="temp-stage-right"><span class="badge-n">' + buckets[i].length +
                        '</span><span class="arrow expanded">▼</span></span></div>' +
                        '<div class="temp-stage-tasks show"></div>';
                    var box = card.querySelector('.temp-stage-tasks');
                    buckets[i].forEach(function (t) { box.appendChild(t); });
                    wrap.appendChild(card);
                });
                if (loose.length) {
                    var lz = document.createElement('div');
                    lz.className = 'temp-loose';
                    lz.setAttribute('data-temp-loose', '1');
                    lz.innerHTML = '<div class="temp-loose-band">无阶段单独任务 <span class="src-tag">临时任务</span> <span class="badge-n">' +
                        loose.length + '</span></div><div class="temp-loose-list show"></div>';
                    var lb = lz.querySelector('.temp-loose-list');
                    loose.forEach(function (t) { lb.appendChild(t); });
                    wrap.appendChild(lz);
                }
                list.innerHTML = '';
                list.appendChild(wrap);
            });
        }

        function toggleTempStage(el) {
            var box = el.nextElementSibling;
            if (!box) return;
            var show = box.classList.toggle('show');
            var a = el.querySelector('.arrow');
            if (a) a.classList.toggle('expanded', show);
            syncExpandSnapshot();
        }

        // 冗余头行清理：流程项名/总数已在 rail 与 Tab 徽标呈现，面板内不再重复
        // 覆盖 .flow-group-head（流程项名 + 共 N 条）与 .block-band/.temp-band（区块文案）
        function dedupeBands() {
            document.querySelectorAll('.task-panel .flow-group-head, .task-panel .block-band').forEach(function (b) {
                if (b.parentNode) b.parentNode.removeChild(b);
            });
        }

        function restructureTaskHierarchy() {
            injectMainOwnStages();
            restructureTempBlocks();
            dedupeBands();
        }

        window.addEventListener('pageshow', function () {
            applyFlowCfg(cfgList());
            refresh();
        });

        let currentFilters = {
            contract: 'all',
            contractText: '全部合同',
            type: 'all',
            typeText: '全部类型',
            status: 'all',
            statusText: '全部状态',
            role: 'all',          // all | mine | exec | confirm
            priority: 'all',      // all | normal | important | urgent
            mine: false,
            level: null
        };

        // 演示「我」的身份（与现有 data-participant="true" 任务一致）：张三
        const CURRENT_USER = '张三';

        // 从「执行人：X · 确认人：Y、Z」文本解析角色归属
        function getTaskRole(task) {
            const meta = task.querySelector('.task-meta');
            const txt = meta ? meta.textContent : '';
            const exec = (txt.match(/执行人：\s*([^·]+)/) || [,''])[1] || '';
            const conf = (txt.match(/确认人：\s*([^\n]+)/) || [,''])[1] || '';
            return {
                executor: exec.trim(),
                confirmers: conf.split(/[、,，]/).map(function (s) { return s.trim(); }).filter(Boolean)
            };
        }

        // 角色维度过滤（与 status / priority 做 AND 叠加）
        function passesRole(task, status, participant) {
            const role = currentFilters.role;
            if (role === 'all') return true;
            // 我的任务清单：按 exec / confirms 字段判定（全集 + 两个行动子集）
            if (task.dataset.mtId) {
                const ex = (task.dataset.exec || '').trim();
                const cf = (task.dataset.confirms || '').split(/[、,，]/).map(function (s) { return s.trim(); }).filter(Boolean);
                const mine = ex === MT_USER || cf.indexOf(MT_USER) !== -1;
                if (role === 'mine') return mine;
                if (role === 'exec') return ex === MT_USER && status !== 'completed' && status !== 'confirming';
                if (role === 'confirm') return cf.indexOf(MT_USER) !== -1 && status === 'confirming';
                return true;
            }
            if (role === 'mine') return participant;
            const r = getTaskRole(task);
            if (role === 'exec') return r.executor === CURRENT_USER && status !== 'completed';
            if (role === 'confirm') return r.confirmers.indexOf(CURRENT_USER) !== -1 && status === 'confirming';
            return true;
        }

        // 顶部胶囊与 currentFilters 同步高亮（仅角色轴 4 项；状态由下拉单独呈现）
        function syncPills() {
            document.querySelectorAll('#roleFilterBar .quick-filter-btn[data-role]').forEach(function (b) { b.classList.remove('active'); });
            const r = currentFilters.role;
            if (r !== 'all' && r) {
                const btn = document.querySelector('#roleFilterBar .quick-filter-btn[data-role="' + r + '"]');
                if (btn) btn.classList.add('active');
            } else {
                const allBtn = document.querySelector('#roleFilterBar .quick-filter-btn[data-role="all"]');
                if (allBtn) allBtn.classList.add('active');
            }
            // 状态下拉：按钮文案 + 高亮当前项
            const sb = document.getElementById('statusSelectBtn');
            if (sb) sb.textContent = (currentFilters.status === 'all') ? '状态 ▾' : (currentFilters.statusText + ' ▾');
            const menu = document.getElementById('statusDropdownMenu');
            if (menu) {
                menu.querySelectorAll('.status-dropdown-item').forEach(function (i) {
                    i.classList.toggle('active', i.dataset.status === currentFilters.status);
                });
            }
        }

        // 顶部角色胶囊点击（单一选中）：全部 / 我参与 / 待我执行 / 待我确认
        function applyPill(key, btn) {
            switch (key) {
                case 'mine': currentFilters.role = 'mine'; break;
                case 'exec': currentFilters.role = 'exec'; break;
                case 'confirm': currentFilters.role = 'confirm'; break;
                default: currentFilters.role = 'all';
            }
            // 切角色轴时复位状态轴，避免两轴叠加造成理解混乱
            currentFilters.status = 'all';
            currentFilters.statusText = '全部状态';
            currentFilters.mine = (currentFilters.role === 'mine');
            syncPills();
            updateFilterTags();
            filterTasks();
        }

        // 状态筛选下拉：展开/收起（单一状态轴，不与角色胶囊同级平铺）
        // 关键：#roleFilterBar 设了 overflow-x:auto，会裁切绝对定位的下拉；故改用 fixed 定位，按按钮位置计算坐标，逃离裁剪。
        function toggleStatusDropdown(e) {
            e.stopPropagation();
            const menu = document.getElementById('statusDropdownMenu');
            const btn = document.getElementById('statusSelectBtn');
            if (!menu || !btn) return;
            const show = menu.classList.toggle('show');
            btn.classList.toggle('active', show);
            if (show) {
                const rect = btn.getBoundingClientRect();
                menu.style.position = 'fixed';
                menu.style.top = (rect.bottom + 6) + 'px';
                menu.style.left = Math.max(8, rect.left) + 'px';
                menu.style.right = 'auto';
                menu.style.zIndex = '3000';
                setTimeout(function () {
                    document.addEventListener('click', function handleDoc(ev) {
                        if (!menu.contains(ev.target) && !btn.contains(ev.target)) {
                            menu.classList.remove('show');
                            btn.classList.remove('active');
                            menu.style.position = '';
                            menu.style.top = '';
                            menu.style.left = '';
                            menu.style.right = '';
                            document.removeEventListener('click', handleDoc);
                        }
                    });
                }, 0);
            } else {
                menu.style.position = '';
                menu.style.top = '';
                menu.style.left = '';
                menu.style.right = '';
            }
        }

        // 状态筛选下拉项选择
        function selectStatus(status, text, item) {
            currentFilters.status = status;
            currentFilters.statusText = text;
            // 与 applyPill() 对称：切状态轴时复位角色轴，避免两轴 AND 叠加导致恒 0 结果
            if (status !== 'all') {
                currentFilters.role = 'all';
                currentFilters.mine = false;
            }
            const menu = document.getElementById('statusDropdownMenu');
            if (menu) {
                menu.querySelectorAll('.status-dropdown-item').forEach(function (i) { i.classList.remove('active'); });
                if (item) item.classList.add('active');
                menu.classList.remove('show');
            }
            const btn = document.getElementById('statusSelectBtn');
            if (btn) btn.classList.remove('active');
            syncPills();
            updateFilterTags();
            filterTasks();
        }

        // 高级筛选面板相关函数已随面板移除（2026-09-03）

        let allExpanded = true;
        
        function showToast(message, duration = 2500) {
            const existingToast = document.querySelector('.app-toast');
            if (existingToast) {
                existingToast.remove();
            }
            
            const toast = document.createElement('div');
            toast.className = 'app-toast';
            toast.innerHTML = message.replace(/\n/g, '<br>');
            toast.style.cssText = `
                position: absolute;
                bottom: 80px;
                left: 50%;
                transform: translateX(-50%);
                background-color: rgba(0, 0, 0, 0.7);
                color: #FFFFFF;
                padding: 10px 20px;
                border-radius: 8px;
                font-size: 13px;
                z-index: 1000;
                white-space: pre-wrap;
                max-width: 90%;
                text-align: center;
                line-height: 1.5;
            `;
            const phoneFrame = document.querySelector('.phone-frame');
            if (phoneFrame) {
                phoneFrame.appendChild(toast);
            }
            
            setTimeout(() => {
                toast.remove();
            }, duration);
        }
        
        function toggleFilterDropdown() {
            const dropdown = document.getElementById('filterDropdown');
            const filterBtn = document.getElementById('filterBtn');
            dropdown.classList.toggle('show');
            filterBtn.classList.toggle('active');
        }
        
        function closeFilterDropdown() {
            document.getElementById('filterDropdown').classList.remove('show');
            document.getElementById('filterBtn').classList.remove('active');
        }
        
        // 注意：状态下拉项选择由上方 selectStatus(status, text, item) 处理（行内 onclick 直连）；
        // 旧的 selectContract / selectType / selectStatus(element,value,text) / updateFilterOptions 三函数
        // 属已移除的高级筛选面板，其签名与行内调用不一致且引用已删除的 #statusOptions，会导致点击无反应，故整体删除（2026-09-03）。
        
        function updateFilterTags() {
            const filterTags = document.getElementById('filterTags');
            const tags = [];
            
            if (currentFilters.contract !== 'all') {
                tags.push({ type: 'contract', text: currentFilters.contractText });
            }
            if (currentFilters.type !== 'all') {
                tags.push({ type: 'type', text: currentFilters.typeText });
            }
            if (currentFilters.status !== 'all') {
                tags.push({ type: 'status', text: currentFilters.statusText });
            }
            if (currentFilters.role !== 'all') {
                const roleText = { mine: '我参与', exec: '待我执行', confirm: '待我确认' }[currentFilters.role];
                tags.push({ type: 'role', text: roleText + (activeTab === 'mytasks' ? ' · 我的任务清单' : ' · 当前流程项 · 当前分类') });
            }
            if (currentFilters.priority !== 'all') {
                const priText = { normal: '普通', important: '重要', urgent: '紧急' }[currentFilters.priority];
                tags.push({ type: 'priority', text: '优先级：' + priText });
            }
            if (currentFilters.level) {
                tags.push({ type: 'level', text: '架构层级：' + currentFilters.level });
            }
            
            if (tags.length > 0) {
                filterTags.style.display = 'flex';
                filterTags.innerHTML = tags.map(tag => `
                    <div class="filter-tag">
                        <span>${tag.text}</span>
                        ${tag.type !== 'level' ? `<span class="remove" onclick="removeFilter('${tag.type}')">×</span>` : ''}
                    </div>
                `).join('');
            } else {
                filterTags.style.display = 'none';
            }
            
            const filterBtn = document.getElementById('filterBtn');
            if (filterBtn) {
                if (tags.length > 0) {
                    filterBtn.classList.add('active');
                } else {
                    filterBtn.classList.remove('active');
                }
            }
        }
        
        function removeFilter(type) {
            if (type === 'contract') {
                currentFilters.contract = 'all';
                currentFilters.contractText = '全部合同';
            } else if (type === 'type') {
                currentFilters.type = 'all';
                currentFilters.typeText = '全部类型';
            } else if (type === 'status') {
                currentFilters.status = 'all';
                currentFilters.statusText = '全部状态';
                syncPills();
            } else if (type === 'role') {
                currentFilters.role = 'all';
                syncPills();
            } else if (type === 'priority') {
                currentFilters.priority = 'all';
            } else if (type === 'level') {
                currentFilters.level = null;
            }
            updateFilterTags();
            filterTasks();
        }
        
        function goToTaskDetail(element) {
            const taskType = element.dataset.type;
            const taskStatus = element.dataset.status;
            
            if (taskType === 'temp') {
                location.href = `task-detail.html?status=${taskStatus}`;
            } else {
                location.href = `task-detail.html?status=${taskStatus}`;
            }
        }
        
        function toggleContract(header) {
            const stageGroup = header.nextElementSibling;
            const arrow = header.querySelector('.arrow');
            
            if (stageGroup.classList.contains('show')) {
                stageGroup.classList.remove('show');
                arrow.classList.remove('expanded');
            } else {
                stageGroup.classList.add('show');
                arrow.classList.add('expanded');
            }
            syncExpandSnapshot();
        }
        
        function toggleStage(header) {
            const taskList = header.nextElementSibling;
            const arrow = header.querySelector('.arrow');
            
            if (taskList.classList.contains('show')) {
                taskList.classList.remove('show');
                arrow.classList.remove('expanded');
            } else {
                taskList.classList.add('show');
                arrow.classList.add('expanded');
            }
            syncExpandSnapshot();
        }
        
        function toggleTempTasks(header) {
            const taskList = header.nextElementSibling;
            const arrow = header.querySelector('.arrow');
            
            if (taskList.classList.contains('show')) {
                taskList.classList.remove('show');
                arrow.classList.remove('expanded');
            } else {
                taskList.classList.add('show');
                arrow.classList.add('expanded');
            }
            syncExpandSnapshot();
        }
        
        function toggleFlowItem(header) {
            const body = header.nextElementSibling;
            const arrow = header.querySelector('.arrow');
            if (body.classList.contains('show')) {
                body.classList.remove('show');
                arrow.classList.remove('expanded');
            } else {
                body.classList.add('show');
                arrow.classList.add('expanded');
            }
            syncExpandSnapshot();
        }

        function toggleMainContract(header) {
            const mc = header.closest('.main-contract');
            if (!mc) return;
            // 层级修正后 .mc-header 的 nextElementSibling 是 .mc-own，不能再按兄弟节点折叠；
            // 改为以整个主合同为单位切 .collapsed，覆盖 .mc-own / .mc-sub-band / .mc-children。
            const collapsed = mc.classList.toggle('collapsed');
            const arrow = header.querySelector('.arrow');
            if (arrow) arrow.classList.toggle('expanded', !collapsed);
            syncExpandSnapshot();
        }

        // 「主合同阶段任务」行单独折叠：仅影响自身阶段任务区，不动主合同整体与子合同
        function toggleMainOwnStages(band) {
            var box = band.nextElementSibling;
            if (!box || !box.classList.contains('mc-own-stages')) return;
            var show = box.classList.toggle('show');
            var a = band.querySelector('.arrow');
            if (a) a.classList.toggle('expanded', show);
            var t = band.querySelector('.mc-own-toggle-text');
            if (t) t.textContent = show ? '收起' : '展开';
            syncExpandSnapshot();
        }
        // 统一收敛行内文案 / 箭头，供全局展开、筛选复原等场景调用
        function syncOwnBandState() {
            document.querySelectorAll('.task-panel .mc-own').forEach(function (own) {
                var show = !!own.querySelector('.mc-own-stages.show');
                var a = own.querySelector('.mc-own-band .arrow');
                var t = own.querySelector('.mc-own-toggle-text');
                if (a) a.classList.toggle('expanded', show);
                if (t) t.textContent = show ? '收起' : '展开';
            });
        }

        // 统一可折叠容器集合：覆盖主合同自身阶段、子合同阶段、临时任务阶段/单独任务、快照流程项直铺任务
        function expandBoxes() {
            return document.querySelectorAll('.task-panel .stage-group, .task-panel .task-list, .task-panel .temp-stage-tasks, .task-panel .temp-loose-list, .task-panel .mc-own-stages');
        }
        function syncArrowsFromState() {
            document.querySelectorAll('.task-panel .task-list, .task-panel .stage-group, .task-panel .temp-stage-tasks').forEach(function (el) {
                var h = el.previousElementSibling;
                var a = h && h.querySelector('.arrow');
                if (a) a.classList.toggle('expanded', el.classList.contains('show'));
            });
            document.querySelectorAll('.task-panel .main-contract').forEach(function (mc) {
                var a = mc.querySelector('.mc-header .arrow');
                if (a) a.classList.toggle('expanded', !mc.classList.contains('collapsed'));
            });
            syncOwnBandState();
        }
        function setAllExpanded(expand) {
            expandBoxes().forEach(function (el) { el.classList.toggle('show', expand); });
            document.querySelectorAll('.task-panel .main-contract').forEach(function (mc) {
                mc.classList.toggle('collapsed', !expand);
            });
            syncArrowsFromState();
            var btn = document.querySelector('.expand-all-btn');
            if (btn) btn.textContent = expand ? '收起全部' : '展开全部';
            allExpanded = expand;
            syncExpandSnapshot();
        }
        function expandAllContracts() {
            setAllExpanded(!allExpanded);
        }
        
        let _defaultExpand = null;
        function syncExpandSnapshot() {
            // 记录用户最近一次手动设定的展开态，供 filterTasks 末尾 restore 复原，避免「点了又被弹回」
            _defaultExpand = new Map();
            expandBoxes().forEach(el => _defaultExpand.set(el, el.classList.contains('show')));
        }
        function snapshotExpandState() {
            if (_defaultExpand) return;
            _defaultExpand = new Map();
            expandBoxes().forEach(el => _defaultExpand.set(el, el.classList.contains('show')));
        }
        function restoreExpandState() {
            if (!_defaultExpand) return;
            _defaultExpand.forEach((shouldShow, el) => { el.classList.toggle('show', shouldShow); });
            syncArrowsFromState();
        }
        function expandAncestors(task) {
            const tl = task.closest('.task-list');
            if (tl) {
                tl.classList.add('show');
                const arrow = tl.previousElementSibling && tl.previousElementSibling.querySelector('.arrow');
                if (arrow) arrow.classList.add('expanded');
            }
            const sg = task.closest('.stage-group');
            if (sg) {
                sg.classList.add('show');
                const section = sg.closest('.contract-section');
                const arrow = section && section.querySelector('.contract-header .arrow');
                if (arrow) arrow.classList.add('expanded');
            }
            const tsp = task.closest('.temp-stage-tasks');
            if (tsp) {
                tsp.classList.add('show');
                const a = tsp.previousElementSibling && tsp.previousElementSibling.querySelector('.arrow');
                if (a) a.classList.add('expanded');
            }
            const lzl = task.closest('.temp-loose-list');
            if (lzl) lzl.classList.add('show');
            const mos = task.closest('.mc-own-stages');
            if (mos) mos.classList.add('show');
        }

        function filterTasks() {
            const searchText = document.getElementById('searchInput').value.toLowerCase();
            snapshotExpandState();
            const isFiltering = !(currentFilters.contract === 'all' && currentFilters.type === 'all' && currentFilters.status === 'all' && currentFilters.role === 'all' && currentFilters.priority === 'all' && !currentFilters.mine && !searchText);
            // 作用域 = 当前 Tab 面板 ∩ 当前选中服务流程项；合同/临时两类主体互斥
            const scope = activeTaskScope();
            let totalVisible = 0;
            let pendingCount = 0;
            let confirmingCount = 0;
            let completedCount = 0;

            if (scope) {
                scope.querySelectorAll('.task-item').forEach(function (task) {
                    const taskType = task.dataset.type;
                    const taskStatus = task.dataset.status;
                    const taskParticipant = task.dataset.participant === 'true';
                    const nameEl = task.querySelector('.task-name');
                    const taskName = nameEl ? nameEl.textContent.toLowerCase() : '';
                    const section = task.closest('.contract-section');
                    const isMainOwn = !!task.closest('.mc-own');
                    let visible = true;

                    // 架构层级过滤（URL ?level 契约）：整组显隐
                    if (currentFilters.level && section && section.dataset.level !== currentFilters.level) visible = false;
                    // 主合同自身阶段任务归属「项目部 / 主合同层」，指定具体工作组时不下发
                    if (currentFilters.level && currentFilters.level !== '项目部' && isMainOwn) visible = false;
                    if (currentFilters.contract !== 'all' && (!section || section.dataset.contract !== currentFilters.contract)) visible = false;
                    if (currentFilters.type !== 'all' && taskType !== currentFilters.type) visible = false;
                    if (currentFilters.status !== 'all' && taskStatus !== currentFilters.status) visible = false;
                    if (!passesRole(task, taskStatus, taskParticipant)) visible = false;
                    if (currentFilters.priority !== 'all' && task.dataset.priority !== currentFilters.priority) visible = false;
                    if (currentFilters.mine && !taskParticipant) visible = false;
                    if (searchText && !taskName.includes(searchText)) visible = false;

                    task.style.display = visible ? 'flex' : 'none';
                    if (visible) {
                        expandAncestors(task);
                        totalVisible++;
                        if (taskStatus === 'pending') pendingCount++;
                        else if (taskStatus === 'confirming') confirmingCount++;
                        else if (taskStatus === 'completed') completedCount++;
                    }
                });

                // 容器收敛：无可见任务的阶段 / 子合同 / 主合同隐藏
                scope.querySelectorAll('.stage-item').forEach(function (st) {
                    let n = 0;
                    st.querySelectorAll('.task-item').forEach(function (t) { if (t.style.display !== 'none') n++; });
                    st.style.display = n > 0 ? 'block' : 'none';
                });
                scope.querySelectorAll('.contract-section').forEach(function (cs) {
                    let n = 0;
                    cs.querySelectorAll('.task-item').forEach(function (t) { if (t.style.display !== 'none') n++; });
                    cs.style.display = n > 0 ? 'block' : 'none';
                });
                scope.querySelectorAll('.main-contract').forEach(function (mc) {
                    let n = 0;
                    mc.querySelectorAll('.contract-section').forEach(function (cs) { if (cs.style.display !== 'none') n++; });
                    mc.querySelectorAll('.mc-own .task-item').forEach(function (t) { if (t.style.display !== 'none') n++; });
                    mc.style.display = n > 0 ? '' : 'none';
                });
                scope.querySelectorAll('.temp-stage-card').forEach(function (card) {
                    let n = 0;
                    card.querySelectorAll('.task-item').forEach(function (t) { if (t.style.display !== 'none') n++; });
                    card.style.display = n > 0 ? 'block' : 'none';
                });
                scope.querySelectorAll('.temp-loose').forEach(function (lz) {
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
            const emptyState = document.getElementById('emptyState');
            var mtNoData = activeTab === 'mytasks' && myTasksFlow !== 'all' &&
                (!scope || !scope.querySelector('.task-item'));
            // A1：无合同/合同未建流程项已有面板内差异化空态，不再叠加全局空态
            var panelEmpty = !!(scope && scope.querySelector('.block-empty'));
            emptyState.style.display = (totalVisible === 0 && !mtNoData && !panelEmpty) ? 'flex' : 'none';
            if (!isFiltering) restoreExpandState();
            syncOwnBandState();
        }
        
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.search-filter-bar')) {
                const dropdown = document.getElementById('filterDropdown');
                if (dropdown) dropdown.classList.remove('show');
            }
        });

        function toggleMultiOption(element) {
            element.classList.toggle('selected');
        }

        function quickFilter(type, btn) {
            document.querySelectorAll('.quick-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (type === 'all') {
                currentFilters.status = 'all';
                currentFilters.type = 'all';
                currentFilters.mine = false;
            } else if (type === 'mine') {
                currentFilters.status = 'all';
                currentFilters.type = 'all';
                currentFilters.mine = true;
            } else {
                currentFilters.status = type;
                currentFilters.type = 'all';
                currentFilters.mine = false;
            }
            
            filterTasks();
        }

        function handleParticipantClick(type, btn) {
            document.querySelectorAll('.filter-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentFilters.mine = type === 'mine';
            filterTasks();
        }

        function saveFilterScheme() {
            showToast('筛选方案已保存');
        }

        let currentView = 'grouped';
        let currentGroupBy = 'contract';

        function switchView(view, tab) {
            currentView = view;
            
            document.querySelectorAll('.view-switch-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const taskContainer = document.getElementById('taskContainer');
            const flatList = document.getElementById('flatTaskList');
            const groupBySelector = document.getElementById('groupBySelector');
            const resultBar = document.querySelector('.result-bar');
            
            if (view === 'flat') {
                taskContainer.style.display = 'none';
                flatList.classList.add('show');
                groupBySelector.style.display = 'none';
                resultBar.style.display = 'none';
            } else {
                taskContainer.style.display = 'block';
                flatList.classList.remove('show');
                groupBySelector.style.display = 'flex';
                resultBar.style.display = 'flex';
            }
        }

        function changeGroupBy(value) {
            currentGroupBy = value;
            
            const taskContainer = document.getElementById('taskContainer');
            const contractSections = taskContainer.querySelectorAll('.contract-section');
            
            if (value === 'stage') {
                contractSections.forEach(section => {
                    const stages = section.querySelectorAll('.stage-item');
                    stages.forEach(stage => {
                        const stageName = stage.querySelector('.stage-name').textContent;
                        const stageDot = stage.querySelector('.stage-dot');
                        const stageHeader = stage.querySelector('.stage-header');
                        
                        if (stageName.includes('材料') || stageName.includes('防水')) {
                            stageDot.className = 'stage-dot completed';
                            stageHeader.style.borderLeft = '3px solid var(--success-color)';
                        } else if (stageName.includes('布管') || stageName.includes('贴砖')) {
                            stageDot.className = 'stage-dot confirming';
                            stageHeader.style.borderLeft = '3px solid var(--warning-color)';
                        } else {
                            stageDot.className = 'stage-dot';
                            stageHeader.style.borderLeft = '3px solid var(--primary-color)';
                        }
                    });
                });
                
                showToast('已按阶段分组显示');
            } else if (value === 'status') {
                contractSections.forEach(section => {
                    const stages = section.querySelectorAll('.stage-item');
                    stages.forEach(stage => {
                        const tasks = stage.querySelectorAll('.task-item');
                        let hasConfirming = false;
                        let hasPending = false;
                        let allCompleted = true;
                        
                        tasks.forEach(task => {
                            const status = task.dataset.status;
                            if (status === 'confirming') hasConfirming = true;
                            if (status === 'pending') hasPending = true;
                            if (status !== 'completed') allCompleted = false;
                        });
                        
                        const stageDot = stage.querySelector('.stage-dot');
                        const stageHeader = stage.querySelector('.stage-header');
                        
                        if (allCompleted && tasks.length > 0) {
                            stageDot.className = 'stage-dot completed';
                            stageHeader.style.borderLeft = '3px solid var(--success-color)';
                        } else if (hasConfirming) {
                            stageDot.className = 'stage-dot confirming';
                            stageHeader.style.borderLeft = '3px solid var(--warning-color)';
                        } else {
                            stageDot.className = 'stage-dot';
                            stageHeader.style.borderLeft = '3px solid var(--primary-color)';
                        }
                    });
                });
                
                showToast('已按状态分组显示');
            } else {
                contractSections.forEach(section => {
                    const stages = section.querySelectorAll('.stage-item');
                    stages.forEach(stage => {
                        const stageDot = stage.querySelector('.stage-dot');
                        const stageHeader = stage.querySelector('.stage-header');
                        stageDot.className = 'stage-dot';
                        stageHeader.style.borderLeft = 'none';
                    });
                });
                
                showToast('已按合同分组显示');
            }
        }

        function goToTaskDetail(element) {
            const taskType = element.dataset.type;
            const taskStatus = element.dataset.status;
            
            if (element.classList.contains('disabled')) {
                showToast('当前阶段内任务为按序执行，存在未完成的前置任务，当前任务无法执行');
                return;
            }
            
            if (taskType === 'temp') {
                location.href = `task-detail.html?status=${taskStatus}`;
            } else {
                location.href = `task-detail.html?status=${taskStatus}`;
            }
        }

        function renderContractProgress() {
            document.querySelectorAll('.contract-section').forEach(function(section) {
                const items = section.querySelectorAll('.task-item');
                const total = items.length;
                let completed = 0;
                items.forEach(function(it) {
                    if (it.dataset.status === 'completed') completed++;
                });
                const pct = total ? Math.round(completed / total * 100) : 0;
                const fill = section.querySelector('.progress-fill');
                const text = section.querySelector('.progress-text');
                if (fill) fill.style.width = pct + '%';
                if (text) text.textContent = '已完成 ' + completed + '/' + total;
            });
        }

        function checkSequentialTasks() {
            const contractSections = document.querySelectorAll('.contract-section');
            
            contractSections.forEach(section => {
                const stages = section.querySelectorAll('.stage-item');
                
                stages.forEach(stage => {
                    const isSequential = stage.dataset.sequential === 'true';
                    if (!isSequential) return;
                    
                    const tasks = stage.querySelectorAll('.task-item');
                    let prevTaskCompleted = true;
                    
                    tasks.forEach((task, index) => {
                        const taskStatus = task.dataset.status;
                        
                        if (index > 0 && isSequential) {
                            const prevTask = tasks[index - 1];
                            const prevTaskStatus = prevTask.dataset.status;
                            prevTaskCompleted = prevTaskStatus === 'completed';
                            
                            if (!prevTaskCompleted && taskStatus !== 'completed') {
                                task.classList.add('disabled');
                                task.removeAttribute('onclick');
                                task.setAttribute('onclick', 'goToTaskDetail(this)');
                            } else {
                                task.classList.remove('disabled');
                            }
                        }
                    });
                });
            });
        }

        function showToast(message, duration = 2500) {
            const existingToast = document.querySelector('.app-toast');
            if (existingToast) {
                existingToast.remove();
            }
            
            const toast = document.createElement('div');
            toast.className = 'app-toast';
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                bottom: 80px;
                left: 50%;
                transform: translateX(-50%);
                background-color: rgba(0, 0, 0, 0.75);
                color: #FFFFFF;
                padding: 12px 20px;
                border-radius: 8px;
                font-size: 13px;
                z-index: 10000;
                white-space: nowrap;
                max-width: 90%;
                text-align: center;
                line-height: 1.5;
            `;
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.remove();
            }, duration);
        }

        document.addEventListener('DOMContentLoaded', function() {
            // 「我的任务」跳转契约：与项目主页共用 MyTasksStore 清单
            try {
                var _usp = new URLSearchParams(location.search);
                if (_usp.get('scope') === 'mytasks') {
                    myTasksMode = true;
                    myTasksRole = _usp.get('role') === 'worker' ? 'worker' : 'nonworker';
                    myTasksFlow = _usp.get('flow') || 'all';
                    var _mtTab = document.getElementById('tabMyTasks');
                    if (_mtTab) _mtTab.style.display = '';
                    renderMyTasksPanel();
                }
            } catch (e) {}

            // 新架构初始化：搬运旧区块 -> 配置驱动 -> 全部展开 -> 默认我的任务/合同 Tab -> 默认「进行中」流程项
            migrateLegacyBlocks();
            restructureTaskHierarchy();
            var _flowCfg = cfgList();
            applyFlowCfg(_flowCfg);
            initExpandAll();
            switchTaskTab(myTasksMode ? 'mytasks' : 'contract');
            if (myTasksMode) syncRailActive();
            else selectFlow(defaultFlowId(_flowCfg));

            checkSequentialTasks();
            renderContractProgress();

            // 架构层级初始化（来自项目详情跳转携带；项目部=不带参数）
            try {
                var lv = new URLSearchParams(location.search).get('level');
                if (lv && lv !== '项目部') {
                    currentFilters.level = lv;
                    updateFilterTags();
                    filterTasks();
                }
            } catch (e) {}

            // 「我参与」筛选初始化（来自项目详情「我的任务」区块跳转）
            try {
                var mineParam = new URLSearchParams(location.search).get('mine');
                if (mineParam === '1') {
                    currentFilters.role = 'mine';
                    currentFilters.mine = true;
                    syncPills();
                    filterTasks();
                }
            } catch (e) {}

            // 「待我执行 / 待我确认 / 我参与」筛选初始化（来自项目详情「我的任务」区块跳转携带 ?role=exec|confirm|mine）
            try {
                var roleParam = new URLSearchParams(location.search).get('role');
                if (roleParam === 'exec' || roleParam === 'confirm' || roleParam === 'mine') {
                    currentFilters.role = roleParam;
                    currentFilters.mine = (roleParam === 'mine');
                    syncPills();
                    filterTasks();
                }
            } catch (e) {}

            const participantOptions = document.querySelectorAll('.filter-option');
            participantOptions.forEach(function(option) {
                option.addEventListener('click', function(e) {
                    e.stopPropagation();
                    participantOptions.forEach(function(o) { o.classList.remove('active'); });
                    option.classList.add('active');
                    
                    const type = option.dataset.filter;
                    currentFilters.mine = type === 'mine';
                    filterTasks();
                });
            });
            
            // 状态下拉已改由行内 onclick 直连 toggleStatusDropdown/selectStatus，旧监听移除避免重复绑定。

        // 初始化：重算任务总数（含顶层临时任务区）
        filterTasks();
        });
        
        
        
        function closeActionMenu() {
            const actionMenu = document.getElementById('actionMenu');
            if (actionMenu) {
                actionMenu.classList.remove('show');
            }
        }
        
        
    