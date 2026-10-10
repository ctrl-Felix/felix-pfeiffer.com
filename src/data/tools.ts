export type ToolInfo = {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  updated: string;
  seo: {
    title: string;
    description: string;
    heading: string;
    features: string[];
    paragraphs: string[];
    steps: string[];
    faq: { question: string; answer: string }[];
  };
};

export const toolInfos: ToolInfo[] = [
  {
    id: "whois",
    name: "Whois",
    description: "Look up who registered a domain, when it expires and which name servers it uses.",
    keywords: ["domain", "dns", "rdap", "registrar", "nameserver", "lookup"],
    updated: "2026-10-10",
    seo: {
      title: "Free Whois Lookup: Domain Registrar and Expiry Date",
      description:
        "Free whois lookup: check if a domain is registered, its registrar, expiry date and name servers. No sign up, nothing stored. Works with AI assistants via MCP.",
      heading: "Free whois lookup: check any domain",
      features: [
        "Registered or available",
        "Registrar",
        "Creation, update and expiry date",
        "Name servers and DNSSEC",
        "Domain status flags",
        "MCP server for AI assistants",
      ],
      paragraphs: [
        "Enter a domain name such as example.com to see whether it is registered, which registrar manages it, when it was created, last updated and when it expires. The result also shows the domain status flags, the name servers and whether DNSSEC is enabled.",
        "The lookup uses RDAP, the modern JSON based successor of the classic WHOIS protocol, and falls back to the WHOIS text protocol on port 43 for domain endings that do not offer RDAP. Personal registrant details are usually redacted by registries and are not shown.",
        "The tool is free, needs no account and does not store the domains you look up. AI assistants such as Claude can use the same lookup through an open MCP server at https://felix-pfeiffer.com/mcp, together with a DNS record lookup.",
      ],
      steps: [
        "Open the tool and type a domain name or paste a link.",
        "Press Look up.",
        "Read the registration dates, registrar, status and name servers. Open Raw data to see the full registry response.",
      ],
      faq: [
        {
          question: "What is a whois lookup?",
          answer: "A whois lookup shows the public registration record of a domain name: the registrar, the dates it was created and when it expires, its status and the name servers it uses.",
        },
        {
          question: "Can I see who owns a domain?",
          answer: "Usually not. Since data protection rules such as the GDPR, most registries redact the name and contact details of the registrant. You still see the registrar, dates and name servers.",
        },
        {
          question: "How can I check when a domain expires?",
          answer: "Look up the domain and read the Expires field. It shows the expiry date and how many days are left.",
        },
        {
          question: "What is the difference between RDAP and WHOIS?",
          answer: "RDAP is the newer standard that returns structured JSON from the registry. WHOIS is the older plain text protocol. This tool uses RDAP first and falls back to WHOIS when a domain ending has no RDAP service.",
        },
        {
          question: "Can an AI assistant use this whois lookup?",
          answer: "Yes. The tool is available as an MCP server at https://felix-pfeiffer.com/mcp. Add it as a custom connector in Claude or with the command claude mcp add --transport http security https://felix-pfeiffer.com/mcp in Claude Code.",
        },
        {
          question: "Are my lookups stored?",
          answer: "No. The domain you enter is sent through this server to public registry servers, cached for a few minutes and never saved.",
        },
      ],
    },
  },
];

export const findToolInfo = (id: string) => toolInfos.find((tool) => tool.id === id);
