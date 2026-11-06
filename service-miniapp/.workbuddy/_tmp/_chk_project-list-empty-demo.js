
    /* ===== 自包含 EmptyState（内联，去除外部 ../shared 依赖） ===== */
    (function () {
      var ICONS = {
        'empty-project': '<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="24" y="48" width="72" height="56" rx="4" fill="#F0F5FF" stroke="#1890FF" stroke-width="2"/><path d="M24 64H96" stroke="#1890FF" stroke-width="2"/><rect x="36" y="56" width="16" height="4" rx="2" fill="#1890FF"/><polygon points="60,16 96,48 24,48" fill="#E6F7FF" stroke="#1890FF" stroke-width="2" stroke-linejoin="round"/><rect x="52" y="72" width="16" height="32" rx="2" fill="#1890FF" fill-opacity="0.3"/><circle cx="78" cy="84" r="8" stroke="#1890FF" stroke-width="2" stroke-dasharray="4 2"/></svg>',
        'no-network': '<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M60 24C78 24 92 34 96 48" stroke="#FF4D4F" stroke-width="3" stroke-linecap="round"/><path d="M60 36C72 36 82 44 86 56" stroke="#FF4D4F" stroke-width="3" stroke-linecap="round"/><path d="M60 48C68 48 74 54 76 62" stroke="#FF4D4F" stroke-width="3" stroke-linecap="round"/><circle cx="60" cy="76" r="8" fill="#FF4D4F" fill-opacity="0.2" stroke="#FF4D4F" stroke-width="2"/><line x1="32" y1="88" x2="88" y2="32" stroke="#FF4D4F" stroke-width="3" stroke-linecap="round"/><circle cx="24" cy="96" r="12" fill="#FFF1F0" stroke="#FF4D4F" stroke-width="2"/><text x="24" y="100" font-family="Arial" font-size="12" fill="#FF4D4F" text-anchor="middle">!</text></svg>'
      };
      function targetOf(t) { return typeof t === 'string' ? document.querySelector(t) : t; }
      function clearOf(c) { if (c) c.innerHTML = ''; }
      function showLoading(area, text) {
        var c = targetOf(area); if (!c) return;
        clearOf(c);
        var wrap = document.createElement('div'); wrap.className = 'loading-state';
        var cards = '';
        for (var i = 0; i < 3; i++) {
          cards += '<div class="skel-card"><div class="skel-line"></div><div class="skel-line mid"></div><div class="skel-line short"></div></div>';
        }
        wrap.innerHTML = cards + '<div class="loading-hint">' + (text || '加载中...') + '</div>';
        c.appendChild(wrap);
      }
      function show(area, opts) {
        opts = opts || {};
        var c = targetOf(area); if (!c) return;
        clearOf(c);
        var wrap = document.createElement('div'); wrap.className = 'empty-state';
        var h = '';
        var ic = ICONS[opts.type] || ICONS['empty-project'];
        h += '<div class="illustration">' + ic + '</div>';
        if (opts.title) h += '<div class="empty-title">' + opts.title + '</div>';
        if (opts.desc) h += '<div class="empty-desc">' + opts.desc + '</div>';
        if (opts.actionText) h += '<button class="empty-action">' + opts.actionText + '</button>';
        wrap.innerHTML = h;
        c.appendChild(wrap);
        if (opts.actionText && typeof opts.onAction === 'function') {
          wrap.querySelector('.empty-action').addEventListener('click', opts.onAction);
        }
      }
      function showOffline(area, onRetry) {
        var c = targetOf(area); if (!c) return;
        clearOf(c);
        var wrap = document.createElement('div'); wrap.className = 'offline-state';
        var h = '<div class="offline-icon">' + ICONS['no-network'] + '</div>';
        h += '<div class="empty-title">网络连接失败</div>';
        h += '<div class="empty-desc">请检查网络设置后重试</div>';
        h += '<button class="empty-action">重新加载</button>';
        wrap.innerHTML = h;
        c.appendChild(wrap);
        wrap.querySelector('.empty-action').addEventListener('click', function () {
          if (typeof onRetry === 'function') onRetry();
        });
      }
      window.EmptyState = { showLoading: showLoading, show: show, showOffline: showOffline, ILLUSTRATIONS: ICONS };
    })();
    
