/**
 * Persistence layer abstraction
 * Currently uses LocalStorage, designed for future backend migration
 */

export interface LibraryState {
  currentAddress: string;
  favorites: string[];
  settings: Record<string, unknown>;
  lastVisited: number;
}

export interface PersistenceAdapter {
  get(pageId: string): Promise<LibraryState | null>;
  set(pageId: string, state: LibraryState): Promise<void>;
  getAll(): Promise<Record<string, LibraryState>>;
  addFavorite(pageId: string, address: string): Promise<void>;
  removeFavorite(pageId: string, address: string): Promise<void>;
}

const STORAGE_KEY = 'untitled_library_state';

class LocalStorageAdapter implements PersistenceAdapter {
  private getStorage(): Record<string, LibraryState> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private saveStorage(data: Record<string, LibraryState>): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  async get(pageId: string): Promise<LibraryState | null> {
    const storage = this.getStorage();
    return storage[pageId] || null;
  }

  async set(pageId: string, state: LibraryState): Promise<void> {
    const storage = this.getStorage();
    storage[pageId] = {
      ...state,
      lastVisited: Date.now(),
    };
    this.saveStorage(storage);
  }

  async getAll(): Promise<Record<string, LibraryState>> {
    return this.getStorage();
  }

  async addFavorite(pageId: string, address: string): Promise<void> {
    const storage = this.getStorage();
    const state = storage[pageId] || this.createDefaultState();
    
    if (!state.favorites.includes(address)) {
      state.favorites.push(address);
      state.lastVisited = Date.now();
      storage[pageId] = state;
      this.saveStorage(storage);
    }
  }

  async removeFavorite(pageId: string, address: string): Promise<void> {
    const storage = this.getStorage();
    const state = storage[pageId];
    
    if (state) {
      state.favorites = state.favorites.filter(f => f !== address);
      state.lastVisited = Date.now();
      storage[pageId] = state;
      this.saveStorage(storage);
    }
  }

  private createDefaultState(): LibraryState {
    return {
      currentAddress: '',
      favorites: [],
      settings: {},
      lastVisited: Date.now(),
    };
  }
}

// Export singleton instance
// Easy to swap for FirebaseAdapter or other backend later
export const persistence: PersistenceAdapter = new LocalStorageAdapter();

// Helper hook for React components
export function createDefaultState(address: string = ''): LibraryState {
  return {
    currentAddress: address,
    favorites: [],
    settings: {},
    lastVisited: Date.now(),
  };
}

