const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');

const storeCfg = fs.readFileSync('js/flow-config-store.js', 'utf-8');
const storeTasks = fs.readFileSync('js/my-tasks-store.js', 'utf-8');

function load(qs) {
  let h = fs.readFileSync('task-list.html', 'utf-8');
  h = h.replace('<script src="js/flow-config-store.js"></script>', '<script>' + storeCfg + '</script>');
  h = h.replace('<script src="js/my-tasks-store.js"></script>', '<script>' + storeTasks + '</script>');
  const vc = new VirtualConsole();
  const errs = [];
  vc.on('jsdomError', e => errs.push(e.message));
  const dom = new JSDOM(h, {
    runScripts: 'dangerously', pretendToBeVisual: true,
    url: 'https://example.com/task-list.html' + (qs || ''), virtualConsole: vc
  });
  const out = { d: dom.window.document, w: dom.window, errs };
  return new Promise(resolve => {
    let done = false;
    const finish = () => { if (!done) { done = true; setTimeout(() => resolve(out), 20); } };
    dom.window.addEventListener('load', finish);
    setTimeout(finish, 150);
  });
}

let pass = 0, fail = 0;
function assert(c, m) { if (c) pass++; else { fail++; console.log('FAIL: ' + m); } }
function q(o, s) { return o.querySelector(s); }
function qa(o, s) { return Array.prototype.slice.call(o.querySelectorAll(s)); }
function txt(o, s) { const e = q(o, s); return e ? e.textContent : ''; }
function rail(o, d) { return q(d, '#flowRail .flow-rail-item[data-flow-id="' + o + '"]'); }

