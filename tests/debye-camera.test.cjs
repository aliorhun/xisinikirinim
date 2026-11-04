// Run: node --test tests/debye-camera.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { reflection, linesFor, selectionFacts, SOURCES, SAMPLES } = require('../debye-camera.js');

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
  // Shorter Kβ wavelength can admit extra high-index reflections inaccessible to Kα.
  assert.ok(b.length >= 2 * a.length);
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


test('sample library spans FCC, BCC, diamond and rock-salt cubic structures', () => {
  const structures = new Set(Object.values(SAMPLES).map(x => x.structure));
  assert.ok(SAMPLES.fe && SAMPLES.ge && SAMPLES.nacl && SAMPLES.mgo);
  assert.equal(Object.keys(SAMPLES).length, 10);
  assert.deepEqual([...structures].sort(), ['BCC','FCC','diamond','rocksalt'].sort());
  assert.equal(Object.keys(SOURCES).length, 5);
});

test('listed reflections respect ideal lattice and basis selection rules', () => {
  for (const material of Object.values(SAMPLES)) {
    for (const line of material.lines) {
      const [h,k,l] = [...line.hkl].map(Number);
      assert.equal(line.n, h*h+k*k+l*l);
      const parity = [h%2,k%2,l%2];
      const allOddOrEven = parity.every(x => x === parity[0]);
      if (material.structure === 'BCC') assert.equal((h+k+l)%2,0, material.name+' '+line.hkl);
      if (material.structure === 'FCC' || material.structure === 'rocksalt') {
        assert.ok(allOddOrEven, material.name+' '+line.hkl);
      }
      if (material.structure === 'diamond') {
        assert.ok(allOddOrEven, material.name+' '+line.hkl);
        if (h%2 === 0) assert.equal((h+k+l)%4,0, material.name+' '+line.hkl);
      }
    }
  }
});

test('Co Kα is the recommended illustrative Fe case; Cu and Mo warn about Fe fluorescence', () => {
  const copper = selectionFacts('fe', 'Cu', 57.3, '110');
  const cobalt = selectionFacts('fe', 'Co', 57.3, '110');
  const molybdenum = selectionFacts('fe', 'Mo', 57.3, '110');
  assert.equal(copper.feFluorescenceWarning, true);
  assert.equal(molybdenum.feFluorescenceWarning, true);
  assert.equal(cobalt.feFluorescenceWarning, false);
  assert.equal(copper.mayExciteKFluorescence, true);
  assert.equal(cobalt.mayExciteKFluorescence, false);
  assert.ok(cobalt.selected && cobalt.selected.hkl === '110');
});

test('K-edge alerts cover Cr, Cu, Ni and Ge without claiming absolute background intensity', () => {
  assert.equal(selectionFacts('cr','Cu',57.3,'110').mayExciteKFluorescence, true);
  assert.equal(selectionFacts('cr','Cr',57.3,'110').mayExciteKFluorescence, false);
  assert.equal(selectionFacts('ni','Cu',57.3,'111').mayExciteKFluorescence, false);
  assert.equal(selectionFacts('ni','Mo',57.3,'111').mayExciteKFluorescence, true);
  assert.equal(selectionFacts('ge','Mo',57.3,'111').mayExciteKFluorescence, true);
  assert.equal(selectionFacts('cu','Cu',57.3,'111').mayExciteKFluorescence, false);
});

test('longer Cr radiation excludes some high-index peaks; selector can disable them', () => {
  const facts = selectionFacts('cu', 'Cr', 57.3, '111');
  assert.ok(facts.available > 0 && facts.unavailable > 0);
  assert.equal(facts.available + facts.unavailable, facts.total);
  assert.equal(selectionFacts('cu','Cr',57.3,'440').selected, null);
});

test('film mm/degree scale matches the historic 57.3 and 114.6 mm diameters', () => {
  const small = selectionFacts('cu', 'Cu', 57.3, '111');
  const large = selectionFacts('cu', 'Cu', 114.6, '111');
  almost(small.mmPerDegree, .5000368, 1e-4);
  almost(large.mmPerDegree, 2*small.mmPerDegree);
  almost(small.selected.twoThetaDeg, large.selected.twoThetaDeg);
});

test('mounting and offline caching follow existing project conventions', () => {
  const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
  const html = read('index.html'), worker = read('service-worker.js');
  assert.match(html, /data-sub="s3camera"/);
  assert.match(html, /id="s3camera"/);
  assert.match(html, /id="debyeCameraLab"/);
  assert.match(html, /id="dcCamera"/);
  assert.match(html, /id="dcFilm"/);
  assert.match(html, /id="dcSelectionAdvice"/);
  assert.match(html, /value="fe"/);
  assert.match(html, /value="mgo"/);
  assert.match(html, /value="Co"/);
  assert.match(html, /src="\.\/debye-camera\.js"/);
  assert.match(html, /href="\.\/debye-camera\.css"/);
  assert.match(worker, /'\.\/debye-camera\.js'/);
  assert.match(worker, /'\.\/debye-camera\.css'/);
});
