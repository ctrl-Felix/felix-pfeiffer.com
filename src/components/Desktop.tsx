"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";
import { allApps } from "./apps";
import DesktopIcons from "./DesktopIcons";
import Dock from "./Dock";
import MenuBar from "./MenuBar";
import { WindowProvider } from "./windows/WindowManager";

export default function Desktop() {
  useEffect(() => {
    track({ kind: "visit" });
  }, []);

  return (
    <WindowProvider apps={allApps}>
      <MenuBar />
      <DesktopIcons />
      <Dock />
    </WindowProvider>
  );
}
