"use client"
import Link from "next/link";

import {
  Box,
  Container,
  SimpleGrid,
  Text,
  Group,
  ThemeIcon,
  Badge,
  Button,
  PasswordInput,
  Modal,
} from "@mantine/core";

import {
  IconChartBar,
  IconMap,
  IconArrowUpRight,
  IconRoute,
  IconTrash,
  IconMapPin,
  IconFileTypeXls,
  IconMap2,
} from "@tabler/icons-react";
import { bungee } from "./layout";
import { useState } from "react";

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

export default function Page() {
  const [passwordModalOpened, setPasswordModalOpened] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pendingLink, setPendingLink] = useState("");

  const openProtectedLink = (link: string) => {
    setPendingLink(link);
    setPassword("");
    setPasswordError("");
    setPasswordModalOpened(true);
  };

  const handlePasswordSubmit = () => {
    if (password === "271998") {
      window.location.href = pendingLink;
      return;
    }

    setPasswordError("كلمة المرور غير صحيحة");
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
          BLUE BACKGROUND GLOW
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
          PURPLE BACKGROUND GLOW
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

          paddingTop: 0,

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
        fontSize: "clamp(100px, 5vw, 56px)",
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
        fontSize: "clamp(150px, 4.5vw, 52px)",
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
    Operations Intelligence
  </Text>
</Box>
          {/* =================================================
              CARDS
          ================================================= */}

        <SimpleGrid
        dir="ltr"
  cols={{
    base: 1,
    sm: 2,
    lg: 4,
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
    <Box className="glass-card" style={cardStyle}>
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
          <IconChartBar size={32} stroke={1.7} />
        </ThemeIcon>

        <CardArrow />
      </Group>

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
          Violations Statistics
        </Text>

        <Text
          size="sm"
          mt={8}
          lh={1.7}
          style={{
            color: "rgba(30,55,70,0.68)",
          }}
        >
          Analyze violations by areas, statuses, and KPIs.
        </Text>
      </Box>

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
        Open Statistics →
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
    <Box className="glass-card" style={cardStyle}>
      <Box
        style={{
          position: "absolute",
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "rgba(253,126,20,0.18)",
          filter: "blur(48px)",
          top: -85,
          right: -75,
          pointerEvents: "none",
        }}
      />

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
            background: "rgba(253,126,20,0.10)",
            border: "1px solid rgba(253,126,20,0.18)",
            color: "#f76707",
            boxShadow: "0 8px 25px rgba(253,126,20,0.12)",
          }}
        >
          <IconMap size={32} stroke={1.7} />
        </ThemeIcon>

        <CardArrow />
      </Group>

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
          Violations Map
        </Text>

        <Text
          size="sm"
          mt={8}
          lh={1.7}
          style={{
            color: "rgba(30,55,70,0.68)",
          }}
        >
          View violations with filters and heatmap.
        </Text>
      </Box>

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
        Open Map →
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
    <Box className="glass-card" style={cardStyle}>
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
          <IconRoute size={32} stroke={1.7} />
        </ThemeIcon>

        <CardArrow />
      </Group>

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
          Route Notes
        </Text>

        <Text
          size="sm"
          mt={8}
          lh={1.7}
          style={{
            color: "rgba(30,55,70,0.68)",
          }}
        >
          Create and manage route notes easily.
        </Text>
      </Box>

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
        Open Route Notes →
      </Text>
    </Box>
  </Link>

  {/* =================================================
      BIN COLLECTION — TEAL / GREEN
  ================================================= */}

  <Box
    className="glass-card"
    style={{
      ...cardStyle,
      position: "relative",
    }}
  >
    <Box
      style={{
        position: "absolute",
        width: 220,
        height: 220,
        borderRadius: "50%",
        background: "rgba(18,184,134,0.18)",
        filter: "blur(48px)",
        top: -90,
        right: -80,
        pointerEvents: "none",
      }}
    />

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
        <IconTrash size={32} stroke={1.7} />
      </ThemeIcon>

      <CardArrow />
    </Group>

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
        Bin Collection System
      </Text>

      <Text
        size="sm"
        mt={8}
        lh={1.7}
        style={{
          color: "rgba(30,55,70,0.68)",
        }}
      >
        Manage bin locations and collection areas.
      </Text>
    </Box>

    <Group
      mt="auto"
      gap={8}
      wrap="wrap"
      style={{
        position: "relative",
        zIndex: 3,
      }}
    >
      {/* Map */}

      <Badge
  size="md"
  radius="md"
  variant="light"
  color="teal"
  leftSection={<IconMapPin size={14} />}
  onClick={() => openProtectedLink("/binCollection/map")}
  style={{
    cursor: "pointer",
    textTransform: "none",
  }}
>
  Open Map
</Badge>
<Badge
  size="md"
  radius="md"
  variant="light"
  color="cyan"
  leftSection={<IconMap2 size={14} />}
  onClick={() =>
    openProtectedLink("/binCollection/collection-areas/manage")
  }
  style={{
    cursor: "pointer",
    textTransform: "none",
  }}
>
  Areas
</Badge>
      {/* Export */}

    <Badge
  size="md"
  radius="md"
  variant="light"
  color="green"
  leftSection={<IconFileTypeXls size={14} />}
  onClick={() => openProtectedLink("/binCollection/export-bins")}
  style={{
    cursor: "pointer",
    textTransform: "none",
  }}
>
  Saved Collection
</Badge>

      {/* Collection Areas */}

      
    </Group>
  </Box>
</SimpleGrid>
        </Box>
            </Container>

      <Modal
        opened={passwordModalOpened}
        onClose={() => setPasswordModalOpened(false)}
        title="Protected Area"
        centered
        radius="lg"
      >
        <Text size="sm" c="dimmed" mb="md">
          Please enter the password to continue.
        </Text>

        <PasswordInput
          label="Password"
          placeholder="Enter password"
          value={password}
          onChange={(event) => {
            setPassword(event.currentTarget.value);
            setPasswordError("");
          }}
          error={passwordError}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handlePasswordSubmit();
            }
          }}
          autoFocus
        />

        <Group justify="flex-end" mt="xl">
          <Button
            variant="default"
            onClick={() => setPasswordModalOpened(false)}
          >
            Cancel
          </Button>

          <Button
            color="teal"
            onClick={handlePasswordSubmit}
          >
            Continue
          </Button>
        </Group>
      </Modal>

      {/* =====================================================
          HOVER
      ===================================================== */}

      

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

        .glass-card .mantine-Badge-root {
          transition:
            transform 160ms ease,
            box-shadow 160ms ease;
        }

        .glass-card .mantine-Badge-root:hover {
          transform: translateY(-2px);
          box-shadow:
            0 6px 18px rgba(40,70,90,0.12);
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

  /* Header spacing on mobile */
  .ops-header {
    margin-top: 100px !important;
  }
}

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

          .glass-card .mantine-Badge-root {
            transition: none !important;
          }
        }
           `}</style>
    </Box>
  );
}