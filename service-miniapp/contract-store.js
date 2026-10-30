/**
 * 合约库（仅作用于 6 类工人服务合同）
 * --------------------------------------------------------------
 * 本文件为「家装平台小程序原型」的本地持久化层（localStorage）。
 * 仅对以下合同类型生效，基础施工服务合同 / 设计服务合同 走原有流程，不经过本库。
 *
 * 工人合同类型（与 PRD / create-contract.html 的 CONTRACT_TYPES.value 保持一致）：
 *   demolition   拆除班组服务合同
 *   shuidian     水电班组服务合同
 *   muzuo        木作班组服务合同
 *   niwa         泥瓦工班组服务合同
 *   youqi        油漆工班组服务合同
 *   xiaolingong  小零工服务合同
 *
 * 新流程（方案 B）：
 *   创建时邀请 1~3 人（意向乙方）→ 状态「确认中」→ 被邀请人确认/抢单
 *   → 第一位确认者成为乙方，自动加入「合同关联架构层级」→ 状态「已确认」
 *   → 仍需「上传签约文件」→ 状态「已签约」
 *   平台审核、超时、重新邀请均不存在；如需更改通过「撤回确认」退回拟定中重新提交。
 *
 * 并发防重（后端契约，原型仅做客户端首胜校验）：
 *   真实后端应在 contract_invitations 表对 (contract_id, status='confirmed')
 *   建立部分唯一约束，并在确认接口加分布式锁（如 Redis SETNX），保证「第一个确认的人为乙方」。
 */
