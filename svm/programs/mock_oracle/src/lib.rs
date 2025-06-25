use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod mock_oracle {
    use super::*;

    pub fn set_funding_rate(
        ctx: Context<SetFundingRate>,
        funding_rate: i64,
    ) -> Result<()> {
        let oracle_data = &mut ctx.accounts.oracle_data;
        oracle_data.funding_rate = funding_rate;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct SetFundingRate<'info> {
    #[account(mut)]
    pub oracle_data: Account<'info, OracleData>,
    pub authority: Signer<'info>,
}

#[account]
pub struct OracleData {
    pub funding_rate: i64,
}
