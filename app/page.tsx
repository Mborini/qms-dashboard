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
  IconRoute,
} from "@tabler/icons-react";

const cardStyle = {
  position: "relative" as const,

  height: 300,
  minHeight: 300,

  padding: 28,

  borderRadius: 24,

  background:
    "linear-gradient(135deg, rgba(255,255,255,0.72), rgba(255,255,255,0.38))",

  border:
    "1px solid rgba(255,255,255,0.78)",

  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",

  boxShadow:
    "0 20px 60px rgba(40,70,90,0.15)",

  overflow: "hidden",

  transition: "all 220ms ease",

  display: "flex",
  flexDirection: "column" as const,
};

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

        background:
          "rgba(255,255,255,0.48)",

        border:
          "1px solid rgba(255,255,255,0.62)",

        color:
          "rgba(30,60,80,0.65)",
      }}
    >
      <IconArrowUpRight size={19} />
    </Box>
  );
}

export default function Page() {
  return (
    <Box
      dir="rtl"
      style={{
        minHeight: "100vh",

        position: "relative",

        overflow: "hidden",

        backgroundImage: `
          linear-gradient(
            135deg,
            rgba(255,255,255,0.28),
            rgba(255,255,255,0.12)
          ),
          url("/images/failures-bg.jpg")
        `,

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
          BLUE BACKGROUND GLOW
      ===================================================== */}

      <Box
        style={{
          position: "absolute",

          width: 500,
          height: 500,

          borderRadius: "50%",

          background:
            "rgba(34,139,230,0.15)",

          filter: "blur(110px)",

          top: -180,
          right: -150,

          pointerEvents: "none",
        }}
      />

      {/* =====================================================
          PURPLE BACKGROUND GLOW
      ===================================================== */}

      <Box
        style={{
          position: "absolute",

          width: 450,
          height: 450,

          borderRadius: "50%",

          background:
            "rgba(132,94,247,0.12)",

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
            style={{
              textAlign: "center",

              marginBottom: 38,
            }}
          >
            <Text
              size="xs"
              fw={800}
              style={{
                color:
                  "rgba(20,40,60,0.65)",

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
                  "clamp(28px,5vw,46px)",

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
                  "rgba(30,50,65,0.72)",
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
              lg: 3,
            }}
            spacing="lg"
          >
            {/* =================================================
                STATISTICS — BLUE
            ================================================= */}

            <Link
              href="/failures/stats"
              style={{
                textDecoration: "none",

                color: "inherit",
              }}
            >
              <Box
                className="glass-card"
                style={cardStyle}
              >
                {/* Blue Glow */}

                <Box
                  style={{
                    position: "absolute",

                    width: 200,
                    height: 200,

                    borderRadius: "50%",

                    background:
                      "rgba(34,139,230,0.18)",

                    filter: "blur(48px)",

                    top: -85,
                    right: -75,

                    pointerEvents: "none",
                  }}
                />

                {/* Top */}

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
                      background:
                        "rgba(34,139,230,0.10)",

                      border:
                        "1px solid rgba(34,139,230,0.18)",

                      color: "#228be6",

                      boxShadow:
                        "0 8px 25px rgba(34,139,230,0.12)",
                    }}
                  >
                    <IconChartBar
                      size={32}
                      stroke={1.7}
                    />
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
                    الإحصائيات
                  </Text>

                  <Text
                    size="sm"
                    mt={8}
                    lh={1.7}
                    style={{
                      color:
                        "rgba(30,55,70,0.68)",
                    }}
                  >
                    تحليل شامل للمخالفات ومتابعة
                    المؤشرات حسب المناطق والحالات
                    و KPIs.
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
                  فتح الإحصائيات ←
                </Text>
              </Box>
            </Link>

            {/* =================================================
                ROUTE NOTES — PURPLE
            ================================================= */}

            <Link
              href="/route-notes"
              style={{
                textDecoration: "none",

                color: "inherit",
              }}
            >
              <Box
                className="glass-card"
                style={cardStyle}
              >
                {/* Purple Glow */}

                <Box
                  style={{
                    position: "absolute",

                    width: 200,
                    height: 200,

                    borderRadius: "50%",

                    background:
                      "rgba(132,94,247,0.18)",

                    filter: "blur(48px)",

                    top: -85,
                    right: -75,

                    pointerEvents: "none",
                  }}
                />

                {/* Top */}

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
                      background:
                        "rgba(132,94,247,0.10)",

                      border:
                        "1px solid rgba(132,94,247,0.18)",

                      color: "#7950f2",

                      boxShadow:
                        "0 8px 25px rgba(132,94,247,0.12)",
                    }}
                  >
                    <IconRoute
                      size={32}
                      stroke={1.7}
                    />
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
                    ملاحظات التتبع
                  </Text>

                  <Text
                    size="sm"
                    mt={8}
                    lh={1.7}
                    style={{
                      color:
                        "rgba(30,55,70,0.68)",
                    }}
                  >
                    إنشاء ملاحظات التتبع الخاصة
                    بالمسارات والآليات، وتنظيمها
                    ومتابعتها بسهولة.
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
                  فتح ملاحظات التتبع ←
                </Text>
              </Box>
            </Link>

            {/* =================================================
                MAP — ORANGE
            ================================================= */}

            <Link
              href="/failures/osm"
              style={{
                textDecoration: "none",

                color: "inherit",
              }}
            >
              <Box
                className="glass-card"
                style={cardStyle}
              >
                {/* Orange Glow */}

                <Box
                  style={{
                    position: "absolute",

                    width: 200,
                    height: 200,

                    borderRadius: "50%",

                    background:
                      "rgba(253,126,20,0.18)",

                    filter: "blur(48px)",

                    top: -85,
                    right: -75,

                    pointerEvents: "none",
                  }}
                />

                {/* Top */}

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
                      background:
                        "rgba(253,126,20,0.10)",

                      border:
                        "1px solid rgba(253,126,20,0.18)",

                      color: "#f76707",

                      boxShadow:
                        "0 8px 25px rgba(253,126,20,0.12)",
                    }}
                  >
                    <IconMap
                      size={32}
                      stroke={1.7}
                    />
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
                    الخريطة
                  </Text>

                  <Text
                    size="sm"
                    mt={8}
                    lh={1.7}
                    style={{
                      color:
                        "rgba(30,55,70,0.68)",
                    }}
                  >
                    استعراض مواقع المخالفات على
                    الخريطة مع أدوات التصفية
                    والخريطة الحرارية.
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

                    color: "#e8590c",
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
          .glass-card {
            height: 280px !important;
            min-height: 280px !important;

            padding: 22px !important;

            border-radius: 20px !important;
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