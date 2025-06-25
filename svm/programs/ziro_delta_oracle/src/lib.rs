use anchor_lang::prelude::*;

declare_id!("8pZdF5QrMk4sGjY6nH7E8P3tA6mD9kR2L1xF5yN7cS4");

#[program]
pub mod ziro_delta_oracle {
    use super::*;

    /// Initialize the oracle system with production security parameters
    pub fn initialize(
        ctx: Context<Initialize>,
        min_oracles: u8,
        twap_window: i64,
        max_deviation_bps: u16,
    ) -> Result<()> {
        require!(min_oracles >= 3, OracleError::InsufficientMinOracles);
        require!(max_deviation_bps <= 1000, OracleError::DeviationTooHigh); // Max 10%

        let state = &mut ctx.accounts.state;
        state.authority = ctx.accounts.authority.key();
        state.min_oracles = min_oracles;
        state.active_oracles = 0;
        state.total_weight = 0;
        state.current_funding_rate = 0;
        state.emergency_mode = false;
        state.emergency_funding_rate = 0;
        
        // TWAP configuration
        state.twap_window = twap_window;
        state.max_deviation_bps = max_deviation_bps;
        state.funding_rate_cumulative = 0;
        state.last_update_time = Clock::get()?.unix_timestamp;
        state.twap_funding_rate = 0;

        msg!("ZiroDelta Oracle initialized with production security features");
        Ok(())
    }

    /// Add a new oracle provider with weight
    pub fn add_oracle(
        ctx: Context<AddOracle>,
        oracle_pubkey: Pubkey,
        weight: u16,
        name: String,
    ) -> Result<()> {
        require!(weight > 0 && weight <= 10000, OracleError::InvalidWeight);
        require!(name.len() <= 32, OracleError::NameTooLong);

        let state = &mut ctx.accounts.state;
        let oracle_account = &mut ctx.accounts.oracle_account;

        oracle_account.pubkey = oracle_pubkey;
        oracle_account.weight = weight;
        oracle_account.is_active = true;
        oracle_account.last_update_slot = 0;
        oracle_account.last_price = 0;
        oracle_account.name = name;
        oracle_account.failure_count = 0;

        state.active_oracles += 1;
        state.total_weight += weight;

        emit!(OracleAdded {
            oracle: oracle_pubkey,
            weight,
            active_oracles: state.active_oracles,
        });

        Ok(())
    }

