use anchor_lang::prelude::*;

declare_id!("MM3ZfaE7dtH6qf4NfmPntaBMkEB3HxjXFsomrhZr9aN6");

#[program]
pub mod ziro_delta_emergency {
    use super::*;

    /// Initialize the emergency system with production parameters
    pub fn initialize(
        ctx: Context<Initialize>,
        emergency_threshold_bps: u16,
        cooldown_period: i64,
        max_emergency_duration: i64,
    ) -> Result<()> {
        require!(emergency_threshold_bps <= 5000, EmergencyError::ThresholdTooHigh); // Max 50%
        require!(cooldown_period >= 3600, EmergencyError::CooldownTooShort); // Min 1 hour
        require!(max_emergency_duration >= 86400, EmergencyError::DurationTooShort); // Min 1 day

        let state = &mut ctx.accounts.state;
        state.authority = ctx.accounts.authority.key();
        state.emergency_threshold_bps = emergency_threshold_bps;
        state.cooldown_period = cooldown_period;
        state.max_emergency_duration = max_emergency_duration;
        
        state.emergency_active = false;
        state.global_pause = false;
        state.last_emergency_time = 0;
        state.emergency_start_time = 0;
        state.emergency_count = 0;
        
        state.authorized_guardians = 0;
        state.emergency_votes = 0;
        state.required_guardian_votes = 3; // Minimum guardian votes for emergency

        msg!("ZiroDelta Emergency system initialized with production parameters");
        Ok(())
    }

    /// Add authorized guardian for emergency actions
    pub fn add_guardian(
        ctx: Context<AddGuardian>,
        guardian_pubkey: Pubkey,
        name: String,
    ) -> Result<()> {
        require!(name.len() <= 32, EmergencyError::NameTooLong);

        let state = &mut ctx.accounts.state;
        let guardian_account = &mut ctx.accounts.guardian_account;

        guardian_account.pubkey = guardian_pubkey;
        guardian_account.is_active = true;
        guardian_account.name = name;
        guardian_account.emergency_votes_cast = 0;
        guardian_account.last_vote_time = 0;

        state.authorized_guardians += 1;

        emit!(GuardianAdded {
            guardian: guardian_pubkey,
            total_guardians: state.authorized_guardians,
        });

        Ok(())
    }

    /// Activate emergency mode (requires multiple guardian votes)
    pub fn activate_emergency(
        ctx: Context<ActivateEmergency>,
        reason: String,
        severity: EmergencySeverity,
    ) -> Result<()> {
        require!(reason.len() <= 256, EmergencyError::ReasonTooLong);
        
        let state = &mut ctx.accounts.state;
        let guardian_account = &mut ctx.accounts.guardian_account;
        let emergency_vote = &mut ctx.accounts.emergency_vote;
        let clock = Clock::get()?;

        require!(guardian_account.is_active, EmergencyError::GuardianNotActive);
        require!(!state.emergency_active, EmergencyError::EmergencyAlreadyActive);
        
        // Check cooldown period
        if state.last_emergency_time > 0 {
            require!(
                clock.unix_timestamp >= state.last_emergency_time + state.cooldown_period,
                EmergencyError::CooldownNotExpired
            );
        }

        // Record guardian vote
        emergency_vote.guardian = guardian_account.pubkey;
        emergency_vote.vote_time = clock.unix_timestamp;
        emergency_vote.reason = reason;
        emergency_vote.severity = severity;

        guardian_account.emergency_votes_cast += 1;
        guardian_account.last_vote_time = clock.unix_timestamp;
        state.emergency_votes += 1;

        emit!(EmergencyVoteCast {
            guardian: guardian_account.pubkey,
            reason: reason.clone(),
            severity,
            total_votes: state.emergency_votes,
        });

        // Check if we have enough votes to activate emergency
        if state.emergency_votes >= state.required_guardian_votes {
            state.emergency_active = true;
            state.emergency_start_time = clock.unix_timestamp;
            state.emergency_count += 1;
            state.global_pause = matches!(severity, EmergencySeverity::Critical);

            emit!(EmergencyActivated {
                reason,
                severity,
                guardian_votes: state.emergency_votes,
                global_pause: state.global_pause,
                timestamp: clock.unix_timestamp,
            });
        }

        Ok(())
    }

