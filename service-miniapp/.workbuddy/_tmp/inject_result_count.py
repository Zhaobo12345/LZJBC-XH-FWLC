# -*- coding: utf-8 -*-
"""结果条口径：选中服务流程项时统计「合同内任务 + 临时任务」之和（跨 Tab、随筛选联动）；
Tab 文案「临时/流程任务」改回「临时任务」。精确字符串替换，保留 BOM / LF 字节特征。"""
import os

BASE = os.path.dirname(os.path.abspath(__file__))
HTML = os.path.join(BASE, '..', '..', 'task-list.html')


def read(p):
    with open(p, 'rb') as f:
        return f.read().decode('utf-8')


def write(p, s):
    with open(p, 'wb') as f:
        f.write(s.encode('utf-8'))


def apply(s, items):
    for name, old, new in items:
        n = s.count(old)
        if n != 1:
            raise SystemExit('ANCHOR FAIL [%s] count=%d' % (name, n))
        s = s.replace(old, new, 1)
        print('OK  ' + name)
    return s


h = read(HTML)

# ---------- 1. 文案：4 处「临时/流程任务」→「临时任务」 ----------
n = h.count('临时/流程任务')
if n != 4:
    raise SystemExit('ANCHOR FAIL [文案 4 处] count=%d' % n)
h = h.replace('临时/流程任务', '临时任务')
print('OK  Tab 文案 4 处 → 临时任务')

# ---------- 2. 抽出纯读筛选判定函数 ----------
FILTER_HEAD_OLD = """        function filterTasks() {
            const searchText = document.getElementById('searchInput').value.toLowerCase();"""
FILTER_HEAD_NEW = """        // 单条任务是否通过当前筛选条件（纯读、不改动 DOM；供结果条跨 Tab 复用）
        function taskPassesFilters(task, searchText) {
            const taskType = task.dataset.type;
            const taskStatus = task.dataset.status;
            const taskParticipant = task.dataset.participant === 'true';
            const nameEl = task.querySelector('.task-name');
            const taskName = nameEl ? nameEl.textContent.toLowerCase() : '';
            const section = task.closest('.contract-section');
            const isMainOwn = !!task.closest('.mc-own');
            // 架构层级过滤（URL ?level 契约）：整组显隐
            if (currentFilters.level && section && section.dataset.level !== currentFilters.level) return false;
            // 主合同自身阶段任务归属「项目部 / 主合同层」，指定具体工作组时不下发
            if (currentFilters.level && currentFilters.level !== '项目部' && isMainOwn) return false;
            if (currentFilters.contract !== 'all' && (!section || section.dataset.contract !== currentFilters.contract)) return false;
            if (currentFilters.type !== 'all' && taskType !== currentFilters.type) return false;
            if (currentFilters.status !== 'all' && taskStatus !== currentFilters.status) return false;
            if (!passesRole(task, taskStatus, taskParticipant)) return false;
            if (currentFilters.priority !== 'all' && task.dataset.priority !== currentFilters.priority) return false;
            if (currentFilters.mine && !taskParticipant) return false;
            if (searchText && !taskName.includes(searchText)) return false;
            return true;
        }

        function filterTasks() {
            const searchText = document.getElementById('searchInput').value.toLowerCase();"""

LOOP_OLD = """                scope.querySelectorAll('.task-item').forEach(function (task) {
                    const taskType = task.dataset.type;
                    const taskStatus = task.dataset.status;
                    const taskParticipant = task.dataset.participant === 'true';
                    const nameEl = task.querySelector('.task-name');
                    const taskName = nameEl ? nameEl.textContent.toLowerCase() : '';
                    const section = task.closest('.contract-section');
                    const isMainOwn = !!task.closest('.mc-own');
                    let visible = true;

                    // 架构层级过滤（URL ?level 契约）：整组显隐
                    if (currentFilters.level && section && section.dataset.level !== currentFilters.level) visible = false;
                    // 主合同自身阶段任务归属「项目部 / 主合同层」，指定具体工作组时不下发
                    if (currentFilters.level && currentFilters.level !== '项目部' && isMainOwn) visible = false;
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
                });"""
LOOP_NEW = """                scope.querySelectorAll('.task-item').forEach(function (task) {
                    const visible = taskPassesFilters(task, searchText);
                    task.style.display = visible ? 'flex' : 'none';
                    if (visible) {
                        expandAncestors(task);
                        totalVisible++;
                        if (task.dataset.status === 'pending') pendingCount++;
                        else if (task.dataset.status === 'confirming') confirmingCount++;
                        else if (task.dataset.status === 'completed') completedCount++;
                    }
                });"""

RESULT_OLD = """            document.getElementById('resultCount').textContent = (activeTab === 'mytasks')
                ? '我的任务 ' + totalVisible + ' 条' : '共 ' + totalVisible + ' 个任务';"""
RESULT_NEW = """            // 结果条口径：选中服务流程项 = 该项「合同内任务 + 临时任务」之和（跨 Tab、随筛选联动）
            // 与当前 Tab 无关；「我的任务」视图仍按当前作用域清单的可见条数呈现
            var resultTotal = totalVisible;
            if (activeTab !== 'mytasks') {
                resultTotal = 0;
                var resultFid = (scope && scope.getAttribute('data-flow-id')) || activeFlowId;
                ['panelContract', 'panelTemp'].forEach(function (pid) {
                    const p = document.getElementById(pid);
                    if (!p) return;
                    const g = p.querySelector('.flow-group[data-flow-id="' + resultFid + '"]');
                    if (!g) return;
                    g.querySelectorAll('.task-item').forEach(function (t) {
                        if (taskPassesFilters(t, searchText)) resultTotal++;
                    });
                });
            }
            document.getElementById('resultCount').textContent = (activeTab === 'mytasks')
                ? '我的任务 ' + totalVisible + ' 条' : '共 ' + resultTotal + ' 个任务';"""

h = apply(h, [
    ('抽出 taskPassesFilters', FILTER_HEAD_OLD, FILTER_HEAD_NEW),
    ('主循环复用判定函数', LOOP_OLD, LOOP_NEW),
    ('结果条跨 Tab 求和', RESULT_OLD, RESULT_NEW),
])

write(HTML, h)
print('DONE')
