
/* ===== 状态色 ===== */
function statusStyle(s) {
  switch (s) {
    case '进行中': return { dot: '#1677ff', ring: '', badge: 'b-go', bar: '#1677ff' };
    case '已完成': return { dot: '#52c41a', ring: '', badge: 'b-done', bar: '#52c41a' };
    case '已终止': return { dot: '#fff', ring: '#ff4d4f', badge: 'b-stop', bar: '#ff4d4f' };
    default:       return { dot: '#fff', ring: '#d9d9d9', badge: 'b-wait', bar: '#d9d9d9' };
  }
}
function badgeText(s) { return s === '未开始' ? '待开始' : s; }

/* ===== 数据 ===== */
function baseItems() {
  return [
    { id: 'lh', name: '量房', kind: 'task', status: '已完成', done: 3, total: 3,
      tasks: [
        { name: '原始尺寸复测', exec: '张设计', status: '已完成' },
        { name: '墙体结构勘测', exec: '李设计', status: '已完成' },
        { name: '设备点位确认', exec: '王设计', status: '已完成' }
      ] },
    { id: 'cs', name: '初步设计', kind: 'task', status: '已完成', done: 4, total: 4,
      tasks: [
        { name: '方案文件·户型优化', exec: '张设计', status: '已完成' },
        { name: '内部评审', exec: '李设计', status: '已完成' },
        { name: '会审', exec: '王设计', status: '已完成' },
        { name: '方案定稿', exec: '张设计', status: '已完成' }
      ] },
    { id: 'ht', name: '设计服务', kind: 'contract', status: '已完成', done: 7, total: 7,
      subCount: 1, mainDone: true, subDone: 1, hasContract: true,
      stages: [
        { id: 'ht-s1', name: '方案设计阶段', status: '已完成', collapsed: false, tasks: [
          { name: '原始量房尺寸复测', status: '已完成' },
          { name: '户型优化方案', status: '已完成' },
          { name: '方案评审与定稿', status: '已完成' }
        ] },
        { id: 'ht-s2', name: '施工图设计阶段', status: '已完成', collapsed: false, tasks: [
          { name: '平立面布置图', status: '已完成' },
          { name: '水电点位深化图', status: '已完成' },
          { name: '节点大样图', status: '已完成' }
        ] }
      ],
      externals: [ { name: '设计交底', exec: '张设计', status: '已完成' } ] },
    { id: 'sg', name: '基础施工服务', kind: 'contract', status: '进行中', done: 10, total: 39,
      subCount: 3, mainDone: true, subDone: 2, hasContract: true,
      stages: [
        { id: 'sg-s1', name: '基础施工阶段', status: '已完成', collapsed: false, tasks: [
          { name: '现场放线与三方交底', status: '已完成' },
          { name: '墙体拆除与建筑垃圾清运', status: '已完成' },
          { name: '新建砌墙与植筋加固', status: '已完成' },
          { name: '门窗洞口修整与过梁浇筑', status: '已完成' },
          { name: '成品保护与文明施工验收', status: '已完成' }
        ] },
        { id: 'sg-s2', name: '水电隐蔽工程', status: '进行中', collapsed: false, tasks: [
          { name: '强弱电开槽与弹线定位', status: '已完成' },
          { name: '冷热水管路铺设与打压测试', status: '已完成' },
          { name: '卫生间沉箱防漏与二次排水', status: '进行中', hasTag: true },
          { name: '中央空调/新风主机吊装穿梁', status: '进行中', hasTag: true },
          { name: '强弱电穿线与底盒安装', status: '未开始' },
          { name: '隐蔽工程节点联合三方验收', status: '未开始' }
        ] },
        { id: 'sg-s3', name: '泥瓦铺贴与防水防渗', status: '未开始', collapsed: true, tasks: [
          { name: '卫生间及阳台高分子防水刷制', status: '未开始' },
          { name: '闭水试验48小时联合签字', status: '未开始' },
          { name: '墙地砖铺贴与地面找平', status: '未开始' },
          { name: '窗台石与门槛石安装', status: '未开始' },
          { name: '泥瓦工程完工验收', status: '未开始' }
        ] },
        { id: 'sg-s4', name: '木工吊顶与柜体制作', status: '未开始', collapsed: true, tasks: [
          { name: '轻钢龙骨吊顶封板', status: '未开始' },
          { name: '背景墙基层与造型制作', status: '未开始' },
          { name: '现场柜体下料与组装', status: '未开始' },
          { name: '木工工程完工验收', status: '未开始' }
        ] },
        { id: 'sg-s5', name: '油漆涂饰与竣工收尾', status: '未开始', collapsed: true, tasks: [
          { name: '墙面挂网与腻子批刮三遍', status: '未开始' },
          { name: '顶面乳胶漆滚涂两遍', status: '未开始' },
          { name: '木作油漆与收口补缝', status: '未开始' },
          { name: '开荒保洁与竣工初验', status: '未开始' }
        ] }
      ],
      externals: [
        { name: '工地巡检', exec: '王强', status: '已完成' },
        { name: '材料进场验收', exec: '李伟', status: '进行中' },
        { name: '收口验收', exec: '孙磊', status: '未开始' },
        { name: '水电节点复检', exec: '赵敏', status: '未开始' },
        { name: '隐蔽工程旁站', exec: '赵敏', status: '未开始' },
        { name: '瓷砖/石材进场复验', exec: '李伟', status: '已完成', confirms: ['孙磊', '王强'] },
        { name: '卫生间防水闭水旁站', exec: '赵敏', status: '已完成' },
        { name: '瓷砖空鼓与平整度抽检', exec: '李伟', status: '进行中' },
        { name: '吊顶龙骨间距抽检', exec: '钱七', status: '进行中', confirms: ['孙磊'] },
        { name: '墙面腻子打磨验收', exec: '钱七', status: '未开始' },
        { name: '门套与柜体基层尺寸复核', exec: '王强', status: '未开始' },
        { name: '强弱电箱回路核对', exec: '赵敏', status: '未开始', confirms: ['孙磊'] },
        { name: '成品保护巡查', exec: '孙磊', status: '未开始' },
        { name: '工地安全用电检查', exec: '孙磊', status: '未开始' },
        { name: '竣工前全面巡检', exec: '王强', status: '未开始', confirms: ['孙磊', '李伟'] }
      ] },
    { id: 'cz', name: '主材安装', kind: 'contract', status: '未开始', done: 0, total: 5,
      subCount: 0, mainDone: false, subDone: 0, hasContract: true,
      stages: [
        { id: 'cz-s1', name: '主材进场阶段', status: '未开始', collapsed: false, tasks: [
          { name: '瓷砖/石材进场', status: '未开始' },
          { name: '卫浴洁具进场', status: '未开始' },
          { name: '橱柜进场', status: '未开始' }
        ] },
        { id: 'cz-s2', name: '安装收尾阶段', status: '未开始', collapsed: false, tasks: [
          { name: '灯具安装', status: '未开始' },
          { name: '开关插座安装', status: '未开始' }
        ] }
      ],
      externals: [] },
    { id: 'sh', name: '售后', kind: 'task', status: '未开始', done: 0, total: 0, tasks: [] }
  ];
}
/* ===== 服务流程项：结构由「服务流程配置」驱动（SSOT = js/flow-config-store.js） =====
   配置项提供顺序 / 名称 / 是否含合同 / 增减；明细（阶段、任务、临时任务）按 id 从 baseItems 继承。
   新增项无明细 → stages/tasks 为空，浮窗显示「暂无阶段任务」；是否含合同决定有无合同入口。 */
