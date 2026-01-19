from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import StreamingResponse, RedirectResponse, FileResponse, JSONResponse
import json
import datetime
from fastapi.middleware.cors import CORSMiddleware
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
import os
import base64
import io
import qrcode
import urllib.parse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from pypdf import PdfReader, PdfWriter, PageObject

import hashlib
# --- Integração MongoDB ---
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Carrega variáveis de ambiente
load_dotenv(os.path.join(BASE_DIR, '../.env'))

MONGODB_URI = os.getenv("MONGODB_URI")

# Fallback manual para casos de BOM/codificação
if not MONGODB_URI:
    env_path = os.path.join(BASE_DIR, '../.env')
    if os.path.exists(env_path):
        try:
            with open(env_path, 'r', encoding='utf-8-sig') as f:
                for line in f:
                    if line.startswith('MONGODB_URI='):
                        MONGODB_URI = line.split('=', 1)[1].strip()
                        os.environ['MONGODB_URI'] = MONGODB_URI
                        break
        except Exception as e:
            print(f"Erro ao ler .env manualmente: {e}")

if not MONGODB_URI:
    print("⚠️ MONGODB_URI não encontrada no .env, o banco não vai funcionar.")

client = AsyncIOMotorClient(MONGODB_URI) if MONGODB_URI else AsyncIOMotorClient()
db = client.verysing # Conecta no banco 'verysing'

app = FastAPI()

# Modelo de Dados para Cadastro
class UsuarioCreate(BaseModel):
    nome: str
    email: EmailStr
    cpf: str
    senha: str
    tipoPlano: str = "gratuito" # gratuito, profissional, empresarial

@app.post("/usuarios")
async def criar_usuario(usuario: UsuarioCreate):
    # 1. Verifica se E-mail ou CPF já existem
    if await db.usuarios.find_one({"email": usuario.email}):
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")
    
    if await db.usuarios.find_one({"cpf": usuario.cpf}):
        raise HTTPException(status_code=400, detail="CPF já cadastrado.")

    # 2. Prepara documento
    # Em produção: usar bcrypt para hash da senha!
    senha_hash = hashlib.sha256(usuario.senha.encode()).hexdigest()
    
    # Define datas de trial se for plano pago
    inicio_trial = None
    fim_trial = None
    status_plano = "ativo" if usuario.tipoPlano == "gratuito" else "trial"
    
    if usuario.tipoPlano in ["profissional", "empresarial"]:
        agora = datetime.datetime.utcnow()
        inicio_trial = agora
        fim_trial = agora + datetime.timedelta(days=30) # 30 dias grátis

    novo_usuario = {
        "nome": usuario.nome,
        "email": usuario.email,
        "cpf": usuario.cpf,
        "senhaHash": senha_hash,
        "tipoPlano": usuario.tipoPlano,
        "statusPlano": status_plano,
        "inicioTrial": inicio_trial,
        "fimTrial": fim_trial,
        "ativo": True,
        "criadoEm": datetime.datetime.utcnow(),
        "atualizadoEm": datetime.datetime.utcnow()
    }

    # 3. Salva no MongoDB (coleção 'usuarios')
    resultado = await db.usuarios.insert_one(novo_usuario)
    
    return {
        "id": str(resultado.inserted_id),
        "mensagem": "Usuário criado com sucesso!",
        "plano": usuario.tipoPlano,
        "status": status_plano
    }

# Configuração de permissões (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIRETORIO_UPLOADS = os.path.join(BASE_DIR, "arquivos")
DIRETORIO_ASSINADOS = os.path.join(BASE_DIR, "assinados")

if not os.path.exists(DIRETORIO_ASSINADOS):
    print(f"📁 Criando diretório de assinados: {DIRETORIO_ASSINADOS}")
    os.makedirs(DIRETORIO_ASSINADOS)
else:
    print(f"📁 Diretório de assinados já existe: {DIRETORIO_ASSINADOS}")

CAMINHO_CHAVE_PRIVADA = "chave_privada_assinatura.pem"

def carregar_chave_privada():
    if not os.path.exists(CAMINHO_CHAVE_PRIVADA):
        raise Exception("Chave de assinatura nao encontrada. Rode o script de seguranca.")
        
    with open(CAMINHO_CHAVE_PRIVADA, "rb") as arquivo_chave:
        return serialization.load_pem_private_key(
            arquivo_chave.read(),
            password=None
        )

