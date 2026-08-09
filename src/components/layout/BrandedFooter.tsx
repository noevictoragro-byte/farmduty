interface BrandedFooterProps {
  organizationName?: string
  primaryColor?: string
  showCopyright?: boolean
}

/**
 * Footer com copyright obrigatório do FarmDuty
 * Exibição discreta mas permanente da marca FarmDuty
 */
export function BrandedFooter({
  organizationName = 'FarmDuty',
  primaryColor = '#22c55e',
  showCopyright = true,
}: BrandedFooterProps) {
  const currentYear = new Date().getFullYear()

  if (!showCopyright) return null

  return (
    <footer className="border-t bg-muted/50 px-4 py-3 text-center text-xs text-muted-foreground">
      <div className="mx-auto max-w-3xl space-y-1">
        {organizationName !== 'FarmDuty' && (
          <div>
            <span className="font-medium" style={{ color: primaryColor }}>
              {organizationName}
            </span>
          </div>
        )}
        <div>
          Desenvolvido por{' '}
          <span className="font-semibold text-foreground">FarmDuty®</span> ·
          Todos os direitos reservados · © {currentYear}
        </div>
        <div className="text-xs">
          <a
            href="https://farmduty.com.br/privacidade"
            className="hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Política de Privacidade
          </a>
          {' · '}
          <a
            href="https://farmduty.com.br/termos"
            className="hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Termos de Uso
          </a>
        </div>
      </div>
    </footer>
  )
}
