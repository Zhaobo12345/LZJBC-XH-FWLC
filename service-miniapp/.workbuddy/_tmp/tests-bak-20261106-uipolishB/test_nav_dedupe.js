/* 原型导航重复项去重专项：仅删 1 行，验证导航结构与既有交互零回归 */
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const cfgSrc = fs.readFileSync('js/flow-config-store.js', 'utf-8');
const mtSrc = fs.readFileSync('js/my-tasks-store.js', 'utf-8');
const rawHtml = fs.readFileSync('task-list.html', 'utf-8');

function load() {
  const h = rawHtml
    .replace('<script src="js/flow-config-store.js"></script>', '<script>' + cfgSrc + '</script>')
    .replace('<script src="js/my-tasks-store.js"></script>', '<script>' + mtSrc + '</script>');
  const vc = new VirtualConsole();
  const errs = [];
  vc.on('jsdomError', e => errs.push(e.message));
  const dom = new JSDOM(h, {
    runScripts: 'dangerously', pretendToBeVisual: true,
    url: 'https://example.com/task-list.html', virtualConsole: vc
  });
  return new Promise(res => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setTimeout(() => res({ d: dom.window.document, w: dom.window, errs }), 30);
    };
    dom.window.addEventListener('load', finish);
    setTimeout(finish, 200);
  });
}
const q = (o, s) => o.querySelector(s);
const qa = (o, s) => Array.prototype.slice.call(o.querySelectorAll(s));
const txt = (o, s) => { const e = q(o, s); return e ? e.textContent.trim() : ''; };
let pass = 0, fail = 0;
function assert(c, m) { if (c) pass++; else { fail++; console.log('FAIL: ' + m); } }

(async function run() {
  const { d, w, errs } = await load();
  assert(errs.length === 0, 'jsdom 无运行时错误：' + errs.join(' | '));

  // 1. 去重结果
  assert((rawHtml.match(/项目主页（进行中）/g) || []).length === 1, '源码仅 1 处「项目主页（进行中）」');
  const nav = q(d, '.page-nav');
  assert(!!nav, '原型导航容器存在');
  const items = qa(nav, 'a.page-nav-item');
  assert(items.length === 6, '导航项 6 个（去重后），实际 ' + items.length);
  const hit = items.filter(a => a.textContent.trim() === '项目主页（进行中）');
  assert(hit.length === 1, 'DOM 内命中 1 项');
  assert(hit[0] && hit[0].getAttribute('href') === 'project-list.html', '该项仍指向项目主页');
  const keys = items.map(a => a.getAttribute('href') + '|' + a.textContent.trim());
  assert(new Set(keys).size === keys.length, '导航项无 href+文案 重复');
  assert(items.filter(a => a.classList.contains('active')).length === 1, '当前页高亮仍唯一');

  // 2. 既有交互零回归
  assert(!!q(d, '#toolBar #searchInput') && !!q(d, '#toolBar #filterBtn'), '工具条仍完整');
  assert(!!q(d, '#navCard #flowRail') && !!q(d, '#navCard #taskTabBar'), '导航卡仍完整');
  assert(qa(d, '#taskTabBar .task-tab').length >= 2, 'Tab 仍在');
  assert(qa(d, '#panelContract .task-item').length === 56, '合同面板 56 条任务');
  assert(qa(d, '#panelTemp .task-item').length === 28, '临时面板 28 条任务');
  assert(/共 65 个任务/.test(txt(d, '#resultCount')), '结果条跨 Tab 求和仍为 65');
  w.eval('toggleFilterSheet()');
  assert(q(d, '#filterSheet').classList.contains('show'), '筛选面板可打开');
  w.eval('closeFilterSheet()');
  assert(!q(d, '#filterSheet').classList.contains('show'), '筛选面板可关闭');
  w.eval("switchTaskTab('temp')");
  assert(q(d, '#panelTemp').classList.contains('is-active'), 'Tab 切换仍生效');

  console.log('RESULT: %d PASS / %d FAIL', pass, fail);
  console.log(fail === 0 ? '==== ALL PASS ====' : '==== HAS FAIL ====');
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
