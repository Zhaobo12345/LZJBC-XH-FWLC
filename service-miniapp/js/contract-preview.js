/**
 * 合同预览页面
 */
(function() {
    'use strict';
    
    /**
     * 下载合同
     */
    function downloadContract() {
        showCustomToast('合同下载中...');
        
        // 模拟下载
        setTimeout(() => {
            showCustomToast('合同已下载');
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
    
    // 暴露全局函数
    window.downloadContract = downloadContract;
})();