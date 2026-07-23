import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { kycService, vendorService } from '../services/api';

const KYCStatus = () => {
  const navigate = useNavigate();
  
  // ===== STATE =====
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  
  // KYC Data
  const [kycApplications, setKycApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  
  // Document upload
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  
  // New application
  const [showNewAppModal, setShowNewAppModal] = useState(false);
  const [newApplication, setNewApplication] = useState({
    businessName: '',
    businessType: '',
    county: '',
    registrationNumber: '',
    description: ''
  });
  
  // Document upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  // Status detail modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  
  // Business types
  const businessTypes = [
    'Restaurant', 'HalalStay', 'Butchery', 'Bakery', 'Catering', 
    'Grocery', 'E-commerce', 'Pharmacy', 'Fashion', 'Beauty'
  ];
  
  const counties = ['Nairobi', 'Mombasa', 'Kisumu', 'Garissa', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale', 'Kakamega'];

  // ===== FETCH DATA =====
  useEffect(() => {
    checkAuth();
    fetchKYCData();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('halalhub_token');
    const userData = JSON.parse(localStorage.getItem('halalhub_user') || '{}');
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(userData);
    }
  };

  const fetchKYCData = async () => {
    setLoading(true);
    setError('');
    try {
      // Replace with actual API call
      // const res = await kycService.getApplications();
      // setKycApplications(res.data || []);
      
      // Mock data - replace with real API
      setKycApplications([
        {
          id: 1,
          businessName: 'Al-Amour Halal Restaurant',
          businessType: 'Restaurant',
          county: 'Nairobi',
          submittedDate: '2026-04-01',
          status: 'verified',
          documents: ['Business Registration', 'KRA PIN', 'Halal Certificate'],
          verificationDate: '2026-04-05',
          verifiedBy: 'Admin'
        },
        {
          id: 2,
          businessName: 'Madinah Suites HalalStay',
          businessType: 'HalalStay',
          county: 'Nairobi',
          submittedDate: '2026-04-06',
          status: 'review',
          documents: ['Business Registration', 'KRA PIN'],
          verificationDate: null,
          verifiedBy: null
        },
        {
          id: 3,
          businessName: 'Baraka Organic Halal Shop',
          businessType: 'Grocery',
          county: 'Mombasa',
          submittedDate: '2026-04-08',
          status: 'pending',
          documents: ['Business Registration'],
          verificationDate: null,
          verifiedBy: null
        },
        {
          id: 4,
          businessName: 'Nairobi Halal Bakery',
          businessType: 'Bakery',
          county: 'Nairobi',
          submittedDate: '2026-03-20',
          status: 'rejected',
          documents: ['Business Registration', 'KRA PIN'],
          rejectionReason: 'Incomplete documentation. Please upload Halal Certificate.',
          verificationDate: '2026-03-25',
          verifiedBy: 'Admin'
        }
      ]);
    } catch (err) {
      setError('Failed to load KYC applications. Please refresh.');
      console.error('KYC error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ===== APPLICATION MANAGEMENT =====
  const handleNewApplication = async () => {
    if (!newApplication.businessName || !newApplication.businessType || !newApplication.county) {
      setError('Please fill in all required fields');
      return;
    }
    
    setProcessing(true);
    setError('');
    try {
      // Replace with actual API call
      // const res = await kycService.createApplication(newApplication);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setShowNewAppModal(false);
      setNewApplication({
        businessName: '',
        businessType: '',
        county: '',
        registrationNumber: '',
        description: ''
      });
      
      await fetchKYCData();
      setSuccess('✅ KYC application submitted successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('Failed to submit application. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleUploadDocuments = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one document to upload');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    try {
      // Replace with actual API call
      // const formData = new FormData();
      // selectedFiles.forEach(file => formData.append('documents', file));
      // await kycService.uploadDocuments(selectedApplication.id, formData);
      
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      setShowUploadModal(false);
      setSelectedFiles([]);
      await fetchKYCData();
      
      setSuccess('✅ Documents uploaded successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('Failed to upload documents. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleResubmit = async (applicationId) => {
    if (window.confirm('Are you sure you want to resubmit this application?')) {
      setProcessing(true);
      try {
        // Replace with actual API call
        // await kycService.resubmitApplication(applicationId);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        await fetchKYCData();
        setSuccess('✅ Application resubmitted successfully!');
        setTimeout(() => setSuccess(''), 5000);
      } catch (err) {
        setError('Failed to resubmit application.');
      } finally {
        setProcessing(false);
      }
    }
  };

  // ===== HELPERS =====
  const getStatusConfig = (status) => {
    const configs = {
      'verified': {
        label: '✅ Verified',
        class: 'status-verified',
        icon: '✅',
        color: '#27AE60',
        bg: 'rgba(39, 174, 96, 0.1)'
      },
      'review': {
        label: '🔍 Under Review',
        class: 'status-review',
        icon: '🔍',
        color: '#2980B9',
        bg: 'rgba(41, 128, 185, 0.1)'
      },
      'pending': {
        label: '⏳ Pending',
        class: 'status-pending',
        icon: '⏳',
        color: '#F39C12',
        bg: 'rgba(241, 196, 15, 0.1)'
      },
      'rejected': {
        label: '❌ Rejected',
        class: 'status-rejected',
        icon: '❌',
        color: '#C0392B',
        bg: 'rgba(192, 57, 43, 0.1)'
      }
    };
    return configs[status] || configs['pending'];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getBusinessTypeIcon = (type) => {
    const icons = {
      'Restaurant': '🍽️',
      'HalalStay': '🏨',
      'Butchery': '🥩',
      'Bakery': '🍞',
      'Catering': '🍲',
      'Grocery': '🛍️',
      'E-commerce': '🛒',
      'Pharmacy': '💊',
      'Fashion': '👗',
      'Beauty': '💄'
    };
    return icons[type] || '🏪';
  };

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="page-body kyc-page">
        <div className="page-header">
          <div>
            <div className="page-title">📋 My KYC Status</div>
            <div className="page-subtitle">Track your verification status</div>
          </div>
        </div>
        <div className="kyc-loading-grid">
          <div className="skeleton-card skeleton-card-hero" />
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-line skeleton-line-lg" />
              <div className="skeleton-line skeleton-line-md" />
              <div className="skeleton-line skeleton-line-sm" />
            </div>
          ))}
        </div>
        <style>{`
          .kyc-loading-grid {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .skeleton-card {
            background: white;
            padding: 20px;
            border-radius: 14px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.04);
          }
          .skeleton-card-hero {
            min-height: 120px;
          }
          .skeleton-line {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 6px;
            margin-bottom: 8px;
          }
          .skeleton-line-lg { height: 40px; width: 100%; }
          .skeleton-line-md { height: 24px; width: 70%; }
          .skeleton-line-sm { height: 16px; width: 50%; }
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    );
  }

  // ===== MAIN COMPONENT =====
  return (
    <div className="page-body kyc-page">
      {/* ===== PAGE HEADER ===== */}
      <div className="page-header">
        <div>
          <div className="page-title">📋 My KYC Status</div>
          <div className="page-subtitle">Track your business verification status</div>
        </div>
        <div className="page-header-actions">
          <span className="halal-cert">☽ Halal Certified</span>
          <button className="btn btn-sm btn-gold" onClick={() => setShowNewAppModal(true)}>
            + New Application
          </button>
          <button className="btn btn-sm btn-outline" onClick={fetchKYCData}>
            🔄
          </button>
        </div>
      </div>

      {/* ===== ERROR ===== */}
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => { setError(''); fetchKYCData(); }}>Retry</button>
        </div>
      )}

      {/* ===== HERO ===== */}
      <div className="kyc-hero">
        <div className="kyc-hero-content">
          <div className="kyc-hero-icon">📋</div>
          <div>
            <div className="kyc-hero-title">Vendor KYC Centre</div>
            <div className="kyc-hero-text">
              Register your business and track verification status. 
              Complete KYC to start selling on HalalHub.
            </div>
          </div>
        </div>
        <button className="btn btn-gold kyc-hero-btn" onClick={() => setShowNewAppModal(true)}>
          + Register Business
        </button>
      </div>

      {/* ===== APPLICATIONS LIST ===== */}
      {kycApplications.length === 0 ? (
        <div className="kyc-empty">
          <div className="kyc-empty-icon">📭</div>
          <div className="kyc-empty-title">No KYC Applications</div>
          <div className="kyc-empty-text">
            You haven't submitted any KYC applications yet. 
            Register your business to start selling.
          </div>
          <button className="btn btn-gold" onClick={() => setShowNewAppModal(true)}>
            + Start KYC Application
          </button>
        </div>
      ) : (
        <div className="kyc-applications">
          {kycApplications.map((app) => {
            const status = getStatusConfig(app.status);
            return (
              <div key={app.id} className="kyc-application-card">
                <div className="kyc-application-header">
                  <div className="kyc-application-left">
                    <span className="kyc-application-icon">{getBusinessTypeIcon(app.businessType)}</span>
                    <div>
                      <div className="kyc-application-name">{app.businessName}</div>
                      <div className="kyc-application-meta">
                        {app.businessType} · {app.county}
                      </div>
                    </div>
                  </div>
                  <div className="kyc-application-right">
                    <span className={`kyc-status-badge ${status.class}`}>
                      {status.icon} {status.label}
                    </span>
                  </div>
                </div>

                <div className="kyc-application-details">
                  <div className="kyc-application-detail">
                    <span className="kyc-detail-label">Submitted</span>
                    <span className="kyc-detail-value">{formatDate(app.submittedDate)}</span>
                  </div>
                  <div className="kyc-application-detail">
                    <span className="kyc-detail-label">Documents</span>
                    <span className="kyc-detail-value">{app.documents.length} uploaded</span>
                  </div>
                  {app.verificationDate && (
                    <div className="kyc-application-detail">
                      <span className="kyc-detail-label">Verified</span>
                      <span className="kyc-detail-value">{formatDate(app.verificationDate)}</span>
                    </div>
                  )}
                </div>

                {app.status === 'rejected' && app.rejectionReason && (
                  <div className="kyc-rejection-reason">
                    <span className="kyc-rejection-label">❌ Rejection Reason:</span>
                    <span className="kyc-rejection-text">{app.rejectionReason}</span>
                  </div>
                )}

                <div className="kyc-application-actions">
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setSelectedApplication(app);
                      setShowStatusModal(true);
                    }}
                  >
                    👁️ View Details
                  </button>
                  
                  {app.status === 'pending' && (
                    <button 
                      className="btn btn-gold btn-sm"
                      onClick={() => {
                        setSelectedApplication(app);
                        setShowUploadModal(true);
                      }}
                    >
                      📤 Upload Documents
                    </button>
                  )}
                  
                  {app.status === 'rejected' && (
                    <button 
                      className="btn btn-gold btn-sm"
                      onClick={() => handleResubmit(app.id)}
                      disabled={processing}
                    >
                      🔄 Resubmit
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================== */}
      {/* ===== NEW APPLICATION MODAL ===== */}
      {/* ======================================== */}
      {showNewAppModal && (
        <div className="modal-overlay" onClick={() => setShowNewAppModal(false)}>
          <div className="modal-content kyc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📝 New KYC Application</h3>
              <button className="modal-close" onClick={() => setShowNewAppModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="kyc-form">
                <div className="kyc-field">
                  <label className="kyc-label">Business Name *</label>
                  <input className="kyc-input" placeholder="Enter business name" value={newApplication.businessName} onChange={(e) => setNewApplication({...newApplication, businessName: e.target.value})} />
                </div>
                <div className="kyc-field">
                  <label className="kyc-label">Business Type *</label>
                  <select className="kyc-select" value={newApplication.businessType} onChange={(e) => setNewApplication({...newApplication, businessType: e.target.value})}>
                    <option value="">Select business type</option>
                    {businessTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="kyc-field">
                  <label className="kyc-label">County *</label>
                  <select className="kyc-select" value={newApplication.county} onChange={(e) => setNewApplication({...newApplication, county: e.target.value})}>
                    <option value="">Select county</option>
                    {counties.map(county => (
                      <option key={county} value={county}>{county}</option>
                    ))}
                  </select>
                </div>
                <div className="kyc-field">
                  <label className="kyc-label">Registration Number</label>
                  <input className="kyc-input" placeholder="Business registration number" value={newApplication.registrationNumber} onChange={(e) => setNewApplication({...newApplication, registrationNumber: e.target.value})} />
                </div>
                <div className="kyc-field">
                  <label className="kyc-label">Description</label>
                  <textarea className="kyc-textarea" placeholder="Describe your business" rows="2" value={newApplication.description} onChange={(e) => setNewApplication({...newApplication, description: e.target.value})} />
                </div>
              </div>
              {error && <div className="kyc-error">{error}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowNewAppModal(false)}>
                Cancel
              </button>
              <button className="btn btn-gold" onClick={handleNewApplication} disabled={processing}>
                {processing ? 'Submitting...' : '✅ Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================== */}
      {/* ===== UPLOAD DOCUMENTS MODAL ===== */}
      {/* ======================================== */}
      {showUploadModal && selectedApplication && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📤 Upload Documents</h3>
              <button className="modal-close" onClick={() => setShowUploadModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="upload-info">
                <div className="upload-business">{selectedApplication.businessName}</div>
                <div className="upload-required">Required Documents:</div>
                <ul className="upload-list">
                  <li>✓ Business Registration Certificate</li>
                  <li>✓ KRA PIN Certificate</li>
                  <li>✓ Halal Certificate (if applicable)</li>
                  <li>✓ National ID / Passport</li>
                  <li>✓ Passport Photo</li>
                </ul>
              </div>

              <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={(e) => setSelectedFiles(Array.from(e.target.files))} />
                <div className="upload-icon">📁</div>
                <div className="upload-text">Click to upload documents</div>
                <div className="upload-hint">PDF, JPG, PNG accepted (Max 5MB each)</div>
                {selectedFiles.length > 0 && (
                  <div className="upload-files">
                    {selectedFiles.map((file, i) => (
                      <div key={i} className="upload-file">📄 {file.name}</div>
                    ))}
                  </div>
                )}
              </div>

              {uploading && (
                <div className="upload-progress">
                  <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
                  <div className="upload-progress-text">{uploadProgress}% uploaded</div>
                </div>
              )}

              {error && <div className="upload-error">{error}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowUploadModal(false)}>
                Cancel
              </button>
              <button className="btn btn-gold" onClick={handleUploadDocuments} disabled={uploading}>
                {uploading ? 'Uploading...' : '✅ Upload Documents'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================== */}
      {/* ===== STATUS DETAIL MODAL ===== */}
      {/* ======================================== */}
      {showStatusModal && selectedApplication && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content status-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 Application Details</h3>
              <button className="modal-close" onClick={() => setShowStatusModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="status-business">
                <span className="status-business-icon">{getBusinessTypeIcon(selectedApplication.businessType)}</span>
                <div>
                  <div className="status-business-name">{selectedApplication.businessName}</div>
                  <div className="status-business-type">{selectedApplication.businessType} · {selectedApplication.county}</div>
                </div>
              </div>

              <div className="status-details">
                <div className="status-detail">
                  <span className="status-detail-label">Status</span>
                  <span className={`status-detail-value status-${selectedApplication.status}`}>
                    {getStatusConfig(selectedApplication.status).icon} {getStatusConfig(selectedApplication.status).label}
                  </span>
                </div>
                <div className="status-detail">
                  <span className="status-detail-label">Submitted</span>
                  <span className="status-detail-value">{formatDate(selectedApplication.submittedDate)}</span>
                </div>
                {selectedApplication.verificationDate && (
                  <div className="status-detail">
                    <span className="status-detail-label">Verified</span>
                    <span className="status-detail-value">{formatDate(selectedApplication.verificationDate)}</span>
                  </div>
                )}
                {selectedApplication.verifiedBy && (
                  <div className="status-detail">
                    <span className="status-detail-label">Verified By</span>
                    <span className="status-detail-value">{selectedApplication.verifiedBy}</span>
                  </div>
                )}
                <div className="status-detail">
                  <span className="status-detail-label">Documents</span>
                  <div className="status-documents">
                    {selectedApplication.documents.map((doc, i) => (
                      <span key={i} className="status-document">📄 {doc}</span>
                    ))}
                  </div>
                </div>
                {selectedApplication.rejectionReason && (
                  <div className="status-detail status-rejection">
                    <span className="status-detail-label">Rejection Reason</span>
                    <span className="status-detail-value status-rejection-text">{selectedApplication.rejectionReason}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowStatusModal(false)}>
                Close
              </button>
              {selectedApplication.status === 'pending' && (
                <button className="btn btn-gold" onClick={() => {
                  setShowStatusModal(false);
                  setShowUploadModal(true);
                }}>
                  📤 Upload Documents
                </button>
              )}
              {selectedApplication.status === 'rejected' && (
                <button className="btn btn-gold" onClick={() => {
                  setShowStatusModal(false);
                  handleResubmit(selectedApplication.id);
                }}>
                  🔄 Resubmit
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================== */}
      {/* ===== SUCCESS TOAST ===== */}
      {/* ======================================== */}
      {success && (
        <div className="success-toast">
          <span>✅ {success}</span>
          <button onClick={() => setSuccess('')}>✕</button>
        </div>
      )}

      <style>{`
        /* ======================================== */
        /* ===== KYC PAGE STYLES ===== */
        /* ======================================== */

        .kyc-page {
          padding-bottom: 40px;
        }

        /* ===== PAGE HEADER ===== */
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 24px;
        }

        .page-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .halal-cert {
          font-size: 0.65rem;
          background: rgba(39, 174, 96, 0.1);
          color: #27AE60;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 600;
        }

        /* ===== ERROR BANNER ===== */
        .error-banner {
          background: rgba(192, 57, 43, 0.08);
          border: 1px solid #C0392B;
          color: #C0392B;
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }

        .error-banner button {
          background: #C0392B;
          color: white;
          border: none;
          padding: 4px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 600;
        }

        /* ===== HERO ===== */
        .kyc-hero {
          background: linear-gradient(135deg, #0B3D2E, #145A40);
          border-radius: 14px;
          padding: 24px 32px;
          margin-bottom: 24px;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .kyc-hero-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .kyc-hero-icon {
          font-size: 3rem;
          flex-shrink: 0;
        }

        .kyc-hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #C9A84C;
        }

        .kyc-hero-text {
          font-size: 0.85rem;
          opacity: 0.8;
        }

        .kyc-hero-btn {
          padding: 10px 24px;
          font-size: 0.95rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        /* ===== APPLICATIONS ===== */
        .kyc-applications {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .kyc-application-card {
          background: white;
          border-radius: 14px;
          padding: 20px;
          border: 1px solid rgba(0, 0, 0, 0.04);
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
          transition: all 0.3s ease;
        }

        .kyc-application-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }

        .kyc-application-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 10px;
        }

        .kyc-application-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .kyc-application-icon {
          font-size: 1.8rem;
          flex-shrink: 0;
        }

        .kyc-application-name {
          font-size: 1rem;
          font-weight: 600;
          color: #1C1208;
        }

        .kyc-application-meta {
          font-size: 0.75rem;
          color: #6B5C3E;
        }

        .kyc-application-right {
          flex-shrink: 0;
        }

        .kyc-status-badge {
          font-size: 0.65rem;
          padding: 4px 14px;
          border-radius: 20px;
          font-weight: 600;
          display: inline-block;
        }

        .status-verified {
          background: rgba(39, 174, 96, 0.1);
          color: #27AE60;
        }

        .status-review {
          background: rgba(41, 128, 185, 0.1);
          color: #2980B9;
        }

        .status-pending {
          background: rgba(241, 196, 15, 0.1);
          color: #F39C12;
        }

        .status-rejected {
          background: rgba(192, 57, 43, 0.1);
          color: #C0392B;
        }

        .kyc-application-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 8px;
          padding: 10px 12px;
          background: rgba(0, 0, 0, 0.02);
          border-radius: 8px;
          margin-bottom: 10px;
        }

        .kyc-application-detail {
          display: flex;
          flex-direction: column;
        }

        .kyc-detail-label {
          font-size: 0.55rem;
          color: #6B5C3E;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .kyc-detail-value {
          font-size: 0.8rem;
          font-weight: 500;
          color: #1C1208;
        }

        .kyc-rejection-reason {
          padding: 10px 12px;
          background: rgba(192, 57, 43, 0.04);
          border-radius: 8px;
          border-left: 3px solid #C0392B;
          margin-bottom: 10px;
        }

        .kyc-rejection-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #C0392B;
          display: block;
        }

        .kyc-rejection-text {
          font-size: 0.8rem;
          color: #6B5C3E;
        }

        .kyc-application-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* ===== EMPTY STATE ===== */
        .kyc-empty {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 14px;
          border: 1px solid rgba(0, 0, 0, 0.04);
        }

        .kyc-empty-icon {
          font-size: 3.5rem;
          margin-bottom: 8px;
        }

        .kyc-empty-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1C1208;
        }

        .kyc-empty-text {
          font-size: 0.85rem;
          color: #6B5C3E;
          margin: 4px 0 16px;
        }

        /* ======================================== */
        /* ===== MODALS ===== */
        /* ======================================== */

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          backdrop-filter: blur(8px);
          padding: 20px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          max-width: 460px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .modal-header h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.2rem;
          color: #0B3D2E;
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: #6B5C3E;
          padding: 4px 8px;
          transition: color 0.2s ease;
        }

        .modal-close:hover {
          color: #C0392B;
        }

        .modal-body {
          padding: 20px;
        }

        .modal-footer {
          display: flex;
          gap: 10px;
          padding: 16px 20px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }

        .modal-footer .btn {
          flex: 1;
          padding: 10px;
          font-size: 0.85rem;
        }

        /* ===== KYC FORM MODAL ===== */
        .kyc-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .kyc-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .kyc-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #6B5C3E;
          letter-spacing: 0.04em;
        }

        .kyc-input,
        .kyc-select,
        .kyc-textarea {
          padding: 10px 12px;
          border: 1.5px solid rgba(0, 0, 0, 0.08);
          border-radius: 8px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.85rem;
          color: #1C1208;
          background: white;
          outline: none;
          transition: all 0.28s ease;
          width: 100%;
        }

        .kyc-input:focus,
        .kyc-select:focus,
        .kyc-textarea:focus {
          border-color: #0B3D2E;
          box-shadow: 0 0 0 3px rgba(11, 61, 46, 0.08);
        }

        .kyc-textarea {
          resize: vertical;
        }

        .kyc-error {
          color: #C0392B;
          font-size: 0.8rem;
          padding: 8px;
          background: rgba(192, 57, 43, 0.06);
          border-radius: 6px;
          margin-top: 8px;
        }

        /* ===== UPLOAD MODAL ===== */
        .upload-info {
          margin-bottom: 16px;
        }

        .upload-business {
          font-size: 1rem;
          font-weight: 600;
          color: #1C1208;
        }

        .upload-required {
          font-size: 0.8rem;
          font-weight: 600;
          color: #0B3D2E;
          margin-top: 4px;
        }

        .upload-list {
          list-style: none;
          padding: 0;
          margin: 4px 0 0;
        }

        .upload-list li {
          font-size: 0.75rem;
          color: #6B5C3E;
          padding: 2px 0;
        }

        .upload-area {
          border: 2px dashed rgba(0, 0, 0, 0.08);
          border-radius: 8px;
          padding: 30px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .upload-area:hover {
          border-color: #C9A84C;
          background: rgba(201, 168, 76, 0.02);
        }

        .upload-icon {
          font-size: 2.5rem;
          margin-bottom: 4px;
        }

        .upload-text {
          font-size: 0.85rem;
          color: #6B5C3E;
        }

        .upload-hint {
          font-size: 0.65rem;
          color: #6B5C3E;
          margin-top: 2px;
        }

        .upload-files {
          margin-top: 8px;
        }

        .upload-file {
          font-size: 0.75rem;
          color: #1C1208;
          padding: 4px 8px;
          background: rgba(0, 0, 0, 0.02);
          border-radius: 4px;
        }

        .upload-progress {
          margin-top: 12px;
          height: 20px;
          background: rgba(0, 0, 0, 0.04);
          border-radius: 10px;
          overflow: hidden;
          position: relative;
        }

        .upload-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #C9A84C, #E8C96A);
          transition: width 0.3s ease;
          border-radius: 10px;
        }

        .upload-progress-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 0.65rem;
          font-weight: 600;
          color: #0B3D2E;
        }

        .upload-error {
          color: #C0392B;
          font-size: 0.8rem;
          padding: 8px;
          background: rgba(192, 57, 43, 0.06);
          border-radius: 6px;
          margin-top: 8px;
        }

        /* ===== STATUS DETAIL MODAL ===== */
        .status-business {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          margin-bottom: 12px;
        }

        .status-business-icon {
          font-size: 2rem;
        }

        .status-business-name {
          font-size: 1rem;
          font-weight: 600;
          color: #1C1208;
        }

        .status-business-type {
          font-size: 0.75rem;
          color: #6B5C3E;
        }

        .status-details {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .status-detail {
          display: flex;
          flex-direction: column;
          padding: 4px 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.04);
        }

        .status-detail:last-child {
          border-bottom: none;
        }

        .status-detail-label {
          font-size: 0.6rem;
          color: #6B5C3E;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .status-detail-value {
          font-size: 0.85rem;
          color: #1C1208;
        }

        .status-verified { color: #27AE60; }
        .status-review { color: #2980B9; }
        .status-pending { color: #F39C12; }
        .status-rejected { color: #C0392B; }

        .status-documents {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 2px;
        }

        .status-document {
          font-size: 0.7rem;
          padding: 2px 10px;
          background: rgba(0, 0, 0, 0.02);
          border-radius: 4px;
          color: #6B5C3E;
        }

        .status-rejection {
          background: rgba(192, 57, 43, 0.04);
          padding: 6px 10px;
          border-radius: 6px;
        }

        .status-rejection-text {
          color: #C0392B;
        }

        /* ======================================== */
        /* ===== SUCCESS TOAST ===== */
        /* ======================================== */

        .success-toast {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #27AE60;
          color: white;
          padding: 16px 24px;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(39, 174, 96, 0.3);
          z-index: 10001;
          display: flex;
          align-items: center;
          gap: 12px;
          animation: slideDown 0.3s ease;
          max-width: 400px;
        }

        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .success-toast button {
          background: none;
          border: none;
          color: white;
          font-size: 1.1rem;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s ease;
        }

        .success-toast button:hover {
          opacity: 1;
        }

        /* ======================================== */
        /* ===== RESPONSIVE ===== */
        /* ======================================== */

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .page-header-actions {
            width: 100%;
            justify-content: flex-start;
          }

          .kyc-hero {
            flex-direction: column;
            align-items: flex-start;
            padding: 20px;
          }

          .kyc-hero-content {
            flex-direction: column;
            text-align: center;
            width: 100%;
          }

          .kyc-hero-btn {
            width: 100%;
          }

          .kyc-application-header {
            flex-direction: column;
          }

          .kyc-application-details {
            grid-template-columns: 1fr 1fr;
          }

          .modal-content {
            max-width: 100%;
            margin: 10px;
          }

          .modal-footer {
            flex-direction: column;
          }

          .modal-footer .btn {
            width: 100%;
          }

          .success-toast {
            top: 10px;
            right: 10px;
            left: 10px;
            max-width: unset;
            font-size: 0.85rem;
            padding: 12px 16px;
          }

          .kyc-application-actions {
            flex-direction: column;
          }

          .kyc-application-actions .btn {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .kyc-hero {
            padding: 16px;
          }

          .kyc-hero-icon {
            font-size: 2.5rem;
          }

          .kyc-hero-title {
            font-size: 1.2rem;
          }

          .kyc-hero-text {
            font-size: 0.8rem;
          }

          .kyc-application-card {
            padding: 16px;
          }

          .kyc-application-name {
            font-size: 0.9rem;
          }

          .kyc-application-details {
            grid-template-columns: 1fr;
          }

          .kyc-status-badge {
            font-size: 0.6rem;
            padding: 2px 10px;
          }

          .upload-area {
            padding: 20px;
          }

          .upload-icon {
            font-size: 2rem;
          }

          .upload-text {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default KYCStatus;