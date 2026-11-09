import { processorState } from "./processor-state.js";
import * as THREE from "../vendor/three.module.min.js";
import { vertexShader, fragmentShader } from "./shaders.js?v=processor-work-handoff";
import { palette } from "./palette.js";
import { createNetworkAttributes } from "./network.js";
import { karnataka } from "./location.js?v=karnataka";

// Timing and framing follow the reference's viewport-based scroll choreography.
export const sceneState = {
  ringMix: 0,
  closing: 0,
  workExit: 0,
  contactFocus: 0,
  emailRect: null,
  formation: 0,
};
const root = document.documentElement;
const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));
const smooth = (n) => n * n * (3 - 2 * n);
const mix = THREE.MathUtils.lerp;

function decodeCloud(buffer) {
  const view = new DataView(buffer);
  if (String.fromCharCode(...new Uint8Array(buffer, 0, 4)) !== "PPT1")
    throw new Error("Invalid particle data");
  const count = view.getUint32(4, true);
  const scale = view.getFloat32(8, true);
  const positions = new Float32Array(count * 3);
  const luma = new Float32Array(count);
  const morphLuma = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const offset = 12 + i * 8;
    for (let axis = 0; axis < 3; axis++)
      positions[i * 3 + axis] = view.getInt16(offset + axis * 2, true) * scale;
    luma[i] = view.getUint8(offset + 6) / 255;
    morphLuma[i] = view.getUint8(offset + 7) / 255;
  }
  return { count, positions, luma, morphLuma };
}

async function readCloud(name) {
  const response = await fetch(
    new URL(`../assets/${name}.bin`, import.meta.url),
  );
  if (!response.ok)
    throw new Error(`Particle asset unavailable: ${response.status}`);
  return decodeCloud(await response.arrayBuffer());
}

