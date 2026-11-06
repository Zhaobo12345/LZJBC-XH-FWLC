# -*- coding: utf-8 -*-
"""
方案 A（视觉归位）+ 清理 4 个死函数，仅改 task-list.html。
- 搜索框 + 筛选按钮 -> 一行工具条（含已选条件 chip 回显 + 角标）
- 角色胶囊 / 状态 6 项 / 已选标签 -> 底部筛选面板（状态改平铺网格）
- rail + Tab + 结果条 -> 一张导航卡
- 死函数 toggleFilterDropdown / closeFilterDropdown / quickFilter / toggleMultiOption 删除
- 零改动：筛选口径、Tab 互斥、折叠、URL 参数、跨 Tab 求和、配置驱动
保持 BOM / 纯 LF 字节特征：二进制读写。
"""
import os, sys

BASE = os.path.dirname(os.path.abspath(__file__))
P = os.path.normpath(os.path.join(BASE, '..', '..', 'task-list.html'))

raw = open(P, 'rb').read()
s = raw.decode('utf-8')
ls = s.split('\n')
print('before: bytes=%d BOM=%s CRLF=%d LF=%d' %
      (len(raw), raw[:3] == b'\xef\xbb\xbf', raw.count(b'\r\n'), raw.count(b'\n')))


def rep(old, new, tag):
    global s
    n = s.count(old)
    if n != 1:
        raise SystemExit('ANCHOR FAIL [%s] count=%d' % (tag, n))
    s = s.replace(old, new, 1)
    print('OK  %-28s old=%d lines -> new=%d lines' %
          (tag, len(old.split('\n')), len(new.split('\n'))))


def lines(a, b):
    """1-based inclusive line slice -> exact source text (no trailing newline)."""
    return '\n'.join(ls[a - 1:b])


# ==========================================================
# 1. CSS：.search-filter-bar 块 -> 工具条 / 面板 / 导航卡全套样式
# ==========================================================
NEW_CSS = """        .search-filter-bar {
            background-color: var(--bg-primary);
            padding: 4px 10px;
        }

        /* ===== 方案 A：工具条 + 底部筛选面板 + 导航卡（视觉归位，逻辑零改动） ===== */
        .tool-bar {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
            padding: 8px 12px;
            background-color: var(--bg-primary);
            border-bottom: 1px solid var(--border-color);
        }
        .tool-bar .search-input { flex: 1 1 auto; min-width: 0; height: 36px; }
        .tool-filter-btn {
            flex: 0 0 auto;
            min-height: 36px;
            padding: 0 14px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            border: 1px solid var(--border-color);
            border-radius: 18px;
            background: var(--bg-secondary);
            color: var(--text-secondary);
            font-size: 13px;
            cursor: pointer;
            white-space: nowrap;
        }
        .tool-filter-btn.active { border-color: var(--primary-color); background: var(--status-primary-bg); color: var(--primary-color); }
        .tool-filter-badge { min-width: 16px; height: 16px; line-height: 16px; padding: 0 4px; border-radius: 8px; background: var(--primary-color); color: #fff; font-size: 10px; text-align: center; }
        .tool-chips { flex: 0 0 100%; display: none; flex-wrap: wrap; gap: 6px; }
        .tool-chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 12px; background: var(--status-primary-bg); color: var(--primary-color); font-size: 11px; }
        .tool-chip .remove { cursor: pointer; font-size: 13px; line-height: 1; }
        .nav-card { background: var(--bg-primary); border-bottom: 1px solid var(--border-color); padding: 6px 12px 0; }
        .nav-card .flow-rail { padding: 0 0 6px; }
        .nav-card .flow-rail-item { min-height: 40px; }
        .nav-card .task-tab-bar { margin-bottom: 6px; }
        .nav-card .task-tab { min-height: 40px; }
        .nav-card .result-bar { border-bottom: none; border-top: 1px solid var(--border-color); padding: 4px 0; }
        .filter-sheet-mask { position: absolute; inset: 0; background: rgba(0,0,0,.38); z-index: 1190; display: none; }
        .filter-sheet-mask.show { display: block; }
        .filter-sheet {
            position: absolute;
            left: 0; right: 0; bottom: 0;
            z-index: 1200;
            background: var(--bg-primary);
            border-radius: 16px 16px 0 0;
            transform: translateY(102%);
            transition: transform .22s ease;
            max-height: 78%;
            overflow-y: auto;
        }
        .filter-sheet.show { transform: translateY(0); }
        .fs-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px 10px; font-size: 15px; font-weight: 600; color: var(--text-primary); }
        .fs-close { font-size: 22px; line-height: 1; color: var(--text-tertiary); cursor: pointer; padding: 0 4px; }
        .fs-section { padding: 6px 16px 10px; }
        .fs-label { font-size: 12px; color: var(--text-tertiary); margin-bottom: 8px; }
        .fs-section .quick-filter-bar { padding: 0; border-bottom: none; flex-wrap: wrap; gap: 8px; }
        .fs-section .quick-filter-btn { flex: 1 1 calc(50% - 8px); min-height: 40px; font-size: 13px; }
        .status-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .status-grid .status-dropdown-item { justify-content: center; min-height: 40px; padding: 8px; border: 1px solid var(--border-color); border-radius: 10px; background: var(--bg-secondary); font-size: 13px; }
        .status-grid .status-dropdown-item.active { border-color: var(--primary-color); }
        .fs-section .filter-tags { margin-top: 0; }
        .fs-foot { display: flex; gap: 10px; padding: 10px 16px 18px; border-top: 1px solid var(--border-color); }
        .fs-foot button { flex: 1; min-height: 44px; border-radius: 10px; font-size: 14px; cursor: pointer; }
        .fs-reset { border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-secondary); }
        .fs-done { border: 1px solid var(--primary-color); background: var(--primary-color); color: #fff; }"""
