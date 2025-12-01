export type ModalType = 'confirm' | 'info' | 'custom';
export interface ModalState { id: string; isOpen: boolean; type: ModalType; data?: unknown }
export interface Notification { id: string; message: string; type: 'success'|'info'|'warning'|'error'; timeoutMs?: number }

export interface UIState {
  modals: ModalState[];
  notifications: Notification[];
  loading: boolean;
  theme: 'light' | 'dark';
  sidebar: { isOpen: boolean; collapsed: boolean };
}

let state: UIState = {
  modals: [],
  notifications: [],
  loading: false,
  theme: 'light',
  sidebar: { isOpen: true, collapsed: false },
};

const subs: Array<(s: UIState) => void> = [];
const notify = () => subs.forEach((fn) => fn(state));

const rid = () => Math.random().toString(36).slice(2);

export const uiStore = {
  subscribe(fn: (s: UIState) => void) { subs.push(fn); fn(state); return () => { const i = subs.indexOf(fn); if (i>=0) subs.splice(i,1); }; },
  setLoading(v: boolean) { state = { ...state, loading: v }; notify(); },
  setTheme(theme: 'light'|'dark') { state = { ...state, theme }; notify(); },
  toggleSidebar() { state = { ...state, sidebar: { ...state.sidebar, isOpen: !state.sidebar.isOpen } }; notify(); },
  openModal(type: ModalType, data?: unknown) { const m: ModalState = { id: rid(), isOpen: true, type, data }; state = { ...state, modals: [...state.modals, m] }; notify(); return m.id; },
  closeModal(id: string) { state = { ...state, modals: state.modals.filter(m => m.id !== id) }; notify(); },
  showNotification(message: string, type: Notification['type'] = 'info', timeoutMs = 5000) { const n: Notification = { id: rid(), message, type, timeoutMs }; state = { ...state, notifications: [...state.notifications, n] }; notify(); if (timeoutMs) setTimeout(() => this.dismissNotification(n.id), timeoutMs); return n.id; },
  dismissNotification(id: string) { state = { ...state, notifications: state.notifications.filter(n => n.id !== id) }; notify(); },
};
