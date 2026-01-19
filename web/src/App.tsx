import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import Home from './pages/Home';
import Login from './pages/Login';
import RecuperarSenha from './pages/RecuperarSenha';
import Validacao from './pages/Validacao';
import Sucesso from './pages/Sucesso';
import Landing from './pages/Landing';
import Contato from './pages/Contato';
import Dashboard from './pages/Dashboard';
import MeusDocumentos from './pages/MeusDocumentos';
import CriarFormulario from './pages/CriarFormulario';
import EnviarDocumento from './pages/EnviarDocumento';
import EnviarComunicado from './pages/EnviarComunicado.tsx';
import HistoricoComunicados from './pages/HistoricoComunicados.tsx';
import ModelosContrato from './pages/ModelosContrato';
import MeusFormularios from './pages/MeusFormularios.tsx';
import Pagamento from './pages/Pagamento.tsx';
import './App.css';

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
        <Route path="/contato" element={<Contato />} />
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />
        <Route path="/app" element={<Dashboard />} />
        <Route path="/documentos" element={<MeusDocumentos />} />
        <Route path="/criar-formulario" element={<CriarFormulario />} />
        <Route path="/formularios" element={<MeusFormularios />} />
        <Route path="/modelos" element={<ModelosContrato />} />
        <Route path="/enviar-comunicado" element={<EnviarComunicado />} />
        <Route path="/historico-comunicados" element={<HistoricoComunicados />} />
        <Route path="/assinar" element={<Home />} />
        <Route path="/enviar" element={<EnviarDocumento />} />
        <Route path="/pagamento" element={<Pagamento />} />
        <Route path="/validar/:hash" element={<Validacao />} />
        <Route path="/validar" element={<Validacao />} />
        <Route path="/validar/*" element={<Validacao />} />
        <Route path="/sucesso" element={<Sucesso />} />
      </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;