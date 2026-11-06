# -*- coding: utf-8 -*-
"""方案 B：A 的 8 项纯 CSS 质感升级 + 3 类装饰节点（结果条数字 / 空态线性图标 / 面板 drag handle）。
只改 task-list.html；保持 BOM + 纯 LF；id / onclick / data-* / 筛选 / Tab / 折叠 / URL 逻辑零改动。"""
import os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
P = os.path.normpath(os.path.join(HERE, '..', '..', 'task-list.html'))

b = open(P, 'rb').read()
s = b.decode('utf-8')


def apply(old, new, label, n=1):
    global s
    c = s.count(old)
    if c != n:
        print('FAIL %s: expect %d occurrence(s), got %d' % (label, n, c))
        sys.exit(1)
    s = s.replace(old, new)
    print('OK  %s' % label)


# ==================== 1. 装饰节点：结果条数字 span ====================
apply('<span id="resultCount">共 26 个任务</span>',
      '<span id="resultCount">共 <b class="rc-num">26</b> 个任务</span>',
      '结果条初始 HTML 数字节点')

apply("""            document.getElementById('resultCount').textContent = (activeTab === 'mytasks')
                ? '我的任务 ' + totalVisible + ' 条' : '共 ' + resultTotal + ' 个任务';""",
      """            // UI Polish B：数字独立节点（textContent 文案与此前完全一致）
            document.getElementById('resultCount').innerHTML = (activeTab === 'mytasks')
                ? '我的任务 <b class="rc-num">' + totalVisible + '</b> 条'
                : '共 <b class="rc-num">' + resultTotal + '</b> 个任务';""",
      '结果条赋值改 innerHTML + rc-num')

# ==================== 2. 装饰节点：空态线性图标（4 处） ====================
ICON = "'<span class=\"be-icon\" aria-hidden=\"true\"></span>' +"

apply("""                return '<div class="flow-block contract-block"><div class="block-empty">' +
                    '<span class="snapshot-empty-title">' + title + '</span>' +""",
      """                return '<div class="flow-block contract-block"><div class="block-empty">' +
                    """ + ICON + """
                    '<span class="snapshot-empty-title">' + title + '</span>' +""",
      '合同空态图标')

apply("""                return '<div class="flow-block temp-block" data-temp-done="1"><div class="block-empty">' +
                    '该流程项暂无临时任务</div></div>';""",
      """                return '<div class="flow-block temp-block" data-temp-done="1"><div class="block-empty">' +
                    """ + ICON + """
                    '该流程项暂无临时任务</div></div>';""",
      '非合同空态图标')

apply("""                h += '<div class="block-empty">该服务流程项下暂无我的任务' +""",
      """                h += '<div class="block-empty"><span class="be-icon" aria-hidden="true"></span>该服务流程项下暂无我的任务' +""",
      '我的任务空态图标')

apply("""<div class="empty-state" id="emptyState" style="display: none;">
                <div class="icon">📋</div>""",
      """<div class="empty-state" id="emptyState" style="display: none;">
                <span class="be-icon" aria-hidden="true"></span>
                <div class="icon">📋</div>""",
      '全局空态图标（原 emoji 节点保留，仅由 CSS 隐藏）')

# ==================== 3. 装饰节点：筛选面板 drag handle ====================
apply("""    <div class="filter-sheet" id="filterSheet">
        <div class="fs-head">筛选条件""",
      """    <div class="filter-sheet" id="filterSheet">
        <div class="fs-handle" aria-hidden="true"></div>
        <div class="fs-head">筛选条件""",
      '筛选面板 drag handle')