# Funções para gerar o visual do PDF
def gerar_carimbo_pdf(hash_doc, link_validacao, width, height):
    packet = io.BytesIO()
    c = canvas.Canvas(packet, pagesize=(width, height))
    
    # Configuração do Rodapé (Fundo cinza claro)
    footer_height = 45
    c.setFillColorRGB(0.96, 0.96, 0.96)
    c.rect(0, 0, width, footer_height, fill=1, stroke=0)
    
    # Logo Simulado (Azul)
    c.setFillColorRGB(0.2, 0.4, 0.8)
    c.circle(30, 22, 12, fill=1, stroke=0)
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(26, 17, "a")
    
    # Textos Legais
    c.setFillColorRGB(0.2, 0.2, 0.2)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(55, 28, "Assinado com Assinatura Eletrônica (Lei 14.063/2020)")
    
    c.setFont("Helvetica", 6)
    c.drawString(55, 18, f"Hash SHA256: {hash_doc[:24]}...")
    
    # Rótulo curto e clicável (sem URL exibida)
    texto_link = "Verificar online"
    c.drawString(55, 8, texto_link)
    try:
        tw = stringWidth(texto_link, "Helvetica", 6)
        c.linkURL(link_validacao, (55, 6, 55 + tw, 12), relative=1)
    except:
        pass
    
    # QR Code (mantém o link completo funcional) + área clicável
    qr = qrcode.QRCode(box_size=2, border=0)
    qr.add_data(link_validacao)
    qr.make(fit=True)
    img_qr = qr.make_image(fill_color="black", back_color="white")
    
    qr_bytes = io.BytesIO()
    img_qr.save(qr_bytes, format='PNG')
    qr_bytes.seek(0)
    
    qr_x, qr_y, qr_w, qr_h = width - 55, 5, 35, 35
    c.drawImage(ImageReader(qr_bytes), qr_x, qr_y, width=qr_w, height=qr_h)
    c.linkURL(link_validacao, (qr_x, qr_y, qr_x + qr_w, qr_y + qr_h), relative=1)
    
    c.save()
    packet.seek(0)
    return packet

def encontrar_coordenadas_assinatura(page):
    """
    Busca coordenadas das palavras chaves para posicionamento inteligente.
    Retorna dict: {'contratante': (x, y), 'contratada': (x, y)}
    """
    coords = {}
    
    def visitor_body(text, cm, tm, fontDict, fontSize):
        if text and text.strip():
            # Remove pontuação e deixa maiúsculo para comparação robusta
            curr_text = text.strip().upper().replace(':', '').replace('.', '')
            x = tm[4]
            y = tm[5]
            
            # 1. Detecta Labels de Texto
            if "CONTRATANTE" in curr_text:
                coords['contratante'] = (x, y)
                print(f"   -> Label CONTRATANTE encontrado em x={x}, y={y}")
            elif "CONTRATADA" in curr_text:
                coords['contratada'] = (x, y)
                print(f"   -> Label CONTRATADA encontrado em x={x}, y={y}")
            
            # 2. Detecta Linhas de Assinatura (Sublinhados)
            # Procura por sequências de pelo menos 3 underscores
            if "___" in text:
                if 'linhas' not in coords:
                    coords['linhas'] = []
                coords['linhas'].append((x, y))
                print(f"   -> Linha (____) encontrada em x={x}, y={y}")
    
    try:
        print("🔍 Iniciando extração de texto para detectar posições de assinatura...")
        page.extract_text(visitor_text=visitor_body)
    except Exception as e:
        print(f"Erro na extração de texto (ignorado): {e}")
        
    return coords

