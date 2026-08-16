import { useEffect, useRef, useState } from "react";
import { Box, Button, Flex, Stack, Text } from "@chakra-ui/react";

// Farben bleiben nahe der Primärfarbe (#a855f7, Hue ~271°) — selbst bei
// aufgedrehtem Hue-Jitter wird nur ein schmales Band erreicht, nie das
// volle Farbspektrum wie im Original-Codepen.
const BRAND_HUE = 271;
const MAX_HUE_JITTER_DEG = 40;

const TAU = Math.PI * 2;
const DEG_TO_RAD = Math.PI / 180;
const TEXT = "BASE";
const TEXT_SAMPLE_STEP = 5;
const MAX_TOTAL_ORBS = 1200;
const REVEAL_DURATION_MS = 2600;
const TEXT_ORB_LIFE_MS = 11000;
const HOLD_BEFORE_RESTART_MS = 1800;
const TOTAL_CYCLE_MS = REVEAL_DURATION_MS + TEXT_ORB_LIFE_MS + HOLD_BEFORE_RESTART_MS;

interface Orb {
  angle: number;
  lastAngle: number;
  radius: number;
  speed: number;
  hue: number;
  saturation: number;
  lightness: number;
  bornAt: number;
  lifeMs: number;
  // Nur Eckpunkte/Konturspitzen bekommen den teuren Strahl+Bogen-Effekt —
  // bei hunderten Punkten wäre das für ALLE gleichzeitig nicht mehr performant.
  showRay: boolean;
}

interface Settings {
  speed: number; // max °/s Rotationsgeschwindigkeit
  scale: number; // Multiplikator auf den Radius
  radiusJitter: number; // zusätzlicher Radius-Zufallsversatz in px
  hueJitter: number; // 0..100 -> Grad um die Primärfarbe (gedeckelt, s.o.)
  clearAlpha: number; // 0..100 -> Alpha des Fade-Rechtecks pro Frame
  orbitalsOn: boolean;
  orbitalAlpha: number; // 0..100
  lightOn: boolean;
  lightAlpha: number; // 0..100
  // 0..7 -> wie viele "Tinte"-Nachbarn ein Punkt maximal haben darf, um noch
  // als Rand-/Außenpunkt zu gelten. 0 = nur scharfe Ecken, 7 = ganze Kontur.
  rayPointThreshold: number;
  // 1 = jeder erkannte Außenpunkt bekommt einen Strahl, 2 = nur jeder zweite, usw.
  rayPointStride: number;
}

const DEFAULT_SETTINGS: Settings = {
  speed: 0,
  scale: 3,
  radiusJitter: 0,
  hueJitter: 0,
  clearAlpha: 5,
  orbitalsOn: false,
  orbitalAlpha: 0,
  lightOn: true,
  lightAlpha: 1,
  // Standard: ganze Außenkontur (7), aber nur jeder zweite Punkt davon -> viel
  // dichter als reine Ecken, ohne gleich wieder alle Punkte strahlen zu lassen.
  rayPointThreshold: 60,
  rayPointStride: 7,
};

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
 * einer dicken Linie (die sind fast komplett umgeben, 8 von 8). threshold
 * steuert, wie großzügig das ist: niedrig = nur scharfe Ecken/Spitzen,
 * threshold=7 = die komplette Außenkontur, threshold=8 = wirklich alle Punkte.
 */
function isRayPoint(
  data: Uint8ClampedArray,
  boxWidth: number,
  boxHeight: number,
  x: number,
  y: number,
  threshold: number,
): boolean {
  let inkNeighbors = 0;
  for (const [dx, dy] of CORNER_NEIGHBOR_OFFSETS) {
    const nx = x + dx * TEXT_SAMPLE_STEP;
    const ny = y + dy * TEXT_SAMPLE_STEP;
    if (nx < 0 || ny < 0 || nx >= boxWidth || ny >= boxHeight) continue;
    if (data[(ny * boxWidth + nx) * 4 + 3] > 128) inkNeighbors++;
  }
  return inkNeighbors <= threshold;
}

function samplePointsFromText(
  text: string,
  boxWidth: number,
  boxHeight: number,
  rayPointThreshold: number,
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
        points.push({ x, y, isRayPoint: isRayPoint(data, boxWidth, boxHeight, x, y, rayPointThreshold) });
      }
    }
  }
  return points;
}

