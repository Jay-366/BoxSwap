use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod token_manager {
    use super::*;

    pub fn create_token(
        ctx: Context<CreateToken>,
        decimals: u8,
        name: String,
        symbol: String,
    ) -> Result<()> {
        // Create the mint
        token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.token_account.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            1000000 * 10u64.pow(decimals as u32), // Mint 1M tokens
        )?;

        // Store token metadata
        let token_info = &mut ctx.accounts.token_info;
        token_info.mint = ctx.accounts.mint.key();
        token_info.decimals = decimals;
        token_info.name = name;
        token_info.symbol = symbol;
        token_info.authority = ctx.accounts.authority.key();

        Ok(())
    }

    pub fn mint_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.token_account.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            amount,
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateToken<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        mint::decimals = 6,
        mint::authority = authority,
        mint::freeze_authority = authority,
        space = 82,
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = authority,
    )]
    pub token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 1 + 32 + 32,
    )]
    pub token_info: Account<'info, TokenInfo>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[account]
pub struct TokenInfo {
    pub mint: Pubkey,
    pub decimals: u8,
    pub name: String,
    pub symbol: String,
    pub authority: Pubkey,
}
