import React, { useState } from 'react';
import {
  LayoutDashboard,
  User,
  Layers,
  Palette,
  Type,
  Languages,
  Image as ImageIcon,
  Globe,
  Share2,
  BarChart3,
  Search,
  Settings,
  ShieldCheck,
  RotateCcw,
  History,
  Save,
  CheckCircle2,
  Eye,
  LogOut,
  X,
  Plus,
  Trash2,
  Download,
  Upload,
  ArrowUpRight,
  Briefcase,
  GraduationCap,
  Users,
  Sparkles,
  Smile,
  Calendar as CalendarIcon,
  EyeOff,
  Edit3,
  Phone,
  Mail,
  Lock,
  PhoneOff,
  MailX,
  Star,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Heart,
  Award,
  MessageSquare,
  KeyRound,
  Camera,
  Cloud,
  CloudUpload,
  RefreshCw,
  ExternalLink,
  Check,
} from 'lucide-react';
import {
  BiodataContent,
  ThemeSettings,
  CustomSection,
  CustomSectionItem,
  GalleryImage,
  SectionVisibility,
  OccupationDuty,
  EducationItem,
  FamilyMember,
  HobbyItem,
  PartnerPref,
  ActivityLogItem,
} from '../../types/biodata';
import { DatePickerModal } from './DatePickerModal';
import { EmojiPickerModal } from './EmojiPickerModal';
import { uploadProfileImageToFirebase } from '../../utils/firebaseStorage';

interface AdminDashboardProps {
  biodata: BiodataContent;
  onUpdateBiodata: (updated: BiodataContent) => void;
  onPublish: (updated: BiodataContent) => void;
  onRestoreDefault: () => void;
  theme: ThemeSettings;
  onUpdateTheme: (updated: ThemeSettings) => void;
  onClose: () => void;
  onLogout?: () => void;
  adminEmail: string;
}

