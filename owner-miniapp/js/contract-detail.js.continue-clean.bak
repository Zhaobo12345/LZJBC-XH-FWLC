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
        currentStatus: 'draft_party_a',
        isReadonly: false,
        hasChangeContent: false,
        changeType: 'stage_only',
        changeReason: '',
        currentStageItem: null,
        newTaskConfirmPersonList: [],
        currentEditTaskItem: null,
        editTaskConfirmPersonList: [],
        customConfirmCallback: null,
        customConfirmDanger: false,
        signFiles: [],
        currentModalAction: ''
    };
    
    // ==================== 合同状态配置 ====================
    const contractStatus = {
        draft: {
            text: '拟定中',
            desc: '合同正在编辑中，等待对方完善合同内容',
            bannerClass: 'draft',
            showPcGuide: false,
            hideTabs: true,
            readonly: true,
            actions: []
        },
        draft_party_a: {
            text: '拟定中',
            desc: '合同正在编辑中，等待对方完善合同内容',
            bannerClass: 'draft',
            showPcGuide: false,
            isNew: false,
            isPartyA: true,
            actions: []
        },
        draft_submittable: {
            text: '拟定中',
            desc: '合同已完善，等待对方提交确认',
            bannerClass: 'draft',
            showPcGuide: false,
            hideTabs: true,
            readonly: true,
            actions: []
        },
        platform_reviewing: {
            text: '待平台审核',
            desc: '乙方已提交确认申请，平台运营人员正在审核中，审核通过后您将收到去确认通知',
            bannerClass: 'reviewing',
            readonly: true,
            showPcGuide: false,
            actions: []
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
            desc: '平台审核未通过，乙方会根据驳回原因修改合同内容后重新提交',
            bannerClass: 'rejected',
            showPcGuide: false,
            showRejectReason: true,
            rejectReason: '合同条款不符合平台规范，请补充完善施工范围说明及验收标准',
            actions: []
        },

        confirming_sender: {
            text: '待对方确认',
            desc: '平台审核已通过，等待对方确认合同内容',
            bannerClass: 'confirming',
            readonly: true,
            showPcGuide: false,
            actions: []
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
            desc: '合同已正式生效',
            bannerClass: 'signed',
            showPcGuide: false,
            readonly: true,
            actions: []
        },
        changing: {
            text: '变更中',
            desc: '变更申请已发起，等待对方确认',
            bannerClass: 'changing',
            readonly: true,
            showPcGuide: false,
            actions: []
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
            desc: '乙方已提交变更申请，平台审核中，审核通过后将通知甲方进行确认',
            bannerClass: 'reviewing',
            readonly: true,
            showPcGuide: false,
            isChangeFlow: true,
            actions: []
        },
        change_platform_rejected: {
            text: '已签约',
            desc: '合同已正式生效，可发起变更申请',
            bannerClass: 'signed',
            readonly: true,
            showPcGuide: false,
            isChangeFlow: false,
            showRejectReason: false,
            actions: []
        },
        change_confirming_sender: {
            text: '变更确认中',
            desc: '平台审核已通过，等待对方确认变更内容',
            bannerClass: 'confirming',
            readonly: true,
            showPcGuide: false,
            isChangeFlow: true,
            actions: []
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
            desc: '变更已确认，等待乙方上传线下已签约的合同变更文件，上传后变更正式生效',
            bannerClass: 'confirmed',
            readonly: true,
            showPcGuide: false,
            isChangeFlow: true,
            actions: []
        },
        change_confirmed: {
            text: '变更已确认',
            desc: '合同变更已生效，可继续执行任务',
            bannerClass: 'signed',
            readonly: true,
            showPcGuide: false,
            isChangeFlow: true,
            actions: []
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
    function initFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        
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
        
        // 编辑引导
        const editGuideBox = document.getElementById('editGuideBox');
        if (editGuideBox) {
            editGuideBox.style.display = config.showEditGuide ? 'block' : 'none';
        }
        
        // PC端编辑引导
        const pcGuide = document.getElementById('pcEditGuide');
        if (pcGuide) {
            pcGuide.style.display = config.showPcGuide ? 'block' : 'none';
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
     * 更新变更相关显示
     * @param {string} status - 状态标识
     * @param {Object} config - 状态配置
     */
    function updateChangeDisplay(status, config) {
        const changeReasonDisplay = document.getElementById('changeReasonDisplay');
        const changeSummaryDisplay = document.getElementById('changeSummaryDisplay');
        const changeHighlightBanner = document.getElementById('changeHighlightBanner');
        const changeStates = ['changing', 'change_confirming', 'change_platform_reviewing', 'change_confirming_sender', 'change_confirming_receiver', 'change_signing_wait', 'change_signing', 'change_confirmed'];
        
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

            if (action.disabled) {
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
                if (action.disabledReason) {
                    btn.title = action.disabledReason;
                }
            } else {
                btn.onclick = function() {
                    ContractDetailPage.showStatusModal(action.action);
                };
                if (action.fullWidth) {
                    btn.style.width = '100%';
                }
            }

            btn.textContent = action.text || '';
            actionsContainer.appendChild(btn);
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
            'change_signing_wait': '变更签约中',
            'change_confirmed': '变更已确认'
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
            'confirming_receiver': { a: '确认中', b: '已确认' },
            'confirmed': { a: '已确认', b: '已确认' },
            'confirmed_party_a': { a: '已确认', b: '已确认' },
            'signed': { a: '已确认', b: '已确认' },
            'changing': { a: '变更中', b: '待确认' },
            'change_confirming': { a: '确认中', b: '已确认' },
            'change_confirmed': { a: '已确认', b: '已确认' }
        };
        
        if (partyATag && partyBTag) {
            // 拟定中状态、待平台审核、平台审核驳回状态不显示签约双方状态
            if (['draft', 'draft_party_a', 'draft_submittable', 'platform_reviewing', 'platform_rejected'].includes(status)) {
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
        const showSignFileStates = ['signed', 'changing', 'change_confirming', 'change_confirmed', 'change_platform_reviewing', 'change_platform_rejected', 'change_confirming_sender', 'change_confirming_receiver', 'change_signing_wait'];
        const canUploadSignFileStates = ['confirmed'];
        
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
            'confirmed_party_a': { desc: '双方已确认，等待乙方上传签约附件', show: true },
            'signed': { desc: '合同已签约生效，可发起变更申请', show: true },
            'changing': { desc: '变更申请已发起，等待对方确认', show: true },
            'change_confirming': { desc: '对方发起变更，请确认或驳回', show: true },
            'change_confirmed': { desc: '变更已生效，可继续执行任务', show: true }
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
        const modal = document.getElementById('fullTextModal');
        if (modal) modal.classList.add('show');
    }
    
    /**
     * 关闭全文弹窗
     */
    function closeFullText() {
        const modal = document.getElementById('fullTextModal');
        if (modal) modal.classList.remove('show');
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
    function copyEditLink() {
        const link = 'https://www.example.com/contract/edit/BJSDSWHT000001';
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(link).then(function() {
                showCustomToast('链接已复制到剪贴板！\n\n请在电脑浏览器中打开该链接，使用手机扫码授权登录后即可编辑合同。');
            }).catch(function() {
                fallbackCopy(link);
            });
        } else {
            fallbackCopy(link);
        }
    }
    
    /**
     * 降级复制方法
     * @param {string} text - 要复制的文本
     */
    function fallbackCopy(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showCustomToast('链接已复制到剪贴板！\n\n请在电脑浏览器中打开该链接，使用手机扫码授权登录后即可编辑合同。');
        } catch (err) {
            showCustomToast('复制失败，请手动复制以下链接：\n\n' + text);
        }
        document.body.removeChild(textArea);
    }
    
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
            confirm: { title: '确认合同', message: '是否确认此合同内容？确认后乙方上传签约文件。' },
            upload: { title: '上传签约文件', message: '请选择要上传的签约文件（支持PDF、JPG、PNG格式）。' },
            change: { title: '发起变更', message: '确定要发起合同变更吗？变更后需对方确认。' },
            withdraw_change: { title: '撤回变更', message: '确定要撤回变更申请吗？撤回后阶段任务将恢复流转。' },
            reject_change: { title: '驳回变更', message: '确定要驳回变更申请吗？' },
            confirm_change: { title: '确认变更', message: '是否确认变更内容？确认后变更将生效。' },
            withdraw_sign: { title: '撤回签约文件', message: '确定要撤回签约文件吗？撤回后可重新上传。' },
            reject_sign: { title: '驳回签约', message: '确定要驳回签约文件吗？' },
            confirm_sign: { title: '确认签约', message: '确定要确认签约吗？确认后合同将正式生效。' },
            withdraw_change_review: { title: '撤回变更申请', message: '确定要撤回变更申请吗？撤回后可重新编辑变更内容。' },
            resubmit_change: { title: '重新发起变更', message: '确定要重新发起变更申请吗？提交后将由平台运营人员进行审核。' },
            reject_change_flow: { title: '驳回变更', message: '确定要驳回变更申请吗？' },
            confirm_change_flow: { title: '确认变更', message: '是否确认变更？确认后乙方上传签约文件变更生效！' },
            upload_change_sign: { title: '上传变更签约文件', message: '请选择要上传的变更签约文件（支持PDF、JPG、PNG格式）。' }
        };
        
        if (action === 'upload') {
            closeModal();
            showSignUploadPage();
            return;
        }
        
        if (action === 'upload_change_sign') {
            closeModal();
            showCustomToast('变更签约文件已上传！变更已正式生效，系统已生成新的版本记录。');
            updateContractStatus('signed');
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
        
        closeModal();
        
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
                showCustomToast('确认成功！等待乙方上传签约附件');
                updateContractStatus('confirmed_party_a');
            },
            '发起变更': () => {
                showChangeModal();
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
                if (state.currentModalAction === 'confirm_change') {
                    showCustomToast('变更已生效！');
                    updateContractStatus('change_confirmed');
                } else {
                    showCustomToast('变更已确认！等待乙方上传签约文件后生效。');
                    updateContractStatus('change_signing_wait');
                }
            },
            '撤回变更申请': () => {
                showCustomToast('已撤回变更申请，可重新编辑变更内容');
                updateContractStatus('signed');
            },
            '重新发起变更': () => {
                showCustomToast('重新提交成功！已提交至平台审核');
                updateContractStatus('change_platform_reviewing');
            },
            '上传变更签约文件': () => {
                showCustomToast('变更签约文件已上传！变更已正式生效，系统已生成新的版本记录。');
                updateContractStatus('signed');
            }
        };
        
        if (actions[titleText]) {
            actions[titleText]();
        } else {
            showCustomToast('操作成功！');
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
                    { tag: 'V2', name: '变更版本（变更中）', desc: '等待对方确认', date: '2024-02-12 发起变更', current: true },
                    { tag: 'V1', name: '初始版本', desc: '首次签约版本', date: '2024-01-10 签约生效', current: false }
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
                    { tag: 'V2', name: '变更版本（待确认）', desc: '请确认或驳回', date: '2024-02-12 发起变更', current: true },
                    { tag: 'V1', name: '初始版本', desc: '首次签约版本', date: '2024-01-10 签约生效', current: false }
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
                    { tag: 'V2', name: '变更版本（审核中）', desc: '平台审核中', date: '2024-02-12 发起变更', current: true },
                    { tag: 'V1', name: '初始版本', desc: '首次签约版本', date: '2024-01-10 签约生效', current: false }
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
                    { tag: 'V2', name: '变更版本（已驳回）', desc: '审核未通过', date: '2024-02-12 发起变更', current: true },
                    { tag: 'V1', name: '初始版本', desc: '首次签约版本', date: '2024-01-10 签约生效', current: false }
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
                    { tag: 'V2', name: '变更版本（确认中）', desc: '等待对方确认', date: '2024-02-12 发起变更', current: true },
                    { tag: 'V1', name: '初始版本', desc: '首次签约版本', date: '2024-01-10 签约生效', current: false }
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
                    { tag: 'V2', name: '变更版本（待确认）', desc: '请确认或驳回', date: '2024-02-12 发起变更', current: true },
                    { tag: 'V1', name: '初始版本', desc: '首次签约版本', date: '2024-01-10 签约生效', current: false }
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
                    { tag: 'V2', name: '变更版本（待签约）', desc: '请上传签约文件', date: '2024-02-15 变更确认', current: true },
                    { tag: 'V1', name: '初始版本', desc: '首次签约版本', date: '2024-01-10 签约生效', current: false }
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
            'v1': '初始版本',
            'v2': '第二次变更',
            'v3': '第三次变更（当前）'
        };
        showCustomToast('正在加载' + versionNames[version] + '合同详情...\n\n将展示该版本下的合同基本信息、合同正文、阶段任务、附件等内容');
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
     * 选择变更类型
     * @param {HTMLElement} element - 元素
     * @param {string} type - 类型
     */
    function selectChangeType(element, type) {
        state.changeType = type;
        document.querySelectorAll('.change-type-option').forEach(opt => {
            opt.classList.remove('selected');
            opt.querySelector('.type-radio').classList.remove('checked');
        });
        element.classList.add('selected');
        element.querySelector('.type-radio').classList.add('checked');
    }
    
    /**
     * 检查变更内容
     */
    function checkChangeContent() {
        const container = document.getElementById('stageEditContainer');
        if (!container) return;
        
        const stages = container.querySelectorAll('.stage-edit-item');
        
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
        if (modal) modal.classList.add('show');
        checkChangeContent();
    }
    
    /**
     * 关闭变更弹窗
     */
    function closeChangeModal() {
        const modal = document.getElementById('changeModal');
        if (modal) modal.classList.remove('show');
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
     * 显示PC端编辑引导
     */
    function showPCEditGuide() {
        showCustomToast('请前往电脑端修改合同正文\n\n1. 在电脑浏览器打开平台官网\n2. 使用手机扫码授权登录\n3. 进入合同管理进行编辑\n\n链接已复制到剪贴板');
        copyEditLink();
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
        
        if (state.changeType === 'stage_only') {
            showCustomConfirm('提交变更', '确定要提交变更申请吗？\n\n提交后将通知对方进行确认，确认前阶段任务将暂停流转。', function() {
                closeChangeModal();
                showCustomToast('变更申请已提交！\n\n系统已发送消息通知对方，请等待对方确认。');
                updateContractStatus('changing');
            });
        } else {
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
        showCustomToast('变更已确认！等待乙方上传签约文件后生效。');
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
        state.currentStageItem = btn.closest('.stage-edit-item');
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
        if (newTaskExecutor) newTaskExecutor.value = '';
        if (newTaskExecutorSearch) newTaskExecutorSearch.value = '';
        if (newTaskExecutorTags) newTaskExecutorTags.innerHTML = '';
        if (newTaskConfirmerSearch) newTaskConfirmerSearch.value = '';
        if (newTaskExecStandard) newTaskExecStandard.value = '';
        if (newTaskConfirmStandard) newTaskConfirmStandard.value = '';
        if (newTaskLiableStandard) newTaskLiableStandard.value = '';
        
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
    function editTaskDetail(btn) {
        const taskItem = btn.closest('.task-edit-item');
        if (!taskItem) return;
        
        if (taskItem.dataset.completed === 'true') {
            showCustomToast('已完成的任务不支持编辑');
            return;
        }
        
        state.currentEditTaskItem = taskItem;
        
        const taskName = taskItem.querySelector('.task-input').value;
        const executor = taskItem.dataset.executor || '';
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
        
        if (editTaskExecStandard) editTaskExecStandard.value = execStandard;
        if (editTaskConfirmStandard) editTaskConfirmStandard.value = confirmStandard;
        if (editTaskLiableStandard) editTaskLiableStandard.value = liableStandard;
        
        const modal = document.getElementById('editTaskModal');
        if (modal) modal.classList.add('show');
    }
    
    /**
     * 关闭编辑任务弹窗
     */
    function closeEditTaskModal() {
        const modal = document.getElementById('editTaskModal');
        if (modal) modal.classList.remove('show');
        
        const editTaskExecutorTags = document.getElementById('editTaskExecutorTags');
        if (editTaskExecutorTags) editTaskExecutorTags.innerHTML = '';
        
        state.currentEditTaskItem = null;
        state.editTaskConfirmPersonList = [];
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
            showToast('任务已更新');
        }
        
        closeEditTaskModal();
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
        
        if (taskList && taskList.querySelectorAll('.task-edit-item').length > 1) {
            showCustomConfirm('删除任务', '确定要删除此任务吗？', function() {
                taskItem.remove();
                checkChangeContent();
            }, true);
        } else {
            showCustomToast('每个阶段至少保留一个任务');
        }
    }
    
    /**
     * 删除阶段
     * @param {HTMLElement} btn - 按钮元素
     */
    function deleteStage(btn) {
        const stageItem = btn.closest('.stage-edit-item');
        if (!stageItem) return;
        
        const container = document.getElementById('stageEditContainer');
        
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
        
        if (container && container.querySelectorAll('.stage-edit-item').length > 1) {
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
        const stageItem = element.closest('.stage-edit-item');
        if (!stageItem) return;
        
        const switchEl = element.querySelector('.switch');
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
        const stageItem = btn.closest('.stage-edit-item');
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
    
    /**
     * 显示PC端打开弹窗
     */
    function showPcOpenModal() {
        const modal = document.getElementById('pcOpenModal');
        if (modal) modal.classList.add('show');
    }
    
    /**
     * 关闭PC端打开弹窗
     */
    function closePcOpenModal() {
        const modal = document.getElementById('pcOpenModal');
        if (modal) modal.classList.remove('show');
    }
    
    /**
     * 复制PC端链接
     */
    function copyPcLink() {
        const pcLink = document.getElementById('pcLink');
        if (!pcLink) return;
        
        const link = pcLink.textContent;
        navigator.clipboard.writeText(link).then(() => {
            showCustomToast('链接已复制到剪贴板');
            closePcOpenModal();
        }).catch(() => {
            showCustomToast('复制失败，请手动复制');
        });
    }
    
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
    }
    
    // ==================== 初始化 ====================
    
    /**
     * 初始化模块
     */
    function init() {
        bindGlobalEvents();
        initFromUrl();
    }
    
    // DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
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
        
        // 交互函数
        switchSection,
        toggleStage,
        showFullText,
        closeFullText,
        toggleQRCode,
        copyEditLink,
        toggleActionMenu,
        closeActionMenu,
        
        // 弹窗函数
        showStatusModal,
        closeModal,
        confirmAction,
        updateRejectReasonCount,
        getRejectReason,
        
        // 版本记录
        showVersionModal,
        closeVersionModal,
        
        // 导出
        exportContract,
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
        selectChangeType,
        showChangeModal,
        closeChangeModal,
        showMoreOptions,
        showPCEditGuide,
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
        addEditTaskConfirmer,
        removeEditTaskConfirmer,
        confirmEditTask,
        deleteTask,
        deleteStage,
        toggleStageSequential,
        editStageSettings,
        addNewStage,
        
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
        
        // PC端打开
        showPcOpenModal,
        closePcOpenModal,
        copyPcLink
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
window.switchSection = ContractDetailPage.switchSection;
window.toggleStage = ContractDetailPage.toggleStage;
window.showFullText = ContractDetailPage.showFullText;
window.closeFullText = ContractDetailPage.closeFullText;
window.toggleQRCode = ContractDetailPage.toggleQRCode;
window.copyEditLink = ContractDetailPage.copyEditLink;
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
window.showExportModal = ContractDetailPage.showExportModal;
window.closeExportModal = ContractDetailPage.closeExportModal;
window.exportToPDF = ContractDetailPage.exportToPDF;
window.shareToWechat = ContractDetailPage.shareToWechat;
window.shareToFriend = ContractDetailPage.shareToFriend;
window.showChangeRecordModal = ContractDetailPage.showChangeRecordModal;
window.closeChangeRecordModal = ContractDetailPage.closeChangeRecordModal;
window.viewChangeVersion = ContractDetailPage.viewChangeVersion;
window.checkChangeReason = ContractDetailPage.checkChangeReason;
window.selectChangeType = ContractDetailPage.selectChangeType;
window.showChangeModal = ContractDetailPage.showChangeModal;
window.closeChangeModal = ContractDetailPage.closeChangeModal;
window.showMoreOptions = ContractDetailPage.showMoreOptions;
window.showPCEditGuide = ContractDetailPage.showPCEditGuide;
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
window.addEditTaskConfirmer = ContractDetailPage.addEditTaskConfirmer;
window.removeEditTaskConfirmer = ContractDetailPage.removeEditTaskConfirmer;
window.confirmEditTask = ContractDetailPage.confirmEditTask;
window.deleteTask = ContractDetailPage.deleteTask;
window.deleteStage = ContractDetailPage.deleteStage;
window.toggleStageSequential = ContractDetailPage.toggleStageSequential;
window.editStageSettings = ContractDetailPage.editStageSettings;
window.addNewStage = ContractDetailPage.addNewStage;
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
window.showPcOpenModal = ContractDetailPage.showPcOpenModal;
window.closePcOpenModal = ContractDetailPage.closePcOpenModal;
window.copyPcLink = ContractDetailPage.copyPcLink;

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
