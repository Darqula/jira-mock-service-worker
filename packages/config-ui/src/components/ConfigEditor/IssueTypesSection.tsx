'use client';

import { useState } from 'react';
import type { JiraMockConfig } from '@jira-mock/core';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface IssueTypesSectionProps {
  config: JiraMockConfig;
  onChange: (config: JiraMockConfig) => void;
}

export function IssueTypesSection({ config, onChange }: IssueTypesSectionProps) {
  const [activeTab, setActiveTab] = useState<'epic' | 'story' | 'task' | 'bug'>('epic');
  const issueTypes = config.globalDefaults?.issueTypes || {};

  const updateIssueTypes = (updates: Partial<typeof issueTypes>) => {
    onChange({
      ...config,
      globalDefaults: {
        ...config.globalDefaults,
        issueTypes: {
          ...issueTypes,
          ...updates,
        },
      },
    });
  };

  // Epic configuration
  const epic = issueTypes.epic || {};
  const updateEpic = (updates: Partial<typeof epic>) => {
    updateIssueTypes({ epic: { ...epic, ...updates } });
  };

  // Story configuration
  const story = issueTypes.story || {};
  const updateStory = (updates: Partial<typeof story>) => {
    updateIssueTypes({ story: { ...story, ...updates } });
  };

  // Task configuration
  const task = issueTypes.task || {};
  const updateTask = (updates: Partial<typeof task>) => {
    updateIssueTypes({ task: { ...task, ...updates } });
  };

  // Bug configuration
  const bug = issueTypes.bug || {};
  const updateBug = (updates: Partial<typeof bug>) => {
    updateIssueTypes({ bug: { ...bug, ...updates } });
  };

  // Child distribution
  const childDist = epic.childDistribution || {};
  const updateChildDist = (updates: Partial<typeof childDist>) => {
    updateEpic({
      childDistribution: {
        ...childDist,
        ...updates,
      },
    });
  };

  const tabs = [
    { id: 'epic' as const, label: 'Epic' },
    { id: 'story' as const, label: 'Story' },
    { id: 'task' as const, label: 'Task' },
    { id: 'bug' as const, label: 'Bug' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Issue Types Configuration</CardTitle>
        <CardDescription>
          Configure counts and probabilities for different issue types
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Tabs */}
        <div className="flex space-x-1 mb-6 border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Epic Panel */}
        {activeTab === 'epic' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="epic-count">Epic Count</Label>
                <Input
                  id="epic-count"
                  type="number"
                  min="0"
                  value={epic.count ?? 10}
                  onChange={(e) =>
                    updateEpic({ count: parseInt(e.target.value) || 0 })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  How many epics to generate
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="epic-children">Children per Epic</Label>
                <Input
                  id="epic-children"
                  type="number"
                  min="0"
                  value={epic.childrenPerEpic ?? 100}
                  onChange={(e) =>
                    updateEpic({ childrenPerEpic: parseInt(e.target.value) || 0 })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Tasks created under each epic
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="epic-assign-prob">Assign Probability</Label>
                <Slider
                  id="epic-assign-prob"
                  min={0}
                  max={1}
                  step={0.01}
                  value={epic.assignProbability ?? 0.9}
                  onChange={(e) =>
                    updateEpic({ assignProbability: parseFloat(e.target.value) })
                  }
                  formatValue={(v) => `${Math.round(v * 100)}%`}
                />
                <p className="text-xs text-muted-foreground">
                  Chance to assign epic to a user
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="epic-label-prob">Label Probability</Label>
                <Slider
                  id="epic-label-prob"
                  min={0}
                  max={1}
                  step={0.01}
                  value={epic.labelProbability ?? 0.8}
                  onChange={(e) =>
                    updateEpic({ labelProbability: parseFloat(e.target.value) })
                  }
                  formatValue={(v) => `${Math.round(v * 100)}%`}
                />
                <p className="text-xs text-muted-foreground">
                  Chance to add labels to epic
                </p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="font-semibold mb-4">Child Task Distribution</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="child-story-prob">Story Distribution</Label>
                  <Slider
                    id="child-story-prob"
                    min={0}
                    max={1}
                    step={0.01}
                    value={childDist.story ?? 0.5}
                    onChange={(e) =>
                      updateChildDist({ story: parseFloat(e.target.value) })
                    }
                    formatValue={(v) => `${Math.round(v * 100)}%`}
                  />
                  <p className="text-xs text-muted-foreground">
                    How often Story tasks are created
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="child-task-prob">Task Distribution</Label>
                  <Slider
                    id="child-task-prob"
                    min={0}
                    max={1}
                    step={0.01}
                    value={childDist.task ?? 0.3}
                    onChange={(e) =>
                      updateChildDist({ task: parseFloat(e.target.value) })
                    }
                    formatValue={(v) => `${Math.round(v * 100)}%`}
                  />
                  <p className="text-xs text-muted-foreground">
                    How often Task tasks are created
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="child-bug-prob">Bug Distribution</Label>
                  <Slider
                    id="child-bug-prob"
                    min={0}
                    max={1}
                    step={0.01}
                    value={childDist.bug ?? 0.2}
                    onChange={(e) =>
                      updateChildDist({ bug: parseFloat(e.target.value) })
                    }
                    formatValue={(v) => `${Math.round(v * 100)}%`}
                  />
                  <p className="text-xs text-muted-foreground">
                    How often Bug tasks are created
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Story Panel */}
        {activeTab === 'story' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="story-count">Story Count (Standalone)</Label>
                <Input
                  id="story-count"
                  type="number"
                  min="0"
                  value={story.standaloneCount ?? 0}
                  onChange={(e) =>
                    updateStory({ standaloneCount: parseInt(e.target.value) || 0 })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Number of stories created outside epics
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="story-assign-prob">Assign Probability</Label>
                <Slider
                  id="story-assign-prob"
                  min={0}
                  max={1}
                  step={0.01}
                  value={story.assignProbability ?? 0.8}
                  onChange={(e) =>
                    updateStory({ assignProbability: parseFloat(e.target.value) })
                  }
                  formatValue={(v) => `${Math.round(v * 100)}%`}
                />
                <p className="text-xs text-muted-foreground">
                  Chance to assign story to a user
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="story-label-prob">Label Probability</Label>
                <Slider
                  id="story-label-prob"
                  min={0}
                  max={1}
                  step={0.01}
                  value={story.labelProbability ?? 0.5}
                  onChange={(e) =>
                    updateStory({ labelProbability: parseFloat(e.target.value) })
                  }
                  formatValue={(v) => `${Math.round(v * 100)}%`}
                />
                <p className="text-xs text-muted-foreground">
                  Chance to add labels to story
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Task Panel */}
        {activeTab === 'task' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-count">Task Count (Standalone)</Label>
                <Input
                  id="task-count"
                  type="number"
                  min="0"
                  value={task.standaloneCount ?? 0}
                  onChange={(e) =>
                    updateTask({ standaloneCount: parseInt(e.target.value) || 0 })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Number of tasks created outside epics
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-assign-prob">Assign Probability</Label>
                <Slider
                  id="task-assign-prob"
                  min={0}
                  max={1}
                  step={0.01}
                  value={task.assignProbability ?? 0.8}
                  onChange={(e) =>
                    updateTask({ assignProbability: parseFloat(e.target.value) })
                  }
                  formatValue={(v) => `${Math.round(v * 100)}%`}
                />
                <p className="text-xs text-muted-foreground">
                  Chance to assign task to a user
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-label-prob">Label Probability</Label>
                <Slider
                  id="task-label-prob"
                  min={0}
                  max={1}
                  step={0.01}
                  value={task.labelProbability ?? 0.5}
                  onChange={(e) =>
                    updateTask({ labelProbability: parseFloat(e.target.value) })
                  }
                  formatValue={(v) => `${Math.round(v * 100)}%`}
                />
                <p className="text-xs text-muted-foreground">
                  Chance to add labels to task
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bug Panel */}
        {activeTab === 'bug' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bug-count">Bug Count (Standalone)</Label>
                <Input
                  id="bug-count"
                  type="number"
                  min="0"
                  value={bug.standaloneCount ?? 0}
                  onChange={(e) =>
                    updateBug({ standaloneCount: parseInt(e.target.value) || 0 })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Number of bugs created outside epics
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bug-assign-prob">Assign Probability</Label>
                <Slider
                  id="bug-assign-prob"
                  min={0}
                  max={1}
                  step={0.01}
                  value={bug.assignProbability ?? 0.6}
                  onChange={(e) =>
                    updateBug({ assignProbability: parseFloat(e.target.value) })
                  }
                  formatValue={(v) => `${Math.round(v * 100)}%`}
                />
                <p className="text-xs text-muted-foreground">
                  Chance to assign bug to a user
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bug-label-prob">Label Probability</Label>
                <Slider
                  id="bug-label-prob"
                  min={0}
                  max={1}
                  step={0.01}
                  value={bug.labelProbability ?? 0.3}
                  onChange={(e) =>
                    updateBug({ labelProbability: parseFloat(e.target.value) })
                  }
                  formatValue={(v) => `${Math.round(v * 100)}%`}
                />
                <p className="text-xs text-muted-foreground">
                  Chance to add labels to bug
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
