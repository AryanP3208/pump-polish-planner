import * as THREE from "three";

function makeCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");
  return [canvas, ctx];
}

function finalizeColorTexture(
  canvas: HTMLCanvasElement,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  if (repeatX > 1 || repeatY > 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface StationTextureSet {
  asphalt: THREE.CanvasTexture;
  concrete: THREE.CanvasTexture;
  lcdTotalizer: THREE.CanvasTexture;
  mediaScreen: THREE.CanvasTexture;
  octaneButtons: THREE.CanvasTexture;
  upperPromoCard: THREE.CanvasTexture;
  lowerStripe: THREE.CanvasTexture;
  storeBrick: THREE.CanvasTexture;
  storeSign: THREE.CanvasTexture;
  dispose: () => void;
}

export function createStationTextures(): StationTextureSet {
  // 1. Weathered dark asphalt perimeter road/lot
  const [aCanvas, aCtx] = makeCanvas(512, 512);
  aCtx.fillStyle = "#595c60";
  aCtx.fillRect(0, 0, 512, 512);
  const randA = mulberry32(401);
  for (let i = 0; i < 16000; i++) {
    const x = randA() * 512;
    const y = randA() * 512;
    const v = Math.floor(72 + randA() * 44);
    aCtx.fillStyle = `rgb(${v + 2},${v + 1},${v})`;
    aCtx.fillRect(x, y, randA() > 0.7 ? 2 : 1, randA() > 0.7 ? 2 : 1);
  }
  const asphalt = finalizeColorTexture(aCanvas, 10, 10);

  // 2. Warm weathered tan-gray forecourt concrete (matches reference photos)
  const [cCanvas, cCtx] = makeCanvas(512, 512);
  cCtx.fillStyle = "#c8c2b6";
  cCtx.fillRect(0, 0, 512, 512);
  const randC = mulberry32(812);
  for (let i = 0; i < 12000; i++) {
    const x = randC() * 512;
    const y = randC() * 512;
    const v = Math.floor(170 + randC() * 42);
    cCtx.fillStyle = `rgba(${v + 4},${v},${v - 8},0.5)`;
    cCtx.fillRect(x, y, randC() > 0.75 ? 3 : 2, 2);
  }
  // Subtle realistic forecourt grime/oil speckles near fueling pads
  for (let i = 0; i < 85; i++) {
    const x = randC() * 512;
    const y = randC() * 512;
    const r = 1.5 + randC() * 5.5;
    cCtx.fillStyle = `rgba(74, 68, 60, ${0.06 + randC() * 0.14})`;
    cCtx.beginPath();
    cCtx.arc(x, y, r, 0, Math.PI * 2);
    cCtx.fill();
  }
  // Expansion control joints
  cCtx.strokeStyle = "rgba(96, 88, 78, 0.42)";
  cCtx.lineWidth = 2;
  cCtx.strokeRect(1, 1, 254, 254);
  cCtx.strokeRect(256, 1, 254, 254);
  cCtx.strokeRect(1, 256, 254, 254);
  cCtx.strokeRect(256, 256, 254, 254);
  const concrete = finalizeColorTexture(cCanvas, 6, 6);

  // 3. Silver-gray backlit dual-row LCD totalizer ($ 25.02 / 7.471 GAL)
  const [lCanvas, lCtx] = makeCanvas(384, 160);
  lCtx.fillStyle = "#b8bec4";
  lCtx.fillRect(0, 0, 384, 160);
  lCtx.fillStyle = "#9ea7ae";
  lCtx.fillRect(14, 14, 356, 132);
  lCtx.strokeStyle = "#6c757d";
  lCtx.lineWidth = 4;
  lCtx.strokeRect(14, 14, 356, 132);
  lCtx.fillStyle = "#1c2228";
  lCtx.font = "700 24px monospace";
  lCtx.fillText("$", 30, 62);
  lCtx.font = "700 54px monospace";
  lCtx.textAlign = "right";
  lCtx.fillText("25.02", 342, 74);
  lCtx.font = "700 40px monospace";
  lCtx.fillText("7.471", 342, 128);
  lCtx.textAlign = "left";
  lCtx.font = "600 14px sans-serif";
  lCtx.fillStyle = "#343a40";
  lCtx.fillText("THIS SALE", 32, 34);
  lCtx.fillText("GALLONS", 32, 124);
  const lcdTotalizer = finalizeColorTexture(lCanvas);

  // 4. Glossy black-bezel multimedia touchscreen below totalizer
  const [mCanvas, mCtx] = makeCanvas(512, 300);
  mCtx.fillStyle = "#f4f6f8";
  mCtx.fillRect(0, 0, 512, 300);
  // Top status strip
  mCtx.fillStyle = "#ffffff";
  mCtx.fillRect(0, 0, 512, 62);
  mCtx.fillStyle = "#1e293b";
  mCtx.font = "700 22px sans-serif";
  mCtx.textAlign = "center";
  mCtx.fillText("Welcome  •  Insert or Tap Card", 256, 38);
  // Center media frame
  const mGrad = mCtx.createLinearGradient(88, 72, 424, 246);
  mGrad.addColorStop(0, "#1d3557");
  mGrad.addColorStop(1, "#2a5d84");
  mCtx.fillStyle = mGrad;
  mCtx.fillRect(92, 72, 328, 178);
  mCtx.fillStyle = "#f8fafc";
  mCtx.font = "700 24px sans-serif";
  mCtx.fillText("CLEAN FUEL REWARDS", 256, 152);
  mCtx.fillStyle = "#fbbf24";
  mCtx.font = "600 18px sans-serif";
  mCtx.fillText("LIFT NOZZLE & SELECT GRADE", 256, 192);
  // Side yellow touch tabs matching reference photos
  mCtx.fillStyle = "#f5b800";
  mCtx.fillRect(14, 178, 68, 70);
  mCtx.fillRect(430, 178, 68, 70);
  mCtx.fillStyle = "#1f2937";
  mCtx.font = "700 14px sans-serif";
  mCtx.fillText("Rewards", 48, 218);
  mCtx.fillText("Help", 464, 218);
  mCtx.textAlign = "left";
  const mediaScreen = finalizeColorTexture(mCanvas);

  // 5. 3 Vertical Octane Grade Buttons (87 Regular, 89 Plus, 93 Premium)
  const [bCanvas, bCtx] = makeCanvas(512, 256);
  bCtx.fillStyle = "#e8eaec";
  bCtx.fillRect(0, 0, 512, 256);
  const grades = [
    { num: "87", name: "Regular", price: "3.34⁹", bg: "#f4b400", fg: "#18181b" },
    { num: "89", name: "Plus", price: "3.94⁹", bg: "#e69f00", fg: "#18181b" },
    { num: "93", name: "Premium", price: "4.54⁹", bg: "#c81e1e", fg: "#ffffff" },
  ];
  grades.forEach((g, idx) => {
    const bx = 22 + idx * 160;
    bCtx.fillStyle = g.bg;
    bCtx.fillRect(bx, 12, 144, 232);
    // Mini price LCD window at top of each grade button
    bCtx.fillStyle = "#d5dade";
    bCtx.fillRect(bx + 22, 24, 100, 36);
    bCtx.fillStyle = "#1f2937";
    bCtx.font = "700 22px monospace";
    bCtx.textAlign = "center";
    bCtx.fillText(g.price, bx + 72, 49);
    // Grade label
    bCtx.fillStyle = g.fg;
    bCtx.font = "700 20px sans-serif";
    bCtx.fillText(g.name, bx + 72, 102);
    // Bold yellow-black octane badge box at bottom
    bCtx.fillStyle = "#facc15";
    bCtx.fillRect(bx + 24, 148, 96, 82);
    bCtx.strokeStyle = "#18181b";
    bCtx.lineWidth = 4;
    bCtx.strokeRect(bx + 24, 148, 96, 82);
    bCtx.fillStyle = "#111827";
    bCtx.font = "800 48px sans-serif";
    bCtx.fillText(g.num, bx + 72, 206);
  });
  bCtx.textAlign = "left";
  const octaneButtons = finalizeColorTexture(bCanvas);

  // 6. Warm gold & deep crimson upper bay promotional card (matches open upper frame)
  const [uCanvas, uCtx] = makeCanvas(512, 256);
  uCtx.fillStyle = "#e6a800";
  uCtx.fillRect(0, 0, 512, 92);
  uCtx.fillStyle = "#4b1414";
  uCtx.font = "700 26px sans-serif";
  uCtx.fillText("Save at every fill-up.", 24, 42);
  uCtx.font = "600 18px sans-serif";
  uCtx.fillText("Instant rewards at the pump", 24, 72);
  uCtx.fillStyle = "#7c1d1d";
  uCtx.fillRect(0, 96, 512, 160);
  uCtx.fillStyle = "#f8fafc";
  uCtx.font = "700 24px sans-serif";
  uCtx.fillText("EARN UP TO 10¢ / GAL", 24, 144);
  uCtx.fillStyle = "#fde68a";
  uCtx.font = "600 18px sans-serif";
  uCtx.fillText("Fuel  •  Car Wash  •  In-Store Coffee", 24, 184);
  // Stylized QR box on right
  uCtx.fillStyle = "#ffffff";
  uCtx.fillRect(392, 114, 96, 96);
  uCtx.fillStyle = "#111827";
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      if ((r + c) % 2 === 0 || r === 0 || c === 0) {
        uCtx.fillRect(402 + c * 13, 124 + r * 13, 9, 9);
      }
    }
  }
  const upperPromoCard = finalizeColorTexture(uCanvas);

  // 7. Lower white cabinet panel with bold diagonal yellow-amber & red stripe
  const [sCanvas, sCtx] = makeCanvas(512, 320);
  sCtx.fillStyle = "#f4f5f6";
  sCtx.fillRect(0, 0, 512, 320);
  sCtx.fillStyle = "#f5a800";
  sCtx.beginPath();
  sCtx.moveTo(0, 26);
  sCtx.lineTo(356, 26);
  sCtx.lineTo(320, 108);
  sCtx.lineTo(0, 108);
  sCtx.closePath();
  sCtx.fill();
  sCtx.fillStyle = "#cf2027";
  sCtx.beginPath();
  sCtx.moveTo(0, 108);
  sCtx.lineTo(320, 108);
  sCtx.lineTo(311, 128);
  sCtx.lineTo(0, 128);
  sCtx.closePath();
  sCtx.fill();
  // Clean original golden-red emblem mark on right
  sCtx.fillStyle = "#cf2027";
  sCtx.beginPath();
  sCtx.arc(432, 86, 36, 0, Math.PI * 2);
  sCtx.fill();
  sCtx.fillStyle = "#facc15";
  sCtx.beginPath();
  sCtx.arc(432, 86, 24, 0, Math.PI * 2);
  sCtx.fill();
  const lowerStripe = finalizeColorTexture(sCanvas);

  // 8. Warm cream-tan brick/wainscoting for Convenience Store (matches IMG_8178/8179)
  const [brCanvas, brCtx] = makeCanvas(512, 512);
  brCtx.fillStyle = "#e7d8ce";
  brCtx.fillRect(0, 0, 512, 330);
  // Red horizontal fascia band along upper third (matching IMG_8178!)
  brCtx.fillStyle = "#d94545";
  brCtx.fillRect(0, 68, 512, 72);
  // Darker brown stone wainscoting at base
  brCtx.fillStyle = "#8a6c5a";
  brCtx.fillRect(0, 330, 512, 182);
  const randB = mulberry32(991);
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const shade = Math.floor(randB() * 22 - 11);
      brCtx.fillStyle = `rgb(${132 + shade}, ${102 + shade}, ${84 + shade})`;
      brCtx.fillRect(c * 64 + 2, 334 + r * 22 + 2, 60, 18);
    }
  }
  const storeBrick = finalizeColorTexture(brCanvas, 3, 1);

  // 9. Convenience store fascia sign
  const [sgCanvas, sgCtx] = makeCanvas(1024, 192);
  sgCtx.fillStyle = "#cf2027";
  sgCtx.fillRect(0, 0, 1024, 192);
  sgCtx.fillStyle = "#f5b800";
  sgCtx.fillRect(0, 152, 1024, 40);
  sgCtx.fillStyle = "#ffffff";
  sgCtx.font = "700 66px sans-serif";
  sgCtx.textAlign = "center";
  sgCtx.fillText("FOOD MART  •  FRESH COFFEE", 512, 108);
  sgCtx.textAlign = "left";
  const storeSign = finalizeColorTexture(sgCanvas);

  return {
    asphalt,
    concrete,
    lcdTotalizer,
    mediaScreen,
    octaneButtons,
    upperPromoCard,
    lowerStripe,
    storeBrick,
    storeSign,
    dispose: () => {
      asphalt.dispose();
      concrete.dispose();
      lcdTotalizer.dispose();
      mediaScreen.dispose();
      octaneButtons.dispose();
      upperPromoCard.dispose();
      lowerStripe.dispose();
      storeBrick.dispose();
      storeSign.dispose();
    },
  };
}

