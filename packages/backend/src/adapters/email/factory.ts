import { env } from '../../config/env.js'
import type { EmailAdapter } from './index.js'
import { MockEmailAdapter } from './mock.adapter.js'
import { MailhogEmailAdapter } from './mailhog.adapter.js'
import { SmtpEmailAdapter } from './smtp.adapter.js'

let _adapter: EmailAdapter | null = null

export function getEmailAdapter(): EmailAdapter {
  if (_adapter) return _adapter
  switch (env.EMAIL_ADAPTER) {
    case 'mailhog':
      _adapter = new MailhogEmailAdapter()
      break
    case 'smtp':
      _adapter = new SmtpEmailAdapter()
      break
    default:
      _adapter = new MockEmailAdapter()
  }
  return _adapter
}
