import { useParams, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';

function Validacao() {
  const params = useParams();
  const location = useLocation();
  const search = new URLSearchParams(location.search);
  const remainder = location.pathname.startsWith('/validar/') ? decodeURIComponent(location.pathname.slice('/validar/'.length)) : '';
  const hash = params.hash || search.get('hash') || remainder || '';

  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (hash) {
      axios.get(`https://localhost:8000/validar/dados/${hash}`)
        .then(res => {
            setDados(res.data);
            setLoading(false);
        })
        .catch(err => {
            console.error("Erro ao buscar dados", err);
            setLoading(false);
        });
    }
  }, [hash]);

  const handleVisualizar = () => {
    setShowModal(true);
  };

  const handleBaixar = () => {
     const link = document.createElement('a');
     link.href = `https://localhost:8000/validar/arquivo/${hash}`;
     link.download = `documento_assinado_${hash.substring(0,6)}.pdf`;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  const handleBaixarOriginal = () => {
    const link = document.createElement('a');
    link.href = `https://localhost:8000/validar/arquivo-original/${hash}`;
    link.download = `documento_original_${hash.substring(0,6)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
 };


  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando dados da validação...</div>;

  if (!dados) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
        <h2>Documento não encontrado na base de dados.</h2>
        <p>Verifique se o link está correto ou se o documento foi assinado recentemente.</p>
        <small>Hash buscado: {hash}</small>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#f4f7fa', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header com Logo */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
           <h2 style={{ color: '#2e7d32', margin: 0, fontSize: '1.8rem' }}>Assinador Seguro</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
            
            {/* Coluna Esquerda: Signatários */}
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', height: 'fit-content' }}>
                <h3 style={{ marginTop: 0, color: '#333', borderBottom: '2px solid #2e7d32', paddingBottom: '0.5rem', display: 'inline-block' }}>Signatários</h3>
                
                <div style={{ marginTop: '1.5rem' }}>
                    {dados.signatarios && dados.signatarios.length > 0 ? (
                        dados.signatarios.map((sig: any, index: number) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '1.5rem' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👤</div>
                                <div>
                                    <div style={{ fontWeight: 'bold', color: '#333' }}>{sig.nome}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>{sig.email}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '2px', fontStyle: 'italic' }}>{sig.tipo}</div>
                                    
                                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px', color: '#2e7d32', fontSize: '0.9rem' }}>
                                        <span>✓</span> Assinou o documento
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '2px' }}>
                                        {dados.data_assinatura} <br/> IP {dados.ip}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ color: '#999' }}>Nenhum signatário identificado.</div>
                    )}
                </div>
            </div>

            {/* Coluna Direita: Detalhes do Documento */}
            <div>
                <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '1rem' }}>
                    <h3 style={{ marginTop: 0, color: '#333', fontSize: '1.2rem' }}>Detalhes do Documento</h3>
                    <div style={{ display: 'grid', gap: '1rem', color: '#555' }}>
                        <div>
                            <strong>Hash de Integridade (SHA256):</strong>
                            <div style={{ wordBreak: 'break-all', fontSize: '0.85rem', fontFamily: 'monospace', backgroundColor: '#f5f5f5', padding: '0.5rem', borderRadius: '4px', marginTop: '0.25rem' }}>
                                {dados.hash}
                            </div>
                        </div>
                        <div>
                            <strong>Status:</strong> <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>Válido e Assinado</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    
                    {/* Card Visualizar */}
                    <div onClick={handleVisualizar} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'pointer', borderLeft: '4px solid #2196f3' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>👁️</span>
                            <span style={{ fontWeight: 'bold', color: '#333' }}>Visualizar</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>Ver documento online</div>
                    </div>

                    {/* Card Baixar Assinado */}
                    <div onClick={handleBaixar} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'pointer', borderLeft: '4px solid #2e7d32' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>📄</span>
                            <span style={{ fontWeight: 'bold', color: '#333' }}>Baixar Assinado</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>Versão final válida</div>
                    </div>

                    {/* Card Baixar Original */}
                    <div onClick={handleBaixarOriginal} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'pointer', borderLeft: '4px solid #ff9800' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>📑</span>
                            <span style={{ fontWeight: 'bold', color: '#333' }}>Baixar Original</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>Sem assinaturas</div>
                    </div>

                    {/* Card Certificado */}
                    <a href="https://localhost:8000/validar/certificado" target="_blank" style={{ textDecoration: 'none', backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'pointer', borderLeft: '4px solid #9c27b0', display: 'block' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>🛡️</span>
                            <span style={{ fontWeight: 'bold', color: '#333' }}>Certificado</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>Baixar chave pública</div>
                    </a>
                </div>
            </div>
        </div>
        {/* Modal de Visualização */}
        {showModal && (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000,
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                padding: '2rem'
            }}>
                <div style={{
                    backgroundColor: 'white', width: '100%', maxWidth: '900px', height: '90vh',
                    borderRadius: '8px', display: 'flex', flexDirection: 'column', position: 'relative'
                }}>
                    <button 
                        onClick={() => setShowModal(false)}
                        style={{
                            position: 'absolute', top: '-15px', right: '-15px',
                            width: '40px', height: '40px', borderRadius: '50%',
                            backgroundColor: '#ff5252', color: 'white', border: 'none',
                            fontSize: '1.5rem', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        ×
                    </button>
                    
                    <div style={{ padding: '1rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, color: '#333' }}>Visualização do Documento</h3>
                        <span style={{ fontSize: '0.8rem', color: '#666' }}>Modo Leitura</span>
                    </div>
                    
                    <iframe 
                        src={`https://localhost:8000/validar/visualizar/${hash}#toolbar=0&navpanes=0`} 
                        width="100%" 
                        height="100%" 
                        style={{ border: 'none', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}
                        title="Visualização PDF"
                    />
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

export default Validacao;
