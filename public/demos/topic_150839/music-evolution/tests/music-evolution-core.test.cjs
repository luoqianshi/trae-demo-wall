const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const corePath = path.resolve(__dirname, "..", "music-evolution-core.js");
let core = {};
try {
  core = require(corePath);
} catch (error) {
  core = {};
}

test("growth stages are user-controlled and end at sixteen bars", () => {
  assert.equal(typeof core.createInitialSession, "function");
  assert.deepEqual(core.GROWTH_STAGES.map((stage) => stage.bars), [2, 4, 8, 12, 16]);
  const session = core.createInitialSession({ seed: 11, populationSize: 8 });
  assert.equal(session.stageIndex, 0);
  assert.equal(session.stageBars, 2);
  assert.equal(session.evolutionRound, 1);
  assert.equal(session.population.length, 8);
  assert.equal(session.stageContract, null);
  assert.equal(session.rootMotif, null);
});

test("growing a selected melody preserves locked bars", () => {
  assert.equal(typeof core.growFromParent, "function");
  const session = core.createInitialSession({ seed: 21, populationSize: 8 });
  const parent = session.population[0];
  const grown = core.growFromParent(parent, session, {
    seed: 22,
    intent: "continue",
    boundaryPolicy: "light",
  });
  assert.equal(grown.bars.length, 4);
  assert.deepEqual(grown.bars[0], parent.bars[0]);
  assert.ok(core.boundaryChangeCount(parent.bars[1], grown.bars[1]) <= 2);
  assert.ok(grown.bars.every((bar) => core.barDuration(bar) === 4));
});

function advanceToStage(stageIndex, seed = 100) {
  let session = core.createInitialSession({ seed, populationSize: 8 });
  for (let index = 0; index < stageIndex; index += 1) {
    session = core.freezeAndGrow(session, session.population[0].id, {
      seed: seed + index + 1,
      intent: "continue",
      boundaryPolicy: "light",
    });
  }
  return session;
}

test("strict boundary stays byte-identical through unlimited stage evolution", () => {
  let session = core.createInitialSession({ seed: 201, populationSize: 8 });
  session = core.freezeAndGrow(session, session.population[0].id, {
    seed: 202,
    intent: "continue",
    boundaryPolicy: "strict",
  });
  const anchor = structuredClone(session.stageContract.boundaryAnchor);
  for (let round = 0; round < 12; round += 1) {
    session = core.evolvePopulation(session, [session.population[0].id], { seed: 203 + round, references: [] });
    session.population.forEach((candidate) => assert.deepEqual(candidate.bars[1], anchor));
  }
});

test("light boundary never exceeds two anchor-relative changes after many rounds", () => {
  let session = core.createInitialSession({ seed: 221, populationSize: 8 });
  session = core.freezeAndGrow(session, session.population[0].id, {
    seed: 222,
    intent: "continue",
    boundaryPolicy: "light",
  });
  const anchor = structuredClone(session.stageContract.boundaryAnchor);
  for (let round = 0; round < 12; round += 1) {
    session = core.evolvePopulation(session, [session.population[0].id], { seed: 223 + round, references: [] });
    session.population.forEach((candidate) => {
      assert.ok(core.boundaryChangeCount(anchor, candidate.bars[1]) <= 2);
    });
  }
});

test("freeze stores explicit stage decisions and rejects missing or invalid choices", () => {
  const session = core.createInitialSession({ seed: 231, populationSize: 8 });
  const parent = session.population[0];

  assert.throws(
    () => core.freezeAndGrow(session, parent.id, { seed: 232 }),
    /growth intent/i,
  );
  assert.throws(
    () => core.freezeAndGrow(session, parent.id, {
      seed: 232,
      intent: "repeat",
      boundaryPolicy: "strict",
    }),
    /growth intent/i,
  );
  assert.throws(
    () => core.freezeAndGrow(session, parent.id, {
      seed: 232,
      intent: "continue",
      boundaryPolicy: "medium",
    }),
    /boundary policy/i,
  );
  assert.throws(
    () => core.growFromParent(parent, session, { seed: 232 }),
    /growth intent/i,
  );

  const grown = core.freezeAndGrow(session, parent.id, {
    seed: 233,
    intent: "vary",
    boundaryPolicy: "strict",
  });
  assert.deepEqual(grown.stageContract, {
    stageIndex: 1,
    boundaryIndex: 1,
    boundaryPolicy: "strict",
    boundaryAnchor: parent.bars[1],
    growthIntent: "vary",
  });
  assert.deepEqual(grown.rootMotif, parent.bars);
  assert.notStrictEqual(grown.stageContract.boundaryAnchor, parent.bars[1]);
  assert.notStrictEqual(grown.rootMotif[0], parent.bars[0]);
});

