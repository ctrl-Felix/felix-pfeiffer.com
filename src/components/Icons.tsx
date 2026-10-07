export function AppleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}

export function GithubIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full drop-shadow-md">
      <defs>
        <linearGradient id="gh" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a3f47" />
          <stop offset="1" stopColor="#14171c" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#gh)" />
      <g transform="translate(10 10) scale(1.83)" fill="white">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </g>
    </svg>
  );
}

export function MailIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full drop-shadow-md">
      <defs>
        <linearGradient id="ml" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5ac8fa" />
          <stop offset="1" stopColor="#1a7cf5" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#ml)" />
      <rect x="11" y="17" width="42" height="30" rx="4" fill="white" />
      <path d="M13 21l19 15 19-15" fill="none" stroke="#1a7cf5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CvIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full drop-shadow-md">
      <path d="M14 4h26l12 12v42a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="white" />
      <path d="M40 4l12 12H42a2 2 0 0 1-2-2z" fill="#d8d8de" />
      <rect x="12" y="34" width="40" height="16" fill="#e5352b" />
      <text x="32" y="46.5" textAnchor="middle" fontSize="12" fontWeight="700" fill="white" fontFamily="system-ui, sans-serif">CV</text>
      <rect x="18" y="14" width="14" height="3" rx="1.5" fill="#c9c9d1" />
      <rect x="18" y="21" width="20" height="3" rx="1.5" fill="#c9c9d1" />
      <rect x="18" y="28" width="16" height="3" rx="1.5" fill="#c9c9d1" />
    </svg>
  );
}

export function FinderIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full drop-shadow-md">
      <defs>
        <linearGradient id="fn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6fd3ff" />
          <stop offset="1" stopColor="#1c7df0" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#fn)" />
      <path d="M32 0h18a14 14 0 0 1 14 14v36a14 14 0 0 1-14 14H36C38 48 36 20 32 0z" fill="white" opacity="0.92" />
      <path d="M20 22v6M44 22v6M18 42c8 7 20 7 28 0" fill="none" stroke="#10243f" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

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
