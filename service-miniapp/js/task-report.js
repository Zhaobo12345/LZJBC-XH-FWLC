/**
 * 任务报告单页面
 */
(function() {
    'use strict';
    
    /**
     * 初始化页面
     */
    function init() {
        // 页面初始化完成
    }
    
    /**
     * 切换菜单显示
     */
    function toggleActionMenu() {
        const menu = document.getElementById('actionMenu');
        if (menu) {
            menu.classList.toggle('show');
        }
    }
    
    /**
     * 关闭菜单
     */
    function closeActionMenu() {
        const menu = document.getElementById('actionMenu');
        if (menu) {
            menu.classList.remove('show');
        }
    }
    
    /**
     * 下载报告
     */
    function downloadReport() {
        showCustomToast('报告下载中...');
        
        // 模拟下载
        setTimeout(() => {
            showCustomToast('报告已下载');
        }, 1500);
    }
    
    /**
     * 显示提示
     */
    function showCustomToast(message) {
        // 检查是否已有 toast
        let toast = document.getElementById('customToast');
        if (toast) {
            toast.remove();
        }
        
        // 创建 toast
        toast = document.createElement('div');
        toast.id = 'customToast';
        toast.className = 'custom-toast';
        toast.textContent = message;
        
        // 添加样式
        toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.75);
            color: #fff;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        // 自动消失
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 2000);
    }
    
    // 点击其他区域关闭菜单
    document.addEventListener('click', function(e) {
        const menu = document.getElementById('actionMenu');
        const btn = e.target.closest('.action-btn');
        if (!btn && menu && menu.classList.contains('show')) {
            menu.classList.remove('show');
        }
    });
    
    // 暴露全局函数
    window.toggleActionMenu = toggleActionMenu;
    window.closeActionMenu = closeActionMenu;
    window.downloadReport = downloadReport;
    
    // 页面加载完成后初始化
    document.addEventListener('DOMContentLoaded', init);
})();