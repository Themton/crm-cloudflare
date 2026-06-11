// ═══════════════════════════════════════════════════════════════
// SKU Product Catalog — standalone overlay for CRM Cloudflare
// ไม่แก้ app.bundle.js เลย — ทำงานผ่าน DOM observation
// ═══════════════════════════════════════════════════════════════
(function(){
"use strict";

// ── API helpers (reuse globals from app.bundle.js) ──
function getApiUrl(){ return (typeof SUPABASE_URL!=="undefined"?SUPABASE_URL:null)||localStorage.getItem("sb_url")||"https://crm-themt-api.themtja.workers.dev"; }
function getApiKey(){ return (typeof SUPABASE_KEY!=="undefined"?SUPABASE_KEY:null)||localStorage.getItem("sb_key")||""; }

async function skuFetch(path,opts){
  var url=getApiUrl()+"/rest/v1/"+path;
  var headers={"apikey":getApiKey(),"Authorization":"Bearer "+getApiKey(),"Content-Type":"application/json"};
  if(opts&&opts.method==="PATCH") headers["Prefer"]="return=minimal";
  if(opts&&opts.method==="POST") headers["Prefer"]="return=representation";
  var o={method:(opts&&opts.method)||"GET",headers:headers};
  if(opts&&opts.body) o.body=JSON.stringify(opts.body);
  try{
    var r=await fetch(url,o);
    if(!r.ok) return null;
    var ct=r.headers.get("content-type")||"";
    if(ct.indexOf("json")>=0) return await r.json();
    return null;
  }catch(e){ return null; }
}

// ── Default product catalog ──
var DEFAULT_CATALOG=[
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

var _catalog=[];
var _catalogMap={};
var _skuMgrOpen=false;

// ── Load / Save catalog ──
async function loadCatalog(){
  try{
    var r=await skuFetch("app_settings?key=eq.sku_catalog&select=value");
    if(r&&r.length>0&&r[0].value){
      _catalog=JSON.parse(r[0].value);
    }else{
      _catalog=DEFAULT_CATALOG.slice();
      await saveCatalog();
    }
  }catch(e){
    _catalog=DEFAULT_CATALOG.slice();
  }
  _rebuildMap();
  _syncProductCodes();
}

function _rebuildMap(){
  _catalogMap={};
  _catalog.forEach(function(p){ _catalogMap[p.sku]=p; });
}

async function saveCatalog(){
  var val=JSON.stringify(_catalog);
  // Try PATCH first, then POST
  var r=await skuFetch("app_settings?key=eq.sku_catalog",{method:"PATCH",body:{value:val,updated_at:new Date().toISOString()}});
  if(r===null){
    await skuFetch("app_settings",{method:"POST",body:{key:"sku_catalog",value:val,updated_at:new Date().toISOString()}});
  }
  _rebuildMap();
}

// Sync product_codes in app_settings to match catalog SKUs
async function _syncProductCodes(){
  var codes=_catalog.map(function(p){return p.sku}).join(",");
  var r=await skuFetch("app_settings?key=eq.product_codes",{method:"PATCH",body:{value:codes,updated_at:new Date().toISOString()}});
  if(r===null){
    await skuFetch("app_settings",{method:"POST",body:{key:"product_codes",value:codes,updated_at:new Date().toISOString()}});
  }
}

// ── CSS injection ──
function injectStyles(){
  if(document.getElementById("sku-styles")) return;
  var s=document.createElement("style");
  s.id="sku-styles";
  s.textContent=`
    .sku-fab{position:fixed;bottom:20px;right:20px;z-index:9999;width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#d97706,#b45309);color:#fff;border:none;font-size:22px;cursor:pointer;box-shadow:0 4px 16px rgba(217,119,6,.4);display:flex;align-items:center;justify-content:center;transition:transform .15s}
    .sku-fab:hover{transform:scale(1.1)}
    .sku-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:10000;display:flex;align-items:center;justify-content:center;animation:skuFadeIn .2s}
    @keyframes skuFadeIn{from{opacity:0}to{opacity:1}}
    .sku-modal{background:#fff;border-radius:16px;width:94vw;max-width:700px;max-height:88vh;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,.2);overflow:hidden}
    .sku-modal-hdr{padding:16px 20px;background:linear-gradient(135deg,#fffbeb,#fef3c7);border-bottom:1px solid #fde68a;display:flex;align-items:center;gap:12px;flex-shrink:0}
    .sku-modal-hdr h2{flex:1;font-size:17px;font-weight:700;color:#92400e;margin:0}
    .sku-modal-body{flex:1;overflow-y:auto;padding:16px 20px}
    .sku-close{width:34px;height:34px;border-radius:50%;border:none;background:#fef3c7;color:#92400e;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center}
    .sku-close:hover{background:#fde68a}
    .sku-cat-label{font-size:12px;font-weight:700;color:#92400e;background:#fef3c7;padding:4px 12px;border-radius:6px;margin:12px 0 6px;display:inline-block}
    .sku-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid #f3e8d0;border-radius:10px;margin-bottom:6px;transition:border-color .15s}
    .sku-item:hover{border-color:#d97706}
    .sku-sku{font-family:'JetBrains Mono',monospace;font-size:11px;color:#d97706;background:#fffbeb;padding:2px 8px;border-radius:4px;font-weight:600;min-width:70px;text-align:center;flex-shrink:0}
    .sku-name{flex:1;font-size:13px;color:#1e293b}
    .sku-price{font-size:13px;font-weight:700;color:#92400e;min-width:60px;text-align:right}
    .sku-actions{display:flex;gap:4px}
    .sku-btn-sm{width:28px;height:28px;border-radius:6px;border:1px solid #e5e7eb;background:#fff;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;color:#64748b}
    .sku-btn-sm:hover{background:#fef3c7;border-color:#fbbf24;color:#92400e}
    .sku-add-bar{display:flex;gap:8px;padding:12px 20px;border-top:1px solid #f3e8d0;flex-shrink:0;background:#fefce8}
    .sku-add-bar input,.sku-add-bar select{border:1px solid #e5e7eb;border-radius:8px;padding:8px 10px;font-size:13px;font-family:inherit}
    .sku-add-bar input:focus,.sku-add-bar select:focus{border-color:#fbbf24;outline:none;box-shadow:0 0 0 3px rgba(251,191,36,.15)}
    .sku-add-btn{background:#d97706;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap}
    .sku-add-btn:hover{background:#b45309}
    /* Order form enhancement */
    .sku-enhanced-btn{position:relative;min-width:100px !important;flex-direction:column !important;align-items:center !important;padding:8px 12px !important;min-height:60px !important}
    .sku-btn-label{font-size:10px;color:#64748b;margin-top:2px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .sku-btn-price{font-size:10px;font-weight:700;color:#d97706}
    .sku-price-auto{background:#fffbeb;border:2px solid #fbbf24;border-radius:10px;padding:8px 14px;margin-top:6px;font-size:13px;color:#92400e;font-weight:600;display:flex;align-items:center;gap:8px;animation:skuFadeIn .2s}
    .sku-edit-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;padding:10px;background:#fffbeb;border-radius:10px;border:1px solid #fde68a}
    .sku-edit-row input,.sku-edit-row select{flex:1;min-width:80px;border:1px solid #e5e7eb;border-radius:6px;padding:6px 8px;font-size:12px;font-family:inherit}
    .sku-edit-row button{padding:6px 12px;border-radius:6px;border:none;font-size:12px;cursor:pointer;font-family:inherit;font-weight:600}
    .sku-search{width:100%;border:1px solid #e5e7eb;border-radius:10px;padding:10px 14px;font-size:13px;font-family:inherit;margin-bottom:12px}
    .sku-search:focus{border-color:#fbbf24;outline:none;box-shadow:0 0 0 3px rgba(251,191,36,.15)}
  `;
  document.head.appendChild(s);
}

// ── Product Manager Modal ──
function openProductManager(){
  if(_skuMgrOpen) return;
  _skuMgrOpen=true;
  var ov=document.createElement("div");
  ov.className="sku-overlay";
  ov.id="sku-mgr-overlay";
  ov.onclick=function(e){if(e.target===ov){closeProductManager();}};
  
  var modal=document.createElement("div");
  modal.className="sku-modal";
  
  // Header
  var hdr=document.createElement("div");
  hdr.className="sku-modal-hdr";
  hdr.innerHTML='<h2>📦 จัดการสินค้า / SKU</h2><button class="sku-close" onclick="document.getElementById(\'sku-mgr-overlay\').remove();window._skuMgrOpenFlag=false;">✕</button>';
  modal.appendChild(hdr);
  
  // Body
  var body=document.createElement("div");
  body.className="sku-modal-body";
  body.id="sku-mgr-body";
  modal.appendChild(body);
  
  // Add bar
  var addBar=document.createElement("div");
  addBar.className="sku-add-bar";
  addBar.innerHTML=`
    <input id="sku-add-sku" placeholder="SKU" style="width:80px;flex:none"/>
    <input id="sku-add-name" placeholder="ชื่อสินค้า" style="flex:2"/>
    <input id="sku-add-price" placeholder="ราคา" type="number" style="width:70px;flex:none"/>
    <input id="sku-add-cat" placeholder="หมวดหมู่" list="sku-cat-list" style="flex:1"/>
    <datalist id="sku-cat-list"></datalist>
    <button class="sku-add-btn" id="sku-add-submit">+ เพิ่ม</button>
  `;
  modal.appendChild(addBar);
  
  ov.appendChild(modal);
  document.body.appendChild(ov);
  
  _renderCatalogList();
  _updateCatDatalist();
  
  document.getElementById("sku-add-submit").onclick=function(){
    var sku=document.getElementById("sku-add-sku").value.trim();
    var name=document.getElementById("sku-add-name").value.trim();
    var price=parseInt(document.getElementById("sku-add-price").value)||0;
    var cat=document.getElementById("sku-add-cat").value.trim()||"ทั่วไป";
    if(!sku||!name||price<=0){alert("กรุณากรอก SKU, ชื่อ, และราคา");return;}
    if(_catalogMap[sku]){alert("SKU '"+sku+"' มีอยู่แล้ว");return;}
    _catalog.push({sku:sku,name:name,price:price,cat:cat});
    saveCatalog().then(function(){_syncProductCodes();_renderCatalogList();_updateCatDatalist();});
    document.getElementById("sku-add-sku").value="";
    document.getElementById("sku-add-name").value="";
    document.getElementById("sku-add-price").value="";
  };
}

function closeProductManager(){
  var ov=document.getElementById("sku-mgr-overlay");
  if(ov) ov.remove();
  _skuMgrOpen=false;
  window._skuMgrOpenFlag=false;
}

function _updateCatDatalist(){
  var dl=document.getElementById("sku-cat-list");
  if(!dl) return;
  var cats=[]; 
  _catalog.forEach(function(p){if(cats.indexOf(p.cat)<0)cats.push(p.cat);});
  dl.innerHTML=cats.map(function(c){return '<option value="'+c+'"/>';}).join("");
}

function _renderCatalogList(){
  var body=document.getElementById("sku-mgr-body");
  if(!body) return;
  
  // Group by category
  var cats={};
  _catalog.forEach(function(p,i){
    if(!cats[p.cat]) cats[p.cat]=[];
    cats[p.cat].push({p:p,i:i});
  });
  
  var html='<input class="sku-search" id="sku-search-input" placeholder="🔍 ค้นหา SKU หรือชื่อสินค้า..." />';
  var catKeys=Object.keys(cats);
  catKeys.forEach(function(cat){
    html+='<div class="sku-cat-label">'+_esc(cat)+' ('+cats[cat].length+')</div>';
    cats[cat].forEach(function(item){
      var p=item.p, idx=item.i;
      html+='<div class="sku-item" data-sku="'+_esc(p.sku)+'" data-idx="'+idx+'">';
      html+='<span class="sku-sku">'+_esc(p.sku)+'</span>';
      html+='<span class="sku-name">'+_esc(p.name)+'</span>';
      html+='<span class="sku-price">฿'+p.price.toLocaleString()+'</span>';
      html+='<span class="sku-actions">';
      html+='<button class="sku-btn-sm" data-action="edit" data-idx="'+idx+'" title="แก้ไข">✏️</button>';
      html+='<button class="sku-btn-sm" data-action="del" data-idx="'+idx+'" title="ลบ">🗑️</button>';
      html+='</span>';
      html+='</div>';
    });
  });
  
  if(_catalog.length===0) html+='<div style="text-align:center;padding:40px;color:#94a3b8">ยังไม่มีสินค้า — เพิ่มด้านล่าง</div>';
  
  body.innerHTML=html;
  
  // Search
  var si=document.getElementById("sku-search-input");
  if(si){
    si.oninput=function(){
      var q=si.value.toLowerCase();
      body.querySelectorAll(".sku-item").forEach(function(el){
        var sku=el.getAttribute("data-sku").toLowerCase();
        var name=(el.querySelector(".sku-name")||{}).textContent||"";
        el.style.display=(sku.indexOf(q)>=0||name.toLowerCase().indexOf(q)>=0)?"":"none";
      });
    };
  }
  
  // Edit/Delete buttons
  body.querySelectorAll(".sku-btn-sm").forEach(function(btn){
    btn.onclick=function(e){
      e.stopPropagation();
      var action=btn.getAttribute("data-action");
      var idx=parseInt(btn.getAttribute("data-idx"));
      if(action==="del"){
        if(confirm("ลบ '"+_catalog[idx].name+"' ?"))
          {_catalog.splice(idx,1);saveCatalog().then(function(){_syncProductCodes();_renderCatalogList();});}
      }else if(action==="edit"){
        _showEditRow(idx);
      }
    };
  });
}

function _showEditRow(idx){
  var p=_catalog[idx];
  var itemEl=document.querySelector('.sku-item[data-idx="'+idx+'"]');
  if(!itemEl) return;
  
  var editDiv=document.createElement("div");
  editDiv.className="sku-edit-row";
  editDiv.innerHTML=`
    <input value="${_esc(p.sku)}" id="sku-edit-sku-${idx}" placeholder="SKU" style="width:80px;flex:none"/>
    <input value="${_esc(p.name)}" id="sku-edit-name-${idx}" placeholder="ชื่อ" style="flex:2"/>
    <input value="${p.price}" id="sku-edit-price-${idx}" type="number" placeholder="ราคา" style="width:70px;flex:none"/>
    <input value="${_esc(p.cat)}" id="sku-edit-cat-${idx}" placeholder="หมวด" list="sku-cat-list" style="flex:1"/>
    <button style="background:#22c55e;color:#fff" onclick="window._skuSaveEdit(${idx})">✓ บันทึก</button>
    <button style="background:#e5e7eb;color:#475569" onclick="window._skuCancelEdit(${idx})">✕</button>
  `;
  
  itemEl.style.display="none";
  try{ itemEl.after(editDiv); }catch(e){ try{ itemEl.parentNode.appendChild(editDiv); }catch(e2){} }
}

window._skuSaveEdit=function(idx){
  var sku=document.getElementById("sku-edit-sku-"+idx).value.trim();
  var name=document.getElementById("sku-edit-name-"+idx).value.trim();
  var price=parseInt(document.getElementById("sku-edit-price-"+idx).value)||0;
  var cat=document.getElementById("sku-edit-cat-"+idx).value.trim()||"ทั่วไป";
  if(!sku||!name||price<=0){alert("กรุณากรอกให้ครบ");return;}
  // Check duplicate SKU (exclude current)
  for(var i=0;i<_catalog.length;i++){if(i!==idx&&_catalog[i].sku===sku){alert("SKU ซ้ำ");return;}}
  _catalog[idx]={sku:sku,name:name,price:price,cat:cat};
  saveCatalog().then(function(){_syncProductCodes();_renderCatalogList();_updateCatDatalist();});
};

window._skuCancelEdit=function(idx){
  _renderCatalogList();
};

function _esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}

// ── FAB Button ──
function createFAB(){
  if(document.getElementById("sku-fab")) return;
  var fab=document.createElement("button");
  fab.id="sku-fab";
  fab.className="sku-fab";
  fab.title="จัดการสินค้า / SKU";
  fab.textContent="📦";
  fab.onclick=function(){openProductManager();};
  document.body.appendChild(fab);
}

// ── Order Form Enhancement ──
// Watch DOM for product code buttons and enhance them
var _lastEnhanced=0;
function enhanceOrderForm(){
  try{
  // Find product code button containers
  var allButtons=document.querySelectorAll("button[type='button']");
  var pcButtons=[];
  
  allButtons.forEach(function(btn){
    var txt=btn.textContent.trim();
    // Check if this looks like a product code button (matches a catalog SKU)
    if(_catalogMap[txt]){
      pcButtons.push(btn);
    }
  });
  
  if(pcButtons.length===0) return;
  
  // Enhance each button
  pcButtons.forEach(function(btn){
    if(btn.getAttribute("data-sku-enhanced")) return;
    btn.setAttribute("data-sku-enhanced","1");
    
    var sku=btn.textContent.trim();
    var prod=_catalogMap[sku];
    if(!prod) return;
    
    // Save original style
    var origPad=btn.style.padding;
    
    // Make button taller and add product info
    btn.style.padding="8px 12px";
    btn.style.minHeight="64px";
    btn.style.display="flex";
    btn.style.flexDirection="column";
    btn.style.alignItems="center";
    btn.style.gap="2px";
    btn.style.minWidth="100px";
    
    // Clear and rebuild content
    btn.textContent="";
    
    var skuSpan=document.createElement("span");
    skuSpan.style.cssText="font-weight:700;font-size:12px";
    skuSpan.textContent=sku;
    
    var nameSpan=document.createElement("span");
    nameSpan.className="sku-btn-label";
    nameSpan.textContent=prod.name;
    nameSpan.title=prod.name;
    
    var priceSpan=document.createElement("span");
    priceSpan.className="sku-btn-price";
    priceSpan.textContent="฿"+prod.price.toLocaleString();
    
    btn.appendChild(skuSpan);
    btn.appendChild(nameSpan);
    btn.appendChild(priceSpan);
    
    // Add click handler for auto-fill price
    btn.addEventListener("click",function(){
      setTimeout(function(){_autoFillPrice();},50);
    });
  });
  
  _lastEnhanced=Date.now();
  }catch(e){ /* safe fail */ }
}

function _autoFillPrice(){
  try{
  var allButtons=document.querySelectorAll("button[data-sku-enhanced]");
  var totalPrice=0;
  var selectedItems=[];
  
  allButtons.forEach(function(btn){
    // Check if button is selected (by border color or background)
    var style=btn.style;
    var computed=window.getComputedStyle(btn);
    var borderColor=style.borderColor||computed.borderColor||"";
    var border=style.border||computed.border||"";
    
    // Selected buttons have "2px solid #2563eb" border
    var isSelected=border.indexOf("2563eb")>=0||borderColor.indexOf("2563eb")>=0||
                   border.indexOf("rgb(37, 99, 235)")>=0||borderColor.indexOf("rgb(37, 99, 235)")>=0;
    
    if(isSelected){
      var skuSpan=btn.querySelector("span");
      if(skuSpan){
        var sku=skuSpan.textContent.trim();
        var prod=_catalogMap[sku];
        if(prod){
          totalPrice+=prod.price;
          selectedItems.push(prod.name+" ฿"+prod.price.toLocaleString());
        }
      }
    }
  });
  
  if(totalPrice>0){
    // Find the SalePrice input and fill it
    _fillPriceInput(totalPrice);
    _showPriceSummary(totalPrice,selectedItems);
  }else{
    _removePriceSummary();
  }
  }catch(e){ /* safe fail */ }
}

function _fillPriceInput(price){
  try{
  var inputs=document.querySelectorAll("input");
  inputs.forEach(function(inp){
    var placeholder=(inp.placeholder||"").toLowerCase();
    var prev=inp.previousElementSibling;
    var prevText=prev?(prev.textContent||""):"";
    
    if(placeholder.indexOf("ราคา")>=0||placeholder.indexOf("saleprice")>=0||
       placeholder.indexOf("sale")>=0||placeholder.indexOf("price")>=0||
       prevText.indexOf("ราคาขาย")>=0||prevText.indexOf("SalePrice")>=0){
      var nativeSet=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"value").set;
      nativeSet.call(inp,String(price));
      inp.dispatchEvent(new Event("input",{bubbles:true}));
      inp.dispatchEvent(new Event("change",{bubbles:true}));
    }
  });
  }catch(e){}
}

function _showPriceSummary(total,items){
  _removePriceSummary();
  var pcSection=document.querySelector("button[data-sku-enhanced]");
  if(!pcSection) return;
  var container=pcSection.parentElement;
  if(!container) return;
  
  var summary=document.createElement("div");
  summary.id="sku-price-summary";
  summary.className="sku-price-auto";
  summary.innerHTML='<span>💰</span><span>รวม <b>฿'+total.toLocaleString()+'</b></span><span style="font-size:11px;color:#78716c;margin-left:auto">'+items.join(" + ")+'</span>';
  try{ container.after(summary); }catch(e){ try{ container.parentNode.appendChild(summary); }catch(e2){} }
}

function _removePriceSummary(){
  var el=document.getElementById("sku-price-summary");
  if(el) el.remove();
}

// ── DOM Observer ──
var _observer=null;
var _enhanceTimer=null;
function startObserving(){
  if(_observer) return;
  _observer=new MutationObserver(function(){
    if(_enhanceTimer) clearTimeout(_enhanceTimer);
    _enhanceTimer=setTimeout(function(){
      try{ enhanceOrderForm(); }catch(e){}
    },300);
  });
  _observer.observe(document.body,{childList:true,subtree:true});
}

// ── Auto-generate SKU ──
window._skuAutoGenerate=function(catPrefix){
  var maxNum=0;
  _catalog.forEach(function(p){
    if(p.sku.indexOf(catPrefix)===0){
      var m=p.sku.match(/-(\d+)$/);
      if(m) maxNum=Math.max(maxNum,parseInt(m[1]));
    }
  });
  return catPrefix+"-"+String(maxNum+1).padStart(2,"0");
};

// ── Init ──
async function init(){
  injectStyles();
  await loadCatalog();
  createFAB();
  startObserving();
  // Initial enhancement
  setTimeout(enhanceOrderForm,1000);
  setTimeout(enhanceOrderForm,3000);
  console.log("[SKU] Loaded "+_catalog.length+" products");
}

// Wait for DOM ready, then for app to load
if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",function(){setTimeout(init,500);});
}else{
  setTimeout(init,500);
}

})();
