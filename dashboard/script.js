document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    refreshDashboard();
    document.getElementById('file-upload').addEventListener('change', handleFileUpload);
});

let charts = {};
let currentData = {
    performance: [],
    aging: [250, 180, 120, 80, 45],
    dso: [42, 45, 40, 38, 44, 41],
    revenue: [180000, 210000, 195000, 230000, 250000, 280000],
    growth: [10, 15, 8, 12, 18, 20]
};

function refreshDashboard(customFullData = null) {
    if (customFullData) {
        currentData = customFullData;
    } else {
        currentData.performance = generateRandomPerformanceData();
        // Keep other defaults or randomize if no custom data
    }

    initPerformanceTab(currentData.performance);
    initAgingTab(currentData.aging);
    initDSOTab(currentData.dso);
    initRevenueTab(currentData.revenue, currentData.growth);
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const extension = file.name.split('.').pop().toLowerCase();
    if (extension === 'csv') {
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            complete: (results) => processUploadedData(results.data)
        });
    } else {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
            processUploadedData(jsonData);
        };
        reader.readAsArrayBuffer(file);
    }
}

function processUploadedData(data) {
    const performance = data.filter(r => r.Name || r.name).map(r => ({
        name: r.Name || r.name,
        jan: parseFloat(r.Jan || r.jan || 0),
        feb: parseFloat(r.Feb || r.feb || 0),
        mar: parseFloat(r.Mar || r.mar || 0),
        apr: parseFloat(r.Apr || r.apr || 0),
        balance: parseFloat(r.Balance || r.balance || 0)
    }));

    // Extract other metrics from the first row if available
    const first = data[0];
    const aging = [
        first.aging_0_30 || 200, first.aging_31_60 || 150, first.aging_61_90 || 100,
        first.aging_91_120 || 50, first.aging_120plus || 30
    ];
    const dso = [
        first.dso_oct || 40, first.dso_nov || 42, first.dso_dec || 38,
        first.dso_jan || 45, first.dso_feb || 41, first.dso_mar || 39
    ];
    const revenue = [
        first.rev_jan || 150000, first.rev_feb || 160000, first.rev_mar || 170000,
        first.rev_apr || 180000, first.rev_may || 190000, first.rev_jun || 200000
    ];
    const growth = [
        first.growth_jan || 5, first.growth_feb || 7, first.growth_mar || 6,
        first.growth_apr || 8, first.growth_may || 10, first.growth_jun || 12
    ];

    if (performance.length > 0) {
        refreshDashboard({ performance, aging, dso, revenue, growth });
        alert('¡Dashboard y Pestañas actualizadas con éxito!');
    } else {
        alert('Archivo inválido. Asegúrate de incluir la columna "Name" y "Balance".');
    }
}

function initPerformanceTab(data) {
    const totalMembers = data.length;
    const avgEfficiency = (data.reduce((acc, curr) => acc + curr.balance, 0) / (totalMembers || 1)).toFixed(1);
    const onTargetCount = data.filter(m => m.balance >= 90).length;
    const riskCount = data.filter(m => m.balance < 85).length;
    const above90Percent = totalMembers > 0 ? ((onTargetCount / totalMembers) * 100).toFixed(0) : 0;

    document.getElementById('val-efficiency').textContent = `${avgEfficiency}%`;
    document.getElementById('val-above-target').textContent = `${above90Percent}%`;
    document.getElementById('val-on-target').textContent = onTargetCount;
    document.getElementById('val-risk').textContent = riskCount;

    renderPerformanceTable(data);
    renderPerformanceTrend(data);
    renderSparklines();
    generateAlerts(data);
    generateInsights(data, avgEfficiency, riskCount);
    generateExecutiveSummary(avgEfficiency, onTargetCount, riskCount);
}

function renderPerformanceTable(data) {
    const tbody = document.querySelector('#teamTable tbody');
    tbody.innerHTML = [...data].sort((a, b) => b.balance - a.balance).map(m => {
        let statusClass = m.balance >= 90 ? 'badge-on-target' : (m.balance >= 85 ? 'badge-watch' : 'badge-risk');
        let statusText = m.balance >= 90 ? 'On Target' : (m.balance >= 85 ? 'Watch' : 'Risk');
        const initials = m.name.split(' ').map(n => n[0]).join('');
        return `<tr><td><div class="member-cell"><div class="table-avatar">${initials}</div><span>${m.name}</span></div></td>
                <td><strong>${m.balance}%</strong></td><td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td><span style="color: ${m.apr >= m.mar ? '#22C55E' : '#EF4444'}">${m.apr >= m.mar ? '↗' : '↘'}</span></td></tr>`;
    }).join('');
}

