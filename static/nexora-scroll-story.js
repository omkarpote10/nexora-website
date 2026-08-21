
(function(){
  if(!window.THREE) return;
  const page=document.body.dataset.nxPage;
  if(page!=="home") return;

  const hero=document.querySelector(".hero");
  const services=document.querySelector("#services") || document.querySelector(".service-strip") || document.querySelector(".cards");
  const work=document.querySelector("#work") || document.querySelector(".projects");
  const process=document.querySelector("#process") || document.querySelector(".process");
  const contact=document.querySelector("#contact") || document.querySelector(".cta");
  const host=document.querySelector(".hero-visual");
  if(!hero || !host) return;

  const shell=host.querySelector(".nx-webgl-shell");
  const canvas=host.querySelector(".nx-webgl-canvas");
  if(!shell || !canvas) return;

  const sceneData=window.__NEXORA_THREE__;
  if(!sceneData || !sceneData.scene || !sceneData.camera || !sceneData.rootGroup) return;

  const {scene,camera,rootGroup,rig,renderer,particles}=sceneData;

  // Floating project panels used during the Work chapter.
  const projectGroup=new THREE.Group();
  projectGroup.visible=false;
  scene.add(projectGroup);

  const panelMat=new THREE.MeshPhysicalMaterial({
    color:0x21112f,metalness:.5,roughness:.38,clearcoat:.8,
    emissive:0x1c082d,emissiveIntensity:.4
  });
  const screenMats=[
    new THREE.MeshBasicMaterial({color:0x171329}),
    new THREE.MeshBasicMaterial({color:0x0d1726}),
    new THREE.MeshBasicMaterial({color:0x24112e})
  ];
  const panels=[];
  const panelDefs=[
    {p:[-2.8,.6,-1.3],r:[.03,-.35,.04],s:[2.5,1.55,.12]},
    {p:[0,1.1,-2.0],r:[-.02,.06,-.04],s:[2.8,1.7,.12]},
    {p:[2.8,.2,-1.0],r:[.05,.35,.02],s:[2.4,1.45,.12]},
  ];
  panelDefs.forEach((d,i)=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(...d.s),panelMat);
    m.position.set(...d.p);m.rotation.set(...d.r);
    const screen=new THREE.Mesh(new THREE.PlaneGeometry(d.s[0]*.85,d.s[1]*.72),screenMats[i]);
    screen.position.z=d.s[2]/2+.008;m.add(screen);
    const glow=new THREE.Mesh(
      new THREE.PlaneGeometry(d.s[0]*.7,d.s[1]*.05),
      new THREE.MeshBasicMaterial({color:0x9d4cff,transparent:true,opacity:.35})
    );
    glow.position.set(0,-d.s[1]*.28,d.s[2]/2+.012);m.add(glow);
    projectGroup.add(m);panels.push(m);
  });

  const serviceGroup=new THREE.Group();
  serviceGroup.visible=false;
  scene.add(serviceGroup);

  const serviceGeo=[
    new THREE.OctahedronGeometry(.46,1),
    new THREE.IcosahedronGeometry(.48,1),
    new THREE.TetrahedronGeometry(.52,1),
    new THREE.BoxGeometry(.75,.75,.75,2,2,2),
    new THREE.TorusKnotGeometry(.38,.11,80,10)
  ];
  const serviceObjects=[];
  for(let i=0;i<10;i++){
    const g=serviceGeo[i%serviceGeo.length].clone();
    const m=new THREE.Mesh(g,i%2===0?rig.left.material:rig.leftInner.material);
    const a=i/10*Math.PI*2;
    m.position.set(Math.cos(a)*2.8,Math.sin(a*1.2)*1.8,-.8+Math.sin(a)*1.1);
    m.scale.setScalar(.7+(i%3)*.12);
    serviceGroup.add(m);serviceObjects.push(m);
  }

  const trailCount=180;
  const trailGeo=new THREE.BufferGeometry();
  const trailPos=new Float32Array(trailCount*3);
  for(let i=0;i<trailCount;i++){
    trailPos[i*3]=(Math.random()-.5)*.6;
    trailPos[i*3+1]=(Math.random()-.5)*.6;
    trailPos[i*3+2]=(Math.random()-.5)*.6;
  }
  trailGeo.setAttribute("position",new THREE.BufferAttribute(trailPos,3));
  const trailMat=new THREE.PointsMaterial({
    color:0xc26fff,size:.035,transparent:true,opacity:0,depthWrite:false,
    blending:THREE.AdditiveBlending
  });
  const trail=new THREE.Points(trailGeo,trailMat);
  scene.add(trail);

  const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse=matchMedia("(pointer: coarse)").matches;
  let chapter="hero",progress=0,targetCameraZ=8.5,targetCameraY=0,targetRootY=0;
  let burst=0,prevChapter="hero";

  const ease=x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;

  function sectionProgress(el){
    if(!el) return 0;
    const r=el.getBoundingClientRect();
    const h=Math.max(1,el.offsetHeight);
    return Math.max(0,Math.min(1,(innerHeight-r.top)/(innerHeight+h)));
  }

  function determineChapter(){
    const y=scrollY+innerHeight*.48;
    const ranges=[
      ["hero",hero],
      ["services",services],
      ["work",work],
      ["process",process],
      ["contact",contact]
    ].filter(x=>x[1]);
    let best="hero";
    for(const [name,el] of ranges){
      const top=el.offsetTop;
      if(y>=top) best=name;
    }
    return best;
  }

  function triggerBurst(){
    burst=1;
    trailMat.opacity=.85;
    const arr=trail.geometry.attributes.position.array;
    for(let i=0;i<trailCount;i++){
      const a=Math.random()*Math.PI*2;
      const r=Math.random()*.4;
      arr[i*3]=Math.cos(a)*r;
      arr[i*3+1]=Math.sin(a)*r;
      arr[i*3+2]=(Math.random()-.5)*.4;
    }
    trail.geometry.attributes.position.needsUpdate=true;
  }

  function setChapterState(){
    chapter=determineChapter();
    if(chapter!==prevChapter){
      triggerBurst();
      prevChapter=chapter;
    }

    progress=
      chapter==="hero"?sectionProgress(hero):
      chapter==="services"?sectionProgress(services):
      chapter==="work"?sectionProgress(work):
      chapter==="process"?sectionProgress(process):
      sectionProgress(contact);

    serviceGroup.visible=chapter==="services";
    projectGroup.visible=chapter==="work";

    if(chapter==="hero"){
      targetCameraZ=8.5;targetCameraY=0;targetRootY=-.1;
    }else if(chapter==="services"){
      targetCameraZ=9.2;targetCameraY=.15;targetRootY=.1;
    }else if(chapter==="work"){
      targetCameraZ=9.8;targetCameraY=.05;targetRootY=.16;
    }else if(chapter==="process"){
      targetCameraZ=8.9;targetCameraY=-.05;targetRootY=-.12;
    }else{
      targetCameraZ=8.1;targetCameraY=0;targetRootY=0;
    }
  }
  addEventListener("scroll",setChapterState,{passive:true});
  addEventListener("resize",setChapterState);
  setChapterState();

  let t=0;
  function storyFrame(){
    t+=.016;

    const ep=ease(progress);

    // Hero: split the N outward.
    if(chapter==="hero"){
      const s=Math.sin(ep*Math.PI);
      rig.left.position.x=-1.55-s*.72;
      rig.right.position.x=1.55+s*.72;
      rig.diag.position.z=s*.55;
      rig.leftInner.position.x=-1.53-s*.7;
      rig.rightInner.position.x=1.53+s*.7;
      rootGroup.scale.setScalar(1);
      serviceObjects.forEach(o=>o.scale.setScalar(.001));
      panels.forEach(p=>p.scale.setScalar(.001));
    }

    // Services: N compresses and explodes into service objects.
    if(chapter==="services"){
      const collapse=1-ep*.78;
      rig.g.scale.setScalar(Math.max(.22,collapse));
      rig.g.rotation.y+=.008;
      serviceObjects.forEach((o,i)=>{
        const q=Math.min(1,ep*1.35);
        o.scale.setScalar((.58+(i%3)*.09)*q);
        o.rotation.x=t*(.2+i*.01);o.rotation.y=t*(.24+i*.015);
        o.position.y+=Math.sin(t*.9+i)*.0013;
      });
      projectGroup.visible=false;
    }

    // Work: service objects collapse while floating project panels fly forward.
    if(chapter==="work"){
      serviceObjects.forEach(o=>o.scale.setScalar(Math.max(.001,1-ep)));
      rig.g.scale.setScalar(.18);
      panels.forEach((p,i)=>{
        const q=Math.min(1,ep*1.2);
        p.scale.setScalar(q);
        p.position.z=panelDefs[i].p[2]+(1-q)*-4;
        p.rotation.y=panelDefs[i].r[1]+Math.sin(t*.45+i)*.035;
        p.position.y=panelDefs[i].p[1]+Math.sin(t*.65+i)*.06;
      });
    }

    // Process: project panels recede and N reforms from depth.
    if(chapter==="process"){
      panels.forEach((p,i)=>{
        p.scale.setScalar(Math.max(.001,1-ep));
        p.position.z=panelDefs[i].p[2]-ep*2.5;
      });
      const reform=.18+ep*.82;
      rig.g.scale.setScalar(reform);
      rig.left.position.x=-1.55-(1-ep)*.7;
      rig.right.position.x=1.55+(1-ep)*.7;
      rig.diag.position.z=(1-ep)*.55;
      rig.leftInner.position.x=-1.53-(1-ep)*.68;
      rig.rightInner.position.x=1.53+(1-ep)*.68;
    }

    // Final CTA: N fully reconstructed, rotating slightly toward viewer.
    if(chapter==="contact"){
      rig.g.scale.setScalar(.92+ep*.08);
      rig.left.position.x=-1.55;
      rig.right.position.x=1.55;
      rig.diag.position.z=0;
      rig.leftInner.position.x=-1.53;
      rig.rightInner.position.x=1.53;
      rig.g.rotation.y=-.18+Math.sin(t*.55)*.06;
      rig.g.position.y=Math.sin(t*.7)*.08;
    }

    // Camera storytelling.
    camera.position.z += (targetCameraZ-camera.position.z)*.035;
    camera.position.y += (targetCameraY-camera.position.y)*.035;
    rootGroup.rotation.y += (targetRootY-rootGroup.rotation.y)*.025;

    // burst expands then fades
    if(burst>0){
      burst*=.94;
      trail.scale.setScalar(1+(1-burst)*7);
      trailMat.opacity=burst*.75;
      trail.rotation.y+=.012;
    }

    // original particles become more dramatic around transitions
    if(particles && particles.material){
      particles.material.opacity=.48+burst*.35;
    }

    if(!reduced) requestAnimationFrame(storyFrame);
  }
  storyFrame();

  // Scroll chapter indicator.
  const indicator=document.createElement("div");
  indicator.className="nx-story-indicator";
  indicator.innerHTML=`
    <span data-c="hero">01</span>
    <span data-c="services">02</span>
    <span data-c="work">03</span>
    <span data-c="process">04</span>
    <span data-c="contact">05</span>`;
  document.body.appendChild(indicator);

  function updateIndicator(){
    indicator.querySelectorAll("span").forEach(s=>s.classList.toggle("active",s.dataset.c===chapter));
  }
  addEventListener("scroll",updateIndicator,{passive:true});
  updateIndicator();

  if(coarse){
    indicator.style.display="none";
  }
})();
