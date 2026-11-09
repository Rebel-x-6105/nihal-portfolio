import { processorState } from "./processor-state.js";
import { particleProcessor } from "./processor-particles.js";
import * as THREE from '../vendor/three.module.min.js';
const clamp=v=>Math.max(0,Math.min(1,v));
const ease=v=>{v=clamp(v);return v*v*(3-2*v);};
export function setupProcessor(lenis){
 const section=document.querySelector('#tech-stack');if(!section)return()=>{};
 const host=section.querySelector('.processor-viewport'),groups=[...section.querySelectorAll('.tech-group')],tabs=[...section.querySelectorAll('[data-stack-step]')],reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let renderer;
 try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});}catch{section.classList.add('processor-unavailable');groups.forEach(g=>g.hidden=false);return()=>{};}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor(0,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;host.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-4,4,4,-4,.1,100);camera.position.set(5,4.3,7);camera.lookAt(0,0,0);
 const key=new THREE.DirectionalLight(0xfff2df,4);key.position.set(3,6,5);scene.add(key);const rim=new THREE.DirectionalLight(0xc5d9ff,3);rim.position.set(-4,2,-3);scene.add(rim);scene.add(new THREE.HemisphereLight(0xf3e7db,0x151318,2));
 const ec=document.createElement('canvas');ec.width=512;ec.height=256;const ctx=ec.getContext('2d');ctx.fillStyle='#333338';ctx.fillRect(0,0,512,256);ctx.fillStyle='#f5eee5';for(const r of [[20,20,110,55],[230,40,30,180],[350,20,140,30],[390,170,90,50]])ctx.fillRect(...r);
 const env=new THREE.CanvasTexture(ec);env.mapping=THREE.EquirectangularReflectionMapping;env.colorSpace=THREE.SRGBColorSpace;scene.environment=env;
 const mats=[],geos=new Set();
 function mat(color,metalness=.8,roughness=.28){const m=new THREE.MeshStandardMaterial({color,metalness,roughness});mats.push(m);return m;}
 const black=mat(0x17191d,.7,.3),pcb=mat(0x25282a,.45,.4),silver=mat(0xb0b4ba,.92,.23),copper=mat(0xc68a69,.92,.25),gold=mat(0xd8a47f,.8,.25),chip=mat(0x101318,.5,.26);
 const assembly=new THREE.Group();scene.add(assembly);const layers=Array.from({length:8},()=>{const g=new THREE.Group();assembly.add(g);return g;});
 function mesh(geo,material,parent,x=0,y=0,z=0){geos.add(geo);const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);parent.add(m);return m;}
 function box(p,w,h,d,m,x=0,y=0,z=0){return mesh(new THREE.BoxGeometry(w,h,d),m,p,x,y,z);}
 function plate(p,w,d,h,m){const r=.12,s=new THREE.Shape();s.moveTo(-w/2+r,-d/2);s.lineTo(w/2-r,-d/2);s.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);s.lineTo(w/2,d/2-r);s.quadraticCurveTo(w/2,d/2,w/2-r,d/2);s.lineTo(-w/2+r,d/2);s.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);s.lineTo(-w/2,-d/2+r);s.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);const g=new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.018,bevelThickness:.015,curveSegments:5});g.rotateX(-Math.PI/2);g.translate(0,-h/2,0);return mesh(g,m,p);}
 function contacts(p,n,spacing,y){const geo=new THREE.BoxGeometry(.045,.025,.045);geos.add(geo);const inst=new THREE.InstancedMesh(geo,gold,n*n),dummy=new THREE.Object3D();let k=0;for(let x=0;x<n;x++)for(let z=0;z<n;z++){dummy.position.set((x-(n-1)/2)*spacing,y,(z-(n-1)/2)*spacing);dummy.updateMatrix();inst.setMatrixAt(k++,dummy.matrix);}p.add(inst);}
 function traces(p,w,y){for(let i=0;i<14;i++){const z=(i-6.5)*.15,end=(i%3)*.11;const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-w/2+.12,y,z),new THREE.Vector3(-.7-end,y,z),new THREE.Vector3(-.5-end,y,z+.08),new THREE.Vector3(-.25,y,z+.08)]);geos.add(geo);const m=new THREE.LineBasicMaterial({color:0xa9885d,transparent:true,opacity:.65});mats.push(m);p.add(new THREE.Line(geo,m));box(p,.13,.06,.075,i%3?chip:silver,w/2-.2,y+.02,z);}}
 plate(layers[0],2.8,2.5,.09,black);contacts(layers[0],16,.11,.06);traces(layers[0],2.8,.06);
 plate(layers[1],2.55,2.25,.065,pcb);contacts(layers[1],14,.13,-.05);traces(layers[1],2.55,.05);
 plate(layers[2],2.35,2.05,.065,silver);plate(layers[2],1.65,1.45,.075,copper);
 plate(layers[3],2.5,2.2,.055,pcb);traces(layers[3],2.5,.04);contacts(layers[3],10,.14,.05);
 plate(layers[4],1.75,1.6,.09,copper);box(layers[4],.85,.055,.75,chip,0,.08);contacts(layers[4],8,.085,.12);
 plate(layers[5],2.35,2.1,.07,pcb);traces(layers[5],2.35,.05);box(layers[5],1.25,.09,1.1,copper,0,.06);
 plate(layers[6],2.55,2.25,.07,silver);plate(layers[6],1.8,1.55,.04,copper);
 plate(layers[7],2.65,2.35,.09,black);plate(layers[7],2.35,2.05,.025,silver);plate(layers[7],2.22,1.92,.025,black);
 const label=document.createElement('canvas');label.width=512;label.height=256;const lc=label.getContext('2d');lc.fillStyle='#17191d';lc.fillRect(0,0,512,256);lc.textAlign='center';lc.fillStyle='#d8a47f';lc.font='36px sans-serif';lc.fillText('N I H A L',256,108);lc.fillStyle='#b4b6ba';lc.font='17px sans-serif';lc.fillText('INTELLIGENCE / ENGINEERED',256,154);
 const texture=new THREE.CanvasTexture(label);texture.colorSpace=THREE.SRGBColorSpace;const lm=new THREE.MeshStandardMaterial({map:texture,metalness:.55,roughness:.35});mats.push(lm);const text=mesh(new THREE.PlaneGeometry(1.75,.875),lm,layers[7],0,.08,0);text.rotation.x=-Math.PI/2;
 const screw=new THREE.CylinderGeometry(.037,.037,.025,10);for(const l of [layers[0],layers[6],layers[7]])for(const x of [-1.12,1.12])for(const z of [-.96,.96])mesh(screw,silver,l,x,.07,z);
 const particleView=particleProcessor(layers,renderer,host,geos,mats);
 let active=-1,frame,previousPose="";
 const projected=new THREE.Vector3();
 function resize(){particleView.resize();const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);const aspect=w/Math.max(h,1),half=Math.max(3.5,2.4/aspect);camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();}
 const ro=new ResizeObserver(resize);ro.observe(host);resize();
 const handlers=tabs.map((tab,i)=>{const h=()=>lenis.scrollTo(section.offsetTop+[.02,.3,.5,.7,.97][i]*(section.offsetHeight-innerHeight),{immediate:reduced});tab.addEventListener('click',h);return h;});
 const keys=tabs.map((tab,i)=>{const h=e=>{let n;if(e.key==='ArrowRight'||e.key==='ArrowDown')n=(i+1)%5;else if(e.key==='ArrowLeft'||e.key==='ArrowUp')n=(i+4)%5;else if(e.key==='Home')n=0;else if(e.key==='End')n=4;else return;e.preventDefault();tabs[n].focus();handlers[n]();};tab.addEventListener('keydown',h);return h;});
 function update(){frame=requestAnimationFrame(update);const progress=clamp((scrollY-section.offsetTop)/Math.max(1,section.offsetHeight-innerHeight));section.dataset.assemblyProgress=progress.toFixed(4);section.style.setProperty("--assembly-progress",progress.toFixed(4));section.querySelector('.assembly-caption').textContent=progress>=.9?'Processor assembled':'Scroll to assemble';const index=Math.min(4,Math.floor(progress*5));if(index!==active){active=index;groups.forEach((g,i)=>g.hidden=i!==index);tabs.forEach((t,i)=>{t.setAttribute('aria-selected',String(i===index));t.tabIndex=i===index?0:-1;});section.querySelector('.tech-stack-count').textContent=`0${index+1} / 05`;}
 const p=reduced?[0,.33,.53,.73,1][index]:progress;layers.forEach((g,i)=>{const t=ease((p-(i===0?.08:.1+i*.09))/.17);g.position.y=THREE.MathUtils.lerp(-2.2+i*.63,-.34+i*.095,t);});assembly.scale.setScalar(1+.45*ease((p-.75)/.18));assembly.rotation.y=-.16;// Publish the animated component positions to the portrait/India renderer.
 const rect=host.getBoundingClientRect();
 const pose=[progress.toFixed(6),rect.width,rect.height,innerWidth,innerHeight,rect.left].join(":");
 if(pose!==previousPose){
  previousPose=pose;assembly.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  const virtualTop=host.offsetTop;
  for(let layerIndex=0;layerIndex<8;layerIndex++){
   const cloud=layers[layerIndex].children.find(child=>child.isPoints);
   const points=cloud.geometry.attributes.position;
   for(let i=0;i<5500;i++){
    processorState.strengths[layerIndex*5500+i]=cloud.geometry.attributes.strength.getX(i)*(layerIndex>0&&layerIndex<7?1-.88*ease((p-.72)/.18):1);
    projected.fromBufferAttribute(points,Math.floor(i*points.count/5500)).applyMatrix4(cloud.matrixWorld).project(camera);
    const pixelX=rect.left+(projected.x*.5+.5)*rect.width;
    const pixelY=virtualTop+(-projected.y*.5+.5)*rect.height;
    const offset=(layerIndex*5500+i)*3;
    processorState.positions[offset]=pixelX/innerWidth*2-1;
    processorState.positions[offset+1]=1-pixelY/innerHeight*2;
    processorState.positions[offset+2]=projected.z;
   }
  }
  processorState.ready=true;processorState.version++;
 }
}
 update();return()=>{processorState.ready=false;cancelAnimationFrame(frame);ro.disconnect();particleView.dispose();tabs.forEach((t,i)=>{t.removeEventListener('click',handlers[i]);t.removeEventListener('keydown',keys[i]);});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());env.dispose();texture.dispose();renderer.dispose();renderer.domElement.remove();};
}
