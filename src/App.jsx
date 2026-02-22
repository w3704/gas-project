import { useState, useEffect, useCallback } from 'react';
import GasForm from './components/GasForm';
import RecordsTable from './components/RecordsTable';
import { exportDispatch } from './utils/exportDispatch';
import { exportFuelLog } from './utils/exportFuelLog';
import './App.css';

const STORAGE_KEY = 'gas-counter-records';

// Template URLs (Vite will handle these as static assets)
const DISPATCH_TEMPLATE_URL = new URL('./assets/派車單里程_new.xlsx', import.meta.url).href;
const FUEL_LOG_TEMPLATE_URL = new URL('./assets/消耗油料登記表_new.xlsx', import.meta.url).href;

function App() {
  const [records, setRecords] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [toasts, setToasts] = useState([]);
  const [exporting, setExporting] = useState(false);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const handleAddRecord = useCallback((record) => {
    setRecords(prev => [...prev, record]);
    showToast('✅ 紀錄已新增');
  }, [showToast]);

  const handleDeleteRecord = useCallback((id) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    showToast('🗑️ 紀錄已刪除', 'info');
  }, [showToast]);

  const handleExportDispatch = useCallback(async () => {
    if (records.length === 0) {
      showToast('⚠️ 請先新增紀錄', 'error');
      return;
    }
    setExporting(true);
    try {
      const count = await exportDispatch(records, DISPATCH_TEMPLATE_URL);
      showToast(`📄 已產生 ${count} 份派車單里程`);
    } catch (err) {
      console.error(err);
      showToast('❌ 匯出派車單失敗：' + err.message, 'error');
    } finally {
      setExporting(false);
    }
  }, [records, showToast]);

  const handleExportFuelLog = useCallback(async () => {
    if (records.length === 0) {
      showToast('⚠️ 請先新增紀錄', 'error');
      return;
    }
    setExporting(true);
    try {
      const count = await exportFuelLog(records, FUEL_LOG_TEMPLATE_URL);
      showToast(`📄 已產生 ${count} 份消耗油料登記表`);
    } catch (err) {
      console.error(err);
      showToast('❌ 匯出油料登記表失敗：' + err.message, 'error');
    } finally {
      setExporting(false);
    }
  }, [records, showToast]);

  return (
    <div className="app">
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="app-header">
        <h1>⛽ 油料消耗管理系統</h1>
        <p>輸入車輛使用紀錄，自動產生派車單與油料登記表</p>
      </header>

      {/* Export Buttons */}
      <div className="export-bar">
        <button
          className="btn-export dispatch"
          onClick={handleExportDispatch}
          disabled={exporting || records.length === 0}
        >
          <span className="icon">📋</span>
          匯出派車單里程
        </button>
        <button
          className="btn-export fuel"
          onClick={handleExportFuelLog}
          disabled={exporting || records.length === 0}
        >
          <span className="icon">⛽</span>
          匯出消耗油料登記表
        </button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Form */}
        <div className="section-card">
          <h2 className="section-title">
            <span className="icon">📝</span>
            新增紀錄
          </h2>
          <GasForm records={records} onSubmit={handleAddRecord} />
        </div>

        {/* Records Table */}
        <div className="section-card">
          <h2 className="section-title">
            <span className="icon">📊</span>
            紀錄列表
            {records.length > 0 && (
              <span className="record-count">{records.length}</span>
            )}
          </h2>
          <RecordsTable records={records} onDelete={handleDeleteRecord} />
        </div>
      </div>
    </div>
  );
}

export default App;
