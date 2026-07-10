import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import axios from 'axios';
import '../App.css';

interface ItemOrcamento {
  descricao: string;
  quantidade: number;
  valor_unitario: number;
}

interface Orcamento {
  id: string;
  numero: number;
  titulo: string;
  cliente_nome: string;
  cliente_email?: string;
  total: number;
  status: string;
  validade?: string;
  criado_em: string;
}

const STATUS_LABELS: Record<string, { label: string; cor: string; fundo: string }> = {
  rascunho: { label: 'Rascunho', cor: '#64748b', fundo: '#f1f5f9' },
  enviado: { label: 'Enviado', cor: '#2563eb', fundo: '#eff6ff' },
  aprovado: { label: 'Aprovado', cor: '#16a34a', fundo: '#f0fdf4' },
  recusado: { label: 'Recusado', cor: '#dc2626', fundo: '#fef2f2' },
  expirado: { label: 'Expirado', cor: '#d97706', fundo: '#fffbeb' },
};

const moeda = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Orcamentos() {
  const API_URL = import.meta.env.VITE_API_URL || '';
  const emailUsuario = localStorage.getItem('userEmail') || '';

  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [criando, setCriando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const mostrarToast = (tipo: 'sucesso' | 'erro', texto: string) => {
    setToast({ tipo, texto });
    setTimeout(() => setToast(null), 4500);
  };

  // Formulário
  const [titulo, setTitulo] = useState('');
  const [clienteNome, setClienteNome] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [clienteDocumento, setClienteDocumento] = useState('');
  const [descricao, setDescricao] = useState('');
  const [validade, setValidade] = useState('');
  const [desconto, setDesconto] = useState(0);
  const [itens, setItens] = useState<ItemOrcamento[]>([
    { descricao: '', quantidade: 1, valor_unitario: 0 },
  ]);

  const carregar = () => {
    if (!emailUsuario) {
      setCarregando(false);
      return;
    }
    axios
      .get(`${API_URL}/api/orcamentos`, { params: { email: emailUsuario } })
      .then(r => setOrcamentos(r.data || []))
      .catch(() => setOrcamentos([]))
      .finally(() => setCarregando(false));
  };

  useEffect(carregar, []);

  const subtotal = itens.reduce((s, i) => s + i.quantidade * i.valor_unitario, 0);
  const total = Math.max(0, subtotal - desconto);

  const atualizarItem = (idx: number, campo: keyof ItemOrcamento, valor: string) => {
    setItens(prev =>
      prev.map((item, i) =>
        i === idx
          ? { ...item, [campo]: campo === 'descricao' ? valor : parseFloat(valor) || 0 }
          : item
      )
    );
  };

  const limparFormulario = () => {
    setTitulo(''); setClienteNome(''); setClienteEmail(''); setClienteDocumento('');
    setDescricao(''); setValidade(''); setDesconto(0);
    setItens([{ descricao: '', quantidade: 1, valor_unitario: 0 }]);
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !clienteNome || itens.every(i => !i.descricao)) {
      mostrarToast('erro', 'Preencha o título, o cliente e ao menos um item.');
      return;
    }
    setSalvando(true);
    try {
      await axios.post(`${API_URL}/api/orcamentos`, {
        email_usuario: emailUsuario,
        titulo,
        cliente_nome: clienteNome,
        cliente_email: clienteEmail || null,
        cliente_documento: clienteDocumento || null,
        descricao: descricao || null,
        validade: validade || null,
        desconto,
        itens: itens.filter(i => i.descricao),
      });
      mostrarToast('sucesso', 'Orçamento criado com sucesso!');
      limparFormulario();
      setCriando(false);
      carregar();
    } catch (err: any) {
      const detalhe = err.response?.data?.detail;
      mostrarToast('erro', typeof detalhe === 'string' ? detalhe : 'Erro ao criar orçamento.');
    } finally {
      setSalvando(false);
    }
  };

  const baixarPdf = (orc: Orcamento) => {
    window.open(`${API_URL}/api/orcamentos/${orc.id}/pdf`, '_blank');
  };

  const enviarEmail = async (orc: Orcamento) => {
    if (!orc.cliente_email) {
      mostrarToast('erro', 'Este orçamento não tem e-mail do cliente cadastrado.');
      return;
    }
    try {
      const r = await axios.post(`${API_URL}/api/orcamentos/${orc.id}/enviar`);
      mostrarToast('sucesso', r.data.mensagem);
      carregar();
    } catch (err: any) {
      const detalhe = err.response?.data?.detail;
      mostrarToast('erro', typeof detalhe === 'string' ? detalhe : 'Erro ao enviar orçamento.');
    }
  };

  const mudarStatus = async (orc: Orcamento, status: string) => {
    try {
      await axios.put(`${API_URL}/api/orcamentos/${orc.id}/status`, { status });
      carregar();
    } catch {
      mostrarToast('erro', 'Erro ao atualizar status.');
    }
  };

  const excluir = async (orc: Orcamento) => {
    if (!confirm(`Excluir o orçamento "${orc.titulo}"?`)) return;
    try {
      await axios.delete(`${API_URL}/api/orcamentos/${orc.id}`);
      carregar();
    } catch {
      mostrarToast('erro', 'Erro ao excluir orçamento.');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1',
    borderRadius: '6px', fontSize: '0.95rem', color: '#0f172a', background: '#fff',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', color: '#334155', marginBottom: '0.4rem',
    fontWeight: 500, fontSize: '0.9rem',
  };

  return (
    <DashboardLayout title="Orçamentos">
      {toast && (
        <div
          style={{
            position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 2000,
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            background: toast.tipo === 'sucesso' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${toast.tipo === 'sucesso' ? '#bbf7d0' : '#fecaca'}`,
            color: toast.tipo === 'sucesso' ? '#15803d' : '#b91c1c',
            padding: '0.9rem 1.25rem', borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
            fontWeight: 500, fontSize: '0.95rem', maxWidth: '380px',
            animation: 'toastIn 0.25s ease',
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>{toast.tipo === 'sucesso' ? '✅' : '⚠️'}</span>
          <span style={{ flex: 1 }}>{toast.texto}</span>
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '1.1rem', padding: 0 }}>×</button>
          <style>{`@keyframes toastIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </div>
      )}
      <div className="page-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ color: '#0f172a', marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 600 }}>Orçamentos</h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Crie orçamentos profissionais, gere PDF e envie por e-mail para seus clientes.</p>
          </div>
          <button
            onClick={() => setCriando(!criando)}
            style={{
              background: criando ? '#f1f5f9' : '#10b981',
              color: criando ? '#475569' : 'white',
              padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem',
            }}
          >
            {criando ? 'Cancelar' : '+ Novo Orçamento'}
          </button>
        </div>

        {criando && (
          <form onSubmit={salvar} style={{ background: 'white', padding: '2rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={labelStyle}>Título do Orçamento *</label>
                <input style={inputStyle} value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Desenvolvimento de site institucional" required />
              </div>
              <div>
                <label style={labelStyle}>Nome do Cliente *</label>
                <input style={inputStyle} value={clienteNome} onChange={e => setClienteNome(e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>E-mail do Cliente</label>
                <input style={inputStyle} type="email" value={clienteEmail} onChange={e => setClienteEmail(e.target.value)} placeholder="Para envio do orçamento" />
              </div>
              <div>
                <label style={labelStyle}>CPF/CNPJ do Cliente</label>
                <input style={inputStyle} value={clienteDocumento} onChange={e => setClienteDocumento(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Validade</label>
                <input style={inputStyle} type="date" value={validade} onChange={e => setValidade(e.target.value)} />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Observações</label>
              <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Condições de pagamento, prazo de entrega, etc." />
            </div>

            <h3 style={{ fontSize: '1rem', color: '#0f172a', margin: '1.5rem 0 0.75rem' }}>Itens do Orçamento</h3>
            {itens.map((item, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 130px 130px 40px', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                <input style={inputStyle} placeholder="Descrição do item/serviço" value={item.descricao} onChange={e => atualizarItem(idx, 'descricao', e.target.value)} />
                <input style={inputStyle} type="number" min="0" step="any" placeholder="Qtd" value={item.quantidade} onChange={e => atualizarItem(idx, 'quantidade', e.target.value)} />
                <input style={inputStyle} type="number" min="0" step="0.01" placeholder="Valor unit." value={item.valor_unitario} onChange={e => atualizarItem(idx, 'valor_unitario', e.target.value)} />
                <div style={{ textAlign: 'right', fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>
                  {moeda(item.quantidade * item.valor_unitario)}
                </div>
                <button type="button" onClick={() => setItens(prev => prev.filter((_, i) => i !== idx))} disabled={itens.length === 1}
                  style={{ background: 'none', border: 'none', color: '#dc2626', cursor: itens.length === 1 ? 'not-allowed' : 'pointer', fontSize: '1.2rem', opacity: itens.length === 1 ? 0.3 : 1 }}>
                  ×
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setItens(prev => [...prev, { descricao: '', quantidade: 1, valor_unitario: 0 }])}
              style={{ background: '#f1f5f9', color: '#475569', border: '1px dashed #cbd5e1', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              + Adicionar item
            </button>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2rem', alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <div>
                <label style={{ ...labelStyle, marginBottom: '0.2rem' }}>Desconto (R$)</label>
                <input style={{ ...inputStyle, width: '130px' }} type="number" min="0" step="0.01" value={desconto} onChange={e => setDesconto(parseFloat(e.target.value) || 0)} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Subtotal: {moeda(subtotal)}</div>
                <div style={{ color: '#0f172a', fontSize: '1.3rem', fontWeight: 700 }}>Total: {moeda(total)}</div>
              </div>
              <button type="submit" disabled={salvando}
                style={{ background: '#10b981', color: 'white', padding: '0.85rem 2rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', opacity: salvando ? 0.7 : 1 }}>
                {salvando ? 'Salvando...' : 'Salvar Orçamento'}
              </button>
            </div>
          </form>
        )}

        <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '0.9rem 1rem', textAlign: 'left', color: '#475569', fontSize: '0.85rem' }}>Nº</th>
                  <th style={{ padding: '0.9rem 1rem', textAlign: 'left', color: '#475569', fontSize: '0.85rem' }}>Título</th>
                  <th style={{ padding: '0.9rem 1rem', textAlign: 'left', color: '#475569', fontSize: '0.85rem' }}>Cliente</th>
                  <th style={{ padding: '0.9rem 1rem', textAlign: 'right', color: '#475569', fontSize: '0.85rem' }}>Total</th>
                  <th style={{ padding: '0.9rem 1rem', textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>Status</th>
                  <th style={{ padding: '0.9rem 1rem', textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {orcamentos.map(orc => {
                  const st = STATUS_LABELS[orc.status] || STATUS_LABELS.rascunho;
                  return (
                    <tr key={orc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.9rem' }}>#{orc.numero}</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#0f172a', fontWeight: 500 }}>{orc.titulo}</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>{orc.cliente_nome}</td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', color: '#0f172a', fontWeight: 600 }}>{moeda(Number(orc.total))}</td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <span style={{ background: st.fundo, color: st.cor, padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600 }}>
                          {st.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button title="Baixar PDF" onClick={() => baixarPdf(orc)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.3rem', color: '#475569' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        </button>
                        <button title="Enviar por e-mail" onClick={() => enviarEmail(orc)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.3rem', color: '#2563eb' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        </button>
                        <button title="Marcar aprovado" onClick={() => mudarStatus(orc, 'aprovado')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.3rem', color: '#16a34a' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </button>
                        <button title="Marcar recusado" onClick={() => mudarStatus(orc, 'recusado')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.3rem', color: '#d97706' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                        <button title="Excluir" onClick={() => excluir(orc)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.3rem', color: '#dc2626' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {orcamentos.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                      {carregando ? 'Carregando...' : 'Nenhum orçamento criado ainda. Clique em "+ Novo Orçamento" para começar.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
