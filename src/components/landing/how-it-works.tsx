'use client'
import { motion } from 'motion/react'
import { UserPlus, Calendar, Users, LineChart } from 'lucide-react'

const steps = [
  {
    id: 1,
    title: 'Cadastro Rápido',
    description: 'Crie sua conta em segundos e configure suas turmas e disciplinas.',
    icon: UserPlus,
  },
  {
    id: 2,
    title: 'Planeje suas Aulas',
    description: 'Utilize nossa IA e templates para estruturar seu semestre rapidamente.',
    icon: Calendar,
  },
  {
    id: 3,
    title: 'Acompanhe os Alunos',
    description: 'Registre presenças, notas e observações em um diário de classe digital.',
    icon: Users,
  },
  {
    id: 4,
    title: 'Analise o Desempenho',
    description: 'Visualize gráficos e relatórios para focar em quem mais precisa.',
    icon: LineChart,
  },
]

export function HowItWorks() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Como Funciona</h2>
          <p className="mt-4 text-lg text-slate-600">Quatro passos simples para transformar sua rotina escolar.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          <div className="hidden lg:block absolute top-12 left-0 w-full h-0.5 bg-slate-200 -z-10" />
          
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative flex flex-col items-center text-center"
            >
              <div className="w-24 h-24 bg-white rounded-full border-4 border-slate-50 flex items-center justify-center shadow-xl shadow-slate-200/50 mb-6 relative z-10">
                <step.icon className="w-10 h-10 text-blue-600" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-400 rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow-sm">
                  {step.id}
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-slate-600">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
