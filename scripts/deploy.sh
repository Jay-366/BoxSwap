#!/bin/bash

# Build the program
echo "Building program..."
anchor build

# Deploy to devnet
echo "Deploying to devnet..."
anchor deploy --provider.cluster devnet

# Run the token manager deployment script
echo "Creating test tokens..."
ts-node scripts/deploy_token_manager.ts

echo "Deployment complete!" 