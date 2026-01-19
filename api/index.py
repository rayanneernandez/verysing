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
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from dotenv import load_dotenv

# Importa utils do mesmo diretório
from .pix_utils import gerar_payload_pix

# Carrega .env se existir (local development)
load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    print("⚠️ MONGODB_URI não encontrada. O banco não vai funcionar.")

client = AsyncIOMotorClient(MONGODB_URI) if MONGODB_URI else AsyncIOMotorClient()
db = client.verysing

app = FastAPI()

# Modelo de Dados para Cadastro
class UsuarioCreate(BaseModel):
    nome: str
    email: EmailStr
    cpf: str
    senha: str
    tipoPlano: str = "gratuito"

@app.post("/api/usuarios")
async def criar_usuario(usuario: UsuarioCreate):
    if await db.usuarios.find_one({"email": usuario.email}):
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")
    
    if await db.usuarios.find_one({"cpf": usuario.cpf}):
        raise HTTPException(status_code=400, detail="CPF já cadastrado.")

    senha_hash = hashlib.sha256(usuario.senha.encode()).hexdigest()
    
    inicio_trial = None
    fim_trial = None
    status_plano = "ativo" if usuario.tipoPlano == "gratuito" else "trial"
    
    if usuario.tipoPlano in ["profissional", "empresarial"]:
        agora = datetime.datetime.utcnow()
        inicio_trial = agora
        fim_trial = agora + datetime.timedelta(days=30)

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

    resultado = await db.usuarios.insert_one(novo_usuario)
    
    return {
        "id": str(resultado.inserted_id),
        "mensagem": "Usuário criado com sucesso!",
        "plano": usuario.tipoPlano,
        "status": status_plano
    }

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CAMINHO_CHAVE_PRIVADA = "chave_privada_assinatura.pem"

def carregar_chave_privada():
    # 1. Tenta carregar da variável de ambiente (Produção/Vercel)
    private_key_env = os.getenv("PRIVATE_KEY_PEM")
    if private_key_env:
        # Corrige quebras de linha se vierem escapadas
        private_key_env = private_key_env.replace('\\n', '\n')
        return serialization.load_pem_private_key(
            private_key_env.encode('utf-8'),
            password=None
        )

    # 2. Tenta carregar do arquivo (Local)
    if os.path.exists(CAMINHO_CHAVE_PRIVADA):
        with open(CAMINHO_CHAVE_PRIVADA, "rb") as arquivo_chave:
            return serialization.load_pem_private_key(
                arquivo_chave.read(),
                password=None
            )
            
    # Se não achar nada, retorna None ou lança erro dependendo da rigidez
    print("⚠️ Chave privada não encontrada. Assinatura digital falhará.")
    return None

def gerar_carimbo_pdf(hash_doc, link_validacao, width, height):
    packet = io.BytesIO()
    c = canvas.Canvas(packet, pagesize=(width, height))
    
    footer_height = 45
    c.setFillColorRGB(0.96, 0.96, 0.96)
    c.rect(0, 0, width, footer_height, fill=1, stroke=0)
    
    c.setFillColorRGB(0.2, 0.4, 0.8)
    c.circle(30, 22, 12, fill=1, stroke=0)
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(26, 17, "a")
    
    c.setFillColorRGB(0.2, 0.2, 0.2)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(55, 28, "Assinado com Assinatura Eletrônica (Lei 14.063/2020)")
    
    c.setFont("Helvetica", 6)
    c.drawString(55, 18, f"Hash SHA256: {hash_doc[:24]}...")
    
    texto_link = "Verificar online"
    c.drawString(55, 8, texto_link)
    try:
        tw = stringWidth(texto_link, "Helvetica", 6)
        c.linkURL(link_validacao, (55, 6, 55 + tw, 12), relative=1)
    except:
        pass
    
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

# --- Pagamento PIX e Contratos ---
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
    txid = uuid.uuid4().hex[:20]
    CHAVE_PIX = "00000000000" # Configure via ENV em produção
    NOME_RECEBEDOR = "VerySing Digital"
    CIDADE_RECEBEDOR = "Sao Paulo"
    
    payload_pix = gerar_payload_pix(
        chave=CHAVE_PIX,
        nome=NOME_RECEBEDOR,
        cidade=CIDADE_RECEBEDOR,
        valor=dados.valor,
        txid=txid
    )
    
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
    # Gera o PDF do Contrato
    packet = io.BytesIO()
    c = canvas.Canvas(packet, pagesize=A4)
    width, height = A4
    
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
    
    c.setFont("Helvetica-Oblique", 10)
    c.drawString(50, height - 300, f"Assinado digitalmente por VerySing System")
    c.drawString(50, height - 315, f"Transação ID: {dados.txid}")
    
    c.save()
    packet.seek(0)
    pdf_bytes = packet.read()
    
    # Salva no MongoDB (Binary)
    nome_arquivo = f"contrato_{dados.txid}.pdf"
    
    await db.contratos.insert_one({
        "txid": dados.txid,
        "nome": dados.nome,
        "cpf": dados.cpf,
        "nome_arquivo": nome_arquivo,
        "conteudo_pdf": pdf_bytes, # Salva o binário do PDF
        "criado_em": datetime.datetime.utcnow()
    })
    
    return {
        "status": "aprovado",
        "mensagem": "Pagamento confirmado e contrato gerado com sucesso.",
        "contrato_arquivo": nome_arquivo
    }

@app.get("/download/{nome_arquivo}")
async def download_arquivo(nome_arquivo: str):
    # Busca no MongoDB
    contrato = await db.contratos.find_one({"nome_arquivo": nome_arquivo})
    
    if contrato and "conteudo_pdf" in contrato:
        pdf_stream = io.BytesIO(contrato["conteudo_pdf"])
        return StreamingResponse(
            pdf_stream, 
            media_type='application/pdf', 
            headers={"Content-Disposition": f"attachment; filename={nome_arquivo}"}
        )
        
    raise HTTPException(status_code=404, detail="Arquivo não encontrado")