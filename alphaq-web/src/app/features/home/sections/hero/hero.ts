import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef,
  NgZone, OnDestroy, signal, viewChild,
} from '@angular/core';
import { inject } from '@angular/core';
import { BRAND } from '../../../../core/content';
import { AvailabilityStripService } from '../../../../core/booking/availability-strip.service';

/**
 * Premium 3D hero — a rotating metallic AlphaQ "Q" emblem (blueprint §03).
 *
 * 3D is an *enhancement*, never a dependency: Three.js is dynamically imported
 * (its own chunk) and the whole scene is wrapped in guards. If WebGL is missing,
 * the screen is small, reduced-motion is requested, or anything throws, the
 * static CSS fallback remains and the hero + CTAs work perfectly.
 */
@Component({
  selector: 'aq-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero implements AfterViewInit, OnDestroy {
  private readonly stage = viewChild.required<ElementRef<HTMLDivElement>>('stage');

  protected readonly brand = BRAND;
  protected readonly strip = inject(AvailabilityStripService);
  protected readonly ready3d = signal(false);

  private cleanup: (() => void) | null = null;

  constructor(private readonly zone: NgZone) {}

  ngAfterViewInit(): void {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const small = window.matchMedia('(max-width: 767px)').matches;
    if (reduce || small || !this.hasWebGL()) return; // keep static fallback

    // Run outside Angular so the render loop never triggers change detection.
    this.zone.runOutsideAngular(() => {
      this.initThree().catch(() => this.ready3d.set(false));
    });
  }

  private hasWebGL(): boolean {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch { return false; }
  }

  private async initThree(): Promise<void> {
    const THREE = await import('three');
    const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');

    const host = this.stage().nativeElement;
    const width = () => host.clientWidth;
    const height = () => host.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width(), height());
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const camera = new THREE.PerspectiveCamera(38, width() / height(), 0.1, 100);
    camera.position.set(0, 0, 7.4);

    // ---- Build the metallic "Q": a beveled ring + a diagonal tail bar ----
    const emblem = new THREE.Group();
    const metal = new THREE.MeshStandardMaterial({
      color: 0x1ee07a, metalness: 1, roughness: 0.22, envMapIntensity: 1.35,
    });

    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.52, 48, 120), metal);
    emblem.add(ring);

    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.7, 0.5), metal);
    tail.position.set(1.15, -1.15, 0);
    tail.rotation.z = Math.PI / 4;
    emblem.add(tail);

    emblem.rotation.set(0.5, -0.6, 0.1);
    scene.add(emblem);

    // ---- Lights (green rim + white key for the metallic sheen) ----
    scene.add(new THREE.AmbientLight(0x0c2a1c, 1.2));
    const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(5, 6, 5); scene.add(key);
    const rimA = new THREE.PointLight(0x1ee07a, 60, 40); rimA.position.set(-6, 2, 3); scene.add(rimA);
    const rimB = new THREE.PointLight(0x6bffab, 40, 40); rimB.position.set(4, -4, 5); scene.add(rimB);

    this.ready3d.set(true);

    // ---- Interaction + loop ----
    let pointerX = 0, pointerY = 0, raf = 0, visible = true;
    const onPointer = (e: PointerEvent) => {
      pointerX = (e.clientX / window.innerWidth - 0.5);
      pointerY = (e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.01 });
    io.observe(host);

    const ro = new ResizeObserver(() => {
      renderer.setSize(width(), height());
      camera.aspect = width() / height();
      camera.updateProjectionMatrix();
    });
    ro.observe(host);

    const render = () => {
      raf = requestAnimationFrame(render);
      if (!visible) return;
      emblem.rotation.y += 0.0032;
      emblem.rotation.x += ((-pointerY * 0.4 + 0.5) - emblem.rotation.x) * 0.05;
      emblem.position.x += ((pointerX * 0.6) - emblem.position.x) * 0.05;
      renderer.render(scene, camera);
    };
    render();

    this.cleanup = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointer);
      io.disconnect(); ro.disconnect();
      ring.geometry.dispose(); tail.geometry.dispose(); metal.dispose();
      pmrem.dispose(); renderer.dispose();
      renderer.domElement.remove();
    };
  }

  ngOnDestroy(): void { this.cleanup?.(); }
}
