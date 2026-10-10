// src/Pages/Resume/utils/resumeHelpers.js

// ============================================================
// EMPTY TEMPLATES
// ============================================================
export const emptyResume = () => ({
  fullName: '',
  jobTitle: '',
  email: '',
  phone: '',
  address: '',
  website: '',
  linkedin: '',
  github: '',
  summary: '',
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  achievements: [],
  hobbies: [],
  template: 'modern',
  accentColor: '#2563eb',
});

export const emptyExperience = () => ({
  id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  company: '',
  role: '',
  location: '',
  startDate: '',
  endDate: '',
  current: false,
  description: '',
});

export const emptyEducation = () => ({
  id: `edu_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  school: '',
  degree: '',
  field: '',
  location: '',
  startDate: '',
  endDate: '',
  grade: '',
});

export const emptySkill = () => ({
  id: `skl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  name: '',
  level: 3,
});

export const emptyProject = () => ({
  id: `prj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  name: '',
  link: '',
  tech: '',
  description: '',
  startDate: '',
  endDate: '',
});

export const emptyCertification = () => ({
  id: `crt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  name: '',
  issuer: '',
  date: '',
  link: '',
});

export const emptyLanguage = () => ({
  id: `lng_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  name: '',
  level: 'Fluent',
});

export const emptyAchievement = () => ({
  id: `ach_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  title: '',
  date: '',
  description: '',
});

