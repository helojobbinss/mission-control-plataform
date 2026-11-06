import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { type Task } from '../data/schema'

type Comment = { id: number; author: string; body: string; created_at: string }
type MissionDetail = { description: string | null; comments: Comment[] }

export function MissionDetails({ mission, onClose }: { mission: Task; onClose: () => void }) {
  const [author, setAuthor] = useState('')
  const [body, setBody] = useState('')
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['mission', mission.id],
    queryFn: async () => (await axios.get<MissionDetail>(`/api/missions/${mission.id}`)).data,
  })
  const add = useMutation({
    mutationFn: () => axios.post(`/api/missions/${mission.id}/comments`, { author: author.trim(), body: body.trim() }),
    onSuccess: async () => { setBody(''); await queryClient.invalidateQueries({ queryKey: ['mission', mission.id] }) },
    onError: () => toast.error('Não foi possível salvar o comentário.'),
  })
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader><DialogTitle>{mission.title}</DialogTitle><DialogDescription>Missão #{mission.id} · {mission.status}</DialogDescription></DialogHeader>
        <p className='text-sm'><strong>Satélite:</strong> {mission.satellite_name || '—'}</p>
        <section><h3 className='mb-2 font-semibold'>Descrição</h3><p className='whitespace-pre-wrap text-sm'>{data?.description || 'Sem descrição.'}</p></section>
        <section className='text-sm'><h3 className='font-semibold'>Orçamento</h3><p>{mission.budget ? Number(mission.budget).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Não informado'}</p></section>
        <section className='text-sm space-y-1'>
          <h3 className='font-semibold'>Período</h3>
          <p>Planejado: {mission.planned_start_date?.split('-').reverse().join('/') || '—'} até {mission.planned_end_date?.split('-').reverse().join('/') || '—'}</p>
          <p>Início real: {mission.started_at ? new Date(mission.started_at).toLocaleString('pt-BR') : '—'}</p>
          <p>Encerramento real: {mission.ended_at ? new Date(mission.ended_at).toLocaleString('pt-BR') : '—'}</p>
        </section>
        <section className='space-y-3'>
          <h3 className='font-semibold'>Comentários</h3>
          {isLoading && <p>Carregando comentários...</p>}
          {isError && <p>Não foi possível carregar os detalhes.</p>}
          {data?.comments.length === 0 && <p className='text-sm text-muted-foreground'>Nenhum comentário ainda.</p>}
          {data?.comments.map((comment) => <div key={comment.id} className='rounded-lg border p-3'><div className='text-sm font-semibold'>{comment.author}</div><p className='whitespace-pre-wrap text-sm'>{comment.body}</p><time className='text-xs text-muted-foreground'>{new Date(comment.created_at).toLocaleString('pt-BR')}</time></div>)}
          <form className='space-y-2' onSubmit={(event) => { event.preventDefault(); if (author.trim() && body.trim()) add.mutate() }}>
            <Input aria-label='Seu nome' placeholder='Seu nome' maxLength={100} value={author} onChange={(event) => setAuthor(event.target.value)} required />
            <Textarea aria-label='Comentário' placeholder='Escreva um comentário' maxLength={5000} value={body} onChange={(event) => setBody(event.target.value)} required />
            <Button type='submit' disabled={add.isPending || !author.trim() || !body.trim()}>Adicionar comentário</Button>
          </form>
        </section>
      </DialogContent>
    </Dialog>
  )
}
