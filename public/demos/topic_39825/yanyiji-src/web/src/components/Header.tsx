import { Link, useLocation } from 'react-router-dom';
import { useRecognition } from '../context/RecognitionContext';
import './Header.css';

function Header() {
  const location = useLocation();
  const { activeCount } = useRecognition();

  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <span className="logo-icon">🔬</span>
          <span className="logo-text">研易记</span>
        </Link>
        <nav className="nav">
          <Link to="/" className={`nav-link ${isActive('/')}`}>首页</Link>
          <Link to="/upload" className={`nav-link ${isActive('/upload')}`}>
            上传识别
            {activeCount > 0 && (
              <span className="task-badge">{activeCount}</span>
            )}
          </Link>
          <Link to="/library" className={`nav-link ${isActive('/library')}`}>我的公式库</Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;