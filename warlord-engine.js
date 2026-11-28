/* WarLord Render Engine Adapter v1
   لایهٔ مستقل موتور گرافیکی. تمام دارایی‌های اسکین اصلی حفظ شده‌اند.
   نسخهٔ اول: تشخیص نصب، آمار زندهٔ اختیاری و ثبت نسخهٔ موتور.
*/
(function(){
 'use strict';
 function install(){
  if(typeof renderer==='undefined'||!renderer||typeof scene==='undefined'||!scene||!window.GX||!GX.A)return false;
  if(window.__WARLORD_ENGINE_V1)return true;
  window.__WARLORD_ENGINE_V1={version:'1.0.0',skinVisibilityCulling:true,originalSkinsPreserved:true};
  if(/[?&]engineStats(?:=1)?(?:&|$)/.test(location.search)){
   const el=document.createElement('div');el.id='warlord-engine-stats';
   el.style.cssText='position:fixed;z-index:250;left:6px;top:6px;padding:5px 8px;border-radius:7px;background:rgba(0,0,0,.78);color:#9cff9c;font:11px monospace;direction:ltr;pointer-events:none;white-space:pre';
   document.body.appendChild(el);let frames=0,last=performance.now(),worst=0,prev=last;
   (function sample(){const n=performance.now(),d=n-prev;prev=n;worst=Math.max(worst,d);frames++;
    if(n-last>=1000){const info=renderer.info&&renderer.info.render;el.textContent='WarLord Engine v1\nFPS '+Math.round(frames*1000/(n-last))+' | worst '+Math.round(worst)+'ms'+(info?'\nDraw calls '+info.calls+' | tris '+Math.round(info.triangles/1000)+'k':'');frames=0;worst=0;last=n}
    requestAnimationFrame(sample)})();
  }
  console.info('[WarLord Engine] v1 active');return true;
 }
 if(!install()){let n=0;const timer=setInterval(()=>{if(install()||++n>80)clearInterval(timer)},100)}
})();
