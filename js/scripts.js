const PokedexApplication = (() => {

  const SETTINGS = {
    API_URL: 'https://pokeapi.co/api/v2/pokemon?limit=1300&offset=0',
    ITEMS_PER_PAGE: 18,
    DEFAULT_IMAGE: '../images/pokebola.png'
  }

  const TYPE_NAME_TRANSLATIONS = {
    grass: 'Planta', fire: 'Fogo', water: 'Água', bug: 'Inseto',
    normal: 'Normal', poison: 'Venenoso', electric: 'Elétrico',
    ground: 'Terra', fairy: 'Fada', fighting: 'Lutador',
    psychic: 'Psíquico', rock: 'Pedra', ghost: 'Fantasma',
    ice: 'Gelo', dragon: 'Dragão', steel: 'Aço',
    dark: 'Sombrio', flying: 'Voador'
  }

  const applicationState = {
    fullPokemonList: [],    
    filteredPokemonList: [], 
    selectedTypes: new Set(),
    cachedTypeData: new Map(), 
    currentPageIndex: 1,
    isHomePage: document.body.classList.contains('page-home')
  }

  const htmlElements = {
    pokemonGridContainer: document.getElementById('pokedexGrid'),
    searchTextField: document.getElementById('searchInput'),
    searchButton: document.getElementById('searchIconBtn'),
    loadingSpinner: document.getElementById('loader'),
    paginationContainer: document.getElementById('pagination'),
    emptyStateMessage: document.getElementById('emptyState'),
    filterCheckboxes: document.querySelectorAll('#filterOptions input[type="checkbox"]'),
    filterDropdownMenu: document.getElementById('filterDropdown'),
    mainBody: document.body
  }

  const visualHelpers = {
    toggleLoadingState(isVisible) {
      if (htmlElements.loadingSpinner) {
        htmlElements.loadingSpinner.style.display = isVisible ? 'block' : 'none'
      }
      if (htmlElements.pokemonGridContainer) {
        htmlElements.pokemonGridContainer.style.opacity = isVisible ? '0.5' : '1'
      }
    },

    formatPokemonName(slugName) {
      return slugName.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    },

    getTranslatedType(englishType) {
      return TYPE_NAME_TRANSLATIONS[englishType] || englishType
    }
  }

  const dataService = {
    async fetchAllPokemon() {
      const response = await fetch(SETTINGS.API_URL)
      const jsonData = await response.json()
      
      return jsonData.results.map((pokemon, index) => ({
        name: pokemon.name,
        url: pokemon.url,
        id: index + 1
      }))
    },

    async fetchPokemonDetails(url) {
      try {
        const response = await fetch(url)
        return await response.json()
      } catch (error) {
        return null
      }
    },

    async fetchPokemonUrlsByType(type) {
      if (applicationState.cachedTypeData.has(type)) {
        return applicationState.cachedTypeData.get(type)
      }

      try {
        const response = await fetch(`https://pokeapi.co/api/v2/type/${type}`)
        const data = await response.json()

        const pokemonUrls = new Set(
          data.pokemon
            .filter(item => item.slot === 1)
            .map(item => item.pokemon.url)
        )
        
        applicationState.cachedTypeData.set(type, pokemonUrls)
        return pokemonUrls
      } catch (error) {
        return new Set()
      }
    }
  }

  const htmlGenerator = {
    createPokemonCard(pokemonData) {
      const mainType = pokemonData.types[0]?.type.name || 'normal'
      const translatedTypeName = visualHelpers.getTranslatedType(mainType)
      
      const imageUrl = pokemonData.sprites.other['official-artwork'].front_default || pokemonData.sprites.front_default || SETTINGS.DEFAULT_IMAGE

      const cardContainer = document.createElement('div')
      cardContainer.className = 'card'
      
      cardContainer.innerHTML = `
        <div class="card-header">
          <span class="poke-type type-${mainType}">${translatedTypeName}</span>
          <span class="poke-id">#${pokemonData.id.toString().padStart(4, '0')}</span>
        </div>
        <div class="card-image-container">
          <img src="${imageUrl}" alt="${pokemonData.name}" class="card-image" loading="lazy">
        </div>
        <h3 class="poke-name">${visualHelpers.formatPokemonName(pokemonData.name)}</h3>
      `

      const imageElement = cardContainer.querySelector('img')
      imageElement.onerror = () => { imageElement.src = SETTINGS.DEFAULT_IMAGE }

      return cardContainer
    },

    createPaginationButton(label, targetPage, isActive, cssClass = '') {
      const button = document.createElement('button')
      button.className = `page-btn ${cssClass} ${isActive ? 'active' : ''}`
      button.textContent = label

      if (!isActive) {
        button.onclick = () => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
          logicController.displayPage(targetPage)
        }
      }
      return button
    }
  }

  const logicController = {
    async applySearchAndFilters() {
      const searchQuery = htmlElements.searchTextField.value.toLowerCase().trim()
      const isSearchActive = searchQuery.length > 0
      const isTypeFilterActive = applicationState.selectedTypes.size > 0

      if (htmlElements.filterDropdownMenu) htmlElements.filterDropdownMenu.open = false
      htmlElements.mainBody.classList.toggle('has-search', isSearchActive || isTypeFilterActive)

      if (applicationState.isHomePage && !isSearchActive && !isTypeFilterActive) {
        applicationState.filteredPokemonList = []
        this.displayPage(1)
        return
      }

      visualHelpers.toggleLoadingState(true)

      try {
        let allowedUrlsByType = null

        if (isTypeFilterActive) {
          const typePromises = Array.from(applicationState.selectedTypes)
            .map(type => dataService.fetchPokemonUrlsByType(type))
            
          const results = await Promise.all(typePromises)
          
          allowedUrlsByType = new Set()
          results.forEach(urlSet => {
            urlSet.forEach(url => allowedUrlsByType.add(url))
          })
        }

        applicationState.filteredPokemonList = applicationState.fullPokemonList.filter(pokemon => {
          const matchesName = !isSearchActive || pokemon.name.includes(searchQuery)
          const matchesType = allowedUrlsByType === null || allowedUrlsByType.has(pokemon.url)
          
          return matchesName && matchesType
        })

        this.displayPage(1)

      } catch (error) {
      } finally {
        visualHelpers.toggleLoadingState(false)
      }
    },

    async displayPage(pageNumber) {
      applicationState.currentPageIndex = pageNumber
      
      const grid = htmlElements.pokemonGridContainer
      if (!grid) return

      grid.innerHTML = ''
      if (htmlElements.emptyStateMessage) htmlElements.emptyStateMessage.style.display = 'none'

      if (applicationState.filteredPokemonList.length === 0) {
        const shouldShowEmptyMessage = !applicationState.isHomePage || htmlElements.mainBody.classList.contains('has-search')
        
        if (shouldShowEmptyMessage && htmlElements.emptyStateMessage) {
          htmlElements.emptyStateMessage.style.display = 'block'
        }
        
        visualHelpers.toggleLoadingState(false)
        if (htmlElements.paginationContainer) htmlElements.paginationContainer.innerHTML = ''
        return
      }

      visualHelpers.toggleLoadingState(true)

      const startIndex = (pageNumber - 1) * SETTINGS.ITEMS_PER_PAGE
      const endIndex = startIndex + SETTINGS.ITEMS_PER_PAGE
      const pokemonChunk = applicationState.filteredPokemonList.slice(startIndex, endIndex)

      const pokemonDetails = await Promise.all(
        pokemonChunk.map(pokemon => dataService.fetchPokemonDetails(pokemon.url))
      )
      
      pokemonDetails.forEach(details => {
        if (details) {
          grid.appendChild(htmlGenerator.createPokemonCard(details))
        }
      })

      this.updatePaginationInterface()
      visualHelpers.toggleLoadingState(false)
    },

    updatePaginationInterface() {
      const container = htmlElements.paginationContainer
      if (!container) return

      container.innerHTML = ''
      const totalPages = Math.ceil(applicationState.filteredPokemonList.length / SETTINGS.ITEMS_PER_PAGE)
      
      if (totalPages <= 1) return

      const current = applicationState.currentPageIndex

      const prevButton = htmlGenerator.createPaginationButton('Anterior', current - 1, false, 'prev')
      if (current === 1) { prevButton.disabled = true; prevButton.onclick = null }
      container.appendChild(prevButton)

      let startPage = Math.max(1, current - 1)
      let endPage = Math.min(totalPages, current + 1)
      if (current === 1) endPage = Math.min(3, totalPages)
      if (current === totalPages) startPage = Math.max(1, totalPages - 2)

      for (let i = startPage; i <= endPage; i++) {
        container.appendChild(htmlGenerator.createPaginationButton(i, i, i === current))
      }

      const nextButton = htmlGenerator.createPaginationButton('Próximo', current + 1, false, 'next')
      if (current === totalPages) { nextButton.disabled = true; nextButton.onclick = null }
      container.appendChild(nextButton)
    }
  }


  const setupEventListeners = () => {

    if (htmlElements.searchTextField) {
      htmlElements.searchTextField.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') logicController.applySearchAndFilters()
      })
    }

    if (htmlElements.searchButton) {
      htmlElements.searchButton.addEventListener('click', () => logicController.applySearchAndFilters())
    }

    htmlElements.filterCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (event) => {
        if (event.target.checked) {
          applicationState.selectedTypes.add(event.target.value)
        } else {
          applicationState.selectedTypes.delete(event.target.value)
        }
      })
    })

    document.addEventListener('click', (event) => {
      const dropdown = htmlElements.filterDropdownMenu
      if (dropdown && dropdown.open && !dropdown.contains(event.target)) {
        dropdown.open = false
      }
    })
  };

  const init = async () => {
    setupEventListeners()

    try {
      const allData = await dataService.fetchAllPokemon()
      applicationState.fullPokemonList = allData
      
      applicationState.filteredPokemonList = applicationState.isHomePage ? [] : [...applicationState.fullPokemonList]
      
      await logicController.displayPage(1)
    } catch (error) {
      visualHelpers.toggleLoadingState(false)
    }
  };

  return { 
    init 
}
})();

document.addEventListener('DOMContentLoaded', PokedexApplication.init);