import { authFetch } from './client.js'

export interface Plant { id: string; name: string; code: string }
export interface Zone { id: string; name: string; code: string }
export interface Dept { id: string; name: string; code: string }
export interface FunctionItem { id: string; name: string; code: string }
export interface Hall { id: string; name: string; code: string }
export interface Location { id: string; name: string; code: string }
export interface Category { id: string; name: string; code: string }
export interface SubCategory { id: string; name: string; code: string; category_id: string }
export interface Tag { id: string; name: string; color: string }
export interface ValueStream { id: string; name: string; code: string | null; plant_id: string | null }

// authFetch already unwraps body.data — return the array directly

export function getPlants(): Promise<Plant[]> {
  return authFetch<Plant[]>('/master/org/plants')
}

export function getZonesByPlant(plantId: string): Promise<Zone[]> {
  return authFetch<Zone[]>(`/master/org/plants/${plantId}/zones`)
}

export function getDeptsByZone(zoneId: string): Promise<Dept[]> {
  return authFetch<Dept[]>(`/master/org/zones/${zoneId}/departments`)
}

export function getFunctionsByDept(deptId: string): Promise<FunctionItem[]> {
  return authFetch<FunctionItem[]>(`/master/org/departments/${deptId}/functions`)
}

export function getHallsByFunction(funcId: string): Promise<Hall[]> {
  return authFetch<Hall[]>(`/master/org/functions/${funcId}/halls`)
}

export function getLocationsByHall(hallId: string): Promise<Location[]> {
  return authFetch<Location[]>(`/master/org/halls/${hallId}/locations`)
}

export function getCategories(): Promise<Category[]> {
  return authFetch<Category[]>('/master/categories')
}

export function getSubCategoriesByCategory(catId: string): Promise<SubCategory[]> {
  return authFetch<SubCategory[]>(`/master/sub-categories?category_id=${catId}`)
}

export function getTags(): Promise<Tag[]> {
  return authFetch<Tag[]>('/master/tags')
}

export function getValueStreams(plantId?: string): Promise<ValueStream[]> {
  const qs = plantId ? `?plant_id=${encodeURIComponent(plantId)}` : ''
  return authFetch<ValueStream[]>(`/master/value-streams${qs}`)
}
