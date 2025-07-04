"use client";

import { Button } from "~/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-green-200 bg-white/80 backdrop-blur-sm">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src="/icon.svg"
            alt="FarmSimulation Logo"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="text-xl font-bold text-green-800">FarmSimulation</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:space-x-8">
          <Link
            href="#features"
            className="text-green-700 transition-colors hover:text-green-900"
          >
            Features
          </Link>
          <Link
            href="#about"
            className="text-green-700 transition-colors hover:text-green-900"
          >
            About
          </Link>
          <Link href="/farm">
            <Button className="pointer-events-auto cursor-none bg-green-600 text-white hover:bg-green-700">
              Get Started
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <X className="h-6 w-6 text-green-800" />
          ) : (
            <Menu className="h-6 w-6 text-green-800" />
          )}
        </button>

        {/* Mobile Navigation */}
        <div
          className={`absolute left-0 right-0 top-16 z-50 bg-white/95 backdrop-blur-sm transition-all duration-300 md:hidden ${
            isMenuOpen
              ? "translate-y-0 opacity-100"
              : "-translate-y-full opacity-0"
          }`}
        >
          <div className="container mx-auto flex flex-col space-y-4 px-4 py-6">
            <Link
              href="#features"
              className="text-green-700 transition-colors hover:text-green-900"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#about"
              className="text-green-700 transition-colors hover:text-green-900"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link href="/farm" onClick={() => setIsMenuOpen(false)}>
              <Button className="pointer-events-auto cursor-none bg-green-600 text-white hover:bg-green-700">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
