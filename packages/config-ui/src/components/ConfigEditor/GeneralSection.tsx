'use client';

import type { JiraMockConfig } from '@jira-mock/core';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GeneralSectionProps {
  config: JiraMockConfig;
  onChange: (config: JiraMockConfig) => void;
}

export function GeneralSection({ config, onChange }: GeneralSectionProps) {
  const general = config.general || {};

  const updateGeneral = (updates: Partial<typeof general>) => {
    onChange({
      ...config,
      general: {
        ...general,
        ...updates,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="project-key">
            Project Key
          </Label>
          <Input
            id="project-key"
            type="text"
            value={general.projectKey || 'PROJ'}
            onChange={(e) => updateGeneral({ projectKey: e.target.value.toUpperCase() })}
            placeholder="PROJ"
          />
          <p className="text-xs text-muted-foreground">
            Prefix for issue keys (e.g., PROJ-1, PROJ-2)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="project-type">
            Project Type
          </Label>
          <Select
            id="project-type"
            value={general.projectType || 'company-managed'}
            onChange={(e) =>
              updateGeneral({
                projectType: e.target.value as 'company-managed' | 'team-managed',
              })
            }
          >
            <option value="company-managed">Company-managed</option>
            <option value="team-managed">Team-managed</option>
          </Select>
          <p className="text-xs text-muted-foreground">
            Jira project type
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="start-issue-number">
            Start Issue Number
          </Label>
          <Input
            id="start-issue-number"
            type="number"
            min="1"
            value={general.startIssueNumber || 1}
            onChange={(e) =>
              updateGeneral({ startIssueNumber: parseInt(e.target.value) || 1 })
            }
          />
          <p className="text-xs text-muted-foreground">
            First issue number to generate
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="chunk-size">
            Export Chunk Size
          </Label>
          <Input
            id="chunk-size"
            type="number"
            min="0"
            value={general.chunkSize || 0}
            onChange={(e) =>
              updateGeneral({ chunkSize: parseInt(e.target.value) || 0 })
            }
          />
          <p className="text-xs text-muted-foreground">
            Split export into chunks (0 = no chunking)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="start-date">
            Start Date
          </Label>
          <Input
            id="start-date"
            type="date"
            value={
              general.startDate ||
              new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0]
            }
            onChange={(e) => updateGeneral({ startDate: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Earliest date for generated issues
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="end-date">
            End Date
          </Label>
          <Input
            id="end-date"
            type="date"
            value={
              general.endDate || new Date().toISOString().split('T')[0]
            }
            onChange={(e) => updateGeneral({ endDate: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Latest date for generated issues
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