test("migrated legacy contracts can evolve but legacy cannot be a new growth decision", () => {
  const initial = core.createInitialSession({ seed: 235, populationSize: 8 });
  let migrated = core.freezeAndGrow(initial, initial.population[0].id, {
    seed: 236,
    intent: "continue",
    boundaryPolicy: "strict",
  });
  migrated = {
    ...migrated,
    stageContract: { ...migrated.stageContract, growthIntent: "legacy" },
  };

  const evolved = core.evolvePopulation(migrated, [migrated.population[0].id], {
    seed: 237,
    references: [],
  });
  assert.equal(evolved.stageContract.growthIntent, "legacy");
  evolved.population.forEach((candidate) => {
    assert.deepEqual(candidate.bars[1], migrated.stageContract.boundaryAnchor);
  });

  assert.throws(
    () => core.freezeAndGrow(initial, initial.population[0].id, {
      seed: 238,
      intent: "legacy",
      boundaryPolicy: "strict",
    }),
    /growth intent/i,
  );
  assert.throws(
    () => core.growFromParent(initial.population[0], initial, {
      seed: 239,
      intent: "legacy",
      boundaryPolicy: "strict",
    }),
    /growth intent/i,
  );
  assert.throws(
    () => core.growFromParent(initial.population[0], initial, {
      seed: 239,
      stageContract: migrated.stageContract,
      intent: "legacy",
      boundaryPolicy: "strict",
    }),
    /growth intent/i,
  );
  assert.throws(
    () => core.growFromParent(initial.population[0], initial, {
      seed: 239,
      stageContract: migrated.stageContract,
    }),
    /growth intent/i,
  );

  const validNextContract = { ...migrated.stageContract, growthIntent: "continue" };
  const direct = core.growFromParent(initial.population[0], initial, {
    seed: 239,
    stageContract: validNextContract,
  });
  assert.deepEqual(direct.bars[1], validNextContract.boundaryAnchor);

  const grown = core.freezeAndGrow(migrated, migrated.population[0].id, {
    seed: 239,
    intent: "vary",
    boundaryPolicy: "strict",
  });
  assert.equal(grown.stageIndex, 2);
  assert.equal(grown.stageContract.growthIntent, "vary");
});

test("corrupted stage contract indices throw clear contract errors", () => {
  const initial = core.createInitialSession({ seed: 240, populationSize: 8 });
  const session = core.freezeAndGrow(initial, initial.population[0].id, {
    seed: 241,
    intent: "continue",
    boundaryPolicy: "strict",
  });

  [1.5, core.GROWTH_STAGES.length, "1"].forEach((stageIndex) => {
    const corrupted = {
      ...session,
      stageIndex,
      stageContract: { ...session.stageContract, stageIndex },
    };
    assert.throws(
      () => core.evolvePopulation(corrupted, [corrupted.population[0].id], {
        seed: 242,
        references: [],
      }),
      /invalid stage contract index/i,
    );
  });

  const mismatched = {
    ...session,
    stageContract: { ...session.stageContract, stageIndex: core.GROWTH_STAGES.length },
  };
  assert.throws(
    () => core.evolvePopulation(mismatched, [mismatched.population[0].id], {
      seed: 243,
      references: [],
    }),
    /invalid stage contract index/i,
  );

  const corruptFreeze = {
    ...session,
    stageIndex: 1.5,
    stageContract: { ...session.stageContract, stageIndex: 1.5 },
  };
  assert.throws(
    () => core.freezeAndGrow(corruptFreeze, corruptFreeze.population[0].id, {
      seed: 244,
      intent: "continue",
      boundaryPolicy: "strict",
    }),
    /invalid stage contract index/i,
  );
});

test("direct growth and shared freeze contracts use the same boundary anchor", () => {
  const session = core.createInitialSession({ seed: 241, populationSize: 8 });
  const parent = session.population[0];
  const frozen = core.freezeAndGrow(session, parent.id, {
    seed: 242,
    intent: "continue",
    boundaryPolicy: "strict",
  });
  const direct = core.growFromParent(parent, session, {
    seed: 243,
    stageContract: frozen.stageContract,
  });
  const directFromDecisions = core.growFromParent(parent, session, {
    seed: 244,
    intent: "continue",
    boundaryPolicy: "strict",
  });

  assert.deepEqual(direct.bars[1], frozen.stageContract.boundaryAnchor);
  assert.deepEqual(directFromDecisions.bars[1], frozen.stageContract.boundaryAnchor);
  frozen.population.forEach((candidate) => {
    assert.deepEqual(candidate.bars[1], frozen.stageContract.boundaryAnchor);
  });
});

test("boundary diff reports structured anchor-relative event changes", () => {
  assert.equal(typeof core.boundaryDiff, "function");
  const anchor = quarterBar([60, 62, 64, 65]);
  const candidate = structuredClone(anchor);
  candidate.events[1].pitch = 65;
  candidate.events.pop();

  assert.deepEqual(core.boundaryDiff(anchor, candidate), [
    { index: 1, before: anchor.events[1], after: candidate.events[1] },
    { index: 3, before: anchor.events[3], after: null },
  ]);
  assert.equal(core.boundaryChangeCount(anchor, candidate), 2);
});

