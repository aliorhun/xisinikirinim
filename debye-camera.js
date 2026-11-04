(function (root) {
  'use strict';

  // Ideal, kinematic camera geometry; intensities below are illustrative only.
  // Representative room-temperature lattice constants (Å) and symmetry-allowed
  // reflections. Intensities are illustrative: this is a geometry teaching model.
  const FCC = ['111','200','220','311','222','400','331','420','422','333','440'];
  const BCC = ['110','200','211','220','310','222','321','400','330','420','332'];
  const DIAMOND = ['111','220','311','400','331','422','333','440','531','620'];
  const ROCKSALT = FCC;
  function makeSample(name, a, structure, reflections, notes, containsFe) {
    return { name, a, structure, notes, containsFe: !!containsFe,
      lines: reflections.map((hkl, i) => ({
        hkl, n: [...hkl].reduce((sum, digit) => sum + Number(digit) ** 2, 0),
        weight: Math.max(.07, Math.exp(-.34 * i))
      }))
    };
  }
  const SAMPLES = {
    cu: makeSample('Cu', 3.615, 'FCC', FCC,
      ['YMK metallerde yalnız bütün indisleri tek veya bütün indisleri çift yansımalar izinlidir.',
       'FCC metals allow reflections with all-odd or all-even indices.']),
    al: makeSample('Al', 4.050, 'FCC', FCC,
      ['Alüminyum: daha büyük a sayesinde aynı (hkl) yansımaları daha küçük açılara gelir; referans malzeme örneği.',
       'Aluminium: its larger a moves the same (hkl) reflections to lower angles; a useful reference example.']),
    ni: makeSample('Ni', 3.524, 'FCC', FCC,
      ['Nikel YMK yapısı sayesinde Cu/Al ile karşılaştırılabilir; örgü aralığı daha küçüktür.',
       'Nickel has the same FCC selection rules as Cu/Al but a smaller lattice spacing.']),
    fe: makeSample('α-Fe', 2.867, 'BCC', BCC,
      ['Ferrit HMK örneğidir: h + k + l çift olmalıdır. Cu Kα ile Fe floresansı arka plan oluşturabilir; Co Kα karşılaştırın.',
       'Ferritic iron is BCC: h + k + l must be even. Cu Kα may excite Fe fluorescence; compare Co Kα.'], true),
    w: makeSample('W', 3.165, 'BCC', BCC,
      ['Tungsten HMK örneğidir. Yüksek soğurma ve yoğunluk gerçek numune hazırlamada önemlidir.',
       'Tungsten is BCC. Its high absorption and density matter for real specimen preparation.']),
    cr: makeSample('Cr', 2.885, 'BCC', BCC,
      ['Krom HMK örneğidir; ışınım seçerken numunenin içerdiği elementleri dikkate alın.',
       'Chromium provides another BCC example; consider sample chemistry when choosing radiation.']),
    si: makeSample('Si', 5.431, 'diamond', DIAMOND,
      ['Elmas-kübik yapıda YMK kuralına ek olarak bütün-çift ve h + k + l = 4n + 2 yansımaları söner (örn. 200).',
       'Diamond cubic adds extinctions to FCC: all-even reflections with h + k + l = 4n + 2 vanish (e.g. 200).']),
    ge: makeSample('Ge', 5.658, 'diamond', DIAMOND,
      ['Germanyum, Si ile aynı elmas-kübik yansıma kurallarına fakat daha büyük örgü sabitine sahiptir.',
       'Germanium has the same diamond-cubic reflection rules as Si but a larger lattice parameter.']),
    nacl: makeSample('NaCl', 5.640, 'rocksalt', ROCKSALT,
      ['Kaya tuzu yapısı YMK Bravais örgüsüne iki atomlu baz ekler; bütün-tek yansımalar izinlidir ama bazıları zayıf olabilir.',
       'Rock-salt has an FCC Bravais lattice and a two-atom basis; all-odd lines are allowed but may be weak.']),
    mgo: makeSample('MgO', 4.212, 'rocksalt', ROCKSALT,
      ['MgO, NaCl ile aynı kaya tuzu yapısındadır; farklı atomik saçılmalar bağıl şiddetleri değiştirir.',
       'MgO shares the rock-salt structure with NaCl; different atomic scattering changes relative intensities.'])
  };
  const SOURCES = {
    Cu: { alpha: 1.5418, beta: 1.39217, filter: 'Ni' },
    Mo: { alpha: .7107, beta: .63225, filter: 'Zr' },
    Co: { alpha: 1.7902, beta: 1.62073, filter: 'Fe' },
    Cr: { alpha: 2.2909, beta: 2.08479, filter: 'V' },
    Fe: { alpha: 1.9373, beta: 1.75654, filter: 'Mn' }
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
  // Representative K absorption edges (keV), used only as a qualitative
  // fluorescence warning, never as an absorption/intensity calculation.
  const K_EDGES = { cu: 8.979, ni: 8.333, fe: 7.112, cr: 5.989, ge: 11.103 };
  function selectionFacts(sample, source, diameter, hkl) {
    const material = SAMPLES[sample], radiation = SOURCES[source];
    if (!material || !radiation || !(diameter > 0)) return null;
    const available = linesFor(sample, source, diameter, true);
    const selected = available.find(x => x.hkl === hkl) || null;
    const nearby = selected ? Math.min(Infinity, ...available
      .filter(x => x.hkl !== selected.hkl)
      .map(x => Math.abs(x.twoThetaDeg - selected.twoThetaDeg))) : null;
    const energyKeV = 12.39842 / radiation.alpha;
    const edgeKeV = K_EDGES[sample] || null;
    return {
      energyKeV,
      edgeKeV,
      mayExciteKFluorescence: edgeKeV !== null && energyKeV > edgeKeV,
      available: available.length,
      total: material.lines.length,
      unavailable: material.lines.length - available.length,
      selected,
      nearestDeg: Number.isFinite(nearby) ? nearby : null,
      mmPerDegree: diameter * Math.PI / 360,
      // Kα energy for Cu/Mo exceeds the Fe K edge (7.112 keV).
      feFluorescenceWarning: material.containsFe && (source === 'Cu' || source === 'Mo')
    };
  }
  const physics = { reflection, linesFor, selectionFacts, SAMPLES, SOURCES };
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

  const advice = el('dcSelectionAdvice');
  const adviceTabs = [...advice.querySelectorAll('[role="tab"]')];
  const advicePanel = el('dcAdvicePanel');
  const adviceHeading = el('dcAdviceHeading');
  const adviceDescription = el('dcAdviceDescription');
  let activeAdviceIndex = 0;
  let adviceData = [];

  function showAdvice(index, moveFocus = false) {
    if (index < 0 || index >= adviceTabs.length) return;
    activeAdviceIndex = index;
    adviceTabs.forEach((tab, i) => {
      const selected = i === activeAdviceIndex;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    advicePanel.setAttribute('aria-labelledby', adviceTabs[index].id);
    if (adviceData[index]) {
      adviceHeading.textContent = adviceData[index][0];
      adviceDescription.textContent = adviceData[index][1];
    }
    if (moveFocus) adviceTabs[index].focus();
  }

  adviceTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => showAdvice(index));
    tab.addEventListener('keydown', event => {
      let next = null;
      if (event.key === 'ArrowRight') next = (index + 1) % adviceTabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + adviceTabs.length) % adviceTabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = adviceTabs.length - 1;
      if (next !== null) {
        event.preventDefault();
        showAdvice(next, true);
      }
    });
  });
  function setChoices() {
    const previous = chosen.value;
    chosen.replaceChildren();
    const sampleData = SAMPLES[sample.value];
    const radiation = SOURCES[source.value];
    for (const line of sampleData.lines) {
      const r = reflection(sampleData.a, line.n, radiation.alpha, Number(diameter.value));
      const option = document.createElement('option');
      option.value = line.hkl;
      option.disabled = !r;
      option.textContent = '(' + line.hkl + ') — ' +
        (r ? '2θ ' + r.twoThetaDeg.toFixed(1) + '°' : t('Bragg koşulu sağlanmaz', 'Bragg condition not met'));
      chosen.append(option);
    }
    const previousAllowed = sampleData.lines.some(x =>
      x.hkl === previous && !!reflection(sampleData.a, x.n, radiation.alpha, Number(diameter.value)));
    const firstAllowed = [...chosen.options].find(x => !x.disabled);
    chosen.value = previousAllowed ? previous : firstAllowed ? firstAllowed.value : '';
    chosen.disabled = !firstAllowed;
  }
  function selectionExplanation(facts, material, radiation, dia) {
    const sourceName = source.value + ' Kα';
    const unavailable = facts.unavailable > 0
      ? t(' ' + facts.unavailable + ' yüksek indisli yansıma Bragg koşulunu sağlamıyor.',
          ' ' + facts.unavailable + ' high-index reflections cannot satisfy Bragg\'s law.')
      : '';
    const sourceCaution = facts.mayExciteKFluorescence
      ? t(' Foton enerjisi (' + facts.energyKeV.toFixed(2) + ' keV), ' + material.name +
            ' K-soğurma kenarının (' + facts.edgeKeV.toFixed(2) +
            ' keV) üstünde: K-floresansı oluşabilir. Arka planın önemi dedektöre ve numuneye bağlıdır.' +
            (material.containsFe ? ' Co Kα deneyini karşılaştırın.' : ''),
          ' Photon energy (' + facts.energyKeV.toFixed(2) + ' keV) exceeds the ' + material.name +
            ' K absorption edge (' + facts.edgeKeV.toFixed(2) +
            ' keV): K fluorescence is possible. Its impact depends on the detector and specimen.' +
            (material.containsFe ? ' Compare Co Kα.' : ''))
      : material.containsFe && source.value === 'Co'
        ? t(' Co Kα, Fe K soğurma kenarının altında olduğundan Fe floresansını azaltmak için uygundur.',
            ' Co Kα lies below the Fe K edge and reduces Fe fluorescence background.')
        : '';
    const reflectionNote = !facts.selected
      ? t('Bu koşullarda erişilebilir yansıma yok.', 'No reflection is accessible with these settings.')
      : (facts.selected.twoThetaDeg >= 120
          ? t(' Yüksek açılı çizgiler açısal olarak duyarlı olsa da genellikle daha zayıftır.',
              ' High-angle lines give useful angular sensitivity but are often weaker.')
          : facts.selected.twoThetaDeg < 20
            ? t(' Düşük açıda bazı çizgiler demet durdurucuya yakın olabilir.',
                ' At low angles some lines may approach the beam stop.')
            : '') +
        (facts.nearestDeg !== null && facts.nearestDeg < 3
          ? t(' Yakındaki başka bir yansımadan yalnız ' + facts.nearestDeg.toFixed(1) + '° ayrılıyor.',
              ' Only ' + facts.nearestDeg.toFixed(1) + '° from another reflection.')
          : '');
    const cards = [
      [t('Numune neden seçilir?', 'Why this specimen?'),
       t(material.name + ' — ' + material.structure + ', a ≈ ' + material.a.toFixed(3) + ' Å. ', material.name + ' — ' + material.structure + ', a ≈ ' + material.a.toFixed(3) + ' Å. ') +
       t(...material.notes) + ' ' +
       t('Gerçekte saf, ince taneli ve rastgele yönelimli toz gerekir.', 'Real measurements require suitably prepared, fine-grained, randomly oriented powder.')],
      [t('Işınım neden seçilir?', 'Why this radiation?'),
       sourceName + ' (λ ≈ ' + radiation.alpha.toFixed(4) + ' Å). ' +
       t('Kısa λ çizgileri küçük açılara toplar; uzun λ ayırır ama erişilebilir yüksek indisli yansımaları azaltabilir.',
         ' Shorter λ compresses lines toward low angles; longer λ spreads them but can exclude high-order reflections.') +
       t(' Kullanılabilir ' + facts.available + '/' + facts.total + ' yansıma.', ' Accessible reflections: ' + facts.available + '/' + facts.total + '.') +
       unavailable + sourceCaution],
      [t('Kamera çapı neden seçilir?', 'Why this camera diameter?'),
       'D = ' + dia.toFixed(1) + ' mm. ' +
       t('Her 1° kırınım açısı filmde yaklaşık ', 'Each 1° of diffraction corresponds to about ') +
       facts.mmPerDegree.toFixed(3) + ' mm. ' +
       t('Büyük çap sabit film konum çözünürlüğünde daha iyi açısal ayırım sağlar; daha uzun film ve hassas merkezleme gerektirir.',
         ' A larger diameter improves angular discrimination at fixed film-position resolution, but needs more film and careful centering.')],
      [t('(hkl) neden izlenir?', 'Why track this (hkl)?'),
       t('İzinli ve ölçülebilir bir çizgi seçin. Düşük açılar genelde güçlü; yüksek açılar kafes parametresine duyarlı olabilir.',
         'Choose a permitted, observable line. Low-angle lines are often strong; high-angle lines may be sensitive to lattice parameters.') +
       reflectionNote]
    ];
    // Refresh the selected explanation without resetting the active tab.
    adviceData = cards;
    showAdvice(activeAdviceIndex);
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
    const facts = selectionFacts(sample.value, source.value, dia, chosen.value);
    if (facts) selectionExplanation(facts, material, radiation, dia);
    if (!selected) {
      display.textContent = t('Seçili koşullarda erişilebilir yansıma yok.', 'No accessible reflection for these settings.');
      note.textContent = '';
      return;
    }
    const readoutCard = (label, value, key, captionTr, captionEn) =>
      '<div class="dc-info-card"><small>' + label + '</small>' +
      '<strong>' + value + '</strong>' +
      '<button type="button" class="info-btn small dc-readout-info" data-info="' + key +
      '" aria-haspopup="dialog" aria-controls="infoModal" aria-label="' +
      t(captionTr, captionEn) + '" title="' + t(captionTr, captionEn) + '">i</button></div>';
    display.innerHTML =
      readoutCard('d<sub>hkl</sub>', selected.d.toFixed(4) + ' Å',
        'dcPlaneSpacing', 'Düzlemler arası uzaklık hakkında bilgi',
        'About interplanar spacing') +
      readoutCard('2θ', selected.twoThetaDeg.toFixed(2) + '°',
        'dcTwoTheta', '2θ açısını neler değiştirir?',
        'What affects the 2θ angle?') +
      readoutCard('s = R × 2θ', selected.arcMm.toFixed(2) + ' mm',
        'dcFilmDistance', 'Film üzerindeki yay uzunluğu hakkında bilgi',
        'About the arc distance on the film') +
      readoutCard('R', (dia / 2).toFixed(2) + ' mm',
        'dcCameraRadius', 'Kamera yarıçapı hakkında bilgi',
        'About camera radius');
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
  // Changing radiation also changes which (hkl) families satisfy Bragg's law.
  source.addEventListener('change', () => { setChoices(); update(); });
  for (const item of [diameter, filter, rotating, chosen]) {
    item.addEventListener('change', update);
    if (item.tagName === 'INPUT') item.addEventListener('input', update);
  }
  const tab = document.querySelector('[data-sub="s3camera"]');
  if (tab) tab.addEventListener('click', () => root.requestAnimationFrame(update));
  root.addEventListener('resize', update, { passive: true });
  setChoices(); update();
})(typeof globalThis !== 'undefined' ? globalThis : this);
