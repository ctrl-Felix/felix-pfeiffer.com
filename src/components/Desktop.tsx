"use client";

import { allApps } from "./apps";
import DesktopIcons from "./DesktopIcons";
import Dock from "./Dock";
import MenuBar from "./MenuBar";
import { WindowProvider } from "./windows/WindowManager";

export default function Desktop() {
  return (
    <WindowProvider apps={allApps}>
      <MenuBar />
      <DesktopIcons />
      <Dock />
    </WindowProvider>
  );
}
