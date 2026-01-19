import { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useLanguage } from '../contexts/LanguageContext';
import '../App.css';

type Formulario = {
  id: string;
  titulo: string;
  criadoEm: string;
  destinatario: string;
  status: 'ativo' | 'arquivado';
  totalRespostas: number;
};

type RespostaFormulario = {
  id: string;
  dataHora: string;
  respondente: string;
  email: string;
  respostas: { pergunta: string; resposta: string }[];
};

const formulariosMock: Formulario[] = [
  {
    id: '1',
    titulo: 'Pesquisa de Satisfação de Clientes',
    criadoEm: '05/03/2026',
    destinatario: 'clientes@empresa.com',
    status: 'ativo',
    totalRespostas: 23
  },
  {
    id: '2',
    titulo: 'Cadastro de Novo Cliente',
    criadoEm: '20/02/2026',
    destinatario: 'comercial@empresa.com',
    status: 'ativo',
    totalRespostas: 8
  },
  {
    id: '3',
    titulo: 'Pesquisa Interna de Clima',
    criadoEm: '10/01/2026',
    destinatario: 'time@empresa.com',
    status: 'arquivado',
    totalRespostas: 42
  }
];

const respostasMock: Record<string, RespostaFormulario[]> = {
  '1': [
    {
      id: 'r1',
      dataHora: '05/03/2026 10:21',
      respondente: 'João Silva',
      email: 'joao.silva@example.com',
      respostas: [
        { pergunta: 'Como você avalia nosso atendimento?', resposta: 'Excelente' },
        { pergunta: 'Você recomendaria nossa empresa?', resposta: 'Sim, com certeza.' }
      ]
    },
    {
      id: 'r2',
      dataHora: '05/03/2026 11:03',
      respondente: 'Maria Oliveira',
      email: 'maria.oliveira@example.com',
      respostas: [
        { pergunta: 'Como você avalia nosso atendimento?', resposta: 'Bom' },
        { pergunta: 'Você recomendaria nossa empresa?', resposta: 'Provavelmente sim.' }
      ]
    }
  ],
  '2': [
    {
      id: 'r3',
      dataHora: '21/02/2026 15:10',
      respondente: 'Carlos Souza',
      email: 'carlos.souza@example.com',
      respostas: [
        { pergunta: 'Nome completo', resposta: 'Carlos Souza' },
        { pergunta: 'CPF', resposta: '000.000.000-00' }
      ]
    }
  ],
  '3': []
};

