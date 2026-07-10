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

# Importa utils do mesmo diretório.
# Na Vercel o index.py é carregado como módulo solto (sem pacote),
# então o import relativo falha — usa o caminho absoluto como fallback.
try:
    from .pix_utils import gerar_payload_pix
except ImportError:
    import sys
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from pix_utils import gerar_payload_pix

# Carrega .env se existir (local development)
load_dotenv()

# Inicialização do Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Optional[Client] = None

if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("[OK] Cliente Supabase inicializado com sucesso.")
    except Exception as e:
        print(f"[AVISO] Erro ao inicializar Supabase: {e}")
else:
    print("[AVISO] Credenciais do Supabase (SUPABASE_URL, SUPABASE_KEY) nao encontradas no ambiente.")

app = FastAPI()

# Função auxiliar para verificar conexão
def verificar_supabase():
    if not supabase:
        raise HTTPException(
            status_code=500, 
            detail="Erro de Configuração: Banco de dados desconectado. Verifique as variáveis de ambiente SUPABASE_URL e SUPABASE_KEY no painel da Vercel."
        )
    return supabase

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
    smtp_email: Optional[str] = None   # Gmail do usuário para envio de comunicados
    smtp_senha: Optional[str] = None   # senha de app do Gmail do usuário

@app.post("/api/login")
async def login(dados: UsuarioLogin):
    db = verificar_supabase()
    try:
        response = db.table("usuarios").select("*").eq("email", dados.email).execute()
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/usuarios")
async def criar_usuario(usuario: UsuarioCreate):
    db = verificar_supabase()
    
    # Verifica duplicidade
    try:
        res_email = db.table("usuarios").select("id").eq("email", usuario.email).execute()
        if res_email.data:
            raise HTTPException(status_code=400, detail="E-mail já cadastrado.")
        
        res_cpf = db.table("usuarios").select("id").eq("cpf", usuario.cpf).execute()
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

        resultado = db.table("usuarios").insert(novo_usuario).execute()
        user_data = resultado.data[0]
        
        return {
            "id": user_data["id"],
            "mensagem": "Usuário criado com sucesso!",
            "plano": usuario.tipoPlano,
            "status": status_plano
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao criar usuário: {str(e)}") # Log no Vercel
        raise HTTPException(status_code=500, detail=f"Erro ao criar usuário: {str(e)}")

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
    except HTTPException:
        raise
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
            print(f"[AVISO] Erro ao carregar chave do ENV: {e}")

    # 2. Tenta carregar do arquivo (Local)
    caminho_local = os.path.join(os.path.dirname(__file__), "..", CAMINHO_CHAVE_PRIVADA)
    if os.path.exists(caminho_local):
        try:
            with open(caminho_local, "rb") as f:
                return serialization.load_pem_private_key(f.read(), password=None)
        except: pass
            
    print("[AVISO] Chave privada nao encontrada. Assinatura digital falhara.")
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

    # Limite de documentos no drive conforme o plano
    plano = plano_do_usuario(email)
    if plano["docs_drive"] is not None:
        docs_atuais = supabase.table("documentos").select("id", count="exact").eq("email_usuario", email).execute()
        if (docs_atuais.count or 0) >= plano["docs_drive"]:
            raise HTTPException(status_code=403, detail=f"Limite de {plano['docs_drive']} documentos do seu plano atingido. Faça upgrade ou exclua documentos antigos.")

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
    CHAVE_PIX = os.getenv("PIX_CHAVE", "00000000000")
    NOME_RECEBEDOR = os.getenv("PIX_NOME", "VerySing Digital")
    CIDADE_RECEBEDOR = os.getenv("PIX_CIDADE", "Sao Paulo")
    
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

    # Ativa o plano do usuário no banco
    if dados.email:
        try:
            supabase.table("usuarios").update({
                "tipo_plano": dados.plano,
                "status_plano": "ativo",
                "atualizado_em": datetime.datetime.utcnow().isoformat(),
            }).eq("email", dados.email).execute()
        except Exception as e:
            print(f"Erro ao ativar plano do usuário: {e}")

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


# ============================================================
# PLANOS E LIMITES
# ============================================================

PLANOS = {
    "gratuito": {
        "nome": "Gratuito",
        "preco": 0.0,
        "contratos_mes": 5,
        "docs_drive": 10,
        "formularios_ativos": 1,
        "respostas_mes": 100,
        "comunicados_mes": 0,
        "emails_mes": 0,
    },
    "profissional": {
        "nome": "Profissional",
        "preco": 19.90,
        "contratos_mes": 15,
        "docs_drive": 30,
        "formularios_ativos": None,   # None = ilimitado
        "respostas_mes": 1000,
        "comunicados_mes": 10,
        "emails_mes": 2000,
    },
    "empresarial": {
        "nome": "Empresarial",
        "preco": 39.90,
        "contratos_mes": None,
        "docs_drive": 200,
        "formularios_ativos": None,
        "respostas_mes": 10000,
        "comunicados_mes": 50,
        "emails_mes": 25000,
    },
    "admin": {
        "nome": "Administrador",
        "preco": 0.0,
        "contratos_mes": None,
        "docs_drive": None,
        "formularios_ativos": None,
        "respostas_mes": None,
        "comunicados_mes": None,
        "emails_mes": None,
    },
}


def obter_usuario(email: str):
    db = verificar_supabase()
    res = db.table("usuarios").select("*").eq("email", email).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return res.data[0]


def plano_do_usuario(email: str) -> dict:
    usuario = obter_usuario(email)
    plano = usuario.get("tipo_plano", "gratuito")
    return PLANOS.get(plano, PLANOS["gratuito"])


def inicio_mes_iso() -> str:
    agora = datetime.datetime.utcnow()
    return agora.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()


def exigir_admin(email_admin: str):
    usuario = obter_usuario(email_admin)
    if usuario.get("tipo_plano") != "admin":
        raise HTTPException(status_code=403, detail="Acesso restrito ao administrador.")
    return usuario


@app.get("/api/planos")
async def listar_planos():
    return PLANOS


@app.get("/api/usuarios/config-envio")
async def config_envio(email: str):
    """Retorna a configuração de remetente do usuário (sem expor a senha)."""
    usuario = obter_usuario(email)
    return {
        "id": usuario["id"],
        "smtp_email": usuario.get("smtp_email"),
        "configurado": bool(usuario.get("smtp_email") and usuario.get("smtp_senha")),
        "remetente_sistema": bool(GMAIL_USER and GMAIL_APP_PASSWORD),
    }


@app.get("/api/uso")
async def uso_do_plano(email: str):
    """Retorna o consumo atual do usuário frente aos limites do plano."""
    db = verificar_supabase()
    plano = plano_do_usuario(email)
    inicio_mes = inicio_mes_iso()

    docs = db.table("documentos").select("id", count="exact").eq("email_usuario", email).execute()
    contratos = db.table("contratos").select("id", count="exact").eq("email", email).gte("criado_em", inicio_mes).execute()
    comunicados = db.table("comunicacoes").select("destinatarios").eq("email_usuario", email).eq("status", "enviado").gte("criado_em", inicio_mes).execute()

    total_comunicados = len(comunicados.data)
    total_emails = sum(len(c.get("destinatarios") or []) for c in comunicados.data)

    return {
        "plano": plano,
        "uso": {
            "docs_drive": docs.count or 0,
            "contratos_mes": contratos.count or 0,
            "comunicados_mes": total_comunicados,
            "emails_mes": total_emails,
        },
    }


# ============================================================
# ENVIO DE E-MAIL (Gmail SMTP)
# ============================================================

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from email.mime.application import MIMEApplication

GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")


def montar_html_comunicado(mensagem: str, logo_cid: bool, pixel_url: Optional[str]) -> str:
    logo_html = '<img src="cid:logo_empresa" style="max-height:80px;max-width:200px;" alt="Logo"/>' if logo_cid else ""
    pixel_html = f'<img src="{pixel_url}" width="1" height="1" style="display:none" alt=""/>' if pixel_url else ""
    corpo = mensagem.replace("\n", "<br/>")
    return f"""
    <div style="background:#f1f5f9;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="padding:24px;text-align:center;border-bottom:1px solid #f1f5f9;">{logo_html}</div>
        <div style="padding:32px;color:#334155;line-height:1.6;font-size:15px;">{corpo}</div>
        <div style="padding:16px;background:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;font-size:12px;color:#94a3b8;">
          Enviado via VerySing
        </div>
      </div>
      {pixel_html}
    </div>
    """


def credenciais_envio(usuario: dict):
    """Define o remetente: o Gmail do próprio usuário (se configurado no perfil)
    ou o remetente padrão do sistema com Reply-To para o usuário."""
    if usuario.get("smtp_email") and usuario.get("smtp_senha"):
        return {
            "smtp_user": usuario["smtp_email"],
            "smtp_pass": usuario["smtp_senha"],
            "from_nome": usuario.get("nome") or "VerySing",
            "reply_to": None,  # já sai da conta do próprio usuário
        }
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        raise HTTPException(
            status_code=500,
            detail="Nenhum remetente configurado. Cadastre seu Gmail e senha de app no seu perfil, ou o administrador deve definir GMAIL_USER/GMAIL_APP_PASSWORD."
        )
    return {
        "smtp_user": GMAIL_USER,
        "smtp_pass": GMAIL_APP_PASSWORD,
        "from_nome": usuario.get("nome") or "VerySing",
        "reply_to": usuario.get("email"),
    }


def enviar_email_smtp(destinatario: str, assunto: str, html: str,
                      logo_bytes: Optional[bytes] = None,
                      anexo_pdf: Optional[bytes] = None,
                      nome_anexo: str = "documento.pdf",
                      credenciais: Optional[dict] = None):
    smtp_user = (credenciais or {}).get("smtp_user") or GMAIL_USER
    smtp_pass = (credenciais or {}).get("smtp_pass") or GMAIL_APP_PASSWORD
    from_nome = (credenciais or {}).get("from_nome") or "VerySing"
    reply_to = (credenciais or {}).get("reply_to")

    if not smtp_user or not smtp_pass:
        raise HTTPException(
            status_code=500,
            detail="E-mail não configurado. Cadastre seu Gmail e senha de app no perfil, ou defina GMAIL_USER e GMAIL_APP_PASSWORD."
        )
    msg = MIMEMultipart("related")
    msg["From"] = f"{from_nome} <{smtp_user}>"
    msg["To"] = destinatario
    msg["Subject"] = assunto
    if reply_to:
        msg["Reply-To"] = reply_to
    msg.attach(MIMEText(html, "html", "utf-8"))

    if logo_bytes:
        img = MIMEImage(logo_bytes)
        img.add_header("Content-ID", "<logo_empresa>")
        img.add_header("Content-Disposition", "inline", filename="logo.png")
        msg.attach(img)

    if anexo_pdf:
        anexo = MIMEApplication(anexo_pdf, _subtype="pdf")
        anexo.add_header("Content-Disposition", "attachment", filename=nome_anexo)
        msg.attach(anexo)

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=30) as servidor:
            servidor.login(smtp_user, smtp_pass)
            servidor.sendmail(smtp_user, [destinatario], msg.as_string())
    except smtplib.SMTPAuthenticationError:
        raise HTTPException(
            status_code=400,
            detail="Gmail recusou o login do remetente. Verifique o e-mail e a senha de app cadastrados no perfil."
        )