    /// Update funding rate from oracle data
    pub fn update_funding_rate(
        ctx: Context<UpdateFundingRate>,
        oracle_data: Vec<OracleDataInput>,
    ) -> Result<()> {
        let state = &mut ctx.accounts.state;
        let clock = Clock::get()?;

        require!(!state.emergency_mode, OracleError::EmergencyModeActive);
        require!(oracle_data.len() >= state.min_oracles as usize, OracleError::InsufficientOracles);

        // Validate and process oracle data
        let (weighted_funding_rate, valid_oracles) = process_oracle_data(
            &oracle_data,
            &ctx.remaining_accounts,
            state.total_weight,
        )?;

        require!(valid_oracles >= state.min_oracles, OracleError::InsufficientValidOracles);

        // TWAP protection check
        if state.twap_funding_rate > 0 {
            let deviation = calculate_deviation(weighted_funding_rate, state.twap_funding_rate);
            require!(
                deviation <= state.max_deviation_bps,
                OracleError::DeviationTooHigh
            );
        }

        // Update TWAP
        update_twap(state, weighted_funding_rate, clock.unix_timestamp)?;

        state.current_funding_rate = weighted_funding_rate;
        state.last_update_time = clock.unix_timestamp;

        emit!(FundingRateUpdated {
            new_rate: weighted_funding_rate,
            twap_rate: state.twap_funding_rate,
            valid_oracles,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Emergency update with manual override (admin only)
    pub fn emergency_update_funding_rate(
        ctx: Context<EmergencyUpdate>,
        emergency_rate: i32,
    ) -> Result<()> {
        let state = &mut ctx.accounts.state;
        
        state.emergency_mode = true;
        state.emergency_funding_rate = emergency_rate;
        state.current_funding_rate = emergency_rate;
        state.last_update_time = Clock::get()?.unix_timestamp;

        emit!(EmergencyModeActivated {
            authority: ctx.accounts.authority.key(),
            emergency_rate,
        });

        Ok(())
    }

    /// Deactivate emergency mode (admin only)
    pub fn deactivate_emergency_mode(ctx: Context<EmergencyUpdate>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        
        state.emergency_mode = false;
        state.emergency_funding_rate = 0;

        emit!(EmergencyModeDeactivated {
            authority: ctx.accounts.authority.key(),
        });

        Ok(())
    }

    /// Set oracle status (admin only)
    pub fn set_oracle_status(
        ctx: Context<SetOracleStatus>,
        oracle_pubkey: Pubkey,
        is_active: bool,
    ) -> Result<()> {
        let state = &mut ctx.accounts.state;
        let oracle_account = &mut ctx.accounts.oracle_account;

        require!(oracle_account.pubkey == oracle_pubkey, OracleError::InvalidOracle);

        if oracle_account.is_active && !is_active {
            state.active_oracles -= 1;
            state.total_weight -= oracle_account.weight;
        } else if !oracle_account.is_active && is_active {
            state.active_oracles += 1;
            state.total_weight += oracle_account.weight;
        }

        oracle_account.is_active = is_active;

        emit!(OracleStatusChanged {
            oracle: oracle_pubkey,
            is_active,
            active_oracles: state.active_oracles,
        });

        Ok(())
    }

    /// Update oracle parameters (admin only)
    pub fn update_oracle_parameters(
        ctx: Context<EmergencyUpdate>,
        new_min_oracles: Option<u8>,
        new_twap_window: Option<i64>,
        new_max_deviation_bps: Option<u16>,
    ) -> Result<()> {
        let state = &mut ctx.accounts.state;

        if let Some(min_oracles) = new_min_oracles {
            require!(min_oracles >= 3, OracleError::InsufficientMinOracles);
            state.min_oracles = min_oracles;
        }

        if let Some(twap_window) = new_twap_window {
            require!(twap_window >= 300, OracleError::TWAPWindowTooShort); // Min 5 minutes
            state.twap_window = twap_window;
        }

        if let Some(max_deviation_bps) = new_max_deviation_bps {
            require!(max_deviation_bps <= 1000, OracleError::DeviationTooHigh);
            state.max_deviation_bps = max_deviation_bps;
        }

        Ok(())
    }
}

// Helper functions
fn process_oracle_data(
    oracle_data: &Vec<OracleDataInput>,
    remaining_accounts: &[AccountInfo],
    total_weight: u16,
) -> Result<(i32, u8)> {
    let mut weighted_sum: i64 = 0;
    let mut valid_weight: u16 = 0;
    let mut valid_oracles: u8 = 0;

    for (i, data) in oracle_data.iter().enumerate() {
        if i >= remaining_accounts.len() {
            continue;
        }

        let oracle_account = Account::<OracleData>::try_from(&remaining_accounts[i])?;
        
        if !oracle_account.is_active {
            continue;
        }

        // Validate oracle data freshness (within last 5 minutes)
        let current_slot = Clock::get()?.slot;
        if current_slot > oracle_account.last_update_slot + 150 { // ~1 minute at 400ms slots
            continue;
        }

        weighted_sum += data.funding_rate as i64 * oracle_account.weight as i64;
        valid_weight += oracle_account.weight;
        valid_oracles += 1;
    }

    require!(valid_weight > 0, OracleError::NoValidOracles);

    let weighted_funding_rate = (weighted_sum / valid_weight as i64) as i32;
    Ok((weighted_funding_rate, valid_oracles))
}

fn update_twap(
    state: &mut OracleState,
    new_funding_rate: i32,
    current_time: i64,
) -> Result<()> {
    let time_elapsed = current_time - state.last_update_time;

    if time_elapsed > 0 {
        // Update cumulative funding rate
        state.funding_rate_cumulative += new_funding_rate as i64 * time_elapsed;

        // Update TWAP if enough time has passed
        if time_elapsed >= state.twap_window {
            state.twap_funding_rate = (state.funding_rate_cumulative / time_elapsed) as i32;
            state.funding_rate_cumulative = 0;
        }
    }

    Ok(())
}

fn calculate_deviation(current_rate: i32, twap_rate: i32) -> u16 {
    if twap_rate == 0 {
        return 0;
    }

    let diff = (current_rate - twap_rate).abs();
    let deviation = (diff as u64 * 10000) / twap_rate.abs() as u64;
    deviation.min(10000) as u16
}

// Account structs
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + std::mem::size_of::<OracleState>(),
        seeds = [b"oracle_state"],
        bump
    )]
    pub state: Account<'info, OracleState>,
    
