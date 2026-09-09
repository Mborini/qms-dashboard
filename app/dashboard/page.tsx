
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
  Badge,
  Button,
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
} from "@tabler/icons-react";

import { bungee } from "../layout";
import { hasPermission } from "../lib/permissions";

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  icon,
  title,
  description,
  color,
  count,
  collapsible = false,
  opened = true,
  onToggle,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  color: string;
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

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            background: `${color}0d`,
            border: `1px solid ${color}18`,

            color,
          }}
        >
          {icon}
        </Box>

        <Box>
          <Group justify="center" align="center" gap={8}>
            <Text
              fw={850}
              style={{
                fontSize: 23,
                color: "#243746",
                letterSpacing: "-0.4px",
              }}
            >
              {title}
            </Text>

            <Badge
              size="sm"
              radius="xl"
              variant="light"
              style={{
                background: `${color}0d`,
                color,
                fontWeight: 800,
              }}
            >
              {count}
            </Badge>

            {collapsible && (
              <ThemeIcon
                size={28}
                radius="xl"
                variant="light"
                color="gray"
              >
                {opened ? (
                  <IconChevronUp size={15} />
                ) : (
                  <IconChevronDown size={15} />
                )}
              </ThemeIcon>
            )}
          </Group>

          <Text
            size="xs"
            mt={4}
            style={{
              color: "#82909a",
              fontWeight: 500,
            }}
          >
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
          background: color,
          opacity: 0.55,
        }}
      />
    </Box>
  );
}

