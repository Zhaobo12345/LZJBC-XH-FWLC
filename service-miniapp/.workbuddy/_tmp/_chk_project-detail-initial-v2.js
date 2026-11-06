
        /* ===================== 原型导航 收起/展开 ===================== */
        function togglePageNav() {
            var nav = document.querySelector('.page-nav');
            var btn = document.getElementById('pageNavToggle');
            if (!nav) return;
            var collapsed = nav.classList.toggle('collapsed');
            if (btn) btn.classList.toggle('collapsed', collapsed);
            try { localStorage.setItem('pageNavCollapsed', collapsed ? 'true' : 'false'); } catch (e) {}
        }
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
        // 初始项目（刚创建）：读取 localStorage.newProjectData，缺省给出一个示例新项目
        var newProject = (function () {
            var d = null;
            try { d = JSON.parse(localStorage.getItem('newProjectData')); } catch (e) { d = null; }
            if (!d) d = {};
            var area = d.area ? (parseFloat(d.area).toFixed(1) + 'm²') : '75.0m²';
            var houseType = d.houseType || '2室1厅';
            var groups = (d.groups && Array.isArray(d.groups)) ? d.groups.length : 0;
            return {
                name: d.projectName || 'XX小区整体装修',
                status: d.status || '进行中',
                address: d.address || 'XX小区***号***室',
                area: area + ' ' + houseType,
                contractSigned: 0, contractTotal: 0, taskDone: 0, taskTotal: 0,
                trade: '', todoCount: 0, groupCount: groups
            };
        })();

        var PROJECTS = [ newProject ];

        var currentIndex = 0;
        var currentRole = 'nonworker'; // 初始项目页：项目创建者（非工人视角）
        var panelFilter = 'all';

        /* ===================== 渲染：项目切换条 ===================== */
        function renderSwitchBar() {
            var p = PROJECTS[currentIndex];
            document.getElementById('curProjName').textContent = p.name;
            var st = document.getElementById('curProjStatus');
            st.textContent = p.status;
            st.className = 'proj-status' + (p.status === '已完工' || p.status === '已完成' ? ' done' : '');
            document.getElementById('topHero').textContent = '项目信息';
        }

        function renderPanel() {
            var list = PROJECTS.filter(function (p) {
                if (panelFilter === 'ongoing') return p.status === '进行中';
                if (panelFilter === 'done') return p.status === '已完工' || p.status === '已完成';
                return true;
            });
            if (list.length === 0) {
                document.getElementById('projPanelInner').innerHTML = '<div class="proj-empty">暂无匹配的项目</div>';
                return;
            }
            var html = list.map(function (p) {
                var realIdx = PROJECTS.indexOf(p);
                var pct = p.contractTotal ? Math.round(p.contractSigned / p.contractTotal * 100) : 0;
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


        /* ===================== 渲染：初始项目详情（整体布局对齐项目列表页） ===================== */
        function renderInitial(p) {

            return                 '<div class="detail-fade">' +
                // 快捷入口（4 项：项目成员 / 资料 / 对账单 / 合同）
                '<div class="card qn-card">' +
                    '<div class="quick-nav" id="quickNav">' +
                        '<div class="qn" onclick="go(\'member.html\')"><span class="qn-ic">众</span><span class="qn-tx">项目成员</span></div>' +
                        '<div class="qn" onclick="go(\'project-files.html\')"><span class="qn-ic">资</span><span class="qn-tx">资料</span></div>' +
                        '<div class="qn" onclick="go(\'statement-list.html\')"><span class="qn-ic">账</span><span class="qn-tx">对账单</span></div>' +
                        '<div class="qn" onclick="go(\'contract-list.html\')"><span class="qn-ic">合</span><span class="qn-tx">合同</span></div>' +
                    '</div>' +
                '</div>' +
                // 待办事项（初始态：暂无待办 + 创建工作组引导）
                '<div class="card"><div class="card-title"><span>📋 待办事项</span>' +
                    '<span class="badge-wrap"><span class="badge">0</span></span>' +
                    '<span class="more" onclick="openPage(\'todo-list.html\')">查看全部 ></span></div>' +
                    '<div class="empty-tip"><span class="emoji">🗒️</span>项目刚创建，暂无待办<br>完善信息、搭建架构后将自动生成</div>' +
                    '<button class="add-arch-btn" onclick="go(\'architecture.html\')">＋ 创建工作组 / 施工组</button>' +
                '</div>' +
                // 我的任务（初始态：0/0）
                '<div class="card my-task-card" onclick="openPage(\'task-list.html?scope=mytasks&role=' + currentRole + '\')"><div class="card-title"><span>📌 我的任务</span><span class="more">查看全部 ></span></div>' +
                    '<div class="my-task-stats">' +
                        '<div class="my-task-stat"><div class="value">0</div><div class="label">已完成</div></div>' +
                        '<div class="my-task-divider"></div>' +
                        '<div class="my-task-stat"><div class="value">0</div><div class="label">我作为执行人的全部任务</div></div>' +
                    '</div></div>' +
                // 服务流程（横向流程条 + 内联明细；回迁自 demo，由 flowMount() 注入）
                '<div id="flowHost"></div>' +
                // 合同概览 / 任务统计 已并入「服务流程」统计条（见 flowMount）
                '' +
                // 今日动态（初始态：暂无动态）
                '<div class="card indent-card"><div class="card-title"><span>📝 今日动态</span><span class="more" onclick="go(\'activity-list.html\')">查看全部 ></span></div>' +
                    '<div class="empty-tip"><span class="emoji">📭</span>暂无动态，项目开工后将在此展示进展</div></div>' +
                '</div>';
        }

        /* 工人视角初始项目详情（单页演示开关切换；顶部单一项目信息头与全局切换条共用） */
        function renderInitialWorker(p) {
            var trade = p.trade || '泥瓦';
            return '<div class="detail-fade">' +
                // 快捷入口（4 项：项目动态 / 项目成员 / 资料 / 我的合同）
                '<div class="card qn-card">' +
                    '<div class="quick-nav" id="quickNavWork">' +
                        '<div class="qn" onclick="go(\'activity-list.html\')"><span class="qn-ic">动</span><span class="qn-tx">项目动态</span></div>' +
                        '<div class="qn" onclick="go(\'member.html\')"><span class="qn-ic">团</span><span class="qn-tx">项目成员</span></div>' +
                        '<div class="qn" onclick="go(\'project-files.html\')"><span class="qn-ic">资</span><span class="qn-tx">资料</span></div>' +
                        '<div class="qn" onclick="go(\'contract-detail.html\')"><span class="qn-ic">合</span><span class="qn-tx">我的合同</span></div>' +
                    '</div>' +
                '</div>' +
                // 待办事项（工人视角：初始态 0 待办，与项目列表工人视角一致）
                '<div class="card todo-card worker"><div class="card-title"><span>📋 待办事项</span>' +
                    '<span class="badge-wrap"><span class="badge">0</span></span>' +
                    '<span class="more" onclick="openPage(\'todo-list.html\')">查看全部 ></span></div>' +
                    '<div class="todo-content"><div class="empty-state" style="font-size:12px;color:#999;padding:8px 0;">暂无待办，待工长分配任务、发起合同后在此显示</div></div></div>' +
                // 我的任务（工人视角：0/0）
                '<div class="card my-task-card worker" onclick="openPage(\'task-list.html?scope=mytasks&role=' + currentRole + '\')"><div class="card-title"><span>📌 我的任务</span><span class="more">查看全部 ></span></div>' +
                    '<div class="my-task-stats">' +
                        '<div class="my-task-stat"><div class="value">0</div><div class="label">已完成</div></div>' +
                        '<div class="my-task-divider"></div>' +
                        '<div class="my-task-stat"><div class="value">0</div><div class="label">我作为执行人的全部任务</div></div>' +
                    '</div></div>' +
                // 服务流程（横向流程条 + 内联明细；回迁自 demo，由 flowMount() 注入）
                '<div id="flowHost"></div>' +
                // 合同 / 任务统计 已并入「服务流程」统计条（见 flowMount）
                '' +
                '</div>';
        }

        /* ===================== 顶部一行：项目名/切换（切换条已承载，无需额外摘要） ===================== */

        /* ===================== 主渲染 ===================== */
        function renderDetail() {
            var p = PROJECTS[currentIndex];
            var area = document.getElementById('detailArea');
            area.innerHTML = (currentRole === 'worker') ? renderInitialWorker(p) : renderInitial(p);
            flowMount();
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
            togglePanel();
            renderDetail();
        }

        function setPanelFilter(f, el) {
            panelFilter = f;
            var items = document.querySelectorAll('#projPanelFilter .pf-item');
            items.forEach(function (it) { it.classList.remove('active'); });
            if (el) el.classList.add('active');
            renderPanel();
        }

        function createProject() {
            location.href = 'create-project.html';
        }



        /* 滚动联动：仅维护吸顶阴影 */
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

        function navigate(href) { if (href) window.location.href = href; }
        function go(href) { navigate(href); }
        function openPage(href) { window.location.href = href; }

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
            window.location.href = 'project-info.html';
        }

        function showToast(msg) {
            var t = document.createElement('div');
            t.textContent = msg;
            t.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,.8);color:#fff;font-size:13px;padding:10px 16px;border-radius:8px;z-index:200;white-space:nowrap;';
            document.querySelector('.phone-frame').appendChild(t);
            setTimeout(function () { t.remove(); }, 1600);
        }

        /* 角色演示开关：非工人 / 工人 视角切换（单页内切换，替代独立工人页） */
        function toggleRoleSwitch(checked) {
            currentRole = checked ? 'worker' : 'nonworker';
            var rs = document.getElementById('roleStatus');
            if (rs) {
                rs.textContent = currentRole === 'worker' ? '工人' : '非工人';
                rs.classList.toggle('worker', checked);
            }
            if (currentRole === 'worker') closeFlowDrawer();   // 工人视角收起「服务流程」浮窗
            renderDetail();
        }
        /* 工人视角交互：层级切换 / 吸顶阴影由通用逻辑处理（见上） */

        /* ===================== 点击面板外部自动收起 ===================== */
        document.addEventListener('click', function (e) {
            var panel = document.getElementById('projPanel');
            var topbar = document.querySelector('.topbar');
            if (panel.classList.contains('open') && !topbar.contains(e.target)) {
                togglePanel();
            }
            // 层级下拉外部点击收起
            var ls = document.querySelector('.level-selector');
            if (ls && !ls.contains(e.target)) {
                var lo = ls.querySelector('.level-options');
                if (lo) lo.classList.remove('open');
                var la = ls.querySelector('.arrow');
                if (la) la.classList.remove('open');
            }
        });


        /* ============================================================
           新版「服务流程」模块（移植自 project-list.html SSOT）
           交互/功能外壳升级：横向流程条 + 右侧浮窗抽屉 + 阶段折叠
           + 指派任务（临时任务）+ 流程配置入口(⚙) + 合同双口径。
           状态语义由 FLOW_MODE 决定（completed=已完成 / initial=待开始）。
           ============================================================ */
        var FLOW_MODE = 'initial';
        /* 「初始」= 刚创建项目：不存在服务流程项，服务流程卡走「第一步引导创建」空态，浮窗内无数据 */
        var FLOW_EMPTY = (FLOW_MODE === 'initial');
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
  ITEMS = FLOW_EMPTY ? [] : cfgItems();
  var still = ITEMS.some(function (x) { return x.id === selectedId; });
  if (!still) selectedId = (ITEMS[0] || {}).id;
  refreshStats();
  renderRail();
  syncDrawerIfOpen();
}
        /* 初始态：服务流程项为空（原始快照保留在 baseItems()，供流程配置返回后恢复） */
        var ITEMS = FLOW_EMPTY ? [] : cfgItems();
        var selectedId = 'sg';      // 默认选中项（基础施工服务）
        var overrideStatus = (FLOW_MODE === 'completed' ? '进行中' : '未开始'); // 演示覆盖选中项状态，匹配页面语义

