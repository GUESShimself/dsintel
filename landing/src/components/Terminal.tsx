import { useState, useEffect, useRef, useCallback } from 'react';

type Line = { jsx: React.ReactNode; delayMs: number };

const scenarios: { label: string; lines: Line[] }[] = [
  {
    label: 'default',
    lines: [
      { jsx: <div className="t-line"><span className="t-prompt">~/tokens</span><span className="t-cmd">&nbsp;$ dsintel audit ./tokens</span></div>, delayMs: 0 },
      { jsx: <div style={{ height: 10 }} />, delayMs: 120 },
      { jsx: <div className="t-out t-info">{'  '}dsintel v0.4.0{'  '}·{'  '}Design System Intelligence</div>, delayMs: 80 },
      { jsx: <div className="t-out t-label">{'  '}Scanning <span className="t-path">./tokens</span> ...</div>, delayMs: 80 },
      { jsx: <div style={{ height: 8 }} />, delayMs: 420 },
      { jsx: <div className="t-section">{'  '}── token inventory ──</div>, delayMs: 60 },
      { jsx: <div className="t-out"><span className="t-label">{'  '}Files found{'     '}</span><span className="t-value">14</span></div>, delayMs: 80 },
      { jsx: <div className="t-out"><span className="t-label">{'  '}Total tokens{'    '}</span><span className="t-value">847</span></div>, delayMs: 80 },
      { jsx: <div className="t-out"><span className="t-label">{'  '}Format{'          '}</span><span className="t-value">W3C DTCG / Tokens Studio</span></div>, delayMs: 80 },
      { jsx: <div style={{ height: 8 }} />, delayMs: 200 },
      { jsx: <div className="t-section">{'  '}── audit results ──</div>, delayMs: 60 },
      { jsx: <div className="t-out t-warn">{'  '}⚠{'  '}Circular refs{'  '}<span className="t-count">3</span></div>, delayMs: 110 },
      { jsx: <div className="t-out t-error">{'  '}✖{'  '}Naming issues{'  '}<span className="t-count">12</span></div>, delayMs: 110 },
      { jsx: <div className="t-out t-warn">{'  '}⚠{'  '}Unused tokens{'  '}<span className="t-count">41</span></div>, delayMs: 110 },
      { jsx: <div className="t-out t-warn">{'  '}⚠{'  '}Semantic drift{'  '}<span className="t-count">7</span></div>, delayMs: 110 },
      { jsx: <div className="t-out t-success">{'  '}✔{'  '}DTCG valid{'      '}<span className="t-pass">pass</span></div>, delayMs: 110 },
      { jsx: <div style={{ height: 8 }} />, delayMs: 220 },
      { jsx: <div className="t-section">{'  '}── top issue ──</div>, delayMs: 60 },
      { jsx: <div className="t-out t-error">{'  '}color.feedback.error.bg → color.red.500</div>, delayMs: 80 },
      { jsx: <div className="t-out t-label">{'  '}&nbsp;&nbsp;→ color.semantic.danger → color.feedback.error.bg</div>, delayMs: 80 },
      { jsx: <div className="t-out t-warn">{'  '}&nbsp;&nbsp;circular reference detected</div>, delayMs: 80 },
      { jsx: <div style={{ height: 12 }} />, delayMs: 160 },
      { jsx: <div className="t-line"><span className="t-prompt">~/tokens</span><span className="t-cmd">&nbsp;$&nbsp;</span><span className="cursor" /></div>, delayMs: 80 },
    ],
  },
  {
    label: '--ci',
    lines: [
      { jsx: <div className="t-line"><span className="t-prompt">~/tokens</span><span className="t-cmd">&nbsp;$ dsintel audit ./tokens --ci</span></div>, delayMs: 0 },
      { jsx: <div style={{ height: 10 }} />, delayMs: 120 },
      { jsx: <div className="t-out t-info">{'  '}dsintel v0.4.0{'  '}·{'  '}CI mode</div>, delayMs: 80 },
      { jsx: <div className="t-out t-label">{'  '}Scanning <span className="t-path">./tokens</span> ...</div>, delayMs: 80 },
      { jsx: <div style={{ height: 8 }} />, delayMs: 520 },
      { jsx: <div className="t-out t-label">{'  '}14 files  ·  847 tokens  ·  W3C DTCG</div>, delayMs: 80 },
      { jsx: <div style={{ height: 8 }} />, delayMs: 160 },
      { jsx: <div className="t-out t-error">{'  '}✖{'  '}12 errors{'  '}·{'  '}<span className="t-warn">60 warnings</span>{'  '}·{'  '}<span className="t-success">1 pass</span></div>, delayMs: 100 },
      { jsx: <div style={{ height: 8 }} />, delayMs: 160 },
      { jsx: <div className="t-out t-label">{'  '}exit code: <span className="t-error">1</span>{'  '}(violations found)</div>, delayMs: 80 },
      { jsx: <div style={{ height: 12 }} />, delayMs: 180 },
      { jsx: <div className="t-line"><span className="t-prompt">~/tokens</span><span className="t-cmd">&nbsp;$&nbsp;</span><span className="cursor" /></div>, delayMs: 80 },
    ],
  },
  {
    label: '--json',
    lines: [
      { jsx: <div className="t-line"><span className="t-prompt">~/tokens</span><span className="t-cmd">&nbsp;$ dsintel audit ./tokens --json</span></div>, delayMs: 0 },
      { jsx: <div style={{ height: 10 }} />, delayMs: 120 },
      { jsx: <div className="t-out t-muted">{'{'}</div>, delayMs: 300 },
      { jsx: <div className="t-out t-muted">{'  '}<span className="t-flag">"version"</span>: <span className="t-value">"0.4.0"</span>,</div>, delayMs: 70 },
      { jsx: <div className="t-out t-muted">{'  '}<span className="t-flag">"summary"</span>: {'{'}</div>, delayMs: 70 },
      { jsx: <div className="t-out t-muted">{'    '}<span className="t-flag">"errors"</span>: <span className="t-error">12</span>,</div>, delayMs: 70 },
      { jsx: <div className="t-out t-muted">{'    '}<span className="t-flag">"warnings"</span>: <span className="t-warn">60</span>,</div>, delayMs: 70 },
      { jsx: <div className="t-out t-muted">{'    '}<span className="t-flag">"passed"</span>: <span className="t-success">1</span></div>, delayMs: 70 },
      { jsx: <div className="t-out t-muted">{'  '}{'}'}</div>, delayMs: 70 },
      { jsx: <div className="t-out t-muted">{'  '}<span className="t-flag">"checks"</span>: [</div>, delayMs: 70 },
      { jsx: <div className="t-out t-muted">{'    '}{'{ '}<span className="t-flag">"name"</span>: <span className="t-value">"circular_refs"</span>, <span className="t-flag">"count"</span>: <span className="t-warn">3</span>, <span className="t-flag">"severity"</span>: <span className="t-value">"warn"</span>{' }'}</div>, delayMs: 70 },
      { jsx: <div className="t-out t-muted">{'    '}{'{ '}<span className="t-flag">"name"</span>: <span className="t-value">"naming"</span>, <span className="t-flag">"count"</span>: <span className="t-error">12</span>, <span className="t-flag">"severity"</span>: <span className="t-value">"error"</span>{' }'}</div>, delayMs: 70 },
      { jsx: <div className="t-out t-muted">{'    '}{'{ '}<span className="t-flag">"name"</span>: <span className="t-value">"unused"</span>, <span className="t-flag">"count"</span>: <span className="t-warn">41</span>, <span className="t-flag">"severity"</span>: <span className="t-value">"warn"</span>{' }'}</div>, delayMs: 70 },
      { jsx: <div className="t-out t-muted">{'  '}]</div>, delayMs: 70 },
      { jsx: <div className="t-out t-muted">{'}'}</div>, delayMs: 70 },
      { jsx: <div style={{ height: 12 }} />, delayMs: 160 },
      { jsx: <div className="t-line"><span className="t-prompt">~/tokens</span><span className="t-cmd">&nbsp;$&nbsp;</span><span className="cursor" /></div>, delayMs: 80 },
    ],
  },
];

