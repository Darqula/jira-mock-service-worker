import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataSection } from '../DataSection';
import type { JiraMockConfig } from '@jira-mock/core';

describe('DataSection', () => {
  const mockOnChange = jest.fn();

  const defaultConfig: JiraMockConfig = {
    version: '1.0',
    projects: [
      {
        projectKey: 'TEST',
        issueCount: 50,
        data: {
          assignees: ['user1@example.com', 'user2@example.com'],
          priorities: ['Low', 'Medium', 'High'],
          labels: ['bug', 'feature'],
        },
      },
    ],
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Assignees', () => {
    it('renders existing assignees', () => {
      render(<DataSection config={defaultConfig} onChange={mockOnChange} projectIndex={0} />);

      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      expect(screen.getByText('user2@example.com')).toBeInTheDocument();
    });

    it('adds a new assignee', () => {
      render(<DataSection config={defaultConfig} onChange={mockOnChange} projectIndex={0} />);

      const input = screen.getByPlaceholderText('user@example.com');
      fireEvent.change(input, { target: { value: 'newuser@example.com' } });

      const addButtons = screen.getAllByRole('button');
      const addAssigneeButton = addButtons[0]; // First add button is for assignees
      fireEvent.click(addAssigneeButton);

      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultConfig,
        projects: [
          {
            ...defaultConfig.projects[0],
            data: {
              ...defaultConfig.projects[0].data,
              assignees: ['user1@example.com', 'user2@example.com', 'newuser@example.com'],
            },
          },
        ],
      });
    });

    it('does not add duplicate assignees', () => {
      render(<DataSection config={defaultConfig} onChange={mockOnChange} projectIndex={0} />);

      const input = screen.getByPlaceholderText('user@example.com');
      fireEvent.change(input, { target: { value: 'user1@example.com' } });

      const addButtons = screen.getAllByRole('button');
      fireEvent.click(addButtons[0]);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('removes an assignee', () => {
      render(<DataSection config={defaultConfig} onChange={mockOnChange} projectIndex={0} />);

      const removeButtons = screen
        .getAllByRole('button')
        .filter((button) => button.querySelector('.lucide-x'));
      // First remove button is for user1@example.com
      fireEvent.click(removeButtons[0]);

      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultConfig,
        projects: [
          {
            ...defaultConfig.projects[0],
            data: {
              ...defaultConfig.projects[0].data,
              assignees: ['user2@example.com'],
            },
          },
        ],
      });
    });
  });

  describe('Priorities', () => {
    it('renders existing priorities', () => {
      render(<DataSection config={defaultConfig} onChange={mockOnChange} projectIndex={0} />);

      expect(screen.getByText('Low')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('adds a new priority', () => {
      render(<DataSection config={defaultConfig} onChange={mockOnChange} projectIndex={0} />);

      const input = screen.getByPlaceholderText('Critical');
      fireEvent.change(input, { target: { value: 'Urgent' } });

      const addButtons = screen.getAllByRole('button');
      const addPriorityButton = addButtons[3]; // After 3 assignee X buttons
      fireEvent.click(addPriorityButton);

      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultConfig,
        projects: [
          {
            ...defaultConfig.projects[0],
            data: {
              ...defaultConfig.projects[0].data,
              priorities: ['Low', 'Medium', 'High', 'Urgent'],
            },
          },
        ],
      });
    });

    it('removes a priority', () => {
      render(<DataSection config={defaultConfig} onChange={mockOnChange} projectIndex={0} />);

      const removeButtons = screen
        .getAllByRole('button')
        .filter((button) => button.querySelector('.lucide-x'));
      // After 2 assignee remove buttons, find priority remove button
      fireEvent.click(removeButtons[2]); // First priority (Low)

      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultConfig,
        projects: [
          {
            ...defaultConfig.projects[0],
            data: {
              ...defaultConfig.projects[0].data,
              priorities: ['Medium', 'High'],
            },
          },
        ],
      });
    });
  });

  describe('Labels', () => {
    it('renders existing labels', () => {
      render(<DataSection config={defaultConfig} onChange={mockOnChange} projectIndex={0} />);

      expect(screen.getByText('bug')).toBeInTheDocument();
      expect(screen.getByText('feature')).toBeInTheDocument();
    });

    it('adds a new label', () => {
      render(<DataSection config={defaultConfig} onChange={mockOnChange} projectIndex={0} />);

      const input = screen.getByPlaceholderText('bug-fix');
      fireEvent.change(input, { target: { value: 'enhancement' } });

      // Find Plus icon buttons (these are the add buttons)
      const addButtons = screen
        .getAllByRole('button')
        .filter((button) => button.querySelector('.lucide-plus'));
      // Third add button is for labels (after assignees and priorities)
      fireEvent.click(addButtons[2]);

      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultConfig,
        projects: [
          {
            ...defaultConfig.projects[0],
            data: {
              ...defaultConfig.projects[0].data,
              labels: ['bug', 'feature', 'enhancement'],
            },
          },
        ],
      });
    });

    it('removes a label', () => {
      render(<DataSection config={defaultConfig} onChange={mockOnChange} projectIndex={0} />);

      const removeButtons = screen
        .getAllByRole('button')
        .filter((button) => button.querySelector('.lucide-x'));
      // Last label remove button
      fireEvent.click(removeButtons[removeButtons.length - 1]);

      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultConfig,
        projects: [
          {
            ...defaultConfig.projects[0],
            data: {
              ...defaultConfig.projects[0].data,
              labels: ['bug'],
            },
          },
        ],
      });
    });
  });

  it('handles empty data configuration', () => {
    const emptyConfig: JiraMockConfig = {
      version: '1.0',
      projects: [{ projectKey: 'TEST', issueCount: 50 }],
    };

    render(<DataSection config={emptyConfig} onChange={mockOnChange} projectIndex={0} />);

    // Should still render the component without errors
    expect(screen.getByText('Data Options')).toBeInTheDocument();
  });
});
