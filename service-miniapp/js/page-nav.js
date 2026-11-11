// 原型导航折叠/展开功能（规范范式 · 两端统一）
// 说明：
//  - 为 .page-nav 内的 .page-nav-title 注入可折叠开关。
//  - 若 HTML 已含 id="pageNavToggle" 的开关元素（HTML 驱动型页面），则直接复用；
//    否则在标题内动态创建 <span class="toggle-btn" id="pageNavToggle">▼</span>（JS 驱动型页面）。
//  - 折叠状态持久化到 localStorage['pageNavCollapsed']（'true' / 'false'），
//    与服务端/业主端详情页（内联 togglePageNav / restorePageNav）共用同一套状态与样式（common.css）。
(function () {
    function initPageNav() {
        var pageNav = document.querySelector('.page-nav');
        if (!pageNav) return;

        var navTitle = pageNav.querySelector('.page-nav-title');
        if (!navTitle) return;

        // 复用已存在的开关，否则动态创建
        var toggleBtn = document.getElementById('pageNavToggle');
        if (!toggleBtn) {
            toggleBtn = document.createElement('span');
            toggleBtn.className = 'toggle-btn';
            toggleBtn.id = 'pageNavToggle';
            toggleBtn.textContent = '▼';
            navTitle.appendChild(toggleBtn);
        } else if (toggleBtn.className.indexOf('toggle-btn') === -1) {
            toggleBtn.className += ' toggle-btn';
        }

        // 点击标题切换折叠/展开
        navTitle.addEventListener('click', function () {
            var collapsed = pageNav.classList.toggle('collapsed');
            toggleBtn.classList.toggle('collapsed', collapsed);
            try {
                localStorage.setItem('pageNavCollapsed', collapsed ? 'true' : 'false');
            } catch (e) {}
        });

        // 从 localStorage 恢复折叠状态
        try {
            if (localStorage.getItem('pageNavCollapsed') === 'true') {
                pageNav.classList.add('collapsed');
                toggleBtn.classList.add('collapsed');
            }
        } catch (e) {}
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPageNav);
    } else {
        initPageNav();
    }
})();