function renderPerformanceTrend(data) {
    if (charts.main) charts.main.destroy();
    const ctx = document.getElementById('mainPerformanceChart').getContext('2d');
    const months = ['Jan', 'Feb', 'Mar', 'Apr'];
    charts.main = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                { label: 'Team Average', data: months.map(m => data.reduce((acc, c) => acc + c[m.toLowerCase()], 0) / (data.length || 1)), borderColor: '#2563EB', backgroundColor: 'rgba(37, 99, 235, 0.1)', fill: true, tension: 0.4 },
                { label: 'Target (90%)', data: [90, 90, 90, 90], borderColor: '#94A3B8', borderDash: [5, 5], fill: false, pointRadius: 0 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

function initAgingTab(data) {
    if (charts.aging) charts.aging.destroy();
    const ctx = document.getElementById('agingChart').getContext('2d');
    charts.aging = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['0-30 Days', '31-60 Days', '61-90 Days', '91-120 Days', '120+ Days'],
            datasets: [{ label: 'Jobs', data: data, backgroundColor: ['#22C55E', '#2563EB', '#F59E0B', '#EF4444', '#7C3AED'], borderRadius: 8 }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function initDSOTab(data) {
    if (charts.dso) charts.dso.destroy();
    const ctx = document.getElementById('dsoChart').getContext('2d');
    charts.dso = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
            datasets: [{ label: 'DSO', data: data, borderColor: '#7C3AED', backgroundColor: 'rgba(124, 58, 237, 0.1)', fill: true, tension: 0.3 },
            { label: 'Goal', data: [40, 40, 40, 40, 40, 40], borderColor: '#22C55E', borderDash: [5, 5], pointRadius: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 30, max: 60 } } }
    });
}

function initRevenueTab(rev, growth) {
    if (charts.revenue) charts.revenue.destroy();
    const ctx = document.getElementById('revenueChart').getContext('2d');
    charts.revenue = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{ label: 'Revenue', data: rev, backgroundColor: '#2563EB', borderRadius: 6, yAxisID: 'y' },
            { label: 'Growth %', data: growth, type: 'line', borderColor: '#F59E0B', yAxisID: 'y1' }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { position: 'left' }, y1: { position: 'right', grid: { drawOnChartArea: false } } }
        }
    });
}

function initTabs() {
    const navItems = document.querySelectorAll('.nav-item[data-tab]');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => {
                c.classList.remove('active');
                if (c.id === `tab-${item.dataset.tab}`) c.classList.add('active');
            });
            document.getElementById('view-title').textContent = item.innerText.trim();
        });
    });
}

function generateRandomPerformanceData() {
    return ["Jimena Maya", "Aldo Delgado", "Brenda Ruiz", "Carlos Slim", "Diana Prince", "Eric Northman", "Fiona Apple", "George Martin", "Hannah Arendt", "Isaac Newton"].map(name => {
        const b = 80 + Math.random() * 20;
        return { name, jan: b - 2, feb: b + 1, mar: b - 1, apr: b + 2, balance: parseFloat(b.toFixed(1)) };
    });
}

function renderSparklines() {
    ['spark-efficiency', 'spark-above-target', 'spark-on-target', 'spark-risk'].forEach(id => {
        if (charts[id]) charts[id].destroy();
        charts[id] = new Chart(document.getElementById(id).getContext('2d'), {
            type: 'line',
            data: { labels: [1, 2, 3, 4, 5], datasets: [{ data: Array.from({ length: 5 }, () => 70 + Math.random() * 20), borderColor: '#2563EB', pointRadius: 0 }] },
            options: { events: [], responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
        });
    });
}

function generateAlerts(data) {
    const risk = data.filter(m => m.balance < 85);
    document.getElementById('alerts-list').innerHTML = risk.map(m => `<div class="alert-item"><div class="alert-title">Riesgo: ${m.name}</div><div class="alert-desc">${m.balance}%</div></div>`).join('') || '<div class="alert-desc">Sin riesgos.</div>';
    document.getElementById('alert-count').textContent = risk.length;
}

function generateInsights(data, avg, riskCount) {
    const top = [...data].sort((a, b) => b.balance - a.balance)[0];
    document.getElementById('insights-list').innerHTML = [
        `Promedio: ${avg}% vs meta 90%`, `Riesgos: ${riskCount} miembros`, `Líder: ${top ? top.name : 'N/A'}`,
        `DSO: Tendencia estable`, `Revenue: Crecimiento sostenido`, `Aging: Controlar GAP 90+`, `Backlog: Optimización requerida`
    ].map(i => `<li>${i}</li>`).join('');
}

function generateExecutiveSummary(avg, onTarget, risk) {
    document.getElementById('exec-summary-content').innerHTML = `Eficiencia al ${avg}%. ${onTarget} cumpliendo. Foco en ${risk} críticos.`;
}
