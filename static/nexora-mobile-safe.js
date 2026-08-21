
(function(){
  const coarse = matchMedia("(pointer: coarse)").matches;
  const mobileWidth = innerWidth <= 900;
  const mem = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;

  // Strong mobile-safe rule: no WebGL on normal phones.
  const mobileSafe = mobileWidth || coarse || mem <= 4 || cores <= 4;

  window.__NEXORA_MOBILE_SAFE__ = mobileSafe;

  if(mobileSafe){
    document.documentElement.classList.add("nx-mobile-safe");

    // Prevent WebGL init by hiding / skipping scripts that rely on it.
    window.__NEXORA_DISABLE_WEBGL__ = true;

    // Reduce canvas particle load by hiding full-screen FX.
    requestAnimationFrame(()=>{
      document.querySelectorAll("#fx,.nx-webgl-shell,.nx-story-indicator").forEach(el=>{
        if(el) el.style.display="none";
      });
    });
  }
})();
