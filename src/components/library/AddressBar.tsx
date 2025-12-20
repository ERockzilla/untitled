import { useState, useEffect } from 'react';
import { formatAddress, isValidAddress, normalizeAddress } from '../../lib/babel-core';

interface AddressBarProps {
  address: string;
  onAddressChange: (address: string) => void;
  onRandom: () => void;
  onPrev: () => void;
  onNext: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  addressLength?: number;
  accentColor?: string;
}

export function AddressBar({
  address,
  onAddressChange,
  onRandom,
  onPrev,
  onNext,
  isFavorite,
  onToggleFavorite,
  addressLength = 64,
  accentColor = 'var(--color-accent)',
}: AddressBarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    setEditValue(address);
  }, [address]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidAddress(editValue)) {
      onAddressChange(normalizeAddress(editValue, addressLength));
    }
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-2 p-3 glass rounded-xl">
      {/* Navigation buttons */}
      <div className="flex gap-1">
        <button
          onClick={onPrev}
          className="w-10 h-10 rounded-lg bg-elevated hover:bg-muted transition-colors flex items-center justify-center text-subtle hover:text-text"
          title="Previous address"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={onNext}
          className="w-10 h-10 rounded-lg bg-elevated hover:bg-muted transition-colors flex items-center justify-center text-subtle hover:text-text"
          title="Next address"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Address display/input */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="flex-1 px-3 py-2 bg-void border border-muted rounded-lg font-mono text-sm focus:outline-none focus:border-accent"
              style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
              autoFocus
              spellCheck={false}
            />
            <button
              type="submit"
              className="px-3 py-2 bg-elevated hover:bg-muted rounded-lg text-sm transition-colors"
            >
              Go
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-2 bg-elevated hover:bg-muted rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full px-3 py-2 bg-void/50 rounded-lg font-mono text-sm text-left hover:bg-void transition-colors truncate"
            title={address}
          >
            <span className="text-subtle">0x</span>
            <span>{formatAddress(address, 48)}</span>
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-1">
        <button
          onClick={onRandom}
          className="w-10 h-10 rounded-lg bg-elevated hover:bg-muted transition-colors flex items-center justify-center text-subtle hover:text-text"
          title="Random address"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button
          onClick={onToggleFavorite}
          className="w-10 h-10 rounded-lg bg-elevated hover:bg-muted transition-colors flex items-center justify-center"
          style={{ color: isFavorite ? accentColor : 'var(--color-subtle)' }}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

