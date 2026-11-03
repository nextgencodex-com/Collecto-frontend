(function(){
const TODAY='2026-10-13';
const pad=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const pd=s=>{const a=s.split('-').map(Number);return new Date(a[0],a[1]-1,a[2]);};
const addD=(s,n)=>{const d=pd(s);d.setDate(d.getDate()+n);return iso(d);};
const addM=(s,n)=>{const d=pd(s),day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+n);d.setDate(Math.min(day,new Date(d.getFullYear(),d.getMonth()+1,0).getDate()));return iso(d);};
const fmt=n=>'Rs. '+Math.round(n||0).toLocaleString('en-US');
const fd=s=>s?pd(s).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'—';
const fds=s=>pd(s).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});
const sum=a=>a.reduce((x,y)=>x+y,0);
const nowT=()=>{const d=new Date();return pad(d.getHours())+':'+pad(d.getMinutes());};
const ST={
 PAID:{kbg:'conic-gradient(#3B82F6 0 62%,transparent 0)',kbd:'#3B82F6',label:'Paid',icon:'✓',ico:'ic-st-paid',pd:'#22C55E',pb:'none',bg:'#DCFCE7',fg:'#15803D',dot:'#22C55E',ic:'#fff'},
 DUE:{kbg:'conic-gradient(#EAB308 0 50%,transparent 0)',kbd:'#EAB308',label:'Due today',icon:'◷',ico:'ic-st-due',pd:'transparent',pb:'1.5px dashed #CA8A04',bg:'#FEF3C7',fg:'#A16207',dot:'#EAB308',ic:'#fff'},
 OVERDUE:{kbg:'#F43F5E',kbd:'#F43F5E',label:'Overdue',icon:'!',ico:'ic-st-over',pd:'#F43F5E',pb:'none',bg:'#FFE4E6',fg:'#BE123C',dot:'#F43F5E',ic:'#fff'},
 UPCOMING:{kbg:'transparent',kbd:'#A1A1AA',label:'Upcoming',icon:'○',ico:'ic-st-up',pd:'transparent',pb:'1.5px dashed #3B82F6',bg:'#EFF6FF',fg:'#1D4ED8',dot:'#A1A1AA',ic:'#fff'},
 DONE:{kbg:'#22C55E',kbd:'#22C55E',label:'Completed',icon:'✓',ico:'ic-st-done',pd:'#71717A',pb:'none',bg:'#F4F4F5',fg:'#3F3F46',dot:'#22C55E',ic:'#fff'}};
const RANK={OVERDUE:0,DUE:1,PAID:2,UPCOMING:3,DONE:4};
const AV=['#7C5CFA','#0EA5E9','#EC4899','#F59E0B','#64748B'];
const AREAS={Maharagama:[6.848,79.9265],Nugegoda:[6.872,79.889],Kottawa:[6.841,79.965],Homagama:[6.844,80.003],Piliyandala:[6.801,79.922]};
const BOUNDS={lat0:6.785,lat1:6.89,lng0:79.87,lng1:80.02};
const proj=(lat,lng,b)=>({x:+((lng-b.lng0)/(b.lng1-b.lng0)*100).toFixed(2),y:+((b.lat1-lat)/(b.lat1-b.lat0)*100).toFixed(2)});
const sched=it=>{const n=Math.ceil(it.price/it.amount);return Array.from({length:n},(_,i)=>it.freq==='weekly'?addD(it.start,7*i):addM(it.start,i));};
const cumF=it=>i=>Math.min(it.price,(i+1)*it.amount);
const initials=n=>n.split(' ').filter(Boolean).map(w=>w[0]).slice(0,2).join('').toUpperCase();
const txnId=(date,seq)=>'TX'+date.replace(/-/g,'').slice(2)+'-'+String(seq).padStart(4,'0');

