'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Film,
  FileText,
  Palette,
  Trash2,
  Download,
  Search,
  Filter,
  FolderOpen,
  X,
  CheckCircle,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type FileType = 'image' | 'video' | 'graphic' | 'document' | 'all';

interface Asset {
  id: string;
  name: string;
  file_name: string;
  storage_path: string;
  public_url: string | null;
  file_type: 'image' | 'video' | 'graphic' | 'document';
  mime_type: string | null;
  file_size_bytes: number | null;
  category: string;
  tags: string[];
  uploaded_by: string;
  manager_name: string | null;
  notes: string | null;
  created_at: string;
}

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  error?: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  image: <ImageIcon className="w-5 h-5" />,
  video: <Film className="w-5 h-5" />,
  graphic: <Palette className="w-5 h-5" />,
  document: <FileText className="w-5 h-5" />,
};

const TYPE_COLORS: Record<string, string> = {
  image: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  video: 'bg-red-500/20 text-red-400 border-red-500/30',
  graphic: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  document: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

const MANAGERS = ['Manager 1', 'Manager 2'];

function guessFileType(mime: string): 'image' | 'video' | 'graphic' | 'document' {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime === 'application/pdf') return 'document';
  if (mime.includes('illustrator') || mime.includes('svg') || mime.includes('photoshop')) return 'graphic';
  return 'document';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AssetsLibrary() {
  const supabase = createClient();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<FileType>('all');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [uploadManager, setUploadManager] = useState(MANAGERS[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load assets from Supabase
  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trinity_assets')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setAssets(data as Asset[]);
    } catch (e) {
      console.error('Failed to load assets', e);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Load on mount
  useEffect(() => { loadAssets(); }, [loadAssets]);

  const handleFiles = async (files: FileList | File[]) => {
    const fileArr = Array.from(files);

    for (const file of fileArr) {
      const uploadId = crypto.randomUUID();
      const fileType = guessFileType(file.type);
      const ext = file.name.split('.').pop();
      const storagePath = `uploads/${Date.now()}-${uploadId}.${ext}`;

      setUploading((prev) => [
        ...prev,
        { id: uploadId, name: file.name, progress: 0, status: 'uploading' },
      ]);

      try {
        // Upload to Supabase Storage
        const { error: storageError } = await supabase.storage
          .from('trinity-assets')
          .upload(storagePath, file, { cacheControl: '3600', upsert: false });

        if (storageError) throw storageError;

        setUploading((prev) =>
          prev.map((u) => (u.id === uploadId ? { ...u, progress: 70 } : u))
        );

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('trinity-assets')
          .getPublicUrl(storagePath);

        // Save to DB
        const { error: dbError } = await supabase.from('trinity_assets').insert({
          name: file.name.replace(/\.[^/.]+$/, ''),
          file_name: file.name,
          storage_path: storagePath,
          public_url: urlData?.publicUrl ?? null,
          file_type: fileType,
          mime_type: file.type,
          file_size_bytes: file.size,
          manager_name: uploadManager,
          uploaded_by: uploadManager,
        });

        if (dbError) throw dbError;

        setUploading((prev) =>
          prev.map((u) => (u.id === uploadId ? { ...u, progress: 100, status: 'done' } : u))
        );

        // Refresh list
        await loadAssets();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        setUploading((prev) =>
          prev.map((u) =>
            u.id === uploadId ? { ...u, status: 'error', error: message } : u
          )
        );
      }
    }

    // Clear done uploads after 3s
    setTimeout(() => {
      setUploading((prev) => prev.filter((u) => u.status !== 'done'));
    }, 3000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };

  const handleDelete = async (asset: Asset) => {
    if (!confirm(`Delete "${asset.name}"?`)) return;
    await supabase.storage.from('trinity-assets').remove([asset.storage_path]);
    await supabase.from('trinity_assets').delete().eq('id', asset.id);
    setAssets((prev) => prev.filter((a) => a.id !== asset.id));
    if (selectedAsset?.id === asset.id) setSelectedAsset(null);
  };

  const filtered = assets.filter((a) => {
    const matchType = filterType === 'all' || a.file_type === filterType;
    const matchSearch =
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.manager_name ?? '').toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const counts = {
    all: assets.length,
    image: assets.filter((a) => a.file_type === 'image').length,
    video: assets.filter((a) => a.file_type === 'video').length,
    graphic: assets.filter((a) => a.file_type === 'graphic').length,
    document: assets.filter((a) => a.file_type === 'document').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Assets Library</h2>
          <p className="text-white/50 text-sm mt-0.5">
            Upload and manage images, videos, graphics, and documents
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={uploadManager}
            onChange={(e) => setUploadManager(e.target.value)}
            className="bg-white/5 border border-white/10 text-white/80 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
            title="Select manager"
          >
            {MANAGERS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold px-4 py-2 rounded-xl hover:shadow-lg hover:shadow-amber-500/20 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Upload Assets
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.svg,.ai,.psd"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            title="Upload files"
          />
        </div>
      </div>

      {/* Upload Progress */}
      {uploading.length > 0 && (
        <div className="space-y-2">
          {uploading.map((u) => (
            <div key={u.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
              {u.status === 'done' ? (
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
              ) : u.status === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              ) : (
                <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 truncate">{u.name}</p>
                {u.status === 'uploading' && (
                  <div className="mt-1 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 transition-all duration-300"
                      style={{ width: `${u.progress}%` }}
                    />
                  </div>
                )}
                {u.status === 'error' && (
                  <p className="text-xs text-red-400 mt-0.5">{u.error}</p>
                )}
              </div>
              <span className="text-xs text-white/40">
                {u.status === 'done' ? 'Done' : u.status === 'error' ? 'Failed' : `${u.progress}%`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-amber-400 bg-amber-400/10'
            : 'border-white/10 bg-white/2 hover:border-white/20 hover:bg-white/5'
        }`}
      >
        <Upload className={`w-8 h-8 mx-auto mb-3 ${isDragging ? 'text-amber-400' : 'text-white/30'}`} />
        <p className="text-white/50 text-sm">
          Drop files here or <span className="text-amber-400 font-medium">browse to upload</span>
        </p>
        <p className="text-white/30 text-xs mt-1">Images, Videos, PDFs, SVGs, AI, PSD files</p>
      </div>

      {/* Filter + Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets..."
            className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'image', 'video', 'graphic', 'document'] as FileType[]).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                filterType === type
                  ? 'bg-amber-400 text-black'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
              }`}
            >
              {type !== 'all' && TYPE_ICONS[type]}
              <span className="capitalize">{type}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                filterType === type ? 'bg-black/20 text-black/80' : 'bg-white/10 text-white/40'
              }`}>
                {counts[type]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Assets Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white/5 rounded-xl aspect-square animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">
            {assets.length === 0 ? 'No assets yet — upload your first file above' : 'No assets match your filter'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((asset) => (
            <div
              key={asset.id}
              onClick={() => setSelectedAsset(asset)}
              className="group relative bg-white/5 border border-white/10 rounded-xl overflow-hidden cursor-pointer hover:border-amber-500/50 hover:bg-white/8 transition-all"
            >
              {/* Thumbnail */}
              <div className="aspect-square flex items-center justify-center bg-black/20">
                {asset.file_type === 'image' && asset.public_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={asset.public_url}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                ) : asset.file_type === 'video' && asset.public_url ? (
                  <video
                    src={asset.public_url}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-white/20">
                    {TYPE_ICONS[asset.file_type]}
                    <span className="text-xs uppercase">{asset.file_type}</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-2">
                <p className="text-xs text-white/70 truncate font-medium">{asset.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded border ${TYPE_COLORS[asset.file_type]}`}>
                    {asset.file_type}
                  </span>
                  {asset.file_size_bytes && (
                    <span className="text-xs text-white/30">{formatBytes(asset.file_size_bytes)}</span>
                  )}
                </div>
                {asset.manager_name && (
                  <p className="text-xs text-white/30 mt-1 truncate">{asset.manager_name}</p>
                )}
              </div>

              {/* Hover Actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {asset.public_url && (
                  <a
                    href={asset.public_url}
                    download={asset.file_name}
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4 text-white" />
                  </a>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(asset); }}
                  className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="font-bold text-white">{selectedAsset.name}</h3>
              <button
                onClick={() => setSelectedAsset(null)}
                className="p-1.5 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Preview */}
              <div className="bg-black/30 rounded-xl overflow-hidden flex items-center justify-center h-48">
                {selectedAsset.file_type === 'image' && selectedAsset.public_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedAsset.public_url}
                    alt={selectedAsset.name}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : selectedAsset.file_type === 'video' && selectedAsset.public_url ? (
                  <video
                    src={selectedAsset.public_url}
                    controls
                    className="max-h-full max-w-full"
                  />
                ) : (
                  <div className="text-white/20 flex flex-col items-center gap-2">
                    {TYPE_ICONS[selectedAsset.file_type]}
                    <span className="text-sm">{selectedAsset.file_name}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-white/40 text-xs mb-1">Type</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs ${TYPE_COLORS[selectedAsset.file_type]}`}>
                    {TYPE_ICONS[selectedAsset.file_type]}
                    {selectedAsset.file_type}
                  </span>
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">Size</p>
                  <p className="text-white/80">
                    {selectedAsset.file_size_bytes ? formatBytes(selectedAsset.file_size_bytes) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">Uploaded by</p>
                  <p className="text-white/80">{selectedAsset.manager_name || 'Admin'}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">Date</p>
                  <p className="text-white/80">
                    {new Date(selectedAsset.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {selectedAsset.public_url && (
                <div>
                  <p className="text-white/40 text-xs mb-1">Public URL</p>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={selectedAsset.public_url}
                      className="flex-1 bg-white/5 border border-white/10 text-white/60 text-xs rounded-lg px-3 py-2 truncate"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(selectedAsset.public_url!)}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white/60 rounded-lg text-xs transition-colors whitespace-nowrap"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 px-5 pb-5">
              {selectedAsset.public_url && (
                <a
                  href={selectedAsset.public_url}
                  download={selectedAsset.file_name}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              )}
              <button
                onClick={() => handleDelete(selectedAsset)}
                className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
