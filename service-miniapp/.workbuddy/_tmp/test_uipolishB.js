/* 方案 B 专项：8 项纯 CSS 质感升级 + 3 类装饰节点（结果条数字 / 空态线性图标 / 面板 handle）。
   验收要点：文案逐字不变、空态三种路径均有图标、筛选/Tab/折叠/URL/我的任务作用域零回归。 */
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
const txt = (o, s) => { const e = q(o, s); return e ? e.textContent.trim() : ''; };
const has = (o, s) => !!q(o, s);
const rc = d => txt(d, '#resultCount');
const cnt = (d, panel, fid) => qa(d, panel + ' .flow-group[data-flow-id="' + fid + '"] .task-item').length;
let pass = 0, fail = 0;
function assert(c, m) { if (c) pass++; else { fail++; console.log('FAIL: ' + m); } }

(async function run() {
  // ============ 1. CSS 覆盖段：8 项规则与可回退边界 ============
  const css = (rawHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/g) || []).join('\n');
  assert(css.indexOf('/* ===== UI Polish B：纯 CSS 质感升级') >= 0 &&
         css.indexOf('/* ===== UI Polish B END ===== */') >= 0,
    'CSS 覆盖段有 START / END 边界（整段删除即可回退）');
  ['B1 圆角与描边统一', 'B2 选中态降饱和', 'B3 结果条', 'B4 任务行',
   'B5 阶段卡头', 'B6 空态', 'B7 筛选面板', 'B8 工具条'].forEach(k =>
    assert(css.indexOf(k) >= 0, 'CSS 覆盖项存在：' + k));
  assert(css.indexOf('.rc-num {') >= 0 && css.indexOf('font-size: 15px') >= 0, '结果条数字 15px 主色');
  assert(css.indexOf('.be-icon {') >= 0 && css.indexOf('.be-icon::before') >= 0, '空态线性图标由 CSS 绘制');
  assert(css.indexOf('.fs-handle {') >= 0, '面板 drag handle 样式');
  assert(css.indexOf('--st-color: #1890FF') >= 0 && css.indexOf('--st-color: #FAAD14') >= 0 &&
         css.indexOf('--st-color: #52C41A') >= 0, '3px 状态色条（执行中/确认中/已完成）');
  assert(css.indexOf('box-shadow: inset 0 -2px 0') >= 0, '选中态 2px 色条');
  assert(css.indexOf('min-height: 44px; line-height: 44px; border: none') >= 0, '空态 CTA 44px 实心');
  assert(css.indexOf('min-height: 32px') >= 0, '收起全部 32px 胶囊');
  assert(css.indexOf('display: none; }') >= 0 && css.indexOf('.empty-state .icon') >= 0, '全局空态旧 emoji 由 CSS 隐藏');
  assert(css.indexOf('.fs-section .quick-filter-btn.active::after') >= 0, '筛选面板选中项带勾');

  // ============ 2. 默认视图：装饰节点 + 文案逐字不变 ============
  const { d, w, errs } = await load('');
  assert(errs.length === 0, 'jsdom 无运行时错误：' + errs.join(' | '));
  assert(has(d, '#resultCount .rc-num'), '结果条数字 span 存在');
  assert(rc(d) === '共 65 个任务', '默认结果条文案逐字不变，实际 ' + rc(d));
  assert(txt(d, '#resultCount .rc-num') === '65', '数字节点 = 65');
  assert(q(d, '#resultCount .rc-num').tagName === 'B', '数字节点为 b 标签');
  assert(has(d, '#filterSheet .fs-handle'), '筛选面板 drag handle 存在');
  assert(qa(d, '#filterSheet .fs-handle').length === 1, 'handle 唯一');
  assert(has(d, '#emptyState .be-icon'), '全局空态线性图标存在');
  assert(has(d, '#emptyState .icon') && txt(d, '#emptyState .icon') === '📋', '旧 emoji 节点保留（DOM 零破坏）');
  assert(has(d, '#toolBar #searchInput') && has(d, '#navCard .expand-all-btn'), '工具条与收起全部保留');
  assert(qa(d, '#flowRail .flow-rail-item').length === 6, 'rail 6 项');
  assert(qa(d, '#roleFilterBar .quick-filter-btn[data-role]').length === 4, '4 胶囊');
  assert(qa(d, '#statusDropdownMenu .status-dropdown-item[data-status]').length === 6, '6 状态');
  assert(qa(d, '#taskTabBar .task-tab').length === 3, '3 Tab');

  // ============ 3. 结果条：跨 Tab 求和 + 数字节点同步 ============
  w.eval("switchTaskTab('temp')");
  assert(rc(d) === '共 65 个任务', '切临时 Tab 结果条不变，实际 ' + rc(d));
  assert(txt(d, '#resultCount .rc-num') === '65', '切 Tab 后数字节点仍 65');
  w.eval("selectFlow('lh')");
  assert(rc(d) === '共 3 个任务', '量房结果条 3，实际 ' + rc(d));
  assert(txt(d, '#resultCount .rc-num') === '3', '量房数字节点 3');
  assert(has(d, '#panelContract .flow-group[data-flow-id="lh"] .block-empty .be-icon'),
    '合同面板差异化空态带线性图标');
  assert(has(d, '#panelContract .flow-group[data-flow-id="lh"] .snapshot-empty-title'), '空态标题保留');
  w.eval("switchTaskTab('contract'); selectFlow('ht')");
  assert(rc(d) === '共 7 个任务', '设计服务结果条 7，实际 ' + rc(d));
  assert(txt(d, '#resultCount .rc-num') === '7', '设计服务数字节点 7');
  w.eval("selectFlow('sh')");
  assert(rc(d) === '共 0 个任务', '售后结果条 0');
  assert(txt(d, '#resultCount .rc-num') === '0', '售后数字节点 0');
  w.eval("switchTaskTab('temp')");
  assert(has(d, '#panelTemp .flow-group[data-flow-id="sh"] .block-empty .be-icon'),
    '非合同面板空态带线性图标');
  assert(txt(d, '#panelTemp .flow-group[data-flow-id="sh"] .block-empty').indexOf('暂无临时任务') >= 0,
    '非合同空态文案不变');
  w.eval("selectFlow('cz'); switchTaskTab('contract')");
  assert(rc(d) === '共 5 个任务', '主材安装结果条 5，实际 ' + rc(d));
  assert(has(d, '#panelContract .flow-group[data-flow-id="cz"] .snapshot-cta'), '拟定合同 CTA 保留');
  assert(txt(d, '#panelContract .flow-group[data-flow-id="cz"] .snapshot-cta').indexOf('去拟定合同') >= 0,
    '拟定合同 CTA 文案不变');

  // ============ 4. 筛选联动：数字节点随筛选更新 ============
  w.eval("selectFlow('sg'); switchTaskTab('contract')");
  const si = q(d, '#searchInput');
  si.value = '巡检'; si.dispatchEvent(new w.Event('input', { bubbles: true }));
  assert(rc(d) === '共 2 个任务', '搜索「巡检」结果条 2，实际 ' + rc(d));
  assert(txt(d, '#resultCount .rc-num') === '2', '搜索后数字节点 2');
  si.value = ''; si.dispatchEvent(new w.Event('input', { bubbles: true }));
  assert(rc(d) === '共 65 个任务', '清空搜索恢复 65');
  w.eval("selectStatus('completed','已完成', document.querySelector('#statusDropdownMenu [data-status=completed]'))");
  assert(/^共 \d+ 个任务$/.test(rc(d)), '状态筛选后结果条格式不变');
  assert(/^\d+$/.test(txt(d, '#resultCount .rc-num')), '状态筛选后数字节点为纯数字');
  w.eval("resetAllFilters()");
  assert(rc(d) === '共 65 个任务', '重置后恢复 65');

  // ============ 5. 任务守恒 / 折叠 / Tab 互斥 ============
  const tc = qa(d, '#panelContract .task-item').length;
  const tt = qa(d, '#panelTemp .task-item').length;
  assert(tc === 56 && tt === 28, '任务守恒 56/28，实际 ' + tc + '/' + tt);
  assert(tc + tt === 84, '总数 84 守恒');
  assert(q(d, '#panelContract').classList.contains('is-active') &&
         !q(d, '#panelTemp').classList.contains('is-active'), 'Tab 互斥（合同）');
  w.eval("switchTaskTab('temp')");
  assert(!q(d, '#panelContract').classList.contains('is-active') &&
         q(d, '#panelTemp').classList.contains('is-active'), 'Tab 互斥（临时）');
  w.eval("switchTaskTab('contract')");
  assert(has(d, '.mc-own-band .mc-own-toggle'), '主合同阶段任务行折叠控件保留');
  w.eval("toggleMainOwnStages(document.querySelector('.mc-own-band'))");
  assert(!q(d, '.mc-own-stages').classList.contains('show'), '主合同阶段可单独收起');
  w.eval("toggleMainOwnStages(document.querySelector('.mc-own-band'))");
  assert(q(d, '.mc-own-stages').classList.contains('show'), '主合同阶段可再展开');
  w.eval("expandAllContracts()"); w.eval("expandAllContracts()");
  assert(rc(d) === '共 65 个任务', '收起/展开全部后结果条不变');

  // ============ 6. 我的任务视图：数字节点 + 空态图标 ============
  const m1 = await load('?scope=mytasks&role=nonworker');
  assert(m1.errs.length === 0, 'mytasks 汇总无运行时错误');
  assert(rc(m1.d) === '我的任务 10 条', '汇总文案逐字不变，实际 ' + rc(m1.d));
  assert(txt(m1.d, '#resultCount .rc-num') === '10', '汇总数字节点 10');
  assert(qa(m1.d, '#flowRail .flow-rail-item').length === 7, 'rail 含「全部流程项」共 7 项');
  const m2 = await load('?scope=mytasks&role=nonworker&flow=sg');
  assert(rc(m2.d) === '我的任务 8 条', 'sg 作用域 8 条，实际 ' + rc(m2.d));
  assert(txt(m2.d, '#resultCount .rc-num') === '8', 'sg 数字节点 8');
  const m3 = await load('?scope=mytasks&role=nonworker&flow=lh');
  assert(rc(m3.d) === '我的任务 0 条', 'lh 空作用域 0 条');
  assert(txt(m3.d, '#resultCount .rc-num') === '0', 'lh 数字节点 0');
  assert(has(m3.d, '#panelMyTasks .block-empty .be-icon'), '我的任务空态带线性图标');
  assert(has(m3.d, '#panelMyTasks .mt-back'), '查看全部流程项按钮保留');
  const m4 = await load('?scope=mytasks&role=worker');
  assert(rc(m4.d) === '我的任务 8 条', '工人汇总 8 条，实际 ' + rc(m4.d));
  assert(txt(m4.d, '#resultCount .rc-num') === '8', '工人数字节点 8');

  // ============ 7. URL 参数 / 配置改名 ============
  const u1 = await load('?role=exec');
  assert(u1.errs.length === 0, 'URL role=exec 无错误');
  assert(has(u1.d, '#resultCount .rc-num'), 'URL 参数视图数字节点存在');
  assert(/^\d+$/.test(txt(u1.d, '#resultCount .rc-num')), 'URL 参数视图数字节点为纯数字');
  assert(has(u1.d, '#toolBar #toolChips .tool-chip'), 'URL 筛选回显 chip 保留');
  const u2 = await load('?level=' + encodeURIComponent('水电工作组'));
  assert(/^共 \d+ 个任务$/.test(rc(u2.d)), 'URL level 结果条格式不变');
  const c1 = await load('');
  const cfg2 = [{ id: 'sg', name: '基础施工（改名）', status: '进行中' }, { id: 'lh', name: '量房', status: '已完成' }];
  c1.w.eval("localStorage.setItem('lzj_flow_cfg_v1', JSON.stringify(" + JSON.stringify(cfg2) + ")); applyFlowCfg(cfgList());");
  assert(qa(c1.d, '#flowRail .flow-rail-item').length === 2, '配置驱动 2 项');
  assert(txt(c1.d, '#flowRail .flow-rail-item[data-flow-id="sg"]') === '基础施工（改名）', '配置改名生效');
  assert(has(c1.d, '#resultCount .rc-num'), '配置改名后数字节点仍在');

  console.log('==== RESULT: %d PASS / %d FAIL ====', pass, fail);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(1); });