function calcItem(it,pays){
 const dates=sched(it),cum=cumF(it),ps=pays.filter(p=>p.itemId===it.id);
 const paid=sum(ps.map(p=>p.amount)),paidBefore=sum(ps.filter(p=>p.date<TODAY).map(p=>p.amount));
 const cT=dates.filter(d=>d<=TODAY).length,cB=dates.filter(d=>d<TODAY).length;
 const expT=cT?cum(cT-1):0,expB=cB?cum(cB-1):0;
 const balance=Math.max(0,it.price-paid),overdue=Math.max(0,expB-paid),dueNow=Math.min(balance,Math.max(0,expT-paid)),dueToday=Math.max(0,dueNow-overdue);
 const ni=dates.findIndex((d,i)=>cum(i)>paid);
 const status=balance<=0?'DONE':overdue>0?'OVERDUE':dueToday>0?'DUE':cT===0?'UPCOMING':'PAID';
 return {dates,paid,balance,overdue,dueNow,dueToday,expectedToday:Math.max(0,expT-paidBefore),next:ni>=0?dates[ni]:null,status,
  missed:dates.filter((d,i)=>d<TODAY&&cum(i)>paid).length,oldest:dates.find((d,i)=>d<TODAY&&cum(i)>paid)||null,n:dates.length,last:dates[dates.length-1]};
}
function expectedOn(it,date,pays){const cum=cumF(it);const c=it.dates.filter(d=>d<=date).length;const e=c?cum(c-1):0;
 const pb=sum(pays.filter(p=>p.itemId===it.id&&p.date<date).map(p=>p.amount));return Math.max(0,e-pb);}

