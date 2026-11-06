# -*- coding: utf-8 -*-
"""结果条口径变更后，同步更新旧测试断言（逐条精确替换，count 必须唯一）。"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))


def patch(fn, items):
    p = os.path.join(HERE, fn)
    s = open(p, 'rb').read().decode('utf-8')
    for name, old, new in items:
        n = s.count(old)
        if n != 1:
            raise SystemExit('ANCHOR FAIL [%s / %s] count=%d' % (fn, name, n))
        s = s.replace(old, new, 1)
        print('OK  %-28s %s' % (fn, name))
    open(p, 'wb').write(s.encode('utf-8'))


patch('test_tasktab.js', [
    ('面板描述', "'临时/流程任务面板 28 条（原 16 + 分流 12），实际 '", "'临时任务面板 28 条（原 16 + 分流 12），实际 '"),
    ('默认 65', "q('#resultCount').textContent === '共 50 个任务', '默认结果计数 50，实际 '", "q('#resultCount').textContent === '共 65 个任务', '默认结果计数 65（合同 50 + 临时 15），实际 '"),
    ('临时 Tab 65', "q('#resultCount').textContent === '共 15 个任务', '临时 Tab 结果计数 15，实际 '", "q('#resultCount').textContent === '共 65 个任务', '临时 Tab 结果计数 65（跨 Tab 一致），实际 '"),
    ('切回 65', "q('#resultCount').textContent === '共 50 个任务', '切回合同结果计数 50'", "q('#resultCount').textContent === '共 65 个任务', '切回合同结果计数 65'"),
    ('合同搜巡检 2', "q('#resultCount').textContent === '共 0 个任务', '合同面板搜「巡检」命中 0，实际 '", "q('#resultCount').textContent === '共 2 个任务', '合同面板搜「巡检」跨 Tab 合计 2，实际 '"),
    ('临时搜巡检 2', "q('#resultCount').textContent === '共 2 个任务', '临时面板搜「巡检」命中 2，实际 '", "q('#resultCount').textContent === '共 2 个任务', '临时面板搜「巡检」跨 Tab 合计 2，实际 '"),
    ('复位 65', "q('#resultCount').textContent === '共 50 个任务', '复位筛选后回到 50'", "q('#resultCount').textContent === '共 65 个任务', '复位筛选后回到 65'"),
    ('ht 7', "q('#resultCount').textContent === '共 6 个任务', 'ht 合同结果计数 6，实际 '", "q('#resultCount').textContent === '共 7 个任务', 'ht 合同结果计数 7（6+1），实际 '"),
])

patch('test_hierarchy_fix.js', [
    ('默认 65', "/共 50 个任务/.test(q('#resultCount').textContent), '默认结果计数 50，实际 '", "/共 65 个任务/.test(q('#resultCount').textContent), '默认结果计数 65，实际 '"),
    ('临时 Tab 65', "/共 15 个任务/.test(q('#resultCount').textContent), '临时 Tab 结果计数 15，实际 '", "/共 65 个任务/.test(q('#resultCount').textContent), '临时 Tab 结果计数 65，实际 '"),
    ('切回 65', "/共 50 个任务/.test(q('#resultCount').textContent), '切回合同 Tab 结果计数 50'", "/共 65 个任务/.test(q('#resultCount').textContent), '切回合同 Tab 结果计数 65'"),
    ('合同搜巡检 2', "/共 0 个任务/.test(q('#resultCount').textContent), '合同 Tab 搜「巡检」0 命中，实际 '", "/共 2 个任务/.test(q('#resultCount').textContent), '合同 Tab 搜「巡检」跨 Tab 合计 2，实际 '"),
    ('ht 7', "/共 6 个任务/.test(q('#resultCount').textContent), 'ht 合同结果计数 6'", "/共 7 个任务/.test(q('#resultCount').textContent), 'ht 合同结果计数 7（6+1）'"),
])

patch('test_strip_headers.js', [
    ('结果条 65', "/共 50 个任务/.test(q('#resultCount').textContent), '结果条 50 保留，实际 '", "/共 65 个任务/.test(q('#resultCount').textContent), '结果条 65 保留，实际 '"),
    ('临时 Tab 65', "/共 15 个任务/.test(q('#resultCount').textContent), '临时 Tab 结果条 15，实际 '", "/共 65 个任务/.test(q('#resultCount').textContent), '临时 Tab 结果条 65，实际 '"),
])

patch('test_collapse_fix.js', [
    ('结果条 65', "/共 50 个任务/.test(q('#resultCount').textContent), '结果条 50 不变，实际 '", "/共 65 个任务/.test(q('#resultCount').textContent), '结果条 65 不变，实际 '"),
])

patch('test_tasktab_real.js', [
    ('默认 65', "d.getElementById('resultCount').textContent === '共 50 个任务'", "d.getElementById('resultCount').textContent === '共 65 个任务'"),
])

patch('test_tasktab_url.js', [
    ('level 32', "da.getElementById('resultCount').textContent === '共 17 个任务',\n      '?level=水电工作组 只保留水电合同 17 条，实际 '", "da.getElementById('resultCount').textContent === '共 32 个任务',\n      '?level=水电工作组 合同 17 + 临时 15 = 32，实际 '"),
])

patch('test_mytasks_align.js', [
    ('普通访问 65', "/共 50 个任务/.test(q(d, '#resultCount').textContent), '普通访问结果条 50，实际 '", "/共 65 个任务/.test(q(d, '#resultCount').textContent), '普通访问结果条 65，实际 '"),
    ('切合同 65', "/共 50 个任务/.test(q(d, '#resultCount').textContent), '切合同后结果条 50'", "/共 65 个任务/.test(q(d, '#resultCount').textContent), '切合同后结果条 65'"),
])

patch('test_mytasks_flow.js', [
    ('切合同 65', "/共 50 个任务/.test(txt(d, '#resultCount')), '切合同 Tab 结果条 50'", "/共 65 个任务/.test(txt(d, '#resultCount')), '切合同 Tab 结果条 65'"),
    ('普通访问 65', "/共 50 个任务/.test(txt(c.d, '#resultCount')), '普通访问结果条 50'", "/共 65 个任务/.test(txt(c.d, '#resultCount')), '普通访问结果条 65'"),
])

patch('test_a1_scope.js', [
    ('Tab 文案', "txt(d, '.task-tab[data-tab=\"temp\"]').indexOf('临时/流程任务') === 0, 'Tab 改名「临时/流程任务」'", "txt(d, '.task-tab[data-tab=\"temp\"]').indexOf('临时任务') === 0, 'Tab 文案「临时任务」'"),
    ('空态指引', "indexOf('临时/流程任务') >= 0, '空态指引到非合同面板'", "indexOf('临时任务') >= 0, '空态指引到非合同面板'"),
    ('量房 3', "txt(d, '#resultCount') === '共 3 个任务', '量房非合同面板结果条 3 条'", "txt(d, '#resultCount') === '共 3 个任务', '量房结果条 3 条（合同 0 + 临时 3）'"),
])

print('DONE')
