export function AppleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}

const RADIUS = 14.4;

function Tile({ id, from, to, children }: { id: string; from: string; to: string; children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full [filter:drop-shadow(0_3px_5px_rgba(0,0,0,0.28))]">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
        <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="white" stopOpacity="0.38" />
          <stop offset="0.5" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      <clipPath id={`${id}-clip`}>
        <rect width="64" height="64" rx={RADIUS} />
      </clipPath>
      <rect width="64" height="64" rx={RADIUS} fill={`url(#${id}-bg)`} />
      <g clipPath={`url(#${id}-clip)`}>{children}</g>
      <rect width="64" height="64" rx={RADIUS} fill={`url(#${id}-gloss)`} />
      <rect x="0.5" y="0.5" width="63" height="63" rx={RADIUS - 0.5} fill="none" stroke="white" strokeOpacity="0.35" />
      <rect x="0.5" y="0.5" width="63" height="63" rx={RADIUS - 0.5} fill="none" stroke="black" strokeOpacity="0.12" strokeWidth="0.5" />
    </svg>
  );
}

export function GithubIcon() {
  return (
    <Tile id="gh" from="#3b4048" to="#0e1013">
      <g transform="translate(11 11) scale(1.75)" fill="white">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </g>
    </Tile>
  );
}

export function MailIcon() {
  return (
    <Tile id="ml" from="#6bd3ff" to="#0a6cf0">
      <rect x="10" y="16" width="44" height="32" rx="5" fill="white" />
      <path d="M12 21.5l20 14.5 20-14.5" fill="none" stroke="#2a8cf5" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </Tile>
  );
}

export function ProfileIcon() {
  return (
    <Tile id="pf" from="#fbfbfd" to="#d6d6dc">
      <rect x="0" y="0" width="10" height="64" fill="#c9a77a" opacity="0.9" />
      <circle cx="35" cy="26" r="9.5" fill="#8e8e96" />
      <path d="M17 52c1-10 8-15 18-15s17 5 18 15z" fill="#8e8e96" />
    </Tile>
  );
}

export function StocksIcon() {
  return (
    <Tile id="st" from="#2c2c2e" to="#000000">
      <g stroke="white" strokeOpacity="0.12">
        <path d="M8 20h48M8 32h48M8 44h48" />
      </g>
      <path d="M8 46l12-10 9 6 11-16 8 7 8-14" fill="none" stroke="#30d158" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 46l12-10 9 6 11-16 8 7 8-14V56H8z" fill="#30d158" opacity="0.16" />
    </Tile>
  );
}

export function StatsIcon() {
  return (
    <Tile id="sx" from="#ff9f0a" to="#ff375f">
      <rect x="13" y="34" width="8" height="16" rx="2.5" fill="white" />
      <rect x="28" y="22" width="8" height="28" rx="2.5" fill="white" />
      <rect x="43" y="12" width="8" height="38" rx="2.5" fill="white" />
    </Tile>
  );
}

export function ToolsIcon() {
  return (
    <Tile id="tl" from="#8a91a0" to="#2d3039">
      <defs>
        <linearGradient id="tl-metal" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#e6e9f0" />
          <stop offset="1" stopColor="#aeb5c4" />
        </linearGradient>
        <linearGradient id="tl-grip" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffbe4d" />
          <stop offset="1" stopColor="#ff7a00" />
        </linearGradient>
        <mask id="tl-wrench" maskUnits="userSpaceOnUse" x="-20" y="-40" width="40" height="80">
          <rect x="-20" y="-40" width="40" height="80" fill="#fff" />
          <rect x="-4.6" y="-34" width="9.2" height="14" rx="1.8" fill="#000" />
          <circle cx="0" cy="24" r="2.3" fill="#000" />
        </mask>
        <filter id="tl-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1.4" stdDeviation="1.2" floodColor="#000" floodOpacity="0.4" />
        </filter>
      </defs>
      <g transform="translate(32 32) rotate(45) scale(0.96)" filter="url(#tl-shadow)">
        <g mask="url(#tl-wrench)" fill="url(#tl-metal)">
          <circle cx="0" cy="-19" r="10.6" />
          <rect x="-3.4" y="-14" width="6.8" height="36" />
          <circle cx="0" cy="24" r="5.4" />
        </g>
      </g>
      <g transform="translate(32 32) rotate(-45) scale(0.96)" filter="url(#tl-shadow)">
        <path d="M-1.7 -29h3.4l0.9 6v21h-5.2v-21z" fill="url(#tl-metal)" />
        <rect x="-3.2" y="-4" width="6.4" height="4" rx="1" fill="#c9cfdb" />
        <rect x="-5.4" y="-1" width="10.8" height="30" rx="5.2" fill="url(#tl-grip)" />
        <g stroke="#fff" strokeOpacity="0.28" strokeWidth="1.2" strokeLinecap="round">
          <path d="M-3.4 8h6.8M-3.4 13h6.8M-3.4 18h6.8" />
        </g>
      </g>
    </Tile>
  );
}