(async function run() {
  // ---------- 1. 不带 flow：项目级汇总（与主页 10 条一致） ----------
  {
    const { d, w, errs } = await load('?scope=mytasks&role=nonworker');
    const p = q(d, '#panelMyTasks');
    assert(w.eval('myTasksFlow') === 'all', '默认作用域 all');
    assert(qa(p, '.task-item').length === 10, '汇总 10 条');
    assert(/全部流程项 · 我的任务 10 条/.test(txt(p, '.mt-sum-title')), '概览标题标注全部流程项，实际 ' + txt(p, '.mt-sum-title'));
    assert(/待处理 5/.test(txt(p, '.mt-sum-stats')) && /确认中 2/.test(txt(p, '.mt-sum-stats')) && /已完成 3/.test(txt(p, '.mt-sum-stats')), '汇总三态 5/2/3');
    assert(q(d, '#tabBadgeMyTasks').textContent === '10', '汇总徽标 10');
    assert(/我的任务 10 条/.test(txt(d, '#resultCount')), '结果条 10');
    assert(q(d, '#flowRail').style.display !== 'none', 'rail 常驻');
    assert(q(d, '.expand-all-btn').style.display === 'none', '收起全部仍隐藏');
    assert(qa(d, '#flowRail .flow-rail-item').length === 7, 'rail = 全部 + 6 流程项');
    assert(rail('all', d).classList.contains('active'), '全部流程项高亮');
    assert(qa(p, '.mt-flow-group').length === 3, '汇总跨 3 个流程项');
    assert(errs.length === 0, '汇总视图无运行时错误: ' + errs.join('|'));
  }

  // ---------- 2. flow=sg：按流程项收窄 ----------
  {
    const { d, w, errs } = await load('?scope=mytasks&role=nonworker&flow=sg');
    const p = q(d, '#panelMyTasks');
    assert(w.eval('myTasksFlow') === 'sg', 'URL 解析 flow=sg');
    assert(qa(p, '.task-item').length === 8, 'sg 我的任务 8 条，实际 ' + qa(p, '.task-item').length);
    assert(/基础施工服务 · 我的任务 8 条/.test(txt(p, '.mt-sum-title')), '概览标题带流程项名，实际 ' + txt(p, '.mt-sum-title'));
    assert(/待处理 4/.test(txt(p, '.mt-sum-stats')) && /确认中 2/.test(txt(p, '.mt-sum-stats')) && /已完成 2/.test(txt(p, '.mt-sum-stats')), 'sg 三态 4/2/2');
    assert(q(d, '#tabBadgeMyTasks').textContent === '8', '徽标 8');
    assert(/我的任务 8 条/.test(txt(d, '#resultCount')), '结果条 8');
    assert(qa(p, '.mt-flow-group').length === 1 && q(p, '.mt-flow-group').getAttribute('data-flow-id') === 'sg', '只渲染 sg 一个分组');
    assert(rail('sg', d).classList.contains('active') && !rail('all', d).classList.contains('active'), 'rail 高亮 sg');
    assert(/当前流程项口径/.test(txt(p, '.mt-sum-hint')), '概览注明当前流程项口径');
    assert(/flow=sg/.test(w.location.search), 'URL 保留 flow=sg');

    // 筛选穿透
    w.eval("document.getElementById('searchInput').value='巡检'; filterTasks();");
    assert(/我的任务 1 条/.test(txt(d, '#resultCount')), 'sg 内搜「巡检」命中 1 条，实际 ' + txt(d, '#resultCount'));
    w.eval("document.getElementById('searchInput').value=''; filterTasks();");
    assert(/我的任务 8 条/.test(txt(d, '#resultCount')), '清空搜索恢复 8 条');
    w.eval("currentFilters.type='temp'; filterTasks();");
    assert(/我的任务 4 条/.test(txt(d, '#resultCount')), 'sg 内筛临时任务 4 条，实际 ' + txt(d, '#resultCount'));
    w.eval("currentFilters.type='all'; filterTasks();");

    // 切 Tab 不丢作用域
    w.eval("switchTaskTab('contract')");
    assert(/共 50 个任务/.test(txt(d, '#resultCount')), '切合同 Tab 结果条 50');
    assert(!rail('all', d), '切合同 Tab 后 rail 无「全部流程项」');
    w.eval("switchTaskTab('mytasks')");
    assert(qa(p, '.task-item').length === 8 && /我的任务 8 条/.test(txt(d, '#resultCount')), '切回我的任务仍是 sg 8 条');
    assert(rail('sg', d).classList.contains('active'), '切回后 rail 仍高亮 sg');
    assert(errs.length === 0, 'sg 视图无运行时错误: ' + errs.join('|'));
  }

  // ---------- 3. 其它流程项与空态 ----------
  {
    const a = await load('?scope=mytasks&role=nonworker&flow=ht');
    assert(qa(a.d, '#panelMyTasks .task-item').length === 1, '设计服务 1 条');
    assert(/设计服务 · 我的任务 1 条/.test(txt(a.d, '#panelMyTasks .mt-sum-title')), '设计服务概览 1 条');
    assert(/已完成 1/.test(txt(a.d, '#panelMyTasks .mt-sum-stats')), '设计服务 1 条已完成');

    const b = await load('?scope=mytasks&role=nonworker&flow=cz');
    assert(qa(b.d, '#panelMyTasks .task-item').length === 1, '主材安装 1 条');
    assert(/待处理 1/.test(txt(b.d, '#panelMyTasks .mt-sum-stats')), '主材安装 1 条待处理');

    const c = await load('?scope=mytasks&role=nonworker&flow=lh');
    const p = q(c.d, '#panelMyTasks');
    assert(qa(p, '.task-item').length === 0, '量房 0 条');
    assert(/量房 · 我的任务 0 条/.test(txt(p, '.mt-sum-title')), '量房概览 0 条');
    assert(/该服务流程项下暂无我的任务/.test(txt(p, '.block-empty')), '给出流程项空态');
    assert(!!q(p, '.mt-back'), '空态带「查看全部流程项」');
    assert(q(c.d, '#emptyState').style.display !== 'flex', '全局空态不重复出现');
    assert(q(c.d, '#tabBadgeMyTasks').textContent === '0', '徽标 0');
    assert(rail('lh', c.d).classList.contains('active'), 'rail 高亮量房');
    q(p, '.mt-back').click();
    assert(qa(p, '.task-item').length === 10, '点返回汇总恢复 10 条');
    assert(!/flow=/.test(c.w.location.search), '返回汇总后 URL 去掉 flow，实际 ' + c.w.location.search);
    assert(rail('all', c.d).classList.contains('active'), '返回后高亮全部流程项');
    assert(c.errs.length === 0, '空态视图无运行时错误: ' + c.errs.join('|'));
  }

  // ---------- 4. rail 交互与 URL 同步 ----------
  {
    const { d, w, errs } = await load('?scope=mytasks&role=nonworker');
    rail('lh', d).click();
    assert(w.eval('myTasksFlow') === 'lh' && /flow=lh/.test(w.location.search), '点量房后作用域与 URL 同步');
    assert(qa(d, '#panelMyTasks .task-item').length === 0, '点量房后 0 条');
    rail('sg', d).click();
    assert(w.eval('myTasksFlow') === 'sg' && /flow=sg/.test(w.location.search), '点基础施工服务后作用域与 URL 同步');
    assert(qa(d, '#panelMyTasks .task-item').length === 8, '点 sg 后 8 条');
    rail('all', d).click();
    assert(w.eval('myTasksFlow') === 'all' && !/flow=/.test(w.location.search), '点全部流程项后 URL 去掉 flow');
    assert(qa(d, '#panelMyTasks .task-item').length === 10, '点全部后 10 条');
    assert(errs.length === 0, 'rail 交互无运行时错误: ' + errs.join('|'));
  }

  // ---------- 5. worker 视角 ----------
  {
    const a = await load('?scope=mytasks&role=worker&flow=sg');
    const p = q(a.d, '#panelMyTasks');
    assert(qa(p, '.task-item').length === 8, 'worker sg 8 条');
    assert(/待处理 1/.test(txt(p, '.mt-sum-stats')) && /确认中 3/.test(txt(p, '.mt-sum-stats')) && /已完成 4/.test(txt(p, '.mt-sum-stats')), 'worker sg 三态 1/3/4');
    const b = await load('?scope=mytasks&role=worker&flow=ht');
    assert(qa(b.d, '#panelMyTasks .task-item').length === 0, 'worker 设计服务 0 条');
    assert(!!q(b.d, '#panelMyTasks .mt-back'), 'worker 空态也可返回汇总');
    assert(a.errs.length === 0 && b.errs.length === 0, 'worker 视图无运行时错误');
  }

  // ---------- 6. 配置驱动 / 无效 flow / 普通访问零影响 / 守恒 ----------
  {
    const a = await load('?scope=mytasks&role=nonworker&flow=sg');
    const cfg = a.w.FlowCfgStore.get().map(c => c.id === 'sg' ? Object.assign({}, c, { name: '基础施工（改名）' }) : c);
    a.w.eval("localStorage.setItem('lzj_flow_cfg_v1', JSON.stringify(" + JSON.stringify(cfg) + "))");
    a.w.eval("applyFlowCfg(cfgList());");
    assert(/基础施工（改名） · 我的任务 8 条/.test(txt(a.d, '#panelMyTasks .mt-sum-title')), '改名后概览名跟随配置');
    assert(q(a.d, '#flowRail .flow-rail-item[data-flow-id="sg"]').textContent === '基础施工（改名）', '改名后 rail 名跟随配置');

    const b = await load('?scope=mytasks&role=nonworker&flow=notexist');
    assert(b.w.eval('myTasksFlow') === 'all', '无效 flow 回退全部流程项');
    assert(qa(b.d, '#panelMyTasks .task-item').length === 10, '无效 flow 仍 10 条');

    const c = await load('');
    assert(c.w.eval('myTasksMode') === false, '普通访问不进入 mytasks 模式');
    assert(q(c.d, '#tabMyTasks').style.display === 'none', '普通访问第三 Tab 隐藏');
    assert(!rail('all', c.d), '普通访问 rail 无「全部流程项」');
    assert(qa(c.d, '#flowRail .flow-rail-item').length === 6, '普通访问 rail 6 项');
    assert(/共 50 个任务/.test(txt(c.d, '#resultCount')), '普通访问结果条 50');
    assert(qa(c.d, '#panelContract .task-item').length === 56 && qa(c.d, '#panelTemp .task-item').length === 28, '任务守恒 56/28');
    assert(c.errs.length === 0, '普通访问无运行时错误');
  }

  console.log('\nRESULT: ' + pass + ' PASS / ' + fail + ' FAIL');
  if (fail) process.exitCode = 1;
})();
