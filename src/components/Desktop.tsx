"use client";

import { useEffect } from "react";
import { applyOptOutFromUrl, trackVisit } from "@/lib/track";
import { allApps } from "./apps";
import { setPendingLaunch, type Launch } from "./deepLink";
import DesktopIcons from "./DesktopIcons";
import Dock from "./Dock";
import MenuBar from "./MenuBar";
import { useWindows, WindowProvider } from "./windows/WindowManager";

type Props = { launch?: Launch & { appId: string } };

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

export default function Desktop({ launch }: Props) {
  useEffect(() => {
    applyOptOutFromUrl();
    trackVisit();
  }, []);

  return (
    <WindowProvider apps={allApps}>
      <Launcher launch={launch} />
      <MenuBar />
      <DesktopIcons />
      <Dock />
    </WindowProvider>
  );
}
