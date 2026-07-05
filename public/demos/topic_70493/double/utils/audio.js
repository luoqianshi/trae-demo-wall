let isMuted = false

function playBgm() {}

function pauseBgm() {}

function playClick() {}

function playSuccess() {}

function playError() {}

function setMuted(muted) {
  isMuted = muted
}

function getMuted() {
  return isMuted
}

module.exports = {
  playBgm: playBgm,
  pauseBgm: pauseBgm,
  playClick: playClick,
  playSuccess: playSuccess,
  playError: playError,
  setMuted: setMuted,
  getMuted: getMuted
}