def url_base() -> str:
    base = os.getenv("VERCEL_URL", "localhost:5173")
    if "localhost" in base and not base.startswith("http"):
        return f"http://{base}"
    if not base.startswith("http"):
        return f"https://{base}"
    return base


# ============================================================
# COMUNICADOS
# ============================================================

class ComunicadoCreate(BaseModel):
    email_usuario: EmailStr
    assunto: str
    mensagem: str
    destinatarios: list[EmailStr]
    logo_base64: Optional[str] = None   # data URI ou base64 puro


@app.post("/api/comunicados")
async def enviar_comunicado(dados: ComunicadoCreate):
    db = verificar_supabase()
    usuario = obter_usuario(dados.email_usuario)
    plano = PLANOS.get(usuario.get("tipo_plano", "gratuito"), PLANOS["gratuito"])
    remetente = credenciais_envio(usuario)

    if plano["comunicados_mes"] == 0:
        raise HTTPException(status_code=403, detail="Seu plano não inclui envio de comunicados. Faça upgrade para o plano Profissional ou Empresarial.")

    inicio_mes = inicio_mes_iso()
    enviados = db.table("comunicacoes").select("destinatarios").eq("email_usuario", dados.email_usuario).eq("status", "enviado").gte("criado_em", inicio_mes).execute()

    if plano["comunicados_mes"] is not None and len(enviados.data) >= plano["comunicados_mes"]:
        raise HTTPException(status_code=403, detail=f"Limite de {plano['comunicados_mes']} comunicados/mês do seu plano atingido.")

    emails_ja_enviados = sum(len(c.get("destinatarios") or []) for c in enviados.data)
    if plano["emails_mes"] is not None and emails_ja_enviados + len(dados.destinatarios) > plano["emails_mes"]:
        raise HTTPException(status_code=403, detail=f"Este envio ultrapassaria o limite de {plano['emails_mes']} e-mails/mês do seu plano.")

    logo_bytes = None
    if dados.logo_base64:
        try:
            b64 = dados.logo_base64.split(",", 1)[1] if "," in dados.logo_base64 else dados.logo_base64
            logo_bytes = base64.b64decode(b64)
        except Exception:
            logo_bytes = None

    # Cria o registro antes do envio para ter o id do pixel de rastreio
    registro = db.table("comunicacoes").insert({
        "email_usuario": dados.email_usuario,
        "assunto": dados.assunto,
        "mensagem": dados.mensagem,
        "destinatarios": [{"email": d, "abriu": False, "data_abertura": None} for d in dados.destinatarios],
        "status": "rascunho",
    }).execute()
    comunicado_id = registro.data[0]["id"]

    falhas = []
    for destinatario in dados.destinatarios:
        email_b64 = base64.urlsafe_b64encode(destinatario.encode()).decode()
        pixel = f"{url_base()}/api/comunicados/pixel/{comunicado_id}?e={email_b64}"
        html = montar_html_comunicado(dados.mensagem, logo_cid=bool(logo_bytes), pixel_url=pixel)
        try:
            enviar_email_smtp(destinatario, dados.assunto, html, logo_bytes=logo_bytes, credenciais=remetente)
        except HTTPException:
            raise
        except Exception as e:
            falhas.append({"email": destinatario, "erro": str(e)})

    status_final = "enviado" if len(falhas) < len(dados.destinatarios) else "erro"
    db.table("comunicacoes").update({
        "status": status_final,
        "enviado_em": datetime.datetime.utcnow().isoformat(),
    }).eq("id", comunicado_id).execute()

    return {
        "id": comunicado_id,
        "status": status_final,
        "enviados": len(dados.destinatarios) - len(falhas),
        "falhas": falhas,
        "mensagem": "Comunicado enviado com sucesso!" if not falhas else f"Enviado com {len(falhas)} falha(s).",
    }


