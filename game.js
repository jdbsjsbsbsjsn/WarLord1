/* game.js — منطق بازی: قوانین، رابط پایه، جریان مبارزه و آنلاین، هوش مصنوعی */
/* ===== آنلاین: مولد تصادفی قابل‌تکرار (mulberry32) و وضعیت شبکه ===== */
let RS=(Date.now()^0x5bd1e995)|0;
let RNQ=null,RNBAD=0;   /* عددهای تصادفیِ همین دستور که سرور فرستاده (rn)؛ در بازی آنلاین مرورگر خودش عدد نمی‌سازد */
function RL(){if(RNQ){if(RNQ.length)return RNQ.shift();RNBAD++}RS=RS+0x6D2B79F5|0;let t=Math.imul(RS^RS>>>15,1|RS);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}
let offSince=0,oppOff=0,tryN=0,hidAt=0;
let ONLINE=false,ME=2,LOBBY=true,CONN=false,tmSent=0,MATCH=false,OFFG=false,oppName='',oppOn=true,abortInfo=null,swapped=false;
var BWdone=false;   /* نماد پیروزی برای این بازی نشان داده شده؟ */
var BOTG=false;   /* حالت تمرین با هوش مصنوعی: بازیکن آبی (۱) را ربات بازی می‌کند */
const mine=()=>(!ONLINE&&!(BOTG&&P===1))||(CONN&&!LOBBY&&ME===P);
/* انتخاب و چیدن هم‌زمان (فقط آنلاین): برای هر بازیکن یک وضعیت جدا نگه می‌داریم و دستور هر کس روی وضعیت خودش اجرا می‌شود */
var FIN=[false,false],DSV=null,DSW=false,BEGINQ=false,GT0=0,SOFF=0;   /* GT0 = لحظهٔ شروع انتخاب به ساعت سرور، SOFF = اختلاف ساعت این دستگاه با سرور */
const H={
acro:{n:'شوالیه آکروبات',i:'🤸',hp:1750,d:390,r:1,m:3,c:2,o1:1},
aka:{n:'آکاناها',i:'🥷',hp:1600,d:500,r:1,m:3,c:2,o1:1},
cri:{n:'کریمسون',i:'🩸',hp:4200,d:500,r:1,m:1,c:3},
doj:{n:'دوژینا',i:'🏹',hp:1650,d:400,r:1,m:2,c:2},
pri:{n:'شاهدخت',i:'👸',hp:1000,d:400,r:1,m:3,c:1},
raf:{n:'رافائل پیر',i:'🧙',hp:680,d:400,r:5,m:2,c:1},
bri:{n:'عروس مرده',i:'👰',hp:930,d:420,r:3,m:2,c:3},
ali:{n:'کماندو آلیس',hp:710,d:350,r:3,m:2,c:1},
mar:{n:'ژنرال مارسا',hp:820,d:200,r:4,m:2,c:1},
mak:{n:'ملکه‌ی ماکائو',hp:1000,d:500,r:4,m:2,c:1},
and:{n:'آندرومدا',hp:640,d:400,r:4,m:2,c:3},
zep:{n:'پدر ژپتو',hp:1200,d:840,r:4,m:2,c:4,o1:1},
jack:{n:'جک قاتل',hp:1650,d:480,r:5,m:2,c:2},
blk:{n:'سیاه بال',hp:3300,d:400,r:1,m:2,c:2,o1:2},
jal:{n:'جلاد',hp:1600,d:300,r:1,m:2,c:1},
ikh:{n:'اختفاگر',hp:1500,d:350,r:1,m:2,c:1},
col:{n:'ناخدا کلمب',hp:1900,d:410,r:1,m:2,c:2,o1:1},
ear:{n:'جادوگر زمین',hp:930,d:480,r:4,m:2,c:3,o1:1},
ik:{n:'پادشاه یخی',hp:1700,d:300,r:1,m:2,c:1},
iw:{n:'جادوگر یخ',hp:690,d:350,r:5,m:2,c:1},
mus:{n:'سایبرگ موساشی',hp:2350,d:550,r:1,m:3,c:1},
ske:{n:'پادشاه اسکلت',hp:1850,d:350,r:1,m:2,c:1},
bud:{n:'بودا',hp:610,d:220,r:3,m:2,c:2},
que:{n:'شهبانوی سیاه‌دل',hp:780,d:180,r:3,m:2,c:2},
fd:{n:'اژدهای آتشین',hp:2800,d:400,r:1,m:2,c:2,o1:1},
ft:{n:'اژدهای رعدآسا',hp:2800,d:250,r:1,m:2,c:1,o1:1},
mac:{n:'ماشین نبرد',hp:1500,d:400,r:5,m:2,c:1},
eld:{n:'الدوژ',hp:3100,d:180,r:1,m:2,c:0},
spg:{n:'نگهبان فضا',hp:1800,d:390,r:1,m:2,c:2,o1:1},
med:{n:'مدوسا',hp:3000,d:500,r:1,m:2,c:0},
eli:{n:'شوالیه‌ی نخبه',hp:2300,d:400,r:1,m:2,c:2},
ber:{n:'برزرکر',hp:1900,d:320,r:1,m:3,c:3,o1:1},
dk:{n:'پادشاه اهریمن',hp:2670,d:330,r:1,m:2,c:2},
gq:{n:'ملکه‌ی باروت',hp:1600,d:450,r:1,m:2,c:3},
dn:{n:'شوالیه‌ی اهریمن',hp:1600,d:350,r:1,m:2,c:1},
dw:{n:'ساحره‌ی اهریمن',hp:820,d:240,r:4,m:2,c:3,o1:1},
lich:{n:'الدرلیچ',i:'💀',hp:1500,d:300,r:1,m:1,c:0},pen:{n:'سارسار',i:'🐧',hp:900,d:130,r:1,m:2,c:0},mi:{n:'معدنچی',i:'⛏️',hp:1600,d:160,r:1,m:2,c:0},skl:{n:'اسکلت',i:'💀',hp:300,d:150,r:1,m:2,c:0}};const SMN={lich:1,pen:1,mi:1,skl:1};
const COLS=6,ROWS=8,SQ=Math.sqrt(3),DIR=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]],NM=['قرمز','آبی'],CL=['#e5483c','#3a8cf0'];
const toA=(c,r)=>[c,r-((c-(c&1))>>1)],toO=(q,r)=>[q,r+((q-(q&1))>>1)];
const inb=(c,r)=>c>=0&&c<COLS&&r>=0&&r<ROWS;
const cr=(q,r)=>{const s=-q-r;let rq=Math.round(q),rr=Math.round(r);const rs=Math.round(s),dq=Math.abs(rq-q),dr=Math.abs(rr-r),ds=Math.abs(rs-s);if(dq>dr&&dq>ds)rq=-rr-rs;else if(dr>ds)rr=-rq-rs;return[rq,rr]};
const dist=(a,b)=>{const[q1,r1]=toA(a.c,a.r),[q2,r2]=toA(b.c,b.r),dq=q1-q2,dr=r1-r2;return Math.max(Math.abs(dq),Math.abs(dr),Math.abs(dq+dr))};
const nb=(c,r)=>{const[q,s]=toA(c,r);return DIR.map(([a,b])=>toO(q+a,s+b)).filter(p=>inb(p[0],p[1]))};
const $=id=>document.getElementById(id),cv=$('cv');
let U,P,E,sel,mode,over,W,Hh,S,pad,msg='',MV=0,T=0,D=[0,0],ST=[],SC=[0,0],LOCK=0;
let NOGAME=true,phase='pick',DR={picks:[],pool:new Set(),offer:[]},dl=0,tray=null,unp=[];
const TR={acro:'مبارز شوالیه',aka:'سامورایی کاپیتان',raf:'اشرافی ساپورتر',cri:'تانک سرخ',doj:'کریسدور اشرافی',pri:'سامورایی اشرافی',bri:'نفرینی ساپورتر',ali:'سرخ ساپورتر',mar:'کاپیتان دوشیزگان',mak:'دوشیزگان اشرافی',and:'کهکشان ساپورتر',zep:'شکارچی ساچمه',jack:'شکارچی کاپیتان',blk:'مشکی اشرافی',jal:'شکارچی مشکی',ikh:'شکارچی نفرینی',col:'مبارز کاپیتان',ear:'راهب کریسدور',ik:'انجماد پادشاه',iw:'انجماد ساپورتر',mus:'ربات سامورایی',ske:'نفرینی پادشاه',bud:'راهب ساپورتر',que:'مشکی دوشیزگان',med:'تانک کاپیتان',mac:'ربات مبارز',fd:'اژدها سرخ',ft:'اژدها کاپیتان',eld:'کریسدور راهب',spg:'شوالیه کهکشان',eli:'شوالیه مشکی',ber:'مبارز سرخ',dk:'اهریمن پادشاه',dw:'اهریمن ساپورتر',dn:'اهریمن شوالیه',gq:'ساچمه اشرافی'};
for(const k in TR)TR[k]=TR[k].split(' ');
const at=(c,r)=>U.find(u=>u.hp>0&&u.c===c&&u.r===r);
let SY=[{},{}],CAB=false,FB=false,DX=[[],[]],SP=[[],[]],spl=null,shopOpen=false,shopTab=0;
const sy=(u,t,n)=>!!(u&&TR[u.k]&&TR[u.k].includes(t)&&(SY[u.o][t]|0)>=n);
function synStart(){SY=[0,1].map(o=>{const m={};U.filter(u=>u.o===o).forEach(u=>TR[u.k].forEach(t=>m[t]=(m[t]||0)+1));return m});
 [0,1].forEach(o=>{const mine=U.filter(u=>u.o===o),foe=U.filter(u=>u.o!==o),up=(u,p)=>{u.max=Math.round(u.max*(1+p));u.hp=Math.round(u.hp*(1+p))};
  const cp=SY[o]['کاپیتان']|0,cc=cp>=6?1.6:cp>=4?.8:cp>=2?.4:0;
  if(cc)up(mine.reduce((m,u)=>u.max>m.max?u:m),cc);
  if(SY[o]['نفرینی']>=4)foe.filter(u=>!sy(u,'مشکی',2)).sort((a,b)=>b.max-a.max).slice(0,2).forEach(u=>up(u,-.35));
  if(SY[o]['اهریمن']>=2)shuf(foe.filter(u=>!sy(u,'مشکی',2))).slice(0,4).forEach(u=>u.bl=5)})}
