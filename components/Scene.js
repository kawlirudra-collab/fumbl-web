"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Image, useGLTF, Environment, Lightformer, Billboard, Float, ScrollControls, useScroll, Sparkles, Text } from "@react-three/drei";
import * as THREE from "three";
import { useStore, products } from "../store";

// --- 1. (Burn overlay removed — zoom-out is the intro) ---

// --- 2. BACKGROUND CONTROLLER ---
function BackgroundController() {
  const { scene } = useThree();
  const cream = new THREE.Color("#f6f3e6");

  useFrame(() => {
    scene.background = cream;
  });
  return null;
}

// --- 3. SPACE DEBRIS ---
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
      rotation: Math.random() * Math.PI,
      scale: 2 + Math.random(),
      texture: textures[Math.floor(Math.random() * textures.length)]
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

// --- 4. THE LOGO ---
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
    depthTest: false, // CRITICAL: Always render on top
    depthWrite: false
  }), []);

  // Apply material and disable depth test on all meshes
  scene.traverse((child) => {
    if (child.isMesh) {
      child.material = material;
      child.renderOrder = 999;
    }
  });

  useFrame((state) => {
    if (!meshRef.current) return;

    // Default position (Intro)
    let targetPos = new THREE.Vector3(0, 0, -45);
    // Logo is always visible now. REMOVED showLogo logic.
    let targetScale = 8;
    let targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0));

    // Position during Product Detail
    if (activeProduct) {
      targetPos.set(activeProduct.position.x - 2.0, activeProduct.position.y + 3.0, activeProduct.position.z);
      targetScale = 1.25;
      targetQuat.setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0));
    }
    // Position during Story Mode (HUD - Top Left)
    else if (storyMode) {
      const offset = new THREE.Vector3(-6, 3, -8);
      offset.applyQuaternion(camera.quaternion);
      targetPos.copy(camera.position).add(offset);
      targetScale = 1.25;
      targetQuat.copy(camera.quaternion);
      targetQuat.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0)));
    }

    meshRef.current.position.lerp(targetPos, 0.1);
    const currentScale = meshRef.current.scale.x;
    meshRef.current.scale.setScalar(THREE.MathUtils.lerp(currentScale, targetScale, 0.1));

    if (storyMode) {
      meshRef.current.quaternion.slerp(targetQuat, 0.1);
    } else {
      meshRef.current.quaternion.slerp(targetQuat, 0.1);
    }

    if (!startAnim && hovered) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <primitive
      ref={meshRef}
      object={scene}
      scale={8}
      position={[0, 0, -45]}
      renderOrder={999} // Force render on top
      onClick={(e) => {
        e.stopPropagation();
        if (storyMode) {
          setStoryMode(false);
        } else if (!startAnim) {
          setStartAnim(true);
        }
      }}
      onPointerOver={() => {
        document.body.style.cursor = "pointer";
        setHover(true);
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
        setHover(false);
      }}
    />
  );
}

// --- 5. OUR STORY ANCHOR ---
function OurStoryAnchor() {
  const { setStoryMode, storyMode } = useStore();
  const [hovered, setHover] = useState(false);
  const textRef = useRef();

  useFrame((state) => {
    if (!textRef.current) return;

    if (storyMode) {
      textRef.current.scale.lerp(new THREE.Vector3(0, 0, 0), 0.1);
    } else {
      textRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      textRef.current.position.x = -15;
      textRef.current.position.y = 0;
      const targetZ = state.camera.position.z - 20;
      textRef.current.position.z = THREE.MathUtils.lerp(textRef.current.position.z, targetZ, 0.1);
    }
  });

  return (
    <Text
      ref={textRef}
      font="/fonts/Fraunces.ttf"
      fontSize={0.8}
      color="#D9281E"
      position={[-15, 0, -25]}
      rotation={[0, 0, Math.PI / 2]}
      anchorX="center"
      anchorY="middle"
      onPointerOver={() => { document.body.style.cursor = "pointer"; setHover(true); }}
      onPointerOut={() => { document.body.style.cursor = "auto"; setHover(false); }}
      onClick={(e) => { e.stopPropagation(); setStoryMode(true); }}
      fillOpacity={hovered ? 1 : 0.8}
    >
      Our Story.
    </Text>
  );
}