export async function createScene(container) {
  const [portrait, country] = await Promise.all([
    readCloud("portrait"),
    readCloud("india"),
  ]);
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer = matchMedia("(pointer: coarse)").matches;
  const stride = coarsePointer ? 2 : 1;
  const count = Math.ceil(portrait.count / stride);
  const positions = new Float32Array(count * 3);
  const countryPositions = new Float32Array(count * 3);
  const luma = new Float32Array(count);
  const morphLuma = new Float32Array(count);
  let maxY = -Infinity,
    minY = Infinity,
    minX = Infinity,
    maxX = -Infinity;
  let countryMaxY = -Infinity,
    countryMinY = Infinity,
    countryMinX = Infinity,
    countryMaxX = -Infinity;
  for (let i = 0; i < count; i++) {
    const index = i * stride;
    positions.set(portrait.positions.subarray(index * 3, index * 3 + 3), i * 3);
    countryPositions.set(
      country.positions.subarray(index * 3, index * 3 + 3),
      i * 3,
    );
    luma[i] = portrait.luma[index];
    morphLuma[i] = portrait.morphLuma[index];
    const x = positions[i * 3],
      y = positions[i * 3 + 1],
      iy = countryPositions[i * 3 + 1];
    maxY = Math.max(maxY, y);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    minX = Math.min(minX, x);
    countryMaxY = Math.max(countryMaxY, iy);
    countryMinY = Math.min(countryMinY, iy);
    countryMinX = Math.min(countryMinX, countryPositions[i * 3]);
    countryMaxX = Math.max(countryMaxX, countryPositions[i * 3]);
  }
  const cloudHeight = maxY - minY,
    cloudWidth = maxX - minX;
  const cloudCenter = (maxY + minY) / 2;
  const countryCenter = (countryMaxY + countryMinY) / 2;
  const countryWidth = countryMaxX - countryMinX;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  } catch (error) {
    renderFallback(container, portrait);
    root.classList.add("webgl-unavailable");
    console.warn("Using the static particle portrait.", error);
    return { destroy() {}, particleCount: count, fallback: true };
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  container.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    45,
    innerWidth / innerHeight,
    0.1,
    100,
  );
  const cameraDistance = 3;
  camera.position.z = cameraDistance;

  const attributes = {
    position: [positions, 3],
    aCountry: [countryPositions, 3],
    aProcessor: [new Float32Array(count * 3), 3],
    aProcessorStrength: [new Float32Array(count), 1],
    aLuma: [luma, 1],
    aMorphLuma: [morphLuma, 1],
    aOrigin: [new Float32Array(count * 3), 3],
    ...createNetworkAttributes(count),
    aDelay: [new Float32Array(count), 1],
    aSize: [new Float32Array(count), 1],
    aPhase: [new Float32Array(count), 1],
  };
  const origin = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    origin.set(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
    );
    if (!origin.lengthSq()) origin.set(0, 1, 0);
    origin.normalize().multiplyScalar(2 + Math.random() * 4.5);
    origin.toArray(attributes.aOrigin[0], i * 3);
    attributes.aDelay[0][i] = Math.random() * 0.55;
    attributes.aSize[0][i] =
      0.5 + 0.35 * morphLuma[i] + 1.4 * Math.pow(Math.random(), 3);
    attributes.aPhase[0][i] = Math.random() * Math.PI * 2;
  }
  const geometry = new THREE.BufferGeometry();
  for (const [name, [array, size]] of Object.entries(attributes))
    geometry.setAttribute(name, new THREE.BufferAttribute(array, size));
  const uniforms = Object.fromEntries(
    Object.entries({
      uTime: 0,
      uSize: 5.5,
      uPixelRatio: renderer.getPixelRatio(),
      uFormation: reducedMotion ? 1 : 0,
      uMorph: 0,
      uMorph2: 0,
      uMorph3: 0,
      uProcessorReady: 0,
      uWorkExit: 0,
      uMorph4: 0,
      uMorph5: 0,
      uRingMix: 0,
      uRingRadius: cloudWidth * 0.07,
      uOutlineRect: new THREE.Vector4(),
      uNetworkSize: new THREE.Vector2(),
      uFlowDepth: 0,
      uSpiralRadius: 0,
      uWorkSlide: 0,
      uTurbulence: 0,
      uColor: new THREE.Color(palette.foreground),
      uHoverColor: new THREE.Color(palette.interactionRed),
      uExposure: 0.5,
      uPointer: new THREE.Vector2(),
      uGlow: 0,
      uGlowRadius: 1,
      uAspect: innerWidth / innerHeight,
      uIsPortrait: +(innerWidth < innerHeight),
      uCountryScale: 1,
      uCountryCentreY: countryCenter,
    }).map(([key, value]) => [key, { value }]),
  );
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const group = new THREE.Group();
  group.add(new THREE.Points(geometry, material));
  scene.add(group);
  let scale = 1,
    visibleHeight = 1,
    visibleWidth = 1;
  let workStart = 3, networkSpan = 1, processorVersion = -1;
  let wideLocation = innerWidth > 760;
  const education = document.querySelector(".education");
  const locationSection = document.querySelector("#location");
  const locationCallout = document.querySelector(".location-callout");
  const stateOutline = document.querySelector(".location-state-outline");
  const leader = document.querySelector(".location-leader");
  const cut = document.querySelector(".location-cut");
  const stateLabel = document.querySelector(".location-state");
  const locationPoint = new THREE.Vector3();
  const resize = () => {
    const width = container.clientWidth,
      height = container.clientHeight;
    if (!width || !height) return;
    wideLocation = innerWidth > 760;
    const workSection = document.querySelector(".how-i-work--howIWork");
    workStart = workSection ? workSection.offsetTop / innerHeight : 3;
    networkSpan = workSection ? Math.max(workSection.offsetHeight / innerHeight - 1, 1) : 1;
    const portraitViewport = width < height;
    visibleHeight = 2 * Math.tan((camera.fov * Math.PI) / 360) * cameraDistance;
    visibleWidth = (visibleHeight * width) / height;
    scale = portraitViewport
      ? (0.9 * visibleHeight) / cloudHeight
      : Math.min(
          (0.9 * visibleHeight) / cloudHeight,
          (0.92 * visibleWidth) / cloudWidth,
        );
    uniforms.uNetworkSize.value.set(visibleHeight * (wideLocation ? .82 : .32) / scale, visibleHeight * (wideLocation ? .82 : .32) / scale);
    uniforms.uFlowDepth.value = visibleHeight / scale * 2.4;
    uniforms.uSpiralRadius.value = (0.2 * visibleHeight) / scale;
    uniforms.uSize.value = clamp((height / 900) * 5.5, 2.4, 7);
    uniforms.uAspect.value = width / height;
    uniforms.uIsPortrait.value = +portraitViewport;
    // India is broader than the reference country: fit both narrow and wide screens.
    uniforms.uCountryScale.value = Math.min(
      portraitViewport ? 0.7 : 1,
      (visibleWidth * (wideLocation ? 0.4 : 0.88)) / (scale * countryWidth),
    );
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  resize();
  const layoutObserver = new ResizeObserver(resize);
  if (education) layoutObserver.observe(education);
  document.fonts.ready.then(resize);
  addEventListener("resize", resize);
  const pointer = new THREE.Vector2(),
    targetPointer = new THREE.Vector2();
  let pointerPresence = 0,
    targetPresence = 0;
  const onPointer = (event) => {
    targetPointer.set(
      (event.clientX / innerWidth) * 2 - 1,
      1 - (event.clientY / innerHeight) * 2,
    );
    targetPresence = 1;
  };
  const onLeave = () => {
    targetPresence = 0;
  };
  if (!reducedMotion) {
    addEventListener("pointermove", onPointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
  }
  let previousTime = performance.now(),
    lastScroll = scrollY,
    turbulence = 0,
    frame;
  const lookTarget = new THREE.Vector3(),
    topLeft = new THREE.Vector3(),
    bottomRight = new THREE.Vector3();
  const soften = (value, maximum) => maximum * Math.tanh(value / maximum);
  function animate(now) {
    frame = requestAnimationFrame(animate);
    const dt = Math.min((now - previousTime) / 1000, 0.02);
    previousTime = now;
    if (document.hidden) return;
    const scroll =
      document.body.dataset.page === "home" ? scrollY : innerHeight * workStart;
    const speed = Math.abs(scroll - lastScroll) / Math.max(dt, 0.001);
    lastScroll = scroll;
    turbulence +=
      (clamp(speed / 2400) - turbulence) * (1 - Math.exp(-dt / 0.15));
    uniforms.uTurbulence.value = reducedMotion ? 0 : turbulence;
    const time = (uniforms.uTime.value += reducedMotion ? 0 : dt);
    const follow = 1 - Math.exp(-dt / 0.35);
    pointer.lerp(targetPointer, follow);
    pointerPresence +=
      (targetPresence - pointerPresence) *
      (1 - Math.exp(-dt / (targetPresence > pointerPresence ? 0.35 : 1.1)));
    const vh = scroll / innerHeight;
    const portraitScroll = clamp(vh);
    const map = smooth(clamp((vh - 1.3) / 0.7));
    const network = smooth(clamp((vh - (workStart - 0.6)) / 0.6));
    const work = clamp((vh - workStart) / networkSpan);
    uniforms.uMorph.value = map;
    uniforms.uMorph2.value = map;
    uniforms.uMorph3.value = network;
    uniforms.uProcessorReady.value = +processorState.ready;
    if(processorState.ready && processorVersion !== processorState.version){
      processorVersion=processorState.version;
      const attribute=geometry.getAttribute("aProcessor");
      for(let i=0;i<count;i++)attribute.array.set(processorState.positions.subarray(i*stride*3,i*stride*3+3),i*3);
      attribute.needsUpdate=true;
      const strength=geometry.getAttribute("aProcessorStrength");
      for(let i=0;i<count;i++)strength.array[i]=processorState.strengths[i*stride];
      strength.needsUpdate=true;
    }
    // A quiet photographic impression; later morphs retain their original light.
    const portraitLight = 0.48 * (1 - map) * (1 - sceneState.ringMix);
    uniforms.uExposure.value = 0.5 + portraitLight + 0.25 * map * (1 - network);
    uniforms.uWorkSlide.value = work;
    root.style.setProperty(
      "--country-ready",
      (clamp((map - 0.99) / 0.01) * (1 - clamp((network - 0.85) / 0.15))).toFixed(
        4,
      ),
    );
    root.style.setProperty(
      "--work-ready",
      (
        clamp((network - 0.85) / 0.15) *
        (1 - clamp((work - 0.85) / 0.15))
      ).toFixed(4),
    );
    uniforms.uWorkExit.value = sceneState.workExit;
    uniforms.uMorph4.value = sceneState.closing;
    uniforms.uMorph5.value = sceneState.contactFocus;
    uniforms.uRingMix.value = sceneState.ringMix;
    const focus = Math.max(sceneState.closing, sceneState.contactFocus);
    const formation = (uniforms.uFormation.value = Math.min(
      uniforms.uFormation.value + dt / 4,
      1,
    ));
    sceneState.formation = formation;
    group.rotation.y =
      (soften(
        mix(Math.sin(time * 0.16) * 0.12, pointer.x * 0.16, pointerPresence) *
          formation,
        0.22,
      ) -
        0.6 * portraitScroll * (1 - map)) *
      (1 - focus);
    group.rotation.x =
      soften(
        mix(
          -Math.sin(time * 0.11 + 1.4) * 0.12 * 0.4,
          -pointer.y * 0.16 * 0.6,
          pointerPresence,
        ) * formation,
        0.132,
      ) *
      (1 - focus);
    group.rotation.z = 0.06 * network * (1 - focus);
    uniforms.uPointer.value.copy(pointer);
    uniforms.uGlow.value = reducedMotion ? 0 : 2 * pointerPresence;
    const zoom =
      scale * (1 + portraitScroll * 0.2 * (1 - map)) * (1 + 0.06 * work);
    group.scale.setScalar(zoom);
    const portraitY =
      -visibleHeight / 2 -
      minY * zoom -
      0.09 * visibleHeight * portraitScroll * (1 - map);
    const morphY =
      -mix(mix(cloudCenter, countryCenter, map), 0, network) * zoom -
      0.04 * map * (1 - network) * visibleHeight;
    group.position.y = mix(mix(portraitY, morphY, map), 0, sceneState.ringMix) + (wideLocation ? 0 : .27 * visibleHeight * network * (1 - focus));
    group.position.x = mix(
      0.15 * visibleWidth * portraitScroll * (1 - map) -
        (wideLocation ? 0.22 * visibleWidth * map * (1 - network) : 0) -
        (wideLocation ? 0.22 : 0) * network * visibleWidth,
      0,
      sceneState.ringMix,
    );
    const cameraAngle = .10 * work * (1 - focus);
    const cameraRadius = cameraDistance * (1 - 0.05 * work);
    camera.position.set(
      mix(Math.sin(cameraAngle) * cameraRadius, group.position.x, focus),
      mix(0, group.position.y, focus),
      Math.cos(cameraAngle) * cameraRadius,
    );
    lookTarget.set(0, 0, 0).lerp(group.position, focus);
    camera.lookAt(lookTarget);
    // Project the state boundary with the same transform and camera as the India dots.
    if (locationCallout) {
      const bounds = locationSection.getBoundingClientRect();
      const mapBottom = wideLocation ? bounds.bottom : bounds.top + innerHeight;
      const visible =
        map > 0.995 &&
        network < 0.15 &&
        formation > 0.98 &&
        mapBottom > innerHeight * 0.18 &&
        bounds.top < innerHeight * 0.6;
      if (locationCallout.dataset.visible !== String(visible)) {
        locationCallout.dataset.visible = String(visible);
        locationCallout.setAttribute("aria-hidden", String(!visible));
      }
      if (visible) {
        group.updateMatrixWorld();
        camera.updateMatrixWorld();
        const projectLocation = (point) => {
          locationPoint.fromArray(point);
          locationPoint.y -= countryCenter;
          locationPoint.multiplyScalar(uniforms.uCountryScale.value);
          locationPoint.y += countryCenter;
          group.localToWorld(locationPoint);
          locationPoint.project(camera);
          return [(locationPoint.x * .5 + .5) * container.clientWidth,
            (-locationPoint.y * .5 + .5) * container.clientHeight];
        };
        const outlinePath = karnataka.rings.map(ring => ring.map((point, i) => {
          const [px, py] = projectLocation(point);
          return `${i ? "L" : "M"}${px.toFixed(2)},${py.toFixed(2)}`;
        }).join(" ") + " Z").join(" ");
        stateOutline.setAttribute("d", outlinePath);
        const [x, y] = projectLocation(karnataka.position);
        const labelWidth = stateLabel.offsetWidth;
        const labelX = Math.max(
          18,
          Math.min(x + 120, container.clientWidth - labelWidth - 22),
        );
        const elbowX = Math.min(x + 36, labelX - 18);
        const lineY = y - 36;
        const endX = labelX - 9;
        leader.setAttribute(
          "points",
          `${x},${y} ${elbowX},${lineY} ${endX},${lineY}`,
        );
        cut.setAttribute(
          "d",
          `M${endX - 3},${lineY + 4}L${endX + 3},${lineY - 4}`,
        );
        stateLabel.style.transform = `translate(${labelX}px,${Math.max(24, lineY - 29)}px)`;
      }
    }
    if (sceneState.emailRect && sceneState.contactFocus > 0.001) {
      const rect = sceneState.emailRect,
        portraitViewport = innerWidth < innerHeight;
      const h =
        2 *
        Math.tan((camera.fov * Math.PI) / 360) *
        Math.abs(camera.position.z - group.position.z);
      const w = h * camera.aspect;
      const padX = portraitViewport ? 6 : 26,
        padY = portraitViewport ? 18 : 34;
      topLeft.set(
        camera.position.x + ((rect.left - padX) / innerWidth - 0.5) * w,
        camera.position.y - ((rect.top - padY) / innerHeight - 0.5) * h,
        group.position.z,
      );
      bottomRight.set(
        camera.position.x + ((rect.right + padX) / innerWidth - 0.5) * w,
        camera.position.y - ((rect.bottom + padY) / innerHeight - 0.5) * h,
        group.position.z,
      );
      group.updateMatrixWorld();
      group.worldToLocal(topLeft);
      group.worldToLocal(bottomRight);
      uniforms.uOutlineRect.value.set(
        topLeft.x,
        bottomRight.x,
        topLeft.y,
        bottomRight.y,
      );
    }
    renderer.render(scene, camera);
  }
  frame = requestAnimationFrame(animate);
  return {
    particleCount: count,
    destroy() {
      layoutObserver.disconnect();
      cancelAnimationFrame(frame);
      removeEventListener("resize", resize);
      removeEventListener("pointermove", onPointer);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

function renderFallback(container, portrait) {
  const canvas = document.createElement("canvas");
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  const ctx = canvas.getContext("2d");
  let minY = Infinity,
    maxY = -Infinity;
  for (let i = 0; i < portrait.count; i++) {
    minY = Math.min(minY, portrait.positions[i * 3 + 1]);
    maxY = Math.max(maxY, portrait.positions[i * 3 + 1]);
  }
  const scale = (canvas.height * 0.9) / (maxY - minY);
  for (let i = 0; i < portrait.count; i += 2) {
    ctx.fillStyle = `rgba(${palette.foregroundRgb},${portrait.luma[i] * 0.4})`;
    ctx.fillRect(
      canvas.width / 2 + portrait.positions[i * 3] * scale,
      canvas.height - (portrait.positions[i * 3 + 1] - minY) * scale,
      1,
      1,
    );
  }
  container.append(canvas);
}
