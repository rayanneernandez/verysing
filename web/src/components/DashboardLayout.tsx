import { useState, ReactNode, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import logoPng from '../assets/logo.png';
import './DashboardLayout.css';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, setLanguage } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('Usuário Sistema');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setUserName(storedName);
    }

    const handleUserUpdate = () => {
      const updatedName = localStorage.getItem('userName');
      if (updatedName) {
        setUserName(updatedName);
      }
    };

    window.addEventListener('userUpdated', handleUserUpdate);

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('userUpdated', handleUserUpdate);
    };
  }, []);

  const currentTitle = title || t('dashboard.title');

  // Helper to determine if a route is active
  const isActive = (path: string) => {
    if (path === '/app' && location.pathname === '/app' && !location.search.includes('tab=account')) {
        return true;
    }
    if (path === '/conta' && location.search.includes('tab=account')) {
        return true;
    }
    return location.pathname === path;
  };

  return (
    <div className="dashboard-layout">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
     <div className="sidebar-header">
          <div className="logo-section">
            <img src={logoPng} alt="Logo" className="logo-img" />
          </div>
          <button className="close-sidebar" onClick={() => setIsSidebarOpen(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${isActive('/app') ? 'active' : ''}`}
            onClick={() => {
                navigate('/app');
                setIsSidebarOpen(false);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            {t('sidebar.overview')}
          </button>

          <button 
            className={`nav-item ${isActive('/documentos') ? 'active' : ''}`}
            onClick={() => {
                navigate('/documentos');
                setIsSidebarOpen(false);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            {t('sidebar.documents')}
          </button>

          <button 
            className={`nav-item ${isActive('/assinar') ? 'active' : ''}`}
            onClick={() => {
                navigate('/assinar');
                setIsSidebarOpen(false);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
            {t('sidebar.sign')}
          </button>

          <button 
            className={`nav-item ${isActive('/enviar') ? 'active' : ''}`}
            onClick={() => {
                navigate('/enviar');
                setIsSidebarOpen(false);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            {t('sidebar.send')}
          </button>

          <button 
            className={`nav-item ${isActive('/criar-formulario') ? 'active' : ''}`}
            onClick={() => {
                navigate('/criar-formulario');
                setIsSidebarOpen(false);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg>
            {t('forms.create_page_title')}
          </button>

          <button 
            className={`nav-item ${isActive('/formularios') ? 'active' : ''}`}
            onClick={() => {
                navigate('/formularios');
                setIsSidebarOpen(false);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            {t('forms.list')}
          </button>

          <button 
            className={`nav-item ${isActive('/modelos') ? 'active' : ''}`}
            onClick={() => {
                navigate('/modelos');
                setIsSidebarOpen(false);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            {t('sidebar.templates')}
          </button>

          <button 
            className={`nav-item ${isActive('/enviar-comunicado') ? 'active' : ''}`}
            onClick={() => {
                navigate('/enviar-comunicado');
                setIsSidebarOpen(false);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            {t('sidebar.announce')}
          </button>

          <button 
            className={`nav-item ${isActive('/historico-comunicados') ? 'active' : ''}`}
            onClick={() => {
                navigate('/historico-comunicados');
                setIsSidebarOpen(false);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            {t('sidebar.history')}
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-lang" style={{ padding: '0 1rem 1rem', display: 'flex', gap: '0.8rem', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '0.5rem' }}>
            <button onClick={() => setLanguage('pt')} style={{ color: '#ffffff', opacity: language === 'pt' ? 1 : 0.5, fontSize: '0.9rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', transition: 'opacity 0.2s' }} title="Português">BR</button>
            <button onClick={() => setLanguage('en')} style={{ color: '#ffffff', opacity: language === 'en' ? 1 : 0.5, fontSize: '0.9rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', transition: 'opacity 0.2s' }} title="English">US</button>
            <button onClick={() => setLanguage('es')} style={{ color: '#ffffff', opacity: language === 'es' ? 1 : 0.5, fontSize: '0.9rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', transition: 'opacity 0.2s' }} title="Español">ES</button>
            <button onClick={() => setLanguage('fr')} style={{ color: '#ffffff', opacity: language === 'fr' ? 1 : 0.5, fontSize: '0.9rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', transition: 'opacity 0.2s' }} title="Français">FR</button>
          </div>
          <button className="nav-item logout" onClick={() => navigate('/')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            {t('sidebar.logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-header">
          <div className="header-left">
            <button className="menu-toggle" onClick={() => setIsSidebarOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <h2 className="header-title">
              {currentTitle}
            </h2>
          </div>
          <div className="user-profile-container" ref={menuRef}>
            <div 
              className={`user-profile ${isProfileMenuOpen ? 'active' : ''}`} 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            >
              <div className="user-avatar">{userName.charAt(0).toUpperCase()}</div>
              <div className="user-info">
                <span className="user-name">{userName}</span>
                <span className="user-role">{t('user.plan')}</span>
              </div>
              <svg 
                className={`chevron ${isProfileMenuOpen ? 'open' : ''}`}
                xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ marginLeft: '0.5rem', opacity: 0.5, transition: 'transform 0.2s' }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>

            {isProfileMenuOpen && (
              <div className="profile-dropdown">
                  <div className="dropdown-item" onClick={() => {
                    navigate('/app?tab=account');
                    setIsProfileMenuOpen(false);
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    {t('menu.account')}
                  </div>

                  <div className="dropdown-item" onClick={() => {
                    const currentPlan = localStorage.getItem('userPlan') || 'gratuito';
                    navigate('/pagamento', { state: { plano: currentPlan } });
                    setIsProfileMenuOpen(false);
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 4h-3.17a3 3 0 0 0-2.12.88l-9.83 9.83a2 2 0 0 0-.58 1.41V20a2 2 0 0 0 2 2h3.88a2 2 0 0 0 1.41-.59l9.83-9.83A3 3 0 0 0 20 7.17V4z"></path><path d="M16 5l3 3"></path></svg>
                    {t('account.upgrade')}
                  </div>
                  
                  <div className="dropdown-divider"></div>
                  
                  <div className="dropdown-label">{t('menu.language')}</div>
                  <div className="language-options">
                  <button 
                    className={`lang-btn ${language === 'pt' ? 'active' : ''}`}
                    onClick={() => setLanguage('pt')}
                  >
                    🇧🇷 PT
                  </button>
                  <button 
                    className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                    onClick={() => setLanguage('en')}
                  >
                    🇺🇸 EN
                  </button>
                  <button 
                    className={`lang-btn ${language === 'es' ? 'active' : ''}`}
                    onClick={() => setLanguage('es')}
                  >
                    🇪🇸 ES
                  </button>
                  <button 
                    className={`lang-btn ${language === 'fr' ? 'active' : ''}`}
                    onClick={() => setLanguage('fr')}
                  >
                    🇫🇷 FR
                  </button>
                </div>
                
                <div className="dropdown-divider"></div>
                
                <div 
                  className="dropdown-item logout" 
                  onClick={() => navigate('/')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  {t('sidebar.logout')}
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="content-scroll">
          {children}
        </div>
      </main>
    </div>
  );
}