function buildSeed(){
 const OWNER_PHOTO='DATA_URI';
 const RPHOTOS=['DATA_URI','DATA_URI',''];
 const riders=[['R1','Kasun Perera','077 245 8812','Maharagama, Nugegoda','kasun'],['R2','Nimal Silva','071 903 4471','Kottawa, Homagama','nimal'],['R3','Tharindu Jayasinghe','076 118 2290','Piliyandala','tharindu']]
  .map(([id,name,phone,area,username],i)=>({id,name,phone,area,username,password:'1234',active:true,photo:RPHOTOS[i]}));
 const products=[['IR-101','Steam Iron',3900,5200,6400,'weekly',400,4,14],['FN-160','Pedestal Fan',5800,7900,9600,'weekly',600,4,9],['BL-300','Blender 3-Jar',4700,6500,8000,'weekly',500,4,11],
  ['RC-220','Rice Cooker 2.2L',7200,9800,12000,'weekly',500,6,8],['GC-200','Gas Cooker 2-Burner',14500,19500,24000,'weekly',1000,6,6],['PH-A15','Smartphone A15',31000,39500,48000,'monthly',4000,12,5],
  ['TV-320','32" LED TV',46000,59000,72000,'monthly',6000,12,4],['WM-700','Washing Machine 7kg',62000,79000,96000,'monthly',8000,12,3],['FR-250','Refrigerator 250L',78000,99000,120000,'monthly',10000,12,2]]
  .map(([code,name,purchase,cash,price,freq,amount,period,stock])=>({code,name,purchase,cash,price,freq,amount,period,stock,sold:0}));
 const PHOTOS=['DATA_URI','DATA_URI','DATA_URI','DATA_URI','DATA_URI','DATA_URI','DATA_URI','','DATA_URI','','DATA_URI','DATA_URI'];
 const customers=[['Saman Kumara','198812304567','077 512 3344','No. 14, Temple Road','Maharagama','R1',.004,-.003],['Dilani Fernando','917654321V','071 667 2108','22/3, Old Kesbewa Road','Maharagama','R1',-.005,.004],
  ['Ruwan Bandara','199203118842','075 334 9021','8, Stanley Thilakaratne Mw','Nugegoda','R1',.003,.005],['Chamari Wijesinghe','886540127V','072 880 4513','41, Pagoda Road','Nugegoda','R1',-.004,-.004],
  ['Pradeep Rathnayake','199507602231','078 221 6650','5A, High Level Road','Maharagama','R1',.001,.009],['Sunil Abeywickrama','197011209876','070 455 1902','17, Jambugasmulla Road','Nugegoda','R1',.008,.001],
  ['Nadeesha Gunawardena','199661903345','077 908 2231','63, Hokandara Road','Kottawa','R2',.003,-.002],['Asanka Herath','893120558V','071 225 7789','12, Makumbura Road','Kottawa','R2',-.004,.004],
  ['Malini Senanayake','197562004413','076 340 5512','9, Godagama Road','Homagama','R2',.004,.002],['Kumudu Dissanayake','199870112906','075 667 0981','28, Pitipana Road','Homagama','R2',-.003,-.005],
  ['Lahiru Madushanka','200012503378','078 773 4410','3, Kesbewa Road','Piliyandala','R3',.003,.003],['Ishara Peris','945230776V','072 119 6684','51, Moratuwa Road','Piliyandala','R3',-.004,-.002]]
  .map(([name,nic,phone,address,city,riderId,dl,dg],i)=>({id:'C'+(101+i),name,nic,phone,address,city,riderId,lat:+(AREAS[city][0]+dl).toFixed(5),lng:+(AREAS[city][1]+dg).toFixed(5),notes:'',photo:PHOTOS[i],since:TODAY}));
 const spec=[[0,'IR-101','2026-08-18',0,0],[1,'TV-320','2026-05-13',0,0],[1,'FN-160','2026-09-01',1,0],[2,'GC-200','2026-07-07',0,1],[3,'PH-A15','2026-03-05',2,0],[4,'BL-300','2026-08-20',0,0],
  [5,'RC-220','2026-09-29',1,0],[6,'FR-250','2026-02-13',0,1],[7,'IR-101','2026-07-14',3,0],[8,'WM-700','2026-04-20',0,0],[9,'RC-220','2026-09-15',0,0],[10,'FN-160','2026-06-02',0,0],
  [10,'TV-320','2026-10-20',0,0],[11,'GC-200','2026-08-11',0,1],[4,'IR-101','2026-01-06',0,0]];
 const items=spec.map(([ci,code,start],k)=>{const p=products.find(x=>x.code===code),c=customers[ci];p.sold++;
  return{id:'IT'+(k+1),customerId:c.id,riderId:c.riderId,code,name:p.name,price:p.price,freq:p.freq,amount:p.amount,period:p.period,start};});
 const pays=[];
 items.forEach((it,k)=>{const ds=sched(it),cum=cumF(it),amt=i=>cum(i)-(i?cum(i-1):0),before=ds.filter(x=>x<TODAY),n=before.length-spec[k][3];
  for(let i=0;i<n;i++)pays.push({itemId:it.id,customerId:it.customerId,riderId:it.riderId,amount:amt(i),date:before[i],time:pad(9+((i*3+k)%8))+':'+pad((i*17+k*11)%60)});
  if(spec[k][4]){const i=ds.indexOf(TODAY);pays.push({itemId:it.id,customerId:it.customerId,riderId:it.riderId,amount:amt(i),date:TODAY,time:'09:'+pad(12+k*2)});}});
 pays.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
 pays.forEach((p,i)=>{p.id='P'+(i+1);p.txn=txnId(p.date,i+1);p.status='completed';});
 customers.forEach(c=>{const st=items.filter(i=>i.customerId===c.id).map(i=>i.start).sort()[0];if(st)c.since=addD(st,-1);});
 const audit=[];const cp=pays.find(p=>p.itemId==='IT9'&&p.date==='2026-09-15');
 if(cp){cp.status='corrected';audit.push({id:'A1',date:'2026-09-15',time:'18:40',user:'Shop Owner',action:'Payment amount corrected',txn:cp.txn,ref:customers[7].name,old:fmt(4000),nw:fmt(cp.amount),reason:'Rider entered an extra zero. Verified against the customer receipt.'});}
 const notifs=pays.filter(p=>p.date===TODAY).map((p,i)=>({id:'N'+(i+1),type:'payment',title:'Payment received',text:fmt(p.amount)+' from '+customers.find(c=>c.id===p.customerId).name+' · '+riders.find(r=>r.id===p.riderId).name,date:TODAY,time:p.time,read:false})).reverse();
 notifs.push({id:'N0',type:'overdue',title:'Overdue alert',text:'4 customers have overdue installments.',date:TODAY,time:'08:00',read:false});
 return {v:1,seq:pays.length,shop:{name:'COLLECTO Demo Shop',phone:'011 285 4410',address:'112, High Level Road, Maharagama'},owner:{name:'Shop Owner',email:'owner@collecto.lk',username:'owner',password:'owner123',photo:OWNER_PHOTO},
  riders,products,customers,items,payments:pays,audit,notifs,closings:[]};
}
// CSS background value for a photo. The runtime splits inline styles on ';', which cuts
// 'url(data:image/jpeg;base64,...)' in half, so data URLs are served as cached blob: URLs instead.
const _bg=new Map();
function bg(p){if(!p)return 'none';if(!p.startsWith('data:'))return 'url('+p+')';let u=_bg.get(p);
 if(u===undefined){try{const i=p.indexOf(','),meta=p.slice(5,i),raw=meta.endsWith(';base64')?atob(p.slice(i+1)):decodeURIComponent(p.slice(i+1)),a=new Uint8Array(raw.length);
  for(let k=0;k<raw.length;k++)a[k]=raw.charCodeAt(k);u=URL.createObjectURL(new Blob([a],{type:meta.split(';')[0]}));}catch(e){u='';}_bg.set(p,u);}
 return u?'url('+u+')':'none';}
