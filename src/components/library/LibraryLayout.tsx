import { Link } from 'react-router-dom';
import { AddressBar } from './AddressBar';

interface LibraryLayoutProps {
  title: string;
  description?: string;
  address: string;
  onAddressChange: (address: string) => void;
  onRandom: () => void;
  onPrev: () => void;
  onNext: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  addressLength?: number;
  accentColor?: string;
  children: React.ReactNode;
  controls?: React.ReactNode;
}

export function LibraryLayout({
  title,
  description,
  address,
  onAddressChange,
  onRandom,
  onPrev,
  onNext,
  isFavorite,
  onToggleFavorite,
  addressLength = 64,
  accentColor = 'var(--color-accent)',
  children,
  controls,
}: LibraryLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-elevated">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="w-10 h-10 rounded-lg bg-elevated hover:bg-muted transition-colors flex items-center justify-center text-subtle hover:text-text"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold" style={{ color: accentColor }}>{title}</h1>
            {description && <p className="text-sm text-subtle">{description}</p>}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Canvas area */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-2xl aspect-square">
            {children}
          </div>
        </div>

        {/* Controls sidebar */}
        {controls && (
          <aside className="w-full lg:w-80 p-6 border-t lg:border-t-0 lg:border-l border-elevated">
            {controls}
          </aside>
        )}
      </main>

      {/* Footer with address bar */}
      <footer className="p-4 border-t border-elevated">
        <div className="max-w-4xl mx-auto">
          <AddressBar
            address={address}
            onAddressChange={onAddressChange}
            onRandom={onRandom}
            onPrev={onPrev}
            onNext={onNext}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
            addressLength={addressLength}
            accentColor={accentColor}
          />
        </div>
      </footer>
    </div>
  );
}

