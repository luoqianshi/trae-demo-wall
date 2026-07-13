<template>
  <div class="app">
    <HeroSection />
    <IntroSection />
    <PainPointsSection />
    <ValueSection />
    <FooterSection />
  </div>
</template>

<script setup>
import HeroSection from '../components/HeroSection.vue'
import IntroSection from '../components/IntroSection.vue'
import PainPointsSection from '../components/PainPointsSection.vue'
import ValueSection from '../components/ValueSection.vue'
import FooterSection from '../components/FooterSection.vue'
</script>

<style>
/* No extra global styles needed — global.css handles everything */
</style>
