
(function(){
  const nav = navigator;
  const mem = nav.deviceMemory || 4;
  const cores = nav.hardwareConcurrency || 4;
  const coarse = matchMedia("(pointer: coarse)").matches;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = innerWidth <= 820;
  const verySmall = innerWidth <= 520;

  let tier = "high";
  if(reduced) tier = "reduced";
  else if(verySmall || (coarse && (mem <= 3 || cores <= 4))) tier = "low";
  else if(small || coarse || mem <= 4 || cores <= 6) tier = "medium";

  document.documentElement.dataset.nxPerf = tier;
  if(tier === "low" || tier === "reduced"){
    document.documentElement.classList.add("nx-lite");
  }

  document.addEventListener("visibilitychange", ()=>{
    document.documentElement.style.setProperty("--nx-run", document.hidden ? "paused" : "running");
  });

  const heavy = document.querySelectorAll(".hero-visual,.heroVisual,.section,.project,.service,.card");
  if("IntersectionObserver" in window){
    const io = new IntersectionObserver(entries=>{
      entries.forEach(e=>e.target.classList.toggle("nx-offscreen", !e.isIntersecting));
    }, {rootMargin:"180px 0px 180px 0px", threshold:0.01});
    heavy.forEach(el=>io.observe(el));
  }

  window.__NEXORA_PERF__ = {
    tier,
    particleScale: tier==="high" ? 1 : tier==="medium" ? .5 : tier==="low" ? .18 : 0,
    dprCap: tier==="high" ? 1.8 : tier==="medium" ? 1.2 : 1,
    story: tier==="high" ? "full" : tier==="medium" ? "lite" : "minimal",
    blur: tier==="high"
  };
})();
