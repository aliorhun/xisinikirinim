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

  function filmSvg(lines, name, english) {
    const left = 31, width = 795, top = 10, height = 30;
    const x = angle => left + width * (angle - MIN_TWO_THETA) / (MAX_TWO_THETA - MIN_TWO_THETA);
    let svg = '<svg class="bp-film" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 860 106" role="img" aria-label="' +
      esc(name + (english ? ': ideal Bravais reflections by 2θ' : ': 2θ konumlarına göre ideal Bravais çizgileri')) + '">';
    svg += '<rect class="bp-film-frame" x="' + left + '" y="' + top + '" width="' + width + '" height="' + height + '"/>';
    let lastLabelX = -100;
    lines.forEach(line => {
      const px = x(line.twoTheta);
      const label = reflectionLabel(line.h, line.k, line.l);
      svg += '<line class="bp-film-line" x1="' + px.toFixed(2) + '" x2="' + px.toFixed(2) +
        '" y1="' + (top + 1) + '" y2="' + (top + height - 1) + '"><title>' + esc(label) + ' · 2θ = ' +
        line.twoTheta.toFixed(2) + '°</title></line>';
      if (px - lastLabelX >= 12) {
        svg += '<text class="bp-film-hkl" x="' + px.toFixed(2) + '" y="45" transform="rotate(90 ' +
          px.toFixed(2) + ' 45)">' + esc(label.replaceAll(' ', '')) + '</text>';
        lastLabelX = px;
      }
    });
    for (const degree of [20, 40, 60, 80, 100]) {
      const px = x(degree).toFixed(2);
      svg += '<path class="bp-film-tick" d="M' + px + ' 89v4"/>' +
        '<text class="bp-film-axis" x="' + px + '" y="104" text-anchor="middle">' + degree + '°</text>';
    }
    svg += '<text class="bp-film-axis-title" x="' + left + '" y="104" text-anchor="start">2θ</text></svg>';
    return svg;
  }

  function formatCell(cell, english) {
    const [a, b, c, alpha, beta, gamma] = cell;
    const parts = ['a=' + a.toFixed(3), 'b=' + b.toFixed(3), 'c=' + c.toFixed(3)];
    if (Math.abs(alpha - 90) > 0.01) parts.push('α=' + alpha.toFixed(2) + '°');
    if (Math.abs(beta - 90) > 0.01) parts.push('β=' + beta.toFixed(2) + '°');
    if (Math.abs(gamma - 90) > 0.01) parts.push('γ=' + gamma.toFixed(2) + '°');
    return parts.join(' · ') + (english ? ' (Å)' : ' (Å)');
  }

  function render() {
    const host = typeof document !== 'undefined' && document.getElementById('bravaisPowderAtlas');
    if (!host) return;
    const english = document.documentElement.lang.toLowerCase().startsWith('en');
    let html = '<section aria-label="' + (english ? 'Reference diffraction lines for 14 Bravais lattices' : '14 Bravais örgüsü için örnek toz kırınım çizgileri') + '">' +
      '<div class="bp-intro"><h3>' + (english ? 'Reference line diagrams for 14 Bravais lattices' : '14 Bravais örgüsü: örnek 2θ çizgi şemaları') + '</h3>' +
      '<p>' + (english
        ? 'Two material examples for each Bravais lattice, stacked vertically. Line positions use Bragg’s law and approximate conventional-cell dimensions.'
        : 'Her Bravais örgüsü için iki farklı malzemenin çizgileri alt alta gösterilir. Konumlar Bragg yasası ve yaklaşık geleneksel hücre parametreleriyle hesaplanır.') +
      '</p><p class="bp-note"><strong>' + (english ? 'Important scientific limit:' : 'Önemli bilimsel sınır:') + '</strong> ' +
      (english
        ? 'These are the first 18 distinct Bravais-allowed lines in 10°–110°, using Cu Kα₁ (λ = 1.5406 Å). Atomic bases, screw/glide absences, structure factors, intensities and instrumental broadening are not included; these are not measured or complete simulated XRD patterns.'
        : 'Cu Kα₁ (λ = 1,5406 Å) için 10°–110° aralığındaki ilk 18 farklı Bravais-izinli çizgi gösterilir. Atomik baz, vida/kayma simetrisi sönümleri, yapı faktörü, şiddet ve cihaz genişlemesi hesaba katılmaz; bunlar ölçülmüş veya tam simüle edilmiş XRD desenleri değildir.') +
      '</p></div>';
    ATLAS.forEach(system => {
      html += '<section class="bp-system" data-crystal-system="' + system.id + '"><h4>' +
        esc(english ? system.en : system.tr) + '</h4>';
      system.lattices.forEach(lattice => {
        html += '<div class="bp-lattice"><h5>' + lattice.id + ' <span>' +
          esc(english ? 'centering: ' : 'merkezleme: ') + lattice.centering + '</span></h5>';
        lattice.examples.forEach(example => {
          const name = (english ? example.en : example.tr) + ' · ' + example.formula;
          const lines = powderLines(example.cell, lattice.centering);
          const details = lines.map(p => '<span>' + esc(reflectionLabel(p.h, p.k, p.l)) +
            ' = ' + p.twoTheta.toFixed(2) + '°</span>').join('');
          html += '<article class="bp-material"><div class="bp-material-head"><strong>' +
            esc(english ? example.en : example.tr) + ' <span>' + esc(example.formula) +
            '</span></strong><small>' + esc(example.sg) + ' · ' +
            esc(formatCell(example.cell, english)) + '</small></div>' +
            '<div class="bp-film-scroll">' + filmSvg(lines, name, english) + '</div>' +
            '<details><summary>' + (english ? 'hkl and 2θ values (' : 'hkl ve 2θ değerleri (') +
            lines.length + ')</summary><div class="bp-peak-list">' + details + '</div></details></article>';
        });
        html += '</div>';
      });
      html += '</section>';
    });
    html += '</section>';
    host.innerHTML = html;
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = { ATLAS, LAMBDA, reciprocalBasis, dSpacing, allowedByCentering, powderLines };
  }
  if (typeof document === 'undefined') return;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render, { once: true });
  else render();
  new MutationObserver(changes => {
    if (changes.some(change => change.attributeName === 'lang')) render();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})(typeof globalThis !== 'undefined' ? globalThis : this);
