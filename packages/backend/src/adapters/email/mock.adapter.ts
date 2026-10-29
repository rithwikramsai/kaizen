import type { EmailAdapter, SendEmailOptions } from './index.js'

export class MockEmailAdapter implements EmailAdapter {
  async send(opts: SendEmailOptions): Promise<void> {
    console.info(`[MockEmail] To: ${opts.to} | Subject: ${opts.subject}`)
  }
}
