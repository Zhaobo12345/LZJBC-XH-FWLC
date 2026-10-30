
        /* ===================== 原型导航 收起/展开 ===================== */
        function togglePageNav() {
            var nav = document.querySelector('.page-nav');
            var btn = document.getElementById('pageNavToggle');
            if (!nav) return;
            var collapsed = nav.classList.toggle('collapsed');
            if (btn) btn.classList.toggle('collapsed', collapsed);
            try { localStorage.setItem('pageNavCollapsed', collapsed ? 'true' : 'false'); } catch (e) {}
        }
        /* 页面加载后恢复折叠状态 */
        (function restorePageNav() {
            try {
                if (localStorage.getItem('pageNavCollapsed') === 'true') {
                    var nav = document.querySelector('.page-nav');
                    var btn = document.getElementById('pageNavToggle');
                    if (nav) nav.classList.add('collapsed');
                    if (btn) btn.classList.add('collapsed');
                }
            } catch (e) {}
        })();

        /* ===================== 数据 ===================== */
        var SHARED = {
            nonworkerTodos: [
                { tag: 'contract', title: '泥瓦工班组服务合同确认', desc: '泥瓦工作组 | 待确认', status: '待确认', cls: 'urgent', icon: '🔵', bg: '#E6F7FF' },
                { tag: 'task', title: '吊顶安装', desc: '木工工作组 | 张三待确认', status: '待确认', cls: 'pending', icon: '🟢', bg: '#F6FFED', link: 'task-detail.html' }
            ],
            workerTaskTodos: [
                { tag: 'contract', title: '泥瓦工班组服务合同确认', desc: '泥瓦工作组 | 待我确认', status: '待确认', cls: 'urgent', icon: '🔵', bg: '#E6F7FF' },
                { tag: 'task', title: '墙面基层处理', desc: '油漆工作组 | 李四待确认', status: '待确认', cls: 'pending', icon: '🟢', bg: '#F6FFED' },
                { tag: 'task', title: '地砖铺贴', desc: '泥瓦工作组 | 王五待确认', status: '待确认', cls: 'pending', icon: '🔵', bg: '#E6F7FF' }
            ],
            workerContractTodos: [
                { tag: 'contract', title: '泥瓦工班组服务合同确认', desc: '泥瓦工作组 | 待我确认', status: '待我确认', cls: 'urgent', icon: '🔵', bg: '#E6F7FF' },
                { tag: 'contract', title: '木作班组服务合同签约', desc: '木工工作组 | 待我签约', status: '待我签约', cls: 'pending', icon: '🔵', bg: '#E6F7FF' }
            ],
            contracts: [
                { name: '水电班组服务合同', meta: '水电工作组 | 金额：8万', percent: 65, badge: '已确认', badgeCls: 'green', detail: 'contract-detail.html?status=draft' },
                { name: '泥瓦工班组服务合同', meta: '泥瓦工作组 | 金额：12万', percent: 30, badge: '已确认', badgeCls: 'green', detail: 'contract-detail.html?status=confirming_sender' }
            ],
            levels: [
                { name: '项目部', count: '4个工作组 · 8份合同', selected: false },
                { name: '水电工作组', count: '3个施工组 · 2份合同', selected: false },
                { name: '泥瓦工作组', count: '2个施工组 · 1份合同', selected: false },
                { name: '木工工作组', count: '2个施工组 · 1份合同', selected: false },
                { name: '油漆工作组', count: '1个施工组 · 1份合同', selected: false }
            ],
            activities: [
                { text: '陈庄 上传了水电验收照片', time: '09:20' },
                { text: '泥瓦工作组 提交阶段确认', time: '11:05' },
                { text: '系统：合同「木作班组服务合同」进入待签约', time: '14:30' }
            ],
            // 「我的任务」区块：我（当前视角角色）作为执行人的任务统计（原型示例数据）
            myTasks: {
                nonworker: { done: 3, total: 7 }, // 我（项目总）作为执行人的任务：已完成/全部
                worker: { done: 4, total: 6 }      // 我（工人）作为执行人的任务：已完成/全部
            }
        };

        var PROJECTS = [
            { name: 'XX小区整体装修', status: '进行中', address: 'XX小区***号***室', days: 60, area: '75.0m² 2室1厅',
              contractSigned: 4, contractTotal: 5, taskDone: 18, taskTotal: 24, trade: '泥瓦', todoCount: 4 },
            { name: 'YY花园精装修', status: '进行中', address: 'YY花园***栋***单元', days: 35, area: '89.0m² 3室2厅',
              contractSigned: 2, contractTotal: 3, taskDone: 8, taskTotal: 15, trade: '水电', todoCount: 3 },
            { name: 'AA别墅装修', status: '已完工', address: 'AA别墅***号', days: 120, area: '200.0m² 别墅',
              contractSigned: 6, contractTotal: 6, taskDone: 32, taskTotal: 32, trade: '木工', todoCount: 0 }
        ];

        var currentIndex = 0;
        var currentRole = 'nonworker';
        var panelFilter = 'all'; // 切换面板筛选项：all / ongoing / done
        var demoState = 'content'; // 空状态演示：content | loading | empty | offline

        /* ===================== 渲染：项目切换条 ===================== */
        function renderSwitchBar() {
            var p = PROJECTS[currentIndex];
            document.getElementById('curProjName').textContent = p.name;
            var st = document.getElementById('curProjStatus');
            st.textContent = p.status;
            st.className = 'proj-status' + (p.status === '已完工' ? ' done' : '');
        }

        function renderPanel() {
            // 按切换面板筛选项过滤项目：全部 / 进行中 / 已完成（数据中"已完工"等同"已完成"）
            var list = PROJECTS.filter(function (p) {
                if (panelFilter === 'ongoing') return p.status === '进行中';
                if (panelFilter === 'done') return p.status === '已完工' || p.status === '已完成';
                return true;
            });
            if (list.length === 0) {
                document.getElementById('projPanelInner').innerHTML = '<div class="proj-empty">暂无匹配的项目</div>';
                return;
            }
            var html = list.map(function (p, i) {
                // 过滤后索引需回映射真实 PROJECTS 下标，以便 selectProject 正确选中
                var realIdx = PROJECTS.indexOf(p);
                var pct = Math.round(p.contractSigned / p.contractTotal * 100);
                var active = realIdx === currentIndex ? ' active' : '';
                var done = p.status === '已完工' ? ' done' : '';
                return '<div class="proj-option' + active + '" onclick="selectProject(' + realIdx + ')">' +
                    '<div class="po-top"><span class="po-name">' + p.name + '</span>' +
                    '<span class="po-status' + done + '">' + p.status + '</span></div>' +
                    '<div class="po-addr">📍 ' + p.address + '</div>' +
                    '<div class="po-stats"><span>合同 ' + p.contractSigned + '/' + p.contractTotal + '</span>' +
                    '<span>任务 ' + p.taskDone + '/' + p.taskTotal + '</span></div>' +
                    '<div class="po-bar"><div class="po-bar-fill" style="width:' + pct + '%"></div></div>' +
                    '</div>';
            }).join('');
            document.getElementById('projPanelInner').innerHTML = html;
        }

        /* ===================== 渲染：非工人详情 ===================== */
        function renderNonWorker(p) {
            var todos = p.todoCount === 0
                ? '<div class="empty-state" style="font-size:12px;color:#999;padding:10px 0;text-align:center;">项目已完工，暂无待办 ☕</div>'
                : SHARED.nonworkerTodos.map(function (t) {
                    return '<div class="todo-item"' + (t.link ? ' onclick="go(\'' + t.link + '\')" style="cursor:pointer"' : '') + '>' +
                        '<div class="icon" style="background-color:' + t.bg + ';">' + t.icon + '</div>' +
                        '<div class="content"><div class="title">' + t.title + ' <span class="task-tag ' + t.tag + '">' + (t.tag === 'contract' ? '合同' : '任务') + '</span></div>' +
                        '<div class="desc">' + t.desc + '</div></div>' +
                        '<div class="status ' + t.cls + '">' + t.status + '</div></div>';
                }).join('');

            var levels = SHARED.levels.map(function (l, i) {
                return '<div class="level-option' + (i === 0 ? ' selected' : '') + '" onclick="pickLevel(this, event)">' +
                    '<div class="icon">' + (i === 0 ? '🏢' : '⚡') + '</div>' +
                    '<div class="info"><div class="name">' + l.name + '</div><div class="count">' + l.count + '</div></div>' +
                    '<div class="check" style="visibility:' + (i === 0 ? 'visible' : 'hidden') + ';">✓</div></div>';
            }).join('');

            var contracts = SHARED.contracts.map(function (c) {
                return '<div class="contract-item" onclick="navigate(\'' + c.detail + '\')">' +
                    '<div class="info"><div class="name">' + c.name + '</div><div class="meta">' + c.meta + '</div></div>' +
                    '<div class="progress-wrap"><div class="percent">' + c.percent + '%</div>' +
                    '<div class="bar"><div class="fill" style="width:' + c.percent + '%"></div></div></div></div>';
            }).join('');

            return '<div class="detail-fade">' +
                '<div class="card"><div class="card-title"><span>📋 待办事项</span>' +
                    '<span class="badge-wrap"><span class="badge">' + p.todoCount + '</span></span>' +
                    '<span class="more" onclick="openPage(\'todo-list.html\')">查看全部 ></span></div>' +
                    '<div class="todo-content">' + todos + '</div></div>' +
                '<div class="card my-task-card" onclick="openPage(\'task-list.html?role=exec\')"><div class="card-title"><span>📌 我的任务</span><span class="more">查看全部 ></span></div>' +
                    '<div class="my-task-stats">' +
                        '<div class="my-task-stat"><div class="value">' + SHARED.myTasks.nonworker.done + '</div><div class="label">已完成</div></div>' +
                        '<div class="my-task-divider"></div>' +
                        '<div class="my-task-stat"><div class="value">' + SHARED.myTasks.nonworker.total + '</div><div class="label">我作为执行人的全部任务</div></div>' +
                    '</div></div>' +
                '<div class="sticky-header" id="stickyHeader">' +
                    '<div class="quick-nav" id="quickNavNon">' +
                        '<div class="quick-nav-item" onclick="go(\'architecture.html\')"><div class="icon structure">🏗️</div><div class="label">架构</div></div>' +
                        '<div class="quick-nav-item" onclick="go(\'member.html\')"><div class="icon member">👥</div><div class="label">成员</div></div>' +
                        '<div class="quick-nav-item" onclick="go(\'project-files.html\')"><div class="icon file">📁</div><div class="label">资料</div></div>' +
                        '<div class="quick-nav-item" onclick="go(\'statement-list.html\')"><div class="icon statement">💰</div><div class="label">对账单</div></div></div>' +
                    '<div class="level-selector arch-half" id="levelSelectorNon"><div class="level-dropdown" onclick="toggleLevelOpts(this)">' +
                        '<div class="current"><div class="icon">🏢</div><div>' +
                        '<div class="text-row"><div class="text">项目部</div><div class="type-badge project">项目部</div></div>' +
                        '<div class="breadcrumb-inline"><span class="breadcrumb-item active">项目部</span></div></div></div>' +
                        '<div class="arrow">▼</div></div>' +
                        '<div class="level-options">' + levels + '</div></div>' +
                '</div>' +
                '<div class="stats-row">' +
                    '<div class="card contract-half"><div class="card-title"><span>📄 合同概览</span><span class="more" onclick="toggleContractNW(this)">查看合同 <span class="arrow">▼</span></span></div>' +
                        '<div class="contract-summary"><div class="contract-stat"><div class="value"><span class="current">' + p.contractSigned + '</span><span class="separator">/</span><span class="total">' + p.contractTotal + '</span></div><div class="label">合同签约</div></div>' +
                        '<div class="contract-stat"><div class="value">' + Math.round(p.contractSigned / p.contractTotal * 100) + '<span class="total">%</span></div><div class="label">总进度</div></div></div>' +
                        '<div class="contract-list" id="contractListNW">' + contracts + '</div></div>' +
                    '<div class="card task-half"><div class="card-title"><span>📊 任务统计</span><span class="more" onclick="go(\'task-list.html\')">查看全部 ></span></div>' +
                        '<div class="task-stats">' +
                            '<div class="task-stat-item"><div class="icon-wrap all">📋</div><div class="info"><div class="value"><span class="current">' + p.taskDone + '</span><span class="separator">/</span><span class="total">' + p.taskTotal + '</span></div><div class="label">全部任务</div></div></div>' +
                            '<div class="task-stat-item"><div class="icon-wrap accept">⏳</div><div class="info"><div class="value">3</div><div class="label">确认中任务</div></div></div>' +
                            '<div class="task-stat-item"><div class="icon-wrap contract">▶</div><div class="info"><div class="value">2</div><div class="label">执行中任务</div></div></div>' +
                        '</div></div>' +
                '</div>' +
                '<div class="card indent-card"><div class="card-title"><span>📝 今日动态</span><span class="more" onclick="go(\'activity-list.html\')">查看全部 ></span></div>' +
                    '<div class="activity-list" id="activityList">' +
                        '<div class="activity-item" onclick="go(\'task-detail.html\')">' +
                            '<div class="activity-header"><div class="activity-avatar" style="background: linear-gradient(135deg, #1890FF 0%, #40A9FF 100%);">陈</div>' +
                            '<div class="activity-info"><div class="activity-user">陈庄<span class="activity-role-tag project-manager">项目总</span></div><div class="activity-time">01-15 10:30</div></div></div>' +
                            '<div class="activity-content">确认了<span class="activity-stage-tag plumbing">水电</span>开槽布线</div>' +
                            '<div class="activity-media">' +
                                '<div class="activity-media-item" style="background: url(\'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=120&h=120&fit=crop\') center/cover;"></div>' +
                                '<div class="activity-media-item" style="background: url(\'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=120&h=120&fit=crop\') center/cover;"></div>' +
                                '<div class="activity-media-item" style="background: url(\'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=120&h=120&fit=crop\') center/cover; position: relative;"><div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 24px; height: 24px; background: rgba(0,0,0,0.5); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 10px;">▶</div></div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="activity-item secondary" onclick="go(\'task-detail.html\')">' +
                            '<div class="activity-header"><div class="activity-avatar" style="background: linear-gradient(135deg, #52C41A 0%, #73D13D 100%);">张</div>' +
                            '<div class="activity-info"><div class="activity-user">张工长<span class="activity-role-tag foreman">工长</span></div><div class="activity-time">01-15 09:15</div></div></div>' +
                            '<div class="activity-content">完成了<span class="activity-stage-tag plumbing">水电</span>开槽布线 的施工</div>' +
                            '<div class="activity-media">' +
                                '<div class="activity-media-item" style="background: url(\'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=120&h=120&fit=crop\') center/cover;"></div>' +
                                '<div class="activity-media-item" style="background: url(\'https://images.unsplash.com/photo-1585232351009-aa654f89dfed?w=120&h=120&fit=crop\') center/cover;"></div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="activity-item hidden tertiary" onclick="go(\'task-detail.html\')">' +
                            '<div class="activity-header"><div class="activity-avatar" style="background: linear-gradient(135deg, #13C2C2 0%, #36CFC9 100%);">王</div>' +
                            '<div class="activity-info"><div class="activity-user">王水电<span class="activity-role-tag plumbing-worker">水电工</span></div><div class="activity-time">01-15 08:30</div></div></div>' +
                            '<div class="activity-content">水电改造 已完成</div>' +
                        '</div>' +
                        '<div class="activity-item hidden quaternary" onclick="go(\'contract-detail.html\')">' +
                            '<div class="activity-header"><div class="activity-avatar" style="background: linear-gradient(135deg, #722ED1 0%, #9254DE 100%);">陈</div>' +
                            '<div class="activity-info"><div class="activity-user">陈设计<span class="activity-role-tag designer">设计师</span></div><div class="activity-time">01-15 08:00</div></div></div>' +
                            '<div class="activity-content">设计服务合同签约完成</div>' +
                            '<div class="activity-media"><div class="activity-media-item" style="background: url(\'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=120&h=120&fit=crop\') center/cover;"></div></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="activity-more-btn" id="activityMoreBtn" onclick="toggleActivityList()">' +
                        '<span id="activityMoreText">展开更多</span>' +
                        '<span class="arrow">▼</span>' +
                    '</div>' +
                '</div>' +
                '</div>';
        }

        /* ===================== 渲染：工人详情 ===================== */
        function renderWorker(p) {
            var taskTodos = SHARED.workerTaskTodos.map(function (t) {
                return '<div class="todo-item"' + (t.link ? ' onclick="go(\'' + t.link + '\')" style="cursor:pointer"' : '') + '>' +
                    '<div class="icon" style="background-color:' + t.bg + ';">' + t.icon + '</div>' +
                    '<div class="content"><div class="title">' + t.title + ' <span class="task-tag ' + t.tag + '">' + (t.tag === 'contract' ? '合同' : '任务') + '</span></div>' +
                    '<div class="desc">' + t.desc + '</div></div>' +
                    '<div class="status ' + t.cls + '">' + t.status + '</div></div>';
            }).join('');

            var levels = SHARED.levels.map(function (l, i) {
                var sel = l.name === p.trade + '工作组';
                var icon = l.name === '项目部' ? '🏢' : '⚡';
                return '<div class="level-option' + (sel ? ' selected' : '') + '" onclick="pickLevel(this, event)">' +
                    '<div class="icon">' + icon + '</div>' +
                    '<div class="info"><div class="name">' + l.name + '</div><div class="count">' + l.count + '</div></div>' +
                    '<div class="check" style="visibility:' + (sel ? 'visible' : 'hidden') + ';">✓</div></div>';
            }).join('');

            var contracts = SHARED.contracts.filter(function (c) { return c.name !== '水电班组服务合同'; }).map(function (c) {
                return '<div class="contract-item" onclick="navigate(\'' + c.detail + '\')">' +
                    '<div class="info"><div class="name">' + c.name + '</div><div class="meta-row">' +
                        '<span class="meta">' + c.meta + '</span><span class="action-badge ' + c.badgeCls + '">' + c.badge + '</span></div></div>' +
                    '<div class="progress-wrap"><div class="percent">' + c.percent + '%</div>' +
                    '<div class="bar"><div class="fill" style="width:' + c.percent + '%"></div></div></div></div>';
            }).join('');

            return '<div class="detail-fade">' +
                '<div class="card todo-card worker"><div class="card-title"><span>📋 待办事项</span>' +
                    '<span class="badge-wrap"><span class="badge">' + p.todoCount + '</span></span>' +
                    '<span class="more" onclick="openPage(\'todo-list.html\')">查看全部 ></span></div>' +
                    '<div class="todo-content">' +
                        (p.todoCount === 0 ? '<div class="empty-state" style="font-size:12px;color:#999;padding:8px 0;">暂无待办，休息一下 ☕</div>'
                            : taskTodos) +
                    '</div></div>' +
                '<div class="card my-task-card worker" onclick="openPage(\'task-list.html?role=exec\')"><div class="card-title"><span>📌 我的任务</span><span class="more">查看全部 ></span></div>' +
                    '<div class="my-task-stats">' +
                        '<div class="my-task-stat"><div class="value">' + SHARED.myTasks.worker.done + '</div><div class="label">已完成</div></div>' +
                        '<div class="my-task-divider"></div>' +
                        '<div class="my-task-stat"><div class="value">' + SHARED.myTasks.worker.total + '</div><div class="label">我作为执行人的全部任务</div></div>' +
                    '</div></div>' +
                '<div class="sticky-header" id="stickyHeader">' +
                    '<div class="quick-nav work-quick-nav" id="quickNavWork">' +
                        '<div class="quick-nav-item keep" onclick="go(\'activity-list.html\')"><div class="icon activity">📝</div><div class="label">项目动态</div></div>' +
                        '<div class="quick-nav-item" onclick="go(\'architecture.html\')"><div class="icon structure">🏗️</div><div class="label">架构</div></div>' +
                        '<div class="quick-nav-item" onclick="go(\'member.html\')"><div class="icon member">👥</div><div class="label">成员</div></div>' +
                        '<div class="quick-nav-item" onclick="go(\'project-files.html\')"><div class="icon file">📁</div><div class="label">资料</div></div></div>' +
                    '<div class="level-selector arch-half" id="levelSelectorWork"><div class="level-dropdown" onclick="toggleLevelOpts(this)">' +
                        '<div class="current"><div class="icon">⚡</div><div>' +
                        '<div class="text-row"><div class="text">' + p.trade + '工作组</div><div class="type-badge workgroup">工作组</div></div>' +
                        '<div class="breadcrumb-inline"><span class="breadcrumb-item">项目部</span><span class="separator">›</span><span class="breadcrumb-item active">' + p.trade + '工作组</span></div>' +
                        '<div class="level-default-hint">默认我的工作组</div></div></div>' +
                        '<div class="arrow">▼</div></div>' +
                        '<div class="level-options">' + levels + '</div></div>' +
                '</div>' +
                '<div class="stats-row"><div class="card contract-half worker"><div class="card-title"><span>📄 合同</span></div>' +
                    '<div class="contract-list show" id="contractListWorker">' + contracts + '</div></div>' +
                    '<div class="card task-half worker"><div class="card-title"><span>📊 任务统计</span><span class="more" onclick="go(\'task-list.html\')">查看全部 ></span></div>' +
                        '<div class="task-stats">' +
                            '<div class="task-stat-item"><div class="icon-wrap all">📋</div><div class="info"><div class="value"><span class="current">' + p.taskDone + '</span><span class="separator">/</span><span class="total">' + p.taskTotal + '</span></div><div class="label">全部任务</div></div></div>' +
                            '<div class="task-stat-item"><div class="icon-wrap accept">⏳</div><div class="info"><div class="value">3</div><div class="label">确认中任务</div></div></div>' +
                            '<div class="task-stat-item"><div class="icon-wrap contract">▶</div><div class="info"><div class="value">2</div><div class="label">执行中任务</div></div></div>' +
                        '</div></div>' +
                '</div>' +
                '</div>';
        }

        /* ===================== 顶部一行：项目名/切换 + 角色摘要 ===================== */
        function renderTopHero(p) {
            var el = document.getElementById('topHero');
            // 非工人视角与工人视角的 proj-info-zone 展示内容保持统一：均用「项目信息」引导文案（点击左侧查看项目信息），避免角色间不一致
            el.textContent = '项目信息';
        }

        /* ===================== 主渲染 ===================== */
        function renderDetail() {
            var p = PROJECTS[currentIndex];
            renderTopHero(p);
            var area = document.getElementById('detailArea');
            if (demoState === 'content') {
                area.innerHTML = currentRole === 'nonworker' ? renderNonWorker(p) : renderWorker(p);
            } else if (demoState === 'loading') {
                EmptyState.showLoading(area, '加载中...');
            } else if (demoState === 'empty') {
                EmptyState.show(area, {
                    type: 'empty-project',
                    title: '暂无项目',
                    desc: '您还没有创建任何项目，点击下方按钮开始创建',
                    actionText: '创建项目',
                    onAction: function () { showToast('演示：跳转创建项目'); }
                });
            } else if (demoState === 'offline') {
                EmptyState.showOffline(area, function () {
                    setDemoState('loading');
                    setTimeout(function () { setDemoState('content'); }, 1500);
                });
            }
        }

        /* 空状态演示：切换 加载中 / 空状态 / 无网络 / 有数据 */
        function setDemoState(state) {
            demoState = state;
            updateDemoBtns();
            renderDetail();
        }
        function updateDemoBtns() {
            document.querySelectorAll('.demo-btn').forEach(function (b) {
                b.classList.toggle('active', b.dataset.state === demoState);
            });
        }

        /* ===================== 交互 ===================== */
        function togglePanel() {
            var panel = document.getElementById('projPanel');
            var arrow = document.getElementById('switchArrow');
            var open = panel.classList.toggle('open');
            arrow.classList.toggle('open', open);
        }

        function selectProject(i) {
            currentIndex = i;
            renderSwitchBar();
            renderPanel();
            togglePanel(); // 收起
            renderDetail();
        }

        /* 切换面板：状态筛选（全部 / 进行中 / 已完成） */
        function setPanelFilter(f, el) {
            panelFilter = f;
            var items = document.querySelectorAll('#projPanelFilter .pf-item');
            items.forEach(function (it) { it.classList.remove('active'); });
            if (el) el.classList.add('active');
            renderPanel();
        }

        /* 新建项目：参考「项目列表」创建图标逻辑（认证后跳转 / 未认证弹窗） */
        var isUserCertified = false;
        function createProject() {
            if (isUserCertified) {
                location.href = 'create-project.html';
            } else {
                document.getElementById('authRequiredModal').classList.add('show');
            }
        }
        function closeAuthModal() {
            document.getElementById('authRequiredModal').classList.remove('show');
        }
        function goToAuthPage() {
            closeAuthModal();
            location.href = 'promoter-auth.html';
        }
        function toggleAuthStatus(certified) {
            isUserCertified = certified;
            var statusEl = document.getElementById('authStatus');
            if (certified) {
                statusEl.textContent = '已认证';
                statusEl.classList.add('certified');
            } else {
                statusEl.textContent = '未认证';
                statusEl.classList.remove('certified');
            }
        }

        function toggleRoleSwitch(checked) {
            currentRole = checked ? 'worker' : 'nonworker';
            var statusEl = document.getElementById('roleStatus');
            statusEl.textContent = currentRole === 'worker' ? '工人' : '非工人';
            statusEl.classList.toggle('worker', currentRole === 'worker');
            renderDetail();
        }

        function toggleLevelOpts(el) {
            var box = el.parentElement.querySelector('.level-options');
            var arrow = el.querySelector('.arrow');
            var open = box.classList.toggle('open');
            arrow.classList.toggle('open', open);
        }

        /* 滚动联动：仅维护吸顶阴影（快捷入口常驻一行，不随滚动隐藏） */
        (function initScrollFx() {
            var scroller = document.getElementById('detailArea');
            if (!scroller) return;
            scroller.addEventListener('scroll', function () {
                var top = scroller.scrollTop;
                var sh = document.getElementById('stickyHeader');
                if (sh) {
                    if (top > 4) sh.classList.add('with-shadow');
                    else sh.classList.remove('with-shadow');
                }
            }, { passive: true });
        })();

        function pickLevel(el, e) {
            if (e) e.stopPropagation();
            var opts = el.parentElement.querySelectorAll('.level-option');
            opts.forEach(function (o) {
                o.classList.remove('selected');
                var c = o.querySelector('.check');
                if (c) c.style.visibility = 'hidden';
            });
            el.classList.add('selected');
            var c = el.querySelector('.check');
            if (c) c.style.visibility = 'visible';

            /* 回写顶部「当前层级」展示，并收起下拉框。
               注意：.level-option 与 .level-dropdown 是 .level-selector 下的「兄弟」节点，
               因此不能用 el.closest('.level-dropdown') 查找（会返回 null），需沿 .level-selector 定位。 */
            var selector = el.closest('.level-selector');
            if (!selector) return;
            var dd = selector.querySelector('.level-dropdown');
            if (!dd) return;
            var icon = el.querySelector('.icon') ? el.querySelector('.icon').textContent : '';
            var name = el.querySelector('.info .name') ? el.querySelector('.info .name').textContent : '';
            var isProject = name === '项目部';
            var cur = dd.querySelector('.current');
            if (cur) {
                var ci = cur.querySelector('.icon'); if (ci) ci.textContent = icon;
                var tx = cur.querySelector('.text-row .text'); if (tx) tx.textContent = name;
                var badge = cur.querySelector('.text-row .type-badge');
                if (badge) { badge.textContent = isProject ? '项目部' : '工作组'; badge.className = 'type-badge ' + (isProject ? 'project' : 'workgroup'); }
                var bc = cur.querySelector('.breadcrumb-inline .breadcrumb-item.active'); if (bc) bc.textContent = name;
            }
            var box = selector.querySelector('.level-options');
            if (box) box.classList.remove('open');
            var arrow = dd.querySelector('.arrow');
            if (arrow) arrow.classList.remove('open');
        }

        /* 真实跳转至目标原型页（与「项目详情」页 data-href 机制一致：点击即跳转，不再仅弹提示） */
        function navigate(href) { if (href) window.location.href = href; }
        function go(href) { /* 统一走真实跳转（原占位提示已替换为实际页面导航） */ navigate(href); }
        function openPage(href) { /* 真实跳转至目标原型页（待办事项/我的任务 查看全部 专用） */ window.location.href = href; }

        /* 今日动态：展开 / 收起（与源页「展开更多」一致：默认显示 2 条，展开显示全部 4 条） */
        function toggleActivityList() {
            var list = document.getElementById('activityList');
            var btn = document.getElementById('activityMoreBtn');
            if (!list || !btn) return;
            var expanded = list.classList.toggle('expanded');
            var hidden = list.querySelectorAll('.activity-item.tertiary, .activity-item.quaternary');
            hidden.forEach(function (it) { it.classList.toggle('hidden', !expanded); });
            var txt = document.getElementById('activityMoreText');
            var arrow = btn.querySelector('.arrow');
            if (txt) txt.textContent = expanded ? '收起' : '展开更多';
            if (arrow) arrow.classList.toggle('open', expanded);
        }

        /* 合同概览：查看合同 ▼ 折叠 / 展开合同列表 */
        function toggleContractNW(el) {
            var list = document.getElementById('contractListNW');
            if (!list) return;
            var shown = list.classList.toggle('show');
            if (el) {
                var arrow = el.querySelector('.arrow');
                if (arrow) arrow.classList.toggle('open', shown);
            }
        }

        function viewProjectInfo() {
            // 恢复「点击查看项目信息」：跳转独立的项目信息原型页
            window.location.href = 'project-info.html';
        }

        function showToast(msg) {
            var t = document.createElement('div');
            t.textContent = msg;
            t.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,.8);color:#fff;font-size:13px;padding:10px 16px;border-radius:8px;z-index:200;white-space:nowrap;';
            document.querySelector('.phone-frame').appendChild(t);
            setTimeout(function () { t.remove(); }, 1600);
        }

        /* ===================== 点击面板外部自动收起 ===================== */
        document.addEventListener('click', function (e) {
            var panel = document.getElementById('projPanel');
            var topbar = document.querySelector('.topbar');
            if (panel.classList.contains('open') && !topbar.contains(e.target)) {
                togglePanel();
            }
        });

        /* ===================== 初始化 ===================== */
        renderSwitchBar();
        renderPanel();
        renderDetail();
        updateDemoBtns();
    