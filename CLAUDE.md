# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the "Organize Folder" project - a file organization tool Electron App built with TypeScript, HTML, CSS, and SQLite.

## Tech Stack

- **Electron** - Framework for building cross-platform desktop applications
- **TypeScript** - Primary language for application logic
- **HTML/CSS** - User interface
- **SQLite** - Database for storing file organization data
- **Windows** - Development environment

## Development Setup

Development commands:

```bash
npm install          # Install dependencies
npm run build        # Build TypeScript and webpack bundles
npm run dev          # Build and start Electron app (simple mode)
npm run dev:watch    # Development with hot reload (watch mode)
npm run test         # Run Playwright tests
npm run storybook    # Start Storybook component library
npm run dist         # Build and package as executable
```

## Code Architecture

The project structure will likely follow a typical TypeScript application pattern:
- TypeScript modules for core functionality
- HTML templates for UI
- CSS for styling
- SQLite database for persistence
- Potential separation of concerns between file system operations and database management

## Windows Development Notes

- Use Windows-compatible file paths
- Consider PowerShell/Command Prompt commands
- Handle Windows-specific file system behaviors
- Use `dir` instead of `ls`, `type` instead of `cat`

## Database Considerations

- SQLite database will store file organization metadata
- Use parameterized queries to prevent SQL injection
- Consider database migrations for schema changes
- Handle database locking appropriately

## Development Guidelines

- Use TypeScript strict mode for better type safety
- Follow standard TypeScript naming conventions
- Organize code by feature/functionality
- Handle file system operations with proper error checking
- Ensure database operations are transaction-safe
