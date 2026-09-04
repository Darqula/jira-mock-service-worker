'use client';

import { useState } from 'react';
import type { JiraMockConfig } from '@jira-mock/core';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { X, Plus } from 'lucide-react';

interface DataSectionProps {
  config: JiraMockConfig;
  onChange: (config: JiraMockConfig) => void;
  projectIndex: number;
}

export function DataSection({ config, onChange, projectIndex }: DataSectionProps) {
  const data = config.projects[projectIndex]?.data || {};
  const [newAssignee, setNewAssignee] = useState('');
  const [newPriority, setNewPriority] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const updateData = (updates: Partial<typeof data>) => {
    const newProjects = [...config.projects];
    newProjects[projectIndex] = {
      ...newProjects[projectIndex],
      data: {
        ...data,
        ...updates,
      },
    };
    onChange({
      ...config,
      projects: newProjects,
    });
  };

  // Assignees
  const assignees = data.assignees || [];
  const addAssignee = () => {
    if (newAssignee.trim() && !assignees.includes(newAssignee.trim())) {
      updateData({ assignees: [...assignees, newAssignee.trim()] });
      setNewAssignee('');
    }
  };
  const removeAssignee = (email: string) => {
    updateData({ assignees: assignees.filter((a) => a !== email) });
  };

  // Priorities
  const priorities = data.priorities || ['Low', 'Medium', 'High', 'Highest'];
  const addPriority = () => {
    if (newPriority.trim() && !priorities.includes(newPriority.trim())) {
      updateData({ priorities: [...priorities, newPriority.trim()] });
      setNewPriority('');
    }
  };
  const removePriority = (priority: string) => {
    updateData({ priorities: priorities.filter((p) => p !== priority) });
  };

  // Labels
  const labels = data.labels || ['auto', 'generated', 'import', 'test'];
  const addLabel = () => {
    if (newLabel.trim() && !labels.includes(newLabel.trim())) {
      updateData({ labels: [...labels, newLabel.trim()] });
      setNewLabel('');
    }
  };
  const removeLabel = (label: string) => {
    updateData({ labels: labels.filter((l) => l !== label) });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Options</CardTitle>
        <CardDescription>
          Configure custom data for assignees, priorities, and labels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Assignees */}
        <div className="space-y-3">
          <Label>Assignees</Label>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="user@example.com"
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addAssignee()}
            />
            <Button type="button" onClick={addAssignee} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {assignees.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {assignees.map((email) => (
                <div
                  key={email}
                  className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm"
                >
                  <span>{email}</span>
                  <button
                    type="button"
                    onClick={() => removeAssignee(email)}
                    className="hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Custom assignee email addresses. Leave empty to use generated users.
          </p>
        </div>

        {/* Priorities */}
        <div className="space-y-3">
          <Label>Priorities</Label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Critical"
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addPriority()}
            />
            <Button type="button" onClick={addPriority} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {priorities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {priorities.map((priority) => (
                <div
                  key={priority}
                  className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm"
                >
                  <span>{priority}</span>
                  <button
                    type="button"
                    onClick={() => removePriority(priority)}
                    className="hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Priority names to use. Default: Low, Medium, High, Highest
          </p>
        </div>

        {/* Labels */}
        <div className="space-y-3">
          <Label>Labels</Label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="bug-fix"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addLabel()}
            />
            <Button type="button" onClick={addLabel} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {labels.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => (
                <div
                  key={label}
                  className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm"
                >
                  <span>{label}</span>
                  <button
                    type="button"
                    onClick={() => removeLabel(label)}
                    className="hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">Custom labels to use in issue generation</p>
        </div>
      </CardContent>
    </Card>
  );
}
