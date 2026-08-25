"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ThemeToggle } from "../ThemeToggle";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-surface/80 backdrop-blur-md border-b border-[rgba(148,163,184,0.1)] py-4 shadow-lg shadow-black/20"
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <a
            href="#"
            className="flex items-center gap-2.5 group focus:outline-none"
            aria-label="MessMate Home"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 group-hover:border-primary/40 transition-colors duration-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5.5 h-5.5 text-primary"
              >
                <path d="M12 2v20" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground font-heading">
              Mess<span className="text-primary">Mate</span>
            </span>
          </a>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/#features"
              className="text-[15px] font-medium text-foreground-muted hover:text-foreground transition-colors duration-200"
            >
              Features
            </Link>
            <Link
              href="/#how-it-works"
              className="text-[15px] font-medium text-foreground-muted hover:text-foreground transition-colors duration-200"
            >
              How It Works
            </Link>
            <Link
              href="/#pricing"
              className="text-[15px] font-medium text-foreground-muted hover:text-foreground transition-colors duration-200"
            >
              Pricing
            </Link>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/signin"
              className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold rounded-lg text-foreground hover:text-primary transition-colors duration-200"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg text-background bg-primary hover:bg-primary-hover active:scale-[0.98] transition-all duration-200 cursor-pointer"
            >
              Get Started
            </Link>
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-raised focus:outline-none transition-colors cursor-pointer"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </nav>
      </div>

      {/* Mobile Drawer */}
      <div
        className={`md:hidden fixed inset-x-0 top-18.25 bottom-0 z-40 bg-background/95 backdrop-blur-lg border-t border-[rgba(148,163,184,0.1)] transition-all duration-300 ease-in-out ${
          isMobileMenuOpen
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col p-6 space-y-6">
          <a
            href="#features"
            className="text-lg font-medium text-foreground-muted hover:text-foreground border-b border-[rgba(148,163,184,0.05)] pb-4 transition-colors duration-200"
            onClick={(e) => {
              e.preventDefault();
              setIsMobileMenuOpen(false);
            }}
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-lg font-medium text-foreground-muted hover:text-foreground border-b border-[rgba(148,163,184,0.05)] pb-4 transition-colors duration-200"
            onClick={(e) => {
              e.preventDefault();
              setIsMobileMenuOpen(false);
            }}
          >
            How It Works
          </a>
          <a
            href="#pricing"
            className="text-lg font-medium text-foreground-muted hover:text-foreground border-b border-[rgba(148,163,184,0.05)] pb-4 transition-colors duration-200"
            onClick={(e) => {
              e.preventDefault();
              setIsMobileMenuOpen(false);
            }}
          >
            Pricing
          </a>
          <div className="flex flex-col gap-3 pt-2">
            <a
              href="/signin"
              className="flex items-center justify-center w-full py-3 text-base font-semibold rounded-lg text-foreground border border-foreground-muted/20 hover:border-foreground-muted/40 transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Sign in
            </a>
            <a
              href="/signup"
              className="flex items-center justify-center w-full py-3 text-base font-semibold rounded-lg text-background bg-primary hover:bg-primary-hover active:scale-[0.98] transition-all duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Sign up
            </a>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
