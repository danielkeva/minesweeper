'use strict';
console.log('this is utils')


function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function getRandomIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function renderCell(location, value) {
    // Select the elCell and set the value
    var elCell = document.querySelector(`.cell${location.i}-${location.j}`);
    elCell.innerHTML = value;
}

function renderCell(i, j, value) {
    var cellSelector = '.' + getClassName(i, j)
    var elCell = document.querySelector(cellSelector);
    elCell.innerHTML = value;
}

function getClassName(i, j) {
    var cellClass = 'cell-' + i + '-' + j;
    return cellClass;
}

