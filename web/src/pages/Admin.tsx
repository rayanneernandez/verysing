import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import axios from 'axios';
import '../App.css';

interface UsuarioAdmin {
  id: string;
  nome: string;
  email: string;
  cpf?: string;
  tipo_plano: string;
  status_plano: string;
  ativo: boolean;
  criado_em: string;
}

interface Stats {
  usuarios: number;
  documentos: number;
  contratos: number;
  comunicados: number;
  orcamentos: number;
}

const PLANOS_OPCOES = ['gratuito', 'profissional', 'empresarial', 'admin'];

const PLANO_CORES: Record<string, { cor: string; fundo: string }> = {
  gratuito: { cor: '#64748b', fundo: '#f1f5f9' },
  profissional: { cor: '#2563eb', fundo: '#eff6ff' },
  empresarial: { cor: '#7c3aed', fundo: '#f5f3ff' },
  admin: { cor: '#dc2626', fundo: '#fef2f2' },
};

export default function Admin() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || '';
  const emailAdmin = localStorage.getItem('userEmail') || '';
  const planoUsuario = localStorage.getItem('userPlan') || '';

  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (planoUsuario !== 'admin') {
      navigate('/app');
      return;
    }
    Promise.all([
      axios.get(`${API_URL}/api/admin/usuarios`, { params: { email_admin: emailAdmin } }),
      axios.get(`${API_URL}/api/admin/stats`, { params: { email_admin: emailAdmin } }),
    ])
      .then(([resUsuarios, resStats]) => {
        setUsuarios(resUsuarios.data || []);
        setStats(resStats.data);
      })
      .catch(err => {
        const detalhe = err.response?.data?.detail;
        setErro(typeof detalhe === 'string' ? detalhe : 'Erro ao carregar dados administrativos.');
      })
      .finally(() => setCarregando(false));
  }, []);

  const alterarPlano = async (usuario: UsuarioAdmin, novoPlano: string) => {
    try {
      await axios.put(`${API_URL}/api/admin/usuarios/${usuario.id}/plano`, {
        email_admin: emailAdmin,
        tipo_plano: novoPlano,
      });
      setUsuarios(prev => prev.map(u => (u.id === usuario.id ? { ...u, tipo_plano: novoPlano } : u)));
    } catch (err: any) {
      const detalhe = err.response?.data?.detail;
      alert(typeof detalhe === 'string' ? detalhe : 'Erro ao alterar plano.');
    }
  };

  const alternarAtivo = async (usuario: UsuarioAdmin) => {
    try {
      await axios.put(`${API_URL}/api/admin/usuarios/${usuario.id}/plano`, {
        email_admin: emailAdmin,
        tipo_plano: usuario.tipo_plano,
        ativo: !usuario.ativo,
      });
      setUsuarios(prev => prev.map(u => (u.id === usuario.id ? { ...u, ativo: !u.ativo } : u)));
    } catch {
      alert('Erro ao atualizar usuário.');
    }
  };

  const cards = stats
    ? [
        { rotulo: 'Usuários', valor: stats.usuarios },
        { rotulo: 'Documentos', valor: stats.documentos },
        { rotulo: 'Contratos', valor: stats.contratos },
        { rotulo: 'Comunicados', valor: stats.comunicados },
        { rotulo: 'Orçamentos', valor: stats.orcamentos },
      ]
    : [];

  return (
    <DashboardLayout title="Administração">
      <div className="page-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#0f172a', marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 600 }}>Painel do Administrador</h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Gerencie usuários, planos e acompanhe o uso da plataforma.</p>
        </div>

        {erro && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #fecaca' }}>
            {erro}
          </div>
        )}

        {cards.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {cards.map(card => (
              <div key={card.rotulo} style={{ background: 'white', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.35rem' }}>{card.rotulo}</div>
                <div style={{ color: '#0f172a', fontSize: '1.75rem', fontWeight: 700 }}>{card.valor}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '820px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '0.9rem 1rem', textAlign: 'left', color: '#475569', fontSize: '0.85rem' }}>Nome</th>
                  <th style={{ padding: '0.9rem 1rem', textAlign: 'left', color: '#475569', fontSize: '0.85rem' }}>E-mail</th>
                  <th style={{ padding: '0.9rem 1rem', textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>Plano</th>
                  <th style={{ padding: '0.9rem 1rem', textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>Situação</th>
                  <th style={{ padding: '0.9rem 1rem', textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>Cadastro</th>
                  <th style={{ padding: '0.9rem 1rem', textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(usuario => {
                  const planoCor = PLANO_CORES[usuario.tipo_plano] || PLANO_CORES.gratuito;
                  return (
                    <tr key={usuario.id} style={{ borderBottom: '1px solid #f1f5f9', opacity: usuario.ativo ? 1 : 0.5 }}>
                      <td style={{ padding: '0.85rem 1rem', color: '#0f172a', fontWeight: 500 }}>{usuario.nome}</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>{usuario.email}</td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <select
                          value={usuario.tipo_plano}
                          onChange={e => alterarPlano(usuario, e.target.value)}
                          style={{
                            background: planoCor.fundo, color: planoCor.cor, border: 'none',
                            padding: '0.3rem 0.6rem', borderRadius: '999px', fontSize: '0.8rem',
                            fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          {PLANOS_OPCOES.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <span style={{
                          background: usuario.ativo ? '#f0fdf4' : '#fef2f2',
                          color: usuario.ativo ? '#16a34a' : '#dc2626',
                          padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600,
                        }}>
                          {usuario.ativo ? 'Ativo' : 'Bloqueado'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                        {usuario.criado_em ? new Date(usuario.criado_em).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <button
                          onClick={() => alternarAtivo(usuario)}
                          style={{
                            background: usuario.ativo ? '#fef2f2' : '#f0fdf4',
                            color: usuario.ativo ? '#dc2626' : '#16a34a',
                            border: 'none', padding: '0.4rem 0.9rem', borderRadius: '6px',
                            cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                          }}
                        >
                          {usuario.ativo ? 'Bloquear' : 'Reativar'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {usuarios.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                      {carregando ? 'Carregando...' : 'Nenhum usuário encontrado.'}
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
