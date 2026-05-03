"use client";
import { useState } from "react";
import Scene from "../components/Scene";
import ProductUI from "../components/ProductUI";
import StoryUI from "../components/StoryUI";

export default function Home() {
  const [startAnim, setStartAnim] = useState(true);

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative', backgroundColor: '#050505', overflow: 'hidden' }}>

      {/* 3D Scene Layer */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
        <Scene startAnim={startAnim} setStartAnim={setStartAnim} />
      </div>

      {/* HTML UI Layer — pointer-events:none so canvas stays fully interactive */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
        <ProductUI />
        <StoryUI />
      </div>

    </main>
  );
}