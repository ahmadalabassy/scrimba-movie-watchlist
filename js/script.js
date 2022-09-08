const searchInput = document.querySelector(`.search-text`)
const searchResult = document.querySelector(`main.search.container`)
const watchlist = document.querySelector(`main.watchlist.container`)
const searchBtn = document.querySelector(`.search-btn`)
const baseURL = `https://www.omdbapi.com/`
const apikey = `9ebca557`
const pageIdentifier = document.URL.includes(`index.html`) ? `search` : `watchlist`
const fallbackPoster = `
    <svg class="fallback-poster" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 192">
        <g>
        <path d="M89.3,52.3c7.6,0,13.7-6.1,13.7-13.7s-6.1-13.7-13.7-13.7S75.6,31,75.6,38.6S81.7,52.3,89.3,52.3z"/>
        <path d="M127.9,0H0v192h127.9c0,0,0.1-0.1,0.1-0.1V0.2C128,0.1,128,0,127.9,0z M117.9,10l0.1,155.2l-27.9-53.8
        c-0.8-2.3-2.1-4.1-3.6-4.1c-1.4,0-2.4,1.6-3.6,3.8l-5.3,10.4c-1.1,1.8-2,3.1-3.2,3.1c-1.2,0-2.3-1.1-3.1-2.7
        c-0.3-0.6-0.8-1.7-1.2-2.7L55,80.8c-1.1-3-2.8-4.9-4.7-4.9c-1.9,0-3.6,2.2-4.7,5.1L10,165.1V9.8L117.9,10z"/>
        </g>
    </svg>
`
const syncLoadAnimation = `
    <div class="sync-load-animation">
        <div class="box1"></div>
        <div class="box2"></div>
        <div class="box3"></div>
    </div>  <!-- end of sync-load-animation -->
`
const searchResultPlaceholder = `
    <div class="results-placeholder">
        <svg class="placeholder-img" viewBox="0 0 70 62" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M8.75 0C3.91751 0 0 3.9175 0 8.75V52.5C0 57.3325 3.91751 61.25 8.75 61.25H61.25C66.0825 61.25 70 57.3325 70 52.5V8.75C70 3.9175 66.0825 0 61.25 0H8.75ZM21.875 8.75H48.125V26.25H21.875V8.75ZM56.875 43.75V52.5H61.25V43.75H56.875ZM48.125 35H21.875V52.5H48.125V35ZM56.875 35H61.25V26.25H56.875V35ZM61.25 17.5V8.75H56.875V17.5H61.25ZM13.125 8.75V17.5H8.75V8.75H13.125ZM13.125 26.25H8.75V35H13.125V26.25ZM8.75 43.75H13.125V52.5H8.75V43.75Z" fill="currentColor"/>
        </svg>
        <p class="placeholder-txt">Start exploring</p>
    </div>
`
const watchlistPlaceholder = `
    <div class="results-placeholder">
        <p class="placeholder-txt contrast-boosted">Your watchlist is looking a little empty...</p>
        <a class="placeholder-anchor" href="index.html">Let’s add some movies!</a>
    </div>
`
const savedMovies = JSON.parse(localStorage.getItem(`watchlist`)) || []
let storedFilmsCount = savedMovies.length
let pagesNumber, currentPage, movies, prevInput, moreToBeLoaded

// Default color mode
let colorMode = localStorage.getItem(`color-mode`)
document.addEventListener(`DOMContentLoaded`, () => {
    document.documentElement.setAttribute(`color-mode`, colorMode||`light`)
})

// Add click event to ligh/dark-mode toggle switch, switch mode on click, save it to localStorage
document.querySelector(`.color-mode-switch`).addEventListener(`click`, () => {
    colorMode = document.documentElement.getAttribute(`color-mode`)
    colorMode = colorMode === `dark` ? `light` : `dark`
    document.documentElement.setAttribute(`color-mode`, colorMode)
    localStorage.setItem(`color-mode`, colorMode)
})

