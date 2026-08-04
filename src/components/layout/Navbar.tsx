import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  dark: boolean;
  toggleTheme: () => void;
}

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/projects', label: 'Projects' },
  { to: '/blog', label: 'Blog' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar({ dark, toggleTheme }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [location]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass shadow-lg backdrop-blur-xl' : 'bg-transparent'}`}
      aria-label="Primary navigation"
    >
      <div className="w-full flex items-center justify-between h-20 px-4 sm:px-8 md:px-12 lg:px-20 xl:px-32 2xl:px-35">
        <Link
          to="/"
          className="group font-black uppercase tracking-tight transition-transform duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 dark:focus-visible:ring-primary-400 rounded-sm"
          style={{
            fontFamily: "'Clash Display', 'Sora', sans-serif",
            letterSpacing: "-0.02em",
            fontSize: "1.25rem",
          }}
        >
          <span className="text-surface-900 dark:text-white">Sujeet</span>{" "}
          <span className="text-primary-600 dark:text-primary-400 transition-colors duration-300 group-hover:text-primary-500">
            Sharma
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              aria-current={location.pathname === link.to ? 'page' : undefined}
              className={`group relative inline-flex items-center px-1 py-2 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 dark:focus-visible:ring-primary-400 rounded-sm ${location.pathname === link.to ? 'text-primary-500 dark:text-primary-400' : 'text-surface-600 dark:text-surface-400'
                }`}
            >
              <span className="relative">
                <span className="transition-colors duration-300 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                  {link.label}
                </span>
                <span
                  className={`absolute left-0 -bottom-1 h-0.5 rounded-full bg-primary-500 dark:bg-primary-400 transition-all duration-300 origin-left ${location.pathname === link.to ? 'w-full scale-x-100' : 'w-full scale-x-0 group-hover:scale-x-100'}`}
                />
              </span>
            </Link>
          ))}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 dark:focus-visible:ring-primary-400"
            aria-label="Toggle theme"
            type="button"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 dark:focus-visible:ring-primary-400"
            aria-label="Toggle theme"
            type="button"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 dark:focus-visible:ring-primary-400"
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            type="button"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-navigation"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-surface-200 dark:border-surface-700"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  aria-current={location.pathname === link.to ? 'page' : undefined}
                  className={`group relative inline-flex items-center px-1 py-2 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 dark:focus-visible:ring-primary-400 rounded-sm ${location.pathname === link.to ? 'text-primary-600 dark:text-primary-400' : 'text-surface-600 dark:text-surface-400'
                    }`}
                >
                  <span className="relative">
                    <span className="transition-colors duration-300 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                      {link.label}
                    </span>
                    <span
                      className={`absolute left-0 -bottom-1 h-0.5 rounded-full bg-primary-500 dark:bg-primary-400 transition-all duration-300 origin-left ${location.pathname === link.to ? 'w-full scale-x-100' : 'w-full scale-x-0 group-hover:scale-x-100'}`}
                    />
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
