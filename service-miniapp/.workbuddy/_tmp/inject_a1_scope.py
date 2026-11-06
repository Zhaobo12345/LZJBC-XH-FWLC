# -*- coding: utf-8 -*-
"""A1：按合同是否真实存在分流任务归属 + Tab 语义改名 + 我的任务口径落地。
仅做精确字符串替换，保留 BOM / LF 字节特征。"""
import os, sys, io

BASE = os.path.dirname(os.path.abspath(__file__))
HTML = os.path.join(BASE, '..', '..', 'task-list.html')
STORE = os.path.join(BASE, '..', '..', 'js', 'my-tasks-store.js')


def read(p):
    with open(p, 'rb') as f:
        return f.read().decode('utf-8')


def write(p, s):
    with open(p, 'wb') as f:
        f.write(s.encode('utf-8'))


def apply(s, items):
    for name, old, new in items:
        n = s.count(old)
        if n != 1:
            raise SystemExit('ANCHOR FAIL [%s] count=%d' % (name, n))
        s = s.replace(old, new, 1)
        print('OK  ' + name)
    return s


# ==================== task-list.html ====================
h = read(HTML)

CSS_OLD = """        .temp-stage-tasks .task-item, .temp-loose-list .task-item { border-left: 3px solid #722ED1; }
</style>"""
CSS_NEW = """        .temp-stage-tasks .task-item, .temp-loose-list .task-item { border-left: 3px solid #722ED1; }
        /* ===== A1：无合同/合同未建流程项的空态与任务来源标签 ===== */
        .block-empty .snapshot-empty-title { display: block; font-size: 14px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; }
        .block-empty .snapshot-empty-hint { display: block; font-size: 12px; color: var(--text-tertiary); }
        .snapshot-cta { display: inline-block; margin-top: 14px; min-height: 40px; line-height: 40px; padding: 0 16px; border: 1px solid var(--primary-color); border-radius: 10px; color: var(--primary-color); font-size: 13px; cursor: pointer; }
        .src-tag { display: inline-block; margin-left: 8px; padding: 1px 6px; border-radius: 6px; background: #EDE0FB; color: #722ED1; font-size: 12px; font-weight: 400; }
</style>"""

SNAP_OLD = """        function snapshotHtml(sec, fid, isTemp) {
            if (isTemp) {
                var temps = (sec && sec.temp) || [];
                if (!temps.length) return '<div class="flow-block temp-block"><div class="block-empty">该流程项暂无临时任务</div></div>';
                return '<div class="flow-block temp-block"><div class="temp-tasks-list show">' +
                    temps.map(function (t) { return taskRow(t, fid, 'temp'); }).join('') + '</div></div>';
            }
            if (!sec || (!sec.tasks.length && !sec.stages.length)) {
                return '<div class="flow-block contract-block"><div class="block-empty">该流程项暂无任务</div></div>';
            }
            var h = '<div class="flow-block contract-block">';
            if (sec.noContractYet) h += '<div class="snapshot-note">该流程项含合同，但尚未创建合同</div>';
            if (sec.stages.length) {
                h += '<div class="contract-tree">';
                sec.stages.forEach(function (sg) {
                    h += '<div class="stage-group show"><div class="stage-item">' +
                        '<div class="stage-header" onclick="toggleStage(this)"><div class="stage-dot pending"></div>' +
                        '<div class="stage-name">' + escTxt(sg.n) + '</div>' +
                        '<div class="stage-count">0/' + sg.tasks.length + ' 待开始</div><div class="arrow expanded">▼</div></div>' +
                        '<div class="task-list show">' +
                        sg.tasks.map(function (n) { return taskRow({ n: n, s: 'pending', e: '待指派' }, fid, 'contract'); }).join('') +
                        '</div></div></div>';
                });
                h += '</div>';
            } else {
                h += '<div class="task-list show">' + sec.tasks.map(function (t) { return taskRow(t, fid, 'contract'); }).join('') + '</div>';
            }
            return h + '</div>';
        }"""

