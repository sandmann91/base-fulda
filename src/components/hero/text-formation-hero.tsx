import { useEffect, useRef } from "react";
import { Box } from "@chakra-ui/react";

// Farben bleiben nahe der Primärfarbe (#a855f7, Hue ~271°) — nur
// Sättigung/Helligkeit variiert, kein Sprung zu anderen Farbfamilien.
const BRAND_HUE = 271;

const TAU = Math.PI * 2;
const DEG_TO_RAD = Math.PI / 180;
const TEXT = "BASE.";
const TEXT_SAMPLE_STEP = 5;
const REVEAL_DURATION_MS = 2600;
const SCALE = 3;
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
function isRayPoint(data: Uint8ClampedArray, boxWidth: number, boxHeight: number, x: number, y: number): boolean {
  let inkNeighbors = 0;
  for (const [dx, dy] of CORNER_NEIGHBOR_OFFSETS) {
    const nx = x + dx * TEXT_SAMPLE_STEP;
    const ny = y + dy * TEXT_SAMPLE_STEP;
    if (nx < 0 || ny < 0 || nx >= boxWidth || ny >= boxHeight) continue;
    if (data[(ny * boxWidth + nx) * 4 + 3] > 128) inkNeighbors++;
  }
  return inkNeighbors <= RAY_POINT_THRESHOLD;
}

function samplePointsFromText(
  text: string,
  boxWidth: number,
  boxHeight: number,
): { x: number; y: number; isRayPoint: boolean }[] {
  const offscreen = document.createElement("canvas");
  offscreen.width = boxWidth;
  offscreen.height = boxHeight;
  const octx = offscreen.getContext("2d");
  if (!octx) return [];

  octx.clearRect(0, 0, boxWidth, boxHeight);
  octx.fillStyle = "#fff";
  octx.textAlign = "center";
  octx.textBaseline = "middle";
  octx.font = `700 ${Math.floor(boxHeight * 0.7)}px "Anta", sans-serif`;
  octx.fillText(text, boxWidth / 2, boxHeight / 2);

  const { data } = octx.getImageData(0, 0, boxWidth, boxHeight);
  const points: { x: number; y: number; isRayPoint: boolean }[] = [];
  for (let y = 0; y < boxHeight; y += TEXT_SAMPLE_STEP) {
    for (let x = 0; x < boxWidth; x += TEXT_SAMPLE_STEP) {
      if (data[(y * boxWidth + x) * 4 + 3] > 128) {
        points.push({ x, y, isRayPoint: isRayPoint(data, boxWidth, boxHeight, x, y) });
      }
    }
  }
  return points;
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
      hue: BRAND_HUE,
    }));

    let textPoints: { x: number; y: number; isRayPoint: boolean }[] = [];
    let spawnSchedule: number[] = [];
    let spawned: boolean[] = [];

    function pushOrb(orb: Orb) {
      orbs.push(orb);
    }

    function buildTextSchedule(now: number) {
      const boxWidth = Math.min(width * 0.9, 900);
      const boxHeight = Math.min(height * 0.5, 240);
      const raw = samplePointsFromText(TEXT, boxWidth, boxHeight);

      let rayCounter = 0;
      textPoints = raw.map((p) => {
        let showRay = false;
        if (p.isRayPoint) {
          showRay = rayCounter % RAY_POINT_STRIDE === 0;
          rayCounter++;
        }
        return {
          x: p.x - boxWidth / 2 + width / 2,
          y: p.y - boxHeight / 2 + height / 2,
          isRayPoint: showRay,
        };
      });

      const order = shuffledIndices(textPoints.length);
      spawnSchedule = new Array(textPoints.length);
      order.forEach((pointIndex, orderIndex) => {
        spawnSchedule[pointIndex] = now + (orderIndex / Math.max(1, order.length)) * REVEAL_DURATION_MS;
      });
      spawned = new Array(textPoints.length).fill(false);

      const rayCount = textPoints.filter((p) => p.isRayPoint).length;
      console.log(`[TextFormationHero] ${textPoints.length} Punkte, davon ${rayCount} mit Strahl`);
    }

    function spawnTextOrb(px: number, py: number, now: number, showRay: boolean) {
      const centerX = width / 2;
      const centerY = height / 2;
      const dx = px - centerX;
      const dy = py - centerY;

      pushOrb({
        angle: Math.atan2(dy, dx),
        radius: Math.max(4, Math.hypot(dx, dy) * SCALE),
        hue: BRAND_HUE,
        saturation: randomBetween(75, 95),
        lightness: randomBetween(50, 72),
        bornAt: now,
        // "BASE" bleibt bestehen — Punkte verblassen nie.
        lifeMs: Number.POSITIVE_INFINITY,
        showRay,
      });
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      orbs.length = 0;
      buildTextSchedule(performance.now());
    }
    resize();

    // Sobald die Anta-Schriftart sicher geladen ist, den Text neu abtasten
    // (verhindert Fallback-Font-Kanten im allerersten Frame).
    document.fonts.ready.then(() => {
      orbs.length = 0;
      buildTextSchedule(performance.now());
    }).catch(() => {});

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

        ctx!.beginPath();
        ctx!.arc(x, y, 2, 0, TAU);
        ctx!.fillStyle = `hsla(${orb.hue}, 90%, 82%, ${alpha})`;
        ctx!.shadowBlur = 14;
        ctx!.fill();
      }

      animationFrame = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <Box as="section" position="relative" overflow="hidden" minH="80vh" bg="black">
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", touchAction: "none" }}
      />
    </Box>
  );
}
