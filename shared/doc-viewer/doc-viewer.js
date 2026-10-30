/* =============================================================================
 * doc-viewer.js — 查看设计文档浮窗（零依赖·单共享脚本·纯新增）
 * -----------------------------------------------------------------------------
 * 用法：各页面在 </body> 前引入 <script src="<根>/shared/doc-viewer/doc-viewer.js"></script>
 * 范式参考：pm-url2proto「Design Document System」（FAB + 右侧挤压面板 + tab + 复制）
 * 约束：本脚本不改动宿主页面任何既有 HTML/CSS/JS；仅运行时注入 .dv- 前缀样式、
 *       一个 FAB 按钮与一个面板节点；挤压仅面板打开时临时生效，关闭即复原。
 * 数据：window.DOC_DATA / DOC_MATCH_RULES / DOC_PAGE_SECTIONS（由 doc-data.js 提供，
 *       缺失时本脚本按根目录动态加载，再退化为 fetch/XHR）
 * 渲染：marked + mermaid（CDN 动态加载；任一失败则降级为纯文本）
 * ========================================================================== */
(function () {
  "use strict";
  if (window.__DV_LOADED__) return;
  window.__DV_LOADED__ = true;

  /* ------------------------------------------------------------------ 根目录 */
  function ownScriptSrc() {
    if (document.currentScript && document.currentScript.src) return document.currentScript.src;
    var ss = document.getElementsByTagName("script");
    for (var i = ss.length - 1; i >= 0; i--) {
      if (ss[i].src && ss[i].src.indexOf("doc-viewer.js") >= 0) return ss[i].src;
    }
    return "";
  }
  function resolveRoot() {
    var src = ownScriptSrc().split("?")[0].split("#")[0];
    var key = "shared/doc-viewer/doc-viewer.js";
    var idx = src.indexOf(key);
    if (idx >= 0) return src.slice(0, idx);            // 形如 file:///D:/.../LZJBC-XH/
    var u = src.replace(/[^/]*$/, "");                  // 去掉文件名
    if (/doc-viewer\/$/.test(u)) u = u.replace(/doc-viewer\/$/, "").replace(/shared\/$/, "");
    return u;
  }
  var ROOT = resolveRoot();
  var DATA_URL = ROOT + "shared/doc-viewer/doc-data.js";

  /* ------------------------------------------------------------ 当前页面相对路径 */
  function pageRel() {
    var href = decodeURI(location.href).split("?")[0].split("#")[0];
    var r = ROOT.replace(/\/$/, "");
    if (r && href.indexOf(r) === 0) {
      var rel = href.slice(r.length + 1);
      if (rel) return rel;
    }
    return href.split("/").pop() || "";
  }

  /* --------------------------------------------------------------- 样式（.dv-） */
  var CSS = [
    ".dv-fab{position:fixed;right:20px;bottom:24px;z-index:1360;display:flex;align-items:center;gap:8px;",
    "padding:11px 18px;border:none;border-radius:24px;background:#1890FF;color:#fff;font-size:13px;",
    "font-weight:600;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;",
    "cursor:pointer;box-shadow:0 6px 20px rgba(24,144,255,.42);transition:transform .18s,box-shadow .18s,background .18s;line-height:1}",
    ".dv-fab:hover{transform:translateY(-2px);box-shadow:0 10px 26px rgba(24,144,255,.5)}",
    ".dv-fab:active{transform:translateY(0)}",
    ".dv-fab .dv-fab-ico{font-size:15px}",
    ".dv-fab .dv-fab-n{background:rgba(255,255,255,.28);border-radius:10px;padding:1px 7px;font-size:12px}",
    ".dv-panel{position:fixed;top:0;right:0;height:100vh;width:420px;max-width:92vw;z-index:1350;",
    "background:#fff;box-shadow:-8px 0 32px rgba(0,0,0,.16);display:flex;flex-direction:column;",
    "transform:translateX(100%);transition:transform .28s cubic-bezier(.4,0,.2,1);",
    "font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;color:#262626}",
    ".dv-panel.dv-open{transform:translateX(0)}",
    ".dv-head{display:flex;align-items:center;gap:10px;padding:14px 16px 10px;border-bottom:1px solid #eee;flex:0 0 auto}",
    ".dv-head-t{flex:1;min-width:0}",
    ".dv-head-k{font-size:11px;color:#8c8c8c;letter-spacing:.5px}",
    ".dv-head-n{font-size:15px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".dv-btn{border:1px solid #d9d9d9;background:#fff;color:#595959;border-radius:6px;padding:5px 10px;",
    "font-size:12px;cursor:pointer;transition:all .15s;white-space:nowrap;line-height:1.4}",
    ".dv-btn:hover{border-color:#1890FF;color:#1890FF}",
    ".dv-btn.dv-ok{border-color:#52C41A;color:#52C41A}",
    ".dv-close{border:none;background:transparent;font-size:20px;line-height:1;color:#8c8c8c;cursor:pointer;padding:0 4px}",
    ".dv-close:hover{color:#262626}",
    ".dv-tabs{display:flex;gap:2px;padding:0 10px;border-bottom:1px solid #eee;overflow-x:auto;flex:0 0 auto}",
    ".dv-tabs::-webkit-scrollbar{display:none}.dv-tabs{scrollbar-width:none;-ms-overflow-style:none}",
    ".dv-tab{border:none;background:transparent;padding:10px 12px;font-size:12.5px;color:#8c8c8c;cursor:pointer;",
    "white-space:nowrap;border-bottom:2px solid transparent;transition:color .15s;line-height:1.3}",
    ".dv-tab:hover{color:#595959}",
    ".dv-tab.dv-active{color:#1890FF;border-bottom-color:#1890FF;font-weight:600}",
    ".dv-src{padding:7px 16px;font-size:11.5px;color:#8c8c8c;background:#fafafa;border-bottom:1px solid #f0f0f0;",
    "display:flex;gap:8px;align-items:center;flex:0 0 auto}",
    ".dv-src a{color:#1890FF;text-decoration:none}",
    ".dv-src a:hover{text-decoration:underline}",
    ".dv-body{flex:1;overflow-y:auto;padding:16px 20px 40px;scroll-behavior:smooth}",
    ".dv-body::-webkit-scrollbar{display:none}.dv-body{scrollbar-width:none;-ms-overflow-style:none}",
    ".dv-md{font-size:13.5px;line-height:1.72;color:#333;word-wrap:break-word}",
    ".dv-md h2{font-size:16px;font-weight:700;color:#111;margin:22px 0 10px;padding-bottom:6px;border-bottom:1px solid #f0f0f0}",
    ".dv-md h2:first-child{margin-top:0}",
    ".dv-md h3{font-size:14px;font-weight:600;color:#262626;margin:16px 0 8px}",
    ".dv-md h4{font-size:13.5px;font-weight:600;color:#434343;margin:13px 0 6px}",
    ".dv-md p{margin:8px 0}",
    ".dv-md ul,.dv-md ol{margin:8px 0;padding-left:22px}",
    ".dv-md li{margin:4px 0}",
    ".dv-md a{color:#1890FF;text-decoration:none}.dv-md a:hover{text-decoration:underline}",
    ".dv-md code{background:#f5f5f5;border-radius:4px;padding:1px 5px;font-size:12px;",
    "font-family:Consolas,Monaco,'Courier New',monospace;color:#c41d7f}",
    ".dv-md pre{background:#f6f8fa;border:1px solid #eee;border-radius:8px;padding:12px 14px;overflow-x:auto;margin:10px 0}",
    ".dv-md pre code{background:transparent;color:#24292e;padding:0;font-size:12px;line-height:1.6;white-space:pre}",
    ".dv-md pre::-webkit-scrollbar{height:6px}.dv-md pre::-webkit-scrollbar-thumb{background:#d9d9d9;border-radius:3px}",
    ".dv-md blockquote{margin:10px 0;padding:8px 12px;background:#f6faff;border-left:3px solid #91d5ff;color:#434343}",
    ".dv-md blockquote p{margin:4px 0}",
    ".dv-md strong{color:#111}",
    ".dv-md table{border-collapse:collapse;width:100%;margin:10px 0;font-size:12.5px;display:block;overflow-x:auto}",
    ".dv-md table::-webkit-scrollbar{height:6px}.dv-md table::-webkit-scrollbar-thumb{background:#d9d9d9;border-radius:3px}",
    ".dv-md th,.dv-md td{border:1px solid #e8e8e8;padding:7px 10px;text-align:left;vertical-align:top}",
    ".dv-md th{background:#fafafa;font-weight:600;color:#262626;white-space:nowrap}",
    ".dv-md tr:nth-child(even) td{background:#fcfcfc}",
    ".dv-md hr{border:none;border-top:1px solid #eee;margin:16px 0}",
    ".dv-md .mermaid{background:#fff;text-align:center;margin:10px 0;overflow-x:auto}",
    ".dv-plain{white-space:pre-wrap;font-family:Consolas,Monaco,'Courier New',monospace;font-size:12px;color:#434343}",
    ".dv-more{display:block;width:100%;margin:18px 0 4px;padding:10px;border:1px dashed #91d5ff;border-radius:8px;",
    "background:#f6faff;color:#1890FF;font-size:13px;cursor:pointer;transition:all .15s}",
    ".dv-more:hover{background:#e6f4ff;border-style:solid}",
    ".dv-empty{padding:40px 20px;text-align:center;color:#bfbfbf;font-size:13px}",
    ".dv-toast{position:fixed;right:20px;bottom:86px;z-index:1370;background:#52C41A;color:#fff;font-size:12.5px;",
    "padding:8px 14px;border-radius:6px;box-shadow:0 4px 14px rgba(0,0,0,.2);opacity:0;transform:translateY(6px);",
    "transition:opacity .2s,transform .2s;pointer-events:none}",
    ".dv-toast.dv-show{opacity:1;transform:translateY(0)}"
  ].join("");

  function injectCss() {
    if (document.getElementById("dv-style")) return;
    var st = document.createElement("style");
    st.id = "dv-style";
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  /* -------------------------------------------------------------- 文档/规则解析 */
  function matchDocs(rel) {
    var rules = window.DOC_MATCH_RULES || [];
    var base = rel.split("/").pop();
    var i, r;
    for (i = 0; i < rules.length; i++) {          // 1) 精确路径/文件名
      r = rules[i];
      if (typeof r.match === "string" && r.match === rel) return r.docs.slice();
    }
    for (i = 0; i < rules.length; i++) {
      r = rules[i];
      if (typeof r.match === "string" && r.match === base) return r.docs.slice();
    }
    for (i = 0; i < rules.length; i++) {          // 2) 正则/关键字
      r = rules[i];
      if (typeof r.match === "string" && r.match.length > 2 && r.match.charAt(0) === "/") {
        try { if (new RegExp(r.match.replace(/^\//, ""), "i").test(rel)) return r.docs.slice(); } catch (e) {}
      }
    }
    for (i = 0; i < rules.length; i++) {          // 3) 通配
      if (rules[i].match === "*") return rules[i].docs.slice();
    }
    return ["PRD-完整文档"];
  }
  function sectionsFor(rel, docId) {
    var ps = window.DOC_PAGE_SECTIONS || {};
    return (ps[rel] && ps[rel][docId]) ? ps[rel][docId] : null;
  }
  function extractSections(md) {
    var lines = md.split("\n"), secs = [], cur = null;
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      if (/^##\s+\S/.test(ln)) {
        if (cur) secs.push(cur);
        cur = { title: ln.replace(/^##\s+/, "").trim(), body: [] };
      } else if (cur) cur.body.push(ln);
    }
    if (cur) secs.push(cur);
    return secs.map(function (s) { return { title: s.title, body: s.body.join("\n").trim() }; });
  }

  /* ------------------------------------------------------------------ 库动态加载 */
  var libState = { marked: null, mermaid: null };   // null=加载中 false=失败 true=成功
  function loadScript(url, ok, fail) {
    var s = document.createElement("script");
    s.src = url; s.async = true;
    s.onload = function () { ok && ok(); };
    s.onerror = function () { fail && fail(); };
    (document.head || document.documentElement).appendChild(s);
  }
  function loadLibs() {
    if (window.marked) { libState.marked = true; }
    else { loadScript("https://cdn.jsdelivr.net/npm/marked/marked.min.js",
      function () { libState.marked = true; rerender(); },
      function () { libState.marked = false; rerender(); }); }
    if (window.mermaid) { libState.mermaid = true; }
    else { loadScript("https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js",
      function () { libState.mermaid = true; rerender(); },
      function () { libState.mermaid = false; rerender(); }); }
  }

  /* -------------------------------------------------------------------- 剪切板 */
  function copyText(text, btn) {
    function done() {
      if (!btn) return;
      var old = btn.textContent;
      btn.textContent = "已复制"; btn.classList.add("dv-ok");
      setTimeout(function () { btn.textContent = old; btn.classList.remove("dv-ok"); }, 2000);
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { legacy(text, done); });
      } else { legacy(text, done); }
    } catch (e) { legacy(text, done); }
  }
  function legacy(text, done) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta); done();
    } catch (e) {}
  }
  function toast(msg, color) {
    var t = document.getElementById("dv-toast");
    if (!t) { t = document.createElement("div"); t.id = "dv-toast"; t.className = "dv-toast"; document.body.appendChild(t); }
    t.style.background = color || "#52C41A";
    t.textContent = msg; t.classList.add("dv-show");
    clearTimeout(t.__tm); t.__tm = setTimeout(function () { t.classList.remove("dv-show"); }, 2000);
  }

  /* ---------------------------------------------------------------------- 状态 */
  var PANEL_W = Math.min(420, Math.round(window.innerWidth * 0.92));
  var state = { rel: "", docs: [], active: 0, open: false, full: false, origPad: null };

  /* ------------------------------------------------------------------------ 挂载 */
  function buildUi() {
    injectCss();
    var fab = document.createElement("button");
    fab.id = "dv-fab"; fab.className = "dv-fab"; fab.type = "button";
    fab.setAttribute("aria-label", "查看设计文档");
    fab.innerHTML = '<span class="dv-fab-ico">📄</span><span>设计文档</span><span class="dv-fab-n">0</span>';
    fab.addEventListener("click", toggle);
    document.body.appendChild(fab);

    var panel = document.createElement("aside");
    panel.id = "dv-panel"; panel.className = "dv-panel";
    panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "设计文档");
    panel.innerHTML =
      '<div class="dv-head">' +
        '<div class="dv-head-t"><div class="dv-head-k">设计文档</div><div class="dv-head-n" id="dv-title">—</div></div>' +
        '<button class="dv-btn" id="dv-copy" type="button">复制</button>' +
        '<button class="dv-close" id="dv-close" type="button" aria-label="关闭">×</button>' +
      "</div>" +
      '<div class="dv-tabs" id="dv-tabs"></div>' +
      '<div class="dv-src" id="dv-src"></div>' +
      '<div class="dv-body" id="dv-body"></div>';
    document.body.appendChild(panel);

    document.getElementById("dv-close").addEventListener("click", close);
    document.getElementById("dv-copy").addEventListener("click", function () {
      var d = curDoc(); if (!d) return;
      copyText(d.content, this);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" || e.keyCode === 27) { if (state.open) close(); }
    });
    window.addEventListener("resize", function () {
      PANEL_W = Math.min(420, Math.round(window.innerWidth * 0.92));
      if (state.open) squeeze(true);
    });
  }

  function curDoc() { return state.docs[state.active] ? window.DOC_DATA[state.docs[state.active]] : null; }

  function toggle() { state.open ? close() : open(); }
  function open() {
    state.open = true;
    document.getElementById("dv-panel").classList.add("dv-open");
    squeeze(true);
    render();
  }
  function close() {
    state.open = false;
    state.full = false;
    document.getElementById("dv-panel").classList.remove("dv-open");
    squeeze(false);
  }
  function squeeze(on) {
    var b = document.body;
    if (state.origPad === null) state.origPad = b.style.paddingRight || "";
    b.style.transition = "padding-right .28s cubic-bezier(.4,0,.2,1)";
    b.style.paddingRight = on ? PANEL_W + "px" : state.origPad;
  }

  /* ---------------------------------------------------------------------- 渲染 */
  var renderSeq = 0;
  function rerender() { if (state.open) render(); }

  function render() {
    var body = document.getElementById("dv-body");
    var doc = curDoc();
    document.getElementById("dv-title").textContent = doc ? doc.title : "—";
    var nEl = document.querySelector("#dv-fab .dv-fab-n");
    if (nEl) nEl.textContent = state.docs.length;
    if (!doc) { body.innerHTML = '<div class="dv-empty">未找到关联设计文档</div>'; return; }

    // tabs
    var tabs = document.getElementById("dv-tabs");
    tabs.innerHTML = "";
    state.docs.forEach(function (id, i) {
      var d = window.DOC_DATA[id]; if (!d) return;
      var b = document.createElement("button");
      b.className = "dv-tab" + (i === state.active ? " dv-active" : "");
      b.type = "button"; b.textContent = d.title;
      b.addEventListener("click", function () { state.active = i; state.full = false; render(); body.scrollTop = 0; });
      tabs.appendChild(b);
    });

    // 来源行
    var src = document.getElementById("dv-src");
    src.innerHTML = "";
    var a = document.createElement("a");
    a.href = ROOT + doc.file; a.target = "_blank"; a.textContent = doc.file;
    src.appendChild(document.createTextNode("来源："));
    src.appendChild(a);
    if (doc.date) src.appendChild(document.createTextNode(" · " + doc.date));
    src.appendChild(document.createTextNode(" · 本地文件可访问"));

    // 正文
    var md, filtered = false;
    var secs = sectionsFor(state.rel, doc.id);
    if (!state.full && secs && secs.length) {
      filtered = true;
      var all = extractSections(doc.content);
      var map = {}; all.forEach(function (s) { map[s.title] = s; });
      var picked = [];
      secs.forEach(function (t) { if (map[t]) picked.push("## " + t + "\n\n" + map[t].body); });
      md = picked.join("\n\n");
      if (!md) { filtered = false; md = doc.content; }
    } else {
      md = doc.content;
    }

    var seq = ++renderSeq;
    if (libState.marked === true && window.marked && window.marked.parse) {
      body.innerHTML = '<div class="dv-md">' + window.marked.parse(md) + "</div>";
    } else if (libState.marked === false) {
      body.innerHTML = '<div class="dv-md"><pre class="dv-plain"></pre></div>';
      body.querySelector(".dv-plain").textContent = md;
    } else {
      body.innerHTML = '<div class="dv-md"><pre class="dv-plain"></pre></div>';
      body.querySelector(".dv-plain").textContent = md;   // 库未就绪时先纯文本
    }
    postProcess(body, seq);

    if (filtered) {
      var more = document.createElement("button");
      more.className = "dv-more"; more.type = "button";
      more.textContent = "查看全文（共 " + (doc.sections ? doc.sections.length : 0) + " 个章节）";
      more.addEventListener("click", function () { state.full = true; render(); });
      body.appendChild(more);
    }
  }

  function postProcess(body, seq) {
    var md = body.querySelector(".dv-md");
    if (!md) return;
    // 链接重写（相对路径 -> 相对项目根）
    var links = md.querySelectorAll("a[href]");
    for (var i = 0; i < links.length; i++) {
      var h = links[i].getAttribute("href");
      if (!h || /^(https?:|mailto:|#|tel:)/i.test(h)) continue;
      links[i].setAttribute("href", ROOT + h.replace(/^\.?\//, ""));
      links[i].setAttribute("target", "_blank");
    }
    // mermaid
    var blocks = md.querySelectorAll("pre > code.language-mermaid");
    if (!blocks.length) return;
    if (libState.mermaid === true && window.mermaid) {
      try {
        window.mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "loose" });
      } catch (e) {}
      for (var j = 0; j < blocks.length; j++) {
        var pre = blocks[j].parentNode;
        var div = document.createElement("div");
        div.className = "mermaid";
        div.textContent = blocks[j].textContent;
        pre.parentNode.replaceChild(div, pre);
      }
      try {
        var nodes = md.querySelectorAll(".mermaid");
        if (window.mermaid.run) {
          Promise.resolve(window.mermaid.run({ nodes: Array.prototype.slice.call(nodes) })).catch(function () {
            restoreMermaid(md);
          });
        }
      } catch (e) { restoreMermaid(md); }
    } else if (libState.mermaid === false) {
      // 降级：已是 <pre><code> 纯文本，无需处理
    }
  }
  function restoreMermaid(md) {
    var ms = md.querySelectorAll(".mermaid");
    for (var i = 0; i < ms.length; i++) {
      var src = ms[i].textContent;
      var pre = document.createElement("pre");
      var code = document.createElement("code");
      code.textContent = src; pre.appendChild(code);
      ms[i].parentNode.replaceChild(pre, ms[i]);
    }
  }

  /* ------------------------------------------------------------------ 数据启动 */
  function boot() {
    state.rel = pageRel();
    state.docs = matchDocs(state.rel).filter(function (id) { return window.DOC_DATA && window.DOC_DATA[id]; });
    if (!state.docs.length) state.docs = ["PRD-完整文档"].filter(function (id) { return window.DOC_DATA[id]; });
    state.active = 0;
    buildUi();
    var nEl = document.querySelector("#dv-fab .dv-fab-n");
    if (nEl) nEl.textContent = state.docs.length;
    loadLibs();
  }

  function ensureData(then) {
    if (window.DOC_DATA) { then(); return; }
    // 1) 动态 <script>
    var s = document.createElement("script");
    s.src = DATA_URL;
    s.onload = function () { window.DOC_DATA ? then() : fetchData(then); };
    s.onerror = function () { fetchData(then); };
    (document.head || document.documentElement).appendChild(s);
  }
  function fetchData(then) {
    try {
      var x = new XMLHttpRequest();
      x.open("GET", DATA_URL, true);
      x.onload = function () {
        if (x.status === 200 || x.status === 0) {
          try { (new Function(x.responseText))(); } catch (e) {}
        }
        then();
      };
      x.onerror = function () { then(); };
      x.send();
    } catch (e) { then(); }
  }

  function start() { ensureData(boot); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
