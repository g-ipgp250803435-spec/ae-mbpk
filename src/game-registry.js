/**
 * ae-MBPK Game Registry
 * Single source of truth for catalog metadata. Do not put learner data or secrets here.
 */
export const GAME_REGISTRY = Object.freeze([
  {
    id: "misi-berdikari",
    title: { ms: "Misi Berdikari", en: "Independence Quest" },
    category: "life",
    tag: { ms: "Pengurusan diri", en: "Life skills" },
    description: { ms: "Latih rutin harian melalui misi interaktif dan langkah visual.", en: "Practice daily routines through interactive missions and visual steps." },
    icon: "target",
    color: "green",
    status: "live",
    route: "/misi-berdikari.html",
    estimatedMinutes: "5–10 min",
    ageBand: ["7-9", "10-12", "13+"],
    skillCodes: ["self-management", "daily-routines"],
    accessibility: ["visual-steps", "no-timer", "keyboard"]
  },
  {
    id: "kataquest",
    title: { ms: "KataQuest", en: "KataQuest" },
    category: "literacy",
    tag: { ms: "Literasi", en: "Literacy" },
    description: { ms: "Kenal suku kata, bina perkataan dan dengar sebutan melalui misi literasi interaktif.", en: "Recognise syllables, build words and listen to pronunciation through interactive literacy missions." },
    icon: "book-open",
    color: "purple",
    status: "live",
    route: "/kataquest.html",
    estimatedMinutes: "5–8 min",
    ageBand: ["7-9", "10-12"],
    skillCodes: ["syllable-recognition", "word-building", "word-reading"],
    accessibility: ["visual-support", "audio-optional"]
  },
  {
    id: "nombor-ninja",
    title: { ms: "NomborNinja", en: "Number Ninja" },
    category: "math",
    tag: { ms: "Numerasi", en: "Numeracy" },
    description: { ms: "Kira objek, banding jumlah dan latih tambah serta tolak dengan manipulatif digital.", en: "Count objects, compare quantities and practise addition and subtraction with digital manipulatives." },
    icon: "chart",
    color: "blue",
    status: "live",
    route: "/nombor-ninja.html",
    estimatedMinutes: "5–8 min",
    ageBand: ["7-9", "10-12"],
    skillCodes: ["number-recognition", "counting", "quantity-comparison", "addition", "subtraction"],
    accessibility: ["visual-support", "audio-optional"]
  },
  {
    id: "dunia-emosi",
    title: { ms: "Dunia Emosi", en: "Emotion World" },
    category: "social",
    tag: { ms: "Sosial dan emosi", en: "Social & emotional" },
    description: { ms: "Kenali emosi, pilihan respons dan strategi menenangkan diri.", en: "Explore emotions, response choices and calming strategies." },
    icon: "heart",
    color: "rose",
    status: "live",
    route: "/dunia-emosi.html",
    estimatedMinutes: "4–8 min",
    ageBand: ["7-9", "10-12", "13+"],
    skillCodes: ["emotion-vocabulary", "self-regulation"],
    accessibility: ["low-stimulation", "no-timer"]
  },
  {
    id: "langkah-rutin",
    title: { ms: "Langkah Demi Langkah", en: "Step by Step" },
    category: "life",
    tag: { ms: "Urutan rutin", en: "Routine sequencing" },
    description: { ms: "Susun langkah aktiviti dan bina rutin yang boleh dijangka.", en: "Sequence activities and build predictable routines." },
    icon: "target",
    color: "gold",
    status: "live",
    route: "/langkah-demi-langkah.html",
    estimatedMinutes: "5–8 min",
    ageBand: ["7-9", "10-12"],
    skillCodes: ["sequencing", "daily-routines"],
    accessibility: ["visual-steps", "no-timer"]
  },
  {
    id: "tangan-berbicara",
    title: { ms: "Tangan Berbicara", en: "Hands Speak" },
    category: "communication",
    tag: { ms: "Komunikasi · BIM", en: "Communication · MySL" },
    description: { ms: "Pengenalan Bahasa Isyarat Malaysia melalui kandungan yang disemak pengajar kompeten.", en: "An introduction to Malaysian Sign Language using content reviewed by a competent instructor." },
    icon: "hand",
    color: "teal",
    status: "live",
    route: "/tangan-berbicara.html",
    estimatedMinutes: "5–10 min",
    ageBand: ["7-9", "10-12", "13+"],
    skillCodes: ["my-sign-language"],
    accessibility: ["visual-demonstration"]
  },
  {
    id: "peneroka-braille",
    title: { ms: "Peneroka Braille", en: "Braille Explorer" },
    category: "communication",
    tag: { ms: "Aksesibiliti · Braille", en: "Accessibility · Braille" },
    description: { ms: "Kenali huruf a hingga j melalui sel enam titik dan aktiviti padanan.", en: "Explore letters a to j with six-dot cells and matching practice." },
    icon: "book-open",
    color: "purple",
    status: "live",
    route: "/braille.html",
    estimatedMinutes: "5–8 min",
    ageBand: ["7-9", "10-12", "13+"],
    skillCodes: ["braille-cell-recognition"],
    accessibility: ["keyboard", "audio-optional", "high-contrast"]
  },
  {
    id: "papan-komunikasi",
    title: { ms: "Papan Komunikasi Saya", en: "My Communication Board" },
    category: "communication",
    tag: { ms: "Komunikasi visual", en: "Visual communication" },
    description: { ms: "Pilih mesej visual untuk menyatakan keperluan dan pilihan.", en: "Select visual messages to express needs and choices." },
    icon: "hand",
    color: "teal",
    status: "live",
    route: "/communication-board.html",
    estimatedMinutes: "2–5 min",
    ageBand: ["7-9", "10-12", "13+"],
    skillCodes: ["functional-communication"],
    accessibility: ["large-targets", "audio-optional", "keyboard"]
  }
]);

export const GAME_CATEGORIES = Object.freeze([
  { id: "all", label: { ms: "Semua kemahiran", en: "All skills" } },
  { id: "life", label: { ms: "Pengurusan diri", en: "Life skills" } },
  { id: "literacy", label: { ms: "Literasi", en: "Literacy" } },
  { id: "math", label: { ms: "Numerasi", en: "Numeracy" } },
  { id: "social", label: { ms: "Sosial dan emosi", en: "Social & emotional" } },
  { id: "communication", label: { ms: "Komunikasi dan akses", en: "Communication & access" } }
]);

export function getGameById(id) {
  return GAME_REGISTRY.find(game => game.id === id) || null;
}

export function getAvailableGames() {
  return GAME_REGISTRY.filter(game => game.status === "live" && Boolean(game.route));
}
