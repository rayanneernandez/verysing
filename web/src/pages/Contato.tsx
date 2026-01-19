import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import logoPng from '../assets/logo.png';
import '../App.css';

function Contato() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const irParaApp = () => {
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the data
    alert(t('contact.alert.success'));
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="contact-container">
      <style>{`
        .contact-container {
          background-color: #0a0a0c;
          color: white;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
          display: flex;
          flex-direction: column;
        }

        /* Explicitly force white text for headings to override global styles */
        .contact-container h1, 
        .contact-container h2, 
        .contact-container h3 {
          color: white !important;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 5%;
          
          /* Glassmorphism Effect */
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          background-color: rgba(10, 10, 12, 0.3);
          
          /* Fixed Position */
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

        .header-nav {
          display: flex;
          gap: 2rem;
          align-items: center;
        }

        .nav-link {
          cursor: pointer;
          color: #94a1b2;
          font-weight: 500;
          transition: color 0.3s ease;
          position: relative;
          font-size: 0.95rem;
          text-decoration: none;
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

        /* Hamburger Button */
        .hamburger-btn {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          z-index: 1001;
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

        .hamburger-btn.open .hamburger-line:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }
        .hamburger-btn.open .hamburger-line:nth-child(2) {
          opacity: 0;
        }
        .hamburger-btn.open .hamburger-line:nth-child(3) {
          transform: rotate(-45deg) translate(5px, -5px);
        }

        /* Mobile Menu */
        .mobile-menu {
          position: fixed;
          top: 0;
          right: 0;
          width: 85%;
          max-width: 350px;
          height: 100vh;
          background: linear-gradient(to bottom, #0f172a, #020617);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
          padding: 6rem 2rem 2rem 2rem;
          transform: translateX(100%);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 999;
          box-shadow: -10px 0 30px rgba(0,0,0,0.5);
          border-left: 1px solid rgba(255,255,255,0.05);
        }

        .mobile-menu.open {
          transform: translateX(0);
        }

        .mobile-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          z-index: 998;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }

        .mobile-backdrop.open {
          opacity: 1;
          visibility: visible;
        }

        .mobile-nav-link {
          font-size: 1.3rem;
          color: #cbd5e1;
          text-decoration: none;
          font-weight: 500;
          width: 100%;
          padding: 1.2rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: all 0.3s ease;
          display: flex;
          justify-content: space-between;
          align-items: center;
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
        }

        .btn-login {
          background-color: white;
          color: #0a0a0c;
          padding: 0.7rem 2rem;
          border-radius: 50px;
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
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          color: #e2e8f0; /* Lighter color for better contrast */
          font-weight: 500;
        }

        .form-input, .form-textarea {
          width: 100%;
          padding: 0.8rem 1rem;
          background-color: rgba(255, 255, 255, 0.08); /* Slightly lighter background */
          border: 1px solid rgba(255, 255, 255, 0.2); /* Lighter border */
          border-radius: 8px;
          color: white;
          font-family: inherit;
          transition: all 0.3s ease;
        }

        .form-input::placeholder, .form-textarea::placeholder {
          color: #94a1b2;
        }

        .form-input:focus, .form-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          background-color: rgba(59, 130, 246, 0.05);
        }

        .btn-submit {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .btn-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
      `}</style>

      <header className="header">
        <div className="header-logo">
          <div style={{ width: '150px', height: '80px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => navigate('/')}>
            <img src={logoPng} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer' }} />
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="header-nav">
            <a href="/" className="nav-link">{t('landing.nav.home')}</a>
            <a href="/#recursos" className="nav-link">{t('landing.nav.features')}</a>
            <a href="/#precos" className="nav-link">{t('landing.nav.pricing')}</a>
            <a href="/#sobre" className="nav-link">{t('landing.nav.about')}</a>
            <a href="#" className="nav-link" style={{ color: 'white' }}>{t('landing.nav.contact')}</a>
            <button onClick={irParaApp} className="btn-login" style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}>{t('landing.nav.login')}</button>
        </div>

        {/* Mobile Hamburger Button */}
        <button className={`hamburger-btn ${isMenuOpen ? 'open' : ''}`} onClick={toggleMenu}>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

        {/* Mobile Menu Backdrop */}
        <div 
          className={`mobile-backdrop ${isMenuOpen ? 'open' : ''}`} 
          onClick={() => setIsMenuOpen(false)}
        ></div>

        {/* Mobile Menu Drawer */}
        <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
          <div style={{ width: '100%', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#64748b', fontWeight: '600' }}>{t('landing.nav.menu')}</span>
          </div>
          
          <a href="/" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>{t('landing.nav.home')}</a>
          <a href="/#recursos" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>{t('landing.nav.features')}</a>
          <a href="/#precos" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>{t('landing.nav.pricing')}</a>
          <a href="/#sobre" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>{t('landing.nav.about')}</a>
          <a href="#" className="mobile-nav-link" style={{ color: 'white' }} onClick={() => setIsMenuOpen(false)}>{t('landing.nav.contact')}</a>
          
          <button onClick={() => { irParaApp(); setIsMenuOpen(false); }} className="btn-mobile-login">
            {t('landing.nav.platform')}
          </button>
        </div>
      </header>

      <main style={{ flex: 1, padding: '9rem 1rem 4rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <h1 style={{ textAlign: 'center', fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: '1rem' }}>
          {t('contact.title')}
        </h1>
        <p style={{ textAlign: 'center', color: '#94a1b2', marginBottom: '4rem', maxWidth: '600px', margin: '0 auto 4rem' }}>
          {t('contact.subtitle')}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'start' }}>
          
          {/* Form Section */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem', textAlign: 'center' }}>{t('contact.form.title')}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">{t('contact.form.name')}</label>
                <input 
                  type="text" 
                  name="name" 
                  className="form-input" 
                  placeholder={t('contact.form.name_placeholder')}
                  value={formData.name}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('contact.form.email')}</label>
                <input 
                  type="email" 
                  name="email" 
                  className="form-input" 
                  placeholder={t('contact.form.email_placeholder')}
                  value={formData.email}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('contact.form.subject')}</label>
                <input 
                  type="text" 
                  name="subject" 
                  className="form-input" 
                  placeholder={t('contact.form.subject_placeholder')}
                  value={formData.subject}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('contact.form.message')}</label>
                <textarea 
                  name="message" 
                  className="form-textarea" 
                  rows={5} 
                  placeholder={t('contact.form.message_placeholder')}
                  value={formData.message}
                  onChange={handleChange}
                  required 
                ></textarea>
              </div>
              <button type="submit" className="btn-submit">{t('contact.form.submit')}</button>
            </form>
          </div>

          {/* Info Section (Right Side) */}
          <div style={{ paddingTop: '1rem' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: 'white', lineHeight: '1.2' }}>
              {t('contact.info.title_start')} <span style={{ color: '#3b82f6' }}>{t('contact.info.title_middle')}</span>{t('contact.info.title_connector')}<br />
              {t('contact.info.title_end')} <span style={{ color: '#3b82f6' }}>{t('contact.info.title_end')}</span>.
            </h2>
            
            <p style={{ color: '#94a1b2', lineHeight: '1.8', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
              {t('contact.info.desc')}
            </p>

            <div style={{ 
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05))', 
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '16px',
              padding: '2rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.2)', borderRadius: '50%', padding: '10px', display: 'flex' }}>
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>{t('contact.info.response_title')}</h3>
              </div>
              <p style={{ color: '#cbd5e1', margin: 0, lineHeight: '1.6' }}>
                {t('contact.info.response_desc1')}
                <br/><br/>
                <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>{t('contact.info.response_desc2')}</span>
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer style={{ textAlign: 'center', padding: '2rem', borderTop: '1px solid #1f1f22', color: '#52525b', marginTop: 'auto' }}>
        © 2026 VERYSING. Todos os direitos reservados.
      </footer>
    </div>
  );
}

export default Contato;