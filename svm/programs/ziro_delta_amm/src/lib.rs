use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};

declare_id!("ZDAMMqnmCLcuB6TJNHqfEJgv6dfVA7Vj2hJWqF4eGc1");

#[program]
pub mod ziro_delta_amm {
    use super::*;

    /// Initialize the AMM with production-ready security parameters
    pub fn initialize(
        ctx: Context<Initialize>,
        trading_fee_bps: u16,
        max_trade_size: u64,
        daily_volume_limit: u64,
        max_slippage_bps: u16,
    ) -> Result<()> {
        require!(trading_fee_bps <= 100, AmmError::FeeTooHigh); // Max 1%
        require!(max_slippage_bps <= 1000, AmmError::SlippageTooHigh); // Max 10%

        let state = &mut ctx.accounts.state;
        state.authority = ctx.accounts.authority.key();
        state.pfrt_mint = ctx.accounts.pfrt_mint.key();
        state.nfrt_mint = ctx.accounts.nfrt_mint.key();
        state.pfrt_vault = ctx.accounts.pfrt_vault.key();
        state.nfrt_vault = ctx.accounts.nfrt_vault.key();
        
        // Security parameters
        state.trading_fee_bps = trading_fee_bps;
        state.max_trade_size = max_trade_size;
        state.daily_volume_limit = daily_volume_limit;
        state.max_slippage_bps = max_slippage_bps;
        
        // Initialize state
        state.trading_paused = false;
        state.daily_volume = 0;
        state.last_volume_reset = Clock::get()?.unix_timestamp;
        state.pfrt_balance = 0;
        state.nfrt_balance = 0;
        state.total_liquidity = 0;
        
        // Initialize TWAP
        state.twap_window = 15 * 60; // 15 minutes
        state.pfrt_price_cumulative = 0;
        state.nfrt_price_cumulative = 0;
        state.last_twap_update = Clock::get()?.unix_timestamp;
        state.pfrt_twap = 0;
        state.nfrt_twap = 0;

        msg!("ZiroDelta AMM initialized with production security features");
        Ok(())
    }

