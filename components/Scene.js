"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Image, useGLTF, Environment, Lightformer, Billboard, Float, ScrollControls, useScroll, Sparkles, Text } from "@react-three/drei";
import * as THREE from "three";
import { useStore, products } from "../store";

// ---------------------------------------------------------------------------
// GEOMETRY — never changes between desktop and mobile.
// These are the original values the brand's aesthetic is built around.
// ---------------------------------------------------------------------------
const SPIRAL_RADIUS = 4.5;
const SPIRAL_ANGLE_STEP = 2.5;   // radians
const SPIRAL_Z_STEP = 6;         // world units between products
const PRODUCT_IMG_SCALE = 4.5;

// ---------------------------------------------------------------------------
// computeBaseZ
// The only place viewport dimensions inform camera behaviour.
// Answers: "how far back does the camera need to sit so the full spiral
// (radius = SPIRAL_RADIUS) fits within the horizontal frustum, with a 25%
// safety margin, given the current camera FOV and canvas aspect ratio?"
//
// On desktop (aspect ≈ 1.78, fov = 55): resolves to ≈ 6 → effectively the
// original value of 5 (max() keeps it there).
// On portrait mobile (aspect ≈ 0.46, fov = 55): resolves to ≈ 23-25,
// pulling the camera back so the wide corkscrew is fully in frame.
//
// Formula derivation:
//   halfHFov = atan( tan(halfVFov) × aspect )      [standard FOV conversion]
//   minZ = SPIRAL_RADIUS / tan(halfHFov)            [object just at frustum edge]
//   baseZ = minZ × 1.25                             [25% breathing room]
// ---------------------------------------------------------------------------
function computeBaseZ(camera, size) {
  const aspect = size.width / size.height;
  const halfVFovRad = THREE.MathUtils.degToRad(camera.fov / 2);
  const halfHFovRad = Math.atan(Math.tan(halfVFovRad) * aspect);
  return Math.max(5, (SPIRAL_RADIUS / Math.tan(halfHFovRad)) * 1.25);
}

// ---------------------------------------------------------------------------
// BACKGROUND
// ---------------------------------------------------------------------------
function BackgroundController() {
  const { scene } = useThree();
  const cream = new THREE.Color("#f6f3e6");
  useFrame(() => { scene.background = cream; });
  return null;
}

