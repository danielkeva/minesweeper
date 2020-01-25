'use strict';
var MINE = '💣';
var MARK = '🚩';
var EMPTY = '';
var WIN = '😎'
var LOSS = '😵'
var NORMAL = '😄'

var timeInterval;
var manualMinesCounter;
var isManuallMode;


var isHinted;
var isFirstClick;

var gLevel = {
    SIZE: 8,
    MINES: 12
};
var gGame;
var gBoard;

var gBestScore = {
    beginner: localStorage.getItem('beginnerHighScore'),
    medium: localStorage.getItem('mediumHighScore'),
    expert: localStorage.getItem('expertHighScore')
}

function init() {
    manualMinesCounter = 0;

    displayHighScore(gLevel.SIZE)
    var elButtonPlay = document.querySelector('.smiley')
    elButtonPlay.innerText = NORMAL

    var elPlaceMinesButton = document.querySelector('.place-mines')
    elPlaceMinesButton.hidden = false;

    var elMinesCounter = document.querySelector('.mines-left')
    elMinesCounter.hidden = true;
    renderHintButton()
    renderSafeClick()
    isFirstClick = true;
    isManuallMode = false;
    isHinted = false;

    gGame = {
        isOn: false,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0,
        livesCount: 3,
        safeClickCount: 3
    }
    resetStopwatch()

    renderLives(gGame.livesCount)
    gBoard = buildBoard()
    renderBoard(gBoard)
}

function changeLevel(size, mines) {
    gLevel = {
        SIZE: size,
        MINES: mines
    }
    displayHighScore(size)
    init()
}

function buildBoard() {
    var board = [];
    for (var i = 0; i < gLevel.SIZE; i++) {
        board[i] = []
        for (var j = 0; j < gLevel.SIZE; j++) {
            var cell = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
            board[i][j] = cell
        }
    }
    return board
}

function renderBoard(board) {
    var strHTML = ''
    for (var i = 0; i < board.length; i++) {
        strHTML += `<tr>`
        for (var j = 0; j < board[0].length; j++) {
            var className = `cell-${i}-${j}`
            strHTML += `<td class="${className}" onclick="cellClicked(event,this, ${i}, ${j})"
            oncontextmenu="cellClicked(event,this, ${i}, ${j})"></td>`
        }
        strHTML += `</tr>`
    }
    var elBoard = document.querySelector('.board');
    elBoard.innerHTML = strHTML;
}

//randomly place mines on the board
function placeMines(row, col) {
    if (manualMinesCounter === gLevel.MINES) return; // if the user already placed mines do nothing
    var elPlaceMines = document.querySelector('.place-mines')
    elPlaceMines.hidden = true;
    for (var i = 0; i < gLevel.MINES; i++) {
        var randI = getRandomIntInclusive(0, gLevel.SIZE - 1)
        var randJ = getRandomIntInclusive(0, gLevel.SIZE - 1)
        if (row === randI && col === randJ || gBoard[randI][randJ].isMine) {
            i--
            continue
        }
        gBoard[randI][randJ].isMine = true
    }
}

function manuallyPlaceMines(i, j) {
    var elMinesCounter = document.querySelector('.mines-left')
    elMinesCounter.hidden = false;
    if (!gBoard[i][j].isMine) {
        gBoard[i][j].isMine = true;
        manualMinesCounter++
    }
    elMinesCounter.innerText = `Mine left to place: ${gLevel.MINES - manualMinesCounter}`
    if (manualMinesCounter >= gLevel.MINES) {
        elMinesCounter.hidden = true;
        isManuallMode = false;
    }

}

//count mines around selected cell
function countMines(rowIdx, colIdx) {
    var minesCount = 0
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= gBoard[0].length) continue;
            if (i === rowIdx && j === colIdx) continue;
            if (gBoard[i][j].isMine) minesCount++;
        }
    }
    return minesCount
}

// update the mines count on the cell's object
function setMinesNegsCount() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            var minesCount = countMines(i, j)
            if (!gBoard[i][j].isMine) {
                gBoard[i][j].minesAroundCount = minesCount
            }
        }
    }

}


