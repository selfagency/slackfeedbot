import { compile } from "html-to-text";
import { parseHTML } from "linkedom";

const html2txt = compile({
  wordwrap: 255,
});

// Slack treats &, <, and > as control characters; these entities are decoded
// for display, which also neutralizes <!channel>/<@user>-style injection.
export const escapeSlack = (text: string): string =>
  text.replace(/&/gu, "&amp;").replace(/</gu, "&lt;").replace(/>/gu, "&gt;");

// URLs from untrusted feed content could carry "<", ">", or a mention-style
// prefix; strip them so emitted link sequences stay plain links.
export const sanitizeUrl = (url: string): string =>
  url.replace(/[<>\s]/gu, "").replace(/^[@!]/u, "");

export const plainTitle = (title: string): string => html2txt(title);

type MarkdownFlavor = "slack" | "discord";

interface FlavorRules {
  bold: (inner: string) => string;
  italic: (inner: string) => string;
  link: (label: string, href: string) => string;
  text: (raw: string) => string;
}

const SLACK: FlavorRules = {
  text: escapeSlack,
  bold: (inner) => `*${inner}*`,
  italic: (inner) => `_${inner}_`,
  link: (label, href) => `<${sanitizeUrl(href)}|${label}>`,
};

const DISCORD: FlavorRules = {
  text: (raw) => raw.replace(/<[@#&!][^>]*>/gu, ""),
  bold: (inner) => `**${inner}**`,
  italic: (inner) => `*${inner}*`,
  link: (label, href) => `[${label}](${sanitizeUrl(href)})`,
};

const isElement = (node: Node): node is Element => node.nodeType === 1; // ELEMENT_NODE

const convertChildren = (
  node: Node | null | undefined,
  rules: FlavorRules
): string =>
  Array.from(node?.childNodes ?? [])
    .map((child) => convertNode(child, rules))
    .join("");

// Converts HTML to platform mrkdwn: links, emphasis, bullets, and line breaks
const convertNode = (node: Node, rules: FlavorRules): string => {
  if (node.nodeType === 3) {
    return rules.text(node.textContent ?? ""); // TEXT_NODE
  }
  if (!isElement(node)) {
    return "";
  }

  const inner = convertChildren(node, rules);
  switch (node.tagName.toLowerCase()) {
    case "a":
      return node.getAttribute("href") === null
        ? inner
        : rules.link(inner, node.getAttribute("href") ?? "");
    case "strong":
    case "b":
      return rules.bold(inner);
    case "em":
    case "i":
      return rules.italic(inner);
    case "li":
      return `• ${inner}\n`;
    case "p":
    case "div":
      return `${inner}\n`;
    case "br":
      return "\n";
    default:
      return inner;
  }
};

export const htmlToMrkdwn = (html: string, flavor: MarkdownFlavor): string => {
  const rules = flavor === "slack" ? SLACK : DISCORD;
  return convertChildren(
    parseHTML(`<div>${html}</div>`).document.querySelector("div"),
    rules
  )
    .replace(/[ \t]+/gu, " ")
    .replace(/\*{3,}/gu, "**")
    .replace(/_{3,}/gu, "__")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
};
