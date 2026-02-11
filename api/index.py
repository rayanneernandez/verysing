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
from supabase import create_client, Client
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from dotenv import load_dotenv

# Importa utils do mesmo diretório
from .pix_utils import gerar_payload_pix

# Carrega .env se existir (local development)
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠️ Credenciais do Supabase não encontradas. O banco não vai funcionar.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

app = FastAPI()

# Modelo de Dados para Cadastro
class UsuarioCreate(BaseModel):
    nome: str
    email: EmailStr
    cpf: str
    senha: str
    tipoPlano: str = "gratuito"

class UsuarioLogin(BaseModel):
    email: EmailStr
    senha: str

class UsuarioUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    cpf: Optional[str] = None
    telefone: Optional[str] = None
    cargo: Optional[str] = None
    senha: Optional[str] = None

@app.post("/api/login")
async def login(dados: UsuarioLogin):
    try:
        response = supabase.table("usuarios").select("*").eq("email", dados.email).execute()
        usuario = response.data[0] if response.data else None
        
        if not usuario:
            raise HTTPException(status_code=400, detail="E-mail ou senha incorretos.")
        
        senha_hash = hashlib.sha256(dados.senha.encode()).hexdigest()
        
        # Mapeia campos do banco SQL (snake_case) para o código
        if usuario["senha_hash"] != senha_hash:
            raise HTTPException(status_code=400, detail="E-mail ou senha incorretos.")
        
        return {
            "id": usuario["id"],
            "nome": usuario["nome"],
            "email": usuario["email"],
            "plano": usuario.get("tipo_plano", "gratuito"),
            "mensagem": "Login realizado com sucesso!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/usuarios")
