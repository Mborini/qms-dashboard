"use client";

import Link from "next/link";

import {
  Box,
  Container,
  SimpleGrid,
  Text,
  Group,
  ThemeIcon,
} from "@mantine/core";
import { useSession } from "next-auth/react";

import {
  IconTools,
  IconHistory,
  IconChartBar,
  IconArrowUpRight,
} from "@tabler/icons-react";

import { bungee } from "../layout";

/* =====================================================
   CARD STYLE
===================================================== */
 
const cardStyle = {
  position: "relative" as const,

  height: 300,
  minHeight: 300,

  padding: 28,

  borderRadius: 24,

  background:
    "linear-gradient(135deg, rgba(255,255,255,0.72), rgba(255,255,255,0.38))",

  border: "1px solid rgba(255,255,255,0.78)",

  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",

  boxShadow: "0 20px 60px rgba(40,70,90,0.15)",

  overflow: "hidden",

  transition: "all 220ms ease",

  display: "flex",
  flexDirection: "column" as const,
};

/* =====================================================
   CARD ARROW
===================================================== */

function CardArrow() {
  return (
    <Box
      style={{
        width: 38,
        height: 38,

        flexShrink: 0,

        borderRadius: "50%",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        background: "rgba(255,255,255,0.48)",

        border: "1px solid rgba(255,255,255,0.62)",

        color: "rgba(30,60,80,0.65)",
      }}
    >
      <IconArrowUpRight size={19} />
    </Box>
  );
}

/* =====================================================
   PAGE
===================================================== */

