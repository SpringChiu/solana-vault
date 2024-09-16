import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

import * as utils from "./utils";
import * as constants from "./constants";

import OAppIdl from "../target/idl/solana_vault.json";
import { SolanaVault } from "../target/types/solana_vault";
const OAPP_PROGRAM_ID = new PublicKey(OAppIdl.metadata.address);
const OAppProgram = anchor.workspace.SolanaVault as anchor.Program<SolanaVault>;

const [provider, wallet, rpc] = utils.setAnchor();

async function setup() {
    console.log("Setting up Vault...");
    const usdc = await utils.getUSDCAddress(provider, wallet, rpc);
    const userUSDCAccount = await utils.getUSDCAccount(provider, wallet, usdc, wallet.publicKey);
    console.log("User USDCAccount", userUSDCAccount.toBase58());

    
    // const amountToMint = 5000;
    // await utils.mintUSDC(provider, wallet, usdc, userUSDCAccount, amountToMint);

    const vaultAuthorityPda = utils.getVaultAuthorityPda(OAPP_PROGRAM_ID);
    console.log("Vault Deposit Authority PDA:", vaultAuthorityPda.toBase58());

    const vaultUSDCAccount = await utils.getUSDCAccount(provider, wallet, usdc, vaultAuthorityPda);
    console.log("Vault USDCAccount", vaultUSDCAccount.toBase58());

    const tableAddress = [usdc, vaultAuthorityPda, vaultUSDCAccount]

    const ixInitVault = await OAppProgram.methods.initVault().accounts({
        signer: wallet.publicKey,
        vaultAuthority: vaultAuthorityPda,

    }).instruction();

    console.log("Init Vault:");
    try {
        await utils.createAndSendV0TxWithTable([ixInitVault], provider, wallet, tableAddress);
    } catch (e) {
        console.log("Vault already initialized");
    }
}

setup();