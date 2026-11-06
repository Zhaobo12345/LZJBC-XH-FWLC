# -*- coding: utf-8 -*-
import io, re, subprocess, sys

def read(p):
    with io.open(p, "r", encoding="utf-8") as f:
        return f.read()

def inline_script(html):
    out = []
    for m in re.finditer(r"<script>(.*?)</script>", html, re.S):
        out.append(m.group(1))
    return "\n".join(out)

stub = r"""
function FakeEl(){
  this.innerHTML=''; this.textContent=''; this.value=''; this.className='';
  this.style={ setProperty:function(){}, };
  this.offsetLeft=0; this.offsetWidth=50; this.clientWidth=300; this.scrollWidth=600;
  this.scrollTop=0; this.offsetHeight=20; this.scrollHeight=100;
  var self=this;
  this.classList={ _s:{}, add:function(){}, remove:function(){}, toggle:function(){return false;}, contains:function(){return false;} };
  this.setAttribute=function(){}; this.getAttribute=function(){return null;};
  this.addEventListener=function(){}; this.appendChild=function(){};
  this.querySelector=function(){ return new FakeEl(); };
  this.querySelectorAll=function(){ return []; };
  this.getBoundingClientRect=function(){ return {top:0,left:0,right:0,bottom:0,width:300,height:100}; };
  this.scrollTo=function(){};
  this.focus=function(){};
  this.remove=function(){};
}
var __map={};
var document={
  getElementById:function(id){ if(!__map[id]) __map[id]=new FakeEl(); return __map[id]; },
  querySelector:function(){ return new FakeEl(); },
  querySelectorAll:function(){ return []; },
  createElement:function(){ return new FakeEl(); },
  addEventListener:function(){},
  documentElement:new FakeEl()
};
var localStorage={ getItem:function(){return null;}, setItem:function(){}, removeItem:function(){} };
var window={ addEventListener:function(){}, location:{href:''} };
window.FlowCfgStore={ get:function(){ return null; } };
var FlowCfgStore = window.FlowCfgStore;
function getComputedStyle(){ return { marginTop:'0px', marginBottom:'0px', top:'0px' }; }
"""

driver = r"""
;(function(){
  try {
    // exercise core init + drawer paths
    if (typeof flowMount !== 'function') throw new Error('flowMount missing');
    flowMount();
    renderRail(true);
    refreshStats();
    syncFlowCfgEntry();
    openFlowDrawer();
    renderFlowDrawer();
    locateCurrent();
    // data sanity
    var done = ITEMS.filter(function(x){return x.status==='已完成';}).length;
    var sel = fdList().filter(function(x){return x.id===selectedId;})[0];
    console.log('OK flowMode='+FLOW_MODE+' items='+ITEMS.length+' selected='+selectedId+' selStatus='+(sel&&sel.status)+' override='+overrideStatus);
    console.log('contractAction(drawer,sg)='+JSON.stringify(contractAction(sel,'drawer')));
    console.log('contractAction(home,sg)='+JSON.stringify(contractAction(sel,'home')));
  } catch(e) {
    console.log('RUNTIME ERROR: '+e.stack);
    process.exit(2);
  }
})();
"""

for path in ["project-detail-completed-v2.html", "project-detail-initial-v2.html"]:
    html = read(path)
    js = inline_script(html)
    code = stub + "\n" + js + "\n" + driver
    with io.open(".workbuddy/_tmp/_rt.js", "w", encoding="utf-8") as f:
        f.write(code)
    r = subprocess.run(["node", ".workbuddy/_tmp/_rt.js"], capture_output=True, text=True)
    print("==== %s ====" % path)
    print(r.stdout.strip())
    if r.returncode != 0:
        print(r.stderr.strip()[:1500])
    print()
