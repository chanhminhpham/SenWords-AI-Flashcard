import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { IpaDisplay } from './IpaDisplay';

// Mock theme
jest.mock('@/theme/use-app-theme', () => ({
  useAppTheme: () => ({
    colors: {
      nature: { accent: '#2D8A5E' },
    },
  }),
}));

describe('IpaDisplay', () => {
  it('renders single IPA from ipa prop', () => {
    render(<IpaDisplay ipa="/ˈwɔːtər/" />);
    expect(screen.getByText('/ˈwɔːtər/')).toBeTruthy();
  });

  it('renders nothing when no IPA provided', () => {
    const { queryByTestId } = render(<IpaDisplay />);
    expect(queryByTestId('ipa-display')).toBeNull();
  });

  it('renders nothing when all IPA props are null', () => {
    const { queryByTestId } = render(<IpaDisplay ipa={null} ipaUs={null} ipaUk={null} />);
    expect(queryByTestId('ipa-display')).toBeNull();
  });

  it('renders dual IPA when US and UK differ', () => {
    render(<IpaDisplay ipaUs="/ˈʃɛdjuːl/" ipaUk="/ˈʃɛdjuːl/" />);
    // Same IPA — should show single
    expect(screen.queryByText('US:')).toBeNull();
  });

  it('renders dual IPA labels when US and UK actually differ', () => {
    render(<IpaDisplay ipaUs="/ˈskedʒuːl/" ipaUk="/ˈʃɛdjuːl/" />);
    expect(screen.getByText('US: /ˈskedʒuːl/')).toBeTruthy();
    expect(screen.getByText('UK: /ˈʃɛdjuːl/')).toBeTruthy();
  });

  it('uses ipa as fallback for US when ipaUs not provided', () => {
    render(<IpaDisplay ipa="/ˈwɔːtər/" ipaUk="/ˈwɔːtə/" />);
    expect(screen.getByText('US: /ˈwɔːtər/')).toBeTruthy();
    expect(screen.getByText('UK: /ˈwɔːtə/')).toBeTruthy();
  });

  it('has correct accessibility label for single IPA', () => {
    render(<IpaDisplay ipa="/ˈwɔːtər/" />);
    expect(screen.getByLabelText('IPA: /ˈwɔːtər/')).toBeTruthy();
  });

  it('has correct accessibility label for dual IPA', () => {
    render(<IpaDisplay ipaUs="/ˈskedʒuːl/" ipaUk="/ˈʃɛdjuːl/" />);
    expect(screen.getByLabelText('IPA US: /ˈskedʒuːl/, UK: /ˈʃɛdjuːl/')).toBeTruthy();
  });
});