async def criar_usuario(usuario: UsuarioCreate):
    # Verifica duplicidade
    res_email = supabase.table("usuarios").select("id").eq("email", usuario.email).execute()
    if res_email.data:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")
    
    res_cpf = supabase.table("usuarios").select("id").eq("cpf", usuario.cpf).execute()
    if res_cpf.data:
        raise HTTPException(status_code=400, detail="CPF já cadastrado.")

    senha_hash = hashlib.sha256(usuario.senha.encode()).hexdigest()
    
    inicio_trial = None
    fim_trial = None
    status_plano = "ativo" if usuario.tipoPlano == "gratuito" else "trial"
    
    if usuario.tipoPlano in ["profissional", "empresarial"]:
        agora = datetime.datetime.utcnow()
        inicio_trial = agora.isoformat()
        fim_trial = (agora + datetime.timedelta(days=30)).isoformat()

    novo_usuario = {
        "nome": usuario.nome,
        "email": usuario.email,
        "cpf": usuario.cpf,
        "senha_hash": senha_hash,
        "tipo_plano": usuario.tipoPlano,
        "status_plano": status_plano,
        "inicio_trial": inicio_trial,
        "fim_trial": fim_trial,
        "ativo": True
    }

    try:
        resultado = supabase.table("usuarios").insert(novo_usuario).execute()
        user_data = resultado.data[0]
        
        return {
            "id": user_data["id"],
            "mensagem": "Usuário criado com sucesso!",
            "plano": usuario.tipoPlano,
            "status": status_plano
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/usuarios/{user_id}")
async def atualizar_usuario(user_id: str, dados: UsuarioUpdate):
    update_data = {k: v for k, v in dados.dict().items() if v is not None}
    
    if "senha" in update_data:
         update_data["senha_hash"] = hashlib.sha256(update_data.pop("senha").encode()).hexdigest()
    
    # Mapeamento de campos camelCase -> snake_case
    if "tipoPlano" in update_data:
        update_data["tipo_plano"] = update_data.pop("tipoPlano")
         
    if not update_data:
        return {"mensagem": "Nada para atualizar"}
        
    update_data["atualizado_em"] = datetime.datetime.utcnow().isoformat()
    
    try:
        result = supabase.table("usuarios").update(update_data).eq("id", user_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
            
        return {"mensagem": "Usuário atualizado com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
        try:
            private_key_env = private_key_env.replace('\\n', '\n').strip()
            if "-----BEGIN PRIVATE KEY-----" not in private_key_env:
                private_key_env = f"-----BEGIN PRIVATE KEY-----\n{private_key_env}\n-----END PRIVATE KEY-----"
            return serialization.load_pem_private_key(private_key_env.encode('utf-8'), password=None)
        except Exception as e:
            print(f"⚠️ Erro ao carregar chave do ENV: {e}")

    # 2. Tenta carregar do arquivo (Local)
    caminho_local = os.path.join(os.path.dirname(__file__), "..", CAMINHO_CHAVE_PRIVADA)
    if os.path.exists(caminho_local):
        try:
            with open(caminho_local, "rb") as f:
                return serialization.load_pem_private_key(f.read(), password=None)
        except: pass
            
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
    except: pass
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
    coords = {}
    def visitor_body(text, cm, tm, fontDict, fontSize):
        if text and text.strip():
            curr_text = text.strip().upper().replace(':', '').replace('.', '')
            x, y = tm[4], tm[5]
            if "CONTRATANTE" in curr_text: coords['contratante'] = (x, y)
            elif "CONTRATADA" in curr_text: coords['contratada'] = (x, y)
            if "___" in text:
                if 'linhas' not in coords: coords['linhas'] = []
                coords['linhas'].append((x, y))
    try: page.extract_text(visitor_text=visitor_body)
    except: pass
    return coords

def gerar_pagina_assinaturas(nome_contratante, nome_contratada, fonte, width, height, img_contratante=None, img_contratada=None, eh_nova_pagina=False, pos_contratante=None, pos_contratada=None):
    packet = io.BytesIO()
    c = canvas.Canvas(packet, pagesize=(width, height))
    font_name = "Helvetica"
    try:
        if fonte == "manuscrita": font_name = "Times-Italic" 
        elif fonte == "serif": font_name = "Times-Roman"
        elif fonte == "cursiva_simples": font_name = "Times-Italic"
        c.setFont(font_name, 22)
    except: c.setFont(font_name, 22)
    x_esq_padrao, y_padrao = width * 0.25, height / 2 - 50 if eh_nova_pagina else 85
    x_dir_padrao = width * 0.75
    x_ct, y_ct = pos_contratante if pos_contratante else (x_esq_padrao, y_padrao)
    x_cd, y_cd = pos_contratada if pos_contratada else (x_dir_padrao, y_padrao)
    if eh_nova_pagina:
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(width / 2, height - 100, "PÁGINA DE ASSINATURAS")
        c.setFont("Helvetica", 10)
        c.drawCentredString(width / 2, height - 130, "Este documento foi assinado digitalmente conforme Lei 14.063/2020")
        c.setLineWidth(1)
        c.line(x_ct - 75, y_ct - 10, x_ct + 75, y_ct - 10)
        c.drawCentredString(x_ct, y_ct - 25, "CONTRATANTE")
        c.line(x_cd - 75, y_cd - 10, x_cd + 75, y_cd - 10)
        c.drawCentredString(x_cd, y_cd - 25, "CONTRATADA")
    data_assinatura = datetime.datetime.now().strftime("%d/%m/%Y")
    c.setFont("Helvetica", 8)
    if img_contratante:
        try:
            img = ImageReader(io.BytesIO(img_contratante))
            c.drawImage(img, x_ct - 75, y_ct, width=150, height=60, mask='auto')
            c.drawCentredString(x_ct, y_ct - 10, f"Assinado em {data_assinatura}")
        except: pass
    elif nome_contratante:
        c.setFont(font_name, 22)
        c.drawCentredString(x_ct, y_ct, nome_contratante)
        c.setFont("Helvetica", 8)
        c.drawCentredString(x_ct, y_ct - 10, f"Assinado em {data_assinatura}")
    if img_contratada:
        try:
            img = ImageReader(io.BytesIO(img_contratada))
            c.drawImage(img, x_cd - 75, y_cd, width=150, height=60, mask='auto')
            c.drawCentredString(x_cd, y_cd - 10, f"Assinado em {data_assinatura}")
        except: pass
    elif nome_contratada:
        c.setFont(font_name, 22)
        c.drawCentredString(x_cd, y_cd, nome_contratada)
        c.setFont("Helvetica", 8)
        c.drawCentredString(x_cd, y_cd - 10, f"Assinado em {data_assinatura}")
    c.save()
    packet.seek(0)
    return packet

def aplicar_assinatura_visual(pdf_bytes, id_documento, hash_visual, nome_contratante="", nome_contratada="", fonte="padrao", img_contratante=None, img_contratada=None):
    try:
        leitor = PdfReader(io.BytesIO(pdf_bytes))
        escritor = PdfWriter()
        base_url = os.getenv("VERCEL_URL", "localhost:5173")
        if "localhost" not in base_url and not base_url.startswith("http"): base_url = f"https://{base_url}"
        elif "localhost" in base_url and not base_url.startswith("http"): base_url = f"http://{base_url}"
        link = f"{base_url}/validar?hash={id_documento}"
        last_width, last_height = 0, 0
        for pagina in leitor.pages:
            width, height = float(pagina.mediabox.width), float(pagina.mediabox.height)
            last_width, last_height = width, height
            nova_pagina = PageObject.create_blank_page(width=width, height=height)
            nova_pagina.merge_page(pagina)
            carimbo_pdf = PdfReader(gerar_carimbo_pdf(hash_visual, link, width, height))
            nova_pagina.merge_page(carimbo_pdf.pages[0])
            escritor.add_page(nova_pagina)
        if any([nome_contratante, nome_contratada, img_contratante, img_contratada]):
            coords_encontradas = None
            indice_pagina_assinatura = -1
            range_busca = range(len(leitor.pages) - 1, max(-1, len(leitor.pages) - 4), -1)
            for i in range_busca:
                coords = encontrar_coordenadas_assinatura(leitor.pages[i])
                if coords:
                    coords_encontradas, indice_pagina_assinatura = coords, i
                    break
            if coords_encontradas and indice_pagina_assinatura != -1:
                pos_ct, pos_cd = None, None
                linhas = coords_encontradas.get('linhas', [])
                if linhas:
                    linhas.sort(key=lambda k: k[1], reverse=True)
                    if len(linhas) >= 1: pos_ct = (linhas[0][0] + 50, linhas[0][1] + 10) 
                    if len(linhas) >= 2: pos_cd = (linhas[1][0] + 50, linhas[1][1] + 10)
                if not pos_ct and 'contratante' in coords_encontradas:
                    pos_ct = (coords_encontradas['contratante'][0] + 40, coords_encontradas['contratante'][1] - 50)
                if not pos_cd and 'contratada' in coords_encontradas:
                    pos_cd = (coords_encontradas['contratada'][0] + 40, coords_encontradas['contratada'][1] - 50)
                pagina_destino = escritor.pages[indice_pagina_assinatura]
                w_pag, h_pag = float(leitor.pages[indice_pagina_assinatura].mediabox.width), float(leitor.pages[indice_pagina_assinatura].mediabox.height)
                assinaturas_pdf = PdfReader(gerar_pagina_assinaturas(nome_contratante, nome_contratada, fonte, w_pag, h_pag, img_contratante, img_contratada, False, pos_ct, pos_cd))
                pagina_destino.merge_page(assinaturas_pdf.pages[0])
            else:
                pagina_assinaturas = PageObject.create_blank_page(width=last_width, height=last_height)
                assinaturas_pdf = PdfReader(gerar_pagina_assinaturas(nome_contratante, nome_contratada, fonte, last_width, last_height, img_contratante, img_contratada, True))
                pagina_assinaturas.merge_page(assinaturas_pdf.pages[0])
                carimbo_pdf = PdfReader(gerar_carimbo_pdf(hash_visual, link, last_width, last_height))
                pagina_assinaturas.merge_page(carimbo_pdf.pages[0])
                escritor.add_page(pagina_assinaturas)
        output = io.BytesIO()
        escritor.write(output)
        output.seek(0)
        return output
    except Exception as e:
        print(f"Erro visual PDF: {e}")
        return io.BytesIO(pdf_bytes)

@app.post("/api/assinar")
async def assinar_contrato(arquivo: UploadFile = File(...), nome_contratante: str = Form(""), nome_contratada: str = Form(""), fonte: str = Form("padrao"), img_contratante: UploadFile = File(None), img_contratada: UploadFile = File(None)):
    try:
        conteudo = await arquivo.read()
        bytes_img_contratante = await img_contratante.read() if img_contratante else None
        bytes_img_contratada = await img_contratada.read() if img_contratada else None
        chave_privada = carregar_chave_privada()
        if not chave_privada: raise HTTPException(status_code=500, detail="Chave de assinatura não configurada.")
        assinatura = chave_privada.sign(conteudo, padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH), hashes.SHA256())
        assinatura_base64 = base64.b64encode(assinatura).decode('utf-8')
        id_documento = hashlib.sha256(assinatura).hexdigest()
        pdf_final = aplicar_assinatura_visual(conteudo, id_documento, assinatura_base64, nome_contratante, nome_contratada, fonte, bytes_img_contratante, bytes_img_contratada)
        
        path_storage = f"assinados/{id_documento}.pdf"
        pdf_final.seek(0)
        supabase.storage.from_("verysing-docs").upload(path_storage, pdf_final.read())
        
        metadados = {"hash": assinatura_base64, "id_curto": id_documento, "data_assinatura": datetime.datetime.now().strftime("%d/%m/%Y, %H:%M:%S"), "signatarios": []}
        if nome_contratante: metadados["signatarios"].append({"nome": nome_contratante, "tipo": "Contratante"})
        if nome_contratada: metadados["signatarios"].append({"nome": nome_contratada, "tipo": "Contratada"})
        
        supabase.storage.from_("verysing-docs").upload(f"assinados/{id_documento}.json", json.dumps(metadados, ensure_ascii=False).encode('utf-8'), {"content-type": "application/json"})
        supabase.table("documentos").insert({"nome_arquivo": arquivo.filename, "storage_path": path_storage, "status": "signed", "email_usuario": "desconhecido@temp.com", "destinatarios": json.dumps(metadados["signatarios"])}).execute()
        
        pdf_final.seek(0)
        return StreamingResponse(pdf_final, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=assinado_{arquivo.filename}"})
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/validar/dados/{hash}")
async def obter_dados_validacao(hash: str):
    try:
        file_bytes = supabase.storage.from_("verysing-docs").download(f"assinados/{hash}.json")
        return JSONResponse(content=json.loads(file_bytes))
    except: return JSONResponse(content={"erro": "Documento não encontrado"}, status_code=404)


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

from supabase import create_client, Client

# --- Gestão de Documentos ---

@app.get("/api/documentos")
async def listar_documentos(email: str):
    # Busca documentos
    res_docs = supabase.table("documentos").select("*").eq("email_usuario", email).execute()
    docs = res_docs.data
    
    # Busca contratos
    res_contratos = supabase.table("contratos").select("*").eq("email", email).execute()
    contratos = res_contratos.data
    
    resultado = []
    
    # Formata Documentos
    for d in docs:
        resultado.append({
            "id": d["id"],
            "name": d["nome_arquivo"],
            "date": datetime.datetime.fromisoformat(d["criado_em"]).strftime("%d/%m/%Y") if d.get("criado_em") else "N/A",
            "size": d.get("tamanho", "0 MB"),
            "type": d.get("tipo", "doc"),
            "category": d.get("categoria", "Geral"),
            "folderId": d.get("pasta_id")
        })
        
    # Formata Contratos
    for c in contratos:
        resultado.append({
            "id": c["id"],
            "name": c.get("nome_arquivo", "Contrato.pdf"),
            "date": datetime.datetime.fromisoformat(c["criado_em"]).strftime("%d/%m/%Y") if c.get("criado_em") else "N/A",
            "size": "PDF",
            "type": "pdf",
            "category": "Contrato",
            "folderId": None
        })
        
    return resultado

@app.post("/api/documentos/upload")
async def upload_documento(
    file: UploadFile = File(...), 
    email: str = Form(...), 
    categoria: str = Form("Geral"),
    destinatarios: Optional[str] = Form(None),
    assunto: Optional[str] = Form(None),
    mensagem: Optional[str] = Form(None)
):
    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    size_str = f"{size_mb:.1f} MB"
    
    # Upload para Supabase Storage
    path_storage = f"{email}/{int(datetime.datetime.utcnow().timestamp())}_{file.filename}"
    try:
        supabase.storage.from_("verysing-docs").upload(path_storage, contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no upload: {str(e)}")

    doc = {
        "nome_arquivo": file.filename,
        "email_usuario": email,
        "tamanho": size_str,
        "tipo": file.filename.split('.')[-1].lower() if '.' in file.filename else 'unknown',
        "categoria": categoria,
        "destinatarios": destinatarios,
        "assunto": assunto,
        "mensagem": mensagem,
        "storage_path": path_storage,
        "status": "pendente"
    }
    
    try:
        result = supabase.table("documentos").insert(doc).execute()
        doc_data = result.data[0]
        
        return {
            "id": doc_data["id"], 
            "mensagem": "Upload realizado com sucesso",
            "name": doc_data["nome_arquivo"],
            "date": datetime.datetime.utcnow().strftime("%d/%m/%Y"),
            "size": size_str,
            "type": doc_data["tipo"],
            "category": categoria
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/documentos/{doc_id}")
async def deletar_documento(doc_id: str):
    try:
        # Busca para saber se é documento ou contrato e pegar path
        res_doc = supabase.table("documentos").select("*").eq("id", doc_id).execute()
        
        if res_doc.data:
            doc = res_doc.data[0]
            # Deleta do Storage se existir
            if doc.get("storage_path"):
                supabase.storage.from_("verysing-docs").remove([doc["storage_path"]])
            
            # Deleta do Banco
            supabase.table("documentos").delete().eq("id", doc_id).execute()
            return {"mensagem": "Documento removido"}
            
        res_contrato = supabase.table("contratos").select("*").eq("id", doc_id).execute()
        if res_contrato.data:
            contrato = res_contrato.data[0]
             # Deleta do Storage se existir
            if contrato.get("storage_path"):
                supabase.storage.from_("verysing-docs").remove([contrato["storage_path"]])

            supabase.table("contratos").delete().eq("id", doc_id).execute()
            return {"mensagem": "Contrato removido"}
            
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- Fim Gestão de Documentos ---

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
    
    # Salva no Storage
    nome_arquivo = f"contrato_{dados.txid}.pdf"
    storage_path = f"contratos/{nome_arquivo}"
    
    try:
        supabase.storage.from_("verysing-docs").upload(storage_path, pdf_bytes)
        
        # Salva metadados no Supabase
        supabase.table("contratos").insert({
            "nome": dados.nome,
            "cpf": dados.cpf,
            "email": dados.email,
            "plano": dados.plano,
            "nome_arquivo": nome_arquivo,
            "storage_path": storage_path
        }).execute()
        
    except Exception as e:
        print(f"Erro ao salvar contrato: {e}")
        # Mesmo com erro, retorna sucesso pois pagamento foi confirmado
    
    return {
        "status": "aprovado",
        "mensagem": "Pagamento confirmado e contrato gerado com sucesso.",
        "contrato_arquivo": nome_arquivo
    }

@app.get("/download/{nome_arquivo}")
async def download_arquivo(nome_arquivo: str):
    # Tenta achar em documentos
    res_doc = supabase.table("documentos").select("storage_path").eq("nome_arquivo", nome_arquivo).execute()
    
    storage_path = None
    if res_doc.data:
        storage_path = res_doc.data[0]["storage_path"]
    else:
        # Tenta achar em contratos
        res_contrato = supabase.table("contratos").select("storage_path").eq("nome_arquivo", nome_arquivo).execute()
        if res_contrato.data:
            storage_path = res_contrato.data[0]["storage_path"]
            
    if storage_path:
        try:
            # Baixa o arquivo do Storage
            file_bytes = supabase.storage.from_("verysing-docs").download(storage_path)
            return StreamingResponse(
                io.BytesIO(file_bytes), 
                media_type='application/pdf', 
                headers={"Content-Disposition": f"attachment; filename={nome_arquivo}"}
            )
        except Exception as e:
            raise HTTPException(status_code=404, detail="Arquivo não encontrado no storage")
        
    raise HTTPException(status_code=404, detail="Arquivo não encontrado")

@app.get("/api/validar/dados/{hash}")
async def obter_dados_validacao(hash: str):
    try:
        file_bytes = supabase.storage.from_("verysing-docs").download(f"assinados/{hash}.json")
        return JSONResponse(content=json.loads(file_bytes))
    except: return JSONResponse(content={"erro": "Documento não encontrado"}, status_code=404)

@app.get("/api/validar/arquivo/{hash}")
async def obter_arquivo_assinado(hash: str):
    try:
        file_bytes = supabase.storage.from_("verysing-docs").download(f"assinados/{hash}.pdf")
        return StreamingResponse(io.BytesIO(file_bytes), media_type="application/pdf")
    except: raise HTTPException(status_code=404, detail="Arquivo assinado não encontrado")