rep(lines(13, 16), NEW_CSS, 'css/tool-bar+sheet+navcard')

# ==========================================================
# 2. CSS：删除状态下拉（absolute/fixed + keyframes），状态改为面板内平铺
# ==========================================================
rep(lines(170, 198),
    "        /* 方案 A：状态筛选改为底部面板内平铺网格；原下拉 fixed 逃生定位与 document 点击监听已移除 */",
    'css/status-dropdown removed')

# ==========================================================
# 3. HTML：头部 6 个视觉行 -> 工具条 + 导航卡（ rail / Tab / 结果条合并 ）
# ==========================================================
NEW_HEAD = """            <!-- 方案 A：搜索 + 筛选入口合并为一行工具条（id / oninput 原样保留） -->
            <div class="tool-bar search-filter-bar" id="toolBar">
                <input type="text" class="search-input" placeholder="搜索任务名称..." id="searchInput" oninput="filterTasks()">
                <button type="button" class="tool-filter-btn" id="filterBtn" onclick="toggleFilterSheet()">筛选<span class="tool-filter-badge" id="filterBtnBadge" style="display:none">0</span></button>
                <div class="tool-chips" id="toolChips"></div>
            </div>

            <!-- 方案 A：流程项 rail + Tab + 结果条合并为一张导航卡 -->
            <div class="nav-card" id="navCard">
                <div class="flow-rail" id="flowRail"></div>

                <div class="task-tab-bar" id="taskTabBar">
                    <button type="button" class="task-tab" data-tab="mytasks" id="tabMyTasks" style="display:none" onclick="switchTaskTab('mytasks')">我的任务<span class="task-tab-badge" id="tabBadgeMyTasks">10</span></button>
                    <button type="button" class="task-tab active" data-tab="contract" onclick="switchTaskTab('contract')">合同任务<span class="task-tab-badge" id="tabBadgeContract">26</span></button>
                    <button type="button" class="task-tab" data-tab="temp" onclick="switchTaskTab('temp')">临时任务<span class="task-tab-badge" id="tabBadgeTemp">15</span></button>
                </div>

                <div class="result-bar">
                    <span id="resultCount">共 26 个任务</span>
                    <span class="expand-all-btn" onclick="expandAllContracts()">收起全部</span>
                </div>
            </div>

            <div id="taskContainer">

                <div class="task-panel" id="panelMyTasks" data-tab-panel="mytasks"></div>
                <div class="task-panel is-active" id="panelContract" data-tab-panel="contract"></div>
                <div class="task-panel" id="panelTemp" data-tab-panel="temp"></div>"""
rep(lines(1265, 1306), NEW_HEAD, 'html/head 6 rows -> 2')

