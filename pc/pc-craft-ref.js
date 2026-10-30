/**
 * 工艺参考示例 · PC 端共享模块
 * 命名空间 window.PCCraftRef；仅支持图片（不支持视频），一排三个、最多 9 张。
 *
 * 能力：
 *   1) 只读展示：PCCraftRef.renderDisplay(containerId, refs)
 *      容器需带 class="pc-craft-block"；refs 为空时整块隐藏（含「工艺参考示例」标题）。
 *   2) 可编辑配置：PCCraftRef.renderConfig(containerId, type, refs) / PCCraftRef.getConfig(type)
 *      type 为 'exec' | 'confirm'，区分执行标准 / 确认标准下的示例集合。
 *   3) 任务列表小图条（只读）：PCCraftRef.stripHTML(refs)（无数据返回空字符串）。
 *   4) 点击任意缩略图（带 data-cr-src 的元素）自动弹层放大查看（懒创建 #pcCraftViewer）。
 *   5) toast：PCCraftRef.setToastHandler(fn)；未注入时优先用 window.showToast，再兜底内置 toast。
 *
 * 页面接线约定：
 *   1) 引入：<script src="pc-craft-ref.js"></script>（放在调用脚本之前）。
 *   2) 弹窗内配置容器：<div class="pc-craft-ref" id="xxx"></div>，调用 renderConfig 渲染。
 *   3) 保存时取回：PCCraftRef.getConfig('exec') / ('confirm')。
 */
