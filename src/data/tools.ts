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
    description: "Find the subdomains of a domain in certificate transparency logs and DNS.",
    keywords: ["subdomain", "subdomains", "finder", "enumeration", "discovery", "certificate transparency", "crt.sh", "dns", "ssl", "tls", "recon"],
    updated: "2026-10-11",
    seo: {
      title: "Free Subdomain Finder: Certificate Transparency Search",
      description:
        "Free subdomain finder: discover the subdomains of any domain from certificate transparency logs and DNS. No sign up, nothing stored. Works with AI assistants.",
      heading: "Free subdomain finder: discover subdomains of any domain",
      features: [
        "Subdomains from certificate transparency logs",
        "Wildcard certificates marked",
        "First seen date and last certificate expiry",
        "Current and expired names",
        "About 120 common names such as www, mail and api checked in DNS",
        "Wildcard DNS detection",
        "Issuing certificate authorities",
        "Copy the full list",
        "MCP server for AI assistants",
      ],
      paragraphs: [
        "Enter a domain name such as example.com to list every subdomain that appeared in a publicly trusted TLS certificate, for example www.example.com, api.example.com or mail.example.com. Each name shows when it was first seen, when its latest certificate expires and whether a certificate for it is still valid today.",
        "Certificate authorities must publish every certificate they issue in public certificate transparency logs. This makes the names in those certificates public. The tool searches the logs through crt.sh, so this part is passive: the servers of the domain are never contacted.",
        "It also checks about 120 common names such as www, mail, api, vpn and staging through public DNS resolvers. This finds names that never had their own certificate, for example when a wildcard certificate covers them. A random test name first checks whether the domain answers every name, so wildcard DNS does not produce false hits.",
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
          answer: "No. It finds names that appeared in a public certificate and common names that resolve in DNS. Unusual names that only exist in DNS or behind a wildcard certificate such as *.example.com can still be missing.",
        },
        {
          question: "Is subdomain discovery from certificate logs legal?",
          answer: "Yes. The logs are public by design and the DNS check only sends normal lookups through public resolvers, like any visitor would. Only test systems further if you are allowed to.",
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
  {
    id: "ip",
    name: "IP Lookup",
    description: "Look up who owns an IP address: network, ASN, organization, country and reverse DNS.",
    keywords: ["ip", "ip lookup", "ip whois", "asn", "bgp", "subnet", "cidr", "rdap", "reverse dns", "ptr", "network", "owner", "isp"],
    updated: "2026-10-11",
    seo: {
      title: "Free IP Lookup: IP Whois, ASN, Subnet and Owner",
      description:
        "Free IP whois lookup: find the network, subnet, ASN, owner, country and reverse DNS of any IPv4 or IPv6 address. No sign up, nothing stored. Works via MCP.",
      heading: "Free IP lookup: who owns an IP address",
      features: [
        "Network name, range and CIDR subnet",
        "Origin ASN, AS name and BGP prefix",
        "Owner organization with address and country",
        "Regional internet registry and registration dates",
        "Abuse contact",
        "Reverse DNS (PTR)",
        "IPv4 and IPv6",
        "MCP server for AI assistants",
      ],
      paragraphs: [
        "Enter an IPv4 or IPv6 address such as 1.1.1.1 to see which network it belongs to, its address range and CIDR subnet, the organization that holds it with its address and country, when the network was registered and where to report abuse.",
        "The network data comes live from the responsible regional internet registry (ARIN, RIPE NCC, APNIC, LACNIC or AFRINIC) through RDAP, the modern successor of WHOIS. The origin ASN and BGP prefix come from the public IP to ASN service of Team Cymru, and the reverse DNS name from public resolvers.",
        "The location shown is the country and address in the registry record, not a precise geolocation. Private, reserved and documentation addresses are not looked up. The tool is free, needs no account and does not store the addresses you look up. AI assistants such as Claude can use the same lookup through an open MCP server at https://felix-pfeiffer.com/mcp.",
      ],
      steps: [
        "Open the tool and type or paste an IPv4 or IPv6 address.",
        "Press Look up.",
        "Read the network, owner, ASN, reverse DNS and abuse contact.",
      ],
      faq: [
        {
          question: "How can I find out who owns an IP address?",
          answer: "Look up the address. The registry record shows the organization that holds the network, its address and country, and the abuse contact. The ASN shows which network announces the address on the internet.",
        },
        {
          question: "What is an ASN?",
          answer: "An autonomous system number identifies a network on the internet, such as an internet provider, a hosting company or a large company. Each address is announced in BGP by one origin ASN.",
        },
        {
          question: "What is the difference between IP whois and RDAP?",
          answer: "Both return the registry record of an address. RDAP is the newer standard with structured JSON and is offered by all five regional internet registries. This tool uses RDAP.",
        },
        {
          question: "Does this show the exact location of an IP address?",
          answer: "No. It shows the country and address from the registry record, which is where the holder of the network is registered. The device using the address can be somewhere else.",
        },
        {
          question: "How do I report abuse from an IP address?",
          answer: "Use the abuse contact shown in the result. It is the address the network holder publishes for spam, attacks and other abuse reports.",
        },
        {
          question: "Can an AI assistant use this IP lookup?",
          answer: "Yes. The tool is available as an MCP server at https://felix-pfeiffer.com/mcp. Add it as a custom connector in Claude or with the command claude mcp add --transport http security https://felix-pfeiffer.com/mcp in Claude Code.",
        },
        {
          question: "Are my lookups stored?",
          answer: "No. The address you enter is sent through this server to the registry and public DNS resolvers, cached for a few minutes and never saved.",
        },
      ],
    },
  },
];

export const toolsHub = {
  path: "/tools",
  updated: "2026-10-11",
  title: "Free Online Tools: Whois, DNS, IP and Subdomain Lookup",
  description: "Free online security tools: whois lookup, DNS records, subdomain finder and IP lookup. No sign up, nothing stored, usable from AI assistants through MCP.",
  heading: "Free online tools",
  intro:
    "Small, free tools to check domains: look up who registered a domain and when it expires, read its DNS records, find its subdomains in certificate transparency logs or see who owns an IP address. No account, no tracking of your lookups, and every tool is also available to AI assistants through one open MCP server.",
  keywords: ["free online tools", "whois lookup", "dns lookup", "subdomain finder", "ip lookup", "asn lookup", "domain tools", "security tools", "mcp server"],
};

export const findToolInfo = (id: string) => toolInfos.find((tool) => tool.id === id);
