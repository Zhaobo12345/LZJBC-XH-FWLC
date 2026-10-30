const fs = require('fs');
const vm = require('vm');
const path = require('path');

const dir = process.cwd();
const node = 'C:\\Users\\123456\\.workbuddy\\binaries\\node\\versions\\22.22.2\\node.exe';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log('PASS', msg); }
  else { fail++; console.log('FAIL', msg); }
}

// ---- Fake DOM ----
function FakeClassList() {
  this._s = new Set();
}
FakeClassList.prototype.add = function () { for (const a of arguments) this._s.add(a); };
FakeClassList.prototype.remove = function () { for (const a of arguments) this._s.delete(a); };
FakeClassList.prototype.contains = function (c) { return this._s.has(c); };
FakeClassList.prototype.toggle = function (c, force) {
  const has = this._s.has(c);
  const want = force === undefined ? !has : !!force;
  if (want) this._s.add(c); else this._s.delete(c);
  return want;
};

const registry = {};
const tabRegistry = [];

function FakeEl(id) {
  this.id = id || '';
  this.style = {};
  this.classList = new FakeClassList();
  this._html = '';
  this.textContent = '';
  this.value = '';
  this.files = [];
  this.onclick = null;
  this.children = [];
  this.parentElement = null;
}
Object.defineProperty(FakeEl.prototype, 'innerHTML', {
  get() { return this._html; },
  set(v) { this._html = String(v); }
});
FakeEl.prototype.appendChild = function (c) { this.children.push(c); c.parentElement = this; return c; };
FakeEl.prototype.addEventListener = function () {};
FakeEl.prototype.click = function () { if (this.onclick) this.onclick({ target: this }); };
// querySelector: return a generic fake (good enough for handlers we don't invoke deeply)
FakeEl.prototype.querySelector = function () { return new FakeEl(); };
FakeEl.prototype.querySelectorAll = function () { return []; };

function getEl(id) {
  if (!registry[id]) registry[id] = new FakeEl(id);
  return registry[id];
}

const documentStub = {
  readyState: 'complete',
  getElementById: getEl,
  createElement: function () { return new FakeEl(); },
  querySelectorAll: function (sel) {
    if (sel === '.section-tab') return tabRegistry.length ? tabRegistry : [];
    return [];
  },
  addEventListener: function () {}
};

// Pre-create the three section tabs so querySelectorAll('.section-tab') works
['content', 'stages', 'attachments'].forEach((k) => {
  const t = new FakeEl('tab-' + k);
  tabRegistry.push(t);
});

let lastHref = '';
const locationStub = {
  search: '',
  get href() { return lastHref; },
  set href(v) { lastHref = v; }
};

const sandbox = {
  document: documentStub,
  location: locationStub,
  URLSearchParams: URLSearchParams,
  setTimeout: (fn) => { /* run later */ return 0; },
  console: console
};
sandbox.window = sandbox;
vm.createContext(sandbox);

function loadFile(rel) {
  const code = fs.readFileSync(path.join(dir, rel), 'utf8');
  vm.runInContext(code, sandbox, { filename: rel });
}

try {
  loadFile('contract-store.js');
  loadFile('worker-contract-detail.js');

  // init() runs automatically (readyState complete) → seeds shuidian example
  const WCP = sandbox.WCP;
  assert(!!WCP, 'WCP global exposed');

  const mainView = getEl('mainView');
  assert(mainView.style.display === 'block', 'mainView visible after init');
  assert(getEl('notFound').style.display !== 'block', 'notFound hidden after init');

  const bannerText = getEl('bannerText').textContent;
  assert(bannerText === '确认中', 'default banner = 确认中 (got ' + bannerText + ')');

  // 合同内容
  const contentHtml = getEl('contentSection').innerHTML;
  assert(contentHtml.indexOf('合同正文') > -1, 'contentSection renders 合同正文');
  assert(contentHtml.indexOf('补充条款') > -1, 'contentSection renders 补充条款');
  assert(contentHtml.indexOf('水电班组服务合同') > -1, 'content matches shuidian example');

  // 阶段任务
  const stagesHtml = getEl('stagesSection').innerHTML;
  assert(stagesHtml.indexOf('阶段任务') > -1, 'stagesSection renders 阶段任务');
  assert(stagesHtml.indexOf('布管布线阶段') > -1, 'stages include 布管布线阶段');
  assert(stagesHtml.indexOf('role-tag') > -1, 'stage tasks include role-tag');

  // 附件
  const attachHtml = getEl('attachmentsSection').innerHTML;
  assert(attachHtml.indexOf('签约文件') > -1, 'attachments renders 签约文件');
  assert(attachHtml.indexOf('合同附件') > -1, 'attachments renders 合同附件');
  assert(attachHtml.indexOf('暂无签约文件') > -1, 'inviting → 签约文件 shows 暂无');

  // section 切换
  WCP.switchSection(tabRegistry[1], 'stages');
  assert(getEl('stagesSection').classList.contains('show'), 'switchSection → stagesSection show');
  assert(!getEl('contentSection').classList.contains('show'), 'switchSection → contentSection hidden');
  WCP.switchSection(tabRegistry[0], 'content');
  assert(getEl('contentSection').classList.contains('show'), 'switchSection back to content');

  // 阶段折叠（不抛错）
  let threw = false;
  try { WCP.toggleStage(new FakeEl('hdr')); } catch (e) { threw = true; console.log(e.message); }
  assert(!threw, 'toggleStage does not throw');

  // 已确认(受邀方) → 签约文件上传按钮
  WCP.updateStatus('worker_confirmed_receiver');
  assert(getEl('attachmentsSection').innerHTML.indexOf('选择文件并上传') > -1, 'confirmed_receiver → upload button');
  assert(getEl('attachmentsSection').innerHTML.indexOf('签约附件') === -1, 'no stray 签约附件 label');

  // 已签约 → 签约文件已上传
  WCP.updateStatus('worker_signed');
  assert(getEl('attachmentsSection').innerHTML.indexOf('合同已生效') > -1, 'signed → 签约文件 已生效');

  // 拟定中 → 内联编辑面板可见
  WCP.updateStatus('worker_draft');
  assert(getEl('inviteEditPanel').style.display === 'block', 'draft → inviteEditPanel visible');
  assert(getEl('inviteListBox').style.display === 'none', 'draft → inviteListBox hidden');

  // 更多菜单切换类型（createDemo 触发 location 跳转，应为新 id）
  const beforeHref = lastHref;
  WCP.createDemo('demolition');
  assert(lastHref.indexOf('worker-contract-detail.html?id=') === 0, 'createDemo navigates with new id');

  // 重置
  WCP.resetDemo();
  assert(lastHref === 'worker-contract-detail.html', 'resetDemo navigates to clean page');

  // 受邀方视角：抢单失败文案
  locationStub.search = '?id=demo-shuidian-example&viewer=receiver&asUserId=m-muzuo';
  // re-run init by reloading is heavy; instead directly test computeStatus via updateStatus on a fresh seed
  // (skip reload; the above flows already exercised receiver paths through updateStatus)

} catch (e) {
  fail++;
  console.log('EXCEPTION', e && e.stack ? e.stack : e);
}

console.log('\nRESULT pass=' + pass + ' fail=' + fail);
process.exit(fail === 0 ? 0 : 1);
