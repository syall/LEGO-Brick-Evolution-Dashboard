/* ========================================
   LEGO Brick Evolution Dashboard
   Interactive Charts + Timeline Logic
   ======================================== */

(function () {
  'use strict';

  const data = LEGO_DATA;
  const years = data.years;
  const milestones = data.milestones;

  // --- Theme Toggle ---
  const themeToggle = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;
  let currentTheme = 'dark';

  themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', currentTheme);
    themeToggle.setAttribute('aria-label', 'Switch to ' + (currentTheme === 'dark' ? 'light' : 'dark') + ' mode');
    themeToggle.innerHTML = currentTheme === 'dark'
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    // Re-render charts with new theme colors
    updateChartColors();
  });

  // --- Helper: get CSS variable value ---
  function cssVar(name) {
    return getComputedStyle(root).getPropertyValue(name).trim();
  }

  function getChartColors() {
    return {
      parts: cssVar('--chart-parts'),
      colors: cssVar('--chart-colors'),
      sets: cssVar('--chart-sets'),
      complexity: cssVar('--chart-complexity'),
      newParts: cssVar('--chart-new-parts'),
      peak: cssVar('--chart-peak'),
      consolidation: cssVar('--chart-consolidation'),
      avg: cssVar('--chart-avg'),
      large: cssVar('--chart-large'),
      text: cssVar('--color-text'),
      textMuted: cssVar('--color-text-muted'),
      textFaint: cssVar('--color-text-faint'),
      border: cssVar('--color-border'),
      surface: cssVar('--color-surface'),
      surfaceOffset: cssVar('--color-surface-offset'),
      surfaceOffset2: cssVar('--color-surface-offset-2'),
    };
  }

  // --- Chart defaults ---
  let charts = {};

  function getCommonChartOptions() {
    const c = getChartColors();
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            color: c.textMuted,
            font: { family: "'Satoshi', sans-serif", size: 12 },
            usePointStyle: true,
            pointStyle: 'rectRounded',
            padding: 16,
            boxWidth: 10,
            boxHeight: 10,
          }
        },
        tooltip: {
          backgroundColor: c.surface,
          titleColor: c.text,
          bodyColor: c.textMuted,
          borderColor: c.border,
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          titleFont: { family: "'Cabinet Grotesk', sans-serif", weight: 700, size: 13 },
          bodyFont: { family: "'Satoshi', sans-serif", size: 12 },
          displayColors: true,
          boxPadding: 6,
        }
      },
      scales: {
        x: {
          ticks: {
            color: c.textFaint,
            font: { family: "'Satoshi', sans-serif", size: 11 },
            maxRotation: 0,
            autoSkipPadding: 24,
          },
          grid: { display: false },
          border: { color: c.border }
        },
        y: {
          ticks: {
            color: c.textFaint,
            font: { family: "'Satoshi', sans-serif", size: 11 },
          },
          grid: { color: c.surfaceOffset2 },
          border: { display: false }
        }
      }
    };
  }

  // --- Chart 1: Catalog Growth (Cumulative Parts + Active Colors) ---
  function createGrowthChart() {
    const ctx = document.getElementById('chart-growth');
    if (!ctx) return;
    const c = getChartColors();
    const opts = getCommonChartOptions();

    charts.growth = new Chart(ctx, {
      type: 'line',
      data: {
        labels: years,
        datasets: [
          {
            label: 'Cumulative Unique Parts',
            data: data.cumulativeParts,
            borderColor: c.parts,
            backgroundColor: c.parts + '15',
            borderWidth: 2.5,
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: c.parts,
            pointHoverBorderColor: c.surface,
            pointHoverBorderWidth: 2,
            yAxisID: 'y',
          },
          {
            label: 'Active Colors',
            data: data.activeColors,
            borderColor: c.colors,
            backgroundColor: c.colors + '15',
            borderWidth: 2.5,
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: c.colors,
            pointHoverBorderColor: c.surface,
            pointHoverBorderWidth: 2,
            yAxisID: 'y1',
          }
        ]
      },
      options: {
        ...opts,
        scales: {
          x: opts.scales.x,
          y: {
            ...opts.scales.y,
            position: 'left',
            title: { display: true, text: 'Cumulative Parts', color: c.textMuted, font: { size: 11 } }
          },
          y1: {
            position: 'right',
            ticks: { ...opts.scales.y.ticks },
            grid: { display: false },
            title: { display: true, text: 'Active Colors', color: c.textMuted, font: { size: 11 } }
          }
        }
      }
    });
  }

  // --- Chart 2: Peak Specialization vs Consolidation (New Parts Per Year) ---
  function createSpecializationChart() {
    const ctx = document.getElementById('chart-specialization');
    if (!ctx) return;
    const c = getChartColors();
    const opts = getCommonChartOptions();

    // Color bars: peak years get red, consolidation years get blue, rest get orange
    const peakThreshold = 1500;
    const consolidationThreshold = 300;

    const barColors = data.newParts.map(v => {
      if (v >= peakThreshold) return c.peak;
      if (v <= consolidationThreshold && v > 0) return c.consolidation;
      return c.newParts + '99';
    });

    // Annotation data for key events
    const eventAnnotations = [
      { year: 2003, label: 'Crisis' },
      { year: 2018, label: 'Bio-PE' },
      { year: 2020, label: '18+' },
    ];

    charts.specialization = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: years,
        datasets: [{
          label: 'New Parts Per Year',
          data: data.newParts,
          backgroundColor: barColors,
          borderColor: barColors,
          borderWidth: 0,
          borderRadius: 3,
          barPercentage: 0.85,
          categoryPercentage: 0.9,
        }]
      },
      options: {
        ...opts,
        plugins: {
          ...opts.plugins,
          legend: { display: false }
        }
      }
    });
  }

  // --- Chart 3: Set Complexity (Avg pieces + Large sets count) ---
  function createComplexityChart() {
    const ctx = document.getElementById('chart-complexity');
    if (!ctx) return;
    const c = getChartColors();
    const opts = getCommonChartOptions();

    charts.complexity = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: years,
        datasets: [
          {
            label: 'Avg Pieces per Set',
            data: data.avgPartsPerSet,
            type: 'line',
            borderColor: c.avg,
            backgroundColor: c.avg + '20',
            borderWidth: 2.5,
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: c.avg,
            pointHoverBorderColor: c.surface,
            pointHoverBorderWidth: 2,
            yAxisID: 'y',
          },
          {
            label: 'Large Sets (1000+ pieces)',
            data: data.largeSets,
            type: 'bar',
            backgroundColor: c.large + '80',
            borderColor: c.large,
            borderWidth: 0,
            borderRadius: 3,
            barPercentage: 0.7,
            categoryPercentage: 0.85,
            yAxisID: 'y1',
          }
        ]
      },
      options: {
        ...opts,
        scales: {
          x: opts.scales.x,
          y: {
            ...opts.scales.y,
            position: 'left',
            title: { display: true, text: 'Avg Pieces', color: c.textMuted, font: { size: 11 } }
          },
          y1: {
            position: 'right',
            ticks: { ...opts.scales.y.ticks },
            grid: { display: false },
            title: { display: true, text: 'Large Sets', color: c.textMuted, font: { size: 11 } }
          }
        }
      }
    });
  }

  // --- Chart 4: Color Palette Evolution ---
  function createColorsChart() {
    const ctx = document.getElementById('chart-colors');
    if (!ctx) return;
    const c = getChartColors();
    const opts = getCommonChartOptions();

    const barColors = data.activeColors.map(() => c.colors);

    charts.colors = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: years,
        datasets: [{
          label: 'Active Colors',
          data: data.activeColors,
          backgroundColor: c.colors + '90',
          borderColor: c.colors,
          borderWidth: 0,
          borderRadius: 2,
          barPercentage: 0.9,
          categoryPercentage: 0.95,
        }]
      },
      options: {
        ...opts,
        plugins: { ...opts.plugins, legend: { display: false } }
      }
    });
  }

  // --- Chart 5: New Colors Per Year ---
  function createNewColorsChart() {
    const ctx = document.getElementById('chart-new-colors');
    if (!ctx) return;
    const c = getChartColors();
    const opts = getCommonChartOptions();

    charts.newColors = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: years,
        datasets: [{
          label: 'New Colors',
          data: data.newColors,
          backgroundColor: c.colors + '70',
          borderColor: c.colors,
          borderWidth: 0,
          borderRadius: 2,
          barPercentage: 0.9,
          categoryPercentage: 0.95,
        }]
      },
      options: {
        ...opts,
        plugins: { ...opts.plugins, legend: { display: false } }
      }
    });
  }

  // --- Update chart colors when theme changes ---
  function updateChartColors() {
    const c = getChartColors();

    // Growth chart
    if (charts.growth) {
      charts.growth.data.datasets[0].borderColor = c.parts;
      charts.growth.data.datasets[0].backgroundColor = c.parts + '15';
      charts.growth.data.datasets[0].pointHoverBackgroundColor = c.parts;
      charts.growth.data.datasets[0].pointHoverBorderColor = c.surface;
      charts.growth.data.datasets[1].borderColor = c.colors;
      charts.growth.data.datasets[1].backgroundColor = c.colors + '15';
      charts.growth.data.datasets[1].pointHoverBackgroundColor = c.colors;
      charts.growth.data.datasets[1].pointHoverBorderColor = c.surface;
      charts.growth.options.scales.y.ticks.color = c.textFaint;
      charts.growth.options.scales.y1.ticks.color = c.textFaint;
      charts.growth.options.scales.y.grid.color = c.surfaceOffset2;
      charts.growth.options.scales.x.ticks.color = c.textFaint;
      charts.growth.options.scales.x.border.color = c.border;
      charts.growth.options.plugins.legend.labels.color = c.textMuted;
      charts.growth.options.plugins.tooltip.backgroundColor = c.surface;
      charts.growth.options.plugins.tooltip.titleColor = c.text;
      charts.growth.options.plugins.tooltip.bodyColor = c.textMuted;
      charts.growth.options.plugins.tooltip.borderColor = c.border;
      charts.growth.update('none');
    }

    // Specialization chart
    if (charts.specialization) {
      const peakThreshold = 1500;
      const consolidationThreshold = 300;
      charts.specialization.data.datasets[0].backgroundColor = data.newParts.map(v => {
        if (v >= peakThreshold) return c.peak;
        if (v <= consolidationThreshold && v > 0) return c.consolidation;
        return c.newParts + '99';
      });
      charts.specialization.data.datasets[0].borderColor = charts.specialization.data.datasets[0].backgroundColor;
      charts.specialization.options.scales.y.ticks.color = c.textFaint;
      charts.specialization.options.scales.y.grid.color = c.surfaceOffset2;
      charts.specialization.options.scales.x.ticks.color = c.textFaint;
      charts.specialization.options.scales.x.border.color = c.border;
      charts.specialization.options.plugins.tooltip.backgroundColor = c.surface;
      charts.specialization.options.plugins.tooltip.titleColor = c.text;
      charts.specialization.options.plugins.tooltip.bodyColor = c.textMuted;
      charts.specialization.options.plugins.tooltip.borderColor = c.border;
      charts.specialization.update('none');
    }

    // Complexity chart
    if (charts.complexity) {
      charts.complexity.data.datasets[0].borderColor = c.avg;
      charts.complexity.data.datasets[0].backgroundColor = c.avg + '20';
      charts.complexity.data.datasets[0].pointHoverBackgroundColor = c.avg;
      charts.complexity.data.datasets[0].pointHoverBorderColor = c.surface;
      charts.complexity.data.datasets[1].backgroundColor = c.large + '80';
      charts.complexity.data.datasets[1].borderColor = c.large;
      charts.complexity.options.scales.y.ticks.color = c.textFaint;
      charts.complexity.options.scales.y1.ticks.color = c.textFaint;
      charts.complexity.options.scales.y.grid.color = c.surfaceOffset2;
      charts.complexity.options.scales.x.ticks.color = c.textFaint;
      charts.complexity.options.scales.x.border.color = c.border;
      charts.complexity.options.plugins.legend.labels.color = c.textMuted;
      charts.complexity.options.plugins.tooltip.backgroundColor = c.surface;
      charts.complexity.options.plugins.tooltip.titleColor = c.text;
      charts.complexity.options.plugins.tooltip.bodyColor = c.textMuted;
      charts.complexity.options.plugins.tooltip.borderColor = c.border;
      charts.complexity.update('none');
    }

    // Colors chart
    if (charts.colors) {
      charts.colors.data.datasets[0].backgroundColor = c.colors + '90';
      charts.colors.data.datasets[0].borderColor = c.colors;
      charts.colors.options.scales.y.ticks.color = c.textFaint;
      charts.colors.options.scales.y.grid.color = c.surfaceOffset2;
      charts.colors.options.scales.x.ticks.color = c.textFaint;
      charts.colors.options.scales.x.border.color = c.border;
      charts.colors.options.plugins.tooltip.backgroundColor = c.surface;
      charts.colors.options.plugins.tooltip.titleColor = c.text;
      charts.colors.options.plugins.tooltip.bodyColor = c.textMuted;
      charts.colors.options.plugins.tooltip.borderColor = c.border;
      charts.colors.update('none');
    }

    // New colors chart
    if (charts.newColors) {
      charts.newColors.data.datasets[0].backgroundColor = c.colors + '70';
      charts.newColors.data.datasets[0].borderColor = c.colors;
      charts.newColors.options.scales.y.ticks.color = c.textFaint;
      charts.newColors.options.scales.y.grid.color = c.surfaceOffset2;
      charts.newColors.options.scales.x.ticks.color = c.textFaint;
      charts.newColors.options.scales.x.border.color = c.border;
      charts.newColors.options.plugins.tooltip.backgroundColor = c.surface;
      charts.newColors.options.plugins.tooltip.titleColor = c.text;
      charts.newColors.options.plugins.tooltip.bodyColor = c.textMuted;
      charts.newColors.options.plugins.tooltip.borderColor = c.border;
      charts.newColors.update('none');
    }
  }

  // --- Timeline Slider ---
  const slider = document.getElementById('year-slider');
  const yearDisplay = document.getElementById('selected-year');
  const milestoneBadge = document.getElementById('milestone-badge');
  const milestoneTitle = document.getElementById('milestone-title');
  const milestoneDesc = document.getElementById('milestone-desc');
  const milestoneStats = document.getElementById('milestone-stats');
  const playBtn = document.getElementById('play-btn');

  // Slider ticks
  const ticksContainer = document.getElementById('slider-ticks');
  const tickYears = [1949, 1960, 1970, 1980, 1990, 2000, 2010, 2020, 2026];
  ticksContainer.innerHTML = tickYears.map(y => `<span>${y}</span>`).join('');

  let playInterval = null;
  let isPlaying = false;

  function findNearestMilestone(year) {
    let nearest = milestones[0];
    let minDiff = Infinity;
    for (const m of milestones) {
      const diff = Math.abs(m.year - year);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = m;
      }
    }
    return nearest;
  }

  function updateMilestoneCard(year) {
    const milestone = findNearestMilestone(year);
    const yearIdx = years.indexOf(year);
    if (yearIdx === -1) return;

    milestoneBadge.textContent = milestone.category;
    milestoneBadge.className = 'milestone-badge ' + milestone.category;
    milestoneTitle.textContent = milestone.title;
    milestoneDesc.textContent = milestone.desc;

    // Stats
    document.getElementById('ms-colors').textContent = data.activeColors[yearIdx];
    document.getElementById('ms-parts').textContent = data.cumulativeParts[yearIdx].toLocaleString();
    document.getElementById('ms-sets').textContent = data.setsPerYear[yearIdx].toLocaleString();
    document.getElementById('ms-avg').textContent = data.avgPartsPerSet[yearIdx];

    // Update active pill
    document.querySelectorAll('.milestone-pill').forEach((pill, i) => {
      pill.classList.toggle('active', milestones[i].year === milestone.year);
    });

    // Scroll pill into view - only if not the first card
    const activePill = document.querySelector('.milestone-pill.active');
    if (activePill) {
      const track = document.getElementById('milestones-track');
      const pillLeft = activePill.offsetLeft;
      const trackWidth = track.offsetWidth;
      const pillWidth = activePill.offsetWidth;
      // Only scroll if the active pill is outside the visible area
      if (pillLeft < track.scrollLeft || pillLeft + pillWidth > track.scrollLeft + trackWidth) {
        track.scrollTo({ left: Math.max(0, pillLeft - 16), behavior: 'smooth' });
      }
    }
  }

  slider.addEventListener('input', (e) => {
    const year = parseInt(e.target.value);
    yearDisplay.textContent = year;
    updateMilestoneCard(year);
    highlightYearOnCharts(year);
  });

  // --- Highlight year on charts ---
  function highlightYearOnCharts(year) {
    const yearIdx = years.indexOf(year);
    if (yearIdx === -1) return;

    // For all charts, update hover/active state
    Object.values(charts).forEach(chart => {
      if (chart) {
        chart.update('none');
      }
    });
  }

  // --- Play/Pause animation ---
  playBtn.addEventListener('click', () => {
    if (isPlaying) {
      clearInterval(playInterval);
      isPlaying = false;
      playBtn.classList.remove('playing');
      playBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
      playBtn.setAttribute('aria-label', 'Play timeline animation');
    } else {
      isPlaying = true;
      playBtn.classList.add('playing');
      playBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>';
      playBtn.setAttribute('aria-label', 'Pause timeline animation');
      playInterval = setInterval(() => {
        let currentYear = parseInt(slider.value);
        if (currentYear >= 2026) {
          currentYear = 1949;
        } else {
          currentYear++;
        }
        slider.value = currentYear;
        yearDisplay.textContent = currentYear;
        updateMilestoneCard(currentYear);
        highlightYearOnCharts(currentYear);
      }, 400);
    }
  });

  // --- Build Milestones Track ---
  const milestonesTrack = document.getElementById('milestones-track');
  milestonesTrack.innerHTML = milestones.map((m, i) => `
    <div class="milestone-pill" data-idx="${i}" data-year="${m.year}">
      <span class="pill-year">${m.year}</span>
      <span class="pill-title">${m.title}</span>
      <span class="pill-cat ${m.category}">${m.category}</span>
    </div>
  `).join('');

  // Click on milestone pills
  document.querySelectorAll('.milestone-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const year = parseInt(pill.dataset.year);
      slider.value = year;
      yearDisplay.textContent = year;
      updateMilestoneCard(year);
      highlightYearOnCharts(year);
    });
  });

  // --- Initialize ---
  function init() {
    createGrowthChart();
    createSpecializationChart();
    createComplexityChart();
    createColorsChart();
    createNewColorsChart();
    updateMilestoneCard(2026);

    // Animate KPI values on load
    animateNumber('kpi-parts', 0, 42565, 2000);
    animateNumber('kpi-colors', 0, 275, 1500);
    animateNumber('kpi-sets', 0, 28273, 2000);
    animateNumber('kpi-max', 0, 11695, 2000);
  }

  function animateNumber(id, start, end, duration) {
    const el = document.getElementById(id);
    if (!el) return;
    const range = end - start;
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + range * eased);
      el.textContent = current.toLocaleString();
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
