"use client";

import { useEffect } from "react";
import { allApps } from "./apps";
import { setPendingLaunch, type Launch } from "./deepLink";
import DesktopIcons from "./DesktopIcons";
import Dock from "./Dock";
import MenuBar from "./MenuBar";
import VisitTracker from "./VisitTracker";
import { useWindows, WindowProvider } from "./windows/WindowManager";

type Props = { launch?: Launch & { appId: string }; welcome?: string };

function Launcher({ launch }: Props) {
  const { open } = useWindows();

  useEffect(() => {
    if (!launch) return;
    const domain = new URLSearchParams(window.location.search).get("domain") ?? undefined;
    setPendingLaunch({ toolId: launch.toolId, domain });
    open(launch.appId, { maximized: true });
  }, [launch, open]);

  return null;
}

export default function Desktop({ launch, welcome }: Props) {
  return (
    <WindowProvider apps={allApps} welcome={welcome}>
      <VisitTracker />
      <Launcher launch={launch} />
      <MenuBar />
      <DesktopIcons />
      <Dock />
    </WindowProvider>
  );
}