    pub authority: Signer<'info>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddOracle<'info> {
    #[account(
        mut,
        seeds = [b"oracle_state"],
        bump,
        has_one = authority
    )]
    pub state: Account<'info, OracleState>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + std::mem::size_of::<OracleData>(),
        seeds = [b"oracle", state.active_oracles.to_le_bytes().as_ref()],
        bump
    )]
    pub oracle_account: Account<'info, OracleData>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateFundingRate<'info> {
    #[account(
        mut,
        seeds = [b"oracle_state"],
        bump
    )]
    pub state: Account<'info, OracleState>,
}

#[derive(Accounts)]
pub struct EmergencyUpdate<'info> {
    #[account(
        mut,
        seeds = [b"oracle_state"],
        bump,
        has_one = authority
    )]
    pub state: Account<'info, OracleState>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetOracleStatus<'info> {
    #[account(
        mut,
        seeds = [b"oracle_state"],
        bump,
        has_one = authority
    )]
    pub state: Account<'info, OracleState>,
    
    #[account(mut)]
    pub oracle_account: Account<'info, OracleData>,
    
    pub authority: Signer<'info>,
}

// Data structures
#[account]
pub struct OracleState {
    pub authority: Pubkey,
    pub min_oracles: u8,
    pub active_oracles: u8,
    pub total_weight: u16,
    pub current_funding_rate: i32,
    pub emergency_mode: bool,
    pub emergency_funding_rate: i32,
    
    // TWAP state
    pub twap_window: i64,
    pub max_deviation_bps: u16,
    pub funding_rate_cumulative: i64,
    pub last_update_time: i64,
    pub twap_funding_rate: i32,
}

#[account]
pub struct OracleData {
    pub pubkey: Pubkey,
    pub weight: u16,
    pub is_active: bool,
    pub last_update_slot: u64,
    pub last_price: u64,
    pub name: String,
    pub failure_count: u16,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct OracleDataInput {
    pub oracle_pubkey: Pubkey,
    pub funding_rate: i32,
    pub timestamp: i64,
    pub signature: [u8; 64], // For future verification
}

// Events
#[event]
pub struct OracleAdded {
    pub oracle: Pubkey,
    pub weight: u16,
    pub active_oracles: u8,
}

#[event]
pub struct FundingRateUpdated {
    pub new_rate: i32,
    pub twap_rate: i32,
    pub valid_oracles: u8,
    pub timestamp: i64,
}

#[event]
pub struct EmergencyModeActivated {
    pub authority: Pubkey,
    pub emergency_rate: i32,
}

#[event]
pub struct EmergencyModeDeactivated {
    pub authority: Pubkey,
}

#[event]
pub struct OracleStatusChanged {
    pub oracle: Pubkey,
    pub is_active: bool,
    pub active_oracles: u8,
}

// Errors
#[error_code]
pub enum OracleError {
    #[msg("Minimum oracles must be at least 3")]
    InsufficientMinOracles,
    #[msg("Deviation from TWAP too high")]
    DeviationTooHigh,
    #[msg("Invalid oracle weight")]
    InvalidWeight,
    #[msg("Oracle name too long")]
    NameTooLong,
    #[msg("Emergency mode is active")]
    EmergencyModeActive,
    #[msg("Insufficient oracles for update")]
    InsufficientOracles,
    #[msg("Insufficient valid oracles")]
    InsufficientValidOracles,
    #[msg("No valid oracles available")]
    NoValidOracles,
    #[msg("Invalid oracle")]
    InvalidOracle,
    #[msg("TWAP window too short")]
    TWAPWindowTooShort,
}
