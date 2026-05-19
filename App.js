// App.js
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, FlatList,
  TouchableOpacity, ActivityIndicator, StatusBar,
  KeyboardAvoidingView, Platform, ScrollView, Modal,
} from 'react-native';
import Constants from 'expo-constants';
import CepResult from './src/components/CepResult';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const host    = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
const API_URL = `http://${host}:3000`;

const DB_OPTIONS = [
  { label: 'SQLite',  value: 'sqlite', cor: '#4F7FFA' },
  { label: 'MongoDB', value: 'mongo',  cor: '#4CAF82' },
  { label: 'Ambos',   value: 'both',   cor: '#9B59B6' },
];

async function apiFetch(path, opts = {}, db = 'sqlite') {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', 'X-DB': db, ...(opts.headers || {}) },
  });
  return res.json();
}

// ─── COMPONENTES ──────────────────────────────────────────────────────────────
function Tag({ label, cor }) {
  return (
    <View style={[styles.tag, { backgroundColor: cor + '22', borderColor: cor + '55' }]}>
      <Text style={[styles.tagText, { color: cor }]}>{label}</Text>
    </View>
  );
}

function DbSelector({ value, onChange }) {
  return (
    <View style={styles.dbRow}>
      <Text style={styles.dbLabel}>Banco de dados</Text>
      <View style={styles.dbBtns}>
        {DB_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.dbBtn, value === opt.value && { backgroundColor: opt.cor, borderColor: opt.cor }]}
          >
            <Text style={[styles.dbBtnText, value === opt.value && { color: '#fff' }]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function Mensagem({ texto, cor }) {
  if (!texto) return null;
  return (
    <View style={[styles.mensagemBox, { borderLeftColor: cor, backgroundColor: cor + '15' }]}>
      <Text style={[styles.mensagemTexto, { color: cor }]}>{texto}</Text>
    </View>
  );
}

function Campo({ label, ...props }) {
  return (
    <View style={styles.campoWrap}>
      <Text style={styles.campoLabel}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor="#aaa" {...props} />
    </View>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [usuarios, setUsuarios]       = useState([]);
  const [db, setDb]                   = useState('sqlite');
  const [editando, setEditando]       = useState(null);
  const [loadingCep, setLoadingCep]   = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [msg, setMsg]                 = useState({ texto: '', cor: '#e74c3c' });
  const [modalItem, setModalItem]     = useState(null);

  // Campos do formulário
  const [nome, setNome]               = useState('');
  const [cepInput, setCepInput]       = useState('');
  const [logradouro, setLogradouro]   = useState('');
  const [numero, setNumero]           = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro]           = useState('');
  const [cidade, setCidade]           = useState('');
  const [estado, setEstado]           = useState('');

  useEffect(() => { carregarUsuarios(); }, [db]);

  function falar(texto, cor = '#e74c3c') {
    setMsg({ texto, cor });
    setTimeout(() => setMsg({ texto: '', cor: '#e74c3c' }), 3000);
  }

  function preencherEndereco(data) {
    setLogradouro(data.logradouro || '');
    setBairro(data.bairro || '');
    setCidade(data.cidade || data.localidade || '');
    setEstado(data.estado || '');
  }

  function limpar() {
    setNome(''); setCepInput(''); setLogradouro('');
    setNumero(''); setComplemento(''); setBairro('');
    setCidade(''); setEstado(''); setEditando(null);
  }

  async function carregarUsuarios() {
    try {
      const data = await apiFetch('/usuarios', {}, db);
      if (Array.isArray(data)) setUsuarios(data);
      else setUsuarios([
        ...(data.sqlite || []).map(u => ({ ...u, _origem: 'sqlite' })),
        ...(data.mongo  || []).map(u => ({ ...u, _origem: 'mongo'  })),
      ]);
    } catch { falar('⚠️ Não foi possível conectar ao servidor.'); }
  }

  async function buscarCep() {
    const limpo = cepInput.replace(/\D/g, '');
    if (limpo.length !== 8) { falar('⚠️ CEP deve ter 8 dígitos.'); return; }
    setLoadingCep(true);
    try {
      const data = await apiFetch(`/cep/${limpo}`, {}, db);
      if (data.erro) { falar('⚠️ CEP não encontrado.'); }
      else { preencherEndereco(data); falar('✅ CEP encontrado!', '#27ae60'); }
    } catch { falar('⚠️ Falha ao buscar CEP.'); }
    finally { setLoadingCep(false); }
  }

  function validar() {
    if (!nome.trim())                             { falar('⚠️ Digite o nome.');            return false; }
    if (nome.trim().length < 2)                   { falar('⚠️ Nome muito curto.');         return false; }
    if (cepInput.replace(/\D/g,'').length !== 8)  { falar('⚠️ CEP deve ter 8 dígitos.');  return false; }
    if (!logradouro.trim())                       { falar('⚠️ Logradouro obrigatório.');   return false; }
    return true;
  }

  async function handleSalvar() {
    if (!validar()) return;
    setLoadingSave(true);
    try {
      const body = {
        nome: nome.trim(),
        cep: cepInput,
        logradouro: logradouro.trim(),
        numero: numero.trim(),
        complemento: complemento.trim(),
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        estado: estado.trim(),
      };

      if (editando) {
        await apiFetch(`/usuarios/${editando}`, { method: 'PUT', body: JSON.stringify(body) }, db);
        falar('✅ Usuário atualizado!', '#27ae60');
      } else {
        await apiFetch('/usuarios', { method: 'POST', body: JSON.stringify(body) }, db);
        falar('✅ Usuário salvo!', '#27ae60');
      }
      limpar();
      carregarUsuarios();
    } catch { falar('⚠️ Erro ao salvar.'); }
    finally { setLoadingSave(false); }
  }

  async function handleDeletar(id) {
    try {
      await apiFetch(`/usuarios/${id}`, { method: 'DELETE' }, db);
      falar('✅ Usuário deletado!', '#27ae60');
      setModalItem(null);
      carregarUsuarios();
    } catch { falar('⚠️ Erro ao deletar.'); }
  }

  function handleEditar(item) {
    setEditando(item._id);
    setNome(item.nome || '');
    setCepInput(item.cep || '');
    setLogradouro(item.logradouro || '');
    setNumero(item.numero || '');
    setComplemento(item.complemento || '');
    setBairro(item.bairro || '');
    setCidade(item.cidade || '');
    setEstado(item.estado || '');
    setModalItem(null);
    falar('✏️ Editando usuário...', '#e67e22');
  }

  const dbAtual = DB_OPTIONS.find(d => d.value === db) || DB_OPTIONS[0];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#f4f6fb' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor="#f4f6fb" />

      <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📍 CadastroVia</Text>
          <Text style={styles.headerSub}>CEP + banco de dados</Text>
        </View>

        <Mensagem texto={msg.texto} cor={msg.cor} />
        <DbSelector value={db} onChange={setDb} />

        <View style={[styles.card, editando && styles.cardEditando]}>
          <Text style={styles.secaoTitulo}>{editando ? '✏️ Editando usuário' : '+ Novo usuário'}</Text>

          <Campo label="Nome completo" placeholder="Nome completo" value={nome} onChangeText={setNome} />

          {/* CEP + botão buscar */}
          <Text style={styles.campoLabel}>CEP</Text>
          <View style={styles.cepRow}>
            <TextInput
              placeholder="CEP (8 dígitos)"
              value={cepInput}
              onChangeText={t => setCepInput(t.replace(/\D/g, '').slice(0, 8))}
              keyboardType="numeric"
              maxLength={8}
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity style={[styles.btnBuscar, loadingCep && { opacity: 0.6 }]} onPress={buscarCep} disabled={loadingCep}>
              {loadingCep ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnBuscarText}>Buscar</Text>}
            </TouchableOpacity>
          </View>

          {/* Campos de endereço — editáveis */}
          <View style={styles.duasColunasRow}>
            <View style={{ flex: 1 }}>
              <Campo label="Logradouro" placeholder="Rua, Av..." value={logradouro} onChangeText={setLogradouro} />
            </View>
            <View style={{ width: 90 }}>
              <Campo label="Número" placeholder="Nº" value={numero} onChangeText={setNumero} keyboardType="numeric" />
            </View>
          </View>

          <Campo label="Complemento" placeholder="Apto, Bloco... (opcional)" value={complemento} onChangeText={setComplemento} />

          <View style={styles.duasColunasRow}>
            <View style={{ flex: 1 }}>
              <Campo label="Bairro" placeholder="Bairro" value={bairro} onChangeText={setBairro} />
            </View>
            <View style={{ width: 55 }}>
              <Campo label="UF" placeholder="SP" value={estado} onChangeText={t => setEstado(t.slice(0,2).toUpperCase())} maxLength={2} />
            </View>
          </View>

          <Campo label="Cidade" placeholder="Cidade" value={cidade} onChangeText={setCidade} />

          <View style={styles.botoesForm}>
            <TouchableOpacity
              style={[styles.btnSalvar, { backgroundColor: editando ? '#e67e22' : dbAtual.cor }, loadingSave && { opacity: 0.6 }]}
              onPress={handleSalvar}
              disabled={loadingSave}
            >
              {loadingSave ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnSalvarText}>{editando ? 'Atualizar' : 'Salvar'}</Text>}
            </TouchableOpacity>
            {editando && (
              <TouchableOpacity style={styles.btnCancelar} onPress={limpar}>
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {usuarios.length > 0 && <Text style={styles.secaoTitulo}>👥 Cadastrados ({usuarios.length})</Text>}
      </ScrollView>

      <FlatList
        data={usuarios}
        keyExtractor={(item, i) => (item._id?.toString() || i.toString())}
        renderItem={({ item }) => {
          const origem = item._origem || db;
          const cor = DB_OPTIONS.find(d => d.value === origem)?.cor || dbAtual.cor;
          return (
            <TouchableOpacity style={styles.usuarioCard} onPress={() => setModalItem(item)} activeOpacity={0.75}>
              <View style={[styles.usuarioFaixa, { backgroundColor: cor }]} />
              <View style={styles.usuarioConteudo}>
                <View style={styles.usuarioTopoRow}>
                  <Text style={styles.usuarioNome}>{item.nome}</Text>
                  <Tag label={origem} cor={cor} />
                </View>
                <Text style={styles.usuarioCep}>CEP {item.cep}</Text>
                <Text style={styles.usuarioEndereco}>
                  {item.logradouro}{item.numero ? `, ${item.numero}` : ''}{item.complemento ? ` ${item.complemento}` : ''}
                </Text>
                <Text style={styles.usuarioEndereco}>{item.bairro}</Text>
                <Text style={styles.usuarioCidade}>{item.cidade} — {item.estado}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.vazio}>Nenhum usuário cadastrado ainda.</Text>}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      />

      <Modal visible={!!modalItem} transparent animationType="fade" onRequestClose={() => setModalItem(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalItem(null)}>
          <View style={styles.modalBox}>
            <Text style={styles.modalNome}>{modalItem?.nome}</Text>
            <Text style={styles.modalInfo}>{modalItem?.logradouro}{modalItem?.numero ? `, ${modalItem.numero}` : ''}{modalItem?.complemento ? ` — ${modalItem.complemento}` : ''}</Text>
            <Text style={styles.modalInfo}>{modalItem?.bairro}</Text>
            <Text style={styles.modalInfo}>{modalItem?.cidade} — {modalItem?.estado}</Text>
            <Text style={styles.modalInfo}>CEP: {modalItem?.cep}</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#e67e22' }]} onPress={() => handleEditar(modalItem)}>
                <Text style={styles.modalBtnText}>✏️ Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#e74c3c' }]} onPress={() => handleDeletar(modalItem._id)}>
                <Text style={styles.modalBtnText}>🗑 Deletar</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setModalItem(null)}>
              <Text style={styles.modalFechar}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:      { paddingHorizontal: 18, paddingTop: 52, backgroundColor: '#f4f6fb' },
  header:         { marginBottom: 20 },
  headerTitle:    { fontSize: 26, fontWeight: '800', color: '#1a1d2e', letterSpacing: -0.5 },
  headerSub:      { fontSize: 13, color: '#8a92a6', marginTop: 2 },
  mensagemBox:    { borderLeftWidth: 3, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 14 },
  mensagemTexto:  { fontSize: 13, fontWeight: '600' },
  dbRow:          { marginBottom: 16 },
  dbLabel:        { fontSize: 11, fontWeight: '700', color: '#8a92a6', letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase' },
  dbBtns:         { flexDirection: 'row', gap: 8 },
  dbBtn:          { flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: '#dde2ee', alignItems: 'center', backgroundColor: '#fff' },
  dbBtnText:      { fontSize: 13, fontWeight: '700', color: '#8a92a6' },
  card:           { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 24, shadowColor: '#1a1d2e', shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  cardEditando:   { borderWidth: 1.5, borderColor: '#e67e2255' },
  secaoTitulo:    { fontSize: 15, fontWeight: '700', color: '#1a1d2e', marginBottom: 14 },
  campoWrap:      { marginBottom: 10 },
  campoLabel:     { fontSize: 11, fontWeight: '700', color: '#8a92a6', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  input:          { borderWidth: 1.5, borderColor: '#e8eaf0', borderRadius: 10, padding: 12, fontSize: 14, color: '#1a1d2e', backgroundColor: '#f9fafc', marginBottom: 0 },
  cepRow:         { flexDirection: 'row', gap: 10, marginBottom: 10 },
  duasColunasRow: { flexDirection: 'row', gap: 10 },
  btnBuscar:      { backgroundColor: '#4F7FFA', borderRadius: 10, paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center', minWidth: 78 },
  btnBuscarText:  { color: '#fff', fontWeight: '700', fontSize: 13 },
  botoesForm:     { flexDirection: 'row', gap: 10, marginTop: 14 },
  btnSalvar:      { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnSalvarText:  { color: '#fff', fontWeight: '800', fontSize: 15 },
  btnCancelar:    { paddingVertical: 13, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1.5, borderColor: '#dde2ee', alignItems: 'center', justifyContent: 'center' },
  btnCancelarText:{ color: '#8a92a6', fontWeight: '600', fontSize: 14 },
  usuarioCard:    { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 18, marginBottom: 10, overflow: 'hidden', shadowColor: '#1a1d2e', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  usuarioFaixa:   { width: 4 },
  usuarioConteudo:{ flex: 1, padding: 14 },
  usuarioTopoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  usuarioNome:    { fontSize: 15, fontWeight: '700', color: '#1a1d2e', flex: 1, marginRight: 8 },
  usuarioCep:     { fontSize: 11, color: '#8a92a6', marginBottom: 2, fontWeight: '600' },
  usuarioEndereco:{ fontSize: 13, color: '#454d66' },
  usuarioCidade:  { fontSize: 12, color: '#8a92a6', marginTop: 1 },
  tag:            { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  tagText:        { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  vazio:          { textAlign: 'center', color: '#adb5bd', fontSize: 14, marginTop: 30, marginHorizontal: 18 },
  modalOverlay:   { flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' },
  modalBox:       { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  modalNome:      { fontSize: 20, fontWeight: '800', color: '#1a1d2e', marginBottom: 6 },
  modalInfo:      { fontSize: 13, color: '#8a92a6', marginBottom: 2 },
  modalBtns:      { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 12 },
  modalBtn:       { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalBtnText:   { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalFechar:    { textAlign: 'center', color: '#8a92a6', fontWeight: '600', fontSize: 14 },
});
