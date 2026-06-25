import { getArcheMarkDataUri } from '@/lib/brand/mark-data-uri'

function OgMark({ size }: { size: number }) {
  return (
    <img
      src={getArcheMarkDataUri()}
      alt=""
      width={size}
      height={size}
      style={{ display: 'block' }}
    />
  )
}

type OgShellProps = {
  eyebrow: string
  title: string
  subtitle?: string
  footer?: string
  markSize?: number
}

const shellRootStyle = {
  width: '100%',
  height: '100%',
  display: 'flex',
  background: '#050505',
  color: '#fafafa',
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  position: 'relative',
} as const

const gridOverlayStyle = {
  position: 'absolute',
  inset: 0,
  backgroundImage:
    'linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)',
  backgroundSize: '32px 32px',
} as const

const glowStyle = {
  position: 'absolute',
  top: -80,
  right: -40,
  width: 360,
  height: 360,
  background: 'radial-gradient(circle, rgba(245, 158, 11, 0.18) 0%, rgba(245, 158, 11, 0) 70%)',
} as const

const contentRowStyle = {
  display: 'flex',
  width: '100%',
  height: '100%',
  padding: '64px 72px',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 48,
} as const

const columnStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  flex: 1,
} as const

const eyebrowRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  fontSize: 20,
  letterSpacing: '0.32em',
  textTransform: 'uppercase',
  color: '#a1a1aa',
  fontWeight: 700,
} as const

const subtitleStyle = {
  fontSize: 28,
  lineHeight: 1.35,
  color: '#a1a1aa',
  maxWidth: 680,
  fontWeight: 500,
} as const

const footerStyle = {
  position: 'absolute',
  bottom: 28,
  right: 40,
  fontSize: 13,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: '#52525b',
  fontWeight: 700,
} as const

function titleTextStyle(titleSize: number) {
  return {
    fontSize: titleSize,
    lineHeight: 0.95,
    fontWeight: 900,
    letterSpacing: '-0.04em',
    textTransform: 'uppercase',
    maxWidth: 760,
  } as const
}

export function OgShell({ eyebrow, title, subtitle, footer, markSize = 140 }: OgShellProps) {
  const displayTitle = title.slice(0, 120)
  const titleSize = displayTitle.length > 72 ? 46 : displayTitle.length > 48 ? 56 : 68

  return (
    <div style={shellRootStyle}>
      <div style={gridOverlayStyle} />
      <div style={glowStyle} />
      <div style={contentRowStyle}>
        <div style={columnStyle}>
          <div style={eyebrowRowStyle}>
            <OgMark size={52} />
            {eyebrow}
          </div>
          <div style={titleTextStyle(titleSize)}>{displayTitle}</div>
          {subtitle ? <div style={subtitleStyle}>{subtitle.slice(0, 160)}</div> : null}
        </div>
        <OgMark size={markSize} />
      </div>
      {footer ? <div style={footerStyle}>{footer}</div> : null}
    </div>
  )
}
