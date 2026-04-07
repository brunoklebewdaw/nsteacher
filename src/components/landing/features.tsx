'use client'
import { motion } from 'motion/react'
import { BarChart3, Calendar, Users, FileText, FolderOpen, Sparkles } from 'lucide-react'

const features = [
  {
    title: 'Dashboard Completo',
    description: 'Visão geral do desempenho das turmas, frequência e próximas atividades em um só lugar.',
    icon: BarChart3,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    title: 'Aulas Planejadas',
    description: 'Crie, organize e reutilize planos de aula com facilidade. Sincronize com seu calendário.',
    icon: Calendar,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    title: 'Alunos Gerenciados',
    description: 'Acompanhe o progresso individual, histórico de notas e observações comportamentais.',
    icon: Users,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
  {
    title: 'Provas Online',
    description: 'Crie avaliações interativas, corrija automaticamente e exporte os resultados.',
    icon: FileText,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  {
    title: 'Materiais Centralizados',
    description: 'Armazene PDFs, slides e links. Compartilhe com os alunos com um único clique.',
    icon: FolderOpen,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
  {
    title: 'IA Auxiliar',
    description: 'Gere ideias para aulas, questões para provas e resumos utilizando inteligência artificial.',
    icon: Sparkles,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
  },
]

export function Features() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Tudo que você precisa para lecionar melhor</h2>
          <p className="mt-4 text-lg text-slate-600">Ferramentas poderosas desenhadas especificamente para a rotina do professor.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all group cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-slate-50 to-slate-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-in-out" />
              
              <div className={`w-14 h-14 rounded-xl ${feature.bgColor} flex items-center justify-center mb-6 relative z-10 group-hover:-translate-y-1 transition-transform`}>
                <feature.icon className={`w-7 h-7 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 relative z-10">{feature.title}</h3>
              <p className="text-slate-600 relative z-10">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
