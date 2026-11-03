
class Component extends DCLogic {
  state = this.init();
  init(){
    const base={ready:false,role:null,riderId:null,page:'dashboard',sel:null,openItem:null,drawer:false,notifOpen:false,modal:null,f:{},toast:null,vw:typeof window!=='undefined'?window.innerWidth:1280,
      lg:{role:'owner',user:'owner@collecto.lk',pass:'owner123',remember:true,err:'',info:''},gq:'',cq:'',cst:'all',crd:'all',ist:'all',colDate:'2026-10-13',colRider:'all',colQ:'',colSt:'all',
      rep:'daily',repDate:'2026-10-13',repMonth:'2026-10',rp:'home',rSel:null,rBack:'home',mapSel:null,rq:'',rst:'all',collect:{},cErr:'',lastTx:null,cash:'',closeNote:'',closeErr:'',dbView:'board',dbRider:'all',dbFilt:false};
    return window.CL&&window.CLV?{...base,...this.boot()}:base;
  }
  boot(){
    let data=null;try{data=JSON.parse(localStorage.getItem('collecto-data-v1'));}catch(e){}
    if(!data||data.v!==1)data=CL.buildSeed();else CL.addSeedPhotos(data);
    let ss=null;try{ss=JSON.parse(localStorage.getItem('collecto-session-v1')||sessionStorage.getItem('collecto-session-v1'));}catch(e){}
    if(ss&&ss.role==='rider'&&!data.riders.find(r=>r.id===ss.riderId))ss=null;
    return {ready:true,data,role:ss?ss.role:null,riderId:ss?ss.riderId||null:null};
  }
  componentDidMount(){
    this._r=()=>this.setState({vw:window.innerWidth});window.addEventListener('resize',this._r);this._k=e=>{const t=document.activeElement;if(e.key==='Escape'&&(this.state.userMenu||this.state.notifOpen)){this.setState({userMenu:false,notifOpen:false});return;}if(e.key==='/'&&!(t&&/INPUT|TEXTAREA|SELECT/.test(t.tagName))){const i=document.querySelector('input[placeholder="Search anything"]');if(i){e.preventDefault();i.focus();}}};window.addEventListener('keydown',this._k);
    if(!this.state.ready){this._p=setInterval(()=>{if(window.CL&&window.CLV){clearInterval(this._p);this.setState(this.boot());}},50);}
  }
  componentWillUnmount(){window.removeEventListener('resize',this._r);clearInterval(this._p);clearTimeout(this._t);}
  componentDidUpdate(p,ps){if(this.state.data&&ps.data!==this.state.data){try{localStorage.setItem('collecto-data-v1',JSON.stringify(this.state.data));}catch(e){}}}
  toast(m){this.setState({toast:m});clearTimeout(this._t);this._t=setTimeout(()=>this.setState({toast:null}),3200);}
  save(){try{localStorage.setItem('collecto-data-v1',JSON.stringify(this.state.data));}catch(e){}}
  mut(fn){this.setState(s=>{const d=JSON.parse(JSON.stringify(s.data));fn(d);return{data:d};},()=>this.save());}
  setLg(o){this.setState(s=>({lg:{...s.lg,...o}}));}
  openCust(id){this.setState({role:'owner',page:'profile',sel:id,openItem:null,drawer:false,gq:'',notifOpen:false});}
  openModal(m,f){this.setState({modal:m,f:{err:'',...f},notifOpen:false});}
  closeModal(){this.setState({modal:null,f:{}});}
  err(e){this.setState(s=>({f:{...s.f,err:e}}));}
  openCustomerModal(){this.openModal('customer',{name:'',nic:'',phone:'',address:'',city:'',riderId:this.state.data.riders[0].id,notes:'',photo:'',lat:null,lng:null});}
  openItemModal(cid,code){const p=this.state.data.products.find(x=>x.code===code);const c=this.state.data.customers.find(x=>x.id===cid);
    this.openModal('item',{customerId:cid||'',code:code||'',price:p?String(p.price):'',freq:p?p.freq:'weekly',period:p?String(p.period):'',amount:p?String(p.amount):'',start:CL.addD(CL.TODAY,7),riderId:c?c.riderId:this.state.data.riders[0].id});}
  openRiderModal(r){this.openModal('rider',r?{id:r.id,name:r.name,phone:r.phone,area:r.area,username:r.username,password:'',active:r.active}:{id:'',name:'',phone:'',area:'',username:'',password:'',active:true});}
  setF(k,v){this.setState(s=>{const f={...s.f,[k]:v};
    if(s.modal==='item'){
      if(k==='code'){const p=s.data.products.find(x=>x.code===v);if(p)Object.assign(f,{price:String(p.price),freq:p.freq,period:String(p.period),amount:String(p.amount)});}
      if(k==='customerId'){const c=s.data.customers.find(x=>x.id===v);if(c)f.riderId=c.riderId;}
      if(['price','freq','period'].includes(k)){const cnt=f.freq==='weekly'?(+f.period)*4:(+f.period);if(+f.price>0&&cnt>0)f.amount=String(Math.ceil(f.price/cnt/10)*10);}
    }
    if(s.modal==='customer'&&k==='city'&&!s.f.pinned){const a=CL.AREAS[v.trim()];if(a){f.lat=a[0];f.lng=a[1];}}
    return{f};});}
  fs(){if(!this._fs){this._fs={};CLV.KEYS.forEach(k=>this._fs[k]=e=>this.setF(k,e.target.value));}return this._fs;}
  doLogin(){const {lg,data}=this.state;const u=lg.user.trim().toLowerCase();
    if(!u||!lg.pass)return this.setLg({err:'Enter your username and password.',info:''});
    let ss=null;
    if(lg.role==='owner'){const o=data.owner;if((u===o.email||u===o.username)&&lg.pass===o.password)ss={role:'owner'};}
    else{const ud=u.replace(/\D/g,'');const r=data.riders.find(r=>(r.username===u||(ud.length>=9&&r.phone.replace(/\D/g,'')===ud))&&r.password===lg.pass);
      if(r&&!r.active)return this.setLg({err:'This rider account is inactive. Please contact the owner.',info:''});
      if(r)ss={role:'rider',riderId:r.id};}
    if(!ss)return this.setLg({err:'Incorrect username or password.',info:''});
    try{(lg.remember?localStorage:sessionStorage).setItem('collecto-session-v1',JSON.stringify(ss));}catch(e){}
    this.setState({role:ss.role,riderId:ss.riderId||null,page:'dashboard',rp:'home',lg:{...lg,err:'',info:''}});}
  logout(){try{localStorage.removeItem('collecto-session-v1');sessionStorage.removeItem('collecto-session-v1');}catch(e){}
    this.setState(s=>({role:null,riderId:null,modal:null,notifOpen:false,drawer:false,lg:{...s.lg,pass:'',err:'',info:''}}));}
  saveCustomer(){const {f,data:d}=this.state;const nic=(f.nic||'').trim().toUpperCase(),ph=(f.phone||'').replace(/\D/g,'');
    let e='';
    if(!f.name||f.name.trim().length<3)e="Enter the customer's full name.";
    else if(!/^(\d{9}[VX]|\d{12})$/.test(nic))e='NIC must be 9 digits followed by V/X, or 12 digits.';
    else if(d.customers.some(c=>c.nic.toUpperCase()===nic))e='A customer with this NIC is already registered.';
    else if(ph.length!==10)e='Phone number must have 10 digits.';
    else if(!f.address.trim()||!f.city.trim())e='Enter the address and city/area.';
    else if(f.lat==null)e='Set the customer location on the map.';
    else if(!f.riderId)e='Assign a rider.';
    if(e)return this.err(e);
    const id='C'+(Math.max(...d.customers.map(c=>+c.id.slice(1)))+1);
    this.mut(x=>x.customers.push({id,name:f.name.trim(),nic,phone:ph.replace(/(\d{3})(\d{3})(\d{4})/,'$1 $2 $3'),address:f.address.trim(),city:f.city.trim(),riderId:f.riderId,lat:+f.lat.toFixed(5),lng:+f.lng.toFixed(5),notes:(f.notes||'').trim(),photo:f.photo||'',since:CL.TODAY}));
    this.setState({modal:null,f:{},page:'profile',sel:id});this.toast('Customer registered');}
  saveItem(){const {f,data:d}=this.state;const p=d.products.find(x=>x.code===f.code),price=+f.price,amount=+f.amount,period=+f.period;
    let e='';
    if(!f.customerId)e='Select a customer.';else if(!p)e='Select a product.';else if(p.stock<1)e='This product is out of stock. Add stock in Inventory first.';
    else if(!(price>0))e='Enter a valid price.';else if(!(period>0))e='Enter the payment period in months.';
    else if(!(amount>0)||amount>price)e='Amount per payment must be more than 0 and not more than the price.';
    else if(!f.start)e='Choose a start date.';else if(!f.riderId)e='Assign a rider.';
    if(e)return this.err(e);
    const id='IT'+(Math.max(0,...d.items.map(i=>+i.id.slice(2)))+1);
    this.mut(x=>{x.items.push({id,customerId:f.customerId,riderId:f.riderId,code:p.code,name:p.name,price,freq:f.freq,amount,period,start:f.start});const pp=x.products.find(y=>y.code===p.code);pp.stock-=1;pp.sold+=1;});
    this.setState({modal:null,f:{},page:'profile',sel:f.customerId});this.toast('Installment plan created · schedule generated');}
  saveProduct(){const {f,data:d}=this.state;const code=(f.code||'').trim().toUpperCase();const n=k=>+f[k];
    let e='';
    if(!code)e='Enter an item code.';else if(d.products.some(p=>p.code===code))e='This item code already exists.';else if(!(f.pname||'').trim())e='Enter the item name.';
    else if(!(n('purchase')>0&&n('cash')>0&&n('price')>0))e='Enter purchase, cash and installment prices.';
    else if(!(n('period')>0)||!(n('amount')>0))e='Enter the default plan (period and amount per payment).';
    else if(!(Number.isInteger(n('stock'))&&n('stock')>=0))e='Stock must be a whole number.';
    if(e)return this.err(e);
    this.mut(x=>x.products.push({code,name:f.pname.trim(),purchase:n('purchase'),cash:n('cash'),price:n('price'),freq:f.freq,amount:n('amount'),period:n('period'),stock:n('stock'),sold:0}));
    this.closeModal();this.toast('Product added');}
  saveStock(){const f=this.state.f,q=+f.qty;if(!(Number.isInteger(q)&&q>0))return this.err('Enter a whole number greater than 0.');
    this.mut(x=>{x.products.find(p=>p.code===f.code).stock+=q;});this.closeModal();this.toast(q+' unit(s) added to '+f.pname);}
  saveRider(){const {f,data:d}=this.state;const u=(f.username||'').trim().toLowerCase(),ph=(f.phone||'').replace(/\D/g,'');
    let e='';
    if(!f.name.trim())e='Enter the rider name.';else if(ph.length!==10)e='Phone number must have 10 digits.';else if(!f.area.trim())e='Enter the assigned area.';
    else if(!/^[a-z0-9._-]{3,}$/.test(u))e='Username must be at least 3 characters (letters, numbers, . _ -).';
    else if(d.riders.some(r=>r.username===u&&r.id!==f.id))e='This username is already taken.';
    else if(!f.id&&(f.password||'').length<4)e='Password must be at least 4 characters.';
    if(e)return this.err(e);
    const phone=ph.replace(/(\d{3})(\d{3})(\d{4})/,'$1 $2 $3');
    this.mut(x=>{if(f.id){const r=x.riders.find(r=>r.id===f.id);Object.assign(r,{name:f.name.trim(),phone,area:f.area.trim(),username:u,active:!!f.active});if(f.password)r.password=f.password;}
      else x.riders.push({id:'R'+(Math.max(...x.riders.map(r=>+r.id.slice(1)))+1),name:f.name.trim(),phone,area:f.area.trim(),username:u,password:f.password,active:!!f.active});});
    this.closeModal();this.toast(f.id?'Rider updated':'Rider account created');}
  saveCorrection(){const {f,data:d}=this.state;const a=+f.amount,p=d.payments.find(x=>x.id===f.payId);
    if(!(a>0))return this.err('Enter a valid amount.');if(a===p.amount)return this.err('The new amount is the same as the current amount.');
    if((f.reason||'').trim().length<5)return this.err('A reason is required for every correction.');
    const t=CL.nowT();
    this.mut(x=>{const q=x.payments.find(y=>y.id===p.id);const old=q.amount;q.amount=a;q.status='corrected';
      x.audit.unshift({id:'A'+(x.audit.length+1)+'-'+Date.now(),date:CL.TODAY,time:t,user:x.owner.name,action:'Payment amount corrected',txn:q.txn,ref:f.custName,old:CL.fmt(old),nw:CL.fmt(a),reason:f.reason.trim()});});
    this.closeModal();this.toast('Correction saved to audit log');}
  doCollect(){const s=this.state,D=this._D,c=D.cmap[s.rSel];const sel=c.act.filter(x=>s.collect[x.id]&&s.collect[x.id].on);
    if(!sel.length)return this.setState({cErr:'Select at least one item to collect.'});
    for(const x of sel){const v=+s.collect[x.id].val;if(!(v>0))return this.setState({cErr:'Enter an amount for '+x.name+'.'});if(v>x.balance)return this.setState({cErr:'Amount for '+x.name+' is more than its balance ('+CL.fmt(x.balance)+').'});}
    this.setState({cErr:'',modal:'confirm'});}
  submitPay(){const s=this.state,D=this._D,c=D.cmap[s.rSel],me=D.rmap[s.riderId];
    const sel=c.act.filter(x=>s.collect[x.id]&&s.collect[x.id].on&&+s.collect[x.id].val>0);
    let seq=s.data.seq;const t=CL.nowT();
    const np=sel.map(x=>{seq++;return{id:'P'+seq,txn:CL.txnId(CL.TODAY,seq),itemId:x.id,customerId:c.id,riderId:me.id,amount:Math.round(+s.collect[x.id].val),date:CL.TODAY,time:t,status:'completed'};});
    const total=CL.sum(np.map(p=>p.amount));
    this.mut(x=>{x.payments.push(...np);x.seq=seq;x.notifs.unshift({id:'N'+Date.now(),type:'payment',title:'Payment received',text:CL.fmt(total)+' from '+c.name+' · '+me.name,date:CL.TODAY,time:t,read:false});});
    this.setState({modal:null,rp:'success',collect:{},lastTx:{cust:c.name,custId:c.id,phone:c.phone,total,time:t,date:CL.TODAY,rider:me.name,lines:np.map(p=>({txn:p.txn,item:D.imap[p.itemId].code+' · '+D.imap[p.itemId].name,amount:p.amount}))}});
    this.toast('Payment recorded · owner notified');}
  submitClosing(exp,col,pend,count){const s=this.state,me=this._D.rmap[s.riderId];
    if(s.cash==='')return this.setState({closeErr:'Enter the cash amount you are submitting.'});
    const cash=+s.cash,t=CL.nowT(),diff=cash-col;
    if(diff!==0&&!s.closeNote.trim())return this.setState({closeErr:'Cash differs from collected amount. Add a note explaining the difference.'});
    this.mut(x=>{x.closings.push({id:'CL'+Date.now(),riderId:me.id,date:CL.TODAY,time:t,expected:exp,collected:col,pending:pend,cash,count,note:s.closeNote.trim()});
      x.notifs.unshift({id:'N'+Date.now(),type:'closing',title:'Daily closing submitted',text:me.name+' · collected '+CL.fmt(col)+', cash submitted '+CL.fmt(cash)+(diff?' (difference '+CL.fmt(diff)+')':''),date:CL.TODAY,time:t,read:false});});
    this.setState({cash:'',closeNote:'',closeErr:''});this.toast('Daily closing submitted');}
  exportCsv(r){const esc=v=>'"'+String(v).replace(/"/g,'""')+'"';
    const csv=[r.cols.map(c=>esc(c.v)).join(','),...r.rows.map(x=>x.cells.map(c=>esc(c.v)).join(','))].join('\n');
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='collecto-'+this.state.rep+'-report.csv';document.body.appendChild(a);a.click();a.remove();this.toast('Report exported as CSV');}
  copyReceipt(t){try{navigator.clipboard.writeText(t);this.toast('Receipt copied');}catch(e){}}
  onPhoto(e){const file=e.target.files&&e.target.files[0];if(!file)return;const r=new FileReader();
    r.onload=()=>{const img=new Image();img.onload=()=>{const c=document.createElement('canvas'),S=160,m=Math.min(img.width,img.height);c.width=c.height=S;
      c.getContext('2d').drawImage(img,(img.width-m)/2,(img.height-m)/2,m,m,0,0,S,S);this.setState(s=>({f:{...s.f,photo:c.toDataURL('image/jpeg',.8)}}));};img.src=r.result;};r.readAsDataURL(file);}
  onPin(e){const r=e.currentTarget.getBoundingClientRect(),b=CL.BOUNDS,px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height;
    this.setState(s=>({f:{...s.f,lat:b.lat1-py*(b.lat1-b.lat0),lng:b.lng0+px*(b.lng1-b.lng0),pinned:true}}));}
  modalVals(){const s=this.state,f=s.f||{},d=s.data,{fmt,fd,proj,BOUNDS,AREAS}=CL;
    const T={customer:'Register customer',item:'Add item / installment',product:'Add product',stock:'Add stock',rider:f.id?'Edit rider':'Add rider',correct:'Correct payment',confirm:'Confirm payment',receipt:'Digital receipt'};
    const v={hasModal:!!s.modal,md:{[s.modal||'none']:true},modalTitle:T[s.modal]||'',modalW:s.modal==='customer'?'760px':'540px',f,fs:this.fs(),fErr:!!f.err,
      closeModal:()=>this.closeModal(),closeModalBg:e=>{if(e.target===e.currentTarget)this.closeModal();},
      saveCustomer:()=>this.saveCustomer(),saveItem:()=>this.saveItem(),saveProduct:()=>this.saveProduct(),saveStock:()=>this.saveStock(),saveRider:()=>this.saveRider(),saveCorrection:()=>this.saveCorrection(),submitPay:()=>this.submitPay(),
      onPhoto:e=>this.onPhoto(e),onPin:e=>this.onPin(e),toggleActive:()=>this.setF('active',!f.active),
      mRiderOpts:d.riders.filter(r=>r.active||r.id===f.riderId).map(r=>({v:r.id,label:r.name+' — '+r.area})),areaOpts:Object.keys(AREAS).map(a=>({v:a})),
      custOpts:d.customers.map(c=>({v:c.id,label:c.name+' · '+c.nic})),prodOpts:d.products.map(p=>({v:p.code,label:p.code+' · '+p.name+' ('+p.stock+' in stock)'})),
      freqOpts:[{v:'weekly',label:'Weekly'},{v:'monthly',label:'Monthly'}],hasPhoto:!!f.photo,noPhoto:!f.photo,photoBg:CL.bg(f.photo)};
    if(s.modal==='customer'){v.pick={areas:CLV.mapLayer([],BOUNDS).areas,hasPin:f.lat!=null,pin:f.lat!=null?proj(f.lat,f.lng,BOUNDS):{x:0,y:0},coords:f.lat!=null?f.lat.toFixed(5)+', '+f.lng.toFixed(5):'Not set'};}
    if(s.modal==='item'){const price=+f.price,amount=+f.amount;const ok=price>0&&amount>0&&amount<=price&&f.start;
      if(ok){const ds=CL.sched({price,amount,freq:f.freq,start:f.start});v.prev={ok:true,text:ds.length+' '+f.freq+' payments of '+fmt(amount)+(price%amount?' (last '+fmt(price-amount*(ds.length-1))+')':''),range:fd(ds[0])+' → '+fd(ds[ds.length-1]),dates:ds.slice(0,6).map(x=>({d:fd(x)})),more:ds.length>6?'+ '+(ds.length-6)+' more':''};}
      else v.prev={ok:false};v.prevNo=!ok;v.custLocked=!!this._itemLock;}
    if(s.modal==='confirm'&&this._D){const c=this._D.cmap[s.rSel];if(c){const lines=c.act.filter(x=>s.collect[x.id]&&s.collect[x.id].on&&+s.collect[x.id].val>0).map(x=>({item:x.code+' · '+x.name,amountF:fmt(+s.collect[x.id].val)}));
      v.cf={cust:c.name,lines,totalF:fmt(CL.sum(lines.map(l=>+l.amountF.replace(/\D/g,''))))};}}
    if(s.modal==='receipt'&&s.lastTx){const l=s.lastTx;const txt=[d.shop.name,d.shop.address,'Payment receipt','Customer: '+l.cust,'Date: '+fd(l.date)+' '+l.time,...l.lines.map(x=>x.txn+'  '+x.item+'  '+fmt(x.amount)),'Total: '+fmt(l.total),'Collected by: '+l.rider].join('\n');
      v.rc={shop:d.shop.name,addr:d.shop.address,phone:d.shop.phone,cust:l.cust,when:fd(l.date)+' · '+l.time,rider:l.rider,totalF:fmt(l.total),lines:l.lines.map(x=>({...x,amountF:fmt(x.amount)})),copy:()=>this.copyReceipt(txt)};}
    return v;}
  renderVals(){
    const s=this.state;
    if(!s.ready)return{loading:true,isLogin:false,isOwner:false,isRider:false};
    this._D=CLV.derive(s.data);const D=this._D;
    const lr=s.lg.role==='rider';
    const v={loading:false,isLogin:!s.role,isOwner:s.role==='owner',isRider:s.role==='rider',shopName:s.data.shop.name,toast:s.toast,hasToast:!!s.toast,
      todayLabel:CL.pd(CL.TODAY).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}),
      lg:s.lg,lgHasErr:!!s.lg.err,lgHasInfo:!!s.lg.info,lgUserLabel:lr?'Username or phone':'Email or username',
      lgTab:{ownerBg:lr?'transparent':'#fff',ownerFg:lr?'#71717A':'#18181B',riderBg:lr?'#fff':'transparent',riderFg:lr?'#18181B':'#71717A'},
      lgOwner:()=>this.setLg({role:'owner',user:'owner@collecto.lk',pass:'owner123',err:'',info:''}),lgRider:()=>this.setLg({role:'rider',user:'kasun',pass:'1234',err:'',info:''}),
      lgUser:e=>this.setLg({user:e.target.value,err:''}),lgPass:e=>this.setLg({pass:e.target.value,err:''}),lgRemember:()=>this.setLg({remember:!s.lg.remember}),
      lgKey:e=>{if(e.key==='Enter')this.doLogin();},doLogin:()=>this.doLogin(),logout:()=>this.logout(),
      lgForgot:()=>this.setLg({err:'',info:lr?'Riders: ask the shop owner to reset your password from the Riders screen.':'A password reset link would be sent to the registered owner email. (Not connected in this demo.)'})};
    if(s.role==='owner')Object.assign(v,CLV.owner(this,s.vw<960));
    if(s.role==='rider')Object.assign(v,CLV.rider(this));
    Object.assign(v,this.modalVals());
    v.toastBottom=s.role==='rider'?'92px':'24px';
    return v;
  }
}
