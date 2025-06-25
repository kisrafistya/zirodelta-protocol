use anchor_lang::prelude::*;

#[account]
pub struct OracleData {
    pub rate: i64,
}
