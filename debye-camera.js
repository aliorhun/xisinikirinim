(function (root) {
  'use strict';

  // Ideal, kinematic camera geometry; intensities below are illustrative only.
  // Representative cubic samples; lattice constants are approximate room-temperature
  // teaching values (Å). Reflection lists enforce symmetry/structure selection rules,
  // but the weights are only schematic: they are NOT calculated structure factors.
  const REFLECTION_FAMILIES = {
    fcc: [
      ['111',3,1], ['200',4,.5], ['220',8,.34], ['311',11,.27],
      ['222',12,.13], ['400',16,.10], ['331',19,.12], ['420',20,.10],
      ['422',24,.08], ['440',32,.07]
    ],
    bcc: [
      ['110',2,1], ['200',4,.22], ['211',6,.42], ['220',8,.18],
      ['310',10,.21], ['222',12,.14], ['321',14,.14], ['400',16,.09],
      ['411',18,.09], ['420',20,.08]
    ],
    diamond: [
      ['111',3,1], ['220',8,.55], ['311',11,.36], ['400',16,.19],
      ['331',19,.13], ['422',24,.12], ['333',27,.09], ['440',32,.07]
    ],
    rocksalt: [
      ['111',3,.16], ['200',4,1], ['220',8,.62], ['311',11,.13],
      ['222',12,.29], ['400',16,.17], ['331',19,.08], ['420',20,.10],
      ['422',24,.09]
    ],
    spinel: [
      ['220',8,.30], ['311',11,1], ['400',16,.42], ['422',24,.24],
      ['511',27,.39], ['440',32,.52], ['533',43,.14], ['622',44,.12]
    ]
  };
  const SAMPLE_GROUPS = {
    metals: ['cu','al','ni','fe','w'],
    semiconductors: ['si','ge','diamond'],
    ionic: ['nacl','mgo','lif'],
    oxides: ['magnetite']
  };
  const SAMPLE_DEFINITIONS = {
    cu: { name: 'Cu', a:3.615, family:'fcc', recommended:'Cu',
      reason:['YMK metal: referans deneyde yakın 2θ çizgilerini ve faz düzlemlerini karşılaştırmak için uygun.','FCC metal: useful for comparing familiar low-angle peaks and plane families.'] },
    al: { name:'Al', a:4.0495, family:'fcc', recommended:'Cu',
      reason:['YMK metal: Cu ile karşılaştırıldığında daha büyük a nedeniyle pikler daha küçük açılara kayar.','FCC metal: its larger lattice constant shifts corresponding peaks below those of Cu.'] },
    ni: { name:'Ni', a:3.5238, family:'fcc', recommended:'Cu',
      reason:['YMK metal: Cu ile benzer fakat daha küçük a değerinin 2θ üzerindeki etkisini incelemek için.','FCC metal: compare how a slightly smaller lattice constant shifts lines relative to Cu.'] },
    fe: { name:'α-Fe', a:2.8665, family:'bcc', recommended:'Co', ironRich:true,
      reason:['HMK ferrit: (110) ilk izinli çizgidir; Cu Kα demir floresansı oluşturabildiğinden Co Kα daha uygun başlangıçtır.','BCC ferrite: (110) is the first allowed line; Co Kα avoids the strong Fe fluorescence caused by Cu Kα.'] },
    w: { name:'W', a:3.1652, family:'bcc', recommended:'Cu',
      reason:['HMK ağır metal: Cu Kα ile başlayın; Mo Kα yüksek indisli çizgileri açabilir fakat W L-floresansını uyarabilir. Gerçek soğurma ayrıca değerlendirilmelidir.','Heavy BCC metal: start with Cu Kα; Mo Kα can expose higher-order lines but may excite W L fluorescence. Real absorption must also be assessed.'] },
    si: { name:'Si', a:5.431, family:'diamond', recommended:'Cu',
      reason:['Elmas-tipi yarıiletken: (200) sönümünü ve (111)/(220) çizgilerini öğretmek için iyi bir referans.','Diamond-type semiconductor: useful for demonstrating the (200) extinction and the (111)/(220) peaks.'] },
    ge: { name:'Ge', a:5.658, family:'diamond', recommended:'Cu',
      reason:['Elmas-tipi yarıiletken: Si ile hücre boyutunu karşılaştırın. Mo Kα, Ge K-floresansını uyarabildiğinden önce Cu Kα ile başlayın.','Diamond-type semiconductor: compare its lattice size with Si. Start with Cu Kα because Mo Kα can excite Ge K fluorescence.'] },
    diamond: { name:'C (elmas)', a:3.567, family:'diamond', recommended:'Cu',
      reason:['Düşük Z ve elmas yapı: sistematik sönümler gözlenir; gerçek film şiddeti bu modelden tahmin edilemez.','Low-Z diamond structure: shows systematic absences; real film intensity is not predicted by this model.'] },
    nacl: { name:'NaCl', a:5.640, family:'rocksalt', recommended:'Cu',
      reason:['Kaya tuzu tipi iyonik kristal: YMK izinli yansımalar vardır, tek/çift hkl şiddetleri atom türlerine bağlıdır.','Rocksalt ionic crystal: FCC selection rules apply; odd/even family intensities depend on the atomic species.'] },
    mgo: { name:'MgO', a:4.212, family:'rocksalt', recommended:'Cu',
      reason:['Kaya tuzu tipi seramik: NaCl ile karşılaştırıp daha küçük a değerinin pikleri nasıl kaydırdığını inceleyin.','Rocksalt ceramic: compare with NaCl to see how the smaller cell moves the peaks.'] },
    lif: { name:'LiF', a:4.027, family:'rocksalt', recommended:'Cu',
      reason:['Kaya tuzu tipi iyonik malzeme: NaCl ve MgO ile aynı simetri, fakat farklı hücre ve saçılma kontrastı.','Rocksalt ionic material: same symmetry as NaCl and MgO, with different lattice spacing and scattering contrast.'] },
    magnetite: { name:'Fe₃O₄ (manyetit)', a:8.396, family:'spinel', recommended:'Co', ironRich:true,
      reason:['Ferrimanyetik spinel: büyük birim hücre nedeniyle çok sayıda çizgi oluşur; Fe floresansından kaçınmak için Co Kα öğretici başlangıçtır.','Ferrimagnetic spinel: a large cell produces many lines; Co Kα is a useful default to avoid Fe fluorescence.'] }
  };
  const SAMPLES = Object.fromEntries(Object.entries(SAMPLE_DEFINITIONS).map(([id, entry]) => [
    id, { ...entry, lines: REFLECTION_FAMILIES[entry.family].map(([hkl,n,weight]) => ({hkl,n,weight})) }
  ]));
  const SOURCES = {
    Cr: { alpha:2.2909, beta:2.08479, filter:'V' },
    Fe: { alpha:1.9373, beta:1.75654, filter:'Mn' },
    Co: { alpha:1.7902, beta:1.62073, filter:'Fe' },
    Cu: { alpha:1.5418, beta:1.39217, filter:'Ni' },
    Mo: { alpha:.7107, beta:.63225, filter:'Zr' }
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
      const result = [];
      if (main) result.push({ ...main, hkl: line.hkl, weight: line.weight, kind: 'alpha' });
      if (!filtered) {
        const beta = reflection(material.a, line.n, radiation.beta, diameter);
        if (beta) result.push({ ...beta, hkl: line.hkl, weight: line.weight * .20, kind: 'beta' });
      }
      return result;
    });
  }
  const physics = { reflection, linesFor, SAMPLES, SOURCES, SAMPLE_GROUPS, REFLECTION_FAMILIES };
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

  function populateSamples() {
    const labels = {
      metals: t('Metaller — YMK / HMK', 'Metals — FCC / BCC'),
      semiconductors: t('Yarıiletkenler ve elmas', 'Semiconductors and diamond'),
      ionic: t('İyonik kristaller / seramikler', 'Ionic crystals / ceramics'),
      oxides: t('Demir içeren oksit', 'Iron-containing oxide')
    };
    sample.replaceChildren();
    for (const [group, ids] of Object.entries(SAMPLE_GROUPS)) {
      const optgroup = document.createElement('optgroup');
      optgroup.label = labels[group];
      for (const id of ids) {
        const material = SAMPLES[id];
        const option = document.createElement('option');
        option.value = id;
        option.textContent = material.name + ' · ' + material.family.toUpperCase();
        optgroup.append(option);
      }
      sample.append(optgroup);
    }
    sample.value = 'cu';
  }
  function populateSources() {
    source.replaceChildren();
    for (const [symbol, radiation] of Object.entries(SOURCES)) {
      const option = document.createElement('option');
      option.value = symbol;
      option.textContent = symbol + ' Kα · ' + radiation.alpha.toFixed(4) + ' Å';
      source.append(option);
    }
    source.value = 'Cu';
  }
  function setChoices() {
    const previous = chosen.value;
    chosen.replaceChildren();
    const material = SAMPLES[sample.value], radiation = SOURCES[source.value];
    for (const line of material.lines) {
      const geom = reflection(material.a, line.n, radiation.alpha, Number(diameter.value));
      if (!geom) continue;
      const option = document.createElement('option');
      option.value = line.hkl;
      option.textContent = '(' + line.hkl + ') · ' + geom.twoThetaDeg.toFixed(1) + '°';
      chosen.append(option);
    }
    chosen.value = [...chosen.options].some(x => x.value === previous) ? previous : chosen.options[0]?.value || '';
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
  function selectionGuidance(material, radiation, selected, accessibleCount) {
    const diag = Number(diameter.value), lowD = radiation.alpha / 2;
    const first = material.lines[0], max = material.lines.length;
    const forward = selected.twoThetaDeg < 90;
    const moreThan90 = selected.twoThetaDeg > 90;
    el('dcSampleGuide').textContent = t(material.reason[0], material.reason[1]) +
      t(' Yaklaşık kübik örgü parametresi a = ', ' Approximate cubic lattice constant a = ') + material.a.toFixed(3) + ' Å. ' +
      t('Gerçek deneyde homojenlik, kristalit boyutu, numunenin kararlılığı ve demet boyunca soğurma da numune biçimini belirler.',
        'In a real experiment, homogeneity, grain size, sample stability and absorption along the beam also determine sample preparation.');
    el('dcSourceGuide').textContent = t(
      source.value + ' Kα = ' + radiation.alpha.toFixed(4).replace('.', ',') + ' Å; Kβ için ' + radiation.filter + ' filtresi. λ kısaldıkça aynı d için 2θ küçülür, ancak daha küçük d değerlerine erişilebilir. Geometrik sınır d ≥ ' + lowD.toFixed(3).replace('.', ',') + ' Å.',
      source.value + ' Kα = ' + radiation.alpha.toFixed(4) + ' Å; ' + radiation.filter + ' filter suppresses Kβ. Shorter λ lowers 2θ at fixed d but accesses smaller spacings. Geometric limit d ≥ ' + lowD.toFixed(3) + ' Å.'
    );
    el('dcDiameterGuide').textContent = t(
      diag.toFixed(1).replace('.', ',') + ' mm çapta 2θ açısının her 1° artışı filmde tek tarafta yaklaşık ' + ((diag/2)*Math.PI/180).toFixed(2).replace('.', ',') + ' mm yer değiştirir. Büyük çap çizgileri daha çok ayırır, fakat daha uzun film ve daha fazla pozlama gerektirebilir.',
      'At ' + diag.toFixed(1) + ' mm diameter, each 1° of 2θ moves a line by about ' + ((diag/2)*Math.PI/180).toFixed(2) + ' mm along one side of the film. Larger cameras spread lines farther apart, but may need longer film and exposure.'
    );
    el('dcReflectionGuide').textContent = t(
      '(' + chosen.value + ') ' + (forward ? 'ileri kırınım' : moreThan90 ? 'geri kırınım' : '90° sınırı') +
        ' bölgesindedir (2θ = ' + selected.twoThetaDeg.toFixed(2).replace('.', ',') + '°). Başlangıç için ' + '(' + first.hkl + ')' +
        ' gibi düşük indisli çizgileri izleyin; yüksek açılı çizgiler örgü parametresini hassas belirlemede faydalıdır, ama zayıf/örtüşmüş olabilir.',
      '(' + chosen.value + ') lies in the ' + (forward ? 'forward' : moreThan90 ? 'back-reflection' : '90° boundary') +
        ' region (2θ = ' + selected.twoThetaDeg.toFixed(2) + '°). Start with low-index lines such as (' +
        first.hkl + '); high-angle lines can help refine lattice parameters but may be weak or overlap.'
    );
    const warnings = [];
    if (source.value !== material.recommended) {
      warnings.push(t(
        'Bu numune için eğitim başlangıcı olarak ' + material.recommended + ' Kα önerilir; seçtiğiniz kaynakla karşılaştırma yine yapılabilir.',
        'Suggested starting radiation for this sample: ' + material.recommended + ' Kα; you can still compare your chosen source.'
      ));
    }
    if (material.ironRich && ['Cu','Mo'].includes(source.value)) {
      warnings.push(t(
        'Fe içeren numune + ' + source.value + ' Kα: Fe K floresansı/arka planı artabilir. Co Kα veya uygun enerji ayrımı olan optikler tercih edilebilir; bu etki film parlaklığında hesaplanmıyor.',
        'Fe-rich sample + ' + source.value + ' Kα: Fe K fluorescence/background can increase. Co Kα or energy-selective optics can help; this effect is not simulated on the film.'
      ));
    }
    if (source.value === 'Mo' && sample.value === 'ge') {
      warnings.push(t(
        'Mo Kα enerjisi Ge K-soğurma kenarının üzerindedir; Ge floresansı arka planı artırabilir. Bu optik etki modelde hesaplanmıyor.',
        'Mo Kα lies above the Ge K absorption edge and may raise the fluorescence background; this optical effect is not modeled.'
      ));
    }
    if (source.value === 'Mo' && sample.value === 'w') {
      warnings.push(t(
        'Mo Kα enerjisi W L-soğurma kenarlarının üzerindedir; W L-floresansı mümkün olduğundan gerçek optik ve soğurmayı doğrulayın.',
        'Mo Kα is above W L absorption edges; W L fluorescence is possible, so check actual optics and absorption.'
      ));
    }
    if (accessibleCount < max) {
      warnings.push(t(
        'Bragg sınırı: listelenen ' + max + ' düzlem ailesinden ' + accessibleCount + ' tanesi Kα ile erişilebilir. Ulaşılamayan (hkl) seçimden çıkarıldı.',
        'Bragg limit: ' + accessibleCount + ' of ' + max + ' listed families are reachable with Kα. Inaccessible (hkl) choices have been removed.'
      ));
    }
    if (selected.twoThetaDeg > 155) {
      warnings.push(t('Bu çizgi 180° geri kırınım yönüne yakındır; gerçek kamerada giriş açıklığı, ışın tutucu ve film aralıkları ölçümü engelleyebilir.',
        'This line is close to 180° back-scattering; real film gaps, beam-stop and entry openings may obstruct it.'));
    }
    if (!filter.checked) {
      warnings.push(t('Filtre kapalı: zayıf Kβ çizgileri eklenmiştir. Gerçekte Kα geçirgenliği ve arka plan da değişebilir.',
        'Filter off: weak Kβ marks are added. In practice, Kα transmission and background can also change.'));
    }
    const notice = el('dcSelectionWarning');
    notice.hidden = warnings.length === 0;
    notice.textContent = warnings.join(' ');
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
    selectionGuidance(material, radiation, selected, all.filter(x => x.kind === 'alpha').length);
    drawCamera(selected, all);
    drawFilm(all, dia, chosen.value, rotating.checked);
  }
  sample.addEventListener('change', () => {
    source.value = SAMPLES[sample.value].recommended;
    setChoices(); update();
  });
  source.addEventListener('change', () => { setChoices(); update(); });
  for (const item of [diameter, filter, rotating, chosen]) {
    item.addEventListener('change', update);
    if (item.tagName === 'INPUT') item.addEventListener('input', update);
  }
  const tab = document.querySelector('[data-sub="s3camera"]');
  if (tab) tab.addEventListener('click', () => root.requestAnimationFrame(update));
  root.addEventListener('resize', update, { passive: true });
  populateSamples(); populateSources(); setChoices(); update();
})(typeof globalThis !== 'undefined' ? globalThis : this);
