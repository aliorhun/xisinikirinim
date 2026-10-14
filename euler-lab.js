/* Euler's identity and the two-equal-scatterer structure factor.
   This lesson is self-contained, has no network dependencies, and uses SVG rather than canvas. */
(function () {
  'use strict';

  const root = document.getElementById('eulerLab');
  if (!root) return;
  const en = document.documentElement.lang === 'en';
  const tr = (turkish, english) => en ? english : turkish;
  const PI = Math.PI;
  const degToRad = PI / 180;
  const close = x => Math.abs(x) < 1e-10 ? 0 : Math.abs(x - 1) < 1e-10 ? 1 : Math.abs(x + 1) < 1e-10 ? -1 : x;
  const format = (value, digits = 3) => {
    const n = close(value);
    return n.toLocaleString(en ? 'en-US' : 'tr-TR', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
  };
  const signed = (real, imag) => {
    if (!imag) return format(real);
    const imaginary = Math.abs(imag) === 1 ? '' : format(Math.abs(imag));
    if (!real) return (imag < 0 ? '−' : '') + imaginary + 'i';
    return format(real) + (imag < 0 ? ' − ' : ' + ') + imaginary + 'i';
  };
  const phaseLabel = degrees => {
    const ratio = degrees / 180;
    if (!degrees) return '0';
    const abs = Math.abs(ratio);
    const sign = ratio < 0 ? '−' : '';
    const fractions = [[0.5, 'π/2'], [1, 'π'], [1.5, '3π/2'], [2, '2π']];
    const hit = fractions.find(item => Math.abs(abs - item[0]) < 1e-9);
    return hit ? sign + hit[1] : format(degrees, 1) + '°';
  };
  const presets = [
    [-180, '−π'], [-90, '−π/2'], [0, '0'], [90, 'π/2'],
    [180, 'π'], [270, '3π/2'], [360, '2π']
  ];

  root.innerHTML = [
    '<div class="euler-heading">',
      '<div><p class="euler-kicker">', tr('ETKİLEŞİMLİ MATEMATİK LABORATUVARI', 'INTERACTIVE MATHEMATICS LAB'), '</p>',
        '<h3>', tr('Euler formülü: üstel ifadeden sinüs ve kosinüse', 'Euler’s formula: from exponentials to sine and cosine'), '</h3>',
        '<p>', tr('Faz açısını değiştirin. Birim çemberde yatay izdüşüm cos φ, düşey izdüşüm sin φ ve ok e üzeri iφ değeridir.',
          'Change the phase. On the unit circle the horizontal projection is cos φ, the vertical projection is sin φ, and the arrow represents e to the power iφ.'), '</p>',
      '</div>',
      '<div class="euler-identity" aria-label="Euler identity">e<sup>iφ</sup> = cos φ + i sin φ</div>',
    '</div>',
    '<div class="euler-controls">',
      '<div class="euler-presets" role="group" aria-label="', tr('Örnek faz açıları', 'Preset phase angles'), '">',
      presets.map(item => '<button type="button" data-euler-degree="' + item[0] + '" aria-pressed="false">' + item[1] + '</button>').join(''),
      '</div>',
      '<div class="euler-slider-row">',
        '<label for="eulerPhase">', tr('Faz açısı', 'Phase angle'), ' <strong>φ</strong></label>',
        '<input id="eulerPhase" type="range" min="-360" max="360" step="1" value="180" aria-label="', tr('Faz açısı derece', 'Phase angle in degrees'), '">',
        '<output id="eulerPhaseOutput" for="eulerPhase"></output>',
        '<button type="button" id="eulerPlay" class="euler-play" aria-pressed="false">', tr('Oynat', 'Play'), '</button>',
      '</div>',
    '</div>',
    '<div class="euler-visuals">',
      '<figure class="euler-figure">',
        '<figcaption><b>', tr('Birim çember ve kompleks sayı', 'Unit circle and complex number'), '</b>',
        '<span>', tr('Reel eksen: cos φ · Sanal eksen: sin φ', 'Real axis: cos φ · Imaginary axis: sin φ'), '</span></figcaption>',
        '<svg id="eulerCircle" viewBox="0 0 400 350" role="img" aria-label="', tr('Birim çember üzerinde Euler faz vektörü', 'Euler phase vector on a unit circle'), '"></svg>',
      '</figure>',
      '<figure class="euler-figure">',
        '<figcaption><b>', tr('Sinüs ve kosinüs nasıl değişiyor?', 'How do sine and cosine change?'), '</b>',
        '<span>', tr('−2π ile 2π arasında aynı fazın iki izdüşümü', 'Two projections of the same phase between −2π and 2π'), '</span></figcaption>',
        '<svg id="eulerCurves" viewBox="0 0 500 350" role="img" aria-label="', tr('Faza göre sinüs ve kosinüs grafikleri', 'Sine and cosine versus phase'), '"></svg>',
        '<div class="euler-legend"><span><i class="euler-cos-key"></i> cos φ</span><span><i class="euler-sin-key"></i> sin φ</span></div>',
      '</figure>',
    '</div>',
    '<div class="euler-values" aria-live="off">',
      '<div><span>cos φ</span><strong id="eulerCos"></strong></div>',
      '<div><span>sin φ</span><strong id="eulerSin"></strong></div>',
      '<div><span>e<sup>iφ</sup></span><strong id="eulerExp"></strong></div>',
      '<div><span>F / f = 1 + e<sup>iφ</sup></span><strong id="eulerFactor"></strong></div>',
      '<div><span>I / I<sub>max</sub></span><strong id="eulerIntensity"></strong></div>',
    '</div>',
    '<div class="euler-worked" id="eulerWorked" aria-live="polite"></div>',
    '<div class="euler-interpretation" id="eulerInterpretation" aria-live="polite"></div>',
    '<p class="euler-caution"><b>', tr('Fiziksel ayrım:', 'Physical distinction:'), '</b> ',
      tr('φ iki atom katkısı arasındaki faz farkıdır; Bragg açısı θ değildir. Kaydırıcı matematiksel sürekliliği gösterir. İdeal HMK/BCC yapısında izin verilen (hkl) indisleri için φ = π(h + k + l) olduğundan faz yalnızca π’nin tam katlarıdır. F/f ve I/Imax sonuçları iki eşit saçılma genliği içindir.',
        'φ is the relative phase between two atomic contributions, not the Bragg angle θ. The slider illustrates continuous phase mathematically. For allowed integer (hkl) indices of ideal BCC, φ = π(h + k + l), so only integer multiples of π occur. F/f and I/Imax assume two equal scattering amplitudes.'), '</p>'
  ].join('');

  const slider = root.querySelector('#eulerPhase');
  const output = root.querySelector('#eulerPhaseOutput');
  const circle = root.querySelector('#eulerCircle');
  const curves = root.querySelector('#eulerCurves');
  const play = root.querySelector('#eulerPlay');
  const cosReadout = root.querySelector('#eulerCos');
  const sinReadout = root.querySelector('#eulerSin');
  const expReadout = root.querySelector('#eulerExp');
  const factorReadout = root.querySelector('#eulerFactor');
  const intensityReadout = root.querySelector('#eulerIntensity');
  const worked = root.querySelector('#eulerWorked');
  const interpretation = root.querySelector('#eulerInterpretation');
  const buttons = [...root.querySelectorAll('[data-euler-degree]')];
  let degree = 180;
  let running = false;
  let raf = 0;
  let previous = 0;
  let playPosition = degree;

  function eulerValues(angle) {
    const rad = angle * degToRad;
    const cos = close(Math.cos(rad)), sin = close(Math.sin(rad));
    const real = close(1 + cos), imaginary = sin;
    const intensity = close((real * real + imaginary * imaginary) / 4);
    return {cos, sin, real, imaginary, intensity};
  }

  function coordinatePath(fn, start, end, segments) {
    const points = [];
    for (let n = 0; n <= segments; n++) {
      const x = start + (end - start) * n / segments;
      const p = fn(x);
      points.push((n ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2));
    }
    return points.join(' ');
  }

  function drawCircle(v) {
    const cx = 191, cy = 169, r = 118;
    const x = cx + r * v.cos, y = cy - r * v.sin;
    const circleArc = coordinatePath(a => [cx + 34 * Math.cos(a), cy - 34 * Math.sin(a)], 0, degree * degToRad, Math.max(1, Math.ceil(Math.abs(degree) / 6)));
    const components = '<line x1="' + cx + '" y1="' + cy + '" x2="' + x + '" y2="' + cy + '" class="euler-cos-line"/>' +
      '<line x1="' + x + '" y1="' + cy + '" x2="' + x + '" y2="' + y + '" class="euler-sin-line"/>';
    circle.innerHTML = [
      '<defs><marker id="euler-tip" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z" fill="var(--cobalt)"/></marker></defs>',
      '<circle cx="', cx, '" cy="', cy, '" r="', r, '" class="euler-unit"/>',
      '<line x1="30" y1="', cy, '" x2="365" y2="', cy, '" class="euler-axis"/>',
      '<line x1="', cx, '" y1="18" x2="', cx, '" y2="320" class="euler-axis"/>',
      '<g class="euler-axis-label"><text x="364" y="159" text-anchor="end">Re</text><text x="201" y="22">Im</text>',
      '<text x="', cx + r + 5, '" y="', cy + 18, '">1</text>',
      '<text x="', cx - r - 5, '" y="', cy + 18, '" text-anchor="end">−1</text>',
      '<text x="', cx + 9, '" y="', cy - r - 3, '">i</text>',
      '<text x="', cx + 9, '" y="', cy + r + 15, '">−i</text></g>',
      components,
      '<path d="', circleArc, '" class="euler-angle-arc"/>',
      '<line x1="', cx, '" y1="', cy, '" x2="', x, '" y2="', y, '" class="euler-vector" marker-end="url(#euler-tip)"/>',
      '<circle cx="', x, '" cy="', y, '" r="5" class="euler-point"/>',
      '<circle cx="', cx, '" cy="', cy, '" r="2.6" class="euler-origin"/>',
      '<text x="', cx, '" y="337" text-anchor="middle" class="euler-vector-caption">(',
       format(v.cos), ', ', format(v.sin), ') = cos φ + i sin φ</text>'
    ].join('');
  }

  function drawCurves(v) {
    const x0 = 44, x1 = 478, yc = 165, ampl = 96;
    const x = degrees => x0 + (degrees + 360) / 720 * (x1 - x0);
    const y = value => yc - value * ampl;
    const curve = fn => coordinatePath(d => [x(d), y(fn(d * degToRad))], -360, 360, 288);
    const ticks = [[-360, '−2π'], [-180, '−π'], [0, '0'], [180, 'π'], [360, '2π']];
    let s = '<line x1="' + x0 + '" y1="' + yc + '" x2="' + x1 + '" y2="' + yc + '" class="euler-axis"/>' +
      '<line x1="' + x(0) + '" y1="48" x2="' + x(0) + '" y2="282" class="euler-axis"/>';
    for (const t of [-1, 1]) {
      s += '<line x1="' + x0 + '" y1="' + y(t) + '" x2="' + x1 + '" y2="' + y(t) + '" class="euler-grid"/>' +
        '<text x="30" y="' + (y(t) + 5) + '" text-anchor="end" class="euler-axis-label">' + (t === -1 ? '−1' : '1') + '</text>';
    }
    s += '<text x="30" y="' + (yc + 5) + '" text-anchor="end" class="euler-axis-label">0</text>';
    for (const tick of ticks) {
      s += '<line x1="' + x(tick[0]) + '" y1="60" x2="' + x(tick[0]) + '" y2="270" class="euler-grid"/>' +
        '<text x="' + x(tick[0]) + '" y="298" text-anchor="middle" class="euler-axis-label">' + tick[1] + '</text>';
    }
    s += '<path d="' + curve(Math.cos) + '" class="euler-curve-cos"/>' +
      '<path d="' + curve(Math.sin) + '" class="euler-curve-sin"/>' +
      '<line x1="' + x(degree) + '" y1="55" x2="' + x(degree) + '" y2="270" class="euler-cursor"/>' +
      '<circle cx="' + x(degree) + '" cy="' + y(v.cos) + '" r="5.5" class="euler-curve-dot-cos"/>' +
      '<circle cx="' + x(degree) + '" cy="' + y(v.sin) + '" r="5.5" class="euler-curve-dot-sin"/>' +
      '<text x="260" y="333" text-anchor="middle" class="euler-axis-label">φ (' + tr('radyan', 'radians') + ')</text>';
    curves.innerHTML = s;
  }

  function explain(v) {
    const exp = signed(v.cos, v.sin);
    const f = signed(v.real, v.imaginary);
    worked.innerHTML = '<b>' + tr('Euler açılımı:', 'Euler expansion:') + '</b> ' +
      'e<sup>i(' + phaseLabel(degree) + ')</sup> = cos(' + phaseLabel(degree) +
      ') + i sin(' + phaseLabel(degree) + ') = <strong>' + exp + '</strong><br>' +
      '<b>' + tr('İki eşit atom için:', 'For two identical scatterers:') + '</b> F/f = 1 + (' + exp +
      ') = <strong>' + f + '</strong>; &nbsp; I/I<sub>max</sub> = |F/f|²/4 = <strong>' + format(v.intensity * 100, 1) + '%</strong>.';

    let message;
    if (v.cos === -1 && v.sin === 0) {
      message = tr('<b>180°: e<sup>iπ</sup> = −1.</b> cos π = −1 ve sin π = 0. Böylece eşit iki katkı 1 + (−1) = <b>0</b> olur. Tam yıkıcı girişim (HMK/BCC, h+k+l tek).',
        '<b>180°: e<sup>iπ</sup> = −1.</b> cos π = −1 and sin π = 0. Two equal contributions give 1 + (−1) = <b>0</b>: complete destructive interference (BCC, h+k+l odd).');
    } else if (v.cos === 1 && v.sin === 0) {
      message = tr('<b>Tam tur / sıfır faz farkı:</b> cos φ = 1, sin φ = 0 ve e<sup>iφ</sup> = 1. İki eşit katkı toplanır: F/f = <b>2</b>.',
        '<b>Full turn / zero phase difference:</b> cos φ = 1, sin φ = 0 and e<sup>iφ</sup> = 1. The two equal contributions reinforce: F/f = <b>2</b>.');
    } else if (v.cos === 0) {
      message = tr('<b>Çeyrek tur:</b> cos φ = 0 olduğu için reel bileşen kaybolur; e<sup>iφ</sup> yalnızca sanal eksen üzerindedir. Fazör, −1 ile +1 arasındaki dönüşü gösterir.',
        '<b>Quarter turn:</b> cos φ = 0, so the real component vanishes and e<sup>iφ</sup> lies on the imaginary axis. The phasor shows the rotation between −1 and +1.');
    } else {
      message = tr('<b>Ara faz:</b> kosinüs yatay, sinüs düşey bileşeni belirler. Fazörün uzunluğu daima 1’dir; 1 + e<sup>iφ</sup> toplamının uzunluğu ise açıyla değişir.',
        '<b>Intermediate phase:</b> cosine is the horizontal component, sine the vertical component. The phasor always has unit length; the length of 1 + e<sup>iφ</sup> changes with phase.');
    }
    interpretation.innerHTML = message;
  }

  function render() {
    const v = eulerValues(degree);
    slider.value = String(Math.round(degree));
    output.textContent = format(degree, 0) + '° = ' + phaseLabel(degree);
    cosReadout.textContent = format(v.cos);
    sinReadout.textContent = format(v.sin);
    expReadout.textContent = signed(v.cos, v.sin);
    factorReadout.textContent = signed(v.real, v.imaginary);
    intensityReadout.textContent = format(v.intensity * 100, 1) + '%';
    buttons.forEach(button => button.setAttribute('aria-pressed', String(+button.dataset.eulerDegree === degree)));
    drawCircle(v);
    drawCurves(v);
    explain(v);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    previous = 0;
    play.setAttribute('aria-pressed', 'false');
    play.textContent = tr('Oynat', 'Play');
  }

  function setAngle(angle) {
    degree = Math.max(-360, Math.min(360, angle));
    playPosition = degree;
    render();
  }

  function animate(time) {
    if (!running) return;
    if (root.closest('.subp').hidden) { stop(); return; }
    if (previous) {
      playPosition += Math.min((time - previous) / 1000, 0.08) * 55;
      if (playPosition > 360) playPosition = -360 + (playPosition - 360);
      degree = Math.round(playPosition);
      render();
    }
    previous = time;
    raf = requestAnimationFrame(animate);
  }

  slider.addEventListener('input', () => {stop(); setAngle(+slider.value);});
  buttons.forEach(button => button.addEventListener('click', () => {
    stop();
    setAngle(+button.dataset.eulerDegree);
  }));
  play.addEventListener('click', () => {
    if (running) {stop(); return;}
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setAngle(degree === 180 ? 360 : 180);
      return;
    }
    running = true;
    previous = 0;
    playPosition = degree;
    play.setAttribute('aria-pressed', 'true');
    play.textContent = tr('Durdur', 'Pause');
    raf = requestAnimationFrame(animate);
  });
  document.addEventListener('visibilitychange', () => {if (document.hidden) stop();});

  // Pointer interaction works for mouse, touch and pen. The slider remains keyboard accessible.
  circle.addEventListener('pointerdown', event => {
    const rect = circle.getBoundingClientRect();
    const scaleX = 400 / rect.width, scaleY = 350 / rect.height;
    const x = (event.clientX - rect.left) * scaleX - 191;
    const y = 169 - (event.clientY - rect.top) * scaleY;
    if (Math.hypot(x,y) < 15) return;
    let angle = Math.atan2(y,x) * 180 / PI;
    if (angle < 0 && degree > 180) angle += 360;
    if (angle > 0 && degree < -180) angle -= 360;
    stop();
    setAngle(Math.round(angle));
  });

  // The lesson works offline, including file:// use: no external fonts, images or libraries.
  render();
})();
