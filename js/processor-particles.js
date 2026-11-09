import * as THREE from '../vendor/three.module.min.js';

// Deliberate engineering silhouettes instead of noisy sampling of tiny bevels.
export function particleProcessor(layers, renderer, host, resources, materials) {
 let seed=47382;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 const label=document.createElement('canvas');label.width=256;label.height=128;
 const ctx=label.getContext('2d');ctx.fillStyle='white';ctx.font='bold 100px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('CPU',128,66);
 const data=ctx.getImageData(0,0,256,128).data,letters=[];
 for(let y=0;y<128;y+=2)for(let x=0;x<256;x+=2)if(data[(y*256+x)*4+3]>160)letters.push([x,y]);
 const widths=[2.8,2.55,2.35,2.5,1.75,2.35,2.55,2.65],depths=[2.5,2.25,2.05,2.2,1.6,2.1,2.25,2.35];
 layers.forEach((layer,index)=>{
  layer.clear();const positions=[],strengths=[];const w=widths[index],d=depths[index];
  const add=(x,y,z,s)=>{positions.push(x,y,z);strengths.push(s);};
  function line(a,b,n,s){for(let i=0;i<n;i++){const t=(i+.25+random()*.5)/n;add(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t,s);}}
  function rim(width,depth,y,n,s){const corners=[[-width/2,y,-depth/2],[width/2,y,-depth/2],[width/2,y,depth/2],[-width/2,y,depth/2]];for(let side=0;side<4;side++)line(corners[side],corners[(side+1)%4],n,s);}
  // Clear upper/lower plate boundaries and the four vertical corners.
  rim(w,d,.045,230,.95);rim(w,d,-.045,120,.72);
  for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])line([x,-.045,z],[x,.045,z],20,.8);
  if(index===7){
   rim(w-.27,d-.27,.065,160,.62);
   for(let i=0;i<1500;i++){const p=letters[Math.floor(random()*letters.length)];add((p[0]/256-.5)*1.75,.085,(p[1]/128-.5)*.87,1.0);}
  }else{
   // Central silicon die and tidy orthogonal tracks leading to its edges.
   rim(w*.52,d*.52,.075,90,.8);
   for(let side=0;side<4;side++)for(let track=0;track<10;track++){
    const z=(track-4.5)*d*.07;
    let a=[w*.27,.06,z],b=[w*.41,.06,z],c=[w*.46,.06,z+.04];
    const turn=p=>{let[x,y,z]=p;for(let k=0;k<side;k++)[x,z]=[-z,x];return[x,y,z];};
    line(turn(a),turn(b),12,.42);line(turn(b),turn(c),8,.42);
   }
  }
  // Even contact pins around the substrate read immediately as a chip.
  if(index===0||index===1||index===7){for(let side=0;side<4;side++)for(let pin=0;pin<18;pin++){
   const v=(pin-8.5)*d/21;let a=[w/2,.015,v],b=[w/2+.13,-.07,v];
   const turn=p=>{let[x,y,z]=p;for(let k=0;k<side;k++)[x,z]=[-z,x];return[x,y,z];};line(turn(a),turn(b),12,.85);
  }}
  // Quiet, evenly spaced surface dots support the outlines without fog.
  let j=0;while(strengths.length<5500){const gx=j%61,gz=Math.floor(j/61)%55;add((gx/60-.5)*(w-.12),.047,(gz/54-.5)*(d-.12),index===7?.16:.18);j++;}
  // Keep a fixed per-layer budget so the shared map cloud maps one-to-one.
  const output=new Float32Array(5500*3),opacity=new Float32Array(5500);
  for(let i=0;i<5500;i++){const source=Math.floor(i*strengths.length/5500);output.set(positions.slice(source*3,source*3+3),i*3);opacity[i]=strengths[source];}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(output,3));geo.setAttribute('strength',new THREE.BufferAttribute(opacity,1));resources.add(geo);
  const m=new THREE.PointsMaterial({size:.01});materials.push(m);layer.add(new THREE.Points(geo,m));
 });
 return {resize(){},dispose(){}};
}
