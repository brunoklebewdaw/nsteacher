'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { LayoutDashboard, CalendarDays, UsersRound } from 'lucide-react'

const features = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    content: (
      <div className="flex flex-col gap-4 w-full h-full p-6 bg-slate-50 rounded-xl border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 w-32 bg-slate-200 rounded-md" />
          <div className="h-8 w-24 bg-blue-100 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="h-24 bg-white rounded-lg border border-slate-100 shadow-sm p-4 flex flex-col justify-between">
            <div className="h-4 w-16 bg-slate-100 rounded" />
            <div className="h-8 w-12 bg-emerald-100 rounded" />
          </div>
          <div className="h-24 bg-white rounded-lg border border-slate-100 shadow-sm p-4 flex flex-col justify-between">
            <div className="h-4 w-16 bg-slate-100 rounded" />
            <div className="h-8 w-12 bg-blue-100 rounded" />
          </div>
          <div className="h-24 bg-white rounded-lg border border-slate-100 shadow-sm p-4 flex flex-col justify-between">
            <div className="h-4 w-16 bg-slate-100 rounded" />
            <div className="h-8 w-12 bg-purple-100 rounded" />
          </div>
        </div>
        <div className="flex-1 bg-white rounded-lg border border-slate-100 shadow-sm p-4 flex items-end gap-2">
          {[40, 70, 45, 90, 65, 85, 55].map((h, i) => (
            <motion.div 
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex-1 bg-blue-500 rounded-t-md opacity-80" 
            />
          ))}
        </div>
      </div>
    )
  },
  {
    id: 'aulas',
    title: 'Aulas Planejadas',
    icon: CalendarDays,
    content: (
      <div className="flex flex-col gap-4 w-full h-full p-6 bg-slate-50 rounded-xl border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 w-40 bg-slate-200 rounded-md" />
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-slate-200 rounded-md" />
            <div className="h-8 w-8 bg-slate-200 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-5 gap-2 flex-1">
          {[1, 2, 3, 4, 5].map((day) => (
            <div key={day} className="flex flex-col gap-2">
              <div className="h-6 bg-slate-200 rounded-md w-full mb-2" />
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: day * 0.1 }}
                className="h-20 bg-purple-100 border border-purple-200 rounded-md p-2"
              >
                <div className="h-3 w-3/4 bg-purple-300 rounded mb-2" />
                <div className="h-2 w-1/2 bg-purple-200 rounded" />
              </motion.div>
              {day % 2 === 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: day * 0.1 + 0.2 }}
                  className="h-24 bg-blue-100 border border-blue-200 rounded-md p-2"
                >
                  <div className="h-3 w-full bg-blue-300 rounded mb-2" />
                  <div className="h-2 w-2/3 bg-blue-200 rounded" />
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: 'alunos',
    title: 'Alunos Gerenciados',
    icon: UsersRound,
    content: (
      <div className="flex flex-col gap-4 w-full h-full p-6 bg-slate-50 rounded-xl border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <div className="h-8 w-64 bg-white border border-slate-200 rounded-full px-4 flex items-center">
            <div className="h-3 w-24 bg-slate-200 rounded" />
          </div>
          <div className="h-8 w-24 bg-emerald-500 rounded-md" />
        </div>
        <div className="flex flex-col gap-3 flex-1 overflow-hidden">
          {[1, 2, 3, 4].map((student) => (
            <motion.div 
              key={student}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: student * 0.1 }}
              className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-200 to-blue-200" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-slate-700 rounded mb-2" />
                <div className="h-3 w-20 bg-slate-300 rounded" />
              </div>
              <div className="flex gap-2">
                <div className="h-6 w-12 bg-emerald-100 rounded-full" />
                <div className="h-6 w-12 bg-blue-100 rounded-full" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }
]

export function InteractiveDemo() {
  const [activeTab, setActiveTab] = useState(features[0].id)

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Veja o NSteacher em Ação</h2>
          <p className="mt-4 text-lg text-slate-600">Explore as principais funcionalidades da plataforma.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="w-full lg:w-1/3 flex flex-col gap-4">
            {features.map((feature) => {
              const isActive = activeTab === feature.id
              return (
                <button
                  key={feature.id}
                  onClick={() => setActiveTab(feature.id)}
                  className={`flex items-center gap-4 p-6 rounded-2xl text-left transition-all duration-300 ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 scale-105' 
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:scale-105'
                  }`}
                >
                  <feature.icon className={`w-8 h-8 ${isActive ? 'text-white' : 'text-blue-600'}`} />
                  <span className="text-xl font-bold">{feature.title}</span>
                </button>
              )
            })}
          </div>

          <div className="w-full lg:w-2/3 h-[400px] relative" style={{ perspective: '1000px' }}>
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-purple-50 rounded-3xl transform rotate-1 scale-105 opacity-50" />
            <div className="absolute inset-0 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full"
                >
                  {features.find(f => f.id === activeTab)?.content}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
