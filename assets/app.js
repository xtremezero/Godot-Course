/* ============================================================
   Mastering Godot 4 — deck engine
   Navigation · TOC/search · syntax highlighting · copy buttons
   No dependencies. Works from file:// (slides registered as
   plain script files, so no fetch/CORS issues).
   ============================================================ */
"use strict";
(function () {
  const DECK = window.DECK || [];
  const TITLES = window.CHAPTER_TITLES || {};
  const PARTS = window.CHAPTER_PARTS || {};
  const STAGE_W = 1280, STAGE_H = 720;

  const stage = document.getElementById("stage");
  const crumb = document.getElementById("crumb");
  const counter = document.getElementById("counter");
  const progFill = document.getElementById("prog-fill");
  const drawer = document.getElementById("drawer");
  const toc = document.getElementById("toc");
  const search = document.getElementById("search");
  const help = document.getElementById("help");

  /* ---------------- utilities ---------------- */
  const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const pad2 = n => String(n).padStart(2, "0");

  /* ---------------- syntax highlighting ---------------- */
  const GD_KW = "func|var|const|let|if|elif|else|for|while|match|when|return|class|class_name|extends|is|in|as|and|or|not|await|signal|enum|static|self|super|true|false|null|break|continue|pass|assert|breakpoint|void|trait|namespace";
  const CS_KW = "using|namespace|public|private|protected|internal|static|readonly|const|void|class|struct|interface|enum|new|var|object|string|float|double|int|uint|long|bool|char|byte|override|virtual|abstract|sealed|partial|get|set|this|base|if|else|for|foreach|while|do|switch|case|default|break|continue|return|true|false|null|in|out|ref|params|async|await|try|catch|finally|throw|is|as|delegate|event|operator";
  const SH_KW = "shader_type|render_mode|uniform|varying|const|if|else|for|while|return|in|out|inout|discard|void|group_uniforms|instance|global|global_group|struct";
  const SH_TY = "bool|int|uint|float|double|vec2|vec3|vec4|ivec2|ivec3|ivec4|uvec2|uvec3|uvec4|bvec2|bvec3|bvec4|mat2|mat3|mat4|sampler2D|sampler2DArray|sampler3D|samplerCube|samplerCubeArray|mat2x2|mat2x3|mat3x2|mat3x4|mat4x2|mat4x3|int64_t|uint64_t";

  const RE_COM_C = "//[^\\n]*|/\\*(?:[^*]|\\*(?!/))*\\*/";
  const RE_STR_C = "@\"[^\"]*\"|\\$?\"(?:\\\\.|[^\"\\\\\\n])*\"|'(?:\\\\.|[^'\\\\\\n])*'";
  const RE_STR_S = "\"(?:\\\\.|[^\"\\\\\\n])*\"|'(?:\\\\.|[^'\\\\\\n])*'";
  const RE_NUM = "\\b\\d[\\d_]*(?:\\.\\d+)?(?:e[+-]?\\d+)?\\b|\\b0x[0-9a-fA-F_]+\\b";
  const RE_FN = "[A-Za-z_]\\w*(?=\\s*\\()";
  const RE_CAP = "\\b[A-Z][A-Za-z0-9_]*\\b";

  const LANGS = {
    gdscript: [
      ["com", "#[^\\n]*"],
      ["str", RE_STR_S],
      ["ann", "@[A-Za-z_]\\w*"],
      ["nod", "\\$[A-Za-z_][\\w/]*|%[A-Za-z_]\\w*"],
      ["num", RE_NUM],
      ["kw", "\\b(?:" + GD_KW + ")\\b"],
      ["fn", RE_FN],
      ["cap", RE_CAP],
    ],
    csharp: [
      ["com", RE_COM_C],
      ["str", RE_STR_C],
      ["ann", "\\[[A-Z]\\w*(?:\\([^)]*\\))?\\]"],
      ["num", RE_NUM],
      ["kw", "\\b(?:" + CS_KW + ")\\b"],
      ["fn", RE_FN],
      ["cap", RE_CAP],
    ],
    gdshader: [
      ["com", "//[^\\n]*"],
      ["str", RE_STR_S],
      ["num", RE_NUM],
      ["kw", "\\b(?:" + SH_KW + ")\\b"],
      ["ty", "\\b(?:" + SH_TY + ")\\b"],
      ["fn", RE_FN],
      ["cap", RE_CAP],
    ],
    text: [
      ["com", "[;#][^\\n]*"],
      ["str", RE_STR_S],
      ["sec", "^\\[[^\\]\\n]+\\]"],
      ["num", RE_NUM],
      ["cap", RE_CAP],
    ],
  };
  for (const k in LANGS) LANGS[k] = new RegExp(LANGS[k].map(r => "(" + r[1] + ")").join("|"), "gm");
  const LANG_NAMES = new Set(["gdscript", "csharp", "gdshader", "text"]);

  function detectLang(code) {
    if (/^\s*shader_type\s/m.test(code)) return "gdshader";
    if (/using Godot|public partial class|using Godot\.|: Node\b|\.NET/.test(code)) return "csharp";
    if (/^\s*(extends|@export|@onready|class_name|func |signal |var |const )/m.test(code)) return "gdscript";
    if (/^\[[^\]]+\]$/m.test(code) && /=/.test(code)) return "text";
    return "text";
  }

  function hl(code, lang) {
    const re = LANGS[lang] || LANGS.text;
    re.lastIndex = 0;
    let out = "", last = 0, m;
    while ((m = re.exec(code)) !== null) {
      if (m.index > last) out += esc(code.slice(last, m.index));
      out += span(clsFor(lang, m), esc(m[0]));
      last = m.index + m[0].length;
      if (m[0].length === 0) re.lastIndex++;
    }
    out += esc(code.slice(last));
    return out;
  }

  // Map which capture group fired back to a token class.
  const LANG_RULES = {
    gdscript: ["com", "str", "ann", "nod", "num", "kw", "fn", "cap"],
    csharp: ["com", "str", "ann", "num", "kw", "fn", "cap"],
    gdshader: ["com", "str", "num", "kw", "ty", "fn", "cap"],
    text: ["com", "str", "sec", "num", "cap"],
  };
  function span(cls, txt) { return cls ? '<span class="tok-' + cls + '">' + txt + "</span>" : txt; }
  function clsFor(lang, match) {
    const names = LANG_RULES[lang] || LANG_RULES.text;
    for (let g = 1; g <= names.length; g++) {
      if (match[g] !== undefined) {
        const n = names[g - 1];
        if (n === "cap") return /^[A-Z][A-Z0-9_]+$/.test(match[0]) ? "const" : "type";
        if (n === "ty") return "type";
        return n;
      }
    }
    return null;
  }

  function decorateSlide(section) {
    section.querySelectorAll("pre").forEach(pre => {
      if (pre.dataset.done) return;
      pre.dataset.done = "1";
      const code = pre.querySelector("code");
      if (code) {
        const raw = code.textContent.replace(/^\n+/, "").replace(/\s+$/, "");
        const lang = (pre.dataset.lang && LANG_NAMES.has(pre.dataset.lang)) ? pre.dataset.lang : detectLang(raw);
        code.innerHTML = hl(raw, lang);
        pre.dataset.langUsed = lang;
      }
      // wrap: header with filename + lang chip + copy button
      const wrap = document.createElement("div");
      wrap.className = "codewrap";
      pre.parentNode.insertBefore(wrap, pre);
      const head = document.createElement("div");
      head.className = "code-head";
      head.innerHTML =
        '<span class="fname">' + esc(pre.dataset.file || "snippet") + "</span>" +
        '<span class="lang">' + esc(pre.dataset.langUsed || "text") + "</span>" +
        '<button class="copy-btn" type="button">⧉ Copy</button>';
      wrap.appendChild(head);
      wrap.appendChild(pre);
    });
  }

  /* ---------------- build deck DOM ---------------- */
  const total = DECK.length;
  const sections = DECK.map((s, i) => {
    const sec = document.createElement("section");
    sec.className = "slide" + (s.cover ? "" : "");
    sec.dataset.i = i;
    sec.dataset.search = (s.t + " " + (s.html || "").replace(/<[^>]+>/g, " ")).toLowerCase();
    sec.innerHTML =
      '<header class="shead"><span class="chip">CH ' + pad2(s.c) + "</span>" +
      '<span class="cname">' + esc(TITLES[s.c] || "") + "</span>" +
      '<span class="snum">' + (i + 1) + " / " + total + "</span></header>" +
      '<div class="s-body ' + (s.first ? "first" : "") + (s.cover ? " cov" : "") + '">' + (s.html || "") + "</div>";
    stage.appendChild(sec);
    return sec;
  });

  // fill dynamic counts on the title slide
  const countEl = document.getElementById("deck-count");
  if (countEl) countEl.textContent = total;

  /* ---------------- TOC drawer ---------------- */
  function buildToc() {
    let html = "", lastCh = null, lastPart = null;
    DECK.forEach((s, i) => {
      if (s.c !== lastCh) {
        lastCh = s.c;
        if (PARTS[s.c] && PARTS[s.c] !== lastPart) {
          html += '<div class="toc-part">' + esc(PARTS[s.c]) + "</div>";
          lastPart = PARTS[s.c];
        }
        html += '<div class="toc-ch">Chapter ' + pad2(s.c) + " · " + esc(TITLES[s.c] || "") + "</div>";
      }
      html += '<button class="titem' + (s.cover ? " tcover" : "") + '" data-i="' + i + '">' +
        '<span class="ti-n">' + (i + 1) + "</span><span>" + esc(s.t) + "</span></button>";
    });
    html += '<div id="toc-empty">No matching slides.</div>';
    toc.innerHTML = html;
  }
  buildToc();

  function filterToc(q) {
    q = q.trim().toLowerCase();
    let visible = 0;
    toc.querySelectorAll(".titem").forEach(b => {
      const sec = sections[+b.dataset.i];
      const hit = !q || sec.dataset.search.includes(q);
      b.style.display = hit ? "" : "none";
      if (hit) visible++;
    });
    // hide chapter headers with no visible items
    let hideNextCh = false;
    Array.from(toc.children).forEach(el => {
      if (el.classList.contains("toc-part") || el.classList.contains("toc-ch")) {
        hideNextCh = el.style.display === "none" ? true : false;
      }
    });
    // simpler: headers always shown; acceptable
    document.getElementById("toc-empty").style.display = visible ? "none" : "block";
  }
  search.addEventListener("input", () => filterToc(search.value));

  toc.addEventListener("click", e => {
    const b = e.target.closest(".titem");
    if (!b) return;
    go(+b.dataset.i);
    closeDrawer();
  });

  /* ---------------- navigation ---------------- */
  let cur = -1;
  function go(i, silentHash) {
    i = Math.max(0, Math.min(total - 1, i));
    if (i === cur) return;
    const dir = i > cur ? 1 : -1;
    if (cur >= 0) sections[cur].classList.remove("active");
    const sec = sections[i];
    sec.style.setProperty("--dx", dir > 0 ? "34px" : "-34px");
    void sec.offsetWidth; // restart animation
    sec.classList.add("active");
    cur = i;
    decorateSlide(sec);
    const nextSec = sections[Math.min(total - 1, i + 1)];
    // pre-decorate next slide so forward navigation is instant
    if (nextSec !== sec) decorateSlide(nextSec);

    const ch = DECK[i].c;
    crumb.textContent = (PARTS[ch] ? PARTS[ch] + "  ·  " : "") + "CH " + pad2(ch) + " — " + (TITLES[ch] || "");
    counter.textContent = (i + 1) + " / " + total;
    progFill.style.width = ((i + 1) / total * 100) + "%";
    if (!silentHash) location.hash = String(i + 1);
    toc.querySelectorAll(".titem.cur").forEach(b => b.classList.remove("cur"));
    const curBtn = toc.querySelector('.titem[data-i="' + i + '"]');
    if (curBtn) { curBtn.classList.add("cur"); curBtn.scrollIntoView({ block: "nearest" }); }
    sec.querySelector(".s-body").scrollTop = 0;
  }
  const next = () => go(cur + 1);
  const prev = () => go(cur - 1);

  /* ---------------- scaling ---------------- */
  function fit() {
    const s = Math.min(window.innerWidth / STAGE_W, (window.innerHeight - 48) / STAGE_H);
    stage.style.transform = "translate(-50%, -50%) scale(" + Math.min(s, 1.6) + ")";
  }
  window.addEventListener("resize", fit);

  /* ---------------- overlays ---------------- */
  function openDrawer() { drawer.classList.add("open"); setTimeout(() => search.focus(), 120); }
  function closeDrawer() { drawer.classList.remove("open"); search.blur(); }
  function toggleDrawer() { drawer.classList.contains("open") ? closeDrawer() : openDrawer(); }
  function toggleHelp() { help.classList.toggle("open"); }

  document.getElementById("btn-prev").addEventListener("click", prev);
  document.getElementById("btn-next").addEventListener("click", next);
  document.getElementById("btn-contents").addEventListener("click", toggleDrawer);
  document.getElementById("dr-close").addEventListener("click", closeDrawer);
  document.getElementById("btn-help").addEventListener("click", toggleHelp);
  document.getElementById("help-close").addEventListener("click", toggleHelp);
  help.addEventListener("click", e => { if (e.target === help) toggleHelp(); });
  drawer.addEventListener("click", e => { if (e.target === drawer) closeDrawer(); });

  /* ---------------- keyboard ---------------- */
  window.addEventListener("keydown", e => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
    if (e.key === "Escape") { closeDrawer(); help.classList.remove("open"); return; }
    if (typing) { if (e.key === "Enter" && document.activeElement === search) e.preventDefault(); return; }
    switch (e.key) {
      case "ArrowRight": case "ArrowDown": case "PageDown": case " ":
        e.preventDefault(); next(); break;
      case "ArrowLeft": case "ArrowUp": case "PageUp": case "Backspace":
        e.preventDefault(); prev(); break;
      case "Home": e.preventDefault(); go(0); break;
      case "End": e.preventDefault(); go(total - 1); break;
      case "c": case "C": toggleDrawer(); break;
      case "f": case "F":
        document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
        break;
      case "?": toggleHelp(); break;
    }
  });

  /* ---------------- touch swipe ---------------- */
  let tx = 0, ty = 0;
  window.addEventListener("touchstart", e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  window.addEventListener("touchend", e => {
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) { dx < 0 ? next() : prev(); }
  }, { passive: true });

  /* ---------------- copy to clipboard ---------------- */
  document.addEventListener("click", e => {
    const btn = e.target.closest(".copy-btn");
    if (!btn) return;
    const code = btn.closest(".codewrap").querySelector("pre code");
    const text = code ? code.textContent : "";
    const done = () => {
      btn.textContent = "✓ Copied"; btn.classList.add("done");
      setTimeout(() => { btn.textContent = "⧉ Copy"; btn.classList.remove("done"); }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else fallbackCopy(text, done);
  });
  function fallbackCopy(text, done) {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); done(); } catch (_) { /* noop */ }
    document.body.removeChild(ta);
  }

  /* ---------------- deep links ---------------- */
  window.addEventListener("hashchange", () => {
    const n = parseInt(location.hash.slice(1), 10);
    if (!isNaN(n) && n - 1 !== cur) go(n - 1, true);
  });

  /* ---------------- boot ---------------- */
  fit();
  const start = parseInt(location.hash.slice(1), 10);
  go(isNaN(start) ? 0 : start - 1, true);
})();
