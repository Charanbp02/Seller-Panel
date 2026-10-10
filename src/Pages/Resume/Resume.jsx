// src/Pages/Resume/Resume.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, User, Briefcase, GraduationCap, Wrench, FolderKanban,
  Award, Languages as LangIcon, Trophy, Heart, Plus, Trash2,
  Save, Download, Upload, Printer, Eye, Edit3, X, ChevronDown,
  ChevronUp, RotateCcw, FileDown, Loader2
} from 'lucide-react';

import {
  emptyResume, emptyExperience, emptyEducation, emptySkill,
  emptyProject, emptyCertification, emptyLanguage,
  emptyAchievement, emptyHobby, sampleResume,
  skillLevelLabel,
  saveResumeLocal, loadResumeLocal, clearResumeLocal,
  printResume, exportResumeJSON, importResumeJSON,
  downloadResumePDF,
} from './utils/resumeHelpers';
// ಮೇಲಿನ imports ನಲ್ಲಿ:
import TemplateSelector from './widgets/TemplateSelector';
import ResumePreview from './widgets/ResumePreview';

// ============================================================
// Small UI helpers
// ============================================================
const SectionCard = ({ title, icon: Icon, count, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 rounded-lg">
            <Icon className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="font-medium text-gray-900">{title}</span>
          {count !== undefined && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100">{children}</div>
      )}
    </div>
  );
};

const Input = ({ label, value, onChange, placeholder, type = 'text' }) => (
  <div>
    {label && (
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    )}
    <input
      type={type}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
    />
  </div>
);

const Textarea = ({ label, value, onChange, rows = 3, placeholder }) => (
  <div>
    {label && (
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    )}
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
    />
  </div>
);