/** Wide white overhanging topper graphic with bold red slanted banner + large pump number */
export function createPumpTopperTexture(pumpNumber: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(640, 224);
  // Glossy off-white valence background
  ctx.fillStyle = "#f5f6f7";
  ctx.fillRect(0, 0, 640, 224);

  // Left narrow red wrap strip
  ctx.fillStyle = "#d12027";
  ctx.fillRect(0, 18, 22, 188);

  // Large crisp dark-gray pump number on white background (just like "7" and "8" in the photos!)
  ctx.fillStyle = "#4b5563";
  ctx.font = "800 96px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(pumpNumber), 84, 118);

  // Bold slanted red center panel
  ctx.fillStyle = "#d12027";
  ctx.beginPath();
  ctx.moveTo(148, 22);
  ctx.lineTo(486, 22);
  ctx.lineTo(426, 200);
  ctx.lineTo(148, 200);
  ctx.closePath();
  ctx.fill();

  // Clean original fuel-grade typography inside red panel
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.font = "700 28px sans-serif";
  ctx.fillText("HIGH-OCTANE", 172, 86);
  ctx.font = "800 44px sans-serif";
  ctx.fillText("PRO-POWER+", 172, 134);

  // Original golden-red emblem on right side
  ctx.fillStyle = "#d12027";
  ctx.beginPath();
  ctx.arc(558, 108, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#facc15";
  ctx.beginPath();
  ctx.arc(558, 108, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d12027";
  ctx.beginPath();
  ctx.moveTo(558, 84);
  ctx.lineTo(576, 122);
  ctx.lineTo(540, 122);
  ctx.closePath();
  ctx.fill();

  return finalizeColorTexture(canvas);
}

export function createPumpNumberTexture(
  pumpNumber: number,
  status: "idle" | "selected" | "focused",
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(256, 128);
  ctx.clearRect(0, 0, 256, 128);

  const bg =
    status === "focused" ? "#0284c7" : status === "selected" ? "#0d9488" : "#1e293b";
  const border =
    status === "focused" ? "#7dd3fc" : status === "selected" ? "#5eead4" : "#f8fafc";

  const r = 28;
  ctx.beginPath();
  ctx.moveTo(12 + r, 14);
  ctx.lineTo(244 - r, 14);
  ctx.quadraticCurveTo(244, 14, 244, 14 + r);
  ctx.lineTo(244, 114 - r);
  ctx.quadraticCurveTo(244, 114, 244 - r, 114);
  ctx.lineTo(12 + r, 114);
  ctx.quadraticCurveTo(12, 114, 12, 114 - r);
  ctx.lineTo(12, 14 + r);
  ctx.quadraticCurveTo(12, 14, 12 + r, 14);
  ctx.closePath();

  ctx.fillStyle = bg;
  ctx.fill();
  ctx.lineWidth = status === "idle" ? 5 : 8;
  ctx.strokeStyle = border;
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 22px sans-serif";
  ctx.fillText(
    status === "selected" ? "SELECTED" : status === "focused" ? "INSPECTING" : "PUMP",
    128,
    40,
  );
  ctx.font = "800 52px sans-serif";
  ctx.fillText(`#${pumpNumber}`, 128, 84);

  return finalizeColorTexture(canvas);
}