/* 方案 A 两行优化专项：第一行紧凑 + 右侧渐隐提示（无「+N ›」角标）；第二行 Tab 改下划线。
   验收要点：渐隐层为 rail 兄弟节点且 pointer-events:none（不可点、不显示计数）、
   溢出时右侧让位 18px 保证最后一项不被盖、无溢出/滑到末端自动隐藏、我的任务视图、
   Tab 三态与任务守恒零回归。 */
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
    const finish = () => { if (!done) { done = true; setTimeout(() => { try { if (!/[?&]scope=mytasks/.test(typeof qs === 'string' ? qs : '')) dom.window.selectFlow('sg'); } catch (e) {} res({ d: dom.window.document, w: dom.window, errs }); }, 30); } };
    dom.window.addEventListener('load', finish); setTimeout(finish, 200);
  });
}
const qa = (o, s) => Array.prototype.slice.call(o.querySelectorAll(s));
const q = (o, s) => o.querySelector(s);
const txt = (o, s) => { const e = q(o, s); return e ? e.textContent.trim() : '' };
const has = (o, s) => !!q(o, s);
let passN = 0, failN = 0;
function assert(c, m) { if (c) passN++; else { failN++; console.log('FAIL: ' + m); } }

(async function run() {
  // ============ 1. CSS 覆盖段标记与关键规则 ============
  const css = (rawHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/g) || []).join('\n');
  assert(css.indexOf('/* ===== UI Polish C：两行紧凑化') >= 0 &&
         css.indexOf('/* ===== UI Polish C END ===== */') >= 0, 'C 段有 START/END 边界（可整段删除回退）');
  assert(css.indexOf('.rail-fade') >= 0, '右侧渐隐层样式存在');
  assert(css.indexOf('.rail-more') === -1, '「+N ›」角标样式已移除（不存在 .rail-more）');
  assert(/\.rail-fade\s*\{[^}]*width:\s*14px/.test(css), '渐隐层宽度收窄为 14px（只柔化裁切边缘，不遮住露出的半截项）');
  assert(/\.rail-fade\s*\{[^}]*pointer-events:\s*none/.test(css), '渐隐层 pointer-events:none（不可点击）');
  assert(css.indexOf('.rail-wrap { position: relative; margin-right: -12px; }') >= 0, 'rail 外壳负边距吃掉卡片右内边距（裁切线落到卡片右缘）');
  assert(css.indexOf('.nav-card .flow-rail-item { min-height: 30px; padding: 0 10px') >= 0, 'rail 项内边距 10px：首屏可露出约 40px 半截下一项');
  assert(css.indexOf('.nav-card .task-tab-bar { gap: 0; margin-bottom: 6px; border-bottom: 1px solid') >= 0, '第二行 Tab 改为下划线基线');
  assert(css.indexOf('.nav-card .task-tab.active::after') >= 0, '下划线 Tab 选中态色条');
  assert(css.indexOf('.nav-card .flow-rail-item { min-height: 30px') >= 0, '第一行 rail 项更矮（40→30）');

  // ============ 2. 默认视图：无角标、渐隐为被动提示、右侧让位 ============
  const c = await load('');
  assert(c.errs.length === 0, 'jsdom 无运行时错误：' + c.errs.join(' | '));
  assert(has(c.d, '#railFade'), '渐隐层存在');
  assert(!has(c.d, '#railMore'), '「+N ›」按钮节点已移除');
  assert(!q(c.d, '.rail-more'), '页面无 .rail-more 元素');
  assert(typeof c.w.toggleRailMore === 'undefined', 'toggleRailMore 已下线（无可点入口）');
  const rail = q(c.d, '#flowRail'), fade = q(c.d, '#railFade');
  assert(rail && fade && rail.parentElement === fade.parentElement, 'railFade 是 flowRail 的兄弟节点');
  assert(rail.parentElement && rail.parentElement.className === 'rail-wrap', 'rail 与渐隐同处 .rail-wrap（渐隐 right:0 天然贴 rail 右缘）');
  assert(fade.getAttribute('aria-hidden') === 'true', '渐隐层标记 aria-hidden（纯装饰）');
  const items6 = qa(c.d, '#flowRail .flow-rail-item').length;
  assert(items6 === 6, '默认流程项 6 个，实际 ' + items6);
  assert(fade.style.display !== 'none', '6 项溢出时渐隐提示可见');
  assert(rail.style.paddingRight === '18px', '6 项溢出时右侧让位 18px，实际 ' + (rail.style.paddingRight || '(空)'));

  // ============ 3. 滑到末端：渐隐自动隐藏（模拟真实布局尺寸） ============
  const c3 = await load('');
  const r3 = q(c3.d, '#flowRail'), f3 = q(c3.d, '#railFade');
  Object.defineProperty(r3, 'clientWidth', { value: 300, configurable: true });
  Object.defineProperty(r3, 'scrollWidth', { value: 600, configurable: true });
  r3.scrollLeft = 0;
  c3.w.eval('computeRailFade();');
  assert(f3.style.display !== 'none', '未到末端：渐隐提示可见');
  assert(r3.style.paddingRight === '18px', '未到末端：让位保持 18px');
  r3.scrollLeft = 300;
  c3.w.eval('syncRailMore();');
  assert(f3.style.display === 'none', '滑到末端：渐隐提示自动隐藏');
  r3.scrollLeft = 120;
  c3.w.eval('syncRailMore();');
  assert(f3.style.display !== 'none', '回滑到中途：渐隐提示重新出现');

  // ============ 4. 配置增删：12 项与 2 项（无溢出时不提示、不让位） ============
  const c12 = await load('');
  c12.w.eval("localStorage.setItem('lzj_flow_cfg_v1', JSON.stringify([{id:'a',name:'甲',hasContract:true,status:'进行中'},{id:'b',name:'乙',hasContract:true,status:'进行中'},{id:'c',name:'丙',hasContract:true,status:'进行中'},{id:'d',name:'丁',hasContract:true,status:'进行中'},{id:'e',name:'戊',hasContract:true,status:'进行中'},{id:'f',name:'己',hasContract:true,status:'进行中'},{id:'g',name:'庚',hasContract:true,status:'进行中'},{id:'h',name:'辛',hasContract:true,status:'进行中'},{id:'i',name:'壬',hasContract:true,status:'进行中'},{id:'j',name:'癸',hasContract:true,status:'进行中'},{id:'k',name:'子',hasContract:true,status:'进行中'},{id:'l',name:'丑',hasContract:true,status:'进行中'}])); applyFlowCfg(cfgList());");
  assert(qa(c12.d, '#flowRail .flow-rail-item').length === 12, '12 项配置渲染 12 个 rail 项');
  assert(q(c12.d, '#railFade').style.display !== 'none', '12 项仍显示渐隐提示');
  assert(q(c12.d, '#flowRail').style.paddingRight === '18px', '12 项仍保留 18px 让位');

  const c2 = await load('');
  c2.w.eval("localStorage.setItem('lzj_flow_cfg_v1', JSON.stringify([{id:'a',name:'甲',hasContract:true,status:'进行中'},{id:'b',name:'乙',hasContract:true,status:'进行中'}])); applyFlowCfg(cfgList());");
  assert(qa(c2.d, '#flowRail .flow-rail-item').length === 2, '2 项配置渲染 2 个 rail 项');
  assert(q(c2.d, '#railFade').style.display === 'none', '2 项无溢出：隐藏渐隐提示');
  assert((q(c2.d, '#flowRail').style.paddingRight || '') === '', '2 项无溢出：不占用右侧让位');

  // ============ 5. 点选流程项：布局不变（无展开态） ============
  const c5 = await load('');
  c5.w.eval("selectFlow('ht');");
  assert(!q(c5.d, '#flowRail').classList.contains('rail-expanded') && !q(c5.d, '#navCard').classList.contains('rail-expanded'), '点选流程项后无 rail-expanded（布局稳定）');
  assert(has(c5.d, '#railFade') && !has(c5.d, '#railMore'), '点选流程项后仍无角标');

  // ============ 6. 我的任务视图（含全部流程项 = 7 项） ============
  const c6 = await load('?scope=mytasks&role=nonworker');
  assert(qa(c6.d, '#flowRail .flow-rail-item').length === 7, '我的任务视图 rail 含「全部流程项」共 7 项，实际 ' + qa(c6.d, '#flowRail .flow-rail-item').length);
  assert(q(c6.d, '#railFade').style.display !== 'none', '7 项仍显示渐隐提示');
  assert(txt(c6.d, '#resultCount').indexOf('我的任务 10 条') >= 0, '我的任务视图结果条 10 条，实际 ' + txt(c6.d, '#resultCount'));

  // ============ 7. 第二行 Tab 三态 + 任务守恒零回归 ============
  const c7 = await load('');
  const tabs = qa(c7.d, '#taskTabBar .task-tab');
  assert(tabs.length === 3, 'Tab 仍为 3 个');
  assert(qa(c7.d, '#taskTabBar .task-tab-badge').length === 3, 'Tab 徽标 3 个（合同/临时/我的任务）保留');
  assert(q(c7.d, '.task-tab.active') && q(c7.d, '.task-tab.active').getAttribute('data-tab') === 'contract', '默认选中合同任务 Tab');
  c7.w.eval("switchTaskTab('temp');");
  assert(q(c7.d, '.task-tab.active').getAttribute('data-tab') === 'temp', '切换到临时任务 Tab');
  assert(txt(c7.d, '#resultCount').indexOf('共 65') >= 0, '结果条跨 Tab 求和仍为 65，实际 ' + txt(c7.d, '#resultCount'));
  const tc = qa(c7.d, '#panelContract .task-item').length, tt = qa(c7.d, '#panelTemp .task-item').length;
  assert(tc === 56 && tt === 28, '任务守恒 56/28，实际 ' + tc + '/' + tt);

  console.log('\nRESULT ' + passN + '/' + (passN + failN) + (failN ? '  FAIL=' + failN : '  ALL PASS'));
  process.exit(failN ? 1 : 0);
})().catch(e => { console.log('FAIL: 运行异常 ' + e.message); process.exit(1); });
