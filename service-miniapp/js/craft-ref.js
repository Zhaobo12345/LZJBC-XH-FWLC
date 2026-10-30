/**
 * 工艺参考示例 · 共享模块（工人合同详情各状态页共用）
 * 命名空间 window.CraftRef；图片示例（本版不支持视频），一排三个、最多 9 张。
 * 能力：配置列表渲染（增 / 删 / 改）、整页编辑器（多选上传）、只读展示、点击放大查看器。
 *
 * 页面接线约定：
 *   1) 引入：<script src="js/craft-ref.js"></script>，须在页面内联脚本之前（推荐放 <head>），
 *      因为各页 renderStages() 等在内联脚本末尾立即执行。
 *   2) toast：CraftRef.setToastHandler(function (msg) { showToast(msg); });（不注入则用模块兜底 toast）
 *   3) 可编辑页：
 *      - 打开弹窗载入既有示例：CraftRef.setRefs('new' | 'edit', 'exec' | 'confirm', task.execRefs);
 *      - 保存时取回：task.execRefs = CraftRef.getRefs('new' | 'edit', 'exec');
 *      - DOM 约定：#craftRefCfg-{mode}-{type} / #craftRefList-{mode}-{type}（配置区）
 *   4) 只读页：CraftRef.renderDisplay('detailExecCraftRef', refs数组或JSON字符串);
 *   5) 共用 DOM（页面提供）：#craftRefEditorPage（编辑整页）、#craftRefViewer（查看器）。
 */
