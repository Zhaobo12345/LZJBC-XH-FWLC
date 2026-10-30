let currentStatus = 'draft';
        let pendingAction = null;

        // PC端 = 运营人员，默认全部权限
        var DETAIL_USER_PERMISSION = 'all';
        var DETAIL_USER_ID = 'platform-operator';
        var CONTRACT_AMOUNT = '¥150,000.00';
        var CONTRACT_AMOUNT_OLD = '¥150,000.00';
        var CONTRACT_AMOUNT_NEW = '¥180,000.00';

        function getMaskedAmount(amount) {
            if (!window.ContractAmountMask) return amount;
            // 构建简化合同对象用于权限判断
            var contract = { creator: '陈庄', partyA: '陈庄', partyB: '王强' };
            return window.ContractAmountMask.format(amount, contract, DETAIL_USER_PERMISSION, DETAIL_USER_ID);
        }

        function renderMaskedAmounts() {
            var el = document.getElementById('infoBarAmount');
            if (el) el.textContent = getMaskedAmount(CONTRACT_AMOUNT);
        }

        const statusConfig = {
            platform_reviewing: {
                title: '⏳ 待平台审核',
                desc: '已提交确认申请，平台运营人员正在审核中',
                class: 'platform-reviewing'
            },
            change_reviewing: {
                title: '⏳ 变更待平台审核',
                desc: '变更申请已提交，平台运营人员正在审核中',
                class: 'changing'
            },
            reviewed_pass: {
                title: '✅ 审核已通过',
                desc: '合同审核已通过，等待双方确认签约',
                class: 'confirmed'
            },
            reviewed_reject: {
                title: '❌ 审核已驳回',
                desc: '合同审核未通过，已将驳回结果及原因通知给提交人',
                class: 'platform-rejected',
                showRejectReason: true
            },
            change_reviewed_pass: {
                title: '✅ 变更已通过',
                desc: '变更申请已通过审核',
                class: 'signed'
            },
            change_reviewed_reject: {
                title: '❌ 变更已驳回',
                desc: '变更申请未通过审核，驳回结果及原因已通知提交人',
                class: 'platform-rejected',
                showRejectReason: true
            },
            signed: {
                title: '✅ 合同已签约',
                desc: '签约时间：2024-01-15 10:30',
                class: 'signed'
            },
            confirmed: {
                title: '✅ 双方已确认',
                desc: '双方已确认，请上传签约后的合同附件',
                class: 'confirmed'
            },
            signing: {
                title: '📝 待确认签约',
                desc: '对方已上传签约文件，请确认后合同正式生效',
                class: 'signing'
            },
            withdrawn: {
                title: '↩ 已撤回',
                desc: '该合同/变更已被发起方撤回，平台不再审核',
                class: 'withdrawn'
            }
        };

        function switchStatus(status) {
            currentStatus = status;
            updateUI();
        }

        function updateUI() {
            const config = statusConfig[currentStatus];
            
            const title = config.title;
            const desc = config.desc;
            
            document.getElementById('statusTitle').textContent = title;
            document.getElementById('statusDesc').textContent = desc;
            document.getElementById('statusBanner').className = 'status-banner ' + config.class;
            
            updateReviewPanel();
            updateStatusActions();
            updateChangesContent();
            updateRejectReasonBanner();
            updateOperationLog();
            updateStagesContent();
            updateStageStatusForReview();
            renderMaskedAmounts();
        }

        function handlePageChange(value) {
            switch(value) {
                case 'contract_template':
                    window.location.href = 'pc-contract-template.html';
                    break;
                case 'stage_template':
                    window.location.href = 'pc-stage-template.html';
                    break;
                case 'contract_list':
                    window.location.href = 'pc-contract-list.html';
                    break;
                case 'contract_detail':
                    break;
                case 'mini_program':
                    showToast('正在打开小程序首页...');
                    break;
            }
        }

        function updateRejectReasonBanner() {
            const banner = document.getElementById('rejectReasonBanner');
            const rejectedStatuses = ['reviewed_reject', 'change_reviewed_reject'];
            
            if (rejectedStatuses.includes(currentStatus)) {
                banner.classList.add('show');
            } else {
                banner.classList.remove('show');
            }
        }

        function updateStagesContent() {
            const changeSummaryCard = document.getElementById('changeSummaryCard');
            const stage2Section = document.getElementById('stage2Section');
            const stage2ChangeBadge = document.getElementById('stage2ChangeBadge');
            const taskWaterPipe = document.getElementById('taskWaterPipe');
            const taskWaterPipeBadge = document.getElementById('taskWaterPipeBadge');
            const stage3NewSection = document.getElementById('stage3NewSection');
            const stage3OriginalSection = document.getElementById('stage3OriginalSection');
            
            if (currentStatus === 'change_reviewing' || currentStatus === 'change_reviewed_pass') {
                if (changeSummaryCard) changeSummaryCard.style.display = 'block';
                if (stage2ChangeBadge) stage2ChangeBadge.style.display = 'inline';
                if (taskWaterPipeBadge) taskWaterPipeBadge.style.display = 'inline';
                if (stage3NewSection) stage3NewSection.style.display = 'block';
                if (stage3OriginalSection) stage3OriginalSection.style.display = 'none';
                
                if (stage2Section) {
                    stage2Section.classList.add('stage-modified');
                }
                if (taskWaterPipe) {
                    taskWaterPipe.classList.add('task-modified');
                }
            } else {
                if (changeSummaryCard) changeSummaryCard.style.display = 'none';
                if (stage2ChangeBadge) stage2ChangeBadge.style.display = 'none';
                if (taskWaterPipeBadge) taskWaterPipeBadge.style.display = 'none';
                if (stage3NewSection) stage3NewSection.style.display = 'none';
                if (stage3OriginalSection) stage3OriginalSection.style.display = 'block';
                
                if (stage2Section) {
                    stage2Section.classList.remove('stage-modified');
                }
                if (taskWaterPipe) {
                    taskWaterPipe.classList.remove('task-modified');
                }
            }
        }

        function updateStageStatusForReview() {
            // platform_reviewing / reviewed_pass: 阶段任务为"未生效"，隐藏变更记录 Tab
            var changesTab = document.querySelector('.detail-tab[onclick*="changes"]');
            var isReview = (currentStatus === 'platform_reviewing' || currentStatus === 'reviewed_pass' || currentStatus === 'reviewed_reject');
            
            if (changesTab) changesTab.style.display = isReview ? 'none' : '';
            // Only hide content when tab itself is hidden (non-change states already hidden by CSS tab default)
            
            var stageStatuses = document.querySelectorAll('#stagesContent .stage-status');
            var taskRows = document.querySelectorAll('#stagesContent .task-row');
            
            if (isReview) {
                stageStatuses.forEach(function(el) {
                    el.className = 'stage-status pending';
                    el.textContent = '⏸ 未生效';
                });
                taskRows.forEach(function(el) {
                    el.className = el.className.replace(/\bcompleted\b|\bin-progress\b/g, '');
                    if (!el.classList.contains('pending')) el.classList.add('pending');
                    var icon = el.querySelector('.task-status-icon');
                    var time = el.querySelector('.task-time');
                    if (icon) icon.textContent = '⏸';
                    if (time) time.textContent = '未开始';
                });
            } else {
                // 非待审核：恢复原始状态
                stageStatuses.forEach(function(el, i) {
                    // Stage 0: completed, Stage 1: in-progress, Stage 2: pending
                    if (i === 0) { el.className = 'stage-status completed'; el.textContent = '✅ 已完成'; }
                    else if (i === 1) { el.className = 'stage-status in-progress'; el.textContent = '⏳ 进行中'; }
                    else { el.className = 'stage-status pending'; el.textContent = '⏸ 待开始'; }
                });
                taskRows.forEach(function(el, i) {
                    el.className = el.className.replace(/\bpending\b/g, '');
                    var icon = el.querySelector('.task-status-icon');
                    var time = el.querySelector('.task-time');
                    if (i < 4) { el.classList.add('completed'); if (icon) icon.textContent = '✓'; if (time) time.textContent = time.textContent === '未开始' ? '2024-01-20 完成' : time.textContent; }
                    else if (i < 6) { el.classList.add('in-progress'); if (icon) icon.textContent = '▶'; if (time) time.textContent = '2024-02-05 截止'; }
                    else { el.classList.add('pending'); if (icon) icon.textContent = '⏸'; if (time) time.textContent = '待开始'; }
                });
            }
        }

        function updateOperationLog() {
            const logContainer = document.getElementById('operationLog');
            let logs = [];
            
            logs.push({ time: '01-10 15:00', content: '创建合同', user: '陈庄' });
            logs.push({ time: '01-10 15:30', content: '提交合同审核', user: '陈庄' });
            
            if (currentStatus === 'platform_reviewing') {
                logs.push({ time: '01-10 15:30', content: '进入平台审核', user: '系统' });
            }
            
            if (currentStatus === 'reviewed_pass') {
                logs.push({ time: '01-10 16:30', content: '合同审核通过', user: '运营人员' });
            }
            
            if (currentStatus === 'reviewed_reject') {
                logs.push({ time: '01-10 16:30', content: '合同审核驳回', user: '运营人员', detail: document.getElementById('rejectReasonContent').textContent || '合同金额与实际工程量不符，请核实后重新提交' });
            }
            
            if (currentStatus === 'change_reviewing') {
                logs.push({ time: '01-10 16:30', content: '合同审核通过', user: '运营人员' });
                logs.push({ time: '02-01 14:00', content: '发起变更申请', user: '陈庄' });
                logs.push({ time: '02-01 14:00', content: '进入平台审核', user: '系统' });
            }
            
            if (currentStatus === 'change_reviewed_pass') {
                logs.push({ time: '01-10 16:30', content: '合同审核通过', user: '运营人员' });
                logs.push({ time: '02-01 14:00', content: '发起变更申请', user: '陈庄' });
                logs.push({ time: '02-01 14:00', content: '进入平台审核', user: '系统' });
                logs.push({ time: '02-01 15:00', content: '变更审核通过', user: '运营人员' });
                logs.push({ time: '02-01 15:00', content: '变更已生效', user: '系统' });
            }
            
            if (currentStatus === 'change_reviewed_reject') {
                logs.push({ time: '01-10 16:30', content: '合同审核通过', user: '运营人员' });
                logs.push({ time: '02-01 14:00', content: '发起变更申请', user: '陈庄' });
                logs.push({ time: '02-01 14:00', content: '进入平台审核', user: '系统' });
                logs.push({ time: '02-01 15:00', content: '变更审核驳回', user: '运营人员', detail: document.getElementById('rejectReasonContent').textContent || '变更内容描述不清晰，缺少具体施工范围说明' });
            }
            
            if (currentStatus === 'confirmed' || currentStatus === 'signing' || currentStatus === 'signed') {
                logs.push({ time: '01-10 16:30', content: '平台审核通过', user: '运营人员' });
                logs.push({ time: '01-11 10:00', content: '发送确认申请', user: '陈庄' });
                logs.push({ time: '01-11 14:00', content: '确认合同', user: '王强' });
                logs.push({ time: '01-11 14:30', content: '双方确认完成', user: '系统' });
            }
            
            if (currentStatus === 'signing' || currentStatus === 'signed') {
                logs.push({ time: '01-12 09:00', content: '上传签约文件', user: '陈庄' });
            }
            
            if (currentStatus === 'signed') {
                logs.push({ time: '01-15 10:30', content: '确认签约', user: '王强' });
                logs.push({ time: '01-15 10:30', content: '合同签约完成', user: '系统' });
            }
            
            if (currentStatus === 'withdrawn') {
                if (withdrawType === 'change') {
                    logs.push({ time: '01-10 16:30', content: '合同审核通过', user: '运营人员' });
                    logs.push({ time: '02-01 14:00', content: '发起变更申请', user: '陈庄' });
                    logs.push({ time: '02-01 14:30', content: '撤回变更申请', user: '陈庄', detail: '发起方在平台审核前主动撤回本次变更申请，变更流程已终止' });
                    logs.push({ time: '02-01 14:30', content: '变更审核终止（已撤回）', user: '系统' });
                } else {
                    logs.push({ time: '01-10 15:30', content: '进入平台审核', user: '系统' });
                    logs.push({ time: '01-10 16:00', content: '撤回合同', user: '陈庄', detail: '发起方在平台审核完成前主动撤回本合同，平台不再审核' });
                    logs.push({ time: '01-10 16:00', content: '合同审核终止（已撤回）', user: '系统' });
                }
            }
            
            let html = '';
            logs.reverse().forEach(log => {
                html += `
                    <div class="log-item">
                        <span class="log-time">${log.time}</span>
                        <span class="log-content">${log.content}${log.detail ? '<br><span style="color: var(--text-tertiary); font-size: 12px;">' + log.detail + '</span>' : ''}</span>
                        <span class="log-user">${log.user}</span>
                    </div>
                `;
            });
            
            logContainer.innerHTML = html;
        }

        function updateReviewPanel() {
            const rejectInput = document.getElementById('rejectReasonInput');
            const statusBanner = document.getElementById('statusBanner');
            const statusReviewActions = document.getElementById('statusReviewActions');
            const changeReasonBanner = document.getElementById('changeReasonBanner');
            const contractPriceChange = document.getElementById('contractPriceChange');
            const contractAdditionChange = document.getElementById('contractAdditionChange');
            
            if (currentStatus === 'platform_reviewing' || currentStatus === 'change_reviewing') {
                statusBanner.style.display = 'flex';
                if (statusReviewActions) statusReviewActions.style.display = 'flex';
                
                if (currentStatus === 'change_reviewing') {
                    changeReasonBanner.style.display = 'block';
                    if (contractPriceChange) contractPriceChange.style.display = 'block';
                    if (contractAdditionChange) contractAdditionChange.style.display = 'block';
                } else {
                    changeReasonBanner.style.display = 'none';
                    if (contractPriceChange) contractPriceChange.style.display = 'none';
                    if (contractAdditionChange) contractAdditionChange.style.display = 'none';
                }
            } else if (currentStatus === 'change_reviewed_pass' || currentStatus === 'change_reviewed_reject') {
                statusBanner.style.display = 'flex';
                if (statusReviewActions) statusReviewActions.style.display = 'none';
                changeReasonBanner.style.display = 'block';
                if (contractPriceChange) contractPriceChange.style.display = 'block';
                if (contractAdditionChange) contractAdditionChange.style.display = 'block';
            } else {
                statusBanner.style.display = 'flex';
                if (statusReviewActions) statusReviewActions.style.display = 'none';
                changeReasonBanner.style.display = 'none';
                if (contractPriceChange) contractPriceChange.style.display = 'none';
                if (contractAdditionChange) contractAdditionChange.style.display = 'none';
            }
        }

        function showTaskDetail(rowEl, name, executor, confirmers, executeStandard, confirmStandard, responsibleStandard) {
            // 兼容旧调用：首个参数不是行元素时，整体左移一位
            if (typeof rowEl === 'string') {
                responsibleStandard = confirmStandard;
                confirmStandard = executeStandard;
                executeStandard = confirmers;
                confirmers = executor;
                executor = name;
                name = rowEl;
                rowEl = null;
            }
            document.getElementById('taskDetailTitle').textContent = name;
            document.getElementById('taskDetailExecutor').textContent = executor;
            
            const confirmerList = String(confirmers || '').split('、').map(c => {
                return `<span class="task-detail-person">
                    <span>👤</span>
                    <span>${c}</span>
                </span>`;
            }).join('');
            document.getElementById('taskDetailConfirmers').innerHTML = confirmerList;
            
            document.getElementById('taskDetailExecuteStandard').textContent = executeStandard;
            document.getElementById('taskDetailConfirmStandard').textContent = confirmStandard;
            document.getElementById('taskDetailResponsibleStandard').textContent = responsibleStandard;
            
            // 工艺参考示例（跟随行数据；无图时整块自动隐藏）
            if (window.PCCraftRef) {
                var execRefs = rowEl ? rowEl.getAttribute('data-exec-refs') : '';
                var confirmRefs = rowEl ? rowEl.getAttribute('data-confirm-refs') : '';
                PCCraftRef.renderDisplay('taskDetailExecCraftRef', execRefs);
                PCCraftRef.renderDisplay('taskDetailConfirmCraftRef', confirmRefs);
            }
            
            document.getElementById('taskDetailModal').classList.add('show');
        }

        function closeTaskDetail() {
            document.getElementById('taskDetailModal').classList.remove('show');
        }

        function updateStatusActions() {
            const actionsContainer = document.getElementById('statusActions');
            let actionsHtml = '';
            
            switch (currentStatus) {
                case 'platform_reviewing':
                case 'change_reviewing':
                    actionsHtml = '';
                    break;
                case 'reviewed_pass':
                    actionsHtml = '';
                    break;
                case 'reviewed_reject':
                    actionsHtml = '';
                    break;
                case 'signed':
                    actionsHtml = '';
                    break;
            }
            
            actionsContainer.innerHTML = actionsHtml;
        }

        function updateChangesContent() {
            const changeRecord1 = document.getElementById('changeRecord1');
            const changeRecord2 = document.getElementById('changeRecord2');
            const changeRecord3 = document.getElementById('changeRecord3');
            const noChangeRecord = document.getElementById('noChangeRecord');
            
            if (currentStatus === 'change_reviewing') {
                if (changeRecord1) changeRecord1.style.display = 'block';
                if (changeRecord2) changeRecord2.style.display = 'block';
                if (changeRecord3) changeRecord3.style.display = 'none';
                if (noChangeRecord) noChangeRecord.style.display = 'none';
            } else if (currentStatus === 'change_reviewed_pass') {
                if (changeRecord1) changeRecord1.style.display = 'block';
                if (changeRecord2) changeRecord2.style.display = 'block';
                if (changeRecord3) changeRecord3.style.display = 'none';
                if (noChangeRecord) noChangeRecord.style.display = 'none';
                if (changeRecord1) {
                    changeRecord1.querySelector('.change-record-status').textContent = '已生效';
                    changeRecord1.querySelector('.change-record-status').className = 'change-record-status completed';
                }
                if (changeRecord2) {
                    changeRecord2.querySelector('.change-record-status').textContent = '已生效';
                    changeRecord2.querySelector('.change-record-status').className = 'change-record-status completed';
                }
            } else if (currentStatus === 'change_reviewed_reject') {
                if (changeRecord1) changeRecord1.style.display = 'block';
                if (changeRecord2) changeRecord2.style.display = 'block';
                if (changeRecord3) changeRecord3.style.display = 'none';
                if (noChangeRecord) noChangeRecord.style.display = 'none';
                if (changeRecord1) {
                    changeRecord1.querySelector('.change-record-status').textContent = '已驳回';
                    changeRecord1.querySelector('.change-record-status').className = 'change-record-status rejected';
                }
                if (changeRecord2) {
                    changeRecord2.querySelector('.change-record-status').textContent = '已驳回';
                    changeRecord2.querySelector('.change-record-status').className = 'change-record-status rejected';
                }
            } else if (currentStatus === 'signed') {
                if (changeRecord1) changeRecord1.style.display = 'none';
                if (changeRecord2) changeRecord2.style.display = 'block';
                if (changeRecord3) changeRecord3.style.display = 'block';
                if (noChangeRecord) noChangeRecord.style.display = 'none';
            } else if (currentStatus === 'withdrawn') {
                if (withdrawType === 'change') {
                    if (changeRecord1) {
                        changeRecord1.style.display = 'block';
                        changeRecord1.querySelector('.change-record-status').textContent = '已撤回';
                        changeRecord1.querySelector('.change-record-status').className = 'change-record-status withdrawn';
                        const statusRow = Array.from(changeRecord1.querySelectorAll('.change-record-row')).find(function(r) {
                            return r.querySelector('.change-record-label') && r.querySelector('.change-record-label').textContent === '变更状态';
                        });
                        if (statusRow) statusRow.querySelector('.change-record-value').innerHTML = '<span style="color:#8C8C8C;">已撤回</span>';
                    }
                    if (changeRecord2) changeRecord2.style.display = 'none';
                    if (changeRecord3) changeRecord3.style.display = 'none';
                    if (noChangeRecord) noChangeRecord.style.display = 'none';
                } else {
                    if (changeRecord1) changeRecord1.style.display = 'none';
                    if (changeRecord2) changeRecord2.style.display = 'none';
                    if (changeRecord3) changeRecord3.style.display = 'none';
                    if (noChangeRecord) {
                        noChangeRecord.style.display = 'block';
                        noChangeRecord.innerHTML = '<p style="color: var(--text-tertiary); text-align: center; padding: 40px;">合同已被发起方撤回，暂无变更记录</p>';
                    }
                }
            } else {
                if (changeRecord1) changeRecord1.style.display = 'none';
                if (changeRecord2) changeRecord2.style.display = 'none';
                if (changeRecord3) changeRecord3.style.display = 'none';
                if (noChangeRecord) noChangeRecord.style.display = 'block';
            }
        }

        function showRejectInput() {
            document.getElementById('rejectReasonModal').value = '';
            document.getElementById('rejectReasonError').style.display = 'none';
            document.getElementById('rejectModal').classList.add('show');
        }

        function closeRejectModal() {
            document.getElementById('rejectModal').classList.remove('show');
        }

        function confirmRejectFromModal() {
            const reason = document.getElementById('rejectReasonModal').value.trim();
            if (!reason) {
                document.getElementById('rejectReasonError').style.display = 'block';
                return;
            }
            closeRejectModal();
            
            const title = currentStatus === 'change_reviewing' ? '确认驳回变更' : '确认驳回';
            const message = currentStatus === 'change_reviewing' 
                ? '确定驳回该变更申请吗？驳回后变更将被取消。' 
                : '确定驳回该合同吗？驳回后合同将退回修改状态。';
            
            showConfirmModal(title, message, function() {
                showToast(currentStatus === 'change_reviewing' ? '变更已驳回' : '已驳回，合同退回修改状态');
                const nextStatus = currentStatus === 'change_reviewing' ? 'change_reviewed_reject' : 'reviewed_reject';
                document.getElementById('rejectReasonContent').textContent = reason;
                switchStatus(nextStatus);
            });
        }

        // Keep legacy rejectContract for backward compat (inline flow)
        function rejectContract() {
            confirmRejectFromModal();
        }

        function approveContract() {
            const title = currentStatus === 'change_reviewing' ? '确认审核通过变更' : '确认审核通过';
            const message = currentStatus === 'change_reviewing' 
                ? '确定审核通过该变更申请吗？通过后变更将生效。' 
                : '确定审核通过该合同吗？通过后合同将进入待确认状态。';
            
            showConfirmModal(title, message, () => {
                showToast(currentStatus === 'change_reviewing' ? '变更审核通过' : '审核通过，合同已进入待确认状态');
                const nextStatus = currentStatus === 'change_reviewing' ? 'change_reviewed_pass' : 'reviewed_pass';
                switchStatus(nextStatus);
            });
        }

        function rejectContract() {
            const reasonInput = document.getElementById('rejectReason');
            const reason = reasonInput.value.trim();
            
            // 校验驳回原因（使用validation.js）
            const result = Validation.validate.textLength(reason, 500, true, '驳回原因');
            if (!result.valid) {
                showToast(result.message);
                reasonInput.focus();
                return;
            }
            
            const title = currentStatus === 'change_reviewing' ? '确认驳回变更' : '确认驳回';
            const message = currentStatus === 'change_reviewing' 
                ? '确定驳回该变更申请吗？驳回后变更将被取消。' 
                : '确定驳回该合同吗？驳回后合同将退回修改状态。';
            
            showConfirmModal(title, message, () => {
                showToast(currentStatus === 'change_reviewing' ? '变更已驳回' : '已驳回，合同退回修改状态');
                const nextStatus = currentStatus === 'change_reviewing' ? 'change_reviewed_reject' : 'reviewed_reject';
                switchStatus(nextStatus);
                
                document.getElementById('rejectReasonContent').textContent = reason;
                document.getElementById('rejectReasonInput').style.display = 'none';
                document.getElementById('showRejectBtn').textContent = '驳回';
                document.getElementById('confirmRejectBtn').style.display = 'none';
                document.getElementById('rejectReason').value = '';
            });
        }

        function showConfirmModal(title, content, callback) {
            document.getElementById('confirmModalTitle').textContent = title;
            document.getElementById('confirmModalContent').textContent = content;
            pendingAction = callback;
            document.getElementById('confirmModal').classList.add('show');
        }

        function closeConfirmModal() {
            document.getElementById('confirmModal').classList.remove('show');
            pendingAction = null;
        }

        function confirmAction() {
            if (pendingAction) {
                pendingAction();
            }
            closeConfirmModal();
        }

        function previewAttachment(type, name, size, desc) {
            var modal = document.getElementById('attachmentPreviewModal');
            var title = document.getElementById('attachmentPreviewTitle');
            var body = document.getElementById('attachmentPreviewBody');
            if (!modal || !title || !body) return;
            
            title.innerHTML = '<span style="font-size:20px;">' + getFileIcon(type) + '</span> ' + name;
            
            var html = '';
            html += '<div style="padding:16px;background:#f5f5f5;border-bottom:1px solid #e8e8e8;font-size:13px;color:#8c8c8c;">';
            html += '<span>' + desc + '</span> &nbsp;|&nbsp; <span>' + size + '</span>';
            html += '</div>';
            
            if (type === 'pdf') {
                html += '<div style="padding:24px;font-family:serif;line-height:1.8;font-size:13px;color:#262626;">';
                html += '<h3 style="text-align:center;margin:0 0 16px;">基础施工服务合同</h3>';
                html += '<p style="color:#595959;">甲方：陈庄（工长）</p>';
                html += '<p style="color:#595959;">乙方：王强（施工方）</p>';
                html += '<p style="text-indent:2em;">根据《中华人民共和国民法典》及相关法律法规的规定，甲乙双方本着平等、自愿、公平、诚实信用的原则，就基础施工事宜协商一致，订立本合同。</p>';
                html += '<h4>第一条 工程概况</h4>';
                html += '<p>1.1 工程名称：西安阳光里小区基础施工<br>1.2 工程地点：西安市雁塔区长安南路188号<br>1.3 承包范围：墙体拆改、墙面基础、防水等基础施工</p>';
                html += '<h4>第二条 合同价款</h4>';
                html += '<p>2.1 本合同总价款为人民币壹拾伍万元整（¥150,000.00）<br>2.2 合同价款为固定总价，不因市场价格波动而调整</p>';
                html += '<h4>第三条 工期</h4>';
                html += '<p>3.1 工期总日历天数：45天<br>3.2 开工日期：以甲方书面通知为准<br>3.3 竣工日期：开工日期后45日内</p>';
                html += '<h4>第四条 质量标准</h4>';
                html += '<p>4.1 工程质量应符合国家标准及合同约定<br>4.2 乙方应提供材料质量证明文件</p>';
                html += '</div>';
            } else if (type === 'image') {
                html += '<div style="padding:24px;background:#fafafa;">';
                html += '<div style="background:#fff;border:1px solid #e8e8e8;padding:16px;margin-bottom:12px;border-radius:4px;">';
                html += '<p style="margin:0 0 8px;font-size:13px;color:#262626;font-weight:600;">【图示1】户型平面图</p>';
                html += '<div style="height:200px;background:linear-gradient(135deg,#e6f7ff 0%,#bae7ff 100%);display:flex;align-items:center;justify-content:center;color:#1890ff;font-size:14px;border-radius:4px;">';
                html += '🗺 户型平面示意图<br><span style="font-size:11px;color:#8c8c8c;">（原型演示）</span>';
                html += '</div></div>';
                html += '<div style="background:#fff;border:1px solid #e8e8e8;padding:16px;border-radius:4px;">';
                html += '<p style="margin:0 0 8px;font-size:13px;color:#262626;font-weight:600;">【图示2】现场照片</p>';
                html += '<div style="height:180px;background:linear-gradient(135deg,#fff7e6 0%,#ffd591 100%);display:flex;align-items:center;justify-content:center;color:#fa8c16;font-size:14px;border-radius:4px;">';
                html += '📷 现场施工照片<br><span style="font-size:11px;color:#8c8c8c;">（原型演示）</span>';
                html += '</div></div></div>';
            } else if (type === 'table') {
                html += '<table style="width:100%;border-collapse:collapse;font-size:13px;">';
                html += '<thead><tr style="background:#fafafa;"><th style="padding:10px;text-align:left;border-bottom:1px solid #e8e8e8;">序号</th><th style="padding:10px;text-align:left;border-bottom:1px solid #e8e8e8;">材料名称</th><th style="padding:10px;text-align:left;border-bottom:1px solid #e8e8e8;">规格</th><th style="padding:10px;text-align:left;border-bottom:1px solid #e8e8e8;">单位</th><th style="padding:10px;text-align:left;border-bottom:1px solid #e8e8e8;">数量</th></tr></thead>';
                html += '<tbody>';
                var rows = [
                    ['1','水泥','P.O 42.5','袋','120'],
                    ['2','砂子','中粗砂','立方米','45'],
                    ['3','砖块','红砖 240×115×53','块','8500'],
                    ['4','防水卷材','SBS 3mm','卷','32'],
                    ['5','界面剂','环保型','桶','24'],
                    ['6','网格布','耐碱玻璃纤维','卷','18']
                ];
                rows.forEach(function(r) {
                    html += '<tr><td style="padding:10px;border-bottom:1px solid #f0f0f0;">' + r[0] + '</td><td style="padding:10px;border-bottom:1px solid #f0f0f0;">' + r[1] + '</td><td style="padding:10px;border-bottom:1px solid #f0f0f0;">' + r[2] + '</td><td style="padding:10px;border-bottom:1px solid #f0f0f0;">' + r[3] + '</td><td style="padding:10px;border-bottom:1px solid #f0f0f0;">' + r[4] + '</td></tr>';
                });
                html += '</tbody></table>';
            }
            
            body.innerHTML = html;
            modal.classList.add('show');
        }

        function closeAttachmentPreview() {
            var modal = document.getElementById('attachmentPreviewModal');
            if (modal) modal.classList.remove('show');
        }

        function getFileIcon(type) {
            if (type === 'pdf') return '📄';
            if (type === 'image') return '🖼';
            return '📊';
        }

        function showToast(message) {
            const toast = document.createElement('div');
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                top: 80px;
                left: 50%;
                transform: translateX(-50%);
                background-color: rgba(0, 0, 0, 0.75);
                color: #fff;
                padding: 10px 20px;
                border-radius: 4px;
                font-size: 14px;
                z-index: 10000;
            `;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
        }

        function toggleUserDropdown() {
            document.getElementById('userDropdownMenu').classList.toggle('show');
        }

        function logout() {
            if (confirm('确定要退出登录吗？')) {
                window.location.href = 'pc-contract-list.html';
            }
        }

        document.addEventListener('click', function(e) {
            const dropdown = document.querySelector('.pc-user-dropdown');
            const menu = document.getElementById('userDropdownMenu');
            if (dropdown && menu && !dropdown.contains(e.target)) {
                menu.classList.remove('show');
            }
            
            const taskDetailModal = document.getElementById('taskDetailModal');
            if (taskDetailModal && e.target === taskDetailModal) {
                closeTaskDetail();
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeTaskDetail();
            }
        });

        function switchTab(tabName, evt) {
            document.querySelectorAll('.detail-tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            evt.target.classList.add('active');
            document.getElementById(tabName + 'Tab').classList.add('active');
        }

        function togglePageNav() {
            const wrapper = document.getElementById('pageNavWrapper');
            const nav = document.getElementById('pageNav');
            const toggle = wrapper.querySelector('.pc-page-nav-toggle');
            nav.classList.toggle('collapsed');
            wrapper.classList.toggle('collapsed');
            if (nav.classList.contains('collapsed')) {
                toggle.textContent = '▶';
            } else {
                toggle.textContent = '◀';
            }
        }

        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('status');
        const rejectReason = urlParams.get('rejectReason');
        const withdrawType = urlParams.get('wtype'); // 'contract' | 'change' | null，用于区分撤回类型
        
        if (status && statusConfig[status]) {
            currentStatus = status;
        }
        
        if (rejectReason) {
            document.getElementById('rejectReasonContent').textContent = decodeURIComponent(rejectReason);
        }

        updateUI();