function add(k,o,c,r){const h=H[k],u={k,o,c,r,hp:h.hp,max:h.hp,mv:h.m,act:false,fly:0,weak:0,crit:0,ammo:6,ok:0,chg:0,bonus:0,used:false,sh2:2,fire:false,sn:0,kc:0,sc:0};U.push(u);return u}
/* ===== مرحلهٔ انتخاب و چیدن قهرمان (۱۶۰ ثانیه برای هر بازیکن) ===== */
function init(){NOGAME=false;clearTimeout(autoT);autoT=0;PK=[[],[]];SP=[[],[]];DX=[[],[]];zoneClear();smnGen++;LOCK=0;spl=null;shopOpen=false;U=[];P=0;T=0;E=[7,7];D=[0,0];ST=[];SC=[0,0];sel=null;mode='mv';over=false;MV=0;msg='';BWdone=false;try{if(window.hideBattleWin)hideBattleWin()}catch(_){}if(ONLINE)startDraftBoth();else startDraft(0)}
const shuf=a=>{for(let i=a.length-1;i>0;i--){const j=RL()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a},rnd=a=>a[RL()*a.length|0];
/* ===== اکسیر هیروها: هر هیرو هنگام انتخاب از همان ۴۲ اکسیرِ طلسم‌ها کم می‌کند؛ بدون اکسیر کافی خرید ممکن نیست ===== */
const XC={acro:5,aka:6,cri:11,doj:5,pri:4,raf:5,bri:5,ali:5,mar:4,mak:6,and:4,zep:7,jack:6,blk:8,jal:5,ikh:4,col:6,ear:6,ik:4,iw:4,mus:9,ske:5,bud:3,que:4,fd:8,ft:8,mac:6,eld:6,spg:5,med:10,eli:7,ber:5,dk:6,gq:6,dn:4,dw:6},XT=42,
 hc=k=>XC[k]|0,
 hCost=o=>(PK[o]||[]).reduce((s,k)=>s+hc(k),0),
 elLeft=o=>XT-spCost(o)-hCost(o),spLeft=o=>elLeft(o),
 afford=k=>phase==='pick'&&DR.pool.has(k)&&hc(k)<=elLeft(P);
let drClosed=false;
/* اگر هیچ‌کدام از کارت‌های پیشنهادی را نتوانی بخری ولی هیروی ارزان‌تری در چرخه مانده، یکی‌شان جایگزین می‌شود تا گیر نکنی */
function fixOff(o){if(o.some(afford))return o;const c=[...DR.pool].filter(afford);if(!c.length)return o;o=o.slice();o[o.length-1]=rnd(c);return o}
function finishPick(){phase='place';drClosed=false;DR.offer=[];if(!unp.includes(tray))tray=unp[0]||null}
function startDraft(o){shopOpen=false;drClosed=false;P=o;phase='pick';tray=null;sel=null;unp=[];dl=(ONLINE&&GT0?GT0+SOFF+3000:Date.now())+160000;
 DR={picks:[],pool:new Set(Object.keys(H).filter(k=>!(k in SMN))),offer:[]};PK[o]=DR.picks;DR.offer=mkOffer();draw()}
const dsSnap=()=>({P,phase,DR,unp,tray,sel,dl}),dsLoad=d=>{P=d.P;phase=d.phase;DR=d.DR;unp=d.unp;tray=d.tray;sel=d.sel;dl=d.dl};
function startDraftBoth(){FIN=[false,false];DSV=[null,null];DSW=true;BEGINQ=false;
 try{[0,1].forEach(o=>{startDraft(o);DSV[o]=dsSnap()});dsLoad(DSV[ME===1?1:0])}finally{DSW=false}draw()}
function mkOffer(){return fixOff(mkOffer0())}
function mkOffer0(){const pool=[...DR.pool],last=DR.picks[DR.picks.length-1];if(!last)return shuf(pool).slice(0,6);
 const[a,b]=TR[last],has=(k,t)=>TR[k].includes(t),A=pool.filter(k=>has(k,a)),B=pool.filter(k=>has(k,b)),o=[];
 const take=l=>{const c=l.filter(k=>!o.includes(k));if(c.length)o.push(rnd(c))};
 if(A.length&&B.length){/* هر جایگاه ترجیحاً قهرمانی می‌گیرد که فقط ویژگی خودش را دارد، تا دو قهرمان هم‌کمبو هم‌زمان پیشنهاد نشوند و یکی‌شان با نخریدن از چرخه حذف نشود */
  [{L:A,x:A.filter(k=>!has(k,b))},{L:B,x:B.filter(k=>!has(k,a))}].sort((p,q)=>p.L.length-q.L.length).forEach(s=>{const c=s.x.filter(k=>!o.includes(k));take(c.length?c:s.L)})}
 else if(A.length||B.length){const X=A.length?A:B;take(X);if(X.length>=2)take(X)}
 while(o.length<2){const c=pool.filter(k=>!o.includes(k));if(!c.length)break;o.push(rnd(c))}
 const N=pool.filter(k=>!o.includes(k)&&!has(k,a)&&!has(k,b)),F=pool.filter(k=>!o.includes(k));
 if(N.length||F.length)o.push(rnd(N.length?N:F));
 return shuf(o)}
function pick(k){if(ONLINE&&FIN[P])return;if(phase!=='pick'||!DR.offer.includes(k)||!afford(k))return;DR.pool.delete(k);DR.picks.push(k);unp.push(k);tray=k;sel=null;
 if(DR.picks.length<7&&[...DR.pool].some(afford))DR.offer=mkOffer();else finishPick();draw()}
function placeTap(c,r){if(phase==='play'||(ONLINE&&FIN[P]))return;const u=at(c,r),own=P===0?r>=4:r<4;
 if(u){if(u.o!==P)return;if(sel&&sel!==u&&!tray){[sel.c,u.c]=[u.c,sel.c];[sel.r,u.r]=[u.r,sel.r];sel=null}else{sel=u;tray=null}}
 else if(own){if(tray){add(tray,P,c,r);unp.splice(unp.indexOf(tray),1);tray=unp[0]||null;sel=null}else if(sel){sel.c=c;sel.r=r;sel=null}}
 draw()}
function randPlace(){if(ONLINE&&FIN[P])return;const f=[];for(let c=0;c<COLS;c++)for(let r=P?0:4;r<(P?4:8);r++)if(!at(c,r))f.push([c,r]);
 shuf(f);unp.splice(0).forEach(k=>{const p=f.pop();add(k,P,p[0],p[1])});tray=null}
function confirmPlace(){if(phase!=='place'||unp.length)return;if(ONLINE){if(FIN[P])return;FIN[P]=true;if(FIN[0]&&FIN[1])BEGINQ=true;return}if(P===0)startDraft(1);else beginPlay()}
function beginPlay(){shopOpen=false;phase='play';P=0;T=0;E=[7,7];D=[0,0];ST=[];SC=[0,0];sel=null;tray=null;mode='mv';over=false;LOG=[];lastMsg='';synStart();msg='بازی شروع شد. نوبت '+NM[0]+'.';startTurn();draw()}
setInterval(()=>{if(NOGAME||phase==='play'||!U||LOBBY||over)return;if(ONLINE&&FIN[ME]){$('tn').textContent='⏳';$('tn').style.color='';return}const s=Math.max(0,Math.ceil((dl-Date.now())/1000));$('tn').textContent=PX(s);$('tn').style.color=s<=10?'var(--bad)':'';
 if(s<1){if(!ONLINE)drTimeout();else if(P===ME&&!tmSent){tmSent=1;net({a:'to'})}}},250);
function drTimeout(){if(ONLINE&&FIN[P])return;tmSent=0;for(let g=0;g<20&&phase==='pick'&&DR.offer.length;g++){let a=DR.offer.filter(afford);if(!a.length){DR.offer=fixOff(DR.offer);a=DR.offer.filter(afford)}if(!a.length)break;pick(rnd(a))}if(phase==='pick')finishPick();if(phase==='place'){randPlace();confirmPlace()}}
function drUI(){if(BOTG&&P===1){$('dr').innerHTML='<div class="dh"><span>🤖 هوش مصنوعی در حال انتخاب و چیدن مهره‌هاست…</span></div>';return}if(ONLINE&&FIN[ME]){$('dr').innerHTML='<div class="dh"><span>✅ چیدمانت تأیید شد؛ منتظر '+esc(oppName)+' هستیم…</span></div>';return}let h;const X='<button type="button" class="dx" data-a="x">✕ بستن</button>',any=[...DR.pool].some(afford),
 hn=unp.length?'<div class="dp hn">'+(tray&&H[tray]?'📍 «'+esc(H[tray].n)+'» را همین حالا با زدن روی یکی از خانه‌های رنگیِ نیمهٔ خودت مستقر کن.':'📍 '+PX(unp.length)+' مهره هنوز چیده نشده؛ از لیست پایین یکی را انتخاب کن.')+'</div>':'';
 if(phase==='pick')h='<div class="dh"><span>'+NM[P]+': قهرمان '+PX(DR.picks.length+1)+' از ۷ را انتخاب کن</span><span class="xl">💧 '+PX(elLeft(P))+'</span>'+X+'</div>'+hn+'<div class="of">'
  +DR.offer.map(k=>{const q=H[k],ok=afford(k);return '<button type="button" class="oc t'+P+'" data-k="'+k+'"'+(ok?'':' disabled')+'><span class="r1"><b>'+esc(q.n)+'</b><span class="xc'+(ok?'':' no')+'">💧'+PX(hc(k))+'</span></span><span class="tr">'+TR[k].join(' · ')+'</span><small>جان '+PX(q.hp)+' · ضربه '+PX(q.d)+' · برد '+PX(q.r)+' · حرکت '+PX(q.m)+'</small></button>'}).join('')+'</div>'
  +(any?'':'<div class="dp">اکسیر کافی برای هیچ هیروی دیگری نداری.</div><button type="button" id="ok" data-a="fin">ادامه به چیدمان</button>')+(DR.picks.length?'<div class="dp"><b>انتخاب‌های قبلی و کمبوهایشان:</b><div class="pk">'+DR.picks.map((k,i)=>{const u=U.find(x=>x.k===k&&x.o===P),on=u?sel===u:tray===k;return '<div class="pc t'+P+(on?' on':'')+(u?' done':' un')+'" data-t="'+k+'"><span class="nm">'+PX(i+1)+'. '+esc(H[k].n)+' · 💧'+PX(hc(k))+'</span><small>'+(u?'✓ ':'⏳ ')+TR[k].join(' · ')+'</small></div>'}).join('')+'</div></div>':'');
 else h='<div class="dh"><span>'+NM[P]+': مهره‌ها را در نیمهٔ خودت بچین'+(unp.length?' ('+PX(unp.length)+' مانده)':'')+'</span><span class="xl">💧 '+PX(elLeft(P))+'</span>'+X+'</div><div class="tray">'
  +DR.picks.map(k=>{const u=U.find(x=>x.k===k&&x.o===P);return '<button type="button" class="tc'+((u?sel===u:tray===k)?' on':'')+(u?' done':'')+'" data-t="'+k+'">'+esc(H[k].n)+'</button>'}).join('')
  +'</div><div class="drb"><button type="button" data-a="r">چیدمان تصادفی</button><button type="button" id="ok" data-a="ok"'+(unp.length?' disabled':'')+'>تأیید چیدمان</button></div>';
 $('dr').innerHTML=h}
function startTurn(){const m=U.filter(u=>u.o===P&&!(u.k in SMN));U.filter(u=>u.o===P).forEach(u=>{u.mo=0;u.fm=0;if(u.inv&&u.k!=='ikh')u.inv=false;u.act=u.fr>0||u.jl>0;u.mv=u.act?0:Math.min(H[u.k].m+(sy(u,'تانک',2)?1:0),u.sl||u.sh>0?1:9);if(u.fz>0)u.mv=0;if(u.k in SMN){u.mv=0;u.act=true}
  if(sy(u,'شوالیه',2)){u.kn=u.kn||{};const th=[1,.75,.5,.25].filter(x=>u.hp<u.max*x-.5).pop();if(th&&!u.kn[th]){u.hp=Math.round(u.max*th);[1,.75,.5,.25].forEach(x=>{if(x>=th)u.kn[x]=1})}}});
 if(U.some(u=>u.o===P&&u.k==='mac'&&u.hp>0)){U.forEach(u=>{if(u.o!==P)u.hk=0});const e=U.filter(u=>u.o!==P&&!(u.k in SMN)&&!sy(u,'مشکی',2));if(e.length)e[RL()*e.length|0].hk=1}
 MV=(T<4?[3,4,5,5][T]:Math.floor(m.reduce((s,u)=>s+H[u.k].m,0)/2))+(SY[P]['پادشاه']>=2?1:0)}
function reach(u){const seen={};seen[u.c+','+u.r]=0;const q=[[u.c,u.r]];
 while(q.length){const[c,r]=q.shift(),d=seen[c+','+r];if(d>=1||MV<1||u.mv<1||(u.act&&!u.fm)||u.mb||(u.k==='ikh'&&!u.rel)||u.o!==P)continue;
  nb(c,r).forEach(([x,y])=>{const k=x+','+y;if(k in seen||at(x,y)||ST.some(s=>s.c===x&&s.r===y))return;seen[k]=d+1;q.push([x,y])})}
 delete seen[u.c+','+u.r];return seen}
const MS={doj:[2,200],jack:[12,40]};
const near=(a,t)=>{const v=U.filter(x=>x.hp>0&&x.o!==a.o&&!x.inv&&rng(a,x)&&!(x.fly>0&&H[a.k].r===1));return dist(a,t)===Math.min(...v.map(x=>dist(a,x)))};
const rng=(a,t)=>a.k==='mac'?(a.mb||dist(a,t)===1||(ld(a,t)>=0&&dist(a,t)<=5)):a.k==='bud'?(ld(a,t)>=0&&dist(a,t)<=3):dist(a,t)<=H[a.k].r;
const canHit=(a,t)=>t.o!==a.o&&rng(a,t)&&!t.inv&&!(t.fly>0&&H[a.k].r===1)&&(a.k!=='mak'||a.ammo>0)&&(a.k!=='gq'||a.sh2>0)&&a.mv>0&&MV>0&&near(a,t);
function hit(a,t,d){if(t.im>0)return 0;if(t.ar>0&&a.o!==t.o){t.ar=0;return 0}
 if(a.o!==t.o){d+=sy(a,'سرخ',4)?160:sy(a,'سرخ',2)?80:0;if(sy(t,'مبارز',4))d*=.6;
  const sm=sy(a,'سامورایی',4)?2:sy(a,'سامورایی',2)?1.5:0;if(sm&&RL()<1/3)d*=sm;
  if(sy(a,'شکارچی',4)&&t.hp<=t.max/2)d*=1.5;else if(sy(a,'شکارچی',2)&&t.hp<=t.max/3)d*=4/3;
  d*=(1+(a.bk|0)/100)*(a.al||1)*(a.rg>0?1.3:1)}
 if(a.weak||a.cu>0)d*=.5;if(a.ra>0)d*=1.25;if(t.wd===1&&a.o!==t.o){d*=1.25;t.wd=2}if(t.is>0){d*=.05;if(a.o!==t.o&&a.hp>0)a.hp=Math.max(0,a.hp-50)}else if(t.fz>0)d*=.5;if(t.mk>0)d*=1.25;if(t.k==='med'&&d>0)t.sn=Math.min(6,(t.sn|0)+1);if(a.bf>0)d*=a.bm;if(a.dm)d*=a.dm;if(a.crit>0&&RL()<.5)d*=2;if(t.sh>0)d*=.1;d=Math.round(d);t.hp=Math.max(0,t.hp-d);if(a.o!==t.o&&sy(a,'شوالیه',4))a.hp=Math.min(a.max,a.hp+Math.round(d*.25));
 if(t.hp<=0&&sy(t,'راهب',3)&&!t.imu){t.imu=1;t.hp=1;t.im=4}
 if(t.hp<=0&&sy(t,'ربات',2)&&!t.dd2){t.dd2=1;U.filter(x=>x.hp>0&&x.o!==t.o&&dist(t,x)===1).forEach(x=>x.hp=Math.max(0,x.hp-Math.round(t.max*.4)))}
 if(t.hp<=0&&!t.dd){if(t.k==='bud'&&a.o!==t.o){t.dd=1;boom(t)}if(t.k==='fd'){t.dd=1;U.filter(x=>x.hp>0&&x!==t&&x.o!==t.o&&dist(t,x)===1).forEach(x=>x.hp=Math.max(0,x.hp-800))}}
 return d}
function line(u,t){const d=ld(u,t);if(d<0)return{ens:[],ok:false};const ens=U.filter(x=>x.hp>0&&x.o!==u.o&&!x.inv&&ld(u,x)===d);
 const far=ens.reduce((m,x)=>dist(u,x)>dist(u,m)?x:m),[q,r]=toA(far.c,far.r),[lc,lr]=toO(q+DIR[d][0],r+DIR[d][1]);
 return{ens,lc,lr,ok:inb(lc,lr)&&!at(lc,lr)}}
function acroPlan(u){const en=U.filter(x=>x.hp>0&&x.o!==u.o&&!x.fly&&!x.inv);let best=null;
 const go=(path,cur)=>{nb(cur.c,cur.r).forEach(([c,r])=>{const x=en.find(e=>e.c===c&&e.r===r);if(x&&!path.includes(x))go([...path,x],x)});
  if(path.length)nb(cur.c,cur.r).forEach(([c,r])=>{if(at(c,r))return;const sv=U.filter(y=>y.hp>(path.includes(y)?390:0)&&y.o!==u.o),adj=sv.filter(y=>dist({c,r},y)===1).length,a2=sv.filter(y=>dist({c,r},y)===2).length,sc=path.length*100-adj*10-a2;if(!best||sc>best.sc)best={sc,path,exit:[c,r]}})};
 go([],u);return best}
function abT(u){if(u.rt>0)return[];const k=u.k,al=U.filter(x=>x.hp>0&&x.o===u.o),en=U.filter(x=>x.hp>0&&x.o!==u.o&&!x.inv);
 if(H[k].o1&&u.used>=H[k].o1)return[];if(u.hk||u.bl>0)return[];
 if(k==='acro'){const p=acroPlan(u);return p?[p.path[0]]:[]}
 if(k==='aka')return en.filter(t=>ld(u,t)>=0&&line(u,t).ok);
 if(k==='cri')return[u];
 if(k==='doj')return en.some(t=>dist(u,t)<=3)?[u]:[];
 if(k==='bri')return nb(u.c,u.r).filter(([x,y])=>!at(x,y)).map(([c,r])=>({c,r}));
 if(k==='pri')return al.length>1?[u]:[];
 if(k==='ali')return en.filter(t=>ld(u,t)>=0&&!t.fly);
 if(k==='mar')return al.filter(t=>t!==u&&dist(u,t)<=4);
 if(k==='mak')return u.ammo<6?[u]:[];
 if(k==='and')return u.chg>=1010?en.filter(t=>dist(u,t)<=4):[];
 if(k==='zep'||k==='fd'||k==='dk')return nb(u.c,u.r).map(([c,r])=>({c,r}));
 if(k==='jack')return en.filter(t=>dist(u,t)<=5&&near(u,t));
 if(k==='spg')return en.some(t=>dist(u,t)===1)?[u]:[];
 if(k==='eli')return en.filter(t=>dist(u,t)===2&&nb(t.c,t.r).some(([c,r])=>dist({c,r},u)===1&&fr(c,r)));
 if(k==='ber')return en.filter(t=>dist(u,t)===1&&!t.fly&&near(u,t));
 if(k==='gq')return u.sh2<1?[u]:[];
 if(k==='dn')return[u];
 if(k==='dw')return en.some(t=>!(t.k in SMN))?[u]:[];
 if(k==='blk')return en.filter(t=>dist(u,t)===1&&!t.fly);
 if(k==='jal')return en.length?[u]:[];
 if(k==='ikh')return u.rel?[]:[u];
 if(k==='col')return D[1-u.o]>0?[u]:[];
 if(k==='ear')return ST.some(s=>s.o===u.o&&s.heal>0)?[u]:[];
 if(k==='ik'||k==='iw')return en.filter(t=>rng(u,t)&&!(t.fly&&H[k].r===1));
 if(k==='mus'||k==='bud')return[u];
 if(k==='ske')return en.some(t=>!(t.k in SMN))?[u]:[];
 if(k==='que')return en.some(t=>rng(u,t)&&near(u,t))?[u]:[];
 if(k==='ft')return en.filter(t=>dist(u,t)===1&&!t.fly&&near(u,t));
 if(k==='mac')return u.d2?[]:u.mb?(en.length?[u]:[]):[u];
 if(k==='raf')return[u];
 return[]}
/* کمبوی دوشیزگان: با مرگ هر دوشیزه، ۵۰٪ از آسیب فعلی‌اش به هر دوشیزهٔ زندهٔ هم‌تیمی اضافه می‌شود (به دوشیزه‌های مرده چیزی نمی‌رسد) */
const curDmg=u=>(u.k==='mar'?200+(u.bonus|0):H[u.k].d)+(u.md|0);
function maidenDeaths(){U.filter(u=>u.hp<=0&&!u.mdd&&sy(u,'دوشیزگان',2)).forEach(u=>{u.mdd=1;const g=Math.round(curDmg(u)*.5);U.filter(x=>x!==u&&x.hp>0&&x.o===u.o&&TR[x.k]&&TR[x.k].includes('دوشیزگان')).forEach(x=>{x.md=(x.md|0)+g})})}
function minerBlast(){{const L=U.filter(u=>u.k==='mi'&&u.hp<=0&&!u.bx);if(!L.length)return;L.forEach(u=>{u.bx=1;nb(u.c,u.r).forEach(([c,r])=>{const t=U.find(x=>x.hp>0&&x.o!==u.o&&x.c===c&&x.r===r);if(t)sdm(t,320)});try{const p=V3(u.c,u.r);burst(p,60,0xff9a2a,{sp:4,vy:3,size:.5,life:.9});ring(p,0xffc04a,3.2,.8);shk=Math.max(shk,1)}catch(_){}msg='معدنچی منفجر شد و به دشمن‌های اطرافش ۳۲۰ آسیب زد.'});U.forEach(u=>{if(u.k==='mi'&&u.hp<=0)u.bx=1})}}
function after(){
 minerBlast();maidenDeaths();U.filter(u=>u.hp<=0&&!(u.k in SMN)).forEach(u=>{D[u.o]++;if(u.k==='mak')say('But I was the queen',0,'mak');if(sy(u,'پادشاه',3))U.filter(x=>x.o===u.o&&x.hp>0).forEach(x=>x.rg=2);if(u.k!=='ear'&&SC[u.o]<3&&U.some(x=>x.hp>0&&x.k==='ear'&&x.o===u.o)){SC[u.o]++;ST.push({k:u.k,o:u.o,c:u.c,r:u.r,heal:0,max:u.max,used:u.used})}});
 U.filter(u=>u.hp<=0&&!(u.k in SMN)).forEach(u=>DX[u.o].push(u));U=U.filter(u=>u.hp>0);U.forEach(u=>{if(u.act&&u.k==='ikh')u.inv=false});
 [0,1].forEach(o=>{const n=SY[o]['اشرافی']|0,p=n>=6?2.4:n>=4?1.2:n>=2?.4:0,al=U.filter(u=>u.o===o&&sy(u,'اشرافی',2));if(p&&al.length===1&&!al[0].alx){const u=al[0];u.alx=1;u.max=Math.round(u.max*(1+p));u.hp=Math.round(u.hp*(1+p));u.al=1+p}});if(sel&&!U.includes(sel))sel=null;mode='mv';
 const lost=[0,1].find(o=>!U.some(u=>u.o===o&&!(u.k in SMN)));
 if(lost!==undefined){over=true;msg='🏆 بازیکن '+NM[1-lost]+' برنده شد!'}
 draw()}
const base=(a,t)=>(a.md|0)+(a.k==='pen'?(RL()<.5?260:130):a.k==='zep'?[840,630,420,210][dist(a,t)-1]:a.k==='dn'?H.dn.d*(((a.sc|0)+1)%3===0?2:1):a.k==='med'?H.med.d+50*(a.sn|0):a.k==='mar'?200+a.bonus:a.k==='que'?180+(t.max>=1620?.18*t.max:t.max>=810?.09*t.max:0):a.k==='ikh'&&!U.some(x=>x.hp>0&&x.o===a.o&&x!==a&&dist(a,x)===1)?H.ikh.d*2.5:H[a.k].d);
function ld(a,t){const[q1,r1]=toA(a.c,a.r),[q2,r2]=toA(t.c,t.r),dq=q2-q1,dr=r2-r1,k=Math.max(Math.abs(dq),Math.abs(dr),Math.abs(dq+dr));if(!k)return-1;return DIR.findIndex(([x,y])=>x*k===dq&&y*k===dr)}
function macBomb(u){U.filter(x=>x.hp>0&&x.o!==u.o&&!x.inv&&x.bb>0).forEach(x=>{hit(u,x,90*x.bb);x.bb=0})}
function boom(u){U.filter(x=>{if(x.hp<=0||x.o===u.o)return false;const d=ld(u,x);return d===2||d===5}).forEach(x=>hit(u,x,660))}
function fin(a,m){a.act=true;a.mv=0;MV--;msg=m||H[a.k].n+' ضربه زد.';after()}
function cost(u){return Math.max(0,(u.k==='mac'&&u.mb?2:H[u.k].c)-(sy(u,'ساچمه',2)?1:0))}
function chain(a,t){const p=[t],nn=x=>U.filter(z=>z.hp>0&&z.o!==a.o&&!z.inv&&dist(x,z)===1);for(let i=0;i<2;i++){const c=nn(p[p.length-1]).filter(z=>!p.includes(z)).sort((x,y)=>y.hp-x.hp||nn(y).length-nn(x).length);if(!c.length)break;p.push(c[0])}return p}
function fr(c,r){return !at(c,r)&&!ST.some(s=>s.c===c&&s.r===r)}
function rage(u,t){let c=t,left=16;while(left>0){if(c.hp<=0){const e=U.filter(x=>x.hp>0&&x.o!==u.o&&!x.inv);if(!e.length)break;c=e.sort((a,b)=>dist(u,a)-dist(u,b))[0];if(dist(u,c)>1){const n=nb(c.c,c.r).filter(([a,b])=>fr(a,b)).sort((p,q)=>dist({c:p[0],r:p[1]},u)-dist({c:q[0],r:q[1]},u))[0];if(!n)break;u.c=n[0];u.r=n[1]}}hit(u,c,160);left--}}
function dkZone(u,t){const[q0,r0]=toA(u.c,u.r),[q1,r1]=toA(t.c,t.r),d=DIR.findIndex(([a,b])=>q1-q0===a&&r1-r0===b),A=DIR[(d+5)%6],B=DIR[d],C=DIR[(d+1)%6],L=[[q1,r1]],R=[];let q=q0+2*A[0],r=r0+2*A[1];for(let j=0;j<2;j++){q+=B[0]-A[0];r+=B[1]-A[1];R.push([q,r])}q+=C[0]-B[0];r+=C[1]-B[1];R.push([q,r]);
 R.forEach(([a,b])=>{for(let j=0;j<3;j++)L.push([a+B[0]*j,b+B[1]*j])});return L.map(([a,b])=>toO(a,b)).filter(p=>inb(p[0],p[1]))}
function volley(a,n,dm){const r={};for(let i=0;i<n;i++){const v=U.filter(x=>x.hp>0&&x.o!==a.o&&dist(a,x)<=H[a.k].r&&!(x.fly>0&&H[a.k].r===1));if(!v.length)break;const m=Math.min(...v.map(x=>dist(a,x))),w=v.filter(x=>dist(a,x)===m),x=w[RL()*w.length|0];r[x.k]=(r[x.k]||0)+hit(a,x,dm)}return r}
function attack(a,t){const mv0=a.mv,M0=MV;attack0(a,t);if(a.hp>0&&a.act){
 if(sy(a,'کریسدور',4)&&RL()<.5){a.act=false;a.mv=mv0;MV=M0;msg+=' — حملهٔ مجدد!'}else if(sy(a,'کریسدور',2)){a.fm=1;a.mv=Math.max(0,mv0-1)}draw()}}
function attack0(a,t){
 if(MS[a.k]){const r=volley(a,...MS[a.k]);a.act=true;a.mv=0;MV--;msg=H[a.k].n+': '+Object.entries(r).map(([k,v])=>H[k].n+' '+v).join('، ');after();return}
 {const w=U.filter(x=>x.hp>0&&x.o!==a.o&&canHit(a,x));if(w.length&&!sy(a,'مبارز',2))t=w[RL()*w.length|0]}
 if(a.k==='jal'){U.filter(x=>x.hp>0&&x.o!==a.o&&dist(a,x)===1&&!x.fly&&!x.inv).forEach(x=>hit(a,x,300));return fin(a,'جلاد چرخید و همهٔ دشمنان کنارش را زد.')}
 if(a.k==='ft'){chain(a,t).forEach((x,i)=>hit(a,x,[250,200,150][i]));return fin(a)}
 if(a.k==='bud'){const s=ld(a,t);U.filter(x=>x.hp>0&&x.o!==a.o&&ld(a,x)===s&&dist(a,x)<=6).forEach(x=>hit(a,x,220));return fin(a)}
 if(a.k==='mac'){if(a.mb){const e=U.filter(x=>x.hp>0&&x.o!==a.o&&!x.inv);for(let i=0;i<4&&e.length;i++){const x=e[RL()*e.length|0];x.bb=(x.bb||0)+1}return fin(a,'ماشین نبرد ۴ بمب چسباند.')}
  if(dist(a,t)===1){zep(a,t,[400,200]);return fin(a)}
  for(let i=0;i<20;i++){let x=t;if(dist(a,t)<5&&RL()<.5){const b=U.filter(y=>y.hp>0&&y.o!==a.o&&ld(a,y)===ld(a,t)&&dist(a,y)>dist(a,t)&&dist(a,y)<=5).sort((p,q)=>dist(a,p)-dist(a,q))[0];if(b)x=b}hit(a,x,20)}return fin(a)}
 if(a.k==='gq'){a.sh2--;if(a.fire){zep(a,t,[900,300]);return fin(a)}}
 if(a.k==='mak'){a.ammo--;if(a.ok>=5||RL()<1/6){a.ok=0;t=a}else a.ok++}
 const d=hit(a,t,base(a,t));let ex='';
 if(a.k==='raf'){const D=dist(a,t),[q1,r1]=toA(a.c,a.r),[q2,r2]=toA(t.c,t.r);[200,100].forEach((v,i)=>{const f=(D+i+1)/D,[c,y]=toO(...cr(q1+(q2-q1)*f,r1+(r2-r1)*f)),x=inb(c,y)&&at(c,y);if(x&&x.o!==a.o){hit(a,x,v);ex+=' و '+v+' به '+H[x.k].n}})}
 if(a.k==='bri'&&t.hp>0&&!sy(t,'مشکی',2))t.weak=1;
 if(a.k==='and')a.chg=Math.min(2000,a.chg+d);if(a.k==='mar'&&t!==a&&t.hp<=0)a.bonus+=200;
 if(a.k==='ske'&&RL()<.5){const[q1,r1]=toA(a.c,a.r),[q2,r2]=toA(t.c,t.r),[c,w]=toO(2*q2-q1,2*r2-r1),v=inb(c,w)&&at(c,w);if(v&&v.o!==a.o)hit(a,v,H.ske.d/2)}
 if((a.k==='ik'||a.k==='iw')&&t.hp>0&&!sy(t,'سرخ',2))t.sl=1;
 if(sy(a,'انجماد',2)&&t.hp>0&&!sy(t,'سرخ',2)&&RL()<2/3)t.fr=1;
 if(a.k==='med'&&!sy(t,'مشکی',2)&&RL()<(a.sn|0)/6)t.ps=2;
 if(a.k==='dw'){window.DWSPL=1;try{U.filter(x=>x.hp>0&&x.o!==a.o&&x!==t&&dist(t,x)===1).forEach(x=>hit(a,x,d))}finally{window.DWSPL=0}}
 if(a.k==='dn')a.sc=(a.sc|0)+1;
 if(a.k==='dk'){const f=(a.kc|0)>=3||RL()<.5;a.kc=f?0:(a.kc|0)+1;if(f&&t.hp>0){const[q1,r1]=toA(a.c,a.r),[q2,r2]=toA(t.c,t.r),[c,w]=toO(2*q2-q1,2*r2-r1);if(inb(c,w)&&fr(c,w)){t.c=c;t.r=w}else{try{dkBlocked(a,t)}catch(e){}}}}
 if(a.k==='ear'){const s=ST.filter(z=>z.o===a.o);s.forEach(z=>z.heal=Math.min(z.max,z.heal+H.ear.d/s.length))}
 if(a.k==='eld'){const w=U.filter(x=>x.o===a.o&&x!==a&&x.hp>0&&x.hp<x.max&&dist(a,x)<=2).sort((p,q)=>p.hp/p.max-q.hp/q.max)[0];if(w)w.hp=Math.min(w.max,w.hp+240)}
 a.act=true;a.mv=0;MV--;msg=H[a.k].n+' به '+H[t.k].n+' '+d+' آسیب زد'+ex+'.';after()}
function zep(u,t,DM=[840,630,420,210]){const[q0,r0]=toA(u.c,u.r),[q1,r1]=toA(t.c,t.r),d=DIR.findIndex(([a,b])=>q1-q0===a&&r1-r0===b),A=DIR[(d+5)%6],B=DIR[d],C=DIR[(d+1)%6];
 DM.forEach((dm,i)=>{const k=i+1;let q=q0+k*A[0],r=r0+k*A[1];const L=[];
  for(let j=0;j<k;j++){q+=B[0]-A[0];r+=B[1]-A[1];L.push([q,r])}
  for(let j=1;j<k;j++){q+=C[0]-B[0];r+=C[1]-B[1];L.push([q,r])}
  L.forEach(([a,b])=>{const[c,w]=toO(a,b),x=inb(c,w)&&at(c,w);if(x&&x.o!==u.o)hit(u,x,dm)})})}
function useAb(u,t){if(u.rt>0){msg='ریشه‌های رز ابلیتی را قفل کرده است.';draw();return}CAB=true;try{useAb0(u,t)}finally{CAB=false}}
function useAb0(u,t){
 const k=u.k;E[u.o]-=cost(u);msg=H[k].n+' قابلیت را زد.';
 if(k==='acro'){const p=acroPlan(u);p.path.forEach(x=>hit(u,x,390));u.c=p.exit[0];u.r=p.exit[1]}
 if(k==='aka'){const L=line(u,t);L.ens.forEach(x=>hit(u,x,500));u.c=L.lc;u.r=L.lr;u.crit=2}
 if(k==='cri')t.hp=Math.min(t.max,t.hp+2200);
 if(k==='doj'){const w=U.filter(x=>x.hp>0&&x.o!==u.o&&!x.inv&&dist(u,x)<=3);t=w[RL()*w.length|0];hit(u,t,400);u.hp=Math.min(u.max,u.hp+350)}
 if(k==='pri'){const b=U.filter(x=>x.o===u.o&&x!==u).reduce((m,x)=>x.hp>m.hp?x:m);b.hp=Math.max(0,b.hp-100);u.hp+=350}
 if(k==='raf')u.fly=3;
 if(k==='ali')hit(u,t,600);
 if(k==='mar'){hit(u,t,200+u.bonus+(u.md|0));if(t.hp<=0)u.bonus+=200}
 if(k==='mak'){u.ammo=6;u.ok=0}
 if(k==='and'){hit(u,t,Math.min(2000,u.chg));u.chg=0}
 if(k==='jack'){const r=volley(u,6,120);msg=H[k].n+' قابلیت: '+Object.entries(r).map(([x,v])=>H[x].n+' '+v).join('، ')}
 if(k==='zep')zep(u,t);
 if(k==='spg'){const e=U.filter(x=>x.hp>0&&x.o!==u.o&&!x.inv);e.forEach(x=>{const s=new Set([x]),q=[x];while(q.length){const y=q.pop();e.forEach(z=>{if(!s.has(z)&&dist(y,z)===1){s.add(z);q.push(z)}})}x.cl=Math.min(5,s.size)});const root=e.filter(x=>dist(u,x)===1),chain=new Set(root),qq=[...root];while(qq.length){const y=qq.pop();e.forEach(z=>{if(!chain.has(z)&&dist(y,z)===1){chain.add(z);qq.push(z)}})}[...chain].forEach(x=>hit(u,x,70*x.cl))}
 if(k==='eli'){hit(u,t,120);if(!sy(t,'مشکی',2))t.mk=2;const m=nb(t.c,t.r).find(([c,r])=>dist({c,r},u)===1&&fr(c,r));if(m){u.c=m[0];u.r=m[1]}hit(u,t,H.eli.d)}
 if(k==='ber')rage(u,t);
 if(k==='dk')dkZone(u,t).forEach(([c,r])=>{const x=at(c,r);if(x&&x.o!==u.o){hit(u,x,140);if(!sy(x,'مشکی',2))x.bl=3}});
 if(k==='gq'){u.sh2=2;u.fire=true}
 if(k==='dn'){if(RL()<.5){u.ar=1;msg=H[k].n+': زره نشکن گرفت.'}else{for(let i=0;i<6;i++){const h2=U.filter(x=>x.hp>0&&x.o!==u.o&&!x.inv&&!(x.k in SMN)),p=h2.length?h2:U.filter(x=>x.hp>0&&x.o!==u.o&&!x.inv);if(!p.length)break;hit(u,p[RL()*p.length|0],70)}msg=H[k].n+': ۶ شمشیر از بالا.'}}
 if(k==='dw'){const e=U.filter(x=>x.hp>0&&x.o!==u.o&&!(x.k in SMN)&&!x.inv).sort((a,b)=>a.hp-b.hp)[0];if(e)hit(u,e,820)}
 if(k==='fd')zep(u,t,[400,400]);
 if(k==='blk'){u.hp=Math.min(u.max,u.hp+600);hit(u,t,400)}
 if(k==='jal'){const e=U.filter(x=>x.hp>0&&x.o!==u.o&&!x.inv);u.axT=[];for(let i=0;i<2&&e.length;i++){const x=e[RL()*e.length|0];u.axT.push(x);hit(u,x,200)}}
 if(k==='ikh')u.rel=true;
 if(k==='col'){const n=Math.min(3,D[1-u.o]);u.hp+=Math.round(H.col.hp*.22*n);u.bm=1+.22*n;u.bf=3}
 if(k==='ear'){ST.filter(s=>s.o===u.o&&s.heal>0).forEach(s=>{const x=add(s.k,s.o,s.c,s.r);x.hp=Math.min(x.max,Math.round(s.heal));x.used=s.used});ST=ST.filter(s=>s.o!==u.o)}
 if(k==='ik'||k==='iw'){hit(u,t,H[k].d);if(!sy(t,'سرخ',2)){t.fr=1;t.sl=1}}
 if(k==='mus')u.sh=3;
 if(k==='ske'){const e=U.filter(x=>x.hp>0&&x.o!==u.o&&!(x.k in SMN)&&!x.inv),x=e[RL()*e.length|0];hit(u,x,350);x.jl=2;msg=H[k].n+': '+H[x.k].n+' زندانی شد.'}
 if(k==='bud'){u.dd=1;boom(u);u.hp=0}
 if(k==='que'){const w=U.filter(x=>x.hp>0&&x.o!==u.o&&!x.inv&&rng(u,x)&&near(u,x)),x=w[RL()*w.length|0];hit(u,x,x.max>2430?180+.36*x.max:base(u,x))}
 if(k==='ft')chain(u,t).forEach((x,i)=>{hit(u,x,[250,200,150][i]);if(!sy(x,'مشکی',2)){x.max=Math.round(x.max*.9);x.hp=Math.min(x.hp,x.max);x.dm=(x.dm||1)*.9}});
 if(k==='mac'){if(!u.mb)u.mb=true;else{macBomb(u);u.d2=true;u.mb=false}}
 if(k==='bri'){const l=add('lich',u.o,t.c,t.r);l.mv=0;l.act=true}
 if(H[k].o1)u.used=(u.used|0)+1;u.act=true;u.mv=0;MV--;after()}
function endTurn(auto){if(smnRun(auto))return;endTurn0(auto)}
function endTurn0(auto){const was=P;shopOpen=false;spl=null;
 U.filter(u=>u.o===P).forEach(u=>{if(sy(u,'مشکی',2))u.bk=Math.min(50,(u.bk|0)+(sy(u,'مشکی',4)?10:6));if(u.im>0)u.im--;if(u.rg>0)u.rg--;if(sy(u,'اژدها',2)&&u.hp<u.max)u.hp=Math.min(u.max,u.hp+80);if(sy(u,'ساپورتر',2)&&(T>>1)%2===1)u.inv=true;if(u.fly>0)u.fly--;if(u.crit>0)u.crit--;u.weak=0;['fr','jl','sl','sh','bf','bl','fz','cu','ra','is','rt'].forEach(f=>{if(u[f]>0)u[f]--});if(u.ps>0){u.hp=Math.max(0,u.hp-20);u.ps--}if(u.wd)u.hp=Math.max(0,u.hp-40);if(!(u.bf>0))u.bm=1;if(u.k==='ikh')u.inv=!u.act});
 U.forEach(u=>{if(u.mk>0)u.mk--});if(SY[P]['کهکشان']>=2){const e=U.filter(x=>x.hp>0&&x.o!==P&&!x.inv);if(e.length){const x=e[RL()*e.length|0];x.hp=Math.max(0,x.hp-200)}}P=1-P;T++;zoneTick();startTurn();sel=null;mode='mv';msg=(auto?'حرکت‌های '+NM[was]+' تمام شد. ':'')+'نوبت '+NM[P]+'.';after()}
let autoT=0;
function canAct(){if(over||phase!=='play'||MV<1)return false;
 return U.some(u=>{if(u.o!==P||u.hp<=0)return false;if(Object.keys(reach(u)).length||swapMates(u).length)return true;
  if(u.act||u.mo)return false;if(U.some(t=>t.hp>0&&canHit(u,t)))return true;
  return !!H[u.k].c&&u.mv>=1&&E[P]>=cost(u)&&abT(u).length>0})}
function autoCheck(){if(phase!=='play'||over||autoT||LOCK||canAct()||!mine())return;
 autoT=setTimeout(()=>{autoT=0;if(phase==='play'&&!over&&!canAct()&&mine())net({a:'end'})},1100)}
/* ===== رابط کاربری ===== */
const PX=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
let LOG=[],lastMsg='';
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const chip=(t,c)=>'<span class="chip'+(c?' '+c:'')+'">'+t+'</span>';
let PK=[[],[]],cbOpen=false;
const TH={'کاپیتان':[2,4,6],'نفرینی':[4],'اهریمن':[2],'اشرافی':[2,4,6],'تانک':[2],'شوالیه':[2,4],'سرخ':[2,4],'مبارز':[2,4],'ساپورتر':[2],'سامورایی':[2,4],'شکارچی':[2,4],'مشکی':[2,4],'کریسدور':[2,4],'انجماد':[2],'ربات':[2],'راهب':[3],'پادشاه':[2,3],'اژدها':[2],'کهکشان':[2],'ساچمه':[2]};
function cbRender(){const b=$('cb');b.hidden=!cbOpen;if(!cbOpen)return;
 const col=o=>{const m={};PK[o].forEach(k=>TR[k].forEach(t=>m[t]=(m[t]||0)+1));
  const rows=Object.entries(m).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([t,n])=>{const th=TH[t]||[],nx=th.find(x=>x>n),on=th.some(x=>x<=n),
   txt=on?(nx?'فعال ✓ · '+PX(nx-n)+' قهرمان دیگر تا سطح بعد':'فعال ✓ · سطح کامل'):(nx?'نیاز به '+PX(nx-n)+' قهرمان دیگر تا فعال شدن':'');
   return '<div class="cr'+(on?' on':'')+'"><span class="n">'+PX(n)+' / '+PX(nx||th[th.length-1]||n)+'</span><b>'+t+'</b><small>'+txt+'</small></div>'}).join('');
  return '<div class="cbp t'+o+'"><h3>'+NM[o]+' · '+PX(PK[o].length)+' قهرمان</h3>'+(rows||'<div class="dp">هنوز قهرمانی انتخاب نشده</div>')+'</div>'};
 b.innerHTML='<div class="cbh"><span>کمبوهای انتخاب‌شده</span><button type="button" data-x="1">بستن</button></div><div class="cbc">'+(ONLINE&&phase!=='play'?col(ME):col(0)+col(1))+'</div>'}
