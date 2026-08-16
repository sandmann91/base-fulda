import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { Box, Heading, Text } from "@chakra-ui/react";

// Alle Farben bleiben im Spektrum der Primärfarbe (#a855f7, Hue ~271°) — nur
// Sättigung/Helligkeit variiert, kein Hue-Sprung zu anderen Farbfamilien.
const BRAND_HUE = 271;
const HUE_JITTER = 18;

const MAX_ORBS = 50;
const FADE_ALPHA = 0.07;
const AMBIENT_INTERVAL_MS = 1600;
const DRAG_SPAWN_INTERVAL_MS = 80;
const TAU = Math.PI * 2;

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
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function createOrb(px: number, py: number, centerX: number, centerY: number, now: number): Orb {
  const dx = px - centerX;
  const dy = py - centerY;
  const direction = Math.random() < 0.5 ? -1 : 1;

  return {
    angle: Math.atan2(dy, dx),
    lastAngle: Math.atan2(dy, dx),
    radius: Math.max(20, Math.hypot(dx, dy)),
    speed: direction * randomBetween(0.4, 1.1),
    hue: BRAND_HUE + randomBetween(-HUE_JITTER, HUE_JITTER),
    saturation: randomBetween(70, 95),
    lightness: randomBetween(45, 68),
    bornAt: now,
    lifeMs: randomBetween(2600, 4400),
  };
}

export interface OrbitalTrailsHeroHandle {
  /** Spawnt einen Orbit-Trail an einer relativen Canvas-Position (0..1) — simuliert einen Klick von außen. */
  spawnOrbAt: (xRatio: number, yRatio: number) => void;
}

/**
 * Hero-Sektion mit Canvas-Partikelanimation: orbitende Licht-Trails um die Mitte,
 * reagiert auf Maus-/Touch-Interaktion. Eigenständige, austauschbare Hero-Komponente
 * (Alternative zu VideoHero) ohne Pflicht-Props.
 *
 * Die Ref-API ist bewusst schlank gehalten, damit sich künftige Nav-Punkte hierüber
 * andocken lassen (Punkt anklicken -> spawnOrbAt an dessen Position aufrufen), ohne
 * dass diese Komponente selbst etwas von Navigation wissen muss.
 */
export const OrbitalTrailsHero = forwardRef<OrbitalTrailsHeroHandle, object>(function OrbitalTrailsHero(
  _props,
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const orbsRef = useRef<Orb[]>([]);

  function pushOrb(orb: Orb) {
    const orbs = orbsRef.current;
    orbs.push(orb);
    if (orbs.length > MAX_ORBS) {
      orbs.splice(0, orbs.length - MAX_ORBS);
    }
  }

  function spawnAtClientPoint(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    pushOrb(
      createOrb(clientX - rect.left, clientY - rect.top, rect.width / 2, rect.height / 2, performance.now()),
    );
  }

  useImperativeHandle(ref, () => ({
    spawnOrbAt(xRatio, yRatio) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      spawnAtClientPoint(rect.left + rect.width * xRatio, rect.top + rect.height * yRatio);
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    let dragging = false;
    let lastDragSpawn = 0;

    function handlePointerDown(event: PointerEvent) {
      dragging = true;
      spawnAtClientPoint(event.clientX, event.clientY);
    }
    function handlePointerMove(event: PointerEvent) {
      if (!dragging) return;
      const now = performance.now();
      if (now - lastDragSpawn < DRAG_SPAWN_INTERVAL_MS) return;
      lastDragSpawn = now;
      spawnAtClientPoint(event.clientX, event.clientY);
    }
    function stopDragging() {
      dragging = false;
    }

    canvas.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointerleave", stopDragging);

    const ambientTimer = window.setInterval(() => {
      const centerX = width / 2;
      const centerY = height / 2;
      const minDim = Math.min(width, height);
      const angle = randomBetween(0, TAU);
      const radius = randomBetween(minDim * 0.12, minDim * 0.4);
      pushOrb(
        createOrb(
          centerX + Math.cos(angle) * radius,
          centerY + Math.sin(angle) * radius,
          centerX,
          centerY,
          performance.now(),
        ),
      );
    }, AMBIENT_INTERVAL_MS);

    let lastFrameTime = performance.now();
    let animationFrame = requestAnimationFrame(tick);

    function tick(now: number) {
      const dt = Math.min((now - lastFrameTime) / 1000, 0.1);
      lastFrameTime = now;

      ctx!.fillStyle = `rgba(0, 0, 0, ${FADE_ALPHA})`;
      ctx!.fillRect(0, 0, width, height);

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

        ctx!.beginPath();
        ctx!.moveTo(x1, y1);
        ctx!.lineTo(x2, y2);
        ctx!.strokeStyle = `hsla(${orb.hue}, ${orb.saturation}%, ${orb.lightness}%, ${alpha * 0.9})`;
        ctx!.lineWidth = 2;
        ctx!.shadowColor = `hsla(${orb.hue}, 90%, 65%, ${alpha})`;
        ctx!.shadowBlur = 10;
        ctx!.stroke();

        ctx!.beginPath();
        ctx!.arc(x2, y2, 2, 0, TAU);
        ctx!.fillStyle = `hsla(${orb.hue}, 90%, 82%, ${alpha})`;
        ctx!.shadowBlur = 14;
        ctx!.fill();
      }

      animationFrame = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(animationFrame);
      window.clearInterval(ambientTimer);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointerleave", stopDragging);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box as="section" position="relative" overflow="hidden" minH={{ base: "60vh", md: "70vh" }} bg="black">
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", touchAction: "none" }}
      />

      <Box
        position="absolute"
        inset={0}
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        px={4}
        pointerEvents="none"
      >
        <Heading
          as="h1"
          fontSize={{ base: "6xl", md: "8xl" }}
          color="brand.400"
          style={{ textShadow: "0 0 48px rgba(168, 85, 247, 0.55)" }}
        >
          BASE.
        </Heading>
        <Text mt={4} fontSize={{ base: "xl", md: "2xl" }} color="fg.muted" letterSpacing="wide">
          The basement of subculture.
        </Text>
      </Box>
    </Box>
  );
});
