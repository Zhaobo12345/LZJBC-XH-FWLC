const PcCommon = (function() {
    'use strict';

    function showToast(message) {
        const existingToast = document.querySelector('.pc-toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = 'pc-toast';
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
        const menu = document.getElementById('userDropdownMenu');
        if (menu) {
            menu.classList.toggle('show');
        }
    }

    function logout() {
        if (confirm('确定要退出登录吗？')) {
            window.location.href = 'pc-contract-list.html';
        }
    }

    function togglePageNav() {
        const wrapper = document.getElementById('pageNavWrapper');
        const nav = document.getElementById('pageNav');
        if (wrapper && nav) {
            const toggle = wrapper.querySelector('.pc-page-nav-toggle');
            nav.classList.toggle('collapsed');
            wrapper.classList.toggle('collapsed');
            if (nav.classList.contains('collapsed')) {
                if (toggle) toggle.textContent = '▶';
            } else {
                if (toggle) toggle.textContent = '◀';
            }
        }
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function initDropdownClose() {
        document.addEventListener('click', function(e) {
            const dropdown = document.querySelector('.pc-user-dropdown');
            const menu = document.getElementById('userDropdownMenu');
            if (dropdown && menu && !dropdown.contains(e.target)) {
                menu.classList.remove('show');
            }
        });
    }

    function init() {
        initDropdownClose();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        showToast: showToast,
        toggleUserDropdown: toggleUserDropdown,
        logout: logout,
        togglePageNav: togglePageNav,
        formatFileSize: formatFileSize
    };
})();

window.showToast = PcCommon.showToast;
window.toggleUserDropdown = PcCommon.toggleUserDropdown;
window.logout = PcCommon.logout;
window.togglePageNav = PcCommon.togglePageNav;
window.formatFileSize = PcCommon.formatFileSize;