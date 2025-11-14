'use client';

import type { JiraMockConfig } from '@jira-mock/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, FileText, Users, FolderKanban } from 'lucide-react';

interface PreviewSectionProps {
  config: JiraMockConfig;
}

export function PreviewSection({ config }: PreviewSectionProps) {
  const totalIssues = config.projects.count * config.projects.issuesPerProject;
  const estimatedUsers = Math.min(20, Math.max(10, config.projects.count * 3));

  // Rough estimation: ~2KB per issue, ~0.5KB per project, ~0.3KB per user
  const estimatedSize = (
    (totalIssues * 2) +
    (config.projects.count * 0.5) +
    (estimatedUsers * 0.3)
  ).toFixed(1);

  // Rough estimation: ~1ms per issue for generation
  const estimatedTime = (totalIssues / 1000).toFixed(2);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview</CardTitle>
        <CardDescription>
          What will be generated with this configuration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Projects */}
          <div className="flex items-start space-x-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900">
              <FolderKanban className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {config.projects.count}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">Projects</p>
            </div>
          </div>

          {/* Issues */}
          <div className="flex items-start space-x-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <div className="p-2 rounded-md bg-green-100 dark:bg-green-900">
              <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {totalIssues.toLocaleString()}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">Total Issues</p>
            </div>
          </div>

          {/* Users */}
          <div className="flex items-start space-x-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
            <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                ~{estimatedUsers}
              </p>
              <p className="text-sm text-purple-700 dark:text-purple-300">Users</p>
            </div>
          </div>

          {/* Data Size */}
          <div className="flex items-start space-x-3 p-4 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
            <div className="p-2 rounded-md bg-orange-100 dark:bg-orange-900">
              <Database className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                ~{estimatedSize}KB
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300">Est. Size</p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold mb-2">Estimated Generation Time</h4>
          <p className="text-sm text-muted-foreground">
            ~{estimatedTime} seconds for {totalIssues.toLocaleString()} issues
          </p>
        </div>

        <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-semibold mb-2 text-blue-900 dark:text-blue-100">
            What&apos;s included:
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• {config.projects.count} Projects with metadata</li>
            <li>• {totalIssues.toLocaleString()} Issues with realistic data</li>
            <li>• ~{estimatedUsers} Users (reporters, assignees, etc.)</li>
            <li>• Issue types, priorities, statuses, and fields</li>
            <li>• Components and versions for each project</li>
            <li>• Worklogs for issues</li>
            {config.seed && <li>• Reproducible data (seed: {config.seed})</li>}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
