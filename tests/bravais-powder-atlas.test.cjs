// Run: node --test tests/bravais-powder-atlas.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const A = require('../bravais-powder-atlas.js');
const near = (actual, expected, eps = 1e-8) =>
  assert.ok(Math.abs(actual - expected) <= eps, 'expected ' + actual + ' ≈ ' + expected);

test('atlas contains all seven systems, 14 Bravais lattices and two materials each', () => {
  assert.equal(A.ATLAS.length, 7);
  const lattices = A.ATLAS.flatMap(s => s.lattices);
  assert.deepEqual(lattices.map(s => s.id).sort(), [
    'aP', 'cF', 'cI', 'cP', 'hP', 'hR', 'mC', 'mP', 'oC', 'oF', 'oI', 'oP', 'tI', 'tP'
  ]);
  for (const lattice of lattices) {
    assert.equal(lattice.examples.length, 2, lattice.id);
    for (const sample of lattice.examples) {
      assert.ok(sample.cell.every(Number.isFinite), sample.formula + ' cell parameters are finite');
      assert.ok(sample.cell.every((v, i) => i < 3 ? v > 0 : v > 0 && v < 180));
    }
  }
});

test('reciprocal metrics work for cubic, tetragonal, hexagonal and skewed cells', () => {
  near(A.dSpacing([4,4,4,90,90,90], 1,1,1), 4 / Math.sqrt(3));
  near(A.dSpacing([3,3,5,90,90,90], 0,0,2), 2.5);
  near(A.dSpacing([3,3,5,90,90,120], 1,0,0), 3*Math.sqrt(3)/2);
  near(A.dSpacing([5,6,7,90,108,90], 0,0,1), 7*Math.sin(108*Math.PI/180));
  assert.equal(A.dSpacing([4,4,4,90,90,90], 0,0,0), Infinity);
  assert.throws(() => A.reciprocalBasis([0,2,3,90,90,90]), RangeError);
});

test('centering selection rules are correct, including negative Miller indices', () => {
  const allow = A.allowedByCentering;
  assert.equal(allow('P',1,0,0), true);
  assert.equal(allow('I',1,0,0), false);
  assert.equal(allow('I',1,1,0), true);
  assert.equal(allow('F',1,1,1), true);
  assert.equal(allow('F',1,-1,1), true);
  assert.equal(allow('F',1,0,1), false);
  assert.equal(allow('F',2,0,-2), true);
  assert.equal(allow('C',1,0,0), false);
  assert.equal(allow('C',1,-1,0), true);
  assert.equal(allow('R',1,0,4), true);
  assert.equal(allow('R',0,0,3), true);
  assert.equal(allow('R',0,0,2), false);
});

test('powder lines follow Cu Kalpha Bragg angles and exclude forbidden reflections', () => {
  const fe = A.ATLAS[0].lattices.find(x => x.id === 'cI');
  const copper = A.ATLAS[0].lattices.find(x => x.id === 'cF');
  const ironPeaks = A.powderLines(fe.examples[0].cell, 'I');
  const copperPeaks = A.powderLines(copper.examples[0].cell, 'F');
  near(ironPeaks[0].twoTheta, 44.67, 0.25); // bcc Fe (110)
  near(copperPeaks[0].twoTheta, 43.30, 0.25); // fcc Cu (111)
  for (const lattice of A.ATLAS.flatMap(s => s.lattices)) {
    for (const sample of lattice.examples) {
      const lines = A.powderLines(sample.cell, lattice.centering);
      assert.ok(lines.length > 0 && lines.length <= 18, sample.formula);
      lines.forEach((p, i) => {
        assert.ok(p.twoTheta >= 10 && p.twoTheta <= 110);
        assert.ok(A.allowedByCentering(lattice.centering, p.h, p.k, p.l));
        if (i) assert.ok(p.twoTheta > lines[i-1].twoTheta, 'strictly increasing angles');
        const reconstructed = 2 * Math.asin(A.LAMBDA / (2 * A.dSpacing(sample.cell,p.h,p.k,p.l))) * 180 / Math.PI;
        near(p.twoTheta, reconstructed, 1e-8);
      });
    }
  }
});

