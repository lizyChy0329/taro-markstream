import os from 'os'

export function isWSL(): boolean {
  if (process.platform !== 'linux') return false
  const release = os.release().toLowerCase()
  return release.includes('microsoft') || release.includes('wsl')
}