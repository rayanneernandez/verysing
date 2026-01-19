import { MongoClient } from 'mongodb';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carrega variáveis de ambiente
const envPath = resolve(__dirname, '../.env');
console.log('Carregando .env de:', envPath);

// Tenta via dotenv
dotenv.config({ path: envPath });

// FALLBACK: Se dotenv falhar (por BOM ou encoding), lê na força bruta
if (!process.env.MONGODB_URI && fs.existsSync(envPath)) {
  console.log('⚠️ Dotenv não encontrou URI. Tentando leitura manual bruta...');
  try {
    const content = fs.readFileSync(envPath).toString(); 
    // Procura MONGODB_URI=... ignorando inicio de linha para pular BOM se houver
    const match = content.match(/MONGODB_URI=(.+)/);
    if (match) {
      process.env.MONGODB_URI = match[1].trim().replace(/\r$/, '');
      console.log('✅ URI encontrada manualmente!');
    }
  } catch (e) {
    console.error('Erro na leitura manual:', e);
  }
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'verysing';

if (!uri) {
  console.error('Defina MONGODB_URI no arquivo .env');
  process.exit(1);
}

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log('✅ Conectado ao MongoDB');
    const db = client.db(dbName);

    // 1) DOCUMENTOS
    await db.createCollection('documentos', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name', 'hash', 'status', 'createdAt'],
          properties: {
            name: { bsonType: 'string' },
            ownerEmail: { bsonType: 'string' },
            sizeBytes: { bsonType: 'number' },
            mimeType: { bsonType: 'string' },
            hash: { bsonType: 'string' },
            path: { bsonType: 'string' }, // caminho no disco/Storage
            status: { enum: ['draft', 'sent', 'signed', 'completed', 'archived'] },
            folderId: { bsonType: ['objectId', 'null'] },
            category: { bsonType: 'string' },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' }
          }
        }
      }
    }).catch(() => {}); // Ignora se já existe
    await db.collection('documentos').createIndex({ hash: 1 }, { unique: true });
    await db.collection('documentos').createIndex({ ownerEmail: 1, createdAt: -1 });

    // 2) ENVELOPES (envio para assinatura)
    // "envelopes" já é igual em pt/en, mantendo.
    await db.createCollection('envelopes', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['status', 'createdAt', 'recipients', 'documentIds'],
          properties: {
            subject: { bsonType: 'string' },
            message: { bsonType: 'string' },
            senderEmail: { bsonType: 'string' },
            senderName: { bsonType: 'string' },
            status: { enum: ['created', 'sent', 'completed', 'cancelled'] },
            deadline: { bsonType: ['date', 'null'] },
            autoReminder: { bsonType: 'bool' },
            documentIds: { bsonType: 'array', items: { bsonType: 'objectId' } },
            recipients: {
              bsonType: 'array',
              items: {
                bsonType: 'object',
                required: ['name', 'email', 'role'],
                properties: {
                  name: { bsonType: 'string' },
                  email: { bsonType: 'string' },
                  role: { bsonType: 'string' }, // CONTRATANTE, CONTRATADA, etc.
                  status: { enum: ['pending', 'sent', 'viewed', 'signed'] },
                  signedAt: { bsonType: ['date', 'null'] },
                  ipAddress: { bsonType: 'string' }
                }
              }
            },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' }
          }
        }
      }
    }).catch(() => {});
    await db.collection('envelopes').createIndex({ 'recipients.email': 1 });
    await db.collection('envelopes').createIndex({ status: 1, createdAt: -1 });

    // 3) ASSINATURAS
    await db.createCollection('assinaturas', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['envelopeId', 'documentId', 'email', 'hash', 'createdAt'],
          properties: {
            envelopeId: { bsonType: 'objectId' },
            documentId: { bsonType: 'objectId' },
            name: { bsonType: 'string' },
            email: { bsonType: 'string' },
            role: { bsonType: 'string' },
            signatureImage: { bsonType: 'string' }, // base64 ou caminho
            ipAddress: { bsonType: 'string' },
            userAgent: { bsonType: 'string' },
            hash: { bsonType: 'string' }, // hash do documento assinado
            createdAt: { bsonType: 'date' }
          }
        }
      }
    }).catch(() => {});
    await db.collection('assinaturas').createIndex({ envelopeId: 1 });
    await db.collection('assinaturas').createIndex({ documentId: 1 });
    await db.collection('assinaturas').createIndex({ email: 1 });

    // 4) MODELOS DE CONTRATO
    await db.createCollection('modelos', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['slug', 'title', 'createdAt'],
          properties: {
            slug: { bsonType: 'string' }, // ex: "servicos", "locacao_residencial"
            title: { bsonType: 'string' },
            description: { bsonType: 'string' },
            fields: {
              bsonType: 'array',
              items: {
                bsonType: 'object',
                properties: {
                  key: { bsonType: 'string' },
                  label: { bsonType: 'string' },
                  type: { bsonType: 'string' }
                }
              }
            },
            contentHtml: { bsonType: 'string' },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' }
          }
        }
      }
    }).catch(() => {});
    await db.collection('modelos').createIndex({ slug: 1 }, { unique: true });

    // 5) COMUNICADOS / EMAILS ENVIADOS
    await db.createCollection('comunicacoes', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['type', 'to', 'subject', 'createdAt'],
          properties: {
            type: { enum: ['envelope', 'generic'] },
            envelopeId: { bsonType: ['objectId', 'null'] },
            to: { bsonType: 'string' },
            cc: { bsonType: 'string' },
            bcc: { bsonType: 'string' },
            subject: { bsonType: 'string' },
            body: { bsonType: 'string' },
            status: { enum: ['queued', 'sent', 'error'] },
            errorMessage: { bsonType: 'string' },
            createdAt: { bsonType: 'date' }
          }
        }
      }
    }).catch(() => {});
    await db.collection('comunicacoes').createIndex({ to: 1, createdAt: -1 });
    await db.collection('comunicacoes').createIndex({ envelopeId: 1 });

    await db.createCollection('usuarios', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['nome', 'email', 'cpf', 'tipoPlano', 'criadoEm'],
          properties: {
            nome: { bsonType: 'string' },
            email: { bsonType: 'string' },
            cpf: { bsonType: 'string' }, // CPF único para evitar múltiplas contas grátis
            senhaHash: { bsonType: 'string' },
            tipoPlano: { enum: ['gratuito', 'profissional', 'empresarial', 'administrador'] },
            statusPlano: { enum: ['ativo', 'trial', 'cancelado', 'pendente'] }, // Controle de pagamento/trial
            inicioTrial: { bsonType: ['date', 'null'] },
            fimTrial: { bsonType: ['date', 'null'] },
            ativo: { bsonType: 'bool' },
            criadoEm: { bsonType: 'date' },
            atualizadoEm: { bsonType: 'date' }
          }
        }
      }
    }).catch(() => {});
    await db.collection('usuarios').createIndex({ email: 1 }, { unique: true });
    await db.collection('usuarios').createIndex({ cpf: 1 }, { unique: true }); // Garante CPF único no sistema
    await db.collection('usuarios').createIndex({ tipoPlano: 1 });

    console.log('✅ Coleções e índices criados/atualizados com sucesso no banco:', dbName);
  } catch (err) {
    console.error('❌ Erro ao inicializar MongoDB:', err);
  } finally {
    await client.close();
  }
}

run();