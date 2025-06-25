use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, MintTo, Token, TokenAccount, Transfer};

declare_id!("3RurkF7fVRSGgEKspbKsLey8wMtjMrZ7yjmi1b1pbX8r");

#[program]
pub mod ziro_delta_minting {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.owner = *ctx.accounts.owner.key;
        state.pfrt_mint = *ctx.accounts.pfrt_mint.to_account_info().key;
        state.nfrt_mint = *ctx.accounts.nfrt_mint.to_account_info().key;
        state.collateral_vault = *ctx.accounts.collateral_vault.to_account_info().key;
        state.paused = false;
        Ok(())
    }

    pub fn set_paused(ctx: Context<SetPaused>, paused: bool) -> Result<()> {
        ctx.accounts.state.paused = paused;
        Ok(())
    }

    pub fn mint(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        require!(!ctx.accounts.state.paused, ZiroDeltaError::Paused);
        require!(amount > 0, ZiroDeltaError::InvalidAmount);

        let fee = amount
            .checked_mul(MINT_FEE_BPS)
            .and_then(|n| n.checked_div(10000))
            .ok_or(ZiroDeltaError::Overflow)?;
        let net_amount = amount
            .checked_sub(fee)
            .ok_or(ZiroDeltaError::Overflow)?;

        // Transfer collateral from user to the vault
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_collateral_account.to_account_info(),
                    to: ctx.accounts.collateral_vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount,
        )?;

        // Transfer fee to the owner
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.collateral_vault.to_account_info(),
                    to: ctx.accounts.owner_collateral_account.to_account_info(),
                    authority: ctx.accounts.collateral_vault.to_account_info(),
                },
            ),
            fee,
        )?;

        // Mint PFRT and NFRT
        token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.pfrt_mint.to_account_info(),
                    to: ctx.accounts.user_pfrt_account.to_account_info(),
                    authority: ctx.accounts.pfrt_mint_authority.to_account_info(),
                },
            ),
            net_amount,
        )?;

        token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.nfrt_mint.to_account_info(),
                    to: ctx.accounts.user_nfrt_account.to_account_info(),
                    authority: ctx.accounts.nfrt_mint_authority.to_account_info(),
                },
            ),
            net_amount,
        )?;

        emit!(MintEvent {
            user: *ctx.accounts.user.key,
            collateral_amount: amount,
            pfrt_amount: net_amount,
            nfrt_amount: net_amount,
        });

        Ok(())
    }

    pub fn redeem(ctx: Context<RedeemTokens>, pfrt_amount: u64, nfrt_amount: u64) -> Result<()> {
        require!(!ctx.accounts.state.paused, ZiroDeltaError::Paused);
        require!(
            pfrt_amount > 0 && nfrt_amount > 0,
            ZiroDeltaError::InvalidAmount
        );
        require!(
            pfrt_amount == nfrt_amount,
            ZiroDeltaError::UnequalAmounts
        );

        // Burn PFRT and NFRT
        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.pfrt_mint.to_account_info(),
                    from: ctx.accounts.user_pfrt_account.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            pfrt_amount,
        )?;

        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.nfrt_mint.to_account_info(),
                    from: ctx.accounts.user_nfrt_account.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            nfrt_amount,
        )?;

        // Transfer collateral back to the user
        let collateral_amount = pfrt_amount;
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.collateral_vault.to_account_info(),
                    to: ctx.accounts.user_collateral_account.to_account_info(),
                    authority: ctx.accounts.collateral_vault_authority.to_account_info(),
                },
            ),
            collateral_amount,
        )?;

        emit!(RedeemEvent {
            user: *ctx.accounts.user.key,
            pfrt_amount,
            nfrt_amount,
            collateral_amount,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = owner, space = 8 + 32 + 32 + 32 + 32 + 1)]
    pub state: Account<'info, State>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub pfrt_mint: Account<'info, Mint>,
    pub nfrt_mint: Account<'info, Mint>,
    pub collateral_vault: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetPaused<'info> {
    #[account(mut, has_one = owner)]
    pub state: Account<'info, State>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub user_pfrt_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_nfrt_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_collateral_account: Account<'info, TokenAccount>,
    #[account(mut, address = state.pfrt_mint)]
    pub pfrt_mint: Account<'info, Mint>,
    #[account(mut, address = state.nfrt_mint)]
    pub nfrt_mint: Account<'info, Mint>,
    #[account(mut, address = state.collateral_vault)]
    pub collateral_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub owner_collateral_account: Account<'info, TokenAccount>,
    pub pfrt_mint_authority: Signer<'info>,
    pub nfrt_mint_authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub state: Account<'info, State>,
}

#[derive(Accounts)]
pub struct RedeemTokens<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub user_pfrt_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_nfrt_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_collateral_account: Account<'info, TokenAccount>,
    #[account(mut, address = state.pfrt_mint)]
    pub pfrt_mint: Account<'info, Mint>,
    #[account(mut, address = state.nfrt_mint)]
    pub nfrt_mint: Account<'info, Mint>,
    #[account(mut, address = state.collateral_vault)]
    pub collateral_vault: Account<'info, TokenAccount>,
    pub collateral_vault_authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub state: Account<'info, State>,
}

#[account]
pub struct State {
    pub owner: Pubkey,
    pub pfrt_mint: Pubkey,
    pub nfrt_mint: Pubkey,
    pub collateral_vault: Pubkey,
    pub paused: bool,
}

#[event]
pub struct MintEvent {
    pub user: Pubkey,
    pub collateral_amount: u64,
    pub pfrt_amount: u64,
    pub nfrt_amount: u64,
}

#[event]
pub struct RedeemEvent {
    pub user: Pubkey,
    pub pfrt_amount: u64,
    pub nfrt_amount: u64,
    pub collateral_amount: u64,
}

#[error_code]
pub enum ZiroDeltaError {
    #[msg("The protocol is paused.")]
    Paused,
    #[msg("Invalid amount.")]
    InvalidAmount,
    #[msg("Unequal amounts.")]
    UnequalAmounts,
    #[msg("Calculation overflow.")]
    Overflow,
}

const MINT_FEE_BPS: u64 = 10; // 0.1%
