import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// YYYY-MM-DD → 民國YYY年MM月DD日
const toROCDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const rocYear = parseInt(y) - 1911;
    return `${rocYear}年${parseInt(m)}月${parseInt(d)}日`;
};

/**
 * 派車單里程.xlsx 匯出（使用 exceljs 保留原始格式）
 *
 * 規則：
 * - 依日期+使用人分組，每組一份 xlsx
 * - 左欄：目的地 B9→B19, 結束里程 D9→D19 (共11筆)
 * - 右欄：目的地 G8→G19, 結束里程 I8→I19 (共12筆)
 * - 駕駛人名 → I5
 * - 用車時間 → C4（日期，民國年）
 * - 當日出發里程 → D8
 * - 加油資料：加油日期 → A23（民國年）, 公升數 → E23, 加油時里程 → I23
 */

export async function exportDispatch(records, templateUrl) {
    // Group records by date + user
    const groups = {};
    records.forEach((r) => {
        const key = `${r.date}_${r.user}`;
        if (!groups[key]) {
            groups[key] = { date: r.date, user: r.user, items: [] };
        }
        groups[key].items.push(r);
    });

    // Fetch template as ArrayBuffer
    const response = await fetch(templateUrl);
    const templateBuffer = await response.arrayBuffer();

    const files = [];

    for (const key of Object.keys(groups)) {
        const group = groups[key];

        // Load template with exceljs (preserves formatting)
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(templateBuffer);
        const ws = wb.getWorksheet(1);

        const items = group.items;

        // C2: 事由（取該組第一筆的事由）
        if (items.length > 0 && items[0].reason) {
            ws.getCell('C2').value = items[0].reason;
        }

        // C4: 用車時間（日期，民國年格式）
        ws.getCell('C4').value = toROCDate(group.date);

        // D8: 當日出發里程（第一筆的出發里程）
        if (items.length > 0) {
            ws.getCell('D8').value = items[0].startKm;
        }

        // I5: 駕駛人姓名
        ws.getCell('I5').value = group.user;

        // Left column: B9~B19, D9~D19 (max 11 items)
        const leftStart = 9;
        const leftEnd = 19;
        const leftMax = leftEnd - leftStart + 1; // 11

        // Right column: G8~G19, I8~I19 (max 12 items)
        const rightStart = 8;
        const rightEnd = 19;

        // Track if any item has fuel data
        let hasFuel = false;
        let fuelItem = null;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            if (i < leftMax) {
                // Left column
                const row = leftStart + i;
                ws.getCell(`B${row}`).value = item.destination;
                ws.getCell(`D${row}`).value = item.endKm;
            } else {
                // Right column
                const rightIndex = i - leftMax;
                const row = rightStart + rightIndex;
                if (row > rightEnd) break;
                ws.getCell(`G${row}`).value = item.destination;
                ws.getCell(`I${row}`).value = item.endKm;
            }

            // Check for fuel data
            if (item.fuelLiters && item.currentFuelKm) {
                hasFuel = true;
                fuelItem = item;
            }
        }

        // A23: 加油日期（民國年）, E23: 公升數, I23: 加油時里程
        if (hasFuel && fuelItem) {
            ws.getCell('A23').value = toROCDate(fuelItem.date);
            ws.getCell('E23').value = fuelItem.fuelLiters;
            ws.getCell('I23').value = fuelItem.currentFuelKm;
        }

        // Generate file
        const buffer = await wb.xlsx.writeBuffer();
        const filename = `派車單里程_${group.date}_${group.user}.xlsx`;
        files.push({ filename, data: buffer });
    }

    // Download all files
    files.forEach(({ filename, data }) => {
        const blob = new Blob([data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        saveAs(blob, filename);
    });

    return files.length;
}
