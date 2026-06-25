import { createElement, Fragment } from "react";

export function splitDiffSegments(previousText, nextText) {
  const before = String(previousText || "");
  const after = String(nextText || "");
  if (!before || !after || before === after) {
    return {
      prefix: "",
      removed: before === after ? "" : before,
      added: before === after ? "" : after,
      suffix: before === after ? after : "",
    };
  }

  let start = 0;
  while (start < before.length && start < after.length && before[start] === after[start]) {
    start += 1;
  }

  let beforeEnd = before.length - 1;
  let afterEnd = after.length - 1;
  while (beforeEnd >= start && afterEnd >= start && before[beforeEnd] === after[afterEnd]) {
    beforeEnd -= 1;
    afterEnd -= 1;
  }

  return {
    prefix: after.slice(0, start),
    removed: before.slice(start, beforeEnd + 1),
    added: after.slice(start, afterEnd + 1),
    suffix: after.slice(afterEnd + 1),
  };
}

export function renderFinalDiff(draftText, finalText) {
  if (!finalText) {
    return draftText || "";
  }

  const diff = splitDiffSegments(draftText, finalText);
  if (!diff.added && !diff.removed) {
    return finalText;
  }

  return createElement(
    Fragment,
    null,
    diff.prefix,
    diff.added ? createElement("mark", { className: "diff-add" }, diff.added) : null,
    diff.suffix
  );
}
