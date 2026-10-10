"use client";

import { useState } from "react";
import { links } from "@/config";
import { profile } from "@/data/profile";
import { glyphs } from "./Icons";
import { useWindow } from "./windows/context";
import TrafficLights from "./windows/TrafficLights";
import { EntryGroup, Group, Row } from "./ProfileParts";

const sections = [
  { id: "overview", label: "Overview", glyph: glyphs.person, color: "#0a84ff" },
  { id: "experience", label: "Experience", glyph: glyphs.experience, color: "#30b050" },
  { id: "ventures", label: "Ventures", glyph: glyphs.ventures, color: "#ff9500" },
  { id: "education", label: "Education", glyph: glyphs.education, color: "#5e5ce6" },
  { id: "skills", label: "Skills", glyph: glyphs.skills, color: "#8e8e93" },
] as const;

type SectionId = (typeof sections)[number]["id"];

function Avatar({ size }: { size: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#9aa4b5] to-[#6b7686] font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      FP
    </span>
  );
}

function Content({ section }: { section: SectionId }) {
  switch (section) {
    case "experience":
      return <EntryGroup entries={profile.experience} />;
    case "ventures":
      return <EntryGroup entries={profile.ventures} />;
    case "education":
      return <EntryGroup entries={profile.education} />;
    case "skills":
      return (
        <Group>
          {profile.skills.map((skill) => (
            <Row key={skill.label} label={skill.label} value={skill.value} stacked />
          ))}
        </Group>
      );
    default:
      return (
        <>
          <div className="flex flex-col items-center gap-1 pb-5 pt-2 text-center">
            <Avatar size={92} />
            <h2 className="mt-2 text-2xl font-semibold">{profile.name}</h2>
            <p className="text-sm text-black/50">{profile.headline}</p>
          </div>
          <Group>
            <Row label="About" value={profile.about} stacked />
          </Group>
          <Group>
            <Row label="Location" value={profile.location} />
            <Row label="Languages" value={profile.languages} />
            <Row label="Email" value={links.email} href={links.mail} track="email" />
            <Row label="GitHub" value="ctrl-Felix" href={links.github} external track="github" />
            <Row label="LinkedIn" value="felixpf" href={links.linkedin} external track="linkedin" />
          </Group>
        </>
      );
  }
}

export default function ProfileWindow() {
  const [section, setSection] = useState<SectionId>("overview");
  const { dragProps } = useWindow();
  const current = sections.find((item) => item.id === section)!;

  return (
    <div className="flex h-full bg-[#f5f5f7]/85 text-[#1d1d1f]">
      <aside className="hidden w-60 shrink-0 flex-col bg-white/40 md:flex">
        <div className="flex h-12 items-center gap-2 px-4" {...dragProps}>
          <TrafficLights />
        </div>
        <div className="flex items-center gap-3 px-4 pb-4 pt-1">
          <Avatar size={44} />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">{profile.name}</p>
            <p className="truncate text-xs text-black/50">Profile</p>
          </div>
        </div>
        <nav className="flex flex-col gap-0.5 px-3">
          {sections.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px] ${section === item.id ? "bg-[#0a84ff] text-white" : "hover:bg-black/5"}`}
            >
              <span className="h-6 w-6 rounded-md" style={{ background: item.color }}>{item.glyph}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <section className="flex min-w-0 flex-1 flex-col bg-[#f2f2f7]/70">
        <div className="flex h-12 shrink-0 items-center gap-2 px-4 md:justify-center" {...dragProps}>
          <TrafficLights className="md:hidden" />
          <h1 className="text-[15px] font-semibold">{current.label}</h1>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2 md:hidden">
          {sections.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs ${section === item.id ? "bg-[#0a84ff] text-white" : "bg-black/5"}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="flex-1 overflow-y-auto px-5 pb-6 pt-1 md:px-8">
          <Content section={section} />
        </div>
      </section>
    </div>
  );
}
