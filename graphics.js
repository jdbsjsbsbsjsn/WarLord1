/* graphics.js — گرافیک: صحنهٔ سه‌بعدی، موتور GX، شخصیت‌ها، اسکین‌ها، افکت و صدا */
/* ===== لایهٔ نمایش سه‌بعدی (Three.js) — منطق بازی بالاتر از این خط دست‌نخورده است ===== */
const CELL_X=c=>1.5*c, CELL_Z=(c,r)=>SQ*(r+((c&1)?.5:0));
const CTR=new THREE.Vector3(3.75,0,6.5);
let renderer,scene,camera,clock,raycaster,ringMesh,stGroup,hlTiles=[],pops=[],camYaw=0,camPitch=1.2,camZoom=1,aspectNow=1;
const tiles=[],pickables=[],unitG=new Map();
const GEO={tile:new THREE.CylinderGeometry(1,1,.34,6),base:new THREE.CylinderGeometry(.62,.7,.18,24),
 body:new THREE.CylinderGeometry(.34,.44,.9,16),head:new THREE.SphereGeometry(.3,16,12),cone:new THREE.ConeGeometry(.44,1.25,16),
 band:new THREE.TorusGeometry(.43,.06,8,24),shield:new THREE.TorusGeometry(.82,.07,8,32),cage:new THREE.CylinderGeometry(.78,.78,1.9,10,1,true),
 stone:new THREE.CylinderGeometry(.42,.5,.9,12)};
GEO.tile.rotateY(Math.PI/2);
const hue=k=>{let h=0;for(const ch of k)h=(h*31+ch.charCodeAt(0))%360;return h/360};
const rrect=(x,a,b,w,h,r)=>{x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()};
const TEAM=[0xff3a2a,0x2a7bff];
const FONT='Vazirmatn,Tahoma,sans-serif';
const LW=512,LH=176,LU=256;
function plate(x,name,num,frac,col,sel,barCol){
 x.clearRect(0,0,LW,LH);x.textBaseline='middle';x.direction='rtl';
 let fs=70;x.font='700 '+fs+'px '+FONT;while(x.measureText(name).width>430&&fs>40){fs-=2;x.font='700 '+fs+'px '+FONT}
 const nw=x.measureText(name).width;x.direction='ltr';x.font='700 56px '+FONT;const vw=x.measureText(num).width;
 const pad=24,pw=Math.round(Math.min(LW-12,Math.max(nw,vw+110)+pad*2)),h1=Math.round(fs*1.1),h2=56,ph=14+h1+4+h2+12,px=(LW-pw)/2,py=(LH-ph)/2;
 rrect(x,px,py,pw,ph,26);x.fillStyle='rgba(12,13,17,.82)';x.fill();x.lineWidth=sel?7:4;x.strokeStyle=sel?'#fff':col;x.stroke();
 x.fillStyle='#fff';x.textAlign='center';x.direction='rtl';x.font='700 '+fs+'px '+FONT;x.fillText(name,LW/2,py+14+h1/2+2);
 const cy=py+14+h1+4+h2/2,bx=px+pad,bw=pw-pad*2-vw-14,bh=16;
 rrect(x,bx,cy-bh/2,bw,bh,8);x.fillStyle='rgba(255,255,255,.2)';x.fill();
 if(frac>0){rrect(x,bx,cy-bh/2,Math.max(bh,bw*Math.min(1,frac)),bh,8);x.fillStyle=barCol;x.fill()}
 x.direction='ltr';x.textAlign='right';x.font='700 56px '+FONT;x.fillStyle='#fff';x.fillText(num,px+pw-pad,cy+2)}

function initScene(){
 renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.useLegacyLights=true;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;renderer.shadowMap.enabled=!!window.__HQ;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 scene=new THREE.Scene();scene.background=new THREE.Color(0x2a1d13);scene.fog=new THREE.Fog(0x2a1d13,28,48);
 camera=new THREE.PerspectiveCamera(38,1,.5,100);clock=new THREE.Clock();raycaster=new THREE.Raycaster();
 scene.add(new THREE.HemisphereLight(0xfff1dc,0x3a3128,.7));
 const sun=new THREE.DirectionalLight(0xffeccc,.8);sun.position.set(-4,16,16);sun.castShadow=true;sun.shadow.mapSize.set(512,512);
 Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:1,far:50});sun.target.position.copy(CTR);scene.add(sun,sun.target);
 // قاب و کف صفحه
 const frame=new THREE.Mesh(new THREE.BoxGeometry(12.2,.5,17.2),new THREE.MeshStandardMaterial({color:0x3b3025,roughness:.9}));frame.position.set(CTR.x,-.55,CTR.z);frame.receiveShadow=true;scene.add(frame);
 const floor=new THREE.Mesh(new THREE.BoxGeometry(11.4,.3,16.4),new THREE.MeshStandardMaterial({color:0x1d1813,roughness:1}));floor.position.set(CTR.x,-.28,CTR.z);scene.add(floor);
 [[-1,1],[1,1],[-1,-1],[1,-1]].forEach(([a,b])=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(.42,.5,.9,16),new THREE.MeshStandardMaterial({color:0x2a241d,roughness:.7}));m.position.set(CTR.x+a*5.9,-.1,CTR.z+b*8.5);m.castShadow=true;scene.add(m);
  const g=new THREE.Mesh(new THREE.SphereGeometry(.17,12,8),new THREE.MeshBasicMaterial({color:0xe8a33d}));g.position.set(m.position.x,.45,m.position.z);scene.add(g)});
 const bdGeo=new THREE.RingGeometry(.94,1,6,1).rotateX(-Math.PI/2),bdMat=new THREE.MeshBasicMaterial({color:0x5c5649});
 for(let c=0;c<COLS;c++){tiles[c]=[];for(let r=0;r<ROWS;r++){
  const mat=new THREE.MeshStandardMaterial({color:(c+r)%2?0x17130f:0x1c1713,roughness:.85,emissive:0x000000});
  const m=new THREE.Mesh(GEO.tile,mat);m.position.set(CELL_X(c),-.17,CELL_Z(c,r));m.receiveShadow=true;m.userData={c,r};scene.add(m);tiles[c][r]=m;pickables.push(m);
  const bd=new THREE.Mesh(bdGeo,bdMat);bd.position.set(CELL_X(c),.012,CELL_Z(c,r));scene.add(bd)}}
 ringMesh=new THREE.Mesh(new THREE.RingGeometry(.8,.95,6,1).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xffffff}));ringMesh.position.y=.03;ringMesh.visible=false;scene.add(ringMesh);
 stGroup=new THREE.Group();scene.add(stGroup);
 resize();loop();
}
function resize(){
 const st=$('stage'),w=Math.max(1,st.clientWidth),h=Math.max(1,st.clientHeight);
 renderer.setSize(w,h,false);aspectNow=w/h;camera.aspect=aspectNow;camera.updateProjectionMatrix()}
function placeCamera(){
 const f=Math.tan(camera.fov*Math.PI/360),need=Math.max(7.4/f,5.3/(f*aspectNow))*1.03*camZoom;
 camera.position.set(CTR.x+Math.sin(camYaw)*Math.cos(camPitch)*need,Math.sin(camPitch)*need,CTR.z+Math.cos(camYaw)*Math.cos(camPitch)*need);
 camera.lookAt(CTR.x,0,CTR.z+1.1)}

function mkLabel(){const cv2=document.createElement('canvas');cv2.width=LW;cv2.height=LH;const tex=new THREE.CanvasTexture(cv2);tex.colorSpace=THREE.SRGBColorSpace;
 const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false,toneMapped:false}));sp.scale.set(LW/LU,LH/LU,1);sp.renderOrder=10;return{cv:cv2,tex,sp}}

function limb(M,p1,p2,r,mat){const a=new THREE.Vector3(...p1),b=new THREE.Vector3(...p2),d=b.clone().sub(a),L=d.length(),m=new THREE.Mesh(new THREE.CylinderGeometry(r,r*.9,L,10),mat);m.position.copy(a).addScaledVector(d,.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m}
function aliceTex(kind){const c=document.createElement('canvas'),x=c.getContext('2d');
 if(kind==='face'){c.width=128;c.height=128;x.lineCap='round';
  x.fillStyle='#f0b99a';x.fillRect(0,0,128,128);
  x.strokeStyle='#6b1020';x.lineWidth=7;x.beginPath();x.moveTo(14,38);x.lineTo(50,48);x.moveTo(114,38);x.lineTo(78,48);x.stroke();
  [[36,68],[92,68]].forEach(([ex,ey])=>{x.fillStyle='#fff';x.beginPath();x.ellipse(ex,ey,15,12,0,0,7);x.fill();x.fillStyle='#d3152b';x.beginPath();x.ellipse(ex,ey+1,10,11,0,0,7);x.fill();x.fillStyle='#3a0610';x.beginPath();x.arc(ex,ey+1,5,0,7);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(ex-3,ey-3,3,0,7);x.fill()});
  x.strokeStyle='#a0504a';x.lineWidth=4;x.beginPath();x.moveTo(52,106);x.lineTo(76,106);x.stroke();
  x.fillStyle='rgba(255,120,120,.25)';x.beginPath();x.arc(20,92,10,0,7);x.arc(108,92,10,0,7);x.fill()}
 else{c.width=256;c.height=256;x.fillStyle='#17171c';x.fillRect(0,0,256,256);
  x.strokeStyle='#d8aa3a';x.lineWidth=10;x.strokeRect(5,5,246,246);
  x.lineCap='round';x.lineWidth=13;x.beginPath();x.arc(128,66,17,0,7);x.moveTo(128,83);x.lineTo(128,206);x.moveTo(98,108);x.lineTo(158,108);x.moveTo(60,158);x.quadraticCurveTo(70,214,128,214);x.quadraticCurveTo(186,214,196,158);x.stroke();
  x.fillStyle='#d8aa3a';x.beginPath();x.moveTo(48,168);x.lineTo(76,160);x.lineTo(66,188);x.fill();x.beginPath();x.moveTo(208,168);x.lineTo(180,160);x.lineTo(190,188);x.fill()}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t}
function buildAlice(M,team){
 const G=new THREE.Group(),add=(m,x,y,z)=>{m.position.set(x,y,z);G.add(m);return m},
  W=M(0xf1ede6),K=M(0x1b1b21),Au=M(0xd8aa3a,{metalness:.5,roughness:.4}),Hr=M(0xc41230,{roughness:.8}),Sk=M(0xf0b99a,{roughness:.7}),Wd=M(0x6b3f1d,{roughness:.8}),Mt=M(0x2a2c30,{metalness:.6,roughness:.4}),Tm=M(team.getHex?team.getHex():0xff3a2a);
 const Y0=.18;
 // boots
 [-1,1].forEach(sx=>{add(new THREE.Mesh(new THREE.CylinderGeometry(.16,.18,.5,12),K),sx*.2,Y0+.25,0);add(new THREE.Mesh(new THREE.BoxGeometry(.3,.12,.42),K),sx*.2,Y0+.06,.07);add(new THREE.Mesh(new THREE.BoxGeometry(.34,.06,.06),Au),sx*.2,Y0+.38,.12);
  G.add(limb(M,[sx*.2,Y0+.5,0],[sx*.2,Y0+.95,0],.14,Sk));add(new THREE.Mesh(new THREE.CylinderGeometry(.152,.152,.06,12),K),sx*.2,Y0+.78,0)});
 // skirt
 add(new THREE.Mesh(new THREE.CylinderGeometry(.3,.5,.34,16),K),0,Y0+1.02,0);add(new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,.035,16),Au),0,Y0+.86,0);
 // torso
 add(new THREE.Mesh(new THREE.CylinderGeometry(.3,.27,.62,14),W),0,Y0+1.5,0);
 add(new THREE.Mesh(new THREE.SphereGeometry(.2,10,8),W),-.12,Y0+1.58,.15);add(new THREE.Mesh(new THREE.SphereGeometry(.2,10,8),W),.12,Y0+1.58,.15);
 add(new THREE.Mesh(new THREE.BoxGeometry(.07,.46,.03),K),0,Y0+1.5,.29);
 add(new THREE.Mesh(new THREE.CylinderGeometry(.285,.285,.07,14),K),0,Y0+1.2,0);
 [-1,1].forEach(sx=>{add(new THREE.Mesh(new THREE.BoxGeometry(.14,.2,.16),K),sx*.34,Y0+1.1,.06);add(new THREE.Mesh(new THREE.BoxGeometry(.2,.04,.14),Au),sx*.33,Y0+1.84,0)});
 // arms holding the rifle
 const hand=[[-.3,Y0+1.52,.4],[.26,Y0+1.18,.42]];
 [-1,1].forEach((sx,i)=>{const sh=[sx*.36,Y0+1.74,0],h=hand[i],el=[sx*.46,Y0+1.4,.12];G.add(limb(M,sh,el,.085,W));G.add(limb(M,el,h,.075,W));add(new THREE.Mesh(new THREE.SphereGeometry(.09,10,8),K),h[0],h[1],h[2])});
 add(new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.1,12),Tm),.405,Y0+1.58,.07).rotation.z=.2;
 // rifle
 const R=new THREE.Group();R.position.set(0,Y0+1.4,.45);R.rotation.z=-.55;G.add(R);
 const rp=(m,x,y,z)=>{m.position.set(x,y,z);R.add(m)};
 rp(new THREE.Mesh(new THREE.BoxGeometry(.5,.16,.09),Wd),-.42,0,0);rp(new THREE.Mesh(new THREE.BoxGeometry(.6,.1,.09),Wd),.08,0,0);
 const br=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.95,8),Mt);br.rotation.z=Math.PI/2;rp(br,.85,.01,0);
 const sc=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.42,10),K);sc.rotation.z=Math.PI/2;rp(sc,.0,.12,0);rp(new THREE.Mesh(new THREE.BoxGeometry(.04,.06,.04),Mt),-.1,.07,0);rp(new THREE.Mesh(new THREE.BoxGeometry(.04,.06,.04),Mt),.1,.07,0);
 // cape
 const capeM=M(0xffffff,{map:aliceTex('cape'),roughness:.85});
 const cape=new THREE.Mesh(new THREE.BoxGeometry(.98,1.05,.035),capeM);add(cape,0,Y0+1.22,-.28).rotation.x=-.06;
 add(new THREE.Mesh(new THREE.BoxGeometry(.94,1.0,.02),M(0x8c1020)),0,Y0+1.23,-.255).rotation.x=-.06;
 // head
 const faceM=M(0xffffff,{map:aliceTex('face'),roughness:.7});
 add(new THREE.Mesh(new THREE.SphereGeometry(.27,18,14),Sk),0,Y0+2.0,0);
 const face=new THREE.Mesh(new THREE.PlaneGeometry(.3,.3),faceM);face.position.set(0,Y0+1.98,.262);G.add(face);
 // hair: cap + long back + side locks
 const cap=new THREE.Mesh(new THREE.SphereGeometry(.3,16,12),Hr);cap.scale.set(1,.82,1);add(cap,0,Y0+2.07,-.05);
 const back=new THREE.Mesh(new THREE.SphereGeometry(.36,16,12),Hr);back.scale.set(1.12,2.2,.5);add(back,0,Y0+1.5,-.17);
 [-1,1].forEach(sx=>{const l=new THREE.Mesh(new THREE.SphereGeometry(.12,10,8),Hr);l.scale.set(.7,3.2,.7);add(l,sx*.3,Y0+1.78,.02);const w=new THREE.Mesh(new THREE.SphereGeometry(.14,10,8),Hr);w.scale.set(.8,2.2,.7);add(w,sx*.4,Y0+1.2,-.1)});
 const fr=new THREE.Mesh(new THREE.SphereGeometry(.16,10,8),Hr);fr.scale.set(1.5,.6,.6);add(fr,0,Y0+2.18,.2);
 // captain hat
 add(new THREE.Mesh(new THREE.CylinderGeometry(.33,.3,.14,18),W),0,Y0+2.33,-.02);add(new THREE.Mesh(new THREE.CylinderGeometry(.31,.31,.06,18),K),0,Y0+2.26,-.02);
 add(new THREE.Mesh(new THREE.BoxGeometry(.44,.03,.2),K),0,Y0+2.24,.3);add(new THREE.Mesh(new THREE.BoxGeometry(.1,.1,.02),Au),0,Y0+2.36,.31);
 return G}


function makTex(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.lineCap='round';
 x.fillStyle='#f3d9ca';x.fillRect(0,0,128,128);
 x.strokeStyle='#1a1216';x.lineWidth=6;x.beginPath();x.moveTo(16,50);x.lineTo(50,52);x.moveTo(112,50);x.lineTo(78,52);x.stroke();
 [[36,72],[92,72]].forEach(([ex,ey])=>{x.fillStyle='#f8f4f0';x.beginPath();x.ellipse(ex,ey,15,11,0,0,7);x.fill();x.fillStyle='#2f7a64';x.beginPath();x.ellipse(ex,ey,10,11,0,0,7);x.fill();x.fillStyle='#0b1a15';x.beginPath();x.arc(ex,ey,5,0,7);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(ex-3,ey-3,2.5,0,7);x.fill();x.strokeStyle='#1a1216';x.lineWidth=4;x.beginPath();x.moveTo(ex-16,ey-6);x.lineTo(ex+16,ey-6);x.stroke()});
 x.strokeStyle='#b06a66';x.lineWidth=4;x.beginPath();x.moveTo(54,104);x.lineTo(74,104);x.stroke();
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
function buildMakao(M,team){
 const G=new THREE.Group(),add=(m,x,y,z)=>{m.position.set(x,y,z);G.add(m);return m},
  K=M(0x15111a,{roughness:.85}),Gr=M(0x1d3b32,{roughness:.85}),Sk=M(0xf3d9ca,{roughness:.7}),Hr=M(0x0d0b10,{roughness:.8}),Ro=M(0x8c1224,{roughness:.7}),Sv=M(0xc2c6ce,{metalness:.7,roughness:.35}),Gm=M(0x2fbf8f,{emissive:0x0a3a2a}),Tm=M(team.getHex?team.getHex():0xff3a2a);
 const Y0=.18,sph=(r,sx,sy,sz,m)=>{const q=new THREE.Mesh(new THREE.SphereGeometry(r,12,10),m);q.scale.set(sx,sy,sz);return q};
 // tiered skirt
 const T=[[.8,.66,K],[.72,.6,Gr],[.62,.5,K],[.52,.42,Gr],[.42,.32,K]];
 T.forEach((t,i)=>{add(new THREE.Mesh(new THREE.CylinderGeometry(t[1],t[0],.24,20),t[2]),0,Y0+.12+i*.2,0)});
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.8,.03,6,32),Tm);ring.rotation.x=Math.PI/2;add(ring,0,Y0+.03,0);
 // tassels + gems on the skirt
 for(let i=0;i<10;i++){const a=i/10*Math.PI*2,r=.62+.06*(i%2),y=Y0+.28+(i%3)*.22;add(new THREE.Mesh(new THREE.ConeGeometry(.035,.16,6),Sv),Math.sin(a)*r,y,Math.cos(a)*r).rotation.x=Math.PI;add(new THREE.Mesh(new THREE.OctahedronGeometry(.05),Gm),Math.sin(a)*(r-.02),y+.14,Math.cos(a)*(r-.02))}
 // bodice
 add(new THREE.Mesh(new THREE.CylinderGeometry(.27,.2,.52,16),K),0,Y0+1.36,0);
 add(sph(.14,1,1,1,K),-.11,Y0+1.5,.14);add(sph(.14,1,1,1,K),.11,Y0+1.5,.14);
 add(new THREE.Mesh(new THREE.BoxGeometry(.03,.4,.02),Sv),0,Y0+1.34,.26);add(new THREE.Mesh(new THREE.OctahedronGeometry(.045),Gm),0,Y0+1.5,.27);add(new THREE.Mesh(new THREE.OctahedronGeometry(.04),Gm),0,Y0+1.25,.24);
 add(sph(.12,1,.7,1,Ro),0,Y0+1.12,.3);add(sph(.07,1,.6,1,Ro),.3,Y0+1.1,.2);
 // neck, choker, head
 add(new THREE.Mesh(new THREE.CylinderGeometry(.07,.08,.14,10),Sk),0,Y0+1.68,0);add(new THREE.Mesh(new THREE.CylinderGeometry(.095,.095,.07,12),K),0,Y0+1.7,0);add(new THREE.Mesh(new THREE.OctahedronGeometry(.035),Gm),0,Y0+1.69,.095);
 add(sph(.26,1,1,1,Sk),0,Y0+1.95,0);
 const face=new THREE.Mesh(new THREE.PlaneGeometry(.3,.3),M(0xffffff,{map:makTex(),roughness:.7}));face.position.set(0,Y0+1.93,.252);G.add(face);
 // hair: black, straight bangs, very long
 add(sph(.29,1,.85,1,Hr),0,Y0+2.0,-.05);
 add(sph(.36,1.12,2.2,.5,Hr),0,Y0+1.45,-.18);
 add(new THREE.Mesh(new THREE.BoxGeometry(.4,.13,.05),Hr),0,Y0+2.08,.24);
 [-1,1].forEach(sx=>{add(sph(.1,.7,3.4,.7,Hr),sx*.27,Y0+1.62,.05);add(sph(.13,.8,2.6,.7,Hr),sx*.38,Y0+1.1,-.12)});
 add(sph(.11,1.2,.8,1.2,Ro),-.2,Y0+2.18,.1);add(sph(.07,1.2,.8,1.2,Ro),-.2,Y0+2.2,.15);
 [-.26,-.2].forEach((x,i)=>add(new THREE.Mesh(new THREE.ConeGeometry(.025,.14,6),Gm),x-.03,Y0+1.95-i*.03,.2).rotation.x=Math.PI);
 // shoulders, bell sleeves, gloves
 [-1,1].forEach(sx=>{add(sph(.11,1,.8,1,Sk),sx*.3,Y0+1.62,0);
  add(sph(.15,1.1,.6,1.1,Gr),sx*.38,Y0+1.58,0);
  add(new THREE.Mesh(new THREE.CylinderGeometry(.1,.2,.42,12),Gr),sx*.46,Y0+1.34,.02);
  add(new THREE.Mesh(new THREE.CylinderGeometry(.19,.19,.04,12),K),sx*.46,Y0+1.13,.02);
  G.add(limb(M,[sx*.47,Y0+1.2,.04],[sx*.5,Y0+.9,.12],.06,K));add(sph(.075,1,1,1,K),sx*.5,Y0+.88,.12)});
 // ornate silver revolver in her right hand (viewer's left)
 const gun=new THREE.Group();gun.position.set(-.5,Y0+.9,.2);gun.rotation.x=.9;G.add(gun);
 const gp=(m,x,y,z)=>{m.position.set(x,y,z);gun.add(m)};
 [-.025,.025].forEach(x=>{const b=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,.5,8),Sv);b.rotation.x=Math.PI/2;gp(b,x,0,.34)});
 const dr=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.14,10),Sv);dr.rotation.x=Math.PI/2;gp(dr,0,0,.02);
 gp(new THREE.Mesh(new THREE.BoxGeometry(.06,.14,.08),Sv),0,-.1,-.08);gp(new THREE.Mesh(new THREE.OctahedronGeometry(.03),Gm),0,.06,.06);
 return G}
const FIG={ali:buildAlice,mak:buildMakao};
/* ===== GX — موتور گرافیک مهره‌ها (ابزار مشترک برای همهٔ کاراکترها) =====
 کاراکتر جدید: تابعی مثل gxAlice بنویس (M,team)=>Group و با GX.reg('کلید',تابع) ثبتش کن.
 ابزارها: GX.pal(M) مواد PBR | GX.lathe بدنه/دامن چین‌دار | GX.limb/GX.strand لولهٔ باریک‌شونده (دست، پا، مو)
 GX.head سر+صورت نقاشی‌شده | GX.anim(G,fn) انیمیشن بیکار | نور، محیط و سایه در GX.post برای همه مشترک است */
const GX={A:[]};
GX.c=h=>new THREE.Color(h).convertSRGBToLinear();
GX.tex=(w,h,fn,s,rep)=>{const k=(window.__HQ&&w===256&&h===256)?4:1,c=document.createElement('canvas');c.width=w*k;c.height=h*k;const cx=c.getContext('2d');if(k>1)cx.scale(k,k);fn(cx,w,h);const t=new THREE.CanvasTexture(c);t.anisotropy=window.__HQ?8:4;if(s)t.colorSpace=THREE.SRGBColorSpace;if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep[0],rep[1])}return t};
GX.weave=()=>GX._w||(GX._w=GX.tex(64,64,x=>{for(let i=0;i<16;i++)for(let j=0;j<16;j++){x.fillStyle=(i+j)&1?'#b4b4b4':'#6a6a6a';x.fillRect(i*4,j*4,4,4)}},0,[10,6]));
GX.wood=()=>GX._wd||(GX._wd=GX.tex(128,32,(x,w,h)=>{x.fillStyle='#2a2a2f';x.fillRect(0,0,w,h);for(let i=0;i<40;i++){x.strokeStyle=(i%2?'rgba(40,20,8,':'rgba(160,100,52,')+(.15+Math.random()*.2)+')';x.lineWidth=1+Math.random()*2;x.beginPath();x.moveTo(0,Math.random()*h);x.bezierCurveTo(w*.3,Math.random()*h,w*.6,Math.random()*h,w,Math.random()*h);x.stroke()}},1));
GX.pal=M=>{const C=GX.c,D=THREE.DoubleSide;return{
 cloth:(c,o)=>M(C(c),Object.assign({roughness:.88,bumpMap:GX.weave(),bumpScale:1.5,side:D,clearcoat:0,sheen:1,sheenRoughness:.55,sheenColor:new THREE.Color(0x9a9a9a)},o)),
 skin:c=>M(C(c),{roughness:.6}),
 metal:(c,o)=>M(C(c),Object.assign({metalness:.95,roughness:.22,side:D},o)),
 leather:c=>M(C(c),{roughness:.42,clearcoat:.7,clearcoatRoughness:.28}),
 hair:c=>M(C(c),{roughness:.38,clearcoat:.9,clearcoatRoughness:.2,metalness:.1}),
 gem:c=>M(C(c),{roughness:.06,metalness:.35,clearcoat:1,clearcoatRoughness:.05}),
 wood:()=>M(0xffffff,{map:GX.wood(),roughness:.45,clearcoat:.5,clearcoatRoughness:.3})}};
/* پروفایل [شعاع،ارتفاع] از پایین به بالا؛ n=تعداد چین، a=عمق چین */
GX.lathe=(p,seg,n,a)=>{const g=new THREE.LatheGeometry(p.map(q=>new THREE.Vector2(q[0],q[1])),seg||40),P=g.attributes.position;
 if(n)for(let i=0;i<P.count;i++){const x=P.getX(i),z=P.getZ(i),f=1+a*Math.sin(n*Math.atan2(z,x));P.setX(i,x*f);P.setZ(i,z*f)}
 g.computeVertexNormals();return g};
GX.tube=(pts,rf,seg,rs)=>{seg=seg||14;rs=rs||8;if(window.__HQ){seg=Math.min(48,Math.round(seg*1.7));rs=Math.min(16,rs*2)}const cv=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(p[0],p[1],p[2]))),g=new THREE.TubeGeometry(cv,seg,1,rs,false),P=g.attributes.position;
 for(let i=0;i<=seg;i++){const c=cv.getPointAt(i/seg),r=rf(i/seg);for(let j=0;j<=rs;j++){const k=i*(rs+1)+j;P.setXYZ(k,c.x+(P.getX(k)-c.x)*r,c.y+(P.getY(k)-c.y)*r,c.z+(P.getZ(k)-c.z)*r)}}
 g.computeVertexNormals();return g};
GX.strand=(P,m,pts,r0,r1,seg)=>{const e=new THREE.Mesh(GX.tube(pts,u=>r0+(r1-r0)*u,seg||14,7),m);P.add(e);return e};
GX.face=o=>GX.tex(256,256,(x,w,h)=>{const S='#'+new THREE.Color(o.skin).getHexString(),g=x.createRadialGradient(w/2,h*.55,8,w/2,h*.5,w*.6);
 g.addColorStop(0,o.hi);g.addColorStop(.75,S);g.addColorStop(1,S);x.fillStyle=g;x.fillRect(0,0,w,h);x.lineCap='round';
 [.2,.8].forEach(a=>{const r=x.createRadialGradient(a*w,h*.7,2,a*w,h*.7,28);r.addColorStop(0,'rgba(255,105,105,.38)');r.addColorStop(1,'rgba(255,105,105,0)');x.fillStyle=r;x.fillRect(a*w-30,h*.7-30,60,60)});
 [-1,1].forEach(s=>{x.save();x.translate(w/2+s*o.ex,h*.52);x.scale(s,1);
  x.fillStyle='#f6f1f0';x.beginPath();x.ellipse(0,0,29,25,0,0,7);x.fill();
  x.save();x.beginPath();x.ellipse(0,0,29,25,0,0,7);x.clip();
  const ir=x.createRadialGradient(0,3,2,0,3,23);ir.addColorStop(0,o.i1);ir.addColorStop(.6,o.i2);ir.addColorStop(1,o.i3);x.fillStyle=ir;x.beginPath();x.ellipse(0,3,20,23,0,0,7);x.fill();
  x.fillStyle='#10060a';x.beginPath();x.ellipse(0,3,8,11,0,0,7);x.fill();x.fillStyle='rgba(0,0,0,.25)';x.fillRect(-30,-26,60,12);
  x.fillStyle='#fff';x.beginPath();x.arc(-8,-8,6.5,0,7);x.fill();x.beginPath();x.arc(8,12,3,0,7);x.fill();x.restore();
  x.strokeStyle=o.lash;x.lineWidth=7;x.beginPath();x.ellipse(0,0,30,26,0,Math.PI*1.03,Math.PI*1.97);x.stroke();
  x.lineWidth=5;x.beginPath();x.moveTo(27,-9);x.lineTo(42,-18);x.stroke();
  x.strokeStyle=o.brow;x.lineWidth=8;x.beginPath();x.moveTo(-26,-44-o.sl);x.quadraticCurveTo(0,-54,30,-44+o.sl*1.2);x.stroke();x.restore()});
 x.strokeStyle='rgba(120,60,50,.35)';x.lineWidth=4;x.beginPath();x.moveTo(w/2-2,h*.66);x.lineTo(w/2+3,h*.68);x.stroke();
 x.strokeStyle=o.lip;x.lineWidth=6;x.beginPath();x.moveTo(w/2-20,h*.82);x.quadraticCurveTo(w/2,h*.82+o.sm,w/2+20,h*.82);x.stroke()},1);
GX.head=(G,M,o)=>{const p=new THREE.Vector3(0,o.y,0),h=new THREE.Mesh(new THREE.SphereGeometry(o.r,32,24),M(GX.c(o.skin),{roughness:.6}));h.position.copy(p);G.add(h);
 const f=new THREE.Mesh(new THREE.SphereGeometry(o.r*(o.nat?1.008:1.004),28,20,Math.PI/2-.5,1,1.07,1),M(0xffffff,{map:(o.nat?GX.faceN:GX.face)(o),roughness:o.nat?.6:.65,polygonOffset:!!o.nat,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));f.position.copy(p);G.add(f);
 [-1,1].forEach(s=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.05,10,8).scale(.5,1,.8),h.material);e.position.set(s*o.r*.97,o.y-.02,0);G.add(e)})};
GX.anim=(G,fn)=>GX.A.push({G,fn,ph:Math.random()*6.28});
GX.up=o=>{while(o){if(o===scene)return true;o=o.parent}return false};
GX.tick=t=>{for(let i=GX.A.length-1;i>=0;i--){const a=GX.A[i];if(!GX.up(a.G)){if(a.G.userData.seen)GX.A.splice(i,1);continue}a.G.userData.seen=1;a.fn(t+a.ph)}};
GX.reg=(k,fn,old)=>{FIG[k]=(M,t)=>{try{return fn(M,t)}catch(e){console.error('GX',k,e);return old?old(M,t):new THREE.Group()}}};
const _gxPC=placeCamera;placeCamera=function(){_gxPC();GX.tick(clock.elapsedTime)};
const _gxIS=initScene;initScene=function(){_gxIS();try{GX.post()}catch(e){console.error('GX.post',e)}};
GX.post=()=>{const sun=scene.children.find(o=>o.isDirectionalLight),hl=scene.children.find(o=>o.isHemisphereLight);
 if(sun){sun.shadow.mapSize.set(1024,1024);sun.shadow.bias=-.0003;sun.shadow.normalBias=.025;sun.intensity=.7}if(hl)hl.intensity=.5;
 const rim=new THREE.DirectionalLight(0xfff1e0,.25),fill=new THREE.DirectionalLight(0xffc99a,.12);rim.position.set(CTR.x+6,9,CTR.z-12);fill.position.set(CTR.x-9,4,CTR.z+10);
 scene.add(rim,fill,rim.target,fill.target);rim.target.position.copy(CTR);fill.target.position.copy(CTR);
 const es=new THREE.Scene(),sg=new THREE.SphereGeometry(20,24,12),P=sg.attributes.position,cs=[];
 for(let i=0;i<P.count;i++){const y=P.getY(i)/20,c=y>0?new THREE.Color(0x6a5a4a).lerp(new THREE.Color(0xb59b7e),y):new THREE.Color(0x1a1612);cs.push(c.r,c.g,c.b)}
 sg.setAttribute('color',new THREE.Float32BufferAttribute(cs,3));es.add(new THREE.Mesh(sg,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide})));
 const pn=(c,w,h,x,y,z)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide}));m.position.set(x,y,z);m.lookAt(0,0,0);es.add(m)};
 pn(new THREE.Color(4,3.6,3.2),10,8,-8,12,12);pn(new THREE.Color(1.2,2,3.6),4,12,12,6,-10);pn(new THREE.Color(1.5,1.2,1),8,3,0,2,14);
 scene.traverse(o=>{if(o.isMesh&&o.material&&o.material.isMeshStandardMaterial)o.material.envMapIntensity=.25});
 const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(es,.02).texture;pm.dispose()};

/* ---------- آلیس ---------- */
function gxAlice(M,team){
 const G=new THREE.Group(),P=GX.pal(M),B=(g,m,x,y,z,Q)=>{const e=new THREE.Mesh(g,m);e.position.set(x||0,y||0,z||0);(Q||G).add(e);return e},
  W=P.cloth(0xf4efe7),K=P.cloth(0x18181e),Kl=P.leather(0x17171b),Au=P.metal(0xe0b445,{roughness:.3}),Hr=P.hair(0xc41230),Sk=P.skin(0xf2bd9f),Mt=P.metal(0x2a2c30,{roughness:.35}),Wd=P.wood(),
  Tm=M(team.getHex?team.getHex():0xff3a2a,{roughness:.4,clearcoat:.5}),Y=.18,S=(r,a,b,c)=>new THREE.SphereGeometry(r,20,14).scale(a,b,c),Ld=GX.lathe;
 // پا و چکمه
 [-1,1].forEach(s=>{GX.strand(G,Sk,[[s*.17,Y+1.02,0],[s*.175,Y+.8,0],[s*.18,Y+.62,0]],.125,.105,8);
  B(Ld([[0,0],[.14,0],[.15,.04],[.115,.22],[.12,.55],[.145,.62],[.145,.67],[.11,.67],[0,.67]],28),Kl,s*.18,Y,0);
  B(S(.13,1,.6,1.5),Kl,s*.18,Y+.07,.08);B(new THREE.TorusGeometry(.125,.015,8,24),Au,s*.18,Y+.48,0).rotation.x=Math.PI/2;B(new THREE.BoxGeometry(.12,.02,.04),Au,s*.18,Y+.48,.13)});
 // دامن چین‌دار با لبهٔ طلایی و زیردامنی
 B(Ld([[.5,.84],[.45,.9],[.34,1.0],[.28,1.14],[.27,1.2]],48,16,.045),K,0,Y);
 B(Ld([[.506,.84],[.514,.84],[.508,.9],[.5,.9]],48,16,.045),Au,0,Y);B(Ld([[.43,.78],[.46,.78],[.44,.9]],36,22,.03),W,0,Y);
 // بالاتنه
 B(Ld([[0,1.14],[.255,1.14],[.245,1.25],[.27,1.45],[.3,1.6],[.28,1.74],[.14,1.8],[.09,1.82],[0,1.82]],36),W,0,Y);
 [-1,1].forEach(s=>B(S(.15,1,1,1),W,s*.115,Y+1.56,.15));
 B(Ld([[.272,1.12],[.265,1.2],[.262,1.28],[.28,1.38]],36),K,0,Y);for(let i=0;i<4;i++)B(new THREE.SphereGeometry(.018,10,8),Au,0,Y+1.18+i*.055,.272);
 B(S(.05,1.3,.8,.7),Hr,-.05,Y+1.72,.27);B(S(.05,1.3,.8,.7),Hr,.05,Y+1.72,.27);B(S(.03,1,1,1),Hr,0,Y+1.72,.28);
 // دست‌ها، آستین سفید و دستکش
 const hand=[[-.3,Y+1.52,.4],[.26,Y+1.18,.42]];
 [-1,1].forEach((s,i)=>{const sh=[s*.34,Y+1.74,0],h=hand[i];GX.strand(G,W,[sh,[s*.45,Y+1.42,.11],h],.095,.06,12);B(S(.075,1,1,1),Kl,h[0],h[1],h[2]);
  B(S(.1,1,.4,1.1),Au,s*.34,Y+1.82,0);B(new THREE.SphereGeometry(.022,8,6),Au,s*.34,Y+1.84,.1)});
 B(new THREE.TorusGeometry(.098,.028,8,20),Tm,.385,Y+1.61,.04).rotation.set(Math.PI/2,0,.3);
 // تفنگ
 const R=new THREE.Group();R.position.set(0,Y+1.4,.45);R.rotation.z=-.55;G.add(R);
 const rb=(g,m,x,y,z)=>B(g,m,x,y,z,R),cy=(r,l,m,x,y,z)=>{const e=rb(new THREE.CylinderGeometry(r,r,l,14),m,x,y,z);e.rotation.z=Math.PI/2;return e};
 rb(new THREE.BoxGeometry(.5,.16,.09),Wd,-.42,0,0);rb(S(.12,1.5,1,.8),Wd,-.65,-.02,0);rb(new THREE.BoxGeometry(.6,.1,.09),Wd,.08,0,0);
 cy(.032,.95,Mt,.85,.01,0);cy(.04,.05,Mt,1.34,.01,0);cy(.055,.42,Mt,0,.13,0);cy(.065,.03,P.gem(0x2a6bd0),.22,.13,0);cy(.06,.03,P.gem(0x2a6bd0),-.22,.13,0);
 rb(new THREE.BoxGeometry(.04,.07,.04),Mt,-.1,.07,0);rb(new THREE.BoxGeometry(.04,.07,.04),Mt,.1,.07,0);cy(.012,.12,Mt,-.12,.06,.09).rotation.x=Math.PI/2;rb(new THREE.SphereGeometry(.025,8,6),Mt,-.12,.06,.15);
 rb(new THREE.BoxGeometry(.14,.1,.07),Mt,-.1,-.12,0);rb(new THREE.TorusGeometry(.05,.01,6,14,Math.PI),Mt,-.25,-.07,0).rotation.z=Math.PI;
 // شنل با موج
 const cg=new THREE.PlaneGeometry(.98,1.12,10,14);cg.translate(0,-.56,0);const cb=Float32Array.from(cg.attributes.position.array),CP=new THREE.Group();CP.position.set(0,Y+1.8,-.27);G.add(CP);
 const ce=new THREE.Mesh(cg,M(0xffffff,{map:aliceTex('cape'),roughness:.8,bumpMap:GX.weave(),bumpScale:1,side:THREE.FrontSide})),cl=new THREE.Mesh(cg,P.cloth(0x8c1020,{side:THREE.BackSide}));CP.add(ce,cl);
 [-1,1].forEach(s=>B(new THREE.SphereGeometry(.035,10,8),Au,s*.3,Y+1.78,-.25));
 const cape=t=>{const p=cg.attributes.position;for(let i=0;i<p.count;i++){const x=cb[i*3],y=cb[i*3+1],k=-y/1.12;p.setZ(i,.07*(x/.49)*(x/.49)*(1-k*.4)-.1*k*k+.035*Math.sin(y*7+t*2.2+x*3)*k)}p.needsUpdate=true;cg.computeVertexNormals()};cape(0);
 // سر، صورت، مو
 GX.head(G,M,{skin:0xf2bd9f,hi:'#f8cdb2',y:Y+2,r:.27,ex:58,i1:'#ff6a6a',i2:'#d3152b',i3:'#5a0814',lash:'#3a0610',brow:'#6b1020',sl:7,lip:'#a0504a',sm:3});
 B(S(.3,1,.82,1),Hr,0,Y+2.07,-.05);B(S(.16,1.5,.6,.6),Hr,0,Y+2.18,.2);
 const HP=new THREE.Group();HP.position.set(0,Y+1.95,-.1);G.add(HP);
 for(let i=0;i<11;i++){const a=(i-5)/5;GX.strand(HP,Hr,[[a*.2,.12,-.06],[a*.3,-.15,-.2],[a*.34,-.55,-.24],[a*.4,-.95-.12*Math.cos(i*2.1),-.2]],.1,.02,12)}
 [-1,1].forEach(s=>GX.strand(G,Hr,[[s*.25,Y+2.04,.05],[s*.31,Y+1.8,.1],[s*.3,Y+1.5,.1],[s*.34,Y+1.2,.04]],.075,.025,12));
 // کلاه کاپیتان
 B(Ld([[0,0],[.295,0],[.33,.05],[.34,.12],[.3,.17],[0,.175]],40),W,0,Y+2.25,-.03);B(Ld([[.296,0],[.312,0],[.312,.07],[.296,.07]],40),K,0,Y+2.25,-.03);
 B(new THREE.TorusGeometry(.32,.016,8,40),Tm,0,Y+2.34,-.03).rotation.x=Math.PI/2;
 B(new THREE.CylinderGeometry(.24,.24,.025,24,1,false,-Math.PI*.45,Math.PI*.9),Kl,0,Y+2.26,.1).rotation.x=.18;
 B(new THREE.CylinderGeometry(.06,.06,.016,20),Au,0,Y+2.33,.33).rotation.x=Math.PI/2;B(new THREE.SphereGeometry(.03,12,10),Tm,0,Y+2.33,.34);
 GX.anim(G,t=>{G.position.y=.01*Math.sin(t*2);HP.rotation.x=.04*Math.sin(t*1.6);HP.rotation.z=.05*Math.sin(t*1.1+1);CP.rotation.x=.03*Math.sin(t*1.4);cape(t)});
 return G}

/* ---------- ملکهٔ ماکائو ---------- */
function gxMakao(M,team){
 const G=new THREE.Group(),P=GX.pal(M),B=(g,m,x,y,z,Q)=>{const e=new THREE.Mesh(g,m);e.position.set(x||0,y||0,z||0);(Q||G).add(e);return e},
  K=P.cloth(0x15111a),Gr=P.cloth(0x1d3b32),Kl=P.leather(0x100c14),Sv=P.metal(0xc8ccd4),Hr=P.hair(0x0d0b10),Ro=P.cloth(0x9a1428,{roughness:.55}),Gm=P.gem(0x2fbf8f),
  Tm=M(team.getHex?team.getHex():0xff3a2a,{roughness:.4,clearcoat:.5}),Y=.18,S=(r,a,b,c)=>new THREE.SphereGeometry(r,20,14).scale(a,b,c),Ld=GX.lathe;
 // دامن طبقه‌طبقه با چین و حاشیهٔ نقره‌ای
 const tiers=[];[[.8,.66],[.72,.6],[.62,.5],[.52,.42],[.42,.32]].forEach((t,i)=>{const y0=i*.2+.02;
  tiers.push(B(Ld([[t[0],y0],[(t[0]+t[1])/2+.03,y0+.13],[t[1],y0+.27]],48,18,.05),i%2?Gr:K,0,Y));B(Ld([[t[0]+.006,y0],[t[0]+.012,y0+.035]],48,18,.05),Sv,0,Y)});
 B(new THREE.TorusGeometry(.83,.03,8,48),Tm,0,Y+.03,0).rotation.x=Math.PI/2;
 const rose=(x,y,z,s)=>{const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(s);G.add(g);B(S(.06,1,.8,1),Ro,0,0,0,g);for(let k=0;k<3;k++){const e=B(new THREE.TorusGeometry(.06+k*.025,.018,6,16),Ro,0,-.01*k,0,g);e.rotation.set(Math.PI/2+.25*(k-1),0,k)}return g};
 for(let i=0;i<10;i++){const a=i/10*Math.PI*2,r=.62+.06*(i%2),y=Y+.28+(i%3)*.22;B(new THREE.ConeGeometry(.035,.16,6),Sv,Math.sin(a)*r,y,Math.cos(a)*r).rotation.x=Math.PI;B(new THREE.OctahedronGeometry(.05),Gm,Math.sin(a)*(r-.02),y+.14,Math.cos(a)*(r-.02))}
 // بالاتنه
 B(Ld([[.19,1.12],[.2,1.2],[.255,1.4],[.27,1.55],[.25,1.64],[.12,1.7],[.09,1.72]],36),K,0,Y);
 [-1,1].forEach(s=>B(S(.14,1,1,1),K,s*.11,Y+1.5,.14));B(new THREE.BoxGeometry(.03,.4,.02),Sv,0,Y+1.34,.26);
 B(new THREE.OctahedronGeometry(.045),Gm,0,Y+1.5,.27);B(new THREE.OctahedronGeometry(.04),Gm,0,Y+1.25,.24);rose(0,Y+1.12,.3,1.1);rose(.3,Y+1.1,.2,.7);
 B(new THREE.CylinderGeometry(.07,.08,.14,12),P.skin(0xf4dccd),0,Y+1.68,0);B(new THREE.CylinderGeometry(.095,.095,.07,16),Kl,0,Y+1.7,0);B(new THREE.OctahedronGeometry(.035),Gm,0,Y+1.69,.095);
 // سر و صورت
 GX.head(G,M,{skin:0xf4dccd,hi:'#fbe8dc',y:Y+1.95,r:.26,ex:58,i1:'#7ff0c0',i2:'#2f7a64',i3:'#0b2a20',lash:'#1a1216',brow:'#1a1216',sl:-2,lip:'#b0524e',sm:6});
 // مو: صاف، بلند، با برق
 B(S(.29,1,.85,1),Hr,0,Y+2,-.05);
 B(new THREE.CylinderGeometry(.285,.285,.13,24,1,true,-.8,1.6),Hr,0,Y+2.08,-.03).material.side=THREE.DoubleSide;
 const HP=new THREE.Group();HP.position.set(0,Y+1.9,-.1);G.add(HP);
 for(let i=0;i<13;i++){const a=(i-6)/6;GX.strand(HP,Hr,[[a*.2,.12,-.06],[a*.32,-.3,-.22],[a*.36,-.9,-.26],[a*.38,-1.4-.04*Math.cos(i*3),-.22]],.1,.035,14)}
 [-1,1].forEach(s=>GX.strand(G,Hr,[[s*.25,Y+1.98,.04],[s*.3,Y+1.7,.08],[s*.34,Y+1.3,.04],[s*.35,Y+.98,0]],.07,.035,12));
 rose(-.2,Y+2.17,.1,.9);[-.26,-.2].forEach((x,i)=>B(new THREE.ConeGeometry(.025,.14,6),Gm,x-.03,Y+1.95-i*.03,.2).rotation.x=Math.PI);
 // شانه، آستین زنگی، دستکش بلند
 [-1,1].forEach(s=>{B(S(.15,1.1,.6,1.1),Gr,s*.38,Y+1.58,0);B(S(.11,1,.8,1),P.skin(0xf4dccd),s*.3,Y+1.62,0);
  const sl=B(Ld([[.21,0],[.17,.18],[.11,.34],[.1,.42]],28),Gr,s*.46,Y+1.12,.02);sl.rotation.z=-s*.08;B(Ld([[.212,0],[.207,.04],[.2,.05]],28),K,s*.46,Y+1.12,.02).rotation.z=-s*.08;
  GX.strand(G,Kl,[[s*.47,Y+1.22,.04],[s*.49,Y+1.05,.08],[s*.5,Y+.9,.12]],.06,.05,8);B(S(.075,1,1,1),Kl,s*.5,Y+.88,.12)});
 // هفت‌تیر نقره‌ای
 const gun=new THREE.Group();gun.position.set(-.5,Y+.9,.2);gun.rotation.x=.9;G.add(gun);
 [-.025,.025].forEach(x=>{const b=B(new THREE.CylinderGeometry(.022,.022,.5,10),Sv,x,0,.34,gun);b.rotation.x=Math.PI/2;B(new THREE.TorusGeometry(.024,.008,6,12),Sv,x,0,.58,gun)});
 B(new THREE.CylinderGeometry(.075,.075,.14,14),Sv,0,0,.02,gun).rotation.x=Math.PI/2;B(new THREE.BoxGeometry(.06,.14,.08),P.wood(),0,-.1,-.08,gun);B(new THREE.OctahedronGeometry(.03),Gm,0,.06,.06,gun);
 B(new THREE.TorusGeometry(.045,.01,6,14,Math.PI),Sv,0,-.05,.1,gun).rotation.set(0,Math.PI/2,Math.PI);
 GX.anim(G,t=>{G.position.y=.01*Math.sin(t*2);HP.rotation.x=.035*Math.sin(t*1.5);HP.rotation.z=.05*Math.sin(t*1.05+1);tiers.forEach((m,i)=>m.rotation.y=.025*Math.sin(t*1.2+i*.8))});
 return G}
/* ---------- نسخهٔ ۲: جزئیات لباس و فرم بدن (روی همان مدل پایه اضافه می‌شود) ---------- */
GX.kit=(G,M)=>{const P=GX.pal(M),Y=.18,V=a=>new THREE.Vector3(a[0],a[1],a[2]),
 B=(g,m,x,y,z)=>{const e=new THREE.Mesh(g,m);e.position.set(x||0,y||0,z||0);G.add(e);return e},
 cuff=(a,b,t,r,m)=>{const d=V(b).sub(V(a)).normalize(),e=new THREE.Mesh(new THREE.CylinderGeometry(r,r*.9,.07,20,1,true),m);e.position.copy(V(a).lerp(V(b),t));e.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d);G.add(e)};
 return{P,Y,B,cuff,Ld:GX.lathe,S:(r,a,b,c)=>new THREE.SphereGeometry(r,16,12).scale(a,b,c)}};
function gxAlice2(M,team){const G=gxAlice(M,team),{P,Y,B,cuff,Ld,S}=GX.kit(G,M),Au=P.metal(0xe0b445,{roughness:.3}),W=P.cloth(0xf4efe7),K=P.cloth(0x18181e),Kl=P.leather(0x17171b),Cy=(r,l)=>new THREE.CylinderGeometry(r,r,l,8);
 // ریشهٔ سردوشی و بند طلایی
 [-1,1].forEach(s=>{for(let k=0;k<9;k++)B(Cy(.009,.1),Au,s*.43,Y+1.74,(k-4)*.03);B(new THREE.TorusGeometry(.1,.012,6,24,Math.PI),Au,s*.34,Y+1.8,0).rotation.set(0,Math.PI/2,0)});
 GX.strand(G,Au,[[-.34,Y+1.84,.06],[-.3,Y+1.66,.27],[-.15,Y+1.5,.292],[-.07,Y+1.36,.285]],.014,.014,12);B(new THREE.ConeGeometry(.035,.12,10),Au,-.07,Y+1.28,.285).rotation.x=Math.PI;
 // سرآستین
 [[[-.45,Y+1.42,.11],[-.3,Y+1.52,.4]],[[.45,Y+1.42,.11],[.26,Y+1.18,.42]]].forEach(c=>{cuff(c[0],c[1],.78,.082,K);cuff(c[0],c[1],.7,.088,Au)});
 // کمربند، سگک و کیسه
 B(Ld([[.28,1.1],[.288,1.1],[.288,1.18],[.28,1.18]],40),Kl,0,Y);B(new THREE.BoxGeometry(.1,.08,.03),Au,0,Y+1.14,.29);B(new THREE.BoxGeometry(.05,.04,.035),K,0,Y+1.14,.29);
 B(S(.08,1,1.1,.8),Kl,-.36,Y+1.02,.12);B(S(.085,1,.5,.9),Kl,-.36,Y+1.1,.12);B(new THREE.SphereGeometry(.015,8,6),Au,-.36,Y+1.08,.2);
 // فرین زیردامنی و لایهٔ رویی دامن
 B(Ld([[.47,.77],[.55,.8],[.5,.87]],64,28,.07),W,0,Y);B(Ld([[.285,1.18],[.295,1.15],[.375,1.0],[.45,.9]],48,12,.06),K,0,Y);
 // ربان روی چکمه
 [-1,1].forEach(s=>{B(S(.04,1.4,.8,.6),Au,s*.18,Y+.6,.145);B(S(.03,1,1,1),Au,s*.18,Y+.6,.15)});
 return G}
function gxMakao2(M,team){const G=gxMakao(M,team),{P,Y,B,cuff,Ld,S}=GX.kit(G,M),Sv=P.metal(0xc8ccd4),Ro=P.cloth(0x9a1428,{roughness:.55}),La=P.cloth(0xece3d4,{roughness:.9}),Pe=M(GX.c(0xf4eee8),{roughness:.2,metalness:.3,clearcoat:1});
 // یقهٔ توری و فرین دامن
 B(Ld([[.2,1.69],[.3,1.7],[.37,1.63],[.33,1.59]],56,30,.09),La,0,Y);
 [[.8,.02],[.72,.22],[.62,.42],[.52,.62],[.42,.82]].forEach(t=>B(Ld([[t[0]+.01,t[1]],[t[0]+.08,t[1]+.03],[t[0]+.03,t[1]+.1]],64,34,.1),La,0,Y));
 // بندهای کرست
 for(let i=0;i<6;i++){const y=Y+1.2+i*.05;GX.strand(G,Sv,[[-.07,y,.25],[0,y+.025,.262],[.07,y+.05,.25]],.007,.007,4);GX.strand(G,Sv,[[.07,y,.25],[0,y+.025,.262],[-.07,y+.05,.25]],.007,.007,4)}
 // گردنبند مروارید
 for(let i=0;i<15;i++){const a=(i-7)/7*1.25;B(new THREE.SphereGeometry(.017,10,8),Pe,Math.sin(a)*.2,Y+1.63-.05*Math.cos(a),Math.cos(a)*.2)}B(new THREE.OctahedronGeometry(.035),P.gem(0x2fbf8f),0,Y+1.55,.215);
 // کمربند و پاپیون پشت
 B(Ld([[.205,1.1],[.218,1.1],[.222,1.18],[.208,1.18]],40),Ro,0,Y);
 [-1,1].forEach(s=>{B(S(.12,1.5,.6,.45),Ro,s*.13,Y+1.16,-.25).rotation.z=s*.35;GX.strand(G,Ro,[[s*.03,Y+1.14,-.26],[s*.12,Y+.8,-.36],[s*.17,Y+.4,-.4]],.045,.015,10)});B(new THREE.SphereGeometry(.05,12,10),Ro,0,Y+1.16,-.26);
 // سرآستین توری و دستبند
 [-1,1].forEach(s=>{B(Ld([[.21,0],[.26,.025],[.2,.09]],40,26,.1),La,s*.46,Y+1.12,.02).rotation.z=-s*.08;cuff([s*.47,Y+1.22,.04],[s*.5,Y+.9,.12],.78,.075,Sv)});
 return G}
GX.reg('ali',gxAlice2,gxAlice);GX.reg('mak',gxMakao2,gxMakao);
/* ---------- ملکهٔ ماکائو · نسخهٔ ۳ (مطابق تصویر مرجع: گوتیک مشکی-سبز، رز سرخ، هفت‌تیر نقره‌ای) ---------- */
GX.damask=(bg,fg,fg2)=>{const key=bg+fg;GX._dm=GX._dm||{};return GX._dm[key]||(GX._dm[key]=GX.tex(128,128,(x,w,h)=>{x.fillStyle=bg;x.fillRect(0,0,w,h);x.fillStyle=fg;x.strokeStyle=fg;x.lineWidth=1.6;x.lineCap='round';
 for(let i=0;i<2;i++)for(let j=0;j<2;j++){const cx=i*64+32,cy=j*64+32;
  x.beginPath();x.moveTo(cx,cy-24);x.quadraticCurveTo(cx+15,cy-6,cx,cy+24);x.quadraticCurveTo(cx-15,cy-6,cx,cy-24);x.fill();
  x.beginPath();x.moveTo(cx-24,cy+2);x.quadraticCurveTo(cx-8,cy-12,cx+24,cy+2);x.stroke();
  x.beginPath();x.arc(cx+32,cy+32,3.5,0,7);x.fill()}
 x.strokeStyle=fg2;x.lineWidth=1;x.beginPath();x.moveTo(0,.5);x.lineTo(w,.5);x.moveTo(.5,0);x.lineTo(.5,h);x.stroke()},1,[6,2]))};
/* چهرهٔ طبیعی‌تر: چشم بادامی نیمه‌باز، ابروی نازک، لب کوچک (o.closed = پلک بسته برای پلک‌زدن) */
GX.faceN=o=>GX.tex(256,256,(x,w,h)=>{
 const S='#'+new THREE.Color(o.skin).getHexString(),g=x.createRadialGradient(w/2,h*.55,8,w/2,h*.5,w*.6);
 g.addColorStop(0,o.hi);g.addColorStop(.75,S);g.addColorStop(1,S);x.fillStyle=g;x.fillRect(0,0,w,h);x.lineCap='round';x.lineJoin='round';
 [.22,.78].forEach(a=>{const r=x.createRadialGradient(a*w,h*.72,2,a*w,h*.72,30);r.addColorStop(0,'rgba(225,135,135,.2)');r.addColorStop(1,'rgba(225,135,135,0)');x.fillStyle=r;x.fillRect(a*w-32,h*.72-32,64,64)});
 [-1,1].forEach(s=>{x.save();x.translate(w/2+s*o.ex,h*.54);x.scale(s,1);
  const eye=()=>{x.beginPath();x.moveTo(-24,2);x.bezierCurveTo(-14,-14,14,-16,26,0);x.bezierCurveTo(14,9,-12,12,-24,2);x.closePath()};
  if(!o.closed){eye();x.fillStyle='#ece7e6';x.fill();x.save();eye();x.clip();
   const ir=x.createRadialGradient(1,1,1,1,1,13);ir.addColorStop(0,o.i1);ir.addColorStop(.55,o.i2);ir.addColorStop(1,o.i3);x.fillStyle=ir;x.beginPath();x.ellipse(1,1,12,13,0,0,7);x.fill();
   x.fillStyle='#090e0d';x.beginPath();x.ellipse(1,1,5.5,6.5,0,0,7);x.fill();
   x.fillStyle='rgba(255,255,255,.85)';x.beginPath();x.arc(-4,-4,2.6,0,7);x.fill();x.beginPath();x.arc(5,5,1.3,0,7);x.fill();
   const sh=x.createLinearGradient(0,-14,0,4);sh.addColorStop(0,'rgba(20,12,16,.55)');sh.addColorStop(1,'rgba(20,12,16,0)');x.fillStyle=sh;x.fillRect(-30,-16,60,22);x.restore();
   x.strokeStyle=o.lash;x.lineWidth=4.5;x.beginPath();x.moveTo(-25,3);x.bezierCurveTo(-14,-15,14,-17,28,-2);x.stroke();
   x.lineWidth=2.5;x.beginPath();x.moveTo(27,-1);x.lineTo(36,-6);x.stroke();
   x.strokeStyle='rgba(60,30,35,.5)';x.lineWidth=1.6;x.beginPath();x.moveTo(-18,8);x.bezierCurveTo(-8,12,8,12,20,5);x.stroke();
   x.strokeStyle='rgba(120,70,70,.35)';x.lineWidth=1.8;x.beginPath();x.moveTo(-16,-14);x.bezierCurveTo(-4,-22,12,-22,22,-12);x.stroke()}
  else{x.strokeStyle=o.lash;x.lineWidth=4.5;x.beginPath();x.moveTo(-25,2);x.quadraticCurveTo(2,12,28,-1);x.stroke();x.lineWidth=2.5;x.beginPath();x.moveTo(27,-1);x.lineTo(35,-5);x.stroke()}
  x.strokeStyle=o.brow;x.lineWidth=3.2;x.beginPath();x.moveTo(-24,-30-o.sl);x.quadraticCurveTo(2,-36,30,-30+o.sl);x.stroke();x.restore()});
 x.strokeStyle='rgba(150,95,90,.3)';x.lineWidth=2.5;x.beginPath();x.moveTo(w/2-2,h*.66);x.lineTo(w/2+2,h*.68);x.stroke();
 x.strokeStyle=o.lip;x.lineWidth=4;x.beginPath();x.moveTo(w/2-13,h*.8);x.quadraticCurveTo(w/2,h*.8+o.sm,w/2+13,h*.8);x.stroke();
 x.fillStyle='rgba(190,100,100,.22)';x.beginPath();x.ellipse(w/2,h*.808,9,3,0,0,7);x.fill()},1);
function gxMakao3(M,team){
 const V=THREE.Vector3,G=new THREE.Group(),P=GX.pal(M),Y=.18,TAU=Math.PI*2,
  B=(g,m,x,y,z,Q)=>{const e=new THREE.Mesh(g,m);e.position.set(x||0,y||0,z||0);(Q||G).add(e);return e},
  S=(r,a,b,c)=>new THREE.SphereGeometry(r,18,12).scale(a,b,c),
  Cy=(r1,r2,l,s)=>new THREE.CylinderGeometry(r1,r2,l,s||12),
  Oc=(r,a,b,c)=>new THREE.OctahedronGeometry(r).scale(a,b,c),Ld=GX.lathe,
  K=P.cloth(0xffffff,{map:GX.damask('#14101a','#2c2335','#1b1521')}),
  Gr=P.cloth(0xffffff,{map:GX.damask('#1f4d3e','#306f5a','#173a2f')}),
  K0=P.cloth(0x15101a),G0=P.cloth(0x1d4a3b),Kl=P.leather(0x0c090f),Sv=P.metal(0xd2d6dd,{roughness:.2}),
  Gm=P.gem(0x35e0a8),Hr=P.hair(0x0b090e),Sk=P.skin(0xf6e5dc),Ro=P.cloth(0x7e1022,{roughness:.5}),Ro2=P.cloth(0x4f0a16,{roughness:.55}),
  Tm=M(0xd2d6dd,{metalness:.9,roughness:.25}),HrD=P.hair(0x0b090e),Th=P.metal(0x8f949e,{roughness:.55,metalness:.7});HrD.side=THREE.DoubleSide;
 /* ---- منگوله: p شروع، d جهت آویز (یکه)، len طول ---- */
 const tassel=(p,d,len,m,Q)=>{const q=new THREE.Quaternion().setFromUnitVectors(new V(0,1,0),d.clone().negate());
  B(new THREE.ConeGeometry(.034,len,10),m,p.x+d.x*len/2,p.y+d.y*len/2,p.z+d.z*len/2,Q).quaternion.copy(q);
  B(S(.016,1,1,1),Sv,p.x,p.y,p.z,Q);
  B(new THREE.TorusGeometry(.017,.005,6,12),Sv,p.x+d.x*.03,p.y+d.y*.03,p.z+d.z*.03,Q).quaternion.copy(q).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI/2,0,0)))};
 /* ---- رز سرخ ---- */
 const rose=(x,y,z,s,rot,Q)=>{const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(s);if(rot)g.rotation.set(rot[0],rot[1],rot[2]);(Q||G).add(g);
  for(let i=0;i<20;i++){const a=i*2.399,q=i/19,r=.008+.066*Math.sqrt(q),p=B(S(.034+.024*q,1.25,.4,.85),i%4?Ro:Ro2,Math.sin(a)*r,.04*(1-q),Math.cos(a)*r,g);p.rotation.order='YXZ';p.rotation.set(.1+1.05*q,a,0)}
  B(S(.03,1,1.1,1),Ro2,0,.045,0,g);return g};
 /* ---- دامن طبقه‌طبقه و نامتقارن ---- */
 const T=[[.82,.64,0,.44,24,.05,.05,3,.5],[.78,.56,.12,.58,20,.045,.09,2,1.2],[.68,.45,.34,.76,18,.045,.07,3,2.4],[.58,.37,.56,.95,16,.04,.07,2,.3],[.48,.3,.76,1.08,14,.04,.05,3,1.7],[.38,.2,.9,1.16,12,.035,.04,2,.9]]
  .map(a=>({r0:a[0],r1:a[1],y0:a[2],y1:a[3],n:a[4],a:a[5],hem:a[6],k:a[7],ph:a[8]}));
 const nh=t=>Math.round(t.n*1.9)+1,fo=(t,ph,u)=>1+t.a*(Math.sin(t.n*ph+t.ph)+.45*Math.sin(nh(t)*ph+t.ph*1.7))*(1-.8*u),
  hd=(t,ph,u)=>{const uc=Math.max(0,Math.min(1,u));return t.hem*(1-uc)*(.5+.5*Math.sin(t.k*ph+t.ph*2))-.07*(1-uc)*(.5+.5*Math.cos(ph-1))};
  const prof=t=>{const hh=t.y1-t.y0;return[[t.r0,t.y0],[t.r0*.85+t.r1*.15+.02,t.y0+hh*.18],[(t.r0+t.r1)/2,t.y0+hh*.55],[t.r1,t.y1]]},
  lg=(pts,t,seg)=>{const g=new THREE.LatheGeometry(pts.map(q=>new THREE.Vector2(q[0],q[1])),seg||72),Pp=g.attributes.position,hh=t.y1-t.y0;
   for(let i=0;i<Pp.count;i++){const x=Pp.getX(i),z=Pp.getZ(i),y=Pp.getY(i),ph=Math.atan2(x,z),u=Math.max(0,Math.min(1,(y-t.y0)/hh)),f=fo(t,ph,u);
    Pp.setX(i,x*f);Pp.setZ(i,z*f);Pp.setY(i,y-hd(t,ph,u))}
   g.computeVertexNormals();return g},
  surf=(t,ph,u,off)=>{const hh=t.y1-t.y0,uc=Math.max(0,Math.min(1,u)),f=fo(t,ph,uc),r=(t.r0+(t.r1-t.r0)*u)*f+off,y=t.y0+hh*u-hd(t,ph,uc);return new V(Math.sin(ph)*r,y,Math.cos(ph)*r)};
 const tiers=[],SL=[],LOCK=[];
 T.forEach((t,i)=>{const hh=t.y1-t.y0,m=B(lg(prof(t),t),i%2?K:Gr,0,Y);tiers.push(m);
  B(lg([[t.r0+.003,t.y0],[t.r0-(t.r0-t.r1)*.035/hh+.012,t.y0+.035]],t),Th,0,0,0,m);
  const pts=[];for(let j=0;j<=40;j++){const ph=-Math.PI+j/40*TAU,p=surf(t,ph,.13+.012*Math.sin(j*1.9),.008);pts.push([p.x,p.y,p.z]);
   if(j%3===0&&j<40){const c=B(new THREE.ConeGeometry(.005,.028,4),Th,p.x,p.y,p.z,m);c.rotation.order='YXZ';c.rotation.set(Math.PI/2-.5*(j%2?1:-1),ph,0)}}
  GX.strand(m,Th,pts,.0035,.0035,120)});
 /* آویزهای زنجیری با الماس سبز و منگوله */
 const dangle=(ti,phi,u0,len,i)=>{const t=T[ti],hh=t.y1-t.y0,u1=u0-len/hh,N=6,pts=[],vs=[],m=tiers[ti];
  for(let j=0;j<=N;j++){const u=u0+(u1-u0)*j/N,p=surf(t,phi,u,.045+(u<0?-u*.015:0));vs.push(p);pts.push([p.x,p.y,p.z])}
  GX.strand(m,Sv,pts,.0055,.0055,10);
  [2,4].forEach(j=>{const p=vs[j],d=vs[j+1].clone().sub(vs[j-1]).normalize(),q=new THREE.Quaternion().setFromUnitVectors(new V(0,1,0),d.clone().negate());
   B(Oc(.034,.7,1.5,.45),Sv,p.x,p.y,p.z,m).quaternion.copy(q);B(Oc(.02,.7,1.4,.5),Gm,p.x,p.y,p.z,m).quaternion.copy(q)});
  const e=vs[N],d=e.clone().sub(vs[N-1]).normalize();tassel(e,d,.12+.03*(i%3),i%2?Gr:K,m)};
 [[4,-.5,.12,.34],[4,.6,.1,.3],[3,.1,.14,.46],[3,-.95,.1,.36],[3,1.25,.12,.4],[2,-.3,.1,.36],[2,.85,.1,.42],[2,-1.5,.1,.3],[1,.15,.1,.42],[1,-.85,.08,.36],[1,1.0,.09,.4],[0,.35,.08,.26],[0,-.55,.08,.3],[0,1.15,.08,.26],[5,.05,.12,.26],[5,-.7,.1,.22],[5,.75,.1,.24]]
  .forEach((a,i)=>dangle(a[0],a[1],a[2],a[3],i));
 B(new THREE.TorusGeometry(.86,.028,8,56),Tm,0,Y+.03,0).rotation.x=Math.PI/2;
 /* ---- بالاتنه ---- */
 const fr=y=>{const a=[[1.1,.19],[1.16,.19],[1.24,.205],[1.38,.245],[1.48,.265],[1.54,.262]];for(let i=1;i<a.length;i++)if(y<=a[i][0]){const t=(y-a[i-1][0])/(a[i][0]-a[i-1][0]);return a[i-1][1]+(a[i][1]-a[i-1][1])*t}return .262},
  zf=(x,y)=>Math.sqrt(Math.max(.01,fr(y)*fr(y)-x*x))+.012;
 B(Ld([[.19,1.1],[.19,1.16],[.205,1.24],[.245,1.38],[.265,1.48],[.262,1.54]],40),K,0,Y);
 B(Ld([[.262,1.5],[.262,1.58],[.225,1.66],[.12,1.7],[.085,1.72]],36),Sk,0,Y);
 [-1,1].forEach(s=>B(S(.14,1,1,1),K0,s*.11,Y+1.5,.14));
 B(Ld([[.25,1.5],[.292,1.54],[.272,1.6]],44,18,.05),K0,0,Y);B(Ld([[.2535,1.5],[.2955,1.54]],44,18,.05),Sv,0,Y);
 // کمربند و رز کمر
 B(Ld([[.2,1.08],[.215,1.08],[.215,1.14],[.2,1.14]],40),Kl,0,Y);
 rose(0,Y+1.12,.265,1.35,[1.15,0,0]);rose(.3,Y+1.02,.17,.8,[.9,.5,.3]);
 B(S(.07,1.6,.4,1),Gr,-.1,Y+1.1,.25).rotation.z=.5;B(S(.07,1.6,.4,1),Gr,.1,Y+1.1,.25).rotation.z=-.5;
 // الماس‌های مرکزی و تیغه‌های خاردار نقره‌ای
 [1.2,1.3,1.4].forEach(y=>{const z=zf(0,y);B(Oc(.034,.6,1.5,.5),Sv,0,Y+y,z);B(Oc(.021,.6,1.4,.5),Gm,0,Y+y,z+.012)});
 [-1,1].forEach(s=>{GX.strand(G,Sv,[[s*.03,Y+1.16,zf(.03,1.16)],[s*.09,Y+1.24,zf(.09,1.24)],[s*.15,Y+1.32,zf(.15,1.32)],[s*.17,Y+1.42,zf(.17,1.42)]],.006,.005,14);
  GX.strand(G,Sv,[[s*.08,Y+1.2,zf(.08,1.2)],[s*.13,Y+1.15,zf(.13,1.15)]],.004,.003,4);
  B(new THREE.ConeGeometry(.008,.04,4),Sv,s*.09,Y+1.25,zf(.09,1.25)+.01).rotation.set(1.2,0,-s*.7);
  GX.strand(G,Sv,[[s*.075,Y+1.67,.095],[s*.12,Y+1.59,.225],[s*.08,Y+1.51,.285],[0,Y+1.455,.3]],.007,.007,14)});
 B(Oc(.04,.7,1.3,.6),Sv,0,Y+1.47,.29);B(Oc(.025,.7,1.3,.6),Gm,0,Y+1.47,.302);
 // یقهٔ بلند توری با جواهر
 B(Ld([[.1,1.67],[.108,1.7],[.102,1.76],[.098,1.78]],44,22,.035),K0,0,Y);
 [1.675,1.775].forEach(y=>B(new THREE.TorusGeometry(.102,.007,6,28),Sv,0,Y+y,0).rotation.x=Math.PI/2);
 [-.055,0,.055].forEach(x=>B(Oc(.02,.7,1.2,.6),Gm,x,Y+1.725,Math.sqrt(.1*.1-x*x)+.012));
 B(new THREE.CylinderGeometry(.07,.08,.14,12),Sk,0,Y+1.66,0);
 // بند کرست پشت
 for(let i=0;i<6;i++){const y=Y+1.18+i*.055;GX.strand(G,Sv,[[-.07,y,-.205],[0,y+.027,-.215],[.07,y+.055,-.205]],.005,.005,4);GX.strand(G,Sv,[[.07,y,-.205],[0,y+.027,-.215],[-.07,y+.055,-.205]],.005,.005,4)}
 // ---- سر و صورت ----
// ---- سر و صورت (طبیعی: چشم نیمه‌باز سبز-خاکستری، ابروی نازک، پلک‌زدن) ----
 const HY=Y+1.72,HD=new THREE.Group();HD.position.set(0,HY,0);G.add(HD);
 const fo2={skin:0xf6e5dc,hi:'#fff0ea',y:.23,r:.26,ex:55,i1:'#a8d6c6',i2:'#4f807a',i3:'#14302c',lash:'#120d14',brow:'#1a1216',sl:-1,lip:'#b8706c',sm:1,nat:1};
 GX.head(HD,M,fo2);const faceM=HD.children[1].material,fOpen=faceM.map,fShut=GX.faceN(Object.assign({},fo2,{closed:1}));
 // ---- مو: مشکی، بلند، صاف؛ بنگ صاف و یکدست ----
 B(S(.285,1,.9,1),Hr,0,.28,-.06,HD);
 B(new THREE.CylinderGeometry(.272,.268,.15,28,1,true,-1.0,2.0),HrD,0,.34,0,HD);
 
const HP=new THREE.Group();HP.position.set(0,Y+1.9,-.1);G.add(HP);
 const hs=(a,side,ph,len)=>{const pts=[];for(let j=0;j<=7;j++){const t=j/7,yy=1.9-t*len,za=-(.2+Math.max(0,1.15-yy)*.6)-.03*Math.sin(t*4+ph),xx=a*(.1+.3*t)+side*t*t*.5+Math.sin(t*5.5+ph)*.03*t;pts.push([xx,yy-1.9,za+.1])}GX.strand(HP,Hr,pts,.1,.03,24)};
 for(let i=0;i<17;i++)hs((i-8)/8,0,i*1.3,1.25+.1*Math.sin(i*2.1));
 for(let i=0;i<8;i++)hs(-.7,-.25-i*.09,i*2.1+.5,1.15+.06*i);
 [-1,1].forEach(s=>LOCK.push({m:GX.strand(G,Hr,[[s*.24,Y+2.02,.1],[s*.285,Y+1.8,.16],[s*.3,Y+1.58,.19],[s*.27,Y+1.42,.2]],.06,.02,16),s,r:Y+2.02}));
 // رز سر و زنجیرهای آویز
// رز سر و زنجیرهای آویز (همراه سر حرکت می‌کنند)
 rose(-.2,.48,.1,1.1,[.25,0,-.35],HD);B(S(.07,1.8,.4,1),Gr,-.3,.45,.05,HD).rotation.z=.6;B(S(.06,1.6,.4,1),K0,-.1,.48,.02,HD).rotation.z=-.4;
 [[-.31,.02,0],[-.33,.07,-.04],[.29,.02,0]].forEach((a,i)=>{const x=a[0],z=a[1],e=new V(x-.03,.02-i*.06,z+.03);
  GX.strand(HD,Sv,[[x,.4,z],[x-.03,.24,z+.04],[e.x,e.y,e.z]],.006,.006,8);B(Oc(.022,.7,1.3,.6),Gm,x-.02,.18,z+.04,HD);tassel(e,new V(0,-1,0),.13,Gr,HD)});
 
// ---- شانه‌ها، آستین زنگی سبز با چین‌های مشکی، دستکش بلند ----
 const sleeve=(s,Q,y0)=>{[[-.12,.17,Gr],[-.26,.21,K],[-.4,.25,Gr]].forEach((a,j)=>{const e=B(Ld([[a[1],0],[a[1]+.045,-.05],[a[1]+.02,-.12]],40,14,.1),a[2],0,a[0],0,Q);SL.push({e,j,s})});
  B(Ld([[.2,0],[.26,.02],[.25,.075],[.17,.13]],36,15,.1),G0,0,.02,0,Q).rotation.z=s*.2;
  B(Ld([[.14,0],[.27,.005],[.3,.06]],36,16,.12),K0,0,-.04,0,Q).rotation.z=s*.2;
  B(Cy(.1,.13,.5,14),G0,0,-.25,0,Q)};
 [-1,1].forEach(s=>B(S(.11,1,.8,1),Sk,s*.3,Y+1.62,0));
 // بازوی چپ (سمت راست تصویر): آویزان کنار بدن
 const la=new THREE.Group();la.position.set(.44,Y+1.56,.02);la.rotation.z=.17;la.rotation.x=-.08;G.add(la);sleeve(-1,la);
 GX.strand(la,Kl,[[0,-.3,0],[0,-.55,0],[0,-.78,0]],.06,.045,10);B(new THREE.TorusGeometry(.052,.011,8,18),Sv,0,-.68,0,la).rotation.x=Math.PI/2;B(Oc(.022,1,1.3,.6),Gm,0,-.68,.055,la);B(S(.07,1,1.2,.9),Kl,0,-.82,0,la);
 // بازوی راست (سمت چپ تصویر): هفت‌تیر در دست
 const arm=new THREE.Group();arm.position.set(-.44,Y+1.56,.02);G.add(arm);sleeve(1,arm);
 GX.strand(arm,Kl,[[0,-.3,0],[0,-.55,0],[0,-.78,0]],.06,.045,10);B(new THREE.TorusGeometry(.052,.011,8,18),Sv,0,-.68,0,arm).rotation.x=Math.PI/2;B(Oc(.022,1,1.3,.6),Gm,0,-.68,.055,arm);B(S(.07,1,1.2,.9),Kl,0,-.82,0,arm);
 // هفت‌تیر نقره‌ای دولول: لولهٔ تفنگ در راستای -y (وقتی بازو بالا می‌آید به جلو می‌رود)
 const gun=new THREE.Group();gun.position.set(0,-.82,0);arm.add(gun);
 B(new THREE.BoxGeometry(.05,.06,.13),Kl,0,.02,-.06,gun);                                  // دسته
 B(new THREE.BoxGeometry(.056,.15,.085),Sv,0,-.075,-.005,gun);                              // قاب
 B(new THREE.BoxGeometry(.02,.04,.045),Sv,0,-.03,.055,gun).rotation.x=.5;                   // چکش
 B(new THREE.TorusGeometry(.035,.006,6,14),Sv,0,-.06,-.075,gun).rotation.y=Math.PI/2;       // حفاظ ماشه
 B(Cy(.058,.058,.12,14),Sv,0,-.155,0,gun);                                                  // استوانهٔ فشنگ
 for(let i=0;i<6;i++){const a=i/6*TAU;B(Cy(.012,.012,.09,6),Kl,Math.sin(a)*.058,-.155,Math.cos(a)*.058,gun)}
 [-1,1].forEach(s=>{B(Oc(.026,.5,1.2,1),Gm,s*.03,-.085,0,gun);B(Cy(.021,.021,.24,10),Sv,s*.024,-.3,0,gun);B(new THREE.TorusGeometry(.025,.007,6,12),Sv,s*.024,-.425,0,gun).rotation.x=Math.PI/2;B(new THREE.TorusGeometry(.025,.006,6,12),Sv,s*.024,-.25,0,gun).rotation.x=Math.PI/2});
 B(new THREE.BoxGeometry(.018,.26,.012),Sv,0,-.3,.032,gun);B(Cy(.008,.008,.2,6),Sv,0,-.3,-.032,gun);B(new THREE.BoxGeometry(.008,.02,.022),Sv,0,-.43,.04,gun);
 [-.22,-.3,-.38].forEach(y=>B(new THREE.ConeGeometry(.006,.03,4),Sv,0,y,.046,gun).rotation.x=Math.PI/2);
 const muzzle=new THREE.Object3D();muzzle.position.set(0,-.44,0);gun.add(muzzle);
 // ---- انیمیشن: بیکار، شلیک (بالا آمدن دست، لگد، برگشت) و پُر کردن ----
// ---- انیمیشن طبیعی: تنفس، جابه‌جایی وزن، نگاه، پلک‌زدن، موج دامن؛ شلیک با پیش‌حرکت، لگد فنری و برگشت نرم ----

 /* ===== حرکت نرم مو و لباس (فنر + موج روی رأس‌ها) ===== */
 const hairS=HP.children.filter(o=>o.isMesh).map((m,i)=>{const p=m.geometry.attributes.position;m.frustumCulled=false;return{m,p,b:new Float32Array(p.array),ph:i*.2}});
 LOCK.forEach(o=>{o.p=o.m.geometry.attributes.position;o.b=new Float32Array(o.p.array);o.m.frustumCulled=false});
 const SK=T.map((tt,i)=>{const m=tiers[i],ent=[];
  const add=(o,vert)=>{if(vert){const p=o.geometry.attributes.position;o.frustumCulled=false;ent.push({o,p,b:new Float32Array(p.array),v:1})}else ent.push({o,r:o.position.clone(),v:0})};
  add(m,true);
  m.children.forEach(c=>{if(!c.isMesh)return;const flat=c.position.lengthSq()<1e-10&&Math.abs(c.rotation.x)+Math.abs(c.rotation.y)+Math.abs(c.rotation.z)<1e-6&&c.scale.x===1;add(c,flat)});
  return{i,t:tt,ent}});
 const SW={x:0,vx:0,z:0,vz:0,px:0,py:0,pz:0,lt:-1,ok:0},Q3={x:0,y:0,z:0},cl=(v,a)=>v<-a?-a:v>a?a:v;
 const fl=(x,y,z,tt,hh,i,t,amp,kick)=>{
  const w0=1-(y-tt.y0)/hh,w=w0<0?0:w0>1.5?1.5:w0,ww=w*Math.sqrt(w),ph=Math.atan2(x,z),
   wv=.6*Math.sin(3*ph-t*1.6+i*1.1)+.4*Math.sin(5*ph+t*1.15+i*.7),
   sc=1+ww*(.035*amp*wv+.05*Math.abs(SW.x)+.03*Math.abs(SW.z)+kick*.05*(i%2?1:-1)),
   dy=-ww*.014*amp*(.5+.5*Math.sin(2*ph-t*1.4+i))+ww*.008*Math.sin(t*1.7+i*.6);
  Q3.x=x*sc+ww*SW.x*.22;Q3.z=z*sc+ww*SW.z*.22;Q3.y=y+dy};
 const softUpdate=(t,kick)=>{
  const dt=SW.lt<0?.016:Math.min(.05,Math.max(.001,t-SW.lt));SW.lt=t;
  // سرعت واحد در فضای محلی → مو و دامن عقب می‌مانند
  const e=G.matrixWorld.elements;let lx=0,lz=0;
  if(SW.ok){const vx=(e[12]-SW.px)/dt,vy=(e[13]-SW.py)/dt,vz=(e[14]-SW.pz)/dt,ax=e[0]*e[0]+e[1]*e[1]+e[2]*e[2]||1,az=e[8]*e[8]+e[9]*e[9]+e[10]*e[10]||1;
   lx=(vx*e[0]+vy*e[1]+vz*e[2])/ax;lz=(vx*e[8]+vy*e[9]+vz*e[10])/az}
  SW.px=e[12];SW.py=e[13];SW.pz=e[14];SW.ok=1;
  const tx=cl(-lx*.1-(HD.rotation.y*.9+G.rotation.y*1.6)*.35,.35),tz=cl(-lz*.1+kick*.5,.35);
  SW.vx+=((tx-SW.x)*70-SW.vx*7.5)*dt;SW.x+=SW.vx*dt;SW.vz+=((tz-SW.z)*70-SW.vz*7.5)*dt;SW.z+=SW.vz*dt;
  const zf=Math.min(SW.z,.08);
  // مو
  hairS.forEach(o=>{const b=o.b,a=o.p.array,n=a.length/3;
   for(let k=0;k<n;k++){const x=b[k*3],y=b[k*3+1],z=b[k*3+2],d=Math.min(1.3,Math.max(0,-y/1.3)),w=d*d;
    a[k*3]=x+w*(.06*Math.sin(t*2.1+y*4.5+x*6+o.ph)+.03*Math.sin(t*3.4+y*7+x*9+o.ph)+SW.x*.8);
    a[k*3+1]=y-w*(Math.abs(SW.x)*.06+.015*Math.sin(t*2.6+x*5+o.ph));
    a[k*3+2]=z+w*(.04*Math.sin(t*1.7+y*3.8+x*5+o.ph)-.02+zf*.7)}
   o.p.needsUpdate=true;o.m.geometry.computeVertexNormals()});
  LOCK.forEach(o=>{const b=o.b,a=o.p.array,n=a.length/3;
   for(let k=0;k<n;k++){const y=b[k*3+1],d=Math.min(1,Math.max(0,(o.r-y)/.6)),w=d*d;
    a[k*3]=b[k*3]+w*(o.s*.012+.012*Math.sin(t*2.3+d*5+o.s)+SW.x*.25);
    a[k*3+2]=b[k*3+2]+w*(.015*Math.sin(t*1.9+d*4+o.s)+Math.min(SW.z,.05)*.3)}
   o.p.needsUpdate=true;o.m.geometry.computeVertexNormals()});
  // دامن (بدنه، حاشیه، زنجیر و آویزها یکسان جابه‌جا می‌شوند)
  const amp=1+.35*Math.sin(t*.45);
  SK.forEach(S=>{const hh=S.t.y1-S.t.y0;
   S.ent.forEach(E=>{
    if(E.v){const a=E.p.array,b=E.b,n=a.length/3;
     for(let k=0;k<n;k++){fl(b[k*3],b[k*3+1],b[k*3+2],S.t,hh,S.i,t,amp,kick);a[k*3]=Q3.x;a[k*3+1]=Q3.y;a[k*3+2]=Q3.z}
     E.p.needsUpdate=true}
    else{fl(E.r.x,E.r.y,E.r.z,S.t,hh,S.i,t,amp,kick);E.o.position.set(Q3.x,Q3.y,Q3.z)}});
   S.ent[0].o.geometry.computeVertexNormals()});
  // آستین‌های زنگی
  SL.forEach(o=>{const k=o.j+1;o.e.rotation.x=.045*k*Math.sin(t*1.8+o.j*.9+o.s*1.3)+zf*.1*k;o.e.rotation.z=.05*k*Math.sin(t*1.5+o.j*.7+o.s)-SW.x*.15*k*o.s})};
 const ST={t0:-1e9,self:false,r0:-1e9,bl:-10,nb:2.5,sh:false},ez=x=>x<=0?0:x>=1?1:x*x*(3-2*x),eo=x=>{x=x<=0?0:x>=1?1:x;return 1-Math.pow(1-x,3)};
 GX.anim(G,t=>{const n=performance.now(),e=(n-ST.t0)/1000,e2=(n-ST.r0)/1000;
  const ant=e<0?0:e<.1?ez(e/.1):e<.24?1-ez((e-.1)/.14):0,
   k=e<.1?0:e<.3?eo((e-.1)/.2):e<1?1:e<1.5?1-ez((e-1)/.5):0,
   kd=e-.28,kick=kd>0&&kd<2?Math.exp(-kd*7)*Math.sin(Math.min(kd,.05)/.05*Math.PI/2)*Math.cos(kd*9):0,
   kr=e2<0?0:e2<.35?eo(e2/.35):e2<1.5?1:e2<1.95?1-ez((e2-1.5)/.45):0,aX=ST.self?-2.3:-1.54,aZ=ST.self?.55:-.02;
  let rx=-.18+(aX+.18)*k,rz=-.2+(aZ+.2)*k;const w=kr*(1-k);rx+=(-1.05-rx)*w;rz+=(.5-rz)*w;
  arm.rotation.set(rx+ant*.12-kick*.2+.02*Math.sin(t*1.7)*(1-k),.08*k,rz+.015*Math.sin(t*.9)*(1-k));
  gun.rotation.x=-kick*.28+.05*Math.sin(t*1.3)*(1-k);
  la.rotation.z=.17+.018*Math.sin(t*.9+1);la.rotation.x=-.08+.025*Math.sin(t*1.1);
  // بدن: تنفس، جابه‌جایی وزن، چرخش ملایم تنه هنگام شلیک
  G.scale.set(1,1+.006*Math.sin(t*1.7),1);G.rotation.z=.012*Math.sin(t*.6);G.rotation.y=.12*k;G.rotation.x=-kick*.035+.015*k;
  // سر: نگاه آرام، خم‌شدن کم، واکنش به لگد
  HD.rotation.set(.03*Math.sin(t*.53)-kick*.05,.09*Math.sin(t*.37)+.05*Math.sin(t*.91+1)-.06*k,.025*Math.sin(t*.43+2));HD.position.y=HY+.006*Math.sin(t*1.7);
  // پلک‌زدن
  if(t>ST.nb){ST.bl=t;ST.nb=t+2.2+Math.random()*3.5}
  const sh=t-ST.bl<.13;if(sh!==ST.sh){ST.sh=sh;faceM.map=sh?fShut:fOpen}
  // مو و دامن: حرکت ثانویه با تأخیر
  HP.rotation.x=.03*Math.sin(t*1.3)+kick*.08;HP.rotation.z=.04*Math.sin(t*.9+1)-G.rotation.z*1.5;HP.rotation.y=-HD.rotation.y*.4;
  tiers.forEach((m,i)=>{m.rotation.y=.02*Math.sin(t*1.1+i*.8)+kick*.035*Math.sin(i*2);m.rotation.z=.012*Math.sin(t*.9+i*.7)+kick*.02*(i%2?1:-1);m.rotation.x=.01*Math.sin(t*.8+i*.6)-kick*.01*i});softUpdate(t,kick)});
 
G.userData.mak={fire:s=>{ST.t0=performance.now();ST.self=!!s},reload:()=>{ST.r0=performance.now()},muzzle};
 return G}
GX.reg('mak',gxMakao3,gxMakao2);
/* ---------- کماندو آلیس · نسخهٔ ۳ (مطابق تصویر مرجع: یونیفرم دریایی سفید، کلاه افسری، موی بلند سرخ، تک‌تیرانداز با تفنگ پیچ‌خور و دوربین) ---------- */
GX.anchor=(bg,fg)=>{const key=bg+fg;GX._an=GX._an||{};return GX._an[key]||(GX._an[key]=GX.tex(128,128,(x,w,h)=>{
 x.fillStyle=bg;x.fillRect(0,0,w,h);x.strokeStyle=fg;x.fillStyle=fg;x.lineWidth=9;x.lineCap='round';x.lineJoin='round';
 x.beginPath();x.arc(64,27,10,0,7);x.stroke();
 x.beginPath();x.moveTo(64,37);x.lineTo(64,104);x.moveTo(46,50);x.lineTo(82,50);x.stroke();
 x.beginPath();x.arc(64,74,36,.12*Math.PI,.88*Math.PI);x.stroke();
 x.beginPath();x.moveTo(24,84);x.lineTo(34,64);x.lineTo(44,92);x.fill();x.beginPath();x.moveTo(104,84);x.lineTo(94,64);x.lineTo(84,92);x.fill()},1))};
function gxAlice3(M,team){
 const V=THREE.Vector3,G=new THREE.Group(),P=GX.pal(M),Y=.18,
  B=(g,m,x,y,z,Q)=>{const e=new THREE.Mesh(g,m);e.position.set(x||0,y||0,z||0);(Q||G).add(e);return e},
  S=(r,a,b,c)=>new THREE.SphereGeometry(r,18,12).scale(a,b,c),
  Cy=(r1,r2,l,s)=>new THREE.CylinderGeometry(r1,r2,l,s||14),Bx=(a,b,c)=>new THREE.BoxGeometry(a,b,c),
  Tr=(r,t,s,arc)=>new THREE.TorusGeometry(r,t,8,s||24,arc),Ld=GX.lathe,
  W=P.cloth(0xf4f0e8),K=P.cloth(0x17171c),Kl=P.leather(0x141418),Gv=P.leather(0x0d0d10),Au=P.metal(0xe3b84a,{roughness:.28}),
  Hr=P.hair(0xd0112f),Sk=P.skin(0xf2bd9f),Mt=P.metal(0x25272b,{roughness:.35}),Wd=P.wood(),Lt=P.leather(0x6a3d1c),
  ez=x=>x<=0?0:x>=1?1:x*x*(3-2*x);
 // ---- پا: ران‌های پر، تسمهٔ ران، چکمهٔ بلند با سگک طلایی و بند ضربدری ----
 [-1,1].forEach(s=>{const x=s*.18;
  GX.strand(G,Sk,[[s*.17,Y+1.02,0],[s*.175,Y+.8,0],[x,Y+.62,0]],.135,.108,8);
  B(Ld([[0,0],[.15,0],[.16,.04],[.125,.2],[.13,.52],[.165,.6],[.165,.69],[.125,.69],[0,.69]],28),Kl,x,Y,0);
  B(S(.14,1,.6,1.55),Kl,x,Y+.07,.08);B(Cy(.17,.19,.05,22),Mt,x,Y+.025,0);
  [.54,.3].forEach(yy=>{B(Tr(.138,.02,28),Kl,x,Y+yy,0).rotation.x=Math.PI/2;B(Bx(.06,.05,.03),Au,x,Y+yy,.152)});
  B(Bx(.018,.2,.01),Kl,x-.03,Y+.42,.146).rotation.z=.55;B(Bx(.018,.2,.01),Kl,x+.03,Y+.42,.146).rotation.z=-.55;
  B(Tr(.13,.024,28),Kl,x,Y+.77,0).rotation.x=Math.PI/2;B(Bx(.065,.05,.03),Au,x,Y+.77,.135)});
 // ---- دامن چین‌دار مشکی با نوار طلایی، دنبالهٔ کت سفید ----
 B(Ld([[.5,.84],[.45,.9],[.34,1.0],[.28,1.14],[.27,1.2]],48,16,.045),K,0,Y);
 B(Ld([[.478,.862],[.492,.862],[.482,.88],[.468,.88]],48,16,.045),Au,0,Y);
 B(Ld([[.44,.93],[.37,1.0],[.262,1.1]],44,10,.04),W,0,Y);
 // ---- بالاتنه: کت سفید دوردیف با دکمهٔ طلایی، یقه و کراوات مشکی ----
 B(Ld([[0,1.14],[.255,1.14],[.245,1.25],[.27,1.45],[.3,1.6],[.28,1.74],[.14,1.8],[.09,1.82],[0,1.82]],36),W,0,Y);
 [-1,1].forEach(s=>B(S(.15,1,1,1),W,s*.115,Y+1.56,.15));
 B(Ld([[.15,1.75],[.185,1.76],[.175,1.85],[.13,1.85]],24),W,0,Y);
 B(Bx(.065,.34,.02),K,0,Y+1.58,.292);B(new THREE.ConeGeometry(.05,.1,4),K,0,Y+1.37,.292).rotation.z=Math.PI;B(S(.04,1,.8,.8),K,0,Y+1.76,.27);
 [-1,1].forEach(s=>{for(let i=0;i<4;i++)B(new THREE.SphereGeometry(.018,10,8),Au,s*.08,Y+1.16+i*.065,.262)});
 B(Ld([[.28,1.08],[.292,1.08],[.292,1.17],[.28,1.17]],40),Kl,0,Y);B(Bx(.1,.08,.03),Au,0,Y+1.125,.295);B(Bx(.05,.04,.035),K,0,Y+1.125,.295);
 // سردوشی مشکی-طلایی
 [-1,1].forEach(s=>{B(Bx(.2,.03,.15),K,s*.36,Y+1.83,0).rotation.z=-s*.14;B(Bx(.2,.034,.028),Au,s*.36,Y+1.835,.04).rotation.z=-s*.14;B(Bx(.2,.034,.028),Au,s*.36,Y+1.835,-.04).rotation.z=-s*.14;B(new THREE.SphereGeometry(.022,8,6),Au,s*.3,Y+1.86,0)});
 // کیسه‌های تاکتیکی کمر و ران
 [[-.4,1.04,.06,.13,.15],[-.43,.93,.14,.1,.11],[-.3,1.0,.23,.08,.09]].forEach(p=>{B(Bx(p[3],p[4],.08),Kl,p[0],Y+p[1],p[2]).rotation.y=-.5;B(Bx(.035,.05,.012),Au,p[0]+.01,Y+p[1]+.02,p[2]+.045).rotation.y=-.5});
 B(Bx(.1,.13,.07),Kl,.4,Y+.97,.09).rotation.y=.5;B(Bx(.035,.05,.012),Au,.39,Y+1.0,.13).rotation.y=.5;
 // ---- دست‌ها (پویا): آستین سفید، سرآستین طلایی، دستکش مشکی، بازوبند و نشان لنگر ----
 const SH=[new V(-.34,Y+1.74,0),new V(.34,Y+1.74,0)],AG=[new THREE.Group(),new THREE.Group()];G.add(AG[0],AG[1]);
 const patchM=M(0xffffff,{map:GX.anchor('#17171c','#e3b84a'),roughness:.7});
 const arm=(i,hand)=>{const s=i?1:-1,a=SH[i],el=a.clone().lerp(hand,.5).add(new V(s*.13,-.17,-.04)),g=AG[i];
  while(g.children.length){const o=g.children.pop();if(o.geometry)o.geometry.dispose()}
  const add=(geo,m)=>{const e=new THREE.Mesh(geo,m);g.add(e);return e},at=(p,q,t)=>p.clone().lerp(q,t),ori=(e,d)=>{e.quaternion.setFromUnitVectors(new V(0,0,1),d.clone().normalize())};
  add(GX.tube([[a.x,a.y,a.z],[el.x,el.y,el.z],[hand.x,hand.y,hand.z]],u=>.095-.04*u,14,8),W);
  add(S(.078,1,1,1),Gv).position.copy(hand);
  const c=add(Tr(.078,.022,18),Au);c.position.copy(at(el,hand,.7));ori(c,hand.clone().sub(el));
  if(i){const bp=at(a,el,.5),b=add(Tr(.105,.03,20),Kl);b.position.copy(bp);ori(b,el.clone().sub(a));
   add(Bx(.05,.05,.02),Au).position.copy(bp).add(new V(.11,0,0));
   const pt=add(new THREE.PlaneGeometry(.12,.14),patchM);pt.position.copy(at(a,el,.18)).add(new V(.098,.02,0));pt.rotation.y=Math.PI/2}
  g.children.forEach(o=>{o.castShadow=true})};
 // ---- تفنگ تک‌تیر پیچ‌خور (چوب، فولاد، دوربین، بند چرمی) ----
 const RG=new THREE.Group();RG.rotation.order='YZX';G.add(RG);
 const rb=(g,m,x,y,z)=>B(g,m,x,y,z,RG),cy=(r,l,m,x,y,z)=>{const e=rb(Cy(r,r,l,14),m,x,y,z);e.rotation.z=Math.PI/2;return e};
 rb(Bx(.035,.2,.09),Mt,-.6,-.02,0);rb(Bx(.42,.12,.07),Wd,-.38,-.03,0);rb(Bx(.3,.05,.075),Wd,-.42,.045,0);rb(Bx(.2,.1,.065),Wd,-.14,-.06,0);
 rb(Tr(.05,.008,14,Math.PI),Mt,-.1,-.12,0).rotation.z=Math.PI;rb(Bx(.34,.075,.07),Mt,-.02,.045,0);rb(Bx(.52,.085,.065),Wd,.34,-.005,0);
 cy(.026,.9,Mt,.55,.01,0);cy(.034,.05,Mt,1.03,.01,0);rb(Bx(.02,.04,.02),Mt,.98,.045,0);[.2,.5].forEach(x=>rb(Tr(.04,.008,14),Mt,x,.005,0).rotation.y=Math.PI/2);
 cy(.04,.42,Mt,.05,.16,0);cy(.058,.1,Mt,.3,.16,0).scale.set(1,1,1);cy(.05,.06,Mt,-.17,.16,0);
 [-.02,.14].forEach(x=>rb(Bx(.04,.07,.05),Mt,x,.105,0));cy(.02,.05,Mt,.08,.21,0).rotation.set(0,0,0);cy(.02,.05,Mt,.08,.16,.048).rotation.set(Math.PI/2,0,0);
 const glint=new THREE.Mesh(new THREE.SphereGeometry(.09,12,8),new THREE.MeshBasicMaterial({color:0xfff6dc,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));glint.position.set(.36,.16,0);RG.add(glint);
 const BH=new THREE.Group();RG.add(BH);B(Cy(.012,.012,.12),Mt,0,0,.06,BH).rotation.x=Math.PI/2;B(new THREE.SphereGeometry(.028,10,8),Mt,0,0,.125,BH);B(Cy(.02,.02,.16),Mt,0,0,0,BH).rotation.z=Math.PI/2;
 GX.strand(RG,Lt,[[-.5,-.05,.05],[-.3,-.3,.06],[.1,-.42,.06],[.5,-.3,.06],[.6,-.03,.05]],.016,.016,16);
 const muzzle=new THREE.Object3D();muzzle.position.set(1.07,.01,0);RG.add(muzzle);
 const pose=(k,kick,l,sl,bw)=>{
  RG.position.set(-.2*k,Y+1.36+.42*k,.44+.26*k-kick*.12*k);
  RG.rotation.set(0,-Math.PI/2*k,-.6*(1-k)-.03*k+kick*.09*k);
  BH.rotation.x=.55-l*1.9;BH.position.set(-.05-sl*.11,.06,0);RG.updateMatrix();
  const knob=new V(BH.position.x,BH.position.y-.125*Math.sin(BH.rotation.x),BH.position.z+.125*Math.cos(BH.rotation.x)),
   rh=new V(-.24,-.05,0).lerp(knob,bw).applyMatrix4(RG.matrix),lh=new V(.2,-.02,0).applyMatrix4(RG.matrix);
  arm(0,rh);arm(1,lh)};
 pose(0,0,0,0,0);
 // ---- شنل پرچم‌مانند با لنگر طلایی و آستر سرخ ----
 const cg=new THREE.PlaneGeometry(.98,1.12,10,14);cg.translate(0,-.56,0);const cb=Float32Array.from(cg.attributes.position.array),CP=new THREE.Group();CP.position.set(0,Y+1.8,-.36);G.add(CP);
 CP.add(new THREE.Mesh(cg,M(0xffffff,{map:aliceTex('cape'),roughness:.8,bumpMap:GX.weave(),bumpScale:1,side:THREE.FrontSide})),new THREE.Mesh(cg,P.cloth(0x8c1020,{side:THREE.BackSide})));
 [-1,1].forEach(s=>B(new THREE.SphereGeometry(.04,10,8),Au,s*.3,Y+1.78,-.3));
 const cape=t=>{const p=cg.attributes.position;for(let i=0;i<p.count;i++){const x=cb[i*3],y=cb[i*3+1],k=-y/1.12;p.setZ(i,.07*(x/.49)*(x/.49)*(1-k*.4)-.1*k*k+.035*Math.sin(y*7+t*2.2+x*3)*k)}p.needsUpdate=true;cg.computeVertexNormals()};cape(0);
 // ---- سر، چشم سرخ، موی بلند موج‌دار ----
 GX.head(G,M,{skin:0xf2bd9f,hi:'#f8cdb2',y:Y+2,r:.27,ex:58,i1:'#ff7a7a',i2:'#e0152b',i3:'#5a0814',lash:'#3a0610',brow:'#7a1020',sl:7,lip:'#a0504a',sm:-1});
 B(S(.3,1,.82,1),Hr,0,Y+2.07,-.05);B(S(.16,1.5,.6,.6),Hr,0,Y+2.18,.2);[-1,1].forEach(s=>B(S(.12,.6,1.2,.5),Hr,s*.17,Y+2.02,.22).rotation.z=s*.35);
 const HP=new THREE.Group();HP.position.set(0,Y+1.95,-.1);G.add(HP);
 const hs=(a,ph,len)=>{const pts=[];for(let j=0;j<=7;j++){const t=j/7;pts.push([a*(.1+.4*t)+Math.sin(t*6+ph)*.06*t,-t*len,-(.18+t*.16)-.03*Math.sin(t*4+ph)])}GX.strand(HP,Hr,pts,.1,.03,16)};
 for(let i=0;i<15;i++)hs((i-7)/7,i*1.3,1.35+.2*Math.sin(i*2.1));
 [-1,1].forEach(s=>GX.strand(G,Hr,[[s*.25,Y+2.04,.06],[s*.31,Y+1.8,.14],[s*.34,Y+1.5,.15],[s*.31,Y+1.2,.1]],.075,.025,14));
 // ---- کلاه افسری سفید با نشان لنگر ----
 B(Ld([[0,0],[.295,0],[.33,.05],[.34,.12],[.3,.17],[0,.175]],40),W,0,Y+2.25,-.03);B(Ld([[.296,0],[.312,0],[.312,.07],[.296,.07]],40),K,0,Y+2.25,-.03);
 B(Tr(.32,.016,40),Au,0,Y+2.34,-.03).rotation.x=Math.PI/2;
 B(new THREE.CylinderGeometry(.24,.24,.025,24,1,false,-Math.PI*.45,Math.PI*.9),Kl,0,Y+2.26,.1).rotation.x=.18;
 B(new THREE.CylinderGeometry(.245,.245,.012,24,1,false,-Math.PI*.45,Math.PI*.9),Au,0,Y+2.275,.1).rotation.x=.18;
 B(new THREE.CircleGeometry(.075,24),M(0xffffff,{map:GX.anchor('#e3b84a','#17171c'),roughness:.4,metalness:.5}),0,Y+2.3,.336);
 [-1,1].forEach(s=>B(new THREE.SphereGeometry(.026,10,8),Au,s*.31,Y+2.28,.08));
 // ---- انیمیشن: بیکار، شلیک (شانه‌گیری، لگد، کشیدن گلنگدن، پرتاب پوکه) ----
 const PR={n:{ta:.3,fT:.34,bs:.5,bd:.6,rs:1.2,rd:.4},a:{ta:.5,fT:.8,bs:.96,bd:.75,rs:1.95,rd:.45}},ST={t0:-1e9,p:PR.n,ab:false,ej:0,on:false};
 const eject=()=>{try{BH.updateWorldMatrix(true,false);const w=new V();BH.getWorldPosition(w);burst(w,1,0xe8b84a,{sp:1.3,size:.09,life:.7,g:7,vy:1.6,y:0,r:.02,h:.02})}catch(e){}};
 GX.anim(G,t=>{const n=performance.now(),e=(n-ST.t0)/1000,p=ST.p,act=e>=0&&e<p.rs+p.rd+.05;let k=0,kick=0;
  if(act){let l=0,sl=0,bw=0;k=e<p.ta?ez(e/p.ta):e<p.rs?1:1-ez((e-p.rs)/p.rd);
   kick=e>p.fT?Math.exp(-(e-p.fT)*8)*ez((e-p.fT)/.04):0;
   const u=(e-p.bs)/p.bd;
   if(u>=0&&u<=1){l=u<.2?ez(u/.2):u<.7?1:1-ez((u-.7)/.2);sl=u<.2?0:u<.45?ez((u-.2)/.25):u<.7?1-ez((u-.45)/.25):0;bw=ez(u/.08)*(1-ez((u-.88)/.12));if(!ST.ej&&u>.3){ST.ej=1;eject()}}
   pose(k,kick,l,sl,bw);ST.on=true;
   glint.material.opacity=ST.ab?(e<p.fT?ez((e-.2)/(p.fT-.2))*.9:Math.max(0,1-(e-p.fT)*5)*.9):0}
  else if(ST.on){pose(0,0,0,0,0);ST.on=false;glint.material.opacity=0}
  G.rotation.x=-kick*.045;G.position.y=.01*Math.sin(t*2);
  HP.rotation.x=.04*Math.sin(t*1.6)+kick*.12;HP.rotation.z=.05*Math.sin(t*1.1+1);CP.rotation.x=.03*Math.sin(t*1.4)+kick*.08;cape(t)});
 G.userData.ali={fire:ab=>{ST.t0=performance.now();ST.ab=!!ab;ST.p=ab?PR.a:PR.n;ST.ej=0},delay:ab=>(ab?PR.a:PR.n).fT*1000,muzzle};
 return G}
GX.reg('ali',gxAlice3,gxAlice2);
/* ---------- کماندو آلیس · نسخهٔ ۴ (ارتقای جزئیات بر اساس تصویر مرجع؛ انیمیشن‌ها دقیقاً همان نسخهٔ ۳) ---------- */
GX.alWood=()=>GX._alW||(GX._alW=GX.tex(256,64,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#6a3c1c');g.addColorStop(.5,'#52301a');g.addColorStop(1,'#3e2412');x.fillStyle=g;x.fillRect(0,0,w,h);
 for(let i=0;i<70;i++){x.strokeStyle=i%3?'rgba(30,14,6,'+(.12+Math.random()*.25)+')':'rgba(170,110,60,'+(.1+Math.random()*.18)+')';x.lineWidth=.6+Math.random()*1.8;const y0=Math.random()*h;x.beginPath();x.moveTo(0,y0);x.bezierCurveTo(w*.3,y0+(Math.random()-.5)*10,w*.6,y0+(Math.random()-.5)*10,w,y0+(Math.random()-.5)*8);x.stroke()}
 for(let i=0;i<26;i++){x.strokeStyle='rgba(215,180,130,'+(.25+Math.random()*.3)+')';x.lineWidth=.7;const X=Math.random()*w,Z=Math.random()*h;x.beginPath();x.moveTo(X,Z);x.lineTo(X+10+Math.random()*26,Z+(Math.random()-.5)*8);x.stroke()}
 for(let i=0;i<14;i++){x.fillStyle='rgba(20,10,4,'+(.25+Math.random()*.3)+')';x.beginPath();x.ellipse(Math.random()*w,Math.random()*h,3+Math.random()*8,2+Math.random()*4,Math.random()*3,0,7);x.fill()}},1));
GX.alSil=(x,w,h)=>{const n=6,d=44,sw=w/n;x.beginPath();x.moveTo(0,0);x.lineTo(w,0);x.lineTo(w,h-d);for(let i=n-1;i>=0;i--){x.lineTo(i*sw+sw/2,h);x.lineTo(i*sw,h-d)}x.closePath()};
GX.alCape=()=>GX._alC||(GX._alC=GX.tex(256,288,(x,w,h)=>{x.save();GX.alSil(x,w,h);x.clip();
 const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#1d1d24');g.addColorStop(1,'#101015');x.fillStyle=g;x.fillRect(0,0,w,h);
 for(let i=0;i<60;i++){x.strokeStyle=i%2?'rgba(0,0,0,.28)':'rgba(120,120,150,.07)';x.lineWidth=1+Math.random()*3;const X=Math.random()*w;x.beginPath();x.moveTo(X,0);x.bezierCurveTo(X+6,h*.3,X-6,h*.6,X+Math.random()*10-5,h);x.stroke()}
 for(let i=0;i<40;i++){x.fillStyle='rgba(90,70,50,'+(Math.random()*.12)+')';x.beginPath();x.ellipse(Math.random()*w,Math.random()*h,2+Math.random()*10,1+Math.random()*5,Math.random()*3,0,7);x.fill()}
 x.strokeStyle='#d8aa3a';x.lineWidth=9;x.lineJoin='miter';GX.alSil(x,w,h);x.stroke();x.restore();
 x.save();x.translate(w/2,h*.46);x.scale(1.5,1.5);x.strokeStyle='#d8aa3a';x.fillStyle='#d8aa3a';x.lineCap='round';x.lineJoin='round';x.lineWidth=8;
 x.beginPath();x.arc(0,-42,10,0,7);x.stroke();x.beginPath();x.moveTo(0,-32);x.lineTo(0,46);x.moveTo(-18,-18);x.lineTo(18,-18);x.stroke();
 x.beginPath();x.arc(0,22,34,.12*Math.PI,.88*Math.PI);x.stroke();
 x.beginPath();x.moveTo(-36,30);x.lineTo(-24,10);x.lineTo(-14,38);x.fill();x.beginPath();x.moveTo(36,30);x.lineTo(24,10);x.lineTo(14,38);x.fill();
 x.lineWidth=3;x.strokeStyle='#8a6a1c';x.beginPath();x.moveTo(-10,-30);x.bezierCurveTo(-30,-10,10,10,-10,30);x.stroke();x.restore();
 x.fillStyle='#d8aa3a';x.beginPath();x.moveTo(0,h-100);x.lineTo(28,h-70);x.lineTo(12,h-30);x.lineTo(0,h-14);x.fill();x.beginPath();x.moveTo(w,h-100);x.lineTo(w-28,h-70);x.lineTo(w-12,h-30);x.lineTo(w,h-14);x.fill()},1));
GX.alLin=()=>GX._alL||(GX._alL=GX.tex(256,288,(x,w,h)=>{x.save();GX.alSil(x,w,h);x.clip();
 const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#5e0a18');g.addColorStop(1,'#a3152a');x.fillStyle=g;x.fillRect(0,0,w,h);
 for(let i=0;i<18;i++){x.fillStyle=i%2?'rgba(0,0,0,.22)':'rgba(255,90,100,.1)';x.fillRect(i*w/18,0,w/18,h)}
 x.strokeStyle='#d8aa3a';x.lineWidth=6;GX.alSil(x,w,h);x.stroke();x.restore()},1));
GX.faceAl=o=>GX.tex(256,256,(x,w,h)=>{
 const S='#'+new THREE.Color(o.skin).getHexString(),g=x.createRadialGradient(w/2,h*.55,8,w/2,h*.5,w*.6);
 g.addColorStop(0,o.hi);g.addColorStop(.75,S);g.addColorStop(1,S);x.fillStyle=g;x.fillRect(0,0,w,h);x.lineCap='round';x.lineJoin='round';
 [.16,.84].forEach(a=>{const r=x.createRadialGradient(a*w,h*.68,2,a*w,h*.68,34);r.addColorStop(0,'rgba(255,100,100,.34)');r.addColorStop(1,'rgba(255,100,100,0)');x.fillStyle=r;x.fillRect(a*w-36,h*.68-36,72,72)});
 [-1,1].forEach(s=>{x.save();x.translate(w/2+s*o.ex,h*.5);x.scale(s,1);
  const eye=()=>{x.beginPath();x.moveTo(-26,6);x.bezierCurveTo(-14,-12,14,-16,29,-6);x.bezierCurveTo(14,12,-12,16,-26,6);x.closePath()};
  eye();x.fillStyle='#f8efef';x.fill();x.save();eye();x.clip();
  const ir=x.createRadialGradient(2,2,2,2,2,22);ir.addColorStop(0,o.i1);ir.addColorStop(.55,o.i2);ir.addColorStop(1,o.i3);x.fillStyle=ir;x.beginPath();x.ellipse(2,1,14,19,0,0,7);x.fill();
  x.fillStyle='#2a0409';x.beginPath();x.ellipse(2,2,6,12,0,0,7);x.fill();x.fillStyle='rgba(60,0,10,.45)';x.fillRect(-30,-24,60,16);
  x.fillStyle='#fff';x.beginPath();x.arc(-4,-5,5,0,7);x.fill();x.beginPath();x.arc(8,9,2.6,0,7);x.fill();x.restore();
  x.strokeStyle=o.lash;x.lineWidth=7;x.beginPath();x.moveTo(-28,6);x.bezierCurveTo(-14,-12,14,-16,30,-6);x.stroke();
  x.lineWidth=5;x.beginPath();x.moveTo(27,-7);x.lineTo(42,-15);x.stroke();
  x.strokeStyle=o.brow;x.lineWidth=9;x.beginPath();x.moveTo(-24,-26);x.quadraticCurveTo(6,-42,36,-46);x.stroke();x.restore()});
 x.strokeStyle='rgba(120,60,50,.35)';x.lineWidth=3;x.beginPath();x.moveTo(w/2-2,h*.66);x.lineTo(w/2+3,h*.68);x.stroke();
 x.strokeStyle='#8a3a44';x.lineWidth=5;x.beginPath();x.moveTo(w/2-17,h*.835);x.quadraticCurveTo(w/2,h*.815,w/2+17,h*.84);x.stroke()},1);
function gxAlice4(M,team){
 const V=THREE.Vector3,G=new THREE.Group(),P=GX.pal(M),Y=.18,
  B=(g,m,x,y,z,Q)=>{const e=new THREE.Mesh(g,m);e.position.set(x||0,y||0,z||0);(Q||G).add(e);return e},
  S=(r,a,b,c)=>new THREE.SphereGeometry(r,18,12).scale(a,b,c),
  Cy=(r1,r2,l,s)=>new THREE.CylinderGeometry(r1,r2,l,s||14),Bx=(a,b,c)=>new THREE.BoxGeometry(a,b,c),
  Tr=(r,t,s,arc)=>new THREE.TorusGeometry(r,t,8,s||24,arc),Ld=GX.lathe,
  W=P.cloth(0xf4f0e8),K=P.cloth(0x17171c),Kl=P.leather(0x141418),Gv=P.leather(0x0d0d10),Au=P.metal(0xe3b84a,{roughness:.28}),
  Hr=P.hair(0xd0112f),Sk=P.skin(0xf2bd9f),Mt=P.metal(0x25272b,{roughness:.35}),Wd=M(0xffffff,{map:GX.alWood(),roughness:.5,clearcoat:.35,clearcoatRoughness:.4}),Lt=P.leather(0x6a3d1c),
  ez=x=>x<=0?0:x>=1?1:x*x*(3-2*x);
  const Cn=(r,l,s)=>new THREE.ConeGeometry(r,l,s||5),Hr2=P.hair(0x9d0b22),Hr3=P.hair(0xff3354),Bk=P.leather(0x0b0b0f),Wj=P.cloth(0xf8f5ee),Vs=P.leather(0x08080c),
   Gl=M(GX.c(0x2a3a66),{roughness:.05,metalness:.9,clearcoat:1,emissive:new THREE.Color(.01,.02,.06)});
  // ---- پا: ران‌های پر، تسمهٔ ران، چکمهٔ نظامی با کاف تاخورده، آج کفش، سگک‌های طلایی و بند ضربدری ----
  [-1,1].forEach(s=>{const x=s*.18;
   GX.strand(G,Sk,[[s*.17,Y+1.02,0],[s*.175,Y+.8,0],[x,Y+.62,0]],.135,.108,12);
   B(Ld([[0,0],[.15,0],[.16,.04],[.125,.2],[.13,.52],[.165,.6],[.165,.69],[.125,.69],[0,.69]],36),Kl,x,Y,0);
   B(Ld([[.162,.62],[.19,.66],[.192,.74],[.168,.74]],32),Kl,x,Y,0);B(Tr(.18,.008,32),Au,x,Y+.735,0).rotation.x=Math.PI/2;
   B(S(.14,1,.6,1.55),Kl,x,Y+.07,.08);B(S(.12,1,.5,.9),Mt,x,Y+.075,.16);B(Cy(.175,.195,.06,26),Gv,x,Y+.03,0);
   for(let i=0;i<14;i++){const an=i/14*Math.PI*2;B(Bx(.05,.04,.04),Gv,x+Math.cos(an)*.18,Y+.012,Math.sin(an)*.18).rotation.y=-an}
   [.54,.3].forEach(yy=>{B(Tr(.138,.02,32),Kl,x,Y+yy,0).rotation.x=Math.PI/2;B(Bx(.07,.06,.03),Au,x,Y+yy,.152);B(Bx(.04,.03,.034),Kl,x,Y+yy,.154);B(Bx(.05,.012,.02),Kl,x+.05*s,Y+yy-.02,.15)});
   [.14,.22,.3,.38,.46].forEach(yy=>{B(Bx(.016,.13,.01),Kl,x,Y+yy,.146).rotation.z=.6;B(Bx(.016,.13,.01),Kl,x,Y+yy,.146).rotation.z=-.6;[-.052,.052].forEach(q=>B(new THREE.SphereGeometry(.009,6,5),Au,x+q,Y+yy,.15))});
   B(Tr(.13,.024,32),Kl,x,Y+.77,0).rotation.x=Math.PI/2;B(Bx(.075,.06,.03),Au,x,Y+.77,.135);B(Bx(.04,.035,.034),Kl,x,Y+.77,.137)});
  // ---- دامن چین‌دار مشکی با دو نوار طلایی، دنبالهٔ کت سفید با لبهٔ طلایی ----
  B(Ld([[.5,.84],[.45,.9],[.34,1.0],[.28,1.14],[.27,1.2]],56,28,.05),K,0,Y);
  B(Ld([[.478,.862],[.492,.862],[.482,.88],[.468,.88]],56,28,.05),Au,0,Y);B(Ld([[.466,.9],[.472,.9],[.464,.915],[.458,.915]],56,28,.05),Au,0,Y);
  B(Ld([[.44,.93],[.37,1.0],[.262,1.1]],44,10,.04),W,0,Y);B(Tr(.442,.011,44),Au,0,Y+.93).rotation.x=Math.PI/2;
 // ---- بالاتنه: کت سفید دوردیف با دکمهٔ طلایی، یقه و کراوات مشکی ----
 B(Ld([[0,1.14],[.255,1.14],[.245,1.25],[.27,1.45],[.3,1.6],[.28,1.74],[.14,1.8],[.09,1.82],[0,1.82]],36),W,0,Y);
 [-1,1].forEach(s=>B(S(.15,1,1,1),W,s*.115,Y+1.56,.15));
 B(Ld([[.15,1.75],[.185,1.76],[.175,1.85],[.13,1.85]],24),W,0,Y);
 B(Bx(.065,.34,.02),K,0,Y+1.58,.292);B(new THREE.ConeGeometry(.05,.1,4),K,0,Y+1.37,.292).rotation.z=Math.PI;B(S(.04,1,.8,.8),K,0,Y+1.76,.27);
 [-1,1].forEach(s=>{for(let i=0;i<4;i++)B(new THREE.SphereGeometry(.018,10,8),Au,s*.08,Y+1.16+i*.065,.262)});
 B(Ld([[.28,1.08],[.292,1.08],[.292,1.17],[.28,1.17]],40),Kl,0,Y);B(Bx(.1,.08,.03),Au,0,Y+1.125,.295);B(Bx(.05,.04,.035),K,0,Y+1.125,.295);
  // سردوشی مشکی-طلایی با نوار درجه و ریشهٔ طلایی
  [-1,1].forEach(s=>{B(Bx(.2,.03,.15),K,s*.36,Y+1.83,0).rotation.z=-s*.14;B(Bx(.2,.034,.028),Au,s*.36,Y+1.835,.04).rotation.z=-s*.14;B(Bx(.2,.034,.028),Au,s*.36,Y+1.835,-.04).rotation.z=-s*.14;B(new THREE.SphereGeometry(.022,8,6),Au,s*.3,Y+1.86,0);
   B(Bx(.04,.036,.15),Au,s*.36,Y+1.84,0).rotation.z=-s*.14;for(let i=0;i<7;i++)B(Cy(.006,.006,.05,6),Au,s*.36+(i-3)*.027,Y+1.8,.092)});
  // کیسه‌های تاکتیکی کمر و ران: درِ دوتکه، بند، قفل طلایی و نوار مولی
  const pouch=(x,y,z,w,h,d,ry,clasp)=>{const g=new THREE.Group();g.position.set(x,Y+y,z);g.rotation.y=ry;G.add(g);
   B(Bx(w,h,d),Kl,0,0,0,g);B(Bx(w*1.02,h*.4,d*1.08),Bk,0,h*.32,0,g);B(Bx(w*.5,.012,.012),Mt,0,h*.1,d*.55,g);
   if(clasp)B(Bx(.035,.05,.012),Au,0,h*.15,d*.58,g);for(let i=0;i<3;i++)B(Bx(w*.9,.01,.006),Mt,0,-h*.2-i*h*.12,d*.52,g);return g};
  [[-.4,1.04,.06,.13,.15,.09,-.5,1],[-.43,.93,.14,.1,.11,.08,-.5,1],[-.3,1.0,.23,.08,.09,.07,-.5,1],[-.46,1.07,-.04,.1,.12,.08,-.6,0],[-.38,.88,.02,.1,.14,.08,-.5,0],[.4,.97,.09,.1,.13,.07,.5,1],[.43,.88,.04,.08,.1,.06,.6,0]].forEach(q=>pouch(...q));
 // ---- دست‌ها (پویا): آستین سفید، سرآستین طلایی، دستکش مشکی، بازوبند و نشان لنگر ----
 const SH=[new V(-.34,Y+1.74,0),new V(.34,Y+1.74,0)],AG=[new THREE.Group(),new THREE.Group()];G.add(AG[0],AG[1]);
 const patchM=M(0xffffff,{map:GX.anchor('#17171c','#e3b84a'),roughness:.7});
  // نشان لنگر سینه، سنجاق کراوات، جیب‌های کت، ریسمان طلایی دوشی
  B(new THREE.PlaneGeometry(.075,.09),M(0xffffff,{map:GX.anchor('#17171c','#e3b84a'),roughness:.7}),.2,Y+1.62,.285).rotation.y=.5;
  B(Bx(.075,.012,.012),Au,0,Y+1.5,.305);
  [-1,1].forEach(s=>{B(Bx(.1,.035,.02),W,s*.17,Y+1.21,.195).rotation.y=s*.76;B(new THREE.SphereGeometry(.013,8,6),Au,s*.178,Y+1.21,.207)});
  [0,1].forEach(q=>GX.strand(G,Au,[[-.33,Y+1.83,.06],[-.24+q*.03,Y+1.7,.22],[-.12,Y+1.52-q*.04,.285],[-.05,Y+1.38-q*.06,.292]],.012,.012,16));
  B(Cn(.02,.07,6),Au,-.05,Y+1.34,.292).rotation.z=Math.PI;
  const arm=(i,hand)=>{const s=i?1:-1,a=SH[i],el=a.clone().lerp(hand,.5).add(new V(s*.13,-.17,-.04)),g=AG[i];
   while(g.children.length){const o=g.children.pop();if(o.geometry)o.geometry.dispose()}
   const add=(geo,m)=>{const e=new THREE.Mesh(geo,m);g.add(e);return e},at=(p,q,t)=>p.clone().lerp(q,t),ori=(e,d)=>{e.quaternion.setFromUnitVectors(new V(0,0,1),d.clone().normalize())};
   add(GX.tube([[a.x,a.y,a.z],[el.x,el.y,el.z],[hand.x,hand.y,hand.z]],u=>.095-.04*u,16,10),W);
   add(S(.078,1,1,1),Gv).position.copy(hand);add(S(.032,1,1.3,.8),Gv).position.copy(hand).add(new V(s*.04,.035,.045));
   const c=add(Tr(.078,.022,20),Au);c.position.copy(at(el,hand,.7));ori(c,hand.clone().sub(el));
   const c2=add(Tr(.082,.012,20),Kl);c2.position.copy(at(el,hand,.82));ori(c2,hand.clone().sub(el));
   add(new THREE.SphereGeometry(.014,8,6),Au).position.copy(at(el,hand,.66)).add(new V(0,.075,0));
   const e2=add(Tr(.094,.01,20),Au);e2.position.copy(at(a,el,.82));ori(e2,el.clone().sub(a));
   if(i){const bp=at(a,el,.5),b=add(Tr(.105,.03,20),Kl);b.position.copy(bp);ori(b,el.clone().sub(a));
    add(Bx(.05,.05,.02),Au).position.copy(bp).add(new V(.11,0,0));
    const pt=add(new THREE.PlaneGeometry(.12,.14),patchM);pt.position.copy(at(a,el,.18)).add(new V(.098,.02,0));pt.rotation.y=Math.PI/2}
   g.children.forEach(o=>{o.castShadow=true})};
 // ---- تفنگ تک‌تیر پیچ‌خور (چوب، فولاد، دوربین، بند چرمی) ----
 const RG=new THREE.Group();RG.rotation.order='YZX';G.add(RG);
 const rb=(g,m,x,y,z)=>B(g,m,x,y,z,RG),cy=(r,l,m,x,y,z)=>{const e=rb(Cy(r,r,l,14),m,x,y,z);e.rotation.z=Math.PI/2;return e};
 rb(Bx(.035,.2,.09),Mt,-.6,-.02,0);rb(Bx(.42,.12,.07),Wd,-.38,-.03,0);rb(Bx(.3,.05,.075),Wd,-.42,.045,0);rb(Bx(.2,.1,.065),Wd,-.14,-.06,0);
 rb(Tr(.05,.008,14,Math.PI),Mt,-.1,-.12,0).rotation.z=Math.PI;rb(Bx(.34,.075,.07),Mt,-.02,.045,0);rb(Bx(.52,.085,.065),Wd,.34,-.005,0);
 cy(.026,.9,Mt,.55,.01,0);cy(.034,.05,Mt,1.03,.01,0);rb(Bx(.02,.04,.02),Mt,.98,.045,0);[.2,.5].forEach(x=>rb(Tr(.04,.008,14),Mt,x,.005,0).rotation.y=Math.PI/2);
 cy(.04,.42,Mt,.05,.16,0);cy(.058,.1,Mt,.3,.16,0).scale.set(1,1,1);cy(.05,.06,Mt,-.17,.16,0);
 [-.02,.14].forEach(x=>rb(Bx(.04,.07,.05),Mt,x,.105,0));cy(.02,.05,Mt,.08,.21,0).rotation.set(0,0,0);cy(.02,.05,Mt,.08,.16,.048).rotation.set(Math.PI/2,0,0);
 const glint=new THREE.Mesh(new THREE.SphereGeometry(.09,12,8),new THREE.MeshBasicMaterial({color:0xfff6dc,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));glint.position.set(.36,.16,0);RG.add(glint);
 const BH=new THREE.Group();RG.add(BH);B(Cy(.012,.012,.12),Mt,0,0,.06,BH).rotation.x=Math.PI/2;B(new THREE.SphereGeometry(.028,10,8),Mt,0,0,.125,BH);B(Cy(.02,.02,.16),Mt,0,0,0,BH).rotation.z=Math.PI/2;
 GX.strand(RG,Lt,[[-.5,-.05,.05],[-.3,-.3,.06],[.1,-.42,.06],[.5,-.3,.06],[.6,-.03,.05]],.016,.016,16);
 const muzzle=new THREE.Object3D();muzzle.position.set(1.07,.01,0);RG.add(muzzle);
  // جزئیات تفنگ: روکش دستگیره، خشاب، بندهای لوله، عدسی‌های دوربین، دهانه‌گیر، سگک‌های بند چرمی
  rb(Bx(.46,.02,.068),Wd,.3,.052,0);rb(Bx(.09,.13,.062),Mt,-.02,-.1,0);rb(Bx(.07,.02,.05),Mt,-.02,-.17,0);
  [.74,.95].forEach(x=>rb(Tr(.036,.007,14),Mt,x,.01,0).rotation.y=Math.PI/2);[1.03,1.06,1.09].forEach(x=>rb(Tr(.036,.006,12),Mt,x,.01,0).rotation.y=Math.PI/2);
  rb(Tr(.03,.007,10),Mt,-.5,-.04,.04).rotation.x=Math.PI/2;rb(Tr(.03,.007,10),Mt,.5,-.04,.04).rotation.x=Math.PI/2;
  {const l1=rb(new THREE.CircleGeometry(.052,20),Gl,.352,.16,0);l1.rotation.y=Math.PI/2;const l2=rb(new THREE.CircleGeometry(.046,20),Gl,-.201,.16,0);l2.rotation.y=-Math.PI/2}
  rb(Bx(.05,.04,.014),Au,-.3,-.3,.065);rb(Bx(.05,.04,.014),Au,.1,-.42,.065);rb(Bx(.06,.035,.014),Mt,-.5,-.05,.06);
 const pose=(k,kick,l,sl,bw)=>{
  RG.position.set(-.2*k,Y+1.36+.42*k,.44+.26*k-kick*.12*k);
  RG.rotation.set(0,-Math.PI/2*k,-.6*(1-k)-.03*k+kick*.09*k);
  BH.rotation.x=.55-l*1.9;BH.position.set(-.05-sl*.11,.06,0);RG.updateMatrix();
  const knob=new V(BH.position.x,BH.position.y-.125*Math.sin(BH.rotation.x),BH.position.z+.125*Math.cos(BH.rotation.x)),
   rh=new V(-.24,-.05,0).lerp(knob,bw).applyMatrix4(RG.matrix),lh=new V(.2,-.02,0).applyMatrix4(RG.matrix);
  arm(0,rh);arm(1,lh)};
 pose(0,0,0,0,0);
 // ---- شنل پرچم‌مانند با لنگر طلایی و آستر سرخ ----
  const cg=new THREE.PlaneGeometry(.98,1.12,10,14);cg.translate(0,-.56,0);const cb=Float32Array.from(cg.attributes.position.array),CP=new THREE.Group();CP.position.set(0,Y+1.8,-.36);G.add(CP);
  CP.add(new THREE.Mesh(cg,M(0xffffff,{map:GX.alCape(),roughness:.78,bumpMap:GX.weave(),bumpScale:1.2,side:THREE.FrontSide,alphaTest:.5})),new THREE.Mesh(cg,M(0xffffff,{map:GX.alLin(),roughness:.85,bumpMap:GX.weave(),bumpScale:1,side:THREE.BackSide,alphaTest:.5})));
  [-1,1].forEach(s=>B(new THREE.SphereGeometry(.04,10,8),Au,s*.3,Y+1.78,-.3));B(Tr(.3,.008,20,Math.PI),Au,0,Y+1.78,-.3).rotation.z=Math.PI;
 const cape=t=>{const p=cg.attributes.position;for(let i=0;i<p.count;i++){const x=cb[i*3],y=cb[i*3+1],k=-y/1.12;p.setZ(i,.07*(x/.49)*(x/.49)*(1-k*.4)-.1*k*k+.035*Math.sin(y*7+t*2.2+x*3)*k)}p.needsUpdate=true;cg.computeVertexNormals()};cape(0);
 // ---- سر، چشم سرخ، موی بلند موج‌دار ----
  (()=>{const o={skin:0xf2bd9f,hi:'#f8cdb2',ex:58,i1:'#ff8a8a',i2:'#e0152b',i3:'#5a0814',lash:'#2a040c',brow:'#6a0e1c'},p=new V(0,Y+2,0),
   h=new THREE.Mesh(new THREE.SphereGeometry(.27,36,28),M(GX.c(o.skin),{roughness:.6}));h.position.copy(p);G.add(h);
   const f=new THREE.Mesh(new THREE.SphereGeometry(.27*1.004,32,24,Math.PI/2-.5,1,1.07,1),M(0xffffff,{map:GX.faceAl(o),roughness:.65,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));f.position.copy(p);G.add(f);
   [-1,1].forEach(s=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.05,10,8).scale(.5,1,.8),h.material);e.position.set(s*.27*.97,Y+1.98,0);G.add(e)})})();
  B(S(.3,1,.82,1),Hr,0,Y+2.07,-.05);B(S(.28,1,.7,.9),Hr2,0,Y+2.0,-.1);B(S(.16,1.5,.6,.6),Hr,0,Y+2.18,.2);[-1,1].forEach(s=>B(S(.12,.6,1.2,.5),Hr,s*.17,Y+2.02,.22).rotation.z=s*.35);
  [[-.17,.26],[-.1,.3],[-.04,.22],[.03,.28],[.1,.24],[.17,.27],[.22,.2]].forEach((q,i)=>GX.strand(G,i%2?Hr:Hr3,[[q[0]*.7,Y+2.27,.1],[q[0]*1.05,Y+2.22,.22],[q[0]*1.25+(i%2?.02:-.02),Y+2.14,.272],[q[0]*1.3+(i%2?.04:-.03),Y+2.12-q[1]*.28,.262]],.045,.01,12));
 const HP=new THREE.Group();HP.position.set(0,Y+1.95,-.1);G.add(HP);
  const hs=(a,ph,len,m,r0,r1)=>{const pts=[];for(let j=0;j<=9;j++){const t=j/9;pts.push([a*(.1+.42*t)+Math.sin(t*7+ph)*.07*t+Math.sin(t*15+ph*2)*.015*t,-t*len,-(.18+t*.17)-.035*Math.sin(t*4.5+ph)])}GX.strand(HP,m,pts,r0,r1,20)};
  for(let i=0;i<26;i++)hs((i-12.5)/12.5,i*1.3,1.3+.25*Math.sin(i*2.1)+.1*Math.cos(i*.9),i%3===0?Hr3:i%3===1?Hr:Hr2,.085-.015*(i%2),.018);
  for(let i=0;i<10;i++)hs((i-4.5)/4.5*1.15,i*2.7+1,.9+.3*Math.sin(i*3),Hr3,.02,.006);
  [-1,1].forEach(s=>{GX.strand(G,Hr,[[s*.25,Y+2.04,.06],[s*.31,Y+1.8,.14],[s*.34,Y+1.5,.15],[s*.31,Y+1.2,.1]],.075,.025,14);GX.strand(G,Hr3,[[s*.22,Y+2.05,.1],[s*.3,Y+1.85,.17],[s*.36,Y+1.55,.16],[s*.34,Y+1.25,.1]],.04,.012,14)});
  // ---- کلاه افسری سفید: گنبد شیب‌دار، نوار مشکی با لبهٔ طلایی، لبهٔ براق، ستارهٔ طلایی و حلقهٔ برگ ----
  B(Ld([[0,0],[.3,0],[.34,.05],[.37,.12],[.35,.17],[.27,.2],[0,.215]],48),Wj,0,Y+2.25,-.03);
  B(Ld([[.298,0],[.318,0],[.318,.075],[.298,.075]],48),Bk,0,Y+2.25,-.03);[0,.075].forEach(y=>B(Tr(.31,.007,48),Au,0,Y+2.25+y,-.03).rotation.x=Math.PI/2);
  B(Tr(.366,.01,48),Au,0,Y+2.37,-.03).rotation.x=Math.PI/2;
  const vz=B(new THREE.CylinderGeometry(.29,.29,.03,32,1,false,-Math.PI*.42,Math.PI*.84),Vs,0,Y+2.26,.1);vz.rotation.x=.18;
  B(new THREE.CylinderGeometry(.296,.296,.014,32,1,false,-Math.PI*.42,Math.PI*.84),Au,0,Y+2.275,.1).rotation.x=.18;
  for(let i=0;i<9;i++){const an=-.38*Math.PI+i*(.76*Math.PI/8);B(S(.014,1.3,.6,1.6),Au,Math.sin(an)*.272,.024,Math.cos(an)*.272,vz)}
  const stR=(n,ro,ri)=>{const sh=new THREE.Shape();for(let i=0;i<n*2;i++){const r=i%2?ri:ro,an=i/(n*2)*Math.PI*2+Math.PI/2,px=Math.cos(an)*r,py=Math.sin(an)*r;if(i)sh.lineTo(px,py);else sh.moveTo(px,py)}sh.closePath();return new THREE.ExtrudeGeometry(sh,{depth:.012,bevelEnabled:false})};
  B(stR(8,.088,.052),Au,0,Y+2.31,.352).rotation.x=-.12;
  B(new THREE.CircleGeometry(.05,24),M(0xffffff,{map:GX.anchor('#17171c','#e3b84a'),roughness:.4,metalness:.5}),0,Y+2.31,.366).rotation.x=-.12;
  for(let i=0;i<10;i++){const an=Math.PI*.15+i*(Math.PI*.7/9);[-1,1].forEach(s=>B(S(.011,1,2,.6),Au,s*Math.sin(an)*.085,Y+2.31-Math.cos(an)*.085,.352).rotation.z=-s*(Math.PI/2-an))}
  [-1,1].forEach(s=>B(new THREE.SphereGeometry(.026,10,8),Au,s*.31,Y+2.28,.08));
 // ---- انیمیشن: بیکار، شلیک (شانه‌گیری، لگد، کشیدن گلنگدن، پرتاب پوکه) ----
 const PR={n:{ta:.3,fT:.34,bs:.5,bd:.6,rs:1.2,rd:.4},a:{ta:.5,fT:.8,bs:.96,bd:.75,rs:1.95,rd:.45}},ST={t0:-1e9,p:PR.n,ab:false,ej:0,on:false};
 const eject=()=>{try{BH.updateWorldMatrix(true,false);const w=new V();BH.getWorldPosition(w);burst(w,1,0xe8b84a,{sp:1.3,size:.09,life:.7,g:7,vy:1.6,y:0,r:.02,h:.02})}catch(e){}};
 GX.anim(G,t=>{const n=performance.now(),e=(n-ST.t0)/1000,p=ST.p,act=e>=0&&e<p.rs+p.rd+.05;let k=0,kick=0;
  if(act){let l=0,sl=0,bw=0;k=e<p.ta?ez(e/p.ta):e<p.rs?1:1-ez((e-p.rs)/p.rd);
   kick=e>p.fT?Math.exp(-(e-p.fT)*8)*ez((e-p.fT)/.04):0;
   const u=(e-p.bs)/p.bd;
   if(u>=0&&u<=1){l=u<.2?ez(u/.2):u<.7?1:1-ez((u-.7)/.2);sl=u<.2?0:u<.45?ez((u-.2)/.25):u<.7?1-ez((u-.45)/.25):0;bw=ez(u/.08)*(1-ez((u-.88)/.12));if(!ST.ej&&u>.3){ST.ej=1;eject()}}
   pose(k,kick,l,sl,bw);ST.on=true;
   glint.material.opacity=ST.ab?(e<p.fT?ez((e-.2)/(p.fT-.2))*.9:Math.max(0,1-(e-p.fT)*5)*.9):0}
  else if(ST.on){pose(0,0,0,0,0);ST.on=false;glint.material.opacity=0}
  G.rotation.x=-kick*.045;G.position.y=.01*Math.sin(t*2);
  HP.rotation.x=.04*Math.sin(t*1.6)+kick*.12;HP.rotation.z=.05*Math.sin(t*1.1+1);CP.rotation.x=.03*Math.sin(t*1.4)+kick*.08;cape(t)});
 G.userData.ali={fire:ab=>{ST.t0=performance.now();ST.ab=!!ab;ST.p=ab?PR.a:PR.n;ST.ej=0},delay:ab=>(ab?PR.a:PR.n).fT*1000,muzzle};
 return G}
GX.reg('ali',gxAlice4,gxAlice3);



/* ---------- کریمسون · جنگسالار زره‌سرخ (بازطراحی مطابق تصویر مرجع: زره قرمز با لبهٔ طلایی، یقهٔ خزِ پرزرق‌وبرق، شنل پاره‌پوره، شمشیر بزرگ ایستاده) ---------- */
GX.faceCr=o=>GX.tex(256,256,(x,w,h)=>{
 const S='#'+new THREE.Color(o.skin).getHexString(),g=x.createRadialGradient(w/2,h*.55,8,w/2,h*.5,w*.6);
 g.addColorStop(0,o.hi);g.addColorStop(.7,S);g.addColorStop(1,S);x.fillStyle=g;x.fillRect(0,0,w,h);x.lineCap='round';x.lineJoin='round';
 // گونه‌های سایه‌دار و استخوان‌بندی قوی
 [.12,.88].forEach(a=>{const r=x.createRadialGradient(a*w,h*.62,2,a*w,h*.62,52);r.addColorStop(0,'rgba(60,30,20,.34)');r.addColorStop(1,'rgba(60,30,20,0)');x.fillStyle=r;x.fillRect(a*w-54,h*.62-54,108,108)});
 // چین‌های اخم میان ابرو و پیشانی
 x.strokeStyle='rgba(70,35,25,.45)';x.lineWidth=3;
 [-1,1].forEach(s=>{x.beginPath();x.moveTo(w/2+s*7,h*.3);x.quadraticCurveTo(w/2+s*10,h*.38,w/2+s*6,h*.45);x.stroke()});
 x.lineWidth=2;x.strokeStyle='rgba(70,35,25,.28)';[.17,.22].forEach(y=>{x.beginPath();x.moveTo(w*.3,h*y);x.quadraticCurveTo(w/2,h*(y-.02),w*.7,h*y);x.stroke()});
 [-1,1].forEach(s=>{x.save();x.translate(w/2+s*o.ex,h*.5);x.scale(s,1);
  const eye=()=>{x.beginPath();x.moveTo(-23,4);x.bezierCurveTo(-12,-8,12,-10,25,0);x.bezierCurveTo(12,8,-10,10,-23,4);x.closePath()};
  eye();x.fillStyle='#e8dfd6';x.fill();x.save();eye();x.clip();
  const ir=x.createRadialGradient(1,0,1,1,0,11);ir.addColorStop(0,'#7a4e26');ir.addColorStop(.6,'#46280f');ir.addColorStop(1,'#1c0e06');x.fillStyle=ir;x.beginPath();x.arc(1,0,10.5,0,7);x.fill();
  x.fillStyle='#0b0705';x.beginPath();x.arc(1,0,4.6,0,7);x.fill();x.fillStyle='rgba(255,255,255,.8)';x.beginPath();x.arc(-3,-4,2.2,0,7);x.fill();
  // پلک بالایی سنگین (نگاه خشن)
  x.fillStyle='rgba(20,10,6,.65)';x.fillRect(-30,-16,60,16);
  x.restore();
  x.strokeStyle='#150b07';x.lineWidth=6;x.beginPath();x.moveTo(-24,4);x.bezierCurveTo(-12,-8,12,-10,26,0);x.stroke();
  x.strokeStyle='rgba(70,35,25,.5)';x.lineWidth=2;x.beginPath();x.moveTo(-18,10);x.bezierCurveTo(-6,14,8,13,20,6);x.stroke();
  // ابروی ضخیم و اخم‌کرده (سمت داخل پایین، بیرون بالا)
  x.strokeStyle='#150d09';x.lineWidth=15;x.beginPath();x.moveTo(-24,-14);x.quadraticCurveTo(4,-30,36,-36);x.stroke();
  x.lineWidth=8;x.beginPath();x.moveTo(-22,-18);x.quadraticCurveTo(6,-34,34,-40);x.stroke();x.restore()});
 // بینی و سوراخ‌ها
 x.strokeStyle='rgba(90,50,35,.45)';x.lineWidth=3;x.beginPath();x.moveTo(w/2-7,h*.56);x.lineTo(w/2-9,h*.69);x.moveTo(w/2+7,h*.56);x.lineTo(w/2+9,h*.69);x.stroke();
 x.fillStyle='rgba(50,22,16,.55)';[-1,1].forEach(s=>{x.beginPath();x.ellipse(w/2+s*7,h*.72,4,2.4,0,0,7);x.fill()});
 // خط اخم دو طرف دهان
 x.strokeStyle='rgba(70,35,25,.4)';x.lineWidth=3;[-1,1].forEach(s=>{x.beginPath();x.moveTo(w/2+s*20,h*.7);x.quadraticCurveTo(w/2+s*34,h*.78,w/2+s*32,h*.9);x.stroke()});
 // سبیل پرپشت
 x.fillStyle='#0a0a0c';x.beginPath();x.moveTo(w/2,h*.745);x.bezierCurveTo(w/2-16,h*.715,w/2-34,h*.76,w/2-44,h*.9);x.bezierCurveTo(w/2-30,h*.84,w/2-12,h*.82,w/2,h*.81);x.bezierCurveTo(w/2+12,h*.82,w/2+30,h*.84,w/2+44,h*.9);x.bezierCurveTo(w/2+34,h*.76,w/2+16,h*.715,w/2,h*.745);x.fill();
 // لب‌های درهم‌کشیده زیر سبیل
 x.strokeStyle='#2c1411';x.lineWidth=3.5;x.beginPath();x.moveTo(w/2-15,h*.87);x.quadraticCurveTo(w/2,h*.855,w/2+15,h*.87);x.stroke();
 // ریش زیر لب و چانه (متصل به سبیل)
 x.fillStyle='#0a0a0c';x.beginPath();x.moveTo(w/2-14,h*.88);x.bezierCurveTo(w/2-22,h*.9,w/2-28,h*.97,w/2-20,h);x.lineTo(w/2+20,h);x.bezierCurveTo(w/2+28,h*.97,w/2+22,h*.9,w/2+14,h*.88);x.closePath();x.fill();
 // سایهٔ ته‌ریش روی فک
 const st=x.createLinearGradient(0,h*.72,0,h);st.addColorStop(0,'rgba(10,10,12,0)');st.addColorStop(1,'rgba(10,10,12,.7)');x.fillStyle=st;x.fillRect(0,h*.72,w,h*.28);
 [.06,.94].forEach(a=>{const r=x.createLinearGradient(a*w-26,0,a*w+26,0);r.addColorStop(a<.5?0:1,'rgba(10,10,12,.8)');r.addColorStop(a<.5?1:0,'rgba(10,10,12,0)');x.fillStyle=r;x.fillRect(a*w-26,h*.5,52,h*.5)})},1);
// شنل: پارچهٔ قرمز کهنه با حاشیهٔ طلایی و لکه‌های فرسودگی
GX.capeTex=()=>GX._ct2||(GX._ct2=GX.tex(128,256,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#8e1424');g.addColorStop(.6,'#78101e');g.addColorStop(1,'#5a0a16');x.fillStyle=g;x.fillRect(0,0,w,h);
 for(let i=0;i<90;i++){x.strokeStyle=i%2?'rgba(40,0,6,.2)':'rgba(205,55,60,.16)';x.lineWidth=1+Math.random()*3;const X=Math.random()*w;x.beginPath();x.moveTo(X,0);x.bezierCurveTo(X+8,h*.3,X-8,h*.6,X+Math.random()*10-5,h);x.stroke()}
 for(let i=0;i<40;i++){x.fillStyle='rgba(30,0,6,.14)';x.beginPath();x.ellipse(Math.random()*w,Math.random()*h,6+Math.random()*14,10+Math.random()*24,0,0,7);x.fill()}
 x.fillStyle='#d3a43f';x.fillRect(0,0,7,h);x.fillRect(w-7,0,7,h);x.fillStyle='rgba(70,35,0,.55)';x.fillRect(7,0,2,h);x.fillRect(w-9,0,2,h);
 // زیگزاگ طلایی نزدیک شانه
 x.strokeStyle='#d3a43f';x.lineWidth=4;x.beginPath();x.moveTo(8,18);for(let i=0;i<8;i++)x.lineTo(8+(i+1)*14,i%2?18:34);x.stroke()},1));
// زره: فلز قرمز تیره با خراش و لکه
GX.armTex=()=>GX._at||(GX._at=GX.tex(128,128,(x,w,h)=>{const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'#a01b2a');g.addColorStop(.5,'#86131f');g.addColorStop(1,'#6c0b17');x.fillStyle=g;x.fillRect(0,0,w,h);
 for(let i=0;i<140;i++){x.fillStyle=i%3?'rgba(40,0,8,.1)':'rgba(230,80,80,.09)';x.beginPath();x.ellipse(Math.random()*w,Math.random()*h,2+Math.random()*9,1+Math.random()*5,Math.random()*3,0,7);x.fill()}
 for(let i=0;i<18;i++){x.strokeStyle='rgba(255,180,160,.2)';x.lineWidth=1;const X=Math.random()*w,Y=Math.random()*h;x.beginPath();x.moveTo(X,Y);x.lineTo(X+Math.random()*30-15,Y+Math.random()*30-15);x.stroke()}},1,[2,2]));
// لایهٔ زیرین: فلس‌های شش‌ضلعی قهوه‌ای تیره
GX.scaleTex=()=>GX._sc||(GX._sc=GX.tex(128,128,(x,w,h)=>{x.fillStyle='#1c0e09';x.fillRect(0,0,w,h);const r=16;
 for(let j=0;j<10;j++)for(let i=-1;i<9;i++){const cx=i*r*2+(j%2?r:0),cy=j*r*.88,gr=x.createRadialGradient(cx,cy-4,2,cx,cy,r);gr.addColorStop(0,'#6a4430');gr.addColorStop(.7,'#42281a');gr.addColorStop(1,'#241209');x.fillStyle=gr;x.beginPath();x.arc(cx,cy,r-1.2,0,7);x.fill()}},1,[3,3]));
GX.furTex=()=>GX._fu||(GX._fu=GX.tex(64,128,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#a89884');g.addColorStop(.5,'#d9cdbb');g.addColorStop(1,'#efe6d8');x.fillStyle=g;x.fillRect(0,0,w,h);
 for(let i=0;i<40;i++){x.strokeStyle=i%2?'rgba(90,75,60,.3)':'rgba(255,255,255,.35)';x.lineWidth=1;x.beginPath();x.moveTo(w/2,h);x.lineTo(Math.random()*w,Math.random()*h*.7);x.stroke()}},1));
function gxCrimson(M,team){
 const V=THREE.Vector3,G=new THREE.Group(),P=GX.pal(M),Y=.18,TAU=Math.PI*2,
  B=(g,m,x,y,z,Q)=>{const e=new THREE.Mesh(g,m);e.position.set(x||0,y||0,z||0);(Q||G).add(e);return e},
  S=(r,a,b,c)=>new THREE.SphereGeometry(r,18,12).scale(a,b,c),
  Cy=(r1,r2,l,s)=>new THREE.CylinderGeometry(r1,r2,l,s||14),Bx=(a,b,c)=>new THREE.BoxGeometry(a,b,c),
  Cn=(r,l,s)=>new THREE.ConeGeometry(r,l,s||5),Oc=(r,a,b,c)=>new THREE.OctahedronGeometry(r).scale(a,b,c),
  Tr=(r,t,s,arc)=>new THREE.TorusGeometry(r,t,8,s||24,arc),Ld=GX.lathe,
  Ao={roughness:.4,metalness:.35,clearcoat:.55,clearcoatRoughness:.32,side:THREE.DoubleSide},
  Ar=M(0xffffff,Object.assign({map:GX.armTex()},Ao)),Ar2=M(GX.c(0x5a0c16),Ao),
  Au=P.metal(0xe0ac42,{roughness:.28}),Sc=M(0xffffff,{map:GX.scaleTex(),roughness:.5,metalness:.3,side:THREE.DoubleSide}),Lt=P.leather(0x3b2218),Br=P.leather(0x4a2c1c),
  Fu=[0xe6dccd,0xd0c3b0,0xbfb09b].map(c=>P.cloth(c,{roughness:1,sheen:0})),
  Sk=P.skin(0xb98866),Hr=M(GX.c(0x14100d),{roughness:.55,metalness:.05,clearcoat:.3,clearcoatRoughness:.4}),
  Cl=P.cloth(0xffffff,{map:GX.capeTex(),roughness:.95}),Tb=P.cloth(0x86131f,{roughness:.9}),
  St=P.metal(0xcfd4da,{roughness:.24}),St2=P.metal(0x8f969f,{roughness:.3}),Tm=M(team.getHex?team.getHex():0xff3a2a,{roughness:.4,clearcoat:.5}),
  ez=x=>x<=0?0:x>=1?1:x*x*(3-2*x),rnd=i=>{const s=Math.sin(i*12.9898+4.1)*43758.5453;return s-Math.floor(s)},
  chz=(x,y)=>{const pr=[[.04,.26],[.16,.28],[.38,.33],[.52,.34],[.66,.28],[.72,.14]];let r=.3;for(let i=0;i<pr.length-1;i++)if(y>=pr[i][0]&&y<=pr[i+1][0]){const k=(y-pr[i][0])/(pr[i+1][0]-pr[i][0]);r=pr[i][1]+(pr[i+1][1]-pr[i][1])*k}const u=Math.min(.98,Math.abs(x)/(1.1*r));return .82*r*Math.sqrt(1-u*u)+.006};
 // ---- پاها: ران فلس‌دار، زانوبند ششگوش طلایی با نشان، ساق‌بند قرمز با حاشیهٔ طلایی، چکمهٔ سنگین ----
 const legs=[-1,1].map(s=>{const L=new THREE.Group();L.position.set(s*.2,Y+.95,0);G.add(L);
  GX.strand(L,Sc,[[0,.02,0],[0,-.25,.01],[0,-.5,0]],.15,.125,8);
  B(Ld([[.125,-.44],[.15,-.34],[.17,-.1],[.165,0]],26),Ar,0,0,0,L);B(Tr(.168,.012,24),Au,0,-.02,0,L).rotation.x=Math.PI/2;
  B(S(.125,1,.95,1.05),Ar2,0,-.52,.04,L);B(Tr(.12,.01,20),Au,0,-.52,.07,L).rotation.x=Math.PI/2;
  B(Ld([[.095,-.9],[.12,-.76],[.14,-.62],[.125,-.55]],24),Ar,0,0,0,L);
  B(Tr(.13,.01,20),Au,0,-.6,0,L).rotation.x=Math.PI/2;B(Tr(.108,.01,20),Au,0,-.88,0,L).rotation.x=Math.PI/2;
  B(S(.12,1,.55,1.6),Ar2,0,-.9,.07,L);B(Bx(.2,.06,.4),Sc,0,-.945,.06,L);
  // -- جزئیات پا: صفحات ران، زانوبند ششگوش با نشان لیلی، ساق‌بند با حاشیهٔ طلایی، چکمه --
  [0,1].forEach(i=>{B(S(.07,1,.9,.3),Ar2,s*.15,-.14-i*.12,.03,L).rotation.z=s*.12;B(Bx(.1,.012,.05),Au,s*.15,-.19-i*.12,.075,L)});
  B(Cy(.14,.14,.05,6),Ar,0,-.52,.115,L).rotation.x=Math.PI/2;
  B(Tr(.135,.012,6),Au,0,-.52,.142,L).rotation.z=Math.PI/6;
  B(Oc(.045,.8,1.5,.35),Au,0,-.51,.15,L);B(Oc(.03,.6,1.2,.3),Au,-.04,-.5,.147,L).rotation.z=.7;B(Oc(.03,.6,1.2,.3),Au,.04,-.5,.147,L).rotation.z=-.7;B(Oc(.025,1,.8,.3),Au,0,-.57,.147,L);
  for(let i=0;i<6;i++){const a=i/6*TAU+Math.PI/6;B(Oc(.014,1,1,1),Au,Math.cos(a)*.125,-.52+Math.sin(a)*.125,.145,L)}
  B(S(.075,1,2.2,.4),Ar2,0,-.74,.115,L);B(Bx(.016,.3,.01),Au,0,-.74,.155,L);
  [-1,1].forEach(q=>{B(Bx(.014,.3,.01),Au,q*.085,-.74,.1,L).rotation.z=-q*.05;[0,1].forEach(j=>B(Oc(.014,1,1,1),Au,q*.055,-.66-j*.16,.14,L))});
  B(Cy(.15,.13,.045,18),Ar2,0,-.59,0,L);B(Cy(.115,.11,.045,16),Au,0,-.86,0,L);
  B(S(.1,1,.6,1.2),Ar,0,-.93,.18,L);B(Bx(.14,.014,.03),Au,0,-.945,.3,L);B(Bx(.16,.05,.1),Lt,0,-.95,-.08,L);
  B(Cy(.115,.115,.025,16),Br,0,-.82,0,L);B(Bx(.04,.035,.01),Au,0,-.82,.116,L);B(Cn(.02,.06,4),Au,s*.1,-.93,.12,L);
  return L});
 // ---- بالاتنه ----
 const TG=new THREE.Group();TG.position.set(0,Y+.95,0);G.add(TG);
 B(S(.27,1.1,.6,.8),Sc,0,-.05,0,TG);
 B(Ld([[.26,.04],[.28,.16],[.33,.38],[.34,.52],[.28,.66],[.14,.72]],36),Ar,0,0,0,TG).scale.set(1.1,1,.82);
 const rg=B(Tr(.27,.014,32),Au,0,.05,0,TG);rg.rotation.x=Math.PI/2;rg.scale.set(1.1,.82,1);
 B(Ld([[.14,.7],[.16,.76],[.16,.86],[.15,.88]],24),Ar,0,0,0,TG);B(Tr(.158,.012,24),Au,0,.86,0,TG).rotation.x=Math.PI/2;
 B(Tr(.075,.012,28),Au,0,.44,.288,TG);B(Oc(.03,1,1.4,.5),Au,0,.44,.292,TG);
 // نشان سینه: حلقهٔ بیرونی با هشت تیغه، بال‌ها و پیکان مرکزی (مطابق تصویر مرجع)
 B(Tr(.108,.01,32),Au,0,.44,.287,TG);
 for(let i=0;i<8;i++){const a=i/8*TAU;B(Cn(.016,.05,4),Au,Math.sin(a)*.128,.44+Math.cos(a)*.128,.289,TG).rotation.z=-a}
 [-1,1].forEach(q=>B(Oc(.04,.5,1.3,.25),Au,q*.035,.445,.296,TG).rotation.z=-q*.5);
 B(Cn(.02,.1,4),Au,0,.38,.296,TG).rotation.z=Math.PI;B(Cn(.016,.07,4),Au,0,.5,.296,TG);
 // صفحات سینه و شکم با خطوط طلایی
 [-1,1].forEach(q=>{B(Bx(.014,.17,.012),Au,q*.17,.52,chz(q*.17,.52),TG).rotation.z=q*.55;[0,1].forEach(j=>B(Bx(.012,.14,.012),Au,q*.25,.3-j*.1,chz(q*.25,.3-j*.1),TG).rotation.z=q*.12)});
 for(let i=0;i<3;i++){const y=.12+i*.075;B(Bx(.3-i*.03,.02,.018),Au,0,y,chz(0,y),TG);B(Bx(.26-i*.03,.03,.012),Ar2,0,y-.03,chz(0,y-.03),TG)}
 // یقهٔ ایستادهٔ زره با لبهٔ طلایی
 for(let i=0;i<8;i++){const a=i/8*TAU;B(Bx(.05,.07,.012),Ar2,Math.sin(a)*.158,.82,Math.cos(a)*.158,TG).rotation.y=a}
 B(Tr(.162,.01,24),Au,0,.9,0,TG).rotation.x=Math.PI/2;
 // کمربند چرمی قهوه‌ای پهن با میخ و سگک گرد طلایی
 B(Ld([[.27,.0],[.278,.0],[.278,.14],[.27,.14]],32),Br,0,0,0,TG).scale.set(1.12,1,.88);
 B(Cy(.095,.095,.032,24),Au,0,.07,.268,TG).rotation.x=Math.PI/2;B(Cy(.068,.068,.036,24),Ar,0,.07,.274,TG).rotation.x=Math.PI/2;B(Oc(.04,1,1.4,.5),Au,0,.07,.296,TG);
 for(let i=0;i<7;i++){const a=(i-3)*.34;if(Math.abs(a)>.3)B(Oc(.018,1,1,.7),Au,Math.sin(a)*.31,.07,Math.cos(a)*.245,TG)}
 // میخ‌های کمربند، حلقهٔ سگک با تیغه، کیسه‌های چرمی کنار کمر
 for(let i=0;i<10;i++){const a=i/10*TAU;if(Math.cos(a)<.55)B(Oc(.016,1,1,.7),Au,Math.sin(a)*.312,.07,Math.cos(a)*.246,TG)}
 B(Tr(.082,.01,24),Au,0,.07,.291,TG);
 for(let i=0;i<6;i++){const a=i/6*TAU;B(Cn(.012,.04,4),Au,Math.sin(a)*.094,.07+Math.cos(a)*.094,.291,TG).rotation.z=-a}
 [-1,1].forEach(q=>{B(Bx(.09,.1,.06),Lt,q*.3,-.01,.09,TG).rotation.y=q*.8;B(Bx(.04,.03,.012),Au,q*.32,.03,.125,TG).rotation.y=q*.8});
 // پیش‌بند بلند قرمز با حاشیهٔ طلایی ضخیم و نوک تیز (تاب می‌خورد)
 const tsh=(w,l,pt)=>{const s=new THREE.Shape();s.moveTo(-w,0);s.lineTo(w,0);s.lineTo(w,-l);s.lineTo(0,-l-pt);s.lineTo(-w,-l);s.lineTo(-w,0);return new THREE.ShapeGeometry(s)};
 const TB=new THREE.Group();TB.position.set(0,.04,.285);TG.add(TB);
 B(tsh(.225,.5,.3),Au,0,0,-.004,TB);B(tsh(.185,.47,.255),Tb,0,-.012,.001,TB);B(Oc(.045,1,1.4,.4),Au,0,-.28,.012,TB);
 [-1,1].forEach(s=>B(Bx(.016,.42,.004),Au,s*.15,-.22,.003,TB));
 [-1,1].forEach(q=>{for(let i=0;i<3;i++)B(Cn(.02,.05,3),Au,q*.215,-.1-i*.12,.006,TB).rotation.z=-q*1.57;B(Bx(.1,.016,.004),Au,q*.045,-.34,.006,TB).rotation.z=q*.6});
 [-1,1].forEach(q=>B(Oc(.03,1,1.4,.6),Au,q*.3,-.06,.1,TG));
 [-1,1].forEach(s=>B(S(.12,1,1.6,.6),Ar,s*.3,-.06,.02,TG));
 // سردوشی‌های بزرگ با نوک‌های طلایی
 [-1,1].forEach(s=>{B(S(.2,1.1,.8,1),Ar,s*.56,.66,0,TG);B(Tr(.18,.014,26),Au,s*.56,.6,0,TG).rotation.x=Math.PI/2;B(S(.17,1,.5,.95),Ar2,s*.58,.57,0,TG);
  // سردوشی لایه‌لایه با حاشیهٔ طلایی و تیغه‌های بالایی
  for(let i=0;i<3;i++){B(new THREE.SphereGeometry(.2+i*.018,16,8,0,TAU,0,.9).scale(1.1,.9,.85),Ar,s*(.56+.012*i),.6-i*.075,0,TG);B(Tr(.19+i*.018,.01,26),Au,s*(.56+.012*i),.58-i*.075,0,TG).rotation.x=Math.PI/2}
  for(let i=0;i<3;i++){const a=(i-1)*.6;B(Cn(.025,.12,4),Au,s*(.58+Math.sin(a)*.2),.78+Math.cos(a)*.06,Math.cos(a)*.1,TG).rotation.z=-s*(.5+Math.abs(a)*.6)}});
 // ---- یقهٔ خز پرپشت: سه ردیف پرِ بزرگ روی گردن و شانه‌ها ----
const furs=[];
 // سه ردیف پرِ خز دور گردن و شانه؛ پشت گردن کوچک‌تر، جلوی گردن باز
 [[16,.2,.16,.84,.22,.075,.55,1.0],[20,.34,.23,.78,.27,.09,.55,1.25],[24,.5,.29,.7,.31,.1,.8,1.5]].forEach((R,ri)=>{const N=R[0];
  for(let i=0;i<N;i++){const a=(i+.5)/N*TAU-Math.PI;if(Math.abs(a)<R[6])continue;
   const bk=Math.max(0,-Math.cos(a)),sz=1-.58*Math.pow(bk,1.5),r1=.85+.3*rnd(i+ri*40),L1=R[4]*sz*r1;
   const fg=new THREE.SphereGeometry(1,8,6).scale(R[5]*sz,L1,.03+.01*ri).translate(0,L1*.85,0);
   const f=B(fg,Fu[(i+ri)%3],Math.sin(a)*R[1],R[3]-.03*bk,Math.cos(a)*R[2],TG);
   const tl=R[7]+.25*Math.abs(Math.sin(a))+.1*rnd(i*3+ri),rx=Math.cos(a)*tl,rz=-Math.sin(a)*tl;f.rotation.set(rx,0,rz);furs.push({m:f,rx,rz,i:i+ri*30})}});
 // ---- شنل پاره‌پوره با لبهٔ ژولیده ----
 const NU=46,NV=24,cp=new Float32Array((NU+1)*(NV+1)*3),cuv=new Float32Array((NU+1)*(NV+1)*2),ci=[],cu=[],cv=[];
 for(let i=0;i<=NU;i++){const u=i/NU*2-1,
   len=1-.3*Math.pow(Math.abs(Math.sin(u*9.1+1.7)*Math.sin(u*23.3+.4)),.9)-.14*rnd(i)-(i%2?.05:0)-(Math.sin(u*5.1)>.75?.1:0);
  for(let j=0;j<=NV;j++){const v=j/NV,th=u*(.95+.6*v),R=.48+.62*v,k=i*(NV+1)+j;
   cp[k*3]=R*Math.sin(th);cp[k*3+1]=.8-v*len*1.82;cp[k*3+2]=-R*Math.cos(th)*.92;cuv[k*2]=i/NU;cuv[k*2+1]=1-v;cu[k]=u;cv[k]=v;
   if(i<NU&&j<NV){const a=k,b=k+1,c=k+NV+1,d=c+1;ci.push(a,b,c,b,d,c)}}}
 const cg=new THREE.BufferGeometry();cg.setAttribute('position',new THREE.BufferAttribute(cp,3));cg.setAttribute('uv',new THREE.BufferAttribute(cuv,2));cg.setIndex(ci);cg.computeVertexNormals();
 const cape=B(cg,Cl,0,0,0,TG);cape.frustumCulled=false;const cb=new Float32Array(cp);
 // ---- سر و صورت ----
 const HD=new THREE.Group();HD.position.set(0,.8,0);TG.add(HD);B(Cy(.085,.1,.2,12),Sk,0,0,0,HD);
 const hr=.21,hy=.2,Ew=P.skin(0xece4da),Ir=M(GX.c(0x3b2314),{roughness:.25,clearcoat:.9}),Lp=P.skin(0x9a584a);
 B(S(hr,.95,1.1,1.0),Sk,0,hy,0,HD);B(S(.15,1,.8,1.0),Sk,0,hy-.115,.04,HD);
 B(S(.04,.8,1.7,1.2),Sk,0,hy-.035,hr*.93,HD);B(S(.03,1.2,.8,.9),Sk,0,hy-.08,hr+.015,HD);
 [-1,1].forEach(s=>{
  B(S(.032,1.3,.75,.5),Ew,s*.075,hy+.025,hr*.9,HD);B(S(.016,1,1,.5),Ir,s*.077,hy+.025,hr*.9+.014,HD);
  B(S(.06,1.2,.22,.5),Hr,s*.078,hy+.075,hr*.9,HD).rotation.z=s*.12;
  B(S(.035,.55,1,.8),Sk,s*hr*.97,hy,0,HD);B(S(.05,1,.7,.8),Sk,s*.095,hy-.075,hr*.82,HD);
  B(S(.045,1.5,.3,.55),Hr,s*.04,hy-.1,hr*.93,HD).rotation.z=-s*.25;B(S(.025,.5,1.8,.8),Hr,s*.2,hy-.06,.07,HD)});
 B(S(.045,1.4,.25,.5),Lp,0,hy-.125,hr*.9,HD);
 B(new THREE.SphereGeometry(hr*1.06,28,18,0,TAU,0,1.1).scale(.97,1.1,1.05),Hr,0,hy+.01,-.012,HD);
 B(S(.215,.95,.8,.9),Hr,0,hy-.03,-.07,HD);B(S(.13,1,.5,1.5),Hr,0,hy+.24,.03,HD).rotation.x=-.3;
 B(S(.13,1,.5,.7),Hr,0,hy-.17,hr*.55,HD);
 // ریش دور فک، سیل، بزی و موی عقب‌خوابیده
 for(let i=0;i<8;i++){const a=(i/7-.5)*2.5;B(S(.04,1.1,.7,.9),Hr,Math.sin(a)*.14,hy-.15-.03*Math.cos(a),.04+Math.cos(a)*.115,HD)}
 B(S(.04,1.8,.5,.7),Hr,0,hy-.215,.15,HD);B(S(.025,.9,.4,.6),Hr,0,hy-.155,.195,HD);
 [-1,1].forEach(q=>{B(S(.05,.6,.3,.5),Hr,q*.03,hy-.098,hr*.94,HD).rotation.z=-q*.3;B(S(.02,3,.5,.9),Hr,q*.19,hy-.05,.07,HD);B(S(.07,.8,.35,.7),Hr,q*.1,hy-.08,hr*.82,HD)});
 for(let i=0;i<6;i++){const x=(i-2.5)*.05;B(S(.05,.5,.4,2.4),Hr,x,hy+.215-Math.abs(x)*.5,-.02,HD).rotation.x=-.3}
 // ---- بازوها ----
 const mkArm=s=>{const A=new THREE.Group();A.position.set(s*.58,.62,0);TG.add(A);
  GX.strand(A,Sc,[[0,0,0],[0,-.2,0],[0,-.4,0]],.12,.105,8);
  B(Cy(.15,.13,.3,16),Ar,0,-.2,0,A);B(Tr(.145,.016,22),Au,0,-.08,0,A).rotation.x=Math.PI/2;B(Tr(.133,.014,22),Au,0,-.34,0,A).rotation.x=Math.PI/2;
  const E=new THREE.Group();E.position.set(0,-.4,0);A.add(E);B(S(.12,1,1,1),Ar2,0,0,0,E);B(Oc(.075,1,1.3,.5),Au,0,0,.1,E);
  GX.strand(E,Sc,[[0,0,0],[0,-.2,0],[0,-.42,0]],.1,.085,8);
  B(Cy(.12,.135,.34,16),Ar,0,-.24,0,E);B(Tr(.125,.014,22),Au,0,-.1,0,E).rotation.x=Math.PI/2;B(Tr(.135,.014,22),Au,0,-.38,0,E).rotation.x=Math.PI/2;B(Bx(.06,.26,.02),Au,0,-.24,.125,E);
  // دستکش مشت‌شده با بندهای انگشت
  B(S(.1,1,1.1,1),Ar,0,-.5,0,E);for(let i=0;i<4;i++)B(S(.032,1,1,1),Ar2,(i-1.5)*.042,-.555,.08,E);
  B(Tr(.1,.012,18),Au,0,-.44,0,E).rotation.x=Math.PI/2;
  // جزئیات بازو: حلقه‌ها و میخ‌ها، آرنج تیغ‌دار، ساعدبند، انگشت‌ها و شست
  B(Tr(.14,.012,22),Au,0,-.2,0,A).rotation.x=Math.PI/2;B(Tr(.138,.01,22),Au,0,-.27,0,A).rotation.x=Math.PI/2;
  for(let i=0;i<3;i++){const a=(i-1)*.6;B(Oc(.016,1,1,.8),Au,Math.sin(a)*.142,-.14,Math.cos(a)*.142,A)}
  B(Cn(.03,.12,5),Au,0,0,-.1,E).rotation.x=-Math.PI/2;[-1,1].forEach(q=>B(Cn(.022,.08,4),Au,q*.11,0,-.03,E).rotation.z=-q*1.4);
  [-1,1].forEach(q=>B(Bx(.012,.28,.012),Au,q*.09,-.24,.085,E));B(Cy(.14,.12,.04,16),Ar2,0,-.12,0,E);
  for(let i=0;i<4;i++)B(S(.026,1,.9,1),Ar,(i-1.5)*.042,-.585,.1,E);
  B(S(.032,1,1.3,1),Ar2,-s*.08,-.5,.07,E);B(Bx(.15,.03,.02),Au,0,-.495,.098,E);
  return{A,E}};
 const RA=mkArm(-1),LA=mkArm(1);
 // ---- شمشیر بزرگ: تیغهٔ پهن با شیار مرکزی، گارد بالدار طلایی ----
 const sw=new THREE.Group();sw.position.set(0,-.5,0);RA.E.add(sw);
 B(Cy(.03,.03,.3,10),Lt,0,.02,0,sw);for(let i=0;i<4;i++)B(Tr(.032,.006,10),Au,0,-.06+i*.07,0,sw).rotation.x=Math.PI/2;
 B(S(.05,1,1,1),Au,0,.2,0,sw);B(S(.028,1,1,1),Tm,0,.2,.045,sw);
 B(Bx(.62,.055,.07),Au,0,-.15,0,sw);[-1,1].forEach(s=>{B(Bx(.14,.055,.07),Au,s*.34,-.12,0,sw).rotation.z=s*.5;B(Cn(.034,.13,4),Au,s*.42,-.05,0,sw).rotation.z=-s*.6;B(Cn(.03,.1,4),Au,s*.28,-.2,0,sw).rotation.z=Math.PI+s*.3});B(Oc(.05,1,1.4,.7),Au,0,-.15,.045,sw);
 const bs=new THREE.Shape();bs.moveTo(-.115,-.19);bs.lineTo(.115,-.19);bs.lineTo(.125,-.95);bs.lineTo(0,-1.28);bs.lineTo(-.125,-.95);bs.lineTo(-.115,-.19);
 const bgm=new THREE.ExtrudeGeometry(bs,{depth:.04,bevelEnabled:false});bgm.translate(0,0,-.02);B(bgm,St,0,0,0,sw);
 B(Bx(.05,.78,.052),St2,0,-.6,0,sw);B(Bx(.014,.8,.056),Au,-.045,-.6,0,sw);B(Bx(.014,.8,.056),Au,.045,-.6,0,sw);
 B(Cn(.06,.26,4),Au,0,-.33,.026,sw).rotation.z=Math.PI;B(Cn(.06,.26,4),Au,0,-.33,-.026,sw).rotation.z=Math.PI;
 // جزئیات شمشیر: لبه‌های طلایی، ترک روی تیغه، سرِ دسته، نشان‌های شیار و میخ‌های گارد
 [-1,1].forEach(q=>B(Bx(.01,.8,.05),Au,q*.122,-.6,0,sw));
 for(let i=0;i<3;i++)B(Bx(.008,.16,.045),St2,-.05+i*.04,-.45-i*.22,0,sw).rotation.z=.3-i*.25;
 B(Oc(.04,1,1.2,1),Au,0,.27,0,sw);B(Cn(.025,.07,5),Au,0,.31,0,sw);
 for(let i=0;i<3;i++)B(Oc(.012,1,1.8,.6),Au,0,-.45-i*.18,.03,sw);
 [-1,1].forEach(s=>[0,1].forEach(j=>B(Oc(.014,1,1,1),Au,s*(.14+.12*j),-.15,.04,sw)));
 const tip=new THREE.Object3D();tip.position.set(0,-1.24,0);sw.add(tip);
 // ردّ برش (هلال نورانی) در صفحهٔ چرخش شمشیر (جلو-بالا)
 const trG=(()=>{const N=22,pos=[],idx=[],p0=[-.7,1.05],p1=[.2,1.15],p2=[1.2,-.5];for(let i=0;i<=N;i++){const s=i/N,x=(1-s)*(1-s)*p0[0]+2*(1-s)*s*p1[0]+s*s*p2[0],y=(1-s)*(1-s)*p0[1]+2*(1-s)*s*p1[1]+s*s*p2[1],
  tx=2*(1-s)*(p1[0]-p0[0])+2*s*(p2[0]-p1[0]),ty=2*(1-s)*(p1[1]-p0[1])+2*s*(p2[1]-p1[1]),l=Math.hypot(tx,ty)||1,nx=-ty/l,ny=tx/l,w=.24*Math.pow(Math.sin(Math.PI*s),.7);
  pos.push(x+nx*w,y+ny*w,0,x-nx*w,y-ny*w,0);if(i<N)idx.push(2*i,2*i+1,2*i+2,2*i+1,2*i+3,2*i+2)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);return g})();
 const trM=new THREE.MeshBasicMaterial({color:0xffd6a0,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
 const tr=new THREE.Mesh(trG,trM);tr.position.set(-.58,.62,0);tr.rotation.y=-Math.PI/2;tr.visible=false;TG.add(tr);tr.raycast=()=>{};Object.defineProperty(tr,'castShadow',{get:()=>false,set:()=>{}});
 // ---- انیمیشن ----
 // ژست‌ها: [شانه x, شانه z, آرنج, شیب تیغه (مطلق), چرخش تنه, خم تنه, پیشروی, پای راست, پای چپ, بازوی چپ, سر]
 const PO={idle:[-.45,-.12,-1.3,0,0,0,0,0,0,.08,0],
  w1:[-2.5,-.5,-1,-3.45,-.55,-.12,-.08,.18,-.12,.5,-.1],s1:[-1.5,.45,-.35,-1.05,.5,.2,.36,-.45,.22,-.5,.15],
  w2:[-2.7,-.6,-1.1,-3.7,-.7,-.2,-.15,.25,-.18,.7,-.15],s2:[-1.6,.6,-.2,-.7,.65,.3,.55,-.55,.3,-.7,.2],
  r1:[-2.9,-.25,-.7,-3.1,0,-.14,0,0,0,.4,-.12],r2:[-.9,-.1,-.5,0,.1,.22,.2,-.2,.1,0,.1]};
 const mix=(a,b,k)=>a.map((v,i)=>v+(b[i]-v)*k);
 const ST={t0:-1e9,kind:0,hy:0},SW={x:0,vx:0,z:0,vz:0,px:0,py:0,pz:0,lt:-1,ok:0,gu:0,gv:0},cl=(v,a)=>v<-a?-a:v>a?a:v;
 const TIM={1:{wu:.24,st:.15,ho:.12,rc:.45},2:{wu:.38,st:.17,ho:.2,rc:.55}};
 const pose=e=>{const k=ST.kind;if(!k)return PO.idle;
  if(k===3){const a=ez(e/.55),p=ez((e-1)/.15),r=ez((e-1.2)/.7);let q=mix(PO.idle,PO.r1,a);q=mix(q,PO.r2,p);q=mix(q,PO.idle,r);
   if(e>.55&&e<1)q=q.map((v,i)=>i===0||i===3?v+.04*Math.sin(e*60):v);return q}
  const T=TIM[k],W=k===2?PO.w2:PO.w1,S2=k===2?PO.s2:PO.s1,a=ez(e/T.wu),b=ez((e-T.wu)/T.st),c=ez((e-T.wu-T.st-T.ho)/T.rc);
  return mix(mix(mix(PO.idle,W,a),S2,b),PO.idle,c)};
 const furU=t=>{furs.forEach(f=>{f.m.rotation.x=f.rx+.04*Math.sin(t*1.4+f.i*.9)+SW.z*.25;f.m.rotation.z=f.rz+.03*Math.sin(t*1.9+f.i*1.7)+SW.x*.3})};
 GX.anim(G,t=>{const n=performance.now(),e=(n-ST.t0)/1000,dt=SW.lt<0?.016:Math.min(.05,Math.max(.001,t-SW.lt));SW.lt=t;
  const dur=ST.kind===3?1.9:ST.kind?(TIM[ST.kind].wu+TIM[ST.kind].st+TIM[ST.kind].ho+TIM[ST.kind].rc):0;if(ST.kind&&e>dur)ST.kind=0;
  const p=pose(e),br=Math.sin(t*1.5),el=G.matrixWorld.elements;
  // سرعت واحد در فضای محلی (شنل و پیش‌بند عقب می‌مانند)
  let lx=0,lz=0;if(SW.ok){const vx=(el[12]-SW.px)/dt,vy=(el[13]-SW.py)/dt,vz=(el[14]-SW.pz)/dt,ax=el[0]*el[0]+el[1]*el[1]+el[2]*el[2]||1,az=el[8]*el[8]+el[9]*el[9]+el[10]*el[10]||1;lx=(vx*el[0]+vy*el[1]+vz*el[2])/ax;lz=(vx*el[8]+vy*el[9]+vz*el[10])/az}
  SW.px=el[12];SW.py=el[13];SW.pz=el[14];SW.ok=1;
  // شنل از حرکت تنه و شمشیر هم تأثیر می‌گیرد (ضربه → شنل به عقب پرتاب می‌شود و برمی‌گردد)
  const tx=cl(-lx*.1-p[4]*.22,.45),tz=cl(-lz*.1-Math.max(0,p[6])*.9+(ST.kind&&ST.kind!==3?-.08:0),.55);
  SW.vx+=((tx-SW.x)*45-SW.vx*4.2)*dt;SW.x+=SW.vx*dt;SW.vz+=((tz-SW.z)*45-SW.vz*4.2)*dt;SW.z+=SW.vz*dt;
  G.position.z=p[6];G.position.y=.01*Math.sin(t*2)-.05*Math.max(0,p[6]);
  legs[0].rotation.x=p[7];legs[1].rotation.x=p[8];
  TG.rotation.set(p[5]+.008*br,p[4],.01*Math.sin(t*.6));TG.scale.y=1+.006*br;
  HD.rotation.set(p[10]+.02*Math.sin(t*.5),-p[4]*.6+.07*Math.sin(t*.37),.02*Math.sin(t*.43+2));
  RA.A.rotation.set(p[0]+.015*Math.sin(t*.9),0,p[1]);RA.E.rotation.set(p[2],0,0);sw.rotation.x=p[3]-(p[0]+p[2]);
  LA.A.rotation.set(p[9]+.02*Math.sin(t*1.1),0,.12+.02*Math.sin(t*.9+1));LA.E.rotation.set(-.3-.1*Math.max(0,-p[9]),0,0);
  TB.rotation.x=-(.04+.03*Math.sin(t*1.3))+SW.z*.5-Math.max(0,p[6])*.2;TB.rotation.z=SW.x*.35;
  // برش: هلال نورانی + درخشش تیغه
  const T=TIM[ST.kind]||TIM[1];let glow=0;
  if(ST.kind&&ST.kind!==3){const k=(e-T.wu)/(T.st+.14);if(k>0&&k<1){tr.visible=true;trM.opacity=Math.pow(Math.sin(k*Math.PI),.6)*(ST.kind===2?.95:.8);tr.scale.setScalar((ST.kind===2?1.2:1)*(.85+.25*k));glow=Math.sin(k*Math.PI)}else{tr.visible=false;trM.opacity=0}}
  else if(ST.kind===3){const k=ez((e-.55)/.2)*(1-ez((e-1.1)/.5));glow=k;tr.visible=false;trM.opacity=0}
  else if(tr.visible){tr.visible=false;trM.opacity=0}
  if(St.emissive)St.emissive.setRGB(glow*.9,glow*.35,glow*.2);
  furU(t);
  // شنل: موج‌های متحرک + تکان ملایم لبهٔ پاره + واکنش به حرکت
  const a=cg.attributes.position.array,n3=cu.length,wg=.5+.5*Math.sin(t*.7);
  for(let k=0;k<n3;k++){const v=cv[k],d=Math.pow(v,1.25),sa=Math.sin(t*1.7+v*3.4+cu[k]*2.6),sb=Math.sin(t*3.1+v*6+cu[k]*5.5),sc=Math.sin(t*5.3+cu[k]*13+v*9);
   a[k*3]=cb[k*3]*(1+d*(.06+.03*wg)*sa)+d*(SW.x*.7+.035*sb+.015*sc*v);
   a[k*3+1]=cb[k*3+1]+d*(.03*sb+.012*sc*v)-d*Math.abs(SW.z)*.05;
   a[k*3+2]=cb[k*3+2]-d*(.07+.07*sa+.03*wg)+d*cl(SW.z,.55)*.9+.02*sc*v*v}
  cg.attributes.position.needsUpdate=true;cg.computeVertexNormals()});
 G.userData.cri={fire:ab=>{ST.t0=performance.now();ST.kind=ab?2:1;trM.color.setHex(ab?0xff5a3a:0xffd6a0);const T=TIM[ST.kind];return(T.wu+T.st*.85)*1000},rally:()=>{ST.t0=performance.now();ST.kind=3;trM.color.setHex(0xff5a3a);return 1100},tip};
 return G}
GX.reg('cri',gxCrimson);
function criFig(g){const i=g&&g.children[0];return i&&i.children.find(o=>o.userData&&o.userData.cri)}
function criFX(a,t,d,ab){
 const ga=unitG.get(a),gt=unitG.get(t),f=criFig(ga);if(!ga||!f)return;
 if(CX&&CX.a===a)CX.crDone=1;ab=!!ab;
 if(gt&&a!==t){const dx=gt.position.x-ga.position.x,dz=gt.position.z-ga.position.z;if(dx||dz){ga.userData.fy=Math.atan2(dx,dz);ga.userData.ft=ab?2.4:1.6}}
 const m=f.userData.cri,ms=m.fire(ab);SFX.crimson(1,ab);
 setTimeout(()=>{try{const p=gt?gt.position.clone().add(new THREE.Vector3(0,.95,0)):ga.position.clone().add(new THREE.Vector3(0,.95,-1.2)),q=gt?gt.position:ga.position;
  burst(p,ab?24:14,0xfff0c0,{sp:4.2,size:.14,life:.28,g:3,y:0,r:.1,h:.1});burst(p,ab?18:10,0xffa040,{sp:3.2,size:.2,life:.4,g:5,y:0,r:.12,h:.1});
  if(d>0){burst(p,ab?20:12,0xc0141f,{sp:2.6,size:.22,life:.55,g:6,y:0,r:.15,h:.12});ring(new THREE.Vector3(q.x,0,q.z),0xff4a3a,ab?2:1.2,.35,.15)}
  else{burst(p,8,0xffffff,{sp:4,size:.12,life:.25,g:3,y:0})}
  shk=Math.max(shk,ab?.7:.4)}catch(e){}},ms)}

/* ---------- دوژینا · شوالیهٔ زره سفید-طلایی با دو شمشیر بزرگ (مطابق تصویر مرجع) ---------- */
GX.faceDj=o=>GX.tex(256,256,(x,w,h)=>{
 const S='#'+new THREE.Color(o.skin).getHexString(),g=x.createRadialGradient(w/2,h*.55,8,w/2,h*.5,w*.6);
 g.addColorStop(0,o.hi);g.addColorStop(.75,S);g.addColorStop(1,S);x.fillStyle=g;x.fillRect(0,0,w,h);x.lineCap='round';x.lineJoin='round';
 [.16,.84].forEach(a=>{const r=x.createRadialGradient(a*w,h*.68,2,a*w,h*.68,34);r.addColorStop(0,'rgba(255,110,110,.35)');r.addColorStop(1,'rgba(255,110,110,0)');x.fillStyle=r;x.fillRect(a*w-36,h*.68-36,72,72)});
 [-1,1].forEach(s=>{x.save();x.translate(w/2+s*o.ex,h*.5);x.scale(s,1);
  const eye=()=>{x.beginPath();x.moveTo(-26,4);x.bezierCurveTo(-14,-16,14,-18,28,-2);x.bezierCurveTo(14,14,-12,16,-26,4);x.closePath()};
  eye();x.fillStyle='#f7f2f4';x.fill();x.save();eye();x.clip();
  const ir=x.createRadialGradient(2,3,2,2,3,22);ir.addColorStop(0,'#e0c8ff');ir.addColorStop(.45,'#8a58e0');ir.addColorStop(1,'#31195e');x.fillStyle=ir;x.beginPath();x.ellipse(2,2,15,19,0,0,7);x.fill();
  x.fillStyle='#120a26';x.beginPath();x.ellipse(2,3,6,10,0,0,7);x.fill();x.fillStyle='rgba(30,10,50,.45)';x.fillRect(-30,-22,60,16);
  x.fillStyle='#fff';x.beginPath();x.arc(-4,-5,5,0,7);x.fill();x.beginPath();x.arc(8,10,2.6,0,7);x.fill();x.restore();
  x.strokeStyle='#4a2a14';x.lineWidth=6;x.beginPath();x.moveTo(-27,4);x.bezierCurveTo(-14,-16,14,-18,29,-2);x.stroke();
  x.lineWidth=4;x.beginPath();x.moveTo(26,-4);x.lineTo(40,-10);x.stroke();
  // ابروی باریک و جدی
  x.strokeStyle='#a8742a';x.lineWidth=6;x.beginPath();x.moveTo(-24,-30);x.quadraticCurveTo(4,-44,34,-38);x.stroke();x.restore()});
 x.strokeStyle='rgba(150,80,60,.4)';x.lineWidth=3;x.beginPath();x.moveTo(w/2-2,h*.66);x.lineTo(w/2+3,h*.69);x.stroke();
 // لب‌های جمع‌شده و جدی
 x.fillStyle='#d8607a';x.beginPath();x.moveTo(w/2-17,h*.83);x.quadraticCurveTo(w/2,h*.81,w/2+17,h*.83);x.quadraticCurveTo(w/2,h*.87,w/2-17,h*.83);x.fill();
 x.strokeStyle='#9a3048';x.lineWidth=2.5;x.beginPath();x.moveTo(w/2-17,h*.83);x.quadraticCurveTo(w/2,h*.84,w/2+17,h*.83);x.stroke()},1);
GX.whTex=()=>GX._wh||(GX._wh=GX.tex(128,128,(x,w,h)=>{const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'#ffffff');g.addColorStop(.6,'#ece8f0');g.addColorStop(1,'#cfc9dc');x.fillStyle=g;x.fillRect(0,0,w,h);
 for(let i=0;i<170;i++){x.fillStyle=i%3?'rgba(210,160,60,.6)':'rgba(120,110,150,.18)';x.beginPath();x.ellipse(Math.random()*w,Math.random()*h,1+Math.random()*4,1+Math.random()*2,Math.random()*3,0,7);x.fill()}},1,[2,2]));
GX.capeNv=()=>GX._cn||(GX._cn=GX.tex(128,256,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#2c2f86');g.addColorStop(1,'#1c1f5e');x.fillStyle=g;x.fillRect(0,0,w,h);
 for(let i=0;i<50;i++){x.strokeStyle=i%2?'rgba(10,10,40,.22)':'rgba(120,130,230,.12)';x.lineWidth=1+Math.random()*3;const X=Math.random()*w;x.beginPath();x.moveTo(X,0);x.bezierCurveTo(X+8,h*.3,X-8,h*.6,X+Math.random()*8-4,h);x.stroke()}
 x.fillStyle='#d8a846';x.fillRect(0,0,9,h);x.fillRect(w-9,0,9,h);x.fillRect(0,h-16,w,16);x.fillStyle='rgba(60,30,0,.5)';x.fillRect(9,0,2,h);x.fillRect(w-11,0,2,h);x.fillRect(0,h-18,w,2);
 const cr=(X,Y,s)=>{x.fillStyle='#d8a846';x.fillRect(X-3*s,Y-14*s,6*s,28*s);x.fillRect(X-10*s,Y-7*s,20*s,6*s);x.beginPath();x.moveTo(X-3*s,Y-14*s);x.lineTo(X,Y-20*s);x.lineTo(X+3*s,Y-14*s);x.fill();x.beginPath();x.moveTo(X-3*s,Y+14*s);x.lineTo(X,Y+20*s);x.lineTo(X+3*s,Y+14*s);x.fill();
  x.beginPath();x.moveTo(X-10*s,Y-7*s);x.lineTo(X-15*s,Y-4*s);x.lineTo(X-10*s,Y-1*s);x.fill();x.beginPath();x.moveTo(X+10*s,Y-7*s);x.lineTo(X+15*s,Y-4*s);x.lineTo(X+10*s,Y-1*s);x.fill()};
 cr(w*.3,h*.32,1);cr(w*.7,h*.58,1.1);cr(w*.34,h*.82,.9)},1));
function gxDojina(M,team){
 const V=THREE.Vector3,G=new THREE.Group(),P=GX.pal(M),Y=.18,TAU=Math.PI*2,
  B=(g,m,x,y,z,Q)=>{const e=new THREE.Mesh(g,m);e.position.set(x||0,y||0,z||0);(Q||G).add(e);return e},
  S=(r,a,b,c)=>new THREE.SphereGeometry(r,18,12).scale(a,b,c),
  Cy=(r1,r2,l,s)=>new THREE.CylinderGeometry(r1,r2,l,s||14),Bx=(a,b,c)=>new THREE.BoxGeometry(a,b,c),
  Cn=(r,l,s)=>new THREE.ConeGeometry(r,l,s||5),Oc=(r,a,b,c)=>new THREE.OctahedronGeometry(r).scale(a,b,c),
  Tr=(r,t,s,arc)=>new THREE.TorusGeometry(r,t,8,s||24,arc),Ld=GX.lathe,
  Wh=M(0xffffff,{map:GX.whTex(),roughness:.32,metalness:.3,clearcoat:.65,clearcoatRoughness:.25,side:THREE.DoubleSide}),
  Au=P.metal(0xe3b04a,{roughness:.28}),Bk=P.cloth(0x1b1620,{roughness:.7}),Bl=P.leather(0x1d1a26),
  Sk=P.skin(0xe9ab88),Hr=M(GX.c(0xf2b24c),{roughness:.4,metalness:.08,clearcoat:.5,clearcoatRoughness:.3}),Hr2=M(GX.c(0xffd57e),{roughness:.4,metalness:.08,clearcoat:.4}),
  Gm=M(GX.c(0x3f86ff),{roughness:.1,metalness:.3,clearcoat:1,emissive:new THREE.Color(.05,.15,.4)}),
  Cl=P.cloth(0xffffff,{map:GX.capeNv(),roughness:.9}),
  St=P.metal(0xe9ecf4,{roughness:.2}),Nv=M(GX.c(0x1b1e50),{roughness:.25,metalness:.55,clearcoat:.8,side:THREE.DoubleSide}),
  ez=x=>x<=0?0:x>=1?1:x*x*(3-2*x);
 const cross=(Q,x,y,z,k)=>{k=k||1;B(Bx(.026*k,.1*k,.01),Au,x,y,z,Q);B(Bx(.07*k,.024*k,.01),Au,x,y+.02*k,z,Q)};
 // ---- پاها: ران، چکمهٔ بلند مشکی، زانوبند سفید-طلایی، ساق‌بند سفید، چکمهٔ پاشنه‌دار ----
 const legs=[-1,1].map(s=>{const L=new THREE.Group();L.position.set(s*.14,Y+.95,0);G.add(L);
  GX.strand(L,Sk,[[0,.02,0],[0,-.25,.01],[0,-.5,0]],.125,.1,8);
  B(Ld([[.112,-.6],[.126,-.5],[.14,-.36],[.136,-.27]],26),Bl,0,0,0,L);
  B(Tr(.142,.018,24),Wh,0,-.31,0,L).rotation.x=Math.PI/2;B(Tr(.146,.008,24),Au,0,-.29,0,L).rotation.x=Math.PI/2;B(Bx(.04,.05,.02),Au,0,-.31,.14,L);
  B(Oc(.15,1,1.25,.55),Au,0,-.5,.105,L);B(Oc(.135,1,1.2,.5),Wh,0,-.5,.12,L);B(Cn(.03,.12,4),Au,0,-.63,.14,L).rotation.x=Math.PI;
  B(Ld([[.108,-.93],[.135,-.8],[.15,-.66],[.13,-.58]],24),Wh,0,0,0,L);
  [-.6,-.9].forEach(y=>B(Tr(.145,.016,22),Au,0,y,0,L).rotation.x=Math.PI/2);B(Bx(.06,.28,.02),Au,0,-.76,.14,L);
  [-1,1].forEach(q=>B(Bx(.02,.26,.04),Au,q*.14,-.76,0,L));
  B(S(.125,1,.55,1.8),Wh,0,-.9,.07,L);B(Bx(.22,.05,.42),Wh,0,-.955,.06,L);B(Bx(.075,.14,.075),Wh,0,-.92,-.09,L);B(Bx(.2,.025,.1),Au,0,-.87,.2,L);
  // -- جزئیات پا: ژارتیر سفید، بند چکمه، زانوبند خاردار با جواهر، میخ و برجستگی ساق‌بند، نوک و پاشنهٔ طلایی --
  B(Cy(.15,.15,.05,18),Wh,0,-.4,0,L);B(Tr(.15,.008,20),Au,0,-.43,0,L).rotation.x=Math.PI/2;B(Oc(.02,1,1.3,.6),Gm,0,-.4,.152,L);
  for(let i=0;i<3;i++)B(Bx(.05,.01,.01),Au,0,-.34-i*.08,.138-i*.004,L);
  [-1,1].forEach(q=>{B(Cn(.02,.08,4),Au,q*.155,-.5,.105,L).rotation.z=-q*1.57;B(Oc(.012,1,1,1),Au,q*.05,-.6,.145,L);B(Bx(.014,.24,.012),Au,q*.08,-.76,.12,L);[0,1].forEach(j=>B(Oc(.012,1,1,1),Au,q*.05,-.7-j*.12,.136-j*.014,L))});
  B(Oc(.025,1,1.3,.7),Gm,0,-.5,.19,L);
  B(Bx(.075,.015,.075),Au,0,-.975,-.09,L);B(Cn(.03,.08,4),Au,0,-.955,.3,L).rotation.x=Math.PI/2;B(Bx(.05,.03,.012),Au,s*.11,-.9,.08,L);B(Cy(.012,.012,.04,6),Au,s*.11,-.9,.09,L);
  B(Tr(.15,.014,20),Au,0,-.84,0,L).rotation.x=Math.PI/2;[-1,1].forEach(q=>B(Cn(.025,.08,4),Au,q*.15,-.88,.02,L).rotation.z=-q*1.57);
  return L});
 // ---- بالاتنه ----
 const TG=new THREE.Group();TG.position.set(0,Y+.95,0);G.add(TG);
 B(Ld([[.19,-.05],[.19,.08],[.17,.2],[.2,.3],[.24,.4],[.22,.52],[.14,.66]],32),Bk,0,0,0,TG).scale.set(1,1,.82);
 // کرست مشکی با بند طلایی
 B(Ld([[.205,.06],[.19,.14],[.18,.24],[.2,.32]],30),Bl,0,0,0,TG).scale.set(1.04,1,.86);
 for(let i=0;i<5;i++)B(Bx(.1,.012,.012),Au,0,.1+i*.045,.17,TG);
 for(let i=0;i<5;i++)[-1,1].forEach(q=>B(Oc(.01,1,1,1),Au,q*.052,.1+i*.045,.168,TG));
 [-1,1].forEach(q=>{B(Bx(.012,.24,.012),Au,q*.13,.19,.122,TG);B(Bx(.012,.2,.012),Au,q*.17,.19,.08,TG)});
 // سینه‌بند سفید و برجسته با لبهٔ طلایی
 [-1,1].forEach(s=>{B(S(.15,1,.95,.95),Wh,s*.105,.44,.14,TG);const r=B(Tr(.15,.012,26),Au,s*.105,.41,.14,TG);r.rotation.set(-.35,0,0)});
 B(Bx(.05,.2,.02),Au,0,.42,.27,TG);B(Oc(.03,1,1.5,.5),Gm,0,.44,.285,TG);
 // جواهر و میخ روی سینه‌بند، حلقه و تیغه‌های نشان وسط
 const cup=(dx,dy)=>.14+.1425*Math.sqrt(Math.max(0,1-(dx/.15)**2-(dy/.1425)**2))+.006;
 [-1,1].forEach(s=>{B(Oc(.022,1,1.3,.7),Gm,s*.105,.46,cup(0,.02),TG);for(let i=0;i<3;i++){const a=i*TAU/3+1,dx=Math.cos(a)*.095,dy=Math.sin(a)*.085;B(Oc(.012,1,1,1),Au,s*.105+dx,.45+dy,cup(dx,dy+.01),TG)}});
 B(Tr(.045,.008,20),Au,0,.44,.29,TG);for(let i=0;i<4;i++){const a=i*Math.PI/2;B(Cn(.012,.04,4),Au,Math.sin(a)*.058,.44+Math.cos(a)*.058,.29,TG).rotation.z=-a}
 [-1,1].forEach(s=>cross(TG,s*.145,.41,cup(.04,-.04)+.004,.9));
 B(Ld([[.23,.3],[.25,.4],[.23,.52],[.14,.62]],30),Wh,0,0,0,TG).scale.set(1,.45,.7);
 // طوق مشکی دور گردن با جواهر آبی
 B(Ld([[.1,.64],[.115,.68],[.115,.76],[.1,.78]],20),Bl,0,0,0,TG);B(Tr(.115,.01,20),Au,0,.77,0,TG).rotation.x=Math.PI/2;B(Oc(.03,1,1.4,.6),Gm,0,.7,.115,TG);
 for(let i=0;i<8;i++){const a=i/8*TAU;B(Bx(.045,.06,.01),Wh,Math.sin(a)*.118,.72,Math.cos(a)*.118,TG).rotation.y=a}
 B(Tr(.12,.008,20),Au,0,.66,0,TG).rotation.x=Math.PI/2;
 // کمربند و پیش‌بند
 B(Tr(.215,.018,28),Au,0,.04,0,TG).rotation.x=Math.PI/2;
 for(let i=0;i<8;i++){const a=i/8*TAU;if(Math.abs(Math.sin(a/2))>.35)B(Oc(.016,1,1,.8),Au,Math.sin(a)*.222,.04,Math.cos(a)*.222,TG)}
 B(Tr(.045,.01,20),Au,-.08,.04,.226,TG);B(Oc(.028,1,1.2,.8),Gm,-.08,.04,.232,TG);for(let i=0;i<4;i++){const a=i*Math.PI/2;B(Cn(.012,.04,4),Au,-.08+Math.sin(a)*.058,.04+Math.cos(a)*.058,.228,TG).rotation.z=-a}
 const sk=B(Ld([[.2,.04],[.26,-.03],[.31,-.12],[.33,-.19]],44,32,.07),Bk,0,0,0,TG);sk.scale.set(1,1,.92);
 B(Tr(.332,.012,44),Au,0,-.19,0,TG).rotation.x=Math.PI/2;
 // زره‌های سفید کنار کمر با لبهٔ طلایی و جواهر (مثل عکس مرجع)
 [-1,1].forEach(q=>{const hp=B(Bx(.16,.2,.02),Wh,q*.27,-.07,.13,TG);hp.rotation.y=q*.6;
  const e1=B(Bx(.17,.014,.026),Au,q*.285,-.17,.14,TG);e1.rotation.y=q*.6;const e2=B(Bx(.014,.2,.026),Au,q*.2,-.07,.11,TG);e2.rotation.y=q*.6;
  B(Oc(.02,1,1.3,.7),Gm,q*.27,-.06,.145,TG)});
 const tsh=(w,l,pt)=>{const s=new THREE.Shape();s.moveTo(-w,0);s.lineTo(w,0);s.lineTo(w,-l);s.lineTo(0,-l-pt);s.lineTo(-w,-l);s.lineTo(-w,0);return new THREE.ShapeGeometry(s)};
 const TB=new THREE.Group();TB.position.set(.1,.03,.25);TG.add(TB);
 B(tsh(.17,.5,.2),Au,0,0,-.004,TB);B(tsh(.145,.47,.17),Wh,0,-.012,.001,TB);cross(TB,0,-.17,.01,1.5);cross(TB,0,-.4,.01,1.5);
 [-1,1].forEach(q=>{for(let i=0;i<3;i++)B(Cn(.02,.05,3),Au,q*.172,-.1-i*.13,.006,TB).rotation.z=-q*1.57;B(Cn(.025,.12,4),Au,q*.17,-.52,.006,TB).rotation.x=Math.PI});
 B(Oc(.03,1,1.4,.6),Gm,0,-.58,.012,TB);cross(TB,0,-.64,.01,.8);
 // سردوشی بزرگ سفید با تیغ‌های طلایی
 [-1,1].forEach(s=>{B(S(.2,1.1,.85,1.05),Wh,s*.4,.63,0,TG);const r=B(Tr(.19,.016,26),Au,s*.4,.56,0,TG);r.rotation.x=Math.PI/2;
  for(let i=0;i<3;i++)B(Cn(.022,.14,4),Au,s*(.4+i*.035),.8-i*.02,(i-1)*.08,TG).rotation.z=-s*(.3+i*.15);B(Oc(.03,1,1.3,.5),Gm,s*.4,.73,.12,TG);
  for(let i=0;i<3;i++){B(new THREE.SphereGeometry(.2+i*.016,16,8,0,TAU,0,.85).scale(1,.85,.82),Wh,s*(.4+.01*i),.55-i*.07,0,TG);B(Tr(.19+i*.016,.01,26),Au,s*(.4+.01*i),.53-i*.07,0,TG).rotation.x=Math.PI/2}
  for(let i=0;i<2;i++)B(Cn(.02,.1,4),Au,s*(.52+i*.04),.7-i*.05,0,TG).rotation.z=-s*(1.1+i*.3)});
 // سگک‌های شنل با جواهر و زنجیر
 [-1,1].forEach(s=>{B(Cy(.03,.03,.012,12),Au,s*.11,.66,.1,TG).rotation.x=Math.PI/2;B(Oc(.016,1,1.2,.7),Gm,s*.11,.66,.108,TG)});
 for(let i=0;i<3;i++)B(Tr(.02,.004,10),Au,(i-1)*.04,.63-.012*(1-Math.abs(i-1)*.0),.13,TG);
 // ---- شنل سرمه‌ای بلند با حاشیه و صلیب طلایی ----
 const NU=40,NV=24,cp=new Float32Array((NU+1)*(NV+1)*3),cuv=new Float32Array((NU+1)*(NV+1)*2),ci=[],cu=[],cv=[];
 for(let i=0;i<=NU;i++){const u=i/NU*2-1,len=1-.07*Math.abs(Math.sin(u*6+.5))-.05*(Math.sin(u*17)>.6?1:0);
  for(let j=0;j<=NV;j++){const v=j/NV,th=u*(.9+.6*v),R=.42+.62*v,k=i*(NV+1)+j;
   cp[k*3]=R*Math.sin(th);cp[k*3+1]=.78-v*len*1.82;cp[k*3+2]=-R*Math.cos(th)*.9-.05;cuv[k*2]=i/NU;cuv[k*2+1]=1-v;cu[k]=u;cv[k]=v;
   if(i<NU&&j<NV){const a=k,b=k+1,c=k+NV+1,d=c+1;ci.push(a,b,c,b,d,c)}}}
 const cg=new THREE.BufferGeometry();cg.setAttribute('position',new THREE.BufferAttribute(cp,3));cg.setAttribute('uv',new THREE.BufferAttribute(cuv,2));cg.setIndex(ci);cg.computeVertexNormals();
 const cape=B(cg,Cl,0,0,0,TG);cape.frustumCulled=false;const cb=new Float32Array(cp);
 // ---- سر ----
 const HD=new THREE.Group();HD.position.set(0,.8,0);TG.add(HD);B(Cy(.075,.09,.2,12),Sk,0,0,0,HD);
 const hr=.225,hy=.2;B(S(hr,1,1.08,1.02),Sk,0,hy,0,HD);
 B(new THREE.SphereGeometry(hr*1.008,28,20,Math.PI/2-.5,1,1.07,1).scale(1,1.08,1.02),M(0xffffff,{map:GX.faceDj({skin:0xe9ab88,hi:'#f4c4a4',ex:50}),roughness:.6,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),0,hy,0,HD);
 B(S(.17,1,.78,.92),Sk,0,hy-.12,.02,HD);B(S(.032,.85,1.5,1.2),Sk,0,hy-.03,hr*1.02,HD);
 // موی طلایی: کلاهک، چتری و دسته‌های کنار صورت
 B(new THREE.SphereGeometry(hr*1.08,28,18,0,TAU,0,1.12).scale(1,1.08,1.05),Hr,0,hy+.01,-.01,HD);
 B(S(.225,1,.85,.95),Hr,0,hy-.03,-.07,HD);
 [-1,1].forEach(s=>{B(S(.07,1,1.9,.55),Hr2,s*.1,hy+.1,hr*.95,HD).rotation.z=s*.5;B(S(.06,1,2,.5),Hr,s*.2,hy+.03,hr*.7,HD).rotation.z=s*.25;
  GX.strand(HD,Hr,[[s*.2,hy+.05,.08],[s*.23,hy-.12,.1],[s*.22,hy-.32,.08],[s*.2,hy-.5,.04]],.05,.012,12)});
 B(S(.06,1.2,1.7,.5),Hr2,0,hy+.13,hr*.97,HD);
 for(let i=0;i<8;i++){const f=.25+i*.17;B(S(.032,1,.8,1),i%2?Hr:Hr2,-Math.sin(f)*.225,hy+.13,Math.cos(f)*.225*1.04,HD)}
 [-1,1].forEach(s=>{B(Tr(.016,.004,10),Au,s*.228,hy-.07,.01,HD).rotation.y=Math.PI/2;B(S(.011,1,1.2,1),Gm,s*.228,hy-.1,.01,HD);
  B(Cy(.005,.005,.12,6),Au,s*.12,hy+.14,-.1,HD).rotation.z=s*.6;GX.strand(HD,Hr2,[[s*.19,hy+.06,.1],[s*.2,hy-.1,.13],[s*.19,hy-.28,.11]],.04,.01,10);B(S(.05,1,1.8,.5),Hr2,s*.05,hy+.12,hr*.97,HD).rotation.z=s*.2});
 // تاج کوچک طلایی با جواهر آبی و روبان آبی
 B(Tr(.14,.014,20,Math.PI),Au,0,hy+.17,.02,HD).rotation.set(0,0,0);for(let i=0;i<5;i++){const a=(i-2)*.5;B(Cn(.016,.07+(i===2?.03:0),4),Au,Math.sin(a)*.14,hy+.17+Math.cos(a)*.14+.03,.02,HD);}B(Oc(.02,1,1.3,.6),Gm,0,hy+.32,.04,HD);
 for(let i=1;i<4;i++){const a=(i-2)*.5;B(Oc(.012,1,1.2,.8),Gm,Math.sin(a)*.14,hy+.17+Math.cos(a)*.14,.035,HD)}
 [-1,1].forEach(q=>B(Cn(.02,.1,4),Au,q*.15,hy+.2,.02,HD).rotation.z=-q*1.0);
 const PT=new THREE.Group();PT.position.set(0,hy+.2,-.14);HD.add(PT);
 B(Cn(.04,.12,4),Gm,.06,.02,0,PT).rotation.z=-1.1;B(Cn(.04,.12,4),Gm,-.06,.02,0,PT).rotation.z=1.1;B(S(.045,1,1,1),Gm,0,.02,0,PT);
 [-1,1].forEach(q=>{const t=B(Cn(.03,.14,4),Gm,q*.03,-.05,0,PT);t.rotation.set(Math.PI,0,q*.3)});
 // دم‌اسبی بلند و موج‌دار (هر رشته گروه جدا برای حرکت)
 const pts=[];for(let i=0;i<13;i++){const pg=new THREE.Group();PT.add(pg);const side=(i-6)/6,ph=i*1.1,arr=[];
  for(let j=0;j<=8;j++){const t=j/8;arr.push([side*(.05+.22*t)-.36*t+Math.sin(t*7+ph)*.12*t,.14*Math.sin(Math.PI*t*.7)-1.25*Math.pow(t,1.15),-(.08+.55*t)-.09*Math.sin(t*5+ph)])}
  GX.strand(pg,i%3?Hr:Hr2,arr,.11,.026,18);pts.push({pg,ph})}
 for(let i=0;i<16;i++){const pg=new THREE.Group();PT.add(pg);const side=(i-7.5)/8,ph=i*1.7+.5,arr=[];for(let j=0;j<=8;j++){const t=j/8;arr.push([side*(.03+.2*t)-.3*t+Math.sin(t*6+ph)*.11*t,.12*Math.sin(Math.PI*t*.7)-1.15*Math.pow(t,1.15),-(.1+.45*t)-.08*Math.sin(t*5+ph)])}GX.strand(pg,i%2?Hr2:Hr,arr,.095,.02,16);pts.push({pg,ph})}
 // ---- بازوها ----
 const mkArm=s=>{const A=new THREE.Group();A.position.set(s*.42,.62,0);TG.add(A);
  GX.strand(A,Bk,[[0,0,0],[0,-.2,0],[0,-.4,0]],.085,.075,8);
  B(Cy(.1,.09,.26,16),Wh,0,-.18,0,A);B(Tr(.098,.013,22),Au,0,-.07,0,A).rotation.x=Math.PI/2;B(Tr(.092,.012,22),Au,0,-.3,0,A).rotation.x=Math.PI/2;
  const E=new THREE.Group();E.position.set(0,-.4,0);A.add(E);B(S(.09,1,1,1),Wh,0,0,0,E);B(Oc(.06,1,1.3,.5),Au,0,0,.08,E);
  GX.strand(E,Bk,[[0,0,0],[0,-.2,0],[0,-.42,0]],.075,.065,8);
  B(Cy(.088,.1,.3,16),Wh,0,-.2,0,E);B(Tr(.092,.013,22),Au,0,-.08,0,E).rotation.x=Math.PI/2;B(Tr(.1,.013,22),Au,0,-.33,0,E).rotation.x=Math.PI/2;B(Bx(.045,.2,.016),Au,0,-.2,.09,E);
  B(S(.075,1,1.1,1),Bl,0,-.5,0,E);B(Tr(.075,.012,16),Au,0,-.44,0,E).rotation.x=Math.PI/2;
  // جزئیات بازو: آستین سفید، میخ‌ها، آرنج تیغ‌دار، ساعدبند، انگشت‌ها و شست
  B(Cy(.105,.095,.08,16),Wh,0,-.12,0,A);for(let i=0;i<3;i++){const a=(i-1)*.55;B(Oc(.014,1,1,1),Au,Math.sin(a)*.098,-.18,Math.cos(a)*.098,A)}
  B(Cn(.025,.1,5),Au,0,0,-.08,E).rotation.x=-Math.PI/2;[-1,1].forEach(q=>B(Cn(.018,.07,4),Au,q*.09,0,-.02,E).rotation.z=-q*1.4);
  [-1,1].forEach(q=>B(Bx(.012,.28,.012),Au,q*.07,-.2,.075,E));B(Cy(.1,.09,.04,16),Wh,0,-.14,0,E);
  for(let i=0;i<4;i++)B(S(.02,1,.9,1),Bl,(i-1.5)*.035,-.55,.07,E);B(S(.026,1,1.3,1),Bk,-s*.07,-.48,.05,E);B(Bx(.1,.025,.016),Au,0,-.465,.075,E);
  return{A,E}};
 const RA=mkArm(-1),LA=mkArm(1),AR=[RA,LA];
 // ---- شمشیر بزرگ: تیغهٔ پهن سفید با میانهٔ سرمه‌ای و صلیب طلایی ----
 const bs=new THREE.Shape();bs.moveTo(-.14,-.18);bs.lineTo(.14,-.18);bs.lineTo(.175,-.36);bs.lineTo(.175,-.78);bs.lineTo(0,-.97);bs.lineTo(-.175,-.78);bs.lineTo(-.175,-.36);bs.lineTo(-.14,-.18);
 const bi=new THREE.Shape();bi.moveTo(-.09,-.25);bi.lineTo(.09,-.25);bi.lineTo(.115,-.38);bi.lineTo(.115,-.76);bi.lineTo(0,-.88);bi.lineTo(-.115,-.76);bi.lineTo(-.115,-.38);bi.lineTo(-.09,-.25);
 const bgO=new THREE.ExtrudeGeometry(bs,{depth:.04,bevelEnabled:false});bgO.translate(0,0,-.02);const bgI=new THREE.ExtrudeGeometry(bi,{depth:.056,bevelEnabled:false});bgI.translate(0,0,-.028);
 const mkSword=(Q)=>{const sw=new THREE.Group();sw.position.set(0,-.5,0);sw.scale.set(1.35,1.05,1.3);Q.add(sw);
  B(Cy(.028,.028,.3,10),Bl,0,.02,0,sw);for(let i=0;i<4;i++)B(Tr(.03,.006,10),Au,0,-.06+i*.07,0,sw).rotation.x=Math.PI/2;
  B(S(.05,1,1,1),Au,0,.2,0,sw);B(S(.028,1,1,1),Gm,0,.2,.045,sw);
  // گارد طلایی تیز و بالدار با جواهر آبی
  B(Bx(.5,.05,.07),Au,0,-.15,0,sw);[-1,1].forEach(q=>{B(Bx(.12,.05,.07),Au,q*.29,-.12,0,sw).rotation.z=q*.55;B(Cn(.032,.14,4),Au,q*.37,-.04,0,sw).rotation.z=-q*.7;B(Cn(.028,.1,4),Au,q*.26,-.2,0,sw).rotation.z=Math.PI+q*.3;B(Cn(.02,.08,4),Au,q*.14,-.1,0,sw)});
  B(Oc(.06,1,1.3,.8),Au,0,-.15,.04,sw);B(Oc(.034,1,1.3,.7),Gm,0,-.15,.075,sw);
  B(bgO,St,0,0,0,sw);B(bgI,Nv,0,0,0,sw);
  B(Bx(.03,.56,.06),Au,0,-.55,0,sw);B(Bx(.16,.03,.06),Au,0,-.42,0,sw);B(Bx(.1,.026,.06),Au,0,-.7,0,sw);
  B(Cn(.025,.07,4),Au,0,-.85,0,sw).rotation.x=Math.PI;
  for(let i=0;i<3;i++)B(Oc(.01,1,1.8,.6),Gm,0,-.4-i*.16,.032,sw);
  B(Cn(.025,.07,5),Au,0,.27,0,sw);B(Oc(.02,1,1.5,.5),Au,0,-.3,.03,sw);
  [-1,1].forEach(q=>[0,1].forEach(j=>B(Oc(.014,1,1,1),Au,q*(.1+.12*j),-.15,.04,sw)));
  // گارد خاردار و پرجزئیات + سرِ شکوفایی صلیب روی تیغه
  [-1,1].forEach(q=>{for(let j=0;j<3;j++)B(Cn(.022,.1-j*.015,4),Au,q*(.2+j*.07),-.22+j*.03,0,sw).rotation.z=Math.PI+q*(.5+j*.25);B(Oc(.03,1,1.5,.6),Au,q*.08,-.42,.032,sw);B(Oc(.025,1,1.5,.6),Au,q*.05,-.7,.032,sw)});
  B(Oc(.07,1,1.4,.6),Au,0,-.2,.035,sw);B(Oc(.035,1,1.5,.6),Au,0,-.28,.032,sw);B(Oc(.035,1,1.5,.6),Au,0,-.82,.032,sw);
  [-1,1].forEach(q=>B(Bx(.012,.7,.07),Au,q*.17,-.58,0,sw));
  return sw};
 const SWD=[mkSword(RA.E),mkSword(LA.E)];
 // ردّ برش (هلال نورانی)
 const trG=(()=>{const N=22,pos=[],idx=[],p0=[-.7,1.05],p1=[.2,1.15],p2=[1.2,-.5];for(let i=0;i<=N;i++){const s=i/N,x=(1-s)*(1-s)*p0[0]+2*(1-s)*s*p1[0]+s*s*p2[0],y=(1-s)*(1-s)*p0[1]+2*(1-s)*s*p1[1]+s*s*p2[1],
  tx=2*(1-s)*(p1[0]-p0[0])+2*s*(p2[0]-p1[0]),ty=2*(1-s)*(p1[1]-p0[1])+2*s*(p2[1]-p1[1]),l=Math.hypot(tx,ty)||1,nx=-ty/l,ny=tx/l,w=.22*Math.pow(Math.sin(Math.PI*s),.7);
  pos.push(x+nx*w,y+ny*w,0,x-nx*w,y-ny*w,0);if(i<N)idx.push(2*i,2*i+1,2*i+2,2*i+1,2*i+3,2*i+2)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);return g})();
 const TRL=[-1,1].map(s=>{const pv=new THREE.Group();pv.position.set(s*.42,.62,0);pv.rotation.z=s*.55;TG.add(pv);
  const m=new THREE.MeshBasicMaterial({color:0xcfe4ff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}),
   t=new THREE.Mesh(trG,m);t.rotation.y=-Math.PI/2;t.visible=false;pv.add(t);t.raycast=()=>{};Object.defineProperty(t,'castShadow',{get:()=>false,set:()=>{}});return{t,m}});
 // ---- انیمیشن ----
 // ژست بازو: [شانه x، بازشدگی به بیرون، آرنج، شیب تیغه (مطلق)، چرخش تیغه به بیرون]
 const IDLE=[-.3,.2,-.55,0,.3],WU=[-2.5,.55,-.9,-3.3,.3],SK=[-1.4,-.55,-.4,-1.0,-.3],WUB=[-2.7,.95,-1.0,-3.5,.4],SKB=[-1.6,-.7,-.3,-.85,-.35];
 // ژست بدن: [چرخش تنه، پیشروی، خم]
 const BI=[0,0,0],BW=[.55,-.07,-.1],BS=[-.5,.3,.2],BWB=[.9,-.15,-.2],BSB=[-.9,.5,.3];
 const mix=(a,b,k)=>a.map((v,i)=>v+(b[i]-v)*k);
 const TIM={n:{wu:.2,st:.14,ho:.04,rc:.42},b:{wu:.4,st:.18,ho:.22,rc:.55}};
 const SL=[],SW={x:0,vx:0,z:0,vz:0,px:0,py:0,pz:0,lt:-1,ok:0},cl=(v,a)=>v<-a?-a:v>a?a:v;
 const armPose=(sl,e)=>{const T=sl.big?TIM.b:TIM.n,W=sl.big?WUB:WU,K=sl.big?SKB:SK,a=ez(e/T.wu),b=ez((e-T.wu)/T.st),c=ez((e-T.wu-T.st-T.ho)/T.rc);return mix(mix(mix(IDLE,W,a),K,b),IDLE,c)};
 const bodyPose=(sl,e)=>{const T=sl.big?TIM.b:TIM.n,W=sl.big?BWB:BW,K=sl.big?BSB:BS,a=ez(e/T.wu),b=ez((e-T.wu)/T.st),c=ez((e-T.wu-T.st-T.ho)/T.rc),q=mix(mix(mix(BI,W,a),K,b),BI,c);if(sl.side===1)q[0]=-q[0];return q};
 GX.anim(G,t=>{const now=performance.now(),dt=SW.lt<0?.016:Math.min(.05,Math.max(.001,t-SW.lt));SW.lt=t;
  const br=Math.sin(t*1.5),el=G.matrixWorld.elements;
  for(let i=SL.length-1;i>=0;i--){const T=SL[i].big?TIM.b:TIM.n;if((now-SL[i].t0)/1000>T.wu+T.st+T.ho+T.rc)SL.splice(i,1)}
  const pick=i=>{let r=null;SL.forEach(sl=>{const e=(now-sl.t0)/1000;if(e>=0&&(sl.side===i||sl.side===2)&&(!r||sl.t0>r.sl.t0))r={sl,e}});return r};
  let bp=BI,newest=null;SL.forEach(sl=>{const e=(now-sl.t0)/1000;if(e>=0&&(!newest||sl.t0>newest.sl.t0))newest={sl,e}});if(newest)bp=bodyPose(newest.sl,newest.e);
  let lx=0,lz=0;if(SW.ok){const vx=(el[12]-SW.px)/dt,vy=(el[13]-SW.py)/dt,vz=(el[14]-SW.pz)/dt,ax=el[0]*el[0]+el[1]*el[1]+el[2]*el[2]||1,az=el[8]*el[8]+el[9]*el[9]+el[10]*el[10]||1;lx=(vx*el[0]+vy*el[1]+vz*el[2])/ax;lz=(vx*el[8]+vy*el[9]+vz*el[10])/az}
  SW.px=el[12];SW.py=el[13];SW.pz=el[14];SW.ok=1;
  const tx=cl(-lx*.1-bp[0]*.25,.45),tz=cl(-lz*.1-Math.max(0,bp[1])*.9,.55);
  SW.vx+=((tx-SW.x)*45-SW.vx*4.2)*dt;SW.x+=SW.vx*dt;SW.vz+=((tz-SW.z)*45-SW.vz*4.2)*dt;SW.z+=SW.vz*dt;
  G.position.z=bp[1];G.position.y=.01*Math.sin(t*2)-.05*Math.max(0,bp[1]);
  legs[0].rotation.x=-bp[1]*.9;legs[1].rotation.x=bp[1]*.6;
  TG.rotation.set(bp[2]+.008*br,bp[0],.01*Math.sin(t*.6));TG.scale.y=1+.006*br;
  HD.rotation.set(-bp[2]*.4+.02*Math.sin(t*.5),-bp[0]*.5+.06*Math.sin(t*.37),.02*Math.sin(t*.43+2));
  [0,1].forEach(i=>{const s=i?1:-1,r=pick(i),p=r?armPose(r.sl,r.e):IDLE,A=AR[i];
   A.A.rotation.set(p[0]+.015*Math.sin(t*.9+i),0,s*p[1]);A.E.rotation.set(p[2],0,0);SWD[i].rotation.set(p[3]-(p[0]+p[2]),0,s*p[4]);
   const T=TRL[i];let op=0;
   if(r){const Tm=r.sl.big?TIM.b:TIM.n,k=(r.e-Tm.wu)/(Tm.st+.14);if(k>0&&k<1){op=Math.pow(Math.sin(k*Math.PI),.6)*(r.sl.big?.95:.8);T.t.visible=true;T.m.opacity=op;T.m.color.setHex(r.sl.big?0xffd27a:0xcfe4ff);T.t.scale.setScalar((r.sl.big?1.15:.95)*(.85+.25*k))}}
   if(!op){T.t.visible=false;T.m.opacity=0}});
  TB.rotation.x=-(.3+.03*Math.sin(t*1.3))+SW.z*.5-Math.max(0,bp[1])*.3;TB.rotation.z=SW.x*.3;
  sk.scale.set(1+.02*Math.sin(t*1.2)+Math.abs(SW.x)*.1,1,.92+Math.max(0,SW.z)*.15);
  // دم‌اسبی و موها
  pts.forEach((o,k)=>{o.pg.rotation.set(.06*Math.sin(t*1.3+o.ph)+SW.z*.4-bp[2]*.3,0,.05*Math.sin(t*1.1+o.ph*.7)+SW.x*.6+bp[0]*.25)});
  PT.rotation.set(.05*Math.sin(t*.9),0,.03*Math.sin(t*.7));
  // شنل
  const a=cg.attributes.position.array,n3=cu.length,wg=.5+.5*Math.sin(t*.7);
  for(let k=0;k<n3;k++){const v=cv[k],d=Math.pow(v,1.25),sa=Math.sin(t*1.6+v*3.2+cu[k]*2.5),sb=Math.sin(t*2.9+v*5.5+cu[k]*5);
   a[k*3]=cb[k*3]*(1+d*(.05+.03*wg)*sa)+d*(SW.x*.7+.03*sb);
   a[k*3+1]=cb[k*3+1]+d*.025*sb-d*Math.abs(SW.z)*.05;
   a[k*3+2]=cb[k*3+2]-d*(.06+.06*sa+.03*wg)+d*cl(SW.z,.55)*.9}
  cg.attributes.position.needsUpdate=true;cg.computeVertexNormals()});
 // fire(i, ab, delayMs): ضربهٔ i‌ام؛ i=0 شمشیر راست، i=1 شمشیر چپ؛ ab=ضربهٔ ویژهٔ هر دو شمشیر
 G.userData.doj={fire:(i,ab,delay)=>{const d=delay||0,T=ab?TIM.b:TIM.n;SL.push({t0:performance.now()+d,side:ab?2:(i%2),big:!!ab});return d+(T.wu+T.st*.5)*1000}};
 return G}
GX.reg('doj',gxDojina);
/* ---------- پادشاه اهریمن · غول بنفش با زره سیاه-طلایی، چهار دست پنجه‌دار، یالِ خزی و شنل پاره (مطابق تصویر مرجع) ---------- */
function gxDemonKing0(M,team){
 const V=THREE.Vector3,G=new THREE.Group(),P=GX.pal(M),Y=.18,
  B=(g,m,x,y,z,Q)=>{const e=new THREE.Mesh(g,m);e.position.set(x||0,y||0,z||0);(Q||G).add(e);return e},
  S=(r,a,b,c)=>new THREE.SphereGeometry(r,16,12).scale(a,b,c),Bx=(a,b,c)=>new THREE.BoxGeometry(a,b,c),
  Cn=(r,l,s)=>new THREE.ConeGeometry(r,l,s||5),Oc=(r,a,b,c)=>new THREE.OctahedronGeometry(r).scale(a,b,c),
  Pu=P.skin(0x6a35a8),Ar=P.metal(0x1b1622,{roughness:.42,metalness:.7}),Au=P.metal(0xc9a24a,{roughness:.3}),
  Fu=P.cloth(0xcdbbe9,{roughness:.9}),Cp=P.cloth(0x4a1f80,{roughness:.8}),
  Gm=M(GX.c(0xb25cff),{roughness:.1,metalness:.3,clearcoat:1,emissive:new THREE.Color(.45,.12,.8)}),
  Ey=M(GX.c(0xe08aff),{roughness:.2,emissive:new THREE.Color(1,.35,1)});
 const rod=(a,b,r1,r2,m,Q)=>{const A=new V(...a),Bv=new V(...b),d=Bv.clone().sub(A),L=d.length(),e=new THREE.Mesh(new THREE.CylinderGeometry(r2,r1,L,10),m);e.position.copy(A).addScaledVector(d,.5);e.quaternion.setFromUnitVectors(new V(0,1,0),d.normalize());(Q||G).add(e);return e};
 // ---- پاها: ران بنفش، ساق و چکمهٔ سیاه با خارهای طلایی ----
 [-1,1].forEach(s=>{const x=s*.17;
  rod([x,Y+1.05,0],[x,Y+.62,.04],.15,.12,Pu);rod([x,Y+.62,.04],[x,Y+.2,0],.13,.1,Ar);
  B(S(.15,1,.8,1.1),Ar,x,Y+.64,.1);B(Cn(.04,.2,4),Au,x,Y+.66,.22).rotation.x=Math.PI/2;
  rod([x,Y+.5,.0],[x,Y+.28,0],.145,.135,Au);
  B(Bx(.24,.16,.4),Ar,x,Y+.1,.06);B(Cn(.07,.26,4),Au,x,Y+.1,.32).rotation.x=Math.PI/2;B(Bx(.26,.04,.2),Au,x,Y+.2,.06)});
 // ---- بالاتنه ----
 const TG=new THREE.Group();G.add(TG);
 B(S(.32,1,.55,.75),Ar,0,Y+1.05,0,TG);B(S(.38,1,1.2,.7),Pu,0,Y+1.55,0,TG);
 [-1,1].forEach(s=>{B(S(.17,1,.85,.7),Pu,s*.17,Y+1.7,.09,TG);rod([s*.06,Y+1.3,.22],[s*.14,Y+1.62,.2],.018,.018,Au,TG)});
 rod([-.14,Y+1.62,.24],[0,Y+1.5,.26],.018,.018,Au,TG);rod([.14,Y+1.62,.24],[0,Y+1.5,.26],.018,.018,Au,TG);
 const gem=B(Oc(.055,1,1.4,.6),Gm,0,Y+1.63,.27,TG);
 B(new THREE.CylinderGeometry(.31,.33,.1,14),Ar,0,Y+1.12,0,TG);B(Oc(.1,1.2,1.3,.4),Au,0,Y+1.12,.3,TG);
 const tb=B(Bx(.3,.8,.03),Cp,0,Y+.7,.27,TG);B(Oc(.07,1,1.5,.2),Au,0,Y+.78,.29,TG);B(Oc(.06,1,1.5,.2),Au,0,Y+.55,.29,TG);B(Cn(.15,.2,4),Au,0,Y+.22,.27,TG).rotation.z=Math.PI;
 // ---- یالِ خزی دور شانه‌ها ----
 for(let i=0;i<26;i++){const a=i/26*6.283,r=.44,f=B(Cn(.09+.03*Math.sin(i*2.3),.26,5),Fu,Math.sin(a)*r,Y+1.9+.05*Math.cos(a*2),Math.cos(a)*r*.62-.03,TG);f.rotation.set(Math.cos(a)*1.1,0,-Math.sin(a)*1.1)}
 [-1,1].forEach(s=>{B(S(.2,1,.8,.9),Ar,s*.44,Y+1.8,0,TG);B(Cn(.05,.2,4),Au,s*.5,Y+1.95,0,TG).rotation.z=-s*.5});
 // ---- سر: کلاه‌خود، چشم‌های بنفش، تاج ----
 const HD=new THREE.Group();HD.position.set(0,Y+2.07,0);TG.add(HD);
 B(S(.17,1,1.15,1.05),Ar,0,0,0,HD);B(Bx(.2,.03,.05),Au,0,.04,.15,HD);[-1,1].forEach(s=>B(Bx(.07,.025,.03),Ey,s*.06,.06,.16,HD));B(Oc(.025,1,1.5,.6),Gm,0,.14,.14,HD);
 B(new THREE.CylinderGeometry(.18,.19,.06,12),Au,0,.15,0,HD);
 [[0,.42,0],[-.08,.32,.12],[.08,.32,-.12],[-.14,.24,-.3],[.14,.24,.3]].forEach((c,i)=>{const sp=B(Cn(.035,c[1],4),i?Ar:Au,c[0]*1.2+(i>2?(i===3?-.1:.1):0),.18+c[1]/2,i===1?.1:i===2?-.05:0,HD);sp.rotation.z=(i===3?.35:i===4?-.35:i===1?.1:i===2?-.1:0)});
 // ---- چهار دست: دو دست بالا با پنجه‌های بالا، دو دست پایین ----
 const arms=[];
 [[1,1.78,[[.34,.12,.1],[.5,.52,.18]]],[1,1.52,[[.4,-.18,.1],[.48,-.55,.24]]]].forEach(c=>[-1,1].forEach(s=>{
  const g=new THREE.Group();g.position.set(s*.4,Y+c[1],0);TG.add(g);const e=c[2][0],w=c[2][1];
  rod([0,0,0],[s*e[0],e[1],e[2]],.15,.12,Pu,g);rod([s*e[0],e[1],e[2]],[s*w[0],w[1],w[2]],.12,.09,Pu,g);
  rod([s*e[0]*1.15,e[1]*1.1,e[2]],[s*w[0]*.92,w[1]*.9,w[2]],.14,.12,Ar,g);B(S(.1,1,1,1),Au,s*e[0],e[1],e[2],g);
  const hp=new V(s*w[0],w[1],w[2]),dir=hp.clone().sub(new V(s*e[0],e[1],e[2])).normalize();B(S(.1,1,.9,1.1),Pu,hp.x,hp.y,hp.z,g);
  for(let k=-1;k<=2;k++){const d2=dir.clone().add(new V(s*.25*(k-.5),.08*k,.2*(k-.5))).normalize(),cl=B(Cn(.022,.2,4),Au,hp.x+d2.x*.16,hp.y+d2.y*.16,hp.z+d2.z*.16,g);cl.quaternion.setFromUnitVectors(new V(0,1,0),d2)}
  arms.push({g,s,i:arms.length})}));
 // ---- شنل پاره ----
 const cg=new THREE.PlaneGeometry(1.25,1.9,10,12);cg.translate(0,-.95,0);const cb=Float32Array.from(cg.attributes.position.array);
 for(let k=0;k<cb.length/3;k++)if(cb[k*3+1]<-1.85)cb[k*3+1]-=.16*Math.abs(Math.sin(k*12.9))+.04;
 const cm=B(cg,Cp,0,Y+1.95,-.3,G);cm.rotation.x=.08;
 GX.anim(G,t=>{
  const br=Math.sin(t*1.5);TG.position.y=.012*br;HD.rotation.y=.12*Math.sin(t*.45);HD.rotation.x=.03*br;
  arms.forEach(o=>{o.g.rotation.z=o.s*.05*Math.sin(t*1.3+o.i);o.g.rotation.x=.04*Math.sin(t*1.1+o.i*1.7)});
  gem.material.emissiveIntensity=.8+.4*Math.sin(t*2.2);tb.rotation.x=.04*Math.sin(t*1.8);
  const a=cg.attributes.position.array;
  for(let k=0;k<cb.length/3;k++){const v=Math.min(1,-cb[k*3+1]/1.9);a[k*3]=cb[k*3]*(1+.3*v);a[k*3+1]=cb[k*3+1];a[k*3+2]=cb[k*3+2]+v*(.12+.06*Math.sin(t*1.7+v*3+cb[k*3]*3))+.02*Math.sin(t*4+k)*v*v}
  cg.attributes.position.needsUpdate=true;cg.computeVertexNormals()});
 return G}
/* ---------- پادشاه اهریمن · نسخهٔ ۲ (مطابق تصویر مرجع: غول بنفش عضلانی، زره سیاه-طلایی خاردار، یالِ خزی، شنل پاره، چهار دست پنجه‌دار، تاج خاردار) ---------- */
GX.dkSkin=()=>GX._dks||(GX._dks=GX.tex(256,256,(x,w,h)=>{
 let sd=5;const R=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
 const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#7a49b4');g.addColorStop(.5,'#643a9a');g.addColorStop(1,'#4c2a80');x.fillStyle=g;x.fillRect(0,0,w,h);
 for(let i=0;i<220;i++){const X=R()*w,Y=R()*h,rx=4+R()*20,ry=3+R()*12,rot=R()*3;x.fillStyle=i%3===0?'rgba(205,160,255,.07)':i%3===1?'rgba(28,6,56,.10)':'rgba(120,60,150,.08)';[0,-w,w].forEach(o=>{x.beginPath();x.ellipse(X+o,Y,rx,ry,rot,0,7);x.fill()})}
 x.lineCap='round';x.lineJoin='round';
 for(let i=0;i<9;i++){let X=R()*w,Y=R()*h;x.strokeStyle='rgba(58,26,110,.30)';x.lineWidth=1+R()*1.6;x.beginPath();x.moveTo(X,Y);for(let j=0;j<6;j++){X+=R()*26-13;Y+=10+R()*14;x.lineTo(X,Y)}x.stroke()}
 for(let i=0;i<5;i++){const X=R()*w,Y=R()*h,a=R()*3,l=10+R()*22;x.strokeStyle='rgba(190,150,210,.35)';x.lineWidth=1.4;x.beginPath();x.moveTo(X,Y);x.lineTo(X+Math.cos(a)*l,Y+Math.sin(a)*l);x.stroke();x.strokeStyle='rgba(30,8,50,.3)';x.beginPath();x.moveTo(X+1.5,Y+1.5);x.lineTo(X+Math.cos(a)*l+1.5,Y+Math.sin(a)*l+1.5);x.stroke()}
 for(let i=0;i<900;i++){x.fillStyle=R()<.5?'rgba(25,5,50,.16)':'rgba(210,170,255,.10)';x.beginPath();x.arc(R()*w,R()*h,.5+R()*.9,0,7);x.fill()}
},1,[2,2]));
GX.dkBump=()=>GX._dkb||(GX._dkb=GX.tex(128,128,(x,w,h)=>{
 let sd=9;const R=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
 x.fillStyle='#808080';x.fillRect(0,0,w,h);x.lineCap='round';
 for(let i=0;i<700;i++){x.fillStyle=R()<.6?'rgba(0,0,0,.22)':'rgba(255,255,255,.14)';x.beginPath();x.arc(R()*w,R()*h,.5+R()*1,0,7);x.fill()}
 for(let i=0;i<26;i++){const X=R()*w,Y=R()*h,l=10+R()*26,c=(R()-.5)*10;x.strokeStyle='rgba(0,0,0,.28)';x.lineWidth=1.2;x.beginPath();x.moveTo(X,Y);x.quadraticCurveTo(X+l/2,Y+c,X+l,Y);x.stroke();x.strokeStyle='rgba(255,255,255,.18)';x.beginPath();x.moveTo(X,Y+1.6);x.quadraticCurveTo(X+l/2,Y+c+1.6,X+l,Y+1.6);x.stroke()}
},0,[3,3]));
GX.dkArm=()=>GX._dka||(GX._dka=GX.tex(128,128,(x,w,h)=>{
 let sd=13;const R=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
 x.fillStyle='#808080';x.fillRect(0,0,w,h);
 for(let i=0;i<120;i++){const a=R()*.6,X=R()*w,Y=R()*h,l=6+R()*34;x.strokeStyle=R()<.5?'rgba(255,255,255,.32)':'rgba(0,0,0,.32)';x.lineWidth=.5+R()*1.1;x.beginPath();x.moveTo(X,Y);x.lineTo(X+Math.cos(a)*l,Y+Math.sin(a)*l);x.stroke()}
 for(let i=0;i<16;i++){const g=x.createRadialGradient(0,0,0,0,0,7);g.addColorStop(0,'rgba(0,0,0,.45)');g.addColorStop(1,'rgba(0,0,0,0)');x.save();x.translate(R()*w,R()*h);x.fillStyle=g;x.beginPath();x.arc(0,0,7,0,7);x.fill();x.restore()}
},0,[3,3]));
GX.dkTab=()=>GX._dkt||(GX._dkt=GX.tex(128,256,(x,w,h)=>{
 x.clearRect(0,0,w,h);const pa=()=>{x.beginPath();x.moveTo(2,0);x.lineTo(w-2,0);x.lineTo(w-2,h*.86);x.lineTo(w*.5,h-2);x.lineTo(2,h*.86);x.closePath()};
 const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#6d31b2');g.addColorStop(1,'#431a7a');pa();x.fillStyle=g;x.fill();
 pa();x.lineWidth=9;x.strokeStyle='#d6ac55';x.stroke();x.lineWidth=2;x.strokeStyle='#2a0d4f';x.save();x.translate(0,0);x.scale(.9,.97);x.translate(w*.055,3);pa();x.stroke();x.restore();
 const dm=(cx,cy,r,f)=>{x.beginPath();x.moveTo(cx,cy-r*1.35);x.lineTo(cx+r,cy);x.lineTo(cx,cy+r*1.35);x.lineTo(cx-r,cy);x.closePath();if(f){x.fillStyle='#d6ac55';x.fill()}else{x.lineWidth=4;x.strokeStyle='#d6ac55';x.stroke()}};
 [[.2,22],[.4,19],[.6,16]].forEach(([y,r])=>{dm(w/2,h*y,r,0);dm(w/2,h*y,r*.45,1)});dm(w/2,h*.78,11,0);dm(w/2,h*.78,5,1);
 x.fillStyle='#d6ac55';[.1,.3,.5,.7].forEach(y=>{[-1,1].forEach(s=>{x.beginPath();x.moveTo(w/2+s*38,h*y);x.lineTo(w/2+s*46,h*y+9);x.lineTo(w/2+s*38,h*y+18);x.closePath();x.fill()})})},1));
GX.dkCape=()=>GX._dkc||(GX._dkc=GX.tex(256,512,(x,w,h)=>{
 x.clearRect(0,0,w,h);let sd=11;const R=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
 x.beginPath();x.moveTo(0,0);x.lineTo(w,0);
 for(let i=1;i<=12;i++)x.lineTo(w-(i%2?0:5+R()*9),h*.88*i/12);
 for(let i=0;i<=16;i++)x.lineTo(w-i*(w/16)-w/32,h*(i%2?.82+R()*.07:.95+R()*.05));
 for(let i=12;i>=1;i--)x.lineTo(i%2?0:5+R()*9,h*.88*i/12);
 x.closePath();
 const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#6a2eb0');g.addColorStop(.5,'#52248f');g.addColorStop(1,'#3a1670');x.fillStyle=g;x.fill();
 x.save();x.clip();
 for(let i=0;i<40;i++){x.strokeStyle=i%2?'rgba(20,0,50,.22)':'rgba(190,130,255,.12)';x.lineWidth=2+R()*5;const X=R()*w;x.beginPath();x.moveTo(X,0);x.bezierCurveTo(X+10,h*.3,X-10,h*.6,X+R()*14-7,h);x.stroke()}
 for(let i=0;i<30;i++){x.fillStyle='rgba(20,0,40,.12)';x.beginPath();x.ellipse(R()*w,R()*h,6+R()*14,10+R()*30,0,0,7);x.fill()}
 x.strokeStyle='rgba(214,172,85,.85)';x.lineWidth=4;[12,w-12].forEach(X=>{x.beginPath();x.moveTo(X,10);x.lineTo(X,h*.8);x.stroke()});
 x.lineWidth=3;x.beginPath();x.moveTo(20,16);for(let i=0;i<9;i++)x.lineTo(20+(i+1)*(w-40)/9,i%2?16:34);x.stroke();
 x.restore()},1));
function gxMerge(Q){
 const by=new Map(),kill=[];
 Q.children.forEach(o=>{if(!o.isMesh||o.userData.keep)return;o.updateMatrix();
  const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrix);
  if(!by.has(o.material))by.set(o.material,[]);by.get(o.material).push(g);kill.push(o)});
 kill.forEach(o=>{Q.remove(o);o.geometry.dispose()});
 by.forEach((gs,m)=>{let n=0;gs.forEach(g=>n+=g.attributes.position.count);
  const Pp=new Float32Array(n*3),N=new Float32Array(n*3),UV=new Float32Array(n*2);let i=0;
  gs.forEach(g=>{const c=g.attributes.position.count;Pp.set(g.attributes.position.array,i*3);if(g.attributes.normal)N.set(g.attributes.normal.array,i*3);if(g.attributes.uv)UV.set(g.attributes.uv.array,i*2);i+=c;g.dispose()});
  const G2=new THREE.BufferGeometry();G2.setAttribute('position',new THREE.BufferAttribute(Pp,3));G2.setAttribute('normal',new THREE.BufferAttribute(N,3));G2.setAttribute('uv',new THREE.BufferAttribute(UV,2));
  Q.add(new THREE.Mesh(G2,m))})}
function gxDemonKing(M,team){
 const V=THREE.Vector3,G=new THREE.Group(),P=GX.pal(M),Y=.18,PI=Math.PI,TAU=PI*2,HIP=1.52,BASE=.76,
  B=(g,m,x,y,z,Q)=>{const e=new THREE.Mesh(g,m);e.position.set(x||0,y||0,z||0);(Q||G).add(e);return e},
  E=(a,b,c,n)=>new THREE.SphereGeometry(1,n||20,14).scale(a,b,c),
  Cy=(r1,r2,l,n)=>new THREE.CylinderGeometry(r1,r2,l,n||12),Bx=(a,b,c)=>new THREE.BoxGeometry(a,b,c),
  Cn=(r,l,n)=>new THREE.ConeGeometry(r,l,n||5),Oc=(r,a,b,c)=>new THREE.OctahedronGeometry(r).scale(a,b,c),
  Tr=(r,t,n)=>new THREE.TorusGeometry(r,t,8,n||22),
  grp=(Q,x,y,z)=>{const g=new THREE.Group();g.position.set(x||0,y||0,z||0);Q.add(g);return g},
  sp=(Q,m,p,d,r,l,sg)=>{const dd=new V(d[0],d[1],d[2]).normalize(),e=new THREE.Mesh(new THREE.ConeGeometry(r,l,sg||5),m);e.position.set(p[0],p[1],p[2]).addScaledVector(dd,l/2);e.quaternion.setFromUnitVectors(new V(0,1,0),dd);Q.add(e);return e},
  Sk=M(0xffffff,{map:GX.dkSkin(),bumpMap:GX.dkBump(),bumpScale:1.5,roughness:.5,sheen:.5,sheenRoughness:.5,sheenColor:new THREE.Color(0x9a6fd6)}),
  Ar=M(GX.c(0x18131f),{roughness:.36,metalness:.6,clearcoat:.4,clearcoatRoughness:.32,bumpMap:GX.dkArm(),bumpScale:1.3,side:THREE.DoubleSide}),
  Au=P.metal(0xd6ac55,{roughness:.26}),
  Fu1=P.cloth(0xd9c8f4,{roughness:1,sheen:0}),Fu2=P.cloth(0xb79fdc,{roughness:1,sheen:0}),Fu3=P.cloth(0xc6b0ea,{roughness:1,sheen:0}),
  Gm=new THREE.MeshBasicMaterial({color:0xb860ff,toneMapped:false}),
  Tb=M(0xffffff,{map:GX.dkTab(),roughness:.8,alphaTest:.5,side:THREE.DoubleSide}),
  Cp=M(0xffffff,{map:GX.dkCape(),roughness:.9,alphaTest:.5,side:THREE.DoubleSide}),
  Eg=new THREE.MeshBasicMaterial({color:0xe9a0ff,toneMapped:false}),
  Hl=new THREE.MeshBasicMaterial({color:0xb040ff,transparent:true,opacity:.45,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}),
  rr=k=>{const s=Math.sin(k*91.7)*4375.5;return s-Math.floor(s)},
  ez=x=>x<=0?0:x>=1?1:x*x*(3-2*x),cl=(v,a)=>v<-a?-a:v>a?a:v,mix=(a,b,k)=>a.map((v,i)=>v+(b[i]-v)*k);
 /* ---- پاها: ران و ساق زرهی سیاه با نوار طلایی، زانوبند و چکمهٔ خاردار ---- */
 const legs=[-1,1].map(s=>{
  const L=grp(G,s*.3,Y+HIP,0);
  B(E(.27,.28,.27),Ar,0,-.05,0,L);B(Cy(.265,.2,.74,14),Ar,0,-.38,0,L);
  [-.12,-.66].forEach((y,i)=>{B(Tr(.27-i*.065,.024,20),Au,0,y,0,L).rotation.x=PI/2});
  B(Oc(.14,.75,2.3,.35),Au,0,-.38,.2,L);
  sp(L,Au,[s*.26,-.2,0],[s,.15,-.1],.045,.3);sp(L,Au,[s*.24,-.5,.02],[s,-.05,.1],.04,.26);
  const K=grp(L,0,-.72,0);
  B(E(.2,.2,.21),Ar,0,0,0,K);B(Oc(.18,1,1.3,.8),Au,0,0,.17,K);sp(K,Au,[0,0,.3],[0,.1,1],.06,.32);
  B(Cy(.2,.15,.66,14),Ar,0,-.34,0,K);B(Bx(.06,.58,.05),Au,0,-.34,.17,K);B(Tr(.17,.02,18),Au,0,-.55,0,K).rotation.x=PI/2;
  sp(K,Au,[s*.19,-.3,0],[s,.1,-.2],.04,.26);
  const F=grp(K,0,-.66,0);
  B(Cy(.15,.17,.14,14),Ar,0,0,0,F);B(Bx(.36,.15,.64),Ar,0,-.075,.14,F);B(Cn(.13,.36,5),Au,0,-.08,.52,F).rotation.x=PI/2;
  B(Bx(.38,.03,.2),Au,0,-.15,.3,F);sp(F,Au,[0,-.04,-.2],[0,.25,-1],.06,.24);
   {const Sm=r=>new THREE.SphereGeometry(r,6,5);
    [-.22,-.3,-.38,-.46].forEach((y,i)=>{const r=.251-.0275*i+.012;B(Cy(r,r,.05,14),Ar,0,y,0,L);B(Sm(.018),Au,s*.06,y,r*.98,L)});
    [[.1,.1,.17,.5,.5,1],[.0,.12,.2,0,.5,1],[-.1,.1,.17,-.5,.5,1]].forEach(a=>sp(K,Au,[s*a[0],a[1],a[2]],[s*a[3],a[4],a[5]],.03,.18,4));
    B(Bx(.028,.5,.04),Au,s*.12,-.34,.15,K);for(let i=0;i<4;i++)B(Sm(.016),Au,0,-.15-.1*i,.2,K);
    B(Tr(.16,.02,16),Au,0,.06,0,F).rotation.x=PI/2;[-.12,0,.12].forEach(x=>sp(F,Au,[x,-.1,.62],[0,-.1,1],.03,.18,4));B(Bx(.04,.12,.5),Au,s*.19,-.07,.14,F)}
   /* جزئیات بیشتر پا: خار ران، حلقهٔ زانو، خار کناری چکمه */
   {[0,1].forEach(i=>sp(L,Au,[s*.27,-.05-.12*i,.05],[s,.5-.3*i,.2],.04,.24-.04*i,5));
    B(Tr(.19,.014,16),Au,0,-.1,0,K).rotation.x=PI/2;
    [0,1].forEach(i=>sp(F,Au,[s*.18,-.05,.1-.14*i],[s,-.1,.3-.5*i],.03,.16,4))}
   gxMerge(F);gxMerge(K);gxMerge(L);
   return{L,K,F,s}});
 /* ---- تنه ---- */
 const TG=grp(G,0,Y+HIP,0);
 B(E(.42,.36,.34),Ar,0,.02,0,TG);
 B(E(.36,.34,.27),Sk,0,.28,0,TG);B(E(.58,.44,.36),Sk,0,.74,0,TG);
 [-1,1].forEach(s=>{
  B(E(.26,.2,.2),Sk,s*.26,.82,.2,TG);B(E(.12,.22,.12),Sk,s*.36,.5,.12,TG);B(E(.26,.14,.2),Sk,s*.22,1.07,-.05,TG);
  B(E(.2,.34,.12),Sk,s*.46,.62,-.16,TG);B(E(.1,.17,.1),Sk,s*.4,.36,.16,TG);B(E(.07,.17,.07),Sk,s*.12,1.15,.06,TG).rotation.z=s*.3;B(E(.22,.1,.16),Sk,s*.3,1.0,.1,TG);
  [.55,.4,.25].forEach(y=>B(E(.11,.075,.06),Sk,s*.1,y,.24,TG))});
 B(Cy(.15,.19,.3,12),Sk,0,1.18,0,TG);B(Cy(.24,.28,.08,18),Ar,0,1.05,0,TG);B(Tr(.26,.02,22),Au,0,1.09,0,TG).rotation.x=PI/2;
 const bt=B(GX.lathe([[.44,-.06],[.5,-.02],[.51,.18],[.45,.24]],36),Ar,0,0,0,TG);bt.scale.set(1,1,.8);
 [0,.2].forEach(y=>{const r=B(Tr(.5,.025,30),Au,0,y,0,TG);r.rotation.x=PI/2;r.scale.set(1,.8,1)});
 B(Oc(.21,1.15,1.35,.35),Au,0,.1,.42,TG);B(Oc(.13,1.1,1.3,.3),Ar,0,.1,.45,TG);B(Oc(.06,1,1.3,.5),Gm,0,.11,.48,TG);
 for(let i=0;i<11;i++){const a=(i-5)/5*PI*.85;sp(TG,Au,[Math.sin(a)*.5,.24,Math.cos(a)*.4],[Math.sin(a)*.6,1,Math.cos(a)*.5],.03,.15,4)}
 [-1,1].forEach(s=>{B(Bx(.12,.5,.42),Ar,s*.5,-.2,.05,TG).rotation.z=s*.1;sp(TG,Au,[s*.52,-.45,.05],[s*.2,-1,.1],.05,.22);B(Bx(.03,.44,.03),Au,s*.56,-.2,.26,TG)});
 const th=(pts)=>GX.strand(TG,Au,pts,.02,.012,10);
 th([[0,1.02,.35],[0,.8,.38],[0,.55,.37],[0,.28,.3]]);
 [-1,1].forEach(s=>{th([[s*.1,1.04,.33],[s*.34,1.0,.32],[s*.55,.9,.26]]);th([[s*.02,.9,.38],[s*.22,.8,.42],[s*.46,.86,.33]]);th([[s*.02,.58,.31],[s*.14,.62,.31],[s*.26,.56,.27]]);th([[s*.02,.43,.3],[s*.14,.47,.3],[s*.26,.4,.25]])});
 B(Oc(.07,1,1.5,.6),Gm,0,.98,.37,TG);B(Oc(.1,1,1.5,.45),Au,0,.98,.355,TG);
 /* پیش‌بند بنفش با نقش لوزی طلایی */
 const tg=new THREE.PlaneGeometry(.62,1.3,6,12);tg.translate(0,-.65,0);const tb=Float32Array.from(tg.attributes.position.array),tp=B(tg,Tb,0,.1,.43,TG);tp.userData.keep=1;tp.frustumCulled=false;
 /* شنل پاره */
 const cg=new THREE.PlaneGeometry(1,1,18,26),cn=cg.attributes.position.count,cb=new Float32Array(cn*3),cu=[],cv=[];
 for(let k=0;k<cn;k++){const u=cg.attributes.uv.getX(k),v=1-cg.attributes.uv.getY(k),xn=u*2-1,hw=.5+v*.95;cb[k*3]=xn*hw;cb[k*3+1]=1.02-v*2.55;cb[k*3+2]=-.3-v*.22+.18*xn*xn*(.3+v*.7);cu.push(xn);cv.push(v)}
 cg.attributes.position.array.set(cb);
 const cape=B(cg,Cp,0,0,0,TG);cape.userData.keep=1;cape.frustumCulled=false;
 /* یالِ خزی دور گردن و شانه */
  const FUR=grp(TG,0,0,0);
  const tuft=(Q,m,p,d,len,r,k)=>{const dd=new V(d[0],d[1],d[2]).normalize(),c=rr(k+3)-.5,
   A0=[p[0],p[1],p[2]],B0=[p[0]+dd.x*len*.5+c*.05,p[1]+dd.y*len*.5,p[2]+dd.z*len*.5],E0=[p[0]+dd.x*len+c*.1,p[1]+dd.y*len-len*.3,p[2]+dd.z*len];
   const mm=new THREE.Mesh(GX.tube([A0,B0,E0],u=>r*(1-.85*u),5,5),m);Q.add(mm);return mm};
  B(E(.66,.2,.42,16),Fu2,0,1.02,-.04,FUR);
  [[.38,.28,1.12,.3,18],[.58,.4,1.07,.34,24],[.8,.52,.98,.38,28],[1.0,.64,.9,.4,26]].forEach((r,j)=>{for(let i=0;i<r[4];i++){const a=i/r[4]*TAU,ad=Math.min(a,TAU-a);if(ad<(j?.62:.4))continue;
   const k=j*40+i,dr=[Math.sin(a)*(.9+j*.3),.55-j*.45,Math.cos(a)*.5],mt=(i+j)%3===0?Fu1:(i+j)%3===1?Fu2:Fu3;
   tuft(FUR,mt,[Math.sin(a)*r[0],r[2]+(rr(k)-.5)*.05,Math.cos(a)*r[1]],dr,r[3]*(.85+.4*rr(k+7)),.075+.012*j,k);
   const a2=a+.5*TAU/r[4];if(Math.min(a2,TAU-a2)>=(j?.62:.4))tuft(FUR,mt===Fu1?Fu3:Fu1,[Math.sin(a2)*r[0]*.96,r[2]-.05+(rr(k+11)-.5)*.05,Math.cos(a2)*r[1]*.96],dr,r[3]*.7,.06+.01*j,k+11)}});
  [-1,1].forEach(s=>{for(let i=0;i<6;i++)tuft(FUR,i%3===0?Fu3:i%2?Fu1:Fu2,[s*(.36+.025*i),.98-i*.07,.3],[s*.35,-1,.3],.28*(.85+.3*rr(i+s*9)),.065,i+s*9)});
gxMerge(FUR);
 /* ---- سر: کلاه‌خود مشکی با چشم‌های بنفش و تاج خاردار ---- */
 const HD=grp(TG,0,1.38,.02);
 B(E(.21,.225,.22,24),Ar,0,0,-.01,HD);B(E(.17,.18,.1,20),Ar,0,-.03,.14,HD);B(E(.09,.09,.08),Ar,0,-.15,.15,HD);
 B(Bx(.34,.03,.05),Au,0,.07,.22,HD).rotation.x=.15;B(Cn(.028,.13,4),Au,0,-.03,.26,HD).rotation.x=PI+.25;
 [-.1,-.135,-.17].forEach(y=>B(Bx(.15-(y<-.12?.04:0),.012,.01),Au,0,y,.24,HD));
 [-1,1].forEach(s=>{const e=B(E(.065,.022,.025),Eg,s*.075,.02,.236,HD);e.rotation.z=s*.35;const h=B(E(.1,.04,.03),Hl,s*.075,.02,.236,HD);h.rotation.z=s*.35;
  sp(HD,Au,[s*.2,-.05,.1],[s,-.3,.2],.025,.14);sp(HD,Au,[s*.19,.02,.0],[s,.2,-.6],.03,.18)});
 B(Cy(.22,.22,.08,24),Ar,0,.12,-.01,HD);B(Tr(.216,.025,26),Au,0,.15,-.01,HD).rotation.x=PI/2;B(Tr(.216,.02,26),Au,0,.09,-.01,HD).rotation.x=PI/2;
 B(Oc(.04,1,1.5,.6),Gm,0,.12,.215,HD);
 [[0,.5,0,0],[.11,.4,.12,.12],[.22,.28,.3,.3]].forEach(([x,h,tl])=>{[-1,1].forEach(s=>{if(!x&&s>0)return;sp(HD,Ar,[s*x,.17,.02],[s*Math.sin(tl),1,0],.055-x*.12,h,6);sp(HD,Au,[s*x+s*Math.sin(tl)*h*.82,.17+h*.82,.02],[s*Math.sin(tl),1,0],.022,h*.22,5)})});
 [-1,1].forEach(s=>{GX.strand(HD,Ar,[[s*.19,.12,-.02],[s*.3,.25,-.04],[s*.36,.46,-.06]],.055,.01,10);sp(HD,Au,[s*.355,.44,-.06],[s*.2,1,0],.02,.12,4);sp(HD,Ar,[s*.1,.16,-.2],[s*.2,.8,-.8],.04,.22,5)});
  {const Sm=r=>new THREE.SphereGeometry(r,6,5);
   for(let i=0;i<10;i++){const a=i/10*TAU;sp(HD,Au,[Math.sin(a)*.2,.16,Math.cos(a)*.2-.01],[Math.sin(a)*.4,1,Math.cos(a)*.4],.02,.1+.04*(i%2),4)}
   [-1,1].forEach(s=>{for(let k=0;k<3;k++)sp(HD,Au,[s*.19,-.04-.04*k,.12],[s,-.2-.2*k,.5],.02,.12,4);B(Oc(.025,1,1.4,.6),Gm,s*.07,.1,.225,HD);B(Bx(.14,.02,.03),Ar,s*.07,.06,.235,HD).rotation.z=s*.3;sp(HD,Fu1,[s*.03,-.17,.245],[0,-1,.2],.012,.07,4)});
   [-.04,0,.04].forEach(x=>sp(HD,Au,[x,-.2,.15],[0,-1,.4],.02,.1,4))}
  /* جزئیات بیشتر سر: خار گونه، ابروی زره‌ای، جواهرهای تاج */
  {[-1,1].forEach(s=>{for(let k=0;k<3;k++)sp(HD,Au,[s*.2,-.09-.035*k,.04],[s,-.4,-.2],.018,.1,4);B(Bx(.1,.02,.04),Ar,s*.07,.09,.235,HD).rotation.z=s*.25});
   for(let i=0;i<5;i++){const a=(i-2)*.45;B(Oc(.022,1,1.4,.6),Gm,Math.sin(a)*.222,.12,Math.cos(a)*.222,HD)}}
  gxMerge(HD);
  /* ---- چهار دست: دو دست بالا، دو دست پایین؛ ساعد زرهی، پنجهٔ طلایی ---- */
 const mkArm=(s,sx,sy,sz,up)=>{
  const A=grp(TG,s*sx,sy,sz);
  B(E(.21,.21,.21),Sk,0,0,0,A);B(E(.19,.34,.19),Sk,0,-.27,0,A);B(E(.13,.17,.12),Sk,0,-.2,.1,A);B(E(.12,.2,.11),Sk,0,-.22,-.1,A);B(E(.2,.14,.19),Sk,s*.05,.04,0,A);
  B(E(.25,.13,.24),Ar,s*.03,.1,0,A);B(Tr(.22,.022,18),Au,s*.03,.06,0,A).rotation.x=PI/2;sp(A,Au,[s*.15,.15,0],[s,1,0],.05,.32);
  const Eb=grp(A,0,-.56,0);
  B(E(.15,.15,.15),Sk,0,0,0,Eb);sp(Eb,Au,[0,0,-.13],[0,.2,-1],.055,.3);
  B(Cy(.175,.13,.54,12),Ar,0,-.3,0,Eb);B(Tr(.175,.022,16),Au,0,-.05,0,Eb).rotation.x=PI/2;B(Tr(.14,.02,16),Au,0,-.54,0,Eb).rotation.x=PI/2;
  sp(Eb,Au,[s*.15,-.25,0],[s,-.1,0],.04,.24);sp(Eb,Au,[-s*.15,-.3,0],[-s,-.1,0],.035,.2);B(Bx(.05,.4,.04),Au,0,-.3,.15,Eb);
  const H=grp(Eb,0,-.6,0);B(E(.11,.09,.12),Sk,0,-.06,0,H);B(Bx(.18,.1,.04),Ar,0,-.07,-.1,H);
  const fg=[];
  const dg=(x,z,l1,l2,cl2,rz)=>{const Pf=grp(H,x,-.12,z);if(rz)Pf.rotation.z=rz;B(Cy(.03,.025,l1,6),Sk,0,-l1/2,0,Pf);const Df=grp(Pf,0,-l1,0);B(Cy(.025,.018,l2,6),Sk,0,-l2/2,0,Df);sp(Df,Au,[0,-l2,0],[0,-1,.3],.022,cl2,4);gxMerge(Pf);gxMerge(Df);fg.push({Pf,Df})};
  [[-.075,.14],[-.025,.16],[.025,.16],[.075,.14]].forEach(a=>dg(a[0],.03,a[1],.12,.17,0));dg(-s*.12,.05,.11,.1,.14,s*.9);
   {const Sm=r=>new THREE.SphereGeometry(r,6,5);
    for(let k=0;k<3;k++)sp(A,Au,[s*(.1+.05*k),.14,-.1+.1*k],[s*(.4+.2*k),1,-.3+.3*k],.03,.2-.03*k,4);
    for(let i=0;i<6;i++){const a=i/6*TAU;B(Sm(.016),Au,Math.sin(a)*.16,-.12,Math.cos(a)*.16,Eb)}sp(Eb,Au,[s*.17,-.45,0],[s*.3,-1,0],.025,.3,4);
    [-.075,-.025,.025,.075].forEach(x=>sp(H,Au,[x,-.1,.07],[0,.3,1],.016,.08,4))}
   /* جزئیات بیشتر دست: خار شانه، حلقهٔ طلایی، تیغ ساعد، خار پشت پنجه */
   {for(let k=0;k<3;k++)sp(A,Ar,[s*(.12+.07*k),.1,.1-.1*k],[s*(.6+.3*k),.8,.3-.3*k],.04,.18-.02*k,5);
    B(Tr(.2,.012,16),Au,s*.03,.12,0,A).rotation.x=PI/2;
    B(Bx(.03,.3,.1),Au,s*.16,-.3,.02,Eb).rotation.z=s*.12;B(Bx(.03,.22,.08),Au,-s*.15,-.3,.02,Eb);B(Tr(.15,.015,16),Au,0,-.3,0,Eb).rotation.x=PI/2;
    [-.075,-.025,.025,.075].forEach(x=>sp(H,Ar,[x,-.02,-.1],[0,1,-.4],.022,.1,4))}
   gxMerge(H);gxMerge(Eb);gxMerge(A);
   return{A,Eb,H,fg,s,up}};
 const LA=[-1,1].map(s=>mkArm(s,.66,.64,.05,0)),UA=[-1,1].map(s=>mkArm(s,.8,.98,-.02,1)),ARMS=LA.concat(UA);
  {const Sm=r=>new THREE.SphereGeometry(r,6,5);
   [-1,1].forEach(s=>{[[.36,.262],[.27,.255],[.18,.25]].forEach(a=>B(E(.085,.045,.05,10),Sk,s*.075,a[0],a[1],TG));B(E(.16,.03,.05,10),Sk,s*.12,1.0,.26,TG).rotation.z=-s*.25});
   for(let i=0;i<18;i++){const a=i/18*TAU;B(Sm(.018),Au,Math.sin(a)*.47,.2,Math.cos(a)*.47*.8,TG)}
   for(let i=0;i<5;i++){B(Tr(.03,.008,8),Au,(i-2)*.12,-.08-.03*(i%2),.4,TG).rotation.y=PI/2}
   [[.17,.1],[-.17,.1],[0,.28],[0,-.08]].forEach(a=>B(Sm(.014),Au,a[0],a[1],.435,TG));
   for(let i=0;i<7;i++){const a=PI+(i-3)*.4;sp(TG,Au,[Math.sin(a)*.5,.14,Math.cos(a)*.4],[Math.sin(a)*.8,.2,Math.cos(a)*.8],.03,.16,4)}
   B(Bx(.07,.85,.03),Ar,-.05,.72,.35,TG).rotation.z=.5;for(let i=0;i<5;i++)B(Sm(.014),Au,-.05-.07*Math.sin(.5)*(i-2)*1.6,.72+.14*(i-2)*1.6,.37,TG)}
  /* جزئیات بیشتر تنه: صفحات کمربند، خارهای پشت، یقهٔ طلایی */
  {const Sm=r=>new THREE.SphereGeometry(r,6,5);
   for(let i=0;i<5;i++){const x=(i-2)*.15,z=.46-Math.abs(i-2)*.03;B(Bx(.14,.26,.03),Ar,x,-.2,z,TG);B(Sm(.016),Au,x,-.1,z+.02,TG)}
   for(let i=0;i<7;i++)sp(TG,Au,[0,1.0-i*.12,-.36-.01*i],[0,.3,-1],.035,.2-.015*i,4);
   [-1,1].forEach(s=>{B(Tr(.2,.014,16),Au,s*.3,1.05,.02,TG).rotation.x=PI/2;B(Oc(.03,1,1.4,.6),Gm,s*.22,.98,.34,TG)})}
  gxMerge(TG);
  /* ---- انیمیشن: بیکار، راه رفتن، حمله، ضربهٔ ویژه، ضربه‌خوردن، مرگ ---- */
 const IDLE=[.1,2.25,-.3,.8,-.1,1.05,-.45,-.45,0,0,0,0,.35,0,0],
  W1=[-.9,2.7,-.2,.5,.5,1.7,-.2,-.2,-.45,-.15,-.06,.1,0,.15,.1],S1=[-1.5,.5,-.5,0,-1.3,.6,-.5,-.1,.5,.3,.3,-.15,.9,-.5,.2],
  W2=[-.3,3.0,-.1,.35,-.2,2.35,-.2,.2,0,-.35,-.1,.25,0,.1,.2],S2=[-1.7,.35,-.5,0,-1.5,.5,-.4,0,0,.55,.25,-.3,.8,-.45,.35],
  LIMP=[-.1,.3,-.2,.2,-.1,.4,-.2,.1,0,.5,0,.5,.1,-.9,1.7],
  TIM={1:{wu:.3,st:.11,ho:.12,rc:.5},2:{wu:.6,st:.13,ho:.2,rc:.65}};
 const ST={t0:-1e9,kind:0,h0:-1e9,dead:0,d0:0,w:0,ph:0,lt:-1,px:0,pz:0,ok:0,sx:0,vx:0,sz:0,vz:0};
 GX.anim(G,t=>{try{
  const now=performance.now(),dt=ST.lt<0?.016:Math.min(.05,Math.max(.001,t-ST.lt));ST.lt=t;
  const ug=G.parent&&G.parent.parent,ang=G.parent?G.parent.rotation.y:0;let lx=0,lz=0,spd=0;
  if(ug){const vx=(ug.position.x-ST.px)/dt,vz=(ug.position.z-ST.pz)/dt;if(ST.ok){spd=Math.hypot(vx,vz);lx=vx*Math.cos(ang)-vz*Math.sin(ang);lz=vx*Math.sin(ang)+vz*Math.cos(ang)}ST.px=ug.position.x;ST.pz=ug.position.z;ST.ok=1}
  const br=Math.sin(t*1.5);let p=IDLE.slice(),gy=0,grx=0,gz=0,gs=BASE;
  const busy=ST.dead||ST.kind;
  ST.w+=((busy?0:Math.min(1,spd/1.2))-ST.w)*Math.min(1,dt*10);if(ST.w>.04)ST.ph+=dt*9;
  if(ST.dead){const e=(now-ST.d0)/1000,a=ez(e/.5),c=ez((e-.4)/.7),v=ez((e-1.2)/.7);p=mix(IDLE,LIMP,a);gy=-.55*a-.3*c-.5*v;grx=1.3*c;gs=Math.max(.001,BASE*(1-.97*v))}
  else{
   if(ST.kind){const e=(now-ST.t0)/1000,T=TIM[ST.kind],Wp=ST.kind===2?W2:W1,Sp=ST.kind===2?S2:S1;
    if(e>T.wu+T.st+T.ho+T.rc)ST.kind=0;
    else{const a=ez(e/T.wu),b=ez((e-T.wu)/T.st),c=ez((e-T.wu-T.st-T.ho)/T.rc);p=mix(mix(mix(IDLE,Wp,a),Sp,b),IDLE,c);if(ST.kind===2)gs=BASE*(1+.04*a*(1-c))}}
   const eh=(now-ST.h0)/1000;if(eh>=0&&eh<.7){const h=Math.exp(-eh*6)*ez(eh/.06);p[9]-=.3*h;p[11]-=.2*h;p[1]+=.3*h;p[5]+=.3*h;p[8]+=.1*h}}
  const w=ST.w,pf=ST.ph,sw=Math.sin(pf)*w;
  G.position.set(.02*Math.sin(t*.5)*(1-w)+.025*sw,gy+Y*(1-BASE)-Math.abs(Math.cos(pf))*.05*w+.012*br,p[10]);G.rotation.set(grx,0,.022*sw+.008*Math.sin(t*.5));TG.scale.set(1+.012*br,1+.01*br,1+.012*br);FUR.rotation.set(.012*Math.sin(t*1.3)-p[9]*.05,0,.015*Math.sin(t*.9)+ST.sx*.1);G.scale.set(gs,gs*(1+.005*br),gs);
  TG.rotation.set(p[9]+.012*br,p[8]+sw*.12,.012*Math.sin(t*.6));
  HD.rotation.set(p[11]-p[9]*.5+.02*Math.sin(t*.5),-p[8]*.6+.07*Math.sin(t*.37),.02*Math.sin(t*.43+2));
  ARMS.forEach((o,i)=>{const s=o.s,u=o.up,k=u?0:4;
   o.A.rotation.set(p[k]+.03*Math.sin(t*1.1+i)+sw*s*(u?-.12:.15),0,s*(p[k+1]+.03*Math.sin(t*.9+i*2)));o.Eb.rotation.set(p[k+2],0,s*p[k+3]);
   const cu2=p[12]+.06*Math.sin(t*2+i);o.fg.forEach((f,j)=>{f.Pf.rotation.x=-(.12+cu2*.9)+.04*Math.sin(t*2.3+i+j)+.05*Math.sin(t*1.4+i*1.7+j*.9);f.Df.rotation.x=-(.1+cu2*1.0)})});
  legs.forEach((g,i)=>{const q=Math.sin(pf+(i?PI:0))*w;g.L.rotation.x=q*.55+(i?-p[13]*.7:p[13]);g.K.rotation.x=Math.max(0,Math.sin(pf+(i?PI:0)+1.3))*.9*w+p[14]*(i?.3:1);g.F.rotation.x=-g.K.rotation.x*.4-g.L.rotation.x*.3});
  Eg.color.setRGB(.9+.1*Math.sin(t*3),.55+.15*Math.sin(t*2.2),1);Hl.opacity=.35+.2*Math.sin(t*2.4);
  const tx=cl(-lx*.1-p[8]*.22,.45),tz=cl(-lz*.1-Math.max(0,p[10])*.9,.55);
  ST.vx+=((tx-ST.sx)*45-ST.vx*4.2)*dt;ST.sx+=ST.vx*dt;ST.vz+=((tz-ST.sz)*45-ST.vz*4.2)*dt;ST.sz+=ST.vz*dt;
  const ca=cg.attributes.position.array,wg=.5+.5*Math.sin(t*.7);
  for(let k=0;k<cn;k++){const v=cv[k],d=Math.pow(v,1.2),sa=Math.sin(t*1.6+v*3.4+cu[k]*2.6),sb=Math.sin(t*3+v*6+cu[k]*5.5);
   ca[k*3]=cb[k*3]*(1+d*(.06+.03*wg)*sa)+d*(ST.sx*.7+.03*sb);ca[k*3+1]=cb[k*3+1]+d*.025*sb-d*Math.abs(ST.sz)*.05;ca[k*3+2]=cb[k*3+2]-d*(.07+.06*sa+.03*wg)+d*cl(ST.sz,.55)*.9-d*Math.max(0,p[9])*.4}
  cg.attributes.position.needsUpdate=true;cg.computeVertexNormals();
  const ta=tg.attributes.position.array;
  for(let k=0;k<ta.length/3;k++){const v=-tb[k*3+1]/1.3;ta[k*3]=tb[k*3]+v*ST.sx*.3;ta[k*3+2]=tb[k*3+2]+v*v*(.04*Math.sin(t*1.8+v*4+tb[k*3]*3)+cl(ST.sz,.5)*.3+Math.max(0,p[9])*.2)}
  tg.attributes.position.needsUpdate=true;tg.computeVertexNormals();
 }catch(e){console.error('dk anim',e)}});
 G.userData.dk={atk:ab=>{if(ST.dead)return;ST.t0=performance.now();ST.kind=ab?2:1},hurt:()=>{if(!ST.dead)ST.h0=performance.now()},die:()=>{ST.dead=1;ST.d0=performance.now()}};
 return G}
GX.reg('dk',gxDemonKing,gxDemonKing0);

function dojFig(g){const i=g&&g.children[0];return i&&i.children.find(o=>o.userData&&o.userData.doj)}
function dojFX(a,t,d,ab){
 const ga=unitG.get(a),gt=unitG.get(t),f=dojFig(ga);if(!ga||!gt)return;
 const own=!!CX&&CX.a===a,i=own?CX.i++:0;ab=!!ab;
 if(gt&&a!==t){const dx=gt.position.x-ga.position.x,dz=gt.position.z-ga.position.z;if(dx||dz){ga.userData.fy=Math.atan2(dx,dz);ga.userData.ft=ab?2.4:2}}
 // ضربهٔ اول و دوم کاملاً جدا: دومی ۰٫۳۲ ثانیه بعد از اولی (شمشیر دیگر)
 const ms=f?f.userData.doj.fire(i,ab,i*320):i*320+250;
 try{SFX.sword(ab?1.3:1,ms/1000-.12)}catch(e){}
 setTimeout(()=>{try{const p=gt.position.clone().add(new THREE.Vector3(0,.95,0)),q=gt.position;
  burst(p,ab?26:14,0xfff4d0,{sp:4.2,size:.14,life:.28,g:3,y:0,r:.1,h:.1});burst(p,ab?20:10,0x7fb4ff,{sp:3.4,size:.2,life:.4,g:5,y:0,r:.12,h:.1});
  if(d>0){burst(p,ab?18:9,0xffc060,{sp:2.6,size:.2,life:.5,g:6,y:0,r:.15,h:.12});ring(new THREE.Vector3(q.x,0,q.z),ab?0xffd27a:0x9fc8ff,ab?2.2:1.3,.35,.15)}
  if(ab){const P0=ga.position.clone();ring(P0,0x6aff9a,1.8,.6,.15);burst(P0,12,0x7dff6a,{sp:2,size:.22,life:.6,vy:1.4,g:-1})}
  shk=Math.max(shk,ab?.6:.3)}catch(e){}},ms)}

/* ---------- اکاناها · سامورایی کلاه‌حصیری با هائوری سبزِ اژدها‌نقش، هاکامای مشکی و کاتانا (مطابق تصویر مرجع) ---------- */
GX.haoTex=()=>GX._hao||(GX._hao=GX.tex(256,256,(x,w,h)=>{
 const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#1d5c40');g.addColorStop(.6,'#143f2d');g.addColorStop(1,'#0c2a1e');x.fillStyle=g;x.fillRect(0,0,w,h);
 for(let i=0;i<70;i++){x.strokeStyle=i%2?'rgba(6,20,14,.28)':'rgba(70,150,110,.12)';x.lineWidth=1+Math.random()*3;const X=Math.random()*w;x.beginPath();x.moveTo(X,0);x.bezierCurveTo(X+10,h*.3,X-10,h*.6,X+Math.random()*12-6,h);x.stroke()}
 for(let i=0;i<30;i++){x.fillStyle='rgba(8,26,18,.2)';x.beginPath();x.ellipse(Math.random()*w,Math.random()*h,8+Math.random()*16,10+Math.random()*26,0,0,7);x.fill()}
 const dr=(x0,y0,sc)=>{x.strokeStyle='rgba(214,170,78,.92)';x.lineWidth=3.4*sc;x.beginPath();for(let t=0;t<=1;t+=.02){const X=x0+Math.sin(t*9)*34*sc+t*30*sc,Y=y0+t*120*sc;t?x.lineTo(X,Y):x.moveTo(X,Y)}x.stroke();
  x.lineWidth=1.3*sc;for(let t=0;t<=1;t+=.045){const X=x0+Math.sin(t*9)*34*sc+t*30*sc,Y=y0+t*120*sc;x.beginPath();x.arc(X,Y,(7-5*t)*sc,0,3.4);x.stroke()}
  x.fillStyle='rgba(214,170,78,.92)';x.beginPath();x.ellipse(x0,y0-4*sc,8*sc,5*sc,.5,0,7);x.fill()};
 dr(50,8,1);dr(165,50,.9);dr(105,135,.8);
 x.fillStyle='#c9a64e';x.fillRect(0,h-9,w,9);x.fillRect(0,0,6,h);x.fillRect(w-6,0,6,h);x.fillStyle='rgba(50,30,0,.5)';x.fillRect(6,0,2,h);x.fillRect(w-8,0,2,h)},1));
GX.kasaTex=()=>GX._ks||(GX._ks=GX.tex(256,128,(x,w,h)=>{
 x.fillStyle='#2b2219';x.fillRect(0,0,w,h);
 for(let i=0;i<64;i++){x.strokeStyle=i%2?'rgba(170,125,70,.5)':'rgba(20,14,8,.6)';x.lineWidth=1.5;x.beginPath();x.moveTo(i*4,0);x.lineTo(i*4,h);x.stroke()}
 for(let j=0;j<18;j++){x.strokeStyle=j%2?'rgba(150,110,60,.45)':'rgba(15,10,6,.55)';x.lineWidth=2;x.beginPath();x.moveTo(0,j*7);x.lineTo(w,j*7);x.stroke()}
 for(let i=0;i<14;i++){x.fillStyle='rgba(30,100,70,.3)';x.beginPath();x.ellipse(Math.random()*w,Math.random()*h,10+Math.random()*20,5+Math.random()*10,0,0,7);x.fill()}
 x.strokeStyle='rgba(214,170,78,.75)';x.lineWidth=2.5;for(let k=0;k<4;k++){x.beginPath();for(let t=0;t<=1;t+=.03){const X=k*64+t*50,Y=h*.5+Math.sin(t*10+k)*18;t?x.lineTo(X,Y):x.moveTo(X,Y)}x.stroke()}},1));
GX.hakTex=()=>GX._hk||(GX._hk=GX.tex(128,128,(x,w,h)=>{
 x.fillStyle='#17171d';x.fillRect(0,0,w,h);
 for(let i=0;i<40;i++){x.strokeStyle=i%2?'rgba(0,0,0,.4)':'rgba(60,70,80,.16)';x.lineWidth=1+Math.random()*2;const X=Math.random()*w;x.beginPath();x.moveTo(X,0);x.lineTo(X+Math.random()*6-3,h);x.stroke()}
 for(let i=0;i<26;i++){x.fillStyle=i%3?'rgba(40,100,76,.14)':'rgba(200,160,70,.14)';x.beginPath();x.ellipse(Math.random()*w,Math.random()*h,3+Math.random()*12,2+Math.random()*8,Math.random()*3,0,7);x.fill()}},1,[2,1]));
function gxAka(M,team){
 const G=new THREE.Group(),P=GX.pal(M),Y=.18,TAU=Math.PI*2,PI=Math.PI,DS=THREE.DoubleSide,
  B=(g,m,x,y,z,Q)=>{const e=new THREE.Mesh(g,m);e.position.set(x||0,y||0,z||0);(Q||G).add(e);return e},
  S=(r,a,b,c)=>new THREE.SphereGeometry(r,16,10).scale(a,b,c),
  Cy=(r1,r2,l,s)=>new THREE.CylinderGeometry(r1,r2,l,s||12),Bx=(a,b,c)=>new THREE.BoxGeometry(a,b,c),
  Cn=(r,l,s)=>new THREE.ConeGeometry(r,l,s||5),Oc=(r,a,b,c)=>new THREE.OctahedronGeometry(r).scale(a,b,c),
  Tr=(r,t,s,arc)=>new THREE.TorusGeometry(r,t,8,s||24,arc),Ld=GX.lathe,
  grp=(Q,x,y,z)=>{const g=new THREE.Group();g.position.set(x||0,y||0,z||0);Q.add(g);return g},
  ring=(r,t,sg,m,y,Q,sx,sz)=>{const e=B(Tr(r,t,sg),m,0,y,0,Q);e.rotation.x=PI/2;e.scale.set(sx||1,sz||1,1);return e},
  Gr=M(0xffffff,{map:GX.haoTex(),roughness:.85,side:DS}),Gr2=P.cloth(0x1f6a52,{roughness:.8}),
  Bk=M(0xffffff,{map:GX.hakTex(),roughness:.8,side:DS}),Bk2=P.cloth(0x1a1a22,{roughness:.8}),Bl=P.leather(0x15131a),
  Au=P.metal(0xc9a24a,{roughness:.32}),St=P.metal(0xe4eaf2,{roughness:.16}),St2=M(GX.c(0x55606c),{roughness:.3,metalness:.8}),
  Gy=P.cloth(0x8a8794,{roughness:.9}),Sk=P.skin(0xe8b898),Hr=M(GX.c(0x0c0b10),{roughness:.45,clearcoat:.4,clearcoatRoughness:.4}),
  Ks=M(0xffffff,{map:GX.kasaTex(),roughness:.7,side:DS}),
  rr=i=>{const s=Math.sin(i*12.9898+4.1)*43758.5453;return s-Math.floor(s)},ez=x=>x<=0?0:x>=1?1:x*x*(3-2*x);
 // ---- پاها: شلوار مشکی، چکمهٔ بلند با بند سبز و طلایی، صندل ----
 const legs=[-1,1].map(s=>{const L=grp(G,s*.13,Y+.95,0);
  GX.strand(L,Bk2,[[0,0,0],[0,-.4,0],[0,-.8,0]],.1,.075,8);
  B(Ld([[.082,-.93],[.092,-.85],[.1,-.78],[.095,-.72]],20),Bl,0,0,0,L);
  [0,1,2].forEach(i=>ring(.098+i*.0015,.01,16,Gr2,-.74-i*.065,L));
  [-1,1].forEach(q=>{B(Bx(.03,.04,.012),Au,q*.05,-.8,.088,L);B(Bx(.014,.07,.03),Au,q*.1,-.9,0,L);B(Bx(.03,.03,.02),Au,q*.07,-.955,.11,L)});
  ring(.096,.012,16,Au,-.9,L);
  B(Bx(.14,.035,.34),Bl,0,-.975,.07,L);B(S(.08,1,.6,1.5),Bl,0,-.94,.1,L);B(Oc(.05,1,.8,1),Bl,0,-.95,.23,L);B(Bx(.12,.04,.06),Bl,0,-.965,-.1,L);
  [0,1,2].forEach(i=>B(Tr(.066,.008,10,PI),Au,0,-.945,.04+i*.07,L));
  return L});
 // ---- بالاتنه ----
 const TG=grp(G,0,Y+.95,0);
 // هاکامای پلیسه‌دار مشکی با نقش مرمری
 const hk=B(Ld([[.2,.06],[.22,-.1],[.3,-.35],[.4,-.6],[.47,-.8]],48,18,.09),Bk,0,0,0,TG);hk.scale.set(1,1,.9);
 B(Ld([[.43,-.77],[.46,-.82],[.47,-.9],[.44,-.88]],36),Gy,0,0,0,TG).scale.set(1,1,.9);
 ring(.47,.01,48,Au,-.8,TG,1,.9);
 for(let i=0;i<14;i++){const a=i/14*TAU,e=B(Bx(.02,.7,.012),Bk2,Math.sin(a)*.352,-.4,Math.cos(a)*.352*.9,TG);e.rotation.order='YXZ';e.rotation.set(-.34,a,0)}
 [-1,1].forEach(q=>{[0,1].forEach(j=>B(Oc(.03,.8,1.6,.5),Au,q*(.09+j*.13),-.66,.43+j*.01,TG))});
 // لباس زیرین مشکی، یقه و یقهٔ سفید
 B(Ld([[.2,-.02],[.2,.15],[.2,.3],[.22,.5],[.13,.66]],30),Bk2,0,0,0,TG).scale.set(1,1,.82);
 B(Ld([[.1,.62],[.12,.68],[.12,.78],[.1,.8]],20),Bk2,0,0,0,TG);
 [-1,1].forEach(q=>{const l=B(Bx(.03,.3,.012),Gy,q*.05,.55,.17,TG);l.rotation.z=q*.45;const g=B(Bx(.014,.46,.012),Gr2,q*.1,.4,.19,TG);g.rotation.z=q*.3});
 // ---- کمربند چرمی پهن با میخ، طناب سبز بافته و منگوله‌ها ----
 B(Ld([[.215,.04],[.224,.04],[.224,.2],[.215,.2]],36),Bl,0,0,0,TG).scale.set(1.05,1,.86);
 for(let i=0;i<8;i++){const a=(i-3.5)*.3;B(Oc(.014,1,1,.8),Au,Math.sin(a)*.236,.12,Math.cos(a)*.236*.86+.004,TG)}
 ring(.23,.016,40,Gr2,.12,TG,1.05,.86);ring(.23,.012,40,Gr2,.07,TG,1.05,.86);
 B(S(.04,1,1,1),Gr2,0,.1,.215,TG);
 [-1,1].forEach(q=>{GX.strand(TG,Gr2,[[q*.03,.1,.215],[q*.05,-.1,.235],[q*.04,-.3,.21]],.02,.012,10);B(Cn(.035,.12,8),Gr2,q*.04,-.36,.21,TG).rotation.x=PI;[0,1,2].forEach(i=>B(S(.012,1,1,1),Au,q*(.05-.004*i),-.05-i*.09,.235-.01*i,TG))});
 // کیسه و بند کنار کمر
 [-1,1].forEach(q=>{B(Bx(.07,.09,.04),Bl,q*.25,.06,.14,TG).rotation.y=q*.7;B(Bx(.03,.03,.012),Au,q*.26,.09,.165,TG).rotation.y=q*.7;B(Bx(.02,.1,.03),Au,q*.22,.05,.15,TG)});
 // غلاف کاتانا روی کمر چپ (سمت دیگر شمشیر)
 const sc=B(Cy(.024,.022,.95,10),Bk2,.27,-.12,-.28,TG);sc.rotation.set(-1.9,0,-.12);
 B(Cy(.03,.03,.04,10),Au,.27,.05,.07,TG).rotation.set(-1.9,0,-.12);[0,1].forEach(i=>{const r=B(Cy(.028,.028,.012,10),Au,.27-.006*i,-.05-.15*i,-.1-.3*i,TG);r.rotation.set(-1.9,0,-.12)});B(Oc(.025,1,1.2,.7),Au,.265,.02,.1,TG);
 // ---- هائوری سبز: پشت بلند و پاره‌پوره + دو پیش‌پانل جلو ----
 const NU=44,NV=26,cp=new Float32Array((NU+1)*(NV+1)*3),cuv=new Float32Array((NU+1)*(NV+1)*2),ci=[],cu=[],cv=[];
 for(let i=0;i<=NU;i++){const u=i/NU*2-1,len=1-.07*Math.abs(Math.sin(u*7+.5))-.18*Math.pow(Math.abs(Math.sin(u*14.3+1.1)*Math.sin(u*31+.4)),.8)-.1*rr(i)-(i%2?.04:0);
  for(let j=0;j<=NV;j++){const v=j/NV,th=u*(1+.7*v),R=.44+.5*v,k=i*(NV+1)+j;
   cp[k*3]=R*Math.sin(th);cp[k*3+1]=.74-v*len*1.5;cp[k*3+2]=-R*Math.cos(th)*.9-.03;cuv[k*2]=i/NU;cuv[k*2+1]=1-v;cu[k]=u;cv[k]=v;
   if(i<NU&&j<NV){const a=k,b=k+1,c=k+NV+1,d=c+1;ci.push(a,b,c,b,d,c)}}}
 const cg=new THREE.BufferGeometry();cg.setAttribute('position',new THREE.BufferAttribute(cp,3));cg.setAttribute('uv',new THREE.BufferAttribute(cuv,2));cg.setIndex(ci);cg.computeVertexNormals();
 const cape=B(cg,Gr,0,0,0,TG);cape.frustumCulled=false;const cb=new Float32Array(cp);
 const PNL=[-1,1].map(s=>{const PV=grp(TG,0,.68,0),NUp=3,NVp=12,pos=new Float32Array((NUp+1)*(NVp+1)*3),uv=new Float32Array((NUp+1)*(NVp+1)*2),ix=[];
  for(let i=0;i<=NUp;i++){const xn=i/NUp*2-1,jag=1-.07*rr(i*5+(s>0?3:9));for(let j=0;j<=NVp;j++){const v=j/NVp,k=i*(NVp+1)+j;
   pos[k*3]=s*(.15+.14*v)+xn*.1;pos[k*3+1]=-v*1.38*(j===NVp?jag:1);pos[k*3+2]=.15+.11*v+.03*Math.sin(v*4)+.02*xn*xn;uv[k*2]=i/NUp;uv[k*2+1]=1-v;
   if(i<NUp&&j<NVp){const a=k,b=k+1,c=k+NVp+1,d=c+1;ix.push(a,b,c,b,d,c)}}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();
  const pm=B(g,Gr,0,0,0,PV);pm.frustumCulled=false;
  [0,1].forEach(j=>B(Bx(.012,1.34,.01),Au,s*(.15+.14*.5)+(j?.1:-.1),-.68,.19,PV).rotation.z=s*.15);
  for(let i=0;i<5;i++)B(Cn(.035,.12,3),Gr,s*(.29)+(i-2)*.045,-1.4,.26,PV).rotation.x=PI;
  return PV});
 // ---- ردای شانه، یقه، مدال طلایی با زنجیر و منگوله، تسبیح گردن ----
 B(Cy(.045,.045,.012,16),Au,-.17,.5,.21,TG).rotation.x=PI/2;ring(.045,.006,16,Au,.5,TG,1,1).position.set(-.17,.5,.213);
 for(let i=0;i<8;i++){const a=i/8*TAU;B(Oc(.01,1,1,.8),Au,-.17+Math.cos(a)*.058,.5+Math.sin(a)*.058,.213,TG)}
 B(S(.016,1,1,1),Gr2,-.17,.5,.22,TG);
 [0,1].forEach(i=>GX.strand(TG,Au,[[-.1+i*.02,.7,.14],[-.15+i*.01,.62,.2],[-.17,.55,.215]],.006,.006,8));
 GX.strand(TG,Gr2,[[-.17,.45,.215],[-.175,.38,.22],[-.17,.3,.215]],.014,.01,8);B(Cn(.025,.09,8),Gr2,-.17,.24,.215,TG).rotation.x=PI;B(S(.011,1,1,1),Au,-.17,.34,.222,TG);
 for(let i=0;i<7;i++){const f=(i-3)*.38;B(S(.018,1,1,1),Gr2,Math.sin(f)*.118,.64-.02*Math.abs(f)+.01,Math.cos(f)*.118,TG)}
 // ---- ربان‌های پاره‌ی سبز در حال پرواز ----
 const RB=[];const mkRib=(Q,x,y,z,rx,ry,rz,w,l,ph)=>{const PV=grp(Q,x,y,z);PV.rotation.set(rx,ry,rz);const g=new THREE.PlaneGeometry(w,l,2,10);g.translate(0,-l/2,0);
  const pa=g.attributes.position.array;for(let k=0;k<pa.length/3;k++){const t=-pa[k*3+1]/l;if(t>.8)pa[k*3]+=(rr(k+ph*7)-.5)*w*.7;if(t>.9&&k%3===1)pa[k*3+1]-=.06*l}g.computeVertexNormals();
  const m=B(g,Gr,0,0,0,PV);m.frustumCulled=false;RB.push({g,b:Float32Array.from(pa),ph,l});return PV};
 [[-1,.55,.72,-.2,.2],[-1,.6,.6,-.35,.8],[-1,.5,.4,-.1,1.5],[1,.55,.72,-.2,2.3],[1,.6,.6,-.3,3],[1,.5,.4,-.1,3.7]].forEach(r=>mkRib(TG,r[0]*r[1],r[2],r[3],.2,r[0]*.5,r[0]*(1.1+rr(r[4])*.5),.13,.9+.3*rr(r[4]+2),r[4]));
 // ---- بازوها ----
 const mkArm=s=>{const A=grp(TG,s*.42,.62,0),rs=y=>{const pr=[[.06,.1],[-.1,.15],[-.34,.24],[-.55,.3],[-.64,.34]];for(let i=0;i<pr.length-1;i++)if(y<=pr[i][0]&&y>=pr[i+1][0]){const k=(pr[i][0]-y)/(pr[i][0]-pr[i+1][0]);return pr[i][1]+(pr[i+1][1]-pr[i][1])*k}return .34};
  B(S(.15,1.1,.8,.95),Gr,0,0,0,A);GX.strand(A,Bk2,[[0,0,0],[0,-.2,0],[0,-.4,0]],.075,.065,8);
  B(Ld([[.1,.06],[.15,-.1],[.24,-.34],[.3,-.55],[.34,-.64]],28,12,.06),Gr,0,0,0,A);
  ring(.34,.012,28,Au,-.64,A);
  for(let i=0;i<12;i++){const a=i/12*TAU;B(Cn(.04,.14,3),Gr,Math.sin(a)*.335,-.7,Math.cos(a)*.335,A).rotation.x=PI}
  // اژدهای طلایی روی آستین (مهره‌های کوچک پیوسته)
  for(let k=0;k<10;k++){const t=k/9,y=-.1-.5*t,ps=s*(.9+.5*Math.sin(t*9)),r=rs(y)+.012;B(S(.026-.014*t,1,1,1),Au,Math.sin(ps)*r,y,Math.cos(ps)*r,A)}
  {const ps=s*.9,r=rs(-.1)+.02,hx=Math.sin(ps)*r,hz=Math.cos(ps)*r;B(Oc(.04,1,.9,1.3),Au,hx,-.07,hz,A);[-1,1].forEach(q=>B(Cn(.01,.05,4),Au,hx+q*.02,-.03,hz,A).rotation.z=-q*.5)}
  const E=grp(A,0,-.4,0);GX.strand(E,Bk2,[[0,0,0],[0,-.2,0],[0,-.42,0]],.065,.055,8);
  B(Cy(.075,.065,.24,14),Bl,0,-.2,0,E);for(let i=0;i<5;i++)ring(.072,.008,14,Gy,-.1-i*.045,E);
  B(Cy(.068,.062,.1,14),Bl,0,-.42,0,E);B(S(.065,1,1.1,1),Sk,0,-.52,0,E);B(Bx(.1,.025,.016),Au,0,-.485,.06,E);
  for(let i=0;i<4;i++)B(S(.016,1,1.6,1),Sk,(i-1.5)*.024,-.585,.035,E);B(S(.02,1,1.4,1),Sk,-s*.06,-.52,.035,E);
  for(let i=0;i<3;i++)B(Oc(.012,1,1,1),Au,(i-1)*.03,-.45,.07,E);
  return{A,E}};
 const RA=mkArm(-1),LA=mkArm(1);
 // ---- کاتانا ----
 const sw=grp(RA.E,0,-.5,0);
 {const N=14,sh=new THREE.Shape(),L1=[],R1=[];for(let i=0;i<=N;i++){const t=i/N,y=-t*1.15,cx=.1*t*t,w=.034*(1-.35*t);L1.push([cx-w,y]);R1.push([cx+w,y])}
  sh.moveTo(L1[0][0],L1[0][1]);L1.forEach(p=>sh.lineTo(p[0],p[1]));sh.lineTo(.115,-1.2);for(let i=N;i>=0;i--)sh.lineTo(R1[i][0],R1[i][1]);
  const bg=new THREE.ExtrudeGeometry(sh,{depth:.012,bevelEnabled:false});bg.translate(0,0,-.006);B(bg,St,0,0,0,sw);
  const s2=new THREE.Shape();s2.moveTo(-.012,-.02);for(let i=0;i<=N;i++){const t=i/N;s2.lineTo(.1*t*t+.012,-t*1.1)}for(let i=N;i>=0;i--){const t=i/N;s2.lineTo(.1*t*t-.012,-t*1.1)}
  const bg2=new THREE.ExtrudeGeometry(s2,{depth:.016,bevelEnabled:false});bg2.translate(0,0,-.008);B(bg2,St2,0,0,0,sw);
  for(let i=0;i<4;i++)B(Oc(.01,1,1.6,.6),Au,.1*Math.pow((i+1)*.2,2),-(i+1)*.2*1.1,.01,sw)}
 B(Cy(.075,.075,.012,28),Au,0,0,0,sw);ring(.072,.008,28,Au,0,sw);[0,1,2,3].forEach(i=>{const a=i*PI/2;B(Oc(.014,1,1,1),Au,Math.sin(a)*.078,0,Math.cos(a)*.078,sw)});B(Cy(.026,.026,.05,10),Au,0,-.03,0,sw);
 B(Cy(.02,.02,.3,10),Gr2,0,.17,0,sw);for(let i=0;i<8;i++)B(Oc(.014,1,1.4,.5),Bk2,0,.05+i*.034,.02,sw);B(Cy(.024,.022,.02,10),Au,0,.33,0,sw);
 GX.strand(sw,Gr2,[[0,.34,0],[.03,.3,.02],[.05,.22,.03]],.01,.008,8);B(S(.012,1,1,1),Au,.05,.21,.03,sw);
 // ---- سر: صورت، موی مشکی، کلاه حصیری مخروطی ----
 const HD=grp(TG,0,.8,0),hr=.215,hy=.2;B(Cy(.075,.09,.2,12),Sk,0,0,0,HD);
 GX.head(HD,M,{skin:0xe8b898,hi:'#f4cfb4',y:hy,r:hr,ex:55,i1:'#bfe3dc',i2:'#4c8a82',i3:'#10302e',lash:'#14100e',brow:'#14100e',sl:-1,lip:'#a8685c',sm:-1,nat:1});
 B(new THREE.SphereGeometry(hr*1.07,24,16,0,TAU,0,1.25).scale(1,1.08,1.05),Hr,0,hy+.01,-.01,HD);
 for(let i=0;i<7;i++)B(Cn(.04,.12,4),Hr,(i-3)*.055,hy+.12,hr*.88,HD).rotation.x=2.4;
 [-1,1].forEach(q=>GX.strand(HD,Hr,[[q*.2,hy+.02,.06],[q*.215,hy-.1,.07],[q*.2,hy-.2,.05]],.035,.01,8));
 B(S(.045,1,2,.6),Hr,.07,hy+.04,hr*.93,HD).rotation.z=-.3;
 for(let i=0;i<6;i++){const a=(i-2.5)*.4;B(Cn(.04,.13,4),Hr,Math.sin(a)*.18,hy+.1,-Math.cos(a)*.17-.03,HD).rotation.x=-1.9}
 const HT=grp(HD,0,hy+.16,0);HT.rotation.set(.1,0,-.05);
 B(new THREE.ConeGeometry(.66,.36,48,1,true),Ks,0,.18,0,HT);ring(.66,.014,48,Au,0,HT);ring(.4,.01,36,Bk2,.18,HT);ring(.2,.01,36,Bk2,.27,HT);B(Cn(.03,.08,6),Au,0,.38,0,HT);B(S(.025,1,1,1),Au,0,.4,0,HT);
 for(let i=0;i<14;i++){const a=i/14*TAU,e=B(Bx(.012,.012,.75),Au,Math.sin(a)*.33,.18,Math.cos(a)*.33,HT);e.rotation.order='YXZ';e.rotation.set(.5,a,0)}
 for(let i=0;i<14;i++){const a=(i+.5)/14*TAU;B(Oc(.014,1,1,.8),Au,Math.sin(a)*.66,0,Math.cos(a)*.66,HT)}
 for(let i=0;i<10;i++){const a=(i+.5)/10*TAU;B(Oc(.011,1,1,.8),Bk2,Math.sin(a)*.42,.16,Math.cos(a)*.42,HT)}
 [-1,1].forEach(q=>{GX.strand(HT,Gr2,[[q*.55,0,.2],[q*.57,-.2,.22],[q*.56,-.42,.2]],.012,.01,8);B(Cn(.04,.14,8),Gr2,q*.56,-.5,.2,HT).rotation.x=PI;B(S(.016,1,1,1),Au,q*.56,-.41,.2,HT);GX.strand(HT,Bk2,[[q*.5,-.02,.3],[q*.28,-.3,.15],[q*.12,-.38,.08]],.008,.008,10)});
 [[-.5,0,.1,.5,.2],[-.42,.02,-.2,.4,.7],[-.35,.02,.3,.6,1.3]].forEach(r=>mkRib(HT,r[0],0,r[2],.3,-.5,-1.2-r[1],.1,.8+r[3]*.5,r[4]));
 // ---- جزئیات افزوده (تکه‌های ریز مطابق تصویر مرجع) ----
 {const EX=[],mk=Q=>{const g=grp(Q,0,0,0);EX.push(g);return g},
  Gd=P.cloth(0x2c8f6a,{roughness:.8}),Gk=P.cloth(0x0f3d30,{roughness:.85});
  // کلاه: حلقه‌های حصیر، فلس اژدها، بخیه لبه، نخ منگوله
  const eh=mk(HT);
  for(let i=0;i<12;i++){const y=.02+i*.028,r=.66*(1-y/.36)+.004;ring(r,.005,40,i%3?Gk:Gd,y,eh)}
  for(let i=0;i<44;i++){const y=.03+.3*(i/44),a=i*.93,r=.66*(1-y/.36)+.008,e=B(Oc(.022,1,.55,1),i%4?Gd:Au,Math.sin(a)*r,y,Math.cos(a)*r,eh);e.rotation.y=a}
  for(let i=0;i<36;i++){const a=i/36*TAU;B(Bx(.02,.008,.05),Au,Math.sin(a)*.655,-.004,Math.cos(a)*.655,eh).rotation.y=a}
  [-1,1].forEach(q=>{for(let i=0;i<8;i++)B(Cy(.003,.003,.1,4),Gr2,q*.56+(i-3.5)*.006,-.58,.2,eh);for(let i=0;i<3;i++)B(S(.01,1,1,1),Au,q*.56,-.3-i*.05,.2,eh)});
  // موی بیشتر
  const eg=mk(HD);
  for(let i=0;i<14;i++){const a=(i-6.5)*.22;B(Cn(.028,.1,4),Hr,Math.sin(a)*.2,hy+.02-.03*Math.abs(a),Math.cos(a)*.2,eg).rotation.x=2.2}
  // هم‌پوشانی جزئیات تنه
  const et=mk(TG);
  for(let i=0;i<30;i++){const u=(i/29)*2-1,th=u*1.7,R=.93,e=B(Cn(.03,.11+.05*rr(i+3),3),Gd,R*Math.sin(th),-.52-.03*rr(i),-R*Math.cos(th)*.9-.03,et);e.rotation.x=PI;e.rotation.y=-th}
  for(let i=0;i<28;i++){const u=(i/27)*2-1,th=u*1.7,R=.9;B(Oc(.016,1,1,.6),Au,R*Math.sin(th),-.38,-R*Math.cos(th)*.9-.03,et)}
  for(let i=0;i<14;i++)B(Oc(.014,1,1,.8),Au,-.13+i*.02,.1+.03*Math.sin(i),.222,et);
  for(let i=0;i<26;i++){const a=i/26*TAU,e=B(S(.017,1.4,1,1),i%2?Gd:Gk,Math.sin(a)*.232,.15-.04*(i%2),Math.cos(a)*.232*.86+.004,et);e.rotation.y=a}
  for(let i=0;i<16;i++)B(Cy(.003,.003,.16,4),Gr2,(i<8?-1:1)*.04+(i%8-3.5)*.005,-.4,.21,et);
  for(let i=0;i<16;i++){const a=i/16*TAU;B(Bx(.018,.5,.01),Bk2,Math.sin(a)*.4,-.52,Math.cos(a)*.4*.9,et).rotation.y=a}
  for(let i=0;i<20;i++){const a=rr(i)*TAU,y=-.2-rr(i+9)*.55;B(Oc(.012,1,1,.5),i%2?Au:Gd,Math.sin(a)*(.3+(-y)*.15),y,Math.cos(a)*(.3+(-y)*.15)*.9,et)}
  for(let i=0;i<10;i++)B(Tr(.012,.003,8),Au,-.17+Math.cos(i/10*TAU)*.062,.5+Math.sin(i/10*TAU)*.062,.215,et);
  for(let i=0;i<6;i++)B(Bx(.006,.02,.006),Au,(i<3?-1:1)*(.04+.02*(i%3)),.7-.015*(i%3),.15,et);
  // پاها
  legs.forEach((L,li)=>{const el=mk(L);for(let i=0;i<6;i++)ring(.1,.004,16,Au,-.72-i*.04,el);for(let i=0;i<5;i++)B(Oc(.01,1,1,.6),Au,Math.sin(i*1.2)*.1,-.8-i*.02,Math.cos(i*1.2)*.1,el);B(Bx(.01,.05,.01),Au,0,-.98,.28,el);B(Bx(.012,.012,.1),Gr2,0,-.95,.19,el)});
  // آستین‌ها و دستکش
  [RA,LA].forEach((R,ri)=>{const s=ri?1:-1,ea=mk(R.A);
   for(let i=0;i<18;i++){const t=i/17,y=-.12-.5*t,ps=s*(.7+.9*Math.sin(t*7+i)),r=(.15+.19*t)+.014,e=B(Oc(.02,1,.7,1),Au,Math.sin(ps)*r,y,Math.cos(ps)*r,ea);e.rotation.y=ps}
   for(let i=0;i<10;i++){const a=i/10*TAU;B(Bx(.02,.02,.008),Gd,Math.sin(a)*.345,-.62,Math.cos(a)*.345,ea).rotation.y=a}
   const ee=mk(R.E);for(let i=0;i<8;i++)ring(.07,.006,14,Bk2,-.06-i*.04,ee);for(let i=0;i<4;i++)B(Oc(.01,1,1,1),Au,(i-1.5)*.03,-.2,.075,ee)});
  // کاتانا: الماس‌های ایتو و حکاکی تیغه
  const es=mk(sw);
  for(let i=0;i<16;i++){const y=.05+Math.floor(i/2)*.034,a=(i%2)*PI+PI/4,e=B(Oc(.011,1,1.3,.6),Au,Math.sin(a)*.021,y,Math.cos(a)*.021,es);e.rotation.y=a}
  for(let i=0;i<10;i++){const t=(i+1)/11;B(Oc(.009,.6,2.2,.5),Au,.1*t*t+.001,-t*1.05,.008,es)}
  B(Bx(.05,.02,.04),Au,0,-.06,0,es);
  // گردن‌بند و نشان
  for(let i=0;i<6;i++)B(S(.01,1,1,1),Au,-.17+(i-2.5)*.004,.44-i*.025,.219,et);
  // کمر: کیسه و بند
  [-1,1].forEach(q=>{for(let i=0;i<6;i++)B(Oc(.01,1,1,.6),Au,q*.25+(i-2.5)*.01*q,.06,.16,et)});
  let pc=0;G.traverse(o=>{if(o.isMesh)pc++});G.userData.parts=pc;
  EX.forEach(g=>gxMerge(g))}
 // ---- انیمیشن ----
 const IDLE=[-.25,.12,-.45,0,.8],WU=[-2.5,.5,-.9,-.3,.3],SK=[-1.3,-.4,-.3,.2,-.5],WUB=[-2.7,.7,-1,-.4,.3],SKB=[-1.4,-.5,-.25,.25,-.6];
 const BI=[0,0,0],BW=[.5,-.06,-.08],BS=[-.45,.28,.2],BWB=[.8,-.14,-.15],BSB=[-.8,.45,.3];
 const mix=(a,b,k)=>a.map((v,i)=>v+(b[i]-v)*k),TIM={n:{wu:.22,st:.14,ho:.05,rc:.4},b:{wu:.38,st:.17,ho:.2,rc:.55}};
 const SL=[],SW={x:0,vx:0,z:0,vz:0,px:0,py:0,pz:0,lt:-1,ok:0},cl=(v,a)=>v<-a?-a:v>a?a:v;
 const trG=(()=>{const N=22,pos=[],idx=[],p0=[-.7,1.05],p1=[.2,1.15],p2=[1.2,-.5];for(let i=0;i<=N;i++){const s=i/N,x=(1-s)*(1-s)*p0[0]+2*(1-s)*s*p1[0]+s*s*p2[0],y=(1-s)*(1-s)*p0[1]+2*(1-s)*s*p1[1]+s*s*p2[1],
  tx=2*(1-s)*(p1[0]-p0[0])+2*s*(p2[0]-p1[0]),ty=2*(1-s)*(p1[1]-p0[1])+2*s*(p2[1]-p1[1]),l=Math.hypot(tx,ty)||1,nx=-ty/l,ny=tx/l,w=.2*Math.pow(Math.sin(PI*s),.7);
  pos.push(x+nx*w,y+ny*w,0,x-nx*w,y-ny*w,0);if(i<N)idx.push(2*i,2*i+1,2*i+2,2*i+1,2*i+3,2*i+2)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);return g})();
 const trM=new THREE.MeshBasicMaterial({color:0xcfffe8,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:DS,toneMapped:false}),tr=new THREE.Mesh(trG,trM);
 tr.position.set(-.42,.62,0);tr.rotation.y=-PI/2;tr.visible=false;TG.add(tr);tr.raycast=()=>{};Object.defineProperty(tr,'castShadow',{get:()=>false,set:()=>{}});
 // ---- انیمیشن‌های افزوده: نفس‌کشیدن، نگاه، تاب کلاه، چرخش کاتانا، ارواح سبز، برگ‌های افتان، درخشش تیغه، هالهٔ تلپورت ----
 const GL=GX._gl||(GX._gl=GX.tex(64,64,(x,w,h)=>{const g=x.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.3,'rgba(255,255,255,.5)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,w,h)},1));
 const TL=GX._tl||(GX._tl=GX.tex(8,64,(x,w,h)=>{const g=x.createLinearGradient(0,h,0,0);g.addColorStop(0,'rgba(150,255,200,.9)');g.addColorStop(.5,'rgba(90,255,160,.35)');g.addColorStop(1,'rgba(60,255,140,0)');x.fillStyle=g;x.fillRect(0,0,w,h)},1));
 const AM=(c,o)=>new THREE.MeshBasicMaterial(Object.assign({color:c,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:DS,toneMapped:false},o||{})),
  SM=(c,o)=>new THREE.SpriteMaterial(Object.assign({map:GL,color:c,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false},o||{})),
  nr=o=>{o.raycast=()=>{};Object.defineProperty(o,'castShadow',{get:()=>false,set:()=>{}});return o};
 const AX=grp(G,0,0,0),vtmp=new THREE.Vector3(),H_={a:0,hv:0,w:0,was:0};
 // ارواح سبز دور بدن
 const WS=[0,1,2,3,4,5,6].map(i=>{const s=new THREE.Sprite(SM(i%3?0x6dffa8:0xffe08a));AX.add(s);return s});
 // برگ‌های افتان
 const lvM=AM(0x7dffa8,{opacity:.75}),LV=[0,1,2,3,4,5].map(i=>{const m=nr(new THREE.Mesh(new THREE.PlaneGeometry(.09,.05),lvM));AX.add(m);return m});
 // حلقهٔ چرخان روی زمین
 const GRg=grp(AX,0,.06,0),grM=AM(0x5dffa0);[0,PI].forEach(r=>{const m=nr(new THREE.Mesh(Tr(.82,.014,40,PI*.6),grM));m.rotation.x=PI/2;m.rotation.z=r;GRg.add(m)});
 // درخشش روی تیغه
 const gl=new THREE.Sprite(SM(0xe8fff4));gl.scale.setScalar(.3);sw.add(gl);
 // هالهٔ پشت اکانا هنگام تلپورت
 const HL=grp(G,0,.95,0),cnG=new THREE.ConeGeometry(.6,2.8,24,1,true).rotateX(PI/2).translate(0,0,1.4),cnM=AM(0xaaffd0,{map:TL}),cn=nr(new THREE.Mesh(cnG,cnM));HL.add(cn);
 const rgM=[0,1,2,3].map(i=>{const m=AM(i%2?0xffffff:0x7dffb0),r=nr(new THREE.Mesh(Tr(.62-.06*i,.032-.005*i,40),m));r.position.z=.35+i*.42;HL.add(r);return m});
 const SP=[0,1,2,3,4].map(i=>{const s=new THREE.Sprite(SM(i?0x6dffb0:0xb8ffd8));s.position.z=[0,.5,1,1.6,2.2][i];s.scale.setScalar([2.6,1.8,1.4,1,.7][i]);HL.add(s);return s});
 HL.visible=false;
 // اسلش دوم (ضربهٔ ضربدری) برای قابلیت
 const trM2=trM.clone(),tr2=new THREE.Mesh(trG,trM2);tr2.position.set(-.42,.62,0);tr2.rotation.set(0,-PI/2,1.0);tr2.visible=false;TG.add(tr2);tr2.raycast=()=>{};Object.defineProperty(tr2,'castShadow',{get:()=>false,set:()=>{}});
 const akHalo=d=>{const n=performance.now();if(n>H_.w){try{G.getWorldPosition(vtmp);vtmp.y=0;window.ring(vtmp,0x6aff9a,1.8,.5,.12);burst(vtmp,14,0x9dffc4,{sp:2.5,size:.26,life:.6,g:1,y:.3})}catch(e){}}H_.w=n+d+1700};
 const AKX=(t,dt,nw,lx,lz)=>{const now=performance.now(),br=Math.sin(t*1.5),ib=nw?0:1;
  // نفس‌کشیدن و جابه‌جایی وزن
  G.rotation.y=ib*.035*Math.sin(t*.37);G.rotation.z=ib*.012*Math.sin(t*.53+1);
  TG.position.y=Y+.95+.012*br;TG.rotation.x+=.012*br*ib;
  RA.A.rotation.z+=.02*Math.sin(t*1.5+.3);LA.A.rotation.z+=.02*Math.sin(t*1.5+1.3);
  // نگاه به اطراف
  HD.rotation.y+=ib*Math.sin(t*.21)*Math.pow(Math.max(0,Math.sin(t*.47)),2)*.6;HD.rotation.x+=ib*.05*Math.sin(t*.33);
  // تاب خوردن کلاه
  HT.rotation.set(.1+.03*Math.sin(t*1.2)+cl(SW.z,.5)*.2,.04*Math.sin(t*.45),-.05+.03*Math.sin(t*.9+1)-cl(SW.x,.5)*.3);
  // دست چپ
  LA.A.rotation.x+=.03*Math.sin(t*.7);LA.E.rotation.x+=.05*Math.sin(t*.9);
  // چرخاندن کاتانا هر چند ثانیه
  const fc=t%12;if(!nw&&fc<1.8){const fl=Math.sin(fc/1.8*PI);RA.A.rotation.x-=fl*.45;RA.E.rotation.x-=fl*.5;sw.rotation.x-=fl*.3;sw.rotation.y=ez(fc/1.8)*TAU*2}
  // ارواح
  WS.forEach((w,i)=>{if(i>=Math.ceil(7*window.__FXQ)){w.visible=false;return}const p=(i*.37+t*.06)%1,f=Math.sin(p*PI),a=t*(.5+.08*i)+i*TAU/7,r=.75+.12*Math.sin(t*.7+i*2);w.position.set(Math.sin(a)*r,.35+.95*p+.08*Math.sin(t*2+i),Math.cos(a)*r);w.material.opacity=.75*f*(.7+.3*Math.sin(t*5+i));w.scale.setScalar(.14+.14*f)});
  // برگ‌ها
  LV.forEach((l,i)=>{if(i>=Math.ceil(6*window.__FXQ)){l.visible=false;return}const p=(t*.12+i/6)%1,a=p*9+i*2;l.position.set(Math.sin(a*.7+i)*.9,2.1-p*2.0,Math.cos(a*.6+i*1.7)*.9);l.rotation.set(a*1.3,a*.9,a*1.7);l.scale.setScalar(Math.max(.01,Math.sin(p*PI)))});
  // حلقهٔ زمین
  GRg.rotation.y=t*.9;grM.opacity=.28+.12*Math.sin(t*2);
  // درخشش تیغه
  {const f=(t*.25)%1,s=f/.35;if(s<1){gl.position.set(.1*s*s,-s*1.1,.02);gl.material.opacity=Math.sin(s*PI)*.9}else gl.material.opacity=0}
  // هالهٔ تلپورت: فقط هنگام قابلیت و وقتی واقعاً در حال سُر خوردن است
  const spd=Math.hypot(lx,lz),act=now<H_.w,tg=act?Math.min(1,Math.max(0,(spd-1.5)/5)):0;
  H_.hv+=(tg-H_.hv)*Math.min(1,dt*(tg>H_.hv?20:3.5));
  if(act&&spd>1.2){const ta=Math.atan2(-lx,-lz);let d=ta-H_.a;d=Math.atan2(Math.sin(d),Math.cos(d));H_.a+=d*Math.min(1,dt*14)}
  const hv=H_.hv;HL.visible=hv>.015;
  if(HL.visible){HL.rotation.y=H_.a;HL.scale.set(1+.15*Math.sin(t*30),1+.15*Math.cos(t*27),.55+.9*hv);cnM.opacity=.8*hv;rgM.forEach((m,i)=>m.opacity=hv*(.85-.18*i));SP.forEach((s,i)=>s.material.opacity=hv*(i?.55-.08*i:.9))}
  try{if(hv>.25){G.getWorldPosition(vtmp);vtmp.y=0;burst(vtmp,2,0x7dffb0,{sp:1.2,size:.24,life:.55,g:-.5,y:.8,r:.5,h:.9,vy:.5})}
   if(H_.was&&hv<.3&&spd<1.5){H_.was=0;G.getWorldPosition(vtmp);vtmp.y=0;window.ring(vtmp,0x6aff9a,2.0,.5,.12);window.ring(vtmp,0xffffff,1.1,.35,.14);burst(vtmp,18,0x9dffc4,{sp:3,size:.26,life:.6,g:2,y:.2,vy:1.6})}}catch(e){}
  if(hv>.55)H_.was=1;
  // اسلش دوم
  let o2=0;if(nw&&nw.sl.big){const k=(nw.e-TIM.b.wu)/(TIM.b.st+.14)-.15;if(k>0&&k<1){o2=Math.pow(Math.sin(k*PI),.6)*.8;tr2.scale.setScalar(1.25*(.85+.25*k))}}
  tr2.visible=o2>0;trM2.opacity=o2};
 GX.anim(G,t=>{const now=performance.now(),dt=SW.lt<0?.016:Math.min(.05,Math.max(.001,t-SW.lt));SW.lt=t;
  const br=Math.sin(t*1.5),el=G.matrixWorld.elements;
  for(let i=SL.length-1;i>=0;i--){const T=SL[i].big?TIM.b:TIM.n;if((now-SL[i].t0)/1000>T.wu+T.st+T.ho+T.rc)SL.splice(i,1)}
  let nw=null;SL.forEach(sl=>{const e=(now-sl.t0)/1000;if(e>=0&&(!nw||sl.t0>nw.sl.t0))nw={sl,e}});
  let ap=IDLE,bp=BI;if(nw){const T=nw.sl.big?TIM.b:TIM.n,W=nw.sl.big?WUB:WU,K=nw.sl.big?SKB:SK,a=ez(nw.e/T.wu),b=ez((nw.e-T.wu)/T.st),c=ez((nw.e-T.wu-T.st-T.ho)/T.rc);ap=mix(mix(mix(IDLE,W,a),K,b),IDLE,c);
   const BWx=nw.sl.big?BWB:BW,BSx=nw.sl.big?BSB:BS;bp=mix(mix(mix(BI,BWx,a),BSx,b),BI,c)}
  let lx=0,lz=0;if(SW.ok){const vx=(el[12]-SW.px)/dt,vy=(el[13]-SW.py)/dt,vz=(el[14]-SW.pz)/dt,ax=el[0]*el[0]+el[1]*el[1]+el[2]*el[2]||1,az=el[8]*el[8]+el[9]*el[9]+el[10]*el[10]||1;lx=(vx*el[0]+vy*el[1]+vz*el[2])/ax;lz=(vx*el[8]+vy*el[9]+vz*el[10])/az}
  SW.px=el[12];SW.py=el[13];SW.pz=el[14];SW.ok=1;
  const tx=cl(-lx*.1-bp[0]*.25,.45),tz=cl(-lz*.1-Math.max(0,bp[1])*.9,.55);
  SW.vx+=((tx-SW.x)*45-SW.vx*4.2)*dt;SW.x+=SW.vx*dt;SW.vz+=((tz-SW.z)*45-SW.vz*4.2)*dt;SW.z+=SW.vz*dt;
  G.position.z=bp[1];G.position.y=.01*Math.sin(t*2)-.04*Math.max(0,bp[1]);
  legs[0].rotation.x=-bp[1]*.8;legs[1].rotation.x=bp[1]*.6;
  TG.rotation.set(bp[2]+.008*br,bp[0],.01*Math.sin(t*.6));TG.scale.y=1+.006*br;
  HD.rotation.set(-bp[2]*.4+.02*Math.sin(t*.5),-bp[0]*.5+.05*Math.sin(t*.37),.02*Math.sin(t*.43+2));
  RA.A.rotation.set(ap[0]+.015*Math.sin(t*.9),0,-ap[1]);RA.E.rotation.set(ap[2],0,0);sw.rotation.set(ap[3],0,ap[4]);
  LA.A.rotation.set(.05+.02*Math.sin(t*1.1)+bp[0]*.2,0,.12+.02*Math.sin(t*.9+1));LA.E.rotation.set(-.25,0,0);
  let op=0;if(nw){const Tm=nw.sl.big?TIM.b:TIM.n,k=(nw.e-Tm.wu)/(Tm.st+.14);if(k>0&&k<1){op=Math.pow(Math.sin(k*PI),.6)*(nw.sl.big?.95:.8);tr.visible=true;trM.opacity=op;tr.scale.setScalar((nw.sl.big?1.15:.95)*(.85+.25*k))}}
  if(!op){tr.visible=false;trM.opacity=0}
  PNL.forEach((PV,i)=>{PV.rotation.x=-(.03+.03*Math.sin(t*1.3+i))+SW.z*.4-Math.max(0,bp[1])*.2;PV.rotation.z=SW.x*.25});
  hk.scale.set(1+.015*Math.sin(t*1.2)+Math.abs(SW.x)*.08,1,.9+Math.max(0,SW.z)*.1);
  RB.forEach(o=>{const a=o.g.attributes.position.array,n=a.length/3;for(let k=0;k<n;k++){const tt=-o.b[k*3+1]/o.l;a[k*3]=o.b[k*3]+Math.sin(t*2.4+o.ph+tt*5)*.12*tt*o.l+SW.x*tt*.4;a[k*3+1]=o.b[k*3+1];a[k*3+2]=o.b[k*3+2]+Math.sin(t*1.8+o.ph*1.3+tt*4)*.1*tt*o.l-SW.z*tt*.3}o.g.attributes.position.needsUpdate=true});
  const a=cg.attributes.position.array,n3=cu.length,wg=.5+.5*Math.sin(t*.7);
  for(let k=0;k<n3;k++){const v=cv[k],d=Math.pow(v,1.25),sa=Math.sin(t*1.6+v*3.2+cu[k]*2.5),sb=Math.sin(t*2.9+v*5.5+cu[k]*5);
   a[k*3]=cb[k*3]*(1+d*(.05+.03*wg)*sa)+d*(SW.x*.7+.03*sb);a[k*3+1]=cb[k*3+1]+d*.025*sb-d*Math.abs(SW.z)*.05;a[k*3+2]=cb[k*3+2]-d*(.06+.06*sa+.03*wg)+d*cl(SW.z,.55)*.9}
  cg.attributes.position.needsUpdate=true;cg.computeVertexNormals();AKX(t,dt,nw?nw:null,lx,lz)});
 G.userData.aka={fire:(ab,delay)=>{const d=delay||0,T=ab?TIM.b:TIM.n;SL.push({t0:performance.now()+d,big:!!ab});if(ab)akHalo(d);return d+(T.wu+T.st*.5)*1000}};
 return G}
GX.reg('aka',gxAka);
function akaFig(g){const i=g&&g.children[0];return i&&i.children.find(o=>o.userData&&o.userData.aka)}
function akaFX(a,t,d,ab){const ga=unitG.get(a),f=akaFig(ga);if(!ga||!f)return;f.userData.aka.fire(!!ab,0)}

function mkUnit(u){
 const h=H[u.k],g=new THREE.Group(),s=['ali','mak','cri','doj','dk','fd','ft','acro','aka'].includes(u.k)?.85:.85+.3*Math.min(1,h.hp/4200),team=new THREE.Color(TEAM[u.o]),acc=team.clone(),pale=team.clone().lerp(new THREE.Color(0xffffff),.3),dark=team.clone().multiplyScalar(.7);
 const mats=[];const M=(c,o)=>{const m=new (o&&o.clearcoat!=null?THREE.MeshPhysicalMaterial:THREE.MeshStandardMaterial)(Object.assign({color:c,roughness:.6,emissive:0x000000},o||{}));mats.push(m);return m};
 const base=new THREE.Mesh(GEO.base,M(dark));base.position.y=.09;
 const ranged=h.r>1,body=new THREE.Mesh(ranged?GEO.cone:GEO.body,M(acc));body.position.y=ranged?.18+.62:.18+.45;
 const head=new THREE.Mesh(GEO.head,M(pale));head.position.y=ranged?1.62:1.32;
 const band=new THREE.Mesh(GEO.band,M(0xf3ead8));band.rotation.x=Math.PI/2;band.position.y=.5;
 const inner=new THREE.Group();inner.add(body,head,band);inner.scale.setScalar(s);inner.rotation.y=u.o===0?Math.PI:0;
 let fig=null,figM=[];if(FIG[u.k]){const n0=mats.length;fig=FIG[u.k](M,team);mats.slice(n0).forEach(m=>{m.userData.nt=1});fig.traverse(o=>{if(o.isMesh){o.castShadow=true;o.userData.u=u;figM.push(o)}});[body,head,band].forEach(m=>{m.material.visible=false});inner.add(fig)}
 [base,body,head,band].forEach(m=>{m.castShadow=true;m.userData.u=u});pickables.push(base,body,head);figM.forEach(m=>pickables.push(m));
 const shield=new THREE.Mesh(GEO.shield,new THREE.MeshBasicMaterial({color:0xffd34d}));shield.rotation.x=Math.PI/2;shield.position.y=.9;
 const hack=new THREE.Mesh(GEO.shield,new THREE.MeshBasicMaterial({color:0x39ff88}));hack.rotation.x=Math.PI/2;hack.position.y=.12;hack.scale.setScalar(.95);
 const cage=new THREE.Mesh(GEO.cage,new THREE.MeshBasicMaterial({color:0x111111,wireframe:true}));cage.position.y=.95;
 const lb=mkLabel();lb.sp.position.set(0,.1,.72);
 g.add(inner,shield,hack,cage,lb.sp);if(FIG[u.k]){const rg=new THREE.Mesh(new THREE.TorusGeometry(.7,.035,8,48).rotateX(Math.PI/2),new THREE.MeshBasicMaterial({color:team,toneMapped:false}));rg.position.y=.19;g.add(rg)}
 g.position.set(CELL_X(u.c),0,CELL_Z(u.c,u.r));
 g.userData={mats,shield,hack,cage,lb,pick:[base,body,head,...figM],y0:u.o===0?Math.PI:0,fy:0,ft:0,tx:g.position.x,tz:g.position.z,ty:0,flash:0,last:u.hp,tint:[0,0,0],s,em:[team.r*.28,team.g*.28,team.b*.28]};
 scene.add(g);return g}
function popup(txt,pos,col){
 const c=document.createElement('canvas');c.width=256;c.height=96;const x=c.getContext('2d');x.direction='ltr';x.font='bold 64px '+FONT;x.textAlign='center';x.textBaseline='middle';
 x.lineWidth=8;x.strokeStyle='#000';x.strokeText(txt,128,48);x.fillStyle=col;x.fillText(txt,128,48);
 const t=new THREE.CanvasTexture(c),sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false,toneMapped:false}));
 sp.scale.set(2.2,.83,1);sp.position.set(pos.x,pos.y+2.9,pos.z);sp.renderOrder=20;scene.add(sp);pops.push({sp,t:0})}

/* ===== جان نمایشی: کم شدن جان هدف دقیقاً همزمان با رسیدن ضربه (منطق بازی بدون تغییر) ===== */
function vhp(u){const q=u.vq;if(!q||!q.length){u.vq=null;return u.hp}const n=performance.now();while(q.length&&q[0].at<=n){u.vb=q[0].hp;q.shift()}if(!q.length){u.vq=null;return u.hp}return u.vb}
function queueVis(t,h0,dl){if(!(dl>0)&&!(t.vq&&t.vq.length))return;if(!t.vq||!t.vq.length){t.vb=h0;t.vq=[];t.vc=t.c;t.vr=t.r}
 t.vq.push({at:performance.now()+Math.max(0,dl),hp:t.hp});setTimeout(()=>{try{draw()}catch(e){}},Math.max(0,dl)+40)}
function hitDelay(a,t){if(a.k==='acro'&&CX&&CX.a===a&&CX.ab){const n=CX.ai|0;CX.ai=n+1;return n*210+170}if(a.k==='acro')return 270;if(a.k==='pri')return 270;
const ga=unitG.get(a),gt=unitG.get(t),k=a.k,own=!!CX&&CX.a===a,ab=own&&CX.ab,i=own?(CX.i|0):0,D=ga&&gt?ga.position.distanceTo(gt.position):1,dc=Math.max(1,dist(a,t)),
 fl=(spd,mn)=>Math.max(mn||180,D*spd*1000);
 if(k==='cri')return ab?530:370;
 if(k==='dk')return ab?720:390;
 if(k==='mak')return 280+Math.max(90,Math.min(280,D*34));
 if(k==='ali')return (ab?800:340)+Math.max(90,Math.min(280,D*34));
 if(k==='doj')return i*320+(ab?490:270);
 if(k==='dw'){if(ab)return 260;if(window.DWSPL)return window.DWD||300;const dd=Math.max(180,D*50)+30;window.DWD=dd;return dd}
 if(k==='fd')return ab?(dc-1)*130+120:580;
 if(k==='ft')return 260+i*90;
 if(k==='zep')return 60+(dc-1)*40;
 if(k==='gq')return a.fire?(dc-1)*130+100:60+(dc-1)*40;
 if(k==='mac'){if(ab)return 0;return dc===1?(dc-1)*130+120:i*45+40}
 if(k==='jack')return i*70+fl(.03);
 if(k==='que')return fl(.04);
 if(k==='bud')return ab?0:fl(.05);
 if(k==='raf')return 270+Math.max(180,D*45);if(MAGC[k])return fl(.05);
 if(k==='mar')return 60;
 return 0}
function paintLabel(u,g){const d=g.userData,sl=sel_===u,v=vhp(u),p=Math.max(0,Math.min(1,v/u.max));
 plate(d.lb.cv.getContext('2d'),H[u.k].n+((u.bbv!=null?u.bbv:u.bb|0)>0?' 💣×'+PX(u.bbv!=null?u.bbv:u.bb):''),PX(Math.round(v)),p,CL[u.o],sl,p>.5?'#4cd964':p>.25?'#ffcc00':'#ff3b30');
 d.lb.tex.needsUpdate=true;d.lb.sp.renderOrder=sl?30:10}
let sel_=null;
function hid(u){return phase!=='play'&&u.o!==(ONLINE?ME:P)}
function syncUnits(){
 sel_=sel;
 for(const [u,g] of [...unitG]){if(!U.includes(u)){if(phase==='play'&&u.vq){const v0=vhp(u);if(u.vq){const d0=Math.round(v0)-Math.round(g.userData.last);if(d0<0){popup('-'+PX(-d0),g.position,'#ff5a4d');g.userData.flash=1}g.userData.last=v0;g.visible=true;paintLabel(u,g);continue}}
  if(u.hp<=0&&g.userData.last>0)popup('-'+PX(Math.round(g.userData.last)),g.position,'#ff5a4d');
  scene.remove(g);g.traverse(o=>{if(o.material){if(o.material.map)o.material.map.dispose();o.material.dispose()}});g.userData.pick.forEach(m=>{const i=pickables.indexOf(m);if(i>=0)pickables.splice(i,1)});unitG.delete(u)}}
 U.forEach(u=>{let g=unitG.get(u);if(!g){g=mkUnit(u);unitG.set(u,g)}const d=g.userData;g.visible=!hid(u);const vh=vhp(u),pc=u.vq?u.vc:u.c,pr=u.vq?u.vr:u.r;
  {const nx=CELL_X(pc),nz=CELL_Z(pc,pr),mx=nx-d.tx,mz=nz-d.tz;if(mx*mx+mz*mz>.04){d.fy=Math.atan2(mx,mz);d.hf=1}d.tx=nx;d.tz=nz}d.ty=u.fly>0?1.1:0;
  const df=Math.round(vh)-Math.round(d.last);if(df<0){popup((df<0?'-':'+')+PX(Math.abs(df)),g.position,'#ff5a4d');d.flash=1}else if(df>0)popup('+'+PX(df),g.position,'#5dff8a');d.last=vh;
  d.tint=u.fr>0?[.1,.35,.8]:u.is>0?[.45,.85,.95]:u.fz>0?[.05,.3,.9]:u.ra>0?[.5,.1,.75]:u.cu>0?[.02,.12,.06]:u.sl>0?[.05,.18,.4]:[0,0,0];spVis(u,g,d);
  d.shield.visible=u.sh>0;d.hack.visible=!!u.hk;d.cage.visible=u.jl>0;
  d.mats.forEach(m=>{m.transparent=!!u.inv;m.opacity=u.inv?.4:1});
  paintLabel(u,g)})}
function syncStatues(){
 while(stGroup.children.length){const o=stGroup.children.pop();o.traverse(q=>{if(q.material){if(q.material.map)q.material.map.dispose();q.material.dispose()}})}
 ST.forEach(s=>{const m=new THREE.Mesh(GEO.stone,new THREE.MeshStandardMaterial({color:0x8a8a8a,roughness:.95}));m.position.set(CELL_X(s.c),.45,CELL_Z(s.c,s.r));m.castShadow=true;stGroup.add(m);
  const c=document.createElement('canvas');c.width=LW;c.height=LH;plate(c.getContext('2d'),H[s.k].n.split(' ')[0],PX(Math.round(s.heal)),s.heal/s.max,'#8a8a8a',false,'#7cc4ff');
  const t=new THREE.CanvasTexture(c),sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false,toneMapped:false}));sp.scale.set(LW/LU,LH/LU,1);sp.position.set(m.position.x,1.45,m.position.z+.3);sp.renderOrder=10;stGroup.add(sp)})}
function syncTiles(){
 const my=mine()&&sel&&sel.o===P,mvT=my&&!over?reach(sel):{},hitT=my&&!sel.act&&!sel.mo&&!over?U.filter(t=>canHit(sel,t)):[],abL=my&&mode==='ab'?abT(sel):[],swT=my&&mode==='mv'?swapMates(sel):[];
 hlTiles=[];
 for(let c=0;c<COLS;c++)for(let r=0;r<ROWS;r++){let f=0;
  if((c+','+r) in mvT&&mode==='mv')f=0x2ec86e;
  if(swT.some(t=>t.c===c&&t.r===r))f=0x14b8a6;
  if(abL.some(t=>t.c===c&&t.r===r))f=0xf5c832;
  if(mode==='mv'&&hitT.some(t=>t.c===c&&t.r===r))f=0xe63c3c;
  if(phase!=='play'&&(P===0?r>=4:r<4))f=(ONLINE||!P)?0x5a1a15:0x12336a;const m=tiles[c][r].material;m.emissive.setHex(f);m.emissiveIntensity=f?.6:0;if(f)hlTiles.push(m)}
 if(sel){ringMesh.visible=true;ringMesh.position.set(CELL_X(sel.c),.03,CELL_Z(sel.c,sel.r))}else ringMesh.visible=false}
function loop(){
 requestAnimationFrame(loop);const dt=Math.min(.05,clock.getDelta()),t=clock.elapsedTime;
 unitG.forEach((g,u)=>{const d=g.userData,k=1-Math.exp(-dt*10);
  if(!d.anim){g.position.x+=(d.tx-g.position.x)*k;g.position.z+=(d.tz-g.position.z)*k;
  g.position.y+=(d.ty+(u.fly>0?.12*Math.sin(t*3):0)-g.position.y)*k}
  d.flash=Math.max(0,d.flash-dt*2.5);d.mats.forEach(m=>{const q=m.userData.nt?0:1,w=m.userData.nt?.45:1;m.emissive.setRGB(d.em[0]*q+d.tint[0]*w+d.flash*.8,d.em[1]*q+d.tint[1]*w+d.flash*.1,d.em[2]*q+d.tint[2]*w+d.flash*.1)});
  g.children[0].scale.setScalar(d.s*(1+(sel_===u?.04*Math.sin(t*6):0)));{const iw=g.children[0];if(d.ft>0)d.hf=1;const tg=d.hf?d.fy:d.y0;d.ft-=dt;let df=tg-iw.rotation.y;df=Math.atan2(Math.sin(df),Math.cos(df));iw.rotation.y+=df*(1-Math.exp(-dt*14))}
  if(d.shield.visible)d.shield.rotation.z=t*2});
 hlTiles.forEach(m=>m.emissiveIntensity=.5+.2*Math.sin(t*5));
 for(let i=pops.length-1;i>=0;i--){const p=pops[i];p.t+=dt;p.sp.position.y+=dt*1.1;p.sp.material.opacity=Math.max(0,1-p.t/1.4);
  if(p.t>1.4){scene.remove(p.sp);p.sp.material.map.dispose();p.sp.material.dispose();pops.splice(i,1)}}
 placeCamera();renderer.render(scene,camera)}


const SPELLS={fb:{n:'توپ آتشین',x:3,t:'v',c:0xff6a14},fz:{n:'فریز',x:3,t:'c7',c:0x7cc4ff},cu:{n:'نفرین سیاه',x:1,t:'u',c:0x1a5a30},
mi:{n:'معدنچی',x:3,s:1,t:'u',c:0xd9a441},sr:{n:'سارسار',x:2,t:'l',c:0x9fd8ff},eq:{n:'زلزله',x:3,t:'c25',c:0xb8804a},rg:{n:'عصبانیت',x:2,t:'c7',c:0xb44dff},
el:{n:'الدرلیچ',x:4,s:1,t:'u',c:0x9b6bff},pt:{n:'معجون الهی',x:1,t:'u',c:0x5dff8a},wd:{n:'زخم باز',x:1,t:'u',c:0xc01830},iv:{n:'نامرئی',x:1,t:'v',c:0xcfd6ff},
is:{n:'شوک یخی',x:1,t:'u',c:0xdff8ff},rr:{n:'ریشه‌های رز',x:2,t:'c25',c:0xff5a8a},rs:{n:'آینه‌ی رستاخیز',x:3,t:'e',c:0xfff2a0}};
const spCost=o=>SP[o].reduce((s,k)=>s+SPELLS[k].x,0);
let spHold=false,spPrev=null,spSw=false,PV=[],OV=[],HEXG=null,PLN=null,sT0=performance.now();
const V3=(c,r)=>new THREE.Vector3(CELL_X(c),0,CELL_Z(c,r));
function hexMesh(c,r,col,y){HEXG=HEXG||new THREE.CylinderGeometry(.93,.93,.03,6).rotateY(Math.PI/6);const m=new THREE.Mesh(HEXG,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0,depthWrite:false}));m.position.set(CELL_X(c),y||.03,CELL_Z(c,r));return m}
function ovAdd(m,L,op,rest){scene.add(m);OV.push({m,t:0,L,op,rest})}
function ovCells(cells,col,L,op){cells.forEach(([c,r])=>ovAdd(hexMesh(c,r,col),L,op))}
function cellsFor(t,c,r,pt){if(t==='c7')return[[c,r],...nb(c,r)];if(t==='c25'){const o=[];for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++)if(inb(c+i,r+j))o.push([c+i,r+j]);return o}
 if(t==='l'){const o=[];for(let j=0;j<ROWS;j++)o.push([c,j]);return o}
 if(t==='v'){let best=null,bd=1e9;for(let a=0;a<COLS;a++)for(let b=0;b<ROWS;b++){const[q,s]=toA(a,b);for(let i=0;i<6;i++){const T=[[q,s],[q+DIR[i][0],s+DIR[i][1]],[q+DIR[(i+1)%6][0],s+DIR[(i+1)%6][1]]].map(([x,y])=>toO(x,y)),
   cx=(CELL_X(T[0][0])+CELL_X(T[1][0])+CELL_X(T[2][0]))/3,cz=(CELL_Z(...T[0])+CELL_Z(...T[1])+CELL_Z(...T[2]))/3,d=(cx-pt.x)**2+(cz-pt.z)**2;if(d<bd){bd=d;best=T}}}
  return bd<1.7?best.filter(p=>inb(p[0],p[1])):[]}
 return[[c,r]]}
function spUpdate(e){const S=SPELLS[spl];if(!S||!camera)return;const R=cv.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-R.left)/R.width*2-1,-((e.clientY-R.top)/R.height)*2+1),camera);
 PLN=PLN||new THREE.Plane(new THREE.Vector3(0,1,0),0);const pt=new THREE.Vector3();if(!raycaster.ray.intersectPlane(PLN,pt)){spPrev=null;return spShow()}
 let c=-1,r=-1,bd=1.3;for(let a=0;a<COLS;a++)for(let b=0;b<ROWS;b++){const d=Math.hypot(CELL_X(a)-pt.x,CELL_Z(a,b)-pt.z);if(d<bd){bd=d;c=a;r=b}}
 if(c<0){spPrev=null;return spShow()}const cells=cellsFor(S.t,c,r,pt);spPrev=cells.length?{c,r,cells,pt}:null;spShow()}
function spShow(){const S=SPELLS[spl];while(PV.length<25){const m=hexMesh(0,0,0xffffff,.07);m.material.opacity=.5;m.visible=false;scene.add(m);PV.push(m)}
 PV.forEach((m,i)=>{const p=spPrev&&spPrev.cells[i];m.visible=!!p;if(p){m.position.set(CELL_X(p[0]),.07,CELL_Z(...p));m.material.color.setHex(S?S.c:0xffffff)}})}
cv.addEventListener('pointerdown',e=>{if(spl&&e.isPrimary){spHold=true;try{cv.setPointerCapture(e.pointerId)}catch(_){}spUpdate(e)}});
cv.addEventListener('pointermove',e=>{if(spHold)spUpdate(e)});
cv.addEventListener('pointerup',e=>{if(!spHold)return;spHold=false;const p=spPrev;spPrev=null;spShow();spSw=true;setTimeout(()=>spSw=false,0);if(spl&&p){if(mine())net({a:'cast',k:spl,x:p.c,y:p.r,cells:p.cells,pt:[p.pt.x,p.pt.y,p.pt.z]});else flash('نوبت حریف است')}});
cv.addEventListener('pointercancel',()=>{spHold=false;spPrev=null;if(PV.length)spShow()});
function sdm(t,d){if(t.im>0)return;if(FB&&sy(t,'ساپورتر',2))d*=.9;if(t.is>0)d*=.05;else if(t.fz>0)d*=.5;t.hp=Math.max(0,t.hp-Math.round(d))}
function fbFX(P3,cb){const g=new THREE.Group();g.add(new THREE.Mesh(new THREE.SphereGeometry(1.1,20,16),new THREE.MeshBasicMaterial({color:0xffc04a})),new THREE.Mesh(new THREE.SphereGeometry(1.9,20,16),new THREE.MeshBasicMaterial({color:0xff5a14,transparent:true,opacity:.45,blending:THREE.AdditiveBlending,depthWrite:false})));
 const A=P3.clone().add(new THREE.Vector3(-5,22,-4)),B=P3.clone();B.y=.7;g.position.copy(A);scene.add(g);const t0=performance.now(),D=1000;
 (function f(){const k=Math.min(1,(performance.now()-t0)/D);g.position.lerpVectors(A,B,k*k);g.scale.setScalar(.7+.6*k);try{burst(g.position,3,0xff8a2a,{sp:.6,life:.5,y:0,size:.6,g:-1,up:0,vy:0,r:.6})}catch(_){}
  if(k<1)requestAnimationFrame(f);else{scene.remove(g);g.traverse(o=>{o.geometry&&o.geometry.dispose();o.material&&o.material.dispose()});try{burst(P3,70,0xff7a1a,{sp:5,life:1,vy:3,size:.7});ring(P3,0xffa040,3.6,.8,.15);ring(P3,0xff4a10,2.2,.6,.15)}catch(_){}shk=Math.max(shk,1.4);cb()}})()}
function penguin(){const g=new THREE.Group(),M=c=>new THREE.MeshBasicMaterial({color:c}),b=new THREE.Mesh(new THREE.SphereGeometry(.42,14,12),M(0x15181e)),w=new THREE.Mesh(new THREE.SphereGeometry(.36,14,12),M(0xf4f4f4)),k=new THREE.Mesh(new THREE.ConeGeometry(.1,.3,8),M(0xff9a1a));
 b.scale.y=1.35;w.scale.y=1.25;w.position.z=.12;k.rotation.x=Math.PI/2;k.position.set(0,.45,.3);g.add(b,w,k);return g}
function srFX(c,r0,r1,cb){const g=penguin(),sg=r1>=r0?1:-1,A=new THREE.Vector3(CELL_X(c),.45,CELL_Z(c,r0)-sg*1.5),B=new THREE.Vector3(CELL_X(c),.45,CELL_Z(c,r1)),t0=performance.now(),D=1500;g.rotation.x=sg*Math.PI/2;scene.add(g);
 (function f(){const k=Math.min(1,(performance.now()-t0)/D);g.position.lerpVectors(A,B,k);try{burst(g.position,3,0xdff4ff,{sp:1.2,life:.5,y:0,size:.35,g:2,up:1,vy:1,r:.5})}catch(_){}
  if(k<1)requestAnimationFrame(f);else{scene.remove(g);g.traverse(o=>{o.geometry&&o.geometry.dispose();o.material&&o.material.dispose()});cb()}})()}
function castAt(p){const k=spl,S=SPELLS[k],{c,r,cells}=p,u=at(c,r),inA=x=>x.hp>0&&cells.some(q=>q[0]===x.c&&q[1]===x.r),en=U.filter(x=>inA(x)&&x.o!==P),all=U.filter(inA),bad=m=>{msg=m;draw()},P3=p.pt||V3(c,r);
 const pos=V3(c,r);
 if(k==='cu'||k==='wd'){if(!u||u.o===P)return bad('یک دشمن را روی صفحه نگه دار و رها کن.')}
 if(k==='pt'||k==='is'){if(!u||u.o!==P)return bad('یکی از قهرمانان خودی را انتخاب کن.')}
 if(k==='sr'&&!freeAny())return bad('همهٔ کاشی‌های میدان پر است؛ سارسار قابل استفاده نیست.');
 if(k==='mi'||k==='el'){if(u||(P===0?r<4:r>=4))return bad('یک کاشی خالی در نیمهٔ خودت انتخاب کن.')}
 if(k==='rs'){if(!DX[P].length)return bad('قهرمان مرده‌ای برای احضار نیست.');if(u||(P===0?r<4:r>=4))return bad('یک کاشی خالی در نیمهٔ خودت انتخاب کن.')}
 SP[P]=SP[P].filter(x=>x!==k);spl=null;msg='طلسم «'+S.n+'» استفاده شد.';const me=P,done=()=>{LOCK=0;after()};
 try{
 if(k==='fb'){const cen=cells.reduce((a,q)=>a.add(V3(q[0],q[1])),new THREE.Vector3()).multiplyScalar(1/cells.length);LOCK=1;draw();
  fbFX(cen,()=>{FB=true;en.forEach(x=>sdm(x,680));FB=false;ovCells(cells,0xff6a14,1.8,.6);en.forEach(x=>burnFX(x));done()});return}
 if(k==='sr'){const s=me===0?-1:1,rs=[];for(let j=0;j<ROWS;j++)rs.push(me===0?ROWS-1-j:j);let stop=rs[rs.length-1],first=true,blk=0;const hits=[];
  for(const j of rs){if(ST.some(q=>q.c===c&&q.r===j)){stop=j;blk=1;break}const x=U.find(z=>z.hp>0&&z.o!==me&&z.c===c&&z.r===j);if(x){hits.push([x,first?260:130]);first=false}}
  LOCK=1;draw();srFX(c,rs[0],stop,()=>{hits.forEach(([x,d])=>{sdm(x,d);const pp=V3(x.c,x.r);burst(pp,20,0xdff4ff,{sp:3,vy:2,size:.35})});ovCells(cells,0x9fd8ff,1.6,.4);if(!blk)penSpawn(me,c);done()});return}
 if(k==='fz'){en.forEach(x=>{sdm(x,100);x.fz=2});zoneAdd(cells,0x3a8cf0,2);ring(pos,0x9fd8ff,3.2,.8);burst(pos,44,0xcfeaff,{sp:3,life:.9,vy:2,size:.4});shk=Math.max(shk,.4)}
 else if(k==='rg'){all.forEach(x=>{x.ra=2;if(x.o!==me)sdm(x,10)});zoneAdd(cells,0x9b3cff,2);ring(pos,0xb44dff,3.2,.8);burst(pos,44,0xb44dff,{sp:2.5,life:.9,vy:2.5,up:2,g:-1})}
 else if(k==='eq'||k==='rr'){en.forEach(x=>{sdm(x,100);if(k==='rr')x.rt=3});
  if(k==='eq'){ovCells(cells,0x2a1d12,3,.8);cells.forEach(([a,b])=>{const t=tiles[a]&&tiles[a][b],P0=V3(a,b),y0=t&&t.position.y,rx=t&&t.rotation.x,rz=t&&t.rotation.z;
    if(t){t.position.y=y0-.14;t.rotation.x=(rd()-.5)*.22;t.rotation.z=(rd()-.5)*.22}
    for(let n=0;n<3;n++){const pts=[],a0=rd()*6.28;let x=P0.x,z=P0.z;for(let q=0;q<5;q++){pts.push(new THREE.Vector3(x,.06,z));x+=Math.cos(a0+(rd()-.5)*1.2)*.3;z+=Math.sin(a0+(rd()-.5)*1.2)*.3}
     ovAdd(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x000000,transparent:true,opacity:0})),3,1)}
    ovAdd(new THREE.Object3D(),3,0,()=>{if(t){t.position.y=y0;t.rotation.x=rx;t.rotation.z=rz}});burst(P0,12,0x8a6a3a,{sp:4,vy:4,size:.35,life:.9})});shk=Math.max(shk,2.2);ring(pos,0xb8804a,5,.9)}
  else{zoneAdd(cells,0x2a7a3a,3);cells.forEach(([a,b])=>burst(V3(a,b),10,0xff5a8a,{sp:1.5,vy:3,up:3,g:-1,size:.3,life:1}));ring(pos,0xff5a8a,4.5,.9)}}
 else if(k==='iv'){all.forEach(x=>{x.inv=true;if(x.o!==me)sdm(x,10)});zoneAdd(cells,0xaab4ff,1);cells.forEach(([a,b])=>burst(V3(a,b),14,0xe0e4ff,{sp:1.5,vy:1.5,g:-1,size:.5,life:1}))}
 else if(k==='cu'){sdm(u,30);u.cu=3;burst(pos,36,0x0b2e1c,{sp:2.5,vy:2,g:-1,size:.6,life:1});ring(pos,0x1a5a30,2.2,.8);ovCells([[c,r]],0x0b2e1c,2,.6)}
 else if(k==='wd'){u.wd=1;burst(pos,36,0xc01830,{sp:3,vy:2,g:5,size:.3,life:.9});ring(pos,0xc01830,2,.6);for(let n=0;n<3;n++)setTimeout(()=>burst(pos,12,0x8a0c1c,{sp:2.5,vy:1,size:.25,life:.5}),n*150)}
 else if(k==='pt'){u.hp=Math.min(u.max,u.hp+500);burst(pos,34,0x5dff8a,{sp:.8,vy:2.5,g:-2,up:2.5,size:.32,life:1.2});ring(pos,0x5dff8a,2.4,.9);ovCells([[c,r]],0x5dff8a,1.8,.6)}
 else if(k==='is'){u.is=2;u.fz=2;burst(pos,40,0xdff8ff,{sp:2.6,vy:2.5,size:.3,life:.9});ring(pos,0xdff8ff,2.6,.8);ring(pos,0x7cc4ff,1.6,.5);ovCells([[c,r]],0xdff8ff,2.4,.6)}
 else if(k==='mi'||k==='el'){const sk=k==='el'?'lich':'mi',l=add(sk,me,c,r);l.mv=0;l.act=true;const col=k==='el'?0x9b6bff:0xd9a441;
  burst(pos,46,col,{sp:2.5,vy:3,g:-1,up:2,size:.4,life:1.1});ring(pos,col,2.6,.9);ovCells([[c,r]],col,2,.6);try{summonSnd()}catch(_){}}
 else if(k==='rs'){const d=DX[me].pop();d.hp=Math.min(1400,Math.round(d.max*.5));d.c=c;d.r=r;d.dd=d.dd2=d.imu=0;d.act=true;d.mv=0;U.push(d);
  const pl=new THREE.Mesh(new THREE.CylinderGeometry(.7,.7,9,16,1,true),new THREE.MeshBasicMaterial({color:0xfff2a0,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));pl.position.set(pos.x,4.5,pos.z);ovAdd(pl,1.6,.7);
  burst(pos,40,0xfff2a0,{sp:1,vy:3,g:-2,up:3,size:.3,life:1.2});ring(pos,0xfff2a0,2.4,.9);ovCells([[c,r]],0xfff2a0,2,.6)}
 }catch(err){console.error(err)}
 after()}
function spVis(u,g,d){d.bs=d.bs||g.scale.x||1;g.scale.setScalar(d.bs*(u.ra>0?1.13:1));
 if(!d.au){d.au=new THREE.Mesh(new THREE.RingGeometry(.5,.8,32).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x0b2e1c,transparent:true,opacity:.9,side:THREE.DoubleSide,depthWrite:false}));d.au.position.y=.06;g.add(d.au)}
 d.au.visible=u.cu>0||u.is>0;d.au.material.color.setHex(u.is>0?0xdff8ff:0x0b2e1c)}
function spFrame(){const n=performance.now(),dt=Math.min(.05,(n-sT0)/1000);sT0=n;
 for(let i=OV.length-1;i>=0;i--){const o=OV[i];o.t+=dt;const k=o.t/o.L,m=o.m;if(m.material)m.material.opacity=o.op*(k<.12?k/.12:1)*(1-k);
  if(k>=1){scene.remove(m);if(m.material)m.material.dispose();if(m.geometry&&m.geometry!==HEXG)m.geometry.dispose();o.rest&&o.rest();OV.splice(i,1)}}
 PV.forEach(m=>{if(m.visible)m.material.opacity=.35+.2*Math.sin(n/120)});ZN.forEach(z=>z.ms.forEach(m=>m.material.opacity=.46+.1*Math.sin(n/300)));
 if(!FXI||phase!=='play')return;U.forEach(u=>{if(!(u.wd||u.cu>0||u.is>0||u.ra>0||u.fz>0))return;u._sf=(u._sf||0)+dt;if(u._sf<.3)return;u._sf=0;const g=unitG.get(u);if(!g)return;const p=g.position;
  if(u.wd)burst(p,3,0xc01020,{sp:.3,y:1.3,vy:-1,g:6,size:.18,life:.6,up:0,r:.4});if(u.cu>0)burst(p,3,0x0b2e1c,{sp:.5,y:.3,vy:1,g:-1,size:.5,life:.9,up:0,r:.7});
  if(u.is>0)burst(p,3,0xdff8ff,{sp:.6,y:.8,vy:1,g:-1,size:.2,life:.8,up:1});else if(u.fz>0)burst(p,2,0x7cc4ff,{sp:.4,y:.8,vy:.5,g:0,size:.2,life:.8,up:0});if(u.ra>0)burst(p,3,0xb44dff,{sp:.7,y:.4,vy:2,g:-2,size:.2,life:.7,up:1})})}
{const _pc2=placeCamera;placeCamera=function(){_pc2();try{spFrame()}catch(e){}}}
function shopRender(){const b=$('shop'),pre=phase!=='play';$('shp').hidden=!pre||over;$('spb').hidden=pre||over||(!SP[P].length&&!spl);$('spb').textContent=spl?'لغو طلسم':'«طلسم‌ها»';
 b.classList.toggle('open',shopOpen);if(!shopOpen)return;const mine=SP[P],left=spLeft(P);
 let h='<div class="shh"><span>'+(pre?'فروشگاه — '+NM[P]:'طلسم‌های '+NM[P])+'</span><button type="button" data-x="1">✕</button></div>';
 if(pre&&shopTab===0)h+='<div class="sm"><button type="button" data-tab="1">طلسم‌ها</button></div>';
 else{if(pre)h+='<div class="shh"><button type="button" data-tab="0">→ بخش‌ها</button><span>💧 '+PX(left)+' · '+PX(mine.length)+'/۴</span></div>';
  const list=pre?Object.keys(SPELLS):mine;h+='<div class="sg">'+(list.length?list.map(k=>{const S=SPELLS[k],on=mine.includes(k),dis=pre&&!on&&(mine.length>=4||left<S.x);
   return '<button type="button" class="sc'+(on&&pre?' on':'')+'" data-s="'+k+'"'+(dis?' disabled':'')+'><b>'+S.n+'</b><span class="sx">💧 '+PX(S.x)+'</span></button>'}).join(''):'<div class="dp">طلسمی نمانده.</div>')+'</div>'}
 b.innerHTML=h}
$('shop').onclick=e=>{const t=e.target.closest('[data-s],[data-tab],[data-x]');if(!t)return;const d=t.dataset;
 if(d.x){shopOpen=false}else if(d.tab!==undefined){shopTab=+d.tab}
 else{if(mine())net({a:'shop',k:d.s});else flash('نوبت حریف است');return}draw()};
function shopSel(k){if(ONLINE&&phase!=='play'&&FIN[P])return;const S=SPELLS[k];if(phase==='play'){{spl=k;shopOpen=false;msg='«'+S.n+'»: روی صفحه نگه دار و بکش تا کاشی‌های هدف نشان داده شود، رها کنی اجرا می‌شود.'}}
  else{const i=SP[P].indexOf(k);if(i>=0)SP[P].splice(i,1);else if(SP[P].length<4&&spLeft(P)>=S.x)SP[P].push(k);if(phase==='pick')DR.offer=fixOff(DR.offer)}draw()}
$('shp').onclick=()=>{shopOpen=!shopOpen;shopTab=0;draw()};
$('spb').onclick=()=>{if(spl){if(mine())net({a:'spc'})}else{shopOpen=!shopOpen;draw()}};
function spCancel(){spl=null;spPrev=null;if(PV.length)spShow();msg='';draw()}
let ZN=[];
function zoneAdd(cells,col,rounds){const y=.03+(ZN.length%5)*.004,ms=cells.map(([c,r])=>{const m=hexMesh(c,r,col,y);m.material.opacity=.5;scene.add(m);return m});ZN.push({ms,until:T+rounds*2})}
function zoneRm(z){z.ms.forEach(m=>{scene.remove(m);m.material.dispose()})}
function zoneTick(){for(let i=ZN.length-1;i>=0;i--)if(ZN[i].until<=T){zoneRm(ZN[i]);ZN.splice(i,1)}}
function zoneClear(){ZN.forEach(zoneRm);ZN=[]}
const freeAny=()=>{for(let a=0;a<COLS;a++)for(let b=0;b<ROWS;b++)if(fr(a,b))return true;return false};
function penFig(M){const g=new THREE.Group(),S=(r)=>new THREE.SphereGeometry(r,16,12),b=new THREE.Mesh(S(.4),M(0x15181e)),w=new THREE.Mesh(S(.33),M(0xf4f4f4)),h=new THREE.Mesh(S(.24),M(0x15181e)),k=new THREE.Mesh(new THREE.ConeGeometry(.07,.22,8),M(0xff9a1a));
 b.scale.set(1,1.35,.95);b.position.y=.8;w.scale.set(1,1.3,.8);w.position.set(0,.78,.16);h.position.y=1.5;k.rotation.x=Math.PI/2;k.position.set(0,1.48,.28);g.add(b,w,h,k);
 [-1,1].forEach(s=>{const f=new THREE.Mesh(S(.16),M(0x15181e));f.scale.set(.5,1.4,.9);f.position.set(s*.42,.85,0);f.rotation.z=s*.3;g.add(f)});return g}
function skelFig(M){const g=new THREE.Group(),V=THREE.Vector3,B=M(GX.c(0xe9e3d0),{roughness:.7}),D=M(GX.c(0x2b2622),{roughness:.9}),Rs=M(GX.c(0x8a6a4a),{roughness:.6,metalness:.4}),Cl=M(GX.c(0x6a2a2a),{roughness:.9,side:THREE.DoubleSide}),Gl=new THREE.MeshBasicMaterial({color:0x8dffc0,toneMapped:false});
 const S=(r,x,y,z)=>new THREE.SphereGeometry(r,10,8).scale(x||1,y||1,z||1);
 const add=(geo,m,x,y,z,P)=>{const o=new THREE.Mesh(geo,m);o.position.set(x||0,y||0,z||0);(P||g).add(o);return o};
 const rod=(a,b,r,m,P)=>{const A=new V(a[0],a[1],a[2]),C=new V(b[0],b[1],b[2]),d=C.clone().sub(A),L=d.length(),o=new THREE.Mesh(new THREE.CylinderGeometry(r,r*.85,L,7),m);o.position.copy(A).addScaledVector(d,.5);o.quaternion.setFromUnitVectors(new V(0,1,0),d.normalize());(P||g).add(o);return o};
 add(new THREE.BoxGeometry(.34,.1,.18),B,0,.8,0);[-1,1].forEach(s=>add(S(.06),B,s*.16,.8,0));
 add(new THREE.BoxGeometry(.3,.2,.02),Cl,0,.66,.1);
 [-1,1].forEach(s=>{rod([s*.1,.78,0],[s*.11,.44,.02],.04,B);add(S(.05),B,s*.11,.44,.02);rod([s*.11,.44,.02],[s*.11,.07,0],.032,B);add(new THREE.BoxGeometry(.09,.05,.2),B,s*.11,.035,.06)});
 rod([0,.82,-.02],[0,1.34,-.03],.03,B);[.9,1.0,1.1,1.2,1.3].forEach(y=>add(S(.042),B,0,y,-.03));
 [1.05,1.13,1.21,1.29].forEach((y,i)=>{const t=add(new THREE.TorusGeometry(.16-.01*Math.abs(i-1.5),.014,5,14),B,0,y,0);t.rotation.x=Math.PI/2;t.scale.set(1,.7,1)});
 add(new THREE.BoxGeometry(.04,.26,.025),B,0,1.17,.11);
 rod([-.25,1.33,-.02],[.25,1.33,-.02],.025,B);
 const AL=new THREE.Group();AL.position.set(-.25,1.33,0);g.add(AL);
 rod([0,0,0],[-.06,-.29,.02],.028,B,AL);add(S(.04),B,-.06,-.29,.02,AL);rod([-.06,-.29,.02],[-.05,-.55,.14],.024,B,AL);add(S(.035),B,-.05,-.55,.14,AL);
 const AR=new THREE.Group();AR.position.set(.25,1.33,0);g.add(AR);
 rod([0,0,0],[.06,-.29,.02],.028,B,AR);add(S(.04),B,.06,-.29,.02,AR);rod([.06,-.29,.02],[.05,-.55,.14],.024,B,AR);add(S(.035),B,.05,-.55,.14,AR);
 add(new THREE.BoxGeometry(.035,.62,.012),Rs,.05,-.28,.14,AR);add(new THREE.BoxGeometry(.16,.028,.03),D,.05,-.56,.14,AR);add(new THREE.ConeGeometry(.02,.08,4),Rs,.05,.05,.14,AR);
 const HG=new THREE.Group();HG.position.set(0,1.54,0);g.add(HG);
 add(S(.15,1,1.05,1.05),B,0,0,0,HG);add(new THREE.BoxGeometry(.17,.07,.13),B,0,-.12,.03,HG);
 [-1,1].forEach(s=>{add(S(.045,1,1.15,.6),D,s*.06,.02,.12,HG);add(S(.02),Gl,s*.06,.02,.145,HG)});
 const nz=add(new THREE.ConeGeometry(.022,.05,3),D,0,-.04,.15,HG);nz.rotation.x=Math.PI;
 for(let i=-3;i<=3;i++)add(new THREE.BoxGeometry(.018,.03,.012),B,i*.022,-.085,.155,HG);
 add(S(.035),B,0,1.4,-.02);add(S(.032),B,0,1.36,-.025);
 /* جزئیات بیشتر اسکلت: دنده، ستون مهره، لگن، انگشت، دندان، تاج زنگ‌زده، کمربند، شمشیر */
 {const T=(r,t,n)=>new THREE.TorusGeometry(r,t,5,n||14),Bx=(a,b,c)=>new THREE.BoxGeometry(a,b,c),Cn=(r,l,n)=>new THREE.ConeGeometry(r,l,n||4),PI=Math.PI;
  [.89,.93,.97,1.01].forEach((y,i)=>{const t=add(T(.125+.004*i,.012,14),B,0,y,0);t.rotation.x=PI/2;t.scale.set(1,.7,1)});
  for(let i=0;i<6;i++)[-1,1].forEach(s=>rod([s*.05,1.27-i*.06,-.03],[s*.16,1.25-i*.06,.07],.012,B));
  for(let i=0;i<4;i++)add(Bx(.035,.045,.02),B,0,1.12+i*.055,.118);
  [.82,.85,.88,.91].forEach(y=>add(S(.034),B,0,y,-.03));[1.36,1.39,1.42].forEach(y=>add(S(.03),B,0,y,-.025));
  [-1,1].forEach(s=>{add(S(.07,1.2,.2,.6),B,s*.1,1.2,-.1).rotation.z=s*.4;
   add(S(.1,.9,.55,.5),B,s*.12,.82,-.01).rotation.z=-s*.5;
   add(S(.045),B,s*.11,.42,.09);rod([s*.11,.4,.02],[s*.11,.12,.0],.012,B).position.x+=s*.03;add(S(.032),B,s*.11,.08,0);
   for(let k=-1;k<=1;k++)add(Bx(.02,.02,.07),B,s*.11+k*.03,.02,.14);add(Bx(.1,.025,.04),D,s*.11,.01,.0)});
  add(S(.05,1,.8,.8),B,0,.77,-.01);add(S(.03,.8,1.4,.7),B,0,.74,.07);
  [-1,1].forEach(s=>{add(Bx(.02,.04,.012),D,s*.065,.06,.158,HG);add(S(.04,1.3,.5,.5),B,s*.11,-.06,.1,HG);add(S(.035,1,.4,.7),B,s*.1,.07,.13,HG)});
  [-3,-2,-1,0,1,2].forEach(i=>add(Bx(.016,.026,.012),B,i*.022+.011,-.145,.14,HG));
  add(Bx(.008,.1,.012),D,.03,.1,.14,HG).rotation.z=.3;
  const cr=add(T(.15,.012,18),Rs,0,.08,0,HG);cr.rotation.x=PI/2;
  for(let i=0;i<5;i++){const a=(i-2)*.5;add(Cn(.014,.07,4),Rs,Math.sin(a)*.15,.13,Math.cos(a)*.15,HG)}
  const bl=add(T(.135,.018,20),Rs,0,.7,0);bl.rotation.x=PI/2;bl.scale.set(1,.9,1);add(Bx(.06,.05,.02),Rs,0,.7,.13);
  [-.1,0,.1].forEach(x=>add(Bx(.03,.14+Math.abs(x),.012),Cl,x,.6-Math.abs(x)*.4,-.12));[-.08,0,.08].forEach(x=>add(Bx(.025,.16,.012),Cl,x,.56,.13));
  add(S(.02),B,.1,.6,.13);add(S(.016),B,.1,.56,.13);add(S(.016),B,.1,.52,.13);add(S(.045,1,1.2,.8),B,.1,.46,.13);
  const sh=(G,s)=>{add(S(.09,1,.6,1),Rs,s*.02,.05,0,G);add(Bx(.02,.02,.02),D,s*.05,.07,.08,G)};sh(AL,-1);sh(AR,1);
  for(let k=0;k<3;k++)add(Cn(.018,.09,4),Rs,-.06+k*.04,.12-k*.01,0,AL).rotation.z=.35-k*.3;
  rod([-.04,-.3,.0],[-.04,-.55,.12],.012,B,AL);rod([.04,-.3,.0],[.04,-.55,.12],.012,B,AR);add(S(.03),B,-.07,-.3,.02,AL);add(S(.03),B,.07,-.3,.02,AR);
  for(let k=0;k<5;k++){add(Bx(.012,.07,.012),B,-.09+k*.02,-.62,.14,AL);add(Bx(.012,.05,.012),B,.03+k*.016,-.585,.14,AR)}
  add(S(.032),B,.05,-.63,.14,AR);add(Bx(.04,.025,.04),D,.05,-.6,.14,AR);add(Bx(.04,.025,.04),D,.05,-.58,.14,AR);
  add(Bx(.01,.5,.016),D,.05,-.3,.145,AR);for(let k=0;k<4;k++)add(Bx(.012,.016,.022),D,.0325,-.12-k*.12,.14,AR);for(let k=0;k<3;k++)add(S(.01),D,.06,-.15-k*.14,.15,AR);
  [-1,1].forEach(s=>{rod([s*.11,.42,.0],[s*.12,.1,.03],.014,B);add(Bx(.025,.07,.025),D,s*.11,.2,.03)});
  [-1,1].forEach(s=>{for(let k=0;k<3;k++)add(Cn(.014,.06,4),D,s*.11+(k-1)*.025,.02,.19).rotation.x=PI/2})}
 GX.anim(g,t=>{HG.rotation.y=.28*Math.sin(t*.8);HG.rotation.x=.06*Math.sin(t*1.3);AR.rotation.x=-.12+.1*Math.sin(t*1.6);AL.rotation.x=.06*Math.sin(t*1.4+1)});
 return g}
FIG.skl=skelFig;
function penSpawn(me,c){const E=me===0?0:ROWS-1;let best=null,bd=1e9;for(let a=0;a<COLS;a++)for(let b=0;b<ROWS;b++){if(!fr(a,b))continue;const d=dist({c,r:E},{c:a,r:b})*10+Math.abs(a-c)*.1+Math.abs(b-E)*.01;if(d<bd){bd=d;best=[a,b]}}
 if(!best)return;if(!FIG.pen)FIG.pen=penFig;const l=add('pen',me,best[0],best[1]);l.mv=0;l.act=true;const p=V3(best[0],best[1]);burst(p,40,0xdff4ff,{sp:3,vy:3,size:.4,life:.9});ring(p,0x9fd8ff,2.6,.8)}
let smnGen=0;
/* ساختمان‌ها هنوز در بازی نیستند؛ هر زمان اضافه شدند کافی است آرایهٔ سراسری BLD با اعضای {c,r} پر شود */
const blkAt=(c,r)=>ST.some(s=>s.c===c&&s.r===r)||(typeof BLD!=='undefined'&&BLD.some(b=>b.c===c&&b.r===r));
function smnStep(u){const pen=u.k==='pen',E=U.filter(x=>x.hp>0&&x.o!==u.o&&!x.inv&&!(x.fly>0));if(!E.length)return null;
 const ok=(a,b)=>!at(a,b)&&(pen||!blkAt(a,b)),seen=new Set([u.c+','+u.r]);let q=[];
 const add2=(c,r,f)=>{for(const p of nb(c,r))if(ok(p[0],p[1])&&!seen.has(p+'')){seen.add(p+'');q.push({p,f:f||p})}};add2(u.c,u.r,null);
 while(q.length){const n=q.shift();if(E.some(x=>dist({c:n.p[0],r:n.p[1]},x)===1))return n.f;add2(n.p[0],n.p[1],n.f)}return null}
function smnAct(u,next,gen){if(gen!==smnGen)return;if(u.fr>0||u.jl>0||u.fz>0)return next();let used=0;const cap=(u.sl||u.sh>0)?1:2,
 adj=()=>U.filter(x=>x.hp>0&&x.o!==u.o&&!x.inv&&!(x.fly>0)&&dist(u,x)===1);
 const go=()=>{if(gen!==smnGen)return;if(u.hp<=0||over)return next();const A=adj();
  if(A.length&&used<2){const t=A[RL()*A.length|0],g=unitG.get(u),gt=unitG.get(t);
   if(g&&gt){g.userData.fy=Math.atan2(gt.position.x-g.position.x,gt.position.z-g.position.z);g.userData.ft=1}
   try{const p=V3(t.c,t.r);burst(p,16,0xffe0a0,{sp:3,vy:2,size:.3,life:.4});ring(p,0xffffff,1.3,.35,.15);SFX.hit&&SFX.hit(1);shk=Math.max(shk,.3)}catch(_){}
   hit(u,t,base(u,t));msg=H[u.k].n+' به '+H[t.k].n+' ضربه زد.';after();return setTimeout(next,700)}
  if(used>=cap)return next();const s=smnStep(u);if(!s)return next();used++;u.c=s[0];u.r=s[1];
  if(u.k==='pen'&&blkAt(s[0],s[1])){try{const p=V3(s[0],s[1]);burst(p,30,0xdff4ff,{sp:3,vy:3,size:.4,life:.8})}catch(_){}u.hp=0;msg='سارسار به مانع خورد و از بین رفت.';after();return setTimeout(next,500)}
  draw();setTimeout(go,450)};
 go()}
function smnRun(auto){if(phase!=='play'||over||LOCK)return false;const L=U.filter(u=>u.hp>0&&u.o===P&&(u.k in SMN));if(!L.length)return false;const gen=smnGen;LOCK=1;let i=0;
 const step=()=>{if(gen!==smnGen)return;if(over||i>=L.length){LOCK=0;if(!over)endTurn0(auto);return}const u=L[i++];if(u.hp<=0||!U.includes(u))return step();smnAct(u,()=>setTimeout(step,250),gen)};
 setTimeout(step,300);return true}
function draw(){ if(DSW||!renderer||NOGAME)return; syncUnits();syncStatues();syncTiles();ui();shopRender();autoCheck()}
function canMv(u){return !over&&phase==='play'&&u.o===P&&MV>=1&&u.mv>=1&&(!u.act||u.fm)&&!u.mb&&!(u.k==='ikh'&&!u.rel)}
function swapMates(u){return canMv(u)?U.filter(x=>x.hp>0&&x.o===u.o&&x!==u&&dist(u,x)===1):[]}
function handleCell(c,r){if(LOCK)return;if(!mine())return flash('نوبت حریف است');net({a:'cell',x:c,y:r})}
function handleCell0(c,r){
 if(phase!=='play')return placeTap(c,r);if(spl||spSw)return;
 if(over||LOCK)return;const u=at(c,r),wasAb=mode==='ab';
 if(mode==='ab'&&sel){const t=abT(sel).find(x=>x.c===c&&x.r===r);if(t&&abOkNow(sel)){useAb(sel,t);return}mode='mv'}
 if(sel&&sel.o===P&&!sel.act&&!sel.mo&&u&&canHit(sel,u)){attack(sel,u);return}
 if(sel&&u&&!wasAb&&swapMates(sel).includes(u)){MV--;sel.mv--;[sel.c,u.c]=[u.c,sel.c];[sel.r,u.r]=[u.r,sel.r];msg=H[sel.k].n+' و '+H[u.k].n+' جایشان را عوض کردند.';draw();return}
 if(sel&&sel.o===P&&!u){const m=reach(sel),k=c+','+r;if(k in m){MV--;sel.mv--;sel.c=c;sel.r=r;draw();return}}
 if(u&&u===sel&&!wasAb){sel=null;mode='mv';draw();return}
 sel=u||null;mode='mv';draw()}
// ورودی: فقط ضربه/کلیک برای انتخاب؛ دوربین ثابت است و با کشیدن یا زوم حرکت نمی‌کند
let dn=null;
cv.addEventListener('pointerdown',e=>{dn=e.isPrimary?{id:e.pointerId,x:e.clientX,y:e.clientY}:null});
cv.addEventListener('pointerup',e=>{const d=dn;dn=null;if(!d||d.id!==e.pointerId||Math.hypot(e.clientX-d.x,e.clientY-d.y)>12)return;
 const R=cv.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-R.left)/R.width*2-1,-((e.clientY-R.top)/R.height)*2+1),camera);
 const h=raycaster.intersectObjects(pickables,false).find(x=>!(x.object.userData.u&&hid(x.object.userData.u)));if(!h)return;const o=h.object.userData;
 if(o.u)handleCell(o.u.c,o.u.r);else handleCell(o.c,o.r)});
cv.addEventListener('pointercancel',()=>{dn=null});
cv.addEventListener('wheel',e=>e.preventDefault(),{passive:false});
try{initScene()}catch(err){$('msg').textContent='مرورگر شما WebGL را پشتیبانی نمی‌کند.';throw err}
if(window.ResizeObserver)new ResizeObserver(()=>{if(renderer)resize()}).observe($('stage'));
if(document.fonts&&document.fonts.load)document.fonts.load('bold 20px Vazirmatn').then(()=>U&&draw()).catch(()=>{});

$('ab').onclick=()=>{if(!sel||LOCK)return;if(!mine())return flash('نوبت حریف است');net({a:'ab'})};
/* شرط مجاز بودن قابلیت: قبلاً فقط «غیرفعال‌بودنِ دکمه» بود و دستورِ جعلی از آن رد می‌شد؛ حالا خودِ منطق (روی سرور هم) آن را اعمال می‌کند */
function abOkNow(u){return !!u&&!over&&phase==='play'&&U.includes(u)&&u.hp>0&&u.o===P&&!u.act&&!u.mo&&u.mv>=1&&MV>=1&&!!H[u.k].c&&E[P]>=cost(u)&&abT(u).length>0}
function abClick(){if(!sel||LOCK)return;if(!abOkNow(sel))return;if(['raf','doj','pri','mak','jal','ikh','col','ear','mus','bud','que','mac','cri','ske','spg','gq','dn','dw'].includes(sel.k)){useAb(sel,sel)}else if(sel.k==='acro'){useAb(sel,abT(sel)[0])}else{mode=mode==='ab'?'mv':'ab';msg=mode==='ab'?'هدف قابلیت را روی صفحه انتخاب کن.':'';draw()}};
let cfStep=0,cfTm=0;
function cfRender(){const s2=cfStep===2,y=$('cfy');if(cfStep===3){$('cft').textContent='تسلیم می‌شوی؟';$('cfp').textContent='با تسلیم، بازی را می‌بازی و حریف همان لحظه برنده می‌شود.';y.textContent='بله، تسلیم';clearTimeout(cfTm);y.disabled=false;return}$('cft').textContent=s2?'مطمئنی؟':'بازی جدید شروع شود؟';
 $('cfp').textContent=s2?'تأیید دوم: بازی فعلی کامل پاک می‌شود و برگشتی ندارد.':'بازی فعلی از بین می‌رود.';
 y.textContent=s2?'بله، بازی جدید':'ادامه';clearTimeout(cfTm);y.disabled=s2;if(s2)cfTm=setTimeout(()=>{y.disabled=false},1200)}
function cfOpen(){cfStep=1;cfRender();$('cf').hidden=false;$('cfn').focus()}
function cfClose(){cfStep=0;clearTimeout(cfTm);$('cf').hidden=true}
$('cfn').onclick=cfClose;
$('cfy').onclick=()=>{if(cfStep===1){cfStep=2;cfRender();$('cfn').focus()}else if(cfStep===2){cfClose();net({a:'init'})}else if(cfStep===3){cfClose();if(MATCH&&!over)sendW({t:'forfeit'})}};
$('cf').onclick=e=>{if(e.target===$('cf'))cfClose()};
addEventListener('keydown',e=>{if(e.key==='Escape'&&cfStep)cfClose()});
$('nw').onclick=()=>MATCH?forfeitAsk():cfOpen();
$('cbtn').onclick=()=>{cbOpen=!cbOpen;cbRender()};$('eb').onclick=()=>{EC=!EC;ecRender()};$('evb').onclick=()=>{EVO=!EVO;evRender()};$('bbL').onclick=$('sb').onclick=()=>{EVO=!EVO;evRender()};$('bbC').onclick=()=>{document.body.classList.toggle('cbHide');ecRender()};$('evm').onclick=e=>{if(e.target.closest('[data-x]')){EVO=false;evRender()}};$('dbtn').onclick=()=>{drClosed=false;draw()};
$('cb').onclick=e=>{if(e.target.closest('[data-x]')){cbOpen=false;cbRender()}};
addEventListener('resize',()=>{resize();U&&draw()});$('nw2').onclick=()=>MATCH?finishMatch():cfOpen();
$('dr').onclick=e=>{const b=e.target.closest('button,[data-t]');if(!b)return;const d=b.dataset;
  if(d.a==='x'&&!d.k&&!d.t){drClosed=true;draw();return}
  if(mine())net({a:'dr',k:d.k||null,t:d.t||null,x:d.a||null});else flash('نوبت حریف است')};
function drApply(d){
  if(d.k)pick(d.k);
  else if(d.t){const u=U.find(x=>x.k===d.t&&x.o===P);if(u){sel=u;tray=null}else{tray=d.t;sel=null}draw()}
  else if(d.x==='fin'){finishPick();draw()}else if(d.x==='r'){randPlace();draw()}
  else if(d.x==='ok')confirmPlace()}
/* ===== جزئیات گرافیکی و صدا (افزوده؛ منطق بازی دست‌نخورده) ===== */
let AC,MG,NBF,FXI=0,PA=[],PB,PTS,PU,GL,RGG,RG=[],PJ=[],BL=[],CX=null,shk=0,t0=performance.now();
const FS=new Map(),NPT=1400,gate={},rd=Math.random,rgb=h=>[(h>>16&255)/255,(h>>8&255)/255,(h&255)/255],gok=(n,ms)=>{const t=performance.now();if(t-(gate[n]||0)<ms)return false;gate[n]=t;return true};
function au(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)();const c=AC.createDynamicsCompressor();MG=AC.createGain();MG.gain.value=.8;MG.connect(c);c.connect(AC.destination)}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC}
addEventListener('pointerdown',au,{passive:true});
function nz(d,ft,f0,f1,q,g,dl){const a=au();if(!a)return;if(!NBF){NBF=a.createBuffer(1,a.sampleRate,a.sampleRate);const x=NBF.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=rd()*2-1}
 const t=a.currentTime+(dl||0),s=a.createBufferSource(),f=a.createBiquadFilter(),v=a.createGain();s.buffer=NBF;f.type=ft;f.Q.value=q;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(f1,t+d);v.gain.setValueAtTime(g,t);v.gain.exponentialRampToValueAtTime(.001,t+d);s.connect(f);f.connect(v);v.connect(MG);s.start(t,rd()*.4,d)}
function os(ty,f0,f1,d,g,dl){const a=au();if(!a)return;const t=a.currentTime+(dl||0),o=a.createOscillator(),v=a.createGain();o.type=ty;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+d);v.gain.setValueAtTime(g,t);v.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(v);v.connect(MG);o.start(t);o.stop(t+d+.02)}
const SFX={hit(h){nz(.13,'lowpass',1800,300,1,h?1.1:.7);os('sine',h?200:260,50,.14,h?.9:.6)},
 ice(){for(let i=0;i<7;i++){nz(.07,'highpass',5000+rd()*3000,9000,1,.35,i*.03+rd()*.02);os('sine',2400+rd()*2400,1500,.09,.12,i*.03)}nz(.18,'bandpass',3500,900,2,.5)},
 /* قدم‌زدن: دو ضربهٔ نرم و کم‌صدا، بدون نویز تیز */
 move(){[0,.14].forEach((dl,i)=>{nz(.07,'lowpass',360-i*60,130,.5,.2,dl);os('sine',90-i*10,46,.1,.28,dl)})},
 /* شمشیر: وزش هوا + برخورد فلز */
 sword(g,dl){g=g||1;dl=dl||0;nz(.15,'bandpass',1100,5200,1.2,.5*g,dl);const w=dl+.08;nz(.05,'highpass',3000,7000,1,.45*g,w);os('sine',190,80,.09,.4*g,w);[2350,3320,4710].forEach((f,i)=>os('triangle',f*(1+rd()*.02),f*.985,.3-i*.07,.15*g/(i+1),w))},
 /* کاتانا: وزش باریک‌تر و تیزتر + زنگ بلند */
 katana(g,dl){g=g||1;dl=dl||0;nz(.2,'highpass',3500,11000,.8,.45*g,dl);const w=dl+.1;nz(.04,'highpass',5000,9000,1,.4*g,w);os('sine',150,70,.07,.28*g,w);[[3300,.55,.13],[5300,.45,.08],[7900,.3,.05]].forEach(([f,d,v])=>os('sine',f,f*.97,d,v*g,w))},
 /* سایبرگ: کاتانا + موتور و بوق رباتیک */
 cyber(g){g=g||1;SFX.katana(.85*g);for(let i=0;i<5;i++)os('square',320+i*80,260+i*80,.05,.13*g,i*.035);os('sawtooth',140,430,.2,.2*g);os('square',620,620,.06,.12*g,.2);os('square',930,930,.06,.1*g,.27);nz(.14,'bandpass',2600,900,6,.2*g,.02)},
 /* پرتاب شعله */
 flame(g,dl){g=g||1;dl=dl||0;nz(.55,'bandpass',450,1700,.9,.7*g,dl);nz(.5,'lowpass',2600,500,.7,.55*g,dl);os('sawtooth',115,55,.45,.16*g,dl);for(let i=0;i<8;i++)nz(.03,'highpass',4000+rd()*3000,8000,1,.2*g,dl+.06+i*.05+rd()*.03)},
 flameBig(){SFX.flame(1.5);SFX.flame(1.1,.2);os('sawtooth',80,40,.6,.28);nz(.4,'lowpass',900,120,.8,.6,.05)},
 /* رعد و برق: ترق + جرقه‌های زنجیره + غرش */
 thunder(g,dl,rb){g=g||1;dl=dl||0;nz(.07,'highpass',2000,9000,.8,1.1*g,dl);for(let i=0;i<6;i++)nz(.03,'bandpass',2500+rd()*3000,6000,3,.4*g,dl+.02+i*.04+rd()*.02);os('sawtooth',950,60,.25,.28*g,dl);if(rb){nz(.55,'lowpass',520,70,.9,1*g,dl+.08);os('sine',70,32,.6,.9*g,dl+.08)}},
 /* مار: هیس */
 snake(g){g=g||1;[[0,.2],[.24,.12],[.4,.16]].forEach(([dl,d])=>{nz(d,'highpass',5200,8500,.7,.45*g,dl);nz(d,'bandpass',6800,5400,2.5,.3*g,dl)});nz(.03,'highpass',7000,9000,1,.3*g,.62);os('sine',170,120,.25,.08*g,.05)},
 /* جادو: همهٔ جادوگرها یک صدا */
 magic(g){g=g||1;os('sine',420,1500,.35,.26*g);os('triangle',640,2200,.35,.13*g,.03);os('sine',1260,3000,.25,.09*g,.08);for(let i=0;i<7;i++)os('sine',2500+rd()*3500,3000+rd()*3000,.07,.09*g,.05+i*.04);nz(.3,'bandpass',900,3200,1.5,.22*g);os('sine',150,90,.3,.22*g,.22)},
 /* تفنگ قدیمی (Kar98k): تَق تیز + پژواک + کشیدن گلنگدن */
 kar(g,dl){g=g||1;dl=dl||0;nz(.04,'highpass',1500,8000,.7,1.4*g,dl);nz(.18,'lowpass',5000,600,.8,1.2*g,dl);os('sine',130,40,.28,1.1*g,dl);nz(.45,'lowpass',1800,200,.6,.3*g,dl+.07);const b=dl+.42;nz(.025,'bandpass',2800,2400,4,.5*g,b);os('triangle',1900,1500,.04,.14*g,b);nz(.03,'bandpass',2200,1800,4,.5*g,b+.14);os('triangle',1500,1100,.05,.13*g,b+.14)},
 karBig(){SFX.kar(1.5);os('sine',75,26,.6,1.3);nz(.6,'lowpass',700,60,.9,.9,.04)},
 /* ژنرال مارسا: lv از ۰ (آرام) تا ۴ (سهمگین) */
 marsa(lv){const g=[.3,.55,.8,1.1,1.7][lv],lp=[6000,4500,3200,2200,1500][lv],f=[220,170,130,95,60][lv];nz(.05+lv*.03,'highpass',1800-lv*200,7000,.8,.5*g);nz(.12+lv*.07,'lowpass',lp,300-lv*30,.8,.9*g);os('sine',f,f*.3,.1+lv*.1,.8*g);if(lv>=2)os('sawtooth',f*1.6,f*.4,.15+lv*.04,.25*g);if(lv>=3)nz(.5,'lowpass',900,90,.8,.5*g,.05);if(lv>=4){os('sine',48,24,.9,1.2);nz(.6,'lowpass',500,60,.9,.9,.1)}},
 /* شاتگان */
 shotgun(g,dl){g=g||1;dl=dl||0;nz(.05,'highpass',1200,6000,.7,1.3*g,dl);nz(.4,'lowpass',4500,250,.8,1.3*g,dl);os('sine',120,34,.32,1.2*g,dl);const b=dl+.38;nz(.03,'bandpass',1800,1500,4,.45*g,b);os('triangle',1300,900,.05,.15*g,b);nz(.03,'bandpass',2400,1900,4,.45*g,b+.14);os('triangle',1700,1100,.05,.15*g,b+.14)},
 shotgunBig(){SFX.shotgun(1.6);os('sine',60,22,.8,1.4);nz(.6,'lowpass',700,60,.9,1.1,.03);nz(.3,'bandpass',200,80,1,.8)},
 ignite(){SFX.flame(.9);os('sine',200,720,.25,.35);nz(.03,'bandpass',2200,1800,4,.5);nz(.03,'bandpass',2800,2200,4,.5,.12)},
 /* رگبار */
 mg(g,dl){nz(.035,'bandpass',2800,1800,1.5,.5*g,dl);os('sine',170,70,.05,.45*g,dl)},
 /* ورق پاسور */
 card(dl){dl=dl||0;nz(.045,'bandpass',3500+rd()*1500,7500,2.2,.5,dl);nz(.02,'highpass',6000,9000,1,.3,dl+.035);os('triangle',900+rd()*300,500,.03,.12,dl)},
 stick(){for(let i=0;i<4;i++)os('square',1400,1400,.04,.15,i*.1)},
 boom(){nz(.6,'lowpass',2500,80,.8,1.5);os('sine',90,28,.6,1.4);nz(.05,'highpass',1500,6000,1,.8)},
 zap(f){os('sawtooth',f*1.8,f*.5,.3,.3);os('sine',f,f*.4,.35,.5);nz(.25,'bandpass',f*3,f,3,.25)},
 weak(){os('sine',420,110,.7,.45);os('triangle',300,90,.7,.25,.05)},
 ab(){os('sine',400,1100,.3,.25);os('triangle',800,1600,.25,.12,.05)}};
function vox(m){const a=au();if(!a)return;const t=a.currentTime,d=m?1.3:.95,o=a.createOscillator(),l=a.createOscillator(),lg=a.createGain(),v=a.createGain(),ws=a.createWaveShaper(),pk=m?2.2:1.5;
 o.type='sawtooth';
 if(m){o.frequency.setValueAtTime(120,t);o.frequency.linearRampToValueAtTime(90,t+.3);o.frequency.linearRampToValueAtTime(55,t+d);l.frequency.value=24;lg.gain.value=22}
 else{o.frequency.setValueAtTime(520,t);o.frequency.linearRampToValueAtTime(980,t+.22);o.frequency.linearRampToValueAtTime(780,t+d);l.frequency.value=7;lg.gain.value=22}
 l.connect(lg);lg.connect(o.frequency);
 const cu=new Float32Array(256);for(let i=0;i<256;i++)cu[i]=Math.tanh((i/128-1)*(m?5:2));ws.curve=cu;
 v.gain.setValueAtTime(0,t);v.gain.linearRampToValueAtTime(pk,t+.06);v.gain.setValueAtTime(pk,t+d*.6);v.gain.exponentialRampToValueAtTime(.001,t+d);
 o.connect(ws);(m?[[500,3],[1000,4]]:[[900,5],[2700,6]]).forEach(([f,q])=>{const b=a.createBiquadFilter();b.type='bandpass';b.frequency.value=f;b.Q.value=q;ws.connect(b);b.connect(v)});
 v.connect(MG);o.start(t);l.start(t);o.stop(t+d+.05);l.stop(t+d+.05);nz(d,'bandpass',m?300:2500,m?150:3500,1,m?.5:.25)}
const VP={ali:{p:1.9,r:1.2,g:'f',i:0},pri:{p:1.25,r:.85,g:'f',i:1},and:{p:.85,r:.7,g:'f',i:2},mak:{p:1.6,r:1.05,g:'f',i:3},jal:{p:.2,r:.6,g:'m',i:0},zep:{p:.6,r:.65,g:'m',v:.4,i:1},acro:{p:1.4,r:1.15,g:'m',i:2},col:{p:.4,r:.85,g:'m',i:3},aka:{p:.8,r:.95,g:'m',i:1},mus:{p:.6,r:.85,g:'m',i:4},ear:{p:1,r:.75,g:'m',i:5},gq:{p:1.1,r:1,g:'f',i:4}};
function say(){/* دیالوگ‌ها حذف شدند */}
/* ذرات، حلقه‌ها و پرتابه‌ها */
function fxInit(){FXI=1;PB={p:new Float32Array(NPT*3),c:new Float32Array(NPT*4),s:new Float32Array(NPT)};
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(PB.p,3));g.setAttribute('col',new THREE.BufferAttribute(PB.c,4));g.setAttribute('size',new THREE.BufferAttribute(PB.s,1));
 PU={value:600};
 PTS=new THREE.Points(g,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uS:PU},
  vertexShader:'attribute vec4 col;attribute float size;uniform float uS;varying vec4 vc;varying float vb;void main(){vc=col;vb=step(size,0.);vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=abs(size)*uS/-mv.z;gl_Position=projectionMatrix*mv;}',
  fragmentShader:'varying vec4 vc;varying float vb;void main(){float d=length(gl_PointCoord-.5)*2.;float a=mix(smoothstep(1.,0.,d),smoothstep(1.,.8,d)*(.2+.8*smoothstep(.55,.92,d)),vb);gl_FragColor=vec4(vc.rgb,vc.a*a);}'}));
 PTS.frustumCulled=false;PTS.renderOrder=5;scene.add(PTS);
 const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),gr=x.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,255,255,.9)');gr.addColorStop(.55,'rgba(255,255,255,.35)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,128,128);GL=new THREE.CanvasTexture(c);
 RGG=new THREE.RingGeometry(.85,1,40).rotateX(-Math.PI/2)}
const FRY=[1,.96,.62],FRO=[1,.5,.08],FRR=[.62,.1,.02],_fq=[0,0,0];
function fireRamp(k){let a,b,u;if(k<.25){a=FRY;b=FRO;u=k/.25}else if(k<.7){a=FRO;b=FRR;u=(k-.25)/.45}else{a=FRR;b=FRR;u=0}const m=k<.7?1:1-(k-.7)/.3*.6;_fq[0]=(a[0]+(b[0]-a[0])*u)*m;_fq[1]=(a[1]+(b[1]-a[1])*u)*m;_fq[2]=(a[2]+(b[2]-a[2])*u)*m;return _fq}
function burst(p,n,col,o){o=o||{};n=n>0?Math.max(1,Math.round(n*(window.__FXQ||1))):0;const c=rgb(col);for(let i=0;i<n;i++){const a=rd()*6.283,sp=(o.sp||2)*(.4+rd()*.6);PA.push({x:p.x+(rd()-.5)*(o.r||.3),y:p.y+(o.y!=null?o.y:.9)+(rd()-.5)*(o.h||.3),z:p.z+(rd()-.5)*(o.r||.3),vx:Math.cos(a)*sp,vy:(o.vy!=null?o.vy:1)*(.3+rd())+(o.up!=null?o.up:.5)*rd(),vz:Math.sin(a)*sp,l:0,L:(o.life||.6)*(.7+rd()*.6),c,s:(o.size||.22)*(.6+rd()*.8),g:o.g!=null?o.g:6,b:o.bub?-1:1,f:o.fire?1:o.spark?2:0,w:rd()*6.283})}if(PA.length>NPT)PA.splice(0,PA.length-NPT)}
function ring(p,col,r1,L,y,r0){const m=new THREE.Mesh(RGG,new THREE.MeshBasicMaterial({color:col,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));m.position.set(p.x,y||.1,p.z);scene.add(m);RG.push({m,t:0,L:L||.6,r0:r0||.2,r1})}
function shoot(a,t,o){const ga=unitG.get(a),gt=unitG.get(t);if(!(o.A&&o.B)&&(!ga||!gt))return;const A=o.A?o.A.clone():ga.position.clone();if(!o.A)A.y+=1.1;const B=o.B?o.B.clone():gt.position.clone();if(!o.B)B.y+=.9;const g=new THREE.Group(),mt=c=>new THREE.MeshBasicMaterial({color:c});
 if(o.arrow){const sh=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,1.6,8).rotateX(Math.PI/2),mt(o.ac?o.ac[0]:0xfff0c0)),hd=new THREE.Mesh(new THREE.ConeGeometry(.16,.5,8).rotateX(Math.PI/2),mt(o.ac?o.ac[1]:0xff5a3a)),gw=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,1.8,8).rotateX(Math.PI/2),new THREE.MeshBasicMaterial({color:o.ac?o.ac[2]:0xffc060,transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false}));hd.position.z=1.05;g.add(sh,hd,gw);g.scale.setScalar(o.big?2.2:.9)}
 else if(o.card){g.add(new THREE.Mesh(new THREE.BoxGeometry(.34,.02,.48),mt(0xf4f0e6)),new THREE.Mesh(new THREE.BoxGeometry(.2,.03,.3),mt(rd()<.5?0xd22b2b:0x1a1a1a)))}
 else{g.add(new THREE.Mesh(new THREE.SphereGeometry(.28,12,10),mt(o.col)));if(o.glow)g.add(new THREE.Mesh(new THREE.SphereGeometry(.52,12,10),new THREE.MeshBasicMaterial({color:o.col,transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false})));g.scale.setScalar(o.sz||1)}
 g.position.copy(A);g.lookAt(B);scene.add(g);PJ.push({g,A,B,t:0,L:Math.max(.18,A.distanceTo(B)*(o.spd||(o.big?.028:.04))),o,ta:gt?gt.position:B.clone().setY(B.y-.9)})}
const auraOf=u=>{const s=FS.get(u);if(phase!=='play')return null;if(u.rg>0||(s&&s.an>performance.now()))return[0xb44dff,1];if(u.k==='gq'&&u.fire&&u.sh2>0)return[0xff6a14,.9];if(u.k==='aka'&&((T>>1)&1))return[0x4dff7a,1];if(u.weak)return[0xc8c84a,.8];return null};
function fxStep(dt){PU.value=renderer.domElement.height/(2*Math.tan(camera.fov*Math.PI/360));
 for(let i=PJ.length-1;i>=0;i--){const j=PJ[i],cl=j.o.col||0xffd27a;j.t+=dt;const k=Math.min(1,j.t/j.L);j.B.copy(j.ta);j.B.y+=.9;j.g.position.lerpVectors(j.A,j.B,k);if(!j.o.arrow)j.g.position.y+=Math.sin(k*Math.PI)*.5;
  if(j.o.card)j.g.rotateY(dt*28);else burst(j.g.position,j.o.big?3:2,cl,{sp:.3,life:.35,size:j.o.big?.42:.2,g:0,vy:0,up:0,y:0,r:.08,h:.08});if(j.o.ac)burst(j.g.position,4,j.o.ac[2],{sp:.12,life:.7,size:.34,g:0,vy:0,up:0,y:0,r:.04,h:.04});if(j.o.fire)burst(j.g.position,3,0xffc23a,{sp:.5,life:.5,size:.55,g:-2.5,vy:.5,up:.2,y:0,r:.15,h:.12});
  if(k>=1){const B=j.B.clone();B.y-=.9;if(j.o.card)burst(B,5,cl,{sp:1.6,size:.14,life:.3,g:5});else{burst(B,j.o.big?44:j.o.fire?30:20,cl,{sp:j.o.big?5:3,size:j.o.big?.4:.28,life:.7});if(j.o.fire)burst(B,16,0xffd24a,{sp:2,size:.4,life:.8,g:-2.5,vy:2});ring(B,cl,j.o.big?2.2:1.4,.5,.15)}if(j.o.big)shk=Math.max(shk,.6);scene.remove(j.g);j.g.traverse(q=>{if(q.geometry)q.geometry.dispose();if(q.material)q.material.dispose()});PJ.splice(i,1)}}
 for(let i=RG.length-1;i>=0;i--){const r=RG[i];r.t+=dt;const k=r.t/r.L,s=r.r0+(r.r1-r.r0)*(1-(1-k)*(1-k));r.m.scale.set(s,1,s);r.m.material.opacity=Math.max(0,1-k);if(k>=1){scene.remove(r.m);r.m.material.dispose();RG.splice(i,1)}}
 for(let i=BL.length-1;i>=0;i--){const b=BL[i];b.t+=dt;const k=b.t/b.L;b.lines.forEach(l=>{l.material.opacity=Math.max(0,1-k);l.visible=b.fl?true:rd()>.2});if(k>=1){b.lines.forEach(l=>{scene.remove(l);l.geometry.dispose();l.material.dispose()});BL.splice(i,1)}}
 unitG.forEach((g,u)=>{if(u.k==='gq'&&u.fire&&u.sh2>0&&g.visible&&phase==='play'&&rd()<dt*45)burst(g.position,1,rd()<.5?0xff6a14:0xffc23a,{sp:.35,y:.2+rd()*1.2,vy:1.5,g:-1.8,size:.36,life:.75,up:0,r:.55,h:.1})});
 const now=performance.now();
 unitG.forEach((g,u)=>{const a=g.userData.aura;if(!a)return;const A=g.visible?auraOf(u):null,m=a.material;m.opacity+=((A?A[1]*(.55+.2*Math.sin(now/200)):0)-m.opacity)*Math.min(1,dt*6);
  if(A){m.color.setHex(A[0]);a.scale.setScalar(1+.08*Math.sin(now/260));const k=A[0];
   if(rd()<dt*(k===0xb44dff?30:k===0x4dff7a?18:12)){if(k===0xc8c84a)burst(g.position,1,k,{sp:.2,y:1.8,vy:-.5,g:2,size:.16,life:.9,up:0});else burst(g.position,1,k,{sp:.5,y:.2,vy:k===0xb44dff?2.6:1.4,g:-.5,size:k===0xb44dff?.3:.2,life:.9,up:0,r:.7,h:.1})}}});
 for(let i=PA.length-1;i>=0;i--){const p=PA[i];p.l+=dt;if(p.l>=p.L){PA.splice(i,1);continue}p.vy-=p.g*dt;p.x+=p.vx*dt;p.y=Math.max(.05,p.y+p.vy*dt);p.z+=p.vz*dt;if(p.f===1){p.vx+=Math.sin(p.l*9+p.w)*dt*1.8;p.vz+=Math.cos(p.l*8+p.w)*dt*1.8;p.vx*=.95;p.vz*=.95}else{p.vx*=.98;p.vz*=.98}}
 PA.forEach((p,i)=>{const k=p.l/p.L;PB.p[i*3]=p.x;PB.p[i*3+1]=p.y;PB.p[i*3+2]=p.z;let cr=p.c[0],cg=p.c[1],cb=p.c[2],al=1-k,sz=p.b*p.s*(p.b<0?.6+.8*k:1-.5*k);
  if(p.f===1){const q=fireRamp(k);cr=q[0];cg=q[1];cb=q[2];al=Math.min(1,(1-k)*1.5);sz=p.s*(k<.25?.55+k*1.8:1.0-(k-.25)*.95)}
  else if(p.f===2){const q=fireRamp(Math.min(1,k*.8));cr=q[0];cg=q[1];cb=q[2];al=(1-k)*(.65+.35*Math.sin(p.l*60+p.w));sz=p.s*(1-.4*k)}
  PB.c.set([cr,cg,cb,al],i*4);PB.s[i]=sz});
 const g=PTS.geometry;g.setDrawRange(0,PA.length);['position','col','size'].forEach(n=>g.attributes[n].needsUpdate=true)}
/* افکت‌های رویدادی */
const MAGC={raf:0xfff2a0,bri:0x7dff6a,and:0x7fd0ff,ear:0xd9a441,dw:0xc040ff},lvOf=u=>Math.min(4,Math.round((u.bonus|0)/200));
/* (اینجا تابع تکراری flash(g,c,n) بود؛ چون flash(t) در game.js همیشه جایگزینش می‌شد حذف شد) */
function bolt(A,B,col){col=col||0x9fd8ff;const lines=[];for(let n=0;n<3;n++){const N=12,pts=[];for(let i=0;i<=N;i++){const f=i/N,p=A.clone().lerp(B,f),j=(i===0||i===N)?0:(n===0?.28:.5)*Math.sin(Math.PI*f);if(j){p.x+=(rd()-.5)*j*1.6;p.y+=(rd()-.5)*j*1.6;p.z+=(rd()-.5)*j*1.6}pts.push(p)}
  const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:n===0?0xffffff:col,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false}));l.renderOrder=6;l.frustumCulled=false;scene.add(l);lines.push(l);
  if(n===1)pts.forEach(p=>burst(p,1,col,{sp:.15,size:.32,life:.3,g:0,vy:0,up:0,y:0,r:.02,h:.02}))}
 BL.push({lines,t:0,L:.38,fl:0})}
function tracer(A,B,col,L,n){L=L||.25;n=n||10;const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints([A.clone(),B.clone()]),new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false}));l.renderOrder=6;l.frustumCulled=false;scene.add(l);BL.push({lines:[l],t:0,L,fl:1});
 for(let i=0;i<=n;i++)burst(A.clone().lerp(B,i/n),1,col,{sp:.05,size:.2,life:L*1.2,g:0,vy:0,up:0,y:0,r:.02,h:.02})}
function tileFire(P3,src,kind){const fl=kind==='fl',gq=kind==='gq';if(!fl)tracer(src,P3.clone().setY(.8),gq?0xff9a3a:0xffd9a0,.35,10);
 if(fl||gq){for(let s=1;s<=6;s++){const q=src.clone().lerp(P3,s/6);q.y=.5+.5*(1-s/6);burst(q,gq?3:5,0xff8a1a,{sp:.6+s*.15,size:(gq?.28:.4)+s*.05,life:.55,g:-2,vy:.5,up:.2,y:0,r:.2+s*.04,h:.1})}
  burst(P3,gq?16:30,0xff6a14,{sp:2.2,size:gq?.4:.6,life:.95,g:-3.5,vy:2.6,up:1,y:.2,r:.9});burst(P3,gq?8:16,0xffd24a,{sp:1.6,size:.4,life:.8,g:-3,vy:2.2,up:.8,y:.2,r:.7});ring(P3,0xff7a1a,1.15,.5,.15)}
 else{burst(P3,14,0xffa23a,{sp:4,size:.22,life:.4,g:4,y:.5,r:.8});ring(P3,0xffb060,1,.25,.15)}}
/* دید گرافیکی مخروط شلیک (همان هندسهٔ zep): اژدها و ماشین نبرد = شعله، ملکه باروت = شاتگان آتشی، ژپتو = شاتگان */
function zepFX(u,t,DM){const[q0,r0]=toA(u.c,u.r),[q1,r1]=toA(t.c,t.r),d=DIR.findIndex(([a,b])=>q1-q0===a&&r1-r0===b),gu=unitG.get(u);if(d<0||!gu)return;
 const A=DIR[(d+5)%6],B=DIR[d],C=DIR[(d+1)%6],src=gu.position.clone();src.y+=1;
 const kind=(u.k==='fd'||u.k==='mac')?'fl':u.k==='gq'&&u.fire?'gq':'sg';
 if(kind==='fl'){if(CX&&CX.a===u){CX.near=true;CX.snd=true}SFX.flameBig();flash(gu,0xffa040,18);shk=Math.max(shk,.45)}
 else{flash(gu,kind==='gq'?0xff8a30:0xfff0b0,kind==='gq'?12:22);shk=Math.max(shk,kind==='gq'?.4:.8)}
 DM.forEach((dm,i)=>{const k=i+1;let q=q0+k*A[0],r=r0+k*A[1];const L=[];
  for(let j=0;j<k;j++){q+=B[0]-A[0];r+=B[1]-A[1];L.push([q,r])}
  for(let j=1;j<k;j++){q+=C[0]-B[0];r+=C[1]-B[1];L.push([q,r])}
  L.forEach(([a,b])=>{const[c,w]=toO(a,b);if(!inb(c,w))return;const P3=new THREE.Vector3(CELL_X(c),0,CELL_Z(c,w));setTimeout(()=>tileFire(P3,src,kind),(k-1)*(kind==='sg'?40:130))})})}
/* صدای ضربهٔ معمولی هر قهرمان؛ مقدار برگشتی یعنی «صدا مدیریت شد» */
function atkSnd(a,t){const k=a.k;
 if(k==='dk')return 1;
 if(k==='mus'){SFX.cyber(1);return 1}
 if(k==='aka'||k==='pri'){SFX.katana(1);return 1}
 if(k==='bud'){SFX.arrow(1);return 1}
 if(k==='fd'){SFX.flamethrower(1);return 1}
 if(k==='ft'||k==='jack')return 1;
 if(k==='med'){SFX.snake(1);return 1}
 if(k==='raf'){SFX.flame(.9,.24);return 1}if(MAGC[k]){SFX.magic(1);return 1}
 if(k==='ali'){if(CX)CX.al=1;return 1}
 if(k==='mar'){const lv=lvOf(a);SFX.marsa(lv);if(lv>=4)shk=Math.max(shk,.5);return 1}
 if(k==='zep'){SFX.shotgun(1);return 1}
 if(k==='gq'){SFX.shotgun(1);if(a.fire)SFX.flame(.7);return 1}
 if(k==='cri'){if(CX)CX.cr=1;return 1}
 if(k==='mak'){if(CX)CX.mk=1;return 1}
 if(k==='mac'){if(a.mb)SFX.stick();return 1}
 if(k==='iw')return 0;
 if(H[k].r===1){SFX.sword(1);return 1}
 return 0}
function abSnd(u,t){const k=u.k;
 if(k==='dk')return 1;
 if(k==='ali'){if(CX)CX.al=1;return 1}
 if(k==='fd'||k==='jack'||k==='ft')return 1;
 if(k==='zep'){SFX.shotgunBig();os('sine',70,25,.6,1.3);nz(.5,'lowpass',900,80,1,1);return 1}
 if(k==='gq'){SFX.ignite();return 1}
 if(k==='mar'){SFX.marsa(lvOf(u));return 1}
 if(k==='cri'){SFX.crimsonRally();return 1}
 if(k==='mak'){SFX.reload();return 1}
 if(k==='mac'&&u.mb)return 1;
 if(k==='ber'){for(let i=0;i<8;i++)SFX.sword(.9,i*.13);return 1}
 if(k==='aka'){SFX.wind(1);return 1}
 if(k==='dw'||k==='and'){SFX.magic(1.2);return 1}
 if(['acro','doj','blk','eli','dk','jal','dn'].includes(k)){SFX.sword(1.1);return 1}
 return 0}
function rafFX(a,t){const D=dist(a,t),[q1,r1]=toA(a.c,a.r),[q2,r2]=toA(t.c,t.r);[0,1].forEach(i=>{const f=(D+i+1)/D,[c,y]=toO(...cr(q1+(q2-q1)*f,r1+(r2-r1)*f));if(!inb(c,y)||at(c,y))return;const P3=new THREE.Vector3(CELL_X(c),0,CELL_Z(c,y));const ga=unitG.get(a),gt=unitG.get(t),bs=270+Math.max(180,(ga&&gt?ga.position.distanceTo(gt.position):1)*45);setTimeout(()=>{try{rfImpact(P3,.5)}catch(e){}},bs+(i+1)*140)})}
function dwEruption(p){try{SFX.magic&&SFX.magic(1.4)}catch(e){}
 const P=p.clone();P.y=0;
 ring(P,0x6a1b9a,2.4,.7,.06);setTimeout(()=>ring(P,0xc040ff,3.2,.8,.08),120);
 burst(P,30,0x8a2be2,{sp:1.2,vy:.3,g:-1,size:.5,life:.6,y:0,r:.9,h:.05});
 const grp=new THREE.Group(),sp=[],mt=new THREE.MeshBasicMaterial({color:0xc040ff,transparent:true,opacity:.95}),mg=new THREE.MeshBasicMaterial({color:0xe9a8ff,transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false});
 for(let i=0;i<7;i++){const r=i?.6:0,h=i?1.7:2.8,an=i/6*Math.PI*2,m=new THREE.Mesh(new THREE.ConeGeometry(i?.2:.3,h,6),mt),w=new THREE.Mesh(new THREE.ConeGeometry(i?.34:.5,h*1.05,6),mg);m.add(w);m.position.set(Math.cos(an)*r,-h,Math.sin(an)*r);m.userData.h=h;m.rotation.z=i?(Math.random()-.5)*.35:0;grp.add(m);sp.push(m)}
 grp.position.set(P.x,0,P.z);scene.add(grp);const t0=performance.now();let boom=0;
 (function f(){const e=performance.now()-t0,k=Math.min(1,e/220),dn=e>700?Math.min(1,(e-700)/250):0;
  sp.forEach(m=>{const h=m.userData.h;m.position.y=h/2-h*(1-k)-h*dn});mt.opacity=.95*(1-dn);mg.opacity=.35*(1-dn);
  if(e<700&&Math.random()<.6)burst(P,2,0xd070ff,{sp:.9,vy:2.5,g:1,size:.28,life:.5,y:.2,r:.7});
  if(!boom&&e>=200){boom=1;ring(P,0xffffff,2,.35,.12);burst(P,36,0xffffff,{sp:4,vy:3,g:3,size:.3,life:.6,y:.4,r:.5});shk=Math.max(shk,.5)}
  if(e<950)return requestAnimationFrame(f);
  scene.remove(grp);grp.traverse(q=>{if(q.geometry)q.geometry.dispose()});mt.dispose();mg.dispose()})()}
function hitFX(a,t,d){const gt=unitG.get(t),ga=unitG.get(a);if(!gt)return;if(ga&&a!==t){const dx=gt.position.x-ga.position.x,dz=gt.position.z-ga.position.z;if(dx||dz){ga.userData.fy=Math.atan2(dx,dz);ga.userData.ft=1}}const k=a.k,tr=TR[k]||[],big=d>700,p=gt.position,own=!!CX&&CX.a===a,ab=own&&CX.ab,snd=own&&CX.snd,V=THREE.Vector3,
 eye=g=>g.position.clone().add(new V(0,1.1,0)),tgt=g=>g.position.clone().add(new V(0,.9,0)),
 dflt=()=>{if(!snd&&gok('ht',60))SFX.hit(big)};
 if(k==='aka'){try{akaFX(a,t,d,ab)}catch(e){}}
 if(k==='cri'){criFX(a,t,d,ab);return}
 if(k==='dk'){dkImpact(a,t,d,ab);return}
 if(k==='mak'){makFX(a,t,d);return}
 if(k==='ali'){aliFX(a,t,d,ab);return}
 if(k==='que'){const m=t.max,col=m>=1620?0xb44dff:m>=810?0x3aa0ff:0x3dff6a;if(gok('qq',120)){SFX.zap(m>=1620?300:m>=810?500:800);shoot(a,t,{col})}return}
 if(k==='ft'){const i=own?CX.i++:0,from=own&&CX.prev?CX.prev.clone():(ga?eye(ga):tgt(gt)),to=tgt(gt);if(own)CX.prev=to.clone();
  setTimeout(()=>{bolt(from,to,0x9fd8ff);burst(to,18,0x9fd8ff,{sp:3.5,size:.26,life:.5,g:3,y:0});burst(to,6,0xffffff,{sp:2,size:.3,life:.3,y:0})},i*90);
  SFX.thunder(i?.65:1,i*.09,i===0);shk=Math.max(shk,.22);return}
 if(k==='fd'){
  if(ab){burst(p,26,0xff6a14,{sp:2.5,vy:2.4,g:-3,size:.5,life:.9});burst(p,12,0xffd24a,{sp:1.8,vy:2,g:-2.5,size:.4,life:.8});return}
  shoot(a,t,{col:0xff7a1a,fire:1,glow:1,sz:1.7,spd:.05});return}
 if(k==='mac'){
  if(ab||(own&&CX.near)){burst(p,26,0xff6a14,{sp:2.5,vy:2.4,g:-3,size:.5,life:.9});burst(p,12,0xffd24a,{sp:1.8,vy:2,g:-2.5,size:.4,life:.8});if(ab)ring(p,0xff7a1a,1.6,.4,.15);return}
  const i=own?CX.i++:0,A=ga?eye(ga):null,B=tgt(gt);B.x+=(rd()-.5)*.6;B.z+=(rd()-.5)*.6;if(A){A.x+=(rd()-.5)*.3;A.z+=(rd()-.5)*.3}
  SFX.mg(1,i*.045);setTimeout(()=>{if(A)tracer(A,B,0xffd27a,.22,7);burst(B,3,0xffd27a,{sp:1.5,size:.14,life:.2,g:4,y:0});if(i%3===0)flash(ga,0xfff0b0,3)},i*45);return}
 if(k==='jack'){const i=own?CX.i++:0,A=ga?eye(ga):null,B=tgt(gt);SFX.card(i*.07);if(A)setTimeout(()=>shoot(a,t,{card:1,col:0xffffff,spd:.03,A,B}),i*70);return}
 if(k==='mar'){const lv=lvOf(a);if(ga){flash(ga,0xffd27a,4+lv*3);tracer(eye(ga),tgt(gt),lv>=3?0xff8a3a:0xffe9a0,.2+lv*.05,10)}
  burst(p,6+lv*5,0xffb060,{sp:2+lv,size:.18+lv*.05,life:.4,g:5});if(lv>=3){ring(p,0xffb060,1.3+lv*.3,.35,.15);shk=Math.max(shk,lv>=4?.55:.25)}return}
 if(k==='med'){burst(p,12,0x7dff6a,{sp:2,size:.22,life:.55});ring(p,0x7dff6a,1,.3,.15);return}
 if(k==='doj'){dojFX(a,t,d,ab);return}
 if(k==='raf'&&!ab&&own&&!CX.rf){CX.rf=1;rafFX(a,t)}
 if(k==='dw'){
   if(ab){dwEruption(p);if(ga)flash(ga,0xc040ff,12);return}
   const dl=window.DWD||300;
   if(window.DWSPL){setTimeout(()=>{burst(p,16,0xc040ff,{sp:3,size:.3,life:.6,vy:2,g:2,y:.2});ring(p,0xe080ff,1,.4,.15)},dl);return}
   shoot(a,t,{col:0xc040ff,glow:1,sz:1.6,spd:.05});
   setTimeout(()=>{ring(p,0xc040ff,2.6,.6,.12);ring(p,0xffffff,1.6,.4,.15);burst(p,40,0xc040ff,{sp:4.5,size:.4,life:.8,vy:2.5,g:2,y:.2,r:.6});burst(p,16,0xffffff,{sp:3,size:.25,life:.5,y:.3});shk=Math.max(shk,.45);try{SFX.boom&&SFX.boom()}catch(e){}},dl);
   return}
  if(MAGC[k]){if(k==='raf')return;shoot(a,t,{col:MAGC[k],glow:1,sz:ab?1.8:1,big:ab?1:0,spd:.05});return}
 if(tr.includes('انجماد')){if(gok('ic',90))SFX.ice();burst(p,16,0xbfe9ff,{sp:3,size:.2,life:.7,vy:1.5,g:8});burst(p,6,0xffffff,{sp:2,size:.3,life:.5});return}
 if(tr.includes('ساچمه')){
  if(ga){const A=eye(ga),B=tgt(gt);for(let i=0;i<3;i++){const b=B.clone();b.x+=(rd()-.5)*.8;b.z+=(rd()-.5)*.8;tracer(A,b,0xffc27a,.14,6)}}
  if(gok('gn',140)){flash(ga,0xfff0b0,14);shk=Math.max(shk,ab?.8:.35)}
  burst(p,22,0xffa23a,{sp:5,size:.24,life:.5,g:4});ring(p,0xffb060,1.3,.3,.15);
  if(k==='gq'&&a.fire)burst(p,20,0xff5a14,{sp:2.5,vy:2.2,g:-3,size:.5,life:.8});return}
 if(k==='bud'&&own&&!ab){shoot(a,t,{arrow:1,col:0x3aa0ff,ac:[0xcfe8ff,0x2f8cff,0x4aa8ff],spd:.05});return}
 dflt();
 if(k==='aka'||k==='pri'||k==='mus')burst(p,8,0xcfeaff,{sp:4.5,size:.12,life:.22,g:2});else if(H[k].r===1)burst(p,5,0xfff3c0,{sp:3.2,size:.14,life:.25,g:8});
 burst(p,big?16:9,TEAM[a.o],{sp:2.6,size:.2,life:.45})}
function weakFX(g){SFX.weak();popup('ضعیف',g.position,'#d6e04a');burst(g.position,22,0xc8c84a,{sp:1.2,y:1.9,vy:-1,g:3,size:.2,life:1,up:0,r:.5});ring(g.position,0xc8c84a,.3,.8,1.6,1.8)}
function marsaFX(g){[0,220,440,660].forEach(ms=>setTimeout(()=>{if(g.parent)burst(g.position,7,0xff2a3a,{sp:.9,y:.4,vy:1.8,g:-.3,size:.5,life:1.1,bub:1,up:0,r:.7,h:.4})},ms));ring(g.position,0xff2a3a,2.2,.7)}
function rageFX(g){burst(g.position,26,0xb44dff,{sp:3,life:.8});ring(g.position,0xb44dff,2.4,.7)}
/* وصل کردن به بازی */
{const _hit=hit;hit=function(a,t,d){const h0=t.hp,r=_hit(a,t,d);try{if(r>0&&phase==='play'&&FXI){const dl0=hitDelay(a,t);queueVis(t,h0,dl0);hitFX(a,t,r);if(t.k==='dk'&&t.hp>0)setTimeout(()=>{try{const f=dkFig(unitG.get(t));f&&f.userData.dk.hurt()}catch(e){}},dl0);xtraFX(a,t);if(a.k==='mak'&&t===a)say('I lost the gamble.',0,'mak');if(t.hp<=0){const n=performance.now();if(n-_dT>180){_dT=n;SFX.die()}}}}catch(e){}return r};

/* افکت‌ها و صداهای اضافه */
SFX.gulp=()=>{for(let i=0;i<3;i++)os('sine',320+i*40,110,.12,.3,i*.2)};
/* ---------- صداهای جدید ---------- */
function wn(d,f0,f1,q,g,dl,ty){const a=au();if(!a)return;if(!NBF){NBF=a.createBuffer(1,a.sampleRate,a.sampleRate);const x=NBF.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=rd()*2-1}
 const t=a.currentTime+(dl||0),s=a.createBufferSource(),f=a.createBiquadFilter(),v=a.createGain();s.buffer=NBF;s.loop=true;f.type=ty||'bandpass';f.Q.value=q;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(f1,t+d);
 v.gain.setValueAtTime(.001,t);v.gain.exponentialRampToValueAtTime(g,t+d*.35);v.gain.exponentialRampToValueAtTime(.001,t+d);s.connect(f);f.connect(v);v.connect(MG);s.start(t);s.stop(t+d+.05)}
/* شعله‌افکن: جرقهٔ شروع + غرش پیوسته و پرحجم + ترق‌ترق شعله */
SFX.flamethrower=g=>{g=g||1;nz(.06,'highpass',2500,8000,1,.5*g);wn(.85,500,1500,.9,.8*g,.02);wn(.8,1800,500,.7,.6*g,.03,'lowpass');os('sawtooth',105,58,.8,.14*g,.03);
 for(let i=0;i<16;i++)nz(.025,'highpass',3500+rd()*3500,8000,1,.2*g,.08+i*.045+rd()*.03)};
/* باد: وزش آرام که بالا می‌آید و می‌رود + سوت نازک */
SFX.wind=g=>{g=g||1;wn(1.3,300,1300,.7,.7*g,0);wn(1.2,1300,420,1.1,.5*g,.15);wn(.9,2200,3800,2,.16*g,.3);wn(1,180,500,.5,.5*g,.05,'lowpass');os('sine',520,900,.9,.05*g,.1)};
/* تیر: زه کمان + ویز هوا */
SFX.arrow=g=>{g=g||1;os('sine',190,110,.15,.3*g);nz(.18,'bandpass',900,3500,1.5,.45*g,.03);nz(.05,'highpass',4000,8000,1,.25*g,.08);os('triangle',700,300,.12,.12*g,.04)};
SFX.die=()=>{os('sine',160,40,.35,.7);nz(.3,'lowpass',900,100,1,.6);os('triangle',300,90,.25,.25,.05)};
SFX.turn=()=>{[660,880].forEach((f,i)=>os('sine',f,f,.25,.22,i*.12))};
SFX.win=()=>{[523,659,784,1047].forEach((f,i)=>{os('triangle',f,f,.4,.3,i*.14);os('sine',f*2,f*2,.3,.08,i*.14)})};
let _dT=0;
{const _et=endTurn;endTurn=function(a){const r=_et.apply(this,arguments);try{if(phase==='play'&&FXI&&!over)SFX.turn()}catch(e){}return r}}
{const _af=after;after=function(){const o=over,r=_af.apply(this,arguments);try{if(!o&&over)SFX.win()}catch(e){}return r}}

const pk=a=>a[Math.random()*a.length|0];
function flyMesh(m,A,B,dl,dur,cb){setTimeout(()=>{scene.add(m);const t0=performance.now();(function f(){const k=Math.min(1,(performance.now()-t0)/dur);m.position.lerpVectors(A,B,k*k);m.rotation.y+=.45;if(k<1)requestAnimationFrame(f);else{scene.remove(m);cb&&cb()}})()},dl)}
function mkAxe(){const g=new THREE.Group(),h=new THREE.Mesh(new THREE.BoxGeometry(.09,1,.09),new THREE.MeshBasicMaterial({color:0x6b3f1d})),b=new THREE.Mesh(new THREE.BoxGeometry(.55,.34,.07),new THREE.MeshBasicMaterial({color:0xcfd6df}));b.position.set(.28,.38,0);g.add(h,b);g.scale.setScalar(1.4);return g}
function mkDrone(){const g=new THREE.Group(),b=new THREE.Mesh(new THREE.BoxGeometry(.5,.14,.5),new THREE.MeshBasicMaterial({color:0x2b2f36})),r=new THREE.Mesh(new THREE.BoxGeometry(1,.03,.08),new THREE.MeshBasicMaterial({color:0xff7a1a}));r.position.y=.1;g.add(b,r);return g}
function droneStrike(u){U.filter(x=>x.hp>0&&x.o!==u.o&&!x.inv&&x.bb>0).forEach((x,i)=>{const g=unitG.get(x);if(!g)return;x.bbv=x.bb;const B=g.position.clone().add(new THREE.Vector3(0,.9,0)),A=B.clone().add(new THREE.Vector3(-4,7,-2));flyMesh(mkDrone(),A,B,i*260,800,()=>{burst(B,26,0xff6a14,{sp:3,vy:2,g:-2,size:.5,life:.7,y:0});ring(B,0xffa040,1.8,.5,.15);SFX.boom&&SFX.boom();shk=Math.max(shk,.3);x.bbv=null})})}
macBomb=function(u){const tg=U.filter(x=>x.hp>0&&x.o!==u.o&&!x.inv&&x.bb>0);if(!tg.length)return;
 if(!FXI||phase!=='play'){tg.forEach(x=>{hit(u,x,90*x.bb);x.bb=0});return}
 LOCK++;let left=tg.length;
 tg.forEach((x,i)=>{const g=unitG.get(x),n=x.bb;const land=()=>{if(g){const B=g.position.clone().add(new THREE.Vector3(0,.9,0));burst(B,26,0xff6a14,{sp:3,vy:2,g:-2,size:.5,life:.7,y:0});ring(B,0xffa040,1.8,.5,.15)}
  SFX.boom();shk=Math.max(shk,.3);if(x.hp>0){CX={a:u,i:0,ab:true,snd:true,near:false,prev:null};try{hit(u,x,90*n)}finally{CX=null}}x.bb=0;after();if(--left===0){LOCK--;draw()}};
  if(!g){land();return}const B=g.position.clone().add(new THREE.Vector3(0,.9,0)),A=B.clone().add(new THREE.Vector3(-4,7,-2));flyMesh(mkDrone(),A,B,i*260,800,land)})};
function axeDrop(u){(u.axT||[]).forEach((x,i)=>{const g=unitG.get(x);if(!g)return;const B=g.position.clone().add(new THREE.Vector3(0,.8,0));flyMesh(mkAxe(),B.clone().add(new THREE.Vector3(0,8,0)),B,i*450,450,()=>{burst(B,16,0xffe0a0,{sp:3,vy:2,size:.25,life:.4,y:0});ring(B,0xffffff,1.3,.35,.15);SFX.hit(1);shk=Math.max(shk,.35)})})}
function burnFX(t){const g=unitG.get(t),n0=performance.now();if(!g||t._bt>n0)return;t._bt=n0+1000;let n=0;const id=setInterval(()=>{burst(g.position,4,n%2?0xff7a1a:0xffd24a,{sp:.6,vy:1.6,g:-3,size:.35,life:.45,r:.5});if(++n>=8)clearInterval(id)},125)}
function xtraFX(a,t){if(a.o!==t.o&&sy(a,'سرخ',2)&&t.hp>0)burnFX(t);
 if(t.k==='fd'&&t.hp<=0&&t.dd&&!t.fx1){t.fx1=1;const g=unitG.get(t);if(g){const p=g.position;burst(p,44,0xff6a14,{sp:4.5,vy:3,g:-3,size:.65,life:1.1});burst(p,20,0xffd24a,{sp:3,vy:2.5,g:-2,size:.45,life:.9});ring(p,0xff7a1a,3.6,.7,.12);ring(p,0xffd24a,2.4,.5,.15);shk=Math.max(shk,.55)}}
 if(t.dd2&&!t.fx2){t.fx2=1;say('System overclocked',1)}}
function voiceAfter(u,t,p){const k=u.k;
 if(k==='ali')say(t&&t.hp<=0?'Headshot':pk(['I hit the enemy','Nice shot']),0,'ali');
 else if(k==='jal'){say(pk(['Time to slice','I am executioner']),0,'jal');axeDrop(u)}
 else if(k==='pri')say(p.b&&p.b.hp<=0?'Death is sacred':pk(['I am getting stronger','Delicious']),0,'pri');
 else if(k==='acro')say(pk(['Acrobatic movements','Can you be as agile as me?']),0,'acro');
 else if(k==='and')say(pk(['The horoscope was correct.','The majesty of a black hole']),0,'and');
 else if(k==='col'){if(p.n<=1)SFX.gulp();else say(p.n===2?'Mysterious drink':"Enemy's blood",0,'col')}}
const _ua=useAb;useAb=function(u,t){const k=u.k,mb=!!u.mb;if(FXI)try{const g=unitG.get(u);
  if(k==='cri'){vox(1);const f0=criFig(g),P0=g.position.clone();if(f0)f0.userData.cri.rally();setTimeout(()=>{try{ring(P0,0xff2a2a,3.2,.8);ring(P0,0xff8a3a,2.2,.6);burst(P0,30,0xff3030,{sp:4,life:.8});burst(P0,16,0xffd27a,{sp:3,size:.16,life:.4,g:4,y:0});shk=.7}catch(e){}},1100)}
  else if(k==='mak'){say('Reloading',0,'mak');makReload(u)}else if(k==='mus')say('Ronin Tactics',2,'mus');else if(k==='ear')say('The art of creating',0,'ear');else if(k==='gq')say('Good choice',0,'gq');
  else if(k==='mac'){say(mb?'Launcher disabled':'Launcher activated',1);}
  else if(k==='ber'){const s=FS.get(u);if(s)s.an=performance.now()+3500;rageFX(g)}
  if(phase==='play'){CX={a:u,i:0,ab:true,snd:false,near:false,prev:null};CX.snd=!!abSnd(u,t);if(k==='dk')dkStart(u,t,true);if(!CX.snd&&k!=='que')SFX.ab()}}catch(e){}
 try{const p={n:Math.min(3,D[1-u.o]),b:k==='pri'?U.filter(x=>x.o===u.o&&x!==u).reduce((m,x)=>x.hp>m.hp?x:m,{hp:-1}):null};_ua(u,t);if(FXI&&phase==='play')try{voiceAfter(u,t,p)}catch(e){}}finally{if(CX&&CX.al&&!CX.alDone)try{aliFX(u,t,0,true)}catch(e){}CX=null}};
{const _ua2=useAb;useAb=function(u,t){let g=null,pl=null;
 if(u.k==='acro'&&FXI&&phase==='play')try{g=unitG.get(u);pl=g&&acroPlan(u)}catch(e){}
 if(!pl)return _ua2(u,t);
 const pts=[[u.c,u.r],...pl.path.map(x=>[x.c,x.r]),pl.exit];g.userData.anim=1;
 try{return _ua2(u,t)}finally{try{u.c=pts[0][0];u.r=pts[0][1];draw();acroAnim(g,pts,u,pl.exit)}catch(e){g.userData.anim=0;u.c=pl.exit[0];u.r=pl.exit[1];draw()}}}}
function acroAnim(g,pts,uu,ex){const af=acFig(g),d=g.userData,inner=g.children[0],L=210,N=pts.length-1,P=pts.map(p=>V3(p[0],p[1])),t0=performance.now();let last=0;
 const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:GL,color:0xffeeb0,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,opacity:.9}));halo.scale.setScalar(3.2);halo.renderOrder=9;scene.add(halo);
 ring(P[0],0xffe9a0,2.2,.5,.15);SFX.wind&&SFX.wind(.7);LOCK++;
 (function f(){const e=performance.now()-t0,i=Math.min(N-1,Math.floor(e/L)),k=Math.min(1,(e-i*L)/L),a=P[i],b=P[i+1],x=a.x+(b.x-a.x)*k,z=a.z+(b.z-a.z)*k,y=Math.sin(k*Math.PI)*1.5,pp=new THREE.Vector3(x,y,z);
  g.position.set(x,y,z);if(af)af.userData.acro.flip(-k*Math.PI*2,k);else inner.rotation.x=-k*Math.PI*2;d.hf=1;d.fy=Math.atan2(b.x-a.x,b.z-a.z);d.ft=1;
  halo.position.set(x,y+.9,z);halo.material.opacity=.65+.25*Math.sin(e/35);halo.scale.setScalar(3+.5*Math.sin(e/50));
  burst(pp,4,0xcfe8ff,{sp:.3,size:.55,life:.45,g:0,vy:0,up:0,y:.5,r:.15,h:.6});
  if(i>last){last=i;const q=P[i];ring(q,0xfff0c0,1.6,.35,.15);burst(q,14,0xffe9a0,{sp:3,size:.3,life:.4,g:2,y:.6})}
  if(e<N*L)return requestAnimationFrame(f);
  scene.remove(halo);halo.material.dispose();inner.rotation.x=0;if(af)af.userData.acro.flip(0,0);if(uu&&ex){uu.c=ex[0];uu.r=ex[1]}d.anim=0;g.position.set(P[N].x,0,P[N].z);ring(P[N],0xffe9a0,2,.5,.15);LOCK--;draw()})()}
const _at=attack;attack=function(a,t){if(FXI&&phase==='play')try{CX={a,i:0,ab:false,snd:false,near:false,prev:null};CX.snd=!!atkSnd(a,t);if(a.k==='dk')dkStart(a,t,false)}catch(e){}
 const fl=U.filter(x=>x.o!==a.o&&x.hp>0&&x.hp>=x.max);try{return _at(a,t)}finally{if(CX&&CX.mk&&!CX.mkDone)try{makFX(a,t,0)}catch(e){}if(CX&&CX.cr&&!CX.crDone)try{criFX(a,t,0,false)}catch(e){}if(CX&&CX.al&&!CX.alDone)try{aliFX(a,t,0,false)}catch(e){}CX=null;if(a.k==='zep'&&fl.some(x=>x.hp<=0))say('One shot!',0,'zep')}};
const _zp=zep;zep=function(u,t,DM){if(FXI&&phase==='play')try{zepFX(u,t,DM||[840,630,420,210])}catch(e){}return _zp(u,t,DM)};
const _mk=mkUnit;mkUnit=function(u){if(!FXI)fxInit();const g=_mk(u),bg=[];for(let i=0;i<8;i++){const b=new THREE.Group(),d=new THREE.Mesh(new THREE.SphereGeometry(.13,10,8),new THREE.MeshBasicMaterial({color:0x151515})),l=new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),new THREE.MeshBasicMaterial({color:0xff2a1a}));l.position.set(0,.15,0);b.add(d,l);const an=i*Math.PI/4;b.position.set(Math.cos(an)*.55,.9+.12*(i%2),Math.sin(an)*.55);b.visible=false;g.add(b);bg.push(b)}g.userData.bm=bg;const a=new THREE.Mesh(new THREE.PlaneGeometry(2.6,2.6).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:GL,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));a.position.y=.05;g.add(a);g.userData.aura=a;return g};
const _su=syncUnits;syncUnits=function(){_su();if(!FXI)return;for(const u of [...FS.keys()])if(!U.includes(u))FS.delete(u);
 U.forEach(u=>{const g=unitG.get(u);if(!g)return;if(g.userData.bm)g.userData.bm.forEach((m,i)=>m.visible=i<Math.min(8,u.bb|0));const s=FS.get(u);if(!s){FS.set(u,{c:u.c,r:u.r,wk:u.weak,bn:u.bonus,rg:u.rg>0,an:0});return}
  if((s.c!==u.c||s.r!==u.r)&&phase==='play'&&gok('mv',100)){SFX.move();burst(g.position,6,0xcfc2a8,{sp:1,y:.1,vy:.6,g:2,size:.3,life:.5,up:0,r:.5})}
  if(u.weak&&!s.wk)weakFX(g);if(u.k==='mar'&&u.bonus>s.bn)marsaFX(g);if(u.rg>0&&!s.rg)rageFX(g);
  s.c=u.c;s.r=u.r;s.wk=u.weak;s.bn=u.bonus;s.rg=u.rg>0})};
const _pc=placeCamera;placeCamera=function(){_pc();const n=performance.now(),dt=Math.min(.05,(n-t0)/1000);t0=n;if(!FXI)return;try{fxStep(dt)}catch(e){}if(shk>.01){camera.position.x+=(rd()-.5)*shk*.5;camera.position.y+=(rd()-.5)*shk*.5;shk*=Math.exp(-dt*6)}else shk=0}}

/* ===== صدای اختصاصی شمشیر کریمسون: تیغهٔ سنگین، زوزهٔ فولاد، کوبش بم و زنگ فلزی ===== */
SFX.crimson=(g,ab)=>{g=g||1;const w=ab?.34:.2,b=ab?.525:.37;
 nz(.18,'bandpass',500,1600,2.5,.25*g,0);nz(.08,'highpass',3000,6000,1,.18*g,.04);               // خش زره و شنل هنگام بالا بردن
 if(ab)os('sawtooth',95,170,.38,.14*g,0);
 nz(.3,'bandpass',260,3400,1.7,.65*g,w);nz(.24,'bandpass',3400,650,1.5,.5*g,w+.1);os('sawtooth',130,48,.34,.16*g,w);os('sine',2600,900,.2,.05*g,w+.05);   // سوت تیغه
 os('sine',120,36,.4,1.25*g,b);os('sine',64,30,.5,.8*g,b);nz(.12,'lowpass',2400,260,1,1.05*g,b);nz(.05,'highpass',2500,9000,.9,.75*g,b);          // ضربه
 [[1,1],[2.76,.62],[5.4,.45],[8.93,.3]].forEach((r,i)=>os('triangle',610*r[0],600*r[0],.95-i*.16,.22*g*r[1],b+.005));                               // زنگ فلزی (طیف ناهماهنگ)
 [68,69.6].forEach(f=>os('sawtooth',f*1.6,f*.7,.5,.13*g,b));                                                                                       // غرش سرخ
 if(ab){nz(.9,'lowpass',500,70,.8,.5*g,b);os('sine',48,26,.9,.9*g,b+.02)}};
SFX.crimsonRally=()=>{os('sawtooth',110,165,.9,.2,0);os('sawtooth',111.5,167,.9,.2,0);os('square',220,330,.7,.07,.05);nz(.6,'bandpass',300,1500,1.5,.3,0);
 nz(.25,'bandpass',400,2800,1.5,.5,.5);os('sine',100,34,.5,1.3,1.1);nz(.15,'lowpass',2200,200,1,1.1,1.1);
 [[1,1],[2.76,.6],[5.4,.4]].forEach((r,i)=>os('triangle',480*r[0],470*r[0],1.4-i*.3,.22*r[1],1.1));nz(.9,'lowpass',500,70,.8,.45,1.1)};
/* ===== ملکهٔ ماکائو: صدای هفت‌تیر، انیمیشن شلیک، رد گلوله ===== */
SFX.revolver=(g,dl)=>{g=g||1;dl=dl||0;
 // کشیدن چکش (سه کلیک مکانیکی)
 nz(.02,'bandpass',2600,2000,5,.35*g,dl);os('triangle',1800,1200,.03,.12*g,dl);
 nz(.02,'bandpass',3200,2400,5,.4*g,dl+.06);os('triangle',2400,1500,.03,.12*g,dl+.06);
 nz(.025,'bandpass',1500,1200,4,.45*g,dl+.12);
 // شلیک: ترق تیز + انفجار + کوبش بم + پژواک
 const b=dl+.24;
 nz(.03,'highpass',2500,9000,.7,1.7*g,b);
 nz(.22,'lowpass',6000,500,.8,1.5*g,b);
 os('sine',150,38,.32,1.3*g,b);os('sawtooth',520,90,.08,.3*g,b);
 os('sine',2100,2000,.3,.05*g,b+.02);
 nz(.5,'bandpass',1400,300,1.2,.35*g,b+.05);
 nz(.7,'lowpass',900,120,.7,.25*g,b+.14)};
SFX.reload=()=>{const c=(dl,f,g)=>{nz(.02,'bandpass',f,f*.8,5,g||.4,dl);os('triangle',f*.9,f*.6,.03,.1,dl)};
 c(0,1800,.45);nz(.12,'bandpass',900,2400,2,.25,.08);
 for(let i=0;i<6;i++){os('sine',3600+rd()*1200,2800,.12,.1,.28+i*.045+rd()*.02);nz(.03,'bandpass',4200,3000,3,.15,.28+i*.045)}
 for(let i=0;i<6;i++)c(.62+i*.11,1400+rd()*500,.32);
 nz(.05,'lowpass',1800,300,2,.6,1.4);os('triangle',1200,700,.05,.2,1.4);nz(.025,'bandpass',2600,2200,5,.5,1.44)};
const MKC={};
function makFig(g){const i=g&&g.children[0];return i&&i.children.find(o=>o.userData&&o.userData.mak)}
function makFlash(P,D){
 if(!MKC.tex){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,2,64,64,62);
  g.addColorStop(0,'rgba(255,255,240,1)');g.addColorStop(.25,'rgba(255,210,110,.85)');g.addColorStop(1,'rgba(255,120,30,0)');x.fillStyle=g;x.fillRect(0,0,128,128);
  x.strokeStyle='rgba(255,230,160,.9)';x.lineWidth=5;x.lineCap='round';
  for(let i=0;i<8;i++){const a=i*Math.PI/4+.2,l=62*(i%2?.6:1);x.beginPath();x.moveTo(64,64);x.lineTo(64+Math.cos(a)*l,64+Math.sin(a)*l);x.stroke()}
  MKC.tex=new THREE.CanvasTexture(c)}
 const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:MKC.tex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,rotation:rd()*6.28}));
 sp.position.copy(P);sp.scale.setScalar(.95);sp.renderOrder=8;scene.add(sp);
 const cn=new THREE.Mesh(new THREE.ConeGeometry(.13,.75,8,1,true),new THREE.MeshBasicMaterial({color:0xffc060,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));
 cn.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),D);cn.position.copy(P).addScaledVector(D,.38);scene.add(cn);
 const t0=performance.now();(function f(){const k=(performance.now()-t0)/110;
  if(k>=1){scene.remove(sp,cn);sp.material.dispose();cn.geometry.dispose();cn.material.dispose();return}
  sp.material.opacity=1-k;sp.scale.setScalar(.95*(1+k*.5));cn.material.opacity=.9*(1-k);cn.scale.set(1+k*.4,1+k*.8,1+k*.4);requestAnimationFrame(f)})();
 burst(P,16,0xffd27a,{sp:3.2,size:.2,life:.22,g:0,up:0,y:0,r:.05,h:.05});
 burst(P,8,0x8a8a8a,{sp:.7,size:.6,life:1.1,g:-.4,vy:.5,up:.3,y:0,r:.12,h:.1})}
/* گلوله با رد درخشان (کشیده‌شونده) + رد ذره‌ای ماندگار */
function makBullet(A,B,cb){
 const L=A.distanceTo(B),dur=Math.max(90,Math.min(280,L*34)),D=B.clone().sub(A).normalize(),up=new THREE.Vector3(0,1,0);
 const hd=new THREE.Mesh(new THREE.SphereGeometry(.06,8,6),new THREE.MeshBasicMaterial({color:0xfff6d0,toneMapped:false})),
  gl=new THREE.Sprite(new THREE.SpriteMaterial({map:GL,color:0xffa840,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false})),
  st=new THREE.Mesh(new THREE.CylinderGeometry(.04,.004,1,6,1,true),new THREE.MeshBasicMaterial({color:0xffd890,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));
 gl.scale.setScalar(.8);hd.add(gl);scene.add(hd,st);const t0=performance.now();
 (function f(){const k=Math.min(1,(performance.now()-t0)/dur),h=A.clone().lerp(B,k),tl=A.clone().lerp(B,Math.max(0,k-.4)),len=h.distanceTo(tl);
  hd.position.copy(h);st.position.copy(h).add(tl).multiplyScalar(.5);st.scale.set(1,Math.max(.001,len),1);st.quaternion.setFromUnitVectors(up,D);
  burst(h,2,0xffa040,{sp:.15,size:.2,life:.5,g:0,vy:0,up:0,y:0,r:.04,h:.04});
  if(k<1)requestAnimationFrame(f);else{scene.remove(hd,st);hd.geometry.dispose();hd.material.dispose();gl.material.dispose();st.geometry.dispose();st.material.dispose();tracer(A,B,0xffd9a0,.5,14);cb&&cb()}})()}
function makReload(u){try{const f=makFig(unitG.get(u));if(f)f.userData.mak.reload()}catch(e){}}
function makFX(a,t,d){
 const ga=unitG.get(a),gt=unitG.get(t),f=makFig(ga);if(!ga||!f)return;
 if(CX&&CX.a===a)CX.mkDone=1;
 const m=f.userData.mak,self=a===t;m.fire(self);SFX.revolver(1,.27);
 setTimeout(()=>{try{
  const A=new THREE.Vector3();m.muzzle.updateWorldMatrix(true,false);m.muzzle.getWorldPosition(A);
  const B=self?ga.position.clone().add(new THREE.Vector3(0,1.85,0)):gt?gt.position.clone().add(new THREE.Vector3((rd()-.5)*.25,.95,(rd()-.5)*.25)):A.clone().add(new THREE.Vector3(0,0,-6)),
   D=B.clone().sub(A).normalize();
  makFlash(A,D);shk=Math.max(shk,.28);
  makBullet(A,B,()=>{const g0=B.clone();
   if(d>0){burst(g0,16,0xffb050,{sp:3.5,size:.22,life:.45,g:5,y:0,r:.1,h:.1});burst(g0,8,0xff3040,{sp:2.2,size:.18,life:.5,g:6,y:0,r:.1,h:.1});if(gok('mkh',60))SFX.hit(d>700)}
   else{burst(g0,12,0xffffff,{sp:4,size:.14,life:.3,g:3,y:0,r:.05,h:.05});os('triangle',3200,1800,.12,.2);nz(.03,'bandpass',4200,3000,3,.3)}
   burst(g0,5,0xffffff,{sp:1.5,size:.3,life:.2,g:0,y:0});ring(new THREE.Vector3(g0.x,0,g0.z),0xffc070,1,.3,.15);shk=Math.max(shk,.2)})
 }catch(e){}},280)}


/* ===== کماندو آلیس: صدای تک‌تیرانداز، انیمیشن شلیک، ردّ گلوله ===== */
SFX.sniper=(g,ab)=>{g=g||1;const b=ab?.8:.34,bs=b+.16,bd=ab?.75:.6;
 if(ab){os('sine',900,2400,.5,.05*g,0);nz(.02,'bandpass',3000,2400,5,.3*g,.3);nz(.02,'bandpass',2200,1800,5,.3*g,.62)}
 else nz(.02,'bandpass',2200,1800,5,.3*g,.12);
 // شلیک: ترق تیز + کوبش بم + پژواک دور
 nz(.03,'highpass',2500,9000,.7,2*g,b);nz(.35,'lowpass',7000,350,.8,1.8*g,b);
 os('sine',130,28,.45,1.6*g,b);os('sawtooth',500,70,.1,.4*g,b);os('sine',2300,1800,.3,.05*g,b+.02);
 nz(.9,'bandpass',1200,200,1,.35*g,b+.06);nz(1.4,'lowpass',800,100,.7,.28*g,b+.2);
 // گلنگدن: بالا، عقب، جلو، پایین + افتادن پوکه
 [[.1,1500],[.3,1100],[.6,1300],[.85,1700]].forEach(c=>{nz(.025,'bandpass',c[1],c[1]*.7,5,.5*g,bs+bd*c[0]);os('triangle',c[1]*.9,c[1]*.5,.04,.12*g,bs+bd*c[0])});
 os('sine',4200,3500,.12,.1*g,bs+bd*.55)};
function aliFig(g){const i=g&&g.children[0];return i&&i.children.find(o=>o.userData&&o.userData.ali)}
function aliFX(a,t,d,ab){
 const ga=unitG.get(a),gt=unitG.get(t),f=aliFig(ga);if(!ga||!f)return;
 if(CX&&CX.a===a)CX.alDone=1;ab=!!ab;
 if(gt&&a!==t){const dx=gt.position.x-ga.position.x,dz=gt.position.z-ga.position.z;if(dx||dz){ga.userData.fy=Math.atan2(dx,dz);ga.userData.ft=ab?2.6:1.8}}
 const m=f.userData.ali;m.fire(ab);SFX.sniper(1,ab);
 setTimeout(()=>{try{
  const A=new THREE.Vector3();m.muzzle.updateWorldMatrix(true,false);m.muzzle.getWorldPosition(A);
  const B=gt?gt.position.clone().add(new THREE.Vector3((rd()-.5)*.2,.95,(rd()-.5)*.2)):A.clone().add(new THREE.Vector3(0,0,-6)),D=B.clone().sub(A).normalize();
  makFlash(A,D);
  if(ab){makFlash(A,D);ring(new THREE.Vector3(A.x,.05,A.z),0xffe0a0,1.6,.4,.15);burst(A,10,0x8a8a8a,{sp:1,size:.7,life:1.3,g:-.4,vy:.6,up:.3,y:0,r:.15,h:.1})}
  shk=Math.max(shk,ab?.6:.34);
  makBullet(A,B,()=>{const g0=B.clone();
   if(d>0){burst(g0,18,0xffc070,{sp:3.8,size:.22,life:.45,g:5,y:0,r:.1,h:.1});burst(g0,8,0xfff0c0,{sp:2.4,size:.18,life:.5,g:6,y:0,r:.1,h:.1});if(gok('alh',60))SFX.hit(d>700||ab)}
   else{burst(g0,12,0xffffff,{sp:4,size:.14,life:.3,g:3,y:0,r:.05,h:.05});os('triangle',3200,1800,.12,.2);nz(.03,'bandpass',4200,3000,3,.3)}
   burst(g0,5,0xffffff,{sp:1.5,size:.3,life:.2,g:0,y:0});ring(new THREE.Vector3(g0.x,0,g0.z),0xffd890,ab?2:1.1,.35,.15);shk=Math.max(shk,ab?.55:.22)})
 }catch(e){}},m.delay(ab))}

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