// ============================================================
// MAIN
// ============================================================
const Resume = () => {
  const [data, setData] = useState(emptyResume());
  const [activeTab, setActiveTab] = useState('edit');
  const [saved, setSaved] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Load
  useEffect(() => {
    const existing = loadResumeLocal();
    if (existing) {
      setData({ ...emptyResume(), ...existing });
    }
  }, []);

  // Auto-save (debounced)
  useEffect(() => {
    setSaved(false);
    const t = setTimeout(() => {
      saveResumeLocal(data);
      setSaved(true);
      setLastSaved(new Date());
    }, 800);
    return () => clearTimeout(t);
  }, [data]);

  // Helpers
  const patch = useCallback((p) => setData((d) => ({ ...d, ...p })), []);

  const patchArrayItem = useCallback((key, id, patchItem) => {
    setData((d) => ({
      ...d,
      [key]: d[key].map((item) =>
        item.id === id ? { ...item, ...patchItem } : item
      ),
    }));
  }, []);

  const addItem = useCallback((key, factory) => {
    setData((d) => ({ ...d, [key]: [...d[key], factory()] }));
  }, []);

  const removeItem = useCallback((key, id) => {
    setData((d) => ({ ...d, [key]: d[key].filter((item) => item.id !== id) }));
  }, []);

  const handleReset = () => {
    if (!window.confirm('ಎಲ್ಲಾ ಡೇಟಾ ಅಳಿಸಿ ಹೊಸದಾಗಿ ಪ್ರಾರಂಭಿಸುವುದೇ?')) return;
    setData(emptyResume());
    clearResumeLocal();
  };

  const handleLoadSample = () => {
    if (!window.confirm('ನಮೂನೆ ಡೇಟಾ ತುಂಬುವುದೇ? ನಿಮ್ಮ ಈಗಿನ ಡೇಟಾ ಬದಲಾಗುತ್ತದೆ.')) return;
    setData(sampleResume());
  };

  const handleSaveNow = () => {
    saveResumeLocal(data);
    setSaved(true);
    setLastSaved(new Date());
  };

  const handleExport = () => {
    exportResumeJSON(data);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importResumeJSON(file);
      if (window.confirm('ಫೈಲ್‌ನಿಂದ ಡೇಟಾ ತುಂಬುವುದೇ? ಈಗಿನ ಡೇಟಾ ಬದಲಾಗುತ್ತದೆ.')) {
        setData({ ...emptyResume(), ...imported });
      }
    } catch (err) {
      alert('ಫೈಲ್ ಓದಲು ಆಗಲಿಲ್ಲ: ' + err.message);
    }
    e.target.value = '';
  };

  const handleDownloadPDF = async () => {
    if (!data.fullName) {
      alert('ದಯವಿಟ್ಟು ಮೊದಲು ನಿಮ್ಮ ಹೆಸರು ತುಂಬಿಸಿ.');
      return;
    }
    setGeneratingPDF(true);
    try {
      await downloadResumePDF(data, (msg) => console.log(msg));
    } catch (err) {
      alert('PDF ತಯಾರಿಸಲು ಆಗಲಿಲ್ಲ: ' + err.message);
    } finally {
      setGeneratingPDF(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-4 md:space-y-5">
      {/* ===== Header ===== */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur rounded-xl">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Resume Builder</h1>
              <p className="text-indigo-100 text-sm">
                {saved ? 'ಎಲ್ಲಾ ಬದಲಾವಣೆಗಳು ಉಳಿಸಲಾಗಿದೆ' : 'ಉಳಿಸುತ್ತಿದೆ...'}
                {lastSaved && ` • ${lastSaved.toLocaleTimeString()}`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleLoadSample}
              className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Sample
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Reset
            </button>
            <label className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" /> Import
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            <button
              onClick={handleExport}
              className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Export
            </button>
            <button
              onClick={handleSaveNow}
              className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save
            </button>

            {/* 🆕 PDF DOWNLOAD — main button */}
            <button
              onClick={handleDownloadPDF}
              disabled={generatingPDF}
              className="px-4 py-2 bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> ತಯಾರಿಸುತ್ತಿದೆ...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" /> PDF ಡೌನ್‌ಲೋಡ್
                </>
              )}
            </button>

            <button
              onClick={printResume}
              className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium flex items-center gap-2"
              title="Browser Print → Save as PDF"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>
      </div>

      {/* ===== Mobile Tab Switcher ===== */}
      <div className="lg:hidden flex bg-white rounded-xl shadow-sm border border-gray-100 p-1">
        <button
          onClick={() => setActiveTab('edit')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition ${
            activeTab === 'edit' ? 'bg-indigo-500 text-white' : 'text-gray-600'
          }`}
        >
          <Edit3 className="w-4 h-4" /> Edit
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition ${
            activeTab === 'preview' ? 'bg-indigo-500 text-white' : 'text-gray-600'
          }`}
        >
          <Eye className="w-4 h-4" /> Preview
        </button>
      </div>

      {/* ===== Two-panel layout ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* ---------- LEFT: FORM ---------- */}
        <div className={`space-y-3 ${activeTab === 'preview' ? 'hidden lg:block' : ''}`}>
          {/* Personal Info */}
          <SectionCard title="Personal Info" icon={User}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="Full Name" value={data.fullName} onChange={(v) => patch({ fullName: v })} placeholder="Rahul Kumar" />
              <Input label="Job Title" value={data.jobTitle} onChange={(v) => patch({ jobTitle: v })} placeholder="Full Stack Developer" />
              <Input label="Email" value={data.email} onChange={(v) => patch({ email: v })} placeholder="you@example.com" />
              <Input label="Phone" value={data.phone} onChange={(v) => patch({ phone: v })} placeholder="+91 98765 43210" />
              <Input label="Address" value={data.address} onChange={(v) => patch({ address: v })} placeholder="City, State, Country" />
              <Input label="Website" value={data.website} onChange={(v) => patch({ website: v })} placeholder="yoursite.com" />
              <Input label="LinkedIn" value={data.linkedin} onChange={(v) => patch({ linkedin: v })} placeholder="linkedin.com/in/you" />
              <Input label="GitHub" value={data.github} onChange={(v) => patch({ github: v })} placeholder="github.com/you" />
            </div>
            <div className="mt-3">
              <Textarea
                label="Professional Summary"
                value={data.summary}
                onChange={(v) => patch({ summary: v })}
                rows={4}
                placeholder="2-3 lines about yourself..."
              />
            </div>
          </SectionCard>

          {/* Experience */}
          <SectionCard title="Work Experience" icon={Briefcase} count={data.experience.length}>
            <div className="space-y-3">
              {data.experience.map((exp) => (
                <div key={exp.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Input label="Company" value={exp.company} onChange={(v) => patchArrayItem('experience', exp.id, { company: v })} />
                    <Input label="Role" value={exp.role} onChange={(v) => patchArrayItem('experience', exp.id, { role: v })} />
                    <Input label="Location" value={exp.location} onChange={(v) => patchArrayItem('experience', exp.id, { location: v })} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="Start" type="month" value={exp.startDate} onChange={(v) => patchArrayItem('experience', exp.id, { startDate: v })} />
                      <Input label="End" type="month" value={exp.endDate} onChange={(v) => patchArrayItem('experience', exp.id, { endDate: v })} />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`cur-${exp.id}`}
                      checked={exp.current}
                      onChange={(e) => patchArrayItem('experience', exp.id, { current: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor={`cur-${exp.id}`} className="text-xs text-gray-600">
                      Currently working here
                    </label>
                  </div>
                  <div className="mt-2">
                    <Textarea
                      label="Description"
                      value={exp.description}
                      onChange={(v) => patchArrayItem('experience', exp.id, { description: v })}
                      rows={3}
                      placeholder="What did you do?"
                    />
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button onClick={() => removeItem('experience', exp.id)} className="text-red-600 hover:bg-red-50 rounded p-1.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => addItem('experience', emptyExperience)}
                className="w-full py-2 border-2 border-dashed border-gray-300 hover:border-indigo-400 text-gray-600 hover:text-indigo-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Experience
              </button>
            </div>
          </SectionCard>

          {/* Education */}
          <SectionCard title="Education" icon={GraduationCap} count={data.education.length} defaultOpen={false}>
            <div className="space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Input label="School / University" value={edu.school} onChange={(v) => patchArrayItem('education', edu.id, { school: v })} />
                    <Input label="Degree" value={edu.degree} onChange={(v) => patchArrayItem('education', edu.id, { degree: v })} />
                    <Input label="Field of Study" value={edu.field} onChange={(v) => patchArrayItem('education', edu.id, { field: v })} />
                    <Input label="Location" value={edu.location} onChange={(v) => patchArrayItem('education', edu.id, { location: v })} />
                    <Input label="Start" type="month" value={edu.startDate} onChange={(v) => patchArrayItem('education', edu.id, { startDate: v })} />
                    <Input label="End" type="month" value={edu.endDate} onChange={(v) => patchArrayItem('education', edu.id, { endDate: v })} />
                    <Input label="Grade / CGPA" value={edu.grade} onChange={(v) => patchArrayItem('education', edu.id, { grade: v })} />
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button onClick={() => removeItem('education', edu.id)} className="text-red-600 hover:bg-red-50 rounded p-1.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => addItem('education', emptyEducation)}
                className="w-full py-2 border-2 border-dashed border-gray-300 hover:border-indigo-400 text-gray-600 hover:text-indigo-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Education
              </button>
            </div>
          </SectionCard>

          {/* Skills */}
          <SectionCard title="Skills" icon={Wrench} count={data.skills.length} defaultOpen={false}>
            <div className="space-y-2">
              {data.skills.map((skill) => (
                <div key={skill.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={skill.name}
                    onChange={(e) => patchArrayItem('skills', skill.id, { name: e.target.value })}
                    placeholder="Skill name"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg"
                  />
                  <select
                    value={skill.level}
                    onChange={(e) => patchArrayItem('skills', skill.id, { level: parseInt(e.target.value, 10) })}
                    className="px-2 py-2 text-sm border border-gray-200 rounded-lg"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{skillLevelLabel(n)}</option>
                    ))}
                  </select>
                  <button onClick={() => removeItem('skills', skill.id)} className="text-red-600 hover:bg-red-50 rounded p-1.5">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addItem('skills', emptySkill)}
                className="w-full py-2 border-2 border-dashed border-gray-300 hover:border-indigo-400 text-gray-600 hover:text-indigo-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Skill
              </button>
            </div>
          </SectionCard>

          {/* Projects */}
          <SectionCard title="Projects" icon={FolderKanban} count={data.projects.length} defaultOpen={false}>
            <div className="space-y-3">
              {data.projects.map((prj) => (
                <div key={prj.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Input label="Project Name" value={prj.name} onChange={(v) => patchArrayItem('projects', prj.id, { name: v })} />
                    <Input label="Link" value={prj.link} onChange={(v) => patchArrayItem('projects', prj.id, { link: v })} placeholder="github.com/..." />
                    <Input label="Tech Stack" value={prj.tech} onChange={(v) => patchArrayItem('projects', prj.id, { tech: v })} placeholder="React, Node.js" />
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="Start" type="month" value={prj.startDate} onChange={(v) => patchArrayItem('projects', prj.id, { startDate: v })} />
                      <Input label="End" type="month" value={prj.endDate} onChange={(v) => patchArrayItem('projects', prj.id, { endDate: v })} />
                    </div>
                  </div>
                  <div className="mt-2">
                    <Textarea label="Description" value={prj.description} onChange={(v) => patchArrayItem('projects', prj.id, { description: v })} rows={2} />
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button onClick={() => removeItem('projects', prj.id)} className="text-red-600 hover:bg-red-50 rounded p-1.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => addItem('projects', emptyProject)}
                className="w-full py-2 border-2 border-dashed border-gray-300 hover:border-indigo-400 text-gray-600 hover:text-indigo-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Project
              </button>
            </div>
          </SectionCard>

          {/* Certifications */}
          <SectionCard title="Certifications" icon={Award} count={data.certifications.length} defaultOpen={false}>
            <div className="space-y-2">
              {data.certifications.map((c) => (
                <div key={c.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Input label="Name" value={c.name} onChange={(v) => patchArrayItem('certifications', c.id, { name: v })} />
                    <Input label="Issuer" value={c.issuer} onChange={(v) => patchArrayItem('certifications', c.id, { issuer: v })} />
                    <Input label="Date" type="month" value={c.date} onChange={(v) => patchArrayItem('certifications', c.id, { date: v })} />
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button onClick={() => removeItem('certifications', c.id)} className="text-red-600 hover:bg-red-50 rounded p-1.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => addItem('certifications', emptyCertification)}
                className="w-full py-2 border-2 border-dashed border-gray-300 hover:border-indigo-400 text-gray-600 hover:text-indigo-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Certification
              </button>
            </div>
          </SectionCard>

          {/* Languages */}
          <SectionCard title="Languages" icon={LangIcon} count={data.languages.length} defaultOpen={false}>
            <div className="space-y-2">
              {data.languages.map((l) => (
                <div key={l.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={l.name}
                    onChange={(e) => patchArrayItem('languages', l.id, { name: e.target.value })}
                    placeholder="Language"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg"
                  />
                  <select
                    value={l.level}
                    onChange={(e) => patchArrayItem('languages', l.id, { level: e.target.value })}
                    className="px-2 py-2 text-sm border border-gray-200 rounded-lg"
                  >
                    {['Basic', 'Conversational', 'Fluent', 'Native'].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                  <button onClick={() => removeItem('languages', l.id)} className="text-red-600 hover:bg-red-50 rounded p-1.5">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addItem('languages', emptyLanguage)}
                className="w-full py-2 border-2 border-dashed border-gray-300 hover:border-indigo-400 text-gray-600 hover:text-indigo-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Language
              </button>
            </div>
          </SectionCard>

          {/* Achievements */}
          <SectionCard title="Achievements" icon={Trophy} count={data.achievements.length} defaultOpen={false}>
            <div className="space-y-2">
              {data.achievements.map((a) => (
                <div key={a.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Input label="Title" value={a.title} onChange={(v) => patchArrayItem('achievements', a.id, { title: v })} />
                    <Input label="Date" type="month" value={a.date} onChange={(v) => patchArrayItem('achievements', a.id, { date: v })} />
                  </div>
                  <div className="mt-2">
                    <Textarea label="Description" value={a.description} onChange={(v) => patchArrayItem('achievements', a.id, { description: v })} rows={2} />
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button onClick={() => removeItem('achievements', a.id)} className="text-red-600 hover:bg-red-50 rounded p-1.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => addItem('achievements', emptyAchievement)}
                className="w-full py-2 border-2 border-dashed border-gray-300 hover:border-indigo-400 text-gray-600 hover:text-indigo-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Achievement
              </button>
            </div>
          </SectionCard>

          {/* Hobbies */}
          <SectionCard title="Hobbies" icon={Heart} count={data.hobbies.length} defaultOpen={false}>
            <div className="space-y-2">
              {data.hobbies.map((h) => (
                <div key={h.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={h.name}
                    onChange={(e) => patchArrayItem('hobbies', h.id, { name: e.target.value })}
                    placeholder="Hobby"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg"
                  />
                  <button onClick={() => removeItem('hobbies', h.id)} className="text-red-600 hover:bg-red-50 rounded p-1.5">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addItem('hobbies', emptyHobby)}
                className="w-full py-2 border-2 border-dashed border-gray-300 hover:border-indigo-400 text-gray-600 hover:text-indigo-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Hobby
              </button>
            </div>
          </SectionCard>
        </div>

        {/* ---------- RIGHT: PREVIEW ---------- */}
        {/* ---------- RIGHT: PREVIEW ---------- */}
<div className={activeTab === 'edit' ? 'hidden lg:block' : ''}>
  <div className="lg:sticky lg:top-4 space-y-4">
    {/* Template & Color selector */}
    <TemplateSelector
      template={data.template}
      accentColor={data.accentColor}
      onChange={(patch) => setData((d) => ({ ...d, ...patch }))}
    />

    {/* Preview */}
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 md:p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Eye className="w-4 h-4" /> Live Preview
        </h2>
        <span className="text-[10px] text-gray-400 uppercase tracking-wider">
          {data.template || 'modern'}
        </span>
      </div>
      <div className="bg-gray-100 rounded-xl overflow-hidden max-h-[800px] overflow-y-auto">
        <div id="resume-print-area" className="bg-white">
          <ResumePreview data={data} />
        </div>
      </div>
    </div>
  </div>
</div>
      </div>
    </div>
  );
};

export default Resume;