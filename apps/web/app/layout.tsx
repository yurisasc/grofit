import './globals.css'
import React from 'react'

export const metadata = {
  title: 'Grofit Dashboard',
  description: 'Warframe trading manager',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-neutral-100">
        <div className="max-w-6xl mx-auto p-6">{children}</div>
      </body>
    </html>
  )
}
