import * as THREE from "../vendor/three.module.min.js";

// Deform a subdivided video plane according to scroll speed and pointer hover.
export function createVideoPlane(container, source, energy, mediaType = "video") {
  let dispose = () => {};
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();
      const isImage = mediaType === "image";
      const video = document.createElement(isImage ? "img" : "video");
      const play = () => { if (!isImage) video.play().catch(() => {}); };
      const pause = () => { if (!isImage) video.pause(); };
      video.src = source;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.setAttribute("aria-hidden", "true");
      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      } catch {
        container.append(video);
        play();
        dispose = pause;
        return;
      }
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      container.append(renderer.domElement);
      const scene = new THREE.Scene();
      const ratio = 16 / 9;
      const camera = new THREE.OrthographicCamera(
        (-ratio / 2) * 1.2,
        (ratio / 2) * 1.2,
        0.6,
        -0.6,
        0.1,
        10,
      );
      camera.position.z = 1;
      const geometry = new THREE.PlaneGeometry(ratio, 1, 32, 18);
      const original = geometry.attributes.position.array.slice();
      const texture = isImage ? new THREE.TextureLoader().load(source) : new THREE.VideoTexture(video);
      texture.colorSpace = THREE.SRGBColorSpace;
      const material = new THREE.MeshBasicMaterial({ map: texture });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      const resize = () =>
        renderer.setSize(
          container.clientWidth * 1.2,
          container.clientHeight * 1.2,
          false,
        );
      resize();
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);
      let visible = true,
        hover = 0,
        targetHover = 0,
        velocity = 0,
        frame;
      const visibility = new IntersectionObserver(
        (entries) => {
          visible = entries[0].isIntersecting;
          if (visible) play();
          else pause();
        },
        { rootMargin: "50% 0px" },
      );
      visibility.observe(container);
      const enter = () => {
          targetHover = 1;
        },
        leave = () => {
          targetHover = 0;
        };
      container.addEventListener("pointerenter", enter);
      container.addEventListener("pointerleave", leave);
      function render(now) {
        frame = requestAnimationFrame(render);
        if (!visible || document.hidden) return;
        hover += (targetHover - hover) * 0.05;
        velocity += (energy() - velocity) * 0.08;
        const amplitude = 0.06 * velocity + 0.02 * hover;
        mesh.scale.setScalar(1 + 0.025 * velocity);
        const positions = geometry.attributes.position,
          time = now / 1000;
        for (let i = 0; i < positions.count; i++) {
          const x = original[i * 3],
            y = original[i * 3 + 1];
          const nx = x / ratio,
            ny = y;
          const edge = Math.max(
            0,
            (Math.min(Math.hypot(nx, ny) / 0.7071, 1) - 0.15) / 0.85,
          );
          positions.setXY(
            i,
            x + edge * amplitude * Math.sin(3.2 * ny * Math.PI + 0.6 * time),
            y +
              edge *
                amplitude *
                Math.sin(3.2 * nx * Math.PI + 0.78 * time + 1.7),
          );
        }
        positions.needsUpdate = true;
        renderer.render(scene, camera);
      }
      frame = requestAnimationFrame(render);
      play();
      dispose = () => {
        cancelAnimationFrame(frame);
        resizeObserver.disconnect();
        visibility.disconnect();
        pause();
        video.removeAttribute("src");
        if (!isImage) video.load();
        geometry.dispose();
        material.dispose();
        texture.dispose();
        renderer.dispose();
        container.removeEventListener("pointerenter", enter);
        container.removeEventListener("pointerleave", leave);
      };
    },
    { rootMargin: "150% 0px" },
  );
  observer.observe(container);
  return () => {
    observer.disconnect();
    dispose();
  };
}