const TO=()=>ONLINE?(ME<2?ME:P):BOTG?0:P;
let EC=false;var HSTAT='',EV=[],EVO=false;
function ecRender(){const on=phase==='play'&&!over&&!NOGAME;$('eb').hidden=!on;$('cbtn').hidden=on;{const o=TO(),mm={};if(phase==='play')Object.assign(mm,SY[o]||{});else(PK[o]||[]).forEach(k=>(TR[k]||[]).forEach(t=>mm[t]=(mm[t]||0)+1));$('bbCt').textContent=PX(Object.keys(mm).filter(t=>(TH[t]||[]).some(x=>x<=mm[t])).length);$('bbCa').textContent=document.body.classList.contains('cbHide')?'▲':'▼';if(phase!=='play')$('sbT').textContent=phase==='pick'?'قهرمان‌هایت را انتخاب کن':'مهره‌ها را در نیمهٔ خودت بچین'}$('evb').hidden=!on;if(!on)$('evm').hidden=true;$('eb').textContent=EC?'کمبوهای دشمن ▲':'کمبوهای دشمن ▼';$('ec').hidden=!(on&&EC);if(on&&EC)$('ec').innerHTML=cbl(1-TO());dcRender()}
function evRender(){$('sbT').textContent=LOG[0]||'';const on=phase==='play'&&!over&&!NOGAME;$('evm').hidden=!(on&&EVO);if(!(on&&EVO))return;$('evm').innerHTML='<div class="cbh"><span>رخدادها</span><button type="button" data-x="1">بستن</button></div>'+(sel&&HSTAT?'<div class="evh">'+HSTAT+'</div>':'')+'<div class="evl">'+(EV.length?EV.map(m=>'<p>'+esc(m)+'</p>').join(''):'<p class="none">هنوز رخدادی نیست</p>')+'</div>'}
var DSEEN=new Set();
function dcRender(){const d=phase!=='play'&&!abortInfo&&!NOGAME&&!!PK;$('dc').hidden=!d;if(!d)return;const o=ONLINE?(ME<2?ME:P):P,pk=PK[o]||[];if(!pk.length)DSEEN.clear();const m={};pk.forEach(k=>(TR[k]||[]).forEach(t=>m[t]=(m[t]||0)+1));$('dc').dataset.pos=(ONLINE||P===0)?'bot':'top';$('dc').innerHTML=cbl(o,m,DSEEN)}
function cbl(o,mm,seen){const m=mm||SY[o]||{},r=Object.keys(m).map(t=>{const n=m[t]|0,th=TH[t]||[],lv=th.filter(x=>x<=n).length,key=t+':'+lv,nw=seen&&!seen.has(key);if(seen&&lv)seen.add(key);return lv?[lv,'<span class="cp2'+(nw?' new':'')+'">کمبوی '+t+' سطح '+PX(lv)+'/'+PX(th.length)+'</span>']:null}).filter(Boolean).sort((x,y)=>y[0]-x[0]).map(x=>x[1]).join('');return '<div class="cbl">'+(r||'<span class="cp2 none">کمبوی فعالی ندارد</span>')+'</div>'}
function ui(){if(DSW)return;cbRender();ecRender();
 // سربرگ: اکسیر دو طرف و حرکت باقی‌مانده
 const dr=phase!=='play'&&!abortInfo;$('ctl').hidden=$('msg').hidden=dr;$('dr').hidden=!dr||drClosed||(ONLINE&&P!==ME);$('dbtn').hidden=!(dr&&drClosed);
 if(dr&&drClosed){const tn=tray&&H[tray]?H[tray].n:'';$('dbtn').innerHTML='<span>📂 '+(phase==='pick'?'انتخاب هیرو':'چیدمان')+'</span>'+(tn?'<em>مستقر کن: '+esc(tn)+'</em>':'')}$('dr').dataset.pos=(ONLINE||P===0)?'top':'bottom';
 [0,1].forEach(o=>{const n=dr?7:Math.max(7,E[o]),on=dr?(ONLINE?PK[o].length:(o<P?7:o===P?DR.picks.length:0)):E[o];let h='';for(let i=0;i<n;i++)h+='<i'+(i<on?' class="on"':'')+'></i>';
  $('p'+o).innerHTML=h;$('s'+o).classList.toggle('act',!over&&P===o);$('s'+o).querySelector('.ex').textContent=dr?PX(on)+'/۷'+((ONLINE&&o!==ME)?'':' · 💧'+PX(elLeft(o))):PX(Math.max(0,E[o]))+'/۷ 💧'});
 if(!dr)$('tn').style.color='';$('tn').textContent=dr?PX(Math.max(0,Math.ceil((dl-Date.now())/1000))):over?'—':PX(MV);$('turn').dataset.p=over?'':P;
 $('tl').textContent=dr?(phase==='pick'?'انتخاب قهرمان · ':'چیدمان · ')+NM[P]:over?'پایان بازی':'حرکت باقی‌مانده · نوبت '+NM[P];
 // کارت قهرمان انتخاب‌شده
 if(dr){$('end').hidden=true;drUI();return}
 const ab=$('ab'),inf=$('info');
 if(sel){const h=H[sel.k],pc=Math.max(0,Math.min(1,vhp(sel)/sel.max));
  const st=[[sel.fly>0,'در حال پرواز','i'],[sel.weak,'ضعیف‌شده','w'],[sel.crit>0,'کریتیکال فعال','g'],[sel.fr>0,'فریز','i'],[sel.jl>0,'زندانی','w'],[sel.sl>0,'کند','i'],[sel.sh>0,'سپر','g'],[sel.inv,'نامرئی',''],[sel.hk,'هک‌شده','w'],[sel.bb,'بمب '+PX(sel.bb|0),'w'],[sel.mb,'بمب‌گذار','g'],[sel.ps>0,'مسموم','w'],[sel.ar>0,'زره','g'],[sel.mk>0,'نیزه‌خورده','w'],[sel.bl>0,'قابلیت بسته','w'],[sel.used,'قابلیت مصرف شد',''],[sel.act,'اقدام انجام شد','']].filter(x=>x[0]).map(x=>chip(x[1],x[2])).join('');
  const ex=(sel.md?chip('بونوس دوشیزگان +'+PX(Math.round(sel.md)),'g'):'')+(swapMates(sel).length?chip('جابه‌جایی با یار کناری ممکن است','g'):'')+(sel.k==='mak'?chip('گلوله '+PX(sel.ammo)):'')+(sel.k==='and'?chip('شارژ '+PX(Math.round(sel.chg))):'')+(sel.k==='med'?chip('مار '+PX(sel.sn|0)+'/۶'):'')+(sel.k==='gq'?chip('گلوله '+PX(sel.sh2)+(sel.fire?' آتشی':'')):'');
  inf.className='card t'+TO();
  HSTAT='<div class="uh"><span class="dot"></span><strong>'+esc(h.n)+'</strong><span class="who">'+NM[sel.o]+'</span><div class="hp"><i style="width:'+(pc*100)+'%" class="'+(pc>.5?'hi':pc>.25?'mid':'lo')+'"></i><span>'+PX(Math.round(vhp(sel)))+' / '+PX(sel.max)+'</span></div></div>'
   +'<div class="chips">'+chip('حرکت '+PX(sel.mv)+' از '+PX(h.m))+chip('برد '+PX(h.r))+chip('هزینه '+PX(h.c)+' اکسیر')+ex+st+'</div>';inf.innerHTML=cbl(TO());
  ab.hidden=false;
  ab.innerHTML=mode==='ab'?'<span>لغو</span>':h.c?'<span>قابلیت</span><i class="bc">'+PX(cost(sel))+'</i>'+(h.o1?'<i class="bu">'+PX(Math.max(0,h.o1-(sel.used|0)))+'</i>':''):'<span>—</span>';
  ab.classList.toggle('on',mode==='ab');
  ab.disabled=over||!mine()||sel.o!==P||sel.act||sel.mo||sel.mv<1||MV<1||E[P]<cost(sel)||!abT(sel).length}
 else{HSTAT='';inf.className='card t'+TO();inf.innerHTML=cbl(TO());ab.hidden=false;ab.classList.remove('on');ab.innerHTML='<span>قابلیت</span>';ab.disabled=true}
 if(!mine()){ab.disabled=true;ab.classList.remove('on')}
 
 // پیام‌ها
 if(msg!==lastMsg){if(msg.startsWith('بازی شروع شد')){LOG=[];EV=[]}if(msg){LOG.unshift(msg);EV.unshift(msg);EV=EV.slice(0,300)}LOG=LOG.slice(0,3);lastMsg=msg}
 $('msg').innerHTML=LOG.map((m,i)=>'<p'+(i?' class="old"':'')+'>'+esc(m)+'</p>').join('');
 evRender();const e=$('end');e.hidden=!over||(!abortInfo&&[...unitG.keys()].some(x=>x.vq&&x.vq.length));if(over){endText();if(!e.hidden)battleWin()}}
