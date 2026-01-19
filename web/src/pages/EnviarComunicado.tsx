import React, { useState, useRef } from 'react';
// Page component for sending email announcements
import { DashboardLayout } from '../components/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import '../App.css';

export default function EnviarComunicado() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [logo, setLogo] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [recipients, setRecipients] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message || !recipients) {
      alert(t('forms.alert_fill')); 
      return;
    }
    // Simulation
    alert(t('announce.success'));
    navigate('/app');
  };

  return (
    <DashboardLayout title={t('announce.title')}>
      <div className="page-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#0f172a', marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: '600' }}>{t('announce.title')}</h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>{t('announce.subtitle')}</p>
        </div>

        <div className="split-layout">
          {/* Left Column: Form */}
          <div className="content-card" style={{ background: 'white', padding: '2rem', borderRadius: '8px', border: '1px solid #e2e8f0', height: 'fit-content' }}>
            <form onSubmit={handleSend}>
              
              {/* Logo Upload */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: '#334155', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>{t('announce.logo_label')}</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ 
                    border: '2px dashed #cbd5e1', 
                    borderRadius: '6px', 
                    padding: '1.5rem', 
                    textAlign: 'center', 
                    cursor: 'pointer',
                    background: logo ? '#f8fafc' : 'white',
                    transition: 'all 0.2s'
                  }}
                  className="hover:bg-slate-50"
                >
                  {logo ? (
                    <div style={{ position: 'relative' }}>
                      <img src={logo} alt="Logo Preview" style={{ maxHeight: '60px', maxWidth: '100%', objectFit: 'contain' }} />
                      <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>{t('send.file_selected')} Logo</p>
                    </div>
                  ) : (
                    <div style={{ color: '#64748b' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '0.5rem', opacity: 0.7 }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                      <p style={{ fontSize: '0.9rem' }}>{t('announce.logo_placeholder')}</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleLogoUpload} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                  />
                </div>
              </div>

              {/* Recipients */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: '#334155', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>{t('announce.recipients_label')}</label>
                <input 
                  type="text" 
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  placeholder={t('announce.recipients_placeholder')}
                  required
                  style={{ width: '100%', padding: '0.75rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '1rem' }}
                />
              </div>

              {/* Subject */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: '#334155', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>{t('announce.subject_label')}</label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.75rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '1rem' }}
                />
              </div>

              {/* Message */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', color: '#334155', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>{t('announce.message_label')}</label>
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={8}
                  style={{ width: '100%', padding: '0.75rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '1rem', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <button 
                type="submit"
                style={{ 
                  width: '100%',
                  background: '#10b981', 
                  color: 'white', 
                  padding: '0.9rem', 
                  borderRadius: '6px', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontWeight: '600',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                {t('announce.send_btn')}
              </button>
            </form>
          </div>

          {/* Right Column: Live Preview */}
          <div className="preview-column">
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              {t('announce.preview_title')}
            </h3>
            
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', position: 'sticky', top: '2rem' }}>
              {/* Header with Logo */}
              <div style={{ padding: '2rem', borderBottom: '1px solid #f1f5f9', textAlign: 'center', background: 'white' }}>
                {logo ? (
                  <img src={logo} alt="Header Logo" style={{ maxHeight: '80px', maxWidth: '200px', objectFit: 'contain' }} />
                ) : (
                  <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem' }}>{t('announce.logo_placeholder')}</div>
                )}
              </div>
              
              {/* Content */}
              <div style={{ padding: '2.5rem', color: '#334155', lineHeight: '1.6', fontSize: '1rem', whiteSpace: 'pre-wrap', minHeight: '200px' }}>
                {message ? message : <span style={{ color: '#cbd5e1' }}>{t('announce.message_label')}...</span>}
              </div>

              {/* Footer */}
              <div style={{ padding: '1.5rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
                VerySign
              </div>
            </div>
          </div>
        </div>

        <style>{`
          .split-layout {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            align-items: start;
          }
          @media (max-width: 968px) {
            .split-layout {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </DashboardLayout>
  );
}