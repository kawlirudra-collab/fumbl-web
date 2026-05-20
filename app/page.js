"use client";
import { useState } from "react";
import Scene from "../components/Scene";
import ProductUI from "../components/ProductUI";
import StoryUI from "../components/StoryUI";

export default function Home() {
  const [startAnim, setStartAnim] = useState(true);

  return (
    <main style={{ position: 'fixed', inset: 0, backgroundColor: '#050505', overflow: 'hidden' }}>

      {/* 3D Scene Layer — fills the fixed parent, giving R3F a stable measured box */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
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