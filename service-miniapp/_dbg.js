const fs = require('fs');
const vm = require('vm');
const path = require('path');
const dir = process.cwd();

function FakeClassList() { this._s = new Set(); }
FakeClassList.prototype.add = function () { for (const a of arguments) this._s.add(a); };
FakeClassList.prototype.remove = function () { for (const a of arguments) this._s.delete(a); };
FakeClassList.prototype.contains = function (c) { return this._s.has(c); };
FakeClassList.prototype.toggle = function (c, f) { const has = this._s.has(c); const want = f === undefined ? !has : !!f; if (want) this._s.add(c); else this._s.delete(c); return want; };

const registry = {}; const tabRegistry = [];
function FakeEl(id) { this.id = id || ''; this.style = {}; this.classList = new FakeClassList(); this._html = ''; this.textContent = ''; this.value = ''; this.files = []; this.onclick = null; this.children = []; this.parentElement = null; }
Object.defineProperty(FakeEl.prototype, 'innerHTML', { get() { return this._html; }, set(v) { this._html = String(v); } });
FakeEl.prototype.appendChild = function (c) { this.children.push(c); c.parentElement = this; return c; };
FakeEl.prototype.addEventListener = function () {};
FakeEl.prototype.click = function () { if (this.onclick) this.onclick({ target: this }); };
FakeEl.prototype.querySelector = function () { return new FakeEl(); };
FakeEl.prototype.querySelectorAll = function () { return []; };
function getEl(id) { if (!registry[id]) registry[id] = new FakeEl(id); return registry[id]; }

const documentStub = {
  readyState: 'complete', getElementById: getEl, createElement: function () { return new FakeEl(); },
  querySelectorAll: function (sel) { return sel === '.section-tab' ? (tabRegistry.length ? tabRegistry : []) : []; },
  addEventListener: function () {}, setTimeout: () => 0
};
['content', 'stages', 'attachments'].forEach((k) => tabRegistry.push(new FakeEl('tab-' + k)));
const locationStub = { search: '', href: '' };

const sandbox = { document: documentStub, location: locationStub, URLSearchParams: URLSearchParams, setTimeout: () => 0, console: console };
sandbox.window = sandbox;
vm.createContext(sandbox);

function loadFile(rel) {
  const code = fs.readFileSync(path.join(dir, rel), 'utf8');
  try {
    vm.runInContext(code, sandbox, { filename: rel });
    console.log('LOADED OK', rel);
  } catch (e) {
    console.log('LOAD ERROR in', rel, '\n', e && e.stack ? e.stack : e);
    process.exit(1);
  }
}

loadFile('contract-store.js');
console.log('after store load, ContractStore?', !!sandbox.ContractStore);
loadFile('worker-contract-detail.js');
console.log('done');