def gerar_pagina_assinaturas(nome_contratante, nome_contratada, fonte, width, height, img_contratante=None, img_contratada=None, eh_nova_pagina=False, pos_contratante=None, pos_contratada=None):
    packet = io.BytesIO()
    c = canvas.Canvas(packet, pagesize=(width, height))
    
    # Seleção de Fonte
    font_name = "Helvetica"
    try:
        if fonte == "manuscrita":
            font_name = "Times-Italic" 
        elif fonte == "serif":
            font_name = "Times-Roman"
        elif fonte == "cursiva_simples":
            font_name = "Times-Italic"
        
        c.setFont(font_name, 22)
    except:
        font_name = "Helvetica"
        c.setFont(font_name, 22)
    
    # --- Configuração de Posições ---
    
    # Posições padrão (se não houver coordenadas detectadas)
    x_esq_padrao = width * 0.25
    y_padrao = height / 2 - 50 if eh_nova_pagina else 85
    x_dir_padrao = width * 0.75
    
    # Define posição final (Prioridade: Posição passada > Padrão)
    x_ct, y_ct = pos_contratante if pos_contratante else (x_esq_padrao, y_padrao)
    x_cd, y_cd = pos_contratada if pos_contratada else (x_dir_padrao, y_padrao)

    # --- Desenho da Estrutura (Apenas se for página nova gerada pelo sistema) ---
    if eh_nova_pagina:
        # Título
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(width / 2, height - 100, "PÁGINA DE ASSINATURAS")
        c.setFont("Helvetica", 10)
        c.drawCentredString(width / 2, height - 130, "Este documento foi assinado digitalmente conforme Lei 14.063/2020")
        
        # Linhas e legendas (apenas se for nova página)
        c.setLineWidth(1)
        # Contratante
        c.line(x_ct - 75, y_ct - 10, x_ct + 75, y_ct - 10)
        c.drawCentredString(x_ct, y_ct - 25, "CONTRATANTE")
        # Contratada
        c.line(x_cd - 75, y_cd - 10, x_cd + 75, y_cd - 10)
        c.drawCentredString(x_cd, y_cd - 25, "CONTRATADA")

    # --- Inserção das Assinaturas/Nomes ---
    
    # Data da assinatura
    data_assinatura = datetime.datetime.now().strftime("%d/%m/%Y")
    c.setFont("Helvetica", 8)

    # Contratante
    if img_contratante:
        try:
            img = ImageReader(io.BytesIO(img_contratante))
            # Desenha centralizado no ponto X,Y definido
            c.drawImage(img, x_ct - 75, y_ct, width=150, height=60, mask='auto')
            # Data abaixo da imagem
            c.drawCentredString(x_ct, y_ct - 10, f"Assinado em {data_assinatura}")
        except Exception as e:
            print(f"Erro img contratante: {e}")
    elif nome_contratante:
        c.setFont(font_name, 22)
        c.drawCentredString(x_ct, y_ct, nome_contratante)
        # Data abaixo do nome
        c.setFont("Helvetica", 8)
        c.drawCentredString(x_ct, y_ct - 10, f"Assinado em {data_assinatura}")
        
    # Contratada
    if img_contratada:
        try:
            img = ImageReader(io.BytesIO(img_contratada))
            c.drawImage(img, x_cd - 75, y_cd, width=150, height=60, mask='auto')
            # Data abaixo da imagem
            c.drawCentredString(x_cd, y_cd - 10, f"Assinado em {data_assinatura}")
        except Exception as e:
            print(f"Erro img contratada: {e}")
    elif nome_contratada:
        c.setFont(font_name, 22)
        c.drawCentredString(x_cd, y_cd, nome_contratada)
        # Data abaixo do nome
        c.setFont("Helvetica", 8)
        c.drawCentredString(x_cd, y_cd - 10, f"Assinado em {data_assinatura}")

    c.save()
    packet.seek(0)
    return packet

# --- Integração de Pagamento PIX e Contratos ---
from pix_utils import gerar_payload_pix
import uuid

class DadosPagamento(BaseModel):
    nome: str
    cpf: str
    plano: str
    valor: float

class ConfirmacaoPagamento(BaseModel):
    txid: str
    nome: str
    cpf: str
    plano: str
    email: Optional[str] = None

