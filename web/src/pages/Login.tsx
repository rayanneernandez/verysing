import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import logoPng from '../assets/logo.png';
import axios from 'axios';

// Configuration for phone masks and languages by country
const COUNTRY_CONFIG: Record<string, { 
  lang: 'pt' | 'en' | 'es' | 'fr', 
  maxLength: number, 
  placeholder: string,
  format: (value: string) => string 
}> = {
  'Brasil': {
    lang: 'pt',
    maxLength: 11,
    placeholder: '(00) 00000-0000',
    format: (value) => {
      value = value.replace(/\D/g, '');
      if (value.length > 11) value = value.slice(0, 11);
      if (value.length > 10) return value.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      if (value.length > 6) return value.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
      if (value.length > 2) return value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
      if (value.length > 0) return value.replace(/^(\d{0,2})/, '($1');
      return value;
    }
  },
  'Estados Unidos': {
    lang: 'en',
    maxLength: 10,
    placeholder: '(000) 000-0000',
    format: (value) => {
      value = value.replace(/\D/g, '');
      if (value.length > 10) value = value.slice(0, 10);
      if (value.length > 6) return value.replace(/^(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
      if (value.length > 3) return value.replace(/^(\d{3})(\d{0,3})/, '($1) $2');
      if (value.length > 0) return value.replace(/^(\d{0,3})/, '($1');
      return value;
    }
  },
  'Portugal': {
    lang: 'pt',
    maxLength: 9,
    placeholder: '000 000 000',
    format: (value) => {
      value = value.replace(/\D/g, '');
      if (value.length > 9) value = value.slice(0, 9);
      if (value.length > 6) return value.replace(/^(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
      if (value.length > 3) return value.replace(/^(\d{3})(\d{0,3})/, '$1 $2');
      return value;
    }
  },
  'Espanha': {
    lang: 'es',
    maxLength: 9,
    placeholder: '000 000 000',
    format: (value) => {
      value = value.replace(/\D/g, '');
      if (value.length > 9) value = value.slice(0, 9);
      if (value.length > 6) return value.replace(/^(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
      if (value.length > 3) return value.replace(/^(\d{3})(\d{0,3})/, '$1 $2');
      return value;
    }
  },
  'França': {
    lang: 'fr',
    maxLength: 9,
    placeholder: '00 00 00 00 00',
    format: (value) => {
      value = value.replace(/\D/g, '');
      if (value.length > 9) value = value.slice(0, 9);
      return value.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
    }
  },
  'Reino Unido': {
    lang: 'en',
    maxLength: 10,
    placeholder: '0000 000000',
    format: (value) => {
      value = value.replace(/\D/g, '');
      if (value.length > 10) value = value.slice(0, 10);
      if (value.length > 4) return value.replace(/^(\d{4})(\d{0,6})/, '$1 $2');
      return value;
    }
  },
  'Argentina': {
    lang: 'es',
    maxLength: 10,
    placeholder: '0000-0000',
    format: (value) => {
      value = value.replace(/\D/g, '');
      if (value.length > 10) value = value.slice(0, 10);
      if (value.length > 4) return value.replace(/^(\d{4})(\d{0,4})/, '$1-$2');
      return value;
    }
  },
  'Chile': {
    lang: 'es',
    maxLength: 9,
    placeholder: '0 0000 0000',
    format: (value) => {
      value = value.replace(/\D/g, '');
      if (value.length > 9) value = value.slice(0, 9);
      if (value.length > 1) return value.replace(/^(\d{1})(\d{0,4})(\d{0,4})/, '$1 $2 $3').trim();
      return value;
    }
  }
};

function Login() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Brasil');
  const [cpf, setCpf] = useState('');
  const [plano, setPlano] = useState('gratuito');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<'error' | 'success'>('error');

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 14) value = value.slice(0, 14);
    
    if (value.length <= 11) {
      // CPF Mask: 000.000.000-00
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      // CNPJ Mask: 00.000.000/0000-00
      value = value.replace(/^(\d{2})(\d)/, '$1.$2');
      value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
      value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
      value = value.replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }    
    setCpf(value);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const config = COUNTRY_CONFIG[country] || COUNTRY_CONFIG['Brasil'];
    setPhone(config.format(e.target.value));
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value;
    setCountry(newCountry);
    setPhone(''); // Clear phone on country change to avoid mask conflicts
    
    const config = COUNTRY_CONFIG[newCountry];
    if (config) {
      setLanguage(config.lang);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMessage(null);

    if (!isLogin) {
      if (password !== confirmPassword) {
        setAlertType('error');
        setAlertMessage('As senhas não conferem.');
        return;
      }

      const nomeCompleto = `${firstName} ${lastName}`.trim();
      const cpfLimpo = cpf.replace(/\D/g, '');

      try {
        await axios.post('http://localhost:8000/usuarios', {
          nome: nomeCompleto,
          email,
          cpf: cpfLimpo,
          senha: password,
          tipoPlano: plano
        });

        if (nomeCompleto) {
          localStorage.setItem('userName', nomeCompleto);
        }
        localStorage.setItem('userPlan', plano);
        localStorage.setItem('userEmail', email);
        if (phone) {
          localStorage.setItem('userPhone', phone);
        }

        if (plano === 'gratuito') {
          navigate('/app');
        } else {
          navigate('/pagamento', { state: { plano, email } });
        }
        return;
      } catch (err: any) {
        console.error('Erro detalhado:', err);
        let mensagem = 'Erro ao criar conta. Verifique os dados e tente novamente.';

        if (err.response) {
          // O servidor respondeu com um status de erro
          const data = err.response.data;
          if (data && data.detail) {
            if (typeof data.detail === 'string') {
              mensagem = data.detail;
            } else if (Array.isArray(data.detail)) {
              // Erros de validação do FastAPI/Pydantic
              mensagem = data.detail.map((item: any) => `${item.loc?.[1] || 'Campo'}: ${item.msg}`).join('\n');
            } else {
              mensagem = JSON.stringify(data.detail);
            }
          }
        } else if (err.request) {
          // A requisição foi feita mas não houve resposta
          mensagem = 'Erro de conexão com o servidor. Verifique se o backend está rodando na porta 8000.';
        } else {
          // Erro na configuração da requisição
          mensagem = err.message;
        }

        setAlertType('error');
        setAlertMessage(mensagem);
        return;
      }
    }

    if (isLogin) {
      if (!localStorage.getItem('userName')) {
        const nameFromEmail = email ? email.split('@')[0] : 'Usuário';
        const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
        localStorage.setItem('userName', formattedName);
      }
      if (email) {
        localStorage.setItem('userEmail', email);
      }
    }

    navigate('/app');
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
            <button onClick={() => setIsLogin(!isLogin)} className="btn-login" style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}>
              {isLogin ? t('btn.create_account') : t('btn.login')}
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
          <button onClick={() => { setIsLogin(!isLogin); setIsMenuOpen(false); }} className="btn-mobile-login">
            {isLogin ? t('btn.create_account') : t('btn.login')}
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

        .btn-back {
          position: relative;
          align-self: flex-start;
          margin-bottom: 2rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #94a1b2;
          padding: 0.8rem 1.5rem;
          border-radius: 50px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          font-weight: 500;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          z-index: 100;
        }

        .btn-back:hover {
          background: rgba(255,255,255,0.1);
          color: white;
          transform: translateX(-5px);
        }
        
        @keyframes wanderSpotlight {
          0% { background-position: 50% 50%; }
          20% { background-position: 20% 20%; }
          40% { background-position: 80% 30%; }
          60% { background-position: 70% 80%; }
          80% { background-position: 30% 70%; }
          100% { background-position: 50% 50%; }
        }

        .split-layout {
          display: flex;
          width: 100%;
          max-width: 1200px;
          gap: 4rem;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          margin: auto; /* Centraliza vertical e horizontalmente no espaço restante */
        }

        .left-content {
          flex: 1;
          min-width: 300px;
        }

        .right-content {
          flex: 0 0 450px;
          width: 100%;
          max-width: 450px;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 3rem;
        }

        .logo-box {
          width: 40px; 
          height: 40px; 
          background: linear-gradient(135deg, #3b82f6, #1e3a8a);
          border-radius: 12px; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.5);
        }

        h1 {
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          color: white;
        }

        .text-gradient {
          background: linear-gradient(to right, #60a5fa, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        p.description {
          color: #94a1b2;
          font-size: 1.1rem;
          line-height: 1.6;
          max-width: 500px;
          margin-bottom: 3rem;
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: #cbd5e1;
          font-size: 1rem;
        }

        .feature-icon {
          width: 32px;
          height: 32px;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3b82f6;
        }

        .login-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 2rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .welcome-text {
          font-size: 0.9rem;
          color: #ffffff !important;
          margin-bottom: 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .card-title {
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: #ffffff !important;
        }

        .form-row {
          display: flex;
          gap: 0.8rem;
        }
        
        .form-row .input-group {
          flex: 1;
        }

        .input-group {
          margin-bottom: 0.8rem;
        }

        label {
          display: block;
          font-size: 0.85rem;
          color: #ffffff !important;
          margin-bottom: 0.2rem;
          font-weight: 500;
        }

        .input-wrapper {
          position: relative;
        }

        input, select {
          width: 100%;
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 0.75rem 1rem 0.75rem 3.5rem !important;
          color: #0f172a !important;
          outline: none;
          transition: all 0.3s ease;
          box-sizing: border-box;
          font-size: 0.95rem;
          appearance: none;
        }

        input::placeholder {
          color: #94a1b2 !important;
          opacity: 1;
        }

        input:focus, select:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
          background-color: #ffffff;
        }

        /* Autofill fix */
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px white inset !important;
            -webkit-text-fill-color: #0f172a !important;
        }

        select option {
          background-color: #1e293b;
          color: white;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
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
          margin-top: 1rem;
          box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
        }

        .btn-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.4);
        }

        .toggle-text {
          text-align: center;
          margin-top: 1rem;
          color: #ffffff !important;
          font-size: 0.9rem;
        }

        .toggle-link {
          color: #60a5fa;
          cursor: pointer;
          font-weight: 600;
          margin-left: 0.5rem;
        }
        .toggle-link:hover {
          text-decoration: underline;
        }

        @media (max-width: 900px) {
          .login-container {
            padding-top: 1rem;
          }

          .form-row {
            flex-direction: column;
            gap: 0;
          }

          .split-layout {
            flex-direction: column;
            gap: 2rem;
          }
          .left-content {
            text-align: center;
          }
          .logo {
            justify-content: center;
          }
          p.description {
            margin: 0 auto;
          }
        }
      `}</style>

      <div className="split-layout">
        
        {/* Lado Esquerdo - Marketing */}
        <div className="left-content">
          <h1>
            Assinatura digital<br/>
            <span className="text-gradient">simples e segura</span>
          </h1>
          
          <p className="description">
            Gerencie seus contratos de forma profissional. 
            Assine e acompanhe documentos de qualquer lugar do mundo.
          </p>

          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <span>Assinatura ultra rápida em segundos</span>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
              </div>
              <span>Segurança de nível bancário</span>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </div>
              <span>Acesso global de qualquer dispositivo</span>
            </div>
          </div>
        </div>

        {/* Lado Direito - Form de Login */}
        <div className="right-content">
          <div className="login-card">
            <div className="welcome-text">
              {isLogin ? 'Bem-vindo de volta' : 'Comece agora'}
            </div>
            <div className="card-title">
              {isLogin ? 'Entre na sua conta' : 'Crie sua conta grátis'}
            </div>

            {alertMessage && (
              <div
                style={{
                  marginBottom: '1rem',
                  borderRadius: '12px',
                  padding: '0.75rem 1rem',
                  border:
                    alertType === 'error'
                      ? '1px solid rgba(248,113,113,0.7)'
                      : '1px solid rgba(52,211,153,0.7)',
                  background:
                    alertType === 'error'
                      ? 'rgba(248,113,113,0.12)'
                      : 'rgba(52,211,153,0.12)',
                  color: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  fontSize: '0.9rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      width: '9px',
                      height: '9px',
                      borderRadius: '999px',
                      backgroundColor: alertType === 'error' ? '#f97373' : '#4ade80'
                    }}
                  ></span>
                  <span style={{ color: '#fee2e2' }}>{alertMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAlertMessage(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fecaca',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            <form onSubmit={handleAuth}>
              {!isLogin && (
                <div className="form-row">
                  <div className="input-group">
                    <label>Nome</label>
                    <div className="input-wrapper">
                      <span className="input-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      </span>
                      <input 
                        type="text" 
                        placeholder="Nome" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required={!isLogin}
                      />
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Sobrenome</label>
                    <div className="input-wrapper">
                      <span className="input-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      </span>
                      <input 
                        type="text" 
                        placeholder="Sobrenome" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required={!isLogin}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="input-group">
                <label>Email</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  </span>
                  <input 
                    type="email" 
                    placeholder="seu@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {!isLogin && (
                <>
                  <div className="form-row">
                    <div className="input-group">
                      <label>Telefone</label>
                      <div className="input-wrapper">
                        <span className="input-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        </span>
                        <input 
                          type="tel" 
                          placeholder={COUNTRY_CONFIG[country]?.placeholder || "(00) 00000-0000"} 
                          value={phone}
                          onChange={handlePhoneChange}
                          required={!isLogin}
                        />
                      </div>
                    </div>
                    <div className="input-group">
                      <label>País</label>
                      <div className="input-wrapper">
                        <span className="input-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                        </span>
                        <select 
                          value={country}
                          onChange={handleCountryChange}
                          required={!isLogin}
                        >
                          <option value="Brasil">Brasil</option>
                          <option value="Estados Unidos">Estados Unidos</option>
                          <option value="Portugal">Portugal</option>
                          <option value="Espanha">Espanha</option>
                          <option value="França">França</option>
                          <option value="Reino Unido">Reino Unido</option>
                          <option value="Argentina">Argentina</option>
                          <option value="Chile">Chile</option>
                        </select>
                        <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="input-group">
                    <label style={{ color: '#ffffff', marginBottom: '0.2rem', display: 'block', fontWeight: '500', fontSize: '0.85rem' }} >CPF/CNPJ</label>
                    <div className="input-wrapper">
                      <span className="input-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      </span>
                      <input 
                        type="text" 
                        placeholder="000.000.000-00 ou CNPJ" 
                        value={cpf}
                        onChange={handleCpfChange}
                        required={!isLogin}
                        maxLength={18}
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label style={{ color: '#ffffff', marginBottom: '0.5rem', display: 'block' }}>Escolha seu Plano</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      {['gratuito', 'profissional', 'empresarial'].map((p) => (
                        <div
                          key={p}
                          onClick={() => setPlano(p)}
                          style={{
                            cursor: 'pointer',
                            borderRadius: '12px',
                            padding: '12px 8px',
                            textAlign: 'center',
                            transition: 'all 0.2s ease',
                            border: plano === p ? '2px solid #60a5fa' : '1px solid rgba(255,255,255,0.2)',
                            background: plano === p ? 'rgba(37, 99, 235, 0.2)' : 'rgba(255,255,255,0.03)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: '70px'
                          }}
                        >
                          <span style={{ 
                            color: '#ffffff', 
                            fontWeight: plano === p ? '700' : '500', 
                            fontSize: '0.9rem',
                            textTransform: 'capitalize',
                            marginBottom: '4px'
                          }}>
                            {p}
                          </span>
                          <span style={{ 
                            color: '#ffffff', 
                            fontSize: '0.75rem', 
                            opacity: plano === p ? 1 : 0.8 
                          }}>
                            {p === 'gratuito' && 'R$0/mês'}
                            {p === 'profissional' && 'R$29/mês'}
                            {p === 'empresarial' && 'R$99/mês'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="input-group">
                <label>Senha</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </span>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="input-group">
                  <label>Confirmar Senha</label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    </span>
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required={!isLogin}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {showConfirmPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <button type="submit" className="btn-submit">
                {isLogin ? 'Entrar →' : 'Criar Conta →'}
              </button>

              {isLogin && (
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <span style={{ color: '#ffffff', fontSize: '0.9rem' }}>
                    {t('recover.forgot_password_text')}
                    <span 
                      className="toggle-link"
                      onClick={() => navigate('/recuperar-senha')} 
                    >
                      {t('recover.click_here')}
                    </span>
                  </span>
                </div>
              )}
            </form>

            <div className="toggle-text">
              {isLogin ? 'Não tem conta?' : 'Já tem uma conta?'}
              <span className="toggle-link" onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? 'Criar agora' : 'Fazer login'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;