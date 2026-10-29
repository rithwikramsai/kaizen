import http from 'http'
import { env } from '../../config/env.js'
import type { EmailAdapter, SendEmailOptions } from './index.js'

export class MailhogEmailAdapter implements EmailAdapter {
  async send(opts: SendEmailOptions): Promise<void> {
    const message = [
      `From: kiet@acg.com`,
      `To: ${opts.to}`,
      `Subject: ${opts.subject}`,
      ``,
      opts.body,
    ].join('\r\n')

    await new Promise<void>((resolve, reject) => {
      const req = http.request(
        {
          host: env.MAILHOG_HOST,
          port: env.MAILHOG_PORT,
          path: '/api/v2/messages',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        (res) => {
          res.resume()
          res.on('end', resolve)
        },
      )
      req.on('error', reject)
      req.write(
        JSON.stringify({
          From: { Email: 'kiet@acg.com', Name: 'KIET' },
          To: [{ Email: opts.to }],
          Subject: opts.subject,
          TextPart: opts.body,
        }),
      )
      req.end()
    })

    void message
  }
}
