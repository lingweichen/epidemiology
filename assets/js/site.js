/* =========================================================
   site.js — shared header, navigation, footer, language switch
   ---------------------------------------------------------
   TO ADD A MODULE: copy _template.html, give it a new file name,
   then add one entry to SITE.modules below. The navigation,
   home page list, and previous/next links update automatically.
   ========================================================= */

const SITE = {
  title: { en: "Principles of Epidemiology", zh: "流行病學原理" },
  subtitle: { en: "Graduate course notes", zh: "研究所課程講義" },
  instructor: { en: "Ling-Wei Chen", zh: "Ling-Wei Chen" },   // put your Chinese name in zh
  institution: { en: "Institute of Epidemiology and Preventive Medicine, National Taiwan University",
                 zh: "國立臺灣大學 流行病學與預防醫學研究所" },
  year: "2026",
  modules: [
    { file: "01-frequency.html",   en: "Measuring disease frequency",   zh: "疾病頻率的測量",
      den: "Prevalence, incidence, person-time", dzh: "盛行率、發生率、人時" },
    { file: "02-association.html", en: "Measures of association",       zh: "關聯性的測量",
      den: "Risk ratio, odds ratio, risk difference, PAF", dzh: "相對危險性、勝算比、風險差、族群可歸因分率" },
    { file: "03-study-designs.html", en: "Study designs",               zh: "研究設計",
      den: "Cohort, case-control, cross-sectional, trials", dzh: "世代、病例對照、橫斷面、臨床試驗" },
    { file: "04-bias.html",        en: "Bias",                          zh: "偏差",
      den: "Selection bias and misclassification", dzh: "選樣偏差與錯誤分類" },
    { file: "05-confounding.html", en: "Causation and confounding",     zh: "因果與干擾",
      den: "Counterfactuals, DAGs, effect modification", dzh: "反事實、有向無環圖、效應修飾" },
    { file: "06-screening.html",   en: "Screening and diagnostic tests", zh: "篩檢與診斷檢驗",
      den: "Sensitivity, specificity, predictive values", dzh: "敏感度、特異度、預測值" }
  ],
  extras: [
    { file: "tools.html",    en: "Interactive tools", zh: "互動工具" },
    { file: "glossary.html", en: "Glossary",          zh: "名詞對照" }
  ]
};

/* ---------- helpers ---------- */
const bi = (en, zh) =>
  `<span class="bi"><span lang="en">${en}</span><span lang="zh-Hant">${zh}</span></span>`;
const pad = (i) => String(i + 1).padStart(2, "0");
const currentFile = () => {
  const f = location.pathname.split("/").pop();
  return f === "" ? "index.html" : f;
};

