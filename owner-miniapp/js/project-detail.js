/**
 * 项目详情页模块
 * 负责层级切换、动态加载、交互处理
 */
(function() {
    // 常量定义
    const LOADING_DELAY = 200;
    const SCROLL_THROTTLE_DELAY = 100;
    
    // 状态管理
    const state = {
        currentLevel: '项目部',
        currentLevelPath: ['项目部'],
        activityExpanded: false,
        quickNavExpanded: true,
        userManualExpand: false,
        lastScrollTop: 0
    };
    
    // DOM 元素缓存
    const elements = {};
    
    /**
     * 节流函数
     * @param {Function} fn - 需要节流的函数
     * @param {number} delay - 节流延迟时间（毫秒）
     * @returns {Function} - 节流后的函数
     */
    function throttle(fn, delay) {
        let lastTime = 0;
        return function(...args) {
            const now = Date.now();
            if (now - lastTime >= delay) {
                lastTime = now;
                fn.apply(this, args);
            }
        };
    }
    
    // 层级数据
    const levelData = {
        '项目部': {
            level: 0,
            type: 'project',
            typeName: '项目部',
            desc: '水电工作组、泥瓦工作组等5个工作组',
            parent: null,
            children: ['水电工作组', '泥瓦工作组', '木工工作组', '油漆工作组'],
            tasks: { total: 24, accept: { current: 3, total: 8 }, contract: { current: 18, total: 20 }, temp: { current: 2, total: 4 } },
            myTasks: { total: 8, accept: { current: 2, total: 3 }, contract: { current: 4, total: 5 }, temp: { current: 1, total: 2 } },
            contract: { signed: { current: 6, total: 8 }, days: { used: 58, total: 90 }, remain: 32, progress: 65 },
            todo: { count: 5, tempCount: 3 }
        },
        '水电工作组': {
            level: 1,
            type: 'workgroup',
            typeName: '工作组',
            desc: '强电施工组、弱电施工组等3个施工组',
            parent: '项目部',
            children: ['强电施工组', '弱电施工组', '水电辅助施工组'],
            tasks: { total: 12, accept: { current: 2, total: 4 }, contract: { current: 8, total: 10 }, temp: { current: 1, total: 2 } },
            myTasks: { total: 5, accept: { current: 1, total: 2 }, contract: { current: 3, total: 4 }, temp: { current: 1, total: 1 } },
            contract: { signed: { current: 2, total: 2 }, days: { used: 35, total: 45 }, remain: 10, progress: 78 },
            todo: { count: 3, tempCount: 2 }
        },
        '强电施工组': {
            level: 2,
            type: 'team',
            typeName: '施工组',
            desc: '包含5个任务包，组长：张三',
            parent: '水电工作组',
            children: ['材料采购任务包', '布管穿线任务包', '开关插座任务包', '灯具安装任务包', '验收调试任务包'],
            tasks: { total: 5, accept: { current: 1, total: 2 }, contract: { current: 4, total: 4 }, temp: { current: 0, total: 0 } },
            myTasks: { total: 2, accept: { current: 1, total: 1 }, contract: { current: 1, total: 1 }, temp: { current: 0, total: 0 } },
            contract: { signed: { current: 1, total: 1 }, days: { used: 15, total: 20 }, remain: 5, progress: 75 },
            todo: { count: 2, tempCount: 0 }
        },
        '弱电施工组': {
            level: 2,
            type: 'team',
            typeName: '施工组',
            desc: '包含4个任务包，组长：李四',
            parent: '水电工作组',
            children: ['弱电布线任务包', '网络设备任务包', '安防系统任务包', '智能家居任务包'],
            tasks: { total: 4, accept: { current: 1, total: 2 }, contract: { current: 3, total: 3 }, temp: { current: 1, total: 1 } },
            myTasks: { total: 2, accept: { current: 0, total: 1 }, contract: { current: 2, total: 2 }, temp: { current: 1, total: 1 } },
            contract: { signed: { current: 1, total: 1 }, days: { used: 10, total: 15 }, remain: 5, progress: 67 },
            todo: { count: 1, tempCount: 1 }
        },
        '水电辅助施工组': {
            level: 2,
            type: 'team',
            typeName: '施工组',
            desc: '包含3个任务包，组长：王五',
            parent: '水电工作组',
            children: ['开槽任务包', '修补任务包', '清理任务包'],
            tasks: { total: 3, accept: { current: 0, total: 0 }, contract: { current: 1, total: 3 }, temp: { current: 0, total: 1 } },
            myTasks: { total: 1, accept: { current: 0, total: 0 }, contract: { current: 0, total: 1 }, temp: { current: 0, total: 0 } },
            contract: { signed: { current: 0, total: 0 }, days: { used: 10, total: 10 }, remain: 0, progress: 100 },
            todo: { count: 0, tempCount: 1 }
        },
        '泥瓦工作组': {
            level: 1,
            type: 'workgroup',
            typeName: '工作组',
            desc: '贴砖施工组、防水施工组等2个施工组',
            parent: '项目部',
            children: ['贴砖施工组', '防水施工组'],
            tasks: { total: 8, accept: { current: 1, total: 3 }, contract: { current: 6, total: 6 }, temp: { current: 1, total: 2 } },
            myTasks: { total: 3, accept: { current: 1, total: 1 }, contract: { current: 2, total: 2 }, temp: { current: 0, total: 1 } },
            contract: { signed: { current: 1, total: 1 }, days: { used: 20, total: 30 }, remain: 10, progress: 67 },
            todo: { count: 2, tempCount: 1 }
        },
        '贴砖施工组': {
            level: 2,
            type: 'team',
            typeName: '施工组',
            desc: '包含4个任务包，组长：赵六',
            parent: '泥瓦工作组',
            children: ['地面铺砖任务包', '墙面贴砖任务包', '勾缝任务包', '清理任务包'],
            tasks: { total: 4, accept: { current: 1, total: 2 }, contract: { current: 3, total: 3 }, temp: { current: 0, total: 0 } },
            myTasks: { total: 2, accept: { current: 1, total: 1 }, contract: { current: 1, total: 1 }, temp: { current: 0, total: 0 } },
            contract: { signed: { current: 1, total: 1 }, days: { used: 12, total: 18 }, remain: 6, progress: 67 },
            todo: { count: 1, tempCount: 0 }
        },
        '防水施工组': {
            level: 2,
            type: 'team',
            typeName: '施工组',
            desc: '包含2个任务包，组长：钱七',
            parent: '泥瓦工作组',
            children: ['防水施工任务包', '闭水试验任务包'],
            tasks: { total: 2, accept: { current: 0, total: 1 }, contract: { current: 2, total: 2 }, temp: { current: 0, total: 0 } },
            myTasks: { total: 1, accept: { current: 0, total: 0 }, contract: { current: 1, total: 1 }, temp: { current: 0, total: 0 } },
            contract: { signed: { current: 0, total: 0 }, days: { used: 8, total: 12 }, remain: 4, progress: 67 },
            todo: { count: 1, tempCount: 0 }
        },
        '木工工作组': {
            level: 1,
            type: 'workgroup',
            typeName: '工作组',
            desc: '吊顶施工组、柜体施工组等2个施工组',
            parent: '项目部',
            children: ['吊顶施工组', '柜体施工组'],
            tasks: { total: 6, accept: { current: 0, total: 2 }, contract: { current: 4, total: 4 }, temp: { current: 0, total: 0 } },
            myTasks: { total: 2, accept: { current: 0, total: 1 }, contract: { current: 2, total: 2 }, temp: { current: 0, total: 0 } },
            contract: { signed: { current: 1, total: 1 }, days: { used: 5, total: 25 }, remain: 20, progress: 20 },
            todo: { count: 1, tempCount: 0 }
        },
        '油漆工作组': {
            level: 1,
            type: 'workgroup',
            typeName: '工作组',
            desc: '墙面施工组等1个施工组',
            parent: '项目部',
            children: ['墙面施工组'],
            tasks: { total: 4, accept: { current: 0, total: 1 }, contract: { current: 4, total: 4 }, temp: { current: 0, total: 0 } },
            myTasks: { total: 1, accept: { current: 0, total: 0 }, contract: { current: 1, total: 1 }, temp: { current: 0, total: 0 } },
            contract: { signed: { current: 1, total: 1 }, days: { used: 0, total: 20 }, remain: 20, progress: 0 },
            todo: { count: 0, tempCount: 0 }
        }
    };
    
    /**
     * 缓存 DOM 元素
     */
    function cacheElements() {
        console.log('开始缓存 DOM 元素');
        elements.pageContent = document.getElementById('pageContent');
        elements.stickyHeader = document.getElementById('stickyHeader');
        elements.quickNav = document.getElementById('quickNav');
        elements.quickNavToggle = document.getElementById('quickNavToggle');
        elements.levelSelector = document.getElementById('levelSelector');
        elements.levelOptions = document.getElementById('levelOptions');
        elements.levelArrow = document.getElementById('levelArrow');
        elements.levelIcon = document.getElementById('levelIcon');
        elements.levelText = document.getElementById('levelText');
        elements.levelType = document.getElementById('levelType');
        elements.breadcrumbInline = document.getElementById('breadcrumbInline');
        elements.contractList = document.getElementById('contractList');
        elements.activityList = document.getElementById('activityList');
        elements.activityMoreText = document.getElementById('activityMoreText');
        elements.activityMoreArrow = document.getElementById('activityMoreArrow');
        elements.toggleText = document.getElementById('toggleText');
        elements.toggleArrow = document.getElementById('toggleArrow');
        elements.pinBtn = document.getElementById('pinBtn');
        elements.actionMenu = document.getElementById('actionMenu');
        elements.customToastModal = document.getElementById('customToastModal');
        elements.customToastMessage = document.getElementById('customToastMessage');
        console.log('DOM 元素缓存完成');
    }
    
    /**
     * 显示自定义提示
     */
    function showCustomToast(message) {
        if (elements.customToastMessage && elements.customToastModal) {
            elements.customToastMessage.innerHTML = message.replace(/\n/g, '<br>');
            elements.customToastModal.classList.add('show');
        }
    }
    
    /**
     * 关闭自定义提示
     */
    function closeCustomToast() {
        if (elements.customToastModal) {
            elements.customToastModal.classList.remove('show');
        }
    }
    
    /**
     * 获取层级图标
     */
    function getLevelIcon(type) {
        const icons = {
            'project': '🏢',
            'workgroup': '⚡',
            'team': '👷',
            'task': '📦'
        };
        return icons[type] || '📋';
    }
    
    /**
     * 更新面包屑导航
     */
    function updateBreadcrumb(level) {
        if (!elements.breadcrumbInline) return;
        
        const parts = [];
        let current = level;
        
        while (current && levelData[current]) {
            parts.unshift(current);
            current = levelData[current].parent;
        }
        
        elements.breadcrumbInline.innerHTML = parts.map((part, index) => {
            const isLast = index === parts.length - 1;
            const separator = isLast ? '' : '<span class="separator">›</span>';
            return `<span class="breadcrumb-item ${isLast ? 'active' : ''}" data-level="${part}">${part}</span>${separator}`;
        }).join('');
    }
    
    /**
     * 显示局部加载状态
     */
    function showPartialLoading() {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            if (!card.querySelector('.partial-loading')) {
                const loading = document.createElement('div');
                loading.className = 'partial-loading show';
                loading.innerHTML = '<div class="loading-spinner"></div>';
                card.style.position = 'relative';
                card.appendChild(loading);
            } else {
                card.querySelector('.partial-loading').classList.add('show');
            }
        });
    }
    
    /**
     * 隐藏局部加载状态
     */
    function hidePartialLoading() {
        document.querySelectorAll('.partial-loading').forEach(loading => {
            loading.classList.remove('show');
        });
    }
    
    /**
     * 更新页面数据
     */
    function updatePageData(level) {
        const data = levelData[level];
        
        if (!data) {
            console.error('Level data not found:', level);
            return;
        }
        
        const overallTotal = document.getElementById('overallTotal');
        if (overallTotal) overallTotal.textContent = data.tasks.total;
        
        const overallAccept = document.getElementById('overallAccept');
        if (overallAccept) overallAccept.textContent = data.tasks.accept.current;
        
        const overallAcceptTotal = document.getElementById('overallAcceptTotal');
        if (overallAcceptTotal) overallAcceptTotal.textContent = data.tasks.accept.total;
        
        const overallContract = document.getElementById('overallContract');
        if (overallContract) overallContract.textContent = data.tasks.contract.current;
        
        const overallContractTotal = document.getElementById('overallContractTotal');
        if (overallContractTotal) overallContractTotal.textContent = data.tasks.contract.total;
        
        const overallTemp = document.getElementById('overallTemp');
        if (overallTemp) overallTemp.textContent = data.tasks.temp.current;
        
        const overallTempTotal = document.getElementById('overallTempTotal');
        if (overallTempTotal) overallTempTotal.textContent = data.tasks.temp.total;
        
        const mineTotal = document.getElementById('mineTotal');
        if (mineTotal) mineTotal.textContent = data.myTasks.total;
        
        const mineAccept = document.getElementById('mineAccept');
        if (mineAccept) mineAccept.textContent = data.myTasks.accept.current;
        
        const mineAcceptTotal = document.getElementById('mineAcceptTotal');
        if (mineAcceptTotal) mineAcceptTotal.textContent = data.myTasks.accept.total;
        
        const mineContract = document.getElementById('mineContract');
        if (mineContract) mineContract.textContent = data.myTasks.contract.current;
        
        const mineContractTotal = document.getElementById('mineContractTotal');
        if (mineContractTotal) mineContractTotal.textContent = data.myTasks.contract.total;
        
        const mineTemp = document.getElementById('mineTemp');
        if (mineTemp) mineTemp.textContent = data.myTasks.temp.current;
        
        const mineTempTotal = document.getElementById('mineTempTotal');
        if (mineTempTotal) mineTempTotal.textContent = data.myTasks.temp.total;
        
        const contractSummary = document.querySelector('.contract-summary');
        if (contractSummary) {
            contractSummary.innerHTML = `
                <div class="contract-stat">
                    <div class="value"><span class="current">${data.contract.signed.current}</span><span class="separator">/</span><span class="total">${data.contract.signed.total}</span></div>
                    <div class="label">合同签约</div>
                </div>
                <div class="contract-stat">
                    <div class="value"><span class="current">${data.contract.progress}</span><span class="total">%</span></div>
                    <div class="label">总进度</div>
                </div>
            `;
        }
        
        const todoBadge = document.getElementById('todoBadge');
        if (todoBadge) todoBadge.textContent = data.todo.count;
    }
    
    /**
     * 导航到指定层级
     */
    function navigateToLevel(level) {
        if (level === state.currentLevel) return;
        
        const data = levelData[level];
        if (!data) return;
        
        if (elements.levelIcon) elements.levelIcon.textContent = getLevelIcon(data.type);
        if (elements.levelText) elements.levelText.textContent = level;
        
        if (elements.levelType) {
            elements.levelType.textContent = data.typeName;
            elements.levelType.className = 'type-badge ' + data.type;
        }
        
        showPartialLoading();
        
        setTimeout(() => {
            updatePageData(level);
            updateBreadcrumb(level);
            state.currentLevel = level;
            updateMoreLinks(level, data);
            hidePartialLoading();
        }, LOADING_DELAY);
    }

    /**
     * 架构层级联动：更新「任务概览 / 今日动态」查看全部链接
     * 项目部=不带参数；施工组映射到所属工作组（任务/动态按工作组分组）
     */
    function updateMoreLinks(level, data) {
        var linkLevel = null;
        if (level !== '项目部') {
            linkLevel = (data.type === 'team' && data.parent) ? data.parent : level;
        }
        document.querySelectorAll('.card-title .more').forEach(function(m) {
            var h = m.dataset.href || '';
            if (h.indexOf('task-list.html') === 0) {
                m.dataset.href = linkLevel ? 'task-list.html?level=' + encodeURIComponent(linkLevel) : 'task-list.html';
            } else if (h.indexOf('activity-list.html') === 0) {
                m.dataset.href = linkLevel ? 'activity-list.html?level=' + encodeURIComponent(linkLevel) : 'activity-list.html';
            }
        });
    }
    
    /**
     * 创建层级选项
     */
    function createLevelOption(name, data, isSelected) {
        const icon = getLevelIcon(data.type);
        const childrenCount = data.children ? data.children.length : 0;
        let countText = '';
        
        if (data.type === 'project') {
            countText = `${childrenCount}个工作组 · ${data.contract.signed.total}份合同`;
        } else if (data.type === 'workgroup') {
            countText = `${childrenCount}个施工组 · ${data.contract.signed.total}份合同`;
        } else if (data.type === 'team') {
            countText = `${childrenCount}个任务包 · ${data.tasks.total}个任务`;
        }
        
        return `
            <div class="level-option ${isSelected ? 'selected' : ''}" data-level="${name}">
                <div class="icon">${icon}</div>
                <div class="info">
                    <div class="name">${name}</div>
                    <div class="count">${countText}</div>
                </div>
                <div class="check" style="visibility: ${isSelected ? 'visible' : 'hidden'};">✓</div>
            </div>
        `;
    }
    
    /**
     * 更新层级选项列表
     */
    function updateLevelOptions() {
        if (!elements.levelOptions) return;
        
        const currentData = levelData[state.currentLevel];
        if (!currentData) return;
        
        const currentLevelNum = currentData.level;
        let html = '';
        
        // 添加父级选项
        if (currentLevelNum > 0) {
            let parent = currentData.parent;
            while (parent && levelData[parent]) {
                const parentData = levelData[parent];
                html = createLevelOption(parent, parentData, false) + html;
                parent = parentData.parent;
            }
        }
        
        // 添加当前选项
        html += createLevelOption(state.currentLevel, currentData, true);
        
        // 添加子级选项
        if (currentData.children && currentData.children.length > 0) {
            currentData.children.forEach(child => {
                const childData = levelData[child];
                if (childData) {
                    html += createLevelOption(child, childData, false);
                }
            });
        }
        
        elements.levelOptions.innerHTML = html;
    }
    
    /**
     * 切换层级下拉菜单
     */
    function toggleLevelDropdown() {
        if (!elements.levelOptions || !elements.levelArrow || !elements.pageContent) return;
        
        if (elements.levelOptions.classList.contains('show')) {
            elements.levelOptions.classList.remove('show');
            elements.levelArrow.classList.remove('open');
            elements.pageContent.style.overflow = 'auto';
        } else {
            updateLevelOptions();
            elements.levelOptions.classList.add('show');
            elements.levelArrow.classList.add('open');
            elements.pageContent.style.overflow = 'hidden';
        }
    }
    
    /**
     * 选择层级
     */
    function selectLevel(name) {
        if (name === state.currentLevel) {
            toggleLevelDropdown();
            return;
        }
        
        const data = levelData[name];
        if (!data) return;
        
        if (elements.levelIcon) elements.levelIcon.textContent = getLevelIcon(data.type);
        if (elements.levelText) elements.levelText.textContent = name;
        
        if (elements.levelType) {
            elements.levelType.textContent = data.typeName;
            elements.levelType.className = 'type-badge ' + data.type;
        }
        
        toggleLevelDropdown();
        showPartialLoading();
        
        setTimeout(() => {
            updatePageData(name);
            updateBreadcrumb(name);
            state.currentLevel = name;
            updateMoreLinks(name, data);
            hidePartialLoading();
        }, LOADING_DELAY);
    }
    
    /**
     * 切换合同列表显示
     */
    function toggleContractList(element) {
        const arrow = element.querySelector('.arrow');
        const list = elements.contractList;
        
        if (!list) return;
        
        if (list.classList.contains('show')) {
            list.classList.remove('show');
            if (arrow) arrow.classList.remove('expanded');
        } else {
            list.classList.add('show');
            if (arrow) arrow.classList.add('expanded');
        }
    }
    
    /**
     * 切换动态列表显示
     */
    function toggleActivityList() {
        const hiddenItems = document.querySelectorAll('.activity-item.hidden');
        
        if (state.activityExpanded) {
            hiddenItems.forEach(item => item.classList.add('hidden'));
            if (elements.activityList) elements.activityList.classList.remove('expanded');
            if (elements.activityMoreText) elements.activityMoreText.textContent = '展开更多';
            if (elements.activityMoreArrow) elements.activityMoreArrow.classList.remove('expanded');
            state.activityExpanded = false;
        } else {
            document.querySelectorAll('.activity-item').forEach(item => item.classList.remove('hidden'));
            if (elements.activityList) elements.activityList.classList.add('expanded');
            if (elements.activityMoreText) elements.activityMoreText.textContent = '收起';
            if (elements.activityMoreArrow) elements.activityMoreArrow.classList.add('expanded');
            state.activityExpanded = true;
        }
    }
    
    /**
     * 切换快捷入口显示
     */
    function toggleQuickNav() {
        if (state.quickNavExpanded) {
            if (elements.quickNav) elements.quickNav.classList.add('collapsed');
            if (elements.toggleText) elements.toggleText.textContent = '展开快捷入口';
            if (elements.toggleArrow) elements.toggleArrow.classList.remove('expanded');
            state.quickNavExpanded = false;
            state.userManualExpand = false;
        } else {
            if (elements.quickNav) elements.quickNav.classList.remove('collapsed');
            if (elements.toggleText) elements.toggleText.textContent = '收起快捷入口';
            if (elements.toggleArrow) elements.toggleArrow.classList.add('expanded');
            state.quickNavExpanded = true;
            state.userManualExpand = true;
        }
    }
    
    /**
     * 切换操作菜单
     */
    function toggleActionMenu() {
        var actionMenu = document.getElementById('actionMenu');
        if (actionMenu) {
            actionMenu.classList.toggle('show');
        }
    }
    
    /**
     * 关闭操作菜单
     */
    function closeActionMenu() {
        var actionMenu = document.getElementById('actionMenu');
        if (actionMenu) {
            actionMenu.classList.remove('show');
        }
    }
    
    /**
     * 分享给朋友
     */
    function shareToFriend() {
        showCustomToast('分享功能已触发，请选择分享方式');
    }

    function initProfileClickEvents() {
        document.querySelectorAll('.activity-avatar, .activity-user').forEach(el => {
            el.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                // 成员档案功能已下线
            });
        });
    }
    
    /**
     * 切换快捷入口固定状态
     */
    function togglePinQuickNav(event) {
        if (event) event.stopPropagation();
        
        if (!elements.quickNav || !elements.pinBtn) return;
        
        if (elements.quickNav.classList.contains('pinned')) {
            elements.quickNav.classList.remove('pinned');
            elements.pinBtn.textContent = '📌 固定';
            localStorage.setItem('quickNavPinned', 'false');
        } else {
            elements.quickNav.classList.add('pinned');
            elements.pinBtn.textContent = '📌 取消固定';
            localStorage.setItem('quickNavPinned', 'true');
        }
    }
    
    /**
     * 初始化快捷入口固定状态
     */
    function initQuickNavPinState() {
        const isPinned = localStorage.getItem('quickNavPinned') === 'true';
        
        if (isPinned && elements.quickNav && elements.pinBtn) {
            elements.quickNav.classList.add('pinned');
            elements.pinBtn.textContent = '📌 取消固定';
        }
    }
    
    /**
     * 初始化层级显示
     */
    function initLevelDisplay() {
        const data = levelData[state.currentLevel];
        if (elements.levelType && data) {
            elements.levelType.textContent = data.typeName;
            elements.levelType.className = 'type-badge ' + data.type;
        }
    }
    
    /**
     * 绑定事件
     */
    function bindEvents() {
        // 滚动事件（使用节流处理）
        if (elements.pageContent) {
            elements.pageContent.addEventListener('scroll', throttle(handleScroll, SCROLL_THROTTLE_DELAY));
        }
        
        // 点击外部关闭菜单
        document.addEventListener('click', handleDocumentClick);
        
        // 事件委托 - 快捷入口
        if (elements.quickNav) {
            elements.quickNav.addEventListener('click', handleQuickNavClick);
        }
        
        // 事件委托 - 层级选择器
        if (elements.levelSelector) {
            elements.levelSelector.addEventListener('click', handleLevelSelectorClick);
        }
        
        // 事件委托 - 面包屑导航
        if (elements.breadcrumbInline) {
            elements.breadcrumbInline.addEventListener('click', handleBreadcrumbClick);
        }
        
        // 事件委托 - 动态列表
        if (elements.activityList) {
            elements.activityList.addEventListener('click', handleActivityClick);
        }
        
        // 事件委托 - 待办事项
        const todoContent = document.getElementById('todoContent');
        if (todoContent) {
            todoContent.addEventListener('click', handleTodoClick);
        }
        
        // 事件委托 - 合同列表项
        if (elements.contractList) {
            elements.contractList.addEventListener('click', handleContractItemClick);
        }
        
        // 快捷入口切换按钮
        if (elements.quickNavToggle) {
            elements.quickNavToggle.addEventListener('click', toggleQuickNav);
        }
        
        // 动态展开按钮
        const activityMoreBtn = document.getElementById('activityMoreBtn');
        if (activityMoreBtn) {
            activityMoreBtn.addEventListener('click', toggleActivityList);
        }
        
        // 导航栏操作按钮
        const actionBtns = document.querySelectorAll('.nav-bar .action-btn');
        actionBtns.forEach((btn, index) => {
            btn.addEventListener('click', function() {
                if (index === 0) {
                    toggleActionMenu();
                } else if (index === 1) {
                    showCustomToast('关闭小程序');
                }
            });
        });
        
        // 操作菜单项
        if (elements.actionMenu) {
            elements.actionMenu.addEventListener('click', handleActionMenuClick);
        }
        
        // Toast 关闭按钮
        const toastCloseBtn = document.querySelector('.modal-btn');
        if (toastCloseBtn) {
            toastCloseBtn.addEventListener('click', closeCustomToast);
        }
        
        // 返回按钮
        const backBtn = document.querySelector('.nav-bar .back');
        if (backBtn) {
            backBtn.addEventListener('click', function() {
                history.back();
            });
        }
        
        // 查看全部链接
        const moreLinks = document.querySelectorAll('.card-title .more');
        moreLinks.forEach(link => {
            link.addEventListener('click', handleMoreLinkClick);
        });
    }
    
    /**
     * 处理滚动事件
     */
    function handleScroll() {
        if (!elements.pageContent) return;
        
        const scrollTop = elements.pageContent.scrollTop;
        
        if (scrollTop > 50) {
            if (state.quickNavExpanded && !state.userManualExpand) {
                if (elements.quickNav) elements.quickNav.classList.add('collapsed');
                if (elements.quickNavToggle) elements.quickNavToggle.classList.add('show');
                state.quickNavExpanded = false;
                if (elements.toggleText) elements.toggleText.textContent = '展开快捷入口';
                if (elements.toggleArrow) elements.toggleArrow.classList.remove('expanded');
            }
            if (elements.stickyHeader) elements.stickyHeader.classList.add('with-shadow');
            if (elements.levelSelector) elements.levelSelector.classList.add('sticky');
        } else {
            if (!state.quickNavExpanded) {
                if (elements.quickNav) elements.quickNav.classList.remove('collapsed');
                if (elements.quickNavToggle) elements.quickNavToggle.classList.remove('show');
                state.quickNavExpanded = true;
                if (elements.toggleText) elements.toggleText.textContent = '收起快捷入口';
                if (elements.toggleArrow) elements.toggleArrow.classList.add('expanded');
                state.userManualExpand = false;
            }
            if (elements.stickyHeader) elements.stickyHeader.classList.remove('with-shadow');
            if (elements.levelSelector) elements.levelSelector.classList.remove('sticky');
        }
        
        state.lastScrollTop = scrollTop;
    }
    
    /**
     * 处理文档点击事件
     */
    function handleDocumentClick(e) {
        // 关闭层级选择器
        if (elements.levelSelector && !elements.levelSelector.contains(e.target)) {
            if (elements.levelOptions) elements.levelOptions.classList.remove('show');
            if (elements.levelArrow) elements.levelArrow.classList.remove('open');
        }
        
        // 关闭操作菜单
        if (elements.actionMenu && !e.target.closest('.actions') && !e.target.closest('.action-menu')) {
            elements.actionMenu.classList.remove('show');
        }
    }
    
    /**
     * 处理快捷入口点击
     */
    function handleQuickNavClick(e) {
        const item = e.target.closest('.quick-nav-item');
        if (item) {
            const href = item.dataset.href;
            if (href) location.href = href;
            return;
        }
        
        const pinBtn = e.target.closest('.pin-btn');
        if (pinBtn) {
            togglePinQuickNav(e);
        }
    }
    
    /**
     * 处理层级选择器点击
     */
    function handleLevelSelectorClick(e) {
        const dropdown = e.target.closest('.level-dropdown');
        if (dropdown) {
            toggleLevelDropdown();
            return;
        }
        
        const levelOption = e.target.closest('.level-option');
        if (levelOption) {
            const level = levelOption.dataset.level;
            if (level) selectLevel(level);
        }
    }
    
    /**
     * 处理面包屑点击
     */
    function handleBreadcrumbClick(e) {
        const item = e.target.closest('.breadcrumb-item');
        if (item) {
            const level = item.dataset.level;
            if (level) navigateToLevel(level);
        }
    }
    
    /**
     * 处理动态列表点击
     */
    function handleActivityClick(e) {
        const item = e.target.closest('.activity-item');
        if (item) {
            const href = item.dataset.href;
            if (href) location.href = href;
        }
    }
    
    /**
     * 处理待办事项点击
     */
    function handleTodoClick(e) {
        const item = e.target.closest('.todo-item');
        if (item) {
            const href = item.dataset.href;
            if (href) location.href = href;
        }
    }
    
    /**
     * 处理合同列表项点击
     */
    function handleContractItemClick(e) {
        const item = e.target.closest('.contract-item');
        if (item) {
            const href = item.dataset.href;
            if (href) location.href = href;
        }
    }
    
    /**
     * 处理操作菜单点击
     */
    function handleActionMenuClick(e) {
        const item = e.target.closest('.action-menu-item');
        if (item) {
            const text = item.textContent.trim();
            showCustomToast(text);
        }
    }
    
    /**
     * 处理查看全部链接点击
     */
    function handleMoreLinkClick(e) {
        const link = e.target.closest('.more');
        if (!link) return;
        
        // 检查 data-href 属性
        const href = link.dataset.href;
        if (href) {
            location.href = href;
            return;
        }
        
        // 兼容文本判断
        const text = link.textContent.trim();
        
        if (text.includes('查看合同')) {
            toggleContractList(link);
            e.stopPropagation();
            return;
        }
        
        if (text.includes('任务统计')) {
            location.href = 'task-list.html';
            return;
        }
        
        if (text.includes('待办事项')) {
            location.href = 'todo-list.html';
            return;
        }
    }
    
    /**
     * 初始化模块
     */
    function init() {
        cacheElements();
        bindEvents();
        initQuickNavPinState();
        initLevelDisplay();
        initProfileClickEvents();
    }
    
    // 自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // 暴露全局函数
    window.showCustomToast = showCustomToast;
    window.closeCustomToast = closeCustomToast;
    window.toggleActionMenu = toggleActionMenu;
    window.closeActionMenu = closeActionMenu;
    window.shareToFriend = shareToFriend;
})();

