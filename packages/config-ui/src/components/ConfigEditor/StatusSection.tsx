'use client';

import type { JiraMockConfig } from '@jira-mock/core';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface StatusSectionProps {
  config: JiraMockConfig;
  onChange: (config: JiraMockConfig) => void;
  projectIndex: number;
}

export function StatusSection({ config, onChange, projectIndex }: StatusSectionProps) {
  const status = config.projects[projectIndex]?.statusDistribution || {};

  const updateStatus = (updates: Partial<typeof status>) => {
    const newProjects = [...config.projects];
    newProjects[projectIndex] = {
      ...newProjects[projectIndex],
      statusDistribution: {
        ...status,
        ...updates,
      },
    };
    onChange({
      ...config,
      projects: newProjects,
    });
  };

  const toDo = status.toDo ?? 0.4;
  const inProgress = status.inProgress ?? 0.3;
  const done = status.done ?? 0.3;
  const total = toDo + inProgress + done;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Distribution</CardTitle>
        <CardDescription>
          Configure the probability of each status (should sum to 1.0)
          {total !== 1.0 && (
            <span className="ml-2 text-destructive font-medium">
              Current total: {total.toFixed(2)}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="status-todo">To Do</Label>
          <Slider
            id="status-todo"
            min={0}
            max={1}
            step={0.01}
            value={toDo}
            onChange={(e) => updateStatus({ toDo: parseFloat(e.target.value) })}
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
          <p className="text-xs text-muted-foreground">
            Probability of issues being in &quot;To Do&quot; status
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status-in-progress">In Progress</Label>
          <Slider
            id="status-in-progress"
            min={0}
            max={1}
            step={0.01}
            value={inProgress}
            onChange={(e) => updateStatus({ inProgress: parseFloat(e.target.value) })}
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
          <p className="text-xs text-muted-foreground">
            Probability of issues being in &quot;In Progress&quot; status
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status-done">Done</Label>
          <Slider
            id="status-done"
            min={0}
            max={1}
            step={0.01}
            value={done}
            onChange={(e) => updateStatus({ done: parseFloat(e.target.value) })}
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
          <p className="text-xs text-muted-foreground">
            Probability of issues being in &quot;Done&quot; status
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