/* for search page */
if(searchInput) {
    /* searchBtn click triggers fetch request by keyword, 10 results per page are returned if response Ok,
    each result prompts another fetch by id for film info,
    content added to searchResult */
    searchBtn.addEventListener(`click`, () => initialLoad(searchInput.value.trim().toLowerCase().replace(/\s+/g, `+`)))
    // Enter key fired on non-empty searchInput values initiates a click on searchBtn
    searchInput.addEventListener(`keypress`, event => {
        if (event.key === `Enter`) searchBtn.click()
    })
}

/* for watchlist page */
if(watchlist && storedFilmsCount) {
    currentPage = 1
    pagesNumber = 1
    watchlist.innerHTML = savedMovies.map((movie, index) => constructFilmCardHTML(movie, index, storedFilmsCount)).join(``)
    addEventListeners()
}

/* functions */
async function initialLoad(currentInput) {
    moreToBeLoaded = false
    movies = []
    // if statements to prevent redundant search operations if searchInput hasn't changed from prevInput, or if it's empty string
    if (currentInput === ``) searchResult.innerHTML = searchResultPlaceholder
    else if(currentInput != prevInput) {
        const res = await fetch(`${baseURL}?apikey=${apikey}&page=1&s=${currentInput}`)
        const data = res.ok ? await res.json() : new Error(`Something went wrong`)
        const totalResults = parseInt(data.totalResults)
        currentPage = 1
        if(data.Response === `False` || totalResults === 0) {
            if(data.Error && data.Error === `Too many results.`) {
                searchResult.innerHTML = `<div class="results-placeholder">${syncLoadAnimation}</div>`
                const data = (async() => await fetch(`${baseURL}?apikey=${apikey}&t=${currentInput}`))()
                movies.push({
                    id: data.imdbID,
                    title: data.Title,
                    poster: checkPoster(data.Poster),
                    rating: checkRating(data.Ratings),
                    runtime: data.Runtime,
                    genre: data.Genre,
                    plot: data.Plot
                })
                console.log(data)
                searchResult.innerHTML = constructFilmCardHTML(movies[0], 0, 1)
            } else searchResult.innerHTML = `
                <div class="no-results placeholder-txt contrast-boosted">Unable to find what you’re looking for. Please try another search.</div>
            `
        }
        else {
            pagesNumber = Math.ceil(totalResults/data.Search.length)
            searchResult.innerHTML = `<div class="results-placeholder">${syncLoadAnimation}</div>`
            searchResult.innerHTML = await getFilmCardsHTML(data.Search.map(search => fetch(`${baseURL}?apikey=${apikey}&i=${search.imdbID}`)))
        }
        addEventListeners()
        prevInput = currentInput
    }
}

function loadMore() {
    const loadMoreBtn = document.querySelector(`.load-more-btn`)
    loadMoreBtn.addEventListener(`click`, async () => {
        moreToBeLoaded = false
        loadMoreBtn.outerHTML = ``
        searchResult.innerHTML += syncLoadAnimation
        currentPage++
        const res = await fetch(`${baseURL}?apikey=${apikey}&page=${currentPage}&s=${prevInput}`)
        const data = await res.json()
        searchResult.innerHTML += `
            <hr>
            ${await getFilmCardsHTML(data.Search.map(search => fetch(`${baseURL}?apikey=${apikey}&i=${search.imdbID}`)))}
        `
        searchResult.removeChild(searchResult.querySelector(`.sync-load-animation`))
        addEventListeners()
    })
}

function getFilmCardsHTML(fetchArr) {
    return Promise.all(fetchArr)
        .then(responses => Promise.all(responses.map(res => res.json())))
        .then(data => data.map(({imdbID, Title, Poster, Ratings, Runtime, Genre, Plot}, index, {length}) => (
            movies.push({id: imdbID, title: Title, poster: checkPoster(Poster), rating: checkRating(Ratings), runtime: Runtime, genre: Genre, plot: Plot}),
            constructFilmCardHTML(movies[index], index, length)
        )).join(``))
        .catch(err => console.error(err))
}

