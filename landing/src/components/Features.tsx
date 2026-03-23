// Thin-stroke SVG icons, 14×14, 1.4px stroke, round caps/joins — consistent with button icons
const IconCircularRef = () => (
  <svg width="18" height="18" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M7 2a5 5 0 1 1-3.536 8.536" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M3 8.5 3.464 10.5l2-.464" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconNaming = () => (
  <svg width="18" height="18" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <rect x="1.5" y="3.5" width="11" height="7" rx="1" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M4 7h6M4 7l2-2M4 7l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconUnused = () => (
  <svg width="18" height="18" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M4.5 4.5l5 5M9.5 4.5l-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const IconSemanticDrift = () => (
  <svg width="18" height="18" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2 4h4l3 6h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 10h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M10 4h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const IconTokensStudio = () => (
  <svg width="18" height="18" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <rect x="2" y="2" width="10" height="3" rx="0.75" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="2" y="5.5" width="10" height="3" rx="0.75" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="2" y="9" width="10" height="3" rx="0.75" stroke="currentColor" strokeWidth="1.4"/>
  </svg>
);

const IconReport = () => (
  <svg width="18" height="18" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <rect x="2.5" y="1.5" width="9" height="11" rx="1" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M5 5h4M5 7.5h4M5 10h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const checks = [
  {
    icon: <IconCircularRef />,
    name: 'Circular reference detection',
    desc: 'Finds tokens that reference themselves through a chain of aliases. The silent killer of token resolution.',
  },
  {
    icon: <IconNaming />,
    name: 'DTCG naming validation',
    desc: 'Validates token names against the W3C Design Token Community Group spec — including $type, $value, and $description fields.',
  },
  {
    icon: <IconUnused />,
    name: 'Unused token flagging',
    desc: 'Identifies tokens that are defined but never referenced. Dead weight that inflates your token surface area.',
  },
  {
    icon: <IconSemanticDrift />,
    name: 'Semantic drift detection',
    desc: 'Surfaces tokens whose names imply one purpose but whose resolved values suggest another. Design intent vs. reality.',
  },
  {
    icon: <IconTokensStudio />,
    name: 'Tokens Studio format support',
    desc: 'Native parsing of Tokens Studio JSON output, including sets, themes, and the $extensions namespace.',
  },
  {
    icon: <IconReport />,
    name: 'Configurable report output',
    desc: 'Emit results as human-readable CLI output, JSON, or CI-ready exit codes. Fits into any workflow.',
  },
];

export default function Features() {
  return (
    <section className="section reveal" id="features">
      <div className="container">
        <div className="section-label">What it does</div>
        <h2 className="section-heading">
          Six checks. <em>Zero noise.</em>
        </h2>
        <p className="section-body">
          dsintel runs a structured audit against your token files and surfaces exactly what's wrong — not a wall of warnings, but a prioritized signal you can act on.
        </p>
        <div className="check-grid">
          {checks.map((c) => (
            <div className="check-item" key={c.name}>
              <div className="check-icon">{c.icon}</div>
              <div className="check-name">{c.name}</div>
              <div className="check-desc">{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
