# -*- coding: utf-8 -*-
"""task-list.html 层级修正：主合同自身阶段任务 / 子合同保留 / 临时任务阶段化 / 合同去重。
铁律：encoding='utf-8' + newline=''（保留 18 个 BOM 与纯 LF）；按精确锚点替换，逐项 assert。
"""
import io, os, sys

P = "task-list.html"
with open(P, "r", encoding="utf-8", newline="") as f:
    src = f.read()
orig = src
BOM_N = len(src) - len(src.lstrip("\ufeff"))
print("baseline BOM chars:", BOM_N, "len:", len(src))


def sub_once(old, new, tag):
    global src
    n = src.count(old)
    assert n == 1, "%s: expected 1 occurrence, got %d" % (tag, n)
    src = src.replace(old, new, 1)
    print("  OK", tag)


# ---------------------------------------------------------------- 1. CSS
CSS_ANCHOR = "        #taskContainer > .flat-task-item { display: none !important; }\n</style>"
CSS_NEW = """        #taskContainer > .flat-task-item { display: none !important; }

        /* ===== 主合同自身阶段任务 / 子合同任务 分层 ===== */
        .mc-own { border-top: 1px dashed var(--border-color); }
        .mc-own-band, .mc-sub-band {
            display: flex; align-items: center; justify-content: space-between; gap: 8px;
            min-height: 40px; padding: 8px 14px; font-size: 13px; font-weight: 600;
        }
        .mc-own-band { color: var(--primary-color); background: #F0F7FF; }
        .mc-sub-band { color: var(--text-secondary); background: var(--bg-secondary); border-top: 1px solid var(--border-color); }
        .mc-own-count { font-size: 12px; font-weight: 400; color: var(--text-tertiary); }
        .mc-own-stages { padding: 8px 10px 10px; }
        .mc-own-stages .stage-group { margin-left: 0; }
        .mc-own-stages .stage-header { padding-left: 12px; }
        .mc-own-stages .task-list { padding-left: 0; }

        /* ===== 临时任务：阶段卡 + 无阶段单独任务 ===== */
        .temp-stage-card {
            margin: 0 10px 8px; border: 1px solid #E9D9FA; border-left: 3px solid #722ED1;
            border-radius: 8px; overflow: hidden; background: var(--bg-primary);
        }
        .temp-stage-head {
            display: flex; align-items: center; justify-content: space-between; gap: 8px;
            min-height: 44px; padding: 10px 12px; background: #FAF5FF;
            font-size: 13px; font-weight: 600; color: #722ED1; cursor: pointer;
        }
        .temp-stage-right { display: inline-flex; align-items: center; gap: 8px; }
        .badge-n { min-width: 20px; padding: 1px 6px; border-radius: 9px; background: #EDE0FB; color: #722ED1; font-size: 12px; font-weight: 500; text-align: center; }
        .temp-stage-tasks { display: none; }
        .temp-stage-tasks.show { display: block; }
        .temp-loose { margin: 0 10px 10px; }
        .temp-loose-band {
            display: flex; align-items: center; gap: 8px; min-height: 40px; padding: 8px 12px;
            font-size: 13px; font-weight: 600; color: #722ED1; background: #FAF5FF; border-radius: 8px 8px 0 0;
        }
        .temp-loose-list { display: none; border: 1px solid #E9D9FA; border-top: none; border-radius: 0 0 8px 8px; overflow: hidden; }
        .temp-loose-list.show { display: block; }
        .temp-stage-tasks .task-item, .temp-loose-list .task-item { border-left: 3px solid #722ED1; }
</style>"""
sub_once(CSS_ANCHOR, CSS_NEW, "H1 CSS")

