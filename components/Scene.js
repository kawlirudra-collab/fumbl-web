"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Image, useGLTF, Environment, Lightformer, Billboard, Float, ScrollControls, useScroll, Sparkles, Text } from "@react-three/drei";
import * as THREE from "three";
import { useStore, products } from "../store";

// ---------------------------------------------------------------------------
// CAMERA SETUP — widens FOV on portrait mobile so the vertical frame
// doesn't collapse the horizontal field of view below ~27°.
// ---------------------------------------------------------------------------
function CameraSetup() {
  const { camera, size } = useThree();
  useEffect(() => {
    camera.fov = size.width < 768 ? 75 : 55;
    camera.updateProjectionMatrix();
  }, [camera, size.width]);
  return null;
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
      '/assets/sketch_tray.png'
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
// On desktop – product mode: tracks the selected product in world space.
// On mobile  – product mode: shrinks to a camera-relative top-left HUD so
//              it doesn't fight the bottom-sheet and stays perfectly readable.
// Story mode on both: same camera-relative HUD behaviour (unchanged).
// ---------------------------------------------------------------------------
function CentralLogo({ setStartAnim, startAnim }) {
  const { scene } = useGLTF("/assets/logo.glb");
  const { activeProduct, storyMode, setStoryMode } = useStore();
  const meshRef = useRef();
  const { camera, size } = useThree();
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
        // Small brand mark anchored to top-left of the camera frame
        const offset = new THREE.Vector3(-2.2, 1.6, -5);
        offset.applyQuaternion(camera.quaternion);
        targetPos.copy(camera.position).add(offset);
        targetScale = 0.65;
        targetQuat.copy(camera.quaternion);
        targetQuat.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0)));
      } else {
        targetPos.set(activeProduct.position.x - 2.0, activeProduct.position.y + 3.0, activeProduct.position.z);
        targetScale = 1.25;
        targetQuat.setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0));
      }
    } else if (storyMode) {
      const offset = new THREE.Vector3(mobile ? -3 : -6, mobile ? 2 : 3, -8);
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
// Desktop: vertical text at x=-15 (left of the tunnel), rotated 90°.
// Mobile:  horizontal text centred just below the tunnel axis — stays in
//          the narrow portrait FOV and is easy to tap.
// ---------------------------------------------------------------------------
function OurStoryAnchor() {
  const { setStoryMode, storyMode } = useStore();
  const [hovered, setHover] = useState(false);
  const textRef = useRef();

  useFrame((state) => {
    if (!textRef.current) return;
    const mobile = state.size.width < 768;

    if (storyMode) {
      textRef.current.scale.lerp(new THREE.Vector3(0, 0, 0), 0.1);
      return;
    }

    textRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);

    if (mobile) {
      // Float just below the tunnel centre, close to camera
      textRef.current.position.x = 0;
      textRef.current.position.y = -1.8;
      const targetZ = state.camera.position.z - 7;
      textRef.current.position.z = THREE.MathUtils.lerp(textRef.current.position.z, targetZ, 0.1);
    } else {
      textRef.current.position.x = -15;
      textRef.current.position.y = 0;
      const targetZ = state.camera.position.z - 20;
      textRef.current.position.z = THREE.MathUtils.lerp(textRef.current.position.z, targetZ, 0.1);
    }
  });

  // key forces a remount when layout axis flips so rotation prop takes effect
  const { size } = useThree();
  const isMobile = size.width < 768;

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
// Product spiral: desktop radius=4.5 fills the wide frame.
//                mobile  radius=1.2 keeps products inside the narrow ~27° HFOV.
// Image scale reduced slightly on mobile so each billboard fits well.
// Sparkles / debris halved on mobile for GPU headroom.
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
      state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, 5, 0.01);
      state.camera.lookAt(0, 0, -50);
      if (state.camera.position.z > 3) setIntroFinished(true);
    }
  });

  if (!flyOut) return null;

  return (
    <group>
      {!activeProduct && !storyMode && (
        <SparklesAndDebris />
      )}

      {products.map((product, i) => {
        if (storyMode) return null;
        if (activeProduct && activeProduct.id !== product.id) return null;

        const z = -i * 6;
        const angle = i * 2.5;

        return (
          <ProductBillboard
            key={product.id}
            product={product}
            angle={angle}
            z={z}
            onSelect={setActiveProduct}
            onHover={setHoveredProduct}
            activeProduct={activeProduct}
          />
        );
      })}
    </group>
  );
}

// Pulled out so it can read size inside the Canvas context
function SparklesAndDebris() {
  const { size } = useThree();
  const isMobile = size.width < 768;
  return (
    <>
      <Sparkles
        count={isMobile ? 40 : 80}
        scale={[15, 15, 60]}
        size={isMobile ? 3 : 4}
        speed={0.4}
        opacity={0.4}
        color="#D9281E"
        position={[0, 0, -20]}
      />
      <SpaceDebris count={isMobile ? 8 : 21} />
      <OurStoryAnchor />
    </>
  );
}

function ProductBillboard({ product, angle, z, onSelect, onHover, activeProduct }) {
  const { size } = useThree();
  const isMobile = size.width < 768;
  const radius = isMobile ? 1.2 : 4.5;
  const imgScale = isMobile ? 3.2 : 4.5;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;

  return (
    <group>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={1} floatingRange={[-0.3, 0.3]}>
        <Billboard position={[x, y, z]}>
          <Image
            url={product.img}
            scale={[imgScale, imgScale]}
            transparent
            onPointerOver={() => { document.body.style.cursor = "pointer"; onHover(product); }}
            onPointerOut={() => { document.body.style.cursor = "auto"; onHover(null); }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect({ ...product, position: { x, y, z } });
            }}
          />
          {activeProduct && activeProduct.id === product.id && (
            <Image
              url={product.img}
              scale={[imgScale, imgScale]}
              transparent
              opacity={0.3}
              color="black"
              position={[0.4, -0.4, -0.1]}
            />
          )}
        </Billboard>
      </Float>
    </group>
  );
}

// ---------------------------------------------------------------------------
// RIG
// Desktop product mode: camera shifts right (px+4) to clear the 42vw panel.
// Mobile  product mode: camera stays centred (px) — product is front-and-
//   centre behind the translucent bottom sheet.
// Mouse parallax and barrel roll both reduced on mobile — on touch the
// mouse vector is 0 until contact, making large values feel like jitter.
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
        // Centred approach: product stays dead-centre, closer z for drama
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
        state.camera.position.x += (state.mouse.x * 0.02);
        state.camera.position.y += (state.mouse.y * 0.02);
      }

    } else {
      const targetZ = 5 - (scroll.offset * 45);
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
      <CameraSetup />
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
