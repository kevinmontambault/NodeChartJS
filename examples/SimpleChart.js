const Chart = require('../index.js');

// chartjs config
const config = {
    type: 'bar',
    data: {
        labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
        datasets: [{
            label: '# of Votes',
            data: [12, 19, 3, 5, 2, 3],
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
};

// chart window options
const options = {
    height: 500,
    width: 500,
    bgColor: '#FFFFFF'
};

// create the chart
const chart = new Chart(config, options);

// open chart window
chart.show();

// listen for resize events
chart.on('resize', () =>{
    console.log(`Chart resized to ${chart.width}x${chart.height}`);
});

// update the chart height and background color after 3 seconds
setTimeout(() => {
    chart.bgColor = '#FFFF00';
    chart.height = 300;
}, 3000);

// add a new bar to the chart after 5 seconds
setTimeout(() => {
    chart.config.data.labels.push('Brown');
    chart.config.data.datasets[0].data.push(6);
    chart.update();
}, 5000);

// close plot 10 seconds
setTimeout(() => {
    chart.hide();
}, 10000);