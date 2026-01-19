import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { useLanguage } from '../contexts/LanguageContext';
import './Dashboard.css';

import axios from 'axios';

function Dashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const activeTab = searchParams.get('tab') === 'account' ? 'account' : 'dashboard';
  
  // State for form fields
  const [userName, setUserName] = useState(localStorage.getItem('userName') || 'Usuário');
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || 'usuario@exemplo.com');
  const [userPhone, setUserPhone] = useState(localStorage.getItem('userPhone') || '(11) 99999-9999');
  const [userJob, setUserJob] = useState(localStorage.getItem('userJob') || 'Administrador');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  const API_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    const fetchActivities = async () => {
      if (!userEmail) return;
      try {
        const response = await axios.get(`${API_URL}/api/documentos?email=${userEmail}`);
        // Ordenar por data (mais recente primeiro) e pegar os 5 primeiros
        const docs = response.data
          .sort((a: any, b: any) => {
             // Converter DD/MM/YYYY para Date object para ordenação correta
             const dateA = a.date.split('/').reverse().join('-');
             const dateB = b.date.split('/').reverse().join('-');
             return new Date(dateB).getTime() - new Date(dateA).getTime();
          })
          .slice(0, 5)
          .map((doc: any, index: number) => ({
            id: doc.id || index,
            document: doc.name,
            status: 'concluido', // Assumindo concluído para documentos existentes
            date: doc.date,
            time: '00:00', // Backend não retorna hora separada ainda
            recipient: 'Você'
          }));
        setRecentActivities(docs);
      } catch (error) {
        console.error('Erro ao buscar atividades:', error);
      }
    };

    if (activeTab === 'dashboard') {
      fetchActivities();
    }
  }, [userEmail, activeTab]);

  const userPlan = localStorage.getItem('userPlan') || 'gratuito';
  const planLabel =
    userPlan === 'profissional'
      ? 'Plano Profissional'
      : userPlan === 'empresarial'
      ? 'Plano Empresarial'
      : 'Plano Gratuito';

  // Mock data replaced by real API call
  
  const handleSave = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
       setSaveMessage('Erro: Usuário não identificado. Faça login novamente.');
       return;
    }

    setIsSaving(true);
    setSaveMessage('');
    
    try {
      await axios.put(`${API_URL}/api/usuarios/${userId}`, {
        nome: userName,
        email: userEmail,
        telefone: userPhone,
        cargo: userJob
      });

      // Update local storage
      localStorage.setItem('userName', userName);
      localStorage.setItem('userEmail', userEmail);
      localStorage.setItem('userPhone', userPhone);
      localStorage.setItem('userJob', userJob);
      
      setSaveMessage('Alterações salvas com sucesso!');
      
      // Dispatch event to notify other components (like the header)
      window.dispatchEvent(new Event('userUpdated'));
      
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setSaveMessage('Erro ao salvar alterações.');
    } finally {
      setIsSaving(false);
    }
  };


  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'concluido': return t('status.completed');
      case 'aguardando': return t('status.waiting');
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch(status) {
      case 'concluido': return 'status-badge success';
      case 'aguardando': return 'status-badge warning';
      default: return 'status-badge';
    }
  };

  return (
    <DashboardLayout title={activeTab === 'dashboard' ? t('dashboard.title') : t('account.title')}>
      {activeTab === 'dashboard' ? (
        <div className="dashboard-view">
          <div className="welcome-section">
            <h1>{t('welcome')} {userName}!</h1>
            <p>{t('welcome.subtitle')}</p>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card accent-green">
              <div className="stat-info">
                <span className="stat-label">{t('stats.signed')}</span>
                <span className="stat-value">12</span>
              </div>
            </div>
            <div className="stat-card accent-yellow">
              <div className="stat-info">
                <span className="stat-label">{t('stats.waiting')}</span>
                <span className="stat-value">3</span>
              </div>
            </div>
            <div className="stat-card accent-purple">
              <div className="stat-info">
                <span className="stat-label">{t('stats.total')}</span>
                <span className="stat-value">15</span>
              </div>
            </div>
          </div>

          <div className="recent-activity">
            <h3 className="section-title">{t('activity.title')}</h3>
            <div className="activity-container">
              <table className="activity-table">
                <thead>
                  <tr>
                    <th>{t('table.document')}</th>
                    <th>{t('table.recipient')}</th>
                    <th>{t('table.date')}</th>
                    <th>{t('table.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivities.map((activity) => (
                    <tr key={activity.id}>
                      <td>
                        <div className="document-info">
                          <div className={`doc-icon ${activity.status}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                          </div>
                          <span className="doc-name">{activity.document}</span>
                        </div>
                      </td>
                      <td>{activity.recipient}</td>
                      <td>
                        <div className="date-info">
                          <span>{activity.date}</span>
                          <small>{activity.time}</small>
                        </div>
                      </td>
                      <td>
                        <span className={getStatusClass(activity.status)}>
                          {getStatusLabel(activity.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
            <div className="page-container">
              <div className="content-card">
                <h3 className="section-title">{t('account.personal_info')}</h3>
                <div className="form-grid">
                  <div className="input-group">
                    <label className="input-label">{t('account.full_name')}</label>
                    <input 
                      type="text" 
                      value={userName} 
                      onChange={(e) => setUserName(e.target.value)} 
                      className="modern-input" 
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('send.email')}</label>
                    <input 
                      type="email" 
                      value={userEmail} 
                      onChange={(e) => setUserEmail(e.target.value)} 
                      className="modern-input" 
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('account.phone')}</label>
                    <input 
                      type="tel" 
                      value={userPhone} 
                      onChange={(e) => setUserPhone(e.target.value)} 
                      className="modern-input" 
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('account.job_title')}</label>
                    <input 
                      type="text" 
                      value={userJob} 
                      onChange={(e) => setUserJob(e.target.value)} 
                      className="modern-input" 
                    />
                  </div>
                </div>
                <div className="form-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'flex-end' }}>
                  {saveMessage && <span style={{ color: '#059669', fontSize: '0.9rem', fontWeight: 500 }}>{saveMessage}</span>}
                  <button className="btn-save" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Salvando...' : t('account.save')}
                  </button>
                </div>
              </div>

              <div className="content-card">
                <h3 className="section-title">{t('account.security')}</h3>
                <div className="form-grid">
                  <div className="input-group">
                    <label className="input-label">{t('account.current_password')}</label>
                    <input type="password" placeholder="••••••••" className="modern-input" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('account.new_password')}</label>
                    <input type="password" placeholder="••••••••" className="modern-input" />
                  </div>
                </div>
                <div className="form-actions">
                  <button className="btn-save secondary">{t('account.update_password')}</button>
                </div>
              </div>

              <div className="content-card">
                <h3 className="section-title">{t('account.plan_subscription')}</h3>
                <div className="plan-info">
                  <div className="current-plan">
                    <span className="plan-name">{planLabel}</span>
                    <span className="plan-status">{t('account.plan_status')}</span>
                  </div>
                  <p>{t('account.plan_desc')}</p>
                  <button
                    className="btn-upgrade"
                    onClick={() => navigate('/pagamento', { state: { plano: userPlan } })}
                  >
                    {t('account.upgrade')}
                  </button>
                </div>
              </div>
            </div>
          )}
    </DashboardLayout>
  );
}

// Deprecated styles - disabled to allow light theme
export const _unused_styles = `
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(10px);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: white;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
          font-size: 0.9rem;
        }

        .user-info {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: white;
        }

        .user-role {
          font-size: 0.8rem;
          color: #94a1b2;
        }

        .content-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
        }

        /* Dashboard View */
        .welcome-section {
          margin-bottom: 2.5rem;
        }

        .welcome-section h1 {
          font-size: 1.8rem;
          margin-bottom: 0.5rem;
        }

        .welcome-section p {
          color: #94a1b2;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon.green { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .stat-icon.yellow { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .stat-icon.purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }

        .stat-info {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 1.8rem;
          font-weight: 700;
          line-height: 1.2;
        }

        .stat-label {
          color: #94a1b2;
          font-size: 0.9rem;
        }

        .section-title {
          font-size: 1.2rem;
          margin-bottom: 1.5rem;
          color: white;
        }

        .action-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .action-card {
          background: linear-gradient(145deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.8));
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 2rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          cursor: pointer;
          transition: all 0.3s;
        }

        .action-card:hover {
          transform: translateY(-4px);
          border-color: rgba(59, 130, 246, 0.3);
          box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.3);
        }

        .icon-box {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .icon-box.blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .icon-box.purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }

        .action-card h3 {
          font-size: 1.1rem;
          margin: 0 0 0.3rem 0;
        }

        .action-card p {
          font-size: 0.9rem;
          color: #94a1b2;
          margin: 0;
        }

        .link-arrow {
          margin-left: auto;
          color: #3b82f6;
          font-weight: bold;
        }

        /* Activity List */
        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .activity-item {
          background: rgba(30, 41, 59, 0.3);
          border-radius: 12px;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .activity-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
        }

        .activity-icon.completed { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .activity-icon.pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

        .activity-details {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .activity-name {
          font-weight: 500;
          color: #e2e8f0;
        }

        .activity-date {
          font-size: 0.8rem;
          color: #94a1b2;
        }

        .status-badge {
          font-size: 0.8rem;
          padding: 0.3rem 0.8rem;
          border-radius: 20px;
          font-weight: 500;
        }

        .status-badge.success { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .status-badge.warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

        /* Account View */
        .account-view {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .account-card {
          background: rgba(30, 41, 59, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 2rem;
        }

        .account-card h3 {
          margin-bottom: 1.5rem;
          font-size: 1.2rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding-bottom: 1rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-group label {
          font-size: 0.9rem;
          color: #cbd5e1;
        }

        .input-group input {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 0.8rem;
          color: white;
          outline: none;
        }

        .form-actions {
          margin-top: 2rem;
          display: flex;
          justify-content: flex-end;
        }

        .btn-save {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.8rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: background 0.2s;
        }

        .btn-save:hover { background: #2563eb; }

        .btn-save.secondary {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .btn-save.secondary:hover { background: rgba(255, 255, 255, 0.05); }

        .plan-info {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .current-plan {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .plan-name {
          font-size: 1.2rem;
          font-weight: 700;
          color: white;
        }

        .plan-status {
          background: #10b981;
          color: white;
          padding: 0.2rem 0.8rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .btn-upgrade {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          margin-top: 1rem;
        }

        @media (max-width: 768px) {
          .dashboard-layout {
            flex-direction: column;
            height: 100vh; /* Restore height constraint */
          }
          
          .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            z-index: 50;
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            width: 280px;
            box-shadow: 4px 0 24px rgba(0,0,0,0.5);
          }

          .sidebar.open {
            transform: translateX(0);
          }

          .sidebar-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            z-index: 40;
            animation: fadeIn 0.2s ease;
          }

          .menu-toggle {
            display: flex;
            background: transparent;
            border: none;
            color: white;
            padding: 0.5rem;
            cursor: pointer;
            border-radius: 8px;
          }
          
          .menu-toggle:hover {
            background: rgba(255,255,255,0.1);
          }

          .close-sidebar {
            display: flex;
            background: transparent;
            border: none;
            color: #94a1b2;
            cursor: pointer;
            padding: 0.5rem;
          }

          .header-left {
            gap: 0.5rem;
          }

          .sidebar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .content-scroll {
            padding: 1rem;
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Desktop specific */
        @media (min-width: 769px) {
          .menu-toggle, .close-sidebar, .sidebar-overlay {
            display: none;
          }
        }
      `;

export default Dashboard;