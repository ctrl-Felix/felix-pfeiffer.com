export type Entry = {
  title: string;
  org: string;
  period: string;
  points: string[];
};

export const profile = {
  name: "Felix Pfeiffer",
  headline: "MSc Information Security at UCL",
  location: "London, United Kingdom",
  languages: "German (native), French (native), English (fluent)",
  about:
    "Most attacks don't succeed because people are careless, but because systems make the wrong choice too easy. I want to build systems that are secure by design, so that people stay safe without even noticing.",
  education: [
    {
      title: "MSc Information Security",
      org: "University College London",
      period: "Oct 2026 – Sep 2027",
      points: ["Modules: Introduction to Cryptography, Computer Security I & II, Cybercrime"],
    },
    {
      title: "BSc Cyber Security & Computer Science",
      org: "University of Bonn",
      period: "Oct 2023 – Sep 2026",
      points: [
        "Grade 1.2, equivalent to First Class Honours",
        "Thesis at Fraunhofer FKIE: Detecting Domain Generation Algorithms in Malware Sandbox Reports",
      ],
    },
  ] satisfies Entry[],
  experience: [
    {
      title: "Student Assistant",
      org: "Fraunhofer IOSB",
      period: "Aug 2023 – Aug 2026",
      points: [
        "Developed a C++ prototype for 4Crypt, a module for cryptographically secured video processing",
        "Implemented threshold cryptography in Python for 4Crypt",
        "Integrated remote attestation into ROS2 and open62541 using Python and C++",
      ],
    },
    {
      title: "Internship",
      org: "BaFin",
      period: "Oct 2025 – Nov 2025",
      points: [
        "Contributed to BaFin's cyber threat picture by analysing public, vendor and internal audit data",
        "Supported a working group defining supervisory expectations for incident reporting under DORA",
        "Prepared materials for the German Financial Cyber Crisis Roundtable with CISOs of major German financial institutions",
      ],
    },
    {
      title: "Internship, IT Security & Identity and Access Management",
      org: "AXA",
      period: "Feb 2025 – May 2025",
      points: [
        "Wrote the governance concept for the Contrast Security IAST scanner and kicked off its rollout",
        "Defined ownership, prioritisation and deadlines for fixing findings",
        "Onboarded teams through sessions and a weekly Q&A call",
      ],
    },
  ] satisfies Entry[],
  ventures: [
    {
      title: "Co-founder",
      org: "Pakt",
      period: "Jan 2026 – Present",
      points: [
        "Goal-tracking app, live on iOS and Android, where users commit a self-chosen amount that is charged only if they miss their goal",
        "Designed and built the entire tech stack: Flutter app, Litestar API, PostgreSQL, Keycloak, Stripe and OneSignal",
      ],
    },
    {
      title: "Co-founder",
      org: "Cosmoshield",
      period: "Mar 2022 – Jul 2025",
      points: [
        "Recovered more than $3M in staked cryptocurrency for 500+ phishing victims worldwide",
        "Built tooling in Python and Rust to withdraw victims' staked funds, with their authorisation, the moment the unbonding period ended",
        "Built the client website with live chat, wallet ownership verification, scheduling and payments",
      ],
    },
  ] satisfies Entry[],
  skills: [
    { label: "Security tools", value: "Contrast Security (IAST), SonarQube and CodeQL (SAST), Dependabot, Wireshark, Nmap, OpenSSL, Keycloak (OAuth/OIDC)" },
    { label: "Security concepts", value: "OWASP Top 10, MITRE ATT&CK, threshold cryptography, remote attestation" },
    { label: "Languages", value: "Python, C++, C, Rust, Go, Dart, TypeScript, JavaScript, SQL, Bash, PHP" },
    { label: "Frameworks", value: "Flutter, React, Litestar, FastAPI, Cosmos SDK, Protobuf/gRPC, Symfony" },
    { label: "Infrastructure", value: "Linux, Proxmox, Docker, Nginx, Redis, GitHub Actions, Stripe, Ollama" },
  ],
};
