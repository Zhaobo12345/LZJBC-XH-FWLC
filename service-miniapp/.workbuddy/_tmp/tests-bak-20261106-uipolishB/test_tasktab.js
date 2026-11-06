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
const d = w.document;

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) pass++;
  else { fail++; console.log('FAIL: ' + msg); }
}
function q(sel) { return d.querySelector(sel); }
function qa(sel) { return Array.prototype.slice.call(d.querySelectorAll(sel)); }
function ev(code) { return w.eval(code); }
function count(panelSel, fid) {
  const g = q(panelSel + ' .flow-group[data-flow-id="' + fid + '"]');
  return g ? g.querySelectorAll('.task-item').length : -1;
}
function activeFlow(panelSel) {
  const g = q(panelSel + ' .flow-group.is-active');
  return g ? g.getAttribute('data-flow-id') : null;
}

function run() {
  // ---------- 默认态 ----------
  const rail = qa('#flowRail .flow-rail-item');
  assert(rail.length === 6, 'rail 默认 6 项，实际 ' + rail.length);
  assert(rail.map(x => x.getAttribute('data-flow-id')).join(',') === 'lh,cs,ht,sg,cz,sh', 'rail 顺序 = lh,cs,ht,sg,cz,sh');
  assert(q('#flowRail .flow-rail-item.active') && q('#flowRail .flow-rail-item.active').getAttribute('data-flow-id') === 'sg', '默认选中「进行中」= sg');

  // 普通访问：合同/临时两个可见切换 Tab；第三个「我的任务」Tab 为 ?scope=mytasks 专用且默认隐藏
  assert(qa('#taskTabBar .task-tab').filter(b => b.style.display !== 'none').length === 2, '两个可见切换 Tab');
  assert(q('#tabMyTasks') && q('#tabMyTasks').style.display === 'none', '我的任务 Tab 普通访问隐藏');
  assert(q('.task-tab[data-tab="contract"]').classList.contains('active'), '默认合同任务 Tab active');
  assert(!q('.task-tab[data-tab="temp"]').classList.contains('active'), '临时任务 Tab 默认未选');
  assert(q('#panelContract').classList.contains('is-active'), '#panelContract 默认显示');
  assert(!q('#panelTemp').classList.contains('is-active'), '#panelTemp 默认隐藏');
  assert(q('#panelContract').parentElement === q('#panelTemp').parentElement, '两面板同为 #taskContainer 直接子节点（同级）');
  assert(activeFlow('#panelContract') === 'sg', '合同面板当前流程项 = sg');
  assert(activeFlow('#panelTemp') === 'sg', '临时面板当前流程项 = sg');

  assert(qa('#taskContainer > .flow-item-card').length === 0, '旧流程项卡已被搬运并移除');
  assert(qa('#panelContract .task-item').length === 56, '合同面板 56 条（sg 50 + ht 6，无合同项已分流），实际 ' + qa('#panelContract .task-item').length);
  assert(qa('#panelContract .flow-group[data-flow-id="sg"] .task-item, #panelContract .flow-group[data-flow-id="ht"] .task-item').length === 56, 'sg/ht 合同任务 56 条（原 32 + 主合同自身 24）');
  assert(qa('#panelTemp .task-item').length === 28, '临时任务面板 28 条（原 16 + 分流 12），实际 ' + qa('#panelTemp .task-item').length);
  assert(count('#panelContract', 'sg') === 50, 'sg 合同任务 50 条（主合同 24 + 子合同 26）');
  assert(count('#panelTemp', 'sg') === 15, 'sg 临时任务 15 条');
  assert(count('#panelContract', 'ht') === 6, 'ht 合同任务 6 条');
  assert(count('#panelTemp', 'ht') === 1, 'ht 临时任务 1 条');
  assert(q('#tabBadgeContract').textContent === '50', '合同 Tab 徽标 50，实际 ' + q('#tabBadgeContract').textContent);
  assert(q('#tabBadgeTemp').textContent === '15', '临时 Tab 徽标 15，实际 ' + q('#tabBadgeTemp').textContent);
  assert(q('#resultCount').textContent === '共 65 个任务', '默认结果计数 65（合同 50 + 临时 15），实际 ' + q('#resultCount').textContent);
  assert(qa('#panelContract .flow-group[data-flow-id="sg"] .contract-section').length === 4, 'sg 主合同下 4 张工种子合同');
  assert(qa('#panelTemp .contract-section').length === 0, '临时面板无 .contract-section（不计入合同进度）');

  // ---------- Tab 切换：整块替换、另一类不再出现在下方 ----------
  const before = JSON.stringify(ev('currentFilters'));
  ev("switchTaskTab('temp')");
  assert(!q('#panelContract').classList.contains('is-active'), '切临时后合同面板隐藏');
  assert(q('#panelTemp').classList.contains('is-active'), '切临时后临时面板显示');
  assert(w.getComputedStyle(q('#panelContract')).display === 'none', 'CSS 真正让合同面板 display:none（不只是 class）');
  assert(w.getComputedStyle(q('#panelTemp')).display === 'block', 'CSS 真正让临时面板 display:block');
  assert(q('.task-tab[data-tab="temp"]').classList.contains('active'), '临时 Tab 高亮');
  assert(!q('.task-tab[data-tab="contract"]').classList.contains('active'), '合同 Tab 取消高亮');
  assert(q('#resultCount').textContent === '共 65 个任务', '临时 Tab 结果计数 65（跨 Tab 一致），实际 ' + q('#resultCount').textContent);
  assert(q('#tabBadgeContract').textContent === '50' && q('#tabBadgeTemp').textContent === '15', '切换后 Tab 徽标不变（导航容量）');
  assert(JSON.stringify(ev('currentFilters')) === before, 'Tab 切换不改 currentFilters');
  assert(q('#filterTags').style.display === 'none' || q('#filterTags').textContent.trim() === '', 'Tab 切换不产生 filter tag');
  // 合同任务节点仍在 DOM（保留数据），但所在面板不再显示 —— 不再作为「下方的第二类内容」出现
  assert(qa('#panelContract .flow-group[data-flow-id="sg"] .task-item, #panelContract .flow-group[data-flow-id="ht"] .task-item').length === 56, '合同任务节点仍保留 56 条（数据守恒，含主合同自身 24）');
  assert(q('#panelContract').nextElementSibling === q('#panelTemp'), '两面板相邻，无穿插区块');

  ev("switchTaskTab('contract')");
  assert(q('#resultCount').textContent === '共 65 个任务', '切回合同结果计数 65');
  assert(q('#panelContract').classList.contains('is-active') && !q('#panelTemp').classList.contains('is-active'), '切回后面板互换');

  // ---------- 筛选穿透（仅当前 Tab 面板） ----------
  q('#searchInput').value = '巡检';
  ev('filterTasks()');
  assert(q('#resultCount').textContent === '共 2 个任务', '合同面板搜「巡检」跨 Tab 合计 2，实际 ' + q('#resultCount').textContent);
  ev("switchTaskTab('temp')");
  assert(q('#resultCount').textContent === '共 2 个任务', '临时面板搜「巡检」跨 Tab 合计 2，实际 ' + q('#resultCount').textContent);
  q('#searchInput').value = '';
  ev("switchTaskTab('contract')");

  // role/status 双向对称互斥
  ev("applyPill('confirm', null)");
  ev("selectStatus('completed', '已完成', null)");
  assert(ev("currentFilters.role") === 'all', '选状态后复位角色轴（confirm -> all）');
  assert(ev("currentFilters.status") === 'completed', '状态轴保持 completed');
  ev("selectStatus('completed', '已完成', null)");
  ev("applyPill('confirm', null)");
  assert(ev("currentFilters.status") === 'all', '选角色后复位状态轴（completed -> all）');
  ev("applyPill('all', null)");
  ev('filterTasks()');
  assert(q('#resultCount').textContent === '共 65 个任务', '复位筛选后回到 65');

  // ---------- rail 切换 + 无阶段直铺 ----------
  ev("selectFlow('ht')");
  assert(activeFlow('#panelContract') === 'ht' && activeFlow('#panelTemp') === 'ht', 'rail 切 ht 后两面板同步');
  assert(q('#tabBadgeContract').textContent === '6' && q('#tabBadgeTemp').textContent === '1', 'ht 徽标 6/1');
  assert(q('#resultCount').textContent === '共 7 个任务', 'ht 合同结果计数 7（6+1），实际 ' + q('#resultCount').textContent);

  ev("selectFlow('lh')");
  assert(count('#panelContract', 'lh') === 0, '量房不含合同 → 合同面板无任务');
  assert(qa('#panelContract .flow-group[data-flow-id="lh"] .block-empty').length === 1, '量房合同面板给空态');
  assert(q('#panelContract .flow-group[data-flow-id="lh"] .snapshot-empty-title').textContent === '该流程项不含合同', '量房空态说明不含合同');
  assert(count('#panelTemp', 'lh') === 3, '量房 3 条流程任务直铺');
  assert(qa('#panelTemp .flow-group[data-flow-id="lh"] .stage-item').length === 0, '量房无阶段卡（无阶段直接展示任务）');
  assert(qa('#panelTemp .flow-group[data-flow-id="lh"] .temp-loose-list.show .task-item').length === 3, '量房任务在展开的无阶段单独任务区');
  ev("selectFlow('cs')");
  assert(count('#panelContract', 'cs') === 0, '初步设计不含合同 → 合同面板无任务');
  assert(count('#panelTemp', 'cs') === 4, '初步设计 4 条流程任务直铺');
  assert(qa('#panelTemp .flow-group[data-flow-id="cs"] .stage-item').length === 0, '初步设计无阶段卡');
  ev("selectFlow('cz')");
  assert(count('#panelContract', 'cz') === 0, '主材安装合同未创建 → 合同面板无任务');
  assert(q('#panelContract .flow-group[data-flow-id="cz"] .snapshot-empty-title').textContent === '合同尚未创建', '主材安装提示合同尚未创建');
  assert(qa('#panelContract .flow-group[data-flow-id="cz"] .snapshot-cta').length === 1, '主材安装给拟定合同入口');
  assert(count('#panelTemp', 'cz') === 5, '主材安装 5 条流程阶段任务');
  assert(qa('#panelTemp .flow-group[data-flow-id="cz"] .temp-stage-card').length === 2, '主材安装 2 个阶段卡');
  assert(qa('#panelTemp .flow-group[data-flow-id="cz"] .src-tag').length >= 2, '主材安装阶段标注「流程任务」来源');
  assert(qa('#panelContract .flow-group[data-flow-id="cz"] .contract-section').length === 0, 'cz 不建 .contract-section，不误算合同进度');
  ev("selectFlow('sh')");
  assert(qa('#panelContract .flow-group[data-flow-id="sh"] .block-empty').length === 1, '售后显示空态');
  ev("switchTaskTab('temp')");
  assert(qa('#panelTemp .flow-group.is-active .block-empty').length === 1, '售后临时面板显示「暂无临时任务」空态');
  ev("switchTaskTab('contract')");

  // SNAPSHOT 12 条守恒 + 原 48 条 + 主合同自身 24 条守恒
  assert(count('#panelTemp', 'lh') + count('#panelTemp', 'cs') + count('#panelTemp', 'cz') === 12, '快照 12 条（3+4+5）已分流至非合同面板');
  const legacyNames = qa('#panelContract .flow-group[data-flow-id="sg"] .task-name, #panelContract .flow-group[data-flow-id="ht"] .task-name, #panelTemp .task-name');
  assert(legacyNames.length === 84, '原有 48 + 主合同自身 24 + 快照 12 = 84 条任务名守恒，实际 ' + legacyNames.length);
  assert(legacyNames.every(x => x.textContent.trim().length > 0), '84 条任务名非空');

  // 扁平视图节点保留 + 游离项隐藏规则存在
  assert(qa('.flat-task-item').length === 21, '21 条 flat 节点保留');
  const css = qa('style').map(x => x.textContent).join('\n');
  assert(css.indexOf('#taskContainer > .flat-task-item { display: none !important; }') >= 0, '游离 flat 项隐藏规则存在');

  // ---------- 配置驱动专项 ----------
  const twelve = [];
  for (let i = 0; i < 12; i++) twelve.push({ id: 'f' + i, name: '流程' + i, hasContract: false, status: '未开始' });
  twelve[3].status = '进行中';
  w.localStorage.setItem('lzj_flow_cfg_v1', JSON.stringify(twelve));
  ev("applyFlowCfg(cfgList()); refresh();");
  assert(qa('#flowRail .flow-rail-item').length === 12, '配置 12 项 → rail 12 项，实际 ' + qa('#flowRail .flow-rail-item').length);
  assert(q('#flowRail .flow-rail-item[data-flow-id="f3"]').textContent === '流程3', '配置改名/新 id 生效');
  assert(activeFlow('#panelContract') === 'f3', '默认选中配置里「进行中」项 f3');
  assert(qa('#panelContract .flow-group[data-flow-id="f3"] .block-empty').length === 1, '新增配置项无明细 → 空态');

  w.localStorage.setItem('lzj_flow_cfg_v1', JSON.stringify([{ id: 'lh', name: '量房', hasContract: false, status: '已完成' }]));
  ev("applyFlowCfg(cfgList()); refresh();");
  assert(qa('#flowRail .flow-rail-item').length === 1, '配置 1 项 → rail 1 项');
  assert(activeFlow('#panelContract') === 'lh', '选中项被删后兜底到配置首项 lh');

  ev("window.dispatchEvent(new Event('pageshow'))");
  ev("window.dispatchEvent(new Event('pageshow'))");
  assert(qa('#flowRail .flow-rail-item').length === 1, 'pageshow 幂等，rail 不重复渲染');

  // 运行时错误
  assert(jsErrors.length === 0, '无 jsdom 运行时错误：' + jsErrors.join(' | '));

  console.log('\n==== task-tab jsdom: ' + pass + ' PASS / ' + fail + ' FAIL ====');
  if (jsErrors.length) console.log('jsErrors:', jsErrors);
  process.exit(fail ? 1 : 0);
}

setTimeout(run, 60);