/**
 * 项目导航模块（卡片式阶段列表）
 */
const ProjectNav = {
    // 状态
    isOpen: false,
    touchStartX: 0,
    touchStartY: 0,
    allExpanded: true,

    // DOM 元素
    elements: {
        trigger: null,
        overlay: null,
        drawer: null,
        close: null,
        expandBtn: null,
        content: null
    },

    // 初始化
    init: function() {
        this.cacheElements();
        this.bindEvents();
        this.updateStats();
        this.renderStageList();
        this.updateExpandBtnState();
    },

    // 缓存 DOM 元素
    cacheElements: function() {
        this.elements.trigger = document.getElementById('projectNavTrigger');
        this.elements.overlay = document.getElementById('projectNavOverlay');
        this.elements.drawer = document.getElementById('projectNavDrawer');
        this.elements.close = document.getElementById('projectNavClose');
        this.elements.expandBtn = document.getElementById('projectNavExpandAll');
        this.elements.content = document.getElementById('projectNavContent');
    },

    // 更新顶部统计数字
    updateStats: function() {
        if (typeof projectNavData === 'undefined') return;
        const stageCountEl = document.getElementById('totalStageCount');
        const taskCountEl = document.getElementById('totalTaskCount');
        const totalStages = projectNavData.totalStages || (projectNavData.stages ? projectNavData.stages.length : 0);
        const totalTasks = projectNavData.totalTasks || (projectNavData.stages
            ? projectNavData.stages.reduce((sum, s) => sum + (s.tasks ? s.tasks.length : 0), 0)
            : 0);
        if (stageCountEl) stageCountEl.textContent = totalStages + '大阶段';
        if (taskCountEl) taskCountEl.textContent = totalTasks + '项工程节点';
    },

    // 绑定事件
    bindEvents: function() {
        if (!this.elements.trigger) return;

        this.elements.trigger.addEventListener('click', () => this.open());
        this.elements.overlay.addEventListener('click', () => this.close());
        this.elements.close.addEventListener('click', () => this.close());
        this.elements.drawer.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        this.elements.drawer.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true });
        this.elements.drawer.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
    },

    open: function() {
        this.isOpen = true;
        this.elements.trigger.classList.add('hidden');
        this.elements.overlay.classList.add('show');
        this.elements.drawer.classList.add('open');
        setTimeout(() => this.scrollToCurrentTask(), 150);
    },

    close: function() {
        this.isOpen = false;
        this.elements.trigger.classList.remove('hidden');
        this.elements.overlay.classList.remove('show');
        this.elements.drawer.classList.remove('open');
    },

    handleTouchStart: function(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
    },

    handleTouchMove: function(e) {
        if (!this.isOpen) return;
        const deltaX = e.touches[0].clientX - this.touchStartX;
        const deltaY = e.touches[0].clientY - this.touchStartY;
        if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 50) {
            this.close();
        }
    },

    handleTouchEnd: function(e) {
        this.touchStartX = 0;
        this.touchStartY = 0;
    },

    // 渲染阶段卡片列表
    renderStageList: function() {
        if (typeof projectNavData === 'undefined' || !projectNavData.stages) return;

        const html = projectNavData.stages.map((stage) => {
            const stageStatus = stage.status; // completed / in_progress / pending
            const totalTasks = stage.tasks.length;
            const completedTasks = stage.tasks.filter(t => t.status === 'completed').length;

            // 阶段头部信息
            const stageCardClass = stage.collapsed ? 'stage-card collapsed' : 'stage-card';
            const taskCountBadge = `${completedTasks}/${totalTasks}`;

            // 渲染任务项
            const tasksHtml = stage.tasks.map(task => {
                const tStatus = task.status;
                const icon = tStatus === 'completed' ? '✓' : '';
                const tagHtml = task.hasTag ? `<span class="task-tag">#</span>` : '';

                return `
                <div class="stage-task-item ${tStatus}" data-task-id="${task.id}"
                     onclick="ProjectNav.goToTaskDetail('${task.id}')">
                    <span class="task-status-icon ${tStatus}">${icon}</span>
                    <span class="task-name">${task.name}</span>
                    ${tagHtml}
                    <span class="task-arrow">›</span>
                </div>`;
            }).join('');

            // 任务列表初始高度（用于动画）
            const listHeight = totalTasks * 46 + 2;

            return `
            <div class="${stageCardClass}" data-stage-id="${stage.id}" data-collapsed="${stage.collapsed ? '1' : '0'}">
                <div class="stage-header" onclick="ProjectNav.toggleStage('${stage.id}')">
                    <span class="stage-status-dot ${stageStatus}"></span>
                    <div class="stage-info">
                        <span class="stage-title">${stage.name}</span>
                        <span class="stage-count-badge ${stageStatus}">${taskCountBadge}</span>
                    </div>
                    <span class="stage-collapse-arrow">⌄</span>
                </div>
                <div class="stage-task-list" style="max-height: ${stage.collapsed ? '0' : listHeight + 'px'};">
                    ${tasksHtml}
                </div>
            </div>`;
        }).join('');

        this.elements.content.innerHTML = `<div class="stage-list">${html}</div>`;
    },

    // 切换单个阶段的展开/收起
    toggleStage: function(stageId) {
        const cardEl = document.querySelector(`.stage-card[data-stage-id="${stageId}"]`);
        if (!cardEl) return;
        const listEl = cardEl.querySelector('.stage-task-list');
        if (!listEl) return;

        const isCollapsed = cardEl.classList.toggle('collapsed');
        const isCollapsedAttr = cardEl.getAttribute('data-collapsed') === '1';

        if (!isCollapsed) {
            // 展开
            const taskCount = cardEl.querySelectorAll('.stage-task-item').length;
            listEl.style.maxHeight = (taskCount * 46 + 2) + 'px';
            cardEl.setAttribute('data-collapsed', '0');
        } else {
            // 收起
            listEl.style.maxHeight = '0px';
            cardEl.setAttribute('data-collapsed', '1');
        }

        // 同步到数据
        if (typeof projectNavData !== 'undefined' && projectNavData.stages) {
            const stage = projectNavData.stages.find(s => s.id === stageId);
            if (stage) stage.collapsed = isCollapsed;
        }

        this.updateExpandBtnState();
    },

    // 切换全部展开/收起
    toggleExpandAll: function() {
        const cards = document.querySelectorAll('.stage-card');
        if (!cards.length) return;

        const targetCollapsed = this.allExpanded;
        this.allExpanded = !this.allExpanded;

        cards.forEach(cardEl => {
            const listEl = cardEl.querySelector('.stage-task-list');
            if (!listEl) return;
            const stageId = cardEl.getAttribute('data-stage-id');

            if (targetCollapsed) {
                cardEl.classList.add('collapsed');
                listEl.style.maxHeight = '0px';
                cardEl.setAttribute('data-collapsed', '1');
            } else {
                cardEl.classList.remove('collapsed');
                const taskCount = cardEl.querySelectorAll('.stage-task-item').length;
                listEl.style.maxHeight = (taskCount * 46 + 2) + 'px';
                cardEl.setAttribute('data-collapsed', '0');
            }

            if (typeof projectNavData !== 'undefined' && projectNavData.stages) {
                const stage = projectNavData.stages.find(s => s.id === stageId);
                if (stage) stage.collapsed = targetCollapsed;
            }
        });

        this.updateExpandBtnState(true);
    },

    // 更新"全部展开/收起"按钮文字
    updateExpandBtnState: function(forceAll) {
        if (!this.elements.expandBtn) return;
        const cards = document.querySelectorAll('.stage-card');
        if (!cards.length) return;

        const collapsedCount = document.querySelectorAll('.stage-card.collapsed').length;
        const isAllCollapsed = collapsedCount === cards.length;
        const isAllExpanded = collapsedCount === 0;

        if (forceAll === true) {
            this.elements.expandBtn.textContent = this.allExpanded ? '全部收起' : '全部展开';
        } else {
            if (isAllCollapsed) {
                this.elements.expandBtn.textContent = '全部展开';
                this.allExpanded = false;
            } else if (isAllExpanded) {
                this.elements.expandBtn.textContent = '全部收起';
                this.allExpanded = true;
            } else {
                this.elements.expandBtn.textContent = '全部收起';
                this.allExpanded = true;
            }
        }
    },

    // 滚动定位到当前进行中的任务
    scrollToCurrentTask: function() {
        const currentTaskEl = document.querySelector('.stage-task-item.in_progress');
        if (!currentTaskEl) return;

        const cardEl = currentTaskEl.closest('.stage-card');
        if (cardEl && cardEl.classList.contains('collapsed')) {
            const stageId = cardEl.getAttribute('data-stage-id');
            this.toggleStage(stageId);
        }

        setTimeout(() => {
            const contentEl = this.elements.content;
            const cardRect = cardEl ? cardEl.offsetTop : 0;
            const taskRect = currentTaskEl.offsetTop;
            const totalTop = cardRect + taskRect;
            const contentHeight = contentEl.clientHeight;
            const scrollTop = totalTop - (contentHeight / 2) + 30;

            contentEl.scrollTo({ top: Math.max(0, scrollTop), behavior: 'smooth' });
        }, 350);
    },

    // 跳转到任务详情
    goToTaskDetail: function(taskId) {
        this.close();
        setTimeout(() => { window.location.href = `task-detail.html?taskId=${taskId}`; }, 300);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        if (typeof ProjectNav !== 'undefined') {
            ProjectNav.init();
        }
    });
} else {
    if (typeof ProjectNav !== 'undefined') {
        ProjectNav.init();
    }
}