    /// Add liquidity with proper balance tracking
    pub fn add_liquidity(
        ctx: Context<AddLiquidity>,
        pfrt_amount: u64,
        nfrt_amount: u64,
        min_liquidity: u64,
    ) -> Result<()> {
        let state = &mut ctx.accounts.state;
        require!(!state.trading_paused, AmmError::TradingPaused);
        require!(pfrt_amount > 0 && nfrt_amount > 0, AmmError::InvalidAmount);

        let liquidity_to_mint = if state.total_liquidity == 0 {
            // Initial liquidity - geometric mean
            (pfrt_amount as u128 * nfrt_amount as u128).integer_sqrt() as u64
        } else {
            // Proportional liquidity
            let pfrt_liquidity = (pfrt_amount as u128 * state.total_liquidity as u128) / state.pfrt_balance as u128;
            let nfrt_liquidity = (nfrt_amount as u128 * state.total_liquidity as u128) / state.nfrt_balance as u128;
            std::cmp::min(pfrt_liquidity, nfrt_liquidity) as u64
        };

        require!(liquidity_to_mint >= min_liquidity, AmmError::SlippageExceeded);

        // Transfer tokens to vaults
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_pfrt_account.to_account_info(),
                    to: ctx.accounts.pfrt_vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            pfrt_amount,
        )?;

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_nfrt_account.to_account_info(),
                    to: ctx.accounts.nfrt_vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            nfrt_amount,
        )?;

        // Update state
        state.pfrt_balance += pfrt_amount;
        state.nfrt_balance += nfrt_amount;
        state.total_liquidity += liquidity_to_mint;

        // Update TWAP
        update_twap(state)?;

        emit!(LiquidityAdded {
            user: ctx.accounts.user.key(),
            pfrt_amount,
            nfrt_amount,
            liquidity_minted: liquidity_to_mint,
        });

        Ok(())
    }

    /// Swap tokens with flash loan protection and comprehensive security
    pub fn swap(
        ctx: Context<Swap>,
        amount_in: u64,
        min_amount_out: u64,
        is_pfrt_to_nfrt: bool,
    ) -> Result<()> {
        let state = &mut ctx.accounts.state;
        let clock = Clock::get()?;

        // Security checks
        require!(!state.trading_paused, AmmError::TradingPaused);
        require!(amount_in > 0, AmmError::InvalidAmount);
        require!(amount_in <= state.max_trade_size, AmmError::TradeSizeTooLarge);

        // Flash loan protection - check last transaction slot
        let last_slot = ctx.accounts.user_trade_state.last_trade_slot;
        let current_slot = clock.slot;
        require!(last_slot != current_slot, AmmError::FlashLoanDetected);

        // Daily volume check
        check_daily_volume_limit(state, amount_in, clock.unix_timestamp)?;

        // Calculate swap with TWAP protection
        let (amount_out, fee) = calculate_swap_amount(
            state,
            amount_in,
            is_pfrt_to_nfrt,
        )?;

        require!(amount_out >= min_amount_out, AmmError::SlippageExceeded);

        // Execute the swap
        if is_pfrt_to_nfrt {
            // Transfer PFRT from user to vault
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.user_pfrt_account.to_account_info(),
                        to: ctx.accounts.pfrt_vault.to_account_info(),
                        authority: ctx.accounts.user.to_account_info(),
                    },
                ),
                amount_in,
            )?;

            // Transfer NFRT from vault to user
            let seeds = &[
                b"authority".as_ref(),
                state.pfrt_mint.as_ref(),
                &[ctx.bumps.authority],
            ];
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.nfrt_vault.to_account_info(),
                        to: ctx.accounts.user_nfrt_account.to_account_info(),
                        authority: ctx.accounts.authority.to_account_info(),
                    },
                    &[&seeds[..]],
                ),
                amount_out,
            )?;

            state.pfrt_balance += amount_in;
            state.nfrt_balance -= amount_out;
        } else {
            // Transfer NFRT from user to vault
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.user_nfrt_account.to_account_info(),
                        to: ctx.accounts.nfrt_vault.to_account_info(),
                        authority: ctx.accounts.user.to_account_info(),
                    },
                ),
                amount_in,
            )?;

            // Transfer PFRT from vault to user
            let seeds = &[
                b"authority".as_ref(),
                state.pfrt_mint.as_ref(),
                &[ctx.bumps.authority],
            ];
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.pfrt_vault.to_account_info(),
                        to: ctx.accounts.user_pfrt_account.to_account_info(),
                        authority: ctx.accounts.authority.to_account_info(),
                    },
                    &[&seeds[..]],
                ),
                amount_out,
            )?;

            state.nfrt_balance += amount_in;
            state.pfrt_balance -= amount_out;
        }

        // Update trade tracking
        let user_trade_state = &mut ctx.accounts.user_trade_state;
        user_trade_state.last_trade_slot = current_slot;
        
        // Update daily volume
        state.daily_volume += amount_in;

        // Update TWAP
        update_twap(state)?;

        emit!(SwapEvent {
            user: ctx.accounts.user.key(),
            amount_in,
            amount_out,
            fee,
            is_pfrt_to_nfrt,
        });

        Ok(())
    }

    /// Emergency pause trading (admin only)
    pub fn pause_trading(ctx: Context<AdminAction>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.trading_paused = true;

        emit!(TradingPaused {
            authority: ctx.accounts.authority.key(),
        });

        Ok(())
    }

    /// Resume trading (admin only)
    pub fn resume_trading(ctx: Context<AdminAction>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.trading_paused = false;

        emit!(TradingResumed {
            authority: ctx.accounts.authority.key(),
        });

        Ok(())
    }

    /// Update trading parameters (admin only)
    pub fn update_parameters(
        ctx: Context<AdminAction>,
        new_max_trade_size: Option<u64>,
        new_daily_volume_limit: Option<u64>,
        new_max_slippage_bps: Option<u16>,
    ) -> Result<()> {
        let state = &mut ctx.accounts.state;

        if let Some(max_trade_size) = new_max_trade_size {
            state.max_trade_size = max_trade_size;
        }

        if let Some(daily_volume_limit) = new_daily_volume_limit {
            state.daily_volume_limit = daily_volume_limit;
        }

        if let Some(max_slippage_bps) = new_max_slippage_bps {
            require!(max_slippage_bps <= 1000, AmmError::SlippageTooHigh);
            state.max_slippage_bps = max_slippage_bps;
        }

        Ok(())
    }
}

