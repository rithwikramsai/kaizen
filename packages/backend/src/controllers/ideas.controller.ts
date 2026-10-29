import type { Request, Response, NextFunction } from 'express'
import { sendSuccess } from '../utils/response.js'
import * as ideasService from '../services/ideas.service.js'

export async function createIdea(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as Parameters<typeof ideasService.createIdea>[0]
    const result = await ideasService.createIdea({ ...body, submittedBy: req.user!.id })
    sendSuccess(res, result, 201)
  } catch (err) {
    next(err)
  }
}

export async function listIdeas(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { ideas, meta } = await ideasService.listIdeas(
      req.user!.id,
      req.user!.plant_id,
      req.user!.permissions,
      req.query as Record<string, unknown>,
    )
    sendSuccess(res, ideas, 200, meta)
  } catch (err) {
    next(err)
  }
}

export async function getIdea(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await ideasService.getIdeaById(
      req.params['id']!,
      req.user!.id,
      req.user!.plant_id,
      req.user!.permissions,
    )
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}

export async function updateIdea(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as Parameters<typeof ideasService.updateIdea>[2]
    const result = await ideasService.updateIdea(req.params['id']!, req.user!.id, body)
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}

export async function deleteIdea(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await ideasService.deleteIdea(req.params['id']!, req.user!.id)
    sendSuccess(res, null)
  } catch (err) {
    next(err)
  }
}

export async function getTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await ideasService.getIdeaTimeline(
      req.params['id']!,
      req.user!.id,
      req.user!.plant_id,
      req.user!.permissions,
    )
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}