/* ===================== آنلاین =====================
   حساب کاربری/دوستی/دعوت: سرور. خود بازی: lockstep (سرور فقط دستورها را مرتب پخش می‌کند). */
let RPT=false,CURG=0,WS=null,Q=[],HM={},OH={},desync=false,flashT=0,flashMsg='',retryT=0,AUTHED=false,myName='',myTag='',myId='',PF=null,SR=null,srQ='',FL={friends:[],inc:[],out:[]},invWait=null,invFrom=null,curScr='scrAuth',loadMode='',loadStart=0,wantAuth=null,toastT=0;
const ls=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);v===null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(_){}return null};
const sendW=o=>{if(WS&&WS.readyState===1)WS.send(JSON.stringify(o))};
function toast(t){const e=$('toast');e.textContent=t;e.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>e.hidden=true,2600)}
function flash(t){flashMsg=t;flashT=Date.now()+1500;netUI()}
function showScr(id){curScr=id;['scrAuth','scrMenu','scrFr','scrBt','scrPf','scrDev','scrClan','scrClanNew','scrClanJoin'].forEach(s=>$(s).hidden=s!==id);if(id==='scrFr'||id==='scrBt')renderFL();if(id==='scrClan')renderClan(true);if(id==='scrMenu')mnTitle();barUI()}
function mnTitle(){}
function hideScr(){['scrAuth','scrMenu','scrFr','scrBt','scrPf','scrDev','scrClan','scrClanNew','scrClanJoin'].forEach(s=>$(s).hidden=true);curScr='';barUI()}
/* --- نوار لودینگ پرشی (۱ تا ۱۰۰) و موزیک ورود --- */
let LD_STEPS=[[0,1],[2000,97],[2300,98],[2550,99],[2800,100]];
/* هر بار الگوی تصادفی: چند عدد شانسی، بعد همیشه ۹۷ و ۹۸ و ۹۹ و ۱۰۰ */
function ldGen(){const k=4+(Math.random()*3|0),set=new Set();while(set.size<k)set.add(3+(Math.random()*92|0));
  const v=[...set].sort((a,b)=>a-b),st=[[0,1]];
  v.forEach((n,i)=>st.push([Math.round(200+(i+Math.random()*.6)*(1700/k)),n]));
  st.push([2000,97],[2300,98],[2550,99],[2800,100]);LD_STEPS=st}
