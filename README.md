# Desafio técnico

Este é o projeto de uma Pokédex construída usando HTML, CSS e JavaScript (vanilla). O projeto consome a PokeAPI (https://pokeapi.co/) para exibir as informações sobre os pokémons. usei o site https://www.poke-blast-news.net/2015/10/tipos-de-pokemon.html de referencia para o filtro dos pokémons

# Funcionalidades

- a busca por Pokémons pode ser feita pelo nome ou/e pelo filtro a partir da busca
- navegação de páginas que permitem navegar entre os pokémons 
- caso o Pokémon buscado não seja encontrado, uma mensagem informando "Nenhum pokémon foi encontrado."

# Estrutura do Projeto

O projeto é composto pelos seguintes arquivos principais:

- pokedex.html: estrutura básica disponível no figma do projeto com a listagem de pokemons, busca, filtros a partir do tipo do pokemon disponível na API e paginação
- home.html: página 1 do figma como navegação, inseri nela uma busca e filtro. caso haja mais de uma pagina para paginar, a paginação estará disponível 
- styles.css: estilos do projeto
- scripts.js: criação da lógica de todas as funcionalidades, busca dos dados da API e manipulação do DOM para exibir as informações


### Deploy
https://desafio-tecnico-peach.vercel.app/home.html 
https://desafio-tecnico-peach.vercel.app/pokedex.html
