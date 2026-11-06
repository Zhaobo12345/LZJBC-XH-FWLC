const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');

let html = fs.readFileSync('task-list.html', 'utf-8');
html = html.replace('<script src="js/flow-config-store.js"></script>',
  '<script>' + fs.readFileSync('js/flow-config-store.js', 'utf-8') + '</script>');

const vc = new VirtualConsole();
const jsErrors = [];
vc.on('jsdomError', e => jsErrors.push(e.message));
const dom = new JSDOM(html, {
  runScripts: 'dangerously', pretendToBeVisual: true,
  url: 'https://example.com/task-list.html', virtualConsole: vc
});
const w = dom.window, d = w.document;

let pass = 0, fail = 0;
function assert(cond, msg) { if (cond) pass++; else { fail++; console.log('FAIL: ' + msg); } }
function q(s) { return d.querySelector(s); }
function qa(s) { return Array.prototype.slice.call(d.querySelectorAll(s)); }
function ev(code) { return w.eval(code); }
function boxShown(sel) { return qa('.task-panel ' + sel + '.show').length; }
function stat() {
  return {
    taskList: boxShown('.task-list'),
    stageGroup: boxShown('.stage-group'),
    tempStage: boxShown('.temp-stage-tasks'),
    tempLoose: boxShown('.temp-loose-list'),
    ownList: qa('.task-panel .mc-own .task-list.show').length
  };
}

