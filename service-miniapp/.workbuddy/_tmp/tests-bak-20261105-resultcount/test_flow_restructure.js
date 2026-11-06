const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('task-list.html', 'utf-8');
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true });
const { window } = dom;
const d = window.document;

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.log('FAIL: ' + msg); }
}

function run() {
  // 1. 流程项卡数量
  const cards = d.querySelectorAll('.flow-item-card');
  assert(cards.length === 2, '应有 2 张流程项卡，实际 ' + cards.length);

  const sg = d.querySelector('.flow-item-card[data-flow="sg"]');
  const ht = d.querySelector('.flow-item-card[data-flow="ht"]');
  assert(!!sg, '存在 基础施工服务 流程项卡');
  assert(!!ht, '存在 设计服务 流程项卡');

  // 2. 每张卡含 合同内任务 + 临时任务 两个同级区块
  function checkCard(card, name, expectContracts, expectTemps) {
    const cb = card.querySelector(':scope > .flow-body > .contract-block');
    const tb = card.querySelector(':scope > .flow-body > .temp-block');
    assert(!!cb, name + ' 有 合同内任务 区块');
    assert(!!tb, name + ' 有 临时任务 区块');
    // 两者都是 flow-body 的直接子元素（同级）
    const body = card.querySelector(':scope > .flow-body');
    assert(cb && cb.parentElement === body, name + ' 合同内任务 与 临时任务 同级（均直接属于 flow-body）');
    assert(tb && tb.parentElement === body, name + ' 临时任务 同级校验');
    const mc = card.querySelector('.main-contract');
    assert(!!mc, name + ' 有 主合同');
    const subs = mc.querySelectorAll(':scope > .mc-children > .contract-section');
    assert(subs.length === expectContracts, name + ' 主合同下工种合同数=' + expectContracts + '，实际 ' + subs.length);
    const temps = tb.querySelectorAll('.task-item');
    assert(temps.length === expectTemps, name + ' 临时任务条目数=' + expectTemps + '，实际 ' + temps.length);
  }
  checkCard(sg, '基础施工服务', 4, 15);
  checkCard(ht, '设计服务', 1, 1);

  // 3. 结果计数（DOMContentLoaded 已重算）
  const rc = d.getElementById('resultCount').textContent;
  assert(/共 42 个任务/.test(rc), '结果计数应为 共 42 个任务，实际 ' + rc);

  // 4. 类型互斥：仅显临时任务
  window.eval('currentFilters.type="temp"; filterTasks();');
  const sgCb = sg.querySelector('.contract-block');
  const sgTb = sg.querySelector('.temp-block');
  assert(sgCb.style.display === 'none', '类型=临时任务 时 合同内任务 区块隐藏');
  assert(sgTb.style.display !== 'none', '类型=临时任务 时 临时任务 区块可见');
  window.eval('currentFilters.type="contract"; filterTasks();');
  assert(sgCb.style.display !== 'none', '类型=合同任务 时 合同内任务 区块可见');
  assert(sgTb.style.display === 'none', '类型=合同任务 时 临时任务 区块隐藏');
  window.eval('currentFilters.type="all"; filterTasks();');
  assert(sgCb.style.display !== 'none' && sgTb.style.display !== 'none', '类型=all 时 双区块都可见');

  // 5. 搜索穿透：搜「巡检」命中 2 条临时任务
  window.eval('document.getElementById("searchInput").value="巡检"; filterTasks();');
  const visibleTemps = Array.from(sg.querySelectorAll('.temp-block .task-item')).filter(t => t.style.display !== 'none');
  assert(visibleTemps.length === 2, '搜索「巡检」命中 2 条临时任务，实际 ' + visibleTemps.length);
  // 合同任务应被搜索过滤（不含「巡检」）
  const visibleContracts = Array.from(sg.querySelectorAll('.contract-block .task-item')).filter(t => t.style.display !== 'none');
  assert(visibleContracts.length === 0, '搜索「巡检」时合同任务应全部隐藏，实际可见 ' + visibleContracts.length);
  window.eval('document.getElementById("searchInput").value=""; filterTasks();');

  // 6. 折叠：toggleFlowItem 收起 body；toggleMainContract 收起子合同
  const sgBody = sg.querySelector(':scope > .flow-body');
  window.eval('toggleFlowItem(document.querySelector(".flow-item-card[data-flow=sg] > .flow-item-header"));');
  assert(!sgBody.classList.contains('show'), 'toggleFlowItem 收起 flow-body');
  window.eval('toggleFlowItem(document.querySelector(".flow-item-card[data-flow=sg] > .flow-item-header"));');
  assert(sgBody.classList.contains('show'), 'toggleFlowItem 再次展开 flow-body');
  const mcChildren = sg.querySelector('.main-contract > .mc-children');
  window.eval('toggleMainContract(document.querySelector(".flow-item-card[data-flow=sg] .main-contract > .mc-header"));');
  assert(!mcChildren.classList.contains('show'), 'toggleMainContract 收起 工种合同子列表');

  console.log('\\nPASS=' + pass + '  FAIL=' + fail);
  if (fail > 0) process.exit(1);
}

try {
  run();
} catch (e) {
  console.log('ERROR during test: ' + e.message);
  console.log(e.stack);
  process.exit(2);
}
