// ═══════════════════════════════════════════════════════════════
// SKU Product System v2 — Full picker replaces product code buttons
// ไม่แก้ app.bundle.js — ทำงานผ่าน DOM overlay + MutationObserver
// ═══════════════════════════════════════════════════════════════
(function(){
"use strict";

// ── API ──
function getUrl(){ return (typeof SUPABASE_URL!=="undefined"?SUPABASE_URL:null)||localStorage.getItem("sb_url")||"https://crm-themt-api.themtja.workers.dev"; }
function getKey(){ return (typeof SUPABASE_KEY!=="undefined"?SUPABASE_KEY:null)||localStorage.getItem("sb_key")||""; }
async function api(path,opts){
  var url=getUrl()+"/rest/v1/"+path;
  var h={"apikey":getKey(),"Authorization":"Bearer "+getKey(),"Content-Type":"application/json"};
  if(opts&&opts.method==="PATCH")h["Prefer"]="return=minimal";
  if(opts&&opts.method==="POST")h["Prefer"]="return=representation";
  var o={method:(opts&&opts.method)||"GET",headers:h};
  if(opts&&opts.body)o.body=JSON.stringify(opts.body);
  try{var r=await fetch(url,o);if(!r.ok)return null;var ct=r.headers.get("content-type")||"";return ct.indexOf("json")>=0?await r.json():null;}catch(e){return null;}
}

// ── Default catalog ──
var DEF=[
  {sku:"KS50-01",name:"KISO 2(50g)",price:439,cat:"KISO 50g เซ็ต"},
  {sku:"KS50-02",name:"KISO 1(50g) เซรั่ม1 สบู่1",price:419,cat:"KISO 50g เซ็ต"},
  {sku:"KS50-03",name:"KISO 1(50g) เซรั่ม1 เอสเซนส์1 สบู่1",price:600,cat:"KISO 50g เซ็ต"},
  {sku:"KS50-04",name:"KISO 5(50g) สบู่1",price:1000,cat:"KISO 50g เซ็ต"},
  {sku:"KS10-01",name:"KISO 2(10g)",price:199,cat:"KISO 10g ครีม"},
  {sku:"KS10-02",name:"KISO 3(10g)",price:289,cat:"KISO 10g ครีม"},
  {sku:"KS10-03",name:"KISO 4(10g)",price:359,cat:"KISO 10g ครีม"},
  {sku:"KS10-04",name:"KISO 5(10g)",price:399,cat:"KISO 10g ครีม"},
  {sku:"KS10-05",name:"KISO 6(10g)",price:449,cat:"KISO 10g ครีม"},
  {sku:"KS10-06",name:"KISO 7(10g)",price:549,cat:"KISO 10g ครีม"},
  {sku:"KS10S-01",name:"KISO 2(10g) เอสเซนส์1 สบู่1",price:399,cat:"KISO 10g เซ็ต"},
  {sku:"KS10S-02",name:"KISO 3(10g) เอสเซนส์1 สบู่1",price:459,cat:"KISO 10g เซ็ต"},
  {sku:"KS10S-03",name:"KISO 5(10g) เอสเซนส์1 สบู่1",price:599,cat:"KISO 10g เซ็ต"},
  {sku:"RN50-01",name:"RONG 1(50g)",price:259,cat:"RONG 50g"},
  {sku:"RN50-02",name:"RONG 2(50g)",price:439,cat:"RONG 50g"},
  {sku:"RN50-03",name:"RONG 3(50g)",price:599,cat:"RONG 50g"},
  {sku:"RN10-01",name:"RONG 2(10g)",price:199,cat:"RONG 10g"},
  {sku:"RN10-02",name:"RONG 3(10g)",price:289,cat:"RONG 10g"},
  {sku:"RN10-03",name:"RONG 5(10g)",price:399,cat:"RONG 10g"},
  {sku:"RN10-04",name:"RONG 7(10g)",price:549,cat:"RONG 10g"},
  {sku:"RN10S-01",name:"RONG 3(10g) เซรั่ม1 สบู่1",price:459,cat:"RONG 10g เซ็ต"},
  {sku:"RN10S-02",name:"RONG 5(10g) เซรั่ม1 สบู่1",price:599,cat:"RONG 10g เซ็ต"},
  {sku:"PRO-01",name:"โปรลองใช้ 10g x2",price:149,cat:"โปรแยก"},
  {sku:"PRO-02",name:"โปรเซ็ตเริ่มต้น",price:299,cat:"โปรแยก"}
];

var CAT=[];        // catalog array
var CMAP={};       // sku -> product map
var CART={};       // sku -> quantity
var FILTER="ทั้งหมด";
var SEARCH="";
var _pickerEl=null; // current picker DOM
var _origBtnsDiv=null; // hidden original buttons container

// ── Load/Save ──
async function loadCat(){
  try{
    var r=await api("app_settings?key=eq.sku_catalog&select=value");
    if(r&&r.length>0&&r[0].value){ CAT=JSON.parse(r[0].value); }
    else{ CAT=DEF.slice(); await saveCat(); }
  }catch(e){ CAT=DEF.slice(); }
  rebuildMap();
}
function rebuildMap(){ CMAP={}; CAT.forEach(function(p){CMAP[p.sku]=p;}); }
async function saveCat(){
  var v=JSON.stringify(CAT);
  var r=await api("app_settings?key=eq.sku_catalog",{method:"PATCH",body:{value:v,updated_at:new Date().toISOString()}});
  if(r===null) await api("app_settings",{method:"POST",body:{key:"sku_catalog",value:v,updated_at:new Date().toISOString()}});
  rebuildMap();
  // Sync product_codes for app.bundle.js compatibility
  var codes=CAT.map(function(p){return p.sku}).join(",");
  var r2=await api("app_settings?key=eq.product_codes",{method:"PATCH",body:{value:codes,updated_at:new Date().toISOString()}});
  if(r2===null) await api("app_settings",{method:"POST",body:{key:"product_codes",value:codes,updated_at:new Date().toISOString()}});
}
function getCats(){ var c=["ทั้งหมด"]; CAT.forEach(function(p){if(c.indexOf(p.cat)<0)c.push(p.cat);}); return c; }

// ── React field helpers ──
function setReactInput(input,val){
  try{
    var s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"value").set;
    s.call(input,val);
    input.dispatchEvent(new Event("input",{bubbles:true}));
    input.dispatchEvent(new Event("change",{bubbles:true}));
  }catch(e){}
}
function setReactTextarea(ta,val){
  try{
    var s=Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,"value").set;
    s.call(ta,val);
    ta.dispatchEvent(new Event("input",{bubbles:true}));
    ta.dispatchEvent(new Event("change",{bubbles:true}));
  }catch(e){}
}

