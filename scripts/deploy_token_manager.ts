import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { TokenManager } from '../target/types/token_manager';
import { PublicKey } from '@solana/web3.js';

async function main() {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.TokenManager as Program<TokenManager>;

  try {
    // Create a new token
    const mint = anchor.web3.Keypair.generate();
    const tokenAccount = await anchor.utils.token.associatedAddress({
      mint: mint.publicKey,
      owner: provider.wallet.publicKey,
    });

    const tokenInfo = anchor.web3.Keypair.generate();

    await program.methods
      .createToken(6, "Test Token", "TEST")
      .accounts({
        authority: provider.wallet.publicKey,
        mint: mint.publicKey,
        tokenAccount: tokenAccount,
        tokenInfo: tokenInfo.publicKey,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([mint, tokenInfo])
      .rpc();

    console.log('Token created successfully!');
    console.log('Mint address:', mint.publicKey.toString());
    console.log('Token account:', tokenAccount.toString());
    console.log('Token info:', tokenInfo.publicKey.toString());

    // Mint additional tokens
    await program.methods
      .mintTokens(new anchor.BN(1000000)) // Mint 1 token (6 decimals)
      .accounts({
        authority: provider.wallet.publicKey,
        mint: mint.publicKey,
        tokenAccount: tokenAccount,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log('Additional tokens minted successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
); 