test("light contracts reject structural and extreme boundary mutations", () => {
  assert.equal(typeof core.assertStageContract, "function");
  const harmony = core.createInitialSession({ seed: 245, populationSize: 1 }).harmony;
  const anchor = quarterBar([60, 62, 64, 65]);
  const contract = {
    stageIndex: 1,
    boundaryIndex: 1,
    boundaryPolicy: "light",
    boundaryAnchor: anchor,
    growthIntent: "continue",
  };
  const candidateWith = (boundary) => ({
    id: "malformed-boundary",
    bars: [quarterBar([60, 62, 64, 65]), boundary],
  });

  const inserted = structuredClone(anchor);
  inserted.events.push({ pitch: 999, start: 99, duration: 0, rest: false });
  assert.throws(
    () => core.assertStageContract(candidateWith(inserted), contract, harmony),
    /same event structure/i,
  );

  const deleted = structuredClone(anchor);
  deleted.events.pop();
  assert.throws(
    () => core.assertStageContract(candidateWith(deleted), contract, harmony),
    /same event structure/i,
  );

  const absurdPitch = structuredClone(anchor);
  absurdPitch.events[0].pitch += 36;
  assert.throws(
    () => core.assertStageContract(candidateWith(absurdPitch), contract, harmony),
    /two scale degrees/i,
  );

  const absurdStart = structuredClone(anchor);
  absurdStart.events[0].start += 2;
  assert.throws(
    () => core.assertStageContract(candidateWith(absurdStart), contract, harmony),
    /one beat/i,
  );
});

test("huge finite boundary pitches are rejected without an unbounded scale search", () => {
  const script = `
    const core = require(${JSON.stringify(corePath)});
    const anchor = { events: [{ pitch: 60, start: 0, duration: 4, rest: false }] };
    const contract = {
      stageIndex: 1,
      boundaryIndex: 0,
      boundaryPolicy: "light",
      boundaryAnchor: anchor,
      growthIntent: "continue",
    };
    const candidate = {
      id: "huge-pitch",
      bars: [{ events: [{ pitch: 1e18, start: 0, duration: 4, rest: false }] }],
    };
    try {
      core.assertStageContract(candidate, contract, { key: { tonic: 60, mode: "major" } });
      process.exitCode = 1;
    } catch (error) {
      if (!/MIDI pitch/i.test(error.message)) {
        console.error(error.stack);
        process.exitCode = 2;
      }
    }
  `;
  const result = spawnSync(process.execPath, ["-e", script], {
    encoding: "utf8",
    timeout: 1000,
  });

  assert.notEqual(result.error?.code, "ETIMEDOUT", "huge pitch validation must not hang");
  assert.equal(result.status, 0, result.stderr || result.stdout || result.error?.message);
});

test("boundary events require exact schema, types, and numeric ranges", () => {
  const harmony = { key: { tonic: 60, mode: "major" } };
  const anchor = quarterBar([60, 62, 64, 65]);
  const contract = {
    stageIndex: 1,
    boundaryIndex: 1,
    boundaryPolicy: "light",
    boundaryAnchor: anchor,
    growthIntent: "continue",
  };
  const candidateWith = (boundary) => ({
    id: "invalid-event-schema",
    bars: [quarterBar([60, 62, 64, 65]), boundary],
  });
  const assertBoundaryError = (change, pattern) => {
    const boundary = structuredClone(anchor);
    change(boundary.events[0]);
    assert.throws(
      () => core.assertStageContract(candidateWith(boundary), contract, harmony),
      pattern,
    );
  };

  assertBoundaryError((event) => { event.rest = "false"; }, /rest must be boolean/i);
  assertBoundaryError((event) => { event.pitch = Infinity; }, /MIDI pitch/i);
  assertBoundaryError((event) => { event.pitch = Number.NaN; }, /MIDI pitch/i);
  assertBoundaryError((event) => { event.start = Number.NaN; }, /start must be a finite number/i);
  assertBoundaryError((event) => { event.duration = 0; }, /duration must be a positive finite number/i);
  assertBoundaryError((event) => { event.velocity = 100; }, /exact event schema/i);
  assertBoundaryError((event) => { delete event.duration; }, /exact event schema/i);

  const lowAnchor = { events: [{ pitch: 0, start: 0, duration: 4, rest: false }] };
  const lowContract = { ...contract, boundaryAnchor: lowAnchor };
  assert.doesNotThrow(() => core.assertStageContract(
    candidateWith({ events: [{ pitch: 2, start: 0, duration: 4, rest: false }] }),
    lowContract,
    harmony,
  ));

  const highAnchor = { events: [{ pitch: 125, start: 0, duration: 4, rest: false }] };
  const highContract = { ...contract, boundaryAnchor: highAnchor };
  assert.doesNotThrow(() => core.assertStageContract(
    candidateWith({ events: [{ pitch: 127, start: 0, duration: 4, rest: false }] }),
    highContract,
    harmony,
  ));
});

