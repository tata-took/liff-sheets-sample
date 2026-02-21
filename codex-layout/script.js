const START = 7 * 60; // 7:00 = 420
const END = 25 * 60; // 翌1:00
const INTERVAL = 15;
const TOTAL_CELLS = (END - START) / INTERVAL; // 72

const employees = [
  { name: '田中', shiftStartMinutes: 7 * 60, shiftEndMinutes: 11 * 60 + 30 },
  { name: '鈴木', shiftStartMinutes: 9 * 60 + 15, shiftEndMinutes: 14 * 60 },
  { name: '佐藤', shiftStartMinutes: 13 * 60, shiftEndMinutes: 18 * 60 + 45 },
  { name: '高橋', shiftStartMinutes: 21 * 60, shiftEndMinutes: 24 * 60 }
];

const shiftGrid = document.getElementById('shiftGrid');

function cellIndex(minutes) {
  return Math.floor((minutes - START) / INTERVAL);
}

function formatHeader(minutes) {
  const hour = Math.floor((minutes / 60) % 24);
  const minute = minutes % 60;
  return `${hour}:${String(minute).padStart(2, '0')}`;
}

function createCell(className, text = '') {
  const cell = document.createElement('div');
  cell.className = `cell ${className}`;
  cell.textContent = text;
  return cell;
}

function renderHeaderRow() {
  const row = document.createElement('div');
  row.className = 'grid-row';

  row.appendChild(createCell('name-cell header-cell', '氏名'));

  for (let i = 0; i < TOTAL_CELLS; i += 1) {
    const currentMinutes = START + i * INTERVAL;
    const isHour = currentMinutes % 60 === 0;
    const label = currentMinutes % 60 === 0 ? formatHeader(currentMinutes) : '';
    const header = createCell(`header-cell time-cell ${isHour ? 'hour-boundary' : ''}`, label);
    row.appendChild(header);
  }

  shiftGrid.appendChild(row);
}

function renderBodyRows() {
  employees.forEach((employee) => {
    const row = document.createElement('div');
    row.className = 'grid-row';

    row.appendChild(createCell('name-cell', employee.name));

    const startIndex = cellIndex(employee.shiftStartMinutes);
    const endIndex = cellIndex(employee.shiftEndMinutes);

    for (let i = 0; i < TOTAL_CELLS; i += 1) {
      const currentMinutes = START + i * INTERVAL;
      const isHour = currentMinutes % 60 === 0;
      const bodyCell = createCell(`time-cell ${isHour ? 'hour-boundary' : ''}`);

      if (i >= startIndex && i < endIndex) {
        bodyCell.classList.add('shift-fill');
      }

      row.appendChild(bodyCell);
    }

    shiftGrid.appendChild(row);
  });
}

renderHeaderRow();
renderBodyRows();
