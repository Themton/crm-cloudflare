/* J&T CRM panel. No carrier secrets are stored in the browser. */
var MTJT = {
 session: '',
 restore:function(email){try{var r=JSON.parse(localStorage.getItem('ps_session')||'null');if(r&&r.user.email===email){this.session=r.session;this.user=email;return true;}}catch(_){}this.session='';this.user='';return false;},
 async call(action, body, pdf) {
  var res = await fetch(SUPABASE_URL.replace(/\/$/,'')+'/jt-api/'+action,{
   method:'POST',headers:{'Content-Type':'application/json',apikey:SUPABASE_KEY,'x-jt-session':this.session},
   body:JSON.stringify(body||{}),signal:AbortSignal.timeout(45000)
  });
  if(pdf && res.ok && (res.headers.get('Content-Type')||'').includes('application/pdf'))return res.blob();
  var data=await res.json();
  if(!res.ok){if(res.status===401){this.session='';localStorage.removeItem('ps_session');}throw new Error(data.error||data.msg||'J&T ทำรายการไม่สำเร็จ');}
  return data;
 },
 async guard(order){return (await this.call('guard',{table:order._table||'orders',orderId:order.OrderID})).reserved;},
 async guardTracking(number){return (await this.call('guard',{trackingNo:number})).reserved;}
};
function ShippingPage(props) {
 var account=null;try{account=JSON.parse(localStorage.getItem('ps_user')||'null');}catch(_){}
 MTJT.restore(account&&account.username||'');
 props=Object.assign({},props,{currentUser:account&&account.username||''});
 var h=React.createElement,carrier=props.carrier==='jnt'?'jnt':'flash';
 var filtered=Object.assign({},props,{
  orders:(props.orders||[]).filter(function(o){return carrier==='jnt'?o.Carrier==='jnt':o.Carrier!=='jnt';}),
  upsellOrders:(props.upsellOrders||[]).filter(function(o){return carrier==='jnt'?o.Carrier==='jnt':o.Carrier!=='jnt';})
 });
 return carrier==='jnt'?h(JtShippingPanel,filtered):h('div',null,
  h('h2',{style:{color:'#b45309',margin:'0 0 16px'}},'จัดส่ง Flash Express'),h(FlashShippingPage,filtered));
}
function jtRowKey(o){return o._table+':'+o.OrderID;}
function jtStage(o){var r=o._jt;if(r){if(r.deleted_at)return 'deleted';if(r.state==='cancelled')return 'cancelled';if(r.state!=='created')return 'review';return r.printed_at?'printed':'created';}return o.Status==='ยกเลิก'?'cancelled':'pending';}
function jtScanGroup(o){var s=(o._jt&&o._jt.carrier_status)||o.FlashStatus||'';if(/ตีกลับ|ส่งคืน|คืนสำเร็จ/.test(s))return 'returned';if(/เซ็นรับ|ลูกค้ารับ|Delivered/.test(s))return 'delivered';if(/ปัญหา|ติดต่อไม่ได้|ไม่สำเร็จ|ระงับ/.test(s))return 'problem';if(/นำจ่าย|กำลังจัดส่ง/.test(s))return 'delivery';if(/ขนส่ง|เข้าคลัง/.test(s))return 'transit';if(/รับพัสดุ|Picked Up/.test(s))return 'received';return 'waiting';}
function jtMergeRows(orders,upsell,ledger){var map=new Map();[['orders',orders],['upsell',upsell]].forEach(function(pair){(pair[1]||[]).filter(function(o){return o.Carrier==='jnt';}).forEach(function(o){var row=Object.assign({},o,{_table:pair[0]});map.set(jtRowKey(row),row);});});(ledger||[]).forEach(function(r){var key=r.order_table+':'+r.order_id;var row=map.get(key)||{OrderID:r.order_id,_table:r.order_table,Carrier:'jnt',Timestamp:r.created_at};map.set(key,Object.assign({},row,{_jt:r,TrackingNo:r.bill_code||'',FlashStatus:r.carrier_status||'',FlashDetail:r.detail||''}));});return Array.from(map.values()).sort(function(a,b){return String(b.Timestamp||'').localeCompare(String(a.Timestamp||''));});}
function JtShippingPanel(props){
 var h=React.createElement;
 function state(v){return React.useState(v);}
 var [logged,setLogged]=state(!!MTJT.session&&(!props.currentUser||MTJT.user===props.currentUser));
 var [rows,setRows]=state([]),[config,setConfig]=state(null),[busy,setBusy]=state(false),[loaded,setLoaded]=state(false),[message,setMessage]=state('');
 var [email,setEmail]=state(props.currentUser||''),[password,setPassword]=state(''),[weight,setWeight]=state('1');
 var [query,setQuery]=state(''),[phone,setPhone]=state(''),[source,setSource]=state('ALL'),[stage,setStage]=state('pending'),[scan,setScan]=state('ALL');
 var [dateFrom,setDateFrom]=state(''),[dateTo,setDateTo]=state(''),[selected,setSelected]=state({}),[page,setPage]=state(1),[pageSize,setPageSize]=state(100);
 var [auto,setAuto]=state('5'),[progress,setProgress]=state(null),[results,setResults]=state([]),[confirm,setConfirm]=state(null),[detail,setDetail]=state(null),[history,setHistory]=state(null),[pdfUrl,setPdfUrl]=state('');
 var busyRef=React.useRef(false),latest=React.useRef(null);
 var shop=config&&config.shops.find(function(s){return s.id===config.defaultShopId;}),canManage=!!props.isAdmin&&!!config&&config.isAdmin;
 var canWrite=!!props.isAdmin||!!props.isShipping;
 var btn={padding:'7px 12px',border:'1px solid #e2e8f0',borderRadius:6,background:'#fff',color:'#475569',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'};
 var inp={padding:'7px 10px',border:'1px solid #e2e8f0',borderRadius:6,fontSize:12,fontFamily:'inherit',background:'#fff',color:'#475569'};
 var box={background:'#fff',border:'1px solid #e2e8f0',borderRadius:10,padding:'10px 14px',marginBottom:10};
 var stages=[['ALL','ทั้งหมด','#475569'],['pending','📦 เตรียมส่ง','#d97706'],['created','🔖 สร้างเลขแล้ว','#0369a1'],['printed','🖨️ ปริ้นแล้ว','#059669'],['cancelled','🚫 ยกเลิก','#dc2626'],['review','⚠️ ต้องตรวจสอบ','#b45309'],['deleted','🗑 ลบแล้ว','#64748b']];
 var scans=[['ALL','📋 ทั้งหมด'],['waiting','⏳ รอ J&T รับ'],['received','📦 รับพัสดุแล้ว'],['transit','🚛 กำลังขนส่ง'],['delivery','🚚 การนำจ่าย'],['delivered','✅ เซ็นรับแล้ว'],['problem','⚠️ พัสดุมีปัญหา'],['returned','↩️ ส่งคืน']];
 async function load(){var cfg=await MTJT.call('shops');setConfig(cfg);if(!config||config.revision!==cfg.revision){var sh=cfg.shops.find(function(s){return s.id===cfg.defaultShopId;});if(sh)setWeight(String(sh.weight));}var collected=[],offset=0;for(;;){var r=await MTJT.call('list',{offset:offset});collected=collected.concat(r.rows);if(r.rows.length<200)break;offset+=200;}setRows(collected);setLoaded(true);}
 async function run(fn){if(busyRef.current)return;busyRef.current=true;setBusy(true);setMessage('');try{await fn();}catch(e){setMessage(e.message);if(!MTJT.session)setLogged(false);}finally{busyRef.current=false;setBusy(false);}}
 async function reload(){await load();if(props.onRefresh)await props.onRefresh();}
 React.useEffect(function(){if(props.currentUser&&MTJT.user!==props.currentUser){MTJT.session='';MTJT.user='';setLogged(false);}if(logged)run(load);},[logged,props.currentUser]);
 latest.current=load;
 React.useEffect(function(){if(!logged||auto==='0')return;var timer=setInterval(function(){if(!busyRef.current)run(function(){return latest.current();});},Number(auto)*60000);return function(){clearInterval(timer);};},[logged,auto]);
 React.useEffect(function(){return function(){if(pdfUrl)URL.revokeObjectURL(pdfUrl);};},[pdfUrl]);
 React.useEffect(function(){setSelected({});setPage(1);},[source,query,phone,stage,scan,dateFrom,dateTo]);
 var all=jtMergeRows(props.orders,props.upsellOrders,rows);
 var base=all.filter(function(o){var day=String(o.Timestamp||'').slice(0,10);return(source==='ALL'||o._table===source)&&(!dateFrom||day>=dateFrom)&&(!dateTo||day<=dateTo)&&(!query||[o.OrderID,o.Name,o.MobileNo,o.Remark,o.SalesPerson,o.TrackingNo].join(' ').toLowerCase().includes(query.toLowerCase()))&&(!phone||String(o.MobileNo||'').includes(phone));});
 var filtered=base.filter(function(o){return(stage==='ALL'?jtStage(o)!=='deleted':jtStage(o)===stage)&&(scan==='ALL'||!!o._jt&&!o._jt.deleted_at&&o._jt.state!=='cancelled'&&jtScanGroup(o)===scan);});
 var totalPages=Math.max(1,Math.ceil(filtered.length/pageSize)),currentPage=Math.min(page,totalPages),shown=filtered.slice((currentPage-1)*pageSize,currentPage*pageSize);
 var picked=filtered.filter(function(o){return selected[jtRowKey(o)];});
 var creatable=picked.filter(function(o){return !o._jt&&['รอส่ง','pending'].includes(o.Status)&&!o.TrackingNo;}),printable=picked.filter(function(o){return o._jt&&o._jt.state==='created'&&o.TrackingNo;}),trackable=(picked.length?picked:filtered).filter(function(o){return o._jt&&!o._jt.deleted_at&&o._jt.state!=='cancelled';});
 function toggle(list){var every=list.length>0&&list.every(function(o){return selected[jtRowKey(o)];});setSelected(function(prev){var next=Object.assign({},prev);list.forEach(function(o){next[jtRowKey(o)]=!every;});return next;});}
 function button(label,fn,disabled,color){return h('button',{type:'button',style:Object.assign({},btn,color?{color:color,borderColor:color,background:'#fff'}:{}),disabled:busy||disabled,onClick:fn},label);}
 function act(label,fn,disabled,color){return button(label,function(){run(fn);},disabled,color);}
 function ref(o){return {table:o._table,orderId:o.OrderID};}
 function ask(type,list){setConfirm({type:type,items:list.slice()});}
 async function batch(type,list){var out=[],merged=(type==='label'||type==='official-label')?await PDFLib.PDFDocument.create():null;
  setResults([]);setProgress({done:0,total:list.length});
  for(var i=0;i<list.length;i++){var o=list[i];try{
   if(type==='create'){if(!shop)throw new Error('แอดมินยังไม่ได้ตั้งร้านเริ่มต้น');var r=await MTJT.call('create',Object.assign(ref(o),{shopId:shop.id,shopRevision:config.revision,weight:weight,environment:'production'}));out.push({id:o.OrderID,ok:true,text:r.billCode});}
   else if(type==='label'||type==='official-label'){var doc;if(type==='label'){doc=await jtCustomLabel(await MTJT.call('label-data',ref(o)),i,list.length);}else{var blob=await MTJT.call('label',Object.assign(ref(o),{type:1}),true);doc=await PDFLib.PDFDocument.load(await blob.arrayBuffer());}var pages=await merged.copyPages(doc,doc.getPageIndices());pages.forEach(function(p){merged.addPage(p);});out.push({id:o.OrderID,ok:true,text:'พร้อมพิมพ์'});}
   else {await MTJT.call(type==='printed'?'mark-printed':type,Object.assign(ref(o),type==='cancel'?{environment:'production'}:type==='printed'?{printed:true}:{}));out.push({id:o.OrderID,ok:true,text:'สำเร็จ'});}
  }catch(e){out.push({id:o.OrderID,ok:false,text:e.message});if(!MTJT.session){setLogged(false);break;}}
  setProgress({done:i+1,total:list.length});}
  if(merged&&merged.getPageCount()){setPdfUrl(URL.createObjectURL(new Blob([await merged.save()],{type:'application/pdf'})));}
  setResults(out);setProgress(null);setSelected({});setMessage('สำเร็จ '+out.filter(function(r){return r.ok;}).length+' / '+list.length+' รายการ');await reload();
 }
 function download(blob,name){var u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(function(){URL.revokeObjectURL(u);},60000);}
 function exportCSV(){var list=picked.length?picked:filtered;var cells=[['ที่มา','วันที่','ออเดอร์','ลูกค้า','เบอร์โทร','ราคา','COD','เลขพัสดุ','สถานะ','สถานะ J&T','รายละเอียดล่าสุด','พนักงาน','สินค้า']].concat(list.map(function(o){return[o._table,o.Timestamp,o.OrderID,o.Name,o.MobileNo,o.SalePrice,o.COD,o.TrackingNo,(stages.find(function(s){return s[0]===jtStage(o);})||[])[1],o.FlashStatus,o.FlashDetail,o.SalesPerson,o.Remark];}));var csv='\ufeff'+cells.map(function(row){return row.map(function(v){var s=String(v==null?'':v);if(/^[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}).join(',');}).join('\r\n');download(new Blob([csv],{type:'text/csv;charset=utf-8'}),'jnt-orders.csv');}
 function modal(title,content,onClose){return h('div',{role:'dialog','aria-label':title,style:{position:'fixed',inset:0,zIndex:9999,background:'rgba(15,23,42,.5)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}},h('div',{style:{background:'#fff',padding:24,borderRadius:14,width:'95%',maxWidth:1000,maxHeight:'90vh',overflow:'auto'}},h('div',{style:{display:'flex',justifyContent:'space-between',marginBottom:16}},h('h3',null,title),button('ปิด',onClose,busy)),content));}
 var title=h('h2',{style:{color:'#b91c1c',fontSize:20,margin:'0 0 14px'}},'จัดส่ง J&T Express');
 if(!logged)return h('section',{style:box},title,h('p',null,'กรุณาเข้าสู่ CRM อีกครั้งเพื่อเริ่มใช้การเข้าสู่ระบบครั้งเดียว จากนั้นเปิด J&T ได้ทันที'),h('button',{style:btn,onClick:function(){localStorage.removeItem('ps_session');localStorage.removeItem('ps_user');location.reload();}},'กลับไปเข้าสู่ CRM'));
 return h('div',null,title,
 h('div',{style:Object.assign({},box,{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'})},
 button('☑ เลือกทั้งหมด',function(){toggle(filtered);},!filtered.length),
 canWrite&&button('📦 สร้างเลขพัสดุ ('+creatable.length+')',function(){ask('create',creatable);},!creatable.length||!shop,'#b45309'),
 button('📋 รายการยังไม่พิมพ์',function(){setStage('created');setScan('ALL');}),
 button('🖨️ พิมพ์ใบปะหน้า ('+printable.length+')',function(){run(function(){return batch('label',printable);});},!printable.length,'#0284c7'),
 canWrite&&button('✓ ปริ้นแล้ว',function(){ask('printed',printable);},!printable.length,'#059669'),
 canWrite&&button('🗑 ยกเลิกพัสดุ',function(){ask('cancel',picked.filter(function(o){return o._jt&&!o._jt.deleted_at&&o._jt.state!=='cancelled';}));},!picked.some(function(o){return o._jt&&!o._jt.deleted_at&&o._jt.state!=='cancelled';}),'#dc2626'),
 canWrite&&button('🗑 ลบรายการ',function(){ask('delete',picked.filter(function(o){return o._jt&&o._jt.state==='cancelled'&&!o._jt.deleted_at;}));},!picked.some(function(o){return o._jt&&o._jt.state==='cancelled'&&!o._jt.deleted_at;}),'#dc2626'),
 canWrite&&stage==='deleted'&&button('คืนรายการ',function(){ask('restore',picked);},!picked.length),
 button('✕ ล้างที่เลือก',function(){setSelected({});},!picked.length),
 h('select',{'aria-label':'โหลดข้อมูลอัตโนมัติ',style:inp,value:auto,onChange:function(e){setAuto(e.target.value);}},['0','1','3','5','10','30'].map(function(v){return h('option',{key:v,value:v},v==='0'?'ปิด Auto':'โหลดข้อมูลทุก '+v+' นาที');})),
 h('select',{'aria-label':'ประเภทออเดอร์',style:inp,value:source,onChange:function(e){setSource(e.target.value);}},h('option',{value:'ALL'},'ทั้งหมด'),h('option',{value:'orders'},'📋 Order'),h('option',{value:'upsell'},'🔥 Upsell')),
 h('input',{'aria-label':'ค้นหา',style:inp,placeholder:'🔍 ค้นหา...',value:query,onChange:function(e){setQuery(e.target.value);}}),
 h('input',{'aria-label':'ค้นหาเบอร์โทร',style:inp,placeholder:'📱 ค้นหาเลขพัสดุจากเบอร์...',value:phone,onChange:function(e){setPhone(e.target.value.replace(/[^0-9]/g,''));}}),
 act('🔄 ซิงค์ J&T',function(){return batch('tracking',trackable);},!trackable.length,'#2563eb'),act('📄 ใบ J&T ทางการ',function(){return batch('official-label',printable);},!printable.length),act('โหลดข้อมูลใหม่',reload)),
 h('div',{style:Object.assign({},box,{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'})},h('strong',null,shop?'ร้าน: '+shop.name:'⚠️ ยังไม่ได้ตั้งค่าร้านเริ่มต้น'),shop&&h('span',{style:{fontSize:12,color:'#64748b'}},shop.customerCode+' · '+shop.sender.sender_name),h('label',null,'น้ำหนัก (กก.) ',h('input',{type:'number',min:0.001,max:100,step:0.001,style:Object.assign({},inp,{width:90}),value:weight,disabled:busy,onChange:function(e){setWeight(e.target.value);}})),h('label',null,'ตั้งแต่ ',h('input',{type:'date',style:inp,value:dateFrom,onChange:function(e){setDateFrom(e.target.value);}})),h('label',null,'ถึง ',h('input',{type:'date',style:inp,value:dateTo,onChange:function(e){setDateTo(e.target.value);}})),canManage&&h('details',{style:{width:'100%'}},h('summary',{style:{cursor:'pointer',fontWeight:600}},'⚙️ ตั้งค่าร้าน (เฉพาะแอดมิน)'),h(JtShopSettings,{config:config,onSaved:reload}))),
 message&&h('div',{role:'status',style:Object.assign({},box,{color:'#9a3412',background:'#fff7ed'})},message),
 progress&&h('div',{role:'status',style:box},'กำลังทำรายการ '+progress.done+' / '+progress.total,h('progress',{value:progress.done,max:progress.total,style:{width:'100%'}})),
 h('div',{style:{display:'flex',borderBottom:'2px solid #e2e8f0',marginBottom:10,flexWrap:'wrap'}},stages.map(function(s){var count=base.filter(function(o){return s[0]==='ALL'?jtStage(o)!=='deleted':jtStage(o)===s[0];}).length;return h('button',{key:s[0],disabled:busy,onClick:function(){setStage(s[0]);setScan('ALL');},style:{padding:'10px 20px',border:'none',borderBottom:stage===s[0]?'3px solid '+s[2]:'3px solid transparent',background:stage===s[0]?'#fff':'transparent',color:s[2],fontWeight:700,cursor:'pointer',fontFamily:'inherit'}},s[1]+' '+count);})),
 h('div',{style:{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}},act('📥 Export CSV ('+(picked.length||filtered.length)+')',exportCSV,!filtered.length),scans.map(function(s){return h('button',{key:s[0],style:Object.assign({},btn,{background:scan===s[0]?'#eff6ff':'#fff',color:scan===s[0]?'#2563eb':'#64748b'}),disabled:busy,onClick:function(){setScan(s[0]);setStage('ALL');}},s[1]+' '+base.filter(function(o){return !!o._jt&&!o._jt.deleted_at&&o._jt.state!=='cancelled'&&(s[0]==='ALL'||jtScanGroup(o)===s[0]);}).length);})),
 h('div',{style:{display:'flex',gap:8,marginBottom:8}},button('☑ เลือกหน้านี้ ('+shown.length+')',function(){toggle(shown);},!shown.length),h('span',{style:{fontSize:12,padding:8}},'เลือก '+picked.length+' รายการ')),
 h('div',{style:Object.assign({},box,{padding:0,overflowX:'auto'})},h('table',{style:{width:'100%',borderCollapse:'collapse',fontSize:12,whiteSpace:'nowrap'}},
 h('thead',null,h('tr',{style:{background:'#f8fafc',color:'#64748b'}},['เลือก','ที่มา','วันที่ / เวลา','ลูกค้า','เบอร์โทรศัพท์','ราคา','ประเภท','เลข Tracking','สถานะ','สถานะ J&T','รายละเอียดล่าสุด','พนักงาน','จัดการ'].map(function(label){return h('th',{key:label,style:{padding:'12px 10px',textAlign:'left',borderBottom:'1px solid #e2e8f0'}},label);}))),
 h('tbody',null,!shown.length?h('tr',null,h('td',{colSpan:13,style:{textAlign:'center',padding:36,color:'#94a3b8'}},loaded?'ไม่พบรายการ':'กำลังโหลดข้อมูล…')):shown.map(function(o){var r=o._jt,status=stages.find(function(s){return s[0]===jtStage(o);});function td(value,style){return h('td',{style:Object.assign({padding:'10px',borderBottom:'1px solid #f1f5f9'},style||{})},value);}return h('tr',{key:jtRowKey(o),style:{background:selected[jtRowKey(o)]?'#eff6ff':'#fff'}},td(h('input',{type:'checkbox','aria-label':'เลือก '+o.OrderID,checked:!!selected[jtRowKey(o)],disabled:busy,onChange:function(){toggle([o]);}})),td(o._table==='upsell'?'🔥 Upsell':'📋 Order'),td(String(o.Timestamp||'').replace('T',' ').slice(0,19)),td(button(o.Name||o.OrderID,function(){setDetail(o);})),td(o.MobileNo||'—'),td(Number(o.SalePrice||0).toLocaleString()),td(Number(o.COD)>0?'COD ฿'+Number(o.COD).toLocaleString():'โอน'),td(o.TrackingNo?h('strong',{style:{color:'#2563eb'}},o.TrackingNo):'—'),td(h('span',{style:{color:status[2],fontWeight:700}},status[1])),td(o.FlashStatus||'—'),td(o.FlashDetail||'—',{maxWidth:260,whiteSpace:'normal'}),td(o.SalesPerson||'—'),td(h('div',{style:{display:'flex',gap:4}},r?act('📜 ประวัติ',async function(){var res=await MTJT.call('tracking',ref(o));setHistory({id:o.OrderID,data:res.data});await load();},r.state==='cancelled'):canWrite&&button('สร้างเลข',function(){ask('create',[o]);},!shop||!['รอส่ง','pending'].includes(o.Status)),r&&r.state==='created'&&act('🖨️',function(){return batch('label',[o]);}))));})))),
 h('div',{style:{display:'flex',gap:8,alignItems:'center',justifyContent:'flex-end',marginTop:10}},h('span',null,'แสดง:'),[100,200,500].map(function(size){return button(String(size),function(){setPageSize(size);setPage(1);},pageSize===size);}),button('ก่อนหน้า',function(){setPage(currentPage-1);},currentPage<=1),h('span',null,currentPage+' / '+totalPages+' · '+filtered.length+' รายการ'),button('ถัดไป',function(){setPage(currentPage+1);},currentPage>=totalPages)),
 results.length>0&&h('details',{style:Object.assign({},box,{marginTop:12}),open:results.some(function(r){return !r.ok;})},h('summary',null,'ผลการทำรายการล่าสุด ('+results.length+')'),results.map(function(r,i){return h('p',{key:i,style:{padding:5,color:r.ok?'#059669':'#dc2626'}},(r.ok?'✓ ':'✕ ')+r.id+' · '+r.text);})),
 confirm&&modal('ยืนยันทำรายการ J&T',h('div',null,h('p',null,({create:'สร้างเลขพัสดุจริง',cancel:'ยกเลิกพัสดุจริง',printed:'ทำเครื่องหมายว่าปริ้นแล้ว',delete:'ลบออกจากรายการจัดส่ง (ยังเก็บประวัติและคืนรายการได้)',restore:'คืนรายการที่ลบ'})[confirm.type]+' '+confirm.items.length+' รายการ'),confirm.type==='create'&&h('p',{style:{margin:'12px 0'}},'ร้าน '+(shop?shop.name:'ยังไม่ได้ตั้งค่า')+' · น้ำหนัก '+weight+' กก. ต่อพัสดุ'),h('div',{style:{maxHeight:180,overflow:'auto',margin:'10px 0'}},confirm.items.map(function(o){return h('p',{key:jtRowKey(o)},o.OrderID+' · '+(o.Name||'')+' · COD '+Number(o.COD||0));})),button('ยืนยัน',function(){var task=confirm;setConfirm(null);run(function(){return batch(task.type,task.items);});},false,'#b91c1c')),function(){setConfirm(null);}),
 pdfUrl&&modal('ใบปะหน้า J&T — เปิด PDF แล้วสั่งพิมพ์',h('div',null,h('a',{href:pdfUrl,target:'_blank',rel:'noopener',style:{display:'inline-block',padding:10}},'เปิด PDF ในแท็บใหม่ / พิมพ์'),h('a',{href:pdfUrl,download:'jnt-labels.pdf',style:{padding:10}},'ดาวน์โหลด PDF'),h('iframe',{title:'ใบปะหน้า J&T',src:pdfUrl,style:{width:'100%',height:'60vh',border:'1px solid #ddd'}}),h('p',null,'หลังพิมพ์สำเร็จ เลือกรายการแล้วกด “✓ ปริ้นแล้ว”')),function(){setPdfUrl('');}),
 detail&&modal('รายละเอียดออเดอร์ '+detail.OrderID,h('div',null,[['ลูกค้า',detail.Name],['โทร',detail.MobileNo],['ที่อยู่',[detail.Address,detail.SubDistrict,detail.District,detail.Province,detail.ZIP].filter(Boolean).join(' ')],['สินค้า',detail.Remark],['COD',detail.COD],['เลขพัสดุ',detail.TrackingNo]].map(function(v){return h('p',{key:v[0],style:{padding:'8px 0'}},h('strong',null,v[0]+': '),v[1]||'—');})),function(){setDetail(null);}),
 history&&modal('ประวัติ J&T '+history.id,h('div',null,(function(){var d=history.data,traces=Array.isArray(d)?d:d&&(d.tracesList||d.details||d.traces);return !Array.isArray(traces)||!traces.length?h('p',null,'ยังไม่มีประวัติการสแกน'):traces.map(function(t,i){return h('div',{key:i,style:{padding:12,borderBottom:'1px solid #eee'}},h('strong',null,t.scantype||t.scanType||'ไม่ระบุสถานะ'),h('p',null,[t.scantime||t.scanTime,t.scanNetwork||t.entrySiteName,t.city].filter(Boolean).join(' · ')));});})()),function(){setHistory(null);})
 );
}

function JtShopSettings(props){
 var h=React.createElement,c=props.config;
 var st=React.useState(null),draft=st[0],setDraft=st[1];
 var bt=React.useState(false),saving=bt[0],setSaving=bt[1];
 var mt=React.useState(''),message=mt[0],setMessage=mt[1];
 if(!c.isAdmin)return null;
 var input={padding:9,border:'1px solid #cbd5e1',borderRadius:7,width:'100%',fontFamily:'inherit'};
 var button={padding:'9px 14px',border:'1px solid #cbd5e1',borderRadius:8,background:'#fff',cursor:'pointer',fontFamily:'inherit'};
 function update(id,key,value){setDraft(function(d){return Object.assign({},d,{shops:d.shops.map(function(s){if(s.id!==id)return s;var next=Object.assign({},s);if(key.indexOf('sender_')===0)next.sender=Object.assign({},s.sender,{[key]:value});else next[key]=value;return next;})});});}
 function field(s,label,key){return h('label',{key:key},label,h('input',{style:input,disabled:saving,value:key.indexOf('sender_')===0?s.sender[key]||'':s[key]||'',onChange:function(e){update(s.id,key,e.target.value);}}));}
 async function save(){setSaving(true);setMessage('');try{await MTJT.call('shops-save',draft);setDraft(null);await props.onSaved();setMessage('บันทึกร้านเริ่มต้นแล้ว ทุกคนจะใช้ร้านนี้');}catch(e){setMessage(e.message);}finally{setSaving(false);}}
 return h('div',{style:{border:'1px solid #e2e8f0',padding:14,borderRadius:10,marginBottom:14}},
 h('strong',null,'ตั้งค่าร้านส่วนกลาง (เฉพาะแอดมิน)'),
 message&&h('p',{role:'status'},message),
 !draft?h('button',{style:Object.assign({},button,{marginLeft:12}),onClick:function(){setDraft(JSON.parse(JSON.stringify(c)));setMessage('');}},'จัดการร้าน / เปลี่ยนร้านเริ่มต้น'):
 h('div',null,
 h('p',null,'เลือกร้านเริ่มต้นที่ทุกคนต้องใช้ ข้อมูลจะมีผลหลังบันทึก'),
 h('label',null,'ร้านเริ่มต้น',h('select',{style:input,disabled:saving,value:draft.defaultShopId,onChange:function(e){setDraft(Object.assign({},draft,{defaultShopId:e.target.value}));}},h('option',{value:'',disabled:true},'เลือกร้านเริ่มต้น'),draft.shops.map(function(s){return h('option',{key:s.id,value:s.id},s.name||'ร้านใหม่');}))),
 draft.shops.map(function(s){return h('fieldset',{key:s.id,disabled:saving,style:{margin:'14px 0',padding:14,border:'1px solid #ddd',borderRadius:8}},h('legend',null,s.name||'ร้านใหม่'),
 h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12}},
 field(s,'ชื่อร้าน','name'),h('label',null,'บัญชี J&T',h('select',{style:input,value:s.customerCode,onChange:function(e){update(s.id,'customerCode',e.target.value);}},['VIP8530310123','VIP8530310124'].map(function(v){return h('option',{key:v,value:v},v);}))),
 field(s,'น้ำหนักเริ่มต้น (กก.)','weight'),
 [['ชื่อผู้ส่ง','sender_name'],['เบอร์โทร','sender_phone'],['ที่อยู่','sender_address'],['จังหวัด','sender_province'],['อำเภอ / เขต','sender_district'],['ตำบล / แขวง','sender_subdistrict'],['รหัสไปรษณีย์','sender_postal']].map(function(pair){return field(s,pair[0],pair[1]);})));}),
 h('div',{style:{display:'flex',gap:8}},
 h('button',{style:button,disabled:saving||draft.shops.length>=30,onClick:function(){var id=crypto.randomUUID();setDraft(Object.assign({},draft,{shops:draft.shops.concat([{id:id,name:'',customerCode:'VIP8530310123',weight:1,sender:{}}])}));}},'เพิ่มร้าน'),
 h('button',{style:Object.assign({},button,{background:'#c91c29',color:'#fff'}),disabled:saving,onClick:save},saving?'กำลังบันทึก…':'บันทึกให้ทุกคนใช้'),
 h('button',{style:button,disabled:saving,onClick:function(){setDraft(null);setMessage('');}},'ยกเลิก'))));
}

function cut(ctx,t,max){t=t||"";if(ctx.measureText(t).width<=max)return t;while(t.length&&ctx.measureText(t+"…").width>max)t=t.slice(0,-1);return t+"…";}
function drawLbl(ctx,d,idx,total,W,H,now){ctx.fillStyle="#fff";ctx.fillRect(0,0,W,H);ctx.strokeStyle="#000";ctx.lineWidth=4;ctx.strokeRect(2,2,W-4,H-4);ctx.lineWidth=2;ctx.fillStyle="#000";ctx.textBaseline="alphabetic";
ctx.textAlign="left";if(d.carrier==="J&T EXPRESS"){ctx.font="900 42px Arial";ctx.fillText("J&T EXPRESS",18,60);if(d.sc){ctx.font="900 45px Arial";ctx.fillText(cut(ctx,String(d.sc),490),400,60);}ctx.textAlign="right";ctx.font="900 48px Arial";ctx.fillText(d.expressType||"",W-18,60);ctx.textAlign="left";}else{ctx.font="italic 900 40px Arial";ctx.fillText("FLASH",18,56);ctx.font="900 14px Arial";ctx.fillText("EXPRESS",150,56);var sc=String(d.sc||"").split("-");var pre=sc[0]||"",mid=sc[1]||"",suf=sc.slice(2).join("-");var sx=320,sy=60;ctx.textAlign="left";ctx.fillStyle="#000";ctx.font="900 38px Arial";ctx.fillText(pre,sx,sy);sx+=ctx.measureText(pre).width+10;ctx.fillText("-",sx,sy);sx+=ctx.measureText("-").width+12;ctx.font="900 64px Arial";ctx.fillText(mid,sx,sy+2);sx+=ctx.measureText(mid).width+12;ctx.font="900 38px Arial";ctx.fillText("-",sx,sy);sx+=ctx.measureText("-").width+10;ctx.fillText(suf,sx,sy);}
ctx.beginPath();ctx.moveTo(0,88);ctx.lineTo(W,88);ctx.stroke();
try{var bcv=document.createElement("canvas");JsBarcode(bcv,d.pno||" ",{format:"CODE128",width:2,height:80,displayValue:false,margin:0});ctx.drawImage(bcv,60,96,W-120,98);}catch(e){}ctx.beginPath();ctx.moveTo(0,200);ctx.lineTo(W,200);ctx.stroke();
ctx.fillStyle="#f6f6f6";ctx.fillRect(2,200,W-4,46);ctx.fillStyle="#000";ctx.textAlign="center";ctx.font="900 30px 'Sarabun',Tahoma,sans-serif";ctx.fillText(d.pno||"",W/2,234);ctx.beginPath();ctx.moveTo(0,246);ctx.lineTo(W,246);ctx.stroke();
ctx.fillStyle="#222";ctx.fillRect(2,246,W-4,44);ctx.fillStyle="#fff";ctx.textAlign="left";ctx.font="700 24px 'Sarabun',Tahoma,sans-serif";ctx.fillText("DST   "+(d.dst2||((d.dist||"")+" — "+(d.prov||""))),20,277);
if(d.zone){ctx.fillStyle="#000";ctx.fillRect(712,300,272,200);var zl=String(d.zone).length;ctx.fillStyle="#fff";ctx.textAlign="center";ctx.font="900 "+(zl<=3?96:zl<=5?64:44)+"px Arial";ctx.fillText(String(d.zone),848,432);}
ctx.fillStyle="#333";ctx.textAlign="left";ctx.font="16px 'Sarabun',Tahoma,sans-serif";ctx.fillText(cut(ctx,"ผู้ส่ง "+(d.sname||"")+" ("+(d.sphone||"")+")",660),20,322);ctx.fillStyle="#666";ctx.font="15px 'Sarabun',Tahoma,sans-serif";ctx.fillText(cut(ctx,d.saddr,660),20,346);
ctx.fillStyle="#000";ctx.font="800 25px 'Sarabun',Tahoma,sans-serif";ctx.fillText(cut(ctx,"ผู้รับ "+(d.rname||""),660),20,392);ctx.font="900 32px 'Sarabun',Tahoma,sans-serif";ctx.fillText(d.rphone||"",20,430);ctx.font="700 22px 'Sarabun',Tahoma,sans-serif";ctx.fillText(cut(ctx,d.raddr1,660),20,464);ctx.fillText(cut(ctx,d.raddr2,660),20,492);ctx.fillText(cut(ctx,d.raddr3,660),20,520);
if(d.cod>0){ctx.fillStyle="#000";ctx.fillRect(20,585,108,46);ctx.fillStyle="#fff";ctx.textAlign="left";ctx.font="900 24px 'Sarabun',Tahoma,sans-serif";ctx.fillText("COD",36,617);ctx.fillStyle="#000";ctx.font="900 26px 'Sarabun',Tahoma,sans-serif";ctx.fillText("เก็บเงิน COD "+Number(d.cod).toLocaleString(),142,617);}
if(d.item){ctx.fillStyle="#000";ctx.textAlign="left";ctx.font="800 30px 'Sarabun',Tahoma,sans-serif";ctx.fillText(cut(ctx,"สินค้า: "+d.item,660),20,d.carrier==="J&T EXPRESS"?660:675);}
if(d.carrier==="J&T EXPRESS"){ctx.fillStyle="#000";ctx.textAlign="left";ctx.font="800 20px 'Sarabun',Tahoma,sans-serif";var meta="No. "+(d.orderNo||"")+(d.weight?"   W:"+d.weight+"KG":"")+(d.quantity?"   จำนวน "+d.quantity:"")+(d.secondaryCode?"   "+d.secondaryCode:"")+(d.remark?"   หมายเหตุ: "+d.remark:"");ctx.fillText(cut(ctx,meta,960),20,692);}
try{var q=qrcode(0,"M");q.addData(d.pno||" ");q.make();var n=q.getModuleCount();var qs=172,qx=W-198,qy=508,cell=qs/n;ctx.fillStyle="#000";for(var r=0;r<n;r++)for(var c=0;c<n;c++)if(q.isDark(r,c))ctx.fillRect(qx+c*cell,qy+r*cell,Math.ceil(cell),Math.ceil(cell));}catch(e){}
ctx.beginPath();ctx.moveTo(0,705);ctx.lineTo(W,705);ctx.stroke();ctx.fillStyle="#777";ctx.font="14px 'Sarabun',Tahoma,sans-serif";ctx.textAlign="left";ctx.fillText(now+"  พิมพ์ครั้งที่: 1",16,730);ctx.textAlign="center";ctx.fillText((idx+1)+"/"+total,W/2,730);ctx.textAlign="right";ctx.fillText("THE MT",W-16,730);ctx.textAlign="left";}
async function jtCustomLabel(data,index,total){
 if(typeof JsBarcode==='undefined'||typeof qrcode==='undefined')throw new Error('โหลดเครื่องมือบาร์โค้ดไม่สำเร็จ กรุณารีเฟรช');
 await document.fonts.load("900 30px Sarabun");await document.fonts.load("800 25px Sarabun");await document.fonts.load("700 22px Sarabun");await document.fonts.load("400 16px Sarabun");await document.fonts.ready;
 var s=data.sender,r=data.receiver,cv=document.createElement('canvas');cv.width=1000;cv.height=750;
 var d={carrier:'J&T EXPRESS',sc:data.sortingCode||'',zone:data.lineCode||'',secondaryCode:data.secondaryCode||'',expressType:'EZ',orderNo:data.orderNo,weight:data.weight,quantity:data.quantity,remark:data.remark,pno:data.billCode,dist:r.city,prov:r.prov,sname:s.name,sphone:s.mobile,saddr:[s.address,s.area,s.city,s.prov,s.postCode].filter(Boolean).join(' '),rname:r.name,rphone:(r.mobile||'').replace(/^(\d{3})\d{4}(\d{3})$/,'$1****$2'),raddr1:r.address,raddr2:[r.area,r.city].filter(Boolean).join(', '),raddr3:[r.prov,r.postCode].filter(Boolean).join(' '),cod:data.cod,item:data.remark};
 drawLbl(cv.getContext('2d'),d,index,total,1000,750,new Date().toLocaleString('en-GB',{timeZone:'Asia/Bangkok',day:'numeric',month:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'}));
 var doc=await PDFLib.PDFDocument.create(),img=await doc.embedPng(cv.toDataURL('image/png'));doc.addPage([100*72/25.4,75*72/25.4]).drawImage(img,{x:0,y:0,width:100*72/25.4,height:75*72/25.4});return doc;
}