function cellClicked(event, elCell, i, j) {
    var cell = gBoard[i][j]

    if (event.type === 'click') { // left click

        if (isFirstClick) {
            if (isManuallMode) { // if manual mode is true let the user place mines
                manuallyPlaceMines(i, j)
                return;
            }
            placeMines(i, j)    //also send the clicked cell's pos
            setMinesNegsCount()
            isFirstClick = false
            gGame.isOn = true
            timeInterval = setInterval(setTime, 1000);
        }
        if (!gGame.isOn) return;
        if (isHinted) {
            useHint(i, j) // if hint clicked
            setTimeout(cleanHintMark, 1000) // clears the hint after a second
            isHinted = false
            return
        }

        checkGameOver(i, j)

        if (!gGame.isOn) return;
        if (cell.isShown) return;
        if (!cell.isMine && !cell.isMarked) {    // If the clicked cell isnt a mine or marked open the cell and negs
            expandShown(elCell, i, j)
            checkGameOver(i, j)
        }
    }
    if (event.type === 'contextmenu') { // right click
        cellMarked(elCell, i, j)
    }
}

// right click - flag a cell
function cellMarked(elCell, i, j) {
    var cell = gBoard[i][j]
    if (!gGame.isOn) return;
    if (cell.isShown) return;
    if (!cell.isMarked) {
        cell.isMarked = true
        elCell.innerText = MARK
        gGame.markedCount++
        checkGameOver(i, j)
    } else {
        cell.isMarked = false
        elCell.innerText = EMPTY
        gGame.markedCount--
    }
}


function expandShown(elCell, rowIdx, colIdx) {
    var cell = gBoard[rowIdx][colIdx]

    if (!cell.isMine && cell.minesAroundCount > 0) {
        elCell.classList.add('mark');
        elCell.innerText = cell.minesAroundCount
        if (!cell.isShown) {
            gGame.shownCount++
            cell.isShown = true;
        }
        return;
    }

    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= gBoard[0].length) continue;
            if (gBoard[i][j].isShown) continue;
            if (gBoard[i][j].isMarked) continue;
            var elCell = document.querySelector(`.cell-${i}-${j}`);
            elCell.classList.add('mark')
            gGame.shownCount++
            gBoard[i][j].isShown = true;
            if (gBoard[i][j].minesAroundCount > 0) {
                elCell.innerText = gBoard[i][j].minesAroundCount
            }
            expandShown(elCell, i, j)
        }
    }
}

function checkGameOver(i, j) {
    var mineCells = getMineCells()
    var elButton = document.querySelector('.smiley') // play again button

    if (gBoard[i][j].isMine && !gBoard[i][j].isMarked) {
        if (gGame.livesCount > 0) {
            gGame.livesCount--
            renderLives(gGame.livesCount) //decreas the live counter
            renderCell(i, j, MINE)
        } else {
            for (var i = 0; i < mineCells.length; i++) {
                renderCell(mineCells[i].i, mineCells[i].j, MINE) // render all mines when game lost
            }
            elButton.innerText = LOSS
            gGame.isOn = false;
            clearInterval(timeInterval)
        }
    }
    if ((gLevel.SIZE ** 2) - gGame.markedCount === gGame.shownCount) {
        elButton.innerText = WIN
        gGame.isOn = false;
        clearInterval(timeInterval)

        keepHighScore()
    }

}

// get all the locations of the mines in the board
function getMineCells() {
    var mineCells = [];
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            if (gBoard[i][j].isMine) {
                mineCells.push({ i: i, j: j });
            }
        }
    }
    return mineCells;
}

function renderHintButton() {
    var elHintsContainer = document.querySelector('.hints')
    var strHTML = ''
    for (var i = 0; i < 3; i++) {
        strHTML += `<button onclick="hintClicked(this)">💡</button>`
    }
    elHintsContainer.innerHTML = strHTML
}


function hintClicked(elButton) {
    if (!gGame.isOn) return;
    isHinted = true;
    elButton.hidden = true;
}

function placeMinesClicked(elButton) {
    isManuallMode = true;
    elButton.hidden = true;
}

// reveal the chosen cell's neighboors when hint is used
function useHint(rowIdx, colIdx) {
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= gBoard[0].length) continue;
            if (gBoard[i][j].isShown) continue;
            if (gBoard[i][j].isMarked) continue;
            var elCell = document.querySelector(`.cell-${i}-${j}`);
            elCell.classList.add('hint-mark')
            if (gBoard[i][j].minesAroundCount > 0) {
                elCell.innerText = gBoard[i][j].minesAroundCount
            }
            if (gBoard[i][j].isMine) {
                elCell.innerText = MINE
            }
        }
    }
}

// unshow the revealed cells to the user
function cleanHintMark() {
    var elTds = document.querySelectorAll('.hint-mark');
    for (var i = 0; i < elTds.length; i++) {
        elTds[i].classList.remove('hint-mark');
        elTds[i].innerText = EMPTY
    }
}


