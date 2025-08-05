document.addEventListener('DOMContentLoaded', function () {
    const csvFilePath = 'customers-100.csv';
    let originalData = [];
    let subscriptionsChart, countryChart;

    // --- Chart Options (ApexCharts) ---
    const commonChartOptions = {
        chart: {
            fontFamily: 'Inter, sans-serif',
            toolbar: { show: true },
        },
        colors: ['#4f46e5', '#7c3aed'],
        dataLabels: { enabled: false },
    };

    const subscriptionsChartOptions = {
        ...commonChartOptions,
        chart: { ...commonChartOptions.chart, type: 'area', height: 350 },
        stroke: { curve: 'smooth', width: 2 },
        xaxis: { type: 'datetime' },
        tooltip: { x: { format: 'MMM yyyy' } },
    };

    const countryChartOptions = {
        ...commonChartOptions,
        chart: { ...commonChartOptions.chart, type: 'bar', height: 350 },
        plotOptions: { bar: { horizontal: true, barHeight: '70%' } },
        xaxis: { labels: { show: false } },
        yaxis: { labels: { style: { colors: '#374151', fontSize: '12px' } } },
    };

    // --- Main Data Loading Function ---
    function loadData() {
        d3.csv(csvFilePath).then(data => {
            const parseDate = d3.timeParse("%Y-%m-%d");
            data.forEach(d => {
                d.subscriptionDate = parseDate(d['Subscription Date']);
                d.fullName = `${d['First Name']} ${d['Last Name']}`;
            });
            originalData = data;
            
            populateCountryFilter(originalData);
            initializeCharts();
            updateDashboard(originalData);
        }).catch(error => {
            console.error('Error loading CSV:', error);
            alert('Could not load data file.');
        });
    }

    // --- Initialize Charts ---
    function initializeCharts() {
        subscriptionsChart = new ApexCharts(document.querySelector("#subscriptions-chart"), { ...subscriptionsChartOptions, series: [] });
        countryChart = new ApexCharts(document.querySelector("#country-chart"), { ...countryChartOptions, series: [] });
        subscriptionsChart.render();
        countryChart.render();
    }

    // --- Update Dashboard ---
    function updateDashboard(data) {
        // 1. Update KPIs
        document.getElementById('total-customers').textContent = data.length;
        const uniqueCountries = new Set(data.map(d => d.Country)).size;
        document.getElementById('unique-countries').textContent = uniqueCountries;
        
        const subsByMonth = d3.rollup(data, v => v.length, d => d3.timeFormat("%Y-%m")(d.subscriptionDate));
        const avgSubsMonth = d3.mean(Array.from(subsByMonth.values())) || 0;
        document.getElementById('avg-subs-month').textContent = avgSubsMonth.toFixed(1);

        // 2. Update Charts
        updateCharts(data);

        // 3. Update Table
        populateTable(data);
    }

    // --- Update Chart Data ---
    function updateCharts(data) {
        // Subscriptions over time
        const subsOverTime = d3.rollup(data, v => v.length, d => d3.timeFormat("%Y-%m-01")(d.subscriptionDate));
        const sortedSubs = Array.from(subsOverTime.entries()).sort();
        subscriptionsChart.updateSeries([{
            name: 'Subscriptions',
            data: sortedSubs.map(([date, count]) => [new Date(date).getTime(), count])
        }]);

        // Customers by country
        const customersByCountry = d3.rollup(data, v => v.length, d => d.Country);
        const sortedCountries = Array.from(customersByCountry.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
        countryChart.updateOptions({
            series: [{ name: 'Customers', data: sortedCountries.map(d => d[1]) }],
            xaxis: { categories: sortedCountries.map(d => d[0]) }
        });
    }

    // --- Populate Table ---
    function populateTable(data) {
        const tableBody = document.getElementById('customer-table-body');
        tableBody.innerHTML = ''; // Clear table
        const rows = data.slice(0, 50).map(d => `
            <tr class="bg-white border-b hover:bg-gray-50">
                <td class="px-6 py-4 font-medium text-gray-900">${d['Customer Id']}</td>
                <td class="px-6 py-4">${d.fullName}</td>
                <td class="px-6 py-4">${d.Company}</td>
                <td class="px-6 py-4">${d.Country}</td>
                <td class="px-6 py-4">${d3.timeFormat("%b %d, %Y")(d.subscriptionDate)}</td>
            </tr>
        `).join('');
        tableBody.innerHTML = rows;
    }

    // --- Populate Filters ---
    function populateCountryFilter(data) {
        const countryFilter = document.getElementById('countryFilter');
        const countries = [...new Set(data.map(d => d.Country))].sort();
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            countryFilter.appendChild(option);
        });
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        const countryFilter = document.getElementById('countryFilter');

        function applyFilters() {
            const searchTerm = searchInput.value.toLowerCase();
            const selectedCountry = countryFilter.value;

            let filteredData = originalData;

            if (selectedCountry !== 'all') {
                filteredData = filteredData.filter(d => d.Country === selectedCountry);
            }

            if (searchTerm) {
                filteredData = filteredData.filter(d =>
                    Object.values(d).some(val =>
                        String(val).toLowerCase().includes(searchTerm)
                    )
                );
            }
            updateDashboard(filteredData);
        }

        searchInput.addEventListener('keyup', applyFilters);
        countryFilter.addEventListener('change', applyFilters);
        
        // Mock file upload
        document.getElementById('file-upload').addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                document.getElementById('fileName').innerHTML = `Loaded: <strong>${file.name}</strong>`;
                // In a real scenario, you would parse this file. Here we just reload the default.
                alert(`Simulating load of ${file.name}. Displaying default data.`);
                loadData();
            }
        });
    }

    // --- Initial Load ---
    loadData();
    setupEventListeners();
});