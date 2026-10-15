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
 var h=React.createElement, state=React.useState('flash'),carrier=state[0],setCarrier=state[1];
 return h('div',null,
  h('div',{style:{display:'flex',gap:8,marginBottom:16}},
   ['flash','jnt'].map(function(c){return h('button',{key:c,onClick:function(){setCarrier(c);},style:{padding:'12px 24px',border:'1px solid #ddd',borderRadius:10,background:carrier===c?(c==='jnt'?'#c91c29':'#f59e0b'):'#fff',color:carrier===c?'white':'#334155',fontWeight:700,cursor:'pointer'}},c==='jnt'?'J&T Express':'Flash Express');})),
  carrier==='jnt'?h(JtShippingPanel,props):h(FlashShippingPage,Object.assign({},props,{
   orders:(props.orders||[]).filter(function(o){return o.Carrier!=='jnt';}),
   upsellOrders:(props.upsellOrders||[]).filter(function(o){return o.Carrier!=='jnt';})
  })));
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
 var g=React.useState('VIP8530310123'),vip=g[0],setVip=g[1];
 var j=React.useState('1'),weight=j[0],setWeight=j[1];
 var k=React.useState(function(){try{return JSON.parse(localStorage.getItem('mt_jt_sender')||'{}');}catch(_){return {};}}),sender=k[0],setSender=k[1];
 var m=React.useState(null),preview=m[0],setPreview=m[1];
 var n=React.useState(false),loaded=n[0],setLoaded=n[1];
 var busyRef=React.useRef(false);
 var btn={padding:'8px 12px',border:'1px solid #cbd5e1',borderRadius:8,background:'#fff',cursor:'pointer',fontFamily:'inherit'};
 var input={padding:'9px',width:'100%',border:'1px solid #cbd5e1',borderRadius:7,fontFamily:'inherit'};
 async function load(){var all=[],offset=0;for(;;){var r=await MTJT.call('list',{offset:offset});all=all.concat(r.rows);if(r.rows.length<200)break;offset+=200;}setRows(all);setLoaded(true);}
 async function run(fn){if(busyRef.current)return;busyRef.current=true;setBusy(true);setMessage('');try{await fn();}catch(err){setMessage(err.message);if(!MTJT.session)setLogged(false);}finally{busyRef.current=false;setBusy(false);}}
 React.useEffect(function(){if(logged)run(load);},[logged]);
 function field(label,key){return h('label',{key:key,style:{fontSize:12}},label,h('input',{style:input,value:sender[key]||'',disabled:busy,onChange:function(event){var next=Object.assign({},sender);next[key]=event.target.value;setSender(next);}}));}
 var all=(props.orders||[]).map(function(o){return Object.assign({},o,{_table:'orders'});}).concat((props.upsellOrders||[]).map(function(o){return Object.assign({},o,{_table:'upsell'});}));
 var reserved=new Set(rows.map(function(r){return r.order_table+':'+r.order_id;}));
 var matches=function(o){return !query||[o.OrderID,o.Name,o.MobileNo,o.TrackingNo].join(' ').toLowerCase().includes(query.toLowerCase());};
 var pending=all.filter(function(o){return o.Status==='รอส่ง'&&!o.TrackingNo&&o.Carrier!=='jnt'&&!reserved.has(o._table+':'+o.OrderID)&&matches(o);});
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
   h('details',{style:{padding:14,background:'#f8fafc',borderRadius:10,marginBottom:16},open:!sender.sender_name},
    h('summary',{style:{cursor:'pointer',fontWeight:700}},'ตั้งค่าผู้ส่ง J&T'),
    h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginTop:12}},
     [['ชื่อผู้ส่ง','sender_name'],['เบอร์โทร','sender_phone'],['ที่อยู่','sender_address'],['จังหวัด','sender_province'],['อำเภอ / เขต','sender_district'],['ตำบล / แขวง','sender_subdistrict'],['รหัสไปรษณีย์','sender_postal']].map(function(pair){return field(pair[0],pair[1]);})),
    action('บันทึกผู้ส่งในเครื่องนี้',async function(){localStorage.setItem('mt_jt_sender',JSON.stringify(sender));setMessage('บันทึกข้อมูลผู้ส่งแล้ว');})
   ),
   h('div',{style:{display:'flex',flexWrap:'wrap',gap:12,marginBottom:16}},
    h('label',null,'บัญชี J&T',h('select',{style:input,value:vip,disabled:busy,onChange:function(e){setVip(e.target.value);}},['VIP8530310123','VIP8530310124'].map(function(v){return h('option',{key:v,value:v},v);}))),
    h('label',null,'น้ำหนักต่อพัสดุ (กก.)',h('input',{style:input,type:'number',min:'0.001',max:'100',step:'0.001',value:weight,disabled:busy,onChange:function(e){setWeight(e.target.value);}})),
    h('label',{style:{flex:1,minWidth:200}},'ค้นหา',h('input',{style:input,value:query,placeholder:'ออเดอร์ / ชื่อ / เบอร์โทร / เลขพัสดุ',onChange:function(e){setQuery(e.target.value);}}))
   ),
   h('h3',{style:{margin:'16px 0'}},'ออเดอร์รอส่ง ('+pending.length+')'),
   h('p',{style:{fontSize:12,color:'#64748b'}},'แสดงออเดอร์ที่ CRM โหลดไว้ สูงสุด 100 รายการต่อการค้นหา'),
   !loaded?h('p',null,'กำลังโหลดข้อมูล J&T…'):h('div',{style:{overflowX:'auto'}},h('table',{style:{width:'100%',borderCollapse:'collapse'}},
    h('thead',null,h('tr',null,['ออเดอร์','ลูกค้า','จังหวัด','COD',''].map(function(t){return h('th',{key:t,style:{textAlign:'left',padding:10}},t);}))),
    h('tbody',null,pending.slice(0,100).map(function(o){return h('tr',{key:o._table+':'+o.OrderID,style:{borderTop:'1px solid #eee'}},
     h('td',{style:{padding:10}},o.OrderID,h('small',{style:{display:'block',color:'#64748b'}},o._table)),h('td',null,o.Name),h('td',null,o.Province),h('td',null,Number(o.COD||0).toLocaleString()),h('td',null,action('สร้างเลข J&T',async function(){
      var summary='สร้างพัสดุ J&T จริง\n'+o.OrderID+' · '+o.Name+'\nบัญชี '+vip+'\nผู้ส่ง '+(sender.sender_name||'ยังไม่ตั้งค่า')+'\nน้ำหนัก '+weight+' กก. · COD '+Number(o.COD||0)+' บาท';
      if(!window.confirm(summary))return;
      try{var result=await MTJT.call('create',{table:o._table,orderId:o.OrderID,customerCode:vip,sender:sender,weight:weight,environment:'production'});setMessage('สร้างเลขพัสดุแล้ว: '+result.billCode);}
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
