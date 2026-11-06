# -*- coding: utf-8 -*-
"""4 个跳转页接入「我的任务」共享清单与 ?scope=mytasks 契约。
行尾：project-list.html / project-list-empty-demo.html = CRLF；
      project-detail-initial-v2.html / completed-v2.html = LF。
统一策略：临时归一到 \n 做替换，输出时按原行尾还原；encoding='utf-8' + newline=''。"""
import io

FILES = [
    "project-list.html",
    "project-detail-initial-v2.html",
    "project-detail-completed-v2.html",
    "project-list-empty-demo.html",
]


def load(p):
    raw = io.open(p, "r", encoding="utf-8", newline="").read()
    crlf = "\r\n" in raw
    return raw.replace("\r\n", "\n"), crlf


def save(p, s, crlf):
    out = s.replace("\n", "\r\n") if crlf else s
    io.open(p, "w", encoding="utf-8", newline="").write(out)


def rep(s, old, new, label, cnt=1, optional=False):
    n = s.count(old)
    if optional and n == 0:
        print("SKIP %-42s (absent)" % label)
        return s
    assert n == cnt, "%s: expect %d match, got %d" % (label, cnt, n)
    print("OK   %-42s x%d" % (label, cnt))
    return s.replace(old, new, cnt)


# ---------------- 1. project-list.html：引用 + 数字派生 + 跳转 ----------------
p = "project-list.html"
s, crlf = load(p)

s = rep(s,
        '<script src="js/flow-config-store.js"></script>\n',
        '<script src="js/flow-config-store.js"></script>\n<script src="js/my-tasks-store.js"></script>\n',
        "P1 head 引入 my-tasks-store.js")

s = rep(s,
        '<span class="mt-s">待处理 5 · 确认中 2 · 已完成 3</span>',
        '<span class="mt-s" id="mtSNonworker">待处理 5 · 确认中 2 · 已完成 3</span>',
        "P2 非工人 mt-s 加 id")
s = rep(s,
        '<span class="mt-s">待处理 1 · 确认中 3 · 已完成 4</span>',
        '<span class="mt-s" id="mtSWorker">待处理 1 · 确认中 3 · 已完成 4</span>',
        "P3 工人 mt-s 加 id")

s = rep(s, "go('task-list.html?role=exec')", "go(myTasksHref())",
        "P4 两处我的任务跳转改为动态契约", cnt=2)

s = rep(s,
        "function go(href) { if (href) window.location.href = href; }\n",
        "function go(href) { if (href) window.location.href = href; }\n"
        "/* 我的任务：与 task-list.html 的 ?scope=mytasks 契约同源，带上当前视角 */\n"
        "function myTasksHref() { return 'task-list.html?scope=mytasks&role=' + currentRole; }\n"
        "function renderMyTaskSummary() {\n"
        "  if (!window.MyTasksStore) return;\n"
        "  var el = document.getElementById(currentRole === 'worker' ? 'mtSWorker' : 'mtSNonworker');\n"
        "  if (el) el.textContent = MyTasksStore.text(currentRole);\n"
        "}\n",
        "P5 新增 myTasksHref / renderMyTaskSummary")

s = rep(s,
        "  document.getElementById('pageBody').scrollTop = 0;\n}",
        "  document.getElementById('pageBody').scrollTop = 0;\n  renderMyTaskSummary();\n}",
        "P6 setRole 内重算我的任务三态")

save(p, s, crlf)
print("WROTE", p, "crlf=", crlf)

# ---------------- 2-4. 状态页：6 处 URL ----------------
OLD = "task-list.html?role=exec"
NEW = "task-list.html?scope=mytasks&role=' + currentRole + '"
for p in FILES[1:]:
    s, crlf = load(p)
    n = s.count(OLD)
    assert n == 2, "%s: expect 2 URL matches, got %d" % (p, n)
    s = s.replace(OLD, NEW)
    print("OK   %-42s x2" % (p + " URL"))
    save(p, s, crlf)
    print("WROTE", p, "crlf=", crlf)

# ---------------- 复验 ----------------
for p in FILES:
    s, crlf = load(p)
    assert "task-list.html?role=exec" not in s, p + ": old URL remains"
print("ALL DONE")
