export default function Nav() {
  return (
    <nav>
      <div className="nav-inner">
        <a href="#" className="nav-logo">
          <div className="logo-mark">ds</div>
          dsintel
        </a>
        <ul className="nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#what-it-catches">Checks</a></li>
          <li><a href="#install">Install</a></li>
          <li>
            <a href="https://github.com/guesshimself/dsintel" className="nav-cta">
              GitHub →
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