export function WhoisIcon() {
  return (
    <Tile id="wh" from="#6bd3ff" to="#0a64e6">
      <g fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
        <circle cx="29" cy="29" r="14" />
        <path d="M15 29h28M29 15c-6 6-6 22 0 28M29 15c6 6 6 22 0 28" strokeWidth="2.2" />
        <path d="M40 40l10 10" strokeWidth="4.5" />
      </g>
    </Tile>
  );
}

export function LogoIcon() {
  return (
    <Tile id="lg" from="#5ac8fa" to="#0a64e6">
      <g fill="none" stroke="white" strokeWidth="6.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 17v30M15 17h12M15 31h9.5" />
        <path d="M36 47V17h5.5a7.5 7.5 0 0 1 0 15H36" />
      </g>
    </Tile>
  );
}

export function PathsIcon() {
  return (
    <Tile id="pa" from="#7fd6c2" to="#1b8f7a">
      <g fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M27 37l10-10" />
        <path d="M30 24l3-3a8.5 8.5 0 0 1 12 12l-3 3" />
        <path d="M34 40l-3 3a8.5 8.5 0 0 1-12-12l3-3" />
      </g>
    </Tile>
  );
}

export function ReaderIcon() {
  return (
    <Tile id="rd" from="#ffb04d" to="#ff7a00">
      <g fill="#fff">
        <path d="M13 20c6.5-3.4 13-3 19 1.2v27c-6-4.2-12.5-4.6-19-1.2z" />
        <path d="M51 20c-6.5-3.4-13-3-19 1.2v27c6-4.2 12.5-4.6 19-1.2z" fillOpacity="0.88" />
      </g>
      <path d="M32 21.2v27" stroke="#ff7a00" strokeOpacity="0.35" strokeWidth="1.2" />
    </Tile>
  );
}

export function MarkdownFileIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full [filter:drop-shadow(0_3px_5px_rgba(0,0,0,0.28))]">
      <defs>
        <linearGradient id="md-page" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e6e9ef" />
        </linearGradient>
      </defs>
      <path d="M14 4h26l12 12v42a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z" fill="url(#md-page)" />
      <path d="M40 4l12 12H43a3 3 0 0 1-3-3z" fill="#cfd3dc" />
      <rect x="18" y="14" width="14" height="3" rx="1.5" fill="#c4c9d4" />
      <rect x="18" y="21" width="22" height="3" rx="1.5" fill="#c4c9d4" />
      <rect x="18" y="28" width="18" height="3" rx="1.5" fill="#c4c9d4" />
      <rect x="11" y="38" width="42" height="16" rx="3.5" fill="#4b5563" />
      <text x="32" y="50" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff" fontFamily="system-ui, sans-serif">MD</text>
    </svg>
  );
}

export function FinderIcon() {
  return (
    <Tile id="fn" from="#8fdcff" to="#3a9af0">
      <path d="M32 0h18.5A13.5 13.5 0 0 1 64 13.5v37A13.5 13.5 0 0 1 50.5 64H38c3-14 1-42-6-64z" fill="#2f7fe6" />
      <path d="M21 21v7M44 21v7M18 41c9 8 22 8 30 0" fill="none" stroke="#0c2340" strokeWidth="3" strokeLinecap="round" />
      <path d="M33 12c1 10 2 22 5 30" fill="none" stroke="white" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" />
    </Tile>
  );
}

function Glyph({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full p-[22%]">
      {children}
    </svg>
  );
}

export const glyphs = {
  person: (
    <Glyph>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-5 4-7 8-7s7 2 8 7" />
    </Glyph>
  ),
  education: (
    <Glyph>
      <path d="M2 9l10-5 10 5-10 5z" />
      <path d="M6 11v5c3 2.5 9 2.5 12 0v-5" />
    </Glyph>
  ),
  experience: (
    <Glyph>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18" />
    </Glyph>
  ),
  ventures: (
    <Glyph>
      <path d="M12 3c4 2 6 6 5 11l-5 4-5-4c-1-5 1-9 5-11z" />
      <circle cx="12" cy="10" r="1.6" />
      <path d="M7 15l-3 4 4-1M17 15l3 4-4-1" />
    </Glyph>
  ),
  skills: (
    <Glyph>
      <path d="M14.5 6.5a4 4 0 0 0-5 5L3 18l3 3 6.5-6.5a4 4 0 0 0 5-5l-3 3-2-2z" />
    </Glyph>
  ),
};

export function Wifi() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="h-4 w-4">
      <path d="M2 9a14 14 0 0 1 20 0M5.5 12.5a9 9 0 0 1 13 0M9 16a4 4 0 0 1 6 0" />
      <circle cx="12" cy="19.5" r="1" fill="currentColor" />
    </svg>
  );
}

export function Battery() {
  return (
    <svg viewBox="0 0 28 14" className="h-3.5 w-7">
      <rect x="0.75" y="0.75" width="23" height="12.5" rx="3.5" fill="none" stroke="currentColor" opacity="0.6" strokeWidth="1.2" />
      <rect x="2.5" y="2.5" width="17" height="9" rx="2" fill="currentColor" />
      <rect x="25" y="4.5" width="2" height="5" rx="1" fill="currentColor" opacity="0.6" />
    </svg>
  );
}
