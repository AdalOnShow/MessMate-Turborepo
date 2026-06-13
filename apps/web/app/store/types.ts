export interface SessionState {
  accessToken: string | null;
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
  isAuthenticated: boolean;
}

export interface SessionActions {
  setSession: (token: string, user: SessionState["user"]) => void;
  clearSession: () => void;
}

export type SessionStore = SessionState & SessionActions;
