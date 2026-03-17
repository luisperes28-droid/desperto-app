/*
  # Ativar extensão pg_net

  1. Problema
    - Cron job está a falhar com "schema net does not exist"
    - pg_net é necessário para fazer chamadas HTTP do PostgreSQL
  
  2. Solução
    - Ativar extensão pg_net
    - Isso permite usar net.http_post() no cron job
*/

-- Ativar extensão pg_net (necessária para chamadas HTTP)
CREATE EXTENSION IF NOT EXISTS pg_net;