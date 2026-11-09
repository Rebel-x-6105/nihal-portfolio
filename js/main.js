import { setupProjectEffects } from "./project-effects.js";
import { setupProcessor } from "./processor.js";
import Lenis from "../vendor/lenis.mjs";
import { palette } from "./palette.js";
import { createScene, sceneState } from "./scene.js?v=icon-contact-frame";
import { projects } from "./projects.js?v=nihal-nine-projects";
import { createVideoPlane } from "./video-plane.js?v=image-previews";

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [
  ...parent.querySelectorAll(selector),
];
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (value) => Math.max(0, Math.min(1, value));
const smootherstep = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const isHome = document.body.dataset.page === "home";
const lifecycle = [];

const lenis = new Lenis({ autoRaf: true, lerp: 0.1, anchors: true });
lifecycle.push(() => lenis.destroy());
if (isHome) {
  lifecycle.push(setupProcessor(lenis));
  setupPlayground();
}
if (document.body.dataset.page === "project") lifecycle.push(setupProjectEffects());
setupText();
setupLinks();
setupContactParticles();
setupCursor();

let showPreloader = false;
try {
  showPreloader =
    !sessionStorage.getItem("reference-preloader-shown") &&
    !reducedMotion &&
    isHome;
} catch {}
if (showPreloader) {
  document.body.dataset.preloading = "true";
  lenis.stop();
  sceneState.ringMix = 1;
}
createScene($(".particle-scene"))
  .then((scene) => {
    document.body.dataset.particles = scene.particleCount;
    document.body.dataset.renderer = scene.fallback ? "canvas" : "three-webgl";
    lifecycle.push(() => scene.destroy());
    if (showPreloader && !scene.fallback) runPreloader();
    else finishPreloader();
  })
  .catch((error) => {
    console.error("Scene failed to load", error);
    document.documentElement.classList.add("webgl-unavailable");
    finishPreloader();
  });

function finishPreloader() {
  sceneState.ringMix = 0;
  document.body.dataset.preloading = "false";
  document.body.dataset.ready = "true";
  $(".preloader--preloader")?.remove();
  lenis.resize();
  lenis.start();
  $$(".hero--copy .blur-anim").forEach((el, index) => {
    el.style.setProperty("--anim-delay", `${index * 0.8 - 0.8}s`);
    el.classList.add("is-visible");
  });
  try {
    sessionStorage.setItem("reference-preloader-shown", "1");
  } catch {}
}

function runPreloader() {
  const loader = document.createElement("div");
  loader.className = "preloader--preloader";
  loader.setAttribute("aria-hidden", "true");
  loader.innerHTML = '<span class="preloader--count t-20">0%</span>';
  document.body.append(loader);
  const count = loader.firstElementChild;
  const start = performance.now();
  function tick(now) {
    const elapsed = now - start;
    if (elapsed > 3000) count.dataset.entered = "true";
    count.textContent = `${Math.round(Math.pow(clamp((elapsed - 3500) / 2000), 3) * 100)}%`;
    if (elapsed > 6000) count.dataset.entered = "false";
    if (elapsed > 6400) {
      const t = clamp((elapsed - 6400) / 2000);
      sceneState.ringMix =
        1 - (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    }
    if (elapsed < 8400) requestAnimationFrame(tick);
    else finishPreloader();
  }
  requestAnimationFrame(tick);
}

function setupText() {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
    },
    { rootMargin: "0px 0px -10% 0px" },
  );
  for (const el of $$(".split, .blur-anim")) {
    el.style.setProperty(
      "--anim-delay",
      `${0.15 + Number(el.dataset.delay || 0)}s`,
    );
    if (el.classList.contains("blur-anim")) {
      const text = el.textContent.trim().replace(/\s+/g, " ");
      el.setAttribute("aria-label", text);
      el.replaceChildren(
        ...Array.from(text, (char, index) => {
          const span = document.createElement("span");
          span.className = "char";
          span.textContent = char;
          span.setAttribute("aria-hidden", "true");
          span.style.setProperty("--anim-index", index);
          return span;
        }),
      );
      el.style.setProperty("--anim-stagger", ".05s");
    } else {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          return node.parentElement.closest(".no-anim")
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT;
        },
      });
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      let index = 0;
      for (const node of nodes) {
        const fragment = document.createDocumentFragment();
        for (const word of node.textContent.split(/(\s+)/)) {
          if (!word.trim()) {
            fragment.append(word);
            continue;
          }
          const wrapper = document.createElement("span"),
            span = document.createElement("span");
          wrapper.className = "word-wrapper";
          span.className = "word";
          span.textContent = word;
          span.style.setProperty("--anim-index", index++);
          wrapper.append(span);
          fragment.append(wrapper);
        }
        node.replaceWith(fragment);
      }
      el.style.setProperty("--anim-stagger", index > 15 ? ".015s" : ".05s");
    }
    el.classList.add("is-split");
    if (reducedMotion) el.classList.add("is-visible");
    else if (!el.closest(".hero--hero")) observer.observe(el);
  }
  lifecycle.push(() => observer.disconnect());
  const email = $(".contacts--emailShell");
  if (email) {
    const contactObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) email.dataset.entered = "true";
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    contactObserver.observe(email);
    lifecycle.push(() => contactObserver.disconnect());
  }
}