;

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


            return '<div class="detail-fade">' +
                '<div class="card"><div class="card-title"><span>📋 待办事项</span>' +
                    '<span class="badge-wrap"><span class="badge">' + p.todoCount + '</span></span>' +
                    '<span class="more" onclick="openPage(\'todo-list.html\')">查看全部 ></span></div>' +
                    '<div class="todo-content">' + todos + '</div></div>' +
                '<div class="card my-task-card" onclick="openPage(\'task-list.html?scope=mytasks&role=' + currentRole + '\')"><div class="card-title"><span>📌 我的任务</span><span class="more">查看全部 ></span></div>' +
                    '<div class="my-task-stats">' +
                        '<div class="my-task-stat"><div class="value">' + SHARED.myTasks.nonworker.done + '</div><div class="label">已完成</div></div>' +
                        '<div class="my-task-divider"></div>' +
                        '<div class="my-task-stat"><div class="value">' + SHARED.myTasks.nonworker.total + '</div><div class="label">我作为执行人的全部任务</div></div>' +
                    '</div></div>' +
                '<div class="sticky-header" id="stickyHeader">' +
                    '<div class="quick-nav" id="quickNavNon">' +
                        '<div class="qn" onclick="go(\'member.html\')"><span class="qn-ic">众</span><span class="qn-tx">项目成员</span></div>' +
                        '<div class="qn" onclick="go(\'project-files.html\')"><span class="qn-ic">资</span><span class="qn-tx">资料</span></div>' +
                        '<div class="qn" onclick="go(\'statement-list.html\')"><span class="qn-ic">账</span><span class="qn-tx">对账单</span></div>' +
                        '<div class="qn" onclick="go(\'contract-list.html\')"><span class="qn-ic">合</span><span class="qn-tx">合同</span></div>' +
                    '</div>' +
                '</div>' +
                // 服务流程（与项目主页宏观逻辑一致；合同/任务统计已并入流程卡统计条）
                '<div id="flowHost"></div>' +
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


            return '<div class="detail-fade">' +
                '<div class="card todo-card worker"><div class="card-title"><span>📋 待办事项</span>' +
                    '<span class="badge-wrap"><span class="badge">' + p.todoCount + '</span></span>' +
                    '<span class="more" onclick="openPage(\'todo-list.html\')">查看全部 ></span></div>' +
                    '<div class="todo-content">' +
                        (p.todoCount === 0 ? '<div class="empty-state" style="font-size:12px;color:#999;padding:8px 0;">暂无待办，休息一下 ☕</div>'
                            : taskTodos) +
                    '</div></div>' +
                '<div class="card my-task-card worker" onclick="openPage(\'task-list.html?scope=mytasks&role=' + currentRole + '\')"><div class="card-title"><span>📌 我的任务</span><span class="more">查看全部 ></span></div>' +
                    '<div class="my-task-stats">' +
                        '<div class="my-task-stat"><div class="value">' + SHARED.myTasks.worker.done + '</div><div class="label">已完成</div></div>' +
                        '<div class="my-task-divider"></div>' +
                        '<div class="my-task-stat"><div class="value">' + SHARED.myTasks.worker.total + '</div><div class="label">我作为执行人的全部任务</div></div>' +
                    '</div></div>' +
                '<div class="sticky-header" id="stickyHeader">' +
                    '<div class="quick-nav" id="quickNavWork">' +
                        '<div class="qn" onclick="go(\'activity-list.html\')"><span class="qn-ic">动</span><span class="qn-tx">项目动态</span></div>' +
                        '<div class="qn" onclick="go(\'member.html\')"><span class="qn-ic">团</span><span class="qn-tx">项目成员</span></div>' +
                        '<div class="qn" onclick="go(\'project-files.html\')"><span class="qn-ic">资</span><span class="qn-tx">资料</span></div>' +
                        '<div class="qn" onclick="go(\'contract-detail.html\')"><span class="qn-ic">合</span><span class="qn-tx">我的合同</span></div>' +
                    '</div>' +
                '</div>' +
                // 服务流程（与项目主页宏观逻辑一致；合同/任务统计已并入流程卡统计条）
                '<div id="flowHost"></div>' +
                '</div>';
        }

        /* ===================== 顶部一行：项目名/切换 + 角色摘要 ===================== */
        function renderTopHero(p) {
            var el = document.getElementById('topHero');
            // 非工人视角与工人视角的 proj-info-zone 展示内容保持统一：均用「项目信息」引导文案（点击左侧查看项目信息），避免角色间不一致
            el.textContent = '项目信息';
        }

        /* ===================== 主渲染 ===================== */
        /* 空状态/加载中/无网络 三种演示态均代表「无项目数据」，此时顶部项目切换条
           仍展示具体项目名是矛盾的，故非「有数据」态时隐藏顶部切换条（含其下拉面板） */
        function updateTopbarVisibility() {
            var tb = document.querySelector('.topbar');
            if (!tb) return;
            tb.style.display = demoState === 'content' ? '' : 'none';
            var ft = document.getElementById('flowTrigger');
            if (ft) ft.style.display = demoState === 'content' ? '' : 'none';
            if (demoState !== 'content') closeFlowDrawer();
        }
        function renderDetail() {
            var p = PROJECTS[currentIndex];
            renderTopHero(p);
            updateTopbarVisibility();
            var area = document.getElementById('detailArea');
            if (demoState === 'content') {
                area.innerHTML = currentRole === 'nonworker' ? renderNonWorker(p) : renderWorker(p);
                flowMount();
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
            closeFlowDrawer();
            renderDetail();
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

        /* ============================================================
           新版「服务流程」模块（移植自 project-list.html SSOT）
           交互/功能外壳升级：横向流程条 + 右侧浮窗抽屉 + 阶段折叠
           + 指派任务（临时任务）+ 流程配置入口(⚙) + 合同双口径。
           状态语义：空状态演示页「有数据」= 进行中项目。
           ============================================================ */
        var FLOW_MODE = 'content';
        var flowCfgPerm = 'all';      // 演示：流程配置权限 all/readonly/none
        var assignPermMode = 'all';   // 演示：指派任务权限 all/partial/none
        var AS_WORKERS = [
          { name: '王强', role: '施工' },
          { name: '李伟', role: '施工' },
          { name: '孙磊', role: '监理' },
          { name: '赵敏', role: '水电' },
          { name: '钱七', role: '油漆' }
        ];
        var asExecutor = '';
        var asConfirmers = [];
        var canViewAllFlow = true;
        var fdDetailTab = 'stage';
        var fdStageCollapsed = {};
        var fdLastSelId = null;
        var _flowScrollBound = false;

        /* ===== 状态色 ===== */
function baseItems() {
  return [
          {
            id: 'lh',
            name: '量房',
            kind: 'task',
            status: '已完成',
            done: 3,
            total: 3,
            tasks: [
              {
                name: '原始尺寸复测',
                exec: '张设计',
                status: '已完成'
              },
              {
                name: '墙体结构勘测',
                exec: '李设计',
                status: '已完成'
              },
              {
                name: '设备点位确认',
                exec: '王设计',
                status: '已完成'
              }
            ]
          },
          {
            id: 'cs',
            name: '初步设计',
            kind: 'task',
            status: '已完成',
            done: 4,
            total: 4,
            tasks: [
              {
                name: '方案文件·户型优化',
                exec: '张设计',
                status: '已完成'
              },
              {
                name: '内部评审',
                exec: '李设计',
                status: '已完成'
              },
              {
                name: '会审',
                exec: '王设计',
                status: '已完成'
              },
              {
                name: '方案定稿',
                exec: '张设计',
                status: '已完成'
              }
            ]
          },
          {
            id: 'ht',
            name: '设计合同',
            kind: 'contract',
            status: '已完成',
            done: 2,
            total: 2,
            subCount: 2,
            mainDone: true,
            subDone: 1,
            hasContract: true,
            stages: [
              {
                id: 'ht-s1',
                name: '设计服务合同',
                status: '已完成',
                collapsed: false,
                tasks: [
                  {
                    name: '设计服务合同·阶段1',
                    status: '已完成'
                  },
                  {
                    name: '设计服务合同·阶段2',
                    status: '已完成'
                  }
                ]
              },
              {
                id: 'ht-s2',
                name: '软装设计分包',
                status: '已完成',
                collapsed: false,
                tasks: [
                  {
                    name: '软装设计分包·阶段1',
                    status: '已完成'
                  }
                ]
              }
            ],
            externals: [
              {
                name: '设计交底',
                exec: '张设计',
                status: '已完成'
              }
            ]
          },
          {
            id: 'sg',
            name: '施工合同',
            kind: 'contract',
            status: '进行中',
            done: 5,
            total: 8,
            subCount: 4,
            mainDone: false,
            subDone: 0,
            hasContract: true,
            stages: [
              {
                id: 'sg-s1',
                name: '基础施工服务合同',
                status: '进行中',
                collapsed: false,
                tasks: [
                  {
                    name: '基础施工服务合同·阶段1',
                    status: '已完成'
                  },
                  {
                    name: '基础施工服务合同·阶段2',
                    status: '已完成'
                  },
                  {
                    name: '基础施工服务合同·阶段3',
                    status: '已完成'
                  },
                  {
                    name: '基础施工服务合同·阶段4',
                    status: '已完成'
                  },
                  {
                    name: '基础施工服务合同·阶段5',
                    status: '已完成'
                  },
                  {
                    name: '基础施工服务合同·阶段6',
                    status: '未开始'
                  },
                  {
                    name: '基础施工服务合同·阶段7',
                    status: '未开始'
                  },
                  {
                    name: '基础施工服务合同·阶段8',
                    status: '未开始'
                  }
                ]
              },
              {
                id: 'sg-s2',
                name: '水电分包合同',
                status: '进行中',
                collapsed: false,
                tasks: [
                  {
                    name: '水电分包合同·阶段1',
                    status: '已完成'
                  },
                  {
                    name: '水电分包合同·阶段2',
                    status: '已完成'
                  },
                  {
                    name: '水电分包合同·阶段3',
                    status: '未开始'
                  }
                ]
              },
              {
                id: 'sg-s3',
                name: '木工分包合同',
                status: '未开始',
                collapsed: false,
                tasks: [
                  {
                    name: '木工分包合同·阶段1',
                    status: '未开始'
                  },
                  {
                    name: '木工分包合同·阶段2',
                    status: '未开始'
                  }
                ]
              },
              {
                id: 'sg-s4',
                name: '主材分包合同',
                status: '进行中',
                collapsed: false,
                tasks: [
                  {
                    name: '主材分包合同·阶段1',
                    status: '已完成'
                  },
                  {
                    name: '主材分包合同·阶段2',
                    status: '已完成'
                  },
                  {
                    name: '主材分包合同·阶段3',
                    status: '已完成'
                  }
                ]
              }
            ],
            externals: [
              {
                name: '工地巡检',
                exec: '王强',
                status: '已完成'
              },
              {
                name: '材料进场验收',
                exec: '李伟',
                status: '进行中'
              },
              {
                name: '隐蔽工程验收',
                exec: '赵敏',
                status: '未开始'
              },
              {
                name: '收口验收',
                exec: '孙磊',
                status: '未开始'
              }
            ]
          },
          {
            id: 'cz',
            name: '主材安装',
            kind: 'contract',
            status: '未开始',
            done: 0,
            total: 3,
            subCount: 1,
            mainDone: false,
            subDone: 0,
            hasContract: true,
            stages: [
              {
                id: 'cz-s1',
                name: '主材安装合同',
                status: '未开始',
                collapsed: false,
                tasks: [
                  {
                    name: '主材安装合同·阶段1',
                    status: '未开始'
                  },
                  {
                    name: '主材安装合同·阶段2',
                    status: '未开始'
                  },
                  {
                    name: '主材安装合同·阶段3',
                    status: '未开始'
                  }
                ]
              }
            ],
            externals: []
          },
          {
            id: 'sh',
            name: '售后',
            kind: 'task',
            status: '未开始',
            done: 0,
            total: 0,
            tasks: []
          }
        ];
}

        /* 还原各页原始「完成态」语义：两页共用同一份原始演示快照，不做任何状态改写 */
        function applyFlowPreset(items) { return items; }

        function cfgItems() {
          var cfg = (window.FlowCfgStore ? FlowCfgStore.get() : null);
          if (!cfg || !cfg.length) { var _b = baseItems(); applyFlowPreset(_b); return _b; }
          var detail = {};
          baseItems().forEach(function (it) { detail[it.id] = it; });
          var items = cfg.map(function (c) {
            var d = detail[c.id] || {};
            return {
              id: c.id, name: c.name, kind: c.hasContract ? 'contract' : 'task',
              hasContract: !!c.hasContract, status: d.status || c.status || '未开始',
              done: typeof d.done === 'number' ? d.done : 0,
              total: typeof d.total === 'number' ? d.total : (c.tasks || 0),
              subCount: d.subCount || 0, mainDone: !!d.mainDone, subDone: d.subDone || 0,
              stages: d.stages || [], tasks: d.tasks || [], externals: d.externals || []
            };
          });
          applyFlowPreset(items);
          return items;
        }

function statusStyle(s) {
  switch (s) {
    case '进行中': return { dot: '#1677ff', ring: '', badge: 'b-go', bar: '#1677ff' };
    case '已完成': return { dot: '#52c41a', ring: '', badge: 'b-done', bar: '#52c41a' };
    case '已终止': return { dot: '#fff', ring: '#ff4d4f', badge: 'b-stop', bar: '#ff4d4f' };
    default:       return { dot: '#fff', ring: '#d9d9d9', badge: 'b-wait', bar: '#d9d9d9' };
  }
}
function badgeText(s) { return s === '未开始' ? '待开始' : s; }
function reloadFlowItems() {
  ITEMS = cfgItems();
  var still = ITEMS.some(function (x) { return x.id === selectedId; });
  if (!still) selectedId = (ITEMS[0] || {}).id;
  refreshStats();
  renderRail();
  syncDrawerIfOpen();
}
        var ITEMS = cfgItems();
        var selectedId = 'sg';      // 默认选中项（基础施工服务）
        var overrideStatus = '进行中'; // 演示覆盖选中项状态，匹配页面语义

function renderRail(smooth) {
  var rail = document.getElementById('flowRail');
  rail.innerHTML = '';
  var list = ITEMS;
  list.forEach(function (it) {
    var st = (it.id === selectedId) ? overrideStatus : it.status;
    var ss = statusStyle(st);
    var el = document.createElement('div');
    el.className = 'flow-item' + (it.id === selectedId ? ' on' : '');
    el.setAttribute('data-id', it.id);
    var prog = it.total > 0 ? (it.done + '/' + it.total) : '—';
    var pct = it.total > 0 ? Math.round(it.done / it.total * 100) : 0;
    el.innerHTML =
      '<span class="fi-dot" style="background:' + ss.dot + (ss.ring ? ';border:2px solid ' + ss.ring : '') + '"></span>' +
      '<span class="fi-name">' + it.name + '</span>' +
      '<span class="fi-bar"><i style="width:' + pct + '%;background:' + ss.bar + '"></i></span>' +
      '<span class="fi-prog">' + prog + '</span>';
    el.addEventListener('click', function () { selectItem(it.id); });
    rail.appendChild(el);
  });
  updateMask();
  // 选中项居中：仅在流程条确实溢出时才加首尾留白（避免内容本可容纳时凭空出现滚动）
  rail.classList.toggle('centerable', rail.scrollWidth > rail.clientWidth + 2);
  centerRail(rail, rail.querySelector('.flow-item.on'), smooth === true);
  renderContractAction();
}
function updateMask() {
  var rail = document.getElementById('flowRail');
  var mask = document.getElementById('railMask');
  mask.style.display = rail.scrollWidth > rail.clientWidth + 2 ? 'block' : 'none';
}
function selectItem(id) {
  selectedId = id;
  renderRail(true);
  openFlowDrawer();   // 选中流程项 → 展开并展示右侧浮窗
}
function countDone(arr) { return arr.filter(function (x) { return x.status === '已完成'; }).length; }
function refreshStats() {
  // 合同：主合同 + 子合同数 / 已签(进行中+已完成)；任务：阶段任务 + 临时任务 的 已完成/总数
  var list = ITEMS;
  var cTotal = 0, cDone = 0, tTotal = 0, tDone = 0, mainDone = 0;
  list.forEach(function (it) {
    if (it.kind === 'contract') {
      cTotal += 1 + (it.subCount || 0);
      if (it.mainDone) cDone += 1;
      cDone += (it.subDone || 0);
      (it.stages || []).forEach(function (s) {
        tTotal += s.tasks.length;
        tDone += s.tasks.filter(function (t) { return t.status === '已完成'; }).length;
      });
      (it.externals || []).forEach(function (e) { tTotal += 1; if (e.status === '已完成') tDone += 1; });
    } else {
      tTotal += it.tasks.length;
      tDone += countDone(it.tasks);
      (it.externals || []).forEach(function (e) { tTotal += 1; if (e.status === '已完成') tDone += 1; });
    }
    if (it.status === '已完成') mainDone += 1;
  });
  document.getElementById('cNum').textContent = cDone + '/' + cTotal;
  document.getElementById('tNum').textContent = tDone + '/' + tTotal;
  document.getElementById('cPct').textContent = (cTotal ? Math.round(cDone / cTotal * 100) : 0) + '%';
  document.getElementById('tPct').textContent = (tTotal ? Math.round(tDone / tTotal * 100) : 0) + '%';
  document.getElementById('mainLine').textContent = '主线 ' + mainDone + '/' + list.length;
}
function openFlowDrawer() {
  renderFlowDrawer();
  document.getElementById('flowDrawerMask').classList.add('open');
  document.getElementById('flowDrawer').classList.add('open');
  document.getElementById('flowTrigger').style.opacity = '0';
}
function closeFlowDrawer() {
  document.getElementById('flowDrawerMask').classList.remove('open');
  document.getElementById('flowDrawer').classList.remove('open');
  document.getElementById('flowTrigger').style.opacity = '1';
}
function fdRow(name, meta, badge, status) {
  var ss = statusStyle(status);
  return '<div class="fd-item" onclick="go(\'task-detail.html\')">' +
    '<span class="fd-dot" style="background:' + ss.dot + (ss.ring ? ';border:2px solid ' + ss.ring : '') + '"></span>' +
    '<span class="fd-name">' + name + '</span>' +
    '<span class="fd-meta">' + meta + '</span>' +
    '<span class="fd-badge badge ' + ss.badge + '">' + badge + '</span></div>';
}
        function selectFlow(id) {
          selectedId = id;
          renderRail(true);
          renderFlowDrawer();
        }

var fdDetailTab = 'stage';   // 'stage' = 主合同内的阶段任务；'ext' = 临时任务阶段任务
var fdStageCollapsed = {};   // 阶段卡片折叠态（按 stage id 记忆）
var fdLastSelId = null;
function fdStageCls(s) { return s === '已完成' ? 'completed' : (s === '进行中' ? 'in_progress' : 'pending'); }
function fdTaskIcon(s) { return s === '已完成' ? '✓' : ''; }
function centerRail(rail, item, smooth) {
  if (!rail || !item || !rail.clientWidth) return;
  var target = item.offsetLeft - (rail.clientWidth - item.offsetWidth) / 2;
  if (target < 0) target = 0;
  var max = rail.scrollWidth - rail.clientWidth;
  if (max > 0 && target > max) target = max;
  if (typeof rail.scrollTo === 'function') {
    try { rail.scrollTo({ left: target, behavior: smooth ? 'smooth' : 'auto' }); }
    catch (e) { rail.scrollLeft = target; }
  } else {
    rail.scrollLeft = target;
  }
}
function fdList() { return ITEMS; }
function contractAction(sel, surface) {
  if (!sel || !sel.hasContract) return null;            // 未配置「含合同」的流程项不出现任何合同入口
  if (surface === 'home') return null;                  // 主页服务流程卡 = 纯概览，不渲染任何合同按钮
  if (sel.subCount) return { text: '查看合同', cls: 'view', url: 'contract-detail.html?from=flow&item=' + sel.id };
  return { text: '拟定合同', cls: 'create', url: 'create-contract.html?from=flow&item=' + sel.id };
}
function goContract(surface) {
  var sel = fdList().filter(function (x) { return x.id === selectedId; })[0];
  var a = contractAction(sel, surface || 'drawer');
  if (!a) return;
  window.location.href = a.url;
}
function renderContractAction() {
  var sel = fdList().filter(function (x) { return x.id === selectedId; })[0];
  var el = document.getElementById('fdContractAct');
  if (!el) return;
  var a = contractAction(sel, 'drawer');
  if (!a) { el.style.display = 'none'; el.textContent = ''; return; }
  el.style.display = '';
  el.className = 'fd-act ' + a.cls;
  el.textContent = a.text;
}
function centerFdRail(smooth) {
  var rail = document.querySelector('#fdFlowList .fd-rail');
  if (rail) centerRail(rail, rail.querySelector('.fd-rail-item.active'), smooth);
}
function currentFlowItem() {
  var list = fdList();
  var st = function (it) { return it.id === selectedId ? overrideStatus : it.status; };
  var running = list.filter(function (it) { return st(it) === '进行中'; });
  if (running.length) return running[0];
  var done = list.filter(function (it) { return st(it) === '已完成'; });
  if (done.length) return done[done.length - 1];
  return list[0] || null;
}
function locateStageOf(it) {
  var stages = (it && it.stages) || [];
  var running = stages.filter(function (s) { return s.status === '进行中'; });
  if (running.length) return running[0];
  var next = stages.filter(function (s) { return s.status !== '已完成'; });
  return next[0] || stages[stages.length - 1] || null;
}
function scrollFdToLocate(stage) {
  var fc = document.querySelector('.fd-content');
  if (!fc) return;
  var fl = document.getElementById('fdFlowList');
  var railH = (fl && fl.offsetHeight) ? fl.offsetHeight : 0;
  var card = stage ? document.querySelector('.fd-stage-card[data-sid="' + stage.id + '"]') : null;
  var target = card || document.getElementById('fdDetailBody');
  if (!target) return;
  var top = fc.scrollTop + target.getBoundingClientRect().top - fc.getBoundingClientRect().top - railH - 6;
  if (top < 0) top = 0;
  if (typeof fc.scrollTo === 'function') {
    try { fc.scrollTo({ top: top, behavior: 'smooth' }); }
    catch (e) { fc.scrollTop = top; }
  } else {
    fc.scrollTop = top;
  }
  if (card) {
    card.classList.remove('locate-hl');
    void card.offsetWidth;              // 强制重排，重复点击也能重新触发动画
    card.classList.add('locate-hl');
    setTimeout(function () { card.classList.remove('locate-hl'); }, 1700);
  }
  return card;
}
function locateCurrent() {
  var it = currentFlowItem();
  if (!it) return;
  var switched = it.id !== selectedId;
  if (switched) {
    selectedId = it.id;
    renderRail(true);                   // 主页面流程条同步选中并居中
  }
  fdDetailTab = 'stage';                // 合同项若停在「临时任务」页签，先回到阶段页签，阶段才可见
  renderFlowDrawer();
  var stage = locateStageOf(it);
  if (stage && fdStageCollapsed[stage.id]) {
    var card = document.querySelector('.fd-stage-card[data-sid="' + stage.id + '"]');
    if (card) toggleFdStage(stage.id);  // 折叠态自动展开（同步 max-height 与折叠记忆）
  }
  scrollFdToLocate(stage);
  toast('已定位 · ' + it.name + (stage ? ' · ' + stage.name : ''));
}
var AS_WORKERS = [
  { name: '王强', role: '施工' },
  { name: '李伟', role: '施工' },
  { name: '孙磊', role: '监理' },
  { name: '赵敏', role: '水电' },
  { name: '钱七', role: '油漆' }
];
var asExecutor = '';
var asConfirmers = [];
/* 工人视角是否可查看全部服务流程（决定「我的服务流程」卡头「查看全部」的显隐） */
var canViewAllFlow = true;
var flowCfgPerm = 'all';
function canConfigFlow() { return currentRole !== 'worker' && flowCfgPerm !== 'none'; }
function syncFlowCfgEntry() {
  var b = document.getElementById('flowCfgBtn');
  if (b) b.style.display = canConfigFlow() ? '' : 'none';
  var f = document.getElementById('fdCfg');
  if (f) f.style.display = canConfigFlow() ? '' : 'none';
}
function openFlowConfig() {
  if (currentRole === 'worker') { toast('工人无流程配置权限'); return; }
  if (flowCfgPerm === 'none') { toast('暂无流程配置权限'); return; }
  window.location.href = 'flow-config.html?perm=' + flowCfgPerm + '&from=project';
}
var assignPermMode = 'all';   // 'all' 全部可指派 | 'partial' 仅基础施工服务 | 'none' 全部无权限
function canAssign(it) {
  if (!it) return false;
  if (currentRole === 'worker') return false;   // 工人无指派权限
  if (assignPermMode === 'none') return false;
  if (assignPermMode === 'partial') return it.id === 'sg';
  return true;
}
function openAssignModal() {
  var sel = fdList().filter(function (x) { return x.id === selectedId; })[0];
  if (!sel || !canAssign(sel)) return;
  // 重置表单
  document.getElementById('asName').value = '';
  document.getElementById('asExecStd').value = '';
  document.getElementById('asConfirmStd').value = '';
  document.getElementById('asLiableStd').value = '';
  asExecutor = ''; asConfirmers = [];
  document.getElementById('asExecutorText').textContent = '请选择执行人';
  document.getElementById('asConfirmText').textContent = '请选择确认人';
  document.getElementById('asNameErr').style.display = 'none';
  document.getElementById('asStdErr').style.display = 'none';
  document.getElementById('asExecutorErr').style.display = 'none';
  document.getElementById('asConfirmErr').style.display = 'none';
  // 执行人选项（静态演示人员）
  document.getElementById('asExecutorDropdown').innerHTML = AS_WORKERS.map(function (p) {
    return '<div class="am-opt" onclick="pickAsExecutor(\'' + p.name + '\', \'' + p.role + '\')">' + p.name + '<span class="role">' + p.role + '</span></div>';
  }).join('');
  // 确认人选项（多选，最多5人）
  renderAsConfirmOptions();
  closeAsDropdowns();
  document.getElementById('assignModal').classList.add('show');
}
function closeAssignModal() {
  document.getElementById('assignModal').classList.remove('show');
  closeAsDropdowns();
}
function toggleAsSelect(id) {
  var el = document.getElementById(id);
  if (!el) return;
  var willOpen = !el.classList.contains('open');
  closeAsDropdowns();
  if (willOpen) el.classList.add('open');
}
function closeAsDropdowns() {
  document.querySelectorAll('.am-select.open').forEach(function (e) { e.classList.remove('open'); });
}
function pickAsExecutor(name, role) {
  asExecutor = name;
  document.getElementById('asExecutorText').textContent = name + ' · ' + role;
  var err = document.getElementById('asExecutorErr');
  if (err) { err.style.display = 'none'; }
  closeAsDropdowns();
}
function renderAsConfirmOptions() {
  document.getElementById('asConfirmDropdown').innerHTML = AS_WORKERS.map(function (p) {
    var checked = asConfirmers.indexOf(p.name) >= 0;
    return '<div class="am-opt' + (checked ? ' checked' : '') + '" onclick="pickAsConfirmer(\'' + p.name + '\')">' + p.name +
      '<span class="role">' + p.role + '</span>' + (checked ? '<span class="ck">✓</span>' : '') + '</div>';
  }).join('');
}
function pickAsConfirmer(name) {
  var err = document.getElementById('asConfirmErr');
  var idx = asConfirmers.indexOf(name);
  if (idx >= 0) {
    asConfirmers.splice(idx, 1);
  } else {
    if (asConfirmers.length >= 5) {
      if (err) { err.textContent = '最多选择 5 位确认人'; err.style.display = 'block'; }
      return;
    }
    asConfirmers.push(name);
  }
  if (err) { err.style.display = 'none'; }
  var n = asConfirmers.length;
  document.getElementById('asConfirmText').textContent = n === 0 ? '请选择确认人'
    : (n <= 2 ? asConfirmers.join('、') : asConfirmers.slice(0, 2).join('、') + ' 等' + n + '人');
  renderAsConfirmOptions();  // 就地刷新勾选态（下拉保持展开）
}
function confirmAssignTask() {
  document.getElementById('asNameErr').style.display = 'none';
  document.getElementById('asStdErr').style.display = 'none';
  document.getElementById('asExecutorErr').style.display = 'none';
  var sel = fdList().filter(function (x) { return x.id === selectedId; })[0];
  if (!sel || !canAssign(sel)) return;
  var name = document.getElementById('asName').value.trim();
  var std = document.getElementById('asExecStd').value.trim();
  var valid = true;
  if (!name) { var e1 = document.getElementById('asNameErr'); e1.textContent = '请输入任务名称'; e1.style.display = 'block'; valid = false; }
  if (!std) { var e2 = document.getElementById('asStdErr'); e2.textContent = '请输入执行标准'; e2.style.display = 'block'; valid = false; }
  if (!asExecutor) { var e3 = document.getElementById('asExecutorErr'); e3.textContent = '请选择执行人'; e3.style.display = 'block'; valid = false; }
  if (!valid) return;
  // 写回数据：插入该流程项的临时任务列表（未开始），流程项任务总数 +1，各处计数自动重算
  sel.externals = sel.externals || [];
  sel.externals.push({ name: name, exec: asExecutor, confirms: asConfirmers.slice(), status: '未开始' });
  sel.total = (sel.total || 0) + 1;
  closeAssignModal();
  if (sel.kind === 'contract') fdDetailTab = 'ext';   // 合同型项：切到临时任务 Tab；任务型项内容内联，无需切 Tab
  refreshStats();
  renderFlowDrawer();
}
function renderFlowDrawer() {
  var list = ITEMS;
  var selIdx = -1;
  list.forEach(function (it, i) { if (it.id === selectedId) selIdx = i; });
  // 流程项：横向鱼眼 Tab（选中放大、邻项按距离缩小；进度颜色与计数保留）
  var railEl = document.getElementById('fdFlowList');
  var cards = railEl.querySelectorAll('.fd-rail .fd-rail-item');
  if (cards.length === list.length) {
    // 数量未变：就地更新类名/进度（保留 DOM，让鱼眼缩放过渡动画生效）
    list.forEach(function (it, i) {
      var el = cards[i];
      var st = (it.id === selectedId) ? overrideStatus : it.status;
      var ss = statusStyle(st);
      var prog = it.total > 0 ? (it.done + '/' + it.total) : '—';
      var pct = it.total > 0 ? Math.round(it.done / it.total * 100) : 0;
      var d = Math.abs(i - selIdx);
      el.className = 'fd-rail-item' + (it.id === selectedId ? ' active' : '') + ' fd-ri-d' + (d > 3 ? 3 : d);
      var barI = el.querySelector('.fd-ri-bar i');
      barI.style.width = pct + '%';
      barI.style.background = ss.bar;
      el.querySelector('.fd-ri-prog').textContent = prog;
    });
  } else {
    // 数量变化（演示开关 6/8 项）：整条重建
    railEl.innerHTML = '<div class="fd-rail">' + list.map(function (it, i) {
      var st = (it.id === selectedId) ? overrideStatus : it.status;
      var ss = statusStyle(st);
      var active = it.id === selectedId ? ' active' : '';
      var d = Math.abs(i - selIdx);
      var prog = it.total > 0 ? (it.done + '/' + it.total) : '—';
      var pct = it.total > 0 ? Math.round(it.done / it.total * 100) : 0;
      return '<div class="fd-rail-item' + active + ' fd-ri-d' + (d > 3 ? 3 : d) + '" onclick="selectFlow(\'' + it.id + '\')">' +
        '<span class="fd-ri-name">' + it.name + '</span>' +
        '<span class="fd-ri-bar"><i style="width:' + pct + '%;background:' + ss.bar + '"></i></span>' +
        '<span class="fd-ri-prog">' + prog + '</span></div>';
    }).join('') + '</div>';
  }

  var sel = list.filter(function (x) { return x.id === selectedId; })[0];
  // 切换流程项时，按数据初始折叠态重建阶段卡片折叠记忆
  if (selectedId !== fdLastSelId) {
    fdStageCollapsed = {};
    if (sel && sel.stages) sel.stages.forEach(function (s) { fdStageCollapsed[s.id] = (s.collapsed === true); });
    fdLastSelId = selectedId;
  }
  document.getElementById('fdDetail').innerHTML = renderFdDetail(sel);
  updateCollapseAllLabel();
  centerFdRail(true);
  // 书签列吸顶位置 = 流程项 Tab 条实际高度 + 明细区上边距（消除签与面板顶部之间的透明缝隙）
  var flEl = document.getElementById('fdFlowList');
  var wrapEl = document.querySelector('#fdDetail .fd-bm-wrap');
  if (flEl && flEl.offsetHeight > 0) {
    var bmMt = 0;
    if (wrapEl) { var m = parseFloat(getComputedStyle(wrapEl).marginTop); if (!isNaN(m)) bmMt = m; }
    document.documentElement.style.setProperty('--fd-rail-h', (flEl.offsetHeight + bmMt) + 'px');
  }
  document.getElementById('fdMainCount').innerHTML = '主线 <b>' + mainDoneCount() + '</b>/' + list.length + ' 环';
  renderContractAction();
}
function renderFdDetail(sel) {
  if (!sel) return '';
  if (sel.kind === 'contract') {
    var stageOn = fdDetailTab === 'stage' ? ' on' : '';
    var extOn = fdDetailTab === 'ext' ? ' on' : '';
    var stageCount = sel.stages.length;
    var extList = sel.externals || [];
    var extDone = extList.filter(function (e) { return e.status === '已完成'; }).length;
    return '<div class="fd-bm-wrap">' +
      '<div class="fd-bm-col">' +
      '<div class="fd-bm' + stageOn + '" data-g="stage" onclick="switchFdTab(\'stage\')">合同内<span class="fd-bm-n">' + stageCount + ' 阶段</span></div>' +
      '<div class="fd-bm' + extOn + '" data-g="ext" onclick="switchFdTab(\'ext\')">临时任务<span class="fd-bm-n">' + extDone + '/' + extList.length + '</span></div>' +
      '<div class="fd-bm-util"' + (fdDetailTab === 'ext' ? ' style="display:none"' : '') + ' onclick="toggleAllFdStages()"><span id="fdcLabel">收起</span></div>' +
      '</div>' +
      '<div class="fd-bm-panel">' +
        '<div id="fdDetailBody">' + fdDetailBody(sel, fdDetailTab) + '</div>' +
      '</div>' +
      '</div>';
  }
  // 任务型流程项（量房/初步设计/售后等）：本项任务 + 临时任务内联列表 + 吸底指派入口
  var tRows = sel.tasks && sel.tasks.length
    ? sel.tasks.map(function (t) { return fdRow(t.name, '执行 ' + t.exec, badgeText(t.status), t.status); }).join('')
    : '<div class="fd-empty">' + ((sel.stages && sel.stages.length)
        ? '该项未开启「含合同」，阶段任务已隐藏'
        : '该流程项暂无任务') + '</div>';
  var ext = sel.externals || [];
  var extHtml = '';
  if (ext.length) {
    extHtml = '<div class="fd-ext-sub"><div class="fd-ext-sub-h">临时任务<span class="fd-ext-sub-n">' + ext.length + '</span></div>' +
      ext.map(function (e) { return fdExtRow(e); }).join('') + '</div>';
  }
  return '<div id="fdDetailBody">' + tRows + extHtml + fdAssignBar(sel) + '</div>';
}
function fdDetailBody(sel, group) {
  if (sel.kind !== 'contract') return '';
  if (group === 'ext') return fdExtHtml(sel);
  // 已开启「含合同」但还没有合同：阶段任务需在合同内配置
  if (!sel.stages || !sel.stages.length) {
    return '<div class="fd-empty">该项已开启「含合同」，尚未创建合同。创建合同后可配置阶段与任务</div>' + fdAssignBar(sel);
  }
  // 主合同内的阶段任务：可折叠阶段卡片（对齐 owner 项目导航）
  var html = '<div class="fd-stage-list">';
  sel.stages.forEach(function (st) {
    var collapsed = fdStageCollapsed[st.id] === true;
    var total = st.tasks.length;
    var done = st.tasks.filter(function (t) { return t.status === '已完成'; }).length;
    var ddCls = fdStageCls(st.status);
    var tasksHtml = st.tasks.map(function (t) {
      var tCls = fdStageCls(t.status);
      var tag = t.hasTag ? '<span class="fd-task-tag">#</span>' : '';
      return '<div class="fd-stage-task-item ' + tCls + '" onclick="go(\'task-detail.html\')">' +
        '<span class="fd-task-status-icon ' + tCls + '">' + fdTaskIcon(t.status) + '</span>' +
        '<span class="fd-task-name">' + t.name + '</span>' + tag +
        '<span class="fd-task-arrow">›</span></div>';
    }).join('');
    var maxH = collapsed ? '0px' : (total * 50 + 4) + 'px';
    html += '<div class="fd-stage-card' + (collapsed ? ' collapsed' : '') + '" data-sid="' + st.id + '">' +
      '<div class="fd-stage-header" onclick="toggleFdStage(\'' + st.id + '\')">' +
        '<span class="fd-stage-status-dot ' + ddCls + '"></span>' +
        '<div class="fd-stage-info"><span class="fd-stage-title">' + st.name + '</span>' +
          '<span class="fd-stage-count-badge ' + ddCls + '">' + done + '/' + total + '</span></div>' +
        '<span class="fd-stage-collapse-arrow">⌄</span>' +
      '</div>' +
      '<div class="fd-stage-task-list" style="max-height:' + maxH + '">' + tasksHtml + '</div>' +
    '</div>';
  });
  html += '</div>';
  return html;
}
function fdExtHtml(sel) {
  var list = sel.externals || [];
  var body = list.length
    ? '<div class="fd-ext-list">' + list.map(function (e) { return fdExtRow(e); }).join('') + '</div>'
    : '<div class="fd-ext-none">暂无临时任务</div>';
  return body + fdAssignBar(sel);
}
/* 指派任务入口：明细区底部吸底（有权限才渲染），临时任务再多也一步可达 */
function fdAssignBar(sel) {
  if (!canAssign(sel)) return '';
  return '<div class="fd-assignbar"><button type="button" class="fd-ext-add" onclick="openAssignModal()">＋ 指派任务</button></div>';
}
function fdExtRow(e) {
  var ss = statusStyle(e.status);
  return '<div class="fd-ext-task" onclick="go(\'task-detail.html\')">' +
    '<span class="fd-dot" style="background:' + ss.dot + (ss.ring ? ';border:2px solid ' + ss.ring : '') + '"></span>' +
    '<span class="fd-name">' + e.name + '</span>' +
    (e.exec ? '<span class="fd-meta">' + e.exec + '</span>' : '') +
    (e.confirms && e.confirms.length ? '<span class="fd-meta">确认' + e.confirms.length + '人</span>' : '') +
    '<span class="fd-badge badge ' + ss.badge + '">' + badgeText(e.status) + '</span></div>';
}
function toggleFdStage(sid) {
  var card = document.querySelector('.fd-stage-card[data-sid="' + sid + '"]');
  if (!card) return;
  var listEl = card.querySelector('.fd-stage-task-list');
  var collapsed = card.classList.toggle('collapsed');
  fdStageCollapsed[sid] = collapsed;
  var n = listEl.querySelectorAll('.fd-stage-task-item').length;
  listEl.style.maxHeight = collapsed ? '0px' : (n * 50 + 4) + 'px';
}
/* 一键收起/展开当前 Tab 内所有阶段卡片（作用于明细，不隐藏整区） */
function toggleAllFdStages() {
  var body = document.getElementById('fdDetailBody');
  if (!body) return;
  var cards = body.querySelectorAll('.fd-stage-card');
  if (!cards.length) return;
  var allCollapsed = true;
  cards.forEach(function (c) { if (!c.classList.contains('collapsed')) allCollapsed = false; });
  var target = allCollapsed ? 'expand' : 'collapse';
  cards.forEach(function (c) {
    var listEl = c.querySelector('.fd-stage-task-list');
    if (!listEl) return;
    if (target === 'collapse') {
      c.classList.add('collapsed');
      listEl.style.maxHeight = '0px';
    } else {
      c.classList.remove('collapsed');
      var n = listEl.querySelectorAll('.fd-stage-task-item').length;
      listEl.style.maxHeight = (n * 50 + 4) + 'px';
    }
    var sid = c.getAttribute('data-sid');
    if (sid) fdStageCollapsed[sid] = (target === 'collapse');
  });
  updateCollapseAllLabel();
}
function updateCollapseAllLabel() {
  var label = document.getElementById('fdcLabel');
  if (!label) return;
  var body = document.getElementById('fdDetailBody');
  if (!body) { label.textContent = '收起'; return; }
  var cards = body.querySelectorAll('.fd-stage-card');
  if (!cards.length) { label.textContent = '收起'; return; }
  var allCollapsed = true;
  cards.forEach(function (c) { if (!c.classList.contains('collapsed')) allCollapsed = false; });
  label.textContent = allCollapsed ? '展开' : '收起';
}
function switchFdTab(group) {
  fdDetailTab = group;
  var tabs = document.querySelectorAll('#fdDetail .fd-bm');
  tabs.forEach(function (t) { t.classList.toggle('on', t.getAttribute('data-g') === group); });
  // 收起/展开工具只对「合同内」阶段卡有效，临时任务平铺列表下隐藏
  var util = document.querySelector('#fdDetail .fd-bm-util');
  if (util) util.style.display = group === 'ext' ? 'none' : 'flex';
  var body = document.getElementById('fdDetailBody');
  if (!body) return;
  var sel = (ITEMS).filter(function (x) { return x.id === selectedId; })[0];
  if (sel && sel.kind === 'contract') body.innerHTML = fdDetailBody(sel, group);
  updateCollapseAllLabel();
}
function mainDoneCount() {
  var list = ITEMS;
  return list.filter(function (x) { return x.status === '已完成'; }).length;
}
function syncDrawerIfOpen() {
  var d = document.getElementById('flowDrawer');
  if (d && d.classList.contains('open')) renderFlowDrawer();
}
        function toast(msg) { showToast(msg); }

        /* 注入「服务流程」卡结构并挂载（替代旧 flowMount 的内联明细方案） */
        function flowMount() {
          var host = document.getElementById('flowHost');
          if (!host) return;
          host.innerHTML =
            '<div class="flow-card flow-sticky" id="flowSticky">' +
              '<div class="flow-head" onclick="openFlowDrawer()" style="cursor:pointer"><span class="fh-t">服务流程 <span style="font-size:12px;color:var(--primary)">›</span></span><span class="fh-n" id="mainLine">主线</span><span class="fh-cfg" id="flowCfgBtn" onclick="event.stopPropagation();openFlowConfig()">⚙ 配置</span></div>' +
              '<div class="flow-stats" onclick="openFlowDrawer()" style="cursor:pointer">' +
                '<span class="fs-seg"><span class="fs-num" id="cNum">0/0</span><span class="fs-lab">合同 · <span id="cPct">0%</span></span></span>' +
                '<span class="fs-div"></span>' +
                '<span class="fs-seg"><span class="fs-num" id="tNum">0/0</span><span class="fs-lab">任务 · <span id="tPct">0%</span></span></span>' +
              '</div>' +
              '<div class="rail-wrap"><div class="flow-rail" id="flowRail"></div><div class="rail-mask" id="railMask"></div></div>' +
            '</div>';
          renderRail();
          refreshStats();
          syncFlowCfgEntry();
          bindFlowScroll();
        }

        function bindFlowScroll() {
          if (_flowScrollBound) return; _flowScrollBound = true;
          var sc = document.getElementById('detailArea');
          if (sc) sc.addEventListener('scroll', function () {
            var st = document.getElementById('flowSticky'); if (!st) return;
            var pr = this.getBoundingClientRect().top; var sr = st.getBoundingClientRect().top;
            st.classList.toggle('stuck', sr <= pr + 1);
          }, { passive: true });
          var fc = document.querySelector('.fd-content');
          if (fc) fc.addEventListener('scroll', function () { var fl = document.getElementById('fdFlowList'); if (fl) fl.classList.toggle('stuck', this.scrollTop > 8); }, { passive: true });
        }

        /* 从「服务流程配置」返回（含 bfcache 恢复）时重新读取配置并刷新 */
        window.addEventListener('pageshow', function () {
          if (!window.FlowCfgStore) return;
          reloadFlowItems();
          syncFlowCfgEntry();
        });
        window.addEventListener('resize', updateMask);



        /* ===================== 初始化 ===================== */
        renderSwitchBar();
        renderPanel();
        renderDetail();
        updateDemoBtns();
    