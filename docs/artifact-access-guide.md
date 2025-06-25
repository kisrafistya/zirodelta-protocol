# 📦 ZiroDelta Protocol - Artifacts Access Guide

## 🔍 Where Are My Uploaded Documents?

GitHub Actions artifacts are stored in GitHub's artifact storage system. Here's how to access them:

## 📍 **Direct Access Steps**

### Method 1: Through Actions Tab
1. **Go to your repository**: [https://github.com/kisrafistya/zirodelta-protocol](https://github.com/kisrafistya/zirodelta-protocol)
2. **Click "Actions" tab** (next to Pull requests)
3. **Click on any completed workflow run** (green checkmark ✅)
4. **Scroll to bottom** - Look for "Artifacts" section
5. **Download any artifact** by clicking on its name

### Method 2: Direct Links
- **Actions Dashboard**: [https://github.com/kisrafistya/zirodelta-protocol/actions](https://github.com/kisrafistya/zirodelta-protocol/actions)
- **Latest Runs**: Click on the most recent successful run

## 📋 **Available Artifact Types**

### 🔒 **Security Reports**
- `evm-security-reports` - EVM smart contract security analysis
- `solana-security-reports` - Solana program security analysis  
- `combined-security-report` - Multi-chain security summary
- `security-quality-reports` - Comprehensive security assessment

### 🧪 **Test Results**
- `evm-test-results` - EVM smart contract test results
- `solana-test-results` - Solana program test results
- `evm-integration-results` - EVM integration test reports
- `solana-integration-results` - Solana integration test reports
- `cross-chain-validation` - Cross-chain functionality tests
- `e2e-test-results` - End-to-end user journey tests

### ⚡ **Performance Analysis**
- `evm-performance-analysis` - EVM gas analysis and optimization
- `solana-performance-analysis` - Solana compute unit analysis
- `complete-performance-analysis` - Multi-chain performance summary
- `load-test-reports` - Stress testing and scalability analysis

### 🚀 **Deployment Reports**
- `deployment-final-report` - Production deployment status
- `staging-deployment-report-{version}` - Staging environment reports
- `production-readiness-report` - Pre-production validation

### 📚 **Documentation**
- `generated-documentation` - Auto-generated protocol documentation

## 🔧 **Troubleshooting**

### If You Can't See Artifacts:

1. **Check Permissions**: You must be logged into GitHub and have repository access
2. **Check Workflow Status**: Only successful workflows generate artifacts
3. **Check Timing**: Artifacts are available for 90 days after workflow completion
4. **Check Browser**: Try refreshing the page or using incognito mode

### Common Issues:

- **"No artifacts found"**: The workflow may have failed before artifact upload
- **"Access denied"**: You need repository access permissions
- **"Artifacts expired"**: Artifacts older than 90 days are automatically deleted

## 📱 **Quick Access Template**

```bash
# Replace {RUN_ID} with actual workflow run ID
https://github.com/kisrafistya/zirodelta-protocol/actions/runs/{RUN_ID}
```

## 💡 **Pro Tips**

- **Bookmark frequent artifacts**: Save direct links to often-used reports
- **Use workflow names**: Filter by workflow type (Security, Testing, Performance)
- **Check latest first**: Most recent runs appear at the top
- **Download all at once**: You can download multiple artifacts from one run

## 🎯 **Most Useful Artifacts for Development**

1. **For Security**: `combined-security-report`
2. **For Testing**: `e2e-test-results` 
3. **For Performance**: `complete-performance-analysis`
4. **For Deployment**: `production-readiness-report`
5. **For Documentation**: `generated-documentation`

---

**Need Help?** If you still can't find your artifacts, check the specific workflow run logs for any upload errors. 