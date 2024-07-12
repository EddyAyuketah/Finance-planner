// script.js

const PIN = '0000';
const TAX_RATE = 0.1438;
const FICA_RATE = 0.0765;
const PAY_PERIOD = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds
let nextPayDate = new Date(2024, 6, 19); // Adjusted to the next Friday after July 15, 2024
let spendingChart;


const API_KEY = 'myapikey'

function checkPin() {
    const pinInput = document.getElementById('pin').value;
    if (pinInput === PIN) {
        document.getElementById('pin-container').style.display = 'none';
        document.getElementById('app').style.display = 'block';
    } else {
        document.getElementById('pin-message').textContent = 'You do not have access';
    }
}

function calculate() {
    const biweeklyPay = parseFloat(document.getElementById('biweekly-pay').value);
    const hysaPercentage = parseFloat(document.getElementById('hysa-percentage').value) / 100;
    const monthlySavingsGoal = parseFloat(document.getElementById('monthly-savings-goal').value);

    // Calculate taxes
    const taxAmount = biweeklyPay * TAX_RATE;
    const ficaAmount = biweeklyPay * FICA_RATE;
    const totalTaxes = taxAmount + ficaAmount;

    // Calculate net pay after taxes
    const netPay = biweeklyPay - totalTaxes;

    // Calculate HYSA contribution
    const hysaContribution = netPay * hysaPercentage;
    const netPayAfterHYSA = netPay - hysaContribution;

    // Calculate total bills
    const bills = document.querySelectorAll('.bill');
    let totalBills = 0;
    bills.forEach(bill => {
        const amount = parseFloat(bill.querySelector('.bill-amount').value);
        if (!isNaN(amount)) {
            totalBills += amount;
        }
    });

    // Calculate remaining income
    const remainingMonthly = (netPayAfterHYSA - totalBills) * 2;
    const hysaTotal = hysaContribution * 12;

    const savingsGoalStatus = remainingMonthly >= monthlySavingsGoal ? 'Savings goal achieved!' : 'Savings goal not achieved.';
    const savingsGoalClass = remainingMonthly >= monthlySavingsGoal ? 'achieved' : 'not-achieved';

    // Update results
    document.getElementById('taxes-info').textContent = `Total Taxes (14.38% + 7.65%): $${totalTaxes.toFixed(2)}`;
    document.getElementById('net-pay-per-check').textContent = `Net Pay Per Paycheck: $${netPay.toFixed(2)}`;
    document.getElementById('hysa-contribution').textContent = `HYSA Contribution: $${hysaContribution.toFixed(2)}`;
    document.getElementById('total-bills').textContent = `Total Bills: $${totalBills.toFixed(2)}`;
    document.getElementById('remaining-monthly').textContent = `Remaining Monthly after Bills: $${remainingMonthly.toFixed(2)}`;
    const savingsGoalElement = document.getElementById('savings-goal-status');
    savingsGoalElement.textContent = savingsGoalStatus;
    savingsGoalElement.className = savingsGoalClass;

    updateSpendingChart();
}

function updateCountdown() {
    const now = new Date();
    const timeUntilPaycheck = nextPayDate.getTime() - now.getTime();

    if (timeUntilPaycheck < 0) {
        nextPayDate.setTime(nextPayDate.getTime() + PAY_PERIOD);
    }

    const days = Math.floor(timeUntilPaycheck / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeUntilPaycheck % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntilPaycheck % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeUntilPaycheck % (1000 * 60)) / 1000);

    document.getElementById('time-until-paycheck').textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    setTimeout(updateCountdown, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    updateCountdown();
    setInterval(fetchInvestmentTip, 120000); // Fetch a new tip every 2 minutes
});

function addBill() {
    const billsList = document.getElementById('bills-list');
    const billDiv = document.createElement('div');
    billDiv.classList.add('bill');

    billDiv.innerHTML = `
        <label>Bill Name: <input type="text" class="bill-name" required></label>
        <label>Bill Amount: <input type="number" class="bill-amount" required></label>
        <button type="button" onclick="removeBill(this)">Remove</button>
    `;

    billsList.appendChild(billDiv);
    updateDashboard();
}

function removeBill(button) {
    const billDiv = button.parentElement;
    billDiv.remove();
    updateDashboard();
}

function updateDashboard() {
    const bills = document.querySelectorAll('.bill');
    const billsSummary = document.getElementById('bills-summary');
    billsSummary.innerHTML = '';

    let totalBills = 0;
    bills.forEach(bill => {
        const name = bill.querySelector('.bill-name').value;
        const amount = parseFloat(bill.querySelector('.bill-amount').value);
        if (!isNaN(amount)) {
            const li = document.createElement('li');
            li.textContent = `${name}: $${amount.toFixed(2)}`;
            billsSummary.appendChild(li);
            totalBills += amount;
        }
    });

    document.getElementById('total-monthly-bills').textContent = `Total Monthly Bills: $${totalBills.toFixed(2)}`;
}

function refreshPage() {
    document.getElementById('income-form').reset();
    document.getElementById('bills-form').reset();
    document.getElementById('savings-form').reset();
    document.getElementById('results-display').innerHTML = '';
    document.getElementById('bills-summary').innerHTML = '';
    document.getElementById('total-monthly-bills').textContent = 'Total Monthly Bills: $0.00';
    document.getElementById('spending-chart').getContext('2d').clearRect(0, 0, 400, 400);
    if (spendingChart) {
        spendingChart.destroy();
    }
    localStorage.clear();
}

function logOut() {
    const popup = document.getElementById('logout-popup');
    popup.style.display = 'flex';
}

function closePopup() {
    const popup = document.getElementById('logout-popup');
    popup.style.display = 'none';
    document.getElementById('app').style.display = 'none';
    document.getElementById('pin-container').style.display = 'block';
}

function updateSpendingChart() {
    const bills = document.querySelectorAll('.bill');
    const labels = [];
    const data = [];

    bills.forEach(bill => {
        const name = bill.querySelector('.bill-name').value;
        const amount = parseFloat(bill.querySelector('.bill-amount').value);
        if (!isNaN(amount)) {
            labels.push(name);
            data.push(amount);
        }
    });

    const ctx = document.getElementById('spending-chart').getContext('2d');
    if (spendingChart) {
        spendingChart.destroy();
    }
    spendingChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#ff6384', '#36a2eb', '#cc65fe', '#ffce56', '#ff9f40', '#ffcd56']
            }]
        }
    });
}

async function fetchInvestmentTip() {
    const response = await fetch(`https://financialmodelingprep.com/api/v3/investment_tips?apikey=${API_KEY}`);
    const data = await response.json();

    if (data && data.length > 0) {
        const randomTip = data[Math.floor(Math.random() * data.length)];
        document.getElementById('tip-message').textContent = `Investment Tip: ${randomTip.tip}`;
    }
}