(function (global) {
    'use strict';

    var CRAFT_REF_MAX = 9;
    var store = {};        // 'new:exec' -> [{src,title}]
    var editorCtx = null;  // {mode,type,index}
    var editorBuffer = []; // 工作缓冲
    var toastHandler = null;
    var fallbackTimer = null;

    function $(id) { return document.getElementById(id); }

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function toast(msg) {
        if (toastHandler) {
            try { toastHandler(msg); return; } catch (e) { /* 落到兜底 */ }
        }
        showFallbackToast(msg);
    }

    // 兜底 toast：惰性创建于 .phone-frame 内（各工人页均有唯一 phone-frame）
    function showFallbackToast(msg) {
        var frame = document.querySelector('.phone-frame');
        if (!frame) return;
        var el = $('craftRefToast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'craftRefToast';
            el.style.cssText = 'position:absolute;left:50%;bottom:96px;transform:translateX(-50%);' +
                'background:rgba(0,0,0,0.75);color:#fff;font-size:13px;line-height:1.5;' +
                'padding:8px 14px;border-radius:8px;max-width:80%;text-align:center;' +
                'z-index:1100;opacity:0;transition:opacity .2s;pointer-events:none;white-space:pre-line;';
            frame.appendChild(el);
        }
        el.textContent = msg;
        el.style.opacity = '1';
        if (fallbackTimer) clearTimeout(fallbackTimer);
        fallbackTimer = setTimeout(function () { el.style.opacity = '0'; }, 1800);
    }

    function keyOf(mode, type) { return mode + ':' + type; }

    function getRefs(mode, type) {
        var k = keyOf(mode, type);
        if (!store[k]) store[k] = [];
        return store[k];
    }

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

    // 页面载入任务既有示例 → 写入 store 并刷新配置列表
    function setRefs(mode, type, refs) {
        store[keyOf(mode, type)] = parseRefs(refs);
        renderList(mode, type, false);
    }

    // 渲染配置列表（add / edit 弹窗内）；readonly 时隐藏增删改入口
    function renderList(mode, type, readonly) {
        var list = $('craftRefList-' + mode + '-' + type);
        if (!list) return;
        var cfg = $('craftRefCfg-' + mode + '-' + type);
        if (cfg) cfg.classList.toggle('readonly', !!readonly);
        var arr = getRefs(mode, type);
        if (!arr.length) {
            list.innerHTML = '<div class="craft-ref-list-empty">' +
                (readonly ? '暂无工艺参考示例' : '暂无工艺参考示例，点击下方按钮添加') + '</div>';
            return;
        }
        list.innerHTML = arr.map(function (item, index) {
            var ops = readonly ? '' : (
                '<div class="craft-ref-item-ops">' +
                '<span class="op edit" title="编辑" onclick="CraftRef.openEditor(\'' + mode + '\',\'' + type + '\',' + index + ')">✎</span>' +
                '<span class="op del" title="删除" onclick="CraftRef.deleteRef(\'' + mode + '\',\'' + type + '\',' + index + ')">×</span>' +
                '</div>');
            return '<div class="craft-ref-config-item" style="background-image:url(\'' + esc(item.src) + '\');">' +
                '<div class="craft-ref-item-title">' + esc(item.title || '工艺参考') + '</div>' + ops + '</div>';
        }).join('');
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

    // 渲染只读弹窗内的展示（仅展示，可点击放大）
    // 无示例图片时整块不展示（含「工艺参考示例」标题与空态文案），有图才渲染
    // 用事件委托替代内联 onclick 传参，避免标题含引号时的转义问题
    function renderDisplay(containerId, refs) {
        var box = $(containerId);
        if (!box) return;
        // 先恢复宿主块可见性（弹窗复用，防止上一次无图任务的隐藏残留）
        var block = resolveDisplayBlock(box);
        if (block) block.style.display = '';
        box.style.display = '';
        var arr = parseRefs(refs);
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

    // 打开编辑整页（add：多选上传；edit：替换单张）
    function openEditor(mode, type, index) {
        var arr = getRefs(mode, type);
        var isEdit = (typeof index === 'number' && index >= 0 && index < arr.length);
        if (!isEdit && arr.length >= CRAFT_REF_MAX) {
            toast('最多添加 ' + CRAFT_REF_MAX + ' 张工艺参考示例');
            return;
        }
        editorCtx = { mode: mode, type: type, index: isEdit ? index : -1 };
        editorBuffer = isEdit ? [{ src: arr[index].src || '', title: arr[index].title || '' }] : [];
        var titleEl = $('craftRefEditorTitle');
        if (titleEl) titleEl.textContent = isEdit ? '编辑工艺参考示例' : '添加工艺参考示例';
        var uploadInput = $('craftRefUploadInput');
        if (uploadInput) uploadInput.multiple = !isEdit;
        renderEditor();
        var page = $('craftRefEditorPage');
        if (page) page.classList.add('show');
    }

    // 渲染编辑整页内的图片网格 + 上传占位 + 计数
    function renderEditor() {
        if (!editorCtx) return;
        var grid = $('craftRefEditorGrid');
        if (!grid) return;
        var hint = $('craftRefEditorHint');
        var tile = $('craftRefUploadTile');
        var committed = getRefs(editorCtx.mode, editorCtx.type);
        var baseCount = (editorCtx.index >= 0) ? Math.max(committed.length - 1, 0) : committed.length;
        var total = baseCount + editorBuffer.length;
        if (hint) hint.innerHTML = '已选 <b>' + total + '</b> / ' + CRAFT_REF_MAX + ' 张';
        grid.innerHTML = editorBuffer.map(function (item, i) {
            return '<div class="editor-img-item">' +
                '<div class="editor-img-thumb" style="background-image:url(\'' + esc(item.src) + '\');"></div>' +
                '<div class="editor-img-del" title="删除" onclick="CraftRef.removeBufferItem(' + i + ')">×</div>' +
                '<input class="editor-img-title" type="text" value="' + esc(item.title || '') +
                '" placeholder="如：电工接线作业" oninput="CraftRef.updateTitle(' + i + ', this.value)">' +
                '</div>';
        }).join('');
        if (tile) {
            if (total >= CRAFT_REF_MAX) tile.classList.add('hidden');
            else { tile.classList.remove('hidden'); grid.appendChild(tile); }
        }
    }

    // 同步缓冲项标题（输入即存）
    function updateTitle(i, value) {
        if (!editorBuffer[i]) return;
        editorBuffer[i].title = value;
    }

    // 删除缓冲项
    function removeBufferItem(i) {
        if (i < 0 || i >= editorBuffer.length) return;
        editorBuffer.splice(i, 1);
        renderEditor();
        toast('已移除该图片');
    }

    // 上传本地图片（新增模式一次多选多张；编辑模式替换单张）
    function handleUpload(input) {
        if (!input || !input.files || !input.files.length) return;
        if (!editorCtx) {
            editorCtx = { mode: 'new', type: 'exec', index: -1 };
            editorBuffer = [];
        }
        var committed = getRefs(editorCtx.mode, editorCtx.type);
        var baseCount = (editorCtx.index >= 0) ? Math.max(committed.length - 1, 0) : committed.length;
        var remaining = CRAFT_REF_MAX - baseCount - editorBuffer.length;
        var files = Array.prototype.slice.call(input.files).slice(0, Math.max(remaining, 0));
        if (!files.length) {
            toast('最多添加 ' + CRAFT_REF_MAX + ' 张工艺参考示例');
            input.value = '';
            return;
        }
        var loaded = 0;
        files.forEach(function (file) {
            var reader = new FileReader();
            reader.onload = function (e) {
                var defaultTitle = file.name.replace(/\.[^.]+$/, '');
                if (editorCtx.index >= 0) {
                    editorBuffer[0] = { src: e.target.result, title: defaultTitle };
                } else {
                    editorBuffer.push({ src: e.target.result, title: defaultTitle });
                }
                loaded += 1;
                if (loaded === files.length) renderEditor();
            };
            reader.readAsDataURL(file);
        });
        input.value = '';
    }

    // 保存工艺参考（新增 / 编辑）
    function save() {
        var ctx = editorCtx;
        if (!ctx) return;
        var arr = getRefs(ctx.mode, ctx.type);
        var items = editorBuffer.map(function (it) {
            return { src: it.src, title: (it.title && it.title.trim()) ? it.title.trim() : '工艺参考示例' };
        });
        if (ctx.index >= 0 && ctx.index < arr.length) {
            if (items.length) arr[ctx.index] = items[0];
            else arr.splice(ctx.index, 1);
        } else {
            if (!items.length) { toast('请至少上传一张工艺参考图片'); return; }
            if (arr.length + items.length > CRAFT_REF_MAX) { toast('最多添加 ' + CRAFT_REF_MAX + ' 张工艺参考示例'); return; }
            items.forEach(function (it) { arr.push(it); });
        }
        renderList(ctx.mode, ctx.type, false);
        closeEditor();
        toast(ctx.index >= 0 ? '工艺参考已更新' : '工艺参考已添加');
    }

    // 删除列表内既有项
    function deleteRef(mode, type, index) {
        var arr = getRefs(mode, type);
        if (index < 0 || index >= arr.length) return;
        arr.splice(index, 1);
        renderList(mode, type, false);
        toast('工艺参考已删除');
    }

    // 关闭编辑整页（滑出）
    function closeEditor() {
        var page = $('craftRefEditorPage');
        if (page) page.classList.remove('show');
        editorCtx = null;
        editorBuffer = [];
    }

    // 点击放大查看工艺参考图
    function viewImage(src, title) {
        var v = $('craftRefViewer');
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
        MAX: CRAFT_REF_MAX,
        setToastHandler: function (fn) { toastHandler = fn; },
        esc: esc,
        parse: parseRefs,
        setRefs: setRefs,
        getRefs: getRefs,
        renderList: renderList,
        renderDisplay: renderDisplay,
        openEditor: openEditor,
        renderEditor: renderEditor,
        updateTitle: updateTitle,
        removeBufferItem: removeBufferItem,
        handleUpload: handleUpload,
        save: save,
        deleteRef: deleteRef,
        closeEditor: closeEditor,
        viewImage: viewImage,
        closeViewer: closeViewer
    };
})(window);