/* ---------- language ---------- */
const LANG_KEY = "epi-site-lang";
function getLang() {
  const q = new URLSearchParams(location.search).get("lang");
  if (["en", "zh", "both"].includes(q)) return q;
  try { const s = localStorage.getItem(LANG_KEY); if (s) return s; } catch (e) {}
  return "both";
}
function setLang(lang) {
  document.body.dataset.lang = lang;
  document.documentElement.lang = lang === "zh" ? "zh-Hant" : "en";
  document.querySelectorAll(".lang-switch button").forEach(b =>
    b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
}

/* ---------- chrome ---------- */
function buildHeader() {
  const h = document.createElement("header");
  h.className = "site-header site-chrome";
  h.innerHTML = `
    <div class="inner">
      <button class="nav-toggle" aria-expanded="false" aria-controls="site-nav">${bi("Menu", "目錄")}</button>
      <a class="brand" href="index.html">${bi(SITE.title.en, SITE.title.zh)}
        <small>${bi(SITE.subtitle.en, SITE.subtitle.zh)}</small></a>
      <div class="header-tools">
        <div class="lang-switch" role="group" aria-label="Language / 語言">
          <button data-lang="en">EN</button>
          <button data-lang="zh">中文</button>
          <button data-lang="both">雙語</button>
        </div>
      </div>
    </div>`;
  document.body.prepend(h);
  h.querySelectorAll(".lang-switch button").forEach(b =>
    b.addEventListener("click", () => setLang(b.dataset.lang)));
}

function buildNav() {
  const slot = document.querySelector("[data-nav]");
  if (!slot) return;
  const here = currentFile();
  const link = (m, num) => `<li><a href="${m.file}"${m.file === here ? ' aria-current="page"' : ""}>
      <span class="num">${num}</span>${bi(m.en, m.zh)}</a></li>`;
  slot.id = "site-nav";
  slot.classList.add("site-nav", "site-chrome");
  slot.setAttribute("aria-label", "Course navigation");
  slot.innerHTML = `
    <ul><li><a href="index.html"${here === "index.html" ? ' aria-current="page"' : ""}><span class="num"></span>${bi("Course home", "課程首頁")}</a></li></ul>
    <p class="group-label">${bi("Modules", "單元")}</p>
    <ol>${SITE.modules.map((m, i) => link(m, pad(i))).join("")}</ol>
    <p class="group-label">${bi("Resources", "資源")}</p>
    <ul>${SITE.extras.map(m => link(m, "")).join("")}</ul>`;
  const toggle = document.querySelector(".nav-toggle");
  toggle.addEventListener("click", () => {
    const open = slot.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}

function buildPager() {
  const main = document.querySelector("main");
  const i = SITE.modules.findIndex(m => m.file === currentFile());
  if (!main || i < 0) return;
  const prev = SITE.modules[i - 1], next = SITE.modules[i + 1];
  const nav = document.createElement("nav");
  nav.className = "pager site-chrome";
  nav.setAttribute("aria-label", "Previous and next module");
  nav.innerHTML =
    (prev ? `<a class="prev" href="${prev.file}"><span class="dir">${bi("Previous", "上一單元")}</span>${pad(i - 1)} ${bi(prev.en, prev.zh)}</a>` : "") +
    (next ? `<a class="next" href="${next.file}"><span class="dir">${bi("Next", "下一單元")}</span>${pad(i + 1)} ${bi(next.en, next.zh)}</a>` : "");
  main.appendChild(nav);
}

function buildModuleList() {
  document.querySelectorAll("[data-module-list]").forEach(el => {
    el.innerHTML = SITE.modules.map((m, i) => `
      <li><a href="${m.file}"><span class="num">${i + 1}</span>
        <span><span class="t">${bi(m.en, m.zh)}</span>
        <span class="d">${bi(m.den, m.dzh)}</span></span></a></li>`).join("");
  });
}

function buildFooter() {
  const f = document.createElement("footer");
  f.className = "site-footer site-chrome";
  const who = SITE.instructor.en === SITE.instructor.zh ? SITE.instructor.en : bi(SITE.instructor.en, SITE.instructor.zh);
  f.innerHTML = `<div class="inner">
    ${who}, ${bi(SITE.institution.en, SITE.institution.zh)}. ${SITE.year}.<br>
    ${bi("These notes are for teaching. Check calculations against your own analysis software before using them in research.",
         "本講義供教學使用。用於研究前，請以統計軟體核對計算結果。")}
  </div>`;
  document.body.appendChild(f);
}

function setTitle() {
  const i = SITE.modules.findIndex(m => m.file === currentFile());
  const t = i >= 0 ? `${pad(i)} ${SITE.modules[i].en} | ${SITE.modules[i].zh}` : null;
  if (t) document.title = `${t} — ${SITE.title.en}`;
}

function renderMath() {
  if (typeof renderMathInElement === "function") {
    renderMathInElement(document.body, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "\\(", right: "\\)", display: false }
      ],
      throwOnError: false
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  buildHeader();
  buildNav();
  buildModuleList();
  buildPager();
  buildFooter();
  setTitle();
  setLang(getLang());
  renderMath();
});
