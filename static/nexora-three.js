
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

    // Clean smoked-glass outer volume.
    const glass = new THREE.MeshPhysicalMaterial({
      color:0x1c082e,
      metalness:.18,
      roughness:.08,
      transparent:true,
      opacity:.34,
      clearcoat:1,
      clearcoatRoughness:.03,
      emissive:0x180026,
      emissiveIntensity:.38,
      transmission:.06,
      side:THREE.DoubleSide,
      depthWrite:false
    });

    const innerMat = new THREE.MeshPhysicalMaterial({
      color:0x0b0610,
      metalness:.62,
      roughness:.18,
      transparent:true,
      opacity:.42,
      clearcoat:1,
      clearcoatRoughness:.08,
      emissive:0x140020,
      emissiveIntensity:.34
    });

    const cube = new THREE.Mesh(new THREE.BoxGeometry(3.25,3.25,3.25,1,1,1),glass);
    const inner = new THREE.Mesh(new THREE.BoxGeometry(2.86,2.86,2.86,1,1,1),innerMat);
    g.add(cube,inner);

    // Smooth neon beams replace jagged EdgesGeometry.
    const edgeCoreMat = new THREE.MeshBasicMaterial({
      color:0xe0a0ff,transparent:true,opacity:.96,blending:THREE.AdditiveBlending
    });
    const edgeGlowMat = new THREE.MeshBasicMaterial({
      color:0xa443ff,transparent:true,opacity:.20,blending:THREE.AdditiveBlending,depthWrite:false
    });
    const cornerMat = new THREE.MeshBasicMaterial({
      color:0xf0c3ff,transparent:true,opacity:.95,blending:THREE.AdditiveBlending
    });

    const edgeGroup = new THREE.Group();
    const glowEdgeGroup = new THREE.Group();
    const cornerGroup = new THREE.Group();

    function beamBetween(a,b,radius,material,segments=10){
      const mid=a.clone().add(b).multiplyScalar(.5);
      const len=a.distanceTo(b);
      const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,len,segments,1,false),material);
      mesh.position.copy(mid);
      const q=new THREE.Quaternion();
      q.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());
      mesh.quaternion.copy(q);
      return mesh;
    }

    const h=1.66;
    const V=[
      new THREE.Vector3(-h,-h,-h),new THREE.Vector3(h,-h,-h),
      new THREE.Vector3(-h,h,-h), new THREE.Vector3(h,h,-h),
      new THREE.Vector3(-h,-h,h), new THREE.Vector3(h,-h,h),
      new THREE.Vector3(-h,h,h),  new THREE.Vector3(h,h,h)
    ];
    const E=[
      [0,1],[2,3],[4,5],[6,7],
      [0,2],[1,3],[4,6],[5,7],
      [0,4],[1,5],[2,6],[3,7]
    ];
    E.forEach(([i,j])=>{
      edgeGroup.add(beamBetween(V[i],V[j],.020,edgeCoreMat,12));
      glowEdgeGroup.add(beamBetween(V[i],V[j],.055,edgeGlowMat,10));
    });
    V.forEach(v=>{
      const s=new THREE.Mesh(new THREE.SphereGeometry(.045,12,10),cornerMat);
      s.position.copy(v);
      cornerGroup.add(s);
    });
    g.add(glowEdgeGroup,edgeGroup,cornerGroup);

    // Refined crystalline interior: fewer planes, softer opacity.
    const facets = new THREE.Group();
    const facetMat = new THREE.MeshBasicMaterial({
      color:0x8f36e8,transparent:true,opacity:.055,side:THREE.DoubleSide,
      blending:THREE.AdditiveBlending,depthWrite:false
    });
    const rotations=[
      [.7,.15,.25],[-.65,.55,-.3],[.25,-.72,.55],
      [1.05,.32,-.6]
    ];
    rotations.forEach((r,i)=>{
      const p=new THREE.Mesh(new THREE.PlaneGeometry(3.15,3.15),facetMat.clone());
      p.rotation.set(...r);
      p.material.opacity=.04+i*.008;
      facets.add(p);
    });
    g.add(facets);

    // Crisp NEXORA face branding.
    function textTexture(text){
      const cn=document.createElement("canvas");
      cn.width=1024;cn.height=256;
      const cx=cn.getContext("2d");
      cx.clearRect(0,0,cn.width,cn.height);
      const grd=cx.createLinearGradient(0,0,cn.width,0);
      grd.addColorStop(0,"#ffffff");
      grd.addColorStop(.55,"#d795ff");
      grd.addColorStop(1,"#9e48ff");
      cx.fillStyle=grd;
      cx.font="800 122px Arial, sans-serif";
      cx.textAlign="center";cx.textBaseline="middle";
      cx.shadowColor="#aa4dff";cx.shadowBlur=20;
      cx.fillText(text,512,130);
      const tex=new THREE.CanvasTexture(cn);
      tex.colorSpace=THREE.SRGBColorSpace;
      tex.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
      return tex;
    }

    const brandTex=textTexture("NEXORA");
    const brandMat=new THREE.MeshBasicMaterial({
      map:brandTex,transparent:true,opacity:.96,depthWrite:false,
      blending:THREE.AdditiveBlending
    });
    const brandFront=new THREE.Mesh(new THREE.PlaneGeometry(2.52,.65),brandMat);
    brandFront.position.z=1.685;
    g.add(brandFront);

    // Subtle right-face logo so rotation still feels branded.
    const brandRight=new THREE.Mesh(new THREE.PlaneGeometry(2.25,.58),brandMat.clone());
    brandRight.position.x=1.685;
    brandRight.rotation.y=Math.PI/2;
    brandRight.material.opacity=.55;
    g.add(brandRight);

    // Premium layered pedestal closer to the reference.
    const baseMat=new THREE.MeshPhysicalMaterial({
      color:0x09060d,metalness:.72,roughness:.26,clearcoat:.9,
      emissive:0x13001f,emissiveIntensity:.36
    });
    const base1=new THREE.Mesh(new THREE.BoxGeometry(5.0,.23,5.0),baseMat);
    base1.position.y=-2.62;
    const base2=new THREE.Mesh(new THREE.BoxGeometry(4.45,.12,4.45),baseMat.clone());
    base2.position.y=-2.40;
    const base3=new THREE.Mesh(new THREE.BoxGeometry(3.65,.08,3.65),baseMat.clone());
    base3.position.y=-2.25;
    g.add(base1,base2,base3);

    const pad=new THREE.Mesh(
      new THREE.BoxGeometry(.92,.028,.92),
      new THREE.MeshBasicMaterial({
        color:0xe2b5ff,transparent:true,opacity:.92,
        blending:THREE.AdditiveBlending
      })
    );
    pad.position.y=-2.17;
    g.add(pad);

    // Ground glow discs.
    const discMat=new THREE.MeshBasicMaterial({
      color:0x9c3dff,transparent:true,opacity:.10,
      blending:THREE.AdditiveBlending,depthWrite:false
    });
    const disc1=new THREE.Mesh(new THREE.CircleGeometry(2.9,72),discMat);
    disc1.rotation.x=-Math.PI/2;disc1.position.y=-2.155;g.add(disc1);
    const disc2=new THREE.Mesh(new THREE.RingGeometry(2.2,2.23,96),new THREE.MeshBasicMaterial({
      color:0xb659ff,transparent:true,opacity:.34,side:THREE.DoubleSide,
      blending:THREE.AdditiveBlending
    }));
    disc2.rotation.x=-Math.PI/2;disc2.position.y=-2.145;g.add(disc2);

    const ring1=addOrbit(3.0,.009,[Math.PI/2.05,.03,-.02],.20);
    const ring2=addOrbit(2.35,.006,[1.18,.38,.25],.10);

    // Split pieces retained, but softened so animation stays premium.
    const pieces=new THREE.Group();
    const pieceData=[];
    const miniGeo=new THREE.BoxGeometry(.78,.78,.78,1,1,1);
    for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){
      const pm=new THREE.MeshPhysicalMaterial({
        color:(x+y+z)%2===0?0x6e24bb:0x35134f,
        metalness:.55,roughness:.20,clearcoat:.8,
        transparent:true,opacity:.84,emissive:0x200034,emissiveIntensity:.38
      });
      const m=new THREE.Mesh(miniGeo,pm);
      const home=new THREE.Vector3(x*.91,y*.91,z*.91);
      m.position.copy(home);
      pieces.add(m);
      const dir=home.clone();
      if(dir.lengthSq()<.01) dir.set(.2,.8,.3);
      dir.normalize();
      pieceData.push({mesh:m,home,dir,phase:Math.random()*Math.PI*2});
    }
    pieces.visible=false;
    g.add(pieces);

    const burstCount=coarse?70:130;
    const burstGeo=new THREE.BufferGeometry();
    const burstPos=new Float32Array(burstCount*3);
    const burstDir=[];
    for(let i=0;i<burstCount;i++){
      burstPos[i*3]=0;burstPos[i*3+1]=0;burstPos[i*3+2]=0;
      burstDir.push(new THREE.Vector3(
        Math.random()-.5,Math.random()-.5,Math.random()-.5
      ).normalize());
    }
    burstGeo.setAttribute("position",new THREE.BufferAttribute(burstPos,3));
    const burstMat=new THREE.PointsMaterial({
      color:0xc66cff,size:coarse?.030:.042,transparent:true,opacity:0,
      depthWrite:false,blending:THREE.AdditiveBlending
    });
    const burstPts=new THREE.Points(burstGeo,burstMat);
    g.add(burstPts);

    // Stable showcase angle: front + top + right face always read as a cube.
    g.rotation.set(-.34,.56,.015);
    g.position.y=.20;
    g.scale.setScalar(coarse?.88:1);

    return {
      type:"cube",g,cube,inner,edgeGroup,glowEdgeGroup,cornerGroup,
      edgeCoreMat,edgeGlowMat,cornerMat,facets,brandFront,brandRight,
      base1,base2,base3,pad,disc1,disc2,ring1,ring2,pieces,pieceData,
      burstPts,burstDir,split:0,splitTarget:0,burst:0,lastAuto:0
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
      rig.g.rotation.y += coarse ? .0021 : .0030;
      rig.g.rotation.x = -.34 + Math.sin(t*.40)*.055;
      rig.g.rotation.z = .015 + Math.sin(t*.30)*.022;
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
      rig.cube.material.opacity=.34*assembledOpacity;
      rig.inner.material.opacity=.42*assembledOpacity;
      rig.edgeCoreMat.opacity=.96*assembledOpacity;
      rig.edgeGlowMat.opacity=.20*assembledOpacity;
      rig.cornerMat.opacity=.95*assembledOpacity;
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
