import { Header } from '@/components/landing/header'
import { Hero } from '@/components/landing/hero'
import { Features } from '@/components/landing/features'
import { InteractiveDemo } from '@/components/landing/interactive-demo'
import { HowItWorks } from '@/components/landing/how-it-works'
import { Testimonial } from '@/components/landing/testimonial'
import { CTA } from '@/components/landing/cta'
import { Footer } from '@/components/landing/footer'
import ForceLightTheme from '@/components/ForceLightTheme'

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100">
      <ForceLightTheme />
      <Header />
      <main>
        <Hero />
        <Features />
        <InteractiveDemo />
        <HowItWorks />
        <Testimonial />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