function constructFilmCardHTML({id, title, poster, rating, runtime, genre, plot}, index, length) {
    let html = `
        <div class="film-card">
            ${poster ? `<img class="card-cover" src=${poster} alt="${title} film poster">` : fallbackPoster}
            <h2 class="card-title">${title} <span class="card-rating">${rating}</span></h2>
            <div class="card-group-info">
                <p class="card-runtime">${runtime}</p>
                <p class="card-genre">${genre}</p>
                <button class="btn card-watchlist" add-state=${watchlist || savedMovies.some(movie => movie.id === id) ? `removable` : `addable`}>
                    ${watchlist ? `Remove` : `Watchlist`}
                </button>
            </div>
            <p class="card-plot">${plot}</p>
        </div>  <!-- end of film-card -->
    `           
    if (currentPage < pagesNumber && index === length-1) { //load more button displayed after last card on non-last page
        html += `<button class="btn load-more-btn">Load More</button>`
        moreToBeLoaded = true
    } else if (currentPage === pagesNumber && index === length-1) return html // just return after last card on last page
    else html += `<hr>` // add horizontal rule after other cards
    return html
}

function addToOrRemoveFromWatchlist({target: button}, moviesIndex) {
    const addState = button.getAttribute(`add-state`)
    if (addState === `addable`) {
        button.setAttribute(`add-state`, `removable`)
        savedMovies.push(movies[moviesIndex])
    } else {
        button.setAttribute(`add-state`, `addable`)
        const savedMoviesIndex = savedMovies.findIndex(movie => movie.id === moviesIndex.id)
        savedMovies.splice(savedMoviesIndex, 1) // start from index, remove one element
        if (pageIdentifier === `watchlist`) {
            const movieCard = button.parentElement.parentElement
            const nextHr = movieCard.nextElementSibling
            const prevHr = movieCard.previousElementSibling
            let bringPlaceholder
            // remove next hr element, if last card, then remove prev hr, if single card exists, no hrs exist, none removed
            nextHr ? nextHr.remove() : prevHr ? prevHr.remove() : bringPlaceholder = true
            movieCard.remove()
            if(bringPlaceholder) watchlist.innerHTML = watchlistPlaceholder
        }
    }
    localStorage.setItem(`watchlist`, JSON.stringify(savedMovies))
}

function clipPlotText(plot) {
    if (plot.length <= 130) return plot
    else return `
        <span class="card-plot-visible-text">${plot.slice(0, 130)}... </span>
        <button class="btn card-plot-read-more" onclick="showRemainingPlotText(event)">Read more</button>
        <span class="card-plot-remaining-text">${plot.slice(130)} </span>
        <button class="btn card-plot-read-less" onclick="hideRemainingPlotText(event)">Read less</button>
    `
}

function showRemainingPlotText({target: readMore}) {
    const visibleText = readMore.previousElementSibling
    const remainingText = readMore.nextElementSibling
    const readLess = remainingText.nextElementSibling
    visibleText.textContent = visibleText.textContent.slice(0, -4)
    remainingText.style.setProperty(`display`, `unset`)
    readLess.style.setProperty(`display`, `unset`)
    readMore.style.setProperty(`display`, `none`)
}

function hideRemainingPlotText({target: readLess}) {
    const remainingText = readLess.previousElementSibling
    const readMore = remainingText.previousElementSibling
    const visibleText = readMore.previousElementSibling
    visibleText.textContent += `... `
    remainingText.style.setProperty(`display`, `none`)
    readMore.style.setProperty(`display`, `unset`)
    readLess.style.setProperty(`display`, `none`)
}

function addEventListeners() {
    document.querySelectorAll(`.card-watchlist`).forEach((button, index) => 
        button.addEventListener(`click`, event => addToOrRemoveFromWatchlist(event, index))
    )
    moreToBeLoaded && loadMore()
}

function checkRating(ratings) {
    return ratings.length ? ratings[0].Value.slice(0, ratings[0].Value.indexOf(`/`)) : `N/A`
}

function checkPoster(poster) {
    return poster === `N/A` ? null : poster
}