# ==========================================================
# 4. HTML：底部筛选面板（整体搬入角色胶囊 / 状态 / 已选标签）
# ==========================================================
NEW_SHEET = """    <!-- 方案 A：底部筛选面板（角色胶囊 / 状态 / 已选条件整体搬入，id 与 onclick 全部原样） -->
    <div class="filter-sheet-mask" id="filterSheetMask" onclick="closeFilterSheet()"></div>
    <div class="filter-sheet" id="filterSheet">
        <div class="fs-head">筛选条件<span class="fs-close" onclick="closeFilterSheet()">×</span></div>
        <div class="fs-section">
            <div class="fs-label">任务归属</div>
            <div class="quick-filter-bar" id="roleFilterBar">
                <button type="button" class="quick-filter-btn active" data-role="all" onclick="applyPill('all', this)">全部</button>
                <button type="button" class="quick-filter-btn" data-role="mine" onclick="applyPill('mine', this)">我参与</button>
                <button type="button" class="quick-filter-btn" data-role="exec" onclick="applyPill('exec', this)">待我执行</button>
                <button type="button" class="quick-filter-btn" data-role="confirm" onclick="applyPill('confirm', this)">待我确认</button>
            </div>
        </div>
        <div class="fs-section">
            <div class="fs-label">任务状态</div>
            <div class="status-grid" id="statusDropdownMenu">
                <div class="status-dropdown-item active" data-status="all" onclick="selectStatus('all','全部状态',this)">全部状态</div>
                <div class="status-dropdown-item" data-status="pending" onclick="selectStatus('pending','待开始',this)">待开始</div>
                <div class="status-dropdown-item" data-status="config" onclick="selectStatus('config','待配置',this)">待配置</div>
                <div class="status-dropdown-item" data-status="executing" onclick="selectStatus('executing','执行中',this)">执行中</div>
                <div class="status-dropdown-item" data-status="confirming" onclick="selectStatus('confirming','确认中',this)">确认中</div>
                <div class="status-dropdown-item" data-status="completed" onclick="selectStatus('completed','已完成',this)">已完成</div>
            </div>
        </div>
        <div class="fs-section">
            <div class="fs-label">已选条件</div>
            <div class="filter-tags" id="filterTags" style="display: none;"></div>
        </div>
        <div class="fs-foot">
            <button type="button" class="fs-reset" onclick="resetAllFilters()">重置</button>
            <button type="button" class="fs-done" onclick="closeFilterSheet()">完成</button>
        </div>
    </div>
"""
rep("    </div>\n    \n    <div class=\"page-nav\">",
    "    </div>\n    \n" + NEW_SHEET + "    <div class=\"page-nav\">",
    'html/filter-sheet inserted')

# ==========================================================
# 5. JS：删除 toggleStatusDropdown（状态已平铺，fixed 逃生定位随之删除）
# ==========================================================
rep(lines(2958, 2993),
    "        // 方案 A：状态项在底部面板内平铺，单一选中仍由 selectStatus() 处理；原下拉 fixed 定位函数已删除。",
    'js/toggleStatusDropdown removed')

# ==========================================================
# 6. JS：两个死函数 -> 面板开合 / 重置三函数
# ==========================================================
NEW_SHEET_JS = """        // 方案 A：底部筛选面板开合（只控制显隐，不参与筛选计算）
        function toggleFilterSheet() {
            const sheet = document.getElementById('filterSheet');
            const mask = document.getElementById('filterSheetMask');
            if (!sheet || !mask) return;
            const show = !sheet.classList.contains('show');
            sheet.classList.toggle('show', show);
            mask.classList.toggle('show', show);
        }

        function closeFilterSheet() {
            const sheet = document.getElementById('filterSheet');
            const mask = document.getElementById('filterSheetMask');
            if (sheet) sheet.classList.remove('show');
            if (mask) mask.classList.remove('show');
        }

        // 一键清空全部筛选轴（含搜索词），复用既有 removeFilter 的复位口径
        function resetAllFilters() {
            currentFilters.contract = 'all';
            currentFilters.contractText = '全部合同';
            currentFilters.type = 'all';
            currentFilters.typeText = '全部类型';
            currentFilters.status = 'all';
            currentFilters.statusText = '全部状态';
            currentFilters.role = 'all';
            currentFilters.priority = 'all';
            currentFilters.mine = false;
            currentFilters.level = null;
            const si = document.getElementById('searchInput');
            if (si) si.value = '';
            syncPills();
            updateFilterTags();
            filterTasks();
        }
"""
rep(lines(3056, 3066), NEW_SHEET_JS.rstrip('\n'), 'js/dead funcs -> sheet api')

