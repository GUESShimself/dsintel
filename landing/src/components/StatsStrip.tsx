import { useState, useEffect, useRef } from 'react';

type Stat = { display: string; label: string; countTo?: number; prefix?: string };

const stats: Stat[] = [
  { display: '6',   label: 'audit checks',            countTo: 6 },
  { display: 'v3',  label: 'Tokens Studio support',   countTo: 3, prefix: 'v' },
  { display: 'W3C', label: 'DTCG spec aligned' },
  { display: '0',   label: 'configuration required' },
];

function AnimatedNumber({ display, countTo, prefix = '' }: { display: string; countTo?: number; prefix?: string }) {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (countTo === undefined || countTo === 0) return;
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          obs.disconnect();
          const steps = countTo;
          const interval = Math.max(40, Math.round(400 / steps));
          let current = 0;
          const timer = setInterval(() => {
            current += 1;
            setCount(current);
            if (current >= steps) { clearInterval(timer); setDone(true); }
          }, interval);
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [countTo]);

  if (countTo === undefined || countTo === 0) {
    return <div ref={ref} className="stat-number">{display}</div>;
  }

  return (
    <div ref={ref} className="stat-number">
      {done ? display : `${prefix}${count}`}
    </div>
  );
}

export default function StatsStrip() {
  return (
    <div className="stats-strip reveal">
      <div className="container">
        <div className="stats-inner">
          {stats.map((s) => (
            <div className="stat-item" key={s.label}>
              <AnimatedNumber display={s.display} countTo={s.countTo} prefix={s.prefix} />
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
