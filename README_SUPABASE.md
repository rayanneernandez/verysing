# Configuração Supabase

O projeto foi migrado para usar Supabase (PostgreSQL + Storage).

## Passos realizados
1. Dependências atualizadas (`supabase`, `python-dotenv`)
2. Arquivo `.env` configurado com URL e Chave
3. Código do backend (`servidor/principal.py` e `api/index.py`) atualizado para usar tabelas SQL e Storage.

## Como rodar
1. Instale as dependências:
   ```bash
   pip install supabase python-dotenv
   pip uninstall motor
   ```
2. Inicie o servidor:
   ```bash
   uvicorn servidor.principal:app --reload
   ```

## Tabelas Necessárias (SQL)
Certifique-se de ter rodado o script SQL no painel do Supabase para criar as tabelas `usuarios`, `documentos`, `contratos` e os buckets `verysing-docs`.