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

test('every rendered diagram has 12 edges, 8 vertices and 3 axis labels', () => {
  for(const s of SYSTEMS){
    const svg=cellSvg(s,false);
    assert.match(svg,/^<svg /);
    assert.equal((svg.match(/<line /g)||[]).length,12,s.id);
    assert.equal((svg.match(/<circle /g)||[]).length,8,s.id);
    for(const a of ['a','b','c']) assert.match(svg,new RegExp('>'+a+'</text>'));
    assert.match(cellSvg(s,true),/role="img"/);
  }
});

test('invalid cells are rejected instead of rendering fictitious geometry', () => {
  assert.throws(()=>cellVectors([1,1,1,90,90,0]),RangeError);
  assert.throws(()=>cellVectors([1,1,1,10,10,170]),RangeError);
});