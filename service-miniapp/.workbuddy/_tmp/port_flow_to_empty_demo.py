# -*- coding: utf-8 -*-
"""
将 completed-v2 的「新版服务流程模块」移植到 project-list-empty-demo.html（空状态演示页）。
约束：保留 loading/empty/offline/content 四态演示逻辑不变；只在 content 态补齐服务流程。
行尾：目标文件 CRLF，全程保持。
"""
import re, sys

SRC = 'project-detail-completed-v2.html'
DST = 'project-list-empty-demo.html'

src = open(SRC, encoding='utf-8', newline='').read()
dst = open(DST, encoding='utf-8', newline='').read()
SL = src.splitlines(keepends=True)
DL = dst.splitlines(keepends=True)

def crlf(t):
    return t.replace('\r\n', '\n').replace('\n', '\r\n')

def uniq(s, needle, label):
    n = s.count(needle)
    assert n == 1, '%s 锚点出现 %d 次（应为1）: %r' % (label, n, needle[:60])
    return True

def seg(lines, a, b):
    """取 [a,b] 行（1-based，含两端）"""
    return ''.join(lines[a-1:b])

print('源行数', len(SL), '目标行数', len(DL))

# ---------- 1. 抽取 ----------
# CSS 令牌（:root 内）
i_vars = next(i for i, l in enumerate(SL) if '新版服务流程模块（移植自 project-list.html SSOT）所需令牌' in l)
j_vars = next(i for i in range(i_vars, len(SL)) if '--fs-11: 11px' in SL[i])
css_vars = ''.join(SL[i_vars:j_vars+1])
print('CSS_VARS 行', i_vars+1, '-', j_vars+1, 'len', len(css_vars))

css_a = seg(SL, 540, 573)      # 服务流程卡 + 横滑流程条 + rail-mask
css_b = seg(SL, 588, 592)      # .badge / .b-*（需限定作用域，避免覆盖空状态页 .badge）
css_c = seg(SL, 636, 819)      # 浮窗抽屉 + 指派弹窗 + 鱼眼 Tab + 书签 + 阶段任务
css_b = re.sub(r'(?m)^\.', '#flowDrawer .', css_b)   # 作用域收窄到浮窗内
assert css_a.count('{') == css_a.count('}'), 'css_a 花括号不平衡'
assert css_b.count('{') == css_b.count('}'), 'css_b 花括号不平衡'
assert css_c.count('{') == css_c.count('}'), 'css_c 花括号不平衡'
print('CSS_A', len(css_a), 'CSS_B', len(css_b), 'CSS_C', len(css_c))

html_flow = seg(SL, 919, 993)  # flow-trigger + 抽屉 + 指派弹窗（末行关闭 assign-modal，内部 div 平衡）
op = len(re.findall(r'<div\b', html_flow)); cl = len(re.findall(r'</div>', html_flow))
assert op == cl, 'HTML 抽取块 div 不平衡 %d/%d' % (op, cl)
print('HTML 抽取 len', len(html_flow), 'div', op, '/', cl, 'BALANCED')

js_flow = seg(SL, 1452, 2379)  # 新版服务流程模块 JS（不含源页初始化）
assert 'function renderDetail()' not in js_flow, 'JS 块含 renderDetail（会冲突）'
assert 'function showToast(' not in js_flow, 'JS 块含 showToast（会冲突）'
assert 'function flowMount()' in js_flow and 'function renderFlowDrawer()' in js_flow
js_flow = js_flow.replace("var FLOW_MODE = 'completed';", "var FLOW_MODE = 'content';")
js_flow = re.sub(r"var overrideStatus = \([^;]*\);", "var overrideStatus = '进行中';", js_flow)
js_flow = js_flow.replace('状态语义由 FLOW_MODE 决定（completed=已完成 / initial=待开始）。',
                          '状态语义：空状态演示页「有数据」= 进行中项目。')
assert "var FLOW_MODE = 'content';" in js_flow
assert "var overrideStatus = '进行中';" in js_flow
print('JS 抽取 len', len(js_flow))

# ---------- 2. 目标页：按行号替换 stats-row 并排半宽卡 → flowHost ----------
new_flow_host = (
    '                // 服务流程（与项目主页宏观逻辑一致；合同/任务统计已并入流程卡统计条）\r\n'
    '                \'<div id="flowHost"></div>\' +\r\n'
)
replaced = 0
for _ in range(2):
    i1 = next(i for i, l in enumerate(DL) if '<div class="stats-row">' in l)
    i2 = next(i for i in range(i1+1, len(DL))
              if '<div class="card indent-card">' in DL[i] or "'</div>';" in DL[i])
    assert 5 < i2 - i1 < 20, 'stats-row 区间异常 %d-%d' % (i1+1, i2+1)
    DL[i1:i2] = [new_flow_host]
    replaced += 1
