/**
 * src/data/coursesCatalog.js
 *
 * Complete ZC course catalog extracted from official PDFs.
 * Used for smart auto-detection: when a YouTube playlist title contains
 * a course code (e.g. "PHYS 323 – Quantum Mechanics I"), we look it up here
 * and auto-populate school, program, and course name.
 */

// ── Schools ─────────────────────────────────────────────────────────────────

export const SCHOOLS = [
  {
    id: "csai",
    label: "Computational Sciences & AI",
    short: "CSAI",
    color: {
      bg: "bg-blue-600",
      light: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
    },
    icon: "💻",
    description:
      "Computer Science, Data Science, AI, Software Engineering, IT, Game Development, HCI",
  },
  {
    id: "business",
    label: "Business",
    short: "BUS",
    color: {
      bg: "bg-emerald-600",
      light: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
    },
    icon: "📈",
    description:
      "Management, Finance, Marketing, Actuarial, Supply Chain, Sustainability, Entrepreneurship",
  },
  {
    id: "science",
    label: "Science",
    short: "SCI",
    color: {
      bg: "bg-violet-600",
      light: "bg-violet-50",
      text: "text-violet-700",
      border: "border-violet-200",
    },
    icon: "🔬",
    description:
      "Physics, Biomedical Sciences, Chemistry, Nanoscience, Biology, Materials Science",
  },
  {
    id: "engineering",
    label: "Engineering",
    short: "ENG",
    color: {
      bg: "bg-orange-600",
      light: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-200",
    },
    icon: "⚙️",
    description:
      "Communications & Info Engineering, Environmental, Nano Engineering, Renewable Energy, Aerospace",
  },
  {
    id: "general",
    label: "General",
    short: "GEN",
    color: {
      bg: "bg-gray-500",
      light: "bg-gray-50",
      text: "text-gray-600",
      border: "border-gray-200",
    },
    icon: "📚",
    description:
      "Mathematics, English, Humanities, and shared courses across all schools",
  },
];

// ── Programs (sub-categories within each school) ─────────────────────────────

export const PROGRAMS = {
  csai: [
    { id: "cs_ai", label: "Computer Science & AI", prefixes: ["CSAI"] },
    { id: "dsai", label: "Data Science & AI", prefixes: ["DSAI"] },
    { id: "it", label: "Information Technology", prefixes: ["IT"] },
    { id: "itcc", label: "IT — Cloud Computing", prefixes: ["ITCC"] },
    { id: "itns", label: "IT — Network Security", prefixes: ["ITNS"] },
    { id: "sw", label: "Software Engineering", prefixes: ["SW"] },
    { id: "swapd", label: "SW — App Development", prefixes: ["SWAPD"] },
    { id: "swgcg", label: "SW — Games & CG", prefixes: ["SWGCG"] },
    { id: "swhci", label: "SW — Human–Computer Int.", prefixes: ["SWHCI"] },
  ],
  business: [
    { id: "actuarial", label: "Actuarial Science", prefixes: ["BACT"] },
    { id: "cse", label: "Business CS & Data", prefixes: ["BCSE", "BDAT"] },
    { id: "ent", label: "Entrepreneurship", prefixes: ["BENT", "BTEM"] },
    {
      id: "finance",
      label: "Finance",
      prefixes: ["FINC", "BGEN", "BIFT", "BMAT"],
    },
    { id: "law", label: "Business Law", prefixes: ["BLAW"] },
    { id: "mgmt", label: "Management", prefixes: ["MGMT", "BUS"] },
    { id: "mktg", label: "Marketing", prefixes: ["MKTG"] },
    { id: "econ", label: "Economics", prefixes: ["ECON"] },
    { id: "supply", label: "Supply Chain", prefixes: ["SCHN"] },
    { id: "sust", label: "Sustainable Development", prefixes: ["SUST"] },
  ],
  science: [
    { id: "physics", label: "Physics", prefixes: ["PHYS"] },
    { id: "bms", label: "Biomedical Sciences", prefixes: ["BMS"] },
    { id: "chem", label: "Chemistry", prefixes: ["CHEM"] },
    { id: "bio", label: "Biology", prefixes: ["BIOL"] },
    { id: "nanosc", label: "Nanoscience", prefixes: ["NANOSC"] },
    { id: "matsci", label: "Materials Science", prefixes: ["MATSCI"] },
  ],
  engineering: [
    { id: "cie", label: "Communications & Info Eng.", prefixes: ["CIE"] },
    { id: "env", label: "Environmental Engineering", prefixes: ["ENV"] },
    { id: "naneng", label: "Nano Engineering", prefixes: ["NANENG"] },
    { id: "ree", label: "Renewable Energy Eng.", prefixes: ["REE"] },
    { id: "spc", label: "Aerospace Engineering", prefixes: ["SPC"] },
  ],
  general: [
    { id: "math", label: "Mathematics", prefixes: ["MATH"] },
    { id: "english", label: "English", prefixes: ["ENGL"] },
    {
      id: "sch",
      label: "Humanities & Sciences",
      prefixes: ["SCH", "HIS", "ENGR"],
    },
    { id: "csci", label: "Intro Computer Science", prefixes: ["CSCI"] },
    { id: "ree_gen", label: "Renewable Energy (General)", prefixes: ["REE"] },
  ],
};

