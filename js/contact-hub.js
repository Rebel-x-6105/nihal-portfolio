export function setupContactHub(){
 const hub=document.querySelector('.contact-hub');if(!hub)return()=>{};
 const buttons=[...hub.querySelectorAll('[data-contact]')],box=hub.querySelector('.contact-popover'),link=hub.querySelector('.contact-popover-link'),copy=hub.querySelector('.contact-copy'),status=hub.querySelector('.contact-status');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const details={linkedin:{label:'LinkedIn',display:'linkedin.com/in/mdnihalshk',value:'https://www.linkedin.com/in/mdnihalshk/',href:'https://www.linkedin.com/in/mdnihalshk/'},github:{label:'GitHub',display:'github.com/Rebel-x-6105',value:'https://github.com/Rebel-x-6105',href:'https://github.com/Rebel-x-6105'},gmail:{label:'Gmail',display:'mohammednihal665@gmail.com',value:'mohammednihal665@gmail.com',href:'mailto:mohammednihal665@gmail.com'}};
 const copyIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/></svg>';
 const checkIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
 const header=document.createElement('div');header.className='contact-popover-header';header.innerHTML='<span class="contact-popover-brand"></span><span class="contact-popover-label"></span><span class="contact-popover-hint"></span>';
 const body=document.createElement('div');body.className='contact-popover-body';body.append(link,copy);box.replaceChildren(header,body);
 let selected=null,trigger=null,timer,motion,revision=0,feedback;
 const reset=()=>{copy.innerHTML=copyIcon+'<span>Copy</span>';copy.dataset.copied='false';};reset();
 function position(){if(!trigger||box.hidden)return;const a=trigger.getBoundingClientRect(),r=box.getBoundingClientRect();box.style.setProperty('--popover-tip',`${Math.max(20,Math.min(r.width-20,a.left+a.width/2-r.left))}px`);}
 function close(restore=false){if(box.hidden)return;const current=++revision;motion?.cancel();clearTimeout(timer);buttons.forEach(b=>b.setAttribute('aria-expanded','false'));selected=null;box.inert=true;if(restore)trigger?.focus({preventScroll:true});
  if(reduced.matches){box.hidden=true;return;}
  motion=box.animate([{opacity:1,transform:'translateY(0) scale(1)',filter:'blur(0px)'},{opacity:0,transform:'translateY(8px) scale(.98)',filter:'blur(3px)'}],{duration:150,easing:'ease-in',fill:'forwards'});
  motion.finished.then(()=>{if(current===revision){box.hidden=true;motion.cancel();}}).catch(()=>{});
 }
 const handlers=buttons.map(button=>{const handler=()=>{if(selected===button.dataset.contact){close();return;}++revision;motion?.cancel();feedback?.cancel();clearTimeout(timer);selected=button.dataset.contact;trigger=button;const d=details[selected];link.textContent=d.display;link.href=d.href;link.target=selected==='gmail'?'_self':'_blank';link.rel='noopener noreferrer';header.querySelector('.contact-popover-label').textContent=d.label;header.querySelector('.contact-popover-hint').textContent=selected==='gmail'?'Email address':'Profile link';header.querySelector('.contact-popover-brand').replaceChildren(button.querySelector('svg').cloneNode(true));reset();status.textContent='';buttons.forEach(b=>b.setAttribute('aria-expanded',String(b===button)));box.hidden=false;box.inert=false;position();
  motion=box.animate(reduced.matches?[{opacity:0},{opacity:1}]:[{opacity:0,transform:'translateY(14px) scale(.96)',filter:'blur(5px)'},{opacity:1,transform:'translateY(0) scale(1)',filter:'blur(0px)'}],{duration:reduced.matches?100:360,easing:'cubic-bezier(.22,1,.36,1)'});
 };button.addEventListener('click',handler);return handler;});
 const onCopy=async()=>{if(!selected)return;const key=selected;try{await navigator.clipboard.writeText(details[key].value);if(selected!==key)return;copy.innerHTML=checkIcon+'<span>Copied</span>';copy.dataset.copied='true';status.textContent='Contact copied to clipboard.';if(!reduced.matches)feedback=copy.animate([{transform:'scale(.94)'},{transform:'scale(1.045)'},{transform:'scale(1)'}],{duration:280,easing:'ease-out'});clearTimeout(timer);timer=setTimeout(reset,2200);}catch{status.textContent='Copy unavailable. Select the link text to copy it.';const range=document.createRange();range.selectNodeContents(link);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);}};
 const outside=e=>{if(!hub.contains(e.target))close();};const escape=e=>{if(e.key==='Escape'&&!box.hidden){e.preventDefault();close(true);}};
 copy.addEventListener('click',onCopy);document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);addEventListener('resize',position);
 return()=>{++revision;clearTimeout(timer);motion?.cancel();feedback?.cancel();buttons.forEach((b,i)=>b.removeEventListener('click',handlers[i]));copy.removeEventListener('click',onCopy);document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);removeEventListener('resize',position);};
}
