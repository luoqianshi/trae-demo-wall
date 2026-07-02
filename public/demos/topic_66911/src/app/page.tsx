import dynamic from 'next/dynamic'
import LandingNav from '../components/landing/LandingNav'
import HeroSection from '../components/landing/HeroSection'
import FeaturesSection from '../components/landing/FeaturesSection'

/* 折叠区域懒加载 — 减少首屏 JS 体积 */
const WorkflowSection = dynamic(() => import('../components/landing/WorkflowSection'))
const ShowcaseSection = dynamic(() => import('../components/landing/ShowcaseSection'))
const TestimonialsSection = dynamic(() => import('../components/landing/TestimonialsSection'))
const FAQSection = dynamic(() => import('../components/landing/FAQSection'))
const CTASection = dynamic(() => import('../components/landing/CTASection'))
const Footer = dynamic(() => import('../components/landing/Footer'))

export default function HomePage() {
  return (
    <>
      <LandingNav />
      <main>
        <HeroSection />
        <FeaturesSection />
        <WorkflowSection />
        <ShowcaseSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
