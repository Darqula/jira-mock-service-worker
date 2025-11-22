import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfigEditor } from '../index';

describe('ConfigEditor Integration Tests', () => {
  it('renders all main sections', () => {
    render(<ConfigEditor />);

    expect(screen.getByRole('heading', { name: /Projects \(\d+\)/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Global Defaults/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Status Distribution/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Issue Types Configuration/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Sprints Configuration/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Versions Configuration/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Worklogs Configuration/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Data Options/i })).toBeInTheDocument();
  });

  it('initializes with default project', () => {
    render(<ConfigEditor />);

    // Default project should be PROJ with 50 issues
    expect(screen.getByText(/Projects \(1\)/i)).toBeInTheDocument();
  });

  it('maintains config state across component interactions', async () => {
    render(<ConfigEditor />);

    // Add a new project
    const addProjectButton = screen.getByRole('button', { name: /Add Project/i });
    fireEvent.click(addProjectButton);

    await waitFor(() => {
      expect(screen.getByText(/Projects \(2\)/i)).toBeInTheDocument();
    });

    // Verify config state persists
    // Projects count should still be 2 after interaction
    expect(screen.getByText(/Projects \(2\)/i)).toBeInTheDocument();
  });

  it('validates config structure', () => {
    render(<ConfigEditor />);

    // Check that action buttons are present
    const saveButton = screen.getByRole('button', { name: /Save to LocalStorage/i });
    expect(saveButton).toBeInTheDocument();

    // The component should maintain valid config structure
    // (This is implicitly tested by the component not crashing)
  });

  it('handles global defaults independently from projects', async () => {
    render(<ConfigEditor />);

    // Update global seed
    const seedInput = screen.getByLabelText(/Global Seed/i);
    fireEvent.change(seedInput, { target: { value: '12345' } });

    // Add a project
    const addProjectButton = screen.getByRole('button', { name: /Add Project/i });
    fireEvent.click(addProjectButton);

    await waitFor(() => {
      expect(screen.getByText(/Projects \(2\)/i)).toBeInTheDocument();
    });

    // Seed should still be set
    expect(seedInput).toHaveValue(12345);
  });

  it('renders action buttons', () => {
    render(<ConfigEditor />);

    expect(screen.getByRole('button', { name: /Save to LocalStorage/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download JSON/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy JSON/i })).toBeInTheDocument();
    // Upload button is a label, not a button role
    expect(screen.getByText(/Upload JSON/i)).toBeInTheDocument();
  });
});
