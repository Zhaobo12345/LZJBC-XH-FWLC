// -*- coding: utf-8 -*-
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');

const html = fs.readFileSync('task-list.html', 'utf8');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push('jsdomError: ' + (e.detail || e.message || e)));
vc.on('error', (...a) => errors.push('error: ' + a.join(' ')));

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  virtualConsole: vc,
  url: 'http://localhost/task-list.html'
});

function assert(cond, msg) {
  console.log((cond ? 'PASS' : 'FAIL') + ' - ' + msg);
  if (!cond) process.exitCode = 1;
}

dom.window.addEventListener('load', () => {
  setTimeout(() => {
    const d = dom.window.document;
    const top = d.getElementById('tempTasksTop');
    assert(!!top, '顶层临时任务区 #tempTasksTop 存在');
    const tempItems = d.querySelectorAll('#tempTasksTop .task-item[data-type="temp"]');
    assert(tempItems.length === 16, '#tempTasksTop 内临时任务条目 = 16 (实际 ' + tempItems.length + ')');
    const groups = d.querySelectorAll('#tempTasksTop .temp-flow-group');
    assert(groups.length === 2, '按服务流程项分组数 = 2 (实际 ' + groups.length + ')');
    // 关联合同标注
    const contractChips = d.querySelectorAll('#tempTasksTop .temp-flow-contract');
    assert(contractChips.length === 2, '合同型流程项标注关联合同 chip = 2 (实际 ' + contractChips.length + ')');
    assert(contractChips[0] && contractChips[0].textContent.indexOf('基础施工服务合同') >= 0, 'chip 文案含「基础施工服务合同」');

    // 初始计数（含临时任务）
    const rc = d.getElementById('resultCount').textContent;
    assert(rc.indexOf('42') >= 0, '初始结果计数含 42 个任务 (实际: ' + rc + ')');

    // 合同进度不应计入临时任务：临时任务不在合同区内
    const c1TempInContract = d.querySelectorAll('.contract-section[data-contract="contract-1"] .task-item[data-type="temp"]').length;
    assert(c1TempInContract === 0, '合同-1 内不含临时任务条目 (实际 ' + c1TempInContract + ')');
    const c1fill = d.querySelector('.contract-section[data-contract="contract-1"] .progress-text').textContent;
    assert(/已完成 \d+\/\d+/.test(c1fill), '合同-1 进度为合法 已完成 X/Y (实际: ' + c1fill + ')');
    assert(c1fill.indexOf('42') < 0, '合同-1 进度未混入 16 条临时任务 (实际: ' + c1fill + ')');

    // 类型筛选=临时任务：隐藏合同区，显示临时区
    dom.window.eval("currentFilters.type='temp'; filterTasks();");
    const contractShown = Array.from(d.querySelectorAll('.contract-section')).some(s => s.style.display !== 'none');
    const tempShown = top.style.display !== 'none';
    assert(!contractShown, 'type=temp 时合同区被隐藏');
    assert(tempShown, 'type=temp 时临时任务区可见');
    const rcTemp = d.getElementById('resultCount').textContent;
    assert(rcTemp.indexOf('16') >= 0, 'type=temp 结果计数=16 (实际: ' + rcTemp + ')');

    // 类型筛选=合同：隐藏临时区
    dom.window.eval("currentFilters.type='contract'; filterTasks();");
    const tempHidden = top.style.display === 'none';
    assert(tempHidden, 'type=contract 时临时任务区被隐藏');

    // 复位
    dom.window.eval("currentFilters.type='all'; filterTasks();");

    // 搜索筛选：搜「巡检」命中 2 条（工地巡检 / 竣工前全面巡检）
    dom.window.eval("document.getElementById('searchInput').value='巡检'; filterTasks();");
    const rcSearch = d.getElementById('resultCount').textContent;
    assert(/共 2 个/.test(rcSearch), '搜索「巡检」命中 2 (实际: ' + rcSearch + ')');
    dom.window.eval("document.getElementById('searchInput').value=''; filterTasks();");

    if (errors.length) {
      console.log('--- runtime errors ---');
      errors.forEach(e => console.log(e));
      process.exitCode = 1;
    } else {
      console.log('NO runtime errors captured.');
    }
  }, 200);
});