# ==================== 4. 纯 CSS 覆盖段（追加到第二个 style 块末尾） ====================
CSS = r"""
        /* ===== UI Polish B：纯 CSS 质感升级（整段删除即可一键回退，DOM / JS 逻辑零改动） ===== */
        /* B1 圆角与描边统一：弱化嵌套层边框，浅底 + 轻投影分层 */
        .tool-bar, .nav-card { border-bottom-color: #EDF1F5; }
        .flow-rail-item, .task-tab, .tool-filter-btn, .tool-chip,
        .task-item .task-status-text, .task-item .task-tag, .src-tag { border-radius: 999px; }
        .flow-group, .mt-flow-group {
            border: 1px solid #EDF1F5; border-left: 3px solid var(--primary-color);
            border-radius: 12px; box-shadow: 0 2px 10px rgba(24,144,255,.05);
        }
        #panelTemp .flow-group { border-left-color: #D3ADF7; }
        .flow-group-head, .mt-flow-head { background: #FAFBFD; border-bottom-color: #F0F3F7; }
        .contract-section, .stage-card, .temp-stage-card { border-color: #EDF1F5; }

        /* B2 选中态降饱和：浅主色底 + 主色文字 + 2px 色条；徽标保留反白高对比 */
        .flow-rail-item.active {
            background: var(--status-primary-bg); border-color: #91D5FF;
            color: var(--primary-color); box-shadow: inset 0 -2px 0 var(--primary-color);
        }
        .flow-rail-item[data-flow-id="all"].active { color: var(--primary-color); }
        .task-tab.active[data-tab="contract"] {
            background: var(--status-primary-bg); border-color: #91D5FF;
            color: var(--primary-color); box-shadow: inset 0 -2px 0 var(--primary-color);
        }
        .task-tab.active[data-tab="temp"] {
            background: #F9F0FF; border-color: #D3ADF7; color: #722ED1;
            box-shadow: inset 0 -2px 0 #722ED1;
        }
        .task-tab.active[data-tab="mytasks"] {
            background: #E1F5EE; border-color: #9FE1CB; color: #0F6E56;
            box-shadow: inset 0 -2px 0 #0F6E56;
        }
        .task-tab.active[data-tab="contract"] .task-tab-badge { background: var(--primary-color); color: #fff; }
        .task-tab.active[data-tab="temp"] .task-tab-badge { background: #722ED1; color: #fff; }
        .task-tab.active[data-tab="mytasks"] .task-tab-badge { background: #0F6E56; color: #fff; }

        /* B3 结果条：数字 15px 主色 + 「收起全部」32px 胶囊按钮 */
        .nav-card .result-bar {
            font-size: 12px; color: var(--text-secondary);
            padding: 6px 0; border-top: 1px solid #EDF1F5;
        }
        .rc-num { display: inline-block; margin: 0 2px; font-size: 15px; font-weight: 600; color: var(--primary-color); }
        .expand-all-btn {
            display: inline-flex; align-items: center; min-height: 32px;
            padding: 0 12px; border-radius: 999px; background: var(--bg-secondary); font-size: 12px;
        }

        /* B4 任务行：独立白卡 + 3px 状态色条（按 data-status，紫色让位给来源标签） */
        #taskContainer .task-item {
            margin: 0 10px 6px; padding: 10px 12px; box-sizing: border-box;
            background: var(--bg-primary); border: 1px solid #F0F3F7;
            border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,.025);
        }
        #taskContainer .task-item:hover { background: #F4FAFF; }
        #taskContainer .task-item[data-status] { border-left: 3px solid var(--st-color, #BFBFBF) !important; }
        .task-item[data-status="pending"] { --st-color: #BFBFBF; }
        .task-item[data-status="config"] { --st-color: #8C8C8C; }
        .task-item[data-status="executing"] { --st-color: #1890FF; }
        .task-item[data-status="confirming"] { --st-color: #FAAD14; }
        .task-item[data-status="completed"] { --st-color: #52C41A; }
        .task-item .task-name { font-size: 14px; font-weight: 500; }
        .task-item .task-meta { font-size: 12px; }

        /* B5 阶段卡头：浅底中性化，箭头旋转过渡 */
        .temp-stage-head { background: #F7F9FC; color: var(--text-secondary); }
        .temp-stage-card { border-left-color: #D9C7F0; }
        .stage-header .arrow, .mc-own-toggle .arrow, .temp-stage-head .arrow { transition: transform .3s ease; }
        .stage-header .arrow.expanded { color: var(--primary-color); }

        /* B6 空态：线性图标 + 标题层级 + 实心 CTA（44px 触控区） */
        .be-icon {
            display: block; position: relative; width: 42px; height: 42px;
            margin: 0 auto 12px; border: 2px solid #D7E4F3; border-radius: 12px;
            background: linear-gradient(180deg, #F7FBFF, #FFFFFF);
        }
        .be-icon::before, .be-icon::after {
            content: ''; position: absolute; left: 10px; height: 2px;
            border-radius: 2px; background: #C6D9EE;
        }
        .be-icon::before { top: 14px; right: 10px; }
        .be-icon::after { top: 21px; right: 16px; }
        .empty-state .icon { display: none; }
        .block-empty { padding: 28px 16px; }
        .block-empty .snapshot-empty-title { font-size: 14px; font-weight: 600; color: var(--text-secondary); }
        .block-empty .snapshot-empty-hint { font-size: 12px; }
        .snapshot-cta, .mt-back {
            min-height: 44px; line-height: 44px; border: none; border-radius: 10px;
            font-weight: 500; background: var(--primary-color); color: #fff;
        }
        .mt-back { background: #0F6E56; }
        .snapshot-cta:hover, .mt-back:hover { filter: brightness(.94); }

        /* B7 筛选面板：drag handle + 选中项实心带勾 + 底部主次分明 */
        .fs-handle { width: 36px; height: 4px; margin: 8px auto 2px; border-radius: 999px; background: #DCE3EB; }
        .fs-head { padding-top: 6px; }
        .fs-section .quick-filter-btn { position: relative; }
        .fs-section .quick-filter-btn.active, .status-grid .status-dropdown-item.active {
            background: var(--status-primary-bg); border-color: #91D5FF;
            color: var(--primary-color); font-weight: 600;
        }
        .fs-section .quick-filter-btn.active::after {
            content: '✓'; position: absolute; right: 10px; top: 50%;
            transform: translateY(-50%); font-size: 12px;
        }
        .fs-foot .fs-done {
            background: var(--primary-color); border-color: var(--primary-color);
            color: #fff; font-weight: 600; box-shadow: 0 2px 8px rgba(24,144,255,.2);
        }
        .fs-foot .fs-reset { background: var(--bg-primary); color: var(--text-secondary); }

        /* B8 工具条：搜索框浅灰无边框 + 聚焦主色描边；筛选按钮激活浅蓝 */
        .tool-bar .search-input {
            background: var(--bg-secondary); border: 1px solid transparent;
            border-radius: 18px; transition: background .2s, border-color .2s;
        }
        .tool-bar .search-input:focus { background: var(--bg-primary); border-color: var(--primary-color); }
        .tool-filter-btn.active {
            background: var(--status-primary-bg); border-color: #91D5FF;
            color: var(--primary-color); box-shadow: 0 1px 4px rgba(24,144,255,.1);
        }
        /* ===== UI Polish B END ===== */
"""

anchor = "        margin: 0 4px;\n    }\n</style>"
apply(anchor, "        margin: 0 4px;\n    }\n" + CSS + "</style>", '追加 CSS 覆盖段到第二个 style 块末尾')

out = s.encode('utf-8')
open(P, 'wb').write(out)
print('DONE | bytes %d -> %d | BOM %s | CRLF %d | LF %d' %
      (len(b), len(out), out[:3] == b'\xef\xbb\xbf', out.count(b'\r\n'), out.count(b'\n')))
