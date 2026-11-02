import type { Request, Response } from 'express'
import { sendSuccess, sendError, ErrorCodes } from '../utils/response.js'
import { ServiceError } from '../utils/errors.js'
import {
  getMonthlyTrends,
  getPlantAnalytics,
  getZoneAnalytics,
  getDepartmentAnalytics,
  getCategoryAnalytics,
  getSLAReport,
  exportCSV,
  exportXLSX,
  type ExportDataset,
} from '../services/analytics.service.js'

function handleError(res: Response, err: unknown): void {
  if (err instanceof ServiceError) {
    sendError(res, err.httpStatus, err.code, err.message)
  } else {
    console.error('Analytics controller error:', err)
    sendError(res, 500, ErrorCodes.INTERNAL_ERROR, 'Internal server error')
  }
}

// GET /reports/trends?year=2024
export async function trends(req: Request, res: Response): Promise<void> {
  try {
    const year = parseInt((req.query['year'] as string | undefined) ?? String(new Date().getFullYear()), 10)
    if (isNaN(year) || year < 2000 || year > 2100) {
      sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'Invalid year')
      return
    }
    const data = await getMonthlyTrends(req.user!.plant_id, year)
    sendSuccess(res, data)
  } catch (err) {
    handleError(res, err)
  }
}

// GET /reports/plants
export async function plants(req: Request, res: Response): Promise<void> {
  try {
    const data = await getPlantAnalytics(req.user!.plant_id)
    sendSuccess(res, data)
  } catch (err) {
    handleError(res, err)
  }
}

// GET /reports/zones
export async function zones(req: Request, res: Response): Promise<void> {
  try {
    const data = await getZoneAnalytics(req.user!.plant_id)
    sendSuccess(res, data)
  } catch (err) {
    handleError(res, err)
  }
}

// GET /reports/departments
export async function departments(req: Request, res: Response): Promise<void> {
  try {
    const data = await getDepartmentAnalytics(req.user!.plant_id)
    sendSuccess(res, data)
  } catch (err) {
    handleError(res, err)
  }
}

// GET /reports/categories
export async function categories(req: Request, res: Response): Promise<void> {
  try {
    const data = await getCategoryAnalytics(req.user!.plant_id)
    sendSuccess(res, data)
  } catch (err) {
    handleError(res, err)
  }
}

// GET /reports/sla
export async function slaReport(req: Request, res: Response): Promise<void> {
  try {
    const data = await getSLAReport(req.user!.plant_id)
    sendSuccess(res, data)
  } catch (err) {
    handleError(res, err)
  }
}

// GET /reports/export/csv?dataset=ideas
export async function exportCsvHandler(req: Request, res: Response): Promise<void> {
  try {
    const dataset = (req.query['dataset'] as string | undefined) ?? 'ideas'
    if (!['ideas', 'kaizens', 'rewards', 'leaderboard'].includes(dataset)) {
      sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'dataset must be one of: ideas, kaizens, rewards, leaderboard')
      return
    }
    const csv = await exportCSV(req.user!.plant_id, dataset as ExportDataset)
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${dataset}-${Date.now()}.csv"`)
    res.end(csv)
  } catch (err) {
    handleError(res, err)
  }
}

// GET /reports/export/xlsx?dataset=ideas
export async function exportXlsxHandler(req: Request, res: Response): Promise<void> {
  try {
    const dataset = (req.query['dataset'] as string | undefined) ?? 'ideas'
    if (!['ideas', 'kaizens', 'rewards', 'leaderboard'].includes(dataset)) {
      sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'dataset must be one of: ideas, kaizens, rewards, leaderboard')
      return
    }
    const buf = await exportXLSX(req.user!.plant_id, dataset as ExportDataset)
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${dataset}-${Date.now()}.xlsx"`)
    res.end(buf)
  } catch (err) {
    handleError(res, err)
  }
}
