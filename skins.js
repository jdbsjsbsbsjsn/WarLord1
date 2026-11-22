/* skins.js — اسکین‌ها و افکت‌هاشون: اژدها، آکروبات، رافائل پیر، شاهدخت، ارتقای اسکین‌ها و آتش عصا */
/* ===== اسکین اژدهای آتشین (fd) و اژدهای رعدآسا (ft) =====
   مدل لو‌پلی سه‌بعدی + انیمیشن بیکار/حمله/مرگ + افکت ضربه + غرش مرگ
   هر دو اژدها از یک مدل ساخته می‌شوند و فقط پالت رنگ (DGT) و افکت ضربه فرق دارد. */
(function(){
const V=THREE.Vector3;
const DGT={
 fd:{mid:0xc8182a,dark:0x860e1d,hi:0xf0502f,belly:0xe9c1a8,belly2:0xd7a58e,horn:0x45101a,claw:0xeed5ac,eye:0xffd53d,glow:0xff9a1a,memA:0xe5301f,memB:0x96101f},
 ft:{mid:0x1f4fa8,dark:0x102f6e,hi:0x4189ea,belly:0xdfdbe4,belly2:0xbfc5da,horn:0x0b183c,claw:0xe8dfca,eye:0xc4f2ff,glow:0x4fc3ff,memA:0x2d68cf,memB:0x143a82}};
const dgz=x=>x<=0?0:x>=1?1:x*x*(3-2*x),mixv=(a,b,k)=>a+(b-a)*k;

function gxDragon(M,team,K){
 const G=new THREE.Group(),Y=.18;
 let sd=7919;const R=()=>{sd=(sd*16807)%2147483647;return(sd-1)/2147483646};
 const Mv=M(0xffffff,{vertexColors:true,flatShading:true,roughness:.5,metalness:.1,side:THREE.DoubleSide});
 const cache={},lin=h=>cache[h]||(cache[h]=GX.c(h));
 /* هر وجه یک رنگ کمی متفاوت می‌گیرد تا ظاهر لو‌پلی/وجه‌دار شود */
 const facet=(geo,hex,jit)=>{const g=geo.index?geo.toNonIndexed():geo,n=g.attributes.position.count,col=new Float32Array(n*3),b=lin(hex),j=jit==null?.2:jit;
  for(let i=0;i<n;i+=3){const f=1+(R()-.5)*2*j,r=Math.min(1,b.r*f),gg=Math.min(1,b.g*f),bb=Math.min(1,b.b*f);for(let q=0;q<3;q++){const o=(i+q)*3;col[o]=r;col[o+1]=gg;col[o+2]=bb}}
  g.setAttribute('color',new THREE.BufferAttribute(col,3));return g};
 const mk=(geo,hex,jit,x,y,z,Q)=>{const m=new THREE.Mesh(facet(geo,hex,jit),Mv);m.position.set(x||0,y||0,z||0);(Q||G).add(m);return m};
 const Ic=(r,a,b,c,d)=>new THREE.IcosahedronGeometry(r,d||0).scale(a||1,b||1,c||1);
 const rod=(a,b,r1,r2,hex,jit,seg,Q)=>{const A=new V(a[0],a[1],a[2]),B=new V(b[0],b[1],b[2]),d=B.clone().sub(A),L=d.length(),m=mk(new THREE.CylinderGeometry(r2,r1,L,seg||6,1),hex,jit,0,0,0,Q);m.position.copy(A).addScaledVector(d,.5);m.quaternion.setFromUnitVectors(new V(0,1,0),d.clone().normalize());return m};
 const spike=(p,d,r,l,hex,Q,sg)=>{const dd=new V(d[0],d[1],d[2]).normalize(),m=mk(new THREE.ConeGeometry(r,l,sg||5),hex,.18,0,0,0,Q);m.position.set(p[0],p[1],p[2]).addScaledVector(dd,l/2);m.quaternion.setFromUnitVectors(new V(0,1,0),dd);return m};
 const curve=(pts,r0,r1,hex,Q,seg,rs)=>mk(GX.tube(pts,u=>r0+(r1-r0)*u,seg||8,rs||5),hex,.16,0,0,0,Q);
 const ghost=m=>{m.raycast=()=>{};Object.defineProperty(m,'castShadow',{get:()=>false,set:()=>{}});return m};

 /* ---- اژدهای چهارپا روی زمین ---- */
 const HIP=.62;
 const BODY=new THREE.Group();BODY.position.set(0,Y+HIP,0);G.add(BODY);
 mk(Ic(.4,1,.9,1.5,2),K.mid,.1,0,0,0,BODY);
 mk(Ic(.34,1.05,1,.9,1),K.mid,.1,0,.05,.42,BODY);
 mk(Ic(.35,1,1,.9,1),K.mid,.1,0,0,-.4,BODY);
 for(let i=0;i<7;i++){const z=.5-i*.15,q=Math.sqrt(1-Math.min(.9,(z/.6)**2));
  const p=mk(new THREE.BoxGeometry(.32*q+.1,.05,.12),i%2?K.belly:K.belly2,.08,0,-.36*q+.01,z,BODY);p.rotation.x=-Math.asin(Math.max(-.9,Math.min(.9,z/.6)))*.7;
  spike([0,.36*q+.02,z-.03],[0,1,-.5],.04,.12+(i%2)*.04,i%2?K.dark:K.hi,BODY)}
 /* پاهای عقب (ستبر) */
 [-1,1].forEach(s=>{
  mk(Ic(.21,1,1.15,1.15,1),K.mid,.1,s*.33,-.06,-.4,BODY);
  rod([s*.33,-.12,-.4],[s*.36,-.36,-.52],.15,.1,K.mid,.1,7,BODY);rod([s*.36,-.36,-.52],[s*.33,-.5,-.36],.1,.075,K.dark,.1,7,BODY);
  mk(Ic(.12,1.1,.5,1.8,1),K.mid,.1,s*.33,-.565,-.28,BODY);
  [-1,0,1].forEach(j=>spike([s*.33+j*.06,-.575,-.14],[j*.1,-.2,1],.024,.1,K.claw,BODY,4))});
 /* پاهای جلو */
 const AR=[-1,1].map(s=>{const A=new THREE.Group();A.position.set(s*.3,-.08,.42);BODY.add(A);
  mk(Ic(.17,1,1.2,1.05,1),K.mid,.1,s*.02,-.02,0,A);
  rod([0,0,0],[s*.05,-.24,.05],.14,.1,K.mid,.1,7,A);rod([s*.05,-.24,.05],[s*.03,-.44,0],.1,.075,K.dark,.1,7,A);
  mk(Ic(.11,1.1,.5,1.7,1),K.mid,.1,s*.03,-.485,.07,A);
  [-1,0,1].forEach(j=>spike([s*.03+j*.06,-.495,.2],[j*.1,-.2,1],.022,.1,K.claw,A,4));
  return A});
 /* گردن */
 const NK=new THREE.Group();NK.position.set(0,.14,.55);BODY.add(NK);
 [[.06,.08,.2],[.22,.17,.18],[.38,.27,.16]].forEach((q,i)=>{const y=q[0],z=q[1],r=q[2];
  mk(Ic(r,1.05,1.1,1.05,1),K.mid,.1,0,y,z,NK);
  const pl=mk(new THREE.BoxGeometry(r*1.2,.09,.05),i%2?K.belly:K.belly2,.08,0,y-.02,z+r*.9,NK);pl.rotation.x=.5;
  spike([0,y+.04,z-r*.8],[0,.7,-1],r*.25,r*.8,i%2?K.hi:K.dark,NK)});
 /* سر خوشگل: گرد، پوزهٔ کوتاه، چشم‌های درشت، شاخ‌های بلند و باله‌های کنار سر */
 const HD=new THREE.Group();HD.position.set(0,.52,.34);NK.add(HD);
 mk(Ic(.19,1,.92,1.08,2),K.mid,.08,0,0,0,HD);
 mk(Ic(.115,1,.72,1.55,2),K.mid,.08,0,-.045,.24,HD);
 mk(Ic(.06,1.2,.8,1,1),K.dark,.08,0,-.03,.4,HD);
 [-1,1].forEach(s=>mk(Ic(.016),K.horn,.05,s*.03,-.02,.45,HD));
 [.14,.22,.3].forEach(z=>[-1,1].forEach(s=>spike([s*.06,-.085,z],[0,-1,.1],.016,.06,0xf5eddc,HD,4)));
 const JW=new THREE.Group();JW.position.set(0,-.09,.08);HD.add(JW);
 mk(Ic(.08,1,.4,1.7,1),K.belly,.08,0,-.03,.2,JW);mk(Ic(.045,1.1,.35,1,1),K.horn,.08,0,-.03,.37,JW);
 [.12,.2,.28].forEach(z=>[-1,1].forEach(s=>spike([s*.045,0,z],[0,1,-.1],.014,.05,0xf5eddc,JW,4)));
 const MO=new THREE.Object3D();MO.position.set(0,-.03,.46);HD.add(MO);
 const mgM=new THREE.MeshBasicMaterial({color:K.glow,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
 const mgl=ghost(new THREE.Mesh(new THREE.SphereGeometry(.1,10,8),mgM));mgl.position.set(0,0,.25);JW.add(mgl);
 const eyeM=new THREE.MeshBasicMaterial({color:K.eye,toneMapped:false}),glowM=new THREE.MeshBasicMaterial({color:K.glow,transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
 const eyeG=[];
 [-1,1].forEach(s=>{
  curve([[s*.08,.14,-.02],[s*.13,.28,-.12],[s*.16,.42,-.3],[s*.12,.5,-.52]],.06,.008,K.horn,HD,8,5);
  curve([[s*.14,.04,-.02],[s*.2,.08,-.12],[s*.24,.05,-.26]],.035,.006,K.horn,HD,6,5);
  const fn=mk(Ic(.08,.25,1,1.8,0),K.memA,.1,s*.18,.03,-.08,HD);fn.rotation.y=s*.5;fn.rotation.z=s*.2;
  mk(Ic(.07,1,.8,1,1),K.hi,.1,s*.13,-.06,.1,HD);
  const br=mk(new THREE.BoxGeometry(.1,.03,.1),K.dark,.08,s*.1,.11,.13,HD);br.rotation.z=s*.35;
  const e=ghost(new THREE.Mesh(new THREE.SphereGeometry(.055,10,8),eyeM));e.position.set(s*.1,.05,.14);HD.add(e);
  const g=ghost(new THREE.Mesh(new THREE.SphereGeometry(.09,10,8),glowM));g.position.copy(e.position);HD.add(g);eyeG.push(g)});

 /* ---- بال‌ها ---- */
 const WG=[];
 [-1,1].forEach(s=>{
  const P=new THREE.Group();P.position.set(s*.22,.3,.1);P.scale.setScalar(.85);BODY.add(P);
  const W=new THREE.Group();W.scale.x=s;P.add(W);
  const S0=[0,0,0],E=[.46,.46,-.1],Wr=[.74,.96,-.2],F1=[1.1,.46,-.38],F2=[1.0,-.2,-.32],F3=[.72,-.62,-.2],Bd=[.1,-.5,-.1];
  const lp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
  const scl=(a,b)=>lp(lp(a,b,.5),Wr,.24);
  const M12=scl(F1,F2),M23=scl(F2,F3),M3B=scl(F3,Bd);
  const jz=p=>[p[0],p[1],p[2]+(R()-.5)*.07];
  const sub=tr=>{const a=tr[0],b=tr[1],c=tr[2],ab=jz(lp(a,b,.5)),bc=jz(lp(b,c,.5)),ca=jz(lp(c,a,.5));return[[a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]]};
  let tris=[[Wr,F1,M12],[Wr,M12,F2],[Wr,F2,M23],[Wr,M23,F3],[Wr,F3,M3B],[Wr,M3B,Bd],[Wr,Bd,S0]];
  tris=tris.flatMap(sub);
  const pos=new Float32Array(tris.length*9),col=new Float32Array(tris.length*9),cA=lin(K.memA),cB=lin(K.memB);
  tris.forEach((tr,i)=>{let cx=0,cy=0;tr.forEach((p,j)=>{pos.set(p,i*9+j*3);cx+=p[0]/3;cy+=p[1]/3});
   const k=Math.max(0,Math.min(1,Math.hypot(cx,cy-.1)*.62+(R()-.5)*.5)),f=.9+R()*.2;
   for(let j=0;j<3;j++){const o=i*9+j*3;col[o]=Math.min(1,(cB.r+(cA.r-cB.r)*k)*f);col[o+1]=Math.min(1,(cB.g+(cA.g-cB.g)*k)*f);col[o+2]=Math.min(1,(cB.b+(cA.b-cB.b)*k)*f)}});
  const mg=new THREE.BufferGeometry();mg.setAttribute('position',new THREE.BufferAttribute(pos,3));mg.setAttribute('color',new THREE.BufferAttribute(col,3));
  W.add(new THREE.Mesh(mg,Mv));
  rod(S0,E,.1,.075,K.mid,.15,6,W);rod(E,Wr,.075,.05,K.mid,.15,6,W);mk(Ic(.09),K.hi,.2,E[0],E[1],E[2],W);
  [F1,F2,F3].forEach(F=>{rod(Wr,F,.035,.012,K.dark,.1,4,W);spike(F,[F[0]-Wr[0],F[1]-Wr[1],F[2]-Wr[2]],.03,.13,K.claw,W,4)});
  const cl=curve([[0,0,0],[.04,.17,-.03],[-.05,.35,-.1],[-.2,.45,-.2]],.075,.006,K.claw,W,8,5);cl.position.set(Wr[0],Wr[1],Wr[2]);
  /* جزئیات بال: بند انگشت‌ها، رگه‌های پرده، خارهای بازو، چنگال‌ها */
  [S0,E,Wr,F1,F2,F3].forEach((p,k)=>mk(Ic(k===2?.06:.045,1,1,1,0),k%2?K.hi:K.mid,.2,p[0],p[1],p[2],W));
  [M12,M23,M3B].forEach(m=>rod(Wr,m,.02,.007,K.dark,.1,4,W));
  [F1,F2,F3].forEach(F=>{const q=lp(Wr,F,.55);mk(Ic(.032,1,1,1,0),K.hi,.2,q[0],q[1],q[2],W)});
  [.3,.55,.8].forEach(k=>{const q=lp(S0,E,k);spike(q,[0,1,.25],.03,.12,K.hi,W,4)});
  [.35,.7].forEach(k=>{const q=lp(E,Wr,k);spike(q,[0,1,.25],.025,.1,K.dark,W,4)});
  spike(Wr,[.45,.5,.3],.04,.15,K.claw,W,4);spike(Wr,[-.2,.7,.3],.035,.12,K.claw,W,4);
  rod(F1,F2,.02,.015,K.dark,.1,4,W);rod(F2,F3,.02,.015,K.dark,.1,4,W);rod(F3,Bd,.02,.015,K.dark,.1,4,W);
  [M12,M23,M3B].forEach(m=>spike(m,[m[0]-Wr[0],m[1]-Wr[1],m[2]-Wr[2]],.02,.09,K.claw,W,4));
  mk(Ic(.11,1,.9,1,1),K.mid,.1,0,0,0,W);mk(Ic(.07,1.4,.8,1,0),K.dark,.1,.08,-.04,.02,W);
  WG.push({P,s})});

 /* ---- دم (روی زمین، کمی به بالا خمیده) ---- */
 const TL=[.26,.25,.23,.2,.18],TRd=[.17,.14,.11,.085,.06,.025],PIT=[-.22,-.1,-.04,.05,.14],YAW=[0,-.14,-.18,-.2,-.2],tail=[];
 {let par=BODY,prevL=0;
  TL.forEach((L,j)=>{const S=new THREE.Group();S.position.set(0,j?0:-.02,j?-prevL:-.55);S.rotation.set(PIT[j],YAW[j],0);par.add(S);
   rod([0,0,0],[0,0,-L],TRd[j],TRd[j+1],K.mid,.1,6,S);
   mk(Ic(TRd[j]*.8,.85,.5,1.5),K.belly2,.08,0,-TRd[j]*.6,-L/2,S);
   spike([0,TRd[j]*.8,-L*.5],[0,1,-.8],TRd[j]*.4,TRd[j]*1.4,j%2?K.hi:K.dark,S);
   if(j===4)spike([0,0,-L],[0,.1,-1],.07,.24,K.hi,S);
   tail.push({S,yaw:YAW[j],pit:PIT[j]});par=S;prevL=L})}

 /* ===== جزئیات بیشتر: فلس، زره، خار، دندان، سبیل، حلقه‌ی شاخ و ... ===== */
 const SC=[K.mid,K.dark,K.hi,K.mid];
 const rings=(pts,n,r0,r1,hex,Q)=>{const cv=new THREE.CatmullRomCurve3(pts.map(p=>new V(p[0],p[1],p[2])));
  for(let i=0;i<n;i++){const u=.12+.73*(n>1?i/(n-1):0),p=cv.getPoint(u),tg=cv.getTangent(u),r=(r0+(r1-r0)*u)*1.18;
   const m=mk(new THREE.TorusGeometry(r,r*.3,4,7),hex,.12,p.x,p.y,p.z,Q);m.quaternion.setFromUnitVectors(new V(0,0,1),tg)}};
 /* فلس‌های پهلو و پشت */
 for(let i=0;i<8;i++){const z=.5-i*.145,q=Math.sqrt(1-Math.min(.92,(z/.6)**2));
  [-1,1].forEach(s=>[28,52,76,100].forEach((dg,j)=>{const th=dg*Math.PI/180*s;
   const m=mk(Ic(.075,1.25,.38,1.1,0),SC[(i+j)%4],.14,.42*q*Math.sin(th),.38*q*Math.cos(th),z,BODY);m.rotation.z=-th}))}
 /* خارهای ریز بین خارهای اصلی پشت */
 for(let i=0;i<7;i++){const z=.43-i*.15,q=Math.sqrt(1-Math.min(.9,(z/.6)**2));spike([0,.36*q+.02,z],[0,1,-.35],.028,.08,K.claw,BODY,4)}
 /* زرهٔ شانه و ران، خارهای کناری */
 [-1,1].forEach(s=>{
  [[.34,.18,.34],[.37,.06,.4],[.38,.2,-.28],[.41,.08,-.42],[.36,.26,-.05]].forEach((p,j)=>spike([s*p[0],p[1],p[2]],[s,.7,-.3],.05,.17+.03*(j%2),j%2?K.dark:K.hi,BODY));
  mk(Ic(.16,1,.55,1.2,1),K.dark,.12,s*.3,.3,.32,BODY);mk(Ic(.17,1,.5,1.2,1),K.dark,.12,s*.34,.2,-.4,BODY);
  /* پای عقب */
  [[.5,-.02,-.42],[.48,-.12,-.32],[.46,.04,-.52]].forEach((p,j)=>{const m=mk(Ic(.06,.5,1,1.2,0),SC[j],.14,s*p[0],p[1],p[2],BODY);m.rotation.z=s*.3});
  spike([s*.4,-.3,-.5],[s,.1,-.3],.04,.14,K.hi,BODY);spike([s*.34,-.45,-.46],[0,.2,-1],.03,.12,K.claw,BODY,4);
  spike([s*.36,-.3,-.56],[0,.3,-1],.03,.09,K.dark,BODY,4);spike([s*.35,-.4,-.6],[0,.3,-1],.025,.08,K.dark,BODY,4);
  [-1,0,1].forEach(j=>{mk(Ic(.035,1,1,1,0),K.mid,.1,s*.33+j*.06,-.575,-.18,BODY);mk(Ic(.03,1,.5,1.2,0),K.belly,.1,s*.33+j*.06,-.58,-.1,BODY)});
  spike([s*.4,-.55,-.3],[s*.4,-.1,-1],.022,.08,K.claw,BODY,4)});
 /* پای جلو */
 AR.forEach((A,i)=>{const s=i*2-1;
  mk(Ic(.05,.7,1,1.2,0),K.hi,.14,s*.14,-.1,.08,A);mk(Ic(.05,.7,1,1.2,0),K.dark,.14,s*.12,-.2,.1,A);
  spike([s*.1,-.18,-.05],[s,.2,-.7],.035,.14,K.hi,A);spike([s*.05,-.4,-.05],[s*.3,.1,-1],.03,.1,K.dark,A,4);
  [-1,0,1].forEach(j=>{mk(Ic(.03,1,1,1,0),K.mid,.1,s*.03+j*.06,-.495,.15,A);mk(Ic(.028,1,.5,1.2,0),K.belly,.1,s*.03+j*.06,-.5,.22,A)});
  spike([s*.12,-.47,.03],[s*.5,-.1,-1],.02,.08,K.claw,A,4);
  const br=mk(new THREE.TorusGeometry(.1,.025,4,8),K.dark,.1,s*.04,-.34,.02,A);br.rotation.x=Math.PI/2});
 /* گردن */
 [[.06,.08,.2],[.22,.17,.18],[.38,.27,.16]].forEach((q,i)=>{const y=q[0],z=q[1],r=q[2];
  [-1,1].forEach(s=>mk(Ic(r*.5,.6,1,.8,0),SC[(i+(s>0?1:0))%4],.14,s*r*.9,y,z,NK));
  spike([0,y+.06,z-r*.3],[0,.8,-.6],r*.16,r*.5,K.claw,NK,4)});
 for(let k=-2;k<=2;k++)spike([k*.07,.14,.02],[k*.45,.6,-1],.035,.15-.02*Math.abs(k),k%2?K.dark:K.hi,NK);
 /* سینه */
 mk(Ic(.06,1,1.2,.8,1),K.eye,.1,0,.0,.72,BODY);mk(new THREE.TorusGeometry(.075,.02,4,8),K.dark,.1,0,0,.72,BODY);
 [-1,1].forEach(s=>[.1,.24].forEach(y=>spike([s*.2,y-.1,.66],[s*.8,.5,.6],.04,.14,K.horn,BODY)));
 /* سر */
 const pupM=new THREE.MeshBasicMaterial({color:K.horn,toneMapped:false});
 [-1,1].forEach(s=>{
  [.02,.09,.16].forEach((z,k)=>spike([s*.15,-.04,z],[s,-.2,-.9],.03,.12-.015*k,K.hi,HD,4));
  [[.09,.12,.2],[.12,.1,.06]].forEach(p=>{const m=mk(Ic(.045,1.6,.5,1,0),K.dark,.1,s*p[0],p[1],p[2],HD);m.rotation.z=s*.3});
  const lid=mk(new THREE.BoxGeometry(.09,.015,.09),K.dark,.08,s*.1,.095,.14,HD);lid.rotation.z=s*.25;
  const pu=ghost(new THREE.Mesh(new THREE.BoxGeometry(.012,.07,.01),pupM));pu.position.set(s*.115,.05,.19);HD.add(pu);
  mk(Ic(.03,1,.7,1.2,0),K.dark,.1,s*.05,-.02,.42,HD);
  spike([s*.055,-.085,.36],[0,-1,.2],.02,.09,0xfffaf0,HD,4);spike([s*.05,-.01,.06],[0,1,0],.02,.08,0xfffaf0,JW,4);
  curve([[s*.1,-.06,.28],[s*.22,-.1,.34],[s*.34,-.04,.28],[s*.4,.06,.18]],.014,.004,K.claw,HD,8,4);
  curve([[s*.09,-.07,.24],[s*.2,-.16,.26],[s*.3,-.2,.18]],.011,.003,K.claw,HD,6,4);
  mk(Ic(.06,.2,.9,1.3,1),K.memA,.1,s*.2,.08,0,HD);mk(Ic(.05,.2,.8,1.2,1),K.memB,.1,s*.2,-.02,.02,HD);
  /* حلقه‌های شاخ */
  rings([[s*.08,.14,-.02],[s*.13,.28,-.12],[s*.16,.42,-.3],[s*.12,.5,-.52]],7,.06,.008,K.hi,HD);
  rings([[s*.14,.04,-.02],[s*.2,.08,-.12],[s*.24,.05,-.26]],4,.035,.006,K.hi,HD);
  spike([s*.12,.5,-.52],[0,.2,-1],.014,.1,K.claw,HD,4);spike([s*.24,.05,-.26],[s*.3,0,-1],.01,.08,K.claw,HD,4);
  mk(Ic(.05),K.dark,.12,s*.08,.14,-.02,HD);mk(Ic(.035),K.dark,.12,s*.14,.04,-.02,HD)});
 [.05,.15,.25].forEach(z=>mk(Ic(.028,1,.8,1.3,0),K.hi,.14,0,.17-z*.1,z,HD));
 mk(Ic(.025,1,.8,1.3,0),K.dark,.1,.045,.04,.35,HD);mk(Ic(.025,1,.8,1.3,0),K.dark,.1,-.045,.04,.35,HD);
 [0,1,2].forEach(k=>{spike([0,.15,.02-k*.06],[0,1,-.6],.03,.1+.03*(1-k*.5),k%2?K.dark:K.hi,HD);spike([0,-.06,.1+k*.08],[0,-1,-.3],.02,.09,K.dark,JW,4)});
 curve([[0,-.02,.05],[0,-.02,.2],[0,-.015,.34]],.025,.008,K.memB,JW,6,4);
 spike([0,-.015,.34],[-.3,0,1],.01,.06,K.memB,JW,4);spike([0,-.015,.34],[.3,0,1],.01,.06,K.memB,JW,4);
 /* دم */
 tail.forEach((q,j)=>{const L=TL[j],r=TRd[j];
  [-1,1].forEach(s=>{const m=mk(Ic(r*.55,.5,1,1.2,0),K.dark,.14,s*r*.85,0,-L*.5,q.S);m.rotation.z=s*.3;
   spike([s*r*.8,0,-L*.3],[s,.2,-.6],r*.22,r*.8,K.claw,q.S,4)});
  mk(Ic(TRd[j+1]*1.15,1,1,1,0),K.mid,.1,0,0,-L,q.S);
  spike([0,r*.8,-L*.15],[0,1,-.5],r*.3,r*1.0,j%2?K.dark:K.hi,q.S)});
 {const S=tail[4].S;mk(Ic(.07,.3,1,2,1),K.hi,.14,0,.02,-.2,S);
  [-1,1].forEach(s=>spike([s*.03,0,-.2],[s,0,-.5],.02,.1,K.dark,S,4))}

 /* ---- انیمیشن ---- */
 const ST={t0:-1e9,kind:0,ab:0,d0:-1e9,dead:0},wp=new V(),BASE=1;
 G.scale.setScalar(BASE);
 const visible=()=>{let o=G;while(o){if(o.visible===false)return false;o=o.parent}return true};
 GX.anim(G,t=>{
  const now=performance.now(),br=Math.sin(t*1.6);
  let ne=0,jaw=.04+.03*br,wa=0,arm=-.22,lean=.05,ta=1,eye=0,mouth=0;
  if(ST.dead){
   const e=(now-ST.d0)/1000,a=dgz(e/.3),c=dgz((e-.8)/.55),v=dgz((e-1.35)/.6),sh=a*(1-c);
   ne=-.6*a+.5*c;jaw=.95*a*(1-.6*c);wa=.5*a-.9*c;arm=-.22-.9*a+1.1*c;lean=.05-.3*a+.15*c;ta=1+1.2*a;eye=1-v;mouth=a*(1-c);
   G.position.x=Math.sin(e*75)*.025*sh;G.position.y=-.12*c-.5*v;G.rotation.x=-1.3*c;G.scale.setScalar(Math.max(.001,BASE*(1-.97*v)))}
  else if(ST.kind){
   const e=(now-ST.t0)/1000,am=ST.ab?1.2:1;
   if(e>1.05)ST.kind=0;
   else{const w=dgz(e/.26),s=dgz((e-.26)/.1),r=dgz((e-.46)/.5),mx=(W,S)=>mixv(mixv(mixv(0,W,w),S,s),0,r)*am;
    ne=mx(-.32,.55);jaw+=mx(.12,.78);wa=mx(.4,-.2);arm+=mx(-.8,1.15);lean+=mx(-.12,.22);ta=1+.8*s*(1-r);eye=s*(1-r);mouth=s*(1-r)}}
  NK.rotation.x=ne+.03*Math.sin(t*.9);HD.rotation.x=.22+ne*.5+.03*Math.sin(t*.7);JW.rotation.x=jaw;
  BODY.rotation.x=lean+.012*br;BODY.position.y=Y+HIP+.015*br;
  AR[0].rotation.x=arm*.4+.03*Math.sin(t*1.1);AR[1].rotation.x=arm*.4+.03*Math.sin(t*1.1+1.3);
  WG.forEach((q,i)=>{q.P.rotation.z=q.s*(.14+.06*Math.sin(t*1.7+i*.5)+wa);q.P.rotation.y=q.s*.04*Math.sin(t*1.7+i)});
  tail.forEach((q,j)=>{q.S.rotation.y=q.yaw+ta*.12*Math.sin(t*1.3-j*.55);q.S.rotation.x=q.pit+.03*Math.sin(t*1.1-j*.4)});
  glowM.opacity=Math.min(1,.45+.15*Math.sin(t*2.2)+.5*eye);eyeG.forEach(g=>g.scale.setScalar(1+.6*eye));mgM.opacity=mouth*.9;
  if(!ST.dead&&Math.random()<.018&&typeof FXI!=='undefined'&&FXI&&visible()){try{MO.updateWorldMatrix(true,false);MO.getWorldPosition(wp);
   if(K===DGT.fd)burst(wp,1,0xff8a2a,{sp:.25,vy:.6,g:-1.6,size:.26,life:.9,y:0,r:.04,h:.04,up:.6});
   else burst(wp,2,0x5da2ff,{sp:.7,vy:0,g:0,size:.16,life:.22,y:0,r:.25,h:.25,up:0})}catch(e){}}
 });
 G.userData.dg={mouth:MO,
  atk:ab=>{if(ST.dead)return;const n=performance.now();if(n-ST.t0<450)return;ST.t0=n;ST.kind=1;ST.ab=ab?1:0},
  die:()=>{ST.dead=1;ST.d0=performance.now()}};
 return G}

/* مدل ساده برای وقتی که ساخت مدل اصلی خطا بدهد (تا مهره نامرئی نشود) */
function dgFallback(M,team,K){const G=new THREE.Group(),m=M(GX.c(K.mid),{roughness:.5,flatShading:true});
 const b=new THREE.Mesh(new THREE.IcosahedronGeometry(.5,0).scale(1,1.5,.9),m);b.position.y=1.2;G.add(b);
 const h=new THREE.Mesh(new THREE.IcosahedronGeometry(.25,0),m);h.position.set(0,2.1,.3);G.add(h);
 [-1,1].forEach(s=>{const w=new THREE.Mesh(new THREE.ConeGeometry(.6,1.4,3),m);w.position.set(s*.8,1.8,-.2);w.rotation.z=-s*.6;G.add(w)});
 return G}
const reg=(k)=>{const old=FIG[k];FIG[k]=(M,t)=>{try{return gxDragon(M,t,DGT[k])}catch(e){console.error('dragon',k,e);try{return dgFallback(M,t,DGT[k])}catch(e2){return old?old(M,t):new THREE.Group()}}}};
reg('fd');reg('ft');

/* ---------- کمک‌ها ---------- */
const dgFig=g=>{const i=g&&g.children[0];return i&&i.children.find(o=>o.userData&&o.userData.dg)};
const dgMouth=g=>{const f=dgFig(g);if(!f)return null;const p=new V(),m=f.userData.dg.mouth;m.updateWorldMatrix(true,false);m.getWorldPosition(p);return p};

/* ---------- افکت ضربه ---------- */
function impactFire(B,ab){
 burst(B,ab?44:30,0xff6a14,{sp:4.2,vy:2.8,g:-3,size:.62,life:1,y:0,r:.5});
 burst(B,18,0xffd24a,{sp:3,vy:2.4,g:-2.4,size:.42,life:.85,y:0,r:.4});
 burst(B,10,0xffffff,{sp:2.2,size:.3,life:.3,g:0,y:0,r:.2});
 const g0=new V(B.x,0,B.z);ring(g0,0xff7a1a,ab?2.6:1.9,.5,.14);ring(g0,0xffd24a,ab?1.7:1.2,.4,.16);
 shk=Math.max(shk,ab?.5:.3);if(gok('dgfh',60))SFX.hit(1)}
function dgHit(a,t,d){
 const ga=unitG.get(a),gt=unitG.get(t);if(!gt)return;
 if(ga&&a!==t){const dx=gt.position.x-ga.position.x,dz=gt.position.z-ga.position.z;if(dx||dz){ga.userData.fy=Math.atan2(dx,dz);ga.userData.ft=2}}
 const own=!!CX&&CX.a===a,ab=own&&CX.ab,f=dgFig(ga),m=f&&f.userData.dg,tg=gt.position.clone().add(new V(0,.9,0));
 if(a.k==='fd'){
  const first=!own||!CX.dgF;if(own)CX.dgF=1;
  if(m&&first)m.atk(ab);
  if(ab){const p=gt.position;burst(p,26,0xff6a14,{sp:2.5,vy:2.4,g:-3,size:.5,life:.9});burst(p,12,0xffd24a,{sp:1.8,vy:2,g:-2.5,size:.4,life:.8});return}
  setTimeout(()=>{try{
   const A=(m&&dgMouth(ga))||(ga?ga.position.clone().add(new V(0,1.8,0)):tg.clone().add(new V(0,2,0))),B=tg.clone(),N=11;
   for(let i=0;i<N;i++)setTimeout(()=>{const q=A.clone().lerp(B,(i+1)/N);burst(q,5,i%3?0xff7a1a:0xffd24a,{sp:.7+i*.12,size:.3+i*.07,life:.5,g:-2.2,vy:.4,up:.3,y:0,r:.1+i*.03,h:.1})},i*26);
   setTimeout(()=>{try{impactFire(B,false)}catch(e){}},N*26+30)}catch(e){}},m?260:0);
  return}
 /* اژدهای رعدآسا: صاعقهٔ آبی تیره */
 const i=own?CX.i++:0,from0=own&&CX.prev?CX.prev.clone():null;if(own)CX.prev=tg.clone();
 if(m&&(i===0||!own))m.atk(ab);
 setTimeout(()=>{try{
  const A=from0||(m&&dgMouth(ga))||tg.clone().add(new V(0,2.5,0)),C=0x2f6bff;
  bolt(A,tg,C);
  if(i===0||!own)bolt(tg.clone().add(new V((rd()-.5)*.8,4.5,(rd()-.5)*.8)),tg,C);
  for(let k=0;k<3;k++)bolt(tg,tg.clone().add(new V((rd()-.5)*1.4,(rd()-.5)*.8,(rd()-.5)*1.4)),C);
  burst(tg,20,0x3a7bff,{sp:3.6,size:.26,life:.5,g:3,y:0});burst(tg,10,0x9cc4ff,{sp:2.4,size:.2,life:.4,g:2,y:0});burst(tg,6,0xffffff,{sp:2,size:.3,life:.25,y:0});
  const g0=new V(tg.x,0,tg.z);ring(g0,0x2f6bff,i?1.5:2.2,.45,.14);ring(g0,0x8fb8ff,1.1,.3,.16);
  flash(gt,0x9fc8ff,6);shk=Math.max(shk,.25);
  SFX.thunder(i?.65:1,0,i===0);if(i===0)os('sine',70,30,.5,.7)}catch(e){}},(m?260:0)+i*90)}

const _hf=hitFX;
hitFX=function(a,t,d){if(a.k!=='fd'&&a.k!=='ft')return _hf(a,t,d);try{dgHit(a,t,d)}catch(e){console.error('dgHit',e);return _hf(a,t,d)}};

/* ---------- غرش مرگ ---------- */
function dgRoar(kind){const a=au();if(!a||!MG)return;const t=a.currentTime,th=kind==='ft',D=th?1.7:1.6;
 const out=a.createGain();out.gain.setValueAtTime(.0001,t);out.gain.exponentialRampToValueAtTime(1,t+.1);out.gain.setValueAtTime(1,t+D*.5);out.gain.exponentialRampToValueAtTime(.001,t+D);out.connect(MG);
 const flt=a.createBiquadFilter();flt.type='lowpass';flt.Q.value=3;flt.frequency.setValueAtTime(th?1700:1300,t);flt.frequency.exponentialRampToValueAtTime(240,t+D);
 const am=a.createGain();am.gain.value=.6;flt.connect(am);am.connect(out);
 const lfo=a.createOscillator(),lg=a.createGain();lfo.type='sine';lfo.frequency.setValueAtTime(th?24:32,t);lfo.frequency.linearRampToValueAtTime(12,t+D);lg.gain.value=.38;lfo.connect(lg);lg.connect(am.gain);lfo.start(t);lfo.stop(t+D+.05);
 const o=(ty,f0,f1,g)=>{const s=a.createOscillator(),v=a.createGain();s.type=ty;s.frequency.setValueAtTime(f0,t);s.frequency.exponentialRampToValueAtTime(f1,t+D);v.gain.value=g;s.connect(v);v.connect(flt);s.start(t);s.stop(t+D+.05)};
 const b=th?118:96;o('sawtooth',b,b*.38,.5);o('sawtooth',b*1.03,b*.4,.42);o('square',b*2.02,b*.8,.16);o('sawtooth',b*3.1,b*1.1,.08);o('sawtooth',th?520:420,th?150:110,.12);
 nz(.7,'bandpass',th?1500:900,200,.9,.8);nz(.7,'lowpass',2200,150,.8,.6,.55);
 if(th){SFX.thunder(1.2,0,true);SFX.thunder(.9,.55,true)}
 else{SFX.flame(1.2);for(let i=0;i<7;i++)nz(.03,'highpass',3500+rd()*3000,8000,1,.25,.2+i*.12+rd()*.05)}
 os('sine',75,26,.6,1.2,.8);nz(.45,'lowpass',600,60,.9,.9,.8)}
SFX.dragonRoar=dgRoar;

/* مرگ: مهره‌ای که از U حذف شده چند ثانیه روی صحنه می‌ماند تا انیمیشن و غرش تمام شود */
function dgDie(u,g){
 const d=g.userData;d.dgDie=1;unitG.delete(u);
 d.pick.forEach(m=>{const i=pickables.indexOf(m);if(i>=0)pickables.splice(i,1)});
 if(d.last>0)popup('-'+PX(Math.round(d.last)),g.position,'#ff5a4d');
 try{d.lb.sp.visible=false;d.shield.visible=false;d.cage.visible=false;d.hack.visible=false;if(d.aura)d.aura.visible=false;if(d.bm)d.bm.forEach(b=>b.visible=false)}catch(e){}
 const fire=u.k==='fd',f=dgFig(g),m=f&&f.userData.dg,P=g.position.clone();
 try{dgRoar(fire?'fd':'ft')}catch(e){}
 if(m)m.die();
 if(FXI){
  const T=(fn,ms)=>setTimeout(()=>{try{fn()}catch(e){}},ms);
  T(()=>{shk=Math.max(shk,.4)},60);
  if(fire){for(let i=0;i<9;i++)T(()=>{const q=dgMouth(g)||P.clone().add(new V(0,2,0));burst(q,8,i%2?0xffd24a:0xff6a14,{sp:2.2,vy:1.6,g:-2.5,size:.5,life:.9,y:0,r:.1,up:1.2})},150+i*85);
   T(()=>{const g0=new V(P.x,0,P.z);ring(g0,0xff7a1a,2.8,.6,.14);burst(P,20,0xc9b79a,{sp:2.5,size:.5,life:.7,g:1,y:0,r:.8,vy:.6});shk=Math.max(shk,.6)},900);
   T(()=>{burst(P,40,0xff6a14,{sp:3.5,vy:3,g:-2.5,size:.55,life:1.1,y:.6,r:.6});burst(P,16,0xffd24a,{sp:2.5,vy:2.4,g:-2,size:.4,life:.9,y:.6});ring(new V(P.x,0,P.z),0xffd24a,3,.7,.14)},1750)}
  else{for(let i=0;i<9;i++)T(()=>{const a=P.clone().add(new V((rd()-.5)*1.6,3.6,(rd()-.5)*1.6)),b=P.clone().add(new V((rd()-.5)*.8,.5+rd()*1.6,(rd()-.5)*.8));bolt(a,b,0x2f6bff);burst(b,8,0x4d8aff,{sp:2.5,size:.26,life:.4,g:2,y:0});if(i%3===0)SFX.thunder(.8,0,i===0)},120+i*95);
   T(()=>{const g0=new V(P.x,0,P.z);ring(g0,0x2f6bff,2.8,.6,.14);burst(P,20,0xc9c9d6,{sp:2.5,size:.5,life:.7,g:1,y:0,r:.8,vy:.6});shk=Math.max(shk,.6)},900);
   T(()=>{burst(P,40,0x3a7bff,{sp:3.5,vy:3,g:-1,size:.4,life:.9,y:.6,r:.6});burst(P,14,0xffffff,{sp:2.5,vy:2,g:0,size:.3,life:.4,y:.6});ring(new V(P.x,0,P.z),0x8fb8ff,3,.7,.14)},1750)}}
 setTimeout(()=>{try{if(f)f.traverse(o=>{if(o.geometry)o.geometry.dispose()});scene.remove(g);g.traverse(o=>{if(o.material){if(o.material.map)o.material.map.dispose();o.material.dispose()}})}catch(e){}},2400)}
const _su=syncUnits;
syncUnits=function(){
 try{for(const [u,g] of [...unitG]){if(!U.includes(u)&&u.hp<=0&&(u.k==='fd'||u.k==='ft')&&!g.userData.dgDie&&(phase!=='play'||(vhp(u),!u.vq)))dgDie(u,g)}}catch(e){console.error('dgDie',e)}
 return _su()};
})();


/* ===== پادشاه اهریمن: صدا، افکت ضربه، شروع انیمیشن و مرگ ===== */
SFX.dk=ab=>{
 if(!ab){os('sawtooth',100,62,.45,.22,0);nz(.3,'lowpass',900,200,1,.3,0);nz(.16,'bandpass',500,3000,1.4,.55,.2);nz(.12,'bandpass',3000,800,1.4,.4,.31);
  const b=.39;os('sine',120,34,.45,1.2,b);nz(.12,'lowpass',2600,220,1,1,b);nz(.05,'highpass',2500,9000,1,.6,b);[2300,3400,5200].forEach((f,i)=>os('triangle',f,f*.97,.35-i*.08,.13/(i+1),b+.01))}
 else{os('sawtooth',70,140,.55,.3,0);os('sawtooth',72,130,.55,.3,0);os('sawtooth',140,60,.5,.25,.4);nz(.9,'bandpass',300,1400,1.2,.4,0);wn(.6,500,2000,1,.35,.1);
  const b=.72;os('sine',80,22,.9,1.5,b);nz(.8,'lowpass',1200,60,.8,1.2,b);nz(.06,'highpass',2000,8000,1,.8,b);os('sine',48,24,1,1,b+.02)}};
SFX.dkDie=()=>{os('sawtooth',130,34,1.3,.4,0);os('sawtooth',133,36,1.3,.35,0);nz(.9,'bandpass',500,150,1,.5,0);os('sine',70,24,.7,1.2,.9);nz(.5,'lowpass',700,60,.9,.9,.9);os('sine',45,20,.9,1,1.3)};
function dkBlocked(a,t){if(phase!=='play'||!FXI)return;const gt=unitG.get(t);if(!gt)return;const P0=gt.position.clone();
 setTimeout(()=>{try{const Z=new THREE.Vector3(P0.x,0,P0.z);ring(Z,0xffb04d,1.6,.45,.14);burst(P0.clone().add(new THREE.Vector3(0,.5,0)),12,0xffd27a,{sp:3,size:.16,life:.35,g:2,y:0});shk=Math.max(shk,.45);if(gok('dkb',80))SFX.hit(1)}catch(e){}},400)}
function dkFig(g){const i=g&&g.children[0];return i&&i.children.find(o=>o.userData&&o.userData.dk)}
function dkStart(a,t,ab){const g=unitG.get(a),f=dkFig(g);if(!g||!f)return;
 if(t&&t!==a&&t.c!=null){const dx=CELL_X(t.c)-g.position.x,dz=CELL_Z(t.c,t.r)-g.position.z;if(dx||dz){g.userData.fy=Math.atan2(dx,dz);g.userData.hf=1;g.userData.ft=ab?2.4:1.8}}
 f.userData.dk.atk(ab);try{SFX.dk(ab)}catch(e){}
 if(ab)setTimeout(()=>{try{const P0=g.position.clone(),Z=new THREE.Vector3(P0.x,0,P0.z);ring(Z,0xb44dff,3.4,.7,.14);ring(Z,0x2a0a4a,2.2,.5,.15);
  burst(P0,30,0x8a2cff,{sp:4,vy:2,g:2,size:.4,life:.7,y:.1,r:.8});burst(P0,16,0x120620,{sp:3,size:.5,life:.9,g:1,y:.1,r:.8});shk=Math.max(shk,.7)}catch(e){}},720)}
function dkImpact(a,t,d,ab){const gt=unitG.get(t),ga=unitG.get(a);if(!gt)return;
 const P0=gt.position.clone(),ms=ab?720:390,dx=ga?P0.x-ga.position.x:0,dz=ga?P0.z-ga.position.z:1,L=Math.hypot(dx,dz)||1,px=-dz/L,pz=dx/L;
 setTimeout(()=>{try{const p=P0.clone().add(new THREE.Vector3(0,.95,0));
  burst(p,ab?22:14,0xb44dff,{sp:3.4,size:.26,life:.5,g:3,y:0});burst(p,ab?14:8,0x1a0a2a,{sp:2.4,size:.34,life:.7,g:2,y:0});burst(p,8,0xffd27a,{sp:3.8,size:.14,life:.25,g:2,y:0});
  for(let k=-1;k<=1;k++){const o=new THREE.Vector3(px*k*.2,0,pz*k*.2);tracer(p.clone().add(o).add(new THREE.Vector3(px*.55,.5,pz*.55)),p.clone().add(o).add(new THREE.Vector3(-px*.55,-.5,-pz*.55)),0xe0a0ff,.25,10)}
  ring(new THREE.Vector3(P0.x,0,P0.z),0xb44dff,ab?2:1.3,.4,.15);shk=Math.max(shk,ab?.55:.35);if(gok('dkh',60))SFX.hit(1)}catch(e){}},ms)}
function dkDie(u,g){const d=g.userData;d.dgDie=1;unitG.delete(u);d.pick.forEach(m=>{const i=pickables.indexOf(m);if(i>=0)pickables.splice(i,1)});
 if(d.last>0)popup('-'+PX(Math.round(d.last)),g.position,'#ff5a4d');
 try{d.lb.sp.visible=false;d.shield.visible=false;d.cage.visible=false;d.hack.visible=false;if(d.aura)d.aura.visible=false;if(d.bm)d.bm.forEach(b=>b.visible=false)}catch(e){}
 const f=dkFig(g),m=f&&f.userData.dk,P0=g.position.clone(),T=(fn,ms)=>setTimeout(()=>{try{fn()}catch(e){}},ms);
 if(m)m.die();try{SFX.dkDie()}catch(e){}
 if(FXI){T(()=>{shk=Math.max(shk,.45)},60);
  for(let i=0;i<8;i++)T(()=>{burst(P0.clone().add(new THREE.Vector3((rd()-.5)*.8,.8+rd()*1.8,(rd()-.5)*.8)),10,i%2?0xb44dff:0x2a0a4a,{sp:2.4,vy:1.4,g:-.5,size:.45,life:.9,y:0,r:.3,up:1})},100+i*90);
  T(()=>{const Z=new THREE.Vector3(P0.x,0,P0.z);ring(Z,0xb44dff,2.8,.6,.14);burst(P0,20,0x5a3a7a,{sp:2.5,size:.5,life:.7,g:1,y:0,r:.8,vy:.6});shk=Math.max(shk,.7)},900);
  T(()=>{const Z=new THREE.Vector3(P0.x,0,P0.z);burst(P0,40,0x8a2cff,{sp:3.5,vy:3,g:-1,size:.5,life:1,y:.6,r:.6});ring(Z,0xd8a0ff,3,.7,.14)},1750)}
 setTimeout(()=>{try{scene.remove(g);g.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){if(o.material.map)o.material.map.dispose();o.material.dispose()}})}catch(e){}},2700)}
(function(){const _s=syncUnits;syncUnits=function(){
 try{for(const [u,g] of [...unitG]){if(!U.includes(u)&&u.hp<=0&&u.k==='dk'&&!g.userData.dgDie&&(phase!=='play'||(vhp(u),!u.vq)))dkDie(u,g)}}catch(e){console.error('dkDie',e)}
 return _s()}})();


/* ===== اسکین شوالیه آکروبات (acro) — مطابق تصویر مرجع =====
   موی بلند نقره‌ای-یاسی با روبان آبی، چشم بنفش، زرهٔ سفید-طلایی با کرست مشکی، تابارد سرمه‌ای با زنبق طلایی،
   چکمهٔ زره‌دار و شمشیر بلند. انیمیشن‌ها: بیکار (نفس، موها، شنل و تابارد) | ضربه (آماده‌سازی ← برش با رد نورانی ← برگشت)
   | آسیب‌دیدن (عقب‌نشینی و شلاق خوردن موها) | مرگ (تلوتلو، زانو زدن، افتادن، محو شدن) | پرش و فلیپ (قابلیت). */
GX.acFl=(x,cx,cy,s)=>{x.fillStyle='#e2b850';
 x.beginPath();x.moveTo(cx,cy-20*s);x.bezierCurveTo(cx+9*s,cy-9*s,cx+7*s,cy+3*s,cx,cy+9*s);x.bezierCurveTo(cx-7*s,cy+3*s,cx-9*s,cy-9*s,cx,cy-20*s);x.fill();
 [-1,1].forEach(q=>{x.save();x.translate(cx,cy);x.scale(q,1);x.beginPath();x.moveTo(4*s,0);x.bezierCurveTo(20*s,-10*s,26*s,8*s,12*s,16*s);x.bezierCurveTo(16*s,8*s,10*s,5*s,4*s,10*s);x.closePath();x.fill();x.restore()});
 x.fillRect(cx-11*s,cy+8*s,22*s,4*s);x.beginPath();x.moveTo(cx-4*s,cy+12*s);x.lineTo(cx,cy+24*s);x.lineTo(cx+4*s,cy+12*s);x.fill()};
GX.acTab=()=>GX._acT||(GX._acT=GX.tex(128,256,(x,w,h)=>{
 const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#2e3da8');g.addColorStop(1,'#1b2268');x.fillStyle=g;x.fillRect(0,0,w,h);
 for(let i=0;i<46;i++){x.strokeStyle=i%2?'rgba(8,10,50,.22)':'rgba(130,145,240,.12)';x.lineWidth=1+Math.random()*3;const X=Math.random()*w;x.beginPath();x.moveTo(X,0);x.bezierCurveTo(X+8,h*.3,X-8,h*.6,X+Math.random()*8-4,h);x.stroke()}
 x.fillStyle='#dcb24a';x.fillRect(0,0,7,h);x.fillRect(w-7,0,7,h);x.fillRect(0,h-14,w,14);x.fillStyle='rgba(60,30,0,.45)';x.fillRect(7,0,2,h);x.fillRect(w-9,0,2,h);x.fillRect(0,h-16,w,2);
 GX.acFl(x,w/2,h*.6,1.5)},1));
GX.acFr=()=>GX._acF||(GX._acF=GX.tex(128,192,(x,w,h)=>{
 const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#ffffff');g.addColorStop(1,'#e2dcef');x.fillStyle=g;x.fillRect(0,0,w,h);
 for(let i=0;i<34;i++){x.fillStyle=i%2?'rgba(130,120,170,.10)':'rgba(220,180,80,.16)';x.beginPath();x.ellipse(Math.random()*w,Math.random()*h,1+Math.random()*3,1+Math.random()*2,Math.random()*3,0,7);x.fill()}
 x.fillStyle='#dcb24a';x.fillRect(0,0,6,h);x.fillRect(w-6,0,6,h);x.fillRect(0,0,w,8);x.fillStyle='rgba(60,30,0,.4)';x.fillRect(6,0,2,h);x.fillRect(w-8,0,2,h);
 GX.acFl(x,w/2,h*.4,1.45);x.fillStyle='#dcb24a';x.fillRect(w*.25,h*.74,w*.5,3);x.fillRect(w*.32,h*.8,w*.36,2)},1));
GX.faceAc=o=>GX.tex(256,256,(x,w,h)=>{
 const S='#'+new THREE.Color(o.skin).getHexString(),g=x.createRadialGradient(w/2,h*.55,8,w/2,h*.5,w*.6);
 g.addColorStop(0,o.hi);g.addColorStop(.75,S);g.addColorStop(1,S);x.fillStyle=g;x.fillRect(0,0,w,h);x.lineCap='round';x.lineJoin='round';
 [.16,.84].forEach(a=>{const r=x.createRadialGradient(a*w,h*.68,2,a*w,h*.68,34);r.addColorStop(0,'rgba(255,120,130,.28)');r.addColorStop(1,'rgba(255,120,130,0)');x.fillStyle=r;x.fillRect(a*w-36,h*.68-36,72,72)});
 [-1,1].forEach(s=>{x.save();x.translate(w/2+s*o.ex,h*.5);x.scale(s,1);
  const eye=()=>{x.beginPath();x.moveTo(-26,2);x.bezierCurveTo(-14,-14,14,-16,28,0);x.bezierCurveTo(14,13,-12,15,-26,2);x.closePath()};
  eye();x.fillStyle='#f6f2f7';x.fill();x.save();eye();x.clip();
  const ir=x.createRadialGradient(2,3,2,2,3,22);ir.addColorStop(0,'#cfc8ff');ir.addColorStop(.45,'#6f62e6');ir.addColorStop(1,'#2a2476');x.fillStyle=ir;x.beginPath();x.ellipse(2,2,15,19,0,0,7);x.fill();
  x.fillStyle='#120e2c';x.beginPath();x.ellipse(2,3,6,10,0,0,7);x.fill();x.fillStyle='rgba(40,30,90,.4)';x.fillRect(-30,-22,60,15);
  x.fillStyle='#fff';x.beginPath();x.arc(-4,-5,5,0,7);x.fill();x.beginPath();x.arc(8,10,2.6,0,7);x.fill();x.restore();
  x.strokeStyle='#5d5683';x.lineWidth=6;x.beginPath();x.moveTo(-27,2);x.bezierCurveTo(-14,-14,14,-16,29,0);x.stroke();
  x.lineWidth=4;x.beginPath();x.moveTo(26,-3);x.lineTo(40,-8);x.stroke();
  x.strokeStyle='#aaa3d0';x.lineWidth=5;x.beginPath();x.moveTo(-24,-26);x.quadraticCurveTo(6,-37,34,-31);x.stroke();x.restore()});
 x.strokeStyle='rgba(150,90,90,.35)';x.lineWidth=3;x.beginPath();x.moveTo(w/2-2,h*.66);x.lineTo(w/2+3,h*.69);x.stroke();
 x.strokeStyle='#c4707e';x.lineWidth=3.5;x.beginPath();x.moveTo(w/2-15,h*.835);x.quadraticCurveTo(w/2,h*.83,w/2+15,h*.835);x.stroke();
 x.fillStyle='rgba(220,130,150,.55)';x.beginPath();x.ellipse(w/2,h*.845,11,3.2,0,0,7);x.fill()},1);
function gxAcro(M,team){
 const G=new THREE.Group(),P=GX.pal(M),Y=.18,TAU=Math.PI*2,PV=new THREE.Group(),C=new THREE.Group(),
  B=(g,m,x,y,z,Q)=>{const e=new THREE.Mesh(g,m);e.position.set(x||0,y||0,z||0);(Q||C).add(e);return e},
  S=(r,a,b,c)=>new THREE.SphereGeometry(r,18,12).scale(a,b,c),
  Cy=(r1,r2,l,s)=>new THREE.CylinderGeometry(r1,r2,l,s||14),Bx=(a,b,c)=>new THREE.BoxGeometry(a,b,c),
  Cn=(r,l,s)=>new THREE.ConeGeometry(r,l,s||5),Oc=(r,a,b,c)=>new THREE.OctahedronGeometry(r).scale(a,b,c),
  Tr=(r,t,s,arc)=>new THREE.TorusGeometry(r,t,8,s||24,arc),Ld=GX.lathe,
  ez=x=>x<=0?0:x>=1?1:x*x*(3-2*x),cl=(v,a)=>v<-a?-a:v>a?a:v,mix=(a,b,k)=>a.map((v,i)=>v+(b[i]-v)*k),
  ghost=m=>{m.raycast=()=>{};Object.defineProperty(m,'castShadow',{get:()=>false,set:()=>{}});return m};
 /* محور چرخش وسط بدن (برای فلیپ قابلیت) */
 PV.position.set(0,1.1,0);C.position.set(0,-1.1,0);PV.add(C);G.add(PV);
 // ---- مواد ----
 const Wm=M(GX.c(0xf3f0f8),{roughness:.28,metalness:.5,clearcoat:.7,clearcoatRoughness:.22,side:THREE.DoubleSide}),
  Wc=P.cloth(0xf5f2f9),Au=P.metal(0xdcb04c,{roughness:.28}),Bk=P.leather(0x16141c),Bc=P.cloth(0x1b1a26,{roughness:.7}),
  Nk=P.cloth(0x1f2776,{roughness:.72}),Sv=P.metal(0xeef1f8,{roughness:.14}),Sk=P.skin(0xf7dccf),
  Hr=M(GX.c(0xcfc8ef),{roughness:.34,metalness:.12,clearcoat:.65,clearcoatRoughness:.22}),
  Hr2=M(GX.c(0xebe7fc),{roughness:.34,metalness:.1,clearcoat:.6}),Hr3=M(GX.c(0xaaa2da),{roughness:.4,metalness:.1,clearcoat:.5}),
  Rb=P.cloth(0x2b40bf,{roughness:.55}),Gm=M(GX.c(0x5f6dff),{roughness:.1,metalness:.3,clearcoat:1,emissive:new THREE.Color(.05,.07,.35)}),
  Nb=M(GX.c(0x4a55a8),{roughness:.25,metalness:.6}),
  TabF=P.cloth(0xffffff,{map:GX.acTab(),roughness:.85,side:THREE.FrontSide}),TabB=P.cloth(0xffffff,{map:GX.acTab(),roughness:.85,side:THREE.BackSide}),
  LinF=P.cloth(0xf2eff8,{roughness:.9,side:THREE.FrontSide}),LinB=P.cloth(0xf2eff8,{roughness:.9,side:THREE.BackSide}),
  FrF=P.cloth(0xffffff,{map:GX.acFr(),roughness:.85,side:THREE.FrontSide}),FrB=P.cloth(0xf2eff8,{roughness:.9,side:THREE.BackSide});
 // ---- پاها: ران، چکمهٔ مشکی با زانوی خاردار، ساق‌بند سفید-طلایی، کفش پاشنه‌دار ----
 const legs=[-1,1].map(s=>{const L=new THREE.Group();L.position.set(s*.13,Y+.95,0);C.add(L);
  GX.strand(L,Sk,[[0,.02,0],[0,-.26,.01],[0,-.5,0]],.118,.092,8);
  if(s<0){B(Cy(.114,.114,.07,16),Bk,0,-.27,0,L);B(Bx(.075,.06,.03),Au,0,-.27,.115,L);B(Bx(.03,.04,.034),Bk,0,-.27,.118,L)}
  const K=new THREE.Group();K.position.set(0,-.5,0);L.add(K);
  B(Ld([[.098,-.43],[.112,-.3],[.125,-.14],[.118,0],[.108,.06]],24),Bk,0,0,0,K);
  B(Oc(.15,1,1.25,.6),Au,0,0,.1,K);B(Oc(.132,1,1.2,.5),Wm,0,0,.115,K);B(Tr(.125,.014,22),Au,0,-.07,0,K).rotation.x=Math.PI/2;
  [-1,1].forEach(q=>B(Cn(.03,.15,4),Au,q*.135,-.02,.03,K).rotation.z=-q*1.25);B(Cn(.028,.12,4),Au,0,.12,.09,K);
  B(Ld([[.116,-.46],[.132,-.38],[.138,-.3]],22),Wm,0,0,0,K);B(Tr(.137,.013,22),Au,0,-.3,0,K).rotation.x=Math.PI/2;B(Tr(.12,.012,22),Au,0,-.45,0,K).rotation.x=Math.PI/2;
  B(Oc(.09,1,1.5,.5),Wm,0,-.4,.1,K);B(Bx(.05,.18,.02),Au,0,-.2,.12,K);
  B(S(.115,1,.5,1.75),Wm,0,-.4,.075,K);B(Bx(.2,.03,.4),Bk,0,-.44,.06,K);B(Cn(.03,.12,6),Sv,0,-.4,-.115,K).rotation.x=Math.PI;
  return{L,K}});
 // ---- بالاتنه: کرست سفید با پنل مشکی و بند طلایی ----
 const TG=new THREE.Group();TG.position.set(0,Y+.95,0);C.add(TG);
 B(Ld([[.19,-.05],[.185,.08],[.165,.2],[.2,.3],[.235,.4],[.215,.52],[.14,.66]],32),Wc,0,0,0,TG).scale.set(1,1,.82);
 B(Bx(.1,.34,.03),Bk,0,.2,.152,TG);for(let i=0;i<5;i++)B(Bx(.085,.012,.012),Au,0,.07+i*.062,.17,TG);
 [-1,1].forEach(s=>{B(Bx(.035,.38,.03),Bk,s*.135,.21,.12,TG).rotation.z=s*.1;B(Bx(.06,.02,.034),Au,s*.135,.1,.13,TG);B(Bx(.06,.02,.034),Au,s*.135,.28,.12,TG)});
 [-1,1].forEach(s=>{B(S(.15,1,.95,.95),Wc,s*.105,.44,.13,TG);B(Tr(.15,.011,26),Au,s*.105,.405,.13,TG).rotation.x=-.35});
 B(Bx(.022,.1,.01),Au,0,.47,.265,TG);B(Bx(.06,.02,.01),Au,0,.49,.265,TG);
 B(Ld([[.23,.3],[.25,.4],[.23,.52],[.14,.62]],30),Wc,0,0,0,TG).scale.set(1,.45,.7);
 B(Ld([[.095,.62],[.112,.67],[.112,.78],[.095,.8]],20),Bk,0,0,0,TG);B(Tr(.112,.01,20),Au,0,.79,0,TG).rotation.x=Math.PI/2;B(Oc(.025,1,1.4,.6),Gm,0,.7,.118,TG);
 B(Tr(.2,.006,24,Math.PI),Au,0,.62,.06,TG).rotation.z=Math.PI;
 // ---- کمربند، ابزار طلایی و دامن چین‌دار سرمه‌ای ----
 B(Tr(.215,.02,28),Bk,0,.04,0,TG).rotation.x=Math.PI/2;B(Bx(.07,.055,.03),Au,.11,.04,.218,TG);B(Bx(.07,.055,.03),Au,-.11,.04,.218,TG);
 B(Oc(.045,1,1.4,.5),Au,0,.04,.228,TG);B(Bx(.02,.11,.01),Au,0,.03,.25,TG);B(Bx(.07,.02,.01),Au,0,.05,.25,TG);
 B(Tr(.1,.006,16,Math.PI),Au,.1,-.02,.21,TG).rotation.z=Math.PI;
 const sk=B(Ld([[.2,.04],[.27,-.06],[.33,-.2],[.36,-.27]],40,24,.05),Nk,0,0,0,TG);sk.scale.set(1,1,.92);
 B(Tr(.362,.013,40),Au,0,-.27,0,TG).rotation.x=Math.PI/2;
 // ---- پارچه‌ها: تابارد جلو، دو تابارد کناری بلند، شنل پشت و شال شانه ----
 const cloths=[];
 const mkCloth=(w,h,nu,nv,mf,mb,tip,x,y,z,Q,ph,kk)=>{const g=new THREE.PlaneGeometry(w,h,nu,nv);g.translate(0,-h/2,0);const p=g.attributes.position;
  for(let i=0;i<p.count;i++){const px=p.getX(i),py=p.getY(i),v=-py/h;p.setY(i,py-tip*(1-Math.abs(px)/(w/2))*Math.pow(v,4))}
  g.computeVertexNormals();const base=Float32Array.from(p.array),grp=new THREE.Group();grp.position.set(x,y,z);Q.add(grp);
  const a=new THREE.Mesh(g,mf),b=new THREE.Mesh(g,mb);a.frustumCulled=false;b.frustumCulled=false;a.castShadow=true;grp.add(a,b);
  const o={g,base,grp,h,ph:ph||0,k:kk||1};cloths.push(o);return o};
 mkCloth(.34,.5,6,8,FrF,FrB,.1,.04,.02,.22,TG,.3,.5).grp.rotation.x=-.4;
 [-1,1].forEach((s,i)=>{const c=mkCloth(.4,.98,6,11,TabF,LinB,.16,s*.3,.01,.02,TG,i*1.7+1,1);c.grp.rotation.set(0,s*.5,-s*.1)});
 const cape=mkCloth(.86,1.45,10,14,LinF,TabB,.2,-.02,.64,-.2,TG,2.2,1.2);
 const drape=mkCloth(.36,.58,5,6,TabF,LinB,.08,-.42,.6,-.03,TG,4.1,1);drape.grp.rotation.z=.16;
 const clothAnim=(c,t,sx,sz)=>{const a=c.g.attributes.position.array,b=c.base,n=a.length/3;
  for(let k=0;k<n;k++){const bx=b[k*3],by=b[k*3+1],v=Math.max(0,Math.min(1,-by/c.h)),d=Math.pow(v,1.3),sa=Math.sin(t*1.7+v*3.4+bx*3+c.ph),sb=Math.sin(t*3+v*6+bx*5+c.ph);
   a[k*3]=bx*(1+d*.04*sa)+d*(sx*.7+.02*sb)*c.k;a[k*3+1]=by+d*.02*sb-d*Math.abs(sz)*.05;a[k*3+2]=b[k*3+2]+d*(.04+.04*sa+cl(sz,.55)*.9)*c.k}
  c.g.attributes.position.needsUpdate=true;c.g.computeVertexNormals()};
 // ---- سر ----
 const HD=new THREE.Group();HD.position.set(0,.8,0);TG.add(HD);B(Cy(.075,.09,.2,12),Sk,0,0,0,HD);
 const hr=.225,hy=.2;B(GX.ashape(new THREE.SphereGeometry(hr,44,32),hr).scale(1,1.08,1.02),Sk,0,hy,0,HD);
 B(GX.ashape(new THREE.SphereGeometry(hr*1.008,36,26,Math.PI/2-.5,1,1.07,1),hr).scale(1,1.08,1.02),M(0xffffff,{map:GX.faceAc({skin:0xf7dccf,hi:'#fde8de',ex:50}),roughness:.6,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),0,hy,0,HD);
 B(S(.032,.85,1.5,1.2),Sk,0,hy-.03,hr*1.02,HD);
 // موی نقره‌ای-یاسی: کلاهک، حجم پشت سر، چتری و رشته‌های کنار صورت
 B(new THREE.SphereGeometry(hr*1.09,28,18,0,TAU,0,1.12).scale(1,1.08,1.05),Hr,0,hy+.01,-.012,HD);
 B(S(.235,1,.95,.9),Hr3,0,hy-.04,-.08,HD);B(S(.2,1,.7,.7),Hr,0,hy+.1,-.04,HD);
 [[-.14,.125,0],[-.07,.1,.02],[.0,.07,.03],[.07,.09,.02],[.15,.12,0],[.19,.06,-.01]].forEach((q,i)=>{const x0=q[0],ln=q[1];
  GX.strand(HD,i%2?Hr2:Hr,[[x0*.8,hy+.19,.1],[x0*1.15,hy+.13,.2],[x0*1.35+(i<2?-.02:.03),hy-ln*.3,.236],[x0*1.4+(i<2?-.03:.04),hy-ln-.02,.222]],.05,.012,12)});
 GX.strand(HD,Hr2,[[.0,hy+.2,.02],[.02,hy+.31,.03],[.07,hy+.38,.06]],.016,.006,8);
 // روبان آبی با گره و دو دُم
 const RBG=new THREE.Group();RBG.position.set(.14,hy+.2,-.04);HD.add(RBG);
 B(Cn(.05,.13,4),Rb,.07,.01,0,RBG).rotation.z=-1.45;B(Cn(.05,.13,4),Rb,-.07,.01,0,RBG).rotation.z=1.45;B(S(.04,1,1,1),Rb,0,.01,0,RBG);B(Oc(.025,1,1.2,.5),Au,0,.01,.04,RBG);
 const RT=[0,1].map(i=>{const pg=new THREE.Group();RBG.add(pg);GX.strand(pg,Rb,[[0,0,0],[.04+i*.03,-.22,-.04],[.07+i*.05,-.5-i*.1,-.08],[.07+i*.07,-.8-i*.15,-.05]],.035,.012,14);return pg});
 // رشته‌های بلند پشت سر (هر رشته دو مفصل: ریشه و میانه)
 const HG=[];
 const strand2=(Q,m,root,up,lo,r0,r1,r2,ph,k)=>{const pg=new THREE.Group();pg.position.set(root[0],root[1],root[2]);Q.add(pg);
  GX.strand(pg,m,up,r0,r1,10);const mid=up[up.length-1],pg2=new THREE.Group();pg2.position.set(mid[0],mid[1],mid[2]);pg.add(pg2);
  GX.strand(pg2,m,lo,r1,r2,12);HG.push({pg,pg2,ph,k:k||1});return pg};
 for(let i=0;i<16;i++){const a=(i-7.5)/7.5*1.25,ph=i*1.37,L=.85+.3*((i*.618)%1),ox=Math.sin(a),
   root=[ox*.16,hy-.01,-Math.cos(a)*.15-.03],m=i%3===0?Hr2:i%3===1?Hr:Hr3;
  strand2(HD,m,root,[[0,0,0],[ox*.06,-.2*L,-.07],[ox*.12+Math.sin(ph)*.03,-.42*L,-.13]],
   [[0,0,0],[ox*.07+Math.sin(ph*1.3)*.06,-.38*L,-.04],[ox*.12+Math.sin(ph*2)*.1,-.78*L,-.03],[ox*.1+Math.sin(ph*2.7)*.13,-1.1*L,.0]],.09,.055,.016,ph,1)}
 // رشته‌های پرنده و موهای رها
 for(let i=0;i<6;i++){const s=i%2?1:-1,ph=i*2.1+.5;
  strand2(HD,Hr2,[s*(.14+i*.012),hy+.02-i*.02,-.1],[[0,0,0],[s*.1,-.1,-.1],[s*.18,-.25,-.14]],[[0,0,0],[s*.1,-.2,-.06],[s*.12+Math.sin(ph)*.1,-.45,.0]],.022,.014,.006,ph,2.4)}
 // دو رشتهٔ بلند کنار صورت روی سینه
 [-1,1].forEach((s,i)=>{strand2(HD,i?Hr:Hr2,[s*.2,hy-.01,.06],[[0,0,0],[s*.05,-.2,.06],[s*.08,-.42,.13]],[[0,0,0],[s*.03,-.2,.08],[s*.03,-.42,.05]],.05,.035,.012,i*2.3+.7,.7);
  strand2(HD,Hr,[s*.17,hy+.03,.1],[[0,0,0],[s*.04,-.18,.07],[s*.06,-.36,.13]],[[0,0,0],[s*.02,-.16,.06],[s*.01,-.32,.02]],.04,.028,.01,i*1.9+2,.7)});
 // ---- بازوها ----
 const mkArm=s=>{const A=new THREE.Group();A.position.set(s*.4,.62,0);TG.add(A);
  GX.strand(A,s<0?Bc:Bk,[[0,0,0],[0,-.2,0],[0,-.4,0]],.085,.075,8);
  if(s>0){B(Cy(.1,.092,.1,16),Wc,0,-.1,0,A);B(Tr(.097,.012,22),Au,0,-.05,0,A).rotation.x=Math.PI/2}
  const E=new THREE.Group();E.position.set(0,-.4,0);A.add(E);B(S(.085,1,1,1),s<0?Wm:Bk,0,0,0,E);
  GX.strand(E,Bk,[[0,0,0],[0,-.2,0],[0,-.42,0]],.075,.065,8);
  B(Cy(.09,.1,.3,16),Wm,0,-.2,0,E);B(Tr(.094,.013,22),Au,0,-.08,0,E).rotation.x=Math.PI/2;B(Tr(.102,.013,22),Au,0,-.33,0,E).rotation.x=Math.PI/2;
  B(Bx(.045,.2,.016),Au,0,-.2,.095,E);B(Oc(.05,1,1.3,.5),Au,0,-.04,.085,E);
  B(S(.075,1,1.1,1),Bk,0,-.5,0,E);B(S(.03,1,1.4,.8),Bk,s*.05,-.46,.045,E);
  if(s<0){const rb=new THREE.Group();rb.position.set(0,-.33,0);E.add(rb);B(Tr(.108,.015,18),Rb,0,0,0,rb).rotation.x=Math.PI/2;
   [0,1].forEach(q=>GX.strand(rb,Rb,[[.05,0,.07],[.1+q*.04,-.12,.1],[.12+q*.06,-.26-q*.06,.08]],.026,.01,8))}
  return{A,E}};
 const RA=mkArm(-1),LA=mkArm(1);
 // سردوشی بزرگ سفید-طلایی روی شانهٔ شمشیر؛ سردوشی کوچک مشکی روی شانهٔ دیگر
 B(S(.2,1.1,.8,1.05),Wm,-.4,.63,0,TG);B(Tr(.19,.016,26),Au,-.4,.56,0,TG).rotation.x=Math.PI/2;B(S(.17,1,.5,.95),Wm,-.41,.52,0,TG);B(Tr(.165,.012,26),Au,-.41,.48,0,TG).rotation.x=Math.PI/2;
 for(let i=0;i<3;i++)B(Cn(.022,.13,4),Au,-.4-i*.03,.8-i*.02,(i-1)*.08,TG).rotation.z=.3+i*.15;B(Oc(.03,1,1.3,.5),Gm,-.4,.72,.12,TG);
 B(S(.13,1,.75,1),Bk,.4,.62,0,TG);B(Tr(.12,.011,22),Au,.4,.57,0,TG).rotation.x=Math.PI/2;
 // ---- شمشیر بلند: تیغهٔ نقره‌ای با شیار آبی و گاردِ طلایی منحنی ----
 const bs=new THREE.Shape();bs.moveTo(-.05,-.18);bs.lineTo(.05,-.18);bs.lineTo(.058,-.4);bs.lineTo(.058,-.96);bs.lineTo(0,-1.1);bs.lineTo(-.058,-.96);bs.lineTo(-.058,-.4);bs.lineTo(-.05,-.18);
 const bi=new THREE.Shape();bi.moveTo(-.014,-.24);bi.lineTo(.014,-.24);bi.lineTo(.014,-.94);bi.lineTo(0,-1.0);bi.lineTo(-.014,-.94);bi.lineTo(-.014,-.24);
 const bgO=new THREE.ExtrudeGeometry(bs,{depth:.03,bevelEnabled:false});bgO.translate(0,0,-.015);const bgI=new THREE.ExtrudeGeometry(bi,{depth:.04,bevelEnabled:false});bgI.translate(0,0,-.02);
 const SWD=new THREE.Group();SWD.position.set(0,-.5,0);RA.E.add(SWD);
 B(Cy(.028,.028,.3,10),Bk,0,.02,0,SWD);for(let i=0;i<4;i++)B(Tr(.03,.006,10),Au,0,-.06+i*.07,0,SWD).rotation.x=Math.PI/2;
 B(S(.05,1,1,1),Au,0,.2,0,SWD);B(S(.026,1,1,1),Gm,0,.2,.045,SWD);
 B(Bx(.36,.045,.055),Au,0,-.15,0,SWD);
 [-1,1].forEach(q=>{B(Bx(.1,.04,.05),Au,q*.2,-.13,0,SWD).rotation.z=q*.45;B(Cn(.028,.12,4),Au,q*.27,-.07,0,SWD).rotation.z=-q*.8;B(S(.03,1,1,1),Au,q*.2,-.2,0,SWD);B(Tr(.04,.01,12,Math.PI*1.4),Au,q*.17,-.21,0,SWD).rotation.z=q*1.2});
 B(Oc(.05,1,1.2,.8),Au,0,-.15,.035,SWD);B(Oc(.03,1,1.3,.7),Gm,0,-.15,.065,SWD);
 B(bgO,Sv,0,0,0,SWD);B(bgI,Nb,0,0,0,SWD);B(Bx(.024,.12,.06),Au,0,-.22,0,SWD);
 // ---- رد برش نورانی (هلال) ----
 const trG=(()=>{const N=22,pos=[],idx=[],p0=[-.7,1.05],p1=[.2,1.15],p2=[1.2,-.5];for(let i=0;i<=N;i++){const s=i/N,x=(1-s)*(1-s)*p0[0]+2*(1-s)*s*p1[0]+s*s*p2[0],y=(1-s)*(1-s)*p0[1]+2*(1-s)*s*p1[1]+s*s*p2[1],
  tx=2*(1-s)*(p1[0]-p0[0])+2*s*(p2[0]-p1[0]),ty=2*(1-s)*(p1[1]-p0[1])+2*s*(p2[1]-p1[1]),l=Math.hypot(tx,ty)||1,nx=-ty/l,ny=tx/l,w=.2*Math.pow(Math.sin(Math.PI*s),.7);
  pos.push(x+nx*w,y+ny*w,0,x-nx*w,y-ny*w,0);if(i<N)idx.push(2*i,2*i+1,2*i+2,2*i+1,2*i+3,2*i+2)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);return g})();
 const TRM=new THREE.MeshBasicMaterial({color:0xdfe6ff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}),
  pvT=new THREE.Group(),TRL=new THREE.Mesh(trG,TRM);pvT.position.set(-.4,.62,0);pvT.rotation.z=-.55;TG.add(pvT);TRL.rotation.y=-Math.PI/2;TRL.visible=false;pvT.add(TRL);ghost(TRL);
 // ---- انیمیشن ----
 // ژست بازو: [شانه x، بازشدگی به بیرون، آرنج، شیب تیغه (مطلق)، چرخش تیغه به بیرون]
 const IDLE=[-.25,.22,-.6,-.15,.42],WU=[-2.5,.55,-.9,-3.3,.3],SK=[-1.4,-.55,-.4,-1.0,-.3];
 // ژست بدن: [چرخش تنه، پیشروی، خم]
 const BI=[0,0,0],BW=[.55,-.07,-.1],BS=[-.5,.3,.2];
 const TIM={n:{wu:.2,st:.14,ho:.04,rc:.42},q:{wu:.12,st:.1,ho:0,rc:.24}},TT=sl=>TIM[sl.q?'q':'n'];
 const SL=[],SW={x:0,vx:0,z:0,vz:0,px:0,py:0,pz:0,lt:-1,ok:0},ST={h0:-1e9,d0:-1e9,dead:0,tuck:0};let dmats=null;
 const armPose=(sl,e)=>{const T=TT(sl),a=ez(e/T.wu),b=ez((e-T.wu)/T.st),c=ez((e-T.wu-T.st-T.ho)/T.rc);return mix(mix(mix(IDLE,WU,a),SK,b),IDLE,c)};
 const bodyPose=(sl,e)=>{const T=TT(sl),a=ez(e/T.wu),b=ez((e-T.wu)/T.st),c=ez((e-T.wu-T.st-T.ho)/T.rc);return mix(mix(mix(BI,BW,a),BS,b),BI,c)};
 GX.anim(G,t=>{const now=performance.now(),dt=SW.lt<0?.016:Math.min(.05,Math.max(.001,t-SW.lt));SW.lt=t;
  const br=Math.sin(t*1.5),el=G.matrixWorld.elements;
  for(let i=SL.length-1;i>=0;i--){const T=TT(SL[i]);if((now-SL[i].t0)/1000>T.wu+T.st+T.ho+T.rc)SL.splice(i,1)}
  let newest=null;SL.forEach(sl=>{const e=(now-sl.t0)/1000;if(e>=0&&(!newest||sl.t0>newest.sl.t0))newest={sl,e}});
  const bp=newest?bodyPose(newest.sl,newest.e):BI;
  let lx=0,lz=0;if(SW.ok){const vx=(el[12]-SW.px)/dt,vy=(el[13]-SW.py)/dt,vz=(el[14]-SW.pz)/dt,ax=el[0]*el[0]+el[1]*el[1]+el[2]*el[2]||1,az=el[8]*el[8]+el[9]*el[9]+el[10]*el[10]||1;lx=(vx*el[0]+vy*el[1]+vz*el[2])/ax;lz=(vx*el[8]+vy*el[9]+vz*el[10])/az}
  SW.px=el[12];SW.py=el[13];SW.pz=el[14];SW.ok=1;
  const eh=(now-ST.h0)/1000,hur=!ST.dead&&eh>=0&&eh<.6?Math.sin(Math.min(1,eh/.16)*Math.PI/2)*(1-ez((eh-.16)/.44)):0,tk=ST.tuck;
  const tx=cl(-lx*.1-bp[0]*.25,.45),tz=cl(-lz*.1-Math.max(0,bp[1])*.9-hur*.5,.6);
  SW.vx+=((tx-SW.x)*45-SW.vx*4.2)*dt;SW.x+=SW.vx*dt;SW.vz+=((tz-SW.z)*45-SW.vz*4.2)*dt;SW.z+=SW.vz*dt;
  G.position.set(0,.01*Math.sin(t*2)-.05*Math.max(0,bp[1]),bp[1]-hur*.14);
  legs.forEach((o,i)=>{o.L.rotation.x=(i?bp[1]*.6:-bp[1]*.9)-tk*(i?.9:1.1);o.K.rotation.x=tk*(i?1.5:1.7)+.02});
  TG.rotation.set(bp[2]-hur*.4+tk*.5+.008*br,bp[0],.01*Math.sin(t*.6)+hur*.08);TG.scale.y=1+.006*br;
  HD.rotation.set(-bp[2]*.4+hur*.55+.02*Math.sin(t*.5),-bp[0]*.5+.06*Math.sin(t*.37),.02*Math.sin(t*.43+2));
  const p=newest?armPose(newest.sl,newest.e):IDLE;
  RA.A.rotation.set(p[0]-hur*.3-tk*.6+.015*Math.sin(t*.9),0,-p[1]);RA.E.rotation.set(p[2],0,0);SWD.rotation.set(p[3]-(p[0]+p[2]),0,-p[4]);
  LA.A.rotation.set(-.12-bp[0]*.5-hur*.2-tk*.5+.015*Math.sin(t*.9+1),0,.2+bp[0]*.1);LA.E.rotation.set(-.4-tk*.6,0,0);
  // موها، روبان، تابارد و شنل
  HG.forEach(o=>{const w=Math.sin(t*1.3+o.ph);o.pg.rotation.set((.04*w+SW.z*.3-bp[2]*.25-hur*.3)*o.k,0,(.035*Math.sin(t*1.1+o.ph*.7)+SW.x*.5+bp[0]*.2)*o.k);
   o.pg2.rotation.set((.07*Math.sin(t*1.7+o.ph+1)+SW.z*.4)*o.k,0,(.06*Math.sin(t*1.4+o.ph*.6)+SW.x*.5)*o.k)});
  RBG.rotation.set(.03*Math.sin(t*1.2),0,.04*Math.sin(t*.9));RT.forEach((pg,i)=>pg.rotation.set(.12*Math.sin(t*2.1+i*1.3)+SW.z*.6,0,.1*Math.sin(t*1.8+i)+SW.x*.8));
  cloths.forEach(c=>clothAnim(c,t,SW.x,SW.z));
  // رد برش
  let op=0;if(newest&&!ST.dead){const T=TT(newest.sl),k=(newest.e-T.wu)/(T.st+.14);if(k>0&&k<1){op=Math.pow(Math.sin(k*Math.PI),.6)*(newest.sl.q?.7:.85);TRL.visible=true;TRM.opacity=op;TRL.scale.setScalar((newest.sl.q?.85:1)*(.85+.25*k))}}
  if(!op){TRL.visible=false;TRM.opacity=0}
  // مرگ: ضربهٔ آخر ← زانو زدن ← افتادن به عقب ← محو شدن
  if(ST.dead){const e=(now-ST.d0)/1000,a=ez(e/.3),b=ez((e-.25)/.55),c=ez((e-.75)/.65);
   G.position.set(0,-.62*b-.03*c,-.2*a-.3*c);
   legs.forEach((o,i)=>{o.L.rotation.x=-1.0*b*(i?1:.9);o.K.rotation.x=2.4*b});
   TG.rotation.set(-.4*a+.45*b-1.35*c,0,.14*a*(1-c));HD.rotation.set(.45*a-.3*b+.5*c,0,.18*a*(1-c));
   RA.A.rotation.set(-.3*a+.2*b+.3*c,0,-(.5+.4*b+.5*c));RA.E.rotation.set(-.3-.3*b,0,0);SWD.rotation.set(.5*b,0,-(.5+.7*c));
   LA.A.rotation.set(-.4*a+.2*c,0,.5+.7*c);LA.E.rotation.set(-.3*b,0,0);
   if(e>1.35&&dmats){const o=Math.max(0,1-ez((e-1.35)/.9));dmats.forEach(m=>{m.transparent=true;m.opacity=o})}}});
 // slash(q,تأخیر): ضربهٔ شمشیر؛ q=ضربهٔ سریع (قابلیت پرشی). مقدار برگشتی = میلی‌ثانیه تا لحظهٔ برخورد
 G.userData.acro={slash:(q,delay)=>{const d=delay||0,T=TIM[q?'q':'n'];if(!ST.dead)SL.push({t0:performance.now()+d,q:!!q});return d+(T.wu+T.st*.5)*1000},
  hurt:()=>{if(!ST.dead)ST.h0=performance.now()},
  die:()=>{if(ST.dead)return;ST.dead=1;ST.d0=performance.now();dmats=new Set();G.traverse(o=>{if(o.material)[].concat(o.material).forEach(m=>dmats.add(m))})},
  flip:(a,k)=>{PV.rotation.x=a;ST.tuck=Math.sin(Math.min(1,Math.max(0,k||0))*Math.PI)}};
  // ---- جزئیات افزوده (نسخهٔ پرجزئیات): تکه‌های ریز با هم ادغام می‌شوند تا فشار گرافیکی کم بماند ----
  try{(()=>{
   const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_p=new THREE.Vector3(),_o=new THREE.Vector3(1,1,1),
   D=(g,x,y,z,rx,ry,rz)=>[g,x,y,z,rx,ry,rz],Sm=r=>new THREE.SphereGeometry(r,6,5),
   MG=(Q,m,L)=>{if(!L.length)return null;
    const gs=L.map(it=>{let g=it[0];g=g.index?g.toNonIndexed():g;_e.set(it[4]||0,it[5]||0,it[6]||0);_q.setFromEuler(_e);_m.compose(_p.set(it[1]||0,it[2]||0,it[3]||0),_q,_o);g.applyMatrix4(_m);return g});
    let n=0;gs.forEach(g=>n+=g.attributes.position.count);
    const P3=new Float32Array(n*3),N3=new Float32Array(n*3),U2=new Float32Array(n*2);let k=0;
    gs.forEach(g=>{const c=g.attributes.position.count;P3.set(g.attributes.position.array,k*3);N3.set(g.attributes.normal.array,k*3);if(g.attributes.uv)U2.set(g.attributes.uv.array,k*2);k+=c;g.dispose()});
    const mg=new THREE.BufferGeometry();mg.setAttribute('position',new THREE.BufferAttribute(P3,3));mg.setAttribute('normal',new THREE.BufferAttribute(N3,3));mg.setAttribute('uv',new THREE.BufferAttribute(U2,2));
    const mesh=new THREE.Mesh(mg,m);Q.add(mesh);return mesh};
   const sn=Math.sin,cs=Math.cos,PI=Math.PI;
   // --- بدنه: گل‌میخ‌های لبهٔ دامن، الماس‌های آویز، میخ کمربند، یقهٔ خاردار، منجوق‌های بند کرست ---
   const aT=[],gT=[],kT=[],wT=[];
   for(let i=0;i<24;i++){const a=i/24*TAU;aT.push(D(Oc(.017,1,1.5,.6),sn(a)*.364,-.27,cs(a)*.364,0,a,0))}
   for(let i=0;i<12;i++){const a=(i+.5)/12*TAU;gT.push(D(Oc(.013,1,2,.6),sn(a)*.36,-.31,cs(a)*.36,0,a,0))}
   for(let i=0;i<20;i++){const a=i/20*TAU;if(cs(a)>.78)continue;aT.push(D(Sm(.012),sn(a)*.236,.04,cs(a)*.236))}
   kT.push(D(Tr(.222,.012,28),0,.0,0,PI/2));
   for(let i=0;i<10;i++){const a=i/10*TAU,dx=sn(a),dz=cs(a);aT.push(D(Cn(.016,.07,4),dx*.125,.83,dz*.125,dz*.4,0,-dx*.4))}
   aT.push(D(Tr(.13,.01,22),0,.8,0,PI/2));
   [-1,1].forEach(s=>{for(let k=0;k<5;k++){const dy=.06+k*.05-.21;aT.push(D(Sm(.008),s*.135-dy*sn(s*.1),.21+dy,.137))}});
   // سردوشی سمت شمشیر: میخ‌ها، لایهٔ زرهی و جواهر
   for(let i=0;i<12;i++){const a=i/12*TAU;aT.push(D(Sm(.014),-.4+sn(a)*.19,.56,cs(a)*.19))}
   aT.push(D(Tr(.15,.01,24),-.41,.44,0,PI/2));wT.push(D(S(.15,1,.35,.9),-.41,.46,0));gT.push(D(Oc(.022,1,1.4,.6),-.4,.58,.208));
   // سردوشی مشکی: منگولهٔ طلایی
   for(let i=0;i<9;i++){const a=i/9*TAU,x=.4+sn(a)*.125,z=cs(a)*.125;aT.push(D(Cy(.004,.004,.09,5),x,.505,z),D(Oc(.009,1,1.5,1),x,.455,z))}
   MG(TG,Au,aT);MG(TG,Gm,gT);MG(TG,Bk,kT);MG(TG,Wm,wT);
   // --- سر: گوشواره‌های آویز و تاج ظریف پیشانی ---
   const aH=[],gH=[];
   [-1,1].forEach(s=>{aH.push(D(Sm(.014),s*.222,hy-.06,.03),D(Cy(.003,.003,.05,4),s*.222,hy-.095,.03));gH.push(D(Oc(.014,1,1.7,.6),s*.222,hy-.14,.03))});
   for(let i=0;i<9;i++){const a=(i-4)/4*.95;aH.push(D(Sm(.009),sn(a)*.243,hy+.105+.03*(1-Math.abs(a)/.95),cs(a)*.243))}
   gH.push(D(Oc(.02,1,1.5,.6),0,hy+.135,.252),D(Oc(.011,1,1.4,.6),sn(.45)*.243,hy+.122,cs(.45)*.243),D(Oc(.011,1,1.4,.6),-sn(.45)*.243,hy+.122,cs(.45)*.243));
   MG(HD,Au,aH);MG(HD,Gm,gH);
   // --- پاها: بند و سگک چکمه، میخ‌ها، نوک طلایی و گارتر ران ---
   legs.forEach(o=>{const aK=[],kK=[],aL=[],kL=[],gL=[];
    [-.16,-.22].forEach((y,j)=>{const r=j?.123:.128;kK.push(D(Tr(r,.011,22),0,y,0,PI/2));aK.push(D(Bx(.032,.036,.014),0,y,r+.008),D(Sm(.008),0,y,r+.016))});
    for(let a2=0;a2<10;a2++){const a=a2/10*TAU;aK.push(D(Sm(.009),sn(a)*.139,-.3,cs(a)*.139))}
    aK.push(D(S(.045,1,.7,1),0,-.405,.23));
    [-1,1].forEach(s=>[-.08,.0,.08,.16,.24].forEach(z=>aK.push(D(Sm(.009),s*.101,-.44,z))));
    kL.push(D(Tr(.108,.013,20),0,-.13,0,PI/2));aL.push(D(Bx(.035,.035,.012),0,-.13,.115));gL.push(D(Oc(.012,1,1.3,.6),0,-.13,.124));
    MG(o.K,Au,aK);MG(o.K,Bk,kK);MG(o.L,Au,aL);MG(o.L,Bk,kL);MG(o.L,Gm,gL)});
   // --- بازوها: میخ و برجستگی ساق‌بند، بازوبند طلایی با جواهر ---
   [RA,LA].forEach(ar=>{const aE=[],aA=[],gA=[];
    for(let k=0;k<8;k++){const a=k/8*TAU;aE.push(D(Sm(.009),sn(a)*.1,-.08,cs(a)*.1),D(Sm(.009),sn(a)*.112,-.33,cs(a)*.112))}
    [-2,-1,1,2].forEach(k=>{const a=k*.42;aE.push(D(Bx(.01,.22,.009),sn(a)*.097,-.2,cs(a)*.097,0,a,0))});
    aE.push(D(Tr(.075,.012,18),0,-.4,0,PI/2));
    aA.push(D(Tr(.082,.012,20),0,-.28,0,PI/2),D(Tr(.078,.009,20),0,-.33,0,PI/2));gA.push(D(Oc(.02,1,1.4,.6),0,-.3,.09));
    MG(ar.E,Au,aE);MG(ar.A,Au,aA);MG(ar.A,Gm,gA)});
   // --- شمشیر: خط‌های حکاکی‌شده، طلاکاری لبه، منگولهٔ سرشمشیر و جواهر گارد ---
   const aW=[],gW=[],kW=[];
   for(let k=0;k<7;k++){const y=-.32-k*.095,w=.012+.006*(k%3);[-1,1].forEach(q=>aW.push(D(Bx(w,.022,.004),0,y,q*.0215)))}
   [-1,1].forEach(q=>{aW.push(D(Bx(.004,.55,.034),q*.045,-.675,0));gW.push(D(Oc(.014,1,1.2,.8),q*.2,-.2,.03))});
   aW.push(D(Bx(.13,.02,.05),0,-.19,0),D(Oc(.014,1,1.8,.7),.05,-.17,-.1));
   [-.025,.045,.115].forEach(y=>kW.push(D(Tr(.032,.007,12),0,y,0,PI/2)));
   MG(SWD,Au,aW);MG(SWD,Gm,gW);MG(SWD,Bk,kW);
   GX.strand(SWD,Rb,[[0,.22,-.05],[.025,.12,-.09],[.045,.0,-.1],[.05,-.14,-.09]],.018,.008,8);
  })()}catch(err){console.error('acro detail',err)}
 return G}
/* مدل ساده‌ی پشتیبان (فقط اگر ساخت مدل اصلی خطا بدهد) */
function acSafe(M){const G=new THREE.Group(),a=(g,c,y,z)=>{const m=new THREE.Mesh(g,M(c,{roughness:.5}));m.position.set(0,y,z||0);G.add(m)};
 a(new THREE.CylinderGeometry(.22,.3,1,16),0xf3f0f8,.8);a(new THREE.SphereGeometry(.22,18,14),0xf7dccf,1.55);a(new THREE.SphereGeometry(.26,18,14),0xcfc8ef,1.6,-.08);return G}
FIG.acro=(M,t)=>{try{return gxAcro(M,t)}catch(e){console.error('acro skin',e);return acSafe(M)}};
function acFig(g){const i=g&&g.children[0];return i&&i.children.find(o=>o.userData&&o.userData.acro)}
SFX.acDie=()=>{os('sine',660,220,.9,.3,0);os('triangle',880,330,1.1,.2,.05);nz(.5,'lowpass',2200,300,1,.5,0);os('sine',200,70,.8,.5,.3)};
/* ضربه: شمشیر آکروبات با رد نورانی، و واکنش آسیب‌دیدن */
(function(){const _hf=hitFX;hitFX=function(a,t,d){
 try{
  if(a.k==='acro'&&a!==t){const ga=unitG.get(a),gt=unitG.get(t),f=acFig(ga);
   if(f&&gt){const own=!!CX&&CX.a===a,ab=own&&CX.ab,i=own?(CX.ax|0):0;if(own)CX.ax=i+1;
    if(!ab){const dx=gt.position.x-ga.position.x,dz=gt.position.z-ga.position.z;if(dx||dz){ga.userData.fy=Math.atan2(dx,dz);ga.userData.hf=1;ga.userData.ft=2}}
    const ms=f.userData.acro.slash(ab,ab?i*210:0),P0=gt.position.clone();
    setTimeout(()=>{try{const p=P0.clone().add(new THREE.Vector3(0,.95,0));
     burst(p,ab?12:20,0xf4f1ff,{sp:4.2,size:.14,life:.28,g:3,y:0,r:.1,h:.1});burst(p,ab?9:14,0xa8b4ff,{sp:3.2,size:.2,life:.4,g:5,y:0,r:.12,h:.1});
     if(d>0)ring(new THREE.Vector3(P0.x,0,P0.z),0xcfd6ff,ab?1.5:1.3,.35,.15);shk=Math.max(shk,ab?.35:.3)}catch(e){}},ms)}}
  if(t.k==='acro'&&t.hp>0&&a!==t){const f=acFig(unitG.get(t));
   if(f){const q=t.vq&&t.vq.length?t.vq[t.vq.length-1].at-performance.now():0;setTimeout(()=>{try{f.userData.acro.hurt()}catch(e){}},Math.max(0,q))}}
 }catch(e){console.error('acroFX',e)}
 return _hf(a,t,d)}})();
/* مرگ: انیمیشن افتادن و محو شدن، سپس حذف مدل */
function acDie(u,g){const d=g.userData;d.dgDie=1;unitG.delete(u);d.pick.forEach(m=>{const i=pickables.indexOf(m);if(i>=0)pickables.splice(i,1)});
 if(d.last>0)popup('-'+PX(Math.round(d.last)),g.position,'#ff5a4d');
 try{d.lb.sp.visible=false;d.shield.visible=false;d.cage.visible=false;d.hack.visible=false;if(d.aura)d.aura.visible=false;if(d.bm)d.bm.forEach(b=>b.visible=false)}catch(e){}
 const f=acFig(g),m=f&&f.userData.acro,P0=g.position.clone(),T=(fn,ms)=>setTimeout(()=>{try{fn()}catch(e){}},ms);
 if(m)m.die();try{SFX.acDie()}catch(e){}
 if(FXI){T(()=>{shk=Math.max(shk,.4)},80);
  [0,1,2,3,4,5].forEach(i=>T(()=>{burst(P0.clone().add(new THREE.Vector3((rd()-.5)*.7,.6+rd()*1.4,(rd()-.5)*.7)),8,i%2?0xcfd6ff:0xf4f1ff,{sp:1.6,vy:1.2,g:-.4,size:.3,life:.9,y:0,r:.3,up:1})},500+i*140));
  T(()=>{const Z=new THREE.Vector3(P0.x,0,P0.z);ring(Z,0xcfd6ff,2.4,.7,.14);burst(P0,26,0xdfe6ff,{sp:2.6,vy:2.6,g:-.6,size:.35,life:1,y:.4,r:.5})},1500)}
 setTimeout(()=>{try{scene.remove(g);g.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){if(o.material.map)o.material.map.dispose();o.material.dispose()}})}catch(e){}},2500)}
(function(){const _s=syncUnits;syncUnits=function(){
 try{for(const [u,g] of [...unitG]){if(!U.includes(u)&&u.hp<=0&&u.k==='acro'&&!g.userData.dgDie&&(phase!=='play'||(vhp(u),!u.vq)))acDie(u,g)}}catch(e){console.error('acDie',e)}
 return _s()}})();

/* ===== اسکین رافائل پیر (raf) — مطابق تصویر مرجع =====
   جادوگر پیر با شنل ژندهٔ سفید-خاکستری و شنل‌پوش، کلاهِ شنل، ریش و موی بلند سفید، تونیک قهوه‌ای با کمربند طناب‌دار و کیسه،
   چکمهٔ بنددار و عصای چوبی گره‌دار با کریستال نارنجی. انیمیشن‌ها: بیکار (نفس، ریش و موی بلند، شنل، کریستال)
   | حمله (عقب بردن عصا ← ضربه به جلو با شعاع نور) | آسیب‌دیدن | پرواز (دم‌کشیدن شنل و ریش) | مرگ (زانو زدن، افتادن، خاموشی کریستال). */
GX.rfRobe=()=>GX._rfR||(GX._rfR=GX.tex(256,256,(x,w,h)=>{
 const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#dbd3c6');g.addColorStop(.7,'#c6baa9');g.addColorStop(1,'#8e836f');x.fillStyle=g;x.fillRect(0,0,w,h);
 for(let i=0;i<90;i++){x.fillStyle='rgba('+(110+Math.random()*40|0)+','+(95+Math.random()*30|0)+','+(80+Math.random()*30|0)+','+(.05+Math.random()*.12)+')';x.beginPath();x.ellipse(Math.random()*w,Math.random()*h,6+Math.random()*22,(6+Math.random()*22)*(.5+Math.random()*.8),Math.random()*3,0,7);x.fill()}
 x.fillStyle='rgba(150,120,85,.38)';for(let i=0;i<420;i++){const X=Math.random()*w,Y=Math.random()*h;x.beginPath();x.moveTo(X,Y-2.5);x.lineTo(X+1.6,Y);x.lineTo(X,Y+2.5);x.lineTo(X-1.6,Y);x.fill()}
 for(let i=0;i<7;i++){x.fillStyle='#2e2019';x.beginPath();const cx=Math.random()*w,cy=h*(.25+Math.random()*.7);x.moveTo(cx,cy);for(let k=1;k<7;k++){const a=k/7*6.283,r=(k%2?4:12)*(.7+Math.random()*.7);x.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r*1.4)}x.closePath();x.fill()}
},1));
GX.rfTun=()=>GX._rfT||(GX._rfT=GX.tex(128,128,(x,w,h)=>{
 const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#46362e');g.addColorStop(1,'#2a201b');x.fillStyle=g;x.fillRect(0,0,w,h);
 for(let i=0;i<14;i++){x.fillStyle='rgba('+(70+Math.random()*30|0)+','+(52+Math.random()*20|0)+',40,'+(.2+Math.random()*.3)+')';x.fillRect(Math.random()*w,Math.random()*h,8+Math.random()*26,6+Math.random()*20)}
 x.strokeStyle='rgba(150,115,80,.35)';x.lineWidth=1;for(let i=0;i<60;i++){const X=Math.random()*w,Y=Math.random()*h;x.beginPath();x.moveTo(X,Y);x.lineTo(X+4,Y+2);x.stroke()}
 for(let i=0;i<5;i++){x.fillStyle='#150f0c';x.beginPath();const cx=Math.random()*w,cy=Math.random()*h;x.moveTo(cx,cy);for(let k=1;k<6;k++){const a=k/6*6.283,r=(k%2?3:9)*(.7+Math.random()*.6);x.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r*1.3)}x.closePath();x.fill()}
},1));
GX.rfBark=()=>GX._rfB||(GX._rfB=GX.tex(64,256,(x,w,h)=>{
 x.fillStyle='#4b3022';x.fillRect(0,0,w,h);
 for(let i=0;i<70;i++){x.strokeStyle=i%2?'rgba(25,14,8,.35)':'rgba(130,90,58,.3)';x.lineWidth=1+Math.random()*2.5;const X=Math.random()*w;x.beginPath();x.moveTo(X,0);x.bezierCurveTo(X+6,h*.3,X-6,h*.6,X+Math.random()*8-4,h);x.stroke()}
 for(let i=0;i<9;i++){x.fillStyle='rgba(20,10,5,.5)';x.beginPath();x.ellipse(Math.random()*w,Math.random()*h,3+Math.random()*4,6+Math.random()*8,0,0,7);x.fill()}
},1));
GX.faceRf=()=>GX._rfF||(GX._rfF=GX.tex(256,256,(x,w,h)=>{
 const g=x.createRadialGradient(w/2,h*.55,8,w/2,h*.5,w*.62);g.addColorStop(0,'#e3bfa6');g.addColorStop(.7,'#cfa387');g.addColorStop(1,'#bd8f77');x.fillStyle=g;x.fillRect(0,0,w,h);x.lineCap='round';x.lineJoin='round';
 const sh=x.createLinearGradient(0,0,0,h*.55);sh.addColorStop(0,'rgba(25,18,20,.6)');sh.addColorStop(1,'rgba(25,18,20,0)');x.fillStyle=sh;x.fillRect(0,0,w,h*.55);
 x.strokeStyle='rgba(110,70,60,.35)';x.lineWidth=2;
 for(let i=0;i<3;i++){x.beginPath();x.moveTo(w*.3,h*(.14+i*.045));x.quadraticCurveTo(w/2,h*(.115+i*.045),w*.7,h*(.14+i*.045));x.stroke()}
 [-1,1].forEach(s=>{x.beginPath();x.moveTo(w/2+s*22,h*.62);x.quadraticCurveTo(w/2+s*40,h*.72,w/2+s*36,h*.84);x.stroke();
  x.beginPath();x.moveTo(w/2+s*72,h*.5);x.lineTo(w/2+s*90,h*.47);x.moveTo(w/2+s*72,h*.53);x.lineTo(w/2+s*90,h*.56);x.stroke()});
 [-1,1].forEach(s=>{x.save();x.translate(w/2+s*48,h*.5);x.scale(s,1);
  const eye=()=>{x.beginPath();x.moveTo(-22,3);x.bezierCurveTo(-12,-9,12,-10,24,2);x.bezierCurveTo(12,9,-10,10,-22,3);x.closePath()};
  eye();x.fillStyle='#e6dfd6';x.fill();x.save();eye();x.clip();
  const ir=x.createRadialGradient(2,2,1,2,2,13);ir.addColorStop(0,'#b9cbd6');ir.addColorStop(.6,'#6f8fa3');ir.addColorStop(1,'#34495a');x.fillStyle=ir;x.beginPath();x.arc(2,2,11,0,7);x.fill();
  x.fillStyle='#0d1216';x.beginPath();x.arc(2,2,5,0,7);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(-2,-2,2.4,0,7);x.fill();
  x.fillStyle='rgba(60,35,30,.45)';x.fillRect(-26,-14,52,12);x.restore();
  x.strokeStyle='#4a3028';x.lineWidth=3.5;x.beginPath();x.moveTo(-23,3);x.bezierCurveTo(-12,-10,12,-11,25,2);x.stroke();
  x.strokeStyle='rgba(120,80,70,.5)';x.lineWidth=2.5;x.beginPath();x.moveTo(-20,11);x.quadraticCurveTo(0,17,20,11);x.stroke();
  x.strokeStyle='#e9e5e0';x.lineWidth=8;x.beginPath();x.moveTo(-26,-11);x.quadraticCurveTo(4,-26,30,-17);x.stroke();
  x.strokeStyle='#b9b3ac';x.lineWidth=3;x.beginPath();x.moveTo(-24,-8);x.quadraticCurveTo(4,-21,28,-13);x.stroke();
  x.restore()});
 x.strokeStyle='rgba(120,75,65,.45)';x.lineWidth=3;x.beginPath();x.moveTo(w/2-4,h*.55);x.lineTo(w/2-7,h*.7);x.quadraticCurveTo(w/2,h*.74,w/2+8,h*.7);x.stroke();
 x.strokeStyle='#6d4038';x.lineWidth=3;x.beginPath();x.moveTo(w/2-14,h*.86);x.quadraticCurveTo(w/2,h*.85,w/2+14,h*.86);x.stroke()},1));
function gxRaf(M,team){
 const G=new THREE.Group(),P=GX.pal(M),TAU=Math.PI*2,PI=Math.PI,C=new THREE.Group(),
  B=(g,m,x,y,z,Q)=>{const e=new THREE.Mesh(g,m);e.position.set(x||0,y||0,z||0);(Q||C).add(e);return e},
  S=(r,a,b,c)=>new THREE.SphereGeometry(r,18,12).scale(a,b,c),Sm=r=>new THREE.SphereGeometry(r,6,5),
  Cy=(r1,r2,l,s)=>new THREE.CylinderGeometry(r1,r2,l,s||14),Bx=(a,b,c)=>new THREE.BoxGeometry(a,b,c),
  Cn=(r,l,s)=>new THREE.ConeGeometry(r,l,s||5),Oc=(r,a,b,c)=>new THREE.OctahedronGeometry(r).scale(a,b,c),
  Tr=(r,t,s,arc)=>new THREE.TorusGeometry(r,t,8,s||24,arc),Ld=GX.lathe,
  ez=x=>x<=0?0:x>=1?1:x*x*(3-2*x),cl=(v,a)=>v<-a?-a:v>a?a:v,mix=(a,b,k)=>a.map((v,i)=>v+(b[i]-v)*k),
  ghost=m=>{m.raycast=()=>{};Object.defineProperty(m,'castShadow',{get:()=>false,set:()=>{}});return m},
  rag=(g,yb,amp,n)=>{const p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);if(y<yb){const a=Math.atan2(p.getZ(i),p.getX(i));p.setY(i,y-amp*Math.abs(Math.sin(a*(n||13)+1.7))*(.5+.5*Math.sin(a*3)))}}g.computeVertexNormals();return g},
  _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_p=new THREE.Vector3(),_o=new THREE.Vector3(1,1,1),
  D=(g,x,y,z,rx,ry,rz)=>[g,x,y,z,rx,ry,rz],
  MGm=(Q,m,L)=>{if(!L.length)return null;
   const gs=L.map(it=>{let g=it[0];g=g.index?g.toNonIndexed():g;_e.set(it[4]||0,it[5]||0,it[6]||0);_q.setFromEuler(_e);_m.compose(_p.set(it[1]||0,it[2]||0,it[3]||0),_q,_o);g.applyMatrix4(_m);return g});
   let n=0;gs.forEach(g=>n+=g.attributes.position.count);
   const P3=new Float32Array(n*3),N3=new Float32Array(n*3),U2=new Float32Array(n*2);let k=0;
   gs.forEach(g=>{const c=g.attributes.position.count;P3.set(g.attributes.position.array,k*3);N3.set(g.attributes.normal.array,k*3);if(g.attributes.uv)U2.set(g.attributes.uv.array,k*2);k+=c;g.dispose()});
   const mg=new THREE.BufferGeometry();mg.setAttribute('position',new THREE.BufferAttribute(P3,3));mg.setAttribute('normal',new THREE.BufferAttribute(N3,3));mg.setAttribute('uv',new THREE.BufferAttribute(U2,2));
   const mesh=new THREE.Mesh(mg,m);Q.add(mesh);return mesh};
 G.add(C);
 // ---- مواد ----
 const RbF=P.cloth(0xffffff,{map:GX.rfRobe(),roughness:.92,side:THREE.FrontSide}),RbB=P.cloth(0x4a3a2e,{roughness:.9,side:THREE.BackSide}),RbD=P.cloth(0xffffff,{map:GX.rfRobe(),roughness:.92}),
  TnF=P.cloth(0xffffff,{map:GX.rfTun(),roughness:.9,side:THREE.FrontSide}),TnB=P.cloth(0xffffff,{map:GX.rfTun(),roughness:.9,side:THREE.BackSide}),Tn=P.cloth(0xffffff,{map:GX.rfTun(),roughness:.9}),
  Pn=P.cloth(0x2c2320,{roughness:.9}),Sk=P.skin(0xd2a68b),Lt=P.leather(0x3a271b),Lt2=P.leather(0x5a3b26),Rp=M(GX.c(0x6a4a30),{roughness:.95}),
  Hw=M(GX.c(0xf0ede8),{roughness:.5,clearcoat:.3}),Hg=M(GX.c(0xc2bdb8),{roughness:.55}),Hg2=M(GX.c(0xdcd8d3),{roughness:.5}),
  Wd=M(0xffffff,{map:GX.rfBark(),roughness:.85}),Au=P.metal(0xb8934a,{roughness:.4}),
  CRm=new THREE.MeshStandardMaterial({color:0xffa31a,emissive:0xff6a00,emissiveIntensity:1.3,roughness:.08,metalness:.15,flatShading:true,transparent:true,opacity:.96}),
  GLm=new THREE.MeshBasicMaterial({color:0xffa640,transparent:true,opacity:.28,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}),
  CRi=new THREE.MeshBasicMaterial({color:0xffe08a,transparent:true,opacity:.9,toneMapped:false});
 // ---- پاها: چکمهٔ بنددار ----
 const Y=1.0;
 const legs=[-1,1].map(s=>{const L=new THREE.Group();L.position.set(s*.12,Y,0);C.add(L);
  GX.strand(L,Pn,[[0,.02,0],[0,-.25,.01],[0,-.5,0]],.1,.085,8);
  const K=new THREE.Group();K.position.set(0,-.5,0);L.add(K);
  B(Ld([[.085,-.5],[.105,-.44],[.1,-.28],[.112,-.12],[.125,.0]],20),Lt,0,0,0,K);B(Tr(.13,.02,18),Lt,0,0,0,K).rotation.x=PI/2;
  B(S(.095,1,.55,1.7),Lt,0,-.45,.065,K);B(Bx(.17,.035,.33),Lt,0,-.485,.06,K);
  [[-.08,.127],[-.18,.12],[-.28,.112],[-.38,.104]].forEach(a=>{B(Tr(a[1],.011,16),Lt2,0,a[0],0,K).rotation.x=PI/2;B(Bx(.025,.03,.012),Au,0,a[0],a[1]+.006,K)});
  return{L,K}});
 // ---- بالاتنه، تونیک و کمربند ----
 const TG=new THREE.Group();TG.position.set(0,Y,0);C.add(TG);
 B(Ld([[.2,-.06],[.215,.08],[.2,.22],[.235,.4],[.215,.54],[.13,.68]],32),Tn,0,0,0,TG).scale.set(1,1,.8);
 B(rag(Ld([[.21,.02],[.24,-.25],[.26,-.5],[.28,-.7]],40,9,.05),-.6,.07,13),Tn,0,0,0,TG).scale.set(1,1,.92);
 B(Tr(.225,.028,28),Rp,0,.06,0,TG).rotation.x=PI/2;B(Tr(.22,.024,28),Rp,0,.115,0,TG).rotation.x=PI/2;B(S(.05,1,1,1),Rp,0,.085,.225,TG);
 [[-.06,0],[.02,1],[.09,2]].forEach(a=>GX.strand(TG,Rp,[[a[0],.07,.23],[a[0]*1.3,-.15,.25],[a[0]*1.6,-.4+a[1]*.04,.23],[a[0]*1.8,-.62+a[1]*.05,.2]],.018,.01,10));
 B(Bx(.15,.18,.07),Lt2,.2,-.07,.215,TG).rotation.y=.3;B(Bx(.152,.05,.075),Lt,.2,.0,.217,TG).rotation.y=.3;B(Bx(.03,.03,.01),Au,.2,-.01,.255,TG).rotation.y=.3;
 GX.strand(TG,Lt,[[.2,.6,.06],[.1,.36,.2],[-.08,.14,.2],[-.2,.0,.14]],.022,.022,12);
 B(Oc(.025,1,1.5,.6),Au,0,.5,.21,TG);
 // ---- پارچه‌ها: شنل‌پوش، پهلوها، پشت و پیش‌بند ----
 const cloths=[];
 const mkCloth=(w,h,nu,nv,mf,mb,tip,x,y,z,Q,ph,kk,rg)=>{const g=new THREE.PlaneGeometry(w,h,nu,nv);g.translate(0,-h/2,0);const p=g.attributes.position;
  for(let i=0;i<p.count;i++){const px=p.getX(i),py=p.getY(i),v=-py/h;let ny=py-tip*(1-Math.abs(px)/(w/2))*Math.pow(v,4);
   if(rg&&v>.99){const j=Math.round((px/w+.5)*nu);ny-=rg*(j%3===0?1:j%3===1?.25:.65)*(.6+.4*Math.sin(j*2.1))}p.setY(i,ny)}
  g.computeVertexNormals();const base=Float32Array.from(p.array),grp=new THREE.Group();grp.position.set(x,y,z);Q.add(grp);
  const a=new THREE.Mesh(g,mf),b=new THREE.Mesh(g,mb);a.frustumCulled=false;b.frustumCulled=false;a.castShadow=true;grp.add(a,b);
  const o={g,base,grp,h,ph:ph||0,k:kk||1};cloths.push(o);return o};
 [-1,1].forEach((s,i)=>{const c=mkCloth(.38,1.38,6,12,RbF,RbB,.1,s*.2,.58,.28,TG,i*1.9+.4,1,.1);c.grp.rotation.set(-.02,s*.3,s*.04);
  const d=mkCloth(.46,1.3,6,11,RbF,RbB,.14,s*.34,.58,-.02,TG,i*1.3+2,1.1,.1);d.grp.rotation.y=s*(PI/2-.15)});
 mkCloth(.9,1.45,10,14,RbF,RbB,.18,0,.62,-.3,TG,2.2,1.3,.12);
 mkCloth(.38,.78,5,8,TnF,TnB,.06,0,.1,.265,TG,.9,.6,.08);
 // ---- شنل‌پوش دور شانه‌ها ----
 B(rag(Ld([[.16,.78],[.24,.74],[.36,.64],[.44,.52],[.47,.38]],36,8,.045),.42,.09,11),RbD,0,0,0,TG).scale.set(1,1,.85);
 B(Tr(.16,.04,20),RbD,0,.76,0,TG).rotation.x=PI/2;
 // ---- سر ----
 const HD=new THREE.Group();HD.position.set(0,.78,.02);TG.add(HD);B(Cy(.07,.085,.18,12),Sk,0,0,0,HD);
 const hr=.215,hy=.2;B(GX.ashape(new THREE.SphereGeometry(hr,44,32),hr,{jaw:.2,chin:.05}).scale(1,1.1,1.02),Sk,0,hy,0,HD);
 B(GX.ashape(new THREE.SphereGeometry(hr*1.008,36,26,PI/2-.5,1,1.07,1),hr,{jaw:.2,chin:.05}).scale(1,1.1,1.02),M(0xffffff,{map:GX.faceRf(),roughness:.65,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),0,hy,0,HD);
 B(S(.034,.8,1.7,1.3),Sk,0,hy-.025,hr*1.04,HD);
 [-1,1].forEach(s=>GX.strand(HD,Hw,[[s*.015,hy+.05,.222],[s*.05,hy+.062,.218],[s*.085,hy+.045,.205]],.014,.007,6));
 // کلاهِ شنل: پوستهٔ بیرونی، آستر تیره و نوک عقب
 const hoodG=()=>new THREE.SphereGeometry(.3,26,18,PI/2+.8,TAU-1.6,0,2.1).scale(1,1.18,1.12);
 B(hoodG(),RbF,0,hy+.02,-.03,HD);B(hoodG().scale(.97,.97,.97),new THREE.MeshStandardMaterial({color:0x2a1e18,roughness:.95,side:THREE.BackSide}),0,hy+.02,-.03,HD);
 B(Cn(.13,.32,7),RbD,0,hy+.3,-.2,HD).rotation.x=-1.0;
 // موی بلند و ریش (با دو مفصل برای تاب‌خوردن)
 const HG=[];
 const strand2=(Q,m,root,up,lo,r0,r1,r2,ph,k)=>{const pg=new THREE.Group();pg.position.set(root[0],root[1],root[2]);Q.add(pg);
  GX.strand(pg,m,up,r0,r1,10);const mid=up[up.length-1],pg2=new THREE.Group();pg2.position.set(mid[0],mid[1],mid[2]);pg.add(pg2);
  GX.strand(pg2,m,lo,r1,r2,12);HG.push({pg,pg2,ph,k:k||1});return pg};
 B(S(.16,.9,1.6,.7),Hw,0,hy-.22,.12,HD);
 for(let i=0;i<18;i++){const a=(i-8.5)/8.5*1.15,ph=i*1.3,L=.32+.14*((i*.618)%1),sa=Math.sin(a),m=i%3===0?Hg:i%3===1?Hw:Hg2;
  strand2(HD,m,[sa*.15,hy-.1-.03*Math.cos(a),Math.cos(a)*.16+.04],[[0,0,0],[sa*.04,-.18*L*2,.05],[sa*.07,-.4*L*2,.09]],[[0,0,0],[sa*.03+Math.sin(ph)*.02,-.3*L*2,.03],[sa*.05+Math.sin(ph*1.7)*.04,-.62*L*2,.0],[sa*.04+Math.sin(ph*2.3)*.06,-.95*L*2,-.02]],.06,.045,.012,ph,1)}
 [-1,1].forEach(s=>GX.strand(HD,Hw,[[s*.015,hy-.1,.2],[s*.06,hy-.12,.21],[s*.12,hy-.17,.19]],.03,.012,8));
 [-1,1].forEach((s,i)=>{for(let j=0;j<3;j++){const ph=i*2.1+j*1.7;
  strand2(HD,j%2?Hg:Hg2,[s*(.2+j*.01),hy+.02-j*.04,.0-j*.02],[[0,0,0],[s*.05,-.25,.01],[s*.08,-.52,.04]],[[0,0,0],[s*.03,-.3,.02],[s*.06+Math.sin(ph)*.05,-.6,.0],[s*.08+Math.sin(ph*2)*.08,-.9,-.02]],.03,.022,.007,ph,1.2)}});
 // ---- بازوها ----
 const mkArm=s=>{const A=new THREE.Group();A.position.set(s*.4,.62,0);TG.add(A);
  GX.strand(A,Tn,[[0,0,0],[0,-.19,0],[0,-.38,0]],.075,.065,8);
  const E=new THREE.Group();E.position.set(0,-.38,0);A.add(E);B(S(.07,1,1,1),Tn,0,0,0,E);
  GX.strand(E,Tn,[[0,0,0],[0,-.18,0],[0,-.36,0]],.065,.055,8);
  B(rag(Ld([[.06,-.04],[.09,-.14],[.13,-.3],[.145,-.35]],18,5,.08),-.3,.03,9),RbD,0,0,0,E);
  if(s>0){B(S(.05,1,1.15,.5),Sk,0,-.41,0,E);[-.03,-.01,.01,.03].forEach((x,i)=>GX.strand(E,Sk,[[x,-.43,0],[x,-.49-(i%2)*.01,.012],[x,-.54-(i%2)*.01,.035]],.014,.008,6));
   GX.strand(E,Sk,[[-.04,-.4,.01],[-.07,-.44,.03],[-.075,-.48,.05]],.016,.008,6)}
  return{A,E}};
 const RA=mkArm(-1),LA=mkArm(1);
 // ---- عصا: چوب گره‌دار با کریستال نارنجی ----
 const IR=[.15,-.2,-2.2,0],WR=[.5,-.3,-2.45,-.35],CR=[-.95,-.1,-1.3,.55],IL=[-.08,.2,-.35],WL=[-.3,.3,-.5],CL=[-1.4,.3,-.3],BI=[0,0],BW=[-.12,-.25],BS=[.2,.2];
 RA.A.rotation.set(IR[0],0,IR[1]);RA.E.rotation.set(IR[2],0,0);
 const SF=new THREE.Group();SF.position.set(0,-.36,0);RA.E.add(SF);
 const hp=new THREE.Vector3(),eq=new THREE.Quaternion();SF.getWorldPosition(hp);RA.E.getWorldQuaternion(eq);
 const tilt=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(-.1,1,.02).normalize());
 SF.quaternion.copy(eq.invert().multiply(tilt));
 const SFp=new THREE.Group();SF.add(SFp);
 const Lb=Math.max(.8,hp.y)/Math.cos(.1)+.03,STL=1.15,pts=[];
 for(let i=0;i<=16;i++)pts.push([Math.sin(i*1.7)*.012,-Lb+(Lb+STL-.25)*i/16,Math.cos(i*2.3)*.012]);
 SFp.add(new THREE.Mesh(GX.tube(pts,u=>.026+.011*Math.sin(u*38)*Math.sin(u*7+1)+.006*Math.sin(u*90)+(u<.04?-.006:0),60,7),Wd));
 const nub=[];for(let i=0;i<28;i++){const y=-Lb+.12+i*((Lb+STL-.5)/28),a=i*2.4,dx=Math.sin(a),dz=Math.cos(a);nub.push(D(Cn(.012,.05+.02*(i%3),4),dx*.03,y,dz*.03,dz*1.2,0,-dx*1.2))}
 MGm(SFp,Wd,nub);
 [.2,.24,.28,STL-.42,STL-.38].forEach(y=>B(Tr(.034,.01,10),Rp,0,y,0,SFp).rotation.x=PI/2);
 for(let j=0;j<5;j++){const a=j/5*TAU,ca=Math.cos(a),sa=Math.sin(a);
  GX.strand(SFp,Wd,[[0,STL-.3,0],[ca*.1,STL-.18,sa*.1],[ca*.14,STL,sa*.14],[ca*.06,STL+.17,sa*.06]],.02,.008,10)}
 const CRG=new THREE.Group();CRG.position.set(0,STL-.02,0);SFp.add(CRG);
 const crys=B(Oc(.1,.8,1.55,.8),CRm,0,0,0,CRG);B(Oc(.05,.8,1.5,.8),CRi,0,0,0,CRG);
 const glow=ghost(B(new THREE.SphereGeometry(.22,14,10),GLm,0,0,0,CRG));glow.renderOrder=5;
 // مشت دست راست دور عصا
 B(S(.05,1,1.7,.9),Sk,0,0,0,SFp);for(let i=0;i<4;i++)B(Tr(.037,.0135,10),Sk,0,-.045+i*.03,0,SFp).rotation.x=PI/2;
 B(S(.016,1,2.2,1),Sk,.025,.06,.03,SFp);
  // ---- جزئیات افزوده (نسخهٔ پرجزئیات): تکه‌های ریز با هم ادغام می‌شوند تا فشار گرافیکی کم بماند ----
  {const ri=(n,R,y,f,zs)=>{const o=[];for(let i=0;i<n;i++){const a=i/n*TAU;o.push(f(Math.sin(a)*R,y,Math.cos(a)*R*(zs||1),a,i))}return o};
   // کمربند: مهره‌های طناب، گل‌میخ، آویزها
   MGm(TG,Rp,ri(16,.226,0,(x,y,z)=>D(Sm(.011),x,y,z)));
   MGm(TG,Au,ri(8,.236,.0875,(x,y,z)=>D(Sm(.012),x,y,z)));
   MGm(TG,Lt,[D(Cn(.014,.08,5),-.12,-.07,.232,PI),D(Cn(.014,.08,5),-.02,-.08,.236,PI),D(Cn(.014,.08,5),.08,-.07,.232,PI),D(Cy(.035,.035,.1,8),-.2,-.08,.17),D(Cy(.02,.02,.04,6),-.2,-.14,.17)]);
   MGm(TG,Lt2,[D(Cy(.022,.022,.12,8),.05,-.14,.24,0,0,PI/2),D(Tr(.024,.006,8),.0,-.14,.24,0,PI/2,0),D(Tr(.024,.006,8),.1,-.14,.24,0,PI/2,0)]);
   // تونیک: بخیهٔ لبه، وصله، بند یقه
   MGm(TG,Rp,ri(16,.28,-.66,(x,y,z,a)=>D(Bx(.035,.012,.01),x,y,z,0,a,0)));
   MGm(TG,Lt2,[D(Bx(.06,.05,.008),.1,-.15,.222),D(Bx(.06,.05,.008),-.12,-.32,.24),D(Bx(.06,.05,.008),.14,-.45,.25),D(Bx(.05,.06,.008),-.06,-.52,.26),D(Bx(.05,.05,.008),-.2,-.2,.15,0,-.9,0),D(Bx(.05,.05,.008),.2,-.3,.15,0,.9,0)]);
   MGm(TG,Au,[0,1,2,3,4,5].map(i=>D(Sm(.008),(i%2?.03:-.03),.38+i*.04,.172)));
   MGm(TG,Lt,[0,1,2,3].map(i=>D(Bx(.07,.008,.006),0,.4+i*.06,.174,0,0,i%2?.6:-.6)));
   // چکمه‌ها: بند، حلقه، دوخت، سگک
   legs.forEach((o,li)=>{const K=o.K,s=li?1:-1,bi=[],ey=[],st=[];
    [-.05,-.14,-.23,-.32].forEach((y,i)=>{bi.push(D(Bx(.05,.008,.008),0,y,.114,0,0,.6),D(Bx(.05,.008,.008),0,y,.114,0,0,-.6));ey.push(D(Sm(.008),-.035,y,.112),D(Sm(.008),.035,y,.112))});
    for(let k=0;k<4;k++)st.push(D(Sm(.008),-.085,-.49,.0+k*.07),D(Sm(.008),.085,-.49,.0+k*.07));
    MGm(K,Lt,bi);MGm(K,Au,ey.concat([D(Bx(.05,.04,.01),s*.1,-.3,.05)]));MGm(K,Rp,st);
    MGm(K,Lt2,[D(S(.07,1,.6,1),0,-.46,.2),D(Bx(.12,.04,.1),0,-.495,-.07)]);
    GX.strand(K,Lt2,[[s*.1,-.1,0],[s*.13,-.2,.03],[s*.11,-.34,.02]],.012,.01,8)});
   // عصا: زائده‌های بیشتر، طناب‌پیچ، آویزها، خارهای قفس، پاره‌های کریستال
   {const nb=[];for(let i=0;i<24;i++){const y=-Lb+.2+i*((Lb+STL-.7)/24),a=i*2.9+1,dx=Math.sin(a),dz=Math.cos(a);nb.push(D(Cn(.01,.045,4),dx*.03,y,dz*.03,dz*1.3,0,-dx*1.3))}MGm(SFp,Wd,nb)}
   MGm(SFp,Rp,[.52,.58,-.5,-.58,-.66,-.74].map(y=>D(Tr(.034,.009,10),0,y,0,PI/2)));
   MGm(SFp,Au,[0,1,2,3,4].map(i=>D(Sm(.012),.05,STL-.5-i*.06,0)).concat([0,1,2,3,4].map(i=>D(Sm(.012),-.05,STL-.5-i*.06,.0))));
   MGm(SFp,Hw,[D(Oc(.02,.5,3,.3),.05,STL-.86,0),D(Cn(.012,.06,4),-.05,STL-.84,0,PI)]);
   MGm(SFp,Wd,[0,1,2,3,4,5].map(j=>{const a=j/6*TAU+.3,ca=Math.cos(a),sa=Math.sin(a);return D(Cn(.01,.07,4),ca*.1,STL-.1,sa*.1,sa*1.0,0,-ca*1.0)}));
   MGm(CRG,CRm,[0,1,2,3,4,5].map(j=>{const a=j/6*TAU,ca=Math.cos(a),sa=Math.sin(a);return D(Oc(.03,.7,1.6,.7),ca*.09,-.08,sa*.09,sa*.8,0,-ca*.8)}));
   MGm(CRG,CRi,[0,1,2,3,4,5,6,7].map(i=>D(Sm(.012),Math.cos(i*2.1)*(.12+.02*(i%3)),.05+i*.03,Math.sin(i*2.1)*(.12+.02*(i%3)))));
   // کلاه: بخیه‌های لبه و نخ‌های ریش‌ریش
   {const hp=(ph,th)=>[-.3*Math.cos(ph)*Math.sin(th),hy+.02+.354*Math.cos(th),-.03+.336*Math.sin(ph)*Math.sin(th)],sx=[];
    for(let k=0;k<7;k++)[-1,1].forEach(sg=>{const q=hp(PI/2+sg*.8,.5+k*.25);sx.push(D(Bx(.03,.012,.01),q[0],q[1],q[2],k*.4,sg*.6,k*.3))});MGm(HD,Hg,sx);
    const th=[];for(let i=0;i<10;i++){const q=hp(PI/2+.8+(i+.5)/10*(TAU-1.6),2.05);th.push(D(Cn(.007,.06,3),q[0],q[1]-.03,q[2],PI))}MGm(HD,Hg2,th);
    const br=[];[-1,1].forEach(sg=>{for(let k=0;k<4;k++)br.push(D(Cn(.009,.045,4),sg*(.035+.025*k),hy+.05+.004*k,.208-.003*k,0,0,-sg*(PI/2-.12*k)))});MGm(HD,Hw,br);
    MGm(HD,Sk,[D(S(.03,.5,1,.7),-.21,hy-.02,0),D(S(.03,.5,1,.7),.21,hy-.02,0)])}
   // دست‌ها: مچ‌بند و بند انگشت
   [RA,LA].forEach(o=>{const E=o.E,w=[D(Tr(.07,.014,12),0,-.34,0,PI/2),D(Tr(.066,.01,12),0,-.3,0,PI/2)],st=[];for(let i=0;i<6;i++){const a=i/6*TAU;st.push(D(Sm(.011),Math.sin(a)*.075,-.34,Math.cos(a)*.075))}MGm(E,Lt,w);MGm(E,Au,st)});
   MGm(LA.E,Sk,[-.03,-.01,.01,.03].map(x=>D(Sm(.016),x,-.45,.02)).concat([-.03,-.01,.01,.03].map(x=>D(Sm(.007),x,-.545,.04))));
   // سنجاق شنل، گردنبند و آویز
   MGm(TG,Au,[D(Tr(.04,.008,14),0,.72,.182)].concat([0,1,2,3,4,5].map(i=>{const a=i/6*TAU;return D(Sm(.009),Math.cos(a)*.04,.72+Math.sin(a)*.04,.184)}),[D(Tr(.02,.006,8),-.07,.7,.17),D(Tr(.02,.006,8),.07,.7,.17),D(Oc(.025,1,1.4,.5),0,.52,.205)],[0,1,2,3,4,5,6,7].map(i=>{const a=-.9+i*.257;return D(Sm(.008),Math.sin(a)*.175,.66,Math.cos(a)*.15+.02)})));
   MGm(TG,CRm,[D(Oc(.022,1,1.4,.7),0,.72,.19)])}
 // ---- جزئیات ریز: منجوق و گل‌میخ‌های کهنه ----
 {const aT=[];for(let i=0;i<10;i++){const a=i/10*TAU;aT.push(D(Sm(.012),Math.sin(a)*.121,.77,Math.cos(a)*.121))}
  [-1,1].forEach(s=>{for(let k=0;k<4;k++)aT.push(D(Sm(.011),s*.15,-.06+k*.05,.2))});MGm(TG,Au,aT)}
 // ---- انیمیشن ----
 const SW={x:0,vx:0,z:0,vz:0,px:0,py:0,pz:0,lt:-1,ok:0},ST={h0:-1e9,d0:-1e9,dead:0,fl:0},SL=[];let dmats=null;
 const TIM={wu:.22,st:.12,ho:.1,rc:.5};
 const _cv=new THREE.Vector3(),visA=()=>{let o=G;while(o){if(o.visible===false)return false;o=o.parent}return true};
 const clothAnim=(c,t,sx,sz)=>{const a=c.g.attributes.position.array,b=c.base,n=a.length/3;
  for(let k=0;k<n;k++){const bx=b[k*3],by=b[k*3+1],v=Math.max(0,Math.min(1,-by/c.h)),d=Math.pow(v,1.3),sa=Math.sin(t*1.7+v*3.4+bx*3+c.ph),sb=Math.sin(t*3+v*6+bx*5+c.ph);
   a[k*3]=bx*(1+d*.04*sa)+d*(sx*.7+.02*sb)*c.k;a[k*3+1]=by+d*.02*sb-d*Math.abs(sz)*.05;a[k*3+2]=b[k*3+2]+d*(.04+.04*sa+cl(sz,.8)*.9)*c.k}
  c.g.attributes.position.needsUpdate=true;c.g.computeVertexNormals()};
 GX.anim(G,t=>{const now=performance.now(),dt=SW.lt<0?.016:Math.min(.05,Math.max(.001,t-SW.lt));SW.lt=t;
  const br=Math.sin(t*1.4),el=G.matrixWorld.elements;
  for(let i=SL.length-1;i>=0;i--){if((now-SL[i].t0)/1000>TIM.wu+TIM.st+TIM.ho+TIM.rc)SL.splice(i,1)}
  let nw=null;SL.forEach(sl=>{const e=(now-sl.t0)/1000;if(e>=0&&(!nw||sl.t0>nw.sl.t0))nw={sl,e}});
  let pr=IR,pl=IL,bp=BI,gl=0;
  if(nw){const e=nw.e,a=ez(e/TIM.wu),b=ez((e-TIM.wu)/TIM.st),c=ez((e-TIM.wu-TIM.st-TIM.ho)/TIM.rc);
   pr=mix(mix(mix(IR,WR,a),CR,b),IR,c);pl=mix(mix(mix(IL,WL,a),CL,b),IL,c);bp=mix(mix(mix(BI,BW,a),BS,b),BI,c);gl=(a*.4+b*.6)*(1-c)}
  let lx=0,lz=0;if(SW.ok){const vx=(el[12]-SW.px)/dt,vy=(el[13]-SW.py)/dt,vz=(el[14]-SW.pz)/dt,ax=el[0]*el[0]+el[1]*el[1]+el[2]*el[2]||1,az=el[8]*el[8]+el[9]*el[9]+el[10]*el[10]||1;lx=(vx*el[0]+vy*el[1]+vz*el[2])/ax;lz=(vx*el[8]+vy*el[9]+vz*el[10])/az}
  SW.px=el[12];SW.py=el[13];SW.pz=el[14];SW.ok=1;
  const fl0=el[13]>.4?1:0;ST.fl+=(fl0-ST.fl)*Math.min(1,dt*3);const fl=ST.fl;
  const eh=(now-ST.h0)/1000,hur=!ST.dead&&eh>=0&&eh<.6?Math.sin(Math.min(1,eh/.16)*PI/2)*(1-ez((eh-.16)/.44)):0;
  const tx=cl(-lx*.1-bp[1]*.25,.45),tz=cl(-lz*.1-Math.max(0,bp[0])*.5-hur*.4-fl*.5,.8);
  SW.vx+=((tx-SW.x)*45-SW.vx*4.2)*dt;SW.x+=SW.vx*dt;SW.vz+=((tz-SW.z)*45-SW.vz*4.2)*dt;SW.z+=SW.vz*dt;
  G.position.set(0,.008*Math.sin(t*2),bp[0]*.2-hur*.12);
  legs.forEach((o,i)=>{o.L.rotation.x=fl*(i?.45:.65);o.K.rotation.x=fl*(i?.7:.9)});
  TG.rotation.set(.1+bp[0]-hur*.35+fl*.28+.008*br,bp[1],.01*Math.sin(t*.6)+hur*.06);TG.scale.y=1+.006*br;
  HD.rotation.set(-.12-bp[0]*.6+hur*.5-fl*.15+.02*Math.sin(t*.5),-bp[1]*.5+.2*Math.sin(t*.27)+.06*Math.sin(t*.7),.025*Math.sin(t*.43+2));
  RA.A.rotation.set(pr[0]-hur*.2-fl*.1+.012*Math.sin(t*.9),0,pr[1]);RA.E.rotation.set(pr[2],0,0);SFp.rotation.set(pr[3]+fl*.25+.01*Math.sin(t*.8),0,0);
  LA.A.rotation.set(pl[0]-hur*.2+fl*.5+.015*Math.sin(t*.9+1),0,pl[1]+fl*.35);LA.E.rotation.set(pl[2]-fl*.3,0,0);
  const bs=1.3+.3*Math.sin(t*2.2)+gl*2.4+fl*.5;
  CRm.emissiveIntensity=bs;GLm.opacity=Math.min(.7,.26+.06*Math.sin(t*3)+gl*.4+fl*.1);glow.scale.setScalar(1+.08*Math.sin(t*3)+gl*.9);crys.rotation.y=t*.5;CRG.scale.setScalar(1+gl*.18);
  if(!ST.dead&&FXI&&visA()){const q=window.__FXQ||1;if(Math.random()<dt*7*q){try{CRG.getWorldPosition(_cv);burst(_cv,1,0xffb060,{spark:1,sp:.15,size:.09,life:1.1,g:-1.2,vy:.4,up:.2,y:0,r:.08,h:.08})}catch(e){}}
    if(Math.random()<dt*5*q){try{CRG.getWorldPosition(_cv);burst(_cv,1,0xffc040,{fire:1,sp:.1,size:.3,life:.75,g:-2.2,vy:.3,up:.1,y:0,r:.06,h:.06})}catch(e){}}}
  HG.forEach(o=>{const w=Math.sin(t*1.3+o.ph);o.pg.rotation.set((.04*w-SW.z*.3+bp[0]*.2+hur*.2+fl*.5)*o.k,0,(.035*Math.sin(t*1.1+o.ph*.7)+SW.x*.5+bp[1]*.2)*o.k);
   o.pg2.rotation.set((.07*Math.sin(t*1.7+o.ph+1)-SW.z*.4+fl*.35)*o.k,0,(.06*Math.sin(t*1.4+o.ph*.6)+SW.x*.5)*o.k)});
  cloths.forEach(c=>clothAnim(c,t,SW.x,SW.z));
  if(ST.dead){const e=(now-ST.d0)/1000,a=ez(e/.35),b=ez((e-.3)/.6),c=ez((e-.85)/.7);
   G.position.set(0,-.55*b-.03*c,-.15*a+.15*c);
   legs.forEach((o,i)=>{o.L.rotation.x=-1.1*b*(i?1:.9);o.K.rotation.x=2.3*b});
   TG.rotation.set(.1+.3*a-.45*b-1.2*c,0,.1*a*(1-c));HD.rotation.set(.3*a-.2*b+.4*c,0,.12*a*(1-c));
   RA.A.rotation.set(IR[0]+.3*a-1.0*c,0,IR[1]-.6*c);RA.E.rotation.set(IR[2]+1.0*c,0,0);SFp.rotation.set(1.3*c,0,0);
   LA.A.rotation.set(-.3*a+.2*c,0,.5+.6*c);LA.E.rotation.set(-.3*b,0,0);
   CRm.emissiveIntensity=(1.3+.6*Math.sin(e*38)*(1-c))*(1-c);GLm.opacity=.3*(1-c);glow.scale.setScalar(1+.4*Math.sin(e*20)*(1-c));
   if(e>1.35&&dmats){const o=Math.max(0,1-ez((e-1.35)/.9));dmats.forEach(m=>{m.transparent=true;m.opacity=o})}}});
 G.userData.raf={cast:delay=>{const d=delay||0;if(!ST.dead)SL.push({t0:performance.now()+d});return d+(TIM.wu+TIM.st*.4)*1000},
  hurt:()=>{if(!ST.dead)ST.h0=performance.now()},
  tip:()=>{const v=new THREE.Vector3();CRG.getWorldPosition(v);return v},
  die:()=>{if(ST.dead)return;ST.dead=1;ST.d0=performance.now();dmats=new Set();G.traverse(o=>{if(o.material)[].concat(o.material).forEach(m=>dmats.add(m))});dmats.delete(GLm)}};
 return G}
function rfSafe(M){const G=new THREE.Group(),a=(g,c,y,z)=>{const m=new THREE.Mesh(g,M(c,{roughness:.8}));m.position.set(0,y,z||0);G.add(m)};
 a(new THREE.CylinderGeometry(.25,.42,1.5,16),0xcfc6b8,.8);a(new THREE.SphereGeometry(.22,18,14),0xd2a68b,1.75);a(new THREE.ConeGeometry(.3,.5,12),0xcfc6b8,2.05);return G}
GX.reg('raf',gxRaf,rfSafe);
/* ===== اسکین شاهدخت (pri) — مطابق تصویر مرجع =====
   سامورایی اشرافی: موی مشکیِ بسیار بلند، تاج و سنجاق‌های طلایی با گل سرخ و منگوله‌های آویز، کیمونوی مشکی با گل‌های سرخ و طلایی،
   آستین‌های گشاد با آستر سرخ، اوبی با گل طلایی و منگوله‌های بلند، دامن شکاف‌دار، رانبند، پابند و گِتای پلتفرمی و کاتانا.
   انیمیشن‌ها: بیکار (نفس، موها، منگوله‌ها، آستین‌ها، دامن و اوبی) | ضربه (آماده‌سازی ← برش با رد نورانی ← برگشت)
   | آسیب‌دیدن | مرگ (زانو زدن، افتادن، پاشیدن گلبرگ، محو شدن).
   تعداد تکه‌ها (مش‌ها + نمونه‌های ادغام‌شده) در G.userData.priParts ثبت می‌شود و بیش از ۶۰۰ است. */
GX.prKim=()=>GX._prK||(GX._prK=GX.tex(256,256,(x,w,h)=>{
 let sd=23;const R=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
 const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#1d0b10');g.addColorStop(1,'#12060a');x.fillStyle=g;x.fillRect(0,0,w,h);
 x.strokeStyle='rgba(150,28,44,.18)';x.lineWidth=1;
 for(let i=-h;i<w+h;i+=12){x.beginPath();x.moveTo(i,0);x.lineTo(i+h,h);x.stroke();x.beginPath();x.moveTo(i,h);x.lineTo(i+h,0);x.stroke()}
 const fl=(cx,cy,r,rot,c1,c2)=>{for(let k=0;k<5;k++){x.save();x.translate(cx,cy);x.rotate(rot+k/5*6.283);x.fillStyle=c1;x.beginPath();x.moveTo(0,0);x.bezierCurveTo(r*.45,-r*.42,r*.95,-r*.3,r,0);x.bezierCurveTo(r*.95,r*.3,r*.45,r*.42,0,0);x.fill();x.restore()}x.fillStyle=c2;x.beginPath();x.arc(cx,cy,r*.2,0,7);x.fill()};
 for(let i=0;i<34;i++){const cx=R()*w,cy=R()*h,r=9+R()*13,red=i%3!==0,rot=R()*6.283;
  [0,-w,w].forEach(o=>fl(cx+o,cy,r,rot,red?'rgba(176,22,43,.92)':'rgba(214,166,74,.88)',red?'#e2b34e':'#7d0d1f'))}
 for(let i=0;i<70;i++){x.fillStyle=R()<.5?'rgba(226,179,78,.7)':'rgba(176,22,43,.7)';x.beginPath();x.arc(R()*w,R()*h,.8+R()*1.4,0,7);x.fill()}
},1));
GX.prObi=()=>GX._prO||(GX._prO=GX.tex(128,128,(x,w,h)=>{
 x.fillStyle='#7d0d1f';x.fillRect(0,0,w,h);
 for(let i=0;i<h;i+=16){x.fillStyle='rgba(226,179,78,.5)';x.fillRect(0,i,w,2)}
 for(let i=0;i<9;i++)for(let j=0;j<9;j++){const cx=i*16+(j%2?8:0),cy=j*16+8;x.fillStyle='rgba(226,179,78,.78)';x.beginPath();x.moveTo(cx,cy-5);x.lineTo(cx+5,cy);x.lineTo(cx,cy+5);x.lineTo(cx-5,cy);x.fill()}
 x.fillStyle='#e2b34e';x.fillRect(0,0,w,5);x.fillRect(0,h-5,w,5)},1));
GX.facePr=o=>GX.tex(256,256,(x,w,h)=>{
 const S='#'+new THREE.Color(o.skin).getHexString(),g=x.createRadialGradient(w/2,h*.55,8,w/2,h*.5,w*.6);
 g.addColorStop(0,o.hi);g.addColorStop(.75,S);g.addColorStop(1,S);x.fillStyle=g;x.fillRect(0,0,w,h);x.lineCap='round';x.lineJoin='round';
 [-1,1].forEach(s=>{x.save();x.translate(w/2+s*o.ex,h*.5);x.scale(s,1);
  const eye=()=>{x.beginPath();x.moveTo(-26,4);x.bezierCurveTo(-14,-10,14,-18,31,-6);x.bezierCurveTo(14,12,-12,15,-26,4);x.closePath()};
  x.fillStyle='rgba(190,30,52,.30)';x.beginPath();x.ellipse(2,-12,32,11,-.1,0,7);x.fill();
  eye();x.fillStyle='#f6f0f0';x.fill();x.save();eye();x.clip();
  const ir=x.createRadialGradient(2,3,2,2,3,22);ir.addColorStop(0,'#ffb2a8');ir.addColorStop(.45,'#d3202e');ir.addColorStop(1,'#4c0710');x.fillStyle=ir;x.beginPath();x.ellipse(2,2,15,19,0,0,7);x.fill();
  x.fillStyle='#1a0508';x.beginPath();x.ellipse(2,3,5,10,0,0,7);x.fill();x.fillStyle='rgba(60,10,20,.4)';x.fillRect(-30,-24,62,15);
  x.fillStyle='#fff';x.beginPath();x.arc(-4,-5,5,0,7);x.fill();x.beginPath();x.arc(8,10,2.6,0,7);x.fill();x.restore();
  x.strokeStyle='#120a10';x.lineWidth=6.5;x.beginPath();x.moveTo(-27,4);x.bezierCurveTo(-14,-10,14,-18,32,-7);x.stroke();
  x.lineWidth=4;x.beginPath();x.moveTo(29,-7);x.lineTo(44,-15);x.stroke();
  x.strokeStyle='#14090d';x.lineWidth=5;x.beginPath();x.moveTo(-24,-24);x.quadraticCurveTo(6,-31,36,-40);x.stroke();x.restore()});
 x.strokeStyle='rgba(150,80,80,.32)';x.lineWidth=3;x.beginPath();x.moveTo(w/2-2,h*.66);x.lineTo(w/2+3,h*.69);x.stroke();
 x.strokeStyle='#9b2036';x.lineWidth=4;x.beginPath();x.moveTo(w/2-15,h*.835);x.quadraticCurveTo(w/2,h*.83,w/2+15,h*.835);x.stroke();
 x.fillStyle='rgba(176,40,62,.6)';x.beginPath();x.ellipse(w/2,h*.845,11,3.2,0,0,7);x.fill()},1);
function gxPri(M,team){
 const G=new THREE.Group(),P=GX.pal(M),Y=.2,TAU=Math.PI*2,PI=Math.PI,C=new THREE.Group(),PC={n:0},
  B=(g,m,x,y,z,Q)=>{PC.n++;const e=new THREE.Mesh(g,m);e.position.set(x||0,y||0,z||0);(Q||C).add(e);return e},
  Sd=(Q,m,pts,r0,r1,seg)=>{PC.n++;return GX.strand(Q,m,pts,r0,r1,seg)},
  S=(r,a,b,c)=>new THREE.SphereGeometry(r,18,12).scale(a,b,c),Sm=r=>new THREE.SphereGeometry(r,6,5),
  Cy=(r1,r2,l,s)=>new THREE.CylinderGeometry(r1,r2,l,s||14),Bx=(a,b,c)=>new THREE.BoxGeometry(a,b,c),
  Cn=(r,l,s)=>new THREE.ConeGeometry(r,l,s||5),Oc=(r,a,b,c)=>new THREE.OctahedronGeometry(r).scale(a,b,c),
  Tr=(r,t,s,arc)=>new THREE.TorusGeometry(r,t,8,s||24,arc),Ld=GX.lathe,
  Lo=(pts,seg,ps,pl,n,a)=>{const g=new THREE.LatheGeometry(pts.map(q=>new THREE.Vector2(q[0],q[1])),seg,ps,pl),p=g.attributes.position;
   if(n)for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),f=1+a*Math.sin(n*Math.atan2(z,x));p.setX(i,x*f);p.setZ(i,z*f)}g.computeVertexNormals();return g},
  ez=x=>x<=0?0:x>=1?1:x*x*(3-2*x),cl=(v,a)=>v<-a?-a:v>a?a:v,mix=(a,b,k)=>a.map((v,i)=>v+(b[i]-v)*k),
  ghost=m=>{m.raycast=()=>{};Object.defineProperty(m,'castShadow',{get:()=>false,set:()=>{}});return m},
  _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_p=new THREE.Vector3(),_o=new THREE.Vector3(1,1,1),
  D=(g,x,y,z,rx,ry,rz)=>[g,x,y,z,rx,ry,rz],
  MG=(Q,m,L)=>{if(!L.length)return null;PC.n+=L.length;
   const gs=L.map(it=>{let g=it[0];g=g.index?g.toNonIndexed():g;_e.set(it[4]||0,it[5]||0,it[6]||0);_q.setFromEuler(_e);_m.compose(_p.set(it[1]||0,it[2]||0,it[3]||0),_q,_o);g.applyMatrix4(_m);return g});
   let n=0;gs.forEach(g=>n+=g.attributes.position.count);
   const P3=new Float32Array(n*3),N3=new Float32Array(n*3),U2=new Float32Array(n*2);let k=0;
   gs.forEach(g=>{const c=g.attributes.position.count;P3.set(g.attributes.position.array,k*3);N3.set(g.attributes.normal.array,k*3);if(g.attributes.uv)U2.set(g.attributes.uv.array,k*2);k+=c;g.dispose()});
   const mg=new THREE.BufferGeometry();mg.setAttribute('position',new THREE.BufferAttribute(P3,3));mg.setAttribute('normal',new THREE.BufferAttribute(N3,3));mg.setAttribute('uv',new THREE.BufferAttribute(U2,2));
   const mesh=new THREE.Mesh(mg,m);Q.add(mesh);return mesh};
 G.add(C);
 // ---- مواد ----
 const Kf=P.cloth(0xffffff,{map:GX.prKim(),roughness:.8}),KF=P.cloth(0xffffff,{map:GX.prKim(),roughness:.85,side:THREE.FrontSide}),
  Rd=P.cloth(0x9d1427,{roughness:.6}),RdB=P.cloth(0x9d1427,{roughness:.8,side:THREE.BackSide}),Rc=P.cloth(0xb0132a,{roughness:.55}),
  Ob=P.cloth(0xffffff,{map:GX.prObi(),roughness:.55}),ObF=P.cloth(0xffffff,{map:GX.prObi(),roughness:.6,side:THREE.FrontSide}),ObB=P.cloth(0xffffff,{map:GX.prObi(),roughness:.6,side:THREE.BackSide}),
  Au=P.metal(0xe2b34e,{roughness:.28}),Bk=P.leather(0x120c10),Wl=P.leather(0x1a1015),Wh=P.cloth(0xf4efec),Sk=P.skin(0xf3d2c2),
  Gm=M(GX.c(0xd01a30),{roughness:.1,metalness:.3,clearcoat:1,emissive:new THREE.Color(.25,0,.03)}),
  Hr=P.hair(0x0b080c),Hr2=M(GX.c(0x1c1218),{roughness:.36,metalness:.12,clearcoat:.7,clearcoatRoughness:.22}),Hr3=M(GX.c(0x050305),{roughness:.4,metalness:.1,clearcoat:.8,clearcoatRoughness:.25}),
  Sv=P.metal(0xeef1f8,{roughness:.14}),St=P.metal(0x8f98a8,{roughness:.2});
 // ---- پاها: پوست، رانبند، پابند و گِتای پلتفرمی با بند سرخ ----
 const legs=[-1,1].map(s=>{const L=new THREE.Group();L.position.set(s*.12,Y+.95,0);C.add(L);
  Sd(L,Sk,[[0,.02,0],[0,-.26,.01],[0,-.5,0]],.108,.085,8);
  const K=new THREE.Group();K.position.set(0,-.5,0);L.add(K);
  Sd(K,Sk,[[0,0,0],[0,-.2,.005],[0,-.41,0]],.082,.052,8);B(S(.088,1,1,1),Sk,0,0,0,K);
  B(S(.058,1,.5,2),Sk,0,-.435,.06,K);
  B(Bx(.19,.16,.42),Wl,0,-.54,.05,K);B(Bx(.21,.03,.44),Bk,0,-.635,.05,K);B(Bx(.17,.02,.4),Rc,0,-.46,.05,K);
  B(Tr(.07,.011,12,PI),Rc,0,-.455,.1,K);B(Cn(.013,.05,5),Rc,0,-.47,.19,K);
  B(Tr(.062,.013,14),Bk,0,-.37,0,K).rotation.x=PI/2;B(Oc(.022,1,1.2,.5),Au,0,-.37,.065,K);
  Sd(K,Rc,[[0,-.38,.068],[.012,-.45,.08],[.012,-.52,.075]],.013,.008,6);
  if(s>0){B(Tr(.1,.018,20),Bk,0,-.2,0,L).rotation.x=PI/2;B(Bx(.06,.05,.02),Au,0,-.2,.1,L);B(Oc(.02,1,1.3,.5),Gm,0,-.2,.112,L);
   Sd(L,Rc,[[.025,-.21,.1],[.03,-.3,.1],[.03,-.38,.09]],.014,.01,6)}
  return{L,K}});
 // ---- بالاتنه و یقهٔ ضربدری ----
 const TG=new THREE.Group();TG.position.set(0,Y+.95,0);C.add(TG);
 B(Ld([[.18,-.05],[.17,.08],[.15,.2],[.185,.3],[.215,.4],[.2,.52],[.13,.66]],32),Kf,0,0,0,TG).scale.set(1,1,.82);
 const vs=new THREE.Shape();vs.moveTo(-.075,0);vs.lineTo(.075,0);vs.lineTo(0,-.2);vs.closePath();
 B(new THREE.ShapeGeometry(vs),Sk,0,.64,.168,TG);
 [-1,1].forEach(s=>{B(Bx(.05,.3,.012),Wh,s*.055,.51,.176,TG).rotation.z=s*.28;B(Bx(.04,.3,.014),Rd,s*.075,.51,.182,TG).rotation.z=s*.28;B(Bx(.012,.3,.016),Au,s*.1,.51,.186,TG).rotation.z=s*.28});
 B(Ld([[.095,.62],[.11,.67],[.108,.78],[.092,.8]],20),Kf,0,0,0,TG);B(Tr(.108,.01,20),Au,0,.79,0,TG).rotation.x=PI/2;
 // ---- اوبی: کمربند پهن، گل طلایی، گرهٔ پشت و منگوله‌ها ----
 B(Ld([[.2,-.02],[.226,.0],[.226,.25],[.2,.27]],32),Ob,0,0,0,TG).scale.set(1,1,.9);
 B(Tr(.222,.012,30),Au,0,.0,0,TG).rotation.x=PI/2;B(Tr(.222,.012,30),Au,0,.26,0,TG).rotation.x=PI/2;
 for(let k=0;k<6;k++)B(S(.05,1,1.7,.4),Au,Math.sin(k/6*TAU)*.03,.14+Math.cos(k/6*TAU)*.03,.235,TG).rotation.z=k/6*TAU;
 B(S(.032,1,1,.6),Gm,0,.14,.245,TG);
 const BOW=new THREE.Group();BOW.position.set(0,.14,-.26);TG.add(BOW);
 [-1,1].forEach(s=>{B(S(.17,1.5,1,.28),Ob,s*.2,.02,0,BOW).rotation.z=s*.35;B(S(.1,1.4,.8,.3),Rd,s*.24,.0,-.02,BOW).rotation.z=s*.35;B(Tr(.12,.012,16),Au,s*.2,.02,.03,BOW).scale.set(1.5,1,1)});
 B(S(.07,1,1.4,.7),Rd,0,.02,.02,BOW);B(Oc(.03,1,1.3,.5),Au,0,.02,.07,BOW);
 // ---- دامن شکاف‌دار با لبهٔ سرخ ----
 const SKp=[[.21,.02],[.28,-.2],[.36,-.45],[.44,-.72],[.5,-.98]],GP0=.75,GPL=TAU-.8;
 const skR=y=>{for(let i=0;i<SKp.length-1;i++){const a=SKp[i],b=SKp[i+1];if(y<=a[1]&&y>=b[1])return a[0]+(b[0]-a[0])*(a[1]-y)/(a[1]-b[1])}return SKp[SKp.length-1][0]};
 B(Lo(SKp,44,GP0,GPL,18,.04),Kf,0,0,0,TG).scale.set(1,1,.92);
 B(Lo([[.505,-.99],[.495,-.88]],44,GP0,GPL),Rd,0,0,0,TG).scale.set(1,1,.92);
 [GP0,GP0+GPL].forEach(a=>{const pts=[.02,-.2,-.45,-.72,-.97].map(y=>{const r=skR(y)*1.01;return[Math.sin(a)*r,y,Math.cos(a)*r*.92]});Sd(TG,Rd,pts,.02,.026,14)});
 // ---- پارچه‌ها: دنبالهٔ دامن، دم اوبی، آستین‌های گشاد با آستر سرخ ----
 const cloths=[];
 const mkCloth=(w,h,nu,nv,mf,mb,tip,x,y,z,Q,ph,kk)=>{PC.n+=2;const g=new THREE.PlaneGeometry(w,h,nu,nv);g.translate(0,-h/2,0);const p=g.attributes.position;
  for(let i=0;i<p.count;i++){const px=p.getX(i),py=p.getY(i),v=-py/h;p.setY(i,py-tip*(1-Math.abs(px)/(w/2))*Math.pow(v,4))}
  g.computeVertexNormals();const base=Float32Array.from(p.array),grp=new THREE.Group();grp.position.set(x,y,z);Q.add(grp);
  const a=new THREE.Mesh(g,mf),b=new THREE.Mesh(g,mb);a.frustumCulled=false;b.frustumCulled=false;a.castShadow=true;grp.add(a,b);
  const o={g,base,grp,h,ph:ph||0,k:kk||1};cloths.push(o);return o};
 mkCloth(.8,.9,10,12,KF,RdB,.16,0,-.25,-.4,TG,2.2,1.2).grp.rotation.x=.1;
 [-1,1].forEach((s,i)=>{mkCloth(.12,.62,3,8,ObF,ObB,.05,s*.07,.06,-.31,TG,i*1.9+.5,1.2).grp.rotation.x=.12;
  const c=mkCloth(.5,.95,6,10,KF,RdB,.14,s*.46,.58,-.03,TG,i*1.7+.4,1.1);c.grp.rotation.set(0,s*.35,s*.05);
  const d=mkCloth(.46,.85,6,9,KF,RdB,.12,s*.5,.54,.04,TG,i*2.3+1.2,1);d.grp.rotation.set(-.05,s*(PI/2-.2),0)});
 // ---- سر ----
 const HD=new THREE.Group();HD.position.set(0,.8,0);TG.add(HD);B(Cy(.075,.09,.2,12),Sk,0,0,0,HD);
 const hr=.225,hy=.2;B(GX.ashape(new THREE.SphereGeometry(hr,44,32),hr).scale(1,1.08,1.02),Sk,0,hy,0,HD);
 B(GX.ashape(new THREE.SphereGeometry(hr*1.008,36,26,PI/2-.5,1,1.07,1),hr).scale(1,1.08,1.02),M(0xffffff,{map:GX.facePr({skin:0xf3d2c2,hi:'#f9e0d2',ex:50}),roughness:.6,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),0,hy,0,HD);
 B(S(.032,.85,1.5,1.2),Sk,0,hy-.03,hr*1.02,HD);
 // موی مشکی: کلاهک، حجم پشت سر، جمع‌شدهٔ بالای سر و چتری صاف
 B(new THREE.SphereGeometry(hr*1.09,28,18,0,TAU,0,1.12).scale(1,1.08,1.05),Hr,0,hy+.01,-.012,HD);
 B(S(.235,1,.95,.9),Hr3,0,hy-.04,-.08,HD);B(S(.12,1,1,1),Hr,0,hy+.24,-.06,HD);B(S(.075,1,.8,1),Hr2,0,hy+.3,-.06,HD);
 for(let i=0;i<9;i++){const x0=(i-4)*.045,ln=.07+.03*((i*.618)%1);Sd(HD,i%2?Hr2:Hr,[[x0*.8,hy+.2,.1],[x0*1.1,hy+.14,.2],[x0*1.25,hy-ln*.2,.235],[x0*1.28,hy-ln,.226]],.036,.01,10)}
 // سنجاق‌ها و تاج طلایی
 const CR=new THREE.Group();CR.position.set(0,hy+.17,-.07);HD.add(CR);
 B(Tr(.25,.012,26,PI*1.1),Au,0,0,0,CR).rotation.set(0,0,PI*-.05);
 const cA=[],cG=[];
 for(let i=0;i<11;i++){const a=(i-5)/5*1.25,ln=.12+.09*(1-Math.abs(a)/1.25)+.03*(i%2);cA.push(D(Cn(.018,ln,4),Math.sin(a)*.26,Math.cos(a)*.14+.05,-.02+(Math.abs(a))*-.02,0,0,-a*.9))}
 cG.push(D(Oc(.03,1,1.5,.6),0,.22,-.02),D(Oc(.02,1,1.4,.6),Math.sin(.6)*.26,.17,-.02),D(Oc(.02,1,1.4,.6),-Math.sin(.6)*.26,.17,-.02));
 for(let i=0;i<9;i++){const a=(i-4)/4*1.1;cA.push(D(Sm(.011),Math.sin(a)*.255,Math.cos(a)*.03-.03,.0))}
 MG(CR,Au,cA);MG(CR,Gm,cG);
 [-1,1].forEach(s=>{const f=new THREE.Group();f.position.set(s*.17,hy+.2,.1);HD.add(f);
  for(let k=0;k<5;k++){const a=k/5*TAU;B(S(.04,1,.55,1.2),Rd,Math.sin(a)*.03,Math.cos(a)*.03,.0,f).rotation.z=-a}
  B(S(.022,1,1,1),Au,0,0,.02,f);MG(f,Au,[0,1,2,3,4,5].map(k=>D(Sm(.008),Math.sin(k)*.055,Math.cos(k)*.055,0)))});
 // ---- موها و منگوله‌ها (هر رشته دو مفصل) ----
 const HG=[];
 const strand2=(Q,m,root,up,lo,r0,r1,r2,ph,k)=>{const pg=new THREE.Group();pg.position.set(root[0],root[1],root[2]);Q.add(pg);
  Sd(pg,m,up,r0,r1,10);const mid=up[up.length-1],pg2=new THREE.Group();pg2.position.set(mid[0],mid[1],mid[2]);pg.add(pg2);
  Sd(pg2,m,lo,r1,r2,12);const e={pg,pg2,ph,k:k||1};HG.push(e);return e};
 for(let i=0;i<24;i++){const a=(i-11.5)/11.5*1.3,ph=i*1.37,L=1+.4*((i*.618)%1),ox=Math.sin(a),root=[ox*.16,hy-.01,-Math.cos(a)*.15-.03],m=i%3===0?Hr2:i%3===1?Hr:Hr3;
  strand2(HD,m,root,[[0,0,0],[ox*.06,-.2*L,-.07],[ox*.12+Math.sin(ph)*.03,-.42*L,-.13]],
   [[0,0,0],[ox*.08+Math.sin(ph*1.3)*.06,-.4*L,-.04],[ox*.14+Math.sin(ph*2)*.1,-.82*L,-.03],[ox*.12+Math.sin(ph*2.7)*.14,-1.22*L,.0]],.085,.055,.014,ph,1)}
 for(let i=0;i<8;i++){const s=i%2?1:-1,ph=i*2.1+.5;
  strand2(HD,Hr2,[s*(.14+i*.012),hy+.02-i*.02,-.1],[[0,0,0],[s*.1,-.1,-.1],[s*.18,-.25,-.14]],[[0,0,0],[s*.1,-.2,-.06],[s*.14+Math.sin(ph)*.1,-.5,.0],[s*.12+Math.sin(ph*1.7)*.13,-.8,.02]],.022,.014,.006,ph,2.4)}
 [-1,1].forEach((s,i)=>{strand2(HD,i?Hr:Hr2,[s*.2,hy-.01,.06],[[0,0,0],[s*.05,-.2,.06],[s*.08,-.42,.13]],[[0,0,0],[s*.03,-.22,.08],[s*.03,-.46,.05],[s*.04,-.7,.02]],.05,.035,.012,i*2.3+.7,.7);
  strand2(HD,Hr,[s*.17,hy+.03,.1],[[0,0,0],[s*.04,-.18,.07],[s*.06,-.36,.13]],[[0,0,0],[s*.02,-.18,.06],[s*.01,-.36,.02]],.04,.028,.01,i*1.9+2,.7)});
 // منگوله‌های طلایی آویز از تاج (دو طرف صورت) و منگوله‌های اوبی
 const tassel=(e,m,len)=>{const q=e.pg2;B(Cn(.024,.13,7),Au,0,-len-.03,0,q);B(Cy(.012,.012,.05,6),Rc,0,-len+.05,0,q);B(Sm(.017),Au,0,-len+.09,0,q)};
 [-1,1].forEach((s,i)=>{[0,1].forEach(j=>{const ph=i*1.7+j*2.4,e=strand2(HD,Au,[s*(.25+j*.03),hy+.08,.04],[[0,0,0],[s*.01,-.12,.02],[s*.015,-.26,.03]],[[0,0,0],[s*.01,-.2,.0],[s*.015,-.42-j*.1,.0]],.008,.007,.006,ph,.5);tassel(e,Au,.42+j*.1);
   B(Sm(.014),Au,s*(.25+j*.03),hy+.08,.04,HD)})});
 [-1,1].forEach((s,i)=>{[0,1].forEach(j=>{const ph=i*1.3+j*2.7,e=strand2(TG,Rc,[s*(.15+j*.09),.12,.23],[[0,0,0],[s*.01,-.25,.04],[s*.01,-.5,.07]],[[0,0,0],[s*.01,-.2,.04],[s*.012,-.4-j*.08,.05]],.017,.014,.011,ph,.6);tassel(e,Au,.4+j*.08)})});
 // ---- بازوها ----
 const mkArm=s=>{const A=new THREE.Group();A.position.set(s*.38,.6,0);TG.add(A);
  Sd(A,Kf,[[0,0,0],[0,-.19,0],[0,-.38,0]],.07,.06,8);
  const E=new THREE.Group();E.position.set(0,-.38,0);A.add(E);B(S(.062,1,1,1),Kf,0,0,0,E);
  Sd(E,Sk,[[0,0,0],[0,-.18,0],[0,-.36,0]],.058,.042,8);B(Tr(.052,.01,14),Au,0,-.34,0,E).rotation.x=PI/2;
  B(S(.05,1,1.2,.9),Sk,0,-.42,0,E);
  if(s>0)[-.025,-.008,.008,.025].forEach((x,i)=>Sd(E,Sk,[[x,-.44,0],[x,-.5-(i%2)*.01,.012],[x,-.55-(i%2)*.01,.035]],.011,.007,6));
  return{A,E}};
 const RA=mkArm(-1),LA=mkArm(1);
 // ---- کاتانا: تیغهٔ خمیده، دستهٔ مشکی با لوزی طلایی، گارد گرد و منگولهٔ سرخ ----
 const bladeShape=(len,w0,w1,curve,edge)=>{const sh=new THREE.Shape(),N=12,Lf=[],Rg=[];
  for(let i=0;i<=N;i++){const s=i/N,y=-.19-len*s,cx=curve*s*s,w=(w0+(w1-w0)*s)/2;Lf.push([edge?cx+w*.3:cx-w,y]);Rg.push([cx+w,y])}
  sh.moveTo(Lf[0][0],Lf[0][1]);for(let i=1;i<=N;i++)sh.lineTo(Lf[i][0],Lf[i][1]);sh.lineTo(curve+.004,-.19-len-.07);for(let i=N;i>=0;i--)sh.lineTo(Rg[i][0],Rg[i][1]);sh.closePath();return sh};
 const bgO=new THREE.ExtrudeGeometry(bladeShape(1,.05,.04,.09,false),{depth:.022,bevelEnabled:false});bgO.translate(0,0,-.011);
 const bgE=new THREE.ExtrudeGeometry(bladeShape(1,.05,.04,.09,true),{depth:.027,bevelEnabled:false});bgE.translate(0,0,-.0135);
 const SWD=new THREE.Group();SWD.position.set(0,-.5,0);RA.E.add(SWD);
 B(Cy(.026,.026,.34,10),Bk,0,.02,0,SWD);for(let i=0;i<4;i++)B(Tr(.0285,.007,10),Au,0,-.08+i*.07,0,SWD).rotation.x=PI/2;
 B(S(.034,1,.9,1),Au,0,.2,0,SWD);B(S(.018,1,1,1),Gm,0,.2,.03,SWD);
 B(Cy(.09,.09,.014,22),Au,0,-.17,0,SWD);B(Tr(.088,.009,22),Au,0,-.17,0,SWD).rotation.x=PI/2;B(Oc(.02,1,1.2,.6),Gm,0,-.17,.09,SWD);
 B(Cy(.032,.032,.04,10),Au,0,-.2,0,SWD);
 B(bgO,St,0,0,0,SWD);B(bgE,Sv,0,0,0,SWD);
 for(let i=0;i<4;i++)B(Tr(.034,.011,10),Sk,0,-.04+i*.03,0,SWD).rotation.x=PI/2;
 Sd(SWD,Rc,[[0,.2,.03],[.02,.1,.06],[.035,-.02,.07],[.03,-.14,.06]],.012,.008,8);
 const SWt=strand2(SWD,Rc,[0,.2,-.03],[[0,0,0],[.015,-.1,-.03],[.02,-.2,-.04]],[[0,0,0],[.01,-.12,-.03],[.015,-.26,-.03]],.016,.014,.012,.9,.5);tassel(SWt,Au,.28);
 // ---- رد برش نورانی ----
 const trG=(()=>{const N=22,pos=[],idx=[],p0=[-.7,1.05],p1=[.2,1.15],p2=[1.2,-.5];for(let i=0;i<=N;i++){const s=i/N,x=(1-s)*(1-s)*p0[0]+2*(1-s)*s*p1[0]+s*s*p2[0],y=(1-s)*(1-s)*p0[1]+2*(1-s)*s*p1[1]+s*s*p2[1],
  tx=2*(1-s)*(p1[0]-p0[0])+2*s*(p2[0]-p1[0]),ty=2*(1-s)*(p1[1]-p0[1])+2*s*(p2[1]-p1[1]),l=Math.hypot(tx,ty)||1,nx=-ty/l,ny=tx/l,w=.2*Math.pow(Math.sin(PI*s),.7);
  pos.push(x+nx*w,y+ny*w,0,x-nx*w,y-ny*w,0);if(i<N)idx.push(2*i,2*i+1,2*i+2,2*i+1,2*i+3,2*i+2)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);return g})();
 const TRM=new THREE.MeshBasicMaterial({color:0xffc0cc,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}),
  pvT=new THREE.Group(),TRL=new THREE.Mesh(trG,TRM);pvT.position.set(-.4,.62,0);pvT.rotation.z=-.55;TG.add(pvT);TRL.rotation.y=-PI/2;TRL.visible=false;pvT.add(TRL);ghost(TRL);
 // ---- جزئیات ریز (تکه‌های ادغام‌شده تا فشار گرافیکی کم بماند) ----
 try{(()=>{
  const sn=Math.sin,cs=Math.cos,aT=[],gT=[],rT=[],kT=[];
  // گل‌دوزی و منجوق روی دامن (دور از شکاف)
  [-.12,-.22,-.32,-.42,-.52,-.62,-.72,-.82,-.92].forEach((y,row)=>{const r=skR(y)*1.045,n=Math.round(r*TAU/.15);
   for(let k=0;k<n;k++){const a=(k+(row%2?.5:0))/n*TAU,aa=((a+.05)%TAU+TAU)%TAU;if(aa<.82)continue;const x=sn(a)*r,z=cs(a)*r*.92;
    if((k+row)%3===0)gT.push(D(Oc(.017,1,1.5,.6),x,y,z,0,a,0));else if((k+row)%3===1)aT.push(D(Sm(.013),x,y,z));else rT.push(D(Sm(.011),x,y,z))}});
  // لبهٔ دامن: میخ‌های طلایی
  for(let i=0;i<34;i++){const a=i/34*TAU,aa=((a+.05)%TAU+TAU)%TAU;if(aa<.82)continue;aT.push(D(Oc(.016,1,1.5,.6),sn(a)*.51,-.985,cs(a)*.51*.92,0,a,0))}
  // کمرگاه و اوبی: ردیف مهره
  for(let i=0;i<26;i++){const a=i/26*TAU;aT.push(D(Sm(.01),sn(a)*.232,.0,cs(a)*.232*.9),D(Sm(.01),sn(a)*.232,.26,cs(a)*.232*.9))}
  // یقه و کرست: دکمه‌ها
  for(let i=0;i<8;i++){aT.push(D(Sm(.009),sn(i*.8)*.17,.34+i*.03,cs(i*.8)*.14))}
  // گلبرگ‌های سنجاق، دور گل کمر
  for(let k=0;k<10;k++){const a=k/10*TAU;gT.push(D(Sm(.01),sn(a)*.075,.14+cs(a)*.075,.25))}
  // سردوشی و بازوبند
  [-1,1].forEach(s=>{for(let k=0;k<8;k++){const a=k/8*TAU;aT.push(D(Sm(.01),s*.38+sn(a)*.085,.6,cs(a)*.085))}});
  MG(TG,Au,aT);MG(TG,Gm,gT);MG(TG,Rc,rT);
  // پاها: میخ‌های گِتا، مهره‌های پابند
  legs.forEach((o,li)=>{const aK=[],rK=[];for(let k=0;k<8;k++){const a=k/8*TAU;aK.push(D(Sm(.009),sn(a)*.068,-.37,cs(a)*.068))}
   [-1,1].forEach(q=>[-.06,.02,.1,.18].forEach(z=>aK.push(D(Sm(.011),q*.092,-.54,z))));for(let k=0;k<5;k++)rK.push(D(Sm(.008),(k-2)*.026,-.46,.11));MG(o.K,Au,aK);MG(o.K,Rc,rK);
   if(li){const aL=[];for(let k=0;k<10;k++){const a=k/10*TAU;aL.push(D(Sm(.009),sn(a)*.1,-.2,cs(a)*.1))}MG(o.L,Au,aL)}});
  // بازوها: مچ‌بند و برجستگی‌ها
  [RA,LA].forEach(ar=>{const aE=[];for(let k=0;k<8;k++){const a=k/8*TAU;aE.push(D(Sm(.009),sn(a)*.056,-.34,cs(a)*.056),D(Sm(.008),sn(a)*.07,-.1,cs(a)*.07))}MG(ar.E,Au,aE)});
  // تاج: دانه‌ها و گل‌های کوچک سرخ
  const aH=[],gH=[];for(let i=0;i<14;i++){const a=(i-6.5)/6.5*1.2;aH.push(D(Sm(.009),sn(a)*.235,hy+.14+.03*cs(a),cs(a)*.235-.07))}
  [-1,1].forEach(s=>{aH.push(D(Sm(.014),s*.222,hy-.06,.03),D(Cy(.003,.003,.05,4),s*.222,hy-.095,.03));gH.push(D(Oc(.014,1,1.7,.6),s*.222,hy-.14,.03))});
  MG(HD,Au,aH);MG(HD,Gm,gH);
  // کاتانا: لوزی‌های طلایی روی دسته و شیار تیغه
  const aW=[],kW=[];for(let k=0;k<7;k++){[-1,1].forEach(q=>aW.push(D(Oc(.014,1,1.7,.5),q*.0265,-.1+k*.04,0),D(Oc(.014,1,1.7,.5),0,-.1+k*.04,q*.0265)));kW.push(D(Tr(.0275,.004,10),0,-.1+k*.04,0,PI/2))}
  MG(SWD,Au,aW);MG(SWD,Rc,kW);
 })()}catch(err){console.error('pri detail',err)}
 // ---- انیمیشن ----
 const IDLE=[-.25,.22,-.6,-.15,.42],WU=[-2.5,.55,-.9,-3.3,.3],SK=[-1.4,-.55,-.4,-1.0,-.3];
 const BI=[0,0,0],BW=[.55,-.07,-.1],BS=[-.5,.3,.2];
 const TIM={n:{wu:.2,st:.14,ho:.04,rc:.42},q:{wu:.12,st:.1,ho:0,rc:.24}},TT=sl=>TIM[sl.q?'q':'n'];
 const SL=[],SW={x:0,vx:0,z:0,vz:0,px:0,py:0,pz:0,lt:-1,ok:0},ST={h0:-1e9,d0:-1e9,dead:0};let dmats=null;
 const armPose=(sl,e)=>{const T=TT(sl),a=ez(e/T.wu),b=ez((e-T.wu)/T.st),c=ez((e-T.wu-T.st-T.ho)/T.rc);return mix(mix(mix(IDLE,WU,a),SK,b),IDLE,c)};
 const bodyPose=(sl,e)=>{const T=TT(sl),a=ez(e/T.wu),b=ez((e-T.wu)/T.st),c=ez((e-T.wu-T.st-T.ho)/T.rc);return mix(mix(mix(BI,BW,a),BS,b),BI,c)};
 const clothAnim=(c,t,sx,sz)=>{const a=c.g.attributes.position.array,b=c.base,n=a.length/3;
  for(let k=0;k<n;k++){const bx=b[k*3],by=b[k*3+1],v=Math.max(0,Math.min(1,-by/c.h)),d=Math.pow(v,1.3),sa=Math.sin(t*1.7+v*3.4+bx*3+c.ph),sb=Math.sin(t*3+v*6+bx*5+c.ph);
   a[k*3]=bx*(1+d*.04*sa)+d*(sx*.7+.02*sb)*c.k;a[k*3+1]=by+d*.02*sb-d*Math.abs(sz)*.05;a[k*3+2]=b[k*3+2]+d*(.04+.04*sa+cl(sz,.55)*.9)*c.k}
  c.g.attributes.position.needsUpdate=true;c.g.computeVertexNormals()};
 GX.anim(G,t=>{const now=performance.now(),dt=SW.lt<0?.016:Math.min(.05,Math.max(.001,t-SW.lt));SW.lt=t;
  const br=Math.sin(t*1.5),el=G.matrixWorld.elements;
  for(let i=SL.length-1;i>=0;i--){const T=TT(SL[i]);if((now-SL[i].t0)/1000>T.wu+T.st+T.ho+T.rc)SL.splice(i,1)}
  let newest=null;SL.forEach(sl=>{const e=(now-sl.t0)/1000;if(e>=0&&(!newest||sl.t0>newest.sl.t0))newest={sl,e}});
  const bp=newest?bodyPose(newest.sl,newest.e):BI;
  let lx=0,lz=0;if(SW.ok){const vx=(el[12]-SW.px)/dt,vy=(el[13]-SW.py)/dt,vz=(el[14]-SW.pz)/dt,ax=el[0]*el[0]+el[1]*el[1]+el[2]*el[2]||1,az=el[8]*el[8]+el[9]*el[9]+el[10]*el[10]||1;lx=(vx*el[0]+vy*el[1]+vz*el[2])/ax;lz=(vx*el[8]+vy*el[9]+vz*el[10])/az}
  SW.px=el[12];SW.py=el[13];SW.pz=el[14];SW.ok=1;
  const eh=(now-ST.h0)/1000,hur=!ST.dead&&eh>=0&&eh<.6?Math.sin(Math.min(1,eh/.16)*PI/2)*(1-ez((eh-.16)/.44)):0;
  const tx=cl(-lx*.1-bp[0]*.25,.45),tz=cl(-lz*.1-Math.max(0,bp[1])*.9-hur*.5,.6);
  SW.vx+=((tx-SW.x)*45-SW.vx*4.2)*dt;SW.x+=SW.vx*dt;SW.vz+=((tz-SW.z)*45-SW.vz*4.2)*dt;SW.z+=SW.vz*dt;
  G.position.set(0,.01*Math.sin(t*2)-.04*Math.max(0,bp[1]),bp[1]-hur*.14);
  legs[0].L.rotation.set(.06-bp[1]*.9,0,.02);legs[0].K.rotation.x=.03;legs[1].L.rotation.set(-.14+bp[1]*.6,0,-.06);legs[1].K.rotation.x=.1;
  TG.rotation.set(bp[2]-hur*.4+.008*br,bp[0],.01*Math.sin(t*.6)+hur*.08);TG.scale.y=1+.006*br;
  HD.rotation.set(-bp[2]*.4+hur*.55+.02*Math.sin(t*.5),-bp[0]*.5+.06*Math.sin(t*.37),.02*Math.sin(t*.43+2));
  const p=newest?armPose(newest.sl,newest.e):IDLE;
  RA.A.rotation.set(p[0]-hur*.3+.015*Math.sin(t*.9),0,-p[1]);RA.E.rotation.set(p[2],0,0);SWD.rotation.set(p[3]-(p[0]+p[2]),0,-p[4]);
  LA.A.rotation.set(-.1-bp[0]*.5-hur*.2+.015*Math.sin(t*.9+1),0,.2+bp[0]*.1);LA.E.rotation.set(-.25,0,0);
  HG.forEach(o=>{const w=Math.sin(t*1.3+o.ph);o.pg.rotation.set((.04*w+SW.z*.3-bp[2]*.25-hur*.3)*o.k,0,(.035*Math.sin(t*1.1+o.ph*.7)+SW.x*.5+bp[0]*.2)*o.k);
   o.pg2.rotation.set((.07*Math.sin(t*1.7+o.ph+1)+SW.z*.4)*o.k,0,(.06*Math.sin(t*1.4+o.ph*.6)+SW.x*.5)*o.k)});
  BOW.rotation.set(.03*Math.sin(t*1.2),0,.04*Math.sin(t*.9));
  cloths.forEach(c=>clothAnim(c,t,SW.x,SW.z));
  let op=0;if(newest&&!ST.dead){const T=TT(newest.sl),k=(newest.e-T.wu)/(T.st+.14);if(k>0&&k<1){op=Math.pow(Math.sin(k*PI),.6)*(newest.sl.q?.7:.85);TRL.visible=true;TRM.opacity=op;TRL.scale.setScalar((newest.sl.q?.85:1)*(.85+.25*k))}}
  if(!op){TRL.visible=false;TRM.opacity=0}
  if(ST.dead){const e=(now-ST.d0)/1000,a=ez(e/.3),b=ez((e-.25)/.55),c=ez((e-.75)/.65);
   G.position.set(0,-.62*b-.03*c,-.2*a-.3*c);
   legs.forEach((o,i)=>{o.L.rotation.set(-1.0*b*(i?1:.9),0,0);o.K.rotation.x=2.4*b});
   TG.rotation.set(-.4*a+.45*b-1.35*c,0,.14*a*(1-c));HD.rotation.set(.45*a-.3*b+.5*c,0,.18*a*(1-c));
   RA.A.rotation.set(-.3*a+.2*b+.3*c,0,-(.5+.4*b+.5*c));RA.E.rotation.set(-.3-.3*b,0,0);SWD.rotation.set(.5*b,0,-(.5+.7*c));
   LA.A.rotation.set(-.4*a+.2*c,0,.5+.7*c);LA.E.rotation.set(-.3*b,0,0);
   if(e>1.35&&dmats){const o=Math.max(0,1-ez((e-1.35)/.9));dmats.forEach(m=>{m.transparent=true;m.opacity=o})}}});
 // slash(q,تأخیر): ضربهٔ کاتانا؛ q=ضربهٔ سریع (قابلیت). مقدار برگشتی = میلی‌ثانیه تا لحظهٔ برخورد
 G.userData.pri={slash:(q,delay)=>{const d=delay||0,T=TIM[q?'q':'n'];if(!ST.dead)SL.push({t0:performance.now()+d,q:!!q});return d+(T.wu+T.st*.5)*1000},
  hurt:()=>{if(!ST.dead)ST.h0=performance.now()},
  die:()=>{if(ST.dead)return;ST.dead=1;ST.d0=performance.now();dmats=new Set();G.traverse(o=>{if(o.material)[].concat(o.material).forEach(m=>dmats.add(m))})}};
 G.userData.priParts=PC.n;
 return G}
/* مدل ساده‌ی پشتیبان (فقط اگر ساخت مدل اصلی خطا بدهد) */
function priSafe(M){const G=new THREE.Group(),a=(g,c,y,z)=>{const m=new THREE.Mesh(g,M(c,{roughness:.6}));m.position.set(0,y,z||0);G.add(m)};
 a(new THREE.CylinderGeometry(.22,.46,1.5,18),0x1d0b10,.9);a(new THREE.SphereGeometry(.22,18,14),0xf3d2c2,1.85);a(new THREE.SphereGeometry(.26,18,14),0x0b080c,1.88,-.08);return G}
GX.reg('pri',gxPri,priSafe);
function prFig(g){const i=g&&g.children[0];return i&&i.children.find(o=>o.userData&&o.userData.pri)}
SFX.priDie=()=>{os('sine',520,160,.9,.3,0);os('triangle',700,240,1.1,.2,.05);nz(.5,'lowpass',2000,260,1,.5,0);os('sine',180,60,.8,.5,.3)};
/* ضربه: کاتانا با رد نورانی و گلبرگ سرخ؛ واکنش آسیب‌دیدن */
(function(){const _hf=hitFX;hitFX=function(a,t,d){
 try{
  if(a.k==='pri'&&a!==t){const ga=unitG.get(a),gt=unitG.get(t),f=prFig(ga);
   if(f&&gt){const own=!!CX&&CX.a===a,ab=own&&CX.ab,i=own?(CX.ax|0):0;if(own)CX.ax=i+1;
    if(!ab){const dx=gt.position.x-ga.position.x,dz=gt.position.z-ga.position.z;if(dx||dz){ga.userData.fy=Math.atan2(dx,dz);ga.userData.hf=1;ga.userData.ft=2}}
    const ms=f.userData.pri.slash(ab,ab?i*210:0),P0=gt.position.clone();
    setTimeout(()=>{try{const p=P0.clone().add(new THREE.Vector3(0,.95,0));
     burst(p,ab?12:20,0xffe9ee,{sp:4.2,size:.14,life:.28,g:3,y:0,r:.1,h:.1});burst(p,ab?10:15,0xd8203c,{sp:3.2,size:.2,life:.4,g:5,y:0,r:.12,h:.1});
     if(d>0)ring(new THREE.Vector3(P0.x,0,P0.z),0xff6a82,ab?1.5:1.3,.35,.15);shk=Math.max(shk,ab?.35:.3)}catch(e){}},ms)}}
  if(t.k==='pri'&&t.hp>0&&a!==t){const f=prFig(unitG.get(t));
   if(f){const q=t.vq&&t.vq.length?t.vq[t.vq.length-1].at-performance.now():0;setTimeout(()=>{try{f.userData.pri.hurt()}catch(e){}},Math.max(0,q))}}
 }catch(e){console.error('priFX',e)}
 return _hf(a,t,d)}})();
/* مرگ: انیمیشن افتادن، پاشیدن گلبرگ و محو شدن، سپس حذف مدل */
function priDie(u,g){const d=g.userData;d.dgDie=1;unitG.delete(u);d.pick.forEach(m=>{const i=pickables.indexOf(m);if(i>=0)pickables.splice(i,1)});
 if(d.last>0)popup('-'+PX(Math.round(d.last)),g.position,'#ff5a4d');
 try{d.lb.sp.visible=false;d.shield.visible=false;d.cage.visible=false;d.hack.visible=false;if(d.aura)d.aura.visible=false;if(d.bm)d.bm.forEach(b=>b.visible=false)}catch(e){}
 const f=prFig(g),m=f&&f.userData.pri,P0=g.position.clone(),T=(fn,ms)=>setTimeout(()=>{try{fn()}catch(e){}},ms);
 if(m)m.die();try{SFX.priDie()}catch(e){}
 if(FXI){T(()=>{shk=Math.max(shk,.4)},80);
  [0,1,2,3,4,5].forEach(i=>T(()=>{burst(P0.clone().add(new THREE.Vector3((rd()-.5)*.7,.6+rd()*1.4,(rd()-.5)*.7)),8,i%2?0xd8203c:0xffe9ee,{sp:1.6,vy:1.2,g:-.4,size:.3,life:.9,y:0,r:.3,up:1})},500+i*140));
  T(()=>{const Z=new THREE.Vector3(P0.x,0,P0.z);ring(Z,0xff6a82,2.4,.7,.14);burst(P0,26,0xe83a56,{sp:2.6,vy:2.6,g:-.6,size:.35,life:1,y:.4,r:.5})},1500)}
 setTimeout(()=>{try{scene.remove(g);g.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){if(o.material.map)o.material.map.dispose();o.material.dispose()}})}catch(e){}},2500)}
(function(){const _s=syncUnits;syncUnits=function(){
 try{for(const [u,g] of [...unitG]){if(!U.includes(u)&&u.hp<=0&&u.k==='pri'&&!g.userData.dgDie&&(phase!=='play'||(vhp(u),!u.vq)))priDie(u,g)}}catch(e){console.error('priDie',e)}
 return _s()}})();
/* ===== ارتقای جزئیات و بافت اسکین‌ها (همهٔ اسکین‌های زیر ۶۰۰ تکه) =====
 هر اسکین بعد از ساخته‌شدن، تعدادی تکهٔ ریز (گل‌میخ، پرچ، بخیه، خار/پولک) روی سطح قطعه‌های خودش می‌گیرد
 تا مجموعِ تکه‌ها به ۶۰۰ برسد؛ تکه‌ها به قطعهٔ پدرشان می‌چسبند (با دست و پا حرکت می‌کنند) و ادغام می‌شوند تا فشار گرافیکی کم بماند.
 جدول CFG: [تعداد تکهٔ افزوده، حالت]  حالت ۰=فقط فلز/چرم/پارچه، ۱=استخوان هم، ۲=پولک و خار (اژدها)
 بافت: برای مواد بدون نقشه، بامپ‌مپِ مناسب (خراش فلز، دانهٔ چرم، منفذ، پولک، ترک استخوان) اضافه می‌شود. */
(()=>{
 const CFG={ali:[237,0],mak:[157,0],cri:[209,0],doj:[151,0],skl:[429,1],fd:[160,2],ft:[160,2],acro:[137,0],raf:[148,0],pri:[180,0]};
 const BT={},T0={};
 const bump=k=>BT[k]||(BT[k]=GX.tex(128,128,(x,w,h)=>{
  let sd=7;const R=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
  x.fillStyle='#808080';x.fillRect(0,0,w,h);
  if(k==='scratch'){for(let i=0;i<110;i++){const a=R()*.5+(i%7?0:1.2),X=R()*w,Y=R()*h,L=8+R()*40;x.strokeStyle=R()<.5?'rgba(255,255,255,.35)':'rgba(0,0,0,.35)';x.lineWidth=.5+R()*1.2;x.beginPath();x.moveTo(X,Y);x.lineTo(X+Math.cos(a)*L,Y+Math.sin(a)*L);x.stroke()}
   for(let i=0;i<14;i++){const g=x.createRadialGradient(0,0,0,0,0,6);g.addColorStop(0,'rgba(0,0,0,.5)');g.addColorStop(1,'rgba(0,0,0,0)');x.save();x.translate(R()*w,R()*h);x.fillStyle=g;x.beginPath();x.arc(0,0,6,0,7);x.fill();x.restore()}}
  else if(k==='grain'){for(let i=0;i<1100;i++){x.fillStyle=R()<.5?'rgba(0,0,0,.28)':'rgba(255,255,255,.22)';x.beginPath();x.arc(R()*w,R()*h,.6+R()*1.3,0,7);x.fill()}
   x.strokeStyle='rgba(0,0,0,.25)';x.lineWidth=1;for(let i=0;i<18;i++){let X=R()*w,Y=R()*h;x.beginPath();x.moveTo(X,Y);for(let j=0;j<4;j++){X+=R()*20-10;Y+=R()*20-10;x.lineTo(X,Y)}x.stroke()}}
  else if(k==='pore'){for(let i=0;i<650;i++){x.fillStyle=R()<.65?'rgba(0,0,0,.22)':'rgba(255,255,255,.14)';x.beginPath();x.arc(R()*w,R()*h,.5+R()*.9,0,7);x.fill()}}
  else if(k==='scales'){const S=16;for(let r=-1;r<h/S*1.2+1;r++)for(let c=-1;c<w/S+1;c++){const X=c*S+(r%2?S/2:0),Y=r*S*.8,g=x.createRadialGradient(X,Y,1,X,Y,S*.62);g.addColorStop(0,'#d6d6d6');g.addColorStop(.7,'#8a8a8a');g.addColorStop(1,'#303030');x.fillStyle=g;x.beginPath();x.arc(X,Y,S*.62,0,7);x.fill()}}
  else{for(let i=0;i<45;i++){let X=R()*w,Y=R()*h;x.strokeStyle='rgba(0,0,0,.4)';x.lineWidth=.8+R();x.beginPath();x.moveTo(X,Y);for(let j=0;j<5;j++){X+=R()*14-7;Y+=R()*14-4;x.lineTo(X,Y)}x.stroke()}
   for(let i=0;i<260;i++){x.fillStyle=R()<.6?'rgba(0,0,0,.2)':'rgba(255,255,255,.18)';x.beginPath();x.arc(R()*w,R()*h,.5+R()*1.6,0,7);x.fill()}}
 },0,[3,3]));
 const cls=m=>{
  if(!m||m.isMeshBasicMaterial||m.transparent||m.map||(m.emissive&&m.emissive.r+m.emissive.g+m.emissive.b>.3))return null;
  if(m.metalness>=.45)return 'metal';
  if(m.roughness<.12)return null;
  if(m.sheen>0||m.roughness>=.85)return 'cloth';
  if(m.metalness===0&&m.clearcoat>.3&&m.clearcoat<.9&&m.clearcoatRoughness>=.27)return 'leather';
  return 'skin'};
 const TPL=()=>{if(!T0.s)Object.assign(T0,{s:new THREE.SphereGeometry(1,6,5),b:new THREE.BoxGeometry(2.4,.5,.7),y:new THREE.CylinderGeometry(1,1,.5,7),c:new THREE.ConeGeometry(1,2.8,5),o:new THREE.OctahedronGeometry(1)});return T0};
 function detail(G,cfg,key){
  const N=cfg[0],mode=cfg[1],V=THREE.Vector3;let sd=key.length*131+17;const R=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
  const bb=new THREE.Box3().setFromObject(G),H=Math.max(.5,bb.max.y-bb.min.y),src=[];let tot=0;
  G.traverse(o=>{if(!o.isMesh||!o.parent||o.userData.keep||o.frustumCulled===false||Array.isArray(o.material))return;
   const m=o.material,c=cls(m);if(!c)return;if(c==='skin'&&!mode)return;
   const ps=o.geometry&&o.geometry.attributes&&o.geometry.attributes.position;if(!ps||ps.count<24)return;
   if(!m.bumpMap&&!m.userData.bd){m.userData.bd=1;m.bumpMap=bump(c==='metal'?'scratch':c==='leather'?'grain':c==='skin'?(mode===2?'scales':mode===1?'bone':'pore'):'pore');m.bumpScale=c==='metal'?1.6:1.2;m.needsUpdate=true}
   if(c==='cloth'&&mode===0&&m.bumpMap&&m.bumpMap!==BT.pore&&false)return;
   src.push({o,m,c,ps,nr:o.geometry.attributes.normal,w:ps.count});tot+=ps.count});
  if(!src.length)return;
  const T=TPL(),grp=new Map();
  for(let n=0;n<N;n++){let r=R()*tot,e=src[0];for(const s of src){r-=s.w;if(r<=0){e=s;break}}
   const i=Math.floor(R()*e.ps.count),o=e.o;o.updateMatrix();
   const p=new V(e.ps.getX(i),e.ps.getY(i),e.ps.getZ(i)).applyMatrix4(o.matrix);
   const nv=e.nr?new V(e.nr.getX(i),e.nr.getY(i),e.nr.getZ(i)):new V(0,1,0);nv.transformDirection(o.matrix);
   const s=H*.0065*(.7+.8*R());let tp,sc=new V(s,s,s);
   if(e.c==='metal')tp=R()<.6?T.s:T.o;else if(e.c==='cloth'){tp=T.b;sc.set(s*1.1,s*1.1,s*1.1)}else if(e.c==='leather')tp=T.y;else{tp=mode===2?T.c:T.s;if(mode===2)sc.set(s*1.5,s*1.5,s*1.5)}
   const q=new THREE.Quaternion().setFromUnitVectors(new V(0,1,0),nv).multiply(new THREE.Quaternion().setFromAxisAngle(new V(0,1,0),R()*6.283));
   p.addScaledVector(nv,s*.15);
   const g=tp.clone().applyMatrix4(new THREE.Matrix4().compose(p,q,sc)),g2=g.index?g.toNonIndexed():g,k=o.parent.uuid+e.m.uuid;
   let it=grp.get(k);if(!it){it={P:o.parent,m:e.m,L:[]};grp.set(k,it)}it.L.push(g2)}
  grp.forEach(it=>{let n=0;it.L.forEach(g=>n+=g.attributes.position.count);
   const P3=new Float32Array(n*3),N3=new Float32Array(n*3),U2=new Float32Array(n*2);let k=0;
   it.L.forEach(g=>{const c=g.attributes.position.count;P3.set(g.attributes.position.array,k*3);if(g.attributes.normal)N3.set(g.attributes.normal.array,k*3);if(g.attributes.uv)U2.set(g.attributes.uv.array,k*2);k+=c;g.dispose()});
   const mg=new THREE.BufferGeometry();mg.setAttribute('position',new THREE.BufferAttribute(P3,3));mg.setAttribute('normal',new THREE.BufferAttribute(N3,3));mg.setAttribute('uv',new THREE.BufferAttribute(U2,2));
   it.P.add(new THREE.Mesh(mg,it.m))});
  (window.__DET=window.__DET||{})[key]=N}
 Object.keys(CFG).forEach(k=>{const f=FIG[k];if(!f)return;
  FIG[k]=(M,t)=>{const g=f(M,t);try{detail(g,CFG[k],k)}catch(e){console.error('detail',k,e)}return g}})
})();
function rfFig(g){const i=g&&g.children[0];return i&&i.children.find(o=>o.userData&&o.userData.raf)}
SFX.rfDie=()=>{os('sine',420,100,1,.3,0);os('triangle',640,200,1.2,.2,.05);nz(.5,'lowpass',1800,250,1,.5,0);os('sine',160,60,.8,.5,.3)};
/* حمله: عصا با کریستال می‌درخشد و شعاع نور می‌زند؛ واکنش آسیب‌دیدن */
/* ===== آتش واقعی عصای رافائل: گلولهٔ آتشین، دنبالهٔ شعله، جرقه، انفجار و شعلهٔ ماندگار ===== */
function rfFlame(P,n,o){burst(P,n,0xffc040,Object.assign({fire:1,sp:.3,size:.5,life:.6,g:-3,vy:.5,up:.4,y:0,r:.12,h:.1},o||{}))}
function rfSpark(P,n,o){burst(P,n,0xffe9a0,Object.assign({spark:1,sp:1.6,size:.1,life:.8,g:5,vy:1.5,up:1,y:0,r:.1,h:.1},o||{}))}
/* ---- سامانهٔ آتش واقعی: زبانه‌های رو به بالا + دود تیره + نور پویا + جای سوختگی روی زمین ---- */
const RFQ=()=>window.__FXQ||1;
const RFT=GX.tex(128,128,(x,w,h)=>{
 const dr=(sx,sy)=>{x.beginPath();x.moveTo(w/2,h*(.02+sy));x.bezierCurveTo(w*(.5+.24*sx),h*.34,w*(.5+.38*sx),h*.62,w/2,h*.96);x.bezierCurveTo(w*(.5-.38*sx),h*.62,w*(.5-.24*sx),h*.34,w/2,h*(.02+sy));x.closePath()};
 [[1,0,.35],[.8,.06,.55],[.58,.16,.8],[.36,.3,1]].forEach(L=>{dr(L[0],L[1]);const g=x.createRadialGradient(w/2,h*.78,2,w/2,h*.72,h*.5*L[0]+8);g.addColorStop(0,'rgba(255,255,255,'+L[2]+')');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fill()});
 for(let i=0;i<9;i++){const X=w*(.3+Math.random()*.4),Y=h*(.15+Math.random()*.5),r=4+Math.random()*9,g=x.createRadialGradient(X,Y,0,X,Y,r);g.addColorStop(0,'rgba(255,255,255,.5)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.beginPath();x.ellipse(X,Y,r*.6,r*1.6,0,0,7);x.fill()}
 x.globalCompositeOperation='destination-in';const m=x.createRadialGradient(w/2,h*.58,w*.12,w/2,h*.55,w*.52);m.addColorStop(0,'#fff');m.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=m;x.fillRect(0,0,w,h);x.globalCompositeOperation='source-over'},1);
const RST=GX.tex(64,64,(x,w,h)=>{for(let i=0;i<7;i++){const X=w*(.3+Math.random()*.4),Y=h*(.3+Math.random()*.4),r=w*(.2+Math.random()*.2),g=x.createRadialGradient(X,Y,0,X,Y,r);g.addColorStop(0,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.beginPath();x.arc(X,Y,r,0,7);x.fill()}},1);
const RSC=GX.tex(128,128,(x,w,h)=>{const g=x.createRadialGradient(w/2,h/2,4,w/2,h/2,w/2);g.addColorStop(0,'rgba(15,8,4,.85)');g.addColorStop(.55,'rgba(25,14,8,.55)');g.addColorStop(1,'rgba(25,14,8,0)');x.fillStyle=g;x.fillRect(0,0,w,h);for(let i=0;i<14;i++){const a=Math.random()*6.28,r=w*(.18+Math.random()*.2);x.fillStyle='rgba(10,6,3,.5)';x.beginPath();x.ellipse(w/2+Math.cos(a)*r,h/2+Math.sin(a)*r,3+Math.random()*7,2+Math.random()*4,a,0,7);x.fill()}},1);
const RFX={f:[],s:[],on:0,last:0,L:null,Li:0,Lt:0,hold:0};
try{if(RFQ()>=.5){RFX.L=new THREE.PointLight(0xff7a2a,0,9,2);scene.add(RFX.L)}}catch(e){}
function rfLight(P,I,ms){if(!RFX.L)return;RFX.L.position.set(P.x,P.y+.4,P.z);RFX.Lt=I;RFX.hold=performance.now()+ms;rfRun()}
function rfSpawn(smoke,P,o){const arr=smoke?RFX.s:RFX.f,cap=smoke?30:50;let e=null;for(const q of arr)if(!q.on){e=q;break}
 if(!e){if(arr.length>=cap)return;const m=new THREE.Sprite(new THREE.SpriteMaterial({map:smoke?RST:RFT,transparent:true,depthWrite:false,blending:smoke?THREE.NormalBlending:THREE.AdditiveBlending,toneMapped:false,opacity:0}));m.renderOrder=smoke?4:6;m.raycast=()=>{};scene.add(m);e={m,on:0}}
 if(!e.m.parent)scene.add(e.m);if(arr.indexOf(e)<0)arr.push(e);
 e.on=1;e.t=0;e.sm=smoke;e.L=o.L;e.s0=o.s0;e.s1=o.s1;e.a=o.a==null?1:o.a;e.vx=o.vx||0;e.vy=o.vy||0;e.vz=o.vz||0;e.ay=o.ay||0;e.rot=rd()*6.283;e.rv=(rd()-.5)*1.2;e.w=rd()*6.283;
 if(smoke){const v=.12+rd()*.08;e.m.material.color.setRGB(v+.03,v,v-.02)}
 e.m.position.set(P.x,P.y,P.z);e.m.visible=true;rfRun()}
function rfRun(){if(RFX.on)return;RFX.on=1;RFX.last=performance.now();requestAnimationFrame(rfTick)}
function rfTick(){const n=performance.now(),dt=Math.min(.05,(n-RFX.last)/1000);RFX.last=n;let any=0;
 for(const arr of [RFX.f,RFX.s])for(const e of arr){if(!e.on)continue;any=1;e.t+=dt;const k=e.t/e.L;if(k>=1){e.on=0;e.m.visible=false;continue}
  e.vy+=e.ay*dt;const p=e.m.position,mt=e.m.material;
  if(!e.sm){e.vx+=Math.sin(e.t*9+e.w)*dt*1.5;e.vz+=Math.cos(e.t*8+e.w)*dt*1.5}else{e.vx*=1-dt*.6;e.vz*=1-dt*.6}
  p.x+=e.vx*dt;p.y+=e.vy*dt;p.z+=e.vz*dt;
  if(e.sm){const sz=e.s0+(e.s1-e.s0)*Math.sqrt(k);e.m.scale.set(sz,sz,1);mt.rotation=e.rot+e.rv*e.t;mt.opacity=e.a*(k<.15?k/.15:(1-k)/.85)}
  else{const q=fireRamp(k*.9),sz=e.s0+(e.s1-e.s0)*k;e.m.scale.set(Math.max(.01,sz*.8*(1+.18*Math.sin(e.t*40+e.w))),Math.max(.01,sz*(1.25+.2*Math.sin(e.t*33+e.w))),1);mt.color.setRGB(q[0],q[1],q[2]);mt.rotation=.2*Math.sin(e.t*12+e.w);mt.opacity=e.a*Math.min(1,(1-k)*1.6)*(k<.1?k/.1:1)}}
 if(RFX.L){const hv=n<RFX.hold;RFX.Li=hv?RFX.Lt:RFX.Li*Math.pow(.003,dt);RFX.L.intensity=RFX.Li*(hv?.85+.15*Math.sin(n/37)+(rd()-.5)*.25:1);if(RFX.Li>.02)any=1;else{RFX.Li=0;RFX.L.intensity=0}}
 if(any)requestAnimationFrame(rfTick);else RFX.on=0}
function rfImpact(P,sc){sc=sc||1;const q=RFQ(),Z=new THREE.Vector3(P.x,0,P.z);
 rfFlame(Z,Math.round(22*sc),{sp:1.4*sc,size:.75,life:1,g:-4.5,vy:2.4,up:1.2,y:.25,r:.3,h:.2});
 rfSpark(Z,Math.round(26*sc),{sp:3.4*sc,size:.12,life:1.1,g:7,vy:3,up:2,y:.4,r:.2});
 ring(Z,0xff7a1a,1.7*sc,.5,.14);ring(Z,0xffd070,.9*sc,.32,.16);shk=Math.max(shk,.28*sc);
 // ستون آتش: زبانه‌هایی که به بالا می‌کشند
 const nf=Math.round(18*sc*q);for(let i=0;i<nf;i++){const a=rd()*6.283,r=rd()*.4*sc;rfSpawn(0,new THREE.Vector3(Z.x+Math.cos(a)*r,.15,Z.z+Math.sin(a)*r),{L:.7+rd()*.6,s0:1.1*sc*(.7+rd()*.6),s1:.3*sc,vy:1.8+rd()*2,vx:Math.cos(a)*.6,vz:Math.sin(a)*.6,ay:.8,a:.95})}
 // دود تیره‌ای که بالا می‌رود
 const ns=Math.round(8*sc*q);for(let i=0;i<ns;i++)rfSpawn(1,new THREE.Vector3(Z.x+(rd()-.5)*.5,.5+rd()*.4,Z.z+(rd()-.5)*.5),{L:1.5+rd()*1.2,s0:.5*sc,s1:2*sc,vy:.7+rd()*.6,vx:(rd()-.5)*.5,vz:(rd()-.5)*.5,a:.5});
 rfLight(Z,5.5*sc,120);
 // جای سوختگی روی زمین که کم‌کم محو می‌شود
 if(q>=.5){try{const m=new THREE.Mesh(new THREE.PlaneGeometry(2.2*sc,2.2*sc),new THREE.MeshBasicMaterial({map:RSC,transparent:true,depthWrite:false,opacity:0,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));m.rotation.x=-Math.PI/2;m.rotation.z=rd()*6;m.position.set(Z.x,.025,Z.z);m.renderOrder=1;m.raycast=()=>{};scene.add(m);const t0=performance.now();(function f(){const k=(performance.now()-t0)/4500;if(k>=1){scene.remove(m);m.geometry.dispose();m.material.dispose();return}m.material.opacity=(k<.08?k/.08:1-(k-.08)/.92)*.85;requestAnimationFrame(f)})()}catch(e){}}
 // شعلهٔ ماندگار
 let n=0;const iv=setInterval(()=>{n++;try{rfFlame(Z,1,{sp:.3,size:.55,life:.7,g:-3,vy:.8,up:.4,y:.1,r:.4,h:.1});const a=rd()*6.283,r=rd()*.45*sc;rfSpawn(0,new THREE.Vector3(Z.x+Math.cos(a)*r,.1,Z.z+Math.sin(a)*r),{L:.6+rd()*.4,s0:.6*sc,s1:.15*sc,vy:.9+rd()*.7,ay:1,a:.85});if(n%3===0)rfSpawn(1,new THREE.Vector3(Z.x+(rd()-.5)*.4,.6,Z.z+(rd()-.5)*.4),{L:1.2,s0:.3*sc,s1:1.1*sc,vy:.6,a:.35});rfLight(Z,1.6*sc,90)}catch(e){}if(n>18)clearInterval(iv)},70)}
function rfFire(A,B,dur,sc,done){sc=sc||1;const q=RFQ(),g=new THREE.Group(),mk=(tex,c,z,o)=>{const m=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color:c,transparent:true,opacity:o,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));m.scale.setScalar(z);g.add(m);return m};
 const halo=mk(GL,0xff4a08,3*sc,.32),mid=mk(RFT,0xff9a2a,1.6*sc,.85),core=mk(RFT,0xfff0b8,1.15*sc,1),hot=mk(GL,0xffffff,.55*sc,.9),ton=[0,1,2].map(()=>mk(RFT,0xff6a14,.9*sc,.75));
 g.position.copy(A);scene.add(g);const t0=performance.now(),prev=A.clone(),pos=new THREE.Vector3(),tmp=new THREE.Vector3();let last=t0;
 rfFlame(A,Math.round(10*sc),{sp:1,size:.7,life:.5,g:-2,r:.15});rfSpark(A,Math.round(10*sc),{sp:2.4,life:.6});
 (function f(){const n=performance.now(),dt=Math.min(.05,(n-last)/1000);last=n;const k=Math.min(1,(n-t0)/dur),e=k*(.4+.6*k),S=Math.sin;
  pos.lerpVectors(A,B,e);pos.y+=S(k*Math.PI)*.35;g.position.copy(pos);
  core.scale.set(sc*(1+.1*S(n/45)),1.5*sc*(1+.15*S(n/38+1)),1);core.material.rotation=.12*S(n/60);
  mid.scale.set(1.5*sc*(1+.12*S(n/52+2)),2.2*sc*(1+.15*S(n/41)),1);mid.position.y=.18*sc;
  ton.forEach((t,i)=>{const a=n/90*(1+i*.3)+i*2.1,r=.22*sc;t.position.set(Math.cos(a)*r,.15*sc+.12*sc*S(n/70+i),Math.sin(a)*r*.6);t.scale.set(.7*sc*(1+.3*S(n/37+i*2)),1.5*sc*(1+.3*S(n/29+i)),1);t.material.rotation=.3*S(n/50+i);t.material.opacity=.55+.25*S(n/33+i*3)});
  halo.scale.setScalar(3*sc*(1+.12*S(n/80)));hot.scale.setScalar(.55*sc*(1+.2*S(n/30)));
  try{const m=Math.max(1,Math.round(dt*150*q));for(let j=1;j<=m;j++){tmp.lerpVectors(prev,pos,j/m);rfFlame(tmp,1,{sp:.25,size:.55*sc,life:.5,g:-2.5,vy:.3,up:.2});if(j%3===0)rfSpark(tmp,1,{sp:.8,life:.7});
    if(rd()<.9*q)rfSpawn(0,tmp,{L:.4+rd()*.3,s0:.6*sc*(.7+rd()*.6),s1:.12*sc,vy:.9+rd()*.8,vx:(rd()-.5)*.5,vz:(rd()-.5)*.5,ay:1.2,a:.9});
    if(rd()<.55*q)rfSpawn(1,tmp,{L:.9+rd()*.6,s0:.25*sc,s1:.9*sc,vy:.5+rd()*.4,vx:(rd()-.5)*.3,vz:(rd()-.5)*.3,a:.38})}
   rfLight(pos,3.2*sc,70)}catch(e){}
  prev.copy(pos);
  if(k<1)requestAnimationFrame(f);else{scene.remove(g);g.children.forEach(c=>c.material.dispose());try{done&&done()}catch(e){}}})()}
(function(){const _hf=hitFX;hitFX=function(a,t,d){
 try{
  if(a.k==='raf'&&a!==t){const ga=unitG.get(a),gt=unitG.get(t),f=rfFig(ga);
    if(f&&gt){const own=!!CX&&CX.a===a,ab=own&&CX.ab;
     if(!ab){const P0=gt.position.clone(),Bp=P0.clone().add(new THREE.Vector3(0,.95,0)),Ti=270+Math.max(180,ga.position.distanceTo(P0)*45);
      if(!(own&&CX.rfc)){if(own){CX.rfc=1;CX.rf0=performance.now();CX.rfT=Ti;CX.rfPos=Bp.clone()}
       const dx=gt.position.x-ga.position.x,dz=gt.position.z-ga.position.z;if(dx||dz){ga.userData.fy=Math.atan2(dx,dz);ga.userData.hf=1;ga.userData.ft=2}
       const ms=f.userData.raf.cast(0),c0=performance.now(),iv=setInterval(()=>{const k=(performance.now()-c0)/ms;if(k>1){clearInterval(iv);return}try{rfFlame(f.userData.raf.tip(),2,{sp:.25,size:.4+.3*k,life:.45,g:-3,vy:.5,up:.2,r:.1,h:.1});rfSpawn(0,f.userData.raf.tip(),{L:.45,s0:.18+.3*k,s1:.08,vy:.8,ay:1,a:.9});rfLight(f.userData.raf.tip(),1+2*k,80)}catch(e){}},40);
       setTimeout(()=>{try{rfFire(f.userData.raf.tip(),Bp,Math.max(120,Ti-ms),1,()=>rfImpact(P0,1))}catch(e){console.error('rfFire',e)}},ms)}
      else{const w=Math.max(0,CX.rfT-(performance.now()-CX.rf0)),from=CX.rfPos.clone(),du=Math.max(120,Ti-CX.rfT);CX.rfT=Math.max(Ti,CX.rfT);CX.rfPos=Bp.clone();
       setTimeout(()=>{try{rfFire(from,Bp,du,.65,()=>rfImpact(P0,.7))}catch(e){}},w)}}}}
  if(t.k==='raf'&&t.hp>0&&a!==t){const f=rfFig(unitG.get(t));
   if(f){const q=t.vq&&t.vq.length?t.vq[t.vq.length-1].at-performance.now():0;setTimeout(()=>{try{f.userData.raf.hurt()}catch(e){}},Math.max(0,q))}}
 }catch(e){console.error('rafFX2',e)}
 return _hf(a,t,d)}})();
/* مرگ: زانو زدن، افتادن، خاموش شدن کریستال و محو شدن */
function rfDie(u,g){const d=g.userData;d.dgDie=1;unitG.delete(u);d.pick.forEach(m=>{const i=pickables.indexOf(m);if(i>=0)pickables.splice(i,1)});
 if(d.last>0)popup('-'+PX(Math.round(d.last)),g.position,'#ff5a4d');
 try{d.lb.sp.visible=false;d.shield.visible=false;d.cage.visible=false;d.hack.visible=false;if(d.aura)d.aura.visible=false;if(d.bm)d.bm.forEach(b=>b.visible=false)}catch(e){}
 const f=rfFig(g),m=f&&f.userData.raf,P0=g.position.clone(),T=(fn,ms)=>setTimeout(()=>{try{fn()}catch(e){}},ms);
 if(m)m.die();try{SFX.rfDie()}catch(e){}
 if(FXI){T(()=>{shk=Math.max(shk,.35)},80);
  [0,1,2,3,4].forEach(i=>T(()=>{burst(P0.clone().add(new THREE.Vector3((rd()-.5)*.6,.8+rd()*1.2,(rd()-.5)*.6)),8,i%2?0xffb347:0xffe08a,{sp:1.6,vy:1.2,g:-.4,size:.3,life:.9,y:0,r:.3,up:1})},500+i*150));
  T(()=>{const Z=new THREE.Vector3(P0.x,0,P0.z);ring(Z,0xffb347,2.2,.7,.14);burst(P0,26,0xffc060,{sp:2.6,vy:2.6,g:-.6,size:.35,life:1,y:.4,r:.5})},1400)}
 setTimeout(()=>{try{scene.remove(g);g.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){if(o.material.map)o.material.map.dispose();o.material.dispose()}})}catch(e){}},2500)}
(function(){const _s=syncUnits;syncUnits=function(){
 try{for(const [u,g] of [...unitG]){if(!U.includes(u)&&u.hp<=0&&u.k==='raf'&&!g.userData.dgDie&&(phase!=='play'||(vhp(u),!u.vq)))rfDie(u,g)}}catch(e){console.error('rfDie',e)}
 return _s()}})();

/* ===== موتور صورت انیمه‌ای (AF) — همهٔ کاراکترها از همین استفاده می‌کنند =====
   صورت روی یک بافت ۲۵۶×۲۵۶ (مختصات منطقی) کشیده می‌شود و با ضریب k (۳ یا ۴) بزرگ‌تر رندر می‌شود.
   چشم: سفیدی با سایهٔ پلک، عنبیهٔ چندلایه (گرادیان، حلقه، رشته‌های شعاعی، مردمک)، سه برق، مژهٔ باریک‌شونده با بال، چین پلک
   ابرو: شکل پُر و باریک‌شونده | بینی و لب با سایه‌روشن | گونه با خط‌های سایه‌دار | موی صورت/چین/ریش با گزینه‌ها */
(function(root){
const TAU=Math.PI*2;
const rgb=c=>{if(typeof c==='number')return[(c>>16)&255,(c>>8)&255,c&255];c=String(c).replace('#','');if(c.length===3)c=c.split('').map(a=>a+a).join('');const n=parseInt(c,16);return[(n>>16)&255,(n>>8)&255,n&255]};
const toHex=a=>'#'+a.map(v=>('0'+Math.max(0,Math.min(255,Math.round(v))).toString(16)).slice(-2)).join('');
const hex=c=>toHex(rgb(c));
const mix=(a,b,t)=>{a=rgb(a);b=rgb(b);return toHex(a.map((v,i)=>v+(b[i]-v)*t))};
const al=(c,a)=>{c=rgb(c);return'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')'};
const lum=(c,f)=>toHex(rgb(c).map(v=>v*f));
const bz=(p0,p1,p2,p3,t)=>{const u=1-t;return[u*u*u*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t*t*t*p3[0],u*u*u*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t*t*t*p3[1]]};
const bzd=(p0,p1,p2,p3,t)=>{const u=1-t;return[3*u*u*(p1[0]-p0[0])+6*u*t*(p2[0]-p1[0])+3*t*t*(p3[0]-p2[0]),3*u*u*(p1[1]-p0[1])+6*u*t*(p2[1]-p1[1])+3*t*t*(p3[1]-p2[1])]};
const qd=(p0,p1,p2,t)=>{const u=1-t;return[u*u*p0[0]+2*u*t*p1[0]+t*t*p2[0],u*u*p0[1]+2*u*t*p1[1]+t*t*p2[1]]};

/* پارامترهای پیش‌فرض */
const DEF={skin:0xf2c4a8,hi:'#fff0e4',ex:52,ey:.5,
 i1:'#9fe0ff',i2:'#3f7fd0',i3:'#122a5c',lash:'#1c1018',brow:'#3a2218',lip:'#c46a70',
 W:30,H:23,tilt:.25,lid:.0,ir:1.1,sparkle:1,lashW:1,lowerLash:1,crease:1,
 bg:6,bang:0,bth:7.5,barch:4,bpos:0,
 sm:2,open:0,blush:.5,noseS:1,lipFull:1,
 shadow:null,shadowA:.3,
 look:'girl'};

/* ---- یک چشم؛ مبدأ = مرکز چشم، x مثبت = گوشهٔ بیرونی ---- */
function eye(x,o,closed){
 const W=o.W,H=o.H,tl=o.tilt*W*.28,lid=o.lid;
 // گوشه‌ها و کنترل‌ها
 const A=[-W*.97,H*.12+tl*.15],B=[W*1.02,-tl-H*.02];
 const U1=[-W*.5,-H*(1.62-lid*.7)],U2=[W*.4,-H*(1.7-lid*.75)];
 const L1=[W*.5,H*.8],L2=[-W*.42,H*.95];
 const upper=t=>bz(A,U1,U2,B,t),lower=t=>bz(B,L1,L2,A,t);
 const path=()=>{x.beginPath();x.moveTo(A[0],A[1]);x.bezierCurveTo(U1[0],U1[1],U2[0],U2[1],B[0],B[1]);x.bezierCurveTo(L1[0],L1[1],L2[0],L2[1],A[0],A[1]);x.closePath()};
 if(closed){ // چشم بسته: کمان رو به پایین با مژه
  x.strokeStyle=o.lash;x.lineCap='round';
  for(let i=0;i<24;i++){const t0=i/24,t1=(i+1)/24,p=bz(A,[-W*.4,H*.55],[W*.4,H*.62],[B[0],B[1]+H*.1],t0),q=bz(A,[-W*.4,H*.55],[W*.4,H*.62],[B[0],B[1]+H*.1],t1);x.lineWidth=(2.2+3.2*Math.sin(Math.PI*Math.min(1,t0*1.15)))*o.lashW;x.beginPath();x.moveTo(p[0],p[1]);x.lineTo(q[0],q[1]);x.stroke()}
  x.lineWidth=2.2;[.72,.84,.95].forEach((t,i)=>{const p=bz(A,[-W*.4,H*.55],[W*.4,H*.62],[B[0],B[1]+H*.1],t);x.beginPath();x.moveTo(p[0],p[1]);x.quadraticCurveTo(p[0]+4,p[1]+5,p[0]+7+i,p[1]+8+i);x.stroke()});
  return}
 /* سایهٔ گود چشم (نرم) */
 const so=x.createRadialGradient(0,-2,H*.4,0,-2,W*1.55);so.addColorStop(0,al(mix(o.skin,'#8a3a3a',.45),.16));so.addColorStop(1,al(mix(o.skin,'#8a3a3a',.45),0));x.fillStyle=so;x.beginPath();x.ellipse(0,-2,W*1.6,H*1.9,0,0,TAU);x.fill();
 if(o.shadow){const sg=x.createLinearGradient(0,-H*2.1,0,-H*.5);sg.addColorStop(0,al(o.shadow,0));sg.addColorStop(.7,al(o.shadow,o.shadowA));sg.addColorStop(1,al(o.shadow,o.shadowA*.6));x.fillStyle=sg;x.beginPath();x.moveTo(A[0]-2,A[1]-2);x.bezierCurveTo(U1[0],U1[1]-H*.95,U2[0],U2[1]-H*.95,B[0]+6,B[1]-3);x.bezierCurveTo(U2[0],U2[1]-H*.2,U1[0],U1[1]-H*.2,A[0]-2,A[1]-2);x.fill()}
 /* سفیدی چشم */
 path();const wg=x.createLinearGradient(0,-H*1.2,0,H*.8);wg.addColorStop(0,mix('#e6dcdc',o.skin,.1));wg.addColorStop(.35,'#fbf6f6');wg.addColorStop(1,'#efe6ea');x.fillStyle=wg;x.fill();
 x.save();path();x.clip();
 /* عنبیه */
 const ix=W*.07+(o.ixo||0),iy=H*.04,rx=W*.54*o.ir,ry=H*1.02*o.ir;
 x.save();x.translate(ix,iy);
 const bg=x.createRadialGradient(0,ry*.42,ry*.05,0,ry*.1,ry*1.08);bg.addColorStop(0,o.i1);bg.addColorStop(.42,o.i2);bg.addColorStop(.86,o.i3);bg.addColorStop(1,lum(o.i3,.55));
 x.fillStyle=bg;x.beginPath();x.ellipse(0,0,rx,ry,0,0,TAU);x.fill();
 // رشته‌های شعاعی
 x.save();x.beginPath();x.ellipse(0,0,rx,ry,0,0,TAU);x.clip();
 for(let i=0;i<46;i++){const a=i/46*TAU+.07*Math.sin(i*3.1),r0=.32+.1*((i*7)%3)/3,r1=.78+.2*(((i*5)%4)/4);x.strokeStyle=i%2?al(o.i1,.2):al(o.i3,.28);x.lineWidth=.55+.5*((i*3)%3)/3;x.beginPath();x.moveTo(Math.cos(a)*rx*r0,Math.sin(a)*ry*r0);x.lineTo(Math.cos(a)*rx*r1,Math.sin(a)*ry*r1);x.stroke()}
 // سایهٔ پلک روی عنبیه
 const ts=x.createLinearGradient(0,-ry,0,ry*.25);ts.addColorStop(0,al(lum(o.i3,.35),.92));ts.addColorStop(.55,al(lum(o.i3,.5),.35));ts.addColorStop(1,al(o.i3,0));x.fillStyle=ts;x.fillRect(-rx,-ry,rx*2,ry*1.3);
 // نور بازتابی پایین
 const bl=x.createRadialGradient(0,ry*.72,1,0,ry*.62,rx*.95);bl.addColorStop(0,al(mix(o.i1,'#ffffff',.55),.75));bl.addColorStop(1,al(o.i1,0));x.fillStyle=bl;x.beginPath();x.ellipse(0,ry*.62,rx*.8,ry*.34,0,0,TAU);x.fill();
 x.restore();
 // حلقهٔ لبه
 x.strokeStyle=al(lum(o.i3,.45),.9);x.lineWidth=1.8;x.beginPath();x.ellipse(0,0,rx*.985,ry*.985,0,0,TAU);x.stroke();
 // مردمک
 const pr=x.createRadialGradient(0,0,0,0,0,ry*.46);pr.addColorStop(0,'#05020a');pr.addColorStop(.8,'#0a0510');pr.addColorStop(1,al('#0a0510',.55));x.fillStyle=pr;x.beginPath();x.ellipse(0,ry*.02,rx*.4,ry*.43,0,0,TAU);x.fill();
 // برق‌ها
 x.fillStyle='#fff';x.beginPath();x.ellipse(-rx*.36,-ry*.4,rx*.3,ry*.2,-.3,0,TAU);x.fill();
 x.fillStyle='rgba(255,255,255,.92)';x.beginPath();x.arc(rx*.38,ry*.5,rx*.14,0,TAU);x.fill();
 if(o.sparkle){x.fillStyle='rgba(255,255,255,.8)';x.beginPath();x.arc(rx*.12,ry*.28,rx*.06,0,TAU);x.fill();
  }
 x.restore();
 // سایهٔ زیر پلک بالا روی سفیدی
 const ls=x.createLinearGradient(0,-H*1.3,0,-H*.2);ls.addColorStop(0,al('#5a2a3a',.5));ls.addColorStop(1,al('#5a2a3a',0));x.fillStyle=ls;x.fillRect(-W*1.3,-H*1.5,W*2.6,H*1.3);
 // سایهٔ گوشهٔ داخلی
 const ic=x.createRadialGradient(A[0]+4,A[1],0,A[0]+4,A[1],W*.45);ic.addColorStop(0,al('#b46a6a',.35));ic.addColorStop(1,al('#b46a6a',0));x.fillStyle=ic;x.fillRect(-W*1.2,-H*1.2,W*1.5,H*2.4);
 x.restore();
 /* خط مژهٔ بالا: ضخامت متغیر، ضخیم‌تر سمت بیرون */
 x.lineCap='round';x.strokeStyle=o.lash;
 const N=34;let prev=upper(0);
 for(let i=1;i<=N;i++){const t=i/N,p=upper(t);x.lineWidth=(1.6+4.6*Math.pow(Math.sin(Math.PI*Math.min(1,t*.92+.04)),.7)+(t>.8?2.4*(t-.8)/.2:0))*o.lashW;x.beginPath();x.moveTo(prev[0],prev[1]);x.lineTo(p[0],p[1]);x.stroke();prev=p}
 // بال بیرونی
 x.fillStyle=o.lash;x.beginPath();x.moveTo(B[0]-6,B[1]-H*.18);x.quadraticCurveTo(B[0]+8,B[1]-H*.28,B[0]+15*o.lashW,B[1]-H*.55-3);x.quadraticCurveTo(B[0]+10,B[1]-H*.02,B[0]-1,B[1]+H*.14);x.closePath();x.fill();
 // مژه‌های تکی: منحنی و باریک‌شونده
 x.fillStyle=o.lash;[.58,.72,.85].forEach((t,i)=>{const p=upper(t),d=bzd(A,U1,U2,B,t),l=Math.hypot(d[0],d[1]),tg=[d[0]/l,d[1]/l],n=[tg[1],-tg[0]],L=(6.5+i*1.8)*o.lashW,tip=[p[0]+n[0]*L+4.5+i,p[1]+n[1]*L-1.5],c1=[p[0]+n[0]*L*.55+1,p[1]+n[1]*L*.55-.5],c2=[p[0]+n[0]*L*.5+3.2,p[1]+n[1]*L*.5+1.5];
  x.beginPath();x.moveTo(p[0]-tg[0]*1.6,p[1]-tg[1]*1.6);x.quadraticCurveTo(c1[0]-1,c1[1],tip[0],tip[1]);x.quadraticCurveTo(c2[0],c2[1],p[0]+tg[0]*1.8,p[1]+tg[1]*1.8);x.closePath();x.fill()});
 // مژهٔ پایین
 if(o.lowerLash){x.strokeStyle=al(mix(o.lash,o.skin,.35),.9);x.lineWidth=1.2;x.beginPath();for(let i=0;i<=16;i++){const p=lower(.18+i/16*.66);i?x.lineTo(p[0],p[1]+.5):x.moveTo(p[0],p[1]+.5)}x.stroke();
  x.lineWidth=1.1;[.32,.5,.68].forEach(t=>{const p=lower(t);x.beginPath();x.moveTo(p[0],p[1]);x.lineTo(p[0]+1.5,p[1]+3.6);x.stroke()})}
 // چین پلک دوم
 if(o.crease){x.strokeStyle=al(mix(o.lash,o.skin,.6),.55);x.lineWidth=1.3;x.beginPath();for(let i=0;i<=20;i++){const t=.14+i/20*.66,p=upper(t);const q=[p[0],p[1]-H*(.36+.16*Math.sin(Math.PI*t))];i?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1])}x.stroke()}
}

/* ---- ابرو: شکل پُر و باریک‌شونده ---- */
function brow(x,o){
 const W=o.W,by=-(o.H*1.12+o.bg)+o.bpos,a=o.bang,arch=o.barch;
 const P0=[-W*.92,by+a*.55+1],P1=[W*.04,by-arch-a*.12],P2=[W*1.18,by-a*.95+2];
 const C=[2*P1[0]-(P0[0]+P2[0])/2,2*P1[1]-(P0[1]+P2[1])/2];
 const N=24,top=[],bot=[];
 for(let i=0;i<=N;i++){const t=i/N,p=qd(P0,C,P2,t),d=[2*(1-t)*(C[0]-P0[0])+2*t*(P2[0]-C[0]),2*(1-t)*(C[1]-P0[1])+2*t*(P2[1]-C[1])],l=Math.hypot(d[0],d[1]),n=[-d[1]/l,d[0]/l];
  const th=o.bth*(t<.3?.55+.45*t/.3:1-.82*Math.pow((t-.3)/.7,1.2))/2;top.push([p[0]+n[0]*th,p[1]+n[1]*th]);bot.push([p[0]-n[0]*th*.85,p[1]-n[1]*th*.85])}
 const g=x.createLinearGradient(0,by-arch-o.bth,0,by+o.bth);g.addColorStop(0,lum(o.brow,1.18));g.addColorStop(1,lum(o.brow,.78));
 x.fillStyle=g;x.beginPath();top.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));for(let i=N;i>=0;i--)x.lineTo(bot[i][0],bot[i][1]);x.closePath();x.fill();
 // رشته‌های ریز ابرو
 x.strokeStyle=al(lum(o.brow,1.5),.35);x.lineWidth=.8;
 for(let i=2;i<N-3;i+=2){const t=i/N,p=qd(P0,C,P2,t);x.beginPath();x.moveTo(p[0],p[1]+o.bth*.18);x.lineTo(p[0]+3.2,p[1]-o.bth*.25);x.stroke()}
}

/* ---- بینی ---- */
function nose(x,w,h,o){
 const cx=w/2,y=h*.665,s=o.noseS;
 if(o.look==='man'||o.look==='elder'){ // بینی پررنگ‌تر
  x.strokeStyle=al('#6a3a2a',.38);x.lineWidth=2.6;x.lineCap='round';x.beginPath();x.moveTo(cx-6*s,h*.54);x.quadraticCurveTo(cx-9*s,h*.64,cx-9*s,y+3);x.stroke();
  const ng=x.createRadialGradient(cx,y+5,1,cx,y+5,16*s);ng.addColorStop(0,al('#6a3a2a',.3));ng.addColorStop(1,al('#6a3a2a',0));x.fillStyle=ng;x.beginPath();x.ellipse(cx,y+5,16*s,9*s,0,0,TAU);x.fill();
  x.strokeStyle=al('#4a2418',.6);x.lineWidth=2.4;x.beginPath();x.moveTo(cx-9*s,y+4);x.quadraticCurveTo(cx,y+11*s,cx+9*s,y+4);x.stroke();
  x.fillStyle=al('#3a1a12',.55);[-1,1].forEach(q=>{x.beginPath();x.ellipse(cx+q*6.5*s,y+7,3.2*s,1.9*s,0,0,TAU);x.fill()});
  return}
 // انیمه‌ای: کوچک، سایهٔ زیر نوک و برق
 const ng=x.createRadialGradient(cx+2,y+3,1,cx+2,y+3,11*s);ng.addColorStop(0,al(mix(o.skin,'#8a3a30',.55),.28));ng.addColorStop(1,al(mix(o.skin,'#8a3a30',.55),0));x.fillStyle=ng;x.beginPath();x.ellipse(cx+2,y+3,11*s,7*s,0,0,TAU);x.fill();
 x.strokeStyle=al(mix(o.skin,'#6a2a22',.6),.62);x.lineWidth=1.9;x.lineCap='round';x.beginPath();x.moveTo(cx-4.5*s,y+1);x.quadraticCurveTo(cx-1,y+5.5*s,cx+4*s,y+2.5);x.stroke();
 x.fillStyle='rgba(255,255,255,.4)';x.beginPath();x.ellipse(cx-1.5,y-5,2.4*s,3.6*s,.2,0,TAU);x.fill();
}

/* ---- دهان ---- */
function mouth(x,w,h,o){
 const cx=w/2,y=h*.835,L=17*(o.mw||1),sm=o.sm,lip=o.lip;
 x.lineCap='round';x.lineJoin='round';
 if(o.open>0){ // لبخند باز
  const d=11*o.open+2;
  x.fillStyle='#5a1420';x.beginPath();x.moveTo(cx-L,y-1);x.quadraticCurveTo(cx,y+2+sm*.5,cx+L,y-1);x.quadraticCurveTo(cx+L*.5,y+d+4,cx,y+d+5);x.quadraticCurveTo(cx-L*.5,y+d+4,cx-L,y-1);x.closePath();x.fill();
  x.save();x.clip();x.fillStyle='#fdf8f6';x.fillRect(cx-L,y-1,L*2,4.6);x.fillStyle='#c8506a';x.beginPath();x.ellipse(cx,y+d+3,L*.55,d*.55,0,0,TAU);x.fill();x.restore();
  x.strokeStyle=lum(lip,.6);x.lineWidth=2.2;x.beginPath();x.moveTo(cx-L,y-1);x.quadraticCurveTo(cx,y+2+sm*.5,cx+L,y-1);x.stroke();
  x.beginPath();x.moveTo(cx-L,y-1);x.quadraticCurveTo(cx-L*.5,y+d+4,cx,y+d+5);x.quadraticCurveTo(cx+L*.5,y+d+4,cx+L,y-1);x.stroke();
  return}
 if(o.look==='man'||o.look==='elder'){
  x.strokeStyle=lum(lip,.55);x.lineWidth=3;x.beginPath();x.moveTo(cx-L,y);x.quadraticCurveTo(cx,y+sm,cx+L,y);x.stroke();
  x.fillStyle=al(lip,.5);x.beginPath();x.moveTo(cx-L*.8,y+1);x.quadraticCurveTo(cx,y+sm+7,cx+L*.8,y+1);x.quadraticCurveTo(cx,y+sm+2,cx-L*.8,y+1);x.fill();return}
 // لب پایین پر
 const lg=x.createLinearGradient(0,y,0,y+9);lg.addColorStop(0,al(lip,.95));lg.addColorStop(1,al(mix(lip,'#ffd0d0',.35),.9));
 x.fillStyle=lg;x.beginPath();x.moveTo(cx-L*.78,y+.8);x.quadraticCurveTo(cx,y+sm+8.5*o.lipFull,cx+L*.78,y+.8);x.quadraticCurveTo(cx,y+sm+1.2,cx-L*.78,y+.8);x.fill();
 // لب بالا
 x.fillStyle=al(lum(lip,.88),.9);x.beginPath();x.moveTo(cx-L,y);x.quadraticCurveTo(cx-L*.35,y-4.6*o.lipFull+sm*.3,cx,y-2.2+sm*.4);x.quadraticCurveTo(cx+L*.35,y-4.6*o.lipFull+sm*.3,cx+L,y);x.quadraticCurveTo(cx,y+sm+1.4,cx-L,y);x.fill();
 // خط دهان
 x.strokeStyle=lum(lip,.5);x.lineWidth=2.1;x.beginPath();x.moveTo(cx-L-1,y-.3);x.quadraticCurveTo(cx,y+sm+1.2,cx+L+1,y-.3);x.stroke();
 // گوشهٔ لب
 [-1,1].forEach(q=>{x.strokeStyle=al(lum(lip,.55),.6);x.lineWidth=1.5;x.beginPath();x.moveTo(cx+q*(L+1),y-.3);x.lineTo(cx+q*(L+3.2),y-1.6-sm*.25);x.stroke()});
 // برق لب
 x.fillStyle='rgba(255,255,255,.5)';x.beginPath();x.ellipse(cx-2,y+4.6*o.lipFull,5,1.5,0,0,TAU);x.fill();
 // سایه زیر لب
 const cs=x.createRadialGradient(cx,y+14,1,cx,y+14,12);cs.addColorStop(0,al(mix(o.skin,'#8a3a30',.5),.2));cs.addColorStop(1,al(mix(o.skin,'#8a3a30',0),0));x.fillStyle=cs;x.beginPath();x.ellipse(cx,y+14,12,5,0,0,TAU);x.fill();
}

/* ---- گونه ---- */
function cheeks(x,w,h,o){
 if(o.blush<=0)return;
 const col=o.blushC||'#ff6f7a',A=o.blush;
 [-1,1].forEach(s=>{const cx=w/2+s*o.ex*1.22,cy=h*(.5+.17);
  const g=x.createRadialGradient(cx,cy,2,cx,cy,34);g.addColorStop(0,al(col,.46*A));g.addColorStop(.6,al(col,.2*A));g.addColorStop(1,al(col,0));x.fillStyle=g;x.beginPath();x.ellipse(cx,cy,36,24,0,0,TAU);x.fill();
  if(A>.35&&o.look==='girl'){x.strokeStyle=al('#ff5a6a',.4*A);x.lineWidth=1.8;x.lineCap='round';for(let i=0;i<3;i++){x.beginPath();x.moveTo(cx-9+i*7,cy+5);x.lineTo(cx-5+i*7,cy-5);x.stroke()}}})
}

/* ---- ریش، سبیل، چین‌ها ---- */
function extras(x,w,h,o){
 x.lineCap='round';x.lineJoin='round';
 if(o.wrinkle){ // پیشانی، چروک اطراف چشم، خط خنده
  x.strokeStyle=al('#6a3e30',.34);x.lineWidth=1.6;
  for(let i=0;i<3;i++){x.beginPath();x.moveTo(w*.3,h*(.14+i*.045));x.quadraticCurveTo(w/2,h*(.115+i*.045),w*.7,h*(.14+i*.045));x.stroke()}
  [-1,1].forEach(s=>{for(let k=-1;k<=1;k++){x.beginPath();x.moveTo(w/2+s*(o.ex+o.W+3),h*o.ey+k*6);x.lineTo(w/2+s*(o.ex+o.W+19),h*o.ey+k*9-2);x.stroke()}
   x.lineWidth=2;x.beginPath();x.moveTo(w/2+s*22,h*.62);x.quadraticCurveTo(w/2+s*40,h*.72,w/2+s*36,h*.85);x.stroke();
   x.lineWidth=1.3;x.beginPath();x.moveTo(w/2+s*(o.ex-18),h*o.ey+o.H+4);x.quadraticCurveTo(w/2+s*o.ex,h*o.ey+o.H+11,w/2+s*(o.ex+22),h*o.ey+o.H+4);x.stroke()})}
 if(o.frown){x.strokeStyle=al('#4a241a',.45);x.lineWidth=2.6;[-1,1].forEach(s=>{x.beginPath();x.moveTo(w/2+s*7,h*.3);x.quadraticCurveTo(w/2+s*10,h*.38,w/2+s*6,h*.45);x.stroke()});
  x.lineWidth=2;[-1,1].forEach(s=>{x.beginPath();x.moveTo(w/2+s*20,h*.7);x.quadraticCurveTo(w/2+s*34,h*.78,w/2+s*31,h*.9);x.stroke()})}
 if(o.stubble){const st=x.createLinearGradient(0,h*.7,0,h);st.addColorStop(0,al(o.stubble,0));st.addColorStop(1,al(o.stubble,.55));x.fillStyle=st;x.fillRect(w*.18,h*.7,w*.64,h*.3)}
 if(o.mustache){const c=o.mustache,y=h*.745;const mg=x.createLinearGradient(0,y-8,0,y+22);mg.addColorStop(0,lum(c,1.25));mg.addColorStop(1,lum(c,.7));x.fillStyle=mg;
  x.beginPath();x.moveTo(w/2,y);x.bezierCurveTo(w/2-16,y-12,w/2-34,y-1,w/2-46,y+18);x.bezierCurveTo(w/2-30,y+10,w/2-12,y+8,w/2,y+7);x.bezierCurveTo(w/2+12,y+8,w/2+30,y+10,w/2+46,y+18);x.bezierCurveTo(w/2+34,y-1,w/2+16,y-12,w/2,y);x.fill();
  x.strokeStyle=al(lum(c,1.8),.3);x.lineWidth=.9;for(let i=0;i<14;i++){const q=(i-6.5)*6;x.beginPath();x.moveTo(w/2+q*.3,y+1);x.lineTo(w/2+q*1.1,y+7+Math.abs(q)*.25);x.stroke()}}
 if(o.beard){const c=o.beard;x.fillStyle=c;x.beginPath();x.moveTo(w/2-16,h*.885);x.bezierCurveTo(w/2-26,h*.9,w/2-30,h*.97,w/2-22,h);x.lineTo(w/2+22,h);x.bezierCurveTo(w/2+30,h*.97,w/2+26,h*.9,w/2+16,h*.885);x.closePath();x.fill();
  [.06,.94].forEach(a=>{const r=x.createLinearGradient(a*w-26,0,a*w+26,0);r.addColorStop(a<.5?0:1,al(c,.85));r.addColorStop(a<.5?1:0,al(c,0));x.fillStyle=r;x.fillRect(a*w-26,h*.58,52,h*.42)})}
 if(o.scar){x.strokeStyle=al('#8a3a3a',.8);x.lineWidth=2.4;x.beginPath();x.moveTo(w/2+o.scar*(o.ex-8),h*o.ey-34);x.lineTo(w/2+o.scar*(o.ex+14),h*o.ey+30);x.stroke();x.strokeStyle='rgba(255,220,210,.5)';x.lineWidth=.9;x.beginPath();x.moveTo(w/2+o.scar*(o.ex-7),h*o.ey-33);x.lineTo(w/2+o.scar*(o.ex+15),h*o.ey+31);x.stroke();
  x.strokeStyle=al('#8a3a3a',.55);x.lineWidth=1.4;[-12,0,12].forEach(d=>{x.beginPath();x.moveTo(w/2+o.scar*(o.ex+3+d*.3)-4,h*o.ey+d-2);x.lineTo(w/2+o.scar*(o.ex+3+d*.3)+4,h*o.ey+d+2);x.stroke()})}
 if(o.mark){x.fillStyle=o.mark;x.beginPath();x.moveTo(w/2,h*.21);x.lineTo(w/2+5,h*.255);x.lineTo(w/2,h*.3);x.lineTo(w/2-5,h*.255);x.closePath();x.fill();x.fillStyle='rgba(255,255,255,.55)';x.beginPath();x.arc(w/2-1,h*.245,1.2,0,TAU);x.fill()}
}

/* ---- ترکیب کامل صورت ---- */
function draw(x,w,h,u){
 const o=Object.assign({},DEF,u),S=hex(o.skin);
 x.clearRect(0,0,w,h);
 // پوست: گرادیان نرم، سمت لبه‌ها دقیقاً هم‌رنگ کرهٔ سر
 const g=x.createRadialGradient(w/2,h*.52,6,w/2,h*.5,w*.62);g.addColorStop(0,o.hi);g.addColorStop(.7,S);g.addColorStop(1,S);x.fillStyle=g;x.fillRect(0,0,w,h);
 // برجستگی گونه‌ها و حجم بینی/پیشانی با نور نرم
 const fg=x.createRadialGradient(w/2,h*.4,4,w/2,h*.42,w*.3);fg.addColorStop(0,al(mix(o.hi,'#ffffff',.5),.38));fg.addColorStop(1,al(o.hi,0));x.fillStyle=fg;x.beginPath();x.ellipse(w/2,h*.42,w*.3,h*.26,0,0,TAU);x.fill();
 // سایهٔ زیر چانه/لب پایین و کناره‌های فک (محو در لبه)
 const sd=mix(o.skin,'#7a3a30',.55);
 [-1,1].forEach(s=>{const gg=x.createRadialGradient(w/2+s*w*.36,h*.78,2,w/2+s*w*.36,h*.78,w*.2);gg.addColorStop(0,al(sd,.16));gg.addColorStop(1,al(sd,0));x.fillStyle=gg;x.beginPath();x.ellipse(w/2+s*w*.36,h*.78,w*.2,h*.2,0,0,TAU);x.fill()});
 cheeks(x,w,h,o);
 extras(x,w,h,Object.assign({},o,{_pre:1}));
 // چشم‌ها و ابروها
 [-1,1].forEach(s=>{x.save();x.translate(w/2+s*o.ex,h*o.ey);x.scale(s,1);eye(x,o,o.closed);brow(x,o);x.restore()});
 nose(x,w,h,o);mouth(x,w,h,o);
}

/* ---- بافت: ۲۵۶ منطقی × k ---- */
const CV={};
function canvasFor(o,k){const key=k+JSON.stringify(o);if(CV[key])return CV[key];const c=document.createElement('canvas');c.width=c.height=256*k;const x=c.getContext('2d');x.scale(k,k);draw(x,256,256,o);return CV[key]=c}
root.AF={draw,canvasFor,DEF,hex,mix,rgb};
})(typeof window!=='undefined'?window:globalThis);


/* ===== اتصال موتور صورت انیمه‌ای به بازی: بافت صورت‌ها + شکل واقعی سر (فک باریک، چانه، گونه) ===== */
(()=>{
 const AFp=window.AF;
 const PRE={
  ali:{skin:0xf2bd9f,hi:'#fbd6bf',ex:58,W:31,H:24,tilt:.5,bang:5,bth:7.5,i1:'#ff9a9a',i2:'#e0152b',i3:'#5a0814',lash:'#2a040c',brow:'#6a0e1c',lip:'#c2505e',blush:.45,sm:1},
  mak:{skin:0xf6e5dc,hi:'#fff2ec',ex:55,W:29,H:21,tilt:.12,lid:.35,bang:-1,bth:5.5,i1:'#c4ecdc',i2:'#4f9a8a',i3:'#14302c',lash:'#120d14',brow:'#1a1216',lip:'#b8706c',blush:.3,sm:1},
  aka:{skin:0xe8b898,hi:'#f6d2b8',ex:55,W:28,H:19,tilt:.2,lid:.3,bang:3,bth:8,barch:3,i1:'#c4ece4',i2:'#4c8a82',i3:'#10302e',lash:'#14100e',brow:'#14100e',lip:'#a8685c',blush:0,sm:-1,look:'man',noseS:.8,lowerLash:0},
  doj:{skin:0xe9ab88,hi:'#f6c9a8',ex:50,W:31,H:24,tilt:.35,bang:4,bth:6,i1:'#eedcff',i2:'#8a58e0',i3:'#31195e',lash:'#4a2a14',brow:'#a8742a',lip:'#d8607a',blush:.4,sm:0},
  acro:{skin:0xf7dccf,hi:'#ffeee6',ex:50,W:30,H:24,tilt:.25,bang:2,bth:5.5,ir:1.15,i1:'#d8d2ff',i2:'#6f62e6',i3:'#2a2476',lash:'#5d5683',brow:'#aaa3d0',lip:'#d8758a',blush:.6,sm:3,open:.6},
  raf:{skin:0xcfa387,hi:'#e3bfa6',ex:48,W:26,H:17,tilt:0,lid:.5,bang:-2,bth:10,barch:3,i1:'#c9d8e2',i2:'#6f8fa3',i3:'#34495a',lash:'#4a3028',brow:'#e9e5e0',lip:'#7a4a42',blush:0,sm:-1,look:'elder',wrinkle:1,ir:.95,sparkle:0,crease:0,lowerLash:0},
  pri:{skin:0xf3d2c2,hi:'#fbe4d8',ex:50,W:31,H:22,tilt:.6,bang:5,bth:6,i1:'#ffb2a8',i2:'#d3202e',i3:'#4c0710',lash:'#120a10',brow:'#14090d',shadow:'#be1e34',shadowA:.32,lip:'#b02a40',blush:.3,sm:0},
  cri:{skin:0xb98866,hi:'#d2a07e',ex:68,W:23,H:17,tilt:.1,lid:.5,bang:7,bth:12,bg:2,barch:2,i1:'#a8723e',i2:'#5a3412',i3:'#241006',lash:'#150b07',brow:'#150d09',lip:'#7a4038',blush:0,sm:-1,look:'man',frown:1,sparkle:0,crease:0,lowerLash:0}
 };
 const conv=o=>{const r={};if(!o)return r;['skin','hi','ex','i1','i2','i3','lash','brow','lip','closed','sm'].forEach(k=>{if(o[k]!=null)r[k]=o[k]});if(o.sl!=null)r.bang=-o.sl*.5;return r};
 const PIC={
 ali:'data:image/jpeg;base64,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',
 mak:'data:image/jpeg;base64,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',
 mak_c:'data:image/jpeg;base64,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',
 aka:'data:image/jpeg;base64,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',
 doj:'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAEAAQADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD6bwPQUYHoKKK/ND9bsgwPQUYHoKKKAsgwPQUYHoKKKAsgwPQUYHoKKKAsgwPQUYHoKKKAsgwPQUYHoKKKAsgwPQUYHoKKKAsgwPQUYHoKKKA0DA9BRgegoooDQMD0FGB6CiigLIMD0FGB6CiigLIMD0FGB6CiigLIMD0FGB6CiigLIMD0FGB6CiigLIMD0FGB6CiigLIMD0FGB6CiimgsgooopAFFFFABRRRQAUUUUAFFFFArhRRS7aAuJSgZoC09UpibGEUmDUuyjZRYm5Fg0oFSbKNlFguRkYpKeyUmz2oHzDaKUrSUh3CiiigdwooooGFFFFABRRRQAUUUUxBRRRSGFFFFABRRRQAUUYzSjigVxKULmnAZNPC81ViGxoTmnBOadsFOC+gosFxuygLjvUgQntThHmmkJtEW33o21P5Ip3kU7E3RW20bferJi4ppiFFguiuVz3o2VM0WKaUPpUtDuiEoM0wrU+32prKDRYdyArikqUqM00jBpWGmMopTzSUi7hRRRQMKKKKACiiimIKKKKQwooooAKKKXbQJgOOacBmgLxUqrVIhsFWnfhSgZp6pTENCEmpVjwKesdSKvFVYi4wJxShKmCcU9YxiqsiLoiCcUuz2qYRjFO2U7E3RXKe1NKcVa2U0xjFFguiqY800x81aMdMZMUrIpNFRo8GoihFXSuaidKmxaZVPpTXWpmTmoyKksgK9aYRirDDHSomFJjTGUUpGKSpLQUUUUDCiiimIKKKKQwooooEwp6g96atSrVIhjkUU8DNNHSpUXNMkVVqZEpFXmpkXNVYlgqmpVTihUqVUqyGJsp6pT1SpFSrMXIZspfLqcIMUuyi1yeYrmOkKVZ2UhQYotYOYplKYyVb2dajZKClIpspqNlNW2SoXX3qDRMqOnWoWWrjJULpUM2RWIxUbqKmcYqNulSMhYUypXWo2HNJlISiiipLQUUUUwCiiikMKUGkpVGTQJj1HNTBcfWo0FY17d+IpJJUstNsokDYWW5um6eu1V/TNDairtGbZvDqKlTpXA63/AMJHp2mTXuqeKLDR7SPHmTR2x2RAnGWY9Bkjk4A9RVX/AIRXxBfXcSweLLmVcBpZUDeWAegGDgk9axdSotYwb+aI0uei3OowWjBXYvKfuxRqWY/gKiTVbh+U0u7ZOucqp/LNfPvxdtpfhVaaVq+p3813o17ei0u75EZjZswJRyucsCQcqCDx0rOu9b8OwSR/Z/iP4WuWIyGbUxGW9iOal1cQlf2LfzIbinqz6dttYgeQRSrJaSk/Ktyuzf8AQ9DWqnB6ivme2Piy/wBLEul3FxrWluC0c+lXq3kX4BGPHvir2k/GrxF4dkjt74C6ijOx4dQiaORCO27A/WiONS+ODRLinqmfSKLntx61MqV5p4U+OnhzXBHHes2i3bZUi6OYic8gSDj88V6dAVkRXUhlYZVlOQR9a9CnUjUV4MwloOVOafsqRUyaeI81ulc53Ig2GmMnNW2TAqNk4zTaGpFTZ1qFxg/rVid0iRndgiKMszHAA9Sa8w8U/Hfw7o3mRWLvrVynG22IEYPoXPAP0zXPVqQpK8zeF2d+xHTvWTPq8CTGGJJbyZfvR2qbtv1PQV4Tq3xn8ReJJZbexH2ZJDsSHTozJI/tu68eoqndyeKtP0sS6rdT6LpSYMkuq3y2cRz0OGYZH4GvPljFL4INnQo21bPen1W4QEvpd2qHuCrH8s0+21GC9YrG5Eij5opBscfVTXzTba34dmaUXPxJ8LWzYJZ11LzSBjPCjHPHbmtL4PWs/wAVtO1HW9Nvp7DSbS9NpaXRUh7vCAtJjOVGSMAk5FCq4hq/sWvmNOLdkz6Hc56c1Fkcc154PC+v2NzMs/i6eLCF45X3GLaOvVsD6Vc0dfEl/pkN7pniXTtXtJBujnltm2yLnHyspAI464war2lTeUGvmi01e1ztmIwDkEexqNxWPZXviJZFS+02ylQna01rdngf3trL19q2X5rZPm6FpkJ60UrDBpKC0FFFFMYUUUUhhT0FMHWo7y7+w2Vxc+U8ywRtKY4xl2CjJVR3JHQevFNEMtgVVtdWsry7ntILuGW6tziW3DDzEPuvXHv0pmia1ZeI9ItdU0y5jvdPuoxJDPE2VcYz19R3HUVzHxI+FWlfEa3hmlluNK1y0GbLWtPcx3VufTcOWX/ZPHpirVr2Zm72907OeCK6t5IZ4klglUxskoBVweCCD255z2zXxp49+IWqfsq+P7vRfCmtWutaBdxtP/wj98TJ/ZTt0TPVR3Cg9MZGRT/Hvx5+KfwLuL/wlrl5pmv3kltvsNaVQJlQnAkdR1OAflccdctXlOleBYtF8DXXxR+IBnubK4nK6TpsrnztZujn5mOc+SCCSepwR0wT6mFw06s1FHk4nFJLTc5Xxz8Q/FfxHuDqvibWbi5gLHYZ5PLtYs9BGvQAewJ9TXKWsumzSeU2rW9sSdo81JAv4kKQKxtf1zUfFepNfX7qzniOKEbIYV7JGo+6vt375rO+zsQxwQB6DgV9nSyeCjae54ssTJnrFjZeLfh+kPiPRb2e2tt37vV9Fud8O7+6zIeD/ssK+uf2fP2trP4kSw+EfH6Wsepzr5Ntf7QLe8P9x1PCOex6MfQ18M/DX4l6v8LtdF9prC6sXxHfabL88F3FnlHU5AOM4OOM5r3/AOKvwM03XPAVp8Ufhujz+GrmPz7vTUJZ7Ig4Yp1ICNkMvVeoyK8jHZX7Jc0VdG9HEtOzZ9o3Pwg8K+II7nT7vThbXcWM3Nk3lNKn8JI6HHQ8V2nw+8GW/gLw5DpFtdXF7HG7yGa5bLMWOfoBjHSvAf2PPjr/AMLQ0VNC12fzPFWhw4juXYbru16Bz6leA31U8819PQngcY/z/OvmPZRpyulqexzcyTLkf0qdFBqvF2qzH2rZGDEZeelV5Rg1akPy5qrKcmhsEcj8QvBNv4/8OyaTc3U9nG0qSebbnDfKemOhBHrXIW3wf8K6ELbTLPTxd3T/ADNc3p81o4+5APygnoMD+VepS57DPsa+Wv2xvjr/AMK10h/Dfh+48rxNrcGbi5RsNaWuCM/7LOCQPQAnrisfZRnO9tTfm5E2c/8AtBftd23w/kn8I/D1LZ9Qtx5NxqSKDDakcFIlHDsO7dAeOTXybfab4s8exTeI9bu55rUvhtX1q5KRFuMqpfgk56KD9BXqfwz+Bul+Fvh3dfFP4kwsnh63hE9jpLEh7s7sRlx1O44Cr1Ocnjg/PnxH+I2sfFHX21DVWSGFQY7HT4uILSLPyxxr0GBjJ6mvp8DlftVzyVkeRWxTvZMW4n063kMa6rbzkHG6OOXGf94qBj3Fdh4F+JHi34ZzJqfhrV57a1DjeschltJD/ddPu89OgJ7HivJ/szrjIwcZHY//AFq0vDuvah4V1NL6xdBgETQzpvhmjP3kkXoynuK9erk8ZR9y5hHEyTPsP4fePNR/at+IMGmeLtZt9J0CyjW4Xw1Zsy/2m46jJ5cDGTk8KcDqTX2OkUdtDHDFGkUKKFWOIYVQBgBfYe1fnFq3gVL3wTp/xV+Hn2mDTIZlXULCKQtcaLdrzww5MRO0qx6ArnjNeseBfjn8Ufj5c2fhXQ7/AEzw7NDah9R1oY86RQcGRFboeR8qDOc8qMV8XicLKnNpvQ9nC4lSVnufXdzq1laX0FnNdRR3k/MVsXHmOPUL1x/tYx71bIzXG/Dn4W6T8N7SZrZp9Q1e7+a91e/cyXN0/uxyQv8Asjj610mu69p/hnSLrVNTuUtLC1QySzSnaAPQe5OAB1JI4rzGraI9W9tZFphTKbazm6tIJzG0JljV/LkGGXIBwR688+hBFOqGaIKKKKC+gUUUUgAdalQ4wR1ByOaiHWpFp3sS9T488eeKfFH7KPxQun0qEX/gnXJWvYdOnJEKszEyJGR/q2Vj26jHFeoaf+2T4A1Hwrfak1xPZanawNINIukxJM+3ISNxlWBJx24zkCvS/iZ8N9H+KnhS50LWI28t/nguEX95bSdpEPt3HcV8B/Ej9nfxn8OdcWzl0yXVbOeUR2t/YoXimJOFBA+4xyOG49+9d1NQqWT3PMqupRfubHefs8/CLWP2sfjNqOueI2eTRLaYXmrzjIRsn93aofcDHsqk9TVH9vPxb/wk/wAc28I2CLBofg63jsI7eLiNbh0DyfL22gog9lHvX6Sfsp/ACy+Afws07RpQs+uXrJeavPnIecgfIO21FwoPf5j3r8pNbjufGHxE8a6zcF7qe/1+/kd2HJxOyL+QUD8K/TeHsvVSpa3Q+SqVnWqtI86t9BYIM5AUZJPpX0B+wl8GPCfx1+Lmo2msPFqljoNiL99OBYLcv5ixqGI/gBbJA6nHTNeI/HDzPCfhG3hiVopdQlMZboQijLD8eK89+B/x28Ufs9fEGz8X+EbuGDU4EaGSG6j8yC5ibG+KVP4lOB0IIOCCCK93NZrDSdCC10/E56s+V2P2U+On7G3w+8a/DbWIbTw5pfh/VbWzlnsdTs4Ftmt5I1LDeV6oSBuznjNfLP8AwTW8ZiTxL4m+HF+A9le2v9q2EUvKhhhJ0x3BQoT9GrU13/goH4t/aC+D81hZaDYeFo9REllqUlrcPPI6/wASIWA2BlYAn5jg4B715Z+yzczeCP2q/htfRRfJfXkulS44GyeFlJ/DGaxhl1Z4Cdar6r0FFTceY6X4+fDfUP2QPj1o3izw5Ey+Hb2Y3VnEDwOf39ox9Mfd9VI/u194+G9ds/E2iafq+nSrNYX0C3MDqc5Rxkfj2PuDVT9pX4YWnxr+FGseHWRBqSp9r02Vzjy7qMEx5Po3Ib2JrwH9hDx1ca18OdT8LX8ji/8ADV2YUjcfMlu5JRfba6yLj61+X42lyy5l1PocHVco2Z9SRGrKGqkX3j256VbiNebc7mhZD8pqpITk1ZkNVJjjNAJGJ4r8Q2XhPw9qWtajKIrDTrd7qZicfKozj6noPc18Kfs6/C/Uf2tvjprfjPxPE0vh+ynF1eRnO2Vz/wAe9op/ugAE/wCyuP4q9d/bx8bzaf4I0fwXpzmTU/Ed4qvAo+Z4UK8A9syNGP8A9VfRv7Onwzsvgt8LNG8MQqhvUT7Rfyf89bt+ZDn0B+UewFengqXPLmZwYyo4xsj4j/4KT+NBP408N/DuwkQWWl2o1W/hiG0CVwUhUgdNsfIH+2K+tvg3+xr8PPA3w/0yzn8NaZr2pT2scl7qOoW63DzyOoZsFgQqjooXtjmvgn9paSTxn+1L8UNQeLdFb6ounR8cbIYkQGvYdL/4KGeMPgL8IILPUdBsPFb2IjsrC4vbh7eQLghVfaDvAVeDwSFwTzmv055dW+oQrUdup8/JT5eY8h/bk+DXhP4FfGW00vRpo9M07WrEajDYNnbbEyMjKpPRSVJAPTpzXg1xoLgZUA5HUf0/xri/jZ8b/FPx/wDiBqHjHxdeRXGrXgSPy4I/LhgiUYSKJMnagHqSSckkk5r0r4J+Z4t8GypIWllsJvI3Dk7CNy/1rpyup9ZkqE97aBSqczse2/sD+KI9A+NE3gnVFiudB8YWklo1tcco1yilkGO+5N6Y9D7CpPjz8Ldb/ZG+NtjrGgu6aLcObzSLkkkGL/lpbSHvtztx3Ug9a4bwas3gz4tfD7WYw0T2XiOxKkDGQ8wjYfk5r9S/2t/2ebT49/Cy+023CReIdMd7zSbhzgecoO6Nj/dkXgnthT2r57iDAKnVtbpc6aVaVCotT5n1n9sfwFpvhiz1CCefUtTuYFf+yrRD5kLkZMcjn5Fw3BOTwc4rzL4b+J/FH7VPxUtLzWFFn4K0CVL1tMhGYWkB/dI5PMjkjJJ6AcDBrx34Y/s6+MfiXrP2ePTpdJsIJTHc39+hRIiDhlUH77DB4HGR1r78+HHw80j4XeFbTQtGhKwRZaSd/wDW3Eh+9JIe7H06AAYr82moU0+Xc+spe0rNc+x0z+/Un6/55JqKpm+7UTV573PTTEooooL6BRRRSBgOtSpUQ61KlNEj6aBjPuQe3NOo61a7kvVWZ3ngn4gJp8SWOqzCK1RfkunbAjHox9Pc1+XXhDSrW51rxEjEyldc1BVEDZ3f6TIQQR2wQc+9foQ8auhV1DIwIYEZyDwa8f8AHnwX0zThf+I9C8nS7kZuLm3ZP3Mz46jH3XPAHqcV+h8LcQUssxKWL1i9L9V/meDicAnN1KR8WftleDbjTvBnhXVFt2ihW5lgclyxBZAy57DO04+hr5NuLGe1lMc0EkMmAdkiFSARkcH2NfsZf/DLwR8RPhXqHhLx7dXPhu7v1Uhr2FhiUcxSx3ABTKtztJGQSDwa8F1H/gnT4q+KnxATWfFvxT0zXtOdYYJdSspFe6ktogI41VAMKQigc8dDz3+lzHE0MfinWw9RNM+WxFGan8LOF/Zj8DXEHwQtr6ZTE1/eT3MIbIzH8qAj6lW/Kuz+F+hTXH7S/wALbaGNpJU1r7W2DnEUcTM7e2BX0f418D6D4O8KWWiaPDHp+nafAtvbQbwfLCjH5nrnrkmvKP2d4ZbX9or/AISebTNQv9N0XSriKzWzg8w3F3OQjjecKFWLcSxIGSBX1WLxWGoZJyTnaVkl+vU7IwnyJWPuPUxKQCp2n8fzrwTwZ8Db/wAD/tDeJPGumX0EPhnXLQtc6cCfM+1EqSduNu0MCwOf4mFes2Wt6vq0ckmpWtrp+5v3VtbSGVkTsJH6Fv8AdGB71cj6CvwzF4qNb3Ka0XU9vDYaVNc0i7ER+A4FWo+KpRHFWVbAry7nVJD3OBVWTk9ccdamc5BqvIaLgkeIeJ/gdqPi79o7Q/HeqX1rP4b0WzUWWnMGLrcAk5K42kbmLbs54XgEV71pJlGCSSQOKyZD+VVL3XdY0iOGXTrS31NFkzNa3DmNnXHSN+gf0DcH1Fepg8XGl7k+px4jDyqLmgfAXxF0CWD9o34rW8qlJP7fedGY4yjohRvxH8q4v9qfwRcyfBN9STMjWN/BNMACdqMGTJ9PmZR+Ne1/Hm0Mv7Rl74jtrHU7LTNe023+1x3sHl/ZryEGPZvBKkNHtfcCeSRXrvhHwBoHjjwdfaBrEMWoabqFu1rPCGHzBuOMdNpwwbqCK/dMNisPiclVOEru1n/VzxpwkoNSVmfjHDZXF1KY4YJJpMM2yNCzYAyTgdgOc9q+uf2OPB0+oeAPE+qPCZYpb1IkAlKsdkeWIHQ/eA/GvWdL/wCCcvin4YeOptU8MfFTS9E0lo5rU6jcsqXSWkymORXiPBZkZlznB9RXvkPw38F+AvhVpnhP4fzXPiCfTIW5sYWIEnWSSScgIWZuoGccAcCvlMtxOHwGKVbEzUUjkw9Gbn8LPlXWtJgj8XeEIo28lm8RadnzmxtAuUZiSeAAAST04r9PvHXj9NT86y0qbfaOTvuFPEq54C+3vXzN4F+Cuk3/ANh8Ra4bbWro7bm3iVcwRMV+9gj5m5I56V68sYRQq8KOAPavmeKM/pZniP8AY/hStc+ow2AipKpU37CdgM/d6e30paKK/PWe76DW6VE1SN3qMnNQykJRRRQX0CikJxSF6QMdnBqRGquWzT0YU0QyzQDg1GH4oL8VogSuSlhUcqpMhSSNJUOMo4yDznp+FM3e9APpVWuh8tyYMGGGAYHqD0P4dKwB8PtEudcudQudNs5xJEkUcItlCoQSzN7k5H5CtsHNTryMVak4q0XYmVNPdGHffDbw5qGmXNrHpVpatNG0Ynjt0Z0DDqMjr711VhZw2NrDbW8axQRKESNQAoAGBx0qCE81ciPTNU5OW7OVwUdUi1GMfj1qyhwKqpkc1ZTpS8zJluM9Kl31XUgCl307kNE5eoZTSb6axyKLgkQv0qrIMn8MelWX6VWk6ikWtyhqdhBqdjNaXUazW80bROjAYKnqPb8K5e2+HPhyz062tpdJsrh4YljM726BnwAMnA6nGa62ViKqSHHQ4pxbj8LsbKClujll+H+i2+tQahBptlGEhaGSJrdXDnIKOCejAg89wTXQM+1QoHA6DsKV+h4AqFic1DbejdzpjTS2QsKR28axxRpDGvCogwoHXgfjUgYetQE+tG73qX3K5epNxRUe7iguMcVDE1YViKiNIz+9MD8moYIkopocYp1BfQjc000OetRs2KBjjSq2DioS3NKrc1QmWN9O35qDzKA5zTQImzSGQIQC2M9KZuP50yJhLOSPuqOKtHRGF9S0so3qvUmpo3DNjPzAZIqjbnc7yk8Dp71bsuQzt1fp7CrCUYovRdKtRdBVWJRVqM4A9ak4pFyPpU6tiqqMcVIGzQc0kWd9aWkWcV20hlJ2qOmcGsYSEA1yPiHxPqOg6kz/AGaSXTZE2+ZbAmSNv9od1PtVxdnczcHJWR3EssYldEdW2sQOeTTQ9efaB4mk1i6lWOxuILdBxPOu3cfQDrXZW0paMDORSk7u5fI0rMuMcioJaCxpkjnFSNR1K0veqcpq455qs5FM6YlR2CgljwKryShVD5wtOvGO1Yx/F1+lVZ/mdIx25P4dKZ3wirIkeVV5LcetLvFVyQ84X+FefxqRn9OlQxSilqS7xTd/NRbzSeZUM5mPZ+aQNntURbmlBzSBEw5xT1bmoF61ICKkBjnNRk5pzHmo91UMQvg00tSMaYeTQJkwJxTt2KgyaeGzTQ1oTBt1OjGOBxk8mo0apFNWmaxlYmjQbNnQYqzEQMY6VXj5FTx07ilK5diNTxnkVWiNWI+MUrnLJllWp4YioA34U8Nx1pGLTJw3FVbiyE+SG2sak3Uufei9gV0UU0kh8s+R+dX40ESACkz70E+9O4asfvqORsmkZvemlqQ0iNmqs5wPrVhu9VZD0FVc2iyrKoL7ujDoarOo3lhwx61ak61WfrRc6YyISoViwGCaYWwKexxUTGk2DYpam7qYxNNJJNQyGSlsUBs1FupwOKQiZWp6nJNRKelSJ1oEI/WomOKlfrUTd6BjGNRk96e3eoz0oATdUiVFg1KvSgTv0J0xUypmq8fWp0PrTTFdliNcVZjUADrVWM+lTo3FO5N2XYiKmBAqojYqUPzRcl6ljcDS7veoA/NOD0XJaJd3vTgRiod4pd4xQTYlLACm76YW4pN4phYkznvSbgKjL+lJuzSuUkPJBqGTBpS3NRO3FFxrQglA7VXdPepn5NQyYFFzRMgdcVA2KlY1DJSbHqyJ2qMsQKe1RlaQ0OU1KDmoh0qRetAyVe1SKcGo17VIgoEDDmoyKnYHNRkY60DIWHXimY9qmwO9NI54oAi204Dg8U/BoA5oAVc1KlMUU8Kc0CsTxnFToarJ2qdWxSuQ0WVp4bmoVen7qZJKH/GuY8Y/ECHwN5cuoaXqdzYyfKLrT7Vrkh/7rRp8wGO/SujzmgEqcjg+opppPVXEzxvW/wBrPwhpLiJbXVDIeourN7cA+mGUH9Kxof2xdBMw822VYx1CyNuH/jte6ahpVnq0Pl3lrFcJ6SKCar2vgLwTFBtm0VnfuS+Qfp0r1KLwkvjjY1UqcVqrnic/7YuhLNmO1Uw+7vuI98LitrQ/2tPCGrMUNpqqyAEhbSzkuAfUYUZ/Su+ufhr4ae9MtvYskHaF2UgH64zW5pul2WkJ5dlaw2y9f3aAHNTVlhVpCNy5Ok17uhj+DvH0PjgTTWOmaja6fEdv2nUbZrcu4wdoRsMRg9a6UvTGYt1JP1JNJXmtpvRWMPUcXOaY54oJpjsaQyNzwaruc4qVmzUL9KCkiJ+9QvU2Dg0xlJoKsQkU3bUuyjbQMjC4p6j2pQvPNOAweKAFA5qRKaOakUGgQ5hTGGamZcU0/SpuMhK00jHapiue2KbsqgI/wox7VJspce1ADVFOVaUL+FOVaVwBRUoGKaq0+pFYFJBqTcajpSc07ish4Y04P71CDil3UXZNiUvxVG5kYE4NWd3FI0av1FO7GtCtayPxk/hV8NheetRBFQcCgtmldgSl896TfUe6kJzRcViTcaYWzRupKLlWQhFRMMVNTGWi47EGM00jHFTFeaaV9qaGQ49qPwqUik2UwI8e1OVfanhaUDHagBgWpVFApyg0riHkZppWn0VIyIqRSbfrUtGzNMCLb9aAvNS7DRtxQAzZTlGM06ikAUUUUAFFFFAgooooAKMmiigAzRRRQAUUUUAFFFFABRRRQMaVyaaUqSigCErzRt+tS7CaNhpgRbcetKFJqTbiloAaF4pQMUuaKBH/2Q==',
 acro:'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAEAAQADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9CMfSjj0pTSV4S2R9Qw49KOPSiiquFkHHpRx6UUUXCyDj0o49KKKLhZBx6UcelFFFwsg49KOPSiii4WQcelHHpRRRcLIOPSjj0ooouFkHHpRx6UUUXCyDj0o49KKKLhZBx6UcelFFFwsg49KOPSiii4WQcelHHpRRRcLIOPSjj0ooouFkHHpRx6UUUXCyDj0o4FFB6Um9BpIXtSGl7UhqUJhRRRTAKKKKACiiigAooooAKKKKdhXCiilC5FFguJRTtlGyiwXG0U7ZRsosFxtFKRikosFwoooosFwooopDCiiigAooooAKKKKACg9KKD0pPYa3F7Uhpe1IaEJhRRRTAKKKKACiiinYAopcUu0UWFcQDJp23FKBShaZFxBxRjNPC5pwQYoFci20bKm2D0pdgoFzEGyjbU+wUhQUBzEOPekxUpSmlSKCrkZWkwfSpNvtQeRQFyKinFR2pMGlYu4lFFFJhcKKKKBhRRRQAUHpRQelJ7DW4vakNL2pDQhMKKKKYBRRRTQmFKBmgDNOVeKYrgF4p2PalVacFoJuIoyakUUqjFOAzTIuJil25pduaXaRTsJsTAowKfto2/WmTcZtpNtSbfrSFcUBcjIxSFQakK5pCtKxVyIqKjKkVPSMuRUjuVyKNtPK02gu5GVxSVIwphGKChKKKKTGgooopDCg9KKD0pPYa3F7Uhpe1IaEJhRRRTAKUdaSnAU0JiqBmnqtIKevamQxVGKkApAOadjFBAAcGnKppVGRUgXAqyBqginAEinbc4p4GKaAZsNGw1Lto20xEWw0FSKl20hGKAItppCKl25pjjBpDIXGM1HU5XNNKcdKkCEjjioyOeamPWmsKktMhIpu0GpDjFMoLRE3BopxHtTaC0FFFFSxhQelFB6UnsNbi9qQ0vakNCEwoooqkJipxUg5pgGBWZqHiSCxleCO2vL6dDhktLZnx/wI4H61cYyk7RIcrGwBjrx25pVPI9/WuPvvE+tRWckx0eLSowyos2qXSqvzHAzt6Ek9+PeqtxJ4wuLuKOO5sICRucRDKhexzt4z2rqjhusppGDml0Z2tzf29rgSP87fdRQWdvoBUS6pKxBXTbth6lQP614x8SfEWqfCs2OoazqEv9l6jdfY5dTgLH7G+MqZO+04PA6Y6VBdfEKyhmVT8SfDzyqOQdaChh+dejDARaT51qZOrZ2cT3W11aCaQRHfDMekcy7Sfp61oK2TjvXh5j8UahYCeznfWbIjzIriwv1uRj8D0/DNTxfEbxN4baI6jaTGFuFGoWzLz6bwMfQ0PL3vCaZn7az1R7coBAqTFecaD8a9D1Dy479m0qRjs3SHfCCOxYfd/H869Dtp47mGOaKRZYpAGR0YMrDsQR1FcFSjUpfxI2NIyUtmPpdlSBc0u2siiLZRtxUu2kOKAuREUw98c028vILG3ee4mS3gQbmklYKqjuSTXnOvfG/RrMMmmI+pSg7Q5/dxE+zNyfwFaQo1Kr9xaA5qO56EzDPUfnWdc6vAkhjjD3Uo6pAu7b9T0ryebx74p8SRzNY2s7W/3CLG2baW/ulz27+tQSv4l0ewFzqN5/Ydig3tPqWorbD0554GSOvNd6y7+eaRn7dLZHrJ1V15fT7pV7ttVv0BqxbX0F6pMLhtpwy4IZfqO1eFW/xFsZhLn4laArYYlk1jzNoAycLnk4Harnwz1vWPihpsmv6Xdy22nx3MltbXF2T5lyExl8cnbngDvSll8YLmdRFKtd2UT2wkZpDz06+lcLb3PjC2luYprjT55I/nCztsXZ/eBxjFXbLxXq81nb3P9irqVtIu8XWmXCujD1UNjdn24rhlhmvhkmaqrfRxOpJprVn6f4hg1KVYWgu7O4YErFd27RlgOuD0P51osK5HFxdpI3TT2G0UHiis2WgoPSig9KT2KW4vakNL2pDQhMKUDNJSgkBiFLbecCqWrEyQZXp1qJJklaRIpFZo2w6xuCUP+0Ox+tQ6bqtrrOnwX1lOlzaTpvjlj5VgeP8AH6Hg4Ncl49+GsXi8C+03Urvw54jhQrBq2nOVfA5CSp0lT/ZNbQjd2m7GUrtaHW39lBqdnPaXUCXNrOjRywSIGWRWGCD7EE+3WvlDxp49179lTxj/AGVpuoW/ibw1fwme10i/mY3Nkv8ACu772z0JzkDt1q94q/aE+I3wWW40jxlolhql5LE503WbYhI5iMAOy9GAJBI+U8YwRzXx98VvF+pw6Jd+LNZuHuNS1W4aK0ackmeVeZGA6BIwQDjoSqjvj6LA4KUW3WacH07nBVrXVo7nRfFf476x4vu2u/FfiArCX3Q2SOUhTHQJEvU9eTk8nnrXlUnxa0JXZcXJHr5XH868mvJLvUbqSa7mkuJ3+87nkn/PaovszgZ6dD6cHp9K+gipQSjSjZI5uVPWW59N/D34lX+lyjWfCes3NjPE48x7aQoVPYSIeo9mGDX3F8A/2nbP4shfDPicQ6b4jdc280Xyw3pHOVB4STj7vQ4OMdK/Jjwzr+p+BtcttU01jFNH8rRSqfLmjP3kdTwyn0/EdK+rZtCg8QeBdK+I3hHzItGumUXMEbky6XdKRuQt1ADYw30ya5K9KnXsqis3s0VG8NY7H6QzeEdD8VWk8Gr6VbS3SHZLKq7HPHD7hg5I/wA9a6bSNOt9G061sLSPy7a3jEcak5OB6nufevG/2Z/jBH8W/Chkviv/AAlGmotvfgHBlXPyTAHs3IPo2exFe1xnnrn3xivk60alOXs6jvY7ItNXRbj5qXFQxHmpqxQSDFRPxUpqF29aLCRka/oln4l0m503UIjLaXChZEVtpPORgjkH3rBTwvo/h6K3s9J022tbiTO2URguq/xvuOTn6c5NdYxr59/au+M//CsvD40zRpgnirWIvLSVDlrW3Gd0g9GPIX/gR7CuihGpUmqUHuOTjGPMzm/j9+1XD8P5ZfCvgwxXWrQAxXN+48yKzP8AcUdHk7knhTjrXxL49+Is090NV8Vatc3t5cZZJLqQyyOP9gE8L9ML6ZrqdR0q1+Hvw3uPH/iaESxyt5WjabKSDqFwwOHfPPljlm9cfjXylreqal4r1a81XU5ZLm7nO6SQghUH8IAHCgDgD0r6rD0oUY8tNa/zM4m5T1k7HqEPxY0GWQKftManq7Q5UfgP8K9j+EX7QWveBJYrnwzrYvNMzmbTppPMt5AeuY85Qn1GK+P/ALIc5xnAGCKmsLq90a7W6sp3t5kydwJwR3BHceorralOPLVjdC5VHWO5+pPw68S6v+1X4unfXtSttK8K6Vtkbw1YTES3ZJ48w8M0fYnoT8oHWvqiFEhjRERY40AVY0GAo9AO30r8qfhZ431bSdM0vxz4fuHtrm2m+y3BXkQzgZaKQdCki4I/vD3Bx9c+GPjf8SPjxP8A2f4J02x8M2kCIl/rFywn8pmHIQHjP3iBgkgckV89jsHJyTptKFvu8jqo1UlZ7n0+06RPHG0iq752ISBux1wO/vj8cU481yPgT4eWnguJppLu51rXLhALnV9RcvPLjqATwiDsi/rXR6pqtro1kbu8mWCAMqZbqWZgqqB3LEgACvnZR1tF3O6Oi1LJ60lKw6EHORnikrKxqtgoPSig9KllLcXtSGl7UhoQmFKtJSrVWJZ8t/ELx1r/AOzJ8Ubie3tzqfgfxBI16tg7bRBOf9cIm6I2cMV6Hd7V674S/aB8C+MtJmv7TXIbVraFriezvSIriJVGSdpPzYx/CTmtz4m/DjTPij4Su9D1NSqyfPBcoBvglHSRfx6jvX57/E74ReIfhVq7WmsWbfZCx+zahGm63lGeCp7N6g85r6PD0sPjor2jtNfiefN1KLutUdjt1v8Aau+NuIjJFZSNlDjctlYp+mTkdeSzD0rwP9rLU7bxB8ctV0PSo/I8PeE400KwiH3QYxmV/qzs2T1JGa/Rn9jn4OzfDvwFdeJdTWSHWNdiWZbZwR5FumWjBB/iPLH2I96/MPS7WfxPqWsarPmaXUNTu7p2xkkvO5r63K6CxeJ9lH4YI8ucmvee5x66N5UZd9qqgJZmOABX0R/wT3+Hng/4x/F7WE1MW+rJoOni8isJ0JSSRpBGJCp4YJk8erLXz18fJn8M+GrCxjzDJqEp3H/pmg5H5kflXnXwW+OHiz4A+PbLxf4MvksdWt1aJklTfFPE2N0UqZAZTgHHBBAOQcUZzV+rTeGpeV/mKMm1c/cf45fs++F/iR8Ndb0/VNMsrd4bKWS0v1gRHspEQsjowA2gY5HTGa+Hv+Cd3iCG58ceKfh1qscc2la/p51CC2lG5fMjAWVQD13RtuP+4O9amuft4eOP2i/hALL+zdM8L2t6j2upnTGd3n2n5lVn/wBWjArkDJ6jPNcB+zPC/hn9qT4ZXsYMIm1GSyfHQpJC6sPpgcVFPK6qy2Ver11j6FKbcuU9ytbW/wD2Uv2h7PzGd/D9023eWwJbGR9p3Hu0ZIJ/3R6199QSLIiOjiRWAIdTkMPUfWvAP2q/AUPxC+G81xBFu1bRt15bsPvMm396n4rlvqorpP2VvHh8dfBzSHnlWW/0wNp1woyD+7HyE+uY9tfK4v8A2ijGut9md1O8Xys9mjNWF5qunB7/AI1YSvH2N3qKwwKrSDNWWqtL1ouCRnajf2+lWdxd3cqW9pbxtLLK5wERRkk/QV8EeEdAv/2q/jpqmtagJBoEDiadSxwlupxDbqexbv8AVjX0P+2V48/4RH4RXGnQyMl7rkoskCdfKHzSnPbgAf8AAq0v2b/Adv8ADf4c6dYzR41O/wAXl++c5kfov0VSFx6kmvYwz+r0XW+1LT5GFW8pKMT4O/b48SL4m+Oun+CbORbfSPDNrFCyKmI47mfBY/8AAU2L+Br9C/h38AfCnw78F2Ph/RtFsRaLboksktujvdEj5nlYj5y3Ug8YOK/L/wCKTSeNfjn8SdakTcbrxBcxj02odgX8Np/OvX7r/goX8QPgR8I4rFtO0nxLdR7LPTrvVTIJIl2tzIqkeaAFA6qexJr6rEZZXjl0K9HZK7OF1Pf5WeX/ALcvgTwf8G/j7JoulGPSrXUrGHURZICIrd3LKyjH3QSu4D0YYrxaXQ2IBAypAII/SvLPil8VPEnxj8c6n4u8Vak2pa3qTh5ptoRVA4REUcKijChR0A/P2L4JO/irwU6Pulm0+YwEkZOwjcmf1royeqsVP6tPdLQmUmlc9Y/YzntG+L8vgTWAzaH4yspLIoByl3GDJbyL6MDvG73Ne1+Dta1j9lz41z6fqm9tODi3vVUfLc2zH93Mo6cZ3A+zLXzv4SluvBHxW+H+s2+YpbPxHYFSRjh5hGw/JzX6E/tw/Bd/EOhx+NNKiaS70dDBewj5t9ruJEgH+wW5H90+1c+ZUY4XEvDz+Ga/EdOe0ludl49/aH8D/D61LXWrw6jeFA8dhpzCaWTcAVPHCjHOSfpmvMvg34r8Q/tEfEoeJtUh+weE/Drb7LT433I10wIVnP8AGyg7ieg4Awa+cPhP8E/EXxa1NY9Otja6Wj/6TqcyYgjBPb++2Oijr3xX6E+BfBemfD7wzZ6DpERjsrVT8z8vKx6u57s3X9Owr5PF0sPgoSjB3mz1qbqVn72xvHoOv40lOPSmDvXz+vU7ri0HpRQelQy1uL2pDS9qQ04i6hSrSUq1RLFYZ7Z+tVr2yttStJLa8giuraTiSGeJXVvqp4NWivFNK8ULR3RLJ4L1Y7KW3kwqiFkUg8D5CAPy4r8hvhnpMU2nyQSpIZYry5hMafeyszA1+tzKCCDXhPxM/Zw0OZ7zX9B8jRbpQ9xNGy4hY9SR6N1+uK+44Zzehl2Jf1rRSVrnm4jDOavA/NL9s/whPp2jeEdTW3MVtunt2+fJ3EKwJHQZxj3r5XkhZHKsCrehGMV+yHjv9nTSPiV8Lb7wz4nvG0TUpwtxbXF7GytHcLzFIj42MvJBXPQmvmXX/wDgn/8AFT4ufE6TVvGfiPQTbzLCk+rab5QEkKAIpihjA+baoHI75brXbmzjjMZKrQfMnY85RaVmjC/Zi8ITf8KPtrths+13tzOisMExgqmR7ZQ9q9A+F2ltH+0Z8Lowu5xrol4OflWJyx/CvdfEPw80fwV4R0/QdFiMGn2FuttbRM25gEGOW7k8nPuc1yf7Pnw6166+P+leKpNAv7zR9H024NrIqKqS3U2IxyxAAVMtu7EV9hiq1GjkrpSl7ySQoRk6mx9g38EtwwjA8wSAArjIYEfyrC+APwa1L4Q6j4uEt/by6NqtzHc2VlAGBtyN24NnjOGVRjsor0XQrS6itVkv47dL1iSwtyWRBngAkAkgdTjrW1GDxzmvxp1muaEdme3LW1yxHVlKrR1ZQ1hclitVaUc1ZbpVeTvQCPD/AIzfBXU/iZ8QvCWsvf27aBoitLJpsqnfJNu3Ar25wgOegU+tdVpJmgnXzQcq4J49DzXeOOCe9YHiGzuzb+dpsVtLdqwLR3BKCRe6hh0PoT+NdHtXJKL2RailfzPy1uPD8lv8TfH1nKu2SDxHeqxJ+7lw+f1FcP8Atc+Cpl+Fml6suCLLUQsgAz8siEDn2K/rX0d8Wfh34g0j4++MdcbRb+10HXJINRiklQfJclAsyFgcdVByO1d1F8IdF+KHw+1PwxrG57LUoRCzxkbkl42yDPdGCsM+lfs0a1HE5LGEGm7W/wAjwppqpex+OccDyNwjMRk/KM4x1P6H8q+uf2PvBs938OfEWqywGW3uL9Yo9kmG+SP5jjv95a7jwp+wB8Vvhj42vn0LxN4etNOvLSfT5dYu/KkH2WYFGHkuCyvt9BkdvWvqTRvgRo/w++GOl+HPB876mmmWxaS4gjZmB6ySTNgISWycKSeQMcCvj8nlTwWLVbES5Ur/AJFOEpq0T5T1zRo28W+Dre3V/Mk8R6auG6jFyhP6An8K/XHWLxLxri3AWS3csr7lBEgPUEHqMcV4T8Nf2cdC8O3VtreqiDWdVXEsL7QYYjjhk9SQevvXs4HAArzOJc2pZhi+bDbJWuelhcPyR5pjbW2hsraK3t4Y7e3iG2OKJQqIPQADA/DFTAUAZNP218Z1uehfsNbpTB3p7cU0UigoPSig9Khmi3QvakNGcE00vzQhMeMUKRmoy9AaqQmTk0hHGSQBUXmhRz1qrNNuzzxTBR5mTyToh5OfpVa5lhuInikhE0TjDK4yD7Ed6rvNyc1CZQe9O50qimXWuklUo0YZTwVbkVgR+CdEm1W7u59Ms5IpY0jjiFuFEagEsTgclieT7D0rRV+eDxU0bj6/0q41ZR2YSw8exTu/h34dv7CW2j020tvMxmSKFd4G4E4J6ZAIz711kcSxoFVFVeyqBgfhWXAw4rTgl3AA81bqTkrSbZxzpKOqRZjXLZPBqyi9KiReanQcCktDnZIgxUobFRA4pcmmiSQtUTnmlyaQ80wIHHymqzrye30q23AxVeXipe5ZRvrSK+t5Le4QSwSqyPG3KkEYPWuWt/h/4etLCC3uNNsrloV2meS3UM/GOce1dVcyYFZsr4ahVJxVlJm8KSlq0c6ngrRLXWkvYdMtEi8jypIXgB5DZVwfXGR+Nb5ukEfl+WNmMbCPl/LpVaRwD9KiEmOpNS6sp7s7IUI9jQt7iGKNI0j8uNAFVE4CgdAKsxyq/SshJBmpUkyazFKiuhsg5GRilLYqlDNjvxU2/Peg5XHl3JSQaaaYXx3pPMpMpIkoPSmq2acelSyluMZ+aiZ8UMx6VGz0Iljt9LvqDfRvpgySV6qSSc06R6qSvQdNJXEd+ary3KxuqFsM33fenOxI/Ss1G+0X0kvVYhsX696lux6tKHMaKXS+aI9wLsMge1WYZ1MjRhgXX73tWHYne89y/wB37oPsP/r1o6MjGJ53+/M2foO1OJU6UYps2oOladsfu1mQdq0rfpWqPIqrQ1IuQKnHSqsRwKnD4FUjzmSbqmhVGyXbCiqu81wfijxVqWgamzTWUlxpUicT2il5I27hx3H0p3sJQc9Ed8txGWIV1bB6Bs07Oa818M+KZNduZdmn3VtAgG2edNgc+w6131lKzQjPSne5ThZ2ZZaoJfumpGbJqKZuKlkrczp+azZ+prSn6ms2fqazPTp7FC4kEaszHCjkmqcl7GsQl3gRkAhvrSasxlEduvzGQ8n2HWqN6BPeQwdUT52+nYVGx69Okmrs0Tcqm3c23c20e9WUcg+lY6MZ79fSEZP+8a0Y2x7Uk7kVYJJWNGOXNWY34rNierUb8CqPKqKzLm+k381CZKUPQc5OH5qQPmqyuc1Kr0nsNbkbvyaiLUrHmombIoQ+twLYpm+mk+9MJx3pjFkbNQN3qUtuFRMM5oNIOzIGPPHBqFLeONDGi7UOc/jVnZk0CPJqWejCdle5DHax+UIwuExjGavW0YUKAMAcYpkac1bgSmKU3axagxitCEZxVO3StOCIgAkYq46Hm1WWF4Ap+TUYOKUPjtVnCx+TVS709ZzuVirfUgfpVrOe9H40mLUzINF8thlxj8TWmkaxKFX86PxpCcd6EN6jifWo5eVpS3400nNMaKM/es+cdeM1rzwnB4rNnTBqDupSMae3Uy+ZjMgXaD7VUNsiyM6rhmGCfatWVMk8Yqo6YqNz04VWtCnFCsJbYuNxyfrU6UuyhVwaSJnK6JI+KsRtgVAi1JuwMVR58ncm35NPV+arg9OakVse9BkWFapFNQI1SoelJiW41+D+tQscCp3+9Vd+lCK6fMjeomqRqiYGmAA4p6MDwQKiwaegoAn8lW9R9KcLME8MR9aRDViM5P40C5pISOx5+9+lW4rNFHLE01OtTpxVaEucmWII0QcCpw2OAePSoIzg1KG9KDF67kgalqPPrShsU0Kw+im5NLup3ELRik3UmTRcdrjgB60EgGmE880daLhYUknvVeeJWPI59alJIzUTsTUjStsUZrRWzgkfWqj2Of4v0rRkNQPxQzZTkUDZBeSx/AUwwxr2z9atyHiqz9akrmkyFyM8VEW5p7imYJoBKw4HOKmToKiVcYqZKBkqnFTJ2qBanTtSAVxzULjirLjNRMooRN+hVYdeKZtqwyUzbTKINlPVak20bDQAKMYqxFUapUqLiglk0dTLUSVMo5qibE0ZxUgbmolPT1p4zQRYkDVy3xO8fxfDPwXfeI59Nu9Vgs9nmQWWPMClgC3JAwAcmumzioby1h1C0ntbqFJ7aZDHJFIMrIp4II9MVStfUStf3loeP6T+1/8ADq8FsL+8v9BluI1kVdTspI1wwyCHAKkehGQe1dXZ/H/4b36Aw+NdHce9xt/mBXyl8edb+K/7L1vHpPhG6tL/AMEvJJLpyanpsd4YkJ3Nb7n5G09F7g5GOleI2/xo+LvigC8l8I+C5PNGfOvPDFmjH06jd+Yrdwg1uerRwE8S70Y3X9eR+jF7+0L8NtPB87xto4Pok5c/oK5HWP2x/h5p1tdy6dPqOvNbLvk/s6zfYo3ABi7YVRkgZJ6nFfCdz8c/i/4TRruLwn4PiWPrPY+GbNyv/fIJr6F+ALfEz9p2ytm+INzaxeCbG5W4ktdPsY7RLuVPuwEp95QeW7Dp1PBywSFWwM8N/Fjb+vQ+uPAXi7/hOfB+l67/AGdc6Ut9EJVtLsASID0zj1HP41vFuetRRqsSKkaBEUYVVGAB2GPYUpNc7PLdr6bDy/FROfelyaaTxSHYieoG71O1QSGhlIgl6Gq7VZcA1Ey1JaKzLk0gSptho20FEYXmpFXBoC08LzQAqipU6imqoqVAaTFfUkZcdajYA9qsutRsmKER/mVinNNKc9KsEe1N20yrkGz2pwXJ6VLt9qXbQFyPb7VIq0oHtUirQIRVOanUU0cU8UXAKXJpKKdxWHK2OtLuz3plH40xNFDxJ4b0zxfotzpOsWUOo6fcLtkgnGVYevsR2I/+tXy34y/Y717SrqSXwVrMF9YEkx6dq7FJIh6LIOGHucH1zX1nmgnP/wCqqUmjqw+KrYWXNSlY+VfBH7HGpaldRXPjrV4FskO46VpWSX9nlPQf7vX1FfUWkaTZ+H9LttO062isrK3QRw28C7UjUdAB/XvVjJ9fzoOT3obctxV8TVxL5qsrji1G6m0VJz2FJpKKKVwsNYVC4qwRmo2THvSuFisycVGyjHSrRXimFM0DK232pNntU+2jHtQO5CFx2pyrntUm32pyrQFxqrjtUqgDtQo56VIBwaT2Bbkp5pjLmn0hoQmRbPamlanxRszTAr7KULzU+yjZigCIJmnquKdRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFADWWmYNS0YoAg20myrGyjZQBBtxSgHFTbcUYoAYFp/QUUHpSew1uf/9k=',
 raf:'data:image/jpeg;base64,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',
 pri:'data:image/jpeg;base64,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',
 cri:'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAEAAQADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDsuaOaWivzyyP0q77ic0c0tFFkK77ic0c0tFFkO77ic0c0tFFkK77ic0c0tFFkO77ic0c0tFFkF33E5o5paKLIV33E5o5paKLId33E5o5paKLIV33E5o5paKLId33E5o5paKLILvuJzRzS0UWQrvuJzRzS0UWQ7vuJzRzS0UWQrvuJzRzS0UWQ7vuJzRzS0U0kJt23CiiikIKKKKACiiigAooooAKKKKACinYpAvNACYzRg07bTglAEeDRg1Lso2UARYNGDUuyjZQBFg0YxUhXFN20ANopStGKAEooooAKKKKACiiigAooooAKKKKa3E9gooopDCiiigAooooAKKSnKM0AA6UuM0oWnhRigBoTmnBBmnbR/kU8LQBHs96cFAqQJTvL9qAIdopdtTiIelOEQx0oArbaTAq0YhjpTTEPSgCvgUhXnrU/l47UhTmgCuUFN2VOUx2phFAERUYphFTFRimlRQBHRQRiigAooooAKKKKACiiimtxPYKKKKQwooooAKKKACetAChc1IBgdM0gUAVKooAaPpT1GaUDNSKtACBM09Y+Keq+1SqmRQBGEzT9lTLHUgT2poCvspwjqx5ftTgnHSnYCqY+KaUq4U46U0p7UWApGPNNMfNXGi9qYyUgKbJURTFXGSo2T2pAVCMdqYfpVh0x2qMjmgCAjIPFMK4qYggdKaR8tAEVFKRSUAFFFFABRRRTW4nsFFFFIYUUUUAKBmnikUe1SAcdKAFUA08ADFIo6VKq5xQAKvpUyJSKtTInFAAiVOqUIlTqlMBqpTwnIqRUqZIs9qokhWOneVT7ki0tZ53+5FGzt9AM1T8Mam3iDRbe+eDyDNuwm7PAOKLXJbLPlU0x81B4p1Z/D+iz36wC48oqShbACk4J/CrsLLdW8U6Y2SoGGOcggEfzp8rtcV2VmSozHxV1osVC6VJSZTeOoGWrrJUDpUllR1NQsMZq2y1C6ZoArEcGo3FTsAKiYcdKAImUVGRg1Ow46VGRz0oAZRSmkoAKKKKa3E9gooopDClUc0lPQUAOQVIvSmgYp6g/SgB6rUir0po4qWPHegdiSNOKnRKYgz0qdADQIfGmKnRRSIBUyL0qxD0jqdI6I1qyiZxTRLdjF8XZg8K6q/f7Ow/Pj+tHgm08nwnpSdP3C/rk/wBad48UjwXrBHXyOP8AvoVpeFoAPDml4HH2WI/+Oitl8KMXIx/H1t5vg7VgOSId36ip/DC+b4a0p+ubaP8A9BAq/wCLYA/hnVVI/wCXZ/5Z/pVHwKpfwbpDHk+QP5mhr3QUi48XpUDpWg8eM1WdKxaNNyky1A68VckXHaoHUUikUXUc1CygVblXBNV3ANSXuVnUGoWGKneomHFINiJhUbCpiOKjI5x3oAhYc0lOYU2gAoooprcT2CiiikMB1qRAf8jNMUVFf6ja6RatdXk6W1sjLullOEUk8ZPbnueKa1egrq2p4V4k/bO8J6FLNFb6TrN1LG5Q+ZbrCpIODyx/pXJXH7ecHnP9k8ISvDxtM98AR9dqkV9Q3mnWOsWRhu7e3vrWVeVmjWVHHsCCD9RXzZ4n0H4faL40bwr8RPCWn6fHeZbSvEthGbWO4QnG2XYQI5FyAWxtJwTjNepR+rzvFw1X3nm1liI+8p6GUP29Jec+DI//AAPP/wARWlpn7e2ms4GoeELuNO7Wt4jEf99AV4z+0P4A8A+A9Vsrfwh4ge/utzJfWBl+0fZhgFW80DB642k578147vwxxkgdCe9elDCYepFNRtc8qeMxNObTlex+h3g/9sH4d+JrtLWe9utCmYcNqcG2IH0MikgfU4HvXulhdQ3kEU8E0c9vIu9JYmDKw9QRwa/HwvnryQcgnqK9N+EP7Qnir4OXSpp1z9t0ZmzNpN0xaFgTkle6MfVfxrGrlsbfutzoo5nLm/fbH6jRjIqzGvFcr8O/GMfj/wAF6R4ihsp9Ph1K3E6W10AJEycc44IOCQR1Ugmuri/rXhNWdme6ndXLEa1ZjFQx1aj6inF2ZJj+OIPM8G6uo6+QT+RBrR8HkS+FtKYcg2sf6DH9Kdrdp9v0TULcdZIJFH128Vm/DG8W58Fadzkwq0TfUN/9etlsYlvxy4t/COrP0P2dh+fH9ag8GweT4T0lf+ndT+eT/Wq/xSuxbeC79Ty0xWBfqSDn9K2NJtDYaPZWzffigRD+Cim/hsAsi9aqSDBNXH71VkFYNmyKkw61WkOO2atSjiuP+JvjaP4deCNX8Ry2FzqcWnwecba1ALsMgDOeABnLHsAaSTk7IbaSuzV1C9t7C2mubqeO3togWkmmcIiAdSSeB+NeFeLf2x/h14buntra8u9elXq2mwZiJ9A7EA/UcV8d/Fz9oHxX8Y7x/wC1bv7JpStmHSbMkQJ0ILd3Yf3m5rzYPivcpZbG373c8Otmcr2o7H2TqX7e2n+YRp/g+7kj/vXV4in8lBrNb9vaUkY8Fxge+oEf+yV8k7gx+YfL3OAcCvZf2d/h94A8eajeW/i/X3srzeqWOnib7P8AaBtJZvMIxkEDCg56muieEw9ON3G9jnhjMRUnZStc9atP28rYyJ9s8HTJFn5jb3qlsewZQP1rrPDP7ZvhLXZIIZ9J1m1mlfaPLt1mUZOByp9+awPCWg+APEnjMeG/h14R06+s7Fg2r+JtRiNyiIDwkW/Id3xgMRgckA9a+krSxstHshDb28FhaxLjEapFGg6c42hR78V5lZUIq0aev4nrUViJe9Kei+4ssMEj0OKjptnfW+p2qXVrMtzbyZKSoflcA4JHryDzTyMV5Z6KEooooW4PYKKKKQzF8YeIpPCWgT6wLR722tCJbqKHmUQj7zoP4iuQ23uAan8P+I9H8b6Il/pV7b6rptym3fCQysCMFWU8jjIIPvWmY1lUo6hkYEMrDIYHjB9j3r5D+LXwZ8W/BvxDdeLvhvdX0GkzN5txaWJJe15yQUGQ8f1Bx0966qFOnV0vaRzV6k6WtrxPQPH3hjxb8Dhc+KPh/epP4WiBnvvDOoPuggXOWaAkjYvPQEY6DPQfPvx0/aPvPjLZWOmQ6TBpemQMJmR8SyvNjDEPj5V7be/eqHi744+PfjNpmm+E7hReSTXSotvptuUlvZSQEjZVJDEE8DHU5PSvSP2jf2aU/Zr8EfDHQdViSTxzr8d1q2turb/swXakNtGRxtXc5bHV++AK+ho4f2cfaVLcyPn62JVWXs6bfKz5tg0mRlUswQdQqjv9K9a+Cv7Jfjz4/wAd/N4Q01JLGxOy4v7+5W3txJgERqxBy+MHGPxGa4DX2bQ9NEwA8yRtik9+Mkn3FfVn7A37e/hz9nnw5rPg/wAb6Nqd/YX1/wDb7PUdJWOSWOVkRGjkRmUFTsBDA9yMc5HZRTqx9otjkrWpvktqfKXj34X+Jvhr4tvPDPiHSLjT9btf9ZaMu5sEbgw253AryCCRXsX7O/hj4Z/GWaPw34m0k6Z4mjG+3vNOuWgj1CNcEo0fKiQDOdoXcM966b9qL9ov/hcP7Q2k/ELQNNl0S00NrOKwSbBmZIZd2+XGQCS5+UEgAdTzXpH7d/7LUXw4v7D41fDKFtO0ueWG81CwtEwNOmfDR3Eajjy2Y4Zf4Tz0Y4ylatBqL1RcE6Ek2tz6U0+3is7eKCCNYoYkWONFGAqgYAH4Vow1wPwd+IVv8UPh7o3iOAqj3UOLiFSD5M6nbIh+jDg+hWu9iI4r5OcXGTTPrYyU4pxLsfarKdRVSM8VZUipQWLIxjkjBHT19f6VjeDPDsnhiwuLN545ozcPLCFBBRW6Kc9+9a6N6VIpyK0vpYyaMXxj4ek8T2llbRyxxRx3KSy7wTvUdQPrWyx3ew6jP8qcSMVExxmld2sCRE/eqslTMcmq8vSszWxWl6Vl6lZwajZ3FrdRrNbTxtFLG4yrqwIIPsQTWlJXn3xp+I8Hwr+HWseIpMNcW8ey1hb/AJaTvxGv03ZJ9lNXCMpSSj1FNqEW5bI+Kf2iPDfw1+EE8nhjwrpTan4jZc3d9qNy062Kn7sapwpkwepBKjHc8eT/AA++FPij4n+Lrbwx4c0e41DW58lbYLtZQFyzMWwFUDBJboD719ofsJfsuweLPtvxy+J0B1DTbQzalplhdLuW+kjDSSXUqnqilfkU/ePP3QM+Z/smftGJ8F/jtqnjzXdMm1qx15bpL/ySPtKLLKHEiE4DEbQCCQCCfQV9bG1CC5nqfKVL1ZOUVp0PNfjV+yl46/Z+lsR4v06OK1vzttr6xuVnt3cDJTdjhgOoI+leTz6S6ISrBl7ow5NfYX7ff7ePhz9ovQ9E8JeCtH1HT9J02+N9dX+qKkcs0ojeJY40Vm2oA7EknJOBjivlrQWOuaX55X94rbH2jqeuautenHn6EUuWo+XqegfAz9pO8+DumX2k3Gkw6npspaaJUYQypMRg7nx8ynABB5H8NfQHgDwj4r+M4tfFPxEv1Tw7Kv2ix8MWL7beRSTtefBO4cZ2kkkddvSvNv2ef2Y3/aT+GXxP03RbeMeNvDMlnqekNuEf2tJQ6zWzk/3vKUoeiuT2Y15p4P8Ajz48+EWi3vhSzYWxhuWXydQti01m4JEkao33fmHIIyDn1rjrYfnTnS3Z1UMQqclCreyPvvxL4o0fwNosmo6xfW2lafbpjdJ8q8DhUXq3GAFHPFQ+EPEEvirQLfV3spNPhvMy20E/Evkn7jOOzMBux2BA65r5g+D/AMFPFfxZ8RWvjD4lXN7PpkDLLb2moE77o5BH7s8JF69N2OlfXQUKoAAUDgAdAO3+fTFfP1oQo+7e8j6GjUnW961kNooPWiuZbm72CgHFFFIY4HNP7gjgjoQSCPcHtUa9Kkpha5jeFPBHhvwd8T7T4gadoNjH4ntSSly0fycjax2DADFSRvHPPUV5/wD8FF9aT4leJfhr4msbScRW9ld2F+hUlbaTerplhxhstg/7PNetbaSWJJ43jkVZI3Uq6uNwYc9QeD1rrp4mcE4t3TOWphKdRqVrNH5y/EzwvcXHgyG+t4d6WcwM3l5YqrLjJ+hH615z4G8P3PiHxXp1naxNM3mrI2wZ2opySfbiv1e0rStH0rw1qmhxeHtHbT9RyZlezUupOPuN1UcfdHB+lcpp3wf8LaJHP/Y2kWmkTT/62W2iAZhnkZ7D2Fd9HMPq9F02r3PNq5fKpVVQ+K/EeklbhbWLJnuLiOBI9vLF3VQAO55r9hPFljpem+DV0bXxHc6fJYrYXFo4yLhPKEboB1IIB5r4+0z4BeH7bxZp3iC5nu7y70+5S7t4iVSISo25GZQPnxjoeK9evNTu9WvGur24kurhs5llYlufT0HsKypYz2VNxt7zOt4OU580tkee/BD4NW3wW0fVtKstWuNSsby+N5DHcRBPs4K7QgwTuOAMk/3R616lD0AqlDxVyI8CvPlJzk5Pqd0YKEVFdC2pxU6NVVGqYNUFWLSPUofHXg+lVBJt5z0BrI8I6jPqNjcTzyNJuuGCBv4Rnp+tO5J0RY4qNmweaaZOKjdqLgDuMcVXc5pzNUTnPekVYhkOK8t+NfwZsvjVY6Fp2p6ncWGmaffi7nt7ZA32pNoBjySNnfDc43HivUJT1qlMcjFXCbpyUo7omUFNcrPXdF0zT/EngO90PQTFBZyabNpsFvGNgtw0LRoMdgMjBr8fPCmk+cYbWTPnQu0DrjurFW49sV+k1lql5pF2tzZXMtrcKQRJE2Dnt9fxrxy7/Z88PHxPf63aT3VnPf3L3dxACrxeY7bnKAj5ASegrvq4xVqdvtI4I4N05t9Gfm5400C58O+JtQsbqNo3WZmXcMBlJyCPUYNemfDfwrPaeCDe3UJiW9mMkPmgqXRRglT9a+69S+D3hbXBA2s6PaaxPCMJNcwgsvPT3A7A5FdXq2l6RrGg6TpE3h/R0s9NA8nyrJFdjj+Nv4x7HIFdFfMfb0Y0rWZy0cvnTqup0PNP+Cc/iVfhhe/FLW76xuAL6KwtbGNlIW4dDKX+Y9l3Lk+4rsvEngbw34p+Jt/8QL7QbFvFF62+W6WPjdjG7Yfl3YAG7G49zkZrbihSGFIo1EcaABVQAKAOnA44pSuBXn1MVUqRUE7JHpU8JTptyau2NbJ5Jz3pp5p56UyuKyR1u408UUHrRTW5L2CijpSFvSkMcCBUgINQA8809WANAE9LtpitmpAc0/IpCqueKeq801PbrUyqT1pDHItWYhnFRIlTINtMC1FVlGwBVRGxU6vQQWVYCpVeqqtUgfkUATXVwIbSeUnhI2P5An/CsvwQvk+Hbcn/AJaFn/M4H8qXX5/K0O+fPSJh+fFO8OfudDsE7+UP1Of61S2Cxs76aWBqIucU3fSYWHMw5qJ3FIz1EzZpXARznNV5BkVIz8VC75ouBWk61WfrxVtxnNV3TBoLWmxXIOKjYetTkYzUbilYCIimnpTmOKjLUCYEjmmE46UMwzUZagkceaKQNxS01uJ7DM4pGbNIetJSGLuxSq2TUbHBoDYNMaLKvUqvVVWNSqxoKLSPU6NVNGqZXPFIC4r1MhyKqIxqZGoJZYVqmR6ro1SA8UDLIenq/NVQ9SK/GaZJQ8Xz+X4fux/eCr/48KvadcRQabaoZFBWJBjI/uiuR+Jmspp3hmaaZisCyIGKqW6n0HNVk1qC7to5rWVZ4dow8bAj9KpK8RXR34u4nPyyqfbIp5fHWvPTrkGnwPcXc8dvCnJkkOBW94a1+313T4ruzkM1tLnYzKV6fWi1kF0dAz1GX4ppfryKjZ6ljHM1RM2aUsSKiY4pADHFQu9K7VCzGgaGu1RM9K7VCz4oKEd6iL80OxqIsc0wHM9Rhs0jNQpzQSx27FOB96ZmlBoW5LEJxTGb0pSc0wnmhFAWpueaCabuqiiZWqVW96rK1SK1AFpGNTK3TmqqNUyt05qWBaRqnRveqiNU6GkBaUn1qRW461Ap96ePu8HmggmBJ6cnt9aydH1uXWdTvTEsf9mW58pJiPmkk74PpVbxbqctjpghtSRfXj/ZoPYngn8BmtLSNOi0fToLOILsiXZnHU9z+dVshoq+KdEXXNJvLB2dEuI/LZ4vvLnqf/rV5LpnwRg0Aztaazf20khxiA7Ix/wHJr3EHjrSMiN1RT9RTjOUNES0jxDUvghb689u91rV/cSR9pTuT3wvQH869a8M6KNF0q0s1eSSOCMRh5D8xx0rVVEU8Io/CnFqcpuSsxpLcyNX1yXSdXs0mRF025PlGbvHKemfY1rE8nPB9D2qlrOmRa1pk9nIOJVwG7q3UEfiKzvCmqyajpQS4b/TbVjbzgjncOhP1HNS9UNm4W560x2FITz1qN296kQ12PPNQM2Kc7dahc570FjXbNQuxpzHHeoHamgBm96iLc0M1RM1UA8tQGqPdTgcUASA5p4NRg4pwNT1IaEPSmGnnpTG6UFjaa3FOPSmHpVAJkipFJxUVPTtQBYQnJqdDVVDUyk8c0rAWUOKnRhVVO1TowHakK5bRhUgYVWRqkDe+PekSYOf7V8bOd26LTYMY7eY/X9K6YtyQeCDjiuX8FsLmHU79lw13eSEH1VeBXR7xTYdLku73p26og4x0o3+1IehLupC1R7/AGoL+1MNBxb6kelc0r/2T42dC22LU4C+0DjzE6/mOfwrot4rm/GMhtTpV8gw1veICewVhg012F5nSbgOKjdhSE4OPTio3qQQ1mFQuwFPfvUDUyxkhqF+9PfvUT9KdgI3aoix605qbTAcDmnA5po6U5aAJB0pw6UwdKeOlT1EPPSoSOfwqUjNNYYoQrkRpuKkIzSbaooZinUuKMUACnmplNRAZPFSLxilcVydDUqmq6HFSoaRJaV6ju5vLtZnJ4WNm/IGkU4qtrDldJvSO0L/APoJoW4mV/BWV8L6ef78Zf8A76Yn+tM8b+OLD4f6C+railxJbK6x7LWLzHJPQYz0p/hI48M6Zjp5C/yrVYK4w6h16lSMg+lF0nqrhd20PHn/AGrfDQH7rRNdn91gTB/8fqB/2rdL/wCWfhbXW/7ZqP617FNY2s8XlyW0Lr0wYx0/KqMvhbSpWz9lCeyMy/yNdKnRt8BHLU7nlUf7Vml/8tPC+uL9I1NWI/2rvDJH73RtdgPctboQP/Hq9Mj8K6VE+77Kr/77Fv0zWhFZWsEeyO3iVPQIP8KHOjbSAKNTuZ3grxnY+PPD8Osack8drKxULcxlHyOuRk03x0c+F75iPuBX/Jgf6VsJtjUKiqijoqDAH4Vj+MyG8L6mG6eQa57q+hbbtqa1tOZbaFyclkVj+IBpzMPWqmmOW020PrEn/oIqw1JjQxjzULmnsetROcmgdyNjUTGpCM0wjjHencdxp6U3FP20baYxo606jbSgYoAWnikVSeacBip6ktjiMUhp+D3ppGKQiNhn2pNtSEZpCKdx3GfhS7adz6UYouFxoFOApQPSlA9aQgAqRTimqKcBigB9Q3y+bY3Kdd0TjH/ATUuaSmBm+D5d3hnTvaIKfqOK2Q2e9QLgAAAKo6BRgCnbvem+4E2fekyKi3e9G73qQJunejPvUW+k3e9AE2fesDx05HhXUcHgoFyfc1s7vemthgQQGB7MMj8qoBlmDHZwJ02xqMH6CpS3vTTRSAGPWo2p55prLSAj20bKcR6UlMCMrRin4owfSi47jNtOUY96UClAxRcLgOlOVc0AZFKOKFuSxxGaQrinUUhkeBS7M0+k2570AN2UbMU7Z70bcd6AGgelKF9adRQAmMUtFFABRRRQAUUUUwCiiikAUUUUAFFFFMAooopAFJjNLRQA0r6UhFPooAZso2U7bnvRs96AG7cUmBT9uKWgBoXIpcCloprcT2P/2Q=='
};
/* بافت‌های نقاشی‌شدهٔ صورت: ابتدا نسخهٔ رویه‌ای نمایش داده می‌شود و پس از بارگذاری تصویر جایگزین می‌شود */
 const PIMG={};const picFor=k=>{if(!PIC[k])return null;if(!PIMG[k]){const im=new Image();im.src=PIC[k];PIMG[k]=im}return PIMG[k]};
 const mkTex=p=>{const id=p._id,key=id&&(p.closed?id+'_c':id),img=key&&picFor(key);
  if(img){const c=document.createElement('canvas');c.width=c.height=256;const cx=c.getContext('2d');
   const fill=()=>{cx.clearRect(0,0,256,256);cx.drawImage(img,0,0,256,256);
    /* لبه‌ها را آرام با رنگ پوست سر ترکیب می‌کنیم تا صورت بدون درز روی سر بنشیند */
    try{const sk=PRE[id]?PRE[id].skin:0xf2bd9f,R=sk>>16&255,G=sk>>8&255,B=sk&255,F=46,D=cx.getImageData(0,0,256,256),a=D.data;
     for(let y=0;y<256;y++)for(let x=0;x<256;x++){const d=Math.min(x,y,255-x,255-y);if(d>=F)continue;let w=d/F;w=w*w*(3-2*w);const i=(y*256+x)*4;
      a[i]=R+(a[i]-R)*w;a[i+1]=G+(a[i+1]-G)*w;a[i+2]=B+(a[i+2]-B)*w}
     cx.putImageData(D,0,0)}catch(e){}};
   const t=new THREE.CanvasTexture(c);t.anisotropy=window.__HQ?8:4;t.colorSpace=THREE.SRGBColorSpace;
   if(img.complete&&img.naturalWidth){fill()}else{cx.drawImage(AFp.canvasFor(p,1),0,0,256,256);img.addEventListener('load',()=>{fill();t.needsUpdate=true})}
   return t}
  const c=AFp.canvasFor(p,window.__HQ?4:3),t=new THREE.CanvasTexture(c);t.anisotropy=window.__HQ?8:4;t.colorSpace=THREE.SRGBColorSpace;return t};
 const by=id=>o=>mkTex(Object.assign({},PRE[id],{_id:id},o&&o.closed?{closed:1}:null));
 GX.faceAl=by('ali');GX.faceDj=by('doj');GX.faceAc=by('acro');GX.facePr=by('pri');GX.faceRf=by('raf');GX.faceCr=by('cri');
 GX.faceN=o=>{const id=o&&o.id||(o&&o.skin===0xe8b898?'aka':'mak');return mkTex(Object.assign({},PRE[id],{_id:id},o&&o.closed?{closed:1}:null))};
 GX.face=o=>mkTex(Object.assign({},PRE.ali,conv(o),{_id:(o&&o.closed)?null:'ali'}));
 /* شکل سر: فک باریک‌شونده + چانه + گونهٔ پر؛ نرمال‌ها تحلیلی‌اند تا لبهٔ تکهٔ صورت درز نداشته باشد */
 const sm=(a,b,x)=>{x=Math.min(1,Math.max(0,(x-a)/(b-a)));return x*x*(3-2*x)};
 GX.ashape=(g,r,o)=>{o=o||{};const jw=o.jaw==null?.3:o.jaw,ch=o.chin==null?.09:o.chin,P=g.attributes.position,N=g.attributes.normal;
  const F=(x,y,z)=>{const t=Math.pow(sm(.1,-.95,y),1.1),cb=Math.exp(-Math.pow((y+.3)/.3,2));
   return[x*(1-jw*t)*(1+.035*cb),y-ch*t*t,z*(1-jw*.45*t)+.04*ch*t*t]};
  const e=.002,J=new Array(9);
  for(let i=0;i<P.count;i++){const x=P.getX(i)/r,y=P.getY(i)/r,z=P.getZ(i)/r;
   const a=F(x+e,y,z),b=F(x-e,y,z),c=F(x,y+e,z),d=F(x,y-e,z),f=F(x,y,z+e),h=F(x,y,z-e);
   const m=[(a[0]-b[0])/(2*e),(c[0]-d[0])/(2*e),(f[0]-h[0])/(2*e),(a[1]-b[1])/(2*e),(c[1]-d[1])/(2*e),(f[1]-h[1])/(2*e),(a[2]-b[2])/(2*e),(c[2]-d[2])/(2*e),(f[2]-h[2])/(2*e)];
   if(N){const nx=N.getX(i),ny=N.getY(i),nz=N.getZ(i);
    const c0=m[4]*m[8]-m[5]*m[7],c1=m[5]*m[6]-m[3]*m[8],c2=m[3]*m[7]-m[4]*m[6],c3=m[2]*m[7]-m[1]*m[8],c4=m[0]*m[8]-m[2]*m[6],c5=m[1]*m[6]-m[0]*m[7],c6=m[1]*m[5]-m[2]*m[4],c7=m[2]*m[3]-m[0]*m[5],c8=m[0]*m[4]-m[1]*m[3];
    let X=c0*nx+c1*ny+c2*nz,Y=c3*nx+c4*ny+c5*nz,Z=c6*nx+c7*ny+c8*nz;const L=Math.hypot(X,Y,Z)||1;N.setXYZ(i,X/L,Y/L,Z/L)}
   const q=F(x,y,z);P.setXYZ(i,q[0]*r,q[1]*r,q[2]*r)}
  P.needsUpdate=true;if(N)N.needsUpdate=true;else g.computeVertexNormals();return g};
 /* سر عمومی (آلیس‌های قدیمی، ماکائو، آکا): سر + تکهٔ صورت + گوش */
 GX.head=(G,M,o)=>{const p=new THREE.Vector3(0,o.y,0),r=o.r,
  h=new THREE.Mesh(GX.ashape(new THREE.SphereGeometry(r,48,36),r,o.shape),M(GX.c(o.skin),{roughness:.6}));h.position.copy(p);G.add(h);
  const f=new THREE.Mesh(GX.ashape(new THREE.SphereGeometry(r*(o.nat?1.008:1.004),40,28,Math.PI/2-.5,1,1.07,1),r,o.shape),M(0xffffff,{map:(o.nat?GX.faceN:GX.face)(o),roughness:o.nat?.6:.65,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));f.position.copy(p);G.add(f);
  [-1,1].forEach(s=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.05,10,8).scale(.5,1,.8),h.material);e.position.set(s*r*.97,o.y-.02,0);G.add(e)})};
})();
