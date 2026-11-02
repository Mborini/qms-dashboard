"use client";

import {
  Anchor,
  Box,
  Button,
  Center,
  Container,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";

import {
  IconAlertCircle,
  IconArrowRight,
  IconLock,
  IconUser,
} from "@tabler/icons-react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import { bungee } from "./layout";

/* =========================================================
   DESIGN TOKENS  (Navy + Champagne Gold)
========================================================= */

const INK = "#1A2A4A";
const PAGE = "#182646";
const GOLD = "#C9A66B";
const GOLD_LIGHT = "#E6CF9D";
const DANGER = "#FF8787";
const TEXT = "#F3F6FC";
const MUTED = "rgba(240,244,252,.72)";
const FAINT = "rgba(240,244,252,.5)";
const LINE = "rgba(255,255,255,.12)";

const FONT =
  '"IBM Plex Sans Arabic", "Cairo", "Tajawal", "Segoe UI", system-ui, sans-serif';

const hexA = (hex: string, a: number) =>
  `${hex}${Math.round(a * 255)
    .toString(16)
    .padStart(2, "0")}`;

const inputStyles = {
  label: {
    color: MUTED,
    fontWeight: 600,
    fontSize: 12,
    marginBottom: 6,
    fontFamily: FONT,
  },
  input: {
    height: 46,
    color: TEXT,
    fontFamily: FONT,
    background: "rgba(255,255,255,.06)",
    border: `1px solid ${LINE}`,
  },
  section: {
    color: GOLD_LIGHT,
  },
  visibilityToggle: {
    color: MUTED,
  },
};

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    setError("");

    if (!username.trim() || !password.trim()) {
      setError("يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }

    try {
      setLoading(true);

      const result = await signIn("credentials", {
        username: username.trim(),
        password,
        redirect: false,
      });

      if (!result) {
        setError("حدث خطأ أثناء تسجيل الدخول");
        return;
      }

      if (result.error) {
        setError("اسم المستخدم أو كلمة المرور غير صحيحة");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);

      setError("حدث خطأ أثناء تسجيل الدخول، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      {/* BACKGROUND GLOW */}

      <Box
        style={{
          position: "fixed",
          width: 520,
          height: 520,
          borderRadius: "50%",
          background: hexA(GOLD, 0.16),
          filter: "blur(120px)",
          top: -200,
          right: -160,
          pointerEvents: "none",
        }}
      />

      <Box
        style={{
          position: "fixed",
          width: 480,
          height: 480,
          borderRadius: "50%",
          background: "rgba(74,120,220,.22)",
          filter: "blur(120px)",
          bottom: -200,
          left: -160,
          pointerEvents: "none",
        }}
      />

      <Container
        size={460}
        px="md"
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
        }}
      >
        <Center mih="100vh">
          {/* LOGIN CARD */}

          <Paper className="login-card" radius={26} p={{ base: 28, sm: 40 }}>
            <Stack gap={28}>
              {/* LOGO */}

              <Box style={{ textAlign: "center" }}>
                <Box
                  dir="ltr"
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Text
                    component="span"
                    className={`${bungee.className} matrix-title`}
                  >
                    Matrix
                  </Text>

                  <Text component="span" className="ops-title">
                    Ops
                  </Text>
                </Box>

                <Text className="ops-subtitle">Operations Intelligence</Text>
              </Box>

              {/* WELCOME */}

              <Stack align="center" gap={5}>
                <Text fw={700} c={TEXT} style={{ fontSize: 20 }}>
                  Welcome Back
                </Text>

                <Text size="sm" c={MUTED} ta="center">
                  Sign in to access your operations dashboard
                </Text>
              </Stack>

              {/* ERROR */}

              {error && (
                <Box
                  style={{
                    padding: "12px 14px",
                    borderRadius: 16,
                    background: hexA(DANGER, 0.08),
                    border: `1px solid ${hexA(DANGER, 0.45)}`,
                  }}
                >
                  <Group justify="center" gap={8} wrap="nowrap">
                    <IconAlertCircle size={16} color={DANGER} />

                    <Text size="sm" c={DANGER} ta="center" fw={600}>
                      {error}
                    </Text>
                  </Group>
                </Box>
              )}

              {/* FORM */}

              <form onSubmit={handleSubmit}>
                <Stack gap="md">
                  <TextInput
                    label="Username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(event) => setUsername(event.currentTarget.value)}
                    leftSection={<IconUser size={18} stroke={1.7} />}
                    size="md"
                    radius="xl"
                    autoComplete="username"
                    disabled={loading}
                    styles={inputStyles}
                    classNames={{ input: "login-input" }}
                  />

                  <PasswordInput
                    label="Password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.currentTarget.value)}
                    leftSection={<IconLock size={18} stroke={1.7} />}
                    size="md"
                    radius="xl"
                    autoComplete="current-password"
                    disabled={loading}
                    styles={inputStyles}
                    classNames={{ input: "login-input" }}
                  />

                  <Group justify="flex-end" mt={-4}>
                    <Anchor
                      href="/forgot-password"
                      size="sm"
                      fw={500}
                      c={GOLD_LIGHT}
                      underline="hover"
                    >
                      Forgot password?
                    </Anchor>
                  </Group>

                  <Button
                    type="submit"
                    size="md"
                    radius="xl"
                    fullWidth
                    loading={loading}
                    rightSection={
                      !loading && <IconArrowRight size={19} stroke={2} />
                    }
                    mt={4}
                    style={{
                      height: 46,
                      border: "none",
                      fontWeight: 700,
                      fontFamily: FONT,
                      color: INK,
                      background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})`,
                      boxShadow: `0 10px 22px -12px ${hexA(GOLD, 0.8)}`,
                    }}
                  >
                    Sign In
                  </Button>
                </Stack>
              </form>

              {/* FOOTER */}

              <Stack
                align="center"
                gap={4}
                pt="md"
                style={{ borderTop: `1px solid ${LINE}` }}
              >
                <Text size="xs" c={MUTED} ta="center">
                  Secure Operations Management System
                </Text>

                <Text size="xs" c={FAINT}>
                  © {new Date().getFullYear()} Ops Matrix
                </Text>
              </Stack>
            </Stack>
          </Paper>
        </Center>
      </Container>

      <style jsx global>{`
        html,
        body {
          margin: 0;
          padding: 0;
          min-height: 100%;
        }

        body {
          background: ${PAGE};
        }

        .login-page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: ${FONT};
          background: ${PAGE};
        }

        /* GLASS CARD */

        .login-card {
          width: 100%;
          position: relative;
          overflow: hidden;
          color: ${TEXT};
          background: linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.08),
            rgba(255, 255, 255, 0.03)
          );
          -webkit-backdrop-filter: blur(14px);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.18),
            0 30px 60px -30px rgba(10, 20, 45, 0.6);
        }

        /* LOGO */

        .ops-title {
          font-family: Inter, sans-serif;
          font-size: clamp(34px, 5vw, 48px);
          font-weight: 600;
          letter-spacing: -2px;
          color: ${TEXT};
          line-height: 1;
        }

        .matrix-title {
          font-size: clamp(34px, 4.5vw, 46px);
          line-height: 1;
          background: linear-gradient(
            110deg,
            #1864ab 0%,
            #228be6 40%,
            #15aabf 75%,
            #12b886 100%
          );
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
          letter-spacing: 0;
        }

        .ops-subtitle {
          margin-top: 14px;
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2.4px;
          text-transform: uppercase;
          color: ${hexA(GOLD_LIGHT, 0.75)};
        }

        /* INPUTS */

        .login-input {
          transition:
            border-color 150ms ease,
            box-shadow 150ms ease,
            background 150ms ease;
        }

        .login-input::placeholder {
          color: ${FAINT};
        }

        .login-input:focus {
          border-color: ${hexA(GOLD, 0.7)} !important;
          background: rgba(255, 255, 255, 0.09) !important;
          box-shadow: 0 0 0 3px ${hexA(GOLD, 0.15)};
        }

        /* Autofill ما يخرب اللون */
        .login-input:-webkit-autofill {
          -webkit-text-fill-color: ${TEXT};
          -webkit-box-shadow: 0 0 0 1000px #213459 inset;
          caret-color: ${TEXT};
        }

        @media (max-width: 576px) {
          .login-page {
            padding: 16px;
          }

          .login-card {
            padding: 26px 20px;
          }

          .ops-title,
          .matrix-title {
            font-size: 34px;
          }

          .ops-subtitle {
            font-size: 9px;
            letter-spacing: 1.8px;
          }
        }
      `}</style>
    </main>
  );
}