# ---------------------------------------------------------------- 2. JS 模块
JS_ANCHOR = "        window.addEventListener('pageshow', function () {"
JS_MODULE = r"""        // ================= 层级修正：主合同自身阶段任务 / 临时任务阶段化 / 合同去重 =================
        // 主合同自身阶段任务（与 project-list.html baseItems() 服务流程阶段同源，本页内嵌只读）
        var MAIN_OWN_STAGES = {
            sg: [
                { n: '基础施工阶段', st: 'completed', tasks: [
                    ['现场放线与三方交底', 'completed'], ['墙体拆除与建筑垃圾清运', 'completed'],
                    ['新建砌墙与植筋加固', 'completed'], ['门窗洞口修整与过梁浇筑', 'completed'],
                    ['成品保护与文明施工验收', 'completed']
                ] },
                { n: '水电隐蔽工程', st: 'executing', tasks: [
                    ['强弱电开槽与弹线定位', 'completed'], ['冷热水管路铺设与打压测试', 'completed'],
                    ['卫生间沉箱防漏与二次排水', 'executing'], ['中央空调/新风主机吊装穿梁', 'executing'],
                    ['强弱电穿线与底盒安装', 'pending'], ['隐蔽工程节点联合三方验收', 'pending']
                ] },
                { n: '泥瓦铺贴与防水防渗', st: 'pending', tasks: [
                    ['卫生间及阳台高分子防水刷制', 'pending'], ['闭水试验48小时联合签字', 'pending'],
                    ['墙地砖铺贴与地面找平', 'pending'], ['窗台石与门槛石安装', 'pending'],
                    ['泥瓦工程完工验收', 'pending']
                ] },
                { n: '木工吊顶与柜体制作', st: 'pending', tasks: [
                    ['轻钢龙骨吊顶封板', 'pending'], ['背景墙基层与造型制作', 'pending'],
                    ['现场柜体下料与组装', 'pending'], ['木工工程完工验收', 'pending']
                ] },
                { n: '油漆涂饰与竣工收尾', st: 'pending', tasks: [
                    ['墙面挂网与腻子批刮三遍', 'pending'], ['顶面乳胶漆滚涂两遍', 'pending'],
                    ['木作油漆与收口补缝', 'pending'], ['开荒保洁与竣工初验', 'pending']
                ] }
            ]
        };
        // 临时任务：有阶段的归入阶段卡；其余（含 TEMP_LOOSE）作为「无阶段单独任务」直接平铺
        var TEMP_STAGE_MAP = {
            sg: [
                { n: '进场验收阶段', names: ['材料进场验收', '瓷砖/石材进场复验'] },
                { n: '施工过程巡检阶段', names: ['水电节点复检', '隐蔽工程旁站', '卫生间防水闭水旁站',
                    '瓷砖空鼓与平整度抽检', '吊顶龙骨间距抽检', '墙面腻子打磨验收',
                    '门套与柜体基层尺寸复核', '强弱电箱回路核对'] },
                { n: '竣工收尾阶段', names: ['收口验收', '竣工前全面巡检'] }
            ],
            ht: []
        };
        var TEMP_LOOSE = {
            sg: ['工地巡检', '成品保护巡查', '工地安全用电检查'],
            ht: ['设计交底']
        };

        function ownStageCardHtml(n, st, tasks, fid) {
            var stInfo = STATUS_MAP[st] || STATUS_MAP.pending;
            return '<div class="stage-group show"><div class="stage-item">' +
                '<div class="stage-header" onclick="toggleStage(this)">' +
                '<div class="stage-dot ' + stInfo.cls + '"></div>' +
                '<div class="stage-name">' + escTxt(n) + '</div>' +
                '<div class="stage-count">0/' + tasks.length + '</div>' +
                '<div class="arrow expanded">▼</div></div>' +
                '<div class="task-list show">' +
                tasks.map(function (t) { return taskRow(t, fid, 'contract'); }).join('') +
                '</div></div></div>';
        }

        // 主合同层补齐「自身阶段任务」；ht 把重复的子合同层上提后移除（去重），任务节点原样搬运
        function injectMainOwnStages() {
            document.querySelectorAll('.task-panel .main-contract').forEach(function (mc) {
                if (mc.getAttribute('data-own-done')) return;
                mc.setAttribute('data-own-done', '1');
                var g = mc.closest('.flow-group');
                var fid = g ? g.getAttribute('data-flow-id') : 'sg';
                var head = mc.querySelector('.mc-header');
                var children = mc.querySelector('.mc-children');
                var stages = document.createElement('div');
                stages.className = 'mc-own-stages';

                if (fid === 'ht') {
                    // 同一份「设计服务合同」原先被表达成主合同 + 子合同两层 → 去重：
                    // 把子合同的阶段任务整块上提为主合同自身阶段任务，移除重复合同卡壳（任务节点不丢）
                    var dup = children && children.querySelector('.contract-section[data-contract="contract-design"]');
                    if (dup) {
                        Array.prototype.slice.call(dup.querySelectorAll('.stage-group')).forEach(function (sg) {
                            stages.appendChild(sg);
                        });
                        dup.parentNode.removeChild(dup);
                    }
                    if (children && children.parentNode === mc && !children.querySelector('.contract-section')) {
                        children.parentNode.removeChild(children);
                    }
                } else if (MAIN_OWN_STAGES[fid]) {
                    var html = '';
                    MAIN_OWN_STAGES[fid].forEach(function (s) {
                        var ts = s.tasks.map(function (t) { return { n: t[0], s: t[1], e: '陈庄' }; });
                        html += ownStageCardHtml(s.n, s.st, ts, fid);
                    });
                    stages.innerHTML = html;
                } else {
                    return;
                }

                var own = document.createElement('div');
                own.className = 'mc-own';
                var band = document.createElement('div');
                band.className = 'mc-own-band';
                band.innerHTML = '<span>主合同阶段任务</span><span class="mc-own-count">' +
                    stages.querySelectorAll('.stage-item').length + ' 阶段 · ' +
                    stages.querySelectorAll('.task-item').length + ' 任务</span>';
                own.appendChild(band);
                own.appendChild(stages);
                if (head && head.parentNode === mc) mc.insertBefore(own, head.nextSibling);
                else mc.insertBefore(own, mc.firstChild);

                if (children && children.parentNode === mc) {
                    var sub = document.createElement('div');
                    sub.className = 'mc-sub-band';
                    sub.innerHTML = '<span>子合同任务</span><span class="mc-own-count">' +
                        children.querySelectorAll('.contract-section').length + ' 份子合同</span>';
                    mc.insertBefore(sub, children);
                }
            });
        }

        // 临时任务：按阶段分组 + 无阶段单独任务（原任务节点 appendChild 搬运，data-*/onclick 不变）
        function restructureTempBlocks() {
            document.querySelectorAll('.task-panel .temp-block').forEach(function (block) {
                if (block.getAttribute('data-temp-done')) return;
                block.setAttribute('data-temp-done', '1');
                var list = block.querySelector('.temp-tasks-list');
                if (!list) return;
                var g = block.closest('.flow-group');
                var fid = g ? g.getAttribute('data-flow-id') : 'sg';
                var groups = TEMP_STAGE_MAP[fid] || [];
                var buckets = groups.map(function () { return []; });
                var loose = [];
                Array.prototype.slice.call(list.querySelectorAll('.task-item')).forEach(function (t) {
                    var el = t.querySelector('.task-name');
                    var nm = el ? el.textContent.trim() : '';
                    var idx = -1;
                    for (var i = 0; i < groups.length; i++) {
                        if (groups[i].names.indexOf(nm) >= 0) { idx = i; break; }
                    }
                    if (idx >= 0) buckets[idx].push(t); else loose.push(t);
                });
                var wrap = document.createElement('div');
                wrap.className = 'temp-structured';
                groups.forEach(function (grp, i) {
                    if (!buckets[i].length) return;
                    var card = document.createElement('div');
                    card.className = 'temp-stage-card';
                    card.setAttribute('data-temp-stage', grp.n);
                    card.innerHTML = '<div class="temp-stage-head" onclick="toggleTempStage(this)">' +
                        '<span>' + escTxt(grp.n) + '</span>' +
                        '<span class="temp-stage-right"><span class="badge-n">' + buckets[i].length +
                        '</span><span class="arrow expanded">▼</span></span></div>' +
                        '<div class="temp-stage-tasks show"></div>';
                    var box = card.querySelector('.temp-stage-tasks');
                    buckets[i].forEach(function (t) { box.appendChild(t); });
                    wrap.appendChild(card);
                });
                if (loose.length) {
                    var lz = document.createElement('div');
                    lz.className = 'temp-loose';
                    lz.setAttribute('data-temp-loose', '1');
                    lz.innerHTML = '<div class="temp-loose-band">无阶段单独任务 <span class="badge-n">' +
                        loose.length + '</span></div><div class="temp-loose-list show"></div>';
                    var lb = lz.querySelector('.temp-loose-list');
                    loose.forEach(function (t) { lb.appendChild(t); });
                    wrap.appendChild(lz);
                }
                list.innerHTML = '';
                list.appendChild(wrap);
            });
        }

        function toggleTempStage(el) {
            var box = el.nextElementSibling;
            if (!box) return;
            var show = box.classList.toggle('show');
            var a = el.querySelector('.arrow');
            if (a) a.classList.toggle('expanded', show);
        }

        // 去重文案：面板内 band 不再重复 Tab 名「合同内任务 / 临时任务」
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
        }

        function restructureTaskHierarchy() {
            injectMainOwnStages();
            restructureTempBlocks();
            dedupeBands();
        }

"""
sub_once(JS_ANCHOR, JS_MODULE + JS_ANCHOR, "H2 JS module")