// Click an original product code button to toggle React state
function clickOrigBtn(sku){
  if(!_origBtnsDiv) return;
  var btns=_origBtnsDiv.querySelectorAll("button");
  btns.forEach(function(b){
    if(b.textContent.trim()===sku) b.click();
  });
}

// ── Update form fields from CART ──
function syncFormFromCart(){
  // Build selected items list
  var items=[];
  var total=0;
  Object.keys(CART).forEach(function(sku){
    var qty=CART[sku];
    if(qty>0 && CMAP[sku]){
      items.push(CMAP[sku].name+" x"+qty);
      total+=CMAP[sku].price*qty;
    }
  });

  // Find SalePrice/COD input
  var allInputs=document.querySelectorAll("input");
  allInputs.forEach(function(inp){
    // The price input is the one with fontWeight 700, fontSize 16, textAlign center
    var st=inp.style;
    if(st.fontWeight==="700" && st.textAlign==="center" && (st.fontSize==="16px"||st.fontSize==="16")){
      if(total>0) setReactInput(inp,String(total));
    }
  });

  // Find Remark textarea — ใช้เป็นช่องแจ้งสินค้า (auto-fill เสมอ)
  var allTA=document.querySelectorAll("textarea");
  allTA.forEach(function(ta){
    if((ta.placeholder||"").indexOf("สินค้า")>=0 || (ta.placeholder||"").indexOf("จำนวน")>=0){
      var txt=items.length>0 ? items.join(", ") : "";
      setReactTextarea(ta,txt);
    }
  });

  // Make sure at least one original button is selected for validation
  syncOrigButtons();
}

