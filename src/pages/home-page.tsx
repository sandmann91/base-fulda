import { Container, Heading, Stack, Text } from "@chakra-ui/react";
import { Seo } from "@/components/seo/seo";
import { VideoHero } from "@/components/hero/video-hero";
import { EventList } from "@/components/events/event-list";

const DESCRIPTION =
  "BASE. ist der Club für Subkultur, elektronische Musik und Awareness in Fulda. Events, Partys und ein sicherer Raum für alle. Komm wie du bist!";

export function HomePage() {
  return (
    <>
      <Seo title="Subkultur Club & Events" description={DESCRIPTION} canonicalPath="/" />
      <VideoHero />
      <Container maxW="6xl" py={16}>
        <Stack gap={4} mb={12}>
          <Heading as="h2" size="lg">
            Club
          </Heading>
          <Text>
            Subkultur braucht einen Raum. Eine Basis, auf der Kreativität und Ekstase wachsen können. base. ist
            dieser Raum. In den Tiefen unseres Clubs feiern wir die rohe Energie der Underground-Subkultur.
          </Text>
          <Text>Wir sind die base. für deine Nacht.</Text>
          <Text>Wir glauben an Selbstentfaltung und den Respekt voreinander. Komm wie du bist, tanz wie du willst.</Text>
          <Text>Kein Platz für Diskriminierung. Viel Platz für dich.</Text>
        </Stack>

        <Stack gap={4} mb={12}>
          <Heading as="h2" size="lg">
            Events
          </Heading>
          <EventList />
        </Stack>

        <Stack gap={4}>
          <Heading as="h2" size="lg">
            Awareness
          </Heading>
          <Text>
            Wir von der BASE möchten, dass ihr bei uns einen sicheren Ort zum raven habt, an dem sich möglichst alle
            wohlfühlen können.
          </Text>
          <Text>
            Deshalb wird bei uns jegliches diskriminierendes, übergriffiges oder gewalttätiges Verhalten nicht
            toleriert und führt zu sofortigem Rausschmiss.
          </Text>
          <Text>Des Weiteren gilt:</Text>
          <Stack as="ul" gap={2} pl={5} style={{ listStyle: "disc" }}>
            <li>RAUCHVERBOT im kompletten Innenraum 🚭</li>
            <li>
              NO NIPPLES ❌❌ auch wenn es manchmal sehr warm wird beim raven, können sich Leute belästigt fühlen,
              wenn ihr Oberkörper frei tanzt, deshalb verdeckt mindestens eure Nippel, egal welches Geschlecht ihr
              habt
            </li>
            <li>kein offener Konsum von illegalen Substanzen</li>
            <li>keine Fotos und Videos 📵</li>
          </Stack>
          <Text>
            Dass diese unvermeidlichen Regeln durchgesetzt werden, gibt es das Awareness Team, welches ihr an den
            rot leuchtenden Bändchen erkennt!
          </Text>
          <Text>
            Ihr könnt das "A-Team" oder auch andere Personal jederzeit ansprechen wenn ihr euch durch andere unwohl
            fühlt, wir hören zu und helfen euch damit wir weiter zusammen feiern können und uns die BASE noch lange
            erhalten bleibt, habt euch lieb und achtet auf euch und andere
          </Text>
        </Stack>
      </Container>
    </>
  );
}
