/**
 * common.js - 家装平台小程序原型 · 公共脚本
 * 适用于所有 prototype-*.html 页面
 */

(function() {
    'use strict';

    function initPageNav() {
        const pageNav = document.querySelector('.page-nav');
        if (!pageNav) return;

        if (pageNav.querySelector('.page-nav-toggle')) return;

        const firstTitle = pageNav.querySelector('.page-nav-title');
        const titleText = firstTitle ? firstTitle.textContent : '导航';

        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'page-nav-toggle';
        toggleContainer.innerHTML = `
            <span class="page-nav-toggle-title">${titleText}</span>
            <span class="page-nav-toggle-icon">▼</span>
        `;

        const contentContainer = document.createElement('div');
        contentContainer.className = 'page-nav-content';

        const childNodes = Array.from(pageNav.childNodes);

        childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) {
                return;
            }
            contentContainer.appendChild(node);
        });

        pageNav.innerHTML = '';
        pageNav.appendChild(toggleContainer);
        pageNav.appendChild(contentContainer);

        toggleContainer.addEventListener('click', function(e) {
            e.stopPropagation();
            pageNav.classList.toggle('collapsed');
            
            const isCollapsed = pageNav.classList.contains('collapsed');
            localStorage.setItem('pageNavCollapsed', isCollapsed);
        });

        const savedState = localStorage.getItem('pageNavCollapsed');
        if (savedState === 'true') {
            pageNav.classList.add('collapsed');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPageNav);
    } else {
        initPageNav();
    }

    window.initPageNav = initPageNav;

})();

/**
 * ContractAmountMask - 合同金额脱敏权限控制
 * 
 * 权限规则：
 * - 拥有「全部权限」→ 可查看
 * - 拥有「所属架构及下属层级权限（含合同）」→ 可查看
 * - 是该合同的创建人或甲方或乙方 → 可查看
 * - 否则 → 展示 ***
 * 
 * 使用方法：
 *   ContractAmountMask.format(amount, contract, userPermission, userId)
 *   ContractAmountMask.canView(contract, userPermission, userId)
 */
window.ContractAmountMask = (function() {
    'use strict';

    /** 可查看金额的权限值 */
    var VIEW_PERMISSIONS = ['all', 'org_with_contract'];

    /**
     * 判断当前用户是否有权查看该合同金额
     * @param {Object} contract - 合同数据对象（含 creator/partyA/partyB）
     * @param {string} userPermission - 当前用户权限：'all' | 'org_with_contract' | 'basic'
     * @param {string} userId - 当前用户ID
     * @returns {boolean}
     */
    function canView(contract, userPermission, userId) {
        if (!contract) return false;
        // 系统级权限
        if (VIEW_PERMISSIONS.indexOf(userPermission) !== -1) return true;
        // 合同关系人：创建人 / 甲方 / 乙方
        if (userId && (
            contract.creator === userId ||
            contract.partyA === userId ||
            contract.partyB === userId
        )) return true;
        return false;
    }

    /**
     * 根据权限返回格式化金额或 ***
     * @param {string} amount - 金额字符串（如'￥50,000'）
     * @param {Object} contract - 合同数据
     * @param {string} userPermission - 当前用户权限
     * @param {string} userId - 当前用户ID
     * @returns {string}
     */
    function format(amount, contract, userPermission, userId) {
        if (canView(contract, userPermission, userId)) {
            return amount;
        }
        return '***';
    }

    return { canView: canView, format: format, VIEW_PERMISSIONS: VIEW_PERMISSIONS };
})();