@app.get("/api/comunicados")
async def listar_comunicados(email: str):
    db = verificar_supabase()
    res = db.table("comunicacoes").select("*").eq("email_usuario", email).order("criado_em", desc=True).execute()
    resultado = []
    for c in res.data:
        destinatarios = c.get("destinatarios") or []
        aberturas = sum(1 for d in destinatarios if d.get("abriu"))
        resultado.append({
            "id": c["id"],
            "assunto": c["assunto"],
            "mensagem": c.get("mensagem"),
            "status": c.get("status"),
            "enviadoEm": c.get("enviado_em") or c.get("criado_em"),
            "totalDestinatarios": len(destinatarios),
            "totalAberturas": aberturas,
            "destinatarios": destinatarios,
        })
    return resultado


# Pixel de rastreio de abertura (1x1 transparente)
PIXEL_GIF = base64.b64decode("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")


@app.get("/api/comunicados/pixel/{comunicado_id}")
async def pixel_abertura(comunicado_id: str, e: str = ""):
    try:
        db = verificar_supabase()
        email_dest = base64.urlsafe_b64decode(e.encode()).decode() if e else None
        if email_dest:
            res = db.table("comunicacoes").select("destinatarios").eq("id", comunicado_id).execute()
            if res.data:
                destinatarios = res.data[0].get("destinatarios") or []
                mudou = False
                for d in destinatarios:
                    if d.get("email") == email_dest and not d.get("abriu"):
                        d["abriu"] = True
                        d["data_abertura"] = datetime.datetime.utcnow().isoformat()
                        mudou = True
                if mudou:
                    db.table("comunicacoes").update({"destinatarios": destinatarios}).eq("id", comunicado_id).execute()
    except Exception:
        pass
    return StreamingResponse(io.BytesIO(PIXEL_GIF), media_type="image/gif")


