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
 const hr=.225,hy=.2;B(S(hr,1,1.08,1.02),Sk,0,hy,0,HD);
 B(new THREE.SphereGeometry(hr*1.008,28,20,Math.PI/2-.5,1,1.07,1).scale(1,1.08,1.02),M(0xffffff,{map:GX.faceAc({skin:0xf7dccf,hi:'#fde8de',ex:50}),roughness:.6,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),0,hy,0,HD);
 B(S(.17,1,.78,.92),Sk,0,hy-.12,.02,HD);B(S(.032,.85,1.5,1.2),Sk,0,hy-.03,hr*1.02,HD);
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
 const hr=.215,hy=.2;B(S(hr,1,1.1,1.02),Sk,0,hy,0,HD);
 B(new THREE.SphereGeometry(hr*1.008,28,20,PI/2-.5,1,1.07,1).scale(1,1.1,1.02),M(0xffffff,{map:GX.faceRf(),roughness:.65,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),0,hy,0,HD);
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
 const hr=.225,hy=.2;B(S(hr,1,1.08,1.02),Sk,0,hy,0,HD);
 B(new THREE.SphereGeometry(hr*1.008,28,20,PI/2-.5,1,1.07,1).scale(1,1.08,1.02),M(0xffffff,{map:GX.facePr({skin:0xf3d2c2,hi:'#f9e0d2',ex:50}),roughness:.6,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),0,hy,0,HD);
 B(S(.17,1,.78,.92),Sk,0,hy-.12,.02,HD);B(S(.032,.85,1.5,1.2),Sk,0,hy-.03,hr*1.02,HD);
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

