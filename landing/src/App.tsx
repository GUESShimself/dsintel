import { useEffect } from 'react';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Features from './components/Features';
import WhatItCatches from './components/WhatItCatches';
import InstallSection from './components/InstallSection';
import OssBand from './components/OssBand';
import Footer from './components/Footer';

export default function App() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in-view'); obs.unobserve(e.target); }
      }),
      { threshold: 0.08 }
    );
    document.querySelectorAll('.reveal').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <Nav />
      <Hero />
      <Features />
      <hr className="divider" />
      <WhatItCatches />
      <InstallSection />
      <OssBand />
      <Footer />
    </>
  );
}
