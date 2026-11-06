# -*- coding: utf-8 -*-
import re

PATH = "task-list.html"
with open(PATH, "r", encoding="utf-8", newline="") as f:
    s = f.read()

def find_div_close(text, start):
    """start points at '<div'; return index just after matching '</div>'."""
    depth = 0
    for m in re.finditer(r'<div\b|</div>', text[start:]):
        if m.group() == '<div':
            depth += 1
        else:
            depth -= 1
            if depth == 0:
                return start + m.end()
    raise RuntimeError("unbalanced div at %d" % start)

def extract_block(text, marker):
    i = text.find(marker)
    if i < 0:
        raise RuntimeError("marker not found: " + marker)
    start = text.rfind('<div', 0, i + len(marker))
    end = find_div_close(text, start)
    return text[start:end], end

# 1) 提取 4 张工种合同（保留内部全部阶段/任务数据，原样）
contracts = []
for n in (1, 2, 3, 4):
    marker = '<div class="contract-section" data-contract="contract-%d"' % n
    blk, _ = extract_block(s, marker)
    contracts.append(blk)

# 2) 提取临时任务区并拆分两个服务流程项分组
temp_marker = '<div class="temp-tasks-section" id="tempTasksTop" data-temp-top="true">'
temp_block, _ = extract_block(s, temp_marker)

def extract_group(block, flowitem):
    marker = '<div class="temp-flow-group" data-flowitem="%s"' % flowitem
    grp, _ = extract_block(block, marker)
    # 去掉分组头（temp-flow-header，内部无嵌套 div）
    grp = re.sub(r'<div class="temp-flow-header">[\s\S]*?</div>', '', grp, count=1)
    # 提取组内的临时任务条目（data-type="temp"）
    items = []
    for m in re.finditer(r'<div class="task-item" data-type="temp"', grp):
        st = m.start()
        en = find_div_close(grp, grp.rfind('<div', 0, st + 10))
        items.append(grp[st:en])
    return "\n".join(items)

sg_temps = extract_group(temp_block, "基础施工服务")
ht_temps = extract_group(temp_block, "设计服务")

print("contracts:", [len(c) for c in contracts])
print("sg temps chars:", len(sg_temps), "ht temps chars:", len(ht_temps))
print("sg task-item count:", sg_temps.count('data-type="temp"'))
print("ht task-item count:", ht_temps.count('data-type="temp"'))

DESIGN_CONTRACT = '''
                <div class="contract-section" data-contract="contract-design" data-level="设计服务">
                    <div class="contract-header" onclick="toggleContract(this)">
                        <div class="contract-icon" style="background: linear-gradient(135deg, #1677FF 0%, #4096FF 100%);">📄</div>
                        <div class="contract-main">
                            <div class="contract-name">设计服务合同</div>
                            <div class="contract-footer-row">
                                <div class="contract-meta">设计服务 · 2个阶段 · 6个任务</div>
                                <div class="contract-progress">
                                    <div class="progress-track"><div class="progress-fill"></div></div>
                                    <div class="progress-text">已完成 0/0</div>
                                </div>
                            </div>
                        </div>
                        <div class="arrow">▼</div>
                    </div>
                    <div class="stage-group">
                        <div class="stage-item">
                            <div class="stage-header" onclick="toggleStage(this)">
                                <div class="stage-dot completed"></div>
                                <div class="stage-name">方案设计阶段</div>
                                <div class="stage-count">3/3 已完成</div>
                                <div class="arrow">▼</div>
                            </div>
                            <div class="task-list">
                                <div class="task-item" data-type="contract" data-status="completed" data-priority="normal" data-participant="true" onclick="goToTaskDetail(this)">
                                    <div class="task-status completed">✓</div>
                                    <div class="task-info"><div class="task-name">原始量房尺寸复测</div><div class="task-meta">执行人：张设计 · 确认人：陈庄</div></div><div class="task-status-text completed"><span class="status-icon">✓</span>已完成</div>
                                </div>
                                <div class="task-item" data-type="contract" data-status="completed" data-priority="normal" data-participant="true" onclick="goToTaskDetail(this)">
                                    <div class="task-status completed">✓</div>
                                    <div class="task-info"><div class="task-name">户型优化方案</div><div class="task-meta">执行人：张设计 · 确认人：陈庄</div></div><div class="task-status-text completed"><span class="status-icon">✓</span>已完成</div>
                                </div>
                                <div class="task-item" data-type="contract" data-status="completed" data-priority="normal" data-participant="true" onclick="goToTaskDetail(this)">
                                    <div class="task-status completed">✓</div>
                                    <div class="task-info"><div class="task-name">方案评审与定稿</div><div class="task-meta">执行人：张设计 · 确认人：陈庄</div></div><div class="task-status-text completed"><span class="status-icon">✓</span>已完成</div>
                                </div>
                            </div>
                        </div>
                        <div class="stage-item">
                            <div class="stage-header" onclick="toggleStage(this)">
                                <div class="stage-dot completed"></div>
                                <div class="stage-name">施工图设计阶段</div>
                                <div class="stage-count">3/3 已完成</div>
                                <div class="arrow">▼</div>
                            </div>
                            <div class="task-list">
                                <div class="task-item" data-type="contract" data-status="completed" data-priority="normal" data-participant="true" onclick="goToTaskDetail(this)">
                                    <div class="task-status completed">✓</div>
                                    <div class="task-info"><div class="task-name">平立面布置图</div><div class="task-meta">执行人：张设计 · 确认人：陈庄</div></div><div class="task-status-text completed"><span class="status-icon">✓</span>已完成</div>
                                </div>
                                <div class="task-item" data-type="contract" data-status="completed" data-priority="normal" data-participant="true" onclick="goToTaskDetail(this)">
                                    <div class="task-status completed">✓</div>
                                    <div class="task-info"><div class="task-name">水电点位深化图</div><div class="task-meta">执行人：张设计 · 确认人：陈庄</div></div><div class="task-status-text completed"><span class="status-icon">✓</span>已完成</div>
                                </div>
                                <div class="task-item" data-type="contract" data-status="completed" data-priority="normal" data-participant="true" onclick="goToTaskDetail(this)">
                                    <div class="task-status completed">✓</div>
                                    <div class="task-info"><div class="task-name">节点大样图</div><div class="task-meta">执行人：张设计 · 确认人：陈庄</div></div><div class="task-status-text completed"><span class="status-icon">✓</span>已完成</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
'''

