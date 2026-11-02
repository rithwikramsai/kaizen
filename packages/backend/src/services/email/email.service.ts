import { pool } from '../../config/database.js'
import { getEmailAdapter } from '../../adapters/email/factory.js'
import { renderTemplate, type EmailEvent, type TemplateContext } from './templates.js'

export type { EmailEvent }

export async function sendEmailForEvent(
  event: EmailEvent,
  recipientId: string,
  ctx?: Omit<TemplateContext, 'recipientName'>,
): Promise<void> {
  try {
    const res = await pool.query<{ email: string; full_name: string }>(
      `SELECT email, full_name FROM users WHERE id = $1 AND is_active = TRUE`,
      [recipientId],
    )
    const user = res.rows[0]
    if (!user?.email) return

    const template = renderTemplate(event, { ...ctx, recipientName: user.full_name })
    await getEmailAdapter().send({ to: user.email, subject: template.subject, body: template.body })
  } catch (err) {
    console.error(`[EmailService] Failed to send ${event} to ${recipientId}:`, err)
  }
}
