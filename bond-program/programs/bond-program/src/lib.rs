use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("fLKWY8nbcVkQAz5YHrZDb7kLvN55eSZSUbVR761mqpo");

#[program]
pub mod bond_program {
    use super::*;

    pub fn initialize_bond_listing(
        ctx: Context<InitializeBondListing>,
        bond_amount: u64,
        price_per_bond: u64,
    ) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        listing.issuer = ctx.accounts.issuer.key();
        listing.bond_mint = ctx.accounts.bond_mint.key();
        listing.stablecoin_mint = ctx.accounts.stablecoin_mint.key();
        listing.bond_amount = bond_amount;
        listing.price_per_bond = price_per_bond;
        listing.is_active = true;
        listing.bump = ctx.bumps.listing;

        // Transfer bonds from issuer to escrow
        let cpi_accounts = Transfer {
            from: ctx.accounts.issuer_bond_ata.to_account_info(),
            to: ctx.accounts.escrow.to_account_info(),
            authority: ctx.accounts.issuer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(CpiContext::new(cpi_program, cpi_accounts), bond_amount)?;

        msg!("Bond listing created: {} bonds at {} per bond", bond_amount, price_per_bond);
        Ok(())
    }

    pub fn purchase_bonds(
        ctx: Context<PurchaseBonds>,
        amount: u64,
    ) -> Result<()> {
        let listing = &ctx.accounts.listing;
        require!(listing.is_active, BondError::ListingNotActive);
        require!(listing.bond_amount >= amount, BondError::InsufficientBonds);

        let total_price = amount
            .checked_mul(listing.price_per_bond)
            .ok_or(BondError::MathOverflow)?;

        let issuer_key = listing.issuer;
        let bond_mint_key = listing.bond_mint;
        let bump = listing.bump;

        // 1) Buyer pays stablecoins to issuer
        let cpi_accounts_pay = Transfer {
            from: ctx.accounts.buyer_stablecoin_ata.to_account_info(),
            to: ctx.accounts.issuer_stablecoin_ata.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        };
        token::transfer(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts_pay),
            total_price,
        )?;

        // 2) Escrow sends bonds to buyer (PDA signer)
        let seeds = &[
            b"listing",
            issuer_key.as_ref(),
            bond_mint_key.as_ref(),
            &[bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts_bonds = Transfer {
            from: ctx.accounts.escrow.to_account_info(),
            to: ctx.accounts.buyer_bond_ata.to_account_info(),
            authority: ctx.accounts.listing.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts_bonds,
                signer_seeds,
            ),
            amount,
        )?;

        let listing = &mut ctx.accounts.listing;
        listing.bond_amount = listing.bond_amount.checked_sub(amount).ok_or(BondError::MathOverflow)?;

        emit!(BondsPurchased {
            buyer: ctx.accounts.buyer.key(),
            issuer: issuer_key,
            bond_mint: bond_mint_key,
            amount,
            total_price,
        });

        msg!("Purchased {} bonds for {} stablecoins", amount, total_price);
        Ok(())
    }

    pub fn cancel_listing(ctx: Context<CancelListing>) -> Result<()> {
        let listing = &ctx.accounts.listing;
        require!(listing.is_active, BondError::ListingNotActive);
        require!(listing.bond_amount > 0, BondError::NoBondsToReturn);

        let return_amount = listing.bond_amount;
        let issuer_key = listing.issuer;
        let bond_mint_key = listing.bond_mint;
        let bump = listing.bump;

        let seeds = &[
            b"listing",
            issuer_key.as_ref(),
            bond_mint_key.as_ref(),
            &[bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow.to_account_info(),
            to: ctx.accounts.issuer_bond_ata.to_account_info(),
            authority: ctx.accounts.listing.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
                signer_seeds,
            ),
            return_amount,
        )?;

        let listing = &mut ctx.accounts.listing;
        listing.bond_amount = 0;
        listing.is_active = false;

        msg!("Listing cancelled, {} bonds returned", return_amount);
        Ok(())
    }

    pub fn update_price(
        ctx: Context<UpdatePrice>,
        new_price: u64,
    ) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        require!(listing.is_active, BondError::ListingNotActive);

        listing.price_per_bond = new_price;

