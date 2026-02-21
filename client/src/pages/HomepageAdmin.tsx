import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { Link } from 'react-router-dom';

interface PlotNewsSubmission {
  PlotNewsID: number;
  PackNames: string;
  AllIds: string;
  NewsText: string;
  ThreadURL?: string;
  ThreadTitle?: string;
  SubmittedByUserID?: number;
  SubmittedByUsername?: string;
  SubmittedAt: string;
}

interface Pack {
  id: number;
  name: string;
  color1: string;
  isActive: boolean;
}

export default function HomepageAdmin() {
  const { user } = useUser();

  const [packs, setPacks] = useState<Pack[]>([]);
  const [plotNewsSubmissions, setPlotNewsSubmissions] = useState<PlotNewsSubmission[]>([]);
  const [plotNewsLoading, setPlotNewsLoading] = useState(true);
  const [approving, setApproving] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<PlotNewsSubmission | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    packNames: [] as string[],
    newsText: '',
    threadURL: '',
  });

  const [bulletinContent, setBulletinContent] = useState('');
  const [bulletinEnabled, setBulletinEnabled] = useState(false);
  const [bulletinLoading, setBulletinLoading] = useState(true);
  const [bulletinSaving, setBulletinSaving] = useState(false);

  const [updatesLoading, setUpdatesLoading] = useState(true);
  const [newUpdateContent, setNewUpdateContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const userId = (user as any)?.UserID || user?.id;
  const isModerator = user?.isModerator || user?.isAdmin;

  useEffect(() => {
    fetch('/api/packs').then(r => r.ok ? r.json() : []).then(setPacks).catch(() => {});
    loadPlotNewsSubmissions();
    loadBulletin();
    loadUpdates();
  }, []);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [message]);

  async function loadPlotNewsSubmissions() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/plot-news/pending', {
        headers: { 'X-Authorization': `Bearer ${token}` },
      });
      if (response.ok) setPlotNewsSubmissions(await response.json());
    } catch (error) {
      console.error('Error fetching plot news submissions:', error);
    } finally {
      setPlotNewsLoading(false);
    }
  }

  async function loadBulletin() {
    try {
      const res = await fetch('/api/bulletin');
      if (res.ok) {
        const data = await res.json();
        setBulletinContent(data.Content || '');
        setBulletinEnabled(data.IsEnabled || false);
      }
    } catch (error) {
      console.error('Error loading bulletin:', error);
    } finally {
      setBulletinLoading(false);
    }
  }

  async function loadUpdates() {
    try {
      const res = await fetch('/api/sitewide-updates?limit=20');
      if (res.ok) await res.json();
    } catch (error) {
      console.error('Error loading updates:', error);
    } finally {
      setUpdatesLoading(false);
    }
  }

  async function handleSaveBulletin() {
    setBulletinSaving(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/bulletin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: bulletinContent, isEnabled: bulletinEnabled, userId }),
      });
      setMessage(res.ok ? { type: 'success', text: 'Bulletin saved!' } : { type: 'error', text: 'Failed to save bulletin' });
    } catch {
      setMessage({ type: 'error', text: 'Error saving bulletin' });
    } finally {
      setBulletinSaving(false);
    }
  }

  async function handleAddUpdate() {
    if (!newUpdateContent.trim()) {
      setMessage({ type: 'error', text: 'Please enter update content' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/sitewide-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: newUpdateContent, userId }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Update added!' });
        setNewUpdateContent('');
        loadUpdates();
      } else {
        setMessage({ type: 'error', text: 'Failed to add update' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error adding update' });
    } finally {
      setSubmitting(false);
    }
  }

  const handleApprovePlotNews = async (plotNewsId: number) => {
    setApproving(plotNewsId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/plot-news/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Authorization': `Bearer ${token}` },
        body: JSON.stringify({ plotNewsId, userId }),
      });
      if (response.ok) {
        setPlotNewsSubmissions(prev => prev.filter(s => s.PlotNewsID !== plotNewsId));
        setMessage({ type: 'success', text: 'Plot news approved!' });
        loadPlotNewsSubmissions();
      } else {
        setMessage({ type: 'error', text: 'Failed to approve' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to approve' });
    } finally {
      setApproving(null);
    }
  };

  const handleDeletePlotNews = async (submission: PlotNewsSubmission) => {
    setDeleting(submission.PlotNewsID);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/plot-news/${submission.PlotNewsID}`, {
        method: 'DELETE',
        headers: { 'X-Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        setPlotNewsSubmissions(prev => prev.filter(s => s.PlotNewsID !== submission.PlotNewsID));
        setDeleteConfirm(null);
        setMessage({ type: 'success', text: 'Deleted!' });
        loadPlotNewsSubmissions();
      } else {
        setMessage({ type: 'error', text: 'Failed to delete' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete' });
    } finally {
      setDeleting(null);
    }
  };

  const handleEditPlotNews = (submission: PlotNewsSubmission) => {
    setEditingId(submission.PlotNewsID);
    setEditForm({
      packNames: (submission.PackNames || '').split(',').filter(Boolean),
      newsText: submission.NewsText || '',
      threadURL: submission.ThreadURL || '',
    });
  };

  const handleSaveEditPlotNews = async (submission: PlotNewsSubmission) => {
    try {
      const token = localStorage.getItem('token');
      const oldIds = (submission.AllIds || String(submission.PlotNewsID)).split(',').map(Number);
      const oldPackNames = (submission.PackNames || '').split(',').filter(Boolean);
      const newPackNames = editForm.packNames;

      // Update text/URL on all existing rows that are staying
      const keptPacks = oldPackNames.filter(p => newPackNames.includes(p));
      for (let i = 0; i < oldPackNames.length; i++) {
        if (keptPacks.includes(oldPackNames[i])) {
          await fetch(`/api/plot-news/${oldIds[i]}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Authorization': `Bearer ${token}` },
            body: JSON.stringify({ newsText: editForm.newsText, threadURL: editForm.threadURL || null }),
          });
        }
      }

      // Delete rows for removed packs
      for (let i = 0; i < oldPackNames.length; i++) {
        if (!newPackNames.includes(oldPackNames[i]) && oldIds[i]) {
          await fetch(`/api/plot-news/${oldIds[i]}`, {
            method: 'DELETE',
            headers: { 'X-Authorization': `Bearer ${token}` },
          });
        }
      }

      // Insert rows for added packs
      const addedPacks = newPackNames.filter(p => !oldPackNames.includes(p));
      for (const packName of addedPacks) {
        await fetch('/api/plot-news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            packName,
            newsText: editForm.newsText,
            threadURL: editForm.threadURL || null,
            userId: submission.SubmittedByUserID,
          }),
        });
      }

      setEditingId(null);
      setMessage({ type: 'success', text: 'Updated!' });
      loadPlotNewsSubmissions();
    } catch {
      setMessage({ type: 'error', text: 'Failed to update' });
    }
  };

  const toggleEditPack = (packName: string) => {
    setEditForm(prev => ({
      ...prev,
      packNames: prev.packNames.includes(packName)
        ? prev.packNames.filter(p => p !== packName)
        : [...prev.packNames, packName],
    }));
  };

  function packBadge(packName: string) {
    const pack = packs.find(p => p.name === packName);
    const isRogue = packName === 'Rogue';
    const initials = isRogue
      ? 'R'
      : packName.split(' ').length > 1
        ? packName.split(' ').map(w => w.charAt(0).toUpperCase()).join('')
        : packName.slice(0, 2).toUpperCase();
    return (
      <span
        key={packName}
        className="inline-block w-7 text-center py-0.5 text-[11px] font-medium rounded-sm"
        title={packName}
        style={
          pack
            ? { backgroundColor: `${pack.color1}25`, color: pack.color1, border: `1px solid ${pack.color1}40` }
            : { backgroundColor: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' }
        }
      >
        {initials}
      </span>
    );
  }

  function renderPackBadges(packNames: string) {
    return (packNames || '').split(',').filter(Boolean).map(name => packBadge(name));
  }

  if (!isModerator) {
    return (
      <div className="max-w-3xl mx-auto py-8 text-center text-gray-500">You do not have permission to view this page.</div>
    );
  }

  const loading = bulletinLoading || updatesLoading || plotNewsLoading;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-8 text-center text-gray-400">Loading...</div>
    );
  }

  const activePacks = packs.filter(p => p.isActive);

  return (
    <div className="space-y-4">
      {/* Toast */}
      {message && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium ${
            message.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* ─── PLOT NEWS ─── */}
      <section className="bg-white border border-gray-300 shadow">
        <div className="bg-[#2f3a2f] px-4 py-2 flex items-center justify-between dark-header">
          <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">Plot News</h2>
          {plotNewsSubmissions.length > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full">
              {plotNewsSubmissions.length}
            </span>
          )}
        </div>

        <div className="divide-y divide-gray-100">
          {plotNewsSubmissions.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">No pending submissions.</div>
          ) : (
            plotNewsSubmissions.map(submission =>
              editingId === submission.PlotNewsID ? (
                /* ── Edit Mode ── */
                <div key={submission.PlotNewsID} className="px-4 py-4 bg-gray-50/50 space-y-3">
                  {/* Pack selection */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Packs</label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleEditPack('Rogue')}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors ${
                          editForm.packNames.includes('Rogue')
                            ? 'bg-gray-200 border-gray-400 text-gray-700'
                            : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                        }`}
                      >
                        <span className="inline-block w-5 text-center text-[10px] font-medium rounded-sm bg-gray-100 text-gray-500">R</span>
                        Rogues
                      </button>
                      {activePacks.map(pack => {
                        const initials = pack.name.split(' ').length > 1
                          ? pack.name.split(' ').map(w => w.charAt(0).toUpperCase()).join('')
                          : pack.name.slice(0, 2).toUpperCase();
                        const selected = editForm.packNames.includes(pack.name);
                        return (
                          <button
                            key={pack.id}
                            type="button"
                            onClick={() => toggleEditPack(pack.name)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors ${
                              selected
                                ? 'border-current'
                                : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                            }`}
                            style={selected ? { backgroundColor: `${pack.color1}15`, color: pack.color1, borderColor: `${pack.color1}60` } : {}}
                          >
                            <span
                              className="inline-block w-5 text-center text-[10px] font-medium rounded-sm"
                              style={selected ? { backgroundColor: `${pack.color1}25`, color: pack.color1 } : { backgroundColor: '#f3f4f6', color: '#9ca3af' }}
                            >
                              {initials}
                            </span>
                            {pack.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* News text */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">News Text</label>
                    <textarea
                      value={editForm.newsText}
                      onChange={e => { if (e.target.value.length <= 150) setEditForm(prev => ({ ...prev, newsText: e.target.value })); }}
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2f3a2f]/20 focus:border-[#2f3a2f]/40 resize-none"
                      rows={2}
                    />
                    <div className="text-[11px] text-gray-400 text-right mt-0.5">{editForm.newsText.length}/150</div>
                  </div>

                  {/* Thread URL */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Thread URL</label>
                    <input
                      type="url"
                      value={editForm.threadURL}
                      onChange={e => setEditForm(prev => ({ ...prev, threadURL: e.target.value }))}
                      placeholder="https://..."
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2f3a2f]/20 focus:border-[#2f3a2f]/40"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleSaveEditPlotNews(submission)}
                      disabled={editForm.packNames.length === 0}
                      className="px-3.5 py-1.5 text-xs font-medium bg-[#2f3a2f] text-white rounded hover:bg-[#3a4a3a] disabled:opacity-40 transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* ── View Mode ── */
                <div
                  key={submission.PlotNewsID}
                  className="px-4 py-3 flex items-start gap-3 group hover:bg-gray-50/50 transition-colors"
                >
                  {/* Pack badges */}
                  <div className="flex gap-1 pt-0.5 shrink-0">
                    {renderPackBadges(submission.PackNames)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 leading-relaxed">{submission.NewsText}</p>
                    {submission.ThreadURL && (
                      <a
                        href={submission.ThreadURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:text-blue-600 hover:underline mt-0.5 block truncate"
                      >
                        {submission.ThreadTitle || submission.ThreadURL}
                      </a>
                    )}
                    <div className="text-[11px] text-gray-400 mt-1">
                      {submission.SubmittedByUsername || 'Unknown'} · {new Date(submission.SubmittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleApprovePlotNews(submission.PlotNewsID)}
                      disabled={approving === submission.PlotNewsID}
                      className="w-7 h-7 flex items-center justify-center rounded text-green-600 hover:bg-green-50 disabled:opacity-40 transition-colors"
                      title="Approve"
                    >
                      {approving === submission.PlotNewsID ? (
                        <span className="w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      )}
                    </button>
                    <button
                      onClick={() => handleEditPlotNews(submission)}
                      className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      title="Edit"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(submission)}
                      disabled={deleting === submission.PlotNewsID}
                      className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-40 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </section>

      {/* ─── SITEWIDE UPDATES ─── */}
      <section className="bg-white border border-gray-300 shadow">
        <div className="bg-[#2f3a2f] px-4 py-2 dark-header">
          <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">Sitewide Updates</h2>
        </div>
        <div className="px-4 py-4">
          <textarea
            value={newUpdateContent}
            onChange={e => setNewUpdateContent(e.target.value)}
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2f3a2f]/20 focus:border-[#2f3a2f]/40 resize-none"
            rows={3}
            placeholder="Enter update content (HTML supported)..."
          />
          <div className="mt-2 flex justify-between items-center">
            <span className="text-xs text-gray-400">
              3 most recent shown on home page. <Link to="/sitewide-updates" className="text-gray-500 hover:underline font-medium">View All</Link>
            </span>
            <button
              onClick={handleAddUpdate}
              disabled={submitting || !newUpdateContent.trim()}
              className="px-4 py-1.5 bg-[#2f3a2f] text-white text-xs font-medium rounded hover:bg-[#3a4a3a] disabled:opacity-40 transition-colors"
            >
              {submitting ? 'Adding...' : 'Add Update'}
            </button>
          </div>
        </div>
      </section>

      {/* ─── BULLETIN ─── */}
      <section className="bg-white border border-gray-300 shadow">
        <div className="bg-[#2f3a2f] px-4 py-2 flex items-center justify-between dark-header">
          <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">Bulletin</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <div className={`relative w-9 h-5 rounded-full transition-colors ${bulletinEnabled ? 'bg-green-500' : 'bg-gray-400'}`}>
              <input
                type="checkbox"
                checked={bulletinEnabled}
                onChange={e => setBulletinEnabled(e.target.checked)}
                className="sr-only"
              />
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${bulletinEnabled ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-[11px] uppercase tracking-wider text-[#fff9]/70 font-medium">
              {bulletinEnabled ? 'On' : 'Off'}
            </span>
          </label>
        </div>
        <div className="px-4 py-4 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Content (HTML)</label>
            <textarea
              value={bulletinContent}
              onChange={e => setBulletinContent(e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#2f3a2f]/20 focus:border-[#2f3a2f]/40 resize-none"
              rows={3}
              placeholder="Bulletin content..."
            />
          </div>

          {/* Preview */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Preview</label>
            <div className="border border-gray-200 rounded bg-[#e5ebd4] px-4 py-2.5">
              <div className="text-gray-800 text-[13px]">
                <span className="text-[#81973b]">• Bulletin—</span>{' '}
                {bulletinContent ? (
                  <span className="bulletin-content" dangerouslySetInnerHTML={{ __html: bulletinContent }} />
                ) : (
                  <span className="text-gray-400 italic">No content</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveBulletin}
            disabled={bulletinSaving}
            className="px-4 py-1.5 bg-[#2f3a2f] text-white text-xs font-medium rounded hover:bg-[#3a4a3a] disabled:opacity-40 transition-colors"
          >
            {bulletinSaving ? 'Saving...' : 'Save Bulletin'}
          </button>
        </div>
      </section>

      {/* ─── Delete Confirmation ─── */}}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Delete this submission?</h3>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <div className="flex gap-1 shrink-0">{renderPackBadges(deleteConfirm.PackNames)}</div>
                <p className="text-sm text-gray-600">{deleteConfirm.NewsText}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded transition-colors"
                disabled={deleting !== null}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePlotNews(deleteConfirm)}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                disabled={deleting !== null}
              >
                {deleting !== null ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
