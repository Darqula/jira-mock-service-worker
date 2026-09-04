'use client';

import type { JiraMockConfig } from '@jira-mock/core';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface WorklogsSectionProps {
  config: JiraMockConfig;
  onChange: (config: JiraMockConfig) => void;
  projectIndex: number;
}

export function WorklogsSection({ config, onChange, projectIndex }: WorklogsSectionProps) {
  const worklogs = config.projects[projectIndex]?.worklogs || {};

  const updateWorklogs = (updates: Partial<typeof worklogs>) => {
    const newProjects = [...config.projects];
    newProjects[projectIndex] = {
      ...newProjects[projectIndex],
      worklogs: {
        ...worklogs,
        ...updates,
      },
    };
    onChange({
      ...config,
      projects: newProjects,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Worklogs Configuration</CardTitle>
        <CardDescription>Configure worklog generation settings for issues</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="worklog-probability">Worklog Probability</Label>
          <Slider
            id="worklog-probability"
            min={0}
            max={1}
            step={0.01}
            value={worklogs.probability ?? 0.6}
            onChange={(e) => updateWorklogs({ probability: parseFloat(e.target.value) })}
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
          <p className="text-xs text-muted-foreground">
            Probability of adding worklogs to an issue
          </p>
        </div>

        <div className="border-t pt-6">
          <h4 className="font-semibold mb-4">Hours per Worklog Entry</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="worklog-hours-min">Minimum Hours</Label>
              <Input
                id="worklog-hours-min"
                type="number"
                min="0"
                step="0.5"
                value={worklogs.hoursMin ?? 1}
                onChange={(e) => updateWorklogs({ hoursMin: parseFloat(e.target.value) || 1 })}
              />
              <p className="text-xs text-muted-foreground">Minimum hours per worklog entry</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="worklog-hours-max">Maximum Hours</Label>
              <Input
                id="worklog-hours-max"
                type="number"
                min="0"
                step="0.5"
                value={worklogs.hoursMax ?? 4}
                onChange={(e) => updateWorklogs({ hoursMax: parseFloat(e.target.value) || 4 })}
              />
              <p className="text-xs text-muted-foreground">Maximum hours per worklog entry</p>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h4 className="font-semibold mb-4">Worklog Entries per Issue</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="worklog-count-min">Minimum Entries</Label>
              <Input
                id="worklog-count-min"
                type="number"
                min="0"
                value={worklogs.countMin ?? 1}
                onChange={(e) => updateWorklogs({ countMin: parseInt(e.target.value) || 1 })}
              />
              <p className="text-xs text-muted-foreground">
                Minimum number of worklog entries per issue
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="worklog-count-max">Maximum Entries</Label>
              <Input
                id="worklog-count-max"
                type="number"
                min="0"
                value={worklogs.countMax ?? 3}
                onChange={(e) => updateWorklogs({ countMax: parseInt(e.target.value) || 3 })}
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of worklog entries per issue
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
