import { useEffect, useRef } from "react";
import { Box } from "@chakra-ui/react";

// Farben bleiben nahe der Primärfarbe (#a855f7, Hue ~271°) — jeder Punkt
// bekommt einen leicht anderen Ton innerhalb dieser Bandbreite (wie beim
// Hue-Jitter im allerersten Orbit-Hero), kein Sprung zu anderen Farbfamilien.
const BRAND_HUE = 271;
const HUE_JITTER = 40;

const TAU = Math.PI * 2;
const DEG_TO_RAD = Math.PI / 180;
const TEXT = "BASE.";
// Anta gibt es nur in 400 — 700 würde der Browser künstlich verfetten/verzerren.
const FONT_WEIGHT = 400;
const FONT_FAMILY = '"Anta", sans-serif';
// Schriftzug füllt höchstens diesen Anteil von Breite/Höhe des Heros.
const TEXT_MAX_WIDTH_RATIO = 0.88;
const TEXT_MAX_HEIGHT_RATIO = 0.6;
const TEXT_MAX_FONT_SIZE = 504;
// Punktabstand relativ zur Schriftgröße (Desktop ≈ 15px), auf kleinen Screens
// nach unten begrenzt, damit die Punkte nicht zu einer Fläche verschmelzen.
const FONT_SIZE_PER_SAMPLE_STEP = 34;
const MIN_SAMPLE_STEP = 6;
const REVEAL_DURATION_MS = 2600;
const FONT_LOAD_TIMEOUT_MS = 2000;
const CLEAR_ALPHA = 0.05;
const RAY_ALPHA = 0.01;
// Ganze Außenkontur (7), aber nur jeder zweite Punkt davon strahlt — dichter
// als reine Ecken, ohne dass wirklich jeder Punkt einen Strahl bekommt.
const RAY_POINT_THRESHOLD = 15;
const RAY_POINT_STRIDE = 15;

// Ein paar große Strahlen, die unabhängig von "BASE." langsam um die Mitte
// rotieren (eigene, sehr kleine Zufallsgeschwindigkeit je Strahl) und bis an
// den Bildschirmrand reichen.
const AMBIENT_RAY_COUNT = 6;
const AMBIENT_RAY_MAX_SPEED_DEG = 1.5;
const AMBIENT_RAY_ALPHA = 0.05;

interface Orb {
  angle: number;
  radius: number;
  hue: number;
  saturation: number;
  lightness: number;
  bornAt: number;
  lifeMs: number;
  showRay: boolean;
}

interface AmbientRay {
  angle: number;
  speed: number; // rad/s
  hue: number;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function shuffledIndices(length: number): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

const CORNER_NEIGHBOR_OFFSETS = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
] as const;

/**
 * Randpunkte einer Kontur haben weniger "Tinte"-Nachbarn als Punkte mitten in
 * einer dicken Linie (die sind fast komplett umgeben, 8 von 8).
 */
function isRayPoint(
  data: Uint8ClampedArray,
  boxWidth: number,
  boxHeight: number,
  x: number,
  y: number,
  step: number,
): boolean {
  let inkNeighbors = 0;
  for (const [dx, dy] of CORNER_NEIGHBOR_OFFSETS) {
    const nx = x + dx * step;
    const ny = y + dy * step;
    if (nx < 0 || ny < 0 || nx >= boxWidth || ny >= boxHeight) continue;
    if (data[(ny * boxWidth + nx) * 4 + 3] > 128) inkNeighbors++;
  }
  return inkNeighbors <= RAY_POINT_THRESHOLD;
}

/**
 * Tastet den Text direkt in Zielgröße ab: Schriftgröße wird so gewählt, dass
 * der Schriftzug auf jede Bildschirmbreite passt (Handy wie Desktop).
 * Liefert Punkte in Canvas-Koordinaten (Ursprung oben links).
 */