assert replaced == 2
print('stats-row 替换完成:', replaced, '处')
dst = ''.join(DL)

# ---------- 3. 插入 CSS 令牌 ----------
a = '            --border-color: #e8edf3; /* 供空状态 spinner 边框使用（共享 empty-state.css 依赖） */\r\n'
uniq(dst, a, 'CSS_VARS 插入点')
dst = dst.replace(a, a + crlf(css_vars), 1)

# ---------- 4. 插入 flow CSS（第一个 </style> 之前） ----------
css_block = crlf(css_a + css_b + css_c)
assert dst.count('</style>') == 2
dst = dst.replace('</style>', css_block + '</style>', 1)

# ---------- 5. 插入抽屉/指派弹窗 HTML（手机框闭合 div 之前） ----------
anchor = '    <!-- 角色演示开关：置于手机框外侧'
uniq(dst, anchor, 'HTML 插入锚点')
idx = dst.find(anchor)
pos = dst.rfind('    </div>\r\n', 0, idx)
assert pos > 0, '未找到手机框闭合 div'
dst = dst[:pos] + crlf(html_flow) + dst[pos:]

# ---------- 6. 引入 flow-config-store.js ----------
a = '    <script>\r\n        /* ===================== 原型导航 收起/展开 ===================== */'
uniq(dst, a, 'script 引入锚点')
dst = dst.replace(a, '    <script src="js/flow-config-store.js"></script>\r\n' + a, 1)

# ---------- 7. 插入 flow JS（初始化注释之前） ----------
a = '        /* ===================== 初始化 ===================== */'
uniq(dst, a, 'JS 插入锚点')
dst = dst.replace(a, crlf(js_flow) + '\r\n' + a, 1)

# ---------- 8. renderDetail：content 态挂载 flowMount ----------
a = ("            if (demoState === 'content') {\r\n"
     "                area.innerHTML = currentRole === 'nonworker' ? renderNonWorker(p) : renderWorker(p);\r\n")
uniq(dst, a, 'renderDetail content 分支')
dst = dst.replace(a, a + '                flowMount();\r\n', 1)

# ---------- 9. 空态时收起浮窗 + 隐藏触发条 ----------
a = "            tb.style.display = demoState === 'content' ? '' : 'none';\r\n        }"
uniq(dst, a, 'updateTopbarVisibility')
dst = dst.replace(a,
    "            tb.style.display = demoState === 'content' ? '' : 'none';\r\n"
    "            var ft = document.getElementById('flowTrigger');\r\n"
    "            if (ft) ft.style.display = demoState === 'content' ? '' : 'none';\r\n"
    "            if (demoState !== 'content') closeFlowDrawer();\r\n        }", 1)

# ---------- 10. 切换角色时收起浮窗 ----------
a = ("            statusEl.classList.toggle('worker', currentRole === 'worker');\r\n"
     "            renderDetail();")
uniq(dst, a, 'toggleRoleSwitch')
dst = dst.replace(a,
    "            statusEl.classList.toggle('worker', currentRole === 'worker');\r\n"
    "            closeFlowDrawer();\r\n"
    "            renderDetail();", 1)

# ---------- 11. 自检 + 写回 ----------
dst = crlf(dst)   # 统一为 CRLF（源块 LF + 目标 CRLF 混插后的规范化；不影响 JS 中 \n 字面量）
assert '\r\n' in dst and dst.count('\r\n') == dst.count('\n'), '行尾不再是纯 CRLF'
for i, b in enumerate(re.findall(r'<style[^>]*>(.*?)</style>', dst, re.S), 1):
    assert b.count('{') == b.count('}'), 'style %d 花括号不平衡 %d/%d' % (i, b.count('{'), b.count('}'))
assert dst.count('<script') == dst.count('</script>'), 'script 标签不配对'
assert dst.count('id="flowHost"') == 2, 'flowHost 注入数异常'
assert dst.count('id="flowDrawer"') == 1, '抽屉未唯一'
assert '                flowMount();' in dst, 'renderDetail 未调用 flowMount'
print('自检通过：CRLF / CSS 配平 / script 配对 / flowHost 2 / 抽屉 1')

open(DST, 'w', encoding='utf-8', newline='').write(dst)
print('已写入', DST, '新行数', dst.count('\n')+1, '字节', len(dst.encode('utf-8')))
