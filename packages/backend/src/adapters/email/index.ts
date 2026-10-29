export interface SendEmailOptions {
  to: string
  subject: string
  body: string
  templateId?: string
  variables?: Record<string, string>
}

export interface EmailAdapter {
  send(opts: SendEmailOptions): Promise<void>
}
