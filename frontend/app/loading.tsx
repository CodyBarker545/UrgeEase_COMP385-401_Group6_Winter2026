// Shows the loading screen.
export default function Loading() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F6F4EF'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '16px' }}>
          <svg width="48" height="48" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="16" stroke="#E39B63" strokeWidth="2" opacity="0.3" />
            <circle cx="20" cy="20" r="8" fill="#E39B63" opacity="0.5" />
            <circle cx="20" cy="20" r="16" stroke="#E39B63" strokeWidth="2" strokeDasharray="100" strokeDashoffset="75">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 20 20"
                to="360 20 20"
                dur="1s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
        </div>
        <p style={{
          fontSize: '14px',
          color: '#666666',
          fontWeight: 500,
          margin: 0
        }}>Loading...</p>
      </div>
    </div>
  )
}
