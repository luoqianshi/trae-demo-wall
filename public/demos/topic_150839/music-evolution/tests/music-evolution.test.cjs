const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const app = require(path.join(projectRoot, "music-evolution.js"));

function withMeaningfulReference(state, primaryId, trait) {
  const next = JSON.parse(JSON.stringify(state));
  const branch = app.activeBranch(next);
  const reference = branch.session.population.find((candidate) => candidate.id !== primaryId);
  reference.bars.forEach((bar) => bar.events.forEach((event) => {
    if (!event.rest) event.pitch += trait === "register" ? 7 : 5;
  }));
  return { state: next, referenceId: reference.id };
}

function growOnceThroughDecision(state, seed, options = {}) {
  const primaryId = app.currentDeckCandidate(state).id;
  state = app.swipeCandidate(state, primaryId, "right");
  state = app.setDecisionAction(state, "grow");
  state = app.setGrowthIntent(state, options.intent || "continue");
  state = app.setBoundaryPolicy(state, options.boundaryPolicy || "light");
  return app.executeDecision(state, { seed });
}

function advanceAppToFinalStage(seed) {
  let state = app.createAppState({ seed, populationSize: 8 });
  for (let stage = 0; stage < 4; stage += 1) {
    state = growOnceThroughDecision(state, seed + stage + 1, {
      intent: ["continue", "vary", "contrast", "return"][stage],
      boundaryPolicy: stage % 2 ? "light" : "strict",
    });
  }
  return state;
}

function stripV3Session(session) {
  const legacy = JSON.parse(JSON.stringify(session));
  delete legacy.stageContract;
  delete legacy.rootMotif;
  legacy.snapshots = (legacy.snapshots || []).map((snapshot) => stripV3Session({
    ...snapshot,
    snapshots: [],
  }));
  return legacy;
}

function downgradeToV2(state, options = {}) {
  const legacy = JSON.parse(JSON.stringify(state));
  legacy.version = 2;
  legacy.branches = legacy.branches.map((branch) => {
    const next = { ...branch, session: stripV3Session(branch.session) };
    delete next.deck;
    delete next.decision;
    delete next.migrationState;
    delete next.migrationReason;
    next.uiSnapshots = (next.uiSnapshots || []).map((snapshot) => {
      const legacySnapshot = { ...snapshot };
      delete legacySnapshot.deck;
      delete legacySnapshot.decision;
      delete legacySnapshot.ordering;
      return legacySnapshot;
    });
    if (options.removeSnapshots) next.session.snapshots = [];
    return next;
  });
  return legacy;
}

test("the workbench exposes staged growth, a 16-bar track, and a progressive decision flow", () => {
  const html = fs.readFileSync(path.join(projectRoot, "music-evolution.html"), "utf8");
  const css = fs.readFileSync(path.join(projectRoot, "music-evolution.css"), "utf8");

  assert.match(html, /id="growthStages"/);
  assert.match(html, /id="melodyTrack"/);
  assert.match(html, /id="lineageGraph"/);
  assert.match(html, /id="branchList"/);
  assert.match(html, /id="candidateDeck"/);
  assert.match(html, /id="decisionPanel"/);
  assert.match(html, /data-decision-action="evolve"/);
  assert.match(html, /data-decision-action="grow"/);
  assert.match(html, /和弦伴奏/);
  assert.doesNotMatch(html, /发展成下一句|段落轨迹|生态场|系统评分/);

  assert.match(css, /\.bar-cell\.is-locked/);
  assert.match(css, /\.bar-cell\.is-boundary/);
  assert.match(css, /\.bar-cell\.is-growing/);
  assert.match(css, /\.bar-cell\.is-future/);
});

test("the UI exposes a candidate deck and progressive creative decision controls", () => {
  const html = fs.readFileSync(path.join(projectRoot, "music-evolution.html"), "utf8");
  const css = fs.readFileSync(path.join(projectRoot, "music-evolution.css"), "utf8");

  assert.match(html, /id="candidateDeck"/);
  assert.match(html, /id="deckProgress"/);
  assert.match(html, /id="undoSwipeButton"/);
  assert.match(html, /id="reshuffleDeckButton"/);
  assert.match(html, /id="decisionPanel"/);
  assert.match(html, /id="migrationNotice"/);
  assert.match(html, /id="referencePicker"/);
  assert.match(html, /id="growthIntentControl"/);
  assert.match(html, /id="boundaryPolicyControl"/);
  assert.match(html, /参考它的特点/);
  assert.doesNotMatch(html, /加入特征供体/);
  assert.match(css, /\.candidate-deck/);
  assert.match(css, /\.candidate-card\.is-dragging/);
  assert.match(css, /touch-action:\s*pan-y/);
});

