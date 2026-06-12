// SKU v3 — products + qty only, no prices
(function(){
"use strict";

// Immediate: ถ้าหน้าสินค้าเปิดอยู่ก่อน refresh → แสดง overlay ทันทีไม่ให้กระพริบ
if(localStorage.getItem("sku_page_active")==="1"){
  var _earlyPage=document.createElement("div");
  _earlyPage.id="sku-page";
  _earlyPage.style.cssText="position:fixed;top:0;right:0;bottom:0;background:#f0f2f7;z-index:999;overflow-y:auto;padding:24px;left:0";
  _earlyPage.innerHTML='<div style="text-align:center;padding:60px;color:#92400e;font-size:14px">\uD83D\uDCE6 \u0e01\u0e33\u0e25\u0e31\u0e07\u0e42\u0e2b\u0e25\u0e14...</div>';
  if(document.body)document.body.appendChild(_earlyPage);
  else document.addEventListener("DOMContentLoaded",function(){document.body.appendChild(_earlyPage);});
}

// CSS: ซ่อนแบนเนอร์ + ปุ่มรหัสสินค้า ผ่าน CSS (ทันที ไม่ flash)
var _skuStyle=document.createElement("style");
_skuStyle.id="sku-css";
_skuStyle.textContent=[
  '[data-hidden="1"]{position:absolute!important;left:-9999px!important;opacity:0!important;height:0!important;overflow:hidden!important}',
  // ซ่อนแบนเนอร์: gradient + border-radius 14px (เฉพาะ banner ไม่โดนปุ่ม)
  'div[style*="linear-gradient"][style*="border-radius: 14px"]{display:none!important}',
  'div[style*="linear-gradient"][style*="border-radius: 16px"]{display:none!important}'
].join("\n");
(document.head||document.documentElement).appendChild(_skuStyle);

// Lightweight rapid hide — ไม่สแกน div ทั้งหมด แค่ mark elements
var _parcelFilterRestored=false;
var _rapidHide=setInterval(function(){
  try{
    // ซ่อนแถบ product codes เท่านั้น (ไม่แตะฟอร์ม)
    var newPC=document.getElementById("_newPC");
    if(newPC){
      var bar=newPC.parentElement;
      if(bar&&!bar.getAttribute("data-sku-hidden")){
        for(var j=0;j<bar.children.length;j++)bar.children[j].style.display="none";
        bar.setAttribute("data-sku-hidden","1");
      }
    }
  }catch(e){}
},100);
setTimeout(function(){clearInterval(_rapidHide);},15000);

function getUrl(){return(typeof SUPABASE_URL!=="undefined"?SUPABASE_URL:null)||localStorage.getItem("sb_url")||"https://crm-themt-api.themtja.workers.dev";}
function getKey(){return(typeof SUPABASE_KEY!=="undefined"?SUPABASE_KEY:null)||localStorage.getItem("sb_key")||"";}
async function api(path,opts){
  var url=getUrl()+"/rest/v1/"+path;
  var h={"apikey":getKey(),"Authorization":"Bearer "+getKey(),"Content-Type":"application/json"};
  if(opts&&opts.method==="PATCH")h["Prefer"]="return=minimal";
  if(opts&&opts.method==="POST")h["Prefer"]="return=representation";
  var o={method:(opts&&opts.method)||"GET",headers:h};
  if(opts&&opts.body)o.body=JSON.stringify(opts.body);
  try{var r=await fetch(url,o);if(!r.ok)return null;var ct=r.headers.get("content-type")||"";return ct.indexOf("json")>=0?await r.json():null;}catch(e){return null;}
}

var DEF=[
  {sku:"KS50-01",name:"KISO 2(50g)",cat:"KISO 50g"},
  {sku:"KS50-02",name:"KISO 1(50g) เซรั่ม1 สบู่1",cat:"KISO 50g"},
  {sku:"KS50-03",name:"KISO 1(50g) เซรั่ม1 เอสเซนส์1 สบู่1",cat:"KISO 50g"},
  {sku:"KS50-04",name:"KISO 5(50g) สบู่1",cat:"KISO 50g"},
  {sku:"KS10-01",name:"KISO 2(10g)",cat:"KISO 10g"},
  {sku:"KS10-02",name:"KISO 3(10g)",cat:"KISO 10g"},
  {sku:"KS10-03",name:"KISO 4(10g)",cat:"KISO 10g"},
  {sku:"KS10-04",name:"KISO 5(10g)",cat:"KISO 10g"},
  {sku:"KS10-05",name:"KISO 6(10g)",cat:"KISO 10g"},
  {sku:"KS10-06",name:"KISO 7(10g)",cat:"KISO 10g"},
  {sku:"KS10S-01",name:"KISO 2(10g) เอสเซนส์1 สบู่1",cat:"KISO 10g เซ็ต"},
  {sku:"KS10S-02",name:"KISO 3(10g) เอสเซนส์1 สบู่1",cat:"KISO 10g เซ็ต"},
  {sku:"KS10S-03",name:"KISO 5(10g) เอสเซนส์1 สบู่1",cat:"KISO 10g เซ็ต"},
  {sku:"RN50-01",name:"RONG 1(50g)",cat:"RONG 50g"},
  {sku:"RN50-02",name:"RONG 2(50g)",cat:"RONG 50g"},
  {sku:"RN50-03",name:"RONG 3(50g)",cat:"RONG 50g"},
  {sku:"RN10-01",name:"RONG 2(10g)",cat:"RONG 10g"},
  {sku:"RN10-02",name:"RONG 3(10g)",cat:"RONG 10g"},
  {sku:"RN10-03",name:"RONG 5(10g)",cat:"RONG 10g"},
  {sku:"RN10-04",name:"RONG 7(10g)",cat:"RONG 10g"},
  {sku:"RN10S-01",name:"RONG 3(10g) เซรั่ม1 สบู่1",cat:"RONG 10g เซ็ต"},
  {sku:"RN10S-02",name:"RONG 5(10g) เซรั่ม1 สบู่1",cat:"RONG 10g เซ็ต"},
  {sku:"PRO-01",name:"โปรลองใช้ 10g x2",cat:"โปรแยก"},
  {sku:"PRO-02",name:"โปรเซ็ตเริ่มต้น",cat:"โปรแยก"}
];

var CAT=[],CMAP={},CART={},FILTER="",SEARCH="";
var _pickerEl=null,_origBtnsDiv=null;

async function loadCat(){
  try{var r=await api("app_settings?key=eq.sku_catalog&select=value");
    if(r&&r.length>0&&r[0].value){CAT=JSON.parse(r[0].value);}else{CAT=DEF.slice();await saveCat();}
  }catch(e){CAT=DEF.slice();}
  rebuildMap();
}
function rebuildMap(){CMAP={};CAT.forEach(function(p){CMAP[p.sku]=p;});}
window.skuReloadCatalog=async function(){try{await loadCat();if(typeof renderPicker==="function")renderPicker();}catch(e){console.error("skuReload:",e)}};
async function saveCat(){
  var v=JSON.stringify(CAT);
  var r=await api("app_settings?key=eq.sku_catalog",{method:"PATCH",body:{value:v,updated_at:new Date().toISOString()}});
  if(r===null)await api("app_settings",{method:"POST",body:{key:"sku_catalog",value:v,updated_at:new Date().toISOString()}});
  rebuildMap();
  var codes=CAT.map(function(p){return p.sku}).join(",");
  var r2=await api("app_settings?key=eq.product_codes",{method:"PATCH",body:{value:codes,updated_at:new Date().toISOString()}});
  if(r2===null)await api("app_settings",{method:"POST",body:{key:"product_codes",value:codes,updated_at:new Date().toISOString()}});
}
function getCats(){
  var c=[];CAT.forEach(function(p){if(c.indexOf(p.cat)<0)c.push(p.cat);});return c;
}

// React helper
function triggerReact(el,val){
  try{var pk=Object.keys(el).find(function(k){return k.startsWith("__reactProps");});
    if(pk&&el[pk]&&el[pk].onChange){el.value=val;el[pk].onChange({target:el,currentTarget:el});return;}
  }catch(e){}
  try{var fk=Object.keys(el).find(function(k){return k.startsWith("__reactFiber")||k.startsWith("__reactInternalInstance");});
    if(fk){var fb=el[fk];while(fb){if(fb.memoizedProps&&fb.memoizedProps.onChange){el.value=val;fb.memoizedProps.onChange({target:el,currentTarget:el});return;}fb=fb.return;}}
  }catch(e){}
  try{var proto=el.tagName==="TEXTAREA"?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
    var setter=Object.getOwnPropertyDescriptor(proto,"value").set;setter.call(el,val);
    el.dispatchEvent(new InputEvent("input",{bubbles:true,data:val,inputType:"insertText"}));
    el.dispatchEvent(new Event("change",{bubbles:true}));
  }catch(e){}
}

// Sync remark + orig buttons
function syncForm(){
  var items=[];
  Object.keys(CART).forEach(function(s){if(CART[s]>0&&CMAP[s])items.push(CMAP[s].name+" x"+CART[s]);});
  var pk=document.getElementById("sku-picker");
  var rf=null;
  document.querySelectorAll("textarea,input[type='text'],input:not([type])").forEach(function(el){
    if(rf)return;if(pk&&pk.contains(el))return;
    var ph=(el.placeholder||"");
    if(ph.indexOf("\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32")>=0&&ph.indexOf("\u0e08\u0e33\u0e19\u0e27\u0e19")>=0)rf=el;
  });
  if(!rf){document.querySelectorAll("label").forEach(function(lb){
    if(rf)return;if((lb.textContent||"").indexOf("\u0e2b\u0e21\u0e32\u0e22\u0e40\u0e2b\u0e15\u0e38")>=0){
      var p=lb.parentElement;if(p){rf=p.querySelector("textarea")||p.querySelector("input");}}
  });}
  if(rf)triggerReact(rf,items.length>0?items.join(", "):"");
  syncOrigBtns();
}
function syncOrigBtns(){
  if(!_origBtnsDiv)return;
  var btns=_origBtnsDiv.querySelectorAll("button");
  var sel=[],need=[];
  btns.forEach(function(b){var bd=b.style.border||"";if(bd.indexOf("2563eb")>=0||bd.indexOf("rgb(37, 99, 235)")>=0)sel.push(b.textContent.trim());});
  Object.keys(CART).forEach(function(s){if(CART[s]>0)need.push(s);});
  btns.forEach(function(b){var s=b.textContent.trim(),isSel=sel.indexOf(s)>=0,isNeed=need.indexOf(s)>=0;
    if(isNeed&&!isSel)b.click();if(!isNeed&&isSel)b.click();});
}

function esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}

// Custom toast (replaces alert)
function toast(msg,type){
  var t=document.createElement("div");
  t.style.cssText="position:fixed;top:24px;left:50%;transform:translateX(-50%) translateY(-10px);z-index:99999;padding:14px 28px;border-radius:14px;font-size:14px;font-family:inherit;font-weight:600;box-shadow:0 12px 32px rgba(0,0,0,.18);opacity:0;transition:opacity .25s,transform .25s;max-width:90vw;display:flex;align-items:center;gap:10px";
  var bg,col,bd,icon;
  if(type==="error"){bg="#fef2f2";col="#dc2626";bd="#fca5a5";icon="\u274C";}
  else if(type==="success"){bg="#f0fdf4";col="#15803d";bd="#86efac";icon="\u2705";}
  else{bg="#fffbeb";col="#92400e";bd="#fbbf24";icon="\uD83D\uDD14";}
  t.style.background=bg;t.style.color=col;t.style.border="1.5px solid "+bd;
  t.innerHTML='<span style="font-size:16px">'+icon+'</span><span>'+esc(msg)+'</span>';
  document.body.appendChild(t);
  requestAnimationFrame(function(){t.style.opacity="1";t.style.transform="translateX(-50%) translateY(0)";});
  setTimeout(function(){t.style.opacity="0";t.style.transform="translateX(-50%) translateY(-10px)";setTimeout(function(){t.remove();},300);},2200);
}
window.skuToast=toast;

// Custom confirm (replaces confirm)
function customConfirm(msg,onYes,opts){
  opts=opts||{};
  var icon=opts.icon||"\uD83D\uDDD1\uFE0F";
  var sub=opts.sub!==undefined?opts.sub:"\u0e25\u0e1a\u0e41\u0e25\u0e49\u0e27\u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e01\u0e39\u0e49\u0e04\u0e37\u0e19\u0e44\u0e14\u0e49";
  var yesText=opts.yes||"\u0e25\u0e1a";
  var yesColor=opts.yesColor||"#ef4444";
  var ov=document.createElement("div");
  ov.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:99999;display:flex;align-items:center;justify-content:center;animation:fadeIn .15s";
  var box=document.createElement("div");
  box.style.cssText="background:#fff;border-radius:16px;padding:24px;max-width:360px;width:90vw;box-shadow:0 20px 60px rgba(0,0,0,.2);text-align:center";
  box.innerHTML='<div style="font-size:32px;margin-bottom:12px">'+icon+'</div>'
    +'<div style="font-size:15px;color:#1e293b;font-weight:600;margin-bottom:6px">'+esc(msg)+'</div>'
    +(sub?'<div style="font-size:12px;color:#94a3b8;margin-bottom:20px">'+esc(sub)+'</div>':'<div style="margin-bottom:20px"></div>')
    +'<div style="display:flex;gap:10px;justify-content:center">'
    +'<button id="sku-cf-no" style="flex:1;padding:10px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">\u0e22\u0e01\u0e40\u0e25\u0e34\u0e01</button>'
    +'<button id="sku-cf-yes" style="flex:1;padding:10px;border-radius:10px;border:none;background:'+yesColor+';color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">'+esc(yesText)+'</button>'
    +'</div>';
  ov.appendChild(box);
  document.body.appendChild(ov);
  ov.onclick=function(e){if(e.target===ov){ov.remove();}};
  document.getElementById("sku-cf-no").onclick=function(){ov.remove();};
  document.getElementById("sku-cf-yes").onclick=function(){ov.remove();onYes();};
}
window.skuConfirm=customConfirm;

// Pretty alert popup (single OK button) — แทน browser alert
function customAlert(msg,opts){
  opts=opts||{};
  var m=String(msg||"");
  // เดาไอคอน/สีจากเนื้อหา
  var icon=opts.icon, color=opts.color;
  if(!icon){
    if(/❌|🚫|ผิดพลาด|ไม่สำเร็จ|ล้มเหลว|ห้าม|ไม่ถูกต้อง|เกิน|ไม่มี|กรุณา|กรอก|ต้อง/.test(m)){icon="\u26A0\uFE0F";color=color||"#dc2626";}
    else if(/✅|สำเร็จ|เสร็จ|บันทึก|แล้ว/.test(m)){icon="\u2705";color=color||"#15803d";}
    else{icon="\uD83D\uDD14";color=color||"#92400e";}
  }
  // เอา emoji นำหน้าออกจากข้อความ (กันซ้ำกับ icon)
  var clean=m.replace(/^[\u2705\u274C\u26A0\uFE0F\uD83D\uDEAB\uD83D\uDD14\s]+/,"");
  var ov=document.createElement("div");
  ov.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:99999;display:flex;align-items:center;justify-content:center;animation:fadeIn .15s";
  var box=document.createElement("div");
  box.style.cssText="background:#fff;border-radius:16px;padding:24px;max-width:380px;width:90vw;box-shadow:0 20px 60px rgba(0,0,0,.2);text-align:center";
  box.innerHTML='<div style="font-size:34px;margin-bottom:12px">'+icon+'</div>'
    +'<div style="font-size:14px;color:#1e293b;font-weight:600;margin-bottom:20px;white-space:pre-line;line-height:1.5">'+esc(clean)+'</div>'
    +'<button id="sku-al-ok" style="width:100%;padding:11px;border-radius:10px;border:none;background:'+color+';color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">\u0e15\u0e01\u0e25\u0e07</button>';
  ov.appendChild(box);
  document.body.appendChild(ov);
  function close(){ov.remove();}
  ov.onclick=function(e){if(e.target===ov)close();};
  document.getElementById("sku-al-ok").onclick=close;
}
window.skuAlert=customAlert;

// Override browser alert → pretty popup
try{
  var _origAlert=window.alert.bind(window);
  window.alert=function(msg){try{customAlert(msg);}catch(e){_origAlert(msg);}};
}catch(e){}


// Render picker
function renderPicker(){
  if(!_pickerEl)return;
  var cats=getCats();
  var filtered=CAT.filter(function(p){
    if(SEARCH){var q=SEARCH.toLowerCase();return p.sku.toLowerCase().indexOf(q)>=0||p.name.toLowerCase().indexOf(q)>=0;}
    if(FILTER===""||FILTER==="ALL")return false;
    if(p.cat!==FILTER)return false;
    return true;
  });
  var totalQty=0;
  Object.keys(CART).forEach(function(s){if(CART[s]>0)totalQty+=CART[s];});

  var h='<div style="margin-bottom:8px"><input id="sku-search" value="'+esc(SEARCH)+'" placeholder="\uD83D\uDD0D \u0e04\u0e49\u0e19\u0e2b\u0e32..." style="width:100%;padding:9px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:13px;font-family:inherit;background:#fff"/></div>';
  h+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">';
  cats.forEach(function(c){var act=FILTER===c;var label=c;
    h+='<button type="button" class="sku-tab" data-cat="'+esc(c)+'" style="padding:5px 12px;border-radius:8px;border:'+(act?'2px solid #d97706':'1.5px solid #e2e8f0')+';background:'+(act?'#fffbeb':'#fff')+';color:'+(act?'#92400e':'#64748b')+';font-size:12px;font-weight:'+(act?'700':'500')+';cursor:pointer;font-family:inherit">'+esc(label)+'</button>';
  });
  h+='</div>';

  if(totalQty>0){
    h+='<div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1.5px solid #fbbf24;border-radius:12px;padding:10px 14px;margin-bottom:10px;display:flex;align-items:center;gap:10px">';
    h+='<span style="font-size:18px">\uD83D\uDED2</span><span style="flex:1;font-size:13px;color:#92400e">';
    var ci=[];Object.keys(CART).forEach(function(s){if(CART[s]>0&&CMAP[s])ci.push('<b>'+esc(CMAP[s].name)+'</b> x'+CART[s]);});
    h+=ci.join(' , ')+'</span>';
    h+='<button type="button" id="sku-clear" style="padding:4px 10px;border-radius:6px;border:1px solid #fca5a5;background:#fef2f2;color:#ef4444;font-size:11px;cursor:pointer;font-family:inherit">\u0e25\u0e49\u0e32\u0e07</button></div>';
  }

  if(filtered.length===0){
    if(FILTER===""&&!SEARCH){
      h+='<div style="text-align:center;padding:24px;color:#94a3b8;font-size:13px">\uD83D\uDC46 \u0e40\u0e25\u0e37\u0e2d\u0e01\u0e2b\u0e21\u0e27\u0e14\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32\u0e14\u0e49\u0e32\u0e19\u0e1a\u0e19</div>';
    }else{
      h+='<div style="text-align:center;padding:20px;color:#94a3b8;font-size:13px">\u0e44\u0e21\u0e48\u0e1e\u0e1a</div>';
    }
  }else{
    var lastCat="";
    filtered.forEach(function(p){
      if(p.cat!==lastCat&&SEARCH){
        h+='<div style="font-size:11px;font-weight:700;color:#92400e;background:#fef3c7;padding:3px 10px;border-radius:5px;margin:8px 0 4px;display:inline-block">'+esc(p.cat)+'</div>';
        lastCat=p.cat;
      }
      var qty=CART[p.sku]||0,sel=qty>0;
      h+='<div class="sku-row" data-sku="'+esc(p.sku)+'" style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:10px;border:'+(sel?'2px solid #2563eb':'1.5px solid #f0f0f0')+';background:'+(sel?'#eff6ff':'#fff')+';margin-bottom:5px;cursor:pointer">';
      h+='<span style="flex:1;font-size:13px;color:#1e293b">'+esc(p.name)+'</span>';
      h+='<span style="display:flex;align-items:center;gap:0;flex-shrink:0">';
      if(qty>0){
        h+='<button type="button" class="sku-qb" data-sku="'+esc(p.sku)+'" data-d="-1" style="width:30px;height:30px;border-radius:8px 0 0 8px;border:1.5px solid #2563eb;background:#eff6ff;color:#2563eb;font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center">&minus;</button>';
        h+='<span style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;background:#2563eb;color:#fff;font-size:14px;font-weight:700;border-top:1.5px solid #2563eb;border-bottom:1.5px solid #2563eb">'+qty+'</span>';
        h+='<button type="button" class="sku-qb" data-sku="'+esc(p.sku)+'" data-d="1" style="width:30px;height:30px;border-radius:0 8px 8px 0;border:1.5px solid #2563eb;background:#eff6ff;color:#2563eb;font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center">+</button>';
      }else{
        h+='<button type="button" class="sku-qb" data-sku="'+esc(p.sku)+'" data-d="1" style="width:30px;height:30px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center">+</button>';
      }
      h+='</span></div>';
    });
  }
  _pickerEl.innerHTML=h;

  var si=_pickerEl.querySelector("#sku-search");
  if(si){if(SEARCH){si.focus();si.setSelectionRange(SEARCH.length,SEARCH.length);}si.oninput=function(){SEARCH=si.value;renderPicker();};}
  _pickerEl.querySelectorAll(".sku-tab").forEach(function(t){t.onclick=function(e){e.preventDefault();FILTER=t.getAttribute("data-cat");renderPicker();};});
  _pickerEl.querySelectorAll(".sku-qb").forEach(function(b){b.onclick=function(e){e.preventDefault();e.stopPropagation();var s=b.getAttribute("data-sku"),d=parseInt(b.getAttribute("data-d"));CART[s]=Math.max(0,(CART[s]||0)+d);if(CART[s]<=0)delete CART[s];renderPicker();syncForm();};});
  _pickerEl.querySelectorAll(".sku-row").forEach(function(r){r.onclick=function(e){if(e.target.closest(".sku-qb"))return;var s=r.getAttribute("data-sku");if(!CART[s])CART[s]=1;else delete CART[s];renderPicker();syncForm();};});
  var cl=_pickerEl.querySelector("#sku-clear");
  if(cl)cl.onclick=function(e){e.preventDefault();CART={};renderPicker();syncForm();};
}

// Inject picker
function injectPicker(){
  try{
    var labels=document.querySelectorAll("label");var tgt=null;
    labels.forEach(function(l){if((l.textContent||"").indexOf("\u0e23\u0e2b\u0e31\u0e2a\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32")>=0)tgt=l;});
    if(!tgt)return false;
    var sec=tgt.parentElement;if(!sec||document.getElementById("sku-picker"))return true;
    var bd=null;for(var i=0;i<sec.children.length;i++){if(sec.children[i].tagName==="DIV"&&sec.children[i].querySelector("button")){bd=sec.children[i];break;}}
    if(!bd)return false;
    bd.setAttribute("data-hidden","1");
    _origBtnsDiv=bd;
    // สร้าง picker นอก React tree — ใส่หลัง section ไม่ใช่ข้างใน
    var pk=document.createElement("div");pk.id="sku-picker";
    pk.style.cssText="margin-top:6px;border:1.5px solid #e2e8f0;border-radius:12px;padding:10px;background:#fafafa;max-height:360px;overflow-y:auto";
    sec.parentElement.insertBefore(pk,sec.nextSibling);
    _pickerEl=pk;
    CART={};SEARCH="";FILTER="";renderPicker();return true;
  }catch(e){return false;}
}

// Product Manager (no price fields)
function openMgr(){
  if(document.getElementById("sku-mgr-ov"))return;
  var ov=document.createElement("div");ov.id="sku-mgr-ov";
  ov.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:10000;display:flex;align-items:center;justify-content:center";
  ov.onclick=function(e){if(e.target===ov)closeMgr();};
  var md=document.createElement("div");
  md.style.cssText="background:#fff;border-radius:16px;width:94vw;max-width:600px;max-height:88vh;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,.2);overflow:hidden";
  var catOpts=getCats().filter(function(c){return c!=="ALL"}).map(function(c){return '<option value="'+esc(c)+'"/>';}).join("");
  md.innerHTML='<div style="padding:14px 18px;background:linear-gradient(135deg,#fffbeb,#fef3c7);border-bottom:1px solid #fde68a;display:flex;align-items:center;gap:10px;flex-shrink:0"><h2 style="flex:1;font-size:16px;font-weight:700;color:#92400e;margin:0">\uD83D\uDCE6 \u0e08\u0e31\u0e14\u0e01\u0e32\u0e23\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32</h2><span style="font-size:13px;color:#78716c">'+CAT.length+' \u0e23\u0e32\u0e22\u0e01\u0e32\u0e23</span><button id="sku-mgr-x" style="width:32px;height:32px;border-radius:50%;border:none;background:#fef3c7;color:#92400e;font-size:16px;cursor:pointer">\u2715</button></div>'
    +'<div id="sku-mgr-body" style="flex:1;overflow-y:auto;padding:14px 18px"></div>'
    +'<div style="padding:10px 18px;border-top:1px solid #f3e8d0;background:#fefce8;display:flex;gap:6px;flex-wrap:wrap;align-items:center;flex-shrink:0">'
    +'<input id="sku-a-sku" placeholder="SKU" style="width:75px;padding:7px 10px;border:1px solid #e5e7eb;border-radius:8px;font-size:12px;font-family:inherit"/>'
    +'<input id="sku-a-name" placeholder="\u0e0a\u0e37\u0e48\u0e2d\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32" style="flex:2;min-width:100px;padding:7px 10px;border:1px solid #e5e7eb;border-radius:8px;font-size:12px;font-family:inherit"/>'
    +'<input id="sku-a-cat" placeholder="\u0e2b\u0e21\u0e27\u0e14" list="sku-dl" style="flex:1;min-width:80px;padding:7px 10px;border:1px solid #e5e7eb;border-radius:8px;font-size:12px;font-family:inherit"/>'
    +'<datalist id="sku-dl">'+catOpts+'</datalist>'
    +'<button id="sku-a-btn" style="background:#d97706;color:#fff;border:none;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">+ \u0e40\u0e1e\u0e34\u0e48\u0e21</button></div>';
  ov.appendChild(md);document.body.appendChild(ov);
  document.getElementById("sku-mgr-x").onclick=closeMgr;
  document.getElementById("sku-a-btn").onclick=function(){
    var sku=document.getElementById("sku-a-sku").value.trim();
    var name=document.getElementById("sku-a-name").value.trim();
    var cat=document.getElementById("sku-a-cat").value.trim()||"\u0e17\u0e31\u0e48\u0e27\u0e44\u0e1b";
    if(!sku||!name){toast("\u0e01\u0e23\u0e2d\u0e01 SKU \u0e41\u0e25\u0e30\u0e0a\u0e37\u0e48\u0e2d","error");return;}
    if(CMAP[sku]){toast("SKU \u0e0b\u0e49\u0e33","error");return;}
    CAT.push({sku:sku,name:name,cat:cat});
    renderMgr();saveCat();
    document.getElementById("sku-a-sku").value="";document.getElementById("sku-a-name").value="";
  };
  renderMgr();
}
function closeMgr(){var o=document.getElementById("sku-mgr-ov");if(o)o.remove();}
function renderMgr(){
  var body=document.getElementById("sku-mgr-body");if(!body)return;
  var cats={};CAT.forEach(function(p,i){if(!cats[p.cat])cats[p.cat]=[];cats[p.cat].push({p:p,i:i});});
  var h='';
  Object.keys(cats).forEach(function(cat){
    h+='<div style="font-size:11px;font-weight:700;color:#92400e;background:#fef3c7;padding:3px 10px;border-radius:5px;margin:10px 0 5px;display:inline-block">'+esc(cat)+' ('+cats[cat].length+')</div>';
    cats[cat].forEach(function(item){var p=item.p,i=item.i;
      h+='<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid #f0f0f0;border-radius:8px;margin-bottom:4px" data-idx="'+i+'">';
      h+='<span style="font-family:monospace;font-size:10px;color:#d97706;background:#fffbeb;padding:2px 7px;border-radius:4px;font-weight:600;min-width:62px;text-align:center">'+esc(p.sku)+'</span>';
      h+='<span style="flex:1;font-size:12px;color:#1e293b">'+esc(p.name)+'</span>';
      h+='<button class="sku-me" data-idx="'+i+'" style="width:26px;height:26px;border-radius:5px;border:1px solid #e5e7eb;background:#fff;cursor:pointer;font-size:12px">\u270F\uFE0F</button>';
      h+='<button class="sku-md" data-idx="'+i+'" style="width:26px;height:26px;border-radius:5px;border:1px solid #e5e7eb;background:#fff;cursor:pointer;font-size:12px">\uD83D\uDDD1\uFE0F</button>';
      h+='</div>';
    });
  });
  if(CAT.length===0)h='<div style="text-align:center;padding:30px;color:#94a3b8">\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e21\u0e35\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32</div>';
  body.innerHTML=h;
  body.querySelectorAll(".sku-md").forEach(function(b){b.onclick=function(){var i=parseInt(b.getAttribute("data-idx"));customConfirm("\u0e25\u0e1a '"+CAT[i].name+"' ?",function(){CAT.splice(i,1);renderMgr();saveCat();})};});
  body.querySelectorAll(".sku-me").forEach(function(b){b.onclick=function(){
    var i=parseInt(b.getAttribute("data-idx")),p=CAT[i],row=b.closest("[data-idx]");if(!row)return;
    row.innerHTML='<input value="'+esc(p.sku)+'" id="se-s-'+i+'" style="width:65px;padding:5px;border:1px solid #e5e7eb;border-radius:5px;font-size:11px;font-family:inherit"/>'
      +'<input value="'+esc(p.name)+'" id="se-n-'+i+'" style="flex:1;padding:5px;border:1px solid #e5e7eb;border-radius:5px;font-size:11px;font-family:inherit"/>'
      +'<input value="'+esc(p.cat)+'" id="se-c-'+i+'" list="sku-dl" style="width:80px;padding:5px;border:1px solid #e5e7eb;border-radius:5px;font-size:11px;font-family:inherit"/>'
      +'<button id="se-ok-'+i+'" style="padding:5px 10px;border:none;border-radius:5px;background:#22c55e;color:#fff;font-size:11px;cursor:pointer;font-weight:600">\u2713</button>'
      +'<button id="se-no-'+i+'" style="padding:5px 10px;border:none;border-radius:5px;background:#e5e7eb;color:#475569;font-size:11px;cursor:pointer">\u2715</button>';
    document.getElementById("se-ok-"+i).onclick=function(){
      var sku=document.getElementById("se-s-"+i).value.trim(),name=document.getElementById("se-n-"+i).value.trim(),cat=document.getElementById("se-c-"+i).value.trim()||"\u0e17\u0e31\u0e48\u0e27\u0e44\u0e1b";
      if(!sku||!name){toast("\u0e01\u0e23\u0e2d\u0e01\u0e43\u0e2b\u0e49\u0e04\u0e23\u0e1a","error");return;}
      for(var j=0;j<CAT.length;j++){if(j!==i&&CAT[j].sku===sku){toast("SKU \u0e0b\u0e49\u0e33","error");return;}}
      CAT[i]={sku:sku,name:name,cat:cat};renderMgr();saveCat();
    };
    document.getElementById("se-no-"+i).onclick=function(){renderMgr();};
  };});
}

// Sidebar menu + full-page product view
var _skuPageActive=false;
function injectSidebar(){
  try{
    // แสดงเมนูสินค้าเฉพาะ admin (หัวหน้า) กับ hr เท่านั้น
    var _user=null;try{_user=JSON.parse(localStorage.getItem("ps_user"));}catch(e){}
    if(!_user||(_user.role!=="admin"&&_user.role!=="hr"))return;
    var nav=document.querySelector("nav");
    if(!nav||nav.querySelector("#sku-nav-btn"))return;
    var refBtn=nav.querySelector("button");
    if(!refBtn)return;
    var btn=document.createElement("button");
    btn.id="sku-nav-btn";
    btn.type="button";
    var cs=window.getComputedStyle(refBtn);
    btn.style.cssText="display:flex;align-items:center;gap:8px;width:100%;padding:"+cs.padding+";border:none;background:none;color:"+cs.color+";font-size:"+cs.fontSize+";font-family:inherit;cursor:pointer;border-radius:8px;text-align:left;font-weight:500";
    btn.innerHTML='<span style="font-size:16px">\uD83D\uDCE6</span> \u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32';
    btn.onclick=function(){showSkuPage();};
    var items=nav.querySelectorAll("button,a");
    if(items.length>2){nav.insertBefore(btn,items[items.length-2]);}
    else{nav.appendChild(btn);}
    // Listen for other nav clicks — save tab + hide SKU page
    nav.addEventListener("click",function(e){
      var t=e.target.closest("button,a");
      if(!t)return;
      if(t!==btn){
        // Save which tab was clicked
        localStorage.setItem("sku_last_tab",t.textContent.trim());
        localStorage.removeItem("sku_page_active");
        if(_skuPageActive)hideSkuPage();
      }
    });
  }catch(e){}
}

function showSkuPage(){
  // ตรวจสิทธิ์: เฉพาะ admin กับ hr
  var _u=null;try{_u=JSON.parse(localStorage.getItem("ps_user"));}catch(e){}
  if(!_u||(_u.role!=="admin"&&_u.role!=="hr")){localStorage.removeItem("sku_page_active");return;}
  _skuPageActive=true;
  localStorage.setItem("sku_page_active","1");
  var btn=document.getElementById("sku-nav-btn");
  if(btn)btn.style.background="rgba(251,191,36,.15)";
  // Detect sidebar width
  var sidebar=document.querySelector("nav");
  var sidebarW=0;
  if(sidebar){var sb=sidebar.closest("div[style]");if(sb)sidebarW=sb.offsetWidth||0;}
  if(sidebarW<100)sidebarW=160;
  var page=document.getElementById("sku-page");
  if(!page){
    page=document.createElement("div");
    page.id="sku-page";
    document.body.appendChild(page);
  }
  page.style.cssText="position:fixed;top:0;left:"+sidebarW+"px;right:0;bottom:0;background:#f0f2f7;z-index:999;overflow-y:auto;padding:24px;animation:fadeIn .2s";
  page.style.display="block";
  renderSkuPage();
}

function hideSkuPage(){
  _skuPageActive=false;
  localStorage.removeItem("sku_page_active");
  var btn=document.getElementById("sku-nav-btn");
  if(btn)btn.style.background="none";
  var page=document.getElementById("sku-page");
  if(page)page.style.display="none";
}

// Restore last tab on page load
function restoreTab(){
  try{
    // If SKU page was active, reopen it
    if(localStorage.getItem("sku_page_active")==="1"){
      showSkuPage();
      return;
    }
    // Otherwise click the last active nav tab
    var lastTab=localStorage.getItem("sku_last_tab");
    if(lastTab){
      var nav=document.querySelector("nav");
      if(!nav)return;
      nav.querySelectorAll("button").forEach(function(b){
        if(b.textContent.trim()===lastTab && b.id!=="sku-nav-btn")b.click();
      });
    }
  }catch(e){}
}

function renderSkuPage(){
  var page=document.getElementById("sku-page");
  if(!page)return;
  var cats={};CAT.forEach(function(p,i){if(!cats[p.cat])cats[p.cat]=[];cats[p.cat].push({p:p,i:i});});
  var h='<div style="max-width:800px;margin:0 auto">';
  h+='<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">';
  h+='<button id="sp-back" type="button" style="padding:8px 14px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:13px;cursor:pointer;font-family:inherit">\u2190 \u0e01\u0e25\u0e31\u0e1a</button>';
  h+='<h1 style="flex:1;font-size:20px;font-weight:800;color:#1e293b;margin:0">\uD83D\uDCE6 \u0e08\u0e31\u0e14\u0e01\u0e32\u0e23\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32</h1>';
  h+='<span style="font-size:14px;color:#78716c">'+CAT.length+' \u0e23\u0e32\u0e22\u0e01\u0e32\u0e23</span></div>';
  // Add form
  h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;padding:14px;background:#fffbeb;border-radius:12px;border:1px solid #fde68a">';
  h+='<input id="sp-sku" placeholder="SKU" style="width:80px;padding:8px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:inherit"/>';
  h+='<input id="sp-name" placeholder="\u0e0a\u0e37\u0e48\u0e2d\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32" style="flex:2;min-width:120px;padding:8px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:inherit"/>';
  h+='<input id="sp-cat" placeholder="\u0e2b\u0e21\u0e27\u0e14" list="sp-dl" style="flex:1;min-width:90px;padding:8px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:inherit"/>';
  h+='<datalist id="sp-dl">'+getCats().filter(function(c){return c!=="ALL"}).map(function(c){return'<option value="'+esc(c)+'"/>'}).join("")+'</datalist>';
  h+='<button id="sp-add" style="background:#d97706;color:#fff;border:none;border-radius:8px;padding:8px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap">+ \u0e40\u0e1e\u0e34\u0e48\u0e21</button></div>';
  // Product list
  Object.keys(cats).forEach(function(cat){
    h+='<div style="margin-bottom:16px">';
    h+='<div style="font-size:13px;font-weight:700;color:#92400e;background:#fef3c7;padding:5px 14px;border-radius:8px;margin-bottom:8px;display:inline-block">'+esc(cat)+' <span style="font-weight:400;color:#b45309">('+cats[cat].length+')</span></div>';
    cats[cat].forEach(function(item){
      var p=item.p,i=item.i;
      h+='<div class="sp-row" data-idx="'+i+'" style="display:flex;align-items:center;gap:10px;padding:10px 14px;border:1.5px solid #f0f0f0;border-radius:10px;margin-bottom:6px;background:#fff;transition:border-color .15s">';
      h+='<span style="font-family:monospace;font-size:11px;color:#d97706;background:#fffbeb;padding:3px 10px;border-radius:5px;font-weight:600;min-width:70px;text-align:center">'+esc(p.sku)+'</span>';
      h+='<span style="flex:1;font-size:14px;color:#1e293b">'+esc(p.name)+'</span>';
      h+='<button class="sp-edit" data-idx="'+i+'" style="padding:6px 12px;border-radius:6px;border:1px solid #e5e7eb;background:#fff;cursor:pointer;font-size:12px">\u270F\uFE0F \u0e41\u0e01\u0e49\u0e44\u0e02</button>';
      h+='<button class="sp-del" data-idx="'+i+'" style="padding:6px 12px;border-radius:6px;border:1px solid #fecaca;background:#fef2f2;color:#ef4444;cursor:pointer;font-size:12px">\u0e25\u0e1a</button>';
      h+='</div>';
    });
    h+='</div>';
  });
  if(CAT.length===0)h+='<div style="text-align:center;padding:40px;color:#94a3b8;font-size:14px">\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e21\u0e35\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32 \u2014 \u0e40\u0e1e\u0e34\u0e48\u0e21\u0e14\u0e49\u0e32\u0e19\u0e1a\u0e19</div>';
  // Missing orders checker section
  h+='<div style="margin-top:30px;padding:16px;background:#fff;border-radius:12px;border:1.5px solid #e2e8f0">';
  h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">';
  h+='<span style="font-size:18px">\uD83D\uDD0D</span>';
  h+='<span style="font-size:15px;font-weight:700;color:#1e293b">\u0e15\u0e23\u0e27\u0e08\u0e2a\u0e2d\u0e1a\u0e2d\u0e2d\u0e40\u0e14\u0e2d\u0e23\u0e4c\u0e02\u0e32\u0e14\u0e2b\u0e32\u0e22</span>';
  h+='<button id="sp-check-missing" style="margin-left:auto;padding:8px 16px;border-radius:8px;border:none;background:#2563eb;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">\u0e40\u0e17\u0e35\u0e22\u0e1a Orders vs Parcels</button>';
  h+='</div>';
  h+='<div style="font-size:12px;color:#94a3b8;margin-bottom:10px">\u0e40\u0e17\u0e35\u0e22\u0e1a\u0e15\u0e32\u0e23\u0e32\u0e07 orders \u0e01\u0e31\u0e1a parcel_checks \u0e2b\u0e32\u0e2d\u0e2d\u0e40\u0e14\u0e2d\u0e23\u0e4c\u0e17\u0e35\u0e48\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e21\u0e35\u0e40\u0e25\u0e02 tracking</div>';
  h+='<div id="sp-missing-result"></div>';
  h+='</div>';

  // Sync from Supabase section (admin only)
  var _user=null;try{_user=JSON.parse(localStorage.getItem("ps_user"));}catch(e){}
  if(_user&&_user.role==="admin"){
    h+='<div style="margin-top:30px;padding:16px;background:#fff;border-radius:12px;border:1.5px solid #e2e8f0">';
    h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">';
    h+='<span style="font-size:18px">\uD83D\uDD04</span>';
    h+='<span style="font-size:15px;font-weight:700;color:#1e293b">\u0e0b\u0e34\u0e07\u0e04\u0e4c\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e08\u0e32\u0e01 Supabase</span>';
    h+='<button id="sp-sync-btn" style="margin-left:auto;padding:8px 16px;border-radius:8px;border:none;background:#8b5cf6;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">\u0e14\u0e36\u0e07\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e08\u0e32\u0e01 Supabase</button>';
    h+='</div>';
    h+='<div style="font-size:12px;color:#94a3b8;margin-bottom:10px">\u0e14\u0e36\u0e07 orders + parcel_checks + accounts \u0e08\u0e32\u0e01 Supabase \u0e40\u0e14\u0e34\u0e21 \u0e21\u0e32\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e43\u0e19 Cloudflare D1</div>';
    h+='<div id="sp-sync-result"></div>';
    h+='</div>';
  }

  h+='</div>'; // close max-width wrapper
  page.innerHTML=h;
  // Bind check missing
  var cmb=document.getElementById("sp-check-missing");
  if(cmb)cmb.onclick=async function(){
    cmb.disabled=true;cmb.textContent="\u0e01\u0e33\u0e25\u0e31\u0e07\u0e15\u0e23\u0e27\u0e08...";
    var res=document.getElementById("sp-missing-result");
    try{
      // Fetch all orders
      var orders=[];var pg=0;
      while(true){
        var from=pg*1000;var to=from+999;
        var r=await api("orders?select=order_id,timestamp,mobile_no,name,sale_price,cod,tracking_no,remark,account_email&order=timestamp.desc",{range:from+"-"+to});
        if(!r||r.length===0)break;orders=orders.concat(r);if(r.length<1000)break;pg++;
      }
      // Fetch all parcels
      var parcels=[];pg=0;
      while(true){
        var from2=pg*1000;var to2=from2+999;
        var r2=await api("parcel_checks?select=tracking_no,customer_name,phone,cod,date&order=created_at.desc",{range:from2+"-"+to2});
        if(!r2||r2.length===0)break;parcels=parcels.concat(r2);if(r2.length<1000)break;pg++;
      }
      // Compare — build set of parcel tracking numbers
      var pSet={};parcels.forEach(function(p){if(p.tracking_no)pSet[p.tracking_no.trim()]=1;});
      var missing=orders.filter(function(o){
        var trk=(o.tracking_no||"").trim();
        return !trk||!pSet[trk];
      });
      // Display
      var rh='<div style="padding:10px;border-radius:8px;background:'+(missing.length>0?'#fef2f2':'#f0fdf4')+';margin-bottom:10px;font-size:13px;font-weight:600;color:'+(missing.length>0?'#dc2626':'#16a34a')+'">';
      rh+=missing.length>0?'\u26A0 \u0e1e\u0e1a '+missing.length+' \u0e2d\u0e2d\u0e40\u0e14\u0e2d\u0e23\u0e4c\u0e17\u0e35\u0e48\u0e44\u0e21\u0e48\u0e21\u0e35\u0e43\u0e19 parcel_checks (orders: '+orders.length+', parcels: '+parcels.length+')':'\u2705 \u0e15\u0e23\u0e07\u0e01\u0e31\u0e19\u0e2b\u0e21\u0e14! (orders: '+orders.length+', parcels: '+parcels.length+')';
      rh+='</div>';
      if(missing.length>0){
        var totalMiss=0;
        rh+='<table style="width:100%;font-size:12px;border-collapse:collapse">';
        rh+='<tr style="background:#fef2f2"><th style="padding:6px;text-align:left">#</th><th style="padding:6px;text-align:left">\u0e27\u0e31\u0e19\u0e17\u0e35\u0e48</th><th style="padding:6px;text-align:left">\u0e25\u0e39\u0e01\u0e04\u0e49\u0e32</th><th style="padding:6px;text-align:left">\u0e40\u0e1a\u0e2d\u0e23\u0e4c</th><th style="padding:6px;text-align:right">\u0e22\u0e2d\u0e14</th><th style="padding:6px;text-align:left">Tracking</th><th style="padding:6px;text-align:left">\u0e2b\u0e21\u0e32\u0e22\u0e40\u0e2b\u0e15\u0e38</th></tr>';
        missing.forEach(function(o,idx){
          var amt=Number(o.sale_price)||Number(o.cod)||0;totalMiss+=amt;
          var ts=(o.timestamp||"").substring(0,10);
          rh+='<tr style="border-bottom:1px solid #f0f0f0"><td style="padding:6px">'+(idx+1)+'</td><td style="padding:6px">'+esc(ts)+'</td><td style="padding:6px">'+esc(o.name||"?")+'</td><td style="padding:6px">'+esc(o.mobile_no||"?")+'</td><td style="padding:6px;text-align:right;font-weight:700;color:#dc2626">\u0e3f'+amt.toLocaleString()+'</td><td style="padding:6px;font-family:monospace;font-size:10px">'+esc(o.tracking_no||"\u0e44\u0e21\u0e48\u0e21\u0e35")+'</td><td style="padding:6px;font-size:11px;color:#64748b">'+esc((o.remark||"").substring(0,30))+'</td></tr>';
        });
        rh+='<tr style="background:#fef2f2;font-weight:700"><td colspan="4" style="padding:8px">\u0e23\u0e27\u0e21\u0e22\u0e2d\u0e14\u0e17\u0e35\u0e48\u0e2b\u0e32\u0e22</td><td style="padding:8px;text-align:right;color:#dc2626">\u0e3f'+totalMiss.toLocaleString()+'</td><td colspan="2"></td></tr>';
        rh+='</table>';
      }
      res.innerHTML=rh;
    }catch(e){
      res.innerHTML='<div style="color:#ef4444">\u0e40\u0e01\u0e34\u0e14\u0e02\u0e49\u0e2d\u0e1c\u0e34\u0e14\u0e1e\u0e25\u0e32\u0e14: '+esc(e.message)+'</div>';
    }
    cmb.disabled=false;cmb.textContent="\u0e40\u0e17\u0e35\u0e22\u0e1a Orders vs Parcels";
  };
  // Bind back button
  var bb=document.getElementById("sp-back");
  if(bb)bb.onclick=function(){
    hideSkuPage();
    // Click last active tab
    var lastTab=localStorage.getItem("sku_last_tab");
    if(lastTab){
      var nav=document.querySelector("nav");
      if(nav)nav.querySelectorAll("button").forEach(function(b){
        if(b.textContent.trim()===lastTab&&b.id!=="sku-nav-btn")b.click();
      });
    }
  };
  // Bind add
  var ab=document.getElementById("sp-add");
  if(ab)ab.onclick=function(){
    var sku=document.getElementById("sp-sku").value.trim();
    var name=document.getElementById("sp-name").value.trim();
    var cat=document.getElementById("sp-cat").value.trim()||"\u0e17\u0e31\u0e48\u0e27\u0e44\u0e1b";
    if(!sku||!name){toast("\u0e01\u0e23\u0e2d\u0e01 SKU \u0e41\u0e25\u0e30\u0e0a\u0e37\u0e48\u0e2d","error");return;}
    if(CMAP[sku]){toast("SKU \u0e0b\u0e49\u0e33","error");return;}
    CAT.push({sku:sku,name:name,cat:cat});
    renderSkuPage();saveCat();
    document.getElementById("sp-sku").value="";document.getElementById("sp-name").value="";
  };
  // Bind delete
  page.querySelectorAll(".sp-del").forEach(function(b){b.onclick=function(){
    var i=parseInt(b.getAttribute("data-idx"));
    customConfirm("\u0e25\u0e1a '"+CAT[i].name+"' ?",function(){CAT.splice(i,1);renderSkuPage();saveCat();})
  };});
  // Bind edit
  page.querySelectorAll(".sp-edit").forEach(function(b){b.onclick=function(){
    var i=parseInt(b.getAttribute("data-idx")),p=CAT[i],row=b.closest(".sp-row");if(!row)return;
    row.innerHTML='<input value="'+esc(p.sku)+'" id="se-s-'+i+'" style="width:70px;padding:6px 10px;border:1.5px solid #fbbf24;border-radius:6px;font-size:12px;font-family:inherit"/>'
      +'<input value="'+esc(p.name)+'" id="se-n-'+i+'" style="flex:1;padding:6px 10px;border:1.5px solid #fbbf24;border-radius:6px;font-size:12px;font-family:inherit"/>'
      +'<input value="'+esc(p.cat)+'" id="se-c-'+i+'" list="sp-dl" style="width:100px;padding:6px 10px;border:1.5px solid #fbbf24;border-radius:6px;font-size:12px;font-family:inherit"/>'
      +'<button id="se-ok-'+i+'" style="padding:6px 14px;border:none;border-radius:6px;background:#22c55e;color:#fff;font-size:12px;cursor:pointer;font-weight:600">\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01</button>'
      +'<button id="se-no-'+i+'" style="padding:6px 14px;border:none;border-radius:6px;background:#e5e7eb;color:#475569;font-size:12px;cursor:pointer">\u0e22\u0e01\u0e40\u0e25\u0e34\u0e01</button>';
    document.getElementById("se-ok-"+i).onclick=function(){
      var sku=document.getElementById("se-s-"+i).value.trim(),name=document.getElementById("se-n-"+i).value.trim(),cat=document.getElementById("se-c-"+i).value.trim()||"\u0e17\u0e31\u0e48\u0e27\u0e44\u0e1b";
      if(!sku||!name){toast("\u0e01\u0e23\u0e2d\u0e01\u0e43\u0e2b\u0e49\u0e04\u0e23\u0e1a","error");return;}
      for(var j=0;j<CAT.length;j++){if(j!==i&&CAT[j].sku===sku){toast("SKU \u0e0b\u0e49\u0e33","error");return;}}
      CAT[i]={sku:sku,name:name,cat:cat};renderSkuPage();saveCat();
    };
    document.getElementById("se-no-"+i).onclick=function(){renderSkuPage();};
  };});
}

// Observer
var _tm=null,_ob=null;
// Hide ugly product codes bar, show clean summary
// Inject "เดือนก่อน" button + customize filter bar
function injectPrevMonthBtn(){
  try{
    var filterBar=null;
    document.querySelectorAll("span,div").forEach(function(el){
      if((el.textContent||"").trim()==="\uD83D\uDCC5 \u0e0a\u0e48\u0e27\u0e07\u0e40\u0e27\u0e25\u0e32:"&&el.parentElement)filterBar=el.parentElement;
    });
    if(!filterBar)return;

    // Save filter on click
    if(!filterBar.getAttribute("data-sku-listen")){
      filterBar.setAttribute("data-sku-listen","1");
      filterBar.addEventListener("click",function(e){
        var btn=e.target.closest("button");
        if(btn)localStorage.setItem("sku_parcel_filter",btn.textContent.trim());
      });
    }

    // Restore last filter OR default to วันนี้
    if(!_parcelFilterRestored){
      _parcelFilterRestored=true;
      var lastFilter=localStorage.getItem("sku_parcel_filter")||"\u0e27\u0e31\u0e19\u0e19\u0e35\u0e49";
      filterBar.querySelectorAll("button").forEach(function(b){
        if(b.textContent.trim()===lastFilter)b.click();
      });
    }

    // Rename "เลือกเดือน" → calendar icon 📅
    filterBar.querySelectorAll("button").forEach(function(b){
      if(b.textContent.trim()==="\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e40\u0e14\u0e37\u0e2d\u0e19"&&!b.getAttribute("data-sku-icon")){
        b.setAttribute("data-sku-icon","1");
        b.textContent="\uD83D\uDCC5";
        b.title="\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e40\u0e14\u0e37\u0e2d\u0e19";
        b.style.fontSize="16px";
        b.style.padding="4px 10px";
      }
    });

    if(filterBar.querySelector("#sku-prev-month"))return;

    // Find "เมื่อวาน" button to insert after it
    var yesterdayBtn=null;
    filterBar.querySelectorAll("button").forEach(function(b){
      if((b.textContent||"").trim()==="\u0e40\u0e21\u0e37\u0e48\u0e2d\u0e27\u0e32\u0e19")yesterdayBtn=b;
    });

    // Create "เดือนก่อน" button
    var btn=document.createElement("button");
    btn.id="sku-prev-month";
    btn.type="button";
    btn.textContent="\u0e40\u0e14\u0e37\u0e2d\u0e19\u0e01\u0e48\u0e2d\u0e19";
    btn.style.cssText="padding:6px 14px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit";
    btn.onclick=function(){
      // Click calendar (📅) button first — find by attribute data-sku-icon
      var calBtn=filterBar.querySelector("[data-sku-icon]");
      if(calBtn)calBtn.click();
      // Set month input to previous month
      setTimeout(function(){
        var now=new Date();
        now.setMonth(now.getMonth()-1);
        var prevYM=now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0");
        var monthInput=document.querySelector("input[type='month']");
        if(monthInput){
          try{
            var pk=Object.keys(monthInput).find(function(k){return k.startsWith("__reactProps");});
            if(pk&&monthInput[pk]&&monthInput[pk].onChange){
              monthInput.value=prevYM;
              monthInput[pk].onChange({target:monthInput});
            }
          }catch(e){}
          var nativeSet=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set;
          nativeSet.call(monthInput,prevYM);
          monthInput.dispatchEvent(new Event("input",{bubbles:true}));
          monthInput.dispatchEvent(new Event("change",{bubbles:true}));
        }
        // Deactivate ALL buttons, activate only this one
        filterBar.querySelectorAll("button").forEach(function(b){
          b.style.border="1px solid #e2e8f0";b.style.background="#fff";b.style.color="#64748b";
        });
        btn.style.border="2px solid #d97706";
        btn.style.background="#fef3c7";
        btn.style.color="#92400e";
      },200);
    };

    // Listen: deactivate "เดือนก่อน" when other filter is clicked
    filterBar.addEventListener("click",function(e){
      var clicked=e.target.closest("button");
      if(clicked&&clicked!==btn){
        btn.style.border="1px solid #e2e8f0";btn.style.background="#fff";btn.style.color="#64748b";
      }
    });

    // Insert after "เมื่อวาน" or "7 วัน"
    var sevenBtn=null;
    filterBar.querySelectorAll("button").forEach(function(b){
      if((b.textContent||"").trim()==="7 \u0e27\u0e31\u0e19")sevenBtn=b;
    });
    var ref=sevenBtn||yesterdayBtn;
    if(ref&&ref.nextSibling){
      ref.parentNode.insertBefore(btn,ref.nextSibling);
    }else{
      filterBar.appendChild(btn);
    }
  }catch(e){}
}

// Enhance parcel stats — replace COD card with orders-based calculation
var _lastParcelMonth="";
var _lastParcelTotal=-1;
var _forceInterval=null;
function enhanceParcelStats(){
  try{
    // Single scan: find codCard + returnCard
    var codCard=null,returnCard=null,codLoss=0;
    var divs=document.querySelectorAll("div");
    for(var i=0;i<divs.length;i++){
      var d=divs[i],t=d.textContent.trim();
      if(t==="\u0e22\u0e2d\u0e14 COD"&&d.parentElement)codCard=d.parentElement;
      else if(t==="\u0e2a\u0e48\u0e07\u0e04\u0e37\u0e19/\u0e15\u0e35\u0e01\u0e25\u0e31\u0e1a"&&d.parentElement)returnCard=d.parentElement;
      var m=(t).match(/COD \u0e2a\u0e39\u0e0d\u0e40\u0e2a\u0e35\u0e22 [\u0e3f]?([\d,]+)/);
      if(m)codLoss=parseInt(m[1].replace(/,/g,""))||0;
    }
    if(!codCard)return;

    // Returned COD badge
    if(returnCard&&!returnCard.querySelector(".sku-return-cod")&&codLoss>0){
      var badge=document.createElement("div");
      badge.className="sku-return-cod";
      badge.style.cssText="font-size:12px;color:#ef4444;font-weight:700;margin-top:4px";
      badge.textContent="\u0e2a\u0e39\u0e0d\u0e40\u0e2a\u0e35\u0e22 \u0e3f"+codLoss.toLocaleString();
      returnCard.appendChild(badge);
    }

    // Detect month from table
    var ym="";
    document.querySelectorAll("td").forEach(function(td){
      if(ym)return;
      var t=(td.textContent||"").trim();
      var dm=t.match(/^(\d{2})\/(\d{2})\/(\d{2,4})$/);
      if(dm){
        var yr=dm[3];
        if(yr.length===2){var n=parseInt(yr);yr=n>40?String(n+1957):("20"+yr);}
        else if(parseInt(yr)>2500){yr=String(parseInt(yr)-543);}
        ym=yr+"-"+dm[2];
      }
    });
    if(!ym){var now=new Date();ym=now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0");}

    // If same month and already have result, just force update card
    if(ym===_lastParcelMonth&&_lastParcelTotal>=0){
      var v=codCard.querySelector("div:nth-child(2)");
      if(v)v.textContent="\u0e3f"+_lastParcelTotal.toLocaleString();
      return;
    }

    // New month detected — fetch fresh data
    _lastParcelMonth=ym;
    var _user=null;
    try{_user=JSON.parse(localStorage.getItem("ps_user"));}catch(e){}
    var isAdmin=_user&&_user.role==="admin";
    var myEmail=(_user&&_user.username)||"";

    var v2=codCard.querySelector("div:nth-child(2)");
    if(v2)v2.textContent="\u0e01\u0e33\u0e25\u0e31\u0e07\u0e42\u0e2b\u0e25\u0e14...";

    (async function(){
      try{
        var all=[];var pg=0;
        var qry="orders?select=sale_price,cod,timestamp&order=timestamp.desc";
        if(!isAdmin&&myEmail)qry+="&account_email=eq."+encodeURIComponent(myEmail);
        while(true){
          var f=pg*1000;var t=f+999;
          var r=await api(qry,{range:f+"-"+t});
          if(!r||r.length===0)break;
          all=all.concat(r);if(r.length<1000)break;pg++;
        }
        var filtered=all.filter(function(o){return(o.timestamp||"").substring(0,7)===ym;});
        var total=filtered.reduce(function(s,o){return s+(Number(o.sale_price)||Number(o.cod)||0);},0);
        _lastParcelTotal=total;

        // Update card once — observer will re-run if React overwrites
        var card=null;
        document.querySelectorAll("div").forEach(function(d){
          if(d.textContent.trim()==="\u0e22\u0e2d\u0e14 COD"&&d.parentElement)card=d.parentElement;
        });
        if(card){
          var v=card.querySelector("div:nth-child(2)");
          if(v){v.textContent="\u0e3f"+total.toLocaleString();v.style.color="#8b5cf6";}
          card.querySelectorAll(".sku-debug").forEach(function(d){d.remove();});
        }
      }catch(e){}
    })();
  }catch(e){}
}

// Fix parcel stats — single DOM scan for all cards
function enhanceReturnRate(){
  try{
    // Single scan: find all stat cards + detect page
    var totalCard=null,confirmedCard=null,pendingCard=null,returnedCard=null,rateCard=null;
    var totalCount=0,confirmedCount=0,returnedCount=0;
    var isParcelPage=false;
    var divs=document.querySelectorAll("div");
    for(var i=0;i<divs.length;i++){
      var d=divs[i],t=d.textContent.trim(),p=d.parentElement;
      if(t==="\u0e40\u0e0a\u0e47\u0e04\u0e1e\u0e31\u0e2a\u0e14\u0e38"&&d.childElementCount<=3)isParcelPage=true;
      if(!p||p.childElementCount>6)continue;
      if(t==="\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14"){totalCard=p;var n=p.querySelector("div:nth-child(2)");if(n)totalCount=parseInt(n.textContent)||0;}
      else if(t==="\u0e40\u0e0b\u0e47\u0e19\u0e23\u0e31\u0e1a\u0e41\u0e25\u0e49\u0e27"){confirmedCard=p;var n=p.querySelector("div:nth-child(2)");if(n)confirmedCount=parseInt(n.textContent)||0;}
      else if(t==="\u0e23\u0e2d\u0e08\u0e31\u0e14\u0e2a\u0e48\u0e07"||t==="\u0e01\u0e33\u0e25\u0e31\u0e07\u0e08\u0e31\u0e14\u0e2a\u0e48\u0e07")pendingCard=p;
      else if(t==="\u0e2a\u0e48\u0e07\u0e04\u0e37\u0e19/\u0e15\u0e35\u0e01\u0e25\u0e31\u0e1a"){returnedCard=p;var n=p.querySelector("div:nth-child(2)");if(n)returnedCount=parseInt(n.textContent)||0;}
      else if(t==="\u0e2d\u0e31\u0e15\u0e23\u0e32\u0e15\u0e35\u0e01\u0e25\u0e31\u0e1a")rateCard=p;
    }
    if(!isParcelPage||!totalCard)return;

    // กำลังจัดส่ง = ทั้งหมด - เซ็นรับ - ตีกลับ
    var inTransit=Math.max(0,totalCount-confirmedCount-returnedCount);
    if(pendingCard){
      var label=pendingCard.querySelector("div:first-child");
      var num=pendingCard.querySelector("div:nth-child(2)");
      if(label&&label.textContent.trim()==="\u0e23\u0e2d\u0e08\u0e31\u0e14\u0e2a\u0e48\u0e07")label.textContent="\u0e01\u0e33\u0e25\u0e31\u0e07\u0e08\u0e31\u0e14\u0e2a\u0e48\u0e07";
      if(num){num.textContent=String(inTransit);num.style.color=inTransit>0?"#3b82f6":"#22c55e";}
      pendingCard.style.borderColor=inTransit>0?"#3b82f6":"#22c55e";
    }
    if(returnedCard){
      returnedCard.style.borderColor=returnedCount===0?"#22c55e":"";
      var rn=returnedCard.querySelector("div:nth-child(2)");if(rn)rn.style.color=returnedCount===0?"#22c55e":"";
      if(returnedCount===0)returnedCard.querySelectorAll(".sku-return-cod").forEach(function(el){el.remove();});
    }
    if(rateCard){
      rateCard.style.borderColor=returnedCount===0?"#22c55e":"";
      var rp=rateCard.querySelector("div:nth-child(2)");if(rp)rp.style.color=returnedCount===0?"#22c55e":"";
    }
  }catch(e){}
}

// HR page — add ประจำ/รายวัน filter + hide non-telesale for HR
var _hrEmpTypes=null;
function enhanceHRPage(){
  try{
    // HR access control — hide non-telesale sections on employee page
    var _user=null;try{_user=JSON.parse(localStorage.getItem("ps_user"));}catch(e){}
    if(_user&&_user.role==="hr"){
      // Quick check: only run on employee page (has "บัญชี X คน" text)
      var pageText=document.body.textContent||"";
      if(pageText.indexOf("\u0e1a\u0e31\u0e0d\u0e0a\u0e35")<0||pageText.indexOf("\u0e04\u0e19")<0){}
      else{
        var hideKeys=["\u0e1c\u0e39\u0e49\u0e14\u0e39\u0e41\u0e25\u0e23\u0e30\u0e1a\u0e1a","\u0e1a\u0e31\u0e0d\u0e0a\u0e35","\u0e08\u0e31\u0e14\u0e2a\u0e48\u0e07","HR"];
        // Only scan divs with limited children (section headers are small)
        document.querySelectorAll("div").forEach(function(d){
          if(d.childElementCount>5)return;
          var txt=(d.textContent||"").trim();
          if(txt.indexOf("\u0e04\u0e19")<0||txt.length>30)return;
          var shouldHide=false;
          for(var i=0;i<hideKeys.length;i++){if(txt.indexOf(hideKeys[i])>=0){shouldHide=true;break;}}
          if(!shouldHide)return;
          // Check bg color (only for matching divs, not all divs)
          var bg=window.getComputedStyle(d).backgroundColor;
          if(bg==="rgba(0, 0, 0, 0)"||bg==="transparent"||bg==="rgb(255, 255, 255)"||bg==="rgb(240, 242, 247)")return;
          var wrapper=d.parentElement;
          if(wrapper)wrapper.style.setProperty("display","none","important");
        });
      }
    }

    // Detect HR performance table
    var table=null;
    document.querySelectorAll("table").forEach(function(t){
      var th=t.querySelector("th,td");
      if(th&&(th.textContent||"").indexOf("\u0e0a\u0e37\u0e48\u0e2d\u0e40\u0e25\u0e48\u0e19")>=0)table=t;
    });
    if(!table)return;
    // Find filter bar
    var filterBar=null;
    document.querySelectorAll("div").forEach(function(d){
      if(d.querySelector("button")&&(d.textContent||"").indexOf("\u0e27\u0e31\u0e19\u0e19\u0e35\u0e49")>=0&&(d.textContent||"").indexOf("7 \u0e27\u0e31\u0e19")>=0&&!d.querySelector("table"))filterBar=d;
    });
    if(!filterBar||filterBar.querySelector("#hr-type-filter"))return;

    // Load emp_type (once)
    if(!_hrEmpTypes){
      _hrEmpTypes={};
      (async function(){
        try{
          var r=await api("accounts?select=nickname,display_name,emp_type");
          if(r)r.forEach(function(a){
            var nick=(typeof extractNickname==="function")?extractNickname(a.display_name,a.nickname):(a.nickname||a.display_name||"");
            if(nick)_hrEmpTypes[nick]=a.emp_type||"";
          });
        }catch(e){}
      })();
    }

    // Insert filter buttons
    var wrap=document.createElement("span");
    wrap.id="hr-type-filter";
    wrap.style.cssText="display:inline-flex;gap:6px;margin-left:16px;border-left:2px solid #e2e8f0;padding-left:16px";
    [{k:"all",l:"\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14",c:"#92400e"},{k:"\u0e1b\u0e23\u0e30\u0e08\u0e33",l:"\u0e1b\u0e23\u0e30\u0e08\u0e33",c:"#15803d"},{k:"\u0e23\u0e32\u0e22\u0e27\u0e31\u0e19",l:"\u0e23\u0e32\u0e22\u0e27\u0e31\u0e19",c:"#0369a1"}].forEach(function(t,idx){
      var b=document.createElement("button");
      b.textContent=t.l;
      var active=idx===0;
      b.style.cssText="padding:6px 14px;border-radius:8px;border:"+(active?"2px solid #d97706":"1px solid #e2e8f0")+";background:"+(active?"#fef3c7":"#fff")+";color:"+(active?t.c:"#64748b")+";font-size:12px;font-weight:600;cursor:pointer;font-family:inherit";
      b.onclick=function(){
        wrap.querySelectorAll("button").forEach(function(bb){bb.style.border="1px solid #e2e8f0";bb.style.background="#fff";bb.style.color="#64748b";});
        b.style.border="2px solid #d97706";b.style.background="#fef3c7";b.style.color=t.c;
        // Filter rows
        table.querySelectorAll("tr").forEach(function(tr,i){
          if(i===0)return;
          if(t.k==="all"){tr.style.display="";return;}
          var nameCell=tr.querySelector("td");
          var name=nameCell?(nameCell.textContent||"").trim():"";
          tr.style.display=(_hrEmpTypes[name]===t.k)?"":"none";
        });
      };
      wrap.appendChild(b);
    });
    filterBar.appendChild(wrap);
  }catch(e){}
}

function tidyCodesBar(){
  try{
    var inp=document.getElementById("_newPC");
    if(!inp)return;
    var bar=inp.parentElement;
    if(!bar)return;
    // Already hidden?
    if(bar.getAttribute("data-sku-hidden"))return;
    bar.setAttribute("data-sku-hidden","1");
    // Hide all children
    for(var i=0;i<bar.children.length;i++)bar.children[i].style.display="none";
    // Insert summary
    var cats={};CAT.forEach(function(p){cats[p.cat]=(cats[p.cat]||0)+1;});
    var sum=document.createElement("div");
    sum.style.cssText="display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:4px 0";
    sum.innerHTML='<span style="font-size:12px;color:#92400e;font-weight:600">\uD83D\uDCE6 '+CAT.length+' \u0e23\u0e32\u0e22\u0e01\u0e32\u0e23</span>';
    Object.keys(cats).forEach(function(c){
      sum.innerHTML+='<span style="font-size:11px;padding:3px 10px;border-radius:6px;background:#fffbeb;border:1px solid #fde68a;color:#92400e">'+esc(c)+' ('+cats[c]+')</span>';
    });
    sum.innerHTML+='<button type="button" onclick="document.getElementById(\'sku-nav-btn\')&&document.getElementById(\'sku-nav-btn\').click()" style="font-size:11px;padding:3px 10px;border-radius:6px;background:#d97706;border:none;color:#fff;cursor:pointer;font-family:inherit">\u2699 \u0e08\u0e31\u0e14\u0e01\u0e32\u0e23</button>';
    bar.appendChild(sum);
  }catch(e){}
}

function startWatch(){
  if(_ob)return;
  // Track if user is typing
  var _typing=false,_typingTimer=null;
  document.addEventListener("focusin",function(e){
    if(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA"){_typing=true;clearTimeout(_typingTimer);}
  });
  document.addEventListener("focusout",function(e){
    if(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA"){
      _typingTimer=setTimeout(function(){_typing=false;},2000);
    }
  });
  // Also suppress when order form is open
  document.addEventListener("keydown",function(){_typing=true;clearTimeout(_typingTimer);_typingTimer=setTimeout(function(){_typing=false;},2000);});

  _ob=new MutationObserver(function(){
    if(_typing)return;
    // ตรวจว่ามีฟอร์มออเดอร์เปิดอยู่ — หยุด observer ทั้งหมด
    var ae=document.activeElement;
    if(ae&&(ae.tagName==="INPUT"||ae.tagName==="TEXTAREA"))return;
    var formOpen=!!document.querySelector("input[placeholder='0xxxxxxxxx']");
    if(formOpen){
      // ฟอร์มเปิดอยู่ — ไม่ทำอะไรเลย ยกเว้น inject picker ครั้งแรก
      if(!document.getElementById("sku-picker"))injectPicker();
      return;
    }
    if(_tm)clearTimeout(_tm);_tm=setTimeout(function(){
    try{if(!document.getElementById("sku-picker")){_pickerEl=null;_origBtnsDiv=null;injectPicker();}
      if(_pickerEl&&!document.body.contains(_pickerEl)){_pickerEl=null;_origBtnsDiv=null;}
      tidyCodesBar();injectSidebar();enhanceParcelStats();injectPrevMonthBtn();enhanceReturnRate();enhanceHRPage();}catch(e){}
  },400);});
  _ob.observe(document.body,{childList:true,subtree:true});
}

async function init(){
  await loadCat();injectSidebar();restoreTab();startWatch();
  setTimeout(function(){try{injectPicker();tidyCodesBar();injectSidebar();if(!_skuPageActive)restoreTab();}catch(e){}},1500);
  setTimeout(function(){try{injectPicker();tidyCodesBar();injectSidebar();}catch(e){}},4000);
  console.log("[SKU] v3 loaded "+CAT.length+" products");
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){setTimeout(init,500);});
else setTimeout(init,500);
})();
