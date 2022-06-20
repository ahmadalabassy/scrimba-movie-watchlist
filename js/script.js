const searchInput = document.querySelector(`.search-text`)
const searchResult = document.querySelector(`main.search.container`)
const watchlist = document.querySelector(`main.watchlist.container`)
const searchBtn = document.querySelector(`.search-btn`)
const cardFallbackCover = `<svg class="card-fallback-cover" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 192">
                                <g>
                                <path d="M89.3,52.3c7.6,0,13.7-6.1,13.7-13.7s-6.1-13.7-13.7-13.7S75.6,31,75.6,38.6S81.7,52.3,89.3,52.3z"/>
                                <path d="M127.9,0H0v192h127.9c0,0,0.1-0.1,0.1-0.1V0.2C128,0.1,128,0,127.9,0z M117.9,10l0.1,155.2l-27.9-53.8
                                c-0.8-2.3-2.1-4.1-3.6-4.1c-1.4,0-2.4,1.6-3.6,3.8l-5.3,10.4c-1.1,1.8-2,3.1-3.2,3.1c-1.2,0-2.3-1.1-3.1-2.7
                                c-0.3-0.6-0.8-1.7-1.2-2.7L55,80.8c-1.1-3-2.8-4.9-4.7-4.9c-1.9,0-3.6,2.2-4.7,5.1L10,165.1V9.8L117.9,10z"/>
                                </g>
                           </svg>`
const syncLoadAnimation = `<div class="sync-load-animation">
                                <div class="box1"></div>
                                <div class="box2"></div>
                                <div class="box3"></div>
                           </div>`
const searchResultPlaceholder = `<div class="results-placeholder">
                                    <svg class="placeholder-img" viewBox="0 0 70 62" xmlns="http://www.w3.org/2000/svg">
                                        <path fill-rule="evenodd" clip-rule="evenodd" d="M8.75 0C3.91751 0 0 3.9175 0 8.75V52.5C0 57.3325 3.91751 61.25 8.75 61.25H61.25C66.0825 61.25 70 57.3325 70 52.5V8.75C70 3.9175 66.0825 0 61.25 0H8.75ZM21.875 8.75H48.125V26.25H21.875V8.75ZM56.875 43.75V52.5H61.25V43.75H56.875ZM48.125 35H21.875V52.5H48.125V35ZM56.875 35H61.25V26.25H56.875V35ZM61.25 17.5V8.75H56.875V17.5H61.25ZM13.125 8.75V17.5H8.75V8.75H13.125ZM13.125 26.25H8.75V35H13.125V26.25ZM8.75 43.75H13.125V52.5H8.75V43.75Z" fill="currentColor"/>
                                    </svg>
                                    <p class="placeholder-txt">Start exploring</p>
                                </div>`
const watchlistPlaceholder = `<div class="results-placeholder">
                                <p class="placeholder-txt contrast-boosted">Your watchlist is looking a little empty...</p>
                                <a class="placeholder-anchor" href="index.html">Let’s add some movies!</a>
                             </div>`
const maxResultsPerFetchedPage = 10
let pagesNumber, currentPage, filmCardsContent, currentInput,
filmsID, prevInput, loadMoreBtn, moreToBeLoaded

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

if(searchInput) {
    /* searchBtn click triggers fetch request by keyword, 10 results per page are returned if response Ok,
    each result prompts another fetch by id for film info,
    content added to searchResult */
    searchBtn.addEventListener(`click`, initialLoad)
    // Enter key fired on non-empty searchInput initiates click on searchBtn
    searchInput.addEventListener("keypress", event => {
        if (event.key === "Enter" && searchInput.value.replace(/\s+/g, ``) != ``) searchBtn.click()
        else if (event.key === "Enter" && searchInput.value.replace(/\s+/g, ``) === ``) searchResult.innerHTML = searchResultPlaceholder
    })
}

if(watchlist) {
    const storedFilmsCount = localStorage.getItem(`color-mode`) ? localStorage.length-1 : localStorage.length
    if(storedFilmsCount) {
        const length = localStorage.length
        // watchlist.style.setProperty(`padding-top`, `2.5rem`)
        let html = ``
        for (let index = 0;  index < length; index++) {
            if (localStorage.key(index) != `color-mode`) {
                html += localStorage.getItem(localStorage.key(index))
                if (index < length-1) html += `<hr>`
            }
        }
        watchlist.innerHTML = html
        document.querySelectorAll(`.card-watchlist`).forEach(currentValue => {
            currentValue.innerHTML = `Remove`
        })
        addFilmCardsEventListeners(`watchlist`)
    }
}

async function initialLoad() {
    currentInput = searchInput.value.trim().toLowerCase().replace(/\s+/g, '+')
    moreToBeLoaded = false
    filmsID = []
    // wrapping if statement to prevent redundant search operations if searchInput hasn't changed
    if(currentInput != prevInput) {
        const res = await fetch(`https://www.omdbapi.com/?apikey=9ebca557&page=1&s=${currentInput}`)
        const data = res.ok ? await res.json() : new Error('Something went wrong')
        const totalResults = parseInt(data.totalResults)
        currentPage = 1
        if(data.Response === `False` || totalResults === 0) searchResult.innerHTML = `<div class="no-results placeholder-txt contrast-boosted">Unable to find what you’re looking for. Please try another search.</div>`
        else {
            pagesNumber = Math.ceil(totalResults/data.Search.length)
            searchResult.innerHTML = `<div class="results-placeholder">${syncLoadAnimation}</div>`
            searchResult.innerHTML = await getFilmCardsHTML(data.Search)
            addFilmCardsEventListeners(`search`)
        }
        if (moreToBeLoaded) loadMore()
        prevInput = searchInput.value.trim().toLowerCase().replace(/\s+/g, '+')
    }
}

