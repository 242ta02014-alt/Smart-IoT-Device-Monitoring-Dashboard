(() => {
  'use strict';

  const metricElements = {
    temperature: document.querySelector('[data-metric="temperature"]'),
    humidity: document.querySelector('[data-metric="humidity"]'),
    camera: document.querySelector('[data-metric="camera"]'),
    water: document.querySelector('[data-metric="water"]'),
    power: document.querySelector('[data-metric="power"]')
  };

  const temperatureHistory = [21.8, 22.1, 21.7, 22.5, 22.9, 22.2, 21.9, 22.4, 22.8, 22.4, 22.7, 22.4];
  const energyHistory = [3.2, 2.5, 4.1, 2.9, 3.6, 4.4, 2.8];
  const chartColors = { grid: '#263747', label: '#708396', teal: '#36d5bd', blue: '#70a8ff' };

  function randomBetween(min, max, decimals = 1) {
    return (Math.random() * (max - min) + min).toFixed(decimals);
  }

  function updateLiveMetrics() {
    metricElements.temperature.textContent = randomBetween(21.8, 23.1);
    metricElements.humidity.textContent = randomBetween(46, 51, 0);
    metricElements.camera.textContent = randomBetween(23.2, 24.8);
    metricElements.water.textContent = randomBetween(1.8, 2.8);
    temperatureHistory.push(Number(metricElements.temperature.textContent));
    temperatureHistory.shift();
    drawTemperatureChart();
    const now = new Date();
    document.querySelector('#last-updated').textContent = `${now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }

  function setupCanvas(canvas) {
    const ratio = window.devicePixelRatio || 1;
    const bounds = canvas.getBoundingClientRect();
    canvas.width = bounds.width * ratio;
    canvas.height = bounds.height * ratio;
    const context = canvas.getContext('2d');
    context.scale(ratio, ratio);
    return { context, width: bounds.width, height: bounds.height };
  }

  function drawChartFrame(context, width, height, padding) {
    context.strokeStyle = chartColors.grid;
    context.lineWidth = 1;
    context.setLineDash([3, 4]);
    for (let index = 0; index < 4; index += 1) {
      const y = padding.top + ((height - padding.top - padding.bottom) / 3) * index;
      context.beginPath();
      context.moveTo(padding.left, y);
      context.lineTo(width - padding.right, y);
      context.stroke();
    }
    context.setLineDash([]);
  }

  function drawTemperatureChart() {
    const canvas = document.querySelector('#temperature-chart');
    if (!canvas || !canvas.offsetWidth) return;
    const { context, width, height } = setupCanvas(canvas);
    const padding = { top: 12, right: 8, bottom: 25, left: 30 };
    const min = 20;
    const max = 25;
    drawChartFrame(context, width, height, padding);
    context.font = '10px DM Sans';
    context.fillStyle = chartColors.label;
    [25, 23, 21].forEach((value, index) => context.fillText(`${value}°`, 0, padding.top + (height - padding.top - padding.bottom) * (index / 2) + 3));
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const points = temperatureHistory.map((value, index) => ({ x: padding.left + (plotWidth / (temperatureHistory.length - 1)) * index, y: padding.top + (max - value) / (max - min) * plotHeight }));
    const gradient = context.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, 'rgba(54, 213, 189, .22)');
    gradient.addColorStop(1, 'rgba(54, 213, 189, 0)');
    context.beginPath();
    context.moveTo(points[0].x, height - padding.bottom);
    points.forEach((point) => context.lineTo(point.x, point.y));
    context.lineTo(points[points.length - 1].x, height - padding.bottom);
    context.closePath();
    context.fillStyle = gradient;
    context.fill();
    context.beginPath();
    points.forEach((point, index) => index === 0 ? context.moveTo(point.x, point.y) : context.lineTo(point.x, point.y));
    context.strokeStyle = chartColors.teal;
    context.lineWidth = 2;
    context.stroke();
    context.fillStyle = chartColors.label;
    ['12 AM', '6 AM', '12 PM', '6 PM', 'Now'].forEach((label, index) => context.fillText(label, padding.left + (plotWidth / 4) * index - (index === 4 ? 13 : 10), height - 6));
    const latest = points[points.length - 1];
    context.beginPath();
    context.arc(latest.x, latest.y, 4, 0, Math.PI * 2);
    context.fillStyle = chartColors.teal;
    context.fill();
    context.beginPath();
    context.arc(latest.x, latest.y, 7, 0, Math.PI * 2);
    context.strokeStyle = 'rgba(54,213,189,.25)';
    context.stroke();
  }

  function drawEnergyChart() {
    const canvas = document.querySelector('#energy-chart');
    if (!canvas || !canvas.offsetWidth) return;
    const { context, width, height } = setupCanvas(canvas);
    const padding = { top: 12, right: 8, bottom: 25, left: 24 };
    const max = 5;
    drawChartFrame(context, width, height, padding);
    context.font = '10px DM Sans';
    context.fillStyle = chartColors.label;
    [5, 3, 1].forEach((value, index) => context.fillText(`${value}`, 5, padding.top + (height - padding.top - padding.bottom) * (index / 2) + 3));
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const barWidth = Math.min(25, plotWidth / 10);
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    energyHistory.forEach((value, index) => {
      const x = padding.left + (plotWidth / labels.length) * index + (plotWidth / labels.length - barWidth) / 2;
      const barHeight = (value / max) * plotHeight;
      const y = height - padding.bottom - barHeight;
      context.fillStyle = index === energyHistory.length - 1 ? chartColors.teal : 'rgba(112,168,255,.55)';
      context.beginPath();
      context.roundRect(x, y, barWidth, barHeight, 4);
      context.fill();
      context.fillStyle = chartColors.label;
      context.fillText(labels[index], x + barWidth / 2 - 9, height - 6);
    });
  }

  function bindAlerts() {
    document.querySelectorAll('.dismiss-alert').forEach((button) => {
      button.addEventListener('click', () => {
        const item = button.closest('.alert-item');
        item.style.opacity = '0';
        item.style.transform = 'translateX(12px)';
        item.style.transition = 'opacity .2s ease, transform .2s ease';
        window.setTimeout(() => {
          item.remove();
          const remaining = document.querySelectorAll('.alert-item').length;
          document.querySelector('#alert-count').textContent = String(remaining).padStart(2, '0');
          document.querySelector('.alert-count').textContent = remaining;
        }, 220);
      });
    });
  }

  function bindMobileNavigation() {
    const menuButton = document.querySelector('.mobile-menu');
    const sidebar = document.querySelector('.sidebar');
    menuButton.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.querySelectorAll('.nav-item').forEach((item) => item.addEventListener('click', () => sidebar.classList.remove('open')));
  }

  function renderCharts() {
    drawTemperatureChart();
    drawEnergyChart();
  }

  bindAlerts();
  bindMobileNavigation();
  renderCharts();
  window.setInterval(updateLiveMetrics, 4000);
  window.addEventListener('resize', renderCharts);
})();