// --- 6. STORY ATMOSPHERE — glass & text handled by HTML StoryUI overlay ---
function LiquidStory() {
  const { storyMode } = useStore();
  if (!storyMode) return null;

  return (
    <group position={[-60, 0, 0]}>
      <Sparkles count={40} scale={[20, 10, 10]} size={3} color="#D9281E" opacity={0.3} />
      <SpaceDebris count={25} />
    </group>
  );
}

// --- 8. VORTEX TUNNEL ---
function VortexTunnel({ showLogo, setIntroFinished, introFinished }) {
  const { setHoveredProduct, activeProduct, setActiveProduct, storyMode } = useStore();
  const [flyOut, setFlyOut] = useState(false);

  useFrame((state) => {
    if (!showLogo) {
      state.camera.position.z = -25;
      state.camera.lookAt(0, 0, -50);
      return;
    }
    if (!flyOut) {
      // Start flyout immediately when animation starts
      setFlyOut(true);
      return;
    }
    if (!introFinished) {
      state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, 5, 0.01);
      state.camera.lookAt(0, 0, -50);
      // Self-complete: once the camera is near its destination, hand off to Rig
      if (state.camera.position.z > 3) setIntroFinished(true);
      return;
    }
  });

  if (!flyOut) return null;

  return (
    <group>
      {!activeProduct && !storyMode && (
        <>
          <Sparkles count={80} scale={[15, 15, 60]} size={4} speed={0.4} opacity={0.4} color="#D9281E" position={[0, 0, -20]} />
          <SpaceDebris count={21} />
          <OurStoryAnchor />
        </>
      )}

      {products.map((product, i) => {
        if (storyMode) return null;
        if (activeProduct && activeProduct.id !== product.id) return null;

        const z = -i * 6;
        const angle = i * 2.5;
        const radius = 4.5;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return (
          <group key={product.id}>
            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={1} floatingRange={[-0.3, 0.3]}>
              <Billboard position={[x, y, z]}>
                <Image
                  url={product.img} scale={[4.5, 4.5]} transparent
                  onPointerOver={() => { document.body.style.cursor = "pointer"; setHoveredProduct(product); }}
                  onPointerOut={() => { document.body.style.cursor = "auto"; setHoveredProduct(null); }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveProduct({ ...product, position: { x, y, z } });
                  }}
                />
                {activeProduct && activeProduct.id === product.id && (
                  <Image
                    url={product.img} scale={[4.5, 4.5]} transparent opacity={0.3} color="black" position={[0.4, -0.4, -0.1]}
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

// --- 9. RIG ---
function Rig({ introFinished }) {
  const { camera, mouse } = useThree();
  const { activeProduct, storyMode } = useStore();
  const scroll = useScroll();
  const vec = new THREE.Vector3();
  const lookAtTarget = new THREE.Vector3();

  useFrame((state, delta) => {
    if (!introFinished) return;

    if (activeProduct) {
      const px = activeProduct.position.x;
      const py = activeProduct.position.y;
      const pz = activeProduct.position.z;
      state.camera.position.lerp(vec.set(px + 4, py, pz + 8), 0.04);
      lookAtTarget.set(px + 4, py, pz);
      state.camera.lookAt(lookAtTarget);

    } else if (storyMode) {
      state.camera.position.lerp(vec.set(-60, 0, 15), 0.05);
      state.camera.lookAt(-60, 0, 0);
      state.camera.position.x += (mouse.x * 0.02);
      state.camera.position.y += (mouse.y * 0.02);

    } else {
      const targetZ = 5 - (scroll.offset * 45);
      state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.1);
      state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, mouse.x * 2, 0.05);
      state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, mouse.y * 2, 0.05);
      state.camera.lookAt(0, 0, -50);
      state.camera.rotation.z = scroll.offset * 0.2;
    }
  });
  return null;
}

// --- MAIN EXPORT ---
export default function Scene({ startAnim, setStartAnim }) {
  // Removed showLogo state. Logo is always visible.
  const [introFinished, setIntroFinished] = useState(false);
  const { activeProduct, setActiveProduct, setStoryMode, storyMode } = useStore();

  const handleMissed = () => {
    if (activeProduct) setActiveProduct(null);
  };

  return (
    <Canvas
      camera={{ position: [0, 0, -25], fov: 55 }}
      style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0 }}
      onPointerMissed={handleMissed}
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