// HTML to Markdown converter
export function htmlToMarkdown(html: string): string {
  const temp = document.createElement("div");
  temp.innerHTML = html;
  
  let markdown = "";
  
  const processNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      markdown += node.textContent;
      return;
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();
      
      if (tagName === "h1") {
        markdown += "\n\n# ";
        processChildren(el);
        markdown += "\n\n";
      } else if (tagName === "h2") {
        markdown += "\n\n## ";
        processChildren(el);
        markdown += "\n\n";
      } else if (tagName === "h3") {
        markdown += "\n\n### ";
        processChildren(el);
        markdown += "\n\n";
      } else if (tagName === "p") {
        const isInsideLi = el.closest("li") !== null;
        if (!isInsideLi) {
          markdown += "\n\n";
        }
        processChildren(el);
        if (!isInsideLi) {
          markdown += "\n\n";
        }
      } else if (tagName === "ul" || tagName === "ol") {
        markdown += "\n\n";
        processChildren(el);
        markdown += "\n\n";
      } else if (tagName === "li") {
        markdown += "\n- ";
        processChildren(el);
      } else if (tagName === "strong" || tagName === "b") {
        markdown += "**";
        processChildren(el);
        markdown += "**";
      } else if (tagName === "em" || tagName === "i") {
        markdown += "*";
        processChildren(el);
        markdown += "*";
      } else if (tagName === "blockquote") {
        markdown += "\n\n> ";
        processChildren(el);
        markdown += "\n\n";
      } else if (tagName === "br") {
        markdown += "\n";
      } else {
        processChildren(el);
      }
    }
  };
  
  const processChildren = (parent: HTMLElement) => {
    for (let i = 0; i < parent.childNodes.length; i++) {
      processNode(parent.childNodes[i]);
    }
  };
  
  processChildren(temp);
  
  // Clean up excessive whitespace and duplicate newlines
  return markdown
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Markdown to HTML converter
export function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let html = "";
  let inList = false;
  let inListType: "ul" | "ol" | null = null;
  
  for (let line of lines) {
    const trimmed = line.trim();
    
    if (trimmed === "") {
      if (inList) {
        html += inListType === "ul" ? "</ul>" : "</ol>";
        inList = false;
        inListType = null;
      }
      continue;
    }
    
    // Headings
    if (trimmed.startsWith("# ")) {
      if (inList) { html += inListType === "ul" ? "</ul>" : "</ol>"; inList = false; inListType = null; }
      html += `<h1>${parseInlineStyles(trimmed.slice(2))}</h1>`;
    } else if (trimmed.startsWith("## ")) {
      if (inList) { html += inListType === "ul" ? "</ul>" : "</ol>"; inList = false; inListType = null; }
      html += `<h2>${parseInlineStyles(trimmed.slice(3))}</h2>`;
    } else if (trimmed.startsWith("### ")) {
      if (inList) { html += inListType === "ul" ? "</ul>" : "</ol>"; inList = false; inListType = null; }
      html += `<h3>${parseInlineStyles(trimmed.slice(4))}</h3>`;
    }
    // Blockquotes
    else if (trimmed.startsWith("> ")) {
      if (inList) { html += inListType === "ul" ? "</ul>" : "</ol>"; inList = false; inListType = null; }
      html += `<blockquote>${parseInlineStyles(trimmed.slice(2))}</blockquote>`;
    }
    // List items
    else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!inList) {
        html += "<ul>";
        inList = true;
        inListType = "ul";
      }
      html += `<li>${parseInlineStyles(trimmed.slice(2))}</li>`;
    } else if (/^\d+\.\s/.test(trimmed)) {
      const match = trimmed.match(/^(\d+)\.\s(.*)/);
      if (match) {
        if (!inList) {
          html += "<ol>";
          inList = true;
          inListType = "ol";
        }
        html += `<li>${parseInlineStyles(match[2])}</li>`;
      }
    }
    // Standard paragraphs
    else {
      if (inList) {
        html += inListType === "ul" ? "</ul>" : "</ol>";
        inList = false;
        inListType = null;
      }
      html += `<p>${parseInlineStyles(trimmed)}</p>`;
    }
  }
  
  if (inList) {
    html += inListType === "ul" ? "</ul>" : "</ol>";
  }
  
  return html;
}

function parseInlineStyles(text: string): string {
  let parsed = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
    
  // Bold (**text** or __text__)
  parsed = parsed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  parsed = parsed.replace(/__(.*?)__/g, "<strong>$1</strong>");
  
  // Italics (*text* or _text_)
  parsed = parsed.replace(/\*(.*?)\*/g, "<em>$1</em>");
  parsed = parsed.replace(/_(.*?)_/g, "<em>$1</em>");
  
  return parsed;
}
