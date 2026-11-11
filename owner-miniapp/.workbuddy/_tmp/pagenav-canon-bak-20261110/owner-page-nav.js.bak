// 原型导航折叠/展开功能
(function() {
    // 确保DOM完全加载
    function initPageNav() {
        // 延迟执行，确保所有DOM元素都已加载
        setTimeout(function() {
            var pageNav = document.querySelector('.page-nav');
            if (!pageNav) {
                console.log('未找到page-nav元素');
                return;
            }

            var navTitle = pageNav.querySelector('.page-nav-title');
            if (!navTitle) {
                console.log('未找到page-nav-title元素');
                return;
            }

            // 添加切换按钮
            var toggleBtn = document.createElement('span');
            toggleBtn.className = 'toggle-btn';
            toggleBtn.textContent = '▼';
            navTitle.appendChild(toggleBtn);

            // 点击标题切换折叠/展开状态
            navTitle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                pageNav.classList.toggle('collapsed');
                toggleBtn.classList.toggle('collapsed');
                
                // 保存状态到localStorage
                var isCollapsed = pageNav.classList.contains('collapsed');
                localStorage.setItem('pageNavCollapsed', isCollapsed.toString());
                console.log('导航状态切换为:', isCollapsed ? '折叠' : '展开');
            });

            // 从localStorage恢复状态
            var savedState = localStorage.getItem('pageNavCollapsed');
            if (savedState === 'true') {
                pageNav.classList.add('collapsed');
                toggleBtn.classList.add('collapsed');
                console.log('从localStorage恢复状态: 折叠');
            }
            console.log('原型导航初始化完成');
        }, 100); // 延迟100ms执行
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPageNav);
    } else {
        initPageNav();
    }
})();