# ============================================================
# CONTRATOS GERADOS POR MODELO (controle de limite do plano)
# ============================================================

class ContratoGerado(BaseModel):
    email_usuario: EmailStr
    titulo: str
    modelo_id: Optional[str] = None
    conteudo: Optional[str] = None


@app.post("/api/contratos/gerar")
async def registrar_contrato_gerado(dados: ContratoGerado):
    db = verificar_supabase()
    plano = plano_do_usuario(dados.email_usuario)
    inicio_mes = inicio_mes_iso()

    if plano["contratos_mes"] is not None:
        usados = db.table("contratos").select("id", count="exact").eq("email", dados.email_usuario).gte("criado_em", inicio_mes).execute()
        if (usados.count or 0) >= plano["contratos_mes"]:
            raise HTTPException(status_code=403, detail=f"Limite de {plano['contratos_mes']} contratos/mês do seu plano atingido. Faça upgrade para continuar.")

    res = db.table("contratos").insert({
        "email": dados.email_usuario,
        "titulo": dados.titulo,
        "conteudo": dados.conteudo,
        "nome_arquivo": f"{dados.titulo}.pdf",
        "status": "rascunho",
    }).execute()
    return {"id": res.data[0]["id"], "mensagem": "Contrato registrado."}


# ============================================================
# ORÇAMENTOS
# ============================================================

