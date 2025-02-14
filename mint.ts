import fs from 'fs';
import path from 'path';

async function main() {
  const { Connection, Keypair, SystemProgram, Transaction, clusterApiUrl, sendAndConfirmTransaction } = await import("@solana/web3.js");
  const { ExtensionType, TOKEN_2022_PROGRAM_ID, createAccount, createInitializeMintInstruction, createInitializeTransferFeeConfigInstruction, getMintLen, mintTo } = await import("@solana/spl-token");

  // Define the path to your keypair JSON file
  const keypairPath = path.join(process.cwd(), 'payerWallet.json'); // Using process.cwd() for better compatibility

  // Read the keypair file
  const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));

  // Create a Keypair from the JSON data
  const payer = Keypair.fromSecretKey(new Uint8Array(keypairData));

  // Connection to devnet cluster
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  // Transaction signature returned from sent transaction
  let transactionSignature;

  // Generate new keypair for Mint Account
  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;
  const decimals = 9;
  const mintAmount = 1000000000;
  const mintAuthority = payer.publicKey;
  const transferFeeConfigAuthority = payer;
  const withdrawWithheldAuthority = payer;

  const feeBasisPoints = 150;
  const maxFee = BigInt(mintAmount * 10 ** decimals);

  const mintLen = getMintLen([ExtensionType.TransferFeeConfig]);
  const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

  const createAccountInstruction = SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: mint,
    space: mintLen,
    lamports,
    programId: TOKEN_2022_PROGRAM_ID,
  });

  const initializeTransferFeeConfig = createInitializeTransferFeeConfigInstruction(
    mint,
    transferFeeConfigAuthority.publicKey,
    withdrawWithheldAuthority.publicKey,
    feeBasisPoints,
    maxFee,
    TOKEN_2022_PROGRAM_ID
  );

  const initializeMintInstruction = createInitializeMintInstruction(
    mint,
    decimals,
    mintAuthority,
    null,
    TOKEN_2022_PROGRAM_ID
  );

  const transaction = new Transaction().add(
    createAccountInstruction,
    initializeTransferFeeConfig,
    initializeMintInstruction
  );

  transactionSignature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [payer, mintKeypair]
  );

  console.log(
    "\nCreate Mint Account:",
    `https://solana.fm/tx/${transactionSignature}?cluster=devnet-solana`
  );

  const sourceTokenAccount = await createAccount(
    connection,
    payer,
    mint,
    payer.publicKey,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID
  );

  transactionSignature = await mintTo(
    connection,
    payer,
    mint,
    sourceTokenAccount,
    mintAuthority,
    mintAmount * 10 ** decimals,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID
  );

  console.log(
    "\nMint Tokens:",
    `https://solana.fm/tx/${transactionSignature}?cluster=devnet-solana`
  );
}

// Run the main function
main().catch(e => console.error(e));