// ---------------------------------------------------------------------------
// SPACE DEBRIS
// ---------------------------------------------------------------------------
function SpaceDebris({ count = 15 }) {
  const [debris, setDebris] = useState([]);

  useEffect(() => {
    const textures = [
      '/assets/sketch_hand.png', '/assets/sketch_open.png', '/assets/sketch_stub.png',
      '/assets/sketch_text.png', '/assets/sketch_pool.png', '/assets/sketch_pack.png',
      '/assets/sketch_tray.png',
    ];
    setDebris(new Array(count).fill(0).map(() => ({
      x: (Math.random() - 0.5) * 40,
      y: (Math.random() - 0.5) * 40,
      z: -Math.random() * 40,
      scale: 2 + Math.random(),
      texture: textures[Math.floor(Math.random() * textures.length)],
    })));
  }, [count]);

  return (
    <group>
      {debris.map((item, i) => (
        <Float key={i} speed={0.5} rotationIntensity={0.5} floatIntensity={0.5}>
          <Billboard position={[item.x, item.y, item.z]}>
            <Image url={item.texture} scale={[item.scale, item.scale]} transparent opacity={0.6} color="#D9281E" />
          </Billboard>
        </Float>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// LOGO
//
// Browse / story — unchanged from desktop.
//
// Product mode, desktop — world-tracked near the selected product.
//
// Product mode, mobile — camera-relative top-centre.
//   The y-offset is derived from the camera's actual FOV so the logo always
//   sits at the same proportional height in the frame regardless of device:
//     topY = tan(halfVFov) × dist × 0.68   (68% toward the top edge)
//   No hardcoded pixel offsets; the geometry does the work.
// ---------------------------------------------------------------------------
function CentralLogo({ setStartAnim, startAnim }) {
  const { scene } = useGLTF("/assets/logo.glb");
  const { activeProduct, storyMode, setStoryMode } = useStore();
  const meshRef = useRef();
  const { camera } = useThree();
  const [hovered, setHover] = useState(false);

  const material = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#D9281E",
    roughness: 0.15,
    clearcoat: 1,
    metalness: 0.1,
    depthTest: false,
    depthWrite: false,
  }), []);

  scene.traverse((child) => {
    if (child.isMesh) {
      child.material = material;
      child.renderOrder = 999;
    }
  });

  useFrame((state) => {
    if (!meshRef.current) return;
    const mobile = state.size.width < 768;

    let targetPos = new THREE.Vector3(0, 0, -45);
    let targetScale = 8;
    let targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0));

    if (activeProduct) {
      if (mobile) {
        // Top-centre anchor: y derived from actual camera FOV so position is
        // always proportionally correct regardless of FOV or device height.
        const dist = 5;
        const halfVFovRad = THREE.MathUtils.degToRad(state.camera.fov / 2);
        const topY = Math.tan(halfVFovRad) * dist * 0.68;
        const offset = new THREE.Vector3(0, topY, -dist);
        offset.applyQuaternion(camera.quaternion);
        targetPos.copy(camera.position).add(offset);
        targetScale = 0.7;
        targetQuat.copy(camera.quaternion);
        targetQuat.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0)));
      } else {
        targetPos.set(
          activeProduct.position.x - 2.0,
          activeProduct.position.y + 3.0,
          activeProduct.position.z,
        );
        targetScale = 1.25;
        targetQuat.setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0));
      }
    } else if (storyMode) {
      const offset = new THREE.Vector3(-6, 3, -8);
      offset.applyQuaternion(camera.quaternion);
      targetPos.copy(camera.position).add(offset);
      targetScale = 1.25;
      targetQuat.copy(camera.quaternion);
      targetQuat.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0)));
    }

    meshRef.current.position.lerp(targetPos, 0.1);
    meshRef.current.scale.setScalar(
      THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, 0.1)
    );
    meshRef.current.quaternion.slerp(targetQuat, 0.1);

    if (!startAnim && hovered) meshRef.current.rotation.y += 0.01;
  });

  return (
    <primitive
      ref={meshRef}
      object={scene}
      scale={8}
      position={[0, 0, -45]}
      renderOrder={999}
      onClick={(e) => {
        e.stopPropagation();
        if (storyMode) setStoryMode(false);
        else if (!startAnim) setStartAnim(true);
      }}
      onPointerOver={() => { document.body.style.cursor = "pointer"; setHover(true); }}
      onPointerOut={() => { document.body.style.cursor = "auto"; setHover(false); }}
    />
  );
}

