// Run: node --test tests/powder-exercises.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const PE = require('../powder-exercises.js');

const near = (actual, expected, eps) =>
  assert.ok(Math.abs(actual - expected) <= eps, `expected ${actual} ≈ ${expected} (±${eps})`);
const R = PE.solve();
const accepted = s => PE.cubicSearch(s).filter(r => r.ok).map(r => r.m + r.lattice);

test('Algorithm 1: radian/degree conversions round-trip and match the PDF example', () => {
  const th = PE.thetaRad(0.1118);
  near(th, 0.3409314, 1e-6);
  near(PE.twoThetaDeg(0.1118), 2 * th * 180 / Math.PI, 1e-12);
  near(PE.sin2FromTwoTheta(PE.twoThetaDeg(0.4321)), 0.4321, 1e-12);
  near(PE.sin2FromTwoTheta(38.43), 0.1083, 5e-5); // Tozkirinim007.pdf s. 5
});

test('Nelson–Riley uses theta in radians', () => {
  const s = 0.981, t = Math.asin(Math.sqrt(s)), c2 = Math.cos(t) ** 2;
  near(PE.nelsonRiley(s), 0.5 * (c2 / Math.sin(t) + c2 / t), 1e-15);
  assert.ok(PE.nelsonRiley(0.1118) > PE.nelsonRiley(0.981), 'f decreases towards 90°');
});

test('Algorithm 3 (cubic ratio search) accepts exactly the expected lattices', () => {
  assert.deepEqual(accepted(PE.DATA.p101), ['3F']);
  assert.deepEqual(accepted([.321, .638, .958]), ['1P', '2I']); // 10-2 Kα: genuine P/I ambiguity
  assert.deepEqual(accepted(PE.DATA.p103), []);
  assert.deepEqual(accepted(PE.DATA.p104), ['3D']);
  assert.deepEqual(accepted(PE.DATA.p105), ['2I']);
  assert.deepEqual(accepted(PE.DATA.p106), []);
  const al = PE.cubicSearch(PE.DATA.p101).find(r => r.m === 3 && r.lattice === 'F');
  assert.deepEqual(al.N, [3, 4, 8, 11, 12, 16, 19, 20, 24, 27], 'nearest allowed N, not plain rounding');
});

test('10-1 aluminium: mean, least-squares K and Nelson–Riley extrapolation', () => {
  near(R.p101.a[0], 3.9901, 1e-4);
  near(R.p101.mean, 4.0252, 1e-4);
  near(R.p101.lsq.a, 4.0376, 1e-4);
  near(R.p101.nr.intercept, 4.0445, 2e-4);
  near(R.p101.nr.intercept, PE.REF.Al, 0.006);
});

test('10-2: Kα/Kβ pairing, intensities and α-Fe lattice parameter', () => {
  const pk = R.p102.pairing;
  near(pk.r, 0.8281, 1e-4);
  assert.deepEqual(pk.pairs.map(p => [p.beta, p.alpha]), [[0, 1], [2, 3], [4, 5]]);
  const rank = { vs: 4, s: 3, m: 2, w: 1 }, I = PE.DATA.p102.I;
  pk.pairs.forEach(p => assert.ok(rank[I[p.beta]] < rank[I[p.alpha]], 'Kβ partner is weaker'));
  near(R.p102.mean, PE.REF.Fe, 0.003);
  near(R.p102.aIfPrimitive, 2.02, 0.01);
});

test('10-3 indium: body-centred tetragonal fit and complete line list', () => {
  near(R.p103.a, 3.248, 0.002);
  near(R.p103.c, 4.950, 0.002);
  R.p103.assign.forEach(([, , hkl]) => assert.equal([...hkl].reduce((x, d) => x + +d, 0) % 2, 0));
  assert.equal(R.p103.expected.length, 8, 'model predicts exactly the 8 observed lines');
  R.p103.expected.forEach(e => assert.ok(R.p103.S.some(s => Math.abs(s - e.sin2) < 0.0015)));
});

test('10-4 silicon and 10-5 tungsten', () => {
  near(R.p104.mean, PE.REF.Si, 0.004);
  assert.deepEqual(R.p104.fccMissing.map(x => x.N), [4, 12, 20]);
  near(R.p105.nr.intercept, 3.167, 0.002);
  assert.ok(Math.abs(R.p105.nr.intercept - PE.REF.W) < Math.abs(R.p105.nr.intercept - PE.REF.Mo), 'W, not Mo');
});

test('10-6 magnesium: HCP fit, extinctions and the inconsistent 0.0913 line', () => {
  near(R.p106.a, 3.205, 0.002);
  near(R.p106.c, 5.205, 0.002);
  near(R.p106.expected101, 0.0989, 2e-4);
  const ext = R.p106.expected.filter(e => e.extinct).map(e => e.hkl).sort();
  assert.deepEqual(ext, ['001', '003', '111']);
  const visible = R.p106.expected.filter(e => !e.extinct);
  assert.equal(visible.length, 8);
  const bad = visible.filter(e => !R.p106.S.some(s => Math.abs(s - e.sin2) < 0.0015)).map(e => e.hkl);
  assert.deepEqual(bad, ['101']);
});

test('page wiring: cones moved into the camera tab, exercises tab, offline cache', () => {
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');
  assert.doesNotMatch(html, /data-sub="s3b"/, 'no separate cones sub-tab');
  const cam = html.indexOf('id="s3camera"'), cones = html.indexOf('id="s3b"'), lab = html.indexOf('id="debyeCameraLab"');
  assert.ok(cam > 0 && cam < cones && cones < lab, 'cones block sits at the top of the camera tab');
  assert.match(html, /data-sub="s3ex"/);
  assert.match(html, /<div class="subp" id="s3ex" hidden>\s*<div id="powderExercises"><\/div>/);
  assert.match(html, /powder-exercises\.css/);
  assert.match(html, /<script src="\.\/powder-exercises\.js"><\/script>/);
  assert.match(sw, /'\.\/powder-exercises\.js'/);
  assert.match(sw, /'\.\/powder-exercises\.css'/);
  const nav = html.slice(html.indexOf('aria-label="Toz yöntemi alt bölümleri"'), html.indexOf('id="s3a"'));
  assert.equal((nav.match(/role="tab"/g) || []).length, 6, 'six static sub-tabs (games tab is added at runtime)');
});
