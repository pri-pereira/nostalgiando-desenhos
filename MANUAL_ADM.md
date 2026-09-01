# Manual do Admin: Adicionando Novos Desenhos

Guarde as etapas abaixo como referência fixa sempre que for expandir o seu catálogo. Como o site é estático (sem banco de dados real), o botão de administrador que existe na interface serve como um atalho visual e prático no seu navegador, mas para salvar permanentemente na Vercel para todos verem, você precisa alterar o código.

**1. Capture o ID do Desenho**
Acesse o archive.org, localize a página da série desejada e copie apenas a última parte do link (ex: na URL `archive.org/details/he-man-completo`, o ID é `he-man-completo`).

**2. Acesse o Painel de Código**
Abra o seu repositório no GitHub, clique no arquivo da sua página principal (onde ficam os cartazes, como o `index.html`) e clique no ícone de lápis para editar.

**3. Adicione a Capa**
Copie e cole a estrutura HTML de um cartaz já existente na prateleira (categoria) escolhida.

**4. Configure o Link Mágico**
Na tag `<a>` desse novo cartaz, insira o link apontando para o seu player universal acompanhado do ID capturado. O código exato será: `<a href="player.html?id=ID_AQUI">`. (Lembre-se de alterar também o link da imagem `<img src="...">` para mostrar o pôster correto).

**5. Publique a Atualização**
Salve o arquivo clicando no botão verde *Commit changes*. A Vercel identificará a edição imediatamente e o desenho novo entrará no ar para todos os visitantes sem que você precise configurar mais nada.

Dessa forma, o seu arquivo `player.html` nunca mais precisa ser tocado; você só mexe na página inicial para adicionar as novas capas e puxar as thumbnails.
