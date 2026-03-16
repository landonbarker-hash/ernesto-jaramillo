document.addEventListener('DOMContentLoaded', () => {
    let currentMemberId = 1;
    let trendChart = null;
    let riskTrendChart = null;
    let priorityChart = null;
    let annualJobsChart = null;

    // Main Dashboard Elements
    const teamNav = document.getElementById('team-nav');
    const csvUpload = document.getElementById('csv-upload');

    // Persistence Logic
    function loadSavedData() {
        const savedData = localStorage.getItem('billing_dashboard_data');
        const savedTarget = localStorage.getItem('billing_dashboard_target');

        if (savedData) {
            try {
                billingData.monthlyData = JSON.parse(savedData);
                console.log("✓ Persistence: Monthly data loaded from localStorage");
            } catch (e) {
                console.error("Error loading saved data", e);
            }
        }

        if (savedTarget) {
            billingData.target = parseInt(savedTarget) || 820;
            billingData.dailyTarget = Math.round(billingData.target / 20);
            console.log("✓ Persistence: Billing target loaded from localStorage");
            const targetInput = document.getElementById('monthly-target-input');
            if (targetInput) targetInput.value = billingData.target;
        } else {
            // Default calculation if not saved
            billingData.dailyTarget = Math.round(billingData.target / 20);
        }
    }

    function saveData() {
        localStorage.setItem('billing_dashboard_data', JSON.stringify(billingData.monthlyData));
        localStorage.setItem('billing_dashboard_target', billingData.target.toString());
    }

    function resetData() {
        if (confirm("Are you sure you want to reset all data? This will restore original values and clear all uploads.")) {
            localStorage.removeItem('billing_dashboard_data');
            localStorage.removeItem('billing_dashboard_target');
            location.reload();
        }
    }
    const efficiencyValue = document.getElementById('efficiency-value');
    const efficiencyText = document.getElementById('efficiency-text');
    const scoreMarker = document.getElementById('score-marker');
    const avgDayValue = document.getElementById('avg-day-value');
    const avgDayStatus = document.getElementById('avg-day-status');
    const avgDayMarker = document.getElementById('avg-day-marker');
    const totalVarianceValue = document.getElementById('total-variance-value');
    const varianceStatus = document.getElementById('variance-status');
    const varianceMarker = document.getElementById('variance-marker');
    const monthGrid = document.getElementById('month-grid');
    const profilePic = document.getElementById('profile-pic');
    const profileNameKpi = document.getElementById('profile-name-kpi');
    const historyBody = document.getElementById('history-body-neon');

    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const viewContainers = document.querySelectorAll('.view-container');

    // Risk Elements
    const riskLevelValue = document.getElementById('risk-level-value');
    const riskLevelStatus = document.getElementById('risk-level-status');
    const riskLevelMarker = document.getElementById('risk-level-marker');
    const totalIssuesValue = document.getElementById('total-issues-value');
    const totalIssuesMarker = document.getElementById('total-issues-marker');
    const peakMonthValue = document.getElementById('peak-month-value');
    const peakMonthStatus = document.getElementById('peak-month-status');
    const peakMonthMarker = document.getElementById('peak-month-marker');
    const riskHistoryBody = document.getElementById('risk-history-body');

    function init() {
        loadSavedData();
        renderTeamIcons();
        initNavigation();
        loadMemberData(currentMemberId);

        // Data Management Events
        const btnExport = document.getElementById('btn-export-csv');
        const btnCopy = document.getElementById('btn-copy-permanent');
        const btnImport = document.getElementById('btn-import-csv');
        const btnReset = document.getElementById('btn-reset-data');

        if (btnExport) btnExport.onclick = exportToCSV;
        if (btnCopy) btnCopy.onclick = copyPermanentData;
        if (btnImport) btnImport.onclick = () => csvUpload.click();
        if (btnReset) btnReset.onclick = resetData;
        if (csvUpload) csvUpload.onchange = handleImportCSV;

        // Target Configuration Event
        const targetInput = document.getElementById('monthly-target-input');
        if (targetInput) {
            targetInput.onchange = (e) => {
                const newTarget = parseInt(e.target.value);
                if (isNaN(newTarget) || newTarget <= 0) {
                    targetInput.value = billingData.target;
                    return;
                }
                billingData.target = newTarget;
                billingData.dailyTarget = Math.round(newTarget / 20);
                saveData();

                // Refresh all views
                loadMemberData(currentMemberId);
                const activeItem = document.querySelector('.nav-item.active');
                const viewId = activeItem ? activeItem.getAttribute('data-view') : 'resumen';
                if (viewId === 'cashapps') renderAnnualJobsView();
            };
        }
    }

    function initNavigation() {
        navItems.forEach(item => {
            item.onclick = () => {
                const viewId = item.getAttribute('data-view');
                if (!viewId) return; // For non-view buttons like export/import

                if (['resumen', 'riesgo', 'proyeccion', 'cashapps'].includes(viewId)) {
                    switchView(viewId);
                    navItems.forEach(i => i.classList.remove('active'));
                    item.classList.add('active');

                    // Refresh data for the specific view to ensure charts render correctly in visible container
                    const data = billingData.monthlyData[currentMemberId];
                    if (viewId === 'proyeccion') renderProyeccionView(data);
                    if (viewId === 'riesgo') renderRiesgoView(data);
                    if (viewId === 'cashapps') renderAnnualJobsView();
                }
            };
        });
    }

    function switchView(viewId) {
        viewContainers.forEach(vc => vc.classList.add('hidden'));
        const target = document.getElementById(`view-${viewId}`);
        if (target) target.classList.remove('hidden');
    }

    function renderTeamIcons() {
        teamNav.innerHTML = '';
        billingData.team.forEach(member => {
            const icon = document.createElement('div');
            icon.className = `team-icon ${member.id === currentMemberId ? 'active' : ''}`;
            icon.innerHTML = `<img src="${member.profileImg}" alt="${member.name}">`;
            icon.onclick = () => {
                currentMemberId = member.id;
                document.querySelectorAll('.team-icon').forEach(el => el.classList.remove('active'));
                icon.classList.add('active');
                loadMemberData(currentMemberId);
            };
            teamNav.appendChild(icon);
        });
    }

    function loadMemberData(id) {
        const member = billingData.team.find(m => m.id === id);
        const data = billingData.monthlyData[id];

        profilePic.src = member.profileImg;
        profileNameKpi.textContent = member.name;

        let totalActual = 0;
        let totalTarget = 0;
        let totalVariance = 0;
        let workingDaysSum = 0;

        monthGrid.innerHTML = '';
        historyBody.innerHTML = '';

        data.forEach((m) => {
            const variance = billingData.target - m.actual;
            const avgPerDay = m.workingDays > 0 ? (m.actual / m.workingDays) : 0;
            const rankingInfo = getRankingInfo(avgPerDay);
            const resVal = rankingInfo.percentage;
            const isSuccess = resVal >= 80;

            totalActual += m.actual;
            totalTarget += billingData.target;
            totalVariance += variance;
            workingDaysSum += m.workingDays;

            // Timeline Dots
            const dotWrapper = document.createElement('div');
            dotWrapper.className = 'month-item';
            dotWrapper.innerHTML = `
                <div class="status-dot ${isSuccess ? 'success' : 'fail'}">
                    ${isSuccess ? '✓' : '✕'}
                </div>
                <span class="month-label">${m.month.substring(0, 3)}</span>
            `;
            monthGrid.appendChild(dotWrapper);

            // Table Rows
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${m.month.toUpperCase()}</td>
                <td>${billingData.target}</td>
                <td>${m.actual}</td>
                <td style="color: ${variance > 0 ? 'var(--neon-red)' : 'var(--neon-green)'}">${variance}</td>
                <td>${Math.round(avgPerDay)}</td>
                <td>${m.holidays}</td>
                <td>${m.workingDays}</td>
                <td style="color: ${isSuccess ? 'var(--neon-green)' : 'var(--neon-red)'}; font-weight: bold;">${resVal}%</td>
            `;
            historyBody.appendChild(row);
        });

        // Totals Row
        const totalAvgPerDay = workingDaysSum > 0 ? (totalActual / workingDaysSum) : 0;
        const totalRanking = getRankingInfo(totalAvgPerDay);
        const totalResult = totalRanking.percentage;

        const totalsRow = document.createElement('tr');
        totalsRow.style.background = 'rgba(255,255,255,0.02)';
        totalsRow.style.fontWeight = '700';
        totalsRow.innerHTML = `
            <td>TOTAL</td>
            <td>${totalTarget}</td>
            <td>${totalActual}</td>
            <td>${totalVariance}</td>
            <td>${Math.round(totalAvgPerDay)}</td>
            <td>-</td>
            <td>-</td>
            <td style="color: ${totalRanking.color}; font-weight: bold;">${totalResult}%</td>
        `;
        historyBody.appendChild(totalsRow);

        const globalEfficiency = totalResult;

        // Efficiency Score Card
        efficiencyValue.textContent = globalEfficiency + '%';
        efficiencyText.textContent = totalRanking.label;
        efficiencyText.style.color = totalRanking.color;
        scoreMarker.style.left = `${Math.min(100, globalEfficiency)}%`;

        // Invoices / Day Card
        const avgPerDayValue = workingDaysSum > 0 ? (totalActual / workingDaysSum) : 0;
        const expectedDaily = billingData.dailyTarget || 41;
        const avgScore = Math.round((avgPerDayValue / expectedDaily) * 100);
        avgDayValue.textContent = Math.round(avgPerDayValue);
        const avgStatusObj = getStatusLabel(avgScore, 90, 60);
        avgDayStatus.textContent = avgStatusObj.label;
        avgDayStatus.style.color = avgStatusObj.color;
        avgDayMarker.style.left = `${Math.min(100, avgScore)}%`;

        // Total Variance Card
        const varScore = Math.max(0, 100 - Math.round((totalVariance / 2000) * 100));
        totalVarianceValue.textContent = totalVariance.toLocaleString();
        const varStatusObj = getStatusLabel(varScore, 80, 40);
        varianceStatus.textContent = varStatusObj.label;
        varianceStatus.style.color = varStatusObj.color;
        varianceMarker.style.left = `${Math.min(100, varScore)}%`;

        // Update charts
        updateCharts(data);

        // Update Ranking Legend
        renderRankingLegend();

        // Update Riesgo view
        renderRiesgoView(data);

        // Update Priority view
        renderProyeccionView(data);
    }

    function getRankingInfo(avgPerDay) {
        const expected = billingData.dailyTarget || 41;
        const percentage = Math.min(100, Math.round((avgPerDay / expected) * 100));

        if (avgPerDay >= expected) return { percentage, label: 'EXCELLENT', color: 'var(--neon-green)' };
        if (percentage >= 75) return { percentage, label: 'VERY GOOD', color: '#c5e0b4' };
        if (percentage >= 50) return { percentage, label: 'GOOD', color: '#ffee44' };
        if (percentage >= 25) return { percentage, label: 'CRITICAL', color: 'var(--neon-red)' };
        return { percentage, label: 'FAIL', color: '#555' };
    }

    function renderRankingLegend() {
        const expected = billingData.dailyTarget || 41;
        const vGood = Math.ceil(expected * 0.75);
        const good = Math.ceil(expected * 0.5);
        const crit = Math.ceil(expected * 0.25);

        const elExc = document.getElementById('legend-range-excellent');
        const elVGood = document.getElementById('legend-range-verygood');
        const elGood = document.getElementById('legend-range-good');
        const elCrit = document.getElementById('legend-range-critical');

        if (elExc) elExc.textContent = `≥ ${expected}`;
        if (elVGood) elVGood.textContent = `${vGood} - ${expected - 1}`;
        if (elGood) elGood.textContent = `${good} - ${vGood - 1}`;
        if (elCrit) elCrit.textContent = `${crit} - ${good - 1}`;
    }

    function getStatusLabel(val, high, mid) {
        if (val >= high) return { label: 'EXCELLENT', color: 'var(--neon-green)' };
        if (val >= mid) return { label: 'GOOD', color: '#ffee44' };
        return { label: 'CRITICAL', color: 'var(--neon-red)' };
    }

    function renderRiesgoView(data) {
        let totalIssues = 0;
        let pMonth = '-';
        let maxIssues = -1;
        let qualitySum = 0;
        if (riskHistoryBody) riskHistoryBody.innerHTML = '';

        data.forEach(m => {
            totalIssues += (m.issues || 0);
            if ((m.issues || 0) > maxIssues) {
                maxIssues = m.issues || 0;
                pMonth = m.month;
            }

            // Formula: Quality % = 100 - (issues * 100 / actual)
            const riskPct = m.actual > 0
                ? Math.max(0, Math.round(100 - ((m.issues || 0) * 100 / m.actual)))
                : 100;
            qualitySum += riskPct;

            const impact = (m.issues || 0) > 2 ? 'HIGH' : ((m.issues || 0) > 0 ? 'MEDIUM' : 'LOW');
            const status = riskPct >= 99 ? 'STABLE' : (riskPct >= 95 ? 'WATCH' : 'CRITICAL');
            const statusColor = riskPct >= 99 ? 'var(--neon-green)' : (riskPct >= 95 ? '#ffee44' : 'var(--neon-red)');

            if (riskHistoryBody) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${m.month.toUpperCase()}</td>
                    <td>${m.actual}</td>
                    <td>${m.issues || 0}</td>
                    <td>${riskPct}%</td>
                    <td style="color: ${statusColor}">${impact}</td>
                    <td style="font-weight: bold; color: ${statusColor}">${status}</td>
                `;
                riskHistoryBody.appendChild(row);
            }
        });

        // Risk KPIs — Quality Rate = avg(100 - issues*100/actual) across months
        const avgQuality = Math.round(qualitySum / data.length);
        if (riskLevelValue) riskLevelValue.textContent = avgQuality + '%';
        if (riskLevelStatus) {
            riskLevelStatus.textContent = avgQuality >= 99 ? 'EXCELLENT' : (avgQuality >= 95 ? 'GOOD' : 'CRITICAL');
            riskLevelStatus.style.color = avgQuality >= 99 ? 'var(--neon-green)' : (avgQuality >= 95 ? '#ffee44' : 'var(--neon-red)');
        }
        if (riskLevelMarker) riskLevelMarker.style.left = `${avgQuality}%`;

        if (totalIssuesValue) totalIssuesValue.textContent = totalIssues;
        if (totalIssuesMarker) totalIssuesMarker.style.left = `${Math.min(100, (totalIssues / 30) * 100)}%`;

        if (peakMonthValue) peakMonthValue.textContent = pMonth.substring(0, 3).toUpperCase();
        if (peakMonthStatus) peakMonthStatus.textContent = maxIssues + ' ISSUES';
        if (peakMonthMarker) peakMonthMarker.style.left = `${Math.min(100, (maxIssues / 5) * 100)}%`;

        updateRiskChart(data);
    }

    function renderProyeccionView(data) {
        const table = document.getElementById('priority-table');
        if (!table) return;

        let html = `<thead><tr><th>PRIORITY</th>`;
        data.forEach(m => {
            html += `<th>${m.month.toUpperCase()}</th>`;
        });
        html += `</tr></thead><tbody>`;

        // Row 1: TOTAL OBTAINED
        html += `<tr><td>TOTAL OBTAINED</td>`;
        let sumTotal = 0;
        data.forEach(m => {
            const base = m.jobsActual !== undefined ? m.jobsActual : m.actual;
            const pct = base > 0 ? ((m.b31_60 + m.b61_90 + m.b90) / base) * 100 : 0;
            const total = Math.round(Math.max(0, 100 - Math.max(0, pct - 11)));
            sumTotal += total;
            const color = total >= 99 ? 'var(--neon-green)' : (total >= 90 ? '#ffee44' : 'var(--neon-red)');
            html += `<td style="color:${color}; font-weight:bold;">${total}%</td>`;
        });
        const avgTotal = Math.round(sumTotal / data.length);
        html += `</tr>`;

        // Row 2: PERCENTAGE
        html += `<tr><td>PERCENTAGE</td>`;
        let sumPct = 0;
        data.forEach(m => {
            const base = m.jobsActual !== undefined ? m.jobsActual : m.actual;
            const pct = base > 0 ? ((m.b31_60 + m.b61_90 + m.b90) / base) * 100 : 0;
            sumPct += pct;
            html += `<td>${pct.toFixed(2)}%</td>`;
        });
        const avgPct = (sumPct / data.length).toFixed(1);
        html += `</tr>`;

        // Row 3.5: JOBS ACTUAL
        html += `<tr><td>JOBS ACTUAL</td>`;
        data.forEach(m => {
            const val = m.jobsActual !== undefined ? m.jobsActual : m.actual;
            html += `<td>${val}</td>`;
        });
        html += `</tr>`;

        // Row 4: 31-60
        html += `<tr><td>31-60</td>`;
        data.forEach(m => {
            html += `<td style="color:#ffee44">${m.b31_60}</td>`;
        });
        html += `</tr>`;

        // Row 5: 61-90
        html += `<tr><td>61-90</td>`;
        data.forEach(m => {
            html += `<td style="color:#ff8844">${m.b61_90}</td>`;
        });
        html += `</tr>`;

        // Row 6: +90
        html += `<tr><td>+90</td>`;
        data.forEach(m => {
            html += `<td style="color:var(--neon-red)">${m.b90}</td>`;
        });
        html += `</tr></tbody>`;

        table.innerHTML = html;

        // Update KPIs
        const avgPrioVal = document.getElementById('priority-avg-value');
        const avgPrioStatus = document.getElementById('priority-avg-status');
        const avgPrioMarker = document.getElementById('priority-avg-marker');
        if (avgPrioVal) avgPrioVal.textContent = avgTotal + '%';
        if (avgPrioStatus) {
            avgPrioStatus.textContent = avgTotal >= 95 ? 'EXCELLENT' : (avgTotal >= 85 ? 'GOOD' : 'CRITICAL');
            avgPrioStatus.style.color = avgTotal >= 95 ? 'var(--neon-green)' : (avgTotal >= 85 ? '#ffee44' : 'var(--neon-red)');
        }
        if (avgPrioMarker) avgPrioMarker.style.left = `${avgTotal}%`;

        const pendVal = document.getElementById('priority-pending-value');
        const pendMarker = document.getElementById('priority-pending-marker');
        if (pendVal) pendVal.textContent = avgPct + '%';
        if (pendMarker) pendMarker.style.left = `${Math.min(100, (parseFloat(avgPct) / 40) * 100)}%`;

        updatePriorityChart(data);
    }

    function renderAnnualJobsView() {
        const table = document.getElementById('annual-jobs-table');
        if (!table) return;

        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const teamTarget = billingData.target * billingData.team.length;

        // Helper for conditional coloring
        const getCellColor = (value, target) => {
            if (!value || value === 0) return 'inherit';
            const pct = (value / target) * 100;
            if (pct >= 100) return 'var(--neon-green)';
            if (pct >= 80) return '#ffee44'; // Yellow
            return 'var(--neon-red)';
        };

        let html = `<thead><tr><th>MEMBERS</th>`;
        months.forEach(m => html += `<th>${m.toUpperCase()}</th>`);
        html += `<th>TOTAL</th></tr></thead><tbody>`;

        const monthlyTotals = Array(12).fill(0);
        let grandTotal = 0;

        billingData.team.forEach(member => {
            const data = billingData.monthlyData[member.id];
            let memberTotal = 0;
            html += `<tr><td>${member.name}</td>`;
            months.forEach((m, idx) => {
                const val = data[idx] ? data[idx].actual : 0;
                memberTotal += val;
                monthlyTotals[idx] += val;
                const color = getCellColor(val, billingData.target);
                html += `<td style="color: ${color}">${val || '-'}</td>`;
            });
            const totalColor = getCellColor(memberTotal, billingData.target * 12);
            html += `<td style="font-weight:bold; color: ${totalColor}">${memberTotal}</td></tr>`;
            grandTotal += memberTotal;
        });

        // Summary Row
        html += `<tr style="background: rgba(59, 130, 246, 0.2); font-weight: bold;"><td>JOBS TOTAL</td>`;
        monthlyTotals.forEach(total => {
            const totalColor = getCellColor(total, teamTarget);
            html += `<td style="color: ${totalColor}">${total}</td>`;
        });
        const grandColor = getCellColor(grandTotal, teamTarget * 12);
        html += `<td style="color: ${grandColor}">${grandTotal}</td></tr>`;
        html += `</tbody>`;

        table.innerHTML = html;

        // Update KPIs based on last available month with data
        let lastMonthIdx = 0;
        for (let i = 11; i >= 0; i--) {
            if (monthlyTotals[i] > 0) {
                lastMonthIdx = i;
                break;
            }
        }

        const currentTotal = monthlyTotals[lastMonthIdx];
        const efficiency = Math.round((currentTotal / teamTarget) * 100);

        const effVal = document.getElementById('team-efficiency-value');
        const effStatus = document.getElementById('team-efficiency-status');
        const effMarker = document.getElementById('team-efficiency-marker');
        if (effVal) effVal.textContent = efficiency + '%';
        if (effStatus) {
            effStatus.textContent = efficiency >= 95 ? 'EXCELLENT' : (efficiency >= 85 ? 'GOOD' : 'CRITICAL');
            effStatus.style.color = efficiency >= 95 ? 'var(--neon-green)' : (efficiency >= 85 ? '#ffee44' : 'var(--neon-red)');
        }
        if (effMarker) effMarker.style.left = `${Math.min(100, efficiency)}%`;

        const monthVal = document.getElementById('team-monthly-value');
        const monthStatus = document.getElementById('team-monthly-status');
        const monthMarker = document.getElementById('team-monthly-marker');
        if (monthVal) monthVal.textContent = currentTotal.toLocaleString();
        if (monthStatus) monthStatus.textContent = `VS ${teamTarget.toLocaleString()} TARGET`;
        if (monthMarker) monthMarker.style.left = `${Math.min(100, (currentTotal / teamTarget) * 100)}%`;

        // Update Global Annual Goal Stat
        const globalGoalEl = document.getElementById('global-annual-goal');
        if (globalGoalEl) globalGoalEl.textContent = (teamTarget * 12).toLocaleString();

        updateAnnualJobsChart(monthlyTotals, teamTarget);
    }

    function updateAnnualJobsChart(monthlyTotals, teamTarget) {
        const canvas = document.getElementById('annualJobsChart');
        if (!canvas) return;
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        if (annualJobsChart) annualJobsChart.destroy();

        const ctx = canvas.getContext('2d');

        // Pro Gradient: Multi-stop for depth
        const areaGradient = ctx.createLinearGradient(0, 0, 0, 400);
        areaGradient.addColorStop(0, 'rgba(0, 242, 254, 0.4)');   // Neon Cyan
        areaGradient.addColorStop(0.4, 'rgba(79, 172, 254, 0.1)'); // Soft Azure
        areaGradient.addColorStop(1, 'rgba(13, 17, 23, 0)');     // Dark background merge

        const strokeGradient = ctx.createLinearGradient(0, 0, 400, 0);
        strokeGradient.addColorStop(0, '#00f2fe');
        strokeGradient.addColorStop(1, '#4facfe');

        annualJobsChart = new Chart(ctx, {
            type: 'line',
            plugins: [ChartDataLabels, {
                id: 'proLayoutV5',
                beforeDraw: (chart) => {
                    const { ctx, chartArea: { left, right }, scales: { y } } = chart;
                    const yPos = y.getPixelForValue(teamTarget);
                    if (isNaN(yPos)) return;
                    ctx.save();

                    // Essential Goal Line
                    ctx.strokeStyle = 'rgba(255, 68, 68, 0.45)';
                    ctx.setLineDash([8, 4]);
                    ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.moveTo(left, yPos); ctx.lineTo(right, yPos); ctx.stroke();

                    // Modern Goal Badge (Better offset)
                    const tagW = 92, tagH = 22;
                    const tagX = right - tagW - 10;
                    ctx.fillStyle = 'rgba(255, 68, 68, 0.9)';
                    const r = 11;
                    ctx.beginPath();
                    ctx.moveTo(tagX + r, yPos - tagH / 2); ctx.lineTo(tagX + tagW - r, yPos - tagH / 2);
                    ctx.quadraticCurveTo(tagX + tagW, yPos - tagH / 2, tagX + tagW, yPos - tagH / 2 + r);
                    ctx.lineTo(tagX + tagW, yPos + tagH / 2 - r);
                    ctx.quadraticCurveTo(tagX + tagW, yPos + tagH / 2, tagX + tagW - r, yPos + tagH / 2);
                    ctx.lineTo(tagX + r, yPos + tagH / 2); ctx.quadraticCurveTo(tagX, yPos + tagH / 2, tagX, yPos + tagH / 2 - r);
                    ctx.lineTo(tagX, yPos - tagH / 2 + r); ctx.quadraticCurveTo(tagX, yPos - tagH / 2, tagX + r, yPos - tagH / 2);
                    ctx.closePath(); ctx.fill();

                    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText(`GOAL: ${teamTarget}`, tagX + tagW / 2, yPos + 1);
                    ctx.restore();
                }
            }],
            data: {
                labels: months,
                datasets: [{
                    data: monthlyTotals,
                    borderColor: strokeGradient,
                    borderWidth: 6,
                    pointBackgroundColor: '#0d1117',
                    pointBorderColor: '#00f2fe',
                    pointBorderWidth: 4,
                    pointRadius: 6,
                    tension: 0.4,
                    fill: true,
                    backgroundColor: areaGradient,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { top: 50, bottom: 40, left: 20, right: 30 } },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true, backgroundColor: 'rgba(13, 17, 23, 0.95)', titleColor: '#00f2fe' },
                    datalabels: {
                        color: '#fff',
                        font: { weight: '800', size: 12, family: 'Inter' },
                        align: 'top',
                        offset: 12,
                        formatter: (v) => v > 0 ? v.toLocaleString() : '',
                        textShadowBlur: 10,
                        textShadowColor: 'rgba(0,0,0,0.8)'
                    }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#666', font: { size: 10, weight: '600' } } },
                    y: {
                        display: true,
                        grid: { color: 'rgba(255,255,255,0.02)', drawBorder: false },
                        ticks: { color: '#444', font: { size: 9 }, stepSize: 1000 },
                        min: 0,
                        suggestedMax: 6500
                    }
                },
                elements: {
                    line: { shadowBlur: 20, shadowColor: 'rgba(0, 242, 254, 0.4)' }
                }
            }
        });

        // Update Progress micro-KPI
        const totalYear = monthlyTotals.reduce((a, b) => a + b, 0);
        const targetYear = teamTarget * 12;
        const progress = Math.round((totalYear / targetYear) * 100);
        const progressEl = document.getElementById('annual-progress-pct');
        if (progressEl) progressEl.textContent = progress + '%';
    }

    function updatePriorityChart(data) {
        const canvas = document.getElementById('priorityChart');
        if (!canvas) return;
        const labels = data.map(m => m.month.substring(0, 3));

        const b31 = data.map(m => m.b31_60);
        const b61 = data.map(m => m.b61_90);
        const b90 = data.map(m => m.b90);

        if (priorityChart) priorityChart.destroy();

        const ctx = canvas.getContext('2d');
        priorityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: '31-60', data: b31, backgroundColor: 'rgba(255, 238, 68, 0.6)', borderRadius: 4 },
                    { label: '61-90', data: b61, backgroundColor: 'rgba(255, 136, 68, 0.6)', borderRadius: 4 },
                    { label: '+90', data: b90, backgroundColor: 'rgba(255, 68, 68, 0.6)', borderRadius: 4 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { stacked: true, grid: { display: false }, ticks: { color: '#666' } },
                    y: { stacked: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#666' } }
                },
                plugins: {
                    legend: { display: true, position: 'top', labels: { color: '#aaa', boxWidth: 12 } }
                }
            }
        });
    }

    function updateRiskChart(data) {
        const canvas = document.getElementById('riskTrendChart');
        if (!canvas) return;
        const labels = data.map(m => m.month.substring(0, 3));
        const fullLabels = data.map(m => m.month);
        const qualityByMonth = data.map(m =>
            m.actual > 0 ? Math.max(0, Math.round(100 - ((m.issues || 0) * 100 / m.actual))) : 100
        );
        const baseColors = qualityByMonth.map(q =>
            q >= 99 ? 'rgba(0,255,136,0.55)' : (q >= 95 ? 'rgba(255,238,68,0.55)' : 'rgba(255,68,68,0.55)'));
        const borderColors = qualityByMonth.map(q =>
            q >= 99 ? '#00ff88' : (q >= 95 ? '#ffee44' : '#ff4444'));
        const hoverColors = qualityByMonth.map(q =>
            q >= 99 ? 'rgba(0,255,136,0.9)' : (q >= 95 ? 'rgba(255,238,68,0.9)' : 'rgba(255,68,68,0.9)'));

        if (riskTrendChart) riskTrendChart.destroy();

        const ctx = canvas.getContext('2d');

        // Create professional gradients for bars
        const getGradient = (color) => {
            const g = ctx.createLinearGradient(0, 0, 0, 300);
            g.addColorStop(0, color.replace('1)', '0.4)'));
            g.addColorStop(1, color.replace('1)', '0.05)'));
            return g;
        };

        const barGradients = borderColors.map(c => getGradient(c));

        riskTrendChart = new Chart(ctx, {
            type: 'bar',
            plugins: [ChartDataLabels],
            data: {
                labels: labels,
                datasets: [{
                    data: qualityByMonth,
                    backgroundColor: barGradients,
                    hoverBackgroundColor: borderColors,
                    borderColor: borderColors,
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                    barPercentage: 0.85,
                    categoryPercentage: 0.95
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { top: 40, bottom: 10, left: 10, right: 10 } },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(13, 17, 23, 0.95)',
                        titleColor: '#fff',
                        titleFont: { size: 14, weight: 'bold' },
                        bodyColor: '#fff',
                        bodyFont: { size: 13 },
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        padding: 15,
                        displayColors: false,
                        cornerRadius: 8,
                        callbacks: {
                            label: (item) => {
                                const idx = item.dataIndex;
                                const m = data[idx];
                                return [
                                    `Quality: ${qualityByMonth[idx]}%`,
                                    `Issues: ${m.issues || 0}`,
                                    `Billing: ${m.actual.toLocaleString()}`
                                ];
                            }
                        }
                    },
                    datalabels: {
                        color: '#fff',
                        anchor: 'end',
                        align: 'top',
                        offset: 5,
                        font: { weight: '700', size: 11, family: 'Inter' },
                        formatter: (value) => value + '%',
                        textShadowBlur: 8,
                        textShadowColor: 'rgba(0,0,0,1)'
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#8b949e', font: { size: 10 } }
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
                        min: 80,
                        max: 100,
                        ticks: { color: '#484f58', font: { size: 10 }, stepSize: 5, callback: v => v + '%' }
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length === 0) return;
                    const idx = elements[0].index;
                    const m = data[idx];
                    const q = qualityByMonth[idx];
                    const color = q >= 99 ? '#00ff88' : (q >= 95 ? '#ffee44' : '#ff4444');
                    const panel = document.getElementById('riesgo-detail-panel');
                    if (!panel) return;
                    panel.style.borderColor = color;
                    panel.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.06); margin-bottom:1.2rem;">
                            <h4 style="font-weight:300; font-size:1rem; letter-spacing:0.08em;">${m.month.toUpperCase()} <span style="color:${color}">/ DETAIL</span></h4>
                            <span style="font-size:1.5rem; font-weight:200; color:${color}; letter-spacing:0.05em;">${q}% QUALITY</span>
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:2.5rem; text-align:center;">
                            <div>
                                <div style="font-size:2rem; font-weight:200; letter-spacing:0.04em;">${m.actual.toLocaleString()}</div>
                                <div style="font-size:0.7rem; color:#555; text-transform:uppercase; margin-top:0.4rem; letter-spacing:0.1em;">Billing</div>
                            </div>
                            <div>
                                <div style="font-size:2rem; font-weight:200; color:${color}; letter-spacing:0.04em;">${m.issues || 0}</div>
                                <div style="font-size:0.7rem; color:#555; text-transform:uppercase; margin-top:0.4rem; letter-spacing:0.1em;">Issues / Errors</div>
                            </div>
                            <div>
                                <div style="font-size:2rem; font-weight:200; color:${color}; letter-spacing:0.04em;">${q}%</div>
                                <div style="font-size:0.7rem; color:#555; text-transform:uppercase; margin-top:0.4rem; letter-spacing:0.1em;">Quality Rate</div>
                            </div>
                        </div>
                    `;
                    panel.style.opacity = '1';
                    panel.style.transform = 'translateY(0)';
                }
            }
        });
    }

    function updateCharts(data) {
        const labels = data.map(m => m.month.substring(0, 3));
        const actuals = data.map(m => m.actual);

        if (trendChart) trendChart.destroy();

        const ctx = document.getElementById('trendChart').getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, 'rgba(0, 255, 136, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 255, 136, 0)');

        trendChart = new Chart(ctx, {
            type: 'line',
            plugins: [ChartDataLabels],
            data: {
                labels: labels,
                datasets: [{
                    data: actuals,
                    borderColor: '#00ff88',
                    borderWidth: 2,
                    pointBackgroundColor: '#00ff88',
                    pointBorderColor: '#000',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    tension: 0.4,
                    fill: true,
                    backgroundColor: gradient
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        color: '#fff',
                        align: 'top',
                        offset: 5,
                        font: { size: 10, weight: 'bold' },
                        formatter: (value) => value
                    }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#666' } },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#666', stepSize: 200 }
                    }
                }
            }
        });
    }

    function exportToCSV() {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        let csv = "MemberID,MemberName,Month,JOBS RATED,JOBS ACTUAL,Target,b31_60,b61_90,b90,quality,issues,Holidays,Active Days\n";

        billingData.team.forEach(member => {
            const data = billingData.monthlyData[member.id];
            months.forEach((month, idx) => {
                const row = (data && data[idx]) ? data[idx] : {};
                const jRated = row.actual || 0;
                const jActual = row.jobsActual !== undefined ? row.jobsActual : jRated;
                csv += `${member.id},${member.name},${month},${jRated},${jActual},${row.target || 0},${row.b31_60 || 0},${row.b61_90 || 0},${row.b90 || 0},${row.quality || 100},${row.issues || 0},${row.holidays || 0},${row.workingDays || 0}\n`;
            });
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `billing_data_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function handleImportCSV(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (event) {
            const text = event.target.result;
            const lines = text.split('\n');
            const newMonthlyData = JSON.parse(JSON.stringify(billingData.monthlyData));
            let foundTarget = false;

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const parts = line.split(',');
                if (parts.length < 11) continue;

                const memberId = parts[0];
                const monthName = parts[2];
                const actual = parseInt(parts[3]) || 0;
                const jobsActual = parseInt(parts[4]) || 0;
                const targetValue = parseInt(parts[5]) || 0;
                const b31_60 = parseInt(parts[6]) || 0;
                const b61_90 = parseInt(parts[7]) || 0;
                const b90 = parseInt(parts[8]) || 0;
                const quality = parseFloat(parts[9]) || 100;
                const issues = parseInt(parts[10]) || 0;
                const holidays = parseInt(parts[11]) || 0;
                const workingDays = parseInt(parts[12]) || 0;

                // Update global target from the first valid value found
                if (!foundTarget && targetValue > 0) {
                    billingData.target = targetValue;
                    billingData.dailyTarget = Math.round(targetValue / 20);
                    foundTarget = true;
                    // Update UI input as well
                    const targetInput = document.getElementById('monthly-target-input');
                    if (targetInput) targetInput.value = targetValue;
                }

                const monthIdx = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].indexOf(monthName);

                if (newMonthlyData[memberId] && monthIdx !== -1) {
                    newMonthlyData[memberId][monthIdx] = {
                        month: monthName,
                        actual, jobsActual, target: targetValue, b31_60, b61_90, b90, quality, issues, holidays, workingDays
                    };
                }
            }

            billingData.monthlyData = newMonthlyData;
            saveData();

            // Refresh current view
            const activeItem = document.querySelector('.nav-item.active');
            const activeView = activeItem ? activeItem.getAttribute('data-view') : 'resumen';

            loadMemberData(currentMemberId); // Global refresh of baseline data

            if (activeView === 'riesgo') renderRiesgoView(billingData.monthlyData[currentMemberId]);
            else if (activeView === 'proyeccion') renderProyeccionView(billingData.monthlyData[currentMemberId]);
            else if (activeView === 'cashapps') renderAnnualJobsView();

            alert("✓ Data updated successfully! The dashboard is now reflecting the new information and it will be persisted.");
        };
        reader.readAsText(file);
    }

    function copyPermanentData() {
        // Prepare the content for data.js
        const content = `const billingData = ${JSON.stringify(billingData, null, 4)};\n\nif (typeof module !== 'undefined') {\n    module.exports = billingData;\n}`;

        navigator.clipboard.writeText(content).then(() => {
            alert("✓ Data copied! \n\nNow open 'data.js', replace everything with what's on your clipboard, and save. \n\nThen upload the new 'data.js' to Netlify.");
        }).catch(err => {
            console.error('Error copying to clipboard: ', err);
            // Fallback for browsers that don't support navigator.clipboard
            const textarea = document.createElement('textarea');
            textarea.value = content;
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                alert("✓ Data copied (fallback)! \n\nNow open 'data.js', replace everything with what's on your clipboard, and save.");
            } catch (copyErr) {
                alert("Could not copy data automatically. Check console for details.");
            }
            document.body.removeChild(textarea);
        });
    } init();
});