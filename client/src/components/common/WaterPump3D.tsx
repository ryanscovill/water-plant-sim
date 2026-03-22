import { useState, useEffect, useRef, useCallback } from "react";

const PARTS = [
  { id: "motor", name: "Electric Motor", desc: "AC induction motor drives the pump shaft via direct coupling. Enclosed fan-cooled (TEFC) housing with aluminum cooling fins dissipates heat during continuous duty operation.", specs: ["Power: 5.5 – 75 kW", "Frame: IEC / NEMA", "Enclosure: TEFC IP55", "Efficiency: IE3 Premium"] },
  { id: "casing", name: "Volute Casing", desc: "Precision-cast spiral housing converting impeller kinetic energy into pressure. The gradually expanding cross-section decelerates flow, recovering energy as static pressure head.", specs: ["Material: Cast Iron GG25", "Design: Single volute spiral", "Pressure: PN16 – PN25", "Surface: Machined & coated"] },
  { id: "impeller", name: "Impeller", desc: "Dynamically balanced rotating disc with backward-curved vanes. Accelerates fluid radially outward via centrifugal force — the primary energy transfer element of the pump.", specs: ["Type: Closed shrouded", "Vanes: 6 backward-curved", "Trim: Adjustable diameter", "Balance: ISO G2.5"] },
  { id: "shaft", name: "Drive Shaft", desc: "Precision-ground alloy steel shaft transmitting torque from motor to impeller. Supported by heavy-duty deep-groove ball bearings with vibration monitoring.", specs: ["Material: AISI 4140 steel", "Finish: Ra 0.8μm ground", "Bearings: Deep groove ball", "Runout: < 0.025mm TIR"] },
  { id: "inlet", name: "Suction Inlet", desc: "Axial entry port feeding water into the impeller eye along the shaft centerline. Smooth acceleration profile minimizes turbulence and cavitation risk.", specs: ["Type: Axial end-suction", "Flange: ANSI 150 / PN16", "NPSH Req: 2.1 – 4.8m", "Strainer: Recommended"] },
  { id: "outlet", name: "Discharge Outlet", desc: "Tangential high-pressure exit from the top of the volute casing. Pressurized fluid exits perpendicular to the shaft axis into the piping system.", specs: ["Type: Top centerline", "Flange: ANSI 150 / PN16", "Velocity: 2 – 4 m/s", "Gauge: ½\" NPT port"] },
  { id: "seal", name: "Mechanical Seal", desc: "Precision-lapped rotary face seal preventing shaft leakage. Two ultra-flat faces maintain a thin lubricating fluid film under spring preload.", specs: ["Type: Cartridge single", "Faces: SiC vs Carbon", "O-rings: Viton / EPDM", "Leakage: < 0.5 ml/hr"] },
  { id: "bearing", name: "Bearing Housing", desc: "Rigid cast housing supporting shaft bearings with oil bath lubrication. Isolates bearing loads from pump hydraulics with drain, fill, and sight-glass ports.", specs: ["Lube: Oil bath / Grease", "Monitor: Vib + Temp", "Life: L10 > 40,000 hrs", "Cooling: Integral fins"] },
];

function rot3(x: number, y: number, z: number, ax: number, ay: number): [number, number, number] {
  const cy = Math.cos(ay), sy = Math.sin(ay);
  const x1 = x * cy - z * sy, z1 = x * sy + z * cy;
  const cx = Math.cos(ax), sx = Math.sin(ax);
  return [x1, y * cx - z1 * sx, y * sx + z1 * cx];
}

function sh(r: number, g: number, b: number, nx: number, ny: number, nz: number, spec = 0.3) {
  const lx = 0.35, ly = -0.6, lz = -0.65;
  const ll = Math.sqrt(lx * lx + ly * ly + lz * lz);
  const dot = Math.max(0, (nx * lx + ny * ly + nz * lz) / ll);
  const hx = lx, hy = ly - 1, hz = lz;
  const hl = Math.sqrt(hx * hx + hy * hy + hz * hz) || 1;
  const sp = Math.pow(Math.max(0, (nx * hx + ny * hy + nz * hz) / hl), 40) * spec;
  const f = 0.22 + dot * 0.62 + sp;
  return `rgb(${Math.min(255, ~~(r * f + sp * 190))},${Math.min(255, ~~(g * f + sp * 190))},${Math.min(255, ~~(b * f + sp * 170))})`;
}

interface Face {
  pts?: { x: number; y: number; z: number; s: number }[];
  color?: string;
  z: number;
  al?: number;
  stroke?: string;
  custom?: (ctx: CanvasRenderingContext2D) => void;
}

