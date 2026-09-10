import React, { useState, useEffect, useRef } from 'react';
import {
  FolderArchive,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  BookOpen,
  Trash2,
  Eye,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Shield,
  Layers,
  ChevronRight,
  X,
  FileUp,
  Link,
  Check,
  Filter,
  Download,
  Bot,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { LearningResource, ResourceType, ResourceStatus, ResourceVisibility } from '../../types/index.js';
import { useLearner } from '../../context/LearnerContext.js';

export const AdminResourceStudioView: React.FC = () => {
  const { askTutorWithContext, setActiveSection } = useLearner();

  // Drive Status State
  const [driveStatus, setDriveStatus] = useState<{
    connected: boolean;
    accountEmail?: string;
    folders?: any;
    lastSync?: string;
  }>({ connected: false });
  const [loadingDrive, setLoadingDrive] = useState<boolean>(true);

  // Resources State
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loadingResources, setLoadingResources] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadAuthor, setUploadAuthor] = useState<string>('');
  const [uploadDescription, setUploadDescription] = useState<string>('');
  const [uploadTags, setUploadTags] = useState<string>('');
  const [uploadType, setUploadType] = useState<ResourceType>('BOOK');
  const [uploadSubject, setUploadSubject] = useState<string>('Indian Polity');
  const [uploadTopic, setUploadTopic] = useState<string>('');
  const [uploadExam, setUploadExam] = useState<string>('UPSC CSE');
  const [uploadVisibility, setUploadVisibility] = useState<ResourceVisibility>('ALL_LEARNERS');
  const [uploadAutoPublish, setUploadAutoPublish] = useState<boolean>(true);

  // Book Ingestion Metadata (Requirement 1, 2)
  const [uploadEdition, setUploadEdition] = useState<string>('');
  const [uploadPubYear, setUploadPubYear] = useState<string>('');
  const [uploadPublisher, setUploadPublisher] = useState<string>('');
  const [uploadLanguage, setUploadLanguage] = useState<string>('English');
  const [uploadIsbn, setUploadIsbn] = useState<string>('');
  const [uploadLicenseStatus, setUploadLicenseStatus] = useState<string>('REQUIRES_REVIEW');
  const [uploadCoverImageUrl, setUploadCoverImageUrl] = useState<string>('');
  const [uploadSourceAttribution, setUploadSourceAttribution] = useState<string>('');
  const [duplicateWarning, setDuplicateWarning] = useState<{ message: string; existing: any } | null>(null);
  const [forceDuplicateUpload, setForceDuplicateUpload] = useState<boolean>(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStage, setUploadStage] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // PDF Preview Modal
  const [previewResource, setPreviewResource] = useState<LearningResource | null>(null);

  // Ingestion Review & RAG Chunks Modal (Requirement 10)
  const [reviewResource, setReviewResource] = useState<LearningResource | null>(null);
  const [reviewDetails, setReviewDetails] = useState<any | null>(null);
  const [loadingReview, setLoadingReview] = useState<boolean>(false);
  const [reprocessing, setReprocessing] = useState<boolean>(false);
  const [reprocessMessage, setReprocessMessage] = useState<string | null>(null);

  // Grounding Test Modal
  const [groundingTestResource, setGroundingTestResource] = useState<LearningResource | null>(null);
  const [groundingQuestion, setGroundingQuestion] = useState<string>('');
  const [groundingAnswer, setGroundingAnswer] = useState<string>('');
  const [testingGrounding, setTestingGrounding] = useState<boolean>(false);

  // Load Status & Resources
  const fetchStatus = async () => {
    setLoadingDrive(true);
    try {
      const st = await api.getDriveStatus();
      setDriveStatus(st);
    } catch (err) {
      console.error('Failed to fetch Drive status:', err);
    } finally {
      setLoadingDrive(false);
    }
  };

  const fetchResources = async () => {
    setLoadingResources(true);
    try {
      const data = await api.getAdminResources({
        type: filterType !== 'ALL' ? filterType : undefined,
        status: filterStatus !== 'ALL' ? filterStatus : undefined,
        search: searchQuery || undefined,
        limit: 50,
      });
      setResources(data.resources);
      setTotalCount(data.total);
    } catch (err) {
      console.error('Failed to fetch admin resources:', err);
    } finally {
      setLoadingResources(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    fetchResources();
  }, [filterType, filterStatus, searchQuery]);

  // Check URL params for OAuth callback return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('drive_connected') === 'true') {
      fetchStatus();
      // Clean query param
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const handleConnectDrive = () => {
    window.location.href = '/api/auth/google';
  };

  const handleDisconnectDrive = async () => {
    if (!window.confirm('Disconnect Google Drive from IKSHOVIA? Existing uploaded files on Drive will remain safe.')) return;
    try {
      await api.disconnectDrive();
      await fetchStatus();
    } catch (err: any) {
      alert(err.message || 'Failed to disconnect');
    }
  };

  const handleEnsureFolders = async () => {
    try {
      const res = await api.ensureDriveFolders();
      alert('IKSHOVIA Google Drive folders verified successfully: Resources, Official-Documents, IKSHOVIA-Notes.');
      await fetchStatus();
    } catch (err: any) {
      alert(err.message || 'Failed to verify Drive folders');
    }
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      alert('Only PDF documents are supported for Resource Library storage.');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      alert('File size exceeds the 100MB limit.');
      return;
    }

    setSelectedFile(file);
    if (!uploadTitle) {
      // Pre-fill title from clean filename
      const cleanTitle = file.name
        .replace(/\.pdf$/i, '')
        .replace(/[_-]+/g, ' ')
        .trim();
      setUploadTitle(cleanTitle);
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Execute Upload & Pipeline
  const handleUploadSubmit = async (e?: React.FormEvent, overrideDuplicate: boolean = false) => {
    if (e) e.preventDefault();
    if (!selectedFile || !fileBase64) {
      setUploadError('Please select a valid PDF file.');
      return;
    }
    if (!uploadTitle.trim()) {
      setUploadError('Please specify a title for this resource.');
      return;
    }
    if (!driveStatus.connected) {
      setUploadError('Google Drive must be connected before uploading resources.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setDuplicateWarning(null);
    setUploadStage('Initiating Resumable Upload to Google Drive...');

    try {
      setTimeout(() => setUploadStage('Uploading binary stream to Google Drive...'), 1500);
      setTimeout(() => setUploadStage('Extracting document text & running OCR scan...'), 3500);
      setTimeout(() => setUploadStage('Chunking page-aware knowledge & indexing for AI Tutor...'), 5500);

      const parsedTags = uploadTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await api.uploadResource({
        pdfBase64: fileBase64,
        fileName: selectedFile.name,
        title: uploadTitle.trim(),
        author: uploadAuthor.trim() || 'IKSHOVIA Faculty',
        description: uploadDescription.trim(),
        tags: parsedTags,
        resourceType: uploadType,
        subject: uploadSubject,
        topic: uploadTopic.trim(),
        exam: uploadExam,
        visibility: uploadVisibility,
        autoPublish: uploadAutoPublish,
        edition: uploadEdition.trim() || undefined,
        publicationYear: uploadPubYear ? Number(uploadPubYear) : undefined,
        publisher: uploadPublisher.trim() || undefined,
        language: uploadLanguage.trim() || undefined,
        isbn: uploadIsbn.trim() || undefined,
        licenseStatus: uploadLicenseStatus || undefined,
        coverImageUrl: uploadCoverImageUrl.trim() || undefined,
        sourceAttribution: uploadSourceAttribution.trim() || undefined,
        allowDuplicate: overrideDuplicate || forceDuplicateUpload,
      });

      setUploadStage('Ingestion completed successfully!');
      setTimeout(() => {
        setIsUploading(false);
        setShowUploadModal(false);
        // Reset form
        setSelectedFile(null);
        setFileBase64('');
        setUploadTitle('');
        setUploadAuthor('');
        setUploadDescription('');
        setUploadTags('');
        setUploadEdition('');
        setUploadPubYear('');
        setUploadPublisher('');
        setUploadIsbn('');
        setUploadCoverImageUrl('');
        setUploadSourceAttribution('');
        setDuplicateWarning(null);
        setForceDuplicateUpload(false);
        fetchResources();
      }, 1200);
    } catch (err: any) {
      setIsUploading(false);
      if (err.code === 'DUPLICATE_DETECTED') {
        setDuplicateWarning({
          message: err.message || 'A similar book already exists.',
          existing: err.existing,
        });
        return;
      }
      setUploadError(err.message || 'Failed to ingest resource');
    }
  };

  const handleOpenReview = async (res: LearningResource) => {
    setReviewResource(res);
    setLoadingReview(true);
    setReprocessMessage(null);
    try {
      const details = await api.getResourceReview(res.id);
      setReviewDetails(details);
    } catch (err: any) {
      console.error('Failed to load review details:', err);
    } finally {
      setLoadingReview(false);
    }
  };

  const handleReprocess = async (resourceId: string) => {
    setReprocessing(true);
    setReprocessMessage(null);
    try {
      await api.reprocessResource(resourceId);
      const updatedDetails = await api.getResourceReview(resourceId);
      setReviewDetails(updatedDetails);
      setReprocessMessage('Text extraction and RAG knowledge chunks re-indexed successfully!');
      fetchResources();
    } catch (err: any) {
      setReprocessMessage(`Reprocessing failed: ${err.message}`);
    } finally {
      setReprocessing(false);
    }
  };

  const handleStatusChange = async (resource: LearningResource, newStatus: ResourceStatus) => {
    try {
      await api.updateResource(resource.id, { status: newStatus });
      fetchResources();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleDeleteResource = async (resource: LearningResource) => {
    if (!window.confirm(`Are you sure you want to delete "${resource.title}"? This will also remove the file from Google Drive.`)) return;
    try {
      await api.deleteResource(resource.id);
      fetchResources();
    } catch (err: any) {
      alert(err.message || 'Failed to delete resource');
    }
  };

  // Run Grounding Test
  const handleTestGrounding = async () => {
    if (!groundingTestResource || !groundingQuestion.trim()) return;
    setTestingGrounding(true);
    setGroundingAnswer('');

    try {
      const res = await fetch('/api/ai/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: groundingQuestion,
          conceptId: groundingTestResource.conceptId || undefined,
          context: {
            resourceId: groundingTestResource.id,
            resourceTitle: groundingTestResource.title,
            subjectName: groundingTestResource.subject,
          },
        }),
      });

      if (!res.ok) throw new Error('AI Tutor grounding query failed');
      const data = await res.json();
      setGroundingAnswer(data.answer || 'No response returned from AI Tutor.');
    } catch (err: any) {
      setGroundingAnswer(`⚠️ Error testing grounding: ${err.message}`);
    } finally {
      setTestingGrounding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header & Overview */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/10 text-amber-700 rounded-lg">
                <FolderArchive className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-stone-900">Resource Studio</h1>
            </div>
            <p className="text-sm text-stone-600 mt-1">
              Google Drive Resource Storage, Resumable Upload Pipeline & RAG Knowledge Grounding
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            {driveStatus.connected ? (
              <>
                <button
                  onClick={handleEnsureFolders}
                  className="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition flex items-center gap-2"
                  title="Verify IKSHOVIA/Resources, Books, Official-Documents, Notes folder hierarchy"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Verify Folders
                </button>
                <button
                  onClick={() => {
                    setUploadType('BOOK');
                    setDuplicateWarning(null);
                    setForceDuplicateUpload(false);
                    setShowUploadModal(true);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition shadow-sm flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  Upload Book
                </button>
                <button
                  onClick={() => {
                    setUploadType('NOTES');
                    setDuplicateWarning(null);
                    setForceDuplicateUpload(false);
                    setShowUploadModal(true);
                  }}
                  className="px-3.5 py-2 text-sm font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition flex items-center gap-2"
                >
                  <FileUp className="w-4 h-4" />
                  Upload Document / Note
                </button>
              </>
            ) : (
              <button
                onClick={handleConnectDrive}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm flex items-center gap-2"
              >
                <Link className="w-4 h-4" />
                Connect Google Drive
              </button>
            )}
          </div>
        </div>

        {/* Drive Integration Status Banner */}
        <div className="mt-5 p-4 rounded-xl border bg-stone-50/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${driveStatus.connected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            <div>
              <span className="font-semibold text-stone-800">
                {driveStatus.connected ? 'Google Drive Storage Active' : 'Google Drive Disconnected'}
              </span>
              {driveStatus.connected && (
                <span className="text-stone-500 ml-2">
                  (Account: <strong className="text-stone-700">{driveStatus.accountEmail}</strong>)
                </span>
              )}
              {!driveStatus.connected && (
                <span className="text-amber-700 ml-2">
                  Connect the dedicated IKSHOVIA Google account to enable PDF uploads.
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-stone-500">
            {driveStatus.connected && (
              <>
                <span>Folders: <code className="text-stone-700 font-mono">IKSHOVIA/Resources</code></span>
                <button
                  onClick={handleDisconnectDrive}
                  className="text-red-600 hover:text-red-700 font-medium hover:underline"
                >
                  Disconnect
                </button>
              </>
            )}
            {!driveStatus.connected && (
              <button
                onClick={handleConnectDrive}
                className="font-semibold text-blue-600 hover:underline"
              >
                Authorize via Google OAuth 2.0 →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Total Resources</span>
            <BookOpen className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-stone-900 mt-2">{totalCount}</p>
          <span className="text-xs text-stone-500 mt-1 block">In IKSHOVIA Drive storage</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Published Resources</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-stone-900 mt-2">
            {resources.filter(r => r.status === 'PUBLISHED').length}
          </p>
          <span className="text-xs text-stone-500 mt-1 block">Visible in learner library</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Processing / Ready</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-stone-900 mt-2">
            {resources.filter(r => r.status === 'READY' || r.status === 'PROCESSING').length}
          </p>
          <span className="text-xs text-stone-500 mt-1 block">Extracted & indexed</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">RAG Grounded</span>
            <Bot className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-stone-900 mt-2">Active</p>
          <span className="text-xs text-stone-500 mt-1 block">Page-aware citations enabled</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, author, topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider mr-1">Type:</span>
          {['ALL', 'BOOK', 'OFFICIAL_DOCUMENT', 'NOTES', 'SYLLABUS'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                filterType === t
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {t === 'ALL' ? 'All Types' : t.replace('_', ' ')}
            </button>
          ))}

          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider ml-2 mr-1">Status:</span>
          {['ALL', 'PUBLISHED', 'READY', 'DRAFT'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                filterStatus === s
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {loadingResources ? (
          <div className="py-16 text-center text-stone-400 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
            <span className="text-sm">Loading resource repository...</span>
          </div>
        ) : resources.length === 0 ? (
          <div className="py-16 text-center text-stone-500 px-4">
            <BookOpen className="w-10 h-10 mx-auto text-stone-300 mb-2" />
            <h3 className="text-base font-semibold text-stone-800">No resources found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
              Upload PDF books, official notifications, or high-yield notes to store them in Google Drive and index them for AI Tutor.
            </p>
            {driveStatus.connected && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition inline-flex items-center gap-2"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload First Resource
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-stone-600 uppercase text-[11px] font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-3.5 px-4">Resource</th>
                  <th className="py-3.5 px-4">Type & Subject</th>
                  <th className="py-3.5 px-4">Exam</th>
                  <th className="py-3.5 px-4">Pages / Size</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {resources.map((res) => (
                  <tr key={res.id} className="hover:bg-stone-50/70 transition">
                    {/* Title & Author */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-stone-900 truncate" title={res.title}>
                        {res.title}
                      </div>
                      <div className="text-xs text-stone-500 truncate flex items-center gap-1.5 mt-0.5">
                        <span>By {res.author || 'IKSHOVIA Faculty'}</span>
                        {res.edition && (
                          <span className="px-1.5 py-0.2 bg-stone-100 text-stone-600 rounded text-[10px] font-medium border border-stone-200">
                            {res.edition}
                          </span>
                        )}
                        {res.publication_year && (
                          <span className="text-[10px] text-stone-400">
                            ({res.publication_year})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Type & Subject */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        {res.resource_type || res.type || 'BOOK'}
                      </span>
                      <div className="text-xs text-stone-500 mt-0.5">{res.subject || res.subjectId}</div>
                    </td>

                    {/* Exam */}
                    <td className="py-3.5 px-4 text-xs font-medium text-stone-600">
                      {res.exam || res.examTag || 'ALL'}
                    </td>

                    {/* Pages & Size */}
                    <td className="py-3.5 px-4 text-xs text-stone-500">
                      <div>{res.page_count || 1} pages</div>
                      <div className="text-[11px] text-stone-400">
                        {res.file_size ? `${(res.file_size / 1024 / 1024).toFixed(2)} MB` : 'PDF'}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          res.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : res.status === 'READY'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : res.status === 'PROCESSING' || res.status === 'UPLOADING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {res.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Review Ingestion & Knowledge Chunks */}
                        <button
                          onClick={() => handleOpenReview(res)}
                          className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition"
                          title="Review Ingestion, OCR & Knowledge Chunks"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>

                        {/* Preview PDF */}
                        <button
                          onClick={() => setPreviewResource(res)}
                          className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition"
                          title="Preview Document Stream"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Test AI Tutor Grounding */}
                        <button
                          onClick={() => {
                            setGroundingTestResource(res);
                            setGroundingQuestion(`Explain the key concepts of this resource: ${res.title}`);
                            setGroundingAnswer('');
                          }}
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition"
                          title="Test AI Tutor Grounded Retrieval & Citations"
                        >
                          <Bot className="w-4 h-4" />
                        </button>

                        {/* Toggle Publish / Unpublish */}
                        {res.status === 'PUBLISHED' ? (
                          <button
                            onClick={() => handleStatusChange(res, 'READY')}
                            className="px-2.5 py-1 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition"
                            title="Unpublish from Learner Library"
                          >
                            Unpublish
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(res, 'PUBLISHED')}
                            className="px-2.5 py-1 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
                            title="Publish to Learner Library"
                          >
                            Publish
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteResource(res)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                          title="Delete resource"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <FileUp className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-bold text-stone-900">Upload PDF Resource</h3>
              </div>
              <button
                onClick={() => !isUploading && setShowUploadModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 mt-4">
              {/* File Drop Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${
                  selectedFile
                    ? 'border-emerald-500 bg-emerald-50/30'
                    : 'border-stone-300 hover:border-amber-500 bg-stone-50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="application/pdf"
                  className="hidden"
                />
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3 text-emerald-800">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <div className="text-left">
                      <p className="text-sm font-semibold truncate max-w-xs">{selectedFile.name}</p>
                      <p className="text-xs text-stone-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB PDF</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-stone-500">
                    <Upload className="w-8 h-8 mx-auto text-stone-400 mb-1" />
                    <p className="text-sm font-medium text-stone-700">Click or Drag PDF here to upload</p>
                    <p className="text-xs text-stone-400 mt-0.5">Maximum size 100MB. Uploaded to Google Drive.</p>
                  </div>
                )}
              </div>

              {/* Title & Author */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Resource Title *</label>
                  <input
                    type="text"
                    required
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g. Indian Polity 6th Edition"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Author / Institution</label>
                  <input
                    type="text"
                    value={uploadAuthor}
                    onChange={(e) => setUploadAuthor(e.target.value)}
                    placeholder="e.g. M. Laxmikanth / UPSC"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Type, Subject, Exam */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Resource Type</label>
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value as ResourceType)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 bg-white"
                  >
                    <option value="BOOK">Standard Book</option>
                    <option value="NOTES">High-Yield Notes</option>
                    <option value="PDF">General PDF</option>
                    <option value="OFFICIAL_DOCUMENT">Official Document / Gazette</option>
                    <option value="CURRENT_AFFAIRS">Current Affairs Compendium</option>
                    <option value="SYLLABUS">Syllabus Document</option>
                    <option value="PREVIOUS_YEAR_PAPER">PYQ Paper</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Subject</label>
                  <select
                    value={uploadSubject}
                    onChange={(e) => setUploadSubject(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 bg-white"
                  >
                    <option value="Indian Polity">Polity & Governance</option>
                    <option value="Modern History">Modern History</option>
                    <option value="Economy">Indian Economy</option>
                    <option value="Geography">Geography</option>
                    <option value="Environment & Ecology">Environment & Ecology</option>
                    <option value="Science & Tech">Science & Technology</option>
                    <option value="Current Affairs">Current Affairs</option>
                    <option value="General Studies">General Studies</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Target Exam</label>
                  <select
                    value={uploadExam}
                    onChange={(e) => setUploadExam(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 bg-white"
                  >
                    <option value="UPSC CSE">UPSC CSE</option>
                    <option value="BPSC">BPSC</option>
                    <option value="ALL">All Exams</option>
                  </select>
                </div>
              </div>

              {/* Visibility & Tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Target Audience & Visibility</label>
                  <select
                    value={uploadVisibility}
                    onChange={(e) => setUploadVisibility(e.target.value as ResourceVisibility)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 bg-white"
                  >
                    <option value="ALL_LEARNERS">All Learners (Public)</option>
                    <option value="UPSC">UPSC Aspirants Only</option>
                    <option value="BPSC">BPSC Aspirants Only</option>
                    <option value="COURSE">Course-Enrolled Aspirants</option>
                    <option value="BATCH">Batch-Assigned Aspirants</option>
                    <option value="ADMIN_ONLY">Faculty & Admin Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    value={uploadTags}
                    onChange={(e) => setUploadTags(e.target.value)}
                    placeholder="e.g. prelims, polity, supreme court, high-yield"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Topic & Description */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Topic / Coverage Scope</label>
                <input
                  type="text"
                  value={uploadTopic}
                  onChange={(e) => setUploadTopic(e.target.value)}
                  placeholder="e.g. Fundamental Rights, DPSP, Constitutional Amendments"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Brief summary of key high-yield exam areas in this PDF..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Book-Specific Metadata (when BOOK is selected) */}
              {uploadType === 'BOOK' && (
                <div className="p-3.5 bg-amber-50/40 rounded-xl border border-amber-200/80 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Book Ingestion Metadata</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Edition</label>
                      <input
                        type="text"
                        value={uploadEdition}
                        onChange={(e) => setUploadEdition(e.target.value)}
                        placeholder="e.g. 6th Edition Revised"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Publication Year</label>
                      <input
                        type="number"
                        min="1900"
                        max="2030"
                        value={uploadPubYear}
                        onChange={(e) => setUploadPubYear(e.target.value)}
                        placeholder="e.g. 2023"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Publisher</label>
                      <input
                        type="text"
                        value={uploadPublisher}
                        onChange={(e) => setUploadPublisher(e.target.value)}
                        placeholder="e.g. McGraw Hill Education"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Language</label>
                      <select
                        value={uploadLanguage}
                        onChange={(e) => setUploadLanguage(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 bg-white"
                      >
                        <option value="English">English</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Bilingual">Bilingual (Hindi + English)</option>
                        <option value="Other">Other Regional</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">ISBN (Optional)</label>
                      <input
                        type="text"
                        value={uploadIsbn}
                        onChange={(e) => setUploadIsbn(e.target.value)}
                        placeholder="e.g. 978-9353160197"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">License / Copyright</label>
                      <select
                        value={uploadLicenseStatus}
                        onChange={(e) => setUploadLicenseStatus(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 bg-white"
                      >
                        <option value="REQUIRES_REVIEW">Requires Review</option>
                        <option value="ACADEMIC_FAIR_USE">Academic Fair Use</option>
                        <option value="PUBLIC_DOMAIN">Public Domain</option>
                        <option value="OPEN_ACCESS">Open Access (CC-BY)</option>
                        <option value="LICENSED">Licensed Institutional</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Source / Attribution</label>
                      <input
                        type="text"
                        value={uploadSourceAttribution}
                        onChange={(e) => setUploadSourceAttribution(e.target.value)}
                        placeholder="e.g. Standard UPSC Reference"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Cover Image URL (Optional)</label>
                      <input
                        type="url"
                        value={uploadCoverImageUrl}
                        onChange={(e) => setUploadCoverImageUrl(e.target.value)}
                        placeholder="https://... cover thumbnail image"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Duplicate Warning Banner */}
              {duplicateWarning && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-300 text-amber-950 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Duplicate Book Detected</span>
                  </div>
                  <p className="leading-relaxed">{duplicateWarning.message}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setForceDuplicateUpload(true);
                        handleUploadSubmit(undefined, true);
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition shadow-sm"
                    >
                      Upload as New Edition / Revision Anyway
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDuplicateWarning(null);
                        setShowUploadModal(false);
                        if (duplicateWarning.existing) {
                          setSearchQuery(duplicateWarning.existing.title || '');
                        }
                      }}
                      className="px-3 py-1.5 bg-white border border-stone-300 text-stone-700 font-medium rounded-lg hover:bg-stone-50 transition"
                    >
                      Cancel & View Existing
                    </button>
                  </div>
                </div>
              )}

              {/* Auto Publish Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="autoPublish"
                  checked={uploadAutoPublish}
                  onChange={(e) => setUploadAutoPublish(e.target.checked)}
                  className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="autoPublish" className="text-xs text-stone-700 cursor-pointer">
                  Publish immediately to Learner Resource Library upon successful upload
                </label>
              </div>

              {/* Progress / Status Message */}
              {isUploading && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                  <span>{uploadStage}</span>
                </div>
              )}

              {uploadError && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition disabled:opacity-50 shadow-sm flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      Upload to Drive & Index
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INGESTION REVIEW & RAG CHUNKS MODAL */}
      {reviewResource && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-50 text-purple-700 rounded-xl border border-purple-200">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">{reviewResource.title}</h3>
                  <p className="text-xs text-stone-500">
                    Ingestion Review • OCR Status • Page-Aware RAG Knowledge Chunks
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setReviewResource(null);
                  setReviewDetails(null);
                  setReprocessMessage(null);
                }}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {loadingReview ? (
                <div className="py-12 text-center text-stone-500 flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
                  <span className="text-xs">Loading ingestion analysis & chunks...</span>
                </div>
              ) : reviewDetails ? (
                <>
                  {/* Metadata Summary Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-xs">
                    <div>
                      <span className="text-stone-400 block text-[11px]">Author</span>
                      <span className="font-semibold text-stone-800 truncate block">{reviewResource.author || 'Faculty'}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[11px]">Edition / Year</span>
                      <span className="font-semibold text-stone-800 block">
                        {reviewResource.edition || 'Standard'} {reviewResource.publication_year ? `(${reviewResource.publication_year})` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[11px]">Publisher</span>
                      <span className="font-semibold text-stone-800 block">{reviewResource.publisher || 'IKSHOVIA'}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[11px]">License</span>
                      <span className="font-semibold text-stone-800 block">{reviewResource.license_status || 'ACADEMIC_FAIR_USE'}</span>
                    </div>
                  </div>

                  {/* Health & Extraction Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl border border-stone-200 bg-white">
                      <span className="text-[11px] font-semibold text-stone-500 uppercase block">Extraction Status</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`w-2.5 h-2.5 rounded-full ${reviewDetails.extractionStatus === 'EXTRACTED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span className="font-bold text-stone-900 text-sm">{reviewDetails.extractionStatus}</span>
                      </div>
                      <span className="text-[11px] text-stone-400 mt-1 block">
                        Method: {reviewDetails.document?.extractionMethod || 'DIRECT_TEXT'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-stone-200 bg-white">
                      <span className="text-[11px] font-semibold text-stone-500 uppercase block">Extracted Content</span>
                      <p className="font-bold text-stone-900 text-sm mt-1">
                        {(reviewDetails.document?.charCount || 0).toLocaleString()} characters
                      </p>
                      <span className="text-[11px] text-stone-400 mt-1 block">
                        Across {reviewDetails.document?.pageCount || reviewResource.page_count || 1} pages
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-stone-200 bg-white">
                      <span className="text-[11px] font-semibold text-stone-500 uppercase block">Knowledge Base Chunks</span>
                      <p className="font-bold text-purple-700 text-sm mt-1">
                        {reviewDetails.chunksCount} RAG Chunks
                      </p>
                      <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
                        {reviewDetails.isIndexed ? '✓ Grounded for AI Tutor' : 'Pending Indexing'}
                      </span>
                    </div>
                  </div>

                  {/* Storage Details */}
                  <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-blue-900 block">Google Drive Storage Location</span>
                      <span className="text-blue-700 font-mono text-[11px]">
                        File ID: {reviewResource.drive_file_id || 'Stored locally in public/resources'}
                      </span>
                    </div>
                    <a
                      href={`/api/resources/${reviewResource.id}/stream`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-blue-700 font-medium hover:bg-blue-50 text-xs flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View PDF Stream
                    </a>
                  </div>

                  {/* Sample Chunks Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                        Indexed Knowledge Chunks Sample ({reviewDetails.sampleChunks?.length || 0} of {reviewDetails.chunksCount})
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {reviewDetails.sampleChunks && reviewDetails.sampleChunks.length > 0 ? (
                        reviewDetails.sampleChunks.map((chunk: any, idx: number) => (
                          <div key={chunk.id || idx} className="p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs">
                            <div className="flex items-center justify-between font-semibold text-stone-700 text-[11px] mb-1">
                              <span>Chunk #{chunk.chunkIndex + 1}: {chunk.heading || 'Section'}</span>
                              <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                Page {chunk.pageNumber}
                              </span>
                            </div>
                            <p className="text-stone-600 leading-relaxed italic">{chunk.preview}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-stone-400 italic py-2">No chunks indexed yet for this resource.</p>
                      )}
                    </div>
                  </div>

                  {/* Reprocess message */}
                  {reprocessMessage && (
                    <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      reprocessMessage.includes('failed')
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{reprocessMessage}</span>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
              <button
                onClick={() => handleReprocess(reviewResource.id)}
                disabled={reprocessing}
                className="px-4 py-2 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${reprocessing ? 'animate-spin' : ''}`} />
                {reprocessing ? 'Reprocessing Extraction & Chunks...' : 'Reprocess Extraction & RAG'}
              </button>

              <div className="flex items-center gap-2">
                {reviewResource.status !== 'PUBLISHED' ? (
                  <button
                    onClick={async () => {
                      await handleStatusChange(reviewResource, 'PUBLISHED');
                      setReviewResource({ ...reviewResource, status: 'PUBLISHED' });
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition"
                  >
                    Publish to Learner Library
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      await handleStatusChange(reviewResource, 'READY');
                      setReviewResource({ ...reviewResource, status: 'READY' });
                    }}
                    className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-200 hover:bg-stone-300 rounded-xl transition"
                  >
                    Unpublish to Draft
                  </button>
                )}
                <button
                  onClick={() => {
                    setReviewResource(null);
                    setReviewDetails(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200 rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF PREVIEW MODAL */}
      {previewResource && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div>
                <h3 className="font-bold text-stone-900 truncate">{previewResource.title}</h3>
                <p className="text-xs text-stone-500">
                  {previewResource.author} • {previewResource.page_count || 1} Pages • Streaming directly from Google Drive
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/resources/${previewResource.id}/download`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 rounded-lg flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>
                <button
                  onClick={() => setPreviewResource(null)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-stone-100 relative">
              <iframe
                src={`/api/resources/${previewResource.id}/stream`}
                title={previewResource.title}
                className="w-full h-full border-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* AI TUTOR GROUNDING TEST MODAL */}
      {groundingTestResource && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-stone-900">AI Tutor Grounding Tester</h3>
              </div>
              <button
                onClick={() => setGroundingTestResource(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-500 mt-2">
              Testing retrieval grounding against: <strong>{groundingTestResource.title}</strong>.
              AI Tutor should answer and cite specific page numbers from this resource.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Test Question</label>
                <input
                  type="text"
                  value={groundingQuestion}
                  onChange={(e) => setGroundingQuestion(e.target.value)}
                  placeholder="e.g. Is book ke according Fundamental Rights samjhao"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleTestGrounding}
                  disabled={testingGrounding || !groundingQuestion.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-50 flex items-center gap-2"
                >
                  {testingGrounding ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Retrieving & Answering...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Run Grounded AI Test
                    </>
                  )}
                </button>
              </div>

              {groundingAnswer && (
                <div className="mt-3 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 max-h-72 overflow-y-auto">
                  <div className="text-xs font-semibold text-indigo-900 mb-1.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    AI Tutor Grounded Output:
                  </div>
                  <div className="text-xs text-stone-800 whitespace-pre-wrap font-sans leading-relaxed">
                    {groundingAnswer}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
