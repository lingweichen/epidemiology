# Principles of Epidemiology | 流行病學原理

Bilingual (English / Traditional Chinese) course notes with interactive tools, built as a plain static site for GitHub Pages. No build step, no installs: edit the HTML files and push.

## Publish on GitHub Pages

1. Create a new repository on GitHub (for example `epi-course`). Public repositories get Pages for free.
2. Upload everything in this folder to the repository root (on github.com: **Add file → Upload files**, then drag the contents in). Keep the hidden `.nojekyll` file.
3. Go to **Settings → Pages**. Under *Build and deployment*, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, and save.
4. After a minute or two the site is live at `https://<your-username>.github.io/epi-course/`.

To preview locally, run `python3 -m http.server` in this folder and open http://localhost:8000.

## What's in the folder

| Path | Purpose |
|---|---|
| `index.html` | Home page with a live 2×2 table |
| `01-frequency.html` … `06-screening.html` | Course modules |
| `tools.html` | All calculators on one page |
| `glossary.html` | English–Chinese terms with a filter box |
| `module-template.html` | Copy this to start a new module |
| `assets/js/site.js` | Course title, instructor, and the module list (edit here) |
| `assets/js/tools.js` | The interactive calculators |
| `assets/css/style.css` | Colors, fonts, layout (tokens at the top) |
| `assets/vendor/katex/` | Math rendering, bundled so it works offline |

## Common edits

**Course details.** Open `assets/js/site.js` and change `title`, `subtitle`, `instructor`, `institution`, and `year`. Add your Chinese name to `instructor.zh`.

**Add a module.** Copy `module-template.html` to a new name such as `07-survival.html`, write the content, then add one line to `SITE.modules` in `site.js`. The sidebar, home-page list, and previous/next links update automatically.

**Bilingual text.** Write paragraphs in pairs:

```html
<p lang="en">English text.</p>
<p lang="zh-Hant">中文內容。</p>
```

For short text such as headings and labels:

```html
<span class="bi"><span lang="en">Risk ratio</span><span lang="zh-Hant">相對危險性</span></span>
```

The EN / 中文 / 雙語 switch in the header shows one language or both. Readers' choice is remembered; you can also link to a specific mode with `?lang=en`, `?lang=zh`, or `?lang=both`.

**Math.** Use LaTeX: `\( ... \)` for inline and `$$ ... $$` for displayed equations.

**Embed a tool.** Add an empty element anywhere in a page: `<div data-tool="assoc"></div>`. Available tools: `assoc` (2×2 measures of association), `misclass` (exposure misclassification), `confound` (stratified analysis and Mantel–Haenszel), `screen` (predictive values), `hero` (compact 2×2).

**Self-check questions.** Use `<details class="check">` with a `<summary>` for the question and `<div class="answer">` for the answer, as in the template.

## Notes

The calculators use Wald confidence intervals and are meant for teaching. Text in Chinese uses Taiwan terminology, including 曝露 for "exposure". KaTeX is MIT-licensed (license in `assets/vendor/katex/`).

---

## 中文說明

**發布：** 在 GitHub 建立新儲存庫，將本資料夾所有內容（含隱藏檔 `.nojekyll`）上傳至根目錄；到 **Settings → Pages**，選擇 **Deploy from a branch**、分支 `main`、資料夾 `/ (root)` 後儲存。約一兩分鐘後即可於 `https://<帳號>.github.io/<儲存庫名稱>/` 瀏覽。

**修改課程資訊：** 編輯 `assets/js/site.js` 中的標題、授課教師、單位與年份。

**新增單元：** 複製 `module-template.html` 並改名，撰寫內容後，在 `site.js` 的 `SITE.modules` 加入一行即可，側欄與上一頁／下一頁連結會自動更新。

**雙語寫法：** 段落以 `<p lang="en">` 與 `<p lang="zh-Hant">` 成對撰寫；標題等短文字使用 `<span class="bi">…</span>`。數學式使用 LaTeX 語法。