# ---------------------------------------------------------------- 3. 初始化序列
sub_once(
    "            migrateLegacyBlocks();\n            var _flowCfg = cfgList();",
    "            migrateLegacyBlocks();\n            restructureTaskHierarchy();\n            var _flowCfg = cfgList();",
    "H3 init sequence")

# ---------------------------------------------------------------- 4. initExpandAll 选择器扩展
sub_once(
    "            document.querySelectorAll('.task-panel .flow-body, .task-panel .mc-children, .task-panel .stage-group, .task-panel .task-list, .task-panel .temp-tasks-list').forEach(function (el) {",
    "            document.querySelectorAll('.task-panel .flow-body, .task-panel .mc-children, .task-panel .stage-group, .task-panel .task-list, .task-panel .temp-tasks-list, .task-panel .temp-stage-tasks, .task-panel .temp-loose-list').forEach(function (el) {",
    "H4 initExpandAll")

# ---------------------------------------------------------------- 5. expandAncestors 补临时区
OLD_EXPAND = """            const sg = task.closest('.stage-group');
            if (sg) {
                sg.classList.add('show');
                const section = sg.closest('.contract-section');
                const arrow = section && section.querySelector('.contract-header .arrow');
                if (arrow) arrow.classList.add('expanded');
            }
        }"""
