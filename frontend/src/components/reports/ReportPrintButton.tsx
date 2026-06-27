import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ReportPrintButtonProps {
  disabled?: boolean
}

export function ReportPrintButton({ disabled }: ReportPrintButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      disabled={disabled}
      onClick={() => window.print()}
    >
      <Printer size={16} />
      Print
    </Button>
  )
}
