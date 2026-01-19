import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';

const API_URL = import.meta.env.VITE_API_URL || '';
import logoPng from '../assets/logo.png';
import '../App.css';

type LocationState = {
  plano?: 'gratuito' | 'profissional' | 'empresarial' | string;
  email?: string;
};

const PLAN_CONFIG: Record<string, { label: string; price: string; description: string }> = {
  gratuito: {
    label: 'Plano Gratuito',
    price: 'R$ 0,00/mês',
    description: 'Plano gratuito já ativado, sem necessidade de pagamento.'
  },
  profissional: {
    label: 'Plano Profissional',
    price: 'R$ 19,90/mês',
    description: 'Ideal para profissionais e pequenos negócios com uso frequente.'
  },
  empresarial: {
    label: 'Plano Empresarial',
    price: 'R$ 39,90/mês',
    description: 'Para equipes e empresas que precisam de recursos avançados.'
  }
};

const PLAN_KEYS: Record<string, { label: string; desc: string }> = {
  gratuito: { label: 'payment.plan_free', desc: 'payment.desc_free' },
  profissional: { label: 'payment.plan_pro', desc: 'payment.desc_pro' },
  empresarial: { label: 'payment.plan_ent', desc: 'payment.desc_ent' }
};

function Pagamento() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const location = useLocation();
  const { plano, email } = (location.state || {}) as LocationState;

  const storedPlan = typeof window !== 'undefined' ? localStorage.getItem('userPlan') : null;
  const effectivePlan = plano && PLAN_CONFIG[plano]
    ? plano
    : storedPlan && PLAN_CONFIG[storedPlan]
    ? storedPlan
    : null;

  if (!effectivePlan) {
    navigate('/login');
    return null;
  }

  const [selectedPlan, setSelectedPlan] = useState<string>(effectivePlan || 'profissional');
  const currentPlan = PLAN_CONFIG[selectedPlan];

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cartao' | 'boleto' | 'pix'>('cartao');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<'error' | 'success'>('error');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // PIX State
  const [userName, setUserName] = useState('');
  const [userCpf, setUserCpf] = useState('');
  const [pixData, setPixData] = useState<{ qr_code_base64: string; payload_pix: string; txid: string; valor: number } | null>(null);
  const [contratoUrl, setContratoUrl] = useState<string | null>(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const getPlanPrice = () => {
    if (!currentPlan) return { value: '0,00', period: 'mês' };
    const basePrice = parseFloat(currentPlan.price.replace('R$ ', '').replace(',', '.').split('/')[0]);
    
    if (billingCycle === 'annual') {
      const annualPrice = (basePrice * 12 * 0.9).toFixed(2).replace('.', ',');
      return { value: annualPrice, period: 'ano', fullLabel: `R$ ${annualPrice}/ano` };
    }
    return { value: basePrice.toFixed(2).replace('.', ','), period: 'mês', fullLabel: currentPlan.price };
  };

  const planPrice = getPlanPrice();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMessage(null);

    if (!cardNumber || !cardName || !expiry || !cvv) {
      setAlertType('error');
      setAlertMessage('Preencha todos os dados do cartão para continuar.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      if (selectedPlan) {
        localStorage.setItem('userPlan', selectedPlan);
      }
      navigate('/app');
    }, 1200);
  };

  const handleBoleto = () => {
    setAlertMessage(null);
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      if (selectedPlan) {
        localStorage.setItem('userPlan', selectedPlan);
      }
      navigate('/app');
    }, 1200);
  };

  const handlePix = async () => {
    setAlertMessage(null);
    if (!userName || !userCpf) {
      setAlertType('error');
      setAlertMessage('Nome e CPF são obrigatórios para gerar o PIX e o contrato.');
      return;
    }

    setIsProcessing(true);
    try {
      const priceInfo = getPlanPrice();
      // Converte o valor para float (ex: "19,90" -> 19.90)
      const valor = parseFloat(priceInfo.value.replace(',', '.'));

      const response = await axios.post(`${API_URL}/api/pagamento/pix`, {
        nome: userName,
        cpf: userCpf,
        plano: selectedPlan,
        valor: valor
      });

      setPixData(response.data);
    } catch (error) {
      console.error('Erro ao gerar PIX:', error);
      setAlertType('error');
      setAlertMessage('Erro ao comunicar com o servidor. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPix = async () => {
    if (!pixData) return;
    setAlertMessage(null);
    setIsProcessing(true);

    try {
      const response = await axios.post(`${API_URL}/api/pagamento/confirmar`, {
        txid: pixData.txid,
        nome: userName,
        cpf: userCpf,
        plano: selectedPlan,
        email: email
      });

      setContratoUrl(`${API_URL}/download/${response.data.contrato_arquivo}`);
      setAlertType('success');
      setAlertMessage('Pagamento confirmado e contrato gerado com sucesso!');
      
      // Salva o plano no localStorage para liberar acesso
      if (selectedPlan) {
        localStorage.setItem('userPlan', selectedPlan);
      }
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      setAlertType('error');
      setAlertMessage('Erro ao confirmar pagamento. Verifique se o pagamento foi realizado.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!effectivePlan) {
    navigate('/login');
    return null;
  }

  return (
    <div className="login-container">
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
        .payment-layout { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1.05fr); gap: 1.25rem; align-items: stretch; }
        @media (max-width: 1100px) { .payment-layout { grid-template-columns: minmax(0, 1fr); } }
      `}</style>

      <main
        style={{
          flex: 1,
          padding: '6rem 1.5rem 2rem',
          maxWidth: '100%',
          margin: '0 auto',
          width: '100%',
          minHeight: '100vh',
          boxSizing: 'border-box',
          overflowX: 'hidden'
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            width: '100%'
          }}
        >
          <div
            style={{
              marginBottom: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              marginTop: '1rem'
            }}
          >
            <span
              style={{
                fontSize: '0.85rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'rgba(148,163,184,0.9)',
                fontWeight: 600
              }}
            >
              {t('payment.title')}
            </span>
            <h1
              style={{
                fontSize: '1.9rem',
                color: '#ffffff',
                fontWeight: 700
              }}
            >
              {t('payment.subtitle')}
            </h1>
          </div>

          <div className="payment-layout">
          <div
            style={{
              background: 'rgba(15,23,42,0.95)',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid rgba(148,163,184,0.35)',
              color: 'white',
              boxShadow: '0 10px 30px -5px rgba(15,23,42,0.5)'
            }}
          >
            <h2
              style={{
                fontSize: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#94a3b8',
                marginBottom: '0.5rem',
                fontWeight: 600
              }}
            >
              {t('payment.info_title')}
            </h2>
            <p style={{ color: '#e5e7eb', fontSize: '0.95rem', marginBottom: '0.75rem' }}>
              {t('payment.info_desc')}
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '1rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.75rem',
                  color: '#a5b4fc'
                }}
              >
                <span
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '999px',
                    border: '1px solid rgba(129,140,248,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem'
                  }}
                >
                  🔒
                </span>
                <span>{t('payment.secure')}</span>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '0.3rem 0.8rem',
                  borderRadius: '999px',
                  background: 'rgba(34,197,94,0.15)',
                  color: '#bbf7d0',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em'
                }}
              >
                {t(PLAN_KEYS[selectedPlan]?.label || 'payment.plan_pro')}
              </span>

              <div style={{ marginTop: '0.75rem' }}>
                <label
                  htmlFor="plan-select"
                  style={{
                    color: '#94a3b8',
                    fontSize: '0.8rem',
                    marginBottom: '0.4rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    display: 'block'
                  }}
                >
                  {t('payment.select_plan')}
                </label>
                <select
                  id="plan-select"
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 2.5rem 0.6rem 0.9rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(148,163,184,0.6)',
                    background: 'rgba(15,23,42,0.9)',
                    color: '#e5e7eb',
                    fontSize: '0.9rem',
                    outline: 'none',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.8rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.2em 1.2em'
                  }}
                >
                  <option value="gratuito">{t('payment.plan_free')}</option>
                  <option value="profissional">{t('payment.plan_pro')}</option>
                  <option value="empresarial">{t('payment.plan_ent')}</option>
                </select>
              </div>

              <div style={{ marginTop: '0.75rem', fontSize: '1.6rem', fontWeight: 700 }}>
                {planPrice.fullLabel}
              </div>
              <p style={{ color: '#cbd5e1', marginTop: '0.5rem' }}>
                {billingCycle === 'annual'
                  ? t('payment.billing_annual_discount')
                  : t(PLAN_KEYS[selectedPlan]?.desc || 'payment.desc_pro')}
              </p>
              {email && (
                <p style={{ color: '#94a3b8', marginTop: '0.5rem', fontSize: '0.95rem' }}>
                  {t('payment.account')} <span style={{ color: '#e5e7eb' }}>{email}</span>
                </p>
              )}
            </div>

            {selectedPlan === 'gratuito' ? (
              <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                  {t('payment.free_plan_info')}
                  <br />
                  {t('payment.free_plan_confirm_info')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsProcessing(true);
                    setTimeout(() => {
                      setIsProcessing(false);
                      localStorage.setItem('userPlan', 'gratuito');
                      navigate('/app');
                    }, 1200);
                  }}
                  disabled={isProcessing}
                  style={{
                    width: '100%',
                    padding: '0.95rem',
                    borderRadius: '999px',
                    border: 'none',
                    background: isProcessing
                      ? 'rgba(148,163,184,0.5)'
                      : 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '1rem',
                    cursor: isProcessing ? 'default' : 'pointer',
                    boxShadow: '0 10px 30px rgba(37,99,235,0.45)',
                    transition: 'all 0.2s ease',
                    marginBottom: '1rem'
                  }}
                >
                  {isProcessing ? 'Atualizando plano...' : t('payment.confirm_free')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/app')}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(148,163,184,0.6)',
                    background: 'transparent',
                    color: '#e2e8f0',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label
                    htmlFor="payment-method-select"
                    style={{
                      color: '#94a3b8',
                      fontSize: '0.8rem',
                      marginBottom: '0.4rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      display: 'block'
                    }}
                  >
                    {t('payment.method_label')}
                  </label>
                  <select
                    id="payment-method-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as 'cartao' | 'boleto' | 'pix')}
                    style={{
                      width: '100%',
                      padding: '0.6rem 2.5rem 0.6rem 0.9rem',
                      borderRadius: '999px',
                      border: '1px solid rgba(148,163,184,0.6)',
                      background: 'rgba(15,23,42,0.9)',
                      color: '#e5e7eb',
                      fontSize: '0.9rem',
                      outline: 'none',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.8rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.2em 1.2em'
                    }}
                  >
                    <option value="cartao">{t('payment.method_card')}</option>
                    <option value="boleto">{t('payment.method_boleto')}</option>
                    <option value="pix">{t('payment.method_pix')}</option>
                  </select>
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
              </>
            )}

            {selectedPlan !== 'gratuito' && paymentMethod === 'cartao' && (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.4rem',
                    fontSize: '0.9rem',
                    color: '#e2e8f0'
                  }}
                >
                  {t('payment.card_number')}
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length > 16) value = value.slice(0, 16);
                    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                    setCardNumber(value);
                  }}
                  maxLength={19}
                  placeholder="0000 0000 0000 0000"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(148,163,184,0.5)',
                    background: 'rgba(15,23,42,0.9)',
                    color: 'white',
                    outline: 'none',
                    fontSize: '0.95rem',
                    maxWidth: '100%',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.4rem',
                    fontSize: '0.9rem',
                    color: '#e2e8f0'
                  }}
                >
                  Nome impresso no cartão
                </label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Nome completo"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(148,163,184,0.5)',
                    background: 'rgba(15,23,42,0.9)',
                    color: 'white',
                    outline: 'none',
                    fontSize: '0.95rem',
                    maxWidth: '100%',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.4rem',
                      fontSize: '0.9rem',
                      color: '#e2e8f0'
                    }}
                  >
                    Validade (MM/AA)
                  </label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length > 4) value = value.slice(0, 4);
                      
                      if (value.length > 2) {
                        value = value.slice(0, 2) + '/' + value.slice(2);
                      }
                      setExpiry(value);
                    }}
                    maxLength={5}
                    placeholder="MM/AA"
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '10px',
                      border: '1px solid rgba(148,163,184,0.5)',
                      background: 'rgba(15,23,42,0.9)',
                      color: 'white',
                      outline: 'none',
                      fontSize: '0.95rem',
                      maxWidth: '100%',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ width: '120px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.4rem',
                      fontSize: '0.9rem',
                      color: '#e2e8f0'
                    }}
                  >
                    CVV
                  </label>
                  <input
                    type="password"
                    value={cvv}
                    onChange={(e) => {
                      const onlyNumbers = e.target.value.replace(/\D/g, '');
                      setCvv(onlyNumbers.slice(0, 3));
                    }}
                    maxLength={3}
                    inputMode="numeric"
                    placeholder="***"
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '10px',
                      border: '1px solid rgba(148,163,184,0.5)',
                      background: 'rgba(15,23,42,0.9)',
                      color: 'white',
                      outline: 'none',
                      fontSize: '0.95rem',
                      maxWidth: '100%',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                style={{
                  width: '100%',
                  padding: '0.95rem',
                  borderRadius: '999px',
                  border: 'none',
                  background: isProcessing
                    ? 'rgba(148,163,184,0.5)'
                    : 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: isProcessing ? 'default' : 'pointer',
                  boxShadow: '0 10px 30px rgba(37,99,235,0.45)',
                  transition: 'all 0.2s ease'
                }}
              >
                {isProcessing ? 'Processando...' : 'Pagar e ativar plano'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{
                  marginTop: '1rem',
                  width: '100%',
                  padding: '0.85rem',
                  borderRadius: '999px',
                  border: '1px solid rgba(148,163,184,0.6)',
                  background: 'transparent',
                  color: '#e2e8f0',
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  cursor: 'pointer'
                }}
              >
                Voltar
              </button>
            </form>
            )}

            {selectedPlan !== 'gratuito' && paymentMethod === 'boleto' && (
              <div>
                <p style={{ color: '#cbd5e1', marginBottom: '1rem', fontSize: '0.95rem' }}>
                  Geraremos um boleto simulado para pagamento do seu plano. Após a confirmação, seu acesso será liberado.
                </p>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleBoleto}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: '999px',
                    border: 'none',
                    background: isProcessing
                      ? 'rgba(148,163,184,0.5)'
                      : 'linear-gradient(135deg,#16a34a,#22c55e)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    cursor: isProcessing ? 'default' : 'pointer',
                    boxShadow: isProcessing ? 'none' : '0 8px 20px rgba(22,163,74,0.35)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isProcessing ? 'Gerando boleto...' : 'Gerar boleto e ativar plano'}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  style={{
                    marginTop: '1rem',
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(148,163,184,0.6)',
                    background: 'transparent',
                    color: '#e2e8f0',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    cursor: 'pointer'
                  }}
                >
                  Voltar
                </button>
              </div>
            )}

            {selectedPlan !== 'gratuito' && paymentMethod === 'pix' && (
              <div>
                <p style={{ color: '#cbd5e1', marginBottom: '1rem', fontSize: '0.95rem' }}>
                  Use o PIX para ativar seu plano de forma rápida. O contrato será gerado automaticamente após a confirmação.
                </p>

                {!pixData ? (
                  <>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: '#e2e8f0' }}>
                        Nome Completo (para o contrato)
                      </label>
                      <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Seu nome completo"
                        style={{
                          width: '100%', padding: '0.75rem 0.9rem', borderRadius: '10px',
                          border: '1px solid rgba(148,163,184,0.5)', background: 'rgba(15,23,42,0.9)',
                          color: 'white', outline: 'none', fontSize: '0.95rem', boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: '#e2e8f0' }}>
                        CPF (para o contrato)
                      </label>
                      <input
                        type="text"
                        value={userCpf}
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, '');
                          if (v.length > 11) v = v.slice(0, 11);
                          v = v.replace(/(\d{3})(\d)/, '$1.$2');
                          v = v.replace(/(\d{3})(\d)/, '$1.$2');
                          v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                          setUserCpf(v);
                        }}
                        placeholder="000.000.000-00"
                        style={{
                          width: '100%', padding: '0.75rem 0.9rem', borderRadius: '10px',
                          border: '1px solid rgba(148,163,184,0.5)', background: 'rgba(15,23,42,0.9)',
                          color: 'white', outline: 'none', fontSize: '0.95rem', boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handlePix}
                      style={{
                        width: '100%', padding: '0.95rem', borderRadius: '999px', border: 'none',
                        background: isProcessing ? 'rgba(148,163,184,0.5)' : 'linear-gradient(135deg,#3b82f6,#22c55e)',
                        color: 'white', fontWeight: 600, fontSize: '1rem', cursor: isProcessing ? 'default' : 'pointer',
                        boxShadow: '0 10px 30px rgba(56,189,248,0.45)', transition: 'all 0.2s ease'
                      }}
                    >
                      {isProcessing ? 'Gerando PIX...' : 'Gerar Pagamento PIX'}
                    </button>
                  </>
                ) : !contratoUrl ? (
                  <div style={{ textAlign: 'center', background: 'white', padding: '1.5rem', borderRadius: '12px' }}>
                    <p style={{ color: '#333', marginBottom: '1rem', fontWeight: 'bold' }}>Escaneie o QR Code para pagar</p>
                    <img
                      src={`data:image/png;base64,${pixData.qr_code_base64}`}
                      alt="QR Code PIX"
                      style={{ maxWidth: '200px', width: '100%', marginBottom: '1rem' }}
                    />
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ color: '#666', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Ou copie e cole o código abaixo:</p>
                      <textarea
                        readOnly
                        value={pixData.payload_pix}
                        onClick={(e) => e.currentTarget.select()}
                        style={{
                          width: '100%', height: '60px', padding: '0.5rem', fontSize: '0.8rem',
                          border: '1px solid #ddd', borderRadius: '8px', resize: 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(pixData.payload_pix);
                          alert('Código copiado!');
                        }}
                        style={{
                          marginTop: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem',
                          background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer'
                        }}
                      >
                        Copiar Código
                      </button>
                    </div>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleConfirmPix}
                      style={{
                        width: '100%', padding: '0.8rem', borderRadius: '8px', border: 'none',
                        background: isProcessing ? '#94a3b8' : '#22c55e',
                        color: 'white', fontWeight: 600, cursor: isProcessing ? 'default' : 'pointer'
                      }}
                    >
                      {isProcessing ? 'Verificando...' : 'Já fiz o pagamento'}
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: '1.5rem', color: '#4ade80', fontSize: '1.1rem', fontWeight: 'bold' }}>
                      🎉 Pagamento Confirmado!
                    </div>
                    <p style={{ color: '#cbd5e1', marginBottom: '1.5rem' }}>
                      Seu contrato foi gerado com sucesso. Baixe-o agora e acesse o app.
                    </p>
                    <a
                      href={`${API_URL}${contratoUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'block', width: '100%', padding: '0.95rem', borderRadius: '999px',
                        background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white',
                        textDecoration: 'none', fontWeight: 600, marginBottom: '1rem', boxSizing: 'border-box'
                      }}
                    >
                      📄 Baixar Contrato Assinado
                    </a>
                    <button
                      type="button"
                      onClick={() => navigate('/app')}
                      style={{
                        width: '100%', padding: '0.95rem', borderRadius: '999px', border: '1px solid rgba(148,163,184,0.6)',
                        background: 'transparent', color: '#e2e8f0', fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      Ir para o App
                    </button>
                  </div>
                )}

                {!contratoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setPixData(null); // Resetar para poder voltar
                      if (!pixData) navigate('/login');
                    }}
                    style={{
                      marginTop: '1rem',
                      width: '100%',
                      padding: '0.85rem',
                      borderRadius: '999px',
                      border: '1px solid rgba(148,163,184,0.6)',
                      background: 'transparent',
                      color: '#e2e8f0',
                      fontWeight: 500,
                      fontSize: '0.95rem',
                      cursor: 'pointer'
                    }}
                  >
                    {pixData ? 'Voltar / Cancelar' : 'Voltar'}
                  </button>
                )}
              </div>
            )}
          </div>

          <div
            style={{
              background: 'linear-gradient(145deg, rgba(15,23,42,0.98), rgba(15,23,42,0.93))',
              borderRadius: '24px',
              padding: '1.7rem',
              border: '1px solid rgba(148,163,184,0.35)',
              color: '#e5e7eb',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 24px 45px -18px rgba(15,23,42,0.9)'
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: '#e5e7eb', fontWeight: 700 }}>Resumo do plano</h2>

              <div
                style={{
                  marginBottom: '1.4rem',
                  padding: '0.9rem',
                  background: 'rgba(15,23,42,0.9)',
                  borderRadius: '14px',
                  border: '1px solid rgba(148,163,184,0.55)'
                }}
              >
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.5rem', fontWeight: 500 }}>Ciclo de faturamento</p>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    style={{
                      flex: 1,
                      padding: '0.45rem 0.6rem',
                      fontSize: '0.8rem',
                      borderRadius: '999px',
                      border:
                        billingCycle === 'monthly'
                          ? '1px solid rgba(59,130,246,0.95)'
                          : '1px solid rgba(148,163,184,0.7)',
                      background:
                        billingCycle === 'monthly'
                          ? 'linear-gradient(135deg,rgba(59,130,246,0.9),rgba(37,99,235,0.9))'
                          : 'transparent',
                      color: billingCycle === 'monthly' ? '#ffffff' : '#cbd5e1',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Mensal
                  </button>
                  <button
                    onClick={() => setBillingCycle('annual')}
                    style={{
                      flex: 1,
                      padding: '0.45rem 0.6rem',
                      fontSize: '0.8rem',
                      borderRadius: '999px',
                      border:
                        billingCycle === 'annual'
                          ? '1px solid rgba(59,130,246,0.95)'
                          : '1px solid rgba(148,163,184,0.7)',
                      background:
                        billingCycle === 'annual'
                          ? 'linear-gradient(135deg,rgba(59,130,246,0.9),rgba(37,99,235,0.9))'
                          : 'transparent',
                      color: billingCycle === 'annual' ? '#ffffff' : '#cbd5e1',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Anual (-10%)
                  </button>
                </div>
              </div>

              <p style={{ color: '#e5e7eb', marginBottom: '1.3rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
                Você está contratando o <span style={{ fontWeight: 600 }}>{currentPlan.label}</span>. Após a confirmação do pagamento, seu acesso será liberado imediatamente.
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.3rem',
                  fontSize: '0.8rem',
                  color: '#bbf7d0',
                  background: 'rgba(34,197,94,0.14)',
                  padding: '0.55rem 0.8rem',
                  borderRadius: '999px',
                  border: '1px solid rgba(34,197,94,0.45)'
                }}
              >
                <span style={{ fontSize: '1rem' }}>🔒</span>
                <span>Pagamento protegido via TLS</span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.4rem 0', color: '#cbd5e1', fontSize: '0.9rem' }}>
                <li style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ color: '#22c55e' }}>✓</span> Assinatura digital com validade jurídica
                </li>
                <li style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ color: '#22c55e' }}>✓</span> Envio de documentos ilimitados
                </li>
                <li style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ color: '#22c55e' }}>✓</span> Acesso seguro de qualquer dispositivo
                </li>
              </ul>

              <div style={{ borderTop: '1px solid rgba(148,163,184,0.5)', paddingTop: '1rem', marginTop: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Total a pagar</span>
                  <span style={{ color: '#ffffff', fontSize: '1.4rem', fontWeight: 700 }}>R$ {planPrice.value}</span>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#9ca3af' }}>
                  cobrado {billingCycle === 'monthly' ? 'mensalmente' : 'anualmente'}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.3rem', fontSize: '0.75rem', color: '#9ca3af', opacity: 0.9 }}>
              Esta é uma simulação de tela de pagamento, sem cobrança real.
            </div>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}

export default Pagamento;