@app.post("/api/pagamento/pix")
async def criar_pagamento_pix(dados: DadosPagamento):
    # Gera um ID de transação único
    txid = uuid.uuid4().hex[:20] # Limite do PIX é muitas vezes 25 chars, mas vamos manter seguro
    
    # Chave PIX da empresa (Exemplo: CNPJ ou Email ou Aleatória)
    # IMPORTANTE: Coloque sua chave PIX real aqui para receber de verdade!
    CHAVE_PIX = "00000000000" # SUBSTITUA POR SUA CHAVE PIX
    NOME_RECEBEDOR = "VerySing Digital"
    CIDADE_RECEBEDOR = "Sao Paulo"
    
    payload_pix = gerar_payload_pix(
        chave=CHAVE_PIX,
        nome=NOME_RECEBEDOR,
        cidade=CIDADE_RECEBEDOR,
        valor=dados.valor,
        txid=txid
    )
    
    # Gerar imagem QR Code
    qr = qrcode.QRCode(box_size=10, border=2)
    qr.add_data(payload_pix)
    qr.make(fit=True)
    img_qr = qr.make_image(fill_color="black", back_color="white")
    
    buffered = io.BytesIO()
    img_qr.save(buffered, format="PNG")
    qr_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    return {
        "txid": txid,
        "payload_pix": payload_pix,
        "qr_code_base64": qr_base64,
        "valor": dados.valor
    }

@app.post("/api/pagamento/confirmar")
async def confirmar_pagamento_contrato(dados: ConfirmacaoPagamento):
    """
    Simula a confirmação do pagamento e gera o contrato de adesão.
    Em produção, isso seria chamado por um Webhook do banco.
    """
    
    # 1. Gerar o PDF do Contrato
    packet = io.BytesIO()
    c = canvas.Canvas(packet, pagesize=A4)
    width, height = A4
    
    # Cabeçalho
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width/2, height - 50, "CONTRATO DE ADESÃO - VERYSING")
    
    c.setFont("Helvetica", 12)
    texto = f"""
    Pelo presente instrumento particular, de um lado VERYSING DIGITAL LTDA., e de outro lado
    {dados.nome}, portador(a) do CPF {dados.cpf}, doravante denominado(a) CONTRATANTE.
    
    O CONTRATANTE adere ao plano {dados.plano.upper()}, com os benefícios descritos na plataforma.
    
    O pagamento foi confirmado e a assinatura deste contrato é realizada digitalmente neste ato.
    
    Data: {datetime.datetime.now().strftime("%d/%m/%Y %H:%M:%S")}
    """
    
    text_object = c.beginText(50, height - 100)
    for line in texto.split("\n"):
        text_object.textLine(line)
    c.drawText(text_object)
    
    # Assinatura Digital do Sistema
    c.setFont("Helvetica-Oblique", 10)
    c.drawString(50, height - 300, f"Assinado digitalmente por VerySing System")
    c.drawString(50, height - 315, f"Transação ID: {dados.txid}")
    
    c.save()
    packet.seek(0)
    
    # Salvar arquivo
    nome_arquivo = f"contrato_{dados.txid}.pdf"
    caminho_arquivo = os.path.join(DIRETORIO_ASSINADOS, nome_arquivo)
    
    with open(caminho_arquivo, "wb") as f:
        f.write(packet.read())
        
    # URL para download (ajuste conforme sua rota de arquivos estáticos ou endpoint de download)
    # Supondo que você tenha uma rota para servir arquivos de 'assinados' ou similar
    # Se não tiver, vamos retornar o caminho relativo ou criar uma rota rápida de download
    
    return {
        "status": "aprovado",
        "mensagem": "Pagamento confirmado e contrato gerado com sucesso.",
        "contrato_arquivo": nome_arquivo
    }

@app.get("/download/{nome_arquivo}")
async def download_arquivo(nome_arquivo: str):
    caminho = os.path.join(DIRETORIO_ASSINADOS, nome_arquivo)
    if os.path.exists(caminho):
        return FileResponse(caminho, media_type='application/pdf', filename=nome_arquivo)
    raise HTTPException(status_code=404, detail="Arquivo não encontrado")

