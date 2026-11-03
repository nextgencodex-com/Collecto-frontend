// Owner/rider view-model builders, kept outside the DC to keep the logic class small.
(function(){
const KEYS=['name','nic','phone','address','city','riderId','notes','code','pname','price','freq','period','amount','start','purchase','cash','stock','qty','username','password','area','reason','customerId'];
const NAV=[['dashboard','Dashboard'],['customers','Customers'],['installments','Installments'],['products','Products'],['inventory','Inventory'],['riders','Riders'],['collections','Collections'],['reports','Reports'],['audit','Audit Log'],['settings','Settings']];
const REPS=[['daily','Daily'],['monthly','Monthly'],['person','Person-wise outstanding'],['item','Item-wise balance'],['rider','Rider performance'],['overdue','Overdue']];
const chipBtn=(on)=>({bg:on?'#fff':'transparent',fg:on?'#18181B':'#71717A',bd:on?'#E4E4E7':'transparent',sh:on?'0 1px 2px rgba(24,24,27,.1),0 0 0 1px rgba(24,24,27,.04)':'none',nc:on?'#7C5CFA':'#A1A1AA'});
const NIC={dashboard:'ic-grid',customers:'ic-users',installments:'ic-calclock',products:'ic-package',inventory:'ic-archive',riders:'ic-bike',collections:'ic-wallet',reports:'ic-chart',audit:'ic-history',settings:'ic-sliders'};
const NGRP={main:['dashboard','customers','installments','collections'],manage:['products','inventory','riders'],work:['reports','audit','settings']};
const pin=p=>parseInt(p,10)>=14?p:'';
const pct=(a,b)=>b>0?Math.min(100,Math.round(a/b*100)):(a>0?100:0);

function derive(d){
 const {calcItem,RANK,sum,TODAY}=CL;const pays=d.payments,rmap={},cmap={},imap={};
 d.riders.forEach(r=>rmap[r.id]=r);
 const items=d.items.map(it=>({...it,...calcItem(it,pays)}));items.forEach(i=>imap[i.id]=i);
 const custs=d.customers.map(c=>{const its=items.filter(x=>x.customerId===c.id),act=its.filter(x=>x.status!=='DONE');
  const status=act.length?act.reduce((a,x)=>RANK[x.status]<RANK[a]?x.status:a,'UPCOMING'):(its.length?'DONE':'UPCOMING');
  const o={...c,its,act,status,dueNow:sum(act.map(x=>x.dueNow)),overdue:sum(act.map(x=>x.overdue)),expectedToday:sum(its.map(x=>x.expectedToday)),balance:sum(its.map(x=>x.balance)),
   paid:sum(its.map(x=>x.paid)),total:sum(its.map(x=>x.price)),missed:sum(act.map(x=>x.missed)),paidToday:sum(pays.filter(p=>p.customerId===c.id&&p.date===TODAY).map(p=>p.amount)),
   riderName:rmap[c.riderId]?rmap[c.riderId].name:'Unassigned'};cmap[c.id]=o;return o;});
 return {items,custs,cmap,rmap,imap,pays};
}

function decoC(self,c){const {ST,fmt,AV,initials}=CL;return{id:c.id,name:c.name,nic:c.nic,phone:c.phone,address:c.address,city:c.city,notes:c.notes||'—',chip:ST[c.status],
 dueNowF:fmt(c.dueNow),balanceF:fmt(c.balance),overdueF:fmt(c.overdue),expF:fmt(c.expectedToday),paidF:fmt(c.paid),totalF:fmt(c.total),missed:String(c.missed),activeCount:String(c.act.length),
 riderName:c.riderName,riderId:c.riderId,av:AV[parseInt(c.id.slice(1),10)%AV.length],initials:initials(c.name),photo:c.photo,photoBg:CL.bg(c.photo),hasPhoto:!!c.photo,noPhoto:!c.photo,sinceF:CL.fd(c.since),
 hasOverdue:c.overdue>0,hasDue:c.dueNow>0,paidToday:c.paidToday>0,paidTodayF:fmt(c.paidToday),
 tel:'tel:'+c.phone.replace(/\D/g,''),navUrl:'https://www.google.com/maps/dir/?api=1&destination='+c.lat+','+c.lng,mapUrl:'https://www.google.com/maps/search/?api=1&query='+c.lat+','+c.lng,
 open:()=>self.openCust(c.id),ropen:()=>self.setState(s=>({rp:'detail',rSel:c.id,mapSel:null,rBack:s.rp==='detail'?s.rBack:s.rp}))};}

function decoI(self,x,open){const {ST,fmt,fd,cumF}=CL;const cum=cumF(x);return{id:x.id,code:x.code,name:x.name,chip:ST[x.status],priceF:fmt(x.price),paidF:fmt(x.paid),balanceF:fmt(x.balance),
 dueNowF:fmt(x.dueNow),overdueF:fmt(x.overdue),hasDue:x.dueNow>0,hasOverdue:x.overdue>0,plan:fmt(x.amount)+' '+x.freq+' · '+x.n+' payments',freqL:x.freq==='weekly'?'Weekly':'Monthly',
 amountF:fmt(x.amount),nextF:x.next?fd(x.next):'Completed',startF:fd(x.start),endF:fd(x.last),pct:Math.min(100,Math.round(x.paid/x.price*100))+'%',pctIn:pin(Math.min(100,Math.round(x.paid/x.price*100))+'%'),
 customer:self._D.cmap[x.customerId]?self._D.cmap[x.customerId].name:'—',riderName:self._D.rmap[x.riderId]?self._D.rmap[x.riderId].name:'—',
 open:!!open,toggleL:open?'Hide schedule':'View schedule',toggle:()=>self.setState(s=>({openItem:s.openItem===x.id?null:x.id})),openCust:()=>self.openCust(x.customerId),
 rows:open?x.dates.map((dt,i)=>{const prev=i?cum(i-1):0,amt=cum(i)-prev,cov=Math.max(0,Math.min(amt,x.paid-prev));
  const st=cov>=amt?'PAID':dt<CL.TODAY?'OVERDUE':dt===CL.TODAY?'DUE':'UPCOMING';return{no:String(i+1),date:fd(dt),amountF:fmt(amt),paidF:cov?fmt(cov):'—',chip:ST[st]};}):[]};}

function decoP(self,p){const D=self._D,c=D.cmap[p.customerId],it=D.imap[p.itemId],r=D.rmap[p.riderId],cor=p.status==='corrected';
 return{id:p.id,txn:p.txn,date:CL.fd(p.date),time:p.time,cust:c?c.name:'—',item:it?it.code+' · '+it.name:'—',rider:r?r.name:'—',amountF:CL.fmt(p.amount),
 stLabel:cor?'Corrected':'Completed',stBg:cor?'#FEF5DC':'#EAF7EE',stFg:cor?'#A16207':'#15803D',
 correct:()=>self.openModal('correct',{payId:p.id,amount:String(p.amount),reason:'',txn:p.txn,cur:CL.fmt(p.amount),custName:c?c.name:''}),openCust:()=>self.openCust(p.customerId)};}

function mapLayer(points,b){const {proj,AREAS}=CL;
 const areas=Object.entries(AREAS).map(([n,[la,lo]])=>({name:n,...proj(la-0.0025,lo,b)})).filter(a=>a.x>3&&a.x<97&&a.y>3&&a.y<97);
 return {areas,markers:points};}
function boundsFor(pts){if(!pts.length)return CL.BOUNDS;const la=pts.map(p=>p.lat),lo=pts.map(p=>p.lng);
 const a0=Math.min(...la),a1=Math.max(...la),o0=Math.min(...lo),o1=Math.max(...lo),pa=Math.max((a1-a0)*.18,.006),po=Math.max((o1-o0)*.14,.008);
 return{lat0:a0-pa,lat1:a1+pa*1.6,lng0:o0-po,lng1:o1+po};}

function report(self){const s=self.state,D=self._D,pays=D.pays,{fmt,fd,sum,expectedOn,cumF,TODAY}=CL;
 const L=v=>({v:String(v),ta:'left'}),R=v=>({v:String(v),ta:'right'});const cn=id=>D.cmap[id]?D.cmap[id].name:'—',rn=id=>D.rmap[id]?D.rmap[id].name:'—',iname=id=>D.imap[id]?D.imap[id].code+' · '+D.imap[id].name:'—';
 let title='',cols=[],rows=[],summary=[];
 if(s.rep==='daily'){const ps=pays.filter(p=>p.date===s.repDate);title='Daily collection report · '+fd(s.repDate);
  cols=[L('Transaction'),L('Time'),L('Customer'),L('Item'),L('Rider'),R('Amount')];rows=ps.map(p=>[L(p.txn),L(p.time),L(cn(p.customerId)),L(iname(p.itemId)),L(rn(p.riderId)),R(fmt(p.amount))]);
  const exp=sum(D.items.map(i=>expectedOn(i,s.repDate,pays))),col=sum(ps.map(p=>p.amount));
  summary=[['Expected',fmt(exp)],['Collected',fmt(col)],['Difference',fmt(col-exp)],['Payments',ps.length]];}
 else if(s.repDate&&s.rep==='monthly'||s.rep==='monthly'){const m=s.repMonth;const ps=pays.filter(p=>p.date.startsWith(m));const by={};ps.forEach(p=>{(by[p.date]=by[p.date]||[]).push(p);});
  title='Monthly collection report · '+new Date(m+'-01T00:00').toLocaleDateString('en-GB',{month:'long',year:'numeric'});
  cols=[L('Date'),R('Payments'),R('Collected')];rows=Object.keys(by).sort().map(k=>[L(fd(k)),R(by[k].length),R(fmt(sum(by[k].map(p=>p.amount))))]);
  let due=0,done=0,over=0;D.items.forEach(it=>{const cum=cumF(it);it.dates.forEach((dt,i)=>{if(!dt.startsWith(m))return;due++;if(cum(i)<=it.paid)done++;else if(dt<TODAY)over++;});});
  summary=[['Collected',fmt(sum(ps.map(p=>p.amount)))],['Installments due',due],['Completed',done],['Overdue',over]];}
 if(s.rep==='person'){title='Person-wise outstanding report';cols=[L('Customer'),L('NIC'),L('Rider'),R('Active items'),R('Total'),R('Paid'),R('Balance'),R('Overdue')];
  rows=D.custs.filter(c=>c.balance>0).sort((a,b)=>b.balance-a.balance).map(c=>[L(c.name),L(c.nic),L(c.riderName),R(c.act.length),R(fmt(c.total)),R(fmt(c.paid)),R(fmt(c.balance)),R(fmt(c.overdue))]);
  summary=[['Customers with balance',rows.length],['Total outstanding',fmt(sum(D.custs.map(c=>c.balance)))],['Total overdue',fmt(sum(D.custs.map(c=>c.overdue)))]];}
 if(s.rep==='item'){title='Item-wise balance report';cols=[L('Item'),L('Customer'),R('Price'),R('Paid'),R('Balance'),L('Next due'),L('Status')];
  rows=D.items.map(i=>[L(i.code+' · '+i.name),L(cn(i.customerId)),R(fmt(i.price)),R(fmt(i.paid)),R(fmt(i.balance)),L(i.next?fd(i.next):'—'),L(CL.ST[i.status].label)]);
  summary=[['Items',D.items.length],['Completed',D.items.filter(i=>i.status==='DONE').length],['Outstanding value',fmt(sum(D.items.map(i=>i.balance)))]];}
 if(s.rep==='rider'){const m=s.repDate.slice(0,7);title='Rider performance · '+fd(s.repDate);cols=[L('Rider'),L('Area'),R('Customers'),R('Expected'),R('Collected'),R('Rate'),R('Month to date')];
  rows=self.state.data.riders.map(r=>{const e=sum(D.items.filter(i=>i.riderId===r.id).map(i=>expectedOn(i,s.repDate,pays))),c=sum(pays.filter(p=>p.riderId===r.id&&p.date===s.repDate).map(p=>p.amount));
   return[L(r.name),L(r.area),R(D.custs.filter(x=>x.riderId===r.id).length),R(fmt(e)),R(fmt(c)),R(pct(c,e)+'%'),R(fmt(sum(pays.filter(p=>p.riderId===r.id&&p.date.startsWith(m)&&p.date<=s.repDate).map(p=>p.amount))))];});}
 if(s.rep==='overdue'){title='Overdue installments report';cols=[L('Customer'),L('Phone'),L('Item'),L('Rider'),R('Missed'),R('Overdue amount'),L('Oldest due')];
  rows=D.items.filter(i=>i.overdue>0).sort((a,b)=>b.overdue-a.overdue).map(i=>{const c=D.cmap[i.customerId];return[L(c.name),L(c.phone),L(i.code+' · '+i.name),L(c.riderName),R(i.missed),R(fmt(i.overdue)),L(fd(i.oldest))];});
  summary=[['Overdue items',rows.length],['Overdue amount',fmt(sum(D.items.map(i=>i.overdue)))]];}
 return{title,cols,rows:rows.map(r=>({cells:r})),summary:summary.map(([label,value])=>({label,value:String(value)})),empty:!rows.length,hasSummary:summary.length>0};}

function owner(self,narrow){const s=self.state,d=s.data,D=self._D,{fmt,fd,sum,TODAY,ST,BOUNDS,proj,AREAS,expectedOn,initials,AV}=CL;
 const go=p=>()=>self.setState({page:p,drawer:false,notifOpen:false,userMenu:false});const act=s.page==='profile'?'customers':s.page;
 const tp=D.pays.filter(p=>p.date===TODAY);const expected=sum(D.items.map(i=>i.expectedToday)),collected=sum(tp.map(p=>p.amount));
 const activeItems=D.items.filter(i=>i.status!=='DONE'),overdueC=D.custs.filter(c=>c.status==='OVERDUE');
 const v={narrow,wide:!narrow,nav:NAV.map(([k,l])=>({label:l,go:go(k),bg:k===act?'#EDEDEF':'transparent',fg:k===act?'#18181B':'#52525B'})),
  sb:{pos:narrow?'fixed':'sticky',tf:narrow&&!s.drawer?'translateX(-100%)':'none'},drawerShade:narrow&&s.drawer,openDrawer:()=>self.setState({drawer:true}),closeDrawer:()=>self.setState({drawer:false}),
  ownerName:d.owner.name,ownerInitials:initials(d.owner.name),ownerPhotoBg:CL.bg(d.owner.photo),ownerNoPhoto:!d.owner.photo,pg:{[s.page]:true},go:Object.fromEntries(NAV.map(([k])=>[k,go(k)]))};
 const NL=Object.fromEntries(NAV),ovC=D.custs.filter(c=>c.status==='OVERDUE').length;
 const navI=k=>({label:NL[k],go:go(k),ic:NIC[k],cls:k===act?'on':'',bg:k===act?'#EDEDEF':'transparent',fg:k===act?'#18181B':'#52525B',icc:k===act?'#18181B':'#71717A',sh:'none',hasBadge:k==='customers'&&ovC>0,badge:String(ovC)});
 v.navMain=NGRP.main.map(navI);v.navManage=NGRP.manage.map(navI);v.navWork=NGRP.work.map(navI);
 v.crumb=s.page==='profile'?'Customer profile':NL[s.page]||'Dashboard';v.crumbIc=NIC[act]||'ic-grid';v.crumbGroup=NGRP.manage.includes(act)?'Manage':NGRP.work.includes(act)?'Workspace':'Main menu';
 v.riderStack=d.riders.map(r=>({init:initials(r.name),photoBg:CL.bg(r.photo),noPhoto:!r.photo,av:AV[parseInt(r.id.slice(1),10)%AV.length]}));
 // global search
 const q=s.gq.trim().toLowerCase(),qd=q.replace(/\D/g,'');
 const match=c=>!q||c.name.toLowerCase().includes(q)||c.nic.toLowerCase().includes(q)||(qd.length>2&&c.phone.replace(/\D/g,'').includes(qd));
 v.gq=s.gq;v.onGq=e=>self.setState({gq:e.target.value});v.gShow=!!q;v.gResults=q?D.custs.filter(match).slice(0,6).map(c=>decoC(self,c)):[];v.gNone=!!q&&!v.gResults.length;
 // notifications
 const un=d.notifs.filter(n=>!n.read).length;v.unread=String(un);v.hasUnread=un>0;v.notifOpen=s.notifOpen;v.toggleNotif=()=>self.setState(x=>({notifOpen:!x.notifOpen,userMenu:false}));
 const um=!!s.userMenu;v.userMenu=um;v.umOpenStr=String(um);v.umRot=um?'-90deg':'90deg';v.umBg=um?'#F4F4F5':'#fff';v.umBd=um?'#D4D4D8':'transparent';v.ownerEmail=d.owner.email||'';
 v.toggleUser=()=>self.setState(x=>({userMenu:!x.userMenu,notifOpen:false}));v.closeUser=()=>self.setState({userMenu:false});
 v.um={settings:go('settings'),reports:go('reports'),audit:go('audit'),logout:()=>{self.setState({userMenu:false});self.logout();}};
 const NC={payment:'#22C55E',overdue:'#F43F5E',closing:'#7C5CFA',system:'#A1A1AA'};
 v.notifs=d.notifs.slice(0,30).map(n=>({...n,when:(n.date===TODAY?'Today':fd(n.date))+' · '+n.time,dot:NC[n.type]||'#A1A1AA',bg:n.read?'#fff':'#F8F6FF'}));v.noNotifs=!d.notifs.length;
 v.markRead=()=>self.mut(x=>x.notifs.forEach(n=>n.read=true));
 // dashboard
 v.kpis=[{label:'Expected today',value:fmt(expected),sub:'Due today plus overdue arrears',color:'#18181B'},{label:'Collected today',value:fmt(collected),sub:pct(collected,expected)+'% of expected · '+tp.length+' payments',color:'#15803D'},
  {label:'Outstanding',value:fmt(sum(D.items.map(i=>i.balance))),sub:'Across '+activeItems.length+' active items',color:'#18181B'},{label:'Overdue customers',value:String(overdueC.length),sub:fmt(sum(D.items.map(i=>i.overdue)))+' in arrears',color:'#C81E3A'}];
 v.strip=[{label:'Active customers',value:String(D.custs.filter(c=>c.act.length).length)},{label:'Active installment items',value:String(activeItems.length)},{label:'Due today',value:String(D.custs.filter(c=>c.status==='DUE').length)},{label:'Overdue',value:String(overdueC.length)}];
 v.recent=D.pays.slice(-6).reverse().map(p=>decoP(self,p));
 v.riderPerf=d.riders.map(r=>{const e=sum(D.items.filter(i=>i.riderId===r.id).map(i=>i.expectedToday)),c=sum(tp.filter(p=>p.riderId===r.id).map(p=>p.amount));return{name:r.name,expF:fmt(e),colF:fmt(c),pct:pct(c,e)+'%',pctIn:pin(pct(c,e)+'%'),remL:e-c>0?fmt(e-c)+' still to collect':'Target reached'};});
 v.overdueRows=overdueC.sort((a,b)=>b.overdue-a.overdue).map(c=>decoC(self,c));v.noOverdue=!overdueC.length;
 v.qa={customer:()=>self.openCustomerModal(),item:()=>self.openItemModal(''),rider:()=>self.openRiderModal(null),report:()=>self.setState({page:'reports',rep:'daily',repDate:TODAY})};
 // dashboard kanban
 const dv=s.dbView||'board',fr=s.dbRider||'all',fdl=x=>CL.pd(x).toLocaleDateString('en-GB',{day:'numeric',month:'long'});
 v.dbIsBoard=dv==='board';v.dbIsOver=dv==='overview';
 v.dbTabs=[['overview','Overview','ic-list'],['board','Kanban','ic-kanban']].map(([k,l,ic])=>({label:l,ic,go:()=>self.setState({dbView:k,dbFilt:false}),fg:dv===k?'#18181B':'#71717A',bar:dv===k?'#7C5CFA':'transparent'}));
 v.dbFilt=!!s.dbFilt;v.dbToggleFilt=()=>self.setState(x=>({dbFilt:!x.dbFilt}));v.dbFilterL=fr==='all'?'Filter':'Filter (1)';
 v.dbRiderOpts=[['all','All riders']].concat(d.riders.map(r=>[r.id,r.name])).map(([k,l])=>({label:l,on:fr===k,bg:fr===k?'#F4F4F5':'#fff',go:()=>self.setState({dbRider:k,dbFilt:false})}));
 const KC=[['OVERDUE','Overdue','#F43F5E'],['DUE','Due today','#EAB308'],['PAID','Up to date','#3B82F6'],['UPCOMING','Upcoming','#A1A1AA'],['DONE','Completed','#22C55E']];
 const kcs=D.custs.filter(c=>fr==='all'||c.riderId===fr);
 v.board=KC.map(([k,l,sq])=>{const cs=kcs.filter(c=>c.status===k).sort((a,b)=>b.dueNow-a.dueNow||b.balance-a.balance);
  return{label:l,sq,count:String(cs.length),empty:!cs.length,cards:cs.map(c=>{const r=D.rmap[c.riderId],nx=c.act.map(x=>x.next).filter(Boolean).sort()[0];
   return{...decoC(self,c),desc:(c.its.length?c.its.map(x=>x.name).join(', '):'No installment items yet')+(c.overdue>0?' · '+fmt(c.overdue)+' in arrears':c.balance>0?' · '+fmt(c.balance)+' balance':''),
    dateL:nx?(nx===TODAY?'Today':fdl(nx)):(c.its.length?'Fully paid':'No schedule'),amtL:c.dueNow>0?fmt(c.dueNow)+' due now':c.act.length?'View '+c.act.length+' installment'+(c.act.length>1?'s':''):fmt(c.paid)+' paid',
    itemsN:String(c.its.length),missedN:String(c.missed),hasMissed:c.missed>0,rInit:r?initials(r.name):'—',rAv:r?AV[parseInt(r.id.slice(1),10)%AV.length]:'#A1A1AA'};})};});
 // customers
 const cq=s.cq.trim().toLowerCase(),cqd=cq.replace(/\D/g,'');
 const cm=c=>!cq||c.name.toLowerCase().includes(cq)||c.nic.toLowerCase().includes(cq)||(cqd.length>2&&c.phone.replace(/\D/g,'').includes(cqd));
 const cl=D.custs.filter(c=>cm(c)&&(s.cst==='all'||c.status===s.cst)&&(s.crd==='all'||c.riderId===s.crd));
 v.cq=s.cq;v.onCq=e=>self.setState({cq:e.target.value});v.cqHas=!!s.cq;v.clearCq=()=>self.setState({cq:''});v.custList=cl.map(c=>decoC(self,c));v.custEmpty=!cl.length;v.custCount=cl.length+' of '+D.custs.length;
 v.cstChips=[['all','All'],['OVERDUE','Overdue'],['DUE','Due today'],['PAID','Up to date'],['UPCOMING','Upcoming'],['DONE','Completed']].map(([k,l])=>({label:l,hasN:true,n:String(k==='all'?D.custs.length:D.custs.filter(c=>c.status===k).length),go:()=>self.setState({cst:k}),...chipBtn(s.cst===k)}));
 v.crd=s.crd;v.onCrd=e=>self.setState({crd:e.target.value});v.riderOpts=d.riders.map(r=>({v:r.id,label:r.name}));
 // profile
 const pc=D.cmap[s.sel];v.hasProf=!!pc;
 if(pc){v.prof=decoC(self,pc);v.profItems=pc.act.map(x=>decoI(self,x,s.openItem===x.id));v.profNoItems=!pc.act.length;
  v.profHist=pc.its.slice().sort((a,b)=>b.start.localeCompare(a.start)).map(x=>decoI(self,x,false));
  v.profPays=D.pays.filter(p=>p.customerId===pc.id).slice().reverse().map(p=>decoP(self,p));v.profNoPays=!v.profPays.length;
  v.profStats=[['Total purchased',fmt(pc.total)],['Paid',fmt(pc.paid)],['Balance',fmt(pc.balance)],['Due now',fmt(pc.dueNow)]].map(([label,value])=>({label,value}));
  const b={lat0:pc.lat-.012,lat1:pc.lat+.012,lng0:pc.lng-.02,lng1:pc.lng+.02};v.profMap={...mapLayer([],b),pin:proj(pc.lat,pc.lng,b)};
  v.onAssign=e=>{const rid=e.target.value;self.mut(x=>{x.customers.find(c=>c.id===pc.id).riderId=rid;x.items.forEach(i=>{if(i.customerId===pc.id)i.riderId=rid;});});self.toast('Customer reassigned to '+D.rmap[rid].name);};
  v.profAddItem=()=>self.openItemModal(pc.id);}
 v.backCustomers=go('customers');
 // installments
 const il=D.items.filter(i=>s.ist==='all'||i.status===s.ist).sort((a,b)=>CL.RANK[a.status]-CL.RANK[b.status]);
 v.instList=il.map(x=>decoI(self,x,false));v.instEmpty=!il.length;
 v.istChips=[['all','All'],['OVERDUE','Overdue'],['DUE','Due today'],['PAID','Up to date'],['UPCOMING','Upcoming'],['DONE','Completed']].map(([k,l])=>({label:l,hasN:true,n:String(k==='all'?D.items.length:D.items.filter(i=>i.status===k).length),go:()=>self.setState({ist:k}),...chipBtn(s.ist===k)}));
 // products & inventory
 v.products=d.products.map(p=>{const out=D.items.filter(i=>i.code===p.code);return{code:p.code,name:p.name,priceF:fmt(p.price),cashF:fmt(p.cash),purchaseF:fmt(p.purchase),plan:fmt(p.amount)+' '+p.freq+' · '+p.period+' months',
  stock:String(p.stock),sold:String(p.sold),stockL:p.stock>0?p.stock+' in stock':'Out of stock',stockFg:p.stock>0?(p.stock<3?'#A16207':'#15803D'):'#C81E3A',stockBg:p.stock>0?(p.stock<3?'#FEF5DC':'#EAF7EE'):'#FFEEF0',
  profitF:fmt(p.price-p.purchase),soldProfitF:fmt((p.price-p.purchase)*p.sold),outF:fmt(sum(out.map(i=>i.balance))),
  sell:()=>self.openItemModal('',p.code),addStock:()=>self.openModal('stock',{code:p.code,pname:p.name,qty:'1'})};});
 v.invStats=[['Units in stock',String(sum(d.products.map(p=>p.stock)))],['Stock value at cost',fmt(sum(d.products.map(p=>p.stock*p.purchase)))],['Expected profit on sold items',fmt(sum(d.products.map(p=>(p.price-p.purchase)*p.sold)))],['Outstanding installment value',fmt(sum(D.items.map(i=>i.balance)))]].map(([label,value])=>({label,value}));
 v.addProduct=()=>self.openModal('product',{code:'',pname:'',purchase:'',cash:'',price:'',freq:'weekly',amount:'',period:'',stock:''});
 // riders
 v.riderCards=d.riders.map(r=>{const its=D.items.filter(i=>i.riderId===r.id),e=sum(its.map(i=>i.expectedToday)),c=sum(tp.filter(p=>p.riderId===r.id).map(p=>p.amount)),clo=d.closings.find(x=>x.riderId===r.id&&x.date===TODAY);
  return{name:r.name,phone:r.phone,area:r.area,username:r.username,initials:initials(r.name),photoBg:CL.bg(r.photo),noPhoto:!r.photo,av:AV[parseInt(r.id.slice(1),10)%AV.length],stLabel:r.active?'Active':'Inactive',stBg:r.active?'#EAF7EE':'#F4F4F5',stFg:r.active?'#15803D':'#52525B',
   custCount:String(D.custs.filter(x=>x.riderId===r.id).length),expF:fmt(e),colF:fmt(c),pct:pct(c,e)+'%',pctIn:pin(pct(c,e)+'%'),closing:clo?'Closed at '+clo.time+' · cash '+fmt(clo.cash):'Not closed yet',
   monthF:fmt(sum(D.pays.filter(p=>p.riderId===r.id&&p.date.startsWith(TODAY.slice(0,7))).map(p=>p.amount))),edit:()=>self.openRiderModal(r)};});
 v.addRider=()=>self.openRiderModal(null);
 // collections
 const fq=s.colQ.trim().toLowerCase();
 const ps=D.pays.filter(p=>(!s.colDate||p.date===s.colDate)&&(s.colRider==='all'||p.riderId===s.colRider)&&(s.colSt==='all'||p.status===s.colSt)&&(!fq||p.txn.toLowerCase().includes(fq)||(D.cmap[p.customerId]&&D.cmap[p.customerId].name.toLowerCase().includes(fq)))).slice().reverse();
 v.colRows=ps.slice(0,150).map(p=>decoP(self,p));v.colEmpty=!ps.length;v.colCount=ps.length>150?'Showing 150 of '+ps.length+' payments':ps.length+' payments · '+fmt(sum(ps.map(p=>p.amount)));
 v.colDate=s.colDate;v.onColDate=e=>self.setState({colDate:e.target.value});v.colAll=()=>self.setState({colDate:''});v.colToday=()=>self.setState({colDate:TODAY});v.hasColDate=!!s.colDate;v.noColDate=!s.colDate;
 v.colRider=s.colRider;v.onColRider=e=>self.setState({colRider:e.target.value});v.colSt=s.colSt;v.onColSt=e=>self.setState({colSt:e.target.value});v.colQ=s.colQ;v.onColQ=e=>self.setState({colQ:e.target.value});v.colQHas=!!s.colQ;v.clearColQ=()=>self.setState({colQ:''});
 v.colDateF=s.colDate?fd(s.colDate):'';
 v.recon=d.riders.map(r=>{const e=s.colDate?sum(D.items.filter(i=>i.riderId===r.id).map(i=>expectedOn(i,s.colDate,D.pays))):0,c=sum(D.pays.filter(p=>p.riderId===r.id&&p.date===s.colDate).map(p=>p.amount));
  return{name:r.name,expF:fmt(e),colF:fmt(c),diffF:(c-e>=0?'+':'−')+fmt(Math.abs(c-e)).replace('Rs. ','Rs. '),diffFg:c-e<0?'#C81E3A':'#15803D',pct:pct(c,e)+'%'};});
 const rt=v.recon;v.reconTot={expF:fmt(sum(d.riders.map(r=>sum(D.items.filter(i=>i.riderId===r.id).map(i=>s.colDate?expectedOn(i,s.colDate,D.pays):0))))),colF:fmt(sum(D.pays.filter(p=>p.date===s.colDate).map(p=>p.amount)))};
 const cls=d.closings.filter(x=>!s.colDate||x.date===s.colDate).slice().reverse();
 v.closings=cls.map(x=>({rider:D.rmap[x.riderId]?D.rmap[x.riderId].name:'—',when:fd(x.date)+' · '+x.time,expF:fmt(x.expected),colF:fmt(x.collected),cashF:fmt(x.cash),diffF:(x.cash-x.collected>=0?'+':'−')+fmt(Math.abs(x.cash-x.collected)),diffFg:x.cash-x.collected<0?'#C81E3A':'#15803D',note:x.note||'—'}));v.noClosings=!cls.length;
 // reports
 v.repTabs=REPS.map(([k,l])=>({label:l,go:()=>self.setState({rep:k}),...chipBtn(s.rep===k)}));v.report=report(self);v.repShowDate=s.rep==='daily'||s.rep==='rider';v.repShowMonth=s.rep==='monthly';
 v.repDate=s.repDate;v.onRepDate=e=>self.setState({repDate:e.target.value||TODAY});v.repMonth=s.repMonth;v.onRepMonth=e=>self.setState({repMonth:e.target.value||TODAY.slice(0,7)});v.exportCsv=()=>self.exportCsv(v.report);
 // audit
 v.audit=d.audit.map(a=>({...a,when:fd(a.date)+' · '+a.time}));v.noAudit=!d.audit.length;
 // settings
 v.shop=d.shop;v.owner=d.owner;v.onShop=Object.fromEntries(['name','phone','address'].map(k=>[k,e=>{const val=e.target.value;self.mut(x=>x.shop[k]=val);}]));
 v.resetDemo=()=>{if(window.confirm('Reset all data to the demo dataset? This cannot be undone.')){self.setState({data:CL.buildSeed(),page:'dashboard'},()=>self.save());self.toast('Demo data restored');}};
 // pagination: 10 rows per page
 const PG=10;v.pgr={};v.invRows=v.products;
 const pager=(key,list)=>{const tot=list.length,np=Math.max(1,Math.ceil(tot/PG)),cur=Math.min((s.pgs||{})[key]||1,np),set=p=>()=>self.setState(x=>({pgs:{...(x.pgs||{}),[key]:p}}));
  const a=Math.max(1,Math.min(cur-2,np-4)),b=Math.min(np,a+4),pages=[];
  for(let i=a;i<=b;i++)pages.push({label:String(i),go:set(i),bg:i===cur?'#7C5CFA':'#fff',fg:i===cur?'#fff':'#3F3F46',bd:i===cur?'#7C5CFA':'#E4E4E7'});
  v.pgr[key]={show:tot>PG,from:String(tot?(cur-1)*PG+1:0),to:String(Math.min(tot,cur*PG)),total:String(tot),pages,
   prev:cur>1?set(cur-1):()=>{},next:cur<np?set(cur+1):()=>{},prevOp:cur>1?'1':'.4',nextOp:cur<np?'1':'.4'};
  return list.slice((cur-1)*PG,cur*PG);};
 ['overdueRows','instList','invRows','colRows','closings','audit'].forEach(k=>{v[k]=pager(k,v[k]||[]);});
 if(v.report&&v.report.rows)v.report={...v.report,rows:pager('rep',v.report.rows)};
 return v;}

function rider(self){const s=self.state,d=s.data,D=self._D,{fmt,fd,fds,sum,TODAY,ST,proj}=CL;const me=D.rmap[s.riderId];if(!me)return{};
 const mine=D.custs.filter(c=>c.riderId===me.id),tp=D.pays.filter(p=>p.date===TODAY&&p.riderId===me.id);
 const expected=sum(mine.map(c=>c.expectedToday)),collected=sum(tp.map(p=>p.amount)),pending=sum(mine.map(c=>c.dueNow));
 const todays=mine.filter(c=>c.expectedToday>0||c.dueNow>0).sort((a,b)=>CL.RANK[a.status]-CL.RANK[b.status]);
 const h=new Date().getHours();const T={home:'',map:'Map',customers:'My customers',detail:'Customer',collect:'Collect payment',success:'Payment recorded',closing:'Daily closing',history:'History',profile:'Profile'};
 const v={rp:{[s.rp]:true},rIsHome:s.rp==='home',rNotHome:s.rp!=='home',rTitle:T[s.rp],greet:(h<12?'Good morning':h<17?'Good afternoon':'Good evening')+', '+me.name.split(' ')[0],me:{...me,initials:CL.initials(me.name),photoBg:CL.bg(me.photo),noPhoto:!me.photo},
  rShowBack:['detail','collect','closing'].includes(s.rp),rBackGo:()=>self.setState(x=>({rp:x.rp==='collect'?'detail':x.rp==='detail'?(x.rBack||'customers'):'home',cErr:''})),
  rHdrD:s.rp==='home'?'none':'flex',rPad:s.rp==='map'?'0 0 72px':'16px 16px 100px',rTabs:[['home','Home','ic-home'],['map','Map','ic-map'],['customers','Customers','ic-users'],['history','History','ic-history'],['profile','Profile','ic-user']].map(([k,l,ic])=>({label:l,ic,go:()=>self.setState({rp:k,mapSel:null}),fg:s.rp===k?'#7C5CFA':'#71717A',bar:s.rp===k?'#7C5CFA':'transparent',fw:s.rp===k?'600':'500'}))};
 v.rKpis=[{label:'Expected',value:fmt(expected),color:'#18181B'},{label:'Collected',value:fmt(collected),color:'#15803D'},{label:'Pending',value:fmt(pending),color:pending>0?'#A16207':'#18181B'}];
 v.rCount=String(todays.length);v.rOverdue=String(mine.filter(c=>c.status==='OVERDUE').length);v.rToday=todays.map(c=>decoC(self,c));v.rNoToday=!todays.length;
 v.goMap=()=>self.setState({rp:'map'});v.goCusts=()=>self.setState({rp:'customers'});v.goClosing=()=>self.setState({rp:'closing',closeErr:''});
 const clo=d.closings.find(x=>x.riderId===me.id&&x.date===TODAY);v.closed=!!clo;v.notClosed=!clo;v.closedAt=clo?'Day closed at '+clo.time:'';
 // map
 const pts=mine.filter(c=>c.act.length);const b=boundsFor(pts);
 const tagPos=p=>({x:Math.min(74,Math.max(6,p.x)),y:Math.min(97,Math.max(20,p.y))});
 const mk=pts.map(c=>{const st=ST[c.status];return{...tagPos(proj(c.lat,c.lng,b)),label:c.name.split(' ')[0],full:c.name,dot:st.dot,icon:st.icon,ico:st.ico,ic:st.ic,z:s.mapSel===c.id?'5':'2',ring:s.mapSel===c.id?'0 0 0 3px rgba(124,92,250,0.5),':'',open:()=>self.setState({mapSel:c.id})};});
 // nudge tags apart vertically so nearby customers don't cover each other (tag ~30% wide, ~6% tall)
 mk.slice().sort((p,q)=>p.y-q.y).forEach((m,i,arr)=>{for(let k=0;k<arr.length;k++){const hit=arr.slice(0,i).find(o=>Math.abs(o.x-m.x)<32&&Math.abs(o.y-m.y)<6.5);if(!hit)break;
  m.y=hit.y+6.5<=97?hit.y+6.5:hit.y-6.5;}});
 v.rMap={...mapLayer([],b),markers:mk};
 v.legend=['PAID','DUE','OVERDUE','UPCOMING'].map(k=>({...ST[k],count:String(pts.filter(c=>c.status===k).length)}));
 const ms=D.cmap[s.mapSel];v.hasMapSel=!!ms;if(ms){v.ms=decoC(self,ms);v.ms.overdueCount=ms.missed+' overdue installment'+(ms.missed===1?'':'s');}v.closeMapSel=()=>self.setState({mapSel:null});
 // customers
 const rq=s.rq.trim().toLowerCase();const rl=mine.filter(c=>(!rq||c.name.toLowerCase().includes(rq)||c.address.toLowerCase().includes(rq)||c.phone.replace(/\D/g,'').includes(rq.replace(/\D/g,'')||'#'))&&(s.rst==='all'||c.status===s.rst)).sort((a,b)=>CL.RANK[a.status]-CL.RANK[b.status]);
 v.rq=s.rq;v.onRq=e=>self.setState({rq:e.target.value});v.rqHas=!!s.rq;v.clearRq=()=>self.setState({rq:''});v.rList=rl.map(c=>decoC(self,c));v.rEmpty=!rl.length;
 v.rstChips=[['all','All'],['OVERDUE','Overdue'],['DUE','Due today'],['PAID','Paid']].map(([k,l])=>({label:l,go:()=>self.setState({rst:k}),...chipBtn(s.rst===k)}));
 // detail
 const dc=D.cmap[s.rSel];v.hasDet=!!dc;
 if(dc){v.det=decoC(self,dc);v.detItems=dc.act.map(x=>decoI(self,x,false));v.detNoItems=!dc.act.length;v.detHasItems=dc.act.length>0;v.detPays=D.pays.filter(p=>p.customerId===dc.id).slice(-5).reverse().map(p=>decoP(self,p));v.detNoPays=!v.detPays.length;
  v.startCollect=()=>{const col={};dc.act.forEach(x=>col[x.id]={on:x.dueNow>0,val:x.dueNow>0?String(x.dueNow):''});self.setState({rp:'collect',collect:col,cErr:''});};
  v.colRows=dc.act.map(x=>{const c=s.collect[x.id]||{on:false,val:''};return{id:x.id,name:x.name,code:x.code,dueF:fmt(x.dueNow),balanceF:fmt(x.balance),chip:ST[x.status],on:!!c.on,val:c.val,
   toggle:()=>self.setState(z=>({collect:{...z.collect,[x.id]:{...(z.collect[x.id]||{val:''}),on:!(z.collect[x.id]||{}).on}}})),
   onAmt:e=>{const val=e.target.value.replace(/[^\d]/g,'');self.setState(z=>({collect:{...z.collect,[x.id]:{on:true,val}}}));}};});
  v.colTotal=fmt(sum(dc.act.map(x=>{const c=s.collect[x.id];return c&&c.on?(+c.val||0):0;})));}
 v.cErr=s.cErr;v.hasCErr=!!s.cErr;v.doCollect=()=>self.doCollect();
 // success
 const lt=s.lastTx;v.hasLast=!!lt;if(lt){v.last={...lt,totalF:fmt(lt.total),when:fd(lt.date)+' · '+lt.time,lines:lt.lines.map(l=>({...l,amountF:fmt(l.amount)}))};}
 v.showReceipt=()=>self.setState({modal:'receipt'});v.successDone=()=>self.setState({rp:'detail',rSel:lt?lt.custId:s.rSel});v.successHome=()=>self.setState({rp:'home'});
 // closing
 const cash=s.cash===''?null:+s.cash;v.close={expF:fmt(expected),colF:fmt(collected),pendF:fmt(pending),count:String(tp.length),cash:s.cash,note:s.closeNote,
  diffF:cash===null?'—':(cash-collected>=0?'+':'−')+fmt(Math.abs(cash-collected)),diffFg:cash===null?'#71717A':cash-collected<0?'#C81E3A':'#15803D',err:s.closeErr,hasErr:!!s.closeErr};
 if(clo)v.cloRec={expF:fmt(clo.expected),colF:fmt(clo.collected),pendF:fmt(clo.pending),cashF:fmt(clo.cash),diffF:(clo.cash-clo.collected>=0?'+':'−')+fmt(Math.abs(clo.cash-clo.collected)),time:clo.time,note:clo.note||'—',count:String(clo.count)};
 v.onCash=e=>self.setState({cash:e.target.value.replace(/[^\d]/g,''),closeErr:''});v.onCloseNote=e=>self.setState({closeNote:e.target.value});v.submitClosing=()=>self.submitClosing(expected,collected,pending,tp.length);
 // history
 const myP=D.pays.filter(p=>p.riderId===me.id).slice().reverse();const g={};myP.forEach(p=>{(g[p.date]=g[p.date]||[]).push(p);});
 v.hist=Object.keys(g).sort().reverse().slice(0,20).map(k=>({label:k===TODAY?'Today':fds(k),totalF:fmt(sum(g[k].map(p=>p.amount))),count:g[k].length+' payment'+(g[k].length===1?'':'s'),list:g[k].map(p=>decoP(self,p))}));v.noHist=!myP.length;
 // profile
 v.rProf=[['Phone',me.phone],['Username',me.username],['Assigned area',me.area],['Assigned customers',String(mine.length)],['Collected this month',fmt(sum(D.pays.filter(p=>p.riderId===me.id&&p.date.startsWith(TODAY.slice(0,7))).map(p=>p.amount)))]].map(([label,value])=>({label,value}));
 v.rProfInfo=v.rProf.slice(0,3);v.rProfStats=v.rProf.slice(3);
 return v;}

window.CLV={KEYS,derive,decoC,decoI,decoP,owner,rider,report,mapLayer,pct};
})();
