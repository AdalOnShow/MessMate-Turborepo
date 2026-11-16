/**
 * Tiny event bus for the top navigation progress bar.
 *
 * Link clicks are picked up automatically by `NavigationProgress`. Code that
 * navigates programmatically (`router.push` / `router.replace`) should call
 * `startNavigationProgress()` first so the user sees that something is
 * happening while the next route compiles / loads.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

export function startNavigationProgress() {
  listeners.forEach((listener) => listener());
}

export function onNavigationStart(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
