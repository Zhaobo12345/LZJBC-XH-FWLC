/* =========================================================================
 * 业主端「服务流程」浮窗模块（自 service-miniapp/project-list.html 同步）
 * 已剔除：角色视角(worker/nonworker) / 演示开关(demo-panel) / 指派任务(assign)
 *        / 流程配置入口(flow-config) / 新建项目切换面板
 * 业主端无「拟定合同」权限 → 合同入口统一为「查看合同」→ contract-detail.html
 * 全部函数包裹于 IIFE 并以 flow 前缀私有化，仅把 HTML inline onclick 需要的
 * 函数挂到 window，避免与业主端 project-detail.js 既有同名函数冲突。
 * ========================================================================= */
(function () {
  'use strict';

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

  /* ===== 默认服务流程项（SSOT 与 service-miniapp baseItems 一致；经 FlowCfgStore 合并） ===== */
  function flowBaseItems() {
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
     配置项提供顺序 / 名称 / 是否含合同 / 增减；明细（阶段、任务、临时任务）按 id 从默认项继承。 */
  function flowCfgItems() {
    var cfg = (window.FlowCfgStore ? FlowCfgStore.get() : null);
    if (!cfg || !cfg.length) return flowBaseItems();
    var detail = {};
    flowBaseItems().forEach(function (it) { detail[it.id] = it; });
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
  function flowReloadFlowItems() {
    ITEMS = flowCfgItems();
    var still = ITEMS.some(function (x) { return x.id === selectedId; });
    if (!still) selectedId = (ITEMS[0] || {}).id;
    flowRefreshStats();
    flowRenderRail();
    flowSyncDrawerIfOpen();
  }

  var ITEMS = flowCfgItems();
  var selectedId = 'sg';          // 默认首个进行中项
  var detailOpen = true;
  var overrideStatus = '进行中';  // 业主端无演示开关，固定为进行中
  var fdDetailTab = 'stage';      // 'stage' = 主合同内的阶段任务；'ext' = 临时任务
  var fdStageCollapsed = {};      // 阶段卡片折叠态（按 stage id 记忆）
  var fdLastSelId = null;

  /* ===== 渲染流程条（主页服务流程卡） ===== */
  function flowRenderRail(smooth) {
    var rail = document.getElementById('flowRail');
    if (!rail) return;
    rail.innerHTML = '';
    ITEMS.forEach(function (it) {
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
      el.addEventListener('click', function () { flowSelectItem(it.id); });
      rail.appendChild(el);
    });
    flowUpdateMask();
    rail.classList.toggle('centerable', rail.scrollWidth > rail.clientWidth + 2);
    flowCenterRail(rail, rail.querySelector('.flow-item.on'), smooth === true);
    flowRenderContractAction();
  }

  function flowUpdateMask() {
    var rail = document.getElementById('flowRail');
    var mask = document.getElementById('railMask');
    if (!rail || !mask) return;
    mask.style.display = rail.scrollWidth > rail.clientWidth + 2 ? 'block' : 'none';
  }

  function flowSelectItem(id) {
    selectedId = id;
    flowRenderRail(true);
    flowOpenFlowDrawer();   // 选中流程项 → 展开并展示右侧浮窗
  }

  function countDone(arr) { return (arr || []).filter(function (x) { return x.status === '已完成'; }).length; }

  /* ===== 统计 / 主线 ===== */
  function flowRefreshStats() {
    var cTotal = 0, cDone = 0, tTotal = 0, tDone = 0, mainDone = 0;
    ITEMS.forEach(function (it) {
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
    var cNum = document.getElementById('cNum'); if (cNum) cNum.textContent = cDone + '/' + cTotal;
    var tNum = document.getElementById('tNum'); if (tNum) tNum.textContent = tDone + '/' + tTotal;
    var cPct = document.getElementById('cPct'); if (cPct) cPct.textContent = (cTotal ? Math.round(cDone / cTotal * 100) : 0) + '%';
    var tPct = document.getElementById('tPct'); if (tPct) tPct.textContent = (tTotal ? Math.round(tDone / tTotal * 100) : 0) + '%';
    var mainLine = document.getElementById('mainLine'); if (mainLine) mainLine.textContent = '主线 ' + mainDone + '/' + ITEMS.length;
  }

  /* ===== 浮窗开关 ===== */
  function flowMainDoneCount() { return ITEMS.filter(function (x) { return x.status === '已完成'; }).length; }
  function flowSyncDrawerIfOpen() {
    var d = document.getElementById('flowDrawer');
    if (d && d.classList.contains('open')) flowRenderFlowDrawer();
  }
  function flowOpenFlowDrawer() {
    flowRenderFlowDrawer();
    var m = document.getElementById('flowDrawerMask');
    var d = document.getElementById('flowDrawer');
    var t = document.getElementById('flowTrigger');
    if (m) m.classList.add('open');
    if (d) d.classList.add('open');
    if (t) t.style.opacity = '0';
  }
  function flowCloseFlowDrawer() {
    var m = document.getElementById('flowDrawerMask');
    var d = document.getElementById('flowDrawer');
    var t = document.getElementById('flowTrigger');
    if (m) m.classList.remove('open');
    if (d) d.classList.remove('open');
    if (t) t.style.opacity = '1';
  }
  function flowFdRow(name, meta, badge, status) {
    var ss = statusStyle(status);
    return '<div class="fd-item" onclick="flowGo(\'task-detail.html\')">' +
      '<span class="fd-dot" style="background:' + ss.dot + (ss.ring ? ';border:2px solid ' + ss.ring : '') + '"></span>' +
      '<span class="fd-name">' + name + '</span>' +
      '<span class="fd-meta">' + meta + '</span>' +
      '<span class="fd-badge badge ' + ss.badge + '">' + badge + '</span></div>';
  }
  function flowSelectFlow(id) {
    selectedId = id;
    flowRenderRail(true);
    flowRenderFlowDrawer();
  }
  function flowCenterRail(rail, item, smooth) {
    if (!rail || !item || !rail.clientWidth) return;
    var target = item.offsetLeft - (rail.clientWidth - item.offsetWidth) / 2;
    if (target < 0) target = 0;
    var max = rail.scrollWidth - rail.clientWidth;
    if (max > 0 && target > max) target = max;
    if (typeof rail.scrollTo === 'function') {
      try { rail.scrollTo({ left: target, behavior: smooth ? 'smooth' : 'auto' }); }
      catch (e) { rail.scrollLeft = target; }
    } else { rail.scrollLeft = target; }
  }
  function flowFdList() { return ITEMS; }
  /* 业主端：合同入口统一为「查看合同」（业主无「拟定合同」权限） */
  function flowContractAction(sel, surface) {
    if (!sel || !sel.hasContract) return null;
    if (surface === 'home') return null;       // 主页服务流程卡 = 纯概览，不渲染合同按钮
    return { text: '查看合同', cls: 'view', url: 'contract-detail.html?from=flow&item=' + sel.id };
  }
  function flowGo(href) { if (href) window.location.href = href; }
  function flowGoContract(surface) {
    var sel = flowFdList().filter(function (x) { return x.id === selectedId; })[0];
    var a = flowContractAction(sel, surface || 'drawer');
    if (!a) return;
    window.location.href = a.url;
  }
  function flowRenderContractAction() {
    var sel = flowFdList().filter(function (x) { return x.id === selectedId; })[0];
    var el = document.getElementById('fdContractAct');
    if (!el) return;
    var a = flowContractAction(sel, 'drawer');
    if (!a) { el.style.display = 'none'; el.textContent = ''; return; }
    el.style.display = '';
    el.className = 'fd-act ' + a.cls;
    el.textContent = a.text;
  }
  function flowCenterFdRail(smooth) {
    var rail = document.querySelector('#fdFlowList .fd-rail');
    if (rail) flowCenterRail(rail, rail.querySelector('.fd-rail-item.active'), smooth);
  }
  function flowCurrentFlowItem() {
    var list = flowFdList();
    var st = function (it) { return it.id === selectedId ? overrideStatus : it.status; };
    var running = list.filter(function (it) { return st(it) === '进行中'; });
    if (running.length) return running[0];
    var done = list.filter(function (it) { return st(it) === '已完成'; });
    if (done.length) return done[done.length - 1];
    return list[0] || null;
  }
  function flowLocateStageOf(it) {
    var stages = (it && it.stages) || [];
    var running = stages.filter(function (s) { return s.status === '进行中'; });
    if (running.length) return running[0];
    var next = stages.filter(function (s) { return s.status !== '已完成'; });
    return next[0] || stages[stages.length - 1] || null;
  }
  function flowScrollFdToLocate(stage) {
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
    } else { fc.scrollTop = top; }
    if (card) {
      card.classList.remove('locate-hl');
      void card.offsetWidth;
      card.classList.add('locate-hl');
      setTimeout(function () { card.classList.remove('locate-hl'); }, 1700);
    }
    return card;
  }
  function flowLocateCurrent() {
    var it = flowCurrentFlowItem();
    if (!it) return;
    var switched = it.id !== selectedId;
    if (switched) {
      selectedId = it.id;
      flowRenderRail(true);
    }
    fdDetailTab = 'stage';
    flowRenderFlowDrawer();
    var stage = flowLocateStageOf(it);
    if (stage && fdStageCollapsed[stage.id]) {
      var card = document.querySelector('.fd-stage-card[data-sid="' + stage.id + '"]');
      if (card) flowToggleFdStage(stage.id);
    }
    flowScrollFdToLocate(stage);
    flowToast('已定位 · ' + it.name + (stage ? ' · ' + stage.name : ''));
  }

  /* ===== 浮窗渲染 ===== */
  function flowRenderFlowDrawer() {
    var list = ITEMS;
    var selIdx = -1;
    list.forEach(function (it, i) { if (it.id === selectedId) selIdx = i; });
    var railEl = document.getElementById('fdFlowList');
    if (!railEl) return;
    var cards = railEl.querySelectorAll('.fd-rail .fd-rail-item');
    if (cards.length === list.length) {
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
      railEl.innerHTML = '<div class="fd-rail">' + list.map(function (it, i) {
        var st = (it.id === selectedId) ? overrideStatus : it.status;
        var ss = statusStyle(st);
        var active = it.id === selectedId ? ' active' : '';
        var d = Math.abs(i - selIdx);
        var prog = it.total > 0 ? (it.done + '/' + it.total) : '—';
        var pct = it.total > 0 ? Math.round(it.done / it.total * 100) : 0;
        return '<div class="fd-rail-item' + active + ' fd-ri-d' + (d > 3 ? 3 : d) + '" onclick="flowSelectFlow(\'' + it.id + '\')">' +
          '<span class="fd-ri-name">' + it.name + '</span>' +
          '<span class="fd-ri-bar"><i style="width:' + pct + '%;background:' + ss.bar + '"></i></span>' +
          '<span class="fd-ri-prog">' + prog + '</span></div>';
      }).join('') + '</div>';
    }

    var sel = list.filter(function (x) { return x.id === selectedId; })[0];
    if (selectedId !== fdLastSelId) {
      fdStageCollapsed = {};
      if (sel && sel.stages) sel.stages.forEach(function (s) { fdStageCollapsed[s.id] = (s.collapsed === true); });
      fdLastSelId = selectedId;
    }
    var fd = document.getElementById('fdDetail');
    if (fd) fd.innerHTML = flowRenderFdDetail(sel);
    flowUpdateCollapseAllLabel();
    flowCenterFdRail(true);
    var flEl = document.getElementById('fdFlowList');
    var wrapEl = document.querySelector('#fdDetail .fd-bm-wrap');
    if (flEl && flEl.offsetHeight > 0) {
      var bmMt = 0;
      if (wrapEl) { var m = parseFloat(getComputedStyle(wrapEl).marginTop); if (!isNaN(m)) bmMt = m; }
      document.documentElement.style.setProperty('--fd-rail-h', (flEl.offsetHeight + bmMt) + 'px');
    }
    var mc = document.getElementById('fdMainCount');
    if (mc) mc.innerHTML = '主线 <b>' + flowMainDoneCount() + '</b>/' + list.length + ' 环';
    flowRenderContractAction();
  }
  function flowRenderFdDetail(sel) {
    if (!sel) return '';
    if (sel.kind === 'contract') {
      var stageOn = fdDetailTab === 'stage' ? ' on' : '';
      var extOn = fdDetailTab === 'ext' ? ' on' : '';
      var stageCount = sel.stages.length;
      var extList = sel.externals || [];
      var extDone = extList.filter(function (e) { return e.status === '已完成'; }).length;
      return '<div class="fd-bm-wrap">' +
        '<div class="fd-bm-col">' +
        '<div class="fd-bm' + stageOn + '" data-g="stage" onclick="flowSwitchFdTab(\'stage\')">合同内<span class="fd-bm-n">' + stageCount + ' 阶段</span></div>' +
        '<div class="fd-bm' + extOn + '" data-g="ext" onclick="flowSwitchFdTab(\'ext\')">临时任务<span class="fd-bm-n">' + extDone + '/' + extList.length + '</span></div>' +
        '<div class="fd-bm-util"' + (fdDetailTab === 'ext' ? ' style="display:none"' : '') + ' onclick="flowToggleAllFdStages()"><span id="fdcLabel">收起</span></div>' +
        '</div>' +
        '<div class="fd-bm-panel"><div id="fdDetailBody">' + flowFdDetailBody(sel, fdDetailTab) + '</div></div>' +
        '</div>';
    }
    var tRows = sel.tasks && sel.tasks.length
      ? sel.tasks.map(function (t) { return flowFdRow(t.name, '执行 ' + t.exec, badgeText(t.status), t.status); }).join('')
      : '<div class="fd-empty">' + ((sel.stages && sel.stages.length) ? '该项未开启「含合同」，阶段任务已隐藏' : '该流程项暂无任务') + '</div>';
    var ext = sel.externals || [];
    var extHtml = '';
    if (ext.length) {
      extHtml = '<div class="fd-ext-sub"><div class="fd-ext-sub-h">临时任务<span class="fd-ext-sub-n">' + ext.length + '</span></div>' +
        ext.map(function (e) { return flowFdExtRow(e); }).join('') + '</div>';
    }
    return '<div id="fdDetailBody">' + tRows + extHtml + '</div>';
  }
  function flowFdDetailBody(sel, group) {
    if (sel.kind !== 'contract') return '';
    if (group === 'ext') return flowFdExtHtml(sel);
    if (!sel.stages || !sel.stages.length) {
      return '<div class="fd-empty">该项已开启「含合同」，尚未创建合同。创建合同后可配置阶段与任务</div>';
    }
    var html = '<div class="fd-stage-list">';
    sel.stages.forEach(function (st) {
      var collapsed = fdStageCollapsed[st.id] === true;
      var total = st.tasks.length;
      var done = st.tasks.filter(function (t) { return t.status === '已完成'; }).length;
      var ddCls = flowFdStageCls(st.status);
      var tasksHtml = st.tasks.map(function (t) {
        var tCls = flowFdStageCls(t.status);
        var tag = t.hasTag ? '<span class="fd-task-tag">#</span>' : '';
        return '<div class="fd-stage-task-item ' + tCls + '" onclick="flowGo(\'task-detail.html\')">' +
          '<span class="fd-task-status-icon ' + tCls + '">' + flowFdTaskIcon(t.status) + '</span>' +
          '<span class="fd-task-name">' + t.name + '</span>' + tag +
          '<span class="fd-task-arrow">›</span></div>';
      }).join('');
      var maxH = collapsed ? '0px' : (total * 50 + 4) + 'px';
      html += '<div class="fd-stage-card' + (collapsed ? ' collapsed' : '') + '" data-sid="' + st.id + '">' +
        '<div class="fd-stage-header" onclick="flowToggleFdStage(\'' + st.id + '\')">' +
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
  function flowFdExtHtml(sel) {
    var list = sel.externals || [];
    var body = list.length
      ? '<div class="fd-ext-list">' + list.map(function (e) { return flowFdExtRow(e); }).join('') + '</div>'
      : '<div class="fd-ext-none">暂无临时任务</div>';
    return body;
  }
  function flowFdExtRow(e) {
    var ss = statusStyle(e.status);
    return '<div class="fd-ext-task" onclick="flowGo(\'task-detail.html\')">' +
      '<span class="fd-dot" style="background:' + ss.dot + (ss.ring ? ';border:2px solid ' + ss.ring : '') + '"></span>' +
      '<span class="fd-name">' + e.name + '</span>' +
      (e.exec ? '<span class="fd-meta">' + e.exec + '</span>' : '') +
      (e.confirms && e.confirms.length ? '<span class="fd-meta">确认' + e.confirms.length + '人</span>' : '') +
      '<span class="fd-badge badge ' + ss.badge + '">' + badgeText(e.status) + '</span></div>';
  }
  function flowFdStageCls(s) { return s === '已完成' ? 'completed' : (s === '进行中' ? 'in_progress' : 'pending'); }
  function flowFdTaskIcon(s) { return s === '已完成' ? '✓' : ''; }
  function flowToggleFdStage(sid) {
    var card = document.querySelector('.fd-stage-card[data-sid="' + sid + '"]');
    if (!card) return;
    var listEl = card.querySelector('.fd-stage-task-list');
    var collapsed = card.classList.toggle('collapsed');
    fdStageCollapsed[sid] = collapsed;
    var n = listEl.querySelectorAll('.fd-stage-task-item').length;
    listEl.style.maxHeight = collapsed ? '0px' : (n * 50 + 4) + 'px';
  }
  function flowToggleAllFdStages() {
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
      if (target === 'collapse') { c.classList.add('collapsed'); listEl.style.maxHeight = '0px'; }
      else { c.classList.remove('collapsed'); var n = listEl.querySelectorAll('.fd-stage-task-item').length; listEl.style.maxHeight = (n * 50 + 4) + 'px'; }
      var sid = c.getAttribute('data-sid');
      if (sid) fdStageCollapsed[sid] = (target === 'collapse');
    });
    flowUpdateCollapseAllLabel();
  }
  function flowUpdateCollapseAllLabel() {
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
  function flowSwitchFdTab(group) {
    fdDetailTab = group;
    var tabs = document.querySelectorAll('#fdDetail .fd-bm');
    tabs.forEach(function (t) { t.classList.toggle('on', t.getAttribute('data-g') === group); });
    var util = document.querySelector('#fdDetail .fd-bm-util');
    if (util) util.style.display = group === 'ext' ? 'none' : 'flex';
    var body = document.getElementById('fdDetailBody');
    if (!body) return;
    var sel = ITEMS.filter(function (x) { return x.id === selectedId; })[0];
    if (sel && sel.kind === 'contract') body.innerHTML = flowFdDetailBody(sel, group);
    flowUpdateCollapseAllLabel();
  }

  /* ===== Toast（独立元素，避免与业主端既有 toast 冲突） ===== */
  var flowToastTimer;
  function flowToast(msg) {
    var t = document.getElementById('flowToast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(flowToastTimer);
    flowToastTimer = setTimeout(function () { t.classList.remove('show'); }, 1600);
  }

  /* ===== 浮窗内容滚动：流程项 Tab 条吸顶后亮阴影 ===== */
  (function () {
    var fc = document.querySelector('.fd-content');
    if (!fc) return;
    fc.addEventListener('scroll', function () {
      var fl = document.getElementById('fdFlowList');
      if (fl) fl.classList.toggle('stuck', this.scrollTop > 8);
    });
  })();

  /* ===== 初始化 ===== */
  flowRefreshStats();
  flowRenderRail();
  window.addEventListener('resize', flowUpdateMask);
  window.addEventListener('pageshow', function () {
    if (!window.FlowCfgStore) return;
    flowReloadFlowItems();
  });

  /* 合同列表页「查看流程」回跳：?item=<流程项id> 直接打开对应流程项浮窗 */
  (function () {
    var m = /[?&]item=([^&]+)/.exec(location.search);
    if (!m) return;
    var id = decodeURIComponent(m[1]);
    var hit = false;
    for (var i = 0; i < ITEMS.length; i++) { if (ITEMS[i].id === id) { hit = true; break; } }
    if (!hit) return;
    selectedId = id;
    flowRenderRail(false);
    flowOpenFlowDrawer();
  })();

  /* ===== 暴露给 HTML inline onclick 的函数（其余全部私有） ===== */
  window.flowOpenFlowDrawer = flowOpenFlowDrawer;
  window.flowCloseFlowDrawer = flowCloseFlowDrawer;
  window.flowSelectFlow = flowSelectFlow;
  window.flowSwitchFdTab = flowSwitchFdTab;
  window.flowToggleAllFdStages = flowToggleAllFdStages;
  window.flowToggleFdStage = flowToggleFdStage;
  window.flowGoContract = flowGoContract;
  window.flowLocateCurrent = flowLocateCurrent;
  window.flowGo = flowGo;
})();
