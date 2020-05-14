const electron          = require('electron');
const {ipcRenderer}     = electron;
const Chart             = require('chart.js');

let plot1,
	plot2,
    plot3;

Chart.defaults.global.defaultFontColor = 'white';

let firstPlot = {
    type: 'line',
    options: {
        responsive: true,
        title: {
            display: true,
            text: 'Залежність ймовірності P(t) від номеру кроку t:'
        },
        legend: {
            display: false
         },
        tooltips: {
            mode: 'index',
            intersect: false,
        },
        hover: {
            mode: 'nearest',
            intersect: true
        },
        scales: {
            xAxes: [{
                display: true,
                ticks: {
                    beginAtZero: true
                },
                scaleLabel: {
                    display: true,
                    labelString: 't'
                }
            }],
            yAxes: [{
                display: true,
                ticks: {
                    beginAtZero: true
                },
                scaleLabel: {
                    display: true,
                    labelString: 'P(t)'
                }
            }]
        }
    }
}

let secondPlot = Object.assign({}, firstPlot);
secondPlot.options.scales.xAxes[0].scaleLabel.labelString = 'delta';
secondPlot.options.scales.yAxes[0].scaleLabel.labelString = 'P(t)';
let thirdPlot = Object.assign({}, firstPlot);
thirdPlot.options.scales.xAxes[0].scaleLabel.labelString = 't';
thirdPlot.options.scales.yAxes[0].scaleLabel.labelString = 'P(t)';


window.onload = function() {
    let ctx1    = document.getElementById('chart1').getContext('2d')
        , ctx2  = document.getElementById('chart2').getContext('2d')
        , ctx3  = document.getElementById('chart3').getContext('2d');
    plot1       = new Chart(ctx1, firstPlot);
    plot2       = new Chart(ctx2, secondPlot);
    plot3       = new Chart(ctx3, thirdPlot);
	// renderCharts();
};


ipcRenderer.on('config:change', function(e, config) {
    renderCharts(config);
});

ipcRenderer.on('config:default:change', function(e, config) {
    renderCharts(config);
});


function renderCharts(config) {
    let min             = config.min
	let max             = config.max
	let concessionStep  = config.concessionStep
	let concessionMin   = config.concessionMin
	let concessionMax   = config.concessionMax
	let length          = config.length
    let trialsAmount    = config.trialsAmount

    try {
		let data = allPossibleConcessions(concessionStep, min, max, concessionMin, concessionMax, length, trialsAmount);
        console.table(data);
        console.log(randomNum(1,2));

        let colors = ['#ffbcd9', '#557ce7', '#fff68f', '#ff7400', '#bb0a1e', '#8b1c62', '#9373ff', '#7ed957', '#f0e3c5', '#00847d', '#e8b700', '#cebdad', '#a2b2c1', '#b07f00', '#2c1931']
        let i = 0;

		let datasets = data.all.map(d => {
            if (i >= colors.length) i = 0;
            let color = colors[i];
            i++;
            return {
				label: `поступка ${(d.concession * 100).toFixed(0)}%`,
				data: d.probabilities,
				backgroundColor: color,
				borderColor: color,
				fill: false
			};
		})

		firstPlot.data.datasets = datasets;
        firstPlot.data.labels = Array(length).fill(0).map((_, index) => index);

        secondPlot.options.title = {display: true, text: 'Залежність ймовірності P від величини поступки:'};
        console.log(secondPlot.options.title);
		secondPlot.data.datasets =  [{
				label: 'Залежність ймовірності P від величини поступки',
				data: data.best.map(d => d.probability),
				backgroundColor: 'rgb(255, 99, 2)',
				borderColor: 'rgb(255, 99, 2)',
				fill: true
			}];
		secondPlot.data.labels = data.best.map(d => (d.concession * 100).toFixed(2) + '%');

        thirdPlot.options.title = {display: true, text: 'Залежність номеру зупинки t від величини поступки:'};
		thirdPlot.data.datasets =  [{
				label: 'Залежність номеру зупинки t від величини поступки',
				data: data.best.map(d => d.stop),
				backgroundColor: 'rgb(970,0,70)',
				borderColor: 'rgb(970,0,70)',
				fill: true
			}];

		thirdPlot.data.labels = data.best.map(d => (d.concession * 100).toFixed(2) + '%');

		plot1.update();
		plot2.update();
		plot3.update();
	} catch(err) {
		console.error(err);
	}
}

function allPossibleConcessions(step, min, max, concessionMin, concessionMax, length, N) {
	let all = [];

	for(let concession = concessionMin; concession <= concessionMax; concession += step) {
		all.push({
			concession: concession,
			probabilities: trials(min, max, length, concession, N)
		});
	}

	return {
		all: all,
		best: all.map(trial => {
			let maxProbability = Math.max.apply(null, trial.probabilities);
			return {
				stop: trial.probabilities.indexOf(maxProbability),
				probability: maxProbability,
				concession: trial.concession
			};
		})
	};
}

function trials(min, max, length, concession, N) {
	let successesT = Array(length);
	successesT.fill(0);


	for(let j = 0; j < N; j++) {
		let range = genRandomRange(min, max, length);
		for(let i = 0; i < length; i++) {
			successesT[i] += tryFindBest(range, concession, i);
		}
	}
	return successesT.map(p => p / N );
}

function tryFindBest(range, concession, t) {
	let aLeader = absoluteLeader(range),
		lLeader = localLeader(range, t),
		dx = aLeader * concession;

	let next = range.slice(t + 1, range.length).filter(x => x >= lLeader)[0];
	if (next === undefined) return 0;
	return (aLeader - next) <= dx;
}

function randomNum(min, max) {
	return (Math.random() * (max - min)) + min;
}

function genRandomRange(min, max, length, precition) {
	let range = [];

	for(let i = 0; i < length; i++) {
		range.push(randomNum(min, max));
	}

	return range;
}

function absoluteLeader(range) {
	return Math.max.apply(null, range);
}

function localLeader(range, t) {
	return Math.max.apply(null, range.slice(0, t + 1));
}
