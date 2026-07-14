(function initMusicEvolutionCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MusicEvolutionCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createMusicEvolutionCore() {
  const GROWTH_STAGES = [
    { bars: 2, label: "种子", section: "Seed", boundary: null, mutableStart: 0 },
    { bars: 4, label: "A", section: "A", boundary: 1, mutableStart: 2 },
    { bars: 8, label: "A'", section: "A/A'", boundary: 3, mutableStart: 4 },
    { bars: 12, label: "B", section: "A/A'/B", boundary: 7, mutableStart: 8 },
    { bars: 16, label: "A''", section: "A/A'/B/A''", boundary: 11, mutableStart: 12 },
  ];

  const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
  const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];
  const KEY_OPTIONS = [
    { name: "C major", tonic: 60, mode: "major" },
    { name: "G major", tonic: 55, mode: "major" },
    { name: "D major", tonic: 62, mode: "major" },
    { name: "F major", tonic: 53, mode: "major" },
    { name: "Bb major", tonic: 58, mode: "major" },
    { name: "A minor", tonic: 57, mode: "minor" },
    { name: "E minor", tonic: 52, mode: "minor" },
    { name: "D minor", tonic: 62, mode: "minor" },
    { name: "G minor", tonic: 55, mode: "minor" },
    { name: "C minor", tonic: 60, mode: "minor" },
  ];
  const PROGRESSIONS = [
    [0, 4, 5, 3],
    [0, 5, 3, 4],
    [0, 3, 4, 0],
  ];
  const RHYTHM_PATTERNS = [
    [1, 1, 1, 1],
    [0.5, 0.5, 1, 1, 1],
    [1, 0.5, 0.5, 2],
    [0.5, 0.5, 0.5, 0.5, 1, 1],
    [1.5, 0.5, 1, 1],
  ];
  const GROWTH_INTENTS = ["continue", "vary", "contrast", "return"];
  const STORED_GROWTH_INTENTS = [...GROWTH_INTENTS, "legacy"];
  const BOUNDARY_POLICIES = ["strict", "light"];
  const BOUNDARY_EVENT_KEYS = ["duration", "pitch", "rest", "start"];
  const MIDI_PITCH_MIN = 0;
  const MIDI_PITCH_MAX = 127;

  function createRng(seed) {
    let value = Number(seed) >>> 0;
    return function random() {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  function randomInt(rng, min, max) {
    return min + Math.floor(rng() * (max - min + 1));
  }

  function randomItem(rng, items) {
    return items[Math.floor(rng() * items.length)];
  }

  function cloneBar(bar) {
    return {
      events: bar.events.map((event) => ({ ...event })),
    };
  }

  function cloneBars(bars) {
    return bars ? bars.map(cloneBar) : null;
  }

  function cloneStageContract(contract) {
    if (!contract) return null;
    return {
      ...contract,
      boundaryAnchor: cloneBar(contract.boundaryAnchor),
    };
  }

  function barDuration(bar) {
    return Number(bar.events.reduce((sum, event) => sum + event.duration, 0).toFixed(6));
  }

  function boundaryDiff(anchor, candidate) {
    const length = Math.max(anchor.events.length, candidate.events.length);
    return Array.from({ length }, (_, index) => {
      const before = anchor.events[index] || null;
      const after = candidate.events[index] || null;
      return JSON.stringify(before) === JSON.stringify(after) ? null : { index, before, after };
    }).filter(Boolean);
  }

  function boundaryChangeCount(before, after) {
    return boundaryDiff(before, after).length;
  }

  function validateGrowthIntent(intent) {
    if (!GROWTH_INTENTS.includes(intent)) throw new Error(`Invalid growth intent: ${intent}.`);
  }

  function validateBoundaryPolicy(boundaryPolicy) {
    if (!BOUNDARY_POLICIES.includes(boundaryPolicy)) {
      throw new Error(`Invalid boundary policy: ${boundaryPolicy}.`);
    }
  }

  function validateGrowthDecisions(options) {
    validateGrowthIntent(options.intent);
    validateBoundaryPolicy(options.boundaryPolicy);
  }

  function createStageContract(parent, nextStageIndex, options = {}) {
    return {
      stageIndex: nextStageIndex,
      boundaryIndex: GROWTH_STAGES[nextStageIndex].boundary,
      boundaryPolicy: options.boundaryPolicy,
      boundaryAnchor: cloneBar(parent.bars.at(-1)),
      growthIntent: options.intent,
    };
  }

  function validateStageContractDefinition(contract, expectedStageIndex, allowedGrowthIntents, contractKind) {
    if (!contract || typeof contract !== "object") throw new Error("A stage contract is required.");
    if (!Number.isInteger(contract.stageIndex)
      || contract.stageIndex < 0
      || contract.stageIndex >= GROWTH_STAGES.length) {
      throw new Error(`Invalid stage contract index: ${contract.stageIndex}.`);
    }
    if (!Number.isInteger(expectedStageIndex)
      || expectedStageIndex < 0
      || expectedStageIndex >= GROWTH_STAGES.length) {
      throw new Error(`Invalid session stage index for stage contract: ${expectedStageIndex}.`);
    }
    if (!allowedGrowthIntents.includes(contract.growthIntent)) {
      throw new Error(`Invalid ${contractKind} growth intent: ${contract.growthIntent}.`);
    }
    if (!BOUNDARY_POLICIES.includes(contract.boundaryPolicy)) {
      throw new Error(`Invalid stage contract boundary policy: ${contract.boundaryPolicy}.`);
    }
    if (contract.stageIndex !== expectedStageIndex) {
      throw new Error(`Stage contract index ${contract.stageIndex} does not match stage ${expectedStageIndex}.`);
    }
    if (contract.boundaryIndex !== GROWTH_STAGES[contract.stageIndex].boundary) {
      throw new Error(`Stage contract boundary does not match stage ${expectedStageIndex}.`);
    }
    if (!contract.boundaryAnchor || !Array.isArray(contract.boundaryAnchor.events)) {
      throw new Error("Stage contract requires a boundary anchor.");
    }
  }

  function validatePersistedStageContract(contract, expectedStageIndex) {
    validateStageContractDefinition(
      contract,
      expectedStageIndex,
      STORED_GROWTH_INTENTS,
      "persisted stage contract",
    );
  }

  function validateNextStageContract(contract, expectedStageIndex) {
    validateStageContractDefinition(
      contract,
      expectedStageIndex,
      GROWTH_INTENTS,
      "new stage contract",
    );
  }

  function validateSessionStage(session) {
    const validSessionIndex = Number.isInteger(session.stageIndex)
      && session.stageIndex >= 0
      && session.stageIndex < GROWTH_STAGES.length;
    if (!validSessionIndex) {
      const contractIndex = session.stageContract?.stageIndex;
      if (!Number.isInteger(contractIndex)
        || contractIndex < 0
        || contractIndex >= GROWTH_STAGES.length) {
        throw new Error(`Invalid stage contract index: ${contractIndex}.`);
      }
      throw new Error(`Invalid session stage index for stage contract: ${session.stageIndex}.`);
    }
    if (session.stageIndex > 0) {
      validatePersistedStageContract(session.stageContract, session.stageIndex);
    }
  }

  function scaleForKey(key) {
    return key.mode === "minor" ? MINOR_SCALE : MAJOR_SCALE;
  }

  function createHarmonyCanvas(rng, options = {}) {
    const requestedKey = KEY_OPTIONS.find((keyOption) => keyOption.name === options.key);
    const key = requestedKey || randomItem(rng, KEY_OPTIONS);
    const progression = randomItem(rng, PROGRESSIONS);
    const chords = Array.from({ length: 16 }, (_, barIndex) => ({
      degree: progression[barIndex % progression.length],
      barIndex,
    }));
    return {
      beatsPerBar: 4,
      bars: 16,
      bpm: Number.isFinite(Number(options.bpm))
        ? Math.max(48, Math.min(180, Math.round(Number(options.bpm))))
        : randomInt(rng, 88, 120),
      key,
      chords,
      accompaniment: true,
    };
  }

  function chordTones(harmony, barIndex) {
    const scale = scaleForKey(harmony.key);
    const degree = harmony.chords[barIndex].degree;
    return [degree, (degree + 2) % 7, (degree + 4) % 7].map((index) => harmony.key.tonic + scale[index]);
  }

  function generateBar(rng, harmony, barIndex, previousPitch = harmony.key.tonic) {
    const durations = randomItem(rng, RHYTHM_PATTERNS);
    const scale = scaleForKey(harmony.key);
    const stable = chordTones(harmony, barIndex);
    let cursor = 0;
    let pitch = previousPitch;
    const events = durations.map((duration, eventIndex) => {
      if (eventIndex === 0 || cursor % 1 === 0) {
        const target = randomItem(rng, stable);
        pitch += Math.max(-5, Math.min(5, target - pitch));
      } else {
        pitch += randomItem(rng, [-2, -1, 0, 1, 2]);
      }
      const nearestScalePitch = harmony.key.tonic + randomItem(rng, scale) + 12 * Math.round((pitch - harmony.key.tonic) / 12);
      pitch = Math.max(48, Math.min(84, nearestScalePitch));
      const event = { pitch, start: cursor, duration, rest: false };
      cursor += duration;
      return event;
    });
    return { events };
  }

  function cloneCandidate(candidate) {
    return {
      ...candidate,
      bars: candidate.bars.map(cloneBar),
      origin: {
        ...candidate.origin,
        donorIds: [...(candidate.origin?.donorIds || [])],
      },
    };
  }

  function pitchEvents(bars) {
    return bars.flatMap((bar) => bar.events).filter((event) => !event.rest && Number.isFinite(event.pitch));
  }

  function averagePitch(bars) {
    const events = pitchEvents(bars);
    return events.reduce((sum, event) => sum + event.pitch, 0) / Math.max(events.length, 1);
  }

  function movePitchInScale(pitch, steps, harmony) {
    const scale = scaleForKey(harmony.key);
    const candidates = [];
    for (let octave = -2; octave <= 3; octave += 1) {
      scale.forEach((interval) => candidates.push(harmony.key.tonic + interval + octave * 12));
    }
    candidates.sort((a, b) => a - b);
    let nearest = 0;
    candidates.forEach((candidate, index) => {
      if (Math.abs(candidate - pitch) < Math.abs(candidates[nearest] - pitch)) nearest = index;
    });
    return candidates[Math.max(0, Math.min(candidates.length - 1, nearest + steps))];
  }

  function mutateBoundaryBar(bar, rng, harmony) {
    const next = cloneBar(bar);
    const available = next.events
      .map((event, index) => ({ event, index }))
      .filter(({ event }) => !event.rest && Number.isFinite(event.pitch));
    const changeLimit = Math.min(available.length, randomInt(rng, 0, 2));
    const used = new Set();
    for (let change = 0; change < changeLimit; change += 1) {
      let target = randomItem(rng, available);
      while (used.has(target.index) && used.size < available.length) target = randomItem(rng, available);
      used.add(target.index);
      next.events[target.index].pitch = movePitchInScale(target.event.pitch, randomItem(rng, [-2, -1, 1, 2]), harmony);
    }
    return next;
  }

  function boundaryFromContract(contract, rng, harmony) {
    if (!contract || contract.boundaryIndex == null) return null;
    if (contract.boundaryPolicy === "strict") return cloneBar(contract.boundaryAnchor);
    return mutateBoundaryBar(contract.boundaryAnchor, rng, harmony);
  }

  function mutateBar(bar, rng, harmony, intensity = 0.28) {
    const next = cloneBar(bar);
    next.events.forEach((event) => {
      if (!event.rest && rng() < intensity) {
        event.pitch = movePitchInScale(event.pitch, randomItem(rng, [-2, -1, 1, 2]), harmony);
      }
      if (rng() < intensity * 0.16) event.rest = !event.rest;
    });
    return next;
  }

  function mutableBarStart(stageIndex) {
    const stage = GROWTH_STAGES[stageIndex];
    return stage.boundary == null ? 0 : stage.boundary;
  }

  function generationBuckets(size) {
    const mutation = Math.floor(size * 0.6);
    const donor = Math.floor(size * 0.25);
    return { mutation, donor, random: size - mutation - donor };
  }

  function rhythmTokens(bars) {
    const durations = bars.flatMap((bar) => bar.events.map((event) => event.duration));
    if (durations.length < 2) return durations.map(String);
    return durations.slice(1).map((duration, index) => `${durations[index]}:${duration}`);
  }

  function contourTokens(bars) {
    const pitches = pitchEvents(bars).map((event) => event.pitch);
    return pitches.slice(1).map((pitch, index) => Math.sign(pitch - pitches[index]));
  }

  function jaccardSimilarity(a, b) {
    const left = new Set(a);
    const right = new Set(b);
    const union = new Set([...left, ...right]);
    if (!union.size) return 1;
    const intersection = [...left].filter((value) => right.has(value)).length;
    return intersection / union.size;
  }

  function sequenceSimilarity(a, b) {
    if (!a.length && !b.length) return 1;
    const table = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let leftIndex = 1; leftIndex <= a.length; leftIndex += 1) {
      for (let rightIndex = 1; rightIndex <= b.length; rightIndex += 1) {
        table[leftIndex][rightIndex] = a[leftIndex - 1] === b[rightIndex - 1]
          ? table[leftIndex - 1][rightIndex - 1] + 1
          : Math.max(table[leftIndex - 1][rightIndex], table[leftIndex][rightIndex - 1]);
      }
    }
    return table[a.length][b.length] / Math.max(a.length, b.length, 1);
  }

  function motifSimilarity(a, b) {
    const rhythm = jaccardSimilarity(rhythmTokens(a), rhythmTokens(b));
    const contour = sequenceSimilarity(contourTokens(a), contourTokens(b));
    return Number((0.55 * rhythm + 0.45 * contour).toFixed(6));
  }

  function rhythmSignature(bar) {
    return bar.events.map((event) => `${event.start}:${event.duration}:${event.rest ? 1 : 0}`);
  }

  function rhythmSimilarity(a, b) {
    const left = a.map((bar) => rhythmSignature(bar).join("|"));
    const right = b.map((bar) => rhythmSignature(bar).join("|"));
    return sequenceSimilarity(left, right);
  }

  function repeatBars(sourceBars, count) {
    if (!sourceBars?.length) return [];
    return Array.from({ length: count }, (_, index) => cloneBar(sourceBars[index % sourceBars.length]));
  }

  function revoiceBars(bars, rng, harmony, intensity) {
    return bars.map((bar) => ({
      events: bar.events.map((event) => (
        !event.rest && rng() < intensity
          ? { ...event, pitch: movePitchInScale(event.pitch, randomItem(rng, [-2, -1, 1, 2]), harmony) }
          : { ...event }
      )),
    }));
  }

  function createSeedCandidate(rng, harmony, index) {
    const bars = [];
    let previousPitch = harmony.key.tonic;
    for (let barIndex = 0; barIndex < 2; barIndex += 1) {
      const bar = generateBar(rng, harmony, barIndex, previousPitch);
      bars.push(bar);
      previousPitch = bar.events.at(-1).pitch;
    }
    return {
      id: `seed-${index}-${randomInt(rng, 1000, 9999)}`,
      name: `Seed ${index + 1}`,
      bars,
      origin: { type: "seed", primaryParentId: null, donorIds: [] },
      listened: false,
      retained: false,
    };
  }

  function createInitialSession(options = {}) {
    const seed = Number(options.seed ?? Date.now());
    const populationSize = Number(options.populationSize ?? 8);
    const rng = createRng(seed);
    const harmony = createHarmonyCanvas(rng, options);
    return {
      version: 1,
      seed,
      stageIndex: 0,
      stageBars: GROWTH_STAGES[0].bars,
      evolutionRound: 1,
      populationSize,
      harmony,
      population: Array.from({ length: populationSize }, (_, index) => createSeedCandidate(rng, harmony, index)),
      selectedIds: [],
      snapshots: [],
      branches: [],
      stageContract: null,
      rootMotif: null,
    };
  }

  function growFromParent(parent, session, options = {}) {
    validateSessionStage(session);
    const nextStageIndex = Math.min(session.stageIndex + 1, GROWTH_STAGES.length - 1);
    let nextContract = options.stageContract;
    if (nextContract) {
      validateNextStageContract(nextContract, nextStageIndex);
      if (options.intent !== undefined) {
        validateGrowthIntent(options.intent);
        if (options.intent !== nextContract.growthIntent) {
          throw new Error("Growth intent does not match the supplied stage contract.");
        }
      }
      if (options.boundaryPolicy !== undefined) {
        validateBoundaryPolicy(options.boundaryPolicy);
        if (options.boundaryPolicy !== nextContract.boundaryPolicy) {
          throw new Error("Boundary policy does not match the supplied stage contract.");
        }
      }
    } else {
      validateGrowthDecisions(options);
      nextContract = createStageContract(parent, nextStageIndex, options);
    }
    const candidate = growWithContract(
      parent,
      session,
      nextContract,
      options.seed ?? session.seed + session.evolutionRound + 1,
      "intent",
    );
    assertPopulationCandidate(candidate, nextStageIndex, nextContract, session.harmony);
    return candidate;
  }

  function nearestScaleDegreeIndex(pitch, harmony) {
    const scale = scaleForKey(harmony.key);
    const relativeOctave = Math.floor((pitch - harmony.key.tonic) / 12);
    let nearest = null;
    [-2, -1, 0, 1, 2].forEach((octaveOffset) => {
      const octave = relativeOctave + octaveOffset;
      scale.forEach((interval, degree) => {
        const scalePitch = harmony.key.tonic + interval + octave * 12;
        const distance = Math.abs(scalePitch - pitch);
        if (!nearest || distance < nearest.distance) {
          nearest = { distance, index: octave * scale.length + degree };
        }
      });
    });
    return nearest.index;
  }

  function assertBoundaryEventSchema(event, index, owner) {
    const eventLabel = `${owner} boundary event ${index + 1}`;
    if (!event || typeof event !== "object" || Array.isArray(event)) {
      throw new Error(`${eventLabel} must use the exact event schema.`);
    }
    const keys = Object.keys(event).sort();
    if (JSON.stringify(keys) !== JSON.stringify(BOUNDARY_EVENT_KEYS)) {
      throw new Error(`${eventLabel} must use the exact event schema.`);
    }
    if (typeof event.rest !== "boolean") {
      throw new Error(`${eventLabel} rest must be boolean.`);
    }
    if (!Number.isFinite(event.pitch)
      || event.pitch < MIDI_PITCH_MIN
      || event.pitch > MIDI_PITCH_MAX) {
      throw new Error(
        `${eventLabel} pitch must be a finite MIDI pitch from ${MIDI_PITCH_MIN} to ${MIDI_PITCH_MAX}.`,
      );
    }
    if (!Number.isFinite(event.start) || event.start < 0 || event.start >= 4) {
      throw new Error(`${eventLabel} start must be a finite number from 0 up to 4 beats.`);
    }
    if (!Number.isFinite(event.duration)
      || event.duration <= 0
      || event.duration > 4
      || event.start + event.duration > 4 + 1e-9) {
      throw new Error(`${eventLabel} duration must be a positive finite number within the four-beat bar.`);
    }
  }

  function assertBoundaryBarSchema(bar, owner) {
    if (!bar || !Array.isArray(bar.events) || !bar.events.length) {
      throw new Error(`${owner} boundary must contain valid events.`);
    }
    bar.events.forEach((event, index) => assertBoundaryEventSchema(event, index, owner));
  }

  function assertStageContract(candidate, contract, harmony) {
    if (!contract || contract.boundaryIndex == null) return;
    const boundary = candidate.bars[contract.boundaryIndex];
    if (!boundary) throw new Error(`Candidate ${candidate.id} is missing its stage boundary.`);
    assertBoundaryBarSchema(contract.boundaryAnchor, "Anchor");
    if (contract.boundaryPolicy === "light"
      && (!Array.isArray(boundary.events)
        || boundary.events.length !== contract.boundaryAnchor.events.length)) {
      throw new Error("Light boundary must preserve the same event structure as its stage anchor.");
    }
    assertBoundaryBarSchema(boundary, "Candidate");
    if (contract.boundaryPolicy === "strict") {
      if (JSON.stringify(boundary) !== JSON.stringify(contract.boundaryAnchor)) {
        throw new Error("Strict boundary must be byte-identical to its stage anchor.");
      }
      return;
    }

    const anchorEvents = contract.boundaryAnchor.events;
    const changes = boundaryDiff(contract.boundaryAnchor, boundary);
    if (changes.length > 2) throw new Error("Light boundary cannot change more than two anchor events.");
    changes.forEach(({ before, after }) => {
      if (!before || !after) {
        throw new Error("Light boundary must preserve the same event structure as its stage anchor.");
      }
      const scaleDegrees = Math.abs(
        nearestScaleDegreeIndex(after.pitch, harmony) - nearestScaleDegreeIndex(before.pitch, harmony),
      );
      if (scaleDegrees > 2) throw new Error("Light boundary pitch cannot move more than two scale degrees.");
      if (Math.abs(after.start - before.start) > 1) {
        throw new Error("Light boundary event start cannot move more than one beat.");
      }
      if (Math.abs(after.duration - before.duration) > 1) {
        throw new Error("Light boundary event duration cannot move more than one beat.");
      }
    });
  }

  function assertPopulationCandidate(candidate, stageIndex, contract, harmony) {
    const expectedBars = GROWTH_STAGES[stageIndex].bars;
    if (candidate.bars.length !== expectedBars) {
      throw new Error(`Candidate ${candidate.id} must contain exactly ${expectedBars} bars.`);
    }
    candidate.bars.forEach((bar, index) => {
      if (barDuration(bar) !== 4) {
        throw new Error(`Candidate ${candidate.id} bar ${index + 1} must contain exactly four beats.`);
      }
    });
    assertStageContract(candidate, contract, harmony);
  }

  const TRAIT_KEYS = ["density", "contour", "register", "space", "tension"];
  const TRAIT_THRESHOLDS = {
    density: 0.04,
    contour: 0.12,
    register: 0.08,
    space: 0.04,
    tension: 0.04,
  };

  function candidateTraits(candidate, harmony, barOffset = 0) {
    const events = candidate.bars.flatMap((bar) => bar.events);
    const sounding = events.filter((event) => !event.rest);
    const indexedSounding = candidate.bars.flatMap((bar, barIndex) => (
      bar.events.filter((event) => !event.rest).map((event) => ({ event, barIndex }))
    ));
    const contour = contourTokens(candidate.bars);
    const upward = contour.filter((value) => value > 0).length;
    const downward = contour.filter((value) => value < 0).length;
    const tenseCount = indexedSounding.filter(({ event, barIndex }) => {
      const chordPitchClasses = new Set(chordTones(harmony, barIndex + barOffset).map((pitch) => pitch % 12));
      return !chordPitchClasses.has(event.pitch % 12);
    }).length;
    return {
      density: sounding.length / Math.max(candidate.bars.length * 8, 1),
      contour: (upward - downward) / Math.max(contour.length, 1),
      register: averagePitch(candidate.bars),
      space: events.filter((event) => event.rest).length / Math.max(events.length, 1),
      tension: tenseCount / Math.max(indexedSounding.length, 1),
    };
  }

  function normalizedTraitValue(candidate, harmony, trait, barOffset = 0) {
    const traits = candidateTraits(candidate, harmony, barOffset);
    const values = {
      density: Math.max(0, Math.min(1, traits.density)),
      contour: Math.max(0, Math.min(1, (traits.contour + 1) / 2)),
      register: Math.max(0, Math.min(1, (traits.register - 48) / 36)),
      space: Math.max(0, Math.min(1, traits.space)),
      tension: Math.max(0, Math.min(1, traits.tension)),
    };
    if (!TRAIT_KEYS.includes(trait)) throw new Error(`Unsupported reference trait: ${trait}`);
    return Number(values[trait].toFixed(6));
  }

  function traitReferenceDescriptor(primary, reference, trait, harmony) {
    const primaryValue = normalizedTraitValue(primary, harmony, trait);
    const targetValue = normalizedTraitValue(reference, harmony, trait);
    return {
      candidateId: reference.id,
      trait,
      primaryValue,
      targetValue,
      meaningful: Math.abs(targetValue - primaryValue) >= TRAIT_THRESHOLDS[trait],
    };
  }

  function referenceEffect(primaryValue, targetValue, resultValue) {
    const initialDistance = Math.abs(targetValue - primaryValue);
    if (initialDistance < 1e-9) return { progress: 0, outcome: "missed" };
    const progress = Math.max(-1, Math.min(1, 1 - Math.abs(targetValue - resultValue) / initialDistance));
    return {
      progress: Number(progress.toFixed(6)),
      outcome: progress >= 0.25 ? "moved-toward" : progress > 0 ? "weak" : "missed",
    };
  }

  function splitEvent(bar, eventIndex) {
    const event = bar.events[eventIndex];
    if (!event || event.duration < 1) return false;
    const firstDuration = event.duration / 2;
    const secondDuration = event.duration - firstDuration;
    bar.events.splice(
      eventIndex,
      1,
      { ...event, duration: firstDuration },
      { ...event, start: event.start + firstDuration, duration: secondDuration },
    );
    return true;
  }

  function moveDensity(candidate, targetValue, harmony, startBar, rng) {
    const current = normalizedTraitValue(candidate, harmony, "density");
    const bars = candidate.bars.slice(startBar);
    if (current < targetValue) {
      const rests = bars.flatMap((bar) => bar.events.filter((event) => event.rest));
      if (rests.length) rests[Math.floor(rng() * rests.length)].rest = false;
      else {
        const bar = bars.find((item) => item.events.some((event) => event.duration >= 1));
        if (bar) splitEvent(bar, bar.events.findIndex((event) => event.duration >= 1));
      }
    } else {
      const sounding = bars.flatMap((bar) => bar.events.filter((event) => !event.rest));
      if (sounding.length > 2) sounding[Math.floor(rng() * sounding.length)].rest = true;
    }
  }

  function moveSpace(candidate, targetValue, harmony, startBar, rng) {
    const bars = candidate.bars.slice(startBar);
    const events = bars.flatMap((bar) => bar.events);
    const current = normalizedTraitValue(candidate, harmony, "space");
    const pool = events.filter((event) => current < targetValue ? !event.rest : event.rest);
    if (pool.length) pool[Math.floor(rng() * pool.length)].rest = current < targetValue;
  }

  function moveRegister(candidate, targetValue, harmony, startBar) {
    const current = normalizedTraitValue(candidate, harmony, "register");
    const direction = Math.sign(targetValue - current);
    if (!direction) return;
    candidate.bars.slice(startBar).forEach((bar) => bar.events.forEach((event) => {
      if (!event.rest) event.pitch = movePitchInScale(event.pitch, direction, harmony);
    }));
  }

  function moveContour(candidate, targetValue, harmony, startBar) {
    const current = normalizedTraitValue(candidate, harmony, "contour");
    const direction = Math.sign(targetValue - current);
    if (!direction) return false;
    const initialDistance = Math.abs(targetValue - current);
    const sounding = candidate.bars.flatMap((bar, barIndex) => (
      bar.events.filter((event) => !event.rest).map((event) => ({ event, barIndex }))
    ));
    const boundaries = sounding
      .map((item, index) => ({ ...item, index }))
      .filter(({ event, barIndex, index }) => (
        index > 0
        && barIndex >= startBar
        && Math.sign(event.pitch - sounding[index - 1].event.pitch) !== direction
      ))
      .reverse();

    for (const boundary of boundaries) {
      const suffix = sounding.slice(boundary.index);
      const originalPitches = suffix.map(({ event }) => event.pitch);
      for (let steps = 1; steps <= 24; steps += 1) {
        suffix.forEach(({ event }, index) => {
          event.pitch = movePitchInScale(originalPitches[index], direction * steps, harmony);
        });
        const resultValue = normalizedTraitValue(candidate, harmony, "contour");
        if (Math.abs(targetValue - resultValue) < initialDistance) return true;
      }
      suffix.forEach(({ event }, index) => {
        event.pitch = originalPitches[index];
      });
    }
    return false;
  }

  function nearestChordPitch(pitch, harmony, barIndex) {
    const candidates = [];
    chordTones(harmony, barIndex).forEach((tone) => {
      for (let octave = -3; octave <= 3; octave += 1) candidates.push(tone + octave * 12);
    });
    return candidates.reduce((nearest, candidate) => (
      Math.abs(candidate - pitch) < Math.abs(nearest - pitch) ? candidate : nearest
    ));
  }

  function moveTension(candidate, targetValue, harmony, startBar, rng) {
    const current = normalizedTraitValue(candidate, harmony, "tension");
    const mutable = candidate.bars.slice(startBar).flatMap((bar, offset) => (
      bar.events.filter((event) => !event.rest).map((event) => ({ event, barIndex: startBar + offset }))
    ));
    const matching = mutable.filter(({ event, barIndex }) => {
      const chordPitchClasses = new Set(chordTones(harmony, barIndex).map((pitch) => pitch % 12));
      const isChordTone = chordPitchClasses.has(event.pitch % 12);
      return current < targetValue ? isChordTone : !isChordTone;
    });
    if (!matching.length) return;
    const selected = matching[Math.floor(rng() * matching.length)];
    if (current > targetValue) {
      selected.event.pitch = nearestChordPitch(selected.event.pitch, harmony, selected.barIndex);
      return;
    }
    const chordPitchClasses = new Set(chordTones(harmony, selected.barIndex).map((pitch) => pitch % 12));
    const firstDirection = rng() < 0.5 ? -1 : 1;
    [firstDirection, -firstDirection].some((direction) => {
      const pitch = movePitchInScale(selected.event.pitch, direction, harmony);
      if (pitch === selected.event.pitch || chordPitchClasses.has(pitch % 12)) return false;
      selected.event.pitch = pitch;
      return true;
    });
  }

  function applyTraitReference(candidate, descriptor, rng, harmony, startBar) {
    const trait = descriptor?.trait;
    const targetValue = Number(descriptor?.targetValue);
    const initialValue = normalizedTraitValue(candidate, harmony, trait);
    if (!Number.isFinite(targetValue) || targetValue < 0 || targetValue > 1) {
      throw new Error(`Invalid reference target for ${trait}: ${descriptor?.targetValue}`);
    }
    const mutableStart = Math.max(0, Math.min(candidate.bars.length, Math.trunc(Number(startBar) || 0)));
    const initialDistance = Math.abs(targetValue - initialValue);
    const originalBars = candidate.bars.map(cloneBar);
    const effectPrimaryValue = Number.isFinite(descriptor.primaryValue) ? descriptor.primaryValue : initialValue;

    for (let attempt = 0; attempt < 12; attempt += 1) {
      let canRetry = true;
      if (trait === "density") moveDensity(candidate, targetValue, harmony, mutableStart, rng);
      else if (trait === "contour") canRetry = moveContour(candidate, targetValue, harmony, mutableStart);
      else if (trait === "register") moveRegister(candidate, targetValue, harmony, mutableStart);
      else if (trait === "space") moveSpace(candidate, targetValue, harmony, mutableStart, rng);
      else if (trait === "tension") moveTension(candidate, targetValue, harmony, mutableStart, rng);

      const resultValue = normalizedTraitValue(candidate, harmony, trait);
      if (Math.abs(targetValue - resultValue) < initialDistance) {
        return {
          resultValue,
          ...referenceEffect(effectPrimaryValue, targetValue, resultValue),
        };
      }
      if (!canRetry) break;
    }

    candidate.bars = originalBars.map(cloneBar);
    const resultValue = normalizedTraitValue(candidate, harmony, trait);
    return {
      resultValue,
      ...referenceEffect(effectPrimaryValue, targetValue, resultValue),
    };
  }

  function growthIntentResult(intent, newBars, context) {
    validateGrowthIntent(intent);
    const parent = context.parent;
    const harmony = context.harmony;
    const newStart = Number.isInteger(context.startBar) ? context.startBar : parent.bars.length;
    const parentTail = parent.bars.slice(-Math.min(newBars.length, parent.bars.length));
    const parentTailStart = parent.bars.length - parentTail.length;
    const rootPattern = context.rootMotif?.length
      ? repeatBars(context.rootMotif, newBars.length)
      : [];
    const rhythm = rhythmSimilarity(newBars, parentTail);
    const motif = motifSimilarity(newBars, parentTail);
    const root = rootPattern.length ? motifSimilarity(newBars, rootPattern) : 0;
    const structuralRatios = Object.fromEntries(TRAIT_KEYS.map((trait) => {
      const parentValue = normalizedTraitValue({ bars: parentTail }, harmony, trait, parentTailStart);
      const resultValue = normalizedTraitValue({ bars: newBars }, harmony, trait, newStart);
      return [trait, Math.abs(resultValue - parentValue) / TRAIT_THRESHOLDS[trait]];
    }));
    const structuralStrength = Math.min(1, Math.max(0, ...Object.values(structuralRatios)));
    const variationStrength = Math.min(1, Math.max(
      structuralRatios.density,
      structuralRatios.contour,
      structuralRatios.register,
      structuralRatios.space,
    ));
    const score = intent === "return" ? root
      : intent === "contrast" ? structuralStrength
        : intent === "vary" ? rhythm * variationStrength
          : motif;
    return {
      intent,
      score: Number(score.toFixed(6)),
      outcome: score >= 0.65 ? "strong" : score >= 0.35 ? "weak" : "missed",
    };
  }

  function lastSoundingPitch(bars, fallback) {
    for (let barIndex = bars.length - 1; barIndex >= 0; barIndex -= 1) {
      const event = bars[barIndex].events.filter((item) => !item.rest).at(-1);
      if (event) return event.pitch;
    }
    return fallback;
  }

  function randomGrowthBars(count, startBar, prefixBars, rng, harmony) {
    const bars = [];
    let previousPitch = lastSoundingPitch(prefixBars, harmony.key.tonic);
    for (let offset = 0; offset < count; offset += 1) {
      const bar = generateBar(rng, harmony, startBar + offset, previousPitch);
      bars.push(bar);
      previousPitch = lastSoundingPitch([bar], previousPitch);
    }
    return bars;
  }

  function forcePitchVariation(bars, sourceBars, harmony) {
    if (JSON.stringify(bars) !== JSON.stringify(sourceBars)) return;
    const event = bars.flatMap((bar) => bar.events).find((item) => !item.rest);
    if (event) event.pitch = movePitchInScale(event.pitch, 1, harmony);
  }

  function ensureContrast(newBars, parent, harmony, startBar, rng) {
    const parentTail = parent.bars.slice(-Math.min(newBars.length, parent.bars.length));
    const parentTailStart = parent.bars.length - parentTail.length;
    const candidate = { bars: newBars };
    const traits = ["density", "contour", "register"];
    const first = randomInt(rng, 0, traits.length - 1);
    const orderedTraits = traits.map((_, index) => traits[(first + index) % traits.length]);

    for (const trait of orderedTraits) {
      const parentValue = normalizedTraitValue({ bars: parentTail }, harmony, trait, parentTailStart);
      let resultValue = normalizedTraitValue(candidate, harmony, trait, startBar);
      if (Math.abs(resultValue - parentValue) >= TRAIT_THRESHOLDS[trait]) return trait;
      const targetValue = resultValue === parentValue
        ? (rng() < 0.5 ? 0 : 1)
        : (resultValue > parentValue ? 1 : 0);
      for (let attempt = 0; attempt < 16; attempt += 1) {
        applyTraitReference(candidate, { trait, primaryValue: resultValue, targetValue }, rng, harmony, 0);
        resultValue = normalizedTraitValue(candidate, harmony, trait, startBar);
        if (Math.abs(resultValue - parentValue) >= TRAIT_THRESHOLDS[trait]) return trait;
      }
    }

    const trait = "register";
    const parentValue = normalizedTraitValue({ bars: parentTail }, harmony, trait, parentTailStart);
    let resultValue = normalizedTraitValue(candidate, harmony, trait, startBar);
    const direction = resultValue >= parentValue ? 1 : -1;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      candidate.bars.forEach((bar) => bar.events.forEach((event) => {
        if (!event.rest) event.pitch = movePitchInScale(event.pitch, direction, harmony);
      }));
      resultValue = normalizedTraitValue(candidate, harmony, trait, startBar);
      if (Math.abs(resultValue - parentValue) >= TRAIT_THRESHOLDS[trait]) return trait;
    }
    return null;
  }

  function intentGrowthBars(intent, parent, session, nextStage, prefixBars, rng) {
    const count = nextStage.bars - parent.bars.length;
    if (intent === "contrast") {
      const newBars = randomGrowthBars(count, parent.bars.length, prefixBars, rng, session.harmony);
      return {
        bars: newBars,
        contrastTrait: ensureContrast(newBars, parent, session.harmony, parent.bars.length, rng),
      };
    }

    const source = intent === "return"
      ? (session.rootMotif?.length ? session.rootMotif : parent.bars.slice(0, 2))
      : parent.bars.slice(-Math.min(count, parent.bars.length));
    const repeated = repeatBars(source, count);
    const intensity = intent === "vary" ? 0.72 : intent === "return" ? 0.12 : 0.18;
    const bars = revoiceBars(repeated, rng, session.harmony, intensity);
    if (intent === "vary") forcePitchVariation(bars, repeated, session.harmony);
    return { bars, contrastTrait: null };
  }

  function attachGrowthIntent(candidate, parent, session, intent, startBar) {
    const result = growthIntentResult(intent, candidate.bars.slice(startBar), {
      parent,
      rootMotif: session.rootMotif?.length ? session.rootMotif : parent.bars.slice(0, 2),
      harmony: session.harmony,
      startBar,
    });
    candidate.origin.growthIntent = intent;
    candidate.origin.intentScore = result.score;
    candidate.origin.intentOutcome = result.outcome;
    return candidate;
  }

  function growWithContract(parent, session, contract, seed, mode) {
    const nextStageIndex = Math.min(session.stageIndex + 1, GROWTH_STAGES.length - 1);
    validateNextStageContract(contract, nextStageIndex);
    const nextStage = GROWTH_STAGES[nextStageIndex];
    const rng = createRng(seed);
    const prefixBars = parent.bars.map(cloneBar);
    if (session.stageIndex < GROWTH_STAGES.length - 1 && prefixBars.length) {
      prefixBars[prefixBars.length - 1] = boundaryFromContract(contract, rng, session.harmony);
    }
    const generated = mode === "random"
      ? {
        bars: randomGrowthBars(
          nextStage.bars - parent.bars.length,
          parent.bars.length,
          prefixBars,
          rng,
          session.harmony,
        ),
        contrastTrait: null,
      }
      : intentGrowthBars(contract.growthIntent, parent, session, nextStage, prefixBars, rng);
    const candidate = {
      ...parent,
      id: `grown-${randomInt(rng, 1000, 9999)}`,
      name: `${parent.name} + ${nextStage.label}`,
      bars: [...prefixBars, ...generated.bars],
      origin: {
        type: mode === "random" ? "growth-random" : "growth",
        primaryParentId: parent.id,
        donorIds: [],
        ...(generated.contrastTrait ? { contrastTrait: generated.contrastTrait } : {}),
      },
      listened: false,
      retained: false,
    };
    return attachGrowthIntent(candidate, parent, session, contract.growthIntent, parent.bars.length);
  }

  function mutateFromParent(parent, session, rng, origin) {
    const candidate = cloneCandidate(parent);
    const startBar = mutableBarStart(session.stageIndex);
    candidate.bars = candidate.bars.map((bar, index) => {
      if (index < startBar) return cloneBar(bar);
      if (index === session.stageContract?.boundaryIndex) {
        return boundaryFromContract(session.stageContract, rng, session.harmony);
      }
      return mutateBar(bar, rng, session.harmony, session.mutationRate ?? 0.28);
    });
    candidate.id = `evo-${session.stageIndex}-${session.evolutionRound + 1}-${randomInt(rng, 1000, 9999)}`;
    candidate.name = `E${session.evolutionRound + 1}-${randomInt(rng, 10, 99)}`;
    candidate.origin = origin;
    candidate.listened = false;
    candidate.retained = false;
    return candidate;
  }

  function randomInjectionFromParent(parent, session, rng) {
    const candidate = cloneCandidate(parent);
    const startBar = mutableBarStart(session.stageIndex);
    let previousPitch = startBar > 0
      ? candidate.bars[startBar - 1].events.filter((event) => !event.rest).at(-1)?.pitch ?? session.harmony.key.tonic
      : session.harmony.key.tonic;
    for (let index = startBar; index < candidate.bars.length; index += 1) {
      if (index === session.stageContract?.boundaryIndex) {
        candidate.bars[index] = boundaryFromContract(session.stageContract, rng, session.harmony);
      } else {
        candidate.bars[index] = generateBar(rng, session.harmony, index, previousPitch);
      }
      previousPitch = candidate.bars[index].events.filter((event) => !event.rest).at(-1)?.pitch ?? previousPitch;
    }
    candidate.id = `random-${session.stageIndex}-${session.evolutionRound + 1}-${randomInt(rng, 1000, 9999)}`;
    candidate.name = `R${session.evolutionRound + 1}-${randomInt(rng, 10, 99)}`;
    candidate.origin = { type: "random-injection", primaryParentId: parent.id, donorIds: [] };
    candidate.listened = false;
    candidate.retained = false;
    return candidate;
  }

  function resolveTraitReferences(session, primary, requestedReferences) {
    if (requestedReferences != null && !Array.isArray(requestedReferences)) {
      throw new Error("Trait references must be an array.");
    }
    return (requestedReferences || []).map((reference) => {
      const candidate = session.population.find((item) => item.id === reference.candidateId);
      if (!candidate) throw new Error(`Reference candidate not found: ${reference.candidateId}`);
      const descriptor = traitReferenceDescriptor(primary, candidate, reference.trait, session.harmony);
      if (!descriptor.meaningful) throw new Error(`Reference trait is too close to primary: ${reference.trait}`);
      return { candidate, descriptor };
    }).slice(0, 2);
  }

  function evolvePopulation(session, selectedIds, options = {}) {
    validateSessionStage(session);
    const selected = selectedIds.map((id) => session.population.find((candidate) => candidate.id === id)).filter(Boolean).slice(0, 3);
    if (!selected.length) throw new Error("Select at least one parent before evolving.");
    const primary = selected[0];
    const references = resolveTraitReferences(session, primary, options.references);
    const rng = createRng(options.seed ?? session.seed + session.evolutionRound * 101);
    const buckets = generationBuckets(session.populationSize);
    const population = [];
    for (let index = 0; index < buckets.mutation; index += 1) {
      population.push(mutateFromParent(primary, session, rng, {
        type: "mutation",
        primaryParentId: primary.id,
        donorIds: [],
      }));
    }
    for (let index = 0; index < buckets.donor; index += 1) {
      if (!references.length) {
        population.push(mutateFromParent(primary, session, rng, {
          type: "mutation",
          primaryParentId: primary.id,
          donorIds: [],
        }));
        continue;
      }
      const reference = references[index % references.length];
      const { descriptor } = reference;
      const child = mutateFromParent(primary, session, rng, {
        type: "trait-reference",
        primaryParentId: primary.id,
        donorIds: [],
        referenceId: reference.candidate.id,
        trait: descriptor.trait,
        primaryValue: descriptor.primaryValue,
        targetValue: descriptor.targetValue,
      });
      const effect = applyTraitReference(
        child,
        descriptor,
        rng,
        session.harmony,
        GROWTH_STAGES[session.stageIndex].mutableStart,
      );
      child.origin.resultValue = effect.resultValue;
      child.origin.progress = effect.progress;
      child.origin.outcome = effect.outcome;
      population.push(child);
    }
    while (population.length < session.populationSize) population.push(randomInjectionFromParent(primary, session, rng));
    population.forEach((candidate) => {
      assertPopulationCandidate(candidate, session.stageIndex, session.stageContract, session.harmony);
    });
    return {
      ...session,
      population,
      selectedIds: [],
      evolutionRound: session.evolutionRound + 1,
    };
  }

  function sessionSnapshot(session) {
    return {
      stageIndex: session.stageIndex,
      stageBars: session.stageBars,
      evolutionRound: session.evolutionRound,
      population: session.population.map(cloneCandidate),
      selectedIds: [...session.selectedIds],
      stageContract: cloneStageContract(session.stageContract),
      rootMotif: cloneBars(session.rootMotif),
    };
  }

  function freezeAndGrow(session, parentId, options = {}) {
    validateSessionStage(session);
    if (session.stageIndex >= GROWTH_STAGES.length - 1) return session;
    const parent = session.population.find((candidate) => candidate.id === parentId);
    if (!parent) throw new Error("Choose a retained melody before growing.");
    validateGrowthDecisions(options);
    const nextStageIndex = session.stageIndex + 1;
    const nextContract = createStageContract(parent, nextStageIndex, options);
    const rootMotif = session.rootMotif
      ? cloneBars(session.rootMotif)
      : parent.bars.slice(0, 2).map(cloneBar);
    const rng = createRng(options.seed ?? session.seed + nextStageIndex * 997);
    const references = resolveTraitReferences(session, parent, options.references);
    const buckets = generationBuckets(session.populationSize);
    const population = [];
    const baseCount = buckets.mutation + (references.length ? 0 : buckets.donor);
    for (let index = 0; index < baseCount; index += 1) {
      population.push(growWithContract(
        parent,
        session,
        nextContract,
        randomInt(rng, 1, 2147483646) + index,
        "intent",
      ));
    }
    for (let index = 0; index < buckets.donor && references.length; index += 1) {
      const reference = references[index % references.length];
      const child = growWithContract(
        parent,
        session,
        nextContract,
        randomInt(rng, 1, 2147483646) + index,
        "intent",
      );
      const effect = applyTraitReference(
        child,
        reference.descriptor,
        rng,
        session.harmony,
        GROWTH_STAGES[nextStageIndex].mutableStart,
      );
      child.origin = {
        ...child.origin,
        type: "trait-reference",
        referenceId: reference.candidate.id,
        trait: reference.descriptor.trait,
        primaryValue: reference.descriptor.primaryValue,
        targetValue: reference.descriptor.targetValue,
        resultValue: effect.resultValue,
        progress: effect.progress,
        outcome: effect.outcome,
      };
      attachGrowthIntent(child, parent, session, nextContract.growthIntent, parent.bars.length);
      population.push(child);
    }
    while (population.length < session.populationSize) {
      population.push(growWithContract(
        parent,
        session,
        nextContract,
        randomInt(rng, 1, 2147483646) + population.length,
        "random",
      ));
    }
    population.forEach((candidate) => {
      assertPopulationCandidate(candidate, nextStageIndex, nextContract, session.harmony);
    });
    return {
      ...session,
      stageIndex: nextStageIndex,
      stageBars: GROWTH_STAGES[nextStageIndex].bars,
      evolutionRound: 1,
      population,
      selectedIds: [],
      snapshots: [...session.snapshots.map(sessionSnapshot), sessionSnapshot(session)],
      stageContract: nextContract,
      rootMotif,
    };
  }

  function rollbackStage(session) {
    if (!session.snapshots.length) return session;
    const snapshot = sessionSnapshot(session.snapshots.at(-1));
    return {
      ...session,
      ...snapshot,
      snapshots: session.snapshots.slice(0, -1).map(sessionSnapshot),
    };
  }

  function previewBarRange(stageIndex) {
    const stage = GROWTH_STAGES[Math.max(0, Math.min(GROWTH_STAGES.length - 1, Number(stageIndex) || 0))];
    return {
      start: stage.boundary == null ? 0 : stage.boundary,
      end: stage.bars,
    };
  }

  return {
    GROWTH_STAGES,
    TRAIT_KEYS,
    TRAIT_THRESHOLDS,
    applyTraitReference,
    assertStageContract,
    barDuration,
    boundaryChangeCount,
    boundaryDiff,
    candidateTraits,
    cloneBar,
    cloneCandidate,
    createHarmonyCanvas,
    createInitialSession,
    createRng,
    createSeedCandidate,
    evolvePopulation,
    freezeAndGrow,
    generationBuckets,
    growthIntentResult,
    growFromParent,
    motifSimilarity,
    normalizedTraitValue,
    previewBarRange,
    referenceEffect,
    rhythmSignature,
    rollbackStage,
    traitReferenceDescriptor,
  };
});
