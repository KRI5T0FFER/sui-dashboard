const { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } = Recharts;
const { useState, useEffect } = React;

function SuiDashboard() {
  const [price, setPrice] = useState(null);
  const [change24h, setChange24h] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('7');

  useEffect(() => {
    fetchSuiData();
    const interval = setInterval(fetchSuiData, 60000);
    return () => clearInterval(interval);
  }, [timeframe]);

  const fetchSuiData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const priceResponse = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=sui&vs_currencies=usd&include_24hr_change=true',
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );
      
      if (!priceResponse.ok) {
        throw new Error('Rate limit reached. Please wait a moment.');
      }
      
      const priceData = await priceResponse.json();
      
      if (priceData.sui) {
        setPrice(priceData.sui.usd);
        setChange24h(priceData.sui.usd_24h_change);
      }

      const days = timeframe === 'max' ? 'max' : timeframe;
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const chartResponse = await fetch(
        `https://api.coingecko.com/api/v3/coins/sui/market_chart?vs_currency=usd&days=${days}`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );
      
      if (!chartResponse.ok) {
        throw new Error('Unable to fetch chart data');
      }
      
      const chartJson = await chartResponse.json();
      
      let prices = chartJson.prices;
      const maxPoints = 100;
      if (prices.length > maxPoints) {
        const step = Math.floor(prices.length / maxPoints);
        prices = prices.filter((_, index) => index % step === 0);
      }
      
      const formattedData = prices.map(([timestamp, price]) => {
        const date = new Date(timestamp);
        let timeLabel;
        
        if (timeframe === '1') {
          timeLabel = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
        } else if (timeframe === '7' || timeframe === '30') {
          timeLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
          timeLabel = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        }
        
        return {
          time: timeLabel,
          price: price
        };
      });
      
      setChartData(formattedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching Sui data:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return React.createElement('div', {
        className: 'bg-white/90 backdrop-blur px-3 py-2 rounded'
      }, [
        React.createElement('p', {
          className: 'text-xs text-gray-500',
          key: 'time'
        }, payload[0].payload.time),
        React.createElement('p', {
          className: 'text-sm font-medium text-gray-900',
          key: 'price'
        }, `$${payload[0].value.toFixed(4)}`)
      ]);
    }
    return null;
  };

  if (loading && !price) {
    return React.createElement('div', {
      className: 'min-h-screen bg-white flex items-center justify-center'
    },
      React.createElement('div', {
        className: 'text-blue-500 text-lg font-light'
      }, 'Loading Sui data...')
    );
  }

  if (error && !price) {
    return React.createElement('div', {
      className: 'min-h-screen bg-white flex items-center justify-center'
    },
      React.createElement('div', {
        className: 'text-center'
      }, [
        React.createElement('div', {
          className: 'text-red-500 text-lg font-light mb-2',
          key: 'error-title'
        }, 'Unable to load data'),
        React.createElement('div', {
          className: 'text-gray-400 text-sm mb-4',
          key: 'error-msg'
        }, error),
        React.createElement('div', {
          className: 'text-gray-400 text-xs mb-4',
          key: 'error-note'
        }, [
          'CoinGecko\'s free API has strict rate limits.',
          React.createElement('br', { key: 'br' }),
          'Please wait a moment and try again.'
        ]),
        React.createElement('button', {
          onClick: fetchSuiData,
          className: 'text-blue-500 text-sm hover:text-blue-600 transition-colors',
          key: 'retry-btn'
        }, 'Try Again')
      ])
    );
  }

  return React.createElement('div', {
    className: 'min-h-screen bg-white py-20 px-8'
  }, [
    React.createElement('div', {
      className: 'fixed top-8 right-8',
      key: 'nav'
    },
      React.createElement('a', {
        href: '#more',
        className: 'text-sm font-light text-gray-400 hover:text-blue-500 transition-colors'
      }, 'More →')
    ),
    React.createElement('div', {
      className: 'min-h-screen flex items-center justify-center',
      key: 'main'
    },
      React.createElement('div', {
        className: 'w-full max-w-5xl'
      }, [
        React.createElement('div', {
          className: 'mb-24 text-center',
          key: 'header'
        }, [
          React.createElement('h1', {
            className: 'text-7xl font-extralight text-gray-900 mb-3 tracking-tight',
            key: 'title'
          }, 'SUI'),
          React.createElement('div', {
            className: 'flex items-baseline gap-8 justify-center',
            key: 'prices'
          }, [
            React.createElement('div', {
              className: 'text-4xl font-light text-gray-900',
              key: 'price'
            }, price ? `$${price.toFixed(4)}` : '--'),
            React.createElement('div', {
              className: `text-xl font-light ${change24h >= 0 ? 'text-blue-500' : 'text-red-400'}`,
              key: 'change'
            }, change24h ? `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%` : '--')
          ])
        ]),
        React.createElement('div', {
          className: 'mb-12',
          key: 'chart-section'
        }, [
          React.createElement('div', {
            className: 'flex gap-6 mb-8 justify-center',
            key: 'timeframe-buttons'
          }, [
            { label: '24H', value: '1' },
            { label: '1W', value: '7' },
            { label: '1M', value: '30' },
            { label: '3M', value: '90' },
            { label: '1Y', value: '365' },
            { label: 'ALL', value: 'max' }
          ].map((tf) =>
            React.createElement('button', {
              key: tf.value,
              onClick: () => setTimeframe(tf.value),
              disabled: loading,
              className: `text-sm font-light transition-colors ${
                timeframe === tf.value
                  ? 'text-blue-500'
                  : 'text-gray-300 hover:text-gray-500'
              } ${loading ? 'opacity-50' : ''}`
            }, tf.label)
          )),
          loading ? 
            React.createElement('div', {
              className: 'h-[400px] flex items-center justify-center',
              key: 'loading'
            },
              React.createElement('div', {
                className: 'text-gray-300 text-sm'
              }, 'Loading chart...')
            )
          : chartData.length > 0 ?
            React.createElement(ResponsiveContainer, {
              width: '100%',
              height: 400,
              key: 'chart'
            },
              React.createElement(LineChart, { data: chartData }, [
                React.createElement(XAxis, {
                  key: 'xaxis',
                  dataKey: 'time',
                  axisLine: false,
                  tickLine: false,
                  tick: { fill: '#d1d5db', fontSize: 11 },
                  dy: 15
                }),
                React.createElement(YAxis, {
                  key: 'yaxis',
                  axisLine: false,
                  tickLine: false,
                  tick: { fill: '#d1d5db', fontSize: 11 },
                  tickFormatter: (value) => `$${value.toFixed(3)}`,
                  dx: -15
                }),
                React.createElement(Tooltip, {
                  key: 'tooltip',
                  content: CustomTooltip,
                  cursor: { stroke: '#e5e7eb', strokeWidth: 1 }
                }),
                React.createElement(Line, {
                  key: 'line',
                  type: 'monotone',
                  dataKey: 'price',
                  stroke: '#3b82f6',
                  strokeWidth: 1.5,
                  dot: false,
                  activeDot: { r: 3, fill: '#3b82f6', strokeWidth: 0 }
                })
              ])
            )
          : React.createElement('div', {
              className: 'h-[400px] flex items-center justify-center',
              key: 'no-data'
            },
              React.createElement('div', {
                className: 'text-gray-300 text-sm'
              }, 'No chart data available')
            )
        ]),
        React.createElement('div', {
          className: 'text-gray-300 text-xs font-light text-center',
          key: 'footer'
        }, `${timeframe === '1' ? '24 hour' : timeframe === '7' ? '7 day' : timeframe === '30' ? '1 month' : timeframe === '90' ? '3 month' : timeframe === '365' ? '1 year' : 'All time'} performance · Data by CoinGecko`)
      ])
    )
  ]);
}

ReactDOM.render(
  React.createElement(SuiDashboard),
  document.getElementById('root')
);
