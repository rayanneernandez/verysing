import { useState, useRef } from 'react';
import axios from 'axios';
import SignatureCanvas from 'react-signature-canvas';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { DashboardLayout } from '../components/DashboardLayout';
import './Pages.css';
import '../App.css';

function Home() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [arquivo, setArquivo] = useState<File | null>(null);
  
  // Contratante
  const [modoContratante, setModoContratante] = useState<'texto' | 'desenho'>('texto');
  const [nomeContratante, setNomeContratante] = useState('');
  const sigCanvasContratante = useRef<any>({});

  // Contratada
  const [modoContratada, setModoContratada] = useState<'texto' | 'desenho'>('texto');
  const [nomeContratada, setNomeContratada] = useState('');
  const sigCanvasContratada = useRef<any>({});

  const [fonte, setFonte] = useState('Dancing Script');
  const [, setAssinatura] = useState<string>('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const selecionarArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setArquivo(e.target.files[0]);
      setAssinatura('');
      setErro('');
    }
  };

  const limparAssinatura = (ref: any) => {
      ref.current.clear();
  }

  const dataURLtoBlob = (dataurl: string) => {
    let arr = dataurl.split(',');
    let mimeMatch = arr[0].match(/:(.*?);/);
    let mime = mimeMatch ? mimeMatch[1] : 'image/png';
    let bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
  }

  // Gera uma imagem PNG a partir do texto e fonte escolhidos
  const gerarImagemDeTexto = (texto: string, fontFamily: string): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!texto.trim()) { resolve(null); return; }
      
      const canvas = document.createElement('canvas');
      canvas.width = 600; 
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(null); return; }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Configurações de desenho
      ctx.font = `50px "${fontFamily}"`; 
      ctx.fillStyle = 'black';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.fillText(texto, canvas.width / 2, canvas.height / 2);
      
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  }

  const assinarDocumento = async () => {
    if (!arquivo) return;

    setCarregando(true);
    setErro('');
    
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    // Fonte enviada apenas para registro, pois enviaremos a imagem renderizada
    formData.append('fonte', fonte);

    // Contratante
    if (modoContratante === 'texto') {
        formData.append('nome_contratante', nomeContratante);
        // Converte o texto renderizado em imagem para garantir fidelidade no PDF
        const blob = await gerarImagemDeTexto(nomeContratante, fonte);
        if (blob) {
            formData.append('img_contratante', blob, 'assinatura_contratante_gerada.png');
        }
    } else {
        const canvas = sigCanvasContratante.current;
        if (canvas && !canvas.isEmpty()) {
            const blob = dataURLtoBlob(canvas.getCanvas().toDataURL('image/png'));
            formData.append('img_contratante', blob, 'assinatura_contratante.png');
        }
    }

    // Contratada
    if (modoContratada === 'texto') {
        formData.append('nome_contratada', nomeContratada);
        const blob = await gerarImagemDeTexto(nomeContratada, fonte);
        if (blob) {
            formData.append('img_contratada', blob, 'assinatura_contratada_gerada.png');
        }
    } else {
        const canvas = sigCanvasContratada.current;
        if (canvas && !canvas.isEmpty()) {
            const blob = dataURLtoBlob(canvas.getCanvas().toDataURL('image/png'));
            formData.append('img_contratada', blob, 'assinatura_contratada.png');
        }
    }

    try {
      const resposta = await axios.post('https://localhost:8000/assinar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob'
      });

      const urlPdf = window.URL.createObjectURL(new Blob([resposta.data], { type: 'application/pdf' }));
      
      // Redireciona para a página de sucesso
      navigate('/sucesso', { 
        state: { 
            pdfUrl: urlPdf, 
            fileName: arquivo.name 
        } 
      });

    } catch (err: any) {
      console.error(err);
      let mensagemErro = 'Erro ao conectar com o servidor.';
      if (err.code === "ERR_NETWORK") {
        mensagemErro += ' Provavelmente certificado SSL não aceito. Abra https://localhost:8000/docs e aceite o risco.';
      } else if (err.response) {
        mensagemErro = `Erro do servidor: ${err.response.data.detail || err.message}`;
      }
      setErro(mensagemErro);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <DashboardLayout title={t('sign.title')}>
      <div className="page-container">
        <h1 className="page-title">{t('sign.title')}</h1>
        
        {/* Upload */}
        <div className="content-card">
          <div className="upload-area">
            <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block' }}>
              <input 
                id="file-upload"
                type="file" 
                onChange={selecionarArquivo} 
                style={{ display: 'none' }} 
              />
              <div className="upload-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <div className="upload-text">
                {t('sign.select_doc')}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                {arquivo ? `${t('send.file_selected')} ${arquivo.name}` : t('send.click_search')}
              </div>
            </label>
          </div>
        </div>

        {/* Inputs */}
        <div className="content-card">
          <h2 className="section-title">{t('sign.data_title')}</h2>
          
          <div className="form-grid">
            
            {/* Contratante */}
            <div>
              <div className="signature-header">
                <label className="input-label" style={{ marginBottom: 0 }}>{t('sign.contractor')}</label>
                <div className="mode-toggle-group">
                    <button 
                      className={`mode-btn ${modoContratante === 'texto' ? 'active' : ''}`}
                      onClick={() => setModoContratante('texto')}
                    >
                      {t('sign.type')}
                    </button>
                    <button 
                      className={`mode-btn ${modoContratante === 'desenho' ? 'active' : ''}`}
                      onClick={() => setModoContratante('desenho')}
                    >
                      {t('sign.draw')}
                    </button>
                </div>
              </div>
              
              {modoContratante === 'texto' ? (
                  <div>
                      <input 
                        type="text" 
                        placeholder={t('sign.full_name')} 
                        value={nomeContratante}
                        onChange={(e) => setNomeContratante(e.target.value)}
                        className="modern-input"
                      />
                      {/* Preview da Assinatura */}
                      <div className="preview-box">
                          {nomeContratante ? (
                              <span style={{ fontFamily: fonte, fontSize: '2.5rem', lineHeight: 1 }}>
                                  {nomeContratante}
                              </span>
                          ) : (
                              <span style={{ color: '#94a1b2', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                  Pré-visualização da assinatura
                              </span>
                          )}
                      </div>
                  </div>
              ) : (
                  <div className="sig-canvas-container">
                      <SignatureCanvas 
                          penColor="black"
                          canvasProps={{width: 340, height: 160, className: 'sigCanvas'}}
                          ref={sigCanvasContratante}
                      />
                      <button className="btn-clear-sig" onClick={() => limparAssinatura(sigCanvasContratante)}>
                        {t('sign.clear')}
                      </button>
                  </div>
              )}
            </div>

            {/* Contratada */}
            <div>
              <div className="signature-header">
                <label className="input-label" style={{ marginBottom: 0 }}>{t('sign.contracted')}</label>
                <div className="mode-toggle-group">
                    <button 
                      className={`mode-btn ${modoContratada === 'texto' ? 'active' : ''}`}
                      onClick={() => setModoContratada('texto')}
                    >
                      {t('sign.type')}
                    </button>
                    <button 
                      className={`mode-btn ${modoContratada === 'desenho' ? 'active' : ''}`}
                      onClick={() => setModoContratada('desenho')}
                    >
                      {t('sign.draw')}
                    </button>
                </div>
              </div>

              {modoContratada === 'texto' ? (
                  <div>
                      <input 
                        type="text" 
                        placeholder={t('sign.full_name')} 
                        value={nomeContratada}
                        onChange={(e) => setNomeContratada(e.target.value)}
                        className="modern-input"
                      />
                      <div className="preview-box">
                          {nomeContratada ? (
                              <span style={{ fontFamily: fonte, fontSize: '2.5rem', lineHeight: 1 }}>
                                  {nomeContratada}
                              </span>
                          ) : (
                              <span style={{ color: '#94a1b2', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                  Pré-visualização da assinatura
                              </span>
                          )}
                      </div>
                  </div>
              ) : (
                  <div className="sig-canvas-container">
                      <SignatureCanvas 
                          penColor="black"
                          canvasProps={{width: 340, height: 160, className: 'sigCanvas'}}
                          ref={sigCanvasContratada}
                      />
                      <button className="btn-clear-sig" onClick={() => limparAssinatura(sigCanvasContratada)}>
                        {t('sign.clear')}
                      </button>
                  </div>
              )}
            </div>

          </div>

          <div style={{ marginTop: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Estilo da Assinatura:</label>
              <select 
                  value={fonte} 
                  onChange={(e) => setFonte(e.target.value)}
                  className="modern-select"
              >
                  <option value="Dancing Script">Dancing Script (Elegante)</option>
                  <option value="Great Vibes">Great Vibes (Clássica)</option>
                  <option value="Sacramento">Sacramento (Moderna)</option>
                  <option value="Parisienne">Parisienne (Sofisticada)</option>
                  <option value="Allura">Allura (Fluida)</option>
              </select>
              <small style={{ display: 'block', marginTop: '5px', color: '#94a1b2' }}>* A assinatura será gerada exatamente como exibida no preview.</small>
          </div>
        </div>

        <button 
          onClick={assinarDocumento} 
          disabled={carregando || !arquivo}
          className="btn-primary"
          style={{ width: '100%', marginTop: '2rem' }}
        >
          {carregando ? 'Processando...' : t('sign.submit')}
        </button>

        {erro && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            backgroundColor: 'rgba(239, 68, 68, 0.2)', 
            border: '1px solid rgba(239, 68, 68, 0.5)', 
            color: '#fca5a5', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            {erro}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Home;