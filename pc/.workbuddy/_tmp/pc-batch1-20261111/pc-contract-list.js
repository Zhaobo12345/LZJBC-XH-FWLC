/* ============================================================
   PC 审核状态 key ↔ 小程序合同状态 key 映射表（P1-6，2026-11-10）
   两端存在同名不同义，联调与 PRD 描述一律按此表换算，禁止按 key 相等判断：
   | PC 列表 key            | PC 显示文案     | 小程序对应状态 / 含义                          |
   | pending_review         | 合同待审核      | platform_reviewing 平台审核中（拟定中→平台审核）|
   | changing               | 变更待平台审核  | 小程序 changing = 已签约后「变更中/发起变更」   |
   | reviewed_pass          | 审核已通过      | 进入确认中（非工人 5 步 / 工人 3 步）           |
   | reviewed_reject        | 审核已驳回      | 退回拟定中，由创建方修改后重新提交             |
   | change_reviewed_pass   | 变更已通过      | change_confirming → V2 已签约                  |
   | change_reviewed_reject | 变更已驳回      | 变更终止，回退原已签约版本                    |
   | contract_withdrawn     | 合同已撤回      | 平台审核前主动撤回                            |
   | change_withdrawn       | 变更已撤回      | 平台审核前撤回本次变更                        |
   SSOT：service-miniapp/js/contract-detail.js、worker-contract-detail.js
   ============================================================ */

