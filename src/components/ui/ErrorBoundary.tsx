import { Component, type ReactNode } from "react"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f5f5',
          fontFamily: 'Arial, Helvetica, sans-serif',
          padding: '24px',
          gap: '16px'
        }}>
          <h2 style={{ fontSize: '18px', color: '#c40000', margin: 0 }}>Terjadi Kesalahan</h2>
          <p style={{ fontSize: '14px', color: '#666', margin: 0, textAlign: 'center' }}>
            Halaman tidak dapat ditampilkan. Silakan muat ulang halaman.
          </p>
          {this.state.error && (
            <details style={{ maxWidth: '600px', width: '100%' }}>
              <summary style={{ fontSize: '12px', color: '#999', cursor: 'pointer' }}>Detail</summary>
              <pre style={{ fontSize: '11px', color: '#666', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px',
              background: '#c40000',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Muat Ulang
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