SNAP_NEW = """        // A1：无合同 / 合同未创建的流程项，合同面板只给引导空态；原生任务统一归入非合同面板
        function snapshotStageCard(sg, fid, srcLabel) {
            return '<div class="temp-stage-card" data-src="flow" data-temp-stage="' + escTxt(sg.n) + '">' +
                '<div class="temp-stage-head" onclick="toggleTempStage(this)">' +
                '<span>' + escTxt(sg.n) + '<span class="src-tag">' + escTxt(srcLabel) + '</span></span>' +
                '<span class="temp-stage-right"><span class="badge-n">' + sg.tasks.length +
                '</span><span class="arrow expanded">▼</span></span></div>' +
                '<div class="temp-stage-tasks show">' +
                sg.tasks.map(function (n) { return taskRow({ n: n, s: 'pending', e: '待指派' }, fid, 'temp'); }).join('') +
                '</div></div>';
        }

        function snapshotLoose(tasks, fid, srcLabel) {
            return '<div class="temp-loose" data-temp-loose="1" data-src="' +
                (srcLabel === '流程任务' ? 'flow' : 'temp') + '">' +
                '<div class="temp-loose-band">无阶段单独任务 <span class="src-tag">' + escTxt(srcLabel) +
                '</span> <span class="badge-n">' + tasks.length + '</span></div>' +
                '<div class="temp-loose-list show">' +
                tasks.map(function (t) { return taskRow(t, fid, 'temp'); }).join('') + '</div></div>';
        }

        function snapshotHtml(sec, fid, isTemp) {
            var s = sec || { hasContract: false, stages: [], temp: [], tasks: [] };
            var stages = s.stages || [], tasks = s.tasks || [], temps = s.temp || [];
            if (!isTemp) {
                // 合同内任务：仅当该流程项已真实创建合同才可能出现（快照项目前均无合同实例）
                if (s.hasRealContract && (tasks.length || stages.length)) {
                    var ch = '<div class="flow-block contract-block">';
                    if (stages.length) {
                        ch += '<div class="contract-tree">';
                        stages.forEach(function (sg) {
                            ch += '<div class="stage-group show"><div class="stage-item">' +
                                '<div class="stage-header" onclick="toggleStage(this)"><div class="stage-dot pending"></div>' +
                                '<div class="stage-name">' + escTxt(sg.n) + '</div>' +
                                '<div class="stage-count">0/' + sg.tasks.length + ' 待开始</div><div class="arrow expanded">▼</div></div>' +
                                '<div class="task-list show">' +
                                sg.tasks.map(function (n) { return taskRow({ n: n, s: 'pending', e: '待指派' }, fid, 'contract'); }).join('') +
                                '</div></div></div>';
                        });
                        ch += '</div>';
                    } else {
                        ch += '<div class="task-list show">' +
                            tasks.map(function (t) { return taskRow(t, fid, 'contract'); }).join('') + '</div>';
                    }
                    return ch + '</div>';
                }
                var title = s.noContractYet ? '合同尚未创建' : '该流程项不含合同';
                var hint = s.noContractYet
                    ? '该项已开启合同，拟定合同后阶段任务才归入「合同内任务」'
                    : '该项为纯任务流程项，任务统一在「临时/流程任务」中查看';
                var cta = s.noContractYet
                    ? '<span class="snapshot-cta" onclick="showToast(\\'请到项目主页服务流程浮窗内拟定合同\\')">去拟定合同 ›</span>'
                    : '';
                return '<div class="flow-block contract-block"><div class="block-empty">' +
                    '<span class="snapshot-empty-title">' + title + '</span>' +
                    '<span class="snapshot-empty-hint">' + hint + '</span>' + cta + '</div></div>';
            }
            // 非合同面板：区分「流程任务」（流程项自带）与「临时任务」（临时新增）
            if (!tasks.length && !stages.length && !temps.length) {
                return '<div class="flow-block temp-block" data-temp-done="1"><div class="block-empty">' +
                    '该流程项暂无临时/流程任务</div></div>';
            }
            var b = '<div class="flow-block temp-block" data-temp-done="1">' +
                '<div class="temp-tasks-list show"><div class="temp-structured">';
            stages.forEach(function (sg) { b += snapshotStageCard(sg, fid, '流程任务'); });
            if (tasks.length) b += snapshotLoose(tasks, fid, '流程任务');
            if (temps.length) b += snapshotLoose(temps, fid, '临时任务');
            return b + '</div></div></div>';
        }"""

