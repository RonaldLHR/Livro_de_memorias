# ⚡ GUIA RÁPIDO: Firebase + Vercel (5 passos)

## PASSO 1: Ativar Firebase

Abra: `src/lib/firebase.ts`

**Mude esta linha:**
```typescript
export const firebaseAvailable = false
```

**Para esta:**
```typescript
export const firebaseAvailable = hasFirebaseConfig
```

**Salve o arquivo.**

---

## PASSO 2: Compilar

No terminal:
```bash
npm run build
```

Deve aparecer: `✓ built in X.XXs`

---

## PASSO 3: Configurar Firebase Console

### Firestore Rules

[Clique aqui → Firebase Console](https://console.firebase.google.com)

1. Selecione projeto `livrodememorias`
2. **Firestore Database → Regras**
3. Delete tudo e cole isto:

```
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

4. Clique **"Publicar"**

### Storage Rules

1. **Storage → Regras**
2. Delete tudo e cole isto:

```
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

3. Clique **"Publicar"**

---

## PASSO 4: Criar Senha no Firebase Auth

1. Firebase Console → **Authentication → Users**
2. Clique em **"Add User"**
3. Adicione:
   - Email: `ronaldx563@gmail.com`
   - Senha: (crie uma forte)
4. Clique **"Create User"**

5. Repita para Suellen (se quiser):
   - Email: `suellen@example.com`
   - Senha: (crie uma)

---

## PASSO 5: Testar Localmente

1. Recarregue a página no navegador
2. Clique em **"Entrar no painel"**
3. Use:
   - Email: `ronaldx563@gmail.com`
   - Senha: (a que você criou)
4. Clique **"Entrar"**

Se entrar com sucesso → ✅ Firebase está funcionando!

---

## PRÓXIMO: Deploy na Vercel

Quando estiver tudo testando localmente, avise que vou ajudar com:

1. **GitHub** (upload do código)
2. **Vercel** (deploy automático)
3. **Domínio** customizado (seu-dominio.com.br)

---

## 🆘 Dúvidas?

Se algo não funcionar, avise a mensagem de erro exata que aparece na tela ou no console (F12).
