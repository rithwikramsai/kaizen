import type { Request, Response } from 'express'
import { env } from '../config/env.js'
import { getMicrosoftAuthUrl, loginWithMicrosoft } from '../services/microsoftAuth.service.js'
import { ServiceError } from '../utils/errors.js'

export async function redirectToMicrosoft(_req: Request, res: Response): Promise<void> {
  try {
    const authUrl = getMicrosoftAuthUrl()
    res.redirect(authUrl)
  } catch (err) {
    const status = err instanceof ServiceError ? err.httpStatus : 500
    const message = err instanceof Error ? err.message : 'SSO configuration error'
    res.status(status).json({ success: false, error: { code: 'SSO_ERROR', message } })
  }
}

export async function microsoftCallback(req: Request, res: Response): Promise<void> {
  const { code, error: msError } = req.query as { code?: string; error?: string; error_description?: string }
  const frontendUrl = env.FRONTEND_URL

  if (msError || !code) {
    const msg = msError ?? 'Authorization was denied'
    res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(msg)}`)
    return
  }

  try {
    const result = await loginWithMicrosoft(code)
    const userB64 = Buffer.from(JSON.stringify(result.user)).toString('base64')
    const params = new URLSearchParams({
      token: result.access_token,
      refresh_token: result.refresh_token,
      user: userB64,
    })
    res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'SSO authentication failed'
    res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(message)}`)
  }
}
