import { getAuthToken, readStoredUser } from "./utils.js";

const authState = {
  token: getAuthToken(),
  user: readStoredUser(),
};

const listeners = new Set();

function emit() {
  listeners.forEach((listener) => {
    try {
      listener(authState);
    } catch (_error) {
      // noop
    }
  });
}

export const authStore = {
  getState() {
    return authState;
  },
  setSession({ token, user }) {
    authState.token = token || authState.token;
    authState.user = user || authState.user;
    try {
      if (authState.token) {
        localStorage.setItem("sw_auth_token", authState.token);
      }
      if (authState.user) {
        localStorage.setItem("sw_auth_user", JSON.stringify(authState.user));
      }
    } catch (_error) {
      // Private browsing or quota exceeded — in-memory state is sufficient.
    }
    emit();
  },
  setUser(user) {
    authState.user = user;
    try {
      localStorage.setItem("sw_auth_user", JSON.stringify(user));
    } catch (_error) {
      // noop
    }
    emit();
  },
  clear() {
    authState.token = "";
    authState.user = null;
    emit();
  },
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
