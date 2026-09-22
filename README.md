# Portal Eleitoral do Grêmio Estudantil

Aplicação dinâmica para portal público, inscrições, Hub da Comissão, votação e
apuração. A implementação segue a especificação técnica fornecida: frontend sem
framework, funções Node.js na Vercel, Firestore e ImgBB somente pelo backend.

## Configurar uma nova eleição

Na configuração normal, a Comissão altera somente:

1. `config/escola.js`
2. `config/eleicao.js`
3. `config/cargos.js`
4. arquivos de `content/`
5. documentos e imagens publicados

RAs reais **nunca** devem ser commitados. `data/eleitores.example.csv` contém
apenas o cabeçalho para demonstrar o formato. O CSV real deve ser enviado pelo
endpoint protegido do Hub, e não editado no código.

## Segredos e ImgBB

Copie `.env.example` para o ambiente local ou cadastre as mesmas variáveis nas
Environment Variables da Vercel. `IMGBB_API_KEY` fica exclusivamente em
`api/_lib/imgbb.js`, no backend: o navegador nunca recebe a chave. O módulo
envia `image`, `name` e `expiration` via POST para
`https://api.imgbb.com/1/upload` e retorna somente URLs públicas.

## Níveis de alteração

- **Pode alterar:** `config/`, `content/`, `public/documentos/` e imagens.
- **Somente com conhecimento técnico:** `api/_lib/` e scripts.
- **Não altere sem revisão:** `api/voting.js`, autenticação e segurança.

## Execução

```bash
npm install
npm run validate
npm run dev
```

Sem Firebase configurado, o portal exibe honestamente o estado “configuração” e
não aceita votos; não há dados simulados ou credenciais embutidas.
