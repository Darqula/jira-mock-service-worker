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
        projectType: 'company-managed',
        // issueCount omitted: count is derived from issue types (1 epic + 99 children)
        issueTypes: {
          epic: {
            count: 1,
            childrenPerEpic: 99,
          },
        },
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
          // No issueCount - it falls back to the issue-types-derived count
        },
      ],
    });
  });

  it('removes a project when multiple projects exist', () => {
    const configWithTwoProjects: JiraMockConfig = {
      version: '1.0',
      projects: [{ projectKey: 'PROJ1' }, { projectKey: 'PROJ2' }],
    };

    render(<ProjectsManager config={configWithTwoProjects} onChange={mockOnChange} />);

    // Find the delete button for PROJ1
    const deleteButton = screen.getByRole('button', { name: /Remove project PROJ1/i });

    expect(deleteButton).toBeDefined();
    fireEvent.click(deleteButton);

    expect(mockOnChange).toHaveBeenCalledWith({
      version: '1.0',
      projects: [{ projectKey: 'PROJ2' }],
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

  // Note: Issue count is now calculated automatically from issue types configuration
  // and is displayed as read-only, so we no longer test manual issue count input

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

  it('clones a project with basic configuration', () => {
    render(<ProjectsManager config={defaultConfig} onChange={mockOnChange} />);

    // Find and click the clone button for PROJ1
    const cloneButton = screen.getByRole('button', { name: /Clone project PROJ1/i });
    fireEvent.click(cloneButton);

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultConfig,
      projects: [
        defaultConfig.projects[0],
        {
          ...defaultConfig.projects[0],
          projectKey: 'PROJ1_COPY',
          projectName: 'Copy of Project One',
        },
      ],
    });
  });

  it('clones a project with all configuration fields', () => {
    const complexConfig: JiraMockConfig = {
      version: '1.0',
      projects: [
        {
          projectKey: 'COMPLEX',
          projectName: 'Complex Project',
          projectType: 'team-managed',
          seed: 12345,
          startIssueNumber: 100,
          statusDistribution: {
            toDo: 0.3,
            inProgress: 0.4,
            done: 0.3,
          },
          issueTypes: {
            epic: {
              count: 5,
              childrenPerEpic: 10,
              assignProbability: 0.8,
            },
            story: {
              standaloneCount: 20,
              assignProbability: 0.9,
            },
          },
          sprints: {
            startNumber: 1,
            duration: 14,
            assignProbability: 0.7,
          },
          versions: {
            startNumber: 1,
            count: 3,
            assignProbability: 0.5,
          },
          worklogs: {
            probability: 0.6,
            hoursMin: 1,
            hoursMax: 8,
            countMin: 1,
            countMax: 5,
          },
          data: {
            assignees: ['user1', 'user2'],
            priorities: ['High', 'Medium', 'Low'],
            labels: ['backend', 'frontend'],
          },
        },
      ],
    };

    render(<ProjectsManager config={complexConfig} onChange={mockOnChange} />);

    const cloneButton = screen.getByRole('button', { name: /Clone project COMPLEX/i });
    fireEvent.click(cloneButton);

    expect(mockOnChange).toHaveBeenCalledWith({
      ...complexConfig,
      projects: [
        complexConfig.projects[0],
        {
          ...complexConfig.projects[0],
          projectKey: 'COMPLEX_COPY',
          projectName: 'Copy of Complex Project',
        },
      ],
    });
  });

  it('generates unique project keys when cloning multiple times', () => {
    const configWithCopy: JiraMockConfig = {
      version: '1.0',
      projects: [
        { projectKey: 'PROJ1', projectName: 'Project One' },
        { projectKey: 'PROJ1_COPY', projectName: 'Copy of Project One' },
      ],
    };

    render(<ProjectsManager config={configWithCopy} onChange={mockOnChange} />);

    // Find and click the clone button for the first PROJ1
    const cloneButton = screen.getByRole('button', { name: /Clone project PROJ1$/i });
    fireEvent.click(cloneButton);

    expect(mockOnChange).toHaveBeenCalledWith({
      ...configWithCopy,
      projects: [
        configWithCopy.projects[0],
        {
          ...configWithCopy.projects[0],
          projectKey: 'PROJ1_COPY2',
          projectName: 'Copy of Project One',
        },
        configWithCopy.projects[1],
      ],
    });
  });

  it('clones a project without a project name', () => {
    const configNoName: JiraMockConfig = {
      version: '1.0',
      projects: [
        {
          projectKey: 'PROJ1',
        },
      ],
    };

    render(<ProjectsManager config={configNoName} onChange={mockOnChange} />);

    const cloneButton = screen.getByRole('button', { name: /Clone project PROJ1/i });
    fireEvent.click(cloneButton);

    expect(mockOnChange).toHaveBeenCalledWith({
      ...configNoName,
      projects: [
        configNoName.projects[0],
        {
          projectKey: 'PROJ1_COPY',
          projectName: undefined,
        },
      ],
    });
  });

  it('inserts cloned project after the source project', () => {
    const configMultipleProjects: JiraMockConfig = {
      version: '1.0',
      projects: [
        { projectKey: 'PROJ1', projectName: 'Project One' },
        { projectKey: 'PROJ2', projectName: 'Project Two' },
        { projectKey: 'PROJ3', projectName: 'Project Three' },
      ],
    };

    render(<ProjectsManager config={configMultipleProjects} onChange={mockOnChange} />);

    // Clone the second project (PROJ2)
    const cloneButton = screen.getByRole('button', { name: /Clone project PROJ2/i });
    fireEvent.click(cloneButton);

    expect(mockOnChange).toHaveBeenCalledWith({
      ...configMultipleProjects,
      projects: [
        configMultipleProjects.projects[0],
        configMultipleProjects.projects[1],
        {
          ...configMultipleProjects.projects[1],
          projectKey: 'PROJ2_COPY',
          projectName: 'Copy of Project Two',
        },
        configMultipleProjects.projects[2],
      ],
    });
  });
});
