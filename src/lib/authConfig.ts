/**
 * Configurações Globais de Autenticação e Segurança
 * 
 * ------------------------------------------------------------------------------
 * CONTROLE DE AUTENTICAÇÃO DE 2 FATORES (2FA) PARA ADMINISTRADORES:
 * 
 * - Para DESATIVAR temporariamente: mantenha `ENABLE_ADMIN_2FA = false`
 *   (Permite login direto com e-mail e senha de admin, acelerando o cadastro de títulos).
 * 
 * - Para REABILITAR o 2FA:
 *   Basta alterar para `ENABLE_ADMIN_2FA = true` abaixo
 *   OU adicionar no seu arquivo `.env`: `VITE_ENABLE_ADMIN_2FA="true"`
 * ------------------------------------------------------------------------------
 */

export const ENABLE_ADMIN_2FA: boolean =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_ENABLE_ADMIN_2FA !== undefined
    ? import.meta.env.VITE_ENABLE_ADMIN_2FA === "true"
    : false;
