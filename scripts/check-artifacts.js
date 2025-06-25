#!/usr/bin/env node

/**
 * ZiroDelta Protocol - GitHub Actions Artifacts Checker
 * This script helps you find and access uploaded artifacts from GitHub Actions
 */

console.log('🔍 ZiroDelta Protocol - Artifacts Location Guide');
console.log('================================================');
console.log('');

console.log('📋 Available Artifact Types:');
console.log('');

const artifactTypes = {
  '🔒 Security Reports': [
    'evm-security-reports',
    'solana-security-reports', 
    'combined-security-report',
    'security-quality-reports'
  ],
  '🧪 Test Results': [
    'evm-test-results',
    'solana-test-results',
    'evm-integration-results', 
    'solana-integration-results',
    'cross-chain-validation',
    'e2e-test-results'
  ],
  '⚡ Performance Analysis': [
    'evm-performance-analysis',
    'solana-performance-analysis',
    'complete-performance-analysis',
    'load-test-reports'
  ],
  '🚀 Deployment Reports': [
    'deployment-final-report',
    'staging-deployment-report-{version}',
    'production-readiness-report'
  ],
  '📚 Documentation': [
    'generated-documentation'
  ]
};

Object.entries(artifactTypes).forEach(([category, artifacts]) => {
  console.log(`${category}:`);
  artifacts.forEach(artifact => {
    console.log(`  - ${artifact}`);
  });
  console.log('');
});

console.log('🔗 How to Access Artifacts:');
console.log('');
console.log('1. Go to: https://github.com/kisrafistya/zirodelta-protocol/actions');
console.log('2. Click on any completed workflow run (✅ green checkmark)');
console.log('3. Scroll down to "Artifacts" section');
console.log('4. Click on artifact name to download');
console.log('');

console.log('📱 Quick Links:');
console.log(`- Repository: https://github.com/kisrafistya/zirodelta-protocol`);
console.log(`- Actions: https://github.com/kisrafistya/zirodelta-protocol/actions`);
console.log(`- Latest Run: https://github.com/kisrafistya/zirodelta-protocol/actions/runs/latest`);
console.log('');

console.log('💡 Tip: Artifacts are available for 90 days after workflow completion');
console.log('📝 Note: You must be logged into GitHub to download private repo artifacts');