function syncOrigButtons(){
  if(!_origBtnsDiv) return;
  var btns=_origBtnsDiv.querySelectorAll("button");
  var selected=[];
  var needed=[];

  // Check which are currently selected (blue border)
  btns.forEach(function(b){
    var bd=b.style.border||"";
    var isSel=bd.indexOf("2563eb")>=0||bd.indexOf("rgb(37, 99, 235)")>=0;
    if(isSel) selected.push(b.textContent.trim());
  });

  // Which should be selected (anything in CART with qty>0)
  Object.keys(CART).forEach(function(sku){
    if(CART[sku]>0) needed.push(sku);
  });

  // Click buttons to toggle — select needed ones, deselect unneeded
  btns.forEach(function(b){
    var sku=b.textContent.trim();
    var isSel=selected.indexOf(sku)>=0;
    var isNeeded=needed.indexOf(sku)>=0;
    if(isNeeded && !isSel) b.click(); // select
    if(!isNeeded && isSel) b.click(); // deselect
  });
}

// ── Render SKU Picker ──
function renderPicker(){
  if(!_pickerEl) return;
  var cats=getCats();
  var filtered=CAT.filter(function(p){
    if(FILTER!=="ทั้งหมด" && p.cat!==FILTER) return false;
    if(SEARCH){
      var q=SEARCH.toLowerCase();
      return p.sku.toLowerCase().indexOf(q)>=0 || p.name.toLowerCase().indexOf(q)>=0;
    }
    return true;
  });

  // Count selected
  var totalQty=0,totalPrice=0;
  Object.keys(CART).forEach(function(s){if(CART[s]>0&&CMAP[s]){totalQty+=CART[s];totalPrice+=CART[s]*CMAP[s].price;}});

  var h='';

  // Search bar
  h+='<div style="margin-bottom:8px"><input id="sku-search" value="'+esc(SEARCH)+'" placeholder="🔍 ค้นหา SKU / ชื่อสินค้า..." style="width:100%;padding:9px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:13px;font-family:inherit;background:#fff" /></div>';

  // Category tabs
  h+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">';
  cats.forEach(function(c){
    var act=FILTER===c;
    h+='<button type="button" class="sku-tab" data-cat="'+esc(c)+'" style="padding:5px 12px;border-radius:8px;border:'+(act?'2px solid #d97706':'1.5px solid #e2e8f0')+';background:'+(act?'#fffbeb':'#fff')+';color:'+(act?'#92400e':'#64748b')+';font-size:12px;font-weight:'+(act?'700':'500')+';cursor:pointer;font-family:inherit">'+esc(c)+'</button>';
  });
  h+='</div>';

  // Selected summary (if any)
  if(totalQty>0){
    h+='<div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1.5px solid #fbbf24;border-radius:12px;padding:10px 14px;margin-bottom:10px;display:flex;align-items:center;gap:10px">';
    h+='<span style="font-size:20px">🛒</span>';
    h+='<span style="flex:1;font-size:13px;color:#92400e">';
    var cartItems=[];
    Object.keys(CART).forEach(function(s){if(CART[s]>0&&CMAP[s])cartItems.push('<b>'+esc(CMAP[s].name)+'</b> x'+CART[s]);});
    h+=cartItems.join(' , ');
    h+='</span>';
    h+='<span style="font-size:16px;font-weight:800;color:#d97706">฿'+totalPrice.toLocaleString()+'</span>';
    h+='<button type="button" id="sku-clear-cart" style="padding:4px 10px;border-radius:6px;border:1px solid #fca5a5;background:#fef2f2;color:#ef4444;font-size:11px;cursor:pointer;font-family:inherit">ล้าง</button>';
    h+='</div>';
  }

  // Product grid
  if(filtered.length===0){
    h+='<div style="text-align:center;padding:20px;color:#94a3b8;font-size:13px">ไม่พบสินค้า</div>';
  }else{
    var lastCat="";
    filtered.forEach(function(p){
      if(p.cat!==lastCat && FILTER==="ทั้งหมด"){
        h+='<div style="font-size:11px;font-weight:700;color:#92400e;background:#fef3c7;padding:3px 10px;border-radius:5px;margin:8px 0 4px;display:inline-block">'+esc(p.cat)+'</div>';
        lastCat=p.cat;
      }
      var qty=CART[p.sku]||0;
      var sel=qty>0;
      h+='<div class="sku-row" data-sku="'+esc(p.sku)+'" style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:10px;border:'+(sel?'2px solid #2563eb':'1.5px solid #f0f0f0')+';background:'+(sel?'#eff6ff':'#fff')+';margin-bottom:5px;transition:all .15s;cursor:pointer">';
      // SKU badge
      h+='<span style="font-family:\'JetBrains Mono\',monospace;font-size:10px;color:#d97706;background:#fffbeb;padding:2px 7px;border-radius:4px;font-weight:600;min-width:62px;text-align:center;flex-shrink:0">'+esc(p.sku)+'</span>';
      // Name
      h+='<span style="flex:1;font-size:13px;color:#1e293b;line-height:1.3">'+esc(p.name)+'</span>';
      // Price
      h+='<span style="font-size:13px;font-weight:700;color:#92400e;min-width:55px;text-align:right">฿'+p.price.toLocaleString()+'</span>';
      // Qty controls
      h+='<span style="display:flex;align-items:center;gap:0;flex-shrink:0">';
      if(qty>0){
        h+='<button type="button" class="sku-qty-btn" data-sku="'+esc(p.sku)+'" data-d="-1" style="width:28px;height:28px;border-radius:6px 0 0 6px;border:1.5px solid #2563eb;background:#eff6ff;color:#2563eb;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center">−</button>';
        h+='<span style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:#2563eb;color:#fff;font-size:13px;font-weight:700;border-top:1.5px solid #2563eb;border-bottom:1.5px solid #2563eb">'+qty+'</span>';
        h+='<button type="button" class="sku-qty-btn" data-sku="'+esc(p.sku)+'" data-d="1" style="width:28px;height:28px;border-radius:0 6px 6px 0;border:1.5px solid #2563eb;background:#eff6ff;color:#2563eb;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center">+</button>';
      }else{
        h+='<button type="button" class="sku-qty-btn" data-sku="'+esc(p.sku)+'" data-d="1" style="width:28px;height:28px;border-radius:6px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center">+</button>';
      }
      h+='</span>';
      h+='</div>';
    });
  }

  _pickerEl.innerHTML=h;

  // ── Bind events ──
  // Search
  var si=_pickerEl.querySelector("#sku-search");
  if(si){
    si.focus(); // maintain focus
    si.setSelectionRange(SEARCH.length,SEARCH.length);
    si.oninput=function(){ SEARCH=si.value; renderPicker(); };
  }
  // Cat tabs
  _pickerEl.querySelectorAll(".sku-tab").forEach(function(t){
    t.onclick=function(e){e.preventDefault();FILTER=t.getAttribute("data-cat");renderPicker();};
  });
  // Qty buttons
  _pickerEl.querySelectorAll(".sku-qty-btn").forEach(function(b){
    b.onclick=function(e){
      e.preventDefault(); e.stopPropagation();
      var sku=b.getAttribute("data-sku");
      var d=parseInt(b.getAttribute("data-d"));
      CART[sku]=Math.max(0,(CART[sku]||0)+d);
      if(CART[sku]<=0) delete CART[sku];
      renderPicker();
      syncFormFromCart();
    };
  });
  // Row click = add 1
  _pickerEl.querySelectorAll(".sku-row").forEach(function(row){
    row.onclick=function(e){
      if(e.target.closest(".sku-qty-btn")) return; // don't double-fire
      var sku=row.getAttribute("data-sku");
      if(!CART[sku]){
        CART[sku]=1;
      }else{
        delete CART[sku]; // toggle off
      }
      renderPicker();
      syncFormFromCart();
    };
  });
  // Clear cart
  var clr=_pickerEl.querySelector("#sku-clear-cart");
  if(clr){
    clr.onclick=function(e){e.preventDefault();CART={};renderPicker();syncFormFromCart();};
  }
}

function esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}

// ── Inject picker into order form ──
function injectPicker(){
  try{
    // Find label "รหัสสินค้า"
    var labels=document.querySelectorAll("label");
    var targetLabel=null;
    labels.forEach(function(l){
      if((l.textContent||"").indexOf("รหัสสินค้า")>=0) targetLabel=l;
    });
    if(!targetLabel) return false;

    // The section is: div > label + div(buttons)
    var section=targetLabel.parentElement;
    if(!section) return false;

    // Already injected?
    if(section.querySelector("#sku-picker")) return true;

    // Find the buttons div (next sibling of label)
    var btnsDiv=null;
    var children=section.children;
    for(var i=0;i<children.length;i++){
      if(children[i].tagName==="DIV" && children[i].querySelector("button")){
        btnsDiv=children[i];
        break;
      }
    }

    if(!btnsDiv) return false;

    // Hide original buttons but keep in DOM for React state
    btnsDiv.style.position="absolute";
    btnsDiv.style.left="-9999px";
    btnsDiv.style.opacity="0";
    btnsDiv.style.pointerEvents="none";
    btnsDiv.style.height="0";
    btnsDiv.style.overflow="hidden";
    _origBtnsDiv=btnsDiv;

    // Change label
    targetLabel.innerHTML='📦 เลือกสินค้า <span style="color:#ef4444">*</span>';

    // Create picker container
    var picker=document.createElement("div");
    picker.id="sku-picker";
    picker.style.cssText="margin-top:6px;border:1.5px solid #e2e8f0;border-radius:12px;padding:10px;background:#fafafa;max-height:340px;overflow-y:auto";
    section.appendChild(picker);
    _pickerEl=picker;

    // Reset cart on new form
    CART={};
    SEARCH="";
    FILTER="ทั้งหมด";
    renderPicker();

    return true;
  }catch(e){ return false; }
}

