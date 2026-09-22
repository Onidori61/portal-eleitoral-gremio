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

Para o Firebase, a forma mais segura de evitar erro ao copiar quebras de linha
é cadastrar na Vercel a variável `FIREBASE_SERVICE_ACCOUNT_JSON` com o conteúdo
inteiro do arquivo JSON da conta de serviço. Nesse caso, não é preciso
preencher `FIREBASE_PRIVATE_KEY`. Nunca coloque esse JSON no GitHub.

## Níveis de alteração

- **Pode alterar:** `config/`, `content/`, `public/documentos/` e imagens.
- **Somente com conhecimento técnico:** `api/_lib/` e scripts.
- **Não altere sem revisão:** `api/voting.js`, autenticação e segurança.

## Execução

```bash
npm install
npm run validate
npm start
```

Sem Firebase configurado, o portal exibe honestamente o estado “configuração” e
não aceita votos; não há dados simulados ou credenciais embutidas.

## Fluxo de chapas

Estudantes usam `/inscricao.html` para enviar nome, apresentação, os oito cargos,
integrantes, propostas e redes sociais. A inscrição é gravada como `pendente` na
coleção `slates` e não é publicada automaticamente.

A Comissão acessa `/hub.html`, informa o `COMMISSION_API_TOKEN`, abre
**Inscrições pendentes**, confere os dados, envia a imagem aprovada pelo ImgBB,
atribui o número e escolhe **Habilitar** ou **Indeferir**. Somente chapas
habilitadas aparecem no portal público.

No mesmo Hub, a Comissão pode carregar e salvar a configuração da eleição:

- `configuração`, `inscrições abertas`, `campanha`, `votação aberta`,
  `apuração` ou `encerrada`;
- status público exibido no portal;
- início e fim das inscrições;
- início e fim da campanha;
- início e fim da votação;
- data da apuração.

Também é possível publicar documentos e comunicados diretamente no Hub. Para um
documento, use um link público para o arquivo e marque a opção de publicação.
Para trocar o logo, substitua `public/imagens/logo-gremio.png` por uma imagem
aprovada, mantendo esse nome. As turmas disponíveis na inscrição ficam em
`config/turmas.js`.

Para abrir a votação, o sistema exige as duas datas. Para editar uma chapa,
carregue a lista, altere nome/apresentação/número e salve; a mudança é persistida
no Firestore e refletida no portal público quando a chapa estiver habilitada.