MTSTATUS_OLD = """        var MT_STATUS = {"""
MTSTATUS_NEW = """        // 「我」在本清单中的身份，与下方 CURRENT_USER 保持一致
        var MT_USER = '张三';
        var MT_STATUS = {"""

MTROW_OLD = """        function mtRow(t) {
            var st = MT_STATUS[t.status] || MT_STATUS.pending;
            var meta = (t.type === 'temp' ? '临时任务' : '合同内任务') +
                (t.stage ? ' · ' + escTxt(t.stage) : '') +
                (t.contract ? ' · ' + escTxt(t.contract) : '');
            return '<div class="task-item" data-type="' + t.type + '" data-status="' + t.status +
                '" data-priority="normal" data-participant="true" data-flow-id="' + escTxt(t.flowId) +
                '" data-mt-id="' + escTxt(t.id) + '" onclick="goToTaskDetail(this)">' +"""
MTROW_NEW = """        function mtRow(t) {
            var st = MT_STATUS[t.status] || MT_STATUS.pending;
            var exec = t.exec || '';
            var confirms = t.confirms || [];
            // 归属全集 = 执行人是我 ∨ 确认人含我；不再硬编码「我参与」
            var isMine = exec === MT_USER || confirms.indexOf(MT_USER) !== -1;
            var meta = (t.type === 'temp' ? '临时/流程任务' : '合同内任务') +
                (t.stage ? ' · ' + escTxt(t.stage) : '') +
                (t.contract ? ' · ' + escTxt(t.contract) : '');
            return '<div class="task-item" data-type="' + t.type + '" data-status="' + t.status +
                '" data-priority="normal" data-participant="' + (isMine ? 'true' : 'false') +
                '" data-exec="' + escTxt(exec) + '" data-confirms="' + escTxt(confirms.join('、')) +
                '" data-flow-id="' + escTxt(t.flowId) +
                '" data-mt-id="' + escTxt(t.id) + '" onclick="goToTaskDetail(this)">' +"""

PASSROLE_OLD = """        function passesRole(task, status, participant) {
            const role = currentFilters.role;
            if (role === 'all') return true;
            if (role === 'mine') return participant;
            const r = getTaskRole(task);
            if (role === 'exec') return r.executor === CURRENT_USER && status !== 'completed';
            if (role === 'confirm') return r.confirmers.indexOf(CURRENT_USER) !== -1 && status === 'confirming';
            return true;
        }"""
PASSROLE_NEW = """        function passesRole(task, status, participant) {
            const role = currentFilters.role;
            if (role === 'all') return true;
            // 我的任务清单：按 exec / confirms 字段判定（全集 + 两个行动子集）
            if (task.dataset.mtId) {
                const ex = (task.dataset.exec || '').trim();
                const cf = (task.dataset.confirms || '').split(/[、,，]/).map(function (s) { return s.trim(); }).filter(Boolean);
                const mine = ex === MT_USER || cf.indexOf(MT_USER) !== -1;
                if (role === 'mine') return mine;
                if (role === 'exec') return ex === MT_USER && status !== 'completed' && status !== 'confirming';
                if (role === 'confirm') return cf.indexOf(MT_USER) !== -1 && status === 'confirming';
                return true;
            }
            if (role === 'mine') return participant;
            const r = getTaskRole(task);
            if (role === 'exec') return r.executor === CURRENT_USER && status !== 'completed';
            if (role === 'confirm') return r.confirmers.indexOf(CURRENT_USER) !== -1 && status === 'confirming';
            return true;
        }"""