export type NavTab =
  | 'overview'
  | 'profile_photo'
  | 'personal'
  | 'career'
  | 'education'
  | 'intro'
  | 'strengths'
  | 'family'
  | 'hobbies'
  | 'partner'
  | 'gallery'
  | 'contact'
  | 'sections'
  | 'theme'
  | 'fonts'
  | 'security'
  | 'backup'
  | 'activity';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  biodata,
  onUpdateBiodata,
  onPublish,
  onRestoreDefault,
  theme,
  onUpdateTheme,
  onClose,
  onLogout,
  adminEmail,
}) => {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [draftBiodata, setDraftBiodata] = useState<BiodataContent>(biodata);
  const [draftTheme, setDraftTheme] = useState<ThemeSettings>(theme);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Password setting in Security Tab
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>(() => {
    return localStorage.getItem('nasir_admin_password') || 'F=kq1q2/d^2';
  });
  const [showPassword, setShowPassword] = useState(false);

  // Modals for Datepicker and Emoji Picker
  const [datePickerState, setDatePickerState] = useState<{
    isOpen: boolean;
    initialDate?: string;
    onSelect: (date: string) => void;
    title?: string;
  }>({
    isOpen: false,
    onSelect: () => {},
  });

  const [emojiPickerState, setEmojiPickerState] = useState<{
    isOpen: boolean;
    onSelect: (emoji: string) => void;
    title?: string;
  }>({
    isOpen: false,
    onSelect: () => {},
  });

  // Modal for Custom Section
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<CustomSection | null>(null);

  // Gallery Upload form state
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [newGalleryCaption, setNewGalleryCaption] = useState('');
  const [newGalleryCaptionBn, setNewGalleryCaptionBn] = useState('');
  const [newGalleryFeatured, setNewGalleryFeatured] = useState(false);

  // Drag and Drop State for Section Reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const logActivity = (type: string, description: string) => {
    const newLog: ActivityLogItem = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      action: type.toUpperCase(),
      details: description,
    };
    setDraftBiodata((prev) => ({
      ...prev,
      activityLogs: [newLog, ...(prev.activityLogs || [])],
    }));
  };

  const handleFieldChange = (section: keyof BiodataContent, data: any) => {
    setDraftBiodata((prev) => ({
      ...prev,
      [section]: data,
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveDraft = () => {
    onUpdateBiodata(draftBiodata);
    onUpdateTheme(draftTheme);
    setHasUnsavedChanges(false);
    showToast('Draft successfully saved to local session.');
  };

  const handlePublishLive = () => {
    const newLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      action: 'Content Published Live',
      details: 'Admin published latest draft to the live site.',
    };
    const updatedWithLog = {
      ...draftBiodata,
      activityLogs: [newLog, ...(draftBiodata.activityLogs || [])],
    };

    onUpdateBiodata(updatedWithLog);
    onUpdateTheme(draftTheme);
    onPublish(updatedWithLog);
    setDraftBiodata(updatedWithLog);
    setHasUnsavedChanges(false);
    showToast('Published! The public website is now live with your changes.');
  };

  // Helper for opening Date Picker
  const openDatePicker = (
    initialDate: string,
    onSelect: (date: string) => void,
    title = 'Choose Date'
  ) => {
    setDatePickerState({
      isOpen: true,
      initialDate,
      onSelect,
      title,
    });
  };

  // Helper for opening Emoji Picker
  const openEmojiPicker = (
    onSelect: (emoji: string) => void,
    title = 'Select Emoji'
  ) => {
    setEmojiPickerState({
      isOpen: true,
      onSelect,
      title,
    });
  };

  // Toggle Visibility of Any Core Section
  const handleToggleSectionVisibility = (sectionKey: keyof SectionVisibility) => {
    const currentVis = draftBiodata.sectionVisibility || {
      header: true,
      personal: true,
      occupation: true,
      education: true,
      intro: true,
      strengths: true,
      family: true,
      hobbies: true,
      partner: true,
      contact: true,
      footer: true,
      gallery: true,
    };

    const updated = {
      ...currentVis,
      [sectionKey]: !currentVis[sectionKey],
    };

    handleFieldChange('sectionVisibility', updated);
    showToast(`Section "${sectionKey}" visibility set to ${updated[sectionKey] ? 'VISIBLE' : 'HIDDEN'}.`);
  };

  // Section Ordering Management
  const DEFAULT_ORDER = [
    'personal',
    'occupation',
    'education',
    'intro',
    'strengths',
    'family',
    'hobbies',
    'gallery',
    'partner',
    'contact',
  ];

  const currentOrder =
    draftBiodata.sectionOrder && draftBiodata.sectionOrder.length > 0
      ? draftBiodata.sectionOrder
      : DEFAULT_ORDER;

  // Include custom sections in list
  const customSectionIds = (draftBiodata.customSections || []).map((s) => s.id);
  const activeOrderList = [
    ...currentOrder,
    ...customSectionIds.filter((id) => !currentOrder.includes(id)),
  ];

  const getSectionMetadata = (key: string) => {
    switch (key) {
      case 'personal':
        return { name: 'Personal Details Grid', icon: '👤', desc: '10 personal fields (DOB, Age, Blood Group...)' };
      case 'occupation':
        return { name: 'Occupation (RAJUK Officer)', icon: '💼', desc: 'Designation, department, and duties' };
      case 'education':
        return { name: 'Education Timeline (BUET)', icon: '🎓', desc: 'BUET, Notre Dame, and SSC records' };
      case 'intro':
        return { name: 'Self Introduction', icon: '🗣️', desc: 'Bilingual narrative introduction' };
      case 'strengths':
        return { name: 'Strengths & Growth Areas', icon: '⚖️', desc: 'Personal qualities & growth mindset' };
      case 'family':
        return { name: 'Family Background Details', icon: '👨‍👩‍👧‍👦', desc: 'Father, mother, brothers, and sister' };
      case 'hobbies':
        return { name: 'Hobbies & Interests', icon: '⭐', desc: 'Programming, books, mentoring tags' };
      case 'gallery':
        return { name: 'Photo Gallery & Captions', icon: '📷', desc: 'Photographs and bilingual captions' };
      case 'partner':
        return { name: 'Preferred Partner Criteria', icon: '💍', desc: 'Expectations & Islamic values' };
      case 'contact':
        return { name: 'Contact Information Card', icon: '📞', desc: 'Mobile, email, and location card' };
      default: {
        const customSec = (draftBiodata.customSections || []).find((s) => s.id === key);
        if (customSec) {
          return { name: customSec.title, icon: customSec.icon || '✨', desc: `Custom ${customSec.type} section` };
        }
        return { name: key, icon: '✦', desc: 'Section Card' };
      }
    }
  };

  const moveSectionOrder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeOrderList.length) return;
    const updated = [...activeOrderList];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    handleFieldChange('sectionOrder', updated);
    showToast(`Moved "${getSectionMetadata(moved).name}" ${direction}. Click Publish Live to apply.`);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...activeOrderList];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);

    handleFieldChange('sectionOrder', updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
    showToast(`Order updated: "${getSectionMetadata(moved).name}" repositioned!`);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleResetSectionOrder = () => {
    handleFieldChange('sectionOrder', DEFAULT_ORDER);
    showToast('Reset section order to original default sequence.');
  };

  // Custom Section Management
  const handleOpenAddSection = () => {
    setEditingSection({
      id: `sec_${Date.now()}`,
      title: 'New Section',
      titleBn: 'নতুন অনুচ্ছেদ',
      accent: 'teal',
      pcol: '56,217,192',
      icon: '✨',
      type: 'grid',
      items: [
        {
          id: `item_${Date.now()}_1`,
          label: 'Item Title',
          labelBn: 'বিবরণ শিরোনাম',
          value: 'Detailed description or value',
          valueBn: 'বিস্তারিত তথ্য',
          icon: '✦',
        },
      ],
      visible: true,
      order: (draftBiodata.customSections?.length || 0) + 1,
    });
    setIsSectionModalOpen(true);
  };

  const handleSaveCustomSection = () => {
    if (!editingSection) return;
    const currentList = draftBiodata.customSections || [];
    const exists = currentList.some((s) => s.id === editingSection.id);
    let updated: CustomSection[];

    if (exists) {
      updated = currentList.map((s) => (s.id === editingSection.id ? editingSection : s));
    } else {
      updated = [...currentList, editingSection];
      // Also add to sectionOrder if not already present
      if (!activeOrderList.includes(editingSection.id)) {
        handleFieldChange('sectionOrder', [...activeOrderList, editingSection.id]);
      }
    }

    handleFieldChange('customSections', updated);
    setIsSectionModalOpen(false);
    setEditingSection(null);
    showToast('Custom section saved to draft!');
  };

  const handleDeleteCustomSection = (id: string) => {
    if (window.confirm('Are you sure you want to delete this custom section?')) {
      const currentList = draftBiodata.customSections || [];
      const updated = currentList.filter((s) => s.id !== id);
      handleFieldChange('customSections', updated);
      const filteredOrder = (draftBiodata.sectionOrder || []).filter((sId) => sId !== id);
      handleFieldChange('sectionOrder', filteredOrder);
      showToast('Custom section removed.');
    }
  };

  // Gallery Image Upload Handler (Converts file to base64 Data URL)
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    try {
      setIsUploadingGallery(true);
      showToast('Processing and uploading photo...');
      const result = await uploadProfileImageToFirebase(file);
      setNewGalleryUrl(result.url);
      showToast('Photo ready! Enter caption and click Add.');
    } catch (err: any) {
      console.warn('Image upload notice:', err);
      showToast('Could not process photo. Please choose another image.');
    } finally {
      setIsUploadingGallery(false);
      e.target.value = '';
    }
  };

  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const handleGalleryFirebaseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    setIsUploadingGallery(true);
    showToast('Uploading photo to Firebase Storage...');
    try {
      const result = await uploadProfileImageToFirebase(file);
      setNewGalleryUrl(result.url);
      showToast('Photo uploaded to Firebase Storage! Add a caption and save.');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to upload photo to Firebase Storage.');
    } finally {
      setIsUploadingGallery(false);
      e.target.value = '';
    }
  };

  const handleAddGalleryImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGalleryUrl.trim()) {
      showToast('Please upload an image file or provide a valid image URL.');
      return;
    }

    const newImg: GalleryImage = {
      id: `img_${Date.now()}`,
      url: newGalleryUrl.trim(),
      caption: newGalleryCaption.trim(),
      captionBn: newGalleryCaptionBn.trim(),
      isFeatured: newGalleryFeatured,
      visible: true,
      dateAdded: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    };

    const updatedGallery = [newImg, ...(draftBiodata.gallery || [])];
    handleFieldChange('gallery', updatedGallery);
    setNewGalleryUrl('');
    setNewGalleryCaption('');
    setNewGalleryCaptionBn('');
    setNewGalleryFeatured(false);
    showToast('Photo added to gallery draft!');
  };

  const handleDeleteGalleryImage = (id: string) => {
    if (window.confirm('Delete this image from gallery?')) {
      const updated = (draftBiodata.gallery || []).filter((img) => img.id !== id);
      handleFieldChange('gallery', updated);
      showToast('Image removed from gallery.');
    }
  };

  // Profile Photo Upload (Firebase Storage)
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [profileUploadProgress, setProfileUploadProgress] = useState(0);
  const [profilePhotoUrlInput, setProfilePhotoUrlInput] = useState(
    draftBiodata.header?.photoUrl || 'https://nasirinboxbd.github.io/nasir/preview.png'
  );
  const [profileUploadSuccess, setProfileUploadSuccess] = useState<string | null>(null);

  const handleProfileImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    setIsUploadingProfile(true);
    setProfileUploadProgress(0);
    setProfileUploadSuccess(null);

    try {
      showToast('Uploading profile image to Firebase Storage...');
      const result = await uploadProfileImageToFirebase(file, (progress) => {
        setProfileUploadProgress(progress);
      });

      const updatedHeader = {
        ...draftBiodata.header,
        photoUrl: result.url,
      };

      const updatedBiodata: BiodataContent = {
        ...draftBiodata,
        header: updatedHeader,
      };

      setDraftBiodata(updatedBiodata);
      setProfilePhotoUrlInput(result.url);
      setProfileUploadSuccess(
        result.storageType === 'firebase'
          ? `Persisted to Firebase Storage (${result.filename})`
          : `Persisted to Cloud Storage (${result.filename})`
      );
      onUpdateBiodata(updatedBiodata);
      onPublish(updatedBiodata);

      // Persist to server
      fetch('/api/biodata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ biodata: updatedBiodata }),
      }).catch(() => {});

      logActivity(
        'photo',
        `Updated profile picture (${result.storageType === 'firebase' ? 'Firebase Storage' : 'Local'})`
      );
      showToast('Profile image successfully updated and saved in Firebase Storage!');
    } catch (err: any) {
      console.error('Profile image upload failed:', err);
      showToast(err.message || 'Failed to upload profile image.');
    } finally {
      setIsUploadingProfile(false);
      setProfileUploadProgress(0);
      e.target.value = '';
    }
  };

  const handleApplyProfilePhotoUrl = () => {
    const url = profilePhotoUrlInput.trim();
    if (!url) return;
    const updatedHeader = {
      ...draftBiodata.header,
      photoUrl: url,
    };
    const updatedBiodata: BiodataContent = {
      ...draftBiodata,
      header: updatedHeader,
    };
    setDraftBiodata(updatedBiodata);
    onUpdateBiodata(updatedBiodata);
    fetch('/api/biodata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ biodata: updatedBiodata }),
    }).catch(() => {});
    logActivity('photo', 'Applied manual profile image URL');
    showToast('Profile photo URL updated.');
  };

  const handleResetProfilePhoto = () => {
    const defaultPhoto = 'https://nasirinboxbd.github.io/nasir/preview.png';
    const updatedHeader = {
      ...draftBiodata.header,
      photoUrl: defaultPhoto,
    };
    const updatedBiodata: BiodataContent = {
      ...draftBiodata,
      header: updatedHeader,
    };
    setDraftBiodata(updatedBiodata);
    setProfilePhotoUrlInput(defaultPhoto);
    onUpdateBiodata(updatedBiodata);
    fetch('/api/biodata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ biodata: updatedBiodata }),
    }).catch(() => {});
    logActivity('photo', 'Reset profile photo to original BUET photo');
    showToast('Profile photo reset to default.');
  };

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'overview', label: '1. Overview & Shortcuts', icon: <LayoutDashboard size={17} /> },
    { id: 'profile_photo', label: '2. Profile Photo (Firebase)', icon: <Camera size={17} />, badge: 'Firebase' },
    { id: 'personal', label: '3. Personal Details', icon: <User size={17} /> },
    { id: 'career', label: '4. Career & Occupation', icon: <Briefcase size={17} /> },
    { id: 'education', label: '5. Education (BUET)', icon: <GraduationCap size={17} /> },
    { id: 'intro', label: '6. Self Introduction', icon: <MessageSquare size={17} /> },
    { id: 'strengths', label: '7. Strengths & Growth', icon: <Award size={17} /> },
    { id: 'family', label: '8. Family Background', icon: <Users size={17} /> },
    { id: 'hobbies', label: '9. Hobbies & Interests', icon: <Star size={17} /> },
    { id: 'partner', label: '10. Preferred Partner', icon: <Heart size={17} /> },
    { id: 'gallery', label: '11. Photo Gallery', icon: <ImageIcon size={17} />, badge: 'Upload' },
    { id: 'contact', label: '12. Contact & Privacy', icon: <Phone size={17} />, badge: 'Privacy' },
    { id: 'sections', label: '13. Section Order & Visibility', icon: <Layers size={17} />, badge: 'Drag & Drop' },
    { id: 'theme', label: '14. Theme & Colors', icon: <Palette size={17} /> },
    { id: 'fonts', label: '15. Fonts & Typography', icon: <Type size={17} /> },
    { id: 'security', label: '16. Account & Password', icon: <ShieldCheck size={17} /> },
    { id: 'backup', label: '17. Backup & Restore', icon: <RotateCcw size={17} /> },
    { id: 'activity', label: '18. Activity Log', icon: <History size={17} /> },
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const vis = draftBiodata.sectionVisibility || {
    header: true,
    personal: true,
    occupation: true,
    education: true,
    intro: true,
    strengths: true,
    family: true,
    hobbies: true,
    partner: true,
    contact: true,
    footer: true,
    gallery: true,
  };

  React.useEffect(() => {
    document.body.classList.add('admin-active');
    return () => {
      document.body.classList.remove('admin-active');
    };
  }, []);

  return (
    <div className="admin-dashboard fixed inset-0 z-[10000] bg-[#0c0817]/95 backdrop-blur-xl flex flex-col text-[#f0ead8] font-sans antialiased overflow-hidden cursor-default">
      {/* Top Header Bar */}
      <header className="h-16 px-6 border-b border-white/10 bg-[#120a24]/90 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div
            onClick={() => setActiveTab('profile_photo')}
            className="relative group cursor-pointer"
            title="Update Profile Photo in Firebase Storage"
          >
            <img
              src={draftBiodata.header?.photoUrl || 'https://nasirinboxbd.github.io/nasir/preview.png'}
              alt="Admin Profile"
              className="w-10 h-10 rounded-xl object-cover border border-amber-400/40 shadow-lg group-hover:border-amber-400 transition"
            />
            <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
              <Camera size={15} className="text-amber-300" />
            </div>
            {isUploadingProfile && (
              <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center">
                <RefreshCw size={14} className="animate-spin text-amber-400" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-white flex items-center gap-2">
              <span>{draftBiodata.header?.name || "Nasir's Biodata"}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Verified Admin
              </span>
            </h1>
            <p className="text-xs text-white/50">{adminEmail}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <span className="text-xs text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 animate-pulse flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Unsaved Changes
            </span>
          )}

          <a
            href="/api/download-dist"
            download="dist.zip"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition border border-amber-500/30 cursor-pointer no-underline"
            title="Download Zipped Production dist Folder"
          >
            <Download size={14} />
            dist.zip
          </a>

          <button
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/15 text-white transition border border-white/10 cursor-pointer"
          >
            <Save size={14} />
            Save Draft
          </button>

          <button
            onClick={handlePublishLive}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#f0b840] to-[#ff7e5f] hover:brightness-110 text-black shadow-lg shadow-amber-500/25 transition cursor-pointer"
          >
            <CheckCircle2 size={14} />
            Publish Live
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Preview Public Website"
          >
            <Eye size={15} />
            View Site
          </button>

          <button
            onClick={() => {
              if (onLogout) onLogout();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-300 hover:text-red-200 hover:bg-red-500/10 transition border border-red-500/20 cursor-pointer"
            title="Sign Out"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r border-white/10 bg-[#0e071c]/70 flex flex-col shrink-0">
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 text-white/40" size={14} />
              <input
                type="text"
                placeholder="Search sections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-amber-400/50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 custom-scrollbar">
            {filteredNavItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                    active
                      ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30 shadow-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={active ? 'text-amber-400' : 'text-white/40'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-3 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
            <span>Admin: {adminEmail.split('@')[0]}</span>
            <button
              onClick={() => {
                if (onLogout) onLogout();
                onClose();
              }}
              className="hover:text-red-300 flex items-center gap-1 cursor-pointer"
            >
              <LogOut size={13} /> Exit
            </button>
          </div>
        </aside>

        {/* Content Panel */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {notification && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 animate-fadeIn">
              <Sparkles size={16} />
              <span>{notification}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW & DIRECT SECTION JUMPS */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h2 className="text-xl font-serif font-bold text-white mb-1">Administrator Overview</h2>
                <p className="text-xs text-white/60">
                  Welcome Nasir. Jump directly to edit any regarding section, manage privacy, or customize card order.
                </p>
              </div>

              {/* Status Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-xs text-white/50 mb-1">Website Status</div>
                  <div className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Published & Active
                  </div>
                  <div className="text-[11px] text-white/40 mt-1">Live on Applet / Public</div>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-xs text-white/50 mb-1">Contact Privacy</div>
                  <div className="text-xs font-bold text-amber-400 flex flex-col gap-1 mt-1">
                    <span>Phone: {draftBiodata.contact.showPhone ? '🟢 Visible' : '🔴 Hidden'}</span>
                    <span>Email: {draftBiodata.contact.showEmail ? '🟢 Visible' : '🔴 Hidden'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-xs text-white/50 mb-1">Gallery Album</div>
                  <div className="text-lg font-bold text-sky-400">
                    {draftBiodata.gallery?.length || 0} Photos
                  </div>
                  <div className="text-[11px] text-white/40 mt-1">Free Base64 supported</div>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-xs text-white/50 mb-1">Card Ordering</div>
                  <div className="text-lg font-bold text-purple-400">
                    {activeOrderList.length} Sections
                  </div>
                  <div className="text-[11px] text-white/40 mt-1">Custom drag & drop order</div>
                </div>
              </div>

              {/* Profile Photo Quick Hero Card (Firebase Storage) */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div
                    className="relative group cursor-pointer shrink-0"
                    onClick={() => setActiveTab('profile_photo')}
                    title="Edit in Profile Photo tab"
                  >
                    <img
                      src={draftBiodata.header?.photoUrl || 'https://nasirinboxbd.github.io/nasir/preview.png'}
                      alt="Profile"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-xl"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <Camera size={18} className="text-amber-300" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white font-serif">
                        {draftBiodata.header?.name || 'Md. Nasir Uddin'}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-medium border border-amber-400/30 flex items-center gap-1">
                        <Cloud size={11} /> Firebase Storage
                      </span>
                    </div>
                    <p className="text-xs text-white/60 mt-0.5">
                      {draftBiodata.header?.title || 'Assistant Authorized Officer · RAJUK'}
                    </p>
                    <p className="text-[11px] text-white/40 mt-1 truncate max-w-md font-mono">
                      {draftBiodata.header?.photoUrl || 'Default BUET Photo'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
                  <label className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black shadow-md cursor-pointer transition">
                    <CloudUpload size={15} />
                    <span>
                      {isUploadingProfile
                        ? `Uploading (${profileUploadProgress}%)...`
                        : 'Upload to Firebase Storage'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingProfile}
                      onChange={handleProfileImageFileUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={() => setActiveTab('profile_photo')}
                    className="px-3.5 py-2.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/15 text-white border border-white/10 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Full Editor</span>
                    <ArrowUpRight size={13} />
                  </button>
                </div>
              </div>

              {/* DIRECT SECTION EDITORS (Addresses: "I need to edit from regarding section") */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-[#170a2c] via-[#100720] to-[#0c142c] border border-amber-500/20 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
                    <Sparkles size={16} /> Edit Direct Regarding Sections
                  </h3>
                  <p className="text-xs text-white/50 mt-0.5">
                    Click any card below to edit that exact section directly.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => setActiveTab('profile_photo')}
                    className="p-3.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 text-left transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-amber-300 flex items-center gap-2">
                        <span>📸 Profile Photo & Header</span>
                        <span className="text-[9px] px-1.5 py-0.2 bg-amber-400/20 text-amber-300 rounded font-bold">
                          Firebase
                        </span>
                      </div>
                      <div className="text-[11px] text-white/50 mt-1">Upload profile photo to Firebase Storage</div>
                    </div>
                    <ArrowUpRight size={14} className="text-amber-400 shrink-0" />
                  </button>

                  <button
                    onClick={() => setActiveTab('personal')}
                    className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        <span>👤 Personal Details</span>
                      </div>
                      <div className="text-[11px] text-white/50 mt-1">DOB, Age, Religion, Height, Address</div>
                    </div>
                    <ArrowUpRight size={14} className="text-amber-400 shrink-0" />
                  </button>

                  <button
                    onClick={() => setActiveTab('career')}
                    className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        <span>💼 Career & Occupation</span>
                      </div>
                      <div className="text-[11px] text-white/50 mt-1">RAJUK Role, Grade & Duties list</div>
                    </div>
                    <ArrowUpRight size={14} className="text-amber-400 shrink-0" />
                  </button>

                  <button
                    onClick={() => setActiveTab('education')}
                    className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        <span>🎓 Education (BUET)</span>
                      </div>
                      <div className="text-[11px] text-white/50 mt-1">BUET, Notre Dame & SSC credentials</div>
                    </div>
                    <ArrowUpRight size={14} className="text-amber-400 shrink-0" />
                  </button>

                  <button
                    onClick={() => setActiveTab('intro')}
                    className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        <span>🗣️ Self Introduction</span>
                      </div>
                      <div className="text-[11px] text-white/50 mt-1">English intro & Bengali translation</div>
                    </div>
                    <ArrowUpRight size={14} className="text-amber-400 shrink-0" />
                  </button>

                  <button
                    onClick={() => setActiveTab('strengths')}
                    className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        <span>⚖️ Strengths & Growth</span>
                      </div>
                      <div className="text-[11px] text-white/50 mt-1">Strengths & areas of growth</div>
                    </div>
                    <ArrowUpRight size={14} className="text-amber-400 shrink-0" />
                  </button>

                  <button
                    onClick={() => setActiveTab('family')}
                    className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        <span>👨‍👩‍👧‍👦 Family Background</span>
                      </div>
                      <div className="text-[11px] text-white/50 mt-1">Father, Mother, Brothers & Sister</div>
                    </div>
                    <ArrowUpRight size={14} className="text-amber-400 shrink-0" />
                  </button>

                  <button
                    onClick={() => setActiveTab('hobbies')}
                    className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        <span>⭐ Hobbies & Interests</span>
                      </div>
                      <div className="text-[11px] text-white/50 mt-1">Books, Badminton, Coding, Mentoring</div>
                    </div>
                    <ArrowUpRight size={14} className="text-amber-400 shrink-0" />
                  </button>

                  <button
                    onClick={() => setActiveTab('partner')}
                    className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        <span>💍 Preferred Partner</span>
                      </div>
                      <div className="text-[11px] text-white/50 mt-1">Life partner criteria & values</div>
                    </div>
                    <ArrowUpRight size={14} className="text-amber-400 shrink-0" />
                  </button>

                  <button
                    onClick={() => setActiveTab('gallery')}
                    className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        <span>📷 Photo Gallery</span>
                      </div>
                      <div className="text-[11px] text-white/50 mt-1">Upload images & bilingual captions</div>
                    </div>
                    <ArrowUpRight size={14} className="text-amber-400 shrink-0" />
                  </button>

                  <button
                    onClick={() => setActiveTab('contact')}
                    className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        <span>📞 Contact & Privacy</span>
                      </div>
                      <div className="text-[11px] text-white/50 mt-1">Hide/Show mobile & email toggles</div>
                    </div>
                    <ArrowUpRight size={14} className="text-amber-400 shrink-0" />
                  </button>

                  <button
                    onClick={() => setActiveTab('sections')}
                    className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        <span>🔄 Section Order & Visibility</span>
                      </div>
                      <div className="text-[11px] text-white/50 mt-1">Drag & drop cards + hide any section</div>
                    </div>
                    <ArrowUpRight size={14} className="text-amber-400 shrink-0" />
                  </button>

                  <button
                    onClick={() => setActiveTab('security')}
                    className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        <span>🔒 Admin Password</span>
                      </div>
                      <div className="text-[11px] text-white/50 mt-1">Set or update master credentials</div>
                    </div>
                    <ArrowUpRight size={14} className="text-amber-400 shrink-0" />
                  </button>

                  <a
                    href="/api/download-dist"
                    download="dist.zip"
                    className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30 text-left transition cursor-pointer flex items-center justify-between no-underline group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-amber-300 flex items-center gap-2">
                        <span>📦 Download Production Bundle (dist.zip)</span>
                      </div>
                      <div className="text-[11px] text-white/60 mt-1">Directly download zipped dist build folder</div>
                    </div>
                    <Download size={15} className="text-amber-400 shrink-0 group-hover:translate-y-0.5 transition" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROFILE PHOTO & IDENTITY (SAVED IN FIREBASE STORAGE) */}
          {activeTab === 'profile_photo' && (
            <div className="space-y-6 max-w-5xl animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-serif font-bold text-white mb-1 flex items-center gap-2">
                    <Camera className="text-amber-400" size={22} />
                    <span>Profile Photo & Identity</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-sans font-semibold border border-amber-400/30">
                      Firebase Storage
                    </span>
                  </h2>
                  <p className="text-xs text-white/60">
                    Upload and save Nasir's primary profile photo into Firebase Storage (<code className="text-amber-300/80">sinuous-gist-471110-i3.firebasestorage.app</code>).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleResetProfilePhoto}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
                >
                  <RotateCcw size={13} />
                  <span>Reset to BUET Photo</span>
                </button>
              </div>

              {profileUploadSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                  <span>{profileUploadSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Interactive Solar Avatar Preview */}
                <div className="lg:col-span-5 p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center space-y-4">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                    Live Website Avatar Preview
                  </span>

                  {/* Circular Avatar with Glowing Ring */}
                  <div className="relative group p-2">
                    <div className="w-40 h-40 sm:w-44 sm:h-44 rounded-full p-1 bg-gradient-to-tr from-[#f0b840] via-[#e8547a] to-[#38d9c0] shadow-2xl shadow-amber-500/30 relative flex items-center justify-center">
                      <img
                        src={draftBiodata.header?.photoUrl || 'https://nasirinboxbd.github.io/nasir/preview.png'}
                        alt="Profile Preview"
                        className="w-full h-full rounded-full object-cover border-4 border-[#0c0817]"
                      />
                      {isUploadingProfile && (
                        <div className="absolute inset-0 bg-black/70 rounded-full flex flex-col items-center justify-center text-amber-300 text-xs gap-2">
                          <RefreshCw size={24} className="animate-spin" />
                          <span>{profileUploadProgress}%</span>
                        </div>
                      )}
                    </div>

                    <label className="absolute bottom-3 right-3 p-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-black shadow-lg cursor-pointer transition active:scale-95" title="Change photo">
                      <Camera size={16} />
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingProfile}
                        onChange={handleProfileImageFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="w-full pt-2 border-t border-white/10 space-y-1">
                    <div className="font-serif font-bold text-base text-white">
                      {draftBiodata.header?.name || 'Md. Nasir Uddin'}
                    </div>
                    <div className="text-xs text-amber-400 font-medium">
                      {draftBiodata.header?.title || 'Assistant Authorized Officer'}
                    </div>
                    <div className="text-[11px] text-white/50">
                      {draftBiodata.header?.subTitle || 'RAJUK, Bangladesh · Civil Engineer'}
                    </div>
                  </div>

                  <div className="w-full p-3 rounded-xl bg-black/30 border border-white/5 text-[11px] text-left space-y-1">
                    <div className="text-white/40 text-[10px] uppercase font-mono">Storage Source:</div>
                    <div className="text-amber-300/90 font-mono break-all text-[10px]">
                      {draftBiodata.header?.photoUrl || 'Default BUET Photo'}
                    </div>
                  </div>
                </div>

                {/* Right Column: Upload to Firebase Storage */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Primary Firebase Storage Drag & Drop Box */}
                  <div className="p-6 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 border border-amber-500/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <CloudUpload size={18} className="text-amber-400" />
                        <span>Upload Photo to Firebase Storage</span>
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                        Firebase Storage Bucket
                      </span>
                    </div>

                    <p className="text-xs text-white/60 leading-relaxed">
                      Select or drag a new profile photo. The image is uploaded directly to your Firebase Storage bucket under <code className="text-amber-300">profile/</code>, and the download URL is saved to your live biodata.
                    </p>

                    {/* Drag and Drop Zone */}
                    <label
                      className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                        isUploadingProfile
                          ? 'border-amber-400 bg-amber-400/10 opacity-80'
                          : 'border-white/20 hover:border-amber-400 hover:bg-white/5 bg-black/20'
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/jpg"
                        disabled={isUploadingProfile}
                        onChange={handleProfileImageFileUpload}
                        className="hidden"
                      />

                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400/20 to-purple-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 mb-3 shadow-lg">
                        {isUploadingProfile ? (
                          <RefreshCw size={24} className="animate-spin text-amber-400" />
                        ) : (
                          <CloudUpload size={24} />
                        )}
                      </div>

                      <div className="text-xs font-semibold text-white mb-1">
                        {isUploadingProfile ? 'Uploading to Firebase Storage...' : 'Click to select photo or drag here'}
                      </div>
                      <div className="text-[11px] text-white/40">
                        Supports JPEG, PNG, WEBP (Max 10MB)
                      </div>

                      {/* Upload Progress Bar */}
                      {isUploadingProfile && (
                        <div className="w-full max-w-xs mt-4 space-y-1">
                          <div className="flex justify-between text-[10px] text-amber-300 font-mono">
                            <span>Uploading to Firebase...</span>
                            <span>{profileUploadProgress}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-black/50 overflow-hidden border border-amber-400/30">
                            <div
                              className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300"
                              style={{ width: `${profileUploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </label>

                    {/* Or Manual URL Input */}
                    <div className="pt-2 border-t border-white/10 space-y-2">
                      <label className="text-xs text-white/70 block font-medium">
                        Or enter direct image URL:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={profilePhotoUrlInput}
                          onChange={(e) => setProfilePhotoUrlInput(e.target.value)}
                          placeholder="https://... image link"
                          className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleApplyProfilePhotoUrl}
                          className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition cursor-pointer"
                        >
                          Apply URL
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Header Title & Badges Customization */}
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-400" />
                      <span>Header Titles & Identity Details</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-white/70 block mb-1">Full Name (English)</label>
                        <input
                          type="text"
                          value={draftBiodata.header?.name || ''}
                          onChange={(e) => {
                            const updated = {
                              ...draftBiodata,
                              header: { ...draftBiodata.header, name: e.target.value },
                            };
                            setDraftBiodata(updated);
                            onUpdateBiodata(updated);
                          }}
                          className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-white/70 block mb-1">পূর্ণ নাম (বাংলায়)</label>
                        <input
                          type="text"
                          value={draftBiodata.header?.nameBn || ''}
                          onChange={(e) => {
                            const updated = {
                              ...draftBiodata,
                              header: { ...draftBiodata.header, nameBn: e.target.value },
                            };
                            setDraftBiodata(updated);
                            onUpdateBiodata(updated);
                          }}
                          className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-white/70 block mb-1">Designation / Title (English)</label>
                        <input
                          type="text"
                          value={draftBiodata.header?.title || ''}
                          onChange={(e) => {
                            const updated = {
                              ...draftBiodata,
                              header: { ...draftBiodata.header, title: e.target.value },
                            };
                            setDraftBiodata(updated);
                            onUpdateBiodata(updated);
                          }}
                          className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-white/70 block mb-1">পদবী (বাংলায়)</label>
                        <input
                          type="text"
                          value={draftBiodata.header?.titleBn || ''}
                          onChange={(e) => {
                            const updated = {
                              ...draftBiodata,
                              header: { ...draftBiodata.header, titleBn: e.target.value },
                            };
                            setDraftBiodata(updated);
                            onUpdateBiodata(updated);
                          }}
                          className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-xs text-white/70 block mb-1">Subtitle Line</label>
                        <input
                          type="text"
                          value={draftBiodata.header?.subTitle || ''}
                          onChange={(e) => {
                            const updated = {
                              ...draftBiodata,
                              header: { ...draftBiodata.header, subTitle: e.target.value },
                            };
                            setDraftBiodata(updated);
                            onUpdateBiodata(updated);
                          }}
                          className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PERSONAL DETAILS (10 FIELDS WITH DATEPICKER & EMOJIPICKER) */}
          {activeTab === 'personal' && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h2 className="text-xl font-serif font-bold text-white mb-1">Personal Details Grid Editor</h2>
                <p className="text-xs text-white/60">
                  Update personal records with the integrated datepicker and emoji picker.
                </p>
              </div>

              {/* Profile Avatar Quick Bar */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={draftBiodata.header?.photoUrl || 'https://nasirinboxbd.github.io/nasir/preview.png'}
                    alt="Profile Avatar"
                    className="w-12 h-12 rounded-xl object-cover border border-amber-400"
                  />
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-2">
                      <span>Primary Profile Image</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-amber-400/20 text-amber-300 rounded font-semibold">Firebase Storage</span>
                    </div>
                    <div className="text-[11px] text-white/50 truncate max-w-sm font-mono mt-0.5">
                      {draftBiodata.header?.photoUrl || 'Default BUET photo'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-black cursor-pointer transition flex items-center gap-1.5">
                    <CloudUpload size={13} />
                    <span>{isUploadingProfile ? `Uploading (${profileUploadProgress}%)...` : 'Change Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingProfile}
                      onChange={handleProfileImageFileUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('profile_photo')}
                    className="px-2.5 py-1.5 rounded-lg text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
                  >
                    Manage
                  </button>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {draftBiodata.personal.map((field, idx) => {
                    const isDate = field.label.toLowerCase().includes('date');
                    return (
                      <div key={field.id} className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-amber-400 font-semibold uppercase tracking-wider text-[10px]">
                            {field.label}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              openEmojiPicker((emoji) => {
                                const updated = [...draftBiodata.personal];
                                updated[idx].icon = emoji;
                                handleFieldChange('personal', updated);
                              }, `Icon for ${field.label}`)
                            }
                            className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 text-[11px] cursor-pointer"
                          >
                            <span>{field.icon || '😀'}</span>
                            <Smile size={12} className="text-amber-400" />
                          </button>
                        </div>

                        <div>
                          <label className="text-[10px] text-white/40 block mb-1">English Value</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={field.value}
                              onChange={(e) => {
                                const updated = [...draftBiodata.personal];
                                updated[idx].value = e.target.value;
                                handleFieldChange('personal', updated);
                              }}
                              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                            />
                            {isDate && (
                              <button
                                type="button"
                                onClick={() =>
                                  openDatePicker(
                                    field.value,
                                    (formattedDate) => {
                                      const updated = [...draftBiodata.personal];
                                      updated[idx].value = formattedDate;
                                      handleFieldChange('personal', updated);
                                    },
                                    `Select ${field.label}`
                                  )
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 border border-amber-400/30 text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <CalendarIcon size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-white/40 block mb-1">বাংলা মান (Bengali Translation)</label>
                          <input
                            type="text"
                            value={field.valueBn || ''}
                            onChange={(e) => {
                              const updated = [...draftBiodata.personal];
                              updated[idx].valueBn = e.target.value;
                              handleFieldChange('personal', updated);
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CAREER & OCCUPATION (RAJUK OFFICER) */}
          {activeTab === 'career' && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h2 className="text-xl font-serif font-bold text-white mb-1">Career & Occupation Details</h2>
                <p className="text-xs text-white/60">
                  Update official government designation, department, grade, and responsibilities.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/60 block mb-1">Designation Title (English)</label>
                    <input
                      type="text"
                      value={draftBiodata.occupation.title}
                      onChange={(e) =>
                        handleFieldChange('occupation', { ...draftBiodata.occupation, title: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/60 block mb-1">পদবী (বাংলায়)</label>
                    <input
                      type="text"
                      value={draftBiodata.occupation.titleBn || ''}
                      onChange={(e) =>
                        handleFieldChange('occupation', { ...draftBiodata.occupation, titleBn: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/60 block mb-1">Organization / Department</label>
                    <input
                      type="text"
                      value={draftBiodata.occupation.organization}
                      onChange={(e) =>
                        handleFieldChange('occupation', { ...draftBiodata.occupation, organization: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/60 block mb-1">দপ্তর / প্রতিষ্ঠান (বাংলায়)</label>
                    <input
                      type="text"
                      value={draftBiodata.occupation.organizationBn || ''}
                      onChange={(e) =>
                        handleFieldChange('occupation', { ...draftBiodata.occupation, organizationBn: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/60 block mb-1">Official Grade Badge</label>
                    <input
                      type="text"
                      value={draftBiodata.occupation.grade}
                      onChange={(e) =>
                        handleFieldChange('occupation', { ...draftBiodata.occupation, grade: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/60 block mb-1">গ্রেড ব্যাজ (বাংলায়)</label>
                    <input
                      type="text"
                      value={draftBiodata.occupation.gradeBn || ''}
                      onChange={(e) =>
                        handleFieldChange('occupation', { ...draftBiodata.occupation, gradeBn: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Duties list */}
                <div className="pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-amber-300 font-semibold block">Key Duties & Responsibilities</label>
                    <button
                      type="button"
                      onClick={() => {
                        const newDuty: OccupationDuty = {
                          id: `duty_${Date.now()}`,
                          text: 'New duty description',
                          textBn: 'নতুন দায়িত্ব বিবরণ',
                        };
                        handleFieldChange('occupation', {
                          ...draftBiodata.occupation,
                          duties: [...draftBiodata.occupation.duties, newDuty],
                        });
                      }}
                      className="text-xs text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} /> Add Duty
                    </button>
                  </div>

                  <div className="space-y-3">
                    {draftBiodata.occupation.duties.map((duty, idx) => (
                      <div key={duty.id} className="p-3 rounded-xl bg-black/30 border border-white/10 flex items-start gap-3">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={duty.text}
                            placeholder="Duty in English"
                            onChange={(e) => {
                              const updated = [...draftBiodata.occupation.duties];
                              updated[idx].text = e.target.value;
                              handleFieldChange('occupation', { ...draftBiodata.occupation, duties: updated });
                            }}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                          <input
                            type="text"
                            value={duty.textBn || ''}
                            placeholder="দায়িত্ব বাংলায়"
                            onChange={(e) => {
                              const updated = [...draftBiodata.occupation.duties];
                              updated[idx].textBn = e.target.value;
                              handleFieldChange('occupation', { ...draftBiodata.occupation, duties: updated });
                            }}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = draftBiodata.occupation.duties.filter((_, i) => i !== idx);
                            handleFieldChange('occupation', { ...draftBiodata.occupation, duties: updated });
                          }}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-white/5 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EDUCATION (BUET, NOTRE DAME, SSC) */}
          {activeTab === 'education' && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-serif font-bold text-white mb-1">Education Credentials Timeline</h2>
                  <p className="text-xs text-white/60">
                    Graduation history from BUET, Notre Dame College, and School records.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newEdu: EducationItem = {
                      id: `edu_${Date.now()}`,
                      institution: 'New Institution',
                      institutionBn: 'শিক্ষা প্রতিষ্ঠান',
                      degree: 'Degree & Passing Year',
                      degreeBn: 'ডিগ্রি ও পাশের সন',
                      year: '2026',
                    };
                    handleFieldChange('education', [...draftBiodata.education, newEdu]);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-400 text-black hover:bg-amber-300 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Plus size={14} /> Add Education Record
                </button>
              </div>

              <div className="space-y-3">
                {draftBiodata.education.map((edu, idx) => (
                  <div key={edu.id} className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-300 flex items-center gap-2">
                        <GraduationCap size={15} /> Milestone #{idx + 1}
                      </span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs text-white/70 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={edu.highlight || false}
                            onChange={(e) => {
                              const updated = [...draftBiodata.education];
                              updated[idx].highlight = e.target.checked;
                              handleFieldChange('education', updated);
                            }}
                            className="rounded accent-amber-400"
                          />
                          <span>Highlight Gold</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = draftBiodata.education.filter((_, i) => i !== idx);
                            handleFieldChange('education', updated);
                          }}
                          className="p-1 text-red-400 hover:text-red-300 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-white/50 block mb-1">Institution (English)</label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => {
                            const updated = [...draftBiodata.education];
                            updated[idx].institution = e.target.value;
                            handleFieldChange('education', updated);
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/50 block mb-1">প্রতিষ্ঠান (বাংলায়)</label>
                        <input
                          type="text"
                          value={edu.institutionBn || ''}
                          onChange={(e) => {
                            const updated = [...draftBiodata.education];
                            updated[idx].institutionBn = e.target.value;
                            handleFieldChange('education', updated);
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/50 block mb-1">Degree & Passing Year (English)</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => {
                            const updated = [...draftBiodata.education];
                            updated[idx].degree = e.target.value;
                            handleFieldChange('education', updated);
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/50 block mb-1">ডিগ্রি ও সাল (বাংলায়)</label>
                        <input
                          type="text"
                          value={edu.degreeBn || ''}
                          onChange={(e) => {
                            const updated = [...draftBiodata.education];
                            updated[idx].degreeBn = e.target.value;
                            handleFieldChange('education', updated);
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: SELF INTRODUCTION */}
          {activeTab === 'intro' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-xl font-serif font-bold text-white mb-1">Self-Introduction Narratives</h2>
                <p className="text-xs text-white/60">
                  Update the candidate's personal statement in both English and Bengali.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div>
                  <label className="text-xs text-white/70 block mb-1.5 font-medium">English Narrative</label>
                  <textarea
                    rows={4}
                    value={draftBiodata.intro.bodyEn}
                    onChange={(e) =>
                      handleFieldChange('intro', { ...draftBiodata.intro, bodyEn: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/70 block mb-1.5 font-medium">বাংলা বিবরণ (Bengali Translation)</label>
                  <textarea
                    rows={4}
                    value={draftBiodata.intro.bodyBn}
                    onChange={(e) =>
                      handleFieldChange('intro', { ...draftBiodata.intro, bodyBn: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-amber-400 font-['Hind_Siliguri']"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: STRENGTHS & GROWTH AREAS */}
          {activeTab === 'strengths' && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h2 className="text-xl font-serif font-bold text-white mb-1">Strengths & Growth Areas</h2>
                <p className="text-xs text-white/60">
                  Edit 2-column cards for key personality strengths and areas of self-growth.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths Column */}
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
                      💪 Strengths ({draftBiodata.strengths.strengths.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...draftBiodata.strengths.strengths, 'New strength'];
                        const updatedBn = [...(draftBiodata.strengths.strengthsBn || []), 'নতুন শক্তি'];
                        handleFieldChange('strengths', { ...draftBiodata.strengths, strengths: updated, strengthsBn: updatedBn });
                      }}
                      className="text-xs text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} /> Add
                    </button>
                  </div>

                  <div className="space-y-2">
                    {draftBiodata.strengths.strengths.map((str, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-black/30 border border-white/10 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={str}
                            placeholder="Strength in English"
                            onChange={(e) => {
                              const updated = [...draftBiodata.strengths.strengths];
                              updated[idx] = e.target.value;
                              handleFieldChange('strengths', { ...draftBiodata.strengths, strengths: updated });
                            }}
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = draftBiodata.strengths.strengths.filter((_, i) => i !== idx);
                              const updatedBn = (draftBiodata.strengths.strengthsBn || []).filter((_, i) => i !== idx);
                              handleFieldChange('strengths', { ...draftBiodata.strengths, strengths: updated, strengthsBn: updatedBn });
                            }}
                            className="p-1 text-red-400 hover:text-red-300 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={draftBiodata.strengths.strengthsBn?.[idx] || ''}
                          placeholder="বাংলা অনুবাদ"
                          onChange={(e) => {
                            const updatedBn = [...(draftBiodata.strengths.strengthsBn || [])];
                            updatedBn[idx] = e.target.value;
                            handleFieldChange('strengths', { ...draftBiodata.strengths, strengthsBn: updatedBn });
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Growth Areas Column */}
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
                      🔧 Growth Areas ({draftBiodata.strengths.growthAreas.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...draftBiodata.strengths.growthAreas, 'New area of growth'];
                        const updatedBn = [...(draftBiodata.strengths.growthAreasBn || []), 'উন্নতির নতুন ক্ষেত্র'];
                        handleFieldChange('strengths', { ...draftBiodata.strengths, growthAreas: updated, growthAreasBn: updatedBn });
                      }}
                      className="text-xs text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} /> Add
                    </button>
                  </div>

                  <div className="space-y-2">
                    {draftBiodata.strengths.growthAreas.map((area, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-black/30 border border-white/10 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={area}
                            placeholder="Growth area in English"
                            onChange={(e) => {
                              const updated = [...draftBiodata.strengths.growthAreas];
                              updated[idx] = e.target.value;
                              handleFieldChange('strengths', { ...draftBiodata.strengths, growthAreas: updated });
                            }}
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = draftBiodata.strengths.growthAreas.filter((_, i) => i !== idx);
                              const updatedBn = (draftBiodata.strengths.growthAreasBn || []).filter((_, i) => i !== idx);
                              handleFieldChange('strengths', { ...draftBiodata.strengths, growthAreas: updated, growthAreasBn: updatedBn });
                            }}
                            className="p-1 text-red-400 hover:text-red-300 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={draftBiodata.strengths.growthAreasBn?.[idx] || ''}
                          placeholder="বাংলা অনুবাদ"
                          onChange={(e) => {
                            const updatedBn = [...(draftBiodata.strengths.growthAreasBn || [])];
                            updatedBn[idx] = e.target.value;
                            handleFieldChange('strengths', { ...draftBiodata.strengths, growthAreasBn: updatedBn });
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: FAMILY BACKGROUND */}
          {activeTab === 'family' && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-serif font-bold text-white mb-1">Family Background Details</h2>
                  <p className="text-xs text-white/60">
                    Parents, brothers, and sister background information.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newMember: FamilyMember = {
                      id: `fam_${Date.now()}`,
                      role: 'Family Member',
                      roleBn: 'পারিবারিক সদস্য',
                      name: 'Full Name',
                      nameBn: 'পূর্ণ নাম',
                      note: 'Occupation / Details',
                      noteBn: 'পেশা বা বিবরণ',
                    };
                    handleFieldChange('family', [...draftBiodata.family, newMember]);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-400 text-black hover:bg-amber-300 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Plus size={14} /> Add Family Member
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {draftBiodata.family.map((member, idx) => (
                  <div key={member.id} className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider text-[11px]">
                        {member.role}
                      </span>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-[11px] text-white/60 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={member.highlight || false}
                            onChange={(e) => {
                              const updated = [...draftBiodata.family];
                              updated[idx].highlight = e.target.checked;
                              handleFieldChange('family', updated);
                            }}
                            className="rounded accent-amber-400"
                          />
                          <span>Highlight</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = draftBiodata.family.filter((_, i) => i !== idx);
                            handleFieldChange('family', updated);
                          }}
                          className="p-1 text-red-400 hover:text-red-300 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-white/50 block mb-0.5">Role (English)</label>
                        <input
                          type="text"
                          value={member.role}
                          onChange={(e) => {
                            const updated = [...draftBiodata.family];
                            updated[idx].role = e.target.value;
                            handleFieldChange('family', updated);
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/50 block mb-0.5">সম্পর্ক (বাংলায়)</label>
                        <input
                          type="text"
                          value={member.roleBn || ''}
                          onChange={(e) => {
                            const updated = [...draftBiodata.family];
                            updated[idx].roleBn = e.target.value;
                            handleFieldChange('family', updated);
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-white/50 block mb-0.5">Name (English)</label>
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => {
                            const updated = [...draftBiodata.family];
                            updated[idx].name = e.target.value;
                            handleFieldChange('family', updated);
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/50 block mb-0.5">নাম (বাংলায়)</label>
                        <input
                          type="text"
                          value={member.nameBn || ''}
                          onChange={(e) => {
                            const updated = [...draftBiodata.family];
                            updated[idx].nameBn = e.target.value;
                            handleFieldChange('family', updated);
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-white/50 block mb-0.5">Details / Profession</label>
                        <input
                          type="text"
                          value={member.note}
                          onChange={(e) => {
                            const updated = [...draftBiodata.family];
                            updated[idx].note = e.target.value;
                            handleFieldChange('family', updated);
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/50 block mb-0.5">পেশা / বিবরণ (বাংলায়)</label>
                        <input
                          type="text"
                          value={member.noteBn || ''}
                          onChange={(e) => {
                            const updated = [...draftBiodata.family];
                            updated[idx].noteBn = e.target.value;
                            handleFieldChange('family', updated);
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: HOBBIES & INTERESTS */}
          {activeTab === 'hobbies' && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-serif font-bold text-white mb-1">Hobbies & Interests</h2>
                  <p className="text-xs text-white/60">
                    Customize leisure activities, reading interests, and icons with emoji picker.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newHobby: HobbyItem = {
                      id: `h_${Date.now()}`,
                      label: 'New Hobby',
                      labelBn: 'নতুন আগ্রহ',
                      icon: '✨',
                      colorClass: 'hobby1',
                    };
                    handleFieldChange('hobbies', [...draftBiodata.hobbies, newHobby]);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-400 text-black hover:bg-amber-300 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Plus size={14} /> Add Hobby Item
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {draftBiodata.hobbies.map((h, idx) => (
                  <div key={h.id} className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        openEmojiPicker((emoji) => {
                          const updated = [...draftBiodata.hobbies];
                          updated[idx].icon = emoji;
                          handleFieldChange('hobbies', updated);
                        }, `Select icon for ${h.label}`)
                      }
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-lg cursor-pointer shrink-0"
                    >
                      {h.icon}
                    </button>

                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={h.label}
                        placeholder="Label in English"
                        onChange={(e) => {
                          const updated = [...draftBiodata.hobbies];
                          updated[idx].label = e.target.value;
                          handleFieldChange('hobbies', updated);
                        }}
                        className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={h.labelBn || ''}
                        placeholder="বাংলা নাম"
                        onChange={(e) => {
                          const updated = [...draftBiodata.hobbies];
                          updated[idx].labelBn = e.target.value;
                          handleFieldChange('hobbies', updated);
                        }}
                        className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = draftBiodata.hobbies.filter((_, i) => i !== idx);
                        handleFieldChange('hobbies', updated);
                      }}
                      className="p-1 text-red-400 hover:text-red-300 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: PREFERRED PARTNER CRITERIA */}
          {activeTab === 'partner' && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h2 className="text-xl font-serif font-bold text-white mb-1">Preferred Partner Expectations</h2>
                <p className="text-xs text-white/60">
                  Update expectations, values, and preferred qualities in a life partner.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div>
                  <label className="text-xs text-white/70 block mb-1 font-medium">Introductory Statement (English)</label>
                  <textarea
                    rows={2}
                    value={draftBiodata.partnerIntro.en}
                    onChange={(e) =>
                      handleFieldChange('partnerIntro', { ...draftBiodata.partnerIntro, en: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/70 block mb-1 font-medium">প্রত্যাশা বিবরণ (বাংলায়)</label>
                  <textarea
                    rows={2}
                    value={draftBiodata.partnerIntro.bn || ''}
                    onChange={(e) =>
                      handleFieldChange('partnerIntro', { ...draftBiodata.partnerIntro, bn: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white font-['Hind_Siliguri']"
                  />
                </div>

                <div className="pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-teal-300">Preference Cards ({draftBiodata.partnerPreferences.length})</h3>
                    <button
                      type="button"
                      onClick={() => {
                        const newPref: PartnerPref = {
                          id: `pref_${Date.now()}`,
                          icon: '✨',
                          label: 'Criteria Title',
                          labelBn: 'যোগ্যতার নাম',
                          value: 'Expected preference',
                          valueBn: 'প্রত্যাশিত মান',
                        };
                        handleFieldChange('partnerPreferences', [...draftBiodata.partnerPreferences, newPref]);
                      }}
                      className="text-xs text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} /> Add Criteria Card
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {draftBiodata.partnerPreferences.map((pref, idx) => (
                      <div key={pref.id} className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() =>
                              openEmojiPicker((emoji) => {
                                const updated = [...draftBiodata.partnerPreferences];
                                updated[idx].icon = emoji;
                                handleFieldChange('partnerPreferences', updated);
                              }, `Icon for ${pref.label}`)
                            }
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-base cursor-pointer"
                          >
                            {pref.icon}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = draftBiodata.partnerPreferences.filter((_, i) => i !== idx);
                              handleFieldChange('partnerPreferences', updated);
                            }}
                            className="p-1 text-red-400 hover:text-red-300 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={pref.label}
                            placeholder="Title (EN)"
                            onChange={(e) => {
                              const updated = [...draftBiodata.partnerPreferences];
                              updated[idx].label = e.target.value;
                              handleFieldChange('partnerPreferences', updated);
                            }}
                            className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
                          />
                          <input
                            type="text"
                            value={pref.labelBn || ''}
                            placeholder="শিরোনাম (বাংলায়)"
                            onChange={(e) => {
                              const updated = [...draftBiodata.partnerPreferences];
                              updated[idx].labelBn = e.target.value;
                              handleFieldChange('partnerPreferences', updated);
                            }}
                            className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={pref.value}
                            placeholder="Value (EN)"
                            onChange={(e) => {
                              const updated = [...draftBiodata.partnerPreferences];
                              updated[idx].value = e.target.value;
                              handleFieldChange('partnerPreferences', updated);
                            }}
                            className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
                          />
                          <input
                            type="text"
                            value={pref.valueBn || ''}
                            placeholder="মান (বাংলায়)"
                            onChange={(e) => {
                              const updated = [...draftBiodata.partnerPreferences];
                              updated[idx].valueBn = e.target.value;
                              handleFieldChange('partnerPreferences', updated);
                            }}
                            className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: PHOTO GALLERY (UPLOAD PHOTOS & CAPTIONS) */}
          {activeTab === 'gallery' && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-serif font-bold text-white mb-1">Photo Gallery & Captions</h2>
                  <p className="text-xs text-white/60">
                    Upload photographs, write captions in English and Bengali, set featured photo, or toggle visibility.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50">Gallery Status:</span>
                  <button
                    onClick={() => handleToggleSectionVisibility('gallery')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      vis.gallery !== false ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                    }`}
                  >
                    {vis.gallery !== false ? 'Gallery Visible' : 'Gallery Hidden'}
                  </button>
                </div>
              </div>

              {/* Add New Image Form */}
              <form onSubmit={handleAddGalleryImage} className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <h3 className="text-sm font-semibold text-rose-300 flex items-center gap-2">
                  <ImageIcon size={16} /> Add New Photo to Album
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* File Upload / Firebase & Base64 */}
                  <div className="space-y-2">
                    <label className="text-xs text-white/70 block font-medium">Upload Photo</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <label className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black cursor-pointer transition shadow">
                        <CloudUpload size={14} />
                        <span>{isUploadingGallery ? 'Uploading to Firebase...' : 'Save to Firebase Storage'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploadingGallery}
                          onChange={handleGalleryFirebaseUpload}
                          className="hidden"
                        />
                      </label>

                      <label className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/15 text-white cursor-pointer border border-white/10 transition">
                        <Upload size={14} />
                        <span>Local Data URL</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-[10px] text-white/40">Uploads directly to Firebase Storage or converts to local data URL.</p>
                  </div>

                  {/* Or External URL */}
                  <div>
                    <label className="text-xs text-white/70 block mb-1 font-medium">Or Paste Image URL</label>
                    <input
                      type="text"
                      value={newGalleryUrl}
                      onChange={(e) => setNewGalleryUrl(e.target.value)}
                      placeholder="https://... or data:image/..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* English Caption */}
                  <div>
                    <label className="text-xs text-white/70 block mb-1 font-medium">Caption (English)</label>
                    <input
                      type="text"
                      value={newGalleryCaption}
                      onChange={(e) => setNewGalleryCaption(e.target.value)}
                      placeholder="e.g. Visiting Padma Bridge site inspection"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Bengali Caption */}
                  <div>
                    <label className="text-xs text-white/70 block mb-1 font-medium">ক্যাপশন (বাংলায়)</label>
                    <input
                      type="text"
                      value={newGalleryCaptionBn}
                      onChange={(e) => setNewGalleryCaptionBn(e.target.value)}
                      placeholder="যেমন: পদ্মা সেতু প্রকল্প পরিদর্শনকালে"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Preview Box if image selected */}
                {newGalleryUrl && (
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-black/40 border border-white/10">
                    <img
                      src={newGalleryUrl}
                      alt="Preview"
                      className="w-16 h-16 rounded-xl object-cover border border-white/20"
                    />
                    <div className="text-xs">
                      <div className="font-semibold text-white">Image Ready to Add</div>
                      <div className="text-white/50 text-[11px] truncate max-w-xs">{newGalleryCaption || 'No caption'}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newGalleryFeatured}
                      onChange={(e) => setNewGalleryFeatured(e.target.checked)}
                      className="rounded accent-amber-400"
                    />
                    <span>Mark as Featured Photo</span>
                  </label>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-400 to-rose-400 text-black hover:brightness-110 shadow-lg shadow-amber-500/20 transition cursor-pointer"
                  >
                    + Add to Gallery
                  </button>
                </div>
              </form>

              {/* Existing Gallery Images */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white">
                  Current Gallery Images ({draftBiodata.gallery?.length || 0})
                </h3>

                {(!draftBiodata.gallery || draftBiodata.gallery.length === 0) ? (
                  <div className="p-8 text-center rounded-xl border border-dashed border-white/20 text-white/50 text-xs">
                    No images in gallery yet. Upload photos above.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {draftBiodata.gallery.map((img, idx) => (
                      <div
                        key={img.id}
                        className="rounded-2xl overflow-hidden border border-white/10 bg-black/40 flex flex-col justify-between"
                      >
                        <div className="relative aspect-[4/3] bg-white/5">
                          <img
                            src={img.url}
                            alt={img.caption}
                            className="w-full h-full object-cover object-top"
                          />
                          {img.isFeatured && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-black">
                              Featured
                            </span>
                          )}
                          <button
                            onClick={() => {
                              const updated = [...(draftBiodata.gallery || [])];
                              updated[idx].visible = !updated[idx].visible;
                              handleFieldChange('gallery', updated);
                            }}
                            className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md cursor-pointer ${
                              img.visible ? 'bg-black/60 text-emerald-400' : 'bg-red-500/80 text-white'
                            }`}
                            title={img.visible ? 'Visible' : 'Hidden'}
                          >
                            {img.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                          </button>
                        </div>

                        <div className="p-3 space-y-2">
                          <input
                            type="text"
                            value={img.caption}
                            onChange={(e) => {
                              const updated = [...(draftBiodata.gallery || [])];
                              updated[idx].caption = e.target.value;
                              handleFieldChange('gallery', updated);
                            }}
                            placeholder="Caption (EN)"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                          />
                          <input
                            type="text"
                            value={img.captionBn || ''}
                            onChange={(e) => {
                              const updated = [...(draftBiodata.gallery || [])];
                              updated[idx].captionBn = e.target.value;
                              handleFieldChange('gallery', updated);
                            }}
                            placeholder="ক্যাপশন (বাংলায়)"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                          />

                          <div className="flex items-center justify-between pt-1">
                            <button
                              onClick={() => {
                                const updated = (draftBiodata.gallery || []).map((item, i) => ({
                                  ...item,
                                  isFeatured: i === idx,
                                }));
                                handleFieldChange('gallery', updated);
                                showToast('Set as featured image.');
                              }}
                              className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Star size={11} /> Set Featured
                            </button>

                            <button
                              onClick={() => handleDeleteGalleryImage(img.id)}
                              className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                              title="Delete photo"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 11: CONTACT & PRIVACY CONTROLS (HIDE PHONE AND EMAIL) */}
          {activeTab === 'contact' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-xl font-serif font-bold text-white mb-1">Contact Details & Privacy Controls</h2>
                <p className="text-xs text-white/60">
                  Control the visibility of your mobile number and email on the public website with a single click.
                </p>
              </div>

              {/* Privacy Toggles (Option to hide email and mobile number) */}
              <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-4">
                <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
                  <ShieldCheck size={16} /> Privacy Controls for Public Visitors
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Phone Toggle */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        <Phone size={14} className="text-amber-400" />
                        <span>Mobile Number Visibility</span>
                      </div>
                      <div className="text-[11px] text-white/50 mt-0.5">
                        {draftBiodata.contact.showPhone ? 'Currently visible on public card' : 'Hidden from public visitors'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = !draftBiodata.contact.showPhone;
                        handleFieldChange('contact', { ...draftBiodata.contact, showPhone: updated });
                        showToast(`Phone number is now ${updated ? 'VISIBLE' : 'HIDDEN'} on public website.`);
                      }}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${
                        draftBiodata.contact.showPhone
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {draftBiodata.contact.showPhone ? (
                        <>
                          <Eye size={13} /> Showing
                        </>
                      ) : (
                        <>
                          <PhoneOff size={13} /> Hidden
                        </>
                      )}
                    </button>
                  </div>

                  {/* Email Toggle */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        <Mail size={14} className="text-purple-400" />
                        <span>Email Address Visibility</span>
                      </div>
                      <div className="text-[11px] text-white/50 mt-0.5">
                        {draftBiodata.contact.showEmail ? 'Currently visible on public card' : 'Hidden from public visitors'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = !draftBiodata.contact.showEmail;
                        handleFieldChange('contact', { ...draftBiodata.contact, showEmail: updated });
                        showToast(`Email address is now ${updated ? 'VISIBLE' : 'HIDDEN'} on public website.`);
                      }}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${
                        draftBiodata.contact.showEmail
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {draftBiodata.contact.showEmail ? (
                        <>
                          <Eye size={13} /> Showing
                        </>
                      ) : (
                        <>
                          <MailX size={13} /> Hidden
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Contact Data Fields */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <h3 className="text-sm font-semibold text-white">Contact Details Values</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/60 block mb-1">Mobile / WhatsApp Number</label>
                    <input
                      type="text"
                      value={draftBiodata.contact.phone}
                      onChange={(e) =>
                        handleFieldChange('contact', { ...draftBiodata.contact, phone: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/60 block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={draftBiodata.contact.email}
                      onChange={(e) =>
                        handleFieldChange('contact', { ...draftBiodata.contact, email: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/60 block mb-1">City / Location (English)</label>
                    <input
                      type="text"
                      value={draftBiodata.contact.location}
                      onChange={(e) =>
                        handleFieldChange('contact', { ...draftBiodata.contact, location: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/60 block mb-1">বর্তমান অবস্থান (বাংলায়)</label>
                    <input
                      type="text"
                      value={draftBiodata.contact.locationBn || ''}
                      onChange={(e) =>
                        handleFieldChange('contact', { ...draftBiodata.contact, locationBn: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 12: SECTION ORDER & VISIBILITY (DRAG AND DROP REORDERING + HIDE/SHOW + CUSTOM SECTIONS) */}
          {activeTab === 'sections' && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-serif font-bold text-white mb-1">Section Order & Visibility</h2>
                  <p className="text-xs text-white/60">
                    Drag and drop or use arrows to customize card order on the frontend. Hide or show any section.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetSectionOrder}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/15 text-white/80 transition cursor-pointer"
                  >
                    Reset Order
                  </button>
                  <button
                    onClick={handleOpenAddSection}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-400 to-rose-400 text-black flex items-center gap-2 shadow-lg shadow-amber-500/20 hover:brightness-110 transition cursor-pointer"
                  >
                    <Plus size={15} /> Add Custom Section
                  </button>
                </div>
              </div>

              {/* ══ DRAG AND DROP SECTION REORDERING CARD ══ */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 border border-amber-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
                      <ArrowUpDown size={16} /> Drag & Drop Card Sequence (Frontend Display Order)
                    </h3>
                    <p className="text-xs text-white/60 mt-0.5">
                      Grab the handle (⋮⋮) to drag cards up or down, or click the ▲ ▼ arrows.
                    </p>
                  </div>
                  <span className="text-xs text-amber-400/80 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                    Live Reactive
                  </span>
                </div>

                <div className="space-y-2">
                  {activeOrderList.map((secKey, idx) => {
                    const meta = getSectionMetadata(secKey);
                    const isVisible = vis[secKey as keyof SectionVisibility] !== false;
                    const isDragging = draggedIndex === idx;
                    const isOver = dragOverIndex === idx && draggedIndex !== idx;

                    return (
                      <div
                        key={secKey}
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDrop={(e) => handleDrop(e, idx)}
                        onDragEnd={handleDragEnd}
                        className={`p-3 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                          isDragging
                            ? 'opacity-40 border-amber-400 bg-amber-500/10 scale-[0.99]'
                            : isOver
                            ? 'border-amber-400 bg-amber-400/20 scale-[1.01]'
                            : 'bg-black/50 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {/* Drag Handle & Position */}
                        <div className="flex items-center gap-3">
                          <div className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg text-white/40 hover:text-amber-400 hover:bg-white/10">
                            <GripVertical size={16} />
                          </div>
                          <span className="w-6 h-6 rounded-lg bg-white/10 text-white/70 font-mono text-xs flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-lg p-1.5 rounded-lg bg-white/5 border border-white/10">
                            {meta.icon}
                          </span>
                          <div>
                            <div className="text-xs font-semibold text-white flex items-center gap-2">
                              <span>{meta.name}</span>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                  isVisible
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-red-500/20 text-red-300'
                                }`}
                              >
                                {isVisible ? 'Visible' : 'Hidden'}
                              </span>
                            </div>
                            <div className="text-[11px] text-white/40">{meta.desc}</div>
                          </div>
                        </div>

                        {/* Order & Visibility Actions */}
                        <div className="flex items-center gap-2">
                          {/* Move Up */}
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveSectionOrder(idx, 'up')}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-20 disabled:cursor-not-allowed text-white/70 hover:text-white cursor-pointer"
                            title="Move Up"
                          >
                            <ChevronUp size={15} />
                          </button>

                          {/* Move Down */}
                          <button
                            type="button"
                            disabled={idx === activeOrderList.length - 1}
                            onClick={() => moveSectionOrder(idx, 'down')}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-20 disabled:cursor-not-allowed text-white/70 hover:text-white cursor-pointer"
                            title="Move Down"
                          >
                            <ChevronDown size={15} />
                          </button>

                          {/* Visibility Toggle */}
                          {secKey in vis && (
                            <button
                              type="button"
                              onClick={() => handleToggleSectionVisibility(secKey as keyof SectionVisibility)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                                isVisible
                                  ? 'bg-white/10 hover:bg-white/20 text-white'
                                  : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                              }`}
                            >
                              {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                              <span>{isVisible ? 'Hide' : 'Show'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom User Added Sections */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
                    <Layers size={16} /> Custom Added Sections ({draftBiodata.customSections?.length || 0})
                  </h3>
                  <button
                    onClick={handleOpenAddSection}
                    className="text-xs text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} /> Add New Section
                  </button>
                </div>

                {(!draftBiodata.customSections || draftBiodata.customSections.length === 0) ? (
                  <div className="p-6 text-center rounded-xl border border-dashed border-white/20 text-white/50 text-xs">
                    No custom sections created yet. Click "+ Add Custom Section" to create one.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {draftBiodata.customSections.map((sec) => (
                      <div
                        key={sec.id}
                        className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl p-1.5 rounded-lg bg-white/5">{sec.icon}</span>
                          <div>
                            <div className="text-xs font-semibold text-white flex items-center gap-2">
                              <span>{sec.title}</span>
                              <span className="text-[10px] text-amber-400">({sec.accent})</span>
                            </div>
                            <div className="text-[11px] text-white/50">{sec.titleBn} · {sec.items.length} items</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const updated = (draftBiodata.customSections || []).map((s) =>
                                s.id === sec.id ? { ...s, visible: !s.visible } : s
                              );
                              handleFieldChange('customSections', updated);
                            }}
                            className={`p-1.5 rounded-lg text-xs cursor-pointer ${
                              sec.visible ? 'text-emerald-400 bg-emerald-500/10' : 'text-white/40 bg-white/5'
                            }`}
                          >
                            {sec.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                          </button>
                          <button
                            onClick={() => {
                              setEditingSection(sec);
                              setIsSectionModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-white/70 hover:text-white cursor-pointer"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomSection(sec.id)}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-300 cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 13: THEME AND COLORS */}
          {activeTab === 'theme' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-xl font-serif font-bold text-white mb-1">Theme and Colors Customizer</h2>
                <p className="text-xs text-white/60">
                  Adjust CSS color variables and atmospheric visual effects.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-amber-300">Color Palette Tokens</h3>
                  <button
                    onClick={() => {
                      onRestoreDefault();
                      showToast('Default original palette restored.');
                    }}
                    className="text-xs text-amber-400 hover:underline cursor-pointer"
                  >
                    Reset to Original Theme
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[11px] text-white/60 block mb-1">Primary Gold</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draftTheme.primaryColor}
                        onChange={(e) => {
                          setDraftTheme({ ...draftTheme, primaryColor: e.target.value });
                          setHasUnsavedChanges(true);
                        }}
                        className="w-8 h-8 rounded border border-white/20 bg-transparent cursor-pointer"
                      />
                      <span className="text-xs font-mono">{draftTheme.primaryColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-white/60 block mb-1">Secondary Rose</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draftTheme.secondaryColor}
                        onChange={(e) => {
                          setDraftTheme({ ...draftTheme, secondaryColor: e.target.value });
                          setHasUnsavedChanges(true);
                        }}
                        className="w-8 h-8 rounded border border-white/20 bg-transparent cursor-pointer"
                      />
                      <span className="text-xs font-mono">{draftTheme.secondaryColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-white/60 block mb-1">Teal Accent</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draftTheme.accentColor}
                        onChange={(e) => {
                          setDraftTheme({ ...draftTheme, accentColor: e.target.value });
                          setHasUnsavedChanges(true);
                        }}
                        className="w-8 h-8 rounded border border-white/20 bg-transparent cursor-pointer"
                      />
                      <span className="text-xs font-mono">{draftTheme.accentColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-white/60 block mb-1">Deep Background</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draftTheme.bgColor}
                        onChange={(e) => {
                          setDraftTheme({ ...draftTheme, bgColor: e.target.value });
                          setHasUnsavedChanges(true);
                        }}
                        className="w-8 h-8 rounded border border-white/20 bg-transparent cursor-pointer"
                      />
                      <span className="text-xs font-mono">{draftTheme.bgColor}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <h3 className="text-sm font-semibold text-white">Atmospheric Effects Toggles</h3>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftTheme.enableParticles}
                      onChange={(e) => {
                        setDraftTheme({ ...draftTheme, enableParticles: e.target.checked });
                        setHasUnsavedChanges(true);
                      }}
                      className="rounded accent-amber-400"
                    />
                    <span>Enable Background Constellation Particle Canvas</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftTheme.enableFloatingEmojis}
                      onChange={(e) => {
                        setDraftTheme({ ...draftTheme, enableFloatingEmojis: e.target.checked });
                        setHasUnsavedChanges(true);
                      }}
                      className="rounded accent-amber-400"
                    />
                    <span>Enable Floating Marriage Emojis & Falling Petals</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftTheme.enableCustomCursor}
                      onChange={(e) => {
                        setDraftTheme({ ...draftTheme, enableCustomCursor: e.target.checked });
                        setHasUnsavedChanges(true);
                      }}
                      className="rounded accent-amber-400"
                    />
                    <span>Enable Beating Heart Trailing Cursor</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 14: FONTS & TYPOGRAPHY */}
          {activeTab === 'fonts' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-xl font-serif font-bold text-white mb-1">Fonts and Typography</h2>
                <p className="text-xs text-white/60">
                  Configure fonts for English calligraphy, section headings, and Bengali Unicode rendering.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-white/60 block mb-1">Heading Serif Font</label>
                    <select
                      value={draftTheme.headingFont}
                      onChange={(e) => {
                        setDraftTheme({ ...draftTheme, headingFont: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
                    >
                      <option value="'Playfair Display', serif" className="bg-[#140b27]">Playfair Display (Original)</option>
                      <option value="'Cinzel', serif" className="bg-[#140b27]">Cinzel (Classic Roman)</option>
                      <option value="'Plus Jakarta Sans', sans-serif" className="bg-[#140b27]">Plus Jakarta Sans (Modern)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-white/60 block mb-1">Body Text Font</label>
                    <select
                      value={draftTheme.bodyFont}
                      onChange={(e) => {
                        setDraftTheme({ ...draftTheme, bodyFont: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
                    >
                      <option value="'Raleway', sans-serif" className="bg-[#140b27]">Raleway (Original)</option>
                      <option value="'Inter', sans-serif" className="bg-[#140b27]">Inter (Clean)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-white/60 block mb-1">Bengali Font (বাংলা)</label>
                    <select
                      value={draftTheme.bengaliFont}
                      onChange={(e) => {
                        setDraftTheme({ ...draftTheme, bengaliFont: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
                    >
                      <option value="'Hind Siliguri', sans-serif" className="bg-[#140b27]">Hind Siliguri (Recommended)</option>
                      <option value="'Noto Sans Bengali', sans-serif" className="bg-[#140b27]">Noto Sans Bengali</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-center space-y-1">
                  <div className="font-serif text-lg font-bold text-amber-300">
                    Md. Nasir Uddin — Assistant Authorized Officer
                  </div>
                  <div className="text-xs text-white/70">
                    আসসালামু আলাইকুম। আমার নাম মোঃ নাসির উদ্দিন, বয়স ২৮ বছর।
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 15: ACCOUNT & SECURITY (SET ADMIN PASSWORD) */}
          {activeTab === 'security' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-xl font-serif font-bold text-white mb-1">Account & Security</h2>
                <p className="text-xs text-white/60">
                  Sole administrator credentials and password management.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Authorized Administrator Email</div>
                    <div className="text-xs text-amber-300 font-mono">{adminEmail}</div>
                  </div>
                </div>

                {/* Password Setting (Addresses User Request 8: Set my password to: F=kq1q2/d^2) */}
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        <KeyRound size={14} className="text-amber-400" />
                        <span>Administrator Master Password</span>
                      </div>
                      <div className="text-[11px] text-white/50 mt-0.5">
                        Current active password: <span className="font-mono text-amber-300">F=kq1q2/d^2</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-amber-400 hover:underline cursor-pointer"
                    >
                      {showPassword ? 'Hide' : 'Reveal'}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={adminPasswordInput}
                      onChange={(e) => setAdminPasswordInput(e.target.value)}
                      placeholder="Enter administrator password"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.setItem('nasir_admin_password', adminPasswordInput.trim());
                        showToast(`Password successfully updated to: ${adminPasswordInput.trim()}`);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-400 text-black hover:bg-amber-300 cursor-pointer transition shadow-md"
                    >
                      Save Password
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (onLogout) onLogout();
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-500/20 text-red-300 hover:bg-red-500/30 transition flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut size={14} /> End Session & Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 16: BACKUP AND RESTORE */}
          {activeTab === 'backup' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-xl font-serif font-bold text-white mb-1">Backup and Restore</h2>
                <p className="text-xs text-white/60">
                  Export complete biodata configuration as JSON or restore from an existing backup file.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
                  <Download size={16} /> Export Current Configuration
                </h3>
                <p className="text-xs text-white/70">
                  Download a complete snapshot containing all personal information, career details, family records, partner preferences, gallery photos, custom sections, and styling.
                </p>
                <button
                  onClick={() => {
                    const dataStr =
                      'data:text/json;charset=utf-8,' +
                      encodeURIComponent(JSON.stringify(draftBiodata, null, 2));
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute('href', dataStr);
                    downloadAnchor.setAttribute('download', `nasir_biodata_backup_${Date.now()}.json`);
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                    showToast('Backup JSON file downloaded.');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-400 text-black hover:bg-amber-300 transition flex items-center gap-2 cursor-pointer"
                >
                  <Download size={14} /> Download Biodata JSON Backup
                </button>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                  <Upload size={16} /> Restore from JSON Backup
                </h3>
                <p className="text-xs text-white/70">
                  Upload an existing valid backup file to instantly populate the draft editor.
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      try {
                        const parsed = JSON.parse(event.target?.result as string);
                        if (parsed.personal && parsed.occupation) {
                          setDraftBiodata(parsed);
                          setHasUnsavedChanges(true);
                          showToast('Configuration restored from backup file.');
                        } else {
                          showToast('Invalid backup file structure.');
                        }
                      } catch (err) {
                        showToast('Error reading backup JSON file.');
                      }
                    };
                    reader.readAsText(file);
                  }}
                  className="text-xs text-white/60 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 17: ACTIVITY LOG */}
          {activeTab === 'activity' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-xl font-serif font-bold text-white mb-1">Administrative Activity Log</h2>
                <p className="text-xs text-white/60">
                  Audit trail of recent publication events, section updates, and backups.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                {(!draftBiodata.activityLogs || draftBiodata.activityLogs.length === 0) ? (
                  <p className="text-xs text-white/40">No activity logged yet.</p>
                ) : (
                  <div className="space-y-2">
                    {draftBiodata.activityLogs.map((log) => (
                      <div key={log.id} className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs">
                        <div className="flex items-center justify-between font-semibold text-amber-300">
                          <span>{log.action}</span>
                          <span className="text-[10px] text-white/40 font-mono">{log.timestamp}</span>
                        </div>
                        <div className="text-[11px] text-white/70 mt-1">{log.details}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ══ MODAL: ADD / EDIT CUSTOM SECTION WITH DETAILED INFO ══ */}
      {isSectionModalOpen && editingSection && (
        <div className="fixed inset-0 z-[11500] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-2xl max-h-[90vh] rounded-3xl bg-[#140b27] border border-amber-500/30 p-6 shadow-2xl text-[#f0ead8] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl p-1.5 rounded-xl bg-white/5 border border-white/10">
                  {editingSection.icon}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {editingSection.id.startsWith('sec_') ? 'Configure Custom Section' : 'Edit Section'}
                  </h3>
                  <p className="text-xs text-white/50">Add custom details, cards, or milestones</p>
                </div>
              </div>
              <button
                onClick={() => setIsSectionModalOpen(false)}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto py-4 space-y-5 custom-scrollbar pr-1">
              {/* Section Identity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/60 block mb-1">Section Title (English)</label>
                  <input
                    type="text"
                    value={editingSection.title}
                    onChange={(e) =>
                      setEditingSection({ ...editingSection, title: e.target.value })
                    }
                    placeholder="e.g. Research Papers & Patents"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/60 block mb-1">শিরোনাম (বাংলায়)</label>
                  <input
                    type="text"
                    value={editingSection.titleBn || ''}
                    onChange={(e) =>
                      setEditingSection({ ...editingSection, titleBn: e.target.value })
                    }
                    placeholder="যেমন: গবেষণা ও উদ্ভাবন"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-['Hind_Siliguri']"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/60 block mb-1">Section Emoji Icon</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xl p-2 rounded-xl bg-white/5 border border-white/10">
                      {editingSection.icon}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        openEmojiPicker((emoji) => {
                          setEditingSection({ ...editingSection, icon: emoji });
                        }, 'Pick Icon for Section')
                      }
                      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      <Smile size={14} className="text-amber-400" />
                      Choose Emoji
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/60 block mb-1">Accent Glow Color</label>
                  <select
                    value={editingSection.accent}
                    onChange={(e) => {
                      const acc = e.target.value as CustomSection['accent'];
                      const rgbMap: Record<CustomSection['accent'], string> = {
                        gold: '240,184,64',
                        rose: '232,84,122',
                        teal: '56,217,192',
                        lavender: '176,127,255',
                        mint: '86,227,160',
                        sky: '79,195,247',
                      };
                      setEditingSection({
                        ...editingSection,
                        accent: acc,
                        pcol: rgbMap[acc] || '56,217,192',
                      });
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
                  >
                    <option value="teal" className="bg-[#140b27]">Teal / Emerald</option>
                    <option value="gold" className="bg-[#140b27]">Gold / Amber</option>
                    <option value="rose" className="bg-[#140b27]">Rose / Pink</option>
                    <option value="lavender" className="bg-[#140b27]">Lavender / Violet</option>
                    <option value="mint" className="bg-[#140b27]">Mint / Green</option>
                    <option value="sky" className="bg-[#140b27]">Sky / Cyan</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-white/60 block mb-1">Display Layout Type</label>
                  <select
                    value={editingSection.type}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        type: e.target.value as CustomSection['type'],
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
                  >
                    <option value="grid" className="bg-[#140b27]">Structured Card Grid</option>
                    <option value="timeline" className="bg-[#140b27]">Vertical Timeline</option>
                    <option value="list" className="bg-[#140b27]">Detailed Item List</option>
                  </select>
                </div>
              </div>

              {/* Items Management */}
              <div className="pt-3 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-amber-300">
                    Detailed Items in this Section ({editingSection.items.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const newItem: CustomSectionItem = {
                        id: `item_${Date.now()}`,
                        label: 'Field Label',
                        labelBn: 'বিবরণ শিরোনাম',
                        value: 'Field Value',
                        valueBn: 'মান বা তথ্য',
                        icon: '✦',
                      };
                      setEditingSection({
                        ...editingSection,
                        items: [...editingSection.items, newItem],
                      });
                    }}
                    className="text-xs text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} /> Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {editingSection.items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2 relative"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editingSection.items.filter((_, i) => i !== idx);
                          setEditingSection({ ...editingSection, items: updated });
                        }}
                        className="absolute top-2.5 right-2.5 text-red-400 hover:text-red-300 p-1 cursor-pointer"
                        title="Delete item"
                      >
                        <Trash2 size={13} />
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-6">
                        <div>
                          <label className="text-[10px] text-white/50 block mb-0.5">Title / Label (EN)</label>
                          <input
                            type="text"
                            value={item.label}
                            onChange={(e) => {
                              const updated = [...editingSection.items];
                              updated[idx].label = e.target.value;
                              setEditingSection({ ...editingSection, items: updated });
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-white/50 block mb-0.5">শিরোনাম (বাংলায়)</label>
                          <input
                            type="text"
                            value={item.labelBn || ''}
                            onChange={(e) => {
                              const updated = [...editingSection.items];
                              updated[idx].labelBn = e.target.value;
                              setEditingSection({ ...editingSection, items: updated });
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-white/50 block mb-0.5">Detail / Value (EN)</label>
                          <input
                            type="text"
                            value={item.value}
                            onChange={(e) => {
                              const updated = [...editingSection.items];
                              updated[idx].value = e.target.value;
                              setEditingSection({ ...editingSection, items: updated });
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-white/50 block mb-0.5">বিস্তারিত তথ্য (বাংলায়)</label>
                          <input
                            type="text"
                            value={item.valueBn || ''}
                            onChange={(e) => {
                              const updated = [...editingSection.items];
                              updated[idx].valueBn = e.target.value;
                              setEditingSection({ ...editingSection, items: updated });
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => setIsSectionModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomSection}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-400 to-rose-400 text-black shadow-lg shadow-amber-500/20 hover:brightness-110 transition cursor-pointer"
              >
                Save Section to Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: DATE PICKER ══ */}
      <DatePickerModal
        isOpen={datePickerState.isOpen}
        initialDate={datePickerState.initialDate}
        title={datePickerState.title}
        onSelectDate={datePickerState.onSelect}
        onClose={() => setDatePickerState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* ══ MODAL: EMOJI PICKER ══ */}
      <EmojiPickerModal
        isOpen={emojiPickerState.isOpen}
        title={emojiPickerState.title}
        onSelectEmoji={emojiPickerState.onSelect}
        onClose={() => setEmojiPickerState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
