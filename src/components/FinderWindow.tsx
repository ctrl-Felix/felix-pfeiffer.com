"use client";

import { useWindow } from "./windows/context";
import TrafficLights from "./windows/TrafficLights";

export default function FinderWindow() {
  const { dragProps } = useWindow();
  return (
    <div className="flex h-full flex-col bg-[#f5f5f7]/90 text-[#1d1d1f]">
      <div className="flex h-12 shrink-0 items-center border-b border-black/10 px-4" {...dragProps}>
        <TrafficLights />
        <h1 className="flex-1 pr-14 text-center text-[13px] font-semibold">Finder</h1>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-black/45">Implementation in progress</p>
      </div>
    </div>
  );
}
