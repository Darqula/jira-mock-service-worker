'use client';

import { useState } from 'react';
import type { JiraMockConfig, ProjectConfigWithKey } from '@jira-mock/core';
import { calculateIssueCount } from '@jira-mock/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Plus, Trash2, ChevronDown, ChevronRight, Copy } from 'lucide-react';
import { StatusSection } from './StatusSection';
import { IssueTypesSection } from './IssueTypesSection';
import { SprintsSection } from './SprintsSection';
import { VersionsSection } from './VersionsSection';
import { WorklogsSection } from './WorklogsSection';
import { DataSection } from './DataSection';

interface ProjectsManagerProps {
  config: JiraMockConfig;
  onChange: (config: JiraMockConfig) => void;
}

export function ProjectsManager({ config, onChange }: ProjectsManagerProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set([0]));

  // Mirrors the generation rules: explicit issueCount (clamped up to the
  // epic count) wins; otherwise the count is derived from the issue types.
  const projectIssueCount = (project: ProjectConfigWithKey): number =>
    project.issueCount === undefined
      ? calculateIssueCount(project)
      : Math.max(project.issueCount, project.issueTypes?.epic?.count || 0);

  const toggleProject = (index: number) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedProjects(newExpanded);
  };

  const addProject = () => {
    const newProjectNumber = config.projects.length + 1;
    const newProject: ProjectConfigWithKey = {
      projectKey: `PROJ${newProjectNumber}`,
    };

    onChange({
      ...config,
      projects: [...config.projects, newProject],
    });

    // Expand the newly added project
    setExpandedProjects(new Set([...expandedProjects, config.projects.length]));
  };

  const removeProject = (index: number) => {
    if (config.projects.length === 1) {
      alert('Cannot remove the last project. At least one project is required.');
      return;
    }

    onChange({
      ...config,
      projects: config.projects.filter((_, i) => i !== index),
    });

    // Remove from expanded set
    const newExpanded = new Set(expandedProjects);
    newExpanded.delete(index);
    setExpandedProjects(newExpanded);
  };

  const cloneProject = (index: number) => {
    const sourceProject = config.projects[index];

    // Generate a unique project key
    let newProjectKey = `${sourceProject.projectKey}_COPY`;
    let counter = 1;

    // Ensure the project key is unique
    while (config.projects.some((p) => p.projectKey === newProjectKey)) {
      counter++;
      newProjectKey = `${sourceProject.projectKey}_COPY${counter}`;
    }

    // Deep clone the project configuration
    const clonedProject: ProjectConfigWithKey = {
      ...JSON.parse(JSON.stringify(sourceProject)),
      projectKey: newProjectKey,
      projectName: sourceProject.projectName ? `Copy of ${sourceProject.projectName}` : undefined,
    };

    // Insert the cloned project after the source project
    const newProjects = [
      ...config.projects.slice(0, index + 1),
      clonedProject,
      ...config.projects.slice(index + 1),
    ];

    onChange({
      ...config,
      projects: newProjects,
    });

    // Expand the newly cloned project and adjust indices
    const newExpanded = new Set<number>();
    expandedProjects.forEach((expandedIndex) => {
      if (expandedIndex <= index) {
        newExpanded.add(expandedIndex);
      } else {
        newExpanded.add(expandedIndex + 1);
      }
    });
    newExpanded.add(index + 1);
    setExpandedProjects(newExpanded);
  };

  const updateProject = (index: number, updates: Partial<ProjectConfigWithKey>) => {
    const newProjects = [...config.projects];
    newProjects[index] = { ...newProjects[index], ...updates };

    onChange({
      ...config,
      projects: newProjects,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Projects ({config.projects.length})</h3>
          <p className="text-sm text-muted-foreground">
            Configure individual projects with unique settings
          </p>
        </div>
        <Button onClick={addProject} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Project
        </Button>
      </div>

      <div className="space-y-3">
        {config.projects.map((project, index) => (
          <Card key={index} className="border-2">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 flex-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleProject(index)}
                    className="h-6 w-6 p-0"
                  >
                    {expandedProjects.has(index) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                  <div>
                    <CardTitle className="text-base">
                      {project.projectKey} - {project.projectName || 'Unnamed Project'}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {projectIssueCount(project)} issues
                      {project.projectType && ` • ${project.projectType}`}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => cloneProject(index)}
                    className="hover:bg-accent"
                    aria-label={`Clone project ${project.projectKey}`}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProject(index)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    aria-label={`Remove project ${project.projectKey}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {expandedProjects.has(index) && (
              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-2 gap-4">
                  {/* Project Key */}
                  <div className="space-y-2">
                    <Label htmlFor={`project-key-${index}`}>
                      Project Key *
                      <span className="ml-2 text-xs text-muted-foreground">(Required, unique)</span>
                    </Label>
                    <Input
                      id={`project-key-${index}`}
                      value={project.projectKey}
                      onChange={(e) =>
                        updateProject(index, { projectKey: e.target.value.toUpperCase() })
                      }
                      placeholder="PROJ"
                      maxLength={10}
                      required
                    />
                  </div>

                  {/* Project Name */}
                  <div className="space-y-2">
                    <Label htmlFor={`project-name-${index}`}>
                      Project Name
                      <span className="ml-2 text-xs text-muted-foreground">(Optional)</span>
                    </Label>
                    <Input
                      id={`project-name-${index}`}
                      value={project.projectName || ''}
                      onChange={(e) =>
                        updateProject(index, {
                          projectName: e.target.value || undefined,
                        })
                      }
                      placeholder="My Project"
                    />
                  </div>

                  {/* Calculated Issue Count */}
                  <div className="space-y-2">
                    <Label>
                      Issue Count (Calculated)
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Based on issue types)
                      </span>
                    </Label>
                    <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center text-sm">
                      {calculateIssueCount(project).toLocaleString()}
                    </div>
                  </div>

                  {/* Project Type */}
                  <div className="space-y-2">
                    <Label htmlFor={`project-type-${index}`}>Project Type</Label>
                    <Select
                      id={`project-type-${index}`}
                      value={project.projectType || 'company-managed'}
                      onChange={(e) =>
                        updateProject(index, {
                          projectType: e.target.value as 'company-managed' | 'team-managed',
                        })
                      }
                    >
                      <option value="company-managed">Company-managed</option>
                      <option value="team-managed">Team-managed</option>
                    </Select>
                  </div>

                  {/* Start Issue Number */}
                  <div className="space-y-2">
                    <Label htmlFor={`start-issue-${index}`}>
                      Start Issue Number
                      <span className="ml-2 text-xs text-muted-foreground">(Optional)</span>
                    </Label>
                    <Input
                      id={`start-issue-${index}`}
                      type="number"
                      min="1"
                      value={project.startIssueNumber || ''}
                      onChange={(e) =>
                        updateProject(index, {
                          startIssueNumber: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      placeholder="1"
                    />
                  </div>

                  {/* Seed */}
                  <div className="space-y-2">
                    <Label htmlFor={`seed-${index}`}>
                      Seed
                      <span className="ml-2 text-xs text-muted-foreground">(Optional)</span>
                    </Label>
                    <Input
                      id={`seed-${index}`}
                      type="number"
                      value={project.seed || ''}
                      onChange={(e) =>
                        updateProject(index, {
                          seed: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      placeholder="Random seed"
                    />
                  </div>
                </div>

                {/* Configuration Sections */}
                <div className="pt-4 border-t space-y-4">
                  <div className="flex flex-col gap-2 mb-4">
                    <h4 className="font-semibold text-sm">Project Configuration</h4>
                    <p className="text-xs text-muted-foreground">
                      Configure project-specific settings below. If not specified, built-in defaults
                      will be used.
                    </p>
                  </div>

                  <StatusSection config={config} onChange={onChange} projectIndex={index} />

                  <IssueTypesSection config={config} onChange={onChange} projectIndex={index} />

                  <SprintsSection config={config} onChange={onChange} projectIndex={index} />

                  <VersionsSection config={config} onChange={onChange} projectIndex={index} />

                  <WorklogsSection config={config} onChange={onChange} projectIndex={index} />

                  <DataSection config={config} onChange={onChange} projectIndex={index} />
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
