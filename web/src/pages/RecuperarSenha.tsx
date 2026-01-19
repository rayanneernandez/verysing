import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import logoPng from '../assets/logo.png';

function RecuperarSenha() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleRecover = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Here you would implement the actual password recovery logic
  };

  return (
    <div className="login-container">
      {/* Header / Navbar */}
      <header className="header">
        <div className="header-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <div style={{ width: '150px', height: '40px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
            <img src={logoPng} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'left' }} />
          </div>
        </div>

        <div className="header-nav">
            <span className="nav-link" onClick={() => navigate('/')}>{t('landing.nav.home')}</span>
            <span className="nav-link" onClick={() => navigate('/')}>{t('landing.nav.features')}</span>
            <span className="nav-link" onClick={() => navigate('/')}>{t('landing.nav.pricing')}</span>
            <span className="nav-link" onClick={() => navigate('/')}>{t('landing.nav.about')}</span>
            <span className="nav-link" onClick={() => navigate('/contato')}>{t('landing.nav.contact')}</span>
            <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.8)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.4rem 0.6rem',
                  borderRadius: '999px',
                  transition: 'all 0.2s ease'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{language.toUpperCase()}</span>
              </button>
              {showLangMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: '120%',
                    right: 0,
                    background: 'rgba(15,23,42,0.98)',
                    borderRadius: '12px',
                    padding: '0.5rem',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    border: '1px solid rgba(148,163,184,0.3)',
                    minWidth: '160px',
                    zIndex: 1100
                  }}
                >
                  {[
                    { code: 'pt', label: 'Português', flag: '🇧🇷' },
                    { code: 'en', label: 'English', flag: '🇺🇸' },
                    { code: 'es', label: 'Español', flag: '🇪🇸' },
                    { code: 'fr', label: 'Français', flag: '🇫🇷' }
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code as any);
                        setShowLangMenu(false);
                      }}
                      style={{
                        width: '100%',
                        background: language === lang.code ? 'rgba(59,130,246,0.25)' : 'transparent',
                        border: 'none',
                        color: language === lang.code ? 'white' : '#94a1b2',
                        cursor: 'pointer',
                        padding: '0.35rem 0.6rem',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.85rem',
                        textAlign: 'left'
                      }}
                    >
                      <span style={{ fontSize: '1rem' }}>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => navigate('/login')} className="btn-login" style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}>
              {t('landing.nav.login')}
            </button>
        </div>

        <button className={`hamburger-btn ${isMenuOpen ? 'open' : ''}`} onClick={toggleMenu}>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

        <div className={`mobile-backdrop ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(false)}></div>

        <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
          <div style={{ width: '100%', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#64748b', fontWeight: '600' }}>{t('landing.nav.menu')}</span>
          </div>
          <span className="mobile-nav-link" onClick={() => { navigate('/'); setIsMenuOpen(false); }}>{t('landing.nav.home')}</span>
          <span className="mobile-nav-link" onClick={() => { navigate('/'); setIsMenuOpen(false); }}>{t('landing.nav.features')}</span>
          <span className="mobile-nav-link" onClick={() => { navigate('/'); setIsMenuOpen(false); }}>{t('landing.nav.pricing')}</span>
          <span className="mobile-nav-link" onClick={() => { navigate('/'); setIsMenuOpen(false); }}>{t('landing.nav.about')}</span>
          <span className="mobile-nav-link" onClick={() => { navigate('/contato'); setIsMenuOpen(false); }}>{t('landing.nav.contact')}</span>
          <button onClick={() => { navigate('/login'); setIsMenuOpen(false); }} className="btn-mobile-login">
            {t('landing.nav.login')}
          </button>
        </div>
      </header>

      <style>{`
        /* Header Styles */
        .header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 5%; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); background-color: rgba(10, 10, 12, 0.3); position: fixed; top: 0; left: 0; width: 100%; box-sizing: border-box; z-index: 1000; border-bottom: 1px solid rgba(255, 255, 255, 0.03); box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1); transition: all 0.3s ease; }
        .header-logo { display: flex; align-items: center; gap: 12px; z-index: 1001; }
        .header-nav { display: flex; gap: 2rem; align-items: center; }
        .hamburger-btn { display: none; background: none; border: none; cursor: pointer; z-index: 1001; padding: 0.5rem; }
        .hamburger-line { display: block; width: 25px; height: 2px; background-color: white; margin: 5px 0; transition: all 0.3s ease; }
        .hamburger-btn.open .hamburger-line:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
        .hamburger-btn.open .hamburger-line:nth-child(2) { opacity: 0; }
        .hamburger-btn.open .hamburger-line:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }
        .mobile-menu { position: fixed; top: 0; right: 0; width: 85%; max-width: 350px; height: 100vh; background: linear-gradient(to bottom, #0f172a, #020617); display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-start; padding: 6rem 2rem 2rem 2rem; transform: translateX(100%); transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); z-index: 999; box-shadow: -10px 0 30px rgba(0,0,0,0.5); border-left: 1px solid rgba(255,255,255,0.05); }
        .mobile-menu.open { transform: translateX(0); }
        .mobile-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 998; opacity: 0; visibility: hidden; transition: all 0.3s ease; }
        .mobile-backdrop.open { opacity: 1; visibility: visible; }
        .mobile-nav-link { font-size: 1.3rem; color: #ffffff; text-decoration: none; font-weight: 500; width: 100%; padding: 1.2rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); transition: all 0.3s ease; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
        .mobile-nav-link:hover { color: white; padding-left: 10px; background: linear-gradient(90deg, rgba(59,130,246,0.05), transparent); }
        .btn-mobile-login { width: 100%; margin-top: 2rem; padding: 1rem; border-radius: 12px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border: none; font-weight: 600; font-size: 1.1rem; cursor: pointer; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4); transition: transform 0.2s; }
        .btn-mobile-login:active { transform: scale(0.98); }
        .nav-link { cursor: pointer; color: #ffffff; font-weight: 500; transition: color 0.3s ease; position: relative; font-size: 0.95rem; }
        .nav-link:hover { color: white; }
        .nav-link::after { content: ''; position: absolute; width: 0; height: 2px; bottom: -4px; left: 0; background-color: #3b82f6; transition: width 0.3s ease; }
        .nav-link:hover::after { width: 100%; }
        .btn-login { background-color: white; color: #0a0a0c; padding: 0.7rem 2rem; border-radius: 50px; font-weight: 600; border: none; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 14px 0 rgba(0,0,0,0.39); }
        .btn-login:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(255,255,255,0.23); background-color: #f8fafc; }
        @media (max-width: 768px) { .header { padding: 0.8rem 1rem; } .header-nav { display: none; } .hamburger-btn { display: block; } }

        .login-container {
          min-height: 100vh;
          width: 100%;
          background-color: #0a0a0c;
          background-image: radial-gradient(circle at center, #1e3a8a 0%, #0a0a0c 70%);
          background-size: 200% 200%;
          animation: wanderSpotlight 10s ease-in-out infinite;
          color: white;
          font-family: 'Inter', sans-serif;
          display: flex;
          flex-direction: column;
          padding: 5.5rem 2rem 2rem 2rem;
          box-sizing: border-box;
          position: relative;
        }

        .split-layout {
          display: flex;
          width: 100%;
          max-width: 1200px;
          gap: 4rem;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          margin: auto;
        }

        .center-content {
            width: 100%;
            max-width: 450px;
        }

        .login-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 2rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .card-title {
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          text-align: center;
          color: white;
        }

        .card-subtitle {
          font-size: 0.95rem;
          color: white;
          margin-bottom: 2rem;
          text-align: center;
          line-height: 1.5;
        }

        .input-group {
          margin-bottom: 1.5rem;
        }

        label {
          display: block;
          font-size: 0.85rem;
          color: white;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        input {
          width: 100%;
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 0.75rem 1rem;
          color: #0f172a;
          outline: none;
          transition: all 0.3s ease;
          box-sizing: border-box;
          font-size: 0.95rem;
        }

        input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }

        .btn-submit {
          width: 100%;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border: none;
          padding: 1rem;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
        }

        .btn-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.4);
        }

        .back-link {
            display: block;
            text-align: center;
            margin-top: 1.5rem;
            color: #94a1b2;
            text-decoration: none;
            font-size: 0.9rem;
            transition: color 0.3s;
            cursor: pointer;
        }

        .back-link:hover {
            color: white;
            text-decoration: underline;
        }

        .success-box {
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.2);
            color: #34d399;
            padding: 1rem;
            border-radius: 12px;
            margin-bottom: 1.5rem;
            text-align: center;
            font-size: 0.95rem;
        }

        @keyframes wanderSpotlight {
          0% { background-position: 50% 50%; }
          50% { background-position: 80% 80%; }
          100% { background-position: 50% 50%; }
        }
      `}</style>

      <div className="split-layout">
        <div className="center-content">
            <div className="login-card">
                <h2 className="card-title">{t('recover.title')}</h2>
                <p className="card-subtitle">{t('recover.subtitle')}</p>

                {submitted ? (
                    <div className="success-box">
                        {t('recover.success_message')}
                    </div>
                ) : (
                    <form onSubmit={handleRecover}>
                        <div className="input-group">
                            <label htmlFor="email">{t('recover.email_label')}</label>
                            <input 
                                type="email" 
                                id="email" 
                                placeholder={t('recover.email_placeholder')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                            />
                        </div>
                        
                        <button type="submit" className="btn-submit">
                            {t('recover.submit_btn')}
                        </button>
                    </form>
                )}

                <div className="back-link" onClick={() => navigate('/login')}>
                    {t('recover.back_login')}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default RecuperarSenha;