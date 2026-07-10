import React, { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logoPng from '../assets/logo.png';


interface Template {
  id: string;
  title: string;
  description: string;
  fields: { key: string; label: string; type: string }[];
  content: (data: any) => string;
}

const ModelosContrato: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || '';
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [docHash, setDocHash] = useState<string>('');
  const [contratoRegistrado, setContratoRegistrado] = useState(false);

  // Registra o contrato gerado no backend e valida o limite mensal do plano.
  // Retorna false (e avisa o usuário) se o limite foi atingido.
  const registrarContrato = async (): Promise<boolean> => {
    if (contratoRegistrado || !selectedTemplate) return true;
    const emailUsuario = localStorage.getItem('userEmail');
    if (!emailUsuario) return true; // sem sessão, não bloqueia (fluxo antigo)
    try {
      await axios.post(`${API_URL}/api/contratos/gerar`, {
        email_usuario: emailUsuario,
        titulo: selectedTemplate.title,
        modelo_id: selectedTemplate.id,
      });
      setContratoRegistrado(true);
      return true;
    } catch (err: any) {
      const detalhe = err.response?.data?.detail;
      if (err.response?.status === 403) {
        alert(typeof detalhe === 'string' ? detalhe : 'Limite de contratos do seu plano atingido.');
        return false;
      }
      return true; // erro de rede/servidor não bloqueia a geração local
    }
  };
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const wrapContractLayout = (content: string) => `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #334155;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; padding-bottom: 1.5rem; border-bottom: 2px solid #e2e8f0;">
        <img src="${logoPng}" alt="Logo" style="height: 40px; object-fit: contain;" />
        <div style="text-align: right; font-size: 0.8rem; color: #64748b;">
          <strong>Data:</strong> ${new Date().toLocaleDateString()}<br/>
          <strong>Ref:</strong> ${docHash ? docHash.substring(0, 9) : ''}
        </div>
      </div>
      
      ${content}

      <div style="margin-top: 5rem; padding-top: 2rem; border-top: 1px solid #e2e8f0; text-align: center; font-size: 0.75rem; color: #94a3b8;">
        <p style="margin-bottom: 0.5rem; font-weight: 600; color: #475569;">Documento assinado digitalmente via Assinador Seguro</p>
        <p>A autenticidade deste documento pode ser conferida no site ${window.location.origin}/validar através do código QR ou hash abaixo.</p>
        <p style="font-family: monospace; margin-top: 0.5rem;">HASH: ${docHash}</p>
      </div>
    </div>
  `;

  const renderSignature = (name: string, role: string, label: string, anchor: string, width: string = '48%') => `
    <div style="text-align: center; width: ${width}; position: relative;">
      <p style="color: white; font-size: 1pt; margin: 0; position: absolute; top: -15px; left: 0; right: 0; z-index: -1;">${anchor}</p>
      <div style="border-top: 1px solid #000; padding-top: 10px;">
        <strong>${name || role}</strong><br/>
        <span>${label}</span>
      </div>
    </div>
  `;

  const templates: Template[] = [
    {
      id: 'servicos',
      title: 'Prestação de Serviços',
      description: 'Contrato completo para prestação de serviços entre empresas ou autônomos.',
      fields: [
        { key: 'contratante', label: 'Nome do Contratante (Cliente)', type: 'text' },
        { key: 'doc_contratante', label: 'CPF/CNPJ do Contratante', type: 'text' },
        { key: 'contratada', label: 'Nome da Contratada (Prestador)', type: 'text' },
        { key: 'doc_contratada', label: 'CPF/CNPJ da Contratada', type: 'text' },
        { key: 'servico', label: 'Descrição Detalhada do Serviço', type: 'textarea' },
        { key: 'valor', label: 'Valor Total (R$)', type: 'text' },
        { key: 'forma_pagamento', label: 'Forma de Pagamento', type: 'text' },
        { key: 'prazo', label: 'Prazo de Execução', type: 'text' },
        { key: 'cidade', label: 'Cidade do Foro', type: 'text' },
        { key: 'data', label: 'Data do Contrato', type: 'date' },
      ],
      content: (data) => wrapContractLayout(`
        <div>
          <h2 style="text-align: center; margin-bottom: 2rem;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h2>
          
          <p><strong>IDENTIFICAÇÃO DAS PARTES</strong></p>
          <p><strong>CONTRATANTE:</strong> ${data.contratante || '____________________'}, inscrito(a) no CPF/CNPJ sob o nº ${data.doc_contratante || '____________________'}, doravante denominado(a) simplesmente <strong>CONTRATANTE</strong>.</p>
          <p><strong>CONTRATADA:</strong> ${data.contratada || '____________________'}, inscrito(a) no CPF/CNPJ sob o nº ${data.doc_contratada || '____________________'}, doravante denominado(a) simplesmente <strong>CONTRATADA</strong>.</p>
          
          <p>As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de Prestação de Serviços, que se regerá pelas cláusulas seguintes:</p>

          <h3>CLÁUSULA 1ª - DO OBJETO</h3>
          <p>O presente contrato tem por objeto a prestação dos seguintes serviços pela CONTRATADA à CONTRATANTE:</p>
          <p style="background: #f8f9fa; padding: 10px; border: 1px dashed #ccc;">${data.servico || 'Descrever detalhadamente os serviços...'}</p>

          <h3>CLÁUSULA 2ª - DAS OBRIGAÇÕES DA CONTRATADA</h3>
          <p>I - Executar os serviços contratados com zelo, diligência e dentro dos padrões técnicos exigidos;</p>
          <p>II - Cumprir os prazos estabelecidos neste instrumento;</p>
          <p>III - Manter sigilo sobre quaisquer dados ou informações fornecidas pela CONTRATANTE.</p>

          <h3>CLÁUSULA 3ª - DO PREÇO E FORMA DE PAGAMENTO</h3>
          <p>Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA a importância total de <strong>R$ ${data.valor || '___,00'}</strong>.</p>
          <p>O pagamento será realizado da seguinte forma: ${data.forma_pagamento || 'Conforme combinado'}.</p>

          <h3>CLÁUSULA 4ª - DO PRAZO</h3>
          <p>Os serviços terão início imediato após a assinatura deste contrato e deverão ser concluídos no prazo de: ${data.prazo || '___ dias/meses'}.</p>

          <h3>CLÁUSULA 5ª - DA RESCISÃO</h3>
          <p>O presente contrato poderá ser rescindido por qualquer uma das partes, mediante aviso prévio de 30 (trinta) dias, ou imediatamente em caso de descumprimento de qualquer cláusula.</p>

          <h3>CLÁUSULA 6ª - DO FORO</h3>
          <p>Fica eleito o foro da comarca de ${data.cidade || '____________________'} para dirimir quaisquer dúvidas oriundas deste contrato.</p>
          
          <br/><br/>
          <p style="text-align: center;">${data.cidade || '___________'}, ${data.data ? new Date(data.data).toLocaleDateString() : '___ de ____________ de ______'}.</p>
          <br/><br/>
          
          <div style="display: flex; justify-content: space-between; margin-top: 40px; gap: 20px;">
            ${renderSignature(data.contratante, 'CONTRATANTE', 'Assinatura do Contratante', '{{SIGNATURE_CONTRATANTE}}')}
            ${renderSignature(data.contratada, 'CONTRATADA', 'Assinatura da Contratada', '{{SIGNATURE_CONTRATADA}}')}
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 40px; gap: 20px;">
            <div style="text-align: center; width: 48%; position: relative;">
              <p style="color: white; font-size: 1pt; margin: 0; position: absolute; top: -15px; left: 0; right: 0; z-index: -1;">{{SIGNATURE_TESTEMUNHA_1}}</p>
              <div style="border-top: 1px solid #000; padding-top: 10px;">
                <span>Testemunha 1</span><br/>
                <span>CPF: __________________</span>
              </div>
            </div>
            <div style="text-align: center; width: 48%; position: relative;">
              <p style="color: white; font-size: 1pt; margin: 0; position: absolute; top: -15px; left: 0; right: 0; z-index: -1;">{{SIGNATURE_TESTEMUNHA_2}}</p>
              <div style="border-top: 1px solid #000; padding-top: 10px;">
                <span>Testemunha 2</span><br/>
                <span>CPF: __________________</span>
              </div>
            </div>
          </div>
        </div>
      `)
    },
    {
      id: 'locacao_residencial',
      title: 'Locação Residencial',
      description: 'Contrato detalhado para aluguel de imóveis residenciais.',
      fields: [
        { key: 'locador', label: 'Nome do Locador', type: 'text' },
        { key: 'doc_locador', label: 'CPF do Locador', type: 'text' },
        { key: 'locatario', label: 'Nome do Locatário', type: 'text' },
        { key: 'doc_locatario', label: 'CPF do Locatário', type: 'text' },
        { key: 'endereco', label: 'Endereço Completo do Imóvel', type: 'text' },
        { key: 'valor', label: 'Valor Mensal do Aluguel (R$)', type: 'text' },
        { key: 'dia_pagamento', label: 'Dia do Vencimento', type: 'number' },
        { key: 'prazo_meses', label: 'Prazo da Locação (Meses)', type: 'number' },
        { key: 'cidade', label: 'Cidade', type: 'text' },
      ],
      content: (data) => wrapContractLayout(`
        <div>
          <h2 style="text-align: center;">CONTRATO DE LOCAÇÃO RESIDENCIAL</h2>
          
          <p><strong>LOCADOR:</strong> ${data.locador || '____________________'}, CPF ${data.doc_locador || '____________________'}.</p>
          <p><strong>LOCATÁRIO:</strong> ${data.locatario || '____________________'}, CPF ${data.doc_locatario || '____________________'}.</p>
          
          <h3>I - DO OBJETO DA LOCAÇÃO</h3>
          <p>O presente contrato tem como objeto a locação do imóvel residencial situado na ${data.endereco || '________________________________________'}, de propriedade do LOCADOR.</p>
          
          <h3>II - DO PRAZO</h3>
          <p>A locação terá vigência pelo prazo de ${data.prazo_meses || '___'} meses, iniciando-se na data de assinatura deste instrumento.</p>
          
          <h3>III - DO VALOR E PAGAMENTO</h3>
          <p>O valor mensal do aluguel é fixado em <strong>R$ ${data.valor || '___,00'}</strong>, devendo ser pago até o dia ${data.dia_pagamento || '__'} de cada mês subsequente ao vencido.</p>
          
          <h3>IV - DOS ENCARGOS</h3>
          <p>Além do aluguel, caberá ao LOCATÁRIO o pagamento de todos os encargos tributários (IPTU), despesas de condomínio, consumo de água, luz, esgoto e gás.</p>
          
          <h3>V - DA CONSERVAÇÃO</h3>
          <p>O LOCATÁRIO obriga-se a manter o imóvel em perfeitas condições de uso e habitabilidade, devolvendo-o nas mesmas condições em que o recebeu.</p>

          <br/>
          <p style="text-align: center;">${data.cidade || '___________'}, ${new Date().toLocaleDateString()}</p>
          <br/><br/>
          
          <div style="display: flex; justify-content: space-between; margin-top: 40px; gap: 20px;">
            ${renderSignature(data.locador, 'LOCADOR', 'Assinatura do Locador', '{{SIGNATURE_LOCADOR}}')}
            ${renderSignature(data.locatario, 'LOCATÁRIO', 'Assinatura do Locatário', '{{SIGNATURE_LOCATARIO}}')}
          </div>
        </div>
      `)
    },
    {
      id: 'nda',
      title: 'Acordo de Confidencialidade',
      description: 'NDA (Non-Disclosure Agreement) para proteção de informações.',
      fields: [
        { key: 'parte_reveladora', label: 'Parte Reveladora (Empresa/Pessoa)', type: 'text' },
        { key: 'parte_recebedora', label: 'Parte Recebedora (Empresa/Pessoa)', type: 'text' },
        { key: 'objetivo', label: 'Objetivo da Troca de Informações', type: 'text' },
        { key: 'tempo_sigilo', label: 'Tempo de Sigilo (anos)', type: 'number' },
        { key: 'cidade', label: 'Cidade', type: 'text' },
      ],
      content: (data) => wrapContractLayout(`
        <div>
          <h2 style="text-align: center;">ACORDO DE CONFIDENCIALIDADE (NDA)</h2>
          
          <p>Pelo presente instrumento, as partes:</p>
          <p><strong>REVELADORA:</strong> ${data.parte_reveladora || '____________________'}</p>
          <p><strong>RECEBEDORA:</strong> ${data.parte_recebedora || '____________________'}</p>
          
          <p>Resolvem celebrar o presente Acordo de Confidencialidade, sob as seguintes cláusulas:</p>
          
          <h3>1. DO OBJETO</h3>
          <p>O objetivo deste acordo é proteger as Informações Confidenciais disponibilizadas pela REVELADORA à RECEBEDORA no âmbito de: ${data.objetivo || '____________________'}.</p>
          
          <h3>2. DA CONFIDENCIALIDADE</h3>
          <p>A RECEBEDORA compromete-se a não utilizar, reproduzir ou divulgar a terceiros quaisquer Informações Confidenciais sem o consentimento prévio e por escrito da REVELADORA.</p>
          
          <h3>3. DA VIGÊNCIA</h3>
          <p>A obrigação de confidencialidade permanecerá em vigor pelo período de ${data.tempo_sigilo || '5'} anos após a assinatura deste termo.</p>
          
          <h3>4. DA PENALIDADE</h3>
          <p>A violação deste acordo sujeitará o infrator ao pagamento de perdas e danos comprovados, sem prejuízo das demais sanções legais cabíveis.</p>

          <br/>
          <p style="text-align: center;">${data.cidade || '___________'}, ${new Date().toLocaleDateString()}</p>
          <br/><br/>
          
          <div style="display: flex; justify-content: space-between; margin-top: 40px; gap: 20px;">
            ${renderSignature(data.parte_reveladora, 'REVELADORA', 'Assinatura', '{{SIGNATURE_REVELADORA}}')}
            ${renderSignature(data.parte_recebedora, 'RECEBEDORA', 'Assinatura', '{{SIGNATURE_RECEBEDORA}}')}
          </div>
        </div>
      `)
    },
    {
      id: 'compra_venda_veiculo',
      title: 'Compra e Venda de Veículo',
      description: 'Contrato seguro para transferência de propriedade de veículos.',
      fields: [
        { key: 'vendedor', label: 'Nome do Vendedor', type: 'text' },
        { key: 'doc_vendedor', label: 'CPF do Vendedor', type: 'text' },
        { key: 'comprador', label: 'Nome do Comprador', type: 'text' },
        { key: 'doc_comprador', label: 'CPF do Comprador', type: 'text' },
        { key: 'modelo', label: 'Modelo do Veículo', type: 'text' },
        { key: 'placa', label: 'Placa', type: 'text' },
        { key: 'chassi', label: 'Chassi', type: 'text' },
        { key: 'ano', label: 'Ano/Modelo', type: 'text' },
        { key: 'valor', label: 'Valor da Venda (R$)', type: 'text' },
        { key: 'cidade', label: 'Cidade', type: 'text' },
      ],
      content: (data) => wrapContractLayout(`
        <div>
          <h2 style="text-align: center;">CONTRATO DE COMPRA E VENDA DE VEÍCULO</h2>
          
          <p><strong>VENDEDOR:</strong> ${data.vendedor || '____________________'}, CPF ${data.doc_vendedor || '____________________'}.</p>
          <p><strong>COMPRADOR:</strong> ${data.comprador || '____________________'}, CPF ${data.doc_comprador || '____________________'}.</p>
          
          <h3>DO OBJETO</h3>
          <p>O VENDEDOR vende ao COMPRADOR o veículo de sua propriedade, livre e desembaraçado de quaisquer ônus, com as seguintes características:</p>
          <ul>
            <li>Modelo: ${data.modelo || '____________________'}</li>
            <li>Placa: ${data.placa || '_______'}</li>
            <li>Chassi: ${data.chassi || '____________________'}</li>
            <li>Ano/Modelo: ${data.ano || '____/____'}</li>
          </ul>
          
          <h3>DO PREÇO</h3>
          <p>O preço certo e ajustado para a venda é de <strong>R$ ${data.valor || '___,00'}</strong>, pago neste ato.</p>
          
          <h3>DA RESPONSABILIDADE</h3>
          <p>O VENDEDOR responsabiliza-se por multas e tributos anteriores a esta data. O COMPRADOR assume a responsabilidade pela transferência do veículo junto ao DETRAN no prazo de 30 dias.</p>
          
          <br/>
          <p style="text-align: center;">${data.cidade || '___________'}, ${new Date().toLocaleDateString()}</p>
          <br/><br/>
          
          <div style="display: flex; justify-content: space-between; margin-top: 40px; gap: 20px;">
            ${renderSignature(data.vendedor, 'VENDEDOR', 'Assinatura', '{{SIGNATURE_VENDEDOR}}')}
            ${renderSignature(data.comprador, 'COMPRADOR', 'Assinatura', '{{SIGNATURE_COMPRADOR}}')}
          </div>
        </div>
      `)
    },
    {
      id: 'termo_adesao',
      title: 'Termo de Adesão',
      description: 'Termo para adesão a serviços, plataformas ou programas.',
      fields: [
        { key: 'empresa', label: 'Nome da Empresa/Organização', type: 'text' },
        { key: 'usuario', label: 'Nome do Usuário/Aderente', type: 'text' },
        { key: 'doc_usuario', label: 'CPF do Usuário', type: 'text' },
        { key: 'servico', label: 'Serviço/Produto Contratado', type: 'text' },
        { key: 'cidade', label: 'Cidade', type: 'text' },
      ],
      content: (data) => wrapContractLayout(`
        <div>
          <h2 style="text-align: center;">TERMO DE ADESÃO</h2>
          
          <p>Pelo presente instrumento, o <strong>ADERENTE</strong> abaixo identificado, manifesta sua livre e expressa concordância com os termos e condições de uso dos serviços prestados pela <strong>${data.empresa || 'EMPRESA'}</strong>.</p>
          
          <h3>DADOS DO ADERENTE</h3>
          <p>Nome: ${data.usuario || '____________________'}</p>
          <p>CPF: ${data.doc_usuario || '____________________'}</p>
          
          <h3>DO OBJETO</h3>
          <p>O presente termo formaliza a adesão aos serviços de: ${data.servico || '____________________'}.</p>
          
          <h3>DECLARAÇÃO</h3>
          <p>O ADERENTE declara ter lido, compreendido e aceito todas as cláusulas do Contrato Principal/Termos de Uso que rege a prestação dos serviços.</p>
          
          <br/>
          <p style="text-align: center;">${data.cidade || '___________'}, ${new Date().toLocaleDateString()}</p>
          <br/><br/>
          
          <div style="display: flex; justify-content: center; margin-top: 40px;">
            ${renderSignature(data.usuario, 'ADERENTE', 'Assinatura do Usuário', '{{SIGNATURE_USUARIO}}', '60%')}
          </div>
        </div>
      `)
    },
    {
      id: 'trabalho',
      title: 'Contrato de Trabalho',
      description: 'Modelo para contratação de funcionário (CLT).',
      fields: [
        { key: 'empregador', label: 'Empregador (Empresa)', type: 'text' },
        { key: 'cnpj', label: 'CNPJ do Empregador', type: 'text' },
        { key: 'empregado', label: 'Nome do Empregado', type: 'text' },
        { key: 'cpf', label: 'CPF do Empregado', type: 'text' },
        { key: 'cargo', label: 'Cargo/Função', type: 'text' },
        { key: 'salario', label: 'Salário Mensal (R$)', type: 'text' },
        { key: 'horario', label: 'Horário de Trabalho', type: 'text' },
        { key: 'cidade', label: 'Cidade', type: 'text' },
      ],
      content: (data) => wrapContractLayout(`
        <div>
          <h2 style="text-align: center;">CONTRATO INDIVIDUAL DE TRABALHO</h2>
          
          <p><strong>EMPREGADOR:</strong> ${data.empregador || '____________________'}, CNPJ ${data.cnpj || '____________________'}.</p>
          <p><strong>EMPREGADO:</strong> ${data.empregado || '____________________'}, CPF ${data.cpf || '____________________'}, CTPS nº _____ Série _____.</p>
          
          <p>As partes firmam o presente contrato de trabalho por prazo indeterminado, mediante as seguintes cláusulas:</p>
          
          <h3>1. DA FUNÇÃO</h3>
          <p>O EMPREGADO exercerá a função de <strong>${data.cargo || '____________________'}</strong>, comprometendo-se a executá-la com zelo e lealdade.</p>
          
          <h3>2. DO SALÁRIO</h3>
          <p>O EMPREGADO perceberá a remuneração mensal de <strong>R$ ${data.salario || '___,00'}</strong>, a ser paga até o 5º dia útil do mês subsequente.</p>
          
          <h3>3. DO HORÁRIO</h3>
          <p>A jornada de trabalho será: ${data.horario || '44 horas semanais'}.</p>
          
          <h3>4. DOS DESCONTOS</h3>
          <p>O EMPREGADO autoriza o desconto em folha de pagamento das importâncias referentes aos encargos legais (INSS, IRRF) e benefícios concedidos.</p>

          <br/>
          <p style="text-align: center;">${data.cidade || '___________'}, ${new Date().toLocaleDateString()}</p>
          <br/><br/>
          
          <div style="display: flex; justify-content: space-between; margin-top: 40px; gap: 20px;">
            ${renderSignature(data.empregador, 'EMPREGADOR', 'Assinatura', '{{SIGNATURE_EMPREGADOR}}')}
            ${renderSignature(data.empregado, 'EMPREGADO', 'Assinatura', '{{SIGNATURE_EMPREGADO}}')}
          </div>
        </div>
      `)
    },
    {
      id: 'mei',
      title: 'Prestação de Serviços MEI',
      description: 'Contrato específico para Microempreendedor Individual.',
      fields: [
        { key: 'mei', label: 'Nome do MEI (Contratado)', type: 'text' },
        { key: 'cnpj_mei', label: 'CNPJ do MEI', type: 'text' },
        { key: 'cliente', label: 'Nome do Cliente (Contratante)', type: 'text' },
        { key: 'doc_cliente', label: 'CPF/CNPJ do Cliente', type: 'text' },
        { key: 'servico', label: 'Descrição do Serviço', type: 'textarea' },
        { key: 'valor', label: 'Valor (R$)', type: 'text' },
        { key: 'cidade', label: 'Cidade', type: 'text' },
      ],
      content: (data) => wrapContractLayout(`
        <div>
          <h2 style="text-align: center;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS - MEI</h2>
          
          <p><strong>CONTRATADO (MEI):</strong> ${data.mei || '____________________'}, CNPJ ${data.cnpj_mei || '____________________'}.</p>
          <p><strong>CONTRATANTE:</strong> ${data.cliente || '____________________'}, CPF/CNPJ ${data.doc_cliente || '____________________'}.</p>
          
          <h3>DO OBJETO</h3>
          <p>O CONTRATADO prestará ao CONTRATANTE, de forma autônoma e sem vínculo empregatício, os serviços de: ${data.servico || '____________________'}.</p>
          
          <h3>DO VALOR</h3>
          <p>O valor acordado para a execução do serviço é de <strong>R$ ${data.valor || '___,00'}</strong>, contra a emissão da respectiva Nota Fiscal de Serviços (NFS-e).</p>
          
          <h3>DA INEXISTÊNCIA DE VÍNCULO</h3>
          <p>As partes declaram que não há subordinação jurídica ou hierárquica, nem habitualidade que caracterize vínculo empregatício.</p>

          <br/>
          <p style="text-align: center;">${data.cidade || '___________'}, ${new Date().toLocaleDateString()}</p>
          <br/><br/>
          
          <div style="display: flex; justify-content: space-between; margin-top: 40px; gap: 20px;">
            ${renderSignature(data.mei, 'CONTRATADO (MEI)', 'Assinatura', '{{SIGNATURE_MEI}}')}
            ${renderSignature(data.cliente, 'CONTRATANTE', 'Assinatura', '{{SIGNATURE_CLIENTE}}')}
          </div>
        </div>
      `)
    },
    {
      id: 'locacao_comercial',
      title: 'Locação Comercial',
      description: 'Contrato completo para locação de imóvel comercial.',
      fields: [
        { key: 'locador', label: 'Locador (Proprietário)', type: 'text' },
        { key: 'doc_locador', label: 'CPF/CNPJ Locador', type: 'text' },
        { key: 'locatario', label: 'Locatário (Inquilino)', type: 'text' },
        { key: 'doc_locatario', label: 'CPF/CNPJ Locatário', type: 'text' },
        { key: 'imovel', label: 'Endereço do Imóvel Comercial', type: 'text' },
        { key: 'atividade', label: 'Atividade Comercial Permitida', type: 'text' },
        { key: 'valor', label: 'Valor do Aluguel (R$)', type: 'text' },
        { key: 'prazo', label: 'Prazo (Meses)', type: 'number' },
        { key: 'cidade', label: 'Cidade', type: 'text' },
      ],
      content: (data) => wrapContractLayout(`
        <div>
          <h2 style="text-align: center;">CONTRATO DE LOCAÇÃO COMERCIAL</h2>
          
          <p><strong>LOCADOR:</strong> ${data.locador || '____________________'}, portador do CPF/CNPJ ${data.doc_locador || '____________________'}.</p>
          <p><strong>LOCATÁRIO:</strong> ${data.locatario || '____________________'}, portador do CPF/CNPJ ${data.doc_locatario || '____________________'}.</p>
          
          <h3>CLÁUSULA 1ª - DO OBJETO</h3>
          <p>O presente contrato tem por objeto a locação para fins <strong>NÃO RESIDENCIAIS</strong> do imóvel situado em: ${data.imovel || '____________________'}.</p>
          
          <h3>CLÁUSULA 2ª - DA DESTINAÇÃO</h3>
          <p>O imóvel destina-se exclusivamente à atividade de: ${data.atividade || 'Comércio em Geral'}, sendo vedada a mudança de destinação sem anuência expressa do LOCADOR.</p>
          
          <h3>CLÁUSULA 3ª - DO PRAZO</h3>
          <p>O prazo de locação é de ${data.prazo || '___'} meses, iniciando-se na assinatura deste contrato.</p>
          
          <h3>CLÁUSULA 4ª - DO ALUGUEL</h3>
          <p>O aluguel mensal será de <strong>R$ ${data.valor || '___,00'}</strong>, reajustável anualmente pelo índice IGPM-FGV.</p>
          
          <h3>CLÁUSULA 5ª - DAS BENFEITORIAS</h3>
          <p>Quaisquer obras ou modificações no imóvel dependem de prévia autorização por escrito do LOCADOR. Benfeitorias necessárias não serão indenizáveis.</p>

          <br/>
          <p style="text-align: center;">${data.cidade || '___________'}, ${new Date().toLocaleDateString()}</p>
          <br/><br/>
          
          <div style="display: flex; justify-content: space-between; margin-top: 40px; gap: 20px;">
            ${renderSignature(data.locador, 'LOCADOR', 'Assinatura', '{{SIGNATURE_LOCADOR}}')}
            ${renderSignature(data.locatario, 'LOCATÁRIO', 'Assinatura', '{{SIGNATURE_LOCATARIO}}')}
          </div>
        </div>
      `)
    },
    {
      id: 'distrato',
      title: 'Distrato Contratual',
      description: 'Instrumento para formalizar o encerramento de um contrato vigente.',
      fields: [
        { key: 'parte_a', label: 'Parte A (Quem contratou)', type: 'text' },
        { key: 'doc_a', label: 'CPF/CNPJ Parte A', type: 'text' },
        { key: 'parte_b', label: 'Parte B (Contratado)', type: 'text' },
        { key: 'doc_b', label: 'CPF/CNPJ Parte B', type: 'text' },
        { key: 'contrato_origem', label: 'Descrição do Contrato Original', type: 'text' },
        { key: 'data_contrato', label: 'Data do Contrato Original', type: 'date' },
        { key: 'cidade', label: 'Cidade', type: 'text' },
      ],
      content: (data) => wrapContractLayout(`
        <div>
          <h2 style="text-align: center;">TERMO DE DISTRATO</h2>
          
          <p><strong>PRIMEIRA DISTRATANTE:</strong> ${data.parte_a || '____________________'}, CPF/CNPJ ${data.doc_a || '____________________'}.</p>
          <p><strong>SEGUNDA DISTRATANTE:</strong> ${data.parte_b || '____________________'}, CPF/CNPJ ${data.doc_b || '____________________'}.</p>
          
          <h3>DO OBJETO</h3>
          <p>As partes acima qualificadas, de comum acordo, resolvem <strong>RESCINDIR</strong>, para todos os fins de direito, o contrato de ${data.contrato_origem || 'Prestação de Serviços/Locação'}, firmado em ${data.data_contrato ? new Date(data.data_contrato).toLocaleDateString() : '__/__/____'}.</p>
          
          <h3>DA QUITAÇÃO</h3>
          <p>As partes dão-se mútua, plena, geral e irrevogável quitação de todas as obrigações decorrentes do contrato ora rescindido, nada mais tendo a reclamar uma da outra a qualquer título.</p>

          <br/>
          <p style="text-align: center;">${data.cidade || '___________'}, ${new Date().toLocaleDateString()}</p>
          <br/><br/>
          
          <div style="display: flex; justify-content: space-between; margin-top: 40px; gap: 20px;">
            ${renderSignature(data.parte_a, 'PRIMEIRA DISTRATANTE', 'Assinatura', '{{SIGNATURE_DISTRATANTE_1}}')}
            ${renderSignature(data.parte_b, 'SEGUNDA DISTRATANTE', 'Assinatura', '{{SIGNATURE_DISTRATANTE_2}}')}
          </div>
        </div>
      `)
    },
    {
      id: 'imagem',
      title: 'Cessão de Direitos de Imagem',
      description: 'Autorização legal para uso de imagem e voz.',
      fields: [
        { key: 'cedente', label: 'Cedente (Pessoa na imagem)', type: 'text' },
        { key: 'doc_cedente', label: 'CPF/RG do Cedente', type: 'text' },
        { key: 'cessionario', label: 'Cessionário (Quem usará)', type: 'text' },
        { key: 'finalidade', label: 'Finalidade do Uso (Publicidade, Institucional, etc)', type: 'text' },
        { key: 'midias', label: 'Mídias (Internet, TV, Impresso)', type: 'text' },
        { key: 'prazo', label: 'Prazo de Uso', type: 'text' },
        { key: 'cidade', label: 'Cidade', type: 'text' },
      ],
      content: (data) => wrapContractLayout(`
        <div>
          <h2 style="text-align: center;">TERMO DE CESSÃO DE DIREITOS DE IMAGEM E VOZ</h2>
          
          <p><strong>CEDENTE:</strong> ${data.cedente || '____________________'}, portador do documento ${data.doc_cedente || '____________________'}.</p>
          <p><strong>CESSIONÁRIO:</strong> ${data.cessionario || '____________________'}.</p>
          
          <h3>DA AUTORIZAÇÃO</h3>
          <p>Pelo presente instrumento, o CEDENTE autoriza o CESSIONÁRIO a utilizar sua imagem e/ou voz, a título gratuito (ou oneroso, se aplicável), para fins de: ${data.finalidade || 'Divulgação'}.</p>
          
          <h3>DOS MEIOS DE VEICULAÇÃO</h3>
          <p>A presente autorização abrange a veiculação nas seguintes mídias: ${data.midias || 'Todas as mídias'}.</p>
          
          <h3>DO PRAZO E TERRITÓRIO</h3>
          <p>A utilização da imagem é permitida pelo prazo de ${data.prazo || 'Indeterminado'}, em território nacional e internacional.</p>

          <br/>
          <p style="text-align: center;">${data.cidade || '___________'}, ${new Date().toLocaleDateString()}</p>
          <br/><br/>
          
          <div style="display: flex; justify-content: center; margin-top: 40px;">
            ${renderSignature(data.cedente, 'CEDENTE', 'Assinatura', '{{SIGNATURE_CEDENTE}}', '60%')}
          </div>
        </div>
      `)
    },
    {
      id: 'compra_venda_imovel',
      title: 'Compra e Venda de Imóvel',
      description: 'Promessa de compra e venda de imóvel com condições de pagamento.',
      fields: [
        { key: 'vendedor', label: 'Nome do Vendedor (Promitente)', type: 'text' },
        { key: 'doc_vendedor', label: 'CPF/CNPJ do Vendedor', type: 'text' },
        { key: 'comprador', label: 'Nome do Comprador (Promissário)', type: 'text' },
        { key: 'doc_comprador', label: 'CPF/CNPJ do Comprador', type: 'text' },
        { key: 'imovel', label: 'Descrição e Endereço do Imóvel', type: 'textarea' },
        { key: 'matricula', label: 'Matrícula do Imóvel (Cartório)', type: 'text' },
        { key: 'valor', label: 'Valor Total (R$)', type: 'text' },
        { key: 'sinal', label: 'Valor do Sinal/Entrada (R$)', type: 'text' },
        { key: 'forma_pagamento', label: 'Forma de Pagamento do Restante', type: 'text' },
        { key: 'cidade', label: 'Cidade', type: 'text' },
      ],
      content: (data) => wrapContractLayout(`
        <div>
          <h2 style="text-align: center;">PROMESSA DE COMPRA E VENDA DE IMÓVEL</h2>

          <p><strong>PROMITENTE VENDEDOR:</strong> ${data.vendedor || '____________________'}, CPF/CNPJ ${data.doc_vendedor || '____________________'}.</p>
          <p><strong>PROMISSÁRIO COMPRADOR:</strong> ${data.comprador || '____________________'}, CPF/CNPJ ${data.doc_comprador || '____________________'}.</p>

          <h3>CLÁUSULA 1ª - DO OBJETO</h3>
          <p>O presente contrato tem por objeto o imóvel assim descrito: ${data.imovel || '________________________________________'}, registrado sob a matrícula nº ${data.matricula || '__________'}.</p>

          <h3>CLÁUSULA 2ª - DO PREÇO E PAGAMENTO</h3>
          <p>O preço certo e ajustado é de <strong>R$ ${data.valor || '___,00'}</strong>, sendo <strong>R$ ${data.sinal || '___,00'}</strong> pagos a título de sinal e princípio de pagamento, e o restante da seguinte forma: ${data.forma_pagamento || '____________________'}.</p>

          <h3>CLÁUSULA 3ª - DA ESCRITURA</h3>
          <p>A escritura definitiva será outorgada após a quitação integral do preço, correndo as despesas de transferência (ITBI, escritura e registro) por conta do COMPRADOR.</p>

          <h3>CLÁUSULA 4ª - DA POSSE</h3>
          <p>O COMPRADOR será imitido na posse do imóvel após o pagamento do sinal, respondendo a partir de então por todos os tributos e encargos incidentes.</p>

          <h3>CLÁUSULA 5ª - DO ARREPENDIMENTO</h3>
          <p>Em caso de desistência pelo COMPRADOR, este perderá o sinal pago. Em caso de desistência pelo VENDEDOR, este devolverá o sinal em dobro (art. 418 do Código Civil).</p>

          <br/>
          <p style="text-align: center;">${data.cidade || '___________'}, ${new Date().toLocaleDateString()}</p>
          <br/><br/>

          <div style="display: flex; justify-content: space-between; margin-top: 40px; gap: 20px;">
            ${renderSignature(data.vendedor, 'PROMITENTE VENDEDOR', 'Assinatura', '{{SIGNATURE_VENDEDOR}}')}
            ${renderSignature(data.comprador, 'PROMISSÁRIO COMPRADOR', 'Assinatura', '{{SIGNATURE_COMPRADOR}}')}
          </div>
        </div>
      `)
    },
    {
      id: 'emprestimo',
      title: 'Empréstimo entre Particulares',
      description: 'Contrato de mútuo (empréstimo de dinheiro) com confissão de dívida.',
      fields: [
        { key: 'credor', label: 'Nome do Credor (Quem empresta)', type: 'text' },
        { key: 'doc_credor', label: 'CPF do Credor', type: 'text' },
        { key: 'devedor', label: 'Nome do Devedor (Quem recebe)', type: 'text' },
        { key: 'doc_devedor', label: 'CPF do Devedor', type: 'text' },
        { key: 'valor', label: 'Valor Emprestado (R$)', type: 'text' },
        { key: 'parcelas', label: 'Número de Parcelas', type: 'number' },
        { key: 'valor_parcela', label: 'Valor de Cada Parcela (R$)', type: 'text' },
        { key: 'primeiro_vencimento', label: 'Data do Primeiro Vencimento', type: 'date' },
        { key: 'cidade', label: 'Cidade', type: 'text' },
      ],
      content: (data) => wrapContractLayout(`
        <div>
          <h2 style="text-align: center;">CONTRATO DE MÚTUO (EMPRÉSTIMO)</h2>

          <p><strong>MUTUANTE (CREDOR):</strong> ${data.credor || '____________________'}, CPF ${data.doc_credor || '____________________'}.</p>
          <p><strong>MUTUÁRIO (DEVEDOR):</strong> ${data.devedor || '____________________'}, CPF ${data.doc_devedor || '____________________'}.</p>

          <h3>1. DO OBJETO</h3>
          <p>O MUTUANTE empresta ao MUTUÁRIO, neste ato, a quantia de <strong>R$ ${data.valor || '___,00'}</strong>, cujo recebimento o MUTUÁRIO confirma e dá plena quitação pela presente via.</p>

          <h3>2. DO PAGAMENTO</h3>
          <p>O MUTUÁRIO restituirá o valor em ${data.parcelas || '___'} parcelas de <strong>R$ ${data.valor_parcela || '___,00'}</strong>, vencendo-se a primeira em ${data.primeiro_vencimento ? new Date(data.primeiro_vencimento).toLocaleDateString() : '__/__/____'} e as demais no mesmo dia dos meses subsequentes.</p>

          <h3>3. DO ATRASO</h3>
          <p>Em caso de inadimplemento, incidirá multa de 2% sobre o valor da parcela, juros de mora de 1% ao mês e correção monetária, vencendo-se antecipadamente as demais parcelas.</p>

          <h3>4. DO TÍTULO EXECUTIVO</h3>
          <p>Este contrato, assinado pelas partes e por duas testemunhas, constitui título executivo extrajudicial nos termos do art. 784, III, do CPC.</p>

          <br/>
          <p style="text-align: center;">${data.cidade || '___________'}, ${new Date().toLocaleDateString()}</p>
          <br/><br/>

          <div style="display: flex; justify-content: space-between; margin-top: 40px; gap: 20px;">
            ${renderSignature(data.credor, 'MUTUANTE', 'Assinatura do Credor', '{{SIGNATURE_CREDOR}}')}
            ${renderSignature(data.devedor, 'MUTUÁRIO', 'Assinatura do Devedor', '{{SIGNATURE_DEVEDOR}}')}
          </div>
        </div>
      `)
    },
    {
      id: 'consultoria',
      title: 'Consultoria Empresarial',
      description: 'Contrato para serviços de consultoria e assessoria especializada.',
      fields: [
        { key: 'consultor', label: 'Nome do Consultor/Empresa', type: 'text' },
        { key: 'doc_consultor', label: 'CPF/CNPJ do Consultor', type: 'text' },
        { key: 'cliente', label: 'Nome do Cliente', type: 'text' },
        { key: 'doc_cliente', label: 'CPF/CNPJ do Cliente', type: 'text' },
        { key: 'escopo', label: 'Escopo da Consultoria', type: 'textarea' },
        { key: 'valor', label: 'Honorários (R$)', type: 'text' },
        { key: 'periodicidade', label: 'Periodicidade (mensal, por projeto...)', type: 'text' },
        { key: 'vigencia', label: 'Vigência do Contrato', type: 'text' },
        { key: 'cidade', label: 'Cidade', type: 'text' },
      ],
      content: (data) => wrapContractLayout(`
        <div>
          <h2 style="text-align: center;">CONTRATO DE CONSULTORIA EMPRESARIAL</h2>

          <p><strong>CONSULTOR(A):</strong> ${data.consultor || '____________________'}, CPF/CNPJ ${data.doc_consultor || '____________________'}.</p>
          <p><strong>CLIENTE:</strong> ${data.cliente || '____________________'}, CPF/CNPJ ${data.doc_cliente || '____________________'}.</p>

          <h3>1. DO OBJETO</h3>
          <p>Prestação de serviços de consultoria compreendendo: ${data.escopo || '________________________________________'}.</p>

          <h3>2. DOS HONORÁRIOS</h3>
          <p>Pelos serviços, o CLIENTE pagará honorários de <strong>R$ ${data.valor || '___,00'}</strong> (${data.periodicidade || 'mensais'}).</p>

          <h3>3. DA VIGÊNCIA</h3>
          <p>O presente contrato vigorará por ${data.vigencia || '____________________'}, podendo ser renovado por acordo entre as partes.</p>

          <h3>4. DA CONFIDENCIALIDADE</h3>
          <p>O CONSULTOR manterá sigilo absoluto sobre todas as informações do CLIENTE a que tiver acesso, obrigação que subsiste por 5 anos após o término do contrato.</p>

          <h3>5. DA AUTONOMIA</h3>
          <p>Os serviços serão prestados sem exclusividade, subordinação ou habitualidade, não configurando vínculo empregatício.</p>

          <br/>
          <p style="text-align: center;">${data.cidade || '___________'}, ${new Date().toLocaleDateString()}</p>
          <br/><br/>

          <div style="display: flex; justify-content: space-between; margin-top: 40px; gap: 20px;">
            ${renderSignature(data.consultor, 'CONSULTOR(A)', 'Assinatura', '{{SIGNATURE_CONSULTOR}}')}
            ${renderSignature(data.cliente, 'CLIENTE', 'Assinatura', '{{SIGNATURE_CLIENTE}}')}
          </div>
        </div>
      `)
    },
    {
      id: 'freelancer',
      title: 'Freelancer / Trabalho Autônomo',
      description: 'Contrato para projetos freelance (design, marketing, desenvolvimento, etc).',
      fields: [
        { key: 'freelancer', label: 'Nome do Freelancer', type: 'text' },
        { key: 'doc_freelancer', label: 'CPF/CNPJ do Freelancer', type: 'text' },
        { key: 'cliente', label: 'Nome do Cliente', type: 'text' },
        { key: 'doc_cliente', label: 'CPF/CNPJ do Cliente', type: 'text' },
        { key: 'projeto', label: 'Descrição do Projeto/Entregáveis', type: 'textarea' },
        { key: 'valor', label: 'Valor do Projeto (R$)', type: 'text' },
        { key: 'prazo_entrega', label: 'Prazo de Entrega', type: 'text' },
        { key: 'revisoes', label: 'Número de Revisões Incluídas', type: 'number' },
        { key: 'cidade', label: 'Cidade', type: 'text' },
      ],
      content: (data) => wrapContractLayout(`
        <div>
          <h2 style="text-align: center;">CONTRATO DE TRABALHO FREELANCE</h2>

          <p><strong>CONTRATADO (FREELANCER):</strong> ${data.freelancer || '____________________'}, CPF/CNPJ ${data.doc_freelancer || '____________________'}.</p>
          <p><strong>CONTRATANTE (CLIENTE):</strong> ${data.cliente || '____________________'}, CPF/CNPJ ${data.doc_cliente || '____________________'}.</p>

          <h3>1. DO PROJETO</h3>
          <p>O FREELANCER executará o seguinte projeto: ${data.projeto || '________________________________________'}.</p>

          <h3>2. DO VALOR E PAGAMENTO</h3>
          <p>O valor total do projeto é de <strong>R$ ${data.valor || '___,00'}</strong>, sendo 50% na assinatura deste contrato e 50% na entrega final.</p>

          <h3>3. DO PRAZO E REVISÕES</h3>
          <p>O prazo de entrega é de ${data.prazo_entrega || '____________'} a contar da assinatura e do recebimento de todos os materiais necessários. Estão incluídas ${data.revisoes || '2'} rodadas de revisão; revisões adicionais serão orçadas à parte.</p>

          <h3>4. DOS DIREITOS AUTORAIS</h3>
          <p>Após a quitação integral, os direitos patrimoniais sobre o material produzido serão transferidos ao CLIENTE, podendo o FREELANCER exibir o trabalho em seu portfólio.</p>

          <h3>5. DO CANCELAMENTO</h3>
          <p>Em caso de cancelamento pelo CLIENTE após o início dos trabalhos, o sinal pago não será restituído, e etapas concluídas serão cobradas proporcionalmente.</p>

          <br/>
          <p style="text-align: center;">${data.cidade || '___________'}, ${new Date().toLocaleDateString()}</p>
          <br/><br/>

          <div style="display: flex; justify-content: space-between; margin-top: 40px; gap: 20px;">
            ${renderSignature(data.freelancer, 'FREELANCER', 'Assinatura', '{{SIGNATURE_FREELANCER}}')}
            ${renderSignature(data.cliente, 'CLIENTE', 'Assinatura', '{{SIGNATURE_CLIENTE}}')}
          </div>
        </div>
      `)
    },
    {
      id: 'parceria',
      title: 'Parceria Comercial',
      description: 'Acordo de parceria entre empresas ou profissionais com divisão de resultados.',
      fields: [
        { key: 'parceiro_a', label: 'Parceiro A (Nome/Empresa)', type: 'text' },
        { key: 'doc_a', label: 'CPF/CNPJ Parceiro A', type: 'text' },
        { key: 'parceiro_b', label: 'Parceiro B (Nome/Empresa)', type: 'text' },
        { key: 'doc_b', label: 'CPF/CNPJ Parceiro B', type: 'text' },
        { key: 'objeto', label: 'Objeto da Parceria', type: 'textarea' },
        { key: 'divisao', label: 'Divisão de Resultados (ex: 50%/50%)', type: 'text' },
        { key: 'vigencia', label: 'Vigência', type: 'text' },
        { key: 'cidade', label: 'Cidade', type: 'text' },
      ],
      content: (data) => wrapContractLayout(`
        <div>
          <h2 style="text-align: center;">CONTRATO DE PARCERIA COMERCIAL</h2>

          <p><strong>PARCEIRO A:</strong> ${data.parceiro_a || '____________________'}, CPF/CNPJ ${data.doc_a || '____________________'}.</p>
          <p><strong>PARCEIRO B:</strong> ${data.parceiro_b || '____________________'}, CPF/CNPJ ${data.doc_b || '____________________'}.</p>

          <h3>1. DO OBJETO</h3>
          <p>As partes estabelecem parceria comercial para: ${data.objeto || '________________________________________'}.</p>

          <h3>2. DA DIVISÃO DE RESULTADOS</h3>
          <p>Os resultados líquidos decorrentes da parceria serão divididos na proporção: ${data.divisao || '____________________'}.</p>

          <h3>3. DAS OBRIGAÇÕES</h3>
          <p>Cada parceiro arcará com seus próprios custos operacionais, salvo acordo escrito em contrário, e se compromete a atuar com boa-fé e transparência, prestando contas mensalmente.</p>

          <h3>4. DA INDEPENDÊNCIA</h3>
          <p>Esta parceria não constitui sociedade, franquia ou vínculo empregatício entre as partes, tampouco autoriza uma parte a assumir obrigações em nome da outra.</p>

          <h3>5. DA VIGÊNCIA E RESCISÃO</h3>
          <p>A parceria vigorará por ${data.vigencia || 'prazo indeterminado'}, podendo ser rescindida por qualquer parte mediante aviso prévio de 30 dias, respeitados os compromissos em andamento.</p>

          <br/>
          <p style="text-align: center;">${data.cidade || '___________'}, ${new Date().toLocaleDateString()}</p>
          <br/><br/>

          <div style="display: flex; justify-content: space-between; margin-top: 40px; gap: 20px;">
            ${renderSignature(data.parceiro_a, 'PARCEIRO A', 'Assinatura', '{{SIGNATURE_PARCEIRO_A}}')}
            ${renderSignature(data.parceiro_b, 'PARCEIRO B', 'Assinatura', '{{SIGNATURE_PARCEIRO_B}}')}
          </div>
        </div>
      `)
    },
    {
      id: 'comodato',
      title: 'Comodato (Empréstimo de Bem)',
      description: 'Empréstimo gratuito de bem móvel ou imóvel com devolução garantida.',
      fields: [
        { key: 'comodante', label: 'Comodante (Dono do bem)', type: 'text' },
        { key: 'doc_comodante', label: 'CPF/CNPJ do Comodante', type: 'text' },
        { key: 'comodatario', label: 'Comodatário (Quem usará)', type: 'text' },
        { key: 'doc_comodatario', label: 'CPF/CNPJ do Comodatário', type: 'text' },
        { key: 'bem', label: 'Descrição do Bem Emprestado', type: 'textarea' },
        { key: 'prazo', label: 'Prazo do Comodato', type: 'text' },
        { key: 'cidade', label: 'Cidade', type: 'text' },
      ],
      content: (data) => wrapContractLayout(`
        <div>
          <h2 style="text-align: center;">CONTRATO DE COMODATO</h2>

          <p><strong>COMODANTE:</strong> ${data.comodante || '____________________'}, CPF/CNPJ ${data.doc_comodante || '____________________'}.</p>
          <p><strong>COMODATÁRIO:</strong> ${data.comodatario || '____________________'}, CPF/CNPJ ${data.doc_comodatario || '____________________'}.</p>

          <h3>1. DO OBJETO</h3>
          <p>O COMODANTE empresta gratuitamente ao COMODATÁRIO o seguinte bem: ${data.bem || '________________________________________'}.</p>

          <h3>2. DO PRAZO</h3>
          <p>O comodato vigorará pelo prazo de ${data.prazo || '____________________'}, findo o qual o bem deverá ser restituído no estado em que foi recebido, ressalvado o desgaste natural.</p>

          <h3>3. DAS OBRIGAÇÕES DO COMODATÁRIO</h3>
          <p>O COMODATÁRIO se obriga a conservar o bem como se seu fosse, utilizá-lo exclusivamente para a finalidade a que se destina e arcar com as despesas ordinárias de uso e manutenção.</p>

          <h3>4. DA RESTITUIÇÃO</h3>
          <p>Constituído em mora para a devolução, o COMODATÁRIO pagará aluguel arbitrado pelo COMODANTE, sem prejuízo das perdas e danos (art. 582 do Código Civil).</p>

          <br/>
          <p style="text-align: center;">${data.cidade || '___________'}, ${new Date().toLocaleDateString()}</p>
          <br/><br/>

          <div style="display: flex; justify-content: space-between; margin-top: 40px; gap: 20px;">
            ${renderSignature(data.comodante, 'COMODANTE', 'Assinatura', '{{SIGNATURE_COMODANTE}}')}
            ${renderSignature(data.comodatario, 'COMODATÁRIO', 'Assinatura', '{{SIGNATURE_COMODATARIO}}')}
          </div>
        </div>
      `)
    },
    {
      id: 'recibo_quitacao',
      title: 'Recibo e Termo de Quitação',
      description: 'Recibo de pagamento com quitação plena de valores ou serviços.',
      fields: [
        { key: 'recebedor', label: 'Quem Recebe (Credor)', type: 'text' },
        { key: 'doc_recebedor', label: 'CPF/CNPJ de Quem Recebe', type: 'text' },
        { key: 'pagador', label: 'Quem Paga (Devedor)', type: 'text' },
        { key: 'doc_pagador', label: 'CPF/CNPJ de Quem Paga', type: 'text' },
        { key: 'valor', label: 'Valor Recebido (R$)', type: 'text' },
        { key: 'valor_extenso', label: 'Valor por Extenso', type: 'text' },
        { key: 'referente', label: 'Referente a (serviço, dívida, produto...)', type: 'textarea' },
        { key: 'forma_pagamento', label: 'Forma de Pagamento (PIX, dinheiro...)', type: 'text' },
        { key: 'cidade', label: 'Cidade', type: 'text' },
      ],
      content: (data) => wrapContractLayout(`
        <div>
          <h2 style="text-align: center;">RECIBO E TERMO DE QUITAÇÃO</h2>

          <p>Eu, <strong>${data.recebedor || '____________________'}</strong>, inscrito(a) no CPF/CNPJ sob o nº ${data.doc_recebedor || '____________________'}, declaro que recebi de <strong>${data.pagador || '____________________'}</strong>, CPF/CNPJ ${data.doc_pagador || '____________________'}, a importância de <strong>R$ ${data.valor || '___,00'}</strong> (${data.valor_extenso || '____________________'}), por meio de ${data.forma_pagamento || '____________________'}.</p>

          <h3>REFERENTE A</h3>
          <p style="background: #f8f9fa; padding: 10px; border: 1px dashed #ccc;">${data.referente || '________________________________________'}</p>

          <h3>DA QUITAÇÃO</h3>
          <p>Pelo presente recibo, dou plena, geral e irrevogável <strong>QUITAÇÃO</strong> do valor acima descrito, para nada mais reclamar a qualquer título, seja judicial ou extrajudicialmente.</p>

          <br/>
          <p style="text-align: center;">${data.cidade || '___________'}, ${new Date().toLocaleDateString()}</p>
          <br/><br/>

          <div style="display: flex; justify-content: center; margin-top: 40px;">
            ${renderSignature(data.recebedor, 'RECEBEDOR', 'Assinatura de quem recebeu', '{{SIGNATURE_RECEBEDOR}}', '60%')}
          </div>
        </div>
      `)
    },
  ];

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleDownloadWord = async () => {
    if (!selectedTemplate) return;
    if (!(await registrarContrato())) return;

    const content = selectedTemplate.content(formData);
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${selectedTemplate.title}</title></head>
      <body>${content}</body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedTemplate.title.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = async () => {
    if (!(await registrarContrato())) return;
    window.print();
  };

  const handleSendForSignature = async () => {
    if (!selectedTemplate) return;
    if (!(await registrarContrato())) return;

    const content = selectedTemplate.content(formData);
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${selectedTemplate.title}</title>
        <style>
          body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #334155; max-width: 800px; margin: 0 auto; padding: 2rem; }
          h2, h3 { text-align: center; color: #0f172a; }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;

    const file = new File([htmlContent], `${selectedTemplate.title.replace(/\s+/g, '_')}.html`, { type: 'text/html' });
    navigate('/enviar', { state: { file, docHash } });
  };

  // Pagination logic
  const totalPages = Math.ceil(templates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTemplates = templates.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <DashboardLayout title={t('templates.title')}>
      <div className="container-fluid py-4">
        {!selectedTemplate ? (
          <>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-800">{t('templates.title')}</h2>
              <p className="text-gray-600">{t('templates.subtitle')}</p>
            </div>
            
            <div className="grid-templates">
              {currentTemplates.map(template => (
                <div key={template.id} className="template-card" onClick={() => {
                  setFormData({});
                  setSelectedTemplate(template);
                  setContratoRegistrado(false);
                  setDocHash(Math.random().toString(36).substr(2, 32).toUpperCase());
                }}>
                  <div className="template-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  </div>
                  <h3 className="template-title">{template.title}</h3>
                  <p className="template-desc">{template.description}</p>
                  <button className="template-btn">{t('templates.use_btn')}</button>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '2rem', gap: '0.5rem' }}>
                <button 
                  onClick={() => goToPage(currentPage - 1)} 
                  disabled={currentPage === 1}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.375rem',
                    background: currentPage === 1 ? '#f1f5f9' : 'white',
                    color: currentPage === 1 ? '#94a3b8' : '#334155',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  &lt; Anterior
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid',
                      borderColor: currentPage === page ? '#3b82f6' : '#e2e8f0',
                      borderRadius: '0.375rem',
                      background: currentPage === page ? '#3b82f6' : 'white',
                      color: currentPage === page ? 'white' : '#334155',
                      cursor: 'pointer',
                      fontWeight: currentPage === page ? '600' : '400'
                    }}
                  >
                    {page}
                  </button>
                ))}

                <button 
                  onClick={() => goToPage(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.375rem',
                    background: currentPage === totalPages ? '#f1f5f9' : 'white',
                    color: currentPage === totalPages ? '#94a3b8' : '#334155',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Próxima &gt;
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="template-editor">
            <div className="editor-header mb-4" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button 
                onClick={() => setSelectedTemplate(null)} 
                className="back-btn"
                style={{ 
                  background: '#f1f5f9', 
                  padding: '0.5rem 1rem', 
                  borderRadius: '6px', 
                  fontWeight: '600',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                  border: '1px solid #e2e8f0'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                {t('templates.back')}
              </button>
              <h2 className="text-xl font-bold" style={{ margin: 0 }}>{selectedTemplate.title}</h2>
            </div>

            <div className="editor-grid">
              <div className="editor-sidebar">
                <h3 className="text-lg font-semibold mb-3">{t('templates.fill_title')}</h3>
                <div className="form-fields">
                  {selectedTemplate.fields.map(field => (
                    <div key={field.key} className="form-group">
                      <label>{field.label}</label>
                      {field.type === 'textarea' ? (
                        <textarea 
                          className="form-input" 
                          value={formData[field.key] || ''}
                          onChange={(e) => handleInputChange(field.key, e.target.value)}
                        />
                      ) : (
                        <input 
                          type={field.type} 
                          className="form-input" 
                          value={formData[field.key] || ''}
                          onChange={(e) => handleInputChange(field.key, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="action-buttons mt-4">
                  <button 
                    onClick={handleSendForSignature} 
                    className="btn-primary w-full mb-3"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    {t('templates.send_sign')}
                  </button>
                  <button onClick={handleDownloadWord} className="btn-secondary w-full mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    {t('templates.download_word')}
                  </button>
                  <button onClick={handleDownloadPDF} className="btn-secondary w-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    {t('templates.download_pdf')}
                  </button>
                </div>
              </div>

              <div className="preview-container printable-area">
                <div className="paper-preview" dangerouslySetInnerHTML={{ __html: selectedTemplate.content(formData) }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .grid-templates {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        .template-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .template-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          border-color: #3b82f6;
        }
        .template-icon {
          background: #eff6ff;
          padding: 12px;
          border-radius: 10px;
          margin-bottom: 1rem;
        }
        .template-title {
          font-weight: 600;
          font-size: 1.1rem;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }
        .template-desc {
          color: #64748b;
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
          flex-grow: 1;
        }
        .template-btn {
          width: 100%;
          padding: 0.75rem;
          background: #f1f5f9;
          color: #475569;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .template-card:hover .template-btn {
          background: #3b82f6;
          color: white;
        }
        .back-btn {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          font-weight: 500;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .back-btn:hover {
          color: #1e293b;
        }
        .editor-grid {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 2rem;
          align-items: start;
        }
        .editor-sidebar {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          position: sticky;
          top: 2rem;
        }
        .form-group {
          margin-bottom: 1rem;
        }
        .form-group label {
          display: block;
          font-size: 0.9rem;
          font-weight: 500;
          color: #475569;
          margin-bottom: 0.4rem;
        }
        .form-input {
          width: 100%;
          padding: 0.6rem;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.9rem;
        }
        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .paper-preview {
          background: white;
          padding: 3rem;
          min-height: 800px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border-radius: 4px;
          font-family: 'Inter', sans-serif;
          line-height: 1.6;
          color: #334155;
        }
        .btn-primary {
          background: #10b981;
          color: white;
          border: none;
          padding: 0.85rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.6rem;
          box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);
        }
        .btn-primary:hover {
          background: #059669;
          transform: translateY(-1px);
          box-shadow: 0 6px 8px -1px rgba(16, 185, 129, 0.3);
        }
        .btn-secondary {
          background: white;
          color: #475569;
          border: 1px solid #cbd5e1;
          padding: 0.85rem;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.6rem;
        }
        .btn-secondary:hover {
          background: #f8fafc;
          border-color: #94a3b8;
          color: #1e293b;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-area, .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .dashboard-layout {
            display: block;
          }
          .sidebar, .top-header, .editor-sidebar {
            display: none !important;
          }
        }
        @media (max-width: 1024px) {
          .editor-grid {
            grid-template-columns: 1fr;
          }
          .editor-sidebar {
            position: static;
          }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default ModelosContrato;