function samplePointsFromText(
  text: string,
  width: number,
  height: number,
): { points: { x: number; y: number; isRayPoint: boolean }[]; step: number } {
  const boxWidth = Math.ceil(width);
  const boxHeight = Math.ceil(height);
  if (boxWidth <= 0 || boxHeight <= 0) return { points: [], step: MIN_SAMPLE_STEP };

  const offscreen = document.createElement("canvas");
  offscreen.width = boxWidth;
  offscreen.height = boxHeight;
  const octx = offscreen.getContext("2d", { willReadFrequently: true });
  if (!octx) return { points: [], step: MIN_SAMPLE_STEP };

  const REFERENCE_SIZE = 100;
  octx.font = `${FONT_WEIGHT} ${REFERENCE_SIZE}px ${FONT_FAMILY}`;
  const referenceWidth = octx.measureText(text).width || REFERENCE_SIZE;
  const fontSize = Math.floor(
    Math.min(
      (REFERENCE_SIZE * boxWidth * TEXT_MAX_WIDTH_RATIO) / referenceWidth,
      boxHeight * TEXT_MAX_HEIGHT_RATIO,
      TEXT_MAX_FONT_SIZE,
    ),
  );
  const step = Math.max(MIN_SAMPLE_STEP, Math.round(fontSize / FONT_SIZE_PER_SAMPLE_STEP));

  octx.fillStyle = "#fff";
  octx.textAlign = "center";
  octx.textBaseline = "middle";
  octx.font = `${FONT_WEIGHT} ${fontSize}px ${FONT_FAMILY}`;
  octx.fillText(text, boxWidth / 2, boxHeight / 2);

  const { data } = octx.getImageData(0, 0, boxWidth, boxHeight);
  const points: { x: number; y: number; isRayPoint: boolean }[] = [];
  for (let y = 0; y < boxHeight; y += step) {
    for (let x = 0; x < boxWidth; x += step) {
      if (data[(y * boxWidth + x) * 4 + 3] > 128) {
        points.push({ x, y, isRayPoint: isRayPoint(data, boxWidth, boxHeight, x, y, step) });
      }
    }
  }
  return { points, step };
}

/**
 * Hero-Sektion: "BASE" formiert sich einmalig aus leuchtenden Punkten (im
 * Spektrum der Primärfarbe) und bleibt danach bestehen — kein Text im
 * Vordergrund, kein Verblassen/Neu-Aufbau-Zyklus. Auf npm.jackrugile's
 * "Canvas Orbital Trails" aufbauend, siehe hero-lab für die Experimentierversion
 * mit Live-Reglern.
 */
