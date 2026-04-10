import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, LockKeyhole, Sparkles } from 'lucide-react'
import { AdminPanel } from './components/AdminPanel'
import { AuthGate } from './components/AuthGate'
import { TimelineCard } from './components/TimelineCard'
import { auth } from './lib/firebase'
import { deleteMemory, publishMemory, runRuntimeDiagnostics, updateMemory, type MemoryFormInput } from './lib/memoryService'
import {
  deleteMemory as deleteMemoryOffline,
  publishMemory as publishMemoryOffline,
  updateMemory as updateMemoryOffline,
  runRuntimeDiagnostics as runDiagnosticsOffline,
  getAllMemories,
} from './lib/offlineMemoryService'
import { mockMemories } from './lib/mockMemories'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db, firebaseAvailable } from './lib/firebase'
import type { MemoryEntry } from './types'

const allowedEditorEmails = [import.meta.env.VITE_EDITOR_EMAIL_1, import.meta.env.VITE_EDITOR_EMAIL_2]
  .map((email) => email?.trim().toLowerCase())
  .filter(Boolean) as string[]

function isAllowedEditorEmail(email?: string | null) {
  return Boolean(email && allowedEditorEmails.includes(email.trim().toLowerCase()))
}

function formatActionError(error: unknown) {
  if (error instanceof Error) {
    if ('code' in error) {
      const firebaseError = error as { code?: string; message?: string }
      return `Erro Firebase: ${firebaseError.code ?? 'desconhecido'}${firebaseError.message ? ` - ${firebaseError.message}` : ''}`
    }

    return error.message
  }

  return 'Ocorreu um erro inesperado.'
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [memories, setMemories] = useState([...mockMemories])
  const [loadingMemories, setLoadingMemories] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [authLoading, setAuthLoading] = useState(false)
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionErrorDetails, setActionErrorDetails] = useState<string | null>(null)
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false)
  const [diagnosticsReport, setDiagnosticsReport] = useState<string[]>([])

  function setRuntimeError(context: string, error: unknown) {
    const formatted = formatActionError(error)
    const details =
      error instanceof Error
        ? `${context}\nname: ${error.name}\nmessage: ${error.message}\nstack: ${error.stack ?? 'sem stack'}`
        : `${context}\nvalor: ${String(error)}`

    setActionError(`${context}: ${formatted}`)
    setActionErrorDetails(details)
    console.error(`[NossoLivro] ${context}`, error)
  }

  const canEdit = !firebaseAvailable || isAllowedEditorEmail(user?.email)

  useEffect(() => {
    if (!firebaseAvailable) {
      setUser(null)
      setAuthMessage(null)
      return
    }

    const activeAuth = auth

    if (!activeAuth) {
      setAuthMessage('Firebase Auth não está disponível neste ambiente.')
      return
    }

    return onAuthStateChanged(activeAuth, (currentUser) => {
      setUser(currentUser)

      if (currentUser && !isAllowedEditorEmail(currentUser.email)) {
        setAuthMessage('Este acesso não está autorizado para editar o livro.')
        void signOut(activeAuth)
      } else {
        setAuthMessage(null)
      }
    })
  }, [firebaseAvailable])

  useEffect(() => {
    if (!firebaseAvailable) {
      // Modo offline - carregar do localStorage
      getAllMemories()
        .then((offlineMemories) => {
          setMemories(offlineMemories.length > 0 ? offlineMemories : mockMemories)
          setLoadingMemories(false)
        })
        .catch(() => {
          setMemories(mockMemories)
          setLoadingMemories(false)
        })
      return
    }

    if (!db) {
      setMemories(mockMemories)
      setLoadingMemories(false)
      return
    }

    const unsubscribe = onSnapshot(
      query(collection(db, 'memories'), orderBy('happenedAt', 'desc')),
      (snapshot) => {
        const remoteMemories = snapshot.docs.map((doc) => {
          const data = doc.data() as {
            title?: string
            happenedAt?: string
            createdAt?: { toDate?: () => Date } | string | null
            relatoDoDia?: string
            photos?: typeof mockMemories[number]['photos']
            video?: { url: string } | null
            audio?: typeof mockMemories[number]['audio']
            author?: 'Ronald' | 'Suellen'
          }

          const createdAt =
            typeof data.createdAt === 'string'
              ? data.createdAt
              : data.createdAt?.toDate?.().toISOString() ?? new Date().toISOString()

          return {
            id: doc.id,
            title: data.title ?? '',
            happenedAt: data.happenedAt ?? new Date().toISOString(),
            createdAt,
            relatoDoDia: data.relatoDoDia ?? '',
            photos: data.photos ?? [],
            video: data.video ?? undefined,
            audio: data.audio ?? undefined,
            author: data.author ?? 'Ronald',
          }
        })

        setMemories(remoteMemories)
        setLoadingMemories(false)
      },
      async (error) => {
        setActionError(`Firebase indisponível: ${formatActionError(error)}. Usando modo local.`)
        try {
          const offlineMemories = await getAllMemories()
          setMemories(offlineMemories.length > 0 ? offlineMemories : mockMemories)
        } catch {
          setMemories(mockMemories)
        }
        setLoadingMemories(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const timeline = useMemo(
    () => [...memories].sort((a, b) => new Date(b.happenedAt).getTime() - new Date(a.happenedAt).getTime()),
    [memories]
  )

  async function handleLogin(email: string, password: string) {
    if (!auth) {
      return
    }

    setAuthLoading(true)
    setAuthMessage(null)
    setActionMessage(null)
    setActionError(null)
    setActionErrorDetails(null)
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password)

      if (!isAllowedEditorEmail(credential.user.email)) {
        await signOut(auth)
        setAuthMessage('Conta não permitida. Use o email de Ronald ou Suellen.')
      }
    } catch (error) {
      setRuntimeError('Falha no login', error)
    } finally {
      setAuthLoading(false)
    }
  }

  async function handlePublish(payload: MemoryFormInput) {
    setPublishing(true)
    setUploadProgress(0)
    setActionMessage(null)
    setActionError(null)
    setActionErrorDetails(null)

    if (firebaseAvailable && !user) {
      setPublishing(false)
      setRuntimeError('Falha ao publicar memória', new Error('Faça login para publicar no Firebase.'))
      return
    }

    try {
      const newMemory = firebaseAvailable
        ? await publishMemory(payload, setUploadProgress)
        : await publishMemoryOffline(payload, setUploadProgress)

      setMemories((current) => [newMemory, ...current])
      setActionMessage(firebaseAvailable ? 'Memória publicada com sucesso no Firebase.' : 'Memória publicada no modo local.')
    } catch (error) {
      setRuntimeError('Falha ao publicar memória', error)
      throw error
    } finally {
      setPublishing(false)
    }
  }

  async function handleUpdate(memoryId: string, payload: MemoryFormInput) {
    setPublishing(true)
    setUploadProgress(0)
    setActionMessage(null)
    setActionError(null)
    setActionErrorDetails(null)

    if (firebaseAvailable && !user) {
      setPublishing(false)
      setRuntimeError('Falha ao atualizar memória', new Error('Faça login para atualizar no Firebase.'))
      return
    }

    try {
      const previousMemory = memories.find((memory) => memory.id === memoryId)

      if (!previousMemory) {
        return
      }

      const updated = firebaseAvailable
        ? await updateMemory(memoryId, payload, previousMemory, setUploadProgress)
        : await updateMemoryOffline(memoryId, payload, previousMemory, setUploadProgress)
      setMemories((current) => current.map((memory) => (memory.id === memoryId ? updated : memory)))
      setActionMessage(firebaseAvailable ? 'Memória atualizada com sucesso no Firebase.' : 'Memória atualizada no modo local.')
    } catch (error) {
      setRuntimeError('Falha ao atualizar memória', error)
      throw error
    } finally {
      setPublishing(false)
    }
  }

  async function handleDelete(memoryId: string) {
    setPublishing(true)
    setUploadProgress(0)
    setActionMessage(null)
    setActionError(null)
    setActionErrorDetails(null)

    if (firebaseAvailable && !user) {
      setPublishing(false)
      setRuntimeError('Falha ao excluir memória', new Error('Faça login para excluir no Firebase.'))
      return
    }

    try {
      const service = firebaseAvailable ? deleteMemory : deleteMemoryOffline
      await service(memoryId)
      setMemories((current) => current.filter((memory) => memory.id !== memoryId))
      setActionMessage(firebaseAvailable ? 'Memória excluída com sucesso no Firebase.' : 'Memória excluída no modo local.')
    } catch (error) {
      setRuntimeError('Falha ao excluir memória', error)
      throw error
    } finally {
      setPublishing(false)
    }
  }

  async function handleRunDiagnostics() {
    setDiagnosticsLoading(true)
    setDiagnosticsReport([])

    try {
      const service = firebaseAvailable ? runRuntimeDiagnostics : runDiagnosticsOffline
      const report = await service()
      setDiagnosticsReport(report)
    } finally {
      setDiagnosticsLoading(false)
    }
  }

  return (
    <main className="min-h-screen">
      <header className="mx-auto max-w-6xl px-4 pb-10 pt-8 md:px-8 md:pt-12">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
          <div>
            {!firebaseAvailable ? (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                📱 <strong>Modo Offline:</strong> Você está usando a app em modo local. Suas memórias serão salvas no seu navegador. Para sincronizar com a nuvem, configure as credenciais do Firebase corretamente.
              </div>
            ) : null}
            {authMessage ? (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {authMessage}
              </div>
            ) : null}
            {actionError ? (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {actionError}
                {actionErrorDetails ? (
                  <details className="mt-2 text-xs">
                    <summary className="cursor-pointer font-medium">Ver detalhes técnicos</summary>
                    <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-rose-100/70 p-2 text-[11px] text-rose-800">
                      {actionErrorDetails}
                    </pre>
                  </details>
                ) : null}
              </div>
            ) : null}
            {actionMessage ? (
              <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {actionMessage}
              </div>
            ) : null}
            <div className="inline-flex items-center gap-2 rounded-full border border-blush-200 bg-white/70 px-4 py-2 text-sm text-blush-700 shadow-sm backdrop-blur">
              <Sparkles size={16} />
              Nosso Livro de Memórias
            </div>

            <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-none text-stone-900 md:text-7xl">
              Suellen & Ronald
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600 md:text-lg">
              Uma linha do tempo viva, íntima e eterna para registrar momentos, fotos, relatos e músicas que marcaram a história do casal.
            </p>
          </div>

          <div className="rounded-[2rem] bg-white/70 p-5 shadow-soft ring-1 ring-black/5 backdrop-blur">
            <div className="flex items-center gap-3 text-stone-700">
              <div className="rounded-2xl bg-blush-100 p-3 text-blush-700">
                <Heart size={20} />
              </div>
              <div>
                <p className="text-sm font-medium">Timeline eterna</p>
                <p className="text-sm text-stone-500">Scroll vertical com animações suaves</p>
              </div>
            </div>

            <div className="mt-4 rounded-3xl bg-stone-950 px-4 py-3 text-sm text-stone-100">
              <div className="flex items-center gap-2 text-blush-200">
                <LockKeyhole size={14} />
                Acesso restrito ao casal
              </div>
              <p className="mt-2 text-stone-300">
                Login via Firebase Auth com permissões controladas no Firestore Rules.
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-12 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          {canEdit ? (
            <div className="grid gap-4">
              <AdminPanel
                canEdit={canEdit}
                memories={timeline as MemoryEntry[]}
                onPublish={handlePublish}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onRunDiagnostics={handleRunDiagnostics}
                loading={publishing}
                diagnosticsLoading={diagnosticsLoading}
                diagnosticsReport={diagnosticsReport}
                uploadProgress={uploadProgress}
              />
              {firebaseAvailable ? (
                <button
                  type="button"
                  onClick={() => auth && void signOut(auth)}
                  className="w-fit rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-700 transition hover:bg-white"
                >
                  Sair
                </button>
              ) : null}
            </div>
          ) : (
            <AuthGate onLogin={handleLogin} loading={authLoading} />
          )}

          <div className="relative pl-5 md:pl-7">
            <div className="absolute left-2 top-0 h-full w-px bg-gradient-to-b from-blush-200 via-blush-500/40 to-transparent md:left-3" />
            <div className="mb-4 text-sm text-stone-500">
              {loadingMemories ? 'Carregando memórias...' : `${timeline.length} memórias registradas`}
            </div>
            <div className="space-y-6">
              {timeline.map((entry) => (
                <TimelineCard key={entry.id} entry={entry} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mx-auto max-w-6xl px-4 pb-10 text-center text-sm text-stone-500 md:px-8"
      >
        Feito para crescer com novas memórias, novas fotos e novas músicas.
      </motion.footer>
    </main>
  )
}
