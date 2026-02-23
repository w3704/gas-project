import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * 消耗油料登記表.xlsx 匯出（使用 exceljs 保留原始格式）
 *
 * 邏輯更新：資料來源改為已處理的派車單里程 records
 * 先匯出派車單里程，再由派車單里程的 records 產生消耗油料登記表
 *
 * 規則：
 * - 資料按日期分組，每天佔一行，填入 row 6~27 (最多 22 天)
 *   B欄 (B6~B27): 當日起始里程（該日第一筆的 startKm）
 *   C欄 (C6~C27): 當日結束里程（該日最後一筆的 endKm）
 *   A欄 (A6~A27): 日期，只填「日」的部分
 *   F欄 同行: 加油公升數
 *   G欄 同行: 加油當下里程
 *   H欄 同行: 公里數差距 (currentFuelKm - lastFuelKm)
 *   J欄 同行: 油耗 (km/l)
 * - G3: 年月 (e.g. "2026年2月")
 * - 檔名: 消耗油料登記表_YYYY-MM.xlsx
 */

export async function exportFuelLog(records, templateUrl) {
    if (records.length === 0) return 0;

    // Fetch template as ArrayBuffer
    const response = await fetch(templateUrl);
    const templateBuffer = await response.arrayBuffer();

    // Load template with exceljs (preserves formatting)
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(templateBuffer);
    const ws = wb.getWorksheet(1);

    const startRow = 6;
    const endRow = 27;
    const maxDays = endRow - startRow + 1; // 22

    // Fill year-month into G3 (民國年)
    const firstDate = records[0].date; // YYYY-MM-DD
    if (firstDate) {
        const [year, month] = firstDate.split('-');
        const rocYear = parseInt(year) - 1911;
        ws.getCell('G3').value = `${rocYear}年${parseInt(month)}月`;
    }

    // Group records by date
    const dateGroups = {};
    const dateOrder = [];
    records.forEach((r) => {
        if (!r.date) return;
        if (!dateGroups[r.date]) {
            dateGroups[r.date] = [];
            dateOrder.push(r.date);
        }
        dateGroups[r.date].push(r);
    });

    // Fill records — one row per day
    const count = Math.min(dateOrder.length, maxDays);
    for (let i = 0; i < count; i++) {
        const date = dateOrder[i];
        const dayRecords = dateGroups[date];
        const row = startRow + i;

        // (1) A欄: 日期 — 只填「日」的部分
        const day = parseInt(date.split('-')[2], 10);
        ws.getCell(`A${row}`).value = day;

        // (2) B欄: 當日起始里程（該日第一筆的 startKm）
        const firstRecord = dayRecords[0];
        if (firstRecord.startKm != null) {
            ws.getCell(`B${row}`).value = firstRecord.startKm;
        }

        // (3) C欄: 當日結束里程（該日最後一筆的 endKm）
        const lastRecord = dayRecords[dayRecords.length - 1];
        if (lastRecord.endKm != null) {
            ws.getCell(`C${row}`).value = lastRecord.endKm;
        }

        // (4) F欄: 加油公升數（從該日有加油的紀錄讀取）
        const fuelRecord = dayRecords.find(r => r.fuelLiters != null && r.fuelLiters > 0);
        if (fuelRecord) {
            ws.getCell(`F${row}`).value = fuelRecord.fuelLiters;

            // (5) G欄: 加油當下里程
            if (fuelRecord.currentFuelKm != null && fuelRecord.currentFuelKm > 0) {
                ws.getCell(`G${row}`).value = fuelRecord.currentFuelKm;
            }

            // (6) H欄: 公里數差距 (currentFuelKm - lastFuelKm)
            if (fuelRecord.currentFuelKm != null && fuelRecord.lastFuelKm != null) {
                const kmDiff = fuelRecord.currentFuelKm - fuelRecord.lastFuelKm;
                if (kmDiff > 0) {
                    ws.getCell(`H${row}`).value = kmDiff;
                }
            }

            // (7) J欄: 油耗 (km/l)
            if (fuelRecord.fuelConsumption != null && fuelRecord.fuelConsumption > 0) {
                ws.getCell(`J${row}`).value = fuelRecord.fuelConsumption;
            }
        }
    }

    // Generate file
    const buffer = await wb.xlsx.writeBuffer();

    // Filename with ROC year-month
    const [year, month] = (records[0].date || '').split('-');
    const rocYear = parseInt(year) - 1911;
    const filename = `消耗油料登記表_民國${rocYear || '000'}年${month || '00'}月.xlsx`;

    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, filename);

    return 1;
}
