const searchInput = document.querySelector(`.search-text`)
const searchResult = document.querySelector(`main.container`)
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
const maxResultsPerFetchedPage = 10                           
let pagesNumber, currentPage, filmCardsContent, currentInput, filmsID,
    prevInput, loadMoreBtn, moreToBeLoaded
    // , readMoreBtnsArr, addToWatchlistBtnsArr, readMoreCount

// Light-dark mode toggle switch
document.addEventListener(`DOMContentLoaded`, () => {
    document.documentElement.setAttribute(`color-mode`, `light`)
    // Add click event to ligh/dark-mode toggle switch, switch mode on click
    document.querySelector(`.color-mode-switch`).addEventListener(`click`, () => {
        const currentMode = document.documentElement.getAttribute(`color-mode`)
        document.documentElement.setAttribute(`color-mode`, currentMode === `dark` ? `light` : `dark`)
    })
})

if(searchInput) {
    /* searchBtn click triggers fetch request by keyword, 10 results per page are returned,
    each result prompts another fetch by id for film info,
    content added to searchResult */
    searchBtn.addEventListener(`click`, initialLoad)
    // Enter key fired on non-empty searchInput clicks searchBtn
    searchInput.addEventListener("keypress", event => {
        if (event.key === "Enter" && searchInput.value.replace(/\s/g, ``) != ``) searchBtn.click()
    })
}

async function initialLoad() {
    currentInput = searchInput.value.trim().toLowerCase().replace(/\s/g, '+')
    moreToBeLoaded = false
    // readMoreCount = 0
    // readMoreBtnsArr = []
    // addToWatchlistBtnsArr = []
    filmsID = []
    // wrapping if statement to prevent redundant search operations if searchInput hasn't changed
    if(currentInput != prevInput) {
        const res = await fetch(`https://www.omdbapi.com/?apikey=9ebca557&page=1&s=${currentInput}`)
        const data = res.ok ? await res.json() : new Error('Something went wrong')
        const totalResults = parseInt(data.totalResults)
        currentPage = 1
        if(data.Response === `False` || totalResults === 0) searchResult.innerHTML = `<div class="no-results">Unable to find what you’re looking for. Please try another search.</div>`
        else {
            pagesNumber = Math.ceil(totalResults/data.Search.length)
            searchResult.style.setProperty(`padding-top`, `0`)
            searchResult.innerHTML = `<div class="results-placeholder">${syncLoadAnimation}</div>`
            searchResult.innerHTML = await getFilmCardsHTML(data.Search)
            searchResult.style.setProperty(`padding-top`, `4rem`)
            addFilmCardsEventListeners()
        }
        if (moreToBeLoaded) loadMore()
        prevInput = searchInput.value.trim().toLowerCase().replace(/\s/g, '+')
    }
}

function loadMore() {
    loadMoreBtn = document.querySelector(`.load-more-btn`)
    loadMoreBtn.addEventListener(`click`, async () => {
        moreToBeLoaded = false
        loadMoreBtn.outerHTML = ``
        searchResult.innerHTML += syncLoadAnimation
        currentPage++
        const res = await fetch(`https://www.omdbapi.com/?apikey=9ebca557&page=${currentPage}&s=${searchInput.value.replace(/\s/g, '+')}`)
        const data = await res.json()
        searchResult.innerHTML += `<hr>${await getFilmCardsHTML(data.Search)}`
        searchResult.removeChild(searchResult.querySelector(`.sync-load-animation`))
        addFilmCardsEventListeners()
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
            <div class="film-card">
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

function addFilmCardsEventListeners() {
    // const prevReadMoreBtnsCount = readMoreBtnsArr.length
    // const prevAddToWatchlistBtnsCount = addToWatchlistBtnsArr.length
    // const newReadMoreBtnsCount = readMoreCount-prevReadMoreBtnsCount

    // concat new read more and new watchlist button elements in film card plots to arrays
    // readMoreBtnsArr = readMoreBtnsArr.concat(Array.from(document.querySelectorAll(`.card-plot-read-more`)).slice(-newReadMoreBtnsCount)) //negative index to offset from end of sequence, not the start
    // addToWatchlistBtnsArr = addToWatchlistBtnsArr.concat(Array.from(document.querySelectorAll(`.card-watchlist`)).slice((currentPage-1)*maxResultsPerFetchedPage))

    // adding event listeners to read more/read less
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

    // for (let index = prevReadMoreBtnsCount; index < readMoreBtnsArr.length; index++) {
    //     const readLess = readMoreBtnsArr[index].parentElement.querySelector(`.card-plot-read-less`)
    //     const remainingText = readMoreBtnsArr[index].parentElement.querySelector(`.card-plot-remaining-text`)
    //     readMoreBtnsArr[index].addEventListener(`click`, () => {
    //         remainingText.style.setProperty(`display`, `unset`)
    //         readLess.style.setProperty(`display`, `unset`)
    //         readMoreBtnsArr[index].style.setProperty(`display`, `none`)
    //     })
    //     readLess.addEventListener(`click`, () => {
    //         remainingText.style.setProperty(`display`, `none`)
    //         readMoreBtnsArr[index].style.setProperty(`display`, `unset`)
    //         readLess.style.setProperty(`display`, `none`)
    //     })
    // }

    // adding event listeners to add/remove to watchlist 
    document.querySelectorAll(`.card-watchlist`).forEach((currentValue, currentIndex) => {
        currentValue.addEventListener(`click`, () => {
            const addState = currentValue.getAttribute(`add-state`)
            const filmCard = currentValue.parentElement.parentElement
            if (addState === `addable`) {
                currentValue.setAttribute(`add-state`, `removable`)
                localStorage.setItem(filmsID[currentIndex], filmCard)
            } else {
                currentValue.setAttribute(`add-state`, `addable`)
                localStorage.removeItem(filmsID[currentIndex])
            }
        })
    })

    // for (let index = prevAddToWatchlistBtnsCount; index < addToWatchlistBtnsArr.length; index++) {
    //     addToWatchlistBtnsArr[index].addEventListener(`click`, () => {
    //         const addState = addToWatchlistBtnsArr[index].getAttribute(`add-state`)
    //         const filmCard = addToWatchlistBtnsArr[index].parentElement.parentElement
    //         if (addState === `addable`) {
    //             addToWatchlistBtnsArr[index].setAttribute(`add-state`, `removable`)
    //             localStorage.setItem(filmsID[index], filmCard)
    //         } else {
    //             addToWatchlistBtnsArr[index].setAttribute(`add-state`, `addable`)
    //             localStorage.removeItem(filmsID[index])
    //         }
    //     })
    // }
}

function clipPlotText(plot) {
    if (plot.length <= 130) return plot
    else {
        // readMoreCount++
        return `${plot.slice(0, 130)}... 
                    <button class="btn card-plot-read-more">Read more</button>
                    <span class="card-plot-remaining-text">${plot.slice(131)} </span>
                    <button class="btn card-plot-read-less">Read less</button>
                `
    }
}