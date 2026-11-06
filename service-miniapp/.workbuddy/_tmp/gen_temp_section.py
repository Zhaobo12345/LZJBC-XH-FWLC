# -*- coding: utf-8 -*-
import re

PATH = r"C:/Users/123456/WorkBuddy/LZJBC-XH-FWLC/service-miniapp/task-list.html"
with open(PATH, "r", encoding="utf-8", newline="") as f:
    text = f.read()

# ---------- 1. CSS：在 .temp-tasks-list.show 之后插入分组样式 ----------
css_anchor = """        .temp-tasks-list.show {
            display: block;
        }"""
css_block = css_anchor + """

        .temp-flow-group {
            border-bottom: 1px solid var(--border-color);
        }

        .temp-flow-group:last-child {
            border-bottom: none;
        }

        .temp-flow-header {
            display: flex;
            align-items: center;
            padding: 8px 16px 8px 44px;
            font-size: 12px;
            font-weight: 600;
            color: var(--text-secondary);
            background-color: #FAF5FF;
        }

        .temp-flow-header .temp-flow-name {
            flex: 1;
        }

        .temp-flow-contract {
            font-size: 11px;
            font-weight: 500;
            color: #722ED1;
            background-color: rgba(114, 46, 209, 0.1);
            padding: 2px 8px;
            border-radius: 10px;
            margin-left: 8px;
        }"""
assert css_anchor in text, "css anchor not found"
text = text.replace(css_anchor, css_block, 1)

# ---------- 2. 数据：临时任务（来自 project-list.html 的 externals） ----------
# (flow_name, contract_label_or_None, [(name, exec, status_cn, [confirms])])
STATUS_MAP = {
    "已完成": ("completed", "✓", "已完成"),
    "进行中": ("confirming", "⏳", "确认中"),
    "未开始": ("pending", "○", "待开始"),
}
CURRENT_USER = "张三"

FLOW_DATA = [
    ("基础施工服务", "基础施工服务合同", [
        ("工地巡检", "王强", "已完成", []),
        ("材料进场验收", "李伟", "进行中", []),
        ("收口验收", "孙磊", "未开始", []),
        ("水电节点复检", "赵敏", "未开始", []),
        ("隐蔽工程旁站", "赵敏", "未开始", []),
        ("瓷砖/石材进场复验", "李伟", "已完成", ["孙磊", "王强"]),
        ("卫生间防水闭水旁站", "赵敏", "已完成", []),
        ("瓷砖空鼓与平整度抽检", "李伟", "进行中", []),
        ("吊顶龙骨间距抽检", "钱七", "进行中", ["孙磊"]),
        ("墙面腻子打磨验收", "钱七", "未开始", []),
        ("门套与柜体基层尺寸复核", "王强", "未开始", []),
        ("强弱电箱回路核对", "赵敏", "未开始", ["孙磊"]),
        ("成品保护巡查", "孙磊", "未开始", []),
        ("工地安全用电检查", "孙磊", "未开始", []),
        ("竣工前全面巡检", "王强", "未开始", ["孙磊", "李伟"]),
    ]),
    ("设计服务", "设计服务合同", [
        ("设计交底", "张设计", "已完成", []),
    ]),
]

def participant_of(exec_name, confirms):
    return "true" if (exec_name == CURRENT_USER or CURRENT_USER in confirms) else "false"

def grouped_html():
    groups = []
    for flow, contract_label, tasks in FLOW_DATA:
        items = []
        for name, exec_name, status_cn, confirms in tasks:
            sk, icon, stext = STATUS_MAP[status_cn]
            confirms_html = (" · 确认人：" + "、".join(confirms)) if confirms else ""
            part = participant_of(exec_name, confirms)
            items.append(
                '                    <div class="task-item" data-type="temp" data-status="%s" data-priority="normal" data-participant="%s" data-flowitem="%s" onclick="goToTaskDetail(this)">\n'
                '                        <div class="task-status %s">%s</div>\n'
                '                        <div class="task-info">\n'
                '                            <div class="task-name">%s</div>\n'
                '                            <div class="task-meta">执行人：%s%s</div>\n'
                '                        </div>\n'
                '                        <div class="task-status-text %s"><span class="status-icon">%s</span>%s</div>\n'
                '                    </div>' % (
                    sk, part, flow, sk, icon, name, exec_name, confirms_html, sk, icon, stext
                )
            )
        contract_chip = ('<span class="temp-flow-contract">关联合同：%s</span>' % contract_label) if contract_label else ""
        groups.append(
            '                <div class="temp-flow-group" data-flowitem="%s">\n'
            '                    <div class="temp-flow-header">\n'
            '                        <span class="temp-flow-name">%s</span>\n'
            '                        %s\n'
            '                    </div>\n'
            '                    %s\n'
            '                </div>' % (flow, flow, contract_chip, "\n                    ".join(items))
        )
    total = sum(len(t[2]) for t in FLOW_DATA)
    return (
        '            <div class="temp-tasks-section" id="tempTasksTop" data-temp-top="true">\n'
        '                <div class="temp-tasks-header" onclick="toggleTempTasks(this)">\n'
        '                    <span class="temp-tasks-icon">📋</span>\n'
        '                    <span class="temp-tasks-title">临时任务</span>\n'
        '                    <span class="temp-tasks-count">%d个任务</span>\n'
        '                    <span class="arrow expanded">▼</span>\n'
        '                </div>\n'
        '                <div class="temp-tasks-list show">\n'
        '%s\n'
        '                </div>\n'
        '            </div>' % (total, "\n".join(groups))
    )

