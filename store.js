import { create } from 'zustand'

export const useStore = create((set) => ({
  hoveredProduct: null,
  setHoveredProduct: (product) => set({ hoveredProduct: product }),
  
  activeProduct: null,
  setActiveProduct: (product) => set({ activeProduct: product, storyMode: false }), // Reset story mode when product is clicked
  
  // --- NEW: Story Mode State ---
  storyMode: false,
  setStoryMode: (isActive) => set({ storyMode: isActive, activeProduct: null }), // Reset product when story is clicked
}))

export const products = [
  { id: 1, name: "The Morning After", img: "/assets/egg.png", link: "https://google.com", description: "For the ones who wake up and do it anyway. A little rough around the edges. Exactly how we like it." },
  { id: 2, name: "The Friday Night", img: "/assets/pizza.png", link: "https://google.com", description: "No plans. No apologies. Just the kind of night that deserves its own ashtray." },
  { id: 3, name: "The Chatterbox", img: "/assets/teeth.png", link: "https://google.com", description: "Talks a big game. Always shows up. The loudest one in a quiet room." },
  { id: 4, name: "The Predator", img: "/assets/shark.png", link: "https://google.com", description: "Calculated. Deliberate. Made for the ones who move in silence and strike clean." },
  { id: 5, name: "The Guardian", img: "/assets/frog.png", link: "https://google.com", description: "Patient, unbothered, watching everything. The one you never see coming." },
  { id: 6, name: "The Irony", img: "/assets/warning.png", link: "https://google.com", description: "Warns everyone else. Never listens to itself. A monument to beautiful contradiction." },
  { id: 7, name: "The Original", img: "/assets/triangle.png", link: "https://google.com", description: "Three sides. Zero compromises. The one that started the whole stupid, perfect thing." },
]