// ── Product Manager ──
function openMgr(){
  if(document.getElementById("sku-mgr-ov")) return;
  var ov=document.createElement("div");
  ov.id="sku-mgr-ov";
  ov.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:10000;display:flex;align-items:center;justify-content:center";
  ov.onclick=function(e){if(e.target===ov)closeMgr();};

  var md=document.createElement("div");
  md.style.cssText="background:#fff;border-radius:16px;width:94vw;max-width:700px;max-height:88vh;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,.2);overflow:hidden";

  md.innerHTML=`
    <div style="padding:14px 18px;background:linear-gradient(135deg,#fffbeb,#fef3c7);border-bottom:1px solid #fde68a;display:flex;align-items:center;gap:10px;flex-shrink:0">
      <h2 style="flex:1;font-size:16px;font-weight:700;color:#92400e;margin:0">📦 จัดการสินค้า / SKU</h2>
      <span style="font-size:13px;color:#78716c">${CAT.length} รายการ</span>
      <button id="sku-mgr-close" style="width:32px;height:32px;border-radius:50%;border:none;background:#fef3c7;color:#92400e;font-size:16px;cursor:pointer">✕</button>
    </div>
    <div id="sku-mgr-body" style="flex:1;overflow-y:auto;padding:14px 18px"></div>
    <div style="padding:10px 18px;border-top:1px solid #f3e8d0;background:#fefce8;display:flex;gap:6px;flex-wrap:wrap;align-items:center;flex-shrink:0">
      <input id="sku-a-sku" placeholder="SKU" style="width:75px;padding:7px 10px;border:1px solid #e5e7eb;border-radius:8px;font-size:12px;font-family:inherit"/>
      <input id="sku-a-name" placeholder="ชื่อสินค้า" style="flex:2;min-width:100px;padding:7px 10px;border:1px solid #e5e7eb;border-radius:8px;font-size:12px;font-family:inherit"/>
      <input id="sku-a-price" placeholder="ราคา" type="number" style="width:65px;padding:7px 10px;border:1px solid #e5e7eb;border-radius:8px;font-size:12px;font-family:inherit"/>
      <input id="sku-a-cat" placeholder="หมวด" list="sku-dl" style="flex:1;min-width:80px;padding:7px 10px;border:1px solid #e5e7eb;border-radius:8px;font-size:12px;font-family:inherit"/>
      <datalist id="sku-dl">${getCats().filter(function(c){return c!=="ทั้งหมด"}).map(function(c){return '<option value="'+esc(c)+'"/>'}).join("")}</datalist>
      <button id="sku-a-btn" style="background:#d97706;color:#fff;border:none;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap">+ เพิ่ม</button>
    </div>
  `;

  ov.appendChild(md);
  document.body.appendChild(ov);

  document.getElementById("sku-mgr-close").onclick=closeMgr;
  document.getElementById("sku-a-btn").onclick=function(){
    var sku=document.getElementById("sku-a-sku").value.trim();
    var name=document.getElementById("sku-a-name").value.trim();
    var price=parseInt(document.getElementById("sku-a-price").value)||0;
    var cat=document.getElementById("sku-a-cat").value.trim()||"ทั่วไป";
    if(!sku||!name||price<=0){alert("กรอก SKU, ชื่อ, ราคา");return;}
    if(CMAP[sku]){alert("SKU ซ้ำ");return;}
    CAT.push({sku:sku,name:name,price:price,cat:cat});
    saveCat().then(function(){renderMgrList();});
    document.getElementById("sku-a-sku").value="";
    document.getElementById("sku-a-name").value="";
    document.getElementById("sku-a-price").value="";
  };

  renderMgrList();
}