        msg!("Price updated to {}", new_price);
        Ok(())
    }

    pub fn add_bonds_to_listing(
        ctx: Context<AddBondsToListing>,
        additional_amount: u64,
    ) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        require!(listing.is_active, BondError::ListingNotActive);

        let cpi_accounts = Transfer {
            from: ctx.accounts.issuer_bond_ata.to_account_info(),
            to: ctx.accounts.escrow.to_account_info(),
            authority: ctx.accounts.issuer.to_account_info(),
        };
        token::transfer(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts),
            additional_amount,
        )?;

        listing.bond_amount = listing
            .bond_amount
            .checked_add(additional_amount)
            .ok_or(BondError::MathOverflow)?;

        msg!("Added {} bonds to listing", additional_amount);
        Ok(())
    }
}

// --- Accounts ---

#[derive(Accounts)]
pub struct InitializeBondListing<'info> {
    #[account(mut)]
    pub issuer: Signer<'info>,

    pub bond_mint: Account<'info, Mint>,
    pub stablecoin_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = issuer,
        space = 8 + BondListing::INIT_SPACE,
        seeds = [b"listing", issuer.key().as_ref(), bond_mint.key().as_ref()],
        bump,
    )]
    pub listing: Account<'info, BondListing>,

    #[account(
        init,
        payer = issuer,
        token::mint = bond_mint,
        token::authority = listing,
        seeds = [b"escrow", listing.key().as_ref()],
        bump,
    )]
    pub escrow: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = bond_mint,
        associated_token::authority = issuer,
    )]
    pub issuer_bond_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct PurchaseBonds<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"listing", listing.issuer.as_ref(), listing.bond_mint.as_ref()],
        bump = listing.bump,
    )]
    pub listing: Account<'info, BondListing>,

    #[account(
        mut,
        seeds = [b"escrow", listing.key().as_ref()],
        bump,
    )]
    pub escrow: Account<'info, TokenAccount>,

    #[account(mut)]
    pub buyer_stablecoin_ata: Account<'info, TokenAccount>,

    #[account(mut)]
    pub issuer_stablecoin_ata: Account<'info, TokenAccount>,

    #[account(mut)]
    pub buyer_bond_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelListing<'info> {
    #[account(mut)]
    pub issuer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"listing", issuer.key().as_ref(), listing.bond_mint.as_ref()],
        bump = listing.bump,
        has_one = issuer,
    )]
    pub listing: Account<'info, BondListing>,

    #[account(
        mut,
        seeds = [b"escrow", listing.key().as_ref()],
        bump,
    )]
    pub escrow: Account<'info, TokenAccount>,

    #[account(mut)]
    pub issuer_bond_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UpdatePrice<'info> {
    pub issuer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"listing", issuer.key().as_ref(), listing.bond_mint.as_ref()],
        bump = listing.bump,
        has_one = issuer,
    )]
    pub listing: Account<'info, BondListing>,
}

#[derive(Accounts)]
pub struct AddBondsToListing<'info> {
    #[account(mut)]
    pub issuer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"listing", issuer.key().as_ref(), listing.bond_mint.as_ref()],
        bump = listing.bump,
        has_one = issuer,
    )]
    pub listing: Account<'info, BondListing>,

    #[account(
        mut,
        seeds = [b"escrow", listing.key().as_ref()],
        bump,
    )]
    pub escrow: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = listing.bond_mint,
        associated_token::authority = issuer,
    )]
    pub issuer_bond_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// --- State ---

#[account]
#[derive(InitSpace)]
pub struct BondListing {
    pub issuer: Pubkey,        // 32
    pub bond_mint: Pubkey,     // 32
    pub stablecoin_mint: Pubkey, // 32
    pub bond_amount: u64,      // 8
    pub price_per_bond: u64,   // 8
    pub bump: u8,              // 1
    pub is_active: bool,       // 1
}
// Total: 114 bytes + 8 discriminator = 122

// --- Events ---

#[event]
pub struct BondsPurchased {
    pub buyer: Pubkey,
    pub issuer: Pubkey,
    pub bond_mint: Pubkey,
    pub amount: u64,
    pub total_price: u64,
}

// --- Errors ---

#[error_code]
pub enum BondError {
    #[msg("Listing is not active")]
    ListingNotActive,
    #[msg("Insufficient bonds in listing")]
    InsufficientBonds,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("No bonds to return")]
    NoBondsToReturn,
}
