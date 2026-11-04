// Run: node --test tests/debye-camera.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { reflection, linesFor, SOURCES, SAMPLES } = require('../debye-camera.js');

const almost = (actual, expected, eps = 1e-8) =>
  assert.ok(Math.abs(actual - expected) < eps, `expected ${actual} ≈ ${expected}`);

test('Cu FCC (111) Cu Kα: Bragg angle and cylindrical film distance', () => {
  const a = SAMPLES.cu.a, lambda = SOURCES.Cu.alpha, diameter = 57.3;
  const r = reflection(a, 3, lambda, diameter);
  almost(r.d, a / Math.sqrt(3));
  almost(r.twoThetaDeg, 2 * Math.asin(lambda * Math.sqrt(3) / (2 * a)) * 180 / Math.PI);
  almost(r.arcMm, diameter / 2 * r.twoThetaDeg * Math.PI / 180);
  almost(r.filmPositionsMm[0], -r.arcMm);
  almost(r.filmPositionsMm[1], r.arcMm);
  assert.ok(r.twoThetaDeg > 43 && r.twoThetaDeg < 44);
});

test('diameter doubles arc distance, not the Bragg angle', () => {
  const r1 = reflection(3.615, 3, 1.5418, 57.3);
  const r2 = reflection(3.615, 3, 1.5418, 114.6);
  almost(r1.twoThetaDeg, r2.twoThetaDeg);
  almost(r2.arcMm, 2 * r1.arcMm);
});

test('shorter Mo wavelength shifts a given allowed reflection to smaller 2θ', () => {
  const cu = reflection(3.615, 3, SOURCES.Cu.alpha, 57.3);
  const mo = reflection(3.615, 3, SOURCES.Mo.alpha, 57.3);
  assert.ok(mo.twoThetaDeg < cu.twoThetaDeg);
});

test('Kβ adds lower-angle lines only when filter is disabled', () => {
  const a = linesFor('cu', 'Cu', 57.3, true);
  const b = linesFor('cu', 'Cu', 57.3, false);
  assert.ok(a.length > 0);
  assert.ok(a.every(x => x.kind === 'alpha'));
  assert.equal(b.length, 2 * a.length);
  for (const alpha of a) {
    const beta = b.find(x => x.kind === 'beta' && x.hkl === alpha.hkl);
    assert.ok(beta);
    assert.ok(beta.twoThetaDeg < alpha.twoThetaDeg);
  }
});

test('inaccessible reflections are omitted, not silently clamped to 180°', () => {
  assert.equal(reflection(2, 16, 1.5418, 57.3), null);
  assert.equal(reflection(0, 3, 1.54, 57.3), null);
});

test('diamond Si sample excludes the forbidden (200) reflection', () => {
  assert.ok(SAMPLES.si.lines.some(x => x.hkl === '220'));
  assert.ok(!SAMPLES.si.lines.some(x => x.hkl === '200'));
});

test('mounting and offline caching follow existing project conventions', () => {
  const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
  const html = read('index.html'), worker = read('service-worker.js');
  assert.match(html, /data-sub="s3camera"/);
  assert.match(html, /id="s3camera"/);
  assert.match(html, /id="debyeCameraLab"/);
  assert.match(html, /id="dcCamera"/);
  assert.match(html, /id="dcFilm"/);
  assert.match(html, /src="\.\/debye-camera\.js"/);
  assert.match(html, /href="\.\/debye-camera\.css"/);
  assert.match(worker, /'\.\/debye-camera\.js'/);
  assert.match(worker, /'\.\/debye-camera\.css'/);
});