function ldSet(p){$('ldBar').firstElementChild.style.width=p+'%';$('ldPct').textContent=p+'%'}
setInterval(()=>{if($('scrLoad').hidden)return;const t=Date.now()-loadStart;let p=1;
  for(const s of LD_STEPS)if(t>=s[0])p=s[1];
  if(p>=100&&loadMode==='match'&&LOBBY)p=99;   // تا شروع واقعی بازی روی ۹۹ می‌ماند
  ldSet(p)},60);
function entryMusic(){
  try{const a=new Audio('entry.mp3');a.volume=Math.min(1,.9*(window.jtVol?window.jtVol():.8)/.8);const pr=a.play();if(pr&&pr.catch)pr.catch(synthEntry);return}catch(e){}
  synthEntry()}
function synthEntry(){try{
  if(!au())return;
  [0,.45,.9].forEach(d=>{os('sine',120,38,.4,1,d);nz(.3,'lowpass',500,90,1,.9,d)});
  const N=(d,f,len,g)=>{os('sawtooth',f,f*.998,len,g,d);os('square',f/2,f/2*.998,len,g*.5,d)};
  N(1.0,293.66,.22,.18);N(1.25,293.66,.22,.18);N(1.5,293.66,.22,.18);
  N(1.75,349.23,.5,.2);N(2.3,440,.5,.2);
  [293.66,349.23,440,587.33].forEach(f=>N(2.85,f,1.8,.16));
  os('sine',73.42,70,2,.9,2.85);os('sine',110,50,.5,1,2.85);
  nz(1.6,'highpass',6000,3000,1,.45,2.85);
}catch(e){}}
function showLoad(){const im=$('ldImg');im.style.display='';im.src='loading.jpg';im.onerror=()=>{const n=im.dataset.n|0;if(n===0){im.dataset.n=1;im.src='loading.png'}else if(n===1){im.dataset.n=2;im.src='loading.webp'}else{im.style.display='none'}};
  ldGen();loadStart=Date.now();ldSet(1);$('scrLoad').hidden=false}
function hideLoad(){$('scrLoad').hidden=true;loadMode=''}

/* --- نمای بازیکن: خودم همیشه قرمز و پایین صفحه، حریف آبی --- */
function persp(on){if(on===swapped)return;swapped=on;NM.reverse();CL.reverse();TEAM.reverse();
  const r=document.documentElement.style;if(on){r.setProperty('--red','#3a8cf0');r.setProperty('--blue','#e5483c')}else{r.removeProperty('--red');r.removeProperty('--blue')}
  try{$('s0').querySelector('.sn b').textContent=NM[0];$('s1').querySelector('.sn b').textContent=NM[1]}catch(_){}
  $('s0').style.order=on?3:'';$('turn').style.order=on?2:'';$('s1').style.order=on?1:'';
  camYaw=on?Math.PI:0;try{placeCamera()}catch(_){}}

/* --- شروع/پایان نبرد --- */
function startMatch(m){
  MATCH=true;hideScr();$('invPop').hidden=true;invWait=null;
  RPT=false;MATCH=true;ONLINE=true;OFFG=false;GT0=0;ME=m.me;oppName=m.opp;oppOn=true;oppOff=0;LOBBY=true;abortInfo=null;desync=false;Q=[];HM={};OH={};
  persp(ME===1);$('nw').textContent='🏳 تسلیم';
  loadMode='match';loadStart=Date.now();showLoad()}
function endMatchLocal(){MATCH=false;ONLINE=false;ME=2;LOBBY=true;Q=[];abortInfo=null;persp(false);$('nw').textContent='بازی جدید';$('nw2').textContent='بازی جدید';
  try{cfClose()}catch(_){}clearTimeout(autoT);autoT=0;NOGAME=true;$('end').hidden=true}
function finishMatch(){sendW({t:'leave'});loadMode='out';showLoad();
  setTimeout(()=>{endMatchLocal();hideLoad();showScr(AUTHED?'scrMenu':'scrAuth')},3000)}
function forfeitAsk(){if(!MATCH||over)return;cfStep=3;cfRender();$('cf').hidden=false;$('cfn').focus()}
function reportResult(w){      // پایان بازی: نتیجه خودکار و مستقیم به سرور می‌رود (دست بازیکن نیست)
  if(!MATCH||!ONLINE||RPT||abortInfo)return;RPT=true;
  sendW({t:'result',g:CURG,r:w===ME?'win':w<0?'draw':'loss'})}
function battleWin(){   /* نماد پیروزی/شکست در همهٔ حالت‌های نبرد (به‌جز آموزش) */
  if(BWdone||!window.showBattleWin||(window.TUT&&TUT.on))return;
  let sub=null,lose=false,act;
  const lo=[0,1].find(o=>!U.some(u=>u.o===o&&!(u.k in SMN))),w=lo===undefined?-1:1-lo;
  if(MATCH){
    act=()=>finishMatch();
    if(abortInfo){const a=abortInfo;
      if(a.winner===ME)sub=a.reason==='forfeit'?oppName+' تسلیم شد.':oppName+' از بازی خارج شد.';
      else{lose=true;sub=a.reason==='forfeit'?'تسلیم شدی.':'اتصالت مدتی قطع بود.'}}
    else if(w===ME)sub=oppName+' رو شکست دادی.';
    else if(w>=0){lose=true;sub=oppName+' این دست رو برد.'}
  }else{
    act=()=>{$('end').hidden=true;$('netMenu').onclick()};
    if(BOTG){if(w===0)sub='هوش مصنوعی رو شکست دادی.';else if(w===1){lose=true;sub='هوش مصنوعی این دست رو برد.'}}
    else if(w>=0)sub='بازیکن '+NM[w]+' برنده شد.'
  }
  if(sub===null)return;
  BWdone=true;showBattleWin(sub,act,lose)}
function endText(){
  if(!MATCH){$('endt').textContent=msg.replace('🏆','').trim();$('nw2').textContent='بازی جدید';return}
  $('nw2').textContent='تایید پایان';
  if(abortInfo){const a=abortInfo,w=a.winner===ME;
    $('endt').textContent=a.reason==='forfeit'?(a.by===ME?'🏳 تسلیم شدی — '+oppName+' برنده شد':'🏆 '+oppName+' تسلیم شد — تو برنده شدی!'):(w?'🏆 '+oppName+' از بازی خارج شد — تو برنده شدی!':'💀 اتصالت مدتی قطع بود — '+oppName+' برنده شد');return}
  const lo=[0,1].find(o=>!U.some(u=>u.o===o&&!(u.k in SMN))),w=lo===undefined?-1:1-lo;
  reportResult(w);
  $('endt').textContent=w===ME?'🏆 تو برنده شدی!':w<0?'بازی مساوی شد':'💀 '+oppName+' برنده شد'}