test("stage snapshots and rollback isolate contracts and the root motif", () => {
  let stageOne = core.createInitialSession({ seed: 251, populationSize: 8 });
  stageOne = core.freezeAndGrow(stageOne, stageOne.population[0].id, {
    seed: 252,
    intent: "continue",
    boundaryPolicy: "strict",
  });
  const stageTwo = core.freezeAndGrow(stageOne, stageOne.population[0].id, {
    seed: 253,
    intent: "vary",
    boundaryPolicy: "light",
  });
  const storedSnapshot = structuredClone(stageTwo.snapshots.at(-1));

  stageOne.stageContract.boundaryAnchor.events[0].pitch += 12;
  stageOne.rootMotif[0].events[0].pitch += 12;
  assert.deepEqual(stageTwo.snapshots.at(-1), storedSnapshot);

  const rolledBack = core.rollbackStage(stageTwo);
  assert.deepEqual(rolledBack.stageContract, storedSnapshot.stageContract);
  assert.deepEqual(rolledBack.rootMotif, storedSnapshot.rootMotif);
  rolledBack.stageContract.boundaryAnchor.events[0].pitch += 12;
  rolledBack.rootMotif[0].events[0].pitch += 12;
  assert.deepEqual(stageTwo.snapshots.at(-1), storedSnapshot);
});

test("continue and vary preserve source rhythm while contrast changes a structural trait", () => {
  assert.equal(typeof core.rhythmSignature, "function");
  assert.equal(typeof core.growthIntentResult, "function");
  const session = core.createInitialSession({ seed: 271, populationSize: 8 });
  const parent = session.population[0];
  const continued = core.growFromParent(parent, session, {
    seed: 272,
    intent: "continue",
    boundaryPolicy: "strict",
  });
  const varied = core.growFromParent(parent, session, {
    seed: 273,
    intent: "vary",
    boundaryPolicy: "strict",
  });
  const contrasted = core.growFromParent(parent, session, {
    seed: 274,
    intent: "contrast",
    boundaryPolicy: "strict",
  });

  [continued, varied, contrasted].forEach((candidate) => {
    assert.deepEqual(candidate.bars.slice(0, parent.bars.length), parent.bars);
    candidate.bars.forEach((bar) => assert.equal(core.barDuration(bar), 4));
    assert.equal(typeof candidate.origin.intentScore, "number");
    assert.ok(["strong", "weak", "missed"].includes(candidate.origin.intentOutcome));
  });
  assert.deepEqual(
    continued.bars.slice(2).map(core.rhythmSignature),
    parent.bars.map(core.rhythmSignature),
  );
  assert.deepEqual(
    varied.bars.slice(2).map(core.rhythmSignature),
    parent.bars.map(core.rhythmSignature),
  );
  assert.notDeepEqual(varied.bars.slice(2), parent.bars);

  const contrastResult = core.growthIntentResult("contrast", contrasted.bars.slice(2), {
    parent,
    rootMotif: parent.bars,
    harmony: session.harmony,
  });
  assert.ok(contrastResult.score >= 0.65);
  assert.equal(contrasted.origin.growthIntent, "contrast");
  assert.equal(contrasted.origin.intentScore, contrastResult.score);
  assert.equal(contrasted.origin.intentOutcome, contrastResult.outcome);
});

test("vary intent does not claim success when the new region is unchanged", () => {
  const session = core.createInitialSession({ seed: 276, populationSize: 8 });
  const parent = session.population[0];
  const result = core.growthIntentResult("vary", parent.bars.map(core.cloneBar), {
    parent,
    rootMotif: parent.bars,
    harmony: session.harmony,
    startBar: parent.bars.length,
  });

  assert.equal(result.score, 0);
  assert.equal(result.outcome, "missed");
});

test("return growth is measured against the frozen root motif", () => {
  let session = core.createInitialSession({ seed: 281, populationSize: 8 });
  const rootParent = session.population[0];
  session = core.freezeAndGrow(session, rootParent.id, {
    seed: 282,
    intent: "continue",
    boundaryPolicy: "strict",
    references: [],
  });
  session = core.freezeAndGrow(session, session.population[0].id, {
    seed: 283,
    intent: "vary",
    boundaryPolicy: "strict",
    references: [],
  });
  session = core.freezeAndGrow(session, session.population[0].id, {
    seed: 284,
    intent: "contrast",
    boundaryPolicy: "strict",
    references: [],
  });
  const parent = session.population[0];
  const returned = core.growFromParent(parent, session, {
    seed: 285,
    intent: "return",
    boundaryPolicy: "strict",
  });
  const newBars = returned.bars.slice(parent.bars.length);
  const result = core.growthIntentResult("return", newBars, {
    parent,
    rootMotif: session.rootMotif,
    harmony: session.harmony,
  });

  assert.deepEqual(returned.bars.slice(0, parent.bars.length), parent.bars);
  assert.equal(returned.bars.length, 16);
  assert.equal(returned.origin.growthIntent, "return");
  assert.equal(returned.origin.intentScore, result.score);
  assert.equal(returned.origin.intentOutcome, result.outcome);
  assert.ok(result.score >= 0.65);
});