test("the browser loads the pure core before the UI controller", () => {
  const html = fs.readFileSync(path.join(projectRoot, "music-evolution.html"), "utf8");
  assert.ok(html.indexOf("music-evolution-core.js") < html.indexOf("music-evolution.js"));
});

test("the browser controller uses deck gestures and explicit creative decisions", () => {
  const source = fs.readFileSync(path.join(projectRoot, "music-evolution.js"), "utf8");

  assert.match(source, /getElementById\("candidateDeck"\)/);
  assert.match(source, /pointerdown/);
  assert.match(source, /pointermove/);
  assert.match(source, /pointerup/);
  assert.match(source, /pointercancel/);
  assert.match(source, /addTraitReference/);
  assert.match(source, /completeAudition/);
  assert.match(source, /buildBoundaryComparisonSchedule/);
  assert.doesNotMatch(source, /加入特征供体|id="candidateGrid"|getElementById\("candidateGrid"\)/);
});

test("public copy uses reference language and never promises inherited traits", () => {
  const files = ["README.md", "AI_MODEL.md", "music-evolution.html"]
    .map((file) => fs.readFileSync(path.join(projectRoot, file), "utf8"))
    .join("\n");
  assert.match(files, /参考它的特点|特征参考/);
  assert.doesNotMatch(files, /加入特征供体|特征供体|供体特征|成功继承|客观质量分数/);
});