    /// Deactivate emergency mode (admin or majority guardian vote)
    pub fn deactivate_emergency(
        ctx: Context<DeactivateEmergency>,
        reason: String,
    ) -> Result<()> {
        let state = &mut ctx.accounts.state;
        let clock = Clock::get()?;

        require!(state.emergency_active, EmergencyError::NoActiveEmergency);
        require!(reason.len() <= 256, EmergencyError::ReasonTooLong);

        state.emergency_active = false;
        state.global_pause = false;
        state.last_emergency_time = clock.unix_timestamp;
        state.emergency_votes = 0; // Reset votes for next emergency

        emit!(EmergencyDeactivated {
            authority: ctx.accounts.authority.key(),
            reason,
            duration: clock.unix_timestamp - state.emergency_start_time,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Pause specific protocol component
    pub fn pause_component(
        ctx: Context<ComponentAction>,
        component: ProtocolComponent,
    ) -> Result<()> {
        let state = &ctx.accounts.state;
        let component_state = &mut ctx.accounts.component_state;

        require!(
            state.emergency_active || state.global_pause,
            EmergencyError::EmergencyRequired
        );

        component_state.component = component;
        component_state.is_paused = true;
        component_state.pause_time = Clock::get()?.unix_timestamp;
        component_state.paused_by = ctx.accounts.authority.key();

        emit!(ComponentPaused {
            component,
            authority: ctx.accounts.authority.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Resume specific protocol component
    pub fn resume_component(
        ctx: Context<ComponentAction>,
        component: ProtocolComponent,
    ) -> Result<()> {
        let component_state = &mut ctx.accounts.component_state;
        let clock = Clock::get()?;

        require!(component_state.is_paused, EmergencyError::ComponentNotPaused);

        component_state.is_paused = false;
        component_state.resume_time = clock.unix_timestamp;
        component_state.resumed_by = ctx.accounts.authority.key();

        emit!(ComponentResumed {
            component,
            authority: ctx.accounts.authority.key(),
            pause_duration: clock.unix_timestamp - component_state.pause_time,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Update emergency parameters (admin only)
    pub fn update_emergency_parameters(
        ctx: Context<UpdateParameters>,
        new_threshold_bps: Option<u16>,
        new_cooldown_period: Option<i64>,
        new_required_votes: Option<u8>,
    ) -> Result<()> {
        let state = &mut ctx.accounts.state;

        if let Some(threshold) = new_threshold_bps {
            require!(threshold <= 5000, EmergencyError::ThresholdTooHigh);
            state.emergency_threshold_bps = threshold;
        }

        if let Some(cooldown) = new_cooldown_period {
            require!(cooldown >= 3600, EmergencyError::CooldownTooShort);
            state.cooldown_period = cooldown;
        }

        if let Some(votes) = new_required_votes {
            require!(votes >= 2 && votes <= 10, EmergencyError::InvalidVoteRequirement);
            state.required_guardian_votes = votes;
        }

        Ok(())
    }

    /// Emergency fund recovery (only during active emergency)
    pub fn emergency_withdraw(
        ctx: Context<EmergencyWithdraw>,
        amount: u64,
        destination: Pubkey,
    ) -> Result<()> {
        let state = &ctx.accounts.state;

        require!(state.emergency_active, EmergencyError::EmergencyRequired);
        require!(amount > 0, EmergencyError::InvalidAmount);

        // This would integrate with token program to perform withdrawal
        // Implementation depends on specific token account structure

        emit!(EmergencyWithdrawal {
            authority: ctx.accounts.authority.key(),
            amount,
            destination,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Check emergency status and auto-deactivate if expired
    pub fn check_emergency_status(ctx: Context<CheckStatus>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        let clock = Clock::get()?;

        if state.emergency_active {
            let emergency_duration = clock.unix_timestamp - state.emergency_start_time;
            
            if emergency_duration >= state.max_emergency_duration {
                state.emergency_active = false;
                state.global_pause = false;
                state.last_emergency_time = clock.unix_timestamp;
                state.emergency_votes = 0;

                emit!(EmergencyAutoDeactivated {
                    duration: emergency_duration,
                    timestamp: clock.unix_timestamp,
                });
            }
        }

        Ok(())
    }
}

// Account structs
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + std::mem::size_of::<EmergencyState>(),
        seeds = [b"emergency_state"],
        bump
    )]
    pub state: Account<'info, EmergencyState>,
    
    pub authority: Signer<'info>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddGuardian<'info> {
    #[account(
        mut,
        seeds = [b"emergency_state"],
        bump,
        has_one = authority
    )]
    pub state: Account<'info, EmergencyState>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + std::mem::size_of::<GuardianData>(),
        seeds = [b"guardian", state.authorized_guardians.to_le_bytes().as_ref()],
        bump
    )]
    pub guardian_account: Account<'info, GuardianData>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ActivateEmergency<'info> {
    #[account(
        mut,
        seeds = [b"emergency_state"],
        bump
    )]
    pub state: Account<'info, EmergencyState>,
    
    #[account(mut)]
    pub guardian_account: Account<'info, GuardianData>,
    
    #[account(
        init,
        payer = guardian,
        space = 8 + std::mem::size_of::<EmergencyVote>(),
        seeds = [b"emergency_vote", guardian.key().as_ref(), Clock::get()?.unix_timestamp.to_le_bytes().as_ref()],
        bump
    )]
    pub emergency_vote: Account<'info, EmergencyVote>,
    
    #[account(mut)]
    pub guardian: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct DeactivateEmergency<'info> {
    #[account(
        mut,
        seeds = [b"emergency_state"],
        bump,
        has_one = authority
    )]
    pub state: Account<'info, EmergencyState>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ComponentAction<'info> {
    #[account(
        seeds = [b"emergency_state"],
        bump,
        has_one = authority
    )]
    pub state: Account<'info, EmergencyState>,
    
    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + std::mem::size_of::<ComponentState>(),
        seeds = [b"component", authority.key().as_ref()],
        bump
    )]
    pub component_state: Account<'info, ComponentState>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateParameters<'info> {
    #[account(
        mut,
        seeds = [b"emergency_state"],
        bump,
        has_one = authority
    )]
    pub state: Account<'info, EmergencyState>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct EmergencyWithdraw<'info> {
    #[account(
        seeds = [b"emergency_state"],
        bump,
        has_one = authority
    )]
    pub state: Account<'info, EmergencyState>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct CheckStatus<'info> {
    #[account(
        mut,
        seeds = [b"emergency_state"],
        bump
    )]
    pub state: Account<'info, EmergencyState>,
}