def aplicar_assinatura_visual(pdf_bytes, id_documento, hash_visual, nome_contratante="", nome_contratada="", fonte="padrao", img_contratante=None, img_contratada=None):
    try:
        leitor = PdfReader(io.BytesIO(pdf_bytes))
        escritor = PdfWriter()
        
        # Link agora usa o ID curto e seguro
        link = f"https://localhost:8000/validar?hash={id_documento}"
        
        # Variáveis para capturar tamanho da última página
        last_width = 0
        last_height = 0
        
        # Copia todas as páginas e aplica carimbo
        for i, pagina in enumerate(leitor.pages):
            width = float(pagina.mediabox.width)
            height = float(pagina.mediabox.height)
            last_width = width
            last_height = height
            
            nova_pagina = PageObject.create_blank_page(width=width, height=height)
            nova_pagina.merge_page(pagina)
            
            # Carimbo de rodapé
            carimbo_pdf = PdfReader(gerar_carimbo_pdf(hash_visual, link, width, height))
            nova_pagina.merge_page(carimbo_pdf.pages[0])
            
            escritor.add_page(nova_pagina)
            
        # --- Lógica Inteligente de Assinatura ---
        if any([nome_contratante, nome_contratada, img_contratante, img_contratada]):
            
            # Procura em todas as páginas (de trás para frente) para achar a linha de assinatura
            coords_encontradas = None
            indice_pagina_assinatura = -1
            
            # Verifica últimas 3 páginas (ou menos se documento for pequeno)
            total_paginas = len(leitor.pages)
            range_busca = range(total_paginas - 1, max(-1, total_paginas - 4), -1)
            
            for i in range_busca:
                print(f"🔍 Procurando assinaturas na página {i+1}...")
                coords = encontrar_coordenadas_assinatura(leitor.pages[i])
                if coords:
                    coords_encontradas = coords
                    indice_pagina_assinatura = i
                    print(f"✅ Encontrado na página {i+1}!")
                    break
            
            if coords_encontradas and indice_pagina_assinatura != -1:
                print("✅ Detectadas linhas de assinatura existentes. Usando modo Overlay.")
                
                # Lógica de Decisão de Posição:
                # 1. Se achou 'linhas' (____), usa elas com prioridade (1ª=Contratante, 2ª=Contratada)
                # 2. Se não achou linhas, mas achou labels, usa labels.
                
                pos_ct = None
                pos_cd = None
                
                linhas = coords_encontradas.get('linhas', [])
                if linhas:
                    # Ordena linhas por Y decrescente (Topo -> Base)
                    # Assumindo que a primeira linha é Contratante e segunda é Contratada
                    linhas.sort(key=lambda k: k[1], reverse=True)
                    
                    if len(linhas) >= 1:
                        # Assinatura EM CIMA da linha (+10)
                        pos_ct = (linhas[0][0] + 50, linhas[0][1] + 10) 
                        print(f"   -> Contratante na Linha 1: {pos_ct}")
                    
                    if len(linhas) >= 2:
                        pos_cd = (linhas[1][0] + 50, linhas[1][1] + 10)
                        print(f"   -> Contratada na Linha 2: {pos_cd}")
                
                # Fallback para Labels se não definiu por linhas
                if not pos_ct and 'contratante' in coords_encontradas:
                    # Assinatura ABAIXO do label (-50)
                    pos_ct = (coords_encontradas['contratante'][0] + 40, coords_encontradas['contratante'][1] - 50)
                    print(f"   -> Contratante no Label: {pos_ct}")
                    
                if not pos_cd and 'contratada' in coords_encontradas:
                    pos_cd = (coords_encontradas['contratada'][0] + 40, coords_encontradas['contratada'][1] - 50)
                    print(f"   -> Contratada no Label: {pos_cd}")

                # Modo Overlay: Aplica na página encontrada
                pagina_destino = escritor.pages[indice_pagina_assinatura]
                
                # Tamanho da página encontrada
                w_pag = float(leitor.pages[indice_pagina_assinatura].mediabox.width)
                h_pag = float(leitor.pages[indice_pagina_assinatura].mediabox.height)
                
                assinaturas_pdf = PdfReader(gerar_pagina_assinaturas(
                    nome_contratante, nome_contratada, fonte, w_pag, h_pag, 
                    img_contratante, img_contratada, 
                    eh_nova_pagina=False, # Não cria layout, só joga assinatura
                    pos_contratante=pos_ct,
                    pos_contratada=pos_cd
                ))
                pagina_destino.merge_page(assinaturas_pdf.pages[0])
                
            else:
                print("⚠️ Nenhuma linha detectada. Criando nova página de assinaturas.")
                # Modo Página Extra: Cria uma nova página limpa
                pagina_assinaturas = PageObject.create_blank_page(width=last_width, height=last_height)
                
                assinaturas_pdf = PdfReader(gerar_pagina_assinaturas(
                    nome_contratante, nome_contratada, fonte, last_width, last_height, 
                    img_contratante, img_contratada, 
                    eh_nova_pagina=True, # Cria layout completo (título, linhas)
                    pos_contratante=None, pos_contratada=None
                ))
                pagina_assinaturas.merge_page(assinaturas_pdf.pages[0])
                
                # Adiciona carimbo também na página de assinaturas
                carimbo_pdf = PdfReader(gerar_carimbo_pdf(hash_visual, link, last_width, last_height))
                pagina_assinaturas.merge_page(carimbo_pdf.pages[0])
                
                escritor.add_page(pagina_assinaturas)
            
        output = io.BytesIO()
        escritor.write(output)
        output.seek(0)
        return output
    except Exception as e:
        print(f"Erro visual PDF: {e}")
        import traceback
        traceback.print_exc()
        return io.BytesIO(pdf_bytes)

