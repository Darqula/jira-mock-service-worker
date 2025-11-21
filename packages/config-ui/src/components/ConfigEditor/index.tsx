'use client';

import { useState, useEffect } from 'react';
import type { JiraMockConfig } from '@jira-mock/core';
import { validateConfig, getConfigErrors } from '@jira-mock/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ProjectsSection } from './ProjectsSection';
import { GeneralSection } from './GeneralSection';
import { StatusSection } from './StatusSection';
import { IssueTypesSection } from './IssueTypesSection';
import { SprintsSection } from './SprintsSection';
import { VersionsSection } from './VersionsSection';
import { WorklogsSection } from './WorklogsSection';
import { DataSection } from './DataSection';
import { PreviewSection } from './PreviewSection';
import { saveConfig, loadConfig, downloadConfig, uploadConfig } from '@/lib/config-manager';
import { Download, Upload, Save, FileJson } from 'lucide-react';

export function ConfigEditor() {
  const [config, setConfig] = useState<JiraMockConfig>({
    version: '1.0',
    projects: {
      count: 3,
      issuesPerProject: 50,
    },
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loaded = loadConfig();
    if (loaded) {
      setConfig(loaded);
    }
  }, []);

  useEffect(() => {
    const validationErrors = getConfigErrors(config);
    setErrors(validationErrors);
  }, [config]);

  const handleSave = () => {
    try {
      validateConfig(config);
      saveConfig(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  };

  const handleDownload = () => {
    downloadConfig(config);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const uploaded = await uploadConfig(file);
        setConfig(uploaded);
      } catch (error) {
        alert('Failed to upload config: ' + (error as Error).message);
      }
    }
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(config, null, 2);
    navigator.clipboard.writeText(json);
    alert('Config copied to clipboard!');
  };

  const isValid = errors.length === 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Action Buttons - Top */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSave} disabled={!isValid}>
              <Save className="mr-2 h-4 w-4" />
              Save to LocalStorage
            </Button>

            <Button onClick={handleDownload} variant="outline" disabled={!isValid}>
              <Download className="mr-2 h-4 w-4" />
              Download JSON
            </Button>

            <Button variant="outline" asChild>
              <label className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" />
                Upload JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={handleUpload}
                  className="hidden"
                />
              </label>
            </Button>

            <Button onClick={handleExportJSON} variant="outline" disabled={!isValid}>
              <FileJson className="mr-2 h-4 w-4" />
              Copy JSON
            </Button>
          </div>

          {/* Validation Errors */}
          {errors.length > 0 && (
            <div className="rounded-md bg-destructive/10 p-4 border border-destructive/20 mt-4">
              <h4 className="text-sm font-semibold text-destructive mb-2">
                Validation Errors
              </h4>
              <ul className="text-sm text-destructive/90 space-y-1">
                {errors.map((error, i) => (
                  <li key={i}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Success Message */}
          {saved && (
            <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800 mt-4">
              <p className="text-sm text-green-800 dark:text-green-200">
                Configuration saved successfully!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legacy Projects Section */}
      <Card>
        <CardHeader>
          <CardTitle>Legacy Project Configuration</CardTitle>
          <CardDescription>
            Basic project and issue count settings (required for backward compatibility)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectsSection config={config} onChange={setConfig} />
        </CardContent>
      </Card>

      {/* Seed Input */}
      <Card>
        <CardHeader>
          <CardTitle>Random Seed</CardTitle>
          <CardDescription>
            Optional seed for reproducible data generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="seed">Seed (optional)</Label>
            <Input
              id="seed"
              type="number"
              value={config.seed || ''}
              onChange={(e) =>
                setConfig({
                  ...config,
                  seed: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              placeholder="Leave empty for random data"
            />
            <p className="text-xs text-muted-foreground">
              Use the same seed to generate identical data across runs
            </p>
          </div>
        </CardContent>
      </Card>

      {/* General Settings */}
      <GeneralSection config={config} onChange={setConfig} />

      {/* Status Distribution */}
      <StatusSection config={config} onChange={setConfig} />

      {/* Issue Types */}
      <IssueTypesSection config={config} onChange={setConfig} />

      {/* Sprints */}
      <SprintsSection config={config} onChange={setConfig} />

      {/* Versions */}
      <VersionsSection config={config} onChange={setConfig} />

      {/* Worklogs */}
      <WorklogsSection config={config} onChange={setConfig} />

      {/* Data Options */}
      <DataSection config={config} onChange={setConfig} />

      {/* Preview Section */}
      {isValid && <PreviewSection config={config} />}
    </div>
  );
}
