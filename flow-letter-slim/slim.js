/* ==========================================================================
   flow-letter-slim / slim.js · 量房服务告知书「A 档精简美化版」
   --------------------------------------------------------------------------
   页面级两态展示变量：不落盘、不改流程状态、不进任务计数、不碰指派链与任务状态机。
   与 flow-letter-demo/ 完全隔离：不引用其脚本、不写其数据、不改其文件。
   口径：告知书仅「通知业主 + 业主知晓且同意开始量房」；量房结果归量房服务项任务，本页零结果展示、零结果关联。
   确认动作原地转绿 + 轻提示，不再自动跳页；②③ 两态合并为 02-letter.html 一页多态。
   ========================================================================== */
(function () {
    'use strict';

    var STATE_KEYS = ['notice_wait_confirm', 'notice_confirmed'];
    var STATE_LABELS = {
        'notice_wait_confirm': '待确认',
        'notice_confirmed': '已确认'
    };
    var PILL_LABELS = {
        'notice_wait_confirm': '待确认',
        'notice_confirmed': '已确认'
    };
    var HINTS = {
        'notice_wait_confirm': '当前：待确认 · 橙章 · 勾选「同意开始量房」后点底栏按钮，本页原地转绿',
        'notice_confirmed': '当前：已确认 · 绿章 · 业主已知晓并同意开始量房；量房结果在「量房」服务项任务中查看'
    };
    var SCENES = {
        'no_wait': { label: '无合同 · 待确认', chip: '待确认', state: 'notice_wait_confirm', kind: 'letter' },
        'no_done': { label: '无合同 · 已确认', chip: '已确认', state: 'notice_confirmed', kind: 'confirmed' },
        'with_contract': { label: '有合同', chip: '', state: '', kind: 'contract' }
    };

    var initialized = false;
    var currentState = null;
    var currentScene = 'no_wait';
    var agreed = false;
    var toastLog = [];
    var toastTimer = null;
    var pageId = '02';

    function byId(id) { return document.getElementById(id); }
    function all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
    function isJsdom() { return /jsdom/i.test(String(navigator.userAgent || '')); }
    function show(el, visible) {
        if (!el) return;
        if (visible) el.classList.remove('hidden');
        else el.classList.add('hidden');
    }
    function showToast(msg, ms) {
        toastLog.push(msg);
        var t = byId('appToast');
        if (t) { t.textContent = msg; t.classList.add('show'); }
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            if (t) t.classList.remove('show');
            toastTimer = null;
        }, ms || 1600);
        return msg;
    }

    /* ---------- 02：一页多态，唯一渲染入口 ---------- */
    function renderState(s) {
        if (STATE_KEYS.indexOf(s) < 0) return false;
        currentState = s;
        var done = (s === 'notice_confirmed');
        var waiting = (s === 'notice_wait_confirm');

        var pill = byId('statusPill');
        if (pill) {
            pill.classList.remove('ok', 'idle');
            if (done) pill.classList.add('ok');
            pill.textContent = PILL_LABELS[s];
        }
        var hint = byId('stateHint');
        if (hint) hint.textContent = HINTS[s];

        /* 零结果展示：告知书不呈现实测数据 / 达标结论 / 交付物，也不与任务结果关联 */
        show(byId('agreeRow'), waiting);
        show(byId('agreedRow'), done);
        show(byId('docFoot'), done);

        /* 已确认态：底栏收起，保存长图降级为页脚文字链 */
        var frame = byId('phoneFrame');
        if (frame) frame.classList.toggle('no-actions', done);

        var btn = byId('btnAction');
        if (btn) {
            btn.classList.remove('secondary', 'is-disabled');
            if (done) {
                btn.textContent = '已同意开始量房';
                btn.classList.add('is-disabled');
            } else if (waiting) {
                btn.textContent = '同意开始量房';
                if (!agreed) btn.classList.add('is-disabled');
            }
        }
        var row = byId('agreeRow');
        if (row) row.classList.remove('error');
        syncStateButtons();
        return true;
    }

    function syncStateButtons() {
        all('#stateSeg button').forEach(function (b) {
            b.classList.toggle('on', b.getAttribute('data-v') === currentState);
        });
    }

    function setState(s) { return renderState(s); }

    function toggleAgree(v) {
        agreed = !!v;
        var chk = byId('agreeCheck');
        if (chk) chk.checked = agreed;
        var row = byId('agreeRow');
        if (row && agreed) row.classList.remove('error');
        if (currentState === 'notice_wait_confirm') renderState(currentState);
        return agreed;
    }

    /* 确认闭环：原地转绿，不跳转任何页面 */
    function confirm() {
        if (currentState !== 'notice_wait_confirm') return false;
        if (!agreed) {
            var row = byId('agreeRow');
            if (row) row.classList.add('error');
            showToast('请先勾选「同意开始量房」');
            return false;
        }
        renderState('notice_confirmed');
        showToast('已确认 · 业主已知晓并同意开始量房');
        return true;
    }

    function saveLongImage() {
        showToast('告知书长图已生成（原型演示）');
        return true;
    }

    /* ---------- 01：一组「演示场景」预设 ---------- */
    function renderScene(key) {
        if (!SCENES[key]) return false;
        currentScene = key;
        var cfg = SCENES[key];
        var withContract = (key === 'with_contract');
        show(byId('letterEntry'), !withContract);
        show(byId('headAct'), withContract);
        var chip = byId('entryChip');
        if (chip && !withContract) chip.textContent = cfg.chip + ' ›';
        var entry = byId('letterEntry');
        if (entry) entry.setAttribute('data-kind', cfg.kind);
        var hint = byId('sceneHint');
        if (hint) {
            hint.textContent = withContract
                ? '有合同流程项：告知书入口隐藏，浮窗头部显示「查看合同 ›」，不承载告知书。'
                : '无合同流程项：告知书入口位于量房流程项下、本项任务上方（' + cfg.label + '）；量房结果在本项任务中查看。';
        }
        all('#sceneSeg button').forEach(function (b) {
            b.classList.toggle('on', b.getAttribute('data-v') === key);
        });
        return true;
    }

    function setScene(key) { return renderScene(key); }

    function openEntry() {
        if (currentScene === 'with_contract') {
            showToast('含合同流程项走「查看合同」，本演示不实现');
            return false;
        }
        return goTo('02-letter.html?state=' + SCENES[currentScene].state);
    }

    function goTo(url) {
        if (!url) return '';
        if (!isJsdom()) window.location.href = url;
        return url;
    }

    /* ---------- 框外右上导航：可折叠 + localStorage 记忆 ---------- */
    function syncNavToggle(collapsed) {
        var btn = byId('pnToggle');
        if (btn) btn.textContent = collapsed ? '展开' : '收起';
        return collapsed;
    }

    function togglePageNav() {
        var nav = byId('pageNav');
        if (!nav) return false;
        var collapsed = nav.classList.toggle('collapsed');
        try { window.localStorage.setItem('pageNavCollapsed', collapsed ? '1' : '0'); } catch (e) {}
        return syncNavToggle(collapsed);
    }

    function restorePageNav() {
        var nav = byId('pageNav');
        if (!nav) return false;
        var v = null;
        try { v = window.localStorage.getItem('pageNavCollapsed'); } catch (e) {}
        if (v === null) v = '1';
        if (v === '1') nav.classList.add('collapsed');
        else nav.classList.remove('collapsed');
        return syncNavToggle(v === '1');
    }

    /* ---------- 事件绑定 ---------- */
    function bind() {
        var navToggle = byId('pnToggle');
        if (navToggle) navToggle.addEventListener('click', togglePageNav);

        var stateSeg = byId('stateSeg');
        if (stateSeg) stateSeg.addEventListener('click', function (e) {
            var b = e.target.closest ? e.target.closest('button') : null;
            if (b && b.getAttribute('data-v')) setState(b.getAttribute('data-v'));
        });
        var sceneSeg = byId('sceneSeg');
        if (sceneSeg) sceneSeg.addEventListener('click', function (e) {
            var b = e.target.closest ? e.target.closest('button') : null;
            if (b && b.getAttribute('data-v')) setScene(b.getAttribute('data-v'));
        });
        var chk = byId('agreeCheck');
        if (chk) chk.addEventListener('change', function () { toggleAgree(chk.checked); });
        var action = byId('btnAction');
        if (action) action.addEventListener('click', function () {
            if (currentState === 'notice_confirmed') saveLongImage();
            else confirm();
        });
        var saveLink = byId('btnSaveLink');
        if (saveLink) saveLink.addEventListener('click', saveLongImage);
        var entry = byId('letterEntry');
        if (entry) entry.addEventListener('click', openEntry);
        var head = byId('headAct');
        if (head) head.addEventListener('click', function () {
            showToast('含合同流程项走「查看合同」，本演示不实现');
        });
        var assign = byId('btnAssign');
        if (assign) assign.addEventListener('click', function () {
            showToast('指派任务照常可用（本演示不实现任务派发）');
        });
    }

    function init() {
        if (initialized) return true;
        initialized = true;
        pageId = document.body.getAttribute('data-page') || '02';
        restorePageNav();

        if (pageId === '01') {
            renderScene('no_wait');
        } else {
            var q = /[?&]state=([a-z_]+)/.exec(String(window.location.search || ''));
            var initial = (q && STATE_KEYS.indexOf(q[1]) >= 0) ? q[1] : 'notice_wait_confirm';
            var declared = document.body.getAttribute('data-default-state');
            if (declared && STATE_KEYS.indexOf(declared) >= 0 && !q) initial = declared;
            renderState(initial);
        }
        bind();
        return true;
    }

    window.togglePageNav = togglePageNav;
    window.restorePageNav = restorePageNav;
    window.FlowLetterSlim = {
        STATE_KEYS: STATE_KEYS,
        STATE_LABELS: STATE_LABELS,
        SCENES: SCENES,
        getState: function () { return currentState; },
        getScene: function () { return currentScene; },
        getPageId: function () { return pageId; },
        isAgreed: function () { return agreed; },
        getToastLog: function () { return toastLog.slice(); },
        setState: setState,
        setScene: setScene,
        toggleAgree: toggleAgree,
        confirm: confirm,
        saveLongImage: saveLongImage,
        openEntry: openEntry,
        goTo: goTo,
        showToast: showToast,
        init: init
    };

    /* 立即初始化 + DOMContentLoaded 幂等兜底（jsdom 构造后即断言） */
    init();
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
})();
