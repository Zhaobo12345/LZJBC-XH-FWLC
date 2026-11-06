# -*- coding: utf-8 -*-
"""A1 后更新受影响测试断言：任务守恒、面板归属、Type 分布、来源标签。"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))


def upd(fn, items):
    p = os.path.join(HERE, fn)
    b = open(p, 'rb').read()
    s = b.decode('utf-8')
    for name, old, new in items:
        n = s.count(old)
        if n != 1:
            raise SystemExit('ANCHOR FAIL %s [%s] count=%d' % (fn, name, n))
        s = s.replace(old, new, 1)
        print('OK  %s :: %s' % (fn, name))
    open(p, 'wb').write(s.encode('utf-8'))


CONS = ("assert(qa('#panelContract .task-item').length === 68 && qa('#panelTemp .task-item').length === 16, '任务数守恒 68/16');",
        "assert(qa('#panelContract .task-item').length === 56 && qa('#panelTemp .task-item').length === 28, '任务数守恒 56/28');")
CONS2 = ("assert(qa(c.d, '#panelContract .task-item').length === 68 && qa(c.d, '#panelTemp .task-item').length === 16, '任务守恒 68/16');",
         "assert(qa(c.d, '#panelContract .task-item').length === 56 && qa(c.d, '#panelTemp .task-item').length === 28, '任务守恒 56/28');")

upd('test_collapse_fix.js', [('守恒', CONS[0], CONS[1])])
upd('test_ownband_collapse.js', [('守恒', CONS[0], CONS[1])])
upd('test_mytasks_flow.js', [('守恒', CONS2[0], CONS2[1])])
upd('test_mytasks_align.js', [(
    '清单 type 分布',
    "assert(qa(p, '.task-item[data-type=\"contract\"]').length === 6 && qa(p, '.task-item[data-type=\"temp\"]').length === 4, '合同 6 / 临时 4');",
    "assert(qa(p, '.task-item[data-type=\"contract\"]').length === 5 && qa(p, '.task-item[data-type=\"temp\"]').length === 5, '合同 5 / 非合同 5');")])
upd('test_hierarchy_fix.js', [(
    'cs 归属面板',
    "  const csC = g('#panelContract', 'cs');\n  assert(csC && csC.querySelectorAll('.stage-item').length === 0, '初步设计无阶段卡');\n  assert(csC && csC.querySelectorAll('.task-item').length === 4, '初步设计 4 条任务直接平铺');",
    "  const csC = g('#panelTemp', 'cs');\n  assert(csC && csC.querySelectorAll('.stage-item').length === 0, '初步设计无阶段卡');\n  assert(csC && csC.querySelectorAll('.task-item').length === 4, '初步设计 4 条流程任务直铺');")])

SNAP_OLD = """  ev("selectFlow('lh')");
  assert(count('#panelContract', 'lh') === 3, '量房 3 条任务直铺');
  assert(qa('#panelContract .flow-group[data-flow-id="lh"] .stage-item').length === 0, '量房无阶段卡（无阶段直接展示任务）');
  assert(qa('#panelContract .flow-group[data-flow-id="lh"] .task-list.show').length === 1, '量房任务在展开的 task-list 内');
  ev("selectFlow('cs')");
  assert(count('#panelContract', 'cs') === 4, '初步设计 4 条任务直铺');
  assert(qa('#panelContract .flow-group[data-flow-id="cs"] .stage-item').length === 0, '初步设计无阶段卡');
  ev("selectFlow('cz')");
  assert(count('#panelContract', 'cz') === 5, '主材安装 5 条阶段任务');
  assert(qa('#panelContract .flow-group[data-flow-id="cz"] .stage-item').length === 2, '主材安装 2 个阶段卡');
  assert(qa('#panelContract .flow-group[data-flow-id="cz"] .snapshot-note').length === 1, '主材安装标注「尚未创建合同」');
  assert(qa('#panelContract .flow-group[data-flow-id="cz"] .contract-section').length === 0, 'cz 不建 .contract-section，不误算合同进度');"""

SNAP_NEW = """  ev("selectFlow('lh')");
  assert(count('#panelContract', 'lh') === 0, '量房不含合同 → 合同面板无任务');
  assert(qa('#panelContract .flow-group[data-flow-id="lh"] .block-empty').length === 1, '量房合同面板给空态');
  assert(q('#panelContract .flow-group[data-flow-id="lh"] .snapshot-empty-title').textContent === '该流程项不含合同', '量房空态说明不含合同');
  assert(count('#panelTemp', 'lh') === 3, '量房 3 条流程任务直铺');
  assert(qa('#panelTemp .flow-group[data-flow-id="lh"] .stage-item').length === 0, '量房无阶段卡（无阶段直接展示任务）');
  assert(qa('#panelTemp .flow-group[data-flow-id="lh"] .temp-loose-list.show .task-item').length === 3, '量房任务在展开的无阶段单独任务区');
  ev("selectFlow('cs')");
  assert(count('#panelContract', 'cs') === 0, '初步设计不含合同 → 合同面板无任务');
  assert(count('#panelTemp', 'cs') === 4, '初步设计 4 条流程任务直铺');
  assert(qa('#panelTemp .flow-group[data-flow-id="cs"] .stage-item').length === 0, '初步设计无阶段卡');
  ev("selectFlow('cz')");
  assert(count('#panelContract', 'cz') === 0, '主材安装合同未创建 → 合同面板无任务');
  assert(q('#panelContract .flow-group[data-flow-id="cz"] .snapshot-empty-title').textContent === '合同尚未创建', '主材安装提示合同尚未创建');
  assert(qa('#panelContract .flow-group[data-flow-id="cz"] .snapshot-cta').length === 1, '主材安装给拟定合同入口');
  assert(count('#panelTemp', 'cz') === 5, '主材安装 5 条流程阶段任务');
  assert(qa('#panelTemp .flow-group[data-flow-id="cz"] .temp-stage-card').length === 2, '主材安装 2 个阶段卡');
  assert(qa('#panelTemp .flow-group[data-flow-id="cz"] .src-tag').length >= 2, '主材安装阶段标注「流程任务」来源');
  assert(qa('#panelContract .flow-group[data-flow-id="cz"] .contract-section').length === 0, 'cz 不建 .contract-section，不误算合同进度');"""

upd('test_tasktab.js', [
    ('合同面板守恒',
     "  assert(qa('#panelContract .task-item').length === 68, '合同面板 68 条（原 32 + 主合同自身 24 + 快照 12），实际 ' + qa('#panelContract .task-item').length);",
     "  assert(qa('#panelContract .task-item').length === 56, '合同面板 56 条（sg 50 + ht 6，无合同项已分流），实际 ' + qa('#panelContract .task-item').length);"),
    ('非合同面板守恒',
     "  assert(qa('#panelTemp .task-item').length === 16, '临时面板 16 条任务，实际 ' + qa('#panelTemp .task-item').length);",
     "  assert(qa('#panelTemp .task-item').length === 28, '临时/流程任务面板 28 条（原 16 + 分流 12），实际 ' + qa('#panelTemp .task-item').length);"),
    ('快照归属块', SNAP_OLD, SNAP_NEW),
    ('快照 12 条守恒',
     "  assert(count('#panelContract', 'lh') + count('#panelContract', 'cs') + count('#panelContract', 'cz') === 12, '快照补齐 12 条（3+4+5）');",
     "  assert(count('#panelTemp', 'lh') + count('#panelTemp', 'cs') + count('#panelTemp', 'cz') === 12, '快照 12 条（3+4+5）已分流至非合同面板');"),
    ('任务名守恒 84',
     "  assert(legacyNames.length === 72, '原有 48 + 主合同自身 24 = 72 条任务名仍在，实际 ' + legacyNames.length);\n  assert(legacyNames.every(x => x.textContent.trim().length > 0), '72 条任务名非空');",
     "  assert(legacyNames.length === 84, '原有 48 + 主合同自身 24 + 快照 12 = 84 条任务名守恒，实际 ' + legacyNames.length);\n  assert(legacyNames.every(x => x.textContent.trim().length > 0), '84 条任务名非空');"),
])
print('DONE')
