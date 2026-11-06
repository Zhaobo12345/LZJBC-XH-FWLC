const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');

let html = fs.readFileSync('task-list.html', 'utf-8');
const backup = fs.readFileSync('.workbuddy/_tmp/task-list.bak-20261105-hierarchy-fix.bak', 'utf-8');
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
function g(panel, fid) { return q(panel + ' .flow-group[data-flow-id="' + fid + '"]'); }
function namesOf(sel) {
  return qa(sel + ' .task-name').map(x => x.textContent.trim());
}
function count(panel, fid) {
  const x = g(panel, fid);
  return x ? x.querySelectorAll('.task-item').length : -1;
}

function run() {
  // ---------- 默认态 ----------
  assert(qa('#flowRail .flow-rail-item').length === 6, 'rail 默认 6 项');
  assert(q('#flowRail .flow-rail-item.active').getAttribute('data-flow-id') === 'sg', '默认选中 sg');
  assert(q('#panelContract').classList.contains('is-active'), '默认合同 Tab');
  assert(!q('#panelTemp').classList.contains('is-active'), '默认临时 Tab 隐藏');

  // ---------- 1. 主合同自身阶段任务（sg） ----------
  const sgC = g('#panelContract', 'sg');
  const mcSg = sgC && sgC.querySelector('.main-contract[data-contract="base-sg"]');
  assert(!!mcSg, 'sg 主合同仍存在');
  const ownSg = mcSg && mcSg.querySelector('.mc-own');
  assert(!!ownSg, 'sg 主合同自身阶段任务区 .mc-own 已补齐');
  assert(ownSg && ownSg.querySelectorAll('.stage-item').length === 5, 'sg 主合同自身 5 个阶段，实际 ' + (ownSg && ownSg.querySelectorAll('.stage-item').length));
  assert(ownSg && ownSg.querySelectorAll('.task-item').length === 24, 'sg 主合同自身 24 条任务，实际 ' + (ownSg && ownSg.querySelectorAll('.task-item').length));
  assert(ownSg && /主合同阶段任务/.test(ownSg.querySelector('.mc-own-band').textContent), '主合同阶段任务 band 文案');
  assert(ownSg && /5 阶段 · 24 任务/.test(ownSg.querySelector('.mc-own-band').textContent), '主合同 band 计数 5 阶段 24 任务');
  const ownNames = ownSg ? namesOf('.mc-own') : [];
  assert(ownNames.indexOf('现场放线与三方交底') >= 0, '主合同阶段任务含「现场放线与三方交底」');
  assert(ownNames.indexOf('开荒保洁与竣工初验') >= 0, '主合同阶段任务含「开荒保洁与竣工初验」');
  assert(mcSg && mcSg.querySelector('.mc-own').nextElementSibling.classList.contains('mc-sub-band'), '主合同区与子合同区同级分层');

  // ---------- 2. 子合同阶段任务保留（sg） ----------
  const childrenSg = mcSg && mcSg.querySelector('.mc-children');
  assert(!!childrenSg, 'sg 子合同容器保留');
  assert(childrenSg && childrenSg.querySelectorAll('.contract-section').length === 4, 'sg 4 张工种子合同保留，实际 ' + (childrenSg && childrenSg.querySelectorAll('.contract-section').length));
  assert(childrenSg && childrenSg.querySelectorAll('.task-item').length === 26, 'sg 子合同 26 条任务保留，实际 ' + (childrenSg && childrenSg.querySelectorAll('.task-item').length));
  assert(childrenSg && childrenSg.querySelectorAll('.stage-item').length === 8, 'sg 子合同 8 阶段保留（水电4/泥瓦2/木工1/油漆1），实际 ' + (childrenSg && childrenSg.querySelectorAll('.stage-item').length));
  const hydro = childrenSg && childrenSg.querySelector('.contract-section[data-contract="contract-1"]');
  assert(hydro && hydro.querySelectorAll('.task-item').length === 17, '水电班组服务合同 17 条阶段任务保留');
  assert(hydro && /材料进场阶段/.test(hydro.textContent), '水电合同仍有「材料进场阶段」');
  assert(mcSg && /4 份子合同/.test(mcSg.querySelector('.mc-sub-band').textContent), '子合同区标注 4 份子合同');

  // ---------- 3. ht 去重 ----------
  const htC = g('#panelContract', 'ht');
  const mcHt = htC && htC.querySelector('.main-contract[data-contract="base-ht"]');
  assert(!!mcHt, 'ht 主合同存在');
  assert(!(htC && htC.querySelector('.contract-section[data-contract="contract-design"]')), 'ht 重复的「设计服务合同」子合同卡已去重');
  assert(htC && htC.querySelectorAll('.contract-section').length === 0, 'ht 无子合同层');
  const ownHt = mcHt && mcHt.querySelector('.mc-own');
  assert(!!ownHt, 'ht 主合同自身阶段任务区存在');
  assert(ownHt && ownHt.querySelectorAll('.stage-item').length === 2, 'ht 主合同 2 阶段');
  assert(ownHt && ownHt.querySelectorAll('.task-item').length === 6, 'ht 主合同 6 条任务（原节点上提，不丢）');
  const htNames = ownHt ? namesOf('#panelContract .flow-group[data-flow-id="ht"] .mc-own') : [];
  assert(htNames.indexOf('原始量房尺寸复测') >= 0 && htNames.indexOf('节点大样图') >= 0, 'ht 原 6 条任务名逐字保留');
  assert(!(mcHt && mcHt.querySelector('.mc-sub-band')), 'ht 无「子合同任务」分层带（去重后不显示）');
  const htContractNameCount = qa('#panelContract .flow-group[data-flow-id="ht"] .mc-name, #panelContract .flow-group[data-flow-id="ht"] .contract-name')
    .filter(x => x.textContent.trim() === '设计服务合同').length;
  assert(htContractNameCount === 1, '「设计服务合同」名称只出现 1 次（去重），实际 ' + htContractNameCount);

  // ---------- 4. 临时任务：阶段卡 + 无阶段单独任务 ----------
  const sgT = g('#panelTemp', 'sg');
  const cards = sgT ? qa('#panelTemp .flow-group[data-flow-id="sg"] .temp-stage-card') : [];
  assert(cards.length === 3, 'sg 临时任务 3 个阶段卡，实际 ' + cards.length);
  const cardCounts = cards.map(c => c.querySelectorAll('.task-item').length).join(',');
  assert(cardCounts === '2,8,2', 'sg 临时阶段任务分布 2/8/2，实际 ' + cardCounts);
  const looseSg = sgT && sgT.querySelector('.temp-loose');
  assert(!!looseSg, 'sg 无阶段单独任务区存在');
  assert(looseSg && looseSg.querySelectorAll('.task-item').length === 3, 'sg 无阶段单独任务 3 条');
  assert(looseSg && /无阶段单独任务/.test(looseSg.querySelector('.temp-loose-band').textContent), '无阶段单独任务 band 文案');
  const looseNames = looseSg ? Array.prototype.slice.call(looseSg.querySelectorAll('.task-name')).map(x => x.textContent.trim()) : [];
  assert(looseNames.indexOf('工地巡检') >= 0 && looseNames.indexOf('成品保护巡查') >= 0 && looseNames.indexOf('工地安全用电检查') >= 0, '3 条日常巡检作为无阶段单独任务');
  assert(sgT && sgT.querySelectorAll('.task-item').length === 15, 'sg 临时任务 15 条守恒');
  const htT = g('#panelTemp', 'ht');
  assert(htT && htT.querySelectorAll('.temp-stage-card').length === 0, 'ht 临时任务无阶段卡');
  assert(htT && htT.querySelectorAll('.temp-loose .task-item').length === 1, 'ht「设计交底」为无阶段单独任务');
  assert(htT && htT.querySelectorAll('.task-item').length === 1, 'ht 临时任务 1 条守恒');

  // ---------- 5. 冗余头行已删除（用户要求：面板内不再重复展示） ----------
  assert(qa('.task-panel .flow-group-head').length === 0, '流程项头行「基础施工服务 共N条」已删除');
  assert(qa('#panelContract .block-band').length === 0, '合同面板「合同层级」band 已删除');
  assert(qa('#panelTemp .temp-band').length === 0, '临时面板「阶段任务/单独任务 N」band 已删除');
  assert(!/合同层级/.test(q('#taskContainer').textContent), '面板正文不再出现「合同层级」');
  assert(!/共 \d+ 条/.test(q('#taskContainer').textContent), '面板正文不再出现「共 N 条」');

  // ---------- 6. 计数 ----------
  assert(q('#tabBadgeContract').textContent === '50', 'sg 合同 Tab 徽标 = 24 主合同 + 26 子合同 = 50，实际 ' + q('#tabBadgeContract').textContent);
  assert(q('#tabBadgeTemp').textContent === '15', 'sg 临时 Tab 徽标 15，实际 ' + q('#tabBadgeTemp').textContent);
  assert(/共 65 个任务/.test(q('#resultCount').textContent), '默认结果计数 65，实际 ' + q('#resultCount').textContent);
  assert(count('#panelContract', 'ht') === 6, 'ht 合同任务 6 条（去重后不翻倍）');
  assert(count('#panelTemp', 'ht') === 1, 'ht 临时任务 1 条');

  // ---------- 7. 原 48 条任务名逐字守恒 ----------
  const backupNames = (backup.match(/<div class="task-name">([^<]+)<\/div>/g) || [])
    .map(x => x.replace(/^<div class="task-name">/, '').replace(/<\/div>$/, '').trim())
    .filter(n => n && n.indexOf("'") === -1 && n.indexOf('+') === -1);
  const curNames = qa('.task-panel .task-name').map(x => x.textContent.trim());
  const missing = backupNames.filter(n => curNames.indexOf(n) === -1);
  assert(missing.length === 0, '原任务名全部保留，缺失: ' + missing.join('|'));

  // ---------- 8. Tab 互斥 + 切 Tab 计数 ----------
  ev("switchTaskTab('temp')");
  assert(q('#panelTemp').classList.contains('is-active'), '切临时 Tab 生效');
  assert(!q('#panelContract').classList.contains('is-active'), '切临时后合同面板隐藏');
  assert(w.getComputedStyle(q('#panelContract')).display === 'none', '合同面板 CSS display:none');
  assert(/共 65 个任务/.test(q('#resultCount').textContent), '临时 Tab 结果计数 65，实际 ' + q('#resultCount').textContent);
  assert(q('#tabBadgeContract').textContent === '50' && q('#tabBadgeTemp').textContent === '15', '切 Tab 不改徽标');
  ev("switchTaskTab('contract')");
  assert(/共 65 个任务/.test(q('#resultCount').textContent), '切回合同 Tab 结果计数 65');

  // ---------- 9. 折叠交互 ----------
  const th = q('#panelTemp .flow-group[data-flow-id="sg"] .temp-stage-head');
  const tbox = th && th.nextElementSibling;
  assert(tbox && tbox.classList.contains('show'), '临时阶段卡默认展开');
  ev("toggleTempStage(document.querySelector('#panelTemp .temp-stage-head'))");
  assert(!tbox.classList.contains('show'), 'toggleTempStage 可折叠');
  ev("toggleTempStage(document.querySelector('#panelTemp .temp-stage-head'))");
  assert(tbox.classList.contains('show'), 'toggleTempStage 可再展开');
  const sh = q('#panelContract .flow-group[data-flow-id="sg"] .mc-own .stage-header');
  const sbox = sh && sh.nextElementSibling;
  assert(sbox && sbox.classList.contains('show'), '主合同阶段任务默认展开');
  ev("toggleStage(document.querySelector('#panelContract .mc-own .stage-header'))");
  assert(!sbox.classList.contains('show'), '主合同阶段任务可折叠（复用 toggleStage）');
  ev("toggleStage(document.querySelector('#panelContract .mc-own .stage-header'))");

  // ---------- 10. 筛选穿透（搜索） ----------
  ev("document.getElementById('searchInput').value='巡检'; filterTasks();");
  assert(/共 2 个任务/.test(q('#resultCount').textContent), '合同 Tab 搜「巡检」跨 Tab 合计 2，实际 ' + q('#resultCount').textContent);
  ev("switchTaskTab('temp')");
  assert(/共 2 个任务/.test(q('#resultCount').textContent), '临时 Tab 搜「巡检」命中 2 条（工地巡检/竣工前全面巡检），实际 ' + q('#resultCount').textContent);
  const hiddenCards = qa('#panelTemp .flow-group[data-flow-id="sg"] .temp-stage-card').filter(c => c.style.display === 'none');
  assert(hiddenCards.length > 0, '无命中临时阶段卡筛选后收敛隐藏');
  ev("document.getElementById('searchInput').value=''; switchTaskTab('contract'); filterTasks();");

  // ---------- 11. rail 切换到 ht ----------
  ev("selectFlow('ht')");
  assert(q('#tabBadgeContract').textContent === '6', 'ht 合同徽标 6（去重），实际 ' + q('#tabBadgeContract').textContent);
  assert(q('#tabBadgeTemp').textContent === '1', 'ht 临时徽标 1');
  assert(/共 7 个任务/.test(q('#resultCount').textContent), 'ht 合同结果计数 7（6+1）');
  assert(q('#panelContract').querySelector('.flow-group.is-active').getAttribute('data-flow-id') === 'ht', '合同面板激活 ht');
  assert(q('#panelTemp').querySelector('.flow-group.is-active').getAttribute('data-flow-id') === 'ht', '临时面板激活 ht');
  ev("selectFlow('sg')");

  // ---------- 12. 无阶段流程项直铺（lh/cs） ----------
  ev("selectFlow('cs')");
  const csC = g('#panelTemp', 'cs');
  assert(csC && csC.querySelectorAll('.stage-item').length === 0, '初步设计无阶段卡');
  assert(csC && csC.querySelectorAll('.task-item').length === 4, '初步设计 4 条流程任务直铺');
  ev("selectFlow('sg')");

  // ---------- 13. 配置驱动：12 项 / 幂等 ----------
  ev("var _c=[]; for(var i=0;i<12;i++) _c.push({id:'x'+i,name:'流程'+i,hasContract:true,status:i===0?'进行中':'未开始'}); FlowCfgStore.save(_c); applyFlowCfg(cfgList());");
  assert(qa('#flowRail .flow-rail-item').length === 12, '配置 12 项 → rail 12 项');
  assert(qa('#panelContract .flow-group').length >= 12, '配置新增项生成对应合同面板分组');
  ev("restructureTaskHierarchy();");
  assert(qa('#panelContract .main-contract .mc-own').length === qa('#panelContract .main-contract').length, 'restructureTaskHierarchy 幂等（无重复 .mc-own）');
  const blocksWithTasks = qa('#panelTemp .temp-block').filter(b => b.querySelector('.task-item'));
  assert(blocksWithTasks.every(b => b.querySelectorAll('.temp-structured').length === 1), '每个含任务的临时区块有且仅有 1 个 .temp-structured（幂等）');
  ev("FlowCfgStore.reset(); applyFlowCfg(cfgList());");
  assert(qa('#flowRail .flow-rail-item').length === 6, '重置回 6 项');
  ev("selectFlow('sg')");

  // ---------- 14. 运行时无错误 ----------
  assert(jsErrors.length === 0, '运行时错误: ' + jsErrors.join(' | '));
}

setTimeout(function () {
  try { run(); } catch (e) { fail++; console.log('EXCEPTION: ' + (e && e.stack || e)); }
  console.log('\n==== hierarchy-fix: ' + pass + ' PASS / ' + fail + ' FAIL ====');
  process.exit(fail ? 1 : 0);
}, 120);
