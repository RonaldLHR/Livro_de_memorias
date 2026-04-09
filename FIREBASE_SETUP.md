# 🔥 Como Ativar Firebase

## Status Atual
- **Modo**: Offline (localStorage)
- **Memórias salvas em**: Seu navegador (não perdem ao recarregar)
- **Firebase**: Desabilitado (não está funcionando)

---

## Para Ativar Firebase (Guardar memórias na nuvem)

### 1️⃣ Verificar Credenciais no `.env`

Abra o arquivo `.env` na raiz do projeto e verifique se tem:

```env
VITE_FIREBASE_API_KEY=AIzaSyApafljuJ6O2i_KKpgf1ji9FkadPFOXYUI
VITE_FIREBASE_AUTH_DOMAIN=livrodememorias.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=livrodememorias
VITE_FIREBASE_STORAGE_BUCKET=livrodememorias.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1023980947557
VITE_FIREBASE_APP_ID=1:1023980947557:web:2c4683c262973117b7de8c
```

✅ Se **todas** estão preenchidas → ir para passo 2
❌ Se **alguma** está vazia → entrar no console do Firebase e copiar (veja passo 3)

### 2️⃣ Ativar Firebase no Código

Abra: `src/lib/firebase.ts`

Na linha que diz:
```typescript
export const firebaseAvailable = false // Mude para hasFirebaseConfig quando Firebase funcionar
```

Mude para:
```typescript
export const firebaseAvailable = hasFirebaseConfig
```

### 3️⃣ Recompilar

No terminal, execute:
```bash
npm run build
```

Após isso, **recarregue a página** no navegador.

---

## Se Firebase Ainda Não Funcionar

### Problema: "Erro de autenticação"

**Solução**: As Firestore Rules e Storage Rules precisam estar configuradas corretamente.

#### Firestore Rules (Console do Firebase)
Vá para: **Firestore → Regras**

```plaintext
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /memories/{memoryId} {
      allow read: if true;
      allow create, update, delete: if true;
    }
  }
}
```

#### Storage Rules (Console do Firebase)
Vá para: **Storage → Regras**

```plaintext
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /memories/{memoryId}/{fileName} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

### Problema: "Credenciais inválidas"

1. Abra [Firebase Console](https://console.firebase.google.com)
2. Selecione o projeto `livrodememorias`
3. Vá para **Configurações → Geral**
4. Copie as credenciais para o `.env`
5. Execute `npm run build` novamente

---

## ✅ Como Saber se Firebase Está Funcionando

- **Mensagem desaparece**: Não vai mais aparecer "Modo Offline"
- **Botão de diagnóstico**: Clique em "Executar diagnóstico" → deve mostrar Firestore: OK
- **Memórias persistem offline**: As memórias serão salvas na nuvem Firebase

---

## Resumo

| Modo | Onde guarda | Sincroniza? | Persiste ao trocar PC? |
|------|------------|-----------|----------------------|
| **Offline (atual)** | localStorage do navegador | Não | Não |
| **Firebase** | Nuvem Google Firebase | Sim | Sim |

