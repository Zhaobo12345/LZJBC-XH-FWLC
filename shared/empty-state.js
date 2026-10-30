/**
 * 空状态/异常插图组件 - 交互逻辑
 * 用于：列表页空状态、加载中、无网络、错误页
 */

(function(global) {
    'use strict';

    // SVG插图定义（内联以支持原型演示）
    const ILLUSTRATIONS = {
        'empty-project': `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="24" y="48" width="72" height="56" rx="4" fill="#F0F5FF" stroke="#1890FF" stroke-width="2"/>
            <path d="M24 64H96" stroke="#1890FF" stroke-width="2"/>
            <rect x="36" y="56" width="16" height="4" rx="2" fill="#1890FF"/>
            <polygon points="60,16 96,48 24,48" fill="#E6F7FF" stroke="#1890FF" stroke-width="2" stroke-linejoin="round"/>
            <rect x="52" y="72" width="16" height="32" rx="2" fill="#1890FF" fill-opacity="0.3"/>
            <circle cx="78" cy="84" r="8" stroke="#1890FF" stroke-width="2" stroke-dasharray="4 2"/>
        </svg>`,
        
        'empty-task': `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="16" y="20" width="88" height="80" rx="8" fill="#F6FFED" stroke="#52C41A" stroke-width="2"/>
            <rect x="28" y="36" width="24" height="24" rx="4" fill="#52C41A" fill-opacity="0.2" stroke="#52C41A" stroke-width="2"/>
            <path d="M34 48L38 52L46 44" stroke="#52C41A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <rect x="60" y="40" width="32" height="4" rx="2" fill="#BFBFBF"/>
            <rect x="60" y="52" width="24" height="4" rx="2" fill="#BFBFBF"/>
            <rect x="28" y="68" width="24" height="24" rx="4" fill="#BFBFBF" fill-opacity="0.2" stroke="#BFBFBF" stroke-width="2"/>
            <rect x="60" y="72" width="32" height="4" rx="2" fill="#BFBFBF"/>
            <rect x="60" y="84" width="24" height="4" rx="2" fill="#BFBFBF"/>
        </svg>`,
        
        'empty-contract': `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="16" width="80" height="88" rx="8" fill="#E6F7FF" stroke="#1890FF" stroke-width="2"/>
            <rect x="32" y="32" width="56" height="4" rx="2" fill="#BFBFBF"/>
            <rect x="32" y="44" width="48" height="4" rx="2" fill="#BFBFBF"/>
            <rect x="32" y="56" width="40" height="4" rx="2" fill="#BFBFBF"/>
            <circle cx="84" cy="84" r="20" fill="#1890FF" fill-opacity="0.1" stroke="#1890FF" stroke-width="2"/>
            <path d="M78 84L82 88L90 80" stroke="#1890FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
        
        'empty-statement': `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="16" width="80" height="88" rx="8" fill="#FFF7E6" stroke="#FA8C16" stroke-width="2"/>
            <rect x="32" y="28" width="40" height="6" rx="3" fill="#FA8C16"/>
            <rect x="32" y="48" width="56" height="4" rx="2" fill="#BFBFBF"/>
            <rect x="32" y="60" width="48" height="4" rx="2" fill="#BFBFBF"/>
            <rect x="32" y="72" width="56" height="4" rx="2" fill="#BFBFBF"/>
            <circle cx="84" cy="28" r="8" fill="#FA8C16"/>
            <text x="84" y="32" font-family="Arial" font-size="10" fill="#FFF" text-anchor="middle">¥</text>
        </svg>`,
        
        'empty-member': `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="44" cy="48" r="20" fill="#F9F0FF" stroke="#722ED1" stroke-width="2"/>
            <circle cx="44" cy="44" r="8" fill="#722ED1" fill-opacity="0.3"/>
            <path d="M32 64C32 56 38 52 44 52C50 52 56 56 56 64" stroke="#722ED1" stroke-width="2" stroke-linecap="round"/>
            <circle cx="76" cy="48" r="20" fill="#F0F5FF" stroke="#1890FF" stroke-width="2" stroke-dasharray="4 2"/>
            <circle cx="76" cy="44" r="8" fill="#1890FF" fill-opacity="0.1"/>
            <path d="M64 64C64 56 70 52 76 52C82 52 88 56 88 64" stroke="#1890FF" stroke-width="2" stroke-dasharray="4 2" stroke-linecap="round"/>
            <circle cx="60" cy="88" r="12" fill="#722ED1" fill-opacity="0.2" stroke="#722ED1" stroke-width="2"/>
            <text x="60" y="92" font-family="Arial" font-size="14" fill="#722ED1" text-anchor="middle">+</text>
        </svg>`,
        
        'empty-file': `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M32 24H72L88 40V96C88 100.418 84.4183 104 80 104H32C27.5817 104 24 100.418 24 96V32C24 27.5817 27.5817 24 32 24Z" fill="#FAFAFA" stroke="#BFBFBF" stroke-width="2"/>
            <path d="M72 24V40H88" fill="#E8E8E8" stroke="#BFBFBF" stroke-width="2" stroke-linejoin="round"/>
            <rect x="40" y="56" width="40" height="4" rx="2" fill="#BFBFBF"/>
            <rect x="40" y="68" width="32" height="4" rx="2" fill="#BFBFBF"/>
            <rect x="40" y="80" width="24" height="4" rx="2" fill="#BFBFBF"/>
        </svg>`,
        
        'no-network': `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M60 24C78 24 92 34 96 48" stroke="#FF4D4F" stroke-width="3" stroke-linecap="round"/>
            <path d="M60 36C72 36 82 44 86 56" stroke="#FF4D4F" stroke-width="3" stroke-linecap="round"/>
            <path d="M60 48C68 48 74 54 76 62" stroke="#FF4D4F" stroke-width="3" stroke-linecap="round"/>
            <circle cx="60" cy="76" r="8" fill="#FF4D4F" fill-opacity="0.2" stroke="#FF4D4F" stroke-width="2"/>
            <line x1="32" y1="88" x2="88" y2="32" stroke="#FF4D4F" stroke-width="3" stroke-linecap="round"/>
            <circle cx="24" cy="96" r="12" fill="#FFF1F0" stroke="#FF4D4F" stroke-width="2"/>
            <text x="24" y="100" font-family="Arial" font-size="12" fill="#FF4D4F" text-anchor="middle">!</text>
        </svg>`,
        
        'loading': `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="60" r="40" stroke="#E6F7FF" stroke-width="8"/>
            <path d="M60 20C82.0914 20 100 37.9086 100 60" stroke="#1890FF" stroke-width="8" stroke-linecap="round">
                <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="1s" repeatCount="indefinite"/>
            </path>
        </svg>`,
        
        'error-404': `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="16" y="40" width="88" height="56" rx="8" fill="#FFF1F0" stroke="#FF4D4F" stroke-width="2"/>
            <text x="60" y="76" font-family="Arial Black" font-size="32" fill="#FF4D4F" text-anchor="middle">404</text>
            <circle cx="24" cy="24" r="8" fill="#FF4D4F" fill-opacity="0.2"/>
            <circle cx="96" cy="24" r="6" fill="#FF4D4F" fill-opacity="0.3"/>
            <circle cx="104" cy="48" r="4" fill="#FF4D4F" fill-opacity="0.2"/>
        </svg>`,
        
        'error-500': `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="16" y="40" width="88" height="56" rx="8" fill="#FFF1F0" stroke="#FF4D4F" stroke-width="2"/>
            <text x="60" y="76" font-family="Arial Black" font-size="32" fill="#FF4D4F" text-anchor="middle">500</text>
            <path d="M24 24L32 32M32 24L24 32" stroke="#FF4D4F" stroke-width="3" stroke-linecap="round"/>
            <path d="M88 20L96 28M96 20L88 28" stroke="#FF4D4F" stroke-width="3" stroke-linecap="round"/>
        </svg>`
    };

    /**
     * 创建空状态组件
     * @param {Object} options 配置选项
     * @param {string} options.type 插图类型：empty-project, empty-task, empty-contract等
     * @param {string} options.title 标题文字
     * @param {string} options.desc 描述文字
     * @param {string} options.actionText 按钮文字（可选）
     * @param {Function} options.onAction 按钮点击回调（可选）
     * @returns {HTMLElement} 空状态DOM元素
     */
    function createEmptyState(options) {
        const { type, title, desc, actionText, onAction } = options;
        
        const container = document.createElement('div');
        container.className = 'empty-state';
        
        // 插图
        const illustration = document.createElement('div');
        illustration.className = 'illustration';
        illustration.innerHTML = ILLUSTRATIONS[type] || ILLUSTRATIONS['empty-project'];
        container.appendChild(illustration);
        
        // 标题
        if (title) {
            const titleEl = document.createElement('div');
            titleEl.className = 'empty-title';
            titleEl.textContent = title;
            container.appendChild(titleEl);
        }
        
        // 描述
        if (desc) {
            const descEl = document.createElement('div');
            descEl.className = 'empty-desc';
            descEl.textContent = desc;
            container.appendChild(descEl);
        }
        
        // 操作按钮
        if (actionText) {
            const actionBtn = document.createElement('button');
            actionBtn.className = 'empty-action';
            actionBtn.textContent = actionText;
            if (typeof onAction === 'function') {
                actionBtn.addEventListener('click', onAction);
            }
            container.appendChild(actionBtn);
        }
        
        return container;
    }

    /**
     * 创建加载状态组件
     * @param {string} text 加载提示文字
     * @returns {HTMLElement} 加载状态DOM元素
     */
    function createLoadingState(text) {
        const container = document.createElement('div');
        container.className = 'loading-state';
        
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        container.appendChild(spinner);
        
        if (text) {
            const textEl = document.createElement('div');
            textEl.className = 'loading-text';
            textEl.textContent = text;
            container.appendChild(textEl);
        }
        
        return container;
    }

    /**
     * 创建无网络状态组件
     * @param {Function} onRetry 重试按钮回调
     * @returns {HTMLElement} 无网络状态DOM元素
     */
    function createOfflineState(onRetry) {
        const container = document.createElement('div');
        container.className = 'offline-state';
        
        const icon = document.createElement('div');
        icon.className = 'offline-icon';
        icon.innerHTML = ILLUSTRATIONS['no-network'];
        container.appendChild(icon);
        
        const title = document.createElement('div');
        title.className = 'empty-title';
        title.textContent = '网络连接失败';
        container.appendChild(title);
        
        const desc = document.createElement('div');
        desc.className = 'empty-desc';
        desc.textContent = '请检查网络设置后重试';
        container.appendChild(desc);
        
        const retryBtn = document.createElement('button');
        retryBtn.className = 'empty-action';
        retryBtn.textContent = '重新加载';
        if (typeof onRetry === 'function') {
            retryBtn.addEventListener('click', onRetry);
        }
        container.appendChild(retryBtn);
        
        return container;
    }

    /**
     * 创建错误页组件
     * @param {number} errorCode 错误代码（404或500）
     * @param {Function} onBack 返回按钮回调
     * @returns {HTMLElement} 错误页DOM元素
     */
    function createErrorPage(errorCode, onBack) {
        const container = document.createElement('div');
        container.className = 'error-state';
        
        const illustration = document.createElement('div');
        illustration.className = 'illustration';
        illustration.style.width = '160px';
        illustration.style.height = '160px';
        illustration.innerHTML = errorCode === 404 ? ILLUSTRATIONS['error-404'] : ILLUSTRATIONS['error-500'];
        container.appendChild(illustration);
        
        const title = document.createElement('div');
        title.className = 'error-title';
        title.textContent = errorCode === 404 ? '页面不存在' : '服务器错误';
        container.appendChild(title);
        
        const desc = document.createElement('div');
        desc.className = 'error-desc';
        desc.textContent = errorCode === 404 
            ? '您访问的页面已删除或暂时不可用' 
            : '服务器开小差了，请稍后再试';
        container.appendChild(desc);
        
        const backBtn = document.createElement('button');
        backBtn.className = 'empty-action';
        backBtn.textContent = '返回首页';
        if (typeof onBack === 'function') {
            backBtn.addEventListener('click', onBack);
        }
        container.appendChild(backBtn);
        
        return container;
    }

    /**
     * 显示空状态到目标容器
     * @param {HTMLElement|string} target 目标容器或选择器
     * @param {Object} options 空状态配置
     */
    function showEmptyState(target, options) {
        const container = typeof target === 'string' ? document.querySelector(target) : target;
        if (!container) return;
        
        // 清除现有内容
        container.innerHTML = '';
        
        // 插入空状态组件
        const emptyState = createEmptyState(options);
        container.appendChild(emptyState);
    }

    /**
     * 显示加载状态到目标容器
     * @param {HTMLElement|string} target 目标容器或选择器
     * @param {string} text 加载提示文字
     */
    function showLoading(target, text) {
        const container = typeof target === 'string' ? document.querySelector(target) : target;
        if (!container) return;
        
        container.innerHTML = '';
        const loadingState = createLoadingState(text || '加载中...');
        container.appendChild(loadingState);
    }

    /**
     * 显示无网络状态到目标容器
     * @param {HTMLElement|string} target 目标容器或选择器
     * @param {Function} onRetry 重试回调
     */
    function showOffline(target, onRetry) {
        const container = typeof target === 'string' ? document.querySelector(target) : target;
        if (!container) return;
        
        container.innerHTML = '';
        const offlineState = createOfflineState(onRetry);
        container.appendChild(offlineState);
    }

    // 导出到全局
    global.EmptyState = {
        create: createEmptyState,
        show: showEmptyState,
        showLoading,
        showOffline,
        createErrorPage,
        ILLUSTRATIONS
    };

})(typeof window !== 'undefined' ? window : this);