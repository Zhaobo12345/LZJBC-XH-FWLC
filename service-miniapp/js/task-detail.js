const TaskDetailPage = (function() {
    'use strict';
    
    const TaskStatus = {
        CONFIGURING: 'configuring',
        PENDING: 'pending',
        IN_PROGRESS: 'in_progress',
        CONFIRMING: 'confirming',
        COMPLETED: 'completed',
        CONFIRMING_AFTER_REJECT: 'confirming_after_reject',
        REJECTED_PENDING: 'rejected_pending',
        COMPLETED_WITH_REJECT: 'completed_with_reject',
        PENDING_BLOCKED: 'pending_blocked'
    };

    const UserRoles = {
        EXECUTOR: 'executor',
        CONFIRMER: 'confirmer',
        CONFIGURER: 'configurer',
        OTHER: 'other'
    };

    const StatusTextMap = {
        [TaskStatus.CONFIGURING]: '待配置',
        [TaskStatus.PENDING]: '待开始',
        [TaskStatus.IN_PROGRESS]: '执行中',
        [TaskStatus.CONFIRMING]: '确认中',
        [TaskStatus.COMPLETED]: '已完成',
        [TaskStatus.CONFIRMING_AFTER_REJECT]: '确认中（被驳回后）',
        [TaskStatus.REJECTED_PENDING]: '驳回后待开始',
        [TaskStatus.COMPLETED_WITH_REJECT]: '已完成（含驳回）',
        [TaskStatus.PENDING_BLOCKED]: '待开始（前置阻塞）'
    };

    // 配置人视角可见性控制：业主端不支持配置任务（任何状态均无配置人视角）；
    // 服务端仅在 待配置(配置中切换条)/待开始/执行中/前置阻塞 状态保留配置人视角，
    // 确认中/确认中(被驳回后)/驳回后待开始/已完成/已完成(含驳回) 状态不支持配置任务。
    const OWNER_SIDE = false; // 业主端此处置 true；服务端正 prototype
    function getConfigurerViewVisible(status) {
        if (OWNER_SIDE) return { roleSwitcher: false, configuring: false };
        if (status === TaskStatus.CONFIGURING) return { roleSwitcher: false, configuring: true };
        const roleSwitcherStates = [TaskStatus.PENDING, TaskStatus.PENDING_BLOCKED, TaskStatus.IN_PROGRESS];
        if (roleSwitcherStates.indexOf(status) !== -1) return { roleSwitcher: true, configuring: false };
        return { roleSwitcher: false, configuring: false };
    }

    const appState = {
        rating: 0,
        taskStatus: TaskStatus.CONFIGURING,
        userRole: UserRoles.CONFIGURER,
        uploadedFiles: [],
        uploadContext: 'execution',
        selectedConfirmerIds: [],
        confirmers: [],
        taskSubmitted: false,
        executionRecords: [],
        editRecordIndex: -1,
        hasExecutor: false,
        executorId: null,
        executorName: ''
    };

    let currentRating = 0;
    let dimensionRatings = {
        quality: 0,
        efficiency: 0,
        attitude: 0
    };
    let overallRating = 0;
    let selectedTags = [];
    let evaluationOverallRating = 0;
    let selectedEvaluationTags = [];
    let currentTaskStatus = TaskStatus.CONFIGURING;
    let currentUserRole = UserRoles.CONFIGURER;
    let uploadedFiles = [];
    let currentUploadContext = 'execution';
    let selectedConfirmerIds = [];
    let currentConfirmers = [];
    let taskSubmitted = false;
    let uploadedRecordFiles = [];
    let executionRecordsList = [];
    let currentEditRecordIndex = -1;

    const projectMembers = [
        { id: 1, name: '张三', role: '项目总', avatar: '张' },
        { id: 2, name: '李四', role: '工长', avatar: '李' },
        { id: 3, name: '王五', role: '业主', avatar: '王' },
        { id: 4, name: '赵六', role: '设计师', avatar: '赵' },
        { id: 5, name: '钱七', role: '施工员', avatar: '钱' },
        { id: 6, name: '孙八', role: '施工员', avatar: '孙' },
        { id: 7, name: '周九', role: '监理', avatar: '周' },
        { id: 8, name: '吴十', role: '电工', avatar: '吴' }
    ];

    const mockConfirmerData = {
        confirming: [
            { id: 1, name: '张三', role: '项目总', avatar: '张', status: 'confirmed', time: '2024-01-15 14:30' },
            { id: 3, name: '王五', role: '业主', avatar: '王', status: 'pending', time: '等待确认中...' },
            { id: 4, name: '赵六', role: '设计师', avatar: '赵', status: 'pending', time: '等待确认中...' }
        ],
        confirmingAfterReject: [
            { id: 1, name: '张三', role: '项目总', avatar: '张', status: 'confirmed', time: '2024-01-26 11:00' },
            { id: 3, name: '王五', role: '业主', avatar: '王', status: 'pending', time: '等待确认中...' },
            { id: 4, name: '赵六', role: '设计师', avatar: '赵', status: 'pending', time: '等待确认中...' }
        ],
        completed: [
            { id: 1, name: '张三', role: '项目总', avatar: '张', status: 'confirmed', time: '2024-01-25 15:20' },
            { id: 3, name: '王五', role: '业主', avatar: '王', status: 'confirmed', time: '2024-01-25 16:30' },
            { id: 4, name: '赵六', role: '设计师', avatar: '赵', status: 'confirmed', time: '2024-01-25 17:00' }
        ]
    };

    function getRoleBadgeClass(role) {
        const roleMap = {
            '项目总': 'manager',
            '工长': 'foreman',
            '业主': 'owner',
            '设计师': 'designer',
            '施工员': 'worker',
            '监理': 'foreman',
            '电工': 'worker'
        };
        return roleMap[role] || 'worker';
    }

    function createConfirmerStatusItem(confirmer, canModify = false) {
        return `
            <div class="confirmer-status-item" data-confirmer-id="${confirmer.id}">
                <div class="avatar">${confirmer.avatar}</div>
                <div class="info">
                    <div class="name">${confirmer.name} · ${confirmer.role}</div>
                    <div class="time">${confirmer.time || (confirmer.status === 'confirmed' ? '已确认' : '等待确认中...')}</div>
                </div>
                <div class="status ${confirmer.status}">${confirmer.status === 'confirmed' ? '已确认' : '待确认'}</div>
                ${canModify ? `<div class="delete-btn" onclick="removeConfirmer(${confirmer.id})">×</div>` : ''}
            </div>
        `;
    }

    function createConfiguringConfirmerItem(confirmer) {
        return `
            <div class="confirmer-status-item configuring-mode" data-confirmer-id="${confirmer.id}">
                <div class="avatar">${confirmer.avatar}</div>
                <div class="info">
                    <div class="name">${confirmer.name} · ${confirmer.role}</div>
                </div>
                <div class="delete-btn always-show" onclick="removeConfiguringConfirmer(${confirmer.id})">×</div>
            </div>
        `;
    }

    function createConfirmRecordItem(confirmer, isCurrentRound = true) {
        const opacityStyle = isCurrentRound ? '' : 'style="opacity: 0.6;"';
        return `
            <div class="confirm-item" ${opacityStyle}>
                <div class="avatar">${confirmer.avatar}</div>
                <div class="info">
                    <div class="name-row">
                        <div class="name">${confirmer.name} <span class="role-badge ${getRoleBadgeClass(confirmer.role)}">${confirmer.role}</span></div>
                        <div class="status-tag ${confirmer.status}">${confirmer.status === 'confirmed' ? '已确认' : (confirmer.status === 'rejected' ? '已驳回' : '待确认')}</div>
                    </div>
                    <div class="time">${confirmer.time || '等待确认中...'}</div>
                    ${confirmer.content ? `<div class="content">${confirmer.content}</div>` : ''}
                    ${confirmer.mediaRow ? `<div class="media-row">${confirmer.mediaRow}</div>` : ''}
                    ${confirmer.rating ? `<div class="rating">${confirmer.rating}</div>` : ''}
                </div>
            </div>
        `;
    }

    function createExecutionMediaItem(file) {
        if (file.type.startsWith('image')) {
            return `<div class="media-item" style="position: relative;"><div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #E6F7FF 0%, #BAE7FF 100%); font-size: 24px;">📷</div></div>`;
        } else if (file.type.startsWith('video')) {
            return `<div class="media-item" style="position: relative; background: #000;"><span class="play-icon">▶</span><span class="duration">0:15</span></div>`;
        } else {
            return `<div class="media-item" style="position: relative;"><div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #F6FFED 0%, #B7EB8F 100%); font-size: 24px;">🎵</div></div>`;
        }
    }

    function safeGetElement(id) {
        const el = document.getElementById(id);
        if (!el) {
            console.warn(`Element not found: ${id}`);
        }
        return el;
    }

    function safeQuerySelector(selector) {
        const el = document.querySelector(selector);
        if (!el) {
            console.warn(`Element not found: ${selector}`);
        }
        return el;
    }
    
    function toggleStandard(type) {
        const list = document.getElementById(type + 'Standard');
        const btn = list.previousElementSibling.querySelector('.toggle-btn');
        
        if (list.classList.contains('collapsed')) {
            list.classList.remove('collapsed');
            btn.textContent = '收起';
        } else {
            list.classList.add('collapsed');
            btn.textContent = '展开';
        }
    }
    
    function showConfirmModal() {
        resetDimensionRatings();
        document.getElementById('confirmModal').classList.add('show');
    }
    
    function closeConfirmModal() {
        document.getElementById('confirmModal').classList.remove('show');
    }
    
    function showRejectModal() {
        document.getElementById('rejectModal').classList.add('show');
    }
    
    function closeRejectModal() {
        document.getElementById('rejectModal').classList.remove('show');
    }
    
    function showUploadModal() {
        document.getElementById('uploadModal').classList.add('show');
    }
    
    function closeUploadModal() {
        document.getElementById('uploadModal').classList.remove('show');
        uploadedFiles = [];
        updateUploadedPreview();
    }
    
    function showExecutorSelector() {
        const modal = document.getElementById('executorSelectorModal');
        const searchInput = document.getElementById('executorSearchInput');
        searchInput.value = '';
        renderExecutorOptions();
        modal.classList.add('show');
    }
    
    function closeExecutorSelector() {
        document.getElementById('executorSelectorModal').classList.remove('show');
    }
    
    function renderExecutorOptions(keyword = '') {
        const list = document.getElementById('executorOptionList');
        const filteredMembers = projectMembers.filter(m => 
            m.name.toLowerCase().includes(keyword.toLowerCase()) ||
            m.role.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (filteredMembers.length === 0) {
            list.innerHTML = '<div class="empty-result">未找到匹配的成员</div>';
            return;
        }
        
        list.innerHTML = filteredMembers.map(member => `
            <div class="person-option" onclick="selectExecutor(${member.id})">
                <div class="avatar">${member.avatar}</div>
                <div class="info">
                    <div class="name">${member.name}</div>
                    <div class="role">${member.role}</div>
                </div>
            </div>
        `).join('');
    }
    
    function filterExecutors(keyword) {
        renderExecutorOptions(keyword);
    }
    
    function selectExecutor(memberId) {
        const member = projectMembers.find(m => m.id === memberId);
        if (!member) return;
        
        const executorList = document.getElementById('executorList');
        const executorItem = document.getElementById('executorItem');
        const noExecutorView = document.getElementById('noExecutorView');
        const addExecutorBtn = document.getElementById('addExecutorBtn');
        const confirmProgress = document.getElementById('confirmProgress');
        const taskStatus = document.getElementById('taskStatus');
        
        executorItem.querySelector('.person-avatar').textContent = member.avatar;
        executorItem.querySelector('.person-name').innerHTML = `${member.name} <span class="role-badge ${getRoleBadgeClass(member.role)}">${member.role}</span>`;
        
        executorList.style.display = 'flex';
        executorItem.style.display = 'flex';
        noExecutorView.style.display = 'none';
        addExecutorBtn.style.display = 'flex';
        
        window.currentHasExecutor = true;
        window.currentExecutorId = memberId;
        window.currentExecutorName = member.name;
        
        closeExecutorSelector();
        showToast('设置成功，将消息通知执行人！');
        
        setTimeout(() => {
            // 前置阻塞态下改派执行人不解除阻塞，保持当前阻塞状态；其余情况回到「待开始」
            updateTaskStatus(currentTaskStatus === TaskStatus.PENDING_BLOCKED ? TaskStatus.PENDING_BLOCKED : TaskStatus.PENDING);
        }, 500);
    }
    
    function showConfirmerSelector() {
        const modal = document.getElementById('confirmerSelectorModal');
        const searchInput = document.getElementById('confirmerSearchInput');
        searchInput.value = '';
        selectedConfirmerIds = currentConfirmers.map(c => c.id);
        renderConfirmerOptions();
        modal.classList.add('show');
    }
    
    function closeConfirmerSelector() {
        document.getElementById('confirmerSelectorModal').classList.remove('show');
    }
    
    function removeConfirmer(confirmerId) {
        const confirmer = currentConfirmers.find(c => c.id === confirmerId);
        if (!confirmer) return;
        
        if (currentConfirmers.length <= 1) {
            showToast('至少需要保留一位确认人');
            return;
        }
        
        currentConfirmers = currentConfirmers.filter(c => c.id !== confirmerId);
        renderConfirmerList();
        updateConfirmerCount();
        showToast(`已移除确认人：${confirmer.name}`);
    }
    
    function renderConfirmerList() {
        const confirmerList = document.getElementById('confirmerList');
        const canModify = (currentTaskStatus === TaskStatus.CONFIGURING || 
                          currentTaskStatus === TaskStatus.PENDING || 
                          currentTaskStatus === TaskStatus.IN_PROGRESS) &&
                          currentUserRole === UserRoles.CONFIGURER;
        
        confirmerList.innerHTML = currentConfirmers.map(confirmer => `
            <div class="confirmer-status-item ${canModify ? 'configuring-mode' : ''}" data-confirmer-id="${confirmer.id}">
                <div class="avatar">${confirmer.avatar}</div>
                <div class="info">
                    <div class="name">${confirmer.name} · ${confirmer.role}</div>
                </div>
                ${canModify ? `<div class="delete-btn always-show" onclick="removeConfirmer(${confirmer.id})">×</div>` : ''}
            </div>
        `).join('');
    }
    
    function renderConfiguringConfirmerList() {
        const confirmerList = document.getElementById('confirmerList');
        const isConfigurer = currentUserRole === UserRoles.CONFIGURER;
        
        if (currentConfirmers.length === 0) {
            if (isConfigurer) {
                confirmerList.innerHTML = `
                    <div class="no-confirmer-tip" onclick="showConfirmerSelector()" style="display: flex; align-items: center; justify-content: center; padding: 10px; color: var(--text-tertiary); cursor: pointer;">
                        <div style="text-align: center;">
                            <div style="font-size: 20px; margin-bottom: 4px;">👥</div>
                            <div style="font-size: 13px;">暂无确认人，点击添加</div>
                        </div>
                    </div>
                `;
            } else {
                confirmerList.innerHTML = `
                    <div style="text-align: center; padding: 16px; color: var(--text-tertiary);">
                        <div style="font-size: 13px;">暂无确认人</div>
                    </div>
                `;
            }
        } else {
            confirmerList.innerHTML = currentConfirmers.map(confirmer => `
                <div class="confirmer-status-item ${isConfigurer ? 'configuring-mode' : ''}" data-confirmer-id="${confirmer.id}">
                    <div class="avatar">${confirmer.avatar}</div>
                    <div class="info">
                        <div class="name">${confirmer.name} · ${confirmer.role}</div>
                    </div>
                    ${isConfigurer ? `<div class="delete-btn always-show" onclick="removeConfiguringConfirmer(${confirmer.id})">×</div>` : ''}
                </div>
            `).join('');
        }
        
        updateConfirmerCount();
    }
    
    function removeConfiguringConfirmer(confirmerId) {
        const confirmer = currentConfirmers.find(c => c.id === confirmerId);
        if (!confirmer) return;
        
        currentConfirmers = currentConfirmers.filter(c => c.id !== confirmerId);
        renderConfiguringConfirmerList();
        showToast(`已移除确认人：${confirmer.name}`);
    }
    
    function updateConfirmerCount() {
        const confirmerCount = document.getElementById('confirmerCount');
        confirmerCount.textContent = `${currentConfirmers.length}人`;
    }
    
    function renderConfirmerOptions(keyword = '') {
        const list = document.getElementById('confirmerOptionList');
        const filteredMembers = projectMembers.filter(m => 
            m.name.toLowerCase().includes(keyword.toLowerCase()) ||
            m.role.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (filteredMembers.length === 0) {
            list.innerHTML = '<div class="empty-result">未找到匹配的成员</div>';
            return;
        }
        
        list.innerHTML = filteredMembers.map(member => `
            <div class="person-option ${selectedConfirmerIds.includes(member.id) ? 'selected' : ''}" onclick="toggleConfirmer(${member.id})">
                <div class="avatar">${member.avatar}</div>
                <div class="info">
                    <div class="name">${member.name}</div>
                    <div class="role">${member.role}</div>
                </div>
                ${selectedConfirmerIds.includes(member.id) ? '<span class="check-icon">✓</span>' : ''}
            </div>
        `).join('');
    }
    
    function filterConfirmers(keyword) {
        renderConfirmerOptions(keyword);
    }
    
    function toggleConfirmer(memberId) {
        const index = selectedConfirmerIds.indexOf(memberId);
        if (index > -1) {
            selectedConfirmerIds.splice(index, 1);
        } else {
            if (selectedConfirmerIds.length >= 5) {
                showToast('确认人最多选择5人');
                return;
            }
            selectedConfirmerIds.push(memberId);
        }
        renderConfirmerOptions(document.getElementById('confirmerSearchInput').value);
    }
    
    function confirmConfirmerSelection() {
        currentConfirmers = selectedConfirmerIds.map(id => {
            const member = projectMembers.find(m => m.id === id);
            return {
                id: member.id,
                name: member.name,
                role: member.role,
                avatar: member.avatar,
                status: 'pending'
            };
        });
        
        const taskStatus = document.getElementById('taskStatus');
        if (taskStatus && taskStatus.textContent.trim() === '待配置') {
            renderConfiguringConfirmerList();
        } else {
            renderConfirmerList();
            updateConfirmerCount();
        }
        
        closeConfirmerSelector();
        
        if (currentConfirmers.length > 0) {
            showToast(`已更新确认人，共 ${currentConfirmers.length} 人`);
        }
    }
    
    function showSubmitTaskModal() {
        if (!window.currentHasExecutor) {
            showToast('请先选择执行人');
            return;
        }
        
        const executorInfo = document.getElementById('submitExecutorInfo');
        const executor = projectMembers.find(m => m.id === window.currentExecutorId);
        if (executor) {
            executorInfo.innerHTML = `
                <div class="avatar" style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%); display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-size: 12px; margin-right: 8px;">${executor.avatar}</div>
                <div style="font-size: 14px; color: var(--text-primary);">${executor.name} · ${executor.role}</div>
            `;
        }
        
        const confirmerInfo = document.getElementById('submitConfirmerInfo');
        const confirmerCount = document.getElementById('submitConfirmerCount');
        confirmerCount.textContent = currentConfirmers.length;
        
        if (currentConfirmers.length > 0) {
            confirmerInfo.innerHTML = currentConfirmers.map(confirmer => `
                <div style="display: flex; align-items: center; margin-bottom: 6px;">
                    <div class="avatar" style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%); display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-size: 12px; margin-right: 8px;">${confirmer.avatar}</div>
                    <div style="font-size: 14px; color: var(--text-primary);">${confirmer.name} · ${confirmer.role}</div>
                </div>
            `).join('');
        } else {
            confirmerInfo.innerHTML = '<div style="font-size: 14px; color: var(--text-tertiary);">暂无确认人</div>';
        }
        
        document.getElementById('submitTaskModal').classList.add('show');
    }
    
    function closeSubmitTaskModal() {
        document.getElementById('submitTaskModal').classList.remove('show');
    }
    
    function confirmSubmitTask() {
        taskSubmitted = true;
        closeSubmitTaskModal();
        
        const addExecutorBtn = document.getElementById('addExecutorBtn');
        const addConfirmerBtn = document.getElementById('addConfirmerBtn');
        
        if (addExecutorBtn) addExecutorBtn.style.display = 'none';
        if (addConfirmerBtn) addConfirmerBtn.style.display = 'none';
        
        document.querySelectorAll('.confirmer-status-item .delete-btn').forEach(btn => {
            btn.style.display = 'none';
        });
        
        showToast('任务提交成功，已通知相关人员');
        
        setTimeout(() => {
            updateTaskStatus(TaskStatus.PENDING);
        }, 500);
    }
    
    function setRating(rating) {
        currentRating = rating;
        const stars = document.querySelectorAll('#ratingStars .star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }
    
    function setDimensionRating(dimension, rating) {
        dimensionRatings[dimension] = rating;
        const containerId = 'ratingStars' + dimension.charAt(0).toUpperCase() + dimension.slice(1);
        const stars = document.querySelectorAll('#' + containerId + ' .star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }
    
    function resetDimensionRatings() {
        dimensionRatings = { quality: 0, efficiency: 0, attitude: 0 };
        ['Quality', 'Efficiency', 'Attitude'].forEach(dim => {
            const stars = document.querySelectorAll('#ratingStars' + dim + ' .star');
            stars.forEach(star => star.classList.remove('active'));
        });
    }
    
    function setOverallRating(rating) {
        overallRating = rating;
        const wrappers = document.querySelectorAll('#ratingStarsOverall .star-wrapper');
        wrappers.forEach((wrapper, index) => {
            const starNum = index + 1;
            const halfStar = wrapper.querySelector('.star.half');
            const fullStar = wrapper.querySelector('.star.full');
            
            if (rating >= starNum) {
                halfStar.classList.add('active');
                fullStar.classList.add('active');
            } else if (rating >= starNum - 0.5) {
                halfStar.classList.add('active');
                fullStar.classList.remove('active');
            } else {
                halfStar.classList.remove('active');
                fullStar.classList.remove('active');
            }
        });
    }
    
    function toggleTag(tag) {
        const index = selectedTags.indexOf(tag);
        const tagElements = document.querySelectorAll('#confirmModal .tag-item');
        
        if (index > -1) {
            selectedTags.splice(index, 1);
        } else {
            selectedTags.push(tag);
        }
        
        tagElements.forEach(el => {
            const tagText = el.textContent.trim();
            let tagKey = '';
            if (tagText === '责任心棒') tagKey = 'responsible';
            else if (tagText === '服务态度好') tagKey = 'attitude';
            else if (tagText === '专业能力强') tagKey = 'professional';
            
            if (selectedTags.includes(tagKey)) {
                el.classList.add('selected');
            } else {
                el.classList.remove('selected');
            }
        });
    }
    
    function setEvaluationOverallRating(rating) {
        evaluationOverallRating = rating;
        const wrappers = document.querySelectorAll('#evaluationStarsOverall .star-wrapper');
        wrappers.forEach((wrapper, index) => {
            const starNum = index + 1;
            const halfStar = wrapper.querySelector('.star.half');
            const fullStar = wrapper.querySelector('.star.full');
            
            if (rating >= starNum) {
                halfStar.classList.add('active');
                fullStar.classList.add('active');
            } else if (rating >= starNum - 0.5) {
                halfStar.classList.add('active');
                fullStar.classList.remove('active');
            } else {
                halfStar.classList.remove('active');
                fullStar.classList.remove('active');
            }
        });
    }
    
    function toggleEvaluationTag(tag) {
        const index = selectedEvaluationTags.indexOf(tag);
        const tagElements = document.querySelectorAll('#evaluationModal .tag-item');
        
        if (index > -1) {
            selectedEvaluationTags.splice(index, 1);
        } else {
            selectedEvaluationTags.push(tag);
        }
        
        tagElements.forEach(el => {
            const tagText = el.textContent.trim();
            let tagKey = '';
            if (tagText === '责任心棒') tagKey = 'responsible';
            else if (tagText === '服务态度好') tagKey = 'attitude';
            else if (tagText === '专业能力强') tagKey = 'professional';
            
            if (selectedEvaluationTags.includes(tagKey)) {
                el.classList.add('selected');
            } else {
                el.classList.remove('selected');
            }
        });
    }
    
    function confirmTask() {
        const avgRating = Math.round((dimensionRatings.quality + dimensionRatings.efficiency + dimensionRatings.attitude) / 3 * 10) / 10;
        closeConfirmModal();
        showToast('确认成功！您的确认已记录。');
    }
    
    function rejectTask() {
        const reasonInput = document.getElementById('rejectDescInput');
        const reason = reasonInput.value.trim();
        
        // 校验驳回原因（使用validation.js）
        const result = Validation.validate.textLength(reason, 500, true, '驳回原因');
        if (!result.valid) {
            showToast(result.message);
            reasonInput.focus();
            return;
        }
        closeRejectModal();
        showToast('已驳回！系统已通知执行人重新执行。');
        updateTaskStatus(TaskStatus.REJECTED_PENDING);
    }
    
    function submitExecution() {
        closeUploadModal();
        showToast('执行记录已提交！系统已通知确认人进行确认。');
        if (currentTaskStatus === TaskStatus.REJECTED_PENDING) {
            updateTaskStatus(TaskStatus.CONFIRMING_AFTER_REJECT);
        } else {
            updateTaskStatus(TaskStatus.CONFIRMING);
        }
    }
    
    function showUploadRecordModal() {
        uploadedRecordFiles = [];
        currentEditRecordIndex = -1;
        document.getElementById('recordDescInput').value = '';
        document.getElementById('recordDescInput').placeholder = '请输入执行说明（选填）';
        updateUploadedRecordPreview();
        document.getElementById('uploadRecordModal').classList.add('show');
    }
    
    function closeUploadRecordModal() {
        document.getElementById('uploadRecordModal').classList.remove('show');
    }
    
    function confirmUploadRecord() {
        const desc = document.getElementById('recordDescInput').value.trim();
        
        if (uploadedRecordFiles.length === 0 && !desc) {
            showToast('请至少上传一个文件或输入执行说明');
            return;
        }
        
        const newRecord = {
            files: [...uploadedRecordFiles],
            desc: desc,
            time: new Date().toLocaleString('zh-CN', {month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'}).replace(/\//g, '-')
        };
        
        if (currentEditRecordIndex >= 0) {
            executionRecordsList[currentEditRecordIndex] = newRecord;
            showToast('执行记录已更新');
        } else {
            executionRecordsList.push(newRecord);
            showToast('执行记录已上传');
        }
        
        closeUploadRecordModal();
        
        if (currentTaskStatus !== TaskStatus.IN_PROGRESS) {
            updateTaskStatus(TaskStatus.IN_PROGRESS);
        } else {
            updateExecutionRecordDisplay();
        }
    }
    
    function deleteExecutionRecord(index) {
        executionRecordsList.splice(index, 1);
        updateExecutionRecordDisplay();
        if (executionRecordsList.length === 0 && currentTaskStatus === TaskStatus.IN_PROGRESS) {
            updateTaskStatus(TaskStatus.PENDING);
        }
    }
    
    function editExecutionRecord(index) {
        currentEditRecordIndex = index;
        const record = executionRecordsList[index];
        uploadedRecordFiles = [...record.files];
        document.getElementById('recordDescInput').value = record.desc || '';
        document.getElementById('recordDescInput').placeholder = '请输入执行说明（选填）';
        updateUploadedRecordPreview();
        document.getElementById('uploadRecordModal').classList.add('show');
    }
    
    function updateExecutionRecordDisplay() {
        const currentExecution = document.getElementById('currentExecution');
        if (!currentExecution) return;
        
        if (executionRecordsList.length > 0) {
            let recordsHtml = '';
            
            executionRecordsList.forEach((record, recordIndex) => {
                let mediaHtml = '<div class="media-grid">';
                record.files.forEach((file, fileIndex) => {
                    if (file.type.startsWith('image')) {
                        mediaHtml += `
                            <div class="media-item" style="position: relative;">
                                <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #E6F7FF 0%, #BAE7FF 100%); font-size: 24px;">📷</div>
                            </div>
                        `;
                    } else if (file.type.startsWith('video')) {
                        mediaHtml += `
                            <div class="media-item" style="position: relative; background: #000;">
                                <span class="play-icon">▶</span>
                                <span class="duration">0:15</span>
                            </div>
                        `;
                    } else {
                        mediaHtml += `
                            <div class="media-item" style="position: relative;">
                                <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #F6FFED 0%, #B7EB8F 100%); font-size: 24px;">🎵</div>
                            </div>
                        `;
                    }
                });
                mediaHtml += '</div>';
                
                recordsHtml += `
                    <div class="execution-record-item" style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #E8E8E8;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div style="font-size: 12px; color: var(--text-tertiary);">
                                📤 执行记录 #${recordIndex + 1} · ${record.time}
                            </div>
                            ${currentUserRole === 'executor' && currentTaskStatus !== 'confirming' && currentTaskStatus !== 'completed' && currentTaskStatus !== 'completed_with_reject' && currentTaskStatus !== 'confirming_after_reject' ? `
                                <div style="display: flex; gap: 8px;">
                                    <span onclick="editExecutionRecord(${recordIndex})" style="font-size: 12px; color: var(--primary-color); cursor: pointer;">✎ 编辑</span>
                                    <span onclick="deleteExecutionRecord(${recordIndex})" style="font-size: 12px; color: var(--error-color); cursor: pointer;">✕ 删除</span>
                                </div>
                            ` : ''}
                        </div>
                        ${mediaHtml}
                        ${record.desc ? `<div class="execution-desc" style="margin-top: 8px;">${record.desc}</div>` : ''}
                    </div>
                `;
            });
            
            currentExecution.innerHTML = `
                <div class="section-title">
                    <span>📤 执行人上传的内容</span>
                    ${currentUserRole === 'executor' && currentTaskStatus !== 'confirming' && currentTaskStatus !== 'completed' && currentTaskStatus !== 'completed_with_reject' && currentTaskStatus !== 'confirming_after_reject' ? '<span class="edit-btn" onclick="showUploadRecordModal()" style="font-size: 12px; color: var(--primary-color); cursor: pointer;">+ 继续上传</span>' : ''}
                </div>
                ${recordsHtml}
            `;
        } else {
            currentExecution.innerHTML = `
                <div class="section-title">
                    <span>📤 执行人上传的内容</span>
                    ${currentUserRole === 'executor' && currentTaskStatus !== 'confirming' && currentTaskStatus !== 'completed' && currentTaskStatus !== 'completed_with_reject' && currentTaskStatus !== 'confirming_after_reject' ? '<span class="edit-btn" onclick="showUploadRecordModal()" style="font-size: 12px; color: var(--primary-color); cursor: pointer;">✎ 上传</span>' : ''}
                </div>
                <div style="text-align: center; padding: 20px; color: var(--text-tertiary);">
                    暂无执行记录
                </div>
            `;
        }
    }
    
    function renderExecutionRecordsReadOnly(showEditBtn = false) {
        const currentExecution = document.getElementById('currentExecution');
        if (!currentExecution) return;
        
        if (executionRecordsList.length > 0) {
            let recordsHtml = '';
            
            executionRecordsList.forEach((record, recordIndex) => {
                let mediaHtml = '<div class="media-grid">';
                record.files.forEach((file, fileIndex) => {
                    if (file.type.startsWith('image')) {
                        mediaHtml += `
                            <div class="media-item" style="position: relative;">
                                <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #E6F7FF 0%, #BAE7FF 100%); font-size: 24px;">📷</div>
                            </div>
                        `;
                    } else if (file.type.startsWith('video')) {
                        mediaHtml += `
                            <div class="media-item" style="position: relative; background: #000;">
                                <span class="play-icon">▶</span>
                                <span class="duration">0:15</span>
                            </div>
                        `;
                    } else {
                        mediaHtml += `
                            <div class="media-item" style="position: relative;">
                                <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #F6FFED 0%, #B7EB8F 100%); font-size: 24px;">🎵</div>
                            </div>
                        `;
                    }
                });
                mediaHtml += '</div>';
                
                recordsHtml += `
                    <div class="execution-record-item" style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #E8E8E8;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div style="font-size: 12px; color: var(--text-tertiary);">
                                📤 执行记录 #${recordIndex + 1} · ${record.time}
                            </div>
                        </div>
                        ${mediaHtml}
                        ${record.desc ? `<div class="execution-desc" style="margin-top: 8px;">${record.desc}</div>` : ''}
                    </div>
                `;
            });
            
            currentExecution.innerHTML = `
                <div class="section-title">
                    <span>📤 执行人提交的内容</span>
                </div>
                ${recordsHtml}
            `;
        }
    }
    
    function showSubmitConfirmModal() {
        // 未上传执行记录时，禁止提交确认 / 完成任务，提示先上传
        if (executionRecordsList.length === 0) {
            showToast('请先上传执行记录，再提交确认 / 完成任务');
            return;
        }
        const hasConfirmers = currentConfirmers.length > 0;
        const modalTitle = document.getElementById('submitModalTitle');
        const modalText = document.getElementById('submitModalText');
        const modalConfirmerList = document.getElementById('submitModalConfirmerList');
        const modalBtn = document.getElementById('submitModalBtn');
        
        if (hasConfirmers) {
            modalTitle.textContent = '提交确认';
            modalText.textContent = '确定要提交确认吗？';
            modalConfirmerList.style.display = 'block';
            modalBtn.textContent = '确认提交';
        } else {
            modalTitle.textContent = '完成任务';
            modalText.textContent = '确定要完成任务吗？';
            modalConfirmerList.style.display = 'none';
            modalBtn.textContent = '确认完成';
        }
        
        document.getElementById('submitConfirmModal').classList.add('show');
    }
    
    function closeSubmitConfirmModal() {
        document.getElementById('submitConfirmModal').classList.remove('show');
    }
    
    function confirmSubmitToConfirmer() {
        closeSubmitConfirmModal();
        const hasConfirmers = currentConfirmers.length > 0;
        
        if (hasConfirmers) {
            showToast('已提交确认，请等待确认');
            updateTaskStatus(TaskStatus.CONFIRMING);
        } else {
            showToast('任务已完成');
            updateTaskStatus(TaskStatus.COMPLETED);
        }
    }
    
    function showToast(message) {
        const existingToast = document.querySelector('.app-toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = 'app-toast';
        toast.innerHTML = message.replace(/\n/g, '<br>');
        toast.style.cssText = `
            position: absolute;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.7);
            color: #FFFFFF;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 13px;
            z-index: 1000;
            white-space: pre-wrap;
            max-width: 90%;
            text-align: center;
            line-height: 1.5;
        `;
        const phoneFrame = document.querySelector('.phone-frame');
        if (phoneFrame) {
            phoneFrame.appendChild(toast);
        }
        
        setTimeout(() => {
            toast.remove();
        }, 2500);
    }
    
    function showExecutionDetail() {
        showToast('查看完整执行记录详情');
    }
    
    function toggleHistoryRecords() {
        const historyRecords = document.getElementById('historyRecords');
        const moreBtn = document.querySelector('#executionRecordCard .more');
        
        if (historyRecords.style.display === 'none') {
            historyRecords.style.display = 'block';
            moreBtn.textContent = '收起历史记录';
        } else {
            historyRecords.style.display = 'none';
            moreBtn.textContent = '查看历史记录';
        }
    }
    
    function toggleCard(type) {
        let content, title;
        
        if (type === 'execution') {
            content = document.getElementById('executionCardContent');
            title = document.querySelector('#executionRecordCard .card-title');
        } else if (type === 'confirm') {
            content = document.getElementById('confirmRecordCardContent');
            title = document.querySelector('#confirmRecordCard .card-title');
        }
        
        if (content && title) {
            content.classList.toggle('collapsed');
            title.classList.toggle('collapsed');
        }
    }
    
    function triggerUpload(type, context) {
        currentUploadContext = context;
        if (type === 'image') {
            document.getElementById('fileInput').accept = 'image/*';
            document.getElementById('fileInput').click();
        } else if (type === 'video') {
            document.getElementById('fileInput').accept = 'video/*';
            document.getElementById('fileInput').click();
        } else if (type === 'audio') {
            document.getElementById('fileInput').accept = 'audio/*';
            document.getElementById('fileInput').click();
        }
    }
    
    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            if (currentUploadContext === 'record') {
                uploadedRecordFiles.push({
                    name: file.name,
                    type: file.type,
                    size: file.size
                });
                updateUploadedRecordPreview();
                showToast('文件已选择：' + file.name);
            } else {
                uploadedFiles.push({
                    name: file.name,
                    type: file.type,
                    size: file.size
                });
                updateUploadedPreview();
                showToast('文件已选择：' + file.name);
            }
        }
        event.target.value = '';
    }
    
    function updateUploadedPreview() {
        const preview = document.getElementById('uploadedPreview');
        const filesContainer = document.getElementById('uploadedFiles');
        
        if (uploadedFiles.length > 0) {
            preview.style.display = 'block';
            filesContainer.innerHTML = uploadedFiles.map((file, index) => `
                <div style="display: flex; align-items: center; gap: 4px; background: var(--bg-secondary); padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    <span>${file.type.startsWith('image') ? '📷' : file.type.startsWith('video') ? '🎬' : '🎵'}</span>
                    <span style="max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${file.name}</span>
                    <span onclick="removeFile(${index})" style="cursor: pointer; color: var(--error-color);">✕</span>
                </div>
            `).join('');
        } else {
            preview.style.display = 'none';
        }
    }
    
    function updateUploadedRecordPreview() {
        const preview = document.getElementById('uploadedRecordPreview');
        const filesContainer = document.getElementById('uploadedRecordFiles');
        
        if (uploadedRecordFiles.length > 0) {
            preview.style.display = 'block';
            filesContainer.innerHTML = uploadedRecordFiles.map((file, index) => `
                <div style="position: relative; width: 60px; height: 60px; border-radius: 8px; overflow: hidden; background: var(--bg-secondary);">
                    ${file.type.startsWith('image') ? 
                        `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #E6F7FF 0%, #BAE7FF 100%); font-size: 24px;">📷</div>` : 
                        file.type.startsWith('video') ? 
                        `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #FFF0F6 0%, #FFD6E7 100%); font-size: 24px;">🎬</div>` :
                        `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #F6FFED 0%, #B7EB8F 100%); font-size: 24px;">🎵</div>`
                    }
                    <div onclick="removeRecordFile(${index})" style="position: absolute; top: 2px; right: 2px; width: 18px; height: 18px; border-radius: 50%; background: rgba(0,0,0,0.5); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 10px; cursor: pointer;">✕</div>
                </div>
            `).join('');
        } else {
            preview.style.display = 'none';
        }
    }
    
    function removeRecordFile(index) {
        uploadedRecordFiles.splice(index, 1);
        updateUploadedRecordPreview();
    }
    
    function removeFile(index) {
        uploadedFiles.splice(index, 1);
        updateUploadedPreview();
    }
    
    function updateTaskStatus(status) {
        currentTaskStatus = status;
        const cfgView = getConfigurerViewVisible(status);
        // 不支持配置任务的状态/端，配置人视角不可达，回退到合适的默认视角，避免渲染配置页内容
        if (currentUserRole === UserRoles.CONFIGURER && !cfgView.roleSwitcher && !cfgView.configuring) {
            currentUserRole = (status === TaskStatus.CONFIRMING || status === TaskStatus.CONFIRMING_AFTER_REJECT ||
                status === TaskStatus.COMPLETED || status === TaskStatus.COMPLETED_WITH_REJECT)
                ? UserRoles.CONFIRMER
                : (status === TaskStatus.PENDING || status === TaskStatus.REJECTED_PENDING || status === TaskStatus.IN_PROGRESS
                    ? UserRoles.EXECUTOR : UserRoles.OTHER);
        }
        const header = safeGetElement('taskHeader');
        const statusBadge = safeGetElement('taskStatus');
        const confirmProgress = safeGetElement('confirmProgress');
        const actionButtons = safeGetElement('actionButtons');
        const addConfirmerBtn = safeGetElement('addConfirmerBtn');
        const confirmerCard = safeGetElement('confirmerCard');
        const flowProgressText = safeGetElement('flowProgressText');
        const flowProgressBar = safeGetElement('flowProgressBar');
        const executionRecordCard = safeGetElement('executionRecordCard');
        const confirmRecordCard = safeGetElement('confirmRecordCard');
        const confirmerList = safeGetElement('confirmerList');
        const acceptanceProgress = safeGetElement('acceptanceProgress');
        const preTaskBlockCard = safeGetElement('preTaskBlockCard');
        
        if (preTaskBlockCard) preTaskBlockCard.style.display = 'none';
        
        document.querySelectorAll('.status-switch-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelectorAll('.status-switch-item').forEach(item => {
            if (item.textContent.trim() === StatusTextMap[status]) {
                item.classList.add('active');
            }
        });
        
        const flowStep1 = safeGetElement('flowStep1');
        const flowStep2 = safeGetElement('flowStep2');
        const flowStep3 = safeGetElement('flowStep3');
        const flowStep4 = safeGetElement('flowStep4');
        const flowLine1 = safeGetElement('flowLine1');
        const flowLine2 = safeGetElement('flowLine2');
        const flowLine3 = safeGetElement('flowLine3');
        
        if (flowStep1) flowStep1.className = 'flow-step';
        if (flowStep2) flowStep2.className = 'flow-step';
        if (flowStep3) flowStep3.className = 'flow-step';
        if (flowStep4) flowStep4.className = 'flow-step';
        if (flowLine1) flowLine1.className = 'flow-line';
        if (flowLine2) flowLine2.className = 'flow-line';
        if (flowLine3) flowLine3.className = 'flow-line';
        
        if (status === TaskStatus.CONFIGURING) {
            if (header) header.className = 'task-header-card';
            if (statusBadge) statusBadge.textContent = '待配置';
            if (confirmProgress) confirmProgress.innerHTML = '请配置执行人（<span style="color: #FF4D4F;">必填</span>）和确认人（<span style="color: #8C8C8C;">选填</span>）';
            
            if (executionRecordCard) executionRecordCard.style.display = 'none';
            if (confirmRecordCard) confirmRecordCard.style.display = 'none';
            
            const executorList = document.getElementById('executorList');
            const executorItem = document.getElementById('executorItem');
            const noExecutorView = document.getElementById('noExecutorView');
            const addExecutorBtn = document.getElementById('addExecutorBtn');
            
            const hasExecutor = window.currentHasExecutor || false;
            
            const roleSwitcher = document.getElementById('roleSwitcher');
            const configuringRoleSwitcher = document.getElementById('configuringRoleSwitcher');
            
            if (currentUserRole === 'configurer') {
                if (hasExecutor) {
                    executorList.style.display = 'flex';
                    executorItem.style.display = 'flex';
                    noExecutorView.style.display = 'none';
                    addExecutorBtn.style.display = 'flex';
                } else {
                    executorList.style.display = 'none';
                    noExecutorView.style.display = 'flex';
                    addExecutorBtn.style.display = 'none';
                }
                
                renderConfiguringConfirmerList();
                if (addConfirmerBtn) addConfirmerBtn.style.display = 'flex';
                
                actionButtons.innerHTML = '';
                
                if (roleSwitcher) roleSwitcher.style.display = 'none';
                if (configuringRoleSwitcher) configuringRoleSwitcher.style.display = 'flex';
            } else {
                executorList.style.display = 'flex';
                executorItem.style.display = 'flex';
                noExecutorView.style.display = 'none';
                addExecutorBtn.style.display = 'none';
                
                renderConfiguringConfirmerList();
                if (addConfirmerBtn) addConfirmerBtn.style.display = 'none';
                
                if (confirmProgress) confirmProgress.innerHTML = '任务正在配置中，请等待配置完成';
                if (actionButtons) actionButtons.innerHTML = `
                    <div class="btn secondary" style="width: 100%;">任务配置中</div>
                `;
                
                if (roleSwitcher) roleSwitcher.style.display = 'none';
                if (configuringRoleSwitcher) configuringRoleSwitcher.style.display = 'flex';
            }
            
            if (acceptanceProgress) acceptanceProgress.style.display = 'none';
            
            if (flowStep1) {
                flowStep1.className = 'flow-step current';
                const stepIcon1 = flowStep1.querySelector('.step-icon');
                const stepLabel1 = flowStep1.querySelector('.step-label');
                if (stepIcon1) stepIcon1.textContent = '⏸';
                if (stepLabel1) stepLabel1.textContent = '待开始';
            }
            if (flowStep2) {
                const stepIcon2 = flowStep2.querySelector('.step-icon');
                const stepLabel2 = flowStep2.querySelector('.step-label');
                if (stepIcon2) stepIcon2.textContent = '▶';
                if (stepLabel2) stepLabel2.textContent = '执行中';
            }
            if (flowStep3) {
                const stepIcon3 = flowStep3.querySelector('.step-icon');
                const stepLabel3 = flowStep3.querySelector('.step-label');
                if (stepIcon3) stepIcon3.textContent = '⏳';
                if (stepLabel3) stepLabel3.textContent = '确认中';
            }
            if (flowStep4) {
                const stepIcon4 = flowStep4.querySelector('.step-icon');
                const stepLabel4 = flowStep4.querySelector('.step-label');
                if (stepIcon4) stepIcon4.textContent = '✓';
                if (stepLabel4) stepLabel4.textContent = '已完成';
            }
            
            if (flowProgressText) flowProgressText.textContent = '任务配置中';
            if (flowProgressBar) flowProgressBar.style.width = '0%';
            
        } else if (status === TaskStatus.PENDING) {
            if (header) header.className = 'task-header-card';
            if (statusBadge) statusBadge.textContent = '待开始';
            if (confirmProgress) confirmProgress.textContent = '等待执行人执行';
            
            const roleSwitcher = document.getElementById('roleSwitcher');
            const configuringRoleSwitcher = document.getElementById('configuringRoleSwitcher');
            if (roleSwitcher) roleSwitcher.style.display = 'block';
            if (configuringRoleSwitcher) configuringRoleSwitcher.style.display = 'none';
            
            if (executionRecordCard) executionRecordCard.style.display = 'none';
            if (confirmRecordCard) confirmRecordCard.style.display = 'none';
            
            const executorList = document.getElementById('executorList');
            const executorItem = document.getElementById('executorItem');
            const noExecutorView = document.getElementById('noExecutorView');
            const addExecutorBtn = document.getElementById('addExecutorBtn');
            
            executorList.style.display = 'flex';
            executorItem.style.display = 'flex';
            noExecutorView.style.display = 'none';
            
            if (currentUserRole === 'configurer') {
                addExecutorBtn.style.display = 'flex';
                addExecutorBtn.innerHTML = '<span class="edit-icon">✎</span> 修改执行人';
                addExecutorBtn.onclick = function() { showExecutorSelector(true); };
                
                renderConfiguringConfirmerList();
                if (addConfirmerBtn) addConfirmerBtn.style.display = 'flex';
                
                if (actionButtons) actionButtons.innerHTML = '';
            } else {
                addExecutorBtn.style.display = 'none';
                
                renderConfirmerList();
                if (addConfirmerBtn) addConfirmerBtn.style.display = 'none';
                
                if (currentUserRole === 'executor') {
                    var fixedBar=document.getElementById('fixedUploadBar');if(fixedBar)fixedBar.style.display='block'; var fixedBar = document.getElementById('fixedUploadBar'); if (fixedBar) fixedBar.style.display = 'block';
                    const hasConfirmers = currentConfirmers.length > 0;
                    const submitBtnText = hasConfirmers ? '提交确认' : '完成任务';
                    // 未上传执行记录时，「提交确认 / 完成任务」按钮置灰且不可点击
                    const canSubmit = executionRecordsList.length > 0;
                    if (actionButtons) actionButtons.innerHTML = `
                        <div class="btn secondary" onclick="showUploadRecordModal()">上传记录</div>
                        ${canSubmit
                            ? `<div class="btn primary" onclick="showSubmitConfirmModal()">${submitBtnText}</div>`
                            : `<div class="btn primary disabled" style="opacity:0.5;cursor:not-allowed;" title="请先上传执行记录，再提交确认 / 完成任务">${submitBtnText}</div>`}
                    `;
                } else if (currentUserRole === 'confirmer') {
                    if (actionButtons) actionButtons.innerHTML = `
                        <div class="btn secondary" style="width: 100%;">等待执行人执行</div>
                    `;
                } else {
                    if (actionButtons) actionButtons.innerHTML = `
                        <div class="btn secondary" style="width: 100%;">等待执行人执行</div>
                    `;
                }
            }
            
            if (acceptanceProgress) acceptanceProgress.style.display = 'none';
            
            if (flowStep1) {
                flowStep1.className = 'flow-step current';
                const stepIcon1 = flowStep1.querySelector('.step-icon');
                const stepLabel1 = flowStep1.querySelector('.step-label');
                if (stepIcon1) stepIcon1.textContent = '⏸';
                if (stepLabel1) stepLabel1.textContent = '待开始';
            }
            if (flowStep2) {
                const stepIcon2 = flowStep2.querySelector('.step-icon');
                const stepLabel2 = flowStep2.querySelector('.step-label');
                if (stepIcon2) stepIcon2.textContent = '▶';
                if (stepLabel2) stepLabel2.textContent = '执行中';
            }
            if (flowStep3) {
                const stepIcon3 = flowStep3.querySelector('.step-icon');
                const stepLabel3 = flowStep3.querySelector('.step-label');
                if (stepIcon3) stepIcon3.textContent = '⏳';
                if (stepLabel3) stepLabel3.textContent = '确认中';
            }
            if (flowStep4) {
                const stepIcon4 = flowStep4.querySelector('.step-icon');
                const stepLabel4 = flowStep4.querySelector('.step-label');
                if (stepIcon4) stepIcon4.textContent = '✓';
                if (stepLabel4) stepLabel4.textContent = '已完成';
            }
            
            if (flowProgressText) flowProgressText.textContent = '等待执行';
            if (flowProgressBar) flowProgressBar.style.width = '0%';
            
        } else if (status === TaskStatus.PENDING_BLOCKED) {
            if (header) header.className = 'task-header-card';
            if (statusBadge) statusBadge.textContent = '待开始';
            if (confirmProgress) confirmProgress.textContent = '等待前置任务完成';
            
            const roleSwitcher = document.getElementById('roleSwitcher');
            const configuringRoleSwitcher = document.getElementById('configuringRoleSwitcher');
            if (roleSwitcher) roleSwitcher.style.display = 'block';
            if (configuringRoleSwitcher) configuringRoleSwitcher.style.display = 'none';
            
            const preTaskBlockCard = document.getElementById('preTaskBlockCard');
            if (preTaskBlockCard) preTaskBlockCard.style.display = 'block';

            const preTaskBlockTip = document.getElementById('preTaskBlockTip');
            if (preTaskBlockTip) {
                preTaskBlockTip.textContent = currentUserRole === 'executor'
                    ? '💡 完成后将自动通知您'
                    : '💡 完成后将自动通知执行人';
            }
            
            if (executionRecordCard) executionRecordCard.style.display = 'none';
            if (confirmRecordCard) confirmRecordCard.style.display = 'none';
            
            const executorList = document.getElementById('executorList');
            const executorItem = document.getElementById('executorItem');
            const noExecutorView = document.getElementById('noExecutorView');
            const addExecutorBtn = document.getElementById('addExecutorBtn');
            
            executorList.style.display = 'flex';
            executorItem.style.display = 'flex';
            noExecutorView.style.display = 'none';

            if (currentUserRole === 'configurer') {
                addExecutorBtn.style.display = 'flex';
                addExecutorBtn.innerHTML = '<span class="edit-icon">✎</span> 修改执行人';
                addExecutorBtn.onclick = function() { showExecutorSelector(true); };
                renderConfiguringConfirmerList();
                if (addConfirmerBtn) addConfirmerBtn.style.display = 'flex';
            } else {
                addExecutorBtn.style.display = 'none';
                renderConfirmerList();
                if (addConfirmerBtn) addConfirmerBtn.style.display = 'none';
            }
            
            if (currentUserRole === 'executor') {
                    var fixedBar=document.getElementById('fixedUploadBar');if(fixedBar)fixedBar.style.display='block'; var fixedBar = document.getElementById('fixedUploadBar'); if (fixedBar) fixedBar.style.display = 'block';
                if (actionButtons) actionButtons.innerHTML = `
                    <div class="btn secondary disabled" style="width: 100%; opacity: 0.6; cursor: not-allowed;">
                        <span style="margin-right: 6px;">🔒</span> 前置任务未完成
                    </div>
                `;
            } else if (currentUserRole === 'configurer') {
                if (actionButtons) actionButtons.innerHTML = `
                    <div class="btn secondary" style="width: 100%;">等待执行人执行</div>
                `;
            } else {
                if (actionButtons) actionButtons.innerHTML = `
                    <div class="btn secondary" style="width: 100%;">等待执行人执行</div>
                `;
            }
            
            if (acceptanceProgress) acceptanceProgress.style.display = 'none';
            
            if (flowStep1) {
                flowStep1.className = 'flow-step current';
                const stepIcon1 = flowStep1.querySelector('.step-icon');
                const stepLabel1 = flowStep1.querySelector('.step-label');
                if (stepIcon1) stepIcon1.textContent = '⏸';
                if (stepLabel1) stepLabel1.textContent = '待开始';
            }
            if (flowStep2) {
                const stepIcon2 = flowStep2.querySelector('.step-icon');
                const stepLabel2 = flowStep2.querySelector('.step-label');
                if (stepIcon2) stepIcon2.textContent = '▶';
                if (stepLabel2) stepLabel2.textContent = '执行中';
            }
            if (flowStep3) {
                const stepIcon3 = flowStep3.querySelector('.step-icon');
                const stepLabel3 = flowStep3.querySelector('.step-label');
                if (stepIcon3) stepIcon3.textContent = '⏳';
                if (stepLabel3) stepLabel3.textContent = '确认中';
            }
            if (flowStep4) {
                const stepIcon4 = flowStep4.querySelector('.step-icon');
                const stepLabel4 = flowStep4.querySelector('.step-label');
                if (stepIcon4) stepIcon4.textContent = '✓';
                if (stepLabel4) stepLabel4.textContent = '已完成';
            }
            
            if (flowProgressText) flowProgressText.textContent = '前置任务阻塞中';
            if (flowProgressBar) flowProgressBar.style.width = '0%';
            
        } else if (status === TaskStatus.IN_PROGRESS) {
            if (header) header.className = 'task-header-card in-progress';
            if (statusBadge) statusBadge.textContent = '执行中';
            if (confirmProgress) confirmProgress.textContent = '执行人正在执行任务';
            
            const roleSwitcher = document.getElementById('roleSwitcher');
            const configuringRoleSwitcher = document.getElementById('configuringRoleSwitcher');
            if (roleSwitcher) roleSwitcher.style.display = 'block';
            if (configuringRoleSwitcher) configuringRoleSwitcher.style.display = 'none';
            
            if (executionRecordCard) executionRecordCard.style.display = 'block';
            if (confirmRecordCard) confirmRecordCard.style.display = 'none';
            
            const currentExecution = document.getElementById('currentExecution');
            const historyRecords = document.getElementById('historyRecords');
            const moreBtn = document.querySelector('#executionRecordCard .more');
            
            if (currentExecution) {
                if (executionRecordsList.length > 0) {
                    updateExecutionRecordDisplay();
                } else {
                    currentExecution.innerHTML = `
                        <div class="section-title">
                            <span>📤 执行人上传的内容</span>
                            ${currentUserRole === 'executor' ? '<span class="edit-btn" onclick="showUploadRecordModal()" style="font-size: 12px; color: var(--primary-color); cursor: pointer;">✎ 上传</span>' : ''}
                        </div>
                        <div style="text-align: center; padding: 20px; color: var(--text-tertiary);">
                            暂无执行记录，请点击上传
                        </div>
                    `;
                }
            }
            
            if (historyRecords) {
                historyRecords.style.display = 'none';
            }
            
            if (moreBtn) {
                moreBtn.style.display = 'none';
            }
            
            const executorList = document.getElementById('executorList');
            const executorItem = document.getElementById('executorItem');
            const noExecutorView = document.getElementById('noExecutorView');
            const addExecutorBtn = document.getElementById('addExecutorBtn');
            
            executorList.style.display = 'flex';
            executorItem.style.display = 'flex';
            noExecutorView.style.display = 'none';
            addExecutorBtn.style.display = 'none';
            
            if (currentUserRole === 'configurer') {
                renderConfiguringConfirmerList();
                if (addConfirmerBtn) addConfirmerBtn.style.display = 'flex';
            } else {
                renderConfirmerList();
                if (addConfirmerBtn) addConfirmerBtn.style.display = 'none';
                
                document.querySelectorAll('.confirmer-status-item .delete-btn').forEach(btn => {
                    btn.style.display = 'none';
                });
            }
            
            if (currentUserRole === 'executor') {
                    var fixedBar=document.getElementById('fixedUploadBar');if(fixedBar)fixedBar.style.display='block'; var fixedBar = document.getElementById('fixedUploadBar'); if (fixedBar) fixedBar.style.display = 'block';
                const hasConfirmers = currentConfirmers.length > 0;
                const submitBtnText = hasConfirmers ? '提交确认' : '完成任务';
                if (actionButtons) actionButtons.innerHTML = `
                    <div class="btn secondary" onclick="showUploadRecordModal()">上传记录</div>
                    <div class="btn primary" onclick="showSubmitConfirmModal()">${submitBtnText}</div>
                `;
            } else if (currentUserRole === 'confirmer') {
                if (actionButtons) actionButtons.innerHTML = `
                    <div class="btn secondary" style="width: 100%;">执行人正在执行中...</div>
                `;
            } else if (currentUserRole === 'configurer') {
                if (actionButtons) actionButtons.innerHTML = `
                    <div class="btn secondary" style="width: 100%;">执行人正在执行中...</div>
                `;
            } else {
                if (actionButtons) actionButtons.innerHTML = `
                    <div class="btn secondary" style="width: 100%;">执行人正在执行中...</div>
                `;
            }
            
            if (acceptanceProgress) acceptanceProgress.style.display = 'none';
            
            if (flowStep1) {
                flowStep1.className = 'flow-step completed';
                const stepIcon1 = flowStep1.querySelector('.step-icon');
                const stepLabel1 = flowStep1.querySelector('.step-label');
                if (stepIcon1) stepIcon1.textContent = '✓';
                if (stepLabel1) stepLabel1.textContent = '待开始';
            }
            if (flowLine1) flowLine1.className = 'flow-line completed';
            if (flowStep2) {
                flowStep2.className = 'flow-step current';
                const stepIcon2 = flowStep2.querySelector('.step-icon');
                const stepLabel2 = flowStep2.querySelector('.step-label');
                if (stepIcon2) stepIcon2.textContent = '▶';
                if (stepLabel2) stepLabel2.textContent = '执行中';
            }
            if (flowStep3) {
                const stepIcon3 = flowStep3.querySelector('.step-icon');
                const stepLabel3 = flowStep3.querySelector('.step-label');
                if (stepIcon3) stepIcon3.textContent = '⏳';
                if (stepLabel3) stepLabel3.textContent = '确认中';
            }
            if (flowStep4) {
                const stepIcon4 = flowStep4.querySelector('.step-icon');
                const stepLabel4 = flowStep4.querySelector('.step-label');
                if (stepIcon4) stepIcon4.textContent = '✓';
                if (stepLabel4) stepLabel4.textContent = '已完成';
            }
            
            if (flowProgressText) flowProgressText.textContent = '执行中';
            if (flowProgressBar) flowProgressBar.style.width = '25%';
            
        } else if (status === TaskStatus.CONFIRMING) {
            if (header) header.className = 'task-header-card confirming';
            if (statusBadge) statusBadge.textContent = '确认中';
            if (confirmProgress) confirmProgress.textContent = '确认进度：1/3';
            
            if (executionRecordCard) executionRecordCard.style.display = 'block';
            if (confirmRecordCard) confirmRecordCard.style.display = 'block';
            
            const currentExecution = document.getElementById('currentExecution');
            const historyRecords = document.getElementById('historyRecords');
            const moreBtn = document.querySelector('#executionRecordCard .more');
            
            if (executionRecordsList.length > 0) {
                renderExecutionRecordsReadOnly();
            } else {
                if (currentExecution) {
                    currentExecution.innerHTML = `
                        <div class="section-title">
                            <span>📤 执行人提交的内容</span>
                        </div>
                        <div class="media-grid">
                            <div class="media-item">📷</div>
                            <div class="media-item">📷</div>
                            <div class="media-item">📷</div>
                            <div class="media-item" style="background-color: #000;">
                                <span class="play-icon">▶</span>
                                <span class="duration">0:15</span>
                            </div>
                        </div>
                        <div class="execution-desc">
                            穿线工作已完成，共穿设强电线管12根，弱电线管6根。已进行绝缘测试，所有线路绝缘电阻均大于0.5MΩ，符合规范要求。
                        </div>
                        <div style="font-size: 12px; color: var(--text-tertiary); margin-top: 8px;">
                            提交人：李四 · 2024-01-26 10:30
                        </div>
                        <div style="margin-top: 12px; padding: 10px; background-color: #F6FFED; border-radius: 6px; border-left: 3px solid #52C41A;">
                            <div style="font-size: 12px; color: #52C41A; font-weight: 600; margin-bottom: 4px;">✓ 任务已完成</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">执行人已重新提交执行结果，等待确认人确认</div>
                            <div style="font-size: 11px; color: var(--text-tertiary); margin-top: 4px;">操作时间：2024-01-26 10:30 · 操作人：李四</div>
                        </div>
                    `;
                }
            }
            
            if (historyRecords) {
                historyRecords.style.display = 'none';
            }
            
            if (moreBtn) {
                moreBtn.style.display = 'none';
            }
            
            confirmerList.innerHTML = `
                <div class="confirmer-status-item">
                    <div class="avatar">张</div>
                    <div class="info">
                        <div class="name">张三 · 项目总</div>
                        <div class="time">2024-01-15 14:30 已确认</div>
                    </div>
                    <div class="status confirmed">已确认</div>
                </div>
                <div class="confirmer-status-item">
                    <div class="avatar">王</div>
                    <div class="info">
                        <div class="name">王五 · 业主</div>
                        <div class="time">等待确认中...</div>
                    </div>
                    <div class="status pending">待确认</div>
                </div>
                <div class="confirmer-status-item">
                    <div class="avatar">赵</div>
                    <div class="info">
                        <div class="name">赵六 · 设计师</div>
                        <div class="time">等待确认中...</div>
                    </div>
                    <div class="status pending">待确认</div>
                </div>
            `;
            
            const confirmRecordList = confirmRecordCard.querySelector('.confirm-list');
            if (confirmRecordList) {
                confirmRecordList.innerHTML = `
                    <div class="confirm-item">
                        <div class="avatar">张</div>
                        <div class="info">
                            <div class="name-row">
                                <div class="name">张三 <span class="role-badge manager">项目总</span></div>
                                <div class="status-tag confirmed">已确认</div>
                            </div>
                            <div class="time">2024-01-25 15:20</div>
                            <div class="content">穿线工作符合标准，绝缘测试数据合格。</div>
                            <div class="tags">
                                <span class="tag">责任心棒</span>
                                <span class="tag">专业能力强</span>
                            </div>
                            <div class="rating">
                                <span class="star">★</span>
                                <span class="star">★</span>
                                <span class="star">★</span>
                                <span class="star">★</span>
                                <span class="star empty">★</span>
                                <span class="text">优秀</span>
                            </div>
                        </div>
                    </div>
                    <div class="confirm-item">
                        <div class="avatar">王</div>
                        <div class="info">
                            <div class="name-row">
                                <div class="name">王五 <span class="role-badge owner">业主</span></div>
                                <div class="status-tag pending">待确认</div>
                            </div>
                            <div class="time">等待确认中...</div>
                        </div>
                    </div>
                    <div class="confirm-item">
                        <div class="avatar">赵</div>
                        <div class="info">
                            <div class="name-row">
                                <div class="name">赵六 <span class="role-badge designer">设计师</span></div>
                                <div class="status-tag pending">待确认</div>
                            </div>
                            <div class="time">等待确认中...</div>
                        </div>
                    </div>
                `;
            }
            
            if (currentUserRole === 'confirmer') {
                if (actionButtons) actionButtons.innerHTML = `
                    <div class="btn secondary" onclick="showRejectModal()">驳回</div>
                    <div class="btn success" onclick="showConfirmModal()">确认通过</div>
                `;
            } else {
                if (actionButtons) actionButtons.innerHTML = `
                    <div class="btn secondary" style="width: 100%;">等待确认人确认</div>
                `;
            }
            if (addConfirmerBtn) addConfirmerBtn.style.display = 'none';
            
            if (acceptanceProgress) acceptanceProgress.style.display = 'block';
            
            const executorList = document.getElementById('executorList');
            const executorItem = document.getElementById('executorItem');
            const noExecutorView = document.getElementById('noExecutorView');
            const addExecutorBtn = document.getElementById('addExecutorBtn');
            
            executorList.style.display = 'flex';
            executorItem.style.display = 'flex';
            noExecutorView.style.display = 'none';
            addExecutorBtn.style.display = 'none';
            
            flowStep1.className = 'flow-step completed';
            flowStep1.querySelector('.step-icon').textContent = '✓';
            flowStep1.querySelector('.step-label').textContent = '待开始';
            flowLine1.className = 'flow-line completed';
            flowStep2.className = 'flow-step completed';
            flowStep2.querySelector('.step-icon').textContent = '✓';
            flowStep2.querySelector('.step-label').textContent = '执行中';
            flowLine2.className = 'flow-line completed';
            flowStep3.className = 'flow-step current';
            flowStep3.querySelector('.step-icon').textContent = '⏳';
            flowStep3.querySelector('.step-label').textContent = '确认中';
            flowStep4.querySelector('.step-icon').textContent = '✓';
            flowStep4.querySelector('.step-label').textContent = '已完成';
            
            if (flowProgressText) flowProgressText.textContent = '1/3 已确认';
            if (flowProgressBar) flowProgressBar.style.width = '50%';
            
            const roleSwitcher3 = document.getElementById('roleSwitcher');
            if (roleSwitcher3) roleSwitcher3.style.display = 'block';
            
        } else if (status === TaskStatus.CONFIRMING_AFTER_REJECT) {
            if (header) header.className = 'task-header-card confirming';
            if (statusBadge) statusBadge.textContent = '确认中';
            if (confirmProgress) confirmProgress.textContent = '确认进度：1/3';
            
            if (executionRecordCard) executionRecordCard.style.display = 'block';
            if (confirmRecordCard) confirmRecordCard.style.display = 'block';
            
            const currentExecution = document.getElementById('currentExecution');
            const historyRecords = document.getElementById('historyRecords');
            const moreBtn = document.querySelector('#executionRecordCard .more');
            
            if (executionRecordsList.length > 0) {
                renderExecutionRecordsReadOnly();
            } else {
                if (currentExecution) {
                    currentExecution.innerHTML = `
                        <div class="section-title">
                            <span>📤 执行人提交的内容</span>
                        </div>
                        <div class="media-grid">
                            <div class="media-item">📷</div>
                            <div class="media-item">📷</div>
                            <div class="media-item">📷</div>
                            <div class="media-item" style="background-color: #000;">
                                <span class="play-icon">▶</span>
                                <span class="duration">0:15</span>
                            </div>
                        </div>
                        <div class="execution-desc">
                            穿线工作已完成，共穿设强电线管12根，弱电线管6根。已进行绝缘测试，所有线路绝缘电阻均大于0.5MΩ，符合规范要求。
                        </div>
                        <div style="font-size: 12px; color: var(--text-tertiary); margin-top: 8px;">
                            提交人：李四 · 2024-01-26 10:30
                        </div>
                        <div style="margin-top: 12px; padding: 10px; background-color: #F6FFED; border-radius: 6px; border-left: 3px solid #52C41A;">
                            <div style="font-size: 12px; color: #52C41A; font-weight: 600; margin-bottom: 4px;">✓ 任务已完成</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">执行人已重新提交执行结果，等待确认人确认</div>
                            <div style="font-size: 11px; color: var(--text-tertiary); margin-top: 4px;">操作时间：2024-01-26 10:30 · 操作人：李四</div>
                        </div>
                    `;
                }
            }
            
            if (historyRecords) {
                historyRecords.style.display = 'block';
                historyRecords.innerHTML = `
                    <div class="execution-section" style="opacity: 0.6; background-color: var(--bg-tertiary);">
                        <div class="section-title">
                            <span>📤 第1次执行</span>
                            <span class="status-tag rejected" style="margin-left: 8px;">已驳回</span>
                        </div>
                        <div class="media-grid">
                            <div class="media-item">📷</div>
                            <div class="media-item">📷</div>
                            <div class="media-item">📷</div>
                            <div class="media-item" style="background-color: #000;">
                                <span class="play-icon">▶</span>
                                <span class="duration">0:15</span>
                            </div>
                        </div>
                        <div class="execution-desc">
                            穿线工作已完成，共穿设强电线管12根，弱电线管6根。已进行绝缘测试，所有线路绝缘电阻均大于0.5MΩ，符合规范要求。
                        </div>
                        <div style="font-size: 12px; color: var(--text-tertiary); margin-top: 8px;">
                            提交人：李四 · 2024-01-25 14:30
                        </div>
                        <div style="margin-top: 12px; padding: 10px; background-color: #F6FFED; border-radius: 6px; border-left: 3px solid #52C41A;">
                            <div style="font-size: 12px; color: #52C41A; font-weight: 600; margin-bottom: 4px;">✓ 任务已完成</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">执行人已提交执行结果，等待确认人确认</div>
                            <div style="font-size: 11px; color: var(--text-tertiary); margin-top: 4px;">操作时间：2024-01-25 14:30 · 操作人：李四</div>
                        </div>
                        <div style="margin-top: 8px; padding: 8px; background-color: #FFF1F0; border-radius: 6px; border-left: 3px solid var(--error-color);">
                            <div style="font-size: 12px; color: var(--error-color); font-weight: 600; margin-bottom: 4px;">驳回原因：</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">部分线路走向与设计图纸不符，请调整后重新提交。</div>
                            <div style="font-size: 11px; color: var(--text-tertiary); margin-top: 4px;">驳回人：王五 · 2024-01-25 16:00</div>
                        </div>
                    </div>
                `;
            }
            
            if (moreBtn) {
                moreBtn.style.display = 'none';
            }
            
            confirmerList.innerHTML = `
                <div class="confirmer-status-item">
                    <div class="avatar">张</div>
                    <div class="info">
                        <div class="name">张三 · 项目总</div>
                        <div class="time">2024-01-26 11:00 已确认</div>
                    </div>
                    <div class="status confirmed">已确认</div>
                </div>
                <div class="confirmer-status-item">
                    <div class="avatar">王</div>
                    <div class="info">
                        <div class="name">王五 · 业主</div>
                        <div class="time">等待确认中...</div>
                    </div>
                    <div class="status pending">待确认</div>
                </div>
                <div class="confirmer-status-item">
                    <div class="avatar">赵</div>
                    <div class="info">
                        <div class="name">赵六 · 设计师</div>
                        <div class="time">等待确认中...</div>
                    </div>
                    <div class="status pending">待确认</div>
                </div>
            `;
            
            const confirmRecordList = confirmRecordCard.querySelector('.confirm-list');
            if (confirmRecordList) {
                confirmRecordList.innerHTML = `
                    <div style="font-size: 12px; color: var(--text-tertiary); padding: 8px 0; border-bottom: 1px solid var(--border-color); margin-bottom: 8px;">
                        第2轮确认记录
                    </div>
                    <div class="confirm-item">
                        <div class="avatar">张</div>
                        <div class="info">
                            <div class="name-row">
                                <div class="name">张三 <span class="role-badge manager">项目总</span></div>
                                <div class="status-tag confirmed">已确认</div>
                            </div>
                            <div class="time">2024-01-26 11:00</div>
                            <div class="content">调整后的线路走向符合设计要求，确认通过。</div>
                            <div class="tags">
                                <span class="tag">责任心棒</span>
                                <span class="tag">服务态度好</span>
                            </div>
                            <div class="rating">
                                <span class="star">★</span>
                                <span class="star">★</span>
                                <span class="star">★</span>
                                <span class="star">★</span>
                                <span class="star">★</span>
                                <span class="text">非常满意</span>
                            </div>
                        </div>
                    </div>
                    <div class="confirm-item">
                        <div class="avatar">王</div>
                        <div class="info">
                            <div class="name-row">
                                <div class="name">王五 <span class="role-badge owner">业主</span></div>
                                <div class="status-tag pending">待确认</div>
                            </div>
                            <div class="time">等待确认中...</div>
                        </div>
                    </div>
                    <div class="confirm-item">
                        <div class="avatar">赵</div>
                        <div class="info">
                            <div class="name-row">
                                <div class="name">赵六 <span class="role-badge designer">设计师</span></div>
                                <div class="status-tag pending">待确认</div>
                            </div>
                            <div class="time">等待确认中...</div>
                        </div>
                    </div>
                    <div style="font-size: 12px; color: var(--text-tertiary); padding: 8px 0; border-bottom: 1px solid var(--border-color); margin: 16px 0 8px 0;">
                        第1轮确认记录
                    </div>
                    <div class="confirm-item" style="opacity: 0.6;">
                        <div class="avatar">张</div>
                        <div class="info">
                            <div class="name-row">
                                <div class="name">张三 <span class="role-badge manager">项目总</span></div>
                                <div class="status-tag confirmed">已确认</div>
                            </div>
                            <div class="time">2024-01-25 15:20</div>
                            <div class="content">穿线工作符合标准，绝缘测试数据合格。</div>
                        </div>
                    </div>
                    <div class="confirm-item" style="opacity: 0.6;">
                        <div class="avatar">王</div>
                        <div class="info">
                            <div class="name-row">
                                <div class="name">王五 <span class="role-badge owner">业主</span></div>
                                <div class="status-tag rejected">已驳回</div>
                            </div>
                            <div class="time">2024-01-25 16:00</div>
                            <div class="content">部分线路走向与设计图纸不符，请调整后重新提交。</div>
                        </div>
                    </div>
                `;
            }
            
            if (currentUserRole === 'confirmer') {
                if (actionButtons) actionButtons.innerHTML = `
                    <div class="btn secondary" onclick="showRejectModal()">驳回</div>
                    <div class="btn success" onclick="showConfirmModal()">确认通过</div>
                `;
            } else {
                if (actionButtons) actionButtons.innerHTML = `
                    <div class="btn secondary" style="width: 100%;">等待确认人确认</div>
                `;
            }
            if (addConfirmerBtn) addConfirmerBtn.style.display = 'none';
            
            if (acceptanceProgress) acceptanceProgress.style.display = 'block';
            
            const executorList = document.getElementById('executorList');
            const executorItem = document.getElementById('executorItem');
            const noExecutorView = document.getElementById('noExecutorView');
            const addExecutorBtn = document.getElementById('addExecutorBtn');
            
            executorList.style.display = 'flex';
            executorItem.style.display = 'flex';
            noExecutorView.style.display = 'none';
            addExecutorBtn.style.display = 'none';
            
            flowStep1.className = 'flow-step completed';
            flowStep1.querySelector('.step-icon').textContent = '✓';
            flowStep1.querySelector('.step-label').textContent = '待开始';
            flowLine1.className = 'flow-line completed';
            flowStep2.className = 'flow-step completed';
            flowStep2.querySelector('.step-icon').textContent = '✓';
            flowStep2.querySelector('.step-label').textContent = '执行中';
            flowLine2.className = 'flow-line completed';
            flowStep3.className = 'flow-step current';
            flowStep3.querySelector('.step-icon').textContent = '⏳';
            flowStep3.querySelector('.step-label').textContent = '确认中';
            flowStep4.querySelector('.step-icon').textContent = '✓';
            flowStep4.querySelector('.step-label').textContent = '已完成';
            
            if (flowProgressText) flowProgressText.textContent = '1/3 已确认';
            if (flowProgressBar) flowProgressBar.style.width = '50%';
            
            const roleSwitcher4 = document.getElementById('roleSwitcher');
            if (roleSwitcher4) roleSwitcher4.style.display = 'block';
            
        } else if (status === TaskStatus.COMPLETED) {
            if (header) header.className = 'task-header-card completed';
            if (statusBadge) statusBadge.textContent = '已完成';
            if (confirmProgress) confirmProgress.textContent = '全部确认人已确认';
            
            if (executionRecordCard) executionRecordCard.style.display = 'block';
            if (confirmRecordCard) confirmRecordCard.style.display = 'block';
            
            const currentExecution = document.getElementById('currentExecution');
            const historyRecords = document.getElementById('historyRecords');
            const moreBtn = document.querySelector('#executionRecordCard .more');
            
            if (executionRecordsList.length > 0) {
                renderExecutionRecordsReadOnly();
            } else {
                if (currentExecution) {
                    currentExecution.innerHTML = `
                        <div class="section-title">
                            <span>📤 执行人提交的内容</span>
                        </div>
                        <div class="media-grid">
                            <div class="media-item">📷</div>
                            <div class="media-item">📷</div>
                            <div class="media-item">📷</div>
                            <div class="media-item" style="background-color: #000;">
                                <span class="play-icon">▶</span>
                                <span class="duration">0:15</span>
                            </div>
                        </div>
                        <div class="execution-desc">
                            穿线工作已完成，共穿设强电线管12根，弱电线管6根。已进行绝缘测试，所有线路绝缘电阻均大于0.5MΩ，符合规范要求。
                        </div>
                        <div style="font-size: 12px; color: var(--text-tertiary); margin-top: 8px;">
                            提交人：李四 · 2024-01-25 14:30
                        </div>
                        <div style="margin-top: 12px; padding: 10px; background-color: #F6FFED; border-radius: 6px; border-left: 3px solid #52C41A;">
                            <div style="font-size: 12px; color: #52C41A; font-weight: 600; margin-bottom: 4px;">✓ 任务已完成</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">执行人已提交执行结果，等待确认人确认</div>
                            <div style="font-size: 11px; color: var(--text-tertiary); margin-top: 4px;">操作时间：2024-01-25 14:30 · 操作人：李四</div>
                        </div>
                    `;
                }
            }
            
            if (historyRecords) {
                historyRecords.style.display = 'none';
            }
            
            if (moreBtn) {
                moreBtn.style.display = 'none';
            }
            
            confirmerList.innerHTML = `
                <div class="confirmer-status-item">
                    <div class="avatar">张</div>
                    <div class="info">
                        <div class="name">张三 · 项目总</div>
                        <div class="time">2024-01-25 15:20 已确认</div>
                    </div>
                    <div class="status confirmed">已确认</div>
                </div>
                <div class="confirmer-status-item">
                    <div class="avatar">王</div>
                    <div class="info">
                        <div class="name">王五 · 业主</div>
                        <div class="time">2024-01-25 16:30 已确认</div>
                    </div>
                    <div class="status confirmed">已确认</div>
                </div>
                <div class="confirmer-status-item">
                    <div class="avatar">赵</div>
                    <div class="info">
                        <div class="name">赵六 · 设计师</div>
                        <div class="time">2024-01-25 17:00 已确认</div>
                    </div>
                    <div class="status confirmed">已确认</div>
                </div>
            `;
            
            const confirmRecordList = confirmRecordCard.querySelector('.confirm-list');
            if (confirmRecordList) {
                const isConfirmer = currentUserRole === 'confirmer';
                confirmRecordList.innerHTML = `
                    <div class="confirm-item">
                        <div class="avatar">张</div>
                        <div class="info">
                            <div class="name-row">
                                <div class="name">张三 <span class="role-badge manager">项目总</span></div>
                                <div class="status-tag confirmed">已确认</div>
                            </div>
                            <div class="time">2024-01-25 15:20</div>
                            <div class="content">穿线工作符合标准，绝缘测试数据合格。</div>
                            <div class="media-row">
                                <div class="media-thumb">📷</div>
                            </div>
                            <div class="tags">
                                <span class="tag">责任心棒</span>
                                <span class="tag">专业能力强</span>
                                <span class="tag">服务态度好</span>
                            </div>
                            <div class="rating">
                                <span class="star">★</span>
                                <span class="star">★</span>
                                <span class="star">★</span>
                                <span class="star">★</span>
                                <span class="star empty">★</span>
                                <span class="text">优秀</span>
                            </div>
                        </div>
                    </div>
                    <div class="confirm-item">
                        <div class="avatar">王</div>
                        <div class="info">
                            <div class="name-row">
                                <div class="name">王五 <span class="role-badge owner">业主</span></div>
                                <div class="status-tag confirmed">已确认</div>
                            </div>
                            <div class="time">2024-01-25 16:30</div>
                            <div class="content">施工质量满意，确认通过。</div>
                            <div style="margin-top: 8px; font-size: 12px; color: var(--text-tertiary);">
                                暂未评价${isConfirmer ? '<span class="go-evaluate-btn" onclick="showEvaluationModal(\'王五\')">去评价</span>' : ''}
                            </div>
                        </div>
                    </div>
                    <div class="confirm-item">
                        <div class="avatar">赵</div>
                        <div class="info">
                            <div class="name-row">
                                <div class="name">赵六 <span class="role-badge designer">设计师</span></div>
                                <div class="status-tag confirmed">已确认</div>
                            </div>
                            <div class="time">2024-01-25 17:00</div>
                            <div class="content">符合设计要求，确认。</div>
                            <div class="rating">
                                <span class="star">★</span>
                                <span class="star">★</span>
                                <span class="star">★</span>
                                <span class="star">★</span>
                                <span class="star">★</span>
                                <span class="text">优秀</span>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            if (actionButtons) actionButtons.innerHTML = `
                <div class="btn secondary" onclick="goToTaskReport()">查看报告单</div>
                <div class="btn primary" onclick="showEvaluationListModal()">查看评价</div>
            `;
            if (addConfirmerBtn) addConfirmerBtn.style.display = 'none';
            
            const executorList = document.getElementById('executorList');
            const executorItem = document.getElementById('executorItem');
            const noExecutorView = document.getElementById('noExecutorView');
            const addExecutorBtn = document.getElementById('addExecutorBtn');
            
            executorList.style.display = 'flex';
            executorItem.style.display = 'flex';
            noExecutorView.style.display = 'none';
            addExecutorBtn.style.display = 'none';
            
            if (acceptanceProgress) acceptanceProgress.style.display = 'none';
            
            if (flowStep1) {
                flowStep1.className = 'flow-step completed';
                const stepIcon1 = flowStep1.querySelector('.step-icon');
                const stepLabel1 = flowStep1.querySelector('.step-label');
                if (stepIcon1) stepIcon1.textContent = '✓';
                if (stepLabel1) stepLabel1.textContent = '待开始';
            }
            if (flowLine1) flowLine1.className = 'flow-line completed';
            if (flowStep2) {
                flowStep2.className = 'flow-step completed';
                const stepIcon2 = flowStep2.querySelector('.step-icon');
                const stepLabel2 = flowStep2.querySelector('.step-label');
                if (stepIcon2) stepIcon2.textContent = '✓';
                if (stepLabel2) stepLabel2.textContent = '执行中';
            }
            if (flowLine2) flowLine2.className = 'flow-line completed';
            if (flowStep3) {
                flowStep3.className = 'flow-step completed';
                const stepIcon3 = flowStep3.querySelector('.step-icon');
                const stepLabel3 = flowStep3.querySelector('.step-label');
                if (stepIcon3) stepIcon3.textContent = '✓';
                if (stepLabel3) stepLabel3.textContent = '确认中';
            }
            if (flowLine3) flowLine3.className = 'flow-line completed';
            if (flowStep4) {
                flowStep4.className = 'flow-step completed';
                const stepIcon4 = flowStep4.querySelector('.step-icon');
                const stepLabel4 = flowStep4.querySelector('.step-label');
                if (stepIcon4) stepIcon4.textContent = '✓';
                if (stepLabel4) stepLabel4.textContent = '已完成';
            }
            
            if (flowProgressText) flowProgressText.textContent = '已完成';
            if (flowProgressBar) flowProgressBar.style.width = '100%';
            
            const roleSwitcher = document.getElementById('roleSwitcher');
            if (roleSwitcher) roleSwitcher.style.display = 'block';
            
        } else if (status === TaskStatus.COMPLETED_WITH_REJECT) {
            if (header) header.className = 'task-header-card completed';
            if (statusBadge) statusBadge.textContent = '已完成';
            if (confirmProgress) confirmProgress.textContent = '全部确认人已确认';
            
            if (executionRecordCard) executionRecordCard.style.display = 'block';
            if (confirmRecordCard) confirmRecordCard.style.display = 'block';
            
            const currentExecution = document.getElementById('currentExecution');
            const historyRecords = document.getElementById('historyRecords');
            const moreBtn = document.querySelector('#executionRecordCard .more');
            
            if (executionRecordsList.length > 0) {
                renderExecutionRecordsReadOnly();
            } else {
                if (currentExecution) {
                    currentExecution.innerHTML = `
                        <div class="section-title">
                            <span>📤 执行人提交的内容</span>
                        </div>
                        <div class="media-grid">
                            <div class="media-item">📷</div>
                            <div class="media-item">📷</div>
                            <div class="media-item">📷</div>
                            <div class="media-item" style="background-color: #000;">
                                <span class="play-icon">▶</span>
                                <span class="duration">0:15</span>
                            </div>
                        </div>
                        <div class="execution-desc">
                            穿线工作已完成，共穿设强电线管12根，弱电线管6根。已进行绝缘测试，所有线路绝缘电阻均大于0.5MΩ，符合规范要求。
                        </div>
                        <div style="font-size: 12px; color: var(--text-tertiary); margin-top: 8px;">
                            提交人：李四 · 2024-01-26 10:30
                        </div>
                        <div style="margin-top: 12px; padding: 10px; background-color: #F6FFED; border-radius: 6px; border-left: 3px solid #52C41A;">
                            <div style="font-size: 12px; color: #52C41A; font-weight: 600; margin-bottom: 4px;">✓ 任务已完成</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">执行人已重新提交执行结果，等待确认人确认</div>
                            <div style="font-size: 11px; color: var(--text-tertiary); margin-top: 4px;">操作时间：2024-01-26 10:30 · 操作人：李四</div>
                        </div>
                    `;
                }
            }
            
            if (historyRecords) {
                historyRecords.style.display = 'block';
                historyRecords.innerHTML = `
                    <div class="execution-section" style="opacity: 0.6; background-color: var(--bg-tertiary);">
                        <div class="section-title">
                            <span>📤 第1次执行</span>
                            <span class="status-tag rejected" style="margin-left: 8px;">已驳回</span>
                        </div>
                        <div class="media-grid">
                            <div class="media-item">📷</div>
                            <div class="media-item">📷</div>
                            <div class="media-item">📷</div>
                            <div class="media-item" style="background-color: #000;">
                                <span class="play-icon">▶</span>
                                <span class="duration">0:15</span>
                            </div>
                        </div>
                        <div class="execution-desc">
                            穿线工作已完成，共穿设强电线管12根，弱电线管6根。已进行绝缘测试，所有线路绝缘电阻均大于0.5MΩ，符合规范要求。
                        </div>
                        <div style="font-size: 12px; color: var(--text-tertiary); margin-top: 8px;">
                            提交人：李四 · 2024-01-25 14:30
                        </div>
                        <div style="margin-top: 12px; padding: 10px; background-color: #F6FFED; border-radius: 6px; border-left: 3px solid #52C41A;">
                            <div style="font-size: 12px; color: #52C41A; font-weight: 600; margin-bottom: 4px;">✓ 任务已完成</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">执行人已提交执行结果，等待确认人确认</div>
                            <div style="font-size: 11px; color: var(--text-tertiary); margin-top: 4px;">操作时间：2024-01-25 14:30 · 操作人：李四</div>
                        </div>
                        <div style="margin-top: 8px; padding: 8px; background-color: #FFF1F0; border-radius: 6px; border-left: 3px solid var(--error-color);">
                            <div style="font-size: 12px; color: var(--error-color); font-weight: 600; margin-bottom: 4px;">驳回原因：</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">部分线路走向与设计图纸不符，请调整后重新提交。</div>
                            <div style="font-size: 11px; color: var(--text-tertiary); margin-top: 4px;">驳回人：王五 · 2024-01-25 16:00</div>
                        </div>
                    </div>
                `;
            }
            
            if (moreBtn) {
                moreBtn.style.display = 'none';
            }
            
            confirmerList.innerHTML = `
                <div class="confirmer-status-item">
                    <div class="avatar">张</div>
                    <div class="info">
                        <div class="name">张三 · 项目总</div>
                        <div class="time">2024-01-26 11:00 已确认</div>
                    </div>
                    <div class="status confirmed">已确认</div>
                </div>
                <div class="confirmer-status-item">
                    <div class="avatar">王</div>
                    <div class="info">
                        <div class="name">王五 · 业主</div>
                        <div class="time">2024-01-26 14:30 已确认</div>
                    </div>
                    <div class="status confirmed">已确认</div>
                </div>
                <div class="confirmer-status-item">
                    <div class="avatar">赵</div>
                    <div class="info">
                        <div class="name">赵六 · 设计师</div>
                        <div class="time">2024-01-26 15:00 已确认</div>
                    </div>
                    <div class="status confirmed">已确认</div>
                </div>
            `;
            
            const confirmRecordList = confirmRecordCard.querySelector('.confirm-list');
            if (confirmRecordList) {
                const isConfirmer = currentUserRole === 'confirmer';
                confirmRecordList.innerHTML = `
                    <div style="font-size: 12px; color: var(--text-tertiary); padding: 8px 0; border-bottom: 1px solid var(--border-color); margin-bottom: 8px;">
                        第2轮确认记录
                    </div>
                    <div class="confirm-item">
                        <div class="avatar">张</div>
                        <div class="info">
                            <div class="name-row">
                                <div class="name">张三 <span class="role-badge manager">项目总</span></div>
                                <div class="status-tag confirmed">已确认</div>
                            </div>
                            <div class="time">2024-01-26 11:00</div>
                            <div class="content">调整后的线路走向符合设计要求，确认通过。</div>
                            <div class="media-row">
                                <div class="media-thumb">📷</div>
                            </div>
                            <div class="rating">
                                <span class="star">★</span>
                                <span class="star">★</span>
                                <span class="star">★</span>
                                <span class="star">★</span>
                                <span class="star">★</span>
                                <span class="text">优秀</span>
                            </div>
                        </div>
                    </div>
                    <div class="confirm-item">
                        <div class="avatar">王</div>
                        <div class="info">
                            <div class="name-row">
                                <div class="name">王五 <span class="role-badge owner">业主</span></div>
                                <div class="status-tag confirmed">已确认</div>
                            </div>
                            <div class="time">2024-01-26 14:30</div>
                            <div class="content">已按要求调整，满意。</div>
                            <div style="margin-top: 8px; font-size: 12px; color: var(--text-tertiary);">
                                暂未评价${isConfirmer ? '<span class="go-evaluate-btn" onclick="showEvaluationModal(\'王五\')">去评价</span>' : ''}
                            </div>
                        </div>
                    </div>
                    <div class="confirm-item">
                        <div class="avatar">赵</div>
                        <div class="info">
                            <div class="name-row">
                                <div class="name">赵六 <span class="role-badge designer">设计师</span></div>
                                <div class="status-tag confirmed">已确认</div>
                            </div>
                            <div class="time">2024-01-26 15:00</div>
                            <div class="content">线路走向符合设计图纸，确认。</div>
                            <div class="rating">
                                <span class="star">★</span>
                                <span class="star">★</span>
                                <span class="star">★</span>
                                <span class="star">★</span>
                                <span class="star">★</span>
                                <span class="text">优秀</span>
                            </div>
                        </div>
                    </div>
                    <div style="font-size: 12px; color: var(--text-tertiary); padding: 8px 0; border-bottom: 1px solid var(--border-color); margin: 16px 0 8px 0;">
                        第1轮确认记录
                    </div>
                    <div class="confirm-item" style="opacity: 0.6;">
                        <div class="avatar">张</div>
                        <div class="info">
                            <div class="name-row">
                                <div class="name">张三 <span class="role-badge manager">项目总</span></div>
                                <div class="status-tag confirmed">已确认</div>
                            </div>
                            <div class="time">2024-01-25 15:20</div>
                            <div class="content">穿线工作符合标准，绝缘测试数据合格。</div>
                        </div>
                    </div>
                    <div class="confirm-item" style="opacity: 0.6;">
                        <div class="avatar">王</div>
                        <div class="info">
                            <div class="name-row">
                                <div class="name">王五 <span class="role-badge owner">业主</span></div>
                                <div class="status-tag rejected">已驳回</div>
                            </div>
                            <div class="time">2024-01-25 16:00</div>
                            <div class="content">部分线路走向与设计图纸不符，请调整后重新提交。</div>
                        </div>
                    </div>
                `;
            }
            
            if (actionButtons) actionButtons.innerHTML = `
                <div class="btn secondary" onclick="goToTaskReport()">查看报告单</div>
                <div class="btn primary" onclick="showEvaluationListModal()">查看评价</div>
            `;
            if (addConfirmerBtn) addConfirmerBtn.style.display = 'none';
            
            const executorList = document.getElementById('executorList');
            const executorItem = document.getElementById('executorItem');
            const noExecutorView = document.getElementById('noExecutorView');
            const addExecutorBtn = document.getElementById('addExecutorBtn');
            
            executorList.style.display = 'flex';
            executorItem.style.display = 'flex';
            noExecutorView.style.display = 'none';
            addExecutorBtn.style.display = 'none';
            
            if (acceptanceProgress) acceptanceProgress.style.display = 'none';
            
            if (flowStep1) {
                flowStep1.className = 'flow-step completed';
                const stepIcon1 = flowStep1.querySelector('.step-icon');
                const stepLabel1 = flowStep1.querySelector('.step-label');
                if (stepIcon1) stepIcon1.textContent = '✓';
                if (stepLabel1) stepLabel1.textContent = '待开始';
            }
            if (flowLine1) flowLine1.className = 'flow-line completed';
            if (flowStep2) {
                flowStep2.className = 'flow-step completed';
                const stepIcon2 = flowStep2.querySelector('.step-icon');
                const stepLabel2 = flowStep2.querySelector('.step-label');
                if (stepIcon2) stepIcon2.textContent = '✓';
                if (stepLabel2) stepLabel2.textContent = '执行中';
            }
            if (flowLine2) flowLine2.className = 'flow-line completed';
            if (flowStep3) {
                flowStep3.className = 'flow-step completed';
                const stepIcon3 = flowStep3.querySelector('.step-icon');
                const stepLabel3 = flowStep3.querySelector('.step-label');
                if (stepIcon3) stepIcon3.textContent = '✓';
                if (stepLabel3) stepLabel3.textContent = '确认中';
            }
            if (flowLine3) flowLine3.className = 'flow-line completed';
            if (flowStep4) {
                flowStep4.className = 'flow-step completed';
                const stepIcon4 = flowStep4.querySelector('.step-icon');
                const stepLabel4 = flowStep4.querySelector('.step-label');
                if (stepIcon4) stepIcon4.textContent = '✓';
                if (stepLabel4) stepLabel4.textContent = '已完成';
            }
            
            if (flowProgressText) flowProgressText.textContent = '已完成';
            if (flowProgressBar) flowProgressBar.style.width = '100%';
            
            const roleSwitcher2 = document.getElementById('roleSwitcher');
            if (roleSwitcher2) roleSwitcher2.style.display = 'block';
            
        } else if (status === TaskStatus.REJECTED_PENDING) {
            if (header) header.className = 'task-header-card';
            if (statusBadge) statusBadge.textContent = '待开始';
            if (confirmProgress) confirmProgress.textContent = '任务已驳回，请重新执行';
            
            if (executionRecordCard) executionRecordCard.style.display = 'block';
            if (confirmRecordCard) confirmRecordCard.style.display = 'block';
            
            const currentExecution = document.getElementById('currentExecution');
            const historyRecords = document.getElementById('historyRecords');
            const moreBtn = document.querySelector('#executionRecordCard .more');
            
            if (executionRecordsList.length > 0) {
                updateExecutionRecordDisplay();
            } else {
                if (currentExecution) {
                    currentExecution.innerHTML = `
                        <div class="section-title">
                            <span>📤 执行人上传的内容</span>
                            ${currentUserRole === 'executor' ? '<span class="edit-btn" onclick="showUploadRecordModal()" style="font-size: 12px; color: var(--primary-color); cursor: pointer;">✎ 上传</span>' : ''}
                        </div>
                        <div style="text-align: center; padding: 20px; color: var(--text-tertiary);">
                            暂无执行记录，请点击上传
                        </div>
                    `;
                }
            }
            
            if (historyRecords) {
                historyRecords.style.display = 'block';
                historyRecords.innerHTML = `
                    <div class="execution-section" style="opacity: 0.6; background-color: var(--bg-tertiary);">
                        <div class="section-title">
                            <span>📤 第1次执行</span>
                            <span class="status-tag rejected" style="margin-left: 8px;">已驳回</span>
                        </div>
                        <div class="media-grid">
                            <div class="media-item">📷</div>
                            <div class="media-item">📷</div>
                            <div class="media-item">📷</div>
                            <div class="media-item" style="background-color: #000;">
                                <span class="play-icon">▶</span>
                                <span class="duration">0:15</span>
                            </div>
                        </div>
                        <div class="execution-desc">
                            穿线工作已完成，共穿设强电线管12根，弱电线管6根。已进行绝缘测试，所有线路绝缘电阻均大于0.5MΩ，符合规范要求。
                        </div>
                        <div style="font-size: 12px; color: var(--text-tertiary); margin-top: 8px;">
                            提交人：李四 · 2024-01-25 14:30
                        </div>
                        <div style="margin-top: 12px; padding: 10px; background-color: #F6FFED; border-radius: 6px; border-left: 3px solid #52C41A;">
                            <div style="font-size: 12px; color: #52C41A; font-weight: 600; margin-bottom: 4px;">✓ 任务已完成</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">执行人已提交执行结果，等待确认人确认</div>
                            <div style="font-size: 11px; color: var(--text-tertiary); margin-top: 4px;">操作时间：2024-01-25 14:30 · 操作人：李四</div>
                        </div>
                        <div style="margin-top: 8px; padding: 8px; background-color: #FFF1F0; border-radius: 6px; border-left: 3px solid var(--error-color);">
                            <div style="font-size: 12px; color: var(--error-color); font-weight: 600; margin-bottom: 4px;">驳回原因：</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">部分线路走向与设计图纸不符，请调整后重新提交。</div>
                            <div style="font-size: 11px; color: var(--text-tertiary); margin-top: 4px;">驳回人：王五 · 2024-01-25 16:00</div>
                        </div>
                    </div>
                `;
            }
            
            if (moreBtn) {
                moreBtn.style.display = 'none';
            }
            
            confirmerList.innerHTML = `
                <div class="confirmer-status-item">
                    <div class="avatar">张</div>
                    <div class="info">
                        <div class="name">张三 · 项目总</div>
                        <div class="time">2024-01-25 15:20 已确认</div>
                    </div>
                    <div class="status confirmed">已确认</div>
                </div>
                <div class="confirmer-status-item">
                    <div class="avatar">王</div>
                    <div class="info">
                        <div class="name">王五 · 业主</div>
                        <div class="time">2024-01-25 16:00 已驳回</div>
                    </div>
                    <div class="status" style="background-color: #FFF1F0; color: var(--error-color);">已驳回</div>
                </div>
                <div class="confirmer-status-item">
                    <div class="avatar">赵</div>
                    <div class="info">
                        <div class="name">赵六 · 设计师</div>
                    </div>
                    <div class="status pending">待确认</div>
                </div>
            `;
            
            const confirmRecordList = confirmRecordCard.querySelector('.confirm-list');
            if (confirmRecordList) {
                confirmRecordList.innerHTML = `
                    <div class="confirm-item">
                        <div class="avatar">张</div>
                        <div class="info">
                            <div class="name-row">
                                <div class="name">张三 <span class="role-badge manager">项目总</span></div>
                                <div class="status-tag confirmed">已确认</div>
                            </div>
                            <div class="time">2024-01-25 15:20</div>
                            <div class="content">穿线工作符合标准，绝缘测试数据合格。</div>
                        </div>
                    </div>
                    <div class="confirm-item">
                        <div class="avatar">王</div>
                        <div class="info">
                            <div class="name-row">
                                <div class="name">王五 <span class="role-badge owner">业主</span></div>
                                <div class="status-tag rejected">已驳回</div>
                            </div>
                            <div class="time">2024-01-25 16:00</div>
                            <div class="content">部分线路走向与设计图纸不符，请调整后重新提交。</div>
                        </div>
                    </div>
                    <div class="confirm-item">
                        <div class="avatar">赵</div>
                        <div class="info">
                            <div class="name-row">
                                <div class="name">赵六 <span class="role-badge designer">设计师</span></div>
                                <div class="status-tag pending">待确认</div>
                            </div>
                            <div class="time">等待确认中...</div>
                        </div>
                    </div>
                `;
            }
            
            if (currentUserRole === 'executor') {
                    var fixedBar=document.getElementById('fixedUploadBar');if(fixedBar)fixedBar.style.display='block'; var fixedBar = document.getElementById('fixedUploadBar'); if (fixedBar) fixedBar.style.display = 'block';
                const hasConfirmers = currentConfirmers.length > 0;
                const submitBtnText = hasConfirmers ? '重新提交确认' : '完成任务';
                if (actionButtons) actionButtons.innerHTML = `
                    <div class="btn secondary" onclick="showUploadRecordModal()">上传记录</div>
                    <div class="btn primary" onclick="showSubmitConfirmModal()">${submitBtnText}</div>
                `;
            } else {
                if (actionButtons) actionButtons.innerHTML = `
                    <div class="btn secondary" style="width: 100%;">等待执行人重新执行</div>
                `;
            }
            if (addConfirmerBtn) addConfirmerBtn.style.display = 'none';
            
            const executorList = document.getElementById('executorList');
            const executorItem = document.getElementById('executorItem');
            const noExecutorView = document.getElementById('noExecutorView');
            const addExecutorBtn = document.getElementById('addExecutorBtn');
            
            const hasExecutor = true;
            
            if (hasExecutor) {
                executorList.style.display = 'flex';
                executorItem.style.display = 'flex';
                noExecutorView.style.display = 'none';
                addExecutorBtn.style.display = 'none';
            } else {
                executorList.style.display = 'none';
                noExecutorView.style.display = 'flex';
                addExecutorBtn.style.display = 'none';
            }
            
            if (acceptanceProgress) acceptanceProgress.style.display = 'none';
            
            flowStep1.className = 'flow-step current';
            flowStep1.querySelector('.step-icon').textContent = '⏸';
            flowStep1.querySelector('.step-label').textContent = '待开始';
            flowLine1.className = 'flow-line';
            flowStep2.querySelector('.step-icon').textContent = '▶';
            flowStep2.querySelector('.step-label').textContent = '执行中';
            flowLine2.className = 'flow-line';
            flowStep3.querySelector('.step-icon').textContent = '⏳';
            flowStep3.querySelector('.step-label').textContent = '确认中';
            flowLine3.className = 'flow-line';
            flowStep4.querySelector('.step-icon').textContent = '✓';
            flowStep4.querySelector('.step-label').textContent = '已完成';
            
            if (flowProgressText) flowProgressText.textContent = '已驳回';
            if (flowProgressBar) flowProgressBar.style.width = '0%';
            
            const roleSwitcher5 = document.getElementById('roleSwitcher');
            if (roleSwitcher5) roleSwitcher5.style.display = 'block';
        }
        
        document.querySelectorAll('.status-switch-item').forEach(item => {
            const text = item.textContent.trim();
            if ((status === TaskStatus.CONFIGURING && text === '待配置') ||
                (status === TaskStatus.PENDING && text === '待开始') ||
                (status === TaskStatus.IN_PROGRESS && text === '执行中') ||
                (status === TaskStatus.CONFIRMING && text === '确认中') ||
                (status === TaskStatus.CONFIRMING_AFTER_REJECT && text === '确认中（被驳回后）') ||
                (status === TaskStatus.REJECTED_PENDING && text === '驳回后待开始') ||
                (status === TaskStatus.COMPLETED && text === '已完成') ||
                (status === TaskStatus.COMPLETED_WITH_REJECT && text === '已完成（含驳回）')) {
                item.classList.add('active');
            }
        });

        // 按状态/端显隐「配置人视角」导航项（仅隐藏，不删除 DOM；其他状态/页面保留该视角）
        const roleSwitcherEl = document.getElementById('roleSwitcher');
        if (roleSwitcherEl) {
            roleSwitcherEl.querySelectorAll('.role-switch-item').forEach(function(it) {
                if (it.textContent.trim() === '配置人视角') {
                    it.style.display = cfgView.roleSwitcher ? '' : 'none';
                }
            });
        }
        const configuringEl = document.getElementById('configuringRoleSwitcher');
        if (configuringEl) {
            configuringEl.querySelectorAll('.role-switch-item').forEach(function(it) {
                if (it.textContent.trim() === '配置人视角') {
                    it.style.display = cfgView.configuring ? '' : 'none';
                }
            });
        }

        initProfileClickEvents();
    }
    
    function switchUserRole(role) {

        var fb=document.getElementById('fixedUploadBar');if(fb)fb.style.display='none';        currentUserRole = role;
        updateTaskStatus(currentTaskStatus);
        
        document.querySelectorAll('.role-switch-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelectorAll('.role-switch-item').forEach(item => {
            const text = item.textContent.trim();
            if ((role === 'executor' && text === '执行人视角') ||
                (role === 'nonExecutor' && text === '非执行人视角') ||
                (role === 'confirmer' && text === '确认人视角') ||
                (role === 'nonConfirmer' && text === '非确认人视角') ||
                (role === 'configurer' && text === '配置人视角') ||
                (role === 'other' && text === '其他用户视角')) {
                item.classList.add('active');
            }
        });
    }
    
    function initFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('status') || TaskStatus.CONFIGURING;
        const role = urlParams.get('role') || UserRoles.CONFIGURER;
        
        if (status === TaskStatus.CONFIGURING) {
            currentUserRole = role === 'other' ? 'other' : 'configurer';
        } else if (status === TaskStatus.PENDING) {
            // 待开始态：角色切换器显示（含配置人视角），renderPending 已完整支持配置人/执行人/确认人/其他视角
            if (role === 'configurer') currentUserRole = 'configurer';
            else if (role === 'confirmer') currentUserRole = 'confirmer';
            else if (role === 'other') currentUserRole = 'other';
            else if (role === 'nonExecutor') currentUserRole = 'nonExecutor';
            else currentUserRole = 'executor';
        } else if (status === TaskStatus.REJECTED_PENDING) {
            // 驳回后待开始态：配置人视角不可达（角色切换器隐藏），仅执行人/非执行人
            currentUserRole = role === 'nonExecutor' ? 'nonExecutor' : 'executor';
        } else if (status === TaskStatus.PENDING_BLOCKED) {
            if (role === 'confirmer') {
                currentUserRole = 'confirmer';
            } else if (role === 'configurer') {
                currentUserRole = 'configurer';
            } else if (role === 'other') {
                currentUserRole = 'other';
            } else {
                currentUserRole = 'executor';
            }
        } else if (status === TaskStatus.IN_PROGRESS) {
            if (role === 'confirmer') {
                currentUserRole = 'confirmer';
            } else if (role === 'configurer') {
                currentUserRole = 'configurer';
            } else if (role === 'other') {
                currentUserRole = 'other';
            } else {
                currentUserRole = 'executor';
            }
        } else if (status === TaskStatus.CONFIRMING || status === TaskStatus.CONFIRMING_AFTER_REJECT) {
            currentUserRole = role === 'nonConfirmer' ? 'nonConfirmer' : 'confirmer';
        } else if (status === TaskStatus.COMPLETED || status === TaskStatus.COMPLETED_WITH_REJECT) {
            currentUserRole = role === 'confirmer' ? 'confirmer' : 'nonConfirmer';
        }
        
        if (status === TaskStatus.IN_PROGRESS || status === TaskStatus.PENDING || 
            status === TaskStatus.CONFIRMING || status === TaskStatus.CONFIRMING_AFTER_REJECT ||
            status === TaskStatus.COMPLETED || status === TaskStatus.COMPLETED_WITH_REJECT ||
            status === TaskStatus.REJECTED_PENDING || status === TaskStatus.PENDING_BLOCKED) {
            currentConfirmers = [
                { id: 1, name: '张三', role: '项目总', avatar: '张', status: 'pending' },
                { id: 3, name: '王五', role: '业主', avatar: '王', status: 'pending' },
                { id: 4, name: '赵六', role: '设计师', avatar: '赵', status: 'pending' }
            ];
            window.currentHasExecutor = true;
            window.currentExecutorId = 2;
            window.currentExecutorName = '李四';
        }
        
        updateTaskStatus(status);
        switchUserRole(currentUserRole);
    }

    let currentEvaluationRating = 0;
    let evaluationDimensionRatings = {
        quality: 0,
        efficiency: 0,
        attitude: 0
    };
    let currentEvaluatingConfirmer = null;

    function showEvaluationModal(confirmerName) {
        currentEvaluatingConfirmer = confirmerName;
        resetEvaluationDimensionRatings();
        document.getElementById('evaluationDescInput').value = '';
        document.getElementById('evaluationListModal').classList.remove('show');
        document.getElementById('evaluationModal').classList.add('show');
    }

    function closeEvaluationModal() {
        document.getElementById('evaluationModal').classList.remove('show');
    }

    function setEvaluationRating(rating) {
        currentEvaluationRating = rating;
        const stars = document.querySelectorAll('#evaluationStars .star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }
    
    function setEvaluationDimensionRating(dimension, rating) {
        evaluationDimensionRatings[dimension] = rating;
        const containerId = 'evaluationStars' + dimension.charAt(0).toUpperCase() + dimension.slice(1);
        const stars = document.querySelectorAll('#' + containerId + ' .star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }
    
    function resetEvaluationDimensionRatings() {
        evaluationDimensionRatings = { quality: 0, efficiency: 0, attitude: 0 };
        ['Quality', 'Efficiency', 'Attitude'].forEach(dim => {
            const stars = document.querySelectorAll('#evaluationStars' + dim + ' .star');
            stars.forEach(star => star.classList.remove('active'));
        });
    }

    function submitEvaluation() {
        if (evaluationOverallRating < 0.5) {
            showToast('请至少选择半颗星进行评价');
            return;
        }
        const avgRating = evaluationOverallRating;
        const comment = document.getElementById('evaluationDescInput').value;
        closeEvaluationModal();
        showToast('评价提交成功！');
        
        updateConfirmerEvaluation(currentEvaluatingConfirmer, avgRating, comment);
    }

    function updateConfirmerEvaluation(confirmerName, rating, comment) {
        const confirmerList = document.getElementById('confirmerList');
        if (confirmerList) {
            const items = confirmerList.querySelectorAll('.confirmer-status-item');
            items.forEach(item => {
                const nameEl = item.querySelector('.name');
                if (nameEl && nameEl.textContent.includes(confirmerName)) {
                    const existingRating = item.querySelector('.rating');
                    if (!existingRating) {
                        const ratingHtml = `
                            <div class="rating" style="margin-top: 4px;">
                                ${generateStarsHtml(rating)}
                                <span class="text" style="font-size: 11px; color: var(--text-tertiary); margin-left: 4px;">${getRatingText(rating)}</span>
                            </div>
                        `;
                        item.querySelector('.info').insertAdjacentHTML('beforeend', ratingHtml);
                        
                        const goEvaluateBtn = item.querySelector('.go-evaluate-btn');
                        if (goEvaluateBtn) {
                            goEvaluateBtn.remove();
                        }
                    }
                }
            });
        }
        
        const confirmRecordList = document.querySelector('#confirmRecordCard .confirm-list');
        if (confirmRecordList) {
            const items = confirmRecordList.querySelectorAll('.confirm-item');
            items.forEach(item => {
                const nameEl = item.querySelector('.name');
                if (nameEl && nameEl.textContent.includes(confirmerName)) {
                    const existingRating = item.querySelector('.rating');
                    if (!existingRating) {
                        const ratingHtml = `
                            <div class="rating">
                                ${generateStarsHtml(rating)}
                                <span class="text">${getRatingText(rating)}</span>
                            </div>
                        `;
                        const contentEl = item.querySelector('.content');
                        if (contentEl) {
                            contentEl.insertAdjacentHTML('afterend', ratingHtml);
                        } else {
                            item.querySelector('.info').insertAdjacentHTML('beforeend', ratingHtml);
                        }
                    }
                }
            });
        }
    }

    function generateStarsHtml(rating) {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            html += `<span class="star${i > rating ? ' empty' : ''}">★</span>`;
        }
        return html;
    }

    function getRatingText(rating) {
        const texts = ['', '很差', '较差', '一般', '良好', '优秀'];
        return texts[rating] || '';
    }

    /**
     * 跳转任务报告单页面
     */
    function goToTaskReport() {
        window.location.href = 'task-report.html?taskId=task-001';
    }

    /**
     * 跳转前置任务详情页（演示：前置任务「开槽布管」当前为进行中）
     * 真实环境应携带前置任务 id：task-detail.html?taskId=<preTaskId>
     */
    function goToPreTaskDetail() {
        window.location.href = 'task-detail.html?status=in_progress&role=executor';
    }

    function showEvaluationListModal() {
        const evaluationListBody = document.getElementById('evaluationListBody');
        
        const evaluations = [
            { name: '张三', role: '项目总', rating: 4, comment: '穿线工作符合标准，绝缘测试数据合格。', time: '2024-01-25 15:20', hasEvaluation: true },
            { name: '王五', role: '业主', rating: 0, comment: '', time: '2024-01-25 16:30', hasEvaluation: false },
            { name: '赵六', role: '设计师', rating: 5, comment: '符合设计要求，确认。', time: '2024-01-25 17:00', hasEvaluation: true }
        ];
        
        const isConfirmer = currentUserRole === 'confirmer';
        
        evaluationListBody.innerHTML = evaluations.map(eva => `
            <div class="evaluation-item">
                <div class="avatar">${eva.name.charAt(0)}</div>
                <div class="info">
                    <div class="name-row">
                        <div class="name">${eva.name} · ${eva.role}</div>
                        <div class="rating">
                            ${eva.hasEvaluation ? generateStarsHtml(eva.rating) : '<span style="color: var(--text-tertiary); font-size: 12px;">未评价</span>'}
                        </div>
                    </div>
                    <div class="time">${eva.time}</div>
                    ${eva.hasEvaluation ? 
                        `<div class="content">${eva.comment || '无评价内容'}</div>` : 
                        (isConfirmer ? 
                            `<div class="no-evaluation">暂未评价<span class="go-evaluate-btn" onclick="showEvaluationModal('${eva.name}')">去评价</span></div>` :
                            `<div class="no-evaluation">暂未评价</div>`
                        )
                    }
                </div>
            </div>
        `).join('');
        
        document.getElementById('evaluationListModal').classList.add('show');
    }

    function closeEvaluationListModal() {
        document.getElementById('evaluationListModal').classList.remove('show');
    }

    function toggleActionMenu() {
        const actionMenu = document.getElementById('actionMenu');
        if (actionMenu) {
            actionMenu.classList.toggle('show');
        }
    }
    
    function closeActionMenu() {
        const actionMenu = document.getElementById('actionMenu');
        if (actionMenu) {
            actionMenu.classList.remove('show');
        }
    }
    
    function shareToFriend() {
        // 模拟分享功能，显示分享选项
        showToast('分享功能已触发，请选择分享方式');
        // 实际项目中这里会调用微信分享API
    }
    
    function toggleConfirmerSelection(memberId) {
        toggleConfirmer(memberId);
    }
    
    function submitTask() {
        confirmSubmitTask();
    }
    
    function uploadExecutionRecord() {
        confirmUploadRecord();
    }
    
    function saveEditedRecord() {
        confirmUploadRecord();
    }

    function initEventListeners() {
        document.getElementById('executorSelectorModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeExecutorSelector();
            }
        });
        
        document.getElementById('confirmerSelectorModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeConfirmerSelector();
            }
        });
        
        document.getElementById('submitTaskModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeSubmitTaskModal();
            }
        });
        
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('confirm-modal') || 
                e.target.classList.contains('upload-modal')) {
                e.target.classList.remove('show');
            }
        });
        
        document.getElementById('evaluationModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeEvaluationModal();
            }
        });

        document.getElementById('evaluationListModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeEvaluationListModal();
            }
        });
    }
    
    initEventListeners();
    initFromUrl();
    
    window.updateTaskStatus = updateTaskStatus;
    window.switchUserRole = switchUserRole;
    window.showToast = showToast;
    window.TaskStatus = TaskStatus;
    window.toggleActionMenu = toggleActionMenu;
    window.closeActionMenu = closeActionMenu;
    window.shareToFriend = shareToFriend;
    
    function getMemberIdByAvatar(avatarText) {
        const avatarToId = { '张': '1', '李': '2', '王': '3', '赵': '4', '孙': '5', '钱': '6', '周': '7', '吴': '8', '郑': '9', '项': '1' };
        return avatarToId[avatarText] || '1';
    }
    
    function goToProfile(id, name, role) {
        location.href = 'prototype-member-profile.html?id=' + encodeURIComponent(id) + '&name=' + encodeURIComponent(name) + '&role=' + encodeURIComponent(role);
    }
    window.goToProfile = goToProfile;
    
    function initProfileClickEvents() {
        // 成员档案功能已下线
    }
    
    /**
     * 按合同内原文整条渲染单项标准（保留 → 流程符号），与合同详情页字段值保持一致。
     * @param {string} id - 标准列表容器 id
     * @param {string} text - 标准原文；为空（如变更新增任务暂无标准）时展示「未设置」占位，避免串到本页默认示例
     */
    function renderStandardFromContract(id, text) {
        const el = document.getElementById(id);
        if (!el) return;
        const item = document.createElement('div');
        item.className = 'standard-item';
        const num = document.createElement('span');
        num.className = 'num';
        num.textContent = '1.';
        const txt = document.createElement('span');
        txt.className = 'text';
        txt.textContent = (text && text.trim()) ? text : '未设置';
        item.appendChild(num);
        item.appendChild(txt);
        el.innerHTML = '';
        el.appendChild(item);
    }

    /**
     * 应用由合同详情页阶段任务跳转带入的任务上下文（from=contract）。
     * 仅覆盖：任务名称、隶属合同与阶段、执行 / 确认 / 担责三项标准；
     * 无该参数时不做任何处理，保持任务详情页原有示例数据、功能与交互。
     */
    function applyTaskContextFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('from') !== 'contract') return;

        const taskName = urlParams.get('taskName') || '';
        const contractName = urlParams.get('contractName') || '';
        const stageName = urlParams.get('stageName') || '';

        const nameEl = document.getElementById('taskName');
        if (nameEl && taskName) nameEl.textContent = taskName;

        if (contractName || stageName) {
            const stageEl = document.querySelector('.task-stage');
            if (stageEl) stageEl.textContent = '📍 ' + contractName + ' > ' + stageName;
        }

        renderStandardFromContract('execStandard', urlParams.get('execStandard') || '');
        renderStandardFromContract('confirmStandard', urlParams.get('confirmStandard') || '');
        renderStandardFromContract('liableStandard', urlParams.get('liableStandard') || '');
    }

    document.addEventListener('DOMContentLoaded', function() {
        initFromUrl();
        applyTaskContextFromUrl();
        initProfileClickEvents();
        
        // 将外部模态框移动到 .phone-frame 内部
        var phoneFrame = document.querySelector('.phone-frame');
        var externalModals = document.querySelectorAll('.evaluation-modal, .evaluation-list-modal, .person-selector-modal');
        if (phoneFrame && externalModals.length > 0) {
            externalModals.forEach(function(modal) {
                if (!phoneFrame.contains(modal)) {
                    phoneFrame.appendChild(modal);
                }
            });
        }
    });
    window.showExecutorSelector = showExecutorSelector;
    window.closeExecutorSelector = closeExecutorSelector;
    window.selectExecutor = selectExecutor;
    window.filterExecutors = filterExecutors;
    window.showConfirmerSelector = showConfirmerSelector;
    window.closeConfirmerSelector = closeConfirmerSelector;
    window.toggleConfirmerSelection = toggleConfirmerSelection;
    window.toggleConfirmer = toggleConfirmer;
    window.filterConfirmers = filterConfirmers;
    window.removeConfirmer = removeConfirmer;
    window.removeConfiguringConfirmer = removeConfiguringConfirmer;
    window.confirmConfirmerSelection = confirmConfirmerSelection;
    window.showSubmitTaskModal = showSubmitTaskModal;
    window.closeSubmitTaskModal = closeSubmitTaskModal;
    window.submitTask = submitTask;
    window.confirmSubmitTask = confirmSubmitTask;
    window.showUploadRecordModal = showUploadRecordModal;
    window.closeUploadRecordModal = closeUploadRecordModal;
    window.uploadExecutionRecord = uploadExecutionRecord;
    window.confirmUploadRecord = confirmUploadRecord;
    window.deleteExecutionRecord = deleteExecutionRecord;
    window.editExecutionRecord = editExecutionRecord;
    window.saveEditedRecord = saveEditedRecord;
    window.showSubmitConfirmModal = showSubmitConfirmModal;
    window.closeSubmitConfirmModal = closeSubmitConfirmModal;
    window.confirmSubmitToConfirmer = confirmSubmitToConfirmer;
    window.submitExecution = submitExecution;
    window.showRejectModal = showRejectModal;
    window.closeRejectModal = closeRejectModal;
    window.rejectTask = rejectTask;
    window.showConfirmModal = showConfirmModal;
    window.closeConfirmModal = closeConfirmModal;
    window.confirmTask = confirmTask;
    window.setRating = setRating;
    window.setDimensionRating = setDimensionRating;
    window.setOverallRating = setOverallRating;
    window.toggleTag = toggleTag;
    window.setEvaluationOverallRating = setEvaluationOverallRating;
    window.toggleEvaluationTag = toggleEvaluationTag;
    window.showEvaluationModal = showEvaluationModal;
    window.closeEvaluationModal = closeEvaluationModal;
    window.setEvaluationRating = setEvaluationRating;
    window.setEvaluationDimensionRating = setEvaluationDimensionRating;
    window.submitEvaluation = submitEvaluation;
    window.showEvaluationListModal = showEvaluationListModal;
    window.closeEvaluationListModal = closeEvaluationListModal;
    window.toggleCard = toggleCard;
    window.toggleStandard = toggleStandard;
    window.toggleHistoryRecords = toggleHistoryRecords;
    window.triggerUpload = triggerUpload;
    window.handleFileSelect = handleFileSelect;
    window.closeUploadModal = closeUploadModal;
    window.removeRecordFile = removeRecordFile;
    window.goToTaskReport = goToTaskReport;
    window.goToPreTaskDetail = goToPreTaskDetail;
    
    return {
        init: initFromUrl,
        updateTaskStatus: updateTaskStatus,
        switchUserRole: switchUserRole
    };
})();
