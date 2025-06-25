use anchor_lang::prelude::*;

pub trait ZiroDelta {
    fn settle(&self) -> Result<()>;
}