NEW_EXPAND = """            const sg = task.closest('.stage-group');
            if (sg) {
                sg.classList.add('show');
                const section = sg.closest('.contract-section');
                const arrow = section && section.querySelector('.contract-header .arrow');
                if (arrow) arrow.classList.add('expanded');
            }
            const tsp = task.closest('.temp-stage-tasks');
            if (tsp) {
                tsp.classList.add('show');
                const a = tsp.previousElementSibling && tsp.previousElementSibling.querySelector('.arrow');
                if (a) a.classList.add('expanded');
            }
            const lzl = task.closest('.temp-loose-list');
            if (lzl) lzl.classList.add('show');
        }"""
sub_once(OLD_EXPAND, NEW_EXPAND, "H5 expandAncestors")

# ---------------------------------------------------------------- 6. filterTasks 容器收敛
OLD_CONVERGE = """                scope.querySelectorAll('.main-contract').forEach(function (mc) {
                    let n = 0;
                    mc.querySelectorAll('.contract-section').forEach(function (cs) { if (cs.style.display !== 'none') n++; });
                    mc.style.display = n > 0 ? '' : 'none';
                });
            }"""
NEW_CONVERGE = """                scope.querySelectorAll('.main-contract').forEach(function (mc) {
                    let n = 0;
                    mc.querySelectorAll('.contract-section').forEach(function (cs) { if (cs.style.display !== 'none') n++; });
                    mc.querySelectorAll('.mc-own .task-item').forEach(function (t) { if (t.style.display !== 'none') n++; });
                    mc.style.display = n > 0 ? '' : 'none';
                });
                scope.querySelectorAll('.temp-stage-card').forEach(function (card) {
                    let n = 0;
                    card.querySelectorAll('.task-item').forEach(function (t) { if (t.style.display !== 'none') n++; });
                    card.style.display = n > 0 ? 'block' : 'none';
                });
                scope.querySelectorAll('.temp-loose').forEach(function (lz) {
                    let n = 0;
                    lz.querySelectorAll('.task-item').forEach(function (t) { if (t.style.display !== 'none') n++; });
                    lz.style.display = n > 0 ? 'block' : 'none';
                });
            }"""
sub_once(OLD_CONVERGE, NEW_CONVERGE, "H6 filterTasks converge")

# ---------------------------------------------------------------- 写回 + 复验
assert src != orig
with open(P, "w", encoding="utf-8", newline="") as f:
    f.write(src)

with open(P, "rb") as f:
    b = f.read()
bom = 0
while b[bom:bom + 3] == b"\xef\xbb\xbf":
    bom += 3
print("after BOM bytes:", bom, "CRLF:", b.count(b"\r\n"), "LF:", b.count(b"\n"))
assert bom == 54, "BOM changed"
assert b.count(b"\r\n") == 0, "line ending changed"
with open(P, "r", encoding="utf-8", newline="") as f:
    chk = f.read()
assert len(chk) - len(chk.lstrip("\ufeff")) == BOM_N, "BOM chars changed"
for k, expected in [("function restructureTaskHierarchy", 1), ("function injectMainOwnStages", 1),
                    ("function restructureTempBlocks", 1), ("function toggleTempStage", 1),
                    ("restructureTaskHierarchy();\n            var _flowCfg", 1)]:
    n = chk.count(k)
    assert n == expected, "%s count=%d expected=%d" % (k, n, expected)
print("ALL ASSERTIONS PASSED; chars:", len(chk))
