import Terminal from './Terminal';

const GithubIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M6.5 0C2.91 0 0 2.98 0 6.66c0 2.94 1.87 5.44 4.47 6.32.33.06.45-.14.45-.32v-1.12c-1.82.4-2.2-.9-2.2-.9-.3-.78-.74-1-.74-1-.6-.42.04-.41.04-.41.67.05 1.02.7 1.02.7.59 1.03 1.55.73 1.93.56.06-.43.23-.73.42-.9-1.46-.17-3-.74-3-3.3 0-.73.25-1.33.67-1.8-.07-.17-.29-.85.06-1.77 0 0 .55-.18 1.8.68a6.14 6.14 0 013.28 0c1.25-.86 1.8-.68 1.8-.68.35.92.13 1.6.06 1.77.42.47.67 1.07.67 1.8 0 2.57-1.55 3.13-3.02 3.29.24.21.45.62.45 1.25v1.85c0 .18.12.39.45.32A6.67 6.67 0 0013 6.66C13 2.98 10.09 0 6.5 0z" fill="currentColor" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M6.5 1v8M3 6l3.5 3.5L10 6M1 11.5h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Hero() {
  return (
    <section className="hero">
      <div className="bg-grid"></div>
      <div className="hero-glow"></div>
      <div className="container">
        <div className="hero-grid">
          <div>
            <div className="version-tag fade-in">
              <span className="v-dot"></span>
              v0.4.0 &nbsp;·&nbsp; open source
            </div>
            <div className="hero-eyebrow fade-in delay-1">Design System Intelligence</div>
            <h1 className="hero-title fade-in delay-2">
              Audit your<br />
              design tokens.<br />
              <em>Find what's broken.</em>
            </h1>
            <p className="hero-sub fade-in delay-3">
              A CLI tool for design system practitioners. Surface circular references, naming drift, unused tokens, and structural debt—before it ships.
            </p>
            <div className="hero-actions fade-in delay-4">
              <a href="#install" className="btn-primary">
                <DownloadIcon />
                Install now
              </a>
              <a href="https://github.com/guesshimself/dsintel" className="btn-secondary">
                <GithubIcon />
                View on GitHub
              </a>
            </div>
            <div className="install-snippet fade-in delay-5">
              <code>$ npm install -g dsintel</code>
            </div>
          </div>
          <Terminal />
        </div>
      </div>
    </section>
  );
}
