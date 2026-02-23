#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const webRoot = path.join(repoRoot, 'apps', 'web');
const tokenFile = path.join(webRoot, 'app', 'lic-tokens.css');

const requiredTokenValues = {
  '--lic-paper': '#f7f5f0',
  '--lic-ink': '#0b0b0b',
  '--lic-graphite': '#3a3a3a',
  '--lic-slate': '#6b6b6b',
  '--lic-silver': '#a8a8a8',
  '--lic-fog': '#d4d2cd',
  '--lic-parchment': '#eceae4',
  '--lic-institutional': '#2b4c7e',
  '--lic-filing-red': '#8b2500',
  '--lic-ledger': '#2d5f3a',
  '--lic-radius': '0px',
  '--lic-motion-easing': 'linear',
};

const textExtensions = new Set(['.css', '.ts', '.tsx']);
const ignoredDirectories = new Set(['.next', 'node_modules']);
const violations = [];
const bannedManualCopyPatterns = [
  /standards\s+manual/i,
  /lic\s*\/\s*identity/i,
  /rev\.\s*\d{4}\s*[-—]\s*internal/i,
];

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function walkFiles(dirPath, files = []) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, files);
      continue;
    }

    if (textExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function normalize(value) {
  return value.trim().toLowerCase();
}

function checkTokenFile() {
  const source = readFile(tokenFile);

  for (const [token, expectedValue] of Object.entries(requiredTokenValues)) {
    const tokenPattern = new RegExp(`${token.replace(/[.*+?^${}()|[\\]\\]/g, '\\\\$&')}\\s*:\\s*([^;]+);`, 'i');
    const match = source.match(tokenPattern);
    if (!match) {
      violations.push(`${path.relative(repoRoot, tokenFile)}: missing required token ${token}`);
      continue;
    }

    const actual = normalize(match[1]);
    if (actual !== normalize(expectedValue)) {
      violations.push(
        `${path.relative(repoRoot, tokenFile)}: ${token} expected ${expectedValue} but found ${match[1].trim()}`,
      );
    }
  }
}

function checkFile(filePath) {
  const relativePath = path.relative(repoRoot, filePath);
  const source = readFile(filePath);
  const ext = path.extname(filePath);

  for (const pattern of bannedManualCopyPatterns) {
    if (pattern.test(source)) {
      violations.push(
        `${relativePath}: contains standards-manual documentation copy (${pattern.toString()}) which is not allowed in product UI`,
      );
    }
  }

  if (/linear-gradient|radial-gradient|conic-gradient|\bgradient\b/i.test(source)) {
    violations.push(`${relativePath}: gradient usage is not allowed`);
  }

  if (ext !== '.css') {
    if (/\bshadow(?:-[\w[\]/%:.]+)?\b/i.test(source)) {
      violations.push(`${relativePath}: shadow utility usage is not allowed`);
    }

    if (/\brounded(?:-[\w[\]/%:.]+)?\b/i.test(source)) {
      violations.push(`${relativePath}: rounded utility usage is not allowed`);
    }
  }

  if (filePath !== tokenFile) {
    const hexMatches = source.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
    if (hexMatches.length > 0) {
      violations.push(`${relativePath}: raw hex colors are not allowed outside apps/web/app/lic-tokens.css`);
    }
  }

  if (ext === '.css') {
    const borderRadiusPattern = /border-radius\s*:\s*([^;]+);/gi;
    let radiusMatch;
    while ((radiusMatch = borderRadiusPattern.exec(source)) !== null) {
      const value = normalize(radiusMatch[1]);
      if (!['0', '0px', 'var(--lic-radius)'].includes(value)) {
        violations.push(`${relativePath}: border-radius must be 0 or var(--lic-radius), found ${radiusMatch[1].trim()}`);
      }
    }

    const boxShadowPattern = /box-shadow\s*:\s*([^;]+);/gi;
    let shadowMatch;
    while ((shadowMatch = boxShadowPattern.exec(source)) !== null) {
      const value = normalize(shadowMatch[1]);
      if (!['none', 'var(--lic-focus)'].includes(value)) {
        violations.push(`${relativePath}: box-shadow must be none or var(--lic-focus), found ${shadowMatch[1].trim()}`);
      }
    }
  }
}

function main() {
  if (!fs.existsSync(webRoot)) {
    console.error('apps/web not found. Run this script from repository root.');
    process.exit(1);
  }

  if (!fs.existsSync(tokenFile)) {
    console.error('Token file not found at apps/web/app/lic-tokens.css');
    process.exit(1);
  }

  checkTokenFile();

  const files = walkFiles(webRoot);
  for (const filePath of files) {
    checkFile(filePath);
  }

  if (violations.length > 0) {
    console.error('LIC style guard check failed:\n');
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exit(1);
  }

  console.log('LIC style guard check passed.');
}

main();
