
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
function regUI(on){const was=REG;REG=on;['auP2','auId','auHint'].forEach(i=>$(i).hidden=!on);$('auP').hidden=false;$('auP').autocomplete=on?'new-password':'current-password';
  $('auU').placeholder=on?'نام کاربری':'تگ حساب (مثل #AB12CD34EF56)';$('auU').maxLength=on?16:14;$('auU').autocapitalize='off';$('auU').style.direction='ltr';if(was!==on)$('auU').value='';
  $('auLogin').textContent=on?'بازگشت':'ورود';$('auLogin').classList.toggle('pr',!on);$('auReg').classList.toggle('pr',on);$('auMsg').textContent=''}
function auth(mode){let u=$('auU').value.trim();const p=$('auP').value;if(mode!=='register')u=u.replace(/^@/,'').toUpperCase();
  if(mode==='register'){if(!u||!p){$('auMsg').textContent='نام کاربری و رمز را وارد کن';return}}
  else{if(!u||!p){$('auMsg').textContent='تگ حساب و رمز را وارد کن';return}}
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

/* --- نوار بالا: لیست دوستان، نام حساب، منوی کشویی (نامه‌ها) --- */
let MAIL=[],selFr='',openMail='',CLAN=null,clMode='open',CLCHAT=[];
const TB_SCR=['scrMenu','scrFr','scrBt','scrPf'];
function closeOv(){$('ovCl').hidden=true;$('ovSet').hidden=true;$('ovFr').hidden=true;$('ovMail').hidden=true;$('tbDrop').hidden=true;selFr='';openMail=''}
function barUI(){
  const show=AUTHED&&!MATCH&&!OFFG&&TB_SCR.includes(curScr);
  $('tb').hidden=!show;if(!show)closeOv();
  const bs=AUTHED&&!MATCH&&!OFFG&&PAGES.includes(curScr);
  $('bn').hidden=!bs;$('bnL').classList.toggle('on',curScr==='scrDev');$('bnM').classList.toggle('on',curScr==='scrMenu');$('bnR').classList.toggle('on',curScr==='scrClan');
  $('tbN').textContent=myName||'';$('tbTr').textContent=(FL&&FL.me&&myName)?'🏆 '+(FL.me.tr|0):'';{const a=(FL&&FL.me&&FL.me.av!=null&&FL.me.av>=0)?FL.me.av|0:defAv(myName);$('tbAv').innerHTML=avSvg(a);$('tbAv').hidden=false;$('tbAv').style.setProperty('--fc',(typeof PCOLS!=='undefined'&&FL&&FL.me)?PCOLS[(FL.me.pc|0)%12]:'#1f3a5f')}$('tbT').textContent=(myName&&myId)?'@'+myId:'';
  const un=MAIL.filter(x=>!x.read).length;
  $('tbMnB').hidden=!un;$('tbMnB').textContent=un;$('tbMailB').hidden=!un;$('tbMailB').textContent=un}
const CLMAX=50,CL_ROLE={owner:'سازنده',leader:'سازنده',member:'عضو',elder:'ارشد',admin:'ارشد',co:'معاون'};
function clInfo(c,pname){const own=!!(CLAN&&CLAN.name===c.name),ms=own?CLAN.members:(Array.isArray(c.members)?c.members:null),owner=own?CLAN.owner:c.owner;
  const n=ms?ms.length:(typeof c.n==='number'?c.n:typeof c.cnt==='number'?c.cnt:typeof c.count==='number'?c.count:undefined);
  const mem=ms&&ms.find(x=>x&&x.u===pname),rr=c.role||(mem&&(mem.role||mem.r));
  const role=CL_ROLE[rr]||rr||(owner&&owner===pname?'سازنده':'عضو');
  const sy=(own&&CLAN.sy!=null)?CLAN.sy:(c.sy!=null?c.sy:defAv(c.name));return{own,n,role,sy:sy|0}}
function clCardUI(p){const cb=$('pfClan'),c=p.clan;if(!c||!c.name){cb.disabled=true;cb.classList.add('none');$('pcE').innerHTML='';$('pcN').textContent='بدون قبیله';$('pcR').textContent='';$('pcC').textContent='';return}
  const i=clInfo(c,p.name);cb.disabled=false;cb.classList.remove('none');$('pcE').innerHTML=avSvg(i.sy);$('pcN').textContent=c.name;$('pcR').textContent=i.role;$('pcC').textContent=(i.n===undefined?'-':PX(i.n))+'/'+PX(CLMAX)}
function showPf(p){
  const same=PF&&PF.name===p.name;PF=p;const self=p.rel==='self',st=v=>v!==undefined?v:'-';
  $('pfName').textContent=p.name;
  $('pfId').textContent=p.id?'@'+p.id:'';$('pfId').hidden=!p.id;
  $('pfSub').textContent=self?'پروفایل من':(p.on===undefined?'':(p.busy?'در بازی':(p.on?'آنلاین':'آفلاین')));
  {const a=(p.av!=null&&p.av>=0)?p.av|0:defAv(p.name);$('pfAv').innerHTML=avSvg(a);$('pfAv').hidden=false}
  clCardUI(p);$('scrPf').style.setProperty('--pc',PCOLS[(p.pc|0)%12]);
  $('pfW').textContent=st(p.w);$('pfT').textContent=st(p.tr);
  {let tot;if(typeof p.g==='number')tot=p.g;else if(typeof p.w==='number'&&typeof p.l==='number')tot=p.w+p.l+(typeof p.d==='number'?p.d:0);$('pfR').textContent=(tot===undefined||typeof p.w!=='number')?'-':PX(tot>0?Math.round(p.w/tot*100):0)+'٪'}
  const ad=!self&&(p.rel==='none'||p.rel==='inc');$('pfAdd').classList.toggle('ph',!ad);$('pfAdd').classList.toggle('acc',p.rel==='inc');$('pfAdd').setAttribute('aria-label',p.rel==='inc'?'قبول درخواست دوستی':'افزودن دوست');
  $('pfInv').hidden=!(CLAN&&CLAN.mine&&CLAN.mode==='invite'&&!self)}
function openProfile(name,preset){
  closeOv();let p=preset;
  if(!p){
    if(name===myName)p={name,id:myId,rel:'self',...(FL.me||{}),on:true,busy:false};
    else{const f=FL.friends.find(x=>x.u===name);p=f?{name,id:f.id,w:f.w,on:f.on,busy:f.busy,rel:'friend'}:{name,rel:'none'}}}
  showPf(p);showScr('scrPf');sendW({t:'pfget',u:p.name})}
let tgT=0,tuT=0,tgStage=0;
function showTagBox(tag,stage){tgStage=stage||1;$('tgv').textContent='#'+tag;$('tgok').disabled=true;$('tgo').hidden=false;clearTimeout(tgT);tgT=setTimeout(()=>{$('tgok').disabled=false},4000);
  $('tgc').onclick=()=>copyTxt('#'+tag,'تگ کپی شد');
  $('tgok').onclick=()=>{$('tgo').hidden=true;if(tgStage===1)showTutOffer(tag)}}
/* بعد از ثبت‌نام: پیشنهاد آموزش. «خیر» بعد ۴ ثانیه فعال می‌شود تا متن خوانده شود */
function showTutOffer(tag){const no=$('tuNo');no.disabled=true;$('tuo').hidden=false;clearTimeout(tuT);tuT=setTimeout(()=>{no.disabled=false},4000);
  $('tuYes').onclick=()=>{$('tuo').hidden=true;clearTimeout(tuT);if(window.TUT&&TUT.afterReg)TUT.afterReg()};
  no.onclick=()=>{if(no.disabled)return;$('tuo').hidden=true;clearTimeout(tuT);ls('jt_tut1','1');showTagBox(tag,2)}}
function copyTxt(t,msg){try{navigator.clipboard.writeText(t).then(()=>toast(msg),()=>{})}catch(_){}}
$('pfAdd').onclick=()=>{if(PF&&PF.name)sendW({t:'fadd',u:PF.name})};
$('setTagCp').onclick=()=>{if(myTag)copyTxt('#'+myTag,'تگ کپی شد')};
const PCOLS=['#1f3a5f','#1f4d3a','#5a2230','#3f2a5e','#5a3d22','#3a4350','#1c1f26','#134e4a','#1e2559','#521a45','#3b3f17','#6b3a14'],
  PCN=['آبی شبانه','سبز جنگلی','عنابی','بنفش','قهوه‌ای','فولادی','مشکی','سبز دریایی','سرمه‌ای','ارغوانی تیره','زیتونی تیره','مسی تیره'];
// رنگ پروفایل و رنگ کادر چت دقیقاً یک فهرست ۱۲تایی‌اند؛ پیش‌فرض کادر چت = مشکی (شمارهٔ ۶)
const CC_DEF=6,CCOLS=PCOLS,CCN=PCN;
const ccCol=c=>CCOLS[(c==null?CC_DEF:(c|0))%12]||CCOLS[CC_DEF];
function renderCc(){const cur=FL.me&&FL.me.cc!=null?FL.me.cc|0:CC_DEF;$('ccSw').innerHTML=CCOLS.map((c,i)=>'<button type="button" class="sw'+(i===cur?' on':'')+'" data-c="'+i+'" style="background:'+c+'" aria-label="'+CCN[i]+'"></button>').join('');$('ccPrev').style.background=ccCol(cur);$('ccPrevN').textContent=myName||''}
$('ccSw').onclick=e=>{const b=e.target.closest('button[data-c]');if(!b)return;if(FL.me)FL.me.cc=+b.dataset.c;renderCc();sendW({t:'setcc',c:+b.dataset.c})};
/* ===== هالهٔ حرکتی و راه رفتن کوبشی ===== */
var MVO={halo:true};
try{MVO.halo=localStorage.getItem('jt_halo')!=='0'}catch(e){}
var HLO=[],HLTX=null;
function hloTex(){if(HLTX)return HLTX;var c=document.createElement('canvas');c.width=c.height=64;var g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.45,'rgba(255,255,255,.55)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);HLTX=new THREE.CanvasTexture(c);HLTX.colorSpace=THREE.SRGBColorSpace;return HLTX}
var HLC={acro:0xffd24a,aka:0x6aff9a,cri:0xc4122f,doj:0xffe08a,pri:0xff8ac8,raf:0xfff2a0,bri:0x7dff6a,ali:0xff2a2a,mar:0xffa23a,mak:0x3cff7a,and:0x7fd0ff,zep:0xc98a4a,jack:0xd01040,blk:0x8a5cff,jal:0xb02a2a,ikh:0x2fd0c0,col:0x3a9bff,ear:0xd9a441,ik:0xb8ecff,iw:0x7fe0ff,mus:0x00e5ff,ske:0xd8d4c0,bud:0xffc23a,que:0xc040a0,fd:0xff6a14,ft:0x9fd8ff,spg:0x5a8aff,med:0x4ad66a,eli:0xdfe6ff,ber:0xff5a2a,dk:0xb030ff,gq:0xff8a30,dn:0x8a30ff,dw:0xc040ff,lich:0x5affc8,mi:0xd9a441,skl:0xd8d4c0};
function hloCol(u){var c=u&&HLC[u.k];return c==null?0xb4b9c4:c}
var HLTX2=null;
function hlo2Tex(){if(HLTX2)return HLTX2;var c=document.createElement('canvas');c.width=c.height=64;var g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.25,'rgba(255,255,255,.85)');r.addColorStop(.55,'rgba(255,255,255,.32)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);HLTX2=new THREE.CanvasTexture(c);HLTX2.colorSpace=THREE.SRGBColorSpace;return HLTX2}
function mvFX(g,u,d,dt){
 var mv=!d.anim&&Math.hypot(d.tx-g.position.x,d.tz-g.position.z)>.08&&(typeof phase==='undefined'||phase==='play');
 d.hs=(d.hs||0)-dt;
 if(mv&&MVO.halo&&d.hs<=0){d.hs=.03;
  var cc=new THREE.Color(hloCol(u)),core=cc.clone().lerp(new THREE.Color(0xffffff),.45),
   x=g.position.x+(Math.random()-.5)*.15,y=.85+(Math.random()-.5)*.35,z=g.position.z+(Math.random()-.5)*.15;
  [[cc,1.7,2.6,.8,.7],[core,.8,1.7,.95,.55]].forEach(function(L){
   var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:hlo2Tex(),color:L[0],transparent:true,opacity:L[3],blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
   sp.position.set(x,y,z);sp.scale.set(L[1],L[2],1);sp.renderOrder=5;scene.add(sp);HLO.push({sp:sp,t:0,o:L[3],sx:L[1],sy:L[2],life:L[4]})})}}
function mvHalo(dt){for(var i=HLO.length-1;i>=0;i--){var h=HLO[i];h.t+=dt;var k=h.t/h.life;if(k>=1){scene.remove(h.sp);h.sp.material.dispose();HLO.splice(i,1);continue}
 h.sp.material.opacity=h.o*Math.pow(1-k,1.3);h.sp.scale.set(h.sx*(1-.35*k),h.sy*(1-.15*k),1)}}
/* ===== گاز سمی (وقتی چند راند هیچ ضربه‌ای زده نشود) =====
   ۲ راند بدون ضربه: ردیف آخر هر دو طرف | راند بعدِ بدون ضربه: یک ردیف جلوتر | بعدی: چپ و راست | بعدی: هر چهار طرف و فقط وسط می‌ماند
   هر راند ۳۰۰ آسیب به هر که در گاز باشد (گازِ تازه یک راند مهلت می‌دهد) */
var GAS={st:0,nh:0,hit:false,ms:[],set:{},snap:[],msg:'',pt:0,gp:[]};
var GASM=['','☣ گاز سمی ردیف آخر هر دو طرف را گرفت!','☣ گاز یک ردیف جلوتر آمد!','☣ گاز از چپ و راست میدان هم آمد!','☣ گاز از هر چهار طرف آمد؛ فقط وسط میدان ماند!','☣ گاز کل میدان را گرفت، حتی وسط!'];
function gasCells(st){var a=[],c,r,mc=[COLS/2-1,COLS/2],mr=[ROWS/2-1,ROWS/2];
 for(c=0;c<COLS;c++)for(r=0;r<ROWS;r++){var g=false;
  if(st>=1&&(r===0||r===ROWS-1))g=true;
  if(st>=2&&(r<=1||r>=ROWS-2))g=true;
  if(st>=3&&(c===0||c===COLS-1))g=true;
  if(st>=4&&!(c>=mc[0]&&c<=mc[1]&&r>=mr[0]&&r<=mr[1]))g=true;
  if(st>=5)g=true;
  if(g)a.push([c,r])}
 return a}
function gasClear(){GAS.ms.forEach(function(o){scene.remove(o.m);o.m.material.dispose()});GAS.gp.forEach(function(o){scene.remove(o.sp);o.sp.material.dispose()});GAS.ms=[];GAS.gp=[];GAS.set={};GAS.st=0;GAS.nh=0;GAS.hit=false;GAS.snap=[];GAS.msg=''}
function gasShow(){GAS.ms.forEach(function(o){scene.remove(o.m);o.m.material.dispose()});GAS.ms=[];GAS.set={};
 gasCells(GAS.st).forEach(function(x){var m=hexMesh(x[0],x[1],0x6dff5a,.06);m.renderOrder=4;scene.add(m);GAS.ms.push({m:m,b:performance.now(),c:x[0],r:x[1]});GAS.set[x[0]+','+x[1]]=1})}
function gasSnap(){GAS.snap=U.filter(function(x){return x.hp>0&&x.o!==P}).map(function(x){return[x,x.hp]})}
function gasHitCheck(){if(GAS.snap.some(function(e){return e[0].hp<e[1]||U.indexOf(e[0])<0}))GAS.hit=true}
function gasRound(){if(T%2||(window.TUT&&TUT.on))return;GAS.msg='';
 if(GAS.st>0){var n=0;U.forEach(function(u){if(u.hp>0&&GAS.set[u.c+','+u.r]){u.hp=Math.max(0,u.hp-300);n++;
   try{var g=unitG.get(u);if(g)burst(g.position,10,0x6dff5a,{sp:1.4,vy:1,size:.35,life:.7,y:.4})}catch(e){}}});
  if(n)GAS.msg=' ☣ گاز سمی به '+PX(n)+' قهرمان ۳۰۰ آسیب زد.'}
 if(GAS.hit)GAS.nh=0;
 else{GAS.nh++;
  if(GAS.st<5&&(GAS.st===0?GAS.nh>=2:GAS.nh>=1)){GAS.st++;GAS.nh=0;gasShow();GAS.msg+=' '+GASM[GAS.st]}
  else if(GAS.st===0&&GAS.nh===1)GAS.msg=' ⚠ اگر راند بعد هم ضربه‌ای زده نشود، گاز سمی می‌آید.'}
 GAS.hit=false}
function gasAnim(dt){var now=performance.now(),i;
 for(i=0;i<GAS.ms.length;i++){var o=GAS.ms[i];o.m.material.opacity=Math.min(1,(now-o.b)/700)*(.36+.1*Math.sin(now/420+i*.7))}
 GAS.pt-=dt;if(GAS.ms.length&&GAS.pt<=0){GAS.pt=.09;var q=GAS.ms[Math.random()*GAS.ms.length|0],sp=new THREE.Sprite(new THREE.SpriteMaterial({map:hloTex(),color:0x7dff63,transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
  sp.position.set(q.m.position.x+(Math.random()-.5)*1.1,.15,q.m.position.z+(Math.random()-.5)*1.1);sp.scale.set(1.5,1.5,1);scene.add(sp);GAS.gp.push({sp:sp,t:0})}
 for(i=GAS.gp.length-1;i>=0;i--){var p=GAS.gp[i];p.t+=dt;if(p.t>=1.4){scene.remove(p.sp);p.sp.material.dispose();GAS.gp.splice(i,1);continue}
  p.sp.position.y=.15+p.t*.55;p.sp.material.opacity=.35*Math.sin(Math.min(1,p.t/1.4)*Math.PI)}}
var _zc0=zoneClear;zoneClear=function(){_zc0();try{gasClear()}catch(e){}};
function bdSave(){try{localStorage.setItem('jt_bdm',BDQ.m);localStorage.setItem('jt_bdt',String(BDQ.t));localStorage.setItem('jt_bdc',JSON.stringify(BDQ.c));localStorage.setItem('jt_bdb',String(BDQ.br))}catch(_){}}
function bdHex(v){return'#'+(v|0).toString(16).padStart(6,'0')}
function bdThumb(T){var q=BDP[BDI]||BDP[0],cv=document.createElement('canvas');cv.width=cv.height=64;var g=cv.getContext('2d'),f=T.k?2.3:1,ch=function(h,sh){return Math.min(255,((h>>sh)&255)*f)|0};
 g.fillStyle='rgb('+ch(q[1],16)+','+ch(q[1],8)+','+ch(q[1],0)+')';g.fillRect(0,0,64,64);
 if(T.k){g.globalCompositeOperation='multiply';g.drawImage(bdCanvas(T.k,1),0,0,64,64)}
 return cv.toDataURL()}
function drawBdPv(){var cv=$('bdPv');if(!cv)return;var g=cv.getContext('2d'),q=BDP[BDI]||BDP[0],K=24,ox=1*K+4,oy=SQ/2*K+4;
 g.clearRect(0,0,cv.width,cv.height);
 for(var c=0;c<COLS;c++)for(var r=0;r<ROWS;r++){var cx=ox+CELL_X(c)*K,cy=oy+CELL_Z(c,r)*K,pk=BDQ.c[c+','+r],h=pk!=null?pk|0:((c+r)%2?q[1]:q[2]);
  g.beginPath();for(var i=0;i<6;i++){var a=i*Math.PI/3;g[i?'lineTo':'moveTo'](cx+Math.cos(a)*K*.94,cy+Math.sin(a)*K*.94)}g.closePath();g.fillStyle=bdHex(h);g.fill();g.lineWidth=1.5;g.strokeStyle=bdHex(q[3]);g.stroke()}}
function renderBd(){const h=bdHex;$('bdSw').innerHTML=BDP.map((q,i)=>'<button type="button" class="sw'+(i===BDI?' on':'')+'" data-b="'+i+'" style="background:linear-gradient(135deg,'+h(q[1])+' 55%,'+h(q[3])+' 55%)" aria-label="'+q[0]+'"></button>').join('');
 const ind=BDQ.m==='i';
 $('bdT').textContent=ind?'🎨 رنگ حاشیه و قاب میدان':'🎨 رنگ میدان نبرد';
 document.querySelectorAll('#bdMode button').forEach(b=>b.classList.toggle('on',b.dataset.m===BDQ.m));
 $('bdNorm').hidden=ind;$('bdInd').hidden=!ind;
 if(!ind)$('bdTx').innerHTML=BDTXS.map((T,i)=>'<button type="button" class="'+(i===BDQ.t?'on':'')+'" data-t="'+i+'"><span class="tsw" style="background-image:url('+bdThumb(T)+')"></span><span class="tn">'+T.n+'</span></button>').join('');
 else{$('bdBr').innerHTML=PCOLS.map((c,i)=>'<button type="button" class="sw'+(bdHex(BDQ.br)===c?' on':'')+'" data-p="'+i+'" style="background:'+c+'" aria-label="'+PCN[i]+'"></button>').join('');drawBdPv()}}
$('bdSw').onclick=e=>{const b=e.target.closest('button[data-b]');if(!b)return;BDI=+b.dataset.b;try{localStorage.setItem('jt_bd',String(BDI))}catch(_){}try{applyBoard()}catch(_){}renderBd()};
$('bdMode').onclick=e=>{const b=e.target.closest('button[data-m]');if(!b)return;BDQ.m=b.dataset.m;bdSave();try{applyBoard()}catch(_){}renderBd()};
$('bdTx').onclick=e=>{const b=e.target.closest('button[data-t]');if(!b)return;BDQ.t=+b.dataset.t;bdSave();try{applyBoard()}catch(_){}renderBd()};
$('bdBr').onclick=e=>{const b=e.target.closest('button[data-p]');if(!b)return;BDQ.br=parseInt(PCOLS[+b.dataset.p].slice(1),16);$('bdCu').value=PCOLS[+b.dataset.p];bdSave();renderBd()};
$('bdCu').oninput=e=>{BDQ.br=parseInt(e.target.value.slice(1),16);bdSave();document.querySelectorAll('#bdBr .sw').forEach(b=>b.classList.remove('on'))};
$('bdFill').onclick=()=>{for(var c=0;c<COLS;c++)for(var r=0;r<ROWS;r++)BDQ.c[c+','+r]=BDQ.br;bdSave();try{applyBoard()}catch(_){}drawBdPv()};
$('bdRst').onclick=()=>{BDQ.c={};bdSave();try{applyBoard()}catch(_){}drawBdPv()};
(function(){var cv=$('bdPv'),down=false;
 function paint(e){var R=cv.getBoundingClientRect(),K=24,x=((e.clientX-R.left)*cv.width/R.width-(K+4))/K,z=((e.clientY-R.top)*cv.height/R.height-(SQ/2*K+4))/K,best=null,bd=1;
  for(var c=0;c<COLS;c++)for(var r=0;r<ROWS;r++){var d=Math.hypot(x-CELL_X(c),z-CELL_Z(c,r));if(d<bd){bd=d;best=c+','+r}}
  if(best&&BDQ.c[best]!==BDQ.br){BDQ.c[best]=BDQ.br;try{applyBoard()}catch(_){}drawBdPv()}}
 cv.addEventListener('pointerdown',e=>{down=true;try{cv.setPointerCapture(e.pointerId)}catch(_){}paint(e);e.preventDefault()});
 cv.addEventListener('pointermove',e=>{if(down)paint(e)});
 var up=()=>{if(down){down=false;bdSave()}};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up)})();
renderBd();
function renderMvT(){$('hlT').classList.toggle('on',MVO.halo);$('hlT').lastElementChild.textContent=MVO.halo?'روشن':'خاموش'}
$('hlT').onclick=()=>{MVO.halo=!MVO.halo;try{localStorage.setItem('jt_halo',MVO.halo?'1':'0')}catch(_){}renderMvT()};
renderMvT();
function showSetPane(p){['setM','setS','setP','setG','setA','setI'].forEach(i=>{const e=$(i);if(e)e.hidden=i!==p});if(p==='setP'){renderSw();renderCc();renderAv()}}
$('setGoS').onclick=()=>showSetPane('setS');$('setGoI').onclick=()=>showSetPane('setI');$('nmSave').onclick=()=>sendW({t:'setname',n:$('nmIn').value.trim(),o:$('nmPw').value});$('setGoP').onclick=()=>showSetPane('setP');
document.querySelectorAll('.setBack').forEach(b=>b.onclick=()=>showSetPane('setM'));
/* ===== نمادهای سیاه و سفید پروفایل (۱۲ طرح SVG) ===== */
var AVN=['شکوفه رز','اژدها','شمشیرها','تاج','جمجمه','گرگ','سپر','قلعه','تبر','شعله','ماه و ستاره','لنگر','ستاره','قلب','رعد','الماس','کلید','خورشید','کاج','کوهستان','موج','چشم','پنجه','تیر','کمان','کلاه‌خود','جام','ستاره هشت‌پر','کتاب','مشعل','عنکبوت','مار','گربه','جغد','ماهی','شاخ گوزن','کوسه','بمب','توپ','پرچم','چکش','کلاه جادوگر','عصای جادو','صندوق گنج','سکه','ساعت شنی','چرخ‌دنده','پنتاگرام','پر','قطره','برگ','شبدر','زنگ','پیاده شطرنج','تاس','قطب‌نما','جمجمه و استخوان','شمشیر','هرم','مارپیچ'];
var AVB=[
/*0 رز*/'<g stroke="#fff" stroke-width="1.6" fill="#000">'+[0,1,2,3,4].map(i=>{const t=(-90+i*72)*Math.PI/180;return '<circle cx="'+(32+13*Math.cos(t)).toFixed(1)+'" cy="'+(32+13*Math.sin(t)).toFixed(1)+'" r="11"/>'}).join('')+[0,1,2,3,4].map(i=>{const t=(-54+i*72)*Math.PI/180;return '<circle cx="'+(32+7*Math.cos(t)).toFixed(1)+'" cy="'+(32+7*Math.sin(t)).toFixed(1)+'" r="7"/>'}).join('')+'<circle cx="32" cy="32" r="5"/><path fill="none" d="M29 32a3 3 0 1 1 3 3"/></g>',
/*1 اژدها*/'<g fill="#fff"><path d="M12 50 L14 36 L22 30 L18 12 L30 24 L38 10 L40 26 L52 30 L58 40 L46 40 L48 48 L38 44 L30 54 L24 46 Z"/><path d="M52 30 L58 40 L46 40Z" fill="#fff"/></g><g fill="#000"><path d="M34 31 L44 33 L38 36Z"/><circle cx="53" cy="36" r="1.5"/></g><g stroke="#000" stroke-width="1.6" fill="none"><path d="M47 41 L49 45 M42 42 L43 46 M22 38 L30 42"/></g>',
/*2 شمشیرها*/'<g stroke="#fff" stroke-linecap="round" fill="#fff"><g transform="rotate(45 32 32)"><path d="M32 7 L35 12 V40 H29 V12Z" stroke-width="1"/><path d="M22 42 H42" stroke-width="3.5"/><path d="M32 42 V52" stroke-width="4"/><circle cx="32" cy="55" r="3"/></g><g transform="rotate(-45 32 32)"><path d="M32 7 L35 12 V40 H29 V12Z" stroke-width="1"/><path d="M22 42 H42" stroke-width="3.5"/><path d="M32 42 V52" stroke-width="4"/><circle cx="32" cy="55" r="3"/></g></g>',
/*3 تاج*/'<g fill="#fff"><path d="M11 47 L9 22 L22 33 L32 15 L42 33 L55 22 L53 47Z"/><circle cx="9" cy="20" r="3.5"/><circle cx="32" cy="12.5" r="3.5"/><circle cx="55" cy="20" r="3.5"/><rect x="11" y="49" width="42" height="5" rx="1.5"/></g><g fill="#000"><circle cx="32" cy="41" r="3"/><circle cx="21" cy="42" r="2.2"/><circle cx="43" cy="42" r="2.2"/></g>',
/*4 جمجمه*/'<path fill="#fff" d="M32 9C20 9 12 17 12 28c0 7 4 11 9 14v8c0 2 1 3 3 3h16c2 0 3-1 3-3v-8c5-3 9-7 9-14C52 17 44 9 32 9Z"/><g fill="#000"><circle cx="23.5" cy="29" r="5.5"/><circle cx="40.5" cy="29" r="5.5"/><path d="M32 34 L28.5 42 H35.5Z"/></g><path stroke="#000" stroke-width="2" d="M27 46v6M32 46v6M37 46v6"/>',
/*5 گرگ*/'<path fill="#fff" d="M11 9 L26 20 H38 L53 9 L54 32 L44 50 L32 57 L20 50 L10 32Z"/><g fill="#000"><path d="M17 15 L23 21 L16 25Z"/><path d="M47 15 L41 21 L48 25Z"/><path d="M18 31 L28 36 L19 38Z"/><path d="M46 31 L36 36 L45 38Z"/><path d="M27 47 H37 L32 54Z"/></g><path stroke="#000" stroke-width="1.6" fill="none" d="M32 38 V47"/>',
/*6 سپر*/'<path fill="#fff" d="M32 8 L53 14 V31 C53 44 44 52 32 58 C20 52 11 44 11 31 V14Z"/><path fill="#000" d="M32 14 L47 18.5 V31 C47 40 41 46 32 51 C23 46 17 40 17 31 V18.5Z"/><g fill="#fff"><rect x="29.5" y="19" width="5" height="26"/><rect x="23" y="26" width="18" height="5"/></g>',
/*7 قلعه*/'<g fill="#fff"><rect x="11" y="24" width="13" height="30"/><rect x="40" y="24" width="13" height="30"/><rect x="24" y="32" width="16" height="22"/><path d="M11 24v-5h3v3h3v-3h3v3h3v-5h1v7zM40 24v-5h3v3h3v-3h3v3h3v-5h1v7zM24 32v-4h3v2h3v-2h4v2h3v-2h3v4z"/></g><path fill="#000" d="M28 54V44a4 4 0 0 1 8 0V54Z"/><g fill="#000"><rect x="15" y="31" width="3" height="6" rx="1.5"/><rect x="46" y="31" width="3" height="6" rx="1.5"/></g><path stroke="#fff" stroke-width="2" d="M32 28V12"/><path fill="#fff" d="M32 12 L43 16 L32 20Z"/>',
/*8 تبر*/'<g fill="#fff"><rect x="29.5" y="9" width="5" height="48" rx="2"/><path d="M30 14 C14 8 6 22 13 33 C20 31 26 29 30 27Z"/><path d="M34 14 C50 8 58 22 51 33 C44 31 38 29 34 27Z"/></g><g stroke="#000" stroke-width="1.6" fill="none"><path d="M26 16 C19 15 14 20 14 27"/><path d="M38 16 C45 15 50 20 50 27"/></g>',
/*9 شعله*/'<path fill="#fff" d="M32 7 C34 19 49 25 47 40 C46 50 39 57 32 57 C24 57 17 50 17 40 C17 31 23 28 25 19 C27 25 30 25 32 7Z"/><path fill="#000" d="M32 30 C34 36 40 38 39 46 C38 51 35 53 32 53 C28 53 25 50 25 46 C25 40 30 38 32 30Z"/>',
/*10 ماه و ستاره*/'<path fill="#fff" d="M38 9 A23 23 0 1 0 56 40 A18 18 0 1 1 38 9Z"/><path fill="#fff" d="M45 19 L47.2 25 L53.5 25.3 L48.6 29.2 L50.3 35.3 L45 31.8 L39.7 35.3 L41.4 29.2 L36.5 25.3 L42.8 25Z"/>',
/*11 لنگر*/'<g stroke="#fff" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="32" cy="13" r="4.5" stroke-width="3"/><path d="M32 18 V53" stroke-width="4"/><path d="M23 26 H41" stroke-width="4"/><path d="M11 38 C13 51 22 56 32 54 C42 56 51 51 53 38" stroke-width="4"/><path d="M6 43 L11 36 L17 42 M58 43 L53 36 L47 42" stroke-width="3.5"/></g>',
/*12 ستاره*/'<path fill="#fff" d="M32.0 9.0 L37.9 25.9 L55.8 26.3 L41.5 37.1 L46.7 54.2 L32.0 44.0 L17.3 54.2 L22.5 37.1 L8.2 26.3 L26.1 25.9Z"/>',
/*13 قلب*/'<path fill="#fff" d="M32 54 C10 38 8 22 18 16 C25 12 31 16 32 22 C33 16 39 12 46 16 C56 22 54 38 32 54Z"/>',
/*14 رعد*/'<path fill="#fff" d="M36 7 L16 36 H29 L25 57 L48 26 H34Z"/>',
/*15 الماس*/'<path fill="#fff" d="M20 14 H44 L56 28 L32 56 L8 28Z"/><path stroke="#000" stroke-width="1.6" fill="none" d="M8 28 H56 M20 14 L26 28 L32 56 L38 28 L44 14"/>',
/*16 کلید*/'<g fill="#fff"><circle cx="32" cy="18" r="11"/><rect x="29.5" y="26" width="5" height="30"/><rect x="34" y="44" width="8" height="4"/><rect x="34" y="52" width="6" height="4"/></g><circle fill="#000" cx="32" cy="17" r="4.5"/>',
/*17 خورشید*/'<circle fill="#fff" cx="32" cy="32" r="11"/><g stroke="#fff" stroke-width="3.5" stroke-linecap="round"><path d="M49.0 32.0 L57.0 32.0"/><path d="M44.0 44.0 L49.7 49.7"/><path d="M32.0 49.0 L32.0 57.0"/><path d="M20.0 44.0 L14.3 49.7"/><path d="M15.0 32.0 L7.0 32.0"/><path d="M20.0 20.0 L14.3 14.3"/><path d="M32.0 15.0 L32.0 7.0"/><path d="M44.0 20.0 L49.7 14.3"/></g>',
/*18 کاج*/'<g fill="#fff"><path d="M32 6 L44 24 H37 L48 38 H38 L52 52 H12 L26 38 H16 L27 24 H20Z"/><rect x="29" y="52" width="6" height="7"/></g>',
/*19 کوهستان*/'<path fill="#fff" d="M6 52 L24 18 L34 36 L42 26 L58 52Z"/><path fill="#000" d="M24 18 L19 28 L24 26 L28 29Z"/>',
/*20 موج*/'<g stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"><path d="M8 24 q6 -8 12 0 t12 0 t12 0 t12 0"/><path d="M8 36 q6 -8 12 0 t12 0 t12 0 t12 0"/><path d="M8 48 q6 -8 12 0 t12 0 t12 0 t12 0"/></g>',
/*21 چشم*/'<path fill="#fff" d="M6 32 C16 16 48 16 58 32 C48 48 16 48 6 32Z"/><circle fill="#000" cx="32" cy="32" r="10"/><circle fill="#fff" cx="32" cy="32" r="4.5"/>',
/*22 پنجه*/'<g fill="#fff"><path transform="translate(0 0)" d="M14 10 Q26 32 20 56 Q10 32 14 10Z"/><path transform="translate(15 0)" d="M14 10 Q26 32 20 56 Q10 32 14 10Z"/><path transform="translate(30 0)" d="M14 10 Q26 32 20 56 Q10 32 14 10Z"/></g>',
/*23 تیر*/'<g stroke="#fff" stroke-linecap="round" fill="#fff"><path d="M14 50 L46 18" stroke-width="3.5"/><path d="M54 10 L38 14 L50 26Z" stroke-width="1"/><path d="M14 50 L8 46 M14 50 L18 56 M21 43 L15 39 M21 43 L25 49" stroke-width="3" fill="none"/></g>',
/*24 کمان*/'<g stroke="#fff" stroke-linecap="round" fill="none"><path d="M20 8 C48 18 48 46 20 56" stroke-width="3.5"/><path d="M20 8 V56" stroke-width="1.5"/><path d="M10 32 H48" stroke-width="3"/></g><path fill="#fff" d="M56 32 L44 26 V38Z"/>',
/*25 کلاه‌خود*/'<path fill="#fff" d="M12 36 C12 20 22 10 32 10 C42 10 52 20 52 36 V52 H42 V40 H22 V52 H12Z"/><rect fill="#000" x="18" y="30" width="28" height="5"/><path stroke="#000" stroke-width="2" d="M32 10 V30"/>',
/*26 جام*/'<path fill="#fff" d="M16 10 H48 C48 28 42 38 34 40 V50 H42 V56 H22 V50 H30 V40 C22 38 16 28 16 10Z"/><path stroke="#fff" stroke-width="3" fill="none" d="M16 14 H8 C8 26 14 28 20 28 M48 14 H56 C56 26 50 28 44 28"/>',
/*27 ستاره هشت‌پر*/'<path fill="#fff" d="M32.0 6.0 L36.6 20.9 L50.4 13.6 L43.1 27.4 L58.0 32.0 L43.1 36.6 L50.4 50.4 L36.6 43.1 L32.0 58.0 L27.4 43.1 L13.6 50.4 L20.9 36.6 L6.0 32.0 L20.9 27.4 L13.6 13.6 L27.4 20.9Z"/><circle fill="#000" cx="32" cy="32" r="5"/>',
/*28 کتاب*/'<path fill="#fff" d="M8 14 H30 Q32 14 32 16 V54 Q32 50 28 50 H8Z M56 14 H34 Q32 14 32 16 V54 Q32 50 36 50 H56Z"/><path stroke="#000" stroke-width="1.6" d="M13 22 H27 M13 29 H27 M13 36 H27 M37 22 H51 M37 29 H51 M37 36 H51"/>',
/*29 مشعل*/'<path fill="#fff" d="M27 30 H37 L35 58 H29Z"/><path fill="#fff" d="M32 6 C34 14 44 18 42 26 C41 30 37 32 32 32 C27 32 23 29 23 24 C23 19 28 17 28 12 C30 14 31 14 32 6Z"/><path fill="#000" d="M32 18 C33 22 37 23 36 27 C35.5 29 34 30 32 30 C30 30 28.5 28 28.5 26 C28.5 23 31 22 32 18Z"/>',
/*30 عنکبوت*/'<g stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M26 32 L12 24 L8 14 M25 36 L8 36 L6 46 M26 40 L12 50 L10 58 M27 29 L18 16 L16 8"/><g transform="translate(64 0) scale(-1 1)"><path d="M26 32 L12 24 L8 14 M25 36 L8 36 L6 46 M26 40 L12 50 L10 58 M27 29 L18 16 L16 8"/></g></g><circle fill="#fff" cx="32" cy="38" r="9"/><circle fill="#fff" cx="32" cy="25" r="6"/>',
/*31 مار*/'<path d="M44 14 C24 8 16 22 30 31 C44 40 40 56 20 52" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/><path fill="#fff" d="M40 8 L56 13 L44 21Z"/><circle fill="#000" cx="46" cy="14" r="1.6"/>',
/*32 گربه*/'<path fill="#fff" d="M10 8 L24 18 H40 L54 8 V34 C54 46 44 54 32 54 C20 54 10 46 10 34Z"/><g fill="#000"><circle cx="22" cy="32" r="4.5"/><circle cx="42" cy="32" r="4.5"/><path d="M28 40 H36 L32 45Z"/></g><path stroke="#000" stroke-width="1.5" d="M10 42 L24 43 M54 42 L40 43"/>',
/*33 جغد*/'<path fill="#fff" d="M32 8 L44 14 L50 11 V28 C50 44 42 56 32 56 C22 56 14 44 14 28 V11 L20 14Z"/><circle fill="#000" cx="23.5" cy="28" r="8"/><circle fill="#000" cx="40.5" cy="28" r="8"/><circle fill="#fff" cx="23.5" cy="28" r="3.5"/><circle fill="#fff" cx="40.5" cy="28" r="3.5"/><path fill="#000" d="M28 37 H36 L32 45Z"/>',
/*34 ماهی*/'<path fill="#fff" d="M6 32 C16 18 34 16 44 28 L58 18 V46 L44 36 C34 48 16 46 6 32Z"/><circle fill="#000" cx="17" cy="30" r="2.5"/><path stroke="#000" stroke-width="2" fill="none" d="M30 24 Q35 32 30 40"/>',
/*35 شاخ گوزن*/'<g stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"><path d="M32 42 C24 38 18 30 16 12 M21 30 L10 27 M18 21 L10 14"/><g transform="translate(64 0) scale(-1 1)"><path d="M32 42 C24 38 18 30 16 12 M21 30 L10 27 M18 21 L10 14"/></g></g><path fill="#fff" d="M25 40 H39 L36 56 H28Z"/>',
/*36 کوسه*/'<path fill="#fff" d="M16 42 C25 36 28 24 30 8 C38 22 46 32 52 42Z"/><g stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"><path d="M6 48 q6 -6 12 0 t12 0 t12 0 t12 0"/><path d="M6 57 q6 -6 12 0 t12 0 t12 0 t12 0"/></g>',
/*37 بمب*/'<circle fill="#fff" cx="28" cy="38" r="18"/><path stroke="#fff" stroke-width="3" fill="none" d="M38 24 Q44 16 50 18"/><path stroke="#fff" stroke-width="2.5" stroke-linecap="round" d="M53 9 V21 M47 15 H59 M49 11 L57 19 M57 11 L49 19"/><path stroke="#000" stroke-width="3" fill="none" stroke-linecap="round" d="M17 38 C17 31 21 27 27 27"/>',
/*38 توپ*/'<path fill="#fff" d="M8 30 L44 22 L48 34 L12 42Z"/><circle fill="#fff" cx="40" cy="46" r="11"/><circle cx="40" cy="46" r="7" fill="none" stroke="#000" stroke-width="2"/><circle fill="#000" cx="40" cy="46" r="2"/><circle fill="#fff" cx="55" cy="18" r="3.5"/>',
/*39 پرچم*/'<rect fill="#fff" x="14" y="8" width="4" height="50"/><path fill="#fff" d="M18 10 C28 6 34 16 44 12 C48 11 50 10 52 10 V34 C50 34 48 35 44 36 C34 40 28 30 18 34Z"/><path fill="#000" d="M33.0 16.0 L34.5 20.0 L38.7 20.1 L35.4 22.8 L36.5 26.9 L33.0 24.5 L29.5 26.9 L30.6 22.8 L27.3 20.1 L31.5 20.0Z"/>',
/*40 چکش*/'<rect fill="#fff" x="29" y="22" width="6" height="36" rx="2"/><rect fill="#fff" x="14" y="8" width="36" height="18" rx="3"/><path stroke="#000" stroke-width="1.6" d="M24 8 V26 M40 8 V26"/>',
/*41 کلاه جادوگر*/'<path fill="#fff" d="M32 6 L46 44 H18Z"/><ellipse fill="#fff" cx="32" cy="47" rx="24" ry="7"/><path fill="#000" d="M23 36 H41 L42 42 H22Z"/>',
/*42 عصای جادو*/'<path d="M14 52 L40 26" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path fill="#fff" d="M46.0 8.0 L48.9 16.0 L57.4 16.3 L50.8 21.5 L53.1 29.7 L46.0 25.0 L38.9 29.7 L41.2 21.5 L34.6 16.3 L43.1 16.0Z"/><path stroke="#fff" stroke-width="2" stroke-linecap="round" d="M16 18 V26 M12 22 H20 M52 44 V52 M48 48 H56"/>',
/*43 صندوق گنج*/'<path fill="#fff" d="M10 28 C10 16 20 12 32 12 C44 12 54 16 54 28Z"/><rect fill="#fff" x="10" y="30" width="44" height="24" rx="2"/><path stroke="#000" stroke-width="2" d="M10 30 H54"/><rect fill="#000" x="28" y="26" width="8" height="11" rx="1"/><circle fill="#fff" cx="32" cy="31" r="1.8"/>',
/*44 سکه*/'<circle fill="#fff" cx="32" cy="32" r="25"/><circle cx="32" cy="32" r="19" fill="none" stroke="#000" stroke-width="2"/><path fill="#000" d="M32.0 22.0 L34.6 29.4 L42.5 29.6 L36.3 34.4 L38.5 41.9 L32.0 37.5 L25.5 41.9 L27.7 34.4 L21.5 29.6 L29.4 29.4Z"/>',
/*45 ساعت شنی*/'<path fill="#fff" d="M16 8 H48 V14 C48 24 38 28 34 32 C38 36 48 40 48 50 V56 H16 V50 C16 40 26 36 30 32 C26 28 16 24 16 14Z"/><path fill="#000" d="M24 14 H40 C39 20 35 24 32 26 C29 24 25 20 24 14Z"/><path fill="#000" d="M32 40 L40 52 H24Z"/>',
/*46 چرخ‌دنده*/'<g fill="#fff"><rect x="28" y="6" width="8" height="10" transform="rotate(0 32 32)"/><rect x="28" y="6" width="8" height="10" transform="rotate(45 32 32)"/><rect x="28" y="6" width="8" height="10" transform="rotate(90 32 32)"/><rect x="28" y="6" width="8" height="10" transform="rotate(135 32 32)"/><rect x="28" y="6" width="8" height="10" transform="rotate(180 32 32)"/><rect x="28" y="6" width="8" height="10" transform="rotate(225 32 32)"/><rect x="28" y="6" width="8" height="10" transform="rotate(270 32 32)"/><rect x="28" y="6" width="8" height="10" transform="rotate(315 32 32)"/><circle cx="32" cy="32" r="19"/></g><circle fill="#000" cx="32" cy="32" r="7"/>',
/*47 پنتاگرام*/'<circle cx="32" cy="33" r="23" fill="none" stroke="#fff" stroke-width="2.5"/><path d="M32.0 11.0 L44.9 50.8 L11.1 26.2 L52.9 26.2 L19.1 50.8Z" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>',
/*48 پر*/'<path fill="#fff" d="M50 8 C28 10 14 24 12 44 L8 56 L14 52 C34 52 48 38 50 8Z"/><path stroke="#000" stroke-width="2" fill="none" d="M48 12 C32 22 20 36 10 54"/>',
/*49 قطره*/'<path fill="#fff" d="M32 7 C40 20 50 28 50 38 C50 48 42 56 32 56 C22 56 14 48 14 38 C14 28 24 20 32 7Z"/><path stroke="#000" stroke-width="3" fill="none" stroke-linecap="round" d="M24 40 C24 46 27 49 31 50"/>',
/*50 برگ*/'<path fill="#fff" d="M10 54 C8 28 24 10 54 10 C56 40 40 56 10 54Z"/><path stroke="#000" stroke-width="2" fill="none" d="M12 52 C24 40 36 28 48 16 M24 42 L22 32 M34 32 L32 22 M24 42 L14 40 M34 32 L44 34"/>',
/*51 شبدر*/'<g fill="#fff"><circle cx="24" cy="24" r="10"/><circle cx="40" cy="24" r="10"/><circle cx="24" cy="40" r="10"/><circle cx="40" cy="40" r="10"/></g><circle fill="#000" cx="32" cy="32" r="3"/><path d="M32 40 Q34 52 44 58" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>',
/*52 زنگ*/'<path fill="#fff" d="M32 8 C26 8 22 12 22 16 C14 20 14 30 12 40 L8 46 H56 L52 40 C50 30 50 20 42 16 C42 12 38 8 32 8Z"/><circle fill="#fff" cx="32" cy="52" r="5"/>',
/*53 پیاده شطرنج*/'<circle fill="#fff" cx="32" cy="17" r="9"/><path fill="#fff" d="M26 25 H38 C38 34 42 38 44 44 H20 C22 38 26 34 26 25Z"/><rect fill="#fff" x="16" y="46" width="32" height="9" rx="2"/>',
/*54 تاس*/'<rect fill="#fff" x="10" y="10" width="44" height="44" rx="8"/><g fill="#000"><circle cx="22" cy="22" r="4"/><circle cx="42" cy="22" r="4"/><circle cx="32" cy="32" r="4"/><circle cx="22" cy="42" r="4"/><circle cx="42" cy="42" r="4"/></g>',
/*55 قطب‌نما*/'<circle cx="32" cy="32" r="24" fill="none" stroke="#fff" stroke-width="3"/><path fill="#fff" d="M32 12 L39 32 H25Z"/><path fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round" d="M25 32 H39 L32 52Z"/><circle fill="#000" cx="32" cy="32" r="2.2"/>',
/*56 جمجمه و استخوان*/'<path d="M12 14 L52 54 M52 14 L12 54" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path fill="#fff" stroke="#000" stroke-width="2.5" d="M32 14 C23 14 19 20 19 27 C19 32 22 35 25 36 V42 H39 V36 C42 35 45 32 45 27 C45 20 41 14 32 14Z"/><circle fill="#000" cx="27" cy="28" r="3"/><circle fill="#000" cx="37" cy="28" r="3"/>',
/*57 شمشیر*/'<path fill="#fff" d="M32 5 L37 12 V40 H27 V12Z"/><rect fill="#fff" x="18" y="40" width="28" height="5" rx="2"/><rect fill="#fff" x="29.5" y="45" width="5" height="10"/><circle fill="#fff" cx="32" cy="57" r="3"/>',
/*58 هرم*/'<path fill="#fff" d="M32 8 L58 52 H6Z"/><path stroke="#000" stroke-width="2" fill="none" d="M32 8 L38 52 M20 30 H44 M13 41 H51"/>',
/*59 مارپیچ*/'<path d="M32 32 C32 28 36 28 36 32 C36 38 26 38 26 32 C26 24 40 22 42 32 C44 44 24 48 20 34 C16 20 36 12 46 22 C54 32 48 50 32 52" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>'
];
function defAv(n){n=String(n||'');let h=0;for(let i=0;i<n.length;i++)h+=n.charCodeAt(i);return h%60}
function avSvg(i){i=i|0;return (i<0||i>=AVB.length)?'':'<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="'+AVN[i]+'"><circle cx="32" cy="32" r="30.5" fill="#000" stroke="#fff" stroke-width="2"/>'+AVB[i]+'</svg>'}
function renderAv(){const cur=(FL&&FL.me&&FL.me.av!=null&&FL.me.av>=0)?FL.me.av|0:defAv(myName);$('avSw').innerHTML=AVB.map((_,i)=>'<button type="button" class="sw av'+(i===cur?' on':'')+'" data-a="'+i+'" aria-label="'+AVN[i]+'">'+avSvg(i)+'</button>').join('')}
$('avSw').onclick=e=>{const b=e.target.closest('button[data-a]');if(!b)return;const v=+b.dataset.a;if(FL.me)FL.me.av=v;renderAv();barUI();sendW({t:'setav',c:v})};
function renderSw(){const cur=((FL.me&&FL.me.pc)|0)%12;$('pcSw').innerHTML=PCOLS.map((c,i)=>'<button type="button" class="sw'+(i===cur?' on':'')+'" data-c="'+i+'" style="background:'+c+'" aria-label="'+PCN[i]+'"></button>').join('')}
$('pwSave').onclick=()=>{const n=$('pwNew').value,n2=$('pwNew2').value;
  const e=pwErr(n)||(n!==n2?'رمز جدید و تکرار آن یکسان نیست':'');if(e)return toast(e);
  sendW({t:'chpw',n,n2})};
$('pcSw').onclick=e=>{const b=e.target.closest('button[data-c]');if(!b)return;if(FL.me)FL.me.pc=+b.dataset.c;renderSw();sendW({t:'setcol',c:+b.dataset.c})};
$('idSave2').onclick=()=>sendW({t:'setid',id:$('idIn2').value.trim().replace(/^@/,'').toUpperCase()});
['auId','idIn2'].forEach(i=>$(i).addEventListener('input',e=>{const el=e.target,a=el.selectionStart,b=el.selectionEnd,v=el.value.toUpperCase();if(v!==el.value){el.value=v;try{el.setSelectionRange(a,b)}catch(_){}}}));
$('auU').addEventListener('input',e=>{if(!REG){const el=e.target,v=el.value.toUpperCase();if(v!==el.value)el.value=v}});
$('tbName').onclick=()=>openProfile(myName);
$('bnL').onclick=()=>goPage('scrDev');$('bnM').onclick=()=>goPage('scrMenu');$('bnR').onclick=()=>goPage('scrClan');
/* کشیدن انگشت: راست = صفحه چپ (در دست توسعه)، چپ = برگشت به منو؛ صفحه راست فعلاً خالی */
const PAGES=['scrDev','scrMenu','scrClan'];
function goPage(id){const a=PAGES.indexOf(curScr),b=PAGES.indexOf(id);pageGo(id,b>a?'inR':'inL')}
function pageGo(id,cls){if(curScr===id)return;showScr(id);const e=$(id);e.classList.remove('inL','inR');void e.offsetWidth;e.classList.add(cls)}
let sw=null;
document.addEventListener('touchstart',e=>{const t=e.touches[0];
  sw=(e.touches.length===1&&PAGES.includes(curScr)&&!e.target.closest('input,textarea,.ovl'))?{x:t.clientX,y:t.clientY}:null},{passive:true});
document.addEventListener('touchend',e=>{if(!sw)return;const t=e.changedTouches[0],dx=t.clientX-sw.x,dy=t.clientY-sw.y;sw=null;
  if(Math.abs(dx)<60||Math.abs(dx)<Math.abs(dy)*1.5)return;
  if(!$('ovFr').hidden||!$('ovMail').hidden||!$('ovSet').hidden||!$('ovCl').hidden)return;
  const i=PAGES.indexOf(curScr),n=PAGES[dx>0?i-1:i+1];if(n)goPage(n)},{passive:true});
document.addEventListener('touchcancel',()=>{sw=null},{passive:true});

$('pfX').onclick=()=>showScr('scrMenu');
$('pfClan').onclick=()=>{if(!PF||!PF.clan||!PF.clan.name)return;closeOv();const c=PF.clan,own=!!(CLAN&&CLAN.name===c.name);
  if(own){renderClDet()}else{$('clSet').hidden=true;$('clSetP').hidden=true;$('clDE').innerHTML=avSvg(clInfo(c,PF.name).sy);$('clDN').textContent=c.name;$('clTag').textContent=c.tag?'#'+c.tag:'';$('clDM').textContent=CL_MODE[c.mode]||'';$('clDO').textContent=c.owner?'👑 سازنده: '+c.owner:'';const m=Array.isArray(c.members)?c.members:null;{const ii=clInfo(c,PF.name);$('clDC').textContent='اعضا ('+(ii.n===undefined?'-':PX(ii.n))+'/'+PX(CLMAX)+')'}$('clDL').innerHTML=m?m.map(x=>'<div class="fr"><b>'+esc(typeof x==='string'?x:(x.u||''))+'</b></div>').join(''):''}
  $('clLeave').hidden=!own;leaveReset();$('ovCl').hidden=false};
$('tbMn').onclick=e=>{e.stopPropagation();const o=$('tbDrop').hidden;closeOv();$('tbDrop').hidden=!o};
document.addEventListener('click',e=>{if(!$('tbDrop').hidden&&!e.target.closest('#tbDrop'))$('tbDrop').hidden=true});
$('tbFr').onclick=()=>{const o=$('ovFr').hidden;closeOv();if(o){$('ovFr').hidden=false;renderTbFr()}};
$('tbSet').onclick=()=>{closeOv();$('idIn2').value=myId;$('nmIn').value=myName;$('nmPw').value='';$('setTag').textContent=myTag?'#'+myTag:'';['pwNew','pwNew2'].forEach(i=>$(i).value='');showSetPane('setM');$('ovSet').hidden=false};
$('tbMail').onclick=()=>{closeOv();$('ovMail').hidden=false;renderMail()};
$('ovFrClose').onclick=closeOv;$('ovSetClose').onclick=closeOv;$('ovMailClose').onclick=closeOv;
['ovFr','ovMail','ovSet'].forEach(id=>$(id).addEventListener('click',e=>{if(e.target===$(id))closeOv()}));
$('ovFrAdd').onclick=()=>{const u=$('ovFrU').value.trim();if(!u)return;sendW({t:'fadd',u});$('ovFrU').value=''};
function renderTbFr(){
  const L=FL.friends;
  $('ovFrList').innerHTML=L.length?L.map(f=>{
    const n=esc(f.u),sel=selFr===f.u;
    return '<div class="fr tap'+(sel?' sel':'')+'" data-n="'+n+'"><span><i class="od'+(f.on?' on':'')+'"></i><span class="nm"><b>'+n+'</b><small>'+(f.id?'@'+esc(f.id):'')+'</small></span><small>⚔️ '+(f.w|0)+'</small>'+(f.busy?'<small>در بازی</small>':'')+'</span><small>'+(sel?'▲':'▼')+'</small></div>'
    +(sel?'<div class="fopt"><button data-a="pf" data-u="'+n+'">👤 مشاهده پروفایل</button><button class="pr" data-a="inv" data-u="'+n+'">⚔️ درخواست نبرد دوستانه</button><button class="dg" data-a="frem" data-u="'+n+'">🗑 حذف دوست</button></div>':'')}).join('')
   :'<div class="sec">هنوز دوستی نداری. نام کاربری یا آیدی یکی را بالا بنویس، یا از تب «جستجو» پیدایش کن.</div>'}
$('ovFrList').onclick=e=>{
  const b=e.target.closest('button[data-a]');
  if(b){const a=b.dataset.a,u=b.dataset.u;
    if(a==='pf')openProfile(u);
    else if(a==='inv')sendW({t:'inv',u});
    else if(a==='frem'){if(confirm(u+' از دوستانت حذف شود؟')){sendW({t:'frem',u});selFr=''}}
    return}
  const r=e.target.closest('.fr[data-n]');if(!r)return;
  selFr=selFr===r.dataset.n?'':r.dataset.n;renderTbFr()};
function frTab(t){const s=t==='s';$('frPaneL').style.display=s?'none':'flex';$('frPaneS').style.display=s?'flex':'none';$('frTabL').classList.toggle('on',!s);$('frTabS').classList.toggle('on',s);if(s)setTimeout(()=>$('srQ').focus(),50)}
$('frTabL').onclick=()=>frTab('l');$('frTabS').onclick=()=>frTab('s');
$('tbFr').addEventListener('click',()=>{if(!$('ovFr').hidden)frTab('l')});
function doSearch(){const q=$('srQ').value.trim();if(!q)return;srQ=q;$('srRes').innerHTML='<div class="sec">در حال جستجو…</div>';sendW({t:'search',q})}
$('srGo').onclick=doSearch;$('srQ').onkeydown=e=>{if(e.key==='Enter')doSearch()};
function renderSearch(m){
  if(m.q!==srQ)return;let h='';
  if(m.p){const p=m.p;SR=p;
    const act=p.rel==='self'?'<small>این خودتی</small>':p.rel==='friend'?'<small>دوست توست</small>':p.rel==='out'?'<small>درخواست فرستاده شد</small>':'<button class="pr" data-a="sadd">➕ افزودن</button>';
    h='<div class="fr"><span><i class="od'+(p.on?' on':'')+'"></i><span class="nm"><b>'+esc(p.name)+'</b><small>'+(p.id?'@'+esc(p.id):'')+'</small></span><small>⚔️ '+(p.w|0)+'</small></span>'+act+'</div>'
     +'<button data-a="spf" type="button">👤 مشاهده پروفایل</button>'}
  else h='<div class="sec">بازیکنی با این آیدی پیدا نشد.</div>';
  $('srRes').innerHTML=h}
$('srRes').onclick=e=>{const b=e.target.closest('button[data-a]');if(!b||!SR)return;
  if(b.dataset.a==='spf')openProfile(SR.name,SR);
  else if(b.dataset.a==='sadd')sendW({t:'fadd',u:SR.name});
  else if(b.dataset.a==='sjoin')sendW({t:'cljoin',name:b.dataset.n})};
function mailTime(t){try{return new Date(t).toLocaleString('fa-IR',{dateStyle:'short',timeStyle:'short'})}catch(_){return ''}}
function renderMail(){
  $('ovMailList').innerHTML=MAIL.length?MAIL.map(x=>{
    const op=openMail===x.id,pend=x.type==='freq'&&FL.inc.some(n=>n.toLowerCase()===String(x.from).toLowerCase());
    return '<div class="ml'+(x.read?'':' un')+'" data-id="'+x.id+'"><div class="mh"><b>'+esc(x.title||'نامه')+'</b><small>'+mailTime(x.ts)+'</small></div>'
    +(op?'<div class="mb"><small>از: '+esc(x.from||'')+'</small><div>'+esc(x.text||'')+'</div><div class="row">'
      +(pend?'<button class="pr" data-a="facc" data-u="'+esc(x.from)+'">قبول</button><button data-a="fdec" data-u="'+esc(x.from)+'">رد</button>':'')
      +(x.type==='cinv'?'<button class="pr" data-a="clacc" data-u="'+esc(x.id)+'">قبول</button><button data-a="cldec" data-u="'+esc(x.id)+'">رد</button>':'')
      +'<button data-a="mdel">حذف نامه</button></div></div>':'')+'</div>'}).join('')
   :'<div class="sec">نامه‌ای نداری.</div>'}
$('ovMailList').onclick=e=>{
  const w=e.target.closest('.ml[data-id]');if(!w)return;const id=w.dataset.id,b=e.target.closest('button[data-a]');
  if(b){const a=b.dataset.a;if(a==='mdel'){sendW({t:'mdel',id});if(openMail===id)openMail=''}else sendW({t:a,u:b.dataset.u});return}
  if(e.target.closest('.mh')){openMail=openMail===id?'':id;const x=MAIL.find(m=>m.id===id);if(openMail&&x&&!x.read)sendW({t:'mrd',id});renderMail()}};


/* --- قبیله --- */
const CL_MODE={open:'🌍 باز · همه می‌توانند عضو شوند',closed:'🔒 بسته · کسی نمی‌تواند عضو شود',invite:'✉️ با دعوت · فقط با دعوت سازنده'};
function renderClan(force){
  const has=!!CLAN;$('clNone').hidden=has;$('clIn').hidden=!has;$('clBox').classList.toggle('chatm',has);
  if(!has){$('clBody').innerHTML='<button class="big pr" data-a="new" type="button">🛡 ساخت قبیله</button><button class="big blk" data-a="join" type="button">عضو شدن در یک قبیله</button>';$('ovCl').hidden=true;return}
  $('clBarN').textContent='🛡 '+CLAN.name;$('clBarOn').textContent='🟢 '+(CLAN.on|0)+' نفر آنلاین';
  renderChat(force);if(!$('ovCl').hidden)renderClDet()}
function renderClDet(){
  {const sy=CLAN.sy!=null?CLAN.sy|0:defAv(CLAN.name);$('clDE').innerHTML=avSvg(sy);$('clDE').hidden=false;const ow=!!(myName&&CLAN.owner===myName);$('clSet').hidden=!ow;if(!ow)$('clSetP').hidden=true;$('clSw2').innerHTML=AVB.map((_,i)=>'<button type="button" class="sw av'+(i===sy?' on':'')+'" data-a="'+i+'" aria-label="'+AVN[i]+'">'+avSvg(i)+'</button>').join('')}
  $('clDN').textContent=CLAN.name;$('clTag').textContent='#'+(CLAN.tag||'');$('clDM').textContent=CL_MODE[CLAN.mode]||'';$('clDO').textContent='👑 سازنده: '+CLAN.owner;
  $('clDC').textContent='اعضا ('+PX(CLAN.members.length)+'/'+PX(CLMAX)+') · '+(CLAN.on|0)+' آنلاین';
  $('clDL').innerHTML=CLAN.members.map(x=>'<div class="fr"><b><i class="dotm'+(x.on?' on':'')+'"></i>'+esc(x.u)+'</b></div>').join('')}
let leaveT=0;
$('clSet').onclick=()=>{$('clSetP').hidden=!$('clSetP').hidden};
$('clSw2').onclick=e=>{const b=e.target.closest('button[data-a]');if(!b||!CLAN||CLAN.owner!==myName)return;const v=+b.dataset.a;CLAN.sy=v;renderClDet();sendW({t:'clsetsy',sy:v});if(PF&&PF.clan&&PF.clan.name===CLAN.name)clCardUI(PF)};
function leaveReset(){clearTimeout(leaveT);$('clLeave').classList.remove('arm');$('clSetP').hidden=true;$('clLeave').textContent='🚪 ترک قبیله'}
$('clBar').onclick=()=>{if(!CLAN)return;closeOv();renderClDet();$('clLeave').hidden=false;leaveReset();$('ovCl').hidden=false};
$('ovClClose').onclick=()=>{$('ovCl').hidden=true;leaveReset()};
$('ovCl').addEventListener('click',e=>{if(e.target===$('ovCl')){$('ovCl').hidden=true;leaveReset()}});
$('clTag').onclick=e=>copyTxt(e.target.textContent,'تگ قبیله کپی شد');
$('clLeave').onclick=()=>{const b=$('clLeave');
  if(!b.classList.contains('arm')){b.classList.add('arm');b.textContent='⚠️ مطمئنی؟ دوباره بزن';leaveT=setTimeout(leaveReset,4000);return}
  leaveReset();$('ovCl').hidden=true;sendW({t:'clleave'})};
function renderChat(force){
  const box=$('clLog');if(!box)return;
  const near=box.scrollHeight-box.scrollTop-box.clientHeight<80;
  box.innerHTML=CLCHAT.length?CLCHAT.map(x=>x.sys?'<div class="cmsg" style="background:'+(x.sys==='join'?'#b8860b':'#000')+';text-align:center">'+esc(x.u)+(x.sys==='join'?' وارد قبیله شد':' از قبیله خارج شد')+'</div>':'<div class="cmsg'+(x.u===myName?' me':'')+'" style="background:'+ccCol(x.c)+'"><small>'+esc(x.u)+'</small>'+esc(x.tx)+'</div>').join(''):'<div class="sec">هنوز پیامی نیست؛ اولین نفر باش!</div>';
  if(force||near)box.scrollTop=box.scrollHeight}
function sendChat(){const tx=$('clText').value.trim();if(!tx)return;sendW({t:'clsay',tx});$('clText').value=''}
$('clSend').onclick=sendChat;
$('clText').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();sendChat()}};
$('clBody').onclick=e=>{const b=e.target.closest('button[data-a]');if(!b)return;
  if(b.dataset.a==='new'){clSy=(Math.random()*AVB.length)|0;renderClSw();$('clName').value='';$('clMsg').textContent='';clMode='open';clModeUI();showScr('scrClanNew')}
  else{clQv='';$('clQ').value='';$('clJoinList').innerHTML='';showScr('scrClanJoin');setTimeout(()=>$('clQ').focus(),50)}};
let clSy=0;function renderClSw(){$('clSw').innerHTML=AVB.map((_,i)=>'<button type="button" class="sw av'+(i===clSy?' on':'')+'" data-a="'+i+'" aria-label="'+AVN[i]+'">'+avSvg(i)+'</button>').join('')}
$('clSw').onclick=e=>{const b=e.target.closest('button[data-a]');if(!b)return;clSy=+b.dataset.a;renderClSw()};
function clModeUI(){document.querySelectorAll('#scrClanNew .cm').forEach(b=>b.classList.toggle('on',b.dataset.m===clMode))}
document.querySelectorAll('#scrClanNew .cm').forEach(b=>b.onclick=()=>{clMode=b.dataset.m;clModeUI()});
$('clMake').onclick=()=>{const name=$('clName').value.trim().replace(/\s+/g,' ');
  if(name.length<3){$('clMsg').textContent='نام قبیله باید حداقل ۳ حرف باشد';return}
  $('clMsg').textContent='';sendW({t:'clcreate',name,mode:clMode,sy:clSy})};
$('clNewBack').onclick=()=>showScr('scrClan');$('clJoinBack').onclick=()=>showScr('scrClan');
let clQv='';
function doClFind(){const q=$('clQ').value.trim();if(!q)return;clQv=q;$('clJoinList').innerHTML='<div class="sec">در حال جستجو…</div>';sendW({t:'clfind',q})}
$('clFind').onclick=doClFind;$('clQ').onkeydown=e=>{if(e.key==='Enter')doClFind()};
function renderClJoin(m){
  if(curScr!=='scrClanJoin'||m.q!==clQv)return;const c=m.clan;
  $('clJoinList').innerHTML=c?'<div class="fr"><span class="nm"><b>🛡 '+esc(c.name)+'</b><small>#'+esc(c.tag||'')+' · 👥 '+c.n+' · 👑 '+esc(c.owner)+'</small></span>'+(c.mode==='open'?'<button class="pr" data-n="'+esc(c.name)+'">عضو شو</button>':'<small>'+(c.mode==='closed'?'🔒 بسته':'✉️ با دعوت')+'</small>')+'</div>':'<div class="sec">قبیله‌ای با این نام یا تگ پیدا نشد.</div>'}
$('clJoinList').onclick=e=>{const b=e.target.closest('button[data-n]');if(b)sendW({t:'cljoin',name:b.dataset.n})};
$('pfInv').onclick=()=>sendW({t:'clinv',u:$('pfName').textContent});

showScr('scrAuth');
if(ls('jt_tok'))$('auMsg').textContent='';
connect();
/* بازی فقط با شروع واقعی (init از net) اجرا می‌شود، نه موقع باز شدن صفحه */


/* ===== ارتقای گرافیک: Bloom، مه، گرد و غبار، نور گوشه‌ها، تنظیم کیفیت ===== */
(function(){
'use strict';
var NODOTS=true;var GQ='low';try{GQ=localStorage.getItem('jt_gq')||'low'}catch(e){}
var AA0=(GQ==='high'||GQ==='master'||GQ==='ultra'||GQ==='max');
if(['high','mid','master','ultra','max'].indexOf(GQ)<0)GQ='low';
var HQ=GQ==='high'||GQ==='master'||(GQ==='ultra'||GQ==='max'),MQ=GQ==='mid',MS=HQ,UL=GQ==='master'||(GQ==='ultra'||GQ==='max'),XT=(GQ==='ultra'||GQ==='max'),MX=GQ==='max',ulBuilt=false,sweep,bl,bctx,bfr=0,inst=false,built=false,ENV=null,emb,embPos,embVel,embSeed,lastKey='';
var _r,dust,dustPos,dustVel,mist=[],lights=[],vig;
function sv(v){try{localStorage.setItem('jt_gq',v)}catch(e){}}
/* --- Vignette --- */
function mkVig(){var st=document.getElementById('stage');if(!st)return;
 var cs=getComputedStyle(st);if(cs.position==='static')st.style.position='relative';
 vig=document.createElement('div');vig.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:2;background:radial-gradient(ellipse at 50% 45%,rgba(0,0,0,0) 55%,rgba(0,0,0,.5) 100%);transition:opacity .4s';
 st.appendChild(vig)}
/* --- Settings UI --- */
function mkUI(){var p=document.getElementById('setG');if(!p||document.getElementById('gqSec'))return;
 var d=document.createElement('div');d.id='gqSec';
 d.innerHTML='<div class="sec">کیفیت گرافیک</div><div style="display:flex;flex-direction:column;gap:6px;margin:6px 0 10px"><button type="button" id="gqL" class="pr" style="width:100%">کم</button><button type="button" id="gqM" class="pr" style="width:100%">متوسط</button><button type="button" id="gqH" class="pr" style="width:100%">بالا</button><button type="button" id="gqS" class="pr" style="width:100%">شاهکار</button><button type="button" id="gqU" class="pr" style="width:100%">فوق شاهکار</button><button type="button" id="gqX" class="pr" style="width:100%;font-weight:700">حداکثر</button></div><div class="sec" style="margin-top:12px">بافت</div><div style="display:flex;gap:6px;margin:6px 0 10px"><button type="button" id="txB1" class="pr" style="flex:1">۱</button><button type="button" id="txB2" class="pr" style="flex:1">۲</button><button type="button" id="txB4" class="pr" style="flex:1">۴</button><button type="button" id="txB8" class="pr" style="flex:1">۸</button></div><div class="sec" style="margin-top:12px">نرخ فریم</div><div style="display:flex;gap:6px;margin:6px 0 10px"><button type="button" id="fpsB30" class="pr" style="flex:1">۳۰</button><button type="button" id="fpsB60" class="pr" style="flex:1">۶۰</button><button type="button" id="fpsB90" class="pr" style="flex:1">۹۰</button><button type="button" id="fpsB120" class="pr" style="flex:1">۱۲۰</button></div><div class="sec" style="margin-top:12px">انیمیشن‌های بیشتر</div><div style="display:flex;gap:6px;margin:6px 0 10px"><button type="button" id="idOn" class="pr" style="flex:1">روشن</button><button type="button" id="idOff" class="pr" style="flex:1">خاموش</button></div>';
 
 d.querySelector('#gqH').onclick=function(){setQ('high',true)};
 d.querySelector('#gqM').onclick=function(){setQ('mid',true)};
 d.querySelector('#gqL').onclick=function(){setQ('low',true)};
 d.querySelector('#gqS').onclick=function(){setQ('master',true)};
 d.querySelector('#gqU').onclick=function(){setQ('ultra',true)};
 d.querySelector('#gqX').onclick=function(){setQ('max',true)};
 [1,2,4,8].forEach(function(n){d.querySelector('#txB'+n).onclick=function(){setTX(n)}});
 d.querySelector('#fpsB30').onclick=function(){window.setFPS&&window.setFPS(30)};
 d.querySelector('#fpsB60').onclick=function(){window.setFPS&&window.setFPS(60)};
 d.querySelector('#fpsB90').onclick=function(){window.setFPS&&window.setFPS(90)};
 d.querySelector('#fpsB120').onclick=function(){window.setFPS&&window.setFPS(120)};
 d.querySelector('#idOn').onclick=function(){GX.idle=true;try{localStorage.setItem('jt_idle','1')}catch(e){}window.paintIdle()};
 d.querySelector('#idOff').onclick=function(){GX.idle=false;try{localStorage.setItem('jt_idle','0')}catch(e){}window.paintIdle()};
 paintUI();p.insertBefore(d,p.querySelector('.sec:nth-of-type(1)')||p.firstChild);}
window.paintIdle=function(){selStyle(document.getElementById('idOn'),GX.idle!==false);selStyle(document.getElementById('idOff'),GX.idle===false)};
function selStyle(b,on){if(!b)return;b.style.opacity=1;b.style.outline='none';b.style.background=on?'#f2c14e':'#000';b.style.color=on?'#1a1405':'#e9ecf1';b.style.borderColor=on?'#f2c14e':'#313744';b.style.fontWeight=on?'700':'400'}
window.jtSel=selStyle;
function paintTX(){[1,2,4,8].forEach(function(n){var b=document.getElementById('txB'+n);if(!b)return;var ok=n<=window.__TXMAX(GQ);selStyle(b,window.__TEX===n);b.disabled=!ok;if(!ok)b.style.opacity=.3})}
function setTX(n){if(n>window.__TXMAX(GQ)||n===window.__TEX)return;window.__TEX=n;try{localStorage.setItem('jt_tx',GQ+':'+n)}catch(e){}rebuildUnits();paintTX();if(typeof toast==='function')toast('بافت: '+n+'×')}
function paintUI(){paintTX();var h=document.getElementById('gqH'),m=document.getElementById('gqM'),l=document.getElementById('gqL');if(!h)return;
 [[h,GQ==='high'],[m,MQ],[l,GQ==='low'],[document.getElementById('gqS'),GQ==='master'],[document.getElementById('gqU'),GQ==='ultra'],[document.getElementById('gqX'),GQ==='max']].forEach(function(a){selStyle(a[0],a[1])});window.paintFPS&&window.paintFPS();window.paintIdle&&window.paintIdle()}
function rebuildUnits(){try{
 Object.keys(GX).forEach(function(k){if(k.charAt(0)==='_'&&k.charAt(1)!=='_')delete GX[k]});
 for(const [u,g] of [...unitG]){scene.remove(g);g.traverse(o=>{if(o.geometry&&!o.userData.gxm)o.geometry.dispose();if(o.material){if(o.material.map)o.material.map.dispose();o.material.dispose()}});
  g.userData.pick.forEach(m=>{const i=pickables.indexOf(m);if(i>=0)pickables.splice(i,1)});unitG.delete(u)}
 if(typeof syncUnits==='function')syncUnits();
}catch(e){console.warn('rebuildUnits',e)}}
function setQ(q,msg){try{window.__UL=q==='master'||(q==='ultra'||q==='max');window.__MS=q==='high'||q==='master'||(q==='ultra'||q==='max');window.__HQ=window.__MS}catch(e){}GQ=q;HQ=q==='high'||q==='master'||(q==='ultra'||q==='max');MQ=q==='mid';MS=HQ;UL=q==='master'||(q==='ultra'||q==='max');XT=(q==='ultra'||q==='max');MX=q==='max';window.__MX=MX;window.__FXQ=UL?2:HQ?1.5:.3;window.__HQ=HQ;window.__MS=MS;window.__UL=UL;RS=1;sv(q);window.__TEX=window.__TXDEF(q);try{localStorage.setItem('jt_tx',q+':'+window.__TEX)}catch(e){}apply();try{applyBoard();if(MS)tiles.forEach(function(c){c&&c.forEach(function(t){if(t&&t.material)t.material.envMapIntensity=0})})}catch(e){}rebuildUnits();try{resize()}catch(e){}paintUI();
 if(msg&&typeof toast==='function')toast('کیفیت گرافیک: '+({low:'کم',mid:'متوسط',high:'بالا',master:'شاهکار',ultra:'فوق شاهکار',max:'حداکثر'})[q]+(((q==='high'||q==='master'||q==='ultra'||q==='max')!==AA0)?' — برای اعمال کامل صفحه رو رفرش کن':''))}
function lt(){var o={sun:null,hemi:null,dirs:[]};scene.traverse(function(x){if(x.isDirectionalLight){if(x.castShadow||x.userData.isSun){x.userData.isSun=true;o.sun=x}else o.dirs.push(x)}else if(x.isHemisphereLight)o.hemi=x});return o}
var RS=1;function resTarget(){return Math.round((MX?1440:XT?1350:(HQ||MQ)?1080:720)*RS)}
function apply(){
 if(typeof renderer==='undefined'||!renderer)return;
  renderer.shadowMap.enabled=XT;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 renderer.toneMappingExposure=UL?1.1:MS?1.05:.9;
 var L=lt();
 if(L.sun){L.sun.castShadow=XT;L.sun.shadow.bias=-.0004;L.sun.shadow.normalBias=.03;var ms=MX?2048:512;
  if(L.sun.shadow.mapSize.x!==ms){L.sun.shadow.mapSize.set(ms,ms);if(L.sun.shadow.map){L.sun.shadow.map.dispose();L.sun.shadow.map=null}}
  L.sun.intensity=MS?.85:HQ?.7:.8}
 if(L.hemi)L.hemi.intensity=MS?.55:HQ?.5:.7;
 L.dirs.forEach(function(l){if(l.userData.b0==null)l.userData.b0=l.intensity;l.visible=HQ;l.intensity=l.userData.b0*(MX?2:MS?1.8:1)});
 if(!ENV&&scene.environment)ENV=scene.environment;
 scene.environment=HQ?ENV:null;
 if(HQ&&!built){built=true;try{addScene();mkVig()}catch(e){console.warn('gfx scene',e)}}
 if(MS&&!emb){try{addEmbers()}catch(e){console.warn('embers',e)}}
 if(dust)dust.visible=HQ&&(!NODOTS||MX);mist.forEach(function(m){m.visible=HQ});
 if(UL&&!ulBuilt){ulBuilt=true;try{addUltra()}catch(e){console.warn('ultra',e)}}
 if(sweep)sweep.visible=UL;if(bl)bl.style.display=UL?'block':'none';
 if(emb)emb.visible=MS&&(!NODOTS||MX);
 lights.forEach(function(l){l.visible=false;l.intensity=0});
 if(vig)vig.style.opacity=MS?1:HQ?.75:0;
 try{renderer.domElement.style.filter=''}catch(e){}
 try{var mx=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  scene.traverse(function(o){var m=o.material;if(m&&m.map&&MS&&m.map.anisotropy<mx){m.map.anisotropy=mx;m.map.needsUpdate=true}
   if(m&&m.isMeshStandardMaterial){if(m.userData.e0==null)m.userData.e0=m.envMapIntensity;m.envMapIntensity=UL?Math.max(m.userData.e0,.25)*2.2:m.userData.e0}});
  if(typeof tiles!=='undefined')tiles.forEach(function(col){col.forEach(function(t){var m=t.material;if(m&&m.roughness!==undefined){if(m.userData.r0==null)m.userData.r0=m.roughness;if(m.userData.m0==null)m.userData.m0=m.metalness;m.roughness=1;m.metalness=m.userData.m0;var e0=m.userData.e0!=null?m.userData.e0:m.envMapIntensity;m.envMapIntensity=0}})})}catch(e){}
 try{applyBoard();if(MS)tiles.forEach(function(c){c&&c.forEach(function(t){if(t&&t.material)t.material.envMapIntensity=0})})}catch(e){}
 var key=[HQ,MQ,MS,UL,XT,MX].join();
 if(key!==lastKey){lastKey=key;scene.traverse(function(o){if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(function(m){m.needsUpdate=true})}})}
 try{resize()}catch(e){}}
/* --- Scene additions --- */
function softTex(){var c=document.createElement('canvas');c.width=c.height=64;var x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);
 g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.4,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);
 var t=new THREE.CanvasTexture(c);return t}
function mistTex(){var c=document.createElement('canvas');c.width=c.height=256;var x=c.getContext('2d');x.clearRect(0,0,256,256);
 for(var i=0;i<46;i++){var px=Math.random()*256,py=Math.random()*256,r=30+Math.random()*50;
  for(var ox=-256;ox<=256;ox+=256)for(var oy=-256;oy<=256;oy+=256){var g=x.createRadialGradient(px+ox,py+oy,0,px+ox,py+oy,r);g.addColorStop(0,'rgba(255,240,220,.22)');g.addColorStop(1,'rgba(255,240,220,0)');x.fillStyle=g;x.fillRect(0,0,256,256)}}
 var t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t}
function addScene(){
 var C=CTR,N=UL?300:MS?180:100;
 var g=new THREE.BufferGeometry();dustPos=new Float32Array(N*3);dustVel=new Float32Array(N*3);
 for(var i=0;i<N;i++){dustPos[i*3]=C.x+(Math.random()-.5)*13;dustPos[i*3+1]=.2+Math.random()*4.5;dustPos[i*3+2]=C.z+(Math.random()-.5)*18;
  dustVel[i*3]=(Math.random()-.5)*.15;dustVel[i*3+1]=.05+Math.random()*.12;dustVel[i*3+2]=(Math.random()-.5)*.15}
 g.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
 dust=new THREE.Points(g,new THREE.PointsMaterial({map:softTex(),size:.16,color:0xffd9a0,transparent:true,opacity:.55,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true,fog:true}));
 dust.frustumCulled=false;dust.renderOrder=3;scene.add(dust);
 var mt=mistTex();
 [].forEach(function(a){
  var t=mt.clone();t.needsUpdate=true;t.repeat.set(a[4],a[4]*1.4);
  var m=new THREE.Mesh(new THREE.PlaneGeometry(13,18).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:t,transparent:true,opacity:a[1],depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));
  m.position.set(C.x,a[0],C.z);m.renderOrder=2;m.userData.v=[a[2],a[3]];scene.add(m);mist.push(m)});
 [[-1,1],[1,1],[-1,-1],[1,-1]].forEach(function(s){
  var l=new THREE.PointLight(0xe8a33d,.7,8,2);l.position.set(C.x+s[0]*5.9,.9,C.z+s[1]*8.5);scene.add(l);lights.push(l)})}
function addEmbers(){var N=UL?140:80,C=CTR,g=new THREE.BufferGeometry();embPos=new Float32Array(N*3);embVel=new Float32Array(N);embSeed=new Float32Array(N);
 for(var i=0;i<N;i++){embSeed[i]=Math.random()*6.28;embVel[i]=.25+Math.random()*.35;embPos[i*3]=C.x+(Math.random()-.5)*12;embPos[i*3+1]=Math.random()*5;embPos[i*3+2]=C.z+(Math.random()-.5)*17}
 g.setAttribute('position',new THREE.BufferAttribute(embPos,3));
 emb=new THREE.Points(g,new THREE.PointsMaterial({map:softTex(),size:.2,color:0xffa24a,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true,fog:true}));
 emb.frustumCulled=false;emb.renderOrder=4;scene.add(emb)}
function addUltra(){var C=CTR;
 var st=document.getElementById('stage');
 if(st){bl=document.createElement('canvas');bl.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;mix-blend-mode:screen;opacity:.3;display:none';st.appendChild(bl);bctx=bl.getContext('2d')}}
function bloom(){if(!bl||!bctx||(++bfr%3))return;var st=bl.parentNode,w=Math.max(8,(st.clientWidth/8)|0),h=Math.max(8,(st.clientHeight/8)|0);
 if(bl.width!==w||bl.height!==h){bl.width=w;bl.height=h}bctx.drawImage(renderer.domElement,0,0,w,h)}
/* --- Per-frame --- */
var last=0,acc=0,n=0,t0=0,degraded=false;
var sf=0,pf=0,fc=0,ft=0,fHid=false,shf=0;
function adapt(now){
 if(document.hidden)fHid=true;
 if(!ft){ft=now;return}
 fc++;
 if(now-ft>=2){var fps=fc/(now-ft);
    fc=0;ft=now;fHid=false}}
function frame(){
 var now=performance.now()/1000,dt=Math.min(.05,now-last||.016);last=now;
 adapt(now);
 if(XT&&(++shf%2)===0)renderer.shadowMap.needsUpdate=true;
 if((!NODOTS||MX)&&HQ&&dust&&((pf++)&1)===0){var d2=dt*2;
  for(var i=0;i<dustPos.length;i+=3){dustPos[i]+=dustVel[i]*d2;dustPos[i+1]+=dustVel[i+1]*d2;dustPos[i+2]+=dustVel[i+2]*d2;
   if(dustPos[i+1]>4.8){dustPos[i+1]=.1}}
  dust.geometry.attributes.position.needsUpdate=true;
  mist.forEach(function(m){var t=m.material.map;t.offset.x+=m.userData.v[0]*d2;t.offset.y+=m.userData.v[1]*d2})}
 if(MS){
  if(emb&&(!NODOTS||MX)){for(var j=0,e=0;j<embVel.length;j++,e+=3){embPos[e]+=Math.sin(now*.8+embSeed[j])*.25*dt;embPos[e+1]+=embVel[j]*dt;embPos[e+2]+=Math.cos(now*.6+embSeed[j])*.2*dt;if(embPos[e+1]>5.2)embPos[e+1]=.1}
   emb.geometry.attributes.position.needsUpdate=true}
  lights.forEach(function(l,i){l.intensity=.6+.14*Math.sin(now*7+i*2)+.07*Math.sin(now*13.3+i*5)});
  if(UL&&sweep){sweep.position.set(CTR.x+Math.sin(now*.4)*5,1.2,CTR.z+Math.cos(now*.27)*7.5)}}
 if(typeof unitG!=='undefined')unitG.forEach(function(g){var l=g.userData&&g.userData.lb;if(l&&l.sp&&l.sp.layers.mask!==2)l.sp.layers.set(1)});
 if(typeof pops!=='undefined')pops.forEach(function(p){if(p.sp&&p.sp.layers.mask!==2)p.sp.layers.set(1)});
}
function install(){
 if(inst)return;if(typeof renderer==='undefined'||!renderer||typeof scene==='undefined'||!scene||typeof camera==='undefined'||!camera||typeof CTR==='undefined')return;
 inst=true;_r=renderer.render;
 var _ss=renderer.setSize;renderer.setSize=function(w,h,u){try{renderer.setPixelRatio(Math.min(resTarget()/Math.max(1,Math.min(w,h)),Math.max(1,devicePixelRatio||1)*(MX?1.5:XT?1.25:1)))}catch(e){}return _ss.call(renderer,w,h,u)};
 
 renderer.render=function(s,c){
  if(s!==scene||c!==camera)return _r.call(renderer,s,c);
  try{frame()}catch(e){}
  c.layers.mask=3;var rr=_r.call(renderer,s,c);if(UL){try{bloom()}catch(e){}}return rr};
 var pc=placeCamera;
 placeCamera=function(){pc();if(MS){var t=performance.now()/1000;camera.lookAt(CTR.x,0,CTR.z+.3)}};
 mkUI();apply()}

/* --- صدا + پنل «گرافیک و صدا» --- */
var VOL=80,MUTE=false;
try{var v=localStorage.getItem('jt_vol');if(v!==null)VOL=Math.max(0,Math.min(100,+v||0));MUTE=localStorage.getItem('jt_mute')==='1'}catch(e){}
window.jtVol=function(){return MUTE?0:VOL/100};
function applyVol(){try{if(typeof MG!=='undefined'&&MG)MG.gain.value=MUTE?0:VOL/100}catch(e){}}
function paintSnd(){var r=document.getElementById('volR'),t=document.getElementById('volV'),m=document.getElementById('muteB');if(!r)return;
 r.value=VOL;t.textContent=VOL+'٪';m.textContent=MUTE?'صدا قطع است (برای وصل‌کردن بزن)':'قطع صدا'}
function initSnd(){
 var r=document.getElementById('volR'),m=document.getElementById('muteB'),g=document.getElementById('setGoG');if(!r||!g)return;
 r.oninput=function(){VOL=+r.value;if(MUTE&&VOL>0)MUTE=false;try{localStorage.setItem('jt_vol',VOL);localStorage.setItem('jt_mute',MUTE?'1':'0')}catch(e){}applyVol();paintSnd()};
 m.onclick=function(){MUTE=!MUTE;try{localStorage.setItem('jt_mute',MUTE?'1':'0')}catch(e){}applyVol();paintSnd()};
 g.onclick=function(){showSetPane('setG')};var ga=document.getElementById('setGoA');if(ga)ga.onclick=function(){showSetPane('setA')};
 var _au=au;au=function(){var a=_au();applyVol();return a};
 var _sp=showSetPane;showSetPane=function(p){['setM','setS','setP','setG','setA','setI'].forEach(function(i){var e=document.getElementById(i);if(e)e.hidden=i!==p});if(p==='setP'){renderSw();renderCc();renderAv()}if(p==='setG'){paintUI()}if(p==='setA'){paintSnd()}};
 mkUI();paintSnd()}
try{initSnd()}catch(e){console.warn('snd',e)}
var iv=setInterval(function(){try{install()}catch(e){inst=true;console.warn('gfx install',e)}if(inst)clearInterval(iv)},300);
})();


/* ===== دانش‌نامه (نسخهٔ جدید) ===== */
(function(){
'use strict';
var EM={acro:'',aka:'',cri:'',doj:'',pri:'',raf:'',bri:'',ali:'',mar:'',mak:'',and:'',zep:'',jack:'',blk:'',jal:'',ikh:'',col:'',ear:'',ik:'',iw:'',mus:'',ske:'',bud:'',que:'',fd:'',ft:'',mac:'',eld:'',spg:'',med:'',eli:'',ber:'',dk:'',gq:'',dn:'',dw:''};
/* [نقش، حملهٔ معمولی، قابلیت] */
var HD={
acro:['فرمانده شوالیه‌های سلطنتی به اسم ایزابلا؛ کسی که سبک مبارزه شوالیه‌ای را با چابکی ترکیب کرد.','به یک دشمن آسیب مستقیم وارد می‌کند.','میان دشمن‌های به‌هم‌پیوسته زنجیره‌وار جابه‌جا می‌شود و به هرکدام آسیب می‌زند. مسیرش را طوری انتخاب می‌کند که بیشترین دشمن ممکن را بزند و در پایان حمله، جایی فرود بیاید که کمترین دشمن و کمترین خطر برای خودش باشد.'],
aka:['رهبر سامورایی‌ها؛ مردی تندرو که از وسط صف دشمنان عبور می‌کند.','به یک دشمن آسیب مستقیم وارد می‌کند.','به انتخاب کاربر در یکی از شش جهت مستقیم، از میان همه‌ی دشمن‌های آن خط رد می‌شود، به هرکدام آسیب وارد می‌کند و پشت سر آخرین دشمنی که فضای خالی دارد می‌ایستد. برای یک نوبت، ضربه‌اش ۵۰٪ شانس دارد تا ۱۰۰٪ آسیب بیشتر وارد کند.'],
cri:['پادشاه سرخ؛ دارای بیشترین تحمل ضربه','به یک دشمن آسیب مستقیم وارد می‌کند.','بخش بزرگی از تحمل‌ضربه‌ی خود را بازیابی می‌کند.'],
doj:['خواهر کوچک‌تر شاهدخت اول که راه قدیس شدن را در پیش گرفت','آسیب مستقیم به دشمن با دو شمشیر. اگر دو دشمن در فاصله‌ی یکسان باشند، احتمال پخش آسیب بین دو دشمن وجود دارد.','به یک قهرمان دشمن تصادفی تا فاصله‌ی سه خانه آسیب وارد می‌کند و بخشی از تحمل‌ضربه‌اش را بازیابی می‌کند.'],
pri:['بانویی حریص و فرصت‌جو؛ وارث تاج و تخت پادشاه سلطنتی','به یک دشمن آسیب مستقیم وارد می‌کند.','بخشی از تحمل‌ضربه‌ی پرتحمل‌ترین متحد را می‌دزدد و تحمل‌ضربه‌ی خودش را بازیابی می‌کند.'],
raf:['جادوگر ارشد دربار سلطنتی، پرتجربه‌ترین جادوگر در قید حیات','به نزدیک‌ترین دشمن آسیب می‌زند. آسیب در امتداد خط تا سومین کاشی پرتاب می‌شود.','سه راند پرواز می‌کند و دشمنانی با هدف‌گیری زمینی نمی‌توانند او را هدف قرار دهند.'],
bri:['برخاسته از گور برای زندگی پس از مرگ','به یک دشمن آسیب مستقیم وارد می‌کند. دشمنی که ضربه می‌خورد برای یک راند ۵۰٪ از نظر قدرت تضعیف می‌شود.','در یکی از خانه‌های خالی اطرافش، به انتخاب کاربر، الدرلیچ را احضار می‌کند؛ اسکلتی غول‌پیکر که برای محافظت از عروس مرده از گور برخاسته است.'],
ali:['آلیس ماگاریت، سرجوخه نیروی دریایی سلطنتی و یک تک‌تیرانداز ماهر','به یک دشمن آسیب مستقیم وارد می‌کند.','به انتخاب کاربر به یک دشمن در یکی از شش جهت مستقیم آسیب وارد می‌کند.'],
mar:['عطشی بی‌رقیب برای کشتن، بدون رحم به دشمنان و حتی متحدین','به یک دشمن آسیب مستقیم وارد می‌کند. هر بار که موفق شود قهرمانی را بکشد، قدرتش بیشتر می‌شود.','می‌تواند به یکی از قهرمانان متحد در شعاعش، به انتخاب بازیکن، ضربه بزند. در صورت کشته شدن قهرمان متحد، ژنرال مارسا قوی‌تر می‌شود.'],
mak:['ملکهٔ قمار که از اعتیاد به قمار رنج می‌برد.','به یک دشمن آسیب مستقیم وارد می‌کند. در هر شلیک، به احتمال ۱/۶ در قمار شکست می‌خورد و به خودش شلیک می‌کند. اگر پنج شلیک موفق انجام دهد، شلیک ششم حتماً به خودش اصابت می‌کند. وقتی خشاب اسلحه‌اش خالی باشد، با حرکت کردن خشابش تعویض می‌شود. گلوله‌هایش از سپر عبور می‌کند.','در هر مقطع خشابش را کامل بازیابی می‌کند.'],
and:['درحال ساختن یک سیاه‌چاله با جادو، مزاحم نشوید!','به یک دشمن آسیب مستقیم وارد می‌کند.','تلنبار حمله‌های معمولی که تبدیل به یک سیاه‌چاله می‌شود؛ سیاه‌چاله بعد از فعال شدن پتانسیل قوی‌تر شدن برای استفاده دارد. در صورت استفاده از قابلیت، سیاه‌چاله به یک قهرمان حریف به‌طور تصادفی آسیب می‌زند و تمام انرژی‌اش تخلیه می‌شود.'],
zep:['شکارچی خرس‌های قطبی؛ بعد از غیرقانونی شدن شکار خرس، قهرمان شکار می‌کند.','به یک دشمن آسیب مستقیم وارد می‌کند. هرچه دشمن دورتر باشد، آسیب کمتری می‌بیند.','آسیب مخروطی گسترده در یکی از شش جهت، به انتخاب کاربر. آسیب به دشمن، مانند حمله‌ی معمولی، به فاصله‌ی دشمن بستگی دارد.'],
jack:['جسدهایی کشته‌شده با کارت در ماکائو که شاهدان این اتفاق را به جک نسبت می‌دهند.','تعداد زیادی کارت به نزدیک‌ترین دشمن پرتاب می‌کند. اگر حداقل دو دشمن در فاصله‌ی یکسان باشند، آسیب میان آن‌ها به‌طور تصادفی پخش می‌شود.','کارت‌های کمتر ولی قوی‌تر به نزدیک‌ترین دشمن پرتاب می‌کند. اگر حداقل دو دشمن در فاصله‌ی یکسان باشند، آسیب میان آن‌ها به‌طور تصادفی پخش می‌شود.'],
blk:['فرزندی دورگه از انسان و اهریمن؛ با خودش عهد بسته از بال‌هایش برای پرواز استفاده نکند','به یک دشمن آسیب مستقیم وارد می‌کند.','یکی از بال‌هایش را، به انتخاب کاربر، به یک دشمن اطراف خودش می‌کوبد و همان بال را برای خودش سپر می‌کند.'],
jal:['جلاد را هیچ‌وقت از تبرش جدا نکنید!','آسیب مستقیم به همه‌ی دشمن‌های اطراف خود.','دو تبر از آسمان می‌بارد و قهرمانان دشمن را تصادفی هدف قرار می‌دهد؛ ممکن است هر دو تبر به یک قهرمان دشمن برخورد کنند.'],
ikh:['یک روح مهروموم‌شده! مهروموم اختفاگر هیچ‌وقت نباید بشکند.','به یک دشمن آسیب مستقیم وارد می‌کند. اگر یک راند ضربه نزند نامرئی می‌شود و تا وقتی ضربه‌ای نزده در حالت نامرئی باقی می‌ماند. اگر در کاشی‌های اطرافش متحدی نباشد، حمله‌هایش آسیب بیشتری وارد می‌کند.','شکستن مهروموم اختفاگر؛ تا قبل از شکستن مهروموم نمی‌تواند حرکت کند و ضربه بزند.'],
col:['ناخدای هفت دریا، کاپیتان دزدان دریایی','به یک دشمن آسیب مستقیم وارد می‌کند.','وقتی حداقل یک قهرمان دشمن از میدان خارج شده باشد، می‌تواند از قابلیتش استفاده کند. هرچه دشمن‌های بیشتری از بین رفته باشند (تا سه نفر)، اثرش قوی‌تر است. با استفاده از آن، بخشی از تحمل‌ضربه‌اش را بازیابی می‌کند و تا سه راند آسیب بیشتری می‌زند.'],
ear:['جادوگر زمین؛ متحدان من برای بار دوم به میدان نبرد برمی‌گردند','به یک دشمن آسیب مستقیم وارد می‌کند. وقتی تحمل‌ضربه‌ی یک قهرمان خودی تمام شود، به جای خارج شدن از میدان نبرد به سنگ تبدیل می‌شود (تا سقف سه قهرمان). اگر سنگ متحدی در میدان نبرد باشد، ضربه‌ی جادوگر زمین آن سنگ را به اندازه‌ی آسیب ضربه شفا می‌دهد و اگر دو سنگ در زمین باشد، شفا بین دو سنگ پخش می‌شود. تحمل‌ضربه‌ی سنگ‌ها از سقف تحمل‌ضربه‌ی متحدِ سنگ‌شده بیشتر نمی‌شود.','قهرمان‌های سنگ‌شده دوباره به میدان نبرد برمی‌گردند.'],
ik:['پادشاه یخی؛ پادشاه سرزمین‌های شمال، یک جنگ‌آور تمام‌عیار با تسلط به عنصر یخ','به یک دشمن آسیب مستقیم وارد می‌کند. دشمن آسیب‌خورده برای یک راند آهسته می‌شود.','یک ضربه به یک دشمن می‌زند و دشمنان کاشی‌های اطرافش هم آسیب می‌بینند و آهسته می‌شوند.'],
iw:['جادوگر یخ؛ مهم‌ترین متحد پادشاه‌یخ برای سلطنت در سرزمین‌های شمال، علاقه‌مند به مجسمه‌های یخی!','به یک دشمن آسیب مستقیم وارد می‌کند. دشمن آسیب‌خورده برای یک راند آهسته می‌شود.','روی یکی از کاشی‌های خالی در برد ضربه‌اش یک آدم‌برفی با جان ۲۰۰ احضار می‌کند و دشمنان کاشی‌های اطرافش را یک راند فریز می‌کند. آدم‌برفی فقط حضور دارد؛ نه حمله می‌کند و نه حرکت، و در هر راند ۱۰۰ جان از دست می‌دهد.'],
mus:['سایبرگ موساشی؛ فنون قدیمی سامورایی با ترکیب تکنولوژی جدید، مرگبار و وحشت‌آور!','به یک دشمن آسیب مستقیم وارد می‌کند.','سه راند سپر می‌گیرد و بخش اعظمی از آسیب‌ها را دفع می‌کند. در این سه راند سرعت حرکتش دو واحد کمتر می‌شود.'],
ske:['پادشاه اسکلت؛ پادشاه دنیای برزخ چرا به زمین احضار شده؟','به یک دشمن آسیب مستقیم وارد می‌کند. ضربه‌اش به احتمال ۵۰٪ به کاشی پشت جهت ضربه جهش می‌کند و نصف آسیب اصلی را وارد می‌کند.','به یک قهرمان دشمن تصادفی آسیب می‌زند و او را برای دو نوبت زندانی می‌کند.'],
bud:['بودا؛ بودا روش زندگی یک راهب واقعی را در پیش گرفت و به خلوص واقعی اینان رسید','در یکی از شش جهت مستقیم حمله می‌کند. بردش کم است ولی ضربه‌اش به کاشی‌های پشت هم می‌خورد.','به زندگی خود پایان می‌دهد و به دشمنان مستقیم در جهت عمودی آسیب زیادی وارد می‌کند. اگر بودا بدون استفاده از قابلیت شکست بخورد، قابلیتش بدون مصرف اکسیر فعال می‌شود.'],
que:['شهبانوی سیاه‌دل؛ با نگاهی نافذ و قدم‌های استوار، هرچه پرقدرت‌تر باشی بیشتر احساس ضعف می‌کنی','به یک دشمن آسیب مستقیم وارد می‌کند. هرچه تحمل‌ضربه‌ی دشمن بالاتر باشد، آسیب بیشتری دریافت می‌کند.','بعد از فعال‌سازی به نزدیک‌ترین دشمن در بردش ضربه می‌زند. اگر تحمل‌ضربه‌ی دشمن بالاتر از حد معمول باشد، تا ۳۶٪ تحمل‌ضربه‌ی دشمن آسیب وارد می‌کند.'],
fd:['اژدهای آتشین؛ با شعله میدان نبرد را گرم می‌کند و با مرگش میدان را می‌سوزاند.','به یک دشمن آسیب مستقیم وارد می‌کند. وقتی شکست بخورد، قبل از خارج شدن از میدان نبرد با انفجار به کاشی‌های اطراف و دشمنان آسیب وارد می‌کند.','شعله‌ای مخروطی در یک جهت و در دو ردیف.'],
ft:['اژدهای رعدآسا؛ فرمانروای هواهای نامساعد و دوستی با ابرهای کومولونیمبوس','به یک دشمن آسیب وارد می‌کند و اگر دشمن‌ها به هم نزدیک باشند، صاعقه‌اش بین آن‌ها می‌پرد.','همان صاعقه‌ی زنجیره‌ای؛ علاوه بر آسیب، ۱۰٪ از کل تحمل‌ضربه و ۱۰٪ از آسیب هر هدف را برای همیشه کم می‌کند.'],
mac:['ماشین نبرد؛ تجسم یک ربات همه‌کاره با ماشین نبرد واقعی می‌شود.','حمله‌ی نزدیک: شعله‌افکنی مخروطی که در دو ردیف آسیب می‌زند. حمله‌ی دوربرد: در یکی از شش جهت مستقیم چندین گلوله از مسلسل شلیک می‌کند و ضربه‌اش ممکن است از دشمن اول رد شود و به دشمن دوم هم بخورد.','بار اول به یک ساختمان بمب‌گذار تبدیل می‌شود و هر حمله‌اش چهار بمب روی دشمنان تصادفی می‌چسباند. بار دوم پهپاد به همه‌ی دشمنان زنده برخورد می‌کند و بمب‌ها هم فعال می‌شوند.'],
eld:['الدوژ؛ سنگری زنده در میدان نبرد؛ ضربه می‌زند و زخم‌ها را مرهم می‌گذارد.','ضربه‌اش آسیب کمی دارد، اما قهرمانی که در شعاع دو کاشی بیشترین سلامتی را از دست داده درمان می‌شود.','ندارد.'],
spg:['نگهبان فضا مسئولیت حفاظت از کهکشان راه‌شیری را برعهده دارد','به یک دشمن آسیب مستقیم وارد می‌کند.','هرچه دشمن‌ها فشرده‌تر باشند، آسیب بیشتری وارد می‌کند (تا سقف پنج دشمن).'],
med:['مدوسا؛ حمله! حمله! حمله! زهر! زهر! زهر! اتحاد مدوسا با مارهای زهرآگین!','به یک دشمن آسیب مستقیم وارد می‌کند. هر بار که مدوسا از دشمن ضربه بخورد، یکی از مارهایش بیدار می‌شود (حداکثر شش مار). هرچه تعداد مارهای بیدار بیشتر باشد، قدرت حمله و احتمال مسموم کردن دشمنان بیشتر می‌شود. احتمال مسموم کردن دشمن به ازای هر مار ۱/۶ است.','ندارد.'],
eli:['شوالیه‌ی نخبه؛ شوالیه‌ای که تاکتیک جنگیدن با نیزه را نیز آموخت.','به یک دشمن آسیب مستقیم وارد می‌کند.','به دشمنی که دو کاشی با او فاصله دارد نیزه پرتاب می‌کند و به سمت او حرکت می‌کند. دشمنِ نیزه‌خورده برای دو راند ۲۵٪ آسیب بیشتری دریافت می‌کند.'],
ber:['برزرکر؛ جنگجویی وحشی با ضرباتی بی‌امان و خردکننده.','به یک دشمن آسیب مستقیم وارد می‌کند.','به نزدیک‌ترین دشمن آسیب زیادی وارد می‌کند. اگر تحمل‌ضربه‌ی دشمن در حین آسیب خوردن تمام شود، به سراغ نزدیک‌ترین دشمن بعدی می‌رود.'],
dk:['پادشاه اهریمن؛ با دو دست خطرناک! با چهار دست خطرناک‌تر! قدرتی خام با مشت.','به یک دشمن آسیب مستقیم وارد می‌کند. حمله‌اش به احتمال ۵۰٪ می‌تواند دشمنان را یک کاشی به عقب پرتاب کند. هر بار با یکی از دست‌هایش مشت می‌زند و وقتی سه ضربه بدون پرتاب کردن دشمن بزند، ضربه‌ی چهارم قطعاً دشمن را پرتاب می‌کند.','در یکی از شش جهت مستقیم هاله‌ای پرتاب می‌کند. هاله‌ی پرتاب‌شده به دشمنان آسیب می‌زند و قابلیت آن‌ها را برای سه راند قفل می‌کند.'],
gq:['ملکه‌ی باروت؛ بانوی انفجارها و گلوله‌های آتشین.','خشابش دو تیر دارد و هر حمله یک تیر مصرف می‌کند. وقتی خشابش تمام شود، با حرکت کردن بازیابی می‌شود.','وقتی خشابش خالی شود، آن را با گلوله‌های آتشین پر می‌کند. گلوله‌های آتشین آسیب بیشتری دارند و ضربه‌شان مخروطی است و به دو ردیف آسیب می‌زند.'],
dn:['شوالیه‌ی اهریمن؛ راه‌ورسم شوالیه بودن برای یه اهریمن عجیبه نه؟','به یک دشمن آسیب مستقیم می‌زند. هر حمله‌ی سوم آسیبش دو برابر است.','به احتمال ۵۰٪ یک زره نشکن می‌گیرد که اولین ضربه یا طلسم دشمن را بی‌اثر می‌کند. اگر زره نشکن نگرفت، شش شمشیر تصادفی روی دشمنان می‌ریزد.'],
dw:['ساحره‌ی اهریمن؛ ساحره‌ای بی‌رحم که دشمنان ضعیف را حذف و دشمنان قوی را تحسین می‌کند','به یک دشمن آسیب مستقیم می‌زند و ضربه‌اش به کاشی‌های اطراف هدف هم آسیب می‌زند.','ضعیف‌ترین قهرمان دشمن از نظر تحمل‌ضربه را هدف قرار می‌دهد.']
};
/* کمبوها: [ایموجی، خلاصه، {سطح: توضیح}، نکتهٔ کاربردی] */
var CB={
'مبارز':['','قهرمان‌های مبارز هدف حمله را خودشان انتخاب می‌کنند و در برابر ضربهٔ قهرمان‌ها سخت‌جان‌ترند.',{2:'بدون این کمبو، وقتی چند دشمن هم‌فاصله باشند ضربه تصادفی به یکی از آنها می‌خورد. با این کمبو دقیقاً خودت انتخاب می‌کنی که به کدام دشمنِ در دسترس ضربه بزنند.',4:'آسیبی که مبارزها از قهرمان‌های دشمن دریافت می‌کنند ۴۰٪ کمتر می‌شود.'},'برای کشتنِ دشمن‌های کم‌جان یا خطرناک عالی است.'],
'ساپورتر':['','پشتیبان‌هایی که در برابر توپ آتشین مقاوم‌اند و گاهی نامرئی می‌شوند.',{2:'در برابر طلسم «توپ آتشین» ۱۰٪ آسیب کمتر می‌گیرند و به‌صورت متناوب (در نیمی از نوبت‌ها) در پایان نوبت تیمت نامرئی می‌شوند؛ دشمن نمی‌تواند هدفشان بگیرد.'},'نامرئی‌شدنشان نوبتی است؛ حساب کن که کدام نوبت نامرئی‌اند.'],
'تانک':['','قهرمان‌های سنگین‌وزنی که سریع‌تر به خط مقدم می‌رسند.',{2:'همهٔ تانک‌ها ۱ حرکت اضافه در هر نوبت می‌گیرند.'},'کریمسون ۱ حرکتی با این کمبو ۲ حرکتی می‌شود.'],
'کریسدور':['','ضربه‌زنندگانی که بعد از حمله هم می‌توانند عمل کنند.',{2:'بعد از ضربه زدن هنوز می‌توانند حرکت کنند (البته با یک حرکتِ کمتر از اصلشان).',4:'بعد از ضربه زدن با شانس ۵۰٪ می‌توانند دوباره حمله کنند.'},'برای ضربه‌بزن-و-فرار فوق‌العاده است.'],
'سامورایی':['','شمشیرزنانی که با شانس ضربهٔ بحرانی می‌زنند.',{2:'هر ضربه ۱ از ۳ شانس دارد که ۱٫۵ برابر آسیب بزند.',4:'هر ضربه ۱ از ۳ شانس دارد که ۲ برابر آسیب بزند.'},'هر چه تعداد ضربه‌ها بیشتر باشد، این شانس بیشتر خودش را نشان می‌دهد. فقط روی ضربهٔ عادی اثر دارد، نه قابلیت‌ها.'],
'نفرینی':['','نیروهای تاریکی که تحمل بزرگ‌ترین دشمن‌ها را کم می‌کنند.',{4:'جانِ کل ۲ دشمنی که بیشترین جان را دارند ۳۵٪ کم می‌شود (مگر دارای «مشکی ۲» باشند).'},'این کمبو فقط در سطح ۴ فعال می‌شود.'],
'سرخ':['','قهرمان‌های آتشین و سرسخت؛ در برابر یخ و فریز بی‌اثرند.',{2:'همهٔ ضربه‌هایشان ۸۰ آسیب بیشتر می‌شود و در برابر فریز و کندی مصون می‌شوند.',4:'همهٔ ضربه‌هایشان ۱۶۰ آسیب بیشتر می‌شود و در برابر فریز و کندی مصون می‌شوند.'},'دشمنی که سرخ‌ها بزنند چند ثانیه می‌سوزد (جلوهٔ آتش). افزایش آسیب فقط روی ضربهٔ عادی اعمال می‌شود، نه قابلیت‌ها.'],
'انجماد':['','سرمای این قهرمان‌ها دشمن را قفل می‌کند.',{2:'هر ضربه‌شان با شانس ۲ از ۳ هدف را یک نوبت فریز می‌کند (دشمن نمی‌تواند عمل کند).'},'روی «سرخ ۲» اثر ندارد.'],
'مشکی':['','قهرمان‌هایی که با گذشت نوبت‌ها قوی‌تر می‌شوند و از اثرهای بد مصون‌اند.',{2:'بعد از هر نوبت ۶٪ آسیب بیشتر می‌گیرند (۶٪، ۱۲٪، ۱۸٪… تا سقف ۵۰٪).',4:'بعد از هر نوبت ۱۰٪ آسیب بیشتر می‌گیرند (۱۰٪، ۲۰٪، ۳۰٪… تا سقف ۵۰٪).'},'در سطح ۲ در برابر ضعیف‌سازی، فریز، زندانی، قفل قابلیت و بسیاری افکت‌های بد دیگر هم مصون‌اند.'],
'اشرافی':['','هرچه تیم اشرافی کوچک‌تر شود، آخرین بازمانده قوی‌تر می‌شود.',{2:'وقتی فقط یک اشرافی زنده بماند، ۴۰٪ جان و آسیب بیشتر می‌گیرد.',4:'آخرین اشرافیِ زنده ۱۲۰٪ جان و آسیب بیشتر می‌گیرد.',6:'آخرین اشرافیِ زنده ۲۴۰٪ جان و آسیب بیشتر می‌گیرد.'},'استراتژی: همه را بدهد تا آخری سه برابر شود.'],
'دوشیزگان':['','وقتی یک دوشیزه می‌افتد، قدرتش به بقیه می‌رسد.',{2:'با مرگ هر دوشیزه، ۵۰٪ از آسیب فعلی‌اش به هر دوشیزهٔ زنده اضافه می‌شود (برای همیشه).'},'حداقل ۲ دوشیزه در تیم لازم است.'],
'راهب':['','راهب‌ها در لحظهٔ مرگ فرصت دوباره دارند.',{3:'اولین باری که یک راهب بمیرد، با جان ۰ زنده می‌ماند، ۳ راند نامیراست و بعد از آن خودکار می‌میرد (هر راهب یک‌بار).'},'حداقل ۳ راهب لازم است.'],
'اژدها':['','اژدهاها زخم‌هایشان را خودشان درمان می‌کنند.',{2:'هر نوبت ۸۰ جان بازمی‌یابند (تا سقف جانشان).'},'در کنار مهره‌های پرجان قوی است.'],
'ربات':['','وقتی ربات‌ها می‌میرند هنوز خطرناک‌اند.',{2:'هنگام مرگ منفجر می‌شوند و به دشمن‌های کنارشان آسیبی برابر ۴۰٪ جان کل خودشان می‌زنند.'},'روی جان بالاتر انفجار قوی‌تر است.'],
'شکارچی':['','شکارچی‌ها دشمنِ زخمی را بی‌رحمانه تمام می‌کنند.',{2:'اگر جان دشمن کمتر از ۱ از ۳ باشد، ضربه ۱ از ۳ قوی‌تر می‌شود.',4:'اگر جان دشمن کمتر از ۱ از ۲ باشد، ضربه ۱٫۵ برابر می‌شود.'},'خوب است تا اول دشمن را کم‌جان کنی. فقط روی ضربهٔ عادی اثر دارد، نه قابلیت‌ها.'],
'شوالیه':['','شوالیه‌ها هر بار که خیلی زخمی شوند دوباره روی پا می‌ایستند.',{2:'هر بار جانشان از ۷۵٪، ۵۰٪ یا ۲۵٪ پایین‌تر برود (در نوبت خودشان) تا سقف همان محدوده دوباره پر می‌شوند؛ هر آستانه فقط یک‌بار.',4:'۲۵٪ از آسیبی که می‌زنند به‌عنوان جان به خودشان برمی‌گردد.'},'سطح ۴ با ضربه‌های قوی خیلی ارزش دارد.'],
'کاپیتان':['','قوی‌ترین قهرمان بازی (از نظر جان) سخت‌جان‌تر می‌شود.',{2:'پرجان‌ترین قهرمان تیم ۴۰٪ جان بیشتر می‌گیرد.',4:'۸۰٪ جان بیشتر.',6:'۱۶۰٪ جان بیشتر.'},'همراه کریمسون یا مدوسا خیلی قوی است.'],
'پادشاه':['','حضور پادشاه‌ها به تیم تحرک و خشم می‌دهد.',{2:'تیم هر نوبت ۱ حرکت بیشتر دارد.',3:'با مرگ هر پادشاه، همهٔ نیروهای زندهٔ تیم ۲ نوبت «عصبانی» می‌شوند (۳۰٪ ضربهٔ قوی‌تر).'},'حرکتِ بیشتر یعنی بازی سریع‌تر.'],
'کهکشان':['','ستاره‌ها از آسمان به یاری تیم می‌آیند.',{2:'در پایان هر نوبتِ تیم، یک شهاب‌سنگ تصادفی فرود می‌آید و ۲۰۰ آسیب به یک دشمن می‌زند.'},'آسیبی که خودکار و بی‌اکسیر وارد می‌شود.'],
'ساچمه':['','قابلیت‌ها ارزان‌تر می‌شوند.',{2:'اکسیر لازم برای قابلیتِ همهٔ ساچمه‌ای‌ها ۱ واحد کم می‌شود (حداقل ۰).'},'زوج مناسب برای قابلیت‌های گران مثل ژپتو.'],
'اهریمن':['','اهریمن‌ها قابلیت دشمن را قفل می‌کنند.',{2:'۴ قهرمانِ تصادفی از دشمن به مدت ۵ نوبت نمی‌توانند از قابلیت استفاده کنند (مگر «مشکی ۲» باشند).'},'یک مهار بزرگ برای تیم‌های وابسته به قابلیت.']};
/* طلسم‌ها */
var SPD={
fb:['','یک گلولهٔ آتشین از آسمان روی یک مثلثِ سه‌خانه‌ای فرود می‌آید و به همهٔ دشمن‌های داخل ۶۸۰ آسیب می‌زند.','دشمن‌های «ساپورتر ۲» ۱۰٪ کمتر آسیب می‌بینند.'],
fz:['','روی یک خانه و ۶ همسایه‌اش: به دشمن‌ها ۱۰۰ آسیب می‌زند و ۲ نوبت فریز می‌کند (حرکت صفر).','دشمنِ فریزشده نمی‌تواند حرکت کند.'],
cu:['','روی یک دشمن: ۳۰ آسیب و ۳ نوبت نصف آسیبِ ضربه‌هایش.','هدف باید یک دشمن باشد.'],
mi:['','یک معدنچی (۱۶۰۰ جان، ۱۶۰ آسیب) روی هر کاشی خالی میدان (نیمهٔ خودت یا حریف) احضار می‌کند.','معدنچی خودش به‌سمت نزدیک‌ترین دشمن می‌رود و در پایان نوبتت حمله می‌کند. وقتی می‌میرد منفجر می‌شود و فقط به دشمن‌های کاشی‌های اطرافش ۳۲۰ آسیب می‌زند.'],
sr:['','یک ستون را انتخاب می‌کنی؛ یک پنگوئن از ته ستون می‌دود: اولین دشمنِ سر راه ۲۶۰ و بقیه ۱۳۰ آسیب می‌گیرند. اگر سنگ‌قبر سد شود، می‌ایستد. انتهای ستون یک «سارسار» (۹۰۰ جان) برای تو احضار می‌شود.','اگر میدان کاملاً پر باشد قابل استفاده نیست.'],
eq:['','روی ناحیه‌ای ۵×۵ زلزله می‌آید: به دشمن‌ها ۱۰۰ آسیب.','ناحیهٔ بزرگی دارد؛ برای گروه‌های پراکنده خوب است.'],
rg:['','روی یک خانه و ۶ همسایه‌اش: همهٔ قهرمان‌ها (خودی و دشمن!) ۲ نوبت ۲۵٪ آسیب بیشتر می‌زنند؛ دشمن‌ها ۱۰ آسیب می‌گیرند.','جای دقیق را انتخاب کن تا بیشتر دوستانت داخلش باشند.'],
el:['','یک الدرلیچ (۱۵۰۰ جان، ۳۰۰ آسیب) روی هر کاشی خالی میدان (نیمهٔ خودت یا حریف) احضار می‌کند.','الدرلیچ خودش به‌سمت نزدیک‌ترین دشمن می‌رود و در پایان نوبتت حمله می‌کند.'],
pt:['','به یکی از قهرمان‌های خودی ۵۰۰ جان برمی‌گرداند (از جان کل بیشتر نمی‌شود).','هدف باید خودی باشد.'],
wd:['','روی یک دشمن: ضربهٔ بعدی که می‌خورد ۲۵٪ قوی‌تر است و از این به بعد هر نوبت ۴۰ آسیب خونریزی می‌کند.','برای دشمن پرجان مفید است.'],
iv:['','روی یک مثلثِ سه‌خانه‌ای: همهٔ قهرمان‌های داخل نامرئی می‌شوند و دشمن‌ها ۱۰ آسیب می‌گیرند.','نامرئی‌ها را دشمن نمی‌تواند هدف بگیرد.'],
is:['','روی یک قهرمان خودی: ۲ نوبت فقط ۵٪ آسیب می‌گیرد، فریز می‌شود (نمی‌تواند حرکت کند) و به هر مهاجم ۵۰ آسیب برمی‌گرداند.','نجات‌دهندهٔ قهرمان در خطر.'],
rr:['','روی ناحیهٔ ۵×۵: به دشمن‌ها ۱۰۰ آسیب می‌زند و ۳ نوبت قابلیتشان را قفل می‌کند.','قابلیت‌های حیاتی دشمن را خنثی می‌کند.'],
rs:['','روی یک خانهٔ خالی در نیمهٔ خودت: آخرین قهرمان مرده‌ات با نصف جان (حداکثر ۱۴۰۰) زنده می‌شود.','باید قهرمان مرده‌ای داشته باشی.']};

var ov,body,hdr,stack=[],lastSearch='';
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function px(n){return typeof PX==='function'?PX(n):n}
function qn(n){return n}
function heroes(){return Object.keys(HD).filter(function(k){return H[k]})}
function css(){var st=document.createElement('style');st.textContent=
'#ovKb .kbi{display:flex;align-items:center;gap:10px;width:100%;min-height:54px;text-align:start;font:inherit;font-size:15px;padding:6px 12px;border-radius:14px;border:1px solid var(--line);background:var(--panel2);color:var(--fg);cursor:pointer}'+
'#ovKb .kbi .e{font-size:24px;flex:none;width:34px;text-align:center}#ovKb .kbi .t{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.35}#ovKb .kbi .t b{font-size:15px}#ovKb .kbi .t small{color:var(--mut);font-size:11.5px}#ovKb .kbi .g{color:var(--gold);font-size:12px;flex:none}'+
'#ovKb .kbc{background:var(--panel2);border:1px solid var(--line);border-radius:14px;padding:10px 12px;display:flex;flex-direction:column;gap:6px}'+
'#ovKb .kbc.g{border-color:var(--gold)}#ovKb .kbc>h4{margin:0;font-size:13px;color:var(--gold);display:flex;align-items:center;gap:6px;flex-wrap:wrap}#ovKb .kbc p{margin:0;font-size:14px;line-height:2}'+
'#ovKb .kbh{display:flex;align-items:center;gap:12px;padding:12px;border-radius:16px;border:1px solid var(--gold);background:linear-gradient(135deg,rgba(242,193,78,.14),rgba(36,40,50,.9))}'+
'#ovKb .kbh .em:empty,#ovKb .kbi .e:empty{display:none}#ovKb .kbh .em{font-size:44px;line-height:1}#ovKb .kbh .hn{flex:1;min-width:0}#ovKb .kbh h3{margin:0;font-size:19px;color:var(--gold)}#ovKb .kbh p{margin:2px 0 0;font-size:13px;color:var(--mut);line-height:1.7}'+
'#ovKb .kbs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}#ovKb .kbs div{background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:6px 4px;text-align:center;display:flex;flex-direction:column;gap:1px}#ovKb .kbs i{font-style:normal;font-size:16px}#ovKb .kbs b{font-size:16px;color:var(--fg)}#ovKb .kbs small{font-size:10.5px;color:var(--mut)}'+
'#ovKb .kbtg{display:flex;flex-wrap:wrap;gap:6px}#ovKb .kbtg button{min-height:32px;padding:0 12px;font-size:13px;border-radius:999px;border:1px solid var(--gold);background:transparent;color:var(--gold);cursor:pointer}'+
'#ovKb .pill{display:inline-block;font-size:11px;font-weight:700;padding:1px 9px;border-radius:999px;background:rgba(124,196,255,.14);border:1px solid var(--ice);color:var(--ice)}#ovKb .pill.y{background:rgba(242,193,78,.14);border-color:var(--gold);color:var(--gold)}#ovKb .pill.r{background:rgba(255,69,58,.12);border-color:var(--bad);color:#ff8a82}'+
'#ovKb .kbt{display:flex;gap:8px;align-items:flex-start;padding:6px 0;border-top:1px dashed var(--line)}#ovKb .kbt:first-of-type{border-top:0}#ovKb .kbt .lv{flex:none;min-width:58px;text-align:center;font-size:12px;font-weight:700;color:var(--ink);background:var(--gold);border-radius:8px;padding:2px 6px}#ovKb .kbt span.tx{flex:1;font-size:14px;line-height:1.9}'+
'#ovKb .kbq{font:inherit;font-size:15px;padding:9px;border-radius:12px;border:1px solid var(--line);background:var(--panel2);color:var(--fg);width:100%;text-align:start}'+
'#ovKb .kbx{min-height:30px;padding:2px 0;margin-top:4px;border:0;background:transparent;color:var(--mut);font-size:12px;flex-direction:row;gap:6px;width:100%}#ovKb .kbx i{font-style:normal;transition:transform .2s}#ovKb .kbx[aria-expanded=true] i{transform:rotate(180deg)}#ovKb .kbn{margin-top:4px;padding-top:6px;border-top:1px dashed var(--line);display:flex;flex-direction:column;gap:3px;font-size:13px;line-height:1.8}'+
'#ovKb #kbB{direction:rtl}#ovKb .kbh.cb .hn{text-align:center}#ovKb .kbi{position:relative;justify-content:center}#ovKb .kbi .e{position:absolute;inset-inline-start:12px;top:50%;transform:translateY(-50%)}#ovKb .kbi .t{flex:none;width:100%;box-sizing:border-box;padding:0 46px;align-items:center;text-align:center}#ovKb .kbh .hn{text-align:center}';
document.head.appendChild(st)}
function build(){css();
 ov=document.createElement('div');ov.className='ovl';ov.id='ovKb';ov.hidden=true;
 ov.innerHTML='<div class="box" id="kbBox"><h2 id="kbT">دانش‌نامه</h2><div id="kbB" style="display:flex;flex-direction:column;gap:10px;text-align:start"></div><div class="row"><button type="button" id="kbBack" style="display:none">بازگشت</button><button type="button" id="kbClose">بستن</button></div></div>';
 document.body.appendChild(ov);body=ov.querySelector('#kbB');
 ov.querySelector('#kbClose').onclick=function(){ov.hidden=true};
 ov.querySelector('#kbBack').onclick=function(){stack.pop();show(stack[stack.length-1])};
 ov.addEventListener('click',function(e){if(e.target===ov)ov.hidden=true});
 body.addEventListener('click',function(e){var x=e.target.closest('[data-tg]');if(x){var n=x.nextElementSibling;n.hidden=!n.hidden;x.setAttribute('aria-expanded',n.hidden?'false':'true');return}var b=e.target.closest('[data-go]');if(!b)return;var p=b.dataset.go.split(':');go({t:p[0],g:p[1],k:p[2]})})}
function item(em,t,sub,right,go){return '<button class="kbi" type="button" data-go="'+go+'"><span class="e">'+em+'</span><span class="t"><b>'+esc(t)+'</b>'+(sub?'<small>'+esc(sub)+'</small>':'')+'</span>'+(right?'<span class="g">'+esc(right)+'</span>':'')+'</button>'}
var NUM={
acro:[0,['آسیب به هر دشمن در مسیر: 390']],
aka:[0,['آسیب به هر دشمن روی خط: 500','برای یک نوبت: ۵۰٪ شانس دو برابر شدن آسیب']],
cri:[0,['ترمیم: 2200 جان (تا سقف جان کل)']],
doj:[['2 ضربه، هرکدام 200 آسیب (جمعاً 400)','اگر دو دشمن هم‌فاصله باشند، هر ضربه تصادفی به یکی از آن‌ها می‌خورد'],['آسیب: 400','ترمیم خودش: 350 جان']],
pri:[0,['کم‌کردن از جان پرجان‌ترین متحد: 100','ترمیم خودش: 350 جان']],
raf:[['کاشی اول (هدف): 400','کاشی دوم پشت هدف: 200','کاشی سوم پشت هدف: 100'],['پرواز: 3 راند']],
bri:[['آسیب: 420','تضعیف هدف: ۵۰٪ آسیب کمتر برای 1 راند'],['احضار الدرلیچ: جان 1500، آسیب 300، حرکت 1']],
ali:[0,['آسیب: 600']],
mar:[['آسیب: 200 + قدرت جمع‌شده','هر کشتن: 200+ به قدرت'],['آسیب: 200 + قدرت جمع‌شده','اگر هدف بمیرد: 200+ به قدرت']],
mak:[['آسیب: 500','خشاب: 6 گلوله','شانس شکست هر شلیک: 1/6 (آسیب به خودش)','ششمین شلیک پشت‌سرهم حتماً به خودش می‌خورد'],['پر شدن کامل خشاب: 6 گلوله']],
and:[['آسیب: 400','شارژ سیاه‌چاله: برابر آسیب هر ضربه (حداکثر 2000)'],['آسیب: برابر شارژ (حداکثر 2000)']],
zep:[['کاشی 1: 840','کاشی 2: 630','کاشی 3: 420','کاشی 4: 210'],['ردیف اول: 840','ردیف دوم: 630','ردیف سوم: 420','ردیف چهارم: 210']],
jack:[['12 کارت، هرکدام 40 آسیب (جمعاً 480)'],['6 کارت، هرکدام 120 آسیب (جمعاً 720)']],
blk:[0,['سپر: 600','آسیب به هدف: 400']],
jal:[['آسیب به هر دشمن اطراف: 300'],['2 تبر، هرکدام 200 آسیب (جمعاً 400)']],
ikh:[['آسیب: 350','بدون متحدِ کنارش: 875 (2.5 برابر)'],0],
col:[0,['ترمیم: ۲۲٪ جان کل به‌ازای هر دشمن از دست‌رفته (تا 3 نفر، حداکثر ۶۶٪)','آسیب بیشتر: ۲۲٪ به‌ازای هر دشمن (حداکثر ۶۶٪) برای 3 راند']],
ear:[['آسیب: 480','شفای سنگ: 480 (بین سنگ‌ها تقسیم می‌شود)','حداکثر سنگ: 3'],['بازگشت متحدان سنگ‌شده با جانِ شفاگرفته']],
ik:[['آسیب: 300','کندی: 1 راند'],['آسیب: 300','فریز و کندی: 1 راند']],
iw:[['آسیب: 350','کندی: 1 راند'],['احضار آدم‌برفی: جان 200، بدون آسیب، بدون حرکت','فریز دشمنان کنارش: 1 راند','کاهش جان: ۱۰۰ در هر راند']],
mus:[0,['سپر: 3 راند، ۹۰٪ کاهش آسیب','کاهش حرکت: 2']],
ske:[['آسیب: 350','۵۰٪ شانس: جهش به کاشی پشت با 175 آسیب'],['آسیب: 350','زندانی: 2 نوبت']],
bud:[['آسیب به هر دشمن در خط (تا برد 6): 220'],['آسیب به دشمنان خط عمودی: 660','اگر بدون قابلیت شکست بخورد: بدون اکسیر فعال می‌شود']],
que:[['آسیب: 180 + ۱۸٪ جان هدف (اگر جان هدف ≥ 1620)','یا 180 + ۹٪ جان هدف (اگر جان هدف ≥ 810)'],['اگر جان کل هدف بیش از 2430 باشد: 180 + ۳۶٪ جان کل','در غیر این صورت: مثل حمله‌ی معمولی']],
fd:[['آسیب: 400','انفجار هنگام مرگ: 800 به دشمنان کنارش'],['ردیف اول: 400','ردیف دوم: 400']],
ft:[['هدف اول: 250','هدف دوم: 200','هدف سوم: 150'],['هدف اول: 250','هدف دوم: 200','هدف سوم: 150','کاهش دائمی: ۱۰٪ جان کل و ۱۰٪ آسیب هر هدف']],
mac:[['نزدیک: ردیف اول 400، ردیف دوم 200','دوربرد: 20 گلوله، هرکدام 20 آسیب (جمعاً 400)'],['بار اول: 4 بمب روی دشمنان تصادفی','بار دوم (2 اکسیر): انفجار 90 آسیب به‌ازای هر بمب']],
eld:[['آسیب: 180','ترمیم: 240 جان به کم‌جان‌ترین متحد در شعاع 2'],0],
spg:[0,['آسیب به هر دشمنِ زنجیره: 70 × اندازه‌ی خوشه (حداکثر 5) = تا 350']],
med:[['آسیب: 500 + 50 به‌ازای هر مار بیدار (حداکثر 6 مار، یعنی 800)','شانس مسموم‌سازی: 1/6 به‌ازای هر مار','زهر: 20 آسیب در هر راند، 2 راند'],0],
eli:[0,['نیزه: 120','دشمن 2 راند ۲۵٪ آسیب بیشتر می‌گیرد','ضربه‌ی دوم بعد از حرکت: 400']],
ber:[0,['16 ضربه، هرکدام 160 آسیب (جمعاً 2560)']],
dk:[['آسیب: 330','۵۰٪ شانس پرتاب به عقب (ضربه‌ی چهارم حتماً)'],['آسیب: 140','قفل قابلیت: 3 راند']],
gq:[['گلوله‌ی عادی: 450','گلوله‌ی آتشین: ردیف اول 900، ردیف دوم 300','خشاب: 2 تیر'],['پر شدن خشاب با 2 گلوله‌ی آتشین']],
dn:[['آسیب: 350','هر حمله‌ی سوم: 700'],['۵۰٪: زره نشکن (اولین ضربه یا طلسم بی‌اثر می‌شود)','۵۰٪: 6 شمشیر، هرکدام 70 آسیب (جمعاً 420)']],
dw:[['آسیب به هدف: 240','آسیب به دشمنان کنار هدف: 240'],['آسیب به ضعیف‌ترین دشمن: 820']]
};
function fa(x){return String(x).replace(/\d/g,function(c){return '۰۱۲۳۴۵۶۷۸۹'[c]})}
function numBox(k,t){var d=H[k],n=NUM[k]&&NUM[k][t],L=[];
 if(t===1&&d.c)L.push('هزینه: '+(k==='mac'?'1 اکسیر (بار اول)':d.c+' اکسیر'));
 if(n)L=L.concat(n);else if(t===0)L.push('آسیب: '+d.d);
 if(!L.length)return '';
 return '<button type="button" class="kbx" data-tg="1" aria-expanded="false"><span>مشخصات و اعداد</span><i>▾</i></button><div class="kbn" hidden>'+L.map(function(x){return '<div>• '+esc(fa(x))+'</div>'}).join('')+'</div>'}
function card(title,txt,cls,ex){return '<div class="kbc '+(cls||'')+'"><h4>'+title+'</h4><p>'+txt+'</p>'+(ex||'')+'</div>'}
function lim(k){var o=H[k].o1;return o===1?'<span class="pill r">فقط ۱ بار در بازی</span>':o?'<span class="pill r">حداکثر '+px(o)+' بار در بازی</span>':''}
function heroDetail(k){var d=H[k],l=HD[k],tr=TR[k]||[];
 var cost=d.c?px(d.c)+' اکسیر':'ندارد';
 return '<div class="kbh"><div class="em">'+EM[k]+'</div><div class="hn"><h3>'+esc(qn(d.n))+'</h3><p>'+esc(l[0])+'</p></div></div>'+
 '<div class="kbs"><div><i></i><b>'+px(d.hp)+'</b><small>تحمل ضربه</small></div><div><i></i><b>'+px(d.d)+'</b><small>آسیب پایه</small></div><div><i></i><b>'+px(d.r)+'</b><small>برد (خانه)</small></div><div><i></i><b>'+px(d.m)+'</b><small>حرکت در نوبت</small></div><div><i></i><b>'+cost+'</b><small>اکسیر قابلیت</small></div></div>'+
 card('حملهٔ معمولی',esc(l[1]),'',numBox(k,0))+
 card('قابلیت'+' '+lim(k),esc(l[2]),'g',numBox(k,1))+
 card('کمبوها','<div class="kbtg">'+tr.map(function(t){return '<button type="button" data-go="d:c:'+esc(t)+'">'+(CB[t]?CB[t][0]+' ':'')+esc(t)+'</button>'}).join('')+'</div><span style="font-size:12px;color:var(--mut)">روی هر کمبو بزن تا ببینی چه کاری می‌کند.</span>')}
function comboDetail(k){var c=CB[k],th=TH[k]||Object.keys(c[2]).map(Number);
 return '<div class="kbh cb"><div class="em">'+c[0]+'</div><div class="hn"><h3>کمبوی '+esc(k)+'</h3></div></div>'+
 '<div class="kbc"><h4>سطح‌ها</h4>'+th.map(function(n,i){var W={1:'یک',2:'دو',3:'سه',4:'چهار',5:'پنج',6:'شش',7:'هفت'};return '<div class="kbt"><span class="lv">سطح '+px(i+1)+'</span><span class="tx"><b style="display:block;color:var(--gold)">با '+(W[n]||px(n))+' قهرمان فعال می\u200cشود</b>'+esc(c[2][n]||'')+'</span></div>'}).join('')+'<p style="font-size:12px;color:var(--mut)">شرط: همین تعداد قهرمان با این ویژگی همزمان در زمین باشند.</p></div>'+
 card('قهرمان‌های این کمبو','<div class="kbtg">'+heroes().filter(function(h){return(TR[h]||[]).indexOf(k)>=0}).map(function(h){return '<button type="button" data-go="d:h:'+h+'">'+EM[h]+' '+esc(qn(H[h].n))+'</button>'}).join('')+'</div>')}
function spellDetail(k){var s=SPELLS[k],d=SPD[k];
 return '<div class="kbh"><div class="em">'+d[0]+'</div><div class="hn"><h3>'+esc(qn(s.n))+'</h3><p>طلسم</p></div></div>'+
 '<div class="kbs" style="grid-template-columns:1fr"><div><i></i><b>'+px(s.x)+' اکسیر</b><small>هزینهٔ خرید در مرحلهٔ انتخاب</small></div></div>'+
 card('چه می‌کند؟',esc(d[1]),'g')}
function show(v){var T=ov.querySelector('#kbT'),back=ov.querySelector('#kbBack'),b=body,h='';
 back.style.display=stack.length>1?'':'none';
 if(v.t==='home'){T.textContent='دانش‌نامه';
  h=item('','قهرمان‌ها','','','l:h')+
  item('','کمبوها','','','l:c')+
  item('','طلسم‌ها','','','l:s');}
 else if(v.t==='l'){
  if(v.g==='h'){T.textContent='قهرمان‌ها';
   h='<input class="kbq" id="kbQ" placeholder="جستجوی نام قهرمان…" value="'+esc(lastSearch)+'" autocomplete="off"><div id="kbL" style="display:flex;flex-direction:column;gap:8px"></div>';b.innerHTML=h;
   var f=function(){var q=(ov.querySelector('#kbQ').value||'').trim();lastSearch=q;ov.querySelector('#kbL').innerHTML=heroes().filter(function(k){return !q||H[k].n.indexOf(q)>=0}).map(function(k){return item(EM[k],qn(H[k].n),'','','d:h:'+k)}).join('')||'<div class="dp">چیزی پیدا نشد.</div>'};
   ov.querySelector('#kbQ').oninput=f;f();ov.scrollTop=0;return}
  if(v.g==='c'){T.textContent='کمبوها';h=Object.keys(CB).map(function(k){return item(CB[k][0],k,'','','d:c:'+k)}).join('')}
  if(v.g==='s'){T.textContent='طلسم‌ها';h=Object.keys(SPD).map(function(k){return item(SPD[k][0],qn(SPELLS[k].n),'','','d:s:'+k)}).join('')}}
 else if(v.t==='d'){
  if(v.g==='h'){T.textContent=qn(H[v.k].n);h=heroDetail(v.k)}
  if(v.g==='c'){T.textContent='کمبوی '+v.k;h=comboDetail(v.k)}
  if(v.g==='s'){T.textContent=qn(SPELLS[v.k].n);h=spellDetail(v.k)}}
 b.innerHTML=h;ov.scrollTop=0;try{b.scrollTop=0}catch(e){}}
function go(v){stack.push(v);show(v)}
window.openKb=function(){if(!ov)build();try{closeOv()}catch(e){}stack=[{t:'home'}];show(stack[0]);ov.hidden=false};
var bt=document.getElementById('tbKb');if(bt)bt.onclick=window.openKb;
var _c=closeOv;closeOv=function(){_c();if(ov)ov.hidden=true};
})();


/* جزئیات هندسه فقط هنگام ساخت مهره‌ها فعال است تا افکت‌ها سنگین نشوند */
(function(){if(typeof mkUnit!=='function')return;
 var _b=mkUnit;mkUnit=function(u){window.__GD=true;try{return _b(u)}finally{window.__GD=false}}})();
/* ===== محدودکردن / آزادکردن نرخ فریم (تنظیمات > گرافیک) ===== */
(function(){
 var FPS=120;try{var v=+localStorage.getItem('jt_fps');if(v===30||v===60||v===90||v===120)FPS=v}catch(e){}
 window.paintFPS=function(){[['fpsB30',30],['fpsB60',60],['fpsB90',90],['fpsB120',120]].forEach(function(a){var b=document.getElementById(a[0]);if(!b)return;
  window.jtSel&&window.jtSel(b,FPS===a[1])})};
 window.setFPS=function(f){FPS=f;try{localStorage.setItem('jt_fps',String(f))}catch(e){}window.paintFPS()};
 if(typeof loop!=='function')return;
 var _lp=loop,last=0;
 loop=function(){
  if(FPS<120){var n=performance.now(),iv=1000/FPS,el=n-last;if(el<iv-1.5){requestAnimationFrame(loop);return}last=el>iv*3?n:n-(el%iv)}
  _lp()};
})();
/* ===== کش پلاک نام/جان مهره‌ها: فقط وقتی چیزی عوض شد دوباره‌نقاشی و آپلود تکسچر ===== */
(function(){if(typeof paintLabel!=='function')return;var _pl=paintLabel;
 paintLabel=function(u,g){try{var d=g.userData,b=d.lb;if(b){var v=Math.round(vhp(u)),k=[u.k,u.o,u.max,v,u.bbv!=null?u.bbv:u.bb|0,sel_===u?1:0,CL[u.o]].join('|');if(b.pk===k)return;b.pk=k}}catch(e){}return _pl(u,g)}})();
/* ===== شمارندهٔ فریم برای عیب‌یابی: فقط با افزودن ?fps به آدرس سایت دیده می‌شود ===== */
(function(){if(!/[?&]fps/.test(location.search))return;
 var el=document.createElement('div');el.style.cssText='position:fixed;z-index:200;left:6px;bottom:70px;padding:3px 8px;border-radius:8px;background:rgba(0,0,0,.7);color:#7CFC7C;font:12px monospace;direction:ltr;pointer-events:none';document.body.appendChild(el);
 var n=0,t0=performance.now(),mx=0,lt=t0;
 (function f(){var t=performance.now();mx=Math.max(mx,t-lt);lt=t;n++;requestAnimationFrame(f)})();
 setInterval(function(){var t=performance.now(),fps=Math.round(n*1000/(t-t0)),i=(typeof renderer!=='undefined'&&renderer)?renderer.info:null;
  el.textContent=fps+' fps | worst '+Math.round(mx)+'ms'+(i?' | calls '+i.render.calls+' | tris '+Math.round(i.render.triangles/1000)+'k':'')+(typeof renderer!=='undefined'&&renderer?' | '+renderer.domElement.width+'x'+renderer.domElement.height:'');n=0;mx=0;t0=t},1000)})();