function setupPlayground() {
  const section = $(".playground--playground");
  const closingWrap = $(".playground--closingWrap",section);
  const stage = document.createElement("div");
  stage.className = "playground--stage";
  stage.dataset.active="true";
  stage.innerHTML = '<div class="gallery-toolbar"><p>Browse projects horizontally</p><div><span class="gallery-count">01 / 09</span><button type="button" class="gallery-prev" aria-label="Previous project">←</button><button type="button" class="gallery-next" aria-label="Next project">→</button></div></div><div class="playground--marquee" tabindex="0" role="region" aria-label="Projects. Use left and right arrow keys to browse."><div class="playground--track"></div></div>';
  section.insertBefore(stage,closingWrap);
  const marquee=$(".playground--marquee",stage),track=$(".playground--track",stage);
  let energy=0,previousX=0,frame;
  for(const project of projects){
    const tile=document.createElement("article");tile.className="playground--tile";
    tile.innerHTML=`<a href="./projects/${project.slug}.html" class="playground--tileLink" aria-label="View ${project.title}"><div class="playground--tileMedia"></div>${project.status?`<span class="project-status">${project.status}</span>`:""}</a><div class="playground--caption"><a href="./projects/${project.slug}.html" class="playground--captionTitle t-30">${project.title}</a><span class="playground--captionMeta"><span class="playground--captionYear t-20">${project.year}</span></span></div>`;
    track.append(tile);
    lifecycle.push(createVideoPlane($(".playground--tileMedia",tile),new URL(`../${project.image||project.video}`,import.meta.url).href,()=>energy,project.image?"image":"video"));
  }
  const prev=$(".gallery-prev",stage),next=$(".gallery-next",stage);
  function move(direction){const card=track.firstElementChild;marquee.scrollBy({left:direction*(card.offsetWidth+parseFloat(getComputedStyle(track).gap)),behavior:reducedMotion?"instant":"smooth"});}
  const goPrev=()=>move(-1),goNext=()=>move(1);
  prev.addEventListener("click",goPrev);next.addEventListener("click",goNext);
  const keys=e=>{if(e.target!==marquee)return;if(e.key==="ArrowRight"||e.key==="ArrowLeft"){e.preventDefault();move(e.key==="ArrowRight"?1:-1);}else if(e.key==="Home"||e.key==="End"){e.preventDefault();marquee.scrollTo({left:e.key==="Home"?0:marquee.scrollWidth,behavior:reducedMotion?"instant":"smooth"});}};
  marquee.addEventListener("keydown",keys);
  // Mouse dragging is optional; ordinary vertical wheel scrolling stays on the page.
  let drag=null,moved=false;
  const down=e=>{if(e.pointerType!=="mouse"||e.button!==0)return;drag={id:e.pointerId,x:e.clientX,left:marquee.scrollLeft};moved=false;};
  const dragMove=e=>{if(!drag)return;const delta=e.clientX-drag.x;if(!moved&&Math.abs(delta)>7){moved=true;marquee.setPointerCapture(e.pointerId);marquee.classList.add("is-dragging");}if(moved){e.preventDefault();marquee.scrollLeft=drag.left-delta;}};
  const up=()=>{drag=null;marquee.classList.remove("is-dragging");};
  const suppress=e=>{if(moved){e.preventDefault();e.stopPropagation();moved=false;}};
  marquee.addEventListener("pointerdown",down);marquee.addEventListener("pointermove",dragMove);marquee.addEventListener("pointerup",up);marquee.addEventListener("pointercancel",up);marquee.addEventListener("click",suppress,true);
  const stopNativeDrag=e=>e.preventDefault();marquee.addEventListener("dragstart",stopNativeDrag);
  function update(){
    frame=requestAnimationFrame(update);
    const dx=Math.abs(marquee.scrollLeft-previousX);energy+=(Math.min(dx/30,1)-energy)*.12;previousX=marquee.scrollLeft;
    const step=track.firstElementChild.offsetWidth+parseFloat(getComputedStyle(track).gap);
    const index=Math.min(projects.length-1,Math.round(marquee.scrollLeft/step));
    $(".gallery-count",stage).textContent=`${String(index+1).padStart(2,"0")} / ${String(projects.length).padStart(2,"0")}`;
    prev.disabled=marquee.scrollLeft<2;next.disabled=marquee.scrollLeft>=marquee.scrollWidth-marquee.clientWidth-2;
    const bounds=section.getBoundingClientRect();
    const raw=clamp((innerHeight*.85-bounds.top)/(innerHeight*.65));
    const entry=reducedMotion?+(raw>.5):smootherstep(raw);sceneState.workExit=entry;
    section.style.setProperty("--gallery-reveal",(reducedMotion?entry:smootherstep(clamp((raw-.3)/.7))).toFixed(4));
    const tech=$("#tech-stack");if(tech){const opacity=1-smootherstep(clamp(raw/.5));tech.style.setProperty("--tech-panel-opacity",opacity.toFixed(4));tech.style.setProperty("--tech-panel-shift",String(-16*(1-opacity)));$(".tech-stack-panel",tech).inert=opacity<.1;}
    const closing=closingWrap.getBoundingClientRect();sceneState.closing=reducedMotion?+(closing.top<innerHeight*.5):smootherstep(clamp((innerHeight*.9-closing.top)/(innerHeight*.7)));
  }
  update();
  lifecycle.push(()=>{cancelAnimationFrame(frame);prev.removeEventListener("click",goPrev);next.removeEventListener("click",goNext);marquee.removeEventListener("keydown",keys);marquee.removeEventListener("pointerdown",down);marquee.removeEventListener("pointermove",dragMove);marquee.removeEventListener("pointerup",up);marquee.removeEventListener("pointercancel",up);marquee.removeEventListener("click",suppress,true);marquee.removeEventListener("dragstart",stopNativeDrag);});
}