test("freeze growth uses explicit reference and intent generation buckets", () => {
  let session = core.createInitialSession({ seed: 291, populationSize: 8 });
  const parent = session.population[0];
  const reference = core.cloneCandidate(session.population[1]);
  reference.bars.forEach((bar) => bar.events.forEach((event) => {
    if (!event.rest) event.pitch += 7;
  }));
  session = {
    ...session,
    population: [parent, reference, ...session.population.slice(2)],
  };
  const grown = core.freezeAndGrow(session, parent.id, {
    seed: 292,
    intent: "vary",
    boundaryPolicy: "strict",
    references: [{ candidateId: reference.id, trait: "register" }],
  });
  const buckets = core.generationBuckets(session.populationSize);
  const referenced = grown.population.filter((candidate) => candidate.origin.type === "trait-reference");
  const random = grown.population.filter((candidate) => candidate.origin.type === "growth-random");
  const base = grown.population.filter((candidate) => candidate.origin.type === "growth");

  assert.equal(base.length, buckets.mutation);
  assert.equal(referenced.length, buckets.donor);
  assert.equal(random.length, buckets.random);
  grown.population.forEach((candidate) => {
    assert.deepEqual(candidate.bars.slice(0, parent.bars.length), parent.bars);
    assert.equal(candidate.bars.length, 4);
    candidate.bars.forEach((bar) => assert.equal(core.barDuration(bar), 4));
    assert.equal(candidate.origin.growthIntent, "vary");
    assert.equal(typeof candidate.origin.intentScore, "number");
    assert.ok(["strong", "weak", "missed"].includes(candidate.origin.intentOutcome));
  });
  referenced.forEach((candidate) => {
    assert.equal(candidate.origin.referenceId, reference.id);
    assert.equal(candidate.origin.trait, "register");
    assert.equal(typeof candidate.origin.resultValue, "number");
    assert.equal(typeof candidate.origin.progress, "number");
    assert.ok(["moved-toward", "weak", "missed"].includes(candidate.origin.outcome));
  });

  const withoutReferences = core.freezeAndGrow(session, parent.id, {
    seed: 293,
    intent: "continue",
    boundaryPolicy: "strict",
    references: [],
  });
  assert.equal(
    withoutReferences.population.some((candidate) => candidate.origin.type === "trait-reference"),
    false,
  );
  assert.equal(
    withoutReferences.population.filter((candidate) => candidate.origin.type === "growth").length,
    buckets.mutation + buckets.donor,
  );
});

test("population entry rejects wrong stage lengths and non-four-beat bars", () => {
  const session = core.createInitialSession({ seed: 261, populationSize: 8 });
  const tooLong = core.cloneCandidate(session.population[0]);
  tooLong.bars.push(core.cloneBar(tooLong.bars[0]), core.cloneBar(tooLong.bars[0]), core.cloneBar(tooLong.bars[0]));
  const wrongDuration = core.cloneCandidate(session.population[1]);
  wrongDuration.bars[0].events[0].duration += 0.5;
  const malformed = { ...session, population: [tooLong, wrongDuration, ...session.population.slice(2)] };

  assert.throws(
    () => core.freezeAndGrow(malformed, tooLong.id, {
      seed: 262,
      intent: "continue",
      boundaryPolicy: "strict",
    }),
    /exactly 4 bars/i,
  );
  assert.throws(
    () => core.freezeAndGrow(malformed, wrongDuration.id, {
      seed: 263,
      intent: "continue",
      boundaryPolicy: "strict",
    }),
    /exactly four beats/i,
  );
});

const OPERATOR_HARMONY = {
  key: { tonic: 60, mode: "major" },
  chords: [{ degree: 0 }, { degree: 0 }],
};

function quarterBar(pitches, restIndexes = []) {
  const rests = new Set(restIndexes);
  return {
    events: pitches.map((pitch, index) => ({
      pitch,
      start: index,
      duration: 1,
      rest: rests.has(index),
    })),
  };
}

function sustainedBar(pitch) {
  return { events: [{ pitch, start: 0, duration: 4, rest: false }] };
}

function operatorCandidate(frozenBar, mutableBar) {
  return {
    id: "operator-fixture",
    bars: [frozenBar, mutableBar],
    origin: { type: "fixture", primaryParentId: null, donorIds: [] },
  };
}