test('the new atlas is below the active 2theta scanner and available offline', () => {
  const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const html = read('index.html'), sw = read('service-worker.js');
  const active = html.indexOf('id="c3p"'), atlas = html.indexOf('id="bravaisPowderAtlas"');
  const exercises = html.indexOf('id="s3ex"');
  assert.ok(active > 0 && active < atlas && atlas < exercises);
  assert.match(html, /<link rel="stylesheet" href="\.\/bravais-powder-atlas\.css">/);
  assert.match(html, /<script src="\.\/bravais-powder-atlas\.js"><\/script>/);
  assert.match(sw, /'\.\/bravais-powder-atlas\.js'/);
  assert.match(sw, /'\.\/bravais-powder-atlas\.css'/);
  assert.match(sw, /xisinikirinim-offline-v14/);
});


test('compact comparison produces one shared-axis chart instead of 28 full-size films', () => {
  const sample = A.SAMPLES.filter(s => A.DEFAULT_IDS.includes(s.id));
  assert.equal(A.SAMPLES.length, 28);
  assert.equal(sample.length, 4);
  const rows = A.referenceSvg(sample, false, 'rows');
  const overlay = A.referenceSvg(sample, false, 'overlay');
  assert.match(rows, /class="bp-chart"/);
  assert.match(rows, /bp-chart-peak/);
  assert.match(rows, /bp-chart-label/);
  assert.doesNotMatch(rows, /bp-film/);
  assert.equal((rows.match(/class="bp-chart-label"/g) || []).length, 4);
  assert.equal((overlay.match(/class="bp-overlay-series/g) || []).length, 4);
  assert.equal((rows.match(/class="bp-chart-grid"/g) || []).length, 11);
  assert.equal((overlay.match(/class="bp-chart-grid"/g) || []).length, 11);
  assert.ok(overlay.length > 3000, 'all selected lines are in one chart');
  // All materials use 10°–110° and the same x coordinate; changing
  // visualization mode must not alter the angle.
  const angle = 2 * Math.asin(A.LAMBDA / (2 * A.dSpacing(sample[0].example.cell, 1,1,0))) * 180 / Math.PI;
  const x = (142 + (970 - 142 - 20) * (angle-10)/100).toFixed(2);
  if (angle >= 10 && angle <= 110 && A.allowedByCentering(sample[0].lattice.centering, 1,1,0)) {
    assert.ok(rows.includes('x1="' + x + '"'));
    assert.ok(overlay.includes('x1="' + x + '"'));
  }
});

test('material filter chips, reset, empty state, overlay and language rerender all work', () => {
  const vm = require('node:vm');
  const source = fs.readFileSync(path.join(__dirname,'..','bravais-powder-atlas.js'), 'utf8');
  const listeners = {};
  const host = {
    innerHTML: '',
    addEventListener(name, callback) { listeners[name] = callback; }
  };
  const rootElement = { lang: 'tr' };
  let langChanged;
  class FakeObserver {
    constructor(fn) { langChanged = fn; }
    observe() {}
  }
  const fakeDoc = {
    readyState: 'complete',
    documentElement: rootElement,
    getElementById(name) { return name === 'bravaisPowderAtlas' ? host : null; }
  };
  vm.runInNewContext(source, { document:fakeDoc, MutationObserver:FakeObserver });
  const initial = host.innerHTML;
  assert.equal((initial.match(/class="bp-chart"/g)||[]).length, 1);
  assert.equal((initial.match(/data-bp-id="/g)||[]).length, 28);
  assert.match(initial, /4\/28 seçili/);

  const click = (attr,value) => {
    listeners.click({ target:{
      closest() {
        return {
          hasAttribute(name) { return name === attr; },
          getAttribute(name) { return name === attr ? value : null; }
        };
      }
    } });
  };
  click('data-bp-action','overlay');
  assert.match(host.innerHTML, /bp-overlay-series/);
  assert.match(host.innerHTML, /bp-legend-item/);
  assert.match(host.innerHTML, /4\/28 seçili/);
  click('data-bp-id','cI-0');
  assert.match(host.innerHTML, /3\/28 seçili/);
  click('data-bp-action','clear');
  assert.match(host.innerHTML, /Grafik boş/);
  assert.doesNotMatch(host.innerHTML, /class="bp-chart"/);
  click('data-bp-action','default');
  assert.match(host.innerHTML, /4\/28 seçili/);
  click('data-bp-action','filters');
  assert.doesNotMatch(host.innerHTML, /data-bp-id="/);
  assert.match(host.innerHTML, /Filtreleri göster/);
  click('data-bp-action','filters');
  assert.equal((host.innerHTML.match(/data-bp-id="/g)||[]).length, 28);
  rootElement.lang = 'en';
  langChanged([{attributeName:'lang'}]);
  assert.match(host.innerHTML, /Material filters/);
  assert.match(host.innerHTML, /4\/28 selected/);
});
