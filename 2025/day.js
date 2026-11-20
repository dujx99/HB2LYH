/* day 参数：读取 assets/days/<YYMMDD>.md，并以 HTML 渲染 */
(function () {
  const DAY_DIR = "../assets/days";

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function safeUrl(url) {
    const u = String(url).trim();
    return /^(javascript|data|vbscript):/i.test(u) ? "#" : u;
  }

  function renderInline(text) {
    let s = escapeHtml(text);

    // 行内代码先抽出来，避免里面的标记被强调语法二次处理
    const codes = [];
    s = s.replace(/`([^`]+)`/g, (_, code) => {
      codes.push("<code>" + code + "</code>");
      return "\u0000" + (codes.length - 1) + "\u0000";
    });

    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
      (_, alt, url) => '<img src="' + safeUrl(url) + '" alt="' + alt + '">');
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
      (_, label, url) => '<a href="' + safeUrl(url) + '" target="_blank" rel="noopener">' + label + "</a>");

    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/__([^_]+)__/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
    s = s.replace(/(^|[^_])_([^_]+)_/g, "$1<em>$2</em>");
    s = s.replace(/~~([^~]+)~~/g, "<del>$1</del>");

    return s.replace(/\u0000(\d+)\u0000/g, (_, i) => codes[Number(i)]);
  }

  function renderMarkdown(src) {
    const lines = String(src).replace(/\r\n?/g, "\n").split("\n");
    const out = [];
    let paragraph = [];
    let listType = null;

    function flushParagraph() {
      if (paragraph.length) {
        out.push("<p>" + paragraph.map(renderInline).join("<br>") + "</p>");
        paragraph = [];
      }
    }
    function closeList() {
      if (listType) {
        out.push("</" + listType + ">");
        listType = null;
      }
    }

    for (let i = 0; i < lines.length; ) {
      const line = lines[i];

      if (/^\s*```/.test(line)) {
        flushParagraph();
        closeList();
        const lang = line.trim().slice(3).trim();
        const code = [];
        i++;
        while (i < lines.length && !/^\s*```/.test(lines[i])) {
          code.push(lines[i]);
          i++;
        }
        i++;
        out.push(
          "<pre><code" + (lang ? ' class="language-' + escapeHtml(lang) + '"' : "") + ">" +
          escapeHtml(code.join("\n")) + "</code></pre>"
        );
        continue;
      }

      const heading = line.match(/^\s*(#{1,6})\s+(.*)$/);
      if (heading) {
        flushParagraph();
        closeList();
        const level = heading[1].length;
        out.push("<h" + level + ">" + renderInline(heading[2]) + "</h" + level + ">");
        i++;
        continue;
      }

      if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
        flushParagraph();
        closeList();
        out.push("<hr>");
        i++;
        continue;
      }

      if (/^\s*>\s?/.test(line)) {
        flushParagraph();
        closeList();
        const quoted = [];
        while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
          quoted.push(lines[i].replace(/^\s*>\s?/, ""));
          i++;
        }
        out.push("<blockquote>" + renderMarkdown(quoted.join("\n")) + "</blockquote>");
        continue;
      }

      const ul = line.match(/^\s*[-*+]\s+(.*)$/);
      if (ul) {
        flushParagraph();
        if (listType !== "ul") {
          closeList();
          out.push("<ul>");
          listType = "ul";
        }
        out.push("<li>" + renderInline(ul[1]) + "</li>");
        i++;
        continue;
      }

      const ol = line.match(/^\s*\d+\.\s+(.*)$/);
      if (ol) {
        flushParagraph();
        if (listType !== "ol") {
          closeList();
          out.push("<ol>");
          listType = "ol";
        }
        out.push("<li>" + renderInline(ol[1]) + "</li>");
        i++;
        continue;
      }

      if (!line.trim()) {
        flushParagraph();
        closeList();
        i++;
        continue;
      }

      paragraph.push(line.trim());
      i++;
    }

    flushParagraph();
    closeList();
    return out.join("\n");
  }

  window.renderMarkdown = renderMarkdown;

  window.loadDayContent = async function () {
    const day = window.SITE_DAY;
    if (!day) return "fallback-ok";

    try {
      const response = await fetch(DAY_DIR + "/" + day + ".md", { cache: "no-store" });
      if (!response.ok) throw new Error("md not found: " + day);
      const markdown = await response.text();

      const dateText = "20" + day.slice(0, 2) + "-" + day.slice(2, 4) + "-" + day.slice(4, 6);
      document.getElementById("dayTitle").textContent = "📅 " + dateText;
      document.getElementById("dayContent").innerHTML = renderMarkdown(markdown);
      document.getElementById("page-1").classList.add("hide");
      document.getElementById("page-day").classList.remove("hide");
      document.title = dateText + " · 小梨老师";
      return "rendered";
    } catch (error) {
      console.info("未找到对应 day 的 md，回退到默认页面：", error.message);
      window.SITE_DAY = null;
      try {
        let raw = location.hash.replace(/^#/, "");
        if (raw.charAt(0) === "?") raw = raw.slice(1);
        const params = new URLSearchParams(raw || location.search.replace(/^\?/, ""));
        params.delete("day");
        const query = params.toString();
        history.replaceState(null, "", location.pathname + (query ? "#" + query : ""));
      } catch (_) {}
      const ok = window.applyYearRoute();
      return ok ? "fallback-ok" : "fallback-redirect";
    }
  };
})();
