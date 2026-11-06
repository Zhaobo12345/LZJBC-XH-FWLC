# -*- coding: utf-8 -*-
"""
修复 task-list.html 两处折叠失效（仅改本页）：
 A.「收起全部 / 展开全部」：原 expandAllContracts 只遍历 .contract-section 内的容器，
    漏掉主合同自身 .mc-own、临时任务 .temp-stage-tasks/.temp-loose-list、快照流程项直铺任务；
    且 filterTasks 末尾 restoreExpandState() 会把展开态弹回首次全展开快照。
 B.「50 任务」主合同头：层级修正后在 .mc-header 后插入了 .mc-own，
    toggleMainContract() 的 nextElementSibling 变成 .mc-own（无 .show 样式），
    真正的 .mc-children 完全没被操作 → 点击无视觉变化。
铁律：encoding='utf-8' + newline=''（保留 18 个 BOM 与纯 LF），禁用 utf-8-sig。
"""
import io

P = "task-list.html"
src = io.open(P, "r", encoding="utf-8", newline="").read()
before_bom = src.count("\ufeff")


def rep(old, new, label, cnt=1):
    global src
    n = src.count(old)
    assert n == cnt, "%s: expect %d match, got %d" % (label, cnt, n)
    src = src.replace(old, new, cnt)
    print("OK  %-40s x%d" % (label, cnt))


# ---------- 1. CSS：主合同整体折叠（不依赖兄弟节点顺序，且 !important 抗 restore 覆盖） ----------
rep(
    "        .task-panel .flow-body { padding-top: 8px; }\n",
    "        .task-panel .flow-body { padding-top: 8px; }\n"
    "        /* 主合同整体折叠：以 .main-contract 为单位，覆盖 .mc-own / .mc-sub-band / .mc-children */\n"
    "        .main-contract.collapsed > :not(.mc-header) { display: none !important; }\n",
    "1 CSS 主合同折叠",
)

# ---------- 2. initExpandAll：初始化后重建展开态快照 ----------
rep(
    """            var btn = document.querySelector('.expand-all-btn');
            if (btn) btn.textContent = '收起全部';
        }
""",
    """            var btn = document.querySelector('.expand-all-btn');
            if (btn) btn.textContent = '收起全部';
            document.querySelectorAll('.task-panel .main-contract').forEach(function (mc) { mc.classList.remove('collapsed'); });
            syncExpandSnapshot();
        }
""",
    "2 initExpandAll 重建快照",
)

# ---------- 3. 各 toggle 折叠函数：操作后同步快照，避免被 filterTasks 弹回 ----------
# toggleContract
rep(
    """            } else {
                stageGroup.classList.add('show');
                arrow.classList.add('expanded');
            }
        }
        
        function toggleStage(header) {""",
    """            } else {
                stageGroup.classList.add('show');
                arrow.classList.add('expanded');
            }
            syncExpandSnapshot();
        }
        
        function toggleStage(header) {""",
    "3a toggleContract 同步快照",
)
# toggleStage
rep(
    """            } else {
                taskList.classList.add('show');
                arrow.classList.add('expanded');
            }
        }
        
        function toggleTempTasks(header) {""",
    """            } else {
                taskList.classList.add('show');
                arrow.classList.add('expanded');
            }
            syncExpandSnapshot();
        }
        
        function toggleTempTasks(header) {""",
    "3b toggleStage 同步快照",
)
# toggleTempTasks
rep(
    """            } else {
                taskList.classList.add('show');
                arrow.classList.add('expanded');
            }
        }
        
        function toggleFlowItem(header) {""",
    """            } else {
                taskList.classList.add('show');
                arrow.classList.add('expanded');
            }
            syncExpandSnapshot();
        }
        
        function toggleFlowItem(header) {""",
    "3c toggleTempTasks 同步快照",
)
# toggleFlowItem
rep(
    """            } else {
                body.classList.add('show');
                arrow.classList.add('expanded');
            }
        }

        function toggleMainContract(header) {""",
    """            } else {
                body.classList.add('show');
                arrow.classList.add('expanded');
            }
            syncExpandSnapshot();
        }

        function toggleMainContract(header) {""",
    "3d toggleFlowItem 同步快照",
)
# toggleTempStage（新架构临时阶段卡）
rep(
    """            var show = box.classList.toggle('show');
            var a = el.querySelector('.arrow');
            if (a) a.classList.toggle('expanded', show);
        }""",
    """            var show = box.classList.toggle('show');
            var a = el.querySelector('.arrow');
            if (a) a.classList.toggle('expanded', show);
            syncExpandSnapshot();
        }""",
    "3e toggleTempStage 同步快照",
)

# ---------- 4. toggleMainContract 重写 ----------
rep(
    """        function toggleMainContract(header) {
            const children = header.nextElementSibling;
            const arrow = header.querySelector('.arrow');
            if (children.classList.contains('show')) {
                children.classList.remove('show');
                arrow.classList.remove('expanded');
            } else {
                children.classList.add('show');
                arrow.classList.add('expanded');
            }
        }
""",
    """        function toggleMainContract(header) {
            const mc = header.closest('.main-contract');
            if (!mc) return;
            // 层级修正后 .mc-header 的 nextElementSibling 是 .mc-own，不能再按兄弟节点折叠；
            // 改为以整个主合同为单位切 .collapsed，覆盖 .mc-own / .mc-sub-band / .mc-children。
            const collapsed = mc.classList.toggle('collapsed');
            const arrow = header.querySelector('.arrow');
            if (arrow) arrow.classList.toggle('expanded', !collapsed);
            syncExpandSnapshot();
        }
""",
    "4 toggleMainContract 重写",
)

