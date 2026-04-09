import type { MemoryEntry } from '../types'

export const mockMemories: MemoryEntry[] = [
  {
    id: '1',
    title: 'O começo de tudo',
    happenedAt: '2023-08-12',
    createdAt: '2024-01-02T10:00:00.000Z',
    relatoDoDia: 'A primeira conversa que virou história. \n\n- risadas inesperadas\n- sensação de pertencimento\n- vontade de continuar',
    author: 'Suellen',
    photos: [
      { id: 'p1', url: 'https://images.unsplash.com/photo-1523438097201-512ae7d59c7d?auto=format&fit=crop&w=900&q=80', alt: 'casal caminhando ao entardecer' },
      { id: 'p2', url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80', alt: 'mãos dadas' },
      { id: 'p3', url: 'https://images.unsplash.com/photo-1518183214770-9cffbec72538?auto=format&fit=crop&w=900&q=80', alt: 'pôr do sol romântico' },
    ],
    audio: {
      kind: 'spotify',
      url: 'https://open.spotify.com/embed/track/0VjIjW4GlUZAMYd2vXMi3b',
    },
  },
  {
    id: '2',
    title: 'Um dia simples, mas perfeito',
    happenedAt: '2024-02-19',
    createdAt: '2024-02-19T22:00:00.000Z',
    relatoDoDia: 'Aquele tipo de dia que não precisa de muitos planos. Só presença, comida boa e uma música certa no momento certo.',
    author: 'Ronald',
    photos: [
      { id: 'p4', url: 'https://images.unsplash.com/photo-1478144592103-25e218a04891?auto=format&fit=crop&w=900&q=80', alt: 'mesa posta elegante' },
      { id: 'p5', url: 'https://images.unsplash.com/photo-1481931715705-36f5f79f1d74?auto=format&fit=crop&w=900&q=80', alt: 'cidade iluminada à noite' },
    ],
    audio: {
      kind: 'mp3',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    },
  },
]
