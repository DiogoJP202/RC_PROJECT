import { Component, type ReactNode } from 'react';
interface Props { children: ReactNode; onError: (message: string) => void }
export class SceneBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { this.props.onError(`O renderizador não pôde iniciar: ${error.message}`); }
  render() { return this.state.failed ? null : this.props.children; }
}
