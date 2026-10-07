import Dock from "@/components/Dock";
import DesktopIcons from "@/components/DesktopIcons";
import Seo from "@/components/Seo";
import MenuBar from "@/components/MenuBar";

export default function Home() {
  return (
    <main className="wallpaper relative h-full w-full">
      <Seo />
      <MenuBar />
      <DesktopIcons />
      <Dock />
    </main>
  );
}
