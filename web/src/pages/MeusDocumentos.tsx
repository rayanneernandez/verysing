import { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useLanguage } from '../contexts/LanguageContext';
import './MeusDocumentos.css';

interface Document {
  id: string;
  name: string;
  date: string;
  size: string;
  type: 'pdf' | 'doc' | 'image';
  folderId: string | null;
  category: string;
}

interface Folder {
  id: string;
  name: string;
}

interface AuditLog {
  id: string;
  action: 'created' | 'sent' | 'viewed' | 'signed' | 'completed';
  actor: string;
  timestamp: string;
  details?: string;
}

export default function MeusDocumentos() {
  const { t } = useLanguage();
  const [folders, setFolders] = useState<Folder[]>(() => {
    const saved = localStorage.getItem('app_folders');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Contratos 2024' },
      { id: '2', name: 'Recibos' },
      { id: '3', name: 'Propostas' }
    ];
  });

  const [activeFolderId, setActiveFolderId] = useState<string | null>(null); // null means "All"
  
  const [documents, setDocuments] = useState<Document[]>(() => {
    const saved = localStorage.getItem('app_documents');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Contrato Social.pdf', date: '12/05/2024', size: '1.2 MB', type: 'pdf', folderId: '1', category: 'Jurídico' },
      { id: '2', name: 'Recibo Maio.pdf', date: '30/05/2024', size: '0.5 MB', type: 'pdf', folderId: '2', category: 'Financeiro' },
      { id: '3', name: 'Proposta Cliente X.docx', date: '01/06/2024', size: '2.4 MB', type: 'doc', folderId: '3', category: 'Vendas' },
      { id: '4', name: 'Documento Geral.pdf', date: '15/04/2024', size: '1.0 MB', type: 'pdf', folderId: null, category: 'Geral' },
    ];
  });

  // Persist folders and documents
  useEffect(() => {
    localStorage.setItem('app_folders', JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem('app_documents', JSON.stringify(documents));
  }, [documents]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  // State for Move Document
  const [movingDocument, setMovingDocument] = useState<Document | null>(null);

  // State for Menus
  const [activeDocMenuId, setActiveDocMenuId] = useState<string | null>(null);
  const [activeFolderMenuId, setActiveFolderMenuId] = useState<string | null>(null);
  
  // State for Confirmation Modal
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDocMenuId(null);
      setActiveFolderMenuId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // State for Document Details Modal
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileType = (fileName: string): 'pdf' | 'doc' | 'image' => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(ext || '')) return 'doc';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return 'image';
    return 'doc';
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const newDoc: Document = {
        id: Date.now().toString(),
        name: file.name,
        date: new Date().toLocaleDateString('pt-BR'),
        size: formatFileSize(file.size),
        type: getFileType(file.name),
        folderId: activeFolderId,
        category: 'Rascunho'
      };
      setDocuments([newDoc, ...documents]);
      event.target.value = ''; // Reset input
    }
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = activeFolderId === null || doc.folderId === activeFolderId;
    return matchesSearch && matchesFolder;
  });

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      setFolders([...folders, { id: Date.now().toString(), name: newFolderName }]);
      setNewFolderName('');
      setIsCreateFolderModalOpen(false);
    }
  };

  const handleMoveDocument = (folderId: string | null) => {
    if (movingDocument) {
      setDocuments(documents.map(doc => 
        doc.id === movingDocument.id ? { ...doc, folderId } : doc
      ));
      setMovingDocument(null);
    }
  };

  const handleDeleteDocument = (id: string) => {
    setConfirmationModal({
      isOpen: true,
      title: t('documents.delete_title') || 'Excluir Documento',
      message: t('documents.delete_confirm') || 'Tem certeza que deseja excluir este documento?',
      onConfirm: () => {
        setDocuments(documents.filter(doc => doc.id !== id));
      }
    });
  };

  const handleDownloadDocument = (doc: Document) => {
    // Real download simulation
    const content = `Conteúdo simulado do documento: ${doc.name}\n\nData: ${doc.date}\nTamanho: ${doc.size}\nCategoria: ${doc.category}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name; // Simulates original filename
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleDeleteFolder = (id: string) => {
    setConfirmationModal({
      isOpen: true,
      title: t('documents.delete_folder_title') || 'Excluir Pasta',
      message: t('documents.delete_folder_confirm') || 'Tem certeza que deseja excluir esta pasta e todos os seus documentos?',
      onConfirm: () => {
        setFolders(folders.filter(f => f.id !== id));
        setDocuments(documents.filter(doc => doc.folderId !== id));
        if (activeFolderId === id) setActiveFolderId(null);
      }
    });
  };

  const handleDownloadFolder = (id: string) => {
    const folder = folders.find(f => f.id === id);
    if (folder) {
      const folderDocs = documents.filter(d => d.folderId === id);
      const content = `Resumo da Pasta: ${folder.name}\n\nDocumentos:\n${folderDocs.map(d => `- ${d.name} (${d.size})`).join('\n')}`;
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folder.name}_resumo.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  const handleDocumentClick = (doc: Document) => {
    setSelectedDocument(doc);
    // Mock audit logs based on document
    setAuditLogs([
      { id: '1', action: 'created', actor: 'Você', timestamp: '12/05/2024 10:00', details: 'Documento criado' },
      { id: '2', action: 'sent', actor: 'Você', timestamp: '12/05/2024 10:05', details: 'Enviado para assinatura' },
      { id: '3', action: 'viewed', actor: 'João Silva', timestamp: '12/05/2024 14:30', details: 'Visualizou o e-mail' },
      { id: '4', action: 'signed', actor: 'João Silva', timestamp: '13/05/2024 09:15', details: 'Assinou o documento' },
      { id: '5', action: 'completed', actor: 'Sistema', timestamp: '13/05/2024 09:15', details: 'Processo finalizado' },
    ]);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created': return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>;
      case 'sent': return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>;
      case 'viewed': return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
      case 'signed': return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;
      case 'completed': return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
      default: return <span className="bullet">•</span>;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'created': return t('log.created');
      case 'sent': return t('log.sent');
      case 'viewed': return t('log.viewed');
      case 'signed': return t('log.signed');
      case 'completed': return t('log.completed');
      default: return action;
    }
  };

  return (
    <DashboardLayout title={t('documents.title')}>
      <div className="documents-page">
        {/* Sidebar for Folders */}
        <div className="folders-sidebar">
          <div className="folders-header">
             <h3>{t('documents.folder_name')}</h3>
             <button className="btn-icon-add" onClick={() => setIsCreateFolderModalOpen(true)} title={t('documents.new_folder')}>
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
             </button>
          </div>
          <ul className="folders-list">
            <li 
              className={activeFolderId === null ? 'active' : ''} 
              onClick={() => setActiveFolderId(null)}
            >
              <div className="folder-info">
                <span className="folder-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                </span> 
                {t('documents.all')}
              </div>
            </li>
            {folders.map(folder => (
              <li 
                key={folder.id} 
                className={activeFolderId === folder.id ? 'active' : ''}
                onClick={() => setActiveFolderId(folder.id)}
              >
                <div className="folder-info">
                  <span className="folder-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                  </span> 
                  {folder.name}
                </div>
                <div className="folder-actions" style={{ position: 'relative' }}>
                   <button 
                     className={`folder-actions-btn ${activeFolderMenuId === folder.id ? 'active' : ''}`}
                     onClick={(e) => {
                       e.stopPropagation();
                       setActiveFolderMenuId(activeFolderMenuId === folder.id ? null : folder.id);
                       setActiveDocMenuId(null); // Close other menus
                     }}
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                   </button>
                   {activeFolderMenuId === folder.id && (
                     <div className="dropdown-menu">
                       <button className="dropdown-item" onClick={(e) => { e.stopPropagation(); handleDownloadFolder(folder.id); setActiveFolderMenuId(null); }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                          Baixar
                       </button>
                       <button className="dropdown-item delete" onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); setActiveFolderMenuId(null); }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          Excluir
                       </button>
                     </div>
                   )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Main Content */}
        <div className="documents-main">
          <div className="documents-toolbar">
            <div className="search-bar">
              <input 
                type="text" 
                placeholder={t('documents.search')} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileChange} 
            />
            <button className="btn-primary" onClick={handleUploadClick}>Upload de Rascunho</button>
          </div>

          <div className="documents-list">
             {filteredDocs.length > 0 ? (
               <table className="docs-table">
                 <thead>
                   <tr>
                     <th>{t('documents.name')}</th>
                     <th>{t('documents.category')}</th>
                     <th>{t('documents.date')}</th>
                     <th>{t('documents.size')}</th>
                     <th></th>
                   </tr>
                 </thead>
                 <tbody>
                   {filteredDocs.map(doc => (
                     <tr key={doc.id} onClick={() => handleDocumentClick(doc)}>
                       <td className="doc-name-cell">
                         <span className={`doc-icon ${doc.type}`}>{doc.type.toUpperCase().slice(0, 3)}</span>
                         {doc.name}
                       </td>
                       <td><span className="badge">{doc.category}</span></td>
                       <td>{doc.date}</td>
                       <td>{doc.size}</td>
                       <td className="actions-cell">
                         <button 
                           className={`btn-icon ${activeDocMenuId === doc.id ? 'active' : ''}`} 
                           onClick={(e) => {
                             e.stopPropagation();
                             setActiveDocMenuId(activeDocMenuId === doc.id ? null : doc.id);
                             setActiveFolderMenuId(null); // Close other menus
                           }}
                           title="Opções"
                         >
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                         </button>
                         {activeDocMenuId === doc.id && (
                           <div className="dropdown-menu">
                             <button className="dropdown-item" onClick={(e) => { e.stopPropagation(); setMovingDocument(doc); setActiveDocMenuId(null); }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                {t('documents.move')}
                             </button>
                             <button className="dropdown-item" onClick={(e) => { e.stopPropagation(); handleDownloadDocument(doc); setActiveDocMenuId(null); }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                Baixar
                             </button>
                             <button className="dropdown-item delete" onClick={(e) => { e.stopPropagation(); handleDeleteDocument(doc.id); setActiveDocMenuId(null); }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                Excluir
                             </button>
                           </div>
                         )}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             ) : (
               <div className="empty-state">
                 <p>{t('documents.empty')}</p>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmationModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>{confirmationModal.title}</h3>
              <button onClick={() => setConfirmationModal({ ...confirmationModal, isOpen: false })}>✕</button>
            </div>
            <div className="modal-content">
              <p>{confirmationModal.message}</p>
            </div>
            <div className="modal-actions">
              <button onClick={() => setConfirmationModal({ ...confirmationModal, isOpen: false })}>Cancelar</button>
              <button 
                className="btn-primary" 
                style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}
                onClick={() => {
                  confirmationModal.onConfirm();
                  setConfirmationModal({ ...confirmationModal, isOpen: false });
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {isCreateFolderModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateFolderModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{t('documents.new_folder')}</h3>
            <input 
              type="text" 
              value={newFolderName} 
              onChange={(e) => setNewFolderName(e.target.value)} 
              placeholder={t('documents.folder_name')}
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={() => setIsCreateFolderModalOpen(false)}>{t('documents.cancel')}</button>
              <button onClick={handleCreateFolder} className="btn-primary">{t('documents.create')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Move Document Modal */}
      {movingDocument && (
        <div className="modal-overlay" onClick={() => setMovingDocument(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#1e293b' }}>{t('documents.move')} "{movingDocument.name}"</h3>
            <div className="folder-selection-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
              <button 
                className={`folder-select-item ${movingDocument.folderId === null ? 'active' : ''}`}
                onClick={() => handleMoveDocument(null)}
                style={{ 
                  padding: '1rem', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  background: movingDocument.folderId === null ? '#eff6ff' : 'white',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: movingDocument.folderId === null ? '#2563eb' : '#64748b'
                }}
              >
                <span>📂</span> {t('documents.all')}
              </button>
              {folders.map(folder => (
                <button 
                  key={folder.id}
                  className={`folder-select-item ${movingDocument.folderId === folder.id ? 'active' : ''}`}
                  onClick={() => handleMoveDocument(folder.id)}
                  style={{ 
                    padding: '1rem', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px', 
                    background: movingDocument.folderId === folder.id ? '#eff6ff' : 'white',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: movingDocument.folderId === folder.id ? '#2563eb' : '#64748b'
                  }}
                >
                  <span>📁</span> {folder.name}
                </button>
              ))}
            </div>
            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button onClick={() => setMovingDocument(null)}>{t('documents.cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Document Details Modal (Audit Log) */}
      {selectedDocument && (
        <div className="modal-overlay" onClick={() => setSelectedDocument(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', color: '#1e293b' }}>{selectedDocument.name}</h3>
              <button 
                onClick={() => setSelectedDocument(null)} 
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.25rem', padding: '0.25rem' }}
                onMouseOver={(e) => e.currentTarget.style.color = '#1e293b'}
                onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}
              >
                ✕
              </button>
            </div>
            
            <div>
              <h4 style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 600, letterSpacing: '0.5px' }}>{t('log.title')}</h4>
              
              <div className="audit-log-list">
                {auditLogs.map(log => (
                  <div key={log.id} className="audit-item">
                    <div className="audit-icon">
                      {getActionIcon(log.action)}
                    </div>
                    <div className="audit-content">
                      <div className="audit-header">
                        <span className="audit-action">{getActionLabel(log.action)}</span>
                        <span className="audit-time">{log.timestamp}</span>
                      </div>
                      <div className="audit-actor">{t('log.by')}: {log.actor}</div>
                      {log.details && <div className="audit-details">{log.details}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={() => setSelectedDocument(null)}>{t('documents.cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}