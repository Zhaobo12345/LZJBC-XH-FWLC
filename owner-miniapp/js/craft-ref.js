/**
 * 工艺参考示例 · 业主端只读展示模块
 * 命名空间 window.CraftRef；业主端为查看方（不可配置），仅展示 + 点击放大。
 * 图片示例一排三个（3 列网格），无视频。
 *
 * 页面接线约定：
 *   1) 引入：<script src="js/craft-ref.js"></script>，须在业务脚本之前
 *      （task-detail.js 的 applyTaskContextFromUrl() 在脚本末尾立即执行）。
 *   2) 合同详情页只读弹窗：CraftRef.renderDisplay('detailExecCraftRef', taskItem.dataset.execRefs)
 *   3) 任务详情页：CraftRef.renderDisplay('execCraftRef', refs数组或JSON字符串)
 *   4) DOM 约定：页面提供展示容器（.craft-ref-display）；查看器由模块惰性创建于 .phone-frame 内。
 */
(function (global) {
    'use strict';

    function $(id) { return document.getElementById(id); }

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // 解析工艺参考数据（容错）：支持数组或 JSON 字符串
    function parse(refs) {
        if (!refs) return [];
        var a = refs;
        if (typeof a === 'string') {
            try { a = JSON.parse(a); } catch (e) { return []; }
        }
        if (!Array.isArray(a)) return [];
        return a.filter(function (it) { return it && it.src; })
            .map(function (it) { return { src: it.src, title: it.title || '' }; });
    }

    // 解析只读展示块的宿主：优先 .detail-section（合同详情弹窗行，含标题 label），
    // 其次 .craft-ref（任务详情页卡片，含标题），兜底容器本身
    function resolveDisplayBlock(box) {
        if (box && box.closest) {
            var sec = box.closest('.detail-section');
            if (sec) return sec;
            var cr = box.closest('.craft-ref');
            if (cr) return cr;
        }
        return box;
    }

    // 只读展示：3 列网格；无示例图片时整块不展示（含标题与空态文案），有图才渲染
    // 用事件委托替代内联 onclick 传参，避免标题含引号时的转义问题
    function renderDisplay(containerId, refs) {
        var box = $(containerId);
        if (!box) return;
        // 先恢复宿主块可见性（弹窗复用，防止上一次无图任务的隐藏残留）
        var block = resolveDisplayBlock(box);
        if (block) block.style.display = '';
        box.style.display = '';
        var arr = parse(refs);
        if (!arr.length) {
            box.innerHTML = '';
            if (block) block.style.display = 'none';
            return;
        }
        box.innerHTML = '<div class="craft-ref-list">' + arr.map(function (item, i) {
            return '<div class="craft-ref-config-item" data-cr-idx="' + i + '" style="background-image:url(\'' + esc(item.src) + '\');">' +
                '<div class="craft-ref-item-title">' + esc(item.title || '工艺参考') + '</div></div>';
        }).join('') + '</div>';
        var listBox = box.querySelector('.craft-ref-list');
        if (listBox) {
            listBox.addEventListener('click', function (e) {
                var it = e.target && e.target.closest ? e.target.closest('.craft-ref-config-item') : null;
                if (!it) return;
                var idx = parseInt(it.getAttribute('data-cr-idx'), 10);
                var item = arr[idx];
                if (item) viewImage(item.src, item.title || '工艺参考');
            });
        }
    }

    // 查看器：惰性创建于 .phone-frame 内（position:relative;overflow:hidden，裁切干净）
    function ensureViewer() {
        var v = $('craftRefViewer');
        if (v) return v;
        var frame = document.querySelector('.phone-frame');
        if (!frame) return null;
        v = document.createElement('div');
        v.id = 'craftRefViewer';
        v.className = 'craft-ref-viewer';
        v.innerHTML = '<div class="craft-ref-viewer-img"></div>' +
            '<div class="craft-ref-viewer-title"></div>' +
            '<div class="craft-ref-viewer-close">✕ 关闭</div>';
        v.addEventListener('click', function () { closeViewer(); });
        frame.appendChild(v);
        return v;
    }

    // 点击放大查看工艺参考图
    function viewImage(src, title) {
        var v = ensureViewer();
        if (!v) return;
        var img = v.querySelector('.craft-ref-viewer-img');
        if (img) img.style.backgroundImage = "url('" + src + "')";
        var t = v.querySelector('.craft-ref-viewer-title');
        if (t) t.textContent = title || '';
        v.classList.add('show');
    }

    // 关闭查看器
    function closeViewer() {
        var v = $('craftRefViewer');
        if (v) v.classList.remove('show');
    }

    global.CraftRef = {
        esc: esc,
        parse: parse,
        renderDisplay: renderDisplay,
        viewImage: viewImage,
        closeViewer: closeViewer
    };
})(window);
