import React from 'react';

export class DebugErrorBoundary extends React.Component<any, { err?: Error; info?: any }> {
  constructor(p: any) { super(p); this.state = {}; }
  componentDidCatch(err: Error, info: any) { this.setState({ err, info }); console.error('Boundary error:', err, info); }
  render() {
    if (this.state.err) {
      return (
        <div style={{ padding: 16 }}>
          <h3>Runtime error</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{String((this.state.err as any).stack || (this.state.err as any).message)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}


