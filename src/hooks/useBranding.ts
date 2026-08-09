import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export interface BrandingConfig {
  organizationName: string
  customLogoUrl?: string
  primaryColor: string
  appName: string
  slogan: string
}

const DEFAULT_BRANDING: BrandingConfig = {
  organizationName: 'FarmDuty',
  primaryColor: '#22c55e', // Verde padrão
  appName: 'FarmDuty',
  slogan: 'Feito junto com você.',
}

/**
 * Hook para carregar configurações de branding da organização
 * Em produção, isto viria de uma API/Supabase
 */
export function useBranding(): BrandingConfig & { isLoading: boolean } {
  const { usuario } = useAuth()
  const [branding, setBranding] = useState<BrandingConfig>(DEFAULT_BRANDING)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!usuario?.tenant_id) {
      setBranding(DEFAULT_BRANDING)
      return
    }

    // Em produção, buscar da API/Supabase:
    // const fetchBranding = async () => {
    //   setIsLoading(true)
    //   try {
    //     const response = await fetch(
    //       `/api/organizations/${usuario.tenant_id}/branding`,
    //       {
    //         headers: { Authorization: `Bearer ${token}` },
    //       }
    //     )
    //     const data = await response.json()
    //     setBranding({
    //       organizationName: data.name,
    //       customLogoUrl: data.customLogoUrl,
    //       primaryColor: data.primaryColor,
    //       appName: data.appName,
    //       slogan: data.slogan || DEFAULT_BRANDING.slogan,
    //     })
    //   } catch (error) {
    //     console.error('Failed to fetch branding:', error)
    //     setBranding(DEFAULT_BRANDING)
    //   } finally {
    //     setIsLoading(false)
    //   }
    // }
    // fetchBranding()

    // Por enquanto, usar valores padrão
    setBranding(DEFAULT_BRANDING)
  }, [usuario?.tenant_id])

  return { ...branding, isLoading }
}

/**
 * Hook para aplicar cor primária dinamicamente no documento
 */
export function usePrimaryColor(primaryColor: string): void {
  useEffect(() => {
    // Atualizar CSS variable globalmente
    document.documentElement.style.setProperty('--primary-color', primaryColor)

    // Atualizar cor da barra de status no mobile (se suportado)
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', primaryColor)
    }
  }, [primaryColor])
}

/**
 * Gera paleta de cores baseada na cor primária
 */
export function generateColorPalette(primaryColor: string) {
  return {
    primary: primaryColor,
    // Adicionar lighten/darken via processos de cor
    light: `${primaryColor}33`, // 20% opacity
    dark: `${primaryColor}cc`, // 80% opacity
  }
}
