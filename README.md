# 📍 CadastroVia — Frontend

App **React Native** com **Expo** para cadastro de usuários com endereço via CEP.  
Consome a API do backend e permite escolher em qual banco os dados são salvos: **SQLite**, **MongoDB** ou **ambos**.

---

## 📁 Estrutura do Projeto

```
/
├── App.js                        # Tela principal — formulário + lista
├── src/
│   └── components/
│       └── CepResult.js          # Componente que exibe o endereço encontrado
├── package.json
└── app.json
```

---


## ⚙️ Instalação

### 1. Instalar dependências

```bash
npm install
npx expo install expo-constants
```

## ▶️ Executar o app

```bash
npx expo start
```

Um QR Code será exibido no terminal. Abra o **Expo Go** no celular e escaneie.


---

## 📱 Como usar o app

### Selecionar o banco de dados

No topo da tela há três botões: **SQLite**, **MongoDB** e **Ambos**.  
O banco selecionado é enviado em todas as requisições ao backend via header `X-DB`.

### Cadastrar um usuário

1. Digite o **nome completo**
2. Digite o **CEP** (somente números) e toque em **Buscar**
3. O endereço é preenchido automaticamente — você pode editar qualquer campo
4. Preencha **Número** e **Complemento** se necessário
5. Toque em **Salvar**

### Editar um usuário

1. Toque no card do usuário na lista
2. No modal que abre, toque em **✏️ Editar**
3. Todos os campos ficam disponíveis para edição
4. Toque em **Atualizar**

### Deletar um usuário

1. Toque no card do usuário
2. No modal, toque em **🗑 Deletar**

---

