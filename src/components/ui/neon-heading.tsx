import "./neon-heading.css";
import { useMemo } from "react";
import type { ReactNode } from "react";
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

const FLICKER_CHANCE = 0.35;

function withFlickerChars(text: string): ReactNode {
  return text.split("").map((char, index) => {
    if (!/\S/.test(char) || Math.random() >= FLICKER_CHANCE) {
      return char;
    }
    const delay = (Math.random() * 3).toFixed(2);
    const duration = (2.4 + Math.random() * 2).toFixed(2);
    return (
      <span
        // eslint-disable-next-line react/no-array-index-key
        key={index}
        className="neon-flicker-char"
        style={{ animationDelay: `${delay}s`, animationDuration: `${duration}s` }}
      >
        {char}
      </span>
    );
  });
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
