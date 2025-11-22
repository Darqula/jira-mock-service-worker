import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectsManager } from '../ProjectsManager';
import type { JiraMockConfig } from '@jira-mock/core';

describe('ProjectsManager', () => {
  const mockOnChange = jest.fn();

  const defaultConfig: JiraMockConfig = {
    version: '1.0',
    projects: [
      {
        projectKey: 'PROJ1',
        projectName: 'Project One',
        issueCount: 100,
        projectType: 'company-managed',
      },
    ],
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders projects list', () => {
    render(<ProjectsManager config={defaultConfig} onChange={mockOnChange} />);

    expect(screen.getByText(/Projects \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText('PROJ1 - Project One')).toBeInTheDocument();
    expect(screen.getByText(/100 issues/i)).toBeInTheDocument();
  });

  it('adds a new project', () => {
    render(<ProjectsManager config={defaultConfig} onChange={mockOnChange} />);

    const addButton = screen.getByRole('button', { name: /Add Project/i });
    fireEvent.click(addButton);

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultConfig,
      projects: [
        ...defaultConfig.projects,
        {
          projectKey: 'PROJ2',
          issueCount: 50,
        },
      ],
    });
  });

  it('removes a project when multiple projects exist', () => {
    const configWithTwoProjects: JiraMockConfig = {
      version: '1.0',
      projects: [
        { projectKey: 'PROJ1', issueCount: 100 },
        { projectKey: 'PROJ2', issueCount: 50 },
      ],
    };

    render(<ProjectsManager config={configWithTwoProjects} onChange={mockOnChange} />);

    // Find the delete button for PROJ1
    const deleteButton = screen.getByRole('button', { name: /Remove project PROJ1/i });

    expect(deleteButton).toBeDefined();
    fireEvent.click(deleteButton);

    expect(mockOnChange).toHaveBeenCalledWith({
      version: '1.0',
      projects: [{ projectKey: 'PROJ2', issueCount: 50 }],
    });
  });

  it('does not remove the last project', () => {
    // Mock window.alert
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<ProjectsManager config={defaultConfig} onChange={mockOnChange} />);

    // Find the delete button for PROJ1
    const deleteButton = screen.getByRole('button', { name: /Remove project PROJ1/i });

    expect(deleteButton).toBeDefined();
    fireEvent.click(deleteButton);

    expect(alertMock).toHaveBeenCalledWith(
      'Cannot remove the last project. At least one project is required.'
    );
    expect(mockOnChange).not.toHaveBeenCalled();

    alertMock.mockRestore();
  });

  it('updates project key', () => {
    render(<ProjectsManager config={defaultConfig} onChange={mockOnChange} />);

    // First project is already expanded
    const projectKeyInput = screen.getByDisplayValue('PROJ1');
    fireEvent.change(projectKeyInput, { target: { value: 'newkey' } });

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultConfig,
      projects: [
        {
          ...defaultConfig.projects[0],
          projectKey: 'NEWKEY', // Should be uppercase
        },
      ],
    });
  });

  it('updates issue count', () => {
    render(<ProjectsManager config={defaultConfig} onChange={mockOnChange} />);

    // First project is already expanded
    const issueCountInput = screen.getByDisplayValue('100');
    fireEvent.change(issueCountInput, { target: { value: '200' } });

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultConfig,
      projects: [
        {
          ...defaultConfig.projects[0],
          issueCount: 200,
        },
      ],
    });
  });

  it('clamps issue count to valid range', () => {
    render(<ProjectsManager config={defaultConfig} onChange={mockOnChange} />);

    // First project is already expanded
    const issueCountInput = screen.getByDisplayValue('100');

    // Test upper bound
    fireEvent.change(issueCountInput, { target: { value: '20000' } });
    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultConfig,
      projects: [
        {
          ...defaultConfig.projects[0],
          issueCount: 10000, // Clamped to max
        },
      ],
    });

    mockOnChange.mockClear();

    // Test lower bound
    fireEvent.change(issueCountInput, { target: { value: '0' } });
    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultConfig,
      projects: [
        {
          ...defaultConfig.projects[0],
          issueCount: 1, // Clamped to min
        },
      ],
    });
  });

  it('updates project type', () => {
    render(<ProjectsManager config={defaultConfig} onChange={mockOnChange} />);

    // First project is already expanded by default
    // Find the select by its id
    const projectTypeSelect = screen.getByLabelText(/Project Type/i);
    fireEvent.change(projectTypeSelect, { target: { value: 'team-managed' } });

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultConfig,
      projects: [
        {
          ...defaultConfig.projects[0],
          projectType: 'team-managed',
        },
      ],
    });
  });

  it('toggles project expansion', () => {
    render(<ProjectsManager config={defaultConfig} onChange={mockOnChange} />);

    // First project starts expanded (index 0 is in expanded set by default)
    expect(screen.getByDisplayValue('PROJ1')).toBeInTheDocument();

    // Collapse first project
    const expandButtons = screen.getAllByRole('button');
    fireEvent.click(expandButtons[1]); // Skip "Add Project" button

    // Now should not see project key input
    expect(screen.queryByDisplayValue('PROJ1')).not.toBeInTheDocument();

    // Expand again
    fireEvent.click(expandButtons[1]);

    // Should see project key input again
    expect(screen.getByDisplayValue('PROJ1')).toBeInTheDocument();
  });
});
