# 🚀 Deploy Firebase + Vercel + Domínio Customizado

## Arquitetura Final

```
seu-dominio.com → Vercel (Frontend React) → Firebase (Backend + Storage)
```

---

## PARTE 1: ATIVAR FIREBASE

### 1.1 Verificar Credenciais no `.env`

Abra: [Firebase Console](https://console.firebase.google.com)
- Selecione o projeto `livrodememorias`
- Vá para **⚙️ Configurações → Geral**
- Copie as credenciais para `.env`:

```env
VITE_FIREBASE_API_KEY=AIzaSyApafljuJ6O2i_KKpgf1ji9FkadPFOXYUI
VITE_FIREBASE_AUTH_DOMAIN=livrodememorias.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=livrodememorias
VITE_FIREBASE_STORAGE_BUCKET=livrodememorias.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1023980947557
VITE_FIREBASE_APP_ID=1:1023980947557:web:2c4683c262973117b7de8c
VITE_EDITOR_EMAIL_1=ronaldx563@gmail.com
VITE_EDITOR_EMAIL_2=suellen@example.com
```

### 1.2 Ativar Firebase no Código

Abra: `src/lib/firebase.ts`

Mude esta linha:
```typescript
export const firebaseAvailable = false // ❌ ANTES
```

Para esta:
```typescript
export const firebaseAvailable = hasFirebaseConfig // ✅ DEPOIS
```

### 1.3 Configurar Firestore Rules

No Firebase Console:
1. Vá para **Firestore Database → Regras**
2. Cole as regras abaixo:

```plaintext
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function isCoupleEditor() {
      return isSignedIn() && request.auth.token.email in [
        'ronaldx563@gmail.com',
        'suellen@example.com'
      ];
    }

    match /memories/{memoryId} {
      allow read: if true;
      allow create, update, delete: if isCoupleEditor();
    }

    match /{document=**} {
      allow read: if false;
      allow write: if false;
    }
  }
}
```

3. Clique em **Publicar**

### 1.4 Configurar Storage Rules

No Firebase Console:
1. Vá para **Storage → Regras**
2. Cole as regras abaixo:

```plaintext
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isSignedIn() {
      return request.auth != null;
    }

    function isCoupleEditor() {
      return isSignedIn() && request.auth.token.email in [
        'ronaldx563@gmail.com',
        'suellen@example.com'
      ];
    }

    match /memories/{memoryId}/{fileName} {
      allow read: if true;
      allow write: if isCoupleEditor();
    }
  }
}
```

3. Clique em **Publicar**

### 1.5 Testar Firebase Localmente

No terminal, execute:

```bash
npm run build
```

Depois acesse `http://localhost:5173` no navegador e:
1. Clique em **"Executar diagnóstico"**
2. Deverá aparecer:
   - ✅ Firestore: OK
   - ✅ Storage: OK

---

## PARTE 2: DEPLOY NA VERCEL

### 2.1 Criar Repositório Git (se não tiver)

```bash
cd c:\Users\ronald.xavier\Desktop\Livro_de_memorias
git init
git add .
git commit -m "Initial commit"
git branch -M main
```

### 2.2 Enviar para GitHub

1. Crie uma conta em [github.com](https://github.com)
2. Crie um novo repositório chamado `livro-de-memorias`
3. No terminal, execute:

```bash
git remote add origin https://github.com/SEU_USUARIO/livro-de-memorias.git
git push -u origin main
```

### 2.3 Conectar Vercel ao GitHub

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **"New Project"**
3. Selecione seu repositório `livro-de-memorias`
4. Configure:
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 2.4 Adicionar Variáveis de Ambiente na Vercel

No dashboard da Vercel:
1. Vá para **Settings → Environment Variables**
2. Adicione todas as variáveis do `.env`:

```
VITE_FIREBASE_API_KEY=AIzaSyApafljuJ6O2i_KKpgf1ji9FkadPFOXYUI
VITE_FIREBASE_AUTH_DOMAIN=livrodememorias.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=livrodememorias
VITE_FIREBASE_STORAGE_BUCKET=livrodememorias.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1023980947557
VITE_FIREBASE_APP_ID=1:1023980947557:web:2c4683c262973117b7de8c
VITE_EDITOR_EMAIL_1=ronaldx563@gmail.com
VITE_EDITOR_EMAIL_2=suellen@example.com
```

### 2.5 Deploy

Clique em **"Deploy"** e aguarde ~2-3 minutos.

Após completion, você vai ter um URL tipo:
```
https://livro-de-memorias.vercel.app
```

---

## PARTE 3: CONFIGURAR DOMÍNIO CUSTOMIZADO

### 3.1 Conectar Domínio na Vercel

No dashboard da Vercel:
1. Vá para **Settings → Domains**
2. Clique em **"Add Domain"**
3. Digite seu domínio (ex: `nossolivrodememorias.com.br`)
4. Copie os **DNS Records** fornecidos

### 3.2 Configurar DNS no Seu Provedor de Domínio

Acesse o painel do provedor onde você comprou o domínio (ex: Namecheap, GoDaddy, etc):

1. Procure por **DNS Settings** ou **Gerenciar DNS**
2. Adicione os registros fornecidos pela Vercel:
   - Tipo: `CNAME`
   - Name: (conforme Vercel especificar)
   - Value: (conforme Vercel especificar)

3. Salve as mudanças

⏳ **Espere 24-48h** para a propagação DNS completar.

### 3.3 Validar

1. Acesse seu domínio no navegador
2. Deverá carregar a app normalmente
3. Teste o Firebase:
   - Tente publicar uma memória
   - Verifique se foi salva no Firebase

---

## PARTE 4: TESTAR TUDO

### ✅ Testes Importantes

1. **Login funciona?**
   - Email: `ronaldx563@gmail.com`
   - Senha: (crie no Firebase Auth)

2. **Publicar memória?**
   - Imagem salva no Firebase Storage
   - Dados salvos no Firestore

3. **Fotos aparecem?**
   - WebP 4:5 está funcionando
   - Carregam rapidamente

4. **Spotify funciona?**
   - Player aparece ao publicar com link

5. **Editar/Deletar funciona?**
   - Memórias editadas sincronizam
   - Deletar remove do Firestore e Storage

---

## 🆘 TROUBLESHOOTING

### Problema: "Permission denied" ao publicar

**Solução**: Verifique as Firestore Rules. Certifique-se que tem:
- `isCoupleEditor()` definida com os emails corretos
- `allow create`: habilitado para criar memórias

### Problema: Fotos não carregam

**Solução**: Verifique Storage Rules:
- `allow read: if true;` garante acesso público para ler fotos
- `allow write: if isCoupleEditor();` garante apenas o casal pode enviar

### Problema: "Invalid API key"

**Solução**: Verifique se as variáveis de ambiente na Vercel estão corretas

### Problema: Domínio não funciona

**Solução**:
1. Aguarde 24-48h para propagação DNS
2. Limpe cache: `Ctrl+Shift+Delete`
3. Use `nslookup seu-dominio.com.br` para verificar DNS

---

## 📊 Estrutura Final

```
seu-dominio.com.br/
├── Timeline (memórias de Ronald e Suellen)
├── Painel do casal (criar/editar/deletar)
├── Fotos (WebP 4:5, Firebase Storage)
├── Spotify (melhor qualidade na nuvem)
└── Dados (Firestore real-time sync)
```

---

## 🎉 Próximos Passos

1. Ative Firebase no `firebase.ts`
2. Configure as rules (Firestore + Storage)
3. Faça `npm run build` localmente
4. Suba para GitHub
5. Deploy na Vercel
6. Aponte domínio
7. Teste tudo

Se algo der errado, avise e arrumo! 🚀