def flat_html():
    items = []
    for flow, contract_label, tasks in FLOW_DATA:
        for name, exec_name, status_cn, confirms in tasks:
            sk, icon, stext = STATUS_MAP[status_cn]
            part = participant_of(exec_name, confirms)
            items.append(
                '                <div class="flat-task-item" data-status="%s" data-type="temp" data-participant="%s" onclick="goToTaskDetail(this)">\n'
                '                    <div class="task-status %s">%s</div>\n'
                '                    <div class="task-info">\n'
                '                        <div class="task-name">%s</div>\n'
                '                        <div class="task-meta">\n'
                '                            <span class="task-tag temp">临时</span>\n'
                '                            <span>%s</span>\n'
                '                            <span>执行人：%s</span>\n'
                '                        </div>\n'
                '                    </div>\n'
                '                    <div class="task-status-text %s">%s</div>\n'
                '                </div>' % (sk, part, sk, icon, name, flow, exec_name, sk, stext)
            )
    return "\n".join(items)

# ---------- 3. 注入顶层临时任务区（在 #taskContainer 内，紧邻 #emptyState 之前） ----------
empty_anchor = '            <div class="empty-state" id="emptyState"'
assert empty_anchor in text, "empty anchor not found"
text = text.replace(empty_anchor, grouped_html() + "\n\n" + empty_anchor, 1)

# ---------- 4. 注入扁平列表临时任务（#flatTaskList 内，末项之后） ----------
flat_anchor = '                <div class="task-status-text pending">待开始</div>\n                </div>\n            </div>'
assert flat_anchor in text, "flat anchor not found"
text = text.replace(flat_anchor, flat_anchor + "\n" + flat_html(), 1)

# ---------- 5. 修改 filterTasks：移除合同内嵌临时任务处理，新增顶层临时任务区扫描 ----------
# 5a. 删除死代码声明
text = text.replace(
    "                const stages = section.querySelectorAll('.stage-item');\n                const tempTasksSection = section.querySelector('.temp-tasks-section');\n                let contractVisibleCount = 0;",
    "                const stages = section.querySelectorAll('.stage-item');\n                let contractVisibleCount = 0;",
    1
)

# 5b. 删除 in-section 临时任务 if 块（含其收尾）
pattern = re.compile(
    r"                if \(tempTasksSection\) \{.*?tempTasksSection\.style\.display = 'none';\s*\}\s*\}",
    re.DOTALL,
)
assert pattern.search(text), "tempTasksSection block not found"
text = pattern.sub("", text, 1)

# 5c. 在 resultCount 更新前插入顶层临时任务区扫描循环
loop_code = '''            // 顶层临时任务区（独立，按服务流程项分组，与合同同层并列）
            const tempTopSections = document.querySelectorAll('.temp-tasks-section[data-temp-top="true"]');
            tempTopSections.forEach(function(section) {
                const flowGroups = section.querySelectorAll('.temp-flow-group');
                let tempTopVisible = 0;
                flowGroups.forEach(function(group) {
                    const tasks = group.querySelectorAll('.task-item');
                    let groupVisible = 0;
                    tasks.forEach(function(task) {
                        const taskType = task.dataset.type;
                        const taskStatus = task.dataset.status;
                        const taskParticipant = task.dataset.participant === 'true';
                        const taskName = task.querySelector('.task-name').textContent.toLowerCase();
                        let visible = true;
                        if (currentFilters.contract !== 'all') {
                            visible = false; // 临时任务归属服务流程项，不列入工种合同筛选
                        }
                        if (currentFilters.type !== 'all' && taskType !== currentFilters.type) visible = false;
                        if (currentFilters.status !== 'all' && taskStatus !== currentFilters.status) visible = false;
                        if (!passesRole(task, taskStatus, taskParticipant)) visible = false;
                        if (currentFilters.priority !== 'all' && task.dataset.priority !== currentFilters.priority) visible = false;
                        if (currentFilters.mine && !taskParticipant) visible = false;
                        if (searchText && !taskName.includes(searchText)) visible = false;
                        task.style.display = visible ? 'flex' : 'none';
                        if (visible) {
                            groupVisible++;
                            tempTopVisible++;
                            totalVisible++;
                            if (taskStatus === 'pending') pendingCount++;
                            else if (taskStatus === 'confirming') confirmingCount++;
                            else if (taskStatus === 'completed') completedCount++;
                        }
                    });
                    group.style.display = groupVisible > 0 ? 'block' : 'none';
                });
                section.style.display = tempTopVisible > 0 ? 'block' : 'none';
                const countEl = section.querySelector('.temp-tasks-count');
                if (countEl) countEl.textContent = tempTopVisible + '个任务';
            });

'''
result_anchor = "            document.getElementById('resultCount').textContent = '共 ' + totalVisible + ' 个任务';"
assert result_anchor in text, "result anchor not found"
text = text.replace(result_anchor, loop_code + result_anchor, 1)

with open(PATH, "w", encoding="utf-8", newline="") as f:
    f.write(text)

print("OK: temp section injected; flow groups=%d; total temp tasks=%d" % (
    len(FLOW_DATA), sum(len(t[2]) for t in FLOW_DATA)))
