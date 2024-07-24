document.addEventListener("DOMContentLoaded", () => {
    updateTable();
    document.querySelector('.alert').style.display = 'none';
    
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        
        const table = document.getElementById('distributionTable');
        const formElements = Array.from(table.querySelectorAll('input'));
        const currentIndex = formElements.indexOf(document.activeElement);
        
        if (formElements.length > 0) {
            const nextIndex = (currentIndex + 1) % formElements.length;
            formElements[nextIndex].focus();
            
            // Jika fokus sudah pada input terakhir dan itu adalah baris terakhir
            if (nextIndex === 0 && currentIndex === formElements.length - 1) {
                addRow(); // Panggil addRow jika fokus sudah pada input terakhir
            } else {
                formElements[nextIndex].focus(); // Fokus ke input berikutnya
            }
        }
    }
});
let sumF = 0;
let sumFiCi = 0;
let avgFirstValue = 0;
let mean = 0;

function formatNumber(value, decimalPlaces) {
    if (isNaN(value) || value === null) {
        return '';
    }

    const formatted = value.toFixed(decimalPlaces);
    return formatted.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}

function addRow() {
    const table = document.getElementById("distributionTable").getElementsByTagName('tbody')[0];
    const rowCount = table.rows.length;
    const row = table.insertRow(rowCount);

    for (let i = 0; i < 11; i++) {
        let cell = row.insertCell(i);
        if (i === 2) {
            let input = document.createElement("input");
            input.type = "number";
            input.min = "0";
            input.className = "form-control form-control-sm";
            input.placeholder = i === 0 ? "Top Value" : (i === 1 ? "Bottom Value" : "input");
            cell.appendChild(input);
            setTimeout(() => {
                        input.focus();
                    }, 0);
        } else {
            cell.className = getCellClass(i);
        }
        
    }
    updateTable();
}

function resetTable() {
    // Menampilkan pesan konfirmasi
    if (confirm("Apakah Anda yakin ingin mengatur ulang tabel? Semua data akan hilang.")) {
        const table = document.getElementById("distributionTable").getElementsByTagName('tbody')[0];
        
        while (table.rows.length > 1) {
            table.deleteRow(table.rows.length - 1);
        }
        
        const remainingRow = table.rows[0];
        const inputs = remainingRow.getElementsByTagName('input');
        
        for (const input of inputs) {
            input.value = '';
        }
        
        updateTable(); 
    }
}



function removeRow() {
    const table = document.getElementById("distributionTable").getElementsByTagName('tbody')[0];
    const rowCount = table.rows.length;
    if (rowCount > 1) {
        table.deleteRow(rowCount - 1);
        updateTable();
    }
}

function getCellClass(index) {
    const classes = [
        "topvalue",
        "bottomvalue",
        "cumulative",
        "ci",
        "fici",
        "avg-value",
        "abs-ximinx",
        "fiximinx",
        "powximinx",
        "powfiximinx"
    ];
    return classes[index - 1];
}

