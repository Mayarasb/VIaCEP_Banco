// App.js
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, FlatList,
  TouchableOpacity, ActivityIndicator, StatusBar,
  KeyboardAvoidingView, Platform, ScrollView, Modal,
} from 'react-native';
import CepResult from './src/components/CepResult';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
// Troque pelo IP da sua máquina ao rodar no celular físico
const API_URL = 'http://192.168.1.18:3000';

const DB_OPTIONS = [
  { label: 'SQLite',  value: 'sqlite', cor: '#4F7FFA' },
  { label: 'MongoDB', value: 'mongo',  cor: '#4CAF82' },
  { label: 'Ambos',   value: 'both',   cor: '#9B59B6' },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
async function apiFetch(path, opts = {}, db = 'sqlite') {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'X-DB': db,
      ...(opts.headers || {}),
    },
  });
  return res.json();
}

// ─── COMPONENTES PEQUENOS ────────────────────────────────────────────────────
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
            style={[
              styles.dbBtn,
              value === opt.value && { backgroundColor: opt.cor, borderColor: opt.cor },
            ]}
          >
            <Text style={[styles.dbBtnText, value === opt.value && { color: '#fff' }]}>
              {opt.label}
            </Text>
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

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
  const [usuarios, setUsuarios]     = useState([]);
  const [nome, setNome]             = useState('');
  const [cepInput, setCepInput]     = useState('');
  const [cep, setCep]               = useState({});
  const [db, setDb]                 = useState('sqlite');
  const [editando, setEditando]     = useState(null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [msg, setMsg]               = useState({ texto: '', cor: '#e74c3c' });
  const [modalItem, setModalItem]   = useState(null);

  useEffect(() => { carregarUsuarios(); }, [db]);

  function falar(texto, cor = '#e74c3c') {
    setMsg({ texto, cor });
    setTimeout(() => setMsg({ texto: '', cor: '#e74c3c' }), 3000);
  }

  async function carregarUsuarios() {
    try {
      const data = await apiFetch('/usuarios', {}, db);
      // db=both retorna { sqlite: [...], mongo: [...] }
      if (Array.isArray(data)) setUsuarios(data);
      else setUsuarios([
        ...(data.sqlite || []).map(u => ({ ...u, _origem: 'sqlite' })),
        ...(data.mongo  || []).map(u => ({ ...u, _origem: 'mongo'  })),
      ]);
    } catch {
      falar('⚠️ Não foi possível conectar ao servidor.');
    }
  }

  async function buscarCep() {
    const limpo = cepInput.replace(/\D/g, '');
    if (limpo.length !== 8) { falar('⚠️ CEP deve ter 8 dígitos.'); return; }
    setLoadingCep(true);
    try {
      const data = await apiFetch(`/cep/${limpo}`, {}, db);
      if (data.erro) { falar('⚠️ CEP não encontrado.'); setCep({}); }
      else { setCep(data); falar('✅ CEP encontrado!', '#27ae60'); }
    } catch { falar('⚠️ Falha ao buscar CEP.'); }
    finally { setLoadingCep(false); }
  }

  function validar() {
    if (!nome.trim())          { falar('⚠️ Digite o nome.'); return false; }
    if (nome.trim().length < 2){ falar('⚠️ Nome muito curto.'); return false; }
    if (cepInput.replace(/\D/g,'').length !== 8)
                               { falar('⚠️ CEP deve ter 8 dígitos.'); return false; }
    if (!editando && !cep.logradouro)
                               { falar('⚠️ Busque o CEP antes de salvar.'); return false; }
    return true;
  }

  async function handleSalvar() {
    if (!validar()) return;
    setLoadingSave(true);
    try {
      if (editando) {
        await apiFetch(`/usuarios/${editando}`, {
          method: 'PUT',
          body: JSON.stringify({ nome: nome.trim(), cep: cepInput }),
        }, db);
        falar('✅ Usuário atualizado!', '#27ae60');
      } else {
        await apiFetch('/usuarios', {
          method: 'POST',
          body: JSON.stringify({ nome: nome.trim(), cep: cepInput }),
        }, db);
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
    setNome(item.nome);
    setCepInput(item.cep);
    setCep({
      logradouro: item.logradouro,
      bairro:     item.bairro,
      localidade: item.cidade,
      estado:     item.estado,
    });
    setModalItem(null);
    falar('✏️ Editando usuário...', '#e67e22');
  }

  function limpar() {
    setNome(''); setCepInput(''); setCep({}); setEditando(null);
  }

  const dbAtual = DB_OPTIONS.find(d => d.value === db) || DB_OPTIONS[0];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f4f6fb' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#f4f6fb" />

      {/* ── Formulário fixo (fora do FlatList para não perder foco) ── */}
      <ScrollView
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📍 CadastroVia</Text>
          <Text style={styles.headerSub}>CEP + banco de dados</Text>
        </View>

        <Mensagem texto={msg.texto} cor={msg.cor} />

        <DbSelector value={db} onChange={setDb} />

        <View style={[styles.card, editando && styles.cardEditando]}>
          <Text style={styles.secaoTitulo}>
            {editando ? '✏️ Editando usuário' : '+ Novo usuário'}
          </Text>

          <TextInput
            placeholder="Nome completo"
            value={nome}
            onChangeText={setNome}
            style={styles.input}
            placeholderTextColor="#aaa"
          />

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
            <TouchableOpacity
              style={[styles.btnBuscar, loadingCep && { opacity: 0.6 }]}
              onPress={buscarCep}
              disabled={loadingCep}
            >
              {loadingCep
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.btnBuscarText}>Buscar</Text>}
            </TouchableOpacity>
          </View>

          <CepResult cep={cep} />

          <View style={styles.botoesForm}>
            <TouchableOpacity
              style={[styles.btnSalvar, { backgroundColor: editando ? '#e67e22' : dbAtual.cor }, loadingSave && { opacity: 0.6 }]}
              onPress={handleSalvar}
              disabled={loadingSave}
            >
              {loadingSave
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.btnSalvarText}>{editando ? 'Atualizar' : 'Salvar'}</Text>}
            </TouchableOpacity>

            {editando && (
              <TouchableOpacity style={styles.btnCancelar} onPress={limpar}>
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {usuarios.length > 0 && (
          <Text style={styles.secaoTitulo}>👥 Cadastrados ({usuarios.length})</Text>
        )}
      </ScrollView>

      {/* ── Lista separada do formulário ── */}
      <FlatList
        data={usuarios}
        keyExtractor={(item, i) => (item._id?.toString() || i.toString())}
        renderItem={({ item }) => {
          const origem = item._origem || db;
          const cor = DB_OPTIONS.find(d => d.value === origem)?.cor || dbAtual.cor;
          return (
            <TouchableOpacity
              style={styles.usuarioCard}
              onPress={() => setModalItem(item)}
              activeOpacity={0.75}
            >
              <View style={[styles.usuarioFaixa, { backgroundColor: cor }]} />
              <View style={styles.usuarioConteudo}>
                <View style={styles.usuarioTopoRow}>
                  <Text style={styles.usuarioNome}>{item.nome}</Text>
                  <Tag label={origem} cor={cor} />
                </View>
                <Text style={styles.usuarioCep}>CEP {item.cep}</Text>
                <Text style={styles.usuarioEndereco}>
                  {item.logradouro}{item.bairro ? `, ${item.bairro}` : ''}
                </Text>
                <Text style={styles.usuarioCidade}>{item.cidade} — {item.estado}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.vazio}>Nenhum usuário cadastrado ainda.</Text>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      />

      {/* Modal de ações */}
      <Modal visible={!!modalItem} transparent animationType="fade" onRequestClose={() => setModalItem(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalItem(null)}>
          <View style={styles.modalBox}>
            <Text style={styles.modalNome}>{modalItem?.nome}</Text>
            <Text style={styles.modalInfo}>{modalItem?.logradouro}, {modalItem?.bairro}</Text>
            <Text style={styles.modalInfo}>{modalItem?.cidade} — {modalItem?.estado}</Text>
            <Text style={styles.modalInfo}>CEP: {modalItem?.cep}</Text>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#e67e22' }]}
                onPress={() => handleEditar(modalItem)}
              >
                <Text style={styles.modalBtnText}>✏️ Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#e74c3c' }]}
                onPress={() => handleDeletar(modalItem._id)}
              >
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
  container: {
    paddingHorizontal: 18,
    paddingTop: 52,
    backgroundColor: '#f4f6fb',
  },

  // Header
  header: { marginBottom: 20 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#1a1d2e', letterSpacing: -0.5 },
  headerSub:   { fontSize: 13, color: '#8a92a6', marginTop: 2 },

  // Mensagem
  mensagemBox: {
    borderLeftWidth: 3, borderRadius: 8,
    paddingVertical: 10, paddingHorizontal: 14,
    marginBottom: 14,
  },
  mensagemTexto: { fontSize: 13, fontWeight: '600' },

  // Seletor de banco
  dbRow: { marginBottom: 16 },
  dbLabel: { fontSize: 11, fontWeight: '700', color: '#8a92a6', letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase' },
  dbBtns: { flexDirection: 'row', gap: 8 },
  dbBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#dde2ee',
    alignItems: 'center', backgroundColor: '#fff',
  },
  dbBtnText: { fontSize: 13, fontWeight: '700', color: '#8a92a6' },

  // Card formulário
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    shadowColor: '#1a1d2e',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardEditando: { borderWidth: 1.5, borderColor: '#e67e2255' },
  secaoTitulo: { fontSize: 15, fontWeight: '700', color: '#1a1d2e', marginBottom: 14 },

  // Inputs
  input: {
    borderWidth: 1.5, borderColor: '#e8eaf0', borderRadius: 10,
    padding: 12, fontSize: 14, color: '#1a1d2e',
    backgroundColor: '#f9fafc', marginBottom: 10,
  },
  cepRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },

  // Botão buscar CEP
  btnBuscar: {
    backgroundColor: '#4F7FFA', borderRadius: 10,
    paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center',
    minWidth: 78,
  },
  btnBuscarText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Botões do form
  botoesForm: { flexDirection: 'row', gap: 10, marginTop: 6 },
  btnSalvar: {
    flex: 1, paddingVertical: 13, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  btnSalvarText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  btnCancelar: {
    paddingVertical: 13, paddingHorizontal: 18, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#dde2ee', alignItems: 'center', justifyContent: 'center',
  },
  btnCancelarText: { color: '#8a92a6', fontWeight: '600', fontSize: 14 },

  // Cards de usuário
  usuarioCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 18,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#1a1d2e',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  usuarioFaixa: { width: 4 },
  usuarioConteudo: { flex: 1, padding: 14 },
  usuarioTopoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  usuarioNome:    { fontSize: 15, fontWeight: '700', color: '#1a1d2e', flex: 1, marginRight: 8 },
  usuarioCep:     { fontSize: 11, color: '#8a92a6', marginBottom: 2, fontWeight: '600' },
  usuarioEndereco:{ fontSize: 13, color: '#454d66' },
  usuarioCidade:  { fontSize: 12, color: '#8a92a6', marginTop: 1 },

  // Tag db
  tag: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  tagText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Vazio
  vazio: {
    textAlign: 'center', color: '#adb5bd',
    fontSize: 14, marginTop: 30, marginHorizontal: 18,
  },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: '#00000055',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 36,
  },
  modalNome:  { fontSize: 20, fontWeight: '800', color: '#1a1d2e', marginBottom: 6 },
  modalInfo:  { fontSize: 13, color: '#8a92a6', marginBottom: 2 },
  modalBtns:  { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 12 },
  modalBtn:   { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalFechar:{ textAlign: 'center', color: '#8a92a6', fontWeight: '600', fontSize: 14 },
});
