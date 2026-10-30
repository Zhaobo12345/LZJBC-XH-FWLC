// 原型导航折叠/展开功能
(function() {
    function initPageNav() {
        var pageNav = document.querySelector('.page-nav');
        if (!pageNav) return;

        var navTitle = pageNav.querySelector('.page-nav-title');
        if (!navTitle) return;

        // 添加切换按钮
        var toggleBtn = document.createElement('span');
        toggleBtn.className = 'toggle-btn';
        toggleBtn.textContent = '▼';
        navTitle.appendChild(toggleBtn);

        // 点击标题切换折叠/展开状态
        navTitle.addEventListener('click', function() {
            pageNav.classList.toggle('collapsed');
            toggleBtn.classList.toggle('collapsed');
            
            // 保存状态到localStorage
            var isCollapsed = pageNav.classList.contains('collapsed');
            localStorage.setItem('pageNavCollapsed', isCollapsed.toString());
        });

        // 从localStorage恢复状态
        var savedState = localStorage.getItem('pageNavCollapsed');
        if (savedState === 'true') {
            pageNav.classList.add('collapsed');
            toggleBtn.classList.add('collapsed');
        }
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPageNav);
    } else {
        initPageNav();
    }
})();