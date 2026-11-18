export interface SessionState {
  user: {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    avatar: string | null;
    manager_created: boolean;
    must_change_password?: boolean;
    email_verified: boolean;
  } | null;
  isAuthenticated: boolean;
}

export interface SessionActions {
  setSession: (user: SessionState["user"]) => void;
  clearSession: () => void;
}

export type SessionStore = SessionState & SessionActions;
