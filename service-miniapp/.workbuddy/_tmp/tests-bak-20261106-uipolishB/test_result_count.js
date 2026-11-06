/* 结果条口径专项：选中服务流程项 = 「合同内任务 + 临时任务」之和（跨 Tab、随筛选联动）；
   Tab 文案「临时/流程任务」→「临时任务」；我的任务视图不受影响。 */
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const cfgSrc = fs.readFileSync('js/flow-config-store.js', 'utf-8');
const mtSrc = fs.readFileSync('js/my-tasks-store.js', 'utf-8');
const rawHtml = fs.readFileSync('task-list.html', 'utf-8');

function load(qs) {
  let h = rawHtml.replace('<script src="js/flow-config-store.js"></script>', '<script>' + cfgSrc + '</script>')
                 .replace('<script src="js/my-tasks-store.js"></script>', '<script>' + mtSrc + '</script>');
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
const rc = d => txt(d, '#resultCount');
const cnt = (d, panel, fid) => qa(d, panel + ' .flow-group[data-flow-id="' + fid + '"] .task-item').length;

let pass = 0, fail = 0;
function assert(c, m) { if (c) pass++; else { fail++; console.log('FAIL: ' + m); } }

(async function run() {
  const { d, w, errs } = await load('');
  assert(errs.length === 0, 'jsdom 无运行时错误：' + errs.join(' | '));

  // ---------- 1. 文案 ----------
  assert(txt(d, '.task-tab[data-tab="temp"]').indexOf('临时任务') === 0, 'Tab 文案以「临时任务」开头');
  assert(txt(d, '.task-tab[data-tab="contract"]').indexOf('合同任务') === 0, 'Tab 文案以「合同任务」开头');
  assert(txt(d, '.task-tab[data-tab="contract"]').indexOf('合同内任务') < 0, '合同 Tab 不再含「内」字');
  assert(rawHtml.indexOf('合同内任务') < 0, '源码无「合同内任务」残留');
  assert(txt(d, '.task-tab[data-tab="temp"]').indexOf('/') < 0, 'Tab 文案不再含斜杠');
  assert(rawHtml.indexOf('临时/流程任务') < 0, '源码无「临时/流程任务」残留');
  assert(txt(d, '#panelContract .flow-group[data-flow-id="lh"] .snapshot-empty-hint').indexOf('临时任务') >= 0, '合同空态指引「临时任务」');
  assert(txt(d, '#panelTemp .flow-group[data-flow-id="sh"] .block-empty').indexOf('暂无临时任务') >= 0, '售后非合同空态文案');

  // ---------- 2. 六流程项 × 双 Tab：结果条 = 合同 + 临时 ----------
  const expect = { lh: [0, 3], cs: [0, 4], ht: [6, 1], sg: [50, 15], cz: [0, 5], sh: [0, 0] };
  for (const fid of Object.keys(expect)) {
    w.eval("selectFlow('" + fid + "'); switchTaskTab('contract');");
    const sum = expect[fid][0] + expect[fid][1];
    assert(rc(d) === '共 ' + sum + ' 个任务', fid + ' 合同 Tab 结果条 = ' + sum + '（实际 ' + rc(d) + '）');
    assert(cnt(d, '#panelContract', fid) === expect[fid][0] && cnt(d, '#panelTemp', fid) === expect[fid][1],
      fid + ' 两面板实际条数 ' + expect[fid].join('/'));
    w.eval("switchTaskTab('temp');");
    assert(rc(d) === '共 ' + sum + ' 个任务', fid + ' 临时 Tab 结果条同 = ' + sum + '（实际 ' + rc(d) + '）');
  }
  w.eval("selectFlow('sg'); switchTaskTab('contract');");
  assert(rc(d) === '共 65 个任务', '回到 sg 合同 Tab = 65');
  assert(txt(d, '#tabBadgeContract') === '50' && txt(d, '#tabBadgeTemp') === '15', '徽标仍为各自 Tab 数量 50/15');

  // ---------- 3. 筛选联动（跨 Tab 求和后仍随筛选变化） ----------
  q(d, '#searchInput').value = '巡检';
  w.eval('filterTasks()');
  assert(rc(d) === '共 2 个任务', 'sg 搜「巡检」= 合同 0 + 临时 2 = 2，实际 ' + rc(d));
  w.eval("switchTaskTab('temp')");
  assert(rc(d) === '共 2 个任务', '搜「巡检」临时 Tab 同为 2');
  q(d, '#searchInput').value = '';
  w.eval("switchTaskTab('contract'); filterTasks()");
  assert(rc(d) === '共 65 个任务', '清空搜索恢复 65');

  w.eval("selectStatus('completed', '已完成', null)");
  assert(rc(d) === '共 17 个任务', '筛已完成 = 合同 14 + 临时 3 = 17，实际 ' + rc(d));
  w.eval("switchTaskTab('temp')");
  assert(rc(d) === '共 17 个任务', '筛已完成临时 Tab 同为 17');
  w.eval("selectStatus('all', '全部状态', null); switchTaskTab('contract'); filterTasks()");

  w.eval("currentFilters.type = 'temp'; filterTasks();");
  assert(rc(d) === '共 15 个任务', '类型=临时任务 结果条 15，实际 ' + rc(d));
  w.eval("switchTaskTab('temp')");
  assert(rc(d) === '共 15 个任务', '类型=临时任务 临时 Tab 同为 15');
  w.eval("currentFilters.type = 'all'; switchTaskTab('contract'); filterTasks();");
  assert(rc(d) === '共 65 个任务', '复位类型后 65');

  // ---------- 4. 我的任务视图不受影响 ----------
  {
    const a = await load('?scope=mytasks&role=nonworker');
    assert(rc(a.d) === '我的任务 10 条', '汇总视图仍 10 条');
    assert(txt(a.d, '.mt-sum-title') === '全部流程项 · 我的任务 10 条', '概览标题不变');
    const metas = qa(a.d, '#panelMyTasks .task-meta').map(e => e.textContent);
    assert(metas.some(t => t.indexOf('临时任务') === 0) && metas.every(t => t.indexOf('临时/流程任务') < 0),
      '清单 meta 使用「临时任务」');
    assert(metas.some(t => t.indexOf('合同任务') === 0) && metas.every(t => t.indexOf('合同内任务') < 0),
      '清单 meta 使用「合同任务」');
    a.w.eval("selectFlow('sg')");
    assert(rc(a.d) === '我的任务 8 条', 'sg 作用域仍 8 条');
    a.w.eval("switchTaskTab('contract')");
    assert(/共 \d+ 个任务/.test(rc(a.d)), '切回普通 Tab 恢复「共 N 个任务」');
    assert(a.errs.length === 0, '我的任务视图无运行时错误');
  }

  // ---------- 5. URL 层级契约 / 配置改名 / 守恒 ----------
  {
    const b = await load('?level=' + encodeURIComponent('水电工作组'));
    assert(rc(b.d) === '共 32 个任务', '?level=水电工作组 合同 17 + 临时 15 = 32，实际 ' + rc(b.d));
  }
  {
    const c = await load('');
    const cfg = c.w.FlowCfgStore.get().map(x => x.id === 'sg' ? Object.assign({}, x, { name: '基础施工（改名）' }) : x);
    c.w.eval("localStorage.setItem('lzj_flow_cfg_v1', JSON.stringify(" + JSON.stringify(cfg) + "))");
    c.w.eval('applyFlowCfg(cfgList());');
    assert(rc(c.d) === '共 65 个任务', '配置改名后结果条仍 65');
    assert(q(c.d, '#flowRail .flow-rail-item[data-flow-id="sg"]').textContent === '基础施工（改名）', '改名后 rail 名跟随');
    assert(qa(c.d, '#panelContract .task-item').length === 56 && qa(c.d, '#panelTemp .task-item').length === 28,
      '任务守恒 56 / 28');
    assert(qa(c.d, '.task-panel .task-item').length === 84, '任务总数守恒 84');
    assert(c.errs.length === 0, '改名后无运行时错误');
  }

  console.log('\nRESULT: ' + pass + ' PASS / ' + fail + ' FAIL');
  process.exit(fail ? 1 : 0);
})();
