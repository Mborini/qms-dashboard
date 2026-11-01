"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { signOut, useSession } from "next-auth/react";

import {
  Box,
  Container,
  SimpleGrid,
  Text,
  Group,
  ThemeIcon,
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

/* =========================================================
   DESIGN TOKENS  (نفس ألوان DistrictCard: Navy + Champagne Gold)
========================================================= */

const INK = "#1A2A4A"; // الهيدر
const SURFACE = "#213459"; // خلفية الصفحة
const SURFACE_2 = "#2A4070"; // البطاقات
const SURFACE_3 = "#324D84";
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
const hexA = (hex: string, a: number) =>
  `${hex}${Math.round(a * 255)
    .toString(16)
    .padStart(2, "0")}`;

const tabular = { fontVariantNumeric: "tabular-nums" as const };

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
}: {
  icon: ReactNode;
  title: string;
  description: string;
  count: number;
  collapsible?: boolean;
  opened?: boolean;
  onToggle?: () => void;
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
}: {
  href: string;
  title: string;
  description: string;
  footer: string;
  icon: ReactNode;
  color: string;
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

  const [maintenanceOpen, setMaintenanceOpen] = useState(true);

  /* PERMISSIONS */

  const permissions = session?.user?.permissions || [];

  const can = (permission: string) => hasPermission(permissions, permission);

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

  /* PERMISSION GROUPS */

  const operationsPermissions = [
    "statistics",
    "map",
    "route_notes",
    "bins",
    "collection_areas",
    "bin_export",
    "vehicle_movements_history",
  ];

  const maintenancePermissions = [
    "maintenance",
    "maintenance_history",
    "maintenance_types",
    "vehicles",
  ];

  const adminPermissions = ["users", "roles", "permissions"];

  /* VISIBILITY */

  const showOperations = operationsPermissions.some(can);
  const showMaintenance = maintenancePermissions.some(can);
  const showAdmin = adminPermissions.some(can);

  /* COUNTS */

  const operationsCount = operationsPermissions.filter(can).length;
  const maintenanceCount = maintenancePermissions.filter(can).length;
  const adminCount = adminPermissions.filter(can).length;

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
                background:                   "linear-gradient(110deg, #1864ab 0%, #228be6 40%, #15aabf 75%, #12b886 100%)",

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
        {/* =================================================
            OPERATIONS
        ================================================= */}

        {showOperations && (
          <Box dir="rtl" className="dashboard-section" mb={60}>
            <SectionHeader
              icon={<IconMap2 size={27} stroke={1.6} />}
              title="العمليات"
              description="إدارة العمليات، الملاحظات، المخالفات, الخرائط، المناطق وادارة الحاويات."
              count={operationsCount}
            />

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
              {can("statistics") && (
                <ModuleCard
                  href="/failures/stats"
                  title="احصائيات المخالفات"
                  description="عرض وتحليل احصائيات المخالفات، المؤشرات والبيانات التشغيلية."
                  footer="فتح الاحصائيات"
                  icon={<IconChartBar size={28} stroke={1.6} />}
                  color="#2563EB"
                />
              )}

              {can("statistics") && (
                <ModuleCard
                  href="/DailyReport"
                  title="التقرير اليومي"
                  description="التقرير اليومي، المؤشرات والبيانات التشغيلية."
                  footer="فتح التقرير اليومي"
                  icon={<IconFileText size={28} stroke={1.6} />}
                  color="#2563EB"
                />
              )}

              {can("statistics") && (
                <ModuleCard
                  href="/WBReport"
                  title="تقرير الاوزان اليومي"
                  description="تقرير الاوزان اليومي."
                  footer="فتح تقرير الاوزان"
                  icon={<IconFileText size={28} stroke={1.6} />}
                  color="#2563EB"
                />
              )}

              {can("statistics") && (
                <ModuleCard
                  href="/analyzedWBReport"
                  title="تقرير الاوزان المحلل"
                  description="تقرير الاوزان المحلل."
                  footer="فتح محلل تقرير الاوزان"
                  icon={<IconFileText size={28} stroke={1.6} />}
                  color="#2563EB"
                />
              )}

              {can("vehicle_movements_history") && (
                <ModuleCard
                  href="/vehicle-movements/history"
                  title="سجل حركة المركبات"
                  description="مراجعة وتحليل سجلات حركة المركبات التاريخية والنشاط التشغيلي."
                  footer="فتح سجل الحركة"
                  icon={<IconHistory size={28} stroke={1.6} />}
                  color="#7C3AED"
                />
              )}

              {can("statistics") && (
                <ModuleCard
                  href="/vehicle-movements"
                  title="حركة المركبات"
                  description="مراقبة حركة المركبات، النشاط اليومي وسجلات الحركة التشغيلية."
                  footer="فتح حركة المركبات"
                  icon={<IconArrowsExchange size={28} stroke={1.6} />}
                  color="#DB2777"
                />
              )}

              {can("map") && (
                <ModuleCard
                  href="/failures/osm"
                  title="خرائط المخالفات"
                  description="عرض المخالفات على الخرائط، مراجعة المواقع وتحليل البيانات الجغرافية."
                  footer="فتح الخرائط"
                  icon={<IconMap size={28} stroke={1.6} />}
                  color="#F76707"
                />
              )}

              {can("route_notes") && (
                <ModuleCard
                  href="/route-notes"
                  title="ملاحظات تتبع المركبات"
                  description="عرض وإدارة ملاحظات تتبع المركبات، الملاحظات التشغيلية والمواقع."
                  footer="فتح ملاحظات التتبع"
                  icon={<IconRoute size={28} stroke={1.6} />}
                  color="#FA5252"
                />
              )}

              {can("bins") && (
                <ModuleCard
                  href="/binCollection/map"
                  title="اداة جمع مواقع الحاويات"
                  description="عرض مواقع الحاويات على الخرائط، مراجعة المواقع وتحليل البيانات الجغرافية."
                  footer="فتح خريطة الجمع"
                  icon={<IconMapPin size={28} stroke={1.6} />}
                  color="#FCC419"
                />
              )}

              {can("collection_areas") && (
                <ModuleCard
                  href="/binCollection/collection-areas/manage"
                  title="مناطق الجمع"
                  description="إدارة مناطق الجمع، المناطق والحدود التشغيلية."
                  footer="إدارة المناطق"
                  icon={<IconMap2 size={28} stroke={1.6} />}
                  color="#A1887F"
                />
              )}

              {can("bin_export") && (
                <ModuleCard
                  href="/binCollection/export-bins"
                  title="تصدير بيانات الحاويات"
                  description="تصدير بيانات الحاويات، المواقع والمعلومات التشغيلية."
                  footer="تصدير البيانات"
                  icon={<IconFileTypeXls size={28} stroke={1.6} />}
                  color="#40C057"
                />
              )}
            </SimpleGrid>
          </Box>
        )}

        {showOperations && showMaintenance && (
          <Divider mb={60} color={LINE} />
        )}

        {/* =================================================
            MAINTENANCE
        ================================================= */}

        {showMaintenance && (
          <Box dir="rtl" className="dashboard-section" mb={60}>
            <SectionHeader
              icon={<IconTool size={27} stroke={1.6} />}
              title="الصيانة"
              description="ادخال و اخراج المركبات من والى الصيانة، إدارة أنواع الصيانة والمركبات."
              count={maintenanceCount}
              collapsible
              opened={maintenanceOpen}
              onToggle={() => setMaintenanceOpen((value) => !value)}
            />

            {maintenanceOpen && (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
                {can("maintenance") && (
                  <ModuleCard
                    href="/maintenance/management"
                    title="ادارة الصيانة"
                    description="ادخال و اخراج المركبات من والى الصيانة"
                    footer="فتح إدارة الصيانة"
                    icon={<IconTool size={28} stroke={1.6} />}
                    color="#40C057"
                  />
                )}

                {can("maintenance_history") && (
                  <ModuleCard
                    href="/maintenance/history"
                    title="سجلات الصيانة"
                    description="مشاهدة وتحليل سجلات الصيانة، الأعمال السابقة والتقارير."
                    footer="فتح سجلات الصيانة"
                    icon={<IconHistory size={28} stroke={1.6} />}
                    color="#20C997"
                  />
                )}

                {can("maintenance_types") && (
                  <ModuleCard
                    href="/maintenance/setup"
                    title="انواع الصيانة"
                    description="ادارة أنواع الصيانة، الفئات والإعدادات الخاصة بها."
                    footer="فتح إعدادات الصيانة"
                    icon={<IconSettings size={28} stroke={1.6} />}
                    color="#22B8CF"
                  />
                )}

                {can("vehicles") && (
                  <ModuleCard
                    href="/maintenance/vehicles"
                    title="المركبات"
                    description="إدارة المركبات ومعلوماتها."
                    footer="فتح إدارة المركبات"
                    icon={<IconTruck size={28} stroke={1.6} />}
                    color="#74A7FF"
                  />
                )}
              </SimpleGrid>
            )}
          </Box>
        )}

        {showMaintenance && showAdmin && <Divider mb={60} color={LINE} />}

        {/* =================================================
            ADMINISTRATION
        ================================================= */}

        {showAdmin && (
          <Box className="dashboard-section" mb={20}>
            <SectionHeader
              icon={<IconUsers size={27} stroke={1.6} />}
              title="Administration"
              description="Users, roles and system access"
              count={adminCount}
            />

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
              {can("users") && (
                <ModuleCard
                  href="/admin/users"
                  title="User Management"
                  description="Create, edit and manage system users and their roles."
                  footer="Manage Users"
                  icon={<IconUsers size={28} stroke={1.6} />}
                  color="#228BE6"
                />
              )}

              {can("roles") && (
                <ModuleCard
                  href="/admin/roles"
                  title="Roles Management"
                  description="Create, edit and manage system roles and access levels."
                  footer="Manage Roles"
                  icon={<IconShield size={28} stroke={1.6} />}
                  color="#845EF7"
                />
              )}

              {can("permissions") && (
                <ModuleCard
                  href="/admin/permissions"
                  title="Permissions Management"
                  description="Assign permissions to roles and control system access."
                  footer="Manage Permissions"
                  icon={<IconLock size={28} stroke={1.6} />}
                  color="#F06595"
                />
              )}
            </SimpleGrid>
          </Box>
        )}
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
