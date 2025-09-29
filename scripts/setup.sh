#!/bin/bash

# NaaS Calculator Setup Script
# Sets up development environment and runs initial tests

set -e

echo "🚀 Setting up NaaS Pricing Calculator..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | sed 's/v//')
REQUIRED_VERSION="16.0.0"

if ! node -e "process.exit(require('semver').gte('${NODE_VERSION}', '${REQUIRED_VERSION}') ? 0 : 1)" 2>/dev/null; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please upgrade to Node.js 16+ first."
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run linting
echo "🔍 Running code quality checks..."
npm run lint:check || {
    echo "⚠️  Linting issues found. Running auto-fix..."
    npm run lint
}

# Run type checking (if TypeScript)
if [ -f "tsconfig.json" ]; then
    echo "🔍 Running type checks..."
    npm run typecheck
fi

# Run unit tests
echo "🧪 Running unit tests..."
npm run test:run

# Check test coverage
echo "📊 Checking test coverage..."
npm run test:run -- --coverage

# Build the project
echo "🏗️  Building project..."
npm run build

# Verify build
if [ -d "dist" ]; then
    echo "✅ Build successful - dist folder created"
else
    echo "❌ Build failed - no dist folder found"
    exit 1
fi

echo ""
echo "🎉 Setup complete! Your NaaS Calculator is ready for development."
echo ""
echo "Available commands:"
echo "  npm run dev          - Start development server"
echo "  npm run test         - Run tests in watch mode"
echo "  npm run test:e2e     - Run end-to-end tests"
echo "  npm run build        - Build for production"
echo "  npm run preview      - Preview production build"
echo ""
echo "To get started:"
echo "  npm run dev"
echo ""