function setupLinks() {
  const monogram = $(".monogram--wrap");
  if (monogram) {
    monogram.addEventListener("pointerenter", () => {
      monogram.dataset.hovered = "true";
      $(".monogram--tooltip").dataset.visible = "true";
    });
    monogram.addEventListener("pointerleave", () => {
      monogram.dataset.hovered = "false";
      $(".monogram--tooltip").dataset.visible = "false";
    });
    if (isHome)
      monogram.addEventListener("click", (event) => {
        event.preventDefault();
        lenis.scrollTo(0);
      });
  }
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (
      !link ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      link.target === "_blank" ||
      link.hasAttribute("download")
    )
      return;
    const url = new URL(link.href);
    if (
      url.origin !== location.origin ||
      url.protocol !== location.protocol ||
      url.pathname === location.pathname
    )
      return;
    event.preventDefault();
    document.body.classList.add("page-leaving");
    setTimeout(() => location.assign(url.href), reducedMotion ? 0 : 400);
  });
}

function setupContactParticles() {
  const email = $(".contact-hub") || $(".contacts--emailShell");
  if (email) {
    let frame;
    const update = () => {
      const rect = email.getBoundingClientRect();
      const distance =
        Math.abs(rect.top + rect.height / 2 - innerHeight / 2) /
        (innerHeight / 2);
      sceneState.contactFocus = smootherstep(clamp(1 - distance));
      sceneState.emailRect = rect;
      frame = requestAnimationFrame(update);
    };
    update();
    lifecycle.push(() => cancelAnimationFrame(frame));
  }
  if (reducedMotion) return;
  for (const wrapper of $$(".particle-disintegrate--particles")) {
    const canvas = $("canvas", wrapper),
      text = $(".particle-disintegrate--el", wrapper);
    if (!canvas || !text) continue;
    const context = canvas.getContext("2d");
    let running = false;
    wrapper.closest("a")?.addEventListener("pointerenter", () => {
      if (running) return;
      running = true;
      const rect = text.getBoundingClientRect(),
        padding = 60;
      const dpr = Math.min(devicePixelRatio, 2);
      canvas.width = (rect.width + padding * 2) * dpr;
      canvas.height = (rect.height + padding * 2) * dpr;
      canvas.style.width = `${rect.width + padding * 2}px`;
      canvas.style.height = `${rect.height + padding * 2}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const particles = [],
        start = performance.now();
      for (let i = 0; i < Math.min(rect.width * 2, 1400); i++)
        particles.push({
          x: padding + Math.random() * rect.width,
          y: padding + Math.random() * rect.height,
          vx: Math.random() * 4 - 2,
          vy: Math.random() * 4 - 2,
          size: Math.random() * 2 + 0.5,
        });
      function animate(now) {
        const progress = (now - start) / 900;
        context.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        context.fillStyle = `rgba(${palette.interactionRedRgb},${Math.max(0, Math.sin(progress * Math.PI) * 0.75)})`;
        for (const particle of particles) {
          particle.x += particle.vx;
          particle.y += particle.vy;
          context.fillRect(
            particle.x,
            particle.y,
            particle.size,
            particle.size,
          );
        }
        text.style.opacity = String(
          1 - Math.sin(Math.min(progress, 1) * Math.PI) * 0.7,
        );
        if (progress < 1) requestAnimationFrame(animate);
        else {
          text.style.opacity = "";
          running = false;
          context.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        }
      }
      requestAnimationFrame(animate);
    });
  }
}

function setupCursor() {
  if (
    reducedMotion ||
    !matchMedia("(pointer: fine) and (hover: hover)").matches
  )
    return;
  const cursor = document.createElement("div");
  cursor.className = "custom-cursor--cursor";
  cursor.setAttribute("aria-hidden", "true");
  cursor.innerHTML =
    '<canvas class="custom-cursor--canvas"></canvas><div class="custom-cursor--head"></div>';
  document.body.append(cursor);
  const canvas = $("canvas", cursor),
    head = $(".custom-cursor--head", cursor),
    ctx = canvas.getContext("2d");
  document.documentElement.classList.add("has-custom-cursor");
  let dpr,
    x = 0,
    y = 0,
    targetX = 0,
    targetY = 0,
    visible = false,
    frame;
  const trail = [];
  const resize = () => {
    dpr = Math.min(devicePixelRatio, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;
  };
  resize();
  addEventListener("resize", resize);
  const move = (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    if (!visible) {
      visible = true;
      x = targetX;
      y = targetY;
    }
    cursor.dataset.visible = "true";
    cursor.dataset.hover = !!event.target.closest("a,button");
  };
  const leave = () => {
    cursor.dataset.visible = "false";
  };
  addEventListener("pointermove", move, { passive: true });
  document.documentElement.addEventListener("pointerleave", leave);
  function animate(now) {
    frame = requestAnimationFrame(animate);
    x += (targetX - x) * 0.28;
    y += (targetY - y) * 0.28;
    head.style.transform = `translate3d(${x}px,${y}px,0)`;
    if (visible) trail.push({ x, y, time: now });
    while (trail.length && now - trail[0].time > 150) trail.shift();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = 1; i < trail.length; i++) {
      const age = 1 - (now - trail[i].time) / 150;
      ctx.beginPath();
      ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
      ctx.lineTo(trail[i].x, trail[i].y);
      ctx.lineWidth = 1.5 + age * 7.5;
      ctx.strokeStyle = `rgba(${palette.interactionRedRgb},${age * 0.65})`;
      ctx.lineCap = "round";
      ctx.stroke();
    }
  }
  frame = requestAnimationFrame(animate);
  lifecycle.push(() => {
    cancelAnimationFrame(frame);
    removeEventListener("resize", resize);
    removeEventListener("pointermove", move);
    document.documentElement.removeEventListener("pointerleave", leave);
  });
}

addEventListener("pagehide", () => lifecycle.forEach((destroy) => destroy()), {
  once: true,
});
addEventListener("pageshow", (event) => {
  if (event.persisted) location.reload();
});
