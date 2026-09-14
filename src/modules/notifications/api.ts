/**
 * Appels API du centre de notifications · lot A (Boris)
 */
import { api } from '../../socle/api/client'
import type { Notification } from '../../socle/modeles/administration'

export async function listerNotifications(nonLues?: boolean) {
  const { data } = await api.get<Notification[]>('/notifications', {
    params: nonLues === undefined ? {} : { isRead: !nonLues },
  })
  return data
}

export async function compterNonLues() {
  const { data } = await api.get<{ nombre: number }>('/notifications/unread-count')
  return data.nombre
}

export async function marquerLue(id: string) {
  await api.patch(`/notifications/${id}/read`)
}

export async function marquerToutesLues() {
  await api.patch('/notifications/read-all')
}
