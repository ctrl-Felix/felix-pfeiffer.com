"use client";

import { useState } from "react";
import { glyphs } from "@/components/Icons";
import { Group, Row } from "@/components/ProfileParts";
import { useWindow } from "@/components/windows/context";
import { useWindows } from "@/components/windows/WindowManager";
import TrafficLights from "@/components/windows/TrafficLights";
import { links } from "@/config";
import { profile } from "@/data/profile";
import { trackClick } from "@/lib/track";

const views = [
  { id: "glance", title: "Felix in 30 seconds", subtitle: "Who I am, what I study and where I worked.", glyph: glyphs.person, color: "#0a84ff" },
  { id: "why", title: "Why hire me", subtitle: "What I bring to a security team, with proof.", glyph: glyphs.reasons, color: "#ff9500" },
  { id: "beyond", title: "Beyond the CV", subtitle: "What drives me and what I build in my free time.", glyph: glyphs.heart, color: "#ff375f" },
] as const;

type ViewId = (typeof views)[number]["id"];

const { recruiter, education, experience, ventures } = profile;

const beyond = [
  { title: "What drives me", text: profile.about },
  { title: "Open source", text: profile.openSource.map((project) => `${project.name}: ${project.description}.`).join(" ") },
  { title: "This website", text: recruiter.website },
];

function Glance() {
  const [current, previous] = education;
  return (
    <>
      <p className="mb-4 text-[15px] leading-relaxed">{recruiter.pitch}</p>
      <Group>
        <Row label="Studying" value={`${current.title}, ${current.org} (${current.period})`} stacked />
        <Row label="Before" value={`${previous.title}, ${previous.org}. ${previous.points[0]}`} stacked />
        <Row label="Experience" value={experience.map((entry) => `${entry.org} (${entry.period})`).join(", ")} stacked />
        <Row label="Founded" value={ventures.map((entry) => entry.org).join(" and ")} stacked />
      </Group>
      <Group>
        <Row label="Based in" value={profile.location} />
        <Row label="Languages" value={profile.languages} stacked />
      </Group>
    </>
  );
}

function Cards({ items }: { items: { title: string; text: string }[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <section key={item.title} className="rounded-xl bg-white/80 px-4 py-3 shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)]">
          <h3 className="text-sm font-semibold">{item.title}</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-black/60">{item.text}</p>
        </section>
      ))}
    </div>
  );
}

function Home({ onPick }: { onPick: (id: ViewId) => void }) {
  return (
    <>
      <div className="pb-5 pt-2 text-center">
        <h2 className="text-2xl font-semibold">{recruiter.greeting}</h2>
        <p className="mt-1 text-sm text-black/50">{recruiter.prompt}</p>
      </div>
      <div className="space-y-3">
        {views.map((view) => (
          <button
            key={view.id}
            type="button"
            onClick={() => onPick(view.id)}
            className="flex w-full items-center gap-3 rounded-2xl bg-white/80 p-3 text-left shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)] hover:bg-white"
          >
            <span className="h-10 w-10 shrink-0 rounded-xl p-1.5" style={{ background: view.color }}>{view.glyph}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{view.title}</span>
              <span className="block text-xs text-black/55">{view.subtitle}</span>
            </span>
            <span className="text-black/30" aria-hidden="true">›</span>
          </button>
        ))}
      </div>
    </>
  );
}

function Contact() {
  const { open } = useWindows();
  const button = "rounded-lg px-3 py-1.5 text-[13px] font-medium";
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 border-t border-black/10 px-4 py-3">
      <span className="text-[13px] text-black/55">Interested?</span>
      <button type="button" onClick={() => { trackClick("mail"); open("mail"); }} className={`${button} bg-[#0a84ff] text-white`}>
        Write me
      </button>
      <a href={links.linkedin} target="_blank" rel="noopener noreferrer" onClick={() => trackClick("linkedin")} className={`${button} bg-black/6`}>
        LinkedIn
      </a>
      <a href="/about" className={`${button} bg-black/6`}>
        Full profile
      </a>
    </div>
  );
}

export default function RecruiterWindow() {
  const { dragProps } = useWindow();
  const [view, setView] = useState<ViewId | null>(null);
  const current = views.find((item) => item.id === view);

  return (
    <div className="flex h-full flex-col bg-[#f5f5f7]/90 text-[#1d1d1f]">
      <div className="flex h-12 shrink-0 items-center gap-4 border-b border-black/10 px-4" {...dragProps}>
        <TrafficLights />
        {current ? (
          <>
            <button type="button" onClick={() => setView(null)} className="text-sm text-[#0a84ff]">‹ Back</button>
            <h1 className="flex-1 pr-24 text-center text-[13px] font-semibold">{current.title}</h1>
          </>
        ) : (
          <h1 className="flex-1 pr-14 text-center text-[13px] font-semibold">For recruiters</h1>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-4 md:px-8">
        {view === "glance" && <Glance />}
        {view === "why" && <Cards items={recruiter.reasons} />}
        {view === "beyond" && <Cards items={beyond} />}
        {!view && <Home onPick={setView} />}
      </div>
      <Contact />
    </div>
  );
}
