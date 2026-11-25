# Meu Sistema Pessoal

Agenda e dashboard pessoal, feito para o celular e instalável na tela inicial (PWA).

## O que tem
- **Início**: saudação, frase do dia, resumo de hoje (Pessoal e Trabalho) e hábitos diários com sequência 🔥
- **Pessoal** e **Trabalho**: agendas separadas, com visão por **dia**, **semana** (colunas estilo Trello) e **mês**
  - tarefas (com checkbox) e eventos (com horário de início e fim)
  - lembretes com notificação
  - deslize para o lado para trocar de dia ou de mês
- **Ideias**: mural de post-its para soltar pensamentos rápidos
- **Wishlist**: desejos com imagem anexada
- **Ajustes** (engrenagem no Início): seu nome, notificações e backup (exportar/importar)

## Dados
Tudo fica salvo **só no aparelho** (localStorage + IndexedDB). Nada é enviado para servidor.
Use *Ajustes → Exportar backup* de vez em quando.

## Arquivos
- `index.html`, `styles.css`, `app.js`: o app
- `sw.js`: service worker (funciona offline e mostra notificações)
- `manifest.webmanifest` e `icons/`: o que permite instalar como app

Paleta: `#c4dae8` · `#feefb8` · `#432f2e`