function updateTable() {
    const table = document.getElementById("distributionTable").getElementsByTagName('tbody')[0];
    const summaryTable = document.getElementById("summaryTable").getElementsByTagName('tbody')[0];
    const moctTable = document.getElementById("measureOfCentralTendency").getElementsByTagName('tbody')[0];
    const rowCount = table.rows.length;
    const tfoot = document.getElementById("distributionTable").getElementsByTagName('tfoot')[0].rows[0];
    const decimalPlaces = parseInt(document.getElementById('decimalPlaces').value) || 2;
    const alertElement = document.querySelector('.alert');
    let cumulative = 0;
    sumF = 0;
    sumFiCi = 0;
    let avgValues = [];
    let bottomValues = [];
    let topValues = [];
    let frequencies = [];
    let freqHelpers = [0];
    let lowerBounds = [];
    let upperBounds = [];
    let quartilClassPositions = [];
    let decilClassPositions = [];
    let percentilClassPositions = [];
    let quartilValues = [];
    let decilValues = [];
    let percentilValues = [];
    
    let range;


    const getIndexQuartil = parseInt(moctTable.rows[0].cells[1].children[0].value) || "...";
    const getIndexDecil = parseInt(moctTable.rows[1].cells[1].children[0].value) || "...";
    const getIndexPercentil = parseInt(moctTable.rows[2].cells[1].children[0].value) || "...";
    document.getElementById("inputFreq").addEventListener("input", function(){
        if(this.value <0){
            this.value = 0;
        }
    });

    for (let i = 0; i < rowCount; i++) {
        const row = table.rows[i];
        
        const frequency = parseFloat(row.cells[2].children[0].value) || 0;
        frequencies.push(frequency);
        if (i === 0) {
            const bottomValue = parseFloat(row.cells[0].children[0].value) || 0;
            const topValue = parseFloat(row.cells[1].children[0].value) || 0;
            bottomValues.push(bottomValue);
            topValues.push(topValue);
            range = topValues[i] - bottomValues[i] + 1;
            cumulative += frequency;
            sumF += frequency;
            freqHelpers.push(sumF);
            const ci = i;
            const fici = frequency * ci;
            sumFiCi += fici;
            const avgValue = (bottomValue + topValue) / 2;
            avgValues.push(avgValue);
            avgFirstValue = avgValue;
            row.cells[3].innerText = cumulative;
            row.cells[4].innerText = ci;
            row.cells[5].innerText = fici;
            row.cells[6].innerText = formatNumber(avgValue, decimalPlaces);

        } else {
            const bottomValue = bottomValues[i - 1] + range;
            const topValue = topValues[i - 1] + range;
            bottomValues.push(bottomValue);
            topValues.push(topValue);
            cumulative += frequency;
            sumF += frequency;
            const ci = i;
            const fici = frequency * ci;
            sumFiCi += fici;
            freqHelpers.push(sumF);
            const avgValue = (bottomValue + topValue) / 2;
            avgValues.push(avgValue);
            row.cells[0].innerText = bottomValue;
            row.cells[1].innerText = topValue;
            row.cells[3].innerText = cumulative;
            row.cells[4].innerText = ci;
            row.cells[5].innerText = fici;
            row.cells[6].innerText = formatNumber(avgValue, decimalPlaces);
        }

    }


    mean = avgFirstValue + (sumFiCi / sumF * range);
    let sumFiximinx = 0;
    let sumPowFiximinx = 0;

    for (let i = 0; i < rowCount; i++) {
        lowerBounds.push(bottomValues[i]- 0.5);
        upperBounds.push(topValues[i]- 0.5);
        const row = table.rows[i];
        const frequency = parseFloat(row.cells[2].children[0].value) || 0;
        const avgValue = avgValues[i];

        const absXiminx = Math.abs(avgValue - mean);
        const fiximinx = frequency * absXiminx;
        const powximinx = Math.pow(absXiminx, 2);
        const powfiximinx = frequency * powximinx;

        sumFiximinx += fiximinx;
        sumPowFiximinx += powfiximinx;

        row.cells[7].innerText = formatNumber(absXiminx, decimalPlaces);
        row.cells[8].innerText = formatNumber(fiximinx, decimalPlaces);
        row.cells[9].innerText = formatNumber(powximinx, decimalPlaces);
        row.cells[10].innerText = formatNumber(powfiximinx, decimalPlaces);
    }

    for(let i = 0; i < 3; i++) {
        quartilClassPositions.push((i + 1) * sumF / 4);
        for(let j = rowCount + 1; j >= 0;j--) {
                if ( freqHelpers[j]< quartilClassPositions[i]) {
                   quartilValues.push( lowerBounds[j] + ((quartilClassPositions[i] - freqHelpers[j]) / frequencies[j]) * range);
                   break;
            }
        }
    }
    for(let i = 0; i < 9; i++) {
        decilClassPositions.push((i + 1) * sumF / 10);
        for(let j = rowCount + 1; j >= 0;j--) {
                if ( freqHelpers[j]< decilClassPositions[i]) {
                   decilValues.push( lowerBounds[j] + ((decilClassPositions[i] - freqHelpers[j]) / frequencies[j]) * range);
                   break;
            }
        }
    }
    for(let i = 0; i < 99; i++) {
        percentilClassPositions.push((i + 1) * sumF / 100);
        for(let j = rowCount + 1; j >= 0;j--) {
                if ( freqHelpers[j]< percentilClassPositions[i]) {
                   percentilValues.push( lowerBounds[j] + ((percentilClassPositions[i] - freqHelpers[j]) / frequencies[j]) * range);
                   break;
            }
        }
    }
    moctTable.rows[0].cells[2].innerText = formatNumber(quartilValues[getIndexQuartil - 1], decimalPlaces);
    moctTable.rows[1].cells[2].innerText = formatNumber(decilValues[getIndexDecil - 1], decimalPlaces);
    moctTable.rows[2].cells[2].innerText = formatNumber(percentilValues[getIndexPercentil - 1], decimalPlaces);


    const meanDeviation = sumFiximinx / sumF;
    const variance = sumPowFiximinx / sumF;
    const stdDeviation = Math.sqrt(variance);
    tfoot.cells[1].innerText = sumF;
    tfoot.cells[4].innerText = sumFiCi;
    tfoot.cells[7].innerText = formatNumber(sumFiximinx, decimalPlaces);
    tfoot.cells[9].innerText = formatNumber(sumPowFiximinx, decimalPlaces);

    summaryTable.rows[0].cells[2].innerText = formatNumber(mean, decimalPlaces);
    summaryTable.rows[1].cells[2].innerText = formatNumber(meanDeviation, decimalPlaces);
    summaryTable.rows[2].cells[2].innerText = formatNumber(variance, decimalPlaces);
    summaryTable.rows[3].cells[2].innerText = formatNumber(stdDeviation, decimalPlaces);

}

document.getElementById("distributionTable").addEventListener("input", updateTable);
document.getElementById("getIndexQuartile").addEventListener("input", function(){
    if(this.value > 3){
        this.value = 3;
    } else if(this.value < 0){
        this.value = 0;
    }
});
document.getElementById("getIndexDecile").addEventListener("input", function(){
    if(this.value > 9){
        this.value = 9;
    } else if(this.value < 0){
        this.value = 0;
    }
});
document.getElementById("getIndexPercentile").addEventListener("input", function(){
    if(this.value > 99){
        this.value = 99;
    } else if(this.value < 0){
        this.value = 0;
    }
});

document.getElementById("measureOfCentralTendency").addEventListener("input", updateTable);
document.getElementById("decimalPlaces").addEventListener("input", updateTable);