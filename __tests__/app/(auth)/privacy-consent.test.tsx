import { render, screen, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { PaperProvider } from 'react-native-paper';

import { useAuthStore } from '@/stores/auth.store';

import PrivacyConsentScreen from '../../../app/(auth)/privacy-consent';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'ai-flash-card://redirect'),
}));
jest.mock('expo-web-browser');

function renderScreen() {
  return render(
    <PaperProvider>
      <PrivacyConsentScreen />
    </PaperProvider>
  );
}

describe('PrivacyConsentScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      ageVerified: true,
      consentGiven: false,
    });
  });

  it('renders privacy policy content and checkbox', () => {
    renderScreen();

    expect(screen.getByTestId('policy-scroll')).toBeTruthy();
    expect(screen.getByTestId('consent-checkbox')).toBeTruthy();
    expect(screen.getByTestId('continue-button')).toBeTruthy();
  });

  it('has disabled continue button initially', () => {
    renderScreen();

    const button = screen.getByTestId('continue-button');
    // Paper Button disabled state
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it('enables continue button after checking consent', () => {
    renderScreen();

    fireEvent.press(screen.getByTestId('consent-checkbox'));

    const button = screen.getByTestId('continue-button');
    expect(button.props.accessibilityState?.disabled).toBeFalsy();
  });

  it('navigates to login after consent and continue', () => {
    renderScreen();

    fireEvent.press(screen.getByTestId('consent-checkbox'));
    fireEvent.press(screen.getByTestId('continue-button'));

    expect(router.push).toHaveBeenCalledWith('/(auth)/login');
    expect(useAuthStore.getState().consentGiven).toBe(true);
  });

  it('blocks progression without consent', () => {
    renderScreen();

    // Try to continue without checking consent
    fireEvent.press(screen.getByTestId('continue-button'));

    expect(router.push).not.toHaveBeenCalled();
    expect(useAuthStore.getState().consentGiven).toBe(false);
  });
});
