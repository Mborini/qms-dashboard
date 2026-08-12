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

import {
  IconChartBar,
  IconMap,
  IconArrowUpRight,
} from "@tabler/icons-react";

export default function Page() {
  return (
    <Box
      dir="rtl"
      style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",

        /*
         * خلفية الصفحة
         * تم تخفيف اللون الغامق بشكل كبير
         */
        backgroundImage: `
          linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.28),
            rgba(255, 255, 255, 0.12)
          ),
          url("/images/failures-bg.jpg")
        `,

        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* =====================================================
          BACKGROUND SOFT OVERLAY
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

          background:
            "rgba(34, 139, 230, 0.16)",

          filter: "blur(110px)",

          top: -180,
          right: -150,

          pointerEvents: "none",
        }}
      />

      {/* =====================================================
          TEAL GLOW
      ===================================================== */}

      <Box
        style={{
          position: "absolute",

          width: 450,
          height: 450,

          borderRadius: "50%",

          background:
            "rgba(18, 184, 134, 0.13)",

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
        size="lg"
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

            maxWidth: 900,
          }}
        >
          {/* =================================================
              HEADER
          ================================================= */}

          <Box
            style={{
              textAlign: "center",

              marginBottom: 35,
            }}
          >
            <Text
              size="xs"
              fw={800}
              style={{
                color: "rgba(20, 40, 60, 0.65)",

                letterSpacing: 2,

                marginBottom: 10,
              }}
            >
              AVTR • OPERATIONS
            </Text>

            <Text
              fw={900}
              style={{
                color: "#172b3a",

                fontSize:
                  "clamp(28px, 5vw, 46px)",

                lineHeight: 1.15,

                textShadow:
                  "0 3px 15px rgba(255,255,255,0.5)",
              }}
            >
              لوحة المخالفات
            </Text>

            <Text
              size="sm"
              mt={10}
              style={{
                color:
                  "rgba(30, 50, 65, 0.72)",
              }}
            >
              مركز موحد لمتابعة وتحليل المخالفات
            </Text>
          </Box>

          {/* =================================================
              CARDS
          ================================================= */}

          <SimpleGrid
            cols={{
              base: 1,
              sm: 2,
            }}
            spacing="lg"
          >
            {/* ===============================================
                STATISTICS
            =============================================== */}

            <Link
              href="/failures/stats"
              style={{
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <Box
                className="glass-card"
                style={{
                  position: "relative",

                  minHeight: 260,

                  padding: 28,

                  borderRadius: 24,

                  /*
                   * Glass
                   */

                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.68), rgba(255,255,255,0.36))",

                  border:
                    "1px solid rgba(255,255,255,0.72)",

                  backdropFilter:
                    "blur(18px)",

                  WebkitBackdropFilter:
                    "blur(18px)",

                  boxShadow:
                    "0 20px 60px rgba(40,70,90,0.16)",

                  overflow: "hidden",

                  transition:
                    "all 220ms ease",
                }}
              >
                {/* Card Glow */}

                <Box
                  style={{
                    position: "absolute",

                    width: 190,
                    height: 190,

                    borderRadius: "50%",

                    background:
                      "rgba(34,139,230,0.15)",

                    filter: "blur(45px)",

                    top: -80,
                    right: -70,

                    pointerEvents: "none",
                  }}
                />

                {/* =========================================
                    TOP
                ========================================= */}

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
                    color="blue"
                    style={{
                      background:
                        "rgba(255,255,255,0.48)",

                      border:
                        "1px solid rgba(255,255,255,0.65)",

                      color: "#228be6",

                      boxShadow:
                        "0 8px 25px rgba(34,139,230,0.10)",
                    }}
                  >
                    <IconChartBar
                      size={32}
                      stroke={1.7}
                    />
                  </ThemeIcon>

                  <Box
                    style={{
                      width: 38,
                      height: 38,

                      borderRadius: "50%",

                      display: "flex",

                      alignItems: "center",

                      justifyContent: "center",

                      background:
                        "rgba(255,255,255,0.45)",

                      border:
                        "1px solid rgba(255,255,255,0.55)",

                      color:
                        "rgba(30,60,80,0.65)",
                    }}
                  >
                    <IconArrowUpRight
                      size={19}
                    />
                  </Box>
                </Group>

                {/* =========================================
                    CONTENT
                ========================================= */}

                <Box
                  mt={55}
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
                    الإحصائيات
                  </Text>

                  <Text
                    size="sm"
                    mt={8}
                    lh={1.7}
                    style={{
                      color:
                        "rgba(30,55,70,0.68)",

                      maxWidth: 330,
                    }}
                  >
                    تحليل شامل للمخالفات
                    وعرض المؤشرات والإحصائيات
                    حسب المناطق والحالات و
                    KPIs.
                  </Text>
                </Box>

                {/* =========================================
                    LINK
                ========================================= */}

                <Text
                  size="xs"
                  fw={800}
                  mt={18}
                  style={{
                    position: "relative",

                    zIndex: 2,

                    color: "#1971c2",
                  }}
                >
                  فتح الإحصائيات ←
                </Text>
              </Box>
            </Link>

            {/* ===============================================
                MAP
            =============================================== */}

            <Link
              href="/failures/osm"
              style={{
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <Box
                className="glass-card"
                style={{
                  position: "relative",

                  minHeight: 260,

                  padding: 28,

                  borderRadius: 24,

                  /*
                   * Glass
                   */

                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.68), rgba(255,255,255,0.36))",

                  border:
                    "1px solid rgba(255,255,255,0.72)",

                  backdropFilter:
                    "blur(18px)",

                  WebkitBackdropFilter:
                    "blur(18px)",

                  boxShadow:
                    "0 20px 60px rgba(40,70,90,0.16)",

                  overflow: "hidden",

                  transition:
                    "all 220ms ease",
                }}
              >
                {/* Card Glow */}

                <Box
                  style={{
                    position: "absolute",

                    width: 190,
                    height: 190,

                    borderRadius: "50%",

                    background:
                      "rgba(18,184,134,0.15)",

                    filter: "blur(45px)",

                    top: -80,
                    right: -70,

                    pointerEvents: "none",
                  }}
                />

                {/* =========================================
                    TOP
                ========================================= */}

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
                    color="teal"
                    style={{
                      background:
                        "rgba(255,255,255,0.48)",

                      border:
                        "1px solid rgba(255,255,255,0.65)",

                      color: "#12b886",

                      boxShadow:
                        "0 8px 25px rgba(18,184,134,0.10)",
                    }}
                  >
                    <IconMap
                      size={32}
                      stroke={1.7}
                    />
                  </ThemeIcon>

                  <Box
                    style={{
                      width: 38,
                      height: 38,

                      borderRadius: "50%",

                      display: "flex",

                      alignItems: "center",

                      justifyContent: "center",

                      background:
                        "rgba(255,255,255,0.45)",

                      border:
                        "1px solid rgba(255,255,255,0.55)",

                      color:
                        "rgba(30,60,80,0.65)",
                    }}
                  >
                    <IconArrowUpRight
                      size={19}
                    />
                  </Box>
                </Group>

                {/* =========================================
                    CONTENT
                ========================================= */}

                <Box
                  mt={55}
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
                    الخريطة
                  </Text>

                  <Text
                    size="sm"
                    mt={8}
                    lh={1.7}
                    style={{
                      color:
                        "rgba(30,55,70,0.68)",

                      maxWidth: 330,
                    }}
                  >
                    استعراض مواقع المخالفات
                    جغرافياً مع إمكانية التصفية
                    وعرض النقاط والخريطة الحرارية.
                  </Text>
                </Box>

                {/* =========================================
                    LINK
                ========================================= */}

                <Text
                  size="xs"
                  fw={800}
                  mt={18}
                  style={{
                    position: "relative",

                    zIndex: 2,

                    color: "#099268",
                  }}
                >
                  فتح الخريطة ←
                </Text>
              </Box>
            </Link>
          </SimpleGrid>
        </Box>
      </Container>

      {/* =====================================================
          HOVER STYLE
      ===================================================== */}

      <style jsx>{`
        .glass-card:hover {
          transform: translateY(-7px) scale(1.015);

          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.82),
            rgba(255, 255, 255, 0.48)
          ) !important;

          border-color: rgba(
            255,
            255,
            255,
            0.95
          ) !important;

          box-shadow:
            0 28px 80px rgba(40, 70, 90, 0.22),
            inset 0 1px 0
              rgba(255, 255, 255, 0.8);
        }

        .glass-card:active {
          transform:
            translateY(-3px)
            scale(1.005);
        }

        @media (max-width: 576px) {
          .glass-card {
            min-height: 230px !important;

            padding: 22px !important;

            border-radius: 20px !important;
          }
        }
      `}</style>
    </Box>
  );
}