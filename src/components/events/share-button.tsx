import { useEffect, useState } from "react";
import { Button } from "@chakra-ui/react";
import { Check, Share2 } from "lucide-react";

interface ShareButtonProps {
  title: string;
  url: string;
}

/**
 * Auf dem Handy öffnet sich der native Teilen-Dialog (WhatsApp, Instagram, ...).
 * Wo es den nicht gibt (meist Desktop), wird der Link in die Zwischenablage kopiert.
 */
export function ShareButton({ title, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeoutId = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // Dialog abgebrochen — nichts zu tun
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt("Link kopieren:", url);
    }
  }

  return (
    <Button variant="ghost" onClick={handleShare} mr={-4}>
      {copied ? <Check /> : <Share2 />} {copied ? "Link kopiert" : "Teilen"}
    </Button>
  );
}
