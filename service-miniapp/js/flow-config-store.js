/* ============================================================
   服务流程项配置：项目内流程结构 SSOT
   - 默认 6 项：量房 / 初步设计 / 设计服务 / 基础施工服务 / 主材安装 / 售后
   - hasContract = 该项是否包含合同：开启后该项可创建合同，合同下的阶段与任务才可见
   - 配置只影响结构（顺序 / 名称 / 是否含合同 / 增减），不迁移已产生的合同与任务
   - 存储：localStorage（原型无后端）
   ============================================================ */
(function (global) {
  'use strict';

  var KEY = 'lzj_flow_cfg_v1';
  var MAX_ITEMS = 12;
  var MIN_ITEMS = 1;

  /* 默认 6 项：hasContract 默认值按业务口径给出（量房/初步设计/售后为纯任务项） */
  var DEFAULTS = [
    { id: 'lh', name: '量房', hasContract: false, status: '已完成', tasks: 3, contracts: 0, stages: 0 },
    { id: 'cs', name: '初步设计', hasContract: false, status: '已完成', tasks: 4, contracts: 0, stages: 0 },
    { id: 'ht', name: '设计服务', hasContract: true, status: '已完成', tasks: 7, contracts: 1, stages: 2 },
    { id: 'sg', name: '基础施工服务', hasContract: true, status: '进行中', tasks: 39, contracts: 4, stages: 5 },
    { id: 'cz', name: '主材安装', hasContract: false, status: '未开始', tasks: 5, contracts: 0, stages: 2 },
    { id: 'sh', name: '售后', hasContract: false, status: '未开始', tasks: 0, contracts: 0, stages: 0 }
  ];

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function read() {
    try {
      var raw = global.localStorage.getItem(KEY);
      if (!raw) return clone(DEFAULTS);
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr) || !arr.length) return clone(DEFAULTS);
      return arr;
    } catch (e) {
      return clone(DEFAULTS);
    }
  }

  function write(list) {
    try { global.localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
    return list;
  }

  function isCustom() {
    try { return !!global.localStorage.getItem(KEY); } catch (e) { return false; }
  }

  function reset() {
    try { global.localStorage.removeItem(KEY); } catch (e) {}
    return clone(DEFAULTS);
  }

  function find(list, id) {
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) return list[i]; }
    return null;
  }

  function indexOf(list, id) {
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) return i; }
    return -1;
  }

  function nameTaken(list, name, exceptId) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].name === name && list[i].id !== exceptId) return true;
    }
    return false;
  }

  function validateName(name) {
    var n = String(name == null ? '' : name).replace(/^\s+|\s+$/g, '');
    if (!n) return '请填写流程项名称';
    if (n.length < 2) return '名称至少 2 个字';
    if (n.length > 10) return '名称不超过 10 个字';
    return '';
  }

  function add(name, hasContract) {
    var list = read();
    var n = String(name == null ? '' : name).replace(/^\s+|\s+$/g, '');
    var err = validateName(n);
    if (err) return { ok: false, msg: err };
    if (list.length >= MAX_ITEMS) return { ok: false, msg: '最多 ' + MAX_ITEMS + ' 个流程项' };
    if (nameTaken(list, n)) return { ok: false, msg: '已有同名流程项' };
    list.push({
      id: 'f' + Date.now().toString(36) + Math.floor(Math.random() * 100),
      name: n, hasContract: !!hasContract, status: '未开始',
      tasks: 0, contracts: 0, stages: 0
    });
    return { ok: true, list: write(list) };
  }

  function rename(id, name) {
    var list = read();
    var it = find(list, id);
    if (!it) return { ok: false, msg: '流程项不存在' };
    var n = String(name == null ? '' : name).replace(/^\s+|\s+$/g, '');
    var err = validateName(n);
    if (err) return { ok: false, msg: err };
    if (nameTaken(list, n, id)) return { ok: false, msg: '已有同名流程项' };
    it.name = n;
    return { ok: true, list: write(list) };
  }

  /* 切换「含合同」：已有合同禁止关闭，避免合同悬空 */
  function setContract(id, on) {
    var list = read();
    var it = find(list, id);
    if (!it) return { ok: false, msg: '流程项不存在' };
    on = !!on;
    if (!on && it.contracts > 0) {
      return { ok: false, msg: '该项下有 ' + it.contracts + ' 份合同，请先归档或转移到其他流程项' };
    }
    it.hasContract = on;
    return { ok: true, list: write(list) };
  }

  /* 删除：有合同或有任务的项不可删 */
  function remove(id) {
    var list = read();
    var it = find(list, id);
    if (!it) return { ok: false, msg: '流程项不存在' };
    if (list.length <= MIN_ITEMS) return { ok: false, msg: '至少保留 1 个流程项' };
    if (it.contracts > 0) return { ok: false, msg: '该项下有 ' + it.contracts + ' 份合同，不能删除' };
    if (it.tasks > 0) return { ok: false, msg: '该项下还有 ' + it.tasks + ' 个任务，不能删除' };
    list = list.filter(function (x) { return x.id !== id; });
    return { ok: true, list: write(list) };
  }

  function canRemove(id) {
    var list = read();
    var it = find(list, id);
    if (!it) return { ok: false, msg: '流程项不存在' };
    if (list.length <= MIN_ITEMS) return { ok: false, msg: '至少保留 1 个流程项' };
    if (it.contracts > 0) return { ok: false, msg: '该项下有 ' + it.contracts + ' 份合同，不能删除' };
    if (it.tasks > 0) return { ok: false, msg: '该项下还有 ' + it.tasks + ' 个任务，不能删除' };
    return { ok: true, msg: '' };
  }

  function move(id, dir) {
    var list = read();
    var i = indexOf(list, id);
    if (i < 0) return { ok: false, msg: '流程项不存在' };
    var j = dir === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= list.length) return { ok: false, msg: dir === 'up' ? '已在第一位' : '已在最后一位' };
    var tmp = list[i]; list[i] = list[j]; list[j] = tmp;
    return { ok: true, list: write(list) };
  }

  /* 统计摘要：用于配置页每行副标题 */
  function summary(item) {
    var parts = [];
    if (item.contracts > 0) parts.push(item.contracts + ' 份合同');
    if (item.hasContract && item.stages > 0) parts.push(item.stages + ' 阶段');
    if (item.tasks > 0) parts.push(item.tasks + ' 个任务');
    if (!parts.length) parts.push('暂无数据');
    return parts.join(' · ');
  }

  global.FlowCfgStore = {
    DEFAULT_LIST: clone(DEFAULTS),
    MAX_ITEMS: MAX_ITEMS,
    get: read,
    save: write,
    reset: reset,
    isCustom: isCustom,
    find: function (id) { return find(read(), id); },
    add: add,
    rename: rename,
    setContract: setContract,
    remove: remove,
    canRemove: canRemove,
    move: move,
    summary: summary
  };
})(window);
