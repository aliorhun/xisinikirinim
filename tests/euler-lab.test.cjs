// Run with: node --test tests/euler-lab.test.cjs
// Minimal DOM stubs verify the actual browser lesson without external packages.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const basedir = path.resolve(__dirname, '..');
const code = fs.readFileSync(path.join(basedir, 'euler-lab.js'), 'utf8');

function element() {
  return {
    textContent: '', innerHTML: '', value: '', attrs: {}, listeners: {}, dataset: {},
    addEventListener(event, handler) {this.listeners[event] = handler;},
    setAttribute(name, value) {this.attrs[name] = value;},
    closest() {return {hidden: false};}
  };
}

function lesson(language = 'tr') {
  const root = element(), dom = {};
  const ids = [
    'eulerPhase', 'eulerPhaseOutput', 'eulerCircle', 'eulerCurves', 'eulerPlay',
    'eulerCos', 'eulerSin', 'eulerExp', 'eulerFactor', 'eulerIntensity',
    'eulerWorked', 'eulerInterpretation'
  ];
  for (const id of ids) dom['#' + id] = element();
  const presets = [-180, -90, 0, 90, 180, 270, 360].map(deg => {
    const e = element();
    e.dataset.eulerDegree = String(deg);
    return e;
  });
  root.querySelector = selector => dom[selector];
  root.querySelectorAll = () => presets;
  const document = {
    documentElement: {lang: language},
    getElementById: id => id === 'eulerLab' ? root : null,
    addEventListener() {}
  };
  vm.runInNewContext(code, {
    document, window: {matchMedia: () => ({matches: false})},
    requestAnimationFrame: () => 1, cancelAnimationFrame() {}
  }, {filename: 'euler-lab.js'});
  return {
    root, dom,
    select(deg) {presets.find(p => +p.dataset.eulerDegree === deg).listeners.click();},
    read() {
      return {
        cos: dom['#eulerCos'].textContent,
        sin: dom['#eulerSin'].textContent,
        exp: dom['#eulerExp'].textContent,
        factor: dom['#eulerFactor'].textContent,
        intensity: dom['#eulerIntensity'].textContent
      };
    }
  };
}

test('Euler identity at π: e^(iπ) = −1 and 1 + e^(iπ) = 0', () => {
  const lab = lesson();
  assert.deepEqual(lab.read(), {
    cos: '−1', sin: '0', exp: '−1', factor: '0', intensity: '0%'
  });
  assert.match(lab.dom['#eulerCircle'].innerHTML, /euler-cos-line/);
  assert.match(lab.dom['#eulerCurves'].innerHTML, /euler-curve-sin/);
});

test('presets: 0, π/2, 3π/2, 2π and negative quarter turn', () => {
  const lab = lesson();
  lab.select(0);
  assert.deepEqual(lab.read(), {cos: '1', sin: '0', exp: '1', factor: '2', intensity: '100%'});
  lab.select(90);
  assert.deepEqual(lab.read(), {cos: '0', sin: '1', exp: 'i', factor: '1 + i', intensity: '50%'});
  lab.select(270);
  assert.deepEqual(lab.read(), {cos: '0', sin: '−1', exp: '−i', factor: '1 − i', intensity: '50%'});
  lab.select(360);
  assert.deepEqual(lab.read(), {cos: '1', sin: '0', exp: '1', factor: '2', intensity: '100%'});
  lab.select(-90);
  assert.deepEqual(lab.read(), {cos: '0', sin: '−1', exp: '−i', factor: '1 − i', intensity: '50%'});
});

test('angle slider updates numeric and graphical states', () => {
  const lab = lesson();
  lab.dom['#eulerPhase'].value = '180';
  lab.dom['#eulerPhase'].listeners.input();
  assert.equal(lab.read().factor, '0');
  lab.dom['#eulerPhase'].value = '0';
  lab.dom['#eulerPhase'].listeners.input();
  assert.equal(lab.read().factor, '2');
});

test('English copy is available, math values remain unchanged', () => {
  const lab = lesson('en');
  assert.match(lab.root.innerHTML, /Euler’s formula/);
  assert.equal(lab.read().exp, '−1');
  assert.match(lab.dom['#eulerInterpretation'].innerHTML, /destructive interference/);
});

test('static page mounts lesson and service worker precaches offline assets', () => {
  const page = fs.readFileSync(path.join(basedir, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(basedir, 'service-worker.js'), 'utf8');
  assert.match(page, /id="eulerLab" class="lab panel euler-lab"/);
  assert.match(page, /src="\.\/euler-lab\.js"/);
  assert.match(page, /href="\.\/euler-lab\.css"/);
  assert.match(sw, /'\.\/euler-lab\.js'/);
  assert.match(sw, /'\.\/euler-lab\.css'/);
});
