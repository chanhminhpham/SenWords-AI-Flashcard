/* eslint-disable @typescript-eslint/no-require-imports, import/first */

// Mock expo-router — use jest.fn() inside factory to avoid NativeWind babel transforms
const mockRedirect = jest.fn();
let mockSegments: string[] = ['(auth)', 'login'];

jest.mock('expo-router', () => {
  const RN = require('react-native');
  const MockStack = (props: { children?: unknown }) =>
    require('react').createElement(RN.View, { testID: 'auth-stack' }, props.children);
  MockStack.Screen = ((_props: unknown) => null) as unknown;
  return {
    __esModule: true,
    Redirect: (props: { href: string }) => {
      mockRedirect(props.href);
      return null;
    },
    Stack: MockStack,
    useSegments: () => mockSegments,
  };
});

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'ai-flash-card://redirect'),
}));
jest.mock('expo-web-browser');

import { render } from '@testing-library/react-native';

import { useAuthStore } from '@/stores/auth.store';

import AuthLayout from '../../../app/(auth)/_layout';

describe('AuthLayout - Navigation Guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSegments = ['(auth)', 'login'];
    useAuthStore.setState({
      ageVerified: false,
      consentGiven: false,
    });
  });

  it('redirects to age-verification when login accessed without age+consent', () => {
    mockSegments = ['(auth)', 'login'];
    useAuthStore.setState({ ageVerified: false, consentGiven: false });

    render(<AuthLayout />);

    expect(mockRedirect).toHaveBeenCalledWith('/(auth)/age-verification');
  });

  it('redirects to age-verification when login accessed with age but no consent', () => {
    mockSegments = ['(auth)', 'login'];
    useAuthStore.setState({ ageVerified: true, consentGiven: false });

    render(<AuthLayout />);

    expect(mockRedirect).toHaveBeenCalledWith('/(auth)/age-verification');
  });

  it('allows login screen when both age+consent are verified', () => {
    mockSegments = ['(auth)', 'login'];
    useAuthStore.setState({ ageVerified: true, consentGiven: true });

    const { getByTestId } = render(<AuthLayout />);

    expect(mockRedirect).not.toHaveBeenCalled();
    expect(getByTestId('auth-stack')).toBeTruthy();
  });

  it('redirects privacy-consent to age-verification when age not verified', () => {
    mockSegments = ['(auth)', 'privacy-consent'];
    useAuthStore.setState({ ageVerified: false, consentGiven: false });

    render(<AuthLayout />);

    expect(mockRedirect).toHaveBeenCalledWith('/(auth)/age-verification');
  });

  it('allows privacy-consent when age is verified', () => {
    mockSegments = ['(auth)', 'privacy-consent'];
    useAuthStore.setState({ ageVerified: true, consentGiven: false });

    const { getByTestId } = render(<AuthLayout />);

    expect(mockRedirect).not.toHaveBeenCalled();
    expect(getByTestId('auth-stack')).toBeTruthy();
  });

  it('allows welcome screen without any verification', () => {
    mockSegments = ['(auth)', 'welcome'];
    useAuthStore.setState({ ageVerified: false, consentGiven: false });

    const { getByTestId } = render(<AuthLayout />);

    expect(mockRedirect).not.toHaveBeenCalled();
    expect(getByTestId('auth-stack')).toBeTruthy();
  });

  it('allows age-verification screen without any verification', () => {
    mockSegments = ['(auth)', 'age-verification'];
    useAuthStore.setState({ ageVerified: false, consentGiven: false });

    const { getByTestId } = render(<AuthLayout />);

    expect(mockRedirect).not.toHaveBeenCalled();
    expect(getByTestId('auth-stack')).toBeTruthy();
  });
});