export default function WaterPump3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [running, setRunning] = useState(true);
  const [flow, setFlow] = useState(80);
  const [ang, setAng] = useState({ x: -0.32, y: 0.55 });
  const [drag, setDrag] = useState(false);
  const [lastM, setLastM] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.1);
  const [cut, setCut] = useState(true);
  const [explode, setExplode] = useState(0);
  const tRef = useRef(0);

  const shouldCut = useCallback((a: number) => cut && a > 0.08 && a < Math.PI * 0.92, [cut]);

  const draw = useCallback((cv: HTMLCanvasElement) => {
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const W = cv.width, H = cv.height, dpr = window.devicePixelRatio || 1;
    const t = tRef.current;
    const spd = running ? flow / 80 : 0;
    const N = 32;

    const P = (x: number, y: number, z: number) => {
      const [rx, ry, rz] = rot3(x, y, z, ang.x, ang.y);
      const s = (zoom * W * 0.055) / (1 + rz / 10);
      return { x: W / 2 + rx * s, y: H / 2 + ry * s, z: rz, s };
    };

    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W * 0.42, H * 0.38, 0, W / 2, H / 2, W * 0.85);
    bg.addColorStop(0, "#0e1928"); bg.addColorStop(0.5, "#091018"); bg.addColorStop(1, "#04080e");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    ctx.globalAlpha = 0.04;
    for (let i = -10; i <= 10; i++) {
      let a = P(i * 0.6, 3.5, -6), b = P(i * 0.6, 3.5, 6);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = "#00c8e0"; ctx.lineWidth = 0.6; ctx.stroke();
      a = P(-6, 3.5, i * 0.6); b = P(6, 3.5, i * 0.6);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const hi = (id: string) => hovered === id || selected === id;
    const faces: Face[] = [];

    const shaftY = 0.5;
    const ex = explode / 100;
    const oM = ex * -3.5, oC = ex * -2.0, oB = ex * -0.8, oS = ex * 1.2;
    const oV = ex * 2.8, oI = ex * 4.8, oIn = ex * 7.0;

    const cylX = (cx: number, cy: number, cz: number, r: number, len: number, n: number, cr: number, cg: number, cb: number, al = 1, sp = 0.35) => {
      for (let i = 0; i < n; i++) {
        const a1 = (i / n) * Math.PI * 2, a2 = ((i + 1) / n) * Math.PI * 2;
        if (shouldCut(a1) || shouldCut(a2)) continue;
        const c1 = Math.cos(a1), s1 = Math.sin(a1), c2 = Math.cos(a2), s2 = Math.sin(a2);
        const pts = [P(cx - len / 2, cy + c1 * r, cz + s1 * r), P(cx - len / 2, cy + c2 * r, cz + s2 * r), P(cx + len / 2, cy + c2 * r, cz + s2 * r), P(cx + len / 2, cy + c1 * r, cz + s1 * r)];
        const ma = (a1 + a2) / 2;
        const [nx, ny, nz] = rot3(0, Math.cos(ma), Math.sin(ma), ang.x, ang.y);
        faces.push({ pts, color: sh(cr, cg, cb, nx, ny, nz, sp), z: pts.reduce((s, p) => s + p.z, 0) / 4, al });
      }
    };
    const capX = (cx: number, cy: number, cz: number, r: number, n: number, cr: number, cg: number, cb: number, isR: boolean, al = 1) => {
      const [rnx, rny, rnz] = rot3(isR ? 1 : -1, 0, 0, ang.x, ang.y);
      for (let i = 0; i < n; i++) {
        const a1 = (i / n) * Math.PI * 2, a2 = ((i + 1) / n) * Math.PI * 2;
        if (shouldCut(a1) || shouldCut(a2)) continue;
        faces.push({ pts: [P(cx, cy, cz), P(cx, cy + Math.cos(a1) * r, cz + Math.sin(a1) * r), P(cx, cy + Math.cos(a2) * r, cz + Math.sin(a2) * r)], color: sh(cr, cg, cb, rnx, rny, rnz, 0.2), z: 0, al });
      }
    };
    const cylY = (cx: number, cy: number, cz: number, r: number, h: number, n: number, cr: number, cg: number, cb: number, al = 1, sp = 0.35) => {
      for (let i = 0; i < n; i++) {
        const a1 = (i / n) * Math.PI * 2, a2 = ((i + 1) / n) * Math.PI * 2;
        if (shouldCut(a1) || shouldCut(a2)) continue;
        const c1 = Math.cos(a1), s1 = Math.sin(a1), c2 = Math.cos(a2), s2 = Math.sin(a2);
        const pts = [P(cx + c1 * r, cy - h / 2, cz + s1 * r), P(cx + c2 * r, cy - h / 2, cz + s2 * r), P(cx + c2 * r, cy + h / 2, cz + s2 * r), P(cx + c1 * r, cy + h / 2, cz + s1 * r)];
        const ma = (a1 + a2) / 2;
        const [nx, ny, nz] = rot3(Math.cos(ma), 0, Math.sin(ma), ang.x, ang.y);
        faces.push({ pts, color: sh(cr, cg, cb, nx, ny, nz, sp), z: pts.reduce((s, p) => s + p.z, 0) / 4, al });
      }
    };
    const capY = (cx: number, cy: number, cz: number, r: number, n: number, cr: number, cg: number, cb: number, isT: boolean, al = 1) => {
      const [rnx, rny, rnz] = rot3(0, isT ? -1 : 1, 0, ang.x, ang.y);
      for (let i = 0; i < n; i++) {
        const a1 = (i / n) * Math.PI * 2, a2 = ((i + 1) / n) * Math.PI * 2;
        if (shouldCut(a1) || shouldCut(a2)) continue;
        faces.push({ pts: [P(cx, cy, cz), P(cx + Math.cos(a1) * r, cy, cz + Math.sin(a1) * r), P(cx + Math.cos(a2) * r, cy, cz + Math.sin(a2) * r)], color: sh(cr, cg, cb, rnx, rny, rnz, 0.2), z: 0, al });
      }
    };
    const box = (x: number, y: number, z: number, w: number, h: number, d: number, cr: number, cg: number, cb: number, al = 1) => {
      const c = [[x-w/2,y-h/2,z-d/2],[x+w/2,y-h/2,z-d/2],[x+w/2,y-h/2,z+d/2],[x-w/2,y-h/2,z+d/2],[x-w/2,y+h/2,z-d/2],[x+w/2,y+h/2,z-d/2],[x+w/2,y+h/2,z+d/2],[x-w/2,y+h/2,z+d/2]];
      const faceIndices: number[][] = [[0,1,2,3],[4,5,6,7],[0,1,5,4],[2,3,7,6],[0,3,7,4],[1,2,6,5]];
      const ns: [number,number,number][] = [[0,-1,0],[0,1,0],[0,0,-1],[0,0,1],[-1,0,0],[1,0,0]];
      faceIndices.forEach((f, i) => {
        const pts = f.map(j => P(c[j][0], c[j][1], c[j][2]));
        const [nx, ny, nz] = rot3(...ns[i], ang.x, ang.y);
        faces.push({ pts, color: sh(cr, cg, cb, nx, ny, nz, 0.15), z: pts.reduce((s, p) => s + p.z, 0) / 4, al });
      });
    };
    const bolts = (cx: number, cy: number, cz: number, r: number, count: number, axis: string) => {
      for (let b = 0; b < count; b++) {
        const ba = (b / count) * Math.PI * 2;
        let bp;
        if (axis === "x") bp = P(cx, cy + Math.cos(ba) * r, cz + Math.sin(ba) * r);
        else bp = P(cx + Math.cos(ba) * r, cy, cz + Math.sin(ba) * r);
        faces.push({ custom: (c2) => { c2.beginPath(); c2.arc(bp.x, bp.y, Math.max(1.5, 3 * bp.s / 35), 0, Math.PI * 2); c2.fillStyle = "#a5b2bc"; c2.fill(); c2.strokeStyle = "#5a6a78"; c2.lineWidth = 1; c2.stroke(); }, z: bp.z - 0.03, al: 0.95 });
      }
    };

    // ── BASE ──
    const baseAl = Math.max(0, 1 - ex * 5);
    if (baseAl > 0) { box(0, 3.2, 0, 9.5, 0.22, 2.8, 40, 50, 60, 0.93 * baseAl); }

    // ── MOTOR ──
    const mc: [number,number,number] = hi("motor") ? [30, 200, 230] : [52, 68, 88];
    cylX(-3.4+oM, shaftY, 0, 1.2, 3.0, N, ...mc, 0.92, 0.38);
    capX(-4.9+oM, shaftY, 0, 1.2, N, mc[0]+12, mc[1]+12, mc[2]+12, false, 0.9);
    capX(-1.9+oM, shaftY, 0, 1.2, N, mc[0]-5, mc[1]-5, mc[2]-5, true, 0.9);
    for (let f = 0; f < 16; f++) cylX(-4.7+f*0.19+oM, shaftY, 0, 1.3, 0.04, N, mc[0]+22, mc[1]+22, mc[2]+22, 0.6, 0.5);
    cylX(-5.2+oM, shaftY, 0, 1.28, 0.5, 24, 36, 46, 56, 0.5, 0.2);
    capX(-5.45+oM, shaftY, 0, 1.28, 24, 32, 42, 52, false, 0.5);
    box(-3.4+oM, shaftY-1.55, 0, 0.65, 0.55, 0.5, mc[0]+10, mc[1]+10, mc[2]+10, 0.85);

    // ── COUPLING ──
    cylX(-1.3+oC, shaftY, 0, 0.65, 1.0, 24, 55, 65, 78, cut ? 0.3 : 0.65, 0.25);

    // ── SHAFT ──
    const sc: [number,number,number] = hi("shaft") ? [60, 230, 245] : [155, 165, 178];
    const sL = -4.25+oM, sR = 2.5+oI;
    cylX((sL+sR)/2, shaftY, 0, 0.16, sR-sL, 16, ...sc, 0.95, 0.7);
    cylX(-1.6+oC, shaftY, 0, 0.38, 0.22, 20, sc[0]-35, sc[1]-35, sc[2]-35, 0.88, 0.5);
    cylX(-1.0+oC, shaftY, 0, 0.38, 0.22, 20, sc[0]-35, sc[1]-35, sc[2]-35, 0.88, 0.5);

    // ── BEARING ──
    const bc: [number,number,number] = hi("bearing") ? [30, 200, 230] : [72, 88, 102];
    cylX(-0.1+oB, shaftY, 0, 0.82, 1.3, N, ...bc, 0.88, 0.35);
    cylX(-0.75+oB, shaftY, 0, 0.92, 0.14, N, bc[0]+18, bc[1]+18, bc[2]+18, 0.88, 0.4);
    cylX(0.55+oB, shaftY, 0, 0.92, 0.14, N, bc[0]+18, bc[1]+18, bc[2]+18, 0.88, 0.4);

    // ── SEAL ──
    const slc: [number,number,number] = hi("seal") ? [40, 225, 240] : [195, 180, 45];
    cylX(0.9+oS, shaftY, 0, 0.45, 0.4, 24, ...slc, 0.95, 0.55);
    cylX(0.9+oS, shaftY, 0, 0.52, 0.12, 24, slc[0]-25, slc[1]-25, slc[2]+30, 0.9, 0.35);
    cylX(0.78+oS, shaftY, 0, 0.35, 0.06, 18, 175, 175, 185, 0.7, 0.6);

    // ── VOLUTE CASING ──
    const vc = hi("casing") ? [25, 195, 225] : [68, 82, 98];
    for (let ring = 0; ring < 18; ring++) {
      const rx = 1.15 + ring * 0.09;
      const r = 1.65 * (1.0 + Math.sin(ring / 17 * Math.PI) * 0.12);
      const so = ring * 1.2;
      cylX(rx+oV, shaftY, 0, r, 0.1, N+4, vc[0]+so, vc[1]+so, vc[2]+so*1.4, cut ? 0.48 : 0.88, 0.35);
    }
    cylX(1.08+oV, shaftY, 0, 1.82, 0.2, N+4, vc[0]+22, vc[1]+22, vc[2]+22, cut ? 0.55 : 0.9, 0.4);
    capX(0.98+oV, shaftY, 0, 1.82, N+4, vc[0]+30, vc[1]+30, vc[2]+30, false, cut ? 0.5 : 0.85);
    cylX(2.82+oV, shaftY, 0, 1.82, 0.2, N+4, vc[0]+15, vc[1]+15, vc[2]+15, cut ? 0.55 : 0.9, 0.4);
    capX(2.92+oV, shaftY, 0, 1.82, N+4, vc[0]+10, vc[1]+10, vc[2]+10, true, cut ? 0.5 : 0.85);

    // ── IMPELLER ──
    const ic = hi("impeller") ? [30, 220, 240] : [195, 50, 45];
    const il = hi("impeller") ? [120, 255, 255] : [235, 85, 75];
    const rot = t * spd * 2.8;
    const xB = 1.4+oI, xF = 2.15+oI, rI = 0.32, rO = 1.38, eyeR = 0.55, bT = 0.08, bC = 1.45;
    const bA = (base: number, r: number) => base + Math.log(r / rI) * bC;

    { const [nx,ny,nz] = rot3(-1,0,0, ang.x, ang.y);
      for (let i=0;i<N;i++) { const a1=(i/N)*Math.PI*2, a2=((i+1)/N)*Math.PI*2;
        if (shouldCut(a1)||shouldCut(a2)) continue;
        faces.push({ pts: [P(xB, shaftY+Math.cos(a1)*rI*0.95, Math.sin(a1)*rI*0.95), P(xB, shaftY+Math.cos(a1)*rO, Math.sin(a1)*rO), P(xB, shaftY+Math.cos(a2)*rO, Math.sin(a2)*rO), P(xB, shaftY+Math.cos(a2)*rI*0.95, Math.sin(a2)*rI*0.95)], color: sh(ic[0],ic[1],ic[2],nx,ny,nz,0.25), z: 0, al: cut?0.7:0.35 });
    }}
    { const [nx,ny,nz] = rot3(1,0,0, ang.x, ang.y);
      for (let i=0;i<N;i++) { const a1=(i/N)*Math.PI*2, a2=((i+1)/N)*Math.PI*2;
        if (shouldCut(a1)||shouldCut(a2)) continue;
        faces.push({ pts: [P(xF, shaftY+Math.cos(a1)*eyeR, Math.sin(a1)*eyeR), P(xF, shaftY+Math.cos(a1)*rO, Math.sin(a1)*rO), P(xF, shaftY+Math.cos(a2)*rO, Math.sin(a2)*rO), P(xF, shaftY+Math.cos(a2)*eyeR, Math.sin(a2)*eyeR)], color: sh(ic[0]+22,ic[1]+18,ic[2]+18,nx,ny,nz,0.2), z: 0, al: cut?0.5:0.22 });
    }}
    for (let i=0;i<N;i++) { const a1=(i/N)*Math.PI*2, a2=((i+1)/N)*Math.PI*2;
      if (shouldCut(a1)||shouldCut(a2)) continue;
      const pts = [P(xB,shaftY+Math.cos(a1)*rO,Math.sin(a1)*rO), P(xB,shaftY+Math.cos(a2)*rO,Math.sin(a2)*rO), P(xF,shaftY+Math.cos(a2)*rO,Math.sin(a2)*rO), P(xF,shaftY+Math.cos(a1)*rO,Math.sin(a1)*rO)];
      const ma=(a1+a2)/2; const [nx,ny,nz]=rot3(0,Math.cos(ma),Math.sin(ma),ang.x,ang.y);
      faces.push({ pts, color: sh(ic[0]+10,ic[1]+10,ic[2]+10,nx,ny,nz,0.3), z: pts.reduce((s,p)=>s+p.z,0)/4, al: cut?0.6:0.3 });
    }
    cylX((xB+xF)/2, shaftY, 0, rI, xF-xB+0.1, 18, ic[0]+45, ic[1]+45, ic[2]+45, 0.9, 0.6);
    for (let v=0;v<6;v++) { const base = rot+(v*Math.PI*2)/6;
      for (let s=0;s<14;s++) {
        const f1=s/14, f2=(s+1)/14, r1=rI+f1*(rO-rI), r2=rI+f2*(rO-rI);
        const a1=bA(base,r1), a2=bA(base,r2), xF1=xF-f1*0.05, xF2=xF-f2*0.05;
        const pBL1=P(xB,shaftY+Math.cos(a1)*r1,Math.sin(a1)*r1), pBL2=P(xB,shaftY+Math.cos(a2)*r2,Math.sin(a2)*r2);
        const pFL2=P(xF2,shaftY+Math.cos(a2)*r2,Math.sin(a2)*r2), pFL1=P(xF1,shaftY+Math.cos(a1)*r1,Math.sin(a1)*r1);
        const mA=(a1+a2)/2, tNy=-Math.sin(mA), tNz=Math.cos(mA);
        const [nx,ny,nz]=rot3(0,tNy,tNz,ang.x,ang.y);
        const br=0.7+f1*0.3;
        faces.push({ pts:[pBL1,pBL2,pFL2,pFL1], color: sh(il[0]*br,il[1]*br,il[2]*br,nx,ny,nz,0.4), z:(pBL1.z+pBL2.z+pFL2.z+pFL1.z)/4, al: cut?0.82:0.4, stroke:`rgba(${il[0]},${il[1]},${il[2]},0.25)` });
        const a1b=a1+bT/Math.max(0.3,r1), a2b=a2+bT/Math.max(0.3,r2);
        const pBR1=P(xB,shaftY+Math.cos(a1b)*r1,Math.sin(a1b)*r1), pBR2=P(xB,shaftY+Math.cos(a2b)*r2,Math.sin(a2b)*r2);
        const pFR2=P(xF2,shaftY+Math.cos(a2b)*r2,Math.sin(a2b)*r2), pFR1=P(xF1,shaftY+Math.cos(a1b)*r1,Math.sin(a1b)*r1);
        faces.push({ pts:[pBR1,pFR1,pFR2,pBR2], color: sh(il[0]*br*0.7,il[1]*br*0.7,il[2]*br*0.7,...rot3(0,-tNy,-tNz,ang.x,ang.y),0.3), z:(pBR1.z+pBR2.z+pFR2.z+pFR1.z)/4, al: cut?0.75:0.35 });
        faces.push({ pts:[pFL1,pFL2,pFR2,pFR1], color: sh(il[0]*br*0.85,il[1]*br*0.85,il[2]*br*0.85,...rot3(1,0,0,ang.x,ang.y),0.35), z:(pFL1.z+pFL2.z+pFR2.z+pFR1.z)/4, al: cut?0.7:0.3 });
        faces.push({ pts:[pBL1,pBR1,pBR2,pBL2], color: sh(il[0]*br*0.6,il[1]*br*0.6,il[2]*br*0.6,...rot3(-1,0,0,ang.x,ang.y),0.2), z:(pBL1.z+pBR1.z+pBR2.z+pBL2.z)/4, al: cut?0.65:0.3 });
      }
    }

    // ── INLET ──
    const inC: [number,number,number] = hi("inlet") ? [30,200,230] : [62,78,95];
    cylX(3.8+oIn, shaftY, 0, 0.65, 2.0, 26, ...inC, 0.82, 0.35);
    cylX(4.85+oIn, shaftY, 0, 0.88, 0.2, 26, inC[0]+22, inC[1]+22, inC[2]+22, 0.92, 0.4);
    capX(4.95+oIn, shaftY, 0, 0.88, 26, inC[0]+15, inC[1]+15, inC[2]+15, true, 0.88);
    bolts(4.9+oIn, shaftY, 0, 0.75, 8, "x");

    // ── OUTLET ──
    const outC: [number,number,number] = hi("outlet") ? [30,200,230] : [62,78,95];
    cylY(1.95+oV, shaftY-2.6, 0, 0.55, 2.2, 26, ...outC, 0.82, 0.35);
    cylY(1.95+oV, shaftY-1.35, 0, 0.58, 0.5, 26, outC[0]+5, outC[1]+5, outC[2]+5, 0.8, 0.3);
    cylY(1.95+oV, shaftY-3.85, 0, 0.75, 0.2, 26, outC[0]+22, outC[1]+22, outC[2]+22, 0.92, 0.4);
    capY(1.95+oV, shaftY-3.95, 0, 0.75, 26, outC[0]+15, outC[1]+15, outC[2]+15, true, 0.88);
    bolts(1.95+oV, shaftY-3.9, 0, 0.63, 8, "y");

    // ── SORT & RENDER ──
    faces.sort((a, b) => b.z - a.z);
    faces.forEach(f => {
      ctx.globalAlpha = f.al || 1;
      if (f.custom) { f.custom(ctx); return; }
      if (!f.pts) return;
      ctx.beginPath(); f.pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.closePath(); ctx.fillStyle = f.color!; ctx.fill();
      if (f.stroke) { ctx.strokeStyle = f.stroke; ctx.lineWidth = 0.8; ctx.stroke(); }
    });

    // ── WATER PARTICLES ──
    if (running && ex < 0.15) {
      ctx.globalAlpha = 0.6;
      for (let i = 0; i < 35; i++) {
        const seed = i * 137.508, rP = (seed % 360) / 360 * Math.PI * 2;
        const rR = 0.35 + ((i * 7 + 3) % 13) / 13;
        const aA = rP + rot + t * spd * (0.8 + (i % 5) * 0.3);
        const vx = 1.45 + oI + ((i * 11 + 5) % 17) / 17 * 0.65;
        const pp = P(vx, shaftY + Math.cos(aA) * rR, Math.sin(aA) * rR);
        const sz = 1 + rR * 1.4;
        const g = ctx.createRadialGradient(pp.x, pp.y, 0, pp.x, pp.y, sz * 2);
        g.addColorStop(0, "rgba(100,210,255,0.75)"); g.addColorStop(1, "rgba(33,150,243,0)");
        ctx.fillStyle = g; ctx.fillRect(pp.x - sz * 2, pp.y - sz * 2, sz * 4, sz * 4);
      }
      ctx.globalAlpha = 0.55;
      for (let a = 0; a < 5; a++) {
        const ax = 4.6+oIn - a*0.4 - ((t*spd*1.3)%0.4);
        const ap = P(ax, shaftY, 0);
        ctx.beginPath(); ctx.moveTo(ap.x+7, ap.y-5); ctx.lineTo(ap.x, ap.y); ctx.lineTo(ap.x+7, ap.y+5);
        ctx.strokeStyle = "rgba(100,210,255,0.55)"; ctx.lineWidth = 2; ctx.stroke();
      }
      ctx.globalAlpha = 0.5;
      for (let a = 0; a < 4; a++) {
        const ay = shaftY-1.8 - a*0.45 - ((t*spd*1.1)%0.45);
        const ap = P(1.95+oV, ay, 0);
        ctx.beginPath(); ctx.moveTo(ap.x-5, ap.y+7); ctx.lineTo(ap.x, ap.y); ctx.lineTo(ap.x+5, ap.y+7);
        ctx.strokeStyle = "rgba(255,140,60,0.55)"; ctx.lineWidth = 2; ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // ── LABELS ──
    const lf = `bold ${14 * dpr}px "IBM Plex Mono",monospace`;
    ctx.textAlign = "center";
    const labels = [
      { id:"motor", lx:-3.4+oM, ly:-2.2, lz:0, ax:-3.4+oM, ay:shaftY-1.2, az:0, t:"Electric Motor" },
      { id:"shaft", lx:-1.3+oC, ly:-1.3, lz:0, ax:-1.3+oC, ay:shaftY, az:0, t:"Drive Shaft" },
      { id:"bearing", lx:-0.1+oB, ly:-1.5, lz:1.2, ax:-0.1+oB, ay:shaftY-0.82, az:0.3, t:"Bearing Housing" },
      { id:"seal", lx:0.9+oS, ly:-1.3, lz:-1.2, ax:0.9+oS, ay:shaftY-0.45, az:-0.3, t:"Mechanical Seal" },
      { id:"casing", lx:1.95+oV, ly:3.5, lz:1.5, ax:1.95+oV, ay:shaftY+1.65, az:0.5, t:"Volute Casing" },
      { id:"impeller", lx:1.8+oI, ly:-1.5, lz:-2.0, ax:1.8+oI, ay:shaftY, az:-0.8, t:"Impeller" },
      { id:"inlet", lx:4.5+oIn, ly:-0.8, lz:0, ax:4.0+oIn, ay:shaftY, az:0, t:"Suction Inlet" },
      { id:"outlet", lx:1.95+oV, ly:-4.5, lz:0.8, ax:1.95+oV, ay:shaftY-3.5, az:0.2, t:"Discharge Outlet" },
    ];
    labels.forEach(l => {
      const lp = P(l.lx, l.ly, l.lz), ap = P(l.ax, l.ay, l.az);
      const active = hi(l.id);
      ctx.beginPath(); ctx.moveTo(lp.x, lp.y+4); ctx.lineTo(ap.x, ap.y);
      ctx.strokeStyle = active ? "rgba(0,229,255,0.55)" : "rgba(100,150,170,0.3)";
      ctx.lineWidth = 1.2; ctx.setLineDash([4,3]); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(ap.x, ap.y, 4, 0, Math.PI*2);
      ctx.fillStyle = active ? "#00e5ff" : "rgba(100,150,170,0.5)"; ctx.fill();
      ctx.font = lf;
      const tw = ctx.measureText(l.t).width, bgW = tw+20, bgH = 14*dpr+8;
      ctx.globalAlpha = active ? 0.92 : 0.78;
      ctx.fillStyle = "rgba(4,8,14,0.88)";
      const bx = lp.x-bgW/2, by = lp.y-14*dpr;
      ctx.beginPath(); const br=5;
      ctx.moveTo(bx+br,by); ctx.lineTo(bx+bgW-br,by); ctx.quadraticCurveTo(bx+bgW,by,bx+bgW,by+br);
      ctx.lineTo(bx+bgW,by+bgH-br); ctx.quadraticCurveTo(bx+bgW,by+bgH,bx+bgW-br,by+bgH);
      ctx.lineTo(bx+br,by+bgH); ctx.quadraticCurveTo(bx,by+bgH,bx,by+bgH-br);
      ctx.lineTo(bx,by+br); ctx.quadraticCurveTo(bx,by,bx+br,by); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = active ? "rgba(0,229,255,0.4)" : "rgba(100,150,170,0.15)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.globalAlpha = active ? 1 : 0.92;
      ctx.fillStyle = active ? "#00e5ff" : "#d0dce4"; ctx.font = lf;
      ctx.fillText(l.t, lp.x, lp.y+2); ctx.globalAlpha = 1;
    });

    // HUD
    ctx.textAlign = "left";
    ctx.font = `600 ${13*dpr}px "IBM Plex Mono",monospace`;
    const hx = 20*dpr, hy = 28*dpr;
    ctx.fillStyle = "rgba(4,8,14,0.75)"; ctx.fillRect(hx-8, hy-16*dpr, 480, 42*dpr);
    ctx.fillStyle = running ? "#4caf50" : "#ff6d00"; ctx.fillText("\u25CF", hx, hy);
    ctx.fillStyle = "#d0dce4"; ctx.fillText(`  ${running?"RUNNING":"OFFLINE"}`, hx+10, hy);
    ctx.font = `${11*dpr}px "IBM Plex Mono",monospace`; ctx.fillStyle = "#90a8b8";
    ctx.fillText(`RPM ${running?Math.round(1450*flow/80):0}  \u00b7  Q = ${running?(flow*0.05).toFixed(1):"0.0"} m\u00b3/s  \u00b7  H = ${running?(flow*0.32).toFixed(1):"0.0"} mWC`, hx, hy+20*dpr);

  }, [ang, zoom, hovered, selected, running, flow, cut, explode, shouldCut]);

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => { const r = cv.getBoundingClientRect(); cv.width = r.width*dpr; cv.height = r.height*dpr; };
    resize(); window.addEventListener("resize", resize);
    const loop = () => { tRef.current += 0.016; draw(cv); animRef.current = requestAnimationFrame(loop); };
    loop();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("resize", resize); };
  }, [draw]);

  const onD = (e: React.MouseEvent | React.TouchEvent) => { setDrag(true); const p = 'touches' in e ? e.touches[0] : e; setLastM({x:p.clientX,y:p.clientY}); };
  const onM = (e: React.MouseEvent | React.TouchEvent) => { if(!drag) return; const p = 'touches' in e ? e.touches[0] : e; setAng(v=>({x:Math.max(-1.3,Math.min(0.35,v.x+(p.clientY-lastM.y)*0.005)),y:v.y+(p.clientX-lastM.x)*0.005})); setLastM({x:p.clientX,y:p.clientY}); };
  const onU = () => setDrag(false);
  const onW = (e: React.WheelEvent) => { e.preventDefault(); setZoom(z=>Math.max(0.4,Math.min(2.8,z-e.deltaY*0.0012))); };

  const sel = PARTS.find(p => p.id === selected);

  return (
    <div style={{ width:"100%", height:"70vh", background:"#04080e", display:"flex", fontFamily:'"IBM Plex Mono","JetBrains Mono",monospace', color:"#c5d0d8", overflow:"hidden", borderRadius: 8 }}>
      <div style={{ width:240, minWidth:240, background:"rgba(6,12,24,0.97)", borderRight:"1px solid rgba(0,229,255,0.08)", display:"flex", flexDirection:"column", zIndex:10 }}>
        <div style={{ padding:"16px 14px 10px", borderBottom:"1px solid rgba(0,229,255,0.06)" }}>
          <div style={{ fontSize:9, color:"#00e5ff", letterSpacing:4, fontWeight:300, opacity:0.8 }}>CENTRIFUGAL</div>
          <div style={{ fontSize:18, fontWeight:700, letterSpacing:0.5, marginTop:2, color:"#e8edf2" }}>Water Pump</div>
          <div style={{ fontSize:9, color:"#5a7888", marginTop:4, letterSpacing:2 }}>INTERACTIVE 3D CUTAWAY</div>
        </div>

        <div style={{ padding:"10px 14px", borderBottom:"1px solid rgba(0,229,255,0.06)" }}>
          <div style={{ fontSize:9, color:"#5a7888", letterSpacing:3, marginBottom:8, fontWeight:700 }}>CONTROLS</div>
          <button onClick={() => setRunning(!running)} style={{
            width:"100%", padding:"8px 0", border:`1px solid ${running?"#00e5ff":"#ff6d00"}40`,
            background: running?"rgba(0,229,255,0.06)":"rgba(255,109,0,0.06)",
            color: running?"#00e5ff":"#ff6d00", borderRadius:5, cursor:"pointer", fontSize:11,
            fontFamily:"inherit", letterSpacing:2, fontWeight:600
          }}>{running ? "\u25A0  STOP PUMP" : "\u25B6  START PUMP"}</button>

          <div style={{ marginTop:10, display:"flex", justifyContent:"space-between", fontSize:9, color:"#6a8595" }}>
            <span>FLOW RATE</span><span style={{ color:"#00e5ff", fontWeight:600 }}>{flow}%</span>
          </div>
          <input type="range" min={10} max={100} value={flow} onChange={e => setFlow(+e.target.value)} style={{ width:"100%", marginTop:4 }} />

          <div style={{ marginTop:10, display:"flex", justifyContent:"space-between", fontSize:9, color:"#6a8595" }}>
            <span>EXPLODE</span><span style={{ color: explode > 0 ? "#ff9800" : "#6a8595", fontWeight:600 }}>{explode}%</span>
          </div>
          <input type="range" min={0} max={100} value={explode} onChange={e => setExplode(+e.target.value)} style={{ width:"100%", marginTop:4 }} />

          <div style={{ display:"flex", gap:5, marginTop:10 }}>
            <button onClick={() => setCut(!cut)} style={{
              flex:1, padding:"6px 0", border:"1px solid rgba(0,229,255,0.1)",
              background: cut?"rgba(0,229,255,0.05)":"transparent",
              color:"#8aa5b5", borderRadius:4, cursor:"pointer", fontSize:9, fontFamily:"inherit", letterSpacing:1
            }}>{cut ? "\u25C9 CUTAWAY" : "\u25CB SOLID"}</button>
            <button onClick={() => { setAng({x:-0.32,y:0.55}); setZoom(1.1); setExplode(0); }} style={{
              flex:1, padding:"6px 0", border:"1px solid rgba(0,229,255,0.1)", background:"transparent",
              color:"#8aa5b5", borderRadius:4, cursor:"pointer", fontSize:9, fontFamily:"inherit", letterSpacing:1
            }}>{"\u21BB"} RESET</button>
          </div>
        </div>

        <div style={{ padding:"10px 14px", flex:1, overflow:"auto" }}>
          <div style={{ fontSize:9, color:"#5a7888", letterSpacing:3, marginBottom:7, fontWeight:700 }}>COMPONENTS</div>
          {PARTS.map(p => (
            <button key={p.id} onClick={() => setSelected(selected===p.id?null:p.id)}
              onMouseEnter={() => setHovered(p.id)} onMouseLeave={() => setHovered(null)} style={{
                width:"100%", textAlign:"left", padding:"7px 10px", marginBottom:2,
                border:`1px solid ${selected===p.id?"rgba(0,229,255,0.35)":"rgba(0,229,255,0.04)"}`,
                background: selected===p.id?"rgba(0,229,255,0.07)":hovered===p.id?"rgba(0,229,255,0.02)":"transparent",
                color: selected===p.id?"#00e5ff":"#a0b8c5", borderRadius:4, cursor:"pointer", fontSize:11, fontFamily:"inherit", transition:"all 0.12s",
              }}>
              <span style={{ color: selected===p.id?"#00e5ff":"#1a3a4a", marginRight:6, fontSize:7 }}>{"\u25CF"}</span>{p.name}
            </button>
          ))}
        </div>

        <div style={{ padding:"8px 14px", borderTop:"1px solid rgba(0,229,255,0.06)", fontSize:9, color:"#4a6878" }}>
          Drag to orbit · Scroll to zoom
        </div>
      </div>

      <div style={{ flex:1, position:"relative" }}>
        <canvas ref={canvasRef} style={{ width:"100%", height:"100%", cursor: drag?"grabbing":"grab" }}
          onMouseDown={onD} onMouseMove={onM} onMouseUp={onU} onMouseLeave={onU} onWheel={onW}
          onTouchStart={onD} onTouchMove={onM} onTouchEnd={onU} />

        {sel && (
          <div style={{ position:"absolute", bottom:16, right:16, width:300, background:"rgba(6,12,24,0.96)", border:"1px solid rgba(0,229,255,0.18)", borderRadius:8, padding:18, backdropFilter:"blur(16px)", boxShadow:"0 8px 48px rgba(0,0,0,0.6),0 0 60px rgba(0,229,255,0.04)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:8, color:"#00e5ff", letterSpacing:3, fontWeight:600 }}>COMPONENT DETAIL</div>
                <div style={{ fontSize:16, fontWeight:700, marginTop:2, color:"#e8edf2" }}>{sel.name}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background:"none", border:"1px solid rgba(0,229,255,0.12)", color:"#6a8595", width:26, height:26, borderRadius:5, cursor:"pointer", fontSize:15, fontFamily:"inherit" }}>{"\u00D7"}</button>
            </div>
            <div style={{ fontSize:11.5, color:"#8a9daa", lineHeight:1.7, marginTop:10, marginBottom:14 }}>{sel.desc}</div>
            <div style={{ fontSize:8, color:"#00e5ff", letterSpacing:3, marginBottom:6, fontWeight:600 }}>SPECIFICATIONS</div>
            {sel.specs.map((s, i) => (
              <div key={i} style={{ fontSize:10.5, color:"#a0b8c5", padding:"5px 0", borderBottom: i<sel.specs.length-1?"1px solid rgba(0,229,255,0.05)":"none", display:"flex", justifyContent:"space-between" }}>
                <span style={{ color:"#6a8595" }}>{s.split(":")[0]}</span><span>{s.split(":").slice(1).join(":")}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