export default function MaintenancePage() {
    const { data: session, status } = useSession();

  const role = session?.user?.roleId;const cardAccess = {
    maintenance_maneger: [1, 2],
    maintenance_staff: [1,2,5],
  };
  const hasAccess = (card: keyof typeof cardAccess) => {
    return cardAccess[card].includes(role as any);
  };
  return (
    <Box
      dir="rtl"
      style={{
        minHeight: "100vh",

        position: "relative",

        overflow: "hidden",

        backgroundSize: "cover",

        backgroundPosition: "center",

        backgroundAttachment: "fixed",
      }}
    >
      {/* =====================================================
          BACKGROUND OVERLAY
      ===================================================== */}

      <Box
        style={{
          position: "absolute",

          inset: 0,

          background:
            "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04))",

          pointerEvents: "none",
        }}
      />

      {/* =====================================================
          BLUE GLOW
      ===================================================== */}

      <Box
        style={{
          position: "absolute",

          width: 500,
          height: 500,

          borderRadius: "50%",

          background: "rgba(34,139,230,0.15)",

          filter: "blur(110px)",

          top: -180,
          right: -150,

          pointerEvents: "none",
        }}
      />

      {/* =====================================================
          PURPLE GLOW
      ===================================================== */}

      <Box
        style={{
          position: "absolute",

          width: 450,
          height: 450,

          borderRadius: "50%",

          background: "rgba(132,94,247,0.12)",

          filter: "blur(110px)",

          bottom: -180,
          left: -150,

          pointerEvents: "none",
        }}
      />

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <Container
        size="xl"
        style={{
          position: "relative",

          zIndex: 2,

          minHeight: "100vh",

          display: "flex",

          alignItems: "center",

          justifyContent: "center",

          paddingTop: 40,

          paddingBottom: 40,
        }}
      >
        <Box
          style={{
            width: "100%",

            maxWidth: 1250,
          }}
        >
          {/* =================================================
              HEADER
          ================================================= */}

          <Box
            className="ops-header"
            style={{
              textAlign: "center",
              marginBottom: 44,
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
              {/* Ops */}

              <Text
                component="span"
                className="ops-title"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "clamp(52px, 5vw, 64px)",
                  fontWeight: 600,
                  letterSpacing: "-2px",
                  color: "#263746",
                  lineHeight: 1,
                }}
              >
                Ops
              </Text>

              {/* Matrix */}

              <Text
                component="span"
                className={`${bungee.className} matrix-title`}
                style={{
                  fontSize: "clamp(52px, 4.5vw, 60px)",
                  lineHeight: 1,

                  background:
                    "linear-gradient(110deg, #1864ab 0%, #228be6 40%, #15aabf 75%, #12b886 100%)",

                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",

                  display: "inline-block",

                  letterSpacing: "0px",
                }}
              >
                Matrix
              </Text>
            </Box>

            <Text
              mt={16}
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "2.4px",
                textTransform: "uppercase",
                color: "rgba(30,50,65,0.52)",
              }}
            >
              Maintenance Intelligence
            </Text>
          </Box>

          {/* =================================================
              CARDS
          ================================================= */}

          <SimpleGrid
            dir="ltr"
            cols={{
              base: 2,
              sm: 2,
              lg: 4,
            }}
            spacing="lg"
          >
            {/* =================================================
                CARD 1 — MAINTENANCE MANAGEMENT
            ================================================= */}
            {(hasAccess("maintenance_maneger")  ) && (
            <Link
              href="/maintenance/management"
              style={{
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <Box className="glass-card" style={cardStyle}>
                {/* Glow */}

                <Box
                  style={{
                    position: "absolute",
                    width: 200,
                    height: 200,
                    borderRadius: "50%",
                    background: "rgba(34,139,230,0.18)",
                    filter: "blur(48px)",
                    top: -85,
                    right: -75,
                    pointerEvents: "none",
                  }}
                />

                {/* Header */}

                <Group
                  justify="space-between"
                  align="flex-start"
                  style={{
                    position: "relative",
                    zIndex: 2,
                  }}
                >
                  <ThemeIcon
                    size={62}
                    radius={18}
                    variant="light"
                    style={{
                      background: "rgba(34,139,230,0.10)",
                      border: "1px solid rgba(34,139,230,0.18)",
                      color: "#228be6",
                      boxShadow: "0 8px 25px rgba(34,139,230,0.12)",
                    }}
                  >
                    <IconTools size={32} stroke={1.7} />
                  </ThemeIcon>

                  <CardArrow />
                </Group>

                {/* Content */}

                <Box
                  mt={42}
                  style={{
                    position: "relative",
                    zIndex: 2,
                  }}
                >
                  <Text
                    fw={900}
                    size="xl"
                    style={{
                      color: "#172b3a",
                    }}
                  >
                    Maintenance Management
                  </Text>

                  <Text
                    size="sm"
                    mt={8}
                    lh={1.7}
                    style={{
                      color: "rgba(30,55,70,0.68)",
                    }}
                  >
                    Manage vehicle maintenance operations and tasks.
                  </Text>
                </Box>

                {/* Footer */}

                <Text
                  size="xs"
                  fw={800}
                  mt="auto"
                  style={{
                    position: "relative",
                    zIndex: 2,
                    color: "#1971c2",
                  }}
                >
                  Open Management →
                </Text>
              </Box>
            </Link>
)}
            {/* =================================================
                CARD 2 — MAINTENANCE HISTORY
            ================================================= */}
            {(hasAccess("maintenance_maneger") || hasAccess("maintenance_staff") ) && (

            <Link
              href="/maintenance/history"
              style={{
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <Box className="glass-card" style={cardStyle}>
                {/* Glow */}

                <Box
                  style={{
                    position: "absolute",
                    width: 200,
                    height: 200,
                    borderRadius: "50%",
                    background: "rgba(132,94,247,0.18)",
                    filter: "blur(48px)",
                    top: -85,
                    right: -75,
                    pointerEvents: "none",
                  }}
                />

                {/* Header */}

                <Group
                  justify="space-between"
                  align="flex-start"
                  style={{
                    position: "relative",
                    zIndex: 2,
                  }}
                >
                  <ThemeIcon
                    size={62}
                    radius={18}
                    variant="light"
                    style={{
                      background: "rgba(132,94,247,0.10)",
                      border: "1px solid rgba(132,94,247,0.18)",
                      color: "#7950f2",
                      boxShadow: "0 8px 25px rgba(132,94,247,0.12)",
                    }}
                  >
                    <IconHistory size={32} stroke={1.7} />
                  </ThemeIcon>

                  <CardArrow />
                </Group>

                {/* Content */}

                <Box
                  mt={42}
                  style={{
                    position: "relative",
                    zIndex: 2,
                  }}
                >
                  <Text
                    fw={900}
                    size="xl"
                    style={{
                      color: "#172b3a",
                    }}
                  >
                    Maintenance History
                  </Text>

                  <Text
                    size="sm"
                    mt={8}
                    lh={1.7}
                    style={{
                      color: "rgba(30,55,70,0.68)",
                    }}
                  >
                    View and track all previous maintenance records.
                  </Text>
                </Box>

                {/* Footer */}

                <Text
                  size="xs"
                  fw={800}
                  mt="auto"
                  style={{
                    position: "relative",
                    zIndex: 2,
                    color: "#7048e8",
                  }}
                >
                  Open History →
                </Text>
              </Box>
            </Link>
)}
            {/* =================================================
                CARD 3 — MAINTENANCE KPIs
            ================================================= */}
{(hasAccess("maintenance_maneger")  ) && (
            <Link
              href="/maintenance/setup"
              style={{
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <Box className="glass-card" style={cardStyle}>
                {/* Glow */}

                <Box
                  style={{
                    position: "absolute",
                    width: 200,
                    height: 200,
                    borderRadius: "50%",
                    background: "rgba(18,184,134,0.18)",
                    filter: "blur(48px)",
                    top: -85,
                    right: -75,
                    pointerEvents: "none",
                  }}
                />

                {/* Header */}

                <Group
                  justify="space-between"
                  align="flex-start"
                  style={{
                    position: "relative",
                    zIndex: 2,
                  }}
                >
                  <ThemeIcon
                    size={62}
                    radius={18}
                    variant="light"
                    style={{
                      background: "rgba(18,184,134,0.10)",
                      border: "1px solid rgba(18,184,134,0.18)",
                      color: "#0ca678",
                      boxShadow: "0 8px 25px rgba(18,184,134,0.12)",
                    }}
                  >
                    <IconChartBar size={32} stroke={1.7} />
                  </ThemeIcon>

                  <CardArrow />
                </Group>

                {/* Content */}

                <Box
                  mt={42}
                  style={{
                    position: "relative",
                    zIndex: 2,
                  }}
                >
                  <Text
                    fw={900}
                    size="xl"
                    style={{
                      color: "#172b3a",
                    }}
                  >
                    Maintenance Types
                  </Text>

                  <Text
                    size="sm"
                    mt={8}
                    lh={1.7}
                    style={{
                      color: "rgba(30,55,70,0.68)",
                    }}
                  >
                  Manage and monitor maintenance Types.
                  </Text>
                </Box>

                {/* Footer */}

                <Text
                  size="xs"
                  fw={800}
                  mt="auto"
                  style={{
                    position: "relative",
                    zIndex: 2,
                    color: "#087f5b",
                  }}
                >
                  Open Manitenance Types →
                </Text>
              </Box>
            </Link>)}
{(hasAccess("maintenance_maneger")  ) && (
            <Link
              href="/maintenance/vehicles"
              style={{
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <Box className="glass-card" style={cardStyle}>
                {/* Glow */}

                <Box
                  style={{
                    position: "absolute",
                    width: 200,
                    height: 200,
                    borderRadius: "50%",
                    background: "rgba(18,184,134,0.18)",
                    filter: "blur(48px)",
                    top: -85,
                    right: -75,
                    pointerEvents: "none",
                  }}
                />

                {/* Header */}

                <Group
                  justify="space-between"
                  align="flex-start"
                  style={{
                    position: "relative",
                    zIndex: 2,
                  }}
                >
                  <ThemeIcon
                    size={62}
                    radius={18}
                    variant="light"
                    style={{
                      background: "rgba(18,184,134,0.10)",
                      border: "1px solid rgba(18,184,134,0.18)",
                      color: "#0ca678",
                      boxShadow: "0 8px 25px rgba(18,184,134,0.12)",
                    }}
                  >
                    <IconChartBar size={32} stroke={1.7} />
                  </ThemeIcon>

                  <CardArrow />
                </Group>

                {/* Content */}

                <Box
                  mt={42}
                  style={{
                    position: "relative",
                    zIndex: 2,
                  }}
                >
                  <Text
                    fw={900}
                    size="xl"
                    style={{
                      color: "#172b3a",
                    }}
                  >
                    Maintenance Vehicles
                  </Text>

                  <Text
                    size="sm"
                    mt={8}
                    lh={1.7}
                    style={{
                      color: "rgba(30,55,70,0.68)",
                    }}
                  >
                    Manage vehicle maintenance.
                  </Text>
                </Box>

                {/* Footer */}

                <Text
                  size="xs"
                  fw={800}
                  mt="auto"
                  style={{
                    position: "relative",
                    zIndex: 2,
                    color: "#087f5b",
                  }}
                >
                  Open Vehicles List →
                </Text>
              </Box>
            </Link>)}
          </SimpleGrid>
        </Box>
      </Container>

      {/* =====================================================
          HOVER
      ===================================================== */}

      <style>{`
        .glass-card {
          transform: translateY(0) scale(1);
        }

        .glass-card:hover {
          transform:
            translateY(-7px)
            scale(1.015);

          background:
            linear-gradient(
              135deg,
              rgba(255,255,255,0.84),
              rgba(255,255,255,0.50)
            ) !important;

          border-color:
            rgba(255,255,255,0.96) !important;

          box-shadow:
            0 28px 80px
              rgba(40,70,90,0.22),
            inset 0 1px 0
              rgba(255,255,255,0.85);
        }

        .glass-card:active {
          transform:
            translateY(-3px)
            scale(1.005);
        }

        @media (max-width: 576px) {
          .ops-title {
            font-size: 42px !important;
          }

          .matrix-title {
            font-size: 40px !important;
          }

          .glass-card {
            height: 280px !important;
            min-height: 280px !important;
            padding: 22px !important;
            border-radius: 20px !important;
          }

          .ops-header {
            margin-top: 70px !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .glass-card {
            transition: none !important;
          }

          .glass-card:hover {
            transform: none !important;
          }
        }
      `}</style>
    </Box>
  );
}