// ── Prefix → School/Program fast lookup ──────────────────────────────────────

export const PREFIX_MAP = (() => {
  const map = {};
  for (const [schoolId, programs] of Object.entries(PROGRAMS)) {
    for (const prog of programs) {
      for (const prefix of prog.prefixes) {
        // Don't overwrite if already set by a more specific school
        if (!map[prefix]) {
          map[prefix] = {
            schoolId,
            programId: prog.id,
            programLabel: prog.label,
          };
        }
      }
    }
  }
  return map;
})();

// ── Full course name lookup (code → name) ────────────────────────────────────
// Compact representation: [code, name] pairs

const RAW_COURSES = [
  // ── CSAI ──
  ["CSAI 100", "Introduction to Computational Sciences and AI"],
  ["CSAI 101", "Fundamentals of Programming and Computer Science"],
  ["CSAI 102", "Digital Logic and Computer Architecture"],
  ["CSAI 151", "Object-Oriented Programming"],
  ["CSAI 201", "Data Structures"],
  ["CSAI 202", "Introduction to Database Systems"],
  ["CSAI 203", "Introduction to Software Engineering"],
  ["CSAI 204", "Operating Systems"],
  ["CSAI 205", "Fundamentals of Circuits and Electronics"],
  ["CSAI 251", "Algorithm Design and Analysis"],
  ["CSAI 252", "Introduction to Computer Networks"],
  ["CSAI 253", "Machine Learning"],
  ["CSAI 301", "Artificial Intelligence"],
  ["CSAI 302", "Advanced Database Systems"],
  ["CSAI 351", "Principles and Practices for Secure Computing"],
  // ── DSAI ──
  ["DSAI 103", "Data Acquisition in Data Science (ETL)"],
  ["DSAI 104", "Knowledge Representation and Reasoning"],
  ["DSAI 201", "Data Mining and Information Retrieval"],
  ["DSAI 202", "Data Governance"],
  ["DSAI 203", "Data Integration and Visualization"],
  ["DSAI 305", "Interpretability & Explainability in AI"],
  ["DSAI 307", "Statistical Inference"],
  ["DSAI 308", "Deep Learning"],
  ["DSAI 325", "Introduction to Information Theory"],
  ["DSAI 352", "Computer Vision"],
  ["DSAI 353", "Natural Language Processing"],
  ["DSAI 402", "Reinforcement Learning"],
  ["DSAI 403", "Nature Inspired Computation"],
  ["DSAI 406", "Machine Learning Engineering for Production (MLOps)"],
  ["DSAI 413", "Multimedia Analytics"],
  ["DSAI 414", "Social Analytics"],
  ["DSAI 415", "Cloud Software Development"],
  ["DSAI 416", "GIS and Spatial Analytics"],
  ["DSAI 427", "Big Data Analytics"],
  ["DSAI 431", "Fuzzy Logic and Fuzzy Systems"],
  ["DSAI 433", "Game Theory"],
  ["DSAI 456", "Speech Recognition"],
  ["DSAI 473", "Data Warehousing"],
  // ── IT ──
  ["IT 101", "Shell and Script Programming with UNIX"],
  ["IT 102", "Ethical Hacking and Defense"],
  ["IT 103", "Fundamentals of Information and Communication Systems"],
  ["IT 205", "Enterprise System Architecture"],
  ["IT 206", "Fundamentals of IT Governance and Risk Management"],
  ["IT 220", "Networks Installation and Maintenance"],
  ["IT 222", "Fundamentals of Multimedia Creation, Storage and Transfer"],
  ["IT 308", "Cloud Computing Architecture"],
  ["IT 309", "IT User-Experience Design"],
  ["IT 310", "Foundations of Cybersecurity and Security Management"],
  ["IT 401", "Data Centers"],
  ["IT 402", "Fundamentals of Cybersecurity and Encryption"],
  ["IT 411", "Enterprise Resources Planning"],
  // ── ITCC ──
  ["ITCC 301", "Linux System Administration"],
  ["ITCC 302", "Cloud Infrastructure Administration"],
  ["ITCC 403", "Security Testing for Cloud Applications"],
  ["ITCC 404", "Windows Enterprise Administration"],
  ["ITCC 405", "Virtualization and Cloud Security"],
  ["ITCC 406", "Migrating Data and Applications to the Cloud"],
  ["ITCC 407", "Cloud Services Management"],
  ["ITCC 408", "Application Development and Scripting in the Cloud"],
  ["ITCC 410", "Software Development Operations in Cloud Environments"],
  ["ITCC 411", "SaaS, IaaS and PaaS"],
  ["ITCC 412", "Advanced Cloud Security"],
  ["ITCC 413", "IT Security and Policy Planning"],
  ["ITCC 414", "IS Strategy Management and Acquisition"],
  // ── ITNS ──
  ["ITNS 301", "Network Administration"],
  ["ITNS 302", "IoT Systems and Application Development"],
  ["ITNS 403", "Storage Area Networks"],
  ["ITNS 404", "Network Performance Monitoring and Troubleshooting"],
  ["ITNS 406", "Network Resilience and Hardening"],
  ["ITNS 407", "IT Audit and Risk Management"],
  ["ITNS 408", "Network Security"],
  ["ITNS 410", "Penetration Testing"],
  ["ITNS 411", "Network Programming"],
  ["ITNS 412", "IT Compliance and Quality Management"],
  ["ITNS 413", "Emerging Networking Technologies"],
  ["ITNS 414", "Cyber Forensics"],
  ["ITNS 415", "Wireless Security"],
  // ── SW ──
  ["SW 151", "Computer Architecture and Organization"],
  ["SW 251", "User Experience and Interaction Design"],
  ["SW 252", "Embedded Systems"],
  ["SW 301", "Object-Oriented Analysis and Design"],
  ["SW 302", "User Interface Development"],
  ["SW 401", "Parallel and Distributed Computing"],
  ["SW 402", "Software Project Management"],
  ["SW 403", "AI in Modern Software Engineering"],
  // ── SWAPD ──
  ["SWAPD 301", "Software Systems Requirements Development"],
  ["SWAPD 351", "Software Architecture and Design"],
  ["SWAPD 352", "Web Applications Development"],
  ["SWAPD 401", "Software Testing, Validation, and Quality Assurance"],
  ["SWAPD 402", "Mobile Application Development"],
  ["SWAPD 451", "Software Maintenance"],
  ["SWAPD 452", "Enterprise Application Development"],
  ["SWAPD 453", "IoT Applications Development"],
  // ── SWGCG ──
  ["SWGCG 301", "Computer Graphics and Multimedia Systems"],
  ["SWGCG 351", "Game Design and Development"],
  ["SWGCG 352", "Computer and Physics-Based Animation"],
  ["SWGCG 401", "Design and Geometric Modeling for Visualization"],
  ["SWGCG 402", "Visual Effects Production"],
  ["SWGCG 451", "Model Creation and Character Animation"],
  ["SWGCG 452", "Physics-Based Vision and Rendering"],
  ["SWGCG 453", "Mobile and Casual Game Development"],
  // ── SWHCI ──
  ["SWHCI 301", "Prototyping Algorithmic Experiences"],
  ["SWHCI 351", "Statistical Graphics and Visualization"],
  ["SWHCI 352", "User-Focused Sensing Systems"],
  ["SWHCI 401", "Human Information Processing and Artificial Intelligence"],
  ["SWHCI 402", "AI Based Products and Services"],
  ["SWHCI 451", "Cognitive Modeling for HCI"],
  ["SWHCI 452", "Designing Extended Reality Experience"],
  ["SWHCI 453", "Human Factors"],
  // ── Business ──
  ["BACT 301", "Principles of Risk Management"],
  ["BACT 305", "Life Contingencies"],
  ["BACT 310", "Introduction to Actuarial Practice"],
  ["BACT 401", "Risk Financing Techniques"],
  ["BACT 402", "Risk Analytics and Behavioral Science"],
  ["BACT 403", "Commercial Insurance and Management of Insurance Enterprise"],
  ["BACT 404", "Casualty and Health Insurance Mathematics"],
  ["BCSE 301", "Database Management and Applications"],
  ["BCSE 401", "Data Mining & Predictive Analytics"],
  ["BDAT 301", "Applied Linear Models"],
  ["BDAT 401", "Stochastic Processes"],
  ["BENT 301", "Advanced and Corporate Entrepreneurship"],
  ["BENT 305", "Entrepreneurial Finance"],
  ["BENT 310", "Digital Start-Ups and Ecosystems"],
  ["BENT 401", "Social Entrepreneurship and Sustainability"],
  ["BGEN 101", "Business Mathematics"],
  ["BGEN 105", "Calculus for Business Applications"],
  ["BGEN 110", "Foundations of Statistical Inference"],
  ["BGEN 201", "Data Analytics"],
  ["BGEN 205", "Machine Learning"],
  ["BGEN 210", "Programming"],
  ["BIFT 301", "Database Management Systems"],
  ["BLAW 201", "Business Law Fundamentals"],
  ["BLAW 301", "Negotiations and Dispute Settlement"],
  ["BMAT 301", "Introduction to Differential Equations"],
  ["BTEM 301", "Management of Innovation"],
  ["BTEM 305", "Technology Commercialization"],
  ["ECON 101", "Principles of Economics"],
  ["ECON 301", "Intermediate Microeconomic Theory"],
  ["ECON 305", "Intermediate Macroeconomic Theory"],
  ["ECON 320", "Money and Banking"],
  ["ECON 325", "Data Analysis & Forecasting"],
  ["FINC 101", "Financial Accounting"],
  ["FINC 201", "Principles of Finance"],
  ["FINC 305", "Financial Reporting"],
  ["FINC 310", "Corporate Finance"],
  ["FINC 315", "Financial Markets, Institutions and Economic Activity"],
  ["FINC 401", "Investment Theory"],
  ["FINC 405", "Derivative Securities"],
  ["FINC 410", "Fixed Income Securities"],
  ["FINC 415", "Blockchain and Digital Currencies"],
  ["HIS 302", "Egyptian History"],
  ["HIS 304", "Arab World History"],
  ["MGMT 101", "Principles of Management"],
  ["MGMT 105", "Leadership and Professional Ethics"],
  ["MGMT 201", "Human Resources Management"],
  ["MGMT 205", "Project Management"],
  ["MGMT 301", "Operations Management"],
  ["MGMT 305", "Advanced Organizational Behavior"],
  ["MGMT 401", "HR Data Analytics"],
  ["MGMT 405", "Performance, Compensation and Career Management"],
  ["MKTG 101", "Principles of Marketing"],
  ["MKTG 301", "Market Research and Consumer Behavior"],
  ["MKTG 305", "Strategic and B2B Marketing"],
  ["MKTG 310", "Brand and Sales Management"],
  ["MKTG 401", "Marketing Communications"],
  ["MKTG 405", "Digital Marketing"],
  ["MKTG 410", "Product Management"],
  ["MKTG 415", "Marketing Analytics"],
  ["SCHN 301", "Information Technology Management"],
  ["SCHN 305", "Models and Business Simulations"],
  ["SCHN 310", "Fundamentals of Supply Chain Management"],
  ["SCHN 401", "Production Planning, Procurement and Supply Management"],
  ["SCHN 405", "Logistics Management"],
  ["SCHN 410", "Information Technology in Supply Chains"],
  ["SUST 201", "Sustainable Development Goals Fundamentals"],
  ["SUST 205", "Gender Equality and Women Empowerment"],
  ["SUST 210", "Sustainable Development Planning, Policy and Governance"],
  ["SUST 220", "Corporate Social Responsibility"],
  ["SUST 225", "Sustainable Economics"],
  ["SUST 301", "Sustainable Development Project Management"],
  ["SUST 305", "Community Development Management"],
  ["SUST 310", "Education Leadership and Management"],
  ["SUST 315", "Climate Change and Private Business"],
  ["SUST 325", "NGO Management"],
  // ── Science ──
  ["BIOL 101", "Biology I"],
  ["BIOL 102", "Biology II"],
  ["BMS 201", "General Microbiology"],
  ["BMS 202", "Cell Biology"],
  ["BMS 203", "Principles of Genetics"],
  ["BMS 204", "Biochemistry"],
  ["BMS 205", "Human Physiology"],
  ["BMS 301", "Molecular Biology"],
  ["BMS 303", "Experimental Design and Data Analysis"],
  ["BMS 320", "Introduction to Bioinformatics and Programming Languages"],
  ["BMS 321", "Programming for Computational Biology"],
  ["BMS 322", "Structural Biology"],
  ["BMS 323", "Comparative Biology"],
  ["BMS 324", "Molecular Genetics and Cell Regulation"],
  ["BMS 325", "Clinical Sciences"],
  ["BMS 326", "Molecular Mechanisms of Cell Signaling"],
  ["BMS 327", "Neurobiology and Practicum"],
  ["BMS 330", "Human Anatomy"],
  ["BMS 332", "Drug Discovery and Development"],
  ["BMS 333", "Drug Design and Computational Chemistry"],
  ["BMS 334", "Pharmacokinetics and Pharmacodynamics"],
  ["BMS 337", "Cancer Biology and Practicum"],
  ["BMS 339", "Principles of Pharmacology and Toxicology"],
  ["BMS 344", "Human Embryology"],
  ["BMS 404", "Biostatistics"],
  ["BMS 405", "Medicinal and Biological Chemistry"],
  ["BMS 406", "Molecular Modeling and Targeted Drug Design"],
  ["BMS 422", "Algorithmic Foundations of Computational Biology"],
  ["BMS 425", "Protein Structure and Function"],
  ["BMS 426", "Developmental Biology and Genomics"],
  ["BMS 428", "Pathology"],
  ["BMS 429", "Molecular Immunology"],
  ["BMS 434", "Epigenetics in Health and Disease"],
  ["BMS 438", "Human Pathophysiology"],
  ["BMS 444", "Metagenomics"],
  ["BMS 451", "Biology of Ageing"],
  ["BMS 456", "Forensic Biology"],
  ["BMS 457", "Clinical Nutrition"],
  ["BMS 462", "Pharmacogenomics"],
  ["BMS 463", "Vaccines"],
  ["BMS 465", "Virology"],
  ["BMS 471", "Clinical Trials Design, Administration and Management"],
  ["BMS 474", "Genomics and Data Sciences"],
  ["BMS 477", "The Human Genome and Disease"],
  ["CHEM 101", "Chemistry I"],
  ["CHEM 102", "Chemistry II"],
  ["CHEM 201", "Organic Chemistry"],
  ["CHEM 202", "Analytical & Physical Chemistry"],
  ["CHEM 203", "Organic Chemistry II"],
  ["MATSCI 201", "Fundamentals of Materials Science and Engineering"],
  ["MATSCI 204", "Inorganic Chemistry"],
  ["MATSCI 301", "Catalysis"],
  ["MATSCI 302", "Solid State Physics"],
  ["MATSCI 303", "Macromolecular Chemistry"],
  ["MATSCI 308", "Computational Modeling"],
  ["NANOSC 301", "Spectroscopy of Nanomaterials"],
  ["NANOSC 302", "Modern Characterization Techniques I"],
  ["NANOSC 303", "Quantum Mechanics"],
  ["NANOSC 305", "Synthesis/Fabrication of Nanomaterials"],
  ["NANOSC 306", "Statistical Mechanics & Thermodynamics at the Nanoscale"],
  ["NANOSC 308", "Introduction to Polymer Science"],
  ["NANOSC 309", "Principles of Pharmacokinetics"],
  ["NANOSC 310", "Computer Aided Drug Design"],
  ["NANOSC 322", "Chemistry & Physics of Nanomaterials"],
  ["NANOSC 392", "Introduction to Nanochemistry"],
  ["NANOSC 401", "Nanotoxicology"],
  ["NANOSC 402", "Nanoimaging"],
  ["NANOSC 403", "Special Topics in Nanomedicine"],
  ["NANOSC 404", "Principles of Pharmacology"],
  ["NANOSC 405", "Nanopharmaceutics"],
  ["NANOSC 413", "Photonics & Laser Physics"],
  ["NANOSC 425", "Quantum Theory for Nanoscale Systems"],
  ["NANOSC 426", "Colloidal Nanoscience"],
  ["NANOSC 431", "Nanobiology"],
  ["PHYS 101", "Introduction to Classical Mechanics"],
  ["PHYS 102", "Introduction to Electromagnetism"],
  ["PHYS 201", "Thermodynamics, Wave Motion and Optics"],
  ["PHYS 202", "Modern Physics"],
  ["PHYS 204", "Analytical Mechanics"],
  ["PHYS 205", "Introduction to Modern Astrophysics"],
  ["PHYS 208", "Electrodynamics I"],
  ["PHYS 210", "Advanced Electromagnetism"],
  ["PHYS 308", "Electrodynamics II"],
  ["PHYS 311", "Thermal and Statistical Physics"],
  ["PHYS 316", "Mathematical Physics I"],
  ["PHYS 323", "Quantum Mechanics I"],
  ["PHYS 326", "Mathematical Physics II"],
  ["PHYS 327", "Observational Astrophysics Laboratory"],
  ["PHYS 331", "Stellar Structure and Evolution"],
  ["PHYS 348", "Quantum Mechanics II"],
  ["PHYS 364", "Biological Physics"],
  ["PHYS 405", "Cosmology"],
  ["PHYS 416", "Galactic & Extragalactic Astrophysics"],
  ["PHYS 420", "The Solar System"],
  ["PHYS 422", "Astrophysical Fluid Dynamics"],
  ["PHYS 430", "Quantum Mechanics III"],
  ["PHYS 431", "Quantum Field Theory and Particle Physics"],
  ["PHYS 450", "Computational Physics"],
  ["PHYS 453", "Gravity & General Relativity"],
  ["PHYS 455", "Mathematical Physics III"],
  ["SPC 303", "Remote Sensing & Instrumentation"],
  // ── Engineering ──
  ["CIE 101", "Fundamentals of Computer Programming"],
  ["CIE 110", "Introduction to Circuits and Electronics"],
  ["CIE 201", "Advanced Electric Circuits"],
  ["CIE 227", "Signals and Systems"],
  ["CIE 237", "Probability and Stochastic Processes"],
  ["CIE 239", "Digital Design and Computer Architecture"],
  ["CIE 247", "Digital Signal Processing"],
  ["CIE 249", "Computer Architecture and Assembly Language"],
  ["CIE 302", "Operating Systems"],
  ["CIE 317", "Machine Learning"],
  ["CIE 318", "Control Systems"],
  ["CIE 328", "Electromagnetic Fields and Waves I"],
  ["CIE 337", "Communications Theory and Systems"],
  ["CIE 338", "Electromagnetic Fields and Waves II"],
  ["CIE 347", "Information Theory and Coding"],
  ["CIE 349", "Embedded Systems"],
  ["CIE 357", "Digital and Wireless Communications"],
  ["CIE 367", "Computer Networks"],
  ["CIE 402", "Antennas Engineering"],
  ["CIE 412", "Propagation and Channel Modeling"],
  ["CIE 416", "Satellite Communications System"],
  ["CIE 418", "Communications Circuits"],
  ["CIE 419", "Computer Vision"],
  ["CIE 420", "Robot and Machine Vision"],
  ["CIE 427", "Big Data Analytics"],
  ["CIE 436", "Electromagnetic Remote Sensing"],
  ["CIE 438", "RF and Microwave Engineering"],
  ["CIE 448", "IoT Systems Engineering"],
  ["CIE 450", "Robotics: Transformations, Kinematics, and Dynamics"],
  ["CIE 451", "Mechatronics Engineering"],
  ["CIE 452", "Advanced Computer Architecture"],
  ["CIE 453", "Natural Language Processing"],
  ["CIE 455", "Neural Networks and Deep Learning"],
  ["CIE 456", "Speech Analysis, Synthesis, and Recognition"],
  ["CIE 458", "Fundamentals of Artificial Intelligence"],
  ["CIE 461", "Automata and Compiler Design"],
  ["CIE 464", "Computer Graphics"],
  ["CIE 467", "Mobile Communications Technologies"],
  ["CIE 470", "Introduction to Quantum Computation and Quantum Information"],
  ["CIE 477", "Cognitive Radio Systems"],
  ["CIE 478", "Advanced Wireless Communication Systems"],
  ["CIE 481", "Information Security and Encryption"],
  ["CIE 482", "Cryptography"],
  ["ENV 104", "Chemistry for Environmental Engineers"],
  ["ENV 204", "Environmental Engineering Chemistry"],
  ["ENV 207", "Material and Energy Balances"],
  ["ENV 219", "Climate Dynamics"],
  ["ENV 224", "Ecology for Environmental Engineers"],
  ["ENV 250", "Hydraulic Engineering"],
  ["ENV 302", "Environmental Laws and Policies"],
  ["ENV 306", "Engineering Hydrology"],
  ["ENV 320", "Water Treatment Engineering"],
  ["ENV 322", "Wastewater Treatment Engineering"],
  ["ENV 323", "Municipal Solid Waste Management"],
  ["ENV 325", "Mass Transfer Operations"],
  ["ENV 327", "Hazardous Waste Management"],
  ["ENV 367", "Environmental Impact Assessment"],
  ["ENV 380", "Urban Water Systems Design"],
  ["ENV 412", "Sustainability for Engineers"],
  ["ENV 446", "Water Desalination"],
  ["ENV 470", "Air Quality and Pollution Engineering"],
  ["NANENG 171", "Materials Properties for Nanoelectronics"],
  ["NANENG 202", "Digital Logic"],
  ["NANENG 203", "Electric Circuits"],
  ["NANENG 205", "Physics of Semiconductors"],
  ["NANENG 211", "Electrical Power Circuits and Machines"],
  ["NANENG 212", "Applied Digital Control"],
  ["NANENG 218", "Thermofluids for Nanoelectronics"],
  ["NANENG 222", "Electronic Circuit Design"],
  ["NANENG 231", "Electromagnetics"],
  ["NANENG 301", "Micro/Nano Fabrication Techniques"],
  ["NANENG 303", "Computer Architecture and Design"],
  ["NANENG 308", "Solid State Devices"],
  ["NANENG 315", "MEMS Design and Fabrication"],
  ["NANENG 323", "Analog Integrated Circuit Design"],
  ["NANENG 325", "ASIC and FPGA Design"],
  ["NANENG 335", "Introduction to Photonics"],
  ["NANENG 361", "Communications Theory and Systems"],
  ["NANENG 406", "Modeling of Nanodevices"],
  ["NANENG 410", "Real-Time Embedded System and Microcontroller Design"],
  ["NANENG 424", "Photovoltaics and Photonic Devices"],
  ["NANENG 426", "Quantum Computer Programming"],
  ["NANENG 427", "Lasers and Optical Coherence"],
  ["NANENG 430", "Principles of Microwave and Waveguides"],
  ["NANENG 435", "Nanophotonics"],
  ["NANENG 437", "Organic Electronics and Photovoltaics"],
  ["NANENG 438", "CMOS Nanofabrication"],
  ["NANENG 439", "Advanced Digital ASIC Design"],
  ["NANENG 449", "Microfluidics and Biochips"],
  ["NANENG 462", "Optical Communication Systems"],
  ["NANENG 470", "Introduction to Silicon Integrated Photonics"],
  ["NANENG 471", "Solar Photovoltaics Technology"],
  ["REE 101", "Renewable Energy Systems"],
  ["REE 202", "Mechanics of Materials"],
  ["REE 302", "Machine Design"],
  ["REE 306", "Advanced Thermodynamics"],
  ["REE 310", "Control Systems"],
  ["REE 311", "Electric Machines"],
  ["REE 315", "Power Plant Technology"],
  ["REE 319", "Power Systems"],
  ["REE 321", "Power Electronics"],
  ["REE 403", "Renewable Energy Law and Economics"],
  ["REE 418", "Aerodynamics of Wind Turbines"],
  ["REE 425", "Thermal Solar Energy"],
  ["REE 428", "Energy Storage"],
  ["REE 429", "Smart Grid"],
  ["REE 432", "Photovoltaic Systems"],
  ["REE 434", "Wind Energy Systems"],
  ["REE 480", "Sustainable Energy Development"],
  ["REE 483", "Geothermal Energy"],
  ["REE 486", "Hydroelectric, Tidal and Wave Energy"],
  ["REE 489", "Nuclear Energy"],
  ["REE 490", "Electric Power Generation, Distribution and Utilization"],
  ["REE 495", "Electric Vehicles"],
  ["SPC 101", "Introduction to Aerospace Engineering"],
  ["SPC 206", "Advanced Thermodynamics"],
  ["SPC 210", "Control Systems"],
  ["SPC 228", "Engineering Dynamics"],
  ["SPC 302", "Advanced Control Systems"],
  ["SPC 304", "Orbital and Space Flight Mechanics"],
  ["SPC 307", "Aerodynamics"],
  ["SPC 315", "Thin-Walled Structures"],
  ["SPC 322", "Machine Design II"],
  ["SPC 327", "Analog and Digital Electronics"],
  ["SPC 332", "Flight Dynamics and Control"],
  ["SPC 337", "Gas Dynamics"],
  ["SPC 411", "Aircraft Autopilot and Guidance"],
  ["SPC 412", "Digital Control"],
  ["SPC 413", "Attitude Determination and Control"],
  ["SPC 414", "Optimal Control"],
  ["SPC 417", "Gas Turbine Engines"],
  ["SPC 418", "Control Systems Design for Autonomous Vehicles"],
  ["SPC 419", "Turbomachinery"],
  ["SPC 420", "Low Speed Aerodynamics"],
  ["SPC 422", "Aircraft Performance"],
  ["SPC 424", "Spacecraft and Space System Design"],
  ["SPC 428", "Mechatronics and Robotics"],
  ["SPC 436", "Computational Fluid Dynamics"],
  ["SPC 439", "Aircraft Conceptual Design"],
  ["SPC 460", "Non-Linear Control"],
  ["SPC 470", "Computer-Aided Design and Engineering"],
  ["SPC 477", "Airports and Airlines Management"],
  // ── General / Shared ──
  ["MATH 101", "Calculus I"],
  ["MATH 102", "Calculus II"],
  ["MATH 103", "Calculus for Computational Sciences"],
  ["MATH 104", "Linear Algebra"],
  ["MATH 105", "Probability and Statistics"],
  ["MATH 201", "Linear Algebra and Vector Geometry"],
  ["MATH 202", "Ordinary Differential Equations"],
  ["MATH 203", "Introduction to Discrete Mathematics"],
  ["MATH 205", "Discrete Mathematics for Computational Sciences"],
  ["MATH 301", "Probability and Statistics"],
  ["MATH 302", "Partial Differential Equations and Complex Analysis"],
  ["MATH 303", "Linear and Non-linear Programming for Computational Sciences"],
  ["MATH 306", "Numerical Analysis"],
  ["MATH 307", "Numerical Methods"],
  ["MATH 308", "Discrete Mathematics"],
  ["MATH 310", "Abstract Algebra"],
  ["MATH 403", "Introduction to Real Analysis and Topology"],
  ["MATH 404", "Linear and Non-linear Programming"],
  ["ENGL 152", "Effective Speaking and Composition"],
  ["ENGL 153", "Scientific Writing"],
  ["ENGL 154", "Business English 1"],
  ["ENGL 155", "Business English 2"],
  ["ENGL 156", "Technical English 1"],
  ["ENGL 157", "Technical English 2"],
  ["SCH 105", "Critical Thinking"],
  ["SCH 110", "Creativity and Innovation"],
  ["SCH 163", "Sustainability, Social and Ethical Issues in Computing"],
  ["SCH 201", "World Literature"],
  ["SCH 202", "Music Aesthetics"],
  ["SCH 206", "Introduction to the Visual Arts"],
  ["SCH 207", "Analytical Philosophy"],
  ["SCH 232", "Introduction to Psychology"],
  ["SCH 233", "Engineering Economical Analysis"],
  ["SCH 234", "History and Philosophy of Science"],
  ["SCH 244", "Leadership & Professionalism"],
  ["SCH 258", "Arabic Literature"],
  ["SCH 260", "Philosophical Thinking"],
  ["SCH 261", "Project Management and Economics"],
  ["SCH 262", "Engineering Project Economics"],
  ["SCH 263", "Engineering Ethics and Safety"],
  ["SCH 264", "Introduction to Entrepreneurship and Small Business Management"],
  ["SCH 266", "Sociology"],
  ["SCH 273", "Cognitive Psychology"],
  ["SCH 275", "The Creative Mind"],
  ["SCH 277", "Positive Psychology"],
  ["SCH 288", "Business Ethics"],
  ["ENGR 102", "Introduction to Engineering Design"],
  ["ENGR 105", "Engineering Thermodynamics"],
  ["ENGR 121", "Engineering Drawing"],
  ["ENGR 201", "Circuits and Electronics"],
  ["ENGR 207", "Fluid Mechanics"],
  ["CSCI 101", "Introduction to Computer Science"],
  ["CIE 202", "Fundamentals of Computer Programming"],
  ["CIE 205", "Data Structures and Algorithm Analysis"],
  ["CIE 470", "Introduction to Quantum Computation and Quantum Information"],
  ["PHYS 103", "Physics 1"],
  ["PHYS 104", "Physics 2"],
];

