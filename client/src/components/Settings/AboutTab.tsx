import React from 'react'
import { Info, Heart } from 'lucide-react'
import { useTranslation } from '../../i18n'
import Section from './Section'

interface Props {
  appVersion: string
}

export default function AboutTab({ appVersion }: Props): React.ReactElement {
  const { t } = useTranslation()

  return (
    <Section title={t('settings.about')} icon={Info}>
      <style>{`
        @keyframes heartPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>
      <p className="text-content-secondary" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', lineHeight: 1.6, marginBottom: 6, marginTop: -4 }}>
        {t('settings.about.description')}
      </p>
      <p className="text-content-faint" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', lineHeight: 1.6, marginBottom: 16 }}>
        {t('settings.about.madeWith')}{' '}
        <Heart size={11} fill="#991b1b" stroke="#991b1b" style={{ display: 'inline-block', verticalAlign: '-1px', animation: 'heartPulse 1.5s ease-in-out infinite' }} />
        {' '}{t('settings.about.madeBy')}{' '}
        <span className="text-content-faint bg-surface-tertiary" style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 99, padding: '1px 7px', fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 600, verticalAlign: '1px' }}>v{appVersion}</span>
      </p>
    </Section>
  )
}
