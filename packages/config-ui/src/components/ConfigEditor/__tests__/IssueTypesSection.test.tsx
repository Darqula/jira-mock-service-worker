import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { IssueTypesSection } from '../IssueTypesSection';
import type { JiraMockConfig } from '@jira-mock/core';

describe('IssueTypesSection', () => {
  const mockOnChange = jest.fn();

  const defaultConfig: JiraMockConfig = {
    version: '1.0',
    projects: [
      {
        projectKey: 'TEST',
        issueCount: 50,
        issueTypes: {
          epic: {
            count: 10,
            childrenPerEpic: 100,
            assignProbability: 0.9,
            labelProbability: 0.8,
            childDistribution: {
              story: 0.5,
              task: 0.3,
              bug: 0.2,
            },
          },
          story: {
            standaloneCount: 0,
            assignProbability: 0.8,
            labelProbability: 0.5,
          },
          task: {
            standaloneCount: 0,
            assignProbability: 0.8,
            labelProbability: 0.5,
          },
          bug: {
            standaloneCount: 0,
            assignProbability: 0.6,
            labelProbability: 0.3,
          },
        },
      },
    ],
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders issue types configuration', () => {
    render(<IssueTypesSection config={defaultConfig} onChange={mockOnChange} projectIndex={0} />);

    expect(screen.getByText('Issue Types Configuration')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Epic' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Story' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Task' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bug' })).toBeInTheDocument();
  });

  it('switches between tabs', () => {
    render(<IssueTypesSection config={defaultConfig} onChange={mockOnChange} projectIndex={0} />);

    // Epic tab should be active by default
    expect(screen.getByDisplayValue('10')).toBeInTheDocument(); // Epic count

    // Switch to Story tab
    const storyTab = screen.getByRole('button', { name: 'Story' });
    fireEvent.click(storyTab);

    // Should see story fields
    expect(screen.getByLabelText(/Story Count/i)).toBeInTheDocument();
  });

  it('updates epic count', () => {
    render(<IssueTypesSection config={defaultConfig} onChange={mockOnChange} projectIndex={0} />);

    const epicCountInput = screen.getByDisplayValue('10');
    fireEvent.change(epicCountInput, { target: { value: '15' } });

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultConfig,
      projects: [
        {
          ...defaultConfig.projects[0],
          issueTypes: {
            ...defaultConfig.projects[0].issueTypes,
            epic: {
              ...defaultConfig.projects[0].issueTypes?.epic,
              count: 15,
            },
          },
        },
      ],
    });
  });

  it('updates children per epic', () => {
    render(<IssueTypesSection config={defaultConfig} onChange={mockOnChange} projectIndex={0} />);

    const childrenInput = screen.getByDisplayValue('100');
    fireEvent.change(childrenInput, { target: { value: '150' } });

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultConfig,
      projects: [
        {
          ...defaultConfig.projects[0],
          issueTypes: {
            ...defaultConfig.projects[0].issueTypes,
            epic: {
              ...defaultConfig.projects[0].issueTypes?.epic,
              childrenPerEpic: 150,
            },
          },
        },
      ],
    });
  });

  it('updates story standalone count', () => {
    render(<IssueTypesSection config={defaultConfig} onChange={mockOnChange} projectIndex={0} />);

    // Switch to Story tab
    const storyTab = screen.getByRole('button', { name: 'Story' });
    fireEvent.click(storyTab);

    const storyCountInput = screen.getByDisplayValue('0');
    fireEvent.change(storyCountInput, { target: { value: '20' } });

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultConfig,
      projects: [
        {
          ...defaultConfig.projects[0],
          issueTypes: {
            ...defaultConfig.projects[0].issueTypes,
            story: {
              ...defaultConfig.projects[0].issueTypes?.story,
              standaloneCount: 20,
            },
          },
        },
      ],
    });
  });

  it('handles empty issue types configuration', () => {
    const emptyConfig: JiraMockConfig = {
      version: '1.0',
      projects: [{ projectKey: 'TEST', issueCount: 50 }],
    };

    render(<IssueTypesSection config={emptyConfig} onChange={mockOnChange} projectIndex={0} />);

    // Should still render without errors with default values
    expect(screen.getByText('Issue Types Configuration')).toBeInTheDocument();
  });
});