function run() {
  const btn = q('.expand-all-btn');
  const mcHeader = q('#panelContract .flow-group.is-active .mc-header');
  const mc = mcHeader.closest('.main-contract');

  // ---------- 1. 初始态 ----------
  assert(btn.textContent === '收起全部', '初始按钮「收起全部」，实际 ' + btn.textContent);
  assert(ev('allExpanded') === true, '初始 allExpanded=true');
  const s0 = stat();
  console.log('初始展开容器:', JSON.stringify(s0));
  assert(s0.taskList > 0 && s0.tempStage > 0 && s0.ownList > 0, '初始三类容器均展开');
  assert(!mc.classList.contains('collapsed'), '初始主合同未折叠');

  // ---------- 2. 收起全部：所有层级都要收起 ----------
  btn.click();
  assert(btn.textContent === '展开全部', '点一次后按钮「展开全部」，实际 ' + btn.textContent);
  assert(ev('allExpanded') === false, '点一次后 allExpanded=false');
  const s1 = stat();
  console.log('收起后展开容器:', JSON.stringify(s1));
  assert(s1.taskList === 0, '收起后合同任务列表全收起，实际 ' + s1.taskList);
  assert(s1.ownList === 0, '收起后主合同自身阶段任务全收起，实际 ' + s1.ownList);
  assert(s1.stageGroup === 0, '收起后阶段组全收起，实际 ' + s1.stageGroup);
  assert(s1.tempStage === 0, '收起后临时任务阶段卡全收起，实际 ' + s1.tempStage);
  assert(s1.tempLoose === 0, '收起后无阶段单独任务全收起，实际 ' + s1.tempLoose);
  assert(mc.classList.contains('collapsed'), '收起后主合同带 .collapsed');
  assert(w.getComputedStyle(mc.querySelector('.mc-own')).display === 'none', '收起后主合同自身区 CSS 真隐藏');
  assert(qa('.task-panel .arrow.expanded').length === 0, '收起后所有箭头复位');

  // ---------- 3. 收起态不被 filterTasks 弹回 ----------
  ev("document.getElementById('searchInput').value='巡检'; filterTasks();");
  ev("document.getElementById('searchInput').value=''; filterTasks();");
  const s1b = stat();
  assert(s1b.taskList === 0 && s1b.tempStage === 0, '搜索后清空仍保持收起（不弹回），实际 ' + JSON.stringify(s1b));
  ev("switchTaskTab('temp'); switchTaskTab('contract');");
  assert(stat().taskList === 0, '切 Tab 后仍保持收起');
  ev("selectFlow('ht'); selectFlow('sg');");
  assert(stat().taskList === 0, '切流程项后仍保持收起');

  // ---------- 4. 展开全部 ----------
  btn.click();
  assert(btn.textContent === '收起全部', '再点后按钮「收起全部」');
  assert(ev('allExpanded') === true, '再点后 allExpanded=true');
  const s2 = stat();
  console.log('展开后展开容器:', JSON.stringify(s2));
  assert(s2.taskList === s0.taskList && s2.tempStage === s0.tempStage && s2.ownList === s0.ownList, '展开全部恢复到初始全展开');
  assert(!mc.classList.contains('collapsed'), '展开后主合同移除 .collapsed');
  assert(w.getComputedStyle(mc.querySelector('.mc-own')).display !== 'none', '展开后主合同自身区可见');

  // ---------- 5. 「50 任务」主合同头单独折叠 ----------
  assert(mc.querySelector('.mc-count').textContent.trim() === '50 任务', '主合同头显示 50 任务');
  mcHeader.click();
  assert(mc.classList.contains('collapsed'), '点主合同头后 .collapsed 生效');
  assert(w.getComputedStyle(mc.querySelector('.mc-own')).display === 'none', '主合同自身阶段任务被隐藏');
  assert(w.getComputedStyle(mc.querySelector('.mc-children')).display === 'none', '子合同任务被隐藏');
  assert(!mcHeader.querySelector('.arrow').classList.contains('expanded'), '主合同箭头复位');
  assert(w.getComputedStyle(mcHeader).display !== 'none', '主合同头自身仍可见（可再点开）');

  // 折叠态不被 filterTasks 弹回（.collapsed 为 !important）
  ev("filterTasks();");
  assert(mc.classList.contains('collapsed'), 'filterTasks 后主合同仍折叠');
  assert(w.getComputedStyle(mc.querySelector('.mc-own')).display === 'none', 'filterTasks 后主合同内容仍隐藏');

  mcHeader.click();
  assert(!mc.classList.contains('collapsed'), '再点主合同头展开');
  assert(w.getComputedStyle(mc.querySelector('.mc-children')).display !== 'none', '子合同任务恢复可见');
  assert(mcHeader.querySelector('.arrow').classList.contains('expanded'), '箭头恢复');

  // ---------- 6. 单阶段折叠与收起全部共存 ----------
  const sh = q('#panelContract .flow-group.is-active .stage-header');
  sh.click();
  const tl = sh.nextElementSibling;
  assert(!tl.classList.contains('show'), '单阶段可单独收起');
  ev("filterTasks();");
  assert(!tl.classList.contains('show'), '单阶段折叠不被弹回');
  btn.click(); // 收起全部
  btn.click(); // 展开全部
  assert(tl.classList.contains('show'), '一轮收起/展开后单阶段恢复展开');

  // ---------- 7. 临时 Tab 下按钮同样生效 ----------
  ev("switchTaskTab('temp')");
  btn.click();
  assert(boxShown('.temp-stage-tasks') === 0 && boxShown('.temp-loose-list') === 0, '临时 Tab 下收起全部生效');
  btn.click();
  assert(boxShown('.temp-stage-tasks') > 0 && boxShown('.temp-loose-list') > 0, '临时 Tab 下展开全部生效');

  // ---------- 8. 计数与任务守恒、无运行时错误 ----------
  ev("switchTaskTab('contract'); selectFlow('sg');");
  assert(q('#tabBadgeContract').textContent === '50', '合同 Tab 徽标 50 不变');
  assert(/共 65 个任务/.test(q('#resultCount').textContent), '结果条 65 不变，实际 ' + q('#resultCount').textContent);
  assert(qa('#panelContract .task-item').length === 56 && qa('#panelTemp .task-item').length === 28, '任务数守恒 56/28');
  assert(jsErrors.length === 0, '无 jsdom 运行时错误，实际: ' + jsErrors.join(' | '));

  console.log('\nRESULT: ' + pass + ' PASS / ' + fail + ' FAIL');
  if (fail) process.exitCode = 1;
}

setTimeout(run, 150);