function renderLives(length) {
    var elLivesConttainer = document.querySelector('.lives-container')
    var strHTML = ''
    for (var i = 0; i < length; i++) {
        strHTML += `<span>❤️</span>`
    }
    elLivesConttainer.innerHTML = strHTML;
}

function renderSafeClick() {
    var elSafeConttainer = document.querySelector('.safe-click-container')
    elSafeConttainer.innerHTML = `<button class="safe-click" onclick="safeClick(this)">
    Safe Click 3 clicks available</button>`
}

function safeClick(elButton) {
    if (!gGame.isOn) return;
    var safeCells = getSafeCells();
    if (safeCells.length <= 0) {
        elButton.innerText = 'There are no more safe cells!' // if all non mine cells are revealed
        return;
    }
    if (gGame.safeClickCount <= 0) return
    var rndIdx = getRandomIntInclusive(0, safeCells.length - 1);
    var safeCell = safeCells.splice(rndIdx, 1)[0];
    var elCell = document.querySelector(`.cell-${safeCell.i}-${safeCell.j}`);
    elCell.classList.add('safe-cell')
    setTimeout(function () { elCell.classList.remove('safe-cell') }
        , 1000);
    gGame.safeClickCount--
    elButton.innerText = `Safe Click ${gGame.safeClickCount} clicks available`
}

function getSafeCells() {
    var safeCells = [];
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            if (!gBoard[i][j].isMine && !gBoard[i][j].isShown) {
                safeCells.push({ i: i, j: j });
            }
        }
    }
    return safeCells;
}

function keepHighScore() {
    if (gLevel.SIZE === 4) {
        if (gBestScore.beginner > gGame.secsPassed || !gBestScore.beginner) {
            gBestScore.beginner = gGame.secsPassed
        }
        localStorage.setItem('beginnerHighScore', gBestScore.beginner);
        gBestScore.beginner = localStorage.getItem('beginnerHighScore');
        displayHighScore(4)
    }
    if (gLevel.SIZE === 8) {
        if (gBestScore.medium > gGame.secsPassed || !gBestScore.medium) {
            gBestScore.medium = gGame.secsPassed
        }
        localStorage.setItem('mediumHighScore', gBestScore.medium);
        gBestScore.medium = localStorage.getItem('mediumHighScore');
        displayHighScore(8)
    }
    if (gLevel.SIZE === 12) {
        if (gBestScore.expert > gGame.secsPassed || !gBestScore.expert) {
            gBestScore.expert = gGame.secsPassed
        }
        localStorage.setItem('expertHighScore', gBestScore.expert);
        gBestScore.expert = localStorage.getItem('expertHighScore');
        displayHighScore(12)
    }

}

//Renders the high score for each level
function displayHighScore(level) { // get the level number from changeLevel() and keepHighScore()
    var elHighScore = document.querySelector('.high-score')
    if (level === 4) {
        if (!gBestScore.beginner) {// if the current level has no record
            elHighScore.innerText = 'You haven\'t set a record yet'
            return;
        }
        elHighScore.innerText = `Youre best score is: ${gBestScore.beginner} seconds`;
    }
    if (level === 8) {
        if (!gBestScore.medium) {
            elHighScore.innerText = 'You haven\'t set a record yet'
            return;
        }
        elHighScore.innerText = `Youre best score is: ${gBestScore.medium} seconds`;
    }
    if (level === 12) {
        if (!gBestScore.expert) {
            elHighScore.innerText = 'You haven\'t set a record yet'
            return;
        }
        elHighScore.innerText = `Youre best score is: ${gBestScore.expert} seconds`;

    }
}

function setTime() {
    var elSeconds = document.querySelector('.seconds')
    var elMinutes = document.querySelector('.minutes')
    gGame.secsPassed++
    elSeconds.innerHTML = pad(gGame.secsPassed % 60);
    elMinutes.innerHTML = pad(Math.floor(gGame.secsPassed / 60));
}


function pad(val) {
    var valString = val + "";
    if (valString.length < 2) {
        return "0" + valString;
    } else {
        return valString;
    }
}

function resetStopwatch() {
    var elSeconds = document.querySelector('.seconds')
    var elMinutes = document.querySelector('.minutes')
    elSeconds.innerHTML = '00';
    elMinutes.innerHTML = '00';
    gGame.secsPassed = 0;
}


function toggleDarkMode(elButton) {
    var elBody = document.querySelector('body')
    elBody.classList.toggle('dark-mode')
    if (elButton.innerText === 'Dark Mode') {
        elButton.innerText = 'Light Mode';
    } else {
        elButton.innerText = 'Dark Mode'
    }
   
}