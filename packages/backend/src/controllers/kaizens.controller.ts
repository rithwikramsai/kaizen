import type { Request, Response, NextFunction } from 'express'
import { sendSuccess } from '../utils/response.js'
import * as kaizensService from '../services/kaizens.service.js'

export async function listApprovedQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await kaizensService.getApprovedIdeasQueue(req.user!.id, req.user!.plant_id)
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}

export async function markImplemented(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await kaizensService.markImplemented(req.params['ideaId']!, req.user!.id)
    sendSuccess(res, result, 201)
  } catch (err) {
    next(err)
  }
}

export async function getKaizen(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await kaizensService.getKaizen(req.params['kaizenId']!, req.user!.id)
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}

export async function saveDraft(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await kaizensService.saveKaizenDraft(req.params['kaizenId']!, req.user!.id, req.body as kaizensService.SaveDraftParams)
    sendSuccess(res, null)
  } catch (err) {
    next(err)
  }
}

export async function submitOnePager(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await kaizensService.submitOnePager(req.params['kaizenId']!, req.user!.id)
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}

export async function assignOwner(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { owner_id } = req.body as { owner_id: string }
    await kaizensService.assignImplementationOwner(req.params['kaizenId']!, owner_id, req.user!.id)
    sendSuccess(res, null)
  } catch (err) {
    next(err)
  }
}
