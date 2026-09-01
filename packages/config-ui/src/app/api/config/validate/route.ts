import { NextResponse } from 'next/server';
import { getConfigErrors } from '@jira-mock/core';
import type { JiraMockConfig } from '@jira-mock/core';

export async function POST(request: Request) {
  try {
    const config: JiraMockConfig = await request.json();
    const errors = getConfigErrors(config);

    return NextResponse.json({
      valid: errors.length === 0,
      errors,
    });
  } catch {
    return NextResponse.json(
      {
        valid: false,
        errors: ['Invalid JSON format'],
      },
      { status: 400 }
    );
  }
}