function renderRail(smooth) {
  var rail = document.getElementById('flowRail');
  if (!rail) return;                  // 初始态：服务流程卡无流程条
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
  if (!rail || !mask) return;        // 初始态：服务流程卡无流程条
  mask.style.display = rail.scrollWidth > rail.clientWidth + 2 ? 'block' : 'none';
}
function selectItem(id) {
  selectedId = id;
  renderRail(true);
  openFlowDrawer();   // 选中流程项 → 展开并展示右侧浮窗
}
function countDone(arr) { return arr.filter(function (x) { return x.status === '已完成'; }).length; }
function refreshStats() {
  if (FLOW_EMPTY) return;            // 初始态：无服务流程项，统计条不渲染（0/0 无意义）
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
  syncFlowCfgEntry();
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
  var e = document.getElementById('flowEmptyBtn');   // 初始态引导按钮同样受配置权限控制
  if (e) e.style.display = canConfigFlow() ? '' : 'none';
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
  /* 初始态：浮窗内无数据（无流程项 Tab / 无阶段任务），引导配置服务流程项 */
  if (FLOW_EMPTY || !list.length) {
    document.getElementById('fdFlowList').innerHTML = '';
    document.getElementById('fdDetail').innerHTML =
      '<div class="fd-empty-state">' +
        '<div class="fes-ic">🧭</div>' +
        '<div class="fes-t">暂无服务流程项</div>' +
        '<div class="fes-d">项目刚创建，还没有配置服务流程<br>配置后这里会展示各流程项的阶段与任务</div>' +
        '<div class="fes-btn" id="fdEmptyCfgBtn" onclick="openFlowConfig()">＋ 配置服务流程项</div>' +
      '</div>';
    var eb = document.getElementById('fdEmptyCfgBtn');
    if (eb) eb.style.display = canConfigFlow() ? '' : 'none';   // 工人视角不提供配置入口
    var mc = document.getElementById('fdMainCount');
    if (mc) mc.innerHTML = '主线 <b>0</b>/0 环';
    var lc = document.getElementById('fdLocate');
    if (lc) lc.style.display = 'none';
    var ca = document.getElementById('fdContractAct');
    if (ca) { ca.style.display = 'none'; ca.textContent = ''; }
    var ft = document.getElementById('fdFooter');
    if (ft) ft.textContent = '配置服务流程项后，可在此查看阶段与任务';
    return;
  }
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
          /* 初始态：「第一步引导创建」——不存在服务流程项，卡内不渲染流程条与统计 */
          if (FLOW_EMPTY) {
            host.innerHTML =
              '<div class="flow-card flow-sticky" id="flowSticky">' +
                '<div class="flow-head"><span class="fh-t">服务流程</span><span class="fh-n">未创建</span>' +
                  '<span class="fh-cfg" id="flowCfgBtn" onclick="event.stopPropagation();openFlowConfig()">⚙ 配置</span></div>' +
                '<div class="flow-empty-body" onclick="openFlowDrawer()">' +
                  '<div class="fe-ic">🧭</div>' +
                  '<div class="fe-t">还没有服务流程</div>' +
                  '<div class="fe-d">项目刚创建，第一步先配置服务流程项<br>配置后即可按流程推进合同与任务</div>' +
                  '<div class="flow-empty-btn" id="flowEmptyBtn" onclick="event.stopPropagation();openFlowConfig()">＋ 创建服务流程</div>' +
                '</div>' +
              '</div>';
            syncFlowCfgEntry();
            bindFlowScroll();
            return;
          }
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
    