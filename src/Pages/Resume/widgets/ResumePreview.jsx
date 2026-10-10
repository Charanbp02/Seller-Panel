// src/Pages/Resume/widgets/ResumePreview.jsx
import React from 'react';
import {
  Mail, Phone, MapPin, Globe, Linkedin, Github, Briefcase,
  GraduationCap, Award, Languages as LangIcon, Trophy, Heart,
  Star, User, Link as LinkIcon, Calendar
} from 'lucide-react';
import { formatDateRange, formatMonth, skillLevelLabel } from '../utils/resumeHelpers';

// ============================================================
// HELPER COMPONENTS
// ============================================================

// Accent color with opacity
const withAlpha = (hex, alpha) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// ============================================================
// MODERN TEMPLATE (Colorful, Two-column)
// ============================================================
const ModernTemplate = ({ data }) => {
  const accent = data.accentColor || '#2563eb';

  const SectionHeading = ({ icon: Icon, children }) => (
    <div className="flex items-center gap-2 mb-3 mt-5 first:mt-0">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: withAlpha(accent, 0.12) }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
      </div>
      <h2
        className="text-[13px] font-bold uppercase tracking-wider"
        style={{ color: accent }}
      >
        {children}
      </h2>
      <div
        className="flex-1 h-[2px] rounded-full ml-1"
        style={{ backgroundColor: withAlpha(accent, 0.15) }}
      />
    </div>
  );

  return (
    <div className="bg-white text-[11.5px] leading-relaxed text-gray-700" style={{ minHeight: '1123px' }}>
      {/* ===== HEADER ===== */}
      <header
        className="relative px-8 py-6 text-white overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${accent} 0%, ${withAlpha(accent, 0.75)} 100%)`,
        }}
      >
        {/* Decorative circle */}
        <div
          className="absolute -right-16 -top-16 w-48 h-48 rounded-full opacity-10"
          style={{ backgroundColor: 'white' }}
        />
        <div
          className="absolute -right-8 top-24 w-32 h-32 rounded-full opacity-5"
          style={{ backgroundColor: 'white' }}
        />

        <div className="relative">
          <h1 className="text-3xl font-bold tracking-tight">
            {data.fullName || 'Your Name'}
          </h1>
          {data.jobTitle && (
            <p className="text-sm mt-1 opacity-95 font-medium tracking-wide">
              {data.jobTitle}
            </p>
          )}

          {/* Contact info as chips */}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[10.5px]">
            {data.email && (
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-3 h-3 opacity-90" /> {data.email}
              </span>
            )}
            {data.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="w-3 h-3 opacity-90" /> {data.phone}
              </span>
            )}
            {data.address && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3 h-3 opacity-90" /> {data.address}
              </span>
            )}
            {data.website && (
              <span className="inline-flex items-center gap-1.5">
                <Globe className="w-3 h-3 opacity-90" /> {data.website}
              </span>
            )}
            {data.linkedin && (
              <span className="inline-flex items-center gap-1.5">
                <Linkedin className="w-3 h-3 opacity-90" /> {data.linkedin}
              </span>
            )}
            {data.github && (
              <span className="inline-flex items-center gap-1.5">
                <Github className="w-3 h-3 opacity-90" /> {data.github}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ===== BODY ===== */}
      <div className="px-8 py-5">
        {/* Summary */}
        {data.summary && (
          <section className="mb-4">
            <SectionHeading icon={User}>Professional Summary</SectionHeading>
            <p className="text-gray-700 pl-1">{data.summary}</p>
          </section>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left column (main content) */}
          <div className="col-span-2">
            {/* Experience */}
            {data.experience?.length > 0 && (
              <section>
                <SectionHeading icon={Briefcase}>Experience</SectionHeading>
                <div className="space-y-4 pl-1">
                  {data.experience.map((exp, idx) => (
                    <div key={exp.id} className="relative pl-4">
                      {/* Timeline dot */}
                      <div
                        className="absolute left-0 top-1.5 w-2 h-2 rounded-full"
                        style={{ backgroundColor: accent }}
                      />
                      {/* Timeline line */}
                      {idx < data.experience.length - 1 && (
                        <div
                          className="absolute left-[3.5px] top-4 bottom-[-16px] w-[1px]"
                          style={{ backgroundColor: withAlpha(accent, 0.25) }}
                        />
                      )}

                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-[12.5px]">
                            {exp.role}
                          </h3>
                          <p
                            className="text-[11px] font-semibold"
                            style={{ color: accent }}
                          >
                            {exp.company}
                            {exp.location && ` · ${exp.location}`}
                          </p>
                        </div>
                        <span className="text-[10px] text-gray-500 whitespace-nowrap bg-gray-100 px-2 py-0.5 rounded">
                          {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                        </span>
                      </div>

                      {exp.description && (
                        <p className="mt-1.5 text-gray-600 whitespace-pre-line">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Projects */}
            {data.projects?.length > 0 && (
              <section>
                <SectionHeading icon={Briefcase}>Projects</SectionHeading>
                <div className="space-y-3 pl-1">
                  {data.projects.map((prj) => (
                    <div
                      key={prj.id}
                      className="p-3 rounded-lg border"
                      style={{
                        borderColor: withAlpha(accent, 0.15),
                        backgroundColor: withAlpha(accent, 0.03),
                      }}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h3 className="font-bold text-gray-900 text-[12px]">
                            {prj.name}
                          </h3>
                          {prj.tech && (
                            <p
                              className="text-[10px] mt-0.5 font-medium"
                              style={{ color: accent }}
                            >
                              {prj.tech}
                            </p>
                          )}
                        </div>
                        {prj.link && (
                          <span className="text-[9.5px] text-gray-500 inline-flex items-center gap-1">
                            <LinkIcon className="w-2.5 h-2.5" /> {prj.link}
                          </span>
                        )}
                      </div>
                      {prj.description && (
                        <p className="mt-1 text-gray-600">{prj.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right column (sidebar) */}
          <div className="col-span-1">
            {/* Skills with bars */}
            {data.skills?.length > 0 && (
              <section>
                <SectionHeading icon={Star}>Skills</SectionHeading>
                <div className="space-y-2 pl-1">
                  {data.skills.map((s) => (
                    <div key={s.id}>
                      <div className="flex justify-between text-[10.5px] mb-1">
                        <span className="font-medium text-gray-800">{s.name}</span>
                        <span className="text-gray-500 text-[9.5px]">
                          {skillLevelLabel(s.level)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(s.level / 5) * 100}%`,
                            background: `linear-gradient(90deg, ${accent} 0%, ${withAlpha(accent, 0.6)} 100%)`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Education */}
            {data.education?.length > 0 && (
              <section>
                <SectionHeading icon={GraduationCap}>Education</SectionHeading>
                <div className="space-y-3 pl-1">
                  {data.education.map((edu) => (
                    <div key={edu.id}>
                      <h3 className="font-bold text-gray-900 text-[11.5px] leading-tight">
                        {edu.degree}
                        {edu.field && ` in ${edu.field}`}
                      </h3>
                      <p className="text-[10.5px] text-gray-600 mt-0.5">
                        {edu.school}
                      </p>
                      <div className="flex items-center gap-1 text-[9.5px] text-gray-500 mt-0.5">
                        <Calendar className="w-2.5 h-2.5" />
                        {formatDateRange(edu.startDate, edu.endDate, false)}
                      </div>
                      {edu.grade && (
                        <p
                          className="text-[10px] mt-0.5 font-semibold"
                          style={{ color: accent }}
                        >
                          {edu.grade}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Certifications */}
            {data.certifications?.length > 0 && (
              <section>
                <SectionHeading icon={Award}>Certifications</SectionHeading>
                <div className="space-y-2 pl-1">
                  {data.certifications.map((c) => (
                    <div key={c.id}>
                      <h3 className="font-semibold text-gray-900 text-[10.5px] leading-tight">
                        {c.name}
                      </h3>
                      <p className="text-[9.5px] text-gray-500">
                        {c.issuer} {c.date && `· ${formatMonth(c.date)}`}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Languages */}
            {data.languages?.length > 0 && (
              <section>
                <SectionHeading icon={LangIcon}>Languages</SectionHeading>
                <div className="space-y-1 pl-1">
                  {data.languages.map((l) => (
                    <div
                      key={l.id}
                      className="flex justify-between items-center text-[10.5px]"
                    >
                      <span className="font-medium text-gray-800">{l.name}</span>
                      <span className="text-gray-500 text-[9.5px]">{l.level}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Achievements */}
            {data.achievements?.length > 0 && (
              <section>
                <SectionHeading icon={Trophy}>Achievements</SectionHeading>
                <div className="space-y-2 pl-1">
                  {data.achievements.map((a) => (
                    <div key={a.id}>
                      <h3 className="font-semibold text-gray-900 text-[10.5px] leading-tight">
                        {a.title}
                      </h3>
                      {a.date && (
                        <p className="text-[9.5px] text-gray-500">
                          {formatMonth(a.date)}
                        </p>
                      )}
                      {a.description && (
                        <p className="text-[10px] text-gray-600 mt-0.5">
                          {a.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Hobbies */}
            {data.hobbies?.length > 0 && (
              <section>
                <SectionHeading icon={Heart}>Interests</SectionHeading>
                <div className="flex flex-wrap gap-1.5 pl-1">
                  {data.hobbies.map((h) => (
                    <span
                      key={h.id}
                      className="px-2 py-0.5 rounded text-[10px] font-medium"
                      style={{
                        backgroundColor: withAlpha(accent, 0.1),
                        color: accent,
                      }}
                    >
                      {h.name}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// CLASSIC TEMPLATE (Traditional, single column)
// ============================================================
const ClassicTemplate = ({ data }) => {
  const accent = data.accentColor || '#2563eb';

  const SectionHeading = ({ children }) => (
    <div className="mb-3 mt-5 first:mt-0">
      <h2
        className="text-[13px] font-bold uppercase tracking-widest text-center"
        style={{ color: accent }}
      >
        {children}
      </h2>
      <div
        className="h-[2px] w-full mt-1"
        style={{ backgroundColor: accent }}
      />
    </div>
  );

  return (
    <div className="bg-white text-[11.5px] leading-relaxed text-gray-700 px-10 py-8" style={{ minHeight: '1123px' }}>
      {/* ===== HEADER ===== */}
      <header className="text-center pb-4 mb-2 border-b-4" style={{ borderColor: accent }}>
        <h1
          className="text-4xl font-serif font-bold tracking-wide uppercase"
          style={{ color: accent }}
        >
          {data.fullName || 'Your Name'}
        </h1>
        {data.jobTitle && (
          <p className="text-base mt-2 text-gray-600 tracking-widest uppercase font-medium">
            {data.jobTitle}
          </p>
        )}
        <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10.5px] text-gray-600">
          {data.email && (
            <span className="inline-flex items-center gap-1">
              <Mail className="w-3 h-3" /> {data.email}
            </span>
          )}
          {data.phone && (
            <span className="inline-flex items-center gap-1">
              <Phone className="w-3 h-3" /> {data.phone}
            </span>
          )}
          {data.address && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {data.address}
            </span>
          )}
        </div>
        {(data.website || data.linkedin || data.github) && (
          <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10.5px] text-gray-600">
            {data.website && <span>{data.website}</span>}
            {data.linkedin && <span>· {data.linkedin}</span>}
            {data.github && <span>· {data.github}</span>}
          </div>
        )}
      </header>

      {/* ===== Summary ===== */}
      {data.summary && (
        <section>
          <SectionHeading>Professional Summary</SectionHeading>
          <p className="text-justify">{data.summary}</p>
        </section>
      )}

      {/* ===== Experience ===== */}
      {data.experience?.length > 0 && (
        <section>
          <SectionHeading>Professional Experience</SectionHeading>
          <div className="space-y-4">
            {data.experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <h3 className="font-bold text-gray-900 text-[12.5px]">
                      {exp.role}
                    </h3>
                    <p className="italic text-gray-700 text-[11.5px]">
                      {exp.company}
                      {exp.location && `, ${exp.location}`}
                    </p>
                  </div>
                  <span className="text-[10.5px] text-gray-500 font-medium">
                    {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                  </span>
                </div>
                {exp.description && (
                  <p className="mt-1 text-justify whitespace-pre-line pl-4">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== Education ===== */}
      {data.education?.length > 0 && (
        <section>
          <SectionHeading>Education</SectionHeading>
          <div className="space-y-3">
            {data.education.map((edu) => (
              <div key={edu.id}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <h3 className="font-bold text-gray-900 text-[12.5px]">
                      {edu.degree}
                      {edu.field && ` in ${edu.field}`}
                    </h3>
                    <p className="italic text-gray-700 text-[11.5px]">
                      {edu.school}
                      {edu.location && `, ${edu.location}`}
                    </p>
                  </div>
                  <span className="text-[10.5px] text-gray-500 font-medium">
                    {formatDateRange(edu.startDate, edu.endDate, false)}
                  </span>
                </div>
                {edu.grade && (
                  <p className="text-[11px] italic text-gray-600 mt-0.5">
                    {edu.grade}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== Skills ===== */}
      {data.skills?.length > 0 && (
        <section>
          <SectionHeading>Skills</SectionHeading>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            {data.skills.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
                <span className="text-[11.5px] font-medium">{s.name}</span>
                <span className="text-[10px] text-gray-500 ml-auto">
                  {skillLevelLabel(s.level)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== Projects ===== */}
      {data.projects?.length > 0 && (
        <section>
          <SectionHeading>Projects</SectionHeading>
          <div className="space-y-2">
            {data.projects.map((prj) => (
              <div key={prj.id}>
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-gray-900 text-[12px]">
                    {prj.name}
                    {prj.tech && <span className="font-normal italic"> — {prj.tech}</span>}
                  </h3>
                  {prj.link && (
                    <span className="text-[10px] text-gray-500">{prj.link}</span>
                  )}
                </div>
                {prj.description && (
                  <p className="text-justify">{prj.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== Certifications ===== */}
      {data.certifications?.length > 0 && (
        <section>
          <SectionHeading>Certifications</SectionHeading>
          <ul className="space-y-1">
            {data.certifications.map((c) => (
              <li key={c.id} className="flex justify-between">
                <span>
                  <span className="font-semibold">{c.name}</span>
                  {c.issuer && ` — ${c.issuer}`}
                </span>
                <span className="text-[10.5px] text-gray-500">
                  {formatMonth(c.date)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ===== Achievements ===== */}
      {data.achievements?.length > 0 && (
        <section>
          <SectionHeading>Achievements</SectionHeading>
          <ul className="space-y-1.5">
            {data.achievements.map((a) => (
              <li key={a.id}>
                <span className="font-semibold">{a.title}</span>
                {a.date && (
                  <span className="text-[10.5px] text-gray-500 ml-2">
                    ({formatMonth(a.date)})
                  </span>
                )}
                {a.description && (
                  <p className="text-justify">{a.description}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ===== Languages & Hobbies ===== */}
      <div className="grid grid-cols-2 gap-6">
        {data.languages?.length > 0 && (
          <section>
            <SectionHeading>Languages</SectionHeading>
            <ul className="space-y-1">
              {data.languages.map((l) => (
                <li key={l.id} className="flex justify-between">
                  <span className="font-medium">{l.name}</span>
                  <span className="text-gray-500">{l.level}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        {data.hobbies?.length > 0 && (
          <section>
            <SectionHeading>Interests</SectionHeading>
            <p>{data.hobbies.map((h) => h.name).join(', ')}</p>
          </section>
        )}
      </div>
    </div>
  );
};

// ============================================================
// MINIMAL TEMPLATE (Clean, contemporary)
// ============================================================
const MinimalTemplate = ({ data }) => {
  const accent = data.accentColor || '#111827';

  const SectionHeading = ({ children }) => (
    <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 mb-3 mt-6 first:mt-0">
      {children}
    </h2>
  );

  return (
    <div className="bg-white text-[11.5px] leading-relaxed text-gray-700 px-10 py-10" style={{ minHeight: '1123px' }}>
      {/* ===== HEADER ===== */}
      <header className="mb-6">
        <h1 className="text-4xl font-light tracking-tight text-gray-900">
          {data.fullName || 'Your Name'}
        </h1>
        {data.jobTitle && (
          <p className="text-base mt-1 font-light" style={{ color: accent }}>
            {data.jobTitle}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[10.5px] text-gray-500">
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>· {data.phone}</span>}
          {data.address && <span>· {data.address}</span>}
        </div>
        {(data.website || data.linkedin || data.github) && (
          <div className="mt-1 flex flex-wrap gap-x-3 text-[10.5px] text-gray-500">
            {data.website && <span>{data.website}</span>}
            {data.linkedin && <span>· {data.linkedin}</span>}
            {data.github && <span>· {data.github}</span>}
          </div>
        )}
      </header>

      <div className="h-px bg-gray-200 mb-6" />

      {/* ===== Summary ===== */}
      {data.summary && (
        <section>
          <SectionHeading>Profile</SectionHeading>
          <p className="text-gray-700 leading-relaxed">{data.summary}</p>
        </section>
      )}

      {/* ===== Experience ===== */}
      {data.experience?.length > 0 && (
        <section>
          <SectionHeading>Experience</SectionHeading>
          <div className="space-y-5">
            {data.experience.map((exp) => (
              <div key={exp.id} className="grid grid-cols-4 gap-4">
                <div className="col-span-1 text-[10.5px] text-gray-400 pt-0.5">
                  {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                </div>
                <div className="col-span-3">
                  <h3 className="font-medium text-gray-900">{exp.role}</h3>
                  <p className="text-[11px] text-gray-500 mb-1.5">
                    {exp.company}
                    {exp.location && ` · ${exp.location}`}
                  </p>
                  {exp.description && (
                    <p className="text-gray-600 leading-relaxed">{exp.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== Education ===== */}
      {data.education?.length > 0 && (
        <section>
          <SectionHeading>Education</SectionHeading>
          <div className="space-y-3">
            {data.education.map((edu) => (
              <div key={edu.id} className="grid grid-cols-4 gap-4">
                <div className="col-span-1 text-[10.5px] text-gray-400 pt-0.5">
                  {formatDateRange(edu.startDate, edu.endDate, false)}
                </div>
                <div className="col-span-3">
                  <h3 className="font-medium text-gray-900">
                    {edu.degree}
                    {edu.field && ` · ${edu.field}`}
                  </h3>
                  <p className="text-[11px] text-gray-500">{edu.school}</p>
                  {edu.grade && (
                    <p className="text-[10.5px] text-gray-400 mt-0.5">{edu.grade}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== Skills ===== */}
      {data.skills?.length > 0 && (
        <section>
          <SectionHeading>Skills</SectionHeading>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((s) => (
              <span
                key={s.id}
                className="px-2.5 py-1 text-[10.5px] font-medium rounded-full border border-gray-200 text-gray-700"
              >
                {s.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ===== Projects ===== */}
      {data.projects?.length > 0 && (
        <section>
          <SectionHeading>Projects</SectionHeading>
          <div className="space-y-3">
            {data.projects.map((prj) => (
              <div key={prj.id}>
                <div className="flex justify-between items-baseline">
                  <h3 className="font-medium text-gray-900">{prj.name}</h3>
                  {prj.link && (
                    <span className="text-[10px] text-gray-400">{prj.link}</span>
                  )}
                </div>
                {prj.tech && (
                  <p className="text-[10.5px] text-gray-500 italic">{prj.tech}</p>
                )}
                {prj.description && (
                  <p className="text-gray-600 mt-0.5">{prj.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== Certifications + Achievements ===== */}
      {data.certifications?.length > 0 && (
        <section>
          <SectionHeading>Certifications</SectionHeading>
          <ul className="space-y-1">
            {data.certifications.map((c) => (
              <li key={c.id} className="flex justify-between text-[11px]">
                <span className="font-medium text-gray-800">
                  {c.name}
                  {c.issuer && <span className="font-normal text-gray-500"> · {c.issuer}</span>}
                </span>
                <span className="text-gray-400">{formatMonth(c.date)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.achievements?.length > 0 && (
        <section>
          <SectionHeading>Achievements</SectionHeading>
          <ul className="space-y-2">
            {data.achievements.map((a) => (
              <li key={a.id}>
                <p className="font-medium text-gray-900 text-[11.5px]">
                  {a.title}
                  {a.date && <span className="text-gray-400 font-normal"> · {formatMonth(a.date)}</span>}
                </p>
                {a.description && (
                  <p className="text-gray-600">{a.description}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ===== Languages & Hobbies ===== */}
      {(data.languages?.length > 0 || data.hobbies?.length > 0) && (
        <div className="grid grid-cols-2 gap-6 mt-6">
          {data.languages?.length > 0 && (
            <section>
              <SectionHeading>Languages</SectionHeading>
              <p className="text-gray-700">
                {data.languages.map((l) => `${l.name} (${l.level})`).join(' · ')}
              </p>
            </section>
          )}
          {data.hobbies?.length > 0 && (
            <section>
              <SectionHeading>Interests</SectionHeading>
              <p className="text-gray-700">
                {data.hobbies.map((h) => h.name).join(' · ')}
              </p>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================
// MAIN — ROUTER BASED ON TEMPLATE
// ============================================================
const ResumePreview = ({ data }) => {
  const template = data.template || 'modern';

  if (template === 'classic') return <ClassicTemplate data={data} />;
  if (template === 'minimal') return <MinimalTemplate data={data} />;
  return <ModernTemplate data={data} />;
};

export default ResumePreview;