import re

P = "task-list.html"
with open(P, "r", encoding="utf-8", newline="") as f:
    s = f.read()

with open(".workbuddy/_tmp/tasktab_module.js", "r", encoding="utf-8", newline="") as f:
    MODULE = f.read()
with open(".workbuddy/_tmp/tasktab_filter.js", "r", encoding="utf-8", newline="") as f:
    FILTER = f.read().rstrip("\n")

# --- 1. 插入新模块（在 currentFilters 声明之前） ---
anchor = "        let currentFilters = {"
assert s.count(anchor) == 1, "currentFilters anchor not unique"
s = s.replace(anchor, MODULE + anchor, 1)
print("OK module inserted")

# --- 2. 整段替换 filterTasks ---
start = "        function filterTasks() {"
endmark = "            if (!isFiltering) {\n                restoreExpandState();\n            }\n        }"
i = s.find(start)
assert i >= 0, "filterTasks start not found"
j = s.find(endmark, i)
assert j >= 0, "filterTasks end not found"
j += len(endmark)
s = s[:i] + FILTER + s[j:]
print("OK filterTasks replaced")

# --- 3. selectStatus 双向对称互斥补丁 ---
old = "            currentFilters.status = status;\n            currentFilters.statusText = text;\n"
new = old + "            // 与 applyPill() 对称：切状态轴时复位角色轴，避免两轴 AND 叠加导致恒 0 结果\n" + \
      "            if (status !== 'all') {\n                currentFilters.role = 'all';\n                currentFilters.mine = false;\n            }\n"
assert s.count(old) == 1, "selectStatus anchor not unique"
s = s.replace(old, new, 1)
print("OK selectStatus symmetry fix")

# --- 4. DOMContentLoaded 初始化序列 ---
old = "        document.addEventListener('DOMContentLoaded', function() {\n            checkSequentialTasks();"
new = ("        document.addEventListener('DOMContentLoaded', function() {\n"
       "            // 新架构初始化：搬运旧区块 -> 配置驱动 -> 全部展开 -> 默认合同 Tab -> 默认「进行中」流程项\n"
       "            migrateLegacyBlocks();\n"
       "            var _flowCfg = cfgList();\n"
       "            applyFlowCfg(_flowCfg);\n"
       "            initExpandAll();\n"
       "            switchTaskTab('contract');\n"
       "            selectFlow(defaultFlowId(_flowCfg));\n\n"
       "            checkSequentialTasks();")
assert s.count(old) == 1, "DOMContentLoaded anchor not unique"
s = s.replace(old, new, 1)
print("OK DOMContentLoaded init sequence")

with open(P, "w", encoding="utf-8", newline="") as f:
    f.write(s)

# --- 复验字节特征与数据守恒 ---
b = open(P, "rb").read()
bom = 0
while b[bom:bom+3] == b"\xef\xbb\xbf":
    bom += 3
assert bom == 54, "BOM changed: %d" % bom
assert b.count(b"\r\n") == 0, "CRLF introduced"
now = b.decode("utf-8")
assert now.count("<script") == 3 and now.count("</script>") == 3, "script pairing broken"
assert len(re.findall(r"<style[^>]*>", now)) == 2, "style count changed"
for name in ["migrateLegacyBlocks", "applyFlowCfg", "initExpandAll", "switchTaskTab", "selectFlow", "deriveStats", "activeTaskScope", "refresh"]:
    assert ("function " + name + "(") in now, "missing function " + name
assert "scrollToSection" not in now, "legacy anchor scrolling should be gone"
assert "常显锚点条" not in now, "legacy anchor bar text should be gone"

# HTML 区（主内联 script 之前）任务数据守恒：与备份逐字比对
bak = open(".workbuddy/_tmp/task-list.bak-20261105-tasktab-v2.bak", "rb").read().decode("utf-8")
def html_area(t):
    k = t.find("    <script>")
    return t[:k] if k >= 0 else t
h_new, h_bak = html_area(now), html_area(bak)
assert h_new.count('class="task-item"') == 48 == h_bak.count('class="task-item"'), "task-item count changed"
assert h_new.count('class="flat-task-item"') == 21 == h_bak.count('class="flat-task-item"'), "flat count changed"
names_new = re.findall(r'<div class="task-name">([^<]*)</div>', h_new)
names_bak = re.findall(r'<div class="task-name">([^<]*)</div>', h_bak)
assert names_new == names_bak, "task names changed (order or text)"
print("VERIFY OK | BOM=54 | CRLF=0 | script 3:3 | style=2 | task-item=48 | flat=21 | task names identical (%d)" % len(names_new))
print("lines:", now.count("\n") + 1)
