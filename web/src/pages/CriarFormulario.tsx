import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import '../App.css';

interface FormOption {
  text: string;
  isDefault: boolean;
}

interface FormField {
  id: string;
  label: string;
  isDefaultLabel: boolean;
  type: 'text' | 'number' | 'date' | 'email' | 'textarea' | 'select';
  required: boolean;
  options?: FormOption[];
}

const Modal = ({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)'
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: '12px', padding: '2rem',
        maxWidth: '600px', width: '90%', position: 'relative',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        maxHeight: '90vh', overflowY: 'auto'
      }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

const EmailPreviewModal = ({ isOpen, onClose, title, recipient, t, onOpenForm }: any) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0f172a' }}>{t('forms.preview_title')}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      
      <div style={{ background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {/* Email Header */}
        <div style={{ background: '#fff', padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex' }}>
              <span style={{ color: '#64748b', width: '60px' }}>To:</span>
              <span style={{ color: '#0f172a' }}>{recipient || 'recipient@example.com'}</span>
            </div>
            <div style={{ display: 'flex' }}>
              <span style={{ color: '#64748b', width: '60px' }}>From:</span>
              <span style={{ color: '#0f172a' }}>VerySing &lt;noreply@verysing.com&gt;</span>
            </div>
            <div style={{ display: 'flex' }}>
              <span style={{ color: '#64748b', width: '60px' }}>Subject:</span>
              <span style={{ color: '#0f172a', fontWeight: '500' }}>{t('forms.email_subject_prefix')}{title || 'Form Title'}</span>
            </div>
          </div>
        </div>

        {/* Email Body */}
        <div style={{ padding: '2rem', background: '#ffffff' }}>
          <p style={{ marginBottom: '1rem', color: '#334155' }}>{t('forms.email_body_greeting')}</p>
          <p style={{ marginBottom: '2rem', color: '#334155' }}>
            {t('forms.email_body_invite')} <strong>{title || 'Form Title'}</strong>.
          </p>
          
          <div style={{ textAlign: 'center', margin: '2rem 0' }}>
            <button 
              onClick={() => { onClose(); onOpenForm(); }}
              style={{
                background: '#2563eb', color: 'white', border: 'none', padding: '0.75rem 1.5rem',
                borderRadius: '6px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer'
              }}
            >
              {t('forms.email_cta')}
            </button>
          </div>
          
          <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '2rem 0' }} />
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
            Powered by VerySing
          </p>
        </div>
      </div>
    </Modal>
  );
};