/**
 * Experimentelle zweite Hero-Version: 1:1 an "Canvas Orbital Trails" (Codepen)
 * angelehnt, inklusive Live-Regler-Panel. Kein Text im Vordergrund — der
 * Schriftzug "BASE" entsteht stattdessen selbst aus den Orbit-Punkten, die
 * nach und nach an den Pixelkoordinaten des Textes gespawnt werden.
 */
export function OrbitalTextRevealHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const orbsRef = useRef<Orb[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const [controlsOpen, setControlsOpen] = useState(true);
  const [orbitCount, setOrbitCount] = useState(0);
  const rebuildRef = useRef<(() => void) | null>(null);

  // Ray Points/Every Nth verändern, welche Punkte beim Abtasten des Textes als
  // Außenpunkt markiert werden — das passiert nur beim Aufbau (buildTextSchedule),
  // nicht pro Frame. Ohne diesen Effekt würde eine Slider-Änderung erst beim
  // nächsten Zyklus-Neustart (~15s) sichtbar.
  useEffect(() => {
    rebuildRef.current?.();
  }, [settings.rayPointThreshold, settings.rayPointStride]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let textPoints: { x: number; y: number; isRayPoint: boolean }[] = [];
    let spawnSchedule: number[] = [];
    let spawned: boolean[] = [];
    let cycleStart = performance.now();

    function pushOrb(orb: Orb) {
      const orbs = orbsRef.current;
      orbs.push(orb);
      if (orbs.length > MAX_TOTAL_ORBS) {
        orbs.splice(0, orbs.length - MAX_TOTAL_ORBS);
      }
    }

    function buildTextSchedule(now: number, resetOrbs = false) {
      if (resetOrbs) {
        orbsRef.current = [];
      }

      const s = settingsRef.current;
      const boxWidth = Math.min(width * 0.9, 900);
      const boxHeight = Math.min(height * 0.5, 240);
      const raw = samplePointsFromText(TEXT, boxWidth, boxHeight, s.rayPointThreshold);

      // Von den erkannten Außenpunkten nur jeden n-ten (rayPointStride) wirklich
      // strahlen lassen — sonst leuchtet bei threshold=7 fast die ganze Kontur.
      const stride = Math.max(1, Math.round(s.rayPointStride));
      let rayCounter = 0;
      textPoints = raw.map((p) => {
        let isRayPoint = false;
        if (p.isRayPoint) {
          isRayPoint = rayCounter % stride === 0;
          rayCounter++;
        }
        return {
          x: p.x - boxWidth / 2 + width / 2,
          y: p.y - boxHeight / 2 + height / 2,
          isRayPoint,
        };
      });

      const order = shuffledIndices(textPoints.length);
      spawnSchedule = new Array(textPoints.length);
      order.forEach((pointIndex, orderIndex) => {
        spawnSchedule[pointIndex] = now + (orderIndex / Math.max(1, order.length)) * REVEAL_DURATION_MS;
      });
      spawned = new Array(textPoints.length).fill(false);
      cycleStart = now;
    }

    function spawnOrbAtPoint(px: number, py: number, now: number, isTextOrb: boolean, isRayPoint = false) {
      const s = settingsRef.current;
      const centerX = width / 2;
      const centerY = height / 2;
      const dx = px - centerX;
      const dy = py - centerY;
      const jitter = randomBetween(-s.radiusJitter, s.radiusJitter);
      const radius = Math.max(4, Math.hypot(dx, dy) * s.scale + jitter);
      const direction = Math.random() < 0.5 ? -1 : 1;
      const hueRange = (s.hueJitter / 100) * MAX_HUE_JITTER_DEG;
      const maxSpeedDeg = Math.max(0.1, s.speed);

      pushOrb({
        angle: Math.atan2(dy, dx),
        lastAngle: Math.atan2(dy, dx),
        radius,
        // Text-Punkte drehen sich nie, damit "BASE" nicht verzieht.
        speed: isTextOrb ? 0 : direction * randomBetween(0, maxSpeedDeg) * DEG_TO_RAD,
        hue: BRAND_HUE + randomBetween(-hueRange, hueRange),
        saturation: randomBetween(75, 95),
        lightness: randomBetween(50, 72),
        bornAt: now,
        lifeMs: isTextOrb ? TEXT_ORB_LIFE_MS : randomBetween(2600, 4400),
        // Bei Text-Punkten nur an erkannten Außenpunkten den teuren Strahl+Bogen
        // zeigen — interaktive Klick-Punkte (wenige, dynamisch) zeigen ihn immer.
        showRay: isTextOrb ? isRayPoint : true,
      });
    }

    rebuildRef.current = () => buildTextSchedule(performance.now(), true);

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Reset statt Anhäufen: sonst würde jeder Resize eine weitere volle
      // Text-Punktwolke oben auf die noch lebenden Punkte draufspawnen.
      buildTextSchedule(performance.now(), true);
    }
    resize();

    // Sobald die Anta-Schriftart sicher geladen ist, den Text neu abtasten
    // (verhindert Fallback-Font-Kanten im allerersten Zyklus).
    document.fonts.ready.then(() => buildTextSchedule(performance.now(), true)).catch(() => {});

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    let dragging = false;
    let lastDragSpawn = 0;

    function handlePointerDown(event: PointerEvent) {
      dragging = true;
      const rect = canvas!.getBoundingClientRect();
      spawnOrbAtPoint(event.clientX - rect.left, event.clientY - rect.top, performance.now(), false);
    }
    function handlePointerMove(event: PointerEvent) {
      if (!dragging) return;
      const now = performance.now();
      if (now - lastDragSpawn < 80) return;
      lastDragSpawn = now;
      const rect = canvas!.getBoundingClientRect();
      spawnOrbAtPoint(event.clientX - rect.left, event.clientY - rect.top, now, false);
    }
    function stopDragging() {
      dragging = false;
    }

    canvas.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointerleave", stopDragging);

    const statsInterval = window.setInterval(() => setOrbitCount(orbsRef.current.length), 300);

    let lastFrameTime = performance.now();
    let animationFrame = requestAnimationFrame(tick);

    function tick(now: number) {
      const dt = Math.min((now - lastFrameTime) / 1000, 0.1);
      lastFrameTime = now;
      const s = settingsRef.current;

      ctx!.fillStyle = `rgba(0, 0, 0, ${s.clearAlpha / 100})`;
      ctx!.fillRect(0, 0, width, height);

      for (let i = 0; i < spawnSchedule.length; i++) {
        if (!spawned[i] && now >= spawnSchedule[i]) {
          spawned[i] = true;
          spawnOrbAtPoint(textPoints[i].x, textPoints[i].y, now, true, textPoints[i].isRayPoint);
        }
      }
      if (now - cycleStart > TOTAL_CYCLE_MS) {
        buildTextSchedule(now);
      }

      const centerX = width / 2;
      const centerY = height / 2;

      orbsRef.current = orbsRef.current.filter((orb) => now - orb.bornAt < orb.lifeMs);

      for (const orb of orbsRef.current) {
        orb.lastAngle = orb.angle;
        orb.angle += orb.speed * dt;

        const alpha = 1 - (now - orb.bornAt) / orb.lifeMs;
        const x1 = centerX + Math.cos(orb.lastAngle) * orb.radius;
        const y1 = centerY + Math.sin(orb.lastAngle) * orb.radius;
        const x2 = centerX + Math.cos(orb.angle) * orb.radius;
        const y2 = centerY + Math.sin(orb.angle) * orb.radius;

        if (s.lightOn && orb.showRay) {
          const rayAlpha = alpha * (s.lightAlpha / 100);
          ctx!.beginPath();
          ctx!.moveTo(centerX, centerY);
          ctx!.lineTo(x2, y2);
          ctx!.strokeStyle = `hsla(${orb.hue}, ${orb.saturation}%, ${orb.lightness}%, ${rayAlpha})`;
          ctx!.lineWidth = 1.5;
          ctx!.shadowColor = `hsla(${orb.hue}, 95%, 70%, ${rayAlpha})`;
          ctx!.shadowBlur = 16;
          ctx!.stroke();
        }

        if (s.orbitalsOn && orb.showRay) {
          const trailAlpha = alpha * (s.orbitalAlpha / 100);
          ctx!.beginPath();
          ctx!.moveTo(x1, y1);
          ctx!.lineTo(x2, y2);
          ctx!.strokeStyle = `hsla(${orb.hue}, ${orb.saturation}%, ${orb.lightness}%, ${trailAlpha})`;
          ctx!.lineWidth = 2;
          ctx!.shadowColor = `hsla(${orb.hue}, 90%, 65%, ${trailAlpha})`;
          ctx!.shadowBlur = 10;
          ctx!.stroke();
        }

        ctx!.beginPath();
        ctx!.arc(x2, y2, 2, 0, TAU);
        ctx!.fillStyle = `hsla(${orb.hue}, 90%, 82%, ${alpha})`;
        ctx!.shadowBlur = 14;
        ctx!.fill();
      }

      animationFrame = requestAnimationFrame(tick);
    }

    return () => {
      rebuildRef.current = null;
      cancelAnimationFrame(animationFrame);
      window.clearInterval(statsInterval);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointerleave", stopDragging);
    };
  }, []);

  function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <Box position="relative" minH="100dvh" bg="black" overflow="hidden">
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", touchAction: "none" }}
      />
      <ControlsPanel
        open={controlsOpen}
        onToggleOpen={() => setControlsOpen((v) => !v)}
        settings={settings}
        onChange={updateSetting}
        onClear={() => (orbsRef.current = [])}
        totalOrbitals={orbitCount}
      />
    </Box>
  );
}