function traitDirectionFixtures() {
  return [
    {
      name: "density increase uses splitEvent",
      trait: "density",
      direction: 1,
      targetValue: 0.8,
      seed: 201,
      createCandidate: () => operatorCandidate(
        quarterBar([60, 62, 64, 65]),
        quarterBar([60, 62, 64, 65]),
      ),
      verifyChange: (before, after) => {
        assert.equal(after.bars[1].events.length, before.bars[1].events.length + 1);
        assert.equal(after.bars[1].events.some((event) => event.rest), false);
        assert.deepEqual(
          after.bars[1].events.map(({ start, duration }) => ({ start, duration })),
          [
            { start: 0, duration: 0.5 },
            { start: 0.5, duration: 0.5 },
            { start: 1, duration: 1 },
            { start: 2, duration: 1 },
            { start: 3, duration: 1 },
          ],
        );
      },
    },
    {
      name: "density decrease silences one mutable event",
      trait: "density",
      direction: -1,
      targetValue: 0.2,
      seed: 202,
      createCandidate: () => operatorCandidate(
        quarterBar([60, 62, 64, 65]),
        quarterBar([60, 62, 64, 65]),
      ),
    },
    {
      name: "contour increase raises a mutable suffix",
      trait: "contour",
      direction: 1,
      targetValue: 0.6,
      seed: 203,
      createCandidate: () => operatorCandidate(
        sustainedBar(72),
        quarterBar([71, 69, 67, 65]),
      ),
    },
    {
      name: "contour decrease lowers a mutable suffix",
      trait: "contour",
      direction: -1,
      targetValue: 0.4,
      seed: 204,
      createCandidate: () => operatorCandidate(
        sustainedBar(60),
        quarterBar([62, 64, 65, 67]),
      ),
    },
    {
      name: "register increase moves mutable pitches up the scale",
      trait: "register",
      direction: 1,
      targetValue: 0.7,
      seed: 205,
      createCandidate: () => operatorCandidate(
        sustainedBar(60),
        quarterBar([60, 60, 60, 60]),
      ),
    },
    {
      name: "register decrease moves mutable pitches down the scale",
      trait: "register",
      direction: -1,
      targetValue: 0.3,
      seed: 206,
      createCandidate: () => operatorCandidate(
        sustainedBar(72),
        quarterBar([72, 72, 72, 72]),
      ),
    },
    {
      name: "space increase turns one mutable note into a rest",
      trait: "space",
      direction: 1,
      targetValue: 0.5,
      seed: 207,
      createCandidate: () => operatorCandidate(
        quarterBar([60, 62, 64, 65]),
        quarterBar([60, 62, 64, 65]),
      ),
    },
    {
      name: "space decrease restores one mutable rest",
      trait: "space",
      direction: -1,
      targetValue: 0.1,
      seed: 208,
      createCandidate: () => operatorCandidate(
        quarterBar([60, 62, 64, 65]),
        quarterBar([60, 62, 64, 65], [0, 1, 2, 3]),
      ),
    },
    {
      name: "tension increase moves one chord tone away from the chord",
      trait: "tension",
      direction: 1,
      targetValue: 0.6,
      seed: 209,
      createCandidate: () => operatorCandidate(
        sustainedBar(60),
        quarterBar([60, 64, 67, 60]),
      ),
      verifyChange: (before, after) => {
        const changed = after.bars[1].events.filter((event, index) => (
          event.pitch !== before.bars[1].events[index].pitch
        ));
        assert.equal(changed.length, 1);
        assert.equal(core.normalizedTraitValue(after, OPERATOR_HARMONY, "tension"), 0.2);
      },
    },
    {
      name: "tension decrease resolves one non-chord tone",
      trait: "tension",
      direction: -1,
      targetValue: 0.2,
      seed: 210,
      createCandidate: () => operatorCandidate(
        sustainedBar(60),
        quarterBar([62, 65, 69, 71]),
      ),
    },
  ];
}

test("evolving changes only the active mutable range", () => {
  assert.equal(typeof core.freezeAndGrow, "function");
  assert.equal(typeof core.evolvePopulation, "function");
  const session = advanceToStage(2, 31);
  const parent = session.population[0];
  const next = core.evolvePopulation(session, [parent.id], { seed: 32 });
  assert.equal(next.stageIndex, session.stageIndex);
  assert.equal(next.stageBars, 8);
  assert.equal(next.evolutionRound, session.evolutionRound + 1);
  next.population.forEach((candidate) => {
    assert.deepEqual(candidate.bars.slice(0, 3), parent.bars.slice(0, 3));
    assert.ok(candidate.bars.every((bar) => core.barDuration(bar) === 4));
  });
  assert.ok(next.population.some((candidate) => candidate.origin.type === "random-injection"));
});

