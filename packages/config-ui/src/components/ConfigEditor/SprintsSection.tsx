'use client';

import type { JiraMockConfig } from '@jira-mock/core';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface SprintsSectionProps {
  config: JiraMockConfig;
  onChange: (config: JiraMockConfig) => void;
}

export function SprintsSection({ config, onChange }: SprintsSectionProps) {
  const sprints = config.sprints || {};

  const updateSprints = (updates: Partial<typeof sprints>) => {
    onChange({
      ...config,
      sprints: {
        ...sprints,
        ...updates,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sprints Configuration</CardTitle>
        <CardDescription>
          Configure sprint generation and assignment settings
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sprint-start-number">
            Start Sprint Number
          </Label>
          <Input
            id="sprint-start-number"
            type="number"
            min="1"
            value={sprints.startNumber ?? 1}
            onChange={(e) =>
              updateSprints({ startNumber: parseInt(e.target.value) || 1 })
            }
          />
          <p className="text-xs text-muted-foreground">
            First sprint number to generate
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sprint-duration">
            Sprint Duration (days)
          </Label>
          <Input
            id="sprint-duration"
            type="number"
            min="1"
            value={sprints.duration ?? 14}
            onChange={(e) =>
              updateSprints({ duration: parseInt(e.target.value) || 14 })
            }
          />
          <p className="text-xs text-muted-foreground">
            Length of each sprint in days
          </p>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="sprint-assign-prob">
            Sprint Assignment Probability
          </Label>
          <Slider
            id="sprint-assign-prob"
            min={0}
            max={1}
            step={0.01}
            value={sprints.assignProbability ?? 0.7}
            onChange={(e) =>
              updateSprints({ assignProbability: parseFloat(e.target.value) })
            }
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
          <p className="text-xs text-muted-foreground">
            Probability of assigning an issue to a sprint
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
