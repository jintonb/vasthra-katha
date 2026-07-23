'use client';

import { useState, useEffect } from 'react';

export default function AdminBannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit'
  const [uploading, setUploading] = useState(false);

  const initialFormState = {
    id: '',
    title: '',
    subtitle: '',
    image: '',
    images: [], // Holds multiple image URLs locally in form state
    link: '/collection',
    type: 'home_banner',
    isActive: true,
    showTitle: true,
  };
  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    loadBanners();
  }, []);

  async function loadBanners() {
    try {
      setLoading(true);
      const res = await fetch('/api/banners');
      const data = await res.json();
      setBanners(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Automatically manage banner type based on selected slot ID
    let extraFields = {};
    if (name === 'id') {
      if (value === 'banner-hero') {
        extraFields.type = 'home_banner';
        extraFields.link = '/collection';
      } else if (value === 'banner-festival') {
        extraFields.type = 'festival_banner';
        extraFields.link = '/collection';
      } else if (value === 'banner-offers') {
        extraFields.type = 'offers_banner';
        extraFields.link = '/collection';
      } else if (value === 'our-story') {
        extraFields.type = 'our_story';
        extraFields.link = '/about';
      }
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...extraFields
    }));
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls = [];
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);

        const res = await fetch('/api/upload?folder=banners', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();

        if (res.ok && data.success) {
          uploadedUrls.push(data.url);
        } else {
          alert('Upload failed: ' + (data.message || 'Unknown error'));
        }
      }
      setForm((prev) => ({ 
        ...prev, 
        images: [...(prev.images || []), ...uploadedUrls] 
      }));
    } catch (err) {
      console.error(err);
      alert('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const removeUploadedImage = (index) => {
    setForm((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, idx) => idx !== index),
    }));
  };

  const openAddModal = () => {
    setForm(initialFormState);
    setModalMode('add');
    setShowModal(true);
  };

  const openEditModal = (banner) => {
    let parsedImages = [];
    try {
      parsedImages = banner.image.startsWith('[') ? JSON.parse(banner.image) : [banner.image];
    } catch (e) {
      parsedImages = [banner.image];
    }
    setForm({
      ...banner,
      images: parsedImages.filter(Boolean),
      showTitle: banner.showTitle !== false,
    });
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm(`Are you sure you want to delete banner "${id}"?`)) return;

    try {
      const res = await fetch(`/api/banners?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        loadBanners();
      } else {
        alert('Delete failed: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.id || !form.title || !form.images || form.images.length === 0) {
      alert('Please fill out Banner Location, Banner Title, and upload at least one image.');
      return;
    }

    const payload = {
      ...form,
      image: JSON.stringify(form.images), // Save the array of images as JSON string
    };

    try {
      const res = await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setShowModal(false);
        loadBanners();
      } else {
        alert('Save failed: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getBannerThumbnail = (imageString) => {
    try {
      if (imageString.startsWith('[')) {
        const parsed = JSON.parse(imageString);
        return parsed[0] || '';
      }
    } catch (e) {}
    return imageString;
  };

  const getBannerImagesCount = (imageString) => {
    try {
      if (imageString.startsWith('[')) {
        const parsed = JSON.parse(imageString);
        return parsed.length;
      }
    } catch (e) {}
    return 1;
  };

  const getSlotFriendlyName = (id) => {
    switch (id) {
      case 'banner-hero': return 'Top Slider Banner (banner-hero)';
      case 'banner-festival': return 'Festival Promo Banner (banner-festival)';
      case 'banner-offers': return 'Offers Promo Banner (banner-offers)';
      case 'our-story': return 'Our Story Section Image (our-story)';
      default: return id;
    }
  };

  return (
    <div>
      <div className="dashboard-title-row">
        <div>
          <h1 className="dashboard-title">Manage Banners</h1>
          <p className="dashboard-subtitle">Control specific layout images for your homepage sections</p>
        </div>
        <button onClick={openAddModal} className="admin-add-btn">
          + Configure Layout Slot
        </button>
      </div>

      <div style={{
        backgroundColor: '#FCFAF7',
        border: '1px dashed var(--border-light)',
        borderRadius: 'var(--border-radius)',
        padding: '1rem',
        marginBottom: '2rem',
        fontSize: '0.85rem',
        lineHeight: '1.5',
        color: 'var(--text-main)'
      }}>
        📌 <strong>Homepage Layout Configuration:</strong> To populate a section on the website, configure a banner slot using one of the four exact Slot IDs:
        <ul style={{ margin: '0.5rem 0 0 1.25rem', padding: 0 }}>
          <li><code>banner-hero</code>: Carousel Slides at the top</li>
          <li><code>banner-festival</code>: Middle Full-Width Festival Promo Banner</li>
          <li><code>banner-offers</code>: Bottom Offers Promo Banner</li>
          <li><code>our-story</code>: The brand introduction story section image</li>
        </ul>
      </div>

      <div className="admin-table-container">
        {loading ? (
          <p style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading banners...
          </p>
        ) : banners.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Main Preview Image</th>
                <th>Layout Slot Location</th>
                <th>Title / Slide Info</th>
                <th>Images Count</th>
                <th>Show Title</th>
                <th>Target Link</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((b) => (
                <tr key={b.id}>
                  <td>
                    <img
                      src={getBannerThumbnail(b.image)}
                      alt={b.title || 'Slide Banner'}
                      className="admin-table-thumb"
                      style={{ width: '120px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                  </td>
                  <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{getSlotFriendlyName(b.id)}</td>
                  <td style={{ fontWeight: '600' }}>{b.title}</td>
                  <td>{getBannerImagesCount(b.image)} image(s)</td>
                  <td>
                    {b.id === 'banner-hero' ? (
                      <span className={`toggle-badge ${b.showTitle !== false ? 'toggle-badge-yes' : 'toggle-badge-no'}`}>
                        {b.showTitle !== false ? 'Visible' : 'Hidden'}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>N/A</span>
                    )}
                  </td>
                  <td><code style={{ fontSize: '0.75rem' }}>{b.link}</code></td>
                  <td>
                    <span className={`toggle-badge ${b.isActive ? 'toggle-badge-yes' : 'toggle-badge-no'}`}>
                      {b.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => openEditModal(b)}
                      className="admin-action-btn-sm admin-edit-btn"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="admin-action-btn-sm admin-delete-btn"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No banners defined. Configure your first layout slot banner!
          </div>
        )}
      </div>

      {/* Banner Modal Form */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box" style={{ maxWidth: '550px' }}>
            <h2 className="modal-title">
              {modalMode === 'add' ? 'Configure Layout Banner Slot' : `Edit Slot - ${getSlotFriendlyName(form.id)}`}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="login-form-group">
                <label className="form-label">Select Layout Slot Location *</label>
                <select
                  name="id"
                  required
                  disabled={modalMode === 'edit'}
                  className="form-input"
                  value={form.id}
                  onChange={handleChange}
                >
                  <option value="">-- Choose Slot --</option>
                  <option value="banner-hero">Top Slider Banner (banner-hero)</option>
                  <option value="banner-festival">Festival Season Promo (banner-festival)</option>
                  <option value="banner-offers">Campaign Special Offer (banner-offers)</option>
                  <option value="our-story">Our Story Section Image (our-story)</option>
                </select>
              </div>

              <div className="login-form-group">
                <label className="form-label">Banner / Section Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  className="form-input"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Festive Splendor Collection"
                />
              </div>

              <div className="login-form-group">
                <label className="form-label">Subtitle / Caption (Optional)</label>
                <input
                  type="text"
                  name="subtitle"
                  className="form-input"
                  value={form.subtitle}
                  onChange={handleChange}
                  placeholder="e.g. Pure silk masterworks for special occasions"
                />
              </div>

              {form.id !== 'our-story' && (
                <div className="login-form-group">
                  <label className="form-label">Destination Link / Path (Non-editable)</label>
                  <input
                    type="text"
                    name="link"
                    disabled={true}
                    className="form-input"
                    style={{ backgroundColor: '#f5f5f5', color: '#888', cursor: 'not-allowed' }}
                    value={form.link}
                    onChange={handleChange}
                    placeholder="/collection"
                  />
                </div>
              )}

              <div className="login-form-group">
                <label className="toggle-group" style={{ padding: '0.5rem 0' }}>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                  />
                  Banner is Active (visible on store)
                </label>
              </div>

              {form.id === 'banner-hero' && (
                <div className="login-form-group">
                  <label className="toggle-group" style={{ padding: '0.5rem 0' }}>
                    <input
                      type="checkbox"
                      name="showTitle"
                      checked={form.showTitle}
                      onChange={handleChange}
                    />
                    Show Title & Subtitle overlay on Carousel
                  </label>
                </div>
              )}

              <div className="login-form-group">
                <label className="form-label">Upload Banner Images (Multiple images create a sliding carousel) *</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  style={{ fontSize: '0.8rem', marginBottom: '1rem' }}
                />
                
                {form.images && form.images.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {form.images.map((img, idx) => (
                      <div key={idx} style={{ position: 'relative', aspectRatio: '16/7', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                        <img src={img} alt={`Slide ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => removeUploadedImage(idx)}
                          style={{
                            position: 'absolute',
                            top: '2px',
                            right: '2px',
                            background: 'rgba(0,0,0,0.6)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.65rem'
                          }}
                          title="Remove image"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {uploading && (
                <p style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Uploading banner image assets... Please wait.
                </p>
              )}

              <div className="modal-actions-row" style={{ marginTop: '2rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={uploading}
                >
                  {modalMode === 'add' ? 'Create Banner' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
