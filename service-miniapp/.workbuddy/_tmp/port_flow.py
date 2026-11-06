# -*- coding: utf-8 -*-
import io, sys

SSOT = "project-list.html"

def read_lines(p):
    with io.open(p, "r", encoding="utf-8") as f:
        return f.read().split("\n")

ssot = read_lines(SSOT)

def sl(lo, hi):  # 1-indexed inclusive -> slice
    return ssot[lo-1:hi]

# ---- NEW CSS: SSOT 113..391 (comment + flow-card .. fd-ext-sub-n) ----
NEW_CSS = sl(113, 391)
NEW_CSS.append("        .flow-card { margin: 0 0 8px; }")

# ---- NEW ROOT VARS ----
NEW_ROOT = [
    "            /* 新版服务流程模块（移植自 project-list.html SSOT）所需令牌 */",
    "            --primary-deep: #0b57d0;",
    "            --grad-brand: linear-gradient(135deg, #1e7dff 0%, #0b57d0 100%);",
    "            --line-light: #eef3fb; --flow-bg: #f6faff; --dot-ring: #d8e3f5; --demo-blue: #1677ff;",
    "            --r-card: 12px; --r-block: 8px; --r-pill: 999px;",
    "            --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px; --sp-5: 20px;",
    "            --fs-11: 11px; --fs-12: 12px; --fs-13: 13px; --fs-15: 15px; --fs-17: 17px;",
]

# ---- NEW DRAWER HTML (SSOT 745..819) ----
NEW_DRAWER = ["        " + ln for ln in sl(745, 819)]

# ---- NEW JS (assembled from SSOT slices + custom glue) ----
HEADER = [
    "",
    "        /* ============================================================",
    "           新版「服务流程」模块（移植自 project-list.html SSOT）",
    "           交互/功能外壳升级：横向流程条 + 右侧浮窗抽屉 + 阶段折叠",
    "           + 指派任务（临时派遣）+ 流程配置入口(⚙) + 合同双口径。",
    "           状态语义由 FLOW_MODE 决定（completed=已完成 / initial=待开始）。",
    "           ============================================================ */",
    "        var FLOW_MODE = '%MODE%';",
    "        var flowCfgPerm = 'all';      // 演示：流程配置权限 all/readonly/none",
    "        var assignPermMode = 'all';   // 演示：指派任务权限 all/partial/none",
    "        var AS_WORKERS = [",
    "          { name: '王强', role: '施工' },",
    "          { name: '李伟', role: '施工' },",
    "          { name: '孙磊', role: '监理' },",
    "          { name: '赵敏', role: '水电' },",
    "          { name: '钱七', role: '油漆' }",
    "        ];",
    "        var asExecutor = '';",
    "        var asConfirmers = [];",
    "        var canViewAllFlow = true;",
    "        var fdDetailTab = 'stage';",
    "        var fdStageCollapsed = {};",
    "        var fdLastSelId = null;",
    "        var _flowScrollBound = false;",
    "",
    "        /* ===== 状态色 ===== */",
]

