import { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useLanguage } from '../contexts/LanguageContext';
import '../App.css';
import './HistoricoComunicados.css';

type DestinatarioComunicado = {
  id: string;
  nome: string;
  email: string;
  abriu: boolean;
  dataAbertura?: string;
};

type Comunicado = {
  id: string;
  assunto: string;
  enviadoEm: string;
  totalDestinatarios: number;
  totalAberturas: number;
  destinatarios: DestinatarioComunicado[];
};

const comunicadosMock: Comunicado[] = [
  {
    id: 'c1',
    assunto: 'Mudança nas Políticas de Contrato',
    enviadoEm: '10/03/2026 09:15',
    totalDestinatarios: 250,
    totalAberturas: 180,
    destinatarios: [
      {
        id: 'd1',
        nome: 'João Silva',
        email: 'joao.silva@example.com',
        abriu: true,
        dataAbertura: '10/03/2026 09:32'
      },
      {
        id: 'd2',
        nome: 'Maria Oliveira',
        email: 'maria.oliveira@example.com',
        abriu: true,
        dataAbertura: '10/03/2026 10:05'
      },
      {
        id: 'd3',
        nome: 'Carlos Souza',
        email: 'carlos.souza@example.com',
        abriu: false
      }
    ]
  },
  {
    id: 'c2',
    assunto: 'Lançamento de Novos Recursos',
    enviadoEm: '01/03/2026 16:40',
    totalDestinatarios: 120,
    totalAberturas: 75,
    destinatarios: [
      {
        id: 'd4',
        nome: 'Ana Paula',
        email: 'ana.paula@example.com',
        abriu: true,
        dataAbertura: '01/03/2026 17:02'
      },
      {
        id: 'd5',
        nome: 'Bruno Lima',
        email: 'bruno.lima@example.com',
        abriu: false
      }
    ]
  }
];

function HistoricoComunicados() {
  const { t } = useLanguage();
  const [comunicadoSelecionadoId, setComunicadoSelecionadoId] = useState<string | null>(
    comunicadosMock[0]?.id ?? null
  );

  const comunicadoSelecionado =
    comunicadosMock.find(c => c.id === comunicadoSelecionadoId) || null;

  const taxaAbertura = (comunicado: Comunicado) => {
    if (!comunicado.totalDestinatarios) return '0%';
    const percentual = (comunicado.totalAberturas / comunicado.totalDestinatarios) * 100;
    return `${percentual.toFixed(0)}%`;
  };

  return (
    <DashboardLayout title={t('announce.preview_title')}>
      <div className="page-container">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem'
          }}
        >
          <div className="content-card">
            <div className="card-header">
              <div>
                <h2 className="page-title">
                  {t('history.title')}
                </h2>
                <p className="page-subtitle">
                  {t('history.subtitle')}
                </p>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>
                      {t('history.subject')}
                    </th>
                    <th style={{ textAlign: 'left' }}>
                      {t('history.sent_at')}
                    </th>
                    <th style={{ textAlign: 'center' }}>
                      {t('history.recipients')}
                    </th>
                    <th style={{ textAlign: 'center' }}>
                      {t('history.opens')}
                    </th>
                    <th style={{ textAlign: 'center' }}>
                      {t('history.rate')}
                    </th>
                    <th style={{ textAlign: 'center' }}>
                      {t('history.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comunicadosMock.map(comunicado => (
                    <tr
                      key={comunicado.id}
                      className={comunicadoSelecionadoId === comunicado.id ? 'selected' : ''}
                    >
                      <td style={{ color: '#0f172a' }}>
                        {comunicado.assunto}
                      </td>
                      <td style={{ color: '#475569' }}>
                        {comunicado.enviadoEm}
                      </td>
                      <td style={{ textAlign: 'center', color: '#0f172a', fontWeight: 600 }}>
                        {comunicado.totalDestinatarios}
                      </td>
                      <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>
                        {comunicado.totalAberturas}
                      </td>
                      <td style={{ textAlign: 'center', color: '#2563eb', fontWeight: 600 }}>
                        {taxaAbertura(comunicado)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => setComunicadoSelecionadoId(comunicado.id)}
                          className={`btn-action ${comunicadoSelecionadoId === comunicado.id ? 'active' : ''}`}
                        >
                          {t('history.view_recipients')}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {comunicadosMock.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          padding: '1.5rem',
                          textAlign: 'center',
                          color: '#94a3b8'
                        }}
                      >
                        {t('history.no_announcements')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="content-card">
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 className="page-title">
                {t('history.recipients_opens_title')}
              </h2>
              <p className="page-subtitle">
                {t('history.recipients_opens_subtitle')}
              </p>
            </div>

            {!comunicadoSelecionado && (
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                {t('history.select_instruction')}
              </p>
            )}

            {comunicadoSelecionado && (
              <div>
                <div
                  style={{
                    marginBottom: '1rem',
                    fontSize: '0.9rem',
                    color: '#475569'
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>
                    {comunicadoSelecionado.assunto}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    {t('history.sent_at')} {comunicadoSelecionado.enviadoEm}
                  </div>
                  <div className="stats-container">
                    <span>
                      {t('history.recipients')}:{' '}
                      <strong>{comunicadoSelecionado.totalDestinatarios}</strong>
                    </span>
                    <span>
                      {t('history.opens')}:{' '}
                      <strong>{comunicadoSelecionado.totalAberturas}</strong>
                    </span>
                    <span>
                      {t('history.rate')}:{' '}
                      <strong>{taxaAbertura(comunicadoSelecionado)}</strong>
                    </span>
                  </div>
                </div>

                <div className="table-container">
                  <table
                    className="data-table"
                    style={{ minWidth: '600px' }}
                  >
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>
                          {t('history.name')}
                        </th>
                        <th style={{ textAlign: 'left' }}>
                          {t('history.email')}
                        </th>
                        <th style={{ textAlign: 'center' }}>
                          {t('history.status')}
                        </th>
                        <th style={{ textAlign: 'center' }}>
                          {t('history.first_open')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {comunicadoSelecionado.destinatarios.map(destinatario => (
                        <tr key={destinatario.id}>
                          <td style={{ color: '#0f172a' }}>
                            {destinatario.nome}
                          </td>
                          <td style={{ color: '#475569' }}>
                            {destinatario.email}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span
                              className={`status-badge ${destinatario.abriu ? 'opened' : 'not-opened'}`}
                            >
                              {destinatario.abriu ? t('history.status_opened_badge') : t('history.status_not_opened_badge')}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                            {destinatario.abriu && destinatario.dataAbertura
                              ? destinatario.dataAbertura
                              : '—'}
                          </td>
                        </tr>
                      ))}
                      {comunicadoSelecionado.destinatarios.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            style={{
                              padding: '1.2rem',
                              textAlign: 'center',
                              color: '#94a3b8'
                            }}
                          >
                            {t('history.no_recipients')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default HistoricoComunicados;