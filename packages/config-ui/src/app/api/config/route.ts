import { NextResponse } from 'next/server';
import { validateConfig, getConfigErrors } from '@jira-mock/core';
import type { JiraMockConfig } from '@jira-mock/core';

export async function POST(request: Request) {
  try {
    const config: JiraMockConfig = await request.json();

    // Validate the config
    const errors = getConfigErrors(config);
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      );
    }

    // If validation passes
    validateConfig(config);

    return NextResponse.json({
      success: true,
      message: 'Configuration is valid',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        errors: [(error as Error).message],
      },
      { status: 400 }
    );
  }
}