baseItems = sl(903, 1004)
applyFlowPreset = [
    "        /* 保留各流程项原始「完成态」语义（绝不可修改），仅按页面语义重置差异项：",
    "           初始页把「基础施工服务(sg)」整体置为待开始；已完成页沿用 SSOT baseItems 原样。*/",
    "        function applyFlowPreset(items) {",
    "          if (FLOW_MODE === 'initial') {",
    "            var sg = null;",
    "            items.forEach(function (x) { if (x.id === 'sg') sg = x; });",
    "            if (sg) {",
    "              sg.status = '未开始'; sg.done = 0; sg.mainDone = false; sg.subDone = 0;",
    "              (sg.stages || []).forEach(function (s) { s.status = '未开始'; s.collapsed = true; (s.tasks || []).forEach(function (t) { t.status = '未开始'; }); });",
    "              (sg.externals || []).forEach(function (e) { e.status = '未开始'; });",
    "            }",
    "          }",
    "        }",
    "",
]
cfgItems = [
    "        function cfgItems() {",
    "          var cfg = (window.FlowCfgStore ? FlowCfgStore.get() : null);",
    "          if (!cfg || !cfg.length) { var _b = baseItems(); applyFlowPreset(_b); return _b; }",
    "          var detail = {};",
    "          baseItems().forEach(function (it) { detail[it.id] = it; });",
    "          var items = cfg.map(function (c) {",
    "            var d = detail[c.id] || {};",
    "            return {",
    "              id: c.id, name: c.name, kind: c.hasContract ? 'contract' : 'task',",
    "              hasContract: !!c.hasContract, status: d.status || c.status || '未开始',",
    "              done: typeof d.done === 'number' ? d.done : 0,",
    "              total: typeof d.total === 'number' ? d.total : (c.tasks || 0),",
    "              subCount: d.subCount || 0, mainDone: !!d.mainDone, subDone: d.subDone || 0,",
    "              stages: d.stages || [], tasks: d.tasks || [], externals: d.externals || []",
    "            };",
    "          });",
    "          applyFlowPreset(items);",
    "          return items;",
    "        }",
    "",
]
statusStyle = sl(892, 900)
reloadFlowItems = sl(1033, 1040)
ITEMS_BIND = [
    "        var ITEMS = cfgItems();",
    "        var selectedId = 'sg';      // 默认选中项（基础施工服务）",
    "        var overrideStatus = (FLOW_MODE === 'completed' ? '进行中' : '未开始'); // 演示覆盖选中项状态，匹配页面语义",
    "",
]
renderRail = sl(1048, 1073)
updateMask = sl(1075, 1079)
selectItem = sl(1081, 1085)
countDone = sl(1100, 1100)
refreshStats = sl(1109, 1135)
openFlowDrawer = sl(1361, 1366)
closeFlowDrawer = sl(1367, 1371)
fdRow = sl(1372, 1379)
selectFlow = [
    "        function selectFlow(id) {",
    "          selectedId = id;",
    "          renderRail(true);",
    "          renderFlowDrawer();",
    "        }",
    "",
]
fdVars = sl(1387, 1389)
fdStageCls = sl(1390, 1391)
centerRail = sl(1393, 1405)
fdList = sl(1409, 1409)
contractAction = sl(1410, 1415)
goContract = sl(1416, 1421)
renderContractAction = sl(1423, 1432)
centerFdRail = sl(1433, 1436)
currentFlowItem = sl(1442, 1450)
locateStageOf = sl(1451, 1457)
scrollFdToLocate = sl(1458, 1481)
locateCurrent = sl(1482, 1499)
asWorkers = sl(1502, 1512)
flowCfgPerm = sl(1514, 1514)
cfgEntry = sl(1515, 1521)
openFlowConfig = sl(1522, 1526)
assignPermMode = sl(1528, 1528)
canAssign = sl(1529, 1535)
openAssignModal = sl(1536, 1559)
closeAssignModal = sl(1560, 1563)
toggleAsSelect = sl(1564, 1570)
closeAsDropdowns = sl(1571, 1573)
pickAsExecutor = sl(1574, 1580)
renderAsConfirmOptions = sl(1581, 1587)
pickAsConfirmer = sl(1588, 1605)
confirmAssignTask = sl(1606, 1627)
renderFlowDrawer = sl(1628, 1686)
renderFdDetail = sl(1687, 1719)
fdDetailBody = sl(1720, 1755)
fdExtHtml = sl(1756, 1762)
fdAssignBar = sl(1763, 1767)
fdExtRow = sl(1768, 1776)
toggleFdStage = sl(1777, 1785)
toggleAllFdStages = sl(1786, 1810)
updateCollapseAllLabel = sl(1811, 1821)
switchFdTab = sl(1822, 1834)
mainDoneCount = sl(1353, 1356)
syncDrawerIfOpen = sl(1357, 1360)
toastAlias = [
    "        function toast(msg) { showToast(msg); }",
    "",
]
flowMount = [
    "        /* 注入「服务流程」卡结构并挂载（替代旧 flowMount 的内联明细方案） */",
    "        function flowMount() {",
    "          var host = document.getElementById('flowHost');",
    "          if (!host) return;",
    "          host.innerHTML =",
    "            '<div class=\"flow-card flow-sticky\" id=\"flowSticky\">' +",
    "              '<div class=\"flow-head\" onclick=\"openFlowDrawer()\" style=\"cursor:pointer\"><span class=\"fh-t\">服务流程 <span style=\"font-size:12px;color:var(--primary)\">›</span></span><span class=\"fh-n\" id=\"mainLine\">主线</span><span class=\"fh-cfg\" id=\"flowCfgBtn\" onclick=\"event.stopPropagation();openFlowConfig()\">⚙ 配置</span></div>' +",
    "              '<div class=\"flow-stats\" onclick=\"openFlowDrawer()\" style=\"cursor:pointer\">' +",
    "                '<span class=\"fs-seg\"><span class=\"fs-num\" id=\"cNum\">0/0</span><span class=\"fs-lab\">合同 · <span id=\"cPct\">0%</span></span></span>' +",
    "                '<span class=\"fs-div\"></span>' +",
    "                '<span class=\"fs-seg\"><span class=\"fs-num\" id=\"tNum\">0/0</span><span class=\"fs-lab\">任务 · <span id=\"tPct\">0%</span></span></span>' +",
    "              '</div>' +",
    "              '<div class=\"rail-wrap\"><div class=\"flow-rail\" id=\"flowRail\"></div><div class=\"rail-mask\" id=\"railMask\"></div></div>' +",
    "            '</div>';",
    "          renderRail();",
    "          refreshStats();",
    "          syncFlowCfgEntry();",
    "          bindFlowScroll();",
    "        }",
    "",
]
bindFlowScroll = [
    "        function bindFlowScroll() {",
    "          if (_flowScrollBound) return; _flowScrollBound = true;",
    "          var sc = document.getElementById('detailArea');",
    "          if (sc) sc.addEventListener('scroll', function () {",
    "            var st = document.getElementById('flowSticky'); if (!st) return;",
    "            var pr = this.getBoundingClientRect().top; var sr = st.getBoundingClientRect().top;",
    "            st.classList.toggle('stuck', sr <= pr + 1);",
    "          }, { passive: true });",
    "          var fc = document.querySelector('.fd-content');",
    "          if (fc) fc.addEventListener('scroll', function () { var fl = document.getElementById('fdFlowList'); if (fl) fl.classList.toggle('stuck', this.scrollTop > 8); }, { passive: true });",
    "        }",
    "",
]
tail = [
    "        /* 从「服务流程配置」返回（含 bfcache 恢复）时重新读取配置并刷新 */",
    "        window.addEventListener('pageshow', function () {",
    "          if (!window.FlowCfgStore) return;",
    "          reloadFlowItems();",
    "          syncFlowCfgEntry();",
    "        });",
    "        window.addEventListener('resize', updateMask);",
    "",
]

