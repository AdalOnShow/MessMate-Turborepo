export interface CreateSessionParams {
  username: string;
  email: string;
  twitchUsername?: string;
}

export interface SessionState {
  user: {
    id: string | null;
    username: string | null;
    email: string | null;
    twitchUsername?: string | null;
  } | null;

  isAuthenticated: boolean;
}

export interface SessionActions {
  createSession: (params: CreateSessionParams) => void;
  clearSession: () => void;
  updateUser: (updates: Partial<SessionState["user"]>) => void;
}

export type SessionStore = SessionState & SessionActions;
