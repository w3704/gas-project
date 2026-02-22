import './RecordsTable.css';

export default function RecordsTable({ records, onDelete }) {
    if (records.length === 0) {
        return (
            <div className="empty-state">
                <div className="icon">📋</div>
                <p>尚未輸入任何紀錄</p>
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>請在上方表單填寫資料後新增</p>
            </div>
        );
    }

    return (
        <div className="records-table-wrapper">
            <table className="records-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>日期</th>
                        <th>目的地</th>
                        <th>事由</th>
                        <th>使用人</th>
                        <th>出發里程</th>
                        <th>結束里程</th>
                        <th>加油里程</th>
                        <th>加油公升</th>
                        <th>油耗 km/l</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map((r, i) => (
                        <tr key={r.id}>
                            <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                            <td>{r.date}</td>
                            <td>{r.destination}</td>
                            <td>{r.reason}</td>
                            <td>{r.user}</td>
                            <td>{r.startKm}</td>
                            <td>{r.endKm}</td>
                            <td className="fuel-data">
                                {r.currentFuelKm ? `${r.lastFuelKm}→${r.currentFuelKm}` : '-'}
                            </td>
                            <td className="fuel-data">{r.fuelLiters || '-'}</td>
                            <td className="fuel-data">
                                {r.fuelConsumption ? `${r.fuelConsumption}` : '-'}
                            </td>
                            <td>
                                <button
                                    className="btn-delete"
                                    onClick={() => onDelete(r.id)}
                                    title="刪除此筆紀錄"
                                >
                                    🗑️
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
