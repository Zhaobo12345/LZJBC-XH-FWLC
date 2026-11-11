/* ==========================================================================
   flow-letter-demo / demo.js  ·  《量房服务告知书》独立演示
   --------------------------------------------------------------------------
   三态仅为页面级展示变量：不落盘、不改任何流程状态、不进任务计数，
   不触碰指派权限与任务状态机。全部交互仅作用于当前页面 DOM。
   本轮为纯新增文件，不引用、不修改任何既有脚本或数据层。
   框外开关只改状态变量；框内不写入任何演示/说明性文字。

   ⑤⑥ 替代版（data-variant="alt"）仅在本文件内做增量扩展：
   文书流转留痕轴 / 3 条标准逐条确认 / 平台存证章节。
   ②③ 未带该标记，全部新增分支均不进入，行为与上一版完全一致。
   结果由确认动作触发系统自动呈现：不设「回填」步骤，已确认态同步显示结果与平台存证。
   ⑦ 对比页通过 URL ?compare=1 让子页隐藏框外栏，只保留手机屏。
   ========================================================================== */
(function () {
    'use strict';

    var STATE_KEYS = ['notice_pending_result', 'notice_wait_confirm', 'notice_confirmed'];
    var STATE_LABELS = {
        'notice_pending_result': '成果未出具',
        'notice_wait_confirm': '待确认',
        'notice_confirmed': '已确认'
    };
    var CHIP_LABELS = {
        'notice_pending_result': '待出成果',
        'notice_wait_confirm': '待确认',
        'notice_confirmed': '已确认'
    };
    var STAMP_LABELS = {
        'notice_pending_result': '待出成果',
        'notice_wait_confirm': '待确认',
        'notice_confirmed': '已确认'
    };
    /* 三态说明只呈现在手机框外 #dpStateText */
    var HINT_LABELS = {
        'notice_pending_result': '当前：成果未出具 · 橙章 · 仅可查看',
        'notice_wait_confirm': '当前：待确认 · 橙章 · 勾选后可确认',
        'notice_confirmed': '当前：已确认 · 绿章 · 可保存长图'
    };
    var NEXT_MAP = {
        '01': '02-notice-wait-confirm.html',
        '02': '03-notice-confirmed.html',
        '03': '04-no-block-board.html',
        '04': '01-config-launch.html',
        '05': '06-alt-confirmed.html',
        '06': '07-compare.html',
        '07': '01-config-launch.html'
    };
    var PREV_MAP = {
        '02': '01-config-launch.html',
        '03': '02-notice-wait-confirm.html',
        '04': '03-notice-confirmed.html',
        '05': '02-notice-wait-confirm.html',
        '06': '05-alt-wait-confirm.html',
        '07': '06-alt-confirmed.html'
    };
    var __DEFAULTS = {
        '01': 'notice_wait_confirm',
        '02': 'notice_wait_confirm',
        '03': 'notice_confirmed',
        '04': '',
        '05': 'notice_wait_confirm',
        '06': 'notice_confirmed',
        '07': ''
    };

    var initialized = false;
    var currentState = null;
    var agreed = false;
    var cfgHasContract = false;
    var cfgNoticeState = 'notice_wait_confirm';
    var cfgMark = false;
    var toastLog = [];
    var toastTimer = null;
    var jumpTimer = null;
    var pageId = '02';
    var isAlt = false;
    var clauseState = [false, false, false];

    function byId(id) { return document.getElementById(id); }
    function all(sel, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(sel));
    }
    function isJsdom() { return /jsdom/i.test(String(navigator.userAgent || '')); }
    function show(el, visible) {
        if (!el) return;
        if (visible) el.classList.remove('hidden');
        else el.classList.add('hidden');
    }

    /* 轻提示：同步登记到 toastLog，便于回归断言 */
    function showToast(msg, ms, skipLog) {
        if (!skipLog) toastLog.push(msg);
        var t = byId('appToast');
        if (t) {
            t.textContent = msg;
            t.classList.add('show');
        }
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            if (t) t.classList.remove('show');
            toastTimer = null;
        }, ms || 1600);
        return msg;
    }

    /* 唯一渲染入口：三态互斥全部通过 hidden 切换，②③ 单据 DOM 完全一致 */
    function renderState(s) {
        if (STATE_KEYS.indexOf(s) < 0) return false;

        var stamp = byId('statusStamp');
        if (stamp) {
            stamp.classList.remove('pending', 'passed');
            stamp.classList.add(s === 'notice_confirmed' ? 'passed' : 'pending');
        }
        var stampText = byId('stampText');
        if (stampText) stampText.textContent = STAMP_LABELS[s];

        /* 框外状态说明：框内零说明文字 */
        var hint = byId('dpStateText');
        if (hint) hint.textContent = HINT_LABELS[s];

        var done = (s === 'notice_confirmed');
        show(byId('resultPlaceholder'), !done);
        show(byId('resultFilled'), done);
        show(byId('signPending'), !done);
        show(byId('signDone'), done);
        show(byId('footerConfirmed'), done);
        show(byId('depositSection'), done);

        var waiting = (s === 'notice_wait_confirm');
        show(byId('agreeRow'), waiting);
        show(byId('btnConfirm'), waiting);
        show(byId('agreedBadge'), done);
        show(byId('btnSave'), done);
        show(byId('btnReadonly'), s === 'notice_pending_result');

        if (waiting) toggleAgree(agreed);
        if (isAlt) renderAlt(done, waiting);
        return true;
    }

    function syncStateOptions() {
        all('.dp-group[data-role="state"]').forEach(function (g) {
            all('.dp-opt', g).forEach(function (b) {
                if (b.getAttribute('data-v') === currentState) b.classList.add('on');
                else b.classList.remove('on');
            });
        });
    }

    function setState(s) {
        if (STATE_KEYS.indexOf(s) < 0) return false;
        currentState = s;
        renderState(s);
        syncStateOptions();
        return true;
    }

    /* 框外演示开关入口：只改页面级变量，不改写地址、不落盘 */
    function forceState(s) { return setState(s); }

    function toggleAgree(v) {
        agreed = !!v;
        var chk = byId('agreeCheck');
        if (chk) chk.checked = agreed;
        var btn = byId('btnConfirm');
        if (btn && !isAlt) {
            if (agreed) btn.classList.remove('is-disabled');
            else btn.classList.add('is-disabled');
        }
        var row = byId('agreeRow');
        if (row && agreed) row.classList.remove('error');
        return agreed;
    }

    /* ---------- ⑤⑥ 替代版：逐条确认（仅 data-variant="alt" 生效） ---------- */
    function clauseCount() {
        var n = 0;
        clauseState.forEach(function (v) { if (v) n++; });
        return n;
    }

    function renderClauses() {
        var done = (currentState === 'notice_confirmed');
        var n = clauseCount();
        all('.clause-check').forEach(function (lab, i) {
            var input = lab.querySelector('input');
            if (!input) return;
            input.checked = done || !!clauseState[i];
            input.disabled = done;
            if (done) lab.classList.add('readonly');
            else lab.classList.remove('readonly');
        });
        var prog = byId('clauseProgress');
        if (prog) prog.textContent = done ? '已逐条确认 3/3' : ('已逐条确认 ' + n + '/3');
        var allBtn = byId('btnAllAgree');
        if (allBtn) {
            if (done || n === 3) allBtn.classList.add('hidden');
            else allBtn.classList.remove('hidden');
        }
        var btn = byId('btnConfirm');
        if (btn && !done) {
            if (n === 3) btn.classList.remove('is-disabled');
            else btn.classList.add('is-disabled');
        }
        return n;
    }

    function toggleClause(i, v) {
        if (i < 0 || i > 2) return clauseCount();
        clauseState[i] = !!v;
        renderClauses();
        var bar = byId('clauseBar');
        if (bar) bar.classList.remove('error');
        return clauseCount();
    }

    function toggleAllClauses(v) {
        clauseState = [!!v, !!v, !!v];
        renderClauses();
        var bar = byId('clauseBar');
        if (bar) bar.classList.remove('error');
        return clauseCount();
    }

    /* 留痕轴 / 存证章节随三态切换；文案只含动作、时间与角色，无解释性文字 */
    function renderAlt(done, waiting) {
        [byId('tlNode1'), byId('tlNode2'), byId('tlNode3')].forEach(function (el, i) {
            if (!el) return;
            el.classList.remove('done', 'cur', 'todo');
            if (done || i < 2) el.classList.add('done');
            else if (i === 2 && waiting) el.classList.add('cur');
            else el.classList.add('todo');
        });
        var t3 = byId('tlTime3');
        if (t3) t3.textContent = done ? '2024-01-25 10:12 · 王先生（业主）· 平台存证' : '待业主确认';
        show(byId('clauseBar'), waiting);
        renderClauses();
    }

    /* 确认闭环：②③ 单勾；⑤⑥ 需 3/3 逐条确认。勾选后橙章转绿、系统自动呈现实测结果与平台存证 */
    function confirm() {
        if (isAlt) {
            if (clauseCount() < 3) {
                var bar = byId('clauseBar');
                if (bar) bar.classList.add('error');
                showToast('请逐条确认 3 项服务标准');
                return false;
            }
        } else if (!agreed) {
            var row = byId('agreeRow');
            if (row) row.classList.add('error');
            showToast('请先勾选「我已阅读并同意」');
            return false;
        }
        setState('notice_confirmed');
        showToast('已确认');
        if (!isJsdom()) {
            if (jumpTimer) clearTimeout(jumpTimer);
            jumpTimer = setTimeout(function () { goTo(NEXT_MAP[pageId]); }, 1200);
        }
        return true;
    }

    /* 保存长图：原型以两段轻提示模拟，不做任何真实下载或写入 */
    function saveLongImage() {
        showToast('长图生成中…', 900);
        toastLog.push('已保存告知书长图');
        setTimeout(function () { showToast('已保存告知书长图', 1800, true); }, 900);
        return true;
    }

    /* ① 告知书入口 = 流程项级：#fdDetailBody 内、本项任务上方。
       头部 #fdContractAct 保持既有语义：仅有合同流程项显示查看/拟定合同。 */
    function renderChip() {
        var head = byId('fdContractAct');
        var entry = byId('fdLetterEntry');
        var state = byId('fdLetterState');
        if (head) {
            if (cfgHasContract) {
                head.style.display = '';
                head.className = 'fd-act view';
                head.textContent = '查看合同 ›';
                head.setAttribute('data-kind', 'contract');
            } else {
                head.style.display = 'none';
                head.className = 'fd-act';
                head.textContent = '';
                head.removeAttribute('data-kind');
            }
        }
        if (!entry) return !!head;
        show(entry, !cfgHasContract);
        if (state) state.textContent = CHIP_LABELS[cfgNoticeState] + ' ›';
        entry.setAttribute('data-kind', cfgNoticeState === 'notice_confirmed' ? 'confirmed' : 'letter');
        /* 改动点标记仅改变轮廓，不写入任何框内文字 */
        if (cfgMark) entry.classList.add('dl-mark');
        else entry.classList.remove('dl-mark');
        return true;
    }

    function setMark(on) {
        cfgMark = !!on;
        renderChip();
        return cfgMark;
    }

    function openChip() {
        if (cfgHasContract) {
            showToast('含合同流程项走「查看 / 拟定合同」，本演示不实现');
            return false;
        }
        goTo(NEXT_MAP['01']);
        return true;
    }

    /* 页间串联：jsdom 下只返回目标文件名，不触发真实导航 */
    function goTo(file) {
        if (!file) return '';
        if (!isJsdom()) window.location.href = file;
        return file;
    }
    function goNext(cur) { return goTo(NEXT_MAP[cur]); }
    function goPrev(cur) { return goTo(PREV_MAP[cur]); }

    function closestOpt(node) {
        while (node && node !== document) {
            if (node.classList && node.classList.contains('dp-opt')) return node;
            node = node.parentNode;
        }
        return null;
    }

    function bindDemoPanel() {
        all('.dp-group').forEach(function (g) {
            g.addEventListener('click', function (e) {
                var btn = closestOpt(e.target);
                if (!btn) return;
                var v = btn.getAttribute('data-v') || '';
                all('.dp-opt', g).forEach(function (b) {
                    b.classList.toggle('on', b === btn);
                });
                if (g.id === 'optContract') {
                    cfgHasContract = (v === 'on');
                    renderChip();
                } else if (g.id === 'optNotice') {
                    cfgNoticeState = v;
                    renderChip();
                } else if (g.id === 'optMark') {
                    setMark(v === 'on');
                } else {
                    forceState(v);
                }
            });
        });
    }

    function init() {
        if (initialized) return true;
        initialized = true;
        pageId = document.body.getAttribute('data-page') || '02';
        isAlt = document.body.getAttribute('data-variant') === 'alt';
        if (/[?&]compare=1(?:&|$)/.test(String(window.location.search || ''))) {
            document.body.classList.add('compare-mode');
        }
        var st = document.body.getAttribute('data-default-state');
        if (st && STATE_KEYS.indexOf(st) >= 0) setState(st);
        renderChip();
        bindDemoPanel();

        var chk = byId('agreeCheck');
        if (chk) chk.addEventListener('change', function () { toggleAgree(chk.checked); });
        all('.clause-check input').forEach(function (input, i) {
            input.addEventListener('change', function () { toggleClause(i, input.checked); });
        });
        var btnAll = byId('btnAllAgree');
        if (btnAll) btnAll.addEventListener('click', function () { toggleAllClauses(true); });
        var btnConfirm = byId('btnConfirm');
        if (btnConfirm) btnConfirm.addEventListener('click', confirm);
        var btnSave = byId('btnSave');
        if (btnSave) btnSave.addEventListener('click', saveLongImage);
        var letterEntry = byId('fdLetterEntry');
        if (letterEntry) letterEntry.addEventListener('click', openChip);
        var headChip = byId('fdContractAct');
        if (headChip) headChip.addEventListener('click', function () {
            showToast('含合同流程项走「查看 / 拟定合同」，本演示不实现');
        });
        var btnAssign = byId('btnAssign');
        if (btnAssign) {
            btnAssign.addEventListener('click', function () {
                showToast('＋指派任务照常可用（本演示不实现任务派发）');
            });
        }
        return true;
    }

    window.FlowLetterDemo = {
        STATE_KEYS: STATE_KEYS,
        STATE_LABELS: STATE_LABELS,
        CHIP_LABELS: CHIP_LABELS,
        __DEFAULTS: __DEFAULTS,
        getState: function () { return currentState; },
        getPageId: function () { return pageId; },
        isAlt: function () { return isAlt; },
        isAgreed: function () { return agreed; },
        getToastLog: function () { return toastLog.slice(); },
        getCfgHasContract: function () { return cfgHasContract; },
        getCfgNoticeState: function () { return cfgNoticeState; },
        getCfgMark: function () { return cfgMark; },
        clauseCount: clauseCount,
        getClauseState: function () { return clauseState.slice(); },
        setState: setState,
        forceState: forceState,
        renderState: renderState,
        toggleAgree: toggleAgree,
        toggleClause: toggleClause,
        toggleAllClauses: toggleAllClauses,
        renderAlt: renderAlt,
        confirm: confirm,
        saveLongImage: saveLongImage,
        showToast: showToast,
        renderChip: renderChip,
        setMark: setMark,
        openChip: openChip,
        goTo: goTo,
        goNext: goNext,
        goPrev: goPrev,
        init: init
    };

    /* 脚本位于 body 末尾，DOM 已就绪：立即初始化，避免异步事件晚于首屏断言 */
    init();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    }
})();
