// Shows the not found page.
export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      backgroundColor: '#F6F4EF'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 600,
          color: '#242323',
          marginBottom: '12px'
        }}>404 - Page Not Found</h2>
        <p style={{
          fontSize: '16px',
          color: '#666666',
          marginBottom: '24px',
          lineHeight: 1.6
        }}>
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
      </div>
    </div>
  )
}
