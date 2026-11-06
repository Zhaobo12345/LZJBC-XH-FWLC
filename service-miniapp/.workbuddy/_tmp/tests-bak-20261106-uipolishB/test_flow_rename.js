/* 术语改名专项：project-list.html「服务流程」→「项目流程」（含浮窗）
   验收：3 处用户可见文案、源码零残留、浮窗/角色/配置/跳转逻辑零回归。 */
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const cfgSrc = fs.readFileSync('js/flow-config-store.js', 'utf-8');
const mtSrc = fs.readFileSync('js/my-tasks-store.js', 'utf-8');
const rawHtml = fs.readFileSync('project-list.html', 'utf-8');

function load() {
  const h = rawHtml
    .replace('<script src="js/flow-config-store.js"></script>', '<script>' + cfgSrc + '</script>')
    .replace('<script src="js/my-tasks-store.js"></script>', '<script>' + mtSrc + '</script>');
  const vc = new VirtualConsole();
  const errs = [];
  vc.on('jsdomError', e => errs.push(e.message));
  const dom = new JSDOM(h, {
    runScripts: 'dangerously', pretendToBeVisual: true,
    url: 'https://example.com/project-list.html', virtualConsole: vc
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

  // ---------- 1. 源码与 DOM 文案 ----------
  assert(errs.length === 0, 'jsdom 无运行时错误：' + errs.join(' | '));
  assert(rawHtml.indexOf('服务流程') < 0, '源码无「服务流程」残留');
  assert((rawHtml.match(/项目流程/g) || []).length === 25, '源码「项目流程」25 处');
  assert(d.body.textContent.indexOf('服务流程') < 0, '渲染后 DOM 文本无「服务流程」');
  assert(txt(d, '.flow-head .fh-t').indexOf('项目流程') === 0, '主页卡头为「项目流程」');
  assert(txt(d, '#flowTrigger .ft-text') === '项目流程', '浮窗触发条为「项目流程」');
  assert(txt(d, '#flowDrawer .fd-title') === '项目流程项', '浮窗标题为「项目流程项」');
  assert(/\d+\/\d+/.test(txt(d, '#mainLine')), '主线统计仍渲染');
  assert(txt(d, '#cNum') !== '' && txt(d, '#tNum') !== '', '合同/任务统计仍渲染');

  // ---------- 2. 结构完整性 ----------
  const ids = qa(d, '[id]').map(e => e.id);
  assert(new Set(ids).size === ids.length, 'id 无重复');
  assert(!!q(d, '#flowSticky') && !!q(d, '#flowRail'), '主页流程卡与 rail 仍在');
  assert(q(d, '.flow-head').getAttribute('onclick').indexOf('openFlowDrawer') >= 0, '卡头仍可打开浮窗');
  assert(q(d, '#flowTrigger').getAttribute('onclick').indexOf('openFlowDrawer') >= 0, '触发条仍可打开浮窗');
  assert(q(d, '#fdCfg').getAttribute('onclick').indexOf('openFlowConfig') >= 0, '浮窗配置入口仍在');

  // ---------- 3. 浮窗交互 ----------
  assert(!q(d, '#flowDrawer').classList.contains('open'), '浮窗初始关闭');
  w.eval('openFlowDrawer()');
  assert(q(d, '#flowDrawer').classList.contains('open'), '浮窗可打开');
  assert(q(d, '#flowDrawerMask').classList.contains('open'), '遮罩同步打开');
  assert(qa(d, '#fdFlowList > *').length > 0, '浮窗鱼眼 rail 已渲染');
  assert((q(d, '#fdDetailBody') ? q(d, '#fdDetailBody').textContent.trim() : '') !== '', '浮窗明细已渲染');
  assert(q(d, '#flowDrawer').textContent.indexOf('服务流程') < 0, '浮窗内无旧术语');
  w.eval('closeFlowDrawer()');
  assert(!q(d, '#flowDrawer').classList.contains('open'), '浮窗可关闭');

  // ---------- 4. 角色视角与既有逻辑零回归 ----------
  w.eval("setRole('worker')");
  assert(q(d, '#workerView').style.display !== 'none', '工人视角显示');
  assert(q(d, '#nonworkerView').style.display === 'none', '非工人视图隐藏');
  assert(q(d, '#flowTrigger').style.display === 'none', '工人视角隐藏浮窗触发条');
  assert(!!q(d, '#mfViewAll') && txt(d, '#mfViewAll').indexOf('全部流程') >= 0, '工人卡头「全部流程」入口保留');
  w.eval("setRole('nonworker')");
  assert(q(d, '#nonworkerView').style.display !== 'none', '切回非工人视图');
  assert(q(d, '#flowTrigger').style.display !== 'none', '浮窗触发条恢复');

  assert(typeof w.FlowCfgStore === 'object' && w.FlowCfgStore.get().length === 6, '流程配置仍 6 项');
  assert(typeof w.myTasksHref === 'function' && w.myTasksHref().indexOf('scope=mytasks') >= 0, '我的任务跳转仍带 scope');
  const mt = q(d, '#mtSNonworker');
  assert(!mt || /待处理/.test(mt.textContent), '我的任务三态摘要仍渲染');

  console.log('RESULT: %d PASS / %d FAIL', pass, fail);
  console.log(fail === 0 ? '==== ALL PASS ====' : '==== HAS FAIL ====');
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
