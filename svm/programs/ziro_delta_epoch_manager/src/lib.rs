
use anchor_lang::prelude::*;

declare_id!("6xK8vP3nF7mE2rA5sH9tL4zR6qG8wD3yB5nJ2kC7eM9");

#[program]
pub mod ziro_delta_epoch_manager {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        epoch_duration: u64,
    ) -> Result<()> {
        let epoch_manager = &mut ctx.accounts.epoch_manager;
        epoch_manager.epoch_duration = epoch_duration;
        epoch_manager.last_epoch_end = Clock::get()?.slot;
        epoch_manager.authority = ctx.accounts.authority.key();
        Ok(())
    }

    pub fn start_new_epoch(ctx: Context<StartNewEpoch>) -> Result<()> {
        let epoch_manager = &mut ctx.accounts.epoch_manager;

        require!(
            Clock::get()?.slot >= epoch_manager.last_epoch_end + epoch_manager.epoch_duration,
            ZiroDeltaError::EpochNotEnded
        );

        epoch_manager.last_epoch_end = Clock::get()?.slot;

        Ok(())
    }

    pub fn settle_epoch(ctx: Context<SettleEpoch>) -> Result<()> {
        // Settle the epoch

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 8 + 8 + 32)]
    pub epoch_manager: Account<'info, EpochManager>,
    pub authority: AccountInfo<'info>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StartNewEpoch<'info> {
    #[account(mut, has_one = authority)]
    pub epoch_manager: Account<'info, EpochManager>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct SettleEpoch<'info> {
    #[account(mut, has_one = authority)]
    pub epoch_manager: Account<'info, EpochManager>,
    pub authority: Signer<'info>,
}

#[account]
pub struct EpochManager {
    pub epoch_duration: u64,
    pub last_epoch_end: u64,
    pub authority: Pubkey,
}

#[error_code]
pub enum ZiroDeltaError {
    #[msg("Epoch has not ended yet")]
    EpochNotEnded,
}
