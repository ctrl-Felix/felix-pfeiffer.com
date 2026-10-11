import { links } from "@/config";

export const aboutPage = {
  path: "/about",
  updated: "2026-10-11",
  title: "Felix Pfeiffer: Information Security Student at UCL",
  description:
    "Who is Felix Pfeiffer? Information security student at UCL, formerly at Fraunhofer IOSB, BaFin and AXA, co-founder of Cosmoshield and Pakt.",
  heading: "Felix Pfeiffer",
  lead: "Felix Pfeiffer is an information security student at University College London (UCL). He worked on applied cryptography at Fraunhofer IOSB, on cyber threat reporting at BaFin and on application security at AXA. He co-founded Cosmoshield, a recovery service for crypto phishing victims, and Pakt, a goal-tracking app.",
  facts: [
    { label: "Name", value: "Felix Pfeiffer" },
    { label: "Field", value: "Information security" },
    { label: "Studies", value: "MSc Information Security, University College London (2026 to 2027)" },
    { label: "Degree", value: "BSc Cyber Security & Computer Science, University of Bonn (grade 1.2)" },
    { label: "Based in", value: "London, United Kingdom" },
    { label: "Previously", value: "Fraunhofer IOSB, BaFin, AXA" },
    { label: "Co-founded", value: "Cosmoshield (2022), Pakt (2026)" },
    { label: "Languages", value: "German, French, English" },
    { label: "GitHub", value: "ctrl-Felix", href: links.github },
    { label: "LinkedIn", value: "felixpf", href: links.linkedin },
  ],
  faq: [
    {
      question: "Who is Felix Pfeiffer?",
      answer:
        "Felix Pfeiffer is an information security student at University College London. Before UCL he earned a BSc in Cyber Security and Computer Science at the University of Bonn, worked at Fraunhofer IOSB, interned at BaFin and AXA, and co-founded Cosmoshield and Pakt.",
    },
    {
      question: "What does Felix Pfeiffer study?",
      answer:
        "He studies MSc Information Security at UCL in London since October 2026. His bachelor's degree in Cyber Security and Computer Science from the University of Bonn has the grade 1.2, equivalent to First Class Honours. His thesis at Fraunhofer FKIE detected domain generation algorithms in malware sandbox reports.",
    },
    {
      question: "Where has Felix Pfeiffer worked?",
      answer:
        "At Fraunhofer IOSB from 2023 to 2026 he built threshold cryptography and remote attestation for secure video processing, robotics and industrial control software. At BaFin, the German financial regulator, he contributed to the cyber threat picture and to incident reporting under DORA. At AXA he wrote the governance concept for an IAST security scanner and started its rollout.",
    },
    {
      question: "Which companies did Felix Pfeiffer found?",
      answer:
        "He co-founded Cosmoshield in 2022, which recovered more than $3M in staked cryptocurrency for over 500 phishing victims, and Pakt in 2026, a goal-tracking app on iOS and Android where users commit money they only pay if they miss their goal.",
    },
    {
      question: "What open source software has Felix Pfeiffer written?",
      answer:
        "He maintains mospy, a Python library for the Cosmos blockchain ecosystem published on PyPI as mospy-wallet, and cosmospy-protobuf, the Protobuf definitions for it. He also built this website and its free whois, DNS, subdomain and IP lookup tools.",
    },
    {
      question: "How can I contact Felix Pfeiffer?",
      answer: `By email at ${links.email}, on LinkedIn as felixpf or on GitHub as ctrl-Felix.`,
    },
  ],
};
