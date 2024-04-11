function formatDate(date) {
  const options = { month: 'short' }
  const dateObj = new Date(date)
  return `${dateObj.getDate()} ${dateObj.toLocaleString('es-ES', options)}`
}

let maxYValue = 0.6

function graphic(crop_indices_url) {
  // fetch ('data or endpoint petition')
  fetch(crop_indices_url)
    .then((response) => response.json())
    .then((jsonData) => {
      const jsonDates = Object.values(jsonData.data.Dates)
      const acronyms = Object.values(jsonData.acronyms)
      console.log(acronyms)
      console.log(jsonDates)

      const labels = jsonDates.map(formatDate)
      console.log(labels)
      const colors = [
        '#F8FC21',
        '#8DDB95',
        '#19B5EE',
        '#777777',
        '#E4684E',
        '#E6B333',
        '#3366E6',
        '#999966',
        '#99FF99',
        '#B34D4D',
      ]

      const datasets = acronyms.map((label, index) => ({
        label,
        data: jsonData.data[Object.keys(jsonData.data)[index + 1]],
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length],
        borderWidth: 3,
        tension:
          label === 'Humedad del Suelo' || label === 'Área afectada' ? 0 : 0.2,
        pointHitRadius: 10,
        spanGaps: true,
        fill: false,
        pointRadius: (context) => {
          return 0
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              return `${label}: ${context.parsed.y.toFixed(2)}`
            },
          },
        },
      }))
      console.log(datasets)

      const datasetValues = acronyms.flatMap(
        (_, index) => jsonData.data[Object.keys(jsonData.data)[index + 1]]
      )
      maxYValue = Math.max(...datasetValues, maxYValue)

      const nextHighestValue = Math.ceil(maxYValue / 0.1) * 0.1
      maxYValue = nextHighestValue > 0.6 ? nextHighestValue : maxYValue

      const gridColor = '#0070F3'
      const textColor = '#FFFFFF'

      const config = {
        type: 'line',
        data: {
          labels,
          datasets,
        },
        options: {
          maintainAspectRatio: false,
          responsive: true,
          animation: true,
          transitions: {
            show: {
              animations: {
                x: {
                  from: 0,
                },
                y: {
                  from: 0,
                },
              },
            },
            hide: {
              animations: {
                x: {
                  to: 0,
                },
                y: {
                  to: 0,
                },
              },
            },
          },
          events: ['mouseout', 'click', 'touchstart', 'touchmove'],
          interaction: {
            mode: 'index',
            intersect: false,
          },
          scales: {
            y: {
              type: 'linear',
              min: 0,
              max: maxYValue,
              position: 'left',
              stack: 'y',
              ticks: {
                stepSize: 0.1,
                color: textColor,
                beginAtZero: true,
              },
              grid: {
                color: gridColor,
              },
            },
            x: {
              stacked: true,
              offset: false,
              ticks: {
                color: textColor,
                beginAtZero: true,
              },
              grid: {
                display: true,
                color: gridColor,
                offset: false,
                drawOnChartArea: true,
                drawTicks: true,
              },
            },
          },
          plugins: {
            tooltip: {
              enabled: true,
            },
            htmlLegend: {
              containerID: 'legend-container',
            },
            legend: {
              display: false,
              position: 'top',
              align: 'center',
              labels: {
                color: textColor,
                padding: 10,
                boxHeight: 14,
                font: {
                  size: 14,
                },
              },
            },
          },
        },
        plugins: [htmlLegendPlugin],
      }
      const ctx = document.getElementById('chart').getContext('2d')
      new Chart(ctx, config)
    })
}

// design to HTML Legend
const getOrCreateLegendList = (chart, id) => {
  const legendContainer = document.getElementById(id)
  let listContainer = legendContainer.querySelector('ul')

  if (!listContainer) {
    listContainer = document.createElement('ul')
    if (window.matchMedia('(max-width: 480px)').matches) {
      listContainer.classList.add('chartLegend')
      listContainer.style.display = 'grid'
      listContainer.style.gridTemplateColumns = '170px 140px'
      listContainer.style.gridTemplateRows = '12px 12px 12px'
      listContainer.style.flexDirection = 'row'
      listContainer.style.margin = 0
      listContainer.style.padding = 0
      listContainer.style.alignItems = 'center'
      listContainer.style.justifyContent = 'space-between'
    } else {
      listContainer.style.display = 'flex'
      listContainer.style.flexDirection = 'row'
      listContainer.style.margin = 0
      listContainer.style.padding = 0
    }
    legendContainer.appendChild(listContainer)
  }

  return listContainer
}

const htmlLegendPlugin = {
  id: 'htmlLegend',
  afterUpdate(chart, args, options) {
    const ul = getOrCreateLegendList(chart, options.containerID)

    // Remove old legend items
    while (ul.firstChild) {
      ul.firstChild.remove()
    }

    // Reuse the built-in legendItems generator
    const items = chart.options.plugins.legend.labels.generateLabels(chart)

    items.forEach((item) => {
      const li = document.createElement('li')
      if (window.matchMedia('(max-width: 480px)').matches) {
        li.style.alignItems = 'center'
        li.style.cursor = 'pointer'
        li.style.display = 'flex'
        li.style.flexDirection = 'row'
        li.style.margin = '1px 5px'
        li.style.justifyContent = 'start'
        li.style.height = '12px'
        li.style.width = '180px'
        li.style.fontSize = '11px'
        li.style.fontFamily = 'Inter', 'sans-serif'
      } else {
        li.style.alignItems = 'center'
        li.style.cursor = 'pointer'
        li.style.display = 'flex'
        li.style.flexDirection = 'row'
        li.style.marginLeft = '10px'
        li.style.justifyContent = 'center'
        li.style.fontSize = '12px'
        li.style.fontFamily = 'Inter', 'sans-serif'
      }

      li.onclick = () => {
        const { type } = chart.config
        if (type === 'pie' || type === 'doughnut') {
          // Pie and doughnut charts only have a single dataset and visibility is per item
          chart.toggleDataVisibility(item.index)
        } else {
          chart.setDatasetVisibility(
            item.datasetIndex,
            !chart.isDatasetVisible(item.datasetIndex)
          )
        }
        chart.update()
      }

      // Color box
      const boxSpan = document.createElement('span')
      if (window.matchMedia('(max-width: 480px)').matches) {
        boxSpan.style.background = item.fillStyle
        boxSpan.style.borderColor = item.strokeStyle
        boxSpan.style.borderWidth = item.lineWidth + 'px'
        boxSpan.style.display = 'flex'
        boxSpan.style.flexShrink = 0
        boxSpan.style.height = '12px'
        boxSpan.style.marginRight = '10px'
        boxSpan.style.width = '12px'
      } else {
        boxSpan.style.background = item.fillStyle
        boxSpan.style.borderColor = item.strokeStyle
        boxSpan.style.borderWidth = item.lineWidth + 'px'
        boxSpan.style.display = 'inline-block'
        boxSpan.style.flexShrink = 0
        boxSpan.style.height = '12px'
        boxSpan.style.width = '12px'
        boxSpan.style.marginRight = '10px'
      }

      // Text
      const textContainer = document.createElement('p')
      textContainer.style.color = item.fontColor
      textContainer.style.margin = 0
      textContainer.style.padding = 0
      textContainer.style.textDecoration = item.hidden ? 'line-through' : ''

      const text = document.createTextNode(item.text)
      textContainer.appendChild(text)

      li.appendChild(boxSpan)
      li.appendChild(textContainer)
      ul.appendChild(li)
    })
  },
}
