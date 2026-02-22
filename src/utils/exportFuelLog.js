import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * 消耗油料登記表.xlsx 匯出（使用 exceljs 保留原始格式）
 *
 * 規則：
 * - 每筆紀錄依序填入 row 6~27 (最多 22 筆)
 *   A欄: 日期, B欄: 起始里程, C欄: 結束里程
 * - 加油紀錄填入同行:
 *   E欄: 加油日期, F欄: 加油公升, G欄: 加油當下里程
 *   H欄: 公里數差距 (本次-上次加油里程), J欄: 油耗 km/l
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
    const maxRecords = endRow - startRow + 1; // 22

    // Fill year-month into G3
    const firstDate = records[0].date; // YYYY-MM-DD
    if (firstDate) {
        const [year, month] = firstDate.split('-');
        ws.getCell('G3').value = `${parseInt(year)}年${parseInt(month)}月`;
    }

    // Fill records
    const count = Math.min(records.length, maxRecords);
    for (let i = 0; i < count; i++) {
        const r = records[i];
        const row = startRow + i;

        // A: date
        ws.getCell(`A${row}`).value = r.date;
        // B: start km
        ws.getCell(`B${row}`).value = r.startKm;
        // C: end km
        ws.getCell(`C${row}`).value = r.endKm;

        // Fuel data (if present)
        if (r.fuelLiters && r.currentFuelKm) {
            // E: fuel date
            ws.getCell(`E${row}`).value = r.date;
            // F: fuel liters
            ws.getCell(`F${row}`).value = r.fuelLiters;
            // G: current fuel km
            ws.getCell(`G${row}`).value = r.currentFuelKm;

            // H: km difference (current - last fuel km)
            if (r.lastFuelKm) {
                const kmDiff = r.currentFuelKm - r.lastFuelKm;
                ws.getCell(`H${row}`).value = kmDiff;
            }

            // J: fuel consumption (km/l)
            if (r.fuelConsumption) {
                ws.getCell(`J${row}`).value = r.fuelConsumption;
            }
        }
    }

    // Generate file
    const buffer = await wb.xlsx.writeBuffer();

    // Filename with year-month
    const [year, month] = (records[0].date || '').split('-');
    const filename = `消耗油料登記表_${year || '0000'}-${month || '00'}.xlsx`;

    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, filename);

    return 1;
}
