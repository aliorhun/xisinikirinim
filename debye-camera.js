(function (root) {
  'use strict';

  // Ideal, kinematic camera geometry; intensities below are illustrative only.
  const SAMPLES = {
    cu: { name: 'Cu (FCC)', a: 3.615, lines: [
      { hkl: '111', n: 3, weight: 1 }, { hkl: '200', n: 4, weight: .52 },
      { hkl: '220', n: 8, weight: .34 }, { hkl: '311', n: 11, weight: .28 },
      { hkl: '222', n: 12, weight: .12 }, { hkl: '400', n: 16, weight: .1 }
    ] },
    si: { name: 'Si (diamond)', a: 5.431, lines: [
      { hkl: '111', n: 3, weight: 1 }, { hkl: '220', n: 8, weight: .65 },
      { hkl: '311', n: 11, weight: .42 }, { hkl: '400', n: 16, weight: .24 },
      { hkl: '331', n: 19, weight: .19 }, { hkl: '422', n: 24, weight: .15 }
    ] }
  };
  const SOURCES = {
    Cu: { alpha: 1.5418, beta: 1.39217, filter: 'Ni' },
    Mo: { alpha: .7107, beta: .63225, filter: 'Zr' }
  };
  function reflection(a, n, wavelength, diameter) {
    if (!(a > 0 && n > 0 && wavelength > 0 && diameter > 0)) return null;
    const d = a / Math.sqrt(n);
    const s = wavelength / (2 * d);
    if (s > 1) return null; // inaccessible reflection, not an angle to be clipped
    const twoThetaRad = 2 * Math.asin(s);
    return {
      d,
      twoThetaDeg: twoThetaRad * 180 / Math.PI,
      arcMm: diameter * twoThetaRad / 2,
      // Unwrapped film is cut at the direct-beam exit. ±s are the two branches.
      filmPositionsMm: [-diameter * twoThetaRad / 2, diameter * twoThetaRad / 2]
    };
  }
  function linesFor(sample, source, diameter, filtered) {
    const material = SAMPLES[sample], radiation = SOURCES[source];
    if (!material || !radiation) return [];
    return material.lines.flatMap(line => {
      const main = reflection(material.a, line.n, radiation.alpha, diameter);
      if (!main) return [];
      const result = [{ ...main, hkl: line.hkl, weight: line.weight, kind: 'alpha' }];
      if (!filtered) {
        const beta = reflection(material.a, line.n, radiation.beta, diameter);
        if (beta) result.push({ ...beta, hkl: line.hkl, weight: line.weight * .20, kind: 'beta' });
      }
      return result;
    });
  }
  const physics = { reflection, linesFor, SAMPLES, SOURCES };
  if (typeof module !== 'undefined' && module.exports) module.exports = physics;
  root.XRDDebyeCamera = physics;

  if (typeof document === 'undefined') return;
  const lab = document.getElementById('debyeCameraLab');
  if (!lab) return;

  const tr = document.documentElement.lang !== 'en';
  const t = (turkish, english) => tr ? turkish : english;
  const el = id => lab.querySelector('#' + id);
  const sample = el('dcSample'), source = el('dcSource'), diameter = el('dcDiameter');
  const filter = el('dcFilter'), rotating = el('dcRotation'), chosen = el('dcReflection');
  const display = el('dcReadout'), note = el('dcInterpretation');
  const cameraCanvas = el('dcCamera'), filmCanvas = el('dcFilm');

  function setChoices() {
    const previous = chosen.value;
    chosen.replaceChildren();
    for (const line of SAMPLES[sample.value].lines) {
      const option = document.createElement('option');
      option.value = line.hkl;
      option.textContent = '(' + line.hkl + ')';
      chosen.append(option);
    }
    chosen.value = SAMPLES[sample.value].lines.some(x => x.hkl === previous) ? previous : '111';
  }
  function canvasContext(canvas, height) {
    const width = Math.max(280, Math.round(canvas.getBoundingClientRect().width || 450));
    const dpr = Math.min(root.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, width, height };
  }
  function drawCamera(selected, all) {
    const view = canvasContext(cameraCanvas, 270);
    if (!view) return;
    const { ctx, width: w, height: h } = view;
    const ink = getComputedStyle(lab).getPropertyValue('--ink').trim() || '#233141';
    const muted = getComputedStyle(lab).getPropertyValue('--muted').trim() || '#64748b';
    const cx = w * .52, cy = h * .53, radius = Math.min(94, w * .30);
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = muted; ctx.lineWidth = 8; ctx.globalAlpha = .40;
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, 2 * Math.PI); ctx.stroke(); ctx.globalAlpha = 1;
    ctx.setLineDash([4, 5]); ctx.lineWidth = 1; ctx.strokeStyle = muted;
    ctx.beginPath(); ctx.arc(cx, cy, radius - 6, 0, 2 * Math.PI); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#c57e39'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(cx - radius - 38, cy); ctx.lineTo(cx - 7, cy); ctx.stroke();
    ctx.fillStyle = '#c57e39'; ctx.beginPath();
    ctx.moveTo(cx - 7, cy); ctx.lineTo(cx - 16, cy - 5); ctx.lineTo(cx - 16, cy + 5); ctx.fill();
    ctx.strokeStyle = muted; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + radius, cy); ctx.stroke(); ctx.setLineDash([]);

    const alpha = selected.twoThetaDeg * Math.PI / 180;
    for (const sign of [-1, 1]) {
      const x = cx + radius * Math.cos(alpha), y = cy + sign * radius * Math.sin(alpha);
      ctx.strokeStyle = '#278c91'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = '#c57e39'; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ink; ctx.font = '12px system-ui';
    ctx.fillText(t('Numune', 'Sample'), cx - 22, cy + 21);
    ctx.fillText(t('Kolimatör', 'Collimator'), Math.max(8, cx - radius - 68), cy - 14);
    ctx.fillText(t('Film', 'Film'), cx + radius * .55, cy - radius * .78);
    ctx.fillText('2θ = ' + selected.twoThetaDeg.toFixed(2) + '°', 14, h - 17);
    ctx.fillStyle = muted; ctx.font = '11px system-ui';
    ctx.fillText(t('Üstten şematik kesit', 'Schematic top view'), 14, 19);
  }
  function drawFilm(all, diameterMm, selectedHkl, rotatingSample) {
    const view = canvasContext(filmCanvas, 230);
    if (!view) return;
    const { ctx, width: w, height: h } = view;
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, maxArc = Math.PI * 114.6 / 2, scale = (w - 32) / (2 * maxArc);
    const halfFilm = Math.PI * diameterMm / 2 * scale;
    const filmTop = 36, filmHeight = 136;
    ctx.fillStyle = '#0c1622'; ctx.fillRect(cx - halfFilm, filmTop, 2 * halfFilm, filmHeight);
    ctx.strokeStyle = '#93a5b8'; ctx.lineWidth = 1;
    ctx.strokeRect(cx - halfFilm, filmTop, 2 * halfFilm, filmHeight);
    // Film is unrolled at the forward-beam exit: the central gap is the beam stop.
    ctx.fillStyle = '#8093a6'; ctx.fillRect(cx - 2, filmTop, 4, filmHeight);
    for (const line of all) {
      const isSelected = line.hkl === selectedHkl && line.kind === 'alpha';
      const opacity = line.kind === 'beta' ? .36 : (isSelected ? .94 : .48);
      const color = isSelected ? '224,162,96' : '155,221,225';
      ctx.strokeStyle = 'rgba(' + color + ',' + opacity + ')';
      ctx.lineWidth = isSelected ? 3 : (line.kind === 'beta' ? 1 : 2);
      for (const side of [-1, 1]) {
        const x = cx + side * line.arcMm * scale;
        if (rotatingSample) {
          ctx.beginPath(); ctx.moveTo(x, filmTop + 3); ctx.lineTo(x, filmTop + filmHeight - 3); ctx.stroke();
        } else {
          // Spotty line is a qualitative depiction of insufficient crystallite averaging.
          for (let y = filmTop + 5; y < filmTop + filmHeight - 3; y += 17) {
            const offset = 2 * Math.sin(y * .25 + line.n);
            ctx.beginPath(); ctx.moveTo(x + offset, y); ctx.lineTo(x + offset, y + 4); ctx.stroke();
          }
        }
      }
    }
    const ink = getComputedStyle(lab).getPropertyValue('--ink').trim() || '#233141';
    const muted = getComputedStyle(lab).getPropertyValue('--muted').trim() || '#64748b';
    ctx.fillStyle = ink; ctx.font = '12px system-ui';
    ctx.fillText(t('Açılmış silindirik film', 'Unrolled cylindrical film'), 10, 17);
    ctx.fillStyle = muted; ctx.font = '11px system-ui';
    ctx.fillText(t('Doğrudan demet', 'Direct beam'), Math.max(8, cx - 48), h - 42);
    ctx.textAlign = 'center';
    ctx.fillText('0', cx, h - 18);
    ctx.fillText('−' + (Math.PI * diameterMm / 2).toFixed(1) + ' mm', cx - halfFilm, h - 18);
    ctx.fillText('+' + (Math.PI * diameterMm / 2).toFixed(1) + ' mm', cx + halfFilm, h - 18);
    ctx.textAlign = 'start';
  }
  function update() {
    const dia = Number(diameter.value);
    const material = SAMPLES[sample.value], radiation = SOURCES[source.value];
    filter.nextElementSibling.textContent = t(radiation.filter + ' filtresi (Kβ bastırma)', radiation.filter + ' filter (suppress Kβ)');
    const all = linesFor(sample.value, source.value, dia, filter.checked);
    const selected = all.find(x => x.hkl === chosen.value && x.kind === 'alpha');
    if (!selected) return;
    display.innerHTML = '<div><small>d<sub>hkl</sub></small><strong>' + selected.d.toFixed(4) + ' Å</strong></div>' +
      '<div><small>2θ</small><strong>' + selected.twoThetaDeg.toFixed(2) + '°</strong></div>' +
      '<div><small>s = R × 2θ</small><strong>' + selected.arcMm.toFixed(2) + ' mm</strong></div>' +
      '<div><small>R</small><strong>' + (dia / 2).toFixed(2) + ' mm</strong></div>';
    note.textContent = t(
      'Seçili (' + chosen.value + ') yansıması filmin iki yanında doğrudan demet referansından ±' + selected.arcMm.toFixed(2).replace('.', ',') + ' mm uzaklıkta görülür. Film, demet çıkışından açılmıştır. ' +
      (rotating.checked ? 'Dönen numune daha sürekli çizgiler elde etmeye yardımcı olur.' : 'Döndürme kapalı: az sayıdaki kristalitin benekli çizgi etkisi kavramsal olarak gösterilir.') +
      (!filter.checked ? ' Kβ nedeniyle ek, daha küçük açılı zayıf çizgiler eklenmiştir.' : ''),
      'The (' + chosen.value + ') reflection appears at ±' + selected.arcMm.toFixed(2) + ' mm from the direct-beam reference on the unrolled film. ' +
      (rotating.checked ? 'Sample rotation helps produce continuous lines.' : 'With rotation off, spotty lines qualitatively illustrate limited crystallite averaging.') +
      (!filter.checked ? ' Additional weak Kβ lines appear at lower angles.' : '')
    );
    drawCamera(selected, all);
    drawFilm(all, dia, chosen.value, rotating.checked);
  }
  sample.addEventListener('change', () => { setChoices(); update(); });
  for (const item of [source, diameter, filter, rotating, chosen]) {
    item.addEventListener('change', update);
    if (item.tagName === 'INPUT') item.addEventListener('input', update);
  }
  const tab = document.querySelector('[data-sub="s3camera"]');
  if (tab) tab.addEventListener('click', () => root.requestAnimationFrame(update));
  root.addEventListener('resize', update, { passive: true });
  setChoices(); update();
})(typeof globalThis !== 'undefined' ? globalThis : this);