(function (global) {
    'use strict';

    var MAX = 9;
    var store = {};          // type -> [{src,title}]
    var toastHandler = null;
    var viewerEl = null;
    var delegatorBound = false;

    function $(id) { return document.getElementById(id); }

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // ---------------- toast ----------------
    function toast(msg) {
        if (typeof toastHandler === 'function') {
            try { toastHandler(msg); return; } catch (e) { /* 落到下级 */ }
        }
        if (typeof global.showToast === 'function') {
            try { global.showToast(msg); return; } catch (e) { /* 落到兜底 */ }
        }
        showFallbackToast(msg);
    }

    function showFallbackToast(msg) {
        var el = $('pcCraftToast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'pcCraftToast';
            el.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);' +
                'background-color:rgba(0,0,0,0.75);color:#fff;padding:10px 20px;border-radius:4px;' +
                'font-size:14px;z-index:10060;';
            document.body.appendChild(el);
        }
        el.textContent = msg;
        el.style.display = 'block';
        if (showFallbackToast._t) clearTimeout(showFallbackToast._t);
        showFallbackToast._t = setTimeout(function () { el.style.display = 'none'; }, 1800);
    }

    // ---------------- 数据 ----------------
    // 解析工艺参考数据（容错）：支持数组或 JSON 字符串
    function parseRefs(arr) {
        if (!arr) return [];
        var a = arr;
        if (typeof a === 'string') {
            try { a = JSON.parse(a); } catch (e) { return []; }
        }
        if (!Array.isArray(a)) return [];
        return a.filter(function (it) { return it && it.src; })
            .map(function (it) { return { src: it.src, title: it.title || '' }; });
    }

    function getConfig(type) {
        if (!store[type]) store[type] = [];
        return store[type];
    }

    function setConfig(type, refs) {
        store[type] = parseRefs(refs);
    }

    function resetConfig() { store = {}; }

    function count(refs) { return parseRefs(refs).length; }

    // ---------------- HTML 片段 ----------------
    // 只读缩略图（可点击放大）
    function thumbHTML(item, i) {
        return '<div class="pc-craft-item" data-cr-idx="' + i + '" ' +
            'data-cr-src="' + esc(item.src) + '" data-cr-title="' + esc(item.title || '') + '" ' +
            'style="background-image:url(\'' + esc(item.src) + '\');" title="' + esc(item.title || '工艺参考') + '">' +
            '<div class="pc-craft-item-title">' + esc(item.title || '工艺参考') + '</div>' +
            '</div>';
    }

    // 配置缩略图（带编辑标题 / 删除）
    function configThumbHTML(type, item, i) {
        return '<div class="pc-craft-item" ' +
            'style="background-image:url(\'' + esc(item.src) + '\');" title="' + esc(item.title || '工艺参考') + '">' +
            '<div class="pc-craft-item-title">' + esc(item.title || '工艺参考') + '</div>' +
            '<div class="pc-craft-ops">' +
            '<span class="pc-craft-op" title="编辑标题" onclick="event.stopPropagation();PCCraftRef.editTitle(\'' + type + '\',' + i + ')">✎</span>' +
            '<span class="pc-craft-op del" title="删除" onclick="event.stopPropagation();PCCraftRef.removeItem(\'' + type + '\',' + i + ')">×</span>' +
            '</div></div>';
    }

    // 只读展示块 HTML（标题 + 网格）
    function displayHTML(refs) {
        var arr = parseRefs(refs);
        if (!arr.length) return '';
        return '<div class="pc-craft-head"><span class="pc-craft-label">工艺参考示例</span></div>' +
            '<div class="pc-craft-grid">' + arr.map(thumbHTML).join('') + '</div>';
    }

    // 任务列表内的小图条（只读、可点击放大）
    // label 为可选前缀标签（如「执行」/「确认」），无数据返回空字符串
    function stripHTML(refs, label) {
        var arr = parseRefs(refs);
        if (!arr.length) return '';
        return '<span class="pc-task-ref-group" title="工艺参考示例（点击可放大）">' +
            (label ? '<span class="pc-task-ref-tag">' + esc(label) + '</span>' : '') +
            arr.map(function (it, i) {
                return '<span class="pc-task-ref-thumb" data-cr-idx="' + i + '" ' +
                    'data-cr-src="' + esc(it.src) + '" data-cr-title="' + esc(it.title || '') + '" ' +
                    'title="' + esc(it.title || '工艺参考') + '" ' +
                    'style="background-image:url(\'' + esc(it.src) + '\');"></span>';
            }).join('') + '</span>';
    }

    // 任务列表整行的图条（执行 + 确认；都没有时返回空字符串）
    function stripRowHTML(execRefs, confirmRefs) {
        var inner = stripHTML(execRefs, '执行') + stripHTML(confirmRefs, '确认');
        return inner ? '<div class="pc-task-ref-strip">' + inner + '</div>' : '';
    }

    // ---------------- 只读展示 ----------------
    // 解析只读展示块的宿主：优先 .pc-craft-block 包装（含标题），兜底容器本身
    function resolveBlock(box) {
        if (box && box.closest) {
            var blk = box.closest('.pc-craft-block');
            if (blk) return blk;
        }
        return box;
    }

    // 无示例图片时整块不展示（含标题），有图才渲染
    function renderDisplay(containerId, refs) {
        var box = $(containerId);
        if (!box) return;
        var block = resolveBlock(box);
        // 先恢复可见性，防止弹窗复用时的隐藏残留
        if (block) block.style.display = '';
        box.style.display = '';
        var arr = parseRefs(refs);
        if (!arr.length) {
            box.innerHTML = '';
            if (block) block.style.display = 'none';
            return;
        }
        box.innerHTML = displayHTML(arr);
        bindClicks(box);
    }

    // ---------------- 可编辑配置 ----------------
    function renderConfig(containerId, type, refs) {
        var box = $(containerId);
        if (!box) return;
        box.classList.add('pc-craft-ref');
        box.dataset.craftType = type;
        if (refs !== undefined) setConfig(type, refs);
        paint(box, type);
        bindClicks(box);
        bindDelegator();
    }

    function paint(box, type) {
        var arr = getConfig(type);
        var gridCls = 'pc-craft-grid' + (arr.length ? '' : ' is-empty');
        var gridInner = arr.length
            ? arr.map(function (it, i) { return configThumbHTML(type, it, i); }).join('')
            : '<div class="pc-craft-empty">暂无工艺参考示例，点击下方按钮添加</div>';
        var addTile = arr.length >= MAX ? '' :
            '<label class="pc-craft-add" for="pcCraftInput_' + type + '">' +
            '<span class="pc-craft-add-icon">＋</span>' +
            '<span class="pc-craft-add-text">添加图片</span></label>';
        box.innerHTML =
            '<div class="pc-craft-head">' +
            '<span class="pc-craft-label">工艺参考示例</span>' +
            '<span class="pc-craft-hint">已选 <b>' + arr.length + '</b> / ' + MAX + ' 张（仅支持图片）</span>' +
            '</div>' +
            '<div class="' + gridCls + '">' + gridInner + addTile + '</div>' +
            '<input type="file" id="pcCraftInput_' + type + '" class="pc-craft-file" accept="image/*" multiple ' +
            'onchange="PCCraftRef.handleUpload(\'' + type + '\', this)">';
    }

    // 按 type 重绘所有同类型配置容器
    function repaint(type) {
        var boxes = document.querySelectorAll('.pc-craft-ref[data-craft-type="' + type + '"]');
        Array.prototype.forEach.call(boxes, function (b) { paint(b, type); });
    }

    // 上传本地图片（支持多选，超出上限自动截断）
    function handleUpload(type, input) {
        if (!input || !input.files || !input.files.length) return;
        var arr = getConfig(type);
        var remaining = MAX - arr.length;
        var files = Array.prototype.slice.call(input.files).slice(0, Math.max(remaining, 0));
        input.value = '';
        if (!files.length) {
            toast('最多添加 ' + MAX + ' 张工艺参考示例');
            return;
        }
        var loaded = 0;
        files.forEach(function (file) {
            var reader = new FileReader();
            reader.onload = function (e) {
                var defaultTitle = String(file.name || '').replace(/\.[^.]+$/, '') || '工艺参考示例';
                arr.push({ src: e.target.result, title: defaultTitle });
                loaded += 1;
                if (loaded === files.length) {
                    repaint(type);
                    toast('已添加工艺参考示例');
                }
            };
            reader.readAsDataURL(file);
        });
    }

    // 编辑某个示例的标题
    function editTitle(type, index) {
        var arr = getConfig(type);
        if (!arr[index]) return;
        var v = global.prompt('请输入工艺参考示例标题：', arr[index].title || '');
        if (v === null) return;
        arr[index].title = String(v).trim() || '工艺参考示例';
        repaint(type);
        toast('标题已更新');
    }

    // 删除某个示例
    function removeItem(type, index) {
        var arr = getConfig(type);
        if (index < 0 || index >= arr.length) return;
        arr.splice(index, 1);
        repaint(type);
        toast('已删除该工艺参考示例');
    }

    // ---------------- 放大查看器 ----------------
    function ensureViewer() {
        if (viewerEl && document.body.contains(viewerEl)) return viewerEl;
        viewerEl = document.createElement('div');
        viewerEl.id = 'pcCraftViewer';
        viewerEl.className = 'pc-craft-viewer';
        viewerEl.innerHTML =
            '<div class="pc-craft-viewer-box">' +
            '<div class="pc-craft-viewer-img"></div>' +
            '<div class="pc-craft-viewer-title"></div>' +
            '</div>' +
            '<div class="pc-craft-viewer-close" title="关闭">×</div>';
        viewerEl.addEventListener('click', function () { closeViewer(); });
        document.body.appendChild(viewerEl);
        return viewerEl;
    }

    function viewImage(src, title) {
        var v = ensureViewer();
        var img = v.querySelector('.pc-craft-viewer-img');
        if (img) img.style.backgroundImage = "url('" + src + "')";
        var t = v.querySelector('.pc-craft-viewer-title');
        if (t) t.textContent = title || '';
        v.classList.add('show');
    }

    function closeViewer() {
        var v = $('pcCraftViewer');
        if (v) v.classList.remove('show');
    }

    // 缩略图点击处理（document 级 / 容器级共用）
    function handleThumbClick(e) {
        var t = e.target;
        var hit = (t && t.closest) ? t.closest('[data-cr-src]') : null;
        if (!hit) return;
        // 阻止继续冒泡：弹窗容器常以「点击空白关闭」监听，避免误关闭
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
        viewImage(hit.getAttribute('data-cr-src'), hit.getAttribute('data-cr-title'));
    }

    // 容器级绑定：弹窗内容常以 event.stopPropagation() 阻断冒泡，
    // 此时 document 级委托收不到事件，必须在容器上直接绑定（幂等）
    function bindClicks(target) {
        var el = (typeof target === 'string') ? $(target) : target;
        if (!el || el.__pcCraftBound) return;
        el.__pcCraftBound = true;
        el.addEventListener('click', handleThumbClick);
    }

    // 全局事件委托：点击任意只读缩略图放大
    function bindDelegator() {
        if (delegatorBound) return;
        delegatorBound = true;
        document.addEventListener('click', handleThumbClick);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindDelegator);
    } else {
        bindDelegator();
    }

    global.PCCraftRef = {
        MAX: MAX,
        esc: esc,
        parse: parseRefs,
        count: count,
        setToastHandler: function (fn) { toastHandler = fn; },
        setConfig: setConfig,
        getConfig: getConfig,
        resetConfig: resetConfig,
        displayHTML: displayHTML,
        stripHTML: stripHTML,
        stripRowHTML: stripRowHTML,
        bindClicks: bindClicks,
        renderDisplay: renderDisplay,
        renderConfig: renderConfig,
        repaint: repaint,
        handleUpload: handleUpload,
        editTitle: editTitle,
        removeItem: removeItem,
        viewImage: viewImage,
        closeViewer: closeViewer
    };
})(window);
