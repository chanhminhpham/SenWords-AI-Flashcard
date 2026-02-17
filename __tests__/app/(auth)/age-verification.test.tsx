import { render, screen, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { PaperProvider } from 'react-native-paper';

import { useAuthStore } from '@/stores/auth.store';

import AgeVerificationScreen from '../../../app/(auth)/age-verification';

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
      <AgeVerificationScreen />
    </PaperProvider>
  );
}

describe('AgeVerificationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      ageVerified: false,
      consentGiven: false,
      dateOfBirth: null,
    });
  });

  it('renders date input fields', () => {
    renderScreen();

    expect(screen.getByTestId('day-input')).toBeTruthy();
    expect(screen.getByTestId('month-input')).toBeTruthy();
    expect(screen.getByTestId('year-input')).toBeTruthy();
    expect(screen.getByTestId('verify-button')).toBeTruthy();
  });

  it('shows error for invalid date', () => {
    renderScreen();

    fireEvent.changeText(screen.getByTestId('day-input'), '32');
    fireEvent.changeText(screen.getByTestId('month-input'), '13');
    fireEvent.changeText(screen.getByTestId('year-input'), '2000');
    fireEvent.press(screen.getByTestId('verify-button'));

    expect(screen.getByTestId('error-message')).toBeTruthy();
  });

  it('rejects users under 13', () => {
    renderScreen();

    // Use a date that makes the user under 13
    const now = new Date();
    const recentYear = now.getFullYear() - 10;

    fireEvent.changeText(screen.getByTestId('day-input'), '1');
    fireEvent.changeText(screen.getByTestId('month-input'), '1');
    fireEvent.changeText(screen.getByTestId('year-input'), String(recentYear));
    fireEvent.press(screen.getByTestId('verify-button'));

    expect(screen.getByTestId('under-13-message')).toBeTruthy();
    expect(router.push).not.toHaveBeenCalled();
  });

  it('passes age verification for exactly 13 years old', () => {
    renderScreen();

    const now = new Date();
    // Born exactly 13 years ago (or earlier in the year)
    const year13 = now.getFullYear() - 13;

    fireEvent.changeText(screen.getByTestId('day-input'), '1');
    fireEvent.changeText(screen.getByTestId('month-input'), '1');
    fireEvent.changeText(screen.getByTestId('year-input'), String(year13));
    fireEvent.press(screen.getByTestId('verify-button'));

    expect(router.push).toHaveBeenCalledWith('/(auth)/privacy-consent');
    expect(useAuthStore.getState().ageVerified).toBe(true);
  });

  it('passes age verification for users over 13', () => {
    renderScreen();

    fireEvent.changeText(screen.getByTestId('day-input'), '15');
    fireEvent.changeText(screen.getByTestId('month-input'), '6');
    fireEvent.changeText(screen.getByTestId('year-input'), '1990');
    fireEvent.press(screen.getByTestId('verify-button'));

    expect(router.push).toHaveBeenCalledWith('/(auth)/privacy-consent');
    expect(useAuthStore.getState().ageVerified).toBe(true);
  });

  it('stores date of birth in auth store', () => {
    renderScreen();

    fireEvent.changeText(screen.getByTestId('day-input'), '15');
    fireEvent.changeText(screen.getByTestId('month-input'), '6');
    fireEvent.changeText(screen.getByTestId('year-input'), '1990');
    fireEvent.press(screen.getByTestId('verify-button'));

    expect(useAuthStore.getState().dateOfBirth).toBe('1990-06-15');
  });

  it('shows error for empty fields', () => {
    renderScreen();

    fireEvent.press(screen.getByTestId('verify-button'));

    expect(screen.getByTestId('error-message')).toBeTruthy();
  });
});