(function (global) {
    'use strict';

    var CONTRACT_KEY = 'lzj_worker_contracts_v1';
    var MESSAGE_KEY = 'lzj_contract_messages_v1';

    var WORKER_TYPES = ['demolition', 'shuidian', 'muzuo', 'niwa', 'youqi', 'xiaolingong'];

    function isWorkerType(t) {
        return WORKER_TYPES.indexOf(t) > -1;
    }

    function readContracts() {
        try {
            return JSON.parse(global.localStorage.getItem(CONTRACT_KEY)) || {};
        } catch (e) {
            return {};
        }
    }

    function writeContracts(obj) {
        global.localStorage.setItem(CONTRACT_KEY, JSON.stringify(obj));
    }

    function getContract(id) {
        if (!id) return null;
        return readContracts()[id] || null;
    }

    function saveContract(c) {
        if (!c || !c.id) return;
        var all = readContracts();
        all[c.id] = c;
        writeContracts(all);
    }

    /**
     * 局部更新工人合同字段（如拟定中修改合同名称 / 合同金额）
     * @param {string} id
     * @param {Object} patch { name, amount, ... }
     */
    function patchContract(id, patch) {
        var c = getContract(id);
        if (!c || !patch) return { ok: false };
        Object.keys(patch).forEach(function (k) { c[k] = patch[k]; });
        saveContract(c);
        return { ok: true, contract: c };
    }

    /**
     * 创建工人合同（写入合约库）
     * @param {Object} data { id, name, type, typeName, group, partyA, partyAName, amount, invited:[{userId,name,role}] }
     */
    function createContract(data) {
        var invitations = (data.invited || []).map(function (m) {
            return { userId: m.userId, name: m.name, role: m.role, status: 'pending' };
        });
        // 默认「邀请中（确认中）」；创建为草稿时由调用方传入 status: 'worker_draft'（仅入库、不立即发送邀约消息）
        var status = data.status || 'worker_inviting';
        var contract = {
            id: data.id,
            name: data.name || '',
            type: data.type || '',
            typeName: data.typeName || '',
            group: data.group || '',
            partyA: data.partyA || '',
            partyAName: data.partyAName || '',
            partyAPhone: data.partyAPhone || '',
            projectAddress: data.projectAddress || '',
            amount: data.amount || '',
            isWorker: true,
            status: status,
            invitations: invitations,
            partyB: '',
            partyBName: '',
            joinedArchitecture: '',
            signed: false,
            createdAt: Date.now(),
            changeLog: [],
            versionLog: []
        };
        saveContract(contract);
        // 仅当合同处于「邀请中」状态时才立即生成「合同邀约」消息；草稿态（worker_draft）待用户「提交并邀请乙方」时再发送
        if (status === 'worker_inviting') {
        // 为每个被邀请人生成一条「合同邀约」消息
        invitations.forEach(function (inv) {
            addMessage({
                id: 'cmsg-' + contract.id + '-' + inv.userId,
                type: 'contract_invite',
                contractId: contract.id,
                toUserId: inv.userId,
                toUserName: inv.name,
                fromUserName: data.inviterName || '陈庄',
                fromUserRole: data.inviterRole || '工长',
                contractName: contract.name,
                contractType: contract.typeName,
                group: contract.group,
                status: 'pending',
                time: nowLabel(),
                date: '今天',
                unread: true
            });
        });
        }
        return contract;
    }

    /**
     * 确认 / 抢单：首位确认者成为乙方（并发首胜校验）
     * 返回 { ok, reason, contract }
     *   reason: 'taken'   已被他人确认
     *           'not_inviting' 当前不在邀请中
     *           'not_invited'  非被邀请人
     *           'already'      本人已处理过
     */
    function confirmInvitation(id, userId) {
        var c = getContract(id);
        if (!c) return { ok: false, reason: 'notfound' };
        if (c.status !== 'worker_inviting') return { ok: false, reason: 'not_inviting' };

        // —— 并发首胜校验（后端：部分唯一约束 + 分布式锁）——
        var taken = c.invitations.some(function (i) { return i.status === 'confirmed'; });
        if (taken) return { ok: false, reason: 'taken' };

        var inv = c.invitations.filter(function (i) { return i.userId === userId; })[0];
        if (!inv) return { ok: false, reason: 'not_invited' };
        if (inv.status !== 'pending') return { ok: false, reason: 'already' };

        inv.status = 'confirmed';
        c.invitations.forEach(function (i) {
            if (i.userId !== userId) {
                i.status = 'rejected';
                // 落败方：合同邀约消息标记为「抢单失败」（与详情页 worker_lost_receiver 一致）
                updateMessage('cmsg-' + id + '-' + i.userId, { status: 'lost', unread: false });
            }
        });
        c.partyB = inv.userId;
        c.partyBName = inv.name;
        c.status = 'worker_confirmed';
        c.joinedArchitecture = c.group || '';
        saveContract(c);

        updateMessage('cmsg-' + id + '-' + userId, { status: 'accepted', unread: false });
        return { ok: true, contract: c };
    }

    function rejectInvitation(id, userId, reason) {
        var c = getContract(id);
        if (!c) return { ok: false };
        var inv = c.invitations.filter(function (i) { return i.userId === userId; })[0];
        if (inv && inv.status === 'pending') {
            inv.status = 'rejected';
            if (reason != null) inv.rejectReason = reason;
            saveContract(c);
            updateMessage('cmsg-' + id + '-' + userId, { status: 'rejected', rejectReason: reason || '', unread: false });
        }
        return { ok: true, contract: c };
    }

    /**
     * 撤回确认：解除乙方、移出架构、退回拟定中（需重新填写并邀请）
     */
    function withdrawConfirm(id) {
        var c = getContract(id);
        if (!c) return { ok: false };
        c.status = 'worker_draft';
        c.partyB = '';
        c.partyBName = '';
        c.joinedArchitecture = '';
        c.invitations = [];
        saveContract(c);
        c.invitations.forEach(function () {});
        // 撤回后，原邀约消息标记为已撤回
        (readMessages()).forEach(function (m) {
            if (m.type === 'contract_invite' && m.contractId === id && m.status === 'pending') {
                updateMessage(m.id, { status: 'withdrawn', unread: false });
            }
        });
        return { ok: true, contract: c };
    }

    /**
     * 重新提交邀约（从拟定中再次邀请）
     */
    function submitInvite(id, invited) {
        var c = getContract(id);
        if (!c) return { ok: false };
        c.invitations = (invited || []).map(function (m) {
            return { userId: m.userId, name: m.name, role: m.role, status: 'pending' };
        });
        c.status = 'worker_inviting';
        c.replacedPartyB = '';
        saveContract(c);
        c.invitations.forEach(function (inv) {
            addMessage({
                id: 'cmsg-' + c.id + '-' + inv.userId,
                type: 'contract_invite',
                contractId: c.id,
                toUserId: inv.userId,
                toUserName: inv.name,
                fromUserName: c.inviterName || '陈庄',
                fromUserRole: c.inviterRole || '工长',
                contractName: c.name,
                contractType: c.typeName,
                group: c.group,
                status: 'pending',
                time: nowLabel(),
                date: '今天',
                unread: true
            });
        });
        return { ok: true, contract: c };
    }

    function markSigned(id) {
        var c = getContract(id);
        if (!c) return;
        c.status = 'worker_signed';
        c.signed = true;
        saveContract(c);
    }

    /**
     * 发起方主动重新选择乙方：将当前已确认乙方标记为「合作未达成（被替换）」，
     * 清空受邀名单并把合同退回「拟定中」，由发起方在拟定中重新搜索并选择 1-3 名意向乙方后提交邀请。
     */
    function reselectPartyB(id) {
        var c = getContract(id);
        if (!c) return { ok: false };
        var replaced = c.invitations.filter(function (i) { return i.status === 'confirmed'; });
        c.invitations.forEach(function (i) {
            if (i.status === 'confirmed') i.status = 'replaced';
        });
        // 记录被替换的原乙方（用于拟定中横幅提示「合作未达成」）
        c.replacedPartyB = replaced.length
            ? { userId: replaced[0].userId, name: replaced[0].name, role: replaced[0].role }
            : '';
        // 留痕：重新选择乙方属于「历史版本」记录（非合同变更），写入 versionLog，
        // 由发起方在「版本记录（历史版本）」中查看；不写入 changeLog（变更记录）。
        c.versionLog = c.versionLog || [];
        c.versionLog.push({
            name: '重新选择乙方',
            desc: '原乙方「' + (replaced[0] ? replaced[0].name : '') + '」合作未达成，合同退回拟定中重新选择',
            date: nowLabel()
        });
        // 清空受邀名单：拟定中由发起人重新挑选（选择乙方流程与拟定中完全一致）
        c.invitations = [];
        c.status = 'worker_draft';
        c.partyB = '';
        c.partyBName = '';
        c.joinedArchitecture = '';
        saveContract(c);
        // 通知原乙方：本次合作未达成
        replaced.forEach(function (i) {
            addMessage({
                id: 'cmsg-replace-' + c.id + '-' + i.userId,
                type: 'contract_invite',
                contractId: c.id,
                toUserId: i.userId,
                toUserName: i.name,
                fromUserName: c.inviterName || '陈庄',
                fromUserRole: c.inviterRole || '工长',
                contractName: c.name,
                contractType: c.typeName,
                group: c.group,
                status: 'replaced',
                time: nowLabel(),
                date: '今天',
                unread: true
            });
        });
        return { ok: true, contract: c };
    }

    /**
     * 发起方取消重新选择：恢复原已确认乙方与已确认状态。
     */
    function reselectCancel(id, prev) {
        var c = getContract(id);
        if (!c || !prev) return { ok: false };
        c.invitations = [{ userId: prev.userId, name: prev.name, role: prev.role, status: 'confirmed' }];
        c.status = 'worker_confirmed';
        c.partyB = prev.userId;
        c.partyBName = prev.name;
        c.joinedArchitecture = c.group || '';
        c.replacedPartyB = '';
        saveContract(c);
        return { ok: true, contract: c };
    }

    // ============== 消息 ==============
    function readMessages() {
        try {
            return JSON.parse(global.localStorage.getItem(MESSAGE_KEY)) || [];
        } catch (e) {
            return [];
        }
    }

    function writeMessages(arr) {
        global.localStorage.setItem(MESSAGE_KEY, JSON.stringify(arr));
    }

    function addMessage(m) {
        var all = readMessages();
        // 同一 invite 消息去重
        var exists = all.filter(function (x) { return x.id === m.id; })[0];
        if (exists) {
            Object.keys(m).forEach(function (k) { exists[k] = m[k]; });
        } else {
            all.unshift(m);
        }
        writeMessages(all);
    }

    function updateMessage(id, patch) {
        var all = readMessages();
        var m = all.filter(function (x) { return x.id === id; })[0];
        if (m) {
            Object.keys(patch).forEach(function (k) { m[k] = patch[k]; });
            writeMessages(all);
        }
    }

    function deleteMessage(id) {
        var all = readMessages();
        var idx = -1;
        for (var i = 0; i < all.length; i++) {
            if (all[i].id === id) { idx = i; break; }
        }
        if (idx > -1) {
            all.splice(idx, 1);
            writeMessages(all);
        }
    }

    function getMessages() {
        return readMessages();
    }

    /**
     * 清空全部工人合同与关联消息（仅供原型演示「重置」使用）
     */
    function clearAll() {
        try { global.localStorage.removeItem(CONTRACT_KEY); } catch (e) {}
        try { global.localStorage.removeItem(MESSAGE_KEY); } catch (e) {}
    }

    function nowLabel() {
        var d = new Date();
        var h = d.getHours();
        var m = d.getMinutes();
        return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
    }

    global.ContractStore = {
        CONTRACT_KEY: CONTRACT_KEY,
        MESSAGE_KEY: MESSAGE_KEY,
        WORKER_TYPES: WORKER_TYPES,
        isWorkerType: isWorkerType,
        getContract: getContract,
        saveContract: saveContract,
        patchContract: patchContract,
        createContract: createContract,
        confirmInvitation: confirmInvitation,
        rejectInvitation: rejectInvitation,
        withdrawConfirm: withdrawConfirm,
        submitInvite: submitInvite,
        markSigned: markSigned,
        reselectPartyB: reselectPartyB,
        reselectCancel: reselectCancel,
        getMessages: getMessages,
        clearAll: clearAll,
        addMessage: addMessage,
        updateMessage: updateMessage,
        deleteMessage: deleteMessage
    };
})(window);