function cfgItems() {
  var cfg = (window.FlowCfgStore ? FlowCfgStore.get() : null);
  if (!cfg || !cfg.length) return baseItems();
  var detail = {};
  baseItems().forEach(function (it) { detail[it.id] = it; });
  return cfg.map(function (c) {
    var d = detail[c.id] || {};
    return {
      id: c.id,
      name: c.name,
      kind: c.hasContract ? 'contract' : 'task',
      hasContract: !!c.hasContract,
      status: d.status || c.status || '未开始',
      done: typeof d.done === 'number' ? d.done : 0,
      total: typeof d.total === 'number' ? d.total : (c.tasks || 0),
      subCount: d.subCount || 0,
      mainDone: !!d.mainDone,
      subDone: d.subDone || 0,
      stages: d.stages || [],
      tasks: d.tasks || [],
      externals: d.externals || []
    };
  });
}
/* 配置变更后重新载入：流程条、浮窗、主线统计一起刷新，选中项失效则兜底第一项 */
function reloadFlowItems() {
  ITEMS = cfgItems();
  var still = ITEMS.some(function (x) { return x.id === selectedId; });
  if (!still) selectedId = (ITEMS[0] || {}).id;
  refreshStats();
  renderRail();
  syncDrawerIfOpen();
}

var ITEMS = cfgItems();
var selectedId = 'sg';      // 默认首个进行中项
var detailOpen = true;
var overrideStatus = '进行中'; // 演示开关：覆盖选中项状态

