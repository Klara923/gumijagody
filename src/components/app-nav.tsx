import Link from 'next/link'

const links = [
  { href: '/', label: 'Start' },
  { href: '/documents', label: 'Rejestr' },
  { href: '/buffer', label: 'Bufor' },
  { href: '/documents/new', label: 'Nowy dokument' },
  { href: '/documents/upload', label: 'Upload' },
  { href: '/ksef/import', label: 'KSeF' },
]

export function AppNav() {
  return (
    <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px solid #ccc' }}>
      {links.map((link) => (
        <Link key={link.href} href={link.href}>
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
