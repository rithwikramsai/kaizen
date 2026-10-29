import { authFetch } from './client.js'

export interface Plant { id: string; name: string; code: string }
export interface Zone { id: string; name: string; code: string }
export interface Dept { id: string; name: string; code: string }
export interface FunctionItem { id: string; name: string; code: string }
export interface Hall { id: string; name: string; code: string }
export interface Location { id: string; name: string; code: string }
export interface Category { id: string; name: string; code: string }
export interface SubCategory { id: string; name: string; code: string }
export interface Tag { id: string; name: string; color: string }

interface ListResponse<T> { success: true; data: T[] }

export async function getPlants(): Promise<Plant[]> {
  const r = await authFetch<ListResponse<Plant>>('/master/org/plants')
  return r.data
}

export async function getZonesByPlant(plantId: string): Promise<Zone[]> {
  const r = await authFetch<ListResponse<Zone>>(`/master/org/plants/${plantId}/zones`)
  return r.data
}

export async function getDeptsByZone(zoneId: string): Promise<Dept[]> {
  const r = await authFetch<ListResponse<Dept>>(`/master/org/zones/${zoneId}/departments`)
  return r.data
}

export async function getFunctionsByDept(deptId: string): Promise<FunctionItem[]> {
  const r = await authFetch<ListResponse<FunctionItem>>(`/master/org/departments/${deptId}/functions`)
  return r.data
}

export async function getHallsByFunction(funcId: string): Promise<Hall[]> {
  const r = await authFetch<ListResponse<Hall>>(`/master/org/functions/${funcId}/halls`)
  return r.data
}

export async function getLocationsByHall(hallId: string): Promise<Location[]> {
  const r = await authFetch<ListResponse<Location>>(`/master/org/halls/${hallId}/locations`)
  return r.data
}

export async function getCategories(): Promise<Category[]> {
  const r = await authFetch<ListResponse<Category>>('/master/categories')
  return r.data
}

export async function getSubCategoriesByCategory(catId: string): Promise<SubCategory[]> {
  const r = await authFetch<ListResponse<SubCategory>>(`/master/sub-categories?category_id=${catId}`)
  return r.data
}

export async function getTags(): Promise<Tag[]> {
  const r = await authFetch<ListResponse<Tag>>('/master/tags')
  return r.data
}
