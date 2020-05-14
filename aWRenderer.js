const electron      = require('electron');
const {ipcRenderer} = electron;


const button        = document.getElementById('send-config-btn');

function setConfig(config) {
    document.getElementById('min').value            = config.min.toFixed(0);
    document.getElementById('max').value            = config.max.toFixed(0);
    document.getElementById('concessionStep').value = config.concessionStep.toFixed(0);
    document.getElementById('concessionMax').value  = config.concessionMax.toFixed(0);
    document.getElementById('concessionMin').value  = config.concessionMin.toFixed(0);
    document.getElementById('trialsAmount').value   = config.trialsAmount.toFixed(0);
    document.getElementById('length').value         = config.length.toFixed(0);
}


button.addEventListener('click', function() {
    config                = {};
    config.min            = parseFloat(document.getElementById('min').value);
	config.max            = parseFloat(document.getElementById('max').value);
	config.concessionStep = parseFloat(document.getElementById('concessionStep').value) / 100;
	config.concessionMin  = parseFloat(document.getElementById('concessionMin').value) / 100;
	config.concessionMax  = parseFloat(document.getElementById('concessionMax').value) / 100;
	config.length         = parseFloat(document.getElementById('length').value);
    config.trialsAmount   = parseFloat(document.getElementById('trialsAmount').value);

    ipcRenderer.send('config:change', config);
});


ipcRenderer.on('config:default:change', function(e, config) {
    setConfig(config);
});