export function TextFormationHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // Kein Deckel nötig: Es wird nur einmal pro Resize/Font-Load neu gespawnt
    // (endliche, durch die Textpixel bestimmte Anzahl) — kein fortlaufendes
    // Spawnen wie im Lab, das eine Obergrenze bräuchte.
    const orbs: Orb[] = [];
    // Winkel bewusst nur in der oberen Hälfte (π..2π = links über oben nach
    // rechts, screen-y zeigt nach unten) — sonst zeigen Strahlen nach unten
    // und werden vom 80vh-Hero-Rand hart abgeschnitten statt sanft auszulaufen.
    const ambientRays: AmbientRay[] = Array.from({ length: AMBIENT_RAY_COUNT }, () => ({
      angle: randomBetween(Math.PI, TAU),
      speed: (Math.random() < 0.5 ? -1 : 1) * randomBetween(0.2, AMBIENT_RAY_MAX_SPEED_DEG) * DEG_TO_RAD,
      hue: BRAND_HUE + randomBetween(-HUE_JITTER, HUE_JITTER),
    }));

    let textPoints: { x: number; y: number; isRayPoint: boolean }[] = [];
    let dotRadius = 2;
    let spawnSchedule: number[] = [];
    let spawned: boolean[] = [];

    function pushOrb(orb: Orb) {
      orbs.push(orb);
    }

    function buildTextSchedule(now: number) {
      const { points: raw, step } = samplePointsFromText(TEXT, width, height);
      // Punktgröße mit dem Abstand skalieren — auf dem Handy liegen die Punkte enger.
      dotRadius = Math.min(2, Math.max(1.2, step / 7));

      let rayCounter = 0;
      textPoints = raw.map((p) => {
        let showRay = false;
        if (p.isRayPoint) {
          showRay = rayCounter % RAY_POINT_STRIDE === 0;
          rayCounter++;
        }
        return { x: p.x, y: p.y, isRayPoint: showRay };
      });

      const order = shuffledIndices(textPoints.length);
      spawnSchedule = new Array(textPoints.length);
      order.forEach((pointIndex, orderIndex) => {
        spawnSchedule[pointIndex] = now + (orderIndex / Math.max(1, order.length)) * REVEAL_DURATION_MS;
      });
      spawned = new Array(textPoints.length).fill(false);
    }

    function spawnTextOrb(px: number, py: number, now: number, showRay: boolean) {
      const centerX = width / 2;
      const centerY = height / 2;
      const dx = px - centerX;
      const dy = py - centerY;

      pushOrb({
        angle: Math.atan2(dy, dx),
        radius: Math.max(4, Math.hypot(dx, dy)),
        hue: BRAND_HUE + randomBetween(-HUE_JITTER, HUE_JITTER),
        saturation: randomBetween(75, 95),
        lightness: randomBetween(50, 72),
        bornAt: now,
        // "BASE" bleibt bestehen — Punkte verblassen nie.
        lifeMs: Number.POSITIVE_INFINITY,
        showRay,
      });
    }

    // Erst abtasten, wenn Anta wirklich geladen ist — sonst formt sich "BASE."
    // aus der Fallback-Schrift. document.fonts.ready reicht nicht: Der Canvas
    // fordert die Schrift nicht zuverlässig selbst an.
    let fontReady = false;

    function rebuild() {
      if (!fontReady) return;
      orbs.length = 0;
      buildTextSchedule(performance.now());
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      // Nur bei echter Größenänderung neu aufbauen (ResizeObserver feuert auch initial).
      if (rect.width === width && rect.height === height) return;
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuild();
    }
    resize();

    let cancelled = false;
    const onFontReady = () => {
      if (cancelled || fontReady) return;
      fontReady = true;
      rebuild();
    };
    document.fonts.load(`${FONT_WEIGHT} 100px ${FONT_FAMILY}`).then(onFontReady, onFontReady);
    // Notfall: Falls die Schrift hängt, nach kurzer Zeit mit Fallback starten.
    const fontTimeout = window.setTimeout(onFontReady, FONT_LOAD_TIMEOUT_MS);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    let lastFrameTime = performance.now();
    let animationFrame = requestAnimationFrame(tick);

    function tick(now: number) {
      const dt = Math.min((now - lastFrameTime) / 1000, 0.1);
      lastFrameTime = now;

      ctx!.fillStyle = `rgba(0, 0, 0, ${CLEAR_ALPHA})`;
      ctx!.fillRect(0, 0, width, height);

      for (let i = 0; i < spawnSchedule.length; i++) {
        if (!spawned[i] && now >= spawnSchedule[i]) {
          spawned[i] = true;
          spawnTextOrb(textPoints[i].x, textPoints[i].y, now, textPoints[i].isRayPoint);
        }
      }

      const centerX = width / 2;
      const centerY = height / 2;
      const ambientReach = Math.hypot(width, height);

      for (const ray of ambientRays) {
        ray.angle += ray.speed * dt;
        // Am oberen/unteren Rand der erlaubten Hälfte sanft umkehren statt
        // durchzurotieren — bleibt so dauerhaft in der oberen Hälfte.
        if (ray.angle > TAU) {
          ray.angle = TAU;
          ray.speed *= -1;
        } else if (ray.angle < Math.PI) {
          ray.angle = Math.PI;
          ray.speed *= -1;
        }
        const x = centerX + Math.cos(ray.angle) * ambientReach;
        const y = centerY + Math.sin(ray.angle) * ambientReach;

        ctx!.beginPath();
        ctx!.moveTo(centerX, centerY);
        ctx!.lineTo(x, y);
        ctx!.strokeStyle = `hsla(${ray.hue}, 90%, 65%, ${AMBIENT_RAY_ALPHA})`;
        ctx!.lineWidth = 1.5;
        ctx!.shadowColor = `hsla(${ray.hue}, 95%, 70%, ${AMBIENT_RAY_ALPHA})`;
        ctx!.shadowBlur = 20;
        ctx!.stroke();
      }

      for (const orb of orbs) {
        const alpha = 1 - (now - orb.bornAt) / orb.lifeMs;
        const x = centerX + Math.cos(orb.angle) * orb.radius;
        const y = centerY + Math.sin(orb.angle) * orb.radius;

        if (orb.showRay) {
          ctx!.beginPath();
          ctx!.moveTo(centerX, centerY);
          ctx!.lineTo(x, y);
          ctx!.strokeStyle = `hsla(${orb.hue}, ${orb.saturation}%, ${orb.lightness}%, ${alpha * RAY_ALPHA})`;
          ctx!.lineWidth = 1.5;
          ctx!.shadowColor = `hsla(${orb.hue}, 95%, 70%, ${alpha * RAY_ALPHA})`;
          ctx!.shadowBlur = 16;
          ctx!.stroke();
        }

        // Kein shadowBlur auf den Punkten: Der Schatten war durch die geerbte
        // (fast transparente) shadowColor ohnehin kaum sichtbar, kostete aber
        // bei >1000 Punkten pro Frame so viel, dass es auf Handys hing.
        ctx!.shadowBlur = 0;
        ctx!.beginPath();
        ctx!.arc(x, y, dotRadius, 0, TAU);
        ctx!.fillStyle = `hsla(${orb.hue}, 90%, 82%, ${alpha})`;
        ctx!.fill();
      }

      animationFrame = requestAnimationFrame(tick);
    }

    return () => {
      cancelled = true;
      window.clearTimeout(fontTimeout);
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <Box as="section" position="relative" overflow="hidden" minH="80vh" bg="black">
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
    </Box>
  );
}
