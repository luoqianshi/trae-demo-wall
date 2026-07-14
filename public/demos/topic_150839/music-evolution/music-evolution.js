(function initMusicEvolutionApp(root, factory) {
  const isCommonJs = typeof module === "object" && module.exports;
  const core = isCommonJs ? require("./music-evolution-core.js") : root.MusicEvolutionCore;
  const api = factory(core);

  if (isCommonJs) module.exports = api;
  if (root) root.MusicEvolutionApp = api;

  if (!isCommonJs && root?.document) {
    const start = () => api.mount(root.document, root);
    if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createMusicEvolutionApp(core) {
  "use strict";

  if (!core) throw new Error("MusicEvolutionCore is required.");

  const APP_VERSION = 3;
  const STORAGE_KEY = "music-evolution-session-v3";
  const LEGACY_STORAGE_KEY = "music-evolution-session-v2";
  const TRAIT_KEYS = ["density", "contour", "register", "space", "tension"];
  const GROWTH_INTENTS = ["continue", "vary", "contrast", "return"];
  const BOUNDARY_POLICIES = ["strict", "light"];
  const TRAIT_LABELS = {
    density: "密度",
    contour: "走向",
    register: "音区",
    space: "留白",
    tension: "张力",
  };
  const INTENT_LABELS = {
    continue: "承接",
    vary: "变化",
    contrast: "对比",
    return: "回归",
  };
  const INTENT_ICONS = {
    continue: "arrow-right",
    vary: "waves",
    contrast: "split",
    return: "rotate-ccw",
  };
  const ACTION_LABELS = {
    evolve: "按母本再进化",
    grow: "冻结并生长",
    finalize: "完成作品",
  };
  const BOUNDARY_LABELS = {
    strict: "严格冻结",
    light: "允许轻调",
  };
  const PITCH_CLASS_NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function swipeDirection({ distanceX, width, velocityX }) {
    const distanceThreshold = Math.max(72, Math.max(0, Number(width) || 0) * 0.22);
    const distance = Number(distanceX) || 0;
    const velocity = Number(velocityX) || 0;
    if (Math.abs(distance) >= distanceThreshold) return distance < 0 ? "left" : "right";
    if (Math.abs(velocity) >= 0.65 && Math.abs(distance) >= 24) return velocity < 0 ? "left" : "right";
    return null;
  }

  function suggestedGrowthIntent(stageIndex) {
    return GROWTH_INTENTS[clamp(Math.trunc(Number(stageIndex) || 0), 0, GROWTH_INTENTS.length - 1)];
  }

  function createPreferenceState() {
    return {
      weights: Array(TRAIT_KEYS.length).fill(0),
      observations: 0,
      feedbackCount: 0,
    };
  }

  function randomOrderFor(session, salt = 0) {
    const ids = session.population.map((candidate) => candidate.id);
    const rng = core.createRng(
      session.seed
      + session.stageIndex * 1009
      + session.evolutionRound * 9173
      + (Number(salt) || 0) * 104729,
    );
    for (let index = ids.length - 1; index > 0; index -= 1) {
      const target = Math.floor(rng() * (index + 1));
      [ids[index], ids[target]] = [ids[target], ids[index]];
    }
    return ids;
  }

  function createDeckState(session, orderIds = randomOrderFor(session)) {
    return {
      orderIds: [...orderIds],
      cursor: 0,
      history: [],
      completedIds: [],
      comparisonIds: [],
      exhausted: orderIds.length === 0,
      reshuffleCount: 0,
    };
  }

  function createDecisionState() {
    return {
      phase: "browsing",
      primaryId: null,
      action: null,
      references: [],
      intent: null,
      boundaryPolicy: null,
    };
  }

  function createBranch(session, index = 1, name = `分支 ${index}`) {
    const randomOrder = randomOrderFor(session);
    return {
      id: `branch-${session.seed}-${index}`,
      name,
      session,
      ordering: "random",
      randomOrder,
      deck: createDeckState(session, randomOrder),
      decision: createDecisionState(),
      selectedIds: [],
      listenedIds: [],
      fullAuditionedIds: [],
      lineage: [],
      uiSnapshots: [],
      finalCandidate: null,
      migrationState: "active",
      migrationReason: null,
    };
  }

  function createAppState(options = {}) {
    const populationSize = Number(options.populationSize ?? 12);
    const session = core.createInitialSession({
      seed: Number(options.seed ?? Date.now()),
      populationSize,
      key: options.key,
      bpm: options.bpm,
    });
    const branch = createBranch(session, 1, "主分支");
    return {
      version: APP_VERSION,
      activeBranchId: branch.id,
      nextBranchNumber: 2,
      branches: [branch],
      preference: createPreferenceState(),
      settings: {
        mutationRate: clamp(Number(options.mutationRate ?? 0.28), 0.08, 0.62),
        accompaniment: options.accompaniment !== false,
        instrument: options.instrument || "piano",
      },
    };
  }

  function activeBranch(state) {
    return state.branches.find((branch) => branch.id === state.activeBranchId) || state.branches[0];
  }

  function replaceActiveBranch(state, nextBranch) {
    return {
      ...state,
      branches: state.branches.map((branch) => (branch.id === state.activeBranchId ? nextBranch : branch)),
    };
  }

  function updateBranchById(state, branchId, update) {
    if (!state.branches.some((branch) => branch.id === branchId)) return state;
    return {
      ...state,
      branches: state.branches.map((branch) => (branch.id === branchId ? update(branch) : branch)),
    };
  }

  function assertCreativeBranchWritable(branch) {
    if (branch.migrationState === "read-only") {
      throw new Error(`This migrated branch is read-only${branch.migrationReason ? `: ${branch.migrationReason}` : ""}`);
    }
  }

  function candidateFeatureVector(candidate, harmony) {
    const traits = core.candidateTraits(candidate, harmony);
    return [
      clamp(traits.density, 0, 1),
      clamp((traits.contour + 1) / 2, 0, 1),
      clamp((traits.register - 48) / 36, 0, 1),
      clamp(traits.space, 0, 1),
      clamp(traits.tension, 0, 1),
    ];
  }

  function preferenceScore(candidate, harmony, preference) {
    const features = candidateFeatureVector(candidate, harmony);
    return features.reduce((sum, value, index) => sum + value * (preference.weights[index] || 0), 0);
  }

  function learnPreference(preference, branch) {
    const selected = branch.selectedIds
      .map((id) => branch.session.population.find((candidate) => candidate.id === id))
      .filter(Boolean);
    const selectedSet = new Set(selected.map((candidate) => candidate.id));
    const comparisons = branch.listenedIds
      .filter((id) => !selectedSet.has(id))
      .map((id) => branch.session.population.find((candidate) => candidate.id === id))
      .filter(Boolean);

    const next = {
      weights: [...preference.weights],
      observations: preference.observations + comparisons.length,
      feedbackCount: preference.feedbackCount + selected.length,
    };
    if (!selected.length || !comparisons.length) return next;

    const positiveVectors = selected.map((candidate) => candidateFeatureVector(candidate, branch.session.harmony));
    const positiveMean = TRAIT_KEYS.map((_, index) => (
      positiveVectors.reduce((sum, vector) => sum + vector[index], 0) / positiveVectors.length
    ));

    comparisons.forEach((candidate) => {
      const negative = candidateFeatureVector(candidate, branch.session.harmony);
      next.weights = next.weights.map((weight, index) => clamp(
        weight + (positiveMean[index] - negative[index]) * 0.34,
        -3,
        3,
      ));
    });
    return next;
  }

  function applyReferencePreference(weights, reference) {
    const index = TRAIT_KEYS.indexOf(reference.trait);
    if (index < 0) return weights;
    const direction = Math.sign(reference.targetValue - reference.primaryValue);
    return weights.map((weight, weightIndex) => (
      weightIndex === index ? clamp(weight + direction * 0.12, -3, 3) : weight
    ));
  }

  function learnDecisionPreference(preference, branch, decision) {
    const primary = branch.session.population.find((candidate) => candidate.id === decision.primaryId);
    if (!primary) return { ...preference, weights: [...preference.weights] };
    const comparisons = (branch.deck?.comparisonIds || [])
      .filter((id) => id !== primary.id)
      .map((id) => branch.session.population.find((candidate) => candidate.id === id))
      .filter(Boolean);
    const positive = candidateFeatureVector(primary, branch.session.harmony);
    let weights = [...preference.weights];
    comparisons.forEach((candidate) => {
      const negative = candidateFeatureVector(candidate, branch.session.harmony);
      weights = weights.map((weight, index) => clamp(
        weight + (positive[index] - negative[index]) * 0.34,
        -3,
        3,
      ));
    });
    decision.references.forEach((reference) => {
      weights = applyReferencePreference(weights, reference);
    });
    return {
      weights,
      observations: preference.observations + comparisons.length,
      feedbackCount: preference.feedbackCount + 1 + decision.references.length,
    };
  }

  function setOrdering(state, ordering) {
    if (!["random", "preference"].includes(ordering)) return state;
    const branch = activeBranch(state);
    assertCreativeBranchWritable(branch);
    if (!branch.deck) return replaceActiveBranch(state, { ...branch, ordering });
    const processed = branch.deck.orderIds.slice(0, branch.deck.cursor);
    const currentId = branch.deck.orderIds[branch.deck.cursor] || null;
    const reorderedState = replaceActiveBranch(state, { ...branch, ordering });
    const rankedIds = orderedCandidateIds(reorderedState);
    const processedSet = new Set(processed);
    const unseen = rankedIds.filter((id) => !processedSet.has(id) && id !== currentId);
    const orderIds = [...processed, ...(currentId ? [currentId] : []), ...unseen];
    const nextBranch = activeBranch(reorderedState);
    return replaceActiveBranch(reorderedState, {
      ...nextBranch,
      deck: {
        ...nextBranch.deck,
        orderIds,
        exhausted: nextBranch.deck.cursor >= orderIds.length,
      },
    });
  }

  function orderedCandidates(state) {
    const branch = activeBranch(state);
    const populationById = new Map(branch.session.population.map((candidate) => [candidate.id, candidate]));
    const randomOrder = branch.randomOrder
      .map((id) => populationById.get(id))
      .filter(Boolean);
    branch.session.population.forEach((candidate) => {
      if (!randomOrder.some((item) => item.id === candidate.id)) randomOrder.push(candidate);
    });
    if (branch.ordering === "random") return randomOrder;

    const randomRank = new Map(randomOrder.map((candidate, index) => [candidate.id, index]));
    return [...randomOrder].sort((left, right) => {
      const scoreDifference = preferenceScore(right, branch.session.harmony, state.preference)
        - preferenceScore(left, branch.session.harmony, state.preference);
      return Math.abs(scoreDifference) > 1e-9
        ? scoreDifference
        : randomRank.get(left.id) - randomRank.get(right.id);
    });
  }

  function orderedCandidateIds(state) {
    return orderedCandidates(state).map((candidate) => candidate.id);
  }

  function currentDeckCandidate(state) {
    const branch = activeBranch(state);
    const candidateId = branch.deck?.orderIds?.[branch.deck.cursor];
    return branch.session.population.find((candidate) => candidate.id === candidateId) || null;
  }

  function beginMotherDecision(state, candidateId, source = "all") {
    const branch = activeBranch(state);
    assertCreativeBranchWritable(branch);
    if (!branch.session.population.some((candidate) => candidate.id === candidateId)) {
      throw new Error("Mother candidate is not in the current population");
    }
    if (!branch.deck || !branch.decision) throw new Error("Candidate deck is unavailable");
    return replaceActiveBranch(state, {
      ...branch,
      deck: {
        ...branch.deck,
        history: [...branch.deck.history, {
          candidateId,
          direction: "right",
          source,
          priorCursor: branch.deck.cursor,
          priorExhausted: branch.deck.exhausted,
          priorDecision: cloneJson(branch.decision),
          comparisonAdded: false,
        }],
      },
      decision: { ...createDecisionState(), phase: "choose-action", primaryId: candidateId },
    });
  }

  function swipeCandidate(state, candidateId, direction) {
    const branch = activeBranch(state);
    assertCreativeBranchWritable(branch);
    const current = currentDeckCandidate(state);
    if (!current || current.id !== candidateId) throw new Error("Swipe candidate is not current");
    if (!["left", "right"].includes(direction)) throw new Error(`Unsupported swipe direction: ${direction}`);
    if (branch.decision.phase !== "browsing") throw new Error("Finish or cancel the current decision first");
    if (direction === "right") return beginMotherDecision(state, candidateId, "deck");

    const completed = branch.deck.completedIds.includes(candidateId);
    const comparisonAdded = completed && !branch.deck.comparisonIds.includes(candidateId);
    const comparisonIds = comparisonAdded
      ? [...branch.deck.comparisonIds, candidateId]
      : branch.deck.comparisonIds;
    const cursor = branch.deck.cursor + 1;
    const deck = {
      ...branch.deck,
      cursor,
      history: [...branch.deck.history, {
        candidateId,
        direction: "left",
        completed,
        comparisonAdded,
        priorCursor: branch.deck.cursor,
        priorExhausted: branch.deck.exhausted,
        priorDecision: cloneJson(branch.decision),
      }],
      comparisonIds,
      exhausted: cursor >= branch.deck.orderIds.length,
    };
    return replaceActiveBranch(state, { ...branch, deck });
  }

  function undoSwipe(state) {
    const branch = activeBranch(state);
    assertCreativeBranchWritable(branch);
    const history = branch.deck?.history || [];
    if (!history.length) return state;
    const entry = history.at(-1);
    const comparisonIds = entry.comparisonAdded
      ? branch.deck.comparisonIds.filter((id) => id !== entry.candidateId)
      : branch.deck.comparisonIds;
    return replaceActiveBranch(state, {
      ...branch,
      deck: {
        ...branch.deck,
        cursor: Number.isInteger(entry.priorCursor) ? entry.priorCursor : branch.deck.cursor,
        history: history.slice(0, -1),
        comparisonIds,
        exhausted: Boolean(entry.priorExhausted),
      },
      decision: entry.priorDecision ? cloneJson(entry.priorDecision) : createDecisionState(),
    });
  }

  function cancelDecision(state) {
    const branch = activeBranch(state);
    assertCreativeBranchWritable(branch);
    if (branch.decision?.phase === "browsing") return state;
    const latest = branch.deck?.history?.at(-1);
    if (latest?.direction === "right") return undoSwipe(state);
    return replaceActiveBranch(state, { ...branch, decision: createDecisionState() });
  }

  function updateActiveDecision(state, update) {
    const branch = activeBranch(state);
    assertCreativeBranchWritable(branch);
    if (!branch.decision) throw new Error("Creative decision state is unavailable");
    return replaceActiveBranch(state, {
      ...branch,
      decision: update(branch.decision),
    });
  }

  function setDecisionAction(state, action) {
    if (!["evolve", "grow", "finalize"].includes(action)) {
      throw new Error(`Unsupported decision action: ${action}`);
    }
    const branch = activeBranch(state);
    assertCreativeBranchWritable(branch);
    const isFinalStage = branch.session.stageIndex === core.GROWTH_STAGES.length - 1;
    if (action === "grow" && isFinalStage) throw new Error("A 16-bar melody cannot grow again");
    if (action === "finalize" && !isFinalStage) throw new Error("Only a 16-bar melody can be finalized");
    return updateActiveDecision(state, (decision) => ({
      ...decision,
      action,
      phase: action === "grow" ? "configure-growth" : action === "evolve" ? "configure-references" : "confirm",
      intent: action === "grow" ? decision.intent : null,
      boundaryPolicy: action === "grow" ? decision.boundaryPolicy : null,
      references: action === "finalize" ? [] : decision.references,
    }));
  }

  function setGrowthIntent(state, intent) {
    if (!GROWTH_INTENTS.includes(intent)) throw new Error(`Unsupported growth intent: ${intent}`);
    const branch = activeBranch(state);
    if (branch.decision?.action !== "grow") throw new Error("Choose grow before setting a growth intent");
    return updateActiveDecision(state, (decision) => ({ ...decision, intent }));
  }

  function setBoundaryPolicy(state, boundaryPolicy) {
    if (!BOUNDARY_POLICIES.includes(boundaryPolicy)) {
      throw new Error(`Unsupported boundary policy: ${boundaryPolicy}`);
    }
    const branch = activeBranch(state);
    if (branch.decision?.action !== "grow") throw new Error("Choose grow before setting a boundary policy");
    return updateActiveDecision(state, (decision) => ({ ...decision, boundaryPolicy }));
  }

  function addTraitReference(state, candidateId, trait) {
    const branch = activeBranch(state);
    assertCreativeBranchWritable(branch);
    if (!["evolve", "grow"].includes(branch.decision?.action)) {
      throw new Error("Choose evolve or grow before adding a reference");
    }
    const primary = branch.session.population.find((candidate) => candidate.id === branch.decision.primaryId);
    const reference = branch.session.population.find((candidate) => candidate.id === candidateId);
    if (!primary || !reference) throw new Error("Primary or reference candidate is missing");
    if (reference.id === primary.id) throw new Error("The mother cannot reference itself");
    const descriptor = core.traitReferenceDescriptor(primary, reference, trait, branch.session.harmony);
    if (!descriptor.meaningful) throw new Error("Reference trait is too close to the mother");
    const retained = branch.decision.references.filter((item) => item.candidateId !== candidateId);
    if (retained.length >= 2) throw new Error("At most two trait references are allowed");
    return updateActiveDecision(state, (decision) => ({
      ...decision,
      references: [...retained, descriptor],
    }));
  }

  function removeTraitReference(state, candidateId) {
    return updateActiveDecision(state, (decision) => ({
      ...decision,
      references: decision.references.filter((reference) => reference.candidateId !== candidateId),
    }));
  }

  function reshuffleDeck(state) {
    const branch = activeBranch(state);
    assertCreativeBranchWritable(branch);
    if (!branch.deck) return state;
    const reshuffleCount = branch.deck.reshuffleCount + 1;
    const randomOrder = randomOrderFor(branch.session, reshuffleCount);
    const reorderedState = replaceActiveBranch(state, { ...branch, randomOrder });
    const orderIds = orderedCandidateIds(reorderedState);
    const nextBranch = activeBranch(reorderedState);
    return replaceActiveBranch(reorderedState, {
      ...nextBranch,
      deck: {
        ...nextBranch.deck,
        orderIds,
        cursor: 0,
        history: [],
        exhausted: orderIds.length === 0,
        reshuffleCount,
      },
      decision: createDecisionState(),
    });
  }

  function markListened(state, candidateId) {
    const branch = activeBranch(state);
    if (!branch.session.population.some((candidate) => candidate.id === candidateId)) return state;
    if (branch.listenedIds.includes(candidateId)) return state;
    return replaceActiveBranch(state, {
      ...branch,
      listenedIds: [...branch.listenedIds, candidateId],
    });
  }

  function completeAudition(state, candidateId, branchId = state.activeBranchId) {
    const branch = state.branches.find((item) => item.id === branchId);
    if (!branch || !branch.session.population.some((candidate) => candidate.id === candidateId)) return state;
    const listenedIds = branch.listenedIds.includes(candidateId)
      ? branch.listenedIds
      : [...branch.listenedIds, candidateId];
    const fullAuditionedIds = branch.fullAuditionedIds.includes(candidateId)
      ? branch.fullAuditionedIds
      : [...branch.fullAuditionedIds, candidateId];
    return {
      ...state,
      branches: state.branches.map((item) => (item.id === branchId ? {
        ...item,
        listenedIds,
        fullAuditionedIds,
        deck: item.deck ? {
          ...item.deck,
          completedIds: item.deck.completedIds.includes(candidateId)
            ? item.deck.completedIds
            : [...item.deck.completedIds, candidateId],
        } : item.deck,
      } : item)),
    };
  }

  function markFullyAuditioned(state, candidateId, branchId = state.activeBranchId) {
    return completeAudition(state, candidateId, branchId);
  }

  function selectPrimary(state, candidateId) {
    const branch = activeBranch(state);
    assertCreativeBranchWritable(branch);
    if (!branch.session.population.some((candidate) => candidate.id === candidateId)) return state;
    const donors = branch.selectedIds.filter((id) => id !== candidateId).slice(0, 2);
    return replaceActiveBranch(state, {
      ...branch,
      selectedIds: [candidateId, ...donors],
    });
  }

  function toggleDonor(state, candidateId) {
    const branch = activeBranch(state);
    assertCreativeBranchWritable(branch);
    const [primaryId, ...donors] = branch.selectedIds;
    if (!primaryId || candidateId === primaryId) return state;
    if (!branch.session.population.some((candidate) => candidate.id === candidateId)) return state;
    const nextDonors = donors.includes(candidateId)
      ? donors.filter((id) => id !== candidateId)
      : [...donors, candidateId].slice(0, 2);
    return replaceActiveBranch(state, {
      ...branch,
      selectedIds: [primaryId, ...nextDonors],
    });
  }

  function lineageRecord(action, branch, parent, extra = {}) {
    const randomIndex = branch.randomOrder.indexOf(parent.id);
    return {
      id: `${action}-${branch.session.stageIndex}-${branch.session.evolutionRound}-${parent.id}`,
      action,
      stageIndex: branch.session.stageIndex,
      bars: branch.session.stageBars,
      round: branch.session.evolutionRound,
      candidateId: parent.id,
      candidateName: parent.name,
      candidateLabel: randomIndex >= 0
        ? `随机 ${String(randomIndex + 1).padStart(2, "0")} · ${parent.name}`
        : parent.name,
      ...extra,
    };
  }

  function lineageReferences(branch, references) {
    return references.map((reference) => {
      const candidate = branch.session.population.find((item) => item.id === reference.candidateId);
      const randomIndex = branch.randomOrder.indexOf(reference.candidateId);
      return {
        ...cloneJson(reference),
        candidateName: candidate?.name || reference.candidateId,
        candidateLabel: candidate && randomIndex >= 0
          ? `随机 ${String(randomIndex + 1).padStart(2, "0")} · ${candidate.name}`
          : candidate?.name || reference.candidateId,
      };
    });
  }

  function measuredGenerationResults(session) {
    const contract = session.stageContract;
    return {
      generatedReferenceResults: session.population
        .filter((candidate) => candidate.origin?.type === "trait-reference")
        .map((candidate) => ({
          candidateId: candidate.id,
          referenceId: candidate.origin.referenceId,
          trait: candidate.origin.trait,
          primaryValue: candidate.origin.primaryValue,
          targetValue: candidate.origin.targetValue,
          resultValue: candidate.origin.resultValue,
          progress: candidate.origin.progress,
          outcome: candidate.origin.outcome,
        })),
      generatedIntentResults: session.population
        .filter((candidate) => candidate.origin?.growthIntent)
        .map((candidate) => ({
          candidateId: candidate.id,
          intent: candidate.origin.growthIntent,
          score: candidate.origin.intentScore,
          outcome: candidate.origin.intentOutcome,
        })),
      boundaryResults: contract ? session.population.map((candidate) => {
        const changes = core.boundaryDiff(
          contract.boundaryAnchor,
          candidate.bars[contract.boundaryIndex],
        );
        return {
          candidateId: candidate.id,
          changeCount: changes.length,
          changes,
        };
      }) : [],
    };
  }

  function resetBranchForPopulation(branch, session) {
    const randomOrder = randomOrderFor(session);
    return {
      ...branch,
      session,
      randomOrder,
      deck: createDeckState(session, randomOrder),
      decision: createDecisionState(),
      selectedIds: [],
      listenedIds: [],
      fullAuditionedIds: [],
      finalCandidate: null,
    };
  }

  function evolveCurrentStage(state, options = {}) {
    const branch = activeBranch(state);
    assertCreativeBranchWritable(branch);
    const primaryId = options.primaryId || branch.selectedIds[0];
    const parent = branch.session.population.find((candidate) => candidate.id === primaryId);
    if (!parent) throw new Error("请先选定一个母本。");
    if (branch.finalCandidate) return state;

    const motherSnapshot = cloneJson(parent);
    const decision = options.decision || (options.primaryId ? branch.decision : null);
    const preference = decision
      ? learnDecisionPreference(state.preference, branch, decision)
      : learnPreference(state.preference, branch);
    const references = options.references || decision?.references || [];
    const { primaryId: ignoredPrimaryId, decision: ignoredDecision, ...coreOptions } = options;
    const session = core.evolvePopulation(
      { ...branch.session, mutationRate: state.settings.mutationRate },
      [primaryId],
      { ...coreOptions, references },
    );
    const candidatesSnapshot = session.population.map(cloneJson);
    const nextBranch = resetBranchForPopulation(branch, session);
    nextBranch.lineage = [...branch.lineage, lineageRecord("evolve", branch, parent, {
      primaryId,
      references: lineageReferences(branch, references),
      stageContract: session.stageContract ? cloneJson(session.stageContract) : null,
      playbackSnapshot: { mother: motherSnapshot, candidates: candidatesSnapshot },
      ...measuredGenerationResults(session),
    })];
    return {
      ...replaceActiveBranch(state, nextBranch),
      preference,
    };
  }

  function finalizeCurrentCandidate(state, options = {}) {
    const branch = activeBranch(state);
    assertCreativeBranchWritable(branch);
    const primaryId = options.primaryId || branch.selectedIds[0];
    const parent = branch.session.population.find((candidate) => candidate.id === primaryId);
    if (!parent) throw new Error("请先选定一个母本。");
    if (branch.session.stageIndex !== core.GROWTH_STAGES.length - 1 || parent.bars.length !== 16) {
      throw new Error("Only a 16-bar melody can be finalized");
    }
    const completed = branch.deck?.completedIds?.includes(parent.id)
      || branch.fullAuditionedIds.includes(parent.id);
    if (!completed) throw new Error("Complete the 16-bar audition before finalizing（请先完整试听）");
    const decision = options.decision || (options.primaryId ? branch.decision : null);
    const finalBranch = {
      ...branch,
      finalCandidate: core.cloneCandidate(parent),
      lineage: [...branch.lineage, lineageRecord("final", branch, parent, {
        primaryId,
        references: [],
      })],
    };
    return {
      ...replaceActiveBranch(state, finalBranch),
      preference: decision
        ? learnDecisionPreference(state.preference, branch, decision)
        : learnPreference(state.preference, branch),
    };
  }

  function freezeCurrentStage(state, options = {}) {
    const branch = activeBranch(state);
    assertCreativeBranchWritable(branch);
    const primaryId = options.primaryId || branch.selectedIds[0];
    const parent = branch.session.population.find((candidate) => candidate.id === primaryId);
    if (!parent) throw new Error("请先选定一个母本。");

    if (branch.session.stageIndex >= core.GROWTH_STAGES.length - 1) {
      return finalizeCurrentCandidate(state, options);
    }

    const motherSnapshot = cloneJson(parent);
    const decision = options.decision || (options.primaryId ? branch.decision : null);
    const preference = decision
      ? learnDecisionPreference(state.preference, branch, decision)
      : learnPreference(state.preference, branch);
    const snapshot = {
      lineageLength: branch.lineage.length,
      ordering: branch.ordering,
      selectedIds: [...branch.selectedIds],
      listenedIds: [...branch.listenedIds],
      fullAuditionedIds: [...branch.fullAuditionedIds],
      randomOrder: [...branch.randomOrder],
      deck: cloneJson(branch.deck),
      decision: cloneJson(branch.decision),
    };
    const nextStageIndex = branch.session.stageIndex + 1;
    const references = options.references || decision?.references || [];
    const {
      primaryId: ignoredPrimaryId,
      decision: ignoredDecision,
      ...coreOptions
    } = options;
    const session = core.freezeAndGrow(branch.session, parent.id, { ...coreOptions, references });
    const candidatesSnapshot = session.population.map(cloneJson);
    const nextBranch = resetBranchForPopulation(branch, session);
    nextBranch.uiSnapshots = [...branch.uiSnapshots, snapshot];
    nextBranch.lineage = [...branch.lineage, lineageRecord("freeze-grow", branch, parent, {
      primaryId,
      references: lineageReferences(branch, references),
      intent: coreOptions.intent,
      boundaryPolicy: coreOptions.boundaryPolicy,
      stageContract: cloneJson(session.stageContract),
      toStageIndex: nextStageIndex,
      toBars: core.GROWTH_STAGES[nextStageIndex].bars,
      playbackSnapshot: { mother: motherSnapshot, candidates: candidatesSnapshot },
      ...measuredGenerationResults(session),
    })];
    return {
      ...replaceActiveBranch(state, nextBranch),
      preference,
    };
  }

  function rollbackCurrentStage(state) {
    const branch = activeBranch(state);
    assertCreativeBranchWritable(branch);
    if (!branch.session.snapshots.length || !branch.uiSnapshots.length) return state;
    const uiSnapshot = branch.uiSnapshots.at(-1);
    const session = core.rollbackStage(branch.session);
    const randomOrder = Array.isArray(uiSnapshot.randomOrder)
      ? [...uiSnapshot.randomOrder]
      : randomOrderFor(session);
    return replaceActiveBranch(state, {
      ...branch,
      session,
      ordering: uiSnapshot.ordering || "random",
      randomOrder,
      selectedIds: [...(uiSnapshot.selectedIds || [])],
      listenedIds: [...(uiSnapshot.listenedIds || [])],
      fullAuditionedIds: [...(uiSnapshot.fullAuditionedIds || [])],
      deck: uiSnapshot.deck
        ? cloneJson(uiSnapshot.deck)
        : createDeckState(session, randomOrder),
      decision: uiSnapshot.decision
        ? cloneJson(uiSnapshot.decision)
        : createDecisionState(),
      uiSnapshots: branch.uiSnapshots.slice(0, -1),
      lineage: branch.lineage.slice(0, Number(uiSnapshot.lineageLength) || 0),
      finalCandidate: null,
    });
  }

  function executeDecision(state, options = {}) {
    const branch = activeBranch(state);
    assertCreativeBranchWritable(branch);
    const decision = branch.decision;
    if (!decision?.primaryId) throw new Error("A mother melody is required");
    if (!decision.action) throw new Error("Choose an action");
    if (!["evolve", "grow", "finalize"].includes(decision.action)) {
      throw new Error(`Unsupported decision action: ${decision.action}`);
    }
    if (!Array.isArray(decision.references) || decision.references.length > 2) {
      throw new Error("At most two trait references are allowed");
    }
    if (decision.action === "grow" && !decision.intent) throw new Error("A growth intent is required");
    if (decision.action === "grow" && !decision.boundaryPolicy) throw new Error("A boundary policy is required");

    const primary = branch.session.population.find((candidate) => candidate.id === decision.primaryId);
    if (!primary) throw new Error("The selected mother is no longer in the current population");
    const references = decision.references.map((reference) => {
      const candidate = branch.session.population.find((item) => item.id === reference.candidateId);
      if (!candidate) throw new Error(`Reference candidate is no longer available: ${reference.candidateId}`);
      const descriptor = core.traitReferenceDescriptor(
        primary,
        candidate,
        reference.trait,
        branch.session.harmony,
      );
      if (!descriptor.meaningful) throw new Error(`Reference trait is no longer meaningful: ${reference.trait}`);
      return descriptor;
    });
    const committedDecision = { ...decision, references };

    if (decision.action === "finalize") {
      return finalizeCurrentCandidate(state, {
        primaryId: decision.primaryId,
        decision: committedDecision,
      });
    }
    const contract = {
      ...options,
      primaryId: decision.primaryId,
      references,
      decision: committedDecision,
    };
    return decision.action === "grow"
      ? freezeCurrentStage(state, {
        ...contract,
        intent: decision.intent,
        boundaryPolicy: decision.boundaryPolicy,
      })
      : evolveCurrentStage(state, contract);
  }

  function copyBranch(state) {
    const source = activeBranch(state);
    assertCreativeBranchWritable(source);
    const branchNumber = state.nextBranchNumber || state.branches.length + 1;
    const copy = cloneJson(source);
    copy.id = `branch-${source.session.seed}-${branchNumber}`;
    copy.name = `分支 ${branchNumber}`;
    return {
      ...state,
      activeBranchId: copy.id,
      nextBranchNumber: branchNumber + 1,
      branches: [...state.branches, copy],
    };
  }

  function switchBranch(state, branchId) {
    return state.branches.some((branch) => branch.id === branchId)
      ? { ...state, activeBranchId: branchId }
      : state;
  }

  function updateSettings(state, patch) {
    return {
      ...state,
      settings: {
        ...state.settings,
        ...patch,
      },
    };
  }

  function updateTempo(state, bpm) {
    const branch = activeBranch(state);
    assertCreativeBranchWritable(branch);
    const tempo = clamp(Math.round(Number(bpm) || 104), 48, 180);
    return replaceActiveBranch(state, {
      ...branch,
      session: {
        ...branch.session,
        harmony: { ...branch.session.harmony, bpm: tempo },
      },
    });
  }

  function normalizePreference(preference) {
    const weights = Array.isArray(preference?.weights)
      ? preference.weights.slice(0, TRAIT_KEYS.length)
      : [];
    while (weights.length < TRAIT_KEYS.length) weights.push(0);
    return {
      ...createPreferenceState(),
      ...(preference || {}),
      weights: weights.map((value) => clamp(Number(value) || 0, -3, 3)),
    };
  }

  function normalizeBranchState(branch, index) {
    if (!branch?.session?.population?.length || !branch.session.harmony) {
      throw new Error("Invalid branch state");
    }
    const populationIds = branch.session.population.map((candidate) => candidate.id);
    const populationSet = new Set(populationIds);
    const storedRandomOrder = Array.isArray(branch.randomOrder)
      ? branch.randomOrder.filter((id) => populationSet.has(id))
      : [];
    populationIds.forEach((id) => {
      if (!storedRandomOrder.includes(id)) storedRandomOrder.push(id);
    });
    const sourceDeck = branch.deck || createDeckState(branch.session, storedRandomOrder);
    const orderIds = Array.isArray(sourceDeck.orderIds)
      ? sourceDeck.orderIds.filter((id) => populationSet.has(id))
      : [];
    populationIds.forEach((id) => {
      if (!orderIds.includes(id)) orderIds.push(id);
    });
    const cursor = Math.max(0, Math.min(orderIds.length, Math.trunc(Number(sourceDeck.cursor) || 0)));
    const decision = branch.decision && typeof branch.decision === "object"
      ? {
        ...createDecisionState(),
        ...branch.decision,
        references: Array.isArray(branch.decision.references) ? cloneJson(branch.decision.references) : [],
      }
      : createDecisionState();
    return {
      ...branch,
      id: branch.id || `restored-${index + 1}`,
      ordering: branch.ordering === "preference" ? "preference" : "random",
      randomOrder: storedRandomOrder,
      deck: {
        ...createDeckState(branch.session, orderIds),
        ...sourceDeck,
        orderIds,
        cursor,
        history: Array.isArray(sourceDeck.history) ? cloneJson(sourceDeck.history) : [],
        completedIds: Array.isArray(sourceDeck.completedIds)
          ? sourceDeck.completedIds.filter((id) => populationSet.has(id))
          : [],
        comparisonIds: Array.isArray(sourceDeck.comparisonIds)
          ? sourceDeck.comparisonIds.filter((id) => populationSet.has(id))
          : [],
        exhausted: cursor >= orderIds.length,
        reshuffleCount: Math.max(0, Math.trunc(Number(sourceDeck.reshuffleCount) || 0)),
      },
      decision,
      selectedIds: Array.isArray(branch.selectedIds) ? branch.selectedIds.filter((id) => populationSet.has(id)) : [],
      listenedIds: Array.isArray(branch.listenedIds) ? branch.listenedIds.filter((id) => populationSet.has(id)) : [],
      fullAuditionedIds: Array.isArray(branch.fullAuditionedIds)
        ? branch.fullAuditionedIds.filter((id) => populationSet.has(id))
        : [],
      lineage: Array.isArray(branch.lineage) ? cloneJson(branch.lineage) : [],
      uiSnapshots: Array.isArray(branch.uiSnapshots) ? cloneJson(branch.uiSnapshots) : [],
      migrationState: branch.migrationState === "read-only" ? "read-only" : "active",
      migrationReason: branch.migrationReason || null,
      finalCandidate: branch.finalCandidate ? core.cloneCandidate(branch.finalCandidate) : null,
    };
  }

  function transitionForStage(branch, stageIndex) {
    return branch.lineage.find((entry) => (
      entry?.action === "freeze-grow" && Number(entry.toStageIndex) === stageIndex
    ));
  }

  function migrateV2Session(branch) {
    const sourceSession = cloneJson(branch.session);
    const currentStage = Number(sourceSession.stageIndex);
    if (!Number.isInteger(currentStage)
      || currentStage < 0
      || currentStage >= core.GROWTH_STAGES.length) {
      throw new Error(`无法识别旧会话阶段 ${sourceSession.stageIndex}`);
    }
    if (currentStage === 0) {
      return {
        ...sourceSession,
        stageContract: null,
        rootMotif: null,
        snapshots: (sourceSession.snapshots || []).map((snapshot) => ({
          ...snapshot,
          stageContract: null,
          rootMotif: null,
        })),
      };
    }

    const sourceSnapshots = Array.isArray(sourceSession.snapshots) ? sourceSession.snapshots : [];
    const stateByStage = new Map(sourceSnapshots.map((snapshot) => [Number(snapshot.stageIndex), snapshot]));
    stateByStage.set(currentStage, sourceSession);
    const seedState = stateByStage.get(0);
    const firstTransition = transitionForStage(branch, 1);
    const rootParent = seedState?.population?.find((candidate) => candidate.id === firstTransition?.candidateId);
    if (!rootParent?.bars?.length) throw new Error("缺少首阶段冻结母本，无法重建根动机");
    const rootMotif = rootParent.bars.slice(0, 2).map(core.cloneBar);
    const migratedByStage = new Map();
    migratedByStage.set(0, {
      ...cloneJson(seedState),
      stageContract: null,
      rootMotif: null,
    });

    for (let stageIndex = 1; stageIndex <= currentStage; stageIndex += 1) {
      const source = stateByStage.get(stageIndex);
      const previous = stateByStage.get(stageIndex - 1);
      const transition = transitionForStage(branch, stageIndex);
      const parent = previous?.population?.find((candidate) => candidate.id === transition?.candidateId);
      if (!source?.population?.length || !parent?.bars?.length) {
        throw new Error(`缺少第 ${stageIndex} 阶段的冻结快照或母本`);
      }
      const contract = {
        stageIndex,
        boundaryIndex: core.GROWTH_STAGES[stageIndex].boundary,
        boundaryPolicy: "light",
        boundaryAnchor: core.cloneBar(parent.bars.at(-1)),
        growthIntent: "legacy",
      };
      source.population.forEach((candidate) => {
        core.assertStageContract(candidate, contract, sourceSession.harmony);
      });
      migratedByStage.set(stageIndex, {
        ...cloneJson(source),
        stageIndex,
        stageBars: core.GROWTH_STAGES[stageIndex].bars,
        stageContract: contract,
        rootMotif: rootMotif.map(core.cloneBar),
      });
    }

    const current = migratedByStage.get(currentStage);
    current.snapshots = sourceSnapshots.map((snapshot) => {
      const migrated = migratedByStage.get(Number(snapshot.stageIndex));
      if (!migrated) throw new Error(`缺少第 ${snapshot.stageIndex} 阶段迁移结果`);
      const copy = cloneJson(migrated);
      delete copy.snapshots;
      return copy;
    });
    return current;
  }

  function migrateV2Branch(branch, index) {
    try {
      const session = migrateV2Session(branch);
      const uiSnapshots = session.snapshots.map((snapshot, snapshotIndex) => {
        const source = branch.uiSnapshots?.[snapshotIndex] || {};
        const populationIds = snapshot.population.map((candidate) => candidate.id);
        const randomOrder = Array.isArray(source.randomOrder)
          ? source.randomOrder.filter((id) => populationIds.includes(id))
          : [];
        populationIds.forEach((id) => {
          if (!randomOrder.includes(id)) randomOrder.push(id);
        });
        const completedIds = (source.fullAuditionedIds || []).filter((id) => populationIds.includes(id));
        return {
          ...source,
          lineageLength: Math.max(0, Math.trunc(Number(source.lineageLength) || 0)),
          ordering: source.ordering === "preference" ? "preference" : "random",
          randomOrder,
          selectedIds: (source.selectedIds || []).filter((id) => populationIds.includes(id)),
          listenedIds: (source.listenedIds || []).filter((id) => populationIds.includes(id)),
          fullAuditionedIds: completedIds,
          deck: {
            ...createDeckState(snapshot, randomOrder),
            completedIds,
          },
          decision: createDecisionState(),
        };
      });
      return normalizeBranchState({
        ...branch,
        session,
        uiSnapshots,
        deck: null,
        decision: createDecisionState(),
        migrationState: "active",
        migrationReason: null,
      }, index);
    } catch (error) {
      return normalizeBranchState({
        ...branch,
        deck: null,
        decision: createDecisionState(),
        migrationState: "read-only",
        migrationReason: error instanceof Error ? error.message : "旧会话无法安全迁移",
      }, index);
    }
  }

  function serializeState(state) {
    return JSON.stringify(state);
  }

  function restoreState(serialized, fallbackOptions = {}) {
    try {
      const parsed = typeof serialized === "string" ? JSON.parse(serialized) : serialized;
      if (!parsed || ![2, APP_VERSION].includes(parsed.version)
        || !Array.isArray(parsed.branches) || !parsed.branches.length) {
        return createAppState(fallbackOptions);
      }
      let branches = parsed.version === 2
        ? parsed.branches.map(migrateV2Branch)
        : parsed.branches.map(normalizeBranchState);
      let activeBranchId = branches.some((branch) => branch.id === parsed.activeBranchId)
        ? parsed.activeBranchId
        : branches[0].id;
      let nextBranchNumber = Math.max(Number(parsed.nextBranchNumber) || 1, branches.length + 1);
      if (parsed.version === 2 && branches.some((branch) => branch.migrationState === "read-only")) {
        const freshState = createAppState(fallbackOptions);
        const fresh = freshState.branches[0];
        fresh.id = `branch-${fresh.session.seed}-${nextBranchNumber}`;
        fresh.name = `新会话 ${nextBranchNumber}`;
        while (branches.some((branch) => branch.id === fresh.id)) {
          nextBranchNumber += 1;
          fresh.id = `branch-${fresh.session.seed}-${nextBranchNumber}`;
          fresh.name = `新会话 ${nextBranchNumber}`;
        }
        branches = [...branches, fresh];
        activeBranchId = fresh.id;
        nextBranchNumber += 1;
      }
      return {
        ...parsed,
        version: APP_VERSION,
        branches,
        activeBranchId,
        nextBranchNumber,
        preference: normalizePreference(parsed.preference),
        settings: {
          mutationRate: 0.28,
          accompaniment: true,
          instrument: "piano",
          ...(parsed.settings || {}),
        },
      };
    } catch {
      return createAppState(fallbackOptions);
    }
  }

  function chordName(harmony, barIndex) {
    const degree = harmony.chords[barIndex]?.degree ?? 0;
    const intervals = harmony.key.mode === "minor" ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
    const pitchClass = (harmony.key.tonic + intervals[degree]) % 12;
    const minorDegrees = harmony.key.mode === "minor" ? new Set([0, 3, 4]) : new Set([1, 2, 5]);
    return `${PITCH_CLASS_NAMES[pitchClass]}${minorDegrees.has(degree) ? "m" : ""}`;
  }

  function chordPitches(harmony, barIndex) {
    const scale = harmony.key.mode === "minor" ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
    const degree = harmony.chords[barIndex]?.degree ?? 0;
    return [degree, degree + 2, degree + 4].map((scaleDegree) => (
      harmony.key.tonic - 12 + scale[scaleDegree % 7] + (scaleDegree >= 7 ? 12 : 0)
    ));
  }

  function buildPlaybackSchedule(candidate, harmony, options = {}) {
    const mode = options.mode === "full" ? "full" : "preview";
    const previewRange = core.previewBarRange(options.stageIndex ?? 0);
    const startBar = mode === "full" ? 0 : previewRange.start;
    const endBar = Math.min(candidate.bars.length, mode === "full" ? candidate.bars.length : previewRange.end);
    const melodyEvents = [];
    const chordEvents = [];

    candidate.bars.slice(startBar, endBar).forEach((bar, offset) => {
      const barIndex = startBar + offset;
      bar.events.forEach((event) => {
        if (event.rest || !Number.isFinite(event.pitch)) return;
        melodyEvents.push({
          pitch: event.pitch,
          startBeat: offset * 4 + event.start,
          durationBeats: event.duration,
          barIndex,
        });
      });
      if (options.accompaniment !== false) {
        chordPitches(harmony, barIndex).forEach((pitch) => {
          chordEvents.push({
            pitch,
            startBeat: offset * 4,
            durationBeats: 4,
            barIndex,
          });
        });
      }
    });

    return {
      startBar,
      endBar,
      durationBeats: Math.max(0, (endBar - startBar) * 4),
      bpm: harmony.bpm,
      melodyEvents,
      chordEvents,
    };
  }

  function buildBoundaryComparisonSchedule(anchor, candidateBar, harmony) {
    if (!anchor?.events || !candidateBar?.events || !harmony) {
      throw new Error("Boundary comparison requires two bars and a harmony canvas");
    }
    const sections = [
      { label: "原交界", startBeat: 0, endBeat: 4 },
      { label: "当前交界", startBeat: 5, endBeat: 9 },
    ];
    const melodyEvents = [];
    [[anchor, sections[0]], [candidateBar, sections[1]]].forEach(([bar, section]) => {
      bar.events.forEach((event) => {
        if (event.rest || !Number.isFinite(event.pitch)) return;
        melodyEvents.push({
          pitch: event.pitch,
          startBeat: section.startBeat + event.start,
          durationBeats: event.duration,
          section: section.label,
        });
      });
    });
    return {
      startBar: 0,
      endBar: 0,
      durationBeats: 9,
      bpm: harmony.bpm,
      melodyEvents,
      chordEvents: [],
      sections,
    };
  }

  function midiFrequency(pitch) {
    return 440 * (2 ** ((pitch - 69) / 12));
  }

  function createAudioEngine(host) {
    const AudioContextConstructor = host.AudioContext || host.webkitAudioContext;
    let context = null;
    let activeNodes = [];
    let timers = [];

    function clearTimers() {
      timers.forEach((timer) => host.clearTimeout(timer));
      timers = [];
    }

    function stop() {
      clearTimers();
      activeNodes.forEach((node) => {
        try { node.stop(); } catch {}
        try { node.disconnect(); } catch {}
      });
      activeNodes = [];
    }

    function scheduleTone(master, event, secondsPerBeat, baseTime, options) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = baseTime + event.startBeat * secondsPerBeat;
      const duration = Math.max(0.06, event.durationBeats * secondsPerBeat);
      const end = start + duration;
      const isChord = options.kind === "chord";
      const instrument = options.instrument;
      oscillator.type = isChord ? "sine" : instrument === "synth" ? "square" : instrument === "mallet" ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(midiFrequency(event.pitch), start);

      const peak = isChord ? 0.035 : instrument === "synth" ? 0.085 : 0.11;
      const attack = instrument === "mallet" ? 0.008 : 0.018;
      const releaseStart = instrument === "mallet" ? start + Math.min(duration * 0.28, 0.22) : end - Math.min(0.08, duration * 0.2);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(peak, start + attack);
      gain.gain.setValueAtTime(Math.max(0.0001, peak * (isChord ? 0.72 : 0.88)), Math.max(start + attack, releaseStart));
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(start);
      oscillator.stop(end + 0.03);
      activeNodes.push(oscillator, gain);
    }

    function play(schedule, options = {}) {
      if (!AudioContextConstructor) throw new Error("当前浏览器不支持 Web Audio。");
      stop();
      context ||= new AudioContextConstructor();
      if (context.state === "suspended") context.resume();

      const secondsPerBeat = 60 / clamp(Number(schedule.bpm) || 104, 48, 180);
      const baseTime = context.currentTime + 0.06;
      const master = context.createGain();
      master.gain.setValueAtTime(0.78, baseTime);
      master.connect(context.destination);
      activeNodes.push(master);

      schedule.chordEvents.forEach((event) => scheduleTone(master, event, secondsPerBeat, baseTime, {
        kind: "chord",
        instrument: options.instrument || "piano",
      }));
      schedule.melodyEvents.forEach((event) => scheduleTone(master, event, secondsPerBeat, baseTime, {
        kind: "melody",
        instrument: options.instrument || "piano",
      }));

      for (let barIndex = schedule.startBar; barIndex < schedule.endBar; barIndex += 1) {
        const delay = (barIndex - schedule.startBar) * 4 * secondsPerBeat * 1000;
        timers.push(host.setTimeout(() => options.onBar?.(barIndex), delay));
      }
      timers.push(host.setTimeout(() => {
        activeNodes = [];
        timers = [];
        options.onComplete?.();
      }, schedule.durationBeats * secondsPerBeat * 1000 + 90));

      return {
        durationMs: schedule.durationBeats * secondsPerBeat * 1000,
        stop,
      };
    }

    return { play, stop };
  }

  function sourceLabel(candidate) {
    if (candidate.origin?.type === "random-injection") return "随机注入";
    if (candidate.origin?.type === "trait-reference") {
      const trait = TRAIT_LABELS[candidate.origin.trait] || "特征";
      return candidate.origin.outcome === "moved-toward"
        ? `参考${trait} · 明显靠近 ${Math.max(0, Math.round((candidate.origin.progress || 0) * 100))}%`
        : `参考${trait} · 本轮未明显表达`;
    }
    if (candidate.origin?.type === "trait-donor") return "旧版自动特征参考";
    if (candidate.origin?.type === "growth") return "新增乐段";
    if (candidate.origin?.type === "seed") return "随机种子";
    return "母本变体";
  }

  function pitchTop(pitch, range = 58, offset = 8) {
    return offset + (1 - clamp((Number(pitch) - 48) / 36, 0, 1)) * range;
  }

  function appendIcon(doc, target, name) {
    const icon = doc.createElement("i");
    icon.dataset.lucide = name;
    icon.setAttribute("aria-hidden", "true");
    target.append(icon);
    return icon;
  }

  function renderCandidatePreview(doc, candidate) {
    const preview = doc.createElement("div");
    preview.className = "candidate-preview";
    const startBar = Math.max(0, candidate.bars.length - 4);
    const bars = candidate.bars.slice(startBar);
    bars.forEach((bar, barOffset) => {
      bar.events.forEach((event) => {
        const note = doc.createElement("span");
        note.className = `note-event${event.rest ? " is-rest" : ""}`;
        note.style.left = `${((barOffset + event.start / 4) / bars.length) * 100}%`;
        note.style.width = `${Math.max(1.5, (event.duration / 4 / bars.length) * 100)}%`;
        note.style.top = `${pitchTop(event.pitch, 52, 8)}px`;
        preview.append(note);
      });
    });
    return preview;
  }

  function mount(doc, host) {
    if (!doc?.getElementById("candidateDeck")) return null;

    const elements = {};
    [
      "headerStageValue", "headerRoundValue", "saveState", "newSessionButton", "keySelect", "tempoInput",
      "populationSelect", "mutationSlider", "mutationValue", "orderingMode", "preferenceState", "confidenceFill",
      "preferenceFeedback", "chordToggle", "instrumentSelect", "stageValue", "roundValue", "lockedBarsValue",
      "branchCountValue", "growthStages", "melodyTrack", "playCurrentButton", "stopPlaybackButton", "rollbackButton",
      "copyBranchButton", "candidateContext", "candidateDeck", "deckProgress", "deckExhausted",
      "reshuffleDeckButton", "undoSwipeButton", "skipCandidateButton", "chooseCandidateButton",
      "viewAllCandidatesButton", "allCandidatesPanel", "allCandidatesGrid", "closeAllCandidatesButton",
      "decisionPanel", "decisionMother", "decisionActionControl", "referenceStep", "referencePicker",
      "growthIntentStep", "growthIntentControl", "boundaryPolicyStep", "boundaryPolicyControl",
      "decisionSummary", "executeDecisionButton", "cancelDecisionButton", "migrationNotice",
      "migrationNoticeText", "lineageGraph", "lineageMenuButton", "branchList", "toast",
      "playbackPanel", "closePlaybackPanel", "playbackAction", "playbackMother", "playbackIntent",
      "playbackIntentRow", "playbackBoundary", "playbackBoundaryRow", "playbackReferenceList",
      "playbackCandidateSelect", "playbackMotherButton", "playbackCandidateButton",
      "playbackMotherBars", "playbackCandidateBars", "playbackReferenceResults", "playbackStructureResults",
      "playbackLegacyNote",
    ].forEach((id) => { elements[id] = doc.getElementById(id); });
    elements.candidateSection = elements.candidateDeck.closest(".candidate-section");
    elements.mobileActionBar = doc.querySelector(".mobile-action-bar");

    let toastTimer = null;
    let branchMenuOpen = false;
    let allCandidatesOpen = false;
    let playbackPanelOpen = false;
    let isPlaying = false;
    let playingCandidateId = null;
    let playbackKind = null;
    let auditionToken = 0;
    let swipeInFlight = false;
    let currentPlaybackLineage = null;
    const playback = createAudioEngine(host);
    const storage = (() => {
      try { return host.localStorage; } catch { return null; }
    })();
    const storedState = storage?.getItem(STORAGE_KEY) ?? storage?.getItem(LEGACY_STORAGE_KEY);
    let state = restoreState(storedState, { seed: Date.now(), populationSize: 12 });

    function refreshIcons() {
      if (host.lucide?.createIcons) host.lucide.createIcons();
    }

    function notify(message) {
      if (!elements.toast) return;
      elements.toast.textContent = message;
      elements.toast.hidden = false;
      host.clearTimeout(toastTimer);
      toastTimer = host.setTimeout(() => { elements.toast.hidden = true; }, 2600);
    }

    function persist() {
      try {
        storage?.setItem(STORAGE_KEY, serializeState(state));
        if (elements.saveState) elements.saveState.textContent = "已自动保存";
      } catch {
        if (elements.saveState) elements.saveState.textContent = "仅本次会话";
      }
    }

    function currentCandidate(branch = activeBranch(state)) {
      return branch.session.population.find((candidate) => candidate.id === branch.decision?.primaryId)
        || branch.session.population.find((candidate) => candidate.id === currentDeckCandidate(state)?.id)
        || branch.session.population[0];
    }

    function clearPlayingBars() {
      elements.melodyTrack?.querySelectorAll(".is-playing").forEach((cell) => cell.classList.remove("is-playing"));
    }

    function setPlaybackState(playing, candidateId = null, kind = null) {
      isPlaying = playing;
      playingCandidateId = playing ? candidateId : null;
      playbackKind = playing ? kind : null;
      if (elements.stopPlaybackButton) elements.stopPlaybackButton.disabled = !playing;
      if (elements.playCurrentButton) elements.playCurrentButton.setAttribute("aria-pressed", String(playing));
      doc.querySelectorAll("[data-candidate-play]").forEach((button) => {
        const active = playing && button.dataset.candidatePlay === candidateId && kind !== "boundary";
        button.classList.toggle("is-playing", active);
        button.setAttribute("aria-pressed", String(active));
      });
      if (!playing) clearPlayingBars();
      renderMobileBar();
      refreshIcons();
    }

    function stopPlayback() {
      auditionToken += 1;
      playback.stop();
      setPlaybackState(false);
      elements.playbackMotherButton?.setAttribute("aria-pressed", "false");
      elements.playbackCandidateButton?.setAttribute("aria-pressed", "false");
    }

    function playFromUi(candidate, mode) {
      if (!candidate) return;
      stopPlayback();
      const branch = activeBranch(state);
      const branchId = branch.id;
      const token = auditionToken;
      const schedule = buildPlaybackSchedule(candidate, branch.session.harmony, {
        mode,
        stageIndex: branch.session.stageIndex,
        accompaniment: state.settings.accompaniment,
      });
      state = markListened(state, candidate.id);
      persist();
      render();

      try {
        playback.play(schedule, {
          instrument: state.settings.instrument,
          onBar(barIndex) {
            clearPlayingBars();
            elements.melodyTrack?.querySelector(`[data-bar="${barIndex + 1}"]`)?.classList.add("is-playing");
          },
          onComplete() {
            if (token !== auditionToken) return;
            setPlaybackState(false);
            const message = mode === "full" && candidate.bars.length === 16
              ? "完整试听完成，可以确认 16 小节成品"
              : "候选试听完成";
            commit(completeAudition(state, candidate.id, branchId), message);
          },
        });
        setPlaybackState(true, candidate.id, "candidate");
      } catch (error) {
        setPlaybackState(false);
        notify(error.message.trim());
      }
    }

    function playBoundaryFromUi(candidate) {
      const branch = activeBranch(state);
      const contract = branch.session.stageContract;
      const boundary = contract && candidate?.bars?.[contract.boundaryIndex];
      if (!contract || !boundary) return;
      if (!core.boundaryDiff(contract.boundaryAnchor, boundary).length) {
        notify("当前交界与原交界完全一致");
        return;
      }
      stopPlayback();
      const token = auditionToken;
      try {
        playback.play(buildBoundaryComparisonSchedule(
          contract.boundaryAnchor,
          boundary,
          branch.session.harmony,
        ), {
          instrument: state.settings.instrument,
          onComplete() {
            if (token === auditionToken) setPlaybackState(false);
          },
        });
        setPlaybackState(true, candidate.id, "boundary");
      } catch (error) {
        setPlaybackState(false);
        notify(error.message.trim());
      }
    }

    function renderGrowth(branch) {
      elements.growthStages?.querySelectorAll("[data-stage]").forEach((item) => {
        const index = Number(item.dataset.stage);
        item.classList.toggle("is-complete", index < branch.session.stageIndex);
        item.classList.toggle("is-current", index === branch.session.stageIndex);
        if (index === branch.session.stageIndex) item.setAttribute("aria-current", "step");
        else item.removeAttribute("aria-current");
      });
    }

    function renderMelody(branch) {
      if (!elements.melodyTrack) return;
      elements.melodyTrack.replaceChildren();
      const candidate = currentCandidate(branch);
      const stage = core.GROWTH_STAGES[branch.session.stageIndex];

      for (let barIndex = 0; barIndex < 16; barIndex += 1) {
        const cell = doc.createElement("article");
        cell.className = "bar-cell";
        cell.dataset.bar = String(barIndex + 1);
        let status = "未来";
        if (barIndex >= branch.session.stageBars) cell.classList.add("is-future");
        else if (stage.boundary != null && barIndex < stage.boundary) {
          cell.classList.add("is-locked");
          status = "已冻结";
        } else if (stage.boundary != null && barIndex === stage.boundary) {
          cell.classList.add("is-boundary");
          status = "可微调边界";
        } else {
          cell.classList.add("is-growing");
          status = "当前生长";
        }
        cell.setAttribute("aria-label", `第 ${barIndex + 1} 小节，${status}`);

        const number = doc.createElement("span");
        number.className = "bar-number";
        number.textContent = String(barIndex + 1).padStart(2, "0");
        cell.append(number);

        const bar = candidate?.bars[barIndex];
        if (bar) {
          bar.events.forEach((event) => {
            const note = doc.createElement("span");
            note.className = `note-event${event.rest ? " is-rest" : ""}`;
            note.style.left = `${7 + event.start * 21}%`;
            note.style.width = `${Math.max(5, event.duration * 19)}%`;
            note.style.top = `${pitchTop(event.pitch, 72, 27)}px`;
            cell.append(note);
          });
          if (state.settings.accompaniment) {
            const chord = doc.createElement("span");
            chord.className = "chord-label";
            chord.textContent = chordName(branch.session.harmony, barIndex);
            cell.append(chord);
          }
        }
        elements.melodyTrack.append(cell);
      }
    }

    function candidateDisplayName(branch, candidate) {
      const orderIndex = branch.deck.orderIds.indexOf(candidate.id);
      const randomIndex = branch.randomOrder.indexOf(candidate.id);
      const prefix = branch.ordering === "preference"
        ? `偏好序 ${String(Math.max(0, orderIndex) + 1).padStart(2, "0")}`
        : `随机 ${String(Math.max(0, randomIndex) + 1).padStart(2, "0")}`;
      return `${prefix} · ${candidate.name}`;
    }

    function pitchLabel(pitch) {
      if (!Number.isFinite(pitch)) return "无音高";
      const pitchClass = ((Math.round(pitch) % 12) + 12) % 12;
      return `${PITCH_CLASS_NAMES[pitchClass]}${Math.floor(Math.round(pitch) / 12) - 1}`;
    }

    function eventLabel(event) {
      if (!event) return "无事件";
      const sound = event.rest ? "休止" : pitchLabel(event.pitch);
      return `${sound} · ${event.start} 拍起 · ${event.duration} 拍`;
    }

    function boundaryChanges(branch, candidate) {
      const contract = branch.session.stageContract;
      const boundary = contract && candidate?.bars?.[contract.boundaryIndex];
      return contract && boundary ? core.boundaryDiff(contract.boundaryAnchor, boundary) : [];
    }

    function renderBoundaryAudit(target, branch, candidate) {
      const contract = branch.session.stageContract;
      if (!contract || !candidate?.bars?.[contract.boundaryIndex]) return;
      const changes = boundaryChanges(branch, candidate);
      const comparison = doc.createElement("div");
      comparison.className = "boundary-comparison";

      const header = doc.createElement("div");
      header.className = "boundary-comparison-header";
      const title = doc.createElement("b");
      title.textContent = "交界变化";
      const count = doc.createElement("span");
      count.textContent = `${changes.length} 个事件变化`;
      const play = doc.createElement("button");
      play.type = "button";
      play.className = "icon-text-button";
      play.dataset.boundaryPlay = candidate.id;
      play.disabled = changes.length === 0;
      play.title = changes.length ? "交界 A/B 试听" : "交界完全一致";
      play.setAttribute("aria-label", play.title);
      appendIcon(doc, play, "audio-lines");
      const playLabel = doc.createElement("span");
      playLabel.textContent = "A/B";
      play.append(playLabel);
      header.append(title, count, play);
      comparison.append(header);

      if (changes.length) {
        const list = doc.createElement("ul");
        list.className = "boundary-diff-list";
        changes.forEach((change) => {
          const item = doc.createElement("li");
          item.textContent = `事件 ${change.index + 1}：${eventLabel(change.before)} → ${eventLabel(change.after)}`;
          list.append(item);
        });
        comparison.append(list);
      }
      target.append(comparison);
    }

    function createCandidateCard(branch, candidate, options = {}) {
      const card = doc.createElement("article");
      card.className = "candidate-card";
      card.dataset.candidateId = candidate.id;
      if (Number.isInteger(options.deckOffset)) card.dataset.deckOffset = String(options.deckOffset);
      card.classList.toggle("is-listened", branch.listenedIds.includes(candidate.id));
      card.classList.toggle("is-complete", branch.deck.completedIds.includes(candidate.id));
      if (options.deckOffset === 0) {
        card.tabIndex = 0;
        card.setAttribute(
          "aria-label",
          `${candidateDisplayName(branch, candidate)}，${branch.migrationState === "read-only" ? "只读候选" : "可左右划动"}`,
        );
      }

      const header = doc.createElement("div");
      header.className = "candidate-card-header";
      const title = doc.createElement("b");
      title.textContent = candidateDisplayName(branch, candidate);
      header.append(title);

      const actions = doc.createElement("div");
      actions.className = "candidate-card-actions";
      const playButton = doc.createElement("button");
      playButton.type = "button";
      playButton.dataset.candidatePlay = candidate.id;
      playButton.dataset.playMode = branch.session.stageBars === 16 ? "full" : "preview";
      playButton.title = branch.session.stageBars === 16 ? "完整试听候选" : "试听候选";
      playButton.setAttribute("aria-label", `${playButton.title}${title.textContent}`);
      playButton.setAttribute("aria-pressed", "false");
      appendIcon(doc, playButton, "play");
      actions.append(playButton);
      header.append(actions);
      card.append(header, renderCandidatePreview(doc, candidate));

      const meta = doc.createElement("div");
      meta.className = "candidate-meta";
      const source = doc.createElement("span");
      source.className = "candidate-source";
      source.textContent = sourceLabel(candidate);
      const length = doc.createElement("span");
      length.textContent = branch.deck.completedIds.includes(candidate.id)
        ? `${candidate.bars.length} 小节 · 已听完`
        : `${candidate.bars.length} 小节`;
      meta.append(source, length);
      card.append(meta);

      if (branch.session.stageContract) {
        const boundary = doc.createElement("div");
        boundary.className = "candidate-boundary-row";
        const changes = boundaryChanges(branch, candidate);
        const text = doc.createElement("span");
        text.textContent = `交界 ${changes.length} 处变化`;
        const compare = doc.createElement("button");
        compare.type = "button";
        compare.dataset.boundaryPlay = candidate.id;
        compare.disabled = changes.length === 0;
        compare.title = changes.length ? "交界 A/B 试听" : "交界完全一致";
        compare.setAttribute("aria-label", compare.title);
        appendIcon(doc, compare, "audio-lines");
        boundary.append(text, compare);
        card.append(boundary);
      }

      if (options.showChoose) {
        const selectRow = doc.createElement("div");
        selectRow.className = "candidate-select-row";
        const selectButton = doc.createElement("button");
        selectButton.type = "button";
        selectButton.className = "candidate-primary-button";
        selectButton.dataset.candidateChoose = candidate.id;
        selectButton.disabled = branch.migrationState === "read-only";
        selectButton.textContent = "选为母本";
        selectRow.append(selectButton);
        card.append(selectRow);
      }
      return card;
    }

    function resetDraggedCard(card) {
      if (!card) return;
      card.classList.remove("is-dragging");
      card.style.removeProperty("transform");
      card.style.removeProperty("--swipe-progress");
    }

    function swipeCurrent(direction, card = elements.candidateDeck.querySelector('[data-deck-offset="0"]')) {
      const branch = activeBranch(state);
      const candidate = currentDeckCandidate(state);
      if (!candidate || swipeInFlight) return;
      if (branch.migrationState === "read-only") {
        notify("该旧版分支仅供回听");
        return;
      }
      stopPlayback();
      swipeInFlight = true;
      resetDraggedCard(card);
      card?.classList.add(direction === "left" ? "is-swiping-left" : "is-swiping-right");
      host.setTimeout(() => {
        try {
          allCandidatesOpen = false;
          commit(swipeCandidate(state, candidate.id, direction));
        } catch (error) {
          card?.classList.remove("is-swiping-left", "is-swiping-right");
          notify(error.message.trim());
        } finally {
          swipeInFlight = false;
        }
      }, 180);
    }

    function bindDeckGestures(card, candidate, branch) {
      let gesture = null;
      const finish = (event, canceled = false) => {
        if (!gesture || event.pointerId !== gesture.pointerId) return;
        const elapsed = Math.max(16, event.timeStamp - gesture.startedAt);
        const distanceX = event.clientX - gesture.startX;
        const direction = canceled || gesture.vertical
          ? null
          : swipeDirection({
            distanceX,
            width: card.getBoundingClientRect().width,
            velocityX: distanceX / elapsed,
          });
        try { card.releasePointerCapture(event.pointerId); } catch {}
        gesture = null;
        if (direction) swipeCurrent(direction, card);
        else resetDraggedCard(card);
      };

      card.addEventListener("pointerdown", (event) => {
        if (event.button !== 0 || event.target.closest("button") || swipeInFlight) return;
        gesture = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          startedAt: event.timeStamp,
          vertical: false,
        };
        card.setPointerCapture(event.pointerId);
      });
      card.addEventListener("pointermove", (event) => {
        if (!gesture || event.pointerId !== gesture.pointerId) return;
        const distanceX = event.clientX - gesture.startX;
        const distanceY = event.clientY - gesture.startY;
        if (!card.classList.contains("is-dragging") && Math.abs(distanceY) > Math.abs(distanceX) && Math.abs(distanceY) > 8) {
          gesture.vertical = true;
          return;
        }
        if (gesture.vertical) return;
        event.preventDefault();
        const progress = clamp(distanceX / Math.max(1, card.getBoundingClientRect().width), -1, 1);
        card.classList.add("is-dragging");
        card.style.transform = `translate3d(${distanceX}px, 0, 0) rotate(${progress * 5}deg)`;
        card.style.setProperty("--swipe-progress", String(Math.abs(progress)));
      });
      card.addEventListener("pointerup", (event) => finish(event));
      card.addEventListener("pointercancel", (event) => finish(event, true));
      card.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
          event.preventDefault();
          event.stopPropagation();
          stopPlayback();
          commit(undoSwipe(state));
        } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          swipeCurrent(event.key === "ArrowLeft" ? "left" : "right", card);
        } else if (event.code === "Space") {
          event.preventDefault();
          if (isPlaying && playingCandidateId === candidate.id && playbackKind === "candidate") stopPlayback();
          else playFromUi(candidate, branch.session.stageBars === 16 ? "full" : "preview");
        }
      });
    }

    function renderDeck(branch) {
      elements.candidateDeck.replaceChildren();
      const ids = branch.deck.orderIds.slice(branch.deck.cursor, branch.deck.cursor + 3);
      const candidates = ids
        .map((id) => branch.session.population.find((candidate) => candidate.id === id))
        .filter(Boolean);
      candidates.forEach((candidate, offset) => {
        const card = createCandidateCard(branch, candidate, { deckOffset: offset });
        elements.candidateDeck.append(card);
        if (offset === 0) bindDeckGestures(card, candidate, branch);
      });
      const exhausted = !candidates.length || branch.deck.exhausted;
      elements.candidateDeck.hidden = exhausted;
      elements.deckExhausted.hidden = !exhausted;
      elements.deckProgress.textContent = exhausted
        ? `已看完 ${branch.deck.orderIds.length} 个`
        : `${branch.deck.cursor + 1} / ${branch.deck.orderIds.length}`;
      const current = candidates[0];
      elements.candidateContext.textContent = current
        ? `${branch.ordering === "preference" ? "偏好顺序" : "随机顺序"} · ${branch.session.stageBars} 小节 · ${branch.deck.completedIds.includes(current.id) ? "已完整试听" : "未完整试听"}`
        : `${branch.session.stageBars} 小节 · 本轮已浏览完`;
      const readOnly = branch.migrationState === "read-only";
      elements.undoSwipeButton.disabled = readOnly || !branch.deck.history.length;
      elements.skipCandidateButton.disabled = readOnly || exhausted;
      elements.chooseCandidateButton.disabled = readOnly || exhausted;
      elements.reshuffleDeckButton.disabled = readOnly;
      elements.viewAllCandidatesButton.disabled = !branch.session.population.length;
    }

    function renderAllCandidates(branch) {
      elements.allCandidatesPanel.hidden = !allCandidatesOpen;
      elements.allCandidatesGrid.replaceChildren();
      if (!allCandidatesOpen) return;
      orderedCandidates(state).forEach((candidate) => {
        elements.allCandidatesGrid.append(createCandidateCard(branch, candidate, { showChoose: true }));
      });
    }

    function renderReferencePicker(branch, mother) {
      elements.referencePicker.replaceChildren();
      const references = branch.decision.references || [];
      orderedCandidates(state).filter((candidate) => candidate.id !== mother.id).forEach((candidate) => {
        const selected = references.find((reference) => reference.candidateId === candidate.id);
        const group = doc.createElement("section");
        group.className = "reference-candidate";

        const header = doc.createElement("div");
        header.className = "reference-candidate-header";
        const name = doc.createElement("b");
        name.textContent = candidateDisplayName(branch, candidate);
        const play = doc.createElement("button");
        play.type = "button";
        play.className = "icon-button";
        play.dataset.candidatePlay = candidate.id;
        play.dataset.playMode = branch.session.stageBars === 16 ? "full" : "preview";
        play.title = "试听这个参考候选";
        play.setAttribute("aria-label", play.title);
        appendIcon(doc, play, "play");
        header.append(name, play);

        const traits = doc.createElement("div");
        traits.className = "reference-traits";
        TRAIT_KEYS.forEach((trait) => {
          const descriptor = core.traitReferenceDescriptor(mother, candidate, trait, branch.session.harmony);
          const delta = descriptor.targetValue - descriptor.primaryValue;
          const button = doc.createElement("button");
          button.type = "button";
          button.dataset.referenceCandidate = candidate.id;
          button.dataset.referenceTrait = trait;
          button.classList.toggle("is-active", selected?.trait === trait);
          button.setAttribute("aria-pressed", String(selected?.trait === trait));
          button.disabled = branch.migrationState === "read-only"
            || !descriptor.meaningful
            || (references.length >= 2 && !selected);
          button.title = descriptor.meaningful ? `参考${TRAIT_LABELS[trait]}` : "与母本差异不明显";
          const label = doc.createElement("span");
          label.textContent = TRAIT_LABELS[trait];
          const value = doc.createElement("b");
          value.textContent = `${delta >= 0 ? "+" : ""}${Math.round(delta * 100)}%`;
          button.append(label, value);
          traits.append(button);
        });
        group.append(header, traits);
        elements.referencePicker.append(group);
      });
    }

    function renderDecisionMother(branch, mother) {
      elements.decisionMother.replaceChildren();
      const header = doc.createElement("div");
      header.className = "decision-mother-header";
      const identity = doc.createElement("div");
      const name = doc.createElement("b");
      name.textContent = candidateDisplayName(branch, mother);
      const source = doc.createElement("small");
      source.textContent = `${sourceLabel(mother)} · ${mother.bars.length} 小节`;
      identity.append(name, source);
      const play = doc.createElement("button");
      play.type = "button";
      play.className = "icon-text-button";
      play.dataset.candidatePlay = mother.id;
      play.dataset.playMode = branch.session.stageBars === 16 ? "full" : "preview";
      appendIcon(doc, play, "play");
      const label = doc.createElement("span");
      label.textContent = branch.session.stageBars === 16 ? "完整试听" : "试听母本";
      play.append(label);
      header.append(identity, play);
      elements.decisionMother.append(header, renderCandidatePreview(doc, mother));
      renderBoundaryAudit(elements.decisionMother, branch, mother);
    }

    function addSummaryRow(target, label, value, pending = false) {
      const row = doc.createElement("div");
      const term = doc.createElement("span");
      term.textContent = label;
      const detail = doc.createElement("b");
      detail.textContent = value;
      detail.classList.toggle("is-pending", pending);
      row.append(term, detail);
      target.append(row);
    }

    function decisionReady(branch) {
      const decision = branch.decision;
      if (branch.migrationState === "read-only" || branch.finalCandidate || !decision?.action) return false;
      if (decision.action === "grow") return Boolean(decision.intent && decision.boundaryPolicy);
      if (decision.action === "finalize") return branch.deck.completedIds.includes(decision.primaryId)
        || branch.fullAuditionedIds.includes(decision.primaryId);
      return decision.action === "evolve";
    }

    function renderDecision(branch) {
      const browsing = branch.decision?.phase === "browsing";
      elements.candidateSection.hidden = !browsing;
      elements.decisionPanel.hidden = browsing;
      if (browsing) return;
      const decision = branch.decision;
      const mother = branch.session.population.find((candidate) => candidate.id === decision.primaryId);
      if (!mother) return;
      renderDecisionMother(branch, mother);
      const atFinalStage = branch.session.stageBars === 16;

      elements.decisionActionControl.querySelectorAll("[data-decision-action]").forEach((button) => {
        const action = button.dataset.decisionAction;
        button.hidden = action === "grow" ? atFinalStage : action === "finalize" ? !atFinalStage : false;
        button.disabled = branch.migrationState === "read-only" || Boolean(branch.finalCandidate);
        button.classList.toggle("is-active", decision.action === action);
        button.setAttribute("aria-pressed", String(decision.action === action));
      });

      const usesReferences = ["evolve", "grow"].includes(decision.action);
      elements.referenceStep.hidden = !usesReferences;
      if (usesReferences) renderReferencePicker(branch, mother);
      else elements.referencePicker.replaceChildren();

      const growing = decision.action === "grow";
      elements.growthIntentStep.hidden = !growing;
      elements.growthIntentControl.hidden = !growing;
      elements.boundaryPolicyStep.hidden = !growing;
      elements.boundaryPolicyControl.hidden = !growing;
      const suggested = suggestedGrowthIntent(branch.session.stageIndex);
      elements.growthIntentControl.querySelectorAll("[data-growth-intent]").forEach((button) => {
        const intent = button.dataset.growthIntent;
        button.replaceChildren();
        appendIcon(doc, button, INTENT_ICONS[intent]);
        const label = doc.createElement("span");
        label.textContent = INTENT_LABELS[intent];
        button.append(label);
        if (intent === suggested) {
          const suggestion = doc.createElement("small");
          suggestion.textContent = "建议";
          button.append(suggestion);
        }
        button.classList.toggle("is-suggested", intent === suggested);
        button.classList.toggle("is-active", decision.intent === intent);
        button.setAttribute("aria-pressed", String(decision.intent === intent));
      });
      elements.boundaryPolicyControl.querySelectorAll("[data-boundary-policy]").forEach((button) => {
        const policy = button.dataset.boundaryPolicy;
        button.classList.toggle("is-active", decision.boundaryPolicy === policy);
        button.setAttribute("aria-pressed", String(decision.boundaryPolicy === policy));
      });

      elements.decisionSummary.replaceChildren();
      addSummaryRow(elements.decisionSummary, "母本", candidateDisplayName(branch, mother));
      addSummaryRow(elements.decisionSummary, "操作", ACTION_LABELS[decision.action] || "未选择", !decision.action);
      if (usesReferences) {
        const referenceText = decision.references.length
          ? decision.references.map((reference) => {
            const candidate = branch.session.population.find((item) => item.id === reference.candidateId);
            return `${candidate ? candidateDisplayName(branch, candidate) : reference.candidateId} 的${TRAIT_LABELS[reference.trait]}`;
          }).join("；")
          : "无";
        addSummaryRow(elements.decisionSummary, "参考", referenceText);
      }
      if (growing) {
        addSummaryRow(elements.decisionSummary, "新乐段", INTENT_LABELS[decision.intent] || "未选择", !decision.intent);
        addSummaryRow(elements.decisionSummary, "交界", BOUNDARY_LABELS[decision.boundaryPolicy] || "未选择", !decision.boundaryPolicy);
      }
      if (decision.action === "finalize") {
        const completed = branch.deck.completedIds.includes(mother.id) || branch.fullAuditionedIds.includes(mother.id);
        addSummaryRow(elements.decisionSummary, "完整试听", completed ? "已完成" : "未完成", !completed);
      }
      const ready = decisionReady(branch);
      elements.executeDecisionButton.disabled = !ready;
      const executeLabel = elements.executeDecisionButton.querySelector("span");
      if (executeLabel) executeLabel.textContent = decision.action === "finalize" ? "确认作品" : "确认并生成";
    }

    function renderCandidates(branch) {
      const browsing = branch.decision?.phase === "browsing";
      if (!browsing) allCandidatesOpen = false;
      renderDeck(branch);
      renderAllCandidates(branch);
      renderDecision(branch);
    }

    function renderLineage(branch) {
      if (!elements.lineageGraph) return;
      elements.lineageGraph.replaceChildren();
      const records = [{ action: "seed-pool", bars: 2, round: 1 }, ...branch.lineage];
      records.forEach((record, index) => {
        const node = doc.createElement("div");
        node.className = "lineage-node";
        if (index === records.length - 1) node.classList.add("is-active");
        const dot = doc.createElement("span");
        dot.className = "lineage-dot";
        const copy = doc.createElement("div");
        const title = doc.createElement("b");
        const detail = doc.createElement("small");
        if (record.action === "evolve") {
          title.textContent = `再进化 · ${record.bars} 小节`;
          detail.textContent = `母本 ${record.candidateLabel || record.candidateName || record.candidateId}`;
        } else if (record.action === "freeze-grow") {
          title.textContent = `生长 · ${record.bars} → ${record.toBars} 小节`;
          detail.textContent = `母本 ${record.candidateLabel || record.candidateName || record.candidateId}`;
        } else if (record.action === "final") {
          title.textContent = "16 小节成品";
          detail.textContent = `母本 ${record.candidateLabel || record.candidateName || record.candidateId}`;
        } else {
          title.textContent = "种子池 · 第 1 轮";
          detail.textContent = branch.migrationState === "read-only" ? "2 小节 · 只读旧版" : "2 小节 · 随机候选";
        }
        copy.append(title, detail);

        if (record.action !== "seed-pool") {
          const facts = doc.createElement("ul");
          facts.className = "lineage-details";
          const addFact = (text, className = "") => {
            const item = doc.createElement("li");
            item.className = className;
            item.textContent = text;
            facts.append(item);
          };

          addFact(`阶段：${record.bars || "?"} 小节 · 第 ${record.round || "?"} 轮`);
          (record.references || []).forEach((reference) => {
            addFact(
              `请求：参考 ${reference.candidateLabel || reference.candidateName || reference.candidateId} 的${TRAIT_LABELS[reference.trait] || reference.trait}`,
              "is-request",
            );
          });
          (record.generatedReferenceResults || []).forEach((result) => {
            const outcome = result.outcome === "moved-toward"
              ? `明显靠近 ${Math.max(0, Math.round((result.progress || 0) * 100))}%`
              : "本轮未明显表达";
            addFact(
              `结果 ${result.candidateId}：参考${TRAIT_LABELS[result.trait] || result.trait} · ${outcome}`,
              "is-result",
            );
          });
          if (record.action === "freeze-grow") {
            const intent = INTENT_LABELS[record.intent] || "旧版未记录";
            const outcomes = record.generatedIntentResults || [];
            const strong = outcomes.filter((result) => result.outcome === "strong").length;
            const weak = outcomes.filter((result) => result.outcome === "weak").length;
            addFact(`新乐段：${intent} · 明显 ${strong} / ${outcomes.length || "?"} · 轻微 ${weak}`);
          }
          if (record.stageContract || record.boundaryPolicy) {
            const policy = BOUNDARY_LABELS[record.boundaryPolicy || record.stageContract?.boundaryPolicy]
              || "旧版未记录";
            const counts = (record.boundaryResults || []).map((result) => Number(result.changeCount) || 0);
            const range = counts.length ? `${Math.min(...counts)}-${Math.max(...counts)}` : "?";
            addFact(`交界：${policy} · ${range} 个事件变化`);
          }
          copy.append(facts);

          if (record.playbackSnapshot) {
            const replayButton = doc.createElement("button");
            replayButton.type = "button";
            replayButton.className = "lineage-replay-button";
            replayButton.textContent = "回放本轮";
            replayButton.addEventListener("click", () => openPlaybackPanel(record));
            copy.append(replayButton);
          } else {
            const legacyNote = doc.createElement("span");
            legacyNote.className = "lineage-legacy-note";
            legacyNote.textContent = "旧记录无音频回放";
            copy.append(legacyNote);
          }
        }
        node.append(dot, copy);
        elements.lineageGraph.append(node);
      });
    }

    function renderBranchList() {
      if (!elements.branchList) return;
      elements.branchList.hidden = !branchMenuOpen;
      elements.branchList.replaceChildren();
      if (!branchMenuOpen) return;
      state.branches.forEach((branch) => {
        const button = doc.createElement("button");
        button.type = "button";
        button.dataset.branchId = branch.id;
        button.className = branch.id === state.activeBranchId ? "is-active" : "";
        const name = doc.createElement("b");
        name.textContent = branch.name;
        const detail = doc.createElement("small");
        detail.textContent = `${branch.session.stageBars} 小节 · 第 ${branch.session.evolutionRound} 轮${branch.migrationState === "read-only" ? " · 只读" : ""}`;
        button.append(name, detail);
        elements.branchList.append(button);
      });
    }

    function renderMobileBar() {
      const bar = elements.mobileActionBar;
      if (!bar) return;
      const branch = activeBranch(state);
      const browsing = branch.decision?.phase === "browsing";
      const readOnly = branch.migrationState === "read-only";
      const play = bar.querySelector('[data-mobile-action="play"], [data-mobile-action="stop"]');
      const browsingActions = bar.querySelector('[data-mobile-phase="browsing"]');
      const decisionActions = bar.querySelector('[data-mobile-phase="decision"]');
      bar.classList.toggle("is-playing", isPlaying);
      browsingActions.hidden = isPlaying || !browsing;
      decisionActions.hidden = isPlaying || browsing;
      if (play) {
        play.dataset.mobileAction = isPlaying ? "stop" : "play";
        play.disabled = !isPlaying && !currentCandidate(branch);
        play.setAttribute("aria-label", isPlaying ? "停止播放" : "播放当前候选");
        const icon = play.querySelector("[data-lucide]");
        if (icon) icon.setAttribute("data-lucide", isPlaying ? "square" : "play");
      }
      browsingActions.querySelector('[data-mobile-action="skip"]').disabled = readOnly || branch.deck.exhausted;
      browsingActions.querySelector('[data-mobile-action="choose"]').disabled = readOnly || branch.deck.exhausted;
      const execute = decisionActions.querySelector('[data-mobile-action="execute"]');
      execute.disabled = !decisionReady(branch);
      const executeLabel = execute.querySelector("span");
      if (executeLabel) {
        const count = branch.decision?.references?.length || 0;
        executeLabel.textContent = branch.decision?.action === "finalize"
          ? "确认作品"
          : count ? `确认 · ${count} 参考` : "确认并生成";
      }
    }

    function renderControls(branch) {
      const session = branch.session;
      const stage = core.GROWTH_STAGES[session.stageIndex];
      const confidence = Math.round((1 - Math.exp(-state.preference.observations / 5)) * 100);
      const readOnly = branch.migrationState === "read-only";

      if (elements.headerStageValue) elements.headerStageValue.textContent = session.stageBars;
      if (elements.headerRoundValue) elements.headerRoundValue.textContent = session.evolutionRound;
      if (elements.stageValue) elements.stageValue.textContent = `${session.stageBars} / 16`;
      if (elements.roundValue) elements.roundValue.textContent = session.evolutionRound;
      if (elements.lockedBarsValue) elements.lockedBarsValue.textContent = `${stage.boundary == null ? 0 : stage.boundary} 小节`;
      if (elements.branchCountValue) elements.branchCountValue.textContent = state.branches.length;

      if (elements.keySelect && doc.activeElement !== elements.keySelect) elements.keySelect.value = session.harmony.key.name;
      if (elements.tempoInput && doc.activeElement !== elements.tempoInput) elements.tempoInput.value = session.harmony.bpm;
      if (elements.populationSelect && doc.activeElement !== elements.populationSelect) elements.populationSelect.value = session.populationSize;
      if (elements.mutationSlider && doc.activeElement !== elements.mutationSlider) {
        elements.mutationSlider.value = Math.round(state.settings.mutationRate * 100);
      }
      if (elements.mutationValue) elements.mutationValue.textContent = `${Math.round(state.settings.mutationRate * 100)}%`;
      if (elements.chordToggle) elements.chordToggle.checked = state.settings.accompaniment;
      if (elements.instrumentSelect) elements.instrumentSelect.value = state.settings.instrument;

      elements.orderingMode?.querySelectorAll("[data-ordering]").forEach((button) => {
        const active = button.dataset.ordering === branch.ordering;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
        button.disabled = readOnly || branch.decision?.phase !== "browsing";
      });
      if (elements.preferenceState) elements.preferenceState.textContent = confidence ? "学习中" : "等待试听";
      if (elements.preferenceFeedback) elements.preferenceFeedback.textContent = `${state.preference.feedbackCount} 次确认 · ${state.preference.observations} 次对比`;
      if (elements.confidenceFill) {
        elements.confidenceFill.style.width = `${confidence}%`;
        elements.confidenceFill.parentElement?.setAttribute("aria-valuenow", String(confidence));
      }

      [elements.keySelect, elements.tempoInput, elements.populationSelect, elements.mutationSlider]
        .filter(Boolean)
        .forEach((control) => { control.disabled = readOnly; });
      const hasReadOnly = state.branches.some((item) => item.migrationState === "read-only");
      elements.migrationNotice.hidden = !hasReadOnly;
      if (hasReadOnly) {
        elements.migrationNoticeText.textContent = readOnly
          ? `当前分支仅供回听：${branch.migrationReason || "旧数据缺少可验证的交界契约"}`
          : "原候选仍可在旧分支回听，当前新分支可继续创作。";
      }
      if (elements.rollbackButton) elements.rollbackButton.disabled = readOnly || !session.snapshots.length;
      if (elements.copyBranchButton) elements.copyBranchButton.disabled = readOnly;
      if (elements.stopPlaybackButton) elements.stopPlaybackButton.disabled = !isPlaying;
    }

    function render() {
      const branch = activeBranch(state);
      renderControls(branch);
      renderGrowth(branch);
      renderMelody(branch);
      renderCandidates(branch);
      renderLineage(branch);
      renderBranchList();
      renderMobileBar();
      refreshIcons();
    }

    function openPlaybackPanel(record) {
      if (!elements.playbackPanel) return;
      currentPlaybackLineage = record;
      playbackPanelOpen = true;
      elements.playbackPanel.hidden = false;

      const actionLabels = { evolve: "同阶段进化", "freeze-grow": "冻结并生长", final: "完成作品" };
      elements.playbackAction.textContent = actionLabels[record.action] || record.action;
      elements.playbackMother.textContent = record.candidateLabel || record.candidateName || record.candidateId;

      const hasIntent = record.action === "freeze-grow" && record.intent;
      elements.playbackIntentRow.hidden = !hasIntent;
      if (hasIntent) {
        elements.playbackIntent.textContent = INTENT_LABELS[record.intent] || record.intent;
      }

      const hasBoundary = record.boundaryPolicy || record.stageContract?.boundaryPolicy;
      elements.playbackBoundaryRow.hidden = !hasBoundary;
      if (hasBoundary) {
        elements.playbackBoundary.textContent = BOUNDARY_LABELS[record.boundaryPolicy || record.stageContract?.boundaryPolicy]
          || "旧版未记录";
      }

      const referenceList = elements.playbackReferenceList.querySelector("ul");
      referenceList.replaceChildren();
      (record.references || []).forEach((ref) => {
        const li = doc.createElement("li");
        li.textContent = `参考 ${ref.candidateLabel || ref.candidateName} 的${TRAIT_LABELS[ref.trait] || ref.trait}`;
        referenceList.append(li);
      });

      const snapshot = record.playbackSnapshot;
      const hasSnapshot = snapshot && snapshot.mother && snapshot.candidates;
      elements.playbackLegacyNote.hidden = hasSnapshot;
      elements.playbackCandidateSelect.disabled = !hasSnapshot;
      elements.playbackMotherButton.disabled = !hasSnapshot;
      elements.playbackCandidateButton.disabled = !hasSnapshot;

      if (hasSnapshot) {
        elements.playbackCandidateSelect.replaceChildren();
        snapshot.candidates.forEach((candidate, index) => {
          const option = doc.createElement("option");
          option.value = index.toString();
          option.textContent = candidate.name || `候选 ${index + 1}`;
          elements.playbackCandidateSelect.append(option);
        });

        elements.playbackMotherBars.textContent = `${snapshot.mother.bars.length} 小节`;
        updateCandidateBars();
      }

      refreshIcons();
    }

    function closePlaybackPanel() {
      if (!elements.playbackPanel) return;
      stopPlayback();
      playbackPanelOpen = false;
      currentPlaybackLineage = null;
      elements.playbackPanel.hidden = true;
    }

    function updateCandidateBars() {
      if (!currentPlaybackLineage?.playbackSnapshot) return;
      const snapshot = currentPlaybackLineage.playbackSnapshot;
      const selectedIndex = Number(elements.playbackCandidateSelect.value || 0);
      const candidate = snapshot.candidates[selectedIndex];
      if (candidate) {
        elements.playbackCandidateBars.textContent = `${candidate.bars.length} 小节`;
        renderPlaybackResults(currentPlaybackLineage, candidate.id);
      }
    }

    function renderPlaybackResults(record, candidateId) {
      const refResults = elements.playbackReferenceResults;
      refResults.replaceChildren();
      (record.generatedReferenceResults || [])
        .filter((result) => result.candidateId === candidateId)
        .forEach((result) => {
        const outcome = result.outcome === "moved-toward"
          ? `明显靠近 ${Math.max(0, Math.round((result.progress || 0) * 100))}%`
          : "本轮未明显表达";
        const div = doc.createElement("div");
        div.textContent = `参考${TRAIT_LABELS[result.trait] || result.trait} · ${outcome}`;
        refResults.append(div);
      });

      const structResults = elements.playbackStructureResults;
      structResults.replaceChildren();
      if (record.action === "freeze-grow") {
        const intent = INTENT_LABELS[record.intent] || "旧版未记录";
        const outcomes = (record.generatedIntentResults || [])
          .filter((result) => result.candidateId === candidateId);
        const strong = outcomes.filter((r) => r.outcome === "strong").length;
        const weak = outcomes.filter((r) => r.outcome === "weak").length;
        const div = doc.createElement("div");
        div.textContent = `结构意图：${intent} · 明显 ${strong} / ${outcomes.length || "?"} · 轻微 ${weak}`;
        structResults.append(div);
      }

      const boundaryResult = (record.boundaryResults || [])
        .find((result) => result.candidateId === candidateId);
      if (boundaryResult) {
        const div = doc.createElement("div");
        div.textContent = `交界变化：${Number(boundaryResult.changeCount) || 0} 个事件`;
        structResults.append(div);
      }
    }

    function playPlaybackCandidate(candidate, isMother) {
      if (!candidate) return;
      if (isPlaying) stopPlayback();

      const branch = activeBranch(state);
      const stageIndex = branch.session.stageIndex;
      const harmony = branch.session.harmony;

      isPlaying = true;
      playingCandidateId = candidate.id;
      playbackKind = "playback";

      const schedule = buildPlaybackSchedule(candidate, harmony, {
        mode: "full",
        stageIndex,
        accompaniment: elements.chordToggle?.checked ?? false,
      });

      try {
        playback.play(schedule, {
          instrument: state.settings.instrument,
          onComplete() {
            isPlaying = false;
            playingCandidateId = null;
            playbackKind = null;
            elements.playbackMotherButton.setAttribute("aria-pressed", "false");
            elements.playbackCandidateButton.setAttribute("aria-pressed", "false");
          },
        });
      } catch (error) {
        stopPlayback();
        notify(error.message.trim());
        return;
      }

      if (isMother) {
        elements.playbackMotherButton.setAttribute("aria-pressed", "true");
        elements.playbackCandidateButton.setAttribute("aria-pressed", "false");
      } else {
        elements.playbackCandidateButton.setAttribute("aria-pressed", "true");
        elements.playbackMotherButton.setAttribute("aria-pressed", "false");
      }
    }

    function commit(nextState, message) {
      state = nextState;
      persist();
      render();
      if (message) notify(message);
    }

    function handleAction(action) {
      try {
        if (action === "play") {
          const candidate = currentCandidate();
          if (isPlaying) stopPlayback();
          else playFromUi(candidate, "full");
        } else if (action === "stop") {
          stopPlayback();
        }
      } catch (error) {
        notify(error.message.trim());
      }
    }

    function executeFromUi() {
      const branch = activeBranch(state);
      const action = branch.decision?.action;
      stopPlayback();
      allCandidatesOpen = false;
      const next = executeDecision(state, { seed: Date.now() });
      const message = action === "finalize"
        ? "16 小节作品已确认"
        : action === "grow"
          ? `已生长到 ${activeBranch(next).session.stageBars} 小节`
          : `${branch.session.stageBars} 小节进入第 ${activeBranch(next).session.evolutionRound} 轮`;
      commit(next, message);
    }

    function chooseFromAll(candidateId) {
      stopPlayback();
      allCandidatesOpen = false;
      commit(beginMotherDecision(state, candidateId, "all"));
    }

    doc.addEventListener("click", (event) => {
      const target = event.target.closest("button");
      if (!target) return;
      try {
        if (target.dataset.action) {
          handleAction(target.dataset.action);
          return;
        }
        if (target.dataset.mobileAction) {
          const action = target.dataset.mobileAction;
          if (action === "play") {
            const branch = activeBranch(state);
            playFromUi(currentCandidate(branch), branch.session.stageBars === 16 ? "full" : "preview");
          } else if (action === "stop") stopPlayback();
          else if (action === "skip") swipeCurrent("left");
          else if (action === "choose") swipeCurrent("right");
          else if (action === "cancel") {
            stopPlayback();
            commit(cancelDecision(state));
          } else if (action === "execute") executeFromUi();
          return;
        }
        if (target.dataset.ordering) {
          commit(setOrdering(state, target.dataset.ordering));
          return;
        }
        if (target.dataset.candidateChoose) {
          chooseFromAll(target.dataset.candidateChoose);
          return;
        }
        if (target.dataset.candidatePlay) {
          const branch = activeBranch(state);
          const candidate = branch.session.population.find((item) => item.id === target.dataset.candidatePlay);
          if (isPlaying && playingCandidateId === candidate?.id && playbackKind === "candidate") stopPlayback();
          else playFromUi(candidate, target.dataset.playMode || "preview");
          return;
        }
        if (target.dataset.boundaryPlay) {
          const branch = activeBranch(state);
          const candidate = branch.session.population.find((item) => item.id === target.dataset.boundaryPlay);
          if (isPlaying && playingCandidateId === candidate?.id && playbackKind === "boundary") stopPlayback();
          else playBoundaryFromUi(candidate);
          return;
        }
        if (target.dataset.decisionAction) {
          commit(setDecisionAction(state, target.dataset.decisionAction));
          return;
        }
        if (target.dataset.referenceCandidate && target.dataset.referenceTrait) {
          const selected = activeBranch(state).decision.references.find(
            (reference) => reference.candidateId === target.dataset.referenceCandidate,
          );
          commit(selected?.trait === target.dataset.referenceTrait
            ? removeTraitReference(state, target.dataset.referenceCandidate)
            : addTraitReference(state, target.dataset.referenceCandidate, target.dataset.referenceTrait));
          return;
        }
        if (target.dataset.growthIntent) {
          commit(setGrowthIntent(state, target.dataset.growthIntent));
          return;
        }
        if (target.dataset.boundaryPolicy) {
          commit(setBoundaryPolicy(state, target.dataset.boundaryPolicy));
          return;
        }
        if (target.dataset.branchId) {
          stopPlayback();
          allCandidatesOpen = false;
          commit(switchBranch(state, target.dataset.branchId));
        }
      } catch (error) {
        notify(error.message.trim());
      }
    });

    elements.playCurrentButton?.addEventListener("click", () => handleAction("play"));
    elements.stopPlaybackButton?.addEventListener("click", stopPlayback);
    elements.skipCandidateButton?.addEventListener("click", () => swipeCurrent("left"));
    elements.chooseCandidateButton?.addEventListener("click", () => swipeCurrent("right"));
    elements.undoSwipeButton?.addEventListener("click", () => {
      try {
        stopPlayback();
        commit(undoSwipe(state));
      } catch (error) {
        notify(error.message.trim());
      }
    });
    elements.reshuffleDeckButton?.addEventListener("click", () => {
      try {
        stopPlayback();
        commit(reshuffleDeck(state), "候选已重新洗牌");
      } catch (error) {
        notify(error.message.trim());
      }
    });
    elements.viewAllCandidatesButton?.addEventListener("click", () => {
      allCandidatesOpen = true;
      render();
    });
    elements.closeAllCandidatesButton?.addEventListener("click", () => {
      allCandidatesOpen = false;
      render();
    });
    elements.cancelDecisionButton?.addEventListener("click", () => {
      try {
        stopPlayback();
        commit(cancelDecision(state));
      } catch (error) {
        notify(error.message.trim());
      }
    });
    elements.executeDecisionButton?.addEventListener("click", () => {
      try { executeFromUi(); } catch (error) { notify(error.message.trim()); }
    });
    elements.rollbackButton?.addEventListener("click", () => {
      try {
        stopPlayback();
        allCandidatesOpen = false;
        commit(rollbackCurrentStage(state), "已回到上一阶段");
      } catch (error) {
        notify(error.message.trim());
      }
    });
    elements.copyBranchButton?.addEventListener("click", () => {
      try {
        stopPlayback();
        allCandidatesOpen = false;
        commit(copyBranch(state), "已复制为独立分支");
      } catch (error) {
        notify(error.message.trim());
      }
    });
    elements.lineageMenuButton?.addEventListener("click", () => {
      branchMenuOpen = !branchMenuOpen;
      renderBranchList();
    });
    elements.closePlaybackPanel?.addEventListener("click", closePlaybackPanel);
    elements.playbackCandidateSelect?.addEventListener("change", updateCandidateBars);
    elements.playbackMotherButton?.addEventListener("click", () => {
      if (!currentPlaybackLineage?.playbackSnapshot) return;
      playPlaybackCandidate(currentPlaybackLineage.playbackSnapshot.mother, true);
    });
    elements.playbackCandidateButton?.addEventListener("click", () => {
      if (!currentPlaybackLineage?.playbackSnapshot) return;
      const selectedIndex = Number(elements.playbackCandidateSelect.value || 0);
      const candidate = currentPlaybackLineage.playbackSnapshot.candidates[selectedIndex];
      playPlaybackCandidate(candidate, false);
    });
    elements.newSessionButton?.addEventListener("click", () => {
      if (host.confirm && !host.confirm("新建进化会覆盖当前工作台和本地自动存档。继续吗？")) return;
      stopPlayback();
      allCandidatesOpen = false;
      branchMenuOpen = false;
      state = createAppState({
        seed: Date.now(),
        populationSize: Number(elements.populationSelect?.value || 12),
        key: elements.keySelect?.value,
        bpm: Number(elements.tempoInput?.value || 104),
        mutationRate: Number(elements.mutationSlider?.value || 28) / 100,
        accompaniment: elements.chordToggle?.checked,
        instrument: elements.instrumentSelect?.value,
      });
      persist();
      render();
      notify("已创建新的 2 小节种子池");
    });

    elements.mutationSlider?.addEventListener("input", () => {
      const value = clamp(Number(elements.mutationSlider.value), 8, 62);
      elements.mutationValue.textContent = `${value}%`;
      elements.mutationSlider.setAttribute("aria-valuetext", `${value}%`);
    });
    elements.mutationSlider?.addEventListener("change", () => {
      commit(updateSettings(state, { mutationRate: Number(elements.mutationSlider.value) / 100 }));
    });
    elements.chordToggle?.addEventListener("change", () => {
      commit(updateSettings(state, { accompaniment: elements.chordToggle.checked }));
    });
    elements.instrumentSelect?.addEventListener("change", () => {
      commit(updateSettings(state, { instrument: elements.instrumentSelect.value }));
    });
    elements.tempoInput?.addEventListener("change", () => commit(updateTempo(state, elements.tempoInput.value)));
    elements.keySelect?.addEventListener("change", () => {
      notify("调式将在新建进化时采用");
    });
    elements.populationSelect?.addEventListener("change", () => {
      notify("候选数将在新建进化时采用");
    });

    doc.addEventListener("keydown", (event) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "z") return;
      if (!elements.candidateSection.contains(doc.activeElement)) return;
      event.preventDefault();
      try {
        stopPlayback();
        commit(undoSwipe(state));
      } catch (error) {
        notify(error.message.trim());
      }
    });

    host.addEventListener?.("load", refreshIcons, { once: true });
    persist();
    render();

    return {
      getState: () => state,
      setState(nextState) { commit(nextState); },
      stop: stopPlayback,
    };
  }

  return {
    APP_VERSION,
    LEGACY_STORAGE_KEY,
    STORAGE_KEY,
    activeBranch,
    addTraitReference,
    beginMotherDecision,
    buildBoundaryComparisonSchedule,
    buildPlaybackSchedule,
    candidateFeatureVector,
    copyBranch,
    completeAudition,
    createAppState,
    createDecisionState,
    createDeckState,
    createPreferenceState,
    createAudioEngine,
    evolveCurrentStage,
    executeDecision,
    finalizeCurrentCandidate,
    freezeCurrentStage,
    currentDeckCandidate,
    markFullyAuditioned,
    markListened,
    mount,
    orderedCandidates,
    orderedCandidateIds,
    preferenceScore,
    removeTraitReference,
    restoreState,
    reshuffleDeck,
    rollbackCurrentStage,
    selectPrimary,
    serializeState,
    setOrdering,
    setBoundaryPolicy,
    setDecisionAction,
    setGrowthIntent,
    swipeDirection,
    swipeCandidate,
    switchBranch,
    toggleDonor,
    updateSettings,
    updateTempo,
    undoSwipe,
    cancelDecision,
  };
});
