'use client'
import { motion } from 'motion/react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function CTA() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-12 shadow-2xl shadow-blue-900/20 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400 opacity-20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 relative z-10">
            Pronto para revolucionar suas aulas?
          </h2>
          <p className="text-blue-100 mb-10 max-w-2xl mx-auto text-lg relative z-10">
            Junte-se a centenas de professores que já otimizaram seu tempo com o NSteacher.
          </p>
          
          <Link 
            href="https://wa.me/5513978266892?text=Olá!%20Gostaria%20de%20contratar%20o%20plano%20NSteacher"
            target="_blank"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-blue-900 bg-emerald-400 rounded-full hover:bg-emerald-300 transition-all shadow-lg hover:shadow-emerald-400/50 hover:-translate-y-1 relative z-10"
          >
            Começar Agora - Grátis
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          
          <p className="mt-6 text-sm text-blue-200 relative z-10">
            Ao se cadastrar, você concorda com nossos <Link href="#termos" className="underline hover:text-white">Termos de Uso</Link>.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
