/* 方案 A 专项：视觉归位（工具条 / 底部筛选面板 / 导航卡）+ 4 个死函数清理。
   验收要点：不缺项、筛选口径零改动、Tab/折叠/URL/我的任务视图零回归。 */
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
const has = (o, s) => !!q(o, s);
const rc = d => txt(d, '#resultCount');
const cnt = (d, panel, fid) => qa(d, panel + ' .flow-group[data-flow-id="' + fid + '"] .task-item').length;
let pass = 0, fail = 0;
function assert(c, m) { if (c) pass++; else { fail++; console.log('FAIL: ' + m); } }

(async function run() {
  // ============ 1. 普通访问：无运行时错误 + 6 行归位为 2 行 ============
  const { d, w, errs } = await load('');
  assert(errs.length === 0, 'jsdom 无运行时错误：' + errs.join(' | '));
  const pc = q(d, '.page-content');
  assert(has(pc, ':scope > .tool-bar.search-filter-bar'), '工具条为 page-content 直接子级');
  assert(has(pc, ':scope > .nav-card'), '导航卡为 page-content 直接子级');
  assert(has(pc, ':scope > #taskContainer'), '任务容器仍为 page-content 直接子级');
  assert(!has(pc, ':scope > .quick-filter-bar'), '角色胶囊行不再占首屏一行');
  assert(!has(pc, ':scope > .filter-tags'), '已选标签行不再占首屏一行');
  assert(!has(pc, ':scope > .result-bar'), '结果条不再独立占一行');
  assert(has(q(d, '#navCard'), '#flowRail') && has(q(d, '#navCard'), '#taskTabBar'), 'rail + Tab 同属导航卡');
  assert(has(q(d, '#navCard'), '.result-bar'), '结果条并入导航卡卡脚');
  assert(!has(q(d, '#taskContainer'), '#flowRail') && !has(q(d, '#taskContainer'), '#taskTabBar'), 'rail/Tab 已移出任务容器');
  assert(has(d, '#toolBar #searchInput'), '搜索框在工具条内');
  assert(has(d, '#toolBar #filterBtn'), '筛选按钮在工具条内');
  assert(has(d, '#toolBar #filterBtnBadge'), '筛选按钮带条件数角标');
  assert(has(d, '#toolBar #toolChips'), '工具条带已选条件回显区');
  assert(q(d, '#filterBtnBadge').style.display === 'none', '初始角标隐藏');
  assert(!q(d, '#filterBtn').classList.contains('active'), '初始筛选按钮非激活');
  assert(txt(d, '#toolChips') === '', '初始无已选条件 chip');

  // ============ 2. 底部筛选面板：不缺项 ============
  assert(has(d, '#filterSheet') && has(d, '#filterSheetMask'), '面板与遮罩存在');
  assert(has(q(d, '#filterSheet'), '#roleFilterBar'), '角色胶囊搬入面板');
  assert(has(q(d, '#filterSheet'), '#statusDropdownMenu'), '状态项搬入面板');
  assert(has(q(d, '#filterSheet'), '#filterTags'), '已选条件标签搬入面板');
  assert(qa(d, '#roleFilterBar .quick-filter-btn[data-role]').length === 4, '4 个角色胶囊一项不少');
  assert(qa(d, '#statusDropdownMenu .status-dropdown-item[data-status]').length === 6, '6 个状态一项不少');
  assert(qa(d, '#taskTabBar .task-tab').length === 3, '3 个 Tab（含我的任务隐藏项）');
  assert(q(d, '#statusDropdownMenu').classList.contains('status-grid'), '状态为平铺网格');
  assert(!q(d, '#statusDropdownMenu').classList.contains('status-dropdown'), '不再使用下拉容器');
  assert(!has(d, '#statusSelectBtn'), '状态下拉触发按钮已移除');
  assert(has(d, '#toolBar #searchInput') && has(d, '#navCard .expand-all-btn'), '搜索与收起全部均保留');
  assert(has(q(d, '#filterSheet'), '.fs-reset') && has(q(d, '#filterSheet'), '.fs-done'), '重置 / 完成按钮保留');
  assert(txt(d, '.fs-head').indexOf('筛选条件') === 0, '面板标题');
  assert(rawHtml.indexOf('function toggleFilterDropdown(') < 0 && rawHtml.indexOf('function closeFilterDropdown(') < 0,
    '死函数 toggleFilterDropdown / closeFilterDropdown 已删');
  assert(rawHtml.indexOf('function quickFilter(') < 0 && rawHtml.indexOf('function toggleMultiOption(') < 0,
    '死函数 quickFilter / toggleMultiOption 已删');
  assert(rawHtml.indexOf('function toggleStatusDropdown(') < 0, '状态下拉函数已删（平铺后无引用）');
  assert(rawHtml.indexOf("!e.target.closest('.search-filter-bar')") < 0, 'document 点击关闭下拉监听已删');
  assert(rawHtml.indexOf("position = 'fixed'") < 0, '状态下拉 fixed 逃生定位已删');
  assert(typeof w.toggleFilterSheet === 'function' && typeof w.closeFilterSheet === 'function', '面板开合函数可用');
  assert(typeof w.resetAllFilters === 'function', '重置函数可用');
  assert(w.toggleFilterDropdown === undefined && w.quickFilter === undefined, '死函数未挂在 window');

  // ============ 3. 面板开合 ============
  assert(!q(d, '#filterSheet').classList.contains('show'), '初始面板收起');
  w.eval('toggleFilterSheet()');
  assert(q(d, '#filterSheet').classList.contains('show'), '点筛选按钮打开面板');
  assert(q(d, '#filterSheetMask').classList.contains('show'), '打开时遮罩显示');
  w.eval('toggleFilterSheet()');
  assert(!q(d, '#filterSheet').classList.contains('show') && !q(d, '#filterSheetMask').classList.contains('show'), '再点关闭');
  w.eval('toggleFilterSheet(); closeFilterSheet();');
  assert(!q(d, '#filterSheet').classList.contains('show'), 'closeFilterSheet 关闭');
  w.eval("toggleFilterSheet(); document.querySelector('.fs-close').click();");
  assert(!q(d, '#filterSheet').classList.contains('show'), '标题 × 关闭');
  w.eval("toggleFilterSheet(); document.querySelector('.fs-done').click();");
  assert(!q(d, '#filterSheet').classList.contains('show'), '完成按钮关闭');
  w.eval("toggleFilterSheet(); document.querySelector('#filterSheetMask').click();");
  assert(!q(d, '#filterSheet').classList.contains('show'), '点遮罩关闭');

  // ============ 4. 筛选功能等价：角色轴 ============
  w.eval("document.querySelector('#roleFilterBar [data-role=\"mine\"]').click();");
  assert(q(d, '#roleFilterBar [data-role="mine"]').classList.contains('active'), '我参与胶囊高亮');
  assert(q(d, '#filterBtn').classList.contains('active'), '有筛选条件时筛选按钮激活');
  assert(q(d, '#filterBtnBadge').style.display !== 'none' && txt(d, '#filterBtnBadge') === '1', '角标 = 1');
  assert(q(d, '#toolChips').style.display === 'flex', '工具条回显 chip 区显示');
  assert(qa(d, '#toolChips .tool-chip').length === 1, '1 个 chip');
  assert(txt(d, '#toolChips').indexOf('我参与') >= 0, 'chip 文案含「我参与」');
  assert(txt(d, '#filterTags').indexOf('我参与') >= 0, '面板内已选标签同步');
  assert(qa(d, '#toolChips .tool-chip .remove').length === 1, 'chip 带 × 清除');
  w.eval("document.querySelector('#toolChips .tool-chip .remove').click();");
  assert(!q(d, '#filterBtn').classList.contains('active'), '× 清除后筛选按钮复位');
  assert(q(d, '#filterBtnBadge').style.display === 'none', '× 清除后角标隐藏');
  assert(q(d, '#toolChips').style.display === 'none', '× 清除后 chip 区隐藏');
  assert(q(d, '#roleFilterBar [data-role="all"]').classList.contains('active'), '× 清除后回到「全部」');

  // ============ 5. 筛选功能等价：状态轴平铺 ============
  w.eval("selectStatus('completed', '已完成', document.querySelector('#statusDropdownMenu [data-status=\"completed\"]'));");
  assert(q(d, '#statusDropdownMenu [data-status="completed"]').classList.contains('active'), '状态项高亮');
  assert(qa(d, '#statusDropdownMenu .status-dropdown-item.active').length === 1, '状态单一选中');
  assert(txt(d, '#filterBtnBadge') === '1' && txt(d, '#toolChips').indexOf('已完成') >= 0, '状态条件回显 chip 与角标');
  w.eval("resetAllFilters();");
  assert(q(d, '#statusDropdownMenu [data-status="all"]').classList.contains('active'), '重置后状态回到全部状态');
  assert(q(d, '#roleFilterBar [data-role="all"]').classList.contains('active'), '重置后角色回到全部');
  assert(q(d, '#filterBtnBadge').style.display === 'none' && q(d, '#toolChips').style.display === 'none', '重置清空回显');
  assert(txt(d, '#filterTags') === '' || q(d, '#filterTags').style.display === 'none', '重置清空已选标签');
  assert(q(d, '#searchInput').value === '', '重置清空搜索框');
  assert(rc(d) === '共 65 个任务', '重置后结果条恢复 65');

  // ============ 6. 搜索仍可用 ============
  w.eval("document.getElementById('searchInput').value = '巡检'; filterTasks();");
  assert(rc(d) === '共 2 个任务', '搜索「巡检」结果条 = 2（实际 ' + rc(d) + '）');
  w.eval("document.getElementById('searchInput').value = ''; filterTasks();");
  assert(rc(d) === '共 65 个任务', '清空搜索恢复 65');

  // ============ 7. Tab / rail / 折叠 / 统计零回归 ============
  assert(qa(d, '#flowRail .flow-rail-item').length === 6, 'rail 6 个流程项');
  assert(txt(d, '#tabBadgeContract') === '50' && txt(d, '#tabBadgeTemp') === '15', '徽标 50 / 15');
  assert(txt(d, '.task-tab[data-tab="contract"]').indexOf('合同任务') === 0, 'Tab 文案「合同任务」');
  assert(txt(d, '.task-tab[data-tab="temp"]').indexOf('临时任务') === 0, 'Tab 文案「临时任务」');
  w.eval("switchTaskTab('temp');");
  assert(q(d, '#panelTemp').classList.contains('is-active') && !q(d, '#panelContract').classList.contains('is-active'), 'Tab 真互斥');
  assert(rc(d) === '共 65 个任务', '切 Tab 结果条不变（跨 Tab 求和）');
  w.eval("switchTaskTab('contract');");
  const before = qa(d, '.task-panel .task-list.show').length;
  assert(before > 0, '初始存在展开的任务列表');
  w.eval("expandAllContracts();");
  assert(qa(d, '.task-panel .task-list.show').length === 0, '收起全部生效');
  assert(txt(d, '.expand-all-btn') === '展开全部', '按钮文案切换为展开全部');
  w.eval("expandAllContracts();");
  assert(qa(d, '.task-panel .task-list.show').length === before, '展开全部生效');
  assert(cnt(d, '#panelContract', 'sg') === 50 && cnt(d, '#panelTemp', 'sg') === 15, 'sg 任务 50 / 15 不变');
  const allC = qa(d, '#panelContract .task-item').length, allT = qa(d, '#panelTemp .task-item').length;
  assert(allC === 56 && allT === 28 && allC + allT === 84, '任务守恒 56 / 28 / 84（实际 %d/%d）'.replace('%d/%d', allC + '/' + allT));
  const expect = { lh: [0, 3], cs: [0, 4], ht: [6, 1], sg: [50, 15], cz: [0, 5], sh: [0, 0] };
  for (const fid of Object.keys(expect)) {
    w.eval("selectFlow('" + fid + "'); switchTaskTab('contract');");
    const sum = expect[fid][0] + expect[fid][1];
    assert(rc(d) === '共 ' + sum + ' 个任务', fid + ' 结果条 = ' + sum + '（实际 ' + rc(d) + '）');
    assert(cnt(d, '#panelContract', fid) === expect[fid][0] && cnt(d, '#panelTemp', fid) === expect[fid][1],
      fid + ' 归属 ' + expect[fid].join('/'));
  }
  w.eval("selectFlow('sg'); switchTaskTab('contract');");

  // ============ 8. URL 参数：level / role / mine 仍生效 ============
  const r1 = await load('?level=水电工作组');
  assert(r1.errs.length === 0, '?level 无运行时错误');
  assert(r1.w.eval('currentFilters.level') === '水电工作组', '?level 写入 currentFilters');
  assert(txt(r1.d, '#filterBtnBadge') === '1', '?level 角标回显 1');
  const r2 = await load('?role=exec');
  assert(r2.errs.length === 0, '?role=exec 无运行时错误');
  assert(has(r2.d, '#roleFilterBar [data-role="exec"].active'), '?role=exec 胶囊高亮');
  assert(txt(r2.d, '#toolChips').indexOf('待我执行') >= 0, '?role=exec chip 回显');
  const r3 = await load('?mine=1');
  assert(has(r3.d, '#roleFilterBar [data-role="mine"].active'), '?mine=1 胶囊高亮');

  // ============ 9. 我的任务视图（scope=mytasks）零回归 ============
  const m = await load('?scope=mytasks&role=nonworker');
  assert(m.errs.length === 0, '我的任务视图无运行时错误：' + m.errs.join(' | '));
  assert(txt(m.d, '#resultCount') === '我的任务 10 条', '汇总 10 条');
  assert(q(m.d, '#flowRail').style.display !== 'none', '我的任务视图 rail 常驻');
  assert(qa(m.d, '#flowRail .flow-rail-item').length === 7, 'rail 6 项 + 全部流程项');
  assert(q(m.d, '.expand-all-btn').style.display === 'none', '收起全部仍隐藏');
  assert(has(m.d, '#navCard #flowRail'), '我的任务视图 rail 也在导航卡内');
  const mf = await load('?scope=mytasks&role=nonworker&flow=sg');
  assert(txt(mf.d, '#resultCount') === '我的任务 8 条', 'flow=sg 8 条');
  const ml = await load('?scope=mytasks&role=nonworker&flow=lh');
  assert(txt(ml.d, '#resultCount') === '我的任务 0 条', 'flow=lh 空作用域 0 条');
  assert(has(ml.d, '.mt-back'), '空态带返回汇总按钮');

  // ============ 10. 配置驱动仍生效 ============
  const c = await load('');
  const cfg2 = [{ id: 'sg', name: '基础施工（改名）', status: '进行中' }, { id: 'lh', name: '量房', status: '已完成' }];
  c.w.eval("localStorage.setItem('lzj_flow_cfg_v1', JSON.stringify(" + JSON.stringify(cfg2) + ")); applyFlowCfg(cfgList());");
  assert(qa(c.d, '#flowRail .flow-rail-item').length === 2, '配置 2 项 -> rail 2 项');
  assert(txt(c.d, '#flowRail .flow-rail-item[data-flow-id="sg"]') === '基础施工（改名）', 'rail 名称跟随配置');
  assert(has(c.d, '#navCard #flowRail'), '配置变更后 rail 仍在导航卡内');

  console.log('==== RESULT: ' + pass + ' PASS / ' + fail + ' FAIL ====');
  process.exit(fail ? 1 : 0);
})();
