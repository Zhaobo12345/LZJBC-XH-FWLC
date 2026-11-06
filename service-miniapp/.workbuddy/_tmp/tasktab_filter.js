        function filterTasks() {
            const searchText = document.getElementById('searchInput').value.toLowerCase();
            snapshotExpandState();
            const isFiltering = !(currentFilters.contract === 'all' && currentFilters.type === 'all' && currentFilters.status === 'all' && currentFilters.role === 'all' && currentFilters.priority === 'all' && !currentFilters.mine && !searchText);
            // 作用域 = 当前 Tab 面板 ∩ 当前选中服务流程项；合同/临时两类主体互斥
            const scope = activeTaskScope();
            let totalVisible = 0;
            let pendingCount = 0;
            let confirmingCount = 0;
            let completedCount = 0;

            if (scope) {
                scope.querySelectorAll('.task-item').forEach(function (task) {
                    const taskType = task.dataset.type;
                    const taskStatus = task.dataset.status;
                    const taskParticipant = task.dataset.participant === 'true';
                    const nameEl = task.querySelector('.task-name');
                    const taskName = nameEl ? nameEl.textContent.toLowerCase() : '';
                    const section = task.closest('.contract-section');
                    let visible = true;

                    // 架构层级过滤（URL ?level 契约）：整组显隐
                    if (currentFilters.level && section && section.dataset.level !== currentFilters.level) visible = false;
                    if (currentFilters.contract !== 'all' && (!section || section.dataset.contract !== currentFilters.contract)) visible = false;
                    if (currentFilters.type !== 'all' && taskType !== currentFilters.type) visible = false;
                    if (currentFilters.status !== 'all' && taskStatus !== currentFilters.status) visible = false;
                    if (!passesRole(task, taskStatus, taskParticipant)) visible = false;
                    if (currentFilters.priority !== 'all' && task.dataset.priority !== currentFilters.priority) visible = false;
                    if (currentFilters.mine && !taskParticipant) visible = false;
                    if (searchText && !taskName.includes(searchText)) visible = false;

                    task.style.display = visible ? 'flex' : 'none';
                    if (visible) {
                        expandAncestors(task);
                        totalVisible++;
                        if (taskStatus === 'pending') pendingCount++;
                        else if (taskStatus === 'confirming') confirmingCount++;
                        else if (taskStatus === 'completed') completedCount++;
                    }
                });

                // 容器收敛：无可见任务的阶段 / 子合同 / 主合同隐藏
                scope.querySelectorAll('.stage-item').forEach(function (st) {
                    let n = 0;
                    st.querySelectorAll('.task-item').forEach(function (t) { if (t.style.display !== 'none') n++; });
                    st.style.display = n > 0 ? 'block' : 'none';
                });
                scope.querySelectorAll('.contract-section').forEach(function (cs) {
                    let n = 0;
                    cs.querySelectorAll('.task-item').forEach(function (t) { if (t.style.display !== 'none') n++; });
                    cs.style.display = n > 0 ? 'block' : 'none';
                });
                scope.querySelectorAll('.main-contract').forEach(function (mc) {
                    let n = 0;
                    mc.querySelectorAll('.contract-section').forEach(function (cs) { if (cs.style.display !== 'none') n++; });
                    mc.style.display = n > 0 ? '' : 'none';
                });
            }

            document.getElementById('resultCount').textContent = '共 ' + totalVisible + ' 个任务';
            const emptyState = document.getElementById('emptyState');
            emptyState.style.display = totalVisible === 0 ? 'flex' : 'none';
            if (!isFiltering) restoreExpandState();
        }
