import React, { useState, useEffect } from 'react';
import { walletService, zakatService } from '../services/api';

const Dashboard = ({ user }) => {
  const [balance, setBalance] = useState(12500);
  const [zakatDue, setZakatDue] = useState(3125);
  const [transactions, setTransactions] = useState([
    { date: 'Today, 09:15', title: 'Sadaqa – Masjid Al-Nur Fund', amount: -500, type: 'sadaqa' },
    { date: 'Yesterday, 14:30', title: 'Zakat Payment – SUPKEM', amount: -3125, type: 'zakat' },
    { date: 'Apr 6, 10:00', title: 'M-Pesa Top Up', amount: 10000, type: 'topup' },
    { date: 'Apr 5, 16:45', title: 'P2P Amanah Repayment', amount: 2000, type: 'repayment' },
    { date: 'Apr 4, 08:20', title: 'KPLC Electricity Bill', amount: -1800, type: 'utility' }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const balanceRes = await walletService.getBalance();
        setBalance(balanceRes.data.balance);
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Assalamu Alaykum — Welcome to HalalHub</div>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <span className="sharia-badge">☽ Sharia Compliant</span>
          <button className="btn btn-gold" style={{ whiteSpace: 'nowrap' }}>KES {balance.toLocaleString()}</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="card" style={{ borderTop: '3px solid #C9A84C' }}>
          <span style={{ fontSize: '1.8rem', marginBottom: '12px', display: 'block' }}>💰</span>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '2rem',
            fontWeight: 700,
            color: '#0B3D2E',
            lineHeight: 1,
            wordBreak: 'break-word'
          }}>{balance.toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: '#6B5C3E', marginTop: '4px', fontWeight: 500 }}>Wallet Balance (KES)</div>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, marginTop: '6px', color: '#27AE60' }}>↑ 8.4% this month</div>
        </div>

        <div className="card" style={{ borderTop: '3px solid #0B3D2E' }}>
          <span style={{ fontSize: '1.8rem', marginBottom: '12px', display: 'block' }}>⚖️</span>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '2rem',
            fontWeight: 700,
            color: '#0B3D2E',
            lineHeight: 1,
            wordBreak: 'break-word'
          }}>{zakatDue.toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: '#6B5C3E', marginTop: '4px', fontWeight: 500 }}>Zakat Due (KES)</div>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, marginTop: '6px', color: '#6B5C3E' }}>2.5% of eligible assets</div>
        </div>

        <div className="card">
          <span style={{ fontSize: '1.8rem', marginBottom: '12px', display: 'block' }}>🤲</span>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '2rem',
            fontWeight: 700,
            color: '#0B3D2E',
            lineHeight: 1,
            wordBreak: 'break-word'
          }}>8,400</div>
          <div style={{ fontSize: '0.75rem', color: '#6B5C3E', marginTop: '4px', fontWeight: 500 }}>Total Sadaqa Given</div>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, marginTop: '6px', color: '#27AE60' }}>↑ Barakah increasing</div>
        </div>

        <div className="card">
          <span style={{ fontSize: '1.8rem', marginBottom: '12px', display: 'block' }}>🤝</span>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '2rem',
            fontWeight: 700,
            color: '#0B3D2E',
            lineHeight: 1,
            wordBreak: 'break-word'
          }}>2</div>
          <div style={{ fontSize: '0.75rem', color: '#6B5C3E', marginTop: '4px', fontWeight: 500 }}>Active P2P Loans</div>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, marginTop: '6px', color: '#6B5C3E' }}>Qard Hasan (0% interest)</div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Transactions</span>
          <button className="btn btn-sm btn-outline">View All</button>
        </div>
        <div style={{ position: 'relative', paddingLeft: '28px' }}>
          {transactions.map((tx, i) => (
            <div key={i} style={{ position: 'relative', marginBottom: '20px' }}>
              <div style={{
                position: 'absolute',
                left: '-23px',
                top: '4px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: tx.amount > 0 ? '#27AE60' : '#C9A84C',
                border: '2px solid #FFFFFF',
                boxShadow: '0 0 0 2px #C9A84C'
              }}></div>
              <div style={{ fontSize: '0.72rem', color: '#6B5C3E', marginBottom: '3px', fontWeight: 500 }}>{tx.date}</div>
              <div style={{ 
                fontSize: '0.9rem', 
                fontWeight: 600, 
                color: '#1C1208', 
                marginBottom: '2px',
                wordBreak: 'break-word'
              }}>{tx.title}</div>
              <div style={{ fontSize: '0.8rem', color: tx.amount > 0 ? '#27AE60' : '#C0392B' }}>
                {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;