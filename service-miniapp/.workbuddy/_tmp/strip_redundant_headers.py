# -*- coding: utf-8 -*-
"""
删除 task-list.html 中 4 类冗余头行（仅改本页）：
  1. 合同面板 .flow-group-head「基础施工服务 共50条」
  2. 合同面板 .block-band「合同层级」
  3. 临时面板 .flow-group-head「基础施工服务 共15条」
  4. 临时面板 .temp-band「阶段任务 / 单独任务 15」
策略：静态 DOM 行删除 + JS 生成源头不再输出 + dedupeBands() 运行时兜底移除。
铁律：encoding='utf-8' + newline=''（保留 18 个 BOM 与纯 LF），禁用 utf-8-sig。
"""
import io
import re

P = "task-list.html"
src = io.open(P, "r", encoding="utf-8", newline="").read()
before_div = (len(re.findall(r"<div\b", src)), src.count("</div>"))
before_bom = src.count("\ufeff")


def rep(old, new, cnt=1, label=""):
    global src
    n = src.count(old)
    assert n == cnt, "%s: expect %d match, got %d" % (label, cnt, n)
    src = src.replace(old, new, cnt)
    print("OK  %-38s x%d" % (label, cnt))


# ---------- A. 静态 DOM：删除 4 行自包含 band ----------
lines = src.split("\n")
kept = []
removed = 0
for l in lines:
    t = l.strip()
    if t.startswith('<div class="block-band') and t.endswith("</div>"):
        removed += 1
        continue
    kept.append(l)
assert removed == 4, "static band lines: expect 4, got %d" % removed
src = "\n".join(kept)
print("OK  %-38s x%d" % ("A 静态 4 行 band 删除", removed))

# ---------- B. ensureFlowGroup 不再生成流程项头行 ----------
rep(
    "g.innerHTML = '<div class=\"flow-group-head\"><span class=\"flow-group-name\"></span><span class=\"group-stat\"></span></div><div class=\"flow-body show\"></div>';",
    "g.innerHTML = '<div class=\"flow-body show\"></div>';",
    label="B ensureFlowGroup 去头行",
)

# ---------- C. snapshotHtml 三处（4 行）band 不再输出 ----------
rep(
    "if (!temps.length) return '<div class=\"flow-block temp-block\"><div class=\"block-band temp-band\">临时任务 <span class=\"badge\">0</span></div><div class=\"block-empty\">该流程项暂无临时任务</div></div>';",
    "if (!temps.length) return '<div class=\"flow-block temp-block\"><div class=\"block-empty\">该流程项暂无临时任务</div></div>';",
    label="C1 快照临时空态",
)
rep(
    "return '<div class=\"flow-block temp-block\"><div class=\"block-band temp-band\">临时任务 <span class=\"badge\">' + temps.length + '</span></div><div class=\"temp-tasks-list show\">' +",
    "return '<div class=\"flow-block temp-block\"><div class=\"temp-tasks-list show\">' +",
    label="C2 快照临时列表",
)
rep(
    "return '<div class=\"flow-block contract-block\"><div class=\"block-band\">合同内任务</div><div class=\"block-empty\">该流程项暂无任务</div></div>';",
    "return '<div class=\"flow-block contract-block\"><div class=\"block-empty\">该流程项暂无任务</div></div>';",
    label="C3 快照合同空态",
)
rep(
    "var h = '<div class=\"flow-block contract-block\"><div class=\"block-band\">合同内任务</div>';",
    "var h = '<div class=\"flow-block contract-block\">';",
    label="C4 快照合同主体",
)

# ---------- D. dedupeBands 改为运行时兜底移除冗余头行 ----------
old_dedupe = """        // 去重文案：面板内 band 不再重复 Tab 名「合同内任务 / 临时任务」
        function dedupeBands() {
            document.querySelectorAll('#panelContract .block-band:not(.temp-band)').forEach(function (b) {
                b.textContent = '合同层级';
            });
            document.querySelectorAll('#panelTemp .temp-band').forEach(function (b) {
                if (b.firstChild && b.firstChild.nodeType === 3) b.firstChild.nodeValue = '阶段任务 / 单独任务 ';
                var g = b.closest('.flow-group');
                var badge = b.querySelector('.badge');
                if (g && badge) badge.textContent = g.querySelectorAll('.task-item').length;
            });
        }"""
new_dedupe = """        // 冗余头行清理：流程项名/总数已在 rail 与 Tab 徽标呈现，面板内不再重复
        // 覆盖 .flow-group-head（流程项名 + 共 N 条）与 .block-band/.temp-band（区块文案）
        function dedupeBands() {
            document.querySelectorAll('.task-panel .flow-group-head, .task-panel .block-band').forEach(function (b) {
                if (b.parentNode) b.parentNode.removeChild(b);
            });
        }"""
rep(old_dedupe, new_dedupe, label="D dedupeBands 改删除")

# ---------- E. deriveStats 去掉对已删除头行的写入 ----------
old_stat = """            document.querySelectorAll('.flow-group').forEach(function (g) {
                var n = g.querySelectorAll('.task-item').length;
                var st = g.querySelector('.group-stat');
                if (st) st.textContent = '共 ' + n + ' 条';
                var badge = g.querySelector('.temp-band .badge');
                if (badge) badge.textContent = n;
            });
"""
new_stat = """            // 面板内分组统计行已移除，数量统一由 Tab 徽标与结果条呈现
"""
rep(old_stat, new_stat, label="E deriveStats 去死写入")

# ---------- F. CSS：内容顶部留 8px 呼吸空间 ----------
rep(
    "        .group-stat { font-size: 12px; color: var(--text-tertiary); }\n",
    "        .group-stat { font-size: 12px; color: var(--text-tertiary); }\n"
    "        /* 冗余头行移除后，面板内容留出少量顶部呼吸空间 */\n"
    "        .task-panel .flow-body { padding-top: 8px; }\n",
    label="F flow-body 顶部间距",
)

# ---------- 复验 ----------
after_div = (len(re.findall(r"<div\b", src)), src.count("</div>"))
delta = (after_div[0] - before_div[0], after_div[1] - before_div[1])
print("\ndiv open/close:", before_div, "->", after_div, "delta:", delta)
# 静态 -4；JS 字符串里去掉 1 个 flow-group-head + 4 个 band（-5）；开闭成对减少
assert delta[0] == delta[1] and delta[0] < 0, "div delta unexpected: %s" % (delta,)
assert src.count("\ufeff") == before_bom, "BOM count changed"
assert "\r\n" not in src, "line ending changed"
assert 'class="block-band' not in "\n".join(
    l for l in src.split("\n") if l.strip().startswith("<div")
), "static band line remains"

io.open(P, "w", encoding="utf-8", newline="").write(src)
print("WROTE", P, "| chars:", len(src))
