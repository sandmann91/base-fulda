import { useEffect, useMemo, useState } from "react";
import { Heading } from "@chakra-ui/react";
import type { HeadingProps } from "@chakra-ui/react";

// Schlagschatten komplett in der Markenfarbe (kein weißer Kern) — mehrere
// Ebenen mit wachsender Streuung sorgen trotzdem für Tiefe im Glow.
const NEON_SHADOW = [
  "0 0 4px rgba(168, 85, 247, 0.9)",
  "0 0 8px rgba(168, 85, 247, 0.7)",
  "0 0 16px rgba(168, 85, 247, 0.55)",
  "0 0 32px rgba(168, 85, 247, 0.35)",
  "0 0 64px rgba(168, 85, 247, 0.2)",
].join(", ");

const FLICKER_CHANCE = 0.15;

/**
 * Ein einzelner, unabhängig flackernder Buchstabe. JS-Timeouts statt CSS-
 * Keyframes, weil Häufigkeit (Pause zwischen Blinks) und Blink-Dauer damit
 * unabhängig voneinander bleiben — bei einer CSS-@keyframes-Loop hängt die
 * Dip-Länge zwangsläufig an der animation-duration (länger = seltener, aber
 * jeder Dip wird dabei auch länger/langsamer statt nur seltener).
 */
function FlickerChar({ char }: { char: string }) {
  const [dim, setDim] = useState(false);

  useEffect(() => {
    let timeoutId: number;

    function scheduleNext() {
      const delayUntilFlicker = 4000 + Math.random() * 10000;
      timeoutId = window.setTimeout(() => {
        setDim(true);
        const dimDuration = 60 + Math.random() * 120;
        timeoutId = window.setTimeout(() => {
          setDim(false);
          scheduleNext();
        }, dimDuration);
      }, delayUntilFlicker);
    }
    scheduleNext();

    return () => window.clearTimeout(timeoutId);
  }, []);

  return <span style={{ display: "inline-block", opacity: dim ? 0.25 : 1 }}>{char}</span>;
}

function withFlickerChars(text: string) {
  return text.split("").map((char, index) =>
    /\S/.test(char) && Math.random() < FLICKER_CHANCE ? (
      // eslint-disable-next-line react/no-array-index-key
      <FlickerChar key={index} char={char} />
    ) : (
      char
    ),
  );
}

/**
 * Section-Überschrift im Neonröhren-Look: durchgehender Glow in der
 * Markenfarbe, zusätzlich flackern einzelne, zufällig ausgewählte Buchstaben
 * unabhängig voneinander (statt die ganze Überschrift synchron abzudunkeln).
 */
export function NeonHeading({ style, children, ...props }: HeadingProps) {
  const content = useMemo(
    () => (typeof children === "string" ? withFlickerChars(children) : children),
    [children],
  );

  return (
    <Heading
      color="brand.500"
      fontSize={{ base: "4xl", md: "6xl" }}
      style={{ textShadow: NEON_SHADOW, ...style }}
      {...props}
    >
      {content}
    </Heading>
  );
}