/* --- اجرای دستورهای بازی --- */
function net(c){
  if(ONLINE&&MATCH&&(!CONN||!AUTHED)){flash('📡 اتصال قطع است؛ حرکتت ارسال نشد');return}
  if(!ONLINE){if(c.a==='init'&&c.seed==null)c.seed=(Math.random()*2147483647)|0;apply(c);return}
  if(phase!=='play'&&(c.a==='cell'||c.a==='shop'||c.a==='dr'||c.a==='to'))c.o=ME;
  sendW({t:'cmd',c})}
function apply(c){
  RNQ=(ONLINE&&c&&Array.isArray(c.rn))?c.rn.slice():null;
  if(ONLINE&&phase==='play'&&PLAYC.has(c.a)&&c.s!==P)return;   /* فاز بازی: فقط دستورِ بازیکنِ نوبتی (مُهر سرور) پذیرفته می‌شود */
  if(ONLINE&&DSV&&c.o!=null&&phase!=='play'&&(c.a==='cell'||c.a==='shop'||c.a==='dr'||c.a==='to')){
    if(c.o===ME){apply0(c)}
    else if(c.o===0||c.o===1){DSV[ME]=dsSnap();DSW=true;dsLoad(DSV[c.o]);try{apply0(c)}finally{DSV[c.o]=dsSnap();dsLoad(DSV[ME]);DSW=false}}
    if(BEGINQ){BEGINQ=false;DSV=null;beginPlay()}else draw();return}
  apply0(c)}
const PLAYC=new Set(['cell','ab','shop','spc','cast','end']);
function castOk(c){const S=SPELLS[c.k];if(!S||!S.t||!Number.isInteger(c.x)||!Number.isInteger(c.y)||!inb(c.x,c.y)||!Array.isArray(c.pt)||c.pt.length!==3||!c.pt.every(Number.isFinite)||!Array.isArray(c.cells)||c.cells.length>COLS*ROWS)return false;
  try{return JSON.stringify(cellsFor(S.t,c.x,c.y,new THREE.Vector3(c.pt[0],c.pt[1],c.pt[2])))===JSON.stringify(c.cells)}catch(_){return false}}
function apply0(c){
  switch(c.a){
   case 'init':RPT=false;RS=c.seed|0;tmSent=0;LOBBY=false;cfClose();init();break;
   case 'cell':handleCell0(c.x,c.y);break;
   case 'ab':abClick();break;
   case 'shop':shopSel(c.k);break;
   case 'spc':spCancel();break;
   case 'cast':if(phase==='play'&&SP[P].includes(c.k)&&(!ONLINE||castOk(c))){spl=c.k;castAt({c:c.x,r:c.y,cells:c.cells,pt:new THREE.Vector3(c.pt[0],c.pt[1],c.pt[2])})}break;
   case 'dr':drApply(c);break;
   case 'to':if(phase==='pick'||phase==='place')drTimeout();break;
   case 'end':if(phase==='play'&&!over&&!canAct()){clearTimeout(autoT);autoT=0;endTurn(true)}break;
  }}
function stHash(){const a=JSON.stringify([phase==='play'?'p':'d',phase==='play'?P:0,T,E,MV,over,RS,U.map(u=>[u.k,u.o,u.c,u.r,u.hp|0,u.mv,u.act?1:0]),phase==='play'?0:FIN.join()]);let h=5381;for(let i=0;i<a.length;i++)h=(h*33^a.charCodeAt(i))|0;return h}
setInterval(()=>{
  while(Q.length&&!LOCK){const m=Q.shift();CURG=m.g;
    try{apply(m.c)}catch(e){console.error('apply',m,e)}
    if(MATCH&&U){const h=stHash(),k=m.g+':'+m.n;HM[k]=h;if(OH[k]!==undefined&&OH[k]!==h)desync=true;sendW({t:'h',g:m.g,n:m.n,h,p:phase==='play'?1:0})}}
  if(loadMode==='match'&&!LOBBY&&Date.now()-loadStart>=3000){ldSet(100);hideLoad();entryMusic()}
},25);
function netUI(){const el=$('net'),t=$('netT'),b=$('netMenu');
  if(!MATCH&&!OFFG){el.hidden=true;const bb=$('dcBan');if(bb)bb.hidden=true;return}el.hidden=false;let s,cls='';b.hidden=!OFFG;
  if(OFFG)s=BOTG?'تمرین با هوش مصنوعی':'بازی حضوری';
  else if(desync){s='⚠ بازی با حریف ناهمگام شد — صفحه را رفرش کن';cls='bad'}
  else if(Date.now()<flashT){s=flashMsg;cls='bad'}
  else if(!CONN)s='اتصال قطع شد؛ در حال اتصال دوباره… ('+Math.floor((Date.now()-(offSince||Date.now()))/1000)+' ثانیه)';
  else{cls='me'+ME;s='تو در برابر '+oppName+(oppOn?'':' (قطع است — '+Math.floor((Date.now()-(oppOff||Date.now()))/1000)+' ثانیه)')+(LOBBY?'':(over?'':(P===ME?' · نوبت توست':' · نوبت حریف')))}
  t.textContent=s;el.className=cls;dcBanner()}
function dcBanner(){let b=$('dcBan');if(!b){b=document.createElement('div');b.id='dcBan';b.style.cssText='position:fixed;z-index:95;top:max(70px,env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);max-width:92vw;background:#000d;border:1px solid #e5483c;color:#fff;border-radius:12px;padding:10px 16px;font-size:14px;text-align:center;pointer-events:none;line-height:1.7';b.hidden=true;document.body.appendChild(b)}
  const on=ONLINE&&MATCH&&!over&&!abortInfo&&!LOBBY&&(!CONN||!AUTHED||!oppOn);if(!on){b.hidden=true;return}
  if(!CONN||!AUTHED)b.innerHTML='📡 اتصالت قطع شد<br><small>در حال اتصال دوباره… اگر مدتی برنگردی بازی به نفع حریف تموم می‌شه</small>';
  else b.innerHTML='⚠️ '+esc(oppName)+' قطع شد<br><small>منتظر برگشتنش هستیم… اگه برنگرده، تو برنده می‌شی</small>';
  b.hidden=false}
/* برگشت از پس‌زمینه/قطعی شبکه: بلافاصله دوباره وصل شو (سرور تاریخچهٔ بازی را دوباره می‌فرستد) */
function reconNow(force){if(!ONLINE&&!MATCH&&!WS&&!ls('jt_tok'))return;if(!force&&WS&&WS.readyState===1)return;clearTimeout(retryT);tryN=0;connect()}
document.addEventListener('visibilitychange',()=>{if(document.hidden){hidAt=Date.now();return}
  reconNow(MATCH&&ONLINE&&hidAt&&Date.now()-hidAt>4000);hidAt=0});
window.addEventListener('online',()=>reconNow(true));
window.addEventListener('pageshow',e=>{if(e.persisted)reconNow(true)});
setInterval(netUI,300);
$('netMenu').onclick=()=>{if(!$('scrLoad').hidden)return;loadMode='out';showLoad();setTimeout(()=>{BOTG=false;OFFG=false;LOBBY=true;hideLoad();showScr(AUTHED?'scrMenu':'scrAuth')},3000)};

/* --- اتصال و پیام‌های سرور --- */
function connect(){
  clearTimeout(retryT);
  if(WS){const o=WS;WS=null;o.onmessage=o.onclose=o.onerror=o.onopen=null;try{o.close()}catch(_){}}
  const base=new URLSearchParams(location.search).get('server')||(location.protocol.startsWith('http')?(location.protocol==='https:'?'wss://':'ws://')+location.host:'ws://localhost:3000');
  const ws=WS=new WebSocket(base+'/ws');
  ws.onopen=()=>{CONN=true;tryN=0;const u=ls('jt_u'),t=ls('jt_tok');
    if(wantAuth){sendW(wantAuth);wantAuth=null}else if(typeof u==='string'&&u&&typeof t==='string'&&t)sendW({t:'resume',u,tok:t})};
  ws.onclose=ev=>{if(WS!==ws)return;CONN=false;AUTHED=false;if(!offSince)offSince=Date.now();if(ev.code===4001)return;retryT=setTimeout(connect,[300,800,1500,2500][Math.min(tryN++,3)])};
  ws.onerror=()=>{try{ws.close()}catch(_){}};
  ws.onmessage=ev=>{let m;try{m=JSON.parse(ev.data)}catch(_){return}onMsg(m)}}
function onMsg(m){
  switch(m.t){
   case 'authok':AUTHED=true;sendW({t:'cap',v:2});offSince=0;myName=m.u;myTag=m.tag||'';myId=m.id||'';ls('jt_u',m.u);ls('jt_tok',m.tok);$('auP').value='';$('auP2').value='';$('auId').value='';$('auU').value='';regUI(false);if(!MATCH&&!OFFG&&!(loadMode))showScr('scrMenu');if(m.reg&&m.tag)showTagBox(m.tag);break;
   case 'autherr':$('auMsg').textContent=m.msg;if(m.resume){ls('jt_tok',null)}if(!MATCH)showScr('scrAuth');break;
   case 'kicked':AUTHED=false;barUI();toast('با دستگاه دیگری وارد شدی');if(!MATCH)showScr('scrAuth');break;
   case 'toast':toast(m.msg);break;
   case 'nameok':myName=m.u;ls('jt_u',m.u);$('nmPw').value='';$('nmIn').value=m.u;break;
   case 'pwok':['pwNew','pwNew2'].forEach(i=>$(i).value='');toast('رمز حساب تغییر کرد');break;
   case 'clan':CLAN=m.clan||null;if(!CLAN)CLCHAT=[];if(curScr==='scrClan')renderClan();if(curScr==='scrClanJoin'&&CLAN)showScr('scrClan');break;
   case 'clmade':showScr('scrClan');break;
   case 'clchat':CLCHAT=m.msgs||[];renderChat(!m.keep);break;
   case 'clmsg':CLCHAT.push(m.m);if(CLCHAT.length>50)CLCHAT.shift();renderChat(m.m.u===myName);break;
   case 'clres':renderClJoin(m);break;
   case 'mail':MAIL=m.mail||[];barUI();if(!$('ovMail').hidden)renderMail();break;
   case 'pf':if(m.p&&curScr==='scrPf'&&PF&&PF.name===m.p.name)showPf(m.p);break;
   case 'sres':renderSearch(m);break;
   case 'fl':FL=m;if(m.me){myTag=m.me.tag||myTag;myId=m.me.id||''}if(curScr==='scrPf'&&PF)sendW({t:'pfget',u:PF.name});if(!$('ovFr').hidden&&srQ&&$('frPaneS').style.display!=='none')sendW({t:'search',q:srQ});barUI();if(!$('ovFr').hidden)renderTbFr();if(curScr==='scrMenu')mnTitle();if(curScr==='scrFr'||curScr==='scrBt')renderFL();break;
   case 'invin':invFrom=m.from;$('ipT').textContent=m.from+' تو را به نبرد دعوت کرد ⚔️';$('invPop').hidden=false;break;
   case 'invgone':$('invPop').hidden=true;invFrom=null;break;
   case 'invwait':invWait=m.to;closeOv();if(curScr!=='scrBt')showScr('scrBt');else renderFL();break;
   case 'invend':invWait=null;if(m.why==='declined')toast(m.who+' دعوت را رد کرد');else if(m.why==='timeout')toast(m.who+' پاسخ نداد');else if(m.why==='offline')toast(m.who+' آفلاین شد');if(curScr==='scrBt')renderFL();break;
   case 'match':startMatch(m);break;
   case 'hello':case 'redo':if(m.t0){GT0=m.t0;SOFF=Date.now()-m.now}Q=m.log.map((c,n)=>({g:m.g,n,c}));HM={};OH={};desync=false;break;
   case 'cmd':if(m.c&&m.c.a==='init'&&m.t0){GT0=m.t0;SOFF=Date.now()-m.now}if(MATCH)Q.push({g:m.g,n:m.n,c:m.c});break;
   case 'opp':oppOn=m.on;oppOff=m.on?0:Date.now();break;
   case 'h':{const k=m.g+':'+m.n;if(HM[k]!==undefined&&HM[k]!==m.h)desync=true;else OH[k]=m.h;break}
   case 'abort':if(MATCH&&!over){abortInfo=m;over=true;shopOpen=false;try{cfClose()}catch(_){}clearTimeout(autoT);autoT=0;draw()}break;
  }}

/* --- صفحه‌های منو --- */
const pwErr=p=>p.length<8?'رمز باید حداقل ۸ کاراکتر باشد':p.length>64?'رمز نباید بیشتر از ۶۴ کاراکتر باشد':(!/[A-Za-z]/.test(p)||!/[0-9]/.test(p))?'رمز باید همزمان شامل حرف انگلیسی و عدد باشد':!/[A-Z]/.test(p)?'رمز باید حداقل یک حرف انگلیسی بزرگ داشته باشد':'';
let REG=false;
function regUI(on){const was=REG;REG=on;['auP2','auId','auHint'].forEach(i=>$(i).hidden=!on);$('auP').hidden=!on;$('auP').autocomplete=on?'new-password':'current-password';
  $('auU').placeholder=on?'نام کاربری':'آیدی حساب';$('auU').maxLength=on?16:20;$('auU').autocapitalize='off';$('auU').style.direction='ltr';if(was!==on)$('auU').value='';
  $('auLogin').textContent=on?'بازگشت':'ورود';$('auLogin').classList.toggle('pr',!on);$('auReg').classList.toggle('pr',on);$('auMsg').textContent=''}
function auth(mode){let u=$('auU').value.trim();const p=$('auP').value;if(mode!=='register')u=u.replace(/^@/,'').toUpperCase();
  if(mode==='register'){if(!u||!p){$('auMsg').textContent='نام کاربری و رمز را وارد کن';return}}
  else{if(!u){$('auMsg').textContent='آیدی حساب را وارد کن';return}}
  const o={t:'auth',mode,u,p};
  if(mode==='register'){const p2=$('auP2').value,id=$('auId').value.trim().replace(/^@/,'').toUpperCase();
    const e=pwErr(p)||(p!==p2?'رمز عبور و تکرار آن یکسان نیست':'')||(!/^[A-Z0-9_]{4,20}$/.test(id)?'آیدی باید ۴ تا ۲۰ نویسه از حروف انگلیسی، عدد یا _ باشد':'');
    if(e){$('auMsg').textContent=e;return}o.p2=p2;o.id=id}
  $('auMsg').textContent='';if(WS&&WS.readyState===1)sendW(o);else{wantAuth=o;$('auMsg').textContent='در حال اتصال به سرور…'}}
