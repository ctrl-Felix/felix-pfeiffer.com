import Desktop from "@/components/Desktop";
import MenuBar from "@/components/MenuBar";
import Seo from "@/components/Seo";

export default function Home() {
  return (
    <main className="wallpaper relative h-full w-full">
      <Seo />
      <MenuBar />
      <Desktop />
    </main>
  );
}