function closeMgr(){ var o=document.getElementById("sku-mgr-ov"); if(o)o.remove(); }

function renderMgrList(){
  var body=document.getElementById("sku-mgr-body");
  if(!body) return;
  var cats={};
  CAT.forEach(function(p,i){if(!cats[p.cat])cats[p.cat]=[];cats[p.cat].push({p:p,i:i});});

  var h='';
  Object.keys(cats).forEach(function(cat){
    h+='<div style="font-size:11px;font-weight:700;color:#92400e;background:#fef3c7;padding:3px 10px;border-radius:5px;margin:10px 0 5px;display:inline-block">'+esc(cat)+' ('+cats[cat].length+')</div>';
    cats[cat].forEach(function(item){
      var p=item.p,i=item.i;
      h+='<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid #f0f0f0;border-radius:8px;margin-bottom:4px" data-idx="'+i+'">';
      h+='<span style="font-family:\'JetBrains Mono\',monospace;font-size:10px;color:#d97706;background:#fffbeb;padding:2px 7px;border-radius:4px;font-weight:600;min-width:62px;text-align:center">'+esc(p.sku)+'</span>';
      h+='<span style="flex:1;font-size:12px;color:#1e293b">'+esc(p.name)+'</span>';
      h+='<span style="font-size:12px;font-weight:700;color:#92400e">฿'+p.price.toLocaleString()+'</span>';
      h+='<button class="sku-mgr-edit" data-idx="'+i+'" style="width:26px;height:26px;border-radius:5px;border:1px solid #e5e7eb;background:#fff;cursor:pointer;font-size:12px" title="แก้ไข">✏️</button>';
      h+='<button class="sku-mgr-del" data-idx="'+i+'" style="width:26px;height:26px;border-radius:5px;border:1px solid #e5e7eb;background:#fff;cursor:pointer;font-size:12px" title="ลบ">🗑️</button>';
      h+='</div>';
    });
  });

  if(CAT.length===0) h='<div style="text-align:center;padding:30px;color:#94a3b8">ยังไม่มีสินค้า</div>';
  body.innerHTML=h;

  body.querySelectorAll(".sku-mgr-del").forEach(function(b){
    b.onclick=function(){
      var i=parseInt(b.getAttribute("data-idx"));
      if(confirm("ลบ '"+CAT[i].name+"' ?")){CAT.splice(i,1);saveCat().then(function(){renderMgrList();});}
    };
  });
  body.querySelectorAll(".sku-mgr-edit").forEach(function(b){
    b.onclick=function(){
      var i=parseInt(b.getAttribute("data-idx"));
      var p=CAT[i];
      var row=b.closest("[data-idx]");
      if(!row) return;
      row.innerHTML=`
        <input value="${esc(p.sku)}" id="se-sku-${i}" style="width:65px;padding:5px;border:1px solid #e5e7eb;border-radius:5px;font-size:11px;font-family:inherit"/>
        <input value="${esc(p.name)}" id="se-name-${i}" style="flex:1;padding:5px;border:1px solid #e5e7eb;border-radius:5px;font-size:11px;font-family:inherit"/>
        <input value="${p.price}" id="se-price-${i}" type="number" style="width:60px;padding:5px;border:1px solid #e5e7eb;border-radius:5px;font-size:11px;font-family:inherit"/>
        <input value="${esc(p.cat)}" id="se-cat-${i}" list="sku-dl" style="width:80px;padding:5px;border:1px solid #e5e7eb;border-radius:5px;font-size:11px;font-family:inherit"/>
        <button id="se-ok-${i}" style="padding:5px 10px;border:none;border-radius:5px;background:#22c55e;color:#fff;font-size:11px;cursor:pointer;font-weight:600">✓</button>
        <button id="se-no-${i}" style="padding:5px 10px;border:none;border-radius:5px;background:#e5e7eb;color:#475569;font-size:11px;cursor:pointer">✕</button>
      `;
      document.getElementById("se-ok-"+i).onclick=function(){
        var sku=document.getElementById("se-sku-"+i).value.trim();
        var name=document.getElementById("se-name-"+i).value.trim();
        var price=parseInt(document.getElementById("se-price-"+i).value)||0;
        var cat=document.getElementById("se-cat-"+i).value.trim()||"ทั่วไป";
        if(!sku||!name||price<=0){alert("กรอกให้ครบ");return;}
        for(var j=0;j<CAT.length;j++){if(j!==i&&CAT[j].sku===sku){alert("SKU ซ้ำ");return;}}
        CAT[i]={sku:sku,name:name,price:price,cat:cat};
        saveCat().then(function(){renderMgrList();});
      };
      document.getElementById("se-no-"+i).onclick=function(){renderMgrList();};
    };
  });
}

