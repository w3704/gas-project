import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * 消耗油料登記表.xlsx 匯出（使用 exceljs 保留原始格式）
 *
 * 邏輯更新：資料來源改為已處理的派車單里程 records
 * 先匯出派車單里程，再由派車單里程的 records 產生消耗油料登記表
 *
 * 規則：
 * - 資料填入 row 6~27 (最多 22 筆)
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
    const maxRecords = endRow - startRow + 1; // 22

    // Fill year-month into G3
    const firstDate = records[0].date; // YYYY-MM-DD
    if (firstDate) {
        const [year, month] = firstDate.split('-');
        ws.getCell('G3').value = `${parseInt(year)}年${parseInt(month)}月`;
    }

    // Fill records — data comes from dispatch (派車單里程) records
    const count = Math.min(records.length, maxRecords);
    for (let i = 0; i < count; i++) {
        const r = records[i];
        const row = startRow + i;

        // (1) A欄: 日期 — 只填「日」的部分（所有 record 都填）
        if (r.date) {
            const day = parseInt(r.date.split('-')[2], 10); // extract day from YYYY-MM-DD
            ws.getCell(`A${row}`).value = day;
        }

        // (2) F欄: 加油公升數（從派車單里程讀取）
        if (r.fuelLiters != null && r.fuelLiters > 0) {
            ws.getCell(`F${row}`).value = r.fuelLiters;
        }

        // (3) G欄: 加油當下里程（從派車單里程讀取）
        if (r.currentFuelKm != null && r.currentFuelKm > 0) {
            ws.getCell(`G${row}`).value = r.currentFuelKm;
        }

        // (4) H欄: 公里數差距 (currentFuelKm - lastFuelKm)
        if (r.currentFuelKm != null && r.lastFuelKm != null) {
            const kmDiff = r.currentFuelKm - r.lastFuelKm;
            if (kmDiff > 0) {
                ws.getCell(`H${row}`).value = kmDiff;
            }
        }

        // (5) J欄: 油耗 (km/l)
        if (r.fuelConsumption != null && r.fuelConsumption > 0) {
            ws.getCell(`J${row}`).value = r.fuelConsumption;
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
