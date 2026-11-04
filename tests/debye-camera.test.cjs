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

test('selection guidance uses exactly four accessible tabs and a single shared panel', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'debye-camera.css'), 'utf8');
  const section = html.match(/<section id="dcSelectionAdvice"[\s\S]*?<\/section>/)?.[0];
  assert.ok(section);
  assert.equal((section.match(/role="tab"/g) || []).length, 4);
  assert.equal((section.match(/role="tabpanel"/g) || []).length, 1);
  assert.equal((section.match(/aria-selected="true"/g) || []).length, 1);
  assert.equal((section.match(/aria-controls="dcAdvicePanel"/g) || []).length, 4);
  for (const id of ['dcAdviceTabSample','dcAdviceTabRadiation','dcAdviceTabDiameter','dcAdviceTabReflection']) {
    assert.match(section, new RegExp('id="' + id + '"'));
  }
  assert.match(css, /\.dc-advice-tabs\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(css, /overflow-x:auto/);
});

test('advice tab selection survives input changes and supports arrow/Home/End', () => {
  const vm = require('node:vm');
  const code = fs.readFileSync(path.join(__dirname, '..', 'debye-camera.js'), 'utf8');
  function makeElement(value='', tagName='SELECT') {
    const node = {
      value, tagName, checked:false, textContent:'', innerHTML:'', disabled:false,
      children:[], attrs:{}, listeners:{}, options:[],
      addEventListener(event, fn) { this.listeners[event] = fn; },
      setAttribute(name, value) { this.attrs[name] = value; },
      focus() { this.focused = true; },
      replaceChildren() { this.children=[]; this.options=this.children; this.value=''; },
      append(...children) { this.children.push(...children); }
    };
    return node;
  }
  const ids=['dcSample','dcSource','dcDiameter','dcFilter','dcRotation','dcReflection',
    'dcReadout','dcInterpretation','dcAdvicePanel','dcAdviceHeading','dcAdviceDescription'];
  const dom=Object.fromEntries(ids.map(id => [id, makeElement()]));
  dom.dcSample.value='cu';
  dom.dcSource.value='Cu';
  dom.dcDiameter.value='57.3';
  dom.dcFilter.checked=true;
  dom.dcRotation.checked=true;
  dom.dcFilter.nextElementSibling={textContent:''};
  const tabs=['Sample','Radiation','Diameter','Reflection'].map(key => {
    const e=makeElement('', 'BUTTON');
    e.id='dcAdviceTab'+key;
    return e;
  });
  dom.dcSelectionAdvice={querySelectorAll:() => tabs};
  const ctx={};
  for (const name of ['setTransform','clearRect','beginPath','arc','stroke','fill',
    'setLineDash','moveTo','lineTo','fillRect','strokeRect','fillText']) ctx[name]=()=>{};
  for (const name of ['dcCamera','dcFilm']) {
    dom[name]={getBoundingClientRect:()=>({width:440}),getContext:()=>ctx};
  }
  const lab={querySelector(selector){return dom[selector.slice(1)] || null;}};
  const win={devicePixelRatio:1,addEventListener(){},requestAnimationFrame(fn){fn();}};
  const document={
    documentElement:{lang:'tr'},
    getElementById(id){return id==='debyeCameraLab' ? lab : null;},
    querySelector(){return null;},
    createElement(tag){return makeElement('',tag.toUpperCase());}
  };
  vm.runInNewContext(code,{
    document,globalThis:win,module:{exports:{}},
    getComputedStyle:()=>({getPropertyValue:()=>''})
  });
  assert.equal(tabs[0].attrs['aria-selected'],'true');
  assert.equal(dom.dcAdvicePanel.attrs['aria-labelledby'],tabs[0].id);
  tabs[1].listeners.click();
  assert.equal(tabs[1].attrs['aria-selected'],'true');
  assert.match(dom.dcAdviceHeading.textContent,/Işınım/);
  const original=dom.dcAdviceDescription.textContent;
  dom.dcSource.value='Co';dom.dcSource.listeners.change();
  assert.equal(tabs[1].attrs['aria-selected'],'true');
  assert.match(dom.dcAdviceDescription.textContent,/Co Kα/);
  assert.notEqual(dom.dcAdviceDescription.textContent,original);
  tabs[1].listeners.keydown({key:'ArrowRight',preventDefault(){}});
  assert.equal(tabs[2].attrs['aria-selected'],'true');
  assert.equal(dom.dcAdvicePanel.attrs['aria-labelledby'],tabs[2].id);
  assert.equal(tabs[2].focused,true);
  tabs[2].listeners.keydown({key:'End',preventDefault(){}});
  assert.equal(tabs[3].attrs['aria-selected'],'true');
  tabs[3].listeners.keydown({key:'Home',preventDefault(){}});
  assert.equal(tabs[0].attrs['aria-selected'],'true');
});

test('experiment selectors follow the guidance tabs and precede the visualizations', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const start = html.indexOf('id="debyeCameraLab"');
  const end = html.indexOf('id="dcCamera"', start);
  assert.ok(start >= 0 && end > start);
  const lesson = html.slice(start, end);
  const guide = lesson.indexOf('id="dcSelectionAdvice"');
  const guidePanel = lesson.indexOf('id="dcAdvicePanel"');
  const controls = lesson.indexOf('class="dc-controls"');
  const sample = lesson.indexOf('id="dcSample"');
  const radiation = lesson.indexOf('id="dcSource"');
  const diameter = lesson.indexOf('id="dcDiameter"');
  const reflection = lesson.indexOf('id="dcReflection"');
  const filter = lesson.indexOf('id="dcFilter"');
  const rotation = lesson.indexOf('id="dcRotation"');
  const visual = lesson.indexOf('class="dc-visuals"');
  assert.ok(guide > -1 && guide < guidePanel && guidePanel < controls);
  assert.ok(controls < sample && sample < radiation && radiation < diameter);
  assert.ok(diameter < reflection && reflection < filter && filter < rotation && rotation < visual);
  assert.equal((lesson.match(/class="dc-controls"/g) || []).length, 1);
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
