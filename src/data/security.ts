import { links } from "@/config";

export const security = `# Security

Please read README.md first.

I'm studying Information Security (MSc at UCL), so security matters to me, even on a small page like this.

The whole codebase is open source on [GitHub](${links.source}). Claude writes all of it and is instructed to build it in a secure way.

Is that enough to make it secure? I don't know, and I want to find out. Every pull request is scanned, and the **Vulnerability Tracker** app lists every real vulnerability the scanners found, open or fixed.

This website holds no personal data and has no critical function that could be leaked or abused.

If you still notice something, you can [write me](${links.mail}) any time.
`;
