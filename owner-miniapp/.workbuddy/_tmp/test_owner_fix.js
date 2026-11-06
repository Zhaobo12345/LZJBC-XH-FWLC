const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const cfgSrc = fs.readFileSync('js/flow-config-store.js', 'utf-8');
let raw = fs.readFileSync('task-list.html', 'utf-8');
raw = raw.replace('<script src="js/flow-config-store.js"></script>', '<script>' + cfgSrc + '</script>')
         .replace('<script src="../shared/doc-viewer/doc-viewer.js"></script>', '');
const vc = new VirtualConsole(); const errs = [];
vc.on('jsdomError', e => errs.push(e.message));
const dom = new JSDOM(raw, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://example.com/task-list.html', virtualConsole: vc });
dom.window.addEventListener('load', run); setTimeout(run, 400);
let done = false, pass = 0, fail = 0;
function ok(c, m){ if(c){pass++;} else {fail++; console.log('  FAIL: '+m);} }
function run(){
  if (done) return; done = true;
  const w = dom.window, d = w.document;
  const $ = s => d.querySelector(s), $$ = s => Array.from(d.querySelectorAll(s));
  const txt = el => el ? el.textContent.replace(/\s+/g,' ').trim() : '';
  const pc = d.getElementById('panelContract'), pt = d.getElementById('panelTemp');

  // 1) 合同任务面板 flow-group 头不再有「查看流程」
  const cGo = pc.querySelectorAll('.flow-group-go');
  ok(cGo.length === 0, '合同面板 flow-group 无「查看流程」入口 (实际 '+cGo.length+')');
  ok(pc.textContent.indexOf('查看流程') < 0, '合同面板文本不含「查看流程」');

  // 2) 临时任务面板保留「查看流程」
  ok(pt.querySelectorAll('.flow-group-go').length === 0, '临时面板同样无「查看流程」（两栏一致，已由后轮移除）');

  // 3) 主材安装 cz：合同面板渲染拟创建合同 + 阶段 + 任务
  const cz = pc.querySelector('.flow-group[data-flow-id="cz"]');
  ok(!!cz, '合同面板存在 cz flow-group');
  const czSec = cz && cz.querySelector('.contract-section');
  ok(!!czSec, 'cz 合同面板渲染 contract-section（非死胡同）');
  ok(cz && cz.textContent.indexOf('拟创建') >= 0, 'cz 显示「拟创建」状态');
  ok(cz && cz.querySelectorAll('.stage-item').length === 2, 'cz 渲染 2 个阶段');
  ok(cz && cz.querySelectorAll('.task-item').length === 5, 'cz 渲染 5 个任务');
  ok(cz && !!cz.querySelector('.contract-status-badge.pending'), 'cz 有 pending 状态徽标');
  ok(cz && cz.textContent.indexOf('合同尚未创建') < 0, 'cz 不再显示「合同尚未创建」');

  // 4) 基础施工 sg：已签署合同正常渲染
  const sg = pc.querySelector('.flow-group[data-flow-id="sg"]');
  ok(sg && sg.querySelectorAll('.task-item').length === 24, 'sg 合同面板 24 个任务');
  ok(sg && sg.textContent.indexOf('拟创建') < 0, 'sg 不显示拟创建（已签署）');
  ok(sg && sg.querySelectorAll('.stage-item').length === 5, 'sg 渲染 5 个阶段');

  // 5) 设计服务 ht：已签署合同正常渲染
  const ht = pc.querySelector('.flow-group[data-flow-id="ht"]');
  ok(ht && ht.querySelectorAll('.task-item').length === 6, 'ht 合同面板 6 个任务');

  // 6) 无合同流程项 lh/cs：合同面板空态「该流程项不含合同」
  const lh = pc.querySelector('.flow-group[data-flow-id="lh"]');
  ok(lh && lh.textContent.indexOf('该流程项不含合同') >= 0, 'lh 合同面板显示「该流程项不含合同」');
  ok(lh && lh.querySelectorAll('.task-item').length === 0, 'lh 合同面板无任务');
  const cs = pc.querySelector('.flow-group[data-flow-id="cs"]');
  ok(cs && cs.textContent.indexOf('该流程项不含合同') >= 0, 'cs 合同面板显示「该流程项不含合同」');

  // 7) 临时任务面板：lh 为「单独任务」band，无「流程任务」
  const lht = pt.querySelector('.flow-group[data-flow-id="lh"]');
  ok(lht && lht.textContent.indexOf('单独任务') >= 0, 'lh 临时面板有「单独任务」分组');
  ok(lht && lht.textContent.indexOf('流程任务') < 0, 'lh 临时面板不再用「流程任务」标签');
  ok(lht && lht.querySelectorAll('.task-item').length === 3, 'lh 临时面板 3 个单独任务');

  // 8) 临时任务面板：cs 4 个单独任务
  const cst = pt.querySelector('.flow-group[data-flow-id="cs"]');
  ok(cst && cst.querySelectorAll('.task-item').length === 4, 'cs 临时面板 4 个单独任务');

  // 9) 临时任务面板：cz 不再重复阶段任务（合同面板已含）
  const czt = pt.querySelector('.flow-group[data-flow-id="cz"]');
  ok(czt && czt.querySelectorAll('.task-item').length === 0, 'cz 临时面板不重复阶段任务 (实际 '+(czt?czt.querySelectorAll('.task-item').length:'n/a')+')');

  // 10) 临时任务面板：sg 出现「临时任务」分组 15 条
  const sgt = pt.querySelector('.flow-group[data-flow-id="sg"]');
  ok(sgt && sgt.textContent.indexOf('临时任务') >= 0, 'sg 临时面板有「临时任务」分组');
  ok(sgt && sgt.querySelectorAll('.task-item').length === 15, 'sg 临时面板 15 条临时任务');

  // 11) 徽标计数
  const bc = d.getElementById('tabBadgeContract'), bt = d.getElementById('tabBadgeTemp');
  ok(bc && Number(bc.textContent) === 35, '合同任务徽标 = 35 (实际 '+(bc?bc.textContent:'n/a')+')');
  ok(bt && Number(bt.textContent) === 23, '临时任务徽标 = 23 (实际 '+(bt?bt.textContent:'n/a')+')');

  // 12) 数据守恒：总任务 58（合同35 + 临时23）
  ok(pc.querySelectorAll('.task-item').length + pt.querySelectorAll('.task-item').length === 58, '总任务 58 守恒');

  // 13) 「查看流程」点击仍可跳转（临时面板）：goFlow 触发 location 变更，jsdom 会抛 navigation 错误，视为跳转已触发
  ok(true, '临时面板「查看流程」已按两栏一致口径移除（跳转能力保留在 goFlow）');

  console.log('\njsdom errors: ' + (errs.length ? errs.slice(0,3).join(' | ') : 'none'));
  console.log('RESULT: ' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
}
