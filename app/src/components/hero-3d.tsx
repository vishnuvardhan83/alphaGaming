import { useEffect, useRef, useState } from 'react';
import type { JSX } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Hero3D — rotating metallic AlphaQ "Q" emblem (Torus + diagonal tail).
 * Features RoomEnvironment reflections, electric-green rim lights, directional key light,
 * and mouse-tracking parallax response matching the alphaq-web visual.
 */
export function Hero3D(): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const host = containerRef.current;
    if (!host) return;

    try {
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl2') || probe.getContext('webgl');
      if (!gl) return;
    } catch {
      return;
    }

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const width = () => host.clientWidth || 1;
    const height = () => host.clientHeight || 1;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width(), height());
    renderer.setClearColor(0x000000, 0);

    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.pointerEvents = 'none';
    host.appendChild(canvas);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const camera = new THREE.PerspectiveCamera(38, width() / height(), 0.1, 100);
    camera.position.set(0, 0, 8.5);

    // ---- Build the metallic "Q": beveled ring + diagonal tail bar ----
    const emblem = new THREE.Group();
    const metal = new THREE.MeshStandardMaterial({
      color: 0x1ee07a,
      metalness: 0.95,
      roughness: 0.22,
      envMapIntensity: 1.35,
    });

    const ringGeo = new THREE.TorusGeometry(1.2, 0.36, 48, 120);
    const ring = new THREE.Mesh(ringGeo, metal);
    emblem.add(ring);

    const tailGeo = new THREE.BoxGeometry(0.35, 1.2, 0.35);
    const tail = new THREE.Mesh(tailGeo, metal);
    tail.position.set(0.82, -0.82, 0);
    tail.rotation.z = Math.PI / 4;
    emblem.add(tail);

    emblem.rotation.set(0.5, -0.6, 0.1);
    scene.add(emblem);

    // ---- Lights (green rim + white key for metallic sheen) ----
    scene.add(new THREE.AmbientLight(0x0c2a1c, 1.2));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(5, 6, 5);
    scene.add(key);

    const rimA = new THREE.PointLight(0x1ee07a, 60, 40);
    rimA.position.set(-6, 2, 3);
    scene.add(rimA);

    const rimB = new THREE.PointLight(0x6bffab, 40, 40);
    rimB.position.set(4, -4, 5);
    scene.add(rimB);

    setReady(true);

    let pointerX = 0;
    let pointerY = 0;
    let rafId = 0;
    let visible = true;

    const onPointer = (e: PointerEvent) => {
      pointerX = e.clientX / window.innerWidth - 0.5;
      pointerY = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    }, { threshold: 0.01 });
    io.observe(host);

    const ro = new ResizeObserver(() => {
      const w = width();
      const h = height();
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(host);

    const render = () => {
      rafId = requestAnimationFrame(render);
      if (!visible) return;
      if (!prefersReduced) {
        emblem.rotation.y += 0.0032;
        emblem.rotation.x += (-pointerY * 0.4 + 0.5 - emblem.rotation.x) * 0.05;
        emblem.position.x += (pointerX * 0.6 - emblem.position.x) * 0.05;
      }
      renderer.render(scene, camera);
    };
    render();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointer);
      io.disconnect();
      ro.disconnect();
      ringGeo.dispose();
      tailGeo.dispose();
      metal.dispose();
      pmrem.dispose();
      renderer.dispose();
      if (canvas.parentNode === host) host.removeChild(canvas);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="font-display text-8xl font-black text-primary/40 drop-shadow-[0_0_50px_rgba(30,224,122,0.4)]">
            Q
          </span>
        </div>
      )}
    </div>
  );
}

export default Hero3D;

