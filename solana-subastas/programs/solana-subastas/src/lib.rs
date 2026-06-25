use anchor_lang::prelude::*;

declare_id!("FgYc9CFaC3KnGniZ7ATrAvSX7PX4AspW225GUkYz8tcj");

#[program]
pub mod solana_subastas {
    use super::*;

    pub fn crear_subasta(
        ctx: Context<CrearSubastaContext>,
        id: u64,
        nombre: String,
        descripcion: String,
        importe_minimo: u64,
        fecha_inicio: u64,
        fecha_fin: u64,
    ) -> Result<()> {
        require!(fecha_fin > fecha_inicio, SubastasError::FechaFinInvalida);

        let subasta = &mut ctx.accounts.subasta;
        subasta.id = id;
        subasta.nombre = nombre;
        subasta.descripcion = descripcion;
        subasta.importe_minimo = importe_minimo;
        subasta.fecha_inicio = fecha_inicio;
        subasta.fecha_fin = fecha_fin;
        subasta.estado = 0;
        subasta.creador = *ctx.accounts.user.key;
        subasta.ganador = Pubkey::default();
        subasta.importe_ganador = 0;
        Ok(())
    }

    pub fn iniciar_subasta(ctx: Context<SubastaContext>, _id: u64) -> Result<()> {
        let subasta = &mut ctx.accounts.subasta;
        require!(subasta.estado == 0, SubastasError::SubastaYaIniciada);
        require!(
            subasta.creador == *ctx.accounts.user.key,
            SubastasError::SoloCreadorPuedeIniciar
        );
        subasta.estado = 1;
        Ok(())
    }

    pub fn crear_puja(
        ctx: Context<CrearPujaContext>,
        id: u64,
        importe_puja: u64,
        ts: u64,
    ) -> Result<()> {
        let subasta = &mut ctx.accounts.subasta;
        require!(subasta.estado == 1, SubastasError::SubastaNoActiva);
        require!(ts < subasta.fecha_fin, SubastasError::SubastaYaFinalizada);
        require!(
            importe_puja >= subasta.importe_minimo,
            SubastasError::PujaInsuficiente
        );

        if importe_puja > subasta.importe_ganador {
            subasta.ganador = *ctx.accounts.user.key;
            subasta.importe_ganador = importe_puja;
        }

        let puja = &mut ctx.accounts.puja;
        puja.id = id;
        puja.importe_puja = importe_puja;
        puja.ts = ts;
        puja.pk = *ctx.accounts.user.key;
        Ok(())
    }

    pub fn finalizar_subasta(ctx: Context<SubastaContext>, _id: u64) -> Result<()> {
        let subasta = &mut ctx.accounts.subasta;
        require!(subasta.estado != 2, SubastasError::SubastaYaFinalizada);
        require!(
            subasta.creador == *ctx.accounts.user.key,
            SubastasError::SoloCreadorPuedeFinalizar
        );
        subasta.estado = 2;
        Ok(())
    }
}

// === Structs de datos ===

#[account]
#[derive(InitSpace)]
pub struct Subasta {
    pub id: u64,
    #[max_len(32)]
    pub nombre: String,
    #[max_len(280)]
    pub descripcion: String,
    pub importe_minimo: u64,
    pub fecha_inicio: u64,
    pub fecha_fin: u64,
    pub estado: u64,
    pub creador: Pubkey,
    pub ganador: Pubkey,
    pub importe_ganador: u64,
}

#[account]
#[derive(InitSpace)]
pub struct Puja {
    pub id: u64,
    pub importe_puja: u64,
    pub ts: u64,
    pub pk: Pubkey,
}

// === Contexts ===

#[derive(Accounts)]
#[instruction(id: u64)]
pub struct CrearSubastaContext<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + Subasta::INIT_SPACE,
        seeds = [b"subasta", id.to_le_bytes().as_ref()],
        bump
    )]
    pub subasta: Account<'info, Subasta>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(id: u64)]
pub struct SubastaContext<'info> {
    #[account(
        mut,
        seeds = [b"subasta", id.to_le_bytes().as_ref()],
        bump
    )]
    pub subasta: Account<'info, Subasta>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(id: u64)]
pub struct CrearPujaContext<'info> {
    #[account(
        mut,
        seeds = [b"subasta", id.to_le_bytes().as_ref()],
        bump
    )]
    pub subasta: Account<'info, Subasta>,
    #[account(
        init,
        payer = user,
        space = 8 + Puja::INIT_SPACE,
        seeds = [b"puja", id.to_le_bytes().as_ref(), user.key().as_ref()],
        bump
    )]
    pub puja: Account<'info, Puja>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// === Errores ===

#[error_code]
pub enum SubastasError {
    #[msg("La subasta ya ha sido iniciada")]
    SubastaYaIniciada,
    #[msg("La subasta no está activa")]
    SubastaNoActiva,
    #[msg("La subasta ya ha sido finalizada")]
    SubastaYaFinalizada,
    #[msg("El importe de la puja es insuficiente")]
    PujaInsuficiente,
    #[msg("Solo el creador puede iniciar la subasta")]
    SoloCreadorPuedeIniciar,
    #[msg("Solo el creador puede finalizar la subasta")]
    SoloCreadorPuedeFinalizar,
    #[msg("La fecha de fin debe ser posterior a la de inicio")]
    FechaFinInvalida,
}
