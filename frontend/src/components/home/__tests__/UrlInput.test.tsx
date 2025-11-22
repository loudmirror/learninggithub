/**
 * UrlInput Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UrlInput from '../UrlInput';

describe('UrlInput Component', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders input field and submit button', () => {
    render(<UrlInput onSubmit={mockOnSubmit} />);

    expect(screen.getByPlaceholderText(/github.com\/username\/repository/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /生成学习路径/i })).toBeInTheDocument();
  });

  it('shows error for invalid URL', async () => {
    render(<UrlInput onSubmit={mockOnSubmit} />);

    const input = screen.getByPlaceholderText(/github.com\/username\/repository/i);
    const submitButton = screen.getByRole('button', { name: /生成学习路径/i });

    // Enter invalid URL
    fireEvent.change(input, { target: { value: 'invalid-url' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/请输入有效的 GitHub 仓库 URL/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits valid GitHub URL', async () => {
    render(<UrlInput onSubmit={mockOnSubmit} />);

    const input = screen.getByPlaceholderText(/github.com\/username\/repository/i);
    const submitButton = screen.getByRole('button', { name: /生成学习路径/i });

    // Enter valid URL
    const validUrl = 'https://github.com/facebook/react';
    fireEvent.change(input, { target: { value: validUrl } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(validUrl);
    });
  });

  it('shows loading state when loading prop is true', () => {
    render(<UrlInput onSubmit={mockOnSubmit} loading={true} />);

    const submitButton = screen.getByRole('button', { name: /生成中.../i });
    expect(submitButton).toBeDisabled();
  });

  it('accepts default value', () => {
    const defaultUrl = 'https://github.com/vercel/next.js';
    render(<UrlInput onSubmit={mockOnSubmit} defaultValue={defaultUrl} />);

    const input = screen.getByDisplayValue(defaultUrl);
    expect(input).toBeInTheDocument();
  });
});