test("secondary selected candidates never become hidden trait references", () => {
  assert.equal(typeof core.evolvePopulation, "function");
  const session = advanceToStage(3, 41);
  const selectedIds = session.population.slice(0, 3).map((item) => item.id);
  const next = core.evolvePopulation(session, selectedIds, { seed: 42 });
  assert.equal(next.population.some((candidate) => candidate.origin.type === "trait-donor"), false);
  assert.equal(next.population.some((candidate) => candidate.origin.type === "trait-reference"), false);
  next.population.forEach((candidate) => {
    assert.equal(candidate.origin.primaryParentId, selectedIds[0]);
  });
  const boundary = core.GROWTH_STAGES[session.stageIndex].boundary;
  next.population.forEach((candidate) => {
    assert.ok(
      core.boundaryChangeCount(session.stageContract.boundaryAnchor, candidate.bars[boundary]) <= 2,
      `${candidate.origin.type} changed more than two boundary events`,
    );
  });
});

test("only explicit freeze advances growth and rollback restores the prior snapshot", () => {
  assert.equal(typeof core.rollbackStage, "function");
  const session = core.createInitialSession({ seed: 51, populationSize: 8 });
  const evolved = core.evolvePopulation(session, [session.population[0].id], { seed: 52 });
  assert.equal(evolved.stageIndex, 0);
  const grown = core.freezeAndGrow(evolved, evolved.population[0].id, {
    seed: 53,
    intent: "continue",
    boundaryPolicy: "strict",
  });
  assert.equal(grown.stageIndex, 1);
  assert.equal(grown.snapshots.length, 1);
  const rolledBack = core.rollbackStage(grown);
  assert.equal(rolledBack.stageIndex, 0);
  assert.deepEqual(rolledBack.population, evolved.population);
});

test("motif similarity is derived from rhythm and contour", () => {
  assert.equal(typeof core.motifSimilarity, "function");
  const session = core.createInitialSession({ seed: 61, populationSize: 8 });
  const candidate = session.population[0];
  assert.equal(core.motifSimilarity(candidate.bars, candidate.bars), 1);
  const other = session.population[1];
  const score = core.motifSimilarity(candidate.bars, other.bars);
  assert.ok(score >= 0 && score <= 1);
});

test("preview covers the boundary and current growth region", () => {
  assert.equal(typeof core.previewBarRange, "function");
  assert.deepEqual(core.previewBarRange(0), { start: 0, end: 2 });
  assert.deepEqual(core.previewBarRange(3), { start: 7, end: 12 });
  assert.deepEqual(core.previewBarRange(4), { start: 11, end: 16 });
});

test("the shared harmony canvas is unchanged by evolution", () => {
  const session = advanceToStage(2, 71);
  const harmony = structuredClone(session.harmony);
  const next = core.evolvePopulation(session, [session.population[0].id], { seed: 72 });
  assert.deepEqual(next.harmony, harmony);
});

test("every candidate remains sixteen exact four-beat bars at the final stage", () => {
  const session = advanceToStage(4, 81);
  assert.equal(session.stageBars, 16);
  session.population.forEach((candidate) => {
    assert.equal(candidate.bars.length, 16);
    assert.ok(candidate.bars.every((bar) => core.barDuration(bar) === 4));
  });
});

test("a new session honors an explicitly selected key and tempo", () => {
  const session = core.createInitialSession({
    seed: 91,
    populationSize: 8,
    key: "D minor",
    bpm: 96,
  });
  assert.equal(session.harmony.key.name, "D minor");
  assert.equal(session.harmony.bpm, 96);
});

test("trait-reference children use only the candidate and trait chosen by the user", () => {
  let session = advanceToStage(2, 141);
  const primary = session.population[0];
  const reference = core.cloneCandidate(session.population[1]);
  reference.bars.forEach((bar) => bar.events.forEach((event) => {
    if (!event.rest) event.pitch += 7;
  }));
  session = { ...session, population: [primary, reference, ...session.population.slice(2)] };
  const options = {
    seed: 142,
    references: [{ candidateId: reference.id, trait: "register" }],
  };
  const next = core.evolvePopulation(session, [primary.id], options);
  const repeated = core.evolvePopulation(session, [primary.id], options);
  const referenced = next.population.filter((candidate) => candidate.origin.type === "trait-reference");

  assert.deepEqual(next, repeated);
  assert.ok(referenced.length > 0);
  referenced.forEach((candidate) => {
    assert.equal(candidate.origin.referenceId, reference.id);
    assert.equal(candidate.origin.trait, "register");
    assert.equal(typeof candidate.origin.primaryValue, "number");
    assert.equal(typeof candidate.origin.targetValue, "number");
    assert.equal(typeof candidate.origin.resultValue, "number");
    assert.equal(typeof candidate.origin.progress, "number");
    assert.equal(
      candidate.origin.resultValue,
      core.normalizedTraitValue(candidate, session.harmony, candidate.origin.trait),
    );
    assert.deepEqual(
      { progress: candidate.origin.progress, outcome: candidate.origin.outcome },
      core.referenceEffect(
        candidate.origin.primaryValue,
        candidate.origin.targetValue,
        candidate.origin.resultValue,
      ),
    );
    assert.ok(["moved-toward", "weak", "missed"].includes(candidate.origin.outcome));
  });
});

