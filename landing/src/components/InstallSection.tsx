import CodeBlock from './CodeBlock';

const GithubIcon = () => (
  <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
    <path d="M6.5 0C2.91 0 0 2.98 0 6.66c0 2.94 1.87 5.44 4.47 6.32.33.06.45-.14.45-.32v-1.12c-1.82.4-2.2-.9-2.2-.9-.3-.78-.74-1-.74-1-.6-.42.04-.41.04-.41.67.05 1.02.7 1.02.7.59 1.03 1.55.73 1.93.56.06-.43.23-.73.42-.9-1.46-.17-3-.74-3-3.3 0-.73.25-1.33.67-1.8-.07-.17-.29-.85.06-1.77 0 0 .55-.18 1.8.68a6.14 6.14 0 013.28 0c1.25-.86 1.8-.68 1.8-.68.35.92.13 1.6.06 1.77.42.47.67 1.07.67 1.8 0 2.57-1.55 3.13-3.02 3.29.24.21.45.62.45 1.25v1.85c0 .18.12.39.45.32A6.67 6.67 0 0013 6.66C13 2.98 10.09 0 6.5 0z" fill="currentColor" />
  </svg>
);

const steps = [
  {
    title: 'Install via npm',
    desc: 'Add dsintel to your project or install globally for use across all your token repos.',
  },
  {
    title: 'Point it at your tokens',
    desc: 'Pass a directory path. dsintel will find and parse all token JSON files recursively.',
  },
  {
    title: 'Read the report',
    desc: (
      <>
        Issues are grouped by severity and type. Use{' '}
        <code style={{ fontSize: 11, color: 'var(--accent-dim)', background: 'none', padding: 0 }}>--report json</code>{' '}
        to pipe into other tools.
      </>
    ),
  },
  {
    title: 'Wire into CI',
    desc: (
      <>
        Pass{' '}
        <code style={{ fontSize: 11, color: 'var(--accent-dim)', background: 'none', padding: 0 }}>--ci</code>{' '}
        for exit code–based pass/fail. Blocks merges when errors are present.
      </>
    ),
  },
];

export default function InstallSection() {
  return (
    <div className="install-section reveal" id="install">
      <div className="container">
        <div className="install-grid">
          <div>
            <div className="section-label">Get started</div>
            <h2 className="section-heading">
              Up and running<br /><em>in one command.</em>
            </h2>
            <p className="section-body" style={{ marginBottom: 0 }}>
              Install globally via npm or npx it without installing. No configuration file required to run your first audit.
            </p>
            <ol className="install-steps">
              {steps.map((s) => (
                <li key={s.title}>
                  <div>
                    <div className="step-title">{s.title}</div>
                    <div>{s.desc}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <CodeBlock lang="npm global install" copyText="npm install -g dsintel" style={{ marginBottom: 16 }}>
              <pre>
                <span className="dim">$</span>{' '}
                <span className="hl">npm install -g dsintel</span>
              </pre>
            </CodeBlock>

            <CodeBlock lang="npx (no install)" copyText="npx dsintel audit ./tokens" style={{ marginBottom: 16 }}>
              <pre>
                <span className="dim">$</span>{' '}
                <span className="hl">npx dsintel audit</span>{' '}
                <span className="path">./tokens</span>
              </pre>
            </CodeBlock>

            <CodeBlock lang="with flags" copyText="dsintel audit ./tokens --format tokens-studio --report json --ci" style={{ marginBottom: 16 }}>
              <pre>
                <span className="dim">$</span>
                {' dsintel audit '}
                <span className="path">./tokens</span>
                {' \\\n    '}
                <span className="flag">--format</span>
                {' tokens-studio \\\n    '}
                <span className="flag">--report</span>
                {' json \\\n    '}
                <span className="flag">--ci</span>
              </pre>
            </CodeBlock>

            <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
              <a href="https://github.com/guesshimself/dsintel" className="btn-primary" style={{ fontSize: 11 }}>
                <GithubIcon />
                GitHub repo
              </a>
              <a href="https://npmjs.com/package/dsintel" className="btn-secondary" style={{ fontSize: 11 }}>
                npm package
              </a>
              <a href="https://github.com/guesshimself/dsintel/issues" className="btn-secondary" style={{ fontSize: 11 }}>
                report an issue
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