export default function Terminal() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [hasPlayed, setHasPlayed] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const startAnimation = useCallback((lines: Line[]) => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setVisibleCount(0);

    let cumulative = 0;
    lines.forEach((line, i) => {
      cumulative += line.delayMs;
      const t = setTimeout(() => setVisibleCount(i + 1), cumulative);
      timeoutsRef.current.push(t);
    });

    setHasPlayed(true);
  }, []);

  // Trigger on scroll-into-view (once)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startAnimation(scenarios[0].lines);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [startAnimation]);

  // Re-run on scenario change (skip initial mount — handled by IntersectionObserver)
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    startAnimation(scenarios[scenarioIdx].lines);
  }, [scenarioIdx, startAnimation]);

  // Cleanup on unmount
  useEffect(() => () => timeoutsRef.current.forEach(clearTimeout), []);

  const lines = scenarios[scenarioIdx].lines;

  return (
    <div className="terminal fade-in delay-3" ref={containerRef}>
      <div className="terminal-bar">
        <div className="terminal-bar-left">
          <div className="dot dot-r" />
          <div className="dot dot-y" />
          <div className="dot dot-g" />
        </div>
        <div className="terminal-title">dsintel audit</div>
        <div className="terminal-bar-right">
          {scenarios.map((s, i) => (
            <button
              key={s.label}
              className={`terminal-tab${i === scenarioIdx ? ' active' : ''}`}
              onClick={() => { if (i !== scenarioIdx) setScenarioIdx(i); else startAnimation(lines); }}
              aria-label={`Show ${s.label} scenario`}
            >
              {s.label}
            </button>
          ))}
          {hasPlayed && (
            <button
              className="terminal-replay"
              onClick={() => startAnimation(lines)}
              aria-label="Replay animation"
              title="Replay"
            >
              ↺
            </button>
          )}
        </div>
      </div>
      <div className="terminal-body">
        {lines.map((line, i) => (
          <div key={i} className={i >= visibleCount ? 't-hidden' : ''}>
            {line.jsx}
          </div>
        ))}
      </div>
    </div>
  );
}
