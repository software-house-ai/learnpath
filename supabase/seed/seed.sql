-- ============================================================
-- LearnPath Seed Data
-- Run this in Supabase SQL Editor
-- NOTE: profiles/user_streaks/paths etc. require real auth
--       users — those are seeded separately or via the app.
-- ============================================================

-- ─── DOMAINS ─────────────────────────────────────────────────

insert into domains (id, name, slug, description, icon_name, color_hex, is_published, display_order) values
  ('d1000000-0000-0000-0000-000000000001', 'Web Development',     'web-development',     'Build modern, responsive web applications from front to back.',         'globe',          '#3B82F6', true,  1),
  ('d1000000-0000-0000-0000-000000000002', 'Data Science',        'data-science',        'Analyse data, build models, and turn numbers into insights.',           'bar-chart-2',    '#8B5CF6', true,  2),
  ('d1000000-0000-0000-0000-000000000003', 'Mobile Development',  'mobile-development',  'Create cross-platform and native mobile apps for iOS and Android.',     'smartphone',     '#10B981', true,  3),
  ('d1000000-0000-0000-0000-000000000004', 'DevOps & Cloud',      'devops-cloud',        'Automate infrastructure, deployments, and scale with the cloud.',       'cloud',          '#F59E0B', true,  4),
  ('d1000000-0000-0000-0000-000000000005', 'Cybersecurity',       'cybersecurity',       'Protect systems and networks from digital attacks and vulnerabilities.', 'shield',         '#EF4444', true,  5)
on conflict (slug) do nothing;


-- ─── SKILLS ──────────────────────────────────────────────────