// ---------------------------------------------------------------------------
// OUR STORY ANCHOR
// Desktop: vertical text at x = -15, rotated 90°.
// Mobile:  x = -15 is geometrically off-screen on any portrait device
//          regardless of camera z. Repositioned to centred horizontal text
//          below the tunnel axis, 7 units ahead of the camera so it tracks
//          naturally as the user scrolls through the corkscrew.
// ---------------------------------------------------------------------------
function OurStoryAnchor() {
  const { setStoryMode, storyMode } = useStore();
  const [hovered, setHover] = useState(false);
  const textRef = useRef();
  const { size } = useThree();
  const isMobile = size.width < 768;

  useFrame((state) => {
    if (!textRef.current) return;
    const mobile = state.size.width < 768;

    if (storyMode) {
      textRef.current.scale.lerp(new THREE.Vector3(0, 0, 0), 0.1);
      return;
    }
    textRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);

    if (mobile) {
      textRef.current.position.x = 0;
      textRef.current.position.y = -1.8;
      textRef.current.position.z = THREE.MathUtils.lerp(
        textRef.current.position.z,
        state.camera.position.z - 7,
        0.1,
      );
    } else {
      textRef.current.position.x = -15;
      textRef.current.position.y = 0;
      textRef.current.position.z = THREE.MathUtils.lerp(
        textRef.current.position.z,
        state.camera.position.z - 20,
        0.1,
      );
    }
  });

  return (
    <Text
      key={`story-${isMobile}`}
      ref={textRef}
      font="/fonts/Fraunces.ttf"
      fontSize={isMobile ? 0.45 : 0.8}
      color="#D9281E"
      position={isMobile ? [0, -1.8, -10] : [-15, 0, -25]}
      rotation={isMobile ? [0, 0, 0] : [0, 0, Math.PI / 2]}
      anchorX="center"
      anchorY="middle"
      fillOpacity={hovered ? 1 : 0.8}
      onPointerOver={() => { document.body.style.cursor = "pointer"; setHover(true); }}
      onPointerOut={() => { document.body.style.cursor = "auto"; setHover(false); }}
      onClick={(e) => { e.stopPropagation(); setStoryMode(true); }}
    >
      {isMobile ? "our story." : "Our Story."}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// STORY ATMOSPHERE
// ---------------------------------------------------------------------------
function LiquidStory() {
  const { storyMode } = useStore();
  if (!storyMode) return null;
  return (
    <group position={[-60, 0, 0]}>
      <Sparkles count={40} scale={[20, 10, 10]} size={3} color="#D9281E" opacity={0.3} />
      <SpaceDebris count={15} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// VORTEX TUNNEL
// Spiral geometry is identical on every device — radius, angle, z-step, and
// image scale are all original desktop constants declared above.
// The camera (Rig + VortexTunnel intro) pulls back on narrow viewports via
// computeBaseZ so the corkscrew fits without touching any placement values.
// Sparkle/debris counts are halved on mobile for GPU headroom only.
// ---------------------------------------------------------------------------
function VortexTunnel({ showLogo, setIntroFinished, introFinished }) {
  const { setHoveredProduct, activeProduct, setActiveProduct, storyMode } = useStore();
  const [flyOut, setFlyOut] = useState(false);

  useFrame((state) => {
    if (!showLogo) {
      state.camera.position.z = -25;
      state.camera.lookAt(0, 0, -50);
      return;
    }
    if (!flyOut) { setFlyOut(true); return; }
    if (!introFinished) {
      // Target baseZ (not the hardcoded 5) so the intro lands at the right
      // viewing distance on every viewport size.
      const baseZ = computeBaseZ(state.camera, state.size);
      state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, baseZ, 0.01);
      state.camera.lookAt(0, 0, -50);
      if (state.camera.position.z > baseZ - 2) setIntroFinished(true);
    }
  });

  if (!flyOut) return null;

  // Sparkle/debris counts — reduced on mobile for performance, not aesthetics.
  const SparklesDebrisBlock = () => {
    const { size } = useThree();
    const mobile = size.width < 768;
    return (
      <>
        <Sparkles count={mobile ? 40 : 80} scale={[15, 15, 60]} size={mobile ? 3 : 4}
          speed={0.4} opacity={0.4} color="#D9281E" position={[0, 0, -20]} />
        <SpaceDebris count={mobile ? 10 : 21} />
        <OurStoryAnchor />
      </>
    );
  };

  return (
    <group>
      {!activeProduct && !storyMode && <SparklesDebrisBlock />}

      {products.map((product, i) => {
        if (storyMode) return null;
        if (activeProduct && activeProduct.id !== product.id) return null;

        // Original desktop spiral — untouched.
        const z = -i * SPIRAL_Z_STEP;
        const angle = i * SPIRAL_ANGLE_STEP;
        const x = Math.cos(angle) * SPIRAL_RADIUS;
        const y = Math.sin(angle) * SPIRAL_RADIUS;

        return (
          <group key={product.id}>
            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={1} floatingRange={[-0.3, 0.3]}>
              <Billboard position={[x, y, z]}>
                <Image
                  url={product.img}
                  scale={[PRODUCT_IMG_SCALE, PRODUCT_IMG_SCALE]}
                  transparent
                  onPointerOver={() => { document.body.style.cursor = "pointer"; setHoveredProduct(product); }}
                  onPointerOut={() => { document.body.style.cursor = "auto"; setHoveredProduct(null); }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveProduct({ ...product, position: { x, y, z } });
                  }}
                />
                {activeProduct && activeProduct.id === product.id && (
                  <Image
                    url={product.img}
                    scale={[PRODUCT_IMG_SCALE, PRODUCT_IMG_SCALE]}
                    transparent opacity={0.3} color="black" position={[0.4, -0.4, -0.1]}
                  />
                )}
              </Billboard>
            </Float>
          </group>
        );
      })}
    </group>
  );
}

// ---------------------------------------------------------------------------
// RIG
//
// Browse mode:
//   Desktop — original: targetZ = 5 − (offset × 45).
//   Mobile  — baseZ replaces 5, and total travel = baseZ + 40 so the
//             camera still reaches z ≈ −40 (past all 7 products at z = −36).
//             Same scroll pages, more world distance: the corkscrew unspools
//             at a pace that matches the pulled-back perspective.
//
// Product mode:
//   Desktop — shift right by 4 to clear the 42vw panel.
//   Mobile  — stay centred; the bottom sheet doesn't need horizontal clearance.
//
// Parallax:
//   Reduced on mobile so touch-mapped mouse.x (which jumps from 0 at lift-off)
//   doesn't cause jarring camera snaps.
// ---------------------------------------------------------------------------
function Rig({ introFinished }) {
  const { activeProduct, storyMode } = useStore();
  const scroll = useScroll();
  const vec = new THREE.Vector3();
  const lookAtTarget = new THREE.Vector3();

  useFrame((state) => {
    if (!introFinished) return;
    const mobile = state.size.width < 768;

    if (activeProduct) {
      const { x: px, y: py, z: pz } = activeProduct.position;
      if (mobile) {
        state.camera.position.lerp(vec.set(px, py, pz + 5), 0.06);
        lookAtTarget.set(px, py, pz);
      } else {
        state.camera.position.lerp(vec.set(px + 4, py, pz + 8), 0.04);
        lookAtTarget.set(px + 4, py, pz);
      }
      state.camera.lookAt(lookAtTarget);

    } else if (storyMode) {
      state.camera.position.lerp(vec.set(-60, 0, 15), 0.05);
      state.camera.lookAt(-60, 0, 0);
      if (!mobile) {
        state.camera.position.x += state.mouse.x * 0.02;
        state.camera.position.y += state.mouse.y * 0.02;
      }

    } else {
      const baseZ = computeBaseZ(state.camera, state.size);
      // Travel distance grows with baseZ so the camera always reaches z ≈ −40,
      // keeping the last product (z = −36) reachable regardless of start point.
      const travel = baseZ + 40;
      const targetZ = baseZ - scroll.offset * travel;
      state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.1);

      const parallax = mobile ? 0.4 : 2;
      state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, state.mouse.x * parallax, 0.05);
      state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, state.mouse.y * parallax, 0.05);
      state.camera.lookAt(0, 0, -50);
      state.camera.rotation.z = scroll.offset * (mobile ? 0.06 : 0.2);
    }
  });

  return null;
}