// Build fast lookup map
export const COURSE_LOOKUP = Object.fromEntries(RAW_COURSES);

// ── Suggested topic tags by prefix ───────────────────────────────────────────
export const PREFIX_TAGS = {
  CSAI: ["programming", "algorithms", "AI", "computer science"],
  DSAI: ["data science", "machine learning", "AI", "analytics"],
  IT: ["information technology", "networking", "systems"],
  ITCC: ["cloud computing", "infrastructure", "virtualization"],
  ITNS: ["network security", "cybersecurity", "networking"],
  SW: ["software engineering", "programming"],
  SWAPD: ["app development", "mobile", "web", "software"],
  SWGCG: ["game development", "graphics", "animation", "3D"],
  SWHCI: ["HCI", "UX", "human-computer interaction", "design"],
  BACT: ["actuarial", "risk", "insurance", "finance"],
  ECON: ["economics", "macroeconomics", "microeconomics"],
  FINC: ["finance", "investment", "markets"],
  MGMT: ["management", "leadership", "organizational behavior"],
  MKTG: ["marketing", "brand", "consumer behavior"],
  SCHN: ["supply chain", "logistics", "operations"],
  SUST: ["sustainability", "SDGs", "development"],
  BIOL: ["biology", "life sciences"],
  BMS: ["biomedical", "molecular biology", "medicine", "pharmacology"],
  CHEM: ["chemistry", "organic chemistry", "analytical chemistry"],
  NANOSC: ["nanoscience", "nanotechnology", "quantum", "materials"],
  MATSCI: ["materials science", "solid state", "polymers"],
  PHYS: ["physics", "quantum mechanics", "electromagnetism", "astrophysics"],
  CIE: ["communications", "electronics", "signal processing", "engineering"],
  ENV: ["environmental engineering", "water treatment", "sustainability"],
  NANENG: ["nanoelectronics", "VLSI", "semiconductors", "photonics"],
  REE: ["renewable energy", "solar", "wind energy", "power systems"],
  SPC: ["aerospace", "aerodynamics", "space", "flight mechanics"],
  MATH: ["mathematics", "calculus", "linear algebra", "statistics"],
  ENGL: ["english", "writing", "communication"],
  SCH: ["humanities", "ethics", "philosophy", "psychology"],
  ENGR: ["engineering", "design", "thermodynamics"],
};