/* ===== 渲染流程条 ===== */
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

/* ===== 渲染明细（主页面已不再内联展示，明细统一在右侧浮窗；保留函数名以免破坏调用方） ===== */
function renderDetail() {
  return;
}

function rowHtml(name, meta, badge, status, isContract) {
  var ss = statusStyle(status);
  return '<div class="d-row" onclick="go(\'' + (isContract ? 'contract-detail.html' : 'task-detail.html') + '\')">' +
    '<span class="d-name">' + name + '</span>' +
    '<span class="d-meta">' + meta + '</span>' +
    '<span class="badge ' + ss.badge + '">' + badge + '</span>' +
    '<span class="d-go">›</span></div>';
}
function countDone(arr) { return arr.filter(function (x) { return x.status === '已完成'; }).length; }

function setDetail(open) {
  detailOpen = open;
  var box = document.getElementById('flowDetail');
  if (box) box.classList.toggle('collapsed', !open);
}

/* ===== 统计 / 主线 ===== */
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

/* ===== 今日动态：展开更多 ===== */
function toggleActivityMore() {
  var extras = document.querySelectorAll('#activityList .activity-item.extra');
  var willShow = document.querySelector('#activityList .activity-item.extra.hidden') !== null;
  extras.forEach(function (it) { it.classList.toggle('hidden', !willShow); });
  document.getElementById('activityMoreBtn').textContent = willShow ? '收起' : '展开更多';
}

/* ===== 项目切换面板（沿用旧项目主页：筛选 / 选择项目 / 新建项目 + 认证拦截） ===== */
var PROJECTS = [
  { name: '西安全屋整装', status: '进行中', address: '西安市雁塔区***号***室', contractSigned: 4, contractTotal: 5, taskDone: 18, taskTotal: 24 },
  { name: '北京旧房翻新', status: '进行中', address: '北京市朝阳区***号***室', contractSigned: 2, contractTotal: 3, taskDone: 8, taskTotal: 15 },
  { name: '南阳样板间', status: '已完工', address: '南阳市宛城区***号', contractSigned: 6, contractTotal: 6, taskDone: 32, taskTotal: 32 }
];
var currentIndex = 0;
var panelFilter = 'all';
var currentRole = 'nonworker';
var isUserCertified = false;

function renderPanel() {
  var list = PROJECTS.filter(function (p) {
    if (panelFilter === 'ongoing') return p.status === '进行中';
    if (panelFilter === 'done') return p.status === '已完工' || p.status === '已完成';
    return true;
  });
  var box = document.getElementById('projPanelInner');
  if (!list.length) { box.innerHTML = '<div class="proj-empty">暂无匹配的项目</div>'; return; }
  box.innerHTML = list.map(function (p) {
    var realIdx = PROJECTS.indexOf(p);
    var pct = Math.round(p.contractSigned / p.contractTotal * 100);
    var active = realIdx === currentIndex ? ' active' : '';
    var done = p.status === '已完工' ? ' done' : '';
    return '<div class="proj-option' + active + '" onclick="selectProject(' + realIdx + ')">' +
      '<div class="po-top"><span class="po-name">' + p.name + '</span><span class="po-status' + done + '">' + p.status + '</span></div>' +
      '<div class="po-addr">📍 ' + p.address + '</div>' +
      '<div class="po-stats"><span>合同 ' + p.contractSigned + '/' + p.contractTotal + '</span><span>任务 ' + p.taskDone + '/' + p.taskTotal + '</span></div>' +
      '<div class="po-bar"><div class="po-bar-fill" style="width:' + pct + '%"></div></div></div>';
  }).join('');
}
function renderSwitchBar() {
  var p = PROJECTS[currentIndex];
  document.getElementById('curProjName').textContent = p.name;
  var st = document.getElementById('curProjStatus');
  st.textContent = p.status;
  st.className = 'proj-status' + (p.status === '已完工' ? ' done' : '');
}
function togglePanel() {
  var panel = document.getElementById('projPanel');
  var arrow = document.getElementById('switchArrow');
  var open = panel.classList.toggle('open');
  if (arrow) arrow.classList.toggle('open', open);
}
function selectProject(i) {
  currentIndex = i;
  renderSwitchBar();
  renderPanel();
  togglePanel();
  toast('已切换到 ' + PROJECTS[i].name);
}
function setPanelFilter(f, el) {
  panelFilter = f;
  document.querySelectorAll('#projPanelFilter .pf-item').forEach(function (it) { it.classList.remove('active'); });
  if (el) el.classList.add('active');
  renderPanel();
}
function createProject() {
  if (isUserCertified) { window.location.href = 'create-project.html'; }
  else { document.getElementById('authRequiredModal').classList.add('show'); }
}
function closeAuthModal() { document.getElementById('authRequiredModal').classList.remove('show'); }
function goToAuthPage() { closeAuthModal(); window.location.href = 'promoter-auth.html'; }
function viewProjectInfo() { window.location.href = 'project-info.html'; }