// Data structures
#[account]
pub struct EmergencyState {
    pub authority: Pubkey,
    pub emergency_threshold_bps: u16,
    pub cooldown_period: i64,
    pub max_emergency_duration: i64,
    
    pub emergency_active: bool,
    pub global_pause: bool,
    pub last_emergency_time: i64,
    pub emergency_start_time: i64,
    pub emergency_count: u32,
    
    pub authorized_guardians: u8,
    pub emergency_votes: u8,
    pub required_guardian_votes: u8,
}

#[account]
pub struct GuardianData {
    pub pubkey: Pubkey,
    pub is_active: bool,
    pub name: String,
    pub emergency_votes_cast: u32,
    pub last_vote_time: i64,
}

#[account]
pub struct EmergencyVote {
    pub guardian: Pubkey,
    pub vote_time: i64,
    pub reason: String,
    pub severity: EmergencySeverity,
}

#[account]
pub struct ComponentState {
    pub component: ProtocolComponent,
    pub is_paused: bool,
    pub pause_time: i64,
    pub resume_time: i64,
    pub paused_by: Pubkey,
    pub resumed_by: Pubkey,
}

// Enums
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum EmergencySeverity {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum ProtocolComponent {
    AMM,
    Oracle,
    Minting,
    Governance,
    EpochManager,
}

// Events
#[event]
pub struct GuardianAdded {
    pub guardian: Pubkey,
    pub total_guardians: u8,
}

#[event]
pub struct EmergencyVoteCast {
    pub guardian: Pubkey,
    pub reason: String,
    pub severity: EmergencySeverity,
    pub total_votes: u8,
}

#[event]
pub struct EmergencyActivated {
    pub reason: String,
    pub severity: EmergencySeverity,
    pub guardian_votes: u8,
    pub global_pause: bool,
    pub timestamp: i64,
}

#[event]
pub struct EmergencyDeactivated {
    pub authority: Pubkey,
    pub reason: String,
    pub duration: i64,
    pub timestamp: i64,
}

#[event]
pub struct ComponentPaused {
    pub component: ProtocolComponent,
    pub authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct ComponentResumed {
    pub component: ProtocolComponent,
    pub authority: Pubkey,
    pub pause_duration: i64,
    pub timestamp: i64,
}

#[event]
pub struct EmergencyWithdrawal {
    pub authority: Pubkey,
    pub amount: u64,
    pub destination: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct EmergencyAutoDeactivated {
    pub duration: i64,
    pub timestamp: i64,
}

// Errors
#[error_code]
pub enum EmergencyError {
    #[msg("Emergency threshold too high")]
    ThresholdTooHigh,
    #[msg("Cooldown period too short")]
    CooldownTooShort,
    #[msg("Emergency duration too short")]
    DurationTooShort,
    #[msg("Guardian name too long")]
    NameTooLong,
    #[msg("Guardian not active")]
    GuardianNotActive,
    #[msg("Emergency already active")]
    EmergencyAlreadyActive,
    #[msg("Cooldown period not expired")]
    CooldownNotExpired,
    #[msg("No active emergency")]
    NoActiveEmergency,
    #[msg("Reason too long")]
    ReasonTooLong,
    #[msg("Emergency mode required")]
    EmergencyRequired,
    #[msg("Component not paused")]
    ComponentNotPaused,
    #[msg("Invalid vote requirement")]
    InvalidVoteRequirement,
    #[msg("Invalid amount")]
    InvalidAmount,
}