$('auLogin').onclick=()=>REG?regUI(false):auth('login');$('auReg').onclick=()=>REG?auth('register'):regUI(true);
['auP','auP2','auId'].forEach(i=>$(i).onkeydown=e=>{if(e.key==='Enter')auth(REG?'register':'login')});
/* ===== هوش مصنوعی (فقط تمرین، بدون جام): بازیکن آبی ===== */
const BOTBAD=new Set(['mak','gq','and','ikh','ear','pri','mar','col','dw','que','ske','dn','mac','jal']),BOTAB=new Set(['aka','ali','jack','ber','blk','ft','ik','iw']);
let botN=0,botT=-1;
function botDraft(){
  for(let g=0;g<30&&phase==='pick'&&DR.offer.length;g++){
    let a=DR.offer.filter(afford);if(!a.length){DR.offer=fixOff(DR.offer);a=DR.offer.filter(afford)}
    if(!a.length)break;
    const have=DR.picks,mel=have.filter(p=>H[p].r===1).length,rgd=have.length-mel,sc=k=>{const h=H[k];let s=h.hp*h.d*(1+.15*(h.r-1))*(h.m>=3?1.1:1)/1e5/Math.pow(hc(k)||1,.7);
      TR[k].forEach(t=>{const n=have.filter(p=>TR[p].includes(t)).length+1;s+=n===2?1.3:n===3?.5:n===4?1.4:n===6?1.4:.1});
      if(h.r===1&&mel<3)s+=.5;if(h.r>1&&rgd<2)s+=.5;if(h.r===1&&mel>=5)s-=.6;
      if(BOTBAD.has(k))s*=.6;
      const lf=elLeft(P)-hc(k),sl=6-have.length;if(BOTLV==='hard'){if(sl>0&&lf<sl*3)s-=5;else if(lf<sl*4+6)s-=.35}
      return s*(BOTLV==='hard'?(.9+Math.random()*.2):(.5+Math.random()))};
    if(BOTLV==='easy')pick(rnd(a));else pick(a.reduce((b,k)=>sc(k)>sc(b)?k:b))}
  if(phase==='pick')finishPick();botSpells()}
/* طلسم‌ها: با اکسیر باقی‌مانده دقیقاً ۴ طلسم تصادفی می‌خرد؛ از بین همهٔ ترکیب‌های چهارتایی که اکسیر را کاملاً خالی می‌کنند یکی را انتخاب می‌کند (اگر چنین ترکیبی نبود، نزدیک‌ترین ترکیب ممکن) */
/* وزن ارزش هر طلسم برای ربات: به‌جای انتخاب تصادفی، قوی‌ترین ترکیب ممکن را می‌بندد */
const BOTSW={fb:10,fz:9,rs:7,cu:7,sr:6,eq:6,rg:6,rr:5,pt:5,wd:4,is:4};
function botSpells(){
  const ks=Object.keys(SPELLS).filter(k=>!SPELLS[k].s&&k!=='iv'),left=elLeft(P);let ex=[],near=[],bs=-1;
  for(let i=0;i<ks.length;i++)for(let j=i+1;j<ks.length;j++)for(let k=j+1;k<ks.length;k++)for(let l=k+1;l<ks.length;l++){
    const q=[ks[i],ks[j],ks[k],ks[l]],s=q.reduce((n,x)=>n+SPELLS[x].x,0);
    if(s===left)ex.push(q);else if(s<left){if(s>bs){bs=s;near=[q]}else if(s===bs)near.push(q)}}
  const pool=ex.length?ex:near;if(!pool.length)return;
  const w=q=>BOTLV==='hard'?q.reduce((n,x)=>n+(BOTSW[x]||3),0)+Math.random()*1.5:Math.random();
  SP[P]=pool.reduce((b,q)=>w(q)>w(b)?q:b).slice()}
/* چیدمان هوشمند: تانک‌ها وسط خط مقدم، سریع‌ها کناره‌ها، دوربردها عقب و غیرمجاور (ضد توپ آتشین و زلزله) */
function botPlaceSimple(){
  const list=unp.slice().sort((x,y)=>((H[x].r>1)-(H[y].r>1))||(H[y].hp-H[x].hp)),cols=[2,3,1,4,0,5],cells=[];
  for(let r=3;r>=0;r--)cols.forEach(c=>cells.push([c,r]));
  list.forEach((k,i)=>{const p=cells[i];add(k,P,p[0],p[1])});unp.length=0;tray=null;sel=null;confirmPlace()}
function botPlace(){
  if(BOTLV==='easy'){randPlace();confirmPlace();return}
  if(BOTLV==='mid'){botPlaceSimple();return}
  const occ=new Set(),isF=(c,r)=>!occ.has(c+','+r)&&!at(c,r),put=(k,c,r)=>{add(k,P,c,r);occ.add(c+','+r)};
  const mel=unp.filter(k=>H[k].r===1).sort((x,y)=>H[y].hp-H[x].hp),
        rg=unp.filter(k=>H[k].r>1).sort((x,y)=>H[y].d*H[y].r-H[x].d*H[x].r),cols=[2,3,1,4,0,5],rgSet=new Set(),melSet=new Set();
  const anyFree=()=>{for(let r=3;r>=0;r--)for(const c of cols)if(isF(c,r))return[c,r];return null};
  mel.forEach(k=>{let p=null;for(const r of [3,2]){for(const c of cols)if(isF(c,r)){p=[c,r];break}if(p)break}p=p||anyFree();if(p){put(k,p[0],p[1]);melSet.add(p[0]+','+p[1])}});
  rg.forEach(k=>{const R=H[k].r,ideal=R>=5?0:R===4?1:2;let b=null;
    for(let r=0;r<4;r++)for(let c=0;c<COLS;c++){if(!isF(c,r))continue;
      let sc=-Math.abs(r-ideal)*1.2+Math.random()*.3+((c===0||c===COLS-1)?.2:0);
      nb(c,r).forEach(([x,y])=>{if(rgSet.has(x+','+y))sc-=1.5;if(melSet.has(x+','+y))sc+=.25});
      if(!b||sc>b.sc)b={c,r,sc}}
    if(b){put(k,b.c,b.r);rgSet.add(b.c+','+b.r)}});
  unp.length=0;tray=null;sel=null;confirmPlace()}
/* تمرکز آتش: اگر مجموع ضربهٔ مهره‌های آمادهٔ ربات بتواند یک دشمن را بکشد، حمله به او ارزش بیشتری می‌گیرد */
function bFocus(my,EN){const m=new Map();for(const t of EN){let s=0;for(const u of my){if(u.act||u.mo||u.mv<1)continue;if(canHit(u,t))s+=bEst(u,t)}m.set(t,s)}return m}
function botPlayLite(){
  if(botT!==T){botT=T;botN=0}
  const my=U.filter(u=>u.hp>0&&u.o===1&&!(u.k in SMN)),en=U.filter(u=>u.hp>0&&u.o===0);
  if(!en.length||++botN>60||MV<1){endTurn(false);return}
  /* ۱) قابلیت‌های ساده */
  let best=null;
  for(const u of my){if(!BOTAB.has(u.k)||u._ab===T||u.act||u.mo||u.mv<1||!H[u.k].c||E[1]<cost(u))continue;
    const L=abT(u).filter(t=>t&&t.hp>0&&t.o===0);if(!L.length||Math.random()<.25)continue;
    const t=L.reduce((m,x)=>x.hp/x.max<m.hp/m.max?x:m);if(!best||t.hp/t.max<best.t.hp/best.t.max)best={u,t}}
  if(best){best.u._ab=T;sel=best.u;mode='ab';handleCell0(best.t.c,best.t.r);return}
  /* ۲) بهترین حمله */
  best=null;
  for(const u of my){if(u.act||u.mo)continue;for(const t of en){if(!canHit(u,t))continue;
    const d=Math.min(t.hp,base(u,t)),s=d/H[t.k].hp+(d>=t.hp?1.5:0)+t.hp*0+H[t.k].d/2000+Math.random()*.1;if(!best||s>best.s)best={u,t,s}}}
  if(best){sel=best.u;mode='mv';handleCell0(best.t.c,best.t.r);return}
  /* ۳) حرکت: نزدیک شدن (نزدیک‌جنگ) یا فاصله‌گرفتن تا برد (دوربرد) */
  best=null;
  for(const u of my){const R=H[u.k].r,m=reach(u),cur=Math.min(...en.map(e=>dist(u,e)));
    for(const k in m){const [x,y]=k.split(',').map(Number),dm=Math.min(...en.map(e=>dist({c:x,r:y},e)));
      let g;if(R===1)g=cur-dm;else g=(Math.abs(cur-R)-Math.abs(dm-R))+(cur===1&&dm>1?1:0);
      g+=Math.random()*.2;if(g>.15&&(!best||g>best.g))best={u,x,y,g}}}
  if(best){sel=best.u;mode='mv';handleCell0(best.x,best.y);return}
  endTurn(false)}
/* ===== هوش مصنوعی نسخهٔ ۲: تحلیل تهدید، تمرکز روی کشتن، قابلیت‌ها و طلسم‌ها ===== */
const bVal=(t,d)=>{d=Math.max(0,d);return Math.min(d,t.hp)*(1+H[t.k].d/700)+(d>=t.hp?t.hp*.5+H[t.k].d*2:0)};
const bEst=(a,t)=>{let d;try{d=base(a,t)}catch(_){d=NaN}if(!(d>=0))d=H[a.k].d;
  if(t.im>0||t.ar>0)return 0;if(a.weak||a.cu>0)d*=.5;if(a.ra>0)d*=1.25;if(t.is>0)d*=.05;else if(t.fz>0)d*=.5;if(t.mk>0)d*=1.25;if(t.sh>0)d*=.1;if(a.bf>0)d*=a.bm||1;return d*(a.al||1)};
const bThr=(u,c,r)=>{let s=0;for(const e of U){if(e.hp<=0||e.o===u.o||e.fr>0||e.jl>0||e.fz>0)continue;if(dist(e,{c,r})<=H[e.k].r+Math.min(H[e.k].m,2))s+=bEst(e,u)*.8}return s};
const bCone=(u,t,DM)=>{const[q0,r0]=toA(u.c,u.r),[q1,r1]=toA(t.c,t.r),d=DIR.findIndex(([a,b])=>q1-q0===a&&r1-r0===b);if(d<0)return[];
  const A=DIR[(d+5)%6],B=DIR[d],C=DIR[(d+1)%6],res=[];
  DM.forEach((dm,i)=>{const kk=i+1;let q=q0+kk*A[0],r=r0+kk*A[1];const L=[];for(let j=0;j<kk;j++){q+=B[0]-A[0];r+=B[1]-A[1];L.push([q,r])}for(let j=1;j<kk;j++){q+=C[0]-B[0];r+=C[1]-B[1];L.push([q,r])}
    L.forEach(([a,b])=>{const[c2,w]=toO(a,b),x=inb(c2,w)&&at(c2,w);if(x&&x.o!==u.o)res.push([x,dm])})});return res};
function bAbil(u){
  const k=u.k,EN=U.filter(x=>x.hp>0&&x.o!==u.o),AT=abT(u);if(!AT.length)return null;
  const top=(f)=>{let b=null;for(const t of AT){if(!t||!(t.hp>0))continue;const v=f(t);if(!b||v>b.v)b={v,t}}return b};
  switch(k){
    case 'dw':{const e=EN.filter(x=>!(x.k in SMN)&&!x.inv).sort((a,b)=>a.hp-b.hp)[0];return e?{v:bVal(e,820),self:1}:null}
    case 'ali':return top(t=>bVal(t,600));
    case 'aka':return top(t=>line(u,t).ens.reduce((s,x)=>s+bVal(x,500),200));
    case 'and':return top(t=>bVal(t,Math.min(2000,u.chg)));
    case 'eli':return top(t=>bVal(t,520));
    case 'ber':return top(t=>bVal(t,700));
    case 'blk':return top(t=>bVal(t,400)+Math.min(600,u.max-u.hp));
    case 'ft':return top(t=>chain(u,t).reduce((s,x,i)=>s+bVal(x,[250,200,150][i]),0));
    case 'ik':case 'iw':return top(t=>bVal(t,H[k].d)+H[t.k].d*.9);
    case 'ske':return EN.some(x=>!(x.k in SMN)&&!x.inv)?{v:650,self:1}:null;
    case 'doj':return{v:600+Math.min(350,u.max-u.hp),self:1};
    case 'cri':{const m=u.max-u.hp;return m>1500?{v:m*.8,self:1}:null}
    case 'mus':{const th=bThr(u,u.c,u.r);return(!(u.sh>0)&&th>500)?{v:Math.min(1100,th),self:1}:null}
    case 'gq':return EN.some(t=>dist(u,t)<=4)?{v:800,self:1}:null;
    case 'mak':return(u.ammo<=0&&EN.length)?{v:600,self:1}:null;
    case 'acro':{const p=acroPlan(u);return p?{v:p.path.reduce((s,x)=>s+bVal(x,390),0),acro:1}:null}
    case 'zep':case 'fd':{const DM=k==='zep'?[840,630,420,210]:[400,400];let b=null;for(const t of AT){const v=bCone(u,t,DM).reduce((s,[x,d])=>s+bVal(x,d),0);if(!b||v>b.v)b={v,t}}return b&&b.v>0?b:null}
    case 'bri':{const e=EN.length?EN:null;if(!e)return null;let b=null;for(const t of AT){const d=Math.min(...e.map(x=>dist(t,x)));const v=520-d*20;if(!b||v>b.v)b={v,t}}return b}
    default:return null}}
function bAllTris(){const seen=new Set(),o=[];for(let a=0;a<COLS;a++)for(let b=0;b<ROWS;b++){const[q,s]=toA(a,b);for(let i=0;i<6;i++){const T3=[[q,s],[q+DIR[i][0],s+DIR[i][1]],[q+DIR[(i+1)%6][0],s+DIR[(i+1)%6][1]]].map(([x,y])=>toO(x,y)).filter(p=>inb(p[0],p[1]));
  if(!T3.length)continue;const key=T3.map(p=>p.join(',')).sort().join('|');if(seen.has(key))continue;seen.add(key);o.push(T3)}}return o}
