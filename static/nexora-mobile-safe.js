(function(){
  const coarse = matchMedia("(pointer: coarse)").matches;
  const mobileWidth = innerWidth <= 900;
  const mem = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const mobileSafe = mobileWidth || coarse || mem <= 4 || cores <= 4;

  window.__NEXORA_MOBILE_SAFE__ = mobileSafe;

  if(mobileSafe){
    document.documentElement.classList.add("nx-mobile-safe");

    // V16: keep the hero's REAL Three.js cube enabled on phones.
    // Reduce GPU load instead of replacing it with the old CSS/2D-looking fallback.
    window.__NEXORA_DISABLE_WEBGL__ = false;
    window.__NEXORA_PERF__ = {
      tier: "mobile-3d",
      particleScale: 0.22,
      dprCap: 1.0,
      story: "lite"
    };

    requestAnimationFrame(()=>{
      document.querySelectorAll("#fx,.nx-story-indicator,#particleCanvas").forEach(el=>{
        if(el) el.style.display="none";
      });
    });
  }
})();
