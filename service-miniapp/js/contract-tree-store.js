/* 合同树演示数据层（服务方 / 业主端各一份，内容保持一致）
   ------------------------------------------------------------------
   口径：合同唯一归属服务流程项（flowId / flowName）；parent 是唯一层级字段
        parent = null → 直属流程项；parent = 某合同 id → 该合同的子级合同
        BASE 仅作「隶属合同」下拉的只读基线，字段取自 contract-list.html
        的 CONTRACTS[]（id / name / ct / typeName / flowId / flowName / parent）。
   动态：用户在原型里新建的合同落 localStorage（lzj_contract_tree_v1），
        两端共用同一 key，页面基线数组保持不动（merge 时按 id 去重追加）。
   边界：不写 status、不进任务计数、不碰 canAssign / 指派任务链 / 任务状态机。
*/
(function () {
    'use strict';

    var KEY = 'lzj_contract_tree_v1';

    var BASE = [
        { id: 'base',   name: '基础施工服务合同', ct: 'service', type: 'base', typeName: '基础施工服务', flowId: 'sg', flowName: '基础施工服务', parent: null,   status: 'signed' },
        { id: 'water',  name: '水电班组服务合同', ct: 'worker', type: 'shuidian',  typeName: '水电班组',     flowId: 'sg', flowName: '基础施工服务', parent: 'base',  status: 'worker_signed' },
        { id: 'strong', name: '强电服务合同',     ct: 'worker', type: 'shuidian',  typeName: '强电',         flowId: 'sg', flowName: '基础施工服务', parent: 'water', status: 'worker_inviting' },
        { id: 'weak',   name: '弱电服务合同',     ct: 'worker', type: 'shuidian',  typeName: '弱电',         flowId: 'sg', flowName: '基础施工服务', parent: 'water', status: 'worker_draft' },
        { id: 'tile',   name: '泥瓦班组服务合同', ct: 'worker', type: 'niwa',  typeName: '泥瓦班组',     flowId: 'sg', flowName: '基础施工服务', parent: 'base',  status: 'worker_inviting' },
        { id: 'wood',   name: '木作班组服务合同', ct: 'worker', type: 'muzuo',  typeName: '木作班组',     flowId: 'sg', flowName: '基础施工服务', parent: 'base',  status: 'worker_draft' },
        { id: 'demo',   name: '拆除班组服务合同', ct: 'worker', type: 'demolition',  typeName: '拆除班组',     flowId: 'sg', flowName: '基础施工服务', parent: 'base',  status: 'worker_signed' },
        { id: 'design', name: '设计服务合同',     ct: 'service', type: 'design', typeName: '设计服务',     flowId: 'ht', flowName: '设计服务',     parent: null,   status: 'confirming' }
    ];

    function read() {
        try {
            var raw = window.localStorage.getItem(KEY);
            var list = raw ? JSON.parse(raw) : [];
            return Object.prototype.toString.call(list) === '[object Array]' ? list : [];
        } catch (e) { return []; }
    }

    function save(list) {
        try { window.localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* 隐私模式下静默降级 */ }
    }

    /* 下拉候选：基线 + 用户新建，按同一流程项过滤 */
    function listByFlow(flowId) {
        if (!flowId) return [];
        return BASE.concat(read()).filter(function (c) { return c.flowId === flowId; });
    }

    function byId(id) {
        return BASE.concat(read()).filter(function (c) { return c.id === id; })[0] || null;
    }

    /* 列表页合并：页面内联 CONTRACTS 保持不动，仅追加动态新增（按 id 去重） */
    function merge(baseContracts) {
        var extra = read().filter(function (x) {
            return !baseContracts.some(function (b) { return b.id === x.id; });
        });
        return extra.length ? baseContracts.concat(extra) : baseContracts;
    }

    /* 新建合同：补齐列表页渲染所需的全部字段 */
    function add(data) {
        // 合同必须有归属服务流程项；缺省时拒绝写入，避免生成无归属合同
        if (!data.flowId) return null;
        var item = {
            id: data.id || ('ct-' + Date.now()),
            name: data.name || '未命名合同',
            ct: data.ct || 'worker',
            typeName: data.typeName || '',
            flowId: data.flowId || '',
            flowName: data.flowName || '',
            status: data.status || 'worker_draft',
            version: 'V1',
            amount: data.amount || 0,
            partyA: data.partyA || '',
            partyB: data.partyB || '',
            no: '',
            duration: null,
            taskDone: 0,
            taskTotal: 0,
            changed: false,
            parent: data.parent || null,
            mine: true,
            created: new Date().toISOString().slice(0, 10)
        };
        var list = read();
        list = list.filter(function (x) { return x.id !== item.id; });
        list.push(item);
        save(list);
        return item;
    }

    function clear() { save([]); }

    window.ContractTreeStore = {
        KEY: KEY,
        BASE: BASE,
        read: read,
        all: function () { return BASE.concat(read()); },
        listByFlow: listByFlow,
        byId: byId,
        merge: merge,
        add: add,
        clear: clear
    };
})();