interface ControlsPanelProps {
  open: boolean;
  onToggleOpen: () => void;
  settings: Settings;
  onChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  onClear: () => void;
  totalOrbitals: number;
}

function ControlsPanel({ open, onToggleOpen, settings, onChange, onClear, totalOrbitals }: ControlsPanelProps) {
  return (
    <Box
      position="absolute"
      bottom={4}
      right={4}
      zIndex={10}
      bg="blackAlpha.800"
      color="fg.default"
      borderRadius="md"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      w="280px"
      fontSize="sm"
    >
      {open && (
        <Stack gap={3} p={4}>
          <Flex justify="space-between" opacity={0.7}>
            <Text>Total Orbitals</Text>
            <Text>{totalOrbitals}</Text>
          </Flex>
          <ControlSlider label="Speed" value={settings.speed} min={0} max={30} onChange={(v) => onChange("speed", v)} />
          <ControlSlider
            label="Scale"
            value={settings.scale}
            min={0.2}
            max={3}
            step={0.1}
            onChange={(v) => onChange("scale", v)}
          />
          <ControlSlider
            label="Radius Jitter"
            value={settings.radiusJitter}
            min={0}
            max={100}
            onChange={(v) => onChange("radiusJitter", v)}
          />
          <ControlSlider
            label="Hue Jitter"
            value={settings.hueJitter}
            min={0}
            max={100}
            onChange={(v) => onChange("hueJitter", v)}
          />
          <ControlSlider
            label="Clear Alpha"
            value={settings.clearAlpha}
            min={1}
            max={100}
            onChange={(v) => onChange("clearAlpha", v)}
          />
          <ControlCheckbox
            label="Toggle Orbitals"
            checked={settings.orbitalsOn}
            onChange={(v) => onChange("orbitalsOn", v)}
          />
          <ControlSlider
            label="Orbital Alpha"
            value={settings.orbitalAlpha}
            min={0}
            max={100}
            onChange={(v) => onChange("orbitalAlpha", v)}
          />
          <ControlCheckbox label="Toggle Light" checked={settings.lightOn} onChange={(v) => onChange("lightOn", v)} />
          <ControlSlider
            label="Light Alpha"
            value={settings.lightAlpha}
            min={0}
            max={100}
            onChange={(v) => onChange("lightAlpha", v)}
          />
          <ControlSlider
            label="Ray Points (0=Ecken, 7=Kontur)"
            value={settings.rayPointThreshold}
            min={0}
            max={7}
            onChange={(v) => onChange("rayPointThreshold", v)}
          />
          <ControlSlider
            label="Ray Every Nth"
            value={settings.rayPointStride}
            min={1}
            max={5}
            onChange={(v) => onChange("rayPointStride", v)}
          />
          <Button size="sm" variant="outline" onClick={onClear}>
            Clear
          </Button>
        </Stack>
      )}
      <Button size="sm" variant="ghost" w="full" onClick={onToggleOpen}>
        {open ? "Close Controls" : "Open Controls"}
      </Button>
    </Box>
  );
}

function ControlSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <Box>
      <Flex justify="space-between" mb={1}>
        <Text>{label}</Text>
        <Text color="brand.400">{value}</Text>
      </Flex>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ width: "100%", accentColor: "#a855f7" }}
      />
    </Box>
  );
}

function ControlCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Flex justify="space-between" align="center">
      <Text>{label}</Text>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        style={{ width: 16, height: 16, accentColor: "#a855f7" }}
      />
    </Flex>
  );
}
