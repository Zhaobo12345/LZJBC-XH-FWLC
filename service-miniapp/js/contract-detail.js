/**
 * 合同详情页模块
 * 负责合同状态管理、交互处理、变更操作
 * @module ContractDetailPage
 */
const ContractDetailPage = (function() {
    'use strict';
    
    // ==================== 状态管理 ====================
    const state = {
        isNewContract: false,
        newContractData: {},
        currentStatus: 'draft',
        isReadonly: false,
        hasChangeContent: false,
        hasAmountChange: false,  // 是否有金额变更
        hasContentChange: false,  // 是否有正文变更
        hasAttachmentChange: false,  // 是否有附件变更
        changeReason: '',
        currentStageItem: null,
        newTaskConfirmPersonList: [],
        currentEditTaskItem: null,
        editTaskConfirmPersonList: [],
        // —— 工艺参考示例（新增任务 / 编辑任务 配置；图片，最多 9 张） ——
        newTaskCraftRefs: [],
        newTaskConfirmCraftRefs: [],
        editTaskCraftRefs: [],
        editTaskConfirmCraftRefs: [],
        craftRefEditorCtx: null,
        craftRefEditorBuffer: [],
        customConfirmCallback: null,
        customConfirmDanger: false,
        signFiles: [],
        currentModalAction: '',
        // —— 工人合同（方案 B）扩展 ——
        isWorker: false,
        workerId: '',
        viewer: 'sender',     // sender（发起方/工长） | receiver（被邀请人）
        asUserId: '',         // receiver 视角下的当前用户 id
        workerContract: null,
        changeModalOpen: false  // 发起变更弹窗是否打开（用于判定合同正文弹窗可编辑，与 currentStatus==='changing' 取并集）
    };
    
    // ==================== 合同状态配置 ====================
    const contractStatus = {
        draft: {
            text: '拟定中',
            desc: '合同正在编辑中，完善合同内容后可提交确认',
            bannerClass: 'draft',
            showPcGuide: false,
            showEditForm: true,
            isNew: state.isNewContract,
            hideTabs: true,
            actions: [
                { text: '仅保存', type: 'secondary', action: 'save_draft' },
                { text: '提交确认', type: 'success', action: 'submit' }
            ]
        },
        draft_party_a: {
            text: '拟定中',
            desc: '合同正在编辑中，等待对方完善合同内容',
            bannerClass: 'draft',
            showPcGuide: false,
            showEditForm: false,
            isNew: false,
            isPartyA: true,
            actions: []
        },
        draft_submittable: {
            text: '拟定中',
            desc: '合同内容已完善，可以提交确认',
            bannerClass: 'draft',
            showPcGuide: false,
            showEditForm: true,
            isNew: false,
            actions: [
                { text: '仅保存', type: 'secondary', action: 'save_draft' },
                { text: '提交确认', type: 'success', action: 'submit' }
            ]
        },
        platform_reviewing: {
            text: '待平台审核',
            desc: '已提交确认申请，平台运营人员正在审核中，审核通过后对方将收到确认通知',
            bannerClass: 'reviewing',
            readonly: true,
            showPcGuide: false,
            actions: [
                { text: '撤回申请', type: 'secondary', action: 'withdraw_review' }
            ]
        },
        reviewed_pass: {
            text: '已通过',
            desc: '平台审核已通过，合同已进入确认流程',
            bannerClass: 'confirmed',
            readonly: true,
            showPcGuide: false,
            actions: [
                { text: '查看详情', type: 'primary', action: 'view' }
            ]
        },
        reviewed_reject: {
            text: '已驳回',
            desc: '平台审核未通过，请查看驳回原因',
            bannerClass: 'rejected',
            readonly: true,
            showPcGuide: false,
            showRejectReason: true,
            rejectReason: '合同条款不符合平台规范，请补充完善施工范围说明及验收标准',
            actions: [
                { text: '查看详情', type: 'primary', action: 'view' }
            ]
        },
        platform_rejected: {
            text: '平台审核驳回',
            desc: '平台审核未通过，请根据驳回原因修改合同内容后重新提交',
            bannerClass: 'rejected',
            showPcGuide: false,
            showRejectReason: true,
            rejectReason: '合同条款不符合平台规范，请补充完善施工范围说明及验收标准',
            showEditGuide: true,
            showEditForm: true,
            actions: [
                { text: '仅保存', type: 'secondary', action: 'save_draft' },
                { text: '重新提交', type: 'success', action: 'resubmit' }
            ]
        },
        platform_rejected_modified: {
            text: '平台审核驳回',
            desc: '合同内容已修改，可以重新提交审核',
            bannerClass: 'rejected',
            showPcGuide: false,
            showRejectReason: true,
            rejectReason: '合同条款不符合平台规范，请补充完善施工范围说明及验收标准',
            showModifiedTag: true,
            showEditForm: true,
            actions: [
                { text: '仅保存', type: 'secondary', action: 'save_draft' },
                { text: '重新提交', type: 'success', action: 'resubmit' }
            ]
        },
        confirming_sender: {
            text: '待对方确认',
            desc: '平台审核已通过，等待对方确认合同内容（仅支持查看）',
            bannerClass: 'confirming',
            readonly: true,
            showPcGuide: false,
            actions: [
                { text: '撤回确认', type: 'warning', action: 'withdraw' }
            ]
        },
        confirming_receiver: {
            text: '待我方确认',
            desc: '对方已确认合同内容，请我方进行最终确认或驳回修改',
            bannerClass: 'confirming',
            readonly: true,
            showPcGuide: false,
            actions: [
                { text: '驳回修改', type: 'secondary', action: 'reject' },
                { text: '确认合同', type: 'primary', action: 'confirm' }
            ]
        },
        confirmed: {
            text: '已确认',
            desc: '双方已确认，请上传签约后的合同附件，上传后合同正式生效',
            bannerClass: 'confirmed',
            showPcGuide: false,
            actions: [
                { text: '上传签约文件', type: 'primary', action: 'upload' }
            ]
        },
        confirmed_party_a: {
            text: '已确认',
            desc: '双方已确认，等待乙方上传签约附件',
            bannerClass: 'confirmed',
            showPcGuide: false,
            actions: [
                { text: '待乙方上传签约附件', type: 'primary', action: 'wait', disabled: true }
            ]
        },
        signed: {
            text: '已签约',
            desc: '合同已正式生效，可发起变更申请',
            bannerClass: 'signed',
            showPcGuide: false,
            actions: [
                { text: '发起变更', type: 'primary', action: 'change', fullWidth: true }
            ]
        },
        changing: {
            text: '变更中',
            desc: '变更申请已发起，等待对方确认（阶段任务已暂停流转）',
            bannerClass: 'changing',
            readonly: true,
            showPcGuide: false,
            actions: [
                { text: '撤回变更', type: 'warning', action: 'withdraw_change' }
            ]
        },
        change_confirming: {
            text: '待确认变更',
            desc: '对方发起变更申请，请确认或驳回（阶段任务已暂停流转）',
            bannerClass: 'change-confirming',
            readonly: true,
            showPcGuide: false,
            actions: [
                { text: '驳回变更', type: 'secondary', action: 'reject_change' },
                { text: '确认变更', type: 'primary', action: 'confirm_change' }
            ]
        },
        change_platform_reviewing: {
            text: '变更审核中',
            desc: '变更申请已提交，平台运营人员正在审核中，审核通过后将通知合约方确认',
            bannerClass: 'reviewing',
            readonly: true,
            showPcGuide: false,
            isChangeFlow: true,
            actions: [
                { text: '撤回变更申请', type: 'secondary', action: 'withdraw_change_review' }
            ]
        },
        change_platform_rejected: {
            text: '变更审核驳回',
            desc: '变更申请审核未通过，请根据驳回原因修改后重新提交',
            bannerClass: 'rejected',
            readonly: true,
            showPcGuide: false,
            isChangeFlow: true,
            showRejectReason: true,
            rejectReason: '变更内容不符合平台规范，合同金额变更需提供相关证明材料',
            actions: [
                { text: '重新发起变更', type: 'primary', action: 'resubmit_change' }
            ]
        },
        change_confirming_sender: {
            text: '变更确认中',
            desc: '平台审核已通过，等待对方确认变更内容（阶段任务已暂停流转）',
            bannerClass: 'confirming',
            readonly: true,
            showPcGuide: false,
            isChangeFlow: true,
            actions: [
                { text: '撤回变更', type: 'warning', action: 'withdraw_change' }
            ]
        },
        change_confirming_receiver: {
            text: '待确认变更',
            desc: '对方发起变更申请，平台审核已通过，请确认或驳回（阶段任务已暂停流转）',
            bannerClass: 'confirming',
            readonly: true,
            showPcGuide: false,
            isChangeFlow: true,
            actions: [
                { text: '驳回变更', type: 'secondary', action: 'reject_change_flow' },
                { text: '确认变更', type: 'primary', action: 'confirm_change_flow' }
            ]
        },
        change_signing_wait: {
            text: '变更签约中',
            desc: '变更已确认，请上传线下已签约的合同变更文件，上传后变更正式生效',
            bannerClass: 'confirmed',
            readonly: true,
            showPcGuide: false,
            isChangeFlow: true,
            actions: [
                { text: '上传变更签约文件', type: 'primary', action: 'upload_change_sign' }
            ]
        },
        change_confirming_rejected: {
            text: '变更确认人驳回',
            desc: '变更确认方（甲方/业主）已驳回本次变更申请，合同保持原已签约状态。可重新发起变更。',
            bannerClass: 'rejected',
            readonly: true,
            showPcGuide: false,
            isChangeFlow: true,
            showRejectReason: true,
            rejectReason: '变更内容与现场实际情况不符，暂不接受该变更方案，请与发起方沟通后重新发起。',
            actions: [
                { text: '重新发起变更', type: 'primary', action: 'resubmit_change' }
            ]
        },

        // ============== 工人合同新流程（方案 B） ==============
        // 仅作用于 拆除/水电/木作/泥瓦/油漆/小零工 六类，基础施工/设计 仍走上方原流程
        worker_inviting_sender: {
            text: '确认中',
            desc: '已邀请意向乙方参与此合同，等待对方确认/抢单（第一位确认者成为合同乙方）。',
            bannerClass: 'confirming',
            isWorker: true,
            hideTabs: true,
            actions: [
                { text: '撤回确认', type: 'warning', action: 'worker_withdraw' }
            ]
        },
        worker_inviting_receiver: {
            text: '确认中',
            desc: '您被邀请参与此合同，等待您确认/抢单。第一位确认者成为合同乙方。',
            bannerClass: 'confirming',
            isWorker: true,
            hideTabs: true,
            actions: [
                { text: '拒绝', type: 'secondary', action: 'worker_reject' },
                { text: '确认加入', type: 'primary', action: 'worker_confirm' }
            ]
        },
        worker_confirmed_sender: {
            text: '已确认',
            desc: '乙方已确认，已自动加入项目架构层级。请等待乙方上传签约文件。',
            bannerClass: 'confirmed',
            isWorker: true,
            hideTabs: true,
            actions: [
                { text: '撤回确认', type: 'warning', action: 'worker_withdraw' }
            ]
        },
        worker_confirmed_receiver: {
            text: '已确认',
            desc: '您已成为本合同乙方，已自动加入项目架构层级。请上传签约文件，上传后合同正式生效。',
            bannerClass: 'confirmed',
            isWorker: true,
            hideTabs: true,
            actions: [
                { text: '上传签约文件', type: 'primary', action: 'upload' }
            ]
        },
        worker_lost_receiver: {
            text: '已确认',
            desc: '该合同已被其他人员确认（抢单失败），您未成为本合同乙方。',
            bannerClass: 'confirmed',
            isWorker: true,
            hideTabs: true,
            actions: []
        },
        worker_draft: {
            text: '拟定中',
            desc: '合同已撤回至拟定中，可重新填写并邀请人员后提交邀约。',
            bannerClass: 'draft',
            isWorker: true,
            hideTabs: true,
            actions: [
                { text: '重新提交邀约', type: 'success', action: 'worker_resubmit' }
            ]
        },
        worker_signed: {
            text: '已签约',
            desc: '合同已正式生效（乙方已上传签约文件并自动加入项目架构层级）。',
            bannerClass: 'signed',
            isWorker: true,
            hideTabs: true,
            actions: [
                { text: '合同已生效', type: 'primary', action: 'view', disabled: true }
            ]
        }
    };
    
    // ==================== 工具函数 ====================
    
    /**
     * 获取URL参数
     * @param {string} name - 参数名
     * @returns {string|null} 参数值
     */
    function getUrlParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }
    
    /**
     * 显示Toast提示
     * @param {string} message - 提示消息
     * @param {number} duration - 显示时长(毫秒)
     */
    function showToast(message, duration = 2000) {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = message;
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, duration);
        }
    }
    
    /**
     * 显示自定义Toast
     * @param {string} message - 提示消息
     */
    function showCustomToast(message) {
        const toastMessage = document.getElementById('customToastMessage');
        const toastModal = document.getElementById('customToastModal');
        if (toastMessage && toastModal) {
            toastMessage.innerHTML = message.replace(/\n/g, '<br>');
            toastModal.classList.add('show');
        }
    }
    
    /**
     * 关闭自定义Toast
     */
    function closeCustomToast() {
        const toastModal = document.getElementById('customToastModal');
        if (toastModal) {
            toastModal.classList.remove('show');
        }
    }
    
    /**
     * 显示自定义确认弹窗
     * @param {string} title - 标题
     * @param {string} message - 消息内容
     * @param {Function} callback - 确认回调
     * @param {boolean} isDanger - 是否为危险操作
     */
    function showCustomConfirm(title, message, callback, isDanger = false) {
        const titleEl = document.getElementById('customConfirmTitle');
        const messageEl = document.getElementById('customConfirmMessage');
        const confirmBtn = document.getElementById('customConfirmOk');
        const modal = document.getElementById('customConfirmModal');
        
        if (titleEl) titleEl.textContent = title;
        if (messageEl) messageEl.textContent = message;
        
        state.customConfirmCallback = callback;
        state.customConfirmDanger = isDanger;
        
        if (confirmBtn) {
            if (isDanger) {
                confirmBtn.className = 'modal-btn danger';
                confirmBtn.textContent = '删除';
            } else {
                confirmBtn.className = 'modal-btn confirm';
                confirmBtn.textContent = '确定';
            }
        }
        
        if (modal) modal.classList.add('show');
    }
    
    /**
     * 关闭自定义确认弹窗
     */
    function closeCustomConfirm() {
        const modal = document.getElementById('customConfirmModal');
        if (modal) modal.classList.remove('show');
        state.customConfirmCallback = null;
    }
    
    /**
     * 确认自定义确认弹窗
     */
    function confirmCustomConfirm() {
        const callback = state.customConfirmCallback;
        closeCustomConfirm();
        if (callback) {
            callback();
        }
    }
    
    // ==================== 初始化函数 ====================
    
    /**
     * 从URL初始化页面状态
     */
    var _fullTextOriginal = null; // 「查看正文」弹窗原始静态全文；起草期编辑不影响非拟定态展示
    var _fullTextSnapshotAtOpen = null; // 「查看正文」弹窗打开时的内容快照；用于关闭时检测是否有未保存改动（自动兜底）
    function initFromUrl() {
        // 进入任何状态前捕获「查看正文」原始静态全文，确保非拟定态始终展示原始内容
        var ftb = document.querySelector('#fullTextModal .fulltext-content');
        if (ftb && _fullTextOriginal === null) _fullTextOriginal = ftb.innerHTML;
        const urlParams = new URLSearchParams(window.location.search);

        // —— 工人合同新流程（方案 B）：从合约库读取，按视角派生视图 ——
        if (urlParams.get('worker') === '1' && urlParams.get('id')) {
            state.isWorker = true;
            state.workerId = urlParams.get('id');
            state.viewer = urlParams.get('viewer') || 'sender';
            state.asUserId = urlParams.get('asUserId') || '';
            const c = ContractStore.getContract(state.workerId);
            if (!c) {
                showCustomToast('未找到该合同，可能已被清除');
                return;
            }
            state.workerContract = c;
            updateContractStatus(computeWorkerViewStatus());
            return;
        }

        if (urlParams.get('new') === '1') {
            state.isNewContract = true;
            state.newContractData = {
                name: urlParams.get('name') || '',
                type: urlParams.get('type') || '',
                typeName: urlParams.get('typeName') || '',
                partyA: urlParams.get('partyA') || '',
                partyAName: urlParams.get('partyAName') || '',
                partyB: urlParams.get('partyB') || '',
                partyBName: urlParams.get('partyBName') || '',
                amount: urlParams.get('amount') || '',
                duration: urlParams.get('duration') || '',
                group: urlParams.get('group') || ''
            };
            updateContractStatus('draft');
            updateNewContractDisplay();
        } else {
            const status = getUrlParam('status');
            if (status && contractStatus[status]) {
                updateContractStatus(status);
            }
        }
    }
    
    /**
     * 更新新合同显示
     */
    function updateNewContractDisplay() {
        const contractTitleEl = document.querySelector('.contract-title');
        if (contractTitleEl && state.newContractData.name) {
            contractTitleEl.textContent = state.newContractData.name;
        }
        
        const infoRows = document.querySelectorAll('.info-row');
        infoRows.forEach(item => {
            const label = item.querySelector('.label');
            const value = item.querySelector('.value');
            if (label && value) {
                const labelText = label.textContent;
                if (labelText.includes('合同类型') && state.newContractData.typeName) {
                    value.textContent = state.newContractData.typeName;
                } else if (labelText.includes('合同金额') && state.newContractData.amount) {
                    value.textContent = state.newContractData.amount + ' 元';
                } else if (labelText.includes('所属架构层级') && state.newContractData.group) {
                    value.textContent = state.newContractData.group;
                }
            }
        });
        
        const partyCards = document.querySelectorAll('.party-card');
        partyCards.forEach(card => {
            const roleEl = card.querySelector('.role');
            const nameEl = card.querySelector('.name');
            if (roleEl && nameEl) {
                if (roleEl.textContent.includes('甲方') && state.newContractData.partyAName) {
                    nameEl.textContent = state.newContractData.partyAName;
                } else if (roleEl.textContent.includes('乙方') && state.newContractData.partyBName) {
                    nameEl.textContent = state.newContractData.partyBName;
                }
            }
        });
    }
    
    // ==================== 状态更新函数 ====================
    
    /**
     * 更新合同状态
     * @param {string} status - 状态标识
     */
    function updateContractStatus(status) {
        state.currentStatus = status;
        const config = contractStatus[status];

        if (!config) {
            console.error('无效的合同状态:', status);
            return;
        }

        state.isReadonly = config.readonly || false;
        
        // 更新状态横幅
        const banner = document.getElementById('statusBanner');
        if (banner) {
            banner.className = 'card status-banner ' + config.bannerClass;
        }
        
        const statusText = document.getElementById('statusText');
        if (statusText) statusText.textContent = config.text;
        
        const statusDesc = document.getElementById('statusDesc');
        if (statusDesc) statusDesc.textContent = config.desc;
        
        // 驳回原因
        const rejectReasonBox = document.getElementById('rejectReasonBox');
        if (rejectReasonBox) {
            if (config.showRejectReason) {
                rejectReasonBox.style.display = 'block';
                const rejectReasonContent = document.getElementById('rejectReasonContent');
                if (rejectReasonContent) rejectReasonContent.textContent = config.rejectReason;
            } else {
                rejectReasonBox.style.display = 'none';
            }
        }
        
        // 编辑表单显示控制
        const draftEditForm = document.getElementById('draftEditForm');
        const draftViewContent = document.getElementById('draftViewContent');
        if (draftEditForm && draftViewContent) {
            if (state.isWorker) {
                draftEditForm.style.display = 'none';
                draftViewContent.style.display = 'none';
            } else if (config.showEditForm) {
                draftEditForm.style.display = 'block';
                draftViewContent.style.display = 'none';
            } else {
                draftEditForm.style.display = 'none';
                draftViewContent.style.display = 'block';
            }
        }

        // 进入可编辑的拟定中时，用本地草稿快照恢复上次编辑内容（仅保存功能）
        if (!state.isWorker && config.showEditForm) {
            loadDraftSnapshot();
        }

        // 变更相关显示
        updateChangeDisplay(status, config);
        
        // 标签页显示
        updateTabsDisplay(config);
        
        // 底部操作按钮
        updateBottomActions(config);
        
        // 状态切换高亮
        updateStatusSwitchHighlight(status);
        
        // 更新签约双方状态
        updatePartyStatus(status);
        
        // 签约文件卡片
        updateSignFileCard(status);
        
        // 导出按钮
        const exportBtn = document.getElementById('exportContractBtn');
        if (exportBtn) exportBtn.style.display = 'flex';
        
        // 状态流程图
        updateStatusFlowDiagram(status);
        
        // 操作引导
        updateActionGuide(status);
        
        // 变更记录tab显示控制
        const changesTabBtn = document.getElementById('changesTabBtn');
        if (changesTabBtn) {
            const showChangesTab = ['signed', 'changing', 'change_confirming', 'change_platform_reviewing', 'change_platform_rejected', 'change_confirming_sender', 'change_confirming_receiver', 'change_signing_wait', 'change_confirmed'];
            changesTabBtn.style.display = showChangesTab.includes(status) ? 'block' : 'none';
        }
        
        // 更新阶段任务显示（已签约前不显示进度和状态）
        updateStageTasksDisplay(status);

        // 派生"已履约完成"标识（已签约态 + 全部任务已完成）
        updateFulfilledBadge(status);

        // 工人合同：签约后回写合约库，并渲染邀请名单
        if (state.isWorker) {
            if (status === 'signed') {
                ContractStore.markSigned(state.workerId);
            }
            renderWorkerExtras(status);
        }

        // 只读区「合同正文」入口文案随可编辑态切换（发起变更/拟定中→编辑正文，其余→查看全文）
        refreshContractBodyLink();
    }
    
    /**
     * 更新阶段任务显示
     * 已签约状态前不显示进度比例和任务状态
     * @param {string} status - 状态标识
     */
    function updateStageTasksDisplay(status) {
        const signedStates = ['signed', 'changing', 'change_confirming', 'change_platform_reviewing', 'change_platform_rejected', 'change_confirming_sender', 'change_confirming_receiver', 'change_signing_wait', 'change_confirmed'];
        const showProgress = signedStates.includes(status);
        
        const stageProgressElements = document.querySelectorAll('.stage-progress');
        const stageMetaElements = document.querySelectorAll('.stage-meta');
        const taskStatusElements = document.querySelectorAll('.task-status');
        const taskDescElements = document.querySelectorAll('.task-desc');
        
        stageProgressElements.forEach(el => {
            el.style.display = showProgress ? 'flex' : 'none';
        });
        
        stageMetaElements.forEach(el => {
            const text = el.textContent;
            if (text.includes('已完成') || text.includes('确认中') || text.includes('执行中')) {
                el.style.display = showProgress ? 'block' : 'none';
            }
        });
        
        taskStatusElements.forEach(el => {
            el.style.display = showProgress ? 'flex' : 'none';
        });
        
        taskDescElements.forEach(el => {
            el.style.display = showProgress ? 'block' : 'none';
        });
    }
    
    /**
     * 派生"已履约完成"标识：已签约态 + 全部有效任务均为"已完成"
     * 实时派生（无持久化）；任一任务非 completed 即隐藏
     * @param {string} status - 状态标识
     */
    function updateFulfilledBadge(status) {
        const badge = document.getElementById('fulfilledBadge');
        if (!badge) return;
        const signedStates = ['signed', 'changing', 'change_confirming', 'change_platform_reviewing', 'change_platform_rejected', 'change_confirming_sender', 'change_confirming_receiver', 'change_signing_wait', 'change_confirmed'];
        const taskStatusEls = document.querySelectorAll('.task-status');
        const allCompleted = taskStatusEls.length > 0 && Array.from(taskStatusEls).every(function (el) {
            return el.classList.contains('completed');
        });
        const show = signedStates.indexOf(status) > -1 && allCompleted;
        badge.style.display = show ? 'inline-flex' : 'none';
    }
    
    // 履约完成演示：原始任务状态快照（供「已签约」切回非履约完成态时恢复）
    let _fulfilledSnapshot = null;

    function snapshotTaskState() {
        if (_fulfilledSnapshot) return;
        _fulfilledSnapshot = {
            statusClass: Array.from(document.querySelectorAll('.task-status')).map(function (el) { return el.className; }),
            statusText: Array.from(document.querySelectorAll('.task-status')).map(function (el) { return el.textContent; }),
            desc: Array.from(document.querySelectorAll('.task-desc')).map(function (el) { return el.textContent; }),
            meta: Array.from(document.querySelectorAll('.stage-meta')).map(function (el) { return el.textContent; }),
            pct: Array.from(document.querySelectorAll('.stage-progress .percent')).map(function (el) { return el.textContent; }),
            pctColor: Array.from(document.querySelectorAll('.stage-progress .percent')).map(function (el) { return el.style.color; })
        };
    }

    function applyFulfilledState() {
        document.querySelectorAll('.task-status').forEach(function (el) {
            el.classList.remove('in-progress', 'pending');
            el.classList.add('completed');
            el.textContent = '✓';
        });
        document.querySelectorAll('.task-desc').forEach(function (el) {
            el.textContent = '已完成 · 2024-03-20';
        });
        document.querySelectorAll('.stage-meta').forEach(function (el) {
            var m = el.textContent.match(/(\d+)个任务/);
            el.textContent = (m ? m[1] : '') + '个任务 · 已完成';
        });
        document.querySelectorAll('.stage-progress .percent').forEach(function (el) {
            el.textContent = '100%';
            el.style.color = '#52C41A';
        });
    }

    function restoreTaskState() {
        if (!_fulfilledSnapshot) return;
        document.querySelectorAll('.task-status').forEach(function (el, i) {
            el.className = _fulfilledSnapshot.statusClass[i] || '';
            el.textContent = _fulfilledSnapshot.statusText[i] || '';
        });
        document.querySelectorAll('.task-desc').forEach(function (el, i) {
            el.textContent = _fulfilledSnapshot.desc[i] || '';
        });
        document.querySelectorAll('.stage-meta').forEach(function (el, i) {
            el.textContent = _fulfilledSnapshot.meta[i] || '';
        });
        document.querySelectorAll('.stage-progress .percent').forEach(function (el, i) {
            el.textContent = _fulfilledSnapshot.pct[i] || '';
            el.style.color = _fulfilledSnapshot.pctColor[i] || '';
        });
    }

    /**
     * 演示：切到已签约并置全部任务为"已完成"，触发"已履约完成"徽标
     * （仅原型演示用，用于直观呈现履约完成派生标识效果）
     */
    function demoFulfilled() {
        snapshotTaskState();
        applyFulfilledState();
        updateContractStatus('signed');
        // 只高亮「已签约（已履约完成）」演示项（先清掉其他项 active，避免与「已签约」同时高亮）
        document.querySelectorAll('.status-switch-item').forEach(function (item) {
            item.classList.remove('active');
            if (item.textContent.trim() === '已签约（已履约完成）') {
                item.classList.add('active');
            }
        });
    }

    /**
     * 演示：切回普通「已签约」（恢复原始任务状态，徽标按真实派生规则显隐）
     */
    function demoSigned() {
        restoreTaskState();
        updateContractStatus('signed');
    }
    
    /**
     * 更新变更相关显示
     * @param {string} status - 状态标识
     * @param {Object} config - 状态配置
     */
    function updateChangeDisplay(status, config) {
        const changeReasonDisplay = document.getElementById('changeReasonDisplay');
        const changeSummaryDisplay = document.getElementById('changeSummaryDisplay');
        const changeHighlightBanner = document.getElementById('changeHighlightBanner');
        const changeStates = ['changing', 'change_confirming', 'change_platform_reviewing', 'change_platform_rejected', 'change_confirming_sender', 'change_confirming_receiver', 'change_confirming_rejected', 'change_signing_wait', 'change_signing'];
        
        const stageOnlyChangeStates = ['changing', 'change_confirming'];
        
        if (changeStates.includes(status)) {
            if (changeReasonDisplay) changeReasonDisplay.style.display = 'block';
            
            const newStageItem = document.getElementById('newStageItem');
            const modifiedTaskTag = document.getElementById('modifiedTaskTag');
            const contractAmountRow = document.getElementById('contractAmountRow');
            const contractAmountChange = document.getElementById('contractAmountChange');
            const newAttachmentItem = document.getElementById('newAttachmentItem');
            const changeHighlightText = document.getElementById('changeHighlightText');
            
            if (newStageItem) newStageItem.style.display = 'block';
            if (modifiedTaskTag) modifiedTaskTag.style.display = 'inline';
            
            if (stageOnlyChangeStates.includes(status)) {
                if (changeSummaryDisplay) changeSummaryDisplay.style.display = 'none';
                if (changeHighlightBanner) changeHighlightBanner.style.display = 'none';
                if (contractAmountRow) contractAmountRow.style.display = 'flex';
                if (contractAmountChange) contractAmountChange.style.display = 'none';
                if (newAttachmentItem) newAttachmentItem.style.display = 'none';
                if (changeHighlightText) changeHighlightText.style.display = 'none';
            } else {
                if (changeSummaryDisplay) changeSummaryDisplay.style.display = 'block';
                if (changeHighlightBanner) changeHighlightBanner.style.display = 'block';
                if (contractAmountRow) contractAmountRow.style.display = 'none';
                if (contractAmountChange) contractAmountChange.style.display = 'flex';
                if (newAttachmentItem) newAttachmentItem.style.display = 'flex';
                if (changeHighlightText) changeHighlightText.style.display = 'inline';
            }
        } else {
            if (changeReasonDisplay) changeReasonDisplay.style.display = 'none';
            if (changeSummaryDisplay) changeSummaryDisplay.style.display = 'none';
            if (changeHighlightBanner) changeHighlightBanner.style.display = 'none';
            
            const newStageItem = document.getElementById('newStageItem');
            const modifiedTaskTag = document.getElementById('modifiedTaskTag');
            const contractAmountRow = document.getElementById('contractAmountRow');
            const contractAmountChange = document.getElementById('contractAmountChange');
            const newAttachmentItem = document.getElementById('newAttachmentItem');
            const changeHighlightText = document.getElementById('changeHighlightText');
            
            if (newStageItem) newStageItem.style.display = 'none';
            if (modifiedTaskTag) modifiedTaskTag.style.display = 'none';
            if (contractAmountRow) contractAmountRow.style.display = 'flex';
            if (contractAmountChange) contractAmountChange.style.display = 'none';
            if (newAttachmentItem) newAttachmentItem.style.display = 'none';
            if (changeHighlightText) changeHighlightText.style.display = 'none';
        }
    }
    
    /**
     * 更新标签页显示
     * @param {Object} config - 状态配置
     */
    function updateTabsDisplay(config) {
        const sectionTabs = document.querySelector('.section-tabs');
        const contentSection = document.getElementById('contentSection');
        const stagesSection = document.getElementById('stagesSection');
        const attachmentsSection = document.getElementById('attachmentsSection');
        
        if (config.isPartyA || config.hideTabs) {
            if (sectionTabs) sectionTabs.style.display = 'none';
            if (contentSection) contentSection.style.display = 'none';
            if (stagesSection) stagesSection.style.display = 'none';
            if (attachmentsSection) attachmentsSection.style.display = 'none';
        } else {
            if (sectionTabs) sectionTabs.style.display = 'flex';
            if (contentSection) {
                contentSection.style.display = '';
                contentSection.classList.add('show');
            }
            if (stagesSection) {
                stagesSection.style.display = '';
                stagesSection.classList.remove('show');
            }
            if (attachmentsSection) {
                attachmentsSection.style.display = '';
                attachmentsSection.classList.remove('show');
            }
            document.querySelectorAll('.section-tab').forEach((tab, index) => {
                if (index === 0) {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });
        }
    }
    
    /**
     * 更新底部操作按钮
     * @param {Object} config - 状态配置
     */
    function updateBottomActions(config) {
        const actionsContainer = document.getElementById('bottomActions');
        if (!actionsContainer) return;

        if (!config.actions || config.actions.length === 0) {
            actionsContainer.style.display = 'none';
            actionsContainer.innerHTML = '';
            return;
        }

        actionsContainer.style.display = 'flex';
        actionsContainer.innerHTML = '';

        config.actions.forEach(action => {
            const btn = document.createElement('div');
            btn.className = 'action-btn ' + (action.type || '');

            // 拟定中类状态（draft / draft_submittable / platform_rejected / platform_rejected_modified）：
            // 主提交按钮（submit / resubmit）的可用态随必填项实时计算
            var isDraftSubmit = (action.action === 'submit' &&
                    (state.currentStatus === 'draft' || state.currentStatus === 'draft_submittable')) ||
                (action.action === 'resubmit' &&
                    (state.currentStatus === 'platform_rejected' || state.currentStatus === 'platform_rejected_modified'));
            var effectiveDisabled = action.disabled || (isDraftSubmit && !isDraftSubmittable());

            if (effectiveDisabled) {
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
                if (action.disabledReason) {
                    btn.title = action.disabledReason;
                } else if (isDraftSubmit) {
                    btn.title = (action.action === 'resubmit'
                        ? '请完善合同内容（合同名称、金额、甲方、乙方，并至少一个阶段及任务）后再重新提交'
                        : '请完善合同内容（合同名称、金额、甲方、乙方，并至少一个阶段及任务）后再提交');
                }
            } else {
                if (action.action === 'save_draft') {
                    btn.onclick = function() { saveDraftContent(); };
                } else {
                    btn.onclick = function() {
                        ContractDetailPage.showStatusModal(action.action);
                    };
                }
                if (action.fullWidth) {
                    btn.style.width = '100%';
                }
            }

            btn.textContent = action.text || '';
            actionsContainer.appendChild(btn);
        });
    }

    // ==================== 拟定中「提交确认」可用性校验 ====================
    // 必填项：合同名称、合同金额(>0)、甲方、乙方 均已填写即视为可提交
    function isDraftSubmittable() {
        if (state.isWorker) return false;
        var nameEl = document.getElementById('editContractName');
        var amountEl = document.getElementById('editContractAmount');
        var partyAEl = document.getElementById('editPartyA');
        var partyBEl = document.getElementById('editPartyB');
        var nameOk = !!(nameEl && nameEl.value.trim() !== '');
        var amountVal = amountEl ? parseFloat(amountEl.value) : NaN;
        var amountOk = !isNaN(amountVal) && amountVal > 0;
        var partyAOk = !!(partyAEl && partyAEl.value.trim() !== '');
        var partyBOk = !!(partyBEl && partyBEl.value.trim() !== '');
        // 至少一个阶段，且其中至少包含一个有名称的任务
        var stageList = document.getElementById('editStageList');
        var hasStage = !!(stageList && stageList.querySelectorAll('.stage-card').length > 0);
        var hasTask = false;
        if (stageList) {
            stageList.querySelectorAll('.task-input').forEach(function (ti) {
                if (ti.value.trim() !== '') hasTask = true;
            });
        }
        var stageTaskOk = hasStage && hasTask;
        return nameOk && amountOk && partyAOk && partyBOk && stageTaskOk;
    }

    // ==================== 仅保存草稿（拟定中编辑内容本地持久化） ====================
    function getBasicDraftKey() {
        if (state.isNewContract) return 'lzj_basic_draft_new';
        return 'lzj_basic_draft_' + (state.currentContractId || 'contract-001');
    }

    function escapeAttr(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function collectDraftSnapshot() {
        var snap = { name: '', amount: '', partyA: '', partyB: '', content: '', fullTextHTML: '', stages: [], savedAt: Date.now() };
        var nameEl = document.getElementById('editContractName');
        var amountEl = document.getElementById('editContractAmount');
        var partyAEl = document.getElementById('editPartyA');
        var partyBEl = document.getElementById('editPartyB');
        var contentEl = document.getElementById('editContractContent');
        if (nameEl) snap.name = nameEl.value;
        if (amountEl) snap.amount = amountEl.value;
        if (partyAEl) snap.partyA = partyAEl.value;
        if (partyBEl) snap.partyB = partyBEl.value;
        if (contentEl) snap.content = contentEl.innerHTML || '';
        // 「查看正文」弹窗完整正文：仅拟定中可编辑态采集，供「仅保存」/「保存」持久化与刷新后恢复
        var fullTextBox = document.querySelector('#fullTextModal .fulltext-content');
        if (isDraftEditState() && fullTextBox) snap.fullTextHTML = fullTextBox.innerHTML || '';

        var stageCards = document.querySelectorAll('#editStageList .stage-card');
        stageCards.forEach(function (card) {
            var nameInput = card.querySelector('.stage-name-input');
            var sw = card.querySelector('.switch');
            var stage = {
                name: nameInput ? nameInput.value : '',
                sequential: sw ? sw.classList.contains('active') : false,
                tasks: []
            };
            var taskItems = card.querySelectorAll('.task-edit-list .task-edit-item');
            taskItems.forEach(function (t) {
                var ti = t.querySelector('.task-input');
                stage.tasks.push({
                    name: ti ? ti.value : '',
                    executor: t.getAttribute('data-executor') || '',
                    confirmers: t.getAttribute('data-confirmers') || ''
                });
            });
            snap.stages.push(stage);
        });
        return snap;
    }

    function saveDraftContent() {
        if (state.isWorker) return;
        try {
            var snap = collectDraftSnapshot();
            localStorage.setItem(getBasicDraftKey(), JSON.stringify(snap));
            showCustomToast('已保存草稿内容');
        } catch (e) {
            showCustomToast('保存失败，请稍后重试');
        }
    }

    function renderStagesFromSnapshot(stages) {
        var list = document.getElementById('editStageList');
        if (!list) return;
        list.innerHTML = '';
        (stages || []).forEach(function (stage) {
            var tasksHtml = (stage.tasks || []).map(function (t) {
                return '<div class="task-edit-item" data-executor="' + escapeAttr(t.executor) + '" data-confirmers="' + escapeAttr(t.confirmers) + '">' +
                    '<input type="text" class="task-input" value="' + escapeAttr(t.name) + '" placeholder="任务名称">' +
                    '<div class="task-action-btn edit" onclick="editTaskDetail(this)" title="编辑详情">✎</div>' +
                    '<div class="task-action-btn" onclick="deleteTask(this)">×</div>' +
                    '</div>';
            }).join('');
            var card = document.createElement('div');
            card.className = 'stage-card';
            card.innerHTML =
                '<div class="stage-card-header">' +
                    '<div class="stage-card-header-row">' +
                        '<input type="text" class="stage-name-input" value="' + escapeAttr(stage.name) + '" placeholder="请输入阶段名称">' +
                        '<div class="stage-sequential">' +
                            '<span>按序执行</span>' +
                            '<div class="switch' + (stage.sequential ? ' active' : '') + '" onclick="toggleStageSequential(this)"></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="stage-card-header-row">' +
                        '<div class="stage-actions">' +
                            '<div class="stage-action-btn add" onclick="addTaskToStage(this)">+ 添加任务</div>' +
                            '<div class="stage-action-btn delete" onclick="deleteStage(this)">× 删除阶段</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="task-edit-list">' + tasksHtml + '</div>';
            list.appendChild(card);
        });
    }

    function loadDraftSnapshot() {
        if (state.isWorker) return;
        try {
            var raw = localStorage.getItem(getBasicDraftKey());
            if (!raw) return;
            var snap = JSON.parse(raw);
            var nameEl = document.getElementById('editContractName');
            var amountEl = document.getElementById('editContractAmount');
            var partyAEl = document.getElementById('editPartyA');
            var partyBEl = document.getElementById('editPartyB');
            var contentEl = document.getElementById('editContractContent');
            if (nameEl && snap.name != null) nameEl.value = snap.name;
            if (amountEl && snap.amount != null) amountEl.value = snap.amount;
            if (partyAEl && snap.partyA != null) partyAEl.value = snap.partyA;
            if (partyBEl && snap.partyB != null) partyBEl.value = snap.partyB;
            // 仅当快照正文非空时才覆盖默认值；旧版草稿 content 为空，避免清空默认正文
            if (contentEl && snap.content != null && snap.content !== '') contentEl.innerHTML = snap.content;
            // 仅「拟定中可编辑」态且快照含已编辑全文时才覆盖弹窗全文；否则保留页面原静态合同全文（不改动示例内容）
            var fullTextBox = document.querySelector('#fullTextModal .fulltext-content');
            if (isDraftEditState() && fullTextBox && snap.fullTextHTML != null && snap.fullTextHTML !== '') {
                fullTextBox.innerHTML = snap.fullTextHTML;
            }
            // 注意：阶段任务数据始终以页面静态 HTML（规范数据，与「待平台审核」一致）为准，
            // 不再用旧草稿静默覆盖 editStageList，避免刷新后展示非最新/错误阶段。
            // 「仅保存」仍持久化并恢复上述文本字段；阶段列表的增删改交互保持不变。
        } catch (e) {
            // 快照损坏则忽略，回退到默认表单
        }
    }

    // ============== 工人合同新流程（方案 B）渲染辅助 ==============
    function escapeHtml(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    // 将模板纯文本正文（含 \n 分段）渲染为可编辑的 <p> 段落 HTML
    function formatTemplateContentToHtml(text) {
        var lines = String(text == null ? '' : text).split('\n');
        var paras = [];
        for (var i = 0; i < lines.length; i++) {
            var s = lines[i].trim();
            if (s.length === 0) continue;
            paras.push('<p>' + escapeHtml(s) + '</p>');
        }
        return paras.join('');
    }

    // 是否处于「拟定中且可编辑」状态（非工人 + 配置了 showEditForm 的状态）
    function isDraftEditState() {
        if (state.isWorker) return false;
        var cfg = state.currentStatus && contractStatus[state.currentStatus];
        return !!(cfg && cfg.showEditForm);
    }

    // 合同正文弹窗是否可编辑：拟定中（showEditForm）或「发起变更」(changing) 态均可编辑；其余只读态不可编辑
    function isContractBodyEditable() {
        if (state.isWorker) return false;
        if (isDraftEditState()) return true;
        return isChangeBodyContext();
    }

    // 是否在「变更合同正文」上下文：发起变更弹窗已打开 或 合同处于 changing 态
    // 注：发起变更弹窗打开期间 currentStatus 通常尚未切到 'changing'（提交后才切换），
    // 故需以 changeModalOpen 标志补充判定，确保弹窗内「编辑正文」可正常编辑并落到独立存储 key
    function isChangeBodyContext() {
        return state.changeModalOpen || state.currentStatus === 'changing';
    }

    // 发起变更态合同正文独立存储 key（与拟定中草稿隔离，避免污染草稿快照）
    function getChangeFullTextKey() {
        return getBasicDraftKey() + ':changeFullText';
    }

    // 只读区「合同正文」入口文案随可编辑态切换：发起变更/拟定中→编辑正文，其余→查看全文
    function refreshContractBodyLink() {
        var link = document.getElementById('contentFullLink');
        if (!link) return;
        link.textContent = isContractBodyEditable() ? '✏️ 编辑正文 >' : '查看全文 >';
    }

    // 根据合约库状态 + 当前视角，派生详情页应渲染的状态
    function computeWorkerViewStatus() {
        const c = ContractStore.getContract(state.workerId);
        if (!c) return 'worker_draft';
        if (state.viewer === 'receiver') {
            if (c.status === 'worker_confirmed') {
                const conf = c.invitations.filter(i => i.status === 'confirmed')[0];
                if (conf && conf.userId === state.asUserId) return 'worker_confirmed_receiver';
                return 'worker_lost_receiver';
            }
            if (c.status === 'worker_inviting') return 'worker_inviting_receiver';
            return 'worker_draft';
        }
        if (c.status === 'worker_inviting') return 'worker_inviting_sender';
        if (c.status === 'worker_confirmed') return 'worker_confirmed_sender';
        if (c.status === 'worker_draft') return 'worker_draft';
        if (c.status === 'worker_signed') return 'signed';
        return 'worker_draft';
    }

    function renderWorkerFromStore() {
        updateContractStatus(computeWorkerViewStatus());
    }

    function workerMetaRow(label, value) {
        return '<div class="meta-row"><span class="meta-label">' + escapeHtml(label) +
            '</span><span class="meta-value">' + escapeHtml(value) + '</span></div>';
    }

    function renderWorkerExtras(status) {
        const card = document.getElementById('invitationCard');
        if (!state.isWorker) {
            if (card) card.style.display = 'none';
            return;
        }
        const c = ContractStore.getContract(state.workerId);
        if (!c) {
            if (card) card.style.display = 'none';
            return;
        }
        if (card) card.style.display = 'block';

        const meta = document.getElementById('workerContractMeta');
        if (meta) {
            let html = '';
            html += workerMetaRow('合同名称', c.name);
            html += workerMetaRow('合同类型', c.typeName);
            html += workerMetaRow('所属架构层级', c.group || '—');
            if (c.amount) html += workerMetaRow('合同金额', c.amount + ' 元');
            if (c.partyAName) html += workerMetaRow('甲方', c.partyAName);
            if (c.partyBName && (c.status === 'worker_confirmed' || c.status === 'worker_signed')) {
                html += workerMetaRow('乙方', c.partyBName);
            }
            meta.innerHTML = html;
        }

        renderWorkerFlow(status);
        renderInviteListBox(c, status);

        const arch = document.getElementById('workerArchNote');
        if (arch) {
            if (c.status === 'worker_confirmed' && c.joinedArchitecture) {
                arch.style.display = 'block';
                arch.innerHTML = '✅ 乙方「' + escapeHtml(c.partyBName) + '」已自动加入项目架构层级：' + escapeHtml(c.joinedArchitecture);
            } else {
                arch.style.display = 'none';
            }
        }

        // 接收方未中签：仅展示失败提示，禁用操作按钮
        if (state.viewer === 'receiver' && status === 'worker_lost_receiver') {
            const ba = document.getElementById('bottomActions');
            if (ba) {
                ba.innerHTML = '<div class="action-btn secondary" style="opacity:.6;cursor:not-allowed;">该合同已被他人确认（抢单失败）</div>';
                ba.style.display = 'flex';
            }
        }
    }

    function renderWorkerFlow(status) {
        const steps = [
            { key: 'inviting', label: '确认中', icon: '🤝' },
            { key: 'confirmed', label: '已确认', icon: '✅' },
            { key: 'signed', label: '已签约', icon: '📄' }
        ];
        const order = ['inviting', 'confirmed', 'signed'];
        let current = 'inviting';
        if (status.indexOf('confirmed') > -1) current = 'confirmed';
        if (status === 'signed' || status.indexOf('signed') > -1) current = 'signed';
        const curIdx = order.indexOf(current);

        let html = '<div class="worker-flow">';
        steps.forEach(function (s, i) {
            const cls = i < curIdx ? 'done' : (i === curIdx ? 'current' : '');
            html += '<div class="wf-step ' + cls + '"><div class="wf-circle">' + s.icon + '</div><div class="wf-label">' + s.label + '</div></div>';
            if (i < steps.length - 1) {
                html += '<div class="wf-line ' + (i < curIdx ? 'done' : '') + '"></div>';
            }
        });
        html += '</div>';

        const card = document.getElementById('invitationCard');
        const meta = document.getElementById('workerContractMeta');
        if (card && meta) {
            const old = document.getElementById('workerFlowBox');
            if (old && old.parentNode) old.parentNode.removeChild(old);
            const div = document.createElement('div');
            div.id = 'workerFlowBox';
            div.style.marginBottom = '12px';
            div.innerHTML = html;
            card.insertBefore(div, meta);
        }
    }

    function renderInviteListBox(c, status) {
        const box = document.getElementById('inviteListBox');
        if (!box) return;
        box.innerHTML = '';
        const taken = c.invitations.some(function (i) { return i.status === 'confirmed'; });
        c.invitations.forEach(function (inv) {
            const me = (inv.userId === state.asUserId);
            let stText = '待确认', stCls = 'pending';
            if (inv.status === 'confirmed') { stText = '已确认（乙方）'; stCls = 'confirmed'; }
            else if (inv.status === 'rejected') { stText = '已拒绝'; stCls = 'rejected'; }
            else if (taken && !me) { stText = '已被他人确认'; stCls = 'taken'; }
            const initial = inv.name ? inv.name.charAt(0) : '?';
            const rowEl = document.createElement('div');
            rowEl.className = 'invite-row' + (me ? ' is-me' : '');
            rowEl.innerHTML =
                '<div class="invite-avatar">' + escapeHtml(initial) + '</div>' +
                '<div class="invite-info"><div class="invite-name">' + escapeHtml(inv.name) + (me ? '（我）' : '') + '</div>' +
                '<div class="invite-role">' + escapeHtml(inv.role) + '</div></div>' +
                '<div class="invite-status ' + stCls + '">' + stText + '</div>';
            box.appendChild(rowEl);
        });
    }

    /**
     * 更新状态切换高亮
     * @param {string} status - 状态标识
     */
    function updateStatusSwitchHighlight(status) {
        document.querySelectorAll('.status-switch-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const statusTextMap = {
            'draft': '拟定中',
            'draft_party_a': '拟定中（甲方）',
            'draft_submittable': '拟定中(可提交)',
            'platform_reviewing': '待平台审核',
            'reviewed_pass': '已通过',
            'reviewed_reject': '已驳回',
            'platform_rejected': '平台审核驳回',
            'confirming_sender': '确认中(发起方)',
            'confirming_receiver': '确认中(待确认方)',
            'confirmed': '已确认',
            'confirmed_party_a': '已确认（甲方）',
            'signed': '已签约',
            'changing': '变更中(发起方)',
            'change_confirming': '变更中(待确认方)',
            'change_platform_reviewing': '变更审核中',
            'change_platform_rejected': '变更审核驳回',
            'change_confirming_sender': '变更确认中(发起方)',
            'change_confirming_receiver': '变更确认中(待确认方)',
            'change_confirming_rejected': '变更确认人驳回',
            'change_signing_wait': '变更签约中',
            'worker_inviting_sender': '确认中(发起方)',
            'worker_inviting_receiver': '确认中(被邀请人)',
            'worker_confirmed_sender': '已确认(发起方)',
            'worker_confirmed_receiver': '已确认(乙方)',
            'worker_lost_receiver': '已确认(未中签)',
            'worker_draft': '拟定中',
            'worker_signed': '已签约'
        };
        
        document.querySelectorAll('.status-switch-item').forEach(item => {
            if (item.textContent === statusTextMap[status]) {
                item.classList.add('active');
            }
        });
    }
    
    /**
     * 更新签约双方状态
     * @param {string} status - 状态标识
     */
    function updatePartyStatus(status) {
        const partyATag = document.getElementById('partyATag');
        const partyBTag = document.getElementById('partyBTag');
        
        const statusMap = {
            'confirming_sender': { a: '已确认', b: '确认中' },
            'confirming_receiver': { a: '已确认', b: '确认中' },
            'confirmed': { a: '已确认', b: '已确认' },
            'signed': { a: '已签约', b: '已签约' },
            'changing': { a: '变更中', b: '待确认' },
            'change_confirming': { a: '已确认', b: '变更中' },
            'worker_confirmed_sender': { a: '已确认', b: '已确认' },
            'worker_confirmed_receiver': { a: '已确认', b: '已确认' },
            'worker_lost_receiver': { a: '已确认', b: '已确认' }
        };

        if (partyATag && partyBTag) {
            if (['draft', 'draft_party_a', 'draft_submittable', 'platform_reviewing', 'platform_rejected',
                'worker_inviting_sender', 'worker_inviting_receiver', 'worker_draft'].includes(status)) {
                partyATag.style.display = 'none';
                partyBTag.style.display = 'none';
            } else if (statusMap[status]) {
                partyATag.style.display = 'block';
                partyBTag.style.display = 'block';
                partyATag.textContent = statusMap[status].a;
                partyBTag.textContent = statusMap[status].b;
            }
        }
    }
    
    /**
     * 更新签约文件卡片
     * @param {string} status - 状态标识
     */
    function updateSignFileCard(status) {
        const signFileCard = document.getElementById('signFileCard');
        const signFileUploadBtn = document.getElementById('signFileUploadBtn');
        const showSignFileStates = ['signed', 'changing', 'change_confirming', 'change_platform_reviewing', 'change_platform_rejected', 'change_confirming_sender', 'change_confirming_receiver', 'change_signing_wait', 'change_confirmed', 'worker_confirmed_sender', 'worker_confirmed_receiver', 'worker_signed'];
        const canUploadSignFileStates = ['confirmed', 'worker_confirmed_receiver'];
        
        if (signFileCard) {
            signFileCard.style.display = showSignFileStates.includes(status) ? 'block' : 'none';
        }
        
        if (signFileUploadBtn) {
            signFileUploadBtn.style.display = canUploadSignFileStates.includes(status) ? 'inline' : 'none';
        }
    }
    
    /**
     * 更新状态流程图
     * @param {string} status - 状态标识
     */
    function updateStatusFlowDiagram(status) {
        const flowSteps = document.querySelectorAll('.status-flow-step');
        const flowLines = document.querySelectorAll('.status-flow-line');

        // 工人合同使用邀请卡片内的专属流程条，隐藏默认流程图
        if (state.isWorker) {
            const sf = document.getElementById('statusFlowCard');
            if (sf) sf.style.display = 'none';
            return;
        }

        const statusOrder = [
            'draft',
            'draft_party_a',
            'draft_submittable',
            'platform_reviewing',
            'confirming_sender',
            'confirming_receiver',
            'confirmed',
            'confirmed_party_a',
            'signed'
        ];
        
        const statusToStepIndex = {
            'draft': 0,
            'draft_party_a': 0,
            'draft_submittable': 0,
            'platform_reviewing': 1,
            'platform_rejected': 0,
            'platform_rejected_modified': 0,
            'confirming_sender': 2,
            'confirming_receiver': 2,
            'confirmed': 3,
            'confirmed_party_a': 3,
            'signed': 4,
            'changing': 4,
            'change_confirming': 4,
            'change_platform_reviewing': 4,
            'change_confirming_sender': 4,
            'change_confirming_receiver': 4,
            'change_signing_wait': 4,
            'change_confirming_rejected': 4,
            'change_confirmed': 4
        };
        
        const currentIndex = statusToStepIndex[status];
        if (currentIndex === undefined) return;
        
        flowSteps.forEach((step, index) => {
            step.classList.remove('completed', 'current', 'pending');
            if (index < currentIndex) {
                step.classList.add('completed');
            } else if (index === currentIndex) {
                step.classList.add('current');
            } else {
                step.classList.add('pending');
            }
        });
        
        flowLines.forEach((line, index) => {
            line.classList.remove('completed', 'pending');
            if (index < currentIndex) {
                line.classList.add('completed');
            } else {
                line.classList.add('pending');
            }
        });
    }
    
    /**
     * 更新操作引导
     * @param {string} status - 状态标识
     */
    function updateActionGuide(status) {
        const guideText = document.getElementById('guideText');
        const guideIconBtn = document.getElementById('guideIconBtn');
        
        const guideConfig = {
            'draft': { desc: '请完善合同内容后提交确认', show: true },
            'platform_reviewing': { desc: '平台正在审核中，请耐心等待', show: true },
            'platform_rejected': { desc: '请根据驳回原因修改后重新提交', show: true },
            'confirming_sender': { desc: '已提交确认，等待对方确认', show: true },
            'confirming_receiver': { desc: '请确认合同内容或驳回修改', show: true },
            'confirmed': { desc: '双方已确认，请上传签约文件', show: true },
            'signed': { desc: '合同已签约生效，可发起变更申请', show: true },
            'changing': { desc: '变更申请已发起，等待对方确认', show: true },
            'change_confirming': { desc: '对方发起变更，请确认或驳回', show: true },
            'change_platform_rejected': { desc: '变更申请审核未通过，请根据驳回原因修改后重新提交', show: true },
            'change_confirming_rejected': { desc: '变更确认方已驳回本次变更，合同保持原已签约，可重新发起变更', show: true }
        };
        
        const config = guideConfig[status];
        if (config && config.show) {
            if (guideIconBtn) guideIconBtn.style.display = 'flex';
            if (guideText) guideText.textContent = config.desc;
        } else {
            if (guideIconBtn) guideIconBtn.style.display = 'none';
        }
    }
    
    // ==================== 交互函数 ====================
    
    /**
     * 切换内容区域
     * @param {HTMLElement} tab - 标签元素
     * @param {string} section - 区域标识
     */
    function switchSection(tab, section) {
        document.querySelectorAll('.section-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        document.querySelectorAll('.section-content').forEach(s => s.classList.remove('show'));
        const sectionEl = document.getElementById(section + 'Section');
        if (sectionEl) sectionEl.classList.add('show');
    }
    
    /**
     * 切换阶段展开/收起
     * @param {HTMLElement} header - 阶段头部元素
     */
    function toggleStage(header) {
        const tasks = header.nextElementSibling;
        const arrow = header.querySelector('.arrow');
        
        if (tasks && arrow) {
            if (tasks.classList.contains('show')) {
                tasks.classList.remove('show');
                arrow.classList.remove('expanded');
            } else {
                tasks.classList.add('show');
                arrow.classList.add('expanded');
            }
        }
    }
    
    /**
     * 显示全文弹窗
     */
    function showFullText() {
        var box = document.querySelector('#fullTextModal .fulltext-content');
        var editable = isContractBodyEditable();
        if (box) {
            if (!editable && _fullTextOriginal !== null) {
                // 只读态：始终还原为原始静态合同全文
                box.innerHTML = _fullTextOriginal;
            } else if (editable && isChangeBodyContext()) {
                // 发起变更态：优先载入独立保存的变更正文（无则用静态原文），不污染拟定中草稿
                var savedChange = localStorage.getItem(getChangeFullTextKey());
                if (savedChange != null && savedChange !== '') {
                    box.innerHTML = savedChange;
                } else if (_fullTextOriginal !== null) {
                    box.innerHTML = _fullTextOriginal;
                }
            }
            box.setAttribute('contenteditable', editable ? 'true' : 'false');
            box.classList.toggle('is-editing', editable);
            // 记录打开时内容，供关闭时检测是否有未保存改动（自动兜底保存）
            _fullTextSnapshotAtOpen = box.innerHTML;
        }
        // 「保存」按钮仅可编辑态（拟定中 / 发起变更）显示
        var saveBtn = document.getElementById('fullTextSaveBtn');
        if (saveBtn) saveBtn.style.display = editable ? 'flex' : 'none';
        // 弹窗标题按状态语义切换：可编辑态→「编辑合同正文」，否则→「合同全文」
        var titleEl = document.getElementById('fullTextTitle');
        if (titleEl) titleEl.textContent = editable ? '✏️ 编辑合同正文' : '📄 合同全文';
        const modal = document.getElementById('fullTextModal');
        if (modal) modal.classList.add('show');
    }

    /**
     * 关闭全文弹窗
     */
    function closeFullText() {
        // 可编辑态（拟定中 / 发起变更）：若弹窗正文较打开时有改动，则自动保存兜底，避免返回丢失编辑
        var box = document.querySelector('#fullTextModal .fulltext-content');
        if (box && isContractBodyEditable() && _fullTextSnapshotAtOpen !== null && box.innerHTML !== _fullTextSnapshotAtOpen) {
            try {
                if (isDraftEditState()) {
                    // 拟定中：写入整套草稿快照（含合同正文），与「仅保存」共用
                    var snap = collectDraftSnapshot();
                    localStorage.setItem(getBasicDraftKey(), JSON.stringify(snap));
                } else if (isChangeBodyContext()) {
                    // 发起变更：仅持久化合同正文到独立 key，隔离拟定中草稿
                    localStorage.setItem(getChangeFullTextKey(), box.innerHTML || '');
                    syncChangeContentPreview();
                }
                _fullTextSnapshotAtOpen = box.innerHTML;
                showCustomToast('已自动保存合同正文');
            } catch (e) {
                showCustomToast('自动保存失败，请手动点击保存');
            }
        }
        const modal = document.getElementById('fullTextModal');
        if (modal) modal.classList.remove('show');
    }

    /**
     * 「查看正文」弹窗内显式保存（拟定中可编辑态）
     * 保存完整正文到本地草稿，与「仅保存」共用同一份快照，刷新后可恢复
     */
    function saveFullText() {
        if (state.isWorker || (!isDraftEditState() && !isChangeBodyContext())) return;
        try {
            var box = document.querySelector('#fullTextModal .fulltext-content');
            if (isDraftEditState()) {
                // 拟定中：写入整套草稿快照（含合同正文），与「仅保存」共用
                var snap = collectDraftSnapshot();
                localStorage.setItem(getBasicDraftKey(), JSON.stringify(snap));
            } else if (isChangeBodyContext()) {
                // 发起变更：仅持久化合同正文到独立 key，隔离拟定中草稿
                if (box) localStorage.setItem(getChangeFullTextKey(), box.innerHTML || '');
                syncChangeContentPreview();
            }
            if (box) _fullTextSnapshotAtOpen = box.innerHTML;
            showCustomToast('已保存合同正文');
        } catch (e) {
            showCustomToast('保存失败，请稍后重试');
        }
    }

    /**
     * 同步发起变更态「合同正文」截断预览（与编辑弹窗内容保持一致）
     * 优先显示已保存的变更正文，否则回退原始静态正文；并复位展开态
     */
    function syncChangeContentPreview() {
        var preview = document.getElementById('changeContractContentPreview');
        if (!preview) return;
        var savedChange = localStorage.getItem(getChangeFullTextKey());
        if (savedChange != null && savedChange !== '') {
            preview.innerHTML = savedChange;
        } else if (_fullTextOriginal !== null) {
            preview.innerHTML = _fullTextOriginal;
        }
    }

    /**
     * 切换二维码显示
     */
    function toggleQRCode() {
        const qrBox = document.getElementById('qrCodeBox');
        if (qrBox) qrBox.classList.toggle('show');
    }
    
    /**
     * 复制编辑链接
     */
    // [已废弃] 引导电脑端编辑链接功能已于本版合同取消（2026-08-10）
    
    /**
     * 切换操作菜单
     */
    function toggleActionMenu() {
        const actionMenu = document.getElementById('actionMenu');
        if (actionMenu) actionMenu.classList.toggle('show');
    }
    
    /**
     * 关闭操作菜单
     */
    function closeActionMenu() {
        const actionMenu = document.getElementById('actionMenu');
        if (actionMenu) actionMenu.classList.remove('show');
    }
    
    // ==================== 弹窗函数 ====================
    
    /**
     * 显示状态操作弹窗
     * @param {string} action - 操作类型
     */
    function showStatusModal(action) {
        const modal = document.getElementById('confirmModal');
        const title = document.getElementById('modalTitle');
        const message = document.getElementById('modalMessage');
        const rejectReasonInputBox = document.getElementById('rejectReasonInputBox');
        const rejectReasonInput = document.getElementById('rejectReasonInput');
        const modalConfirmBtn = document.getElementById('modalConfirmBtn');
        
        const rejectActions = ['reject', 'reject_change', 'reject_change_flow', 'reject_sign'];
        const isRejectAction = rejectActions.includes(action);
        
        const actionTexts = {
            submit: { title: '提交确认', message: '确定要提交合同进行确认吗？提交后将由平台运营人员进行审核，审核通过后对方将收到确认通知。' },
            withdraw_review: { title: '撤回申请', message: '确定要撤回确认申请吗？撤回后可重新编辑合同内容。' },
            resubmit: { title: '重新提交', message: '确定要重新提交合同进行确认吗？提交后将由平台运营人员进行审核。' },
            withdraw: { title: '撤回确认', message: '确定要撤回确认申请吗？撤回后可重新编辑合同。' },
            reject: { title: '驳回修改', message: '确定要驳回此合同并要求修改吗？' },
            confirm: { title: '确认合同', message: '确定要确认此合同吗？确认后双方需上传签约文件。' },
            upload: { title: '上传签约文件', message: '请选择要上传的签约文件（支持PDF、JPG、PNG格式）。' },
            change: { title: '发起变更', message: '确定要发起合同变更吗？变更后需对方确认。' },
            withdraw_change: { title: '撤回变更', message: '确定要撤回变更申请吗？撤回后阶段任务将恢复流转。' },
            reject_change: { title: '驳回变更', message: '确定要驳回变更申请吗？' },
            confirm_change: { title: '确认变更', message: '是否确认此合同内容？确认后变更生效。' },
            withdraw_sign: { title: '撤回签约文件', message: '确定要撤回签约文件吗？撤回后可重新上传。' },
            reject_sign: { title: '驳回签约', message: '确定要驳回签约文件吗？' },
            confirm_sign: { title: '确认签约', message: '确定要确认签约吗？确认后合同将正式生效。' },
            withdraw_change_review: { title: '撤回变更申请', message: '确定要撤回变更申请吗？撤回后可重新编辑变更内容。' },
            resubmit_change: { title: '重新发起变更', message: '确定要重新发起变更申请吗？提交后将由平台运营人员进行审核。' },
            reject_change_flow: { title: '驳回变更', message: '确定要驳回变更申请吗？' },
            confirm_change_flow: { title: '确认变更', message: '是否确认变更？确认后需上传签约文件变更生效！' },
            upload_change_sign: { title: '上传变更签约文件', message: '请选择要上传的变更签约文件（支持PDF、JPG、PNG格式）。' },
            // 工人合同新流程（方案 B）
            worker_withdraw: { title: '撤回合同邀约', message: '确定要撤回确认吗？撤回后合同退回拟定中，需重新填写并邀请人员后提交邀约。' },
            worker_reject: { title: '拒绝邀请', message: '确定要拒绝此合同邀约吗？拒绝后您不会成为本合同乙方。' },
            worker_confirm: { title: '确认加入合同', message: '确定要确认加入此合同吗？确认后您将成为本合同乙方，并自动加入项目架构层级。' },
            worker_resubmit: { title: '重新提交邀约', message: '确定要重新提交邀约吗？将向所选意向乙方重新发送合同邀约。' }
        };
        
        if (action === 'upload') {
            closeModal();
            showSignUploadPage();
            return;
        }
        
        if (action === 'upload_change_sign') {
            closeModal();
            showSignUploadPage();
            return;
        }
        
        if (action === 'progress') {
            closeModal();
            showCustomToast('跳转到合同进度页面');
            return;
        }
        
        if (title && message && modal && actionTexts[action]) {
            state.currentModalAction = action;
            title.textContent = actionTexts[action].title;
            message.textContent = actionTexts[action].message;
            
            if (rejectReasonInputBox) {
                if (isRejectAction) {
                    rejectReasonInputBox.style.display = 'block';
                    if (rejectReasonInput) {
                        rejectReasonInput.value = '';
                        updateRejectReasonCount();
                    }
                } else {
                    rejectReasonInputBox.style.display = 'none';
                }
            }
            
            if (modalConfirmBtn) {
                modalConfirmBtn.classList.remove('disabled');
            }
            
            modal.classList.add('show');
        }
    }
    
    function updateRejectReasonCount() {
        const input = document.getElementById('rejectReasonInput');
        const countEl = document.getElementById('rejectReasonCount');
        const modalConfirmBtn = document.getElementById('modalConfirmBtn');
        
        if (input && countEl) {
            const length = input.value.trim().length;
            countEl.textContent = length;
            
            if (modalConfirmBtn) {
                if (length > 0) {
                    modalConfirmBtn.classList.remove('disabled');
                } else {
                    modalConfirmBtn.classList.add('disabled');
                }
            }
        }
    }
    
    function getRejectReason() {
        const input = document.getElementById('rejectReasonInput');
        return input ? input.value.trim() : '';
    }
    
    /**
     * 关闭弹窗
     */
    function closeModal() {
        const modal = document.getElementById('confirmModal');
        const rejectReasonInputBox = document.getElementById('rejectReasonInputBox');
        const rejectReasonInput = document.getElementById('rejectReasonInput');
        
        if (modal) modal.classList.remove('show');
        if (rejectReasonInputBox) rejectReasonInputBox.style.display = 'none';
        if (rejectReasonInput) rejectReasonInput.value = '';
    }
    
    /**
     * 确认操作
     */
    function confirmAction() {
        const title = document.getElementById('modalTitle');
        const modalConfirmBtn = document.getElementById('modalConfirmBtn');
        
        if (!title) return;
        
        const titleText = title.textContent;
        const rejectTitles = ['驳回修改', '驳回变更', '驳回签约'];
        
        let savedRejectReason = '';
        if (rejectTitles.includes(titleText)) {
            savedRejectReason = getRejectReason();
            if (!savedRejectReason) {
                showCustomToast('请输入驳回原因');
                return;
            }
        }
        
        if (modalConfirmBtn && modalConfirmBtn.classList.contains('disabled')) {
            return;
        }
        
        // 处理不同的action
        const actions = {
            '提交确认': () => {
                showCustomToast('提交成功！已提交至平台审核，审核通过后对方将收到确认通知');
                updateContractStatus('platform_reviewing');
            },
            '撤回申请': () => {
                showCustomToast('已撤回申请，可重新编辑合同内容');
                updateContractStatus('draft');
            },
            '重新提交': () => {
                showCustomToast('重新提交成功！已提交至平台审核');
                updateContractStatus('platform_reviewing');
            },
            '撤回确认': () => {
                showCustomToast('已撤回确认，可重新编辑合同');
                updateContractStatus('draft');
            },
            '驳回修改': () => {
                showCustomToast('已驳回修改！\n\n驳回原因：' + savedRejectReason + '\n\n系统已通知对方重新编辑');
                updateContractStatus('draft');
            },
            '确认合同': () => {
                showCustomToast('确认成功！请上传签约文件');
                updateContractStatus('confirmed');
            },
            '发起变更': () => {
                closeModal();
                showChangeModal();
                return; // 不执行后面的closeModal
            },
            '撤回变更': () => {
                showCustomToast('已撤回变更申请，阶段任务已恢复流转');
                updateContractStatus('signed');
            },
            '驳回变更': () => {
                showCustomToast('变更已驳回！\n\n驳回原因：' + savedRejectReason + '\n\n系统已通知对方驳回原因');
                updateContractStatus('signed');
            },
            '确认变更': () => {
                showCustomToast('变更已生效！');
                updateContractStatus('signed');
            },
            '撤回变更申请': () => {
                showCustomToast('已撤回变更申请，可重新编辑变更内容');
                updateContractStatus('signed');
            },
            '重新发起变更': () => {
                showCustomToast('重新提交成功！已提交至平台审核');
                updateContractStatus('change_platform_reviewing');
            },
            '确认签约': () => {
                showCustomToast('签约成功！合同已正式生效');
                updateContractStatus('signed');
            },
            // 工人合同新流程（方案 B）动作
            '撤回合同邀约': () => {
                ContractStore.withdrawConfirm(state.workerId);
                showCustomToast('已撤回确认，合同退回拟定中');
                renderWorkerFromStore();
            },
            '拒绝邀请': () => {
                ContractStore.rejectInvitation(state.workerId, state.asUserId);
                showCustomToast('已拒绝该合同邀约');
                renderWorkerFromStore();
            },
            '确认加入合同': () => {
                const res = ContractStore.confirmInvitation(state.workerId, state.asUserId);
                if (!res.ok) {
                    if (res.reason === 'taken') {
                        showCustomToast('手慢了，该合同已被他人确认（抢单失败）');
                    } else {
                        showCustomToast('操作失败，请刷新后重试');
                    }
                    renderWorkerFromStore();
                    return;
                }
                showCustomToast('确认成功！您已成为本合同乙方，已自动加入项目架构层级');
                renderWorkerFromStore();
            },
            '重新提交邀约': () => {
                closeModal();
                const c = ContractStore.getContract(state.workerId);
                const q = new URLSearchParams({
                    editId: state.workerId,
                    group: c ? c.group : '',
                    type: c ? c.type : ''
                });
                location.href = 'create-contract.html?' + q.toString();
                return;
            }
        };
        
        if (actions[titleText]) {
            actions[titleText]();
        } else {
            showCustomToast('操作成功！');
        }
        
        closeModal();
    }
    
    // ==================== 模板选择函数 ====================
    
    // 模板数据定义
    const contractTemplates = [
        {
            id: 'tpl_001',
            name: '基础施工服务合同标准版（北京）',
            type: '基础施工服务合同',
            city: '北京',
            updateTime: '2024-03-15',
            desc: '北京市基础施工服务合同标准范本，依托平台“全透明服务模式”，包含引言、支付约定、双方责权利、质量验收、变更、安全、违约、保修、道德自律、生效与终止、平台服务费等完整条款',
            content: '基础施工服务合同\n\n一、引言（平台服务模式与保障）\n为了杜绝行业乱象，良造家平台创造并践行以"成本+利润+责任"为主的"全透明服务模式"，将涉及装修的各项成本、利润、服务责任、自罚承诺等，都真实透明地内部公开给甲方，特别是推出"服务方先服务、后收款"，"谁服务，谁收款"，革命性地让甲方掌控主动权。\n依托全透明服务模式，建立覆盖施工全流程的数字化体系，让每一步操作有据可查、每一份责任清晰可溯，推动装修服务走向规范化、标准化、品质化。\n通过法律、合约、制度、道德、技术——“五项保障体系”，努力让甲方真实感受到"有信心、能放心、可省心、很安心、好舒心"——“五心服务”体验。\n\n二、支付约定\n（1） 施工班组验收合格，直接支付到工人银行卡账号，甲方也可委托乙方进行支付\n（2） 辅料的材料费送货到场验收合格，甲方直接支付给供货商\n（3） 质保金支付到亿大造平台公司，质保期结束后由亿大造公司支付给乙方，质保金相关条款详见第八项\n（4） 先票后款，甲方承担收款方开具发票的税点成本，甲方一般在支付施工费时同时支付发票税点成本。\n\n三、甲乙双方责权利\n1）甲方权力\n1. 甲方有权据实投诉能力不够、显著违约、服务态度差、道德败坏的项目服务人员，并提出撤换；\n2. 甲方有权向所有服务方直接付款，坚持"谁服务、谁收款"；\n3. 甲方有权查证或举证所有费用开支的真实性，如查实开支造假，依据道德自律承诺书相关条款执行；\n4. 甲方有权监督验收乙方履行各项合同义务；\n5. 甲方有权在质量验收不合格的情况下拒绝支付相关款项；\n6. 甲方有权审核乙方编制的各项计划、方案等文件；\n7. 甲方有权根据自己的需求变更施工方案；\n8. 甲方有权参加材料、设备等进场验收，各节点验收、竣工验收。\n2）甲方责任\n1. 提供房屋结构、水、电、暖通等设备的技术资料；\n2. 办理施工项目需要各部门审批的手续并支付所有费用；\n3. 提供施工场地及施工过程中的用水、用电；\n4. 按照合同约定进行款项支付；\n5. 严格执行国家安全生产、环境保护等有关规定，不得强令乙方进行违章施工作业。\n3）乙方权力\n1. 有权根据现场施工情况进行自方资源调派，并合理安排施工；\n2. 有权监督甲方履行合同任务；\n3. 有权拒绝甲方违法的施工要求。\n4）乙方责任（详见任务清单）\n1. 对施工图纸进行提疑，并全程参加图纸会审接受设计师各项交底；\n2. 按照流程要求接受设计师交底，并在交底过程中配合相关放线工作；\n3. 按照要求跟所有进场施工的班组签订班组合同；\n4. 按照要求及相关标准对施工班组进行各项交底，并确认班组施工前已经理解交底内容；\n5. 按照要求及相关标准给有交叉施工的主材施工单位进行交底；\n6. 按照规范及标准给施工班组的各流程进行验收，不合格项提出整改；\n7. 按照任务约定每周完成至少3次巡检任务，并提报巡查单；\n8. 按照任务约定每周召开一次班组例会，并提报会议纪要；\n9. 遵守园区及政府相关部门的管理规定；\n10. 在未征得甲方同意的情况下，乙方不得泄露甲方个人、房屋等信息；\n11. 乙方应配合甲方其他分包进场后的交叉施工。\n\n四、质量验收约定\n1、 本工程应满足北京市装修施工质量验收标准以及行业质量验收标准；\n2、 本工程应满足合同附件中约定的《施工工艺及质量验收标准》；\n3、 本工程由乙方提供的材料应满足报价清单中的相关品牌、型号及标准；\n4、 当第1条和第2条中约定的相关标准有冲突时应按照第2条执行；\n5、 验收流程执行四部验收法：①班组自检②工长预检③正式验收④班组交接互检；\n6、 本工程约定如下几个验收节点：①水电隐蔽验收②木工基层验收③木工面层验收④瓦工基层验收⑤防水验收⑥瓦工面层验收⑦基础装修完工验收（油工）；\n7、 节点验收要求：凡涉及以上验收节点甲乙双方必须共同参与，并对验收结果进行签字确认；乙方应负责在验收节点前48小时通知各验收参与方具体验收时间；验收不签字、不参与、时间之后，视为合格。\n\n五、变更约定\n1、 甲方不变更方案，增项金额（超出原合同额）不能超过3%，超出部分由乙方自行承担；\n2、 由于甲方个人意愿需要调整施工方案的，应提前7天通知乙方停止该部位施工，由此造成的损失由甲方承担；\n3、 由于现场条件限制出现不能按照原方案执行的情况，乙方应提前7天通知甲方调整施工方案，并按照新方案对此部分的报价进行调整；\n4、 由于乙方工作失误造成的原方案不能落地执行，不论甲方是否同意变更方案，损失均由乙方承担；\n5、 变更部分发生的增减费用，应在变更同时及时调整合同金额，并按照相应节点增减相应支付费用；\n6、 由于以上原因调整施工方案的，必须在方案调整确认、双方报价签字确认后才能进行施工。\n\n六、安全约定\n1、 进场前甲方必须购买工程一切险和建工意外险（乙方配合）；\n2、 现场施工人员需购买意外保险，否则不能进场施工，如果进场施工发生事故乙方负全责；\n3、 乙方应在每个工人进场当天进行《安全文明施工规定》的培训；\n4、 乙方应按照消防规定在施工现场摆放足够的灭火器、水桶、沙桶等消防器材，并对进场工人进行使用培训；\n5、 由于乙方原因造成的安全事故，责任全部由乙方承担；由于甲方原因造成的安全事故，责任全部由甲方承担。\n\n七、违约约定\n1、 由于乙方原因不能按照合同约定的工期完成施工的，每延期一天支付合同额  ‰作为违约金赔偿甲方；由于甲方原因造成工期延误的，应对乙方窝工、人员往返等费用进行合理补偿；\n2、 由于乙方原因造成施工质量不达标的，乙方应彻底返修直到质量达标，由此造成的工期延误参照第1条；\n3、 甲方未按照合同约定支付工程款项的，每逾期一天按照合同额  ‰支付违约金；逾期超过  天的乙方有权解除合同；\n4、 违约方承担违约责任后，除满足法定或约定条件外，双方均应继续履行合同；\n5、 违约金不足以弥补守约方损失的（含人身伤害和财产损失），守约方有权追讨不足部分。\n\n八、保修约定\n1、 工程质量保修范围和内容：由于乙方施工原因导致的质量不合格；\n2、 质量保修期自工程竣工验收合格之日起计算：地下防水工程、有防水要求的卫生间、房间和外墙面的防渗漏为5年；供热与供冷系统为2个采暖期、供冷期；装修工程为2年；电气管线、给排水管道、设备安装工程为5年；\n3、 质保金额：结算金额的3%，由亿大造公司存管；\n4、 质保金返还周期：整体项目竣工验收通过满两年后7个工作日内支付50%，满五年后7个工作日内支付50%，由亿大造公司支付；\n5、 质量保修责任：属于保修范围的项目，乙方应在接到修理通知之日起2天内派人修理，紧急抢修应在3小时内到达现场。\n\n九、道德自律承诺条款\n1）乙方承诺：在整个服务过程中不做任何违反道德的事情，如有违反自愿赔偿非法所得。\n1、 搞恶意增项的，自罚30倍。\n2、 恶意虚增费用和费用造假的，自罚30倍。\n3、 商品以次充好和掺假调包的，自罚30倍。\n4、 私下侵吞业主财物的，自罚30倍。\n5、 知劣买劣、知假买假的，自罚30倍。\n6、 私下收取好处费、返佣、回扣等，自罚30倍。\n7、 耍手段胁迫甲方而获取不当利益的，自罚30倍。\n8、 故意使坏妨碍安全、质量、工期造成损失的，自罚10倍。\n9、 无条件接受社会舆论公开谴责。\n2）取证与执行：甲方自行取证或上报平台；乙方直接按非法所得金额的倍数赔偿客户并计入个人数字档案；如乙方拒绝赔偿，甲方有权通知平台方换人且扣除乙方押金，平台代为追责。\n\n十、合同生效、终止条件、不可抗力\n1、 本合同需在满足《亿大造公司规则》的前提下签订，并遵守平台相关协议。\n2、 本合同经甲方、乙方签名盖章（合同章或公章）后即生效。本合同壹式叁份，甲乙各持壹份，有关附件、补充文件及各方认可的邮件、会谈纪要、微信记录等，均为本合同组成部分。\n3、 符合下列条件之一的，合同终止：①乙方履行完约定服务，甲方按约结算的；②各方协商一致终止的；③约定的其他终止条件满足时。\n4、 合作终止后，须在10个工作日内各方完成相关事务处理，含甲方付清发票成本等相关款项。\n5、 不可抗力包括疫情、恶劣天气、区域政策管制等导致工程出现重大阻碍的因素，一方因此未圆满履约的，不承担违约责任。\n\n十一、亿大造平台服务费用\n1、 亿大造公司为甲方提供优质的服务资源、签约审核、线上施工过程监管、争议协调处理等服务。\n2、 亿大造公司收取甲方服务费用为：本合同金额的百分之三（3%），随合同履约完毕全额支付。\n\n甲方（签章）：______________    乙方（签章）：______________\n签订日期：____年__月__日        签订日期：____年__月__日'
        },
        {
            id: 'tpl_002',
            name: '基础施工服务合同简约版（北京）',
            type: '基础施工服务合同',
            city: '北京',
            updateTime: '2024-02-20',
            desc: '简约版基础施工服务合同，仅保留引言、支付、质量验收、保修与道德自律等核心条款，适合简单合作',
            content: '基础施工服务合同（简约版）\n\n一、服务模式\n本合同依托平台"全透明服务模式"签订，推行"服务方先服务、后收款"、"谁服务、谁收款"，甲方掌控主动权。\n\n二、支付约定\n1. 施工班组验收合格，直接支付到工人银行卡账号；\n2. 辅料材料费送货到场验收合格，甲方直接支付给供货商；\n3. 质保金为结算金额的3%，由亿大造公司存管，质保期结束后支付；\n4. 先票后款，甲方承担收款方开具发票的税点成本。\n\n三、质量验收约定\n1. 本工程应满足北京市装修施工质量验收标准及合同附件《施工工艺及质量验收标准》；\n2. 验收执行四部验收法：①班组自检②工长预检③正式验收④班组交接互检；\n3. 验收节点：①水电隐蔽验收②木工基层验收③木工面层验收④瓦工基层验收⑤防水验收⑥瓦工面层验收⑦基础装修完工验收（油工）；\n4. 节点验收甲乙双方须共同参与并签字确认，验收不签字、不参与、时间之后，视为合格。\n\n四、变更与安全\n1. 甲方不变更方案，增项金额不能超过原合同额的3%，超出部分由乙方承担；\n2. 进场前甲方须购买工程一切险和建工意外险，施工人员须购买意外保险后进场；\n3. 因乙方原因造成的安全事故由乙方承担，因甲方原因造成的由甲方承担。\n\n五、保修约定\n1. 保修范围：由于乙方施工原因导致的质量不合格；\n2. 质量保修期自竣工验收合格之日起计算，装修工程2年，防水及电气管线、给排水管道5年；\n3. 质保金为结算金额的3%，竣工验收满两年后支付50%，满五年后支付50%。\n\n六、道德自律承诺\n1. 搞恶意增项、虚增费用、以次充好、侵吞财物、收取回扣的，自罚30倍；\n2. 故意妨碍安全、质量、工期造成损失的，自罚10倍；\n3. 无条件接受社会舆论公开谴责。\n\n七、合同生效与平台服务费\n1. 本合同经甲乙双方签名盖章后生效，壹式叁份；\n2. 亿大造公司收取甲方服务费为本合同金额的3%，随合同履约完毕全额支付。\n\n甲方（签章）：______________    乙方（签章）：______________\n日期：____年__月__日'
        }
    ];
    
    const stageTemplates = [
        {
            id: 'stage_tpl_001',
            name: '基础施工标准阶段模板',
            type: '基础施工服务合同',
            city: '北京',
            updateTime: '2024-03-10',
            desc: '基础施工标准阶段划分，包含进场前准备、拆除、水电、木工、瓦工、基础施工完工（油工）、现场管理及主材产品配合共7个阶段',
            stages: [
                { name: '进场前准备阶段', tasks: [{ name: '组织全屋放线' }, { name: '组织开工交底、验线和验辅料' }] },
                { name: '拆除施工阶段', tasks: [{ name: '签订《拆除班组合同》' }, { name: '给拆除班组进场交底' }, { name: '拆除施工完工验收' }] },
                { name: '水电施工阶段', tasks: [{ name: '签订《水电班组合同》' }, { name: '给水电班组进场交底' }, { name: '水电施工完工验收' }] },
                { name: '木工施工阶段', tasks: [{ name: '签订《木工班组合同》' }, { name: '给木工班组进场交底' }, { name: '木工基层完工验收' }, { name: '木工面层完工验收' }] },
                { name: '瓦工施工阶段', tasks: [{ name: '签订《瓦工班组合同》' }, { name: '给瓦工班组进场交底' }, { name: '瓦工基层完工验收' }, { name: '防水隐蔽验收' }, { name: '瓦工面层完工验收' }] },
                { name: '基础施工完工阶段（油工阶段）', tasks: [{ name: '签订《油工班组合同》' }, { name: '给油工班组进场交底' }, { name: '油工基层完工验收' }, { name: '油工面层完工验收' }, { name: '基础施工完工验收' }] },
                { name: '现场管理及主材产品配合阶段', tasks: [{ name: '现场巡查' }, { name: '现场例会' }, { name: '进度播报' }, { name: '通知主材产品测量' }, { name: '与主材产品方案交底' }, { name: '结算申请' }] }
            ]
        },
        {
            id: 'stage_tpl_002',
            name: '基础施工简约阶段模板',
            type: '基础施工服务合同',
            city: '北京',
            updateTime: '2024-02-15',
            desc: '基础施工简约阶段划分，仅包含进场准备、水电、瓦木油施工、完工验收4个主要阶段',
            stages: [
                { name: '进场准备阶段', tasks: [{ name: '组织全屋放线' }, { name: '组织开工交底、验线和验辅料' }] },
                { name: '水电施工阶段', tasks: [{ name: '签订《水电班组合同》' }, { name: '给水电班组进场交底' }, { name: '水电施工完工验收' }] },
                { name: '瓦木油施工阶段', tasks: [{ name: '瓦工基层完工验收' }, { name: '防水隐蔽验收' }, { name: '木工面层完工验收' }, { name: '油工面层完工验收' }] },
                { name: '完工验收阶段', tasks: [{ name: '基础施工完工验收' }, { name: '结算申请' }] }
            ]
        }
    ];
    
    // 当前选中的模板（用于预览后应用）
    let currentPreviewTemplate = null;
    let currentTemplateType = '';
    
    /**
     * 显示合同模板选择弹窗
     */
    function showTemplatePicker() {
        const modal = document.getElementById('templatePickerModal');
        if (modal) {
            modal.style.display = 'block';
            modal.classList.add('show');
            renderContractTemplateList();
        }
    }
    
    /**
     * 显示阶段模板选择弹窗
     */
    function showStageTemplatePicker() {
        const modal = document.getElementById('stageTemplateModal');
        if (modal) {
            modal.style.display = 'block';
            modal.classList.add('show');
            renderStageTemplateList();
        }
    }
    
    /**
     * 关闭合同模板选择弹窗
     */
    function closeTemplatePicker() {
        const modal = document.getElementById('templatePickerModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
    }
    
    /**
     * 关闭阶段模板选择弹窗
     */
    function closeStageTemplatePicker() {
        const modal = document.getElementById('stageTemplateModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
    }
    
    /**
     * 关闭模板预览弹窗
     */
    function closeTemplatePreviewModal() {
        const modal = document.getElementById('templatePreviewModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
    }
    
    /**
     * 渲染合同模板列表
     */
    function renderContractTemplateList() {
        const listContainer = document.getElementById('templateSelectList');
        const emptyContainer = document.getElementById('templateEmpty');
        if (!listContainer) return;
        
        const filteredTemplates = contractTemplates.filter(function(tpl) {
            return tpl.city === '北京' && tpl.type === '基础施工服务合同';
        });
        
        if (filteredTemplates.length === 0) {
            listContainer.innerHTML = '';
            if (emptyContainer) emptyContainer.style.display = 'block';
            return;
        }
        
        if (emptyContainer) emptyContainer.style.display = 'none';
        
        listContainer.innerHTML = filteredTemplates.map(function(tpl) {
            return '<div class="template-select-item">' +
                '<div class="item-left"><div class="item-icon">📄</div></div>' +
                '<div class="item-content">' +
                    '<div class="item-name">' + tpl.name + '</div>' +
                    '<div class="item-desc">' + tpl.desc + '</div>' +
                    '<div class="item-meta">' +
                        '<span class="meta-tag">' + tpl.type + '</span>' +
                        '<span class="meta-tag">' + tpl.city + '</span>' +
                        '<span class="meta-tag">更新于 ' + tpl.updateTime + '</span>' +
                    '</div>' +
                '</div>' +
                '<div class="item-actions">' +
                    '<div class="action-btn primary" onclick="ContractDetailPage.applyTemplateDirectly(\'' + tpl.id + '\')">使用</div>' +
                    '<div class="action-btn secondary" onclick="ContractDetailPage.previewTemplate(\'' + tpl.id + '\')">预览</div>' +
                '</div>' +
            '</div>';
        }).join('');
    }
    
    /**
     * 渲染阶段模板列表
     */
    function renderStageTemplateList() {
        const listContainer = document.getElementById('stageTemplateSelectList');
        const emptyContainer = document.getElementById('stageTemplateEmpty');
        if (!listContainer) return;
        
        const filteredTemplates = stageTemplates.filter(function(tpl) {
            return tpl.city === '北京' && tpl.type === '基础施工服务合同';
        });
        
        if (filteredTemplates.length === 0) {
            listContainer.innerHTML = '';
            if (emptyContainer) emptyContainer.style.display = 'block';
            return;
        }
        
        if (emptyContainer) emptyContainer.style.display = 'none';
        
        listContainer.innerHTML = filteredTemplates.map(function(tpl) {
            const stageCount = tpl.stages.length;

            return '<div class="stage-template-select-item">' +
                '<div class="item-left"><div class="item-icon">📝</div></div>' +
                '<div class="item-content">' +
                    '<div class="item-name">' + tpl.name + '</div>' +
                    '<div class="item-desc">' + tpl.desc + '</div>' +
                    '<div class="item-meta">' +
                        '<span class="meta-tag">' + stageCount + '个阶段</span>' +
                        '<span class="meta-tag">' + tpl.city + '</span>' +
                    '</div>' +
                '</div>' +
                '<div class="item-actions">' +
                    '<div class="action-btn primary" onclick="ContractDetailPage.applyStageTemplateDirectly(\'' + tpl.id + '\')">使用</div>' +
                    '<div class="action-btn secondary" onclick="ContractDetailPage.previewStageTemplate(\'' + tpl.id + '\')">预览</div>' +
                '</div>' +
            '</div>';
        }).join('');
    }
    
    /**
     * 直接应用合同模板
     */
    function applyTemplateDirectly(templateId) {
        const tpl = contractTemplates.find(function(t) { return t.id === templateId; });
        if (!tpl) return;
        applyContractTemplate(tpl);
        closeTemplatePicker();
    }
    
    /**
     * 直接应用阶段模板
     */
    function applyStageTemplateDirectly(templateId) {
        const tpl = stageTemplates.find(function(t) { return t.id === templateId; });
        if (!tpl) return;
        applyStageTemplate(tpl);
        closeStageTemplatePicker();
    }
    
    /**
     * 预览合同模板
     */
    function previewTemplate(templateId) {
        const tpl = contractTemplates.find(function(t) { return t.id === templateId; });
        if (!tpl) return;
        
        currentPreviewTemplate = tpl;
        currentTemplateType = 'contract';
        
        document.getElementById('previewTemplateName').textContent = tpl.name;
        document.getElementById('previewTemplateType').textContent = tpl.type;
        document.getElementById('previewTemplateCity').textContent = tpl.city;
        document.getElementById('previewTemplateUpdateTime').textContent = tpl.updateTime;
        
        const previewContent = document.getElementById('templatePreviewContent');
        if (previewContent) {
            previewContent.innerHTML = '<div class="preview-section">' +
                '<div class="preview-section-title">合同正文</div>' +
                '<div class="preview-section-content">' + tpl.content + '</div>' +
            '</div>';
        }
        
        const previewModal = document.getElementById('templatePreviewModal');
        if (previewModal) {
            previewModal.style.display = 'block';
            previewModal.classList.add('show');
        }
    }
    
    /**
     * 预览阶段模板
     */
    function previewStageTemplate(templateId) {
        const tpl = stageTemplates.find(function(t) { return t.id === templateId; });
        if (!tpl) return;
        
        currentPreviewTemplate = tpl;
        currentTemplateType = 'stage';
        
        document.getElementById('previewTemplateName').textContent = tpl.name;
        document.getElementById('previewTemplateType').textContent = tpl.type;
        document.getElementById('previewTemplateCity').textContent = tpl.city;
        document.getElementById('previewTemplateUpdateTime').textContent = tpl.updateTime;
        
        const previewContent = document.getElementById('templatePreviewContent');
        if (previewContent) {
            let stagesHtml = '<div class="preview-section">' +
                '<div class="preview-section-title">阶段任务明细</div>' +
                '<div class="preview-stage-list">';
            
            tpl.stages.forEach(function(stage, idx) {
                const tasksHtml = stage.tasks.map(function(task) {
                    return '<div class="preview-task-item">' +
                        '<span class="preview-task-name">' + task.name + '</span>' +
                    '</div>';
                }).join('');
                
                stagesHtml += '<div class="preview-stage-item">' +
                    '<div class="preview-stage-header">' +
                        '<span class="preview-stage-num">' + (idx + 1) + '</span>' +
                        '<span class="preview-stage-name">' + stage.name + '</span>' +
                    '</div>' +
                    '<div class="preview-task-list">' + tasksHtml + '</div>' +
                '</div>';
            });
            
            stagesHtml += '</div></div>';
            previewContent.innerHTML = stagesHtml;
        }
        
        const previewModal = document.getElementById('templatePreviewModal');
        if (previewModal) {
            previewModal.style.display = 'block';
            previewModal.classList.add('show');
        }
    }
    
    /**
     * 从预览弹窗应用模板
     */
    function applyTemplateFromPreview() {
        if (!currentPreviewTemplate) return;
        
        if (currentTemplateType === 'contract') {
            applyContractTemplate(currentPreviewTemplate);
        } else if (currentTemplateType === 'stage') {
            applyStageTemplate(currentPreviewTemplate);
        }
        
        closeTemplatePreviewModal();
    }
    
    /**
     * 应用合同模板到编辑表单
     */
    function applyContractTemplate(tpl) {
        const templateInfo = document.getElementById('contractTemplateInfo');
        const contentInput = document.getElementById('editContractContent');

        if (templateInfo) {
            templateInfo.style.display = 'block';
            templateInfo.querySelector('.template-tag').textContent = '已选择模板：' + tpl.name;
            const hint = templateInfo.querySelector('.template-hint');
            if (hint) hint.textContent = '已套用模板，可点「编辑正文」修改完整内容';
        }

        if (contentInput) {
            // 套用模板：用模板正文作为起点替换编辑区（纯文本按段落渲染为可编辑 HTML）
            contentInput.innerHTML = formatTemplateContentToHtml(tpl.content);
        }

        showCustomToast('已应用模板：' + tpl.name);
        closeTemplatePicker();
    }
    
    /**
     * 应用阶段模板到编辑表单
     * 说明：输出结构与默认草稿阶段卡片（.stage-card，见 renderStagesFromSnapshot）完全一致，
     * 以便 collectDraftSnapshot / validateDraft 能正确读取，且「添加任务/删除任务/是否按序执行/
     * 编辑及删除任务/添加阶段」交互与默认展示保持一致，不含金额字段。
     */
    function applyStageTemplate(tpl) {
        const stageList = document.getElementById('editStageList');
        if (!stageList) return;

        stageList.innerHTML = '';
        (tpl.stages || []).forEach(function (stage) {
            const tasksHtml = (stage.tasks || []).map(function (task) {
                return '<div class="task-edit-item" data-executor="" data-confirmers="">' +
                    '<input type="text" class="task-input" value="' + escapeAttr(task.name) + '" placeholder="任务名称">' +
                    '<div class="task-action-btn edit" onclick="editTaskDetail(this)" title="编辑详情">✎</div>' +
                    '<div class="task-action-btn" onclick="deleteTask(this)">×</div>' +
                '</div>';
            }).join('');

            const card = document.createElement('div');
            card.className = 'stage-card';
            card.innerHTML =
                '<div class="stage-card-header">' +
                    '<div class="stage-card-header-row">' +
                        '<input type="text" class="stage-name-input" value="' + escapeAttr(stage.name) + '" placeholder="请输入阶段名称">' +
                        '<div class="stage-sequential">' +
                            '<span>按序执行</span>' +
                            '<div class="switch' + (stage.sequential ? ' active' : '') + '" onclick="toggleStageSequential(this)"></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="stage-card-header-row">' +
                        '<div class="stage-actions">' +
                            '<div class="stage-action-btn add" onclick="addTaskToStage(this)">+ 添加任务</div>' +
                            '<div class="stage-action-btn delete" onclick="deleteStage(this)">× 删除阶段</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="task-edit-list">' + tasksHtml + '</div>';
            stageList.appendChild(card);
        });

        const templateInfo = document.getElementById('stageTemplateInfo');
        if (templateInfo) {
            templateInfo.style.display = 'block';
            templateInfo.querySelector('.template-tag').textContent = '已选择模板：' + tpl.name;
        }

        showCustomToast('已应用模板：' + tpl.name);
        closeStageTemplatePicker();
    }
    
    /**
     * 上传附件
     */
    function uploadAttachment() {
        showCustomToast('请选择要上传的文件');
    }
    
    /**
     * 删除附件
     */
    function removeAttachment(index) {
        const attachmentList = document.getElementById('editAttachmentList');
        if (!attachmentList) return;
        
        const attachments = attachmentList.querySelectorAll('.attachment-item');
        if (attachments[index]) {
            attachments[index].remove();
        }
    }
    
    // ==================== 版本记录函数 ====================
    
    /**
     * 显示版本记录弹窗
     */
    function showVersionModal() {
        updateVersionContent();
        const modal = document.getElementById('versionModal');
        if (modal) modal.classList.add('show');
    }
    
    /**
     * 更新版本内容
     */
    function updateVersionContent() {
        const versionList = document.getElementById('versionList');
        const statusFlowTimeline = document.getElementById('statusFlowTimeline');
        
        const versionData = getVersionData();
        const data = versionData[state.currentStatus] || versionData['default'];
        
        if (versionList) {
            versionList.innerHTML = data.versions.map(v => `
                <div class="version-item">
                    <div class="version-tag ${v.current ? 'current' : ''}">${v.tag}</div>
                    <div class="version-info">
                        <div class="version-name">${v.name}</div>
                        <div class="version-desc">${v.desc}</div>
                        <div class="version-date">${v.date}</div>
                    </div>
                    <div class="view-btn">查看</div>
                </div>
            `).join('');
        }
        
        if (statusFlowTimeline) {
            statusFlowTimeline.innerHTML = data.timeline.map(t => `
                <div class="timeline-item">
                    <div class="timeline-dot ${t.type}"></div>
                    <div class="timeline-content">
                        <div class="timeline-title">${t.title}</div>
                        <div class="timeline-desc">${t.desc}</div>
                        <div class="timeline-time">${t.time}</div>
                    </div>
                </div>
            `).join('');
        }
    }
    
    /**
     * 获取版本数据
     * @returns {Object} 版本数据
     */
    function getVersionData() {
        return {
            'draft': {
                versions: [
                    { tag: 'V1', name: '初始版本（草稿）', desc: '合同创建中', date: '2024-01-05 创建', current: true }
                ],
                timeline: [
                    { title: '创建合同', desc: '拟定中', time: '2024-01-05 10:00', type: 'primary' }
                ]
            },
            'platform_reviewing': {
                versions: [
                    { tag: 'V1', name: '初始版本（待审核）', desc: '已提交平台审核', date: '2024-01-05 创建', current: true }
                ],
                timeline: [
                    { title: '创建合同', desc: '拟定中', time: '2024-01-05 10:00', type: 'success' },
                    { title: '提交确认', desc: '进入平台审核', time: '2024-01-06 14:30', type: 'primary' }
                ]
            },
            'platform_rejected': {
                versions: [
                    { tag: 'V1', name: '初始版本（已驳回）', desc: '审核未通过', date: '2024-01-05 创建', current: true }
                ],
                timeline: [
                    { title: '创建合同', desc: '拟定中', time: '2024-01-05 10:00', type: 'success' },
                    { title: '提交确认', desc: '进入平台审核', time: '2024-01-06 14:30', type: 'success' },
                    { title: '平台审核驳回', desc: '驳回原因：合同条款不完整', time: '2024-01-07 09:15', type: 'error' }
                ]
            },
            'confirming_sender': {
                versions: [
                    { tag: 'V1', name: '初始版本', desc: '等待对方确认', date: '2024-01-05 创建', current: true }
                ],
                timeline: [
                    { title: '创建合同', desc: '拟定中', time: '2024-01-05 10:00', type: 'success' },
                    { title: '提交确认', desc: '进入平台审核', time: '2024-01-06 14:30', type: 'success' },
                    { title: '平台审核通过', desc: '审核人：运营专员李华', time: '2024-01-07 09:15', type: 'success' }
                ]
            },
            'confirming_receiver': {
                versions: [
                    { tag: 'V1', name: '初始版本', desc: '待我方确认', date: '2024-01-05 创建', current: true }
                ],
                timeline: [
                    { title: '创建合同', desc: '拟定中', time: '2024-01-05 10:00', type: 'success' },
                    { title: '提交确认', desc: '进入平台审核', time: '2024-01-06 14:30', type: 'success' },
                    { title: '平台审核通过', desc: '审核人：运营专员李华', time: '2024-01-07 09:15', type: 'success' }
                ]
            },
            'confirmed': {
                versions: [
                    { tag: 'V1', name: '初始版本', desc: '双方已确认，待签约', date: '2024-01-05 创建', current: true }
                ],
                timeline: [
                    { title: '创建合同', desc: '拟定中', time: '2024-01-05 10:00', type: 'success' },
                    { title: '提交确认', desc: '进入平台审核', time: '2024-01-06 14:30', type: 'success' },
                    { title: '平台审核通过', desc: '审核人：运营专员李华', time: '2024-01-07 09:15', type: 'success' },
                    { title: '乙方确认合同', desc: '确认人：XX装修公司', time: '2024-01-08 16:20', type: 'success' }
                ]
            },
            'signed': {
                versions: [
                    { tag: 'V1', name: '初始版本', desc: '首次签约版本', date: '2024-01-10 签约生效', current: true }
                ],
                timeline: [
                    { title: '创建合同', desc: '拟定中', time: '2024-01-05 10:00', type: 'success' },
                    { title: '提交确认', desc: '进入平台审核', time: '2024-01-06 14:30', type: 'success' },
                    { title: '平台审核通过', desc: '审核人：运营专员李华', time: '2024-01-07 09:15', type: 'success' },
                    { title: '乙方确认合同', desc: '确认人：XX装修公司', time: '2024-01-08 16:20', type: 'success' },
                    { title: '上传签约文件', desc: '上传人：张三，合同正式生效（V1版本）', time: '2024-01-10 15:30', type: 'success' }
                ]
            },
            'changing': {
                versions: [
                    { tag: 'V1', name: '初始版本', desc: '首次签约版本', date: '2024-01-10 签约生效', current: true }
                ],
                timeline: [
                    { title: '创建合同', desc: '拟定中', time: '2024-01-05 10:00', type: 'success' },
                    { title: '提交确认', desc: '进入平台审核', time: '2024-01-06 14:30', type: 'success' },
                    { title: '平台审核通过', desc: '审核人：运营专员李华', time: '2024-01-07 09:15', type: 'success' },
                    { title: '乙方确认合同', desc: '确认人：XX装修公司', time: '2024-01-08 16:20', type: 'success' },
                    { title: '上传签约文件', desc: '上传人：张三，合同正式生效（V1版本）', time: '2024-01-10 15:30', type: 'success' },
                    { title: '发起变更', desc: '变更类型：仅阶段任务变更', time: '2024-02-12 10:00', type: 'primary' }
                ]
            },
            'change_confirming': {
                versions: [
                    { tag: 'V1', name: '初始版本', desc: '首次签约版本', date: '2024-01-10 签约生效', current: true }
                ],
                timeline: [
                    { title: '创建合同', desc: '拟定中', time: '2024-01-05 10:00', type: 'success' },
                    { title: '提交确认', desc: '进入平台审核', time: '2024-01-06 14:30', type: 'success' },
                    { title: '平台审核通过', desc: '审核人：运营专员李华', time: '2024-01-07 09:15', type: 'success' },
                    { title: '乙方确认合同', desc: '确认人：XX装修公司', time: '2024-01-08 16:20', type: 'success' },
                    { title: '上传签约文件', desc: '上传人：张三，合同正式生效（V1版本）', time: '2024-01-10 15:30', type: 'success' },
                    { title: '发起变更', desc: '变更类型：仅阶段任务变更', time: '2024-02-12 10:00', type: 'primary' }
                ]
            },
            'change_platform_reviewing': {
                versions: [
                    { tag: 'V1', name: '初始版本', desc: '首次签约版本', date: '2024-01-10 签约生效', current: true }
                ],
                timeline: [
                    { title: '创建合同', desc: '拟定中', time: '2024-01-05 10:00', type: 'success' },
                    { title: '提交确认', desc: '进入平台审核', time: '2024-01-06 14:30', type: 'success' },
                    { title: '平台审核通过', desc: '审核人：运营专员李华', time: '2024-01-07 09:15', type: 'success' },
                    { title: '乙方确认合同', desc: '确认人：XX装修公司', time: '2024-01-08 16:20', type: 'success' },
                    { title: '上传签约文件', desc: '上传人：张三，合同正式生效（V1版本）', time: '2024-01-10 15:30', type: 'success' },
                    { title: '发起变更', desc: '变更类型：含其他内容变更', time: '2024-02-12 10:00', type: 'warning' },
                    { title: '提交平台审核', desc: '等待平台审核', time: '2024-02-12 10:05', type: 'primary' }
                ]
            },
            'change_platform_rejected': {
                versions: [
                    { tag: 'V1', name: '初始版本', desc: '首次签约版本', date: '2024-01-10 签约生效', current: true }
                ],
                timeline: [
                    { title: '创建合同', desc: '拟定中', time: '2024-01-05 10:00', type: 'success' },
                    { title: '提交确认', desc: '进入平台审核', time: '2024-01-06 14:30', type: 'success' },
                    { title: '平台审核通过', desc: '审核人：运营专员李华', time: '2024-01-07 09:15', type: 'success' },
                    { title: '乙方确认合同', desc: '确认人：XX装修公司', time: '2024-01-08 16:20', type: 'success' },
                    { title: '上传签约文件', desc: '上传人：张三，合同正式生效（V1版本）', time: '2024-01-10 15:30', type: 'success' },
                    { title: '发起变更', desc: '变更类型：含其他内容变更', time: '2024-02-12 10:00', type: 'warning' },
                    { title: '提交平台审核', desc: '等待平台审核', time: '2024-02-12 10:05', type: 'success' },
                    { title: '平台审核驳回', desc: '驳回原因：变更内容不符合规范', time: '2024-02-13 09:00', type: 'error' }
                ]
            },
            'change_confirming_sender': {
                versions: [
                    { tag: 'V1', name: '初始版本', desc: '首次签约版本', date: '2024-01-10 签约生效', current: true }
                ],
                timeline: [
                    { title: '创建合同', desc: '拟定中', time: '2024-01-05 10:00', type: 'success' },
                    { title: '提交确认', desc: '进入平台审核', time: '2024-01-06 14:30', type: 'success' },
                    { title: '平台审核通过', desc: '审核人：运营专员李华', time: '2024-01-07 09:15', type: 'success' },
                    { title: '乙方确认合同', desc: '确认人：XX装修公司', time: '2024-01-08 16:20', type: 'success' },
                    { title: '上传签约文件', desc: '上传人：张三，合同正式生效（V1版本）', time: '2024-01-10 15:30', type: 'success' },
                    { title: '发起变更', desc: '变更类型：含其他内容变更', time: '2024-02-12 10:00', type: 'warning' },
                    { title: '提交平台审核', desc: '等待平台审核', time: '2024-02-12 10:05', type: 'success' },
                    { title: '平台审核通过', desc: '审核人：运营专员王芳', time: '2024-02-13 14:00', type: 'success' }
                ]
            },
            'change_confirming_receiver': {
                versions: [
                    { tag: 'V1', name: '初始版本', desc: '首次签约版本', date: '2024-01-10 签约生效', current: true }
                ],
                timeline: [
                    { title: '创建合同', desc: '拟定中', time: '2024-01-05 10:00', type: 'success' },
                    { title: '提交确认', desc: '进入平台审核', time: '2024-01-06 14:30', type: 'success' },
                    { title: '平台审核通过', desc: '审核人：运营专员李华', time: '2024-01-07 09:15', type: 'success' },
                    { title: '乙方确认合同', desc: '确认人：XX装修公司', time: '2024-01-08 16:20', type: 'success' },
                    { title: '上传签约文件', desc: '上传人：张三，合同正式生效（V1版本）', time: '2024-01-10 15:30', type: 'success' },
                    { title: '发起变更', desc: '变更类型：含其他内容变更', time: '2024-02-12 10:00', type: 'warning' },
                    { title: '提交平台审核', desc: '等待平台审核', time: '2024-02-12 10:05', type: 'success' },
                    { title: '平台审核通过', desc: '审核人：运营专员王芳', time: '2024-02-13 14:00', type: 'success' }
                ]
            },
            'change_signing_wait': {
                versions: [
                    { tag: 'V1', name: '初始版本', desc: '首次签约版本', date: '2024-01-10 签约生效', current: true }
                ],
                timeline: [
                    { title: '创建合同', desc: '拟定中', time: '2024-01-05 10:00', type: 'success' },
                    { title: '提交确认', desc: '进入平台审核', time: '2024-01-06 14:30', type: 'success' },
                    { title: '平台审核通过', desc: '审核人：运营专员李华', time: '2024-01-07 09:15', type: 'success' },
                    { title: '乙方确认合同', desc: '确认人：XX装修公司', time: '2024-01-08 16:20', type: 'success' },
                    { title: '上传签约文件', desc: '上传人：张三，合同正式生效（V1版本）', time: '2024-01-10 15:30', type: 'success' },
                    { title: '发起变更', desc: '变更类型：含其他内容变更', time: '2024-02-12 10:00', type: 'warning' },
                    { title: '提交平台审核', desc: '等待平台审核', time: '2024-02-12 10:05', type: 'success' },
                    { title: '平台审核通过', desc: '审核人：运营专员王芳', time: '2024-02-13 14:00', type: 'success' },
                    { title: '变更确认', desc: '确认人：XX装修公司', time: '2024-02-15 10:00', type: 'success' }
                ]
            },
            'change_confirming_rejected': {
                versions: [
                    { tag: 'V1', name: '初始版本', desc: '首次签约版本', date: '2024-01-10 签约生效', current: true }
                ],
                timeline: [
                    { title: '创建合同', desc: '拟定中', time: '2024-01-05 10:00', type: 'success' },
                    { title: '提交确认', desc: '进入平台审核', time: '2024-01-06 14:30', type: 'success' },
                    { title: '平台审核通过', desc: '审核人：运营专员李华', time: '2024-01-07 09:15', type: 'success' },
                    { title: '乙方确认合同', desc: '确认人：XX装修公司', time: '2024-01-08 16:20', type: 'success' },
                    { title: '上传签约文件', desc: '上传人：张三，合同正式生效（V1版本）', time: '2024-01-10 15:30', type: 'success' },
                    { title: '发起变更', desc: '变更类型：含其他内容变更', time: '2024-02-12 10:00', type: 'warning' },
                    { title: '提交平台审核', desc: '等待平台审核', time: '2024-02-12 10:05', type: 'success' },
                    { title: '平台审核通过', desc: '审核人：运营专员王芳', time: '2024-02-13 14:00', type: 'success' },
                    { title: '变更确认方驳回', desc: '驳回原因：变更内容与现场实际情况不符', time: '2024-02-15 10:00', type: 'error' }
                ]
            },
            'change_confirmed': {
                versions: [
                    { tag: 'V2', name: '变更版本', desc: '变更内容：新增"收尾阶段"，包含2个任务', date: '2024-02-15 变更生效', current: true },
                    { tag: 'V1', name: '初始版本', desc: '首次签约版本，共4个阶段12个任务', date: '2024-01-10 签约生效', current: false }
                ],
                timeline: [
                    { title: '创建合同', desc: '拟定中', time: '2024-01-05 10:00', type: 'success' },
                    { title: '提交确认', desc: '进入平台审核', time: '2024-01-06 14:30', type: 'success' },
                    { title: '平台审核通过', desc: '审核人：运营专员李华', time: '2024-01-07 09:15', type: 'success' },
                    { title: '乙方确认合同', desc: '确认人：XX装修公司', time: '2024-01-08 16:20', type: 'success' },
                    { title: '上传签约文件', desc: '上传人：张三，合同正式生效（V1版本）', time: '2024-01-10 15:30', type: 'success' },
                    { title: '发起变更', desc: '变更类型：仅阶段任务变更', time: '2024-02-12 10:00', type: 'warning' },
                    { title: '变更确认', desc: '确认人：XX装修公司', time: '2024-02-15 10:00', type: 'success' },
                    { title: '变更生效', desc: '变更版本（V2）正式生效', time: '2024-02-15 14:00', type: 'success' }
                ]
            },
            'default': {
                versions: [
                    { tag: 'V1', name: '初始版本', desc: '首次签约版本', date: '2024-01-10 签约生效', current: true }
                ],
                timeline: [
                    { title: '创建合同', desc: '拟定中', time: '2024-01-05 10:00', type: 'success' },
                    { title: '提交确认', desc: '进入平台审核', time: '2024-01-06 14:30', type: 'success' },
                    { title: '平台审核通过', desc: '审核人：运营专员李华', time: '2024-01-07 09:15', type: 'success' },
                    { title: '乙方确认合同', desc: '确认人：XX装修公司', time: '2024-01-08 16:20', type: 'success' },
                    { title: '上传签约文件', desc: '上传人：张三', time: '2024-01-10 15:30', type: 'success' },
                    { title: '确认签约', desc: '合同正式生效（V1版本）', time: '2024-01-10 17:00', type: 'success' }
                ]
            }
        };
    }
    
    /**
     * 关闭版本记录弹窗
     */
    function closeVersionModal() {
        const modal = document.getElementById('versionModal');
        if (modal) modal.classList.remove('show');
    }
    
    // ==================== 导出相关函数 ====================
    
    /**
     * 导出合同
     */
    function exportContract() {
        showExportModal();
    }
    
    /**
     * 预览合同
     */
    function previewContract() {
        const contractId = state.currentContractId || 'contract-001';
        window.location.href = `contract-preview.html?contractId=${contractId}`;
    }
    
    /**
     * 显示导出弹窗
     */
    function showExportModal() {
        const modal = document.getElementById('exportModal');
        if (modal) modal.classList.add('show');
    }
    
    /**
     * 关闭导出弹窗
     */
    function closeExportModal() {
        const modal = document.getElementById('exportModal');
        if (modal) modal.classList.remove('show');
    }
    
    /**
     * 导出为PDF
     */
    function exportToPDF() {
        closeExportModal();
        showToast('正在生成PDF文件...');
        setTimeout(() => {
            showToast('PDF文件已保存到手机本地\n\n文件包含：合同基本信息、签约双方信息、合同正文、附件');
        }, 2000);
    }
    
    /**
     * 分享到微信
     */
    function shareToWechat() {
        closeExportModal();
        showToast('正在生成PDF文件...');
        setTimeout(() => {
            showToast('PDF文件已生成，正在打开微信分享...\n\n文件包含：合同基本信息、签约双方信息、合同正文、附件');
        }, 2000);
    }
    
    /**
     * 分享给朋友
     */
    function shareToFriend() {
        // 模拟分享功能，显示分享选项
        showCustomToast('分享功能已触发，请选择分享方式');
        // 实际项目中这里会调用微信分享API
    }
    
    // ==================== 变更记录函数 ====================
    
    /**
     * 显示变更记录弹窗
     */
    function showChangeRecordModal() {
        const modal = document.getElementById('changeRecordModal');
        if (modal) modal.classList.add('show');
    }
    
    /**
     * 关闭变更记录弹窗
     */
    function closeChangeRecordModal() {
        const modal = document.getElementById('changeRecordModal');
        if (modal) modal.classList.remove('show');
    }
    
    /**
     * 查看变更版本
     * @param {string} version - 版本标识
     */
    function viewChangeVersion(version) {
        closeChangeRecordModal();
        const versionNames = {
            'v0': '初始版本',
            'v1': '第一次变更',
            'v2': '第二次变更',
            'v3': '第三次变更'
        };
        
        if (version === 'v3') {
            // 跳转到变更审核驳回页面
            updateContractStatus('change_platform_rejected');
            showCustomToast('正在加载第三次变更（已驳回）合同详情...');
        } else {
            showCustomToast('正在加载' + versionNames[version] + '合同详情...\n\n将展示该版本下的合同基本信息、合同正文、阶段任务、附件等内容');
        }
    }
    
    // ==================== 变更操作函数 ====================
    
    /**
     * 检查变更原因
     */
    function checkChangeReason() {
        const input = document.getElementById('changeReasonInput');
        const countEl = document.getElementById('changeReasonCount');
        if (!input || !countEl) return;
        
        const value = input.value.trim();
        state.changeReason = value;
        countEl.textContent = value.length + '/500';
        
        if (value.length > 500) {
            input.value = value.substring(0, 500);
            state.changeReason = input.value;
            countEl.textContent = '500/500';
        }
        
        checkChangeContent();
    }
    
    /**
     * 检查变更内容
     */
    function checkChangeContent() {
        const container = document.getElementById('editStageList') || document.getElementById('stageEditContainer');
        if (!container) return;
        
        const stages = container.querySelectorAll('.stage-card, .stage-edit-item');
        
        let hasContent = false;
        
        stages.forEach(stage => {
            const stageNameInput = stage.querySelector('.stage-name-input');
            const stageName = stageNameInput ? stageNameInput.value.trim() : '';
            if (stageName) {
                hasContent = true;
            }
            
            const tasks = stage.querySelectorAll('.task-edit-item');
            tasks.forEach(task => {
                const taskInput = task.querySelector('.task-input');
                const taskName = taskInput ? taskInput.value.trim() : '';
                if (taskName) {
                    hasContent = true;
                }
            });
        });
        
        state.hasChangeContent = hasContent && state.changeReason.length > 0;
        
        const submitBtn = document.getElementById('submitChangeBtn');
        if (submitBtn) {
            if (hasContent && state.changeReason.length > 0) {
                submitBtn.classList.remove('disabled');
            } else {
                submitBtn.classList.add('disabled');
            }
        }
    }
    
    /**
     * 显示变更弹窗
     */
    function showChangeModal() {
        const modal = document.getElementById('changeModal');
        if (modal) {
            modal.style.display = 'block';
            modal.classList.add('show');
        }
        state.changeModalOpen = true;  // 标记变更弹窗打开，使合同正文弹窗判定为可编辑
        // 预填当前补充条款（与工人合同变更页一致：可修改，留空则保持不变）
        const extraInput = document.getElementById('changeExtraInput');
        if (extraInput) {
            const currentExtra = document.getElementById('supplementaryTerms');
            extraInput.value = currentExtra ? currentExtra.textContent.replace(/\s*\n\s*/g, '\n').trim() : '';
        }
        // 预填当前合同金额
        const amountOldEl = document.getElementById('contractAmountRow');
        const amountNewInput = document.getElementById('changeAmountNew');
        const amountOldText = document.getElementById('changeAmountOld');
        if (amountOldEl && amountNewInput && amountOldText) {
            const amountText = amountOldEl.textContent.replace(/[¥,]/g, '').trim();
            const amount = parseFloat(amountText) || 0;
            amountOldText.textContent = '¥' + formatMoney(amount);
            amountNewInput.value = amount;
        }
        updateChangeAmountDiff();
        checkChangeContent();
        // 同步发起变更态合同正文截断预览（含此前已保存的变更正文）
        syncChangeContentPreview();
    }

    /**
     * 变更金额输入回调
     */
    function onChangeAmountInput() {
        updateChangeAmountDiff();
    }

    /**
     * 更新变更金额差异显示
     */
    function updateChangeAmountDiff() {
        const amountOldEl = document.getElementById('contractAmountRow');
        const amountNewInput = document.getElementById('changeAmountNew');
        const diffRow = document.getElementById('changeAmountDiffRow');
        const diffText = document.getElementById('changeAmountDiff');
        if (!amountOldEl || !amountNewInput || !diffRow || !diffText) return;

        const amountText = amountOldEl.textContent.replace(/[¥,]/g, '').trim();
        const amountOld = parseFloat(amountText) || 0;
        const amountNew = parseFloat(amountNewInput.value) || 0;

        if (amountNew === amountOld) {
            diffRow.style.display = 'none';
            return;
        }
        diffRow.style.display = 'flex';
        const diff = amountNew - amountOld;
        diffText.className = '';
        if (diff > 0) {
            diffText.classList.add('up');
            diffText.textContent = '+¥' + formatMoney(diff);
        } else {
            diffText.classList.add('down');
            diffText.textContent = '-¥' + formatMoney(Math.abs(diff));
        }
    }

    /**
     * 格式化金额
     */
    function formatMoney(num) {
        if (isNaN(num)) return '0.00';
        return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    
    /**
     * 关闭变更弹窗
     */
    function closeChangeModal() {
        const modal = document.getElementById('changeModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
        state.changeModalOpen = false;  // 复位标记，避免影响详情页其他态的合同正文弹窗判定
    }
    
    /**
     * 显示更多选项
     * @param {Event} event - 事件对象
     */
    function showMoreOptions(event) {
        event.stopPropagation();
        showCustomToast('更多选项\n\n• 保存草稿\n• 查看历史变更\n• 导出变更记录');
    }
    
    /**
     * 切换发起变更页面的操作菜单
     */
    function toggleChangeActionMenu() {
        const actionMenu = document.getElementById('changeActionMenu');
        if (actionMenu) actionMenu.classList.toggle('show');
    }
    
    /**
     * 关闭发起变更页面的操作菜单
     */
    function closeChangeActionMenu() {
        const actionMenu = document.getElementById('changeActionMenu');
        if (actionMenu) actionMenu.classList.remove('show');
    }
    
    // [已废弃] 引导电脑端编辑功能已于本版合同取消（2026-08-10）
    
    /**
     * 切换变更页面Tab
     */
    function switchChangeTab(tabEl, tabId) {
        // 移除所有tab的active状态
        const tabs = tabEl.parentElement.querySelectorAll('.change-tab');
        tabs.forEach(tab => tab.classList.remove('active'));
        
        // 添加当前tab的active状态
        tabEl.classList.add('active');
        
        // 隐藏所有tab内容
        const section = tabEl.closest('.change-section');
        const contents = section.querySelectorAll('.change-tab-content');
        contents.forEach(content => content.classList.remove('active'));
        
        // 显示当前tab内容
        const targetContent = document.getElementById(tabId);
        if (targetContent) {
            targetContent.classList.add('active');
        }
        
        // 附件 Tab：隐藏「更换模板」按钮（附件不支持模板功能）
        const templateBtn = document.getElementById('changeTemplateBtn');
        if (templateBtn) {
            if (tabId === 'attachment') {
                templateBtn.style.display = 'none';
            } else {
                templateBtn.style.display = '';
                templateBtn.textContent = tabId === 'stage-task' ? '📄 更换任务模板' : '📄 更换正文模板';
            }
        }
        
        // 保存当前tab状态
        state.currentChangeTab = tabId;
    }
    
    /**
     * 显示更换模板弹窗
     */
    function showChangeTemplatePicker() {
        const currentTab = state.currentChangeTab || 'contract-content';

        if (currentTab === 'contract-content') {
            // 直接打开合同正文模板选择弹窗（与工人合同拟定中选择模板效果保持一致，不再弹 toast）
            showContractTemplatePicker();
        } else if (currentTab === 'stage-task') {
            // 直接打开阶段任务模板选择弹窗
            showTaskTemplatePicker();
        } else if (currentTab === 'attachment') {
            // 附件区暂不支持模板，给出轻提示
            showCustomToast('附件区不支持更换模板，请直接上传或删除附件');
        }
    }
    
    /**
     * 显示合同模板选择
     */
    function showContractTemplatePicker() {
        // 复用现有的模板选择功能
        showTemplatePicker();
    }
    
    /**
     * 显示任务模板选择
     */
    function showTaskTemplatePicker() {
        // 复用现有的阶段模板选择功能
        if (typeof window.showStageTemplatePicker === 'function') {
            window.showStageTemplatePicker();
        } else {
            // 直接调用内部函数
            const modal = document.getElementById('stageTemplateModal');
            if (modal) {
                modal.style.display = 'block';
                modal.classList.add('show');
            }
        }
    }
    
    /**
     * 显示附件模板选择
     */
    function showAttachmentTemplatePicker() {
        showCustomToast('附件模板选择功能开发中...');
    }
    
    /**
     * 添加新附件
     */
    function addNewAttachment() {
        showCustomToast('请从相册或文件中选择附件');
    }
    
    /**
     * 拟定中状态 - Tab切换
     */
    function switchDraftContentTab(tabEl, tabId) {
        // 移除所有tab的active状态
        const tabs = tabEl.parentElement.querySelectorAll('.content-tab');
        tabs.forEach(tab => tab.classList.remove('active'));
        
        // 添加当前tab的active状态
        tabEl.classList.add('active');
        
        // 隐藏所有tab内容
        const card = tabEl.closest('.card');
        const panes = card.querySelectorAll('.content-tab-pane');
        panes.forEach(pane => pane.classList.remove('active'));
        
        // 显示当前tab内容
        const targetPane = document.getElementById(tabId === 'stage-task' ? 'draft-stage-task' : 
                                                      tabId === 'attachment' ? 'draft-attachment' : 'contract-text');
        if (targetPane) {
            targetPane.classList.add('active');
        }
        
        // 附件 Tab：隐藏「更换模板」按钮（附件不支持模板功能）
        const templateBtn = document.getElementById('draftTemplateBtn');
        if (templateBtn) {
            if (tabId === 'attachment') {
                templateBtn.style.display = 'none';
            } else {
                templateBtn.style.display = '';
                templateBtn.textContent = tabId === 'stage-task' ? '📄 更换任务模板' : '📄 更换正文模板';
            }
        }
        
        // 保存当前tab状态
        state.draftContentTab = tabId;
    }
    
    /**
     * 拟定中状态 - 更换模板
     */
    function showDraftTemplatePicker() {
        const currentTab = state.draftContentTab || 'contract-text';

        if (currentTab === 'contract-text') {
            // 直接打开合同正文模板选择弹窗（与工人合同拟定中选择模板效果保持一致，不再弹 toast）
            showTemplatePicker();
        } else if (currentTab === 'stage-task') {
            // 直接打开阶段任务模板选择弹窗
            showStageTemplatePicker();
        } else if (currentTab === 'attachment') {
            // 附件区暂不支持模板
            showAttachmentTemplatePicker();
        }
    }
    
    /**
     * 预览附件
     */
    function previewAttachment(fileName) {
        showCustomToast('正在预览：' + fileName);
    }
    
    /**
     * 提交变更
     */
    function submitChange() {
        if (!state.changeReason || state.changeReason.length === 0) {
            showCustomToast('请填写变更原因');
            return;
        }
        
        if (!state.hasChangeContent) {
            showCustomToast('请添加变更内容后再提交');
            return;
        }
        
        // 自动检测变更类型：如果有金额、正文或附件变更，需要平台审核
        const needPlatformReview = state.hasAmountChange || state.hasContentChange || state.hasAttachmentChange;
        
        if (!needPlatformReview) {
            // 仅阶段任务变更，无需平台审核
            showCustomConfirm('提交变更', '确定要提交变更申请吗？\n\n提交后将通知对方进行确认，确认前阶段任务将暂停流转。', function() {
                closeChangeModal();
                showCustomToast('变更申请已提交！\n\n系统已发送消息通知对方，请等待对方确认。');
                updateContractStatus('changing');
            });
        } else {
            // 含其他内容变更，需平台审核
            showCustomConfirm('提交变更', '确定要提交变更申请吗？\n\n本次变更包含合同金额、正文或附件变更，提交后将由平台运营人员进行审核，审核通过后通知对方确认。', function() {
                closeChangeModal();
                showCustomToast('变更申请已提交！\n\n已提交至平台审核，审核通过后将通知对方确认。');
                updateContractStatus('change_platform_reviewing');
            });
        }
    }
    
    /**
     * 显示变更确认弹窗
     */
    function showChangeConfirmModal() {
        const modal = document.getElementById('changeConfirmModal');
        if (modal) modal.classList.add('show');
    }
    
    /**
     * 关闭变更确认弹窗
     */
    function closeChangeConfirmModal() {
        const modal = document.getElementById('changeConfirmModal');
        if (modal) modal.classList.remove('show');
    }
    
    /**
     * 确认变更
     */
    function confirmChange() {
        closeChangeConfirmModal();
        showCustomToast('变更已生效！');
        updateContractStatus('signed');
    }
    
    /**
     * 驳回变更
     */
    function rejectChange() {
        closeChangeConfirmModal();
        showCustomToast('变更已驳回！\n\n系统已通知对方驳回原因，对方可重新发起变更申请。');
        updateContractStatus('signed');
    }
    
    // ==================== 任务编辑函数 ====================
    
    /**
     * 添加任务到阶段
     * @param {HTMLElement} btn - 按钮元素
     */
    function addTaskToStage(btn) {
        state.currentStageItem = btn.closest('.stage-card, .stage-edit-item');
        state.newTaskConfirmPersonList = [];
        
        const modal = document.getElementById('addTaskModal');
        if (modal) modal.classList.add('show');
        
        const newTaskName = document.getElementById('newTaskName');
        const newTaskExecutor = document.getElementById('newTaskExecutor');
        const newTaskExecutorSearch = document.getElementById('newTaskExecutorSearch');
        const newTaskExecutorTags = document.getElementById('newTaskExecutorTags');
        const newTaskConfirmerSearch = document.getElementById('newTaskConfirmerSearch');
        const newTaskExecStandard = document.getElementById('newTaskExecStandard');
        const newTaskConfirmStandard = document.getElementById('newTaskConfirmStandard');
        const newTaskLiableStandard = document.getElementById('newTaskLiableStandard');
        
        if (newTaskName) newTaskName.value = '';
        if (newTaskExecutorSearch) newTaskExecutorSearch.value = '';
        // 执行人默认值：默认为乙方人员（可修改）；可选范围为项目内全部人员
        var defaultExec = '';
        var pbList = getPartyBList();
        if (pbList.length >= 1) defaultExec = pbList[0];
        if (newTaskExecutor) newTaskExecutor.value = defaultExec || '';
        if (newTaskExecutorTags) {
            if (defaultExec) {
                var addRoleMap = { '张三': '项目经理', '李四': '电工', '王五': '泥瓦工', '赵六': '木工', '钱七': '油漆工', '孙八': '监理', '业主': '业主' };
                newTaskExecutorTags.innerHTML = '<div class="confirm-person-tag">' + defaultExec + '（' + (addRoleMap[defaultExec] || '施工方') + '）' +
                    '<span class="remove" onclick="ContractDetailPage.removeExecutor(\'new\')">×</span></div>';
            } else {
                newTaskExecutorTags.innerHTML = '';
            }
        }
        if (newTaskConfirmerSearch) newTaskConfirmerSearch.value = '';
        if (newTaskExecStandard) newTaskExecStandard.value = '';
        if (newTaskConfirmStandard) newTaskConfirmStandard.value = '';
        if (newTaskLiableStandard) newTaskLiableStandard.value = '';
        
        // 工艺参考示例：重置为空并渲染（执行标准 / 确认标准各一组）
        state.newTaskCraftRefs = [];
        state.newTaskConfirmCraftRefs = [];
        renderCraftRefList('new', 'exec', false);
        renderCraftRefList('new', 'confirm', false);
        
        updateConfirmPersonTags();
    }
    
    /**
     * 关闭添加任务弹窗
     */
    function closeAddTaskModal() {
        const modal = document.getElementById('addTaskModal');
        if (modal) modal.classList.remove('show');
        
        const newTaskExecutorTags = document.getElementById('newTaskExecutorTags');
        if (newTaskExecutorTags) newTaskExecutorTags.innerHTML = '';
        
        state.currentStageItem = null;
        state.newTaskConfirmPersonList = [];
        state.newTaskCraftRefs = [];
        state.newTaskConfirmCraftRefs = [];
        state.craftRefEditorCtx = null;
    }
    
    /**
     * 添加新任务确认人
     */
    function addNewTaskConfirmer() {
        const select = document.getElementById('newTaskConfirmerSelect');
        if (!select) return;
        
        const name = select.value;
        
        if (name && !state.newTaskConfirmPersonList.includes(name) && state.newTaskConfirmPersonList.length < 5) {
            state.newTaskConfirmPersonList.push(name);
            updateConfirmPersonTags();
        }
        
        select.value = '';
    }
    
    /**
     * 移除新任务确认人
     * @param {string} name - 确认人姓名
     */
    function removeNewTaskConfirmer(name) {
        state.newTaskConfirmPersonList = state.newTaskConfirmPersonList.filter(p => p !== name);
        updateConfirmPersonTags();
    }
    
    /**
     * 更新确认人标签
     */
    function updateConfirmPersonTags() {
        const container = document.getElementById('newTaskConfirmPersons');
        if (!container) return;
        
        container.innerHTML = state.newTaskConfirmPersonList.map(name => `
            <div class="confirm-person-tag">
                ${name}
                <span class="remove" onclick="ContractDetailPage.removeNewTaskConfirmer('${name}')">×</span>
            </div>
        `).join('');
    }
    
    /**
     * 确认添加任务
     */
    function confirmAddTask() {
        const taskNameInput = document.getElementById('newTaskName');
        const executorInput = document.getElementById('newTaskExecutor');
        const execStandardInput = document.getElementById('newTaskExecStandard');
        const confirmStandardInput = document.getElementById('newTaskConfirmStandard');
        const liableStandardInput = document.getElementById('newTaskLiableStandard');
        
        const taskName = taskNameInput ? taskNameInput.value.trim() : '';
        const executor = executorInput ? executorInput.value : '';
        const execStandard = execStandardInput ? execStandardInput.value.trim() : '';
        const confirmStandard = confirmStandardInput ? confirmStandardInput.value.trim() : '';
        const liableStandard = liableStandardInput ? liableStandardInput.value.trim() : '';
        
        if (!taskName) {
            showCustomToast('请输入任务名称');
            return;
        }
        
        if (!execStandard) {
            showCustomToast('请输入执行标准');
            return;
        }
        
        if (!confirmStandard) {
            showCustomToast('请输入确认标准');
            return;
        }
        
        if (!liableStandard) {
            showCustomToast('请输入担责标准');
            return;
        }
        
        if (state.currentStageItem) {
            const taskList = state.currentStageItem.querySelector('.task-edit-list');
            if (taskList) {
                const newTask = document.createElement('div');
                newTask.className = 'task-edit-item';
                newTask.innerHTML = `
                    <input type="text" class="task-input" value="${taskName}" placeholder="任务名称" onclick="ContractDetailPage.viewTaskDetail(this)" readonly>
                    <div class="task-action-btn edit" onclick="ContractDetailPage.editTaskDetail(this)" title="编辑详情">✎</div>
                    <div class="task-action-btn" onclick="ContractDetailPage.deleteTask(this)">×</div>
                `;
                newTask.dataset.executor = executor || '';
                newTask.dataset.confirmers = state.newTaskConfirmPersonList.join(',');
                newTask.dataset.execStandard = execStandard;
                newTask.dataset.confirmStandard = confirmStandard;
                newTask.dataset.liableStandard = liableStandard;
                // 工艺参考示例（JSON 持久化到任务项，供任务详情 / 编辑回填）
                newTask.dataset.craftRefs = JSON.stringify(state.newTaskCraftRefs || []);
                newTask.dataset.confirmCraftRefs = JSON.stringify(state.newTaskConfirmCraftRefs || []);
                taskList.appendChild(newTask);
                showToast('任务已添加，点击任务名称可查看详情，点击✎可编辑');
            }
        }
        
        closeAddTaskModal();
        checkChangeContent();
    }
    
    /**
     * 查看任务详情
     * @param {HTMLElement} input - 输入框元素
     */
    function viewTaskDetail(input) {
        const taskItem = input.closest('.task-edit-item');
        if (!taskItem) return;
        
        const taskName = taskItem.querySelector('.task-input').value;
        
        const detailTaskName = document.getElementById('detailTaskName');
        const detailExecutor = document.getElementById('detailExecutor');
        const detailConfirmers = document.getElementById('detailConfirmers');
        const detailExecStandard = document.getElementById('detailExecStandard');
        const detailConfirmStandard = document.getElementById('detailConfirmStandard');
        const detailLiableStandard = document.getElementById('detailLiableStandard');
        
        if (detailTaskName) detailTaskName.textContent = taskName;
        if (detailExecutor) detailExecutor.textContent = taskItem.dataset.executor || '未设置';
        if (detailConfirmers) detailConfirmers.textContent = taskItem.dataset.confirmers || '未设置';
        if (detailExecStandard) detailExecStandard.textContent = taskItem.dataset.execStandard || '未设置';
        if (detailConfirmStandard) detailConfirmStandard.textContent = taskItem.dataset.confirmStandard || '未设置';
        if (detailLiableStandard) detailLiableStandard.textContent = taskItem.dataset.liableStandard || '未设置';
        
        const modal = document.getElementById('taskDetailModal');
        if (modal) modal.classList.add('show');
    }
    
    /**
     * 关闭任务详情弹窗
     */
    function closeTaskDetailModal() {
        const modal = document.getElementById('taskDetailModal');
        if (modal) modal.classList.remove('show');
    }
    
    /**
     * 编辑任务详情
     * @param {HTMLElement} btn - 按钮元素
     */
    // 合同乙方名单（用于编辑任务时执行人默认值推导）
    // - 工人合同（state.isWorker）：取 partyBName（唯一）或意向乙方名单（1~3 人），各态通用
    // - 非工人合同（基础 / 设计）：乙方单选，优先取草稿表单「乙方（承包方）」下拉选中项
    //   （含隐藏态仍在 DOM，可取）；再兜底取新合同流程的乙方数据
    function getPartyBList() {
        if (state.isWorker) {
            const c = state.workerContract;
            if (c && c.partyBName) return [c.partyBName];
            // 拟定中（撤回后）：意向乙方以邀请编辑面板实时选择为准（旧 invitations 记录不作默认值依据）
            if (state.status === 'worker_draft' && state.editInvited && state.editInvited.length) {
                return state.editInvited.map(function (i) { return i.name; });
            }
            // 拟定中（撤回后）invitations 已清空（空数组不作为有效来源），回退到邀请编辑面板已选名单
            const invs = (c && c.invitations && c.invitations.length) ? c.invitations : (state.editInvited || []);
            return invs.map(function (i) { return i.name; });
        }
        // 非工人合同
        const sel = document.getElementById('editPartyB');
        if (sel && sel.value) {
            const txt = (sel.options[sel.selectedIndex] && sel.options[sel.selectedIndex].text) || sel.value;
            const name = txt.split('（')[0].trim();
            if (name) return [name];
        }
        if (state.newContractData && state.newContractData.partyBName) {
            return [state.newContractData.partyBName];
        }
        return [];
    }

    function editTaskDetail(btn) {
        const taskItem = btn.closest('.task-edit-item');
        if (!taskItem) return;
        
        if (taskItem.dataset.completed === 'true') {
            showCustomToast('已完成的任务不支持编辑');
            return;
        }
        
        state.currentEditTaskItem = taskItem;
        
        const taskName = taskItem.querySelector('.task-input').value;
        let executor = taskItem.dataset.executor || '';
        // 执行人默认值：合同乙方仅一人时，无执行人的任务默认填乙方人员；多乙方则为空（非必选）
        if (!executor) {
            const pbList = getPartyBList();
            if (pbList.length === 1) executor = pbList[0];
        }
        const confirmers = taskItem.dataset.confirmers ? taskItem.dataset.confirmers.split(',') : [];
        const execStandard = taskItem.dataset.execStandard || '';
        const confirmStandard = taskItem.dataset.confirmStandard || '';
        const liableStandard = taskItem.dataset.liableStandard || '';
        
        const editTaskName = document.getElementById('editTaskName');
        const editTaskExecutor = document.getElementById('editTaskExecutor');
        const editTaskExecutorTags = document.getElementById('editTaskExecutorTags');
        const editTaskExecutorSearch = document.getElementById('editTaskExecutorSearch');
        
        if (editTaskName) editTaskName.value = taskName;
        if (editTaskExecutor) editTaskExecutor.value = executor;
        
        const roleMap = {
            '张三': '项目经理',
            '李四': '电工',
            '王五': '泥瓦工',
            '赵六': '木工',
            '钱七': '油漆工',
            '孙八': '监理'
        };
        
        if (editTaskExecutorTags) {
            if (executor && roleMap[executor]) {
                editTaskExecutorTags.innerHTML = `
                    <div class="confirm-person-tag">
                        ${executor}（${roleMap[executor]}）
                        <span class="remove" onclick="ContractDetailPage.removeExecutor('edit')">×</span>
                    </div>
                `;
            } else {
                editTaskExecutorTags.innerHTML = '';
            }
        }
        
        if (editTaskExecutorSearch) editTaskExecutorSearch.value = '';
        
        state.editTaskConfirmPersonList = confirmers;
        updateEditConfirmPersonTags();
        
        const editTaskExecStandard = document.getElementById('editTaskExecStandard');
        const editTaskConfirmStandard = document.getElementById('editTaskConfirmStandard');
        const editTaskLiableStandard = document.getElementById('editTaskLiableStandard');
        
        // 编辑态恢复文本框默认高度（只读详情曾按内容撑开设置过内联高度，避免泄漏到编辑态）
        if (editTaskExecStandard) { editTaskExecStandard.value = execStandard; editTaskExecStandard.style.height = ''; }
        if (editTaskConfirmStandard) { editTaskConfirmStandard.value = confirmStandard; editTaskConfirmStandard.style.height = ''; }
        if (editTaskLiableStandard) { editTaskLiableStandard.value = liableStandard; editTaskLiableStandard.style.height = ''; }
        
        // 工艺参考示例：回填编辑态（可增删改）
        state.editTaskCraftRefs = parseCraftRefs(taskItem.dataset.craftRefs);
        state.editTaskConfirmCraftRefs = parseCraftRefs(taskItem.dataset.confirmCraftRefs);
        renderCraftRefList('edit', 'exec', false);
        renderCraftRefList('edit', 'confirm', false);
        
        const modal = document.getElementById('editTaskModal');
        if (modal) modal.classList.add('show');
    }
    
    /**
     * 关闭编辑任务弹窗
     */
    function closeEditTaskModal() {
        const modal = document.getElementById('editTaskModal');
        if (modal) {
            modal.classList.remove('show');
            // 清理只读模式（避免影响后续「编辑任务」打开时的可编辑状态）
            modal.classList.remove('readonly');
            const title = modal.querySelector('.modal-title');
            if (title) title.textContent = '编辑任务';
        }
        
        const editTaskExecutorTags = document.getElementById('editTaskExecutorTags');
        if (editTaskExecutorTags) editTaskExecutorTags.innerHTML = '';
        
        state.currentEditTaskItem = null;
        state.editTaskConfirmPersonList = [];
        state.editTaskCraftRefs = [];
        state.editTaskConfirmCraftRefs = [];
        state.craftRefEditorCtx = null;
    }

    /**
     * 任务名称 → 三标准补充映射（原型数据补充，保证只读弹窗三项标准均有值）。
     * 审核阶段 / 确认阶段等合同详情页点击任务项展示只读任务详情时使用，
     * 取值优先级：任务项 data 属性 → 本映射 → 通用兜底。
     */
    const TASK_STANDARD_MAP = {
        '材料采购': { exec: '按设计图纸与合同清单采购符合国家标准的电线、线管等材料，并随货提供合格证与检测报告。', confirm: '材料品牌、规格、数量与合同约定一致，质量证明文件齐全方可签收。', liable: '因材料质量或规格不符导致返工、工期延误的，由采购执行方承担相应费用与责任。' },
        '材料运输': { exec: '采用合规运输方式将材料安全运抵施工现场，途中做好防护，避免磕碰与受潮。', confirm: '到场材料外包装完好、数量准确，随车单据与订单一致。', liable: '运输过程中发生材料损坏、短缺的，由运输执行方承担责任。' },
        '材料确认': { exec: '核对到场材料的品牌、规格、数量、合格证，与合同逐项比对并记录。', confirm: '材料与合同约定一致，相关确认人签字确认后方可入库。', liable: '因漏检、误检导致不合格材料使用的，由执行与确认方共同担责。' },
        '材料入库': { exec: '将验收合格材料分类码放、登记台账，做好防潮防火管理。', confirm: '入库数量、品类与验收单一致，台账记录完整。', liable: '因保管不当造成材料丢失、损坏的，由保管执行方承担责任。' },
        '材料报验': { exec: '整理材料质量证明文件，向监理/业主报验并提交样品。', confirm: '报验资料齐全，样品经确认人认可后准予使用。', liable: '未经报验擅自使用的，由执行方承担整改与返工责任。' },
        '开槽': { exec: '按深化图纸弹线定位，使用机械规范开槽，不得破坏承重结构。', confirm: '开槽位置、深度、走向符合图纸与规范要求。', liable: '因违规开槽造成结构损伤或后期隐患的，由施工执行方担责。' },
        '布管': { exec: '按规范敷设线管，管卡固定牢固、弯曲半径合规，强弱电分管分盒。', confirm: '线管规格、走向、间距符合设计与验收标准。', liable: '管线敷设不到位导致后期无法穿线或维修困难的，由执行方整改担责。' },
        '穿线': { exec: '按回路穿线，线色区分正确，预留足够接线长度，管内无接头。', confirm: '导线规格、根数、绝缘电阻测试合格。', liable: '因穿线错误导致短路、跳闸的，由施工执行方承担责任。' },
        '线路测试': { exec: '使用兆欧表、万用表进行绝缘与通断测试，记录测试数据。', confirm: '绝缘电阻、通路、接地均符合规范，测试报告完整。', liable: '未测试或测试造假导致用电事故的，由执行与确认方担责。' },
        '隐蔽工程验收': { exec: '在覆盖前完成自检，整理影像与隐蔽记录资料。', confirm: '监理/业主现场复核，隐蔽资料签字确认后方可封闭。', liable: '未经验收擅自隐蔽的，由执行方承担剥露复检与返工费用。' },
        '阶段确认': { exec: '完成本阶段全部任务并自检合格，提交阶段成果与记录。', confirm: '相关确认人按节点对阶段成果进行核验并签字确认。', liable: '阶段内任务未达标即申请确认的，由执行方承担整改责任。' },
        '开关插座安装': { exec: '按图纸标高与间距安装，接线牢固、面板端正、接地可靠。', confirm: '安装位置、数量、接线符合设计与安全规范。', liable: '安装松动、接错线导致故障的，由施工执行方担责。' },
        '灯具安装': { exec: '按设计点位安装灯具，固定牢固、接线正确、漏保测试合格。', confirm: '灯具数量、位置、亮灯与接地测试合格。', liable: '安装不牢或接线错误造成脱落、触电的，由执行方承担责任。' },
        '配电箱安装': { exec: '按系统图安装配电箱，回路标识清晰，接线规范、接地可靠。', confirm: '箱体接地、回路分配、标识与图纸一致，功能测试合格。', liable: '接线错误或标识缺失导致用电事故的，由执行方担责。' },
        '设备调试': { exec: '按说明书对设备进行单机与联动调试，记录运行参数。', confirm: '设备运行平稳、参数达标，调试报告完整。', liable: '调试不到位导致设备异常的，由执行方承担复调责任。' },
        '新增点位布线': { exec: '按变更确认的点位深化布线，工艺与既有标准一致。', confirm: '新增点位位置、工艺经确认人验收合格。', liable: '新增布线不达标影响使用的，由执行方整改担责。' },
        '新增点位验收': { exec: '完成新增点位施工并自检，提交验收资料。', confirm: '新增点位经业主/监理验收签字确认。', liable: '未验收合格即投入使用的，由执行方承担责任。' },
        '清理现场': { exec: '做到工完场清，分类清运建筑垃圾，保持现场整洁。', confirm: '现场无遗留废料、通道畅通，达到交付标准。', liable: '因清理不到位影响后续工序或安全的，由执行方担责。' },
        '竣工验收': { exec: '完成全部施工内容并自检，整理竣工图与验收资料。', confirm: '业主、监理按合同与规范进行竣工验收并签字。', liable: '验收发现问题的，由执行方限期整改至合格。' },
        '资料整理': { exec: '汇总施工、验收、变更等过程资料，分类归档成册。', confirm: '资料完整、签章齐全，与实体工程一致。', liable: '资料缺失、不实影响结算或维保的，由执行方补正担责。' },
        '培训使用': { exec: '向业主讲解设备与系统使用方法，演示操作要点。', confirm: '业主确认已掌握使用与维护要点。', liable: '因培训不到位导致误操作损失的，由执行方补充培训担责。' },
        '最终确认': { exec: '完成全部收尾与整改，提交最终结算与交付文件。', confirm: '各方对工程量、质量、资料进行最终确认签字。', liable: '最终确认前遗留问题未闭环的，由执行方承担后续责任。' }
    };

    /**
     * 已签约状态：跳转任务详情页，并携带当前任务上下文。
     * 仅追加 URL 参数（任务名称 / 隶属合同 / 隶属阶段 / 执行·确认·担责三项标准），
     * 不改动跳转目标与后续任何功能、操作、交互流程；任务详情页无参数时保持原有示例数据。
     * @param {HTMLElement} taskItem - 任务项元素
     * @param {string} taskName - 已清洗的任务名称（不含变更标签文字）
     */
    function navigateToTaskDetail(taskItem, taskName) {
        // 隶属阶段：任务所属阶段的阶段名称
        let stageName = '';
        const stageItem = taskItem.closest ? taskItem.closest('.stage-item') : null;
        if (stageItem) {
            const stageNameEl = stageItem.querySelector('.stage-name');
            if (stageNameEl) stageName = stageNameEl.textContent.trim();
        }

        // 隶属合同：优先取合同名称字段（拟定中表单 / 只读信息行），取不到时回退演示合同名称
        let contractName = '';
        const contractNameInput = document.getElementById('editContractName');
        if (contractNameInput && contractNameInput.value) {
            contractName = contractNameInput.value.trim();
        }
        if (!contractName) contractName = '基础施工合同0810';

        const params = new URLSearchParams();
        params.set('from', 'contract');
        params.set('taskName', taskName || '');
        params.set('contractName', contractName);
        params.set('stageName', stageName);
        params.set('execStandard', taskItem.dataset.execStandard || '');
        params.set('confirmStandard', taskItem.dataset.confirmStandard || '');
        params.set('liableStandard', taskItem.dataset.liableStandard || '');

        location.href = 'task-detail.html?' + params.toString();
    }

    /**
     * 非已签约状态页面：点击任务项弹出「编辑任务」弹窗的只读效果（展示任务详情，不跳转任务详情页）。
     * 已签约状态保持原有跳转行为（不改动既有功能），并携带任务上下文参数。
     * 执行人 / 确认人可能无人员（空时展示「未指定」占位）；执行 / 确认 / 担责三项标准保证均有值。
     * @param {HTMLElement} taskItem - 任务项元素
     */
    function openTaskReadonly(taskItem) {
        if (!taskItem) return;

        // 任务名称（排除变更标签文字，如「已修改 / 新增」）
        const taskNameEl = taskItem.querySelector('.task-name');
        let taskName = '未设置';
        if (taskNameEl) {
            taskName = Array.prototype.slice.call(taskNameEl.childNodes)
                .filter(function (n) {
                    return !(n.nodeType === 1 && n.classList && n.classList.contains('task-change-tag'));
                })
                .map(function (n) { return n.textContent; })
                .join('')
                .trim();
            if (!taskName) taskName = '未设置';
        }

        // 已签约状态：保持原有跳转行为，并携带当前任务上下文（任务名称 / 隶属合同 / 隶属阶段 / 三项标准）
        if (state.currentStatus === 'signed') {
            navigateToTaskDetail(taskItem, taskName);
            return;
        }

        // 从任务项元信息解析执行人 / 确认人
        let executor = '';
        let confirmers = [];
        const metaRow = taskItem.querySelector('.task-meta-row');
        if (metaRow) {
            metaRow.querySelectorAll('.task-meta-item').forEach(function (item) {
                const roleTag = item.querySelector('.role-tag');
                const role = roleTag ? roleTag.textContent.trim() : '';
                const val = item.textContent.replace(role, '').replace(/\s+/g, ' ').trim();
                if (role === '执行') executor = val;
                else if (role === '确认') confirmers = val ? val.split(/[、,，]/).map(function (s) { return s.trim(); }).filter(Boolean) : [];
            });
        }

        const roleMap = {
            '张三': '项目经理', '李四': '电工', '王五': '泥瓦工',
            '赵六': '木工', '钱七': '油漆工', '孙八': '监理', '业主': '业主'
        };

        // 填充任务名称
        const editTaskName = document.getElementById('editTaskName');
        if (editTaskName) editTaskName.value = taskName;

        // 执行人：可能无人员 → 空时展示「未指定」占位
        const execTags = document.getElementById('editTaskExecutorTags');
        if (execTags) {
            if (executor) {
                execTags.innerHTML = '<div class="confirm-person-tag">' + executor + '（' + (roleMap[executor] || '施工方') + '）<span class="remove" onclick="ContractDetailPage.removeExecutor(\'edit\')">×</span></div>';
            } else {
                execTags.innerHTML = '<div class="confirm-person-tag empty">未指定</div>';
            }
        }
        const execHidden = document.getElementById('editTaskExecutor');
        if (execHidden) execHidden.value = executor;

        // 确认人：可能无人员 → 空时展示「未指定」占位
        state.editTaskConfirmPersonList = confirmers;
        updateEditConfirmPersonTags();
        const confTags = document.getElementById('editTaskConfirmPersons');
        if (confTags && confirmers.length === 0) {
            confTags.innerHTML = '<div class="confirm-person-tag empty">未指定</div>';
        }

        // 三项标准：保证均有值（优先级：data 属性 → 任务名映射 → 通用兜底）
        const ds = taskItem.dataset || {};
        const stdMap = TASK_STANDARD_MAP[taskName] || {};
        const GENERIC_STD = {
            exec: '按合同约定及国家/行业相关施工规范执行，过程中做好自检与记录。',
            confirm: '由相关确认人按合同约定的标准进行核验并签字确认。',
            liable: '因执行或确认不到位造成质量、安全、工期问题的，由责任方承担相应责任。'
        };
        const execStd = document.getElementById('editTaskExecStandard');
        const confStd = document.getElementById('editTaskConfirmStandard');
        const liableStd = document.getElementById('editTaskLiableStandard');
        if (execStd) execStd.value = ds.execStandard || stdMap.exec || GENERIC_STD.exec;
        if (confStd) confStd.value = ds.confirmStandard || stdMap.confirm || GENERIC_STD.confirm;
        if (liableStd) liableStd.value = ds.liableStandard || stdMap.liable || GENERIC_STD.liable;

        // 工艺参考示例：只读展示（不显示增删改入口）
        state.editTaskCraftRefs = parseCraftRefs(taskItem.dataset.craftRefs);
        state.editTaskConfirmCraftRefs = parseCraftRefs(taskItem.dataset.confirmCraftRefs);
        renderCraftRefList('edit', 'exec', true);
        renderCraftRefList('edit', 'confirm', true);

        // 进入只读模式
        const modal = document.getElementById('editTaskModal');
        if (modal) {
            modal.classList.add('readonly');
            const title = modal.querySelector('.modal-title');
            if (title) title.textContent = '任务详情（只读）';
            modal.classList.add('show');

            // 手机端规范：只读详情内三项标准文本框按内容撑开（配合 CSS 去滚动条/去 PC 拖拽把手），
            // 需在弹窗显示（display:flex）后测量 scrollHeight 才准确。仅作用于只读态，编辑任务不受影响。
            ['editTaskExecStandard', 'editTaskConfirmStandard', 'editTaskLiableStandard'].forEach(function (id) {
                const el = document.getElementById(id);
                if (!el) return;
                el.style.height = 'auto';
                // border-box 下需补足上下边框(共 2px)，避免最后一行被裁切
                el.style.height = (el.scrollHeight + 2) + 'px';
            });
        }
    }
    
    /**
     * 添加编辑任务确认人
     */
    function addEditTaskConfirmer() {
        const select = document.getElementById('editTaskConfirmerSelect');
        if (!select) return;
        
        const name = select.value;
        
        if (name && !state.editTaskConfirmPersonList.includes(name) && state.editTaskConfirmPersonList.length < 5) {
            state.editTaskConfirmPersonList.push(name);
            updateEditConfirmPersonTags();
        }
        
        select.value = '';
    }
    
    /**
     * 移除编辑任务确认人
     * @param {string} name - 确认人姓名
     */
    function removeEditTaskConfirmer(name) {
        state.editTaskConfirmPersonList = state.editTaskConfirmPersonList.filter(p => p !== name);
        updateEditConfirmPersonTags();
    }
    
    /**
     * 更新编辑确认人标签
     */
    function updateEditConfirmPersonTags() {
        const container = document.getElementById('editTaskConfirmPersons');
        if (!container) return;
        
        container.innerHTML = state.editTaskConfirmPersonList.map(name => `
            <div class="confirm-person-tag">
                ${name}
                <span class="remove" onclick="ContractDetailPage.removeEditTaskConfirmer('${name}')">×</span>
            </div>
        `).join('');
    }
    
    /**
     * 确认编辑任务
     */
    function confirmEditTask() {
        const editTaskNameInput = document.getElementById('editTaskName');
        const editTaskExecutorInput = document.getElementById('editTaskExecutor');
        const editTaskExecStandardInput = document.getElementById('editTaskExecStandard');
        const editTaskConfirmStandardInput = document.getElementById('editTaskConfirmStandard');
        const editTaskLiableStandardInput = document.getElementById('editTaskLiableStandard');
        
        const taskName = editTaskNameInput ? editTaskNameInput.value.trim() : '';
        const executor = editTaskExecutorInput ? editTaskExecutorInput.value : '';
        const execStandard = editTaskExecStandardInput ? editTaskExecStandardInput.value.trim() : '';
        const confirmStandard = editTaskConfirmStandardInput ? editTaskConfirmStandardInput.value.trim() : '';
        const liableStandard = editTaskLiableStandardInput ? editTaskLiableStandardInput.value.trim() : '';
        
        if (!taskName) {
            showCustomToast('请输入任务名称');
            return;
        }
        
        if (!execStandard) {
            showCustomToast('请输入执行标准');
            return;
        }
        
        if (!confirmStandard) {
            showCustomToast('请输入确认标准');
            return;
        }
        
        if (!liableStandard) {
            showCustomToast('请输入担责标准');
            return;
        }
        
        if (state.currentEditTaskItem) {
            const taskInput = state.currentEditTaskItem.querySelector('.task-input');
            if (taskInput) taskInput.value = taskName;
            
            state.currentEditTaskItem.dataset.executor = executor || '';
            state.currentEditTaskItem.dataset.confirmers = state.editTaskConfirmPersonList.join(',');
            state.currentEditTaskItem.dataset.execStandard = execStandard;
            state.currentEditTaskItem.dataset.confirmStandard = confirmStandard;
            state.currentEditTaskItem.dataset.liableStandard = liableStandard;
            // 工艺参考示例（JSON 持久化到任务项）
            state.currentEditTaskItem.dataset.craftRefs = JSON.stringify(state.editTaskCraftRefs || []);
            state.currentEditTaskItem.dataset.confirmCraftRefs = JSON.stringify(state.editTaskConfirmCraftRefs || []);
            showToast('任务已更新');
        }
        
        closeEditTaskModal();
    }
    
    // ==================== 工艺参考示例（新增 / 编辑任务 配置） ====================
    // 工艺参考示例：图片示例（本版不支持视频），一排三个、最多 9 张。
    // 编辑以「整页」形式承载（add 模式支持一次多选上传多张；edit 模式替换单张）。
    // 仅新增配置能力（增 / 删 / 改），不改动任务名称、执行人、确认人、三项标准等既有字段与校验。
    const CRAFT_REF_MAX = 9;
    
    /**
     * 安全解析任务项 dataset 中的工艺参考 JSON
     * （容错：空 / 非法 / 非数组 → 返回空数组）
     * @param {string} str - JSON 字符串
     * @returns {Array}
     */
    function parseCraftRefs(str) {
        if (!str) return [];
        try {
            const arr = JSON.parse(str);
            if (!Array.isArray(arr)) return [];
            return arr.filter(function (it) { return it && it.src; });
        } catch (e) {
            return [];
        }
    }
    
    /**
     * 按模式 / 标准类型取对应状态数组
     * @param {string} mode - 'new'（添加任务） | 'edit'（编辑任务）
     * @param {string} type - 'exec'（执行标准） | 'confirm'（确认标准）
     * @returns {Array}
     */
    function getCraftRefArray(mode, type) {
        if (mode === 'new') {
            return type === 'confirm' ? state.newTaskConfirmCraftRefs : state.newTaskCraftRefs;
        }
        return type === 'confirm' ? state.editTaskConfirmCraftRefs : state.editTaskCraftRefs;
    }
    
    /**
     * 渲染工艺参考示例列表
     * @param {string} mode - 'new'（添加任务） | 'edit'（编辑任务）
     * @param {string} type - 'exec'（执行标准） | 'confirm'（确认标准）
     * @param {boolean} readonly - 只读态（openTaskReadonly 复用编辑弹窗）时不显示增删改入口
     */
    function renderCraftRefList(mode, type, readonly) {
        const list = document.getElementById('craftRefList-' + mode + '-' + type);
        if (!list) return;
        const cfg = document.getElementById('craftRefCfg-' + mode + '-' + type);
        if (cfg) cfg.classList.toggle('readonly', !!readonly);
        
        const arr = getCraftRefArray(mode, type);
        // 先恢复宿主 form-group 可见性（编辑/只读弹窗复用，防止只读态隐藏残留）
        const group = list.closest('.form-group');
        if (group) group.style.display = '';
        if (!arr.length) {
            // 只读态（openTaskReadonly 复用编辑弹窗）且无图：整块不展示（含「工艺参考示例」标题），不渲染空态文案
            if (readonly) {
                list.innerHTML = '';
                if (group) group.style.display = 'none';
                return;
            }
            list.innerHTML = '<div class="craft-ref-list-empty">暂无工艺参考示例，点击下方按钮添加</div>';
            return;
        }
        list.innerHTML = arr.map(function (item, index) {
            const ops = readonly ? '' : (
                '<div class="craft-ref-item-ops">' +
                    '<span class="op edit" title="编辑" onclick="openCraftRefEditor(\'' + mode + '\',\'' + type + '\',' + index + ')">✎</span>' +
                    '<span class="op del" title="删除" onclick="deleteCraftRef(\'' + mode + '\',\'' + type + '\',' + index + ')">×</span>' +
                '</div>'
            );
            return '<div class="craft-ref-config-item" style="background-image:url(\'' + escapeHtml(item.src) + '\');">' +
                '<div class="craft-ref-item-title">' + escapeHtml(item.title || '工艺参考') + '</div>' +
                ops +
            '</div>';
        }).join('');
    }
    
    /**
     * 打开工艺参考示例编辑页（整页 push）
     * - add 模式（index 省略 / 负值）：从空缓冲区开始，支持一次多选上传多张
     * - edit 模式（index 有效）：载入该张用于替换（单张）
     * @param {string} mode - 'new' | 'edit'
     * @param {string} type - 'exec' | 'confirm'
     * @param {number} [index] - 编辑时的数组下标
     */
    function openCraftRefEditor(mode, type, index) {
        const arr = getCraftRefArray(mode, type);
        const isEdit = (typeof index === 'number' && index >= 0 && index < arr.length);
        if (!isEdit && arr.length >= CRAFT_REF_MAX) {
            showCustomToast('最多添加 ' + CRAFT_REF_MAX + ' 张工艺参考示例');
            return;
        }

        state.craftRefEditorCtx = { mode: mode, type: type, index: isEdit ? index : -1 };
        // 编辑模式：载入该张为唯一缓冲项；新增模式：空缓冲，由上传填充
        state.craftRefEditorBuffer = isEdit
            ? [{ src: arr[index].src || '', title: arr[index].title || '' }]
            : [];

        const titleEl = document.getElementById('craftRefEditorTitle');
        if (titleEl) titleEl.textContent = isEdit ? '编辑工艺参考示例' : '添加工艺参考示例';

        // 编辑模式仅替换单张（关闭多选）；新增模式开启多选
        const uploadInput = document.getElementById('craftRefUploadInput');
        if (uploadInput) uploadInput.multiple = !isEdit;

        renderCraftRefEditor();

        const page = document.getElementById('craftRefEditorPage');
        if (page) page.classList.add('show');
    }

    /**
     * 渲染编辑页内的图片网格 + 上传占位 + 计数
     */
    function renderCraftRefEditor() {
        if (!state.craftRefEditorCtx) return;
        const grid = document.getElementById('craftRefEditorGrid');
        const hint = document.getElementById('craftRefEditorHint');
        const tile = document.getElementById('craftRefUploadTile');
        if (!grid) return;

        const mode = state.craftRefEditorCtx.mode;
        const type = state.craftRefEditorCtx.type;
        const index = state.craftRefEditorCtx.index;
        const committed = getCraftRefArray(mode, type);
        // 编辑模式：该张已占用 1 个名额；新增模式：0
        const baseCount = (index >= 0) ? Math.max(committed.length - 1, 0) : committed.length;
        const buffer = state.craftRefEditorBuffer;
        const total = baseCount + buffer.length;

        if (hint) {
            hint.innerHTML = '已选 <b>' + total + '</b> / ' + CRAFT_REF_MAX + ' 张';
        }

        grid.innerHTML = buffer.map(function (item, i) {
            return '<div class="editor-img-item">' +
                '<div class="editor-img-thumb" style="background-image:url(\'' + escapeHtml(item.src) + '\');"></div>' +
                '<div class="editor-img-del" title="删除" onclick="removeCraftRefBufferItem(' + i + ')">×</div>' +
                '<input class="editor-img-title" type="text" value="' + escapeHtml(item.title || '') +
                '" placeholder="如：电工接线作业" oninput="updateCraftRefItemTitle(' + i + ', this.value)">' +
            '</div>';
        }).join('');

        // 上传占位格：未满时显示（置于网格末尾）
        if (tile) {
            if (total >= CRAFT_REF_MAX) {
                tile.classList.add('hidden');
            } else {
                tile.classList.remove('hidden');
                grid.appendChild(tile);
            }
        }
    }

    /**
     * 同步缓冲项标题（输入即存）
     * @param {number} i - 缓冲项下标
     * @param {string} value - 输入框值
     */
    function updateCraftRefItemTitle(i, value) {
        if (!state.craftRefEditorBuffer[i]) return;
        state.craftRefEditorBuffer[i].title = value;
    }

    /**
     * 删除缓冲项
     * @param {number} i - 缓冲项下标
     */
    function removeCraftRefBufferItem(i) {
        if (i < 0 || i >= state.craftRefEditorBuffer.length) return;
        state.craftRefEditorBuffer.splice(i, 1);
        renderCraftRefEditor();
        showToast('已移除该图片');
    }

    /**
     * 上传本地图片（新增模式支持一次多选多张；编辑模式替换单张）
     * @param {HTMLInputElement} input - file 输入框
     */
    function handleCraftRefUpload(input) {
        if (!input || !input.files || !input.files.length) return;
        if (!state.craftRefEditorCtx) {
            state.craftRefEditorCtx = { mode: 'new', type: 'exec', index: -1 };
            state.craftRefEditorBuffer = [];
        }
        const mode = state.craftRefEditorCtx.mode;
        const type = state.craftRefEditorCtx.type;
        const index = state.craftRefEditorCtx.index;
        const committed = getCraftRefArray(mode, type);
        const baseCount = (index >= 0) ? Math.max(committed.length - 1, 0) : committed.length;
        const remaining = CRAFT_REF_MAX - baseCount - state.craftRefEditorBuffer.length;

        const files = Array.prototype.slice.call(input.files).slice(0, Math.max(remaining, 0));
        if (!files.length) {
            showCustomToast('最多添加 ' + CRAFT_REF_MAX + ' 张工艺参考示例');
            input.value = '';
            return;
        }

        let loaded = 0;
        files.forEach(function (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const defaultTitle = file.name.replace(/\.[^.]+$/, '');
                if (index >= 0) {
                    // 编辑模式：替换唯一缓冲项
                    state.craftRefEditorBuffer[0] = { src: e.target.result, title: defaultTitle };
                } else {
                    state.craftRefEditorBuffer.push({ src: e.target.result, title: defaultTitle });
                }
                loaded += 1;
                if (loaded === files.length) {
                    renderCraftRefEditor();
                }
            };
            reader.readAsDataURL(file);
        });
        input.value = '';
    }

    /**
     * 保存工艺参考（新增 / 编辑）
     */
    function saveCraftRef() {
        const ctx = state.craftRefEditorCtx;
        if (!ctx) return;
        const buffer = state.craftRefEditorBuffer;
        const arr = getCraftRefArray(ctx.mode, ctx.type);

        // 标题兜底：空标题默认「工艺参考示例」
        const items = buffer.map(function (it) {
            return { src: it.src, title: (it.title && it.title.trim()) ? it.title.trim() : '工艺参考示例' };
        });

        if (ctx.index >= 0 && ctx.index < arr.length) {
            // 编辑模式：用缓冲项替换原项（缓冲为空则删除该张）
            if (items.length) {
                arr[ctx.index] = items[0];
            } else {
                arr.splice(ctx.index, 1);
            }
        } else {
            if (!items.length) {
                showCustomToast('请至少上传一张工艺参考图片');
                return;
            }
            if (arr.length + items.length > CRAFT_REF_MAX) {
                showCustomToast('最多添加 ' + CRAFT_REF_MAX + ' 张工艺参考示例');
                return;
            }
            items.forEach(function (it) { arr.push(it); });
        }

        renderCraftRefList(ctx.mode, ctx.type, false);
        closeCraftRefEditor();
        showToast(ctx.index >= 0 ? '工艺参考已更新' : '工艺参考已添加');
    }

    /**
     * 删除工艺参考（列表内既有项）
     * @param {string} mode - 'new' | 'edit'
     * @param {string} type - 'exec' | 'confirm'
     * @param {number} index - 数组下标
     */
    function deleteCraftRef(mode, type, index) {
        const arr = getCraftRefArray(mode, type);
        if (index < 0 || index >= arr.length) return;
        arr.splice(index, 1);
        renderCraftRefList(mode, type, false);
        showToast('工艺参考已删除');
    }

    /**
     * 关闭工艺参考编辑页（整页滑出）
     */
    function closeCraftRefEditor() {
        const page = document.getElementById('craftRefEditorPage');
        if (page) page.classList.remove('show');
        state.craftRefEditorCtx = null;
        state.craftRefEditorBuffer = [];
    }
    
    /**
     * 删除任务
     * @param {HTMLElement} btn - 按钮元素
     */
    function deleteTask(btn) {
        const taskItem = btn.closest('.task-edit-item');
        if (!taskItem) return;
        
        const taskList = taskItem.parentElement;
        
        if (taskItem.dataset.completed === 'true') {
            showCustomToast('已完成的任务不支持删除');
            return;
        }
        
        if (taskItem.dataset.status === 'in_progress' || taskItem.dataset.status === 'confirming') {
            showCustomToast('进行中的任务不支持删除');
            return;
        }
        
        if (taskList) {
            var remainCount = taskList.querySelectorAll('.task-edit-item').length;
            var taskMsg = remainCount > 1
                ? '确定要删除此任务吗？'
                : '确定要删除此任务吗？删除后该阶段暂时没有任务，需要时可在该阶段重新添加。';
            showCustomConfirm('删除任务', taskMsg, function() {
                taskItem.remove();
                checkChangeContent();
            }, true);
        }
    }
    
    /**
     * 删除阶段
     * @param {HTMLElement} btn - 按钮元素
     */
    function deleteStage(btn) {
        const stageItem = btn.closest('.stage-card, .stage-edit-item');
        if (!stageItem) return;
        
        const container = stageItem.parentElement;
        
        const completedTasks = stageItem.querySelectorAll('.task-edit-item[data-completed="true"]');
        if (completedTasks.length > 0) {
            showCustomToast('当前阶段存在已完成的任务，不支持删除');
            return;
        }
        
        const inProgressTasks = stageItem.querySelectorAll('.task-edit-item[data-status="in_progress"], .task-edit-item[data-status="confirming"]');
        if (inProgressTasks.length > 0) {
            showCustomToast('当前阶段存在进行中的任务，不支持删除');
            return;
        }
        
        if (container && container.querySelectorAll('.stage-card, .stage-edit-item').length > 1) {
            showCustomConfirm('删除阶段', '确定要删除此阶段吗？删除后该阶段下的所有任务也将被删除。', function() {
                stageItem.remove();
                checkChangeContent();
            }, true);
        } else {
            showCustomToast('至少保留一个阶段');
        }
    }
    
    /**
     * 切换阶段按序执行
     * @param {HTMLElement} element - 元素
     */
    function toggleStageSequential(element) {
        const stageItem = element.closest('.stage-card, .stage-edit-item');
        if (!stageItem) return;
        
        const switchEl = element.classList.contains('switch') ? element : element.querySelector('.switch');
        const isSequential = stageItem.dataset.sequential === 'true';
        
        const completedTasks = stageItem.querySelectorAll('.task-edit-item[data-completed="true"]');
        const inProgressTasks = stageItem.querySelectorAll('.task-edit-item[data-status="in_progress"], .task-edit-item[data-status="confirming"]');
        
        if (completedTasks.length > 0 || inProgressTasks.length > 0) {
            showCustomToast('当前阶段存在已执行的任务，不支持修改按序执行状态');
            return;
        }
        
        if (isSequential) {
            stageItem.dataset.sequential = 'false';
            if (switchEl) switchEl.classList.remove('active');
        } else {
            stageItem.dataset.sequential = 'true';
            if (switchEl) switchEl.classList.add('active');
            sortTasksByCompletion(stageItem);
        }
    }
    
    /**
     * 按完成状态排序任务
     * @param {HTMLElement} stageItem - 阶段元素
     */
    function sortTasksByCompletion(stageItem) {
        const taskList = stageItem.querySelector('.task-edit-list');
        if (!taskList) return;
        
        const tasks = Array.from(taskList.querySelectorAll('.task-edit-item'));
        
        tasks.sort((a, b) => {
            const aCompleted = a.dataset.completed === 'true';
            const bCompleted = b.dataset.completed === 'true';
            
            if (aCompleted && !bCompleted) return -1;
            if (!aCompleted && bCompleted) return 1;
            return 0;
        });
        
        tasks.forEach(task => taskList.appendChild(task));
    }
    
    /**
     * 编辑阶段设置
     * @param {HTMLElement} btn - 按钮元素
     */
    function editStageSettings(btn) {
        const stageItem = btn.closest('.stage-card, .stage-edit-item');
        if (!stageItem) return;
        
        const stageNameInput = stageItem.querySelector('.stage-name-input');
        if (stageNameInput) {
            stageNameInput.focus();
            stageNameInput.select();
        }
    }
    
    /**
     * 添加新阶段
     */
    function addNewStage() {
        const container = document.getElementById('stageEditContainer');
        if (!container) return;
        
        const stageCount = container.querySelectorAll('.stage-edit-item').length;
        
        const newStage = document.createElement('div');
        newStage.className = 'stage-edit-item';
        newStage.dataset.stage = stageCount + 1;
        newStage.dataset.sequential = 'false';
        newStage.innerHTML = `
            <div class="stage-header-row">
                <input type="text" class="stage-name-input" placeholder="请输入阶段名称">
                <div class="stage-sequential" onclick="ContractDetailPage.toggleStageSequential(this)">
                    <span>按序执行</span>
                    <div class="switch"></div>
                </div>
                <div class="stage-actions">
                    <div class="stage-action-btn add" onclick="ContractDetailPage.addTaskToStage(this)"><span class="btn-icon">+</span> 添加任务</div>
                    <div class="stage-action-btn delete" onclick="ContractDetailPage.deleteStage(this)"><span class="btn-icon">×</span> 删除阶段</div>
                </div>
            </div>
            <div class="task-edit-list">
                <div class="task-edit-item">
                    <input type="text" class="task-input" placeholder="任务名称" onclick="ContractDetailPage.viewTaskDetail(this)" readonly>
                    <div class="task-action-btn edit" onclick="ContractDetailPage.editTaskDetail(this)" title="编辑详情">✎</div>
                    <div class="task-action-btn" onclick="ContractDetailPage.deleteTask(this)">×</div>
                </div>
            </div>
        `;
        container.appendChild(newStage);
        
        const stageNameInput = newStage.querySelector('.stage-name-input');
        if (stageNameInput) stageNameInput.focus();
        
        newStage.scrollIntoView({ behavior: 'smooth' });
        checkChangeContent();
    }

    /**
     * 添加新阶段（拟定中草稿视图 · #editStageList · .stage-card）
     * 与变更流程 addNewStage（#stageEditContainer · .stage-edit-item）分开声明，
     * 避免两个同名函数被 JS 提升合并为变更版，导致草稿视图「添加阶段」无反应。
     * 新增的阶段卡片结构与草稿 HTML（.stage-card）一致，复用统一的 addTaskToStage / deleteStage。
     */
    function addNewStageDraft() {
        const list = document.getElementById('editStageList');
        if (!list) return;

        const stageHtml = '<div class="stage-card">' +
            '<div class="stage-card-header">' +
                '<div class="stage-card-header-row">' +
                    '<input type="text" class="stage-name-input" value="" placeholder="请输入阶段名称">' +
                    '<div class="stage-sequential">' +
                        '<span>按序执行</span>' +
                        '<div class="switch" onclick="toggleStageSequential(this)"></div>' +
                    '</div>' +
                '</div>' +
                '<div class="stage-card-header-row">' +
                    '<div class="stage-actions">' +
                        '<div class="stage-action-btn add" onclick="addTaskToStage(this)">+ 添加任务</div>' +
                        '<div class="stage-action-btn delete" onclick="deleteStage(this)">× 删除阶段</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="task-edit-list"></div>' +
        '</div>';

        list.insertAdjacentHTML('beforeend', stageHtml);

        const cards = list.querySelectorAll('.stage-card');
        const newStage = cards[cards.length - 1];
        const nameInput = newStage ? newStage.querySelector('.stage-name-input') : null;
        if (nameInput) nameInput.focus();
        if (newStage) newStage.scrollIntoView({ behavior: 'smooth' });
    }

    // ==================== 人员搜索函数 ====================
    
    /**
     * 切换执行人搜索下拉
     * @param {string} type - 类型(new/edit)
     */
    function toggleExecutorSearch(type) {
        const dropdown = document.getElementById(type + 'TaskExecutorDropdown');
        if (!dropdown) return;
        
        const allDropdowns = document.querySelectorAll('.search-dropdown');
        allDropdowns.forEach(d => {
            if (d !== dropdown) d.classList.remove('show');
        });
        
        dropdown.classList.add('show');
        
        const options = dropdown.querySelectorAll('.person-option');
        options.forEach(option => {
            option.style.display = 'flex';
        });
    }
    
    /**
     * 切换确认人搜索下拉
     * @param {string} type - 类型(new/edit)
     */
    function toggleConfirmerSearch(type) {
        const dropdown = document.getElementById(type + 'TaskConfirmerDropdown');
        if (!dropdown) return;
        
        const allDropdowns = document.querySelectorAll('.search-dropdown');
        allDropdowns.forEach(d => {
            if (d !== dropdown) d.classList.remove('show');
        });
        
        dropdown.classList.add('show');
        
        const options = dropdown.querySelectorAll('.person-option');
        options.forEach(option => {
            option.style.display = 'flex';
        });
    }
    
    /**
     * 选择执行人
     * @param {string} type - 类型(new/edit)
     * @param {string} name - 姓名
     * @param {string} role - 角色
     */
    function selectExecutor(type, name, role) {
        const searchInput = document.getElementById(type + 'TaskExecutorSearch');
        const hiddenInput = document.getElementById(type + 'TaskExecutor');
        const dropdown = document.getElementById(type + 'TaskExecutorDropdown');
        const tagsContainer = document.getElementById(type + 'TaskExecutorTags');
        
        if (hiddenInput) hiddenInput.value = name;
        if (searchInput) searchInput.value = '';
        if (dropdown) dropdown.classList.remove('show');
        
        if (tagsContainer) {
            tagsContainer.innerHTML = `
                <div class="confirm-person-tag">
                    ${name}（${role}）
                    <span class="remove" onclick="ContractDetailPage.removeExecutor('${type}')">×</span>
                </div>
            `;
        }
    }
    
    /**
     * 移除执行人
     * @param {string} type - 类型(new/edit)
     */
    function removeExecutor(type) {
        const hiddenInput = document.getElementById(type + 'TaskExecutor');
        const tagsContainer = document.getElementById(type + 'TaskExecutorTags');
        
        if (hiddenInput) hiddenInput.value = '';
        if (tagsContainer) tagsContainer.innerHTML = '';
    }
    
    /**
     * 选择确认人
     * @param {string} type - 类型(new/edit)
     * @param {string} name - 姓名
     * @param {string} role - 角色
     */
    function selectConfirmer(type, name, role) {
        const dropdown = document.getElementById(type + 'TaskConfirmerDropdown');
        const searchInput = document.getElementById(type + 'TaskConfirmerSearch');
        const confirmPersonList = type === 'new' ? state.newTaskConfirmPersonList : state.editTaskConfirmPersonList;
        
        if (!confirmPersonList.includes(name) && confirmPersonList.length < 5) {
            confirmPersonList.push(name);
            if (type === 'new') {
                updateConfirmPersonTags();
            } else {
                updateEditConfirmPersonTags();
            }
        }
        
        if (searchInput) searchInput.value = '';
        if (dropdown) dropdown.classList.remove('show');
    }
    
    /**
     * 过滤执行人列表
     * @param {string} type - 类型(new/edit)
     */
    function filterExecutorList(type) {
        const searchInput = document.getElementById(type + 'TaskExecutorSearch');
        const dropdown = document.getElementById(type + 'TaskExecutorDropdown');
        if (!searchInput || !dropdown) return;
        
        const keyword = searchInput.value.toLowerCase();
        
        const options = dropdown.querySelectorAll('.person-option');
        options.forEach(option => {
            const nameEl = option.querySelector('.name');
            const roleEl = option.querySelector('.role-tag');
            const name = nameEl ? nameEl.textContent.toLowerCase() : '';
            const role = roleEl ? roleEl.textContent.toLowerCase() : '';
            
            if (name.includes(keyword) || role.includes(keyword)) {
                option.style.display = 'flex';
            } else {
                option.style.display = 'none';
            }
        });
    }
    
    /**
     * 过滤确认人列表
     * @param {string} type - 类型(new/edit)
     */
    function filterConfirmerList(type) {
        const searchInput = document.getElementById(type + 'TaskConfirmerSearch');
        const dropdown = document.getElementById(type + 'TaskConfirmerDropdown');
        if (!searchInput || !dropdown) return;
        
        const keyword = searchInput.value.toLowerCase();
        
        const options = dropdown.querySelectorAll('.person-option');
        options.forEach(option => {
            const nameEl = option.querySelector('.name');
            const roleEl = option.querySelector('.role-tag');
            const name = nameEl ? nameEl.textContent.toLowerCase() : '';
            const role = roleEl ? roleEl.textContent.toLowerCase() : '';
            
            if (name.includes(keyword) || role.includes(keyword)) {
                option.style.display = 'flex';
            } else {
                option.style.display = 'none';
            }
        });
    }
    
    // ==================== 签约文件函数 ====================
    
    /**
     * 显示签约文件上传页面
     */
    function showSignUploadPage() {
        const page = document.getElementById('signUploadPage');
        if (page) page.classList.add('show');
    }
    
    /**
     * 关闭签约文件上传页面
     */
    function closeSignUploadPage() {
        const page = document.getElementById('signUploadPage');
        if (page) page.classList.remove('show');
    }
    
    /**
     * 处理签约文件选择
     * @param {HTMLInputElement} input - 文件输入元素
     */
    function handleSignFileSelect(input) {
        if (input.files.length > 0) {
            const file = input.files[0];
            state.signFiles.push({
                name: file.name,
                size: (file.size / 1024).toFixed(1) + 'KB'
            });
            renderSignFileList();
        }
    }
    
    /**
     * 渲染签约文件列表
     */
    function renderSignFileList() {
        const fileList = document.getElementById('signFileList');
        if (!fileList) return;
        
        fileList.innerHTML = state.signFiles.map((file, index) => `
            <div class="file-item">
                <div class="file-icon">📄</div>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${file.size}</div>
                </div>
                <div class="file-remove" onclick="ContractDetailPage.removeSignFile(${index})">×</div>
            </div>
        `).join('');
    }
    
    /**
     * 移除签约文件
     * @param {number} index - 文件索引
     */
    function removeSignFile(index) {
        state.signFiles.splice(index, 1);
        renderSignFileList();
    }
    
    /**
     * 提交签约文件
     */
    function submitSignFile() {
        if (state.signFiles.length === 0) {
            showCustomToast('请上传签约文件');
            return;
        }
        showCustomToast('签约文件已上传！合同已正式生效。');
        closeSignUploadPage();
        updateContractStatus('signed');
    }
    
    /**
     * 显示签约确认弹窗
     */
    function showSignConfirmModal() {
        const modal = document.getElementById('signConfirmModal');
        if (modal) modal.classList.add('show');
    }
    
    /**
     * 关闭签约确认弹窗
     */
    function closeSignConfirmModal() {
        const modal = document.getElementById('signConfirmModal');
        if (modal) modal.classList.remove('show');
    }
    
    /**
     * 预览签约文件
     */
    function previewSignFile() {
        showCustomToast('预览签约文件');
    }
    
    /**
     * 驳回签约
     */
    function rejectSign() {
        showCustomToast('签约文件已驳回！系统已通知对方。');
        closeSignConfirmModal();
        updateContractStatus('confirmed');
    }
    
    /**
     * 确认签约
     */
    function confirmSign() {
        showCustomToast('签约确认成功！合同已正式生效。');
        closeSignConfirmModal();
        updateContractStatus('signed');
    }
    
    // ==================== PC端打开函数 ====================
    

    
    // ==================== 事件绑定 ====================
    
    /**
     * 绑定全局事件
     */
    function bindGlobalEvents() {
        // 点击遮罩关闭弹窗
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal-overlay')) {
                e.target.classList.remove('show');
            }
            
            const actionMenu = document.getElementById('actionMenu');
            if (actionMenu && !e.target.closest('.actions')) {
                actionMenu.classList.remove('show');
            }
        });
        
        // 点击其他区域关闭搜索下拉
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.search-select')) {
                document.querySelectorAll('.search-dropdown').forEach(d => {
                    d.classList.remove('show');
                });
            }
        });

        // 拟定中编辑表单：必填项变化时实时刷新「提交确认」可用态（不重渲染表单，避免清空未保存内容）
        var draftForm = document.getElementById('draftEditForm');
        if (draftForm) {
            var refreshSubmitState = function() {
                if (state.currentStatus === 'draft' || state.currentStatus === 'draft_submittable' ||
                    state.currentStatus === 'platform_rejected' || state.currentStatus === 'platform_rejected_modified') {
                    updateBottomActions(contractStatus[state.currentStatus]);
                }
            };
            draftForm.addEventListener('input', refreshSubmitState);
            draftForm.addEventListener('change', refreshSubmitState);
        }
    }
    
    // ==================== 初始化 ====================
    
    /**
     * 初始化模块
     */
    function init() {
        bindGlobalEvents();
        initFromUrl();
        applyAmountMask();
    }
    
    // DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // ==================== 金额脱敏演示 ====================
    var _maskPermission = 'all';
    var _maskUserId = 'chenzhuang';

    function applyAmountMask() {
        var contractRow = document.getElementById('contractAmountRow');
        var changeRow = document.getElementById('contractAmountChange');
        if (!window.ContractAmountMask) return;
        
        var displayAmount = _maskPermission === 'all' ? '¥80,000.00' : '***';
        if (contractRow) contractRow.textContent = displayAmount;
        
        // 变更对比行：脱敏时隐藏变更金额对比（内容本身敏感）
        if (changeRow) {
            if (_maskPermission === 'all') {
                // Keep original display (JS handles show/hide)
            } else {
                changeRow.querySelector('.value').innerHTML = '<span style=\"color:var(--text-tertiary);\">***</span>';
            }
        }
    }

    function toggleAmountMask(perm) {
        _maskPermission = perm;
        applyAmountMask();
    }
    
    // ==================== 公开API ====================
    return {
        // 状态获取
        getCurrentStatus: () => state.currentStatus,
        getIsReadonly: () => state.isReadonly,
        
        // Toast和确认弹窗
        showToast,
        showCustomToast,
        closeCustomToast,
        showCustomConfirm,
        closeCustomConfirm,
        confirmCustomConfirm,
        
        // 状态更新
        updateContractStatus,
        demoFulfilled,
        demoSigned,
        updateFulfilledBadge,
        
        // 交互函数
        switchSection,
        toggleStage,
        showFullText,
        closeFullText,
        saveFullText,
        toggleQRCode,
        toggleActionMenu,
        closeActionMenu,
        
        // 弹窗函数
        showStatusModal,
        closeModal,
        
        // 金额脱敏
        toggleAmountMask,
        applyAmountMask,
        confirmAction,
        updateRejectReasonCount,
        getRejectReason,
        
        // 版本记录
        showVersionModal,
        closeVersionModal,
        
        // 导出
        exportContract,
        previewContract,
        showExportModal,
        closeExportModal,
        exportToPDF,
        shareToWechat,
        
        // 变更记录
        showChangeRecordModal,
        closeChangeRecordModal,
        viewChangeVersion,
        
        // 变更操作
        checkChangeReason,
        showChangeModal,
        closeChangeModal,
        onChangeAmountInput,
        updateChangeAmountDiff,
        formatMoney,
        showMoreOptions,
        toggleChangeActionMenu,
        closeChangeActionMenu,
        switchChangeTab,
        showChangeTemplatePicker,
        addNewAttachment,
        switchDraftContentTab,
        showDraftTemplatePicker,
        previewAttachment,
        submitChange,
        showChangeConfirmModal,
        closeChangeConfirmModal,
        confirmChange,
        rejectChange,
        
        // 任务编辑
        addTaskToStage,
        closeAddTaskModal,
        addNewTaskConfirmer,
        removeNewTaskConfirmer,
        confirmAddTask,
        viewTaskDetail,
        closeTaskDetailModal,
        editTaskDetail,
        closeEditTaskModal,
        openTaskReadonly,
        addEditTaskConfirmer,
        removeEditTaskConfirmer,
        confirmEditTask,
        deleteTask,
        // 工艺参考示例（新增 / 编辑任务）
        openCraftRefEditor,
        saveCraftRef,
        closeCraftRefEditor,
        deleteCraftRef,
        handleCraftRefUpload,
        renderCraftRefEditor,
        updateCraftRefItemTitle,
        removeCraftRefBufferItem,
        deleteStage,
        toggleStageSequential,
        editStageSettings,
        addNewStage,
        addNewStageDraft,
        
        // 人员搜索
        toggleExecutorSearch,
        toggleConfirmerSearch,
        selectExecutor,
        removeExecutor,
        selectConfirmer,
        filterExecutorList,
        filterConfirmerList,
        
        // 签约文件
        showSignUploadPage,
        closeSignUploadPage,
        handleSignFileSelect,
        removeSignFile,
        submitSignFile,
        showSignConfirmModal,
        closeSignConfirmModal,
        previewSignFile,
        rejectSign,
        confirmSign,
        

        
        // 模板选择函数
        showTemplatePicker,
        showStageTemplatePicker,
        closeTemplatePicker,
        closeStageTemplatePicker,
        closeTemplatePreviewModal,
        applyTemplateDirectly,
        applyStageTemplateDirectly,
        previewTemplate,
        previewStageTemplate,
        applyTemplateFromPreview,
        addNewStage,
        addTaskToStage,
        uploadAttachment,
        removeAttachment
    };
})();