// ---------------------------------------------------------------------------
// MAIN EXPORT
// ---------------------------------------------------------------------------
export default function Scene({ startAnim, setStartAnim }) {
  const [introFinished, setIntroFinished] = useState(false);
  const { activeProduct, setActiveProduct } = useStore();

  return (
    <Canvas
      camera={{ position: [0, 0, -25], fov: 55 }}
      style={{ position: 'absolute', inset: 0 }}
      onPointerMissed={() => { if (activeProduct) setActiveProduct(null); }}
    >
      <BackgroundController />

      <ambientLight intensity={2} />
      <spotLight position={[10, 10, 20]} intensity={80} angle={0.5} />

      <Environment resolution={256} background={false}>
        <group rotation={[-Math.PI / 4, -Math.PI / 4, 0]}>
          <Lightformer intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
          <Lightformer intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[10, 2, 1]} />
          <Lightformer intensity={2} rotation-y={-Math.PI / 2} position={[5, 1, -1]} scale={[10, 2, 1]} />
          <Lightformer intensity={2} rotation-y={-Math.PI / 2} position={[0, 0, 5]} scale={[10, 2, 1]} />
        </group>
      </Environment>

      <ScrollControls pages={6} damping={0.2} enabled={introFinished && !activeProduct}>
        <Rig introFinished={introFinished} />
        <VortexTunnel showLogo={startAnim} setIntroFinished={setIntroFinished} introFinished={introFinished} />
        <LiquidStory />
        <CentralLogo setStartAnim={setStartAnim} startAnim={startAnim} />
      </ScrollControls>
    </Canvas>
  );
}
