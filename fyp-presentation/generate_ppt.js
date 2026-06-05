const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");

// Color palette: Deep Navy + Teal Accent + White
const C = {
  navy: "0D2137",       // dominant dark bg
  navyMid: "12305A",    // slightly lighter navy
  teal: "0891B2",       // accent
  tealLight: "22D3EE",  // highlight
  white: "FFFFFF",
  offWhite: "F0F6FA",
  lightGray: "CBD5E1",
  textDark: "0D2137",
  textMid: "334155",
  placeholder: "F59E0B", // amber for placeholders
  placeholderBg: "FEF3C7",
};

// Icon helper
const { FaGlobe, FaExclamationTriangle, FaSearch, FaBullseye, FaUsers, FaStar,
        FaBook, FaCogs, FaClipboardList, FaDraftingCompass, FaCode, FaHandshake,
        FaCalendarAlt, FaCheckCircle, FaList } = require("react-icons/fa");

function renderIconSvg(IconComponent, color = "#FFFFFF", size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
}

async function iconPng(IconComponent, color, size = 256) {
  const svg = renderIconSvg(IconComponent, color, size);
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

// Helpers
function makeShadow() {
  return { type: "outer", blur: 8, offset: 3, angle: 135, color: "000000", opacity: 0.18 };
}

function addSlideTitle(slide, title, pres) {
  // Dark top bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.72,
    fill: { color: C.navy }, line: { color: C.navy }
  });
  // Teal accent strip
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0.72, w: 10, h: 0.06,
    fill: { color: C.teal }, line: { color: C.teal }
  });
  slide.addText(title, {
    x: 0.4, y: 0.08, w: 9.2, h: 0.56,
    fontSize: 22, bold: true, color: C.white,
    fontFace: "Calibri", align: "left", valign: "middle", margin: 0
  });
}

function addFooter(slide, slideNum, pres) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.35, w: 10, h: 0.275,
    fill: { color: C.navy }, line: { color: C.navy }
  });
  slide.addText("International Student Mobility Management System  |  Muhammad Aliff Huzaiman  |  22002691", {
    x: 0.3, y: 5.36, w: 8.5, h: 0.25,
    fontSize: 8, color: C.lightGray, fontFace: "Calibri", align: "left", valign: "middle", margin: 0
  });
  slide.addText(`${slideNum} / 17`, {
    x: 8.8, y: 5.36, w: 0.9, h: 0.25,
    fontSize: 8, color: C.lightGray, fontFace: "Calibri", align: "right", valign: "middle", margin: 0
  });
}

function contentBox(slide, x, y, w, h, pres, fill = C.offWhite) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color: fill },
    line: { color: "DAE6F0", width: 0.5 },
    shadow: makeShadow()
  });
}

function placeholderBox(slide, x, y, w, h, label, pres) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color: C.placeholderBg },
    line: { color: C.placeholder, width: 1.5, dashType: "dash" }
  });
  slide.addText(`📌 PLACEHOLDER FOR DIAGRAM\n${label}`, {
    x: x + 0.12, y: y + 0.08, w: w - 0.24, h: h - 0.16,
    fontSize: 10, color: "92400E", fontFace: "Calibri",
    align: "center", valign: "middle", bold: false,
    italic: true
  });
}

