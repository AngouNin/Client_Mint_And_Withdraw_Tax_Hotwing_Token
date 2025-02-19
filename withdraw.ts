import { Signer } from '@solana/web3.js/lib';
import fs from 'fs';
import path from 'path';

async function main () {
    const { Connection, Keypair, clusterApiUrl, PublicKey } = await import("@solana/web3.js");
    const { getTransferFeeAmount, TOKEN_2022_PROGRAM_ID, harvestWithheldTokensToMint, unpackAccount, withdrawWithheldTokensFromAccounts, withdrawWithheldTokensFromMint } = await import("@solana/spl-token");

    // Connection to devnet cluster
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    
    // Define the path to your keypair JSON file
    const keypairPath = path.join(process.cwd(), 'payerWallet.json'); // Using process.cwd() for better compatibility

    // Read the keypair file
    const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));

    // Create a Keypair from the JSON data
    const payer = Keypair.fromSecretKey(new Uint8Array(keypairData));

    // Transaction signature returned from sent transaction
    let transactionSignature: string;
    const tokenMintAddress = '4brw3G9A6JTiaQLoPNDwQTuF3Hkj8KmfGMzeBsiBqYyv';
    const sourceWalletForFee = 'AziR2WVaX8rgceQmPTTd7AwS7Z1NaP62XUedarAUXeC6';
    // Address for Mint Account
    const mint = new PublicKey(tokenMintAddress);
    const withdrawWithheldAuthority = payer;
    const sourceTokenAccountForTax = new PublicKey(sourceWalletForFee);

    // Retrieve all Token Accounts associated with the mint
    const allAccounts = await connection.getProgramAccounts(TOKEN_2022_PROGRAM_ID, {
    commitment: "confirmed",
    filters: [
    {
        memcmp: {
        offset: 0,
        bytes: mint.toString(), // Mint Account address
        },
    },
    ],
    });

    // List of Token Accounts to withdraw fees from
    const accountsToWithdrawFrom = [];

    for (const accountInfo of allAccounts) {
    const account = unpackAccount(
    accountInfo.pubkey, // Token Account address
    accountInfo.account, // Token Account data
    TOKEN_2022_PROGRAM_ID // Token Extension Program ID
    );

    // Extract transfer fee data from each account
    const transferFeeAmount = getTransferFeeAmount(account);

    // Check if fees are available to be withdrawn
    if (transferFeeAmount !== null && transferFeeAmount.withheldAmount > 0) {
    accountsToWithdrawFrom.push(accountInfo.pubkey); // Add account to withdrawal list
    }
    }

    const additionalSigners: Signer[] = [/* your signer instances here */];

    // Withdraw withheld tokens from Token Accounts
    transactionSignature = await withdrawWithheldTokensFromAccounts(
    connection,
    payer, // Transaction fee payer
    mint, // Mint Account address
    sourceTokenAccountForTax, // Destination account for fee withdrawal
    withdrawWithheldAuthority, // Authority for fee withdrawal
    additionalSigners, // Additional signers
    accountsToWithdrawFrom, // Token Accounts to withdrawal from
    undefined, // Confirmation options
    TOKEN_2022_PROGRAM_ID // Token Extension Program ID
    );

    console.log(
    "\nWithdraw Fee From Token Accounts:",
    `https://solana.fm/tx/${transactionSignature}?cluster=devnet-solana`
    );

    // Harvest withheld fees from Token Accounts to Mint Account
    transactionSignature = await harvestWithheldTokensToMint(
    connection,
    payer, // Transaction fee payer
    mint, // Mint Account address
    [sourceTokenAccountForTax], // Source Token Accounts for fee harvesting
    undefined, // Confirmation options
    TOKEN_2022_PROGRAM_ID // Token Extension Program ID
    );

    console.log(
    "\nHarvest Fee To Mint Account:",
    `https://solana.fm/tx/${transactionSignature}?cluster=devnet-solana`
    );

    // Withdraw fees from Mint Account
    transactionSignature = await withdrawWithheldTokensFromMint(
    connection,
    payer, // Transaction fee payer
    mint, // Mint Account address
    sourceTokenAccountForTax, // Destination account for fee withdrawal
    withdrawWithheldAuthority, // Withdraw Withheld Authority
    undefined, // Additional signers
    undefined, // Confirmation options
    TOKEN_2022_PROGRAM_ID // Token Extension Program ID
    );

    console.log(
    "\nWithdraw Fee from Mint Account:",
    `https://solana.fm/tx/${transactionSignature}?cluster=devnet-solana`
    );

}


// Run the main function
main().catch(e => console.error(e));