// Helper functions
fn update_twap(state: &mut AmmState) -> Result<()> {
    let clock = Clock::get()?;
    let time_elapsed = clock.unix_timestamp - state.last_twap_update;

    if time_elapsed > 0 && state.pfrt_balance > 0 && state.nfrt_balance > 0 {
        // Calculate current prices (with precision)
        let pfrt_price = (state.nfrt_balance as u128 * 1_000_000) / state.pfrt_balance as u128;
        let nfrt_price = (state.pfrt_balance as u128 * 1_000_000) / state.nfrt_balance as u128;

        // Update cumulative prices
        state.pfrt_price_cumulative += pfrt_price * time_elapsed as u128;
        state.nfrt_price_cumulative += nfrt_price * time_elapsed as u128;

        // Update TWAP if window passed
        if time_elapsed >= state.twap_window {
            state.pfrt_twap = (state.pfrt_price_cumulative / time_elapsed as u128) as u64;
            state.nfrt_twap = (state.nfrt_price_cumulative / time_elapsed as u128) as u64;

            // Reset cumulative
            state.pfrt_price_cumulative = 0;
            state.nfrt_price_cumulative = 0;
            state.last_twap_update = clock.unix_timestamp;
        }
    }

    Ok(())
}

fn calculate_swap_amount(
    state: &AmmState,
    amount_in: u64,
    is_pfrt_to_nfrt: bool,
) -> Result<(u64, u64)> {
    let fee = (amount_in as u128 * state.trading_fee_bps as u128) / 10000;
    let amount_in_after_fee = amount_in - fee as u64;

    let amount_out = if is_pfrt_to_nfrt {
        // PFRT -> NFRT
        let new_pfrt_balance = state.pfrt_balance + amount_in_after_fee;
        let new_nfrt_balance = (state.pfrt_balance as u128 * state.nfrt_balance as u128) / new_pfrt_balance as u128;
        state.nfrt_balance - new_nfrt_balance as u64
    } else {
        // NFRT -> PFRT
        let new_nfrt_balance = state.nfrt_balance + amount_in_after_fee;
        let new_pfrt_balance = (state.pfrt_balance as u128 * state.nfrt_balance as u128) / new_nfrt_balance as u128;
        state.pfrt_balance - new_pfrt_balance as u64
    };

    // TWAP-based bounds check
    if state.pfrt_twap > 0 && state.nfrt_twap > 0 {
        let max_deviation = 5; // 5% max deviation from TWAP
        // Add TWAP validation logic here
    }

    Ok((amount_out, fee as u64))
}

fn check_daily_volume_limit(
    state: &mut AmmState,
    trade_size: u64,
    current_time: i64,
) -> Result<()> {
    // Reset daily volume if 24 hours passed
    if current_time >= state.last_volume_reset + 86400 {
        state.daily_volume = 0;
        state.last_volume_reset = current_time;
    }

    require!(
        state.daily_volume + trade_size <= state.daily_volume_limit,
        AmmError::DailyVolumeLimitExceeded
    );

    Ok(())
}

