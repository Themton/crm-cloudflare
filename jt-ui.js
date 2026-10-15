/* J&T CRM panel. No carrier secrets are stored in the browser. */
var MTJT = {
 session: '',
 async call(action, body, pdf) {
  var res = await fetch(SUPABASE_URL.replace(/\/$/,'')+'/jt-api/'+action,{
   method:'POST',headers:{'Content-Type':'application/json',apikey:SUPABASE_KEY,'x-jt-session':this.session},
   body:JSON.stringify(body||{}),signal:AbortSignal.timeout(45000)
  });
  if(pdf && res.ok && (res.headers.get('Content-Type')||'').includes('application/pdf'))return res.blob();
  var data=await res.json();
  if(!res.ok){if(res.status===401)this.session='';throw new Error(data.error||data.msg||'J&T ทำรายการไม่สำเร็จ');}
  return data;
 },
 async guard(order){return (await this.call('guard',{table:order._table||'orders',orderId:order.OrderID})).reserved;},
 async guardTracking(number){return (await this.call('guard',{trackingNo:number})).reserved;}
};
function ShippingPage(props) {
 var h=React.createElement,carrier=props.carrier==='jnt'?'jnt':'flash';
 var filtered=Object.assign({},props,{
  orders:(props.orders||[]).filter(function(o){return carrier==='jnt'?o.Carrier==='jnt':o.Carrier!=='jnt';}),
  upsellOrders:(props.upsellOrders||[]).filter(function(o){return carrier==='jnt'?o.Carrier==='jnt':o.Carrier!=='jnt';})
 });
 return carrier==='jnt'?h(JtShippingPanel,filtered):h('div',null,
  h('h2',{style:{color:'#b45309',margin:'0 0 16px'}},'จัดส่ง Flash Express'),h(FlashShippingPage,filtered));
}
function JtShippingPanel(props) {
 var h=React.createElement;
 var s=React.useState(!!MTJT.session),logged=s[0],setLogged=s[1];
 var a=React.useState([]),rows=a[0],setRows=a[1];
 var b=React.useState(false),busy=b[0],setBusy=b[1];
 var c=React.useState(''),message=c[0],setMessage=c[1];
 var d=React.useState(''),query=d[0],setQuery=d[1];
 var e=React.useState(''),email=e[0],setEmail=e[1];
 var f=React.useState(''),password=f[0],setPassword=f[1];
 var configState=React.useState(null),config=configState[0],setConfig=configState[1];
 var shop=config&&config.shops.find(function(s){return s.id===config.defaultShopId;});
 var vip=shop?shop.customerCode:'',sender=shop?shop.sender:{};
 var j=React.useState('1'),weight=j[0],setWeight=j[1];
 var m=React.useState(null),preview=m[0],setPreview=m[1];
 var n=React.useState(false),loaded=n[0],setLoaded=n[1];
 var busyRef=React.useRef(false);
 var btn={padding:'8px 12px',border:'1px solid #cbd5e1',borderRadius:8,background:'#fff',cursor:'pointer',fontFamily:'inherit'};
 var input={padding:'9px',width:'100%',border:'1px solid #cbd5e1',borderRadius:7,fontFamily:'inherit'};
 async function load(){var cfg=await MTJT.call('shops');setConfig(cfg);var selected=cfg.shops.find(function(s){return s.id===cfg.defaultShopId;});if(selected)setWeight(String(selected.weight));var all=[],offset=0;for(;;){var r=await MTJT.call('list',{offset:offset});all=all.concat(r.rows);if(r.rows.length<200)break;offset+=200;}setRows(all);setLoaded(true);}
 async function run(fn){if(busyRef.current)return;busyRef.current=true;setBusy(true);setMessage('');try{await fn();}catch(err){setMessage(err.message);if(!MTJT.session)setLogged(false);}finally{busyRef.current=false;setBusy(false);}}
 React.useEffect(function(){if(logged)run(load);},[logged]);
 var all=(props.orders||[]).map(function(o){return Object.assign({},o,{_table:'orders'});}).concat((props.upsellOrders||[]).map(function(o){return Object.assign({},o,{_table:'upsell'});}));
 var reserved=new Set(rows.map(function(r){return r.order_table+':'+r.order_id;}));
 var matches=function(o){return !query||[o.OrderID,o.Name,o.MobileNo,o.TrackingNo].join(' ').toLowerCase().includes(query.toLowerCase());};
 var pending=all.filter(function(o){return o.Status==='รอส่ง'&&!o.TrackingNo&&o.Carrier==='jnt'&&!reserved.has(o._table+':'+o.OrderID)&&matches(o);});
 var known={};all.forEach(function(o){known[o._table+':'+o.OrderID]=o;});
 var visible=rows.filter(function(r){var o=known[r.order_table+':'+r.order_id];return !query||[r.order_id,r.bill_code,r.customer_code,o&&o.Name,o&&o.MobileNo].join(' ').toLowerCase().includes(query.toLowerCase());});
 function action(label,fn,disabled){return h('button',{style:btn,disabled:busy||disabled,onClick:function(){run(fn);}},label);}
 function ref(row){return {table:row.order_table,orderId:row.order_id};}
 async function reload(){await load();if(props.onRefresh)await props.onRefresh();}
 function exportCSV(){
  var cells=[['ขนส่ง','ตาราง','ออเดอร์','เลขพัสดุ','บัญชี J&T','สถานะ','รายละเอียด','เวลาสแกน']].concat(visible.map(function(r){return ['J&T',r.order_table,r.order_id,r.bill_code,r.customer_code,r.carrier_status||r.state,r.detail,r.scan_at||''];}));
  var csv='\ufeff'+cells.map(function(row){return row.map(function(v){var x=String(v||'');if(/^[=+@-]/.test(x))x="'"+x;return '"'+x.replace(/"/g,'""')+'"';}).join(',');}).join('\r\n');
  download(new Blob([csv],{type:'text/csv;charset=utf-8'}),'jnt-tracking.csv');
 }
 function download(blob,name){var url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(function(){URL.revokeObjectURL(url);},60000);}
 return h('section',{style:{background:'#fff',padding:20,borderRadius:14,border:'1px solid #e2e8f0'}},
  h('h2',{style:{color:'#bf1725',marginBottom:8}},'J&T Express'),
  h('p',{style:{color:'#64748b',fontSize:13,marginBottom:16}},'สร้างพัสดุจากออเดอร์ CRM · ใบปะหน้า PDF จาก J&T · ตรวจสถานะและยกเลิก'),
  message&&h('div',{role:'status',style:{whiteSpace:'pre-wrap',padding:12,marginBottom:12,background:'#fff7ed',color:'#9a3412',borderRadius:8}},message),
  !logged?h('form',{onSubmit:function(event){event.preventDefault();run(async function(){var r=await MTJT.call('login',{email:email,password:password});MTJT.session=r.session;setPassword('');setLogged(true);});},style:{maxWidth:400,display:'grid',gap:12}},
   h('p',null,'ยืนยันสิทธิ์ด้วยบัญชี CRM สำหรับการใช้ API J&T'),
   h('input',{style:input,'aria-label':'บัญชี CRM',placeholder:'อีเมลบัญชี CRM',autoComplete:'username',value:email,onChange:function(e){setEmail(e.target.value);}}),
   h('input',{style:input,'aria-label':'รหัสผ่าน CRM',placeholder:'รหัสผ่าน',type:'password',autoComplete:'current-password',value:password,onChange:function(e){setPassword(e.target.value);}}),
   h('button',{style:btn,disabled:busy,type:'submit'},busy?'กำลังตรวจสอบ…':'เข้าสู่ระบบ J&T')
  ):h(React.Fragment,null,
   h('div',{style:{display:'flex',gap:8,marginBottom:16}},action('โหลดข้อมูลใหม่',reload),action('ส่งออกเลขพัสดุ CSV',exportCSV),action('ออกจาก J&T',async function(){MTJT.session='';setLogged(false);setRows([]);setLoaded(false);})),
   config&&h(JtShopSettings,{config:config,onSaved:reload}),
   h('div',{style:{padding:14,background:'#f8fafc',borderRadius:10,marginBottom:16}},
    h('strong',null,shop?'ร้านที่ทุกคนใช้งาน: '+shop.name:'ยังไม่ได้ตั้งค่าร้านเริ่มต้น'),
    shop?h('p',null,'บัญชี '+vip+' · ผู้ส่ง '+sender.sender_name+' · '+sender.sender_phone+' · '+[sender.sender_address,sender.sender_subdistrict,sender.sender_district,sender.sender_province,sender.sender_postal].join(' ')):h('p',null,'ให้แอดมินเพิ่มร้านและเลือกร้านเริ่มต้นก่อนสร้างพัสดุ'),
    h('small',null,'ร้านและข้อมูลผู้ส่งกำหนดโดยแอดมิน ใช้ร่วมกันทุกเครื่อง')),
   h('div',{style:{display:'flex',flexWrap:'wrap',gap:12,marginBottom:16}},
    h('label',null,'น้ำหนักต่อพัสดุ (กก.)',h('input',{style:input,type:'number',min:'0.001',max:'100',step:'0.001',value:weight,disabled:busy,onChange:function(e){setWeight(e.target.value);}})),
    h('label',{style:{flex:1,minWidth:200}},'ค้นหา',h('input',{style:input,value:query,placeholder:'ออเดอร์ / ชื่อ / เบอร์โทร / เลขพัสดุ',onChange:function(e){setQuery(e.target.value);}}))
   ),
   h('h3',{style:{margin:'16px 0'}},'ออเดอร์รอส่ง ('+pending.length+')'),
   h('p',{style:{fontSize:12,color:'#64748b'}},'แสดงออเดอร์ที่ CRM โหลดไว้ สูงสุด 100 รายการต่อการค้นหา'),
   !loaded?h('p',null,'กำลังโหลดข้อมูล J&T…'):h('div',{style:{overflowX:'auto'}},h('table',{style:{width:'100%',borderCollapse:'collapse'}},
    h('thead',null,h('tr',null,['ออเดอร์','ลูกค้า','จังหวัด','COD',''].map(function(t){return h('th',{key:t,style:{textAlign:'left',padding:10}},t);}))),
    h('tbody',null,pending.slice(0,100).map(function(o){return h('tr',{key:o._table+':'+o.OrderID,style:{borderTop:'1px solid #eee'}},
     h('td',{style:{padding:10}},o.OrderID,h('small',{style:{display:'block',color:'#64748b'}},o._table)),h('td',null,o.Name),h('td',null,o.Province),h('td',null,Number(o.COD||0).toLocaleString()),h('td',null,action('สร้างเลข J&T',async function(){
      if(!shop)throw new Error('กรุณาให้แอดมินตั้งค่าร้านเริ่มต้นก่อน');
      var summary='สร้างพัสดุ J&T จริง\n'+o.OrderID+' · '+o.Name+'\nบัญชี '+vip+'\nผู้ส่ง '+(sender.sender_name||'ยังไม่ตั้งค่า')+'\nน้ำหนัก '+weight+' กก. · COD '+Number(o.COD||0)+' บาท';
      if(!window.confirm(summary))return;
      try{var result=await MTJT.call('create',{table:o._table,orderId:o.OrderID,shopId:shop&&shop.id,shopRevision:config&&config.revision,weight:weight,environment:'production'});setMessage('สร้างเลขพัสดุแล้ว: '+result.billCode);}
      finally{await reload();}
     })));
    })))),
   h('h3',{style:{margin:'24px 0 12px'}},'พัสดุ J&T ('+visible.length+')'),
   h('div',{style:{overflowX:'auto'}},h('table',{style:{width:'100%',borderCollapse:'collapse'}},
    h('thead',null,h('tr',null,['ออเดอร์ / เลขพัสดุ','สถานะ','บัญชี','จัดการ'].map(function(t){return h('th',{key:t,style:{textAlign:'left',padding:10}},t);}))),
    h('tbody',null,visible.slice(0,200).map(function(row){return h('tr',{key:row.order_table+':'+row.order_id,style:{borderTop:'1px solid #eee'}},
     h('td',{style:{padding:10}},row.order_id,h('strong',{style:{display:'block',color:'#bf1725'}},row.bill_code||'ยังไม่ยืนยันเลขพัสดุ')),
     h('td',null,row.state==='unknown'?'ต้องตรวจสอบกับ J&T':row.carrier_status||row.state,h('small',{style:{display:'block',maxWidth:300}},row.detail)),
     h('td',null,row.customer_code),h('td',{style:{display:'flex',gap:5,flexWrap:'wrap',padding:10}},
      action('ตรวจสถานะ',async function(){var result=await MTJT.call('tracking',ref(row));setPreview({row:row,data:result.data});await reload();},row.state==='cancelled'),
      action('ใบปะหน้า PDF',async function(){var blob=await MTJT.call('label',Object.assign(ref(row),{type:1}),true);download(blob,'jnt-'+row.bill_code+'.pdf');},row.state!=='created'),
      action('ยกเลิก',async function(){var reason=window.prompt('เหตุผลยกเลิกพัสดุ J&T '+(row.bill_code||row.order_id));if(!reason||!reason.trim())return;if(!window.confirm('ยืนยันยกเลิกพัสดุนี้กับ J&T?'))return;await MTJT.call('cancel',Object.assign(ref(row),{reason:reason,environment:'production'}));await reload();setMessage('ยกเลิกพัสดุแล้ว');},row.state==='cancelled')
     ));
    })))),
   visible.length>200&&h('p',null,'แสดง 200 รายการแรก ใช้ช่องค้นหาเพื่อจำกัดรายการ หรือส่งออก CSV ทั้งหมด'),
   preview&&h('div',{style:{marginTop:16,padding:14,background:'#f8fafc'}},h('strong',null,'ประวัติ J&T '+preview.row.order_id),h('div',{style:{maxHeight:300,overflow:'auto',marginTop:12}},(function(){var data=preview.data;var traces=Array.isArray(data)?data:data&&(data.tracesList||data.details||data.traces);if(!Array.isArray(traces)||!traces.length)return h('p',null,'ยังไม่มีประวัติการสแกนพัสดุ');return traces.map(function(t,i){return h('div',{key:i,style:{padding:'10px 0',borderBottom:'1px solid #e2e8f0'}},h('strong',null,t.scantype||t.scanType||'ไม่ระบุสถานะ'),h('div',{style:{fontSize:12,color:'#64748b'}},[t.scantime||t.scanTime,t.scanNetwork||t.entrySiteName,t.city].filter(Boolean).join(' · ')));});})()),action('ปิดประวัติ',async function(){setPreview(null);})),
   busy&&h('p',{role:'status',style:{marginTop:12}},'กำลังทำรายการ…')
  )
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