# ---------- 5. expandAllContracts 重写 + 统一容器/快照工具 ----------
rep(
    """        function expandAllContracts() {
            const btn = document.querySelector('.expand-all-btn');
            const contractSections = document.querySelectorAll('.contract-section');
            
            if (allExpanded) {
                contractSections.forEach(section => {
                    const stageGroup = section.querySelector('.stage-group');
                    const arrow = section.querySelector('.contract-header .arrow');
                    stageGroup.classList.remove('show');
                    arrow.classList.remove('expanded');
                    
                    section.querySelectorAll('.task-list').forEach(list => list.classList.remove('show'));
                    section.querySelectorAll('.stage-header .arrow').forEach(a => a.classList.remove('expanded'));
                });
                btn.textContent = '展开全部';
                allExpanded = false;
            } else {
                contractSections.forEach(section => {
                    const stageGroup = section.querySelector('.stage-group');
                    const arrow = section.querySelector('.contract-header .arrow');
                    stageGroup.classList.add('show');
                    arrow.classList.add('expanded');
                    
                    section.querySelectorAll('.task-list').forEach(list => list.classList.add('show'));
                    section.querySelectorAll('.stage-header .arrow').forEach(a => a.classList.add('expanded'));
                });
                btn.textContent = '收起全部';
                allExpanded = true;
            }
        }
""",
    """        // 统一可折叠容器集合：覆盖主合同自身阶段、子合同阶段、临时任务阶段/单独任务、快照流程项直铺任务
        function expandBoxes() {
            return document.querySelectorAll('.task-panel .stage-group, .task-panel .task-list, .task-panel .temp-stage-tasks, .task-panel .temp-loose-list');
        }
        function syncArrowsFromState() {
            document.querySelectorAll('.task-panel .task-list, .task-panel .stage-group, .task-panel .temp-stage-tasks').forEach(function (el) {
                var h = el.previousElementSibling;
                var a = h && h.querySelector('.arrow');
                if (a) a.classList.toggle('expanded', el.classList.contains('show'));
            });
            document.querySelectorAll('.task-panel .main-contract').forEach(function (mc) {
                var a = mc.querySelector('.mc-header .arrow');
                if (a) a.classList.toggle('expanded', !mc.classList.contains('collapsed'));
            });
        }
        function setAllExpanded(expand) {
            expandBoxes().forEach(function (el) { el.classList.toggle('show', expand); });
            document.querySelectorAll('.task-panel .main-contract').forEach(function (mc) {
                mc.classList.toggle('collapsed', !expand);
            });
            syncArrowsFromState();
            var btn = document.querySelector('.expand-all-btn');
            if (btn) btn.textContent = expand ? '收起全部' : '展开全部';
            allExpanded = expand;
            syncExpandSnapshot();
        }
        function expandAllContracts() {
            setAllExpanded(!allExpanded);
        }
""",
    "5 expandAllContracts 重写",
)

# ---------- 6. snapshot/restore 改为统一容器快照（含临时任务容器） ----------
rep(
    """        let _defaultExpand = null;
        function snapshotExpandState() {
            if (_defaultExpand) return;
            _defaultExpand = { sg: new Map(), tl: new Map() };
            document.querySelectorAll('.stage-group').forEach(el => _defaultExpand.sg.set(el, el.classList.contains('show')));
            document.querySelectorAll('.task-list').forEach(el => _defaultExpand.tl.set(el, el.classList.contains('show')));
        }
        function restoreExpandState() {
            if (!_defaultExpand) return;
            _defaultExpand.sg.forEach((shouldShow, el) => {
                el.classList.toggle('show', shouldShow);
                const section = el.closest('.contract-section');
                const arrow = section && section.querySelector('.contract-header .arrow');
                if (arrow) arrow.classList.toggle('expanded', shouldShow);
            });
            _defaultExpand.tl.forEach((shouldShow, el) => {
                el.classList.toggle('show', shouldShow);
                const header = el.previousElementSibling;
                const arrow = header && header.querySelector('.arrow');
                if (arrow) arrow.classList.toggle('expanded', shouldShow);
            });
        }
""",
    """        let _defaultExpand = null;
        function syncExpandSnapshot() {
            // 记录用户最近一次手动设定的展开态，供 filterTasks 末尾 restore 复原，避免「点了又被弹回」
            _defaultExpand = new Map();
            expandBoxes().forEach(el => _defaultExpand.set(el, el.classList.contains('show')));
        }
        function snapshotExpandState() {
            if (_defaultExpand) return;
            _defaultExpand = new Map();
            expandBoxes().forEach(el => _defaultExpand.set(el, el.classList.contains('show')));
        }
        function restoreExpandState() {
            if (!_defaultExpand) return;
            _defaultExpand.forEach((shouldShow, el) => { el.classList.toggle('show', shouldShow); });
            syncArrowsFromState();
        }
""",
    "6 snapshot/restore 统一",
)

# ---------- 复验 ----------
assert src.count("\ufeff") == before_bom, "BOM count changed"
assert "\r\n" not in src, "line ending changed"
assert src.count("function syncExpandSnapshot()") == 1
assert src.count("function expandAllContracts()") == 1
assert "header.nextElementSibling" not in src[src.find("function toggleMainContract"):src.find("function expandBoxes")], "old toggleMainContract remains"

io.open(P, "w", encoding="utf-8", newline="").write(src)
print("WROTE", P, "| chars:", len(src))
