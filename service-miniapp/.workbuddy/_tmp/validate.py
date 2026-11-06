# -*- coding: utf-8 -*-
import io, re, subprocess, sys

def read(p):
    with io.open(p, "r", encoding="utf-8") as f:
        return f.read()

def inline_script(html):
    # grab the content of <script> ... </script> that has no src attribute
    out = []
    for m in re.finditer(r"<script>(.*?)</script>", html, re.S):
        out.append(m.group(1))
    return "\n".join(out)

def css_block(html):
    m = re.search(r"<style>(.*?)</style>", html, re.S)
    return m.group(1) if m else ""

for path in ["project-detail-completed-v2.html", "project-detail-initial-v2.html"]:
    html = read(path)
    js = inline_script(html)
    with io.open(".workbuddy/_tmp/_chk.js", "w", encoding="utf-8") as f:
        f.write(js)
    r = subprocess.run(["node", "--check", ".workbuddy/_tmp/_chk.js"], capture_output=True, text=True)
    print("==== %s ====" % path)
    print("node --check:", "OK" if r.returncode == 0 else "FAIL")
    if r.returncode != 0:
        print(r.stderr[:2000])

    css = css_block(html)
    print("CSS braces: {=%d }=%d  %s" % (css.count("{"), css.count("}"),
          "OK" if css.count("{") == css.count("}") else "MISMATCH"))

    # leftover old identifiers (should be 0)
    for tok in ["flowRenderRail", "flowSelectItem", "flowRenderDetail", "flowRowHtml",
                "flowCountDone", "flowSetDetail", "flowRefreshStats", "flowBaseItems",
                "flowExtraItems", "flowStatusStyle", "flowBadgeText", "flowItemCount",
                "flowSelectedId", "flowDetailOpen", "showToast('查看合同", "contracts:"]:
        n = len(re.findall(re.escape(tok), html))
        if n:
            print("  LEFTOVER %s : %d" % (tok, n))

    # new module presence checks
    for tok in ["flow-config-store.js", "id=\"flowDrawer\"", "id=\"flowTrigger\"",
                "id=\"assignModal\"", "id=\"fdFlowList\"", "id=\"flowSticky\"",
                "function renderFlowDrawer", "function flowMount", "var FLOW_MODE",
                "function contractAction", "function openAssignModal",
                "function applyFlowPreset"]:
        print("  has %s : %s" % (tok, ("YES" if tok in html else "NO")))

    # balance of style/script tags
    print("  <style>=%d </style>=%d  <script>=%d </script>=%d" % (
        html.count("<style>"), html.count("</style>"),
        html.count("<script"), html.count("</script>")))
    print()
