'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { SYSTEMS, cellVectors, cellSvg } = require('../crystal-systems.js');

const length = v => Math.hypot(...v);
const dot = (u,v) => u.reduce((s,n,i) => s+n*v[i],0);
const angle = (u,v) => Math.acos(Math.max(-1,Math.min(1,dot(u,v)/length(u)/length(v))))*180/Math.PI;

test('seven distinct crystal systems (rhombohedral axes belong to trigonal)', () => {
  assert.equal(SYSTEMS.length,7);
  assert.equal(new Set(SYSTEMS.map(s=>s.id)).size,7);
  assert.deepEqual(SYSTEMS.map(s=>s.id),
    ['triclinic','monoclinic','orthorhombic','tetragonal','trigonal','hexagonal','cubic']);
});

test('3D basis vectors reproduce the chosen cell lengths and crystallographic angles', () => {
  for(const s of SYSTEMS){
    const {a,b,c} = cellVectors(s.cell);
    const [A,B,C,alpha,beta,gamma] = s.cell;
    const check = (got,want) => assert.ok(Math.abs(got-want)<1e-8, s.id+': '+got+' should be '+want);
    check(length(a),A);check(length(b),B);check(length(c),C);
    check(angle(b,c),alpha);check(angle(a,c),beta);check(angle(a,b),gamma);
  }
});

test('every rendered diagram has 12 edges, 8 vertices and the appropriate axis labels', () => {
  for(const s of SYSTEMS){
    const svg=cellSvg(s,false);
    assert.match(svg,/^<svg /);
    assert.equal((svg.match(/<line /g)||[]).length,12,s.id);
    assert.equal((svg.match(/<circle /g)||[]).length,8,s.id);
    const labels=s.id==='tetragonal'?['a','c']:['a','b','c'];
    for(const axis of labels) assert.match(svg,new RegExp('>'+axis+'</text>'));
    if(s.id==='tetragonal') assert.doesNotMatch(svg,/>b<\/text>/);
    assert.match(cellSvg(s,true),/role="img"/);
  }
});

test('invalid cells are rejected instead of rendering fictitious geometry', () => {
  assert.throws(()=>cellVectors([1,1,1,90,90,0]),RangeError);
  assert.throws(()=>cellVectors([1,1,1,10,10,170]),RangeError);
});

test('tetragonal caption uses only independent a and c, while keeping a=b geometry', () => {
  const tetragonal=SYSTEMS.find(system=>system.id==='tetragonal');
  assert.ok(tetragonal);
  assert.equal(tetragonal.cell[0],tetragonal.cell[1]);
  assert.notEqual(tetragonal.cell[0],tetragonal.cell[2]);
  assert.equal(tetragonal.trLengths,'a ≠ c · kare taban');
  assert.equal(tetragonal.enLengths,'a ≠ c · square base');
  for(const english of [false,true]) {
    const svg=cellSvg(tetragonal,english);
    assert.equal((svg.match(/class="cell-axis-label"/g)||[]).length,2);
    assert.doesNotMatch(svg,/>b<\/text>/);
    assert.doesNotMatch(svg,/aria-label="[^"]*a, b and c/);
  }
});
