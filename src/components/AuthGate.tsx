import { type FormEvent, useState } from 'react'
import { LockKeyhole } from 'lucide-react'

type AuthGateProps = {
  onLogin: (email: string, password: string) => Promise<void>
  loading?: boolean
}

export function AuthGate({ onLogin, loading }: AuthGateProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onLogin(email, password)
  }

  return (
    <section className="rounded-[2rem] bg-white/80 p-5 shadow-soft ring-1 ring-black/5 md:p-7">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-blush-100 p-3 text-blush-700">
          <LockKeyhole size={18} />
        </div>
        <div>
          <h2 className="font-serif text-2xl text-stone-900">Entrar no painel</h2>
          <p className="text-sm text-stone-500">Acesso restrito ao casal</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4">
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-blush-500"
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Senha"
          className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-blush-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-fit items-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </section>
  )
}