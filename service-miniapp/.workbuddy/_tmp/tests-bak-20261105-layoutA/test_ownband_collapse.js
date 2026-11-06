const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');

let html = fs.readFileSync('task-list.html', 'utf-8');
html = html.replace('<script src="js/flow-config-store.js"></script>',
  '<script>' + fs.readFileSync('js/flow-config-store.js', 'utf-8') + '</script>');
html = html.replace('<script src="js/my-tasks-store.js"></script>',
  '<script>' + fs.readFileSync('js/my-tasks-store.js', 'utf-8') + '</script>');

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
function activeOwn() { return q('#panelContract .flow-group.is-active .mc-own'); }
function bandOf(own) { return own.querySelector('.mc-own-band'); }
function stagesOf(own) { return own.querySelector('.mc-own-stages'); }
function textOf(own) { return own.querySelector('.mc-own-toggle-text').textContent; }
function arrowOf(own) { return own.querySelector('.mc-own-band .arrow'); }
function shown(own) { return stagesOf(own).classList.contains('show'); }

function run() {
  const btn = q('.expand-all-btn');
  const own = activeOwn();

  // ---------- 1. 初始态：每个「主合同阶段任务」行都有独立控件 ----------
  const bands = qa('.task-panel .mc-own-band');
  assert(bands.length > 0, '存在主合同阶段任务行，实际 ' + bands.length);
  assert(bands.every(b => b.getAttribute('onclick') === 'toggleMainOwnStages(this)'), '每行均绑定收起/展开');
  assert(bands.every(b => b.querySelector('.mc-own-toggle-text') && b.querySelector('.arrow')), '每行均有文案与箭头');
  assert(qa('.task-panel .mc-own').every(o => shown(o)), '初始自身阶段任务全部展开');
  assert(textOf(own) === '收起' && arrowOf(own).classList.contains('expanded'), '初始文案「收起」+ 箭头展开');
  assert(w.getComputedStyle(stagesOf(own)).display === 'block', '初始 CSS 可见');
  const ownTaskCount = own.querySelectorAll('.task-item').length;
  console.log('主合同阶段任务行数:', bands.length, ' sg 自身任务数:', ownTaskCount);

  // ---------- 2. 单独收起：只影响自身阶段任务区 ----------
  bandOf(own).click();
  assert(!shown(own), '点击后自身阶段任务区收起');
  assert(w.getComputedStyle(stagesOf(own)).display === 'none', '点击后 CSS 真隐藏');
  assert(textOf(own) === '展开', '收起后文案变「展开」，实际 ' + textOf(own));
  assert(!arrowOf(own).classList.contains('expanded'), '收起后箭头复位');
  assert(own.querySelectorAll('.task-item').length === ownTaskCount, '任务节点不删除，数量守恒');
  const mc = own.closest('.main-contract');
  assert(!mc.classList.contains('collapsed'), '主合同整体未被连带折叠');
  assert(w.getComputedStyle(mc.querySelector('.mc-children')).display !== 'none', '子合同任务区仍可见');
  assert(w.getComputedStyle(mc.querySelector('.mc-sub-band')).display !== 'none', '子合同任务行仍可见');
  assert(w.getComputedStyle(bandOf(own)).display !== 'none', '本行仍可见可再点开');

  // ---------- 3. 再点展开 ----------
  bandOf(own).click();
  assert(shown(own) && textOf(own) === '收起' && arrowOf(own).classList.contains('expanded'), '再次点击恢复展开');

  // ---------- 4. 与主合同整体折叠互不干扰 ----------
  bandOf(own).click(); // 先单独收起
  const mcHeader = mc.querySelector('.mc-header');
  mcHeader.click();
  assert(mc.classList.contains('collapsed'), '主合同头可整体折叠');
  mcHeader.click();
  assert(!shown(own), '主合同整体展开后，自身阶段任务仍保持用户设定的单独收起态');
  assert(textOf(own) === '展开', '文案仍为「展开」');

  // ---------- 5. 折叠态不被切流程项 / 切 Tab / filterTasks 弹回 ----------
  ev("filterTasks();");
  assert(!shown(own), 'filterTasks 后单独收起态保持');
  ev("switchTaskTab('temp'); switchTaskTab('contract');");
  assert(!shown(own), '切 Tab 后单独收起态保持');
  ev("selectFlow('ht'); selectFlow('sg');");
  assert(!shown(activeOwn()), '切流程项再切回后单独收起态保持');

  // ---------- 6. 全局「收起全部 / 展开全部」联动 ----------
  btn.click();
  assert(qa('.task-panel .mc-own').every(o => !shown(o)), '收起全部：所有自身阶段任务区收起');
  assert(qa('.task-panel .mc-own').every(o => textOf(o) === '展开'), '收起全部：所有行文案「展开」');
  btn.click();
  assert(qa('.task-panel .mc-own').every(o => shown(o)), '展开全部：所有自身阶段任务区展开');
  assert(qa('.task-panel .mc-own').every(o => textOf(o) === '收起'), '展开全部：所有行文案「收起」');

  // ---------- 7. 筛选命中自动展开祖先，清空后恢复用户设定 ----------
  bandOf(own).click(); // 用户设定为收起
  assert(!shown(own) && textOf(own) === '展开', '筛选前置：自身阶段任务已收起');
  const kw = own.querySelector('.task-name').textContent.slice(0, 2);
  ev("document.getElementById('searchInput').value=" + JSON.stringify(kw) + "; filterTasks();");
  assert(shown(own), '筛选命中自身阶段任务时祖先自动展开，实际 shown=' + shown(own));
  assert(textOf(own) === '收起', '筛选期间文案同步为「收起」');
  ev("document.getElementById('searchInput').value=''; filterTasks();");
  assert(!shown(own), '清空筛选后恢复用户设定的收起态');
  assert(textOf(own) === '展开', '清空筛选后文案恢复「展开」');

  // ---------- 8. 任务守恒 / 徽标 / 无运行时错误 ----------
  ev("switchTaskTab('contract'); selectFlow('sg');");
  assert(qa('#panelContract .task-item').length === 56 && qa('#panelTemp .task-item').length === 28, '任务数守恒 56/28');
  assert(q('#tabBadgeContract').textContent === '50', '合同 Tab 徽标 50 不变');
  assert(jsErrors.length === 0, '无 jsdom 运行时错误，实际: ' + jsErrors.join(' | '));

  console.log('\nRESULT: ' + pass + ' PASS / ' + fail + ' FAIL');
  if (fail) process.exitCode = 1;
}

setTimeout(run, 150);
