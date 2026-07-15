(function () {
  function initBackground() {
    if (document.querySelector('.bamboo-decoration')) return

    const bamboo = document.createElement('div')
    bamboo.className = 'bamboo-decoration'
    document.body.insertBefore(bamboo, document.body.firstChild)

    if (!document.querySelector('.cloud')) {
      const cloud = document.createElement('div')
      cloud.className = 'cloud'
      const cloud3 = document.createElement('div')
      cloud3.className = 'cloud-3'
      cloud.appendChild(cloud3)
      document.body.insertBefore(cloud, document.body.firstChild)
    }

    if (!document.querySelector('.mountain')) {
      const mountain = document.createElement('div')
      mountain.className = 'mountain'
      const m3 = document.createElement('div')
      m3.className = 'mountain-3'
      mountain.appendChild(m3)
      document.body.appendChild(mountain)
    }

    if (window.Particles && typeof window.Particles.init === 'function') {
      window.Particles.init({
        maxParticles: 12,
        spawnInterval: 3000,
        petalRatio: 0.7,
        minDuration: 10,
        maxDuration: 18,
        minSize: 6,
        maxSize: 12
      })
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBackground)
  } else {
    initBackground()
  }
})()
