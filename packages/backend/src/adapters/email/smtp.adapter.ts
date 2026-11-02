import * as net from 'net'
import * as readline from 'readline'
import { env } from '../../config/env.js'
import type { EmailAdapter, SendEmailOptions } from './index.js'

export class SmtpEmailAdapter implements EmailAdapter {
  async send(opts: SendEmailOptions): Promise<void> {
    const host = env.SMTP_HOST ?? 'localhost'
    const port = env.SMTP_PORT ?? 587
    const user = env.SMTP_USER ?? ''
    const pass = env.SMTP_PASS ?? ''
    const from = env.SMTP_FROM ?? `noreply@${host}`

    return new Promise((resolve, reject) => {
      const socket = net.createConnection({ host, port })
      const rl = readline.createInterface({ input: socket, crlfDelay: Infinity })

      let settled = false
      const finish = (err?: Error) => {
        if (settled) return
        settled = true
        socket.destroy()
        err ? reject(err) : resolve()
      }

      socket.on('error', finish)

      // Buffer for accumulating multi-line SMTP responses
      const pending: string[] = []
      let resolveResponse: ((lines: string[]) => void) | null = null

      const waitForResponse = (): Promise<string[]> =>
        new Promise((res) => {
          resolveResponse = res
        })

      rl.on('line', (line) => {
        pending.push(line)
        // SMTP continuation: "250-..." vs terminal "250 ..."
        if (line.length >= 4 && line[3] !== '-') {
          const captured = [...pending]
          pending.length = 0
          resolveResponse?.(captured)
          resolveResponse = null
        }
      })

      const cmd = async (c: string): Promise<string[]> => {
        socket.write(c + '\r\n')
        return waitForResponse()
      }

      const expect = (lines: string[], code: string) => {
        const last = lines[lines.length - 1] ?? ''
        if (!last.startsWith(code)) throw new Error(`SMTP expected ${code}, got: ${last}`)
      }

      void (async () => {
        try {
          expect(await waitForResponse(), '220')
          expect(await cmd(`EHLO ${host}`), '250')

          if (user && pass) {
            expect(await cmd('AUTH LOGIN'), '334')
            expect(await cmd(Buffer.from(user).toString('base64')), '334')
            expect(await cmd(Buffer.from(pass).toString('base64')), '235')
          }

          expect(await cmd(`MAIL FROM:<${from}>`), '250')
          expect(await cmd(`RCPT TO:<${opts.to}>`), '250')
          expect(await cmd('DATA'), '354')

          const msg = [
            `From: ${from}`,
            `To: ${opts.to}`,
            `Subject: ${opts.subject}`,
            `MIME-Version: 1.0`,
            `Content-Type: text/plain; charset=UTF-8`,
            '',
            opts.body,
            '.',
          ].join('\r\n')
          socket.write(msg + '\r\n')
          expect(await waitForResponse(), '250')

          socket.write('QUIT\r\n')
          finish()
        } catch (err) {
          finish(err instanceof Error ? err : new Error(String(err)))
        }
      })()
    })
  }
}
