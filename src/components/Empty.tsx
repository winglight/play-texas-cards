import { useI18n } from '../i18n'
import { cn } from '@/lib/utils'

// Empty component
export default function Empty() {
  const { t } = useI18n()
  return (
    <div className={cn('flex h-full items-center justify-center')}>{t('Empty')}</div>
  )
}
