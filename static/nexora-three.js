
(function(){
  if(window.__NEXORA_DISABLE_WEBGL__) return;
  const page = document.body.dataset.nxPage || "home";
  const isReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = matchMedia("(pointer: coarse)").matches;
  const perf = window.__NEXORA_PERF__ || {tier:"high",particleScale:1,dprCap:1.8,story:"full"};

  const selectors = {
    home: ".hero-visual",
    services: ".heroVisual",
    work: ".heroVisual",
    about: ".heroVisual",
    contact: ".heroVisual"
  };

  const host = document.querySelector(selectors[page] || selectors.home);
  if(!host || !window.THREE) return;

  const fallbackMap = {
    home: [".n3d",".orbit",".rock",".shard"],
    services: [".holo"],
    work: [".stage",".orbit"],
    about: [".constellation"],
    contact: [".portal"]
  };

  const shell = document.createElement("div");
  shell.className = "nx-webgl-shell";
  shell.innerHTML = '<canvas class="nx-webgl-canvas" aria-hidden="true"></canvas><div class="nx-webgl-vignette"></div>';
  host.appendChild(shell);

  const canvas = shell.querySelector("canvas");
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true, powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, perf.dprCap || 1.8));
  renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42,1,0.1,100);
  camera.position.set(0,0,8.5);

  const rootGroup = new THREE.Group();
  scene.add(rootGroup);

  const ambient = new THREE.HemisphereLight(0xcbb4ff,0x160520,1.25);
  scene.add(ambient);

  const key = new THREE.PointLight(0xc274ff,65,18,2);
  key.position.set(4.5,4.2,5);
  scene.add(key);

  const rim = new THREE.PointLight(0x6f2cff,50,15,2);
  rim.position.set(-4,-2,3);
  scene.add(rim);

  const cool = new THREE.PointLight(0x806bff,24,14,2);
  cool.position.set(0,-4,-2);
  scene.add(cool);

  const metal = new THREE.MeshPhysicalMaterial({
    color:0x8b3fff,
    metalness:0.88,
    roughness:0.2,
    clearcoat:1,
    clearcoatRoughness:0.12,
    emissive:0x250046,
    emissiveIntensity:0.55
  });
  const darkMetal = new THREE.MeshPhysicalMaterial({
    color:0x28113c,
    metalness:0.82,
    roughness:0.28,
    clearcoat:0.8,
    emissive:0x170024,
    emissiveIntensity:0.3
  });
  const glowMat = new THREE.MeshBasicMaterial({color:0xb764ff,transparent:true,opacity:.72});
  const lineMat = new THREE.MeshBasicMaterial({color:0xa653ff,transparent:true,opacity:.34,wireframe:true});

  function addParticles(count=220,spread=10){
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count*3);
    for(let i=0;i<count;i++){
      pos[i*3]=(Math.random()-.5)*spread;
      pos[i*3+1]=(Math.random()-.5)*spread*.72;
      pos[i*3+2]=(Math.random()-.5)*spread;
    }
    geo.setAttribute("position",new THREE.BufferAttribute(pos,3));
    const mat = new THREE.PointsMaterial({
      color:0xb96cff,size:coarse?.025:.035,transparent:true,opacity:.72,
      sizeAttenuation:true,depthWrite:false,blending:THREE.AdditiveBlending
    });
    const pts = new THREE.Points(geo,mat);
    scene.add(pts);
    return pts;
  }
  const particles = addParticles(Math.max(10, Math.floor((coarse?120:260) * (perf.particleScale ?? 1))),12);

  function addOrbit(radius=2.5,tube=.013,rot=[Math.PI/2,0,0],opacity=.36){
    const geo = new THREE.TorusGeometry(radius,tube,8,180);
    const mat = new THREE.MeshBasicMaterial({color:0xa951ff,transparent:true,opacity});
    const tor = new THREE.Mesh(geo,mat);
    tor.rotation.set(...rot);
    rootGroup.add(tor);
    return tor;
  }

  function makeHome(){
    const g = new THREE.Group();
    rootGroup.add(g);

    const left = new THREE.Mesh(new THREE.BoxGeometry(.72,4.6,.72,2,8,2),metal);
    left.position.x=-1.55;
    const right = new THREE.Mesh(new THREE.BoxGeometry(.72,4.6,.72,2,8,2),metal);
    right.position.x=1.55;

    const diag = new THREE.Mesh(new THREE.BoxGeometry(.76,5.45,.72,2,10,2),metal);
    diag.rotation.z=-Math.atan2(3.1,4.1);
    diag.position.set(0,0,0);

    const bevelGeo = new THREE.BoxGeometry(.58,4.2,.32,2,8,1);
    const leftInner = new THREE.Mesh(bevelGeo,darkMetal); leftInner.position.set(-1.53,0,.48);
    const rightInner = new THREE.Mesh(bevelGeo,darkMetal); rightInner.position.set(1.53,0,.48);

    g.add(left,right,diag,leftInner,rightInner);

    const floor = new THREE.Mesh(
      new THREE.CylinderGeometry(2.8,3.2,.58,9,2),
      new THREE.MeshPhysicalMaterial({color:0x120a18,metalness:.55,roughness:.65,emissive:0x170020,emissiveIntensity:.25})
    );
    floor.position.y=-2.75;
    floor.rotation.y=.25;
    g.add(floor);

    const crackGeo = new THREE.TorusGeometry(2.1,.018,6,100,Math.PI*1.2);
    const crack = new THREE.Mesh(crackGeo,glowMat);
    crack.rotation.x=Math.PI/2;
    crack.rotation.z=.8;
    crack.position.y=-2.38;
    g.add(crack);

    const o1=addOrbit(3.15,.016,[Math.PI/2.35,.1,-.18],.4);
    const o2=addOrbit(2.52,.011,[1.05,.45,.6],.22);

    const shardGeo = new THREE.TetrahedronGeometry(.22,0);
    const shards=[];
    const spots=[[-3.1,1.8,.4],[3.0,1.3,-.4],[2.7,-1.5,.3],[-2.7,-1.7,-.3],[.4,2.8,-.2]];
    spots.forEach((p,i)=>{
      const s=new THREE.Mesh(shardGeo,i%2?metal:darkMetal);
      s.position.set(...p);
      s.scale.setScalar(i===4?.7:1);
      rootGroup.add(s);shards.push(s);
    });

    g.rotation.y=-.18;
    return {type:"home",g,left,right,diag,leftInner,rightInner,o1,o2,shards};
  }

  function makeServices(){
    const g=new THREE.Group();rootGroup.add(g);
    const core=new THREE.Mesh(new THREE.OctahedronGeometry(1.25,2),metal);g.add(core);
    const inner=new THREE.Mesh(new THREE.IcosahedronGeometry(.68,1),darkMetal);g.add(inner);
    const o1=addOrbit(2.5,.018,[1.3,.15,.2],.42);
    const o2=addOrbit(1.92,.013,[.5,1.0,.8],.28);
    const o3=addOrbit(3.05,.010,[1.1,-.8,.25],.18);
    const nodes=[];
    for(let i=0;i<8;i++){
      const a=i/8*Math.PI*2;
      const n=new THREE.Mesh(new THREE.SphereGeometry(.07,12,12),glowMat);
      n.position.set(Math.cos(a)*2.6,Math.sin(a)*1.4,Math.sin(a*1.7)*.9);
      rootGroup.add(n);nodes.push(n);
    }
    return {type:"services",g,core,inner,o1,o2,o3,nodes};
  }

  function makeWork(){
    const g=new THREE.Group();rootGroup.add(g);
    const panels=[];
    const dims=[[2.9,1.8], [2.3,1.45], [2.2,1.35]];
    const poses=[[-1.0,.15,0,-.18],[1.4,1.15,-.8,.15],[1.55,-1.2,-.3,.11]];
    dims.forEach((d,i)=>{
      const geo=new THREE.BoxGeometry(d[0],d[1],.12,6,4,1);
      const mat=i===0?metal:darkMetal;
      const m=new THREE.Mesh(geo,mat);
      m.position.set(poses[i][0],poses[i][1],poses[i][2]);
      m.rotation.y=poses[i][3];
      g.add(m);
      const screen=new THREE.Mesh(new THREE.PlaneGeometry(d[0]*.84,d[1]*.72),new THREE.MeshBasicMaterial({color:i===0?0x161329:0x100b18,transparent:true,opacity:.95}));
      screen.position.z=.067; m.add(screen);
      panels.push(m);
    });
    const o1=addOrbit(3.5,.012,[1.2,.2,-.2],.22);
    return {type:"work",g,panels,o1};
  }

  function makeAbout(){
    const g=new THREE.Group();rootGroup.add(g);
    const pillar=new THREE.Mesh(new THREE.CylinderGeometry(.72,.72,4.0,6,1,false),metal);
    pillar.rotation.y=.45;g.add(pillar);
    const cap1=new THREE.Mesh(new THREE.OctahedronGeometry(.9,0),darkMetal);cap1.position.y=2.25;g.add(cap1);
    const cap2=new THREE.Mesh(new THREE.OctahedronGeometry(.9,0),darkMetal);cap2.position.y=-2.25;g.add(cap2);
    const o1=addOrbit(2.5,.013,[1.1,.2,.3],.28);
    const o2=addOrbit(3.0,.010,[.5,1.0,.4],.18);
    return {type:"about",g,pillar,cap1,cap2,o1,o2};
  }

  function makeContact(){
    const g=new THREE.Group();rootGroup.add(g);
    const core=new THREE.Mesh(new THREE.BoxGeometry(1.45,1.45,1.45,4,4,4),metal);
    core.rotation.set(.55,.6,.25);g.add(core);
    const shell1=new THREE.Mesh(new THREE.TorusGeometry(2.2,.022,8,150),new THREE.MeshBasicMaterial({color:0xb45aff,transparent:true,opacity:.34}));
    shell1.rotation.x=1.18;g.add(shell1);
    const shell2=new THREE.Mesh(new THREE.TorusGeometry(2.7,.014,8,150),new THREE.MeshBasicMaterial({color:0x7840ff,transparent:true,opacity:.2}));
    shell2.rotation.set(.35,.9,.4);g.add(shell2);
    const shell3=new THREE.Mesh(new THREE.IcosahedronGeometry(3.15,1),lineMat);g.add(shell3);
    return {type:"contact",g,core,shell1,shell2,shell3};
  }

  let rig;
  try{
    rig = page==="services"?makeServices():
          page==="work"?makeWork():
          page==="about"?makeAbout():
          page==="contact"?makeContact():makeHome();
  }catch(e){
    shell.remove();
    return;
  }

  host.classList.add("nx-three-ready");

  window.__NEXORA_THREE__ = {
    scene, camera, rootGroup, rig, renderer, particles, host
  };

  // Hide CSS fallback only when scene is actually constructed.
  (fallbackMap[page]||[]).forEach(sel=>{
    host.querySelectorAll(sel).forEach(el=>el.classList.add("nx-three-fallback-hidden"));
  });

  let pointerX=0,pointerY=0,targetX=0,targetY=0;
  host.addEventListener("pointermove",e=>{
    if(coarse) return;
    const r=host.getBoundingClientRect();
    targetX=((e.clientX-r.left)/r.width-.5);
    targetY=((e.clientY-r.top)/r.height-.5);
  });
  host.addEventListener("pointerleave",()=>{targetX=targetY=0});

  let scrollProgress=0;
  function updateScroll(){
    const h=document.querySelector(".hero");
    if(!h) return;
    const r=h.getBoundingClientRect();
    const total=Math.max(1,h.offsetHeight);
    scrollProgress=Math.min(1,Math.max(0,-r.top/total));
  }
  addEventListener("scroll",updateScroll,{passive:true});
  updateScroll();

  function resize(){
    const r=host.getBoundingClientRect();
    const w=Math.max(1,r.width),h=Math.max(1,r.height);
    renderer.setSize(w,h,false);
    camera.aspect=w/h;
    camera.updateProjectionMatrix();
  }
  resize();
  const ro=new ResizeObserver(resize);ro.observe(host);

  const clock=new THREE.Clock();

  function animate(){
    const t=clock.getElapsedTime();
    pointerX += (targetX-pointerX)*.055;
    pointerY += (targetY-pointerY)*.055;

    camera.position.x = pointerX*.52;
    camera.position.y = -pointerY*.36;
    camera.lookAt(0,0,0);

    particles.rotation.y=t*.012;
    particles.rotation.x=Math.sin(t*.17)*.025;

    rootGroup.rotation.y += ((pointerX*.18)-rootGroup.rotation.y)*.045;
    rootGroup.rotation.x += ((-pointerY*.10)-rootGroup.rotation.x)*.045;

    if(rig.type==="home"){
      rig.g.position.y=Math.sin(t*.9)*.08;
      rig.o1.rotation.z=t*.08;
      rig.o2.rotation.y=t*.11;
      rig.shards.forEach((s,i)=>{
        s.rotation.x=t*(.28+i*.035);
        s.rotation.y=t*(.21+i*.04);
        s.position.y += Math.sin(t*.9+i)*.0015;
      });

      // V11 scroll-story controller owns the major N split/reassembly choreography.
      if(!window.__NEXORA_SCROLL_STORY_ACTIVE__){
        const split=Math.sin(Math.min(1,scrollProgress)*Math.PI);
        rig.left.position.x=-1.55-split*.75;
        rig.right.position.x=1.55+split*.75;
        rig.diag.position.z=split*.65;
        rig.leftInner.position.x=-1.53-split*.72;
        rig.rightInner.position.x=1.53+split*.72;
        rig.g.rotation.z=split*.06;
      }
    }
    else if(rig.type==="services"){
      rig.core.rotation.x=t*.22;rig.core.rotation.y=t*.31;
      rig.inner.rotation.y=-t*.42;rig.inner.rotation.z=t*.18;
      rig.o1.rotation.z=t*.09;rig.o2.rotation.x=t*.07;rig.o3.rotation.y=t*.05;
      rig.nodes.forEach((n,i)=>n.scale.setScalar(1+Math.sin(t*1.7+i)*.28));
    }
    else if(rig.type==="work"){
      rig.g.position.y=Math.sin(t*.7)*.06;
      rig.panels.forEach((p,i)=>{
        p.position.y += Math.sin(t*.85+i*1.7)*.0014;
        p.rotation.x=Math.sin(t*.4+i)*.025;
      });
      rig.o1.rotation.z=t*.055;
    }
    else if(rig.type==="about"){
      rig.pillar.rotation.y=t*.18;
      rig.cap1.rotation.y=-t*.24;rig.cap2.rotation.y=t*.2;
      rig.o1.rotation.z=t*.06;rig.o2.rotation.y=t*.05;
    }
    else if(rig.type==="contact"){
      rig.core.rotation.x=t*.28;rig.core.rotation.y=t*.34;
      rig.shell1.rotation.z=t*.08;rig.shell2.rotation.y=t*.07;rig.shell3.rotation.y=-t*.035;
    }

    renderer.render(scene,camera);
    if(!isReduced) requestAnimationFrame(animate);
  }
  animate();

  if(isReduced){
    renderer.render(scene,camera);
  }
})();
