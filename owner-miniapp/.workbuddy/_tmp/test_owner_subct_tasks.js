/* 业主端全部任务：子合同「归属任务清单」专项回归
   验收要点：6 份子合同按班组归属真实任务、默认收起/点开展开、计数由归属派生、
   未匹配班组（油漆涂饰）给出说明、任务总数 58 与徽标 35/23 零回归、筛选同步作用子任务行。 */
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const cfgSrc = fs.readFileSync('js/flow-config-store.js', 'utf-8');
let raw = fs.readFileSync('task-list.html', 'utf-8');
raw = raw.replace('<script src="js/flow-config-store.js"></script>', '<script>' + cfgSrc + '</script>')
         .replace('<script src="../shared/doc-viewer/doc-viewer.js"></script>', '');
const vc = new VirtualConsole();
const errs = [];
vc.on('jsdomError', e => errs.push(e.message));
const dom = new JSDOM(raw, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://example.com/task-list.html', virtualConsole: vc });
dom.window.addEventListener('load', run);
setTimeout(run, 400);
let done = false, pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; } else { fail++; console.log('  FAIL: ' + m); } }
function run() {
  if (done) return; done = true;
  try { body(); } catch (e) { console.log('THROW: ' + (e && e.stack || e)); fail++; }
  console.log('\njsdom errors: ' + (errs.length ? errs.slice(0, 3).join(' | ') : 'none'));
  console.log('RESULT: ' + pass + ' passed, ' + fail + ' failed');
  process.exitCode = fail ? 1 : 0;
}
function body() {
  const w = dom.window, d = w.document;
  const pc = d.getElementById('panelContract'), pt = d.getElementById('panelTemp');
  const sg = pc.querySelector('.flow-group[data-flow-id="sg"]');
  const row = id => sg.querySelector('.subct-row[data-sub-id="' + id + '"]');
  const bodyOf = id => {
    let c = row(id).firstElementChild;
    while (c) { if (c.classList && c.classList.contains('subct-body')) return c; c = c.nextElementSibling; }
    return null;
  };
  const tasksOf = id => Array.from(bodyOf(id).querySelectorAll('.subct-task'));

  // 1) 子合同树结构
  ok(sg.querySelectorAll('.subct-row').length === 6, 'sg 6 份子合同 (实际 ' + sg.querySelectorAll('.subct-row').length + ')');
  ok(row('water') && row('strong') && row('weak') && row('tile') && row('wood') && row('demo'), '6 个子合同 id 齐全');

  // 2) 默认收起
  ok(sg.querySelectorAll('.subct-body.show').length === 0, '子合同任务清单默认收起');
  ok(sg.querySelectorAll('.subct-task').length === 20, '归属任务行共 20 条 (实际 ' + sg.querySelectorAll('.subct-task').length + ')');

  // 3) 按班组归属
  const demo = tasksOf('demo').map(x => x.querySelector('.task-name').textContent);
  ok(demo.length === 3 && demo.indexOf('墙体拆除与建筑垃圾清运') >= 0, '拆除班组 3 条含墙体拆除');
  ok(row('demo').textContent.indexOf('任务 3/3') >= 0, '拆除班组 任务 3/3');
  const tile = tasksOf('tile').map(x => x.querySelector('.task-name').textContent);
  ok(tile.length === 7, '泥瓦班组 7 条（含砌墙/过梁跨班组任务）实际 ' + tile.length);
  ok(tile.indexOf('新建砌墙与植筋加固') >= 0 && tile.indexOf('墙地砖铺贴与地面找平') >= 0, '泥瓦班组含砌墙 + 铺贴');
  const water = tasksOf('water');
  ok(water.length === 4, '水电班组 4 条 实际 ' + water.length);
  ok(water.map(x => x.querySelector('.task-name').textContent).indexOf('冷热水管路铺设与打压测试') >= 0, '水电班组含冷热水管路');
  ok(row('water').textContent.indexOf('任务 1/4') >= 0, '水电班组 任务 1/4');
  const strong = tasksOf('strong'), weak = tasksOf('weak');
  ok(strong.length === 1 && strong[0].textContent.indexOf('强弱电开槽与弹线定位') >= 0, '强电 1 条=强弱电开槽');
  ok(weak.length === 1 && weak[0].textContent.indexOf('强弱电穿线与底盒安装') >= 0, '弱电 1 条=强弱电穿线');
  ok(tasksOf('wood').length === 4, '木作班组 4 条');
  ok(row('wood').textContent.indexOf('任务 0/4') >= 0, '木作班组 任务 0/4');

  // 4) 归属任务行携带状态/执行人/阶段
  const first = tasksOf('water')[0];
  ok((first.getAttribute('data-exec') || '').length > 0, '子任务行有 data-exec');
  ok(['completed', 'executing', 'pending'].indexOf(first.getAttribute('data-status')) >= 0, '子任务行有 data-status');
  ok(first.textContent.indexOf('水电隐蔽工程') >= 0, '子任务行标注所属阶段');

  // 5) 未匹配班组的说明（油漆涂饰 4 条）
  const note = sg.querySelector('.subct-note');
  ok(!!note, '存在未匹配班组说明');
  ok(note && note.textContent.indexOf('油漆涂饰与竣工收尾') >= 0 && note.textContent.indexOf('4 个任务') >= 0, '说明指向油漆涂饰 4 个任务（实际 ' + (note ? note.textContent.replace(/\s+/g, ' ') : '') + '）');
  ok(sg.textContent.indexOf('归属 20 个任务') >= 0, 'band 显示归属 20 个任务');

  // 6) 点开 / 收起
  const wMain = row('water').querySelector('.subct-main');
  w.window ? null : null;
  w.eval('toggleSubct(document.querySelector(\'.subct-row[data-sub-id="water"] .subct-main\'))');
  ok(row('water').querySelector('.subct-body').classList.contains('show'), '点开水电班组展开任务清单');
  ok(row('water').querySelector('.subct-arw').classList.contains('open'), '展开后箭头旋转态');
  w.eval('toggleSubct(document.querySelector(\'.subct-row[data-sub-id="water"] .subct-main\'))');
  ok(!row('water').querySelector('.subct-body').classList.contains('show'), '再次点击收起');

  // 7) 收起全部 / 展开全部
  w.eval('expandAllContracts()');
  ok(sg.querySelectorAll('.subct-body.show').length === 0, '点「收起全部」后子合同清单全部收起');
  w.eval('expandAllContracts()');
  ok(sg.querySelectorAll('.subct-body.show').length === 6, '点「展开全部」后子合同清单全部展开 (实际 ' + sg.querySelectorAll('.subct-body.show').length + ')');
  w.eval('expandAllContracts()');

  // 8) 计数零回归：只统计 .task-item
  const bc = d.getElementById('tabBadgeContract'), bt = d.getElementById('tabBadgeTemp');
  ok(bc && Number(bc.textContent) === 35, '合同徽标仍 35 (实际 ' + (bc ? bc.textContent : 'n/a') + ')');
  ok(bt && Number(bt.textContent) === 23, '临时徽标仍 23 (实际 ' + (bt ? bt.textContent : 'n/a') + ')');
  ok(pc.querySelectorAll('.task-item').length + pt.querySelectorAll('.task-item').length === 58, '总任务 58 守恒（子任务行不参与计数）');
  ok(sg.querySelectorAll('.task-item').length === 24, 'sg 主合同阶段任务仍 24');

  // 9) 筛选同步作用子任务行（已完成）
  w.selectStatus ? w.selectStatus('completed', '已完成', d.querySelector('.sf-chip[data-status="completed"]')) : null;
  const hiddenPending = Array.from(sg.querySelectorAll('.subct-task')).filter(x => x.style.display === 'none');
  const visCompleted = Array.from(sg.querySelectorAll('.subct-task')).filter(x => x.style.display !== 'none' && x.getAttribute('data-status') === 'completed');
  ok(hiddenPending.length > 0 && visCompleted.length > 0, '筛选「已完成」时子任务行同步过滤');
  ok(Array.from(sg.querySelectorAll('.subct-task')).every(x => x.style.display === 'none' || x.getAttribute('data-status') === 'completed'), '筛选后仅保留已完成子任务行');
  w.selectStatus && w.selectStatus('all', '全部状态', d.querySelector('.sf-chip[data-status="all"]'));

  // 10) 子任务行可跳任务详情
  const errBefore = errs.length;
  tasksOf('demo')[0].dispatchEvent(new w.Event('click', { bubbles: true }));
  ok(errs.length > errBefore && /navigation/i.test(errs[errs.length - 1]), '子任务行点击触发任务详情跳转');
}
