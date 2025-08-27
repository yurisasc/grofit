/**
 * Configuration for the Warframe Market API client.
 */
export interface ApiConfig {
  ingameName: string
  jwtToken: string
  platform?: 'pc' | 'ps4' | 'xb1' | 'swi'
  language?: string
  userAgent?: string
  minRequestInterval?: number
}

export type UserStatus = 'ingame' | 'online' | 'offline'

/**
 * User information included in order responses.
 */
export interface UserInfo {
  id: string
  ingame_name: string
  status: UserStatus
  reputation: number
  region: string
  avatar: string | null
  last_seen: string
}
