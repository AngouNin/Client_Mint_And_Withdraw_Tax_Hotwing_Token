# Mint and Withdraw 1.5% Tax Spl 2022 token.

## Setup
Download [Node.js](https://nodejs.org/en/download/).
Run this followed commands:

``` bash
# Just be sure that you've got ts-node on you system
npm install -g ts-node

# Install dependencies (only for first time)
npm i

# Mint Token 2022 with 1.5% tax fee
npx ts-node mint.ts

# Withdraw Fee Token
npx ts-node withdraw.ts
```
## Process
### 1. First you have to set payerWallet.json.
####   We mint our token 2022 with 1.5% tax fee through this wallet.
### 2. Please install node_module and typescript.
   - install node.
   - npm install -g ts-node
### 3. Please run mint.ts file with "npx ts-node mint.ts".
   We can mint Token 2022 with 1.5% tax fee.

### 4. Please transfer some token to other wallet.
   You can check the balances of source wallet and destination wallet.
   If you send 2000 tokens to destination wallet.
``` bash
                                    before        after
    source wallet balance             X          X-2000
    destination wallet balance        Y          Y+1970
    Tax (Fee 1.5%)                                 30
```
### 5. Please run withdraw.ts file with "npx ts-node withdraw.ts"
   You can withdraw all tax tokens about your token account.
``` bash
                                    before        after
    source wallet balance           X-2000      X-2000+30  
```

## Thanks.    