// ==================== 全局函数别名 ====================
// 为了兼容 HTML 中的 onclick 事件，创建全局别名
// 必须显式赋值给 window 对象才能在 onclick 中访问
window.showToast = ContractDetailPage.showToast;
window.showCustomToast = ContractDetailPage.showCustomToast;
window.closeCustomToast = ContractDetailPage.closeCustomToast;
window.showCustomConfirm = ContractDetailPage.showCustomConfirm;
window.closeCustomConfirm = ContractDetailPage.closeCustomConfirm;
window.confirmCustomConfirm = ContractDetailPage.confirmCustomConfirm;
window.updateContractStatus = ContractDetailPage.updateContractStatus;
window.demoFulfilled = ContractDetailPage.demoFulfilled;
window.demoSigned = ContractDetailPage.demoSigned;
window.switchSection = ContractDetailPage.switchSection;
window.toggleStage = ContractDetailPage.toggleStage;
window.showFullText = ContractDetailPage.showFullText;
window.closeFullText = ContractDetailPage.closeFullText;
window.saveFullText = ContractDetailPage.saveFullText;
window.toggleQRCode = ContractDetailPage.toggleQRCode;
window.toggleActionMenu = ContractDetailPage.toggleActionMenu;
window.closeActionMenu = ContractDetailPage.closeActionMenu;
window.showStatusModal = ContractDetailPage.showStatusModal;
window.closeModal = ContractDetailPage.closeModal;
window.confirmAction = ContractDetailPage.confirmAction;
window.updateRejectReasonCount = ContractDetailPage.updateRejectReasonCount;
window.getRejectReason = ContractDetailPage.getRejectReason;
window.showVersionModal = ContractDetailPage.showVersionModal;
window.closeVersionModal = ContractDetailPage.closeVersionModal;
window.exportContract = ContractDetailPage.exportContract;
window.previewContract = ContractDetailPage.previewContract;
window.showExportModal = ContractDetailPage.showExportModal;
window.closeExportModal = ContractDetailPage.closeExportModal;
window.exportToPDF = ContractDetailPage.exportToPDF;
window.shareToWechat = ContractDetailPage.shareToWechat;
window.shareToFriend = ContractDetailPage.shareToFriend;
window.showChangeRecordModal = ContractDetailPage.showChangeRecordModal;
window.closeChangeRecordModal = ContractDetailPage.closeChangeRecordModal;
window.viewChangeVersion = ContractDetailPage.viewChangeVersion;
window.checkChangeReason = ContractDetailPage.checkChangeReason;
window.showChangeModal = ContractDetailPage.showChangeModal;
window.closeChangeModal = ContractDetailPage.closeChangeModal;
window.onChangeAmountInput = ContractDetailPage.onChangeAmountInput;
window.updateChangeAmountDiff = ContractDetailPage.updateChangeAmountDiff;
window.formatMoney = ContractDetailPage.formatMoney;
window.showMoreOptions = ContractDetailPage.showMoreOptions;
window.toggleChangeActionMenu = ContractDetailPage.toggleChangeActionMenu;
window.closeChangeActionMenu = ContractDetailPage.closeChangeActionMenu;
window.switchChangeTab = ContractDetailPage.switchChangeTab;
window.showChangeTemplatePicker = ContractDetailPage.showChangeTemplatePicker;
window.addNewAttachment = ContractDetailPage.addNewAttachment;
window.switchDraftContentTab = ContractDetailPage.switchDraftContentTab;
window.showDraftTemplatePicker = ContractDetailPage.showDraftTemplatePicker;
window.previewAttachment = ContractDetailPage.previewAttachment;
window.submitChange = ContractDetailPage.submitChange;
window.showChangeConfirmModal = ContractDetailPage.showChangeConfirmModal;
window.closeChangeConfirmModal = ContractDetailPage.closeChangeConfirmModal;
window.confirmChange = ContractDetailPage.confirmChange;
window.rejectChange = ContractDetailPage.rejectChange;
window.addTaskToStage = ContractDetailPage.addTaskToStage;
window.closeAddTaskModal = ContractDetailPage.closeAddTaskModal;
window.addNewTaskConfirmer = ContractDetailPage.addNewTaskConfirmer;
window.removeNewTaskConfirmer = ContractDetailPage.removeNewTaskConfirmer;
window.confirmAddTask = ContractDetailPage.confirmAddTask;
window.viewTaskDetail = ContractDetailPage.viewTaskDetail;
window.closeTaskDetailModal = ContractDetailPage.closeTaskDetailModal;
window.editTaskDetail = ContractDetailPage.editTaskDetail;
window.closeEditTaskModal = ContractDetailPage.closeEditTaskModal;
window.openTaskReadonly = ContractDetailPage.openTaskReadonly;
window.addEditTaskConfirmer = ContractDetailPage.addEditTaskConfirmer;
window.removeEditTaskConfirmer = ContractDetailPage.removeEditTaskConfirmer;
window.confirmEditTask = ContractDetailPage.confirmEditTask;
window.deleteTask = ContractDetailPage.deleteTask;
window.openCraftRefEditor = ContractDetailPage.openCraftRefEditor;
window.saveCraftRef = ContractDetailPage.saveCraftRef;
window.closeCraftRefEditor = ContractDetailPage.closeCraftRefEditor;
window.deleteCraftRef = ContractDetailPage.deleteCraftRef;
window.handleCraftRefUpload = ContractDetailPage.handleCraftRefUpload;
window.renderCraftRefEditor = ContractDetailPage.renderCraftRefEditor;
window.updateCraftRefItemTitle = ContractDetailPage.updateCraftRefItemTitle;
window.removeCraftRefBufferItem = ContractDetailPage.removeCraftRefBufferItem;
window.deleteStage = ContractDetailPage.deleteStage;
window.toggleStageSequential = ContractDetailPage.toggleStageSequential;
window.editStageSettings = ContractDetailPage.editStageSettings;
window.addNewStage = ContractDetailPage.addNewStage;
window.addNewStageDraft = ContractDetailPage.addNewStageDraft;
window.toggleExecutorSearch = ContractDetailPage.toggleExecutorSearch;
window.toggleConfirmerSearch = ContractDetailPage.toggleConfirmerSearch;
window.selectExecutor = ContractDetailPage.selectExecutor;
window.removeExecutor = ContractDetailPage.removeExecutor;
window.selectConfirmer = ContractDetailPage.selectConfirmer;
window.filterExecutorList = ContractDetailPage.filterExecutorList;
window.filterConfirmerList = ContractDetailPage.filterConfirmerList;
window.showSignUploadPage = ContractDetailPage.showSignUploadPage;
window.closeSignUploadPage = ContractDetailPage.closeSignUploadPage;
window.handleSignFileSelect = ContractDetailPage.handleSignFileSelect;
window.removeSignFile = ContractDetailPage.removeSignFile;
window.submitSignFile = ContractDetailPage.submitSignFile;
window.showSignConfirmModal = ContractDetailPage.showSignConfirmModal;
window.closeSignConfirmModal = ContractDetailPage.closeSignConfirmModal;
window.previewSignFile = ContractDetailPage.previewSignFile;
window.rejectSign = ContractDetailPage.rejectSign;
window.confirmSign = ContractDetailPage.confirmSign;

