// Quiet particle circuits follow each case-study section as the page scrolls.
export function setupProjectEffects(){
  const canvas=document.createElement('canvas');canvas.className='project-particles';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
  const ctx=canvas.getContext('2d');if(!ctx){canvas.remove();return()=>{};}
  const sections=[...document.querySelectorAll('.project-content--section')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w=0,h=0,frame=0,pointer={x:-1000,y:-1000},dirty=true;
  const resize=()=>{w=innerWidth;h=innerHeight;const d=Math.min(devicePixelRatio,1.5);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);dirty=true;};
  const move=e=>{pointer={x:e.clientX,y:e.clientY};dirty=true;};
  const scroll=()=>{dirty=true;};
  const leave=()=>{pointer={x:-1000,y:-1000};dirty=true;};
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('project-section-active',e.isIntersecting)),{threshold:.18});sections.forEach(s=>observer.observe(s));
  function draw(now){
    frame=requestAnimationFrame(draw);if(document.hidden||(!dirty&&reduced))return;dirty=false;ctx.clearRect(0,0,w,h);
    const narrow=w<700;
    for(let j=0;j<sections.length;j++){
      const r=sections[j].getBoundingClientRect();if(r.bottom<0||r.top>h)continue;
      // Keep the denser cloud in the outer gutters, away from paragraph glyphs.
      const cx=narrow?w-13:w-30,cy=r.top+Math.min(r.height*.45,145);
      for(let i=0;i<(narrow?90:260);i++){
        const t=i/(narrow?90:260),side=Math.floor(t*4),u=(t*4)%1;
        const size=narrow?12:42;
        let x=(side===0?u:side===1?1:side===2?1-u:0)*size-size/2;
        let y=(side===0?0:side===1?u:side===2?1:1-u)*size-size/2;
        const layer=i%3;x+=layer*2;y+=layer*5;
        const phase=reduced?0:Math.sin(now*.0007+i*.8+j)*2;
        const px=cx+x+phase,py=cy+y+phase;
        const near=Math.max(0,1-Math.hypot(px-pointer.x,py-pointer.y)/140);
        const pulse=reduced?.6:.5+.3*Math.sin(now*.0015-t*12+j);
        ctx.fillStyle=near>.05?`rgba(239,100,92,${.35+near*.4})`:i%5===0?`rgba(216,164,127,${pulse})`:`rgba(255,255,255,${pulse*.65})`;
        ctx.beginPath();ctx.arc(px,py,i%9===0?1.2:.65,0,Math.PI*2);ctx.fill();
      }
      // A dotted leader joins the circuit to the section heading.
      const start=narrow?w-28:r.left-34;
      for(let i=0;i<18;i++){ctx.fillStyle=`rgba(216,164,127,${.18+(i/18)*.3})`;ctx.fillRect(start,r.top+4+i*3,1,1);}
    }
  }
  resize();addEventListener('resize',resize);addEventListener('pointermove',move,{passive:true});addEventListener('pointerleave',leave);addEventListener('scroll',scroll,{passive:true});frame=requestAnimationFrame(draw);
  return()=>{cancelAnimationFrame(frame);observer.disconnect();removeEventListener('resize',resize);removeEventListener('pointermove',move);removeEventListener('pointerleave',leave);removeEventListener('scroll',scroll);canvas.remove();};
}
