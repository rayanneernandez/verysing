import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { DashboardLayout } from '../components/DashboardLayout';
import './Pages.css';

function EnviarDocumento() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (location.state?.file) {
      setFile(location.state.file);
    }
  }, [location.state]);

  const [recipients, setRecipients] = useState([{ id: 1, name: '', email: '', role: 'CONTRATADA' }]);
  const [selfSign, setSelfSign] = useState(false);
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderRole, setSenderRole] = useState('CONTRATANTE');
  const [subject, setSubject] = useState(''); // Campo agora inicia vazio
  const [message, setMessage] = useState('');
  const [deadline, setDeadline] = useState('');
  const [autoReminder, setAutoReminder] = useState(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const addRecipient = () => {
    setRecipients([...recipients, { id: Date.now(), name: '', email: '', role: 'TESTEMUNHA' }]);
  };

  const removeRecipient = (id: number) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter(r => r.id !== id));
    }
  };

  const updateRecipient = (id: number, field: string, value: string) => {
    setRecipients(recipients.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      alert(t('send.select_doc') || 'Selecione um documento para enviar.');
      return;
    }

    // Simulate sending email
    // console.log({ file, recipients, selfSign, senderName, senderEmail, senderRole, subject, message, deadline, autoReminder });
    
    // Save document to "Meus Documentos" (localStorage simulation)
    const newDoc = {
      id: Date.now().toString(),
      name: file.name,
      date: new Date().toLocaleDateString('pt-BR'),
      size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      type: file.name.split('.').pop()?.toLowerCase() === 'pdf' ? 'pdf' : 'doc',
      folderId: null, // Uncategorized
      category: 'Enviado'
    };

    const savedDocs = localStorage.getItem('app_documents');
    const docs = savedDocs ? JSON.parse(savedDocs) : [];
    
    // Check if we need to initialize default docs if empty and not previously saved (optional, but good for consistency if user starts here)
    // For now, just append.
    const updatedDocs = [newDoc, ...docs];
    localStorage.setItem('app_documents', JSON.stringify(updatedDocs));

    alert('E-mail foi enviado com sucesso!');
    navigate('/documentos');
  };

  return (
    <DashboardLayout title={t('send.title')}>
      <div className="page-container">
        <p className="page-description" style={{ marginBottom: '1.5rem', color: '#64748b' }}>
          {t('send.description')}
        </p>
        <main>
          <form onSubmit={handleSubmit} className="send-form">
            
            {/* Section 1: Documents */}
            <section className="content-card">
              <h2 className="section-title">{t('send.add_docs')}</h2>
              <div className="upload-area">
                <input 
                  type="file" 
                  id="file-upload" 
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  accept=".pdf,.doc,.docx"
                />
                <label htmlFor="file-upload" className="upload-label" style={{ width: '100%', cursor: 'pointer' }}>
                  <div className="upload-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  </div>
                  <span className="upload-text">
                    {t('send.select_doc')}
                  </span>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                    {file ? `${t('send.file_selected')} ${file.name}` : t('send.click_search')}
                  </div>
                </label>
              </div>
            </section>

            {/* Section 2: Recipients */}
            <section className="content-card">
              <h2 className="section-title">{t('send.recipients')}</h2>
              
              <div className="checkbox-group" style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f1f5f9', borderRadius: '8px' }}>
                <input 
                  type="checkbox" 
                  id="self-sign" 
                  checked={selfSign}
                  onChange={(e) => setSelfSign(e.target.checked)}
                />
                <label htmlFor="self-sign" style={{ fontWeight: 500 }}>{t('send.self_sign')}</label>
              </div>

              {selfSign && (
                <div className="recipient-row self-signer" style={{ borderLeft: '4px solid #3b82f6', paddingLeft: '1rem', marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#3b82f6' }}>{t('send.your_data')}</h3>
                  <div className="form-grid">
                    <div className="input-group">
                      <label>{t('send.your_name')}</label>
                      <input 
                        type="text" 
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        className="modern-input"
                        placeholder="Nome completo"
                      />
                    </div>
                    <div className="input-group">
                      <label>{t('send.your_email')}</label>
                      <input 
                        type="email" 
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                        className="modern-input"
                        placeholder="seu@email.com"
                      />
                    </div>
                    <div className="input-group">
                      <label>{t('send.role')}</label>
                      <select 
                        value={senderRole}
                        onChange={(e) => setSenderRole(e.target.value)}
                        className="modern-select"
                      >
                        <option value="CONTRATANTE">CONTRATANTE</option>
                        <option value="CONTRATADA">CONTRATADA</option>
                        <option value="TESTEMUNHA">TESTEMUNHA</option>
                        <option value="INTERVENIENTE">INTERVENIENTE</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="recipients-list">
                {recipients.map((recipient, index) => (
                  <div key={recipient.id} className="recipient-row" style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#475569' }}>{t('send.recipient')} {index + 1}</h3>
                      {recipients.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removeRecipient(recipient.id)}
                          style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          Remover
                        </button>
                      )}
                    </div>
                    <div className="form-grid">
                      <div className="input-group">
                        <label>{t('send.name')}</label>
                        <input 
                          type="text" 
                          value={recipient.name}
                          onChange={(e) => updateRecipient(recipient.id, 'name', e.target.value)}
                          className="modern-input"
                          required
                        />
                      </div>
                      <div className="input-group">
                        <label>{t('send.email')}</label>
                        <input 
                          type="email" 
                          value={recipient.email}
                          onChange={(e) => updateRecipient(recipient.id, 'email', e.target.value)}
                          className="modern-input"
                          required
                        />
                      </div>
                      <div className="input-group">
                        <label>{t('send.role')}</label>
                        <select 
                          value={recipient.role}
                          onChange={(e) => updateRecipient(recipient.id, 'role', e.target.value)}
                          className="modern-select"
                        >
                          <option value="CONTRATANTE">CONTRATANTE</option>
                          <option value="CONTRATADA">CONTRATADA</option>
                          <option value="TESTEMUNHA">TESTEMUNHA</option>
                          <option value="INTERVENIENTE">INTERVENIENTE</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                type="button" 
                onClick={addRecipient}
                style={{ 
                  background: 'none', 
                  border: '1px dashed #cbd5e1', 
                  color: '#64748b', 
                  padding: '0.75rem', 
                  borderRadius: '8px', 
                  width: '100%',
                  cursor: 'pointer',
                  fontWeight: 500,
                  marginTop: '0.5rem'
                }}
              >
                + {t('send.add_recipient')}
              </button>
            </section>

            {/* Section 3: Deadline */}
            <section className="content-card">
              <h2 className="section-title">{t('send.deadline_title')}</h2>
              <div className="form-grid">
                <div className="input-group">
                  <label>{t('send.deadline_label')}</label>
                  <input 
                    type="date" 
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="modern-input"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              <div className="checkbox-group" style={{ marginTop: '1rem', padding: '0.5rem 0' }}>
                <input 
                  type="checkbox" 
                  id="auto-reminder" 
                  checked={autoReminder}
                  onChange={(e) => setAutoReminder(e.target.checked)}
                />
                <label htmlFor="auto-reminder">{t('send.auto_reminder')}</label>
              </div>
            </section>

            {/* Section 4: Message */}
            <section className="content-card">
              <h2 className="section-title">{t('send.message_all')}</h2>
              <div className="input-group">
                <label>{t('send.subject')} *</label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="modern-input"
                  placeholder={t('send.subject')}
                />
              </div>
              <div className="input-group">
                <label>{t('send.message')}</label>
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="modern-textarea"
                  rows={4}
                  placeholder={t('send.message')}
                />
              </div>
            </section>

            <div className="form-actions">
              <button type="submit" className="btn-submit-send">
                {t('send.submit')}
              </button>
            </div>
          </form>
        </main>
      </div>
    </DashboardLayout>
  );
}

export default EnviarDocumento;