// ==================== 模板选择函数全局别名 ====================
window.showTemplatePicker = ContractDetailPage.showTemplatePicker;
window.showStageTemplatePicker = ContractDetailPage.showStageTemplatePicker;
window.closeTemplatePicker = ContractDetailPage.closeTemplatePicker;
window.closeStageTemplatePicker = ContractDetailPage.closeStageTemplatePicker;
window.closeTemplatePreviewModal = ContractDetailPage.closeTemplatePreviewModal;
window.applyTemplateDirectly = ContractDetailPage.applyTemplateDirectly;
window.applyStageTemplateDirectly = ContractDetailPage.applyStageTemplateDirectly;
window.previewTemplate = ContractDetailPage.previewTemplate;
window.previewStageTemplate = ContractDetailPage.previewStageTemplate;
window.applyTemplateFromPreview = ContractDetailPage.applyTemplateFromPreview;
window.addNewStage = ContractDetailPage.addNewStage;
window.addTaskToStage = ContractDetailPage.addTaskToStage;
window.uploadAttachment = ContractDetailPage.uploadAttachment;
window.removeAttachment = ContractDetailPage.removeAttachment;

// ==================== 状态分组折叠/展开 ====================
window.toggleStatusGroup = function(headerElement) {
    const content = headerElement.nextElementSibling;
    const icon = headerElement.querySelector('.status-group-icon');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.textContent = '▼';
        headerElement.classList.add('expanded');
        headerElement.classList.remove('collapsed');
    } else {
        content.style.display = 'none';
        icon.textContent = '▶';
        headerElement.classList.add('collapsed');
        headerElement.classList.remove('expanded');
    }
};
