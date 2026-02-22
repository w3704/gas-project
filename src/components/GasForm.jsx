import { useState, useEffect, useMemo } from 'react';
import './GasForm.css';

const defaultForm = {
    date: '',
    destination: '',
    reason: '',
    user: '',
    startKm: '',
    endKm: '',
    lastFuelKm: '',
    currentFuelKm: '',
    fuelLiters: '',
};

export default function GasForm({ records, onSubmit }) {
    const [form, setForm] = useState({ ...defaultForm });
    const [carryReason, setCarryReason] = useState(false);
    const [carryUser, setCarryUser] = useState(false);

    const lastRecord = records.length > 0 ? records[records.length - 1] : null;

    // Auto-fill start km from last record's end km
    useEffect(() => {
        if (lastRecord) {
            setForm(prev => ({
                ...prev,
                startKm: lastRecord.endKm || '',
            }));
        }
    }, [lastRecord]);

    // Auto carry forward reason
    useEffect(() => {
        if (carryReason && lastRecord) {
            setForm(prev => ({ ...prev, reason: lastRecord.reason }));
        }
    }, [carryReason, lastRecord]);

    // Auto carry forward user
    useEffect(() => {
        if (carryUser && lastRecord) {
            setForm(prev => ({ ...prev, user: lastRecord.user }));
        }
    }, [carryUser, lastRecord]);

    // Auto calculate fuel consumption
    const fuelConsumption = useMemo(() => {
        const currentFuelKm = parseFloat(form.currentFuelKm);
        const lastFuelKm = parseFloat(form.lastFuelKm);
        const fuelLiters = parseFloat(form.fuelLiters);
        if (currentFuelKm && lastFuelKm && fuelLiters && fuelLiters > 0) {
            const kmDiff = currentFuelKm - lastFuelKm;
            if (kmDiff > 0) {
                return (kmDiff / fuelLiters).toFixed(2);
            }
        }
        return '';
    }, [form.currentFuelKm, form.lastFuelKm, form.fuelLiters]);

    const handleChange = (field) => (e) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.date || !form.destination || !form.user || !form.endKm) {
            alert('請填寫必要欄位：日期、目的地、使用人、結束里程');
            return;
        }
        const record = {
            ...form,
            startKm: parseFloat(form.startKm) || 0,
            endKm: parseFloat(form.endKm) || 0,
            lastFuelKm: form.lastFuelKm ? parseFloat(form.lastFuelKm) : null,
            currentFuelKm: form.currentFuelKm ? parseFloat(form.currentFuelKm) : null,
            fuelLiters: form.fuelLiters ? parseFloat(form.fuelLiters) : null,
            fuelConsumption: fuelConsumption ? parseFloat(fuelConsumption) : null,
            id: Date.now(),
        };
        onSubmit(record);

        // Reset form but keep auto-fill values
        const newForm = { ...defaultForm };
        newForm.startKm = record.endKm;
        if (carryReason) newForm.reason = record.reason;
        if (carryUser) newForm.user = record.user;
        setForm(newForm);
    };

    const handleReset = () => {
        setForm({ ...defaultForm });
        setCarryReason(false);
        setCarryUser(false);
    };

    const hasFuelData = form.lastFuelKm || form.currentFuelKm || form.fuelLiters;

    return (
        <form className="gas-form" onSubmit={handleSubmit}>
            {/* Row 1: Date, Destination */}
            <div className="form-row">
                <div className="form-group">
                    <label>📅 日期</label>
                    <input
                        type="date"
                        value={form.date}
                        onChange={handleChange('date')}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>📍 目的地</label>
                    <input
                        type="text"
                        value={form.destination}
                        onChange={handleChange('destination')}
                        placeholder="輸入目的地"
                        required
                    />
                </div>
            </div>

            {/* Row 2: Reason, User */}
            <div className="form-row">
                <div className="form-group">
                    <label>📝 事由</label>
                    <input
                        type="text"
                        value={form.reason}
                        onChange={handleChange('reason')}
                        placeholder="輸入事由"
                        disabled={carryReason}
                    />
                    <div className="carry-forward">
                        <input
                            type="checkbox"
                            id="carryReason"
                            checked={carryReason}
                            onChange={(e) => setCarryReason(e.target.checked)}
                            disabled={!lastRecord}
                        />
                        <label htmlFor="carryReason">同上一筆</label>
                    </div>
                </div>
                <div className="form-group">
                    <label>👤 使用人</label>
                    <input
                        type="text"
                        value={form.user}
                        onChange={handleChange('user')}
                        placeholder="輸入使用人"
                        disabled={carryUser}
                        required
                    />
                    <div className="carry-forward">
                        <input
                            type="checkbox"
                            id="carryUser"
                            checked={carryUser}
                            onChange={(e) => setCarryUser(e.target.checked)}
                            disabled={!lastRecord}
                        />
                        <label htmlFor="carryUser">同上一筆</label>
                    </div>
                </div>
            </div>

            {/* Row 3: Start Km, End Km */}
            <div className="form-row">
                <div className="form-group">
                    <label>🚗 出發里程 (KM)</label>
                    <input
                        type="number"
                        value={form.startKm}
                        onChange={handleChange('startKm')}
                        placeholder={lastRecord ? '自動帶入上一筆結束里程' : '輸入出發里程'}
                        className={lastRecord ? 'auto-value' : ''}
                        step="0.1"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>🏁 結束里程 (KM)</label>
                    <input
                        type="number"
                        value={form.endKm}
                        onChange={handleChange('endKm')}
                        placeholder="輸入結束里程"
                        step="0.1"
                        required
                    />
                </div>
            </div>

            {/* Fuel Section */}
            <div className="form-row">
                <div className="fuel-section-label">⛽ 加油資料（選填）</div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>上次加油里程 (KM)</label>
                    <input
                        type="number"
                        value={form.lastFuelKm}
                        onChange={handleChange('lastFuelKm')}
                        placeholder="選填"
                        step="0.1"
                    />
                </div>
                <div className="form-group">
                    <label>加油當下里程 (KM)</label>
                    <input
                        type="number"
                        value={form.currentFuelKm}
                        onChange={handleChange('currentFuelKm')}
                        placeholder="選填"
                        step="0.1"
                    />
                </div>
                <div className="form-group">
                    <label>加油數量 (公升)</label>
                    <input
                        type="number"
                        value={form.fuelLiters}
                        onChange={handleChange('fuelLiters')}
                        placeholder="選填"
                        step="0.01"
                    />
                </div>
            </div>

            {/* Auto calculated fuel consumption */}
            {hasFuelData && (
                <div className="form-row">
                    <div className="form-group">
                        <label>⚡ 耗油 (自動計算 km/l)</label>
                        <input
                            type="text"
                            value={fuelConsumption ? `${fuelConsumption} km/l` : '請填寫完整加油資料'}
                            disabled
                            className="auto-value"
                        />
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="form-actions">
                <button type="submit" className="btn-submit">
                    ✅ 新增紀錄
                </button>
                <button type="button" className="btn-reset" onClick={handleReset}>
                    清除
                </button>
            </div>
        </form>
    );
}
