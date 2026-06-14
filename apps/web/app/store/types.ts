export interface SessionState {
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
  isAuthenticated: boolean;
}

export interface SessionActions {
  setSession: (user: SessionState["user"]) => void;
  clearSession: () => void;
}

export type SessionStore = SessionState & SessionActions;
