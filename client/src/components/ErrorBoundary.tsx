import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State { hasError: boolean; error: string }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="rounded-lg border border-red-500/30 
          bg-red-500/10 p-4">
          <p className="text-sm font-medium text-red-400">
            Display error — analysis data was saved successfully.
          </p>
          <p className="mt-1 text-xs text-red-400/70">
            {this.state.error}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Refresh the page to try again.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
