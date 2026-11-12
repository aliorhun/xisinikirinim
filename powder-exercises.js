/* Toz yöntemi › Alıştırmalar: toz desenlerinin indislenmesi (Problemler 10-1 – 10-6).
 * Saf hesap çekirdeği Node testleri için dışa aktarılır; DOM bölümü yalnızca
 * #powderExercises bulunduğunda çalışır. Tüm tablolar verilen sin²θ değerlerinden
 * tarayıcıda hesaplanır. Run tests: node --test tests/powder-exercises.test.cjs
 */
(function (root) {
  'use strict';

  /* =================== 1. HESAP ÇEKİRDEĞİ =================== */
  const LAMBDA = {
    CuKa1: 1.540562,   // ders PDF'indeki değer
    CuKa: 1.54184,     // ağırlıklı Kα (karşılaştırma)
    CrKa: 2.29100,     // ağırlıklı Kα (Kα1/Kα2 ayrılmamış)
    CrKa1: 2.28970,
    CrKb: 2.08487
  };
  // Oda sıcaklığı yaklaşık literatür değerleri (Å)
  const REF = {
    Al: 4.0495, Fe: 2.8665, Cr: 2.8846, Si: 5.4310, Ge: 5.6575, W: 3.1652, Mo: 3.1470,
    In: { a: 3.2523, c: 4.9461 }, Mg: { a: 3.2094, c: 5.2105 }
  };
  const DATA = {
    p101: [.1118, .1487, .294, .403, .439, .583, .691, .727, .872, .981],
    p102: { s: [.265, .321, .528, .638, .793, .958], I: ['m', 'vs', 'w', 's', 's', 'vs'] },
    p103: [.0806, .0975, .1122, .210, .226, .274, .305, .321],
    p104: [.0603, .1610, .221, .322, .383, .484, .545, .645],
    p105: [.1202, .238, .357, .475, .593, .711, .830],
    p106: [.0768, .0876, .0913, .1645, .231, .274, .308, .319]
  };

  const deg = r => r * 180 / Math.PI;
  const rad = d => d * Math.PI / 180;
  const thetaRad = s => Math.asin(Math.sqrt(s));
  const twoThetaDeg = s => 2 * deg(thetaRad(s));
  const sin2FromTwoTheta = tt => Math.sin(rad(tt / 2)) ** 2;
  const dSpacing = (s, lam) => lam / (2 * Math.sqrt(s));
  const aCubic = (s, N, lam) => lam * Math.sqrt(N) / (2 * Math.sqrt(s));
  /** Nelson–Riley: θ mutlaka radyan. */
  function nelsonRiley(s) {
    const t = thetaRad(s), c2 = Math.cos(t) ** 2;
    return 0.5 * (c2 / Math.sin(t) + c2 / t);
  }
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  function linearFit(x, y) {
    const n = x.length, xbar = mean(x), ybar = mean(y);
    let sxy = 0, sxx = 0;
    x.forEach((xi, i) => { sxy += (xi - xbar) * (y[i] - ybar); sxx += (xi - xbar) ** 2; });
    const slope = sxy / sxx;
    return { n, xbar, ybar, sxy, sxx, slope, intercept: ybar - slope * xbar };
  }
  /** Tek parametreli en küçük kareler: sin²θ = K·N */
  function lsqK(S, N) {
    let sn = 0, nn = 0;
    S.forEach((s, i) => { sn += s * N[i]; nn += N[i] * N[i]; });
    return { K: sn / nn, sn, nn };
  }
  /** İki parametreli en küçük kareler: sin²θ = A·p + C·q */
  function lsq2(P, Q, S) {
    let Spp = 0, Spq = 0, Sqq = 0, Sps = 0, Sqs = 0;
    S.forEach((s, i) => { const p = P[i], q = Q[i]; Spp += p * p; Spq += p * q; Sqq += q * q; Sps += p * s; Sqs += q * s; });
    const det = Spp * Sqq - Spq * Spq;
    return { Spp, Spq, Sqq, Sps, Sqs, det, A: (Sps * Sqq - Sqs * Spq) / det, C: (Spp * Sqs - Spq * Sps) / det };
  }

  // İzinli N = h²+k²+l² kümeleri (P, I, F, elmas)
  const CUBIC_SETS = (function () {
    const sets = { P: new Set(), I: new Set(), F: new Set(), D: new Set() };
    for (let h = 0; h <= 9; h++) for (let k = 0; k <= h; k++) for (let l = 0; l <= k; l++) {
      const n = h * h + k * k + l * l; if (!n || n > 100) continue;
      sets.P.add(n);
      if ((h + k + l) % 2 === 0) sets.I.add(n);
      const par = [h, k, l].map(x => x % 2), allOdd = par.every(Boolean), allEven = par.every(x => !x);
      if (allOdd || allEven) sets.F.add(n);
      if (allOdd || (allEven && (h + k + l) % 4 === 0)) sets.D.add(n);
    }
    const out = {};
    for (const k in sets) out[k] = [...sets[k]].sort((a, b) => a - b);
    return out;
  })();
  const HKL_OF_N = (function () {
    const m = {};
    for (let h = 9; h >= 0; h--) for (let k = h; k >= 0; k--) for (let l = k; l >= 0; l--) {
      const n = h * h + k * k + l * l; if (!n || n > 100) continue;
      (m[n] = m[n] || []).push('' + h + k + l);
    }
    return m;
  })();

  /**
   * Algoritma 3 — kübik oran yöntemi.
   * m ∈ {1,2,3}: kübikte ilk çizginin N'si 1 (P), 2 (I) ya da 3 (F, elmas) olabilir.
   * Her örgü için m·R'ye en yakın izinli N seçilir; ret ölçütleri:
   * bağıl sapma > tol, tekrar eden N, ya da arada eksik izinli N.
   */
  function cubicSearch(S, tol) {
    tol = tol || 0.03;
    const R = S.map(s => s / S[0]), out = [];
    for (const m of [1, 2, 3]) for (const L of ['P', 'I', 'F', 'D']) {
      const allowed = CUBIC_SETS[L], v = R.map(r => m * r);
      const N = v.map(x => allowed.reduce((a, b) => Math.abs(b - x) < Math.abs(a - x) ? b : a));
      const dev = v.map((x, i) => Math.abs(x - N[i]) / N[i]), maxDev = Math.max(...dev);
      const increasing = N.every((n, i) => i === 0 || n > N[i - 1]);
      const missing = allowed.filter(n => n <= N[N.length - 1] && !N.includes(n));
      let reason = null;
      if (maxDev > tol) reason = { code: 'dev', value: maxDev };
      else if (!increasing) reason = { code: 'repeat' };
      else if (missing.length) reason = { code: 'missing', list: missing };
      out.push({ m, lattice: L, N, values: v, maxDev, ok: !reason, reason });
    }
    return out;
  }

  /** Algoritma 9 — beklenen yansımalar (tetragonal I veya HCP). */
  function expectedReflections(A, C, kind, smax) {
    const seen = new Map();
    for (let h = 0; h <= 5; h++) for (let k = 0; k <= h; k++) for (let l = 0; l <= 7; l++) {
      if (h + k + l === 0) continue;
      if (kind === 'tetI' && (h + k + l) % 2) continue;
      const p = kind === 'tetI' ? h * h + k * k : h * h + h * k + k * k;
      const v = p * A + l * l * C; if (v > smax) continue;
      const key = p + '_' + l; if (seen.has(key)) continue;
      const extinct = kind === 'hcp' && (h - k) % 3 === 0 && l % 2 === 1; // h+2k=3n ve l tek
      seen.set(key, { hkl: '' + h + k + l, p, l2: l * l, sin2: v, extinct });
    }
    return [...seen.values()].sort((a, b) => a.sin2 - b.sin2);
  }

  /** Algoritma 8 — Kα/Kβ çiftlerinin ayrılması. */
  function pairKaKb(S, lamA, lamB, tol) {
    tol = tol || 0.005;
    const r = (lamB / lamA) ** 2, pairs = [], used = new Set(), all = [];
    for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) {
      const q = S[i] / S[j], ok = Math.abs(q - r) <= tol;
      all.push({ i, j, ratio: q, ok });
      if (ok && !used.has(i) && !used.has(j)) { pairs.push({ beta: i, alpha: j, ratio: q }); used.add(i); used.add(j); }
    }
    return { r, pairs, all };
  }

  /** Geleneksel hücredeki atomlar (kesirli). HCP için orijin bir atom üzerinde. */
  const STRUCTURES = {
    fcc: { sys: 'cubic', atoms: [[0, 0, 0], [0, .5, .5], [.5, 0, .5], [.5, .5, 0]] },
    bcc: { sys: 'cubic', atoms: [[0, 0, 0], [.5, .5, .5]] },
    diamond: { sys: 'cubic', atoms: [[0, 0, 0], [0, .5, .5], [.5, 0, .5], [.5, .5, 0], [.25, .25, .25], [.25, .75, .75], [.75, .25, .75], [.75, .75, .25]] },
    bct: { sys: 'tetragonal', atoms: [[0, 0, 0], [.5, .5, .5]] },
    hcp: { sys: 'hexagonal', atoms: [[0, 0, 0], [2 / 3, 1 / 3, .5]] }
  };
  const frac1 = x => { const r = x - Math.floor(x); return r > 1 - 1e-9 ? 0 : r; };
  /** F/f = Σ exp(2πi(hx+ky+lz)) (tüm atomlar aynı f ile). */
  function structureFactor(atoms, h, k, l) {
    let re = 0, im = 0;
    const phases = atoms.map(p => frac1(h * p[0] + k * p[1] + l * p[2]));
    phases.forEach(ph => { re += Math.cos(2 * Math.PI * ph); im += Math.sin(2 * Math.PI * ph); });
    if (Math.abs(re) < 1e-9) re = 0;
    if (Math.abs(im) < 1e-9) im = 0;
    return { re, im, abs2: re * re + im * im, abs: Math.hypot(re, im), phases };
  }
  const perms3 = a => [[a[0], a[1], a[2]], [a[0], a[2], a[1]], [a[1], a[0], a[2]], [a[1], a[2], a[0]], [a[2], a[0], a[1]], [a[2], a[1], a[0]]];
  /** Toz çokluğu: Laue sınıfı m-3m, 4/mmm ya da 6/mmm altındaki eşdeğer (hkl) sayısı. */
  function multiplicity(sys, h, k, l) {
    const set = new Set(), z = x => (x === 0 ? 0 : x), add = (a, b, c) => set.add(z(a) + ',' + z(b) + ',' + z(c)), sg = [1, -1];
    if (sys === 'cubic') perms3([h, k, l]).forEach(q => sg.forEach(a => sg.forEach(b => sg.forEach(c => add(a * q[0], b * q[1], c * q[2])))));
    else if (sys === 'tetragonal') [[h, k], [k, h]].forEach(q => sg.forEach(a => sg.forEach(b => sg.forEach(c => add(a * q[0], b * q[1], c * l)))));
    else perms3([h, k, -h - k]).forEach(q => sg.forEach(a => sg.forEach(c => add(a * q[0], a * q[1], c * l))));
    return set.size;
  }
  function dHKL(sys, a, c, h, k, l) {
    if (sys === 'cubic') return a / Math.sqrt(h * h + k * k + l * l);
    if (sys === 'tetragonal') return 1 / Math.sqrt((h * h + k * k) / (a * a) + l * l / (c * c));
    return 1 / Math.sqrt(4 / 3 * (h * h + h * k + k * k) / (a * a) + l * l / (c * c));
  }
  /** Dört indisli Miller–Bravais gösterimi (h k i l), i = −(h + k). */
  const millerBravais = (h, k, l) => [h, k, -(h + k), l];

  function solve() {
    const L1 = LAMBDA.CuKa1;
    // 10-1
    const N1 = [3, 4, 8, 11, 12, 16, 19, 20, 24, 27];
    const S1 = DATA.p101, a1 = S1.map((s, i) => aCubic(s, N1[i], L1));
    const p101 = {
      S: S1, N: N1, hkl: ['111', '200', '220', '311', '222', '400', '331', '420', '422', '333/511'], a: a1,
      mean: mean(a1), nr: linearFit(S1.map(nelsonRiley), a1),
      nrWeighted: linearFit(S1.map(nelsonRiley), S1.map((s, i) => aCubic(s, N1[i], LAMBDA.CuKa))).intercept,
      lsq: lsqK(S1, N1), search: cubicSearch(S1)
    };
    p101.lsq.a = L1 / (2 * Math.sqrt(p101.lsq.K));
    // 10-2
    const S2 = DATA.p102.s, pk = pairKaKb(S2, LAMBDA.CrKa, LAMBDA.CrKb);
    const SA = pk.pairs.map(p => S2[p.alpha]), SB = pk.pairs.map(p => S2[p.beta]), N2 = [2, 4, 6];
    const a2 = SA.map((s, i) => aCubic(s, N2[i], LAMBDA.CrKa)).concat(SB.map((s, i) => aCubic(s, N2[i], LAMBDA.CrKb)));
    const p102 = { pairing: pk, SA, SB, N: N2, hkl: ['110', '200', '211'], a: a2, mean: mean(a2),
      aIfPrimitive: aCubic(SA[0], 1, LAMBDA.CrKa), search: cubicSearch(SA) };
    // 10-3 (I-tetragonal)
    const S3 = DATA.p103;
    const as3 = [[1, 1, '101'], [0, 4, '002'], [2, 0, '110'], [2, 4, '112'], [4, 0, '200'], [1, 9, '103'], [5, 1, '211'], [4, 4, '202']];
    const f3 = lsq2(as3.map(x => x[0]), as3.map(x => x[1]), S3);
    const p103 = { S: S3, assign: as3, fit: f3, a: L1 / (2 * Math.sqrt(f3.A)), c: L1 / (2 * Math.sqrt(f3.C)),
      Aest: (S3[2] / 2 + S3[4] / 4) / 2, Cest: S3[1] / 4, search: cubicSearch(S3) };
    p103.expected = expectedReflections(f3.A, f3.C, 'tetI', S3[S3.length - 1] + 0.005);
    // 10-4
    const N4 = [3, 8, 11, 16, 19, 24, 27, 32], S4 = DATA.p104, a4 = S4.map((s, i) => aCubic(s, N4[i], L1));
    const p104 = { S: S4, N: N4, hkl: ['111', '220', '311', '400', '331', '422', '333/511', '440'], a: a4, mean: mean(a4),
      lsq: lsqK(S4, N4), search: cubicSearch(S4) };
    p104.lsq.a = L1 / (2 * Math.sqrt(p104.lsq.K));
    p104.K = L1 ** 2 / (4 * p104.mean ** 2);
    p104.fccMissing = [4, 12, 20].map(n => ({ N: n, sin2: p104.K * n }));
    // 10-5
    const N5 = [2, 4, 6, 8, 10, 12, 14], S5 = DATA.p105, a5 = S5.map((s, i) => aCubic(s, N5[i], L1));
    const p105 = { S: S5, N: N5, hkl: ['110', '200', '211', '220', '310', '222', '321'], a: a5, mean: mean(a5),
      nr: linearFit(S5.map(nelsonRiley), a5), search: cubicSearch(S5) };
    // 10-6 (HCP), 0,0913 hariç
    const S6 = DATA.p106;
    const as6 = [[1, 0, '100'], [0, 4, '002'], null, [1, 4, '102'], [3, 0, '110'], [1, 9, '103'], [4, 0, '200'], [3, 4, '112']];
    const idx6 = as6.map((g, i) => g ? i : -1).filter(i => i >= 0);
    const f6 = lsq2(idx6.map(i => as6[i][0]), idx6.map(i => as6[i][1]), idx6.map(i => S6[i]));
    const p106 = { S: S6, assign: as6, fit: f6, used: idx6, a: L1 / Math.sqrt(3 * f6.A), c: L1 / (2 * Math.sqrt(f6.C)),
      Aest: (S6[0] + S6[4] / 3 + S6[6] / 4) / 3, Cest: S6[1] / 4, search: cubicSearch(S6), flagged: 2,
      expected101: f6.A + f6.C };
    p106.expected = expectedReflections(f6.A, f6.C, 'hcp', S6[S6.length - 1] + 0.005);
    return { p101, p102, p103, p104, p105, p106 };
  }

  const api = { LAMBDA, REF, DATA, deg, rad, thetaRad, twoThetaDeg, sin2FromTwoTheta, dSpacing, aCubic, nelsonRiley,
    linearFit, lsqK, lsq2, CUBIC_SETS, HKL_OF_N, cubicSearch, expectedReflections, pairKaKb, solve,
    STRUCTURES, structureFactor, multiplicity, dHKL, millerBravais };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PowderExercises = api;
  if (typeof document === 'undefined') return;

  /* =================== 2. ARAYÜZ =================== */
  function boot() {
    const host = document.getElementById('powderExercises');
    if (!host) return;
    const EN = document.documentElement.lang === 'en';
    const t = (tr, en) => EN ? en : tr;
    const f = (x, n = 4) => { const s = Number(x).toFixed(n).replace('-', '−'); return EN ? s : s.replace('.', ','); };
    const R = solve(), L1 = LAMBDA.CuKa1;
    const P = (a, b) => `<span class="pe-frac"><span>${a}</span><span>${b}</span></span>`;
    const sq = x => `√${x}`;
    const cell = c => (c && typeof c === 'object') ? `<td class="${c.c || ''}">${c.v}</td>` : `<td>${c}</td>`;
    const table = (head, rows, cls) => `<div class="pe-tw"><table class="pe-tbl ${cls || ''}"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => '<tr>' + r.map(cell).join('') + '</tr>').join('')}</tbody></table></div>`;
    const fx = html => `<div class="pe-formula">${html}</div>`;
    const note = (cls, html) => `<div class="pe-note ${cls || ''}">${html}</div>`;
    const metrics = items => `<div class="pe-metrics">${items.map(m => `<div><small>${m[0]}</small><b>${m[1]}</b>${m[2] ? `<small>${m[2]}</small>` : ''}</div>`).join('')}</div>`;
    const near = x => Math.abs(x - Math.round(x)) < 0.12;
    const latName = { P: 'P', I: t('I (HMK)', 'I (BCC)'), F: t('F (YMK)', 'F (FCC)'), D: t('elmas', 'diamond') };

    function algo(o) {
      let h = `<div class="pe-algo"><div class="pe-algo-head"><span class="pe-algo-tag">${o.tag}</span><span>${o.title}</span></div>`;
      if (o.io) h += `<div class="pe-algo-io">${o.io}</div>`;
      h += o.steps.map((st, i) => `<div class="pe-step"><span class="pe-n">${i + 1}</span><div>${st[0]}${st[1] ? `<span class="pe-f">${st[1]}</span>` : ''}</div><div class="pe-ex">${st[2] || ''}</div></div>`).join('');
      if (o.after) h += `<div class="pe-algo-after">${o.after}</div>`;
      if (o.note) h += `<div class="pe-algo-note">${o.note}</div>`;
      if (o.code) h += `<details class="pe-code"><summary>${t('Sözde kod', 'Pseudocode')}</summary><pre>${o.code}</pre></details>`;
      return h + '</div>';
    }

    /* ---------- SVG çizimleri ---------- */
    function sticks(peaks, legend) {
      const W = 900, H = 250, px = 54, py = 26, w = 820, h = 170, X = tt => px + tt / 180 * w;
      let o = `<svg class="pe-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('2θ çizgi konumları', '2θ line positions')}"><line class="pe-ax" x1="${px}" y1="${py + h}" x2="${px + w}" y2="${py + h}"/>`;
      for (let tt = 0; tt <= 180; tt += 20) o += `<line class="pe-ax" x1="${X(tt)}" y1="${py + h}" x2="${X(tt)}" y2="${py + h + 5}"/><text class="pe-tx" x="${X(tt)}" y="${py + h + 20}" text-anchor="middle">${tt}°</text>`;
      o += `<text class="pe-tx" x="${px + w / 2}" y="${H - 4}" text-anchor="middle">2θ (${t('derece', 'degrees')})</text>`;
      peaks.forEach((p, j) => {
        const xx = X(twoThetaDeg(p.s)), yy = py + h - p.h * h;
        o += `<line class="pe-k ${p.c || 'pe-c1'}" x1="${xx}" y1="${py + h}" x2="${xx}" y2="${yy}" ${p.dash ? 'stroke-dasharray="5 4" stroke-width="2"' : 'stroke-width="4"'} stroke-linecap="round"/>`;
        if (p.label) o += `<text class="pe-lb ${p.c || 'pe-c1'}" x="${xx}" y="${Math.max(13, yy - 6 - (j % 3) * 12)}" text-anchor="middle">${p.label}</text>`;
      });
      return o + (legend || '') + '</svg>';
    }
    function extrap(S, a, refs) {
      const W = 900, H = 290, px = 76, py = 20, w = 790, h = 215;
      const fv = S.map(nelsonRiley), fit = linearFit(fv, a), fmax = Math.max(...fv) * 1.08;
      const vals = [...a, fit.intercept, ...refs.map(r => r.v)], ymin = Math.min(...vals) - .006, ymax = Math.max(...vals) + .006;
      const X = v => px + v / fmax * w, Y = v => py + h - (v - ymin) / (ymax - ymin) * h;
      let o = `<svg class="pe-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('Nelson–Riley ekstrapolasyonu', 'Nelson–Riley extrapolation')}">`;
      const ys = (ymax - ymin) > .04 ? .01 : .005;
      for (let v = Math.ceil(ymin / ys) * ys; v <= ymax; v += ys) o += `<line class="pe-grid" x1="${px}" y1="${Y(v)}" x2="${px + w}" y2="${Y(v)}"/><text class="pe-tx" x="${px - 7}" y="${Y(v) + 4}" text-anchor="end">${f(v, 3)}</text>`;
      o += `<line class="pe-ax" x1="${px}" y1="${py + h}" x2="${px + w}" y2="${py + h}"/><line class="pe-ax" x1="${px}" y1="${py}" x2="${px}" y2="${py + h}"/>`;
      const st = fmax > 2 ? .5 : .25;
      for (let v = 0; v <= fmax; v += st) o += `<text class="pe-tx" x="${X(v)}" y="${py + h + 17}" text-anchor="middle">${f(v, 2)}</text>`;
      o += `<text class="pe-tx" x="${px + w / 2}" y="${H - 4}" text-anchor="middle">f(θ) = ½(cos²θ/sinθ + cos²θ/θ) — ${t('f → 0 iken θ → 90°', 'f → 0 as θ → 90°')}</text><text class="pe-tx" x="16" y="${py + h / 2}" transform="rotate(-90 16 ${py + h / 2})" text-anchor="middle">a (Å)</text>`;
      refs.forEach(r => o += `<line class="pe-ref ${r.c}" x1="${px}" y1="${Y(r.v)}" x2="${px + w}" y2="${Y(r.v)}" stroke-dasharray="6 5"/><text class="pe-lb ${r.c}" x="${px + w - 4}" y="${Y(r.v) - 5}" text-anchor="end">${r.n} ${f(r.v, 4)} Å</text>`);
      o += `<line class="pe-fit" x1="${X(0)}" y1="${Y(fit.intercept)}" x2="${X(fmax)}" y2="${Y(fit.intercept + fit.slope * fmax)}"/>`;
      fv.forEach((v, i) => o += `<circle class="pe-pt" cx="${X(v)}" cy="${Y(a[i])}" r="5"/>`);
      o += `<circle class="pe-pt0" cx="${X(0)}" cy="${Y(fit.intercept)}" r="6"/><text class="pe-lb pe-c1" x="${px + 14}" y="${py + h - 10}">● ${t('Ekstrapolasyon (f = 0)', 'Extrapolation (f = 0)')}: a₀ = ${f(fit.intercept, 4)} Å</text>`;
      return o + '</svg>';
    }

    /* ---------- ortak tablolar ---------- */
    function cubicRows(S, N, H, lam, withNR) {
      const k = N[0] === 1 ? 1 : N[0] === 2 ? 2 : 3;
      return S.map((s, i) => {
        const r = s / S[0], mk = m => ({ v: f(m * r, 3), c: m === k ? 'pe-em' : '' });
        const row = [i + 1, f(s, 4), f(twoThetaDeg(s), 2), mk(1), mk(2), mk(3), { v: N[i], c: 'pe-em' }, { v: '(' + H[i] + ')', c: 'pe-em' }, f(dSpacing(s, lam), 4), f(aCubic(s, N[i], lam), 4)];
        if (withNR) row.push(f(nelsonRiley(s), 3));
        return row;
      });
    }
    const cubicHead = nr => ['#', 'sin²θ', '2θ (°)', '1×R', '2×R', '3×R', 'N', '(hkl)', 'd (Å)', 'a (Å)'].concat(nr ? ['f(θ) N–R'] : []);
    function reasonText(r) {
      if (!r) return t('Uygun ✓', 'Accepted ✓');
      if (r.code === 'dev') return t('Sapma %', 'Deviation ') + f(r.value * 100, 1) + (EN ? '%' : '') + ' > 3' + (EN ? '%' : '');
      if (r.code === 'repeat') return t('Aynı N tekrar ediyor', 'Repeated N');
      return t('Eksik N: ', 'Missing N: ') + r.list.slice(0, 6).join(', ') + (r.list.length > 6 ? ' …' : '');
    }
    function searchTable(res) {
      return table([t('m', 'm'), t('Örgü', 'Lattice'), t('Atanan N (m·R\'ye en yakın izinli değer)', 'Assigned N (nearest allowed to m·R)'), t('En büyük sapma', 'Max. deviation'), t('Karar', 'Decision')],
        res.map(r => [r.m, latName[r.lattice], `<span class="pe-mono">${r.N.slice(0, 8).join(', ')}${r.N.length > 8 ? ' …' : ''}</span>`, f(r.maxDev * 100, 1) + ' %', { v: reasonText(r.reason), c: r.ok ? 'pe-ok' : 'pe-dim' }]), 'pe-compact');
    }
    function cubicTest(S) {
      return table(['#', 'sin²θ', '2θ (°)', '1×R', '2×R', '3×R'], S.map((s, i) => {
        const r = s / S[0];
        return [i + 1, f(s, 4), f(twoThetaDeg(s), 2), { v: f(r, 3), c: near(r) ? '' : 'pe-dim' }, { v: f(2 * r, 3), c: near(2 * r) ? '' : 'pe-dim' }, { v: f(3 * r, 3), c: near(3 * r) ? '' : 'pe-dim' }];
      }));
    }
    function divTable(S, divs, hits) {
      return table(['#', 'sin²θ'].concat(divs.map(d => '÷' + d)), S.map((s, i) => [i + 1, f(s, 4)].concat(divs.map(d => ({ v: f(s / d, 4), c: hits.some(h => h[0] === i && h[1] === d) ? 'pe-em' : '' })))));
    }
    function subTable(S, A, ns, asg, nLabel) {
      const head = ['#', 'sin²θ'].concat(ns.map(n => n === 0 ? '− 0' : n === 1 ? '− A' : '− ' + n + 'A')).concat(['l²', t('C = kalan / l²', 'C = remainder / l²'), '(hkl)']);
      return table(head, S.map((s, i) => {
        const g = asg[i];
        const cells = ns.map(n => { const r = s - n * A; return { v: r < -0.002 ? '—' : f(r, 4), c: g && g[0] === n ? 'pe-em' : (r < -0.002 ? 'pe-dim' : (g ? '' : 'pe-bad')) }; });
        if (!g) return [i + 1, { v: f(s, 4), c: 'pe-bad' }].concat(cells, [{ v: '—', c: 'pe-bad' }, { v: t('uyumsuz', 'no fit'), c: 'pe-bad' }, { v: '?', c: 'pe-bad' }]);
        const r = s - g[0] * A;
        return [i + 1, f(s, 4)].concat(cells, [g[1] || 0, g[1] ? f(r / g[1], 4) : 'hk0', { v: '(' + g[2] + ')', c: 'pe-em' }]);
      }));
    }
    function expTable(list, S, hex) {
      const mb = e => hex ? [mbStr(...parseHKL(e.hkl))] : [];
      return table(['(hkl)'].concat(hex ? ['(hkil)'] : [], [t('sin²θ (hes.)', 'sin²θ (calc.)'), t('En yakın gözlenen', 'Nearest observed'), t('Durum', 'Status')]), list.map(e => {
        if (e.extinct) return ['(' + e.hkl + ')'].concat(mb(e), [f(e.sin2, 4), '—', { v: t('Söner (HCP kuralı) · gözlenmiyor ✓', 'Extinct (HCP rule) · not observed ✓'), c: 'pe-ok' }]);
        const nearest = S.reduce((a, b) => Math.abs(b - e.sin2) < Math.abs(a - e.sin2) ? b : a), d = nearest - e.sin2;
        return ['(' + e.hkl + ')'].concat(mb(e), [f(e.sin2, 4), f(nearest, 4), Math.abs(d) < .0015 ? { v: t('Gözleniyor ✓', 'Observed ✓'), c: 'pe-ok' } : { v: t('Uyumsuz: ', 'Mismatch: ') + f(nearest, 4) + ' (Δ = ' + f(d, 4) + ')', c: 'pe-bad' }]);
      }));
    }
    const lsqStepsText = (fit, P, Q, name) => [
      [t('Toplamlar hesaplanır (p = ', 'Form the sums (p = ') + name + ', q = l², s = sin²θ)', 'Σp², Σpq, Σq², Σp·s, Σq·s',
        `Σp² = ${f(fit.Spp, 0)} · Σpq = ${f(fit.Spq, 0)} · Σq² = ${f(fit.Sqq, 0)}<br>Σp·s = ${f(fit.Sps, 4)} · Σq·s = ${f(fit.Sqs, 4)}`],
      [t('Determinant', 'Determinant'), 'D = Σp²·Σq² − (Σpq)²', `D = ${f(fit.det, 0)}`],
      [t('A ve C', 'A and C'), 'A = (Σp·s·Σq² − Σq·s·Σpq)/D ; C = (Σp²·Σq·s − Σpq·Σp·s)/D', `A = ${f(fit.A, 5)} · C = ${f(fit.C, 5)}`]
    ];

    /* ================= GENEL YÖNTEM ================= */
    const methodHTML = `
      <p>${t('Bragg yasası ile düzlemler arası uzaklık bağıntısı birleştirilince her kristal sistemi için <i>sin²θ</i>, Miller indislerine bağlanır. İndisleme, gözlenen <i>sin²θ</i> değerlerine uyan (hkl) kümesini ve sabitleri (K ya da A, C) bulmaktır.', 'Combining Bragg\'s law with the interplanar-spacing relation ties <i>sin²θ</i> to the Miller indices for every crystal system. Indexing means finding the (hkl) set and constants (K, or A and C) that reproduce the observed <i>sin²θ</i> values.')}</p>
      <h4>${t('Kübik sistem', 'Cubic system')}</h4>
      ${fx(`2d sinθ = λ &nbsp;·&nbsp; ${P('1', 'd²')} = ${P('h²+k²+l²', 'a²')} &nbsp;⇒&nbsp; sin²θ = K·N, &nbsp; K = ${P('λ²', '4a²')}, &nbsp; a = ${P('λ√N', '2 sinθ')} = ${P('λ', '2√K')}`)}
      ${table([t('Örgü / yapı', 'Lattice / structure'), t('Yansıma koşulu', 'Reflection condition'), t('İzinli N', 'Allowed N')], [
        [t('P (ilkel kübik)', 'P (primitive cubic)'), t('koşul yok', 'none'), '1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 16 … ' + t('(7, 15, 23 yok)', '(no 7, 15, 23)')],
        [t('I (hacim merkezli, HMK)', 'I (body-centred, BCC)'), t('h+k+l çift', 'h+k+l even'), '2, 4, 6, 8, 10, 12, 14, 16 …'],
        [t('F (yüzey merkezli, YMK)', 'F (face-centred, FCC)'), t('h,k,l tümü tek veya tümü çift', 'h,k,l all odd or all even'), '3, 4, 8, 11, 12, 16, 19, 20, 24, 27, 32 …'],
        [t('Elmas kübik (F + 2 atomlu baz)', 'Diamond cubic (F + two-atom basis)'), t('F koşulu; tümü çiftse h+k+l = 4n', 'F condition; if all even, h+k+l = 4n'), '3, 8, 11, 16, 19, 24, 27, 32 …']
      ])}
      <h4>${t('Kübik olmayan sistemler (PDF s. 22–55)', 'Non-cubic systems (PDF pp. 22–55)')}</h4>
      ${fx(`${t('Tetragonal', 'Tetragonal')}: sin²θ = A(h²+k²) + C·l², &nbsp; A = ${P('λ²', '4a²')}, C = ${P('λ²', '4c²')} &nbsp;&nbsp;|&nbsp;&nbsp; ${t('Hekzagonal', 'Hexagonal')}: sin²θ = A(h²+hk+k²) + C·l², &nbsp; A = ${P('λ²', '3a²')}, C = ${P('λ²', '4c²')}`)}
      ${note('', t('<b>Miller–Bravais:</b> hekzagonalde dört indisli (hkil) gösterimi kullanılır, i = −(h+k); ör. (101) = (1 0 <span class="pe-ov">1</span> 1). <b>Sönüm kuralları:</b> I-merkezli tetragonalde h+k+l çift olmalıdır. HCP yapısında <b>h+2k = 3n ve aynı anda l tek</b> ise yansıma gözlenmez (001, 003, 111 …); yalnız biri sağlanıyorsa yansıma vardır (101, 110, 002).', '<b>Miller–Bravais:</b> hexagonal planes use the four-index (hkil) notation with i = −(h+k); e.g. (101) = (1 0 <span class="pe-ov">1</span> 1). <b>Extinction rules:</b> body-centred tetragonal requires h+k+l even. In HCP a reflection is absent when <b>h+2k = 3n and l is odd</b> (001, 003, 111 …); if only one condition holds it is present (101, 110, 002).'))}
      <h4>${t('Hassasiyet ve ekstrapolasyon', 'Precision and extrapolation')}</h4>
      <p>${t('Bragg yasasının türevi <b>Δd/d = −cotθ·Δθ</b> verir: aynı açı hatası θ → 90° iken örgü parametresinde giderek küçülen hataya yol açar. Sistematik hatalar açıya bağlı olduğundan a değerleri <b>Nelson–Riley</b> fonksiyonuna karşı çizilip f = 0\'a (θ = 90°) uzatılır. Bu ekstrapolasyon ders PDF\'inde yoktur; tamamlayıcı olarak eklenmiştir.', 'Differentiating Bragg\'s law gives <b>Δd/d = −cotθ·Δθ</b>: the same angular error produces an ever smaller lattice-parameter error as θ → 90°. Because systematic errors depend on angle, the a values are plotted against the <b>Nelson–Riley</b> function and extended to f = 0 (θ = 90°). This extrapolation is not in the course PDF; it is added as a supplement.')}</p>
      ${fx(`f(θ) = ½ ( ${P('cos²θ', 'sinθ')} + ${P('cos²θ', 'θ')} ) &nbsp; (${t('θ radyan', 'θ in radians')}) &nbsp;⇒&nbsp; a = a₀ + m·f(θ)`)}
      <h4>${t('Kullanılan dalga boyları', 'Wavelengths used')}</h4>
      ${table([t('Işınım', 'Radiation'), 'λ (Å)', t('Kullanıldığı yer', 'Used in')], [
        ['Cu Kα₁', f(LAMBDA.CuKa1, 6), t('10-1, 10-3 – 10-6 (PDF\'deki değer, s. 5)', '10-1, 10-3 – 10-6 (value in the PDF, p. 5)')],
        [t('Cu Kα (ağırlıklı)', 'Cu Kα (weighted)'), f(LAMBDA.CuKa, 5), t('Karşılaştırma: a değerlerini ≈ %0,08 büyütür, sonucu değiştirmez', 'Comparison: raises a by ≈ 0.08%, conclusions unchanged')],
        [t('Cr Kα (ağırlıklı)', 'Cr Kα (weighted)'), f(LAMBDA.CrKa, 5), t('10-2 (filtresiz, Kα₁/Kα₂ ayrılmamış; Kα₁ = ', '10-2 (unfiltered, Kα₁/Kα₂ unresolved; Kα₁ = ') + f(LAMBDA.CrKa1, 5) + ')'],
        ['Cr Kβ', f(LAMBDA.CrKb, 5), '10-2']
      ])}
      <p class="pe-small">${t('Referans örgü parametreleri yaklaşık oda sıcaklığı literatür değerleridir; problemde istenen Ek 5 (Appendix 5) ile karşılaştırınız.', 'Reference lattice parameters are approximate room-temperature literature values; compare them with Appendix 5 as the problems ask.')}</p>`;

    /* ================= GENEL ALGORİTMALAR ================= */
    const s0 = R.p101.S[0], sinT0 = Math.sqrt(s0), th0 = Math.asin(sinT0), ttPdf = 38.43;
    const s9 = R.p101.S[9], th9 = thetaRad(s9), c29 = Math.cos(th9) ** 2;
    const kw = w => `<b class="pe-kw">${w}</b>`, cm = w => `<i class="pe-cm">${w}</i>`;
    const algos = [
      algo({ tag: t('ALGORİTMA 1', 'ALGORITHM 1'), title: t('Açı dönüşümleri: sin²θ ↔ θ (radyan, derece) ↔ 2θ', 'Angle conversions: sin²θ ↔ θ (radians, degrees) ↔ 2θ'),
        io: t('<b>Girdi:</b> sin²θ (ya da ölçülen 2θ) · <b>Çıktı:</b> θ (rad ve °), 2θ', '<b>Input:</b> sin²θ (or measured 2θ) · <b>Output:</b> θ (rad and °), 2θ'),
        steps: [
          [t('Karekök alınır', 'Take the square root'), 'sinθ = √(sin²θ)', `√${f(s0, 4)} = ${f(sinT0, 6)}`],
          [t('Ters sinüs alınır; sonuç <b>radyandır</b> (hesap makinesi RAD modu; programlama dillerinde asin)', 'Take the inverse sine; the result is in <b>radians</b> (calculator RAD mode; asin in programming languages)'), 'θ<sub>rad</sub> = arcsin(sinθ)', `arcsin(${f(sinT0, 6)}) = ${f(th0, 6)} rad`],
          [t('Radyandan dereceye çevrilir', 'Convert radians to degrees'), 'θ° = θ<sub>rad</sub> × 180/π &nbsp; (1 rad = 57,29578°)'.replace('57,29578', f(180 / Math.PI, 5)), `${f(th0, 6)} × ${f(180 / Math.PI, 5)} = ${f(deg(th0), 3)}°`],
          [t('Kırınım açısı', 'Diffraction angle'), '2θ = 2 × θ°', `2θ = ${f(2 * deg(th0), 2)}°`],
          [t('Ters yön: ölçülen 2θ yarıya bölünür, radyana çevrilir, sinüsün karesi alınır', 'Reverse: halve the measured 2θ, convert to radians, square the sine'), 'θ<sub>rad</sub> = (2θ/2) × π/180 ; sin²θ = (sin θ<sub>rad</sub>)²',
            t('PDF örneği', 'PDF example') + `: 2θ = ${f(ttPdf, 2)}° → θ = ${f(ttPdf / 2, 3)}° → ${f(rad(ttPdf / 2), 6)} rad → sin²θ = ${f(sin2FromTwoTheta(ttPdf), 4)}`]
        ],
        note: t('<b>Hesap makinesi uyarısı:</b> DEG modunda arcsin doğrudan derece verir ve 3. adım atlanır. sin/cos aynı modda hesaplandıkça sonuç değişmez. <b>Ancak</b> Nelson–Riley fonksiyonundaki cos²θ/θ teriminde paydadaki θ <b>mutlaka radyan</b> olmalıdır (Algoritma 6).', '<b>Calculator note:</b> in DEG mode arcsin returns degrees and step 3 is skipped; sin/cos are fine as long as one mode is used consistently. <b>However</b>, the θ in the denominator of the Nelson–Riley term cos²θ/θ <b>must be in radians</b> (Algorithm 6).'),
        code: t(`${kw('fonksiyon')} aci_donustur(s):            ${cm('// s = sin²θ')}
    sin_t  ← √s
    t_rad  ← arcsin(sin_t)            ${cm('// radyan')}
    t_der  ← t_rad × 180 / π
    ${kw('döndür')} t_rad, t_der, 2 × t_der

${kw('fonksiyon')} sin2_bul(iki_teta):         ${cm('// derece')}
    t_rad ← (iki_teta / 2) × π / 180
    ${kw('döndür')} sin(t_rad)²`, `${kw('function')} convert_angle(s):           ${cm('// s = sin²θ')}
    sin_t  ← √s
    t_rad  ← arcsin(sin_t)            ${cm('// radians')}
    t_deg  ← t_rad × 180 / π
    ${kw('return')} t_rad, t_deg, 2 × t_deg

${kw('function')} sin2_from(two_theta):     ${cm('// degrees')}
    t_rad ← (two_theta / 2) × π / 180
    ${kw('return')} sin(t_rad)²`) }),

      algo({ tag: t('ALGORİTMA 2', 'ALGORITHM 2'), title: t('Düzlemler arası uzaklık ve kübik örgü parametresi', 'Interplanar spacing and cubic lattice parameter'),
        io: t('<b>Girdi:</b> sin²θ, λ, N = h²+k²+l² · <b>Çıktı:</b> d, a', '<b>Input:</b> sin²θ, λ, N = h²+k²+l² · <b>Output:</b> d, a'),
        steps: [
          [t('Bragg yasasından d', 'd from Bragg\'s law'), 'd = λ / (2 sinθ) = λ / (2√(sin²θ))', `${f(L1, 6)} / (2 × ${f(sinT0, 6)}) = ${f(dSpacing(s0, L1), 4)} Å`],
          [t('İndislemeden N alınır', 'Take N from the indexing'), 'N = h² + k² + l²', '(111) → N = 3'],
          [t('Örgü parametresi', 'Lattice parameter'), 'a = d·√N = λ√N / (2 sinθ)', `${f(dSpacing(s0, L1), 4)} × √3 = ${f(aCubic(s0, 3, L1), 4)} Å`]
        ],
        note: t('Açıya çevirmeye gerek yoktur: sinθ doğrudan √(sin²θ) olarak kullanılır.', 'No angle conversion is needed: sinθ is used directly as √(sin²θ).') }),

      algo({ tag: t('ALGORİTMA 3', 'ALGORITHM 3'), title: t('Kübik oran yöntemi ile indisleme ve örgü türü', 'Cubic ratio method: indexing and lattice type'),
        io: t('<b>Girdi:</b> sin²θ listesi · <b>Çıktı:</b> N, (hkl), örgü türü — ya da “kübik değil”', '<b>Input:</b> list of sin²θ · <b>Output:</b> N, (hkl), lattice type — or “not cubic”'),
        steps: [
          [t('Küçükten büyüğe sırala, ilk çizgiye oranla', 'Sort ascending and divide by the first line'), 'R<sub>i</sub> = sin²θ<sub>i</sub> / sin²θ<sub>1</sub>', `R₂ = ${f(R.p101.S[1], 4)}/${f(s0, 4)} = ${f(R.p101.S[1] / s0, 3)}`],
          [t('Çarpanlar: kübikte ilk çizginin N\'si 1 (P), 2 (I) ya da 3 (F, elmas) olduğundan m = 1, 2, 3 denemek yeterlidir', 'Multipliers: in cubic lattices the first line has N = 1 (P), 2 (I) or 3 (F, diamond), so m = 1, 2, 3 suffices'), 'm·R<sub>i</sub>, &nbsp; m ∈ {1, 2, 3}', `3 × ${f(R.p101.S[1] / s0, 3)} = ${f(3 * R.p101.S[1] / s0, 3)}`],
          [t('Her örgü (P, I, F, elmas) için m·R\'ye <b>en yakın izinli</b> N seçilir (basit yuvarlama değil: yüksek açılı kayma 26,32\'yi 26\'ya yuvarlar ama YMK\'da izinli en yakın değer 27\'dir)', 'For each lattice (P, I, F, diamond) take the <b>nearest allowed</b> N to m·R (not plain rounding: the high-angle drift rounds 26.32 to 26, while the nearest FCC-allowed value is 27)'), 'N<sub>i</sub> = argmin<sub>n∈izinli</sub> |m·R<sub>i</sub> − n|'.replace('izinli', t('izinli', 'allowed')), `3·R₁₀ = ${f(3 * R.p101.S[9] / s0, 2)} → 27`],
          [t('Ret ölçütleri: bağıl sapma > %3, tekrar eden N, ya da aradaki izinli bir N\'nin eksik olması', 'Reject if: relative deviation > 3%, a repeated N, or an allowed N missing in between'), '|m·R − N| / N ≤ 0,03'.replace('0,03', f(0.03, 2)), t('P (m = 3): eksik 1, 2, 5, 6 … → ret', 'P (m = 3): missing 1, 2, 5, 6 … → reject')],
          [t('Kalan aday(lar) yazılır. Birden çok aday kalırsa a değeri Ek 5 ile karşılaştırılarak fiziksel seçim yapılır (bkz. 10-2). Hiç aday yoksa kübik değildir → Algoritma 5', 'List the surviving candidate(s). If several survive, choose physically by comparing a with Appendix 5 (see 10-2). If none survive, it is not cubic → Algorithm 5'), '', t('10-1 → yalnız F (m = 3)', '10-1 → only F (m = 3)')],
          [t('(hkl), N\'yi veren tamsayılardan okunur', 'Read (hkl) from the integers giving N'), 'N = h² + k² + l²', '11 = 3² + 1² + 1² → (311)']
        ],
        note: t('Gerçek desenlerde çok zayıf çizgiler görünmeyebilir; o durumda “eksik N” ölçütü dikkatle esnetilir.', 'In real patterns very weak lines may be missing; the “missing N” criterion must then be relaxed with care.'),
        code: t(`R[i] ← s[i] / s[1]                       ${cm('// s sıralı')}
${kw('her')} m ∈ {1, 2, 3} ${kw('için')}:
    ${kw('her')} örgü ∈ {P, I, F, elmas} ${kw('için')}:
        N[i] ← izinli(örgü) içinde m·R[i]'ye en yakın değer
        ${kw('eğer')} max |m·R[i] − N[i]| / N[i] > 0,03     ${kw('ise')} ret
        ${kw('eğer')} N tekrar ediyorsa                    ${kw('ise')} ret
        ${kw('eğer')} izinli(örgü) ∩ [1, N_son] ⊄ N        ${kw('ise')} ret   ${cm('// eksik çizgi')}
        aday listesine ekle (m, örgü, N)
${kw('eğer')} aday yoksa: "kübik değil" → Algoritma 5
${kw('eğer')} birden çok aday: a değerlerini Ek 5 ile karşılaştır`, `R[i] ← s[i] / s[1]                       ${cm('// s sorted')}
${kw('for')} m ∈ {1, 2, 3}:
    ${kw('for')} lattice ∈ {P, I, F, diamond}:
        N[i] ← allowed(lattice) value nearest to m·R[i]
        ${kw('if')} max |m·R[i] − N[i]| / N[i] > 0.03     ${kw('then')} reject
        ${kw('if')} N repeats                            ${kw('then')} reject
        ${kw('if')} allowed(lattice) ∩ [1, N_last] ⊄ N   ${kw('then')} reject  ${cm('// missing line')}
        add (m, lattice, N) to candidates
${kw('if')} no candidates: "not cubic" → Algorithm 5
${kw('if')} several: compare a values with Appendix 5`) }),

      algo({ tag: t('ALGORİTMA 4', 'ALGORITHM 4'), title: t('Analitik K yöntemi ve en küçük kareler K', 'Analytical K method and least-squares K'),
        io: t('<b>Girdi:</b> sin²θ listesi · <b>Çıktı:</b> K, N, a', '<b>Input:</b> list of sin²θ · <b>Output:</b> K, N, a'),
        steps: [
          [t('Her sin²θ, 1, 2, 3, 4, 5, 6, 8 … tamsayılarına bölünür (PDF s. 13–21)', 'Divide each sin²θ by 1, 2, 3, 4, 5, 6, 8 … (PDF pp. 13–21)'), 'sin²θ / n', `${f(s0, 4)}/3 = ${f(s0 / 3, 4)} · ${f(R.p101.S[1], 4)}/4 = ${f(R.p101.S[1] / 4, 4)}`],
          [t('Birçok satırda tekrar eden <b>en büyük</b> ortak bölüm K adayıdır (en küçük hücre)', 'The <b>largest</b> quotient common to several lines is the K candidate (smallest cell)'), 'K ≈ ' + t('ortak bölüm', 'common quotient'), `K ≈ ${f(s0 / 3, 4)}`],
          [t('Her çizgi için N bulunur', 'Find N for each line'), 'N<sub>i</sub> = ' + t('yuvarla', 'round') + '(sin²θ<sub>i</sub> / K)', `${f(R.p101.S[2], 3)}/${f(s0 / 3, 4)} = ${f(R.p101.S[2] / (s0 / 3), 2)} → 8`],
          [t('K en küçük kareler ile iyileştirilir (yüksek N\'li, yani yüksek açılı çizgilere daha çok ağırlık verir)', 'Refine K by least squares (weights high-N, i.e. high-angle, lines more)'), 'K = Σ(sin²θ<sub>i</sub>·N<sub>i</sub>) / Σ N<sub>i</sub>²', `${f(R.p101.lsq.sn, 4)} / ${f(R.p101.lsq.nn, 0)} = ${f(R.p101.lsq.K, 5)}`],
          [t('Örgü parametresi', 'Lattice parameter'), 'a = λ / (2√K)', `a = ${f(R.p101.lsq.a, 4)} Å ` + t(`(basit ortalama ${f(R.p101.mean, 4)} Å)`, `(simple mean ${f(R.p101.mean, 4)} Å)`)]
        ] }),

      algo({ tag: t('ALGORİTMA 5', 'ALGORITHM 5'), title: t('Kübik olmayan desen: A–C yöntemi (tetragonal / hekzagonal)', 'Non-cubic pattern: the A–C method (tetragonal / hexagonal)'),
        io: t('<b>Girdi:</b> sin²θ listesi, λ · <b>Çıktı:</b> (hkl), a, c, Bravais örgüsü', '<b>Input:</b> list of sin²θ, λ · <b>Output:</b> (hkl), a, c, Bravais lattice'),
        steps: [
          [t('hk0 testi: sin²θ değerleri tetragonal için {1, 2, 4, 5, 8}, hekzagonal için {1, 3, 4, 7} ile bölünür; birden çok çizgide tekrar eden bölüm <b>A</b>\'dır', 'hk0 test: divide sin²θ by {1, 2, 4, 5, 8} (tetragonal) or {1, 3, 4, 7} (hexagonal); a quotient repeated across several lines is <b>A</b>'), 'A ≈ sin²θ / (h²+k²) ' + t('veya', 'or') + ' sin²θ / (h²+hk+k²)', `10-3: ${f(R.p103.S[2], 4)}/2 = ${f(R.p103.S[2] / 2, 4)} ; ${f(R.p103.S[4], 3)}/4 = ${f(R.p103.S[4] / 4, 4)}`],
          [t('Her sin²θ\'dan izinli n·A değerleri çıkarılır', 'Subtract the allowed n·A values from every sin²θ'), 'kalan = sin²θ − n·A'.replace('kalan', t('kalan', 'remainder')), `${f(R.p103.S[0], 4)} − A = ${f(R.p103.S[0] - R.p103.Aest, 4)}`],
          [t('Kalanlarda 1, 4, 9 ile orantılı tekrar eden değer <b>C·l²</b>\'dir', 'The value repeating in proportion 1 : 4 : 9 among the remainders is <b>C·l²</b>'), 'C = ' + t('kalan', 'remainder') + ' / l²', `${f(R.p103.S[1], 4)}/4 = ${f(R.p103.S[1] / 4, 4)} ≈ ${f(R.p103.S[0] - R.p103.Aest, 4)}`],
          [t('Her çizgiye (n, l²) ve böylece (hkl) atanır; atanamayan çizgi işaretlenir', 'Assign (n, l²) and hence (hkl) to every line; flag any line that cannot be assigned'), 'sin²θ ≈ n·A + l²·C', '(101), (002), (110) …'],
          [t('Sönüm kuralı denetlenir (I: h+k+l çift; HCP: h+2k = 3n ve l tek ise yok)', 'Check extinction rules (I: h+k+l even; HCP: absent if h+2k = 3n and l odd)'), '', t('10-3: tüm h+k+l çift → I', '10-3: all h+k+l even → I')],
          [t('A ve C en küçük kareler ile iyileştirilir (Algoritma 7)', 'Refine A and C by least squares (Algorithm 7)'), '', `A = ${f(R.p103.fit.A, 5)}, C = ${f(R.p103.fit.C, 5)}`],
          [t('Örgü parametreleri', 'Lattice parameters'), t('Tetragonal', 'Tetragonal') + ': a = λ/(2√A) · ' + t('Hekzagonal', 'Hexagonal') + ': a = λ/√(3A) · c = λ/(2√C)', `a = ${f(R.p103.a, 3)} Å, c = ${f(R.p103.c, 3)} Å`],
          [t('Beklenen yansımalar üretilip gözlenenlerle karşılaştırılır (Algoritma 9)', 'Generate the expected reflections and compare with the observed ones (Algorithm 9)'), '', t('10-3: 8 beklenen = 8 gözlenen', '10-3: 8 expected = 8 observed')]
        ],
        code: t(`${kw('her')} sistem ∈ {tetragonal: n∈{1,2,4,5,8}, hekzagonal: n∈{1,3,4,7}} ${kw('için')}:
    A ← birden çok çizgide tekrar eden sin²θ / n
    kalan[i][n] ← s[i] − n·A                 ${cm('// izinli n değerleri')}
    C ← 1:4:9 oranında tekrar eden kalan / l²
    ${kw('her')} i ${kw('için')}: (n, l²) ← argmin |s[i] − (n·A + l²·C)|
    ${kw('eğer')} sönüm kuralı ihlali ${kw('veya')} çok uyumsuz çizgi ${kw('ise')} sonraki sistem
    (A, C) ← en_kucuk_kareler(n, l², s)       ${cm('// Algoritma 7')}
    beklenenleri üret ve karşılaştır          ${cm('// Algoritma 9')}`, `${kw('for')} system ∈ {tetragonal: n∈{1,2,4,5,8}, hexagonal: n∈{1,3,4,7}}:
    A ← sin²θ / n value repeated over several lines
    rem[i][n] ← s[i] − n·A                   ${cm('// allowed n values')}
    C ← remainder repeating as 1:4:9, divided by l²
    ${kw('for each')} i: (n, l²) ← argmin |s[i] − (n·A + l²·C)|
    ${kw('if')} extinction violated ${kw('or')} badly fitting line ${kw('then')} next system
    (A, C) ← least_squares(n, l², s)          ${cm('// Algorithm 7')}
    generate expected lines and compare      ${cm('// Algorithm 9')}`) }),

      algo({ tag: t('ALGORİTMA 6', 'ALGORITHM 6'), title: t('Nelson–Riley ekstrapolasyonu (radyan çevrimi kritik)', 'Nelson–Riley extrapolation (radian conversion is critical)'),
        io: t('<b>Girdi:</b> indislenmiş çizgiler (sin²θ, N), λ · <b>Çıktı:</b> a₀ (θ = 90° değeri)', '<b>Input:</b> indexed lines (sin²θ, N), λ · <b>Output:</b> a₀ (value at θ = 90°)'),
        steps: [
          [t('Her çizgi için θ <b>radyan</b> olarak bulunur (Algoritma 1)', 'Find θ in <b>radians</b> for every line (Algorithm 1)'), 'θ<sub>i</sub> = arcsin(√sin²θ<sub>i</sub>)', `10-1 #10: arcsin(√${f(s9, 3)}) = ${f(th9, 5)} rad (${f(deg(th9), 2)}°)`],
          [t('Nelson–Riley fonksiyonu', 'Nelson–Riley function'), 'f<sub>i</sub> = ½ (cos²θ/sinθ + cos²θ/θ<sub>rad</sub>)', `cos²θ = ${f(c29, 5)} → f = ½(${f(c29 / Math.sin(th9), 5)} + ${f(c29 / th9, 5)}) = ${f(nelsonRiley(s9), 5)}`],
          [t('Her çizgiden a<sub>i</sub> hesaplanır (Algoritma 2)', 'Compute a<sub>i</sub> for every line (Algorithm 2)'), 'a<sub>i</sub> = λ√N<sub>i</sub> / (2 sinθ<sub>i</sub>)', `a₁₀ = ${f(R.p101.a[9], 4)} Å`],
          [t('Ortalamalar', 'Means'), 'f̄ = Σf<sub>i</sub>/n ; ā = Σa<sub>i</sub>/n', `f̄ = ${f(R.p101.nr.xbar, 4)} ; ā = ${f(R.p101.nr.ybar, 4)} Å`],
          [t('Eğim (doğrusal regresyon)', 'Slope (linear regression)'), 'm = Σ(f<sub>i</sub>−f̄)(a<sub>i</sub>−ā) / Σ(f<sub>i</sub>−f̄)²', `m = ${f(R.p101.nr.sxy, 5)} / ${f(R.p101.nr.sxx, 4)} = ${f(R.p101.nr.slope, 5)} Å`],
          [t('Kesişim: f = 0, yani θ = 90°', 'Intercept: f = 0, i.e. θ = 90°'), 'a₀ = ā − m·f̄', `a₀ = ${f(R.p101.nr.intercept, 4)} Å`]
        ],
        note: t(`<b>Sık yapılan hata:</b> paydadaki θ derece girilirse 10-1 #10 için cos²θ/θ = ${f(c29 / deg(th9), 6)} çıkar; doğrusu ${f(c29 / th9, 5)}. f değerleri yaklaşık 57 kat yanlış ölçeklenir ve ekstrapolasyon bozulur.`, `<b>Common mistake:</b> entering θ in degrees in the denominator gives cos²θ/θ = ${f(c29 / deg(th9), 6)} for 10-1 #10 instead of ${f(c29 / th9, 5)}; f is mis-scaled by about 57× and the extrapolation breaks.`),
        code: t(`${kw('her')} i ${kw('için')}:
    t   ← arcsin(√s[i])                    ${cm('// RADYAN')}
    f[i] ← 0,5 × (cos(t)² / sin(t) + cos(t)² / t)
    a[i] ← λ × √N[i] / (2 × sin(t))
f̄ ← ortalama(f) ; ā ← ortalama(a)
m  ← Σ (f[i]−f̄)(a[i]−ā) / Σ (f[i]−f̄)²
a0 ← ā − m × f̄                           ${cm('// θ = 90° değeri')}`, `${kw('for each')} i:
    t   ← arcsin(√s[i])                    ${cm('// RADIANS')}
    f[i] ← 0.5 × (cos(t)² / sin(t) + cos(t)² / t)
    a[i] ← λ × √N[i] / (2 × sin(t))
f̄ ← mean(f) ; ā ← mean(a)
m  ← Σ (f[i]−f̄)(a[i]−ā) / Σ (f[i]−f̄)²
a0 ← ā − m × f̄                           ${cm('// value at θ = 90°')}`) }),

      algo({ tag: t('ALGORİTMA 7', 'ALGORITHM 7'), title: t('İki parametreli en küçük kareler (A ve C)', 'Two-parameter least squares (A and C)'),
        io: t('<b>Girdi:</b> atanmış çizgiler (p = h²+k² ya da h²+hk+k², q = l², s = sin²θ) · <b>Çıktı:</b> A, C', '<b>Input:</b> assigned lines (p = h²+k² or h²+hk+k², q = l², s = sin²θ) · <b>Output:</b> A, C'),
        steps: lsqStepsText(R.p103.fit, 0, 0, 'h²+k²').concat([[t('Artıklar denetlenir', 'Check residuals'), 'Δ<sub>i</sub> = s<sub>i</sub> − (A·p<sub>i</sub> + C·q<sub>i</sub>)', t('10-3: |Δ| ≤ 0,0011', '10-3: |Δ| ≤ 0.0011')]]),
        note: t('Normal denklemler: A·Σp² + C·Σpq = Σp·s ve A·Σpq + C·Σq² = Σq·s. Örnek sayılar 10-3\'e aittir.', 'Normal equations: A·Σp² + C·Σpq = Σp·s and A·Σpq + C·Σq² = Σq·s. Example numbers are from 10-3.') }),

      algo({ tag: t('ALGORİTMA 8', 'ALGORITHM 8'), title: t('Filtresiz desende Kα / Kβ çizgilerinin ayrılması', 'Separating Kα and Kβ lines in an unfiltered pattern'),
        io: t('<b>Girdi:</b> sin²θ ve şiddetler, λ<sub>α</sub>, λ<sub>β</sub> · <b>Çıktı:</b> Kα ve Kβ çizgileri', '<b>Input:</b> sin²θ and intensities, λ<sub>α</sub>, λ<sub>β</sub> · <b>Output:</b> Kα and Kβ lines'),
        steps: [
          [t('Teorik oran', 'Theoretical ratio'), 'r = (λ<sub>β</sub> / λ<sub>α</sub>)²', `(${f(LAMBDA.CrKb, 5)} / ${f(LAMBDA.CrKa, 5)})² = ${f(R.p102.pairing.r, 4)}`],
          [t('Her i &lt; j çifti için oran hesaplanır; |oran − r| ≤ 0,005 olanlar eşleşir', 'Compute the ratio for each pair i &lt; j; pairs with |ratio − r| ≤ 0.005 match'), 'sin²θ<sub>i</sub> / sin²θ<sub>j</sub> ≈ r', `0,265/0,321 = ${f(.265 / .321, 4)} ✓`.replace('0,265/0,321', `${f(.265, 3)}/${f(.321, 3)}`)],
          [t('Çiftte küçük sin²θ ve <b>daha zayıf</b> olan çizgi Kβ\'dır', 'In each pair the smaller-sin²θ and <b>weaker</b> line is Kβ'), '', 'm &lt; vs → Kβ'],
          [t('Yalnız Kα çizgileri Algoritma 3 ile indislenir; Kβ eşi aynı (hkl)\'yi alır', 'Index only the Kα lines with Algorithm 3; each Kβ partner takes the same (hkl)'), '', '(110), (200), (211)'],
          [t('Denetim: a hem λ<sub>α</sub> hem λ<sub>β</sub> ile aynı çıkmalı', 'Check: a must agree using both λ<sub>α</sub> and λ<sub>β</sub>'), '', `a ≈ ${f(R.p102.mean, 3)} Å`]
        ],
        code: t(`r ← (λβ / λα)²
${kw('her')} i < j ${kw('için')}:
    ${kw('eğer')} |s[i]/s[j] − r| ≤ 0,005 ${kw('ise')}: Kβ ← i ; Kα ← j     ${cm('// i daha zayıf olmalı')}
Kα çizgilerini Algoritma 3 ile indisle
a(Kα) ve a(Kβ) karşılaştır`, `r ← (λβ / λα)²
${kw('for each')} i < j:
    ${kw('if')} |s[i]/s[j] − r| ≤ 0.005: Kβ ← i ; Kα ← j     ${cm('// i should be weaker')}
index the Kα lines with Algorithm 3
compare a(Kα) and a(Kβ)`) }),

      algo({ tag: t('ALGORİTMA 9', 'ALGORITHM 9'), title: t('Beklenen yansımaların üretilmesi ve karşılaştırma', 'Generating expected reflections and comparing'),
        io: t('<b>Girdi:</b> A, C, sistem ve sönüm kuralı, en büyük gözlenen sin²θ · <b>Çıktı:</b> beklenen yansımalar listesi', '<b>Input:</b> A, C, system and extinction rule, largest observed sin²θ · <b>Output:</b> list of expected reflections'),
        steps: [
          [t('h ≥ k ≥ 0 ve l ≥ 0 için tüm indisler taranır', 'Loop over all indices with h ≥ k ≥ 0 and l ≥ 0'), 'sin²θ<sub>hes</sub> = A·p + C·l²'.replace('hes', t('hes', 'calc')), ''],
          [t('Sönüm kuralı uygulanır', 'Apply the extinction rule'), t('I: h+k+l tek → yok · HCP: h+2k = 3n ve l tek → söner', 'I: h+k+l odd → absent · HCP: h+2k = 3n and l odd → extinct'), t('10-6: (001), (003), (111) söner', '10-6: (001), (003), (111) extinct')],
          [t('sin²θ<sub>maks</sub>\'ı aşmayanlar sıralanır; aynı (p, l²) değerleri bir kez yazılır', 'Keep those below sin²θ<sub>max</sub>, sort them, and list equal (p, l²) once'), '', ''],
          [t('Her beklenen yansıma en yakın gözlenen çizgiyle karşılaştırılır (tolerans ≈ 0,0015)', 'Compare each expected reflection with the nearest observed line (tolerance ≈ 0.0015)'), '', t('10-6: (101) beklenen ', '10-6: (101) expected ') + f(R.p106.expected101, 4) + t(', gözlenen 0,0913 ✗', ', observed 0.0913 ✗').replace('0,0913', f(.0913, 4))],
          [t('Karar: eksik ya da fazladan çizgi olmamalı; en küçük ve eksiksiz hücre tercih edilir', 'Decision: no missing or extra lines; prefer the smallest complete cell'), '', '']
        ],
        code: t(`liste ← []
${kw('her')} h ≥ k ≥ 0, l ≥ 0 ${kw('için')}:
    ${kw('eğer')} sönüm(h, k, l) ${kw('ise')} "söner" olarak işaretle
    s ← A·p(h,k) + C·l²
    ${kw('eğer')} s ≤ s_maks ${kw('ve')} (p, l²) yeni ${kw('ise')} listeye ekle
listeyi sırala ; her öğe için en yakın gözlenen ile |Δ| ≤ 0,0015 mi?`, `list ← []
${kw('for')} h ≥ k ≥ 0, l ≥ 0:
    ${kw('if')} extinct(h, k, l) ${kw('then')} mark as "extinct"
    s ← A·p(h,k) + C·l²
    ${kw('if')} s ≤ s_max ${kw('and')} (p, l²) is new ${kw('then')} append
sort the list ; for each entry is |Δ| ≤ 0.0015 to the nearest observed?`) })
    ].join('');

    /* ================= SORULAR ================= */
    const commonQ = t('Aşağıdaki değerler bir elementin toz desenine ait sin²θ değerleridir. Değerler Cu Kα ışınımına göre elde edilmiştir. Çizgileri kullanarak indisleme işlemini yapınız, kristal sistemini, Bravais örgüsünü bulunuz ve örgü parametresini yaklaşık olarak belirleyiniz (Appendix 5 kullanınız).', 'The values below are sin²θ values from the powder pattern of an element, obtained with Cu Kα radiation. Index the lines, find the crystal system and Bravais lattice, and estimate the lattice parameter (use Appendix 5).');
    const chips = vals => `<div class="pe-chips">${vals.map((v, i) => `<span><i>${i + 1}</i>${v}</span>`).join('')}</div>`;
    const question = (id, text, vals, extra) => `<div class="pe-q"><div class="pe-qh"><span class="pe-pill">${t('PROBLEM', 'PROBLEM')} ${id}</span><span class="pe-ql">${t('Soru', 'Question')}</span></div><p>${text}${extra || ''}</p>${chips(vals)}</div>`;
    const answerHead = title => `<div class="pe-ah"><span class="pe-ql pe-ans">${t('Çözüm', 'Solution')}</span><h4>${title}</h4></div>`;
    const fv = v => f(v, v < 0.2 ? 4 : 3); // problem listesindeki basamak sayısı
    const bar = n => n < 0 ? `<span class="pe-ov">${-n}</span>` : String(n);
    const mbStr = (h, k, l) => '(' + millerBravais(h, k, l).map(bar).join(' ') + ')';
    const mbPlain = (h, k, l) => '(' + millerBravais(h, k, l).map(n => n < 0 ? '−' + (-n) : n).join(' ') + ')';
    const parseHKL = str => str.split('').map(Number);

    /* ---------- 10-1 ---------- */
    const p1 = R.p101;
    const panel1 = question('10-1', t('Alüminyumun toz deseni Cu Kα ışınımı kullanılarak elde edilmiştir. Bu 10 çizginin sin²θ değerleri aşağıda verilmiştir. Bu çizgileri indisleyiniz ve örgü parametresini hesaplayınız.', 'The powder pattern of aluminium was recorded with Cu Kα radiation. The sin²θ values of its 10 lines are given below. Index the lines and calculate the lattice parameter.'), p1.S.map(fv)) +
      answerHead(t('Alüminyumun toz deseninin indislenmesi', 'Indexing the aluminium powder pattern')) +
      `<h5>${t('Adım 1 — Oranlar ve N değerleri', 'Step 1 — Ratios and N values')}</h5>
      <p>${t('1× ve 2× sütunları tamsayı vermez; <b>3× sütunu</b> 3, 4, 8, 11, 12, 16, 19, 20, 24, 27 dizisine yakındır: YMK (F). Tamsayıdan sapma yüksek açılarda büyür (26,32 → 27); bu sistematik hatanın işaretidir.', 'The 1× and 2× columns give no integers; the <b>3× column</b> approaches 3, 4, 8, 11, 12, 16, 19, 20, 24, 27: FCC (F). The deviation grows at high angle (26.32 → 27), a sign of systematic error.')}</p>
      ${table(cubicHead(true), cubicRows(p1.S, p1.N, p1.hkl, L1, true))}
      <p class="pe-small">${t('R = sin²θ / sin²θ<sub>min</sub>. 2θ değerleri sin²θ\'dan geri hesaplanmıştır (Algoritma 1). N = 27\'de (333) ve (511) çakışır.', 'R = sin²θ / sin²θ<sub>min</sub>. 2θ values are back-calculated from sin²θ (Algorithm 1). At N = 27, (333) and (511) coincide.')}</p>
      <p><b>${t('Algoritma 3 çıktısı', 'Algorithm 3 output')}</b> — ${t('12 (m, örgü) kombinasyonundan yalnız biri kabul edilir:', 'only one of the 12 (m, lattice) combinations survives:')}</p>
      ${searchTable(p1.search)}
      <h5>${t('Adım 2 — Örgü parametresi', 'Step 2 — Lattice parameter')}</h5>
      ${algo({ tag: t('ALGORİTMA 1–2 · UYGULAMA', 'ALGORITHMS 1–2 · APPLIED'), title: t('Birinci ve onuncu çizgi için adım adım', 'Step by step for the first and tenth lines'),
        steps: [p1.S[0], p1.S[9]].flatMap((s, k) => {
          const N = k ? 27 : 3, st = Math.sqrt(s), th = Math.asin(st);
          return [[(k ? '#10' : '#1') + ' — sinθ, θ', 'sinθ = √sin²θ ; θ = arcsin(sinθ)', `√${f(s, 4)} = ${f(st, 6)} ; θ = ${f(th, 6)} rad = ${f(deg(th), 3)}°`],
            [(k ? '#10' : '#1') + ' — 2θ, d, a', '2θ = 2θ° ; d = λ/(2 sinθ) ; a = d√N', `2θ = ${f(2 * deg(th), 2)}° ; d = ${f(dSpacing(s, L1), 4)} Å ; a = ${f(dSpacing(s, L1), 4)}×√${N} = ${f(aCubic(s, N, L1), 4)} Å`]];
        }) })}
      <p>${t('a değerleri açıyla düzenli olarak artıyor: bu rastgele değil sistematik bir hatadır ve basit ortalama gerçek değerin altında kalır. Nelson–Riley ekstrapolasyonu bu kaymayı giderir:', 'The a values rise steadily with angle: this is a systematic, not random, error, so the simple mean falls below the true value. Nelson–Riley extrapolation removes the drift:')}</p>
      ${extrap(p1.S, p1.a, [{ n: t('Al ref.', 'Al ref.'), v: REF.Al, c: 'pe-c2' }])}
      ${algo({ tag: t('ALGORİTMA 6 · UYGULAMA', 'ALGORITHM 6 · APPLIED'), title: t('Ekstrapolasyonun sayısal izi (10 çizgi)', 'Numerical trace of the extrapolation (10 lines)'),
        steps: [[t('Ortalamalar', 'Means'), 'f̄, ā', `f̄ = ${f(p1.nr.xbar, 4)} ; ā = ${f(p1.nr.ybar, 4)} Å`],
          [t('Kareler ve çarpımlar toplamı', 'Sums of squares and products'), 'S<sub>fa</sub> = Σ(f−f̄)(a−ā) ; S<sub>ff</sub> = Σ(f−f̄)²', `S<sub>fa</sub> = ${f(p1.nr.sxy, 5)} ; S<sub>ff</sub> = ${f(p1.nr.sxx, 4)}`],
          [t('Eğim ve kesişim', 'Slope and intercept'), 'm = S<sub>fa</sub>/S<sub>ff</sub> ; a₀ = ā − m·f̄', `m = ${f(p1.nr.slope, 5)} ; a₀ = ${f(p1.nr.intercept, 4)} Å`]] })}
      ${metrics([[t('Basit aritmetik ortalama', 'Simple arithmetic mean'), f(p1.mean, 4) + ' Å'], [t('En küçük kareler K (Alg. 4)', 'Least-squares K (Alg. 4)'), f(p1.lsq.a, 4) + ' Å'], [t('Nelson–Riley (θ → 90°)', 'Nelson–Riley (θ → 90°)'), f(p1.nr.intercept, 4) + ' Å', t('Al ref. ', 'Al ref. ') + f(REF.Al, 4) + ' Å']])}
      ${note('pe-success', t(`<b>Sonuç:</b> kübik, <b>F (YMK)</b>; (111), (200), (220) … Ekstrapolasyonla <b>a ≈ ${f(p1.nr.intercept, 3)} Å</b> (ağırlıklı Cu Kα ile ${f(p1.nrWeighted, 3)} Å) — referansa ortalamadan çok daha yakın.`, `<b>Result:</b> cubic, <b>F (FCC)</b>; (111), (200), (220) … Extrapolation gives <b>a ≈ ${f(p1.nr.intercept, 3)} Å</b> (${f(p1.nrWeighted, 3)} Å with weighted Cu Kα) — much closer to the reference than the mean.`))}
      ${sticks(p1.S.map((s, i) => ({ s, h: .5 + (i % 3) * .12, label: p1.hkl[i].split('/')[0] })))}
      <p class="pe-small">${t('Çubuk yükseklikleri temsilidir; soruda şiddet verilmemiştir.', 'Bar heights are illustrative; no intensities are given.')}</p>`;

    /* ---------- 10-2 ---------- */
    const p2 = R.p102, S2 = DATA.p102.s, I2 = DATA.p102.I, rank = { vs: 4, s: 3, m: 2, w: 1 };
    const lines2 = p2.pairing.pairs.flatMap((pr, k) => [{ s: S2[pr.alpha], int: I2[pr.alpha], kind: 'Kα', lam: LAMBDA.CrKa, k }, { s: S2[pr.beta], int: I2[pr.beta], kind: 'Kβ', lam: LAMBDA.CrKb, k }]).sort((a, b) => a.s - b.s);
    const cands2 = [['α-Fe', REF.Fe], ['Cr', REF.Cr]].map(([n, a]) => {
      const e = p2.N.map(N => LAMBDA.CrKa ** 2 * N / (4 * a * a)), dev = Math.max(...e.map((v, i) => Math.abs(v - p2.SA[i])));
      return [n, f(a, 4), f(e[0], 4), f(e[1], 4), f(e[2], 4), p2.SA.map(x => f(x, 3)).join(' · '), { v: (dev < .003 ? t('Uyumlu', 'Consistent') : t('Uyumsuz', 'Inconsistent')) + ' (' + t('en büyük sapma ', 'max. dev. ') + f(dev, 4) + ')', c: dev < .003 ? 'pe-ok' : 'pe-bad' }];
    });
    const panel2 = question('10-2', t('Filtresiz kullanılan krom ışınımı ile bir kübik yapının toz deseni elde edilmiştir. Bu desenin sin²θ ve şiddet değerleri aşağıda verilmiştir. Çizgileri indisleyiniz ve hangilerinin Kα ve Kβ ışınımından oluştuğunu belirleyiniz. Malzemenin ne olduğunu tahmin etmeye çalışınız (Appendix 5 kullanınız).', 'A powder pattern of a cubic material was recorded with unfiltered chromium radiation. The sin²θ values and intensities are given below. Index the lines and decide which arise from Kα and which from Kβ radiation. Try to identify the material (use Appendix 5).'),
      S2.map((s, i) => fv(s) + ' (' + I2[i] + ')'), ` <span class="pe-small">(${t('vs: çok güçlü · s: güçlü · m: orta · w: zayıf', 'vs: very strong · s: strong · m: medium · w: weak')})</span>`) +
      answerHead(t('Filtresiz krom ışınımı: Kα ve Kβ çizgilerinin ayrılması', 'Unfiltered chromium radiation: separating Kα and Kβ lines')) +
      `<p>${t('Filtresiz tüpte her (hkl) iki çizgi verir. Kβ\'nın dalga boyu kısa olduğundan aynı yansımanın Kβ çizgisi <b>daha küçük</b> sin²θ\'da ve <b>daha zayıf</b> görünür.', 'In an unfiltered tube every (hkl) gives two lines. Because Kβ is shorter, the Kβ line of a reflection appears at <b>smaller</b> sin²θ and is <b>weaker</b>.')}</p>
      <h5>${t('Adım 1 — Eşleştirme (Algoritma 8)', 'Step 1 — Pairing (Algorithm 8)')}</h5>
      ${fx(`${P('sin²θ<sub>β</sub>', 'sin²θ<sub>α</sub>')} = (${P('λ<sub>β</sub>', 'λ<sub>α</sub>')})² = (${P(f(LAMBDA.CrKb, 5), f(LAMBDA.CrKa, 5))})² ≈ ${f(p2.pairing.r, 4)}`)}
      ${table([t('Çift (i/j)', 'Pair (i/j)'), t('Oran', 'Ratio'), '|Δ|', t('Karar', 'Decision')], p2.pairing.all.filter(x => x.ratio > .6).map(x => [`${f(S2[x.i], 3)} / ${f(S2[x.j], 3)}`, f(x.ratio, 4), f(Math.abs(x.ratio - p2.pairing.r), 4), x.ok ? { v: t('Eşleşir ✓', 'Pair ✓'), c: 'pe-ok' } : { v: t('ret', 'reject'), c: 'pe-dim' }]), 'pe-compact')}
      <p class="pe-small">${t('Oranı 0,6\'nın altındaki çiftler gösterilmemiştir; hepsi ret.', 'Pairs with a ratio below 0.6 are omitted; all are rejected.').replace('0,6', f(.6, 1))}</p>
      ${table([t('Yansıma', 'Reflection'), 'Kβ sin²θ', t('Kβ şiddeti', 'Kβ int.'), 'Kα sin²θ', t('Kα şiddeti', 'Kα int.'), t('β/α (göz.)', 'β/α (obs.)'), t('Şiddet kontrolü', 'Intensity check')],
        p2.pairing.pairs.map((pr, k) => ['(' + p2.hkl[k] + ')', f(S2[pr.beta], 3), I2[pr.beta], f(S2[pr.alpha], 3), I2[pr.alpha], f(pr.ratio, 4), rank[I2[pr.beta]] < rank[I2[pr.alpha]] ? { v: t('Kβ daha zayıf ✓', 'Kβ weaker ✓'), c: 'pe-ok' } : { v: '✗', c: 'pe-bad' }]))}
      <h5>${t('Adım 2 — Kα çizgilerinin indislenmesi (Algoritma 3)', 'Step 2 — Indexing the Kα lines (Algorithm 3)')}</h5>
      ${searchTable(p2.search)}
      ${note('pe-warn', t(`<b>İki aday kalır:</b> P (N = 1, 2, 3) ve I (N = 2, 4, 6). Bir sonraki çizgi her iki durumda da sin²θ &gt; 1 olacağından görünemez; konumlar tek başına ayırt edemez. P seçimi <b>a = ${f(p2.aIfPrimitive, 2)} Å</b> verir; bu da en yakın atomlar arası uzaklıktır ve metal için çok kısadır (Fe–Fe ≈ 2,48 Å). Ek 5'te böyle bir element yoktur → <b>I (HMK)</b>: (110), (200), (211).`, `<b>Two candidates survive:</b> P (N = 1, 2, 3) and I (N = 2, 4, 6). In both cases the next line would need sin²θ &gt; 1, so positions alone cannot decide. Choosing P gives <b>a = ${f(p2.aIfPrimitive, 2)} Å</b>, which would also be the nearest-neighbour distance — far too short for a metal (Fe–Fe ≈ 2.48 Å). No such element exists in Appendix 5 → <b>I (BCC)</b>: (110), (200), (211).`))}
      <h5>${t('Adım 3 — Her çizgiden örgü parametresi', 'Step 3 — Lattice parameter from every line')}</h5>
      ${table(['#', 'sin²θ', t('Şiddet', 'Int.'), t('Işınım', 'Radiation'), '(hkl)', 'N', 'λ (Å)', '2θ (°)', 'a (Å)'], lines2.map((p, i) => [i + 1, f(p.s, 3), p.int, { v: p.kind, c: p.kind === 'Kα' ? 'pe-em' : '' }, '(' + p2.hkl[p.k] + ')', p2.N[p.k], f(p.lam, 5), f(twoThetaDeg(p.s), 2), f(aCubic(p.s, p2.N[p.k], p.lam), 4)]))}
      <h5>${t('Adım 4 — Element adayları', 'Step 4 — Element candidates')}</h5>
      ${table([t('Aday (HMK)', 'Candidate (BCC)'), 'a<sub>ref</sub> (Å)', '(110)', '(200)', '(211)', t('Gözlenen Kα', 'Observed Kα'), t('Değerlendirme', 'Assessment')], cands2)}
      ${note('', t('<b>Neden Cr ışınımı?</b> Cu Kα fotonları (8,05 keV) Fe\'nin K soğurma kenarının (7,11 keV) üzerindedir ve güçlü floresans arka planı oluşturur. Cr Kα (5,41 keV) bu kenarın altında kalır; demir ve çelikler için Cr veya Co ışınımı tercih edilir.', '<b>Why Cr radiation?</b> Cu Kα photons (8.05 keV) lie above the Fe K absorption edge (7.11 keV) and produce a strong fluorescence background. Cr Kα (5.41 keV) lies below the edge, so Cr or Co radiation is preferred for iron and steels.'))}
      ${metrics([[t('Yapı', 'Structure'), t('Kübik · I (HMK)', 'Cubic · I (BCC)')], [t('Altı çizginin ortalaması', 'Mean of six lines'), f(p2.mean, 3) + ' Å'], [t('Olası element', 'Likely element'), 'α-Fe', 'ref. ' + f(REF.Fe, 4) + ' Å']])}
      ${sticks(lines2.map(p => ({ s: p.s, h: { vs: .92, s: .7, m: .46, w: .26 }[p.int], c: p.kind === 'Kα' ? 'pe-c1' : 'pe-c3', label: p.kind + ' ' + p2.hkl[p.k] })), `<text class="pe-lb pe-c1" x="64" y="16">■ Kα</text><text class="pe-lb pe-c3" x="120" y="16">■ Kβ</text>`)}`;

    /* ---------- 10-3 ---------- */
    const p3 = R.p103;
    const panel3 = question('10-3', commonQ, p3.S.map(fv)) +
      answerHead(t('Kübik olmayan desen: tetragonal indisleme', 'Non-cubic pattern: tetragonal indexing')) +
      `<h5>${t('Adım 1 — Kübik test (Algoritma 3)', 'Step 1 — Cubic test (Algorithm 3)')}</h5>
      ${cubicTest(p3.S)}
      <p>${t('Tek tek tamsayıya yakın görünen değerler (soluk gösterilmeyenler) aynı sütunda tutarlı bir dizi oluşturmaz. Algoritma 3\'ün 12 kombinasyonunun hiçbiri kabul edilmez:', 'Values that happen to look integral (not greyed) do not form a consistent sequence in any column. None of Algorithm 3\'s 12 combinations survives:')}</p>
      ${searchTable(p3.search)}
      <h5>${t('Adım 2 — A\'nın bulunması (hk0 yansımaları)', 'Step 2 — Finding A (hk0 reflections)')}</h5>
      <p>${t(`Tetragonal için ÷1, 2, 4, 5, 8: <b>${f(p3.S[2], 4)}/2 = ${f(p3.S[2] / 2, 4)}</b> ve <b>${f(p3.S[4], 3)}/4 = ${f(p3.S[4] / 4, 4)}</b> tekrar eder → (110), (200), <b>A ≈ ${f(p3.Aest, 4)}</b>. Hekzagonal deneme (÷1, 3, 4) tutarlı bir A–C çifti vermez.`, `For tetragonal ÷1, 2, 4, 5, 8: <b>${f(p3.S[2], 4)}/2 = ${f(p3.S[2] / 2, 4)}</b> and <b>${f(p3.S[4], 3)}/4 = ${f(p3.S[4] / 4, 4)}</b> repeat → (110), (200), <b>A ≈ ${f(p3.Aest, 4)}</b>. A hexagonal trial (÷1, 3, 4) gives no consistent A–C pair.`)}</p>
      ${divTable(p3.S, [1, 2, 4, 5, 8], [[2, 2], [4, 4]])}
      <h5>${t('Adım 3 — C\'nin bulunması (sin²θ − nA)', 'Step 3 — Finding C (sin²θ − nA)')}</h5>
      <p>${t(`${f(p3.S[0], 4)} − A = ${f(p3.S[0] - p3.Aest, 4)} (l = 1) ve ${f(p3.S[1], 4)} = 4 × ${f(p3.S[1] / 4, 4)} (l = 2) → <b>C ≈ ${f(p3.Cest, 4)}</b>.`, `${f(p3.S[0], 4)} − A = ${f(p3.S[0] - p3.Aest, 4)} (l = 1) and ${f(p3.S[1], 4)} = 4 × ${f(p3.S[1] / 4, 4)} (l = 2) → <b>C ≈ ${f(p3.Cest, 4)}</b>.`)}</p>
      ${subTable(p3.S, p3.Aest, [0, 1, 2, 4, 5], p3.assign)}
      <h5>${t('Adım 4 — İndisleme, sönüm kontrolü, en küçük kareler', 'Step 4 — Indexing, extinction check, least squares')}</h5>
      <p>${t('Tüm indislerde <b>h+k+l çifttir</b>; 100, 001, 111 gözlenmez → <b>I-merkezli tetragonal</b>.', 'Every index has <b>h+k+l even</b>; 100, 001, 111 are absent → <b>body-centred tetragonal</b>.')}</p>
      ${table(['#', t('sin²θ (göz.)', 'sin²θ (obs.)'), '(hkl)', 'h²+k²', 'l²', 'h+k+l', t('sin²θ (hes.)', 'sin²θ (calc.)'), 'Δ', 'd (Å)'], p3.S.map((s, i) => { const g = p3.assign[i], h = g[2].split('').map(Number), c = g[0] * p3.fit.A + g[1] * p3.fit.C; return [i + 1, f(s, 4), { v: '(' + g[2] + ')', c: 'pe-em' }, g[0], g[1], { v: h[0] + h[1] + h[2], c: 'pe-ok' }, f(c, 4), f(s - c, 4), f(dSpacing(s, L1), 4)]; }))}
      ${algo({ tag: t('ALGORİTMA 7 · UYGULAMA', 'ALGORITHM 7 · APPLIED'), title: t('A ve C\'nin en küçük kareler ile hesabı (8 çizgi)', 'Least-squares A and C (8 lines)'),
        steps: lsqStepsText(p3.fit, 0, 0, 'h²+k²').concat([[t('Örgü parametreleri', 'Lattice parameters'), 'a = λ/(2√A) ; c = λ/(2√C)', `a = ${f(L1, 6)}/(2√${f(p3.fit.A, 5)}) = ${f(p3.a, 4)} Å ; c = ${f(p3.c, 4)} Å ; c/a = ${f(p3.c / p3.a, 3)}`]]) })}
      <h5>${t('Beklenen ama gözlenmeyen yansıma var mı? (Algoritma 9)', 'Any expected but unobserved reflection? (Algorithm 9)')}</h5>
      ${expTable(p3.expected, p3.S)}
      ${metrics([[t('Sistem · Bravais örgüsü', 'System · Bravais lattice'), t('Tetragonal · I', 'Tetragonal · I')], [t('Örgü parametreleri', 'Lattice parameters'), `a = ${f(p3.a, 3)} Å<br>c = ${f(p3.c, 3)} Å`, `c/a = ${f(p3.c / p3.a, 3)}`], [t('Olası element', 'Likely element'), t('İndiyum (In)', 'Indium (In)'), `ref. a = ${f(REF.In.a, 4)}, c = ${f(REF.In.c, 4)} Å`]])}
      ${sticks(p3.S.map((s, i) => ({ s, h: .5 + (i % 3) * .12, c: 'pe-c4', label: p3.assign[i][2] })))}
      ${note('pe-success', t('<b>Sonuç:</b> model tam 8 çizgi öngörür, 8\'i de gözlenir. İndiyum bazen eşdeğer yüzey merkezli tetragonal hücreyle (a′ = a√2 ≈ 4,59 Å) de tanımlanır; bu yalnız farklı bir hücre seçimidir.', '<b>Result:</b> the model predicts exactly 8 lines and all 8 are observed. Indium is sometimes described with an equivalent face-centred tetragonal cell (a′ = a√2 ≈ 4.59 Å); that is just a different cell choice.'))}`;

    /* ---------- 10-4 ---------- */
    const p4 = R.p104;
    const cands4 = [['Si', REF.Si], ['Ge', REF.Ge]].map(([n, a]) => { const e = L1 ** 2 * 32 / (4 * a * a), d = .645 - e; return [n, f(a, 4), f(e, 4), f(.645, 3), { v: (Math.abs(d) < .004 ? t('Uyumlu', 'Consistent') : t('Uyumsuz', 'Inconsistent')) + ' (Δ = ' + f(d, 4) + ')', c: Math.abs(d) < .004 ? 'pe-ok' : 'pe-bad' }]; });
    const panel4 = question('10-4', commonQ, p4.S.map(fv)) +
      answerHead(t('Elmas kübik yapı', 'Diamond-cubic structure')) +
      `<h5>${t('Adım 1 — Oranlar ve N (Algoritma 3)', 'Step 1 — Ratios and N (Algorithm 3)')}</h5>
      <p>${t(`3× sütunu <b>3, 8, 11, 16, 19, 24, 27, 32</b> verir. YMK'da olması gereken <b>N = 4, 12, 20</b> çizgileri, yani (200), (222), (420), sırasıyla sin²θ ≈ ${p4.fccMissing.map(x => f(x.sin2, 3)).join('; ')} konumlarında yoktur. Algoritma 3 bu yüzden F'yi “eksik N” ile reddeder ve yalnız elması kabul eder.`, `The 3× column gives <b>3, 8, 11, 16, 19, 24, 27, 32</b>. The FCC lines <b>N = 4, 12, 20</b> — (200), (222), (420) at sin²θ ≈ ${p4.fccMissing.map(x => f(x.sin2, 3)).join('; ')} — are absent, so Algorithm 3 rejects F for “missing N” and accepts only diamond.`)}</p>
      ${table(cubicHead(false), cubicRows(p4.S, p4.N, p4.hkl, L1, false))}
      ${searchTable(p4.search.filter(r => r.m === 3))}
      <h5>${t('Adım 2 — Örgü parametresi ve aday karşılaştırması', 'Step 2 — Lattice parameter and candidates')}</h5>
      ${algo({ tag: t('ALGORİTMA 4 · UYGULAMA', 'ALGORITHM 4 · APPLIED'), title: t('En küçük kareler K', 'Least-squares K'),
        steps: [[t('Toplamlar', 'Sums'), 'Σ(sin²θ·N), ΣN²', `${f(p4.lsq.sn, 4)} ; ${f(p4.lsq.nn, 0)}`], ['K', 'K = Σ(sin²θ·N)/ΣN²', f(p4.lsq.K, 6)], ['a', 'a = λ/(2√K)', `${f(p4.lsq.a, 4)} Å ` + t(`(ortalama ${f(p4.mean, 4)} Å)`, `(mean ${f(p4.mean, 4)} Å)`)]],
        note: t('Bu veride a değerleri açıyla düzenli bir kayma göstermez (±0,006 Å); ekstrapolasyon ek kazanç sağlamaz.', 'Here the a values show no systematic drift with angle (±0.006 Å); extrapolation adds nothing.').replace('0,006', f(.006, 3)) })}
      ${table([t('Aday (elmas kübik)', 'Candidate (diamond cubic)'), 'a<sub>ref</sub> (Å)', t('(440) beklenen', '(440) expected'), t('Gözlenen', 'Observed'), t('Değerlendirme', 'Assessment')], cands4)}
      ${metrics([[t('Yapı', 'Structure'), t('Elmas kübik', 'Diamond cubic'), t('F örgüsü + 2 atomlu baz', 'F lattice + two-atom basis')], [t('Ortalama a', 'Mean a'), f(p4.mean, 3) + ' Å'], [t('Olası element', 'Likely element'), t('Silisyum (Si)', 'Silicon (Si)'), 'ref. ' + f(REF.Si, 4) + ' Å']])}
      ${sticks(p4.S.map((s, i) => ({ s, h: .5 + (i % 3) * .12, label: p4.hkl[i].split('/')[0] })).concat(p4.fccMissing.map(x => ({ s: x.sin2, h: .3, c: 'pe-c5', dash: true, label: t('yok', 'absent') }))), `<text class="pe-lb pe-c5" x="64" y="16">┆ ${t('YMK\'da olup elmasta sönen yansımalar', 'FCC reflections extinct in diamond')}</text>`)}`;

    /* ---------- 10-5 ---------- */
    const p5 = R.p105;
    const cands5 = [['W', REF.W], ['Mo', REF.Mo]].map(([n, a]) => { const e = L1 ** 2 * 14 / (4 * a * a), d = .830 - e; return [n, f(a, 4), f(e, 4), f(.830, 3), { v: (Math.abs(d) < .002 ? t('Uyumlu', 'Consistent') : t('Uyumsuz', 'Inconsistent')) + ' (Δ = ' + f(d, 4) + ')', c: Math.abs(d) < .002 ? 'pe-ok' : 'pe-bad' }]; });
    const pRow = p5.search.find(r => r.m === 1 && r.lattice === 'P');
    const panel5 = question('10-5', commonQ, p5.S.map(fv)) +
      answerHead(t('Hacim merkezli kübik yapı', 'Body-centred cubic structure')) +
      `<h5>${t('Adım 1 — P mi, I mı? (Algoritma 3)', 'Step 1 — P or I? (Algorithm 3)')}</h5>
      <p>${t(`1× sütunu 1 : 2 : 3 : 4 : 5 : 6 : <b>${f(p5.S[6] / p5.S[0], 2)}</b> verir. P'de N = 7 yoktur (7 üç karenin toplamı olarak yazılamaz); en yakın izinli değerler 6 ve 8'dir, sapma %${f(pRow.maxDev * 100, 1)} → P reddedilir. 2× sütunu <b>2, 4, … , 14</b> verir → <b>I (HMK)</b>. 10-2'deki belirsizlik burada yedinci çizgi sayesinde kalkar.`, `The 1× column gives 1 : 2 : 3 : 4 : 5 : 6 : <b>${f(p5.S[6] / p5.S[0], 2)}</b>. N = 7 does not exist in P (7 is not a sum of three squares); the nearest allowed values are 6 and 8, a deviation of ${f(pRow.maxDev * 100, 1)}% → P is rejected. The 2× column gives <b>2, 4, … , 14</b> → <b>I (BCC)</b>. The ambiguity of 10-2 is removed here by the seventh line.`)}</p>
      ${table(cubicHead(true), cubicRows(p5.S, p5.N, p5.hkl, L1, true))}
      ${searchTable(p5.search.filter(r => r.lattice === 'P' || r.lattice === 'I'))}
      <h5>${t('Adım 2 — Ekstrapolasyon ve W/Mo ayrımı', 'Step 2 — Extrapolation and W/Mo distinction')}</h5>
      <p>${t(`Ek 5'te HMK ve a ≈ 3,15–3,17 Å olan iki element vardır: <b>Mo (${f(REF.Mo, 4)} Å)</b> ve <b>W (${f(REF.W, 4)} Å)</b>. Basit ortalama (${f(p5.mean, 3)} Å) ikisinin arasında kalır; ekstrapolasyon kararı netleştirir:`, `Appendix 5 lists two BCC elements with a ≈ 3.15–3.17 Å: <b>Mo (${f(REF.Mo, 4)} Å)</b> and <b>W (${f(REF.W, 4)} Å)</b>. The simple mean (${f(p5.mean, 3)} Å) falls between them; extrapolation settles it:`)}</p>
      ${extrap(p5.S, p5.a, [{ n: 'W', v: REF.W, c: 'pe-c2' }, { n: 'Mo', v: REF.Mo, c: 'pe-c5' }])}
      ${algo({ tag: t('ALGORİTMA 6 · UYGULAMA', 'ALGORITHM 6 · APPLIED'), title: t('Ekstrapolasyonun sayısal izi (7 çizgi)', 'Numerical trace of the extrapolation (7 lines)'),
        steps: [[t('Son çizgi: θ radyan ve f', 'Last line: θ in radians and f'), 'θ = arcsin(√sin²θ) ; f = ½(cos²θ/sinθ + cos²θ/θ)', `θ = ${f(thetaRad(p5.S[6]), 5)} rad ; f = ${f(nelsonRiley(p5.S[6]), 4)}`],
          [t('Ortalamalar', 'Means'), 'f̄, ā', `f̄ = ${f(p5.nr.xbar, 4)} ; ā = ${f(p5.nr.ybar, 4)} Å`],
          [t('Eğim ve kesişim', 'Slope and intercept'), 'm = S<sub>fa</sub>/S<sub>ff</sub> ; a₀ = ā − m·f̄', `m = ${f(p5.nr.sxy, 5)}/${f(p5.nr.sxx, 4)} = ${f(p5.nr.slope, 5)} ; a₀ = ${f(p5.nr.intercept, 4)} Å`]] })}
      ${table([t('Aday (HMK)', 'Candidate (BCC)'), 'a<sub>ref</sub> (Å)', t('(321) beklenen', '(321) expected'), t('Gözlenen', 'Observed'), t('Değerlendirme', 'Assessment')], cands5)}
      ${metrics([[t('Yapı', 'Structure'), t('Kübik · I (HMK)', 'Cubic · I (BCC)')], ['Nelson–Riley', f(p5.nr.intercept, 3) + ' Å'], [t('Olası element', 'Likely element'), t('Tungsten (W)', 'Tungsten (W)'), 'ref. ' + f(REF.W, 4) + ' Å']])}
      ${sticks(p5.S.map((s, i) => ({ s, h: .5 + (i % 3) * .12, label: p5.hkl[i] })))}`;

    /* ---------- 10-6 ---------- */
    const p6 = R.p106;
    const panel6 = question('10-6 *', commonQ, p6.S.map(fv)) +
      answerHead(t('Kübik olmayan desen: hekzagonal (HCP) indisleme', 'Non-cubic pattern: hexagonal (HCP) indexing')) +
      `<h5>${t('Adım 1 — Kübik test (Algoritma 3)', 'Step 1 — Cubic test (Algorithm 3)')}</h5>
      ${cubicTest(p6.S)}
      <p>${t('5. ve 7. çizgilerdeki tamsayıya yakın değerler (3,008; 4,010) rastlantısaldır; bunlar aynı A\'nın katlarıdır (110 ve 200). Algoritma 3 hiçbir kübik örgü kabul etmez:', 'The near-integers on lines 5 and 7 (3.008; 4.010) are coincidental; they are multiples of the same A (110 and 200). Algorithm 3 accepts no cubic lattice:').replace('3,008; 4,010', `${f(p6.S[4] / p6.S[0], 3)}; ${f(p6.S[6] / p6.S[0], 3)}`)}</p>
      ${searchTable(p6.search)}
      <h5>${t('Adım 2 — A\'nın bulunması (hk0 yansımaları)', 'Step 2 — Finding A (hk0 reflections)')}</h5>
      <p>${t(`Hekzagonal için ÷1, 3, 4, 7: <b>${f(p6.S[0], 4)}/1</b>, <b>${f(p6.S[4], 3)}/3 = ${f(p6.S[4] / 3, 4)}</b>, <b>${f(p6.S[6], 3)}/4 = ${f(p6.S[6] / 4, 4)}</b> → (100), (110), (200), <b>A ≈ ${f(p6.Aest, 4)}</b>.`, `For hexagonal ÷1, 3, 4, 7: <b>${f(p6.S[0], 4)}/1</b>, <b>${f(p6.S[4], 3)}/3 = ${f(p6.S[4] / 3, 4)}</b>, <b>${f(p6.S[6], 3)}/4 = ${f(p6.S[6] / 4, 4)}</b> → (100), (110), (200), <b>A ≈ ${f(p6.Aest, 4)}</b>.`)}</p>
      ${divTable(p6.S, [1, 3, 4, 7], [[0, 1], [4, 3], [6, 4]])}
      <h5>${t('Adım 3 — C\'nin bulunması (sin²θ − nA)', 'Step 3 — Finding C (sin²θ − nA)')}</h5>
      <p>${t(`${f(p6.S[1], 4)} hiçbir nA ile açıklanamaz → 00l: ${f(p6.S[1], 4)} = 4C → <b>C ≈ ${f(p6.Cest, 4)}</b>. Aynı kalan (102) ve (112)'de tekrar eder; ${f(p6.S[5], 3)} − A = 9C → (103).`, `${f(p6.S[1], 4)} cannot be explained by any nA → 00l: ${f(p6.S[1], 4)} = 4C → <b>C ≈ ${f(p6.Cest, 4)}</b>. The same remainder repeats for (102) and (112); ${f(p6.S[5], 3)} − A = 9C → (103).`)}</p>
      ${subTable(p6.S, p6.Aest, [0, 1, 3, 4], p6.assign)}
      ${note('pe-danger', t(`<b>Uyumsuz çizgi: ${f(p6.S[2], 4)}.</b> Hiçbir nA çıkarıldığında C·l² elde edilmez. Aynı A ve C ile (101) <b>${f(p6.expected101, 4)}</b>'da beklenir; Mg'de (101) desenin <b>en şiddetli</b> çizgisidir. Değer görseldeki tabloda ve PDF'deki problem listesinde (s. 56) aynıdır; kaynakta <b>baskı/aktarım hatası</b> (≈ 0,0988) en olası açıklamadır. Orijinal kaynakla karşılaştırılması önerilir.`, `<b>Mismatched line: ${f(p6.S[2], 4)}.</b> No nA subtraction yields C·l². With the same A and C, (101) is expected at <b>${f(p6.expected101, 4)}</b>; in Mg, (101) is the <b>strongest</b> line. The value is identical in the problem sheet and in the PDF (p. 56), so a <b>typographical/transcription error</b> (≈ 0.0988) is the most likely explanation. Check against the original source.`).replace('0,0988', f(.0988, 4)))}
      <h5>${t('Adım 4 — İndisleme, en küçük kareler, sönüm kontrolü', 'Step 4 — Indexing, least squares, extinction check')}</h5>
      ${table(['#', t('sin²θ (göz.)', 'sin²θ (obs.)'), '(hkl)', '(hkil)', 'h²+hk+k²', 'l²', t('sin²θ (hes.)', 'sin²θ (calc.)'), 'Δ', 'd (Å)', 'a (hk0) Å', 'c (00l) Å', 'p'], p6.S.map((s, i) => {
        const g = p6.assign[i];
        if (!g) { const e = p6.expected101; return [i + 1, { v: f(s, 4), c: 'pe-bad' }, { v: '(101)?', c: 'pe-bad' }, { v: mbStr(1, 0, 1) + '?', c: 'pe-bad' }, 1, 1, f(e, 4), { v: f(s - e, 4), c: 'pe-bad' }, f(dSpacing(s, L1), 4), '—', '—', multiplicity('hexagonal', 1, 0, 1)]; }
        const c = g[0] * p6.fit.A + g[1] * p6.fit.C, sn = Math.sqrt(s), hk = parseHKL(g[2]);
        return [i + 1, f(s, 4), { v: '(' + g[2] + ')', c: 'pe-em' }, { v: mbStr(...hk), c: 'pe-em' }, g[0], g[1], f(c, 4), f(s - c, 4), f(dSpacing(s, L1), 4), g[1] === 0 ? f(L1 * Math.sqrt(g[0]) / (Math.sqrt(3) * sn), 4) : '—', g[0] === 0 ? f(L1 * Math.sqrt(g[1]) / (2 * sn), 4) : '—', multiplicity('hexagonal', ...hk)];
      }))}
      <p class="pe-small">${t('(hkil): dört indisli Miller–Bravais gösterimi, i = −(h+k). p: toz çokluğu (6/mmm). Dört indisle simetri eşdeğeri düzlemler aynı rakamlarla görünür: (100), (010) ve (<span class="pe-ov">1</span>10) → (1 0 <span class="pe-ov">1</span> 0), (0 1 <span class="pe-ov">1</span> 0), (<span class="pe-ov">1</span> 1 0 0).', '(hkil): four-index Miller–Bravais notation, i = −(h+k). p: powder multiplicity (6/mmm). With four indices, symmetry-equivalent planes share the same digits: (100), (010) and (<span class="pe-ov">1</span>10) → (1 0 <span class="pe-ov">1</span> 0), (0 1 <span class="pe-ov">1</span> 0), (<span class="pe-ov">1</span> 1 0 0).')}</p>
      ${algo({ tag: t('ALGORİTMA 7 · UYGULAMA', 'ALGORITHM 7 · APPLIED'), title: t('A ve C\'nin en küçük kareler ile hesabı (0,0913 hariç 7 çizgi)', 'Least-squares A and C (7 lines, 0.0913 excluded)').replace(t('0,0913', '0.0913'), f(.0913, 4)),
        steps: lsqStepsText(p6.fit, 0, 0, 'h²+hk+k²').concat([[t('Örgü parametreleri (hekzagonal)', 'Lattice parameters (hexagonal)'), 'a = λ/√(3A) ; c = λ/(2√C)', `a = ${f(L1, 6)}/√(3×${f(p6.fit.A, 5)}) = ${f(p6.a, 4)} Å ; c = ${f(p6.c, 4)} Å ; c/a = ${f(p6.c / p6.a, 3)}`]]) })}
      <h5>${t('Beklenen ama gözlenmeyen yansıma var mı? (Algoritma 9)', 'Any expected but unobserved reflection? (Algorithm 9)')}</h5>
      <p>${t('(001), (003) ve (111) HCP kuralı gereği söner ve gözlenmez. Model tam 8 çizgi öngörür; 0,0913 dışında hepsi ±0,0003 içinde eşleşir.', '(001), (003) and (111) are extinct by the HCP rule and are not observed. The model predicts exactly 8 lines; all but 0.0913 match within ±0.0003.').replace(/0,0913|0\.0913/, f(.0913, 4)).replace(/0,0003|0\.0003/, f(.0003, 4))}</p>
      ${expTable(p6.expected, p6.S, true)}
      <p class="pe-small">${t('Çok küçük A ve C ile daha büyük hücreler 0,0913 dahil 8 çizgiye sayısal olarak uydurulabilir, ancak bunlar gözlenmeyen çok sayıda çizgi öngörür. En küçük ve eksiksiz hücre ilkesi Mg modelini destekler.', 'Larger cells (very small A and C) can be fitted numerically to all 8 lines including 0.0913, but they predict many unobserved lines. The smallest-complete-cell principle supports the Mg model.').replace(/0,0913|0\.0913/, f(.0913, 4))}</p>
      ${metrics([[t('Sistem · yapı', 'System · structure'), t('Hekzagonal · HCP', 'Hexagonal · HCP'), t('P örgüsü + 2 atomlu baz', 'P lattice + two-atom basis')], [t('Örgü parametreleri (7 çizgi)', 'Lattice parameters (7 lines)'), `a = ${f(p6.a, 3)} Å<br>c = ${f(p6.c, 3)} Å`, `c/a = ${f(p6.c / p6.a, 3)}`], [t('Olası element', 'Likely element'), t('Magnezyum (Mg)', 'Magnesium (Mg)'), `ref. a = ${f(REF.Mg.a, 4)}, c = ${f(REF.Mg.c, 4)} Å`]])}
      ${sticks(p6.S.map((s, i) => ({ s, h: .5 + (i % 3) * .12, c: p6.assign[i] ? 'pe-c4' : 'pe-c5', label: p6.assign[i] ? p6.assign[i][2] : f(s, 4) })).concat([{ s: p6.expected101, h: .95, c: 'pe-c6', dash: true, label: t('101 (bekl.)', '101 (exp.)') }]))}
      <p class="pe-small">${t('Kırmızı: verilen 0,0913; kesikli gri: beklenen (101) konumu.', 'Red: the given 0.0913; dashed grey: expected (101) position.').replace(/0,0913|0\.0913/, f(.0913, 4))}</p>`;

    /* ---------- 3B: birim hücre, (hkl) düzlemleri ve faz ---------- */
    const PH = [[0, '0'], [1 / 6, '1/6'], [1 / 4, '1/4'], [1 / 3, '1/3'], [1 / 2, '1/2'], [2 / 3, '2/3'], [3 / 4, '3/4'], [5 / 6, '5/6']];
    const phaseTxt = ph => { const m = PH.find(q => Math.abs(q[0] - ph) < 1e-6); return m ? m[1] : f(ph, 3); };
    const phaseVar = ph => { const q = Math.round(ph * 12) % 12; return q === 0 ? '--ok' : q === 6 ? '--forbid' : (q === 3 || q === 9) ? '--copper' : '--cobalt'; };
    const LABS = {
      101: { st: 'fcc', a: R.p101.nr.intercept, lam: L1, lamName: 'Cu Kα₁', obs: R.p101.hkl.flatMap((h, i) => h.split('/').map(x => [x, R.p101.S[i]])), forb: ['100', '110', '210'] },
      102: { st: 'bcc', a: R.p102.mean, lam: LAMBDA.CrKa, lamName: 'Cr Kα', obs: R.p102.hkl.map((h, i) => [h, R.p102.SA[i]]), forb: ['100', '111', '210'] },
      103: { st: 'bct', a: R.p103.a, c: R.p103.c, lam: L1, lamName: 'Cu Kα₁', obs: R.p103.assign.map((g, i) => [g[2], R.p103.S[i]]), forb: ['100', '001', '111'] },
      104: { st: 'diamond', a: R.p104.mean, lam: L1, lamName: 'Cu Kα₁', obs: R.p104.hkl.flatMap((h, i) => h.split('/').map(x => [x, R.p104.S[i]])), forb: ['200', '222', '420', '100'] },
      105: { st: 'bcc', a: R.p105.nr.intercept, lam: L1, lamName: 'Cu Kα₁', obs: R.p105.hkl.map((h, i) => [h, R.p105.S[i]]), forb: ['100', '111', '210'] },
      106: { st: 'hcp', a: R.p106.a, c: R.p106.c, lam: L1, lamName: 'Cu Kα₁', obs: R.p106.assign.map((g, i) => [g ? g[2] : '101', R.p106.S[i], !g]), forb: ['001', '003', '111'] }
    };
    const structName = { fcc: t('YMK (F)', 'FCC (F)'), bcc: t('HMK (I)', 'BCC (I)'), diamond: t('elmas kübik', 'diamond cubic'), bct: t('I-merkezli tetragonal', 'body-centred tetragonal'), hcp: 'HCP' };
    const hklLabel = (st, hkl, plain) => { const [h, k, l] = parseHKL(hkl); return '(' + hkl + ')' + (STRUCTURES[st].sys === 'hexagonal' ? ' = ' + (plain ? mbPlain : mbStr)(h, k, l) : ''); };
    function lab3dHTML(key) {
      const L = LABS[key], hex = L.st === 'hcp';
      const opt = (hkl, extra) => `<option value="${hkl}">${hklLabel(L.st, hkl, true)}${extra || ''}</option>`;
      const seenOpt = new Set();
      const obsOpts = L.obs.filter(o => !seenOpt.has(o[0]) && seenOpt.add(o[0])).map(o => opt(o[0], ' · sin²θ = ' + fv(o[1]) + (o[2] ? ' ?' : ''))).join('');
      const legend = [['--ok', t('0 (eş faz)', '0 (in phase)')], ['--forbid', t('π (zıt faz)', 'π (opposite)')], ['--copper', 'π/2, 3π/2'], ['--cobalt', t('diğer (ör. 2π/3)', 'other (e.g. 2π/3)')]]
        .map(c => `<span><i style="background:var(${c[0]})"></i>${c[1]}</span>`).join('');
      return `<h5>${t('3B: birim hücre, (hkl) düzlemleri ve yapı faktörü', '3D: unit cell, (hkl) planes and structure factor')}</h5>
      <p>${t(`Bulunan yapının (${structName[L.st]}) geleneksel birim hücresi. Bir yansıma seçin: düzlem ailesi turkuaz çizilir; atomlar o yansıma için saçtıkları dalganın fazına (φ = 2π(hx+ky+lz)) göre renklenir. Aynı renkteki atomlar aynı düzlem kümesindedir. Zıt fazdaki (kırmızı) atomların oluşturduğu ara düzlemler katkıları götürür: <b>sönümün geometrik nedeni</b> budur.`, `The conventional unit cell of the structure found (${structName[L.st]}). Choose a reflection: the plane family is drawn in teal and atoms are coloured by the phase of their scattered wave for that reflection (φ = 2π(hx+ky+lz)). Atoms of the same colour lie on the same set of planes. Interleaved planes of opposite-phase (red) atoms cancel the contribution: this is the <b>geometric reason for an extinction</b>.`)}</p>
      <div class="pe-3d" data-lab="${key}">
        <div class="pe-3d-view"><div class="pe-3d-slot"></div><div class="pe-3d-legend">${legend}</div></div>
        <div class="pe-3d-side">
          <label class="pe-3d-lab">${t('Yansıma', 'Reflection')}<select class="pe-3d-sel">
            <optgroup label="${t('Gözlenen (indislenmiş) çizgiler', 'Observed (indexed) lines')}">${obsOpts}</optgroup>
            <optgroup label="${t('Sönen yansıma örnekleri', 'Examples of extinct reflections')}">${L.forb.map(x => opt(x, ' · ' + t('söner', 'extinct'))).join('')}</optgroup>
          </select></label>
          <label class="pe-chk"><input type="checkbox" class="pe-3d-phase" checked> ${t('Atomları faza göre renklendir', 'Colour atoms by phase')}</label>
          <label class="pe-chk"><input type="checkbox" class="pe-3d-half" checked> ${t('Faz kayması olan ara düzlemleri göster', 'Show phase-shifted interleaved planes')}</label>
          ${hex ? `<label class="pe-chk"><input type="checkbox" class="pe-3d-prism"> ${t('Altıgen prizma (3 hücre)', 'Hexagonal prism (3 cells)')}</label>` : ''}
          <div class="pe-3d-info"></div>
        </div>
      </div>`;
    }
    function info3d(key) {
      const L = LABS[key], box = host.querySelector(`.pe-3d[data-lab="${key}"]`);
      const hkl = box.querySelector('.pe-3d-sel').value, [h, k, l] = parseHKL(hkl), S = STRUCTURES[L.st], sys = S.sys;
      const d = dHKL(sys, L.a, L.c, h, k, l), x = L.lam / (2 * d), F = structureFactor(S.atoms, h, k, l), p = multiplicity(sys, h, k, l);
      const ob = L.obs.find(o => o[0] === hkl), counts = {};
      F.phases.forEach(ph => { const q = phaseTxt(ph); counts[q] = (counts[q] || 0) + 1; });
      const idx = sys === 'cubic' ? `N = h²+k²+l² = ${h * h + k * k + l * l}` : sys === 'tetragonal' ? `h²+k² = ${h * h + k * k} ; l² = ${l * l}` : `h²+hk+k² = ${h * h + h * k + k * k} ; l² = ${l * l}`;
      const cplx = F.im === 0 ? f(F.re, 3) : `${f(F.re, 3)} ${F.im < 0 ? '−' : '+'} ${f(Math.abs(F.im), 3)}i`;
      const extinct = F.abs2 < 1e-9;
      const rows = [
        [t('İndis', 'Indices'), hklLabel(L.st, hkl) + (sys === 'hexagonal' ? `<br><span class="pe-small">i = −(h+k) = ${bar(-(h + k))}</span>` : '')],
        [t('Toplamlar', 'Sums'), idx],
        ['d (Å)', `${f(d, 4)} <span class="pe-small">(${sys === 'cubic' ? 'a = ' + f(L.a, 4) : 'a = ' + f(L.a, 3) + ', c = ' + f(L.c, 3)} Å)</span>`],
        [t('sin²θ hes. / göz.', 'sin²θ calc. / obs.'), x <= 1 ? `${f(x * x, 4)} / ${ob ? (ob[2] ? `<b class="pe-bad-t">${fv(ob[1])}</b>` : fv(ob[1])) : '—'}` : t('erişilemez (λ/2d > 1)', 'inaccessible (λ/2d > 1)')],
        ['2θ (' + L.lamName + ')', x <= 1 ? f(2 * deg(Math.asin(x)), 2) + '°' : '—'],
        [t('Atom fazları φ/2π', 'Atom phases φ/2π'), Object.entries(counts).map(([q, n]) => `<span class="pe-dot" style="background:var(${phaseVar(PH.find(r => r[1] === q) ? PH.find(r => r[1] === q)[0] : 0.1)})"></span>${q} (×${n})`).join(' &nbsp; ')],
        ['F / f = Σ e<sup>2πiφ</sup>', `${cplx} &nbsp; → &nbsp; |F|²/f² = ${f(F.abs2, 2)}`],
        [t('Çokluk p', 'Multiplicity p'), p],
      ];
      let verdict;
      if (extinct) verdict = `<div class="pe-note pe-danger">${t('<b>Söner:</b> faz katkılarının toplamı sıfır. Ara düzlemlerdeki atomlar ana düzlemlerdekilerle tam zıt fazda saçar.', '<b>Extinct:</b> the phase contributions sum to zero. Atoms on the interleaved planes scatter exactly out of phase with those on the main planes.')}</div>`;
      else if (ob && ob[2]) verdict = `<div class="pe-note pe-warn">${t(`<b>İzinli ve güçlü</b> (p = ${p}). Bu modelde ${f(x * x, 4)}'te beklenir; verilen ${fv(ob[1])} uyumsuz (olası veri hatası).`, `<b>Allowed and strong</b> (p = ${p}). Expected at ${f(x * x, 4)} in this model; the given ${fv(ob[1])} does not fit (likely data error).`)}</div>`;
      else verdict = `<div class="pe-note pe-success">${t(`<b>İzinli:</b> katkılar ${F.abs2 > S.atoms.length ** 2 - 1e-6 ? 'tamamen' : 'kısmen'} toplanır (|F|²/f² = ${f(F.abs2, 2)}; en büyük değer ${S.atoms.length ** 2}).`, `<b>Allowed:</b> contributions add ${F.abs2 > S.atoms.length ** 2 - 1e-6 ? 'fully' : 'partly'} (|F|²/f² = ${f(F.abs2, 2)}; maximum ${S.atoms.length ** 2}).`)}</div>`;
      box.querySelector('.pe-3d-info').innerHTML = `<table class="pe-kv">${rows.map(r => `<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`).join('')}</table>${verdict}`;
    }

    /* ---------- özet ---------- */
    const sumRows = [
      ['10-1', t('Kübik', 'Cubic'), t('F (YMK)', 'F (FCC)'), '(111), (200), (220)', f(p1.nr.intercept, 3) + ' Å (N–R)', f(REF.Al, 4) + ' Å', 'Al'],
      ['10-2', t('Kübik', 'Cubic'), t('I (HMK)', 'I (BCC)'), '(110), (200), (211)', f(p2.mean, 3) + ' Å', f(REF.Fe, 4) + ' Å', 'α-Fe'],
      ['10-3', t('Tetragonal', 'Tetragonal'), t('I (hacim merkezli)', 'I (body-centred)'), '(101), (002), (110)', `a = ${f(p3.a, 3)}, c = ${f(p3.c, 3)} Å`, `${f(REF.In.a, 4)} / ${f(REF.In.c, 4)} Å`, 'In'],
      ['10-4', t('Kübik', 'Cubic'), t('Elmas (F + baz)', 'Diamond (F + basis)'), '(111), (220), (311)', f(p4.mean, 3) + ' Å', f(REF.Si, 4) + ' Å', 'Si'],
      ['10-5', t('Kübik', 'Cubic'), t('I (HMK)', 'I (BCC)'), '(110), (200), (211)', f(p5.nr.intercept, 3) + ' Å (N–R)', f(REF.W, 4) + ' Å', 'W'],
      ['10-6', t('Hekzagonal', 'Hexagonal'), t('P (HCP yapısı)', 'P (HCP structure)'), mbStr(1, 0, 0) + ', ' + mbStr(0, 0, 2) + ', ' + mbStr(1, 0, 1) + '*', `a = ${f(p6.a, 3)}, c = ${f(p6.c, 3)} Å`, `${f(REF.Mg.a, 4)} / ${f(REF.Mg.c, 4)} Å`, 'Mg']
    ].map(r => [{ v: `<button type="button" class="pe-link" data-go="${r[0].replace('-', '')}">${r[0]}</button>` }].concat(r.slice(1, 6), [{ v: '<b>' + r[6] + '</b>' }]));
    const summaryHTML = table([t('Problem', 'Problem'), t('Sistem', 'System'), t('Bravais / yapı', 'Bravais / structure'), t('İlk üç (hkl)', 'First three (hkl)'), t('Hesaplanan', 'Calculated'), t('Referans', 'Reference'), t('Element', 'Element')], sumRows) +
      `<p class="pe-small">* ${t('10-6: (101) ', '10-6: (101) ')}${f(p6.expected101, 4)}${t('\'da beklenir; verilen ', ' expected; the given ')}${f(.0913, 4)}${t(' uyumsuzdur (olası veri hatası).', ' does not fit (likely data error).')}</p>
      <h4>${t('Kontrol listesi', 'Checklist')}</h4>
      <ul>
        <li>${t('Kübik oran dizisi tutmuyorsa önce veri/aktarım hatasını, sonra kübik olmayan sistemleri düşünün.', 'If no cubic ratio sequence fits, suspect data/transcription errors first, then non-cubic systems.')}</li>
        <li>${t('Modeli seçmeden önce <b>beklenen ama gözlenmeyen</b> yansımaları kontrol edin; en küçük ve eksiksiz hücre tercih edilir.', 'Before accepting a model, check <b>expected but unobserved</b> reflections; prefer the smallest complete cell.')}</li>
        <li>${t('Örgü parametresini yüksek açılı çizgilerden ya da ekstrapolasyonla belirleyin; Nelson–Riley\'de θ radyan olmalı.', 'Determine lattice parameters from high-angle lines or by extrapolation; θ must be in radians in Nelson–Riley.')}</li>
        <li>${t('Element tahmininde yapı türüyle birlikte a (ve c) değerini Ek 5\'teki adaylarla karşılaştırın.', 'When identifying the element, compare a (and c) with the Appendix 5 candidates as well as the structure type.')}</li>
      </ul>
      <p class="pe-small"><b>${t('Kaynak', 'Source')}:</b> <i>Tozkirinim007.pdf</i>, ${t('Bölüm 6 “XRD deseninin indislenmesi”: kübik bağıntılar ve N dizileri (s. 2–4), oran yöntemi (s. 5–12), analitik K (s. 13–21), kübik olmayan sistemler ve Hull–Davey (s. 22–37), Ti örneği (s. 38–46), kübik olmayan analitik yöntem (s. 47–55), problemler (s. 56–57). Problemler B. D. Cullity, <i>Elements of X-Ray Diffraction</i> kitabındaki alıştırmalardır. Nelson–Riley ekstrapolasyonu, Kβ şiddet ölçütü, floresans notu, aday karşılaştırmaları ve algoritmalar ek olarak verilmiştir.', 'Chapter 6 “Indexing an XRD pattern”: cubic relations and N sequences (pp. 2–4), ratio method (pp. 5–12), analytical K (pp. 13–21), non-cubic systems and Hull–Davey (pp. 22–37), Ti example (pp. 38–46), non-cubic analytical method (pp. 47–55), problems (pp. 56–57). The problems are exercises from B. D. Cullity, <i>Elements of X-Ray Diffraction</i>. Nelson–Riley extrapolation, the Kβ intensity criterion, the fluorescence note, candidate comparisons and the algorithms are supplementary.')}</p>`;

    /* ---------- birleştir ---------- */
    const ids = ['101', '102', '103', '104', '105', '106'];
    const panels = [panel1, panel2, panel3, panel4, panel5, panel6].map((pn, i) => pn + lab3dHTML(ids[i]));
    host.innerHTML = `
      <div class="pe-root">
        <div class="pe-top">
          <div>
            <h3>${t('Alıştırmalar: toz desenlerinin indislenmesi', 'Exercises: indexing powder patterns')}</h3>
            <p>${t('Problemler 10-1 – 10-6. Her sekmede önce soru, ardından adım adım çözüm, algoritma izleri ve denetimler yer alır. Tüm sayılar verilen sin²θ değerlerinden bu sayfada hesaplanır.', 'Problems 10-1 – 10-6. Each tab shows the question first, then a step-by-step solution, algorithm traces and checks. All numbers are computed on this page from the given sin²θ values.')}</p>
          </div>
          <button type="button" class="pe-print" data-pe-print title="${t('Altı problemin tamamını, her biri ayrı sayfada yazdırır', 'Prints all six problems, one per page')}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/></svg>
            ${t('Yazdır / PDF olarak kaydet', 'Print / save as PDF')}
          </button>
        </div>
        <details class="pe-fold"><summary><span><b>${t('Yöntem ve temel denklemler', 'Method and key equations')}</b><small>${t('Kübik ve kübik olmayan sistemler, sönüm kuralları, ekstrapolasyon, dalga boyları', 'Cubic and non-cubic systems, extinction rules, extrapolation, wavelengths')}</small></span></summary><div class="pe-fold-body">${methodHTML}</div></details>
        <details class="pe-fold"><summary><span><b>${t('Hesaplama algoritmaları (adım adım)', 'Calculation algorithms (step by step)')}</b><small>${t('Radyan/derece çevrimi, d ve a, oran yöntemi, K, A–C, Nelson–Riley, en küçük kareler, Kα/Kβ, beklenen yansımalar · sözde kod', 'Radian/degree conversion, d and a, ratio method, K, A–C, Nelson–Riley, least squares, Kα/Kβ, expected reflections · pseudocode')}</small></span></summary><div class="pe-fold-body">${algos}</div></details>
        <div class="pe-tabs" role="tablist" aria-label="${t('Problemler', 'Problems')}">
          ${ids.map((id, i) => `<button type="button" role="tab" id="pe-tab-${id}" aria-controls="pe-p${id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}"><small>${t('Problem', 'Problem')}</small><b>10-${i + 1}</b></button>`).join('')}
        </div>
        ${panels.map((p, i) => `<section class="pe-panel" id="pe-p${ids[i]}" role="tabpanel" aria-labelledby="pe-tab-${ids[i]}" tabindex="0"${i ? ' hidden' : ''}>${p}</section>`).join('')}
        <details class="pe-fold"><summary><span><b>${t('Sonuçların karşılaştırılması', 'Summary of results')}</b><small>${t('Altı problemin özeti, kontrol listesi ve kaynak', 'Summary of all six problems, checklist and source')}</small></span></summary><div class="pe-fold-body">${summaryHTML}</div></details>
      </div>`;

    /* ---------- 3B görüntüleyici (sitenin Viewer3D'si; tek WebGL bağlamı, sekmeler arasında taşınır) ---------- */
    ids.forEach(info3d);
    const canvasBox = document.createElement('div');
    canvasBox.className = 'pe-3d-canvas';
    canvasBox.innerHTML = `<span class="pe-3d-hint">${t('Sürükleyerek döndürün, tekerlekle yakınlaştırın', 'Drag to rotate, scroll to zoom')}</span>`;
    host.querySelector('.pe-3d[data-lab="101"] .pe-3d-slot').appendChild(canvasBox);
    let viewer = null, current = '101';
    const G = root;
    const has3D = typeof Viewer3D === 'function' && typeof clipBox === 'function' && typeof basis === 'function' && typeof addSphere === 'function' && typeof THREE !== 'undefined';
    if (has3D) { try { viewer = new Viewer3D(canvasBox, { dist: 10.5, rx: .36, ry: -.62, label: t('3B birim hücre ve düzlemler', '3D unit cell and planes') }); } catch (e) { viewer = null; } }
    if (!viewer) canvasBox.insertAdjacentHTML('beforeend', `<p class="pe-small pe-3d-off">${t('3B görünüm bu ortamda kullanılamıyor (WebGL/Three.js yok). Sağdaki yapı faktörü tablosu yine de geçerlidir.', '3D view is unavailable here (no WebGL/Three.js). The structure-factor table on the right still applies.')}</p>`);
    function build3d(key) {
      if (!viewer || !viewer.ok) return;
      const L = LABS[key], box = host.querySelector(`.pe-3d[data-lab="${key}"]`), S = STRUCTURES[L.st], hex = S.sys === 'hexagonal';
      const [h, k, l] = parseHKL(box.querySelector('.pe-3d-sel').value);
      const phaseOn = box.querySelector('.pe-3d-phase').checked, halfOn = box.querySelector('.pe-3d-half').checked;
      const prism = hex && !!(box.querySelector('.pe-3d-prism') || {}).checked;
      viewer.clear();
      const g = viewer.content, B = basis({ a: L.a, b: L.a, c: L.c || L.a, al: 90, be: 90, ga: hex ? 120 : 90 });
      const cart = q => [0, 1, 2].map(i => q[0] * B[0][i] + q[1] * B[1][i] + q[2] * B[2][i]);
      const inPrism = q => Math.abs(q[0]) <= 1 + 1e-9 && Math.abs(q[1]) <= 1 + 1e-9 && Math.abs(q[0] - q[1]) <= 1 + 1e-9;
      const atoms = [], seen = new Set();
      S.atoms.forEach(a0 => { for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let m = 0; m <= 1; m++) {
        const q = [a0[0] + i, a0[1] + j, a0[2] + m];
        if (q[2] < -1e-9 || q[2] > 1 + 1e-9) continue;
        const ok = prism ? inPrism(q) : q.every(v => v > -1e-9 && v < 1 + 1e-9);
        const id = q.map(v => v.toFixed(4)).join();
        if (ok && !seen.has(id)) { seen.add(id); atoms.push(q); }
      } });
      const box01 = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]], cellEdges = [];
      for (let i = 0; i < 4; i++) { const A = box01[i], Bq = box01[(i + 1) % 4]; cellEdges.push([A, Bq], [[A[0], A[1], 1], [Bq[0], Bq[1], 1]], [A, [A[0], A[1], 1]]); }
      const hexV = [[1, 0], [1, 1], [0, 1], [-1, 0], [-1, -1], [0, -1]], prismEdges = [];
      if (prism) for (let i = 0; i < 6; i++) { const A = hexV[i], Bq = hexV[(i + 1) % 6]; prismEdges.push([[A[0], A[1], 0], [Bq[0], Bq[1], 0]], [[A[0], A[1], 1], [Bq[0], Bq[1], 1]], [[A[0], A[1], 0], [A[0], A[1], 1]]); }
      const pts = atoms.concat(...cellEdges, ...prismEdges).map(cart), mn = [0, 1, 2].map(i => Math.min(...pts.map(v => v[i]))), mx = [0, 1, 2].map(i => Math.max(...pts.map(v => v[i])));
      const cen = mn.map((v, i) => (v + mx[i]) / 2), sc = 3.7 / Math.max(...mx.map((v, i) => v - mn[i]));
      const F = { toC: q => { const v = cart(q); return new THREE.Vector3((v[0] - cen[0]) * sc, (v[2] - cen[2]) * sc, -(v[1] - cen[1]) * sc); } };
      const lines = (edges, color, op) => { const arr = []; edges.forEach(e => e.forEach(q => { const v = F.toC(q); arr.push(v.x, v.y, v.z); })); addLines(g, arr, color, op); };
      if (prism) lines(prismEdges, '--muted', .55);
      lines(cellEdges, prism ? '--ink' : '--muted', 1);
      const r = (L.st === 'diamond' ? .15 : .2) * (prism ? .8 : 1);
      atoms.forEach(q => addSphere(g, F.toC(q), r, phaseOn ? phaseVar(frac1(h * q[0] + k * q[1] + l * q[2])) : '--cobalt'));
      // düzlemler: tam sayılı aile + atom fazlarına karşılık gelen ara düzlemler (birim hücre içinde)
      const lo = Math.min(0, h) + Math.min(0, k) + Math.min(0, l), hi = Math.max(0, h) + Math.max(0, k) + Math.max(0, l);
      const plane = (val, color, op) => {
        const poly = clipBox(h, k, l, val, 1); if (poly.length < 3) return;
        const pos = []; poly.forEach(q => { const v = F.toC(q); pos.push(v.x, v.y, v.z); });
        const idx = []; for (let i = 1; i < poly.length - 1; i++) idx.push(0, i, i + 1);
        const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
        const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: col(color), transparent: true, opacity: op, side: THREE.DoubleSide, depthWrite: false }));
        mesh.renderOrder = 2; g.add(mesh);
        const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.add(new THREE.LineLoop(lg, new THREE.LineBasicMaterial({ color: col(color), transparent: true, opacity: Math.min(1, op * 2.2) })));
      };
      if (h || k || l) {
        for (let m = lo; m <= hi; m++) plane(m, '--teal', .32);
        if (halfOn) [...new Set(S.atoms.map(q => frac1(h * q[0] + k * q[1] + l * q[2])))].filter(ph => ph > 1e-6).forEach(ph => {
          for (let m = lo - 1; m <= hi; m++) { const v = m + ph; if (v > lo + 1e-9 && v < hi - 1e-9) plane(v, phaseVar(ph), .16); }
        });
      }
      const lab = (txt, q) => { const sp = makeLabel(txt, '--muted', .34); sp.position.copy(F.toC(q)); g.add(sp); };
      lab(hex ? 'a₁' : 'a', [1.14, 0, 0]); lab(hex ? 'a₂' : 'b', [0, 1.14, 0]); lab('c', [0, 0, 1.1]);
    }
    let applyViewer = key => { current = key; host.querySelector(`.pe-3d[data-lab="${key}"] .pe-3d-slot`).appendChild(canvasBox); build3d(key); };
    host.querySelectorAll('.pe-3d').forEach(box => {
      const key = box.dataset.lab;
      box.querySelectorAll('select, input').forEach(el => el.addEventListener('change', () => { info3d(key); if (key === current) build3d(key); }));
    });
    if (typeof onTheme === 'function') onTheme(() => build3d(current));
    void G;

    /* ---------- sekmeler ---------- */
    const tabs = ids.map(id => host.querySelector('#pe-tab-' + id));
    const show = (k, focus) => {
      tabs.forEach((b, i) => { const on = i === k; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; host.querySelector('#pe-p' + ids[i]).hidden = !on; if (on && focus) b.focus(); });
      applyViewer(ids[k]);
      try { localStorage.setItem('xrd-pe-tab', ids[k]); } catch (e) { /* özel mod */ }
    };
    tabs.forEach((b, i) => {
      b.addEventListener('click', () => show(i));
      b.addEventListener('keydown', e => {
        let j = null;
        if (e.key === 'ArrowRight') j = (i + 1) % 6; else if (e.key === 'ArrowLeft') j = (i + 5) % 6; else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = 5;
        if (j !== null) { e.preventDefault(); e.stopPropagation(); show(j, true); }
      });
    });
    host.addEventListener('click', e => {
      const go = e.target.closest('[data-go]');
      if (go) { show(ids.indexOf(go.dataset.go)); host.querySelector('.pe-tabs').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
    let start = 0;
    try { const saved = ids.indexOf(localStorage.getItem('xrd-pe-tab')); if (saved > 0) start = saved; } catch (e) { /* yok */ }
    show(start);
    // Alt sekme ilk kez görünür olduğunda sahneyi yeniden kur (gizliyken boyut 0'dır).
    const subTab = document.querySelector('[data-sub="s3ex"]');
    if (subTab) subTab.addEventListener('click', () => requestAnimationFrame(() => build3d(current)));

    /* ---------- yazdırma: yalnız alıştırmalar ---------- */
    const rootEl = host.querySelector('.pe-root');
    let marker = null, printHost = null, saved = null;
    function restore() {
      if (!marker) return;
      marker.parentNode.insertBefore(rootEl, marker); marker.remove(); marker = null;
      printHost.remove(); printHost = null;
      document.documentElement.classList.remove('pe-printing');
      host.querySelectorAll('details').forEach((d, i) => { d.open = saved.details[i]; });
      host.querySelectorAll('.pe-panel').forEach((p, i) => { p.hidden = saved.hidden[i]; });
      window.scrollTo(0, saved.y);
    }
    host.querySelector('[data-pe-print]').addEventListener('click', () => {
      saved = { y: window.scrollY, details: [...host.querySelectorAll('details')].map(d => d.open), hidden: [...host.querySelectorAll('.pe-panel')].map(p => p.hidden) };
      host.querySelectorAll('details.pe-fold').forEach(d => { d.open = true; });
      host.querySelectorAll('.pe-panel').forEach(p => { p.hidden = false; });
      marker = document.createComment('pe-print'); rootEl.parentNode.insertBefore(marker, rootEl);
      printHost = document.createElement('div'); printHost.className = 'pe-print-host'; printHost.appendChild(rootEl); document.body.appendChild(printHost);
      document.documentElement.classList.add('pe-printing');
      window.addEventListener('afterprint', restore, { once: true });
      window.print();
      setTimeout(() => { if (!window.matchMedia('print').matches) restore(); }, 400);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(typeof globalThis !== 'undefined' ? globalThis : this);
