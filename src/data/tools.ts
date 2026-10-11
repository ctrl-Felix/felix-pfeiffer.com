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
  {
    id: "dns",
    name: "DNS Records",
    description: "Look up the DNS records of a domain: addresses, mail servers, TXT and CAA.",
    keywords: ["dns", "records", "mx", "txt", "spf", "dmarc", "caa", "nameserver", "lookup"],
    updated: "2026-10-10",
    seo: {
      title: "Free DNS Lookup: A, MX, NS, TXT and CAA Records",
      description:
        "Free DNS record lookup: check the A, AAAA, CNAME, MX, NS, TXT, SOA and CAA records of any domain. No sign up, nothing stored. Works with AI assistants via MCP.",
      heading: "Free DNS record lookup: check any domain",
      features: [
        "A and AAAA addresses with TTL",
        "CNAME aliases",
        "MX mail servers by priority",
        "NS name servers",
        "TXT records with SPF and DMARC detection",
        "SOA and CAA records",
        "MCP server for AI assistants",
      ],
      paragraphs: [
        "Enter a domain name such as example.com to see its DNS records: the IPv4 and IPv6 addresses with their time to live, the mail servers in order of priority, the authoritative name servers, the TXT records such as SPF and DMARC policies, the start of authority record and the certificate authorities that may issue certificates through CAA records.",
        "The records are fetched live from public resolvers. Subdomains and underscore names such as _dmarc.example.com work as well. Private and internal names are not looked up.",
        "The tool is free, needs no account and does not store the domains you look up. AI assistants such as Claude can use the same lookup through an open MCP server at https://felix-pfeiffer.com/mcp, together with a whois lookup.",
      ],
      steps: [
        "Open the tool and type a domain name or paste a link.",
        "Press Look up.",
        "Read the records grouped by type. Types without records are listed at the end.",
      ],
      faq: [
        {
          question: "What are DNS records?",
          answer: "DNS records are entries in the domain name system that tell the internet where a domain points: which addresses serve the website, which servers receive its mail and which name servers are responsible for it.",
        },
        {
          question: "How can I check the MX records of a domain?",
          answer: "Look up the domain and read the MX group. It lists the mail servers and their priority. A lower number is tried first.",
        },
        {
          question: "How do I find the SPF or DMARC record?",
          answer: "SPF is a TXT record on the domain itself and starts with v=spf1. DMARC is a TXT record on the name _dmarc in front of the domain, for example _dmarc.example.com.",
        },
        {
          question: "What does the TTL mean?",
          answer: "The TTL is the time in seconds that resolvers may keep an answer before asking again. Short values make changes spread faster.",
        },
        {
          question: "Can an AI assistant use this DNS lookup?",
          answer: "Yes. The tool is available as an MCP server at https://felix-pfeiffer.com/mcp. Add it as a custom connector in Claude or with the command claude mcp add --transport http security https://felix-pfeiffer.com/mcp in Claude Code.",
        },
        {
          question: "Are my lookups stored?",
          answer: "No. The domain you enter is sent through this server to public DNS resolvers, cached for a minute and never saved.",
        },
      ],
    },
  },
  {
    id: "subdomains",
    name: "Subdomain Finder",
    description: "Find the subdomains of a domain in public certificate transparency logs.",
    keywords: ["subdomain", "subdomains", "finder", "enumeration", "discovery", "certificate transparency", "crt.sh", "ssl", "tls", "recon"],
    updated: "2026-10-11",
    seo: {
      title: "Free Subdomain Finder: Certificate Transparency Search",
      description:
        "Free subdomain finder: discover the subdomains of any domain from certificate transparency logs. No sign up, nothing stored. Works with AI assistants via MCP.",
      heading: "Free subdomain finder: discover subdomains of any domain",
      features: [
        "Subdomains from certificate transparency logs",
        "Wildcard certificates marked",
        "First seen date and last certificate expiry",
        "Current and expired names",
        "Issuing certificate authorities",
        "Copy the full list",
        "MCP server for AI assistants",
      ],
      paragraphs: [
        "Enter a domain name such as example.com to list every subdomain that appeared in a publicly trusted TLS certificate, for example www.example.com, api.example.com or mail.example.com. Each name shows when it was first seen, when its latest certificate expires and whether a certificate for it is still valid today.",
        "Certificate authorities must publish every certificate they issue in public certificate transparency logs. This makes the names in those certificates public. The tool searches the logs through crt.sh, so the discovery is passive: the domain and its servers are never contacted.",
        "The tool is free, needs no account and does not store the domains you search. AI assistants such as Claude can use the same search through an open MCP server at https://felix-pfeiffer.com/mcp, together with a whois and a DNS record lookup.",
      ],
      steps: [
        "Open the tool and type a domain name or paste a link.",
        "Press Search. Large domains can take up to a minute.",
        "Filter the list, show only names with a valid certificate or copy all names.",
      ],
      faq: [
        {
          question: "How can I find all subdomains of a domain?",
          answer: "Search the domain in certificate transparency logs. Every subdomain that ever had a publicly trusted TLS certificate is listed there. This tool does that search for you and merges the results into one list.",
        },
        {
          question: "What is certificate transparency?",
          answer: "Certificate transparency is a system of public, append only logs. Certificate authorities must record every TLS certificate they issue there, so anyone can check which certificates exist for a domain.",
        },
        {
          question: "Does this find every subdomain?",
          answer: "No. It finds names that appeared in a public certificate. Names that only exist in DNS, are internal or are covered by a wildcard certificate such as *.example.com do not show up by name.",
        },
        {
          question: "Is subdomain discovery from certificate logs legal?",
          answer: "Yes. The logs are public by design and the search is passive: the domain and its servers are not contacted. Only test systems further if you are allowed to.",
        },
        {
          question: "Can an AI assistant use this subdomain finder?",
          answer: "Yes. The tool is available as an MCP server at https://felix-pfeiffer.com/mcp. Add it as a custom connector in Claude or with the command claude mcp add --transport http security https://felix-pfeiffer.com/mcp in Claude Code.",
        },
        {
          question: "Are my searches stored?",
          answer: "No. The domain you enter is sent through this server to crt.sh, the result is cached for 30 minutes and never saved.",
        },
      ],
    },
  },
];

export const toolsHub = {
  path: "/tools",
  updated: "2026-10-11",
  title: "Free Online Tools: Whois, DNS and Subdomain Finder",
  description: "Free online security tools: whois lookup, DNS record checker and subdomain finder. No sign up, nothing stored, usable from AI assistants through MCP.",
  heading: "Free online tools",
  intro:
    "Small, free tools to check domains: look up who registered a domain and when it expires, read its DNS records or find its subdomains in certificate transparency logs. No account, no tracking of your lookups, and every tool is also available to AI assistants through one open MCP server.",
  keywords: ["free online tools", "whois lookup", "dns lookup", "subdomain finder", "domain tools", "security tools", "mcp server"],
};

export const findToolInfo = (id: string) => toolInfos.find((tool) => tool.id === id);
