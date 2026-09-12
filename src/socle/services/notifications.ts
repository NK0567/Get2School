/**
 * Declenchement de notifications depuis un evenement metier · PROPRIETAIRE : Boris
 */
import { api } from '../api/client'

export interface DemandeNotification {
  recipientUserId: string
  type: string
  title: string
  body: string
  linkRoute?: string
}

export async function notifier(demande: DemandeNotification) {
  try {
    await api.post('/notifications', demande)
  } catch {
    // silencieux : une notification perdue ne bloque pas l'action
  }
}