const FormResponsePreview = ({ isOpen, onClose, title, fields, t }: any) => {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#f1f5f9', zIndex: 2000, overflowY: 'auto'
    }}>
      <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
        <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', overflow: 'hidden' }}>
          <div style={{ height: '10px', background: '#2563eb' }}></div>
          <div style={{ padding: '2.5rem' }}>
            <div style={{ marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '2rem', color: '#1e293b', marginBottom: '0.5rem' }}>{title || 'Untitled Form'}</h1>
              <p style={{ color: '#64748b' }}>{t('forms.create_subtitle')}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {fields.map((field: any) => (
                <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontWeight: '500', color: '#334155', fontSize: '1rem' }}>
                    {field.label}
                    {field.required && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
                  </label>
                  
                  {field.type === 'text' && <input type="text" className="modern-input" placeholder="Sua resposta" disabled style={{ background: '#f8fafc', cursor: 'not-allowed' }} />}
                  {field.type === 'textarea' && <textarea className="modern-input" rows={3} placeholder="Sua resposta" disabled style={{ background: '#f8fafc', cursor: 'not-allowed' }} />}
                  {field.type === 'number' && <input type="number" className="modern-input" placeholder="0" disabled style={{ background: '#f8fafc', cursor: 'not-allowed' }} />}
                  {field.type === 'email' && <input type="email" className="modern-input" placeholder="email@exemplo.com" disabled style={{ background: '#f8fafc', cursor: 'not-allowed' }} />}
                  {field.type === 'date' && <input type="date" className="modern-input" disabled style={{ background: '#f8fafc', cursor: 'not-allowed' }} />}
                  
                  {field.type === 'select' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {field.options?.map((opt: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input type="radio" name={field.id} disabled />
                          <span style={{ color: '#475569' }}>{opt.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <button 
                onClick={onClose}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}
              >
                Fechar Pré-visualização
              </button>
              <button 
                disabled
                style={{ background: '#2563eb', color: 'white', padding: '0.75rem 2rem', borderRadius: '6px', border: 'none', opacity: 0.7, cursor: 'not-allowed', fontWeight: '600' }}
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '1.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>
          Este formulário foi criado com <strong>VerySing</strong>.
        </div>
      </div>
    </div>
  );
};

const SuccessModal = ({ isOpen, onClose, recipient, t }: any) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <div style={{ 
          width: '64px', height: '64px', background: '#dcfce7', borderRadius: '50%', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' 
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' }}>
          {t('forms.modal_success_title')}
        </h3>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>
          {t('forms.modal_success_message')} <strong>{recipient}</strong>.
        </p>
        <button 
          onClick={onClose}
          style={{
            background: '#0f172a', color: 'white', border: 'none', padding: '0.75rem 2rem',
            borderRadius: '6px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', width: '100%'
          }}
        >
          {t('forms.modal_close')}
        </button>
      </div>
    </Modal>
  );
};

function CriarFormulario() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [formTitle, setFormTitle] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showFormResponse, setShowFormResponse] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Update defaults when language changes
  useEffect(() => {
    setFields(prevFields => prevFields.map(field => {
      let newLabel = field.label;
      if (field.isDefaultLabel) {
        newLabel = t('forms.new_question_default');
      }
      
      let newOptions = field.options;
      if (field.options) {
        newOptions = field.options.map((opt, index) => {
          if (opt.isDefault) {
            return { ...opt, text: `${t('forms.option_placeholder')} ${index + 1}` };
          }
          return opt;
        });
      }
      
      return { ...field, label: newLabel, options: newOptions };
    }));
  }, [language, t]);

  const addField = () => {
    const newField: FormField = {
      id: crypto.randomUUID(),
      label: t('forms.new_question_default'),
      isDefaultLabel: true,
      type: 'text',
      required: true,
      options: []
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, key: keyof FormField, value: any) => {
    setFields(fields.map(field => {
      if (field.id === id) {
        const updates: Partial<FormField> = { [key]: value };
        
        if (key === 'label') {
           updates.isDefaultLabel = false;
        }

        if (key === 'type' && value === 'select' && (!field.options || field.options.length === 0)) {
          updates.options = [
            { text: `${t('forms.option_placeholder')} 1`, isDefault: true },
            { text: `${t('forms.option_placeholder')} 2`, isDefault: true }
          ];
        }
        return { ...field, ...updates };
      }
      return field;
    }));
  };

  const addOption = (fieldId: string) => {
    setFields(fields.map(f => {
      if (f.id === fieldId) {
        const currentOptions = f.options || [];
        const newOption: FormOption = {
            text: `${t('forms.option_placeholder')} ${currentOptions.length + 1}`,
            isDefault: true
        };
        return { ...f, options: [...currentOptions, newOption] };
      }
      return f;
    }));
  };

  const updateOption = (fieldId: string, index: number, value: string) => {
    setFields(fields.map(f => {
      if (f.id === fieldId && f.options) {
        const newOptions = [...f.options];
        newOptions[index] = { text: value, isDefault: false };
        return { ...f, options: newOptions };
      }
      return f;
    }));
  };

  const removeOption = (fieldId: string, index: number) => {
    setFields(fields.map(f => {
      if (f.id === fieldId && f.options) {
        return { ...f, options: f.options.filter((_, i) => i !== index) };
      }
      return f;
    }));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !recipientEmail || fields.length === 0) {
      alert(t('forms.alert_fill'));
      return;
    }
    
    // Simulação de envio
    setShowSuccessModal(true);
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    navigate('/app');
  };

  return (
    <DashboardLayout title={t('forms.create_page_title')}>
      <div className="page-container" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
        <div className="content-card" style={{ background: 'white', padding: '2.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ marginBottom: '2rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.5rem' }}>
            <h2 style={{ color: '#0f172a', marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: '600' }}>{t('forms.create_title')}</h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>{t('forms.create_subtitle')}</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            {/* Configurações Gerais */}
            <div style={{ marginBottom: '2.5rem', display: 'grid', gap: '1.5rem' }}>
              <div className="input-group">
                <label className="input-label" style={{ display: 'block', color: '#334155', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>{t('forms.form_title')}</label>
                <input 
                  type="text" 
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="modern-input"
                  placeholder={t('forms.title_placeholder')}
                  style={{ width: '100%', padding: '0.75rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '1rem' }}
                />
              </div>

              <div className="input-group">
                <label className="input-label" style={{ display: 'block', color: '#334155', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>{t('forms.recipient_email_label')}</label>
                <input 
                  type="email" 
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="modern-input"
                  placeholder={t('forms.recipient_email_placeholder')}
                  style={{ width: '100%', padding: '0.75rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '1rem' }}
                />
              </div>
            </div>

            {/* Builder de Campos */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#0f172a', fontSize: '1.1rem', fontWeight: '600' }}>{t('forms.questions_title')}</h3>
                <button 
                  type="button" 
                  onClick={addField}
                  style={{ 
                    background: '#f1f5f9', 
                    color: '#3b82f6', 
                    border: '1px solid #e2e8f0', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '6px', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    fontWeight: '500',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  {t('forms.add_question')}
                </button>
              </div>

              {fields.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', border: '2px dashed #cbd5e1', borderRadius: '8px', color: '#64748b', background: '#f8fafc' }}>
                  <div style={{ marginBottom: '1rem', color: '#94a3b8' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                  </div>
                  <p>{t('forms.no_questions')}</p>
                  <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>{t('forms.start_building')}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {fields.map((field, index) => (
                    <div key={field.id} style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', position: 'relative', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                         <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('forms.question_number')} {index + 1}</span>
                         <button 
                          type="button" 
                          onClick={() => removeField(field.id)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}
                          title="Remover pergunta"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          {t('forms.delete')}
                        </button>
                      </div>

                      {/* Linha 1: Pergunta e Tipo */}
                      <div className="question-grid" style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'start' }}>
                        <div>
                          <label style={{ display: 'block', color: '#475569', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>{t('forms.question_text_label')}</label>
                          <input 
                            type="text" 
                            value={field.label}
                            onChange={(e) => updateField(field.id, 'label', e.target.value)}
                            placeholder={t('forms.question_text_placeholder')}
                            style={{ width: '100%', padding: '0.75rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '1rem' }}
                          />
                        </div>
                        
                        <div>
                          <label style={{ display: 'block', color: '#475569', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>{t('forms.response_type_label')}</label>
                          <div style={{ position: 'relative' }}>
                            <select 
                              value={field.type}
                              onChange={(e) => updateField(field.id, 'type', e.target.value)}
                              style={{ 
                                width: '100%', 
                                padding: '0.75rem', 
                                background: '#fff', 
                                border: '1px solid #cbd5e1', 
                                borderRadius: '6px', 
                                color: '#334155', 
                                cursor: 'pointer',
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                paddingRight: '2.5rem'
                              }}
                            >
                              <option value="text">{t('forms.type_short')}</option>
                              <option value="textarea">{t('forms.type_long')}</option>
                              <option value="number">{t('forms.type_number')}</option>
                              <option value="email">{t('forms.type_email')}</option>
                              <option value="date">{t('forms.type_date')}</option>
                              <option value="select">{t('forms.type_select')}</option>
                            </select>
                            <div style={{ 
                              position: 'absolute', 
                              right: '1rem', 
                              top: '50%', 
                              transform: 'translateY(-50%)', 
                              pointerEvents: 'none',
                              color: '#64748b'
                            }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Configurações Extras */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9', marginTop: '1rem' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input 
                              type="checkbox" 
                              id={`req-${field.id}`}
                              checked={field.required}
                              onChange={(e) => updateField(field.id, 'required', e.target.checked)}
                              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#3b82f6' }}
                            />
                            <label htmlFor={`req-${field.id}`} style={{ color: '#475569', fontSize: '0.9rem', cursor: 'pointer' }}>{t('forms.required')}</label>
                          </div>
                      </div>

                      {/* Área de Alternativas (Condicional) */}
                      {field.type === 'select' && (
                        <div style={{ marginTop: '1.5rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <label style={{ display: 'block', color: '#475569', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: '600' }}>{t('forms.options_title')}</label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {field.options?.map((option, idx) => (
                              <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #cbd5e1', background: 'white' }}></div>
                                <input 
                                  type="text"
                                  value={option.text}
                                  onChange={(e) => updateOption(field.id, idx, e.target.value)}
                                  placeholder={`${t('forms.option_placeholder')} ${idx + 1}`}
                                  style={{ flex: 1, padding: '0.5rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', color: '#334155' }}
                                />
                                <button 
                                  type="button"
                                  onClick={() => removeOption(field.id, idx)}
                                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.4rem', borderRadius: '4px' }}
                                  className="hover:bg-slate-200"
                                  title="Remover opção"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                              </div>
                            ))}
                            <button 
                              type="button"
                              onClick={() => addOption(field.id)}
                              style={{ alignSelf: 'flex-start', marginTop: '0.5rem', background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '500', paddingLeft: '2rem' }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                              {t('forms.add_option')}
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-actions" style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button 
                type="button" 
                onClick={() => setShowPreview(true)}
                style={{ 
                  background: 'white', 
                  color: '#475569', 
                  padding: '0.8rem 1.5rem', 
                  borderRadius: '6px', 
                  border: '1px solid #cbd5e1', 
                  cursor: 'pointer', 
                  fontWeight: '600',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                {t('forms.preview_btn')}
              </button>
              
              <button 
                type="submit" 
                className="btn-primary"
                style={{ 
                  background: '#2563eb', 
                  color: 'white', 
                  padding: '0.8rem 2rem', 
                  borderRadius: '6px', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontWeight: '600',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                {t('forms.submit_btn')}
              </button>
            </div>
          </form>
        </div>
        
        <EmailPreviewModal 
          isOpen={showPreview} 
          onClose={() => setShowPreview(false)} 
          title={formTitle} 
          recipient={recipientEmail} 
          t={t}
          onOpenForm={() => setShowFormResponse(true)}
        />
        
        <FormResponsePreview 
          isOpen={showFormResponse}
          onClose={() => setShowFormResponse(false)}
          title={formTitle}
          fields={fields}
          t={t}
        />
        
        <SuccessModal 
          isOpen={showSuccessModal} 
          onClose={handleCloseSuccess} 
          recipient={recipientEmail} 
          t={t} 
        />
      </div>
    </DashboardLayout>
  );
}

export default CriarFormulario;