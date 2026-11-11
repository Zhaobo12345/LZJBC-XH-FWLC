/**
 * 业主端合同数据（单一数据源）
 * 同时服务于「合同列表」与「合同详情」：列表负责展示/交互，详情按 ?id 取数渲染标识字段。
 * 动态合同树合并（ContractTreeStore）若已加载则在此统一合并，避免两端重复逻辑。
 * 注意：本文件为纯数据源，不含任何 UI / 交互逻辑。
 */
(function () {
  'use strict';

  // 合同数据（与历史内联 CONTRACTS 保持一致；归属统一为 flowId/parent，无架构层级字段）
  // status 取值说明：
  //   非工人（ct:'service'）：signed / confirming / ...
  //   工人（ct:'worker'）：worker_signed / worker_inviting / worker_draft / ...
  var OWNER_CONTRACTS = [
    /* ---- 根合同：基础施工服务合同（非工人合同） ---- */
    {
      id: 'base', name: '基础施工服务合同', ct: 'service', type: 'base', typeName: '基础施工服务',
      flowId: 'sg', flowName: '基础施工服务',
      status: 'signed', version: 'V1', amount: 186000,
      partyA: '陈庄（工长）', partyB: '张三（项目经理）', no: 'BJSDSWHT000001', duration: null,
      taskDone: 4, taskTotal: 7, changed: false, parent: null, mine: true
    },
    /* ---- 一级子合同：水电班组（工人合同）→ 其下再分强电 / 弱电 ---- */
    {
      id: 'water', name: '水电班组服务合同', ct: 'worker', type: 'shuidian', typeName: '水电班组',
      flowId: 'sg', flowName: '基础施工服务',
      status: 'worker_signed', version: 'V2', amount: 26000,
      partyA: '陈庄（工长）', partyB: '赵六（水电工长）', created: '2026-09-18', duration: 52,
      taskDone: 2, taskTotal: 5, changed: true, parent: 'base', mine: true
    },
    /* ---- 二级子合同：强电 / 弱电（工人合同） ---- */
    {
      id: 'strong', name: '强电服务合同', ct: 'worker', type: 'shuidian', typeName: '强电',
      flowId: 'sg', flowName: '基础施工服务',
      status: 'worker_inviting', version: 'V1', amount: 16000,
      partyA: '赵六（水电工长）', partyB: '孙八（强电）', created: '2026-10-08', duration: 30,
      taskDone: 0, taskTotal: 3, changed: false, parent: 'water', mine: true
    },
    {
      id: 'weak', name: '弱电服务合同', ct: 'worker', type: 'shuidian', typeName: '弱电',
      flowId: 'sg', flowName: '基础施工服务',
      status: 'worker_draft', version: 'V1', amount: 0,
      partyA: '赵六（水电工长）', partyB: '钱九（弱电）', created: '2026-10-09', duration: null,
      taskDone: 0, taskTotal: 2, changed: false, parent: 'water', mine: true
    },
    {
      id: 'tile', name: '泥瓦班组服务合同', ct: 'worker', type: 'niwa', typeName: '泥瓦班组',
      flowId: 'sg', flowName: '基础施工服务',
      status: 'worker_inviting', version: 'V1', amount: 19800,
      partyA: '陈庄（工长）', partyB: '周十（泥瓦工长）', created: '2026-11-01', duration: 45,
      taskDone: 0, taskTotal: 4, changed: false, parent: 'base', mine: false
    },
    {
      id: 'wood', name: '木作班组服务合同', ct: 'worker', type: 'muzuo', typeName: '木作班组',
      flowId: 'sg', flowName: '基础施工服务',
      status: 'worker_draft', version: 'V1', amount: 0,
      partyA: '陈庄（工长）', partyB: '吴十一（木工）', created: '2026-11-02', duration: null,
      taskDone: 0, taskTotal: 3, changed: false, parent: 'base', mine: false
    },
    {
      id: 'demo', name: '拆除班组服务合同', ct: 'worker', type: 'demolition', typeName: '拆除班组',
      flowId: 'sg', flowName: '基础施工服务',
      status: 'worker_signed', fulfilled: true, version: 'V1', amount: 8600,
      partyA: '陈庄（工长）', partyB: '郑十二（拆除）', created: '2026-08-20', duration: 12,
      taskDone: 3, taskTotal: 3, changed: false, parent: 'base', mine: false
    },
    /* ---- 根合同：设计服务合同（非工人合同，无子合同） ---- */
    {
      id: 'design', name: '设计服务合同', ct: 'service', type: 'design', typeName: '设计服务',
      flowId: 'ht', flowName: '设计服务',
      status: 'confirming', version: 'V1', amount: 42000,
      partyA: '陈庄（工长）', partyB: '李四（设计师）', no: 'SJFWHT000007', duration: null,
      taskDone: 3, taskTotal: 5, changed: false, parent: null, mine: false
    }
  ];

  // 动态合同树合并（只读，不提供创建入口）；ContractTreeStore 由 contract-list.html 先行加载
  if (window.ContractTreeStore && typeof window.ContractTreeStore.merge === 'function') {
    OWNER_CONTRACTS = window.ContractTreeStore.merge(OWNER_CONTRACTS);
  }

  function getOwnerContractById(id) {
    if (!id) return null;
    for (var i = 0; i < OWNER_CONTRACTS.length; i++) {
      if (OWNER_CONTRACTS[i].id === id) return OWNER_CONTRACTS[i];
    }
    return null;
  }

  window.OWNER_CONTRACTS = OWNER_CONTRACTS;
  window.getOwnerContractById = getOwnerContractById;
})();
