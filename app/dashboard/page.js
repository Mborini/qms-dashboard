"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";

import {
  Box,
  Container,
  SimpleGrid,
  Text,
  Group,
  Divider,
} from "@mantine/core";

import {
  IconChartBar,
  IconMap,
  IconRoute,
  IconMapPin,
  IconFileTypeXls,
  IconMap2,
  IconUsers,
  IconLogout,
  IconTool,
  IconHistory,
  IconSettings,
  IconTruck,
  IconChevronDown,
  IconChevronUp,
  IconRefresh,
  IconShield,
  IconLock,
  IconArrowsExchange,
  IconFileText,
} from "@tabler/icons-react";

import { bungee } from "../layout";
import { hasPermission } from "../lib/permissions";
import { MODULES, SECTIONS } from "../lib/modules";

/* =========================================================
   ICONS  (اسم الأيقونة بـ modules.ts → الأيقونة الفعلية)
========================================================= */


const ICONS = {
  IconChartBar,
  IconMap,
  IconRoute,
  IconMapPin,
  IconFileTypeXls,
  IconMap2,
  IconUsers,
  IconTool,
  IconHistory,
  IconSettings,
  IconTruck,
  IconShield,
  IconLock,
  IconArrowsExchange,
  IconFileText,
};

/* =========================================================
   DESIGN TOKENS  (نفس ألوان DistrictCard: Navy + Champagne Gold)
========================================================= */

const INK = "#1A2A4A"; // الهيدر
const SURFACE = "#213459"; // خلفية الصفحة
const SURFACE_2 = "#2A4070"; // البطاقات
const GOLD = "#C9A66B";
const GOLD_LIGHT = "#E6CF9D";
const TEXT = "#F3F6FC";
const MUTED = "rgba(240,244,252,.72)";
const FAINT = "rgba(240,244,252,.5)";
const LINE = "rgba(255,255,255,.12)";
const LINE_STRONG = "rgba(255,255,255,.22)";

const FONT =
  '"IBM Plex Sans Arabic", "Cairo", "Tajawal", "Segoe UI", system-ui, sans-serif';

/** شفافية للون hex */
const hexA = (hex, a) =>
  `${hex}${Math.round(a * 255)
    .toString(16)
    .padStart(2, "0")}`;