/* 统一真实跳转（对齐旧页 navigate/go/openPage 口径：全部跳转到既有原型页） */
function go(href) { if (href) window.location.href = href; }
/* 我的任务：与 task-list.html 的 ?scope=mytasks 契约同源，带上当前视角 */
function myTasksHref() { return 'task-list.html?scope=mytasks&role=' + currentRole; }
function renderMyTaskSummary() {
  if (!window.MyTasksStore) return;
  var el = document.getElementById(currentRole === 'worker' ? 'mtSWorker' : 'mtSNonworker');
  if (el) el.textContent = MyTasksStore.text(currentRole);
}
function navigate(href) { go(href); }
function openPage(href) { go(href); }

/* 原型导航：收起/展开 + 记忆 */
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

/* 角色视角：非工人 = 服务流程主视图；工人 = 待办/我的任务/合同/任务统计 */
/* ===== 工人视角：我的合同（由「我签订的工人合同」驱动） =====
   一处只展示工人合同本身（contract-store.js 六类工种合同：拆除/水电/木作/泥瓦/油漆/小零工），
   不以项目级服务流程项（基础施工服务 / 主材安装 / 设计服务…）作为卡片主体——那是非工人的服务合同口径。
   卡片 = 一份工种合同：合同名 + 签订状态 + 甲方/工期 + 该合同的「承接任务」阶段轨 + 我的任务。
   本块不展开服务流程，服务流程统一收在卡头「全部流程」入口（按权限显隐）。
   示例数据取 2 条（已签约 / 待确认 各一），覆盖两种签订态。
   跳转带 id（demo-<工种>-example）+ 受邀方状态，落到对应的工种合同详情。 */