function toggleUserDropdown() {
            const menu = document.getElementById('userDropdownMenu');
            menu.classList.toggle('show');
        }

        function logout() {
            if (confirm('确定要退出登录吗？')) {
                window.location.href = 'pc-contract-list.html';
            }
        }

        document.addEventListener('click', function(e) {
            const dropdown = document.querySelector('.pc-user-dropdown');
            const menu = document.getElementById('userDropdownMenu');
            if (dropdown && menu && !dropdown.contains(e.target)) {
                menu.classList.remove('show');
            }
        });

        function togglePageNav() {
            const wrapper = document.getElementById('pageNavWrapper');
            const nav = document.getElementById('pageNav');
            const toggle = wrapper.querySelector('.pc-page-nav-toggle');
            nav.classList.toggle('collapsed');
            wrapper.classList.toggle('collapsed');
            if (nav.classList.contains('collapsed')) {
                toggle.textContent = '▶';
            } else {
                toggle.textContent = '◀';
            }
        }

        // P1-2 父子合同：默认展开；点父行的折叠箭头或带 ?expand=<父id> 进入时切换
        const collapsedParents = {};
        function toggleContractTree(parentId) {
            collapsedParents[parentId] = !collapsedParents[parentId];
            renderContractList();
        }
        // 与服务端 contract-list.html 的 ?item= 上下文对齐：进入列表时预置流程项筛选
        function applyUrlContext() {
            const q = new URLSearchParams(location.search);
            const item = q.get('item');
            const flowSel = document.getElementById('flowFilter');
            if (item && flowSel && FLOW_OPTIONS.some(function (f) { return f.id === item; })) {
                flowSel.value = item;
            }
            const expand = q.get('expand');
            if (expand) {
                Object.keys(collapsedParents).forEach(function (k) { delete collapsedParents[k]; });
                allContracts.forEach(function (c) {
                    if (c.parentId && String(c.parentId) !== expand) collapsedParents[c.parentId] = true;
                });
            }
        }

        // PC端 = 运营人员，默认全部权限
        var LIST_USER_PERMISSION = 'all';
        var LIST_USER_ID = 'platform-operator';

        function getMaskedAmountList(c) {
            if (!window.ContractAmountMask) return c.amount;
            return window.ContractAmountMask.format(c.amount, c, LIST_USER_PERMISSION, LIST_USER_ID);
        }

        /* 合同唯一归属服务流程项 flowId/flowName（SSOT: service-miniapp/js/flow-config-store.js）。
           lh/cs/sh 为不含合同项，故合同只落 ht/sg/cz；parentId 为上级合同 id（子合同）。
           合同类型 8 类与 service-miniapp/create-contract.html:529-538 CONTRACT_TYPES 一致；
           原型城市限北京 / 南阳 / 西安，id=1 与详情页「西安阳光里小区」同源。 */
        const FLOW_OPTIONS = [
            { id: 'lh', name: '量房', hasContract: false },
            { id: 'cs', name: '初步设计', hasContract: false },
            { id: 'ht', name: '设计服务', hasContract: true },
            { id: 'sg', name: '基础施工服务', hasContract: true },
            { id: 'cz', name: '主材安装', hasContract: true },
            { id: 'sh', name: '售后', hasContract: false }
        ];
        // 工人合同（6 类班组服务合同：拆除/水电/木作/泥瓦/油漆/小零工）无平台审核流程与需求，
        // PC 合同审核管理（列表 + 筛选）一律不展示；仅基础/设计两类合同进入平台审核。
        var WORKER_TYPES = ['demolition', 'shuidian', 'muzuo', 'niwa', 'youqi', 'xiaolingong'];

        const allContracts = [
            { id: 13, name: '基础施工服务合同-雁塔区撤回示例', project: '雁塔区别墅', type: 'base', typeName: '基础施工服务合同', flowId: 'sg', flowName: '基础施工服务', amount: '￥60,000', status: 'contract_withdrawn', statusName: '合同已撤回', statusClass: 'withdrawn', time: '2024-01-27 09:40', rejectReason: '' },
            { id: 14, name: '设计服务合同-未央区撤回示例', project: '未央区平层', type: 'design', typeName: '设计服务合同', flowId: 'ht', flowName: '设计服务', amount: '￥30,000', status: 'change_withdrawn', statusName: '变更已撤回', statusClass: 'withdrawn', time: '2024-01-26 18:20', rejectReason: '' },
            { id: 1, name: '基础施工服务合同-西安阳光里小区', project: '西安阳光里小区', type: 'base', typeName: '基础施工服务合同', flowId: 'sg', flowName: '基础施工服务', amount: '￥50,000', status: 'pending_review', statusName: '合同待审核', statusClass: 'pending-review', time: '2024-01-26 10:30', rejectReason: '' },
            { id: 2, name: '设计服务合同-碑林区平层', project: '碑林区平层', type: 'design', typeName: '设计服务合同', flowId: 'ht', flowName: '设计服务', amount: '￥35,000', status: 'pending_review', statusName: '合同待审核', statusClass: 'pending-review', time: '2024-01-26 09:15', rejectReason: '' },
            { id: 3, name: '水电班组服务合同-西安阳光里小区', project: '西安阳光里小区', type: 'shuidian', typeName: '水电班组服务合同', flowId: 'sg', flowName: '基础施工服务', parentId: 1, parent: '基础施工服务合同-西安阳光里小区', amount: '￥45,000', status: 'changing', statusName: '变更待审核', statusClass: 'changing', time: '2024-01-25 16:00', rejectReason: '' },
            { id: 4, name: '拆除班组服务合同-西安阳光里小区', project: '西安阳光里小区', type: 'demolition', typeName: '拆除班组服务合同', flowId: 'sg', flowName: '基础施工服务', parentId: 1, parent: '基础施工服务合同-西安阳光里小区', amount: '￥28,000', status: 'pending_review', statusName: '合同待审核', statusClass: 'pending-review', time: '2024-01-24 14:30', rejectReason: '' },
            { id: 5, name: '木作班组服务合同-曲江新区别墅', project: '曲江新区别墅', type: 'muzuo', typeName: '木作班组服务合同', flowId: 'sg', flowName: '基础施工服务', amount: '￥68,000', status: 'reviewed_pass', statusName: '已通过', statusClass: 'confirmed', time: '2024-01-20 11:00', rejectReason: '' },
            { id: 6, name: '泥瓦工班组服务合同-卧龙区商铺', project: '卧龙区商铺', type: 'niwa', typeName: '泥瓦工班组服务合同', flowId: 'sg', flowName: '基础施工服务', amount: '￥42,000', status: 'change_reviewed_reject', statusName: '变更已驳回', statusClass: 'review-rejected', time: '2024-01-19 15:45', rejectReason: '变更金额超过合同总额20%，需甲方书面确认后重新提交' },
            { id: 7, name: '油漆工班组服务合同-海淀区写字楼', project: '海淀区写字楼', type: 'youqi', typeName: '油漆工班组服务合同', flowId: 'sg', flowName: '基础施工服务', amount: '￥55,000', status: 'reviewed_reject', statusName: '已驳回', statusClass: 'review-rejected', time: '2024-01-18 10:20', rejectReason: '合同金额与实际工程量不符，请核实后重新提交' },
            { id: 8, name: '小零工服务合同-宛城区住宅', project: '宛城区住宅', type: 'xiaolingong', typeName: '小零工服务合同', flowId: 'cz', flowName: '主材安装', amount: '￥32,000', status: 'reviewed_pass', statusName: '已通过', statusClass: 'confirmed', time: '2024-01-15 09:00', rejectReason: '' },
            { id: 9, name: '基础施工服务合同-大兴区别墅', project: '大兴区别墅', type: 'base', typeName: '基础施工服务合同', flowId: 'sg', flowName: '基础施工服务', amount: '￥72,000', status: 'change_reviewed_pass', statusName: '变更已通过', statusClass: 'confirmed', time: '2024-01-14 08:30', rejectReason: '' },
            { id: 10, name: '设计服务合同-通州区公寓', project: '通州区公寓', type: 'design', typeName: '设计服务合同', flowId: 'ht', flowName: '设计服务', amount: '￥38,000', status: 'reviewed_reject', statusName: '已驳回', statusClass: 'review-rejected', time: '2024-01-13 16:00', rejectReason: '设计图纸未附全，请补充后重新提交' },
            { id: 11, name: '水电班组服务合同-大兴区别墅', project: '大兴区别墅', type: 'shuidian', typeName: '水电班组服务合同', flowId: 'sg', flowName: '基础施工服务', parentId: 9, parent: '基础施工服务合同-大兴区别墅', amount: '￥85,000', status: 'change_reviewed_pass', statusName: '变更已通过', statusClass: 'confirmed', time: '2024-01-12 14:00', rejectReason: '' },
            { id: 12, name: '设计服务合同-高新区住宅', project: '高新区住宅', type: 'design', typeName: '设计服务合同', flowId: 'ht', flowName: '设计服务', amount: '￥48,000', status: 'change_reviewed_reject', statusName: '变更已驳回', statusClass: 'review-rejected', time: '2024-01-11 10:30', rejectReason: '变更内容描述不清晰，缺少具体设计范围说明' },
        ];

        function renderContractList() {
            const tbody = document.getElementById('contractTableBody');
            
            const contracts = allContracts.filter(c =>
                !WORKER_TYPES.includes(c.type) &&
                (c.status === 'pending_review' ||
                c.status === 'changing' ||
                c.status === 'reviewed_pass' ||
                c.status === 'reviewed_reject' ||
                c.status === 'change_reviewed_pass' ||
                c.status === 'change_reviewed_reject' ||
                c.status === 'contract_withdrawn' ||
                c.status === 'change_withdrawn')
            );
            
            // Apply current filter
            const statusFilter = document.getElementById('statusFilter');
            const typeFilter = document.getElementById('typeFilter');
            const flowFilter = document.getElementById('flowFilter');
            const searchInput = document.getElementById('searchInput');
            const statusVal = statusFilter ? statusFilter.value : '';
            const typeVal = typeFilter ? typeFilter.value : '';
            const flowVal = flowFilter ? flowFilter.value : '';
            const keyword = searchInput ? searchInput.value.toLowerCase() : '';
            const filtered = contracts.filter(function(c) {
                if (statusVal && c.status !== statusVal) return false;
                if (typeVal && c.type !== typeVal) return false;
                if (flowVal && c.flowId !== flowVal) return false;
                if (keyword && (c.name + c.project + c.flowName).toLowerCase().indexOf(keyword) === -1) return false;
                return true;
            });

            // Paginate
            var start = (currentPage - 1) * pageSize;
            var pageData = filtered.slice(start, start + pageSize);
            
            tbody.innerHTML = pageData.map(c => {
                let actionBtns = '';
                let rejectReasonHtml = '';
                
                if (c.status === 'pending_review') {
                    actionBtns = `<button class="action-btn primary" onclick="goToReview(${c.id}, 'contract')">去审核</button>`;
                } else if (c.status === 'changing') {
                    actionBtns = `<button class="action-btn primary" onclick="goToReview(${c.id}, 'change')">去审核</button>`;
                } else if (c.status === 'reviewed_pass') {
                    actionBtns = `<span style="color: var(--success-color);">✓ 已通过</span>`;
                } else if (c.status === 'reviewed_reject') {
                    actionBtns = `<span style="color: var(--error-color);">✗ 已驳回</span>`;
                    if (c.rejectReason) {
                        rejectReasonHtml = `<div style="font-size: 12px; color: var(--error-color); margin-top: 4px;" title="${c.rejectReason}">驳回原因：${c.rejectReason.length > 20 ? c.rejectReason.substring(0, 20) + '...' : c.rejectReason}</div>`;
                    }
                } else if (c.status === 'change_reviewed_pass') {
                    actionBtns = `<span style="color: var(--success-color);">✓ 变更已通过</span>`;
                } else if (c.status === 'change_reviewed_reject') {
                    actionBtns = `<span style="color: var(--error-color);">✗ 变更已驳回</span>`;
                    if (c.rejectReason) {
                        rejectReasonHtml = `<div style="font-size: 12px; color: var(--error-color); margin-top: 4px;" title="${c.rejectReason}">驳回原因：${c.rejectReason.length > 20 ? c.rejectReason.substring(0, 20) + '...' : c.rejectReason}</div>`;
                    }
                } else if (c.status === 'contract_withdrawn' || c.status === 'change_withdrawn') {
                    actionBtns = `<button class="action-btn default" onclick="viewContract(${c.id}, '${c.status}', '')">查看</button>`;
                }
                
                const childCount = contracts.filter(function (x) { return x.parentId === c.id; }).length;
                const treeBtn = childCount
                    ? `<button class="tree-toggle" title="展开/收起子合同" onclick="toggleContractTree(${c.id})">${collapsedParents[c.id] ? '▸' : '▾'}</button>`
                    : '';
                const subTag = c.parentId
                    ? `<span class="sub-contract-tag" title="上级合同：${c.parent || ''}">↳ 子合同</span>`
                    : '';
                const hidden = c.parentId && collapsedParents[c.parentId] ? ' display:none;' : '';

                return `
                    <tr data-status="${c.status}" data-type="${c.type}" data-flow="${c.flowId}" data-id="${c.id}"${c.parentId ? ' data-parent-id="' + c.parentId + '"' : ''} class="${c.parentId ? 'child-row' : 'parent-row'}" style="${hidden}">
                        <td>${c.parentId ? '<span class="tree-indent"></span>' : ''}${treeBtn}<span class="contract-name" onclick="viewContract(${c.id}, '${c.status}', '')">${c.name}</span>${subTag}</td>
                        <td><span class="project-link" onclick="viewProject(${c.id})">${c.project}</span></td>
                        <td>${c.typeName}</td>
                        <td><span class="flow-tag">${c.flowName}</span></td>
                        <td>${getMaskedAmountList(c)}</td>
                        <td><span class="status-tag ${c.statusClass}">${c.statusName}</span></td>
                        <td>${c.time}</td>
                        <td>
                            <div class="action-btns">${actionBtns}</div>
                            ${rejectReasonHtml}
                        </td>
                    </tr>
                `;
            }).join('');

            renderPagination(filtered);
        }

        function goToReview(id, type) {
            if (type === 'contract') {
                window.location.href = 'pc-contract-detail.html?id=' + id + '&status=platform_reviewing';
            } else if (type === 'change') {
                window.location.href = 'pc-contract-detail.html?id=' + id + '&status=change_reviewing';
            }
        }

        function filterContracts() {
            currentPage = 1;
            // 筛选变化时复位父子折叠，避免子合同命中筛选却被折叠隐藏
            Object.keys(collapsedParents).forEach(function (k) { delete collapsedParents[k]; });
            renderContractList();
        }

        function resetFilters() {
            document.getElementById('statusFilter').value = '';
            document.getElementById('typeFilter').value = '';
            document.getElementById('flowFilter').value = '';
            document.getElementById('searchInput').value = '';
            filterContracts();
        }

        function viewContract(id, status, rejectReason) {
            let targetStatus = status;
            let wtype = '';
            
            if (status === 'pending_review') {
                targetStatus = 'platform_reviewing';
            } else if (status === 'changing') {
                targetStatus = 'change_reviewing';
            } else if (status === 'contract_withdrawn') {
                targetStatus = 'withdrawn';
                wtype = 'contract';
            } else if (status === 'change_withdrawn') {
                targetStatus = 'withdrawn';
                wtype = 'change';
            }
            
            let url = 'pc-contract-detail.html?id=' + id + '&status=' + targetStatus;
            if (wtype) {
                url += '&wtype=' + wtype;
            }
            if (rejectReason) {
                url += '&rejectReason=' + encodeURIComponent(rejectReason);
            }
            location.href = url;
        }

        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('pc-modal-overlay')) {
                e.target.classList.remove('show');
            }
        });

        let currentPage = 1;
        const pageSize = 10;

        function renderPagination(filteredContracts) {
            var totalCount = filteredContracts.length;
            var totalPages = Math.ceil(totalCount / pageSize) || 1;
            var resultCount = document.getElementById('resultCount');
            if (resultCount) resultCount.textContent = '共 ' + totalCount + ' 条';

            var pagination = document.querySelector('.pc-pagination');
            if (!pagination) return;

            // Remove existing page items (keep resultCount span)
            var items = pagination.querySelectorAll('.pc-pagination-item');
            items.forEach(function(item) { item.remove(); });

            // Prev
            var prev = document.createElement('div');
            prev.className = 'pc-pagination-item' + (currentPage <= 1 ? ' disabled' : '');
            prev.textContent = '‹';
            if (currentPage > 1) prev.onclick = function() { currentPage--; renderContractList(); };
            pagination.appendChild(prev);

            // Page numbers
            for (var p = 1; p <= totalPages; p++) {
                var pageItem = document.createElement('div');
                pageItem.className = 'pc-pagination-item' + (p === currentPage ? ' active' : '');
                pageItem.textContent = p;
                if (p !== currentPage) pageItem.onclick = (function(page) { return function() { currentPage = page; renderContractList(); }; })(p);
                pagination.appendChild(pageItem);
            }

            // Next
            var next = document.createElement('div');
            next.className = 'pc-pagination-item' + (currentPage >= totalPages ? ' disabled' : '');
            next.textContent = '›';
            if (currentPage < totalPages) next.onclick = function() { currentPage++; renderContractList(); };
            pagination.appendChild(next);
        }

        applyUrlContext();
        renderContractList();