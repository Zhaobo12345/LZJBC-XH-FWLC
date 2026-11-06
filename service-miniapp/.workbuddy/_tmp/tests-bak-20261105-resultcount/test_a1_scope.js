/* A1 专项：任务归属分流 + Tab 语义 + 我的任务口径（全集 + 两个行动子集） */
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const cfgSrc = fs.readFileSync('js/flow-config-store.js', 'utf-8');
const mtSrc = fs.readFileSync('js/my-tasks-store.js', 'utf-8');

function load(qs) {
  let h = fs.readFileSync('task-list.html', 'utf-8');
  h = h.replace('<script src="js/flow-config-store.js"></script>', '<script>' + cfgSrc + '</script>');
  h = h.replace('<script src="js/my-tasks-store.js"></script>', '<script>' + mtSrc + '</script>');
  const vc = new VirtualConsole(); const errs = [];
  vc.on('jsdomError', e => errs.push(e.message));
  const dom = new JSDOM(h, { runScripts: 'dangerously', pretendToBeVisual: true,
    url: 'https://example.com/task-list.html' + (qs || ''), virtualConsole: vc });
  return new Promise(res => {
    let done = false;
    const finish = () => { if (!done) { done = true; setTimeout(() => res({ d: dom.window.document, w: dom.window, errs }), 30); } };
    dom.window.addEventListener('load', finish); setTimeout(finish, 200);
  });
}
const qa = (o, s) => Array.prototype.slice.call(o.querySelectorAll(s));
const q = (o, s) => o.querySelector(s);
const txt = (o, s) => { const e = q(o, s); return e ? e.textContent.trim() : ''; };
const cnt = (d, panel, fid) => qa(d, panel + ' .flow-group[data-flow-id="' + fid + '"] .task-item').length;

let pass = 0, fail = 0;
function assert(c, m) { if (c) pass++; else { fail++; console.log('FAIL: ' + m); } }