var MY_CONTRACTS = [
  {
    contract: '水电班组服务合同', type: 'shuidian', contractName: '全屋水电改造合同',
    partyA: '陈庄', duration: 30,
    signState: '已签约',
    stages: [
      { n: '开槽', s: 'done' }, { n: '布管', s: 'done' }, { n: '沉箱·我', s: 'cur' },
      { n: '穿线', s: 'todo' }, { n: '验收', s: 'todo' }
    ],
    myStage: '当前水电隐蔽', myDone: 3, myTotal: 6,
    href: 'worker-contract-detail.html?id=demo-shuidian-example&viewer=receiver&status=worker_signed'
  },
  {
    contract: '泥瓦工班组服务合同', type: 'niwa', contractName: '厨卫贴砖泥瓦合同',
    partyA: '陈庄', duration: 20,
    signState: '待确认',
    stages: [
      { n: '防水', s: 'todo' }, { n: '闭水', s: 'todo' }, { n: '铺贴·我', s: 'todo' }, { n: '收口', s: 'todo' }
    ],
    myStage: '待合同生效', myDone: 0, myTotal: 5,
    href: 'worker-contract-detail.html?id=demo-niwa-example&viewer=receiver&status=worker_inviting_receiver'
  }
];
function myFlowHtml() {
  return MY_CONTRACTS.map(function (c) {
    var stHtml = c.stages.map(function (s) {
      var cls = 'mf-st' + (s.s === 'done' ? ' done' : s.s === 'cur' ? ' cur' : '');
      return '<span class="' + cls + '">' + s.n + '</span>';
    }).join('');
    var meta = c.contractName + ' · 甲方 ' + c.partyA + ' · 工期 ' + c.duration + ' 天';
    return '<div class="mf-item">' +
      '<div class="mf-top"><span class="mf-name">' + c.contract + '</span>' +
        '<span class="mf-badge ' + (c.signState === '待确认' ? 'off' : 'on') + '">' + c.signState + '</span></div>' +
      '<div class="mf-contract"><span class="mf-ct-tag">工人合同</span>' + meta + '</div>' +
      '<div class="mf-stages">' + stHtml + '</div>' +
      '<div class="mf-foot"><span class="mf-tasks">我的任务 ' + c.myDone + '/' + c.myTotal + ' · ' + c.myStage + '</span>' +
        '<span class="mf-link" onclick="event.stopPropagation();go(\'' + c.href + '\')">查看合同 ›</span></div>' +
    '</div>';
  }).join('');
}
function renderMyFlow() {
  var list = document.getElementById('myFlowList');
  if (!list) return;
  list.innerHTML = myFlowHtml();
  var cnt = document.getElementById('mfCount');
  if (cnt) cnt.textContent = MY_CONTRACTS.length + ' 份合同';
  // 「全部流程」按权限显隐：无可查看全部流程权限时不提供入口
  var va = document.getElementById('mfViewAll');
  if (va) va.style.display = canViewAllFlow ? '' : 'none';
}
/* 快捷入口「我的合同」：合同信息已并入我的合同块，此处滚动定位该卡并短暂高亮 */
function scrollToMyFlow() {
  var card = document.getElementById('myFlowCard');
  if (!card) return;
  if (typeof card.scrollIntoView === 'function') card.scrollIntoView({ block: 'center', behavior: 'smooth' });
  card.classList.add('hl');
  setTimeout(function () { card.classList.remove('hl'); }, 1400);
}

function setRole(role) {
  currentRole = role;
  document.getElementById('nonworkerView').style.display = role === 'nonworker' ? '' : 'none';
  document.getElementById('workerView').style.display = role === 'worker' ? '' : 'none';
  // 服务流程仅非工人（项目负责人）视角存在：工人视角隐藏右侧浮窗入口
  var ft = document.getElementById('flowTrigger');
  if (ft) ft.style.display = role === 'worker' ? 'none' : 'flex';
  if (role === 'worker') closeFlowDrawer();
  syncFlowCfgEntry();
  document.getElementById('pageBody').scrollTop = 0;
  renderMyTaskSummary();
}
function setCertified(yes) {
  isUserCertified = yes;
}

/* 点击面板外部自动收起项目切换面板 */
document.addEventListener('click', function (e) {
  var panel = document.getElementById('projPanel');
  var topbar = document.getElementById('topbar');
  if (panel && panel.classList.contains('open') && topbar && !topbar.contains(e.target)) togglePanel();
});

/* ===== Toast ===== */
var toastTimer;
function toast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.classList.remove('show'); }, 1600);
}

/* ===== sticky 常驻分隔线 ===== */
document.getElementById('pageBody').addEventListener('scroll', function () {
  var st = document.getElementById('flowSticky');
  if (!st) return;
  // 以「元素是否真正贴到滚动容器顶部」判定，而非 scrollTop 阈值（sticky 元素不在页面顶部时阈值判定会提前亮起）
  var pr = this.getBoundingClientRect().top;
  var sr = st.getBoundingClientRect().top;
  st.classList.toggle('stuck', sr <= pr + 1);
});
/* 浮窗内容滚动：流程项 Tab 条吸顶后亮阴影（提示上方仍有流程项上下文） */
(function () {
  var fc = document.querySelector('.fd-content');
  if (!fc) return;
  fc.addEventListener('scroll', function () {
    var fl = document.getElementById('fdFlowList');
    if (fl) fl.classList.toggle('stuck', this.scrollTop > 8);
  });
})();