@app.post("/assinar")
async def assinar_contrato(
    arquivo: UploadFile = File(...),
    nome_contratante: str = Form(""),
    nome_contratada: str = Form(""),
    fonte: str = Form("padrao"),
    img_contratante: UploadFile = File(None),
    img_contratada: UploadFile = File(None)
):
    try:
        print(f"--- NOVA SOLICITAÇÃO DE ASSINATURA ---")
        print(f"Nome Contratante: '{nome_contratante}' | Imagem Contratante: {img_contratante.filename if img_contratante else 'Não enviada'}")
        print(f"Nome Contratada: '{nome_contratada}' | Imagem Contratada: {img_contratada.filename if img_contratada else 'Não enviada'}")
        
        conteudo = await arquivo.read()
        
        # Lê imagens se existirem
        bytes_img_contratante = await img_contratante.read() if img_contratante else None
        bytes_img_contratada = await img_contratada.read() if img_contratada else None
        
        # 1. Assinatura Criptográfica
        chave_privada = carregar_chave_privada()
        assinatura = chave_privada.sign(
            conteudo,
            padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH),
            hashes.SHA256()
        )
        assinatura_base64 = base64.b64encode(assinatura).decode('utf-8')
        
        # GERA ID CURTO E SEGURO (SHA256 da assinatura) - 64 caracteres
        # Isso resolve o problema de "nome de arquivo muito longo" no Windows
        id_documento = hashlib.sha256(assinatura).hexdigest()
        print(f"✅ ID CURTO GERADO: {id_documento}") # Log de confirmação
        
        # 2. Aplicação Visual (Rodapé e Nomes na última página)
        pdf_final = aplicar_assinatura_visual(
            conteudo, 
            id_documento, # ID para o link/QR Code
            assinatura_base64, # Hash visual para exibir no texto
            nome_contratante, 
            nome_contratada, 
            fonte,
            bytes_img_contratante,
            bytes_img_contratada
        )
        
        # --- PERSISTÊNCIA PARA VALIDAÇÃO ---
        # Salva o arquivo e metadados para que a página de validação funcione
        try:
            print(f"💾 Salvando documento ID: {id_documento}")
            caminho_pdf = os.path.join(DIRETORIO_ASSINADOS, f"{id_documento}.pdf")
            print(f"   -> Caminho PDF: {caminho_pdf}")
            caminho_original = os.path.join(DIRETORIO_ASSINADOS, f"{id_documento}_original.pdf")
            caminho_json = os.path.join(DIRETORIO_ASSINADOS, f"{id_documento}.json")
            print(f"   -> Caminho JSON: {caminho_json}")
            
            # Salva PDF Assinado
            with open(caminho_pdf, "wb") as f:
                f.write(pdf_final.getvalue())

            # Salva PDF Original (Sem Assinatura)
            with open(caminho_original, "wb") as f:
                f.write(conteudo)
            
            # Salva Metadados
            metadados = {
                "hash": assinatura_base64, # Mantemos o hash completo nos metadados
                "id_curto": id_documento,
                "data_assinatura": datetime.datetime.now().strftime("%d/%m/%Y, %H:%M:%S"),
                "ip": "187.102.169.26", # Em produção, pegar de request.client.host
                "signatarios": []
            }
            
            if nome_contratante:
                metadados["signatarios"].append({
                    "nome": nome_contratante,
                    "email": "contratante@email.com", # Futuro: pegar do form
                    "tipo": "Parte Contratante"
                })
            
            if nome_contratada:
                metadados["signatarios"].append({
                    "nome": nome_contratada,
                    "email": "contratada@email.com",
                    "tipo": "Parte Contratada"
                })

            with open(caminho_json, "w", encoding="utf-8") as f:
                json.dump(metadados, f, ensure_ascii=False, indent=4)

            # 3. Salva no MongoDB (Coleção 'documentos' - Português)
            try:
                novo_documento = {
                    "name": arquivo.filename,
                    "hash": id_documento, # Usamos o ID curto para busca
                    "path": caminho_pdf,
                    "status": "signed",
                    "createdAt": datetime.datetime.utcnow(),
                    "updatedAt": datetime.datetime.utcnow(),
                    "ownerEmail": "desconhecido@temp.com", # Placeholder (sem auth ainda)
                    "metadata": metadados # Salva o JSON completo dentro do banco
                }
                # Salva na coleção 'documentos'
                await db.documentos.insert_one(novo_documento)
                print(f"✅ Documento salvo no MongoDB (coleção 'documentos')")
            except Exception as e:
                print(f"⚠️ Erro ao salvar no MongoDB (não crítico): {e}")
                
        except Exception as e:
            print(f"Erro ao salvar persistencia: {e}")
        
        # Retorna o PDF modificado para download
        pdf_final.seek(0) # Reset para envio
        return StreamingResponse(
            pdf_final, 
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=assinado_{arquivo.filename}"}
        )
        
    except Exception as e:
        print(f"Erro: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/validar/dados/{hash}")