// Fill seed portraits into saved data that predates them; never overrides an uploaded photo or a renamed record.
// Fingerprints of an earlier demo photo set; saved copies of those are replaced with the current set.
const OLD_SEED_PHOTOS=new Set(['38Ns9qc2f3cLsP8A1NC4605DS+jFz346f8H/2Q==', '5PkUDGR7gsdtxvSo2wzSn6YSO4GahMhz0+BQB//Z', 'BqJXh8U75NxznjPH3/rqd4iu7TP/AGhtPlbVn//Z', 'DFSX23UYxUU48d264PQnanfEzCxySQM4oZB//9k=', 'ERj9zj6pu6FBROPgK15IDiCVsZv2laqc7ZSqP//Z', 'HUeWPQVF4BQ1uAkeIajpPqMQOtTLe7kumE//2Q==', 'P+a6jvuGuCJwsMXiXqHLcg8SU+zMdh8v0oP/2Q==', 'R3o63CtcNwNEIAJOS2UnCfTbj0NW0zWJRyYKM//Z', 'W0RKalSEyi1ETEuouNK5nTUD7KHrEMo4hcR5n//Z', 'aX6c9rcRyjvyncfUdRTmpYwTQNRmk26UhH//2Q==', 'cc4qMV9sWM588e9PEH7tCAM4OQRWpNONMmnUqP/Z', 'd9jX6mJPUDg8iOhrmQelR3WolYgZA265qrIo/9k=']);
function addSeedPhotos(d){const s=buildSeed();['customers','riders'].forEach(k=>(d[k]||[]).forEach(x=>{const o=s[k].find(y=>y.id===x.id&&y.name===x.name);if(o&&o.photo&&(!x.photo||OLD_SEED_PHOTOS.has(x.photo.slice(-40))))x.photo=o.photo;}));
 if(d.owner&&!d.owner.photo&&d.owner.name===s.owner.name)d.owner.photo=s.owner.photo;return d;}
window.CL={TODAY,pad,iso,pd,addD,addM,fmt,fd,fds,sum,nowT,ST,RANK,AV,AREAS,BOUNDS,proj,sched,cumF,initials,txnId,calcItem,expectedOn,buildSeed,addSeedPhotos,bg};
})();
