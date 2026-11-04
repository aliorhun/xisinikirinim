// Run: node --test tests/debye-camera.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { reflection, linesFor, SOURCES, SAMPLES, SAMPLE_GROUPS } = require('../debye-camera.js');

const almost = (actual, expected, eps = 1e-8) =>
  assert.ok(Math.abs(actual - expected) < eps, `expected ${actual} ≈ ${expected}`);

test('Cu (111), Cu Kα: Bragg angle and cylindrical film arc distance', () => {
  const a = SAMPLES.cu.a, lambda = SOURCES.Cu.alpha, diameter = 57.3;
  const r = reflection(a, 3, lambda, diameter);
  almost(r.d, a / Math.sqrt(3));
  almost(r.twoThetaDeg, 2 * Math.asin(lambda * Math.sqrt(3) / (2 * a)) * 180 / Math.PI);
  almost(r.arcMm, diameter / 2 * r.twoThetaDeg * Math.PI / 180);
  almost(r.filmPositionsMm[0], -r.arcMm);
  almost(r.filmPositionsMm[1], r.arcMm);
  assert.ok(r.twoThetaDeg > 43 && r.twoThetaDeg < 44);
});

test('camera diameter doubles arc distance but leaves 2θ unchanged', () => {
  const a = reflection(3.615, 3, 1.5418, 57.3);
  const b = reflection(3.615, 3, 1.5418, 114.6);
  almost(a.twoThetaDeg, b.twoThetaDeg);
  almost(b.arcMm, 2 * a.arcMm);
  almost(57.3 / 2 * Math.PI / 180, .5, .0001);
  almost(114.6 / 2 * Math.PI / 180, 1, .00015);
});

test('shorter Mo Kα shifts the same plane family to a lower 2θ', () => {
  const cu = reflection(3.615, 3, SOURCES.Cu.alpha, 57.3);
  const mo = reflection(3.615, 3, SOURCES.Mo.alpha, 57.3);
  assert.ok(mo.twoThetaDeg < cu.twoThetaDeg);
});

test('all catalog samples have at least one accessible alpha reflection with every source', () => {
  assert.equal(Object.keys(SAMPLES).length, 12);
  assert.equal(Object.keys(SOURCES).length, 5);
  assert.equal(Object.values(SAMPLE_GROUPS).flat().length, 12);
  for (const [sample, spec] of Object.entries(SAMPLES)) {
    assert.ok(spec.a > 0 && spec.lines.length >= 7 && SOURCES[spec.recommended], sample);
    for (const source of Object.keys(SOURCES)) {
      const alpha = linesFor(sample, source, 57.3, true);
      assert.ok(alpha.length > 0, sample + ':' + source);
      for (const line of alpha) {
        assert.equal(line.kind, 'alpha');
        assert.ok(line.twoThetaDeg > 0 && line.twoThetaDeg < 180);
      }
    }
  }
});

test('symmetry restrictions: FCC and rocksalt, BCC, diamond and spinel', () => {
  for (const sample of Object.values(SAMPLES)) {
    for (const line of sample.lines) {
      const [h,k,l] = line.hkl.split('').map(Number);
      assert.equal(h*h+k*k+l*l, line.n, sample.name + ':' + line.hkl);
      if (sample.family === 'fcc' || sample.family === 'rocksalt' || sample.family === 'diamond') {
        assert.ok(h%2 === k%2 && k%2 === l%2, sample.name + ':' + line.hkl);
      }
      if (sample.family === 'bcc') assert.equal((h+k+l)%2, 0, sample.name + ':' + line.hkl);
      if (sample.family === 'diamond' && h%2 === 0) {
        assert.equal((h+k+l)%4, 0, sample.name + ':' + line.hkl);
      }
    }
  }
  assert.ok(!SAMPLES.si.lines.some(x => x.hkl === '200'));
  assert.ok(!SAMPLES.fe.lines.some(x => x.hkl === '100'));
  assert.ok(SAMPLES.nacl.lines.some(x => x.hkl === '111'));
  assert.ok(SAMPLES.magnetite.lines.some(x => x.hkl === '311'));
});

test('Fe-rich specimens recommend Co radiation to reduce fluorescence risk', () => {
  assert.equal(SAMPLES.fe.recommended, 'Co');
  assert.equal(SAMPLES.magnetite.recommended, 'Co');
  assert.equal(SAMPLES.fe.ironRich, true);
  assert.equal(SOURCES.Co.filter, 'Fe');
  assert.equal(SOURCES.Cu.filter, 'Ni');
  assert.equal(SOURCES.Mo.filter, 'Zr');
});

test('wavelength can remove reflections but never generates an impossible alpha line', () => {
  const short = linesFor('cu','Mo',57.3,true);
  const long = linesFor('cu','Cr',57.3,true);
  assert.ok(short.length > long.length);
  assert.equal(reflection(2, 16, 1.5418, 57.3), null);
  assert.equal(reflection(0, 3, 1.54, 57.3), null);
  for (const x of short) assert.ok(x.d >= SOURCES.Mo.alpha/2);
});

test('filter removes Kβ lines; a Kβ-only reflection can be reachable', () => {
  const filtered = linesFor('cu','Cu',57.3,true);
  const unfiltered = linesFor('cu','Cu',57.3,false);
  assert.ok(filtered.every(x => x.kind === 'alpha'));
  for (const alpha of filtered) {
    const beta = unfiltered.find(x => x.kind === 'beta' && x.hkl === alpha.hkl);
    assert.ok(beta, alpha.hkl);
    assert.ok(beta.twoThetaDeg < alpha.twoThetaDeg);
  }
  // (422) has an inaccessible Cu Kα at this d, but Cu Kβ is still allowed.
  assert.ok(!filtered.some(x => x.hkl === '422'));
  assert.ok(unfiltered.some(x => x.hkl === '422' && x.kind === 'beta'));
});

test('lesson mounts bilingual selection guide and precaches the existing assets', () => {
  const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
  const html = read('index.html'), worker = read('service-worker.js');
  assert.match(html, /data-sub="s3camera"/);
  assert.match(html, /id="s3camera"/);
  assert.match(html, /id="debyeCameraLab"/);
  for (const id of ['dcSampleGuide','dcSourceGuide','dcDiameterGuide','dcReflectionGuide','dcSelectionWarning','dcCamera','dcFilm']) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
  assert.match(html, /id="dcSelectionWarning" role="status" hidden/);
  assert.match(html, /<summary><span data-l="tr">Yansımaların seçim kuralları/);
  assert.match(html, /src="\.\/debye-camera\.js"/);
  assert.match(html, /href="\.\/debye-camera\.css"/);
  assert.match(worker, /'\.\/debye-camera\.js'/);
  assert.match(worker, /'\.\/debye-camera\.css'/);
});
