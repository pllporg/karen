import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import LoginPage from '../app/login/page';

describe('LoginPage', () => {
  it('renders sign-in state and can toggle to register', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Need an account? Register' }));

    expect(screen.getByRole('heading', { name: 'Create Organization' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Organization Name')).toBeInTheDocument();
  });
});
