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
                g.innerHTML = '<div class="flow-group-head"><span class="flow-group-name"></span><span class="group-stat"></span></div><div class="flow-body show"></div>';
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

        function snapshotHtml(sec, fid, isTemp) {
            if (isTemp) {
                var temps = (sec && sec.temp) || [];
                if (!temps.length) return '<div class="flow-block temp-block"><div class="block-band temp-band">临时任务 <span class="badge">0</span></div><div class="block-empty">该流程项暂无临时任务</div></div>';
                return '<div class="flow-block temp-block"><div class="block-band temp-band">临时任务 <span class="badge">' + temps.length + '</span></div><div class="temp-tasks-list show">' +
                    temps.map(function (t) { return taskRow(t, fid, 'temp'); }).join('') + '</div></div>';
            }
            if (!sec || (!sec.tasks.length && !sec.stages.length)) {
                return '<div class="flow-block contract-block"><div class="block-band">合同内任务</div><div class="block-empty">该流程项暂无任务</div></div>';
            }
            var h = '<div class="flow-block contract-block"><div class="block-band">合同内任务</div>';
            if (sec.noContractYet) h += '<div class="snapshot-note">该流程项含合同，但尚未创建合同</div>';
            if (sec.stages.length) {
                h += '<div class="contract-tree">';
                sec.stages.forEach(function (sg) {
                    h += '<div class="stage-group show"><div class="stage-item">' +
                        '<div class="stage-header" onclick="toggleStage(this)"><div class="stage-dot pending"></div>' +
                        '<div class="stage-name">' + escTxt(sg.n) + '</div>' +
                        '<div class="stage-count">0/' + sg.tasks.length + ' 待开始</div><div class="arrow expanded">▼</div></div>' +
                        '<div class="task-list show">' +
                        sg.tasks.map(function (n) { return taskRow({ n: n, s: 'pending', e: '待指派' }, fid, 'contract'); }).join('') +
                        '</div></div></div>';
                });
                h += '</div>';
            } else {
                h += '<div class="task-list show">' + sec.tasks.map(function (t) { return taskRow(t, fid, 'contract'); }).join('') + '</div>';
            }
            return h + '</div>';
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

        function renderFlowRail(cfg) {
            var rail = document.getElementById('flowRail');
            if (!rail) return;
            rail.innerHTML = cfg.map(function (c) {
                return '<button type="button" class="flow-rail-item' + (c.id === activeFlowId ? ' active' : '') +
                    '" data-flow-id="' + escTxt(c.id) + '" onclick="selectFlow(\'' + escTxt(c.id) + '\')">' + escTxt(c.name) + '</button>';
            }).join('');
        }

        function applyFlowCfg(cfg) {
            var exists = false;
            for (var i = 0; i < cfg.length; i++) if (cfg[i].id === activeFlowId) exists = true;
            if (!exists) activeFlowId = defaultFlowId(cfg);
            buildSnapshotGroups(cfg);
            applyCfgNames(cfg);
            renderFlowRail(cfg);
            selectFlow(activeFlowId, true);
        }

        function activeTaskScope() {
            var panel = document.querySelector('.task-panel.is-active');
            if (!panel) return null;
            return panel.querySelector('.flow-group.is-active') || panel.querySelector('.flow-group');
        }

        function selectFlow(id, quiet) {
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

        function switchTaskTab(tab) {
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
            document.querySelectorAll('.flow-group').forEach(function (g) {
                var n = g.querySelectorAll('.task-item').length;
                var st = g.querySelector('.group-stat');
                if (st) st.textContent = '共 ' + n + ' 条';
                var badge = g.querySelector('.temp-band .badge');
                if (badge) badge.textContent = n;
            });
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
            document.querySelectorAll('.task-panel .flow-body, .task-panel .mc-children, .task-panel .stage-group, .task-panel .task-list, .task-panel .temp-tasks-list').forEach(function (el) {
                el.classList.add('show');
            });
            document.querySelectorAll('.task-panel .arrow').forEach(function (a) { a.classList.add('expanded'); });
            allExpanded = true;
            var btn = document.querySelector('.expand-all-btn');
            if (btn) btn.textContent = '收起全部';
        }

        function tagTasks() {
            document.querySelectorAll('.task-panel .flow-group').forEach(function (g) {
                var fid = g.getAttribute('data-flow-id');
                g.querySelectorAll('.task-item').forEach(function (t) { t.setAttribute('data-flow-id', fid); });
            });
        }

        function refresh() {
            tagTasks();
            filterTasks();
            deriveStats();
            try { renderContractProgress(); } catch (e) {}
        }

        window.addEventListener('pageshow', function () {
            applyFlowCfg(cfgList());
            refresh();
        });

