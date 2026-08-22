
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
    home: [".cube-stage-lite"],
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
  const renderer = new THREE.WebGLRenderer({canvas, antialias:!coarse, alpha:true, powerPreference:"high-performance"});
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

    // Outer crystal cube.
    const glass = new THREE.MeshPhysicalMaterial({
      color:0x37115f,
      metalness:.58,
      roughness:.12,
      transparent:true,
      opacity:.72,
      clearcoat:1,
      clearcoatRoughness:.06,
      emissive:0x2a004c,
      emissiveIntensity:.68,
      side:THREE.DoubleSide
    });
    const innerMat = new THREE.MeshPhysicalMaterial({
      color:0x110919,
      metalness:.86,
      roughness:.22,
      clearcoat:1,
      emissive:0x170026,
      emissiveIntensity:.45
    });
    const cube = new THREE.Mesh(new THREE.BoxGeometry(3.35,3.35,3.35,3,3,3),glass);
    const inner = new THREE.Mesh(new THREE.BoxGeometry(2.72,2.72,2.72,2,2,2),innerMat);
    g.add(cube,inner);

    // Neon bevel-like edge cage.
    const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(3.42,3.42,3.42));
    const edgeMat = new THREE.LineBasicMaterial({color:0xc777ff,transparent:true,opacity:.88});
    const edges = new THREE.LineSegments(edgeGeo,edgeMat);
    g.add(edges);

    // Internal diagonal crystal panels for faceted texture.
    const facets = new THREE.Group();
    const facetMat = new THREE.MeshBasicMaterial({
      color:0x9c45ff,transparent:true,opacity:.10,side:THREE.DoubleSide,
      blending:THREE.AdditiveBlending,depthWrite:false
    });
    for(let i=0;i<6;i++){
      const p=new THREE.Mesh(new THREE.PlaneGeometry(3.5,3.5),facetMat.clone());
      p.rotation.set((i%3)*Math.PI/3,(i%2)*Math.PI/4,(i*.37));
      facets.add(p);
    }
    g.add(facets);

    // NEXORA text texture.
    function textTexture(text){
      const cn=document.createElement("canvas");
      cn.width=1024;cn.height=256;
      const cx=cn.getContext("2d");
      cx.clearRect(0,0,cn.width,cn.height);
      const grd=cx.createLinearGradient(0,0,cn.width,0);
      grd.addColorStop(0,"#f4e7ff");grd.addColorStop(.5,"#c67cff");grd.addColorStop(1,"#8b39ff");
      cx.fillStyle=grd;
      cx.font="800 128px Arial, sans-serif";
      cx.textAlign="center";cx.textBaseline="middle";
      cx.shadowColor="#a948ff";cx.shadowBlur=30;
      cx.fillText(text,512,130);
      const tex=new THREE.CanvasTexture(cn);
      tex.colorSpace=THREE.SRGBColorSpace;
      tex.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
      return tex;
    }
    const brandTex=textTexture("NEXORA");
    const brandMat=new THREE.MeshBasicMaterial({map:brandTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
    const brandFront=new THREE.Mesh(new THREE.PlaneGeometry(2.65,.72),brandMat);
    brandFront.position.z=1.725;
    g.add(brandFront);
    const brandRight=new THREE.Mesh(new THREE.PlaneGeometry(2.65,.72),brandMat.clone());
    brandRight.position.x=1.725;brandRight.rotation.y=Math.PI/2;
    g.add(brandRight);

    // Glowing pedestal.
    const baseMat=new THREE.MeshPhysicalMaterial({
      color:0x100817,metalness:.72,roughness:.28,clearcoat:.8,
      emissive:0x1c0030,emissiveIntensity:.48
    });
    const base1=new THREE.Mesh(new THREE.BoxGeometry(4.8,.24,4.8),baseMat);
    base1.position.y=-2.55;
    const base2=new THREE.Mesh(new THREE.BoxGeometry(4.15,.16,4.15),baseMat.clone());
    base2.position.y=-2.35;
    g.add(base1,base2);

    const pad=new THREE.Mesh(
      new THREE.BoxGeometry(1.15,.035,1.15),
      new THREE.MeshBasicMaterial({color:0xd18aff,transparent:true,opacity:.86,blending:THREE.AdditiveBlending})
    );
    pad.position.y=-2.24;g.add(pad);

    const ring1=addOrbit(3.05,.012,[Math.PI/2.22,.08,-.08],.28);
    const ring2=addOrbit(2.35,.009,[1.02,.55,.4],.18);

    // Split pieces - hidden while assembled.
    const pieces=new THREE.Group();
    const pieceData=[];
    const miniGeo=new THREE.BoxGeometry(.82,.82,.82,1,1,1);
    for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){
      const pm=new THREE.MeshPhysicalMaterial({
        color:(x+y+z)%2===0?0x7d28d8:0x3b155b,
        metalness:.68,roughness:.18,clearcoat:1,
        transparent:true,opacity:.9,emissive:0x25003f,emissiveIntensity:.5
      });
      const m=new THREE.Mesh(miniGeo,pm);
      const home=new THREE.Vector3(x*.94,y*.94,z*.94);
      m.position.copy(home);
      pieces.add(m);
      const dir=home.clone();
      if(dir.lengthSq()<.01) dir.set(.2,.8,.3);
      dir.normalize();
      pieceData.push({mesh:m,home,dir,phase:Math.random()*Math.PI*2});
    }
    pieces.visible=false;
    g.add(pieces);

    // Dedicated split-particle burst.
    const burstCount=150;
    const burstGeo=new THREE.BufferGeometry();
    const burstPos=new Float32Array(burstCount*3);
    const burstDir=[];
    for(let i=0;i<burstCount;i++){
      burstPos[i*3]=0;burstPos[i*3+1]=0;burstPos[i*3+2]=0;
      const v=new THREE.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize();
      burstDir.push(v);
    }
    burstGeo.setAttribute("position",new THREE.BufferAttribute(burstPos,3));
    const burstMat=new THREE.PointsMaterial({
      color:0xc46eff,size:.045,transparent:true,opacity:0,depthWrite:false,
      blending:THREE.AdditiveBlending
    });
    const burstPts=new THREE.Points(burstGeo,burstMat);
    g.add(burstPts);

    g.rotation.set(-.18,.58,.08);
    g.position.y=.25;

    return {
      type:"cube",g,cube,inner,edges,facets,brandFront,brandRight,
      base1,base2,pad,ring1,ring2,pieces,pieceData,burstPts,burstDir,
      split:0,splitTarget:0,burst:0,lastAuto:0
    };
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
  host.addEventListener("pointerdown",()=>{
    if(rig && rig.type==="cube"){
      rig.splitTarget=1;
      rig.burst=1;
      setTimeout(()=>{ if(rig && rig.type==="cube") rig.splitTarget=0; },900);
    }
  });

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

    if(rig.type==="cube"){
      // Continuous slow rolling / tumbling.
      rig.g.rotation.y += coarse ? .0026 : .0035;
      rig.g.rotation.x = -.28 + Math.sin(t*.43)*.11;
      rig.g.rotation.z = .06 + Math.sin(t*.31)*.045;
      rig.g.position.y = .25 + Math.sin(t*.72)*.10;
      rig.ring1.rotation.z=t*.055;
      rig.ring2.rotation.y=t*.072;
      rig.pad.material.opacity=.70+Math.sin(t*1.4)*.16;

      // Automatic cinematic split every ~10 seconds.
      const cycle=t%10.5;
      let target=0;
      if(cycle>6.2 && cycle<8.0) target=Math.sin((cycle-6.2)/1.8*Math.PI);
      rig.splitTarget=target;
      rig.split += (rig.splitTarget-rig.split)*.075;
      const s=rig.split;

      const assembledOpacity=Math.max(0,1-s*1.65);
      rig.cube.material.opacity=.72*assembledOpacity;
      rig.inner.material.opacity=assembledOpacity;
      rig.edges.material.opacity=.88*assembledOpacity;
      rig.brandFront.material.opacity=assembledOpacity;
      rig.brandRight.material.opacity=assembledOpacity;
      rig.facets.visible=s<.72;

      rig.pieces.visible=s>.025;
      rig.pieceData.forEach((d,i)=>{
        const out=1.15+s*2.0;
        d.mesh.position.copy(d.home).addScaledVector(d.dir,s*out);
        d.mesh.rotation.x=t*(.20+(i%5)*.015)+s*d.phase;
        d.mesh.rotation.y=t*(.17+(i%7)*.012)-s*d.phase*.6;
        d.mesh.scale.setScalar(.96-s*.12);
        d.mesh.material.opacity=Math.min(.94,s*1.5);
      });

      // Particle burst when split opens.
      const opening = s>.16 && rig.burst<.04;
      if(opening) rig.burst=1;
      if(rig.burst>.002){
        const bp=rig.burstPts.geometry.attributes.position.array;
        const elapsed=1-rig.burst;
        for(let i=0;i<rig.burstDir.length;i++){
          const v=rig.burstDir[i];
          const dist=elapsed*(2.2+(i%9)*.12);
          bp[i*3]=v.x*dist;bp[i*3+1]=v.y*dist;bp[i*3+2]=v.z*dist;
        }
        rig.burstPts.geometry.attributes.position.needsUpdate=true;
        rig.burstPts.material.opacity=rig.burst*.75;
        rig.burst*=.94;
      }else{
        rig.burstPts.material.opacity=0;
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
