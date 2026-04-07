'use client'
import { motion } from 'motion/react'
import { Quote } from 'lucide-react'

export function Testimonial() {
  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Quote className="w-16 h-16 mx-auto text-blue-200 mb-8 rotate-180" />
          <blockquote className="text-3xl md:text-4xl font-medium text-slate-900 italic leading-tight mb-8">
            "O NSteacher transformou minha forma de lecionar. Nunca foi tão fácil organizar minhas turmas e ter previsibilidade no meu planejamento."
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
              S
            </div>
            <div className="text-left">
              <div className="font-bold text-slate-900">Professor(a) Silva</div>
              <div className="text-sm text-slate-500">Ensino Médio & Fundamental</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