/* =========================================================
   MODULE CARD
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

          minHeight: 245,

          padding: 24,

          borderRadius: 20,

          background: "rgba(255,255,255,0.78)",

          border: "1px solid rgba(35,55,70,0.07)",

          boxShadow: "0 8px 30px rgba(35,55,70,0.055)",

          overflow: "hidden",

          transition: "all 180ms ease",

          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* TOP ACCENT */}

        <Box
          className="card-accent"
          style={{
            position: "absolute",

            top: 0,
            left: 0,
            right: 0,

            height: 3,

            background: color,

            opacity: 0.75,

            transform: "scaleX(0.35)",

            transformOrigin: "center",

            transition: "transform 180ms ease",
          }}
        />

        {/* ICON */}

        <Group justify="space-between" align="flex-start">
          <ThemeIcon
            size={56}
            radius={17}
            variant="light"
            style={{
              background: `${color}0d`,
              color,
              border: `1px solid ${color}14`,
            }}
          >
            {icon}
          </ThemeIcon>

          <Box
            className="card-number"
            style={{
              width: 30,
              height: 30,

              borderRadius: "50%",

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              background: "rgba(35,55,70,0.035)",

              color: "#a0abb2",

              fontSize: 12,
              fontWeight: 800,
            }}
          >
            ↗
          </Box>
        </Group>

        {/* CONTENT */}

        <Box mt={30}>
          <Text
            fw={850}
            style={{
              color: "#263a49",
              fontSize: 18,
              letterSpacing: "-0.2px",
            }}
          >
            {title}
          </Text>

          <Text
            size="sm"
            mt={8}
            lh={1.65}
            style={{
              color: "#87949d",
            }}
          >
            {description}
          </Text>
        </Box>

        {/* FOOTER */}

        <Text
          size="xs"
          fw={800}
          mt="auto"
          pt={20}
          style={{
            color,
          }}
        >
          {footer}

          <span
            style={{
              marginRight: 5,
            }}
          >
            →
          </span>
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

  /* =======================================================
     PERMISSIONS
  ======================================================= */

  const permissions = session?.user?.permissions  || [];

  const can = (permission: string) => {
    return hasPermission(permissions, permission);
  };

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = async () => {
    await signOut({
      redirect: true,
      callbackUrl: "/",
    });
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (status === "loading") {
    return (
      <Box
        dir="rtl"
        style={{
          minHeight: "100vh",

          display: "flex",
          alignItems: "center",
          justifyContent: "center",

          background: "#f7f9fb",
        }}
      >
        <Box
          style={{
            textAlign: "center",
          }}
        >
          <ThemeIcon
            size={55}
            radius={17}
            variant="light"
            color="blue"
            mx="auto"
          >
            <IconRefresh
              size={26}
              className="loading-icon"
            />
          </ThemeIcon>

          <Text
            mt={12}
            size="sm"
            fw={700}
            c="dimmed"
          >
            جاري التحميل...
          </Text>
        </Box>
      </Box>
    );
  }

  /* =======================================================
     VISIBILITY
  ======================================================= */

  /* =======================================================
   PERMISSION GROUPS
======================================================= */

const operationsPermissions = [
  "statistics",
  "map",
  "route_notes",
  "bins",
  "collection_areas",
  "bin_export",
];

const maintenancePermissions = [
  "maintenance",
  "maintenance_history",
  "maintenance_types",
  "vehicles",
];

const adminPermissions = [
  "users",
  "roles",
  "permissions",
];

/* =======================================================
   VISIBILITY
======================================================= */

const showOperations = operationsPermissions.some(can);

const showMaintenance = maintenancePermissions.some(can);

const showAdmin = adminPermissions.some(can);

/* =======================================================
   COUNTS
======================================================= */

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

        background:
          "linear-gradient(135deg, #f8fafc 0%, #f4f7f9 50%, #f8fafb 100%)",

        color: "#263746",
      }}
    >
      {/* ===================================================
          HEADER
      =================================================== */}

      <Container size={1150} pt={25}>
        <Group justify="space-between" align="center">
          {/* USER */}

          <Box>
            {session?.user?.name && (
              <Text
                size="sm"
                fw={800}
                style={{
                  color: "#354957",
                }}
              >
                مرحباً، {session.user.name}
              </Text>
            )}

            <Text
              size="xs"
              mt={2}
              style={{
                color: "#9aa5ac",
              }}
            >
              Operations Intelligence
            </Text>
          </Box>

          {/* LOGOUT */}

          <Button
            variant="subtle"
            color="red"
            radius="xl"
            size="sm"
            leftSection={<IconLogout size={16} />}
            onClick={handleLogout}
          >
            تسجيل الخروج
          </Button>
        </Group>
      </Container>

      {/* ===================================================
          MAIN
      =================================================== */}

      <Container dir="ltr" size={1150} py={45}>
        {/* =================================================
            BRAND
        ================================================= */}

        <Box
          style={{
            textAlign: "center",
            marginBottom: 65,
          }}
        >
          <Box
            style={{
              display: "inline-flex",
              alignItems: "baseline",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Text
              component="span"
              style={{
                fontFamily: "Inter, sans-serif",

                fontSize: "clamp(42px, 5vw, 58px)",

                fontWeight: 600,

                letterSpacing: "-2px",

                color: "#344955",

                lineHeight: 1,
              }}
            >
              Ops
            </Text>

            <Text
              component="span"
              className={bungee.className}
              style={{
                fontSize: "clamp(40px, 4.5vw, 55px)",

                lineHeight: 1,

                background:
                  "linear-gradient(110deg, #1971c2, #228be6, #12b886)",

                WebkitBackgroundClip: "text",

                WebkitTextFillColor: "transparent",

                backgroundClip: "text",
              }}
            >
              Matrix
            </Text>
          </Box>

          <Text
            mt={13}
            size="xs"
            fw={700}
            style={{
              letterSpacing: "2.5px",

              color: "#9aa5ac",

              textTransform: "uppercase",
            }}
          >
            Operations Intelligence
          </Text>

          <Group justify="center" gap={7} mt={14}>
            <Box
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#20c997",
                boxShadow:
                  "0 0 0 4px rgba(32,201,151,0.10)",
              }}
            />

            <Text
              size="xs"
              fw={700}
              style={{
                color: "#8e9ba3",
              }}
            >
              System Online
            </Text>
          </Group>
        </Box>

        {/* =================================================
            OPERATIONS
        ================================================= */}

        {showOperations && (
          <Box className="dashboard-section" mb={60}>
            <SectionHeader
              icon={
                <IconMap2
                  size={27}
                  stroke={1.8}
                />
              }
              title="Operations"
              description="Operational monitoring, field activities and collection"
              color="#228be6"
              count={operationsCount}
            />

            <SimpleGrid
              cols={{
                base: 1,
                sm: 2,
                lg: 3,
              }}
              spacing="lg"
            >
              {/* STATISTICS */}

              {can("statistics") && (
                <ModuleCard
                  href="/failures/stats"
                  title="Violations Statistics"
                  description="Analyze violations, KPIs, areas and operational performance."
                  footer="Open Statistics"
                  icon={<IconChartBar size={28} />}
                  color="#228be6"
                />
              )}

              {/* MAP */}

              {can("map") && (
                <ModuleCard
                  href="/failures/osm"
                  title="Violations Map"
                  description="Explore violations geographically using the interactive map."
                  footer="Open Map"
                  icon={<IconMap size={28} />}
                  color="#f08c00"
                />
              )}

              {/* ROUTE NOTES */}

              {can("route_notes") && (
                <ModuleCard
                  href="/route-notes"
                  title="Route Notes"
                  description="Create, review and manage route notes and field observations."
                  footer="Open Route Notes"
                  icon={<IconRoute size={28} />}
                  color="#7950f2"
                />
              )}

              {/* BIN MAP */}

              {can("bins") && (
                <ModuleCard
                  href="/binCollection/map"
                  title="Collection Map"
                  description="View and manage bin locations directly on the map."
                  footer="Open Collection Map"
                  icon={<IconMapPin size={28} />}
                  color="#12b886"
                />
              )}

              {/* COLLECTION AREAS */}

              {can("collection_areas") && (
                <ModuleCard
                  href="/binCollection/collection-areas/manage"
                  title="Collection Areas"
                  description="Manage collection areas, zones and operational boundaries."
                  footer="Manage Areas"
                  icon={<IconMap2 size={28} />}
                  color="#0ca678"
                />
              )}

              {/* EXPORT BINS */}

              {can("bin_export") && (
                <ModuleCard
                  href="/binCollection/export-bins"
                  title="Export Bins"
                  description="Export bin data and collection information for reporting."
                  footer="Export Data"
                  icon={<IconFileTypeXls size={28} />}
                  color="#2f9e44"
                />
              )}
            </SimpleGrid>
          </Box>
        )}

        {/* =================================================
            DIVIDER
        ================================================= */}

        {showOperations && showMaintenance && (
          <Divider
            mb={60}
            color="rgba(35,55,70,0.06)"
          />
        )}

        {/* =================================================
            MAINTENANCE
        ================================================= */}

        {showMaintenance && (
          <Box className="dashboard-section" mb={60}>
            <SectionHeader
              icon={
                <IconTool
                  size={27}
                  stroke={1.8}
                />
              }
              title="Maintenance"
              description="Vehicle maintenance, records and configuration"
              color="#e03131"
              count={maintenanceCount}
              collapsible
              opened={maintenanceOpen}
              onToggle={() =>
                setMaintenanceOpen((value) => !value)
              }
            />

            {maintenanceOpen && (
              <SimpleGrid
                cols={{
                  base: 1,
                  sm: 2,
                  lg: 4,
                }}
                spacing="lg"
              >
                {/* MANAGEMENT */}

                {can("maintenance") && (
                  <ModuleCard
                    href="/maintenance/management"
                    title="Maintenance Management"
                    description="Manage maintenance tasks, work orders and operational actions."
                    footer="Open Management"
                    icon={<IconTool size={28} />}
                    color="#228be6"
                  />
                )}

                {/* HISTORY */}

                {can("maintenance_history") && (
                  <ModuleCard
                    href="/maintenance/history"
                    title="Maintenance History"
                    description="Review previous maintenance operations and service records."
                    footer="Open History"
                    icon={<IconHistory size={28} />}
                    color="#7950f2"
                  />
                )}

                {/* TYPES */}

                {can("maintenance_types") && (
                  <ModuleCard
                    href="/maintenance/setup"
                    title="Maintenance Types"
                    description="Configure maintenance types and service categories."
                    footer="Open Configuration"
                    icon={<IconSettings size={28} />}
                    color="#12b886"
                  />
                )}

                {/* VEHICLES */}

                {can("vehicles") && (
                  <ModuleCard
                    href="/maintenance/vehicles"
                    title="Maintenance Vehicles"
                    description="Manage vehicles and their maintenance information."
                    footer="Open Vehicles"
                    icon={<IconTruck size={28} />}
                    color="#f08c00"
                  />
                )}
              </SimpleGrid>
            )}
          </Box>
        )}

        {/* =================================================
            DIVIDER
        ================================================= */}

        {showMaintenance && showAdmin && (
          <Divider
            mb={60}
            color="rgba(35,55,70,0.06)"
          />
        )}

        {/* =================================================
            ADMINISTRATION
        ================================================= */}

       {showAdmin && (
  <Box className="dashboard-section" mb={20}>
    <SectionHeader
      icon={
        <IconUsers
          size={27}
          stroke={1.8}
        />
      }
      title="Administration"
      description="Users, roles and system access"
      color="#4c6ef5"
      count={adminCount}
    />

    <SimpleGrid
      cols={{
        base: 1,
        sm: 2,
        lg: 3,
      }}
      spacing="lg"
    >
      {/* USERS */}

      {can("users") && (
        <ModuleCard
          href="admin/users"
          title="User Management"
          description="Create, edit and manage system users and their roles."
          footer="Manage Users"
          icon={<IconUsers size={28} />}
          color="#4c6ef5"
        />
      )}

      {/* ROLES */}

      {can("roles") && (
        <ModuleCard
          href="/admin/roles"
          title="Roles Management"
          description="Create, edit and manage system roles and access levels."
          footer="Manage Roles"
          icon={<IconShield size={28} />}
          color="#7950f2"
        />
      )}

      {/* PERMISSIONS */}

      {can("permissions") && (
        <ModuleCard
          href="/admin/permissions"
          title="Permissions Management"
          description="Assign permissions to roles and control system access."
          footer="Manage Permissions"
          icon={<IconLock size={28} />}
          color="#12b886"
        />
      )}
    </SimpleGrid>
  </Box>
)}
      </Container>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <Box
        style={{
          textAlign: "center",
          paddingBottom: 30,
        }}
      >
        <Text
          size="xs"
          style={{
            color: "#b0b9bf",
          }}
        >
          Ops Matrix · Operations Intelligence
        </Text>
      </Box>

      {/* =====================================================
          CSS
      ===================================================== */}

      <style>{`
        /* ================================================
           CARD HOVER
        ================================================ */

        .module-card:hover {
          transform: translateY(-5px);

          background: rgba(255,255,255,0.96) !important;

          border-color: rgba(35,55,70,0.10) !important;

          box-shadow:
            0 18px 42px
            rgba(35,55,70,0.10) !important;
        }

        .module-card:hover
        .card-accent {
          transform: scaleX(1);
        }

        .module-card:hover
        .card-number {
          background: rgba(35,55,70,0.06);
        }

        /* ================================================
           SECTION ANIMATION
        ================================================ */

        .dashboard-section {
          animation:
            sectionIn
            420ms
            ease
            both;
        }

        @keyframes sectionIn {
          from {
            opacity: 0;

            transform:
              translateY(12px);
          }

          to {
            opacity: 1;

            transform:
              translateY(0);
          }
        }

        /* ================================================
           LOADING
        ================================================ */

        .loading-icon {
          animation:
            spin
            1s
            linear
            infinite;
        }

        @keyframes spin {
          from {
            transform:
              rotate(0deg);
          }

          to {
            transform:
              rotate(360deg);
          }
        }

        /* ================================================
           MOBILE
        ================================================ */

        @media (max-width: 576px) {
          .module-card {
            min-height:
              225px !important;

            padding:
              21px !important;

            border-radius:
              18px !important;
          }
        }

        /* ================================================
           REDUCED MOTION
        ================================================ */

        @media (prefers-reduced-motion: reduce) {
          .module-card,
          .dashboard-section,
          .loading-icon {
            animation:
              none !important;

            transition:
              none !important;
          }

          .module-card:hover {
            transform:
              none !important;
          }
        }
      `}</style>
    </Box>
  );
}