(async function run() {
  const { d, w, errs } = await load('');
  assert(errs.length === 0, 'jsdom 无运行时错误：' + errs.join(' | '));

  // ---------- 1. Tab 语义与全局守恒 ----------
  assert(txt(d, '.task-tab[data-tab="temp"]').indexOf('临时/流程任务') === 0, 'Tab 改名「临时/流程任务」');
  assert(qa(d, '#panelContract .task-item').length === 56, '合同面板 56 条');
  assert(qa(d, '#panelTemp .task-item').length === 28, '非合同面板 28 条');
  assert(qa(d, '.task-panel .task-item').length === 84, '任务总数守恒 84');
  assert(txt(d, '#tabBadgeContract') === '50' && txt(d, '#tabBadgeTemp') === '15', '默认 sg 徽标 50/15 不变');

  // ---------- 2. 六个流程项逐一核对归属 ----------
  const expect = { lh: [0, 3], cs: [0, 4], ht: [6, 1], sg: [50, 15], cz: [0, 5], sh: [0, 0] };
  Object.keys(expect).forEach(fid => {
    const c = cnt(d, '#panelContract', fid), t = cnt(d, '#panelTemp', fid);
    assert(c === expect[fid][0] && t === expect[fid][1], fid + ' 合同/非合同 = ' + c + '/' + t + '（期望 ' + expect[fid].join('/') + '）');
  });

  // ---------- 3. 合同面板差异化空态 ----------
  assert(txt(d, '#panelContract .flow-group[data-flow-id="lh"] .snapshot-empty-title') === '该流程项不含合同', '量房空态标题');
  assert(txt(d, '#panelContract .flow-group[data-flow-id="cs"] .snapshot-empty-title') === '该流程项不含合同', '初步设计空态标题');
  assert(txt(d, '#panelContract .flow-group[data-flow-id="cz"] .snapshot-empty-title') === '合同尚未创建', '主材安装空态标题');
  assert(q(d, '#panelContract .flow-group[data-flow-id="cz"] .snapshot-cta'), '主材安装给拟定合同入口');
  assert(!q(d, '#panelContract .flow-group[data-flow-id="lh"] .snapshot-cta'), '不含合同项不给拟定入口');
  assert(txt(d, '#panelContract .flow-group[data-flow-id="lh"] .snapshot-empty-hint').indexOf('临时/流程任务') >= 0, '空态指引到非合同面板');
  assert(qa(d, '#panelContract .flow-group[data-flow-id="cz"] .contract-section').length === 0, 'cz 不生成合同层级');
  assert(qa(d, '#panelContract .flow-group[data-flow-id="sh"] .block-empty').length === 1, '售后合同面板空态');
  assert(qa(d, '#panelTemp .flow-group[data-flow-id="sh"] .block-empty').length === 1, '售后非合同面板空态');
  w.eval("selectFlow('lh'); switchTaskTab('contract');");
  assert(q(d, '#emptyState').style.display !== 'flex', '量房合同面板不叠加全局空态');
  assert(qa(d, '#panelContract .flow-group.is-active .block-empty').length === 1, '量房合同面板只显示自身空态');
  w.eval("switchTaskTab('temp');");
  assert(txt(d, '#resultCount') === '共 3 个任务', '量房非合同面板结果条 3 条');
  w.eval("selectFlow('sg'); switchTaskTab('contract');");

  // ---------- 4. 非合同面板结构与来源标签 ----------
  const lhG = q(d, '#panelTemp .flow-group[data-flow-id="lh"]');
  assert(qa(lhG, '.temp-loose-list.show .task-item').length === 3, '量房 3 条在无阶段单独任务区');
  assert(qa(lhG, '.stage-item').length === 0 && qa(lhG, '.temp-stage-card').length === 0, '量房无阶段卡');
  assert(txt(lhG, '.src-tag') === '流程任务', '量房标注「流程任务」');
  assert(qa(lhG, '.task-item[data-type="temp"]').length === 3, '量房任务 data-type=temp');
  assert(qa(lhG, '.task-item[data-type="contract"]').length === 0, '量房不再有 contract 任务');
  assert(qa(d, '#panelTemp .flow-group[data-flow-id="cs"] .temp-loose-list .task-item').length === 4, '初步设计 4 条无阶段');
  const czG = q(d, '#panelTemp .flow-group[data-flow-id="cz"]');
  assert(qa(czG, '.temp-stage-card').length === 2, '主材安装保留 2 个阶段卡');
  assert(qa(czG, '.temp-stage-tasks .task-item').length === 5, '主材安装 5 条阶段任务');
  assert(qa(czG, '.temp-stage-card[data-src="flow"]').length === 2, '主材安装阶段卡标注流程任务来源');
  assert(qa(d, '#panelTemp .flow-group[data-flow-id="sg"] .temp-stage-head .src-tag').length === 3, 'sg 静态临时阶段标注「临时任务」');
  assert(qa(d, '#panelTemp .flow-group[data-flow-id="sg"] .temp-loose-band .src-tag').length === 1, 'sg 静态无阶段区标注「临时任务」');
  assert(qa(d, '#panelTemp .flow-group[data-flow-id="sg"] .task-item').length === 15, 'sg 临时任务 15 条未变');

  // ---------- 5. 分流后的折叠联动 ----------
  w.eval("selectFlow('cz'); switchTaskTab('temp');");
  const head = q(d, '#panelTemp .flow-group[data-flow-id="cz"] .temp-stage-head');
  const box = q(d, '#panelTemp .flow-group[data-flow-id="cz"] .temp-stage-tasks');
  assert(box.classList.contains('show'), 'cz 阶段卡默认展开');
  w.eval("document.querySelector('#panelTemp .flow-group[data-flow-id=\"cz\"] .temp-stage-head').click()");
  assert(!box.classList.contains('show'), 'cz 阶段卡可单独收起');
  w.eval("setAllExpanded(true)");
  assert(box.classList.contains('show'), '展开全部可恢复 cz 阶段卡');
  w.eval("setAllExpanded(false)");
  assert(!box.classList.contains('show'), '收起全部覆盖 cz 阶段卡');
  w.eval("setAllExpanded(true); selectFlow('sg'); switchTaskTab('contract');");
  assert(qa(d, '#panelContract .mc-own-stages.show').length >= 1, '主合同阶段任务折叠未受影响');

  // ---------- 6. 普通视图胶囊口径不变 ----------
  ['all', 'mine', 'exec', 'confirm'].forEach((r, i) => {
    w.eval("applyPill('" + r + "', null)");
    const scope = w.eval('activeTaskScope()');
    const n = scope ? qa(scope, '.task-item').filter(t => t.style.display !== 'none').length : -1;
    assert(n === [50, 24, 2, 2][i], '普通视图 sg 合同 Tab ' + r + ' = ' + n);
  });
  w.eval("applyPill('all', null)");

  // ---------- 7. 我的任务口径：nonworker 10 / 5 / 2 ----------
  const m = await load('?scope=mytasks&role=nonworker');
  const p = q(m.d, '#panelMyTasks');
  assert(qa(p, '.task-item').length === 10, '我的任务全集 10 条');
  assert(qa(p, '.task-item[data-participant="true"]').length === 10, '10 条均与我相关');
  ['mine', 'exec', 'confirm'].forEach((r, i) => {
    m.w.eval("applyPill('" + r + "', null)");
    const scope = m.w.eval('activeTaskScope()');
    const n = scope ? qa(scope, '.task-item').filter(t => t.style.display !== 'none').length : -1;
    assert(n === [10, 5, 2][i], '我的任务 nonworker ' + r + ' = ' + n + '（期望 ' + [10, 5, 2][i] + '）');
  });
  m.w.eval("applyPill('all', null)");
  assert(qa(p, '.task-item[data-exec="张三"]').length === 8, '执行人是我 8 条');
  assert(qa(p, '.task-item[data-confirms="张三"]').length === 2, '确认人含我 2 条');
  assert(qa(p, '.task-item[data-exec="张三"][data-status="completed"]').length === 3, '已完成 3 条仅属全集');
  assert(qa(p, '.task-item[data-type="contract"]').length === 5 && qa(p, '.task-item[data-type="temp"]').length === 5, '清单 type 5/5');
  assert(m.w.eval("MyTasksStore.list('nonworker').filter(function(t){return t.id==='n05';})[0].type") === 'temp', 'n05 改为非合同任务');
  assert(m.w.eval("MyTasksStore.list('nonworker').filter(function(t){return t.id==='n05';})[0].contract") === undefined, 'n05 去掉「尚未创建合同」');
  m.w.eval("applyPill('mine', null)");
  assert(txt(m.d, '#filterTags').indexOf('我的任务清单') >= 0, '我的任务视图筛选标签注明清单作用域');
  m.w.eval("applyPill('all', null)");

  // ---------- 8. 我的任务口径：worker 8 / 1 / 3 + 流程项作用域 ----------
  const wk = await load('?scope=mytasks&role=worker');
  ['all', 'mine', 'exec', 'confirm'].forEach((r, i) => {
    wk.w.eval("applyPill('" + r + "', null)");
    const scope = wk.w.eval('activeTaskScope()');
    const n = scope ? qa(scope, '.task-item').filter(t => t.style.display !== 'none').length : -1;
    assert(n === [8, 8, 1, 3][i], '我的任务 worker ' + r + ' = ' + n + '（期望 ' + [8, 8, 1, 3][i] + '）');
  });
  const cz = await load('?scope=mytasks&role=nonworker&flow=cz');
  assert(qa(cz.d, '#panelMyTasks .task-item').length === 1, 'flow=cz 我的任务 1 条');
  const lhm = await load('?scope=mytasks&role=nonworker&flow=lh');
  assert(qa(lhm.d, '#panelMyTasks .block-empty').length === 1, 'flow=lh 我的任务空态');
  assert(q(lhm.d, '#panelMyTasks .mt-back'), '空态提供返回汇总入口');

  // ---------- 9. 配置驱动：新增/改名流程项仍给正确空态 ----------
  w.localStorage.setItem('lzj_flow_cfg_v1', JSON.stringify([
    { id: 'lh', name: '上门勘测', hasContract: false, status: '已完成' },
    { id: 'f9', name: '新增项', hasContract: true, status: '未开始' }
  ]));
  w.eval('applyFlowCfg(cfgList()); refresh();');
  assert(txt(d, '#panelContract .flow-group[data-flow-id="lh"] .snapshot-empty-title') === '该流程项不含合同', '改名后仍给不含合同空态');
  assert(cnt(d, '#panelTemp', 'lh') === 3, '改名后 3 条流程任务保留');
  assert(qa(d, '#panelContract .flow-group[data-flow-id="f9"] .block-empty').length === 1, '新增含合同项合同面板空态');
  assert(qa(d, '#panelTemp .flow-group[data-flow-id="f9"] .block-empty').length === 1, '新增含合同项非合同面板空态');

  console.log('==== A1 scope + role: ' + pass + ' PASS / ' + fail + ' FAIL ====');
  process.exit(fail ? 1 : 0);
})();