// ── FAB ──
function createFAB(){
  if(document.getElementById("sku-fab")) return;
  var f=document.createElement("button");
  f.id="sku-fab";
  f.type="button";
  f.title="จัดการสินค้า";
  f.style.cssText="position:fixed;bottom:20px;right:20px;z-index:9999;width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,#d97706,#b45309);color:#fff;border:none;font-size:20px;cursor:pointer;box-shadow:0 4px 16px rgba(217,119,6,.4);display:flex;align-items:center;justify-content:center";
  f.textContent="📦";
  f.onclick=openMgr;
  document.body.appendChild(f);
}

// ── Observer ──
var _timer=null;
var _obs=null;
function startWatch(){
  if(_obs) return;
  _obs=new MutationObserver(function(){
    if(_timer) clearTimeout(_timer);
    _timer=setTimeout(function(){
      try{
        // Try to inject picker if order form is visible
        if(!document.getElementById("sku-picker")) {
          _pickerEl=null;
          _origBtnsDiv=null;
          injectPicker();
        }
        // Check if picker was removed (form closed/changed)
        if(_pickerEl && !document.body.contains(_pickerEl)){
          _pickerEl=null;
          _origBtnsDiv=null;
        }
      }catch(e){}
    },400);
  });
  _obs.observe(document.body,{childList:true,subtree:true});
}

// ── Init ──
async function init(){
  await loadCat();
  createFAB();
  startWatch();
  setTimeout(function(){try{injectPicker();}catch(e){}},1500);
  setTimeout(function(){try{injectPicker();}catch(e){}},4000);
  console.log("[SKU] v2 loaded — "+CAT.length+" products");
}

if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",function(){setTimeout(init,500);});
}else{
  setTimeout(init,500);
}

})();