class ItemOrcamento(BaseModel):
    descricao: str
    quantidade: float = 1
    valor_unitario: float = 0


class OrcamentoCreate(BaseModel):
    email_usuario: EmailStr
    cliente_nome: str
    cliente_email: Optional[EmailStr] = None
    cliente_documento: Optional[str] = None
    titulo: str
    descricao: Optional[str] = None
    itens: list[ItemOrcamento]
    desconto: float = 0
    validade: Optional[str] = None   # yyyy-mm-dd


def gerar_pdf_orcamento(orc: dict) -> bytes:
    packet = io.BytesIO()
    c = canvas.Canvas(packet, pagesize=A4)
    width, height = A4
    y = height - 60

    c.setFillColorRGB(0.2, 0.4, 0.8)
    c.rect(0, height - 8, width, 8, fill=1, stroke=0)
    c.setFillColorRGB(0.1, 0.1, 0.2)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(50, y, f"ORÇAMENTO Nº {orc.get('numero', '')}")
    c.setFont("Helvetica", 10)
    c.setFillColorRGB(0.4, 0.4, 0.4)
    c.drawRightString(width - 50, y, f"Emitido em {datetime.datetime.now().strftime('%d/%m/%Y')}")
    y -= 40

    c.setFillColorRGB(0.2, 0.2, 0.2)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, orc.get("titulo") or "")
    y -= 25

    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, y, "CLIENTE:")
    c.setFont("Helvetica", 10)
    c.drawString(110, y, f"{orc.get('cliente_nome','')}  {('- ' + orc['cliente_documento']) if orc.get('cliente_documento') else ''}")
    y -= 15
    if orc.get("cliente_email"):
        c.drawString(110, y, orc["cliente_email"])
        y -= 15
    if orc.get("validade"):
        c.setFont("Helvetica-Bold", 10)
        c.drawString(50, y, "VALIDADE:")
        c.setFont("Helvetica", 10)
        c.drawString(120, y, datetime.datetime.fromisoformat(orc["validade"]).strftime("%d/%m/%Y") if "T" not in str(orc["validade"]) else orc["validade"])
        y -= 15
    y -= 15

    if orc.get("descricao"):
        c.setFont("Helvetica", 10)
        for linha in str(orc["descricao"]).split("\n"):
            c.drawString(50, y, linha[:100])
            y -= 14
        y -= 10

    # Tabela de itens
    c.setFillColorRGB(0.94, 0.96, 0.99)
    c.rect(50, y - 6, width - 100, 22, fill=1, stroke=0)
    c.setFillColorRGB(0.2, 0.2, 0.3)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(58, y, "Descrição")
    c.drawRightString(width - 210, y, "Qtd.")
    c.drawRightString(width - 130, y, "Valor Unit.")
    c.drawRightString(width - 58, y, "Subtotal")
    y -= 24

    c.setFont("Helvetica", 10)
    for item in orc.get("itens", []):
        qtd = float(item.get("quantidade", 1))
        vu = float(item.get("valor_unitario", 0))
        sub = qtd * vu
        c.setFillColorRGB(0.25, 0.25, 0.25)
        c.drawString(58, y, str(item.get("descricao", ""))[:60])
        c.drawRightString(width - 210, y, f"{qtd:g}")
        c.drawRightString(width - 130, y, f"R$ {vu:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
        c.drawRightString(width - 58, y, f"R$ {sub:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
        y -= 18
        if y < 150:
            c.showPage()
            y = height - 60

    y -= 10
    c.setLineWidth(0.5)
    c.line(width - 260, y, width - 50, y)
    y -= 20

    def moeda(v):
        return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

    c.setFont("Helvetica", 10)
    c.drawRightString(width - 130, y, "Subtotal:")
    c.drawRightString(width - 58, y, moeda(float(orc.get("subtotal", 0))))
    y -= 16
    if float(orc.get("desconto", 0)) > 0:
        c.drawRightString(width - 130, y, "Desconto:")
        c.drawRightString(width - 58, y, f"- {moeda(float(orc['desconto']))}")
        y -= 16
    c.setFont("Helvetica-Bold", 12)
    c.drawRightString(width - 130, y, "TOTAL:")
    c.drawRightString(width - 58, y, moeda(float(orc.get("total", 0))))

    c.setFont("Helvetica", 8)
    c.setFillColorRGB(0.55, 0.55, 0.55)
    c.drawCentredString(width / 2, 40, "Orçamento gerado via VerySing - www.verysing.com.br")
    c.save()
    packet.seek(0)
    return packet.read()


@app.post("/api/orcamentos")
async def criar_orcamento(dados: OrcamentoCreate):
    db = verificar_supabase()
    obter_usuario(dados.email_usuario)  # valida usuário

    subtotal = sum(i.quantidade * i.valor_unitario for i in dados.itens)
    total = max(0, subtotal - dados.desconto)

    res = db.table("orcamentos").insert({
        "email_usuario": dados.email_usuario,
        "cliente_nome": dados.cliente_nome,
        "cliente_email": dados.cliente_email,
        "cliente_documento": dados.cliente_documento,
        "titulo": dados.titulo,
        "descricao": dados.descricao,
        "itens": [i.dict() for i in dados.itens],
        "subtotal": subtotal,
        "desconto": dados.desconto,
        "total": total,
        "validade": dados.validade,
        "status": "rascunho",
    }).execute()
    return res.data[0]


@app.get("/api/orcamentos")
async def listar_orcamentos(email: str):
    db = verificar_supabase()
    res = db.table("orcamentos").select("*").eq("email_usuario", email).order("criado_em", desc=True).execute()
    return res.data


@app.get("/api/orcamentos/{orcamento_id}/pdf")
async def baixar_pdf_orcamento(orcamento_id: str):
    db = verificar_supabase()
    res = db.table("orcamentos").select("*").eq("id", orcamento_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado.")
    pdf = gerar_pdf_orcamento(res.data[0])
    return StreamingResponse(io.BytesIO(pdf), media_type="application/pdf",
                             headers={"Content-Disposition": f"attachment; filename=orcamento_{res.data[0].get('numero','')}.pdf"})


@app.post("/api/orcamentos/{orcamento_id}/enviar")
async def enviar_orcamento(orcamento_id: str):
    db = verificar_supabase()
    res = db.table("orcamentos").select("*").eq("id", orcamento_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado.")
    orc = res.data[0]
    if not orc.get("cliente_email"):
        raise HTTPException(status_code=400, detail="Este orçamento não tem e-mail do cliente cadastrado.")

    usuario = obter_usuario(orc["email_usuario"])
    remetente = credenciais_envio(usuario)
    pdf = gerar_pdf_orcamento(orc)
    html = montar_html_comunicado(
        f"Olá, {orc['cliente_nome']}!\n\nSegue em anexo o orçamento \"{orc['titulo']}\" no valor total de R$ {float(orc['total']):.2f}."
        + (f"\n\nVálido até {orc['validade']}." if orc.get("validade") else "")
        + "\n\nQualquer dúvida, é só responder este e-mail.",
        logo_cid=False, pixel_url=None,
    )
    enviar_email_smtp(orc["cliente_email"], f"Orçamento - {orc['titulo']}", html,
                      anexo_pdf=pdf, nome_anexo=f"orcamento_{orc.get('numero','')}.pdf",
                      credenciais=remetente)

    db.table("orcamentos").update({
        "status": "enviado",
        "enviado_em": datetime.datetime.utcnow().isoformat(),
    }).eq("id", orcamento_id).execute()
    return {"mensagem": f"Orçamento enviado para {orc['cliente_email']}!"}


class OrcamentoStatus(BaseModel):
    status: str  # rascunho | enviado | aprovado | recusado | expirado


@app.put("/api/orcamentos/{orcamento_id}/status")
async def atualizar_status_orcamento(orcamento_id: str, dados: OrcamentoStatus):
    db = verificar_supabase()
    res = db.table("orcamentos").update({"status": dados.status}).eq("id", orcamento_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado.")
    return {"mensagem": "Status atualizado."}


@app.delete("/api/orcamentos/{orcamento_id}")
async def deletar_orcamento(orcamento_id: str):
    db = verificar_supabase()
    db.table("orcamentos").delete().eq("id", orcamento_id).execute()
    return {"mensagem": "Orçamento removido."}


# ============================================================
# ADMINISTRAÇÃO
# ============================================================

@app.get("/api/admin/usuarios")
async def admin_listar_usuarios(email_admin: str):
    db = verificar_supabase()
    exigir_admin(email_admin)
    res = db.table("usuarios").select("id, nome, email, cpf, tipo_plano, status_plano, ativo, criado_em").order("criado_em", desc=True).execute()
    return res.data


class AdminPlanoUpdate(BaseModel):
    email_admin: EmailStr
    tipo_plano: str
    ativo: Optional[bool] = None


@app.put("/api/admin/usuarios/{user_id}/plano")
async def admin_alterar_plano(user_id: str, dados: AdminPlanoUpdate):
    db = verificar_supabase()
    exigir_admin(dados.email_admin)
    if dados.tipo_plano not in PLANOS:
        raise HTTPException(status_code=400, detail="Plano inválido.")
    update = {"tipo_plano": dados.tipo_plano, "atualizado_em": datetime.datetime.utcnow().isoformat()}
    if dados.ativo is not None:
        update["ativo"] = dados.ativo
    res = db.table("usuarios").update(update).eq("id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return {"mensagem": "Usuário atualizado."}


@app.get("/api/admin/stats")
async def admin_stats(email_admin: str):
    db = verificar_supabase()
    exigir_admin(email_admin)
    usuarios = db.table("usuarios").select("id", count="exact").execute()
    documentos = db.table("documentos").select("id", count="exact").execute()
    contratos = db.table("contratos").select("id", count="exact").execute()
    comunicados = db.table("comunicacoes").select("id", count="exact").execute()
    orcamentos = db.table("orcamentos").select("id", count="exact").execute()
    return {
        "usuarios": usuarios.count or 0,
        "documentos": documentos.count or 0,
        "contratos": contratos.count or 0,
        "comunicados": comunicados.count or 0,
        "orcamentos": orcamentos.count or 0,
    }