function MeusFormularios() {
  const { t } = useLanguage();
  const [formularioSelecionadoId, setFormularioSelecionadoId] = useState<string | null>(
    formulariosMock[0]?.id ?? null
  );

  const formularioSelecionado = formulariosMock.find(f => f.id === formularioSelecionadoId) || null;
  const respostasSelecionadas: RespostaFormulario[] =
    (formularioSelecionado && respostasMock[formularioSelecionado.id]) || [];

  return (
    <DashboardLayout title={t('forms.list')}>
      <div
        className="page-container"
        style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem'
          }}
        >
          <div
            className="content-card"
            style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              width: '100%'
            }}
          >
            <div
              style={{
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <h2
                  style={{
                    color: '#0f172a',
                    marginBottom: '0.25rem',
                    fontSize: '1.3rem',
                    fontWeight: 600
                  }}
                >
                  {t('forms.list')}
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  Veja todos os formulários enviados e o total de respostas.
                </p>
              </div>
            </div>

            <div
              style={{
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                overflowX: 'auto'
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.9rem',
                  minWidth: '800px'
                }}
              >
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '0.75rem 1rem',
                        color: '#64748b',
                        fontWeight: 600
                      }}
                    >
                      {t('forms.form_title')}
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '0.75rem 1rem',
                        color: '#64748b',
                        fontWeight: 600
                      }}
                    >
                      Criado em
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '0.75rem 1rem',
                        color: '#64748b',
                        fontWeight: 600
                      }}
                    >
                      Enviado para
                    </th>
                    <th
                      style={{
                        textAlign: 'center',
                        padding: '0.75rem 1rem',
                        color: '#64748b',
                        fontWeight: 600
                      }}
                    >
                      Respostas
                    </th>
                    <th
                      style={{
                        textAlign: 'center',
                        padding: '0.75rem 1rem',
                        color: '#64748b',
                        fontWeight: 600
                      }}
                    >
                      Status
                    </th>
                    <th
                      style={{
                        textAlign: 'center',
                        padding: '0.75rem 1rem',
                        color: '#64748b',
                        fontWeight: 600
                      }}
                    >
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {formulariosMock.map(formulario => (
                    <tr
                      key={formulario.id}
                      style={{
                        borderTop: '1px solid #e2e8f0',
                        background:
                          formularioSelecionadoId === formulario.id ? '#eff6ff' : 'white'
                      }}
                    >
                      <td style={{ padding: '0.75rem 1rem', color: '#0f172a' }}>
                        {formulario.titulo}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                        {formulario.criadoEm}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                        {formulario.destinatario}
                      </td>
                      <td
                        style={{
                          padding: '0.75rem 1rem',
                          textAlign: 'center',
                          color: '#0f172a',
                          fontWeight: 600
                        }}
                      >
                        {formulario.totalRespostas}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background:
                              formulario.status === 'ativo' ? '#ecfdf3' : '#f1f5f9',
                            color:
                              formulario.status === 'ativo' ? '#15803d' : '#64748b',
                            border:
                              formulario.status === 'ativo'
                                ? '1px solid #bbf7d0'
                                : '1px solid #e2e8f0'
                          }}
                        >
                          {formulario.status === 'ativo' ? 'Ativo' : 'Arquivado'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <button
                          onClick={() => setFormularioSelecionadoId(formulario.id)}
                          style={{
                            padding: '0.4rem 0.9rem',
                            borderRadius: '999px',
                            border: '1px solid #2563eb',
                            background:
                              formularioSelecionadoId === formulario.id
                                ? '#2563eb'
                                : 'white',
                            color:
                              formularioSelecionadoId === formulario.id
                                ? 'white'
                                : '#2563eb',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Ver respostas
                        </button>
                      </td>
                    </tr>
                  ))}
                  {formulariosMock.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          padding: '1.5rem',
                          textAlign: 'center',
                          color: '#94a3b8'
                        }}
                      >
                        {t('forms.no_forms')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div
            className="content-card"
            style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              width: '100%'
            }}
          >
            <div style={{ marginBottom: '1.5rem' }}>
              <h2
                style={{
                  color: '#0f172a',
                  marginBottom: '0.25rem',
                  fontSize: '1.3rem',
                  fontWeight: 600
                }}
              >
                {t('forms.responses')}
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                Visualize as respostas recebidas do formulário selecionado.
              </p>
            </div>

            {!formularioSelecionado && (
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                Selecione um formulário na lista ao lado para ver as respostas.
              </p>
            )}

            {formularioSelecionado && respostasSelecionadas.length === 0 && (
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                Ainda não há respostas para este formulário.
              </p>
            )}

            {formularioSelecionado && respostasSelecionadas.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
              >
                {respostasSelecionadas.map(resposta => (
                  <div
                    key={resposta.id}
                    style={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      padding: '1rem',
                      background: '#f8fafc'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem'
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: '#0f172a'
                          }}
                        >
                          {resposta.respondente}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {resposta.email}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        {resposta.dataHora}
                      </div>
                    </div>

                    <div
                      style={{
                        borderTop: '1px solid #e2e8f0',
                        marginTop: '0.75rem',
                        paddingTop: '0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem'
                      }}
                    >
                      {resposta.respostas.map((r, index) => (
                        <div key={index}>
                          <div
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              color: '#475569'
                            }}
                          >
                            {r.pergunta}
                          </div>
                          <div
                            style={{
                              fontSize: '0.9rem',
                              color: '#0f172a'
                            }}
                          >
                            {r.resposta}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default MeusFormularios;