import Link from "next/link";
import { links, site } from "@/config";
import { aboutPage } from "@/data/about";
import { profile, type Entry } from "@/data/profile";
import { toolInfos } from "@/data/tools";

const card = "rounded-3xl bg-[#1c1c1e]/70 p-5 backdrop-blur-xl shadow-[0_0_0_0.5px_rgba(255,255,255,0.12)]";
const external = { rel: "noopener noreferrer", target: "_blank" };

function Entries({ heading, entries }: { heading: string; entries: Entry[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{heading}</h2>
      {entries.map((entry) => (
        <article key={entry.title + entry.org} className={card}>
          <h3 className="font-semibold">
            {entry.title}, {entry.org}
          </h3>
          <p className="text-xs text-white/55">{entry.period}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/75">
            {entry.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}

export default function AboutPage() {
  return (
    <div className="wallpaper fixed inset-0 overflow-y-auto text-white">
      <header className="glass fixed inset-x-3 top-3 z-10 mx-auto flex max-w-3xl items-center justify-between rounded-full px-4 py-2 text-sm">
        <Link href="/" className="font-medium">‹ Desktop</Link>
        <span className="font-semibold">About</span>
        <Link href="/tools" className="text-xs text-white/80">Tools</Link>
      </header>
      <main className="mx-auto max-w-3xl space-y-4 px-4 pb-16 pt-20">
        <div>
          <h1 className="text-3xl font-bold">{aboutPage.heading}</h1>
          <p className="mt-1 text-white/70">{profile.headline}</p>
          <p className="mt-3 text-white/85">{aboutPage.lead}</p>
          <blockquote className="mt-3 border-l-2 border-white/40 pl-3 text-sm text-white/75">“{profile.about}”</blockquote>
        </div>

        <section className={card}>
          <h2 className="text-xl font-semibold">Quick facts</h2>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            {aboutPage.facts.map((fact) => (
              <div key={fact.label} className="contents">
                <dt className="text-white/55">{fact.label}</dt>
                <dd className="text-white/85">
                  {fact.href ? <a className="underline" href={fact.href} {...external}>{fact.value}</a> : fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <Entries heading="Experience" entries={profile.experience} />
        <Entries heading="Ventures" entries={profile.ventures} />
        <Entries heading="Education" entries={profile.education} />

        <section className={card}>
          <h2 className="text-xl font-semibold">Open source</h2>
          <ul className="mt-2 space-y-1 text-sm text-white/75">
            {profile.openSource.map((project) => (
              <li key={project.name}>
                <a className="font-medium text-white underline" href={project.url} {...external}>{project.name}</a>: {project.description}
              </li>
            ))}
            {toolInfos.map((tool) => (
              <li key={tool.id}>
                <Link className="font-medium text-white underline" href={`/tools/${tool.id}`}>{tool.name}</Link>: {tool.description}
              </li>
            ))}
          </ul>
        </section>

        <section className={card}>
          <h2 className="text-xl font-semibold">Skills</h2>
          <dl className="mt-2 space-y-2 text-sm">
            {profile.skills.map((skill) => (
              <div key={skill.label}>
                <dt className="text-white/55">{skill.label}</dt>
                <dd className="text-white/85">{skill.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Questions</h2>
          {aboutPage.faq.map((item) => (
            <div key={item.question} className={card}>
              <h3 className="font-semibold">{item.question}</h3>
              <p className="mt-1 text-sm text-white/70">{item.answer}</p>
            </div>
          ))}
        </section>

        <p className="text-center text-xs text-white/60">
          <a className="underline" href={links.github} {...external}>GitHub</a> ·{" "}
          <a className="underline" href={links.linkedin} {...external}>LinkedIn</a> ·{" "}
          <a className="underline" href={links.mail}>Email</a> · Updated {aboutPage.updated} ·{" "}
          <Link href="/" className="underline">{site.name}</Link>
        </p>
      </main>
    </div>
  );
}
