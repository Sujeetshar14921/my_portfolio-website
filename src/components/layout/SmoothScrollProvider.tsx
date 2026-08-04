import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Lenis from 'lenis';
import { useLocation } from 'react-router-dom';

type ScrollTarget = string | HTMLElement | null | undefined;

interface SmoothScrollContextValue {
  scrollToTop: (immediate?: boolean) => void;
  scrollToSection: (target: ScrollTarget, options?: { offset?: number; immediate?: boolean }) => void;
  lenis: Lenis | null;
}

const SmoothScrollContext = createContext<SmoothScrollContextValue | null>(null);

function getReducedMotionPreference() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function resolveElement(target: ScrollTarget) {
  if (!target) return null;
  if (typeof target === 'string') {
    const normalized = target.startsWith('#') ? target.slice(1) : target;
    return document.getElementById(normalized);
  }
  return target;
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const lenisRef = useRef<Lenis | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(() => getReducedMotionPreference());

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const scrollToSection = useCallback<SmoothScrollContextValue['scrollToSection']>((target, options = {}) => {
    const element = resolveElement(target);
    const offset = options.offset ?? 88;

    if (!element) return;

    if (!lenisRef.current || reducedMotion) {
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(top, 0), behavior: 'auto' });
      return;
    }

    lenisRef.current.scrollTo(element, {
      offset: -offset,
      immediate: options.immediate ?? false,
      lock: false,
    });
  }, [reducedMotion]);

  const scrollToTop = useCallback((immediate = false) => {
    if (!lenisRef.current || reducedMotion) {
      window.scrollTo({ top: 0, behavior: immediate ? 'auto' : 'smooth' });
      return;
    }

    lenisRef.current.scrollTo(0, {
      immediate,
      lock: false,
    });
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;

    const lenis = new Lenis({
      duration: 1.1,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.6,
      smoothWheel: true,
      syncTouch: true,
      syncTouchLerp: 0.08,
      overscroll: false,
    });

    lenisRef.current = lenis;

    const raf = (time: number) => {
      lenis.raf(time);
      rafIdRef.current = window.requestAnimationFrame(raf);
    };

    rafIdRef.current = window.requestAnimationFrame(raf);

    return () => {
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
      }
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;

    const hash = location.hash;
    if (!hash) {
      scrollToTop(true);
      return;
    }

    const target = document.getElementById(hash.slice(1));
    if (!target) return;

    const id = window.requestAnimationFrame(() => {
      scrollToSection(target, { immediate: false });
    });

    return () => window.cancelAnimationFrame(id);
  }, [location.pathname, location.hash, reducedMotion, scrollToSection, scrollToTop]);

  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;

      const element = resolveElement(href);
      if (!element) return;

      event.preventDefault();
      const nextHash = href.startsWith('#') ? href : `#${href}`;
      window.history.pushState(null, '', `${window.location.pathname}${window.location.search}${nextHash}`);
      scrollToSection(element);
    };

    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, [scrollToSection]);

  const value = useMemo<SmoothScrollContextValue>(() => ({
    scrollToTop,
    scrollToSection,
    lenis: lenisRef.current,
  }), [scrollToSection, scrollToTop]);

  return (
    <SmoothScrollContext.Provider value={value}>
      {children}
    </SmoothScrollContext.Provider>
  );
}

export function useSmoothScroll() {
  const context = useContext(SmoothScrollContext);

  if (!context) {
    throw new Error('useSmoothScroll must be used within a SmoothScrollProvider');
  }

  return context;
}