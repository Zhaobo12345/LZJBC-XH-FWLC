const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');

let html = fs.readFileSync('task-list.html', 'utf-8');
const store = fs.readFileSync('js/flow-config-store.js', 'utf-8');
const tag = '<script src="js/flow-config-store.js"></script>';
if (!html.includes(tag)) throw new Error('head script tag missing');
html = html.replace(tag, '<script>' + store + '</script>');

const vc = new VirtualConsole();
const jsErrors = [];
vc.on('jsdomError', e => jsErrors.push(e.message));

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  url: 'https://example.com/task-list.html',
  virtualConsole: vc
});
const w = dom.window;
w.addEventListener('load', function () { try { w.selectFlow('sg'); } catch (e) {} });
const d = w.document;

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) pass++;
  else { fail++; console.log('FAIL: ' + msg); }
}
function q(sel) { return d.querySelector(sel); }
function qa(sel) { return Array.prototype.slice.call(d.querySelectorAll(sel)); }
function ev(code) { return w.eval(code); }
function g(panel, fid) { return q(panel + ' .flow-group[data-flow-id="' + fid + '"]'); }
function visibleText(sel) { return qa(sel).filter(x => w.getComputedStyle(x).display !== 'none').map(x => x.textContent.trim()); }

function run() {
  // ---------- 1. 四类冗余头行：DOM 中彻底移除 ----------
  assert(qa('.task-panel .flow-group-head').length === 0, '两面板流程项头行（基础施工服务 共N条）已删除，实际 ' + qa('.task-panel .flow-group-head').length);
  assert(qa('#panelContract .block-band').length === 0, '合同面板「合同层级」band 已删除，实际 ' + qa('#panelContract .block-band').length);
  assert(qa('#panelTemp .temp-band').length === 0, '临时面板「阶段任务/单独任务 N」band 已删除，实际 ' + qa('#panelTemp .temp-band').length);
  assert(qa('.task-panel .group-stat').length === 0, '「共 N 条」统计行已删除');
  assert(!/合同层级/.test(q('#taskContainer').textContent), '合同面板正文不含「合同层级」');
  assert(!/阶段任务 \/ 单独任务/.test(q('#taskContainer').textContent), '临时面板正文不含「阶段任务 / 单独任务」');
  assert(!/共 \d+ 条/.test(q('#taskContainer').textContent), '面板正文不含「共 N 条」');

  // ---------- 2. 上方信息仍在（不误删） ----------
  assert(qa('#flowRail .flow-rail-item').length === 6, 'rail 仍为配置驱动 6 项');
  assert(q('#flowRail .flow-rail-item.active') && q('#flowRail .flow-rail-item.active').textContent.trim() === '基础施工服务', 'rail 仍显示当前流程项名');
  assert(q('#tabBadgeContract').textContent === '50', 'Tab 合同徽标 50 保留，实际 ' + q('#tabBadgeContract').textContent);
  assert(q('#tabBadgeTemp').textContent === '15', 'Tab 临时徽标 15 保留，实际 ' + q('#tabBadgeTemp').textContent);
  assert(/共 65 个任务/.test(q('#resultCount').textContent), '结果条 65 保留，实际 ' + q('#resultCount').textContent);

  // ---------- 3. 合同层级未受影响 ----------
  const sgC = g('#panelContract', 'sg');
  assert(!!sgC, 'sg 合同分组存在');
  assert(sgC.querySelectorAll('.main-contract').length === 1, 'sg 主合同 1 份');
  assert(sgC.querySelectorAll('.mc-own .stage-item').length === 5, '主合同自身 5 阶段保留');
  assert(sgC.querySelectorAll('.mc-own .task-item').length === 24, '主合同自身 24 任务保留');
  assert(sgC.querySelectorAll('.mc-children > .contract-section').length === 4, '4 张工种子合同保留');
  assert(sgC.querySelectorAll('.mc-children .stage-item').length === 8, '子合同 8 阶段保留');
  assert(sgC.querySelectorAll('.mc-children .task-item').length === 26, '子合同 26 任务保留');
  assert(sgC.querySelectorAll('.mc-own-band').length === 1 && sgC.querySelectorAll('.mc-sub-band').length === 1, '主合同/子合同分层带仍保留');
  assert(sgC.querySelectorAll('.task-item').length === 50, '合同面板合计 50 条');

  // ---------- 4. 临时任务阶段化未受影响 ----------
  const sgT = g('#panelTemp', 'sg');
  assert(sgT.querySelectorAll('.temp-stage-card').length === 3, '临时 3 张阶段卡保留');
  assert(sgT.querySelectorAll('.temp-loose .task-item').length === 3, '无阶段单独任务 3 条保留');
  assert(sgT.querySelectorAll('.task-item').length === 15, '临时任务 15 条守恒');
  assert(!!sgT.querySelector('.temp-loose-band'), '「无阶段单独任务」小标题保留（属内容结构，非冗余头行）');

  // ---------- 5. ht 去重与空态 ----------
  const htC = g('#panelContract', 'ht');
  assert(htC && htC.querySelectorAll('.task-item').length === 6, 'ht 合同任务 6 条（去重）');
  assert(qa('#panelContract .mc-name, #panelContract .contract-name').filter(x => x.textContent.trim() === '设计服务合同').length === 1, '「设计服务合同」只出现 1 次');
  const shC = g('#panelContract', 'sh');
  assert(shC && !!shC.querySelector('.block-empty'), '售后合同空态保留');
  const shT = g('#panelTemp', 'sh');
  assert(shT && !!shT.querySelector('.block-empty'), '售后临时空态保留');
  // 空态分组也不得再生成 band / head
  assert(shC.querySelectorAll('.flow-group-head, .block-band').length === 0, '空态合同分组无冗余头行');
  assert(shT.querySelectorAll('.flow-group-head, .block-band').length === 0, '空态临时分组无冗余头行');

  // ---------- 6. Tab 切换后仍无冗余行 ----------
  ev("switchTaskTab('temp')");
  assert(q('#panelTemp').classList.contains('is-active'), '切到临时 Tab');
  assert(qa('.task-panel .flow-group-head').length === 0, '切 Tab 后无流程项头行');
  assert(qa('.task-panel .block-band').length === 0, '切 Tab 后无 band');
  assert(/共 65 个任务/.test(q('#resultCount').textContent), '临时 Tab 结果条 65，实际 ' + q('#resultCount').textContent);
  ev("switchTaskTab('contract')");

  // ---------- 7. rail 切换 / 配置重读幂等 ----------
  ev("selectFlow('ht')");
  assert(qa('.task-panel .flow-group-head').length === 0, '切 ht 后无流程项头行');
  assert(qa('.task-panel .block-band').length === 0, '切 ht 后无 band');
  assert(q('#tabBadgeContract').textContent === '6', 'ht 合同徽标 6，实际 ' + q('#tabBadgeContract').textContent);
  ev("selectFlow('sg')");
  ev("applyFlowCfg(cfgList())");
  assert(qa('.task-panel .flow-group-head').length === 0, '配置重读后无流程项头行');
  assert(qa('.task-panel .block-band').length === 0, '配置重读后无 band');
  assert(q('#tabBadgeContract').textContent === '50', '配置重读后徽标仍 50');

  // ---------- 8. 12 项配置下新增分组也无冗余行 ----------
  ev("localStorage.setItem('lzj_flow_cfg_v1', JSON.stringify(Array.from({length:12},(_,i)=>({id:'x'+i,name:'自定义'+i,status:'todo',hasContract:false,tasks:0,contracts:0,stages:0})))); applyFlowCfg(cfgList());");
  assert(qa('#flowRail .flow-rail-item').length === 12, '12 项配置生效');
  assert(qa('.task-panel .flow-group-head').length === 0, '12 项配置下无流程项头行');
  assert(qa('.task-panel .block-band').length === 0, '12 项配置下无 band');

  // ---------- 9. 无运行时错误 ----------
  assert(jsErrors.length === 0, '无 jsdom 运行时错误，实际: ' + jsErrors.join(' | '));

  console.log('\nRESULT: ' + pass + ' PASS / ' + fail + ' FAIL');
  if (fail) process.exitCode = 1;
}

setTimeout(run, 150);
