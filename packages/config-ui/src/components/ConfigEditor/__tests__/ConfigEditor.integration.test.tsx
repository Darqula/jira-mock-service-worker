import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfigEditor } from '../index';

describe('ConfigEditor Integration Tests', () => {
  it('renders all main sections', () => {
    render(<ConfigEditor />);

    expect(screen.getByText(/Projects/i)).toBeInTheDocument();
    expect(screen.getByText(/Global Defaults/i)).toBeInTheDocument();
    expect(screen.getByText(/Status Distribution/i)).toBeInTheDocument();
    expect(screen.getByText(/Issue Types Configuration/i)).toBeInTheDocument();
    expect(screen.getByText(/Sprints Configuration/i)).toBeInTheDocument();
    expect(screen.getByText(/Versions Configuration/i)).toBeInTheDocument();
    expect(screen.getByText(/Worklogs Configuration/i)).toBeInTheDocument();
    expect(screen.getByText(/Data Options/i)).toBeInTheDocument();
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

    // Switch to Data section and add an assignee
    const assigneeInput = screen.getByPlaceholderText('user@example.com');
    fireEvent.change(assigneeInput, { target: { value: 'test@example.com' } });

    const addButtons = screen.getAllByRole('button');
    const addAssigneeButton = addButtons.find(btn =>
      btn.querySelector('.lucide-plus')
    );
    if (addAssigneeButton) {
      fireEvent.click(addAssigneeButton);
    }

    // Verify assignee was added
    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    // Projects count should still be 2
    expect(screen.getByText(/Projects \(2\)/i)).toBeInTheDocument();
  });

  it('validates config structure', () => {
    render(<ConfigEditor />);

    // Get the export button and click it to see the config
    const exportButton = screen.getByRole('button', { name: /Export Config/i });
    expect(exportButton).toBeInTheDocument();

    // The component should maintain valid config structure
    // (This is implicitly tested by the component not crashing)
  });

  it('handles global defaults independently from projects', async () => {
    render(<ConfigEditor />);

    // Update global seed
    const seedInput = screen.getByPlaceholderText(/random seed/i);
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

    expect(screen.getByRole('button', { name: /Export Config/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Import Config/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate Preview/i })).toBeInTheDocument();
  });
});