function bSpells(){
  const out=[],me=P,EN=U.filter(x=>x.hp>0&&x.o!==me),MY=U.filter(x=>x.hp>0&&x.o===me),inC=cells=>U.filter(x=>x.hp>0&&cells.some(q=>q[0]===x.c&&q[1]===x.r));
  const push=(k,c,r,cells,v,thr)=>{if(v>=thr||(T>=8&&v>=thr*.6))out.push({k,c,r,cells,s:v+250})};
  for(const k of SP[me]){const S=SPELLS[k];if(!S||S.s||(botBadK[k]===T))continue;
    if(k==='fb'){let b=null;for(const tr of bAllTris()){const v=inC(tr).filter(x=>x.o!==me).reduce((s,x)=>s+bVal(x,680),0);if(!b||v>b.v)b={v,tr}}if(b)push(k,b.tr[0][0],b.tr[0][1],b.tr,b.v,900)}
    else if(k==='fz'||k==='rg'||k==='eq'||k==='rr'){let b=null;for(let c0=0;c0<COLS;c0++)for(let r0=0;r0<ROWS;r0++){const cells=cellsFor(S.t,c0,r0,null),A=inC(cells);let v=0;
        for(const x of A){const en=x.o!==me;if(k==='fz'){if(en)v+=H[x.k].d*.9+60}else if(k==='rg'){v+=(en?-1:1)*H[x.k].d*.25*(x.act?.4:1)}else{if(en)v+=bVal(x,100)+(k==='rr'?120:0)}}
        if(!b||v>b.v)b={v,c:c0,r:r0,cells}}
      if(b)push(k,b.c,b.r,b.cells,b.v,k==='fz'?900:k==='rg'?450:550)}
    else if(k==='sr'){if(!freeAny())continue;let b=null;for(let c0=0;c0<COLS;c0++){let f=true,v=250;for(let j=0;j<ROWS;j++){if(ST.some(q=>q.c===c0&&q.r===j))break;const x=EN.find(z=>z.c===c0&&z.r===j);if(x){v+=bVal(x,f?260:130);f=false}}if(!b||v>b.v)b={v,c:c0}}if(b)push(k,b.c,0,cellsFor('l',b.c,0,null),b.v,500)}
    else if(k==='cu'){let b=null;for(const t of EN){const v=H[t.k].d*1.6+30;if(!b||v>b.v)b={v,t}}if(b)push(k,b.t.c,b.t.r,[[b.t.c,b.t.r]],b.v,750)}
    else if(k==='wd'){let b=null;for(const t of EN){const v=Math.min(t.hp,3000)*.18+250;if(!b||v>b.v)b={v,t}}if(b)push(k,b.t.c,b.t.r,[[b.t.c,b.t.r]],b.v,450)}
    else if(k==='pt'){let b=null;for(const t of MY){const m=Math.min(500,t.max-t.hp);const v=m*.9*(1+H[t.k].d/900);if(!b||v>b.v)b={v,t}}if(b)push(k,b.t.c,b.t.r,[[b.t.c,b.t.r]],b.v,450)}
    else if(k==='is'){let b=null;for(const t of MY){const th=bThr(t,t.c,t.r);if(th<t.hp*.5)continue;const v=Math.min(th,t.hp)*.9*(1+H[t.k].d/900);if(!b||v>b.v)b={v,t}}if(b)push(k,b.t.c,b.t.r,[[b.t.c,b.t.r]],b.v,600)}
    else if(k==='rs'){if(!DX[me].length)continue;const d=DX[me][DX[me].length-1],cs=[];for(let c0=0;c0<COLS;c0++)for(let r0=0;r0<4;r0++)if(fr(c0,r0))cs.push([c0,r0]);if(!cs.length)continue;
      const f=cs.map(p=>({p,d:EN.length?Math.min(...EN.map(x=>dist({c:p[0],r:p[1]},x))):9})).sort((a,b)=>b.d-a.d)[0].p;
      push(k,f[0],f[1],[f],Math.min(1400,d.max*.5)*(1+H[d.k].d/700),700)}}
  return out}
let botBadK={};
function botPlayV2(){
  if(botT!==T){botT=T;botN=0}
  const my=U.filter(u=>u.hp>0&&u.o===1&&!(u.k in SMN)),EN=U.filter(x=>x.hp>0&&x.o===0);
  if(!EN.length||++botN>70||(MV<1&&!SP[1].length)){endTurn(false);return}
  const cand=[];let FOC=null;try{FOC=bFocus(my,EN)}catch(_){}
  /* طلسم‌ها */
  bSpells().forEach(o=>cand.push({s:o.s,f:()=>{spl=o.k;castAt({c:o.c,r:o.r,cells:o.cells,pt:V3(o.c,o.r)});if(SP[1].includes(o.k)){botBadK[o.k]=T;spl=null}}}));
  if(MV>=1)for(const u of my){
    const W=EN.filter(x=>canHit(u,x));let alt=0;
    /* حملهٔ ساده */
    if(!u.act&&!u.mo&&u.mv>=1&&W.length){const vs=W.map(t=>bVal(t,bEst(u,t))),pick=sy(u,'مبارز',2),i=vs.indexOf(Math.max(...vs)),tg=pick?W[i]:W[0],s=pick?vs[i]:vs.reduce((a,b)=>a+b,0)/vs.length;let s2=s;try{if(FOC&&FOC.get(tg)>=tg.hp*.95&&bEst(u,tg)<tg.hp)s2*=1.3}catch(_){}alt=s2;cand.push({s:s2,f:()=>{sel=u;mode='mv';handleCell0(tg.c,tg.r)}})}
    /* قابلیت (اکسیر کل بازی فقط ۷ است؛ هزینه با مالیات اکسیر سنجیده می‌شود) */
    if(u._ab!==T&&!u.act&&!u.mo&&u.mv>=1&&H[u.k].c&&E[1]>=cost(u)&&!(u.rt>0)){let a=null;try{a=bAbil(u)}catch(_){}
      if(a){const s=a.v-cost(u)*120;if(s>alt*.9+60)cand.push({s,f:()=>{u._ab=T;sel=u;if(a.self||a.acro){mode='mv';useAb(u,a.acro?abT(u)[0]:u)}else{mode='ab';handleCell0(a.t.c,a.t.r)}}})}}
    /* حرکت */
    const m=reach(u),keys=Object.keys(m);if(!keys.length)continue;
    const R=H[u.k].r,cur=Math.min(...EN.map(e=>dist(u,e))),thC=bThr(u,u.c,u.r),low=u.hp<u.max*.3;
    for(const kx of keys){const[x,y]=kx.split(',').map(Number),pos={c:x,r:y},ds=EN.map(e=>dist(pos,e)),dm=Math.min(...ds);let s=0;
      if(!u.act&&u.mv>=2&&MV>=2&&dm<=R){const near=EN.filter((e,i)=>ds[i]===dm);s+=Math.max(...near.map(t=>bVal(t,bEst(u,t))))*.85}
      else if(R===1)s+=(cur-dm)*45;
      else{if(dm>R)s+=(cur-dm)*45;if(cur===1&&dm>1)s+=40}
      const th=bThr(u,x,y);s-=Math.max(0,th-thC)*(low?.8:.4);if(th>=u.hp)s-=u.hp*.5;if(low)s+=(thC-th)*.6+(dm-cur)*30;
      if(s>25)cand.push({s,f:()=>{sel=u;mode='mv';handleCell0(x,y)}})}}
  if(!cand.length){endTurn(false);return}
  const b=cand.reduce((p,q)=>q.s>p.s?q:p);b.f()}
let botErr=0;
function botPlayEasy(){
  if(botT!==T){botT=T;botN=0}
  const my=U.filter(u=>u.hp>0&&u.o===1&&!(u.k in SMN)),en=U.filter(u=>u.hp>0&&u.o===0);
  if(!en.length||++botN>12||MV<1||Math.random()<.12){endTurn(false);return}
  const att=[];for(const u of my){if(u.act||u.mo)continue;for(const t of en)if(canHit(u,t))att.push({u,t})}
  if(att.length&&Math.random()<.7){const a=rnd(att);sel=a.u;mode='mv';handleCell0(a.t.c,a.t.r);return}
  const mv=[];for(const u of my){if(u.act||u.mo)continue;const m=reach(u);for(const k in m){if(m[k]>0){const[x,y]=k.split(',').map(Number);mv.push({u,x,y})}}}
  if(mv.length){const a=rnd(mv);sel=a.u;mode='mv';handleCell0(a.x,a.y);return}
  endTurn(false)}
function botPlay(){
  if(BOTLV==='easy'){try{botPlayEasy()}catch(e){console.error(e);try{endTurn(false)}catch(_){}}return}
  if(BOTLV==='mid'){try{botPlayLite()}catch(e){console.error(e);try{endTurn(false)}catch(_){}}return}
  try{botPlayV2()}catch(e){console.error('bot v2',e);botErr++;spl=null;if(botErr>2||true)botPlayLite()}}
let botNext=0;
setInterval(()=>{
  if(!BOTG||!OFFG||NOGAME||!U||over)return;
  if(P!==1){botNext=Date.now()+1500;return}
  if(phase==='play'){if(LOCK){botNext=Date.now()+2000;return}if(Date.now()<botNext)return}
  else if(LOCK)return;
  try{if(phase==='pick'){botDraft();draw()}else if(phase==='place'){botPlace()}else if(phase==='play'){botPlay();botNext=Date.now()+2000}}catch(e){console.error('bot',e);if(phase==='play'&&P===1&&!over)try{endTurn(false)}catch(_){}}
},500);
function offline(){if(!$('scrLoad').hidden)return;loadMode='in';showLoad();setTimeout(()=>{hideLoad();OFFG=true;hideScr();ONLINE=false;MATCH=false;LOBBY=false;net({a:'init'})},3000)}
$('auOff').onclick=()=>{BOTG=false;offline()};
var GMODE='friend';const GM_N={online:'🌍 بازی آنلاین',friend:'👥 بازی با دوست',bot:'🤖 بازی با ربات',local:'🎮 دوئل روی یک دستگاه'};
var BOTLV='mid';const LV_N={easy:'آسان',mid:'متوسط',hard:'سخت'};
function modeUI(){$('mnModeV').textContent=GM_N[GMODE]+(GMODE==='bot'?' · '+LV_N[BOTLV]:'');document.querySelectorAll('#mnModes button[data-m]').forEach(b=>b.classList.toggle('on',b.dataset.m===GMODE));document.querySelectorAll('#mnLv button').forEach(b=>b.classList.toggle('on',b.dataset.lv===BOTLV));$('mnLv').hidden=GMODE!=='bot'}
$('mnMode').onclick=()=>{$('mnModes').hidden=!$('mnModes').hidden};
$('mnModes').onclick=e=>{const l=e.target.closest('button[data-lv]');if(l){BOTLV=l.dataset.lv;GMODE='bot';modeUI();$('mnModes').hidden=true;return}const b=e.target.closest('button[data-m]');if(!b)return;GMODE=b.dataset.m;modeUI();if(GMODE!=='bot')$('mnModes').hidden=true};
modeUI();
$('mnBattle').onclick=()=>{
  if(GMODE==='online'){toast('⚠️ بازی آنلاین در دست توسعه است');return}
  if(GMODE==='bot'){BOTG=true;offline();return}
  if(GMODE==='local'){BOTG=false;offline();return}
  showScr('scrBt')};
$('frBack').onclick=()=>showScr('scrMenu');
$('btBack').onclick=()=>{if(invWait)sendW({t:'invcancel'});showScr('scrMenu')};
$('setOut').onclick=()=>{closeOv();sendW({t:'logout'});ls('jt_tok',null);AUTHED=false;myName='';myTag='';myId='';MAIL=[];CLAN=null;CLCHAT=[];FL={friends:[],inc:[],out:[]};showScr('scrAuth')};
$('frAdd').onclick=()=>{const u=$('frU').value.trim();if(!u)return;sendW({t:'fadd',u});$('frU').value=''};
$('ipYes').onclick=()=>{if(invFrom)sendW({t:'invacc',u:invFrom});$('invPop').hidden=true};
$('ipNo').onclick=()=>{if(invFrom)sendW({t:'invdec',u:invFrom});$('invPop').hidden=true;invFrom=null};
function renderFL(){
  const nm=n=>esc(n);
  if(curScr==='scrFr'){
    let h='';
    if(FL.inc.length)h+='<div class="sec">درخواست‌های دریافتی</div>'+FL.inc.map(n=>'<div class="fr"><b>'+nm(n)+'</b><span><button class="pr" data-a="facc" data-u="'+nm(n)+'">قبول</button><button data-a="fdec" data-u="'+nm(n)+'">رد</button></span></div>').join('');
    if(FL.out.length)h+='<div class="sec">در انتظار تایید</div>'+FL.out.map(n=>'<div class="fr dim"><span>'+nm(n)+'</span></div>').join('');
    h+='<div class="sec">دوستان من</div>'+(FL.friends.length?FL.friends.map(f=>'<div class="fr"><span><i class="od'+(f.on?' on':'')+'"></i><b>'+nm(f.u)+'</b><small>⚔️ '+(f.w|0)+'</small>'+(f.busy?'<small>در بازی</small>':'')+'</span><button data-a="frem" data-u="'+nm(f.u)+'">حذف</button></div>').join(''):'<div class="sec">هنوز دوستی نداری. نام کاربری یکی را بالا بنویس.</div>');
    $('frList').innerHTML=h}
  if(curScr==='scrBt'){
    if(invWait){$('btT').textContent='منتظر پاسخ '+invWait+'…';$('btList').innerHTML='<div class="fr dim">دعوت فرستاده شد؛ اگر آنلاین باشد و قبول کند بازی شروع می‌شود.</div><button data-a="invcancel">لغو دعوت</button>'}
    else{$('btT').textContent='با کی نبرد می‌زنی؟';
      $('btList').innerHTML=FL.friends.length?FL.friends.map(f=>'<div class="fr"><span><i class="od'+(f.on?' on':'')+'"></i><b>'+nm(f.u)+'</b><small>⚔️ '+(f.w|0)+'</small></span>'+(f.on&&!f.busy?'<button class="pr" data-a="inv" data-u="'+nm(f.u)+'">⚔️ دعوت</button>':'<small>'+(f.busy?'در بازی':'آفلاین')+'</small>')+'</div>').join(''):'<div class="sec">اول با دکمه 👥 بالای صفحه یک دوست اضافه کن.</div>'}}}
['frList','btList'].forEach(id=>$(id).onclick=e=>{const b=e.target.closest('button[data-a]');if(!b)return;const a=b.dataset.a,u=b.dataset.u;
  if(a==='invcancel'){sendW({t:'invcancel'});invWait=null;renderFL()}
  else if(a==='frem'){if(confirm(u+' از دوستانت حذف شود؟'))sendW({t:a,u})}
  else sendW({t:a,u})});