async def obter_dados_validacao(hash: str):
    # Função auxiliar para tentar formatos diferentes de hash
    def tentar_encontrar(h_test):
        print(f"🔍 Buscando metadados para hash: {h_test}")
        nomes_teste = [
            h_test,
            h_test.replace(' ', '+'), # Correção comum de query param
            h_test.replace('+', '-').replace('/', '_').rstrip('='), # URL Safe
            urllib.parse.unquote(h_test) # Decoded
        ]
        for nome in nomes_teste:
            p = os.path.join(DIRETORIO_ASSINADOS, f"{nome}.json")
            # print(f"   - Testando: {p}") # Verbose
            if os.path.exists(p):
                print(f"   ✅ Encontrado em: {p}")
                return p
        print(f"   ❌ Não encontrado após {len(nomes_teste)} tentativas.")
        return None

    caminho_encontrado = tentar_encontrar(hash)
    
    if caminho_encontrado:
        with open(caminho_encontrado, "r", encoding="utf-8") as f:
            return JSONResponse(content=json.load(f))
    
    return JSONResponse(content={"erro": "Documento não encontrado"}, status_code=404)

@app.get("/validar/arquivo-original/{hash}")
async def baixar_arquivo_original(hash: str):
    # Busca o arquivo original (sem assinatura) pelo ID
    caminho_pdf = os.path.join(DIRETORIO_ASSINADOS, f"{hash}_original.pdf")
    
    if os.path.exists(caminho_pdf):
        return FileResponse(caminho_pdf, media_type="application/pdf", filename="documento_original.pdf")
    raise HTTPException(status_code=404, detail="Arquivo original não encontrado")

@app.get("/validar/visualizar/{hash}")
async def visualizar_arquivo_validacao(hash: str):
    # Endpoint específico para VISUALIZAÇÃO (Content-Disposition: inline)
    # Isso evita que o navegador baixe o arquivo automaticamente no iframe
    def tentar_encontrar_pdf(h_test):
        nomes_teste = [
            h_test,
            h_test.replace(' ', '+'),
            h_test.replace('+', '-').replace('/', '_').rstrip('='),
            urllib.parse.unquote(h_test)
        ]
        for nome in nomes_teste:
            p = os.path.join(DIRETORIO_ASSINADOS, f"{nome}.pdf")
            if os.path.exists(p):
                return p
        return None

    caminho_pdf = tentar_encontrar_pdf(hash)
    
    if caminho_pdf:
        # 'inline' força a exibição no navegador
        return FileResponse(
            caminho_pdf, 
            media_type="application/pdf", 
            headers={"Content-Disposition": "inline; filename=documento_visualizacao.pdf"}
        )
    raise HTTPException(status_code=404, detail="Arquivo não encontrado")

