'use client';

import type { JiraMockConfig } from '@jira-mock/core';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ProjectsSectionProps {
  config: JiraMockConfig;
  onChange: (config: JiraMockConfig) => void;
}

export function ProjectsSection({ config, onChange }: ProjectsSectionProps) {
  const handleProjectCountChange = (value: string) => {
    const count = parseInt(value) || 1;
    onChange({
      ...config,
      projects: {
        ...config.projects,
        count: Math.max(1, Math.min(100, count)),
      },
    });
  };

  const handleIssuesPerProjectChange = (value: string) => {
    const issuesPerProject = parseInt(value) || 1;
    onChange({
      ...config,
      projects: {
        ...config.projects,
        issuesPerProject: Math.max(1, Math.min(10000, issuesPerProject)),
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="project-count">
          Number of Projects
          <span className="ml-2 text-xs text-muted-foreground">(1-100)</span>
        </Label>
        <Input
          id="project-count"
          type="number"
          min="1"
          max="100"
          value={config.projects.count}
          onChange={(e) => handleProjectCountChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          How many projects to generate
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="issues-per-project">
          Issues per Project
          <span className="ml-2 text-xs text-muted-foreground">(1-10,000)</span>
        </Label>
        <Input
          id="issues-per-project"
          type="number"
          min="1"
          max="10000"
          value={config.projects.issuesPerProject}
          onChange={(e) => handleIssuesPerProjectChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          How many issues to generate for each project
        </p>
      </div>
    </div>
  );
}
