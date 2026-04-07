'use client'
import { useEffect } from 'react'

export default function ForceLightTheme() {
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('nsteacher-theme', 'light')
  }, [])
  return null
}
