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

        let currentReviewId = null;
        let currentReviewType = null;

        // PC端 = 运营人员，默认全部权限
        var LIST_USER_PERMISSION = 'all';
        var LIST_USER_ID = 'platform-operator';

        function getMaskedAmountList(c) {
            if (!window.ContractAmountMask) return c.amount;
            return window.ContractAmountMask.format(c.amount, c, LIST_USER_PERMISSION, LIST_USER_ID);
        }

        const allContracts = [
            { id: 13, name: '基础施工服务合同-雁塔区撤回示例', project: '雁塔区别墅', type: 'base_construction', typeName: '基础施工服务合同', amount: '￥60,000', status: 'contract_withdrawn', statusName: '合同已撤回', statusClass: 'withdrawn', time: '2024-01-27 09:40', rejectReason: '' },
            { id: 14, name: '设计服务合同-未央区撤回示例', project: '未央区平层', type: 'design', typeName: '设计服务合同', amount: '￥30,000', status: 'change_withdrawn', statusName: '变更已撤回', statusClass: 'withdrawn', time: '2024-01-26 18:20', rejectReason: '' },
            { id: 1, name: '基础施工服务合同-西湖区别墅', project: '西湖区别墅', type: 'base_construction', typeName: '基础施工服务合同', amount: '￥50,000', status: 'pending_review', statusName: '合同待审核', statusClass: 'pending-review', time: '2024-01-26 10:30', rejectReason: '' },
            { id: 2, name: '设计服务合同-余杭区平层', project: '余杭区平层', type: 'design', typeName: '设计服务合同', amount: '￥35,000', status: 'pending_review', statusName: '合同待审核', statusClass: 'pending-review', time: '2024-01-26 09:15', rejectReason: '' },
            { id: 3, name: '基础施工服务合同-拱墅区公寓', project: '拱墅区公寓', type: 'base_construction', typeName: '基础施工服务合同', amount: '￥45,000', status: 'changing', statusName: '变更待审核', statusClass: 'changing', time: '2024-01-25 16:00', rejectReason: '' },
            { id: 4, name: '设计服务合同-滨江区住宅', project: '滨江区住宅', type: 'design', typeName: '设计服务合同', amount: '￥28,000', status: 'pending_review', statusName: '合同待审核', statusClass: 'pending-review', time: '2024-01-24 14:30', rejectReason: '' },
            { id: 5, name: '基础施工服务合同-萧山区别墅', project: '萧山区别墅', type: 'base_construction', typeName: '基础施工服务合同', amount: '￥68,000', status: 'reviewed_pass', statusName: '已通过', statusClass: 'confirmed', time: '2024-01-20 11:00', rejectReason: '' },
            { id: 6, name: '设计服务合同-上城区商铺', project: '上城区商铺', type: 'design', typeName: '设计服务合同', amount: '￥42,000', status: 'change_reviewed_reject', statusName: '变更已驳回', statusClass: 'review-rejected', time: '2024-01-19 15:45', rejectReason: '变更金额超过合同总额20%，需甲方书面确认后重新提交' },
            { id: 7, name: '基础施工服务合同-下城区写字楼', project: '下城区写字楼', type: 'base_construction', typeName: '基础施工服务合同', amount: '￥55,000', status: 'reviewed_reject', statusName: '已驳回', statusClass: 'review-rejected', time: '2024-01-18 10:20', rejectReason: '合同金额与实际工程量不符，请核实后重新提交' },
            { id: 8, name: '设计服务合同-江干区住宅', project: '江干区住宅', type: 'design', typeName: '设计服务合同', amount: '￥32,000', status: 'reviewed_pass', statusName: '已通过', statusClass: 'confirmed', time: '2024-01-15 09:00', rejectReason: '' },
            { id: 9, name: '基础施工服务合同-临平区别墅', project: '临平区别墅', type: 'base_construction', typeName: '基础施工服务合同', amount: '￥72,000', status: 'change_reviewed_pass', statusName: '变更已通过', statusClass: 'confirmed', time: '2024-01-14 08:30', rejectReason: '' },
            { id: 10, name: '设计服务合同-钱塘区公寓', project: '钱塘区公寓', type: 'design', typeName: '设计服务合同', amount: '￥38,000', status: 'reviewed_reject', statusName: '已驳回', statusClass: 'review-rejected', time: '2024-01-13 16:00', rejectReason: '设计图纸未附全，请补充后重新提交' },
            { id: 11, name: '基础施工服务合同-富阳区别墅', project: '富阳区别墅', type: 'base_construction', typeName: '基础施工服务合同', amount: '￥85,000', status: 'change_reviewed_pass', statusName: '变更已通过', statusClass: 'confirmed', time: '2024-01-12 14:00', rejectReason: '' },
            { id: 12, name: '设计服务合同-桐庐县住宅', project: '桐庐县住宅', type: 'design', typeName: '设计服务合同', amount: '￥48,000', status: 'change_reviewed_reject', statusName: '变更已驳回', statusClass: 'review-rejected', time: '2024-01-11 10:30', rejectReason: '变更内容描述不清晰，缺少具体设计范围说明' },
        ];

        function renderContractList() {
            const tbody = document.getElementById('contractTableBody');
            
            const contracts = allContracts.filter(c => 
                c.status === 'pending_review' || 
                c.status === 'changing' || 
                c.status === 'reviewed_pass' || 
                c.status === 'reviewed_reject' ||
                c.status === 'change_reviewed_pass' ||
                c.status === 'change_reviewed_reject' ||
                c.status === 'contract_withdrawn' ||
                c.status === 'change_withdrawn'
            );
            
            // Apply current filter
            const statusFilter = document.getElementById('statusFilter');
            const typeFilter = document.getElementById('typeFilter');
            const searchInput = document.getElementById('searchInput');
            const statusVal = statusFilter ? statusFilter.value : '';
            const typeVal = typeFilter ? typeFilter.value : '';
            const keyword = searchInput ? searchInput.value.toLowerCase() : '';
            const filtered = contracts.filter(function(c) {
                if (statusVal && c.status !== statusVal) return false;
                if (typeVal && c.type !== typeVal) return false;
                if (keyword && (c.name + c.project).toLowerCase().indexOf(keyword) === -1) return false;
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
                
                return `
                    <tr data-status="${c.status}" data-type="${c.type}">
                        <td><span class="contract-name" onclick="viewContract(${c.id}, '${c.status}', '')">${c.name}</span></td>
                        <td><span class="project-link" onclick="viewProject(${c.id})">${c.project}</span></td>
                        <td>${c.typeName}</td>
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
            renderContractList();
        }

        function resetFilters() {
            document.getElementById('statusFilter').value = '';
            document.getElementById('typeFilter').value = '';
            document.getElementById('searchInput').value = '';
            filterContracts();
        }

        function showReviewModal(id, type) {
            currentReviewId = id;
            currentReviewType = type;
            
            document.getElementById('reviewModalTitle').textContent = type === 'pass' ? '审核通过' : '审核驳回';
            document.getElementById('rejectReasonSection').style.display = type === 'reject' ? 'block' : 'none';
            document.getElementById('reviewConfirmBtn').textContent = type === 'pass' ? '确认通过' : '确认驳回';
            document.getElementById('reviewConfirmBtn').className = type === 'pass' ? 'pc-btn pc-btn-primary' : 'pc-btn pc-btn-danger';
            
            document.getElementById('reviewModal').classList.add('show');
        }

        function closeReviewModal() {
            document.getElementById('reviewModal').classList.remove('show');
            document.getElementById('rejectReason').value = '';
            currentReviewId = null;
            currentReviewType = null;
        }

        function confirmReview() {
            if (currentReviewType === 'reject') {
                const reason = document.getElementById('rejectReason').value.trim();
                if (!reason) {
                    alert('请输入驳回原因');
                    return;
                }
            }
            
            closeReviewModal();
            
            if (currentReviewType === 'pass') {
                showToast('✅', '审核通过', '合同已通过审核，将通知合同确认方');
            } else {
                showToast('⚠️', '审核驳回', '合同已驳回，将通知创建方进行修改');
            }
        }

        function showToast(icon, title, message) {
            document.getElementById('toastIcon').textContent = icon;
            document.getElementById('toastTitle').textContent = title;
            document.getElementById('toastMessage').textContent = message;
            document.getElementById('toastModal').classList.add('show');
        }

        function closeToastModal() {
            document.getElementById('toastModal').classList.remove('show');
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

        renderContractList();