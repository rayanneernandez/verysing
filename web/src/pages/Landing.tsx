import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import '../App.css';
import logoPng from '../assets/logo.png';
import { SignatureBackground } from '../components/SignatureBackground';

function Landing() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const irParaApp = () => {
    navigate('/login');
  };

  const irParaPagamento = (plano: 'gratuito' | 'profissional' | 'empresarial') => {
    navigate('/pagamento', { state: { plano } });
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="landing-container">
      <style>{`
        .landing-container {
          background-color: #0a0a0c;
          color: white;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
          overflow-x: hidden;
          width: 100%;
        }

        /* Override global heading colors for dark theme */
        .landing-container h1, 
        .landing-container h2, 
        .landing-container h3, 
        .landing-container h4, 
        .landing-container h5, 
        .landing-container h6 {
          color: white;
        }

        /* Header Moderno */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 5%;
          
          /* Glassmorphism Effect - "Não nitida" (Blurred) */
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          background-color: rgba(10, 10, 12, 0.3); /* High transparency */
          
          /* Fixed Position - "Fixa" */
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          box-sizing: border-box;
          z-index: 1000;
          
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .header-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 1001;
        }

        .logo-container {
          width: 150px;
          height: 80px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .logo-container {
            height: 40px;
            width: 120px;
            justify-content: flex-start;
          }
        }

        .header-nav {
          display: flex;
          gap: 2rem;
          align-items: center;
        }

        /* Hamburger Button */
        .hamburger-btn {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          z-index: 1100;
          padding: 0.5rem;
        }

        .hamburger-line {
          display: block;
          width: 25px;
          height: 2px;
          background-color: white;
          margin: 5px 0;
          transition: all 0.3s ease;
        }

        /* Hamburger Animation */
        .hamburger-btn.open .hamburger-line:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }
        .hamburger-btn.open .hamburger-line:nth-child(2) {
          opacity: 0;
        }
        .hamburger-btn.open .hamburger-line:nth-child(3) {
          transform: rotate(-45deg) translate(5px, -5px);
        }

        /* Mobile Menu - Side Drawer Premium */
        .mobile-menu {
          position: fixed;
          top: 0;
          right: 0;
          width: 75%;
          max-width: 300px;
          height: 100vh;
          background: linear-gradient(to bottom, #0f172a, #020617);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
          padding: 5rem 1.5rem 2rem 1.5rem;
          transform: translateX(100%);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 2050;
          box-shadow: -10px 0 30px rgba(0,0,0,0.5);
          border-left: 1px solid rgba(255,255,255,0.05);
        }

        .mobile-menu.open {
          transform: translateX(0);
        }

        /* Backdrop */
        .mobile-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          z-index: 2000;
          cursor: pointer;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }

        .mobile-backdrop.open {
          opacity: 1;
          visibility: visible;
        }

        .mobile-nav-link {
          font-size: 1.1rem;
          color: #cbd5e1;
          text-decoration: none;
          font-weight: 500;
          width: 100%;
          padding: 1rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: all 0.3s ease;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .mobile-nav-link:hover {
          color: white;
          padding-left: 10px;
          background: linear-gradient(90deg, rgba(59,130,246,0.05), transparent);
        }

        .mobile-nav-link::after {
          content: '→';
          opacity: 0;
          transform: translateX(-10px);
          transition: all 0.3s ease;
          font-size: 1rem;
          color: #3b82f6;
        }

        .mobile-nav-link:hover::after {
          opacity: 1;
          transform: translateX(0);
        }
        
        .btn-mobile-login {
          width: 100%;
          margin-top: 2rem;
          padding: 1rem;
          border-radius: 12px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border: none;
          font-weight: 600;
          font-size: 1.1rem;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
          transition: transform 0.2s;
        }
        
        .btn-mobile-login:active {
          transform: scale(0.98);
        }

          color: white;
          text-decoration: none;
          font-weight: 600;
        }

        .nav-link {
          cursor: pointer;
          color: #94a1b2;
          font-weight: 500;
          transition: color 0.3s ease;
          position: relative;
          font-size: 0.95rem;
        }

        .nav-link:hover {
          color: white;
        }

        .nav-link::after {
          content: '';
          position: absolute;
          width: 0;
          height: 2px;
          bottom: -4px;
          left: 0;
          background-color: #3b82f6;
          transition: width 0.3s ease;
        }

        .nav-link:hover::after {
          width: 100%;
        }

        .btn-login {
          background-color: white;
          color: #0a0a0c;
          padding: 0.7rem 2rem;
          border-radius: 50px; /* Pill shape */
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 14px 0 rgba(0,0,0,0.39);
        }

        .btn-login:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(255,255,255,0.23);
          background-color: #f8fafc;
        }

        /* Hero Section Responsivo */
        .hero-section {
          position: relative;
          text-align: center;
          padding: 16rem 1rem 10rem 1rem; /* Increased top/bottom padding significantly */
          background-color: #0a0a0c;
          /* Luz azul que "passeia" organicamente pela tela */
          background-image: radial-gradient(circle at center, #172554 0%, #0a0a0c 70%);
          background-size: 200% 200%; /* Aumentado para permitir movimento amplo */
          animation: wanderSpotlight 10s ease-in-out infinite;
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow: hidden;
        }

        @keyframes wanderSpotlight {
          0% {
            background-position: 50% 50%;
          }
          20% {
            background-position: 20% 20%; /* Canto superior esq */
          }
          40% {
            background-position: 80% 30%; /* Canto superior dir */
          }
          60% {
            background-position: 70% 80%; /* Canto inferior dir */
          }
          80% {
            background-position: 30% 70%; /* Canto inferior esq */
          }
          100% {
            background-position: 50% 50%;
          }
        }

        .hero-title {
          fontSize: clamp(2.5rem, 8vw, 4.5rem);
          fontWeight: 800;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          color: white;
          /* Sombra forte para garantir legibilidade sobre a animação de luz */
          text-shadow: 0 4px 24px rgba(0, 0, 0, 0.9), 0 2px 4px rgba(0, 0, 0, 0.8);
          position: relative;
          z-index: 2;
        }

        .hero-subtitle {
          color: #94a1b2;
          font-size: clamp(1rem, 4vw, 1.2rem);
          max-width: 600px;
          margin: 0 auto 3rem;
          line-height: 1.6;
          padding: 0 1rem;
          /* Sombra para legibilidade */
          text-shadow: 0 2px 12px rgba(0, 0, 0, 0.9);
          position: relative;
          z-index: 2;
        }

        .hero-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          position: relative;
          z-index: 2;
        }

        /* Grids Responsivos */
        .grid-responsive {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 3rem;
          padding: 0 1rem;
        }

        @media (max-width: 1024px) {
          .grid-responsive {
            grid-template-columns: repeat(2, 1fr);
            gap: 2rem;
          }
        }

        @media (max-width: 640px) {
          .grid-responsive {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }

        .section-offset {
          scroll-margin-top: 100px;
        }

        .card-dark {
          position: relative;
          background: linear-gradient(145deg, rgba(23, 23, 23, 0.6) 0%, rgba(10, 10, 12, 0.8) 100%);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 1.2rem;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          overflow: hidden;
          group: 'card';
        }
        
        .card-dark::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(800px circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.06), transparent 40%);
          opacity: 0;
          transition: opacity 0.5s;
          pointer-events: none;
          z-index: 0;
        }

        .card-dark:hover {
          transform: translateY(-5px);
          border-color: rgba(59, 130, 246, 0.4);
          box-shadow: 0 15px 30px -10px rgba(59, 130, 246, 0.15);
        }

        .card-dark:hover::before {
          opacity: 1;
        }

        .card-icon {
          width: 50px;
          height: 50px;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
          color: #60a5fa;
          transition: all 0.3s ease;
          position: relative;
          z-index: 1;
          border: 1px solid rgba(59, 130, 246, 0.1);
        }

        .card-dark:hover .card-icon {
          background: rgba(59, 130, 246, 0.2);
          transform: scale(1.05) rotate(3deg);
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
          color: white;
          border-color: rgba(59, 130, 246, 0.3);
        }

        .card-title {
          font-size: 1.2rem;
          margin-bottom: 0.8rem;
          font-weight: 700;
          color: white;
          position: relative;
          z-index: 1;
        }

        .card-text {
          color: #94a1b2;
          line-height: 1.6;
          font-size: 0.9rem;
          position: relative;
          z-index: 1;
        }

        /* Mobile Adjustments */
        @media (max-width: 768px) {
          .header {
            padding: 0.8rem 1rem;
          }
          
          .header-nav {
            display: none;
          }

          .hamburger-btn {
            display: block;
          }
          
          .hero-section {
             padding: 8rem 1rem 4rem 1rem;
          }

          .hero-buttons {
            flex-direction: column;
            width: 100%;
            max-width: 300px;
          }

          .hero-buttons button {
            width: 100%;
          }
        }
      `}</style>
      
      {/* Header / Navbar */}
      <header className="header">
        <div className="header-logo">
          {/* Logo Customizado VERYSING */}
          <div className="logo-container">
            <img src={logoPng} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="header-nav">
            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="nav-link" style={{ textDecoration: 'none', color: 'inherit' }}>{t('landing.nav.home')}</a>
            <a href="#recursos" className="nav-link" style={{ textDecoration: 'none', color: 'inherit' }}>{t('landing.nav.features')}</a>
            <a href="#precos" className="nav-link" style={{ textDecoration: 'none', color: 'inherit' }}>{t('landing.nav.pricing')}</a>
            <a href="#sobre" className="nav-link" style={{ textDecoration: 'none', color: 'inherit' }}>{t('landing.nav.about')}</a>
            <a onClick={(e) => { e.preventDefault(); navigate('/contato'); }} href="/contato" className="nav-link" style={{ textDecoration: 'none', color: 'inherit' }}>{t('landing.nav.contact')}</a>
            
            <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '0 0.5rem' }}></div>
            
            {/* Language Switcher Dropdown */}
            <div style={{ position: 'relative', marginLeft: '0.5rem' }}>
              <button 
                onClick={() => setShowLangMenu(!showLangMenu)} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'rgba(255,255,255,0.7)', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{language.toUpperCase()}</span>
              </button>
              
              {showLangMenu && (
                <div style={{ 
                  position: 'absolute', 
                  top: '120%', 
                  right: 0, 
                  background: 'rgba(15, 23, 42, 0.95)', 
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '12px', 
                  padding: '0.5rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  minWidth: '140px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  zIndex: 1002
                }}>
                  {[
                    { code: 'pt', label: 'Português', flag: '🇧🇷' },
                    { code: 'en', label: 'English', flag: '🇺🇸' },
                    { code: 'es', label: 'Español', flag: '🇪🇸' },
                    { code: 'fr', label: 'Français', flag: '🇫🇷' }
                  ].map((lang) => (
                    <button 
                      key={lang.code}
                      onClick={() => { setLanguage(lang.code as any); setShowLangMenu(false); }}
                      style={{ 
                        background: language === lang.code ? 'rgba(59, 130, 246, 0.2)' : 'transparent', 
                        border: 'none', 
                        color: language === lang.code ? 'white' : '#94a1b2', 
                        cursor: 'pointer', 
                        padding: '0.8rem 1rem', 
                        textAlign: 'left',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.8rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (language !== lang.code) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                          e.currentTarget.style.color = 'white';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (language !== lang.code) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#94a1b2';
                        }
                      }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>{lang.flag}</span>
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={irParaApp} className="btn-login" style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem', marginLeft: '0.5rem' }}>{t('landing.nav.login')}</button>
        </div>

        {/* Mobile Hamburger Button */}
        <button className={`hamburger-btn ${isMenuOpen ? 'open' : ''}`} onClick={toggleMenu}>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
      </header>

      {/* Mobile Menu Backdrop - Moved outside header to avoid stacking context issues */}
      <div 
        className={`mobile-backdrop ${isMenuOpen ? 'open' : ''}`} 
        onClick={() => setIsMenuOpen(false)}
      ></div>

      {/* Mobile Menu Drawer */}
      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        <div style={{ width: '100%', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#64748b', fontWeight: '600' }}>{t('landing.nav.menu')}</span>
        </div>
        
        <a href="#" className="mobile-nav-link" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); setIsMenuOpen(false); }}>{t('landing.nav.home')}</a>
        <a href="#recursos" className="mobile-nav-link" onClick={() => { setIsMenuOpen(false); }}>{t('landing.nav.features')}</a>
        <a href="#precos" className="mobile-nav-link" onClick={() => { setIsMenuOpen(false); }}>{t('landing.nav.pricing')}</a>
        <a href="#sobre" className="mobile-nav-link" onClick={() => { setIsMenuOpen(false); }}>{t('landing.nav.about')}</a>
        <a onClick={(e) => { e.preventDefault(); navigate('/contato'); setIsMenuOpen(false); }} href="/contato" className="mobile-nav-link">{t('landing.nav.contact')}</a>

        <div style={{ width: '100%', marginTop: '1rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#64748b', fontWeight: '600' }}>Idioma</span>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button onClick={() => setLanguage('pt')} style={{ background: language === 'pt' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', border: language === 'pt' ? '1px solid rgba(59,130,246,0.5)' : 'none', color: 'white', cursor: 'pointer', padding: '0.5rem 1rem', borderRadius: '8px', flex: 1, minWidth: '60px' }}>PT</button>
            <button onClick={() => setLanguage('en')} style={{ background: language === 'en' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', border: language === 'en' ? '1px solid rgba(59,130,246,0.5)' : 'none', color: 'white', cursor: 'pointer', padding: '0.5rem 1rem', borderRadius: '8px', flex: 1, minWidth: '60px' }}>EN</button>
            <button onClick={() => setLanguage('es')} style={{ background: language === 'es' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', border: language === 'es' ? '1px solid rgba(59,130,246,0.5)' : 'none', color: 'white', cursor: 'pointer', padding: '0.5rem 1rem', borderRadius: '8px', flex: 1, minWidth: '60px' }}>ES</button>
            <button onClick={() => setLanguage('fr')} style={{ background: language === 'fr' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', border: language === 'fr' ? '1px solid rgba(59,130,246,0.5)' : 'none', color: 'white', cursor: 'pointer', padding: '0.5rem 1rem', borderRadius: '8px', flex: 1, minWidth: '60px' }}>FR</button>
          </div>
        </div>
        
        <button onClick={irParaApp} className="btn-mobile-login">{t('landing.nav.login')}</button>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <SignatureBackground />
        
        <h1 className="hero-title">
          {t('landing.hero.title_start')}<br/>
          <span style={{ color: '#ffffff' }}>{t('landing.hero.title_end')}</span>
        </h1>
        
        <p className="hero-subtitle">
          {t('landing.hero.subtitle')}
        </p>
        
        <div className="hero-buttons">
          <button onClick={irParaApp} className="btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2.5rem', borderRadius: '50px' }}>
            {t('landing.hero.start')} →
          </button>
          <button style={{ 
            backgroundColor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white',
            padding: '1rem 2rem', borderRadius: '50px', cursor: 'pointer', fontSize: '1.1rem',
            backdropFilter: 'blur(5px)'
          }}>
            {t('landing.hero.demo')}
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="section-offset" style={{ padding: '4rem 0', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(2rem, 5vw, 2.5rem)', marginBottom: '1rem', padding: '0 1rem' }}>
          {t('landing.features.title_start')} <span style={{ color: '#ffffff' }}>VERYSING</span>?
        </h2>
        <p style={{ textAlign: 'center', color: '#94a1b2', marginBottom: '4rem', maxWidth: '600px', margin: '0 auto 4rem', padding: '0 1rem' }}>
          {t('landing.features.subtitle')}
        </p>
        
        <div className="grid-responsive">
          {/* Card 1: Assinatura de Contrato */}
          <div className="card-dark">
            <div className="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </div>
            <h3 className="card-title">{t('landing.card.contract.title')}</h3>
            <p className="card-text">
              {t('landing.card.contract.desc')}
            </p>
          </div>

          {/* Card 2: Envio Multi-Destinatários */}
          <div className="card-dark">
            <div className="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <h3 className="card-title">{t('landing.card.multi.title')}</h3>
            <p className="card-text">
              {t('landing.card.multi.desc')}
            </p>
          </div>

          {/* Card 3: Criação de Formulários */}
          <div className="card-dark">
            <div className="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
            </div>
            <h3 className="card-title">{t('landing.card.forms.title')}</h3>
            <p className="card-text">
              {t('landing.card.forms.desc')}
            </p>
          </div>

          {/* Card 4: Comunicados */}
          <div className="card-dark">
            <div className="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2" ry="2"/></svg>
            </div>
            <h3 className="card-title">{t('landing.card.announce.title')}</h3>
            <p className="card-text">
              {t('landing.card.announce.desc')}
            </p>
          </div>

          {/* Card 5: Simplicidade */}
          <div className="card-dark">
            <div className="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            </div>
            <h3 className="card-title">{t('landing.card.simple.title')}</h3>
            <p className="card-text">
              {t('landing.card.simple.desc')}
            </p>
          </div>

          {/* Card 6: Segurança */}
          <div className="card-dark">
            <div className="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h3 className="card-title">{t('landing.card.secure.title')}</h3>
            <p className="card-text">
              {t('landing.card.secure.desc')}
            </p>
          </div>
        </div>
      </section>

      {/* Sobre Section (Moved) */}
      <section id="sobre" className="section-offset" style={{ 
        padding: '6rem 1rem',
        background: 'linear-gradient(180deg, #171717 0%, #0a0a0c 100%)', 
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        transform: 'skewY(-3deg)',
        margin: '5rem 0'
      }}>
        <div style={{ 
          maxWidth: '1100px', 
          margin: '0 auto', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '3rem', 
          flexWrap: 'wrap', 
          justifyContent: 'space-between',
          transform: 'skewY(3deg)'
        }}>
          
          {/* Lado Esquerdo - Texto */}
          <div style={{ flex: '1 1 450px', textAlign: 'left' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', marginBottom: '1.5rem', fontWeight: '800', lineHeight: '1.2' }}>
              {t('landing.about.title')} <span style={{ color: '#ffffff' }}>VERYSING</span>
            </h2>
            <p style={{ fontSize: '1rem', color: '#94a1b2', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              {t('landing.about.desc1')}
            </p>
            <p style={{ fontSize: '0.95rem', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '2rem' }}>
              {t('landing.about.desc2')}
            </p>

            
            <div style={{ display: 'flex', gap: '3rem' }}>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: 'white' }}>100%</div>
                <div style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>{t('landing.about.stat1')}</div>
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: 'white' }}>24h</div>
                <div style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>{t('landing.about.stat2')}</div>
              </div>
            </div>
          </div>

          {/* Lado Direito - Ilustração */}
          <div style={{ flex: '1 1 350px', position: 'relative', minHeight: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Círculo de fundo brilhante */}
            <div style={{ 
              position: 'absolute', width: '250px', height: '250px', 
              background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0) 70%)',
              top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 0
            }}></div>
            
            {/* Card do Contrato */}
            <div style={{ 
              position: 'relative', width: '280px', height: '360px', 
              background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px', backdropFilter: 'blur(10px)', padding: '1.5rem',
              transform: 'rotate(-5deg)', zIndex: 1, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
              {/* Linhas do contrato */}
              <div style={{ width: '40%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '1.5rem' }}></div>
              <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginBottom: '0.8rem' }}></div>
              <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginBottom: '0.8rem' }}></div>
              <div style={{ width: '80%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginBottom: '2.5rem' }}></div>
              
              <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginBottom: '0.8rem' }}></div>
              <div style={{ width: '90%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginBottom: '0.8rem' }}></div>
              
              {/* Área da Assinatura Animada */}
              <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px dashed rgba(255,255,255,0.1)', position: 'relative' }}>
                <div style={{ position: 'relative', height: '50px', display: 'flex', alignItems: 'center' }}>
                  {/* Assinatura que se revela */}
                  <div style={{ 
                    color: '#3b82f6', 
                    fontFamily: 'cursive', 
                    fontSize: '1.8rem', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden',
                    width: '0px',
                    animation: 'writeSignature 6s infinite'
                  }}>
                    Verysing
                  </div>

                  {/* Caneta Animada */}
                  <div style={{ 
                    position: 'absolute', 
                    top: '-30px', 
                    left: '0', 
                    pointerEvents: 'none',
                    zIndex: 10,
                    animation: 'movePen 6s infinite'
                  }}>
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ fill: 'rgba(15, 23, 42, 0.9)', transform: 'rotate(-15deg)' }}>
                      <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                      <path d="M2 2l7.586 7.586"></path>
                    </svg>
                  </div>
                </div>

                {/* Badge de Validado */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  marginTop: '0.5rem',
                  opacity: 0,
                  animation: 'showBadge 6s infinite'
                }}>
                  <div style={{ width: '20px', height: '20px', background: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: '600' }}>{t('landing.about.badge')}</span>
                </div>
              </div>
            </div>

            <style>{`
              @keyframes writeSignature {
                0%, 15% { width: 0; border-right: 2px solid #3b82f6; }
                45% { width: 120px; border-right: 2px solid #3b82f6; }
                50%, 100% { width: 120px; border-right: none; }
                95% { opacity: 1; }
                100% { opacity: 0; }
              }

              @keyframes movePen {
                0% { opacity: 0; transform: translate(0, -20px) rotate(0deg); }
                10% { opacity: 1; transform: translate(0, 0) rotate(0deg); }
                15% { transform: translate(20px, -5px) rotate(-15deg); }
                20% { transform: translate(40px, 5px) rotate(5deg); }
                25% { transform: translate(60px, -5px) rotate(-15deg); }
                30% { transform: translate(80px, 5px) rotate(5deg); }
                35% { transform: translate(100px, -5px) rotate(-15deg); }
                40% { transform: translate(120px, 0px) rotate(0deg); opacity: 1; }
                45%, 90% { transform: translate(140px, 20px) rotate(0deg); opacity: 1; }
                95%, 100% { transform: translate(140px, 20px) rotate(0deg); opacity: 0; }
              }

              @keyframes showBadge {
                0%, 45% { opacity: 0; transform: scale(0.9); }
                50%, 90% { opacity: 1; transform: scale(1); }
                95%, 100% { opacity: 0; transform: scale(0.9); }
              }
            `}</style>
          </div>

        </div>
      </section>

      {/* Video Demo Section */}
      <section id="demo-video" className="section-offset" style={{ padding: '4rem 0', maxWidth: '650px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(2rem, 5vw, 2.5rem)', marginBottom: '1rem', padding: '0 1rem' }}>
          {t('landing.demo.title')} <span style={{ color: '#ffffff' }}>VERYSING</span> {t('landing.demo.title_end')}
        </h2>
        <p style={{ textAlign: 'center', color: '#94a1b2', marginBottom: '3rem', padding: '0 1rem', maxWidth: '700px', margin: '0 auto 3rem' }}>
          {t('landing.demo.desc')}
        </p>
        
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          paddingBottom: '56.25%', /* 16:9 Aspect Ratio */
          backgroundColor: '#0f172a',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
        }}>
          {/* Placeholder for Video */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            color: '#64748b'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              backdropFilter: 'blur(5px)',
              border: '1px solid rgba(59, 130, 246, 0.4)'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="currentColor" strokeWidth="0" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </div>
            <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>{t('landing.demo.soon')}</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="section-offset" style={{ padding: '4rem 0', maxWidth: '1200px', margin: '0 auto', marginBottom: '4rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(2rem, 5vw, 2.5rem)', marginBottom: '1rem', padding: '0 1rem' }}>{t('landing.pricing.title')}</h2>
        <p style={{ textAlign: 'center', color: '#94a1b2', marginBottom: '3rem', padding: '0 1rem' }}>{t('landing.pricing.subtitle')}</p>
        
        <div className="grid-responsive">
          {/* Free Plan */}
          <div className="card-dark" style={{ borderTop: '4px solid #94a1b2' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{t('landing.pricing.free.title')}</h3>
            <div style={{ fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '0.8rem' }}>R$ 0<span style={{ fontSize: '0.9rem', color: '#94a1b2', fontWeight: 'normal' }}>/mês</span></div>
            <ul style={{ listStyle: 'none', padding: 0, color: '#94a1b2', lineHeight: '2', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <li>✓ {t('landing.pricing.free.feat1')}</li>
              <li>✓ {t('landing.pricing.free.feat2')}</li>
              <li>✓ {t('landing.pricing.free.feat3')}</li>
              <li>✓ {t('landing.pricing.free.feat4')}</li>
            </ul>
            <button onClick={irParaApp} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #94a1b2', background: 'transparent', color: 'white', cursor: 'pointer', fontSize: '0.9rem' }}>
              {t('landing.pricing.free.btn')}
            </button>
          </div>

          {/* Pro Plan */}
          <div className="card-dark" style={{ borderTop: '4px solid #3b82f6', backgroundColor: '#0f172a', position: 'relative' }}>
            <div style={{ 
              position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
              backgroundColor: '#3b82f6', color: 'white', padding: '0.1rem 0.8rem', borderRadius: '10px', fontSize: '0.7rem'
            }}>{t('landing.pricing.pro.popular')}</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{t('landing.pricing.pro.title')}</h3>
            <div style={{ fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '0.8rem' }}>R$ 19,90<span style={{ fontSize: '0.9rem', color: '#94a1b2', fontWeight: 'normal' }}>/mês</span></div>
            <ul style={{ listStyle: 'none', padding: 0, color: '#d1d5db', lineHeight: '2', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <li>✓ {t('landing.pricing.pro.feat1')}</li>
              <li>✓ {t('landing.pricing.pro.feat2')}</li>
              <li>✓ {t('landing.pricing.pro.feat3')}</li>
              <li>✓ {t('landing.pricing.pro.feat4')}</li>
              <li>✓ {t('landing.pricing.pro.feat5')}</li>
            </ul>
            <button onClick={irParaApp} className="btn-primary" style={{ width: '100%', padding: '0.8rem', fontSize: '0.9rem' }}>
              {t('landing.pricing.pro.btn')}
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="card-dark" style={{ borderTop: '4px solid #10b981' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{t('landing.pricing.ent.title')}</h3>
            <div style={{ fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '0.8rem' }}>R$ 39,90<span style={{ fontSize: '0.9rem', color: '#94a1b2', fontWeight: 'normal' }}>/mês</span></div>
            <ul style={{ listStyle: 'none', padding: 0, color: '#94a1b2', lineHeight: '2', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <li>✓ {t('landing.pricing.ent.feat1')}</li>
              <li>✓ {t('landing.pricing.ent.feat2')}</li>
              <li>✓ {t('landing.pricing.ent.feat3')}</li>
              <li>✓ {t('landing.pricing.ent.feat4')}</li>
              <li>✓ {t('landing.pricing.ent.feat5')}</li>
            </ul>
            <button
              onClick={() => irParaPagamento('empresarial')}
              style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #10b981', background: 'transparent', color: 'white', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              {t('landing.pricing.ent.btn')}
            </button>
          </div>
        </div>
      </section>

      <footer style={{ textAlign: 'center', padding: '2rem', borderTop: '1px solid #1f1f22', color: '#52525b' }}>
        © 2026 VERYSING. Todos os direitos reservados.
      </footer>
    </div>
  );
}

export default Landing;