'use client';

import type { JiraMockConfig } from '@jira-mock/core';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface VersionsSectionProps {
  config: JiraMockConfig;
  onChange: (config: JiraMockConfig) => void;
}

export function VersionsSection({ config, onChange }: VersionsSectionProps) {
  const versions = config.versions || {};

  const updateVersions = (updates: Partial<typeof versions>) => {
    onChange({
      ...config,
      versions: {
        ...versions,
        ...updates,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Versions Configuration</CardTitle>
        <CardDescription>
          Configure version/release generation and assignment settings
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="version-start-number">
            Start Version Number
          </Label>
          <Input
            id="version-start-number"
            type="number"
            min="1"
            value={versions.startNumber ?? 1}
            onChange={(e) =>
              updateVersions({ startNumber: parseInt(e.target.value) || 1 })
            }
          />
          <p className="text-xs text-muted-foreground">
            First version number to generate
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="version-count">
            Version Count
          </Label>
          <Input
            id="version-count"
            type="number"
            min="0"
            value={versions.count ?? 3}
            onChange={(e) =>
              updateVersions({ count: parseInt(e.target.value) || 0 })
            }
          />
          <p className="text-xs text-muted-foreground">
            Number of versions to generate
          </p>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="version-assign-prob">
            Version Assignment Probability
          </Label>
          <Slider
            id="version-assign-prob"
            min={0}
            max={1}
            step={0.01}
            value={versions.assignProbability ?? 0.6}
            onChange={(e) =>
              updateVersions({ assignProbability: parseFloat(e.target.value) })
            }
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
          <p className="text-xs text-muted-foreground">
            Probability of assigning an issue to a version
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
