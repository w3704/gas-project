# ⛽ 油料消耗管理系統

輸入車輛使用紀錄，自動產生 **派車單里程** 與 **消耗油料登記表** Excel 檔案。

## 功能特色

- 📝 **快速輸入** — 表單自動帶入上一筆結束里程、事由、使用人
- 📌 **日期記憶** — 可選擇記住日期，下次開啟自動帶入
- ⚡ **油耗自動計算** — 填寫加油資料後即時顯示 km/l
- 📋 **匯出派車單里程** — 依日期＋使用人分組，產生獨立 Excel 檔
- ⛽ **匯出消耗油料登記表** — 自動從派車單紀錄彙整加油資訊
- 💾 **本地儲存** — 紀錄存於瀏覽器 localStorage，關閉不遺失

## 技術架構

| 項目 | 技術 |
|------|------|
| 框架 | React 19 + Vite 7 |
| Excel 處理 | ExcelJS |
| 檔案下載 | FileSaver.js |
| 樣式 | 純 CSS (Dark Mode) |

## 快速開始

```bash
# 安裝依賴
yarn install

# 啟動開發伺服器
yarn dev

# 建置生產版本
yarn build
```

## 專案結構

```
src/
├── App.jsx                  # 主應用程式
├── App.css                  # 全域樣式
├── index.css                # CSS 變數與基礎設定
├── main.jsx                 # 進入點
├── assets/
│   ├── 派車單里程_new.xlsx       # 派車單模板
│   └── 消耗油料登記表_new.xlsx    # 油料登記表模板
├── components/
│   ├── GasForm.jsx          # 輸入表單（含日期記憶功能）
│   ├── GasForm.css
│   ├── RecordsTable.jsx     # 紀錄列表
│   └── RecordsTable.css
└── utils/
    ├── exportDispatch.js    # 派車單里程匯出邏輯
    └── exportFuelLog.js     # 消耗油料登記表匯出邏輯
```

## 匯出規則

### 派車單里程
- 依 **日期 + 使用人** 分組，每組產生一份 Excel
- 左欄 (B9\~B19, D9\~D19)：最多 11 筆行程
- 右欄 (G8\~G19, I8\~I19)：最多 12 筆行程
- 加油資料填入 A23、E23、I23

### 消耗油料登記表
- 從派車單紀錄自動彙整，每月一份
- A6\~A27：日期（僅填「日」）
- F 欄：加油公升數
- G 欄：加油當下里程
- H 欄：公里數差距
- J 欄：油耗 (km/l)

## License

Private project.
