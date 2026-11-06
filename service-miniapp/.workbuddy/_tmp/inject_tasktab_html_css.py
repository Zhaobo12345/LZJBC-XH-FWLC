import re

P = "task-list.html"
with open(P, "r", encoding="utf-8", newline="") as f:
    s = f.read()

orig = s

def rep(old, new, cnt, label):
    global s
    n = s.count(old)
    assert n == cnt, "%s: expect %d occurrence(s), got %d" % (label, cnt, n)
    s = s.replace(old, new, cnt)
    print("OK", label)

# H1: head 只读引入服务流程配置脚本
rep("</style>\n</head>",
    "</style>\n    <script src=\"js/flow-config-store.js\"></script>\n</head>",
    1, "H1 head script")

# H5: 结果条初始文案（默认合同面板 / sg = 26），展开按钮与 allExpanded=true 对齐
rep('<span id="resultCount">共 42 个任务</span>',
    '<span id="resultCount">共 26 个任务</span>', 1, "H5 resultCount")
rep('<span class="expand-all-btn" onclick="expandAllContracts()">展开全部</span>',
    '<span class="expand-all-btn" onclick="expandAllContracts()">收起全部</span>', 1, "H5 expand btn")

# 旧流程项卡静态隐藏；JS migrateLegacyBlocks() 会把 block 搬入两面板后移除整卡
rep('<div class="flow-item-card" data-flow="sg">',
    '<div class="flow-item-card" data-flow="sg" style="display:none;">', 1, "legacy sg card hide")
rep('<div class="flow-item-card" data-flow="ht">',
    '<div class="flow-item-card" data-flow="ht" style="display:none;">', 1, "legacy ht card hide")

# H2: #taskContainer 开头插入 rail / 双 Tab / 两个互斥面板
SKELETON = """
                <div class="flow-rail" id="flowRail"></div>

                <div class="task-tab-bar" id="taskTabBar">
                    <button type="button" class="task-tab active" data-tab="contract" onclick="switchTaskTab('contract')">合同内任务<span class="task-tab-badge" id="tabBadgeContract">26</span></button>
                    <button type="button" class="task-tab" data-tab="temp" onclick="switchTaskTab('temp')">临时任务<span class="task-tab-badge" id="tabBadgeTemp">15</span></button>
                </div>

                <div class="task-panel is-active" id="panelContract" data-tab-panel="contract"></div>
                <div class="task-panel" id="panelTemp" data-tab-panel="temp"></div>

"""
rep('            <div id="taskContainer">\n',
    '            <div id="taskContainer">\n' + SKELETON, 1, "H2 skeleton")

# CSS: 追加到第一个 <style> 块末尾
CSS = """
        /* ===== 配置驱动流程项 rail + 双面板切换 Tab（本页新增） ===== */
        .flow-rail { display: flex; gap: 8px; overflow-x: auto; padding: 4px 0 10px; scrollbar-width: none; }
        .flow-rail::-webkit-scrollbar { display: none; }
        .flow-rail-item { flex: 0 0 auto; min-height: 44px; padding: 0 14px; border: 1px solid var(--border-color); border-radius: 10px; background: var(--bg-primary); color: var(--text-secondary); font-size: 13px; white-space: nowrap; cursor: pointer; }
        .flow-rail-item.active { background: var(--primary-color); border-color: var(--primary-color); color: #fff; font-weight: 600; }
        .task-tab-bar { display: flex; gap: 8px; margin-bottom: 12px; }
        .task-tab { flex: 1; min-height: 44px; display: flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid var(--border-color); border-radius: 10px; background: var(--bg-secondary); color: var(--text-secondary); font-size: 14px; font-weight: 600; cursor: pointer; }
        .task-tab.active[data-tab="contract"] { background: var(--primary-color); border-color: var(--primary-color); color: #fff; }
        .task-tab.active[data-tab="temp"] { background: #722ED1; border-color: #722ED1; color: #fff; }
        .task-tab-badge { min-width: 22px; padding: 1px 6px; border-radius: 9px; background: rgba(0,0,0,.08); font-size: 12px; font-weight: 500; }
        .task-tab.active .task-tab-badge { background: rgba(255,255,255,.28); color: #fff; }
        .task-panel { display: none; }
        .task-panel.is-active { display: block; }
        .flow-group { display: none; background: var(--bg-primary); border: 1px solid var(--border-color); border-left: 4px solid var(--primary-color); border-radius: 12px; margin-bottom: 12px; overflow: hidden; }
        .flow-group.is-active { display: block; }
        #panelTemp .flow-group { border-left-color: #722ED1; }
        .flow-group-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 44px; padding: 10px 14px; background: var(--bg-secondary); border-bottom: 1px solid var(--border-color); }
        .flow-group-name { font-size: 15px; font-weight: 600; color: var(--text-primary); }
        #panelTemp .flow-group-name { color: #722ED1; }
        .group-stat { font-size: 12px; color: var(--text-tertiary); }
        .block-empty { padding: 24px 16px; text-align: center; font-size: 13px; color: var(--text-tertiary); }
        .snapshot-note { padding: 8px 14px; font-size: 12px; color: #BA7517; background: #FAF3E4; }
        .stage-card { margin-left: 8px; border-left: 3px solid var(--primary-color); border-radius: 8px; }
        #panelTemp .task-item { border-left: 3px solid #722ED1; }

        /* 压平累计缩进：子合同卡头 -> 阶段卡 -> 任务行，仅两级 */
        .mc-children { padding-left: 0; border-left: none; margin-left: 0; }
        .stage-header { padding: 10px 14px; }
        .task-item { padding: 10px 14px; min-height: 44px; box-sizing: border-box; }
        .task-list { padding-left: 0; }

        /* 游离在 #flatTaskList 外的 16 条扁平快照项：节点保留、仅隐藏 */
        #taskContainer > .flat-task-item { display: none !important; }
"""
idx = s.find("</style>")
assert idx > 0, "first </style> not found"
s = s[:idx] + CSS + s[idx:]
print("OK CSS appended at first </style>")

# 写回：保持 BOM / LF 字节特征
with open(P, "w", encoding="utf-8", newline="") as f:
    f.write(s)

# 复验
b = open(P, "rb").read()
bom = 0
while b[bom:bom+3] == b"\xef\xbb\xbf":
    bom += 3
assert bom == 54, "BOM changed: %d" % bom
assert b.count(b"\r\n") == 0, "CRLF introduced"
now = b.decode("utf-8")
assert len(re.findall(r"<style[^>]*>", now)) == 2, "style block count changed"
assert len(re.findall(r"<script", now)) == 3, "script count: expect 3 (1 head + 2 old)"
assert now[:now.find("</head>")].count("<script") == 1, "head script must be exactly 1"
assert now.count('class="task-item"') == 48, "task-item count changed"
assert now.count('class="flat-task-item"') == 21, "flat-task-item count changed"
print("VERIFY OK | BOM bytes=%d | CRLF=0 | style=2 | script=3 | head script=1 | task-item=48 | flat=21" % bom)