async function buildPresentation() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "Muhammad Aliff Huzaiman bin Kamal Azwan";
  pres.title = "International Student Mobility Management System – FYP1 Proposal Defense";

  // ─────────────────────────────────────────────────────────────────
  // SLIDE 1: TITLE SLIDE
  // ─────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    // Full dark background
    s.background = { color: C.navy };

    // Top teal accent bar
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 0.18, h: 5.625,
      fill: { color: C.teal }, line: { color: C.teal }
    });

    // UM Logo placeholder
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.45, y: 0.4, w: 2.2, h: 0.65,
      fill: { color: C.navyMid }, line: { color: C.teal, width: 0.8 }
    });
    s.addText("UNIVERSITI MALAYA  |  FSKTM", {
      x: 0.45, y: 0.4, w: 2.2, h: 0.65,
      fontSize: 7.5, color: C.lightGray, fontFace: "Calibri",
      align: "center", valign: "middle", bold: true, margin: 0
    });

    // Main title
    s.addText("International Student Mobility\nManagement System", {
      x: 0.45, y: 1.25, w: 9.2, h: 1.5,
      fontSize: 36, bold: true, color: C.white,
      fontFace: "Calibri", align: "left", valign: "middle"
    });

    // Subtitle
    s.addText("FYP1 Proposal Defense", {
      x: 0.45, y: 2.7, w: 6, h: 0.45,
      fontSize: 16, color: C.tealLight, fontFace: "Calibri",
      align: "left", bold: false, italic: true
    });

    // Divider
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.45, y: 3.22, w: 5.5, h: 0.04,
      fill: { color: C.teal }, line: { color: C.teal }
    });

    // Info block
    const infoItems = [
      ["Student:", "Muhammad Aliff Huzaiman bin Kamal Azwan"],
      ["Matric No:", "22002691"],
      ["Supervisor:", "Dr. Asmiza binti Abdul Sani"],
      ["Programme:", "Bachelor of Computer Science (Software Engineering)"],
      ["Faculty:", "Faculty of Computer Science & Information Technology (FSKTM)"],
    ];
    infoItems.forEach(([label, val], i) => {
      s.addText(label, {
        x: 0.45, y: 3.35 + i * 0.34, w: 1.6, h: 0.3,
        fontSize: 10, color: C.tealLight, bold: true, fontFace: "Calibri",
        align: "left", valign: "middle", margin: 0
      });
      s.addText(val, {
        x: 2.1, y: 3.35 + i * 0.34, w: 7.5, h: 0.3,
        fontSize: 10, color: C.white, fontFace: "Calibri",
        align: "left", valign: "middle", margin: 0
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // SLIDE 2: OUTLINE
  // ─────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addSlideTitle(s, "Presentation Outline", pres);
    addFooter(s, 2, pres);

    const items = [
      ["01", "Introduction & Background"],
      ["02", "Problem Statement"],
      ["03", "Research Questions & Objectives"],
      ["04", "Scope & Significance of Study"],
      ["05", "Literature Review & Research Gap"],
      ["06", "Proposed Methodology (Agile Sprints)"],
      ["07", "System Requirements"],
      ["08", "Analysis & Design"],
      ["09", "Technical Implementation Plan"],
      ["10", "Stakeholder Collaboration"],
      ["11", "Expected Outcomes & Timeline"],
      ["12", "Conclusion & References"],
    ];

    const col1 = items.slice(0, 6);
    const col2 = items.slice(6);

    col1.forEach(([num, text], i) => {
      contentBox(s, 0.35, 0.9 + i * 0.74, 4.4, 0.65, pres);
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.35, y: 0.9 + i * 0.74, w: 0.55, h: 0.65,
        fill: { color: C.teal }, line: { color: C.teal }
      });
      s.addText(num, {
        x: 0.35, y: 0.9 + i * 0.74, w: 0.55, h: 0.65,
        fontSize: 13, bold: true, color: C.white, fontFace: "Calibri",
        align: "center", valign: "middle", margin: 0
      });
      s.addText(text, {
        x: 0.98, y: 0.9 + i * 0.74, w: 3.7, h: 0.65,
        fontSize: 11.5, color: C.textDark, fontFace: "Calibri",
        align: "left", valign: "middle"
      });
    });

    col2.forEach(([num, text], i) => {
      contentBox(s, 5.25, 0.9 + i * 0.74, 4.4, 0.65, pres);
      s.addShape(pres.shapes.RECTANGLE, {
        x: 5.25, y: 0.9 + i * 0.74, w: 0.55, h: 0.65,
        fill: { color: C.navy }, line: { color: C.navy }
      });
      s.addText(num, {
        x: 5.25, y: 0.9 + i * 0.74, w: 0.55, h: 0.65,
        fontSize: 13, bold: true, color: C.white, fontFace: "Calibri",
        align: "center", valign: "middle", margin: 0
      });
      s.addText(text, {
        x: 5.88, y: 0.9 + i * 0.74, w: 3.7, h: 0.65,
        fontSize: 11.5, color: C.textDark, fontFace: "Calibri",
        align: "left", valign: "middle"
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // SLIDE 3: INTRODUCTION & BACKGROUND
  // ─────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addSlideTitle(s, "Introduction & Background", pres);
    addFooter(s, 3, pres);

    // Left column – context text
    contentBox(s, 0.3, 0.9, 5.7, 4.2, pres);
    s.addText("Context", {
      x: 0.5, y: 0.95, w: 5.3, h: 0.35,
      fontSize: 13, bold: true, color: C.teal, fontFace: "Calibri", margin: 0
    });
    s.addText([
      { text: "What is Student Mobility?", options: { bold: true, breakLine: true } },
      { text: "International student mobility programmes enable students to pursue academic exchanges, internships, and short-term study visits at partner universities worldwide.", options: { breakLine: true } },
      { text: "\nManaging Authority:", options: { bold: true, breakLine: true } },
      { text: "The TDHEP (Training, Development, and Higher Education Programme) Office at FSKTM, Universiti Malaya, is responsible for administering all outbound and inbound mobility applications.", options: { breakLine: true } },
      { text: "\nCurrent State:", options: { bold: true, breakLine: true } },
      { text: "The existing workflow is entirely manual — relying on paper forms, email chains, and physical document submission — resulting in inefficiencies, errors, and a complete absence of real-time visibility.", options: { breakLine: true } },
      { text: "\nProposed Solution:", options: { bold: true, breakLine: true } },
      { text: "A centralised, web-based International Student Mobility Management System to automate the entire lifecycle from application to approval, integrating OCR, automated routing, and analytics." },
    ], {
      x: 0.5, y: 1.35, w: 5.3, h: 3.6,
      fontSize: 10.5, color: C.textDark, fontFace: "Calibri",
      align: "left", valign: "top"
    });

    // Right column – stat cards
    const stats = [
      ["Manual Processes", "100%", "of current TDHEP workflow"],
      ["Error Risk", "High", "due to transcription & email routing"],
      ["Real-time Tracking", "None", "available to students or staff"],
      ["Analytics Capability", "None", "for administrative reporting"],
    ];
    stats.forEach(([label, val, sub], i) => {
      const yy = 0.9 + i * 1.05;
      contentBox(s, 6.2, yy, 3.55, 0.9, pres, C.navy);
      s.addText(val, {
        x: 6.25, y: yy + 0.05, w: 1.1, h: 0.8,
        fontSize: 24, bold: true, color: C.tealLight, fontFace: "Calibri",
        align: "center", valign: "middle", margin: 0
      });
      s.addText(label, {
        x: 7.4, y: yy + 0.05, w: 2.2, h: 0.38,
        fontSize: 10, bold: true, color: C.white, fontFace: "Calibri",
        align: "left", valign: "bottom", margin: 0
      });
      s.addText(sub, {
        x: 7.4, y: yy + 0.43, w: 2.2, h: 0.38,
        fontSize: 9, color: C.lightGray, fontFace: "Calibri",
        align: "left", valign: "top", margin: 0
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // SLIDE 4: PROBLEM STATEMENT
  // ─────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addSlideTitle(s, "Problem Statement", pres);
    addFooter(s, 4, pres);

    const problems = [
      {
        num: "P1",
        title: "Error-Prone Manual Transcription",
        body: "Staff manually re-key identity data from physical documents into spreadsheets, a process that is both time-consuming and highly susceptible to human error.",
        cite: "(Wan & Abdullah, 2023)",
        color: "EF4444"
      },
      {
        num: "P2",
        title: "Unstructured Application Routing",
        body: "Applications are forwarded via unstructured email threads with no defined escalation paths. When an approver is unavailable, submissions stall indefinitely with no notification mechanism.",
        cite: "(TDHEP Office Interview, 2024)",
        color: "F97316"
      },
      {
        num: "P3",
        title: "Absence of Centralised Reporting Dashboard",
        body: "Administrators lack a centralised platform to monitor application statuses, track demographic trends, or generate routine reports, making evidence-based decision-making practically infeasible.",
        cite: "(Subramaniam et al., 2024)",
        color: "8B5CF6"
      },
    ];

    problems.forEach((p, i) => {
      const yy = 0.9 + i * 1.5;
      contentBox(s, 0.35, yy, 9.3, 1.35, pres);
      // Accent left bar
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.35, y: yy, w: 0.12, h: 1.35,
        fill: { color: p.color }, line: { color: p.color }
      });
      // Number badge
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.55, y: yy + 0.08, w: 0.55, h: 0.55,
        fill: { color: p.color }, line: { color: p.color },
        shadow: makeShadow()
      });
      s.addText(p.num, {
        x: 0.55, y: yy + 0.08, w: 0.55, h: 0.55,
        fontSize: 13, bold: true, color: C.white, fontFace: "Calibri",
        align: "center", valign: "middle", margin: 0
      });
      s.addText(p.title, {
        x: 1.2, y: yy + 0.1, w: 7.4, h: 0.35,
        fontSize: 12.5, bold: true, color: C.textDark, fontFace: "Calibri",
        align: "left", valign: "middle", margin: 0
      });
      s.addText(p.body, {
        x: 1.2, y: yy + 0.48, w: 6.6, h: 0.75,
        fontSize: 10, color: C.textMid, fontFace: "Calibri",
        align: "left", valign: "top", margin: 0
      });
      // Citation badge
      s.addShape(pres.shapes.RECTANGLE, {
        x: 7.85, y: yy + 0.52, w: 1.65, h: 0.3,
        fill: { color: p.color }, line: { color: p.color }
      });
      s.addText(p.cite, {
        x: 7.85, y: yy + 0.52, w: 1.65, h: 0.3,
        fontSize: 8, color: C.white, fontFace: "Calibri",
        align: "center", valign: "middle", bold: true, italic: true, margin: 0
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // SLIDE 5: RESEARCH QUESTIONS
  // ─────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addSlideTitle(s, "Research Questions", pres);
    addFooter(s, 5, pres);

    const rqs = [
      {
        num: "RQ1",
        q: "How can a centralised web portal effectively streamline the international student mobility application process and eliminate manual document transcription errors at FSKTM?",
        link: "Addresses: P1 — Manual transcription & P3 — Lack of centralised management"
      },
      {
        num: "RQ2",
        q: "How can a structured, automated multi-stage routing engine enforce accountability and prevent application bottlenecks in the mobility approval workflow?",
        link: "Addresses: P2 — Unstructured routing & absence of escalation mechanisms"
      },
      {
        num: "RQ3",
        q: "To what extent can a real-time demographic analytics dashboard enhance administrative visibility and support evidence-based decision-making for mobility programme management?",
        link: "Addresses: P3 — Absence of reporting capabilities"
      },
    ];

    rqs.forEach((r, i) => {
      const yy = 0.92 + i * 1.52;
      contentBox(s, 0.35, yy, 9.3, 1.38, pres);
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.35, y: yy, w: 0.9, h: 1.38,
        fill: { color: C.navy }, line: { color: C.navy }
      });
      s.addText(r.num, {
        x: 0.35, y: yy, w: 0.9, h: 1.38,
        fontSize: 13, bold: true, color: C.tealLight, fontFace: "Calibri",
        align: "center", valign: "middle", margin: 0
      });
      s.addText(r.q, {
        x: 1.38, y: yy + 0.1, w: 8.1, h: 0.75,
        fontSize: 11, color: C.textDark, fontFace: "Calibri",
        align: "left", valign: "top", bold: false, italic: false
      });
      s.addShape(pres.shapes.RECTANGLE, {
        x: 1.38, y: yy + 0.88, w: 8.1, h: 0.38,
        fill: { color: "EFF6FF" }, line: { color: "BFDBFE", width: 0.5 }
      });
      s.addText(`🔗  ${r.link}`, {
        x: 1.45, y: yy + 0.88, w: 8.0, h: 0.38,
        fontSize: 9, color: "1D4ED8", fontFace: "Calibri",
        align: "left", valign: "middle", italic: true
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // SLIDE 6: RESEARCH OBJECTIVES
  // ─────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addSlideTitle(s, "Research Objectives", pres);
    addFooter(s, 6, pres);

    const objs = [
      {
        num: "O1",
        title: "Streamline the Application Process",
        body: "To streamline the mobility application process by centralising submissions via a secure, role-based web portal, eliminating reliance on paper forms and email chains.",
        rq: "RQ1",
        color: C.teal
      },
      {
        num: "O2",
        title: "Minimise Manual Transcription Errors",
        body: "To minimise manual transcription errors by automating identity data extraction through Azure AI Document Intelligence (OCR), with a built-in human-in-the-loop validation step.",
        rq: "RQ1",
        color: "0369A1"
      },
      {
        num: "O3",
        title: "Enforce Accountability via Automated Routing",
        body: "To enforce accountability by implementing a strict, automated 3-stage routing engine that governs approvals across Student, Academic Advisor, and TDHEP Admin roles with escalation notifications.",
        rq: "RQ2",
        color: "7C3AED"
      },
      {
        num: "O4",
        title: "Enhance Administrative Visibility",
        body: "To enhance administrative visibility by providing a real-time demographic analytics dashboard powered by React Recharts, enabling data-driven reporting on mobility programme trends.",
        rq: "RQ3",
        color: "059669"
      },
    ];

    objs.forEach((o, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const xx = 0.32 + col * 4.85;
      const yy = 0.92 + row * 2.1;
      contentBox(s, xx, yy, 4.6, 1.9, pres);
      s.addShape(pres.shapes.RECTANGLE, {
        x: xx, y: yy, w: 4.6, h: 0.4,
        fill: { color: o.color }, line: { color: o.color }
      });
      s.addText(`${o.num}  ·  ${o.title}`, {
        x: xx + 0.1, y: yy, w: 4.3, h: 0.4,
        fontSize: 11, bold: true, color: C.white, fontFace: "Calibri",
        align: "left", valign: "middle"
      });
      s.addText(o.body, {
        x: xx + 0.1, y: yy + 0.44, w: 4.3, h: 1.3,
        fontSize: 10, color: C.textDark, fontFace: "Calibri",
        align: "left", valign: "top"
      });
      s.addShape(pres.shapes.RECTANGLE, {
        x: xx + 3.6, y: yy + 1.58, w: 0.88, h: 0.24,
        fill: { color: o.color }, line: { color: o.color }
      });
      s.addText(`Addresses ${o.rq}`, {
        x: xx + 3.6, y: yy + 1.58, w: 0.88, h: 0.24,
        fontSize: 7.5, bold: true, color: C.white, fontFace: "Calibri",
        align: "center", valign: "middle", margin: 0
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // SLIDE 7: SCOPE OF STUDY
  // ─────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addSlideTitle(s, "Scope of Study", pres);
    addFooter(s, 7, pres);

    // Left: In-scope
    contentBox(s, 0.32, 0.9, 5.6, 4.2, pres);
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.32, y: 0.9, w: 5.6, h: 0.42,
      fill: { color: C.teal }, line: { color: C.teal }
    });
    s.addText("✔  In Scope", {
      x: 0.4, y: 0.9, w: 5.4, h: 0.42,
      fontSize: 13, bold: true, color: C.white, fontFace: "Calibri",
      align: "left", valign: "middle"
    });
    const inScope = [
      ["Target Users (3 Roles)", "Students, Academic Advisors, TDHEP Administrators — each with distinct dashboards and action permissions."],
      ["Programme Types", "Dynamic routing logic for both Short-Term (e.g., summer schools, cultural exchanges) and Long-Term (e.g., semester exchanges, internships) programmes."],
      ["OCR with Human-in-the-loop", "Azure AI Document Intelligence extracts identity data from uploaded documents; a manual validation step allows staff to review and override extracted values."],
      ["Automated 3-Stage Routing", "Applications progress through a structured approval chain: Student → Academic Advisor → TDHEP Admin, with automated email notifications via MailKit."],
      ["Real-Time Analytics Dashboard", "Recharts-powered dashboard displaying demographic data, application statuses, and mobility trends for TDHEP Admins."],
    ];
    inScope.forEach(([title, body], i) => {
      s.addText(title, {
        x: 0.5, y: 1.4 + i * 0.72, w: 5.25, h: 0.24,
        fontSize: 10.5, bold: true, color: C.navy, fontFace: "Calibri",
        align: "left", valign: "middle", margin: 0
      });
      s.addText(body, {
        x: 0.5, y: 1.64 + i * 0.72, w: 5.25, h: 0.4,
        fontSize: 9.5, color: C.textMid, fontFace: "Calibri",
        align: "left", valign: "top", margin: 0
      });
    });

    // Right: Out-of-scope
    contentBox(s, 6.1, 0.9, 3.58, 4.2, pres, "FFF1F2");
    s.addShape(pres.shapes.RECTANGLE, {
      x: 6.1, y: 0.9, w: 3.58, h: 0.42,
      fill: { color: "DC2626" }, line: { color: "DC2626" }
    });
    s.addText("✘  Out of Scope", {
      x: 6.18, y: 0.9, w: 3.4, h: 0.42,
      fontSize: 13, bold: true, color: C.white, fontFace: "Calibri",
      align: "left", valign: "middle"
    });
    const outScope = [
      "Inbound (foreign) student mobility management",
      "Financial aid or scholarship processing modules",
      "Mobile application (iOS/Android) development",
      "Integration with external university SIS platforms",
      "Alumni or post-programme outcome tracking",
    ];
    outScope.forEach((item, i) => {
      s.addText([{ text: item, options: { bullet: true } }], {
        x: 6.2, y: 1.42 + i * 0.64, w: 3.35, h: 0.55,
        fontSize: 10, color: C.textDark, fontFace: "Calibri",
        align: "left", valign: "top"
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // SLIDE 8: SIGNIFICANCE OF THE STUDY
  // ─────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addSlideTitle(s, "Significance of the Study", pres);
    addFooter(s, 8, pres);

    const sigs = [
      {
        icon: "🎓",
        color: C.teal,
        who: "Students",
        title: "Enhanced Application Experience",
        body: "Students gain a transparent, trackable application portal with real-time status updates, reducing uncertainty and eliminating the need to contact the TDHEP Office manually for updates."
      },
      {
        icon: "📋",
        color: "7C3AED",
        who: "Academic Advisors",
        title: "Streamlined Endorsement Workflow",
        body: "Advisors receive structured, automated notifications for pending endorsements and can review applications within a dedicated portal, eliminating ad-hoc email coordination."
      },
      {
        icon: "🏛️",
        color: "059669",
        who: "TDHEP Administrators",
        title: "Operational Efficiency & Data-Driven Insights",
        body: "Administrators benefit from a centralised management dashboard, automated document routing, and real-time analytics to support strategic programme planning and accreditation reporting."
      },
      {
        icon: "🔬",
        color: "0369A1",
        who: "Research Contribution",
        title: "Bridging the Literature Gap",
        body: "This project contributes a localized, context-aware mobility management solution for Malaysian HEIs, addressing a documented gap in existing systems (MoveON, Terra Dotta, SMPMS) regarding OCR integration and visual analytics."
      },
    ];

    sigs.forEach((sig, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const xx = 0.32 + col * 4.85;
      const yy = 0.92 + row * 2.12;
      contentBox(s, xx, yy, 4.6, 1.9, pres);
      s.addShape(pres.shapes.RECTANGLE, {
        x: xx, y: yy, w: 0.7, h: 1.9,
        fill: { color: sig.color }, line: { color: sig.color }
      });
      s.addText(sig.icon, {
        x: xx, y: yy + 0.1, w: 0.7, h: 0.5,
        fontSize: 18, align: "center", valign: "middle", margin: 0
      });
      s.addText(sig.who, {
        x: xx, y: yy + 0.65, w: 0.7, h: 0.6,
        fontSize: 7.5, bold: true, color: C.white, fontFace: "Calibri",
        align: "center", valign: "middle", margin: 0, italic: true
      });
      s.addText(sig.title, {
        x: xx + 0.8, y: yy + 0.08, w: 3.65, h: 0.4,
        fontSize: 11, bold: true, color: C.navy, fontFace: "Calibri",
        align: "left", valign: "middle"
      });
      s.addText(sig.body, {
        x: xx + 0.8, y: yy + 0.5, w: 3.65, h: 1.3,
        fontSize: 9.5, color: C.textMid, fontFace: "Calibri",
        align: "left", valign: "top"
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // SLIDE 9: LITERATURE REVIEW & RESEARCH GAP
  // ─────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addSlideTitle(s, "Literature Review & Research Gap", pres);
    addFooter(s, 9, pres);

    // Table header
    const headers = [
      { text: "System", options: { bold: true, color: C.white } },
      { text: "Origin / Context", options: { bold: true, color: C.white } },
      { text: "OCR Support", options: { bold: true, color: C.white } },
      { text: "Routing Engine", options: { bold: true, color: C.white } },
      { text: "Visual Analytics", options: { bold: true, color: C.white } },
      { text: "Localisation (MY)", options: { bold: true, color: C.white } },
    ];

    const rows = [
      headers,
      ["MoveON", "Euro-centric HEI", "✘ None", "Basic", "Limited", "✘ None"],
      ["Terra Dotta", "US-centric (High Cost)", "✘ None", "Moderate", "Moderate", "✘ None"],
      ["UTHM SMPMS", "Malaysia (Localised)", "✘ None", "Basic", "✘ None", "Partial"],
      [
        { text: "Proposed System", options: { bold: true, color: C.teal } },
        { text: "FSKTM / Malaysia", options: { bold: true, color: C.teal } },
        { text: "✔ Azure OCR", options: { bold: true, color: "059669" } },
        { text: "✔ 3-Stage Auto", options: { bold: true, color: "059669" } },
        { text: "✔ React Charts", options: { bold: true, color: "059669" } },
        { text: "✔ Full (UM/FSKTM)", options: { bold: true, color: "059669" } },
      ],
    ];

    s.addTable(rows, {
      x: 0.32, y: 0.9, w: 9.36, h: 2.5,
      colW: [1.6, 1.8, 1.4, 1.5, 1.4, 1.66],
      fill: { color: C.offWhite },
      border: { pt: 0.5, color: "CBD5E1" },
      autoPage: false,
    });
    // Style header row manually via shape overlay
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.32, y: 0.9, w: 9.36, h: 0.42,
      fill: { color: C.navy }, line: { color: C.navy }
    });
    const hLabels = ["System", "Origin / Context", "OCR Support", "Routing Engine", "Visual Analytics", "Localisation (MY)"];
    const colW2 = [1.6, 1.8, 1.4, 1.5, 1.4, 1.66];
    let cx = 0.32;
    hLabels.forEach((h, i) => {
      s.addText(h, {
        x: cx, y: 0.9, w: colW2[i], h: 0.42,
        fontSize: 9.5, bold: true, color: C.white, fontFace: "Calibri",
        align: "center", valign: "middle", margin: 0
      });
      cx += colW2[i];
    });

    // Gap explanation
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.32, y: 3.55, w: 9.36, h: 0.06,
      fill: { color: C.teal }, line: { color: C.teal }
    });
    contentBox(s, 0.32, 3.65, 9.36, 1.52, pres, "EFF6FF");
    s.addText("Identified Research Gap", {
      x: 0.5, y: 3.7, w: 9.0, h: 0.32,
      fontSize: 12, bold: true, color: C.navy, fontFace: "Calibri",
      align: "left", valign: "middle", margin: 0
    });
    s.addText([
      { text: "No existing mobility management system simultaneously addresses: (1) automated OCR-based data extraction with human-in-the-loop validation, (2) a structured multi-stage approval routing engine with role-based escalation, and (3) a real-time visual analytics dashboard — within a Malaysian HEI context. ", options: { breakLine: true } },
      { text: "This system bridges that gap by combining Azure AI Document Intelligence, an ASP.NET Core routing engine, and a React/Recharts dashboard, localised for Universiti Malaya's FSKTM-TDHEP operational context." },
    ], {
      x: 0.5, y: 4.06, w: 9.0, h: 1.0,
      fontSize: 10.5, color: C.textDark, fontFace: "Calibri",
      align: "left", valign: "top"
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // SLIDE 10: PROPOSED METHODOLOGY
  // ─────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addSlideTitle(s, "Proposed Methodology — Agile SDLC", pres);
    addFooter(s, 10, pres);

    // Sub-header
    s.addText("Data Collection Methods:", {
      x: 0.35, y: 0.82, w: 4, h: 0.28,
      fontSize: 10, bold: true, color: C.navy, fontFace: "Calibri", margin: 0
    });
    const methods = ["Literature Review — Academic papers, system comparisons", "TDHEP Office Interview (2024) — Requirements elicitation, schema validation", "Student Alumni Interview — UX needs analysis"];
    s.addText(methods.map(m => ({ text: m, options: { bullet: true, breakLine: true } })), {
      x: 0.35, y: 1.1, w: 9.3, h: 0.55,
      fontSize: 9.5, color: C.textDark, fontFace: "Calibri"
    });

    // Sprint table
    const sprintData = [
      [
        { text: "Sprint", options: { bold: true, color: C.white, fill: { color: C.navy } } },
        { text: "Duration", options: { bold: true, color: C.white, fill: { color: C.navy } } },
        { text: "Phase", options: { bold: true, color: C.white, fill: { color: C.navy } } },
        { text: "Key Activities & Deliverables", options: { bold: true, color: C.white, fill: { color: C.navy } } },
      ],
      ["Sprint 1", "Weeks 1–2", "Planning & Requirements", "Literature review; TDHEP Office interview; requirements elicitation (FRs/NFRs); system scope definition"],
      ["Sprint 2", "Weeks 3–4", "Analysis & Design", "Use Case Diagrams; ERD; Sequence Diagrams; UI/UX wireframes; technology stack selection"],
      ["Sprint 3", "Weeks 5–6", "Core Development I", "Project scaffolding (React/ASP.NET Core); database schema (PostgreSQL/JSONB); user authentication (JWT/RBAC)"],
      ["Sprint 4", "Weeks 7–8", "Core Development II", "OCR module integration (Azure AI Doc Intelligence); human-in-the-loop validation UI; OCR data mapping to application form"],
      ["Sprint 5", "Weeks 9–10", "Core Development III", "3-Stage automated routing engine; MailKit email notification service; role-based dashboards"],
      ["Sprint 6", "Weeks 11–12", "Development & Integration", "React analytics dashboard (Recharts); short-term vs long-term programme logic; end-to-end integration testing"],
      ["Sprint 7", "Weeks 13–14", "Testing & Validation", "Unit testing; UAT with TDHEP Office; bug fixes; stakeholder review and schema validation"],
      ["Sprint 8", "Weeks 15–16", "Finalisation", "Performance optimisation; documentation (SRS, SDD); FYP2 report preparation and defense submission"],
    ];

    // Overlay for header row
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.32, y: 1.72, w: 9.36, h: 0.36,
      fill: { color: C.navy }, line: { color: C.navy }
    });
    ["Sprint", "Duration", "Phase", "Key Activities & Deliverables"].forEach((h, i) => {
      const cw = [0.7, 0.88, 1.52, 6.26];
      const cx2 = [0.32, 1.02, 1.9, 3.42];
      s.addText(h, {
        x: cx2[i], y: 1.72, w: cw[i], h: 0.36,
        fontSize: 9.5, bold: true, color: C.white, fontFace: "Calibri",
        align: "center", valign: "middle", margin: 0
      });
    });

    const rowH = 0.38;
    sprintData.slice(1).forEach((row, i) => {
      const yy = 2.1 + i * rowH;
      const bg = i % 2 === 0 ? C.offWhite : "E8F4FB";
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.32, y: yy, w: 9.36, h: rowH,
        fill: { color: bg }, line: { color: "CBD5E1", width: 0.3 }
      });
      const cw = [0.7, 0.88, 1.52, 6.26];
      const cx2 = [0.32, 1.02, 1.9, 3.42];
      const colors = [C.teal, C.navy, "7C3AED", C.textDark];
      const bolds = [true, false, true, false];
      row.forEach((cell, j) => {
        s.addText(typeof cell === "string" ? cell : cell.text, {
          x: cx2[j] + 0.05, y: yy, w: cw[j] - 0.1, h: rowH,
          fontSize: j === 3 ? 8.5 : 9,
          bold: bolds[j],
          color: colors[j],
          fontFace: "Calibri",
          align: j === 3 ? "left" : "center",
          valign: "middle",
          margin: 0
        });
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // SLIDE 11: REQUIREMENTS
  // ─────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addSlideTitle(s, "System Requirements", pres);
    addFooter(s, 11, pres);

    // Left: FRs
    contentBox(s, 0.32, 0.9, 5.3, 4.25, pres);
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.32, y: 0.9, w: 5.3, h: 0.4,
      fill: { color: C.teal }, line: { color: C.teal }
    });
    s.addText("Functional Requirements (FRs)", {
      x: 0.42, y: 0.9, w: 5.1, h: 0.4,
      fontSize: 12, bold: true, color: C.white, fontFace: "Calibri",
      align: "left", valign: "middle"
    });
    const frs = [
      ["FR-01", "User Authentication", "The system shall authenticate users via role-based JWT tokens distinguishing Students, Academic Advisors, and TDHEP Admins."],
      ["FR-02", "Application Submission", "Students shall submit mobility applications through a structured web form supporting document upload and programme-type selection."],
      ["FR-03", "OCR Data Extraction", "The system shall invoke Azure AI Document Intelligence to extract identity fields from uploaded documents, presenting results for human-in-the-loop validation."],
      ["FR-04", "Automated Routing Engine", "Approved applications shall be automatically routed through a 3-stage sequential workflow with automated email notifications at each stage."],
      ["FR-05", "Status Tracking", "Students shall be able to monitor the real-time status of their applications through a personal dashboard."],
      ["FR-06", "Analytics Dashboard", "TDHEP Admins shall have access to a dashboard displaying mobility trends, demographic breakdowns, and application statistics via interactive charts."],
    ];
    frs.forEach(([id, title, desc], i) => {
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.38, y: 1.38 + i * 0.59, w: 0.55, h: 0.2,
        fill: { color: C.teal }, line: { color: C.teal }
      });
      s.addText(id, {
        x: 0.38, y: 1.38 + i * 0.59, w: 0.55, h: 0.2,
        fontSize: 7.5, bold: true, color: C.white, fontFace: "Calibri",
        align: "center", valign: "middle", margin: 0
      });
      s.addText(title, {
        x: 1.0, y: 1.38 + i * 0.59, w: 4.4, h: 0.2,
        fontSize: 9.5, bold: true, color: C.navy, fontFace: "Calibri",
        align: "left", valign: "middle", margin: 0
      });
      s.addText(desc, {
        x: 1.0, y: 1.6 + i * 0.59, w: 4.4, h: 0.34,
        fontSize: 8.8, color: C.textMid, fontFace: "Calibri",
        align: "left", valign: "top", margin: 0
      });
    });

    // Right: NFRs
    contentBox(s, 5.8, 0.9, 3.88, 4.25, pres);
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.8, y: 0.9, w: 3.88, h: 0.4,
      fill: { color: C.navy }, line: { color: C.navy }
    });
    s.addText("Non-Functional Requirements (NFRs)", {
      x: 5.9, y: 0.9, w: 3.68, h: 0.4,
      fontSize: 11, bold: true, color: C.white, fontFace: "Calibri",
      align: "left", valign: "middle"
    });
    const nfrs = [
      ["NFR-01", "Performance", "API response time shall not exceed 2 seconds under normal load conditions (≤50 concurrent users)."],
      ["NFR-02", "Usability", "The UI shall conform to WCAG 2.1 Level AA accessibility guidelines. Navigation to any feature shall require no more than 3 clicks."],
      ["NFR-03", "Security", "All data transmissions shall be encrypted via HTTPS/TLS. User passwords shall be hashed using BCrypt."],
      ["NFR-04", "Reliability", "The system shall maintain ≥99% uptime during business hours, with automated error logging."],
      ["NFR-05", "Scalability", "The PostgreSQL JSONB schema shall support schema-less OCR result storage, enabling future field additions without migration."],
      ["NFR-06", "Maintainability", "The back-end shall follow Clean Architecture principles (Domain, Application, Infrastructure, Presentation layers) for separation of concerns."],
    ];
    nfrs.forEach(([id, cat, desc], i) => {
      s.addShape(pres.shapes.RECTANGLE, {
        x: 5.86, y: 1.38 + i * 0.59, w: 0.62, h: 0.2,
        fill: { color: C.navy }, line: { color: C.navy }
      });
      s.addText(id, {
        x: 5.86, y: 1.38 + i * 0.59, w: 0.62, h: 0.2,
        fontSize: 7.5, bold: true, color: C.white, fontFace: "Calibri",
        align: "center", valign: "middle", margin: 0
      });
      s.addText(cat, {
        x: 6.55, y: 1.38 + i * 0.59, w: 3.0, h: 0.2,
        fontSize: 9.5, bold: true, color: C.navy, fontFace: "Calibri",
        align: "left", valign: "middle", margin: 0
      });
      s.addText(desc, {
        x: 6.55, y: 1.6 + i * 0.59, w: 3.0, h: 0.34,
        fontSize: 8.5, color: C.textMid, fontFace: "Calibri",
        align: "left", valign: "top", margin: 0
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // SLIDE 12: ANALYSIS & DESIGN
  // ─────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addSlideTitle(s, "Analysis & Design", pres);
    addFooter(s, 12, pres);

    // System Architecture (top-left)
    s.addText("System Architecture", {
      x: 0.35, y: 0.85, w: 4.4, h: 0.28,
      fontSize: 10.5, bold: true, color: C.navy, fontFace: "Calibri", margin: 0
    });
    placeholderBox(s, 0.35, 1.15, 4.4, 1.65,
      "3-tier architecture diagram: React (Vite) frontend → ASP.NET Core 8 Clean Architecture API → PostgreSQL database, with Azure AI Document Intelligence and MailKit as external service integrations.", pres);

    // Use Case (top-right)
    s.addText("Use Case Diagram", {
      x: 5.25, y: 0.85, w: 4.4, h: 0.28,
      fontSize: 10.5, bold: true, color: C.navy, fontFace: "Calibri", margin: 0
    });
    placeholderBox(s, 5.25, 1.15, 4.4, 1.65,
      "UML Use Case Diagram showing 3 actors (Student, Academic Advisor, TDHEP Admin) and their associated use cases: Submit Application, Validate OCR, Endorse/Reject, Final Approval, View Dashboard.", pres);

    // ERD (bottom-left)
    s.addText("Entity-Relationship Diagram (ERD)", {
      x: 0.35, y: 2.97, w: 4.4, h: 0.28,
      fontSize: 10.5, bold: true, color: C.navy, fontFace: "Calibri", margin: 0
    });
    placeholderBox(s, 0.35, 3.27, 4.4, 1.85,
      "ERD showing core entities: User, Application, Programme, Document, OCR_Result (JSONB), RoutingStage, Notification — with cardinality and foreign key relationships.", pres);

    // Sequence Diagram (bottom-right)
    s.addText("Sequence Diagram — Application Routing", {
      x: 5.25, y: 2.97, w: 4.4, h: 0.28,
      fontSize: 10.5, bold: true, color: C.navy, fontFace: "Calibri", margin: 0
    });
    placeholderBox(s, 5.25, 3.27, 4.4, 1.85,
      "UML Sequence Diagram depicting the message flow: Student submits → System invokes OCR → Admin validates → Routing Engine escalates to Academic Advisor → TDHEP Admin final approval → Notification sent.", pres);
  }

  // ─────────────────────────────────────────────────────────────────
  // SLIDE 13: TECHNICAL IMPLEMENTATION PLAN
  // ─────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addSlideTitle(s, "Technical Implementation Plan", pres);
    addFooter(s, 13, pres);

    const stack = [
      {
        layer: "Front-End",
        color: C.teal,
        tech: "React 18 (Vite)",
        items: [
          "MUI (Material UI) — Component library for role-based dashboards",
          "Recharts — Interactive demographic analytics charts",
          "React Router v6 — Client-side routing",
          "Axios — REST API communication layer",
        ]
      },
      {
        layer: "Back-End",
        color: C.navy,
        tech: "ASP.NET Core 8",
        items: [
          "Clean Architecture (Domain → Application → Infrastructure → Presentation)",
          "MediatR — CQRS pattern for command/query separation",
          "Entity Framework Core — ORM for PostgreSQL",
          "JWT Bearer Authentication — Role-based access control",
        ]
      },
      {
        layer: "Database",
        color: "7C3AED",
        tech: "PostgreSQL",
        items: [
          "JSONB columns for schema-flexible OCR result storage",
          "Relational tables for Users, Applications, Routing Stages",
          "Indexed queries for dashboard analytics performance",
        ]
      },
      {
        layer: "External Services",
        color: "059669",
        tech: "Azure & MailKit",
        items: [
          "Azure AI Document Intelligence — OCR field extraction from uploaded IDs/transcripts",
          "MailKit — SMTP email notifications for routing stage transitions",
        ]
      },
    ];

    stack.forEach((layer, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const xx = 0.32 + col * 4.85;
      const yy = 0.9 + row * 2.18;
      const h = row === 1 && col === 1 ? 1.9 : (row === 1 ? 1.9 : 2.0);
      contentBox(s, xx, yy, 4.6, h, pres);
      s.addShape(pres.shapes.RECTANGLE, {
        x: xx, y: yy, w: 4.6, h: 0.38,
        fill: { color: layer.color }, line: { color: layer.color }
      });
      s.addText(`${layer.layer}  ·  ${layer.tech}`, {
        x: xx + 0.1, y: yy, w: 4.4, h: 0.38,
        fontSize: 10.5, bold: true, color: C.white, fontFace: "Calibri",
        align: "left", valign: "middle"
      });
      s.addText(layer.items.map((it, j) => ({
        text: it,
        options: { bullet: true, breakLine: j < layer.items.length - 1 }
      })), {
        x: xx + 0.15, y: yy + 0.42, w: 4.3, h: h - 0.5,
        fontSize: 9.5, color: C.textDark, fontFace: "Calibri",
        align: "left", valign: "top"
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // SLIDE 14: STAKEHOLDER COLLABORATION
  // ─────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addSlideTitle(s, "Stakeholder Collaboration Initiative", pres);
    addFooter(s, 14, pres);

    // Left column
    contentBox(s, 0.32, 0.9, 5.55, 4.25, pres);
    s.addText("Collaboration with FSKTM TDHEP Office", {
      x: 0.45, y: 0.96, w: 5.25, h: 0.32,
      fontSize: 12, bold: true, color: C.navy, fontFace: "Calibri", margin: 0
    });

    const acts = [
      ["📋", "Requirements Elicitation Interview", "A structured interview was conducted with TDHEP Office staff to document the current manual workflow, identify pain points, and derive functional requirements.", "(TDHEP Office Interview, 2024)"],
      ["📐", "Database Schema Validation", "The proposed PostgreSQL schema (entities, relationships, JSONB OCR fields) was reviewed and validated with the TDHEP Office to ensure it accurately reflects operational data needs.", "(Schema Review Session, 2024)"],
      ["🎓", "Student Alumni Interview", "Semi-structured interviews with student alumni who participated in mobility programmes were conducted to capture end-user UX requirements and application pain points.", "(Alumni Interview, 2024)"],
    ];

    acts.forEach(([icon, title, body, cite], i) => {
      s.addText(icon, {
        x: 0.42, y: 1.38 + i * 1.2, w: 0.4, h: 0.35,
        fontSize: 16, align: "center", valign: "middle", margin: 0
      });
      s.addText(title, {
        x: 0.88, y: 1.38 + i * 1.2, w: 4.8, h: 0.32,
        fontSize: 10.5, bold: true, color: C.teal, fontFace: "Calibri",
        align: "left", valign: "middle", margin: 0
      });
      s.addText(body, {
        x: 0.88, y: 1.72 + i * 1.2, w: 4.8, h: 0.58,
        fontSize: 9.5, color: C.textMid, fontFace: "Calibri",
        align: "left", valign: "top", margin: 0
      });
      s.addText(cite, {
        x: 0.88, y: 2.3 + i * 1.2, w: 4.8, h: 0.2,
        fontSize: 8.5, color: C.teal, fontFace: "Calibri",
        italic: true, align: "left", valign: "middle", margin: 0
      });
    });

    // Right column — placeholders
    contentBox(s, 6.05, 0.9, 3.63, 2.0, pres, C.placeholderBg);
    s.addShape(pres.shapes.RECTANGLE, {
      x: 6.05, y: 0.9, w: 3.63, h: 0.4,
      fill: { color: C.placeholder }, line: { color: C.placeholder }
    });
    s.addText("📎  Physical Evidence Required", {
      x: 6.1, y: 0.9, w: 3.53, h: 0.4,
      fontSize: 10.5, bold: true, color: "92400E", fontFace: "Calibri",
      align: "left", valign: "middle"
    });
    s.addText("📌 PLACEHOLDER FOR DIAGRAM\nInsert scanned copy of official TDHEP Office interview minutes or signed stakeholder collaboration letter here.", {
      x: 6.1, y: 1.35, w: 3.5, h: 1.45,
      fontSize: 9.5, color: "92400E", fontFace: "Calibri",
      align: "center", valign: "middle", italic: true
    });

    contentBox(s, 6.05, 3.1, 3.63, 1.85, pres, C.placeholderBg);
    s.addShape(pres.shapes.RECTANGLE, {
      x: 6.05, y: 3.1, w: 3.63, h: 0.4,
      fill: { color: C.placeholder }, line: { color: C.placeholder }
    });
    s.addText("📎  Photo / Quote Evidence", {
      x: 6.1, y: 3.1, w: 3.53, h: 0.4,
      fontSize: 10.5, bold: true, color: "92400E", fontFace: "Calibri",
      align: "left", valign: "middle"
    });
    s.addText("📌 PLACEHOLDER FOR DIAGRAM\nInsert a photograph from the interview session or a direct quote from TDHEP staff confirming the pain points identified.", {
      x: 6.1, y: 3.55, w: 3.5, h: 1.3,
      fontSize: 9.5, color: "92400E", fontFace: "Calibri",
      align: "center", valign: "middle", italic: true
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // SLIDE 15: EXPECTED OUTCOMES & TIMELINE
  // ─────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addSlideTitle(s, "Expected Outcomes & Project Timeline", pres);
    addFooter(s, 15, pres);

    // Expected outcomes (top)
    const outcomes = [
      ["✅", "Functional Web System", "A fully deployed, role-based web application supporting the end-to-end mobility application lifecycle.", C.teal],
      ["✅", "Validated OCR Module", "An Azure OCR pipeline achieving ≥90% field extraction accuracy, validated against real TDHEP documents.", "0369A1"],
      ["✅", "Automated Routing Engine", "A zero-human-intervention 3-stage routing workflow with ≤15-minute notification delivery time.", "7C3AED"],
      ["✅", "Analytics Dashboard", "A real-time Recharts dashboard enabling demographic and trend analysis for administrative decision-making.", "059669"],
    ];

    outcomes.forEach((o, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const xx = 0.32 + col * 4.85;
      const yy = 0.88 + row * 0.88;
      contentBox(s, xx, yy, 4.6, 0.78, pres);
      s.addShape(pres.shapes.RECTANGLE, {
        x: xx, y: yy, w: 0.45, h: 0.78,
        fill: { color: o[3] }, line: { color: o[3] }
      });
      s.addText(o[0], {
        x: xx, y: yy, w: 0.45, h: 0.78,
        fontSize: 14, align: "center", valign: "middle", margin: 0
      });
      s.addText(o[1], {
        x: xx + 0.55, y: yy + 0.05, w: 3.9, h: 0.25,
        fontSize: 10.5, bold: true, color: C.navy, fontFace: "Calibri",
        align: "left", valign: "middle", margin: 0
      });
      s.addText(o[2], {
        x: xx + 0.55, y: yy + 0.32, w: 3.9, h: 0.38,
        fontSize: 9, color: C.textMid, fontFace: "Calibri",
        align: "left", valign: "top", margin: 0
      });
    });

    // Gantt placeholder
    s.addText("Project Timeline (Gantt Chart)", {
      x: 0.35, y: 2.72, w: 5, h: 0.28,
      fontSize: 10.5, bold: true, color: C.navy, fontFace: "Calibri", margin: 0
    });
    placeholderBox(s, 0.32, 3.02, 9.36, 2.1,
      "Gantt Chart spanning Weeks 1–16 across 8 sprints. Rows: Planning, Analysis & Design, OCR Development, Routing Engine, Dashboard, Testing & UAT, Finalisation. Columns: Week 1–16, with coloured bars indicating task duration and sprint boundaries.", pres);
  }

  // ─────────────────────────────────────────────────────────────────
  // SLIDE 16: CONCLUSION
  // ─────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };

    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 0.18, h: 5.625,
      fill: { color: C.teal }, line: { color: C.teal }
    });

    s.addText("Conclusion", {
      x: 0.45, y: 0.3, w: 9.2, h: 0.55,
      fontSize: 30, bold: true, color: C.white, fontFace: "Calibri",
      align: "left", valign: "middle"
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.45, y: 0.88, w: 4.5, h: 0.04,
      fill: { color: C.teal }, line: { color: C.teal }
    });

    const points = [
      ["The Problem", "The TDHEP Office at FSKTM currently operates a fully manual mobility management process, resulting in transcription errors, unstructured routing, and zero real-time visibility for students and administrators."],
      ["The Solution", "The proposed International Student Mobility Management System addresses all three identified problems through a centralised web portal, Azure OCR integration, automated 3-stage routing, and a real-time analytics dashboard."],
      ["The Approach", "Development follows an Agile SDLC with structured 2-week sprints, grounded in direct stakeholder collaboration with the TDHEP Office and student alumni interviews."],
      ["The Contribution", "This system bridges a documented gap in Malaysian HEI mobility management literature by combining OCR automation, role-based workflow enforcement, and visual analytics in a single localised platform."],
    ];

    points.forEach(([label, body], i) => {
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.45, y: 1.06 + i * 1.05, w: 1.15, h: 0.28,
        fill: { color: C.teal }, line: { color: C.teal }
      });
      s.addText(label, {
        x: 0.45, y: 1.06 + i * 1.05, w: 1.15, h: 0.28,
        fontSize: 9, bold: true, color: C.white, fontFace: "Calibri",
        align: "center", valign: "middle", margin: 0
      });
      s.addText(body, {
        x: 0.45, y: 1.36 + i * 1.05, w: 9.1, h: 0.62,
        fontSize: 11, color: C.lightGray, fontFace: "Calibri",
        align: "left", valign: "top"
      });
    });

    s.addText("Thank you for your attention.\nPanel questions are welcome.", {
      x: 0.45, y: 5.1, w: 9.1, h: 0.38,
      fontSize: 10, color: C.tealLight, fontFace: "Calibri",
      italic: true, align: "left", valign: "middle"
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // SLIDE 17: REFERENCES
  // ─────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addSlideTitle(s, "References", pres);
    addFooter(s, 17, pres);

    const refs = [
      "Subramaniam, P., Razak, R. A., & Hamid, N. A. (2024). Administrative dashboards and data-driven decision-making in Malaysian higher education institutions. Journal of Information Systems and Technology Management, 21(1), 45–62.",
      "Wan, W. A. R., & Abdullah, N. (2023). The impact of manual data transcription on administrative efficiency in Malaysian public universities. Malaysian Journal of Computer Science, 36(2), 112–128.",
      "TDHEP Office, Faculty of Computer Science & Information Technology, Universiti Malaya. (2024). Unpublished stakeholder requirements interview [Primary data source].",
      "Microsoft Azure. (2024). Azure AI Document Intelligence documentation. Microsoft Corporation. https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/",
      "Luber, S., & Litwin, P. (2023). Comparative analysis of international student mobility management systems: MoveON, Terra Dotta, and open-source alternatives. International Journal of Higher Education Technology, 12(3), 88–104.",
      "Universiti Tun Hussein Onn Malaysia. (2022). Student Mobility and Programme Management System (SMPMS) — System documentation and evaluation report [Institutional report].",
      "Fowler, M. (2018). Refactoring: Improving the design of existing code (2nd ed.). Addison-Wesley.",
      "Martin, R. C. (2017). Clean architecture: A craftsman's guide to software structure and design. Prentice Hall.",
    ];

    refs.forEach((ref, i) => {
      s.addText(`[${i + 1}]  ${ref}`, {
        x: 0.38, y: 0.9 + i * 0.56, w: 9.3, h: 0.52,
        fontSize: 9.5, color: C.textDark, fontFace: "Calibri",
        align: "left", valign: "top",
      });
      if (i < refs.length - 1) {
        s.addShape(pres.shapes.RECTANGLE, {
          x: 0.38, y: 0.9 + (i + 1) * 0.56 - 0.04, w: 9.3, h: 0.01,
          fill: { color: "CBD5E1" }, line: { color: "CBD5E1" }
        });
      }
    });
  }

  await pres.writeFile({ fileName: "FYP_Proposal_Defense.pptx" });
  console.log("Done.");
}

buildPresentation().catch(console.error);