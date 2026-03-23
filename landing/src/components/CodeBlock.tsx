import { useState } from 'react';

interface CodeBlockProps {
  lang: string;
  copyText?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const IconCopy = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
    <rect x="4.5" y="0.5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M2.5 4.5H1.5a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
    <path d="M2 6.5l3.5 3.5 5.5-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function CodeBlock({ lang, copyText, children, style }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [pressing, setPressing] = useState(false);

  const handleCopy = () => {
    const text = copyText ?? (document.querySelector('.code-body pre') as HTMLElement)?.textContent ?? '';
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const handleMouseDown = () => {
    setPressing(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setPressing(false)));
  };

  return (
    <div className="code-block" style={style}>
      <div className="code-header">
        <div className="code-lang">
          <div className="code-lang-dot"></div>
          {lang}
        </div>
        {copyText !== undefined && (
          <button
            className={`copy-btn${copied ? ' copied' : ''}${pressing ? ' pressing' : ''}`}
            onClick={handleCopy}
            onMouseDown={handleMouseDown}
          >
            {copied ? <IconCheck /> : <IconCopy />}
            {copied ? 'copied!' : 'copy'}
          </button>
        )}
      </div>
      <div className="code-body">
        {children}
      </div>
    </div>
  );
}
