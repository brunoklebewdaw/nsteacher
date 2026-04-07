'use client'

import { Suspense } from 'react'
import { ThemeProvider } from '@/lib/theme-provider'
import AdminKeysPageInner from './AdminKeysPageInner'

function KeysPageWithTheme() {
  return (
    <ThemeProvider>
      <AdminKeysPageInner />
    </ThemeProvider>
  )
}

export default function AdminKeysPage() {
  return (
    <Suspense fallback={<div className="p-8">Carregando...</div>}>
      <KeysPageWithTheme />
    </Suspense>
  )
}