test("mobile keeps phase-sensitive candidate and decision actions in a sticky bar", () => {
  const html = fs.readFileSync(path.join(projectRoot, "music-evolution.html"), "utf8");
  const css = fs.readFileSync(path.join(projectRoot, "music-evolution.css"), "utf8");

  assert.match(html, /class="mobile-action-bar"/);
  assert.match(html, /data-mobile-phase="browsing"/);
  assert.match(html, /data-mobile-phase="decision"/);
  assert.match(html, /data-mobile-action="skip"/);
  assert.match(html, /data-mobile-action="choose"/);
  assert.match(html, /data-mobile-action="execute"/);
  assert.match(css, /\.mobile-action-bar[\s\S]*position:\s*fixed/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});

test("mobile preserves accompaniment controls and 44px creative actions", () => {
  const css = fs.readFileSync(path.join(projectRoot, "music-evolution.css"), "utf8");

  assert.doesNotMatch(css, /\.control-section:nth-child\(3\)\s*\{\s*display:\s*none/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*\.deck-actions button[\s\S]*min-height:\s*44px/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*\.decision-panel button[\s\S]*min-height:\s*44px/);
});

test("preference and random modes reorder the same candidate IDs", () => {
  let state = app.createAppState({ seed: 71, populationSize: 8 });
  const originalIds = app.activeBranch(state).session.population.map((candidate) => candidate.id).sort();

  state = app.setOrdering(state, "random");
  const randomIds = app.orderedCandidates(state).map((candidate) => candidate.id).sort();
  state = app.setOrdering(state, "preference");
  const preferenceIds = app.orderedCandidates(state).map((candidate) => candidate.id).sort();

  assert.deepEqual(randomIds, originalIds);
  assert.deepEqual(preferenceIds, originalIds);
});

test("left swipe advances the same candidate deck and undo restores it", () => {
  let state = app.createAppState({ seed: 301, populationSize: 8 });
  const ids = app.activeBranch(state).session.population.map((candidate) => candidate.id).sort();
  const first = app.currentDeckCandidate(state).id;
  state = app.swipeCandidate(state, first, "left");
  assert.notEqual(app.currentDeckCandidate(state).id, first);
  state = app.undoSwipe(state);
  assert.equal(app.currentDeckCandidate(state).id, first);
  assert.deepEqual(app.activeBranch(state).session.population.map((candidate) => candidate.id).sort(), ids);
});

test("swipe direction requires distance or velocity and ignores small drags", () => {
  assert.equal(app.swipeDirection({ distanceX: -140, width: 400, velocityX: -0.2 }), "left");
  assert.equal(app.swipeDirection({ distanceX: 30, width: 400, velocityX: 0.1 }), null);
  assert.equal(app.swipeDirection({ distanceX: 35, width: 400, velocityX: 0.8 }), "right");
});

test("right swipe selects a mother but does not evolve or grow", () => {
  let state = app.createAppState({ seed: 311, populationSize: 8 });
  const before = app.activeBranch(state).session;
  const candidateId = app.currentDeckCandidate(state).id;
  state = app.swipeCandidate(state, candidateId, "right");
  const branch = app.activeBranch(state);

  assert.equal(branch.decision.primaryId, candidateId);
  assert.equal(branch.decision.phase, "choose-action");
  assert.equal(branch.session.stageBars, before.stageBars);
  assert.equal(branch.session.evolutionRound, before.evolutionRound);

  state = app.cancelDecision(state);
  assert.equal(app.activeBranch(state).decision.phase, "browsing");
  assert.equal(app.currentDeckCandidate(state).id, candidateId);
});

test("only a completed audition followed by a left swipe becomes a comparison", () => {
  let state = app.createAppState({ seed: 321, populationSize: 8 });
  const first = app.currentDeckCandidate(state).id;
  state = app.markListened(state, first);
  state = app.swipeCandidate(state, first, "left");
  assert.equal(app.activeBranch(state).deck.comparisonIds.length, 0);

  const second = app.currentDeckCandidate(state).id;
  state = app.completeAudition(state, second);
  state = app.swipeCandidate(state, second, "left");
  assert.deepEqual(app.activeBranch(state).deck.comparisonIds, [second]);

  state = app.undoSwipe(state);
  assert.deepEqual(app.activeBranch(state).deck.comparisonIds, []);
  assert.equal(app.currentDeckCandidate(state).id, second);
  assert.ok(app.activeBranch(state).deck.completedIds.includes(second));
});

test("an exhausted deck can reshuffle without changing the candidate pool", () => {
  let state = app.createAppState({ seed: 331, populationSize: 4 });
  const ids = app.activeBranch(state).session.population.map((candidate) => candidate.id).sort();
  while (app.currentDeckCandidate(state)) {
    const candidateId = app.currentDeckCandidate(state).id;
    state = app.swipeCandidate(state, candidateId, "left");
  }
  assert.equal(app.activeBranch(state).deck.exhausted, true);
  state = app.reshuffleDeck(state);
  assert.equal(app.activeBranch(state).deck.exhausted, false);
  assert.equal(app.activeBranch(state).deck.cursor, 0);
  assert.deepEqual(app.activeBranch(state).session.population.map((candidate) => candidate.id).sort(), ids);
});

test("ordering changes preserve the current card and never re-show a skipped prefix", () => {
  let state = app.createAppState({ seed: 341, populationSize: 8 });
  const skipped = app.currentDeckCandidate(state).id;
  state = app.swipeCandidate(state, skipped, "left");
  const current = app.currentDeckCandidate(state).id;
  state = {
    ...state,
    preference: { ...state.preference, weights: [2, -1, 1.5, -0.5, 0.75] },
  };
  state = app.setOrdering(state, "preference");

  assert.equal(app.currentDeckCandidate(state).id, current);
  assert.equal(app.activeBranch(state).deck.orderIds[0], skipped);
  assert.equal(app.activeBranch(state).deck.orderIds.slice(1).includes(skipped), false);
});

test("all-candidate selection shares the right-swipe decision transition", () => {
  let state = app.createAppState({ seed: 351, populationSize: 8 });
  const branch = app.activeBranch(state);
  const nonTopId = branch.deck.orderIds[3];
  state = app.beginMotherDecision(state, nonTopId, "all");
  assert.equal(app.activeBranch(state).decision.primaryId, nonTopId);
  assert.equal(app.activeBranch(state).deck.history.at(-1).source, "all");
  state = app.undoSwipe(state);
  assert.equal(app.activeBranch(state).decision.phase, "browsing");
  assert.equal(app.activeBranch(state).deck.cursor, 0);
});

test("a growth decision requires an intent and boundary policy", () => {
  let state = app.createAppState({ seed: 361, populationSize: 8 });
  const primaryId = app.currentDeckCandidate(state).id;
  state = app.swipeCandidate(state, primaryId, "right");
  state = app.setDecisionAction(state, "grow");
  assert.throws(() => app.executeDecision(state, { seed: 362 }), /growth intent/i);
  state = app.setGrowthIntent(state, "contrast");
  assert.throws(() => app.executeDecision(state, { seed: 363 }), /boundary policy/i);
  state = app.setBoundaryPolicy(state, "strict");
  state = app.executeDecision(state, { seed: 364 });
  assert.equal(app.activeBranch(state).session.stageBars, 4);
  assert.equal(app.activeBranch(state).session.stageContract.growthIntent, "contrast");
  assert.equal(app.activeBranch(state).session.stageContract.boundaryPolicy, "strict");
  assert.equal(app.activeBranch(state).decision.phase, "browsing");
  assert.equal(app.activeBranch(state).deck.cursor, 0);
  const lineage = app.activeBranch(state).lineage.at(-1);
  assert.deepEqual(lineage.stageContract, app.activeBranch(state).session.stageContract);
  assert.equal(lineage.boundaryResults.length, app.activeBranch(state).session.population.length);
  assert.ok(lineage.boundaryResults.every((result) => result.changeCount === 0));
});

test("a 16-bar decision can finalize only after a complete audition", () => {
  let state = advanceAppToFinalStage(371);
  const primaryId = app.currentDeckCandidate(state).id;
  state = app.swipeCandidate(state, primaryId, "right");
  state = app.setDecisionAction(state, "finalize");
  assert.throws(() => app.executeDecision(state), /complete.*audition/i);
  state = app.completeAudition(state, primaryId);
  state = app.executeDecision(state);
  assert.equal(app.activeBranch(state).finalCandidate.bars.length, 16);
  assert.equal(app.activeBranch(state).lineage.at(-1).action, "final");
});

test("reference selection updates only the chosen preference dimension", () => {
  let state = app.createAppState({ seed: 381, populationSize: 8 });
  const primaryId = app.currentDeckCandidate(state).id;
  const fixture = withMeaningfulReference(state, primaryId, "register");
  state = fixture.state;
  state = app.swipeCandidate(state, primaryId, "right");
  state = app.setDecisionAction(state, "evolve");
  state = app.addTraitReference(state, fixture.referenceId, "register");
  const referenceName = app.activeBranch(state).session.population
    .find((candidate) => candidate.id === fixture.referenceId).name;
  const before = [...state.preference.weights];
  state = app.executeDecision(state, { seed: 382 });
  const changed = state.preference.weights.map((value, index) => value !== before[index]);
  assert.deepEqual(changed, [false, false, true, false, false]);
  assert.equal(app.activeBranch(state).lineage.at(-1).references[0].trait, "register");
  assert.equal(app.activeBranch(state).lineage.at(-1).references[0].candidateName, referenceName);
  assert.match(app.activeBranch(state).lineage.at(-1).references[0].candidateLabel, /^随机 \d{2} · /);
  assert.ok(app.activeBranch(state).lineage.at(-1).generatedReferenceResults.length > 0);
});

test("decision execution rejects unknown actions and oversized reference contracts", () => {
  let state = app.createAppState({ seed: 386, populationSize: 8 });
  const primaryId = app.currentDeckCandidate(state).id;
  state = app.swipeCandidate(state, primaryId, "right");
  const branchIndex = state.branches.findIndex((branch) => branch.id === state.activeBranchId);
  state.branches[branchIndex].decision.action = "erase";
  assert.throws(() => app.executeDecision(state, { seed: 387 }), /unsupported decision action/i);

  state.branches[branchIndex].decision.action = "evolve";
  const referenceIds = state.branches[branchIndex].session.population
    .filter((candidate) => candidate.id !== primaryId)
    .slice(0, 3)
    .map((candidate) => candidate.id);
  state.branches[branchIndex].decision.references = referenceIds.map((candidateId) => ({
    candidateId,
    trait: "register",
    primaryValue: 0,
    targetValue: 1,
  }));
  assert.throws(() => app.executeDecision(state, { seed: 388 }), /at most two/i);
});

test("completed left swipes compare against the mother while canceled choices stay neutral", () => {
  let state = app.createAppState({ seed: 391, populationSize: 8 });
  const skippedId = app.currentDeckCandidate(state).id;
  state = app.completeAudition(state, skippedId);
  state = app.swipeCandidate(state, skippedId, "left");
  const primaryId = app.currentDeckCandidate(state).id;
  state = app.swipeCandidate(state, primaryId, "right");
  const beforeCancel = JSON.parse(JSON.stringify(state.preference));
  state = app.cancelDecision(state);
  assert.deepEqual(state.preference, beforeCancel);

  state = app.swipeCandidate(state, primaryId, "right");
  state = app.setDecisionAction(state, "evolve");
  state = app.executeDecision(state, { seed: 392 });
  assert.equal(state.preference.observations, 1);
  assert.equal(state.preference.feedbackCount, 1);
  assert.notDeepEqual(state.preference.weights, beforeCancel.weights);
});

test("a recoverable v2 stage rebuilds its anchor and deck without losing candidates", () => {
  const v2 = downgradeToV2(growOnceThroughDecision(
    app.createAppState({ seed: 401, populationSize: 8 }),
    402,
  ));
  const expectedCount = app.activeBranch(v2).session.population.length;
  const restored = app.restoreState(app.serializeState(v2), { seed: 999 });
  const branch = app.activeBranch(restored);
  assert.equal(restored.version, 3);
  assert.equal(branch.session.population.length, expectedCount);
  assert.equal(branch.deck.cursor, 0);
  assert.equal(branch.decision.phase, "browsing");
  assert.equal(branch.migrationState, "active");
  assert.ok(branch.session.stageContract.boundaryAnchor);
  assert.equal(branch.session.stageContract.growthIntent, "legacy");
  assert.equal(branch.session.rootMotif.length, 2);
  assert.equal(branch.session.snapshots[0].stageContract, null);

  const rolledBack = app.rollbackCurrentStage(restored);
  assert.equal(app.activeBranch(rolledBack).session.stageIndex, 0);
  assert.equal(app.activeBranch(rolledBack).decision.phase, "browsing");
  assert.equal(app.activeBranch(rolledBack).deck.cursor, 0);
});

test("an unsafe v2 branch is preserved read-only beside a fresh active branch", () => {
  const grown = growOnceThroughDecision(app.createAppState({ seed: 411, populationSize: 8 }), 412);
  const v2 = downgradeToV2(grown, { removeSnapshots: true });
  const legacyCandidateIds = app.activeBranch(v2).session.population.map((candidate) => candidate.id);
  const restored = app.restoreState(app.serializeState(v2), { seed: 413, populationSize: 8 });
  const legacy = restored.branches.find((branch) => branch.migrationState === "read-only");

  assert.ok(legacy);
  assert.deepEqual(legacy.session.population.map((candidate) => candidate.id), legacyCandidateIds);
  assert.notEqual(restored.activeBranchId, legacy.id);
  assert.equal(app.activeBranch(restored).migrationState, "active");
  assert.throws(
    () => app.beginMotherDecision({ ...restored, activeBranchId: legacy.id }, legacyCandidateIds[0], "all"),
    /read-only/i,
  );
  const legacyState = { ...restored, activeBranchId: legacy.id };
  assert.throws(() => app.copyBranch(legacyState), /read-only/i);
  assert.throws(() => app.updateTempo(legacyState, 120), /read-only/i);
  assert.throws(() => app.rollbackCurrentStage(legacyState), /read-only/i);
  assert.doesNotThrow(() => app.completeAudition(legacyState, legacyCandidateIds[0]));

  const restoredAgain = app.restoreState(app.serializeState(restored), { seed: 414, populationSize: 8 });
  assert.equal(restoredAgain.branches.length, restored.branches.length);
  assert.equal(restoredAgain.activeBranchId, restored.activeBranchId);
});

test("multi-stage v2 migration rebuilds every rollback contract", () => {
  let state = app.createAppState({ seed: 416, populationSize: 8 });
  for (let stage = 0; stage < 3; stage += 1) {
    state = growOnceThroughDecision(state, 417 + stage, {
      intent: ["continue", "vary", "contrast"][stage],
      boundaryPolicy: stage % 2 ? "light" : "strict",
    });
  }
  state = app.restoreState(app.serializeState(downgradeToV2(state)), { seed: 999 });
  assert.equal(app.activeBranch(state).session.stageIndex, 3);
  assert.deepEqual(
    app.activeBranch(state).session.snapshots.map((snapshot) => snapshot.stageContract?.growthIntent || null),
    [null, "legacy", "legacy"],
  );
  for (let expectedStage = 2; expectedStage >= 0; expectedStage -= 1) {
    state = app.rollbackCurrentStage(state);
    assert.equal(app.activeBranch(state).session.stageIndex, expectedStage);
    assert.equal(app.activeBranch(state).decision.phase, "browsing");
  }
});

test("rollback and branch copies isolate decks, decisions, and stage contracts", () => {
  let state = app.createAppState({ seed: 421, populationSize: 8 });
  const primaryId = app.currentDeckCandidate(state).id;
  state = app.swipeCandidate(state, primaryId, "right");
  state = app.setDecisionAction(state, "grow");
  state = app.setGrowthIntent(state, "vary");
  state = app.setBoundaryPolicy(state, "light");
  const preGrowth = JSON.parse(JSON.stringify(app.activeBranch(state)));
  state = app.executeDecision(state, { seed: 422 });
  state = app.rollbackCurrentStage(state);
  const rolledBack = app.activeBranch(state);
  assert.deepEqual(rolledBack.deck, preGrowth.deck);
  assert.deepEqual(rolledBack.decision, preGrowth.decision);
  assert.deepEqual(rolledBack.session.stageContract, preGrowth.session.stageContract);

  const originalId = rolledBack.id;
  state = app.copyBranch(state);
  state = app.setGrowthIntent(state, "contrast");
  const original = state.branches.find((branch) => branch.id === originalId);
  assert.equal(original.decision.intent, "vary");
  assert.equal(app.activeBranch(state).decision.intent, "contrast");
});

test("only listened unselected candidates become preference comparisons", () => {
  let state = app.createAppState({ seed: 81, populationSize: 8 });
  const population = app.activeBranch(state).session.population;
  state = app.markListened(state, population[0].id);
  state = app.selectPrimary(state, population[1].id);
  state = app.evolveCurrentStage(state, { seed: 82 });

  assert.equal(state.preference.observations, 1);
  assert.equal(state.preference.feedbackCount, 1);
  assert.equal(app.activeBranch(state).session.stageIndex, 0);
  assert.equal(app.activeBranch(state).session.evolutionRound, 2);
});

test("unseen candidates are not treated as negative preference evidence", () => {
  let state = app.createAppState({ seed: 83, populationSize: 8 });
  const selectedId = app.activeBranch(state).session.population[0].id;
  state = app.selectPrimary(state, selectedId);
  state = app.evolveCurrentStage(state, { seed: 84 });

  assert.equal(state.preference.observations, 0);
  assert.deepEqual(state.preference.weights, [0, 0, 0, 0, 0]);
});

test("only freeze and grow changes melody length and a copied branch is independent", () => {
  let state = app.createAppState({ seed: 91, populationSize: 8 });
  const seedId = app.activeBranch(state).session.population[0].id;
  state = app.selectPrimary(state, seedId);
  state = app.copyBranch(state);

  assert.equal(state.branches.length, 2);
  const originalBranchId = state.branches[0].id;
  state = app.freezeCurrentStage(state, {
    seed: 92,
    intent: "continue",
    boundaryPolicy: "light",
    references: [],
  });
  assert.equal(app.activeBranch(state).session.stageBars, 4);

  state = app.switchBranch(state, originalBranchId);
  assert.equal(app.activeBranch(state).session.stageBars, 2);
});

test("a final 16-bar melody requires a complete audition before confirmation", () => {
  let state = app.createAppState({ seed: 101, populationSize: 8 });
  for (let stage = 0; stage < 4; stage += 1) {
    const candidateId = app.activeBranch(state).session.population[0].id;
    state = app.selectPrimary(state, candidateId);
    state = app.freezeCurrentStage(state, {
      seed: 102 + stage,
      intent: "continue",
      boundaryPolicy: "light",
      references: [],
    });
  }

  const finalId = app.activeBranch(state).session.population[0].id;
  state = app.selectPrimary(state, finalId);
  assert.throws(() => app.freezeCurrentStage(state), /完整试听/);
  state = app.markFullyAuditioned(state, finalId);
  state = app.freezeCurrentStage(state);

  assert.equal(app.activeBranch(state).finalCandidate.bars.length, 16);
});

test("versioned persistence restores branch-local evolution state", () => {
  let state = app.createAppState({ seed: 111, populationSize: 8 });
  state = app.selectPrimary(state, app.activeBranch(state).session.population[0].id);
  state = app.copyBranch(state);
  state = app.freezeCurrentStage(state, {
    seed: 112,
    intent: "continue",
    boundaryPolicy: "light",
    references: [],
  });

  const restored = app.restoreState(app.serializeState(state), { seed: 999 });
  assert.equal(restored.version, app.APP_VERSION);
  assert.equal(restored.branches.length, 2);
  assert.equal(restored.activeBranchId, state.activeBranchId);
  assert.equal(app.activeBranch(restored).session.stageBars, 4);
});

test("candidate preview audio schedules only the boundary and growth bars", () => {
  let state = app.createAppState({ seed: 121, populationSize: 8 });
  for (let stage = 0; stage < 3; stage += 1) {
    state = app.selectPrimary(state, app.activeBranch(state).session.population[0].id);
    state = app.freezeCurrentStage(state, {
      seed: 122 + stage,
      intent: "continue",
      boundaryPolicy: "light",
      references: [],
    });
  }
  const branch = app.activeBranch(state);
  const schedule = app.buildPlaybackSchedule(
    branch.session.population[0],
    branch.session.harmony,
    { mode: "preview", stageIndex: branch.session.stageIndex, accompaniment: true },
  );

  assert.equal(schedule.startBar, 7);
  assert.equal(schedule.endBar, 12);
  assert.equal(schedule.durationBeats, 20);
  assert.ok(schedule.melodyEvents.every((event) => event.barIndex >= 7 && event.barIndex < 12));
  assert.equal(schedule.chordEvents.length, 15);
});

test("boundary comparison schedules anchor then candidate without accompaniment", () => {
  let state = app.createAppState({ seed: 401, populationSize: 8 });
  const primaryId = app.currentDeckCandidate(state).id;
  state = app.swipeCandidate(state, primaryId, "right");
  state = app.setDecisionAction(state, "grow");
  state = app.setGrowthIntent(state, "continue");
  state = app.setBoundaryPolicy(state, "light");
  state = app.executeDecision(state, { seed: 402 });
  const branch = app.activeBranch(state);
  const candidate = branch.session.population[0];
  const schedule = app.buildBoundaryComparisonSchedule(
    branch.session.stageContract.boundaryAnchor,
    candidate.bars[branch.session.stageContract.boundaryIndex],
    branch.session.harmony,
  );

  assert.equal(schedule.sections.length, 2);
  assert.deepEqual(schedule.sections.map((section) => section.label), ["原交界", "当前交界"]);
  assert.equal(schedule.sections[0].startBeat, 0);
  assert.equal(schedule.sections[1].startBeat, 5);
  assert.equal(schedule.durationBeats, 9);
  assert.equal(schedule.chordEvents.length, 0);
});

test("full playback covers all sixteen bars and accompaniment is optional", () => {
  let state = app.createAppState({ seed: 131, populationSize: 8 });
  for (let stage = 0; stage < 4; stage += 1) {
    state = app.selectPrimary(state, app.activeBranch(state).session.population[0].id);
    state = app.freezeCurrentStage(state, {
      seed: 132 + stage,
      intent: "continue",
      boundaryPolicy: "light",
      references: [],
    });
  }
  const branch = app.activeBranch(state);
  const schedule = app.buildPlaybackSchedule(
    branch.session.population[0],
    branch.session.harmony,
    { mode: "full", stageIndex: 4, accompaniment: false },
  );

  assert.equal(schedule.startBar, 0);
  assert.equal(schedule.endBar, 16);
  assert.equal(schedule.durationBeats, 64);
  assert.equal(schedule.chordEvents.length, 0);
});

test("evolution lineage stores immutable mother snapshot and generation candidates", () => {
  let state = app.createAppState({ seed: 501, populationSize: 8 });
  const primaryId = app.currentDeckCandidate(state).id;
  const motherBefore = JSON.parse(JSON.stringify(
    app.activeBranch(state).session.population.find((c) => c.id === primaryId)
  ));

  state = app.swipeCandidate(state, primaryId, "right");
  state = app.setDecisionAction(state, "evolve");
  state = app.executeDecision(state, { seed: 502 });

  const lineage = app.activeBranch(state).lineage.at(-1);
  assert.ok(lineage.playbackSnapshot, "Lineage record should have playback snapshot");
  assert.ok(lineage.playbackSnapshot.mother, "Playback snapshot should have mother");
  assert.ok(lineage.playbackSnapshot.candidates, "Playback snapshot should have candidates");
  assert.deepEqual(lineage.playbackSnapshot.mother, motherBefore, "Mother should be immutable snapshot");
  assert.equal(lineage.playbackSnapshot.candidates.length, app.activeBranch(state).session.population.length);
});

test("freeze-grow lineage stores immutable mother snapshot and generation candidates", () => {
  let state = app.createAppState({ seed: 511, populationSize: 8 });
  const primaryId = app.currentDeckCandidate(state).id;
  const motherBefore = JSON.parse(JSON.stringify(
    app.activeBranch(state).session.population.find((c) => c.id === primaryId)
  ));

  state = app.swipeCandidate(state, primaryId, "right");
  state = app.setDecisionAction(state, "grow");
  state = app.setGrowthIntent(state, "continue");
  state = app.setBoundaryPolicy(state, "light");
  state = app.executeDecision(state, { seed: 512 });

  const lineage = app.activeBranch(state).lineage.at(-1);
  assert.ok(lineage.playbackSnapshot, "Freeze-grow lineage record should have playback snapshot");
  assert.ok(lineage.playbackSnapshot.mother, "Playback snapshot should have mother");
  assert.ok(lineage.playbackSnapshot.candidates, "Playback snapshot should have candidates");
  assert.deepEqual(lineage.playbackSnapshot.mother, motherBefore, "Mother should be immutable snapshot");
  assert.equal(lineage.playbackSnapshot.candidates.length, app.activeBranch(state).session.population.length);
});

test("legacy lineage without playback snapshot loads without error", () => {
  let state = app.createAppState({ seed: 521, populationSize: 8 });
  state = growOnceThroughDecision(state, 522);
  const legacy = JSON.parse(JSON.stringify(state));
  legacy.branches[0].lineage.forEach((record) => delete record.playbackSnapshot);

  const restored = app.restoreState(app.serializeState(legacy), { seed: 999 });
  assert.equal(restored.version, app.APP_VERSION);
  assert.equal(app.activeBranch(restored).lineage.length, 1);
  assert.equal(app.activeBranch(restored).lineage[0].playbackSnapshot, undefined);
});

test("playback snapshot is independent and does not affect current state", () => {
  let state = app.createAppState({ seed: 531, populationSize: 8 });
  const primaryId = app.currentDeckCandidate(state).id;
  const originalMotherPitch = app.activeBranch(state).session.population
    .find((c) => c.id === primaryId).bars[0].events[0].pitch;

  state = app.swipeCandidate(state, primaryId, "right");
  state = app.setDecisionAction(state, "evolve");
  state = app.executeDecision(state, { seed: 532 });

  const lineage = app.activeBranch(state).lineage.at(-1);
  const snapshot = lineage.playbackSnapshot;
  const snapshotMotherPitch = snapshot.mother.bars[0].events[0].pitch;
  assert.equal(snapshotMotherPitch, originalMotherPitch, "Snapshot should preserve original mother pitch");

  app.activeBranch(state).session.population[0].bars[0].events[0].pitch += 24;

  const preservedMotherPitch = app.activeBranch(state).lineage.at(-1).playbackSnapshot.mother.bars[0].events[0].pitch;
  assert.equal(preservedMotherPitch, originalMotherPitch, "Snapshot should not be affected by current state changes");
});

test("playback snapshot candidates contain all population members with full bar data", () => {
  let state = app.createAppState({ seed: 541, populationSize: 8 });
  const primaryId = app.currentDeckCandidate(state).id;

  state = app.swipeCandidate(state, primaryId, "right");
  state = app.setDecisionAction(state, "evolve");
  state = app.executeDecision(state, { seed: 542 });

  const lineage = app.activeBranch(state).lineage.at(-1);
  const candidates = lineage.playbackSnapshot.candidates;
  const currentPopulation = app.activeBranch(state).session.population;

  candidates.forEach((candidate, index) => {
    assert.equal(candidate.id, currentPopulation[index].id);
    assert.equal(candidate.name, currentPopulation[index].name);
    assert.equal(candidate.bars.length, currentPopulation[index].bars.length);
    candidate.bars.forEach((bar, barIndex) => {
      assert.deepEqual(bar.events, currentPopulation[index].bars[barIndex].events);
    });
  });
});
