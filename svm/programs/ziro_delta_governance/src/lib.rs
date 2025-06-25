
use anchor_lang::prelude::*;

declare_id!("7nYcM2sB8kF3dP6wE9rT5xL4mH8qR9zA2tK6vJ3eG1N");

#[program]
pub mod ziro_delta_governance {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        voting_delay: u64,
        voting_period: u64,
        quorum_fraction: u64,
    ) -> Result<()> {
        let governance = &mut ctx.accounts.governance;
        governance.voting_delay = voting_delay;
        governance.voting_period = voting_period;
        governance.quorum_fraction = quorum_fraction;
        governance.authority = ctx.accounts.authority.key();
        Ok(())
    }

    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        title: String,
        description: String,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        proposal.title = title;
        proposal.description = description;
        proposal.proposer = ctx.accounts.proposer.key();
        proposal.start_block = Clock::get()?.slot;
        proposal.end_block = proposal.start_block + ctx.accounts.governance.voting_period;
        Ok(())
    }

    pub fn vote(
        ctx: Context<Vote>,
        vote: VoteOption,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let voter = &mut ctx.accounts.voter;

        require!(
            Clock::get()?.slot >= proposal.start_block,
            ZiroDeltaError::VotingNotStarted
        );
        require!(
            Clock::get()?.slot < proposal.end_block,
            ZiroDeltaError::VotingEnded
        );

        voter.proposal = proposal.key();
        voter.voter = ctx.accounts.user.key();
        voter.vote = vote;

        match vote {
            VoteOption::For => proposal.for_votes += 1,
            VoteOption::Against => proposal.against_votes += 1,
        }

        Ok(())
    }

    pub fn execute_proposal(ctx: Context<ExecuteProposal>) -> Result<()> {
        let proposal = &ctx.accounts.proposal;
        let governance = &ctx.accounts.governance;

        require!(
            Clock::get()?.slot >= proposal.end_block,
            ZiroDeltaError::VotingNotEnded
        );

        let quorum_votes = (governance.quorum_fraction * 1) / 100;

        require!(
            proposal.for_votes + proposal.against_votes >= quorum_votes,
            ZiroDeltaError::QuorumNotMet
        );
        require!(
            proposal.for_votes > proposal.against_votes,
            ZiroDeltaError::ProposalFailed
        );

        // Execute the proposal

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 8 + 8 + 8 + 32)]
    pub governance: Account<'info, Governance>,
    pub authority: AccountInfo<'info>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(init, payer = proposer, space = 8 + 32 + 32 + 32 + 8 + 8)]
    pub proposal: Account<'info, Proposal>,
    #[account(mut)]
    pub proposer: Signer<'info>,
    pub governance: Account<'info, Governance>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    #[account(init, payer = user, space = 8 + 32 + 32 + 1)]
    pub voter: Account<'info, Voter>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteProposal<'info> {
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    pub governance: Account<'info, Governance>,
}

#[account]
pub struct Governance {
    pub voting_delay: u64,
    pub voting_period: u64,
    pub quorum_fraction: u64,
    pub authority: Pubkey,
}

#[account]
pub struct Proposal {
    pub title: String,
    pub description: String,
    pub proposer: Pubkey,
    pub start_block: u64,
    pub end_block: u64,
    pub for_votes: u64,
    pub against_votes: u64,
}

#[account]
pub struct Voter {
    pub proposal: Pubkey,
    pub voter: Pubkey,
    pub vote: VoteOption,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum VoteOption {
    For,
    Against,
}

#[error_code]
pub enum ZiroDeltaError {
    #[msg("Voting has not started yet")]
    VotingNotStarted,
    #[msg("Voting has already ended")]
    VotingEnded,
    #[msg("Voting has not ended yet")]
    VotingNotEnded,
    #[msg("Quorum not met")]
    QuorumNotMet,
    #[msg("Proposal failed")]
    ProposalFailed,
}
