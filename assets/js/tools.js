/* =========================================================
   tools.js — interactive teaching tools
   Embed any tool in a page with an empty element:
     <div data-tool="assoc"></div>      2×2 measures of association
     <div data-tool="misclass"></div>   exposure misclassification
     <div data-tool="confound"></div>   stratified analysis / Mantel–Haenszel
     <div data-tool="screen"></div>     screening test predictive values
     <div data-tool="hero"></div>       compact 2×2 for the home page
   Table layout everywhere:  rows = exposed / unexposed,
                             columns = cases (D+) / non-cases (D−)
                             a b / c d
   ========================================================= */

(function () {
  const B = (en, zh) =>
    `<span class="bi"><span lang="en">${en}</span><span lang="zh-Hant">${zh}</span></span>`;
  const Z = 1.959964;

  const num = (v) => {
    const x = Number(v);
    return Number.isFinite(x) && x >= 0 ? x : NaN;
  };
  const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "—");
  const pct = (x, d = 1) => (Number.isFinite(x) ? (100 * x).toFixed(d) + "%" : "—");
  const ci = (lo, hi, d = 2) =>
    Number.isFinite(lo) && Number.isFinite(hi) ? `95% CI ${lo.toFixed(d)}–${hi.toFixed(d)}` : "";

  /* Core 2×2 statistics (Wald CIs; log scale for ratios). */
  function stats2x2(a, b, c, d) {
    const zero = [a, b, c, d].some((x) => x === 0);
    const k = zero ? 0.5 : 0; // Haldane–Anscombe correction for ratio measures
    const A = a + k, Bc = b + k, C = c + k, D = d + k;
    const n1 = a + b, n0 = c + d;
    const r1 = a / n1, r0 = c / n0;
    const rr = (A / (A + Bc)) / (C / (C + D));
    const seLnRR = Math.sqrt(1 / A - 1 / (A + Bc) + 1 / C - 1 / (C + D));
    const or = (A * D) / (Bc * C);
    const seLnOR = Math.sqrt(1 / A + 1 / Bc + 1 / C + 1 / D);
    const rd = r1 - r0;
    const seRD = Math.sqrt((r1 * (1 - r1)) / n1 + (r0 * (1 - r0)) / n0);
    const rTot = (a + c) / (n1 + n0);
    return {
      zero, r1, r0, rTot,
      rr, rrLo: Math.exp(Math.log(rr) - Z * seLnRR), rrHi: Math.exp(Math.log(rr) + Z * seLnRR),
      or, orLo: Math.exp(Math.log(or) - Z * seLnOR), orHi: Math.exp(Math.log(or) + Z * seLnOR),
      rd, rdLo: rd - Z * seRD, rdHi: rd + Z * seRD,
      afe: (rr - 1) / rr,                 // attributable fraction among the exposed
      paf: (rTot - r0) / rTot,            // population attributable fraction (cohort data)
      pafCC: (a / (a + c)) * ((or - 1) / or) // Miettinen's formula (case-control data)
    };
  }

  function tableHTML(id, vals, editable = true, caseLabel, nonLabel) {
    const cell = (key, v, isCase, letter) => editable
      ? `<td class="cell${isCase ? " case" : ""}"><span class="letter">${letter}</span><input inputmode="numeric" aria-label="${letter}" data-k="${key}" value="${v}"></td>`
      : `<td class="cell${isCase ? " case" : ""}"><span class="letter">${letter}</span><span data-o="${key}">${v}</span></td>`;
    return `<table class="twobytwo" id="${id}">
      <thead><tr><th></th><th>${caseLabel || B("Cases (D+)", "病例 (D+)")}</th><th>${nonLabel || B("Non-cases (D−)", "非病例 (D−)")}</th></tr></thead>
      <tbody>
        <tr><th scope="row">${B("Exposed (E+)", "曝露 (E+)")}</th>${cell("a", vals.a, true, "a")}${cell("b", vals.b, false, "b")}</tr>
        <tr><th scope="row">${B("Unexposed (E−)", "未曝露 (E−)")}</th>${cell("c", vals.c, true, "c")}${cell("d", vals.d, false, "d")}</tr>
      </tbody></table>`;
  }

  function readTable(root) {
    const o = {};
    root.querySelectorAll("input[data-k]").forEach((i) => (o[i.dataset.k] = num(i.value)));
    return o;
  }

  const result = (labelEn, labelZh, value, ciText = "", emph = false) =>
    `<div class="result${emph ? " emph" : ""}"><div class="label">${B(labelEn, labelZh)}</div>
     <div class="value">${value}</div>${ciText ? `<div class="ci">${ciText}</div>` : ""}</div>`;

  /* ---------- 1. Measures of association ---------- */
  function assoc(el) {
    el.classList.add("tool");
    el.innerHTML = `
      <h3>${B("2×2 table calculator", "2×2 表計算器")}</h3>
      <div class="tool-row" role="radiogroup" aria-label="Design">
        <span>${B("Data come from a", "資料來源")}</span>
        <label><input type="radio" name="design-${el.id || "a"}" value="cohort" checked> ${B("cohort / trial", "世代研究／試驗")}</label>
        <label><input type="radio" name="design-${el.id || "a"}" value="cc"> ${B("case-control study", "病例對照研究")}</label>
      </div>
      <div class="tool-grid">
        <div>${tableHTML("", { a: 30, b: 70, c: 10, d: 90 })}
          <div class="tool-row">
            <button class="preset" data-p="30,70,10,90">${B("Common outcome", "常見結果")}</button>
            <button class="preset" data-p="12,988,4,996">${B("Rare outcome", "罕見結果")}</button>
            <button class="preset" data-p="20,80,20,80">${B("No association", "無關聯")}</button>
          </div></div>
        <div><div class="results" aria-live="polite"></div><p class="warn" hidden></p></div>
      </div>
      <p class="tool-note">${B(
        "Wald 95% confidence intervals (log scale for ratios). If any cell is zero, 0.5 is added to every cell for the ratio measures.",
        "95% 信賴區間採 Wald 法（比值類指標取對數尺度）。若任一格為 0，比值類指標於每格加 0.5 校正。")}</p>`;

    const out = el.querySelector(".results"), warn = el.querySelector(".warn");
    function update() {
      const { a, b, c, d } = readTable(el);
      const design = el.querySelector('input[type="radio"]:checked').value;
      if ([a, b, c, d].some(Number.isNaN) || a + b === 0 || c + d === 0) {
        out.innerHTML = ""; warn.hidden = false;
        warn.innerHTML = B("Enter a non-negative count in every cell, with at least one person in each row.",
                           "每一格請輸入非負數，且每一列至少一人。");
        return;
      }
      warn.hidden = true;
      const s = stats2x2(a, b, c, d);
      if (design === "cohort") {
        out.innerHTML =
          result("Risk, exposed", "曝露組風險", pct(s.r1)) +
          result("Risk, unexposed", "未曝露組風險", pct(s.r0)) +
          result("Risk ratio", "相對危險性 (RR)", f(s.rr), ci(s.rrLo, s.rrHi), true) +
          result("Risk difference", "風險差 (RD)", pct(s.rd), ci(100 * s.rdLo, 100 * s.rdHi, 1) + " pp") +
          result("Odds ratio", "勝算比 (OR)", f(s.or), ci(s.orLo, s.orHi)) +
          result("Attributable fraction, exposed", "曝露組可歸因分率", pct(s.afe)) +
          result("Population attributable fraction", "族群可歸因分率 (PAF)", pct(s.paf));
      } else {
        out.innerHTML =
          result("Odds ratio", "勝算比 (OR)", f(s.or), ci(s.orLo, s.orHi), true) +
          result("Cases who were exposed", "病例中曝露比例", pct(a / (a + c))) +
          result("Controls who were exposed", "對照中曝露比例", pct(b / (b + d))) +
          result("PAF (Miettinen)", "族群可歸因分率 (Miettinen)", pct(s.pafCC)) +
          `<div class="result"><div class="label">${B("Why no risks?", "為何沒有風險？")}</div>
           <div class="ci">${B("Cases and controls were sampled separately, so the column totals are set by the investigator. Risks and the risk ratio cannot be calculated directly.",
                                 "病例與對照分別抽樣，欄總數由研究者決定，因此無法直接計算風險與相對危險性。")}</div></div>`;
      }
    }
    el.addEventListener("input", update);
    el.addEventListener("change", update);
    el.querySelectorAll(".preset").forEach((btn) => btn.addEventListener("click", () => {
      const v = btn.dataset.p.split(",");
      ["a", "b", "c", "d"].forEach((k, i) => (el.querySelector(`input[data-k="${k}"]`).value = v[i]));
      update();
    }));
    update();
  }

  /* ---------- 2. Misclassification ---------- */
  function misclass(el) {
    el.classList.add("tool");
    const slider = (key, en, zh, val) => `
      <div class="slider"><label for="${key}-${uid}">${B(en, zh)}</label>
      <input type="range" id="${key}-${uid}" data-s="${key}" min="50" max="100" step="1" value="${val}">
      <output data-for="${key}">${val}%</output></div>`;
    const uid = Math.random().toString(36).slice(2, 7);
    el.innerHTML = `
      <h3>${B("Exposure misclassification simulator", "曝露錯誤分類模擬器")}</h3>
      <p>${B("Start from the true case-control table, then set how accurately exposure is measured.",
             "從真實的病例對照資料出發，設定曝露測量的準確度。")}</p>
      <div class="tool-grid">
        <div>
          <h4>${B("True table", "真實資料")}</h4>
          ${tableHTML("", { a: 200, b: 100, c: 100, d: 200 }, true, B("Cases", "病例"), B("Controls", "對照"))}
          <h4>${B("Observed table", "觀察到的資料")}</h4>
          ${tableHTML("", { a: "", b: "", c: "", d: "" }, false, B("Cases", "病例"), B("Controls", "對照"))}
        </div>
        <div>
          ${slider("seCase", "Sensitivity in cases", "病例之敏感度", 80)}
          ${slider("spCase", "Specificity in cases", "病例之特異度", 90)}
          <div class="tool-row"><label><input type="checkbox" data-nd checked>
            ${B("Same accuracy in controls (non-differential)", "對照組準確度相同（非差異性）")}</label></div>
          <div data-ctrl hidden>
            ${slider("seCtrl", "Sensitivity in controls", "對照之敏感度", 70)}
            ${slider("spCtrl", "Specificity in controls", "對照之特異度", 90)}
          </div>
          <div class="results" aria-live="polite" style="margin-top:1rem"></div>
          <p class="tool-note" data-msg></p>
        </div>
      </div>`;

    const out = el.querySelector(".results"), msg = el.querySelector("[data-msg]");
    const val = (k) => Number(el.querySelector(`[data-s="${k}"]`).value) / 100;
    function update() {
      el.querySelectorAll("output[data-for]").forEach((o) =>
        (o.textContent = el.querySelector(`[data-s="${o.dataset.for}"]`).value + "%"));
      const nd = el.querySelector("[data-nd]").checked;
      el.querySelector("[data-ctrl]").hidden = nd;
      const { a, b, c, d } = readTable(el);
      if ([a, b, c, d].some(Number.isNaN)) { out.innerHTML = ""; return; }
      const se1 = val("seCase"), sp1 = val("spCase");
      const se0 = nd ? se1 : val("seCtrl"), sp0 = nd ? sp1 : val("spCtrl");
      const oa = se1 * a + (1 - sp1) * c, oc = a + c - oa;
      const ob = se0 * b + (1 - sp0) * d, od = b + d - ob;
      const obs = { a: oa, b: ob, c: oc, d: od };
      Object.entries(obs).forEach(([k, v]) => (el.querySelector(`[data-o="${k}"]`).textContent = v.toFixed(0)));
      const trueOR = (a * d) / (b * c), obsOR = (oa * od) / (ob * oc);
      out.innerHTML = result("True OR", "真實 OR", f(trueOR)) + result("Observed OR", "觀察 OR", f(obsOR), "", true);
      const toward = Math.abs(Math.log(obsOR)) < Math.abs(Math.log(trueOR));
      msg.innerHTML = nd
        ? B("Non-differential misclassification of a binary exposure has pulled the estimate toward the null (OR = 1).",
            "二元曝露的非差異性錯誤分類使估計值趨向虛無值 (OR = 1)。")
        : toward
          ? B("With differential misclassification the bias happens to be toward the null here. Change the controls' accuracy and it can go either way.",
              "差異性錯誤分類在此恰好偏向虛無值；調整對照組準確度，偏差方向可能相反。")
          : B("Differential misclassification has moved the estimate away from the null: it now overstates the association.",
              "差異性錯誤分類使估計值遠離虛無值，高估了關聯。");
    }
    el.addEventListener("input", update);
    update();
  }

  /* ---------- 3. Stratified analysis ---------- */
  function confound(el) {
    el.classList.add("tool");
    const presets = {
      confounding: [[180, 720, 20, 80], [10, 90, 90, 810]],
      modification: [[40, 60, 20, 120], [20, 80, 20, 80]]
    };
    el.innerHTML = `
      <h3>${B("Stratified analysis: crude vs adjusted", "分層分析：粗估計與調整後估計")}</h3>
      <div class="tool-row">
        <button class="preset" data-p="confounding">${B("Example: confounding", "範例：干擾")}</button>
        <button class="preset" data-p="modification">${B("Example: effect modification", "範例：效應修飾")}</button>
      </div>
      <div class="strata">
        <div data-st="1"><h4>${B("Stratum 1: third variable present", "第 1 層：第三變項存在")}</h4>${tableHTML("", { a: 180, b: 720, c: 20, d: 80 })}</div>
        <div data-st="2"><h4>${B("Stratum 2: third variable absent", "第 2 層：第三變項不存在")}</h4>${tableHTML("", { a: 10, b: 90, c: 90, d: 810 })}</div>
      </div>
      <div class="results" aria-live="polite" style="margin-top:1rem"></div>
      <p class="tool-note" data-msg></p>`;

    const out = el.querySelector(".results"), msg = el.querySelector("[data-msg]");
    function update() {
      const s1 = readTable(el.querySelector('[data-st="1"]'));
      const s2 = readTable(el.querySelector('[data-st="2"]'));
      const all = [s1, s2];
      if (all.some((s) => Object.values(s).some(Number.isNaN))) { out.innerHTML = ""; return; }
      const orOf = (s) => (s.a * s.d) / (s.b * s.c);
      const crude = orOf({ a: s1.a + s2.a, b: s1.b + s2.b, c: s1.c + s2.c, d: s1.d + s2.d });
      let numr = 0, den = 0;
      all.forEach((s) => { const n = s.a + s.b + s.c + s.d; numr += (s.a * s.d) / n; den += (s.b * s.c) / n; });
      const mh = numr / den, or1 = orOf(s1), or2 = orOf(s2);
      out.innerHTML =
        result("Crude OR", "粗勝算比", f(crude)) +
        result("OR, stratum 1", "第 1 層 OR", f(or1)) +
        result("OR, stratum 2", "第 2 層 OR", f(or2)) +
        result("Mantel–Haenszel OR", "Mantel–Haenszel 合併 OR", f(mh), "", true);
      const ratio = Math.max(or1, or2) / Math.min(or1, or2);
      const change = Math.abs(crude - mh) / mh;
      if (ratio > 2) {
        msg.innerHTML = B(
          `The stratum-specific ORs differ (${f(or1)} vs ${f(or2)}). That suggests effect modification: report the strata separately rather than one summary OR.`,
          `各層 OR 不同（${f(or1)} 對 ${f(or2)}），提示可能有效應修飾：應分層呈現，而非只報告單一彙總 OR。`);
      } else if (change > 0.1) {
        msg.innerHTML = B(
          `The strata agree with each other but the crude OR differs from the adjusted OR by ${(100 * change).toFixed(0)}%. That pattern points to confounding by the stratifying variable.`,
          `各層結果一致，但粗 OR 與調整後 OR 相差 ${(100 * change).toFixed(0)}%，提示分層變項造成干擾。`);
      } else {
        msg.innerHTML = B("Crude and adjusted ORs are similar and the strata agree: little evidence of confounding or effect modification by this variable.",
                          "粗估計與調整後估計相近、各層一致：此變項的干擾或效應修飾證據有限。");
      }
    }
    el.addEventListener("input", update);
    el.querySelectorAll(".preset").forEach((btn) => btn.addEventListener("click", () => {
      presets[btn.dataset.p].forEach((vals, i) => {
        const st = el.querySelector(`[data-st="${i + 1}"]`);
        ["a", "b", "c", "d"].forEach((k, j) => (st.querySelector(`input[data-k="${k}"]`).value = vals[j]));
      });
      update();
    }));
    update();
  }

  /* ---------- 4. Screening ---------- */
  function screen(el) {
    el.classList.add("tool");
    const uid = Math.random().toString(36).slice(2, 7);
    // prevalence slider steps through these values (in %)
    const PREVS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 30, 50];
    const toPrev = (v) => PREVS[v] / 100;
    el.innerHTML = `
      <h3>${B("Predictive values depend on prevalence", "預測值取決於盛行率")}</h3>
      <div class="slider"><label for="se-${uid}">${B("Sensitivity", "敏感度")}</label>
        <input type="range" id="se-${uid}" data-s="se" min="50" max="100" step="0.5" value="90"><output data-for="se"></output></div>
      <div class="slider"><label for="sp-${uid}">${B("Specificity", "特異度")}</label>
        <input type="range" id="sp-${uid}" data-s="sp" min="50" max="100" step="0.5" value="95"><output data-for="sp"></output></div>
      <div class="slider"><label for="pv-${uid}">${B("Prevalence", "盛行率")}</label>
        <input type="range" id="pv-${uid}" data-s="pv" min="0" max="9" step="1" value="3"><output data-for="pv"></output></div>
      <div class="tool-row">
        <button class="preset" data-p="3">${B("Population screening (1%)", "族群篩檢 (1%)")}</button>
        <button class="preset" data-p="7">${B("Specialist clinic (20%)", "專科門診 (20%)")}</button>
      </div>
      <div class="results" aria-live="polite"></div>
      <p style="margin:1rem 0 0">${B("1,000 people tested:", "受檢 1,000 人：")}</p>
      <div class="icon-array" aria-hidden="true"></div>
      <div class="legend">
        <span><i style="background:var(--crimson)"></i>${B("Diseased, test +", "有病且陽性")}</span>
        <span><i style="box-shadow:inset 0 0 0 1.5px var(--crimson)"></i>${B("Diseased, test − (missed)", "有病但陰性（漏診）")}</span>
        <span><i style="background:var(--amber)"></i>${B("Healthy, test + (false alarm)", "無病但陽性（偽陽性）")}</span>
        <span><i style="background:var(--rule)"></i>${B("Healthy, test −", "無病且陰性")}</span>
      </div>
      <p class="tool-note" data-msg></p>`;

    const grid = el.querySelector(".icon-array");
    grid.innerHTML = "<span></span>".repeat(1000);
    const dots = grid.children, out = el.querySelector(".results"), msg = el.querySelector("[data-msg]");
    function update() {
      const se = Number(el.querySelector('[data-s="se"]').value) / 100;
      const sp = Number(el.querySelector('[data-s="sp"]').value) / 100;
      const p = toPrev(Number(el.querySelector('[data-s="pv"]').value));
      el.querySelector('[data-for="se"]').textContent = (se * 100).toFixed(1) + "%";
      el.querySelector('[data-for="sp"]').textContent = (sp * 100).toFixed(1) + "%";
      el.querySelector('[data-for="pv"]').textContent = (p * 100 < 1 ? (p * 100).toFixed(1) : (p * 100).toFixed(0)) + "%";
      const tp = se * p, fn = (1 - se) * p, fp = (1 - sp) * (1 - p), tn = sp * (1 - p);
      const ppv = tp / (tp + fp), npv = tn / (tn + fn);
      out.innerHTML =
        result("Positive predictive value", "陽性預測值 (PPV)", pct(ppv), "", true) +
        result("Negative predictive value", "陰性預測值 (NPV)", pct(npv, 2)) +
        result("Positives that are false", "陽性中的偽陽性", pct(1 - ppv));
      const nTP = Math.round(tp * 1000), nFN = Math.round(fn * 1000), nFP = Math.round(fp * 1000);
      for (let i = 0; i < 1000; i++) {
        dots[i].className = i < nTP ? "tp" : i < nTP + nFN ? "fn" : i < nTP + nFN + nFP ? "fp" : "";
      }
      msg.innerHTML = B(
        `Of every 1,000 people tested, about ${nTP + nFP} test positive; ${nTP} of them have the disease.`,
        `每 1,000 名受檢者中約 ${nTP + nFP} 人陽性，其中 ${nTP} 人真正有病。`);
    }
    el.addEventListener("input", update);
    el.querySelectorAll(".preset").forEach((btn) => btn.addEventListener("click", () => {
      el.querySelector('[data-s="pv"]').value = btn.dataset.p; update();
    }));
    update();
  }

  /* ---------- 5. Hero (home page) ---------- */
  function hero(el) {
    el.classList.add("hero-table");
    el.innerHTML = `${tableHTML("", { a: 30, b: 70, c: 10, d: 90 })}
      <div class="readout" aria-live="polite"></div>
      <p class="hint">${B("Type in any cell. When the outcome is common, the odds ratio drifts away from the risk ratio.",
                          "任意修改數字。當結果常見時，勝算比會偏離相對危險性。")}</p>`;
    const out = el.querySelector(".readout");
    function update() {
      const { a, b, c, d } = readTable(el);
      if ([a, b, c, d].some(Number.isNaN) || a + b === 0 || c + d === 0) { out.innerHTML = "—"; return; }
      const s = stats2x2(a, b, c, d);
      out.innerHTML = `<span>RR <b>${f(s.rr)}</b></span><span>OR <b>${f(s.or)}</b></span>
        <span>RD <b>${(100 * s.rd).toFixed(1)}</b> pp</span>`;
    }
    el.addEventListener("input", update);
    update();
  }

  const registry = { assoc, misclass, confound, screen, hero };
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-tool]").forEach((el, i) => {
      if (!el.id) el.id = "tool-" + i;
      const fn = registry[el.dataset.tool];
      if (fn) fn(el);
    });
  });
})();