const tabular = { fontVariantNumeric: "tabular-nums" };

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  icon,
  title,
  description,
  count,
  collapsible = false,
  opened = true,
  onToggle,
}) {
  return (
    <Box
      style={{
        textAlign: "center",
        marginBottom: 28,
        cursor: collapsible ? "pointer" : "default",
      }}
      onClick={collapsible ? onToggle : undefined}
    >
      <Group justify="center" align="center" gap={12}>
        <Box
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            display: "grid",
            placeItems: "center",
            color: GOLD_LIGHT,
            background: hexA(GOLD, 0.1),
            border: `1px solid ${hexA(GOLD, 0.45)}`,
          }}
        >
          {icon}
        </Box>

        <Box>
          <Group justify="center" align="center" gap={8}>
            <Text fw={800} c={TEXT} style={{ fontSize: 22, letterSpacing: "-0.3px" }}>
              {title}
            </Text>

            <Box
              component="span"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "1px 10px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                lineHeight: "18px",
                color: GOLD_LIGHT,
                background: hexA(GOLD, 0.1),
                border: `1px solid ${hexA(GOLD, 0.45)}`,
                ...tabular,
              }}
            >
              {count}
            </Box>

            {collapsible && (
              <Box
                style={{
                  width: 28,
                  height: 28,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "50%",
                  color: MUTED,
                  border: `1px solid ${LINE_STRONG}`,
                }}
              >
                {opened ? (
                  <IconChevronUp size={15} />
                ) : (
                  <IconChevronDown size={15} />
                )}
              </Box>
            )}
          </Group>

          <Text size="xs" mt={4} c={MUTED} fw={500}>
            {description}
          </Text>
        </Box>
      </Group>

      <Box
        style={{
          width: 55,
          height: 2,
          margin: "14px auto 0",
          borderRadius: 10,
          background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`,
          opacity: 0.8,
        }}
      />
    </Box>
  );
}

/* =========================================================
   MODULE CARD
   لون الوحدة يظهر كتكحيلة (زاوية + حد جانبي) فقط، مثل لون المنطقة
========================================================= */

function ModuleCard({
  href,
  title,
  description,
  footer,
  icon,
  color,
}) {
  return (
    <Link
      href={href}
      style={{
        textDecoration: "none",
        color: "inherit",
        display: "block",
        height: "100%",
      }}
    >
      <Box
        className="module-card"
        style={{
          position: "relative",
          minHeight: 235,
          padding: 22,
          borderRadius: 20,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          fontFamily: FONT,
          background: `radial-gradient(55% 60% at 100% 0%, ${hexA(
            color,
            0.3
          )} 0%, transparent 70%), ${SURFACE_2}`,
          border: `1px solid ${LINE}`,
          borderInlineStart: `3px solid ${color}`,
        }}
      >
        <Group justify="space-between" align="flex-start">
          <Box
            style={{
              width: 52,
              height: 52,
              display: "grid",
              placeItems: "center",
              borderRadius: 16,
              color: GOLD_LIGHT,
              background: hexA(GOLD, 0.1),
              border: `1px solid ${hexA(GOLD, 0.45)}`,
            }}
          >
            {icon}
          </Box>

          <Box
            className="card-arrow"
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              fontSize: 12,
              fontWeight: 800,
              color: FAINT,
              border: `1px solid ${LINE}`,
            }}
          >
            ↗
          </Box>
        </Group>

        <Box mt={26}>
          <Text fw={700} c={TEXT} style={{ fontSize: 18, lineHeight: 1.3 }}>
            {title}
          </Text>

          <Text size="sm" mt={8} lh={1.65} c={MUTED}>
            {description}
          </Text>
        </Box>

        <Text size="xs" fw={700} mt="auto" pt={18} style={{ color: GOLD_LIGHT }}>
          {footer}
          <span style={{ marginInlineStart: 5 }}>→</span>
        </Text>
      </Box>
    </Link>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function Page() {
  const { data: session, status } = useSession();

  // الأقسام القابلة للطي اللي المستخدم طواها
  const [collapsed, setCollapsed] = useState({});

  /* PERMISSIONS */

  const permissions = session?.user?.permissions || [];

  const can = (permission) => hasPermission(permissions, permission);

  /* LOGOUT */

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/" });
  };

  /* LOADING */

  if (status === "loading") {
    return (
      <Box
        dir="rtl"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: SURFACE,
          fontFamily: FONT,
        }}
      >
        <Box style={{ textAlign: "center" }}>
          <Box
            mx="auto"
            style={{
              width: 55,
              height: 55,
              display: "grid",
              placeItems: "center",
              borderRadius: 17,
              color: GOLD_LIGHT,
              background: hexA(GOLD, 0.1),
              border: `1px solid ${hexA(GOLD, 0.45)}`,
            }}
          >
            <IconRefresh size={26} className="loading-icon" />
          </Box>

          <Text mt={12} size="sm" fw={700} c={MUTED}>
            جاري التحميل...
          </Text>
        </Box>

        <style>{`
          .loading-icon { animation: spin 1s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </Box>
    );
  }

  /* VISIBLE SECTIONS  (من modules.ts حسب صلاحيات المستخدم) */

  const visibleSections = SECTIONS.map((section) => ({
    section,
    modules: MODULES.filter((m) => m.section === section.key && can(m.key)),
  })).filter((s) => s.modules.length > 0);

  /* =======================================================
     RETURN
  ======================================================= */

  return (
    <Box
      dir="rtl"
      style={{
        minHeight: "100vh",
        color: TEXT,
        fontFamily: FONT,
        background: `radial-gradient(45% 35% at 0% 100%, ${hexA(
          "#74A7FF",
          0.14
        )} 0%, transparent 70%), ${SURFACE}`,
      }}
    >
      {/* ===================================================
          GLASS NAVBAR
      =================================================== */}

      <Box className="glass-nav-wrap">
        <Box className="glass-nav">
          {/* USER (right in RTL) */}
          <Group gap={10} wrap="nowrap" className="glass-nav-user">
            <Box
              style={{
                width: 38,
                height: 38,
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                borderRadius: "50%",
                color: INK,
                fontWeight: 800,
                fontSize: 15,
                background: `linear-gradient(145deg, ${GOLD_LIGHT}, ${GOLD})`,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,.6)",
              }}
            >
              {(session?.user?.name || "?").trim().charAt(0)}
            </Box>

            {session?.user?.name && (
              <Box style={{ minWidth: 0 }}>
                <Text size="sm" fw={700} c={TEXT} truncate>
                  {session.user.name}
                </Text>

                <Text size="10px" c={MUTED} fw={500} truncate>
                  {session.user.role}
                </Text>
              </Box>
            )}
          </Group>

          {/* BRAND (center) */}
          <Box
            dir="ltr"
            style={{
              display: "inline-flex",
              alignItems: "baseline",
              gap: 5,
              justifySelf: "center",
            }}
          >
            <Text
              component="span"
              className={bungee.className}
              style={{
                fontSize: 24,
                lineHeight: 1,
                background:
                  "linear-gradient(110deg, #1864ab 0%, #228be6 40%, #15aabf 75%, #12b886 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Matrix
            </Text>

            <Text
              component="span"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: "-1px",
                color: TEXT,
                lineHeight: 1,
              }}
            >
              Ops
            </Text>
          </Box>

          {/* LOGOUT (left in RTL) */}
          <Box style={{ justifySelf: "end" }}>
            <button
              type="button"
              className="glass-logout"
              onClick={handleLogout}
              aria-label="تسجيل الخروج"
            >
              <IconLogout size={16} />
              <span className="glass-logout-label">تسجيل الخروج</span>
            </button>
          </Box>
        </Box>
      </Box>

      {/* ===================================================
          MAIN
      =================================================== */}

      <Container dir="ltr" size={1150} pt={40} pb={45}>
        {visibleSections.map(({ section , modules }, index) => {
          const SectionIcon = ICONS[section.icon];
          const isLast = index === visibleSections.length - 1;
          const opened = !collapsed[section.key];

          return (
            <Box key={section.key}>
              {index > 0 && <Divider mb={60} color={LINE} />}

              <Box
                dir={section.dir}
                className="dashboard-section"
                mb={isLast ? 20 : 60}
              >
                <SectionHeader
                  icon={<SectionIcon size={27} stroke={1.6} />}
                  title={section.title}
                  description={section.description}
                  count={modules.length}
                  collapsible={section.collapsible}
                  opened={opened}
                  onToggle={() =>
                    setCollapsed((prev) => ({
                      ...prev,
                      [section.key]: !prev[section.key],
                    }))
                  }
                />

                {opened && (
                  <SimpleGrid cols={section.cols} spacing="lg">
                    {modules.map((m) => {
                      const Icon = ICONS[m.icon];

                      return (
                        <ModuleCard
                          key={m.key}
                          href={m.href}
                          title={m.title}
                          description={m.description}
                          footer={m.footer}
                          icon={<Icon size={28} stroke={1.6} />}
                          color={m.color}
                        />
                      );
                    })}
                  </SimpleGrid>
                )}
              </Box>
            </Box>
          );
        })}
      </Container>

      {/* FOOTER */}

      <Box style={{ textAlign: "center", paddingBottom: 30 }}>
        <Text size="xs" c={FAINT}>
          Ops Matrix · Operations Intelligence
        </Text>
      </Box>

      {/* =====================================================
          CSS
      ===================================================== */}

      <style>{`
        /* ================================================
           LIQUID GLASS NAVBAR
        ================================================ */

        .glass-nav-wrap {
          position: sticky;
          top: 0;
          z-index: 100;
          padding: 14px 16px 0;
        }

        .glass-nav {
          position: relative;
          max-width: 1150px;
          margin: 0 auto;
          padding: 9px 14px;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 12px;
          border-radius: 999px;
          overflow: hidden;

          background: rgba(255,255,255,.04);
          -webkit-backdrop-filter: blur(14px) saturate(160%);
          backdrop-filter: blur(14px) saturate(160%);
          border: 1px solid rgba(255,255,255,.16);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.30),
            inset 0 -1px 0 rgba(255,255,255,.05),
            0 10px 28px -14px rgba(10,20,45,.5);
        }

        /* specular highlight */
        .glass-nav::before {
          content: "";
          position: absolute;
          inset: 0 0 55% 0;
          border-radius: inherit;
          background: linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,0));
          pointer-events: none;
        }

        .glass-nav > * { position: relative; }

        .glass-logout {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 14px;
          border-radius: 999px;
          cursor: pointer;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          color: ${TEXT};
          background: rgba(255,255,255,.10);
          border: 1px solid rgba(255,255,255,.28);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.35);
          transition: background .18s ease, border-color .18s ease;
        }

        .glass-logout:hover {
          background: rgba(255,255,255,.20);
          border-color: ${hexA(GOLD, 0.6)};
        }

        .glass-logout:focus-visible {
          outline: 2px solid ${GOLD_LIGHT};
          outline-offset: 2px;
        }

        @media (max-width: 576px) {
          .glass-logout-label { display: none; }
          .glass-logout { padding: 9px; }
          .glass-nav { padding: 8px 10px; }
        }

        .module-card {
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
        }

        .module-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 32px -16px rgba(10,20,45,.6);
          border-color: ${hexA(GOLD, 0.5)} !important;
        }

        .module-card:hover .card-arrow {
          color: ${GOLD_LIGHT};
          border-color: ${hexA(GOLD, 0.5)};
        }

        .module-card:focus-visible {
          outline: 2px solid ${GOLD_LIGHT};
          outline-offset: 2px;
        }

        .dashboard-section {
          animation: sectionIn 420ms ease both;
        }

        @keyframes sectionIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 576px) {
          .module-card {
            min-height: 215px !important;
            padding: 20px !important;
            border-radius: 18px !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .module-card,
          .dashboard-section {
            animation: none !important;
            transition: none !important;
          }

          .module-card:hover {
            transform: none !important;
          }
        }
      `}</style>
    </Box>
  );
}
