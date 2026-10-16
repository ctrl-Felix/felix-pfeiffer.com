import Desktop from "@/components/Desktop";
import Seo from "@/components/Seo";
import { hideSeenWelcomeScript } from "@/components/welcome";

export default function Home() {
  return (
    <main className="wallpaper relative h-full w-full">
      <Seo />
      <script dangerouslySetInnerHTML={{ __html: hideSeenWelcomeScript }} />
      <Desktop welcome="profile" />
    </main>
  );
}
