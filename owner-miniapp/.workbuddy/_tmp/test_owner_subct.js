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
  const pc = d.getElementById('panelContract'), pt = d.getElementById('panelTemp');

  // 1) both panels: no "view flow"
  ok(pc.querySelectorAll('.flow-group-go').length === 0, 'contract panel has no view-flow');
  ok(pt.querySelectorAll('.flow-group-go').length === 0, 'temp panel has no view-flow');
  ok(pc.textContent.indexOf('查看流程') < 0 && pt.textContent.indexOf('查看流程') < 0, 'no view-flow text either panel');

  // 2) cz planned contract
  const cz = pc.querySelector('.flow-group[data-flow-id="cz"]');
  ok(!!cz && !!cz.querySelector('.contract-section'), 'cz renders contract-section');
  ok(cz && cz.textContent.indexOf('拟创建') >= 0, 'cz shows planned');
  ok(cz && cz.querySelectorAll('.stage-item').length === 2 && cz.querySelectorAll('.task-item').length === 5, 'cz 2 stages 5 tasks');
  ok(cz && !!cz.querySelector('.contract-status-badge.pending'), 'cz pending badge');

  // 3) sg main + sub-contract tree
  const sg = pc.querySelector('.flow-group[data-flow-id="sg"]');
  ok(sg && sg.querySelectorAll('.task-item').length === 24, 'sg 24 contract tasks');
  const bands = Array.from(sg.querySelectorAll('.mc-band')).map(x=>x.textContent.replace(/\s+/g,' ').trim());
  ok(bands.some(t=>t.indexOf('主合同阶段任务')>=0), 'sg main-contract stage band');
  ok(bands.some(t=>t.indexOf('子合同任务')>=0 && t.indexOf('6 份子合同')>=0), 'sg sub-contract band 6');
  const subRows = sg.querySelectorAll('.subct-row');
  ok(subRows.length === 6, 'sg 6 sub-contract rows (got '+subRows.length+')');
  ok(sg.textContent.indexOf('水电班组服务合同')>=0 && sg.textContent.indexOf('泥瓦班组服务合同')>=0 && sg.textContent.indexOf('木作班组服务合同')>=0 && sg.textContent.indexOf('拆除班组服务合同')>=0, 'sub names present');
  ok(sg.textContent.indexOf('强电服务合同')>=0 && sg.textContent.indexOf('弱电服务合同')>=0, 'level-2 sub present');
  ok(sg.textContent.indexOf('甲方 陈庄（工长）')>=0 && sg.textContent.indexOf('乙方 赵六（水电工长）')>=0, 'party A/B association');
  ok(sg.textContent.indexOf('任务 3/3')>=0 && sg.textContent.indexOf('任务 1/4')>=0, 'sub task progress（归属任务派生计数）');
  const waterRow = Array.from(subRows).find(r=>r.querySelector('.subct-name') && r.querySelector('.subct-name').textContent.indexOf('水电班组服务合同')>=0);
  ok(waterRow && waterRow.querySelectorAll('.subct-children .subct-row').length === 2, 'strong/weak nested under water');

  // 4) ht no subs
  const ht = pc.querySelector('.flow-group[data-flow-id="ht"]');
  ok(ht && ht.querySelectorAll('.task-item').length === 6, 'ht 6 tasks');
  ok(ht && ht.querySelectorAll('.subct-row').length === 0, 'ht no subs');
  ok(ht && ht.textContent.indexOf('子合同任务') < 0, 'ht no sub band');

  // 5) lh/cs non-contract
  const lh = pc.querySelector('.flow-group[data-flow-id="lh"]');
  ok(lh && lh.textContent.indexOf('该流程项不含合同') >= 0 && lh.querySelectorAll('.task-item').length === 0, 'lh contract empty');
  const lht = pt.querySelector('.flow-group[data-flow-id="lh"]');
  ok(lht && lht.textContent.indexOf('单独任务') >= 0 && lht.querySelectorAll('.task-item').length === 3, 'lh 3 standalone');
  ok(lht && lht.textContent.indexOf('流程任务') < 0, 'lh no old flow-task label');
  const cst = pt.querySelector('.flow-group[data-flow-id="cs"]');
  ok(cst && cst.querySelectorAll('.task-item').length === 4, 'cs 4 standalone');

  // 6) cz no dup in temp; sg temp 15
  const czt = pt.querySelector('.flow-group[data-flow-id="cz"]');
  ok(czt && czt.querySelectorAll('.task-item').length === 0, 'cz no dup in temp');
  const sgt = pt.querySelector('.flow-group[data-flow-id="sg"]');
  ok(sgt && sgt.textContent.indexOf('临时任务') >= 0 && sgt.querySelectorAll('.task-item').length === 15, 'sg 15 temp');

  // 7) badges + conservation
  const bc = d.getElementById('tabBadgeContract'), bt = d.getElementById('tabBadgeTemp');
  ok(bc && Number(bc.textContent) === 35, 'contract badge 35 (got '+(bc?bc.textContent:'n/a')+')');
  ok(bt && Number(bt.textContent) === 23, 'temp badge 23 (got '+(bt?bt.textContent:'n/a')+')');
  ok(pc.querySelectorAll('.task-item').length + pt.querySelectorAll('.task-item').length === 58, 'total 58');

  console.log('\njsdom errors: ' + (errs.length ? errs.slice(0,3).join(' | ') : 'none'));
  console.log('RESULT: ' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
}
