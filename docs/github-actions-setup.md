# 🔧 GitHub Actions Setup Guide

This guide helps you configure the required environments and secrets for the ZiroDelta Protocol deployment workflow.

## 🏗️ Issues You Were Experiencing

The linter errors occurred because:

1. **Missing GitHub Environments**: The workflow referenced environments ('staging', 'production', 'emergency') that don't exist in your repository settings
2. **Missing Secrets**: The workflow tried to access secrets that haven't been configured yet
3. **Environment Protection Rules**: GitHub requires environments to be set up before referencing them in workflows

## 🔐 Required Secrets Configuration

### Navigate to Repository Settings
1. Go to your GitHub repository
2. Click **Settings** tab
3. In the sidebar, click **Secrets and variables** → **Actions**

### Add Required Secrets

#### 🧪 Staging Secrets
```
GOERLI_RPC_URL=https://goerli.infura.io/v3/YOUR_PROJECT_ID
MUMBAI_RPC_URL=https://polygon-mumbai.infura.io/v3/YOUR_PROJECT_ID
STAGING_PRIVATE_KEY=0xYOUR_STAGING_PRIVATE_KEY
SOLANA_STAGING_WALLET=PATH_TO_SOLANA_WALLET_JSON
```

#### 🚀 Production Secrets
```
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID
PRODUCTION_PRIVATE_KEY=0xYOUR_PRODUCTION_PRIVATE_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
POLYGONSCAN_API_KEY=YOUR_POLYGONSCAN_API_KEY
SOLANA_PRODUCTION_WALLET=PATH_TO_SOLANA_PRODUCTION_WALLET
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

## 🌍 Environment Setup (Optional)

If you want to use GitHub environment protection rules:

### 1. Create Environments
1. Go to **Settings** → **Environments**
2. Click **New environment**
3. Create these environments:
   - `staging`
   - `production` 
   - `emergency`

### 2. Configure Environment Protection
For each environment, you can set:
- **Required reviewers**: Team members who must approve deployments
- **Wait timer**: Delay before deployment starts
- **Deployment branches**: Which branches can deploy to this environment

### 3. Re-enable Environment References
After creating environments, you can uncomment these lines in the workflow:

```yaml
# In deploy-staging job:
environment: staging

# In deploy-mainnet job:
environment: 
  name: production
  url: https://app.zirodelta.com

# In rollback job:
environment: emergency
```

## 🔑 How to Get Required Keys

### 1. **Infura Project ID**
1. Sign up at [infura.io](https://infura.io)
2. Create a new project
3. Copy the Project ID from your dashboard

### 2. **Private Keys**
⚠️ **SECURITY WARNING**: Never commit private keys to code!

- Use separate wallets for staging and production
- For staging: Use testnet wallets with test tokens
- For production: Use hardware wallets or multi-sig wallets

### 3. **API Keys**
- **Etherscan**: Register at [etherscan.io/apis](https://etherscan.io/apis)
- **Polygonscan**: Register at [polygonscan.com/apis](https://polygonscan.com/apis)

### 4. **Solana Wallet**
```bash
# Generate new wallet
solana-keygen new --outfile ~/.config/solana/deploy-wallet.json

# For GitHub Actions, you'll need the base64 encoded wallet:
base64 ~/.config/solana/deploy-wallet.json
```

## 🔍 Testing Your Setup

### 1. **Validate Secrets**
Run this workflow manually to test your secrets:

```yaml
name: Test Secrets
on: workflow_dispatch
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - name: Test RPC URLs
      run: |
        echo "Testing Goerli connection..."
        curl -X POST ${{ secrets.GOERLI_RPC_URL }} \
          -H "Content-Type: application/json" \
          -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### 2. **Incremental Testing**
1. Start with staging deployment
2. Verify contracts deploy to testnets
3. Test mainnet deployment on a fork first
4. Deploy to production

## 🚨 Security Best Practices

### 1. **Principle of Least Privilege**
- Staging secrets should only work on testnets
- Production secrets should be highly secured
- Use different accounts/wallets for different environments

### 2. **Secret Rotation**
- Rotate secrets regularly
- Update all environments when rotating
- Monitor for unauthorized usage

### 3. **Environment Isolation**
- Never use production secrets in staging
- Test thoroughly in staging before production
- Use different API keys for different environments

## 🛠️ Quick Fix Summary

The workflow has been updated to:
- ✅ Remove invalid environment references
- ✅ Add fallback values for missing secrets
- ✅ Skip deployments gracefully when secrets are missing
- ✅ Show helpful warning messages

You can now:
1. Run the workflow without errors (deployments will be skipped)
2. Gradually add secrets as you set them up
3. Re-enable environments when ready

## 📞 Need Help?

If you encounter issues:
1. Check GitHub Actions logs for specific error messages
2. Verify secret names match exactly (case-sensitive)
3. Test RPC URLs manually before adding as secrets
4. Ensure wallet addresses have sufficient funds for gas

---

💡 **Pro Tip**: Start with staging environment only, get that working, then move to production configuration. 