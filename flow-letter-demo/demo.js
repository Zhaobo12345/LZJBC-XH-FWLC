/* ==========================================================================
   flow-letter-demo / demo.js  ·  《量房服务告知书》四页独立演示
   --------------------------------------------------------------------------
   三态仅为页面级展示变量：不落盘、不改任何流程状态、不进任务计数，
   不触碰指派权限与任务状态机。全部交互仅作用于当前页面 DOM。
   本轮为纯新增文件，不引用、不修改任何既有脚本或数据层。
   框外开关只改状态变量；框内不写入任何演示/说明性文字。
   ========================================================================== */
(function () {
    'use strict';

    var STATE_KEYS = ['notice_pending_result', 'notice_wait_confirm', 'notice_confirmed'];
    var STATE_LABELS = {
        'notice_pending_result': '结果未回填',
        'notice_wait_confirm': '待确认',
        'notice_confirmed': '已确认'
    };
    var CHIP_LABELS = {
        'notice_pending_result': '待回填',
        'notice_wait_confirm': '待确认',
        'notice_confirmed': '已确认'
    };
    var STAMP_LABELS = {
        'notice_pending_result': '待回填',
        'notice_wait_confirm': '待确认',
        'notice_confirmed': '已确认'
    };
    /* 三态说明只呈现在手机框外 #dpStateText */
    var HINT_LABELS = {
        'notice_pending_result': '当前：结果未回填 · 橙章 · 仅可查看',
        'notice_wait_confirm': '当前：待确认 · 橙章 · 勾选后可确认',
        'notice_confirmed': '当前：已确认 · 绿章 · 可保存长图'
    };
    var NEXT_MAP = {
        '01': '02-notice-wait-confirm.html',
        '02': '03-notice-confirmed.html',
        '03': '04-no-block-board.html',
        '04': '01-config-launch.html'
    };
    var PREV_MAP = {
        '02': '01-config-launch.html',
        '03': '02-notice-wait-confirm.html',
        '04': '03-notice-confirmed.html'
    };
    var __DEFAULTS = {
        '01': 'notice_wait_confirm',
        '02': 'notice_wait_confirm',
        '03': 'notice_confirmed',
        '04': ''
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

        var waiting = (s === 'notice_wait_confirm');
        show(byId('agreeRow'), waiting);
        show(byId('btnConfirm'), waiting);
        show(byId('agreedBadge'), done);
        show(byId('btnSave'), done);
        show(byId('btnReadonly'), s === 'notice_pending_result');

        if (waiting) toggleAgree(agreed);
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
        if (btn) {
            if (agreed) btn.classList.remove('is-disabled');
            else btn.classList.add('is-disabled');
        }
        var row = byId('agreeRow');
        if (row && agreed) row.classList.remove('error');
        return agreed;
    }

    /* 确认闭环：未勾选不生效；勾选后橙章转绿、结果回填、可存长图 */
    function confirm() {
        if (!agreed) {
            var row = byId('agreeRow');
            if (row) row.classList.add('error');
            showToast('请先勾选「我已阅读并同意」');
            return false;
        }
        setState('notice_confirmed');
        showToast('已确认');
        if (!isJsdom()) {
            if (jumpTimer) clearTimeout(jumpTimer);
            jumpTimer = setTimeout(function () { goTo(NEXT_MAP['02']); }, 1200);
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

    /* ① 浮窗 chip：与「包含合同」开/关互斥，同一 DOM 位零新增行高 */
    function renderChip() {
        var chip = byId('fdContractAct');
        if (!chip) return false;
        chip.classList.remove('create', 'view');
        if (cfgHasContract) {
            chip.textContent = '查看合同 ›';
            chip.classList.add('view');
            chip.setAttribute('data-kind', 'contract');
        } else {
            chip.textContent = '告知书·' + CHIP_LABELS[cfgNoticeState] + ' ›';
            chip.classList.add('create');
            chip.setAttribute('data-kind', 'letter');
        }
        /* 改动点标记仅改变轮廓，不写入任何框内文字 */
        if (cfgMark) chip.classList.add('dl-mark');
        else chip.classList.remove('dl-mark');
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
        var st = document.body.getAttribute('data-default-state');
        if (st && STATE_KEYS.indexOf(st) >= 0) setState(st);
        renderChip();
        bindDemoPanel();

        var chk = byId('agreeCheck');
        if (chk) chk.addEventListener('change', function () { toggleAgree(chk.checked); });
        var btnConfirm = byId('btnConfirm');
        if (btnConfirm) btnConfirm.addEventListener('click', confirm);
        var btnSave = byId('btnSave');
        if (btnSave) btnSave.addEventListener('click', saveLongImage);
        var chip = byId('fdContractAct');
        if (chip) chip.addEventListener('click', openChip);
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
        isAgreed: function () { return agreed; },
        getToastLog: function () { return toastLog.slice(); },
        getCfgHasContract: function () { return cfgHasContract; },
        getCfgNoticeState: function () { return cfgNoticeState; },
        getCfgMark: function () { return cfgMark; },
        setState: setState,
        forceState: forceState,
        renderState: renderState,
        toggleAgree: toggleAgree,
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
