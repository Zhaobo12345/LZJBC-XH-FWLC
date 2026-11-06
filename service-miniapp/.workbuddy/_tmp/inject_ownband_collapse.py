# -*- coding: utf-8 -*-
"""给「主合同阶段任务」行增加单独收起/展开（与临时阶段卡同构，零新增状态机）。"""
import sys, os

P = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'task-list.html')
P = os.path.abspath(P)
raw = open(P, 'rb').read()
s = raw.decode('utf-8')  # 保留 BOM 字符，行尾原样

def rep(old, new, tag):
    global s
    n = s.count(old)
    if n != 1:
        print('ABORT [%s] expect 1 occurrence, got %d' % (tag, n))
        sys.exit(1)
    s = s.replace(old, new, 1)
    print('OK   [%s]' % tag)

# 1. CSS：整行可点 + 折叠容器显隐 + 右侧「收起/展开」控件
rep(
"""        .mc-own-count { font-size: 12px; font-weight: 400; color: var(--text-tertiary); }
        .mc-own-stages { padding: 8px 10px 10px; }
""",
"""        .mc-own-count { font-size: 12px; font-weight: 400; color: var(--text-tertiary); }
        /* 主合同阶段任务行：整行可点，单独收起 / 展开自身阶段任务（与临时阶段卡同构） */
        .mc-own-band { cursor: pointer; user-select: none; }
        .mc-own-band:hover { background: #E4F0FF; }
        .mc-own-right { display: inline-flex; align-items: center; gap: 8px; }
        .mc-own-toggle { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 500; color: var(--primary-color); }
        .mc-own-toggle .arrow { font-size: 10px; color: var(--primary-color); transition: transform .3s; }
        .mc-own-toggle .arrow.expanded { transform: rotate(180deg); }
        .mc-own-stages { display: none; padding: 8px 10px 10px; }
        .mc-own-stages.show { display: block; }
""", 'css')

# 2. 生成时默认展开（双保险；initExpandAll 也会加 show）
rep("                stages.className = 'mc-own-stages';\n",
    "                stages.className = 'mc-own-stages show';\n", 'stages-default-show')

# 3. 行结构：整行 onclick + 右端「收起/展开」文案与箭头
rep(
"""                band.className = 'mc-own-band';
                band.innerHTML = '<span>主合同阶段任务</span><span class="mc-own-count">' +
                    stages.querySelectorAll('.stage-item').length + ' 阶段 · ' +
                    stages.querySelectorAll('.task-item').length + ' 任务</span>';
""",
"""                band.className = 'mc-own-band';
                band.setAttribute('onclick', 'toggleMainOwnStages(this)');
                band.innerHTML = '<span>主合同阶段任务</span><span class="mc-own-right">' +
                    '<span class="mc-own-count">' +
                    stages.querySelectorAll('.stage-item').length + ' 阶段 · ' +
                    stages.querySelectorAll('.task-item').length + ' 任务</span>' +
                    '<span class="mc-own-toggle"><span class="mc-own-toggle-text">收起</span>' +
                    '<span class="arrow expanded">▼</span></span></span>';
""", 'band-html')

# 4. 新增折叠函数（放在 toggleMainContract 之后）
rep(
"""            if (arrow) arrow.classList.toggle('expanded', !collapsed);
            syncExpandSnapshot();
        }

        // 统一可折叠容器集合：""",
"""            if (arrow) arrow.classList.toggle('expanded', !collapsed);
            syncExpandSnapshot();
        }

        // 「主合同阶段任务」行单独折叠：仅影响自身阶段任务区，不动主合同整体与子合同
        function toggleMainOwnStages(band) {
            var box = band.nextElementSibling;
            if (!box || !box.classList.contains('mc-own-stages')) return;
            var show = box.classList.toggle('show');
            var a = band.querySelector('.arrow');
            if (a) a.classList.toggle('expanded', show);
            var t = band.querySelector('.mc-own-toggle-text');
            if (t) t.textContent = show ? '收起' : '展开';
            syncExpandSnapshot();
        }
        // 统一收敛行内文案 / 箭头，供全局展开、筛选复原等场景调用
        function syncOwnBandState() {
            document.querySelectorAll('.task-panel .mc-own').forEach(function (own) {
                var show = !!own.querySelector('.mc-own-stages.show');
                var a = own.querySelector('.mc-own-band .arrow');
                var t = own.querySelector('.mc-own-toggle-text');
                if (a) a.classList.toggle('expanded', show);
                if (t) t.textContent = show ? '收起' : '展开';
            });
        }

        // 统一可折叠容器集合：""", 'js-functions')

# 5. 纳入统一可折叠容器集合（收起/展开全部、状态快照自动生效）
rep(
"            return document.querySelectorAll('.task-panel .stage-group, .task-panel .task-list, .task-panel .temp-stage-tasks, .task-panel .temp-loose-list');\n",
"            return document.querySelectorAll('.task-panel .stage-group, .task-panel .task-list, .task-panel .temp-stage-tasks, .task-panel .temp-loose-list, .task-panel .mc-own-stages');\n", 'expand-boxes')

# 6. 箭头统一同步时带上本行文案
rep(
"""                if (a) a.classList.toggle('expanded', !mc.classList.contains('collapsed'));
            });
        }
        function setAllExpanded(expand) {""",
"""                if (a) a.classList.toggle('expanded', !mc.classList.contains('collapsed'));
            });
            syncOwnBandState();
        }
        function setAllExpanded(expand) {""", 'sync-arrows')

# 7. 初始化展开列表 + 文案同步
rep(
"            document.querySelectorAll('.task-panel .flow-body, .task-panel .mc-children, .task-panel .stage-group, .task-panel .task-list, .task-panel .temp-tasks-list, .task-panel .temp-stage-tasks, .task-panel .temp-loose-list').forEach(function (el) {\n",
"            document.querySelectorAll('.task-panel .flow-body, .task-panel .mc-children, .task-panel .stage-group, .task-panel .task-list, .task-panel .temp-tasks-list, .task-panel .temp-stage-tasks, .task-panel .temp-loose-list, .task-panel .mc-own-stages').forEach(function (el) {\n", 'init-list')

rep(
"""            document.querySelectorAll('.task-panel .main-contract').forEach(function (mc) { mc.classList.remove('collapsed'); });
            syncExpandSnapshot();""",
"""            document.querySelectorAll('.task-panel .main-contract').forEach(function (mc) { mc.classList.remove('collapsed'); });
            syncOwnBandState();
            syncExpandSnapshot();""", 'init-sync')

# 8. 筛选命中时，祖先容器自动展开（与其他祖先一致）
rep(
"""            const lzl = task.closest('.temp-loose-list');
            if (lzl) lzl.classList.add('show');
        }
""",
"""            const lzl = task.closest('.temp-loose-list');
            if (lzl) lzl.classList.add('show');
            const mos = task.closest('.mc-own-stages');
            if (mos) mos.classList.add('show');
        }
""", 'expand-ancestors')

# 9. 筛选后统一刷新行内文案 / 箭头
rep(
"""            if (!isFiltering) restoreExpandState();
        }
""",
"""            if (!isFiltering) restoreExpandState();
            syncOwnBandState();
        }
""", 'filter-sync')

out = s.encode('utf-8')
open(P, 'wb').write(out)
b = open(P, 'rb').read()
print('DONE bytes %d -> %d, BOM=%s, CRLF=%d, LF=%d' % (
    len(raw), len(b), b[:3] == b'\xef\xbb\xbf', b.count(b'\r\n'), b.count(b'\n')))
