/* Bravais-centering-only powder-line atlas, independent of the animated scan.
 * Each entry uses approximate published conventional unit-cell parameters (Å, degrees).
 * Bragg positions are derived from the reciprocal metric and Cu Kα1 (1.5406 Å).
 * Atomic bases, screw/glide absences, structure factors and intensities are deliberately
 * NOT simulated: these are educational candidate lines, not measured XRD patterns.
 */
(function (root) {
  'use strict';

  const LAMBDA = 1.5406;
  const MIN_TWO_THETA = 10;
  const MAX_TWO_THETA = 110;
  const MAX_LINES = 18;
  const C = (a, b, c, alpha = 90, beta = 90, gamma = 90) =>
    [a, b, c, alpha, beta, gamma];
  const cubic = a => C(a, a, a);
  const tetragonal = (a, c) => C(a, a, c);
  const orthorhombic = (a, b, c) => C(a, b, c);
  const hexagonal = (a, c) => C(a, a, c, 90, 90, 120);
  const monoclinic = (a, b, c, beta) => C(a, b, c, 90, beta, 90);

  const ATLAS = [
    { id: 'cubic', tr: 'Kübik', en: 'Cubic', lattices: [
      { id: 'cP', centering: 'P', examples: [
        { tr: 'Stronsiyum titanat', en: 'Strontium titanate', formula: 'SrTiO₃', sg: 'Pm-3m', cell: cubic(3.905) },
        { tr: 'Sezyum klorür', en: 'Caesium chloride', formula: 'CsCl', sg: 'Pm-3m', cell: cubic(4.123) }
      ] },
      { id: 'cI', centering: 'I', examples: [
        { tr: 'α-Demir', en: 'α-Iron', formula: 'α-Fe', sg: 'Im-3m', cell: cubic(2.866) },
        { tr: 'Tungsten', en: 'Tungsten', formula: 'W', sg: 'Im-3m', cell: cubic(3.165) }
      ] },
      { id: 'cF', centering: 'F', examples: [
        { tr: 'Bakır', en: 'Copper', formula: 'Cu', sg: 'Fm-3m', cell: cubic(3.615) },
        { tr: 'Sodyum klorür', en: 'Sodium chloride', formula: 'NaCl', sg: 'Fm-3m', cell: cubic(5.640) }
      ] }
    ] },
    { id: 'tetragonal', tr: 'Tetragonal', en: 'Tetragonal', lattices: [
      { id: 'tP', centering: 'P', examples: [
        { tr: 'Rutil', en: 'Rutile', formula: 'TiO₂', sg: 'P4₂/mnm', cell: tetragonal(4.594, 2.959) },
        { tr: 'Kasiterit', en: 'Cassiterite', formula: 'SnO₂', sg: 'P4₂/mnm', cell: tetragonal(4.738, 3.187) }
      ] },
      { id: 'tI', centering: 'I', examples: [
        { tr: 'Anataz', en: 'Anatase', formula: 'TiO₂', sg: 'I4₁/amd', cell: tetragonal(3.784, 9.515) },
        { tr: 'İndiyum', en: 'Indium', formula: 'In', sg: 'I4/mmm', cell: tetragonal(3.252, 4.946) }
      ] }
    ] },
    { id: 'orthorhombic', tr: 'Ortorombik', en: 'Orthorhombic', lattices: [
      { id: 'oP', centering: 'P', examples: [
        { tr: 'Aragonit', en: 'Aragonite', formula: 'CaCO₃', sg: 'Pmcn', cell: orthorhombic(4.962, 7.968, 5.744) },
        { tr: 'Brookit', en: 'Brookite', formula: 'TiO₂', sg: 'Pbca', cell: orthorhombic(9.184, 5.447, 5.154) }
      ] },
      { id: 'oC', centering: 'C', examples: [
        { tr: 'Siyah fosfor', en: 'Black phosphorus', formula: 'P', sg: 'Cmca', cell: orthorhombic(3.310, 10.500, 4.380) },
        { tr: 'α-Uranyum', en: 'α-Uranium', formula: 'α-U', sg: 'Cmcm', cell: orthorhombic(2.854, 5.869, 4.955) }
      ] },
      { id: 'oI', centering: 'I', examples: [
        { tr: 'Sodyum nitrit', en: 'Sodium nitrite', formula: 'NaNO₂', sg: 'Im2m', cell: orthorhombic(3.570, 5.578, 5.390) },
        { tr: 'Lityum bakır vanadat', en: 'Lithium copper vanadate', formula: 'LiCuVO₄', sg: 'Imma', cell: orthorhombic(5.662, 5.809, 8.758) }
      ] },
      { id: 'oF', centering: 'F', examples: [
        { tr: 'Tenardit', en: 'Thenardite', formula: 'Na₂SO₄', sg: 'Fddd', cell: orthorhombic(5.857, 12.296, 9.809) },
        { tr: 'Gümüş sülfat', en: 'Silver sulfate', formula: 'Ag₂SO₄', sg: 'Fddd', cell: orthorhombic(5.817, 12.704, 10.269) }
      ] }
    ] },
    { id: 'hexagonal', tr: 'Hekzagonal', en: 'Hexagonal', lattices: [
      { id: 'hP', centering: 'P', examples: [
        { tr: 'Magnezyum', en: 'Magnesium', formula: 'Mg', sg: 'P6₃/mmc', cell: hexagonal(3.209, 5.211) },
        { tr: 'Vürtzit çinko oksit', en: 'Wurtzite zinc oxide', formula: 'ZnO', sg: 'P6₃mc', cell: hexagonal(3.249, 5.206) }
      ] }
    ] },
    { id: 'trigonal', tr: 'Trigonal (rombohedral)', en: 'Trigonal (rhombohedral)', lattices: [
      { id: 'hR', centering: 'R', examples: [
        { tr: 'Kalsit', en: 'Calcite', formula: 'CaCO₃', sg: 'R-3c', cell: hexagonal(4.989, 17.062) },
        { tr: 'Korindon', en: 'Corundum', formula: 'α-Al₂O₃', sg: 'R-3c', cell: hexagonal(4.759, 12.991) }
      ] }
    ] },
    { id: 'monoclinic', tr: 'Monoklinik', en: 'Monoclinic', lattices: [
      { id: 'mP', centering: 'P', examples: [
        { tr: 'Monoklinik zirkonya', en: 'Monoclinic zirconia', formula: 'ZrO₂', sg: 'P2₁/c', cell: monoclinic(5.145, 5.208, 5.311, 99.2) },
        { tr: 'VO₂ (M1)', en: 'VO₂ (M1)', formula: 'VO₂', sg: 'P2₁/c', cell: monoclinic(5.753, 4.526, 5.383, 122.61) }
      ] },
      { id: 'mC', centering: 'C', examples: [
        { tr: 'β-Galyum oksit', en: 'β-Gallium oxide', formula: 'β-Ga₂O₃', sg: 'C2/m', cell: monoclinic(12.230, 3.040, 5.800, 103.7) },
        { tr: 'Jips', en: 'Gypsum', formula: 'CaSO₄·2H₂O', sg: 'C2/c', cell: monoclinic(5.680, 15.200, 6.520, 118.43) }
      ] }
    ] },
    { id: 'triclinic', tr: 'Triklinik', en: 'Triclinic', lattices: [
      { id: 'aP', centering: 'P', examples: [
        { tr: 'Mikroklin', en: 'Microcline', formula: 'KAlSi₃O₈', sg: 'P-1', cell: C(8.578, 12.960, 7.211, 90.3, 115.97, 87.13) },
        { tr: 'Anortit', en: 'Anorthite', formula: 'CaAl₂Si₂O₈', sg: 'P1', cell: C(8.041, 12.748, 13.964, 92.2, 115.3, 92.7) }
      ] }
    ] }
  ];

  const rad = degrees => degrees * Math.PI / 180;
  const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  const cross = (a, b) => [
    a[1]*b[2] - a[2]*b[1],
    a[2]*b[0] - a[0]*b[2],
    a[0]*b[1] - a[1]*b[0]
  ];

  function reciprocalBasis(cell) {
    const [a, b, c, alpha, beta, gamma] = cell;
    const ca = Math.cos(rad(alpha)), cb = Math.cos(rad(beta));
    const cg = Math.cos(rad(gamma)), sg = Math.sin(rad(gamma));
    if (!(a > 0 && b > 0 && c > 0) || Math.abs(sg) < 1e-10) {
      throw new RangeError('Invalid unit-cell parameters');
    }
    const av = [a, 0, 0], bv = [b*cg, b*sg, 0];
    const cx = c*cb, cy = c*(ca - cb*cg)/sg;
    const cz2 = c*c - cx*cx - cy*cy;
    if (cz2 <= 0) throw new RangeError('Impossible unit-cell angles');
    const cv = [cx, cy, Math.sqrt(cz2)];
    const volume = dot(av, cross(bv, cv));
    return [cross(bv, cv), cross(cv, av), cross(av, bv)]
      .map(v => v.map(x => x / volume));
  }

  function dSpacing(cell, h, k, l) {
    if (!(h || k || l)) return Infinity;
    const [ra, rb, rc] = reciprocalBasis(cell);
    const q = ra.map((x, i) => h*x + k*rb[i] + l*rc[i]);
    return 1 / Math.sqrt(dot(q, q));
  }

  function allowedByCentering(centering, h, k, l) {
    if (centering === 'P') return true;
    if (centering === 'I') return (h + k + l) % 2 === 0;
    if (centering === 'F') return Math.abs(h) % 2 === Math.abs(k) % 2 && Math.abs(k) % 2 === Math.abs(l) % 2;
    if (centering === 'C') return (h + k) % 2 === 0;
    if (centering === 'R') return (-h + k + l) % 3 === 0;
    throw new RangeError('Unknown centering: ' + centering);
  }

  function firstNonzeroPositive(h, k, l) {
    return (h || k || l) > 0;
  }

  function reflectionLabel(h, k, l) {
    return '(' + [h, k, l].join(' ') + ')';
  }

  function powderLines(cell, centering, count = MAX_LINES) {
    const [ra, rb, rc] = reciprocalBasis(cell);
    const peaks = [];
    for (let h = -6; h <= 6; h++) {
      for (let k = -6; k <= 6; k++) {
        for (let l = -6; l <= 6; l++) {
          if (!firstNonzeroPositive(h, k, l) || !allowedByCentering(centering, h, k, l)) continue;
          const q = ra.map((x, i) => h*x + k*rb[i] + l*rc[i]);
          const sinTheta = LAMBDA * Math.sqrt(dot(q, q)) / 2;
          if (!(sinTheta > 0 && sinTheta < 1)) continue;
          const twoTheta = 2 * Math.asin(sinTheta) * 180 / Math.PI;
          if (twoTheta < MIN_TWO_THETA || twoTheta > MAX_TWO_THETA) continue;
          peaks.push({ h, k, l, twoTheta });
        }
      }
    }
    peaks.sort((a, b) => a.twoTheta - b.twoTheta);
    const grouped = [];
    for (const peak of peaks) {
      const last = grouped[grouped.length - 1];
      if (last && Math.abs(last.twoTheta - peak.twoTheta) < 0.065) {
        // The same Bragg angle may represent several symmetrically related hkl.
        const score = p => [p.h, p.k, p.l].filter(v => v < 0).length * 100
          + Math.abs(p.h)*3 + Math.abs(p.k)*2 + Math.abs(p.l);
        if (score(peak) < score(last)) Object.assign(last, peak);
      } else {
        grouped.push({ ...peak });
      }
    }
    return grouped.slice(0, count);
  }

  const esc = value => String(value).replace(/[&<>"']/g, ch =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[ch]);

  // Stable IDs and colors: filtering never changes an example's color.
  const SAMPLES = ATLAS.flatMap(system => system.lattices.flatMap(lattice =>
    lattice.examples.map((example, i) => ({
      id: lattice.id + '-' + i, system, lattice, example
    }))
  ));
  const DEFAULT_IDS = ['cI-0', 'cF-0', 'tP-0', 'tI-0'];
  const selected = new Set(DEFAULT_IDS);
  let mode = 'rows';
  let filtersVisible = true;

  function referenceSvg(samples, english, displayMode) {
    const W = 970, left = 142, right = 20, xWidth = W - left - right;
    const top = 24, rowHeight = 32;
    const plotHeight = displayMode === 'overlay' ? 100 : samples.length * rowHeight;
    const H = top + plotHeight + 35;
    const x = angle => left + xWidth * (angle - MIN_TWO_THETA) / (MAX_TWO_THETA - MIN_TWO_THETA);
    const xText = angle => x(angle).toFixed(2);
    const plotBottom = top + plotHeight;
    let svg = '<svg class="bp-chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
      W + ' ' + H + '" role="img" aria-label="' +
      esc(english ? 'Comparison of selected Bravais-allowed diffraction lines versus 2 theta' :
        'Seçilen Bravais izinli kırınım çizgilerinin ortak 2θ ekseninde karşılaştırması') + '">' +
      '<rect class="bp-chart-bg" x="' + left + '" y="' + top + '" width="' + xWidth +
        '" height="' + plotHeight + '"/>';

    // All traces always share precisely the same 10°–110° 2θ axis.
    for (let degree = MIN_TWO_THETA; degree <= MAX_TWO_THETA; degree += 10) {
      const xx = xText(degree);
      svg += '<line class="bp-chart-grid" x1="' + xx + '" x2="' + xx + '" y1="' +
        top + '" y2="' + plotBottom + '"/>' +
        '<text class="bp-chart-tick" x="' + xx + '" y="' + (plotBottom + 19) +
        '" text-anchor="middle">' + degree + '°</text>';
    }
    svg += '<text class="bp-chart-axis-title" x="' + (W-right) + '" y="' + (H-4) +
      '" text-anchor="end">2θ · Cu Kα₁</text>';

    samples.forEach((sample, i) => {
      const className = 'bp-color-' + (SAMPLES.indexOf(sample) % 8);
      const title = (english ? sample.example.en : sample.example.tr) + ' · ' +
        sample.example.formula + ' · ' + sample.lattice.id;
      const lines = powderLines(sample.example.cell, sample.lattice.centering);
      if (displayMode === 'rows') {
        const baseline = top + (i+1)*rowHeight - 5;
        svg += '<g class="bp-series ' + className + '"><text class="bp-chart-label" x="' +
          (left-11) + '" y="' + (baseline-7) + '" text-anchor="end">' +
          esc(sample.example.formula + ' · ' + sample.lattice.id) + '</text>' +
          '<title>' + esc(title) + '</title>' +
          '<line class="bp-chart-base" x1="' + left + '" x2="' + (left+xWidth) +
          '" y1="' + baseline + '" y2="' + baseline + '"/>';
        lines.forEach(p => {
          const xx = xText(p.twoTheta);
          svg += '<line class="bp-chart-peak" x1="' + xx + '" x2="' + xx +
            '" y1="' + (baseline-22) + '" y2="' + (baseline-1) + '"><title>' +
            esc(title + ' · ' + reflectionLabel(p.h,p.k,p.l) + ' · 2θ ' +
              p.twoTheta.toFixed(2) + '°') + '</title></line>';
        });
        svg += '</g>';
      } else {
        // Overlay: same angular positions, colored traces (no artificial x offset).
        const baseline = plotBottom - 7;
        svg += '<g class="bp-series bp-overlay-series ' + className + '">' +
          '<title>' + esc(title) + '</title>';
        lines.forEach(p => {
          const xx = xText(p.twoTheta);
          svg += '<line class="bp-chart-peak" x1="' + xx + '" x2="' + xx +
            '" y1="' + (top + 8 + (i % 8)*2) + '" y2="' + baseline +
            '"><title>' + esc(title + ' · ' + reflectionLabel(p.h,p.k,p.l) +
              ' · 2θ ' + p.twoTheta.toFixed(2) + '°') + '</title></line>';
        });
        svg += '</g>';
      }
    });
    svg += '</svg>';
    return svg;
  }

  function render() {
    const host = typeof document !== 'undefined' && document.getElementById('bravaisPowderAtlas');
    if (!host) return;
    const english = document.documentElement.lang.toLowerCase().startsWith('en');
    const active = SAMPLES.filter(sample => selected.has(sample.id));
    const t = (tr, en) => english ? en : tr;
    let html = '<section class="bp-compare" aria-label="' +
      esc(t('Bravais örgülerinin kırınım çizgilerini karşılaştır',
        'Compare Bravais diffraction lines')) + '">' +
      '<header class="bp-compare-head"><div><h3>' +
      t('Kırınım çizgilerini karşılaştır', 'Compare diffraction lines') + '</h3>' +
      '<p>' + t('Malzemeleri seçin; çizgi konumlarını ortak 2θ ekseninde karşılaştırın.',
        'Select materials and compare their reflections on the same 2θ axis.') +
      '</p></div><span class="bp-count" aria-live="polite">' + active.length + '/' + SAMPLES.length +
      ' ' + t('seçili', 'selected') + '</span></header>' +
      '<div class="bp-toolbar" role="group" aria-label="' +
        esc(t('Karşılaştırma görünümü', 'Comparison display')) + '">' +
      '<button type="button" class="bp-view" data-bp-action="rows" aria-pressed="' +
        (mode === 'rows') + '">' + t('Satır satır', 'Separate rows') + '</button>' +
      '<button type="button" class="bp-view" data-bp-action="overlay" aria-pressed="' +
        (mode === 'overlay') + '">' + t('Üst üste', 'Overlay') + '</button>' +
      '<span class="bp-toolbar-spacer"></span>' +
      '<button type="button" class="bp-subtle" data-bp-action="default">' +
        t('Örnek 4', 'Default four') + '</button>' +
      '<button type="button" class="bp-subtle" data-bp-action="clear">' +
        t('Tümünü gizle', 'Hide all') + '</button></div>';

    if (active.length) {
      html += '<div class="bp-chart-viewport">' + referenceSvg(active, english, mode) + '</div>';
      if (mode === 'overlay') {
        html += '<div class="bp-legend" aria-label="' +
          esc(t('Seçili grafikler', 'Selected traces')) + '">';
        active.forEach(sample => {
          html += '<span class="bp-legend-item bp-color-' + (SAMPLES.indexOf(sample)%8) +
            '"><span class="bp-legend-dot" aria-hidden="true"></span>' +
            esc(sample.example.formula + ' · ' + sample.lattice.id) + '</span>';
        });
        html += '</div>';
      }
    } else {
      html += '<p class="bp-empty" role="status">' +
        t('Grafik boş. Alttaki filtrelerden karşılaştırmak istediğiniz malzemeleri seçin.',
          'The chart is empty. Choose materials below to compare them.') + '</p>';
    }

    html += '<div class="bp-filter-head"><strong>' +
      t('Malzeme filtreleri', 'Material filters') + '</strong>' +
      '<button type="button" class="bp-subtle" data-bp-action="filters" aria-expanded="' +
      filtersVisible + '">' + (filtersVisible ?
        t('Filtreleri gizle', 'Hide filters') : t('Filtreleri göster', 'Show filters')) +
      '</button></div>';

    if (filtersVisible) {
      html += '<div class="bp-filter-list" aria-label="' +
        esc(t('Malzeme seçimi', 'Material selection')) + '">';
      ATLAS.forEach(system => {
        html += '<div class="bp-filter-group"><div class="bp-filter-system">' +
          esc(english ? system.en : system.tr) + '</div><div class="bp-chip-row">';
        system.lattices.forEach(lattice => {
          lattice.examples.forEach((example, i) => {
            const id = lattice.id + '-' + i;
            const active = selected.has(id);
            const sample = SAMPLES.find(s => s.id === id);
            html += '<button type="button" class="bp-chip bp-color-' +
              (SAMPLES.indexOf(sample)%8) + '" data-bp-id="' + id + '" aria-pressed="' +
              active + '" title="' + esc((english ? example.en : example.tr) +
                ' · ' + example.sg) + '"><span class="bp-chip-marker" aria-hidden="true"></span>' +
              esc(example.formula + ' · ' + lattice.id) + '</button>';
          });
        });
        html += '</div></div>';
      });
      html += '</div>';
    }
    html += '<details class="bp-science"><summary>' +
      t('Hesaplama ve bilimsel sınırlar', 'Calculation and scientific limits') +
      '</summary><p>' +
      t('Cu Kα₁ (λ = 1,5406 Å) için 10°–110° aralığındaki ilk 18 farklı Bravais-izinli çizgi hesaplanır. Yalnızca örgü merkezlemesi uygulanır; atomik baz, yapı faktörü, vida/kayma sönümleri, pik şiddetleri ve cihaz etkileri dahil değildir. Bunlar ölçülmüş XRD desenleri değildir.',
        'The first 18 distinct Bravais-allowed lines in 10°–110° are calculated for Cu Kα₁ (λ = 1.5406 Å). Only lattice centering is applied; atomic bases, structure factors, screw/glide absences, intensities and instrumental effects are omitted. These are not measured XRD patterns.') +
      '</p></details></section>';
    host.innerHTML = html;
  }

  function onClick(event) {
    const control = event.target.closest('button[data-bp-action],button[data-bp-id]');
    if (!control) return;
    if (control.hasAttribute('data-bp-id')) {
      const id = control.getAttribute('data-bp-id');
      if (!SAMPLES.some(sample => sample.id === id)) return;
      if (selected.has(id)) selected.delete(id);
      else selected.add(id);
    } else {
      const action = control.getAttribute('data-bp-action');
      if (action === 'rows' || action === 'overlay') mode = action;
      else if (action === 'default') { selected.clear(); DEFAULT_IDS.forEach(id => selected.add(id)); }
      else if (action === 'clear') selected.clear();
      else if (action === 'filters') filtersVisible = !filtersVisible;
      else return;
    }
    render();
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = { ATLAS, LAMBDA, reciprocalBasis, dSpacing, allowedByCentering,
      powderLines, SAMPLES, DEFAULT_IDS, referenceSvg };
  }
  if (typeof document === 'undefined') return;
  function init() {
    const host = document.getElementById('bravaisPowderAtlas');
    if (!host) return;
    host.addEventListener('click', onClick);
    render();
    new MutationObserver(changes => {
      if (changes.some(change => change.attributeName === 'lang')) render();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})(typeof globalThis !== 'undefined' ? globalThis : this);
