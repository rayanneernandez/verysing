import { useLocation, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import '../App.css';

function Sucesso() {
  const location = useLocation();
  const navigate = useNavigate();
  const { pdfUrl, fileName } = location.state || {};

  if (!pdfUrl) {
    return (
      <DashboardLayout title="Documento Assinado">
        <div className="page-container" style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="content-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem' }}>
            <h2 style={{ color: '#475569', marginBottom: '1.5rem' }}>Nenhum documento encontrado.</h2>
            <button 
                onClick={() => navigate('/app')}
                className="btn-primary"
            >
                Voltar ao Início
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Documento Assinado">
      <div className="page-container">
        <div className="content-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ 
            width: '80px', height: '80px', background: '#dcfce7', borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' 
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          
          <h1 style={{ color: '#0f172a', margin: '0 0 1rem 0', fontSize: '1.75rem', fontWeight: '700' }}>Documento Assinado com Sucesso!</h1>
          <p style={{ fontSize: '1rem', color: '#64748b', maxWidth: '600px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
              Seu contrato foi processado, assinado e certificado digitalmente conforme a Lei 14.063/2020.
          </p>
          
          <div style={{ margin: '2rem 0', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a 
                  href={pdfUrl} 
                  download={`contrato_assinado_${fileName || 'documento.pdf'}`} 
                  className="btn-primary"
                  style={{ 
                      textDecoration: 'none', 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                  }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Baixar PDF Assinado
              </a>
              
              <button 
                  onClick={() => navigate('/app')}
                  style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: 'transparent',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontWeight: '600',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                  }}
              >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                  Voltar ao Início
              </button>
          </div>

          <div style={{ marginTop: '3rem', borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
            <h3 style={{ color: '#334155', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: '600' }}>Visualização do Documento</h3>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <iframe 
                src={pdfUrl} 
                style={{ 
                    width: '100%', 
                    height: '700px', 
                    border: 'none', 
                    borderRadius: '8px',
                    backgroundColor: 'white'
                }} 
                title="Preview PDF"
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Sucesso;