/**
 * Detect course info from a YouTube playlist title.
 * Synchronized with backend profiler logic.
 * Returns { code, name, schoolId, programId, programLabel, tags, instructor, confidence } or null.
 */
export function detectFromTitle(title) {
  if (!title) return null;

  let code = null;
  let prefix = null;
  let schoolId = null;
  let programId = null;
  let programLabel = null;
  let confidence = "none";
  let courseName = null;
  let instructor = null;

  // 1. Extract Instructor dynamically
  const instructorMatch = title.match(
    /(?:Dr\.|Prof\.|Doctor|Professor)\s+([^-\|]+)/i,
  );
  if (instructorMatch) {
    instructor = instructorMatch[0].trim();
  }

  // 2. Explicit code check (e.g., "PHYS 323" or "CIE337")
  const patterns = [
    /\b([A-Z]{2,6})\s+(\d{3}[A-Z]?)\b/,
    /\b([A-Z]{2,6})(\d{3}[A-Z]?)\b/,
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      prefix = match[1];
      code = `${prefix} ${match[2]}`;
      confidence = "high";
      courseName = COURSE_LOOKUP[code] || null;
      break;
    }
  }

  // 3. Clean title for fuzzy matching
  let cleanTitle = title.toLowerCase();
  if (instructor) {
    cleanTitle = cleanTitle.replace(instructor.toLowerCase(), "");
  }
  // Strip out hyphens, (Incomplete), and extra whitespace
  cleanTitle = cleanTitle
    .replace(/\(.*\)/g, "")
    .split("-")[0]
    .trim();

  // Known typos/edge cases from the Zewail City YouTube channel
  if (cleanTitle.includes("advanced rf/mixed signal ics"))
    cleanTitle = "rf/mixed signal ics";
  if (cleanTitle.includes("analytical mechanic"))
    cleanTitle = "analytical mechanics";
  if (cleanTitle.includes("silicone photonics"))
    cleanTitle = "silicon integrated photonics";
  if (cleanTitle.includes("cosmology")) cleanTitle = "cosmology";

  // 4. Fuzzy Match against RAW_COURSES
  let bestMatch = null;
  let highestScore = 0;

  for (const [catCode, catName] of RAW_COURSES) {
    const catTitleLower = catName.toLowerCase();

    // Perfect exact match
    if (catTitleLower === cleanTitle) {
      bestMatch = {
        code: catCode,
        name: catName,
        prefix: catCode.split(" ")[0],
      };
      confidence = "high";
      break;
    }

    // Substring match
    if (
      cleanTitle.length > 5 &&
      (catTitleLower.includes(cleanTitle) || cleanTitle.includes(catTitleLower))
    ) {
      if (catTitleLower.length > highestScore) {
        highestScore = catTitleLower.length;
        bestMatch = {
          code: catCode,
          name: catName,
          prefix: catCode.split(" ")[0],
        };
      }
    }
  }

  // 5. Merge findings
  if (bestMatch && confidence !== "high") {
    code = code || bestMatch.code;
    prefix = prefix || bestMatch.prefix;
    courseName = bestMatch.name;
    confidence = "medium";
  } else if (bestMatch && confidence === "high") {
    code = bestMatch.code;
    prefix = bestMatch.prefix;
    courseName = bestMatch.name;
  } else if (code) {
    courseName = courseName || cleanTitle;
  }

  // 6. Map prefix to School/Program data
  if (prefix) {
    const schoolInfo = PREFIX_MAP[prefix];
    if (schoolInfo) {
      schoolId = schoolInfo.schoolId;
      programId = schoolInfo.programId;
      programLabel = schoolInfo.programLabel;
    } else {
      schoolId = "general";
    }
  }

  // 7. Fallback keyword matching (tags) if no course code was found
  let tags = PREFIX_TAGS[prefix] ?? [];
  if (!code && !bestMatch) {
    for (const [pfx, pfxTags] of Object.entries(PREFIX_TAGS)) {
      for (const tag of pfxTags) {
        if (cleanTitle.includes(tag.toLowerCase())) {
          const info = PREFIX_MAP[pfx];
          if (info) {
            schoolId = info.schoolId;
            programId = info.programId;
            programLabel = info.programLabel;
            tags = [tag];
            confidence = "low";
            break;
          }
        }
      }
      if (confidence === "low") break;
    }
  }

  return {
    code,
    prefix,
    name: courseName,
    schoolId,
    programId,
    programLabel,
    tags,
    instructor,
    confidence,
  };
}

/** Get school config by ID */
export function getSchool(id) {
  return (
    SCHOOLS.find((s) => s.id === id) ?? SCHOOLS.find((s) => s.id === "general")
  );
}

/** Get all programs for a school */
export function getPrograms(schoolId) {
  return PROGRAMS[schoolId] ?? [];
}
