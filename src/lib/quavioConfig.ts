export interface QuavioConfig {
  companyName: string
  slogan: string
  siret: string
  tva: string
  address: string
  phone: string
  email: string
  servicesAndRates: string
  additionalInfo: string
}

export const DEFAULT_CONFIG: QuavioConfig = {
  companyName: '',
  slogan: '',
  siret: '',
  tva: '',
  address: '',
  phone: '',
  email: '',
  servicesAndRates: '',
  additionalInfo: '',
}

export function getStorageKey(slug: string) {
  return `quavio_config_${slug}`
}

export function loadConfig(slug: string): QuavioConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG
  try {
    const raw = localStorage.getItem(getStorageKey(slug))
    return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : DEFAULT_CONFIG
  } catch {
    return DEFAULT_CONFIG
  }
}
