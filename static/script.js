let n = 5;
let gridStatus = [];
let startSet = false, endSet = false;
let obstacleCount = 0;
let maxObstacle = 3; // 預設 5x5

// 初始化格子
function initGrid(size) {
    n = size;
    maxObstacle = n - 2;  // 隨著 n 動態調整最大障礙數量
    obstacleCount = 0;
    startSet = false;
    endSet = false;
    gridStatus = Array.from({ length: n }, () => Array(n).fill(0));
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    for (let i = 0; i < n; i++) {
        const row = document.createElement('tr');
        for (let j = 0; j < n; j++) {
            const cell = document.createElement('td');
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.onclick = () => handleClick(cell);
            row.appendChild(cell);
        }
        grid.appendChild(row);
    }
    document.getElementById('policy-matrix').innerHTML = '';
    document.getElementById('value-matrix').innerHTML = '';
    updateObstacleCounter();  // 更新障礙顯示
}

// 更新障礙物剩餘數量顯示 (英文)
function updateObstacleCounter() {
    document.getElementById('obstacle-counter').innerText = `Remaining Obstacles: ${obstacleCount} / ${maxObstacle}`;
}

// 點擊格子
function handleClick(cell) {
    const i = cell.dataset.row;
    const j = cell.dataset.col;
    if (gridStatus[i][j] === 0) {
        if (!startSet) {
            gridStatus[i][j] = 1;
            cell.className = 'start';
            startSet = true;
        } else if (!endSet) {
            gridStatus[i][j] = 2;
            cell.className = 'end';
            endSet = true;
        } else if (obstacleCount < maxObstacle) {
            gridStatus[i][j] = 3;
            cell.className = 'obstacle';
            obstacleCount++;
            updateObstacleCounter();  // 每次新增障礙更新顯示
        } else {
            alert(`⚠️ Maximum number of obstacles reached: ${maxObstacle}`);
        }
    } else {
        // 點擊移除格子狀態
        if (gridStatus[i][j] === 1) startSet = false;
        if (gridStatus[i][j] === 2) endSet = false;
        if (gridStatus[i][j] === 3) {
            obstacleCount--;  // 移除障礙物
            updateObstacleCounter();  // 更新顯示
        }
        gridStatus[i][j] = 0;
        cell.className = '';
    }
}

// 重置
function resetGrid() {
    startSet = false;
    endSet = false;
    obstacleCount = 0;
    initGrid(n);
}

// 產生策略與價值（檢查起點終點）
function generatePolicyValue() {
    let hasStart = false, hasEnd = false;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (gridStatus[i][j] === 1) hasStart = true;
            if (gridStatus[i][j] === 2) hasEnd = true;
        }
    }
    if (!hasStart || !hasEnd) {
        alert("⚠️ Please set both a start point and an end point!");
        return;
    }

    fetch('/generate_policy_value', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ n, grid_status: gridStatus })
    })
    .then(response => response.json())
    .then(data => {
        displayPolicyMatrix(data.policy);
        displayValueMatrix(data.value);
    });
}

// 顯示策略矩陣
function displayPolicyMatrix(policy) {
    const table = document.getElementById('policy-matrix');
    table.innerHTML = '';
    for (let i = 0; i < n; i++) {
        const row = document.createElement('tr');
        for (let j = 0; j < n; j++) {
            const cell = document.createElement('td');
            if (gridStatus[i][j] === 3) cell.className = 'obstacle';
            if (gridStatus[i][j] === 2) cell.className = 'end'; // 終點空白
            if (gridStatus[i][j] === 0 || gridStatus[i][j] === 1) cell.innerText = policy[i][j];
            row.appendChild(cell);
        }
        table.appendChild(row);
    }
}

// 顯示價值矩陣 (終點只顯示 0，不給紅色)
function displayValueMatrix(value) {
    const table = document.getElementById('value-matrix');
    table.innerHTML = '';
    for (let i = 0; i < n; i++) {
        const row = document.createElement('tr');
        for (let j = 0; j < n; j++) {
            const cell = document.createElement('td');
            if (gridStatus[i][j] === 3) cell.className = 'obstacle';
            if (gridStatus[i][j] === 2) {
                cell.innerText = '0';  // 只顯示 0 不給背景
            }
            if (gridStatus[i][j] === 0 || gridStatus[i][j] === 1) cell.innerText = value[i][j];
            row.appendChild(cell);
        }
        table.appendChild(row);
    }
}

window.onload = () => initGrid(n);