test("an evolution without references never invents a trait-reference child", () => {
  const session = advanceToStage(2, 151);
  const next = core.evolvePopulation(session, [session.population[0].id], { seed: 152, references: [] });
  assert.equal(next.population.some((candidate) => candidate.origin.type === "trait-reference"), false);
});

traitDirectionFixtures().forEach((fixture) => {
  test(`trait operator ${fixture.name}`, () => {
    const original = fixture.createCandidate();
    const first = structuredClone(original);
    const repeated = structuredClone(original);
    const frozenBytes = JSON.stringify(original.bars.slice(0, 1));
    const primaryValue = core.normalizedTraitValue(original, OPERATOR_HARMONY, fixture.trait);
    const descriptor = { trait: fixture.trait, targetValue: fixture.targetValue };

    const firstEffect = core.applyTraitReference(
      first,
      descriptor,
      core.createRng(fixture.seed),
      OPERATOR_HARMONY,
      1,
    );
    const repeatedEffect = core.applyTraitReference(
      repeated,
      descriptor,
      core.createRng(fixture.seed),
      OPERATOR_HARMONY,
      1,
    );
    const resultValue = core.normalizedTraitValue(first, OPERATOR_HARMONY, fixture.trait);

    assert.equal(Math.sign(resultValue - primaryValue), fixture.direction);
    assert.ok(
      Math.abs(fixture.targetValue - resultValue) < Math.abs(fixture.targetValue - primaryValue),
      fixture.name,
    );
    assert.equal(firstEffect.resultValue, resultValue);
    assert.equal(JSON.stringify(first.bars.slice(0, 1)), frozenBytes);
    first.bars.forEach((bar) => assert.equal(core.barDuration(bar), 4, fixture.name));
    assert.deepEqual(
      { candidate: first, effect: firstEffect },
      { candidate: repeated, effect: repeatedEffect },
    );
    fixture.verifyChange?.(original, first);
  });
});

test("contour failed attempts restore the exact candidate before reporting missed", () => {
  const original = operatorCandidate(
    sustainedBar(107),
    quarterBar([60, 62, 64, 65]),
  );
  const candidate = structuredClone(original);
  const repeated = structuredClone(original);
  const descriptor = { trait: "contour", targetValue: 1 };
  const frozenBytes = JSON.stringify(original.bars.slice(0, 1));

  assert.equal(core.normalizedTraitValue(original, OPERATOR_HARMONY, "contour"), 0.75);
  const effect = core.applyTraitReference(
    candidate,
    descriptor,
    core.createRng(301),
    OPERATOR_HARMONY,
    1,
  );
  const repeatedEffect = core.applyTraitReference(
    repeated,
    descriptor,
    core.createRng(301),
    OPERATOR_HARMONY,
    1,
  );

  assert.deepEqual(candidate, original);
  assert.deepEqual({ candidate, effect }, { candidate: repeated, effect: repeatedEffect });
  assert.deepEqual(effect, { resultValue: 0.75, progress: 0, outcome: "missed" });
  assert.equal(JSON.stringify(candidate.bars.slice(0, 1)), frozenBytes);
  candidate.bars.forEach((bar) => assert.equal(core.barDuration(bar), 4));
});

test("an operator with no mutable bars restores the exact candidate and reports missed", () => {
  const original = operatorCandidate(
    quarterBar([60, 62, 64, 65]),
    quarterBar([60, 62, 64, 65]),
  );
  const candidate = structuredClone(original);
  const repeated = structuredClone(original);
  const descriptor = { trait: "density", targetValue: 0.8 };
  const frozenBytes = JSON.stringify(original.bars);

  const effect = core.applyTraitReference(
    candidate,
    descriptor,
    core.createRng(302),
    OPERATOR_HARMONY,
    original.bars.length,
  );
  const repeatedEffect = core.applyTraitReference(
    repeated,
    descriptor,
    core.createRng(302),
    OPERATOR_HARMONY,
    original.bars.length,
  );

  assert.deepEqual(candidate, original);
  assert.deepEqual({ candidate, effect }, { candidate: repeated, effect: repeatedEffect });
  assert.deepEqual(effect, { resultValue: 0.5, progress: 0, outcome: "missed" });
  assert.equal(JSON.stringify(candidate.bars), frozenBytes);
  candidate.bars.forEach((bar) => assert.equal(core.barDuration(bar), 4));
});

test("tension is measured against the chord sounding in each bar", () => {
  const harmony = {
    key: { tonic: 60, mode: "major" },
    chords: [{ degree: 0 }, { degree: 4 }],
  };
  const candidate = {
    bars: [
      { events: [{ pitch: 60, start: 0, duration: 4, rest: false }] },
      { events: [{ pitch: 64, start: 0, duration: 4, rest: false }] },
    ],
  };
  assert.equal(core.candidateTraits(candidate, harmony).tension, 0.5);
});