@app.get("/validar/arquivo/{hash}")
async def baixar_arquivo_validacao(hash: str):
    # Mesma lógica de busca flexível para o PDF
    def tentar_encontrar_pdf(h_test):
        nomes_teste = [
            h_test,
            h_test.replace(' ', '+'),
            h_test.replace('+', '-').replace('/', '_').rstrip('='),
            urllib.parse.unquote(h_test)
        ]
        for nome in nomes_teste:
            p = os.path.join(DIRETORIO_ASSINADOS, f"{nome}.pdf")
            if os.path.exists(p):
                return p
        return None

    caminho_pdf = tentar_encontrar_pdf(hash)
    
    if caminho_pdf:
        return FileResponse(caminho_pdf, media_type="application/pdf", filename="documento_assinado.pdf")
    raise HTTPException(status_code=404, detail="Arquivo não encontrado")

@app.get("/validar")
async def redirecionar_validacao_q(hash: str):
    print(f"🔄 Redirecionando validação (Query) para: {hash[:30]}...")
    return RedirectResponse(url=f"http://localhost:5173/validar?hash={hash}")

@app.get("/validar/{hash:path}")
async def redirecionar_validacao_p(hash: str):
    print(f"🔄 Redirecionando validação (Path) para: {hash[:30]}...")
    return RedirectResponse(url=f"http://localhost:5173/validar/{hash}")

if __name__ == "__main__":
    import uvicorn
    import os
    import datetime
    from cryptography import x509
    from cryptography.x509.oid import NameOID
    from cryptography.hazmat.primitives.asymmetric import rsa
    
    # Função interna para gerar certificados se não existirem
    def garantir_certificados():
        if os.path.exists("ssl_chave.pem") and os.path.exists("chave_privada_assinatura.pem"):
            return

        print("⚠️  Certificados não encontrados. Gerando agora...")
        try:
            # 1. SSL
            key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
            name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, u"localhost")])
            cert = x509.CertificateBuilder().subject_name(name).issuer_name(name).public_key(
                key.public_key()).serial_number(x509.random_serial_number()).not_valid_before(
                datetime.datetime.utcnow()).not_valid_after(
                datetime.datetime.utcnow() + datetime.timedelta(days=365)).sign(key, hashes.SHA256())

            with open("ssl_chave.pem", "wb") as f:
                f.write(key.private_bytes(encoding=serialization.Encoding.PEM, 
                    format=serialization.PrivateFormat.TraditionalOpenSSL, 
                    encryption_algorithm=serialization.NoEncryption()))
            with open("ssl_certificado.pem", "wb") as f:
                f.write(cert.public_bytes(serialization.Encoding.PEM))

            # 2. Assinatura
            sign_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
            with open("chave_privada_assinatura.pem", "wb") as f:
                f.write(sign_key.private_bytes(encoding=serialization.Encoding.PEM, 
                    format=serialization.PrivateFormat.PKCS8, 
                    encryption_algorithm=serialization.NoEncryption()))
            
            print("✅ Certificados gerados com sucesso!")
        except Exception as e:
            print(f"❌ Erro crítico ao gerar certificados: {e}")

    # Garante que os arquivos existem antes de iniciar
    garantir_certificados()

    print("\n" + "="*60)
    print("🚀 SERVIDOR INICIADO COM SUCESSO!")
    print("✅ VERSÃO ATUALIZADA: ID CURTO + PERSISTÊNCIA CORRIGIDA")
    print("✅ Correção de fonte aplicada (Times-Italic)")
    print("✅ Correção de rodapé/assinaturas aplicada (Extensão de Página)")
    print("="*60 + "\n")

    # Inicia o servidor HTTPS na porta 8000
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000, 
        ssl_keyfile="ssl_chave.pem", 
        ssl_certfile="ssl_certificado.pem"
    )