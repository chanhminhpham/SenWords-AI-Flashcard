import { render, screen, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { PaperProvider } from 'react-native-paper';

import { useAuthStore } from '@/stores/auth.store';

import LoginScreen from '../../../app/(auth)/login';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'ai-flash-card://redirect'),
}));
jest.mock('expo-web-browser');

function renderScreen() {
  return render(
    <PaperProvider>
      <LoginScreen />
    </PaperProvider>
  );
}

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      loading: false,
      error: null,
      ageVerified: true,
      consentGiven: true,
      dateOfBirth: '1990-06-15',
    });
  });

  it('renders three SSO buttons', () => {
    renderScreen();

    expect(screen.getByTestId('google-button')).toBeTruthy();
    expect(screen.getByTestId('facebook-button')).toBeTruthy();
    expect(screen.getByTestId('apple-button')).toBeTruthy();
  });

  it('renders skip option for trial mode', () => {
    renderScreen();

    expect(screen.getByTestId('skip-button')).toBeTruthy();
  });

  it('shows loading indicator when loading', () => {
    useAuthStore.setState({ loading: true });
    renderScreen();

    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });

  it('displays error message on auth failure', () => {
    useAuthStore.setState({ error: 'AUTH_PROVIDER_ERROR' });
    renderScreen();

    expect(screen.getByTestId('error-message')).toBeTruthy();
  });

  it('does not show error when no error', () => {
    renderScreen();

    expect(screen.queryByTestId('error-message')).toBeNull();
  });

  it('calls enterTrialMode and navigates to tabs on skip', () => {
    renderScreen();

    fireEvent.press(screen.getByTestId('skip-button'));

    expect(useAuthStore.getState().trialMode).toBe(true);
    expect(router.replace).toHaveBeenCalledWith('/(auth)/goal-selection');
  });

  it('does not navigate when dateOfBirth is missing on SSO press', () => {
    useAuthStore.setState({ dateOfBirth: null });
    renderScreen();

    fireEvent.press(screen.getByTestId('google-button'));

    // signInWithProvider should not be called (early return due to !dateOfBirth)
    expect(router.replace).not.toHaveBeenCalled();
  });
});