/* ===== 右侧「服务流程项」浮窗 ===== */
function mainDoneCount() {
  var list = ITEMS;
  return list.filter(function (x) { return x.status === '已完成'; }).length;
}
function syncDrawerIfOpen() {
  var d = document.getElementById('flowDrawer');
  if (d && d.classList.contains('open')) renderFlowDrawer();
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
  renderDetail();
  setDetail(true);
  renderFlowDrawer();   // 抽屉内流程条由 renderFlowDrawer 自行居中
}
var fdDetailTab = 'stage';   // 'stage' = 主合同内的阶段任务；'ext' = 临时任务阶段任务
var fdStageCollapsed = {};   // 阶段卡片折叠态（按 stage id 记忆）
var fdLastSelId = null;
function fdStageCls(s) { return s === '已完成' ? 'completed' : (s === '进行中' ? 'in_progress' : 'pending'); }
function fdTaskIcon(s) { return s === '已完成' ? '✓' : ''; }
/* 选中项居中：把横向流程条滚到「选中项居中」位置（首尾留白由 ::before/::after 提供） */
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
/* ===== 合同入口：与选中流程项强关联（仅含合同型流程项出现） =====
   浮窗（抽屉）全口径：已建合同显示「查看合同」，未建合同显示「拟定合同」；
   主页服务流程卡为纯概览，不再提供任何合同动作（查看/拟定统一收归浮窗与「合同」模块）。 */
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
/* 仅浮窗头部渲染合同动作（查看/拟定）；主页服务流程卡已取消合同按钮，纯概览。 */
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
/* ===== 定位当前：把浮窗复位到「现场真实进度」 =====
   ① 当前施工项：第一个进行中项 → 全完成则最后一个已完成项 → 否则第一项（演示覆盖态优先）
   ② 选中并居中鱼眼 Tab（主页面流程条同步）
   ③ 明细滚到该项「进行中」阶段顶部，折叠则先展开，并高亮 1.6s
   ④ 轻提示说明落点，重复点击也重新闪一次（避免死点） */
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

/* ===== 指派任务（临时任务）：轻量表单弹窗，确认/担责标准非必填 ===== */
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
/* 流程配置权限：非工人 + 有权配置才出现「⚙ 配置」入口（演示三态 all/readonly/none） */
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
/* 指派任务权限：原型按「人员权限内是否赋予该流程项的指派任务功能权限」控制入口显隐（演示用三态） */
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

/* ===== 演示开关 ===== */
function bindOpts(groupId, cb) {
  var g = document.getElementById(groupId);
  g.querySelectorAll('.dp-opt').forEach(function (o) {
    o.addEventListener('click', function () {
      g.querySelectorAll('.dp-opt').forEach(function (x) { x.classList.remove('on'); });
      o.classList.add('on');
      cb(o.getAttribute('data-v'));
    });
  });
}
bindOpts('optStatus', function (v) { overrideStatus = v; renderRail(); renderDetail(); syncDrawerIfOpen(); });
bindOpts('optAssignPerm', function (v) { assignPermMode = v; syncDrawerIfOpen(); });
bindOpts('optViewAll', function (v) { canViewAllFlow = v === 'yes'; renderMyFlow(); });
bindOpts('optCfgPerm', function (v) { flowCfgPerm = v; syncFlowCfgEntry(); });
bindOpts('optRole', function (v) { setRole(v); });
bindOpts('optAuth', function (v) { setCertified(v === 'yes'); });

/* ===== 初始化 ===== */
refreshStats();
renderRail();
renderDetail();
setDetail(true);
renderMyFlow();
renderSwitchBar();
syncFlowCfgEntry();

/* 从「服务流程配置」返回（含 bfcache 恢复）时重新读取配置：流程条 / 浮窗 / 主线统计同步 */
window.addEventListener('pageshow', function () {
  if (!window.FlowCfgStore) return;
  reloadFlowItems();
  syncFlowCfgEntry();
  renderMyFlow();
});
renderPanel();
setRole('nonworker');
window.addEventListener('resize', updateMask);

/* 合同列表页「查看流程」回跳：?item=<流程项id> 直接打开对应流程项浮窗 */
(function () {
  var m = /[?&]item=([^&]+)/.exec(location.search);
  if (!m) return;
  var id = decodeURIComponent(m[1]);
  var hit = false;
  for (var i = 0; i < ITEMS.length; i++) { if (ITEMS[i].id === id) { hit = true; break; } }
  if (!hit) return;
  selectedId = id;
  renderRail(false);
  renderDetail();
  openFlowDrawer();
})();