h = apply(h, [
    ('CSS A1 空态与来源标签', CSS_OLD, CSS_NEW),
    ('Tab 文案改名', 'onclick="switchTaskTab(\'temp\')">临时任务<span',
     'onclick="switchTaskTab(\'temp\')">临时/流程任务<span'),
    ('snapshotHtml 分流', SNAP_OLD, SNAP_NEW),
    ('MT_USER 常量', MTSTATUS_OLD, MTSTATUS_NEW),
    ('mtRow 归属字段', MTROW_OLD, MTROW_NEW),
    ('passesRole 清单口径', PASSROLE_OLD, PASSROLE_NEW),
    ('静态临时任务阶段来源标签',
     "'<span>' + escTxt(grp.n) + '</span>' +",
     "'<span>' + escTxt(grp.n) + '<span class=\"src-tag\">临时任务</span></span>' +"),
    ('静态临时任务无阶段来源标签',
     "lz.innerHTML = '<div class=\"temp-loose-band\">无阶段单独任务 <span class=\"badge-n\">' +",
     "lz.innerHTML = '<div class=\"temp-loose-band\">无阶段单独任务 <span class=\"src-tag\">临时任务</span> <span class=\"badge-n\">' +"),
    ('筛选标签注明作用域',
     "                tags.push({ type: 'role', text: roleText });",
     "                tags.push({ type: 'role', text: roleText + (activeTab === 'mytasks' ? ' · 我的任务清单' : ' · 当前流程项 · 当前分类') });"),
])
# 两处写入都留到最后，任一锚点失败时磁盘文件保持原样

# ==================== js/my-tasks-store.js ====================
s = read(STORE)

HEAD_OLD = """   - type: contract 合同内任务 / temp 临时任务；
   - status: pending 待处理 / confirming 确认中 / completed 已完成（对应主页三态）。"""
HEAD_NEW = """   - type: contract 合同内任务 / temp 非合同任务（临时任务或流程项自带流程任务）；
   - status: pending 待处理 / confirming 确认中 / completed 已完成（对应主页三态）；
   - exec / confirms：归属口径。我的任务 = 我参与 = 执行人是我 ∨ 确认人含我；
     待我执行 = 执行人是我且非已完成/确认中；待我确认 = 确认人含我且确认中。"""

s = apply(s, [('store 口径注释', HEAD_OLD, HEAD_NEW)])

import re

# n05：主材安装尚未创建合同，任务不再归属合同内任务
N05_OLD = "{ id: 'n05', name: '瓷砖/石材进场', flowId: 'cz', type: 'contract', status: 'pending', stage: '主材进场阶段', contract: '尚未创建合同' },"
N05_NEW = "{ id: 'n05', name: '瓷砖/石材进场', flowId: 'cz', type: 'temp', status: 'pending', stage: '主材进场阶段' },"
s = apply(s, [('n05 改为非合同任务', N05_OLD, N05_NEW)])

# 归属字段：待我执行组（执行人是我）/ 待我确认组（确认人含我）/ 其余（已完成，仅参与）
EXEC_ME = set(['n01', 'n02', 'n03', 'n04', 'n05', 'n08', 'n09', 'n10',
               'w01', 'w05', 'w06', 'w07', 'w08'])
CONFIRM_ME = set(['n06', 'n07', 'w02', 'w03', 'w04'])
PAT = re.compile(r"(?m)^(?P<head>\s*\{ id: '(?P<id>[nw]\d\d)',[^\n]*?)(?P<tail>\s*\},?\s*)$")
hits = [0]


def add_fields(m):
    ident = m.group('id')
    if ident in EXEC_ME:
        extra = ", exec: '张三', confirms: ['陈庄']"
    elif ident in CONFIRM_ME:
        extra = ", exec: '陈庄', confirms: ['张三']"
    else:
        return m.group(0)
    hits[0] += 1
    return m.group('head') + extra + m.group('tail')


s = PAT.sub(add_fields, s)
if hits[0] != 18:
    raise SystemExit('STORE FIELD FAIL hits=%d' % hits[0])
print('OK  store 归属字段 18 行')
write(HTML, h)
write(STORE, s)
print('DONE')