function loadMore() {
    loadMoreBtn = document.querySelector(`.load-more-btn`)
    loadMoreBtn.addEventListener(`click`, async () => {
        moreToBeLoaded = false
        loadMoreBtn.outerHTML = ``
        searchResult.innerHTML += syncLoadAnimation
        currentPage++
        const res = await fetch(`https://www.omdbapi.com/?apikey=9ebca557&page=${currentPage}&s=${searchInput.value.replace(/\s+/g, '+')}`)
        const data = await res.json()
        searchResult.innerHTML += `<hr>${await getFilmCardsHTML(data.Search)}`
        searchResult.removeChild(searchResult.querySelector(`.sync-load-animation`))
        addFilmCardsEventListeners(`search`)
        if (moreToBeLoaded) loadMore()
    })
}

async function getFilmCardsHTML(filmsArr) {
    let html = ``
    for (let index = 0; index < filmsArr.length; index++) {
        const film = filmsArr[index]
        const filmID = film.imdbID
        const res = await fetch(`https://www.omdbapi.com/?apikey=9ebca557&i=${filmID}`)
        const data = await res.json()
        filmsID.push(filmID)
        const posterAvailable = data.Poster != "N/A" ? true : false
        const plot = clipPlotText(data.Plot)
        html += `
            <div class="film-card" id="${filmID}">
                ${posterAvailable ? `<img class="card-cover" src=${data.Poster} alt="Film poster">` : cardFallbackCover}
                <h2 class="card-title">
                    ${data.Title} <span class="card-rating">${data.Ratings.length ? data.Ratings[0].Value.slice(0, data.Ratings[0].Value.indexOf("/")) : "N/A"}</span>
                </h2>
                <div class="card-group-info">
                    <p class="card-runtime">${data.Runtime}</p>
                    <p class="card-genre">${data.Genre}</p>
                    <button class="btn card-watchlist" add-state=${localStorage.getItem(filmID) ? "removable" : "addable"}>Watchlist</button>
                </div>
                <p class="card-plot">${plot}</p>
            </div>
        `
        
        if (currentPage < pagesNumber && index === filmsArr.length-1) {
            html += `<button class="btn load-more-btn">Load More</button>`
            moreToBeLoaded = true
        } else if (currentPage === pagesNumber && index === filmsArr.length-1) return html
        else html += `<hr>` 
    }
    return html
}

function addFilmCardsEventListeners(key) {
    // adding event listeners to read more/less plot remaining teext
    document.querySelectorAll(`.card-plot-read-more`).forEach(currentValue => { // syntax: callback(currentValue, currentIndex, listObj), thisArg
        const readLess = currentValue.parentNode.querySelector(`.card-plot-read-less`)
        const remainingText = currentValue.parentNode.querySelector(`.card-plot-remaining-text`)
        currentValue.addEventListener(`click`, () => {
            remainingText.style.setProperty(`display`, `unset`)
            readLess.style.setProperty(`display`, `unset`)
            currentValue.style.setProperty(`display`, `none`)
        })
        readLess.addEventListener(`click`, () => {
            remainingText.style.setProperty(`display`, `none`)
            currentValue.style.setProperty(`display`, `unset`)
            readLess.style.setProperty(`display`, `none`)
        })
    })

    // adding event listeners to add/remove to watchlist
    document.querySelectorAll(`.card-watchlist`).forEach((currentValue, currentIndex) => {
        currentValue.addEventListener(`click`, () => {
            const addState = currentValue.getAttribute(`add-state`)
            const filmCard = currentValue.parentNode.parentNode
            if (addState === `addable`) {
                currentValue.setAttribute(`add-state`, `removable`)
                localStorage.setItem(filmsID[currentIndex], filmCard.outerHTML.replace(/\\n\s+/g, ``))
            } else {
                currentValue.setAttribute(`add-state`, `addable`)
                if (key === `search`) localStorage.removeItem(filmsID[currentIndex])
                else {
                    const nextHr = filmCard.nextElementSibling
                    const prevHr = filmCard.previousElementSibling
                    let bringPlaceholder
                    // remove next hr element, if last card, then remove prev hr, if single card exists, no hrs exist, none removed
                    nextHr ? nextHr.remove() : prevHr ? prevHr.remove() : bringPlaceholder = true
                    localStorage.removeItem(filmCard.getAttribute(`id`))
                    filmCard.outerHTML = ``
                    if(bringPlaceholder) watchlist.innerHTML = watchlistPlaceholder
                }
            }
        })
    })
}

function clipPlotText(plot) {
    if (plot.length <= 130) return plot
    else return `${plot.slice(0, 130)}... 
                    <button class="btn card-plot-read-more">Read more</button>
                    <span class="card-plot-remaining-text">${plot.slice(131)} </span>
                    <button class="btn card-plot-read-less">Read less</button>
                `
}