-- Web Development Skills
insert into skills (id, domain_id, name, slug, description, difficulty, estimated_hours, icon_name, is_published) values
  ('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'HTML & CSS Fundamentals',  'html-css-fundamentals',  'Structure and style web pages with semantic HTML5 and modern CSS3.',          1, 12,  'code',         true),
  ('e1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 'JavaScript Basics',        'javascript-basics',       'Core JS concepts: variables, functions, loops, DOM manipulation.',             1, 20,  'zap',          true),
  ('e1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001', 'TypeScript',               'typescript',              'Typed JavaScript for large-scale, maintainable codebases.',                   2, 15,  'file-code',    true),
  ('e1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000001', 'React',                    'react',                   'Build component-based UIs with React hooks and state management.',             2, 30,  'layers',       true),
  ('e1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000001', 'Next.js',                  'nextjs',                  'Full-stack React framework with SSR, SSG, and App Router.',                   3, 25,  'triangle',     true),
  ('e1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000001', 'Node.js & Express',        'nodejs-express',          'Server-side JavaScript: REST APIs, middleware, authentication.',               2, 25,  'server',       true),
  ('e1000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000001', 'SQL & Databases',          'sql-databases',           'Relational database design, SQL queries, and PostgreSQL.',                    2, 18,  'database',     true),
  ('e1000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000001', 'REST API Design',          'rest-api-design',         'Design and consume RESTful APIs following best practices.',                   2, 12,  'plug',         true),
  ('e1000000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000001', 'Git & Version Control',    'git-version-control',     'Track changes, collaborate with branches, and use GitHub workflows.',         1, 8,   'git-branch',   true),
  ('e1000000-0000-0000-0000-000000000010', 'd1000000-0000-0000-0000-000000000001', 'Tailwind CSS',             'tailwind-css',            'Utility-first CSS framework for rapid, consistent UI development.',           2, 10,  'paintbrush',   true),

-- Data Science Skills
  ('e2000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000002', 'Python for Data Science',  'python-data-science',     'Python fundamentals focused on data manipulation and scripting.',             1, 20,  'code-2',       true),
  ('e2000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', 'NumPy & Pandas',           'numpy-pandas',            'Numerical computing and dataframe manipulation for data analysis.',           2, 15,  'table',        true),
  ('e2000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000002', 'Data Visualisation',       'data-visualisation',      'Create charts and dashboards with Matplotlib, Seaborn, and Plotly.',         2, 12,  'bar-chart',    true),
  ('e2000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000002', 'SQL for Analytics',        'sql-analytics',           'Window functions, CTEs, and analytical queries for data exploration.',       2, 12,  'database',     true),
  ('e2000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000002', 'Machine Learning Basics',  'machine-learning-basics', 'Supervised and unsupervised learning with scikit-learn.',                    3, 30,  'brain',        true),
  ('e2000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000002', 'Deep Learning',            'deep-learning',           'Neural networks, CNNs, and RNNs with TensorFlow and PyTorch.',               4, 40,  'cpu',          true),
  ('e2000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000002', 'Statistics & Probability', 'statistics-probability',  'Descriptive stats, distributions, hypothesis testing, and Bayesian basics.', 2, 18,  'sigma',        true),

-- Mobile Development Skills
  ('e3000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000003', 'React Native',             'react-native',            'Build cross-platform iOS and Android apps with React.',                      3, 30,  'smartphone',   true),
  ('e3000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000003', 'Flutter & Dart',           'flutter-dart',            'Google''s UI toolkit for natively compiled cross-platform apps.',             3, 35,  'feather',      true),
  ('e3000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000003', 'Swift & iOS',              'swift-ios',               'Native iOS app development with Swift and SwiftUI.',                         3, 40,  'apple',        true),
  ('e3000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000003', 'Kotlin & Android',         'kotlin-android',          'Native Android app development with Kotlin and Jetpack Compose.',            3, 40,  'bot',          true),

-- DevOps & Cloud Skills
  ('e4000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000004', 'Linux Command Line',       'linux-cli',               'File system, processes, permissions, shell scripting, and cron.',            1, 12,  'terminal',     true),
  ('e4000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000004', 'Docker',                   'docker',                  'Containerise applications with Dockerfiles, images, and compose.',           2, 15,  'box',          true),
  ('e4000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000004', 'Kubernetes',               'kubernetes',              'Orchestrate containers at scale with deployments, services, and Helm.',      4, 30,  'ship-wheel',   true),
  ('e4000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000004', 'CI/CD Pipelines',          'ci-cd-pipelines',         'Automate testing and deployment with GitHub Actions and GitLab CI.',         2, 15,  'git-merge',    true),
  ('e4000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000004', 'AWS Fundamentals',         'aws-fundamentals',        'Core AWS services: EC2, S3, RDS, Lambda, IAM, and VPC.',                    3, 25,  'cloud',        true),

-- Cybersecurity Skills
  ('e5000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000005', 'Networking Fundamentals',  'networking-fundamentals', 'TCP/IP, DNS, HTTP, subnetting, and network protocols.',                     1, 15,  'network',      true),
  ('e5000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000005', 'Linux for Security',       'linux-security',          'Hardening, file permissions, audit logs, and security tools.',               2, 15,  'shield',       true),
  ('e5000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000005', 'Web Application Security', 'web-app-security',        'OWASP Top 10, XSS, SQL injection, CSRF, and secure coding.',                 3, 20,  'lock',         true),
  ('e5000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000005', 'Penetration Testing',      'penetration-testing',     'Ethical hacking methodology, Burp Suite, Metasploit, and CTFs.',             4, 35,  'crosshair',    true),
  ('e5000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000005', 'Cryptography Basics',      'cryptography-basics',     'Symmetric/asymmetric encryption, hashing, TLS, and PKI.',                   3, 12,  'key',          true)
on conflict (slug) do nothing;


-- ─── SKILL PREREQUISITES ─────────────────────────────────────

insert into skill_prerequisites (skill_id, prerequisite_skill_id, strength) values
  -- Web Dev chain
  ('e1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', 'required'),    -- JS requires HTML/CSS
  ('e1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000002', 'required'),    -- TS requires JS
  ('e1000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000002', 'required'),    -- React requires JS
  ('e1000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000001', 'required'),    -- React requires HTML/CSS
  ('e1000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000004', 'required'),    -- Next.js requires React
  ('e1000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000003', 'recommended'), -- Next.js recommends TS
  ('e1000000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000002', 'required'),    -- Node.js requires JS
  ('e1000000-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000006', 'required'),    -- REST API requires Node.js
  ('e1000000-0000-0000-0000-000000000010', 'e1000000-0000-0000-0000-000000000001', 'required'),    -- Tailwind requires HTML/CSS
  -- Data Science chain
  ('e2000000-0000-0000-0000-000000000002', 'e2000000-0000-0000-0000-000000000001', 'required'),    -- NumPy requires Python
  ('e2000000-0000-0000-0000-000000000003', 'e2000000-0000-0000-0000-000000000002', 'required'),    -- Visualisation requires NumPy
  ('e2000000-0000-0000-0000-000000000005', 'e2000000-0000-0000-0000-000000000002', 'required'),    -- ML requires NumPy
  ('e2000000-0000-0000-0000-000000000005', 'e2000000-0000-0000-0000-000000000007', 'recommended'), -- ML recommends Stats
  ('e2000000-0000-0000-0000-000000000006', 'e2000000-0000-0000-0000-000000000005', 'required'),    -- Deep Learning requires ML
  -- DevOps chain
  ('e4000000-0000-0000-0000-000000000002', 'e4000000-0000-0000-0000-000000000001', 'required'),    -- Docker requires Linux
  ('e4000000-0000-0000-0000-000000000003', 'e4000000-0000-0000-0000-000000000002', 'required'),    -- K8s requires Docker
  ('e4000000-0000-0000-0000-000000000004', 'e4000000-0000-0000-0000-000000000002', 'recommended'), -- CI/CD recommends Docker
  -- Cybersecurity chain
  ('e5000000-0000-0000-0000-000000000002', 'e5000000-0000-0000-0000-000000000001', 'required'),    -- Linux Security requires Networking
  ('e5000000-0000-0000-0000-000000000003', 'e5000000-0000-0000-0000-000000000001', 'required'),    -- Web Sec requires Networking
  ('e5000000-0000-0000-0000-000000000004', 'e5000000-0000-0000-0000-000000000002', 'required'),    -- PenTest requires Linux
  ('e5000000-0000-0000-0000-000000000004', 'e5000000-0000-0000-0000-000000000003', 'required')     -- PenTest requires Web Sec
on conflict do nothing;


-- ─── LEARNING GOALS ──────────────────────────────────────────

insert into learning_goals (id, domain_id, title, slug, description, difficulty, estimated_weeks, is_published, display_order) values
  ('f1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'Become a Frontend Developer',    'become-frontend-developer',    'Master HTML, CSS, JavaScript, and React to build professional web UIs.',         'beginner_friendly',       12, true, 1),
  ('f1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 'Become a Full Stack Developer',  'become-fullstack-developer',   'Build complete web apps with React, Node.js, databases, and deployment.',        'some_experience_needed',  20, true, 2),
  ('f1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001', 'Learn Next.js & TypeScript',     'learn-nextjs-typescript',      'Go deep on Next.js App Router, TypeScript, and modern full-stack patterns.',     'some_experience_needed',  10, true, 3),
  ('f1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000002', 'Become a Data Scientist',        'become-data-scientist',        'Go from Python basics to ML models and data-driven decision making.',            'beginner_friendly',       24, true, 1),
  ('f1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000002', 'Master Machine Learning',        'master-machine-learning',      'Build and deploy ML models using scikit-learn, TensorFlow, and PyTorch.',        'intermediate',            16, true, 2),
  ('f1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000003', 'Build Cross-Platform Mobile Apps','build-crossplatform-mobile',  'Create polished iOS and Android apps using React Native.',                       'some_experience_needed',  14, true, 1),
  ('f1000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000004', 'Become a DevOps Engineer',       'become-devops-engineer',       'Master containers, CI/CD pipelines, and cloud infrastructure on AWS.',           'some_experience_needed',  18, true, 1),
  ('f1000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000005', 'Break into Cybersecurity',       'break-into-cybersecurity',     'Learn ethical hacking, web security, and penetration testing from scratch.',     'beginner_friendly',       20, true, 1)
on conflict (slug) do nothing;


-- ─── GOAL SKILLS ─────────────────────────────────────────────

insert into goal_skills (goal_id, skill_id, display_order, is_core) values
  -- Frontend Developer
  ('f1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 1, true),   -- HTML & CSS
  ('f1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000002', 2, true),   -- JavaScript
  ('f1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000004', 3, true),   -- React
  ('f1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000010', 4, true),   -- Tailwind CSS
  ('f1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000009', 5, true),   -- Git
  ('f1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000003', 6, false),  -- TypeScript (optional)

  -- Full Stack Developer
  ('f1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', 1, true),   -- HTML & CSS
  ('f1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000002', 2, true),   -- JavaScript
  ('f1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000004', 3, true),   -- React
  ('f1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000006', 4, true),   -- Node.js
  ('f1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000007', 5, true),   -- SQL
  ('f1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000008', 6, true),   -- REST API
  ('f1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000009', 7, true),   -- Git
  ('f1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000003', 8, false),  -- TypeScript

  -- Next.js & TypeScript
  ('f1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000004', 1, true),   -- React
  ('f1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000003', 2, true),   -- TypeScript
  ('f1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000005', 3, true),   -- Next.js
  ('f1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000007', 4, false),  -- SQL

  -- Data Scientist
  ('f1000000-0000-0000-0000-000000000004', 'e2000000-0000-0000-0000-000000000001', 1, true),   -- Python
  ('f1000000-0000-0000-0000-000000000004', 'e2000000-0000-0000-0000-000000000007', 2, true),   -- Statistics
  ('f1000000-0000-0000-0000-000000000004', 'e2000000-0000-0000-0000-000000000002', 3, true),   -- NumPy/Pandas
  ('f1000000-0000-0000-0000-000000000004', 'e2000000-0000-0000-0000-000000000003', 4, true),   -- Visualisation
  ('f1000000-0000-0000-0000-000000000004', 'e2000000-0000-0000-0000-000000000004', 5, false),  -- SQL Analytics
  ('f1000000-0000-0000-0000-000000000004', 'e2000000-0000-0000-0000-000000000005', 6, true),   -- ML Basics

  -- Master Machine Learning
  ('f1000000-0000-0000-0000-000000000005', 'e2000000-0000-0000-0000-000000000002', 1, true),   -- NumPy/Pandas
  ('f1000000-0000-0000-0000-000000000005', 'e2000000-0000-0000-0000-000000000007', 2, true),   -- Statistics
  ('f1000000-0000-0000-0000-000000000005', 'e2000000-0000-0000-0000-000000000005', 3, true),   -- ML Basics
  ('f1000000-0000-0000-0000-000000000005', 'e2000000-0000-0000-0000-000000000006', 4, true),   -- Deep Learning

  -- Cross-Platform Mobile
  ('f1000000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000002', 1, true),   -- JavaScript
  ('f1000000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000004', 2, true),   -- React
  ('f1000000-0000-0000-0000-000000000006', 'e3000000-0000-0000-0000-000000000001', 3, true),   -- React Native

  -- DevOps Engineer
  ('f1000000-0000-0000-0000-000000000007', 'e4000000-0000-0000-0000-000000000001', 1, true),   -- Linux CLI
  ('f1000000-0000-0000-0000-000000000007', 'e4000000-0000-0000-0000-000000000002', 2, true),   -- Docker
  ('f1000000-0000-0000-0000-000000000007', 'e4000000-0000-0000-0000-000000000004', 3, true),   -- CI/CD
  ('f1000000-0000-0000-0000-000000000007', 'e4000000-0000-0000-0000-000000000005', 4, true),   -- AWS
  ('f1000000-0000-0000-0000-000000000007', 'e4000000-0000-0000-0000-000000000003', 5, false),  -- Kubernetes

  -- Cybersecurity
  ('f1000000-0000-0000-0000-000000000008', 'e5000000-0000-0000-0000-000000000001', 1, true),   -- Networking
  ('f1000000-0000-0000-0000-000000000008', 'e5000000-0000-0000-0000-000000000002', 2, true),   -- Linux Security
  ('f1000000-0000-0000-0000-000000000008', 'e5000000-0000-0000-0000-000000000005', 3, true),   -- Cryptography
  ('f1000000-0000-0000-0000-000000000008', 'e5000000-0000-0000-0000-000000000003', 4, true),   -- Web App Security
  ('f1000000-0000-0000-0000-000000000008', 'e5000000-0000-0000-0000-000000000004', 5, false)   -- Penetration Testing
on conflict do nothing;


-- ─── CONTENT ITEMS ───────────────────────────────────────────

insert into content_items (id, skill_id, title, description, content_type, url, provider, author_name, duration_minutes, difficulty_level, is_free, rating_avg, rating_count, completion_rate, tags) values

-- HTML & CSS
  ('c1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001',
   'HTML Full Course for Beginners',
   'Complete HTML tutorial covering all essential tags, forms, semantic elements, and accessibility.',
   'video', 'https://www.youtube.com/watch?v=mbeT8mpmtHA',
   'YouTube', 'Dave Gray', 210, 'beginner', true, 4.8, 1240, 0.72,
   ARRAY['html', 'beginners', 'web']),

  ('c1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001',
   'CSS Full Course — Including Flexbox, Grid & Sass',
   'A complete CSS course: selectors, box model, flexbox, grid, animations, and Sass.',
   'video', 'https://www.youtube.com/watch?v=n4R2E7O-Ngo',
   'YouTube', 'Dave Gray', 576, 'beginner', true, 4.7, 980, 0.65,
   ARRAY['css', 'flexbox', 'grid', 'beginners']),

  ('c1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000001',
   'MDN: HTML Basics',
   'Official Mozilla documentation for HTML — the authoritative reference.',
   'documentation', 'https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/HTML_basics',
   'MDN', 'Mozilla', 30, 'beginner', true, 4.6, 540, 0.80,
   ARRAY['html', 'documentation', 'mdn']),

-- JavaScript
  ('c1000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000002',
   'JavaScript Full Course for Beginners',
   'Complete beginner JavaScript tutorial: variables, DOM, events, async/await, and more.',
   'video', 'https://www.youtube.com/watch?v=EfAl9bwzVZk',
   'YouTube', 'Dave Gray', 846, 'beginner', true, 4.9, 2100, 0.68,
   ARRAY['javascript', 'beginners', 'dom']),

  ('c1000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000002',
   'The Modern JavaScript Tutorial',
   'Comprehensive text-based JS course from basics to advanced topics like closures and prototypes.',
   'article', 'https://javascript.info/',
   'javascript.info', 'Ilya Kantor', 600, 'beginner', true, 4.9, 3200, 0.55,
   ARRAY['javascript', 'advanced', 'closures']),

  ('c1000000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000002',
   'JavaScript 30 — 30 Day Vanilla JS Challenge',
   'Build 30 projects in 30 days using pure JavaScript. No frameworks.',
   'course', 'https://javascript30.com/',
   'Wesbos', 'Wes Bos', 300, 'intermediate', true, 4.8, 1800, 0.60,
   ARRAY['javascript', 'projects', 'practice']),

-- TypeScript
  ('c1000000-0000-0000-0000-000000000007', 'e1000000-0000-0000-0000-000000000003',
   'TypeScript Full Course for Beginners',
   'Learn TypeScript from scratch: types, interfaces, generics, and integration with React.',
   'video', 'https://www.youtube.com/watch?v=30LWjhZzg50',
   'YouTube', 'Dave Gray', 480, 'beginner', true, 4.7, 890, 0.70,
   ARRAY['typescript', 'beginners', 'types']),

  ('c1000000-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000003',
   'Official TypeScript Handbook',
   'The official documentation for TypeScript covering all language features.',
   'documentation', 'https://www.typescriptlang.org/docs/handbook/',
   'TypeScript', 'Microsoft', 180, 'intermediate', true, 4.5, 720, 0.62,
   ARRAY['typescript', 'documentation', 'official']),

-- React
  ('c1000000-0000-0000-0000-000000000009', 'e1000000-0000-0000-0000-000000000004',
   'React Full Course 2024',
   'Complete React tutorial with hooks, context, React Router, and TanStack Query.',
   'video', 'https://www.youtube.com/watch?v=CgkZ7MvWUAA',
   'YouTube', 'Dave Gray', 720, 'intermediate', true, 4.8, 1650, 0.62,
   ARRAY['react', 'hooks', 'context']),

  ('c1000000-0000-0000-0000-000000000010', 'e1000000-0000-0000-0000-000000000004',
   'React Official Documentation',
   'The new react.dev docs with interactive tutorials and deep dives into every concept.',
   'documentation', 'https://react.dev/learn',
   'React', 'Meta', 240, 'beginner', true, 4.9, 2800, 0.58,
   ARRAY['react', 'official', 'hooks']),

-- Next.js
  ('c1000000-0000-0000-0000-000000000011', 'e1000000-0000-0000-0000-000000000005',
   'Next.js 14 Full Course',
   'Learn Next.js 14 App Router, Server Components, Server Actions, and deployment.',
   'video', 'https://www.youtube.com/watch?v=ZjAqacIC_3c',
   'YouTube', 'Dave Gray', 540, 'intermediate', true, 4.8, 1120, 0.66,
   ARRAY['nextjs', 'app-router', 'server-components']),

  ('c1000000-0000-0000-0000-000000000012', 'e1000000-0000-0000-0000-000000000005',
   'Next.js Official Tutorial',
   'The official Next.js learn course — builds a full-stack dashboard app step by step.',
   'documentation', 'https://nextjs.org/learn',
   'Next.js', 'Vercel', 300, 'intermediate', true, 4.9, 3100, 0.72,
   ARRAY['nextjs', 'official', 'fullstack']),

-- Node.js & Express
  ('c1000000-0000-0000-0000-000000000013', 'e1000000-0000-0000-0000-000000000006',
   'Node.js & Express Full Course',
   'Build REST APIs with Node.js and Express: routing, middleware, auth, file uploads.',
   'video', 'https://www.youtube.com/watch?v=Oe421EPjeBE',
   'YouTube', 'Dave Gray', 480, 'intermediate', true, 4.7, 940, 0.64,
   ARRAY['nodejs', 'express', 'rest-api']),

  ('c1000000-0000-0000-0000-000000000014', 'e1000000-0000-0000-0000-000000000006',
   'The Odin Project: NodeJS',
   'Free, project-based curriculum for learning Node.js, Express, and databases.',
   'course', 'https://www.theodinproject.com/paths/full-stack-javascript/courses/nodejs',
   'The Odin Project', 'Community', 600, 'intermediate', true, 4.8, 670, 0.48,
   ARRAY['nodejs', 'projects', 'curriculum']),

-- SQL & Databases
  ('c1000000-0000-0000-0000-000000000015', 'e1000000-0000-0000-0000-000000000007',
   'SQL Tutorial — Full Database Course',
   'Complete SQL course: select, joins, aggregation, indexes, stored procedures.',
   'video', 'https://www.youtube.com/watch?v=HXV3zeQKqGY',
   'YouTube', 'freeCodeCamp', 261, 'beginner', true, 4.8, 2300, 0.73,
   ARRAY['sql', 'databases', 'postgresql']),

  ('c1000000-0000-0000-0000-000000000016', 'e1000000-0000-0000-0000-000000000007',
   'SQLZoo Interactive Tutorials',
   'Browser-based interactive SQL exercises across multiple databases.',
   'exercise', 'https://sqlzoo.net/',
   'SQLZoo', 'Community', 120, 'beginner', true, 4.5, 1100, 0.68,
   ARRAY['sql', 'interactive', 'exercises']),

-- Git
  ('c1000000-0000-0000-0000-000000000017', 'e1000000-0000-0000-0000-000000000009',
   'Git and GitHub for Beginners — Crash Course',
   'Learn Git fundamentals: init, commit, branches, merge, and GitHub pull requests.',
   'video', 'https://www.youtube.com/watch?v=RGOj5yH7evk',
   'YouTube', 'freeCodeCamp', 68, 'beginner', true, 4.8, 3200, 0.82,
   ARRAY['git', 'github', 'version-control']),

-- Python for Data Science
  ('c2000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0000-000000000001',
   'Python for Beginners — Full Course',
   'Complete Python tutorial for beginners: syntax, functions, OOP, file I/O.',
   'video', 'https://www.youtube.com/watch?v=eWRfhZUzrAc',
   'YouTube', 'freeCodeCamp', 270, 'beginner', true, 4.8, 2800, 0.70,
   ARRAY['python', 'beginners', 'data-science']),

  ('c2000000-0000-0000-0000-000000000002', 'e2000000-0000-0000-0000-000000000001',
   'Kaggle: Python Course',
   'Free Kaggle micro-course on Python focusing on data science tasks.',
   'course', 'https://www.kaggle.com/learn/python',
   'Kaggle', 'Community', 180, 'beginner', true, 4.7, 1900, 0.75,
   ARRAY['python', 'kaggle', 'data-science']),

-- NumPy & Pandas
  ('c2000000-0000-0000-0000-000000000003', 'e2000000-0000-0000-0000-000000000002',
   'Pandas & NumPy Full Tutorial',
   'Master data manipulation with Pandas DataFrames and NumPy arrays.',
   'video', 'https://www.youtube.com/watch?v=vmEHCJofslg',
   'YouTube', 'freeCodeCamp', 240, 'intermediate', true, 4.7, 1450, 0.65,
   ARRAY['pandas', 'numpy', 'data-analysis']),

  ('c2000000-0000-0000-0000-000000000004', 'e2000000-0000-0000-0000-000000000002',
   'Kaggle: Pandas Course',
   'Hands-on Kaggle course for Pandas with real datasets and exercises.',
   'course', 'https://www.kaggle.com/learn/pandas',
   'Kaggle', 'Community', 120, 'beginner', true, 4.8, 2100, 0.78,
   ARRAY['pandas', 'kaggle', 'exercises']),

-- Machine Learning
  ('c2000000-0000-0000-0000-000000000005', 'e2000000-0000-0000-0000-000000000005',
   'Machine Learning Specialization',
   'Andrew Ng''s updated ML specialization — the definitive introduction to machine learning.',
   'course', 'https://www.coursera.org/specializations/machine-learning-introduction',
   'Coursera', 'Andrew Ng', 1800, 'intermediate', false, 4.9, 4200, 0.55,
   ARRAY['machine-learning', 'andrew-ng', 'supervised', 'unsupervised']),

  ('c2000000-0000-0000-0000-000000000006', 'e2000000-0000-0000-0000-000000000005',
   'Kaggle: Intro to Machine Learning',
   'Free Kaggle course on decision trees, model validation, and underfitting vs overfitting.',
   'course', 'https://www.kaggle.com/learn/intro-to-machine-learning',
   'Kaggle', 'Community', 120, 'beginner', true, 4.7, 2300, 0.74,
   ARRAY['machine-learning', 'kaggle', 'scikit-learn']),

-- Docker
  ('c4000000-0000-0000-0000-000000000001', 'e4000000-0000-0000-0000-000000000002',
   'Docker Tutorial for Beginners',
   'Full Docker course: containers, images, Dockerfiles, volumes, networks, and Compose.',
   'video', 'https://www.youtube.com/watch?v=fqMOX6JJhGo',
   'YouTube', 'freeCodeCamp', 120, 'beginner', true, 4.8, 1780, 0.72,
   ARRAY['docker', 'containers', 'devops']),

  ('c4000000-0000-0000-0000-000000000002', 'e4000000-0000-0000-0000-000000000002',
   'Docker Official Get Started Guide',
   'Official Docker documentation walkthrough: build, push, and run containers.',
   'documentation', 'https://docs.docker.com/get-started/',
   'Docker', 'Docker Inc', 60, 'beginner', true, 4.6, 900, 0.77,
   ARRAY['docker', 'official', 'documentation']),

-- Linux CLI
  ('c4000000-0000-0000-0000-000000000003', 'e4000000-0000-0000-0000-000000000001',
   'Linux Command Line Full Course',
   'Master the Linux terminal: navigation, permissions, processes, scripting, and cron.',
   'video', 'https://www.youtube.com/watch?v=ZtqBQ68cfJc',
   'YouTube', 'freeCodeCamp', 300, 'beginner', true, 4.7, 2100, 0.68,
   ARRAY['linux', 'bash', 'terminal', 'devops']),

-- AWS Fundamentals
  ('c4000000-0000-0000-0000-000000000004', 'e4000000-0000-0000-0000-000000000005',
   'AWS Certified Cloud Practitioner — Full Study Course',
   'Complete CLF-C02 prep: all core AWS services, pricing, security, and architecture.',
   'video', 'https://www.youtube.com/watch?v=NhDYbskXRgc',
   'YouTube', 'freeCodeCamp', 1100, 'beginner', true, 4.8, 2500, 0.58,
   ARRAY['aws', 'cloud', 'certifications']),

-- Web Application Security
  ('c5000000-0000-0000-0000-000000000001', 'e5000000-0000-0000-0000-000000000003',
   'Ethical Hacking Full Course',
   'Complete ethical hacking course: reconnaissance, scanning, exploitation, and post-exploitation.',
   'video', 'https://www.youtube.com/watch?v=3Kq1MIfTWCE',
   'YouTube', 'freeCodeCamp', 1500, 'beginner', true, 4.7, 1900, 0.52,
   ARRAY['security', 'ethical-hacking', 'owasp']),

  ('c5000000-0000-0000-0000-000000000002', 'e5000000-0000-0000-0000-000000000003',
   'OWASP Top 10 — Official Guide',
   'The official OWASP Top 10 documentation — the standard reference for web security risks.',
   'documentation', 'https://owasp.org/www-project-top-ten/',
   'OWASP', 'OWASP Foundation', 90, 'intermediate', true, 4.9, 1300, 0.80,
   ARRAY['owasp', 'security', 'web'])

on conflict do nothing;
