import Link from 'next/link'
import React from 'react'
import DesktopNavbar from './DesktopNavbar'

export const NavBar = () => {
  return (
    <nav className="sticky top-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-3xl font-bold text-primary font-mono tracking-wider"
            >
              Socially
            </Link>
          </div>

          <DesktopNavbar />
        </div>
      </div>
    </nav>
  )
}
