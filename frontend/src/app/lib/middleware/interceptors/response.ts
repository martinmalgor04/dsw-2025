import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { transformAxiosError } from '../errors/error-handler';

// Placeholder logout; conectar a auth store / keycloak más adelante
async function logout(): Promise<void> {
  try {
    localStorage.removeItem('auth_token');
  } catch {}
}

export async function handleResponseError(error: AxiosError & { config?: InternalAxiosRequestConfig & { _retry?: boolean } }) {
  const status = error.response?.status;

  if (status === 401 && error.config && !error.config._retry) {
    error.config._retry = true;
    await logout();
  }

  throw transformAxiosError(error);
}
