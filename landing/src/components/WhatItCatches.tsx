import CodeBlock from './CodeBlock';

const catches = [
  'Token aliases that resolve through four layers before hitting a raw value — or never resolving at all',
  'Naming conventions that diverged mid-project between what Figma calls it and what the codebase expects',
  'Semantic tokens left orphaned after a system migration — still defined, never consumed',
  <>Color tokens named <code style={{ color: 'var(--accent-dim)', fontSize: 11, background: 'none', padding: 0 }}>color.brand.primary</code> resolving to a neutral gray after a rebrand</>,
  'Tokens Studio sets with conflicting overrides that produce different output depending on theme order',
];

export default function WhatItCatches() {
  return (
    <section className="section reveal" id="what-it-catches">
      <div className="container">
        <div className="catches-grid">
          <div className="catches-left">
            <div className="section-label">Real problems, found fast</div>
            <h2 className="section-heading">
              The debt your<br /><em>token file hides.</em>
            </h2>
            <p className="section-body">
              Design tokens accumulate entropy. References break. Names drift. Aliases pile up and nobody notices until something ships wrong. dsintel is the audit you run before that happens.
            </p>
            <ul className="catch-list">
              {catches.map((text, i) => (
                <li key={i}>
                  <span className="catch-marker">0{i + 1}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <CodeBlock lang="dsintel --report json" copyText='{"summary":{"tokens":847}}'>
              <pre>
                {'{\n'}
                {'  '}<span className="hl">"summary"</span>{': {\n'}
                {'    '}<span className="dim">"tokens"</span>{': 847,\n'}
                {'    '}<span className="dim">"files"</span>{': 14,\n'}
                {'    '}<span className="dim">"issues"</span>{': 63,\n'}
                {'    '}<span className="dim">"severity"</span>{': '}<span className="hl">"warn"</span>{'\n'}
                {'  },\n'}
                {'  '}<span className="hl">"circular"</span>{': [\n'}
                {'    {\n'}
                {'      '}<span className="dim">"token"</span>{': '}<span className="path">"color.feedback.error.bg"</span>{',\n'}
                {'      '}<span className="dim">"chain"</span>{': [\n'}
                {'        '}<span className="path">"color.feedback.error.bg"</span>{',\n'}
                {'        '}<span className="path">"color.semantic.danger"</span>{',\n'}
                {'        '}<span className="path">"color.feedback.error.bg"</span>{'\n'}
                {'      ],\n'}
                {'      '}<span className="dim">"severity"</span>{': '}<span className="flag">"error"</span>{'\n'}
                {'    }\n'}
                {'  ],\n'}
                {'  '}<span className="hl">"unused"</span>{': [\n'}
                {'    {\n'}
                {'      '}<span className="dim">"token"</span>{': '}<span className="path">"spacing.legacy.xs"</span>{',\n'}
                {'      '}<span className="dim">"file"</span>{': '}<span className="path">"spacing.json"</span>{',\n'}
                {'      '}<span className="dim">"last_referenced"</span>{': '}<span className="flag">null</span>{'\n'}
                {'    }\n'}
                {'  ]\n}'}
              </pre>
            </CodeBlock>

            <CodeBlock lang="CI integration" style={{ marginTop: 20 }}>
              <pre>
                <span className="dim"># .github/workflows/tokens.yml</span>{'\n'}
                {'- name: '}<span className="hl">Audit design tokens</span>{'\n'}
                {'  run: '}<span className="path">dsintel audit ./tokens</span>{' '}<span className="flag">--ci</span>{'\n'}
                {'  '}<span className="dim"># exits 1 on errors, 0 on clean</span>
              </pre>
            </CodeBlock>
          </div>
        </div>
      </div>
    </section>
  );
}
