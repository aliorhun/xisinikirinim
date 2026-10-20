"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {physical, dataset} = require("../learning-games.js");

test("all seven chapters have two game modes and every outcome is assessed", () => {
  assert.equal(Object.keys(dataset.goals).length, 7);
  let total = 0;
  for (let chapter = 1; chapter <= 7; chapter++) {
    const goals = dataset.goals[chapter], quizzes = dataset.questions[chapter];
    assert.ok(goals.length >= 5);
    assert.ok(quizzes.some(q => q.mode === 0));
    assert.ok(quizzes.some(q => q.mode === 1));
    const covered = new Set();
    for (const q of quizzes) {
      total++;
      covered.add(q.g);
      assert.ok(q.g >= 0 && q.g < goals.length, "valid outcome index");
      assert.match(q.sub, /^s[1-7][a-z]+$/);
      assert.ok(q.answer >= 0 && q.answer < q.choices.length);
      assert.equal(q.errors.length, q.choices.length);
      assert.ok(q.ask.includes("¦"), "bilingual question");
      assert.ok(q.why.includes("¦"), "bilingual explanation");
      q.choices.forEach(choice => assert.ok(choice.includes("¦") || !choice.includes(" "), "bilingual or language-neutral answer"));
      q.errors.forEach((why, i) => {
        if (i !== q.answer) assert.ok(why.includes("¦"), "specific bilingual misconception");
      });
    }
    assert.equal(covered.size, goals.length, "no main chapter outcome unassessed");
  }
  assert.equal(total, 38);
});

test("every one of the remaining 21 subsections gains outcomes and a mapped game question", () => {
  const subsections = Object.keys(dataset.subGoals);
  assert.equal(subsections.length, 21);
  const questions = Object.values(dataset.questions).flat();
  for (const id of subsections) {
    assert.ok(dataset.subGoals[id].length >= 2);
    assert.ok(questions.some(q => q.sub === id), id + " must have a teaching challenge");
  }
});

test("cubic d, Bragg 2θ and inverse lattice parameter are consistent", () => {
  assert.equal(physical.dCubic(4,1,0,0), 4);
  assert.ok(Math.abs(physical.dCubic(4,1,1,0)-4/Math.sqrt(2)) < 1e-12);
  const twoTheta = physical.twoTheta(1.5406,2);
  assert.ok(Math.abs(twoTheta-45.30610552) < 1e-6);
  assert.ok(Math.abs(physical.cubicA(1.5406,twoTheta,2,0,0)-4) < 1e-10);
  assert.ok(Number.isNaN(physical.twoTheta(1.5406,.2)), "inaccessible Bragg reflection");
});

test("centering extinctions do not confuse BCC with FCC", () => {
  assert.equal(physical.allowed("P",1,0,0),true);
  assert.equal(physical.allowed("I",1,0,0),false);
  assert.equal(physical.allowed("I",1,1,0),true);
  assert.equal(physical.allowed("F",1,0,0),false);
  assert.equal(physical.allowed("F",1,1,0),false);
  assert.equal(physical.allowed("F",1,1,1),true);
  assert.equal(physical.allowed("F",2,0,0),true);
});

test("equal-amplitude waves cancel at π, reinforce at 2π; domain broadening behaves correctly", () => {
  const lambda=1.5406, d=lambda/2;
  assert.ok(physical.phaseIntensity(d,30,lambda)<1e-20);
  assert.ok(Math.abs(physical.phaseIntensity(d,90,lambda)-4)<1e-12);
  assert.ok(physical.whDegrees(20,.001,30)>physical.whDegrees(80,.001,30));
  assert.ok(physical.whDegrees(80,.003,55)>physical.whDegrees(80,.001,55));
});

test("offline assets and integration entrypoints are referenced", () => {
  const index=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
  const sw=fs.readFileSync(path.join(__dirname,"..","service-worker.js"),"utf8");
  for (const file of ["learning-games.js","learning-games.css"]) {
    assert.ok(index.includes("./"+file),file+" missing from index");
    assert.ok(sw.includes("./"+file),file+" missing from offline shell");
  }
});