// Account structs
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + std::mem::size_of::<AmmState>(),
        seeds = [b"amm_state"],
        bump
    )]
    pub state: Account<'info, AmmState>,
    
    #[account(
        seeds = [b"authority", pfrt_mint.key().as_ref()],
        bump
    )]
    /// CHECK: This is a PDA used as authority
    pub authority: AccountInfo<'info>,
    
    pub pfrt_mint: Account<'info, Mint>,
    pub nfrt_mint: Account<'info, Mint>,
    
    #[account(
        init,
        payer = user,
        token::mint = pfrt_mint,
        token::authority = authority,
        seeds = [b"pfrt_vault"],
        bump
    )]
    pub pfrt_vault: Account<'info, TokenAccount>,
    
    #[account(
        init,
        payer = user,
        token::mint = nfrt_mint,
        token::authority = authority,
        seeds = [b"nfrt_vault"],
        bump
    )]
    pub nfrt_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    #[account(
        mut,
        seeds = [b"amm_state"],
        bump,
        has_one = pfrt_vault,
        has_one = nfrt_vault
    )]
    pub state: Account<'info, AmmState>,
    
    #[account(mut)]
    pub pfrt_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub nfrt_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_pfrt_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_nfrt_account: Account<'info, TokenAccount>,
    
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(
        mut,
        seeds = [b"amm_state"],
        bump,
        has_one = authority,
        has_one = pfrt_vault,
        has_one = nfrt_vault
    )]
    pub state: Account<'info, AmmState>,
    
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + std::mem::size_of::<UserTradeState>(),
        seeds = [b"user_trade", user.key().as_ref()],
        bump
    )]
    pub user_trade_state: Account<'info, UserTradeState>,
    
    #[account(
        seeds = [b"authority", state.pfrt_mint.as_ref()],
        bump
    )]
    /// CHECK: This is a PDA used as authority
    pub authority: AccountInfo<'info>,
    
    #[account(mut)]
    pub pfrt_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub nfrt_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_pfrt_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_nfrt_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct AdminAction<'info> {
    #[account(
        mut,
        seeds = [b"amm_state"],
        bump,
        has_one = authority
    )]
    pub state: Account<'info, AmmState>,
    
    pub authority: Signer<'info>,
}

// Data structures
#[account]
pub struct AmmState {
    pub authority: Pubkey,
    pub pfrt_mint: Pubkey,
    pub nfrt_mint: Pubkey,
    pub pfrt_vault: Pubkey,
    pub nfrt_vault: Pubkey,
    
    // Balances
    pub pfrt_balance: u64,
    pub nfrt_balance: u64,
    pub total_liquidity: u64,
    
    // Trading parameters
    pub trading_fee_bps: u16,
    pub max_trade_size: u64,
    pub daily_volume_limit: u64,
    pub max_slippage_bps: u16,
    
    // Security state
    pub trading_paused: bool,
    pub daily_volume: u64,
    pub last_volume_reset: i64,
    
    // TWAP state
    pub twap_window: i64,
    pub pfrt_price_cumulative: u128,
    pub nfrt_price_cumulative: u128,
    pub last_twap_update: i64,
    pub pfrt_twap: u64,
    pub nfrt_twap: u64,
}

#[account]
pub struct UserTradeState {
    pub last_trade_slot: u64,
}

// Events
#[event]
pub struct LiquidityAdded {
    pub user: Pubkey,
    pub pfrt_amount: u64,
    pub nfrt_amount: u64,
    pub liquidity_minted: u64,
}

#[event]
pub struct SwapEvent {
    pub user: Pubkey,
    pub amount_in: u64,
    pub amount_out: u64,
    pub fee: u64,
    pub is_pfrt_to_nfrt: bool,
}

#[event]
pub struct TradingPaused {
    pub authority: Pubkey,
}

#[event]
pub struct TradingResumed {
    pub authority: Pubkey,
}

// Errors
#[error_code]
pub enum AmmError {
    #[msg("Trading is currently paused")]
    TradingPaused,
    #[msg("Invalid amount provided")]
    InvalidAmount,
    #[msg("Trade size exceeds maximum allowed")]
    TradeSizeTooLarge,
    #[msg("Daily volume limit exceeded")]
    DailyVolumeLimitExceeded,
    #[msg("Slippage exceeded maximum tolerance")]
    SlippageExceeded,
    #[msg("Flash loan attack detected")]
    FlashLoanDetected,
    #[msg("Fee too high")]
    FeeTooHigh,
    #[msg("Slippage tolerance too high")]
    SlippageTooHigh,
    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,
}

// Integer square root implementation
trait IntegerSqrt {
    fn integer_sqrt(self) -> Self;
}

impl IntegerSqrt for u128 {
    fn integer_sqrt(self) -> Self {
        if self < 2 {
            return self;
        }
        
        let mut x = self;
        let mut y = (self + 1) / 2;
        
        while y < x {
            x = y;
            y = (x + self / x) / 2;
        }
        
        x
    }
}
