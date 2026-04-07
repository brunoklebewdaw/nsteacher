'use client'
import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white -z-10" />
      
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-40 w-72 h-72 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-6"
        >
          Organização Pedagógica <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            Simplificada
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-4 text-xl text-slate-600 max-w-2xl mx-auto mb-10"
        >
          Organize suas aulas, acompanhe notas e melhore o desempenho dos seus alunos com a plataforma definitiva para educadores.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row justify-center gap-4"
        >
          <a 
            href="https://wa.me/5513978266892?text=Olá!%20Gostaria%20de%20contratar%20o%20plano%20NSteacher"
            target="_blank"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white bg-emerald-500 rounded-full hover:bg-emerald-600 transition-all shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-1"
          >
            Começar Agora - Grátis
            <ArrowRight className="ml-2 w-5 h-5" />
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-16 relative mx-auto max-w-5xl"
        >
          <div className="relative rounded-2xl bg-slate-900/5 p-2 backdrop-blur-sm ring-1 ring-inset ring-slate-900/10 lg:rounded-3xl lg:p-4">
            <div className="overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-900/10 flex items-center justify-center aspect-[16/9] bg-gradient-to-br from-slate-50 to-slate-100 relative group">
              <div className="absolute inset-0 p-8 flex flex-col gap-6 opacity-80 group-hover:opacity-100 transition-opacity">
                <div className="h-8 w-1/3 bg-slate-200 rounded-md animate-pulse" />
                <div className="flex gap-6 h-32">
                  <div className="flex-1 bg-blue-100 rounded-xl border border-blue-200/50 shadow-sm" />
                  <div className="flex-1 bg-purple-100 rounded-xl border border-purple-200/50 shadow-sm" />
                  <div className="flex-1 bg-emerald-100 rounded-xl border border-emerald-200/50 shadow-sm" />
                </div>
                <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex p-6 gap-6">
                  <div className="w-2/3 flex flex-col gap-4">
                    <div className="h-4 w-1/4 bg-slate-200 rounded" />
                    <div className="flex-1 bg-slate-50 rounded border border-slate-100" />
                  </div>
                  <div className="w-1/3 flex flex-col gap-4">
                    <div className="h-4 w-1/2 bg-slate-200 rounded" />
                    <div className="h-12 bg-slate-50 rounded border border-slate-100" />
                    <div className="h-12 bg-slate-50 rounded border border-slate-100" />
                    <div className="h-12 bg-slate-50 rounded border border-slate-100" />
                  </div>
                </div>
              </div>
              
              <motion.div 
                animate={{ y: [-10, 10, -10] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute -right-12 top-1/4 w-24 h-24 bg-blue-500 rounded-2xl shadow-2xl shadow-blue-500/20 rotate-12 backdrop-blur-xl bg-opacity-80 border border-white/20 flex items-center justify-center"
              >
                <div className="w-12 h-12 bg-white/20 rounded-full" />
              </motion.div>
              <motion.div 
                animate={{ y: [10, -10, 10] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="absolute -left-8 bottom-1/4 w-20 h-20 bg-purple-500 rounded-full shadow-2xl shadow-purple-500/20 -rotate-12 backdrop-blur-xl bg-opacity-80 border border-white/20 flex items-center justify-center"
              >
                <div className="w-8 h-8 bg-white/20 rounded-lg rotate-45" />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
