/**
 * 项目详情页模块（业主端）
 * 负责快捷入口、待办/动态交互、提示等。
 * 已移除：层级切换、合同概览/任务统计渲染、快捷入口收起展开、悬浮项目导航(ProjectNav)、
 *         快捷入口吸顶浮层与「📌 固定」功能（改为随页面正常滚动，避免遮挡服务流程浮窗）。
 */
(function() {
    const state = {
        activityExpanded: false
    };

    const elements = {};

    /**
     * 缓存 DOM 元素
     */
    function cacheElements() {
        elements.quickNav = document.getElementById('quickNav');
        elements.activityList = document.getElementById('activityList');
        elements.activityMoreText = document.getElementById('activityMoreText');
        elements.activityMoreArrow = document.getElementById('activityMoreArrow');
        elements.actionMenu = document.getElementById('actionMenu');
        elements.customToastModal = document.getElementById('customToastModal');
        elements.customToastMessage = document.getElementById('customToastMessage');
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

    function closeCustomToast() {
        if (elements.customToastModal) {
            elements.customToastModal.classList.remove('show');
        }
    }

    function toggleActionMenu() {
        var actionMenu = document.getElementById('actionMenu');
        if (actionMenu) actionMenu.classList.toggle('show');
    }

    function closeActionMenu() {
        var actionMenu = document.getElementById('actionMenu');
        if (actionMenu) actionMenu.classList.remove('show');
    }

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
     * 展开/收起今日动态
     */
    function toggleActivityList() {
        const ACTIVITY_VISIBLE_COUNT = 3; // 默认展示三条，其余「展示更多」
        const items = document.querySelectorAll('.activity-item');
        if (state.activityExpanded) {
            items.forEach((item, i) => item.classList.toggle('hidden', i >= ACTIVITY_VISIBLE_COUNT));
            if (elements.activityList) elements.activityList.classList.remove('expanded');
            if (elements.activityMoreText) elements.activityMoreText.textContent = '展示更多';
            if (elements.activityMoreArrow) elements.activityMoreArrow.classList.remove('expanded');
            state.activityExpanded = false;
        } else {
            items.forEach(item => item.classList.remove('hidden'));
            if (elements.activityList) elements.activityList.classList.add('expanded');
            if (elements.activityMoreText) elements.activityMoreText.textContent = '收起';
            if (elements.activityMoreArrow) elements.activityMoreArrow.classList.add('expanded');
            state.activityExpanded = true;
            // 展开后自动平滑下滚，让新增的两条动态立即进入可视区
            scrollToNewActivities(items, ACTIVITY_VISIBLE_COUNT);
        }
    }

    /**
     * 展开「展示更多」后把第 4 条动态滚到内容区顶部附近，
     * 避免用户以为页面「无法下滑查看其他动态」。
     */
    function scrollToNewActivities(items, visibleCount) {
        try {
            const pc = document.getElementById('pageContent');
            const firstNew = items[visibleCount];
            if (!pc || !firstNew) return;
            const delta = firstNew.getBoundingClientRect().top - pc.getBoundingClientRect().top;
            const target = pc.scrollTop + Math.max(0, delta - 16);
            if (typeof pc.scrollTo === 'function') {
                pc.scrollTo({ top: target, behavior: 'smooth' });
            } else {
                pc.scrollTop = target;
            }
        } catch (e) {
            // 原型环境兜底：不影响展开逻辑
        }
    }

    function handleQuickNavClick(e) {
        const item = e.target.closest('.quick-nav-item');
        if (item) {
            const href = item.dataset.href;
            if (href) location.href = href;
        }
    }

    function handleActivityClick(e) {
        const item = e.target.closest('.activity-item');
        if (item) {
            const href = item.dataset.href;
            if (href) location.href = href;
        }
    }

    function handleTodoClick(e) {
        const item = e.target.closest('.todo-item');
        if (item) {
            const href = item.dataset.href;
            if (href) location.href = href;
        }
    }

    function handleMoreLinkClick(e) {
        const link = e.target.closest('.more');
        if (!link) return;
        const href = link.dataset.href;
        if (href) location.href = href;
    }

    function handleActionMenuClick(e) {
        const item = e.target.closest('.action-menu-item');
        if (item) {
            const text = item.textContent.trim();
            showCustomToast(text);
        }
    }

    function bindEvents() {
        if (elements.quickNav) {
            elements.quickNav.addEventListener('click', handleQuickNavClick);
        }

        if (elements.activityList) {
            elements.activityList.addEventListener('click', handleActivityClick);
        }

        const todoContent = document.getElementById('todoContent');
        if (todoContent) todoContent.addEventListener('click', handleTodoClick);

        const activityMoreBtn = document.getElementById('activityMoreBtn');
        if (activityMoreBtn) activityMoreBtn.addEventListener('click', toggleActivityList);

        const actionBtns = document.querySelectorAll('.nav-bar .action-btn');
        actionBtns.forEach((btn, index) => {
            btn.addEventListener('click', function() {
                if (index === 0) toggleActionMenu();
                else if (index === 1) showCustomToast('关闭小程序');
            });
        });

        if (elements.actionMenu) elements.actionMenu.addEventListener('click', handleActionMenuClick);

        const toastCloseBtn = document.querySelector('.modal-btn');
        if (toastCloseBtn) toastCloseBtn.addEventListener('click', closeCustomToast);

        const backBtn = document.querySelector('.nav-bar .back');
        if (backBtn) backBtn.addEventListener('click', function() { history.back(); });

        const moreLinks = document.querySelectorAll('.card-title .more');
        moreLinks.forEach(link => link.addEventListener('click', handleMoreLinkClick));
    }

    function init() {
        cacheElements();
        bindEvents();
        initProfileClickEvents();
    }

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