NEW_JS = []
for chunk in [HEADER, baseItems, applyFlowPreset, cfgItems, statusStyle, reloadFlowItems,
              ITEMS_BIND, renderRail, updateMask, selectItem, countDone, refreshStats,
              openFlowDrawer, closeFlowDrawer, fdRow, selectFlow, fdVars, fdStageCls,
              centerRail, fdList, contractAction, goContract, renderContractAction,
              centerFdRail, currentFlowItem, locateStageOf, scrollFdToLocate, locateCurrent,
              asWorkers, flowCfgPerm, cfgEntry, openFlowConfig, assignPermMode, canAssign,
              openAssignModal, closeAssignModal, toggleAsSelect, closeAsDropdowns,
              pickAsExecutor, renderAsConfirmOptions, pickAsConfirmer, confirmAssignTask,
              renderFlowDrawer, renderFdDetail, fdDetailBody, fdExtHtml, fdAssignBar,
              fdExtRow, toggleFdStage, toggleAllFdStages, updateCollapseAllLabel,
              switchFdTab, mainDoneCount, syncDrawerIfOpen, toastAlias, flowMount,
              bindFlowScroll, tail]:
    NEW_JS.extend(chunk)

def transform(path, mode):
    lines = read_lines(path)
    out = list(lines)
    # 1) CSS replace: from `.flow-card { background: var(--card); border-radius: 14px;` to `.add-btn { ... }` (old flow card block)
    start = None; end = None
    for i, ln in enumerate(out):
        if start is None and ln.strip().startswith(".flow-card { background: var(--card); border-radius: 14px;"):
            start = i
        if start is not None and ln.strip().startswith(".add-btn { display: inline-block; border: 1px dashed var(--primary-light); color: var(--primary); font-size: 12px; border-radius: 8px; padding: 8px 16px; }"):
            end = i
            break
    assert start is not None and end is not None, "CSS anchors not found in " + path
    out[start:end+1] = NEW_CSS

    # 2) :root vars insert after gradient-cyan line
    gi = next(i for i, ln in enumerate(out) if ln.strip().startswith("--gradient-cyan:"))
    out[gi+1:gi+1] = NEW_ROOT

    # 3) drawer HTML insert before phone-frame close (before `    </div>` that precedes `    <!-- 角色演示开关`)
    rds = next(i for i, ln in enumerate(out) if ln.strip().startswith("<!-- 角色演示开关"))
    # the phone-frame close is two lines above (blank then </div>)
    close_idx = rds - 2
    assert out[close_idx].strip() == "</div>", "phone-frame close not where expected in " + path
    out[close_idx:close_idx] = NEW_DRAWER

    # 4) script include before main <script>
    si = next(i for i, ln in enumerate(out) if ln.strip() == "<script>")
    out[si:si] = ["    <script src=\"js/flow-config-store.js\"></script>"]

    # 5) JS replace: from FLOW_ITEMS comment through closing brace before init comment
    srv = next(i for i, ln in enumerate(out) if "服务流程（回迁自 demo，演示态数据 FLOW_ITEMS" in ln)
    init = next(i for i, ln in enumerate(out) if ln.strip().startswith("/* ===================== 初始化"))
    j = init - 1
    while out[j].strip() == "":
        j -= 1
    # NEW_JS with mode
    js_block = [ln.replace("%MODE%", mode) for ln in NEW_JS]
    out[srv:j+1] = js_block

    with io.open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(out))
    print("transformed:", path, "(mode=%s, lines=%d)" % (mode, len(out)))

transform("project-detail-completed-v2.html", "completed")
transform("project-detail-initial-v2.html", "initial")
print("DONE")