export const emptyHobby = () => ({
  id: `hby_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  name: '',
});

// ============================================================
// SAMPLE DATA
// ============================================================
export const sampleResume = () => ({
  fullName: 'Rahul Kumar',
  jobTitle: 'Full Stack Developer',
  email: 'rahul@example.com',
  phone: '+91 98765 43210',
  address: 'Bengaluru, Karnataka, India',
  website: 'rahulkumar.dev',
  linkedin: 'linkedin.com/in/rahulkumar',
  github: 'github.com/rahulkumar',
  summary: 'Passionate full-stack developer with 5 years of experience building scalable web applications. Proficient in React, Node.js, and cloud services. Strong focus on clean code, performance, and user experience.',
  experience: [
    {
      id: 'exp_1',
      company: 'Tech Solutions Pvt Ltd',
      role: 'Senior Full Stack Developer',
      location: 'Bengaluru',
      startDate: '2022-01',
      endDate: '',
      current: true,
      description: 'Leading a team of 4 developers building a SaaS platform serving 10,000+ users. Reduced page load time by 40% through code splitting and lazy loading.',
    },
    {
      id: 'exp_2',
      company: 'StartupXYZ',
      role: 'Full Stack Developer',
      location: 'Remote',
      startDate: '2019-06',
      endDate: '2021-12',
      current: false,
      description: 'Built REST APIs with Node.js + PostgreSQL. Implemented authentication and payment gateway integration. Collaborated with design team on UI/UX.',
    },
  ],
  education: [
    {
      id: 'edu_1',
      school: 'IIT Bangalore',
      degree: 'B.Tech',
      field: 'Computer Science',
      location: 'Bengaluru',
      startDate: '2015-08',
      endDate: '2019-05',
      grade: '8.5 CGPA',
    },
  ],
  skills: [
    { id: 'skl_1', name: 'JavaScript', level: 5 },
    { id: 'skl_2', name: 'React', level: 5 },
    { id: 'skl_3', name: 'Node.js', level: 4 },
    { id: 'skl_4', name: 'MongoDB', level: 4 },
    { id: 'skl_5', name: 'Firebase', level: 4 },
    { id: 'skl_6', name: 'TypeScript', level: 3 },
    { id: 'skl_7', name: 'Docker', level: 3 },
    { id: 'skl_8', name: 'AWS', level: 3 },
  ],
  projects: [
    {
      id: 'prj_1',
      name: 'E-Commerce Platform',
      link: 'github.com/rahul/ecommerce',
      tech: 'React, Node.js, MongoDB, Stripe',
      startDate: '2023-03',
      endDate: '2023-08',
      description: 'Full-featured e-commerce platform with product catalog, cart, checkout, and admin dashboard. Integrated Stripe payments and real-time order tracking.',
    },
    {
      id: 'prj_2',
      name: 'Task Manager App',
      link: 'github.com/rahul/taskmanager',
      tech: 'React Native, Firebase',
      startDate: '2022-01',
      endDate: '2022-04',
      description: 'Cross-platform mobile app for personal task management with cloud sync, reminders, and collaborative lists.',
    },
  ],
  certifications: [
    { id: 'crt_1', name: 'AWS Certified Developer', issuer: 'Amazon Web Services', date: '2023-06', link: '' },
    { id: 'crt_2', name: 'MongoDB Developer', issuer: 'MongoDB University', date: '2022-09', link: '' },
  ],
  languages: [
    { id: 'lng_1', name: 'English', level: 'Fluent' },
    { id: 'lng_2', name: 'Hindi', level: 'Native' },
    { id: 'lng_3', name: 'Kannada', level: 'Native' },
  ],
  achievements: [
    { id: 'ach_1', title: 'Employee of the Year', date: '2023-12', description: 'Awarded for outstanding contribution to the flagship product.' },
  ],
  hobbies: [
    { id: 'hby_1', name: 'Reading' },
    { id: 'hby_2', name: 'Chess' },
    { id: 'hby_3', name: 'Photography' },
  ],
  template: 'modern',
  accentColor: '#2563eb',
});

// ============================================================
// FORMATTING HELPERS
// ============================================================
export const formatMonth = (ym) => {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  if (!y || !m) return ym;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const idx = parseInt(m, 10) - 1;
  return `${months[idx] || m} ${y}`;
};

export const formatDateRange = (start, end, current) => {
  const s = formatMonth(start);
  const e = current ? 'Present' : formatMonth(end);
  if (!s && !e) return '';
  if (!s) return e;
  if (!e) return s;
  return `${s} – ${e}`;
};

export const skillLevelLabel = (n) => {
  const labels = ['', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];
  return labels[n] || '';
};

// ============================================================
// LOCALSTORAGE
// ============================================================
const STORAGE_KEY = 'userResumeData_v1';

export const saveResumeLocal = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Save resume failed:', e);
    return false;
  }
};

export const loadResumeLocal = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Load resume failed:', e);
    return null;
  }
};

export const clearResumeLocal = () => {
  localStorage.removeItem(STORAGE_KEY);
};

// ============================================================
// PRINT (Browser dialog)
// ============================================================
export const printResume = () => {
  document.body.classList.add('printing-resume');
  setTimeout(() => {
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-resume');
    }, 500);
  }, 100);
};

// ============================================================
// PDF DOWNLOAD — html2pdf.js
// ============================================================
// ============================================================
// PDF DOWNLOAD — Proper A4 layout with html2pdf.js
// ============================================================
export const downloadResumePDF = async (data, onProgress) => {
  try {
    const html2pdf = (await import('html2pdf.js')).default;

    const sourceElement = document.getElementById('resume-print-area');
    if (!sourceElement) {
      throw new Error('Resume preview element not found. ದಯವಿಟ್ಟು Preview tab ತೆರೆಯಿರಿ.');
    }

    onProgress?.('PDF ತಯಾರಿಸುತ್ತಿದೆ...');

    // ============================================================
    // STEP 1: Clone the element into an off-screen container
    //         so we can control exact A4 size without page CSS
    // ============================================================
    const clone = sourceElement.cloneNode(true);

    // Force exact A4 width (210mm ≈ 794px at 96dpi)
    const A4_WIDTH_PX = 794;

    // Wrapper that positions off-screen
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.left = '-10000px';
    wrapper.style.top = '0';
    wrapper.style.width = `${A4_WIDTH_PX}px`;
    wrapper.style.backgroundColor = '#ffffff';
    wrapper.style.zIndex = '-1';

    // Style the clone itself
    clone.style.width = `${A4_WIDTH_PX}px`;
    clone.style.margin = '0';
    clone.style.padding = '0';
    clone.style.boxShadow = 'none';
    clone.style.backgroundColor = '#ffffff';

    // Remove any existing print CSS interference
    clone.classList.remove('printing-resume');
    clone.removeAttribute('id'); // avoid id duplication

    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    // ============================================================
    // STEP 2: Generate PDF with tuned options
    // ============================================================
    const fileName = `${(data.fullName || 'My').replace(/\s+/g, '_')}_Resume.pdf`;

    const options = {
      margin: [0, 0, 0, 0],              // No PDF margins — layout provides its own
      filename: fileName,
      image: {
        type: 'jpeg',
        quality: 0.98,
      },
      html2canvas: {
        scale: 2,                        // 2x for retina sharpness
        useCORS: true,
        letterRendering: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: A4_WIDTH_PX,
        windowWidth: A4_WIDTH_PX,
        scrollX: 0,
        scrollY: 0,
        allowTaint: true,
        removeContainer: true,
      },
      jsPDF: {
        unit: 'px',                      // Use pixels for exact match
        format: [A4_WIDTH_PX, 1123],     // 794 × 1123 px = A4 at 96dpi
        orientation: 'portrait',
        compress: true,
      },
      pagebreak: {
        mode: ['css', 'legacy'],
        avoid: ['.avoid-break', 'section', 'header'],
      },
      enableLinks: false,
    };

    try {
      await html2pdf().set(options).from(clone).save();
      onProgress?.('✅ PDF ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ!');
    } finally {
      // Always clean up
      if (wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper);
      }
    }

    return true;
  } catch (err) {
    console.error('PDF download failed:', err);
    throw err;
  }
};

// ============================================================
// EXPORT / IMPORT JSON
// ============================================================
export const exportResumeJSON = (data) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(data.fullName || 'resume').replace(/\s+/g, '_')}_resume.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importResumeJSON = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};