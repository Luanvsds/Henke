# Henke Climatização

Home estática em HTML, CSS e JavaScript puro, organizada para versionamento no GitHub. Não exige instalação de pacotes nem compilação.

## Abrir localmente

Abra a pasta `henke-site` no VS Code e use um servidor local, como o Live Server. Alternativamente, com Python instalado, execute na raiz do projeto:

```bash
python -m http.server 8000
```

Acesse `http://localhost:8000` no navegador. Use um servidor local para garantir o carregamento das texturas WebGL do hero; abrir pelo protocolo `file://` pode bloquear essas texturas em alguns navegadores.

## Organização

| Caminho | Responsabilidade |
| --- | --- |
| `index.html` | Conteúdo e estrutura da Home |
| `assets/css/fonts.css` | Fontes locais |
| `assets/css/hero.css` | Estilos originais do hero |
| `assets/css/base.css` | Layout, tipografia e responsividade das seções |
| `assets/css/effects.css` | Animações, hovers, navbar e acabamento do PMOC |
| `assets/js/hero-config.js` | Caminhos das imagens usadas pelo hero |
| `assets/js/effects/hero.js` | Efeito interativo de água/gelo do hero |
| `assets/js/effects/page.js` | Scroll reversível, navbar, menu móvel, fotos e hovers |
| `assets/js/plans.js` | Simulador de planos e links de atendimento |
| `assets/images/` | Logos, fundos e fotos |
| `assets/fonts/` | Arquivos WOFF2 usados pelas fontes |
| `docs/ASSETS.md` | Origem e identificação dos recursos |

O conteúdo, a ordem das seções, os valores e o comportamento da revisão aprovada foram mantidos. A reorganização apenas externaliza os recursos e ajusta seus caminhos. Os shaders do hero ficam junto do efeito que os utiliza, em `hero.js`, evitando carregamentos adicionais.

## Levar ao GitHub

Extraia o ZIP. O conteúdo de `henke-site/` deve ficar na raiz do repositório, com `index.html`, `README.md` e `assets/` no mesmo nível. Inclua também `.gitignore` e `.editorconfig`.

A pasta está preparada para versionamento. Nenhum repositório foi criado ou publicado nesta entrega. Não há configuração de publicação automática, domínio ou credenciais.

## Editar

- Textos e links: `index.html`.
- Preços: mantenha os cartões do HTML e os atributos `data-rate` dos campos do simulador consistentes. O cálculo está em `assets/js/plans.js`.
- Aparência das seções: `base.css`; efeitos e ajustes visuais mais recentes: `effects.css`.
- Navbar, menu e animações de rolagem: `assets/js/effects/page.js`.
- Hero: `hero.css`, `hero-config.js` e `effects/hero.js`. Preserve a ordem atual das tags de script.
- Substituir imagens: mantenha os nomes ou atualize os caminhos no HTML, CSS e configuração do hero conforme o uso.

Todos os caminhos são relativos, permitindo hospedar em uma subpasta. As fontes e imagens são locais; somente ações como abrir WhatsApp e Instagram levam a serviços externos.

## Estado da versão

- Hero interativo preservado.
- Navbar transparente no topo e com cor durante a rolagem.
- Textos e cartões com animação reversível de scroll.
- PMOC com imagem ilustrativa, painel de vidro e etapas.
- Planos próximos ao final, com simulador.
- Menu móvel e preferência por movimento reduzido.

O atendimento ainda abre o WhatsApp; não há backend, checkout ou envio automático. O Guia do Ar continua identificado como próxima etapa. As fotos são ilustrativas, não um portfólio de obras da Henke.
