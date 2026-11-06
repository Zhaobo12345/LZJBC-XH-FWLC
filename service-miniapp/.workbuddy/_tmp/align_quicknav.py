# -*- coding: utf-8 -*-
import io, sys

FILES = ['project-detail-initial-v2.html', 'project-detail-completed-v2.html']

QN_CSS = (
    "        .quick-nav .qn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; "
    "min-height: 40px; border-radius: var(--r-block); background: #fff; border: 1px solid var(--line-light); "
    "box-shadow: 0 1px 4px rgba(22,119,255,.05); }\n"
    "        .quick-nav .qn .qn-ic { width: 22px; height: 22px; border-radius: 7px; background: linear-gradient(135deg,#4096ff,#0b57d0); "
    "display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; font-weight: 500; box-shadow: 0 2px 6px rgba(22,119,255,.25); }\n"
    "        .quick-nav .qn:nth-child(2) .qn-ic { background: linear-gradient(135deg,#36cfc9,#08979c); box-shadow: 0 2px 6px rgba(8,151,156,.25); }\n"
    "        .quick-nav .qn:nth-child(3) .qn-ic { background: linear-gradient(135deg,#9254de,#531dab); box-shadow: 0 2px 6px rgba(83,29,171,.25); }\n"
    "        .quick-nav .qn:nth-child(4) .qn-ic { background: linear-gradient(135deg,#73d13d,#237804); box-shadow: 0 2px 6px rgba(35,120,4,.25); }\n"
    "        .quick-nav .qn .qn-tx { font-size: var(--fs-11); color: var(--text-2); }\n"
)

def old_block(oid):
    return (
        "                '<div class=\"quick-nav qn-3\" id=\"" + oid + "\">' +\n"
        "                    '<div class=\"quick-nav-item\" onclick=\"go(\\'team-members.html\\')\"><div class=\"icon structure\">🏗️</div><div class=\"label\">团队成员</div></div>' +\n"
        "                    '<div class=\"quick-nav-item\" onclick=\"go(\\'project-files.html\\')\"><div class=\"icon file\">📁</div><div class=\"label\">资料</div></div>' +\n"
        "                    '<div class=\"quick-nav-item\" onclick=\"go(\\'statement-list.html\\')\"><div class=\"icon statement\">💰</div><div class=\"label\">对账单</div></div>' +\n"
        "                '</div>' +\n"
    )

def new_block(worker):
    if worker:
        items = [
            "<div class=\"qn\" onclick=\"go(\\'activity-list.html\\')\"><span class=\"qn-ic\">动</span><span class=\"qn-tx\">项目动态</span></div>",
            "<div class=\"qn\" onclick=\"go(\\'member.html\\')\"><span class=\"qn-ic\">团</span><span class=\"qn-tx\">团队成员</span></div>",
            "<div class=\"qn\" onclick=\"go(\\'project-files.html\\')\"><span class=\"qn-ic\">资</span><span class=\"qn-tx\">资料</span></div>",
            "<div class=\"qn\" onclick=\"go(\\'contract-detail.html\\')\"><span class=\"qn-ic\">合</span><span class=\"qn-tx\">我的合同</span></div>",
        ]
    else:
        items = [
            "<div class=\"qn\" onclick=\"go(\\'member.html\\')\"><span class=\"qn-ic\">众</span><span class=\"qn-tx\">团队成员</span></div>",
            "<div class=\"qn\" onclick=\"go(\\'project-files.html\\')\"><span class=\"qn-ic\">资</span><span class=\"qn-tx\">资料</span></div>",
            "<div class=\"qn\" onclick=\"go(\\'statement-list.html\\')\"><span class=\"qn-ic\">账</span><span class=\"qn-tx\">对账\u5355</span></div>",
            "<div class=\"qn\" onclick=\"go(\\'contract-list.html\\')\"><span class=\"qn-ic\">合</span><span class=\"qn-tx\">合同</span></div>",
        ]
    item_lines = "\n".join("                    '" + it + "' +" for it in items)
    return (
        "                '<div class=\"quick-nav\">' +\n"
        + item_lines + "\n"
        + "                '</div>' +\n"
    )

# 各文件：非工人/工人 对应的 quick-nav id
IDS = {
    'project-detail-initial-v2.html': [('quickNav', False), ('quickNavWork', True)],
    'project-detail-completed-v2.html': [('quickNavNon', False), ('quickNavWork', True)],
}

for f in FILES:
    data = io.open(f, encoding='utf-8', newline='').read()
    # 1) 注入 .qn CSS（在 .qn-card 之后）
    anchor = "        .qn-card { padding: 4px 12px; }\n"
    assert anchor in data, f + ": 未找到 .qn-card CSS 锚点"
    data = data.replace(anchor, anchor + QN_CSS, 1)
    # 2) 替换 4 处快捷入口
    for oid, worker in IDS[f]:
        old = old_block(oid)
        cnt = data.count(old)
        assert cnt == 1, f + " id=" + oid + " 命中 " + str(cnt) + " 次"
        data = data.replace(old, new_block(worker))
    # 校验残留
    assert data.count('quick-nav qn-3') == 0, f + " 仍有 qn-3"
    assert data.count('team-members.html') == 0, f + " 仍有死链 team-members.html"
    io.open(f, 'w', encoding='utf-8', newline='').write(data)
    print(f, "OK : 注入 .qn CSS + 4 处快捷入口已对齐为 4 项")
