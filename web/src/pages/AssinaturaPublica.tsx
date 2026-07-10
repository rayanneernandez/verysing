import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import SignatureCanvas from 'react-signature-canvas';
import logoPng from '../assets/logo.png';

interface DadosAssinatura {
  signatario: { nome: string; papel: string; status: string };
  documento: {
    titulo?: string; nome_arquivo?: string; mensagem?: string;
    prazo?: string; status?: string; remetente?: string;
  };
  signatarios: { nome_signatario: string; tipo: string; status: string }[];
}

const FONTES = [
  { valor: 'manuscrita', rotulo: 'Manuscrita (Elegante)', css: "'Brush Script MT', 'Segoe Script', cursive" },
  { valor: 'serif', rotulo: 'Clássica (Serif)', css: "'Georgia', 'Times New Roman', serif" },
  { valor: 'cursiva_simples', rotulo: 'Cursiva Simples', css: "'Segoe Script', 'Comic Sans MS', cursive" },
];

export default function AssinaturaPublica() {
  const { token } = useParams<{ token: string }>();
  const API_URL = import.meta.env.VITE_API_URL || '';

  const [dados, setDados] = useState<DadosAssinatura | null>(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [nome, setNome] = useState('');
  const [modo, setModo] = useState<'digitar' | 'desenhar'>('digitar');
  const [fonte, setFonte] = useState('manuscrita');
  const [aceite, setAceite] = useState(false);
  const [assinando, setAssinando] = useState(false);
  const [resultado, setResultado] = useState<{ mensagem: string; concluido: boolean } | null>(null);
  const canvasRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/envelope-assinatura/${token}`)
      .then(r => {
        setDados(r.data);
        setNome(r.data.signatario?.nome || '');
      })
      .catch(err => {
        const detalhe = err.response?.data?.detail;
        setErro(typeof detalhe === 'string' ? detalhe : 'Link inválido ou expirado.');
      })
      .finally(() => setCarregando(false));
  }, [token]);

  const assinar = async () => {
    if (!nome.trim()) {
      alert('Confirme seu nome completo.');
      return;
    }
    if (!aceite) {
      alert('Você precisa marcar o aceite para assinar.');
      return;
    }
    let assinaturaBase64: string | null = null;
    if (modo === 'desenhar') {
      if (!canvasRef.current || canvasRef.current.isEmpty()) {
        alert('Desenhe sua assinatura no quadro.');
        return;
      }
      assinaturaBase64 = canvasRef.current.getTrimmedCanvas().toDataURL('image/png');
    }

    setAssinando(true);
    try {
      const r = await axios.post(`${API_URL}/api/envelope-assinatura/${token}/assinar`, {
        nome: nome.trim(),
        fonte,
        assinatura_base64: assinaturaBase64,
      });
      setResultado(r.data);
    } catch (err: any) {
      const detalhe = err.response?.data?.detail;
      alert(typeof detalhe === 'string' ? detalhe : 'Erro ao assinar. Tente novamente.');
    } finally {
      setAssinando(false);
    }
  };

  const fonteCss = FONTES.find(f => f.valor === fonte)?.css || FONTES[0].css;
  const jaAssinou = dados?.signatario?.status === 'assinado';

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <header style={{ background: '#0f172a', padding: '0.9rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img src={logoPng} alt="VerySing" style={{ height: '32px' }} />
        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Assinatura Eletrônica — Lei 14.063/2020</span>
      </header>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem' }}>
        {carregando && <p style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>Carregando documento...</p>}

        {erro && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '3rem', textAlign: 'center', border: '1px solid #fecaca', marginTop: '2rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ color: '#dc2626', marginBottom: '0.5rem' }}>Não foi possível abrir</h2>
            <p style={{ color: '#64748b' }}>{erro}</p>
          </div>
        )}

        {resultado && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '3rem', textAlign: 'center', border: '1px solid #bbf7d0', marginTop: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ color: '#16a34a', marginBottom: '0.5rem' }}>Assinatura registrada!</h2>
            <p style={{ color: '#475569', marginBottom: '1.5rem' }}>{resultado.mensagem}</p>
            {resultado.concluido && (
              <a
                href={`${API_URL}/api/envelope-assinatura/${token}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-block', background: '#2563eb', color: 'white', padding: '0.85rem 2rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}
              >
                📄 Baixar documento assinado
              </a>
            )}
          </div>
        )}

        {dados && !resultado && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(300px, 1fr)', gap: '1.5rem', alignItems: 'start' }} className="assinatura-grid">
            <style>{`@media (max-width: 900px) { .assinatura-grid { grid-template-columns: 1fr !important; } }`}</style>

            {/* Documento */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                <h2 style={{ fontSize: '1.1rem', color: '#0f172a', marginBottom: '0.2rem' }}>{dados.documento.titulo || dados.documento.nome_arquivo}</h2>
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                  Enviado por {dados.documento.remetente}
                  {dados.documento.prazo && ` · Prazo: ${new Date(dados.documento.prazo).toLocaleDateString('pt-BR')}`}
                </p>
                {dados.documento.mensagem && (
                  <p style={{ color: '#475569', fontSize: '0.9rem', marginTop: '0.5rem', background: '#f8fafc', padding: '0.6rem 0.9rem', borderRadius: '8px' }}>
                    💬 {dados.documento.mensagem}
                  </p>
                )}
              </div>
              <iframe
                src={`${API_URL}/api/envelope-assinatura/${token}/pdf`}
                title="Documento"
                style={{ width: '100%', height: '70vh', border: 'none' }}
              />
            </div>

            {/* Painel de assinatura */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', position: 'sticky', top: '1rem' }}>
              <h3 style={{ fontSize: '1rem', color: '#0f172a', marginBottom: '0.25rem' }}>
                Olá, {dados.signatario.nome}!
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Você assina como <strong>{dados.signatario.papel}</strong>.
              </p>

              {jaAssinou ? (
                <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '1rem', borderRadius: '8px', textAlign: 'center', fontWeight: 600 }}>
                  ✓ Você já assinou este documento
                </div>
              ) : (
                <>
                  <label style={{ display: 'block', color: '#334155', marginBottom: '0.35rem', fontWeight: 500, fontSize: '0.85rem' }}>
                    Confirme seu nome completo
                  </label>
                  <input
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem', marginBottom: '1rem' }}
                  />

                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setModo('digitar')}
                      style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid', borderColor: modo === 'digitar' ? '#2563eb' : '#e2e8f0', background: modo === 'digitar' ? '#eff6ff' : 'white', color: modo === 'digitar' ? '#2563eb' : '#64748b', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                    >
                      Digitar
                    </button>
                    <button
                      type="button"
                      onClick={() => setModo('desenhar')}
                      style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid', borderColor: modo === 'desenhar' ? '#2563eb' : '#e2e8f0', background: modo === 'desenhar' ? '#eff6ff' : 'white', color: modo === 'desenhar' ? '#2563eb' : '#64748b', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                    >
                      Desenhar
                    </button>
                  </div>

                  {modo === 'digitar' ? (
                    <>
                      <select
                        value={fonte}
                        onChange={e => setFonte(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '0.75rem' }}
                      >
                        {FONTES.map(f => <option key={f.valor} value={f.valor}>{f.rotulo}</option>)}
                      </select>
                      <div style={{ border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '1.25rem', textAlign: 'center', marginBottom: '1rem', minHeight: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontFamily: fonteCss, fontSize: '1.7rem', color: '#1e293b' }}>
                          {nome || 'Sua assinatura'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ border: '1px dashed #cbd5e1', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
                        <SignatureCanvas
                          ref={canvasRef}
                          penColor="#1e293b"
                          canvasProps={{ style: { width: '100%', height: '130px' } }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => canvasRef.current?.clear()}
                        style={{ marginTop: '0.4rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        Limpar
                      </button>
                    </div>
                  )}

                  <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.8rem', color: '#475569', marginBottom: '1.25rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={aceite} onChange={e => setAceite(e.target.checked)} style={{ marginTop: '2px' }} />
                    <span>
                      Declaro que li o documento e concordo em assiná-lo eletronicamente,
                      nos termos da Lei 14.063/2020. Meu IP e a data/hora serão registrados.
                    </span>
                  </label>

                  <button
                    onClick={assinar}
                    disabled={assinando}
                    style={{ width: '100%', background: '#16a34a', color: 'white', border: 'none', padding: '0.95rem', borderRadius: '10px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', opacity: assinando ? 0.7 : 1, boxShadow: '0 4px 12px rgba(22,163,74,0.3)' }}
                  >
                    {assinando ? 'Assinando...' : '✍ Assinar documento'}
                  </button>
                </>
              )}

              {/* Status dos demais */}
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Signatários</p>
                {dados.signatarios.map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.3rem 0', color: '#475569' }}>
                    <span>{s.nome_signatario} <span style={{ color: '#94a3b8' }}>({s.tipo})</span></span>
                    <span style={{ color: s.status === 'assinado' ? '#16a34a' : '#d97706', fontWeight: 600 }}>
                      {s.status === 'assinado' ? '✓ Assinou' : 'Pendente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