# ==========================================================
# 7. JS：updateFilterTags 追加工具条 chip 回显 + 筛选按钮角标
# ==========================================================
OLD_TAGS_TAIL = """            const filterBtn = document.getElementById('filterBtn');
            if (filterBtn) {
                if (tags.length > 0) {
                    filterBtn.classList.add('active');
                } else {
                    filterBtn.classList.remove('active');
                }
            }
        }"""
NEW_TAGS_TAIL = """            const filterBtn = document.getElementById('filterBtn');
            if (filterBtn) {
                if (tags.length > 0) {
                    filterBtn.classList.add('active');
                } else {
                    filterBtn.classList.remove('active');
                }
            }
            // 方案 A：工具条回显已选条件（不必打开面板即可 × 清除），角标 = 条件数
            const chips = document.getElementById('toolChips');
            if (chips) {
                chips.innerHTML = tags.map(tag => `
                    <span class="tool-chip">
                        <span>${escTxt(tag.text)}</span>
                        ${tag.type !== 'level' ? `<span class="remove" onclick="removeFilter('${tag.type}')">×</span>` : ''}
                    </span>
                `).join('');
                chips.style.display = tags.length > 0 ? 'flex' : 'none';
            }
            const fBadge = document.getElementById('filterBtnBadge');
            if (fBadge) {
                fBadge.textContent = tags.length;
                fBadge.style.display = tags.length > 0 ? 'inline-block' : 'none';
            }
        }"""
rep(OLD_TAGS_TAIL, NEW_TAGS_TAIL, 'js/updateFilterTags chips')

# ==========================================================
# 8. JS：switchTaskTab 滚动定位由 rail 改为导航卡
# ==========================================================
rep("""            try {
                var content = document.querySelector('.page-content');
                if (content && rail && content.scrollTop !== undefined) content.scrollTop = Math.max(0, (rail.offsetTop || 0) - 8);
            } catch (e) {}""",
    """            try {
                var content = document.querySelector('.page-content');
                var navCard = document.getElementById('navCard');
                if (content && navCard && content.scrollTop !== undefined) content.scrollTop = Math.max(0, (navCard.offsetTop || 0) - 8);
            } catch (e) {}""",
    'js/scroll -> navCard')

# ==========================================================
# 9. JS：删除 document 点击监听 + 两个死函数（toggleMultiOption / quickFilter）
# ==========================================================
rep(lines(3426, 3456),
    "        // 方案 A：状态已平铺，document 点击关闭下拉的监听及旧 quickFilter / toggleMultiOption 死函数已删除。",
    'js/doc listener + 2 dead funcs removed')

# ==========================================================
# 10. JS：switchView 同步导航卡显隐（容器归属变化的适配）
# ==========================================================
rep("""            const resultBar = document.querySelector('.result-bar');
            
            if (view === 'flat') {
                taskContainer.style.display = 'none';""",
    """            const resultBar = document.querySelector('.result-bar');
            const navCard = document.getElementById('navCard');
            
            if (view === 'flat') {
                taskContainer.style.display = 'none';
                if (navCard) navCard.style.display = 'none';""",
    'js/switchView flat')
rep("""            } else {
                taskContainer.style.display = 'block';
                flatList.classList.remove('show');""",
    """            } else {
                taskContainer.style.display = 'block';
                if (navCard) navCard.style.display = '';
                flatList.classList.remove('show');""",
    'js/switchView grouped')

# ==========================================================
# 11. 过时注释同步
# ==========================================================
rep("    <!-- 高级筛选面板已移除（2026-09-03），筛选仅保留角色胶囊 + 状态下拉 -->",
    "    <!-- 高级筛选面板已移除（2026-09-03）；方案 A 后筛选收拢至底部面板：角色胶囊 + 状态平铺 -->",
    'comment/legacy panel')
rep("            // 状态下拉已改由行内 onclick 直连 toggleStatusDropdown/selectStatus，旧监听移除避免重复绑定。",
    "            // 方案 A：状态项在底部面板内平铺，行内 onclick 直连 selectStatus()；无下拉、无需 document 点击监听。",
    'comment/status dropdown')

# ==========================================================
out = s.encode('utf-8')
open(P, 'wb').write(out)
print('after : bytes=%d BOM=%s CRLF=%d LF=%d' %
      (len(out), out[:3] == b'\xef\xbb\xbf', out.count(b'\r\n'), out.count(b'\n')))
print('DONE')