SG_CARD = '''
                <div class="flow-item-card" data-flow="sg">
                    <div class="flow-item-header" onclick="toggleFlowItem(this)">
                        <div class="flow-icon">流</div>
                        <div class="flow-main">
                            <div class="flow-name">基础施工服务</div>
                            <div class="flow-meta">1 主合同 · 4 工种合同 · 临时任务 15</div>
                        </div>
                        <div class="arrow expanded">▼</div>
                    </div>
                    <div class="flow-body show">
                        <div class="flow-block contract-block">
                            <div class="block-band">合同内任务</div>
                            <div class="contract-tree">
                                <div class="main-contract" data-contract="base-sg">
                                    <div class="mc-header" onclick="toggleMainContract(this)">
                                        <div class="mc-icon">合</div>
                                        <div class="mc-name">基础施工服务合同</div>
                                        <div class="mc-count">17 任务</div>
                                        <div class="arrow expanded">▼</div>
                                    </div>
                                    <div class="mc-children show">
                                        {c1}
                                        {c2}
                                        {c3}
                                        {c4}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="flow-block temp-block">
                            <div class="block-band temp-band">临时任务 <span class="badge">15</span></div>
                            <div class="temp-tasks-list show">
                                {sg}
                            </div>
                        </div>
                    </div>
                </div>
'''.format(c1=contracts[0], c2=contracts[1], c3=contracts[2], c4=contracts[3], sg=sg_temps)

HT_CARD = '''
                <div class="flow-item-card" data-flow="ht">
                    <div class="flow-item-header" onclick="toggleFlowItem(this)">
                        <div class="flow-icon">流</div>
                        <div class="flow-main">
                            <div class="flow-name">设计服务</div>
                            <div class="flow-meta">1 合同 · 临时任务 1</div>
                        </div>
                        <div class="arrow expanded">▼</div>
                    </div>
                    <div class="flow-body show">
                        <div class="flow-block contract-block">
                            <div class="block-band">合同内任务</div>
                            <div class="contract-tree">
                                <div class="main-contract" data-contract="base-ht">
                                    <div class="mc-header" onclick="toggleMainContract(this)">
                                        <div class="mc-icon">合</div>
                                        <div class="mc-name">设计服务合同</div>
                                        <div class="mc-count">6 任务</div>
                                        <div class="arrow expanded">▼</div>
                                    </div>
                                    <div class="mc-children show">
                                        {design}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="flow-block temp-block">
                            <div class="block-band temp-band">临时任务 <span class="badge">1</span></div>
                            <div class="temp-tasks-list show">
                                {ht}
                            </div>
                        </div>
                    </div>
                </div>
'''.format(design=DESIGN_CONTRACT, ht=ht_temps)

# 替换 taskContainer 与 empty-state 之间的全部旧内容（4 张合同 + 旧临时任务区）
open_tag = '<div id="taskContainer">'
idx_open = s.index(open_tag)
idx_open_end = idx_open + len(open_tag)
idx_empty = s.index('<div class="empty-state" id="emptyState"')
new_inner = "\n" + SG_CARD + "\n" + HT_CARD + "\n"
new_s = s[:idx_open_end] + new_inner + s[idx_empty:]

with open(PATH, "w", encoding="utf-8", newline="") as f:
    f.write(new_s)

print("done; new file length:", len(new_s))
print("flow-item-card count:", new_s.count('class="flow-item-card"'))
print("temp-block count:", new_s.count('class="flow-block temp-block"'))
print("main-contract count:", new_s.count('class="main-contract"'))
