import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[DineFlow ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          fontFamily: "'Inter', system-ui, sans-serif",
          color: "#e0e0e0",
          padding: "2rem",
        }}>
          <div style={{
            maxWidth: 480,
            width: "100%",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
            padding: "2.5rem 2rem",
            textAlign: "center",
            backdropFilter: "blur(12px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px", color: "#fff" }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: 14, color: "#a0a0b0", marginBottom: 20, lineHeight: 1.5 }}>
              DineFlow encountered an unexpected error. This is usually temporary.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div style={{
                background: "rgba(220,38,38,0.12)",
                border: "1px solid rgba(220,38,38,0.25)",
                borderRadius: 8,
                padding: "12px 14px",
                marginBottom: 20,
                textAlign: "left",
                fontSize: 12,
                fontFamily: "monospace",
                color: "#fca5a5",
                maxHeight: 160,
                overflowY: "auto",
                wordBreak: "break-word",
              }}>
                <strong style={{ color: "#fecaca" }}>{this.state.error.name}:</strong>{" "}
                {this.state.error.message}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: "10px 24px",
                  borderRadius: 8,
                  border: "none",
                  background: "linear-gradient(135deg, #e07a5f, #c9634a)",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                }}
                onMouseOver={e => (e.currentTarget.style.opacity = "0.85")}
                onMouseOut={e => (e.currentTarget.style.opacity = "1")}
              >
                Reload App
              </button>
              <button
                onClick={() => { window.location.href = "/"; }}
                style={{
                  padding: "10px 24px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#e0e0e0",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                }}
                onMouseOver={e => (e.currentTarget.style.opacity = "0.85")}
                onMouseOut={e => (e.currentTarget.style.opacity = "1")}
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
