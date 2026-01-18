'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, LogIn } from 'lucide-react'

const LINKS = [
  { href: '/login?type=client&redirect=/account', label: 'Client Login' },
  { href: '/login?type=stylist&redirect=/stylist', label: 'Stylist Login' },
  { href: '/login?type=admin&redirect=/admin', label: 'Admin Login' },
]

export function PublicAuthLinks({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!ref.current) return
      if (!ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-amber-400 transition-colors"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <LogIn className="w-4 h-4" />
        Login
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          className="absolute right-0 mt-3 w-48 rounded-xl border border-white/10 bg-zinc-950/95 backdrop-blur shadow-xl overflow-hidden z-50"
          role="menu"
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-4 py-2 text-sm text-white/80 hover:text-amber-300 hover:bg